import React from "react";

export const PatientInfo = ({ patient, report, template }) => {
  const reportDate = new Date(report.createdAt || report.date)
    .toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
    .replace(/ /g, "-");
  const regDate = new Date(patient.createdAt || patient.date)
    .toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
    .replace(/ /g, "-");

  const nameStyles = template?.elements?.patientName || {};

  return (
    <div className="border border-slate-300 p-4 mb-6 text-[13px] text-slate-900 bg-white">
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <div className="grid grid-cols-[110px_auto] text-lg gap-4">
            <span className="text-black font-semibold font-medium whitespace-nowrap">
              Patient Name:
            </span>
            <span>{patient.name}</span>
          </div>
          <div className="grid grid-cols-[110px_auto] text-lg gap-2">
            <span className="text-black font-semibold font-medium whitespace-nowrap">
              Age/Gender:
            </span>
            <span className=" capitalize">
              {patient.age} Years / {patient.gender}
            </span>
          </div>
          <div className="grid grid-cols-[100px_auto] text-lg gap-2">
            <span className="text-black font-semibold font-medium whitespace-nowrap">
              Ref. Doctor:
            </span>
            <span>{patient.referredDoctor}</span>
          </div>
        </div>

        <div className="space-y-1">
          <div className="grid grid-cols-[100px_auto] text-lg gap-2">
            <span className="text-black font-semibold font-medium">
              Visit ID:
            </span>
            <span>{patient.visitId || "N/A"}</span>
          </div>
          <div className="grid grid-cols-[100px_auto] text-lg gap-2">
            <span className="text-black font-semibold font-medium">
              Reg. Date:
            </span>
            <span>{regDate}</span>
          </div>
          <div className="grid grid-cols-[100px_auto] text-lg gap-4">
            <span className="text-black font-semibold font-medium whitespace-nowrap">
              Report Date:
            </span>
            <span>{reportDate}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
