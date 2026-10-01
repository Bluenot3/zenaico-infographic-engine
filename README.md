# Zenaico Visual Studio plugin

<img src="plugins/zenaico/assets/zen-brand-logo.jpg" alt="ZEN AI Co. logo" width="160">

The original ZEN AI Co. infographic engine, packaged as a Codex plugin with
advanced visual styles, concepts, rendering, editing, review, sports graphics,
screenshots and a persistent artifact library.

## Install from the public marketplace

Requires Node.js 22.12 or newer and a configured Gemini or OpenAI API key.
Anyone can install the public Git marketplace without building the app:

```bash
codex plugin marketplace add Bluenot3/zenaico-infographic-engine --ref plugin-dist
codex plugin add zenaico@zenaico
```

The plugin appears in the options from your configured ZEN AI Co. marketplace.
Start a new Codex session after installation. To upgrade, run
`codex plugin marketplace upgrade zenaico` and reinstall `zenaico@zenaico`.

## Install the release ZIP

Download the ZIP from the [public releases page](https://github.com/Bluenot3/zenaico-infographic-engine/releases/latest).

1. Extract the ZIP. It contains a `zenaico-plugin` directory with a marketplace
   and a ready-to-run plugin. Node.js 22.12 or newer is required; you do not need
   to install npm dependencies for the packaged plugin.
2. Set `GEMINI_API_KEY` and/or `OPENAI_API_KEY` in the environment that launches
   Codex. These are your provider API keys; model usage is billed by the provider.
   Alternatively, create a private environment file from `.env.example` and set
   `ZENAICO_ENV_FILE` to its absolute path before launching Codex. Keep this file
   outside the plugin directory so cached upgrades do not overwrite it.
3. Set `ZENAICO_OUTPUT_DIR` to an absolute directory for your visual library.
   By default the plugin uses `PLUGIN_DATA/zenaico-output` when the host supplies
   plugin data storage, otherwise `zenaico-output` in the process working directory.
4. Install from the extracted marketplace:

   ```bash
   codex plugin marketplace add /absolute/path/to/zenaico-plugin
   codex plugin add zenaico@zenaico
   ```

Start a new Codex session and ask: “Use Zenaico to turn this article into four
striking infographics.” The plugin checks its configuration and uses the studio
engine to produce actual image files.

## Capabilities

- The app's complete style library and cross-domain harmonizer.
- Source-grounded concepts from topics, pasted articles, TXT/Markdown/CSV/JSON
  files and public HTTPS article URLs. Extract PDF/Office text with the host first.
- Advanced audience, tone, palette, layout, language, typography, lighting,
  render aesthetic, narrative path and complexity controls; up to four blended styles.
- Gemini image rendering at a requested 1K/2K/4K resolution or OpenAI high-quality
  rendering with model-appropriate sizes. Returned metadata records actual pixels.
- Source-image editing, enhancement, same-size PNG masks, visual critique and
  text detection with normalized bounding boxes.
- Dated college football/NFL scoreboards with source URLs and balanced sports concepts.
- Website/local-app screenshots when Chrome/Chromium is installed; set
  `ZENAICO_CHROME_PATH` if it is not found automatically.
- Persistent image files, prompts, source references, model provenance and edit ancestry.
- Background generation and editing with progress polling and cancellation, so long
  high-resolution renders do not depend on a single MCP request staying open.
- Offline HTML collections with embedded images and browser print-to-PDF support.

Model names follow the original app defaults and can be overridden per request
or with `ZENAICO_IMAGE_MODEL` / `ZENAICO_TEXT_MODEL`. Availability depends on your
provider account. Fallback is disabled by default and is reported when explicitly
enabled. A style mentioning “8K” describes visual direction, not verified resolution.

OpenAI PNG masks use transparent pixels to mark the edit area. Gemini masks are
provided as image guidance rather than guaranteed pixel-exact inpainting.

Image tools start background jobs by default. Poll `get_job` with `waitMs: 15000`
until the job finishes. At most two jobs can run at once. Job status belongs to the
server session; completed images persist in the library after a server restart.
Clients with a sufficiently long tool timeout may set `background: false` to wait
for a direct result.

The server respects the host's `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` and
`NO_PROXY` settings for provider and scoreboard calls. Article retrieval also
respects proxy settings while rejecting private destination URLs.

## Other MCP clients

The standalone server also works with clients supporting local MCP over stdio:

```json
{
  "mcpServers": {
    "zenaico": {
      "command": "node",
      "args": ["/absolute/path/to/plugins/zenaico/server.mjs"],
      "env": { "ZENAICO_ENV_FILE": "/absolute/path/to/private/zenaico.env" }
    }
  }
}
```

For local Streamable HTTP testing, run `node server.mjs --http`. It listens at
`http://127.0.0.1:3333/mcp`; configure `ZENAICO_MCP_TOKEN` for bearer authentication.
Binding to a non-loopback interface requires a token. This is a single-user service;
a listing in the universal ChatGPT/Codex Plugins Directory requires a production
HTTPS endpoint, user isolation, verified publisher, and OpenAI review and publication.
The public Git marketplace and ZIP work in Codex. They do not establish directory
approval. [Submission preparation](https://github.com/Bluenot3/zenaico-infographic-engine/blob/main/docs/plugin-submission.md) records the remaining requirements.
