import React from 'react';

const SortFilter = ({ sortOrder, setSortOrder }) => (
  <div className="col-span-1">
    <label className="block text-sm font-semibold text-gray-700 mb-1">
      🕒 Sort By
    </label>
    <select
      value={sortOrder}
      onChange={(e) => setSortOrder(e.target.value)}
      className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      <option value="newest">Newest First</option>
      <option value="olderThan10">Older Than 10 Days</option>
      <option value="olderThan20">Older Than 20 Days</option>
      <option value="olderThan30">Older Than 30 Days</option>
      <option value="moreThan30">More Than 30 Days</option>
    </select>
  </div>
);

export default SortFilter;