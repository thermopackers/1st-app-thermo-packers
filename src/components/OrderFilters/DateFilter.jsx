import React from 'react';

const DateFilter = ({ filters, handleFilterChange, type, label }) => (
  <div className="col-span-1">
    <label htmlFor={type} className="block text-sm font-semibold text-gray-700 mb-1">
      {label}
    </label>
    <input
      type="date"
      lang="en-GB"
      name={type}
      id={type}
      value={filters[type]}
      onChange={handleFilterChange}
      className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
  </div>
);

export default DateFilter;