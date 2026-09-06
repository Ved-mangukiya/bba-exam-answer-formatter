/**
 * app.js — Main UI Controller & State Manager
 */

(function () {
  'use strict';

  // Application State
  const state = {
    subjects: [],
    activeSubjectSlug: 'principles-and-practices-of-management',
    activeSubjectData: null,
    activeUnitFilter: 'ALL',
    activeQuestionId: null, // null means "Full Subject View"
    zoomLevel: 1.0,
    showMarginGuides: false,
    activeTab: 'subjects', // 'subjects' or 'questions'
    mobileView: 'subjects', // 'subjects', 'questions', or 'sheet'
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
      btnOpenPdfModal: document.getElementById('btnOpenPdfModal'),
      btnMobileDownload: document.getElementById('btnMobileDownload'),
      btnFullSubjectView: document.getElementById('btnFullSubjectView'),
      dropzoneInput: document.getElementById('dropzoneInput'),
      btnUploadJson: document.getElementById('btnUploadJson'),
      tabSubjects: document.getElementById('tabSubjects'),
      tabQuestions: document.getElementById('tabQuestions'),
      sidebarSubjectsPanel: document.getElementById('sidebarSubjectsPanel'),
      sidebarQuestionsPanel: document.getElementById('sidebarQuestionsPanel'),
      toastContainer: document.getElementById('toastContainer'),
      mobileBottomNav: document.getElementById('mobileBottomNav'),
      mobileNavItems: document.querySelectorAll('.mobile-nav-item'),
      btnMobileBackToQuestions: document.getElementById('btnMobileBackToQuestions'),
      pdfModalBackdrop: document.getElementById('pdfModalBackdrop'),
      btnPdfModalClose: document.getElementById('btnPdfModalClose'),
      btnPdfModalCancel: document.getElementById('btnPdfModalCancel'),
      btnPdfModalDownload: document.getElementById('btnPdfModalDownload'),
      pdfFileNameInput: document.getElementById('pdfFileNameInput'),
      radioScopeFull: document.getElementById('radioScopeFull'),
      radioScopeSingle: document.getElementById('radioScopeSingle'),
      pdfFullSubjectCount: document.getElementById('pdfFullSubjectCount'),
      pdfSingleQuestionDesc: document.getElementById('pdfSingleQuestionDesc'),
      pdfEstimatedPages: document.getElementById('pdfEstimatedPages'),
      pdfProgressBar: document.getElementById('pdfProgressBar'),
      pdfProgressStatus: document.getElementById('pdfProgressStatus'),
      btnDownloadIcon: document.getElementById('btnDownloadIcon'),
      btnDownloadLabel: document.getElementById('btnDownloadLabel')
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
      const hasFiles = Array.isArray(sub.dataFiles) && sub.dataFiles.length > 0;
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
              ${sub.faculty && sub.faculty.length > 0 ? `<span style="color:var(--text-muted); font-size:11px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:175px;" title="${sub.faculty.join(', ')}">${sub.faculty.join(', ')}</span>` : ''}
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

    // Auto-transition to questions list on mobile
    if (window.innerWidth <= 768) {
      switchMobileView('questions');
    }
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
        if (window.innerWidth <= 768) {
          switchMobileView('sheet');
        }
      });
    }

    dom.questionList.querySelectorAll('.question-item-card[data-qid]').forEach(card => {
      card.addEventListener('click', () => {
        state.activeQuestionId = card.getAttribute('data-qid');
        renderQuestionList();
        renderA4Sheet();
        if (window.innerWidth <= 768) {
          switchMobileView('sheet');
        }
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
    state.zoomLevel = Math.max(0.25, Math.min(2.5, parseFloat(newZoom.toFixed(2))));
    if (dom.a4Scaler) {
      dom.a4Scaler.style.transform = `scale(${state.zoomLevel})`;
    }
    if (dom.zoomLevelBadge) {
      dom.zoomLevelBadge.textContent = `${Math.round(state.zoomLevel * 100)}%`;
    }
  }

  function fitToWidth() {
    if (!dom.deskCanvas) return;
    const isMobile = window.innerWidth <= 768;
    // On mobile, deskCanvas has 6px padding on each side (total 12px)
    const padding = isMobile ? 16 : 80;
    const canvasWidth = dom.deskCanvas.clientWidth - padding;
    // Standard A4 width in pixels approx 794px at 96dpi (210mm)
    const a4PxWidth = 794;
    const targetZoom = Math.max(0.3, canvasWidth / a4PxWidth);
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

  function openPdfModal(forceSingle = false) {
    if (!state.activeSubjectData) {
      showToast('No document loaded to export', 'error');
      return;
    }

    // Default Sanitized Filename
    const rawSubject = state.activeSubjectData.subject || state.activeSubjectSlug || 'BBA_Exam';
    const cleanName = rawSubject.replace(/[^a-zA-Z0-9_-]/g, '_').replace(/_+/g, '_');
    const code = state.activeSubjectData.subjectCode || '';
    const defaultName = code ? `${code}_${cleanName}_Answers` : `${cleanName}_Answers`;

    if (dom.pdfFileNameInput) {
      dom.pdfFileNameInput.value = defaultName;
    }

    const qCount = state.activeSubjectData.questions ? state.activeSubjectData.questions.length : 0;
    if (dom.pdfFullSubjectCount) {
      dom.pdfFullSubjectCount.textContent = `All ${qCount} questions consecutively in A4 pages`;
    }

    if (dom.radioScopeSingle && dom.pdfSingleQuestionDesc) {
      if (state.activeQuestionId) {
        const q = state.activeSubjectData.questions.find(x => x.id === state.activeQuestionId);
        dom.radioScopeSingle.disabled = false;
        if (forceSingle) {
          dom.radioScopeSingle.checked = true;
        }
        dom.pdfSingleQuestionDesc.textContent = q ? `${q.questionNumber || 'Q'}: ${q.questionText.slice(0, 45)}...` : 'Selected question';
      } else {
        dom.radioScopeFull.checked = true;
        dom.radioScopeSingle.disabled = true;
        dom.pdfSingleQuestionDesc.textContent = 'No single question selected (viewing full sheet)';
      }
    }

    updateEstimatedPageCount();

    if (dom.pdfProgressBar) dom.pdfProgressBar.style.display = 'none';
    if (dom.btnPdfModalDownload) dom.btnPdfModalDownload.disabled = false;
    if (dom.btnDownloadLabel) dom.btnDownloadLabel.textContent = 'Download PDF';
    if (dom.btnDownloadIcon) dom.btnDownloadIcon.textContent = '⬇️';

    if (dom.pdfModalBackdrop) {
      dom.pdfModalBackdrop.style.display = 'flex';
      setTimeout(() => {
        if (dom.pdfFileNameInput) dom.pdfFileNameInput.focus();
      }, 50);
    }
  }

  function closePdfModal() {
    if (dom.pdfModalBackdrop) {
      dom.pdfModalBackdrop.style.display = 'none';
    }
  }

  function updateEstimatedPageCount() {
    if (!dom.pdfEstimatedPages || !state.activeSubjectData) return;
    const isSingle = dom.radioScopeSingle && dom.radioScopeSingle.checked;
    if (isSingle) {
      dom.pdfEstimatedPages.textContent = '1 Page';
    } else {
      const qCount = state.activeSubjectData.questions ? state.activeSubjectData.questions.length : 0;
      const estPages = Math.max(1, Math.ceil(qCount / 4.5));
      dom.pdfEstimatedPages.textContent = `~${estPages} Pages`;
    }
  }

  async function downloadDirectPdf() {
    if (!state.activeSubjectData) {
      showToast('No document loaded to export', 'error');
      return;
    }

    if (typeof html2pdf === 'undefined') {
      showToast('PDF generator library loading, please try again in a moment', 'error');
      return;
    }

    let filename = dom.pdfFileNameInput ? dom.pdfFileNameInput.value.trim() : '';
    if (!filename) filename = 'BBA_Exam_Answers';
    if (!filename.toLowerCase().endsWith('.pdf')) {
      filename += '.pdf';
    }

    const isSingle = dom.radioScopeSingle && dom.radioScopeSingle.checked;
    const targetQId = isSingle ? state.activeQuestionId : null;

    if (dom.btnPdfModalDownload) dom.btnPdfModalDownload.disabled = true;
    if (dom.btnDownloadLabel) dom.btnDownloadLabel.textContent = 'Compiling PDF...';
    if (dom.btnDownloadIcon) dom.btnDownloadIcon.textContent = '⏳';
    if (dom.pdfProgressBar) dom.pdfProgressBar.style.display = 'flex';
    if (dom.pdfProgressStatus) dom.pdfProgressStatus.textContent = 'Rendering vector A4 pages...';

    const cleanHtml = window.GTURenderer.renderDocument(state.activeSubjectData, targetQId);

    const printStage = document.createElement('div');
    printStage.className = 'gtu-sheet-container';
    printStage.style.position = 'fixed';
    printStage.style.left = '-9999px';
    printStage.style.top = '0';
    printStage.style.width = '210mm';
    printStage.style.background = '#ffffff';
    printStage.style.color = '#000000';
    printStage.style.fontFamily = '"Times New Roman", Times, serif';
    printStage.style.zIndex = '-9999';
    printStage.innerHTML = cleanHtml;

    printStage.querySelectorAll('.gtu-a4-sheet').forEach(sheet => {
      sheet.style.boxShadow = 'none';
      sheet.style.margin = '0 auto';
      sheet.style.borderRadius = '0';
      sheet.style.border = 'none';
    });

    document.body.appendChild(printStage);

    const opt = {
      margin: 0,
      filename: filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        letterRendering: true,
        backgroundColor: '#ffffff',
        scrollY: 0,
        scrollX: 0
      },
      jsPDF: {
        unit: 'mm',
        format: 'a4',
        orientation: 'portrait'
      },
      pagebreak: {
        mode: ['css', 'legacy'],
        avoid: ['.gtu-answer-block', '.gtu-table-wrapper', '.gtu-page-header', '.gtu-question-title-bar']
      }
    };

    try {
      await html2pdf().set(opt).from(printStage).save();
      showToast(`Downloaded: ${filename}`);
      closePdfModal();
    } catch (err) {
      console.error('PDF export error:', err);
      showToast(`Download error: ${err.message}`, 'error');
      if (dom.btnPdfModalDownload) dom.btnPdfModalDownload.disabled = false;
      if (dom.btnDownloadLabel) dom.btnDownloadLabel.textContent = 'Retry Download';
      if (dom.btnDownloadIcon) dom.btnDownloadIcon.textContent = '⬇️';
      if (dom.pdfProgressBar) dom.pdfProgressBar.style.display = 'none';
    } finally {
      if (printStage.parentNode) {
        printStage.parentNode.removeChild(printStage);
      }
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

    // Mobile Bottom Navigation Switcher
    if (dom.mobileNavItems) {
      dom.mobileNavItems.forEach(item => {
        item.addEventListener('click', () => {
          const view = item.getAttribute('data-view');
          switchMobileView(view);
        });
      });
    }

    // Mobile Toolbar Actions
    if (dom.btnMobileBackToQuestions) {
      dom.btnMobileBackToQuestions.addEventListener('click', () => {
        switchMobileView('questions');
      });
    }

    // Direct PDF Export Modal Triggers
    if (dom.btnOpenPdfModal) {
      dom.btnOpenPdfModal.addEventListener('click', () => openPdfModal());
    }
    if (dom.btnMobileDownload) {
      dom.btnMobileDownload.addEventListener('click', () => openPdfModal());
    }
    if (dom.btnPdfModalClose) {
      dom.btnPdfModalClose.addEventListener('click', closePdfModal);
    }
    if (dom.btnPdfModalCancel) {
      dom.btnPdfModalCancel.addEventListener('click', closePdfModal);
    }
    if (dom.pdfModalBackdrop) {
      dom.pdfModalBackdrop.addEventListener('click', (e) => {
        if (e.target === dom.pdfModalBackdrop) closePdfModal();
      });
    }
    if (dom.btnPdfModalDownload) {
      dom.btnPdfModalDownload.addEventListener('click', downloadDirectPdf);
    }
    if (dom.radioScopeFull) {
      dom.radioScopeFull.addEventListener('change', updateEstimatedPageCount);
    }
    if (dom.radioScopeSingle) {
      dom.radioScopeSingle.addEventListener('change', updateEstimatedPageCount);
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

    // Keyboard shortcuts (Ctrl+P opens PDF confirmation modal, Escape closes it)
    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        openPdfModal();
      } else if (e.key === 'Escape') {
        closePdfModal();
      }
    });

    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        if (window.innerWidth <= 768 && state.mobileView === 'sheet') {
          fitToWidth();
        } else if (state.zoomLevel < 0.6) {
          fitToWidth();
        }
      }, 100);
    });

    window.addEventListener('orientationchange', () => {
      setTimeout(() => {
        if (window.innerWidth <= 768 && state.mobileView === 'sheet') {
          fitToWidth();
        }
      }, 200);
    });

    window.addEventListener('beforeprint', () => {
      if (dom.a4Scaler) {
        dom.a4Scaler.style.transform = 'none';
      }
    });

    window.addEventListener('afterprint', () => {
      if (dom.a4Scaler) {
        dom.a4Scaler.style.transform = `scale(${state.zoomLevel})`;
      }
    });
  }

  function switchMobileView(viewName) {
    state.mobileView = viewName;
    document.body.setAttribute('data-mobile-view', viewName);

    if (dom.mobileNavItems) {
      dom.mobileNavItems.forEach(item => {
        item.classList.toggle('active', item.getAttribute('data-view') === viewName);
      });
    }

    if (viewName === 'sheet') {
      requestAnimationFrame(() => {
        fitToWidth();
      });
    } else if (viewName === 'questions') {
      if (dom.sidebarSubjectsPanel) dom.sidebarSubjectsPanel.style.display = 'none';
      if (dom.sidebarQuestionsPanel) dom.sidebarQuestionsPanel.style.display = 'flex';
    } else if (viewName === 'subjects') {
      if (dom.sidebarSubjectsPanel) dom.sidebarSubjectsPanel.style.display = 'flex';
      if (dom.sidebarQuestionsPanel) dom.sidebarQuestionsPanel.style.display = 'none';
    }
  }

  // Application Entry Point
  document.addEventListener('DOMContentLoaded', () => {
    initDomRefs();
    attachEventListeners();
    loadInitialData();

    // Auto-fit on mobile if loaded directly
    if (window.innerWidth <= 768) {
      switchMobileView('subjects');
    }
  });

})();
