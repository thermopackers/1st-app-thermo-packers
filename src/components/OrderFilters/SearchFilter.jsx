import React from 'react';

const SearchFilter = ({ searchTerm, setSearchTerm }) => (
  <div className="col-span-1">
    <label htmlFor="search" className="block text-sm font-semibold text-gray-700 mb-1">
      🔍 Search
    </label>
    <input
      type="text"
      id="search"
      placeholder="Search by PO, Product, Order ID, or Customer"
      className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
    />
  </div>
);

export default SearchFilter;