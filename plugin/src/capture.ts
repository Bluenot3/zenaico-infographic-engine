import puppeteer from 'puppeteer-core';
import { existsSync } from 'node:fs';
import { ArtifactStore, type Artifact } from './store';
import { validatePublicURL } from './sources';

export function chromePath() {
  return process.env.ZENAICO_CHROME_PATH || ['/usr/bin/chromium', '/usr/bin/google-chrome', '/usr/bin/chromium-browser',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    `${process.env.PROGRAMFILES || 'C:/Program Files'}/Google/Chrome/Application/chrome.exe`].find(existsSync);
}
export async function capturePage(store: ArtifactStore, input: { url: string; count?: number; allowLocalhost?: boolean }, signal?: AbortSignal) {
  const url = new URL(input.url);
  const local = input.allowLocalhost && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  if (local) {
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new Error('Local captures require an HTTP(S) localhost URL without credentials.');
  } else await validatePublicURL(input.url);
  const executablePath = chromePath();
  if (!executablePath) throw new Error('Chrome/Chromium is required for capture_page. Install it or set ZENAICO_CHROME_PATH to its executable.');
  const browser = await puppeteer.launch({ executablePath, headless: true,
    args: ['--disable-dev-shm-usage', ...(process.env.ZENAICO_BROWSER_NO_SANDBOX === 'true' ? ['--no-sandbox', '--disable-setuid-sandbox'] : [])] });
  const abort = () => { void browser.close().catch(() => {}); };
  signal?.addEventListener('abort', abort, { once: true });
  const artifacts: Artifact[] = [];
  try {
    signal?.throwIfAborted();
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setRequestInterception(true);
    page.on('request', request => {
      void (async () => {
        try {
          const destination = new URL(request.url());
          if (['data:', 'blob:', 'about:'].includes(destination.protocol)) { await request.continue(); return; }
          if (local && ['http:', 'https:'].includes(destination.protocol) && destination.origin === url.origin) { await request.continue(); return; }
          await validatePublicURL(request.url());
          await request.continue();
        } catch { if (!request.isInterceptResolutionHandled()) await request.abort().catch(() => {}); }
      })();
    });
    const response = await page.goto(input.url, { waitUntil: 'networkidle2', timeout: 30000 });
    if (!response || response.status() >= 400) throw new Error(`Page capture failed with HTTP ${response?.status() || 'no response'}.`);
    const title = await page.title();
    for (let index = 0; index < (input.count || 1); index++) {
      signal?.throwIfAborted();
      await page.evaluate((offset: number) => window.scrollTo(0, offset), index * 1080);
      const data = Buffer.from(await page.screenshot({ type: 'png' }));
      artifacts.push(await store.save({ data, mimeType: 'image/png', provider: 'browser', model: await browser.version(),
        requestedModel: 'Chromium screenshot', warnings: [], requestedResolution: '1920x1080' },
      { title: `${title || url.hostname} — screenshot ${index + 1}`, prompt: `Screenshot of ${input.url} at vertical offset ${index * 1080}.`, source: { type: 'url', value: input.url } }));
    }
    return { artifacts, url: input.url };
  } finally { signal?.removeEventListener('abort', abort); await browser.close(); }
}
