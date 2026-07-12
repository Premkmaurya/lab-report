import React from "react";

export const PatientInfo = ({ patient, report, template }) => {
  const reportDateObj = new Date(report.createdAt || report.date);
  const reportDate = reportDateObj
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

  const visitTimeRaw = patient.visitTime || report.createdAt || report.date;
  const visitTimeObj = new Date(visitTimeRaw);
  let visitTime = "N/A";
  if (!isNaN(visitTimeObj.getTime())) {
    visitTime = visitTimeObj.toLocaleTimeString("en-US", {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } else if (typeof patient.visitTime === 'string') {
    visitTime = patient.visitTime;
  }

  const nameStyles = template?.elements?.patientName || {};

  return (
    <div className="border border-slate-300 p-4 mb-6 text-[13px] text-slate-900 bg-white">
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1 relative z-20">
          <div className="grid grid-cols-[110px_auto] text-lg gap-4">
            <span className="text-black font-semibold whitespace-nowrap">
              Patient Name:
            </span>
            <span className="capitalize" style={{ ...nameStyles }}>{patient.name}</span>
          </div>
          <div className="grid grid-cols-[110px_auto] text-lg gap-2">
            <span className="text-black font-semibold whitespace-nowrap">
              Age/Gender:
            </span>
            <span className=" capitalize">
              {patient.age} Years / {patient.gender}
            </span>
          </div>
          <div className="grid grid-cols-[100px_auto] text-lg gap-2">
            <span className="text-black font-semibold whitespace-nowrap">
              Ref. Doctor:
            </span>
            <span className="capitalize">{patient.referredDoctor}</span>
          </div>
        </div>

        <div className="space-y-1">
          <div className="grid grid-cols-[100px_auto] text-lg gap-2">
            <span className="text-black font-semibold">Visit ID:</span>
            <span>{patient.visitId || "N/A"}</span>
          </div>
          <div className="grid grid-cols-[100px_auto] text-lg gap-2">
            <span className="text-black font-semibold">Reg. Date:</span>
            <span>{regDate}</span>
          </div>
          <div className="grid grid-cols-[100px_auto] text-lg gap-2">
            <span className="text-black font-semibold">Visit Time:</span>
            <span>{visitTime}</span>
          </div>
          <div className="grid grid-cols-[100px_auto] text-lg gap-2">
            <span className="text-black font-semibold whitespace-nowrap">
              Report Date:
            </span>
            <span>{reportDate}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
