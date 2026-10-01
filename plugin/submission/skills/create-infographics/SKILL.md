---
name: create-infographics
description: Create and refine high-quality infographics, technical diagrams, posters, editorial visuals and visual collections with the original ZEN AI Co. studio engine. Use for source-grounded visual creation, rich visual styles, advanced design direction and image review.
---

Use the bundled executable `scripts/zenaico.mjs` to create actual image files.
It includes the original studio prompt engine and provider adapters. It needs
Node.js 22.12+, command execution, network access to the selected AI provider,
and that user's privately configured Gemini or OpenAI API key.

Resolve the executable's absolute path relative to this skill. Run:

```bash
node /absolute/path/to/skill/scripts/zenaico.mjs get_status
node /absolute/path/to/skill/scripts/zenaico.mjs commands
```

`commands` returns the command names and JSON input schemas. Write request
arguments to a temporary JSON file using the host's file tools, then run:

```bash
node /absolute/path/to/skill/scripts/zenaico.mjs generate_infographics --input /absolute/path/to/request.json
```

Use file arguments rather than interpolating user content into shell commands.
The executable prints JSON with artifact paths, actual pixels, model provenance
and errors. Each image command waits for its complete result. For long renders,
use the host's execution session and poll that session until it finishes; do not
terminate a render merely because the initial execution call yields. Cancel the
execution session if the user requests cancellation. A provider may bill work
already accepted before cancellation.

1. Check `get_status`. Choose a configured provider. Credentials belong in the
   user's private environment or a private file selected by `ZENAICO_ENV_FILE`.
   Never request keys in chat, print them, or put them in request JSON. If none
   are configured, use the host's trusted credential setup where available,
   prepare the source and prompt preview, and identify the configuration needed
   before rendering. Never claim a generated image when the provider is unavailable.
2. Keep a consistent private `ZENAICO_OUTPUT_DIR` across invocations, preferably
   a library directory in the user's workspace. Set it through the host's trusted
   environment configuration. The default is `PLUGIN_DATA/zenaico-output`, or
   `zenaico-output` in the command's working directory. Do not clear another session's library.
3. Resolve source content: complete pasted text, a supported UTF-8 text,
   Markdown, CSV or JSON file, a public HTTPS article URL, or a topic. Extract
   PDF/Office text with host tools first. Keep supplied figures and labels exact.
4. Run `list_styles`; choose a fitting preset or blend up to four. Use the
   audience, language, tone, palette, aspect ratio, typography, layout, lighting,
   narrative path, complexity and render aesthetic requested by the user.
   Cross-domain fusion should preserve authentic subjects rather than morph them.
5. For a complete brief, run `generate_infographics` with the requested count
   of one to four. For concept exploration, use `plan_infographics`, then
   `render_infographic`. For posters and other visuals, render a custom concept.
   Proceed when creation is authorized and avoid generating extra paid variants.
6. View the returned image files with the host's image viewer. Use `review_image`
   against the source to inspect factual fidelity, labels, legibility and
   composition. Use `detect_text` where needed. Vision review is approximate;
   do not treat it as independent verification of external facts.
7. Refine with `edit_image` or `enhance_image`. These commands use the actual
   source image and save a new version. OpenAI PNG masks mark editable areas
   with full transparency and must match the original image dimensions.
8. Deliver the full-resolution files and supported previews. `export_collection`
   creates an offline HTML collection printable to PDF. `list_artifacts` resumes
   previous work in the same library.

Keep fallback disabled unless the user accepts an alternative model. Report
actual returned dimensions and model names; a preset saying 8K is an aesthetic
direction. Preserve completed images from a partial batch and identify failed or
unattempted images. Never invent metrics, citations or editable vector output.

`capture_page` can capture a real page when Chrome/Chromium is installed; edit
that actual screenshot for a campaign visual. Set `allowLocalhost` only for an
explicitly supplied local app. The executable runs in the user's own workspace,
opens no public endpoint and requires no external MCP connection.
