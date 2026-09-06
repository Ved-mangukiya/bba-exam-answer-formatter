# Agent Rules & Guidelines — BBA Exam Answer Formatter

This document defines core behavioral constraints and operational knowledge for AI agents (including Antigravity) working in this repository.

## 1. Project Goal
Transform raw Q&A (NotebookLM exports converted to structured JSON) into GTU / SSASIT-standard, print-ready A4 answer sheets without page bleed, accidental mid-paragraph breaks, or styling inconsistencies.

## 2. Hard Constraints
1. **Source of Truth for Formatting**: `RULES.md`. Code MUST NOT deviate from font sizes, margins, line spacings, or numbering hierarchy specified in `RULES.md`.
2. **Schema Integrity**: All question data must validate against `schema/question-answer.schema.json`. Do not introduce new JSON fields without an approved schema update.
3. **No Backend / No DB**: The site is a purely client-side static web application (HTML5, Vanilla CSS, Vanilla JavaScript).
4. **No External / Internet-Sourced Answers**: Antigravity and any assisting model MUST NEVER invent, hallucinate, or scrape answers from internet data. All question-and-answer content comes strictly from the user's syllabus / NotebookLM-approved source files. The agent's role is strictly formatting, structuring, and rendering user-provided content.
5. **Folder Structure**:
   - `inbox/` — Root drop bucket. User places raw or Gemini-formatted files here for automatic organization.
   - `scripts/organizer.js` — Inbox organizer script (`npm run organize`, `npm run watch-inbox`).
   - `RULES.md` — Master formatting rules.
   - `schema/` — JSON schemas.
   - `data/sem-<N>/<subject-slug>/` — Subject Q&A JSON files.
   - `site/` — Frontend web application.
   - `.antigravity/` — Agent rules & configuration.

## 3. Semester 1 Subject Registry

| Slug | Subject Name | Folder Path |
|---|---|---|
| `business-statistics-and-logic` | Business Statistics and Logic (BSL) | `data/sem-1/business-statistics-and-logic/` |
| `principles-and-practices-of-management` | Principles and Practices of Management (PPM) | `data/sem-1/principles-and-practices-of-management/` |
| `financial-accounting` | Financial Accounting (FA) | `data/sem-1/financial-accounting/` |
| `general-communicative-english` | General and Communicative English (GCE) | `data/sem-1/general-communicative-english/` |
| `indian-knowledge-systems` | Indian Knowledge Systems (IKS) | `data/sem-1/indian-knowledge-systems/` |
| `esg-for-sustainability` | Fundamentals of ESG for Sustainability (ESG) | `data/sem-1/esg-for-sustainability/` |

## 4. Extensibility
The directory architecture extends to Semesters 2–6 by adding `data/sem-<N>/<subject-slug>/` without requiring breaking architectural changes.
