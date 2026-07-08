import React from 'react';
import { PatientInfo } from './PatientInfo';
import { TestResultTable } from './TestResultTable';
import { SignatureSection } from './SignatureSection';
import { usePrintTemplate } from '../../context/PrintTemplateContext';

export const ReportLayout = ({ patient, report, customTemplate }) => {
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

  return (
    <div 
      className="report-page bg-white font-sans text-[#0F172A] w-full max-w-[210mm] min-h-[297mm] mx-auto shadow-xl print:shadow-none print:max-w-none print:w-auto"
      style={{ ...pageStyles, ...typoStyles }}
    >
      <div className="report-content">
        <table className="w-full text-caption text-slate-900 border-collapse mt-6" style={typoStyles}>
          <thead className="bg-[#F8FAFC]">
            <tr>
              <td colSpan="4" className="p-0 border-none bg-white">
                <PatientInfo patient={patient} report={report} template={template} />
              </td>
            </tr>
            <tr>
              <th className="px-3 py-2 text-left text-xl font-semibold w-[45%]" style={thStyles}>TEST NAME</th>
              <th className="px-3 py-2 text-left text-xl font-semibold w-[20%]" style={thStyles}>RESULT</th>
              <th className="px-3 py-2 text-left text-xl font-semibold w-[20%] whitespace-nowrap" style={thStyles}>REFERENCE RANGE</th>
              <th className="px-3 py-2 text-left text-xl font-semibold w-[15%]" style={thStyles}>UNIT</th>
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
                        style={template?.elements?.departmentHeading || {}}
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