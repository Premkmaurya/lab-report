import React from "react";
import { ReportPatientInfo } from "./ReportPatientInfo";
import { ReportTestTable } from "./ReportTestTable";
import { ReportSignatures } from "./ReportSignatures";

export const ReportPaper = ({ report, qrDataUrl, formatReportDate }) => {
  return (
    <div className="bg-white border border-[#D9DEE7] rounded-lg shadow-sm p-6 sm:p-8 min-h-[900px] flex flex-col justify-between">
      <div className="space-y-6">
        {/* Patient Information Section */}
        <ReportPatientInfo report={report} formatReportDate={formatReportDate} />

        {/* Global Investigation Results Table */}
        <ReportTestTable tests={report?.tests || []} />
      </div>

      {/* Signatures & QR Code Section (Pinned to Bottom) */}
      <ReportSignatures report={report} qrDataUrl={qrDataUrl} />
    </div>
  );
};
