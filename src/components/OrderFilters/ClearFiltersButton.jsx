import React from 'react';

const ClearFiltersButton = ({ handleClearFilters }) => (
  <div className="col-span-1 flex items-end">
    <button
      onClick={handleClearFilters}
      className="w-full bg-yellow-500 cursor-pointer hover:bg-yellow-600 text-white font-bold px-4 py-2 rounded-md shadow-lg transition"
    >
      ⟳ Clear All Filters
    </button>
  </div>
);

export default ClearFiltersButton;