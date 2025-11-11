import React from 'react';

const AdminFilters = ({
  employees,
  filters,
  handleFilterChange,
  setFilters,
  setSearchTerm,
  setSortOrder,
  setStatusFilter,
  setDispatchStatusFilter
}) => (
  <div className="bg-white p-6 shadow-lg rounded-lg mb-6 grid md:grid-cols-2 gap-4 items-end">
    <div className="col-span-1">
      <label htmlFor="employeeId" className="block text-base font-bold text-gray-700 mb-1">
        Employees
      </label>
      <select
        name="employeeId"
        id="employeeId"
        className="w-full cursor-pointer px-3 py-2 border font-bold border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
        value={filters.employeeId}
        onChange={handleFilterChange}
      >
        <option value="">All Employees</option>
        {employees
          .filter((employee) => employee._id !== "admin")
          .map((employee) => (
            <option key={employee._id} value={employee._id}>
              {employee.name}
            </option>
          ))}
      </select>
    </div>

    <div className="col-span-1">
      <button
        onClick={() => {
          setFilters({ employeeId: "", startDate: "", endDate: "" });
          setSearchTerm("");
          setSortOrder("newest");
          setStatusFilter("");
          setDispatchStatusFilter("");
        }}
        className="w-full bg-[#b632ebd7] font-bold hover:bg-[#B229EA] cursor-pointer text-white px-4 py-2 rounded-lg shadow-md transition"
      >
        ⟳ Clear Filters
      </button>
    </div>
  </div>
);

export default AdminFilters;