import React from 'react';

export const SignatureSection = ({ patient, template }) => {
  const footerStyles = template?.elements?.footer || {};

  return (
    <div className="mt-12 pt-4 px-15 flex justify-between text-[13px] text-slate-900" style={footerStyles}>
      <div className="w-35 text-center">
        <div className="h-16 w-full"></div>
        <div className="border-t border-slate-900 pt-1">
          <p className="text-[#475569] text-base">System Admin</p>
          <p className="font-semibold text-lg whitespace-nowrap">Lab Technician</p>
        </div>
      </div>
      
      <div className="w-35 text-center">
        <div className="h-16 w-full"></div>
        <div className="border-t border-slate-900 pt-1">
          <p className="text-[#475569] text-base">Dr. {patient.referredDoctor || "Admin"}</p>
          <p className="font-semibold text-lg whitespace-nowrap">Pathologist</p>
        </div>
      </div>
    </div>
  );
};
