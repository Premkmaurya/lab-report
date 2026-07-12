import { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";

const DEFAULT_SETTINGS = {
  enabled: true,
  displayValue: true,
  format: "CODE128",
  width: 2,
  height: 50,
  marginTop: 8,
  marginBottom: 0,
  marginLeft: 0,
  marginRight: 0,
  alignment: "right",
  rotation: 0,
  x: 620, // retained for backward compatibility
  y: 30,  // retained for backward compatibility
  lineColor: "#000000",
  background: "transparent",
};

/** The only barcode renderer used by the designer and printable report. */
export const BarcodeElement = ({ value, settings, editable = false, zoom = 1, onChange }) => {
  const barcodeRef = useRef(null);
  
  // Merge settings with defaults
  const options = {
    ...DEFAULT_SETTINGS,
    ...settings,
    enabled: settings?.enabled ?? settings?.show ?? DEFAULT_SETTINGS.enabled,
    format: settings?.format ?? settings?.barcodeType ?? DEFAULT_SETTINGS.format,
    displayValue: settings?.displayValue ?? settings?.showValue ?? DEFAULT_SETTINGS.displayValue,
    width: settings?.width ?? DEFAULT_SETTINGS.width,
    height: settings?.height ?? DEFAULT_SETTINGS.height,
    marginTop: settings?.marginTop ?? DEFAULT_SETTINGS.marginTop,
    marginBottom: settings?.marginBottom ?? DEFAULT_SETTINGS.marginBottom,
    marginLeft: settings?.marginLeft ?? DEFAULT_SETTINGS.marginLeft,
    marginRight: settings?.marginRight ?? DEFAULT_SETTINGS.marginRight,
    alignment: settings?.alignment ?? DEFAULT_SETTINGS.alignment,
  };

  useEffect(() => {
    if (!barcodeRef.current || !options.enabled || !value) return;

    barcodeRef.current.replaceChildren();
    const barcode = JsBarcode(barcodeRef.current, String(value), {
      format: options.format,
      width: Number(options.width),
      height: Number(options.height),
      displayValue: Boolean(options.displayValue),
      fontSize: 12,
      lineColor: options.lineColor,
      background: options.background,
      margin: 0,
    });
  }, [value, options.enabled, options.format, options.width, options.height, options.displayValue, options.lineColor, options.background]);

  if (!options.enabled || !value) return null;

  const getJustifyContent = (alignment) => {
    if (alignment === "left") return "flex-start";
    if (alignment === "center") return "center";
    return "flex-end";
  };

  return (
    <div
      data-barcode-element="true"
      style={{
        display: "flex",
        justifyContent: getJustifyContent(options.alignment),
        paddingTop: `${Number(options.marginTop)}px`,
        paddingBottom: `${Number(options.marginBottom)}px`,
        paddingLeft: `${Number(options.marginLeft)}px`,
        paddingRight: `${Number(options.marginRight)}px`,
        transform: `rotate(${Number(options.rotation)}deg)`,
        boxSizing: "border-box",
        width: "100%",
      }}
    >
      <svg ref={barcodeRef} aria-label={`Barcode ${value}`} style={{ display: "block" }} />
    </div>
  );
};

export default BarcodeElement;
