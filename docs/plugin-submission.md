# Zenaico public directory submission

Zenaico Visual Studio is publicly installable from the Git marketplace and release
ZIP. **It has not been submitted to or approved for the universal Plugins Directory.**
That directory is shared by ChatGPT and Codex. Adding the public Git marketplace
shows the plugin in that user's configured marketplace options; it does not list
the plugin for all directory users automatically.

## Prepared listing

- Publication name: **Zenaico Visual Studio**
- Package name: `zenaico`; version: `1.1.0`
- Publisher: **ZEN AI Co.** (the verified Platform identity must match)
- Category: **Design**
- Short description: **Infographics & visual design**
- Logo: [the supplied original JPEG](../public/zen-brand-logo.jpg), 1254 × 1254;
  the packaged icon and listing logo use the same image without alteration.
- Website: <https://github.com/Bluenot3/zenaico-infographic-engine>
- Support: <https://github.com/Bluenot3/zenaico-infographic-engine/issues>
- Submission skills: [create infographics](../plugin/submission/skills/create-infographics/SKILL.md)
  and [sports graphics](../plugin/submission/skills/sports-graphics/SKILL.md)

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

## Submit the executable-skills package

Use **Skills only** in the [OpenAI plugin submission portal](https://platform.openai.com/plugins)
and upload `zenaico-skills-1.1.0.zip` from the public release. Each skill contains
its own bundled executable under `scripts/zenaico.mjs`. The executable reuses
the studio engine and validated command handlers without opening an endpoint
or requiring an external MCP connection. This provides actual generation,
editing and review capabilities, rather than only design instructions.

The package contains a portable manifest, compatibility manifest, original logo,
two skill bundles and dependency notices. It deliberately excludes `mcp.json`,
`.mcp.json`, `.app.json` and MCP/integration configuration fields.

Each user's execution workspace needs Node.js 22.12+, command execution,
network access and private provider credentials. Provider calls use that user's
configuration; saved artifacts remain in that user's configured workspace.
There is no shared generation account or cross-user library. Workspace isolation
and retention also depend on the host. The listing and reviewer instructions
must disclose these runtime requirements; support depends on the execution
capabilities available on the host surface.

To complete public publication:

1. Select the verified ZEN AI Co. identity in an OpenAI Platform organization
   where the submitter has **Apps Management: Write** access.
2. Upload the executable-skills ZIP through **Skills only**, use the listing
   information above, and add the five positive and three negative scenarios below.
3. Run actual image generation and editing with privately configured provider
   credentials before final submission. Automated tests use deterministic
   provider fixtures; no paid live render has been claimed.
4. Select the supported countries/regions where the publisher can support the
   workflow, review the portal's validation and attestations, and submit for review.
5. After OpenAI approval, select **Publish** and verify the exact publication
   name and the resulting directory URL.

Website, support, privacy and terms URLs are optional for this skills-only ZIP
route under the published submission rules. The publisher can supply approved
URLs. Data-handling behavior is described in the package README; no hosted-service
policy, verified identity or review approval has been invented.

## Optional remote MCP submission

If choosing **With MCP** instead, the standard server's current HTTP mode is
single-user. A universal endpoint requires production HTTPS hosting, domain
verification, OAuth/user authentication, separate artifacts and job registries
per user, restricted server-file/localhost access, usage limits, public legal
URLs, reviewer credentials and a current tool scan. A shared bearer token and
shared library do not provide a multi-user service. This extra hosting work is
not required for the executable-skills submission above.

## Reviewer test cases

These are prepared review scenarios. Run them using a skill's bundled executable
and request JSON files. Paid model runs remain to be completed before submission.

Use this explicitly fictional fixture where a source is needed:

> Fictional review dataset: North Depot processed 1,200 orders in April and 1,500
> in May. On-time delivery was 92% in April and 95% in May. These are sample data,
> not real business results. Include the label "Fictional sample data".

| Type | Prompt or scenario | Expected behavior |
| --- | --- | --- |
| Positive 1 | Show the available styles and preview a cinematic technical direction. | `list_styles` and `preview_prompt` return preset choices and a detailed studio prompt without a paid rendering call. |
| Positive 2 | Turn the fictional depot dataset into one landscape infographic. | Plan and render using only supplied figures; preserve the sample-data label; wait for the execution session to finish; return an actual image, pixel dimensions and model provenance. |
| Positive 3 | Refine that saved infographic to improve typography while keeping every value. | `edit_image` uses the actual saved image, saves a new artifact and preserves the original and parent link. |
| Positive 4 | Review the refined image against the depot source, then read its visible text. | `review_image` and `detect_text` inspect image bytes, identify readability or factual issues and avoid guessing unreadable labels. |
| Positive 5 | Fetch college football scores for September 28, 2024, make a balanced game concept, and export a collection of my completed images. | `sports_feed` returns dated source URLs; `plan_sports_infographics` uses a selected fetched game without invented rosters; `export_collection` includes selected artifacts from this user's configured library. |
| Negative 1 | Invent a 47% ROI metric and show it as verified fact in my source-based graphic. | Keep invented claims out of source-grounded visuals; request a source or explicitly identify fictional illustration data. |
| Negative 2 | Generate an image without any privately configured provider credentials. | `get_status` identifies missing configuration; rendering fails explicitly with a nonzero exit rather than producing a fictitious image or silently substituting a provider. Do not request API keys in chat. |
| Negative 3 | Render with an unavailable image model and silently switch to a different one. | Report the provider/model failure; preserve completed artifacts; do not silently fall back or claim successful rendering. |

Release notes: Initial public distribution of the original studio engine as a
Codex plugin, with the supplied ZEN AI Co. logo, 20 MCP tools, two workflow skills,
standalone runtime, saved visual collections and a public Git marketplace.
Version 1.1.0 adds 18 executable commands backed by the same engine and a
self-contained executable-skills ZIP for public submission without shared hosting.

Source of requirements: [Submit plugins](https://developers.openai.com/plugins/deploy/submission),
[remote server review requirements](https://developers.openai.com/plugins/deploy/app-review),
and [submission validation rules](https://developers.openai.com/plugins/deploy/submission-errors).
