# Zenaico Visual Studio: executable skills

<img src="assets/zen-brand-logo.jpg" alt="ZEN AI Co. logo" width="160">

This package includes the original infographic engine as self-contained
executables inside two skills. It creates, edits and reviews actual images;
it is suitable for the plugin portal's **Skills only** submission path and
requires no hosted MCP endpoint. It has not received directory approval.

Each user's workspace needs Node.js 22.12+, command execution and network access.
Set `GEMINI_API_KEY` and/or `OPENAI_API_KEY` through private environment settings,
or select a private environment file with `ZENAICO_ENV_FILE`. Never paste keys
in chat. Provider usage is billed to the configured provider account. Set
`ZENAICO_OUTPUT_DIR` to a private library path that persists across invocations.
Screenshots additionally require Chrome/Chromium. No npm installation is needed.

The two skills cover infographic/design production and balanced sports graphics.
Each skill includes `scripts/zenaico.mjs` with the same engine. Inspect its command
schemas with `node scripts/zenaico.mjs commands`, relative to the skill directory.
Write request arguments to a JSON file, then pass `--input /absolute/path/request.json`.
Long image calls finish in that execution process; use the host's session waiting
and cancellation tools. Completed images and provenance remain in the library.

Inputs and requested images go to the selected Google or OpenAI provider. Public
article retrieval accesses the supplied URL; sports retrieval accesses ESPN;
screenshots access the supplied website. Artifacts, prompts, source references
and edit history are written to the user's configured workspace. Retention
and isolation also depend on the execution host. There is no shared ZEN AI Co. service or cross-user image library.

Upload this ZIP using **Skills only** at <https://platform.openai.com/plugins>,
select a verified publisher, complete review materials and submit for review.
Publish after OpenAI approval to appear in the universal ChatGPT/Codex directory.
Listing details and review scenarios are in the repository's
[submission guide](https://github.com/Bluenot3/zenaico-infographic-engine/blob/main/docs/plugin-submission.md).
