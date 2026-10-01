# Zenaico Infographic Engine

The existing React visual studio and an installable **Zenaico Visual Studio Codex
plugin** share the original style presets, domain harmonizer and visual prompts.

The plugin exposes infographic planning and rendering, source-image editing,
enhancement, visual critique, text detection, sports scoreboards, screenshot capture,
design chat and a persistent visual library through MCP. It includes two focused
skills and a publicly installable Codex marketplace.

## Install the public plugin

<img src="public/zen-brand-logo.jpg" alt="ZEN AI Co. logo" width="160">

Download the standalone ZIP from [Releases](https://github.com/Bluenot3/zenaico-infographic-engine/releases/latest),
or install the public marketplace:

```bash
codex plugin marketplace add Bluenot3/zenaico-infographic-engine --ref plugin-dist
codex plugin add zenaico@zenaico
```

Requires Node.js 22.12+ and your Gemini or OpenAI API key. The packaged server
includes its runtime dependencies. Start a new Codex session after installation.
The plugin appears in the options from the configured ZEN AI Co. marketplace.

Publication to the universal ChatGPT/Codex Plugins Directory is a separate hosted
service and review process. See [directory submission status](docs/plugin-submission.md).

## Build and install from source

Requires Node.js 22.12 or newer.

```bash
npm ci
npm run pack:plugin
codex plugin marketplace add /absolute/path/to/zenaico-infographic-engine
codex plugin add zenaico@zenaico
```

`npm run pack:plugin` creates `release/zenaico-plugin-1.0.2.zip`. Its standalone
server includes runtime dependencies, so recipients need Node.js but do not need
an npm installation step. Configure `GEMINI_API_KEY` and/or `OPENAI_API_KEY` in the
environment launching Codex, or point `ZENAICO_ENV_FILE` at a private file based on
[.env.example](.env.example). Set `ZENAICO_OUTPUT_DIR` to an absolute library path.

Start a new Codex session and ask it to use Zenaico. The plugin supports local stdio
and optional authenticated Streamable HTTP. See the [plugin installation guide](plugins/zenaico/README.md).

## Run the original app

```bash
npm run dev
```

The studio remains available at `http://localhost:3000`. Configure its providers
in Studio Settings. Its visual creation prompts and sports composition are shared
with the plugin; the plugin adds a server-side provider layer and saved files.

## Development and verification

```bash
npm run lint
npm run build
npm run test:plugin
npm run build:plugin
npm run start:plugin
# Optional local HTTP endpoint:
npm run start:plugin:http
```

The tests exercise provider requests, image editing and review, source handling,
artifact persistence, failure reporting, MCP tools/resources and standalone transport.
They use deterministic fixtures and do not incur provider charges. Live image quality
must additionally be checked with valid provider credentials.

Source layout:

- `services/infographicPrompts.ts` / `services/sportsPrompts.ts`: visual direction
  shared with the app.
- `plugin/src/`: provider adapters, artifact storage, source ingestion, MCP tools
  and stdio/HTTP entry point.
- `plugins/zenaico/`: portable manifest, compatibility manifest, skills, assets
  and the generated standalone bundle.
- `.agents/plugins/marketplace.json`: marketplace registration (bundled in the public distribution).
- `scripts/`: reproducible bundle and release ZIP generation.

## Practical limits

The plugin returns raster image files, not editable vector diagrams. It records
actual output dimensions and does not silently switch image models. Website extraction
supports public HTML/text pages; pages requiring login or JavaScript need pasted text.
Screenshots require a separately installed Chrome/Chromium. Sports results come from
dated scoreboards and may lack detailed rosters or uniform information; absent fields
are not fabricated. The local HTTP server is for a single user. Universal directory publication
requires a production service with user isolation and OpenAI approval.

On a verified main-branch build, GitHub Actions publishes the standalone
`plugin-dist` marketplace and a release ZIP with SHA-256 checksum. Public versions
are immutable; bump the version before publishing a new release.
