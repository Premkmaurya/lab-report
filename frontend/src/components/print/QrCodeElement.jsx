import React, { useState, useEffect } from "react";
import { getVerificationUrl, generateQrSvgString } from "../../utils/qrCodeUtils";

export const QrCodeElement = ({
  token,
  settings = {},
  zoom = 1,
  qrSvgString = null,
}) => {
  const [svgContent, setSvgContent] = useState(qrSvgString || "");

  const enabled = settings.enabled ?? true;
  const size = Number(settings.size || 70);
  const margin = Number(settings.margin || 0);
  const marginTop = Number(settings.marginTop || 0);
  const marginBottom = Number(settings.marginBottom || 0);
  const labelText = settings.labelText !== undefined ? settings.labelText : "Scan to Verify Report";
  const labelFontSize = Number(settings.labelFontSize || 10);
  const hasBorder = !!settings.border;
  const borderColor = settings.borderColor || "#000000";
  const borderWidth = Number(settings.borderWidth || 1);

  const verificationUrl = getVerificationUrl(token);

  useEffect(() => {
    if (qrSvgString) {
      setSvgContent(qrSvgString);
      return;
    }

    let isMounted = true;
    generateQrSvgString(verificationUrl, { size, margin: 1 }).then((svg) => {
      if (isMounted && svg) {
        setSvgContent(svg);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [verificationUrl, size, qrSvgString]);

  if (!enabled) return null;

  const borderStyle = hasBorder
    ? { border: `${borderWidth}px solid ${borderColor}`, padding: "2px", borderRadius: "4px" }
    : {};

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        marginTop: `${marginTop}px`,
        marginBottom: `${marginBottom}px`,
        marginLeft: `${margin}px`,
        marginRight: `${margin}px`,
      }}
    >
      <div style={{ background: "white", ...borderStyle }}>
        {svgContent ? (
          <div dangerouslySetInnerHTML={{ __html: svgContent }} />
        ) : (
          <div
            style={{
              width: `${size}px`,
              height: `${size}px`,
              background: "#f1f5f9",
              borderRadius: "4px",
            }}
          />
        )}
      </div>
      {labelText && (
        <span
          style={{
            fontSize: `${labelFontSize}px`,
            lineHeight: 1.2,
            marginTop: "2px",
            fontWeight: 600,
            color: "#334155",
            whiteSpace: "nowrap",
            textAlign: "center",
          }}
        >
          {labelText}
        </span>
      )}
    </div>
  );
};

export default QrCodeElement;
