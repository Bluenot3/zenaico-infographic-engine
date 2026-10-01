import { EnvHttpProxyAgent, setGlobalDispatcher } from 'undici';

/** Support provider APIs and scoreboards in Codex environments that require a proxy. */
export function configureNetwork() {
  if (process.env.HTTPS_PROXY || process.env.https_proxy || process.env.HTTP_PROXY || process.env.http_proxy || process.env.ALL_PROXY || process.env.all_proxy) {
    setGlobalDispatcher(new EnvHttpProxyAgent({
      httpProxy: process.env.HTTP_PROXY || process.env.http_proxy || process.env.ALL_PROXY || process.env.all_proxy,
      httpsProxy: process.env.HTTPS_PROXY || process.env.https_proxy || process.env.ALL_PROXY || process.env.all_proxy,
    }));
  }
}
