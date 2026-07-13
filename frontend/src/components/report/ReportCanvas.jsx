import React from 'react';
import { PageRenderer } from '../print/PageRenderer';

/**
 * ReportCanvas
 *
 * Renders a paginated, interactive preview of the lab report.
 * Used by the Print Template Designer to show a live preview.
 */
export const ReportCanvas = ({ patient, report, customTemplate, zoom = 1 }) => {
  return (
    <PageRenderer
      patient={patient}
      report={report}
      customTemplate={customTemplate}
      zoom={zoom}
    />
  );
};

/**
 * PrintableReport — DEPRECATED
 *
 * Previously rendered the report as a hidden CSS overlay that was printed
 * via window.print() on the main application page.  This approach has been
 * replaced by PrintOrchestrator + openPrintWindow() which opens a dedicated
 * print window containing only the report HTML.
 *
 * Kept as a no-op export so existing import statements don't cause build
 * errors during the migration period.  Remove once all call sites are updated.
 *
 * @deprecated Use PrintOrchestrator instead.
 */
export const PrintableReport = () => null;
