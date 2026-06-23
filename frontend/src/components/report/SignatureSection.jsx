import React from 'react';

export const SignatureSection = ({ patient }) => {
  return (
    <div className="mt-12 pt-4 px-15 flex justify-between text-[13px] text-slate-900">
      <div className="w-30 text-center">
        <div className="h-16 w-full"></div>
        <div className="border-t border-slate-900 pt-1">
          <p className="font-semibold">Lab Technician</p>
          <p className="text-[11px] text-[#475569]">System Admin</p>
        </div>
      </div>
      
      <div className="w-30 text-center">
        <div className="h-16 w-full"></div>
        <div className="border-t border-slate-900 pt-1">
          <p className="font-semibold">Pathologist</p>
          <p className="text-[11px] text-[#475569]">Dr. {patient.referredDoctor || "Admin"}</p>
        </div>
      </div>
    </div>
  );
};
