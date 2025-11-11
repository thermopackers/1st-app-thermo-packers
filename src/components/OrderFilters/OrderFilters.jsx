import React from 'react';
import AdminFilters from './AdminFilters';
import SearchFilter from './SearchFilter';
import DateFilter from './DateFilter';
import SortFilter from './SortFilter';
import StatusFilter from './StatusFilter';
import DispatchStatusFilter from './DispatchStatusFilter';
import ClearFiltersButton from './ClearFiltersButton';
import ExportButton from './ExportButton';
import NavigationButtons from './NavigationButtons';

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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 px-6 py-6 bg-white rounded-lg shadow-md">
        <SearchFilter searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
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
        
        {(role.includes("sales") || role.includes("dispatch") || role.includes("packaging")) && (
          <ClearFiltersButton 
            setFilters={setFilters}
            setSearchTerm={setSearchTerm}
            setSortOrder={setSortOrder}
            setStatusFilter={setStatusFilter}
            setDispatchStatusFilter={setDispatchStatusFilter}
                  handleClearFilters={handleClearFilters}
          />
        )}

        {orders.length > 0 && (
          <ExportButton exportToExcel={exportToExcel} />
        )}

        <SortFilter sortOrder={sortOrder} setSortOrder={setSortOrder} />
        <StatusFilter statusFilter={statusFilter} setStatusFilter={setStatusFilter} />
        <DispatchStatusFilter 
          dispatchStatusFilter={dispatchStatusFilter} 
          setDispatchStatusFilter={setDispatchStatusFilter} 
        />
        
        {(role.includes("admin") || role.includes("accounts") || role.includes("sales") || role.includes("production")) && (
          <NavigationButtons navigate={navigate} />
        )}
      </div>
    </>
  );
};

export default OrderFilters;