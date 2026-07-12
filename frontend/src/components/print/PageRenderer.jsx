import React, { useMemo } from 'react';
import { usePrintTemplate } from '../../context/PrintTemplateContext';
import { PrintablePage } from './PrintablePage';
import { buildRows } from './RowBuilder';
import { paginateRows } from './PaginationEngine';

export const PageRenderer = ({ patient, report, customTemplate, zoom = 1 }) => {
  const context = usePrintTemplate();
  const template = customTemplate || (context ? context.template : null);

  const pages = useMemo(() => {
    if (!report) return [];
    const allRows = buildRows(report);
    return paginateRows(allRows, template);
  }, [report, template]);

  if (!patient || !report || pages.length === 0) return null;

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
