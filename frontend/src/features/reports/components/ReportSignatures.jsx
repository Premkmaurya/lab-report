import React from "react";

export const ReportSignatures = ({ report, qrDataUrl }) => {
  if (!report) return null;

  return (
    <div className="grid grid-cols-3 items-end text-center pt-10 mt-auto gap-4">
      {/* Left: Technician Signature */}
      <div className="flex flex-col items-center justify-end">
        {report.technicianSignature && (
          <img
            src={report.technicianSignature}
            alt="Technician Signature"
            className="h-12 w-auto object-contain mb-1"
          />
        )}
        <p className="text-xs font-bold text-black">
          {report.technicianName || report.technician || "Abhishek"}
        </p>
        <p className="text-[11px] text-slate-700 font-normal">Lab Technician</p>
      </div>

      {/* Center: QR Code */}
      <div className="flex flex-col items-center justify-center">
        {qrDataUrl ? (
          <img
            src={qrDataUrl}
            alt="Verification QR Code"
            className="h-14 w-14 mb-1"
          />
        ) : (
          <div className="h-14 w-14 bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] text-slate-600 mb-1">
            QR Code
          </div>
        )}
        <p className="text-[10px] text-slate-800 text-center font-normal">
          Scan to Verify Report
        </p>
      </div>

      {/* Right: Pathologist Signature */}
      <div className="flex flex-col items-center justify-end">
        {report.pathologistSignature && (
          <img
            src={report.pathologistSignature}
            alt="Pathologist Signature"
            className="h-12 w-auto object-contain mb-1"
          />
        )}
        <p className="text-xs font-bold text-black">
          {report.pathologistName || report.pathologist || "Dr. A.Pandey"}
        </p>
        <p className="text-[11px] text-slate-700 font-normal">Pathologist</p>
      </div>
    </div>
  );
};
