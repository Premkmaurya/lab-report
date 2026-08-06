import QRCode from "qrcode";

/**
 * Generate QR code URL from verification token.
 */
export const getVerificationUrl = (verificationToken) => {
  const origin = window.location.origin;
  const token = verificationToken || "sample-token-12345";
  return `${origin}/report/verify/${token}`;
};

/**
 * Generate QR Code SVG string asynchronously.
 */
export const generateQrSvgString = async (text, options = {}) => {
  const size = options.size || 80;
  const margin = options.margin !== undefined ? options.margin : 1;
  try {
    const svgString = await QRCode.toString(text, {
      type: "svg",
      width: size,
      margin: margin,
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
    });
    return svgString;
  } catch (err) {
    console.error("Error generating QR SVG string:", err);
    return null;
  }
};

/**
 * Generate QR Code Data URL asynchronously.
 */
export const generateQrDataUrl = async (text, options = {}) => {
  const size = options.size || 120;
  const margin = options.margin !== undefined ? options.margin : 1;
  try {
    const dataUrl = await QRCode.toDataURL(text, {
      width: size,
      margin: margin,
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
    });
    return dataUrl;
  } catch (err) {
    console.error("Error generating QR Data URL:", err);
    return null;
  }
};
