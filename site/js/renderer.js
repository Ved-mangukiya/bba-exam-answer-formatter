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

  // Helper to extract balanced braces starting at pos (where str[pos] === '{')
  function extractBalancedBraces(str, pos) {
    if (str[pos] !== '{') return null;
    let depth = 0;
    const start = pos;
    for (let i = pos; i < str.length; i++) {
      if (str[i] === '{') depth++;
      else if (str[i] === '}') {
        depth--;
        if (depth === 0) {
          return {
            content: str.substring(start + 1, i),
            end: i
          };
        }
      }
    }
    return null;
  }

  function parseLaTeXFrac(str) {
    let idx = 0;
    let result = '';
    while (idx < str.length) {
      const fracIdx = str.indexOf('\\frac', idx);
      if (fracIdx === -1) {
        result += str.substring(idx);
        break;
      }
      result += str.substring(idx, fracIdx);
      let cur = fracIdx + 5; // length of '\frac'
      while (cur < str.length && /\s/.test(str[cur])) cur++;

      const numMatch = extractBalancedBraces(str, cur);
      if (!numMatch) {
        result += '\\frac';
        idx = fracIdx + 5;
        continue;
      }
      cur = numMatch.end + 1;
      while (cur < str.length && /\s/.test(str[cur])) cur++;

      const denomMatch = extractBalancedBraces(str, cur);
      if (!denomMatch) {
        result += '\\frac{' + numMatch.content + '}';
        idx = numMatch.end + 1;
        continue;
      }

      const numHtml = parseLaTeXFrac(numMatch.content);
      const denomHtml = parseLaTeXFrac(denomMatch.content);
      result += `<span class="gtu-math-frac"><span class="frac-num">${numHtml}</span><span class="frac-denom">${denomHtml}</span></span>`;
      idx = denomMatch.end + 1;
    }
    return result;
  }

  function parseLatexSqrt(str) {
    let idx = 0;
    let result = '';
    while (idx < str.length) {
      const sqrtIdx = str.indexOf('\\sqrt', idx);
      if (sqrtIdx === -1) {
        result += str.substring(idx);
        break;
      }
      result += str.substring(idx, sqrtIdx);
      let cur = sqrtIdx + 5;
      while (cur < str.length && /\s/.test(str[cur])) cur++;
      const match = extractBalancedBraces(str, cur);
      if (!match) {
        result += '\\sqrt';
        idx = sqrtIdx + 5;
        continue;
      }
      const bodyHtml = parseLatexSqrt(parseLaTeXFrac(match.content));
      result += `<span class="gtu-math-sqrt"><span class="sqrt-sym">√</span><span class="sqrt-body">${bodyHtml}</span></span>`;
      idx = match.end + 1;
    }
    return result;
  }

  function convertSlashesToFractions(text) {
    // 1. Parenthesized or bracketed numerator divided by denominator:
    // e.g. (Mean - Mode) / σ  or [3(Mean - Median)] / σ or (n + 1) / 2
    text = text.replace(/(?:\[([^[\]]+)\]|\(([^()]+)\))\s*\/\s*(\([^\)]+\)|\[[^\]]+\]|[A-Za-z0-9_Σσρµx̄\.\-]+)/g, (match, p1, p2, denom) => {
      let num = (p1 || p2).trim();
      let d = denom.replace(/^[(\[]|[)\]]$/g, '').trim();
      if (/^[a-zA-Z\s]{15,}$/.test(num)) return match;
      return `\\frac{${num}}{${d}}`;
    });

    // 2. Pure numbers with slash: e.g. 1690 / 50 or 370 / 371.4835 or 24 / 120
    text = text.replace(/(?<=\s|=|^)([0-9]+(?:\.[0-9]+)?)\s*\/\s*([0-9]+(?:\.[0-9]+)?)(?=\s|$|[×,;\.])/g, (match, num, denom) => {
      return `\\frac{${num}}{${denom}}`;
    });

    // 3. Known math variables with slash: e.g. Σx / n, σ / x̄, Σfx / N
    text = text.replace(/(?<=\s|=|^)([Σσρµx̄Nn][A-Za-z0-9_Σσρµx̄]*)\s*\/\s*([A-Za-z0-9_Σσρµx̄]+)(?=\s|$|[×,;\.])/g, (match, num, denom) => {
      return `\\frac{${num}}{${denom}}`;
    });

    return text;
  }

  /**
   * Real Formula Typer & Traditional Academic Mathematics Formatter
   * Converts \frac{A}{B} and slash divisions to vertical stacked fractions with horizontal divide lines,
   * \boxed{...} to exam answer boxes, \sqrt{...} to radical overbars,
   * scales brackets around tall fractions, and formats multi-line steps with generous spacing.
   */
  function formatMathAndBoxes(html) {
    if (!html) return '';

    // Clean LaTeX bracket wrappers & text annotations
    html = html.replace(/\\left\s*\[/g, '[').replace(/\\right\s*\]/g, ']');
    html = html.replace(/\\left\s*\(/g, '(').replace(/\\right\s*\)/g, ')');
    html = html.replace(/\\text\{([^{}]+)\}/g, '$1');

    // Automatically convert computer-style division slashes to traditional fractions
    html = convertSlashesToFractions(html);

    // Recursively parse square roots and stacked vertical fractions
    html = parseLatexSqrt(html);
    html = parseLaTeXFrac(html);

    // Replace \boxed{...} or [boxed: ...]
    html = html.replace(/\\boxed\{([^{}]+)\}/g, '<span class="gtu-answer-box">$1</span>');
    html = html.replace(/\[(?:box|boxed):\s*([^\]]+)\]/gi, '<span class="gtu-answer-box">$1</span>');

    // Scale brackets around tall fractions
    html = html.replace(/\[\s*(<span class="gtu-math-frac">[\s\S]*?<\/span>)\s*\]/g, '<span class="gtu-math-bracket">[</span>$1<span class="gtu-math-bracket">]</span>');

    // Space out mathematical equal signs nicely (before inserting HTML tags)
    if (html.includes('gtu-math-frac') || html.includes('gtu-answer-box') || html.includes('gtu-math-sqrt') || /([x̄σρµMLZQDP]\w*)\s*=/.test(html)) {
      html = html.replace(/(?<=\s)=(?=\s)/g, '<span class="gtu-math-eq">=</span>');
    }

    // Preserve newlines as traditional formula step breaks
    if (html.includes('\n')) {
      html = html.split('\n').map(line => line.trim()).filter(Boolean).join('<span class="gtu-math-break"></span>');
    }

    return html;
  }

  /**
   * Renders a single contentBlock per question-answer.schema.json
   */
  function renderContentBlock(block) {
    if (!block || !block.blockType) return '';

    switch (block.blockType) {
      case 'heading':
        // RULES.md §2: Section/Unit heading inside answer -> 13pt, Bold, Underlined
        return `<div class="gtu-heading">${formatMathAndBoxes(applySpans(block.text, block.spans))}</div>`;

      case 'subheading':
        // RULES.md §2: Sub-heading inside an answer -> 12pt, Bold
        return `<div class="gtu-subheading">${formatMathAndBoxes(applySpans(block.text, block.spans))}</div>`;

      case 'paragraph': {
        // RULES.md §2: Body text -> 12pt, Regular, line-height 1.5
        const rawText = block.text || '';
        const formatted = formatMathAndBoxes(applySpans(rawText, block.spans));

        // Format Final Result / Decision summary into a dedicated highlight card
        if (/^\s*(?:Final Result|Final Answer|Result & Decision|Final Decision)/i.test(rawText)) {
          return `
            <div class="gtu-final-result-card keep-together">
              <div class="gtu-final-result-badge">❖ Official Result & Decision Summary</div>
              <p class="gtu-paragraph">${formatted}</p>
            </div>
          `;
        }

        return `<p class="gtu-paragraph">${formatted}</p>`;
      }

      case 'note':
        // RULES.md §3: The word "Note:" in bold
        return `<div class="gtu-note keep-together"><strong class="gtu-note-label">Note:</strong> ${formatMathAndBoxes(applySpans(block.text, block.spans))}</div>`;

      case 'list': {
        // RULES.md §4:
        // decimal = 1., 2., 3. (sequential)
        // roman = i., ii., iii. (classifications/lists)
        // alpha = (a), (b), (c) (sub-parts)
        // bullet = non-orderable remarks
        const listStyle = (block.listStyle || 'decimal').toLowerCase();
        const tag = listStyle === 'bullet' ? 'ul' : 'ol';

        // Detect if items already contain embedded numbers to prevent double-numbering
        const hasEmbeddedPrefix = (block.items || []).some(item => {
          const t = typeof item === 'string' ? item : item.text;
          return /^\s*(?:\d+\.|\([a-z]\)|[ivx]+\.)\s+/i.test(t || '');
        });

        const listClass = `gtu-list list-${listStyle}${hasEmbeddedPrefix ? ' list-prefix-embedded' : ''}`;

        const itemsHtml = (block.items || []).map(item => {
          const itemText = typeof item === 'string' ? item : item.text;
          const itemSpans = item.spans || [];
          const formattedItem = formatMathAndBoxes(applySpans(itemText, itemSpans));
          return `<li class="gtu-list-item">${formattedItem}</li>`;
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
          <div class="gtu-table-container keep-together">
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
          <div class="gtu-diagram-container keep-together">
            ${titleHtml}
            <div class="gtu-diagram-box">
              ${graphicContent}
            </div>
            ${captionHtml}
          </div>
        `;
      }

      default:
        return `<div class="gtu-paragraph">${formatMathAndBoxes(applySpans(block.text, block.spans))}</div>`;
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
      <section class="gtu-question-wrapper keep-together" id="${escapeHtml(question.id || '')}">
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
   * Renders the page header block (College, University, Course, Subject, Faculty)
   * Designed with high simplicity: clean frame, subject banner, and 3-column metadata.
   */
  function renderPageHeader(subjectData) {
    const college = subjectData.college || (subjectData.header && subjectData.header.college) || 'Shree Swami Atmanand Saraswati Institute of Technology (SSASIT)';
    const university = subjectData.university || (subjectData.header && subjectData.header.university) || 'Gujarat Technological University (GTU)';
    const course = subjectData.course || (subjectData.header && subjectData.header.course) || 'Bachelor of Business Administration (BBA)';
    const sem = subjectData.semester ? `Semester ${subjectData.semester}` : 'Semester 1';
    const subjectName = subjectData.subject || 'Subject Answer Sheet';
    const code = subjectData.subjectCode || (subjectData.header && subjectData.header.subjectCode) || '';
    const facultyList = subjectData.faculty || (subjectData.header && subjectData.header.faculty) || [];
    const facultyStr = Array.isArray(facultyList) && facultyList.length > 0
      ? facultyList.join(', ')
      : '';
    const unitTitle = subjectData.unit || 'Model Question Bank';

    return `
      <header class="gtu-page-header">
        <div class="gtu-header-frame">
          <!-- Institutional Header -->
          <div class="gtu-header-institution">
            <div class="gtu-header-college">${escapeHtml(college.toUpperCase())}</div>
            <div class="gtu-header-affiliation">Affiliated to ${escapeHtml(university)} &nbsp;|&nbsp; ${escapeHtml(course)}</div>
          </div>

          <!-- Subject Title Banner -->
          <div class="gtu-subject-banner">
            <h1 class="gtu-subject-title">${escapeHtml(subjectName)} ${code ? `<span class="gtu-subject-code">(${escapeHtml(code)})</span>` : ''}</h1>
          </div>

          <!-- Clean 3-Column Metadata Row -->
          <div class="gtu-header-meta-grid">
            <div class="gtu-meta-cell">
              <span class="meta-label">SEMESTER</span>
              <span class="meta-val">${escapeHtml(sem)}</span>
            </div>
            <div class="gtu-meta-cell gtu-meta-cell-center">
              <span class="meta-label">SYLLABUS / UNIT</span>
              <span class="meta-val">${escapeHtml(unitTitle)}</span>
            </div>
            <div class="gtu-meta-cell gtu-meta-cell-right">
              <span class="meta-label">FACULTY</span>
              <span class="meta-val">${facultyStr ? escapeHtml(facultyStr) : 'SSASIT Faculty'}</span>
            </div>
          </div>
        </div>
      </header>
    `;
  }

  /**
   * Renders the standardized page footer block
   */
  function renderPageFooter(subjectData) {
    const college = subjectData.college || (subjectData.footer && subjectData.footer.college) || 'SSASIT';
    const university = subjectData.university || (subjectData.footer && subjectData.footer.university) || 'GTU';
    const sem = subjectData.semester ? `Sem-${subjectData.semester}` : 'Sem-1';
    const subjectName = subjectData.subject || '';
    const code = subjectData.subjectCode || (subjectData.footer && subjectData.footer.subjectCode) || '';
    const facultyList = subjectData.faculty || (subjectData.footer && subjectData.footer.faculty) || [];
    const facultyStr = Array.isArray(facultyList) && facultyList.length > 0
      ? facultyList.join(', ')
      : '';

    return `
      <footer class="gtu-page-footer keep-together">
        <div class="gtu-footer-left">
          <span class="gtu-footer-subject">${escapeHtml(subjectName)} ${code ? `(${escapeHtml(code)})` : ''}</span>
        </div>
        <div class="gtu-footer-center">
          <span class="gtu-footer-college">${escapeHtml(college.includes('SSASIT') ? 'SSASIT' : college)} • ${escapeHtml(university.includes('GTU') ? 'GTU' : university)} BBA ${escapeHtml(sem)}</span>
        </div>
        <div class="gtu-footer-right">
          ${facultyStr ? `<span class="gtu-footer-faculty"><strong>Faculty:</strong> ${escapeHtml(facultyStr)}</span>` : ''}
        </div>
      </footer>
      <div class="gtu-dev-credit keep-together">Made with ❤️ by <strong>Ved Mangukiya</strong>'s BBA Answer Formatter &nbsp;•&nbsp; GTU / SSASIT &nbsp;•&nbsp; Semester 1</div>
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
    const footerHtml = renderPageFooter(subjectData);
    let questionsToRender = subjectData.questions || [];

    if (activeQuestionId) {
      if (Array.isArray(activeQuestionId)) {
        const idSet = new Set(activeQuestionId);
        questionsToRender = questionsToRender.filter(q => idSet.has(q.id));
      } else {
        const single = questionsToRender.find(q => q.id === activeQuestionId);
        if (single) {
          questionsToRender = [single];
        }
      }
    }

    if (questionsToRender.length === 0) {
      return `
        <div class="gtu-a4-sheet">
          ${headerHtml}
          <p class="gtu-paragraph" style="margin-top: 30pt; text-align: center; color: #777;">
            No questions available for this selection.
          </p>
          <div class="gtu-footer-wrapper keep-together">
            ${footerHtml}
          </div>
        </div>
      `;
    }

    // Render questions with visual separators between multiple questions
    const questionsHtml = questionsToRender.map((q, idx) => {
      const qHtml = renderQuestion(q);
      const separator = (idx < questionsToRender.length - 1) ? '<div class="gtu-question-separator"></div>' : '';
      return qHtml + separator;
    }).join('');

    const isSingle = typeof activeQuestionId === 'string' && Boolean(activeQuestionId);
    const sheetClass = isSingle ? 'gtu-a4-sheet gtu-single-question-sheet' : 'gtu-a4-sheet';
    const endMarkHtml = `
      <div class="gtu-page-end-mark keep-together" title="End of Examination Answers">
        <span class="page-end-line"></span>
        <span class="page-end-text">✦ End of Document ✦</span>
        <span class="page-end-line"></span>
      </div>
    `;

    return `
      <div class="${sheetClass}">
        ${headerHtml}
        <div class="gtu-content-flow">
          ${questionsHtml}
        </div>
        <div class="gtu-footer-wrapper keep-together">
          ${footerHtml}
          ${endMarkHtml}
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
    renderPageFooter,
    renderDocument
  };

})(window);
