import React from "react";

export const ReportTestTable = ({ tests = [] }) => {
  return (
    <div className="pt-1 overflow-x-auto">
      <table className="w-full text-left text-xs border-collapse">
        <thead>
          <tr className="bg-[#CCCCCC] text-black font-bold text-[11px] uppercase tracking-wider">
            <th className="py-2 px-2 w-[45%]">TEST NAME</th>
            <th className="py-2 px-2 w-[20%]">RESULT</th>
            <th className="py-2 px-2 w-[15%] text-center">UNIT</th>
            <th className="py-2 px-2 w-[20%]">REFERENCE RANGE</th>
          </tr>
        </thead>
        <tbody>
          {tests.map((test, tIndex) => (
            <React.Fragment key={tIndex}>
              {/* Department Heading */}
              {test.department && (
                <tr>
                  <td
                    colSpan={4}
                    className="py-3 px-2 text-center font-bold text-xs text-black uppercase tracking-wider underline decoration-1 underline-offset-2 bg-white"
                  >
                    {test.department}
                  </td>
                </tr>
              )}

              {/* Test Heading */}
              <tr>
                <td
                  colSpan={4}
                  className="py-2 px-2 font-bold text-xs text-black uppercase tracking-wide bg-white underline underline-offset-2"
                >
                  {test.testName}
                </td>
              </tr>

              {/* Parameter Rows */}
              {(test.result || []).map((res, rIndex) => {
                if (res.type === "section") {
                  return (
                    <tr key={rIndex} className="bg-white">
                      <td
                        colSpan={4}
                        className="py-2 px-2 font-bold text-black uppercase text-[11px] tracking-wider"
                      >
                        {res.parameter}
                      </td>
                    </tr>
                  );
                }

                if (res.isTextBlock) {
                  return (
                    <tr key={rIndex}>
                      <td colSpan={4} className="py-2 px-2">
                        <span className="font-semibold text-black block mb-1">
                          {res.parameter || "Remarks"}
                        </span>
                        <div className="whitespace-pre-wrap text-black bg-white p-2 border border-slate-200 font-mono text-[11px]">
                          {res.textBlockValue || res.value || "-"}
                        </div>
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr key={rIndex} className="hover:bg-slate-50">
                    <td className="py-1.5 px-2 font-normal text-black">
                      {res.parameter}
                    </td>
                    <td className="py-1.5 px-2 font-bold text-black font-mono">
                      {res.value || "-"}
                    </td>
                    <td className="py-1.5 px-2 text-center text-black font-normal">
                      {res.unit || "-"}
                    </td>
                    <td className="py-1.5 px-2 text-black font-normal">
                      {res.normalRange || "-"}
                    </td>
                  </tr>
                );
              })}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
};
