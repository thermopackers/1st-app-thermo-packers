import React from 'react';

const SearchFilter = ({ searchTerm, setSearchTerm, filters }) => (
  <div className="col-span-1">
 <label htmlFor="search" className="block text-sm font-semibold text-gray-700 mb-1">
  {filters.customerName ? `🔍 Search in ${filters.customerName}'s orders` : '🔍 Search'}
</label>
<input
  type="text"
  id="search"
  placeholder={filters.customerName ? `Search in ${filters.customerName}'s orders...` : "Search by PO, Product, Order ID, or Customer"}
  className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
  value={searchTerm}
  onChange={(e) => setSearchTerm(e.target.value)}
/>
{filters.customerName && (
  <p className="text-xs text-gray-500 mt-1">
    Searching within {filters.customerName}'s orders only
  </p>
)}
  </div>
);

export default SearchFilter;