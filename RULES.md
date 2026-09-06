# RULES.md — Answer Formatting Rulebook (GTU / SSASIT Style)

This file is the single source of truth for how ANY question-answer JSON must be
structured and how the website must render it on an A4 page. Antigravity (or any
model/agent working on this repo) MUST read this file before writing or modifying
any rendering code. Nothing in code should override what's defined here — if a
change is needed, this file is edited first, then code follows it.

There is no single official published "GTU answer writing manual" for students —
GTU's public documents cover paper-setting and examiner-assessment guidelines, not
student handwriting/formatting style. So the rules below are a **defined house
style**, built from common Indian university/board answer-writing conventions
(headings for any answer above 3 marks, underlined keywords/definitions/formulas,
numbered sub-parts, boxed/labelled diagrams) and adapted to be internally
consistent for this project. Once defined here, they are the fixed rule — do not
silently change them.

---

## 1. Page & Layout Rules (A4, print-safe)

- Paper size: **A4 (210mm x 297mm)**, portrait, single column.
- Margins: **20mm top, 20mm bottom, 20mm left, 15mm right** (slightly asymmetric
  left/right like a real answer sheet with a binding margin).
- No page-bleed: absolutely nothing (text, underline, box border, diagram) may
  touch or cross a page edge. All content must respect margins with a minimum
  **4mm safety padding** inside the margin box.
- No mid-word or mid-line page cuts: page breaks (`page-break-inside: avoid` /
  CSS `break-inside: avoid`) must be forced on:
  - every heading + its first line of content (heading never orphaned alone at
    bottom of a page),
  - every diagram/figure block (diagram + its caption stay together),
  - every table,
  - every numbered point block (a point never splits its number from its text).
- Print CSS must use `@page { size: A4; margin: 0; }` and let the layout div
  carry the margins above, so browser print preview matches on-screen preview
  exactly (WYSIWYG, no surprise reflow).
- Font rendering must be embedded/CSS-declared (no default browser serif
  fallback) so print output is deterministic across devices.

## 2. Typography Rules

