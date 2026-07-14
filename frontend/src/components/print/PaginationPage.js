/**
 * PaginationPage.js
 *
 * Splits a flat array of report rows into pages, respecting:
 *  - Different available heights for page 1 vs continuation pages
 *    (though with barcode-on-every-page these are now equal)
 *  - Footer space reserved on every page
 *  - Table header space reserved on every page
 *  - No orphaned department / test / section headings
 *    (a heading always appears with at least one parameter below it)
 *  - Continuation labels: "DEPT NAME (CONT.)", "TEST NAME (CONT.)", etc.
 *
 * @param {Array}  rows         – Flat row array from RowBuilder
 * @param {Object} measurements – Heights object from HeightCalculator /
 *                                DOM measurement in PageRenderer or PrintOrchestrator
 * @param {Object} template     – Print template (unused currently, reserved)
 * @returns {Array} Array of page objects, each with a `rows` array
 */
export const paginateRows = (rows, measurements, template) => {
  const PAGE_HEIGHT = 1123; // A4 at 96 DPI

  const {
    headerFirstPage    = 202,
    headerContinuation = 202,
    footer             = 130,
    tableHeader        = 36,  // column-label row, appears on every page
    rows: rowHeights   = {},
    pageMargins        = { top: 20, bottom: 20 },
  } = measurements;

  // Available vertical space for content rows on each page.
  // Everything else is reserved: page padding, patient header, table header, footer.
  const availableHeightFirstPage =
    PAGE_HEIGHT
    - pageMargins.top
    - pageMargins.bottom
    - headerFirstPage
    - tableHeader
    - footer;

  const availableHeightContinuation =
    PAGE_HEIGHT
    - pageMargins.top
    - pageMargins.bottom
    - headerContinuation
    - tableHeader
    - footer;

  // Guard against degenerate configurations (e.g., massive font sizes)
  const safeFirstPage      = Math.max(availableHeightFirstPage,      50);
  const safeContinuation   = Math.max(availableHeightContinuation,   50);

  const pages          = [];
  let currentPageRows  = [];
  let currentHeight    = 0;
  let isFirstPage      = true;

  // Track heading context so continuation labels can be emitted on new pages
  let currentDepartment = null;
  let currentTest       = null;
  let currentSection    = null;

  const maxContentHeight = () => (isFirstPage ? safeFirstPage : safeContinuation);

  const startNewPage = () => {
    pages.push({ rows: [...currentPageRows] });
    currentPageRows = [];
    currentHeight   = 0;
    isFirstPage     = false;

    // Emit continuation labels for whichever context is active.
    // Heights use the row-height map if available, otherwise fall back to estimates.
    if (currentDepartment) {
      currentPageRows.push({
        type:           'department',
        content:        `${currentDepartment} (CONT.)`,
        isContinuation: true,
      });
      currentHeight += rowHeights['dummy_dept_cont'] || 48;
    }
    if (currentTest) {
      currentPageRows.push({
        type:           'test',
        content:        `${currentTest} (CONT.)`,
        isContinuation: true,
      });
      currentHeight += rowHeights['dummy_test_cont'] || 37;
    }
    if (currentSection) {
      currentPageRows.push({
        type:           'section',
        content:        `${currentSection} (CONT.)`,
        isContinuation: true,
      });
      currentHeight += rowHeights['dummy_sec_cont'] || 34;
    }
  };

  /**
   * Returns the minimum block of height that must fit together to avoid
   * stranding a heading without at least one parameter beneath it.
   *
   * For parameter / blank rows: just their own height.
   * For heading rows: heading + all intervening headings + first parameter found.
   */
  const getRequiredLookaheadHeight = (startIndex) => {
    let height = rowHeights[startIndex] || 20;
    const row  = rows[startIndex];

    // Parameters, text blocks, and blanks only need their own height.
    if (row.type === 'parameter' || row.type === 'text_block' || row.type === 'blank') return height;

    // For headings: accumulate until the first parameter is found.
    for (let i = startIndex + 1; i < rows.length; i++) {
      const next = rows[i];
      height += rowHeights[i] || 20;

      if (next.type === 'parameter') {
        break; // found at least one parameter beneath — enough
      }
      if (next.type === 'department') {
        // Another major section started before any parameter — stop here
        break;
      }
    }
    return height;
  };

  // ── Main pagination loop ──────────────────────────────────────────
  for (let i = 0; i < rows.length; i++) {
    const row       = rows[i];
    const rowHeight = rowHeights[i] || 20;

    // Update context trackers BEFORE page-break decisions
    if (row.type === 'department') {
      currentDepartment = row.content;
      currentTest       = null;
      currentSection    = null;
    } else if (row.type === 'test') {
      currentTest     = row.content;
      currentSection  = null;
    } else if (row.type === 'section') {
      currentSection = row.content;
    }

    const requiredHeight = getRequiredLookaheadHeight(i);

    // Decide whether a page break is needed
    if (currentHeight + requiredHeight > maxContentHeight()) {
      // Only break if real (non-continuation) content is already on this page,
      // to prevent an infinite loop when a single block exceeds a full page.
      const hasRealContent = currentPageRows.some((r) => !r.isContinuation);

      if (hasRealContent) {
        // Temporarily clear the context for the heading that triggered the break
        // so it does NOT get a (CONT.) label on the new page — it IS the heading.
        const savedDept    = currentDepartment;
        const savedTest    = currentTest;
        const savedSection = currentSection;

        if (row.type === 'department') currentDepartment = null;
        if (row.type === 'test')       currentTest       = null;
        if (row.type === 'section')    currentSection    = null;

        startNewPage();

        // Restore context now that continuation labels for the old context
        // have already been emitted.
        if (row.type === 'department') currentDepartment = savedDept;
        if (row.type === 'test')       currentTest       = savedTest;
        if (row.type === 'section')    currentSection    = savedSection;
      }
    }

    currentPageRows.push(row);
    currentHeight += rowHeight;
  }

  // Flush the last partial page
  if (currentPageRows.length > 0) {
    pages.push({ rows: currentPageRows });
  } else if (pages.length === 0) {
    // Edge case: no test rows — still produce one (empty) page
    pages.push({ rows: [] });
  }

  return pages;
};