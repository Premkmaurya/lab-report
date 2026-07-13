/**
 * PageRenderer.jsx
 *
 * Renders a paginated, multi-page preview of a lab report.
 * Used by: ReportCanvas (print template designer preview).
 *
 * Architecture:
 *  Phase 1 — Measurement Probe
 *    Renders patient header, table header, and footer in a hidden off-screen
 *    div at the correct content width.  After 250 ms reads their real heights.
 *
 *  Phase 2 — Pagination
 *    Combines DOM-measured heights with row height estimates from
 *    HeightCalculator to produce an array of page objects.
 *
 *  Phase 3 — Rendering
 *    Maps each page object to a <PrintablePage> instance, stacked
 *    vertically with a gap for the designer preview.
 *
 * The measurement probe is dismounted once measurements are captured.
 */
import { useState, useEffect, useRef, useMemo } from 'react';
import { usePrintTemplate }   from '../../context/PrintTemplateContext';
import { PrintablePage, A4_WIDTH_PX, A4_HEIGHT_PX } from './PrintablePage';
import { BarcodeElement }     from './BarcodeElement';
import { PatientInfo }        from '../report/PatientInfo';
import { SignatureSection }   from '../report/SignatureSection';
import { buildRows }          from './RowBuilder';
import { estimateRowHeights } from './HeightCalculator';
import { paginateRows }       from './PaginationPage';

export const PageRenderer = ({ patient, report, customTemplate, zoom = 1 }) => {
  const ctx      = usePrintTemplate();
  const template = customTemplate || (ctx ? ctx.template : null);

  const rows = useMemo(() => {
    if (!report || !patient) return [];
    return buildRows(report);
  }, [report, patient]);

  // Derive layout constants from template
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

  const [measurements, setMeasurements] = useState(null);
  const [pages, setPages]               = useState(null);

  /* ── Phase 1: Measure ─────────────────────────────────────────── */
  // Re-measure whenever the template changes (font size, margins, etc.)
  useEffect(() => {
    setMeasurements(null);
    setPages(null);

    const timer = setTimeout(() => {
      if (!headerRef.current || !tableHeaderRef.current || !footerRef.current) return;
      setMeasurements({
        header:      Math.ceil(headerRef.current.getBoundingClientRect().height),
        tableHeader: Math.ceil(tableHeaderRef.current.getBoundingClientRect().height),
        footer:      Math.ceil(footerRef.current.getBoundingClientRect().height),
      });
    }, 250);

    return () => clearTimeout(timer);
  }, [template, patient]);

  /* ── Phase 2: Paginate ────────────────────────────────────────── */
  useEffect(() => {
    if (!measurements || !rows) return;

    const rowHeights = estimateRowHeights(rows, template);
    rowHeights.headerFirstPage    = measurements.header;
    rowHeights.headerContinuation = measurements.header; // barcode on every page
    rowHeights.footer             = measurements.footer;
    rowHeights.tableHeader        = measurements.tableHeader;
    rowHeights.pageMargins        = { top: marginTop, bottom: marginBottom };

    const paginated = paginateRows(rows, rowHeights, template);
    setPages(paginated);
  }, [measurements, rows, template]);

  if (!patient || !report) return null;

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
    <div style={{ position: 'relative' }}>

      {/* ── Phase 1: Measurement Probe (off-screen, invisible) ──── */}
      {!measurements && (
        <div
          aria-hidden="true"
          style={{
            position:   'fixed',
            left:       '-9999px',
            top:        0,
            width:      `${contentWidth}px`,
            visibility: 'hidden',
            overflow:   'hidden',
            zIndex:     -1,
          }}
        >
          <div ref={headerRef}>
            <BarcodeElement value={patient.visitId} settings={barcodeSettings} />
            <PatientInfo patient={patient} report={report} template={template} />
          </div>

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

          <div ref={footerRef}>
            <div style={{ borderTop: '2px solid #CBD5E1', marginBottom: '4px' }} />
            <SignatureSection patient={patient} template={template} />
          </div>
        </div>
      )}

      {/* ── Loading state (shown while measuring / paginating) ──── */}
      {!pages && (
        <div style={{
          width:           `${A4_WIDTH_PX * zoom}px`,
          height:          `${A4_HEIGHT_PX * zoom}px`,
          display:         'flex',
          alignItems:      'center',
          justifyContent:  'center',
          background:      'white',
          boxShadow:       '0 4px 24px rgba(0,0,0,0.12)',
        }}>
          <p style={{ color: '#94a3b8', fontSize: '13px' }}>Laying out pages…</p>
        </div>
      )}

      {/* ── Phase 3: Paginated preview pages ─────────────────────── */}
      {pages && pages.map((pageData, i) => (
        <div
          key={i}
          style={{ marginBottom: i < pages.length - 1 ? `${Math.round(20 * zoom)}px` : 0 }}
        >
          <PrintablePage
            patient={patient}
            report={report}
            template={template}
            rows={pageData.rows}
            pageNumber={i + 1}
            zoom={zoom}
            // No barcodeSvgString here — the designer uses the live BarcodeElement
          />
        </div>
      ))}
    </div>
  );
};