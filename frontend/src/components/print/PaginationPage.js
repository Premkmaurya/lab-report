export const paginateRows = (rows, measurements, template) => {
  const PAGE_HEIGHT = 1123; // A4 height at 96 DPI
  const { headerFirstPage, headerContinuation, footer, rows: rowHeights, pageMargins } = measurements;

  // Available body height after reserving header + footer + margins
  // Page 1 has a barcode so its header is taller
  const availableHeightFirstPage =
    PAGE_HEIGHT - pageMargins.top - pageMargins.bottom - headerFirstPage - footer;

  // Continuation pages have no barcode so more room for content
  const availableHeightContinuation =
    PAGE_HEIGHT - pageMargins.top - pageMargins.bottom - headerContinuation - footer;

  const pages = [];
  let currentPageRows = [];
  let currentHeight = 0;
  let isFirstPage = true; // tracks whether we're building page 1

  let currentDepartment = null;
  let currentTest = null;
  let currentSection = null;

  const maxContentHeight = () =>
    isFirstPage ? availableHeightFirstPage : availableHeightContinuation;

  const startNewPage = () => {
    pages.push({ rows: [...currentPageRows] });
    currentPageRows = [];
    currentHeight = 0;
    isFirstPage = false; // all subsequent pages are continuation pages

    // Add continuation headers based on current context
    if (currentDepartment) {
      currentPageRows.push({
        type: 'department',
        content: currentDepartment + ' (CONT.)',
        isContinuation: true,
      });
      currentHeight += rowHeights['dummy_dept_cont'] || 64;
    }
    if (currentTest) {
      currentPageRows.push({
        type: 'test',
        content: currentTest + ' (CONT.)',
        isContinuation: true,
      });
      currentHeight += rowHeights['dummy_test_cont'] || 52;
    }
    if (currentSection) {
      currentPageRows.push({
        type: 'section',
        content: currentSection + ' (CONT.)',
        isContinuation: true,
      });
      currentHeight += rowHeights['dummy_sec_cont'] || 44;
    }
  };

  // Returns the minimum block of height that must fit together to avoid
  // stranding a heading without at least one parameter beneath it.
  const getRequiredLookaheadHeight = (startIndex) => {
    let height = rowHeights[startIndex];
    const row = rows[startIndex];

    // Parameters and blanks only need their own height
    if (row.type === 'parameter' || row.type === 'blank') {
      return height;
    }

    // For headings: look ahead until we find the first parameter so the
    // heading is never left alone at the bottom of a page.
    for (let i = startIndex + 1; i < rows.length; i++) {
      const nextRow = rows[i];
      height += rowHeights[i];

      if (nextRow.type === 'parameter') {
        break; // found at least one parameter – good enough
      }
      if (nextRow.type === 'department' || nextRow.type === 'test') {
        // Hit another major heading before a parameter – stop here
        break;
      }
    }
    return height;
  };

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowHeight = rowHeights[i];

    // Track context so continuation headers can be inserted on new pages
    if (row.type === 'department') {
      currentDepartment = row.content;
      currentTest = null;
      currentSection = null;
    } else if (row.type === 'test') {
      currentTest = row.content;
      currentSection = null;
    } else if (row.type === 'section') {
      currentSection = row.content;
    }

    const requiredHeight = getRequiredLookaheadHeight(i);

    // Decide if we need a page break
    if (currentHeight + requiredHeight > maxContentHeight()) {
      // Only break if there is real (non-continuation) content already on this page
      // to avoid an infinite loop when a single block is larger than a whole page.
      const hasRealContent = currentPageRows.some((r) => !r.isContinuation);

      if (hasRealContent) {
        // Clear the heading context BEFORE starting the new page so that
        // headings that haven't been printed yet don't get a (CONT.) label.
        if (row.type === 'department') currentDepartment = null;
        if (row.type === 'test') currentTest = null;
        if (row.type === 'section') currentSection = null;

        startNewPage();

        // Restore context – this heading will now appear on the new page
        if (row.type === 'department') currentDepartment = row.content;
        if (row.type === 'test') currentTest = row.content;
        if (row.type === 'section') currentSection = row.content;
      }
    }

    currentPageRows.push(row);
    currentHeight += rowHeight;
  }

  // Flush the last partial page
  if (currentPageRows.length > 0) {
    pages.push({ rows: currentPageRows });
  } else if (pages.length === 0) {
    // Edge case: no tests – still need one page
    pages.push({ rows: [] });
  }

  return pages;
};