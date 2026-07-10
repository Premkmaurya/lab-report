import React, { useEffect } from "react";

const isAbnormal = (value, rangeStr) => {
  if (!rangeStr || !value) return null;
  const numVal = parseFloat(value);
  if (isNaN(numVal)) return null;

  // Extract min and max from range string like "13.0 - 17.0"
  const parts = rangeStr.split("-").map((p) => parseFloat(p.trim()));
  if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
    const [min, max] = parts;
    if (numVal < min) return "low";
    if (numVal > max) return "high";
  }
  return null;
};

export const TestResultTable = ({ test, rowSpacing = 4, template }) => {
  const testHeadingStyles = template?.elements?.testHeading || {};
  const sectionHeaderStyles = template?.elements?.sectionHeader || {};
  const profileStyles = template?.elements?.profileName || {};
  const parameterStyles = template?.elements?.parameter || {};
  const resultStyles = template?.elements?.result || {};
  const unitStyles = template?.elements?.unit || {};
  // using parameter styles for normal range if no dedicated one
  const normalRangeStyles = template?.elements?.unit || {}; // Since unit and normal range are similar

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
            return (
              <tr key={index} className="bg-white">
                <td colSpan="4" className="pt-6 pb-2">
                  <span
                    className="text-lg font-extrabold text-left text-[#0F172A] uppercase tracking-wider block"
                    style={{ ...sectionHeaderStyles }}
                  >
                    {res.parameter}
                  </span>
                </td>
              </tr>
            );
          }
          return (
            <tr key={index} className="bg-white">
              <td
                className="px-3 text-left"
                style={{
                  paddingTop: `${rowSpacing}px`,
                  paddingBottom: `${rowSpacing}px`,
                  ...parameterStyles,
                }}
              >
                {res.parameter || "N/A"}
              </td>
              <td
                className="px-3 text-left"
                style={{
                  paddingTop: `${rowSpacing}px`,
                  paddingBottom: `${rowSpacing}px`,
                  ...resultStyles,
                }}
              >
                {res.value}
              </td>
              <td
                className="px-3 text-left text-[#475569]"
                style={{
                  paddingTop: `${rowSpacing}px`,
                  paddingBottom: `${rowSpacing}px`,
                  ...unitStyles,
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
                {res.normalRange}
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
