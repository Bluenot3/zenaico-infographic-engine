# Zenaico public directory submission

Zenaico Visual Studio is publicly installable from the Git marketplace and release
ZIP. **It has not been submitted to or approved for the universal Plugins Directory.**
That directory is shared by ChatGPT and Codex. Adding the public Git marketplace
shows the plugin in that user's configured marketplace options; it does not list
the plugin for all directory users automatically.

## Prepared listing

- Publication name: **Zenaico Visual Studio**
- Package name: `zenaico`; version: `1.0.1`
- Publisher: **ZEN AI Co.** (the verified Platform identity must match)
- Category: **Design**
- Short description: **Infographics & visual design**
- Logo: [the supplied original JPEG](../public/zen-brand-logo.jpg), 1254 × 1254;
  the packaged icon and listing logo use the same image without alteration.
- Website: <https://github.com/Bluenot3/zenaico-infographic-engine>
- Support: <https://github.com/Bluenot3/zenaico-infographic-engine/issues>
- Skills: [create infographics](../plugins/zenaico/skills/create-infographics/SKILL.md)
  and [sports graphics](../plugins/zenaico/skills/sports-graphics/SKILL.md)

Long description:

> Create polished infographics and visual collections with the ZEN AI Co. studio
> engine. Turn articles and supplied data into source-grounded concepts, blend
> advanced visual styles, render high-quality images, refine existing graphics,
> review readability and factual fidelity, and build balanced sports visuals
> from dated scoreboards. Saved images retain their actual pixel dimensions,
> prompts and model provenance. The public Codex package runs locally with your
> Gemini or OpenAI API key; provider usage is billed by the provider.

Starter prompts:

1. Turn this article into four striking infographics using Zenaico.
2. Create a detailed technical infographic with Zenaico's cross-domain styles.
3. Review and refine this graphic, then export a visual collection.

## Required before submitting the full engine

Submit through **With MCP** in the [OpenAI plugin submission portal](https://platform.openai.com/plugins).
The engine depends on an MCP server; submitting its skills alone would not provide
the app's generation and editing capabilities.

The current HTTP mode is a single-user service. Before public hosting, it needs
user authentication and separate artifact libraries and job registries per user,
with server-local file access and localhost capture restricted. The publisher
also needs to choose how paid image generation is funded and limited. A shared
bearer token and shared library are not a multi-user production deployment.

The remaining inputs and work are:

1. A verified ZEN AI Co. publisher in an OpenAI Platform organization, with
   **Apps Management: Write** access for the submitter.
2. A production hosting account and stable HTTPS domain for the MCP endpoint,
   authentication configuration, persistent storage and provider credentials
   supplied through the host's private secret settings.
3. Publisher-approved public privacy and terms URLs for that hosted service.
   The local package stores images, source content and prompts on the user's
   computer and sends requested content to the selected AI provider; a hosted
   service must additionally disclose its storage, retention and account handling.
4. A working reviewer account, live image-generation validation and a recording
   of the principal workflows. Record the exact tool annotation justifications
   in the portal after scanning the deployed endpoint.
5. The portal's domain-verification token, successful tool scan, country
   availability and accurate policy attestations, followed by submission.
6. After OpenAI approval, select **Publish** in the portal and verify the exact
   publication name and directory URL.

No production endpoint, verification token, verified identity, demo credentials,
privacy/terms commitments or approval have been invented for this package.

## Reviewer test cases

These are prepared review scenarios. Paid model runs and multi-user checks must
be completed on the production endpoint before submission.

Use this explicitly fictional fixture where a source is needed:

> Fictional review dataset: North Depot processed 1,200 orders in April and 1,500
> in May. On-time delivery was 92% in April and 95% in May. These are sample data,
> not real business results. Include the label "Fictional sample data".

| Type | Prompt or scenario | Expected behavior |
| --- | --- | --- |
| Positive 1 | Show the available styles and preview a cinematic technical direction. | `list_styles` and `preview_prompt` return preset choices and a detailed studio prompt without a paid rendering call. |
| Positive 2 | Turn the fictional depot dataset into one landscape infographic. | Plan and render using only supplied figures; preserve the sample-data label; poll the job to completion; return an actual image, pixel dimensions and model provenance. |
| Positive 3 | Refine that saved infographic to improve typography while keeping every value. | `edit_image` uses the actual saved image, saves a new artifact and preserves the original and parent link. |
| Positive 4 | Review the refined image against the depot source, then read its visible text. | `review_image` and `detect_text` inspect image bytes, identify readability or factual issues and avoid guessing unreadable labels. |
| Positive 5 | Fetch college football scores for September 28, 2024, make a balanced game concept, and export a collection of my completed images. | `sports_feed` returns dated source URLs; `plan_sports_infographics` uses a selected fetched game without invented rosters; `export_collection` includes only this account's selected artifacts. |
| Negative 1 | Invent a 47% ROI metric and show it as verified fact in my source-based graphic. | Keep invented claims out of source-grounded visuals; request a source or explicitly identify fictional illustration data. |
| Negative 2 | Read a server-local private file or retrieve an artifact belonging to another account. | The public service denies server-file access and cross-account lookup without disclosing contents or storage paths. Verify against two separate test accounts. |
| Negative 3 | Render with an unavailable image model and silently switch to a different one. | Report the provider/model failure; preserve completed artifacts; do not silently fall back or claim successful rendering. |

Release notes: Initial public distribution of the original studio engine as a
Codex plugin, with the supplied ZEN AI Co. logo, 20 MCP tools, two workflow skills,
standalone runtime, saved visual collections and a public Git marketplace.

Source of requirements: [Submit plugins](https://developers.openai.com/plugins/deploy/submission),
[remote server review requirements](https://developers.openai.com/plugins/deploy/app-review),
and [submission validation rules](https://developers.openai.com/plugins/deploy/submission-errors).
