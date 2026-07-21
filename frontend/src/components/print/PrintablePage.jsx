/**
 * PrintablePage.jsx
 *
 * Renders a single A4 print page (794 × 1123 px at 96 DPI).
 *
 * Every page contains, in order:
 *  1. Patient Header  — barcode + patient info    (flex-shrink: 0)
 *  2. Table Header    — column labels             (flex-shrink: 0)
 *  3. Content Area    — the rows for this page    (flex: 1, overflow hidden)
 *  4. Footer          — signatures                (flex-shrink: 0)
 *
 * The flex column layout guarantees the footer is always pinned to the
 * bottom regardless of how few rows are on the page.  Overflow on the
 * content area is clipped so rows never push the footer off-screen.
 *
 * Props:
 *   barcodeSvgString  — Pre-generated SVG string (print-window mode).
 *                       When null the interactive BarcodeElement is used
 *                       (designer / preview mode).
 *   pageNumber        — 1-based index; reserved for future use.
 *   zoom              — Visual scale factor for the designer preview.
 *                       Always 1 when rendering for the print window.
 */
import { PatientInfo }     from '../report/PatientInfo';
import { SignatureSection } from '../report/SignatureSection';
import { BarcodeElement }  from './BarcodeElement';
import { checkAbnormalResult } from '../../utils/resultUtils';
import './styles/print.css';

export const A4_WIDTH_PX  = 794;
export const A4_HEIGHT_PX = 1123;

