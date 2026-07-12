import { calculateRowHeight, calculatePageHeights } from './HeightCalculator';

export const paginateRows = (rows, template) => {
  const heights = calculatePageHeights(template);
  const { maxContentHeight, maxContentHeightWithFooter } = heights;
  
  const pages = [];
  let currentPageRows = [];
  let currentHeight = 0;
  
  let currentDepartment = null;
  let currentTest = null;

  const startNewPage = () => {
    pages.push({ rows: [...currentPageRows] });
    currentPageRows = [];
    currentHeight = 0;
    
    // Repeat context headers if we are splitting inside a test
    if (currentDepartment) {
       currentPageRows.push({ type: 'department', content: currentDepartment, isRepeat: true });
       currentHeight += calculateRowHeight({ type: 'department' });
    }
    if (currentTest) {
       currentPageRows.push({ type: 'test', content: currentTest, isRepeat: true });
       currentHeight += calculateRowHeight({ type: 'test' });
    }
  };

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowHeight = calculateRowHeight(row);

    if (row.type === 'department') {
      currentDepartment = row.content;
      currentTest = null;
    } else if (row.type === 'test') {
      currentTest = row.content;
    }

    // Look ahead logic for smart page breaks
    let requiredHeight = rowHeight;
    let lookaheadIndex = i + 1;
    
    // If it's a heading, we MUST ensure the first child also fits on this page
    if (row.type === 'department' || row.type === 'test' || row.type === 'section') {
      if (lookaheadIndex < rows.length) {
        requiredHeight += calculateRowHeight(rows[lookaheadIndex]);
      }
    }

    // Check if we need to break
    if (currentHeight + requiredHeight > maxContentHeight) {
      // If we are at the beginning of a page and even the required height is too big,
      // we must just render it anyway to avoid an infinite loop (very long parameter row)
      if (currentPageRows.length > (currentDepartment ? (currentTest ? 2 : 1) : 0)) {
        // Clear context before startNewPage since the heading itself will be moved to next page
        if (row.type === 'department') currentDepartment = null;
        if (row.type === 'test') currentTest = null;
        
        startNewPage();
        
        // Restore context since we moved the heading
        if (row.type === 'department') currentDepartment = row.content;
        if (row.type === 'test') currentTest = row.content;
      }
    }

    currentPageRows.push(row);
    currentHeight += rowHeight;
  }

  if (currentPageRows.length > 0) {
    pages.push({ rows: currentPageRows });
  }

  // Handle footer space logic for the very last page
  if (pages.length > 0) {
    const lastPage = pages[pages.length - 1];
    
    // Calculate total height of last page
    const lastPageHeight = lastPage.rows.reduce((sum, row) => sum + calculateRowHeight(row), 0);
    
    if (lastPageHeight > maxContentHeightWithFooter) {
      // Not enough room for signature on the last page. Add a blank page for signature.
      pages.push({ rows: [] });
    }
  }

  return pages;
};
