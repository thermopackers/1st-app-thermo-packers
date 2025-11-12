import React from 'react';

const ClearCustomerFilter = ({ filters, setFilters }) => {
  if (!filters.customerName) return null;

  return (
    <div className="col-span-1 flex items-end">
      <button
        onClick={() => setFilters(prev => ({ ...prev, customerName: "" }))}
        className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold px-4 py-2 rounded-md shadow-lg transition"
      >
        ❌ Clear Customer Filter
      </button>
    </div>
  );
};

export default ClearCustomerFilter;