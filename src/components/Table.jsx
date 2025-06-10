import React from "react";

const Table = ({ data = [] }) => {
  // Ensure data is always an array
  if (!Array.isArray(data) || data.length === 0) {
    return <p className="text-gray-500">No data available</p>;
  }

  // Extract column headers dynamically from data keys
  const columns = Object.keys(data[0] || {});

  return (
    <table className="w-full border-collapse border border-gray-300">
      <thead>
        <tr className="bg-gray-100">
          {columns.map((col) => (
            <th key={col} className="px-4 py-2 text-left border border-gray-300">
              {col}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, index) => (
          <tr key={index} className="border border-gray-300">
            {columns.map((col) => (
              <td key={col} className="px-4 py-2 border border-gray-300">
                {row[col]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default Table;
