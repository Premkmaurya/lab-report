import React from 'react';
import { PageRenderer } from '../print/PageRenderer';

// We export ReportCanvas for the PrintTemplateDesigner to render the preview
export const ReportCanvas = ({ patient, report, customTemplate, zoom = 1 }) => {
  return <PageRenderer patient={patient} report={report} customTemplate={customTemplate} zoom={zoom} />;
};

// We keep PrintableReport as the exported wrapper which makes it hidden from screen 
// and absolute-positioned for the print overlay, delegating rendering to the new PageRenderer.
export const PrintableReport = ({ patient, report, customTemplate }) => {
  return (
    <div className="hidden print:block absolute top-0 left-0 w-full bg-white z-50">
      <PageRenderer patient={patient} report={report} customTemplate={customTemplate} />
    </div>
  );
};

