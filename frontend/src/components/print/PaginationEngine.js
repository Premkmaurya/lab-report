export const paginateRows = (rows, measurements, template) => {
  const PAGE_HEIGHT = 1123; // A4 height at 96 DPI
  const { header, footer, rows: rowHeights, pageMargins } = measurements;
  
  const maxContentHeight = PAGE_HEIGHT - pageMargins.top - pageMargins.bottom - header;
  const maxContentHeightWithFooter = maxContentHeight - footer;
  
  const pages = [];
  let currentPageRows = [];
  let currentHeight = 0;
  
  let currentDepartment = null;
  let currentTest = null;
  let currentSection = null;

  const startNewPage = () => {
    pages.push({ rows: [...currentPageRows] });
    currentPageRows = [];
    currentHeight = 0;
    
    // Add continuation headers based on current context
    if (currentDepartment) {
       currentPageRows.push({ type: 'department', content: currentDepartment + ' (CONT.)', isContinuation: true });
       currentHeight += rowHeights['dummy_dept_cont'] || 65; // fallback estimate if not measured, normally we'd measure exactly but this is close enough
    }
    if (currentTest) {
       currentPageRows.push({ type: 'test', content: currentTest + ' (CONT.)', isContinuation: true });
       currentHeight += rowHeights['dummy_test_cont'] || 55;
    }
    if (currentSection) {
       currentPageRows.push({ type: 'section', content: currentSection + ' (CONT.)', isContinuation: true });
       currentHeight += rowHeights['dummy_sec_cont'] || 55;
    }
  };

  // Helper to determine the minimum height required to not strand a heading
  const getRequiredLookaheadHeight = (startIndex) => {
    let height = rowHeights[startIndex];
    const row = rows[startIndex];
    
    if (row.type === 'parameter' || row.type === 'blank') {
      return height; // just itself
    }
    
    // For headings, we must look ahead until we hit a parameter
    for (let i = startIndex + 1; i < rows.length; i++) {
      const nextRow = rows[i];
      height += rowHeights[i];
      
      if (nextRow.type === 'parameter') {
        break; // Found the first parameter, we can safely break after this
      }
      if (nextRow.type === 'department' || nextRow.type === 'test') {
        // If we hit another major heading before a parameter (e.g. empty test), we should break early to avoid huge required heights
        break;
      }
    }
    return height;
  };

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowHeight = rowHeights[i];

    // Update context
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

    // Check if we need to break
    if (currentHeight + requiredHeight > maxContentHeight) {
      // If we are at the beginning of a page and even the required height is too big,
      // we must just render it anyway to avoid an infinite loop (e.g., a massive section + param block)
      // We check if the current page actually has content (excluding continuation headers)
      const hasRealContent = currentPageRows.some(r => !r.isContinuation);
      
      if (hasRealContent) {
        // We clear the context of the CURRENT row before starting the new page, 
        // so the new page doesn't print a (CONT.) for a heading that hasn't even been printed yet.
        if (row.type === 'department') currentDepartment = null;
        if (row.type === 'test') currentTest = null;
        if (row.type === 'section') currentSection = null;
        
        startNewPage();
        
        // Restore context since the heading will be printed on this new page
        if (row.type === 'department') currentDepartment = row.content;
        if (row.type === 'test') currentTest = row.content;
        if (row.type === 'section') currentSection = row.content;
      }
    }

    currentPageRows.push(row);
    currentHeight += rowHeight;
  }

  if (currentPageRows.length > 0) {
    pages.push({ rows: currentPageRows });
  }

  // Footer logic
  if (pages.length > 0) {
    const lastPage = pages[pages.length - 1];
    
    // Check if the last page has room for the footer
    if (currentHeight > maxContentHeightWithFooter) {
      pages.push({ rows: [] }); // Empty page for signature
    }
  } else {
    // If no tests at all, still need 1 page for footer
    pages.push({ rows: [] });
  }

  return pages;
};
