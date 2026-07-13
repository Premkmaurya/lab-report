/**
 * PrintOrchestrator.jsx
 *
 * A hidden, off-screen component that manages the full lifecycle of
 * preparing a report for the dedicated print window:
 *
 *  Phase 1 — Measurement Probe
 *    Renders the patient header, table header, and footer into an off-screen
 *    div at full A4 content width.  After 250 ms (enough time for the
 *    BarcodeElement useEffect to populate the SVG), reads their pixel heights
 *    via getBoundingClientRect().
 *
 *  Phase 2 — Pagination
 *    Combines DOM-measured section heights with estimated row heights
 *    from HeightCalculator to split the flat row list into pages.
 *
 *  Phase 3 — Rendering
 *    Renders all pages into a hidden container using pre-generated barcode
 *    SVG strings (synchronous, no useEffect timing issue).
 *
 *  Phase 4 — Serialization & Injection
 *    After 150 ms (React commit buffer), reads the container innerHTML
 *    and calls injectAndPrint() to replace the print window's loading
 *    screen with the finished report.
 *
 *  Phase 5 — Cleanup
 *    Calls onComplete() so the parent component can clear its state and
 *    unmount this component.
 *
 * Usage:
 *   const winRef = useRef(null);
 *   // In onClick (user gesture):
 *   winRef.current = openPrintWindow();
 *   setReportToPrint(report);
 *
 *   // In JSX:
 *   {reportToPrint && (
 *     <PrintOrchestrator
 *       patient={patient}
 *       report={reportToPrint}
 *       printWindowRef={winRef}
 *       onComplete={() => setReportToPrint(null)}
 *     />
 *   )}
 */
import { useState, useEffect, useRef, useMemo } from 'react';
import { usePrintTemplate }   from '../../context/PrintTemplateContext';
import { PrintablePage, A4_WIDTH_PX } from './PrintablePage';
import { BarcodeElement }     from './BarcodeElement';
import { PatientInfo }        from '../report/PatientInfo';
import { SignatureSection }   from '../report/SignatureSection';
import { buildRows }          from './RowBuilder';
import { estimateRowHeights } from './HeightCalculator';
import { paginateRows }       from './PaginationPage';
import { generateBarcodeSvgString } from '../../utils/barcodeUtils';
import { injectAndPrint }     from '../../utils/printWindow';

