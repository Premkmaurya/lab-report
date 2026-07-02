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

export const TestResultTable = ({ test, rowSpacing = 4 }) => {
  return (
    <div>

      <div className="text-left my-2 pb-2">
        <h2 className="text-lg font-bold text-[#0F172A] uppercase underline decoration-1 underline-offset-2 tracking-wider">
          {test.testName}
        </h2>
      </div>

      <table className="w-full text-caption text-slate-900 border-collapse">
        <thead className="bg-[#F8FAFC]">
          <tr>
            <th
              className="px-3 text-left font-semibold w-1/3"
              style={{
                paddingTop: `${rowSpacing}px`,
                paddingBottom: `${rowSpacing}px`,
              }}
            >
              Parameter
            </th>
            <th
              className="px-3 text-left font-semibold w-1/6"
              style={{
                paddingTop: `${rowSpacing}px`,
                paddingBottom: `${rowSpacing}px`,
              }}
            >
              Result
            </th>
            <th
              className="px-3 text-left font-semibold w-1/6"
              style={{
                paddingTop: `${rowSpacing}px`,
                paddingBottom: `${rowSpacing}px`,
              }}
            >
              Unit
            </th>
            <th
              className="px-3 text-left font-semibold w-1/3"
              style={{
                paddingTop: `${rowSpacing}px`,
                paddingBottom: `${rowSpacing}px`,
              }}
            >
              Normal Range
            </th>
          </tr>
        </thead>
        <tbody>
          {test.result && test.result.length > 0 ? (
            test.result.map((res, index) => {
              return (
                <tr key={index} className="bg-white">
                  <td
                    className="px-3"
                    style={{
                      paddingTop: `${rowSpacing}px`,
                      paddingBottom: `${rowSpacing}px`,
                    }}
                  >
                    {res.parameter || "N/A"}
                  </td>
                  <td
                    className="px-3"
                    style={{
                      paddingTop: `${rowSpacing}px`,
                      paddingBottom: `${rowSpacing}px`,
                    }}
                  >
                    {res.value}
                  </td>
                  <td
                    className="px-3 text-[#475569]"
                    style={{
                      paddingTop: `${rowSpacing}px`,
                      paddingBottom: `${rowSpacing}px`,
                    }}
                  >
                    {res.unit}
                  </td>
                  <td
                    className="px-3 text-[#475569]"
                    style={{
                      paddingTop: `${rowSpacing}px`,
                      paddingBottom: `${rowSpacing}px`,
                    }}
                  >
                    {res.normalRange}
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td
                colSpan="4"
                className="py-4 text-center text-[#475569] italic"
              >
                No parameters recorded for this test.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};
