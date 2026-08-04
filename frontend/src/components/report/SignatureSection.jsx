import React from 'react';

export const SignatureSection = ({ patient, template }) => {
  const footerStyles = template?.elements?.footer || {};
  const signatures = template?.signatures || {};

  const tech = signatures.technician || {
    name: "System Admin",
    designation: "Lab Technician",
    show: true
  };

  const path = signatures.pathologist || {
    name: "",
    designation: "Pathologist",
    show: true,
    qualification: "",
    registrationNumber: ""
  };

  const footerText = template?.elements?.footer?.text || "";

  return (
    <div className="mt-4 pt-2 px-15 text-[13px] text-slate-900" style={footerStyles}>
      <div className="flex justify-between">
        {/* Technician Signature Block */}
        <div className={`w-35 text-center ${!tech.show ? 'invisible' : ''}`}>
          <div className="h-16 w-full flex items-center justify-center">
            {tech.showSignatureImage && tech.signatureImage ? (
              <img src={tech.signatureImage} alt="Technician Signature" className="max-h-14 max-w-full object-contain" />
            ) : null}
          </div>
          <div className="pt-1">
            <p className="font-semibold text-lg whitespace-nowrap">{tech.name || "System Admin"}</p>
            <p className="text-[#475569] text-base">{tech.designation || "Lab Technician"}</p>
          </div>
        </div>
        
        {/* Pathologist Signature Block */}
        <div className={`w-35 text-center ${!path.show ? 'invisible' : ''}`}>
          <div className="h-16 w-full flex items-center justify-center">
            {path.showSignatureImage && path.signatureImage ? (
              <img src={path.signatureImage} alt="Pathologist Signature" className="max-h-14 max-w-full object-contain" />
            ) : null}
          </div>
          <div className="pt-1">
            <p className="font-semibold text-lg text-center whitespace-wrap">
              {path.name || `Dr. Smith`}
            </p>
            <p className="text-[#475569] text-base">{path.designation || "Pathologist"}</p>
            {path.qualification && <p className="text-xs text-[#64748b]">{path.qualification}</p>}
            {path.registrationNumber && <p className="text-[10px] text-[#94a3b8] mt-0.5">{path.registrationNumber}</p>}
          </div>
        </div>
      </div>

      {footerText && (
        <div className="w-full text-center mt-4 text-xs font-medium text-slate-600 border-t border-slate-200 pt-2">
          {footerText}
        </div>
      )}
    </div>
  );
};

