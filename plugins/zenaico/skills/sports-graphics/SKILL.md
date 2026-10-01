---
name: sports-graphics
description: Create balanced sports matchup graphics, game recaps, broadcast scorecards and comparative sports infographics with Zenaico, using dated live scores and the studio's original sports styles.
---

1. Use `sports_feed` for the requested date (YYYYMMDD), league, team or matchup. If a user
   supplies a complete game object, preserve it as the source instead. Do not treat the
   app's older demo games as current results.
2. Keep source URLs, the game date and fetch time with the working facts. An upcoming
   game has no final score. If results are empty or a fetch fails, state that and use only
   independently supplied facts. Do not substitute plausible scores or rosters.
3. Browse `list_styles`. Broadcast HUD, championship, team branding, blueprint and
   analytics-terminal styles can be blended. Apply cross-domain aesthetics to authentic
   players and teams; keep the two sides visually balanced.
4. Use `plan_sports_infographics` with the returned game and requested editorial angle.
   The scoreboard may omit uniforms, jersey numbers and detailed box scores. Verify and
   explicitly add missing information from sources available to the host, or omit it.
   Do not fill gaps from static roster assumptions.
5. Render the selected concepts with `render_infographic`, preserving exact scores,
   dates, team names, status and available statistics in `dataEntries`. Inspect the
   resulting images, call `review_image` with the game facts, and correct errors with
   `edit_image`.
   Image tools return background jobs. Poll `get_job` with `waitMs: 15000` until the
   job finishes before delivering the results; report partial or failed jobs explicitly.
6. Deliver saved file paths and cite the scoreboard source URLs. Report actual image
   dimensions, model names, missing source details and any permitted model fallback.

Keep API credentials in the server environment. Avoid extra approval steps when the
user has authorized creation. Follow the create-infographics workflow for advanced
design controls and collection exports.
