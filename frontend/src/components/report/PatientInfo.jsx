import React from 'react';

export const PatientInfo = ({ patient, report }) => {
  const reportDate = new Date(report.createdAt || report.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-');
  const regDate = new Date(patient.createdAt || patient.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-');
  
  return (
    <div className="border border-slate-300 p-4 mb-6 text-[13px] text-slate-900 bg-white">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <div className="grid grid-cols-[100px_auto] gap-1">
            <span className="text-[11px] text-slate-500 font-medium">Patient Name:</span>
            <span className="font-semibold">{patient.name}</span>
          </div>
          <div className="grid grid-cols-[100px_auto] gap-1">
            <span className="text-[11px] text-slate-500 font-medium">Age/Gender:</span>
            <span className="font-semibold capitalize">{patient.age} Years / {patient.gender}</span>
          </div>
          <div className="grid grid-cols-[100px_auto] gap-1">
            <span className="text-[11px] text-slate-500 font-medium">Visit ID:</span>
            <span className="font-semibold">{patient.visitId || 'N/A'}</span>
          </div>
        </div>
        
        <div className="space-y-1">
          <div className="grid grid-cols-[100px_auto] gap-1">
            <span className="text-[11px] text-slate-500 font-medium">Ref. Doctor:</span>
            <span className="font-semibold">{patient.referredDoctor}</span>
          </div>
          <div className="grid grid-cols-[100px_auto] gap-1">
            <span className="text-[11px] text-slate-500 font-medium">Reg. Date:</span>
            <span className="font-semibold">{regDate}</span>
          </div>
          <div className="grid grid-cols-[100px_auto] gap-1">
            <span className="text-[11px] text-slate-500 font-medium">Report Date:</span>
            <span className="font-semibold">{reportDate}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
