# bba-exam-answer-formatter

A static website that turns NotebookLM-sourced exam answers into properly
formatted, print-ready A4 answer sheets for BBA (SSASIT) subjects — with
correct headings, numbering (Q.1 / (a) / 1,2,3 / i,ii,iii), bold/italic/
underline rules, and clean page breaks so nothing gets cut off when printed.

## How content flows into this repo
1. Questions come from the official syllabus/question bank (see `/syllabus`
   if added later).
2. Raw answers are generated per-subject in NotebookLM.
3. Raw Q&A + `/RULES.md` are pasted into Gemini, which outputs a JSON file
   matching `/schema/question-answer.schema.json`.
4. The JSON is dropped into `/data/sem-<N>/<subject-slug>/`.
5. The website (built/maintained via Antigravity — see `.antigravity/AGENT_RULES.md`)
   reads the JSON and renders a formatted, printable page per subject.

## Structure
```
/RULES.md                      <- master formatting rulebook (read this first)
/schema/                       <- JSON schema all subject data must follow
/data/sem-1/<subject>/*.json   <- actual content, one folder per subject
/.antigravity/AGENT_RULES.md   <- instructions Antigravity reads before coding
/site/                         <- the actual website code (added as it's built)
```

## Current scope
BBA Semester 1, 6 subjects:
Principles and Practices of Management, Financial Accounting, Business
Statistics and Logic, General and Communicative English, Indian Knowledge
Systems, Fundamentals of ESG for Sustainability.

Structure is designed to extend to Semesters 2–6 without code changes —
just add new `sem-<N>/<subject>` folders.

## Suggested repo settings
- **Visibility:** Public
- **Description:** "Print-ready, GTU/SSASIT-style formatted answer sheets for BBA exams — JSON-driven, A4-safe, no page-bleed."
