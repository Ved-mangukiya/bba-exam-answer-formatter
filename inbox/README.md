# Inbox — Content Drop Bucket

Drop any files here:
- **JSON files** generated from Gemini / NotebookLM matching `schema/question-answer.schema.json`.
- **Raw Q&A notes / syllabus text** (`.txt`, `.md`, `.docx`, etc.).

## How It Works
- Any JSON file placed here is automatically recognized by subject (BSL, PPM, FA, GCE, IKS, FES), validated, and placed into its proper folder under `data/sem-<N>/<subject-slug>/`.
- The subject manifest (`data/subjects.json`) is automatically updated so the website renders the new questions immediately.
- To organize on demand: run `npm run organize` (or `node scripts/organizer.js`).
- To watch this folder continuously in background: run `npm run watch`.
