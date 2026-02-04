import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../axiosInstance';
import Swal from 'sweetalert2';
import InternalNavbar from '../components/InternalNavbar';
import { useUserContext } from '../context/UserContext';

const GuardEntriesView = () => {
  const { user } = useUserContext();
  const navigate = useNavigate();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState('');
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalEntries: 0,
    hasNext: false,
    hasPrev: false,
    limit: 10
  });
const [searchQuery, setSearchQuery] = useState('');
const [searchType, setSearchType] = useState('supplierCustomer'); // 'supplierCustomer' or 'products'
  useEffect(() => {
    fetchEntries();
  }, [filterDate, pagination.currentPage]);

  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     fetchEntries();
  //   }, 30000); // Refresh every 30 seconds

  //   return () => clearInterval(interval);
  // }, [filterDate, pagination.currentPage]);

const fetchEntries = async () => {
  try {
    setLoading(true);
    let url = `/guard-entries?page=${pagination.currentPage}&limit=${pagination.limit}`;
    if (filterDate) {
      url += `&date=${filterDate}`;
    }
    if (searchQuery.trim()) {
      url += `&search=${encodeURIComponent(searchQuery.trim())}`;
      url += `&searchType=${searchType}`;
    }
    
    const res = await axiosInstance.get(url);
    setEntries(res.data.entries);
    setPagination(res.data.pagination);
  } catch (err) {
    console.error('Failed to fetch entries', err);
    Swal.fire('Error', 'Failed to load entries', 'error');
  } finally {
    setLoading(false);
  }
};

  const showPhoto = (url, title) => {
    Swal.fire({
      title: title,
      html: `<div style="text-align:center;">
             <img src="${url}" alt="${title}" style="max-width:100%; max-height:70vh; border-radius:8px;" />
           </div>`,
      showCloseButton: true,
      showConfirmButton: false,
      width: "80%",
      background: "#fff",
    });
  };

  const showProducts = (products, title) => {
    if (!products || products.length === 0) {
      Swal.fire('Info', 'No products recorded for this entry', 'info');
      return;
    }

    const productsHtml = products.map((item, index) => {
      // Handle both existing products and manual products
      const productName = item.product?.name || item.productName || 'Unknown Product';
      const productCode = item.product?.code;
      const quantity = item.quantity || 0;
      const isManual = !item.product && item.productName;

      return `
        <div class="border-b border-gray-200 py-3">
          <div class="flex justify-between items-start">
            <div class="flex-1">
              <div class="font-medium text-gray-900">${productName}</div>
              ${productCode ? `<div class="text-sm text-gray-600 mt-1">Code: ${productCode}</div>` : ''}
              ${isManual ? `<div class="text-xs text-green-600 mt-1 font-medium">📝 Manual Entry</div>` : ''}
            </div>
            <div class="text-right">
              <div class="text-lg font-bold text-blue-600">${quantity}</div>
              <div class="text-xs text-gray-500">Qty</div>
            </div>
          </div>
        </div>
      `;
    }).join('');

    Swal.fire({
      title: title,
      html: `<div class="text-left max-h-96 overflow-y-auto">
             <div class="space-y-2">${productsHtml}</div>
           </div>`,
      showCloseButton: true,
      showConfirmButton: false,
      width: "500px",
      background: "#fff",
    });
  };

  const showRemarks = (remarks, title) => {
    if (!remarks || remarks.trim() === '') {
      Swal.fire('Info', 'No remarks provided for this entry', 'info');
      return;
    }

    Swal.fire({
      title: title,
      html: `<div class="text-left max-w-md">
             <div class="bg-gray-50 p-4 rounded-lg border border-gray-200">
               <p class="text-gray-700 whitespace-pre-wrap">${remarks}</p>
             </div>
           </div>`,
      showCloseButton: true,
      showConfirmButton: false,
      width: "600px",
      background: "#fff",
    });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  const formatFilterDateForDisplay = (isoDate) => {
    if (!isoDate) return '';
    const date = new Date(isoDate);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({
      ...prev,
      currentPage: newPage
    }));
  };

  const handleAddEntry = () => {
    navigate('/guard-entry');
  };

  const canViewAllEntries = () => {
    if (!user || !user.role) return false;
    const userRoles = Array.isArray(user.role) ? user.role : [user.role];
    return userRoles.some(role => ["accounts", "admin"].includes(role));
  };

  if (loading) {
    return (
      <>
        <InternalNavbar />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading entries...</p>
          </div>
        </div>
      </>
    );
  }

  const handleRowClick = (entry) => {
    // Check if user has accounts role
    const userRoles = Array.isArray(user?.role) ? user.role : [user?.role];
    if (userRoles.includes('accounts') || userRoles.includes('admin')) {
      navigate(`/goods-inward/${entry._id}`);
    } else {
      Swal.fire('Access Denied', 'Only accounts team can access goods inward', 'info');
    }
  };

  // Calculate stats
  const totalEntries = pagination.totalEntries;
  const uniqueVehicles = new Set(entries.map(entry => entry.vehicleNumber)).size;
  const totalSuppliers = new Set(entries.filter(e => !e.isRejected).map(e => e.supplier?._id || e.supplierName)).size;
  const totalCustomers = new Set(entries.filter(e => e.isRejected).map(e => e.customer?._id || e.customerName)).size;
  const rejectedEntries = entries.filter(e => e.isRejected).length;
  const supplierEntries = entries.filter(e => !e.isRejected).length;

  const handleDeleteEntry = async (entryId) => {
  const result = await Swal.fire({
    title: 'Are you sure?',
    text: "This will permanently delete the vehicle entry!",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
    confirmButtonText: 'Yes, delete it!',
    cancelButtonText: 'Cancel'
  });

  if (result.isConfirmed) {
    try {
      await axiosInstance.delete(`/guard-entries/${entryId}`);
      
      Swal.fire(
        'Deleted!',
        'Vehicle entry has been deleted.',
        'success'
      );
      
      // Refresh the entries list
      fetchEntries();
    } catch (err) {
      console.error('Failed to delete entry', err);
      Swal.fire(
        'Error!',
        err.response?.data?.message || 'Failed to delete entry',
        'error'
      );
    }
  }
};

  return (
    <>
      <InternalNavbar />
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  📋 Vehicle Entry Records
                </h2>
                <p className="text-gray-600">
                  {canViewAllEntries() 
                    ? 'Viewing all vehicle entries' 
                    : 'Viewing your vehicle entries'
                  }
                </p>
                {canViewAllEntries() && (
                  <p className="text-sm text-blue-600 mt-1">
                    🔍 You can view all entries (Admin/Accounts access)
                  </p>
                )}
              </div>
              
              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                {/* Add Entry Button */}
                <button
                  onClick={handleAddEntry}
                  className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition flex items-center gap-2"
                >
                  <span>➕</span>
                  Add New Entry
                </button>
                
{/* Filter Controls - Improved Layout */}
<div className="space-y-4">
  {/* Date Filter Row */}
  <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
    <div className="w-full sm:w-auto">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Filter by Date
      </label>
      <input
        type="date"
        value={filterDate}
        onChange={(e) => {
          setFilterDate(e.target.value);
          setPagination(prev => ({ ...prev, currentPage: 1 }));
        }}
        className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-48"
      />
    </div>
    
    {/* Quick Action Buttons */}
    <div className="flex gap-2 mt-2 sm:mt-6">
      <button
        onClick={() => {
          setFilterDate('');
          setSearchQuery('');
          setPagination(prev => ({ ...prev, currentPage: 1 }));
        }}
        className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition whitespace-nowrap"
      >
        Clear All
      </button>
      <button
        onClick={fetchEntries}
        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition flex items-center gap-2 whitespace-nowrap"
      >
        <span>🔄</span>
        Refresh
      </button>
    </div>
  </div>

  {/* Search Row */}
  <div className="w-full">
    <label className="block text-sm font-medium text-gray-700 mb-2">
      Search Entries
    </label>
    <div className="flex flex-col sm:flex-row gap-3">
      {/* Search Input Group */}
      <div className="flex-1 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  setPagination(prev => ({ ...prev, currentPage: 1 }));
                  fetchEntries();
                }
              }}
              placeholder={`Search by ${searchType === 'supplierCustomer' ? 'supplier/customer name' : 'product name'}`}
              className="border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full pr-10"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setPagination(prev => ({ ...prev, currentPage: 1 }));
                }}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            )}
          </div>
          {searchQuery && (
            <div className="text-xs text-gray-500 mt-1 ml-1">
              Press Enter to search or click Search button
            </div>
          )}
        </div>
        
        {/* Search Type Selector */}
        <div className="w-full sm:w-48">
          <select
            value={searchType}
            onChange={(e) => setSearchType(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
          >
            <option value="supplierCustomer">Supplier/Customer Name</option>
            <option value="products">Product Name</option>
          </select>
        </div>
        
        {/* Search Button */}
        <div className="w-full sm:w-auto">
          <button
            onClick={() => {
              setPagination(prev => ({ ...prev, currentPage: 1 }));
              fetchEntries();
            }}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2 w-full"
          >
            <span>🔍</span>
            Search
          </button>
        </div>
      </div>
    </div>
    
    {/* Search Status */}
    {(searchQuery || filterDate) && (
      <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="text-sm">
            <span className="font-medium text-blue-700">Active Filters:</span>
            {searchQuery && (
              <span className="ml-2">
                <span className="text-blue-600">"{searchQuery}"</span> in {searchType === 'supplierCustomer' ? 'supplier/customer' : 'products'}
              </span>
            )}
            {searchQuery && filterDate && <span className="mx-2">•</span>}
            {filterDate && (
              <span className="text-blue-600">
                Date: {formatFilterDateForDisplay(filterDate)}
              </span>
            )}
          </div>
          <button
            onClick={() => {
              setSearchQuery('');
              setFilterDate('');
              setPagination(prev => ({ ...prev, currentPage: 1 }));
              fetchEntries();
            }}
            className="text-sm text-red-600 hover:text-red-800 font-medium whitespace-nowrap"
          >
            Clear Filters
          </button>
        </div>
      </div>
    )}
  </div>
</div>
              </div>
            </div>
          </div>

          {/* Enhanced Stats */}
          {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
            <div className="bg-white rounded-2xl shadow-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{totalEntries}</div>
              <div className="text-gray-600 text-sm">Total Entries</div>
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{uniqueVehicles}</div>
              <div className="text-gray-600 text-sm">Unique Vehicles</div>
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{totalSuppliers}</div>
              <div className="text-gray-600 text-sm">Suppliers</div>
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">{totalCustomers}</div>
              <div className="text-gray-600 text-sm">Customers</div>
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-500">{supplierEntries}</div>
              <div className="text-gray-600 text-sm">Supplier Entries</div>
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-4 text-center">
              <div className="text-2xl font-bold text-red-500">{rejectedEntries}</div>
              <div className="text-gray-600 text-sm">Rejected Entries</div>
            </div>
          </div> */}

          {/* Quick Add Button for Mobile */}
          <div className="md:hidden mb-6">
            <button
              onClick={handleAddEntry}
              className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition flex items-center justify-center gap-2"
            >
              <span>➕</span>
              Add New Vehicle Entry
            </button>
          </div>

          {/* Entries Table */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
           <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
  <div>
    <h3 className="text-lg font-semibold">Vehicle Entries</h3>
    {(searchQuery || filterDate) && (
      <div className="text-sm text-blue-600 mt-1">
        {searchQuery && `Search: "${searchQuery}"`}
        {searchQuery && filterDate && ' • '}
        {filterDate && `Date: ${formatFilterDateForDisplay(filterDate)}`}
        <button
          onClick={() => {
            setSearchQuery('');
            setFilterDate('');
            setPagination(prev => ({ ...prev, currentPage: 1 }));
            fetchEntries();
          }}
          className="ml-2 text-red-600 hover:text-red-800 text-xs"
        >
          (Clear)
        </button>
      </div>
    )}
  </div>
  <span className="bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full">
    👆 Click rows for Goods Inward (Accounts only)
  </span>
</div>
           {entries.length === 0 ? (
  <div className="text-center py-12">
    <div className="text-6xl mb-4">
      {searchQuery ? '🔍' : '🚗'}
    </div>
    <h3 className="text-xl font-semibold text-gray-700 mb-2">
      {searchQuery ? 'No matching entries found' : 'No entries found'}
    </h3>
    <p className="text-gray-500 mb-6">
      {searchQuery 
        ? `No entries found matching "${searchQuery}"`
        : filterDate 
          ? `No entries found for ${formatFilterDateForDisplay(filterDate)}` 
          : 'No vehicle entries recorded yet'
      }
    </p>
    {(searchQuery || filterDate) && (
      <button
        onClick={() => {
          setSearchQuery('');
          setFilterDate('');
          setPagination(prev => ({ ...prev, currentPage: 1 }));
          fetchEntries();
        }}
        className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition flex items-center gap-2 mx-auto mb-4"
      >
        <span>↶</span>
        Clear Search & Filters
      </button>
    )}
    <button
      onClick={handleAddEntry}
      className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition flex items-center gap-2 mx-auto"
    >
      <span>➕</span>
      Add New Entry
    </button>
  </div>
) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left text-gray-600">
                    <thead className="bg-gray-100 text-gray-700 uppercase text-xs">
                      <tr>
                        <th className="px-4 py-3">Entry No.</th>
                        <th className="px-4 py-3">Date & Time</th>
                        <th className="px-4 py-3">Type</th>
                        <th className="px-4 py-3">Vehicle Number</th>
                        <th className="px-4 py-3">Supplier/Customer</th>
                        <th className="px-4 py-3">Products</th>
                        <th className="px-4 py-3">Remarks</th>
                        <th className="px-4 py-3">Recorded By</th>
                        <th className="px-4 py-3">Photos</th>
{!user?.role?.includes('guard') && (
  <>
    <th className="px-4 py-3">Generate Gate Inward Printout</th>
    <th className="px-4 py-3">Actions</th>
  </>
)}
                     </tr>
                    </thead>
                    <tbody>
                      {entries.map((entry) => (
                        <tr key={entry._id} onClick={() => handleRowClick(entry)} className="border-b hover:bg-gray-50 transition cursor-pointer">
                          <td className="px-4 py-4">
                            <div className={`font-bold px-2 py-1 rounded text-center font-mono ${
                              entry.isRejected ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-orange-600'
                            }`}>
                              {entry.entryNumber || 'N/A'}
                              {entry.isRejected && <div className="text-xs mt-1">(Rejected)</div>}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="font-medium text-gray-900">
                              {formatDate(entry.createdAt)}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              entry.isRejected ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                            }`}>
                              {entry.isRejected ? 'Rejected' : 'Supplier'}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <span className="font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded">
                              {entry.vehicleNumber}
                            </span>
                          </td>
                       <td className="px-4 py-4">
  <div className="font-medium text-gray-900">
    {entry.isRejected 
      ? (entry.customer?.name || entry.customerName || 'N/A')
      : (entry.supplier?.name || entry.supplierName || 'N/A')
    }
  </div>
  {entry.isRejected ? (
    entry.customerName && (
      <div className="text-xs text-green-600 font-medium">📝 Manual</div>
    )
  ) : (
    entry.supplierName && (
      <div className="text-xs text-green-600 font-medium">📝 Manual</div>
    )
  )}
</td>
                          <td className="px-4 py-4">
                            <div className="flex gap-2 flex-wrap">
                              {entry.purchaseProducts && entry.purchaseProducts.length > 0 ? (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    showProducts(
                                      entry.purchaseProducts, 
                                      `${entry.entryNumber} - Products (${entry.purchaseProducts.length})`
                                    );
                                  }}
                                  className="px-3 py-1 bg-purple-600 text-white rounded text-xs hover:bg-purple-700 transition flex items-center gap-1"
                                >
                                  <span>📦</span>
                                  Products ({entry.purchaseProducts.length})
                                </button>
                              ) : (
                                <span className="text-gray-400 text-xs">No products</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex gap-2 flex-wrap">
                              {entry.remarks && entry.remarks.trim() ? (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    showRemarks(entry.remarks, `${entry.entryNumber} - Remarks`);
                                  }}
                                  className="px-3 py-1 bg-gray-600 text-white rounded text-xs hover:bg-gray-700 transition flex items-center gap-1"
                                >
                                  <span>📝</span>
                                  View Remarks
                                </button>
                              ) : (
                                <span className="text-gray-400 text-xs">No remarks</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="text-gray-700">
                              {entry.recordedBy?.name || 'N/A'}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex gap-2 flex-wrap">
                              {entry.photos.map((photo, index) => (
                                <button
                                  key={index}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    showPhoto(photo, `${entry.entryNumber} - Vehicle: ${entry.vehicleNumber} - Photo ${index + 1}`);
                                  }}
                                  className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition flex items-center gap-1"
                                >
                                  <span>📸</span>
                                  Photo {index + 1}
                                </button>
                              ))}
                            </div>
                          </td>
                        {!user?.role?.includes('guard') && (
  <>
    <td className="px-4 py-4">
      <button
        onClick={(e) => {
          e.stopPropagation();
          navigate(`/gate-inward-printout/${entry._id}`);
        }}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2 text-sm"
      >
        <span>🖨️</span>
        Print
      </button>
    </td>
    <td className="px-4 py-4">
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleDeleteEntry(entry._id);
        }}
        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2 text-sm"
      >
        <span>🗑️</span>
        Delete
      </button>
    </td>
  </>
)}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Enhanced Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row justify-between items-center mt-6 pt-6 border-t border-gray-200 gap-4">
                    <div className="text-sm text-gray-600">
                      Showing {((pagination.currentPage - 1) * pagination.limit) + 1} to{' '}
                      {Math.min(pagination.currentPage * pagination.limit, pagination.totalEntries)} of{' '}
                      {pagination.totalEntries} entries
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handlePageChange(pagination.currentPage - 1)}
                        disabled={!pagination.hasPrev}
                        className={`px-4 py-2 rounded-lg border flex items-center gap-2 ${
                          pagination.hasPrev
                            ? 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
                        }`}
                      >
                        <span>←</span>
                        Previous
                      </button>
                      
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                          const pageNum = i + 1;
                          return (
                            <button
                              key={pageNum}
                              onClick={() => handlePageChange(pageNum)}
                              className={`w-8 h-8 rounded-lg border text-sm ${
                                pagination.currentPage === pageNum
                                  ? 'bg-blue-600 text-white border-blue-600'
                                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                        {pagination.totalPages > 5 && (
                          <span className="text-gray-500 mx-1">...</span>
                        )}
                      </div>
                      
                      <button
                        onClick={() => handlePageChange(pagination.currentPage + 1)}
                        disabled={!pagination.hasNext}
                        className={`px-4 py-2 rounded-lg border flex items-center gap-2 ${
                          pagination.hasNext
                            ? 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
                        }`}
                      >
                        Next
                        <span>→</span>
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default GuardEntriesView;