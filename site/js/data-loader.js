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
      faculty: ["SSASIT Management Faculty"],
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
      faculty: ["SSASIT Statistics Faculty"],
      icon: "📊",
      description: "Descriptive statistics, probability, hypothesis testing, and quantitative reasoning.",
      dataFiles: []
    },
    {
      slug: "financial-accounting",
      code: "FA",
      name: "Financial Accounting",
      faculty: ["SSASIT Accounting Faculty"],
      icon: "📒",
      description: "Double-entry bookkeeping, trial balance, final accounts, and accounting standards.",
      dataFiles: []
    },
    {
      slug: "general-communicative-english",
      code: "GCE",
      name: "General and Communicative English",
      faculty: ["SSASIT Humanities Faculty"],
      icon: "✍️",
      description: "Business communication, grammar, vocabulary, report writing, and presentations.",
      dataFiles: []
    },
    {
      slug: "indian-knowledge-systems",
      code: "IKS",
      name: "Indian Knowledge Systems",
      faculty: ["SSASIT IKS Faculty"],
      icon: "📜",
      description: "Vedic science, traditional Indian management, philosophical systems, and ethics.",
      dataFiles: []
    },
    {
      slug: "esg-for-sustainability",
      code: "ESG",
      name: "Fundamentals of ESG for Sustainability",
      faculty: ["SSASIT ESG Faculty"],
      icon: "🌱",
      description: "Environmental governance, social responsibility, carbon footprint, and corporate ethics.",
      dataFiles: []
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
        return found ? { ...def, ...found } : def;
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
