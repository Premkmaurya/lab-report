import React from 'react';
import { PatientInfo } from './PatientInfo';
import { SignatureSection } from './SignatureSection';
import { usePrintTemplate } from '../../context/PrintTemplateContext';
import { paginateReport } from '../../utils/paginationEngine';
import { BarcodeElement } from '../print/BarcodeElement';

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
        <td colSpan="1" className="pt-6 pb-2 px-3 text-left">
          <span className="section-header text-lg font-extrabold text-[#0F172A] uppercase tracking-wider block" style={{
            whiteSpace: 'normal',
            overflowWrap: 'anywhere',
            wordBreak: 'break-word',
            lineHeight: 1.2,
            maxWidth: '100%',
            ...sectionHeaderStyles
          }}>
            {row.content}
          </span>
        </td>
        <td colSpan="3"></td>
      </tr>
    );
  }

  if (row.type === 'parameter') {
    const res = row.content;
    return (
      <tr className="bg-white">
        <td className="px-3 text-left" style={{ 
          paddingTop: `${rowSpacing}px`, 
          paddingBottom: `${rowSpacing}px`, 
          wordBreak: 'break-word', 
          overflowWrap: 'anywhere', 
          whiteSpace: 'normal',
          ...parameterStyles 
        }}>
          {res.parameter || "N/A"}
        </td>
        <td className="px-3 text-left" style={{ paddingTop: `${rowSpacing}px`, paddingBottom: `${rowSpacing}px`, ...resultStyles }}>
          {res.value}
        </td>
        <td className="px-3 text-center text-[#475569]" style={{ paddingTop: `${rowSpacing}px`, paddingBottom: `${rowSpacing}px`, ...unitStyles }}>
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

export const ReportCanvas = ({ patient, report, customTemplate, zoom = 1 }) => {
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

  const barcodeSettings = template?.elements?.barcode || { enabled: true };

  return (
    <div className="report-container flex flex-col gap-8 bg-gray-100 print:bg-white print:gap-0 print:block">
      {pages.map((page, index) => (
        <div 
          key={index} 
          className="report-page page bg-white font-sans text-[#0F172A] mx-auto shadow-md border border-gray-200 print:border-none print:shadow-none print:mx-0 box-border"
          style={{ 
            width: '794px',
            height: '1123px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            position: 'relative',
            ...pageStyles, 
            ...typoStyles,
            pageBreakAfter: index < pages.length - 1 ? 'always' : 'auto'
          }}
        >
          <div className="page-header shrink-0">
            {index === 0 && <BarcodeElement value={patient.visitId} settings={barcodeSettings} zoom={zoom} />}
            <PatientInfo patient={patient} report={report} template={template} />
            <table className="w-full text-caption text-slate-900 border-collapse mt-6" style={{ ...typoStyles, tableLayout: 'fixed' }}>
              <colgroup>
                <col style={{ width: '45%' }} />
                <col style={{ width: '20%' }} />
                <col style={{ width: '15%' }} />
                <col style={{ width: '20%' }} />
              </colgroup>
              <thead className="bg-[#F8FAFC]">
                <tr>
                  <th className="px-3 py-2 text-left text-sm font-semibold">TEST NAME</th>
                  <th className="px-3 py-2 text-left text-sm font-semibold">RESULT</th>
                  <th className="px-3 py-2 text-center text-sm font-semibold">UNIT</th>
                  <th className="px-3 py-2 text-left text-sm font-semibold whitespace-nowrap">REFERENCE RANGE</th>
                </tr>
              </thead>
            </table>
          </div>

          <div className="page-body flex-1 w-full">
            <table className="w-full text-caption text-slate-900 border-collapse" style={{ ...typoStyles, tableLayout: 'fixed' }}>
              <colgroup>
                <col style={{ width: '45%' }} />
                <col style={{ width: '20%' }} />
                <col style={{ width: '15%' }} />
                <col style={{ width: '20%' }} />
              </colgroup>
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
