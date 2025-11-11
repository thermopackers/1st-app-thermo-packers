import React from 'react';

const ExportButton = ({ exportToExcel }) => (
  <div className="col-span-1 flex items-end">
    <button
      onClick={exportToExcel}
      className="w-full bg-green-600 cursor-pointer hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-md shadow-lg transition"
    >
      📥 Export to Excel
    </button>
  </div>
);

export default ExportButton;