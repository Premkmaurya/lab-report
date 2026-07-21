/**
 * printWindow.js
 *
 * Utilities for opening and populating a dedicated browser print window.
 *
 * Architecture:
 *  1. Call openPrintWindow() SYNCHRONOUSLY inside a user-gesture handler
 *     (onClick, etc.) so the browser does not block the popup.
 *  2. Measure + paginate the report in a hidden React component.
 *  3. Call injectAndPrint(win, html, title) to replace the loading screen
 *     with the real report and auto-trigger window.print().
 */

/**
 * Opens a new browser window showing a loading screen.
 *
 * MUST be called synchronously within a user-gesture handler (button click)
 * to prevent popup blockers from suppressing the window.open() call.
 *
 * @returns {Window|null} The opened window, or null if blocked by the browser.
 */
export const openPrintWindow = () => {
  const win = window.open(
    "",
    "_blank",
    "width=900,height=700,scrollbars=yes,resizable=yes",
  );

  if (!win) return null;

  // Write a temporary loading screen so the window is not blank
  // while the React component tree measures and paginates the report.
  win.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Preparing Report\u2026</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      font-family: system-ui, -apple-system, sans-serif;
      background: #f1f5f9;
      color: #64748b;
    }
    .loader { text-align: center; }
    .spinner {
      width: 36px;
      height: 36px;
      border: 3px solid #e2e8f0;
      border-top-color: #2563eb;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
      margin: 0 auto 12px;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    p { font-size: 14px; }
  </style>
</head>
<body>
  <div class="loader">
    <div class="spinner"></div>
    <p>Preparing report for printing\u2026</p>
  </div>
</body>
</html>`);
  win.document.close();

  return win;
};

/**
 * Collects all CSS from the current app document so that Tailwind utility
 * classes and CSS custom properties resolve correctly inside the print window.
 */
const collectAppCss = () => {
  // Linked stylesheets — link.href is already an absolute URL in the browser.
  const linkTags = Array.from(
    document.querySelectorAll('link[rel="stylesheet"]'),
  )
    .map((el) => `<link rel="stylesheet" href="${el.href}">`)
    .join("\n");

  // Inline <style> blocks (Tailwind v4 runtime output, @theme tokens, etc.)
  const styleTags = Array.from(document.querySelectorAll("style"))
    .map((el) => `<style>${el.textContent}</style>`)
    .join("\n");

  return `${linkTags}\n${styleTags}`;
};

/**
 * Replaces the loading screen in the print window with the fully-rendered
 * report HTML, then auto-triggers window.print() once fonts have loaded.
 *
 * @param {Window} win        – The window returned by openPrintWindow()
 * @param {string} reportHtml – innerHTML of the rendered pages container div
 * @param {string} title      – Used as the window document title
 */
export const injectAndPrint = (win, reportHtml, title = "Lab Report") => {
  if (!win || win.closed) return;

  const cssTags = collectAppCss();

  win.document.open();
  win.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${title} \u2014 Lab Report</title>
  ${cssTags}
  <style>
    /* ── Base reset ─────────────────────────────────────────────────── */
    *, *::before, *::after { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      background: #e5e7eb;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    /* ── Screen: pages appear as stacked white A4 sheets ────────────── */
    .print-pages-wrapper {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 24px;
      padding: 24px 0;
    }
    .print-page {
      /* Shadow added here; removed in @media print below */
      box-shadow: 0 4px 24px rgba(0, 0, 0, 0.15);
    }

    /* ── Print media ─────────────────────────────────────────────────── */
    /* ── Print media ─────────────────────────────────────────────────── */
    @page {
      size: A4 portrait;
      margin: 0;
    }
    @media print {
      html, body {
        margin: 0 !important;
        padding: 0 !important;
        background: white !important;
      }
      .print-pages-wrapper {
        display: block !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      .print-page {
        box-shadow: none !important;
        border: none !important;
        margin: 0 !important;
        page-break-after: always !important;
        break-after: page !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
      .print-page:last-child {
        page-break-after: avoid !important;
        break-after: avoid !important;
      }
    }
  </style>
</head>
<body>
  <div class="print-pages-wrapper">
    ${reportHtml}
  </div>
  <script>
    (async function() {
      // Helper to log to both print window console and parent window console
      function pipelineLog(msg, data) {
        const text = "[PRINT PIPELINE] " + msg + (data !== undefined ? " " + JSON.stringify(data) : "");
      }

      pipelineLog("3. document.write() started (injected script running).");

      try {
        // 1. Wait for document load if not already complete
        if (document.readyState !== 'complete') {
          await new Promise(resolve => {
            window.addEventListener('load', resolve, { once: true });
          });
        }
        pipelineLog("4. document.write() finished (DOMContentLoaded/load event fired).");

        // 5. document.close() executed (this is called after writing completes)
        pipelineLog("5. document.close() executed (document is ready).");

        // 6. Print window body child count
        pipelineLog("6. Print window body child count:", document.body ? document.body.childElementCount : 0);

        // 7. document.body.innerHTML length
        pipelineLog("7. document.body.innerHTML length:", document.body ? document.body.innerHTML.length : 0);

        // 8. document.documentElement.outerHTML length
        pipelineLog("8. document.documentElement.outerHTML length:", document.documentElement ? document.documentElement.outerHTML.length : 0);

        // 9. Number of printable pages generated (elements with class 'print-page')
        const printPages = Array.from(document.querySelectorAll('.print-page'));
        pipelineLog("9. Number of printable pages generated (DOM check):", printPages.length);

        // 10. Number of page components rendered
        pipelineLog("10. Number of page components rendered (DOM check):", printPages.length);

        // 11. Stylesheets detected
        const stylesheets = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'));
        pipelineLog("11. Stylesheets detected:", stylesheets.length);

        // 12. Images detected
        const images = Array.from(document.querySelectorAll('img'));
        pipelineLog("12. Images detected:", images.length);

        // 13. Barcode SVG detected
        const barcodes = Array.from(document.querySelectorAll('.print-page svg, svg[aria-label^="Barcode"]'));
        pipelineLog("13. Barcode SVG detected:", barcodes.length);

        // Wait for all linked stylesheets to be fully loaded
        const linkSheets = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
        await Promise.all(
          linkSheets.map(link => {
            try {
              if (link.sheet && link.sheet.cssRules) return Promise.resolve();
            } catch (e) {
              if (link.sheet) return Promise.resolve();
            }
            return new Promise(resolve => {
              link.addEventListener('load', resolve, { once: true });
              link.addEventListener('error', resolve, { once: true });
              setTimeout(resolve, 2000); // 2s fallback safety
            });
          })
        );
        pipelineLog("11b. All link stylesheets loaded.");

        // 14. Wait for custom web fonts to load
        if (document.fonts && document.fonts.ready) {
          await document.fonts.ready;
          pipelineLog("14. Fonts ready.");
        } else {
          pipelineLog("14. Fonts ready (document.fonts API not available/no fonts).");
        }

        // Wait for all images to complete loading
        await Promise.all(
          images.map(img => {
            if (img.complete) return Promise.resolve();
            return new Promise(resolve => {
              img.addEventListener('load', resolve, { once: true });
              img.addEventListener('error', resolve, { once: true });
              setTimeout(resolve, 2000); // 2s fallback safety
            });
          })
        );
        pipelineLog("12b. All images loaded.");

        // 15. Wait for double requestAnimationFrame to ensure layout reflow and rendering paints
        await new Promise(resolve => {
          requestAnimationFrame(() => {
            requestAnimationFrame(resolve);
          });
        });
        pipelineLog("15. requestAnimationFrame completed.");

        // 16. Final body size (scrollHeight / clientHeight)
        const scrollH = document.documentElement.scrollHeight;
        const clientH = document.documentElement.clientHeight;
        pipelineLog("16. Final body size (scrollHeight / clientHeight):", { scrollHeight: scrollH, clientHeight: clientH });

        // Run validation assertions before print
        pipelineLog("── Running Pre-Print Assertions ──");
        const assertions = {
          bodyExists: !!document.body,
          bodyNotEmpty: document.body && document.body.innerHTML.trim().length > 0,
          bodyHasChildren: document.body && document.body.childElementCount > 0,
          pagesExist: printPages.length > 0,
          scrollHeightPositive: scrollH > 0,
        };
        pipelineLog("Pre-print assertions status:", assertions);

        // Check page bounding rects
        printPages.forEach((page, idx) => {
          const rect = page.getBoundingClientRect();
          pipelineLog("Page [" + (idx + 1) + "] bounding rect:", {
            width: rect.width,
            height: rect.height,
            top: rect.top,
            left: rect.left
          });
        });

        const printPagesWrapper = document.querySelector('.print-pages-wrapper');
        if (printPagesWrapper) {
          const wrapperRect = printPagesWrapper.getBoundingClientRect();
          pipelineLog("Print pages wrapper bounding rect:", {
            width: wrapperRect.width,
            height: wrapperRect.height
          });
        }

        // Read and log matching rules in media print
        const printRules = [];
        Array.from(document.styleSheets).forEach(sheet => {
          try {
            Array.from(sheet.cssRules || []).forEach(rule => {
              if (rule.media && (rule.media.mediaText === 'print' || rule.media.mediaText.includes('print'))) {
                Array.from(rule.cssRules || []).forEach(subRule => {
                  if (subRule.selectorText && (
                    subRule.selectorText.includes('print-pages-wrapper') ||
                    subRule.selectorText.includes('print-page') ||
                    subRule.selectorText.includes('body') ||
                    subRule.selectorText === 'body > *' ||
                    subRule.selectorText === '*'
                  )) {
                    printRules.push({ media: rule.media.mediaText, selector: subRule.selectorText, css: subRule.cssText });
                  }
                });
              } else if (!rule.media && rule.selectorText && (
                rule.selectorText.includes('print-pages-wrapper') ||
                rule.selectorText.includes('print-page') ||
                rule.selectorText.includes('body') ||
                rule.selectorText === 'body > *' ||
                rule.selectorText === '*'
              )) {
                printRules.push({ media: 'all', selector: rule.selectorText, css: rule.cssText });
              }
            });
          } catch (e) {
            // cross-origin sheet rules access might fail
          }
        });
        pipelineLog("Detected rules matching body/pages/wrapper:", printRules);

        // Safety override: ensure layout/wrapper elements are visible under print media.
        // This overrides body > * { display: none !important } which leaks from main print.css.
        const styleOverride = document.createElement('style');
        styleOverride.textContent = '@media print { html, body { display: block !important; margin: 0 !important; padding: 0 !important; visibility: visible !important; } .print-pages-wrapper { display: block !important; margin: 0 !important; padding: 0 !important; visibility: visible !important; } .print-page { display: flex !important; margin: 0 !important; visibility: visible !important; opacity: 1 !important; page-break-after: always !important; break-after: page !important; } .print-page:last-child { page-break-after: avoid !important; break-after: avoid !important; } }';
        document.head.appendChild(styleOverride);
        pipelineLog("Appended CSS overrides to clear any leaked display:none styles under print media.");

        // Safety delay to allow paint stability
        await new Promise(resolve => setTimeout(resolve, 150));

        // 7. Register the afterprint event listener before triggering print
        window.addEventListener('afterprint', function () {
          pipelineLog("afterprint event fired. Closing print window.");
          window.close();
        }, { once: true });

        // 8. Focus the window and trigger the print dialog
        pipelineLog("17. window.print() called.");
        window.focus();
        window.print();
      } catch (err) {
        pipelineLog("Print synchronization failed, falling back to print:", err.message);
        window.focus();
        window.print();
        window.addEventListener('afterprint', function () {
          window.close();
        }, { once: true });
      }
    })();
  </script>
</body>
</html>`);
  win.document.close();
};
