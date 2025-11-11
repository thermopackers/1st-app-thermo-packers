import React from 'react';

const DispatchStatusFilter = ({ dispatchStatusFilter, setDispatchStatusFilter }) => (
  <div className="col-span-1">
    <label className="block text-sm font-semibold text-gray-700 mb-1">
      🚚 Dispatch Status
    </label>
    <select
      value={dispatchStatusFilter}
      onChange={(e) => setDispatchStatusFilter(e.target.value)}
      className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      <option value="">All</option>
      <option value="not dispatched">Not Dispatched</option>
      <option value="ready to dispatch">Ready to Dispatch</option>
      <option value="dispatched">Dispatched</option>
    </select>
  </div>
);

export default DispatchStatusFilter;