import React from 'react';
import { PatientInfo } from './PatientInfo';
import { TestResultTable } from './TestResultTable';
import { SignatureSection } from './SignatureSection';
import { usePrintTemplate } from '../../context/PrintTemplateContext';

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
  
  const thStyles = template?.elements?.tableHeader || {};
  const deptHeadingStyles = template?.elements?.departmentHeading || {};

  return (
    <div 
      className="report-page bg-white font-sans text-[#0F172A] w-[794px] min-h-[1123px] mx-auto shadow-md border border-gray-200 rounded-sm print:border-none print:shadow-none print:rounded-none print:w-auto print:min-h-full print:max-w-none print:mx-0 flex flex-col"
      style={{ ...pageStyles, ...typoStyles }}
    >
      <div className="report-content flex-1">
        <table className="w-full text-caption text-slate-900 border-collapse mt-6" style={typoStyles}>
          <thead className="bg-[#F8FAFC]">
            <tr>
              <td colSpan="4" className="p-0 border-none bg-white">
                <PatientInfo patient={patient} report={report} template={template} />
              </td>
            </tr>
            <tr>
              <th className="px-3 py-2 text-left text-sm font-semibold w-[45%]">TEST NAME</th>
              <th className="px-3 py-2 text-left text-sm font-semibold w-[20%]">RESULT</th>
              <th className="px-3 py-2 text-left text-sm font-semibold w-[15%]">UNIT</th>
              <th className="px-3 py-2 text-left text-sm font-semibold w-[20%] whitespace-nowrap">REFERENCE RANGE</th>
            </tr>
          </thead>
          <tbody>
            {report.tests && report.tests.length > 0 ? (
              Object.entries(
                report.tests.reduce((acc, test) => {
                  const dept = test.testId?.departmentId?.name || "GENERAL";
                  if (!acc[dept]) acc[dept] = [];
                  acc[dept].push(test);
                  return acc;
                }, {})
              ).map(([department, tests]) => (
                <React.Fragment key={department}>
                  <tr>
                    <td colSpan="4" className="pt-8 pb-2 text-center bg-white">
                      <span 
                        className="text-2xl font-bold text-[#0F172A] uppercase tracking-wider block"
                        style={deptHeadingStyles}
                      >
                        {department}
                      </span>
                    </td>
                  </tr>
                  {tests.map((test, index) => (
                    <TestResultTable key={`${department}-${index}`} test={test} template={template} />
                  ))}
                </React.Fragment>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="text-center text-[#475569] italic py-10 bg-white">
                  No tests available in this report.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      <div className="report-footer">
        <SignatureSection patient={patient} template={template} />
      </div>
    </div>
  );
};