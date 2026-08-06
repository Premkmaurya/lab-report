import React from "react";
import { checkAbnormalResult } from "../../utils/resultUtils";
import { resolveReferenceRange } from "../../utils/referenceRangeResolver";

export const TestResultTable = ({ test, rowSpacing = 4, template, patient }) => {
  const testHeadingStyles = template?.elements?.testHeading || {};
  const sectionHeaderStyles = template?.elements?.sectionHeading || template?.elements?.sectionHeader || {};
  const profileStyles = template?.elements?.profileName || {};
  const parameterStyles = template?.elements?.parameter || {};
  const resultStyles = template?.elements?.result || {};
  const unitStyles = template?.elements?.unit || {};
  // using parameter styles for normal range if no dedicated one
  const normalRangeStyles = template?.elements?.unit || {}; // Since unit and normal range are similar
  const patientInfo = patient || test?.patientId || test?.patient || {};

  return (
    <>
      <tr className="bg-white">
        <td colSpan="4" className="pt-6 pb-2 px-3 text-left">
          <span
            className="text-lg font-bold text-[#0F172A] uppercase underline decoration-1 underline-offset-4"
            style={{ ...testHeadingStyles }}
          >
            {test.testName}
          </span>
        </td>
      </tr>
      {test.result && test.result.length > 0 ? (
        test.result.map((res, index) => {
          if (res.type === 'section') {
            const align = sectionHeaderStyles.textAlign || 'left';
            const underline = (sectionHeaderStyles.textDecoration === 'underline' || sectionHeaderStyles.underline) ? 'underline' : (sectionHeaderStyles.textDecoration || 'none');
            const fontStyle = sectionHeaderStyles.fontStyle || 'normal';

            return (
              <tr key={index} className="bg-white">
                <td colSpan="4" className="pt-4 pb-2 px-3" style={{ textAlign: align }}>
                  <span
                    className="section-header text-wrap text-lg font-extrabold text-[#0F172A] uppercase tracking-wider block"
                    style={{
                      fontSize: sectionHeaderStyles.fontSize,
                      fontWeight: sectionHeaderStyles.fontWeight,
                      fontStyle: fontStyle,
                      color: sectionHeaderStyles.color,
                      textAlign: align,
                      textTransform: sectionHeaderStyles.textTransform || 'uppercase',
                      textDecoration: underline,
                      whiteSpace: 'normal',
                      overflowWrap: 'anywhere',
                      wordBreak: 'break-word',
                      lineHeight: 1.2,
                      maxWidth: '100%',
                      ...sectionHeaderStyles
                    }}
                  >
                    {res.parameter}
                  </span>
                </td>
              </tr>
            );
          }

          const resolvedRules =
            (Array.isArray(item.referenceRanges) && item.referenceRanges.length > 0)
              ? item.referenceRanges
              : [];

          const displayRange = resolveReferenceRange(
            {
              normalRange: item.normalRange,
              referenceRanges: resolvedRules
            },
            patient || {}
          );


          const { isAbnormal, status, formattedValue } = checkAbnormalResult(res.value, displayRange, res.isListParameter);

          return (
            <tr key={index} className="bg-white">
              <td
                className="px-3 text-left text-wrap"
                style={{
                  paddingTop: `${rowSpacing}px`,
                  paddingBottom: `${rowSpacing}px`,
                  wordBreak: 'break-word',
                  overflowWrap: 'anywhere',
                  whiteSpace: 'normal',
                  ...parameterStyles,
                }}
              >
                {res.parameter || "N/A"}
              </td>
              <td
                className={`px-3 text-left ${isAbnormal ? 'text-red-600 font-bold' : ''}`}
                style={{
                  paddingTop: `${rowSpacing}px`,
                  paddingBottom: `${rowSpacing}px`,
                  fontWeight: isAbnormal ? '700' : (resultStyles.fontWeight || 'normal'),
                  color: isAbnormal ? '#dc2626' : undefined,
                  ...resultStyles,
                }}
              >
                {isAbnormal ? `${formattedValue}` : formattedValue}
              </td>
              <td
                className="px-3 text-center text-[#475569]"
                style={{
                  paddingTop: `${rowSpacing}px`,
                  paddingBottom: `${rowSpacing}px`,
                  ...unitStyles,
                  textTransform: 'none',
                }}
              >
                {res.unit}
              </td>
              <td
                className="px-3 text-left text-[#475569]"
                style={{
                  paddingTop: `${rowSpacing}px`,
                  paddingBottom: `${rowSpacing}px`,
                  ...normalRangeStyles,
                }}
              >
                {displayRange}
              </td>
            </tr>
          );
        })
      ) : (
        <tr>
          <td colSpan="4" className="py-4 text-center text-[#475569] italic">
            No parameters recorded for this test.
          </td>
        </tr>
      )}
    </>
  );
};
