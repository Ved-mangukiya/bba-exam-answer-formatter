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
    faculty: ['Prof. Karan Kachhadiya', 'Prof. Birju Patil'],
    keywords: ['statistic', 'bsl', 'bstat', 'statistics and logic']
  },
  {
    slug: 'principles-and-practices-of-management',
    code: 'PPM',
    faculty: ['Prof. Nisha Tollawala', 'Prof. Karan Kachhadiya'],
    keywords: ['principles', 'management', 'ppm', 'practices of management']
  },
  {
    slug: 'financial-accounting',
    code: 'FA',
    faculty: ['Dr. Lalit Tank', 'Prof. Krishna Gandhi'],
    keywords: ['accounting', 'financial accounting', 'fa']
  },
  {
    slug: 'general-communicative-english',
    code: 'GCE',
    faculty: ['Prof. Hetal S. Ballar', 'Prof. Nisha Tollawala'],
    keywords: ['english', 'communicative english', 'gce']
  },
  {
    slug: 'indian-knowledge-systems',
    code: 'IKS',
    faculty: ['Prof. Jyoti Tank'],
    keywords: ['indian knowledge', 'iks', 'vedic']
  },
  {
    slug: 'fundamentals-of-esg-for-sustainability',
    code: 'FES',
    faculty: ['Prof. Priya Khoot'],
    keywords: ['fes', 'fundamentals of esg', 'esg', 'sustainability', 'environmental']
  }
];

function identifySubject(jsonData) {
  const subjectName = (jsonData.subject || '').toLowerCase();
  const subjectCode = (jsonData.code || '').toLowerCase();

  for (const s of SUBJECT_MAP) {
    if (s.code.toLowerCase() === subjectCode) return s;
    for (const kw of s.keywords) {
      if (subjectName.includes(kw) || subjectCode.includes(kw)) {
        return s;
      }
    }
  }

  // Fallback slug generation
  const slug = jsonData.subject
    ? jsonData.subject.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    : 'unclassified';
  return { slug, code: slug.substring(0, 4).toUpperCase(), keywords: [] };
}

function updateSubjectsManifest(sem, slug, relativeFilePath, facultyList) {
  if (!fs.existsSync(SUBJECTS_JSON_PATH)) return;

  try {
    const raw = fs.readFileSync(SUBJECTS_JSON_PATH, 'utf8');
    const manifest = JSON.parse(raw);

    let subjectEntry = manifest.subjects.find(s => s.slug === slug || (s.aliases && s.aliases.includes(slug)));
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
      const matched = identifySubject(jsonData);
      const slug = matched.slug;
      const targetDir = path.join(DATA_DIR, `sem-${sem}`, slug);

      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      // Standardize filename: generic names like answers.json become <code.toLowerCase()>-sem<sem>.json
      let finalFilename = filename;
      const baseLower = path.basename(filename, '.json').toLowerCase();
      if (['answers', 'questions', 'data', 'content', 'export', 'notebooklm', matched.code.toLowerCase()].includes(baseLower)) {
        finalFilename = `${matched.code.toLowerCase()}-sem${sem}.json`;
      }

      // Ensure standardized metadata, header, and footer structure
      jsonData.semester = sem;
      jsonData.course = jsonData.course || 'Bachelor of Business Administration (BBA)';
      jsonData.college = jsonData.college || 'Shree Swami Atmanand Saraswati Institute of Technology (SSASIT)';
      jsonData.university = jsonData.university || 'Gujarat Technological University (GTU)';
      jsonData.subjectCode = jsonData.subjectCode || matched.code;
      if (!Array.isArray(jsonData.faculty) || jsonData.faculty.length === 0) {
        jsonData.faculty = matched.faculty || [];
      }
      if (!jsonData.header) {
        jsonData.header = {
          college: jsonData.college,
          university: jsonData.university,
          course: jsonData.course,
          semester: sem,
          subject: jsonData.subject,
          subjectCode: jsonData.subjectCode,
          faculty: jsonData.faculty
        };
      }
      if (!jsonData.footer) {
        jsonData.footer = {
          college: 'SSASIT',
          university: 'GTU',
          course: `BBA Sem-${sem}`,
          subject: jsonData.subject,
          subjectCode: jsonData.subjectCode,
          faculty: jsonData.faculty
        };
      }

      const targetPath = path.join(targetDir, finalFilename);
      fs.writeFileSync(targetPath, JSON.stringify(jsonData, null, 2), 'utf8');
      console.log(`[SUCCESS] Standardized & Placed -> data/sem-${sem}/${slug}/${finalFilename}`);

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
  // Remove temporary inbox file once organized to prevent duplicate files
  try {
    if (fs.existsSync(srcPath)) {
      fs.unlinkSync(srcPath);
      console.log(`[CLEANUP] Cleaned up inbox file: ${filename}`);
    }
  } catch (err) {
    console.warn(`[WARN] Could not clean up ${filename}:`, err.message);
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
