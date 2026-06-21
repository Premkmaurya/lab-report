import React from 'react';

export const ReportFooter = ({ patient }) => {
  return (
    <div className="mt-16 pt-8 border-t border-black flex justify-between text-sm text-black page-break-inside-avoid">
      <div className="text-center">
        <div className="h-16"></div> {/* Space for physical signature */}
        <p className="font-bold border-t border-black pt-2 px-6">Lab Technician</p>
      </div>
      
      <div className="text-center">
        <div className="h-16"></div> {/* Space for physical signature */}
        <p className="font-bold border-t border-black pt-2 px-6">Authorized Doctor</p>
        <p className="text-xs mt-1">Dr. {patient.referredDoctor || "Admin"}</p>
      </div>
    </div>
  );
};
