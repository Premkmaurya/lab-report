import React from 'react';

export const ReportBody = ({ test }) => {
  return (
    <div className="mb-8 page-break-inside-avoid">
      <h2 className="text-lg font-bold text-black uppercase mb-4 border-b border-gray-300 pb-2">
        {test.testName}
      </h2>
      
      <table className="w-full text-sm text-black border-collapse">
        <thead>
          <tr className="border-b-1 border-black text-left">
            <th className="py-2 px-4 font-semibold w-1/3">Parameter</th>
            <th className="py-2 px-4 font-semibold w-1/6">Value</th>
            <th className="py-2 px-4 font-semibold w-1/6">Unit</th>
            <th className="py-2 px-4 font-semibold w-1/3">Normal Range</th>
          </tr>
        </thead>
        <tbody>
          {test.result && test.result.length > 0 ? (
            test.result.map((res, index) => (
              <tr key={index} className="border-b border-gray-200">
                <td className="py-2 px-4 font-medium">{res.parameter || "N/A"}</td>
                <td className="py-2 px-4">{res.value}</td>
                <td className="py-2 px-4 text-gray-700">{res.unit}</td>
                <td className="py-2 px-4 text-gray-700">{res.normalRange}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="4" className="py-4 text-center text-gray-500 italic">
                No parameters recorded for this test.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};
