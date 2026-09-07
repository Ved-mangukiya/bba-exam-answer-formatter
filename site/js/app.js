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
    theme: (function() {
      try {
        return localStorage.getItem('gtu_theme') || 'light';
      } catch (e) {
        return 'light';
      }
    })(),
    compiledPdfBlob: null,
    compiledPdfUrl: null,
    compiledFilename: null,
    // 10 SPI Study Schedule State
    scheduleData: null,
    activeScheduleDayId: null,
    scheduleFilter: 'all',
    checkedQuestions: (function() {
      try {
        const raw = localStorage.getItem('gtu_checked_questions');
        return raw ? new Set(JSON.parse(raw)) : new Set();
      } catch (e) {
        return new Set();
      }
    })(),
    completedDays: (function() {
      try {
        const raw = localStorage.getItem('gtu_completed_days');
        return raw ? new Set(JSON.parse(raw)) : new Set();
      } catch (e) {
        return new Set();
      }
    })()
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
      tabSchedule: document.getElementById('tabSchedule'),
      sidebarSubjectsPanel: document.getElementById('sidebarSubjectsPanel'),
      sidebarQuestionsPanel: document.getElementById('sidebarQuestionsPanel'),
      sidebarSchedulePanel: document.getElementById('sidebarSchedulePanel'),
      btnHeaderSchedule: document.getElementById('btnHeaderSchedule'),
      scheduleOverallProgressBar: document.getElementById('scheduleOverallProgressBar'),
      scheduleProgressDaysLabel: document.getElementById('scheduleProgressDaysLabel'),
      scheduleProgressPercentLabel: document.getElementById('scheduleProgressPercentLabel'),
      scheduleTimelineList: document.getElementById('scheduleTimelineList'),
      scheduleTargetBanner: document.getElementById('scheduleTargetBanner'),
      scheduleBannerTitle: document.getElementById('scheduleBannerTitle'),
      scheduleBannerSubtitle: document.getElementById('scheduleBannerSubtitle'),
      btnExitScheduleFilter: document.getElementById('btnExitScheduleFilter'),
      toastContainer: document.getElementById('toastContainer'),
      mobileBottomNav: document.getElementById('mobileBottomNav'),
      mobileNavItems: document.querySelectorAll('.mobile-nav-item'),
      btnMobileBackToQuestions: document.getElementById('btnMobileBackToQuestions'),
      pdfModalBackdrop: document.getElementById('pdfModalBackdrop'),
      btnPdfModalClose: document.getElementById('btnPdfModalClose'),
      btnPdfModalCancel: document.getElementById('btnPdfModalCancel'),
      btnPdfModalDownload: document.getElementById('btnPdfModalDownload'),
      btnPdfOpenTab: document.getElementById('btnPdfOpenTab'),
      pdfFileNameInput: document.getElementById('pdfFileNameInput'),
      radioScopeFull: document.getElementById('radioScopeFull'),
      radioScopeSingle: document.getElementById('radioScopeSingle'),
      pdfFullSubjectCount: document.getElementById('pdfFullSubjectCount'),
      pdfSingleQuestionDesc: document.getElementById('pdfSingleQuestionDesc'),
      pdfEstimatedPages: document.getElementById('pdfEstimatedPages'),
      pdfProgressBar: document.getElementById('pdfProgressBar'),
      pdfProgressStatus: document.getElementById('pdfProgressStatus'),
      pdfReadyBox: document.getElementById('pdfReadyBox'),
      pdfReadyFilename: document.getElementById('pdfReadyFilename'),
      pdfReadyMeta: document.getElementById('pdfReadyMeta'),
      btnDownloadIcon: document.getElementById('btnDownloadIcon'),
      btnDownloadLabel: document.getElementById('btnDownloadLabel'),
      // Developer Info modal
      btnDevInfo: document.getElementById('btnDevInfo'),
      devInfoBackdrop: document.getElementById('devInfoBackdrop'),
      btnDevInfoClose: document.getElementById('btnDevInfoClose')
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
    state.scheduleData = await window.GTUDataLoader.getStudySchedule();
    renderSubjectList();
    renderSchedulePanel();
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
    let isFilteredBySchedule = false;

    if (state.activeScheduleDayId && state.scheduleData) {
      const activeDay = state.scheduleData.days.find(d => d.id === state.activeScheduleDayId);
      if (activeDay && activeDay.questionIds && activeDay.questionIds.length > 0) {
        const idSet = new Set(activeDay.questionIds);
        questions = questions.filter(q => idSet.has(q.id));
        isFilteredBySchedule = true;
      }
    } else if (state.activeUnitFilter !== 'ALL') {
      questions = questions.filter(q => q.unit === state.activeUnitFilter);
    }

    const fullSheetActive = state.activeQuestionId === null;

    let html = `
      <div class="question-item-card ${fullSheetActive ? 'active' : ''}" id="cardFullSheet">
        <div class="question-item-head">
          <span class="q-num-badge" style="color: ${isFilteredBySchedule ? '#10b981' : '#38bdf8'};">
            ${isFilteredBySchedule ? '🎯 Daily Target Sheet' : '📄 Full Subject Sheet'}
          </span>
          <span class="q-marks-pill">${questions.length} Questions</span>
        </div>
        <div class="question-item-text">
          ${isFilteredBySchedule ? "View and print only today's scheduled questions consecutively in A4 format." : 'View and print all questions consecutively in one complete A4 document.'}
        </div>
      </div>
    `;

    html += questions.map(q => {
      const isSel = state.activeQuestionId === q.id;
      const isChecked = state.checkedQuestions.has(q.id);
      return `
        <div class="question-item-card ${isSel ? 'active' : ''} ${isChecked ? 'is-checked' : ''}" data-qid="${q.id}">
          <div class="question-item-head">
            <div style="display: flex; align-items: center; gap: 6px;">
              <label class="question-check-box" title="${isChecked ? 'Marked as read' : 'Mark as read'}" onclick="event.stopPropagation();">
                <input type="checkbox" class="q-target-check" data-qid="${q.id}" ${isChecked ? 'checked' : ''}>
              </label>
              <span class="q-num-badge">${q.questionNumber || 'Q.'}</span>
            </div>
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

    dom.questionList.querySelectorAll('.q-target-check').forEach(chk => {
      chk.addEventListener('change', (e) => {
        e.stopPropagation();
        const qid = chk.getAttribute('data-qid');
        toggleQuestionCheck(qid);
      });
    });
  }

  function toggleQuestionCheck(qid) {
    if (state.checkedQuestions.has(qid)) {
      state.checkedQuestions.delete(qid);
    } else {
      state.checkedQuestions.add(qid);
      showToast('Question marked as studied! 🎯');
    }
    try {
      localStorage.setItem('gtu_checked_questions', JSON.stringify(Array.from(state.checkedQuestions)));
    } catch (e) {}
    renderQuestionList();
    renderSchedulePanel();

    if (window.FirebaseSync && typeof window.FirebaseSync.saveProgress === 'function') {
      window.FirebaseSync.saveProgress(state.checkedQuestions, state.completedDays);
    }
  }

  function toggleDayCompletion(dayId, isChecked) {
    if (isChecked) {
      state.completedDays.add(dayId);
      showToast('Day completed! Keep up the 10 SPI pace! 🚀');
    } else {
      state.completedDays.delete(dayId);
    }
    try {
      localStorage.setItem('gtu_completed_days', JSON.stringify(Array.from(state.completedDays)));
    } catch (e) {}
    renderSchedulePanel();

    if (window.FirebaseSync && typeof window.FirebaseSync.saveProgress === 'function') {
      window.FirebaseSync.saveProgress(state.checkedQuestions, state.completedDays);
    }
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
            Or select <strong>General and Communicative English</strong> or <strong>Principles of Management</strong> from the sidebar.
          </p>
        </div>
      `;
      setupCanvasDropzone();
      updateViewLabels();
      return;
    }

    let targetQuestionScope = state.activeQuestionId;
    if (targetQuestionScope === null && state.activeScheduleDayId && state.scheduleData) {
      const activeDay = state.scheduleData.days.find(d => d.id === state.activeScheduleDayId);
      if (activeDay && activeDay.questionIds && activeDay.questionIds.length > 0) {
        targetQuestionScope = activeDay.questionIds;
      }
    }

    const html = window.GTURenderer.renderDocument(state.activeSubjectData, targetQuestionScope);
    dom.a4Container.innerHTML = html;

    if (dom.deskCanvas) {
      dom.deskCanvas.scrollTop = 0;
    }

    applyZoomToScaler();
    updateViewLabels();
  }

  function updateViewLabels() {
    if (dom.currentViewModeLabel) {
      if (!state.activeSubjectData) {
        dom.currentViewModeLabel.textContent = 'Awaiting Content';
      } else if (state.activeQuestionId) {
        const q = state.activeSubjectData.questions.find(x => x.id === state.activeQuestionId);
        dom.currentViewModeLabel.textContent = q ? `${q.questionNumber} (${q.marks} Marks)` : 'Single Question View';
      } else if (state.activeScheduleDayId && state.scheduleData) {
        const activeDay = state.scheduleData.days.find(d => d.id === state.activeScheduleDayId);
        const count = activeDay && activeDay.questionIds ? activeDay.questionIds.length : 0;
        dom.currentViewModeLabel.textContent = `${activeDay ? activeDay.displayDate : 'Day'} Target (${count} Questions)`;
      } else {
        dom.currentViewModeLabel.textContent = `Full Subject (${state.activeSubjectData.questions ? state.activeSubjectData.questions.length : 0} Questions)`;
      }
    }
  }

  function switchSidebarTab(tabName) {
    state.activeTab = tabName;
    if (dom.tabSubjects) dom.tabSubjects.classList.toggle('active', tabName === 'subjects');
    if (dom.tabQuestions) dom.tabQuestions.classList.toggle('active', tabName === 'questions');
    if (dom.tabSchedule) dom.tabSchedule.classList.toggle('active', tabName === 'schedule');

    if (dom.sidebarSubjectsPanel) dom.sidebarSubjectsPanel.style.display = (tabName === 'subjects') ? 'flex' : 'none';
    if (dom.sidebarQuestionsPanel) dom.sidebarQuestionsPanel.style.display = (tabName === 'questions') ? 'flex' : 'none';
    if (dom.sidebarSchedulePanel) dom.sidebarSchedulePanel.style.display = (tabName === 'schedule') ? 'flex' : 'none';
  }

  async function selectScheduleDay(dayId) {
    if (!state.scheduleData) return;
    const day = state.scheduleData.days.find(d => d.id === dayId);
    if (!day) return;

    state.activeScheduleDayId = dayId;

    if (day.isExternalOrPending) {
      showToast(`${day.subjectName} is scheduled for ${day.displayDate}`, 'info');
      await selectSubject(day.subjectSlug);
      if (dom.scheduleTargetBanner) {
        dom.scheduleTargetBanner.style.display = 'flex';
        if (dom.scheduleBannerTitle) dom.scheduleBannerTitle.textContent = `${day.displayDate}: ${day.title}`;
        if (dom.scheduleBannerSubtitle) dom.scheduleBannerSubtitle.textContent = day.pendingMessage || day.targetSummary;
      }
      switchSidebarTab('schedule');
      renderSchedulePanel();
      return;
    }

    if (state.activeSubjectSlug !== day.subjectSlug) {
      await selectSubject(day.subjectSlug);
    }

    state.activeUnitFilter = 'ALL';
    state.activeQuestionId = null;

    if (dom.scheduleTargetBanner) {
      dom.scheduleTargetBanner.style.display = 'flex';
      if (dom.scheduleBannerTitle) dom.scheduleBannerTitle.textContent = `${day.displayDate}: ${day.title}`;
      if (dom.scheduleBannerSubtitle) dom.scheduleBannerSubtitle.textContent = `Target: ${day.targetSummary} • Est: ${day.estHours} hrs`;
    }

    renderUnitFilters();
    renderQuestionList();
    renderA4Sheet();

    switchSidebarTab('questions');
    if (window.innerWidth <= 768) {
      switchMobileView('questions');
    }
    showToast(`Loaded ${day.displayDate} target questions!`);
  }

  function exitScheduleFilter() {
    state.activeScheduleDayId = null;
    if (dom.scheduleTargetBanner) {
      dom.scheduleTargetBanner.style.display = 'none';
    }
    renderUnitFilters();
    renderQuestionList();
    renderA4Sheet();
    showToast('Showing all questions for ' + (state.activeSubjectData ? state.activeSubjectData.subject : 'subject'));
  }

  function renderSchedulePanel() {
    if (!dom.sidebarSchedulePanel || !state.scheduleData) return;

    const data = state.scheduleData;
    const totalDays = data.days.length;
    const completedCount = state.completedDays.size;
    const pct = Math.round((completedCount / totalDays) * 100);

    if (dom.scheduleOverallProgressBar) {
      dom.scheduleOverallProgressBar.style.width = `${pct}%`;
    }
    if (dom.scheduleProgressDaysLabel) {
      dom.scheduleProgressDaysLabel.textContent = `${completedCount} of ${totalDays} Days Done`;
    }
    if (dom.scheduleProgressPercentLabel) {
      dom.scheduleProgressPercentLabel.textContent = `${pct}%`;
    }

    if (!dom.scheduleTimelineList) return;

    if (state.scheduleFilter === 'exams') {
      let html = `
        <div style="font-size: 11.5px; color: var(--text-muted); margin-bottom: 8px; line-height: 1.4;">
          <strong>GTU Semester 1 Examination Schedule</strong> (Morning Papers • 10:30 AM to 1:00 PM)
        </div>
      `;
      html += data.timetable.map((item, idx) => {
        const reviewItem = data.examWeekReview ? data.examWeekReview.find(r => r.examDate === item.date) : null;
        return `
          <div class="schedule-day-card" style="border-left: 3px solid #6366f1;">
            <div class="schedule-day-head">
              <span class="schedule-date-chip" style="background: rgba(99,102,241,0.15); color: #6366f1;">${item.date} (${item.dayName.slice(0,3)})</span>
              <span class="schedule-hours-pill" style="color: #6366f1; font-weight: 700;">Paper ${idx + 1}</span>
            </div>
            <div class="schedule-day-subject">
              <span class="schedule-sub-badge">${item.shortCode}</span>
              <span class="schedule-sub-name">${item.subject}</span>
            </div>
            <div class="schedule-day-target-info" style="font-family: var(--font-mono); color: var(--text-secondary); margin-bottom: 6px;">
              Exam Code: <strong>${item.code}</strong> • ${item.timing}
            </div>
            ${reviewItem && reviewItem.eveningSubject !== 'Celebration & Review' ? `
              <div style="font-size: 11px; padding: 6px 8px; background: rgba(16,185,129,0.06); border-radius: 4px; border: 1px dashed rgba(16,185,129,0.3); color: var(--text-secondary);">
                🌙 <strong>Post-Exam Evening Plan (4.0 hrs):</strong><br>
                ${reviewItem.task}
              </div>
            ` : `
              <div style="font-size: 11px; padding: 6px 8px; background: rgba(245,158,11,0.1); border-radius: 4px; color: #b45309;">
                🎉 <strong>Semester-1 Complete!</strong> Target 10 SPI Achieved!
              </div>
            `}
          </div>
        `;
      }).join('');
      dom.scheduleTimelineList.innerHTML = html;
      return;
    }

    let daysToRender = data.days;
    if (state.scheduleFilter === 'pending') {
      daysToRender = daysToRender.filter(d => !state.completedDays.has(d.id));
    }

    if (daysToRender.length === 0) {
      dom.scheduleTimelineList.innerHTML = `
        <div style="text-align: center; padding: 24px; color: var(--text-secondary); font-size: 12px;">
          🎉 All scheduled days completed! You are ready for a 10 CGPA / 10 SPI!
        </div>
      `;
      return;
    }

    dom.scheduleTimelineList.innerHTML = daysToRender.map(day => {
      const isCompleted = state.completedDays.has(day.id);
      const isActiveDay = state.activeScheduleDayId === day.id;
      const qCount = day.questionIds ? day.questionIds.length : 0;
      const checkedInDay = (day.questionIds || []).filter(qid => state.checkedQuestions.has(qid)).length;

      return `
        <div class="schedule-day-card ${isActiveDay ? 'active-target' : ''} ${isCompleted ? 'is-completed' : ''}" data-day-id="${day.id}">
          <div class="schedule-day-head">
            <span class="schedule-date-chip">${day.displayDate}</span>
            <span class="schedule-hours-pill">⏱ ${day.estHours} hrs</span>
          </div>

          <div class="schedule-day-subject">
            <span class="schedule-sub-badge">${day.subjectCode}</span>
            <span class="schedule-sub-name">${day.subjectName}</span>
          </div>

          <div class="schedule-day-title">${day.title}</div>
          <div class="schedule-day-target-info">
            🎯 Target: <strong>${day.targetSummary}</strong>
            ${qCount > 0 ? ` • <span style="color:${checkedInDay === qCount ? '#10b981' : 'inherit'};">${checkedInDay}/${qCount} read</span>` : ''}
          </div>

          ${day.tips ? `
            <div style="font-size: 11px; color: var(--text-muted); font-style: italic; margin-bottom: 8px; line-height: 1.35; padding-left: 6px; border-left: 2px solid rgba(99,102,241,0.3);">
              💡 <strong>10 SPI Tip:</strong> ${day.tips}
            </div>
          ` : ''}

          <div class="schedule-day-actions">
            <label class="schedule-check-label" onclick="event.stopPropagation();">
              <input type="checkbox" class="schedule-check-input" data-day-id="${day.id}" ${isCompleted ? 'checked' : ''}>
              <span>${isCompleted ? 'Completed ✓' : 'Mark Done'}</span>
            </label>

            <button class="btn-schedule-view" data-day-id="${day.id}">
              ${day.isExternalOrPending ? 'View Details →' : '📖 Read Target →'}
            </button>
          </div>
        </div>
      `;
    }).join('');

    dom.scheduleTimelineList.querySelectorAll('.schedule-day-card').forEach(card => {
      card.addEventListener('click', () => {
        const dayId = card.getAttribute('data-day-id');
        selectScheduleDay(dayId);
      });
    });

    dom.scheduleTimelineList.querySelectorAll('.btn-schedule-view').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const dayId = btn.getAttribute('data-day-id');
        selectScheduleDay(dayId);
      });
    });

    dom.scheduleTimelineList.querySelectorAll('.schedule-check-input').forEach(chk => {
      chk.addEventListener('change', (e) => {
        e.stopPropagation();
        const dayId = chk.getAttribute('data-day-id');
        toggleDayCompletion(dayId, chk.checked);
      });
    });
  }

  function applyZoomToScaler(instant = false) {
    if (!dom.a4Scaler || !dom.a4Container) return;

    const zoomVal = state.zoomLevel;

    // Always use transform:scale so CSS transition works (CSS zoom is not animatable).
    // We compensate the layout footprint via an explicit height on the scaler wrapper
    // so the desk-canvas scroll area stays accurate.
    if (instant) {
      dom.a4Scaler.classList.add('zoom-instant');
    } else {
      dom.a4Scaler.classList.remove('zoom-instant');
    }

    // Clear any residual CSS zoom from old code
    dom.a4Scaler.style.zoom = '';

    dom.a4Scaler.style.transform = `scale(${zoomVal})`;
    dom.a4Scaler.style.transformOrigin = 'top center';

    // Compensate layout footprint so the scrollable desk area reflects actual size
    const unscaledH = dom.a4Container.offsetHeight || dom.a4Container.scrollHeight;
    const unscaledW = dom.a4Container.offsetWidth || 794;
    dom.a4Scaler.style.height = `${Math.ceil(unscaledH * zoomVal)}px`;
    dom.a4Scaler.style.width  = `${Math.ceil(unscaledW * zoomVal)}px`;

    // After the transition, re-sync the height exactly (transition may have been skipped)
    if (!instant) {
      clearTimeout(dom.a4Scaler._zoomSyncTimer);
      dom.a4Scaler._zoomSyncTimer = setTimeout(() => {
        const h = dom.a4Container.offsetHeight || dom.a4Container.scrollHeight;
        const w = dom.a4Container.offsetWidth || 794;
        dom.a4Scaler.style.height = `${Math.ceil(h * zoomVal)}px`;
        dom.a4Scaler.style.width  = `${Math.ceil(w * zoomVal)}px`;
      }, 260);
    }
  }

  function setZoom(newZoom, instant = false) {
    state.zoomLevel = Math.max(0.25, Math.min(2.5, parseFloat(newZoom.toFixed(2))));
    applyZoomToScaler(instant);
    if (dom.zoomLevelBadge) {
      dom.zoomLevelBadge.textContent = `${Math.round(state.zoomLevel * 100)}%`;
    }
  }

  function fitToWidth() {
    if (!dom.deskCanvas) return;
    const isMobile = window.innerWidth <= 768;
    const padding = isMobile ? 16 : 80;
    const canvasWidth = dom.deskCanvas.clientWidth - padding;
    const a4PxWidth = 794;
    const targetZoom = Math.max(0.3, canvasWidth / a4PxWidth);
    setZoom(targetZoom); // animated — same smooth ease as +/-
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

  function applyTheme() {
    const isLight = state.theme === 'light';
    document.body.classList.toggle('theme-light', isLight);
    if (dom.btnThemeToggle) {
      dom.btnThemeToggle.textContent = isLight ? '🌙' : '☀️';
      dom.btnThemeToggle.title = isLight ? 'Switch to Midnight Dark Theme' : 'Switch to Ivory Golden Theme';
    }
  }

  function toggleTheme() {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    applyTheme();
    try {
      localStorage.setItem('gtu_theme', state.theme);
    } catch (e) {}
    showToast(state.theme === 'light' ? 'Ivory & Gold theme enabled' : 'Midnight Dark theme enabled');
  }

  function openPdfModal(forceSingle = false) {
    if (!state.activeSubjectData) {
      showToast('No document loaded to export', 'error');
      return;
    }

    // Reset compiled cache for a fresh session
    state.compiledPdfBlob = null;
    if (state.compiledPdfUrl) {
      try { URL.revokeObjectURL(state.compiledPdfUrl); } catch (e) {}
      state.compiledPdfUrl = null;
    }
    state.compiledFilename = null;

    // Default Sanitized Filename
    const rawSubject = state.activeSubjectData.subject || state.activeSubjectSlug || 'BBA_Exam';
    const cleanName = rawSubject.replace(/[^a-zA-Z0-9_-]/g, '_').replace(/_+/g, '_');
    const code = state.activeSubjectData.subjectCode || '';
    const defaultName = code ? `${code}_${cleanName}_Answers` : `${cleanName}_Answers`;

    if (dom.pdfFileNameInput) {
      dom.pdfFileNameInput.value = defaultName;
      dom.pdfFileNameInput.disabled = false;
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

    // Reset UI elements
    if (dom.pdfReadyBox) dom.pdfReadyBox.style.display = 'none';
    if (dom.pdfProgressBar) dom.pdfProgressBar.style.display = 'none';
    if (dom.btnPdfOpenTab) dom.btnPdfOpenTab.style.display = 'none';

    if (dom.btnPdfModalDownload) {
      dom.btnPdfModalDownload.disabled = false;
      dom.btnPdfModalDownload.className = 'btn btn-primary btn-save-action';
    }
    if (dom.btnDownloadLabel) dom.btnDownloadLabel.textContent = 'Generate A4 PDF';
    if (dom.btnDownloadIcon) dom.btnDownloadIcon.textContent = '⬇️';
    if (dom.btnPdfModalCancel) dom.btnPdfModalCancel.textContent = 'Cancel';

    if (dom.pdfModalBackdrop) {
      dom.pdfModalBackdrop.style.display = 'flex';
      setTimeout(() => {
        if (dom.pdfFileNameInput) {
          dom.pdfFileNameInput.focus();
          dom.pdfFileNameInput.select();
        }
      }, 60);
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

  /**
   * Saves the compiled PDF to disk using a fresh, active user gesture.
   * On Windows Chrome/Edge, leverages showSaveFilePicker to guarantee the exact filename and .pdf association.
   * On other platforms, uses an in-DOM layout anchor tag with active user gesture.
   */
  async function saveCompiledPdfToDisk() {
    if (!state.compiledPdfBlob || !state.compiledFilename) return;

    const finalFilename = state.compiledFilename;
    const pdfBlob = state.compiledPdfBlob;

    // 1. If File System Access API is supported (Desktop Edge & Chrome on Windows)
    if (typeof window.showSaveFilePicker === 'function') {
      try {
        const fileHandle = await window.showSaveFilePicker({
          suggestedName: finalFilename,
          types: [{
            description: 'PDF Document (*.pdf)',
            accept: { 'application/pdf': ['.pdf'] }
          }]
        });
        const writable = await fileHandle.createWritable();
        await writable.write(pdfBlob);
        await writable.close();
        showToast(`Saved: ${finalFilename}`);
        closePdfModal();
        return;
      } catch (err) {
        if (err.name === 'AbortError') {
          // User closed the file picker dialog
          return;
        }
        console.warn('showSaveFilePicker error, falling back to anchor:', err);
      }
    }

    // 2. Reliable Anchor Trigger with DOM Layout Object
    // CRITICAL: NEVER use style.display = 'none'! In Chromium, elements without layout drop the download attribute!
    const downloadLink = document.createElement('a');
    downloadLink.href = state.compiledPdfUrl;
    downloadLink.download = finalFilename;
    downloadLink.rel = 'noopener';
    downloadLink.setAttribute('download', finalFilename);
    downloadLink.style.position = 'fixed';
    downloadLink.style.top = '0';
    downloadLink.style.left = '0';
    downloadLink.style.width = '2px';
    downloadLink.style.height = '2px';
    downloadLink.style.opacity = '0.01';
    downloadLink.style.pointerEvents = 'none';
    downloadLink.style.zIndex = '-99999';
    document.body.appendChild(downloadLink);

    try {
      const clickEvt = new MouseEvent('click', { bubbles: true, cancelable: true, view: window });
      downloadLink.dispatchEvent(clickEvt);
    } catch (e) {
      downloadLink.click();
    }
    showToast(`Downloaded: ${finalFilename}`);
    closePdfModal();

    setTimeout(() => {
      if (downloadLink.parentNode) downloadLink.parentNode.removeChild(downloadLink);
    }, 20000);
  }

  /**
   * PDF Generation — one html2canvas capture per .gtu-a4-sheet → jsPDF assembly.
   * Each sheet is briefly mounted at position (0,0) z-index:1, hidden behind the
   * modal backdrop (z-index ~1000). This guarantees getBoundingClientRect() returns
   * positive coords so html2canvas captures actual content, not off-screen whitespace.
   */
  async function downloadDirectPdf() {
    if (!state.activeSubjectData) {
      showToast('No document loaded to export', 'error');
      return;
    }

    // Already compiled → second click saves to disk
    if (state.compiledPdfBlob && state.compiledFilename) {
      await saveCompiledPdfToDisk();
      return;
    }

    if (typeof html2canvas === 'undefined' || typeof window.jspdf === 'undefined') {
      showToast('PDF engine loading, please try again in a moment', 'error');
      return;
    }

    // 1. Sanitize filename
    let rawName = dom.pdfFileNameInput ? dom.pdfFileNameInput.value.trim() : '';
    if (!rawName) {
      const subj = state.activeSubjectData.subject || state.activeSubjectSlug || 'BBA_Exam';
      rawName = `${subj}_Answers`;
    }
    let cleanFilename = rawName.replace(/[<>:"/\\|?*\x00-\x1F]/g, '_').trim();
    cleanFilename = cleanFilename.replace(/\.pdf$/i, '');
    if (!cleanFilename) cleanFilename = 'BBA_Exam_Answers';
    const finalFilename = `${cleanFilename}.pdf`;

    // 2. Scope
    const isSingle = dom.radioScopeSingle && dom.radioScopeSingle.checked;
    let targetQId = isSingle ? state.activeQuestionId : null;
    if (!isSingle && targetQId === null && state.activeScheduleDayId && state.scheduleData) {
      const activeDay = state.scheduleData.days.find(d => d.id === state.activeScheduleDayId);
      if (activeDay && activeDay.questionIds && activeDay.questionIds.length > 0) {
        targetQId = activeDay.questionIds;
      }
    }

    // 3. UI feedback
    if (dom.btnPdfModalDownload) dom.btnPdfModalDownload.disabled = true;
    if (dom.btnDownloadLabel) dom.btnDownloadLabel.textContent = 'Rendering Pages...';
    if (dom.btnDownloadIcon) dom.btnDownloadIcon.textContent = '⏳';
    if (dom.pdfProgressBar) dom.pdfProgressBar.style.display = 'flex';
    if (dom.pdfProgressStatus) dom.pdfProgressStatus.textContent = 'Preparing A4 sheets...';
    if (dom.pdfFileNameInput) dom.pdfFileNameInput.disabled = true;

    // 4. Render document HTML via the GTU engine
    const cleanHtml = window.GTURenderer.renderDocument(state.activeSubjectData, targetQId);

    // Parse into a detached div to extract individual sheets
    const parseDiv = document.createElement('div');
    parseDiv.innerHTML = cleanHtml;
    const rawSheets = Array.from(parseDiv.querySelectorAll('.gtu-a4-sheet'));

    let activeFrame = null; // track the current capture frame for cleanup on error
    try {
      if (rawSheets.length === 0) throw new Error('No A4 sheets found — document may be empty.');

      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait', compress: true });

      // Capture each .gtu-a4-sheet (usually one tall sheet with all questions),
      // then SLICE the resulting canvas into 297mm-height segments.
      // Each segment becomes one A4 page in the PDF.
      // This is the core fix: the renderer makes one big tall div; we split it here.
      let totalPdfPages = 0;

      for (let i = 0; i < rawSheets.length; i++) {
        if (dom.pdfProgressStatus) {
          dom.pdfProgressStatus.textContent = `Rendering content... (sheet ${i + 1}/${rawSheets.length})`;
        }

        // Mount at (0,0) so getBoundingClientRect gives positive coords for html2canvas
        activeFrame = document.createElement('div');
        activeFrame.style.cssText = [
          'position:fixed', 'top:0', 'left:0',
          'width:210mm', 'height:auto',
          'overflow:visible',
          'pointer-events:none',
          'z-index:1',
          'background:#ffffff',
          'margin:0', 'padding:0'
        ].join(';');

        const sheetClone = rawSheets[i].cloneNode(true);
        // NO min-height — let the sheet be exactly as tall as its content
        sheetClone.style.cssText = [
          'width:210mm',
          'padding:20mm 15mm 20mm 20mm',
          'box-sizing:border-box',
          'background:#ffffff', 'color:#000000',
          'font-family:"Times New Roman",Times,serif',
          'margin:0', 'border:none',
          'box-shadow:none', 'border-radius:0',
          'overflow:visible', 'display:block'
        ].join(';');

        activeFrame.appendChild(sheetClone);
        document.body.appendChild(activeFrame);

        // Let browser fully lay out before measuring
        await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

        const sheetW = sheetClone.offsetWidth  || 794;
        const sheetH = sheetClone.offsetHeight || 1123;

        // Capture full height of the sheet at 2x scale
        const canvas = await html2canvas(sheetClone, {
          scale: 2,
          useCORS: true,
          allowTaint: false,
          backgroundColor: '#ffffff',
          width: sheetW,
          height: sheetH,
          windowWidth: sheetW,
          windowHeight: sheetH,
          scrollX: 0,
          scrollY: 0,
          logging: false
        });

        document.body.removeChild(activeFrame);
        activeFrame = null;

        // --- PAGE SLICING ---
        // 210mm wide at actual pixels → pixPerMm gives us 297mm in pixels
        const pixPerMm   = sheetW / 210;          // e.g. 794 / 210 ≈ 3.78 px/mm
        const onePagePx  = 297 * pixPerMm;        // physical px for one A4 page height
        const canvPageH  = Math.round(onePagePx * 2); // canvas height per page (scale:2)
        const numSlices  = Math.ceil(canvas.height / canvPageH);

        for (let p = 0; p < numSlices; p++) {
          if (dom.pdfProgressStatus) {
            dom.pdfProgressStatus.textContent =
              `Building page ${totalPdfPages + 1} (sheet ${i + 1}, slice ${p + 1}/${numSlices})...`;
          }

          const srcY = p * canvPageH;
          const srcH = Math.min(canvPageH, canvas.height - srcY);

          // Create a blank A4-canvas page and draw the slice into it
          const pageCanvas = document.createElement('canvas');
          pageCanvas.width  = canvas.width;
          pageCanvas.height = canvPageH; // always full A4 height (last page padded with white)
          const ctx = pageCanvas.getContext('2d');
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
          // drawImage 9-arg: crop srcY..srcY+srcH from canvas, draw at (0,0) in pageCanvas
          ctx.drawImage(canvas, 0, srcY, canvas.width, srcH, 0, 0, canvas.width, srcH);

          if (totalPdfPages > 0) pdf.addPage();
          pdf.addImage(pageCanvas.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
          totalPdfPages++;
        }
      }

      const pdfBlob = pdf.output('blob');
      if (!pdfBlob || pdfBlob.size < 5000) {
        throw new Error('PDF appears empty — content was not captured.');
      }

      state.compiledPdfBlob = pdfBlob;
      state.compiledFilename = finalFilename;
      state.compiledPdfUrl = URL.createObjectURL(new File([pdfBlob], finalFilename, { type: 'application/pdf' }));

      const sizeMb = (pdfBlob.size / (1024 * 1024)).toFixed(1);

      if (dom.pdfProgressBar) dom.pdfProgressBar.style.display = 'none';
      if (dom.pdfReadyBox) dom.pdfReadyBox.style.display = 'flex';
      if (dom.pdfReadyFilename) dom.pdfReadyFilename.textContent = finalFilename;
      if (dom.pdfReadyMeta) dom.pdfReadyMeta.textContent =
        `A4 PDF • ${totalPdfPages} page${totalPdfPages > 1 ? 's' : ''} • ${sizeMb} MB • GTU / SSASIT`;

      if (dom.btnPdfModalDownload) {
        dom.btnPdfModalDownload.disabled = false;
        dom.btnPdfModalDownload.className = 'btn btn-success btn-save-action';
      }
      if (dom.btnDownloadIcon) dom.btnDownloadIcon.textContent = '💾';
      if (dom.btnDownloadLabel) dom.btnDownloadLabel.textContent = 'Save PDF Document';
      if (dom.btnPdfOpenTab) dom.btnPdfOpenTab.style.display = 'inline-flex';
      if (dom.btnPdfModalCancel) dom.btnPdfModalCancel.textContent = 'Close';

      showToast(`PDF ready — ${totalPdfPages} page${totalPdfPages > 1 ? 's' : ''}, ${sizeMb} MB. Click Save.`);

    } catch (err) {
      console.error('PDF export error:', err);
      showToast(`PDF Error: ${err.message}`, 'error');
      if (dom.btnPdfModalDownload) {
        dom.btnPdfModalDownload.disabled = false;
        dom.btnPdfModalDownload.className = 'btn btn-primary btn-save-action';
      }
      if (dom.btnDownloadLabel) dom.btnDownloadLabel.textContent = 'Retry';
      if (dom.btnDownloadIcon) dom.btnDownloadIcon.textContent = '⬇️';
      if (dom.pdfProgressBar) dom.pdfProgressBar.style.display = 'none';
      if (dom.pdfFileNameInput) dom.pdfFileNameInput.disabled = false;
    } finally {
      // Safety cleanup — remove any frame that may still be attached on error
      if (activeFrame && activeFrame.parentNode) {
        activeFrame.parentNode.removeChild(activeFrame);
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
    // Zoom controls — all buttons animate smoothly; only initial load is instant
    if (dom.btnZoomIn)    dom.btnZoomIn.addEventListener('click',  () => setZoom(state.zoomLevel + 0.1));
    if (dom.btnZoomOut)   dom.btnZoomOut.addEventListener('click', () => setZoom(state.zoomLevel - 0.1));
    if (dom.btnZoomReset) dom.btnZoomReset.addEventListener('click', () => setZoom(1.0));
    if (dom.btnZoomFit)   dom.btnZoomFit.addEventListener('click', fitToWidth);

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
    if (dom.tabSubjects) dom.tabSubjects.addEventListener('click', () => switchSidebarTab('subjects'));
    if (dom.tabQuestions) dom.tabQuestions.addEventListener('click', () => switchSidebarTab('questions'));
    if (dom.tabSchedule) {
      dom.tabSchedule.addEventListener('click', () => {
        switchSidebarTab('schedule');
        renderSchedulePanel();
      });
    }

    // Header 10 SPI Schedule button
    if (dom.btnHeaderSchedule) {
      dom.btnHeaderSchedule.addEventListener('click', () => {
        switchSidebarTab('schedule');
        renderSchedulePanel();
        if (window.innerWidth <= 768) {
          switchMobileView('schedule');
        }
      });
    }

    // Exit Schedule Filter button on banner
    if (dom.btnExitScheduleFilter) {
      dom.btnExitScheduleFilter.addEventListener('click', exitScheduleFilter);
    }

    // Schedule Filter Tabs (All 13 Days / Pending / Exams)
    document.querySelectorAll('.schedule-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.schedule-filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.scheduleFilter = btn.getAttribute('data-filter');
        renderSchedulePanel();
      });
    });

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
    if (dom.btnPdfOpenTab) {
      dom.btnPdfOpenTab.addEventListener('click', () => {
        if (state.compiledPdfUrl) {
          window.open(state.compiledPdfUrl, '_blank');
        }
      });
    }
    if (dom.radioScopeFull) {
      dom.radioScopeFull.addEventListener('change', updateEstimatedPageCount);
    }
    if (dom.radioScopeSingle) {
      dom.radioScopeSingle.addEventListener('change', updateEstimatedPageCount);
    }

    // Developer Info modal
    function openDevInfo() {
      if (dom.devInfoBackdrop) dom.devInfoBackdrop.style.display = 'flex';
    }
    function closeDevInfo() {
      if (dom.devInfoBackdrop) dom.devInfoBackdrop.style.display = 'none';
    }
    if (dom.btnDevInfo) dom.btnDevInfo.addEventListener('click', openDevInfo);
    if (dom.btnDevInfoClose) dom.btnDevInfoClose.addEventListener('click', closeDevInfo);
    if (dom.devInfoBackdrop) {
      dom.devInfoBackdrop.addEventListener('click', (e) => {
        if (e.target === dom.devInfoBackdrop) closeDevInfo();
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
        openPdfModal();
      } else if (e.key === 'Escape') {
        closePdfModal();
        if (dom.devInfoBackdrop) dom.devInfoBackdrop.style.display = 'none';
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
        dom.a4Scaler.style.zoom = '1';
        dom.a4Scaler.style.width = 'auto';
        dom.a4Scaler.style.height = 'auto';
      }
    });

    window.addEventListener('afterprint', () => {
      applyZoomToScaler();
    });
  }

  let scalerResizeObserver = null;
  function initScalerObserver() {
    if (window.ResizeObserver && dom.a4Container) {
      scalerResizeObserver = new ResizeObserver(() => {
        applyZoomToScaler();
      });
      scalerResizeObserver.observe(dom.a4Container);
    }
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
      if (dom.sidebarSchedulePanel) dom.sidebarSchedulePanel.style.display = 'none';
    } else if (viewName === 'subjects') {
      if (dom.sidebarSubjectsPanel) dom.sidebarSubjectsPanel.style.display = 'flex';
      if (dom.sidebarQuestionsPanel) dom.sidebarQuestionsPanel.style.display = 'none';
      if (dom.sidebarSchedulePanel) dom.sidebarSchedulePanel.style.display = 'none';
    } else if (viewName === 'schedule') {
      if (dom.sidebarSubjectsPanel) dom.sidebarSubjectsPanel.style.display = 'none';
      if (dom.sidebarQuestionsPanel) dom.sidebarQuestionsPanel.style.display = 'none';
      if (dom.sidebarSchedulePanel) dom.sidebarSchedulePanel.style.display = 'flex';
    }
  }

  // Cloud Sync Integration (Firebase RTDB)
  function updateSyncBadge(status, label) {
    const badge = document.getElementById('cloudSyncBadge');
    if (!badge) return;
    badge.className = `cloud-sync-badge status-${status}`;
    const textEl = badge.querySelector('.sync-text');
    if (textEl) textEl.textContent = label;
  }

  function initFirebaseSync() {
    if (!window.FirebaseSync) return;

    window.FirebaseSync.init({
      getLocalData: function() {
        return {
          checkedQuestions: Array.from(state.checkedQuestions),
          completedDays: Array.from(state.completedDays)
        };
      },
      onData: function(cloudData) {
        let changed = false;
        if (cloudData.checkedQuestions) {
          state.checkedQuestions = new Set(cloudData.checkedQuestions);
          try {
            localStorage.setItem('gtu_checked_questions', JSON.stringify(cloudData.checkedQuestions));
          } catch (e) {}
          changed = true;
        }
        if (cloudData.completedDays) {
          state.completedDays = new Set(cloudData.completedDays);
          try {
            localStorage.setItem('gtu_completed_days', JSON.stringify(cloudData.completedDays));
          } catch (e) {}
          changed = true;
        }
        if (changed) {
          renderQuestionList();
          renderSchedulePanel();
        }
      },
      onStatus: function(status, label) {
        updateSyncBadge(status, label);
      }
    });
  }

  // Application Entry Point
  document.addEventListener('DOMContentLoaded', () => {
    initDomRefs();
    applyTheme();
    attachEventListeners();
    initScalerObserver();
    loadInitialData();
    initFirebaseSync();

    // Auto-fit on mobile if loaded directly
    if (window.innerWidth <= 768) {
      switchMobileView('subjects');
    }
  });

})();
