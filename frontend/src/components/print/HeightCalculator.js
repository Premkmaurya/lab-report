export const estimateRowHeights = (rows, template) => {
  // All heights in pixels at 96 DPI (screen) / 100% zoom
  // A4 = 210mm x 297mm. At 96dpi: 794 x 1123px
  // Measured empirically from the rendered DOM:
  const heights = {
    // First page: barcode (~60px) + patient info box (~90px) + table header row (~36px) + gap (~16px) = ~202px
    headerFirstPage: 202,
    // Subsequent pages: patient info box (~90px) + table header row (~36px) + gap (~16px) = ~142px
    headerContinuation: 142,
    // Alias for backward compat (used as 'header' key in PaginationEngine)
    header: 202,
    // Footer: two signature lines + horizontal rule + padding = ~90px
    footer: 90,
    rows: {},
    pageMargins: { top: 20, bottom: 20 }
  };
  
  if (template?.page) {
     heights.pageMargins.top = parseInt(template.page.marginTop || 20);
     heights.pageMargins.bottom = parseInt(template.page.marginBottom || 20);
     // Re-derive the first-page header too in case template has a different barcode height
     heights.headerFirstPage = 202;
     heights.headerContinuation = 142;
     heights.header = 202;
  }

  const baseFontSize = parseInt(template?.typography?.baseFontSize || 14);
  // Row-level vertical padding (paddingTop + paddingBottom = 4 + 4 = 8px)
  const rowPaddingTotal = 8;

  rows.forEach((row, i) => {
    let h = 0;
    if (row.type === 'department') {
      // pt-8 (32px) + text height (~24px) + pb-2 (8px) = ~64px
      h = 64;
    } else if (row.type === 'test') {
      // pt-6 (24px) + text height (~20px) + pb-2 (8px) = ~52px
      h = 52;
    } else if (row.type === 'section') {
      // pt-6 (24px) + text can wrap
      const len = row.content ? row.content.length : 0;
      const lines = Math.max(1, Math.ceil(len / 35));
      h = 24 + (lines * baseFontSize * 1.4) + 4;
    } else if (row.type === 'parameter') {
      // Parameter name can wrap. Col width is 45% of ~754px page width minus margins ≈ 339px
      // At ~7.5px per char (14px font), ~45 chars fit per line
      const paramLen = row.content?.parameter ? row.content.parameter.length : 0;
      const unitLen = row.content?.unit ? String(row.content.unit).length : 0;
      // Unit column (15%) can also wrap
      const unitLines = Math.max(1, Math.ceil(unitLen / 10));
      const paramLines = Math.max(1, Math.ceil(paramLen / 40));
      const lines = Math.max(paramLines, unitLines);
      h = (lines * baseFontSize * 1.5) + rowPaddingTotal;
    } else if (row.type === 'blank') {
      h = row.height || 16;
    }
    
    heights.rows[i] = h;
  });

  // Dummy continuation row height estimates (used by PaginationEngine for new-page overhead)
  heights.rows['dummy_dept_cont'] = 64;
  heights.rows['dummy_test_cont'] = 52;
  heights.rows['dummy_sec_cont'] = 44;

  return heights;
};
