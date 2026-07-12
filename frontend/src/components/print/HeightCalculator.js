export const calculateRowHeight = (row) => {
  // Base spacing
  const rowSpacing = 4 * 2; // paddingTop + paddingBottom (from PrintablePage styles)
  
  if (row.type === 'department') {
    // 32px pt, 8px pb, text-2xl approx 32px line-height
    return 32 + 8 + 32; 
  }

  if (row.type === 'test') {
    // 24px pt, 8px pb, text-lg approx 28px line-height
    return 24 + 8 + 28;
  }

  if (row.type === 'section') {
    // 24px pt, 8px pb, text-lg approx 28px line-height
    // Plus a little extra for potential wrapping, though we can't calculate perfectly
    return 24 + 8 + 32;
  }

  if (row.type === 'parameter') {
    // standard parameter row. text-sm roughly 20px line-height
    // plus potential multiline wrapping for parameter name
    const paramLength = row.content?.parameter?.length || 0;
    const extraLines = Math.floor(paramLength / 50); // very rough estimate for wrapping
    return 20 + rowSpacing + (extraLines * 20);
  }
  
  if (row.type === 'blank') {
    return row.height || 20;
  }

  return 30; // fallback
};

export const calculatePageHeights = (template) => {
  // A4 dimensions at 96 DPI
  const PAGE_HEIGHT = 1123;
  
  const marginTop = parseInt(template?.page?.marginTop || 40);
  const marginBottom = parseInt(template?.page?.marginBottom || 40);
  
  // Heights for fixed sections (estimated based on typical content)
  // Patient header + table column headers
  const PATIENT_HEADER_HEIGHT = 190; 
  
  // Signature footer
  const FOOTER_HEIGHT = 130; 

  // Max space available for content rows on a normal page
  const maxContentHeight = PAGE_HEIGHT - marginTop - marginBottom - PATIENT_HEADER_HEIGHT;
  
  // Max space available on the last page if footer is rendered
  const maxContentHeightWithFooter = maxContentHeight - FOOTER_HEIGHT;

  return {
    PAGE_HEIGHT,
    marginTop,
    marginBottom,
    PATIENT_HEADER_HEIGHT,
    FOOTER_HEIGHT,
    maxContentHeight,
    maxContentHeightWithFooter
  };
};
