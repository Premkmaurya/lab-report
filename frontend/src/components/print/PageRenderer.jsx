import { useMemo } from 'react';
import { usePrintTemplate } from '../../context/PrintTemplateContext';
import { PrintablePage } from './PrintablePage';
import { buildRows } from './RowBuilder';

export const PageRenderer = ({ patient, report, customTemplate, zoom = 1 }) => {
  const context = usePrintTemplate();
  const template = customTemplate || (context ? context.template : null);

  const rows = useMemo(() => {
    if (!report || !patient) return [];
    return buildRows(report);
  }, [report, patient]);

  if (!patient || !report) return null;

  return (
    <div className="report-container bg-gray-100 print:bg-white">
      <PrintablePage
        patient={patient}
        report={report}
        template={template}
        rows={rows}
        zoom={zoom}
      />
    </div>
  );
};
