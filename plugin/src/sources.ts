import { lookup } from 'node:dns/promises';
import { Agent, ProxyAgent, fetch as networkFetch } from 'undici';
import { getProxyForUrl } from 'proxy-from-env';
import { readFile, stat } from 'node:fs/promises';
import { isAbsolute, extname } from 'node:path';
import ipaddr from 'ipaddr.js';
import type { Source } from './schemas';

export function isPublicAddress(address: string): boolean {
  try { return ipaddr.process(address).range() === 'unicast'; } catch { return false; }
}
export async function validatePublicURL(value: string) {
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.username || url.password || (url.port && url.port !== '443')) throw new Error('Use a public HTTPS URL on the standard port without embedded credentials.');
  const addresses = await lookup(url.hostname.replace(/^\[|\]$/g, ''), { all: true });
  if (!addresses.length || addresses.some(a => !isPublicAddress(a.address))) throw new Error('Private, loopback, link-local, and reserved network destinations are not supported.');
  return { url, addresses };
}
export async function fetchArticle(value: string, redirects = 0, signal?: AbortSignal): Promise<string> {
  if (redirects > 3) throw new Error('Article URL redirected too many times.');
  const { url, addresses } = await validatePublicURL(value);
  const address = addresses.find(a => a.family === 4) || addresses[0];
  const proxy = getProxyForUrl(url.href);
  // Direct connections pin the checked IP. Explicit proxy settings use the proxy's DNS.
  const dispatcher = proxy ? new ProxyAgent(proxy) : new Agent({ connect: {
    lookup: (_hostname, options, callback) => {
      if (typeof options === 'object' && options.all) callback(null, [address]);
      else callback(null, address.address, address.family);
    },
  } });
  let result: { body?: string; redirect?: string; type?: string };
  try {
    const timeout = AbortSignal.timeout(20000);
    const response = await networkFetch(url.href, { dispatcher, redirect: 'manual',
      signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
      headers: { 'user-agent': 'Zenaico-Infographic-Plugin/1.0', accept: 'text/html,text/plain,application/json' } });
    if (response.status >= 300 && response.status < 400 && response.headers.get('location')) {
      await response.body?.cancel(); result = { redirect: new URL(response.headers.get('location')!, url).href };
    } else {
      if (!response.ok) { await response.body?.cancel(); throw new Error(`Article request failed with HTTP ${response.status}.`); }
      const type = response.headers.get('content-type') || '';
      if (!/^text\/(html|plain)|^application\/(json|xhtml\+xml)/i.test(type)) {
        await response.body?.cancel(); throw new Error('URL must return HTML, plain text, or JSON. Extract PDF/document text before using the plugin.');
      }
      const chunks: Buffer[] = [];
      let bytes = 0;
      for await (const chunk of response.body!) {
        bytes += chunk.length;
        if (bytes > 2 * 1024 * 1024) throw new Error('Article response exceeds 2 MB.');
        chunks.push(Buffer.from(chunk));
      }
      result = { body: Buffer.concat(chunks).toString('utf8'), type };
    }
  } finally { await dispatcher.close(); }
  if (result.redirect) return fetchArticle(result.redirect, redirects + 1, signal);
  let text = result.body || '';
  if (result.type?.includes('html')) text = text
    .replace(/<(script|style|nav|noscript)\b[^>]*>[\s\S]*?<\/\1>/gi, '')
    .replace(/<!--[^]*?-->/g, '').replace(/<\/(p|h[1-6]|div|li|section|article)>/gi, '\n')
    .replace(/<br\s*\/?\s*>/gi, '\n').replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
  text = text.replace(/[ \t]+/g, ' ').replace(/\n\s*\n/g, '\n\n').trim();
  if (text.length > 200000) throw new Error('Article text exceeds 200,000 characters. Select a shorter excerpt.');
  if (!text) throw new Error('No article text could be extracted. Paste the article text for pages requiring JavaScript or login.');
  return text;
}
export async function loadSource(source: Source, signal?: AbortSignal): Promise<string> {
  if (source.type === 'url') return fetchArticle(source.value, 0, signal);
  if (source.type !== 'file') return source.value;
  if (!isAbsolute(source.value)) throw new Error('Source file must use an absolute path.');
  if (!['.txt', '.md', '.markdown', '.csv', '.json'].includes(extname(source.value).toLowerCase())) throw new Error('Supported source files: TXT, Markdown, CSV, and JSON. Extract text from PDF, Office documents, and images first.');
  const info = await stat(source.value);
  if (!info.isFile() || info.size > 800000) throw new Error('Source must be a regular text file smaller than 800 KB.');
  const content = await readFile(source.value, 'utf8');
  if (!content.trim() || content.includes('\u0000') || content.length > 200000) throw new Error('Source must contain nonempty UTF-8 text shorter than 200,000 characters.');
  return content;
}
