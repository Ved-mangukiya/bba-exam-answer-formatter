/**
 * renderer.js — GTU / SSASIT Answer Formatter AST-to-HTML Engine
 * Implements strict rules per RULES.md (Master Formatting Rulebook v1.0)
 */

(function (window) {
  'use strict';

  function escapeHtml(str) {
    if (!str && str !== 0) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Applies character-offset spans to text without altering offsets or corrupting tags.
   * RULES.md §3:
   * - Underline: technical term, definition, formula, numeric result (u-underline)
   * - Italic: definitions, emphasis, latin terms (u-italic)
   * - Bold: headings, question numbers, notes (u-bold)
   */
  function applySpans(text, spans) {
    if (!text) return '';
    if (!spans || !Array.isArray(spans) || spans.length === 0) {
      return escapeHtml(text);
    }

    const textLen = text.length;
    const boundarySet = new Set([0, textLen]);

    // Collect and clamp all span boundaries
    spans.forEach(s => {
      if (typeof s.start === 'number' && typeof s.end === 'number') {
        const start = Math.max(0, Math.min(textLen, s.start));
        const end = Math.max(0, Math.min(textLen, s.end));
        if (start < end) {
          boundarySet.add(start);
          boundarySet.add(end);
        }
      }
    });

    const boundaries = Array.from(boundarySet).sort((a, b) => a - b);
    let resultHtml = '';

    for (let i = 0; i < boundaries.length - 1; i++) {
      const segStart = boundaries[i];
      const segEnd = boundaries[i + 1];
      const segment = text.substring(segStart, segEnd);

      if (!segment) continue;

      // Find styles covering this exact segment
      const coveringStyles = new Set();
      spans.forEach(s => {
        const start = Math.max(0, Math.min(textLen, s.start));
        const end = Math.max(0, Math.min(textLen, s.end));
        if (s.style && start <= segStart && end >= segEnd) {
          coveringStyles.add(s.style.toLowerCase());
        }
      });

      let formattedSlice = escapeHtml(segment);

      if (coveringStyles.has('underline')) {
        formattedSlice = `<u class="u-underline">${formattedSlice}</u>`;
      }
      if (coveringStyles.has('italic')) {
        formattedSlice = `<em class="u-italic">${formattedSlice}</em>`;
      }
      if (coveringStyles.has('bold')) {
        formattedSlice = `<strong class="u-bold">${formattedSlice}</strong>`;
      }

      resultHtml += formattedSlice;
    }

    return resultHtml;
  }

  /**
   * Renders a single contentBlock per question-answer.schema.json
   */
  function renderContentBlock(block) {
    if (!block || !block.blockType) return '';

    switch (block.blockType) {
      case 'heading':
        // RULES.md §2: Section/Unit heading inside answer -> 13pt, Bold, Underlined
        return `<div class="gtu-heading">${applySpans(block.text, block.spans)}</div>`;

      case 'subheading':
        // RULES.md §2: Sub-heading inside an answer -> 12pt, Bold
        return `<div class="gtu-subheading">${applySpans(block.text, block.spans)}</div>`;

      case 'paragraph':
        // RULES.md §2: Body text -> 12pt, Regular, line-height 1.5
        return `<p class="gtu-paragraph">${applySpans(block.text, block.spans)}</p>`;

      case 'note':
        // RULES.md §3: The word "Note:" in bold
        return `<div class="gtu-note"><strong class="gtu-note-label">Note:</strong> ${applySpans(block.text, block.spans)}</div>`;

      case 'list': {
        // RULES.md §4:
        // decimal = 1., 2., 3. (sequential)
        // roman = i., ii., iii. (classifications/lists)
        // alpha = (a), (b), (c) (sub-parts)
        // bullet = non-orderable remarks
        const listStyle = (block.listStyle || 'decimal').toLowerCase();
        const tag = listStyle === 'bullet' ? 'ul' : 'ol';
        const listClass = `gtu-list list-${listStyle}`;

        const itemsHtml = (block.items || []).map(item => {
          const itemText = typeof item === 'string' ? item : item.text;
          const itemSpans = item.spans || [];
          return `<li class="gtu-list-item">${applySpans(itemText, itemSpans)}</li>`;
        }).join('');

        return `<${tag} class="${listClass}">${itemsHtml}</${tag}>`;
      }

      case 'table': {
        // RULES.md §5: Bold header row, 11pt text, Caption "Table: <title>" above in bold
        const captionHtml = block.tableCaption
          ? `<div class="gtu-table-caption">Table: ${escapeHtml(block.tableCaption)}</div>`
          : '';

        const headers = block.tableHeaders || [];
        const rows = block.tableRows || [];

        let theadHtml = '';
        if (headers.length > 0) {
          theadHtml = `<thead><tr>${headers.map(h => `<th>${escapeHtml(h)}</th>`).join('')}</tr></thead>`;
        }

        let tbodyHtml = '';
        if (rows.length > 0) {
          tbodyHtml = `<tbody>${rows.map(row => `<tr>${row.map(c => `<td>${escapeHtml(c)}</td>`).join('')}</tr>`).join('')}</tbody>`;
        }

        return `
          <div class="gtu-table-container">
            ${captionHtml}
            <table class="gtu-table">
              ${theadHtml}
              ${tbodyHtml}
            </table>
          </div>
        `;
      }

      case 'diagram': {
        // RULES.md §5:
        // Heading above: "Diagram: <title>" (bold, underlined)
        // Boxed with thin 0.5pt border, kept on one page
        // Caption below: 10.5pt, italic, centered
        const titleHtml = block.diagramTitle
          ? `<div class="gtu-diagram-title">Diagram: ${escapeHtml(block.diagramTitle)}</div>`
          : '<div class="gtu-diagram-title">Diagram</div>';

        let graphicContent = '';
        if (block.diagramSvgOrUrl) {
          const content = block.diagramSvgOrUrl.trim();
          if (content.startsWith('<svg')) {
            graphicContent = content; // Inline SVG
          } else {
            graphicContent = `<img src="${escapeHtml(content)}" alt="${escapeHtml(block.diagramTitle || 'Diagram')}" />`;
          }
        } else {
          graphicContent = `<div style="padding: 24pt; color: #666; font-style: italic;">[Diagram Illustration Placeholder]</div>`;
        }

        const captionHtml = block.diagramCaption
          ? `<div class="gtu-diagram-caption">${escapeHtml(block.diagramCaption)}</div>`
          : '';

        return `
          <div class="gtu-diagram-container">
            ${titleHtml}
            <div class="gtu-diagram-box">
              ${graphicContent}
            </div>
            ${captionHtml}
          </div>
        `;
      }

      default:
        return '';
    }
  }

  /**
   * Renders a question with its header and all answer blocks
   */
  function renderQuestion(question, options = {}) {
    if (!question) return '';

    const qNum = question.questionNumber || 'Q.';
    const qText = question.questionText || '';
    const marks = question.marks ? `[${question.marks} Marks]` : '';

    const answerBlocks = question.answer || [];
    const answerHtml = answerBlocks.map(renderContentBlock).join('');

    return `
      <section class="gtu-question-wrapper" id="${escapeHtml(question.id || '')}">
        <div class="gtu-question-header">
          <h2 class="gtu-question-title">
            <span class="gtu-question-number">${escapeHtml(qNum)}</span>
            <span>${escapeHtml(qText)}</span>
          </h2>
          ${marks ? `<div class="gtu-marks-badge">${escapeHtml(marks)}</div>` : ''}
        </div>
        <div class="gtu-answer-body">
          ${answerHtml}
        </div>
      </section>
    `;
  }

  /**
   * Renders the page header block (Subject title 16pt bold centered, meta info)
   */
  function renderPageHeader(subjectData) {
    const subjectName = subjectData.subject || 'Subject Answer Sheet';
    const sem = subjectData.semester ? `Semester ${subjectData.semester}` : 'BBA';
    const facultyStr = Array.isArray(subjectData.faculty) && subjectData.faculty.length > 0
      ? subjectData.faculty.join(', ')
      : '';

    return `
      <header class="gtu-page-header">
        <h1 class="gtu-subject-title">${escapeHtml(subjectName)}</h1>
        <div class="gtu-header-meta">
          <span>BBA (${escapeHtml(sem)}) — GTU / SSASIT Answer Format</span>
          ${facultyStr ? `<span>Faculty: ${escapeHtml(facultyStr)}</span>` : ''}
        </div>
      </header>
    `;
  }

  /**
   * Renders a full printable document into A4 sheet wrapper
   */
  function renderDocument(subjectData, activeQuestionId = null) {
    if (!subjectData) {
      return '<div class="gtu-a4-sheet"><p class="gtu-paragraph">No data loaded.</p></div>';
    }

    const headerHtml = renderPageHeader(subjectData);
    let questionsToRender = subjectData.questions || [];

    if (activeQuestionId) {
      const single = questionsToRender.find(q => q.id === activeQuestionId);
      if (single) {
        questionsToRender = [single];
      }
    }

    if (questionsToRender.length === 0) {
      return `
        <div class="gtu-a4-sheet">
          ${headerHtml}
          <p class="gtu-paragraph" style="margin-top: 30pt; text-align: center; color: #777;">
            No questions available for this selection.
          </p>
        </div>
      `;
    }

    // Render questions with visual separators between multiple questions
    const questionsHtml = questionsToRender.map((q, idx) => {
      const qHtml = renderQuestion(q);
      const separator = (idx < questionsToRender.length - 1) ? '<div class="gtu-question-separator"></div>' : '';
      return qHtml + separator;
    }).join('');

    return `
      <div class="gtu-a4-sheet">
        ${headerHtml}
        <div class="gtu-content-flow">
          ${questionsHtml}
        </div>
      </div>
    `;
  }

  // Export to global scope
  window.GTURenderer = {
    applySpans,
    renderContentBlock,
    renderQuestion,
    renderPageHeader,
    renderDocument
  };

})(window);
