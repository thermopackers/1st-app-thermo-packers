import React from 'react';

const ClearFiltersButton = ({ 
  setFilters, 
  setSearchTerm, 
  setSortOrder, 
  setStatusFilter, 
  setDispatchStatusFilter 
}) => (
  <div className="col-span-1 flex items-end">
    <button
      onClick={() => {
        setFilters({ employeeId: "", startDate: "", endDate: "" });
        setSearchTerm("");
        setSortOrder("newest");
        setStatusFilter("");
        setDispatchStatusFilter("");
      }}
      className="w-full bg-yellow-500 cursor-pointer hover:bg-yellow-600 text-white font-bold px-4 py-2 rounded-md shadow-lg transition"
    >
      ⟳ Clear Filters
    </button>
  </div>
);

export default ClearFiltersButton;