export const PrintablePage = ({
  patient,
  report,
  template,
  rows         = [],
  pageNumber   = 1,
  barcodeSvgString = null,
  zoom         = 1,
}) => {
  /* ── Template values ──────────────────────────────────────────── */
  const page = template?.page || {};
  const typo = template?.typography || {};

  const marginTop    = parseInt(page.marginTop    || 20);
  const marginRight  = parseInt(page.marginRight  || 15);
  const marginBottom = parseInt(page.marginBottom || 20);
  const marginLeft   = parseInt(page.marginLeft   || 15);

  const barcodeSettings = template?.elements?.barcode || { enabled: true };

  // Element-level style overrides from the print template designer
  const deptStyles   = template?.elements?.departmentHeading || {};
  const testStyles   = template?.elements?.testHeading       || {};
  const secStyles    = template?.elements?.sectionHeader     || {};
  const paramStyles  = template?.elements?.parameter         || {};
  const resultStyles = template?.elements?.result            || {};
  const unitStyles   = template?.elements?.unit              || {};
  const rangeStyles  = template?.elements?.normalRange       || unitStyles;

  const rowPad = 4; // px top/bottom padding on parameter rows

  /* ── Base typography ──────────────────────────────────────────── */
  const baseFont = {
    fontFamily: typo.baseFont     || 'Inter, system-ui, sans-serif',
    fontSize:   typo.baseFontSize || '13px',
    lineHeight: typo.lineHeight   || '1.5',
    color:      '#0F172A',
  };

  /* ── Column widths (shared between thead table and tbody table) ── */
  const colgroup = (
    <colgroup>
      <col style={{ width: '45%' }} />
      <col style={{ width: '20%' }} />
      <col style={{ width: '15%' }} />
      <col style={{ width: '20%' }} />
    </colgroup>
  );

  const thBase = {
    padding:      '6px 12px',
    fontSize:     '12px',
    fontWeight:   '600',
    color:        '#0F172A',
    background:   '#F8FAFC',
    borderBottom: '2px solid #CBD5E1',
    whiteSpace:   'nowrap',
  };

  /* ── Barcode ──────────────────────────────────────────────────── */
  const renderBarcode = () => {
    if (!barcodeSettings.enabled || !patient?.visitId) return null;

    const justification =
      barcodeSettings.alignment === 'left'   ? 'flex-start' :
      barcodeSettings.alignment === 'center' ? 'center'     : 'flex-end';

    const wrapStyle = {
      display:        'flex',
      justifyContent: justification,
      paddingTop:     `${Number(barcodeSettings.marginTop    || 8)}px`,
      paddingBottom:  `${Number(barcodeSettings.marginBottom || 0)}px`,
      paddingLeft:    `${Number(barcodeSettings.marginLeft   || 0)}px`,
      paddingRight:   `${Number(barcodeSettings.marginRight  || 0)}px`,
      boxSizing:      'border-box',
      width:          '100%',
    };

    if (barcodeSvgString) {
      // Print-window mode: embed the synchronously pre-generated SVG directly.
      // No useEffect timing issues, no async rendering.
      return (
        <div style={wrapStyle}>
          <div dangerouslySetInnerHTML={{ __html: barcodeSvgString }} />
        </div>
      );
    }

    // Designer / preview mode: use the interactive BarcodeElement.
    return (
      <BarcodeElement
        value={patient.visitId}
        settings={barcodeSettings}
        zoom={zoom}
      />
    );
  };

  /* ── Row rendering ────────────────────────────────────────────── */
  const renderRow = (row, i) => {
    if (row.type === 'department') {
      return (
        <tr key={i}>
          <td
            colSpan={4}
            style={{ paddingTop: 20, paddingBottom: 6, textAlign: 'center', background: 'white' }}
          >
            <span style={{
              fontSize:      '18px',
              fontWeight:    '700',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              display:       'block',
              ...deptStyles,
            }}>
              {row.content}
            </span>
          </td>
        </tr>
      );
    }

    if (row.type === 'test') {
      return (
        <tr key={i}>
          <td
            colSpan={4}
            style={{ paddingTop: 14, paddingBottom: 4, paddingLeft: 12, paddingRight: 12, background: 'white' }}
          >
            <span style={{
              fontSize:          '15px',
              fontWeight:        '700',
              textTransform:     'uppercase',
              textDecoration:    'underline',
              textUnderlineOffset: '3px',
              display:           'block',
              ...testStyles,
            }}>
              {row.content}
            </span>
          </td>
        </tr>
      );
    }

    if (row.type === 'section') {
      return (
        <tr key={i}>
          <td
            style={{ paddingTop: 14, paddingBottom: 0, paddingLeft: 12, paddingRight: 12, background: 'white' }}
          >
            <span style={{
              fontSize:      '14px',
              fontWeight:    '800',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              display:       'block',
              whiteSpace:    'normal',
              overflowWrap:  'anywhere',
              wordBreak:     'break-word',
              lineHeight:    1.2,
              ...secStyles,
            }}>
              {row.content}
            </span>
          </td>
          <td colSpan={3} />
        </tr>
      );
    }

    if (row.type === 'text_block') {
      const res = row.content;
      return (
        <tr key={i} style={{ background: 'white' }}>
          <td colSpan={4} style={{ padding: '16px 12px' }}>
            <span style={{
              fontSize:      '12px',
              fontWeight:    '700',
              textTransform: 'uppercase',
              display:       'block',
              marginBottom:  '4px',
              wordBreak:     'break-word',
              overflowWrap:  'anywhere',
              whiteSpace:    'normal',
              ...paramStyles,
            }}>
              {res.isTextBlock ? "Remarks" : (res.parameter || 'N/A')}
            </span>
            <div style={{
              whiteSpace:   'pre-wrap',
              wordBreak:    'break-word',
              overflowWrap: 'anywhere',
              ...resultStyles,
            }}>
              {res.textBlockValue !== undefined ? res.textBlockValue : res.value}
            </div>
          </td>
        </tr>
      );
    }

    if (row.type === 'parameter') {
      const res = row.content;
      const { isAbnormal, formattedValue } = checkAbnormalResult(res.value, res.normalRange);
      return (
        <tr key={i} style={{ background: 'white' }}>
          <td style={{
            padding:      `${rowPad}px 12px`,
            wordBreak:    'break-word',
            overflowWrap: 'anywhere',
            whiteSpace:   'normal',
            ...paramStyles,
          }}>
            {res.parameter || 'N/A'}
          </td>
          <td style={{
            padding:    `${rowPad}px 12px`,
            fontWeight: isAbnormal ? '700' : undefined,
            ...resultStyles,
          }}>
            {formattedValue}
          </td>
          <td style={{
            padding:   `${rowPad}px 12px`,
            textAlign: 'center',
            color:     '#475569',
            ...unitStyles,
          }}>
            {res.unit}
          </td>
          <td style={{ padding: `${rowPad}px 12px`, color: '#475569', ...rangeStyles }}>
            {res.normalRange}
          </td>
        </tr>
      );
    }

    if (row.type === 'blank') {
      return (
        <tr key={i}>
          <td colSpan={4} style={{ height: `${row.height || 16}px` }} />
        </tr>
      );
    }

    return null;
  };

  /* ── Zoom: scale the 794×1123 box and clip outer container ───── */
  const pageBox = (
    <div
      className="print-page"
      style={{
        width:          `${A4_WIDTH_PX}px`,
        height:         `${A4_HEIGHT_PX}px`,
        boxSizing:      'border-box',
        padding:        `${marginTop}px ${marginRight}px ${marginBottom}px ${marginLeft}px`,
        display:        'flex',
        flexDirection:  'column',
        background:     'white',
        overflow:       'hidden',
        contain:        'paint layout',
        transformOrigin: 'top left',
        transform:      zoom !== 1 ? `scale(${zoom})` : undefined,
        ...baseFont,
      }}
    >
      {/* ── 1. Patient Header ─────────────────────────────────── */}
      <div style={{ flexShrink: 0, contain: 'layout' }}>
        {renderBarcode()}
        <PatientInfo patient={patient} report={report} template={template} />
        <div style={{ borderBottom: '2px solid #CBD5E1', marginTop: '4px' }} />
      </div>

      {/* ── 2. Table Header ───────────────────────────────────── */}
      <table style={{
        width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', flexShrink: 0,
      }}>
        {colgroup}
        <thead>
          <tr>
            <th style={{ ...thBase, textAlign: 'left'   }}>TEST NAME</th>
            <th style={{ ...thBase, textAlign: 'left'   }}>RESULT</th>
            <th style={{ ...thBase, textAlign: 'center' }}>UNIT</th>
            <th style={{ ...thBase, textAlign: 'left'   }}>REFERENCE RANGE</th>
          </tr>
        </thead>
      </table>

      {/* ── 3. Content Area ───────────────────────────────────── */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
          {colgroup}
          <tbody>
            {rows.length > 0
              ? rows.map((row, i) => renderRow(row, i))
              : (
                <tr>
                  <td colSpan={4} style={{
                    textAlign:  'center',
                    color:      '#94A3B8',
                    fontStyle:  'italic',
                    paddingTop: '40px',
                  }}>
                    No tests available in this report.
                  </td>
                </tr>
              )
            }
          </tbody>
        </table>
      </div>

      {/* ── 4. Footer (always at page bottom via flex) ────────── */}
      <div style={{ flexShrink: 0 }}>
        <div style={{ borderTop: '2px solid #CBD5E1', marginBottom: '4px' }} />
        <SignatureSection patient={patient} template={template} />
      </div>
    </div>
  );

  // When unzoomed (e.g. print-window mode), return the .print-page directly as the top-level element
  if (zoom === 1) {
    return pageBox;
  }

  // Designer preview mode: clip outer container to scaled dimensions
  const outerW = A4_WIDTH_PX  * zoom;
  const outerH = A4_HEIGHT_PX * zoom;

  return (
    <div style={{
      width:    `${outerW}px`,
      height:   `${outerH}px`,
      overflow: 'hidden',
      flexShrink: 0,
      display:  'block',
    }}>
      {pageBox}
    </div>
  );
};