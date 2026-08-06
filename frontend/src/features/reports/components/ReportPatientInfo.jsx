import React from "react";
import BarcodeElement from "../../../components/print/BarcodeElement";

export const ReportPatientInfo = ({ report, formatReportDate }) => {
  if (!report) return null;

  return (
    <div className="relative">
      {/* Barcode positioned top-right above border box */}
      {report.visitId && (
        <div className="flex justify-end mb-1">
          <BarcodeElement
            value={report.visitId}
            settings={{ height: 35, displayValue: false, alignment: "right" }}
          />
        </div>
      )}

      {/* Patient Information Border Box */}
      <div className="border border-slate-400 p-3 text-xs text-black">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1">
          {/* Left Column */}
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="font-bold w-28 shrink-0">Patient Name:</span>
              <span className="font-normal">{report.patientName}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-bold w-28 shrink-0">Age/Gender:</span>
              <span className="font-normal">
                {report.age} Years / {report.gender}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-bold w-28 shrink-0">Ref. Doctor:</span>
              <span className="font-normal">{report.doctor}</span>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="font-bold w-28 shrink-0">Visit ID:</span>
              <span className="font-normal">{report.visitId}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-bold w-28 shrink-0">Reg. Date:</span>
              <span className="font-normal">{formatReportDate(report.registrationDate)}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-bold w-28 shrink-0">Report Date:</span>
              <span className="font-normal">{formatReportDate(report.reportDate)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
