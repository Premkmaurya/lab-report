/**
 * @deprecated
 * This module is superseded by `components/print/PaginationPage.js`.
 * Do NOT use for new code.  Kept only to avoid breaking any stale imports
 * during the migration period.  Will be removed in a future cleanup.
 */

export const paginateReport = (report, template) => {
  // A4 dimensions at 96 DPI
  const PAGE_HEIGHT = 1123;
  
  // Parse margins or use defaults
  const marginTop = parseInt(template?.page?.marginTop || 40);
  const marginBottom = parseInt(template?.page?.marginBottom || 40);
  
  // Estimated heights
  const PATIENT_HEADER_HEIGHT = 190; // PatientInfo + Table Headers + spacing
  const FOOTER_HEIGHT = 130; // SignatureSection
  
  const DEPT_HEADING_HEIGHT = 45;
  const TEST_HEADING_HEIGHT = 45;
  const SECTION_HEADER_HEIGHT = 40;
  const PARAM_ROW_HEIGHT = 35; // Includes row spacing padding

  // Maximum content space available on a page (excluding footer)
  const maxContentHeight = PAGE_HEIGHT - marginTop - marginBottom - PATIENT_HEADER_HEIGHT;
  
  const pages = [];
  let currentPage = { rows: [], currentHeight: 0 };

  const startNewPage = () => {
    pages.push(currentPage);
    currentPage = { rows: [], currentHeight: 0 };
  };

  if (!report.tests || report.tests.length === 0) {
    pages.push({ rows: [], currentHeight: 0 });
    return pages;
  }

  // Group tests by department
  const groupedByDept = report.tests.reduce((acc, test) => {
    const dept = test.testId?.departmentId?.name || "GENERAL";
    if (!acc[dept]) acc[dept] = [];
    acc[dept].push(test);
    return acc;
  }, {});

  Object.entries(groupedByDept).forEach(([department, tests]) => {
    // Check space for Department Heading
    if (currentPage.currentHeight + DEPT_HEADING_HEIGHT > maxContentHeight) {
      startNewPage();
    }
    currentPage.rows.push({ type: 'department', content: department });
    currentPage.currentHeight += DEPT_HEADING_HEIGHT;

    tests.forEach((test) => {
      // Check space for Test Heading
      if (currentPage.currentHeight + TEST_HEADING_HEIGHT > maxContentHeight) {
        startNewPage();
        // Repeat context headers
        currentPage.rows.push({ type: 'department', content: department, isRepeat: true });
        currentPage.currentHeight += DEPT_HEADING_HEIGHT;
      }
      currentPage.rows.push({ type: 'test', content: test.testName });
      currentPage.currentHeight += TEST_HEADING_HEIGHT;

      if (test.result && test.result.length > 0) {
        test.result.forEach((res) => {
          if (res.type === 'section') {
            // Ensure section header and at least one parameter row fits
            if (currentPage.currentHeight + SECTION_HEADER_HEIGHT + PARAM_ROW_HEIGHT > maxContentHeight) {
              startNewPage();
              currentPage.rows.push({ type: 'department', content: department, isRepeat: true });
              currentPage.currentHeight += DEPT_HEADING_HEIGHT;
              currentPage.rows.push({ type: 'test', content: test.testName, isRepeat: true });
              currentPage.currentHeight += TEST_HEADING_HEIGHT;
            }
            currentPage.rows.push({ type: 'section', content: res.parameter });
            currentPage.currentHeight += SECTION_HEADER_HEIGHT;
          } else {
            // Standard parameter row
            if (currentPage.currentHeight + PARAM_ROW_HEIGHT > maxContentHeight) {
              startNewPage();
              currentPage.rows.push({ type: 'department', content: department, isRepeat: true });
              currentPage.currentHeight += DEPT_HEADING_HEIGHT;
              currentPage.rows.push({ type: 'test', content: test.testName, isRepeat: true });
              currentPage.currentHeight += TEST_HEADING_HEIGHT;
            }
            currentPage.rows.push({ type: 'parameter', content: res });
            currentPage.currentHeight += PARAM_ROW_HEIGHT;
          }
        });
      }
    });
  });

  if (currentPage.rows.length > 0) {
    pages.push(currentPage);
  }

  // Ensure footer has space on the absolute last page
  const lastPage = pages[pages.length - 1];
  if (lastPage && lastPage.currentHeight + FOOTER_HEIGHT > maxContentHeight) {
     pages.push({ rows: [], currentHeight: 0 }); // Empty page for footer
  }

  return pages;
};
