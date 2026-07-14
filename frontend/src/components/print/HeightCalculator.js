/**
 * HeightCalculator.js
 *
 * Provides estimated pixel heights for all row types and page sections.
 *
 * All values are at 96 DPI (screen / browser default), matching the A4
 * dimensions used in PrintablePage (794 × 1123 px).
 *
 * These estimates are used as FALLBACKS.  PageRenderer and PrintOrchestrator
 * measure the actual DOM heights of the patient header, table header, and
 * footer after mount and override the values here before running pagination.
 *
 * Row heights are estimated from typography rules rather than measured
 * (measuring every row would be prohibitively expensive for large reports).
 */
export const estimateRowHeights = (rows, template) => {
  const heights = {
    // ── Page sections ────────────────────────────────────────────────
    // First page and continuation pages now have the same header height
    // because the barcode appears on EVERY page (per product requirement).
    // Override these with real DOM measurements in PageRenderer /
    // PrintOrchestrator after the measurement probe renders.
    headerFirstPage:    202, // barcode (~60) + patient info (~106) + separator (~4) + gap
    headerContinuation: 202, // same — barcode on every page
    header:             202, // alias kept for backward compatibility

    // Column label row (TEST NAME / RESULT / UNIT / REFERENCE RANGE)
    tableHeader: 36, // padding(6+6) + text(~20) + border(2) ≈ 34, rounded up

    // Signature section including its mt-12 (48px) top margin
    footer: 130,

    rows:        {},
    pageMargins: { top: 20, bottom: 20 },
  };

  // Apply margin overrides from the print template
  if (template?.page) {
    heights.pageMargins.top    = parseInt(template.page.marginTop    || 20);
    heights.pageMargins.bottom = parseInt(template.page.marginBottom || 20);
  }

  const baseFontSize  = parseInt(template?.typography?.baseFontSize || 13);
  const rowPaddingPx  = 8; // rowPad (4px top + 4px bottom) from PrintablePage

  rows.forEach((row, i) => {
    let h = 0;

    if (row.type === 'department') {
      // paddingTop(20) + text at 18px (~22px) + paddingBottom(6) = 48px
      h = 48;
    } else if (row.type === 'test') {
      // paddingTop(14) + text at 15px (~19px) + paddingBottom(4) = 37px
      h = 37;
    } else if (row.type === 'section') {
      // paddingTop(14) + text can wrap; col width is 45% of ~764px content ≈ 344px
      // At ~7px/char (14px font) ≈ 49 chars/line
      const len   = row.content ? row.content.length : 0;
      const lines = Math.max(1, Math.ceil(len / 49));
      h = 14 + (lines * baseFontSize * 1.2) + 4;
    } else if (row.type === 'parameter') {
      // Parameter col (45% of content width ≈ 344px) — ~46 chars/line at 13px font
      const paramLen  = row.content?.parameter ? row.content.parameter.length : 0;
      const paramLines = Math.max(1, Math.ceil(paramLen / 46));
      h = (paramLines * baseFontSize * 1.5) + rowPaddingPx;
    } else if (row.type === 'text_block') {
      // Text block spans full width ≈ 764px. At 13px font, ~109 chars/line.
      const val = row.content?.textBlockValue !== undefined ? row.content.textBlockValue : (row.content?.value || "");
      const textLines = val.split('\n').reduce((sum, line) => {
        return sum + Math.max(1, Math.ceil(line.length / 109));
      }, 0);
      const titleHeight = Math.max(14, baseFontSize) * 1.5;
      const bodyHeight = textLines * baseFontSize * 1.5;
      h = titleHeight + 8 + bodyHeight + 32; // title + marginBottom + text + padding(16x2)
    } else if (row.type === 'blank') {
      h = row.height || 16;
    }

    heights.rows[i] = Math.max(h, 20); // minimum 20px per row
  });

  // Fallback heights for continuation header rows inserted by PaginationPage.
  // These rows are created dynamically and don't have index keys in `heights.rows`.
  heights.rows['dummy_dept_cont'] = 48;
  heights.rows['dummy_test_cont'] = 37;
  heights.rows['dummy_sec_cont']  = 34;

  return heights;
};