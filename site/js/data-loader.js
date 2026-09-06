/**
 * data-loader.js — Subject data fetcher & JSON drag-and-drop importer
 */

(function (window) {
  'use strict';

  // Fallback sample data for Business Statistics (guarantees file:// protocol offline compatibility)
  const SAMPLE_BUSINESS_STATISTICS = {
    "semester": 1,
    "subject": "Business Statistics and Logic",
    "faculty": ["Prof. Karan Kachhadiya", "Prof. Birju Patil"],
    "questions": [
      {
        "id": "bstat-u1-q1",
        "questionNumber": "Q.1",
        "questionText": "Explain the meaning and definition of Statistics. Also explain its functions, scope and limitations.",
        "marks": 7,
        "unit": "Unit 1",
        "type": "detail",
        "answer": [
          {
            "blockType": "heading",
            "text": "Meaning and Definition of Statistics"
          },
          {
            "blockType": "paragraph",
            "text": "Statistics is the branch of applied mathematics that deals with the collection, organization, analysis, interpretation and presentation of numerical data.",
            "spans": [
              { "start": 0, "end": 10, "style": "underline" }
            ]
          },
          {
            "blockType": "subheading",
            "text": "Definition (Horace Secrist)"
          },
          {
            "blockType": "paragraph",
            "text": "Statistics may be defined as the aggregate of facts affected to a marked extent by multiplicity of causes, numerically expressed, collected in a systematic manner for a predetermined purpose.",
            "spans": [
              { "start": 0, "end": 10, "style": "italic" }
            ]
          },
          {
            "blockType": "heading",
            "text": "Functions of Statistics"
          },
          {
            "blockType": "list",
            "listStyle": "roman",
            "items": [
              { "text": "Presents facts in a definite form.", "spans": [] },
              { "text": "Simplifies complex data into an understandable form.", "spans": [] },
              { "text": "Helps in formulating and testing hypotheses.", "spans": [{ "start": 20, "end": 30, "style": "underline" }] },
              { "text": "Helps in forecasting future trends." }
            ]
          },
          {
            "blockType": "heading",
            "text": "Scope of Statistics"
          },
          {
            "blockType": "paragraph",
            "text": "The scope of Statistics extends to almost every field including economics, business, medicine and social sciences."
          },
          {
            "blockType": "heading",
            "text": "Limitations of Statistics"
          },
          {
            "blockType": "list",
            "listStyle": "decimal",
            "items": [
              { "text": "Statistics does not deal with individual items, only aggregates." },
              { "text": "It cannot study qualitative characteristics directly." },
              { "text": "Statistical results are true only on average, not for every case." }
            ]
          }
        ]
      },
      {
        "id": "bstat-u1-q2",
        "questionNumber": "Q.2",
        "questionText": "Define Statistics.",
        "marks": 2,
        "unit": "Unit 1",
        "type": "short",
        "answer": [
          {
            "blockType": "paragraph",
            "text": "Statistics is the science of collecting, organizing, analyzing and interpreting numerical data.",
            "spans": [
              { "start": 0, "end": 10, "style": "underline" }
            ]
          }
        ]
      }
    ]
  };

  const DEFAULT_SUBJECTS = [
    {
      slug: "business-statistics-and-logic",
      code: "BSL",
      aliases: ["bsl", "business-statistics", "bstat"],
      name: "Business Statistics and Logic",
      faculty: ["Prof. Karan Kachhadiya", "Prof. Birju Patil"],
      icon: "📊",
      description: "Descriptive statistics, probability, hypothesis testing, and quantitative reasoning.",
      dataFiles: [
        "../data/sem-1/business-statistics-and-logic/sample-question.json",
        "data/sem-1/business-statistics-and-logic/sample-question.json",
        "../data/sem-1/business-statistics/sample-question.json",
        "data/sem-1/business-statistics/sample-question.json",
        "../data/sem-1/bsl/sample-question.json",
        "data/sem-1/bsl/sample-question.json"
      ]
    },
    {
      slug: "principles-and-practices-of-management",
      code: "PPM",
      aliases: ["ppm", "principles-of-management"],
      name: "Principles and Practices of Management",
      faculty: ["SSASIT Management Faculty"],
      icon: "🏛️",
      description: "Planning, organizing, staffing, directing, and controlling modern organizations.",
      dataFiles: [
        "../data/sem-1/principles-and-practices-of-management/sample-question.json",
        "data/sem-1/principles-and-practices-of-management/sample-question.json",
        "../data/sem-1/ppm/sample-question.json",
        "data/sem-1/ppm/sample-question.json",
        "../data/sem-1/principles-of-management/sample-question.json",
        "data/sem-1/principles-of-management/sample-question.json"
      ]
    },
    {
      slug: "financial-accounting",
      code: "FA",
      name: "Financial Accounting",
      faculty: ["SSASIT Accounting Faculty"],
      icon: "📒",
      description: "Double-entry bookkeeping, trial balance, final accounts, and accounting standards.",
      dataFiles: ["../data/sem-1/financial-accounting/sample-question.json", "data/sem-1/financial-accounting/sample-question.json"]
    },
    {
      slug: "general-communicative-english",
      code: "GCE",
      name: "General and Communicative English",
      faculty: ["SSASIT Humanities Faculty"],
      icon: "✍️",
      description: "Business communication, grammar, vocabulary, report writing, and presentations.",
      dataFiles: ["../data/sem-1/general-communicative-english/sample-question.json", "data/sem-1/general-communicative-english/sample-question.json"]
    },
    {
      slug: "indian-knowledge-systems",
      code: "IKS",
      name: "Indian Knowledge Systems",
      faculty: ["SSASIT IKS Faculty"],
      icon: "📜",
      description: "Vedic science, traditional Indian management, philosophical systems, and ethics.",
      dataFiles: ["../data/sem-1/indian-knowledge-systems/sample-question.json", "data/sem-1/indian-knowledge-systems/sample-question.json"]
    },
    {
      slug: "esg-for-sustainability",
      code: "ESG",
      name: "Fundamentals of ESG for Sustainability",
      faculty: ["SSASIT ESG Faculty"],
      icon: "🌱",
      description: "Environmental governance, social responsibility, carbon footprint, and corporate ethics.",
      dataFiles: ["../data/sem-1/esg-for-sustainability/sample-question.json", "data/sem-1/esg-for-sustainability/sample-question.json"]
    }
  ];

  // In-memory cache of subject data
  const subjectCache = new Map();
  subjectCache.set("business-statistics-and-logic", SAMPLE_BUSINESS_STATISTICS);
  subjectCache.set("business-statistics", SAMPLE_BUSINESS_STATISTICS);
  subjectCache.set("bsl", SAMPLE_BUSINESS_STATISTICS);

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

    // Default fallback for Business Statistics and Logic (BSL)
    if (slug === 'business-statistics-and-logic' || slug === 'business-statistics' || slug === 'bsl' || slug === 'bstat') {
      subjectCache.set(slug, SAMPLE_BUSINESS_STATISTICS);
      return SAMPLE_BUSINESS_STATISTICS;
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
    registerCustomData,
    SAMPLE_BUSINESS_STATISTICS
  };

})(window);
