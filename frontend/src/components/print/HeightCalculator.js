export const estimateRowHeights = (rows, template) => {
  const heights = {
    header: 250, // Patient info, barcode, and table headers
    footer: 120, // Signature section
    rows: {},
    pageMargins: { top: 40, bottom: 40 }
  };
  
  if (template?.page) {
     heights.pageMargins.top = parseInt(template.page.marginTop || 40);
     heights.pageMargins.bottom = parseInt(template.page.marginBottom || 40);
  }

  const baseFontSize = parseInt(template?.typography?.baseFontSize || 14);
  const rowSpacing = 4; // Padding we apply top and bottom

  rows.forEach((row, i) => {
    let h = 0;
    if (row.type === 'department') h = 60; // larger font, padding
    else if (row.type === 'test') h = 50; 
    else if (row.type === 'section') {
      // rough wrap estimate
      const len = row.content ? row.content.length : 0;
      const lines = Math.max(1, Math.ceil(len / 40));
      h = 30 + (lines * baseFontSize * 1.2);
    }
    else if (row.type === 'parameter') {
      const paramLen = row.content?.parameter ? row.content.parameter.length : 0;
      const lines = Math.max(1, Math.ceil(paramLen / 45)); // assuming 45 chars fit in the column
      h = (lines * baseFontSize * 1.5) + (rowSpacing * 2);
    }
    else if (row.type === 'blank') h = row.height || 20;
    
    heights.rows[i] = h;
  });

  // Add dummy continuations for the pagination engine
  heights.rows['dummy_dept_cont'] = 60;
  heights.rows['dummy_test_cont'] = 50;
  heights.rows['dummy_sec_cont'] = 45;

  return heights;
};
