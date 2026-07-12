import React, { useMemo } from 'react';
import { usePrintTemplate } from '../../context/PrintTemplateContext';
import { PrintablePage } from './PrintablePage';
import { buildRows } from './RowBuilder';
import { paginateRows } from './PaginationEngine';
import { estimateRowHeights } from './HeightCalculator';

export const PageRenderer = ({ patient, report, customTemplate, zoom = 1 }) => {
  const context = usePrintTemplate();
  const template = customTemplate || (context ? context.template : null);
  
  // Single, synchronous computation for the entire layout. 
  // No loading screens, no effects, no loops.
  const pages = useMemo(() => {
    if (!report || !patient) return [];
    
    // 1. Collect report data and normalize to rows
    const allRows = buildRows(report);
    if (allRows.length === 0) return [];

    // 2. Estimate heights directly in memory
    const measurements = estimateRowHeights(allRows, template);
    
    // 3. Generate paginated layout model
    try {
      return paginateRows(allRows, measurements, template);
    } catch (err) {
      console.error("Pagination failed:", err);
      // Fallback: dump all rows to one page to avoid empty screen
      return [{ rows: allRows }];
    }
  }, [report, patient, template]);

  if (!patient || !report || pages.length === 0) return null;

  // 4. Open print page immediately
  return (
    <div className="report-container flex flex-col gap-8 bg-gray-100 print:bg-white print:gap-0 print:block">
      {pages.map((page, index) => (
        <PrintablePage 
          key={index}
          patient={patient}
          report={report}
          template={template}
          rows={page.rows}
          isFirstPage={index === 0}
          isLastPage={index === pages.length - 1}
          zoom={zoom}
        />
      ))}
    </div>
  );
};
