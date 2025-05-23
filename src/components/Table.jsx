import React from "react";

const Table = ({ data = [], className = "" }) => {
  // Ensure data is always an array
  if (!Array.isArray(data) || data.length === 0) {
    return <p className="text-muted">No data available</p>;
  }

  // Extract column headers dynamically from data keys
  const columns = Object.keys(data[0] || {});

  return (
    <div className="w-full overflow-x-auto">
      <table className={`w-full border-collapse bg-card rounded-lg overflow-hidden ${className}`}>
        <thead>
          <tr className="bg-muted-light/50">
            {columns.map((col) => (
              <th 
                key={col} 
                className="px-4 py-3 text-left font-medium text-foreground border-b border-border"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr 
              key={index} 
              className="border-b border-border hover:bg-muted-light/20 transition-colors duration-150"
            >
              {columns.map((col) => (
                <td 
                  key={col} 
                  className="px-4 py-3 text-foreground"
                >
                  {row[col]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
