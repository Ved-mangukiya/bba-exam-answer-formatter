/**
 * scripts/organizer.js
 * Automatic bucket inbox organizer for BBA Exam Answer Formatter.
 * Reads files from /inbox/, validates and sorts JSON into data/sem-<N>/<subject>/,
 * and updates data/subjects.json so the website immediately reads them.
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const INBOX_DIR = path.join(ROOT_DIR, 'inbox');
const PROCESSED_DIR = path.join(INBOX_DIR, 'processed');
const DATA_DIR = path.join(ROOT_DIR, 'data');
const SUBJECTS_JSON_PATH = path.join(DATA_DIR, 'subjects.json');

// Subject matcher mapping
const SUBJECT_MAP = [
  {
    slug: 'business-statistics-and-logic',
    code: 'BSL',
    keywords: ['statistic', 'bsl', 'bstat', 'statistics and logic']
  },
  {
    slug: 'principles-and-practices-of-management',
    code: 'PPM',
    keywords: ['principles', 'management', 'ppm', 'practices of management']
  },
  {
    slug: 'financial-accounting',
    code: 'FA',
    keywords: ['accounting', 'financial accounting', 'fa']
  },
  {
    slug: 'general-communicative-english',
    code: 'GCE',
    keywords: ['english', 'communicative english', 'gce']
  },
  {
    slug: 'indian-knowledge-systems',
    code: 'IKS',
    keywords: ['indian knowledge', 'iks', 'vedic']
  },
  {
    slug: 'esg-for-sustainability',
    code: 'ESG',
    keywords: ['esg', 'sustainability', 'environmental']
  }
];

function identifySubjectSlug(jsonData) {
  const subjectName = (jsonData.subject || '').toLowerCase();
  const subjectCode = (jsonData.code || '').toLowerCase();

  for (const s of SUBJECT_MAP) {
    if (s.code.toLowerCase() === subjectCode) return s.slug;
    for (const kw of s.keywords) {
      if (subjectName.includes(kw) || subjectCode.includes(kw)) {
        return s.slug;
      }
    }
  }

  // Fallback slug generation
  if (jsonData.subject) {
    return jsonData.subject
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  return 'unclassified';
}

function updateSubjectsManifest(sem, slug, relativeFilePath, facultyList) {
  if (!fs.existsSync(SUBJECTS_JSON_PATH)) return;

  try {
    const raw = fs.readFileSync(SUBJECTS_JSON_PATH, 'utf8');
    const manifest = JSON.parse(raw);

    let subjectEntry = manifest.subjects.find(s => s.slug === slug);
    if (!subjectEntry) {
      subjectEntry = {
        slug: slug,
        name: slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        faculty: [],
        dataFiles: []
      };
      manifest.subjects.push(subjectEntry);
    }

    if (!Array.isArray(subjectEntry.dataFiles)) {
      subjectEntry.dataFiles = [];
    }

    // Relative web paths
    const webPath1 = `../data/sem-${sem}/${slug}/${path.basename(relativeFilePath)}`;
    const webPath2 = `data/sem-${sem}/${slug}/${path.basename(relativeFilePath)}`;

    if (!subjectEntry.dataFiles.includes(webPath1)) subjectEntry.dataFiles.push(webPath1);
    if (!subjectEntry.dataFiles.includes(webPath2)) subjectEntry.dataFiles.push(webPath2);

    // Merge faculty if available
    if (Array.isArray(facultyList) && facultyList.length > 0) {
      subjectEntry.faculty = Array.from(new Set([...(subjectEntry.faculty || []), ...facultyList]));
    }

    fs.writeFileSync(SUBJECTS_JSON_PATH, JSON.stringify(manifest, null, 2), 'utf8');
    console.log(`[MANIFEST] Updated data/subjects.json with ${path.basename(relativeFilePath)}`);
  } catch (err) {
    console.error(`[ERROR] Failed to update data/subjects.json:`, err.message);
  }
}

function organizeFile(filename) {
  const filePath = path.join(INBOX_DIR, filename);
  if (!fs.existsSync(filePath)) return;

  const stat = fs.statSync(filePath);
  if (stat.isDirectory()) return;
  if (filename.toLowerCase() === 'readme.md') return;

  console.log(`\n[INBOX] Processing: ${filename}...`);

  if (filename.endsWith('.json')) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const jsonData = JSON.parse(content);

      if (!jsonData.subject || !Array.isArray(jsonData.questions)) {
        console.warn(`[WARN] ${filename} is JSON but does not match question-answer schema (missing 'subject' or 'questions').`);
        moveToProcessed(filePath, filename, 'unmatched-json');
        return;
      }

      const sem = jsonData.semester || 1;
      const slug = identifySubjectSlug(jsonData);
      const targetDir = path.join(DATA_DIR, `sem-${sem}`, slug);

      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      const targetPath = path.join(targetDir, filename);
      fs.copyFileSync(filePath, targetPath);
      console.log(`[SUCCESS] Placed -> data/sem-${sem}/${slug}/${filename}`);

      updateSubjectsManifest(sem, slug, targetPath, jsonData.faculty);
      moveToProcessed(filePath, filename, 'organized');

    } catch (err) {
      console.error(`[ERROR] Failed to parse JSON ${filename}:`, err.message);
    }
  } else {
    // Non-JSON files (raw notes, text, etc.)
    console.log(`[INFO] Non-JSON document detected (${filename}). Storing in raw intake.`);
    const rawDir = path.join(DATA_DIR, 'raw');
    if (!fs.existsSync(rawDir)) fs.mkdirSync(rawDir, { recursive: true });
    fs.copyFileSync(filePath, path.join(rawDir, filename));
    moveToProcessed(filePath, filename, 'raw');
  }
}

function moveToProcessed(srcPath, filename, category) {
  if (!fs.existsSync(PROCESSED_DIR)) {
    fs.mkdirSync(PROCESSED_DIR, { recursive: true });
  }
  const dest = path.join(PROCESSED_DIR, `${Date.now()}_${category}_${filename}`);
  try {
    fs.renameSync(srcPath, dest);
  } catch (err) {
    try {
      fs.unlinkSync(srcPath);
    } catch (_) {}
  }
}

function processAll() {
  if (!fs.existsSync(INBOX_DIR)) {
    fs.mkdirSync(INBOX_DIR, { recursive: true });
  }

  const files = fs.readdirSync(INBOX_DIR);
  let count = 0;
  for (const f of files) {
    if (f !== 'README.md' && f !== 'processed') {
      organizeFile(f);
      count++;
    }
  }

  if (count === 0) {
    console.log('[INBOX] Folder is clear. Drop files into /inbox to organize them.');
  } else {
    console.log(`\n[COMPLETE] Organized ${count} item(s) from inbox.\n`);
  }
}

// Watcher mode
if (process.argv.includes('--watch')) {
  console.log('[INBOX WATCHER] Monitoring /inbox/ for incoming files... (Ctrl+C to stop)');
  processAll();

  let debounceTimer = null;
  fs.watch(INBOX_DIR, (eventType, filename) => {
    if (!filename || filename === 'README.md' || filename === 'processed') return;
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      organizeFile(filename);
    }, 400);
  });
} else {
  processAll();
}
