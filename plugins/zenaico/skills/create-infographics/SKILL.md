---
name: create-infographics
description: Create impressive infographics, technical diagrams, posters, data visuals, editorial graphics and visual collections with Zenaico's original studio engine. Use for source-grounded visual creation, detailed style direction, multiple variations, image review, and refinements.
---

Use Zenaico's MCP tools to produce actual image files, not just design descriptions.

1. Call `get_status`. Choose an available provider. Credentials belong in the server
   environment or `ZENAICO_ENV_FILE`; never request keys in chat or pass them as tool arguments.
   If no provider is configured, prepare source content and a prompt preview, and explain the
   one-time configuration needed before rendering. Do not claim that an image was generated.
2. Resolve the user's source. Use full article text, a supported absolute text-file path,
   a public HTTPS article URL, or a topic. Extract PDF/Office document text with host tools
   before passing it to Zenaico. A filename or URL alone is not article content.
3. Call `list_styles` and choose a fitting preset or blend up to four presets. Preserve the
   original library's rich visual direction. Cross-domain styles translate the aesthetic
   while keeping authentic subject matter and avoiding morphing artifacts.
4. Use the user's audience, tone, language, palette, aspect ratio, typography, layout,
   lighting, narrative path, complexity and render aesthetic. Use concise, readable text
   and meaningful detail. Include provided numbers and labels verbatim in `dataEntries`.
   For posters or other graphics, use `render_infographic` with a custom concept brief.
5. For a completed brief, call `generate_infographics` with the requested count (1–4).
   For a design exploration, call `plan_infographics`, then render the selected concepts
   with `render_infographic`. Do not introduce an approval pause when creation is already
   authorized. Do not silently generate more paid images than requested.
   Image tools return background jobs by default. Poll `get_job` with `waitMs: 15000`
   until `completed`, `partial`, `failed`, or `cancelled`; never stop at reporting that
   a job started. Deliver completed artifacts and report failures. At most two image
   jobs run at once. Use `cancel_job` when the user requests cancellation. For a client
   with a long tool timeout, `background: false` can return image results directly.
6. Inspect the returned images using host image-viewing tools or `get_artifact` with
   `includeImage: true`. Use `review_image` with the expected source content to check labels,
   spelling, chart integrity, contrast and composition. Vision review is approximate and
   does not independently verify external facts. Do not label work verified solely because
   a model found no issues.
7. Use `edit_image` for necessary corrections or `enhance_image` for detail and legibility.
   These tools send the actual original image and save a new version. OpenAI masks use
   fully transparent edit areas and must match the source dimensions.
8. Deliver the full-resolution image file paths or host-supported previews. For multiple
   images, `export_collection` produces an offline HTML gallery that can print to PDF.
   Use `list_artifacts` to resume a previous session.

Report actual returned pixel dimensions and model names. Keep fallback disabled unless
the user permits an alternative model. If a batch is partial, deliver completed files and
state the failed or unattempted count. Never invent statistics, citations, scores or editable
vector output. Presets mentioning 8K describe an aesthetic; they do not establish output size.

For screenshots, use `capture_page` (Chrome/Chromium required), then `edit_image` with an
instruction to preserve the real UI while creating a campaign visual. Enable `allowLocalhost`
only for an explicitly supplied local app URL.