export const PrintOrchestrator = ({
  patient,
  report,
  customTemplate,
  printWindowRef, // { current: Window } — opened BEFORE this component mounts
  onComplete,
}) => {
  const ctx      = usePrintTemplate();
  const template = customTemplate || (ctx ? ctx.template : null);

  const rows = useMemo(() => buildRows(report), [report]);

  // Derive content width for the measurement probe
  const page         = template?.page || {};
  const marginLeft   = parseInt(page.marginLeft   || 15);
  const marginRight  = parseInt(page.marginRight  || 15);
  const marginTop    = parseInt(page.marginTop    || 20);
  const marginBottom = parseInt(page.marginBottom || 20);
  const contentWidth = A4_WIDTH_PX - marginLeft - marginRight;

  const barcodeSettings = template?.elements?.barcode || { enabled: true };

  const headerRef      = useRef(null);
  const tableHeaderRef = useRef(null);
  const footerRef      = useRef(null);
  const containerRef   = useRef(null);

  const [measurements, setMeasurements] = useState(null);
  const [pages, setPages]               = useState(null);

  // Pre-generate the barcode SVG string synchronously so there is no
  // useEffect timing dependency during the serialization step.
  const barcodeSvgString = useMemo(() => {
    if (!barcodeSettings.enabled || !patient?.visitId) return null;
    return generateBarcodeSvgString(patient.visitId, barcodeSettings);
  }, [patient?.visitId, JSON.stringify(barcodeSettings)]);

  /* ── Phase 1: Measure DOM heights after mount ────────────────── */
  useEffect(() => {
    // 250 ms gives BarcodeElement's useEffect time to populate the SVG
    // inside the measurement probe before we read dimensions.
    const timer = setTimeout(() => {
      if (!headerRef.current || !tableHeaderRef.current || !footerRef.current) return;
      setMeasurements({
        header:      Math.ceil(headerRef.current.getBoundingClientRect().height),
        tableHeader: Math.ceil(tableHeaderRef.current.getBoundingClientRect().height),
        footer:      Math.ceil(footerRef.current.getBoundingClientRect().height),
      });
    }, 250);
    return () => clearTimeout(timer);
  }, []);

  /* ── Phase 2: Paginate with real measurements ────────────────── */
  useEffect(() => {
    if (!measurements) return;

    const rowHeights = estimateRowHeights(rows, template);

    // Override estimated section heights with actual DOM measurements
    rowHeights.headerFirstPage    = measurements.header;
    rowHeights.headerContinuation = measurements.header; // barcode on every page
    rowHeights.footer             = measurements.footer;
    rowHeights.tableHeader        = measurements.tableHeader;
    rowHeights.pageMargins        = { top: marginTop, bottom: marginBottom };

    const paginated = paginateRows(rows, rowHeights, template);
    setPages(paginated);
  }, [measurements]);

  /* ── Phase 3 & 4: Render pages, then serialize and inject ───── */
  useEffect(() => {
    if (!pages || !containerRef.current) return;

    const win = printWindowRef?.current;
    if (!win || win.closed) {
      onComplete?.();
      return;
    }

    // 150 ms buffer for React to commit all page DOM mutations
    const timer = setTimeout(() => {
      if (!containerRef.current) return;
      const html = containerRef.current.innerHTML;
      injectAndPrint(win, html, patient?.name || 'Lab Report');
      onComplete?.();
    }, 150);

    return () => clearTimeout(timer);
  }, [pages]);

  /* ── Shared table header probe structure ──────────────────────── */
  const thProbeStyle = {
    padding:      '6px 12px',
    fontSize:     '12px',
    fontWeight:   '600',
    color:        '#0F172A',
    background:   '#F8FAFC',
    borderBottom: '2px solid #CBD5E1',
    whiteSpace:   'nowrap',
  };

  return (
    /* The outer div is fixed off-screen; invisible to the user. */
    <div style={{
      position:   'fixed',
      left:       '-9999px',
      top:        0,
      visibility: 'hidden',
      zIndex:     -100,
      overflow:   'hidden',
    }}>
      {/* ── Phase 1: Measurement Probe ───────────────────────────── */}
      {!measurements && (
        <div style={{ width: `${contentWidth}px`, overflow: 'hidden' }}>

          {/* Header probe: BarcodeElement + PatientInfo */}
          <div ref={headerRef}>
            <BarcodeElement value={patient?.visitId} settings={barcodeSettings} />
            <PatientInfo patient={patient} report={report} template={template} />
          </div>

          {/* Table header probe */}
          <table
            ref={tableHeaderRef}
            style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}
          >
            <colgroup>
              <col style={{ width: '45%' }} />
              <col style={{ width: '20%' }} />
              <col style={{ width: '15%' }} />
              <col style={{ width: '20%' }} />
            </colgroup>
            <thead>
              <tr>
                <th style={{ ...thProbeStyle, textAlign: 'left'   }}>TEST NAME</th>
                <th style={{ ...thProbeStyle, textAlign: 'left'   }}>RESULT</th>
                <th style={{ ...thProbeStyle, textAlign: 'center' }}>UNIT</th>
                <th style={{ ...thProbeStyle, textAlign: 'left'   }}>REFERENCE RANGE</th>
              </tr>
            </thead>
          </table>

          {/* Footer probe: includes the separator div and SignatureSection */}
          <div ref={footerRef}>
            <div style={{ borderTop: '2px solid #CBD5E1', marginBottom: '4px' }} />
            <SignatureSection patient={patient} template={template} />
          </div>
        </div>
      )}

      {/* ── Phase 3: Rendered pages (serialized to print window) ─── */}
      {pages && (
        <div ref={containerRef}>
          {pages.map((pageData, i) => (
            <PrintablePage
              key={i}
              patient={patient}
              report={report}
              template={template}
              rows={pageData.rows}
              pageNumber={i + 1}
              barcodeSvgString={barcodeSvgString}
              zoom={1} // always 1x for the print window
            />
          ))}
        </div>
      )}
    </div>
  );
};
