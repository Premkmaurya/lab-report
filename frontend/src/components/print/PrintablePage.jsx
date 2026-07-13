import { PatientInfo } from '../report/PatientInfo';
import { SignatureSection } from '../report/SignatureSection';
import { BarcodeElement } from './BarcodeElement';
import { checkAbnormalResult } from '../../utils/resultUtils';
import './styles/print.css';

export const PrintablePage = ({
  patient,
  report,
  template,
  rows,
  zoom = 1,
}) => {
  const page = template?.page || {};
  const typoStyles = template?.typography ? {
    fontFamily: template.typography.baseFont,
    fontSize: template.typography.baseFontSize,
    lineHeight: template.typography.lineHeight,
  } : {};

  const barcodeSettings = template?.elements?.barcode || { enabled: true };
  const deptHeadingStyles = template?.elements?.departmentHeading || {};
  const testHeadingStyles = template?.elements?.testHeading || {};
  const sectionHeaderStyles = template?.elements?.sectionHeader || {};
  const parameterStyles = template?.elements?.parameter || {};
  const resultStyles = template?.elements?.result || {};
  const unitStyles = template?.elements?.unit || {};
  const normalRangeStyles = template?.elements?.normalRange || template?.elements?.unit || {};
  const rowSpacing = 4;

  const pageCss = `
    @page {
      size: A4;
      margin: ${page.marginTop || '25mm'} ${page.marginRight || '15mm'} ${page.marginBottom || '20mm'} ${page.marginLeft || '15mm'};
      @top-center { content: element(patientHeader); }
      @bottom-center { content: element(reportFooter); }
    }
  `;

  const renderRow = (row, i) => {
    if (row.type === 'department') {
      return (
        <tr key={i} className="department-row no-break">
          <td colSpan="4" className="pt-8 pb-2 text-center bg-white">
            <span className="text-2xl font-bold text-[#0F172A] uppercase tracking-wider block" style={deptHeadingStyles}>
              {row.content}
            </span>
          </td>
        </tr>
      );
    }

    if (row.type === 'test') {
      return (
        <tr key={i} className="test-row bg-white no-break">
          <td colSpan="4" className="pt-6 pb-2 px-3 text-left">
            <span className="text-lg font-bold text-[#0F172A] uppercase underline decoration-1 underline-offset-4" style={testHeadingStyles}>
              {row.content}
            </span>
          </td>
        </tr>
      );
    }

    if (row.type === 'section') {
      return (
        <tr key={i} className="section-row bg-white no-break">
          <td colSpan="1" className="pt-6 pb-0 px-3 text-left">
            <span className="section-header text-lg font-extrabold text-[#0F172A] uppercase tracking-wider block" style={{
              whiteSpace: 'normal',
              overflowWrap: 'anywhere',
              wordBreak: 'break-word',
              lineHeight: 1.2,
              maxWidth: '100%',
              ...sectionHeaderStyles,
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
      const { isAbnormal, formattedValue } = checkAbnormalResult(res.value, res.normalRange);
      const valueStyle = isAbnormal ? { fontWeight: 'bold' } : {};

      return (
        <tr key={i} className="parameter-row bg-white no-break">
          <td className="px-3 text-left" style={{
            paddingTop: `${rowSpacing}px`,
            paddingBottom: `${rowSpacing}px`,
            wordBreak: 'break-word',
            overflowWrap: 'anywhere',
            whiteSpace: 'normal',
            ...parameterStyles,
          }}>
            {res.parameter || 'N/A'}
          </td>
          <td className="px-3 text-left" style={{ paddingTop: `${rowSpacing}px`, paddingBottom: `${rowSpacing}px`, ...resultStyles, ...valueStyle }}>
            {formattedValue}
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

    if (row.type === 'blank') {
      return (
        <tr key={i} className="blank-row no-break">
          <td colSpan="4" style={{ height: `${row.height || 20}px` }}></td>
        </tr>
      );
    }

    return null;
  };

  return (
    <article className="report-document paged-source font-sans text-[#0F172A]" style={typoStyles}>
      <style>{pageCss}</style>

      <header className="patient-running-header" style={{ position: 'running(patientHeader)' }}>
        <BarcodeElement value={patient.visitId} settings={barcodeSettings} zoom={zoom} />
        <PatientInfo patient={patient} report={report} template={template} />
      </header>

      <table className="report-table w-full text-caption text-slate-900 border-collapse" style={{ ...typoStyles, tableLayout: 'fixed' }}>
        <colgroup>
          <col style={{ width: '45%' }} />
          <col style={{ width: '20%' }} />
          <col style={{ width: '15%' }} />
          <col style={{ width: '20%' }} />
        </colgroup>
        <thead className="bg-[#F8FAFC]">
          <tr className="table-heading-row no-break">
            <th className="px-3 py-2 text-left text-sm font-semibold">TEST NAME</th>
            <th className="px-3 py-2 text-left text-sm font-semibold">RESULT</th>
            <th className="px-3 py-2 text-center text-sm font-semibold">UNIT</th>
            <th className="px-3 py-2 text-left text-sm font-semibold whitespace-nowrap">REFERENCE RANGE</th>
          </tr>
        </thead>
        <tbody>
          {rows.length > 0 ? rows.map((row, i) => renderRow(row, i)) : (
            <tr className="no-break">
              <td colSpan="4" className="text-center text-[#475569] italic py-10 bg-white">
                No tests available in this report.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <footer className="signature-running-footer" style={{ position: 'running(reportFooter)' }}>
        <SignatureSection patient={patient} template={template} />
      </footer>
    </article>
  );
};