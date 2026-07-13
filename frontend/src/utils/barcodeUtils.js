import JsBarcode from 'jsbarcode';

/**
 * Synchronously generates a barcode as an inline SVG string.
 *
 * This function does NOT require React or useEffect — it creates a detached
 * SVG element in memory, runs JsBarcode on it, and returns the outerHTML.
 * Use this wherever you need a barcode SVG before React has mounted a
 * component (e.g. when preparing HTML for a dedicated print window).
 *
 * @param {string} value   – The barcode value (e.g. patient visitId)
 * @param {Object} options – JsBarcode-compatible options merged with defaults
 * @returns {string} SVG outerHTML string, or '' if value is empty or generation fails
 */
export const generateBarcodeSvgString = (value, options = {}) => {
  if (!value) return '';

  try {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');

    JsBarcode(svg, String(value), {
      format:       options.format       || 'CODE128',
      width:        Number(options.width  || 2),
      height:       Number(options.height || 50),
      displayValue: options.displayValue !== false,
      fontSize:     12,
      lineColor:    options.lineColor    || '#000000',
      background:   'transparent',
      margin:       0,
    });

    svg.setAttribute('aria-label', `Barcode ${value}`);
    svg.style.display = 'block';
    return svg.outerHTML;
  } catch (err) {
    console.error('[barcodeUtils] Barcode generation failed:', err);
    return '';
  }
};
