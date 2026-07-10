import React from "react";
import Barcode from "react-barcode";

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
  const barcodeStyles = template?.elements?.barcode || { show: true };

  return (
    <div className="border border-slate-300 p-4 mb-6 text-[13px] text-slate-900 bg-white relative">
      {barcodeStyles.show && patient.visitId && (
        <div style={{
          position: "absolute",
          top: barcodeStyles.position?.includes('bottom') ? 'auto' : '10px',
          bottom: barcodeStyles.position?.includes('bottom') ? '10px' : 'auto',
          left: barcodeStyles.position?.includes('left') ? '10px' : (barcodeStyles.position === 'center' ? '50%' : 'auto'),
          right: barcodeStyles.position?.includes('right') ? '10px' : 'auto',
          transform: barcodeStyles.position === 'center' ? 'translateX(-50%)' : 'none',
          marginTop: barcodeStyles.marginTop || "0px",
          marginBottom: barcodeStyles.marginBottom || "0px",
          textAlign: barcodeStyles.alignment || 'right',
          zIndex: 10
        }}>
          <Barcode 
            value={patient.visitId} 
            width={parseFloat(barcodeStyles.width) || 1.5} 
            height={parseInt(barcodeStyles.height, 10) || 40} 
            displayValue={barcodeStyles.displayValue !== false} 
            fontSize={12}
            margin={0}
            background="transparent"
          />
        </div>
      )}
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
          <div className="grid grid-cols-[100px_auto] text-lg gap-4">
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
