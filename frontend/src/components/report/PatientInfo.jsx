import React from "react";
import { formatDate, formatDateTime } from "../../utils/dateFormatter";

export const PatientInfo = ({ patient, report, template }) => {
  // Report Date is the exact print timestamp
  const reportDate = formatDateTime(new Date());

  // Reg Date prioritizes the exact registration timestamp
  const regDate = formatDateTime(patient.registeredAt || patient.createdAt || patient.date);

  const headerStyles = template?.elements?.patientHeader || {};
  const lineGap = template?.typography?.lineHeight || "1.5";

  // Helper function to resolve label & value styles for each field with fallback to patientHeader
  const getFieldStyles = (fieldKey) => {
    const override = template?.elements?.[fieldKey] || {};

    const containerStyle = {
      fontSize: override.fontSize || headerStyles.fontSize || "14px",
      letterSpacing: override.letterSpacing || headerStyles.letterSpacing || "normal",
      textTransform: override.textTransform || headerStyles.textTransform || "none",
      textAlign: override.textAlign || override.alignment || headerStyles.textAlign || headerStyles.alignment || "left",
      lineHeight: lineGap,
    };

    const labelStyle = {
      ...containerStyle,
      fontWeight: override.labelFontWeight || override.fontWeight || headerStyles.labelFontWeight || headerStyles.fontWeight || "600",
      color: override.labelColor || override.color || headerStyles.labelColor || headerStyles.color || "#000000",
    };

    const valueStyle = {
      ...containerStyle,
      fontWeight: override.valueFontWeight || override.fontWeight || headerStyles.valueFontWeight || headerStyles.fontWeight || "400",
      color: override.valueColor || override.color || headerStyles.valueColor || headerStyles.color || "#0F172A",
    };

    return { labelStyle, valueStyle, containerStyle };
  };

  const nameStyles = getFieldStyles("patientName");
  const ageGenderStyles = getFieldStyles("ageGender");
  const doctorStyles = getFieldStyles("referredDoctor");
  const visitStyles = getFieldStyles("visitId");
  const regDateStyles = getFieldStyles("regDate");
  const reportDateStyles = getFieldStyles("reportDate");

  return (
    <div className="p-4 mb-6 bg-white border border-[#19191979]" style={{ lineHeight: lineGap }}>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1 relative z-20">
          <div className="grid grid-cols-[120px_auto] gap-2 items-baseline">
            <span className="whitespace-nowrap" style={nameStyles.labelStyle}>
              Patient Name:
            </span>
            <span className="capitalize" style={nameStyles.valueStyle}>{patient.name}</span>
          </div>
          <div className="grid grid-cols-[120px_auto] gap-2 items-baseline">
            <span className="whitespace-nowrap" style={ageGenderStyles.labelStyle}>
              Age/Gender:
            </span>
            <span className="capitalize" style={ageGenderStyles.valueStyle}>
              {patient.age} Years / {patient.gender}
            </span>
          </div>
          <div className="grid grid-cols-[120px_auto] gap-2 items-baseline">
            <span className="whitespace-nowrap" style={doctorStyles.labelStyle}>
              Ref. Doctor:
            </span>
            <span className="capitalize" style={doctorStyles.valueStyle}>{patient.referredDoctor}</span>
          </div>
        </div>

        <div className="space-y-1">
          <div className="grid grid-cols-[120px_auto] gap-2 items-baseline">
            <span className="whitespace-nowrap" style={visitStyles.labelStyle}>Visit ID:</span>
            <span style={visitStyles.valueStyle}>{patient.visitId || "N/A"}</span>
          </div>
          <div className="grid grid-cols-[120px_auto] gap-2 items-baseline">
            <span className="whitespace-nowrap" style={regDateStyles.labelStyle}>Reg. Date:</span>
            <span style={regDateStyles.valueStyle}>{regDate}</span>
          </div>
          <div className="grid grid-cols-[120px_auto] gap-2 items-baseline">
            <span className="whitespace-nowrap" style={reportDateStyles.labelStyle}>
              Report Date:
            </span>
            <span style={reportDateStyles.valueStyle}>{reportDate}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
