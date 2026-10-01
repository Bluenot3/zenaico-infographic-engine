---
name: sports-graphics
description: Create balanced sports matchup graphics, game recaps, broadcast scorecards and comparative sports infographics with Zenaico's original studio engine and dated scoreboard facts.
---

Use the bundled executable `scripts/zenaico.mjs`, resolving its absolute path
relative to this skill. Node.js 22.12+ and command execution are required. Run
`get_status` and `commands` first. Image creation requires a privately configured
Gemini or OpenAI API key; scoreboard retrieval does not. Keep credentials out of
chat, shell arguments and request JSON. Use the same private `ZENAICO_OUTPUT_DIR`
as the create-infographics skill so both workflows share this user's library.

Write command arguments to a temporary JSON file with host file tools, then run:

```bash
node /absolute/path/to/skill/scripts/zenaico.mjs sports_feed --input /absolute/path/to/request.json
```

1. Retrieve the requested date (YYYYMMDD), league, team or matchup with
   `sports_feed`, or preserve a complete game supplied by the user. Keep dated
   source URLs and fetch time. Never substitute the app's old demo scores.
2. An upcoming game has no final score. If a fetch fails or returns no results,
   explain the gap and use only independently supplied facts.
3. Browse `list_styles`. Use broadcast, championship, blueprint, branding or
   analytics styles with equal visual weight for both teams.
4. Run `plan_sports_infographics` with the selected game and editorial angle.
   Omit uniforms, jersey numbers, rosters and box-score details absent from the
   source unless the host independently verifies them.
5. Run `render_infographic` for selected concepts with exact team names,
   scores, dates, status and supplied statistics. Wait for the complete execution
   result, polling the host execution session when needed. Do not report only
   that a render started. View the actual image, use `review_image` against the
   game facts, and correct errors with `edit_image`.
6. Deliver full-resolution saved files with source URLs, actual pixel dimensions,
   model names and missing information. Report partial or failed renders honestly.

Follow create-infographics for advanced controls and collection exports. Keep
fallback disabled unless accepted by the user. Proceed with authorized creation
without extra approval pauses; do not generate extra paid variants. Both skills
run the same local studio engine without a hosted shared account or MCP service.
