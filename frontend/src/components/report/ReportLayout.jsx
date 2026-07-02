import React from 'react';
import { PatientInfo } from './PatientInfo';
import { TestResultTable } from './TestResultTable';
import { SignatureSection } from './SignatureSection';

export const ReportLayout = ({ patient, report }) => {
  if (!patient || !report) return null;

  return (
    <div className="report-page bg-white font-sans text-[#0F172A] w-full max-w-[210mm] min-h-[297mm] mx-auto shadow-xl print:shadow-none print:max-w-none print:w-auto">
      <div className="report-content">
        <PatientInfo patient={patient} report={report} />
        
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
              <div className="text-left my-4 pb-2">
                <h1 className="text-xl font-bold text-center text-[#0F172A] underline decoration-1 underline-offset-2 uppercase tracking-wider">
                  {department}
                </h1>
              </div>
              {tests.map((test, index) => (
                <TestResultTable key={`${department}-${index}`} test={test} />
              ))}
            </React.Fragment>
          ))
        ) : (
          <p className="text-center text-[#475569] italic py-10">No tests available in this report.</p>
        )}
      </div>
      
      <div className="report-footer">
        <SignatureSection patient={patient} />
      </div>
    </div>
  );
};