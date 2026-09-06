# Antigravity kickoff prompt

Model to select in Antigravity: **Gemini 3 Pro** (or whichever is the current
top reasoning/coding Gemini model available to you) — pick the highest-tier
Gemini coding model available, since this is a real multi-file frontend build,
not a quick script. Since you only have Gemini models available in Antigravity,
that's your only choice anyway — just don't use a "flash"/lite tier for the
initial build; flash is fine later for small tweaks.

## First message to paste into Antigravity (after connecting the repo)

---

Before doing anything, read these files in this exact order and follow them
as hard constraints for this entire project:
1. `/.antigravity/AGENT_RULES.md`
2. `/RULES.md`
3. `/schema/question-answer.schema.json`
4. `/data/sem-1/business-statistics/sample-question.json` (reference example)

Then build a static website (plain HTML/CSS/JS, no backend, no database) that:

1. Shows a home page with one "subject box" per folder under `/data/sem-1/`
   (read folders dynamically, don't hardcode the subject list beyond what's
   in AGENT_RULES.md).
2. Clicking a subject box shows its units, then its questions.
3. Clicking a question renders its full answer formatted EXACTLY per
   `/RULES.md` (fonts, sizes, bold/italic/underline, numbering system,
   heading rules, A4 layout) reading directly from that subject's JSON file(s).
4. Includes a "Print" button per question and per full subject that produces
   a clean A4 print output with zero page-bleed and no text/diagram cut
   across a page break — test this with actual browser print preview, not
   just screen CSS.
5. The design should be clean and readable on screen too (not just print),
   but on-screen styling must never contradict the print rules in `/RULES.md`.

Do not invent new JSON fields without first proposing an update to
`/schema/question-answer.schema.json`. Do not add authentication or a backend.
Ask me before adding any new folder-structure convention not already described
in `/.antigravity/AGENT_RULES.md`.

Start by building for the `business-statistics` sample data only, so we can
review formatting quality before I add the other 5 subjects' JSON files.

---
