import React from 'react';

export const ReportHeader = ({ patient, report }) => {
  const reportDate = new Date(report.createdAt || report.date).toLocaleDateString();

  return (
    <div className="border-b-2 border-black pb-4 my-6">
      <div className="grid grid-cols-2 gap-4 text-sm text-black">
        <div className="space-y-2">
          <p><span className="font-semibold">Patient Name:</span> {patient.name}</p>
          <p className="capitalize"><span className="font-semibold">Age / Gender:</span> {patient.age} Yrs / {patient.gender}</p>
        </div>
        <div className="space-y-2 text-right">
          <p><span className="font-semibold">Ref. Doctor:</span> {patient.referredDoctor}</p>
          <p><span className="font-semibold">Report Date:</span> {reportDate}</p>
        </div>
      </div>
    </div>
  );
};
