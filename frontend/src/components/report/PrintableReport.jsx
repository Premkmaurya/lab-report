import React from 'react';
import { ReportHeader } from './ReportHeader';
import { ReportBody } from './ReportBody';
import { ReportFooter } from './ReportFooter';

export const PrintableReport = ({ patient, report }) => {
  if (!patient || !report) return null;

  return (
    <div className="w-full max-w-[210mm] min-h-[297mm] p-[20mm] mx-auto bg-white print:w-full print:h-full print:p-0 print:m-0 print:shadow-none shadow-xl border border-gray-200">
      <div className="print:block h-full flex flex-col font-sans">
        <ReportHeader patient={patient} report={report} />
        
        <div className="grow my-6">
          {report.tests && report.tests.length > 0 ? (
            report.tests.map((test, index) => (
              <ReportBody key={index} test={test} />
            ))
          ) : (
            <p className="text-center text-gray-500 italic py-10">No tests available in this report.</p>
          )}
        </div>
        
        <ReportFooter patient={patient} />
      </div>
    </div>
  );
};
