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
console.log("entriess",entries);

  useEffect(() => {
    fetchEntries();
  }, [filterDate, pagination.currentPage]);

  // In GuardEntriesView.js, add this useEffect
useEffect(() => {
  const interval = setInterval(() => {
    fetchEntries();
  }, 30000); // Refresh every 30 seconds

  return () => clearInterval(interval);
}, [filterDate, pagination.currentPage]);

  const fetchEntries = async () => {
    try {
      setLoading(true);
      let url = `/guard-entries?page=${pagination.currentPage}&limit=${pagination.limit}`;
      if (filterDate) {
        url += `&date=${filterDate}`;
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
                
                {/* Filter Controls */}
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                  <div>
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
                      className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <button
                    onClick={() => {
                      setFilterDate('');
                      setPagination(prev => ({ ...prev, currentPage: 1 }));
                    }}
                    className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition mt-6 sm:mt-0"
                  >
                    Clear Filter
                  </button>
                  <button
                    onClick={fetchEntries}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition mt-2 sm:mt-0"
                  >
                    Refresh
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
              <div className="text-2xl font-bold text-blue-600">{pagination.totalEntries}</div>
              <div className="text-gray-600">Total Entries</div>
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
              <div className="text-2xl font-bold text-green-600">
                {new Set(entries.map(entry => entry.vehicleNumber)).size}
              </div>
              <div className="text-gray-600">Unique Vehicles</div>
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
              <div className="text-2xl font-bold text-purple-600">
                {new Set(entries.map(entry => entry.supplier?._id)).size}
              </div>
              <div className="text-gray-600">Suppliers</div>
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
              <div className="text-2xl font-bold text-orange-600">
                {entries.length > 0 ? entries[0].entryNumber : 'TPGI1'}
              </div>
              <div className="text-gray-600">Latest Entry</div>
            </div>
          </div>

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
            {entries.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🚗</div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  No entries found
                </h3>
                <p className="text-gray-500 mb-6">
                  {filterDate 
                    ? `No entries found for ${formatFilterDateForDisplay(filterDate)}` 
                    : 'No vehicle entries recorded yet'
                  }
                </p>
                <button
                  onClick={handleAddEntry}
                  className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition flex items-center gap-2 mx-auto"
                >
                  <span>➕</span>
                  Add Your First Entry
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
                            <th className="px-4 py-3">Recorded By</th>
                        <th className="px-4 py-3">Vehicle Number</th>
                        <th className="px-4 py-3">Supplier</th>
                        <th className="px-4 py-3">Recorded By</th>
                        <th className="px-4 py-3">Photos</th>
                      </tr>
                    </thead>
                    <tbody>
                      {entries.map((entry) => (
                        <tr key={entry._id} onClick={() => handleRowClick(entry)} className="border-b hover:bg-gray-50 transition">
                          <td className="px-4 py-4">
                            <div className="font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded text-center font-mono">
                              {entry.entryNumber || 'N/A'}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="font-medium text-gray-900">
                              {formatDate(entry.createdAt)}
                            </div>
                          </td>
                          <td className="px-4 py-4">
  <div className="text-gray-700">
    {entry.recordedBy?.name || 'N/A'}
  </div>
</td>
                          <td className="px-4 py-4">
                            <span className="font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded">
                              {entry.vehicleNumber}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <div className="font-medium text-gray-900">
                              {entry.supplier?.name || 'N/A'}
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
          e.stopPropagation(); // This prevents the click from bubbling up to the row
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
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row justify-between items-center mt-6 pt-6 border-t border-gray-200 gap-4">
                    <div className="text-sm text-gray-600">
                      Showing {((pagination.currentPage - 1) * pagination.limit) + 1} to{' '}
                      {Math.min(pagination.currentPage * pagination.limit, pagination.totalEntries)} of{' '}
                      {pagination.totalEntries} entries
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => handlePageChange(pagination.currentPage - 1)}
                        disabled={!pagination.hasPrev}
                        className={`px-4 py-2 rounded-lg border ${
                          pagination.hasPrev
                            ? 'bg-white text-gray-700 hover:bg-gray-50'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        Previous
                      </button>
                      
                      <span className="px-4 py-2 text-gray-700">
                        Page {pagination.currentPage} of {pagination.totalPages}
                      </span>
                      
                      <button
                        onClick={() => handlePageChange(pagination.currentPage + 1)}
                        disabled={!pagination.hasNext}
                        className={`px-4 py-2 rounded-lg border ${
                          pagination.hasNext
                            ? 'bg-white text-gray-700 hover:bg-gray-50'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        Next
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