import React from 'react';

const StatusFilter = ({ statusFilter, setStatusFilter }) => (
  <div className="col-span-1">
    <label className="block text-sm font-semibold text-gray-700 mb-1">
      🏷️ Production Status
    </label>
    <select
      value={statusFilter}
      onChange={(e) => setStatusFilter(e.target.value)}
      className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      <option value="">All</option>
      <option value="pending">Pending</option>
      <option value="in process">In Process</option>
      <option value="processed">Processed</option>
      <option value="completed">Completed</option>
      <option value="cancelled">Cancelled</option>
    </select>
  </div>
);

export default StatusFilter;