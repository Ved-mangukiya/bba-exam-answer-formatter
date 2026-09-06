/**
 * data-loader.js — Subject data fetcher & JSON drag-and-drop importer
 * Only loads genuine syllabus JSON files provided by the user.
 */

(function (window) {
  'use strict';

  const DEFAULT_SUBJECTS = [
    {
      slug: "principles-and-practices-of-management",
      code: "PPM",
      aliases: ["ppm", "principles-of-management"],
      name: "Principles and Practices of Management",
      faculty: ["Prof. Nisha Tollawala", "Prof. Karan Kachhadiya"],
      icon: "🏛️",
      description: "Planning, organizing, staffing, directing, and controlling modern organizations.",
      dataFiles: [
        "../data/sem-1/principles-and-practices-of-management/ppm-sem1.json",
        "data/sem-1/principles-and-practices-of-management/ppm-sem1.json"
      ]
    },
    {
      slug: "business-statistics-and-logic",
      code: "BSL",
      aliases: ["bsl", "business-statistics", "bstat"],
      name: "Business Statistics and Logic",
      faculty: ["Prof. Karan Kachhadiya", "Prof. Birju Patil"],
      icon: "📊",
      description: "Descriptive statistics, probability, hypothesis testing, and quantitative reasoning.",
      dataFiles: []
    },
    {
      slug: "financial-accounting",
      code: "FA",
      aliases: ["fa", "financial-accounting", "accounting"],
      name: "Financial Accounting",
      faculty: ["Dr. Lalit Tank", "Prof. Krishna Gandhi"],
      icon: "📒",
      description: "Double-entry bookkeeping, trial balance, final accounts, and accounting standards.",
      dataFiles: [
        "../data/sem-1/financial-accounting/fa-sem1.json",
        "data/sem-1/financial-accounting/fa-sem1.json",
        "../data/sem-1/financial-accounting/fa.json",
        "data/sem-1/financial-accounting/fa.json"
      ]
    },
    {
      slug: "general-communicative-english",
      code: "GCE",
      name: "General and Communicative English",
      faculty: ["Prof. Hetal S. Ballar", "Prof. Nisha Tollawala"],
      icon: "✍️",
      description: "Business communication, grammar, vocabulary, report writing, and presentations.",
      dataFiles: [
        "../data/sem-1/general-communicative-english/gce-sem1.json",
        "data/sem-1/general-communicative-english/gce-sem1.json"
      ]
    },
    {
      slug: "indian-knowledge-systems",
      code: "IKS",
      name: "Indian Knowledge Systems",
      faculty: ["Prof. Jyoti Tank"],
      icon: "📜",
      description: "Vedic science, traditional Indian management, philosophical systems, and ethics.",
      dataFiles: [
        "../data/sem-1/indian-knowledge-systems/iks-sem1.json",
        "data/sem-1/indian-knowledge-systems/iks-sem1.json",
        "../data/sem-1/indian-knowledge-systems/iks.json",
        "data/sem-1/indian-knowledge-systems/iks.json"
      ]
    },
    {
      slug: "fundamentals-of-esg-for-sustainability",
      code: "FES",
      aliases: ["fes", "esg-for-sustainability", "esg"],
      name: "Fundamentals of ESG for Sustainability",
      faculty: ["Prof. Priya Khoot"],
      icon: "🌱",
      description: "Environmental governance, social responsibility, carbon footprint, and corporate ethics.",
      dataFiles: [
        "../data/sem-1/fundamentals-of-esg-for-sustainability/fes-sem1.json",
        "data/sem-1/fundamentals-of-esg-for-sustainability/fes-sem1.json"
      ]
    }
  ];

  // In-memory cache of subject data
  const subjectCache = new Map();

  async function fetchJson(path) {
    try {
      const resp = await fetch(path);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      return await resp.json();
    } catch (err) {
      return null;
    }
  }

  async function getSubjects() {
    // Attempt dynamic manifest fetch
    const manifest = await fetchJson('../data/subjects.json') || await fetchJson('data/subjects.json');
    if (manifest && Array.isArray(manifest.subjects)) {
      // Merge manifest with default metadata (icons, descriptions)
      return DEFAULT_SUBJECTS.map(def => {
        const found = manifest.subjects.find(s => s.slug === def.slug || (def.aliases && def.aliases.includes(s.slug)));
        if (!found) return def;
        const dataFiles = (found.dataFiles && found.dataFiles.length > 0)
          ? Array.from(new Set([...(def.dataFiles || []), ...found.dataFiles]))
          : (def.dataFiles || []);
        return { ...def, ...found, dataFiles };
      });
    }
    return DEFAULT_SUBJECTS;
  }

  async function getSubjectData(slug) {
    if (subjectCache.has(slug)) {
      return subjectCache.get(slug);
    }

    const subjects = await getSubjects();
    const sub = subjects.find(s => s.slug === slug || (s.aliases && s.aliases.includes(slug)));

    if (sub && sub.dataFiles && sub.dataFiles.length > 0) {
      let combinedSubject = null;
      const seenFileUrls = new Set();
      const seenQIds = new Set();

      for (const file of sub.dataFiles) {
        if (seenFileUrls.has(file)) continue;
        seenFileUrls.add(file);

        const data = await fetchJson(file);
        if (data && Array.isArray(data.questions) && data.questions.length > 0) {
          if (!combinedSubject) {
            combinedSubject = { ...data, questions: [] };
          }
          data.questions.forEach(q => {
            const qKey = q.id || `${q.questionNumber}_${q.questionText}`;
            if (!seenQIds.has(qKey)) {
              seenQIds.add(qKey);
              combinedSubject.questions.push(q);
            }
          });
        }
      }

      if (combinedSubject && combinedSubject.questions.length > 0) {
        subjectCache.set(slug, combinedSubject);
        if (sub.slug) subjectCache.set(sub.slug, combinedSubject);
        return combinedSubject;
      }
    }

    return null;
  }

  function registerCustomData(jsonData) {
    if (!jsonData || typeof jsonData !== 'object') {
      throw new Error('Invalid JSON format');
    }
    if (!jsonData.subject || !Array.isArray(jsonData.questions)) {
      throw new Error('JSON does not match question-answer schema: missing "subject" or "questions"');
    }

    // Generate slug from subject
    const slug = (jsonData.subject || 'custom-subject')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    subjectCache.set(slug, jsonData);
    return { slug, data: jsonData };
  }

  window.GTUDataLoader = {
    getSubjects,
    getSubjectData,
    registerCustomData
  };

})(window);
