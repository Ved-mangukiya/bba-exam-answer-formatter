/**
 * app.js — Main UI Controller & State Manager
 */

(function () {
  'use strict';

  // Application State
  const state = {
    subjects: [],
    activeSubjectSlug: 'business-statistics-and-logic',
    activeSubjectData: null,
    activeUnitFilter: 'ALL',
    activeQuestionId: null, // null means "Full Subject View"
    zoomLevel: 1.0,
    showMarginGuides: false,
    activeTab: 'subjects', // 'subjects' or 'questions'
    theme: 'dark'
  };

  // DOM Elements
  let dom = {};

  function initDomRefs() {
    dom = {
      subjectList: document.getElementById('subjectList'),
      questionList: document.getElementById('questionList'),
      unitFilters: document.getElementById('unitFilters'),
      workspaceViewport: document.getElementById('workspaceViewport'),
      a4Scaler: document.getElementById('a4Scaler'),
      a4Container: document.getElementById('a4Container'),
      deskCanvas: document.getElementById('deskCanvas'),
      activeSubjectTitle: document.getElementById('activeSubjectTitle'),
      currentViewModeLabel: document.getElementById('currentViewModeLabel'),
      zoomLevelBadge: document.getElementById('zoomLevelBadge'),
      btnZoomIn: document.getElementById('btnZoomIn'),
      btnZoomOut: document.getElementById('btnZoomOut'),
      btnZoomReset: document.getElementById('btnZoomReset'),
      btnZoomFit: document.getElementById('btnZoomFit'),
      btnToggleGuides: document.getElementById('btnToggleGuides'),
      btnThemeToggle: document.getElementById('btnThemeToggle'),
      btnPrintQuestion: document.getElementById('btnPrintQuestion'),
      btnPrintSubject: document.getElementById('btnPrintSubject'),
      btnFullSubjectView: document.getElementById('btnFullSubjectView'),
      dropzoneInput: document.getElementById('dropzoneInput'),
      btnUploadJson: document.getElementById('btnUploadJson'),
      tabSubjects: document.getElementById('tabSubjects'),
      tabQuestions: document.getElementById('tabQuestions'),
      sidebarSubjectsPanel: document.getElementById('sidebarSubjectsPanel'),
      sidebarQuestionsPanel: document.getElementById('sidebarQuestionsPanel'),
      toastContainer: document.getElementById('toastContainer')
    };
  }

  function showToast(message, type = 'info') {
    if (!dom.toastContainer) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    const icon = type === 'error' ? '⚠️' : '✅';
    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    dom.toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 250);
    }, 3200);
  }

  async function loadInitialData() {
    state.subjects = await window.GTUDataLoader.getSubjects();
    renderSubjectList();
    await selectSubject(state.activeSubjectSlug);
  }

  function renderSubjectList() {
    if (!dom.subjectList) return;

    dom.subjectList.innerHTML = state.subjects.map(sub => {
      const isActive = sub.slug === state.activeSubjectSlug || (sub.aliases && sub.aliases.includes(state.activeSubjectSlug));
      const hasFiles = (Array.isArray(sub.dataFiles) && sub.dataFiles.length > 0) || (sub.code === 'BSL');
      const isReady = hasFiles;
      const statusClass = isReady ? 'status-active' : 'status-pending';
      const statusText = isReady ? 'Ready' : 'Drop JSON';

      return `
        <div class="subject-card ${isActive ? 'active' : ''}" data-slug="${sub.slug}">
          <div class="subject-icon">${sub.icon || '📚'}</div>
          <div class="subject-info">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:3px;">
              <h3 class="subject-title">${sub.name}</h3>
              ${sub.code ? `<span style="font-size:10px; font-weight:700; font-family:var(--font-mono); background:rgba(99,102,241,0.2); color:#a5b4fc; border:1px solid rgba(99,102,241,0.4); padding:1px 6px; border-radius:4px; flex-shrink:0; margin-left:6px;">${sub.code}</span>` : ''}
            </div>
            <p class="subject-desc">${sub.description || 'BBA Semester 1'}</p>
            <div class="subject-meta">
              <span class="status-pill ${statusClass}">${statusText}</span>
              ${sub.faculty && sub.faculty.length > 0 ? `<span style="color:var(--text-muted);">${sub.faculty[0]}</span>` : ''}
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Attach click handlers
    dom.subjectList.querySelectorAll('.subject-card').forEach(card => {
      card.addEventListener('click', () => {
        const slug = card.getAttribute('data-slug');
        selectSubject(slug);
      });
    });
  }

  async function selectSubject(slug) {
    state.activeSubjectSlug = slug;
    state.activeQuestionId = null; // default to full sheet view
    state.activeUnitFilter = 'ALL';

    renderSubjectList();

    const data = await window.GTUDataLoader.getSubjectData(slug);
    state.activeSubjectData = data;

    const subMeta = state.subjects.find(s => s.slug === slug);
    if (dom.activeSubjectTitle) {
      dom.activeSubjectTitle.textContent = data ? data.subject : (subMeta ? subMeta.name : slug);
    }

    renderUnitFilters();
    renderQuestionList();
    renderA4Sheet();
  }

  function renderUnitFilters() {
    if (!dom.unitFilters) return;

    if (!state.activeSubjectData || !state.activeSubjectData.questions) {
      dom.unitFilters.innerHTML = '';
      return;
    }

    const units = new Set();
    state.activeSubjectData.questions.forEach(q => {
      if (q.unit) units.add(q.unit);
    });

    const unitList = ['ALL', ...Array.from(units).sort()];

    dom.unitFilters.innerHTML = unitList.map(u => {
      const isSel = state.activeUnitFilter === u;
      const label = u === 'ALL' ? 'All Units' : u;
      return `<button class="filter-chip ${isSel ? 'active' : ''}" data-unit="${u}">${label}</button>`;
    }).join('');

    dom.unitFilters.querySelectorAll('.filter-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        state.activeUnitFilter = btn.getAttribute('data-unit');
        renderUnitFilters();
        renderQuestionList();
      });
    });
  }

  function renderQuestionList() {
    if (!dom.questionList) return;

    if (!state.activeSubjectData || !state.activeSubjectData.questions || state.activeSubjectData.questions.length === 0) {
      dom.questionList.innerHTML = `
        <div class="empty-state-card" style="margin: 20px 0; padding: 24px;">
          <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 12px;">
            No questions loaded for this subject yet.
          </p>
          <button class="btn btn-secondary btn-sm" id="btnDropzonePrompt">
            📁 Drop or Upload JSON
          </button>
        </div>
      `;
      const promptBtn = document.getElementById('btnDropzonePrompt');
      if (promptBtn && dom.dropzoneInput) {
        promptBtn.addEventListener('click', () => dom.dropzoneInput.click());
      }
      return;
    }

    let questions = state.activeSubjectData.questions;
    if (state.activeUnitFilter !== 'ALL') {
      questions = questions.filter(q => q.unit === state.activeUnitFilter);
    }

    const fullSheetActive = state.activeQuestionId === null;

    let html = `
      <div class="question-item-card ${fullSheetActive ? 'active' : ''}" id="cardFullSheet">
        <div class="question-item-head">
          <span class="q-num-badge" style="color: #38bdf8;">📄 Full Subject Sheet</span>
          <span class="q-marks-pill">${state.activeSubjectData.questions.length} Questions</span>
        </div>
        <div class="question-item-text">
          View and print all questions consecutively in one complete A4 document.
        </div>
      </div>
    `;

    html += questions.map(q => {
      const isSel = state.activeQuestionId === q.id;
      return `
        <div class="question-item-card ${isSel ? 'active' : ''}" data-qid="${q.id}">
          <div class="question-item-head">
            <span class="q-num-badge">${q.questionNumber || 'Q.'}</span>
            <span class="q-marks-pill">[${q.marks || 0} Marks]</span>
          </div>
          <div class="question-item-text">${q.questionText}</div>
        </div>
      `;
    }).join('');

    dom.questionList.innerHTML = html;

    // Attach listeners
    const fullSheetCard = document.getElementById('cardFullSheet');
    if (fullSheetCard) {
      fullSheetCard.addEventListener('click', () => {
        state.activeQuestionId = null;
        renderQuestionList();
        renderA4Sheet();
      });
    }

    dom.questionList.querySelectorAll('.question-item-card[data-qid]').forEach(card => {
      card.addEventListener('click', () => {
        state.activeQuestionId = card.getAttribute('data-qid');
        renderQuestionList();
        renderA4Sheet();
      });
    });
  }

  function renderA4Sheet() {
    if (!dom.a4Container) return;

    if (!state.activeSubjectData) {
      dom.a4Container.innerHTML = `
        <div class="empty-state-card">
          <div class="dropzone-box" id="canvasDropBox">
            <div class="dropzone-icon">📥</div>
            <div class="dropzone-text">Drop JSON File Here</div>
            <div class="dropzone-subtext">Matches schema/question-answer.schema.json</div>
          </div>
          <p style="font-size: 13px; color: var(--text-secondary); margin-top: 8px;">
            Or select <strong>Business Statistics and Logic</strong> from the sidebar to view the reference sample.
          </p>
        </div>
      `;
      setupCanvasDropzone();
      updateViewLabels();
      return;
    }

    const html = window.GTURenderer.renderDocument(state.activeSubjectData, state.activeQuestionId);
    dom.a4Container.innerHTML = html;

    updateViewLabels();
  }

  function updateViewLabels() {
    if (dom.currentViewModeLabel) {
      if (!state.activeSubjectData) {
        dom.currentViewModeLabel.textContent = 'Awaiting Content';
      } else if (state.activeQuestionId) {
        const q = state.activeSubjectData.questions.find(x => x.id === state.activeQuestionId);
        dom.currentViewModeLabel.textContent = q ? `${q.questionNumber} (${q.marks} Marks)` : 'Single Question View';
      } else {
        dom.currentViewModeLabel.textContent = `Full Subject (${state.activeSubjectData.questions ? state.activeSubjectData.questions.length : 0} Questions)`;
      }
    }
  }

  function setZoom(newZoom) {
    state.zoomLevel = Math.max(0.4, Math.min(2.0, parseFloat(newZoom.toFixed(2))));
    if (dom.a4Scaler) {
      dom.a4Scaler.style.transform = `scale(${state.zoomLevel})`;
    }
    if (dom.zoomLevelBadge) {
      dom.zoomLevelBadge.textContent = `${Math.round(state.zoomLevel * 100)}%`;
    }
  }

  function fitToWidth() {
    if (!dom.deskCanvas) return;
    const canvasWidth = dom.deskCanvas.clientWidth - 80;
    // Standard A4 width in pixels approx 794px at 96dpi (210mm)
    const a4PxWidth = 794;
    const targetZoom = canvasWidth / a4PxWidth;
    setZoom(targetZoom);
  }

  function toggleMarginGuides() {
    state.showMarginGuides = !state.showMarginGuides;
    if (dom.a4Container) {
      dom.a4Container.classList.toggle('show-margin-guides', state.showMarginGuides);
    }
    if (dom.btnToggleGuides) {
      dom.btnToggleGuides.classList.toggle('active', state.showMarginGuides);
    }
    showToast(state.showMarginGuides ? 'Margin guides enabled' : 'Margin guides hidden');
  }

  function toggleTheme() {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    document.body.classList.toggle('theme-light', state.theme === 'light');
    if (dom.btnThemeToggle) {
      dom.btnThemeToggle.textContent = state.theme === 'dark' ? '🌙' : '☀️';
    }
  }

  function printDocument(questionOnly = false) {
    if (!state.activeSubjectData) {
      showToast('No document loaded to print', 'error');
      return;
    }

    const prevQuestionId = state.activeQuestionId;

    if (questionOnly && state.activeQuestionId) {
      // Print active question
      window.print();
    } else {
      // Print full subject sheet
      state.activeQuestionId = null;
      renderA4Sheet();
      renderQuestionList();

      setTimeout(() => {
        window.print();
        // Restore previous selection if any
        if (prevQuestionId) {
          state.activeQuestionId = prevQuestionId;
          renderA4Sheet();
          renderQuestionList();
        }
      }, 150);
    }
  }

  function handleFileUpload(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target.result);
        const { slug, data } = window.GTUDataLoader.registerCustomData(json);

        // Check if subject exists or add to list
        const existing = state.subjects.find(s => s.slug === slug);
        if (!existing) {
          state.subjects.push({
            slug: slug,
            name: data.subject,
            faculty: data.faculty || [],
            icon: '📄',
            description: `Imported (${data.questions.length} questions)`
          });
        }

        renderSubjectList();
        selectSubject(slug);
        showToast(`Loaded ${data.subject} (${data.questions.length} questions)`);
      } catch (err) {
        showToast(`Failed to parse JSON: ${err.message}`, 'error');
      }
    };
    reader.readAsText(file);
  }

  function setupCanvasDropzone() {
    const box = document.getElementById('canvasDropBox');
    if (!box) return;

    box.addEventListener('click', () => {
      if (dom.dropzoneInput) dom.dropzoneInput.click();
    });

    ['dragenter', 'dragover'].forEach(name => {
      box.addEventListener(name, (e) => {
        e.preventDefault();
        box.classList.add('drag-over');
      });
    });

    ['dragleave', 'drop'].forEach(name => {
      box.addEventListener(name, (e) => {
        e.preventDefault();
        box.classList.remove('drag-over');
      });
    });

    box.addEventListener('drop', (e) => {
      e.preventDefault();
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFileUpload(e.dataTransfer.files[0]);
      }
    });
  }

  function attachEventListeners() {
    // Zoom controls
    if (dom.btnZoomIn) dom.btnZoomIn.addEventListener('click', () => setZoom(state.zoomLevel + 0.1));
    if (dom.btnZoomOut) dom.btnZoomOut.addEventListener('click', () => setZoom(state.zoomLevel - 0.1));
    if (dom.btnZoomReset) dom.btnZoomReset.addEventListener('click', () => setZoom(1.0));
    if (dom.btnZoomFit) dom.btnZoomFit.addEventListener('click', fitToWidth);

    // Margin Guides & Theme
    if (dom.btnToggleGuides) dom.btnToggleGuides.addEventListener('click', toggleMarginGuides);
    if (dom.btnThemeToggle) dom.btnThemeToggle.addEventListener('click', toggleTheme);

    // Print Buttons
    if (dom.btnPrintQuestion) dom.btnPrintQuestion.addEventListener('click', () => printDocument(true));
    if (dom.btnPrintSubject) dom.btnPrintSubject.addEventListener('click', () => printDocument(false));
    if (dom.btnFullSubjectView) {
      dom.btnFullSubjectView.addEventListener('click', () => {
        state.activeQuestionId = null;
        renderQuestionList();
        renderA4Sheet();
      });
    }

    // Sidebar tab switcher
    if (dom.tabSubjects && dom.tabQuestions) {
      dom.tabSubjects.addEventListener('click', () => {
        state.activeTab = 'subjects';
        dom.tabSubjects.classList.add('active');
        dom.tabQuestions.classList.remove('active');
        dom.sidebarSubjectsPanel.style.display = 'flex';
        dom.sidebarQuestionsPanel.style.display = 'none';
      });

      dom.tabQuestions.addEventListener('click', () => {
        state.activeTab = 'questions';
        dom.tabQuestions.classList.add('active');
        dom.tabSubjects.classList.remove('active');
        dom.sidebarSubjectsPanel.style.display = 'none';
        dom.sidebarQuestionsPanel.style.display = 'flex';
      });
    }

    // Global file input
    if (dom.dropzoneInput) {
      dom.dropzoneInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          handleFileUpload(e.target.files[0]);
        }
      });
    }
    if (dom.btnUploadJson && dom.dropzoneInput) {
      dom.btnUploadJson.addEventListener('click', () => dom.dropzoneInput.click());
    }

    // Window drag and drop
    window.addEventListener('dragover', (e) => e.preventDefault());
    window.addEventListener('drop', (e) => {
      e.preventDefault();
      if (e.dataTransfer.files && e.dataTransfer.files[0] && e.dataTransfer.files[0].name.endsWith('.json')) {
        handleFileUpload(e.dataTransfer.files[0]);
      }
    });

    // Keyboard shortcuts
    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        printDocument(false);
      }
    });

    window.addEventListener('resize', () => {
      if (state.zoomLevel < 0.6) fitToWidth();
    });
  }

  // Application Entry Point
  document.addEventListener('DOMContentLoaded', () => {
    initDomRefs();
    attachEventListeners();
    loadInitialData();
  });

})();
