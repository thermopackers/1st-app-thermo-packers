import React, { useState } from 'react';
import AdminFilters from './AdminFilters';
import SearchFilter from './SearchFilter';
import DateFilter from './DateFilter';
import SortFilter from './SortFilter';
import StatusFilter from './StatusFilter';
import DispatchStatusFilter from './DispatchStatusFilter';
import ClearFiltersButton from './ClearFiltersButton';
import ExportButton from './ExportButton';
import NavigationButtons from './NavigationButtons';
import ClearCustomerFilter from './ClearCustomerFilter';

const OrderFilters = ({
  role,
  employees,
  filters,
  handleFilterChange,
  setFilters,
  searchTerm,
  setSearchTerm,
  sortOrder,
  setSortOrder,
  statusFilter,
  setStatusFilter,
  dispatchStatusFilter,
  setDispatchStatusFilter,
  navigate,
  orders,
  exportToExcel,
  handleClearFilters
}) => {
  // State for collapsible
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false);

  // Check if any filters are active
  const hasActiveFilters = 
    filters.employeeId || 
    filters.startDate || 
    filters.endDate || 
    filters.customerName ||
    searchTerm || 
    sortOrder !== "newest" || 
    statusFilter || 
    dispatchStatusFilter;

  // Auto-expand if filters are active
  React.useEffect(() => {
    if (hasActiveFilters) {
      setIsFiltersExpanded(true);
    }
  }, [hasActiveFilters]);

  return (
    <>
      {(role.includes("admin") || role.includes("accounts")) && (
        <AdminFilters 
          employees={employees}
          filters={filters}
          handleFilterChange={handleFilterChange}
          setFilters={setFilters}
          setSearchTerm={setSearchTerm}
          setSortOrder={setSortOrder}
          setStatusFilter={setStatusFilter}
          setDispatchStatusFilter={setDispatchStatusFilter}
        />
      )}

      {/* Collapsible Filters */}
      <div className="mb-4">
        <button
          onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
          className="w-full flex items-center justify-between px-4 py-3 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200"
        >
          <span className="text-lg font-semibold text-gray-700">
            {hasActiveFilters ? "🔍 Filters (Active)" : "🔍 Filters"}
          </span>
          <span className="text-2xl text-gray-500 transition-transform duration-300" 
                style={{ transform: isFiltersExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
            ▼
          </span>
        </button>
        
        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isFiltersExpanded ? 'max-h-[2000px] opacity-100 mt-4' : 'max-h-0 opacity-0'
        }`}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 px-6 py-6 bg-white rounded-lg shadow-md">
            <SearchFilter searchTerm={searchTerm} setSearchTerm={setSearchTerm} filters={filters} />
            <DateFilter 
              filters={filters} 
              handleFilterChange={handleFilterChange} 
              type="startDate" 
              label="📅 Start Date" 
            />
            <DateFilter 
              filters={filters} 
              handleFilterChange={handleFilterChange} 
              type="endDate" 
              label="📅 End Date" 
            />
            
            <ClearCustomerFilter filters={filters} setFilters={setFilters} />
            
            {(role.includes("sales") || role.includes("dispatch") || role.includes("packaging")) && (
              <ClearFiltersButton 
                handleClearFilters={handleClearFilters}
              />
            )}

            {orders.length > 0 && (
              <ExportButton exportToExcel={exportToExcel} />
            )}

            <SortFilter sortOrder={sortOrder} setSortOrder={setSortOrder} />
            <StatusFilter 
              statusFilter={statusFilter} 
              setStatusFilter={setStatusFilter}
              filters={filters}
            />
            <DispatchStatusFilter 
              dispatchStatusFilter={dispatchStatusFilter} 
              setDispatchStatusFilter={setDispatchStatusFilter} 
            />
            
            {(role.includes("admin") || role.includes("accounts") || role.includes("sales") || role.includes("production")) && (
              <NavigationButtons navigate={navigate} />
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default OrderFilters;