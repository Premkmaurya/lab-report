import React from 'react';
import Barcode from 'react-barcode';
import { PatientInfo } from './PatientInfo';
import { SignatureSection } from './SignatureSection';
import { usePrintTemplate } from '../../context/PrintTemplateContext';
import { paginateReport } from '../../utils/paginationEngine';

const RowRenderer = ({ row, template }) => {
  const deptHeadingStyles = template?.elements?.departmentHeading || {};
  const testHeadingStyles = template?.elements?.testHeading || {};
  const sectionHeaderStyles = template?.elements?.sectionHeader || {};
  const parameterStyles = template?.elements?.parameter || {};
  const resultStyles = template?.elements?.result || {};
  const unitStyles = template?.elements?.unit || {};
  const normalRangeStyles = template?.elements?.unit || {};
  const rowSpacing = 4;

  if (row.type === 'department') {
    return (
      <tr>
        <td colSpan="4" className="pt-8 pb-2 text-center bg-white">
          <span className="text-2xl font-bold text-[#0F172A] uppercase tracking-wider block" style={deptHeadingStyles}>
            {row.content} {row.isRepeat ? '(Cont.)' : ''}
          </span>
        </td>
      </tr>
    );
  }

  if (row.type === 'test') {
    return (
      <tr className="bg-white">
        <td colSpan="4" className="pt-6 pb-2 px-3 text-left">
          <span className="text-lg font-bold text-[#0F172A] uppercase underline decoration-1 underline-offset-4" style={testHeadingStyles}>
            {row.content} {row.isRepeat ? '(Cont.)' : ''}
          </span>
        </td>
      </tr>
    );
  }

  if (row.type === 'section') {
    return (
      <tr className="bg-white">
        <td colSpan="4" className="pt-6 pb-2">
          <span className="text-lg font-extrabold text-left text-[#0F172A] uppercase tracking-wider block" style={sectionHeaderStyles}>
            {row.content}
          </span>
        </td>
      </tr>
    );
  }

  if (row.type === 'parameter') {
    const res = row.content;
    return (
      <tr className="bg-white">
        <td className="px-3 text-left" style={{ paddingTop: `${rowSpacing}px`, paddingBottom: `${rowSpacing}px`, ...parameterStyles }}>
          {res.parameter || "N/A"}
        </td>
        <td className="px-3 text-left" style={{ paddingTop: `${rowSpacing}px`, paddingBottom: `${rowSpacing}px`, ...resultStyles }}>
          {res.value}
        </td>
        <td className="px-3 text-left text-[#475569]" style={{ paddingTop: `${rowSpacing}px`, paddingBottom: `${rowSpacing}px`, ...unitStyles }}>
          {res.unit}
        </td>
        <td className="px-3 text-left text-[#475569]" style={{ paddingTop: `${rowSpacing}px`, paddingBottom: `${rowSpacing}px`, ...normalRangeStyles }}>
          {res.normalRange}
        </td>
      </tr>
    );
  }

  return null;
};

export const ReportCanvas = ({ patient, report, customTemplate }) => {
  const context = usePrintTemplate();
  const template = customTemplate || (context ? context.template : null);

  if (!patient || !report) return null;

  const pageStyles = template?.page ? {
    paddingTop: template.page.marginTop,
    paddingBottom: template.page.marginBottom,
    paddingLeft: template.page.marginLeft,
    paddingRight: template.page.marginRight,
  } : {};

  const typoStyles = template?.typography ? {
    fontFamily: template.typography.baseFont,
    fontSize: template.typography.baseFontSize,
    lineHeight: template.typography.lineHeight,
  } : {};

  const pages = paginateReport(report, template);

  const barcodeStyles = template?.elements?.barcode || { show: true };
  const barcodeAlignment = barcodeStyles.alignment || "right";
  const barcodePositionClass =
    barcodeAlignment === "left"
      ? "justify-start"
      : barcodeAlignment === "center"
      ? "justify-center"
      : "justify-end";

  return (
    <div className="report-container flex flex-col gap-8 bg-gray-100 print:bg-white print:gap-0 print:block">
      {pages.map((page, index) => (
        <div 
          key={index} 
          className="report-page page bg-white font-sans text-[#0F172A] mx-auto shadow-md border border-gray-200 print:border-none print:shadow-none print:mx-0 box-border"
          style={{ 
            width: '210mm',
            height: '297mm',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            ...pageStyles, 
            ...typoStyles,
            pageBreakAfter: index < pages.length - 1 ? 'always' : 'auto'
          }}
        >
          <div className="page-header shrink-0">
            {barcodeStyles.show && patient.visitId && (
              <div
                className={`flex w-full ${barcodePositionClass} mb-3`}
                style={{
                  marginTop: barcodeStyles.marginTop || "0px",
                  marginBottom: barcodeStyles.marginBottom || "0px",
                  textAlign: barcodeAlignment,
                }}
              >
                <div>
                  <Barcode
                    value={patient.visitId}
                    width={parseFloat(barcodeStyles.width) || 1.5}
                    height={parseInt(barcodeStyles.height, 10) || 40}
                    displayValue={barcodeStyles.displayValue !== false}
                    fontSize={12}
                    margin={0}
                    background="transparent"
                  />
                </div>
              </div>
            )}
            <PatientInfo patient={patient} report={report} template={template} />
            <table className="w-full text-caption text-slate-900 border-collapse mt-6" style={typoStyles}>
              <thead className="bg-[#F8FAFC]">
                <tr>
                  <th className="px-3 py-2 text-left text-sm font-semibold w-[45%]">TEST NAME</th>
                  <th className="px-3 py-2 text-left text-sm font-semibold w-[20%]">RESULT</th>
                  <th className="px-3 py-2 text-left text-sm font-semibold w-[15%]">UNIT</th>
                  <th className="px-3 py-2 text-left text-sm font-semibold w-[20%] whitespace-nowrap">REFERENCE RANGE</th>
                </tr>
              </thead>
            </table>
          </div>

          <div className="page-body flex-1 w-full">
            <table className="w-full text-caption text-slate-900 border-collapse" style={typoStyles}>
              <tbody>
                {page.rows.length > 0 ? (
                  page.rows.map((row, i) => <RowRenderer key={i} row={row} template={template} />)
                ) : index === 0 ? (
                  <tr>
                    <td colSpan="4" className="text-center text-[#475569] italic py-10 bg-white">
                      No tests available in this report.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
          
          {index === pages.length - 1 && (
            <div className="page-footer shrink-0" style={{ marginTop: 'auto' }}>
              <SignatureSection patient={patient} template={template} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export const PrintableReport = ({ patient, report, customTemplate }) => {
  return (
    <div className="hidden print:block absolute top-0 left-0 w-full bg-white z-50">
      <ReportCanvas patient={patient} report={report} customTemplate={customTemplate} />
    </div>
  );
};