| Element | Font | Size | Weight/Style |
|---|---|---|---|
| College name (header) | Times New Roman | 11.5pt | Bold, uppercase, centered |
| University & course affiliation | Times New Roman | 9.5pt | Italic, centered |
| Subject title (page header) | Times New Roman | 16pt | Bold, centered |
| Question number + question text | Times New Roman | 13pt | Bold |
| Section/Unit heading inside answer | Times New Roman | 13pt | Bold, underlined |
| Sub-heading inside an answer | Times New Roman | 12pt | Bold |
| Body / normal answer text | Times New Roman | 12pt | Regular |
| Definition / formula / technical term | Times New Roman | 12pt | Regular text, but **underlined** |
| Emphasis word inside a sentence (author's intent) | Times New Roman | 12pt | Italic |
| Table text | Times New Roman | 11pt | Regular; header row Bold |
| Diagram caption | Times New Roman | 10.5pt | Italic, centered under diagram |
| Marks indicator (e.g. "[7 Marks]") | Times New Roman | 11pt | Bold, right-aligned next to question |
| Document footer (meta signoff) | Times New Roman | 9pt | Left: Subject, Center: College, Right: Faculty |

- Line spacing: **1.5** for body text, **1.15** for bullet/numbered points, so
  that it visually matches ruled-notebook spacing without wasting page space.
- Paragraph spacing: leave one blank-line-equivalent (≈6pt) after each answer
  block before the next question starts — mirrors the "leave 2–3 lines after
  each answer" real-exam convention.

### Institutional Header & Footer Standard
Every question-answer sheet renders a synchronized, uniform header and footer:
1. **Header**:
   - **College**: `Shree Swami Atmanand Saraswati Institute of Technology (SSASIT)`
   - **Affiliation**: `Affiliated to Gujarat Technological University (GTU) | Bachelor of Business Administration (BBA) (Semester 1)`
   - **Subject**: `<Subject Name> (<Code>)` (e.g. `Principles and Practices of Management (PPM)`)
   - **Faculty**: `Faculty: <Faculty Names>` (e.g. `Faculty: Prof. Nisha Tollawala, Prof. Karan Kachhadiya`)
2. **Footer**:
   - **Left**: `<Subject Name> (<Code>)`
   - **Center**: `SSASIT • GTU BBA Sem-1`
   - **Right**: `Faculty: <Faculty Names>`

## 3. Bold / Italic / Underline — when each is used

- **Bold** → question numbers, all headings/sub-headings, table header row,
  the word "Note:" if present, marks indicators.
- *Italic* → definitions when quoted as a standalone one-line definition,
  Latin/foreign terms, book/author names if cited, diagram captions.
- <u>Underline</u> → every technical term, defined word, formula, date, named
  law/theory/model, and numeric result the first time it appears in an answer.
  This is the single most GTU/board-convention-accurate rule: examiners scan
  for underlined keywords, so the JSON must explicitly mark these spans (see
  schema §5) rather than leaving formatting to guesswork.
- Never combine underline + italic on the same span (visually cluttered).
  Bold + underline together is allowed only for a heading that is also a
  defined term (rare, e.g. a heading that is itself the key term).

## 4. Numbering System (fixed hierarchy — do not mix arbitrarily)

Use a **fixed 3-level hierarchy** for every subject so students learn one
consistent system instead of it varying per subject:

1. **Main Question** → Q.1, Q.2, Q.3 ... (Arabic numerals, always "Q." prefix)
2. **Sub-question / sub-part** → (a), (b), (c) ... (lowercase alphabetic, in
   round brackets) — used when a main question has multiple compulsory parts.
3. **Points within an answer** → 1., 2., 3. ... (Arabic, with a period, not
   roman) for ordered/sequential content (steps, process, chronology).
   Use i., ii., iii. (lowercase roman) instead of 1,2,3 **only** when the
   points are a *classification/list* rather than a sequential process
   (e.g. "types of X", "features of Y") — this distinction mirrors how GTU/
   board answers separate "steps" from "enumerated lists".
4. Never use bullet symbols (•, -, *) as the primary marker in a formatted
   answer meant for printing — always a number/letter, because examiners in
   this convention expect countable, referenceable points. Bullets are only
   used for un-orderable supporting notes (e.g. "additional remarks") and must
   be explicitly flagged as `"listStyle": "bullet"` in JSON (default is
   `"decimal"` or `"roman"` per rule above).

## 5. Diagrams / Tables

- Every diagram must have: a heading above it reading exactly `Diagram:` (bold,
  underlined) followed by the diagram title, and a centered italic caption
  below it.
- Diagrams are boxed with a thin 0.5pt border and kept on one page (see §1
  break-inside rule).
- Tables always have a bold header row, 11pt text, and a caption above reading
  `Table: <title>` in bold.

## 6. Marks-to-structure mapping (guides how much structure an answer needs)

| Marks | Minimum structure required |
|---|---|
| 2–3 marks | Direct answer, no heading required, 1 underline minimum (the key term) |
| 4–7 marks | At least 1 heading + 2–3 numbered/roman points |
| 8–10 marks | 2+ headings/sub-headings, numbered points under each, diagram/table if applicable |
| 10+ marks | Full structure: Intro line → 2+ headed sections → numbered points under each → diagram/table → 1-line conclusion |

This mapping is what the JSON-conversion step (done in Gemini, per your
workflow) must follow when turning a NotebookLM answer into structured JSON —
it decides how many heading/point nodes to create based on the question's
marks value.

## 7. What this rulebook does NOT define yet (intentionally left open)

- Handwriting-specific rules (pen color, margin-line drawing) are NOT relevant
  since this is a digital/printable reference, not a literal answer-sheet
  simulation — explicitly excluded to avoid confusing the student.
- If SSASIT ever issues an official written format circular, replace §3/§4
  above with the official version and bump this file's version number.

---

**Version:** 1.0
**Applies to:** BBA Semester 1 (all 6 subjects), extensible to Sem 2–6 by
following the identical schema in `schema/question-answer.schema.json`.
