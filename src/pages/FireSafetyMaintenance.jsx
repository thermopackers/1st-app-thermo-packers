// pages/FireSafetyMaintenance.jsx
import { useState, useEffect } from "react";
import axiosInstance from "../axiosInstance";
import InternalNavbar from "../components/InternalNavbar";
import Swal from "sweetalert2";

export default function FireSafetyMaintenance() {
  const [activeTab, setActiveTab] = useState('water-hydrant');
  
  return (
    <div className="min-h-screen bg-slate-100">
      <InternalNavbar />
      <div className="max-w-7xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-center text-red-700 mb-8">
          Fire Safety Maintenance System
        </h1>

        {/* Tab Selection */}
        <div className="bg-white shadow-lg rounded-lg p-6 mb-8">
          <div className="flex justify-center gap-4">
            <button
              onClick={() => setActiveTab('water-hydrant')}
              className={`px-8 py-3 rounded-lg transition text-lg font-semibold ${
                activeTab === 'water-hydrant' 
                  ? 'bg-blue-600 text-white shadow-lg' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Water Fire Hydrant System Daily Check Report
            </button>
            <button
              onClick={() => setActiveTab('fire-extinguisher')}
              className={`px-8 py-3 rounded-lg transition text-lg font-semibold ${
                activeTab === 'fire-extinguisher' 
                  ? 'bg-red-600 text-white shadow-lg' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Fire Extinguisher Weekly Check Report
            </button>
          </div>
        </div>

        {/* Render Active Component */}
        <div className="bg-white shadow-lg rounded-lg p-6">
          {activeTab === 'water-hydrant' ? (
            <WaterHydrantDailyReport />
          ) : (
            <FireExtinguisherWeeklyReport />
          )}
        </div>
      </div>
    </div>
  );
}

// Helper function to convert yyyy-mm-dd to dd/mm/yyyy
const convertToDDMMYYYY = (dateString) => {
  if (!dateString) return "";
  if (dateString.includes('/')) return dateString; // Already in dd/mm/yyyy format
  
  try {
    const [year, month, day] = dateString.split('-');
    return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
  } catch (error) {
    return dateString;
  }
};

// Helper function to convert dd/mm/yyyy to yyyy-mm-dd for date input
const convertToYYYYMMDD = (dateString) => {
  if (!dateString) return "";
  if (dateString.includes('-')) return dateString; // Already in yyyy-mm-dd format
  
  try {
    const [day, month, year] = dateString.split('/');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  } catch (error) {
    return dateString;
  }
};

// Helper function to get today's date in dd/mm/yyyy format
const getTodayDate = () => {
  const today = new Date();
  const day = String(today.getDate()).padStart(2, '0');
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const year = today.getFullYear();
  return `${day}/${month}/${year}`;
};

// Helper function to get today's date in yyyy-mm-dd format for date input
const getTodayDateInput = () => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

// Helper function to validate date (not future)
const isValidDate = (dateString) => {
  if (!dateString) return false;
  
  try {
    // Handle both dd/mm/yyyy and yyyy-mm-dd formats
    let day, month, year;
    
    if (dateString.includes('/')) {
      [day, month, year] = dateString.split('/').map(Number);
    } else if (dateString.includes('-')) {
      [year, month, day] = dateString.split('-').map(Number);
    } else {
      return false;
    }
    
    const selectedDate = new Date(year, month - 1, day);
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today
    
    return selectedDate <= today;
  } catch (error) {
    return false;
  }
};

// Water Hydrant Daily Report Component - UPDATED WITH ADD BUTTON
function WaterHydrantDailyReport() {
  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    totalRecords: 0
  });
  const [filterDate, setFilterDate] = useState("");
  const [filterDateInput, setFilterDateInput] = useState(""); // For input field
  const [newEntryDate, setNewEntryDate] = useState(""); // For adding new entries
  
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editFiles, setEditFiles] = useState({ waterSystem1: [], waterSystem2: [], waterSystem3: [] });
  const [existingFiles, setExistingFiles] = useState({ waterSystem1: [], waterSystem2: [], waterSystem3: [] });
  const [deletingFiles, setDeletingFiles] = useState({ waterSystem1: [], waterSystem2: [], waterSystem3: [] });

  // Fetch logs with pagination
  const fetchLogs = async (pageNum = 1, dateFilter = "") => {
    try {
      setLoading(true);
      let url = `/fire-safety/water-hydrant?page=${pageNum}&limit=10`;
      if (dateFilter) {
        url += `&date=${encodeURIComponent(dateFilter)}`;
      }
      
      const res = await axiosInstance.get(url);
      setLogs(res.data.logs);
      setPagination({
        page: res.data.currentPage,
        totalPages: res.data.totalPages,
        totalRecords: res.data.totalRecords
      });
    } catch (err) {
      console.error("Error fetching logs:", err);
      Swal.fire("Error", "Failed to fetch daily checks", "error");
    } finally {
      setLoading(false);
    }
  };

  // Initialize with today's data
  useEffect(() => {
    fetchLogs(1);
  }, []);

  // Add new entry button handler
  const handleAddNewEntry = () => {
    // Check if we already have an unsaved entry for the selected date
    if (tableData.length > 0) {
      Swal.fire("Info", "You already have an unsaved entry. Please save or cancel it first.", "info");
      return;
    }

    // Use today's date by default, or selected date if any
    const selectedDate = newEntryDate ? convertToDDMMYYYY(newEntryDate) : getTodayDate();
    
    // Check if entry already exists for this date
    const existingEntry = logs.find(log => log.date === selectedDate);
    if (existingEntry) {
      Swal.fire("Info", `An entry already exists for ${selectedDate}. Please edit the existing entry.`, "info");
      return;
    }

    const newEntry = {
      id: Math.random().toString(36).substr(2, 9),
      date: selectedDate,
      waterSystem1: { status: "No", files: [] },
      waterSystem2: { status: "No", files: [] },
      waterSystem3: { status: "No", files: [] },
      remarks: ""
    };
    
    setTableData([newEntry]);
    setNewEntryDate(""); // Clear the date input after adding
  };

  // Handle input changes
  const handleInputChange = (id, field, value) => {
    setTableData(prev => 
      prev.map(row => 
        row.id === id ? { ...row, [field]: value } : row
      )
    );
  };

  const handleSystemStatusChange = (id, systemNumber, status) => {
    setTableData(prev => 
      prev.map(row => {
        if (row.id === id) {
          const updatedSystem = { ...row[`waterSystem${systemNumber}`], status };
          return { ...row, [`waterSystem${systemNumber}`]: updatedSystem };
        }
        return row;
      })
    );
  };

  const handleFileUpload = (id, systemNumber, files) => {
    setTableData(prev =>
      prev.map(row => {
        if (row.id === id) {
          const updatedSystem = { 
            ...row[`waterSystem${systemNumber}`], 
            files: Array.from(files) 
          };
          return { ...row, [`waterSystem${systemNumber}`]: updatedSystem };
        }
        return row;
      })
    );
  };

  // Function to open file in modal
  const openFileModal = (url) => {
    const isImage = url.match(/\.(jpeg|jpg|gif|png|webp)$/i);
    const isPDF = url.match(/\.pdf$/i);
    
    if (isImage) {
      Swal.fire({ 
        imageUrl: url, 
        imageAlt: 'Uploaded Image',
        showCloseButton: true, 
        showConfirmButton: false,
        width: '80%',
        padding: '2rem',
        background: '#f8fafc'
      });
    } else if (isPDF) {
      Swal.fire({
        html: `<iframe src="${url}" width="100%" height="500px" style="border: none;"></iframe>`,
        width: "80%",
        showCloseButton: true,
        showConfirmButton: false,
        padding: '2rem',
        background: '#f8fafc'
      });
    } else {
      window.open(url, "_blank");
    }
  };

  // Function to delete existing file when editing
  const deleteExistingFile = async (fileUrl, systemNumber) => {
    try {
      const result = await Swal.fire({
        title: 'Are you sure?',
        text: "This file will be deleted when you save changes!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Yes, delete it!'
      });

      if (result.isConfirmed) {
        // Remove from existing files
        setExistingFiles(prev => ({
          ...prev,
          [systemNumber]: prev[systemNumber].filter(file => file !== fileUrl)
        }));
        
        // Add to deleting files
        setDeletingFiles(prev => ({
          ...prev,
          [systemNumber]: [...prev[systemNumber], fileUrl]
        }));

        Swal.fire('Marked for deletion!', 'File will be removed when you save changes.', 'success');
      }
    } catch (err) {
      console.error('Error in delete process:', err);
      Swal.fire('Error', 'Failed to mark file for deletion', 'error');
    }
  };

  // Function to remove new file when editing
  const removeNewFile = (systemNumber, index) => {
    setEditFiles(prev => ({
      ...prev,
      [systemNumber]: prev[systemNumber].filter((_, i) => i !== index)
    }));
  };

  const submitData = async () => {
    try {
      setLoading(true);
      
      for (const row of tableData) {
        // Upload files for each system
        const uploadedFiles = {};
        
        for (let i = 1; i <= 3; i++) {
          const systemKey = `waterSystem${i}`;
          if (row[systemKey].files && row[systemKey].files.length > 0) {
            const fd = new FormData();
            row[systemKey].files.forEach((file) => fd.append("files", file));
            const uploadRes = await axiosInstance.post("/fire-safety/upload", fd, {
              headers: { "Content-Type": "multipart/form-data" },
            });
            uploadedFiles[systemKey] = uploadRes.data.urls;
          } else {
            uploadedFiles[systemKey] = [];
          }
        }

        // Submit data - Date is already in dd/mm/yyyy format
        await axiosInstance.post("/fire-safety/water-hydrant", {
          date: row.date,
          waterSystem1: {
            status: row.waterSystem1.status,
            files: uploadedFiles.waterSystem1 || []
          },
          waterSystem2: {
            status: row.waterSystem2.status,
            files: uploadedFiles.waterSystem2 || []
          },
          waterSystem3: {
            status: row.waterSystem3.status,
            files: uploadedFiles.waterSystem3 || []
          },
          remarks: row.remarks
        });
      }

      Swal.fire("Success!", "Water hydrant check report saved successfully", "success");
      
      // Clear table data and refresh logs
      setTableData([]);
      fetchLogs(1, filterDate);

    } catch (err) {
      console.error("Error saving data:", err);
      if (err.response?.data?.message?.includes("already exists")) {
        Swal.fire("Error", "A report already exists for this date. Please edit the existing report.", "error");
      } else {
        Swal.fire("Error", "Error saving report", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  // Cancel new entry
  const cancelNewEntry = () => {
    setTableData([]);
    setNewEntryDate("");
  };

  // Start editing
  const startEditing = (entry) => {
    setEditingId(entry._id);
    setEditForm({
      date: entry.date,
      waterSystem1: entry.waterSystem1 || { status: "No", files: [] },
      waterSystem2: entry.waterSystem2 || { status: "No", files: [] },
      waterSystem3: entry.waterSystem3 || { status: "No", files: [] },
      remarks: entry.remarks
    });
    setExistingFiles({
      waterSystem1: entry.waterSystem1?.files || [],
      waterSystem2: entry.waterSystem2?.files || [],
      waterSystem3: entry.waterSystem3?.files || []
    });
    setEditFiles({ waterSystem1: [], waterSystem2: [], waterSystem3: [] });
    setDeletingFiles({ waterSystem1: [], waterSystem2: [], waterSystem3: [] });
  };

  // Save edit
  const saveEdit = async (id) => {
    try {
      setLoading(true);
      
      // First, delete files marked for deletion
      const deletePromises = [];
      for (let i = 1; i <= 3; i++) {
        const systemKey = `waterSystem${i}`;
        if (deletingFiles[systemKey] && deletingFiles[systemKey].length > 0) {
          deletePromises.push(
            ...deletingFiles[systemKey].map(fileUrl => 
              axiosInstance.delete('/fire-safety/file', { data: { fileUrl } })
            )
          );
        }
      }
      
      if (deletePromises.length > 0) {
        await Promise.all(deletePromises);
      }

      const updatedData = { 
        ...editForm,
        waterSystem1: {
          ...editForm.waterSystem1,
          files: existingFiles.waterSystem1
        },
        waterSystem2: {
          ...editForm.waterSystem2,
          files: existingFiles.waterSystem2
        },
        waterSystem3: {
          ...editForm.waterSystem3,
          files: existingFiles.waterSystem3
        }
      };
      
      // Upload new files for each system
      for (let i = 1; i <= 3; i++) {
        const systemKey = `waterSystem${i}`;
        if (editFiles[systemKey] && editFiles[systemKey].length > 0) {
          const fd = new FormData();
          editFiles[systemKey].forEach((file) => fd.append("files", file));
          const uploadRes = await axiosInstance.post("/fire-safety/upload", fd, {
            headers: { "Content-Type": "multipart/form-data" },
          });
          updatedData[systemKey].files = [...updatedData[systemKey].files, ...uploadRes.data.urls];
        }
      }

      await axiosInstance.put(`/fire-safety/water-hydrant/${id}`, updatedData);
      
      setEditingId(null);
      setEditForm({});
      setEditFiles({ waterSystem1: [], waterSystem2: [], waterSystem3: [] });
      setExistingFiles({ waterSystem1: [], waterSystem2: [], waterSystem3: [] });
      setDeletingFiles({ waterSystem1: [], waterSystem2: [], waterSystem3: [] });
      
      // Refresh data
      fetchLogs(pagination.page, filterDate);
      
      Swal.fire("Updated!", "Report updated successfully", "success");
    } catch (err) {
      console.error("Error updating report:", err);
      Swal.fire("Error", "Failed to update report", "error");
    } finally {
      setLoading(false);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
    setEditFiles({ waterSystem1: [], waterSystem2: [], waterSystem3: [] });
    setExistingFiles({ waterSystem1: [], waterSystem2: [], waterSystem3: [] });
    setDeletingFiles({ waterSystem1: [], waterSystem2: [], waterSystem3: [] });
  };

  // Date filter handler
  const handleDateFilter = (e) => {
    const value = e.target.value;
    setFilterDateInput(value);
    
    if (value) {
      const formattedDate = convertToDDMMYYYY(value);
      setFilterDate(formattedDate);
      fetchLogs(1, formattedDate);
    } else {
      setFilterDate("");
      fetchLogs(1);
    }
  };

  // Clear filter
  const clearFilter = () => {
    setFilterDate("");
    setFilterDateInput("");
    fetchLogs(1);
  };

  // Pagination handlers
  const handlePageChange = (newPage) => {
    fetchLogs(newPage, filterDate);
  };

  const handleFirstPage = () => {
    handlePageChange(1);
  };

  const handlePrevPage = () => {
    if (pagination.page > 1) {
      handlePageChange(pagination.page - 1);
    }
  };

  const handleNextPage = () => {
    if (pagination.page < pagination.totalPages) {
      handlePageChange(pagination.page + 1);
    }
  };

  const handleLastPage = () => {
    handlePageChange(pagination.totalPages);
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-center text-blue-700">
        Water Fire Hydrant System Daily Check Report
      </h2>

      {/* Filters and Controls */}
      <div className="mb-6 bg-gray-50 p-4 rounded-lg">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="flex items-center gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Filter by Date:
              </label>
              <input
                type="date"
                value={filterDateInput}
                onChange={handleDateFilter}
                className="border rounded p-2"
                max={getTodayDateInput()}
              />
            </div>
            {filterDate && (
              <button
                onClick={clearFilter}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors text-sm mt-6"
              >
                Clear Filter
              </button>
            )}
          </div>
          
          <div className="text-sm text-gray-700">
            <div className="font-semibold">
              Today's Date: {getTodayDate()}
            </div>
            <div className="text-gray-500">
              Daily check report for water fire hydrant systems
            </div>
          </div>
        </div>
      </div>

      {/* Add New Entry Section */}
      <div className="mb-6 bg-blue-50 p-4 rounded-lg border border-blue-200">
        <h3 className="text-lg font-semibold mb-4">Add New Daily Check Entry</h3>
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Date for New Entry (Can be past or present date):
            </label>
            <div className="flex gap-2">
              <input
                type="date"
                value={newEntryDate}
                onChange={(e) => setNewEntryDate(e.target.value)}
                className="border rounded p-2 flex-1"
                max={getTodayDateInput()}
              />
              <button
                onClick={handleAddNewEntry}
                disabled={loading || tableData.length > 0}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                Add New Entry
              </button>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {newEntryDate 
                ? `Selected: ${convertToDDMMYYYY(newEntryDate)}` 
                : "Leave empty to use today's date"}
            </div>
          </div>
        </div>
      </div>

      {/* Table for New Entry */}
      {tableData.length > 0 && (
        <div className="mb-8 border rounded-lg p-4 bg-green-50 border-green-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">New Daily Check Entry</h3>
            <div className="flex gap-2">
              <button
                onClick={submitData}
                disabled={loading}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors text-sm"
              >
                {loading ? "Saving..." : "Save Entry"}
              </button>
              <button
                onClick={cancelNewEntry}
                disabled={loading}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
          <table className="min-w-full border border-slate-300 text-sm">
            <thead className="bg-green-600 text-white">
              <tr>
                <th className="border px-3 py-2">Date</th>
                <th className="border px-3 py-2">Water System 1</th>
                <th className="border px-3 py-2">Water System 2</th>
                <th className="border px-3 py-2">Water System 3</th>
                <th className="border px-3 py-2">Remarks</th>
              </tr>
            </thead>
            <tbody>
              {tableData.map((row) => (
                <tr key={row.id} className="bg-white">
                  <td className="border px-3 py-2 font-semibold">{row.date}</td>
                  
                  {/* Water System 1 */}
                  <td className="border px-3 py-2">
                    <span className="text-xs">Water Coming</span>
                    <select
                      value={row.waterSystem1.status}
                      onChange={(e) => handleSystemStatusChange(row.id, 1, e.target.value)}
                      className="w-full border rounded p-1 mb-2"
                    >
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => handleFileUpload(row.id, 1, e.target.files)}
                      className="w-full text-sm border rounded p-1"
                      multiple
                    />
                    {row.waterSystem1.files && row.waterSystem1.files.length > 0 && (
                      <div className="text-xs text-blue-600 mt-1">
                        {row.waterSystem1.files.length} file(s) selected
                      </div>
                    )}
                  </td>
                  
                  {/* Water System 2 */}
                  <td className="border px-3 py-2">
                    <span className="text-xs">Water Coming</span>
                    <select
                      value={row.waterSystem2.status}
                      onChange={(e) => handleSystemStatusChange(row.id, 2, e.target.value)}
                      className="w-full border rounded p-1 mb-2"
                    >
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => handleFileUpload(row.id, 2, e.target.files)}
                      className="w-full text-sm border rounded p-1"
                      multiple
                    />
                    {row.waterSystem2.files && row.waterSystem2.files.length > 0 && (
                      <div className="text-xs text-blue-600 mt-1">
                        {row.waterSystem2.files.length} file(s) selected
                      </div>
                    )}
                  </td>
                  
                  {/* Water System 3 */}
                  <td className="border px-3 py-2">
                    <span className="text-xs">Water Coming</span>
                    <select
                      value={row.waterSystem3.status}
                      onChange={(e) => handleSystemStatusChange(row.id, 3, e.target.value)}
                      className="w-full border rounded p-1 mb-2"
                    >
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => handleFileUpload(row.id, 3, e.target.files)}
                      className="w-full text-sm border rounded p-1"
                      multiple
                    />
                    {row.waterSystem3.files && row.waterSystem3.files.length > 0 && (
                      <div className="text-xs text-blue-600 mt-1">
                        {row.waterSystem3.files.length} file(s) selected
                      </div>
                    )}
                  </td>
                  
                  <td className="border px-3 py-2">
                    <textarea
                      value={row.remarks}
                      onChange={(e) => handleInputChange(row.id, 'remarks', e.target.value)}
                      className="w-full border rounded p-1"
                      rows={3}
                      placeholder="Remarks..."
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {/* Saved Reports Table */}
      <div className="mt-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Saved Daily Check Reports</h3>
          <div className="text-sm text-gray-700">
            Total: {pagination.totalRecords} records
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full border border-slate-300 text-sm">
            <thead className="bg-blue-600 text-white">
              <tr>
                <th className="border px-3 py-2">Date (dd/mm/yyyy)</th>
                <th className="border px-3 py-2">Water System 1</th>
                <th className="border px-3 py-2">Water System 2</th>
                <th className="border px-3 py-2">Water System 3</th>
                <th className="border px-3 py-2">Remarks</th>
                <th className="border px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="border px-3 py-8 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="border px-3 py-8 text-center text-gray-500">
                    {filterDate ? "No reports found for selected date" : "No daily check reports found. Add a new entry using the form above."}
                  </td>
                </tr>
              ) : (
                logs.map((entry) => {
                  const isEditing = editingId === entry._id;
                  
                  return (
                    <tr key={entry._id} className="hover:bg-gray-50">
                      <td className="border px-3 py-2 font-semibold">
                        {entry.date}
                      </td>
                      
                      {/* Water System 1 - Editing Mode */}
                      <td className="border px-3 py-2">
                                                    <span className="text-xs">Water Coming</span>
                        {isEditing ? (
                          <div>
                            <select
                              value={editForm.waterSystem1?.status || "No"}
                              onChange={(e) => setEditForm({
                                ...editForm,
                                waterSystem1: { 
                                  ...editForm.waterSystem1, 
                                  status: e.target.value 
                                }
                              })}
                              className="w-full border rounded p-1 mb-2"
                            >
                              <option value="Yes">Yes</option>
                              <option value="No">No</option>
                            </select>
                            
                            {/* Existing Files with delete option */}
                            <div className="mb-2">
                              <div className="text-xs text-gray-600 mb-1">Existing Files:</div>
                              <div className="flex flex-wrap gap-1">
                                {existingFiles.waterSystem1?.map((url, index) => (
                                  <div key={`existing-1-${index}`} className="relative group">
                                    <button
                                      type="button"
                                      onClick={() => openFileModal(url)}
                                      className="border rounded p-1 hover:bg-gray-100 transition text-xs flex items-center gap-1"
                                    >
                                      {url.match(/\.(jpeg|jpg|gif|png|webp)$/i) ? (
                                        <>
                                          <span>🖼️</span>
                                          <span>Image {index + 1}</span>
                                        </>
                                      ) : (
                                        <>
                                          <span>📄</span>
                                          <span>File {index + 1}</span>
                                        </>
                                      )}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => deleteExistingFile(url, 'waterSystem1')}
                                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                      title="Delete file"
                                    >
                                      ×
                                    </button>
                                  </div>
                                ))}
                                {(!existingFiles.waterSystem1 || existingFiles.waterSystem1.length === 0) && (
                                  <span className="text-gray-400 text-xs">No files</span>
                                )}
                              </div>
                            </div>
                            
                            {/* Add New Files */}
                            <div>
                              <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 rounded p-2 text-xs transition inline-block mb-1">
                                📁 Add New Files
                                <input
                                  type="file"
                                  multiple
                                  accept="image/*,.pdf"
                                  onChange={(e) => setEditFiles({
                                    ...editFiles,
                                    waterSystem1: Array.from(e.target.files)
                                  })}
                                  className="hidden"
                                />
                              </label>
                              {editFiles.waterSystem1 && editFiles.waterSystem1.length > 0 && (
                                <div className="text-xs text-blue-600">
                                  {editFiles.waterSystem1.length} new file(s) selected
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {editFiles.waterSystem1.map((file, index) => (
                                      <div key={`new-1-${index}`} className="relative group">
                                        <span className="border rounded p-1 text-xs bg-blue-50">
                                          {file.name}
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() => removeNewFile('waterSystem1', index)}
                                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center"
                                          title="Remove file"
                                        >
                                          ×
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          /* View Mode */
                          <div>
                            <div className="mb-1">
                              Status: <span className={`font-semibold ${entry.waterSystem1?.status === 'Yes' ? 'text-green-600' : 'text-red-600'}`}>
                                {entry.waterSystem1?.status || 'No'}
                              </span>
                            </div>
                            {entry.waterSystem1?.files && entry.waterSystem1.files.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {entry.waterSystem1.files.map((url, index) => (
                                  <button
                                    key={`view-1-${index}`}
                                    type="button"
                                    onClick={() => openFileModal(url)}
                                    className="border rounded p-1 hover:bg-gray-100 transition text-xs flex items-center gap-1"
                                  >
                                    {url.match(/\.(jpeg|jpg|gif|png|webp)$/i) ? (
                                      <>
                                        <span>🖼️</span>
                                        <span>View</span>
                                      </>
                                    ) : (
                                      <>
                                        <span>📄</span>
                                        <span>View</span>
                                      </>
                                    )}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                      
                      {/* Water System 2 - Similar structure */}
                      <td className="border px-3 py-2">
                        {isEditing ? (
                          <div>
                            <span className="text-xs">Water Coming</span>
                            <select
                              value={editForm.waterSystem2?.status || "No"}
                              onChange={(e) => setEditForm({
                                ...editForm,
                                waterSystem2: { 
                                  ...editForm.waterSystem2, 
                                  status: e.target.value 
                                }
                              })}
                              className="w-full border rounded p-1 mb-2"
                            >
                              <option value="Yes">Yes</option>
                              <option value="No">No</option>
                            </select>
                            
                            <div className="mb-2">
                              <div className="text-xs text-gray-600 mb-1">Existing Files:</div>
                              <div className="flex flex-wrap gap-1">
                                {existingFiles.waterSystem2?.map((url, index) => (
                                  <div key={`existing-2-${index}`} className="relative group">
                                    <button
                                      type="button"
                                      onClick={() => openFileModal(url)}
                                      className="border rounded p-1 hover:bg-gray-100 transition text-xs flex items-center gap-1"
                                    >
                                      {url.match(/\.(jpeg|jpg|gif|png|webp)$/i) ? (
                                        <>
                                          <span>🖼️</span>
                                          <span>Image {index + 1}</span>
                                        </>
                                      ) : (
                                        <>
                                          <span>📄</span>
                                          <span>File {index + 1}</span>
                                        </>
                                      )}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => deleteExistingFile(url, 'waterSystem2')}
                                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                      title="Delete file"
                                    >
                                      ×
                                    </button>
                                  </div>
                                ))}
                                {(!existingFiles.waterSystem2 || existingFiles.waterSystem2.length === 0) && (
                                  <span className="text-gray-400 text-xs">No files</span>
                                )}
                              </div>
                            </div>
                            
                            <div>
                              <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 rounded p-2 text-xs transition inline-block mb-1">
                                📁 Add New Files
                                <input
                                  type="file"
                                  multiple
                                  accept="image/*,.pdf"
                                  onChange={(e) => setEditFiles({
                                    ...editFiles,
                                    waterSystem2: Array.from(e.target.files)
                                  })}
                                  className="hidden"
                                />
                              </label>
                              {editFiles.waterSystem2 && editFiles.waterSystem2.length > 0 && (
                                <div className="text-xs text-blue-600">
                                  {editFiles.waterSystem2.length} new file(s) selected
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {editFiles.waterSystem2.map((file, index) => (
                                      <div key={`new-2-${index}`} className="relative group">
                                        <span className="border rounded p-1 text-xs bg-blue-50">
                                          {file.name}
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() => removeNewFile('waterSystem2', index)}
                                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center"
                                          title="Remove file"
                                        >
                                          ×
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="mb-1">
                              Status: <span className={`font-semibold ${entry.waterSystem2?.status === 'Yes' ? 'text-green-600' : 'text-red-600'}`}>
                                {entry.waterSystem2?.status || 'No'}
                              </span>
                            </div>
                            {entry.waterSystem2?.files && entry.waterSystem2.files.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {entry.waterSystem2.files.map((url, index) => (
                                  <button
                                    key={`view-2-${index}`}
                                    type="button"
                                    onClick={() => openFileModal(url)}
                                    className="border rounded p-1 hover:bg-gray-100 transition text-xs flex items-center gap-1"
                                  >
                                    {url.match(/\.(jpeg|jpg|gif|png|webp)$/i) ? (
                                      <>
                                        <span>🖼️</span>
                                        <span>View</span>
                                      </>
                                    ) : (
                                      <>
                                        <span>📄</span>
                                        <span>View</span>
                                      </>
                                    )}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                      
                      {/* Water System 3 - Similar structure */}
                      <td className="border px-3 py-2">
                                                    <span className="text-xs">Water Coming</span>
                        {isEditing ? (
                          <div>
                            <select
                              value={editForm.waterSystem3?.status || "No"}
                              onChange={(e) => setEditForm({
                                ...editForm,
                                waterSystem3: { 
                                  ...editForm.waterSystem3, 
                                  status: e.target.value 
                                }
                              })}
                              className="w-full border rounded p-1 mb-2"
                            >
                              <option value="Yes">Yes</option>
                              <option value="No">No</option>
                            </select>
                            
                            <div className="mb-2">
                              <div className="text-xs text-gray-600 mb-1">Existing Files:</div>
                              <div className="flex flex-wrap gap-1">
                                {existingFiles.waterSystem3?.map((url, index) => (
                                  <div key={`existing-3-${index}`} className="relative group">
                                    <button
                                      type="button"
                                      onClick={() => openFileModal(url)}
                                      className="border rounded p-1 hover:bg-gray-100 transition text-xs flex items-center gap-1"
                                    >
                                      {url.match(/\.(jpeg|jpg|gif|png|webp)$/i) ? (
                                        <>
                                          <span>🖼️</span>
                                          <span>Image {index + 1}</span>
                                        </>
                                      ) : (
                                        <>
                                          <span>📄</span>
                                          <span>File {index + 1}</span>
                                        </>
                                      )}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => deleteExistingFile(url, 'waterSystem3')}
                                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                      title="Delete file"
                                    >
                                      ×
                                    </button>
                                  </div>
                                ))}
                                {(!existingFiles.waterSystem3 || existingFiles.waterSystem3.length === 0) && (
                                  <span className="text-gray-400 text-xs">No files</span>
                                )}
                              </div>
                            </div>
                            
                            <div>
                              <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 rounded p-2 text-xs transition inline-block mb-1">
                                📁 Add New Files
                                <input
                                  type="file"
                                  multiple
                                  accept="image/*,.pdf"
                                  onChange={(e) => setEditFiles({
                                    ...editFiles,
                                    waterSystem3: Array.from(e.target.files)
                                  })}
                                  className="hidden"
                                />
                              </label>
                              {editFiles.waterSystem3 && editFiles.waterSystem3.length > 0 && (
                                <div className="text-xs text-blue-600">
                                  {editFiles.waterSystem3.length} new file(s) selected
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {editFiles.waterSystem3.map((file, index) => (
                                      <div key={`new-3-${index}`} className="relative group">
                                        <span className="border rounded p-1 text-xs bg-blue-50">
                                          {file.name}
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() => removeNewFile('waterSystem3', index)}
                                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center"
                                          title="Remove file"
                                        >
                                          ×
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="mb-1">
                              Status: <span className={`font-semibold ${entry.waterSystem3?.status === 'Yes' ? 'text-green-600' : 'text-red-600'}`}>
                                {entry.waterSystem3?.status || 'No'}
                              </span>
                            </div>
                            {entry.waterSystem3?.files && entry.waterSystem3.files.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {entry.waterSystem3.files.map((url, index) => (
                                  <button
                                    key={`view-3-${index}`}
                                    type="button"
                                    onClick={() => openFileModal(url)}
                                    className="border rounded p-1 hover:bg-gray-100 transition text-xs flex items-center gap-1"
                                  >
                                    {url.match(/\.(jpeg|jpg|gif|png|webp)$/i) ? (
                                      <>
                                        <span>🖼️</span>
                                        <span>View</span>
                                      </>
                                    ) : (
                                      <>
                                        <span>📄</span>
                                        <span>View</span>
                                      </>
                                    )}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                      
                      <td className="border px-3 py-2">
                        {isEditing ? (
                          <textarea
                            value={editForm.remarks || ''}
                            onChange={(e) => setEditForm({ ...editForm, remarks: e.target.value })}
                            className="w-full border rounded p-1"
                            rows={3}
                          />
                        ) : (
                          entry.remarks || '-'
                        )}
                      </td>
                      
                      <td className="border px-3 py-2">
                        {isEditing ? (
                          <div className="flex flex-col gap-2">
                            <button
                              onClick={() => saveEdit(entry._id)}
                              disabled={loading}
                              className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition-colors text-sm"
                            >
                              {loading ? "Saving..." : "Save"}
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600 transition-colors text-sm"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => startEditing(entry)}
                            className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600 transition-colors text-sm w-full"
                          >
                            Edit
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {pagination.totalPages > 1 && (
          <div className="flex justify-between items-center mt-4 px-4 py-3 bg-white border-t border-gray-200 rounded-b-lg">
            <div className="text-sm text-gray-700">
              Showing page {pagination.page} of {pagination.totalPages} 
              ({pagination.totalRecords} total records)
            </div>
            
            <div className="flex items-center space-x-1">
              <button
                onClick={handleFirstPage}
                disabled={pagination.page === 1}
                className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                First
              </button>
              
              <button
                onClick={handlePrevPage}
                disabled={pagination.page === 1}
                className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              <span className="px-3 py-1 text-sm bg-blue-500 text-white rounded">
                {pagination.page}
              </span>
              
              <button
                onClick={handleNextPage}
                disabled={pagination.page === pagination.totalPages}
                className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
              
              <button
                onClick={handleLastPage}
                disabled={pagination.page === pagination.totalPages}
                className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Last
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Fire Extinguisher Weekly Report Component
function FireExtinguisherWeeklyReport() {
  const [fireExtinguishers, setFireExtinguishers] = useState(
    Array.from({ length: 21 }, (_, i) => ({
      id: Math.random().toString(36).substr(2, 9),
      code: `FE${i + 1}`,
      type: "ABC",
      weight: "6",
      pressureGauge: "green",
      exactPressure: "",
      weightKg: "",
      remarks: ""
    }))
  );
  
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState("");
  const [dateInput, setDateInput] = useState(""); // For input field
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    totalRecords: 0
  });
  
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ date: "", extinguishers: [] });

  // Fetch logs with pagination
  const fetchLogs = async (pageNum = 1, dateFilter = "") => {
    try {
      setLoading(true);
      let url = `/fire-safety/fire-extinguisher?page=${pageNum}&limit=10`;
      if (dateFilter) {
        url += `&date=${encodeURIComponent(dateFilter)}`;
      }
      
      const res = await axiosInstance.get(url);
      setLogs(res.data.logs);
      setPagination({
        page: res.data.currentPage,
        totalPages: res.data.totalPages,
        totalRecords: res.data.totalRecords
      });
    } catch (err) {
      console.error("Error fetching logs:", err);
      Swal.fire("Error", "Failed to fetch weekly checks", "error");
    } finally {
      setLoading(false);
    }
  };

  // Fetch specific entry by date
  const fetchEntryByDate = async (selectedDate) => {
    try {
      const formattedDate = convertToDDMMYYYY(selectedDate);
      
      const res = await axiosInstance.get(`/fire-safety/fire-extinguisher/date/${encodeURIComponent(formattedDate)}`);
      if (res.data) {
        // Populate the form with existing data
        setFireExtinguishers(res.data.extinguishers.map(ext => ({
          id: Math.random().toString(36).substr(2, 9),
          code: ext.code,
          type: ext.type,
          weight: ext.weight,
          pressureGauge: ext.pressureGauge,
          exactPressure: ext.exactPressure || "",
          weightKg: ext.weightKg || "",
          remarks: ext.remarks || ""
        })));
        setDate(formattedDate); // Store in dd/mm/yyyy format
      } else {
        // Reset to default if no entry exists
        setFireExtinguishers(
          Array.from({ length: 21 }, (_, i) => ({
            id: Math.random().toString(36).substr(2, 9),
            code: `FE${i + 1}`,
            type: "ABC",
            weight: "6",
            pressureGauge: "green",
            exactPressure: "",
            weightKg: "",
            remarks: ""
          }))
        );
        setDate(formattedDate); // Store in dd/mm/yyyy format
      }
    } catch (err) {
      // No entry for this date, keep default
      setFireExtinguishers(
        Array.from({ length: 21 }, (_, i) => ({
          id: Math.random().toString(36).substr(2, 9),
          code: `FE${i + 1}`,
          type: "ABC",
          weight: "6",
          pressureGauge: "green",
          exactPressure: "",
          weightKg: "",
          remarks: ""
        }))
      );
      if (selectedDate) {
        setDate(convertToDDMMYYYY(selectedDate)); // Store in dd/mm/yyyy format
      }
    }
  };

  useEffect(() => {
    const today = getTodayDateInput();
    setDateInput(today);
    fetchLogs(1);
    fetchEntryByDate(today); // Load today's data if exists
  }, []);

  // Handle date change
  const handleDateChange = (e) => {
    const newDateInput = e.target.value;
    setDateInput(newDateInput);
    if (newDateInput) {
      fetchEntryByDate(newDateInput);
    } else {
      setDate("");
      setFireExtinguishers(
        Array.from({ length: 21 }, (_, i) => ({
          id: Math.random().toString(36).substr(2, 9),
          code: `FE${i + 1}`,
          type: "ABC",
          weight: "6",
          pressureGauge: "green",
          exactPressure: "",
          weightKg: "",
          remarks: ""
        }))
      );
    }
  };

  const handleExtinguisherChange = (id, field, value) => {
    setFireExtinguishers(prev => 
      prev.map(ext => {
        if (ext.id === id) {
          const updatedExt = { ...ext, [field]: value };
          
          // Auto-set weight based on type
          if (field === 'type') {
            if (value === 'ABC') {
              updatedExt.weight = '6';
              updatedExt.exactPressure = '';
              updatedExt.weightKg = '';
            } else if (value === 'Co2') {
              updatedExt.weight = '4.5';
              updatedExt.exactPressure = '';
              updatedExt.weightKg = '';
            } else if (value === 'Water Foam') {
              updatedExt.weight = '45';
              updatedExt.exactPressure = '';
              updatedExt.weightKg = '';
            }
          }
          
          return updatedExt;
        }
        return ext;
      })
    );
  };

  const submitWeeklyReport = async () => {
    try {
      setLoading(true);
      
      if (!date) {
        Swal.fire("Error", "Please select a date first", "error");
        return;
      }

      await axiosInstance.post("/fire-safety/fire-extinguisher", {
        date: date, // Already in dd/mm/yyyy format
        extinguishers: fireExtinguishers.map(ext => ({
          code: ext.code,
          type: ext.type,
          weight: ext.weight,
          pressureGauge: ext.pressureGauge,
          exactPressure: ext.exactPressure,
          weightKg: ext.weightKg,
          remarks: ext.remarks
        }))
      });

      Swal.fire("Success!", "Fire extinguisher weekly report saved successfully", "success");
      
      // Refresh logs
      fetchLogs(1);
      
    } catch (err) {
      console.error("Error saving report:", err);
      Swal.fire("Error", "Error saving weekly report", "error");
    } finally {
      setLoading(false);
    }
  };

  // Start editing an existing entry
  const startEditing = (entry) => {
    setEditingId(entry._id);
    setEditForm({
      date: entry.date,
      extinguishers: entry.extinguishers
    });
    
    // Also populate the main form with this data for editing
    const dateInInputFormat = convertToYYYYMMDD(entry.date);
    setDateInput(dateInInputFormat);
    setDate(entry.date); // Store in dd/mm/yyyy format
    setFireExtinguishers(entry.extinguishers.map(ext => ({
      id: Math.random().toString(36).substr(2, 9),
      code: ext.code,
      type: ext.type,
      weight: ext.weight,
      pressureGauge: ext.pressureGauge,
      exactPressure: ext.exactPressure || "",
      weightKg: ext.weightKg || "",
      remarks: ext.remarks || ""
    })));
  };

  // Save edited entry
  const saveEdit = async (id) => {
    try {
      setLoading(true);
      
      if (!date) {
        Swal.fire("Error", "Date is required", "error");
        return;
      }

      await axiosInstance.put(`/fire-safety/fire-extinguisher/${id}`, {
        date: date, // Already in dd/mm/yyyy format
        extinguishers: fireExtinguishers.map(ext => ({
          code: ext.code,
          type: ext.type,
          weight: ext.weight,
          pressureGauge: ext.pressureGauge,
          exactPressure: ext.exactPressure,
          weightKg: ext.weightKg,
          remarks: ext.remarks
        }))
      });

      Swal.fire("Updated!", "Report updated successfully", "success");
      
      setEditingId(null);
      setEditForm({ date: "", extinguishers: [] });
      fetchLogs(pagination.page);
      
    } catch (err) {
      console.error("Error updating report:", err);
      Swal.fire("Error", "Failed to update report", "error");
    } finally {
      setLoading(false);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({ date: "", extinguishers: [] });
    
    // Reset to today's date
    const today = getTodayDateInput();
    setDateInput(today);
    fetchEntryByDate(today);
  };

  // Pagination handlers
  const handlePageChange = (newPage) => {
    fetchLogs(newPage);
  };

  // Get weight display text
  const getWeightDisplay = (ext) => {
    if (ext.type === "ABC") return `${ext.weight} kg`;
    if (ext.type === "Co2") return "4.5 kg";
    if (ext.type === "Water Foam") return "45 ltr";
    return "";
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-center text-red-700">
        Fire Extinguisher Weekly Check Report
      </h2>

      {/* Date Selection and Controls */}
      <div className="mb-6 bg-gray-50 p-4 rounded-lg">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Date for Weekly Check (Can be past or present date):
            </label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={dateInput}
                onChange={handleDateChange}
                className="border rounded p-2"
                max={getTodayDateInput()}
              />
              {date && (
                <span className="text-sm font-semibold text-gray-700">
                  Selected: {date}
                </span>
              )}
            </div>
          </div>
          
          <div className="flex gap-3">
            {editingId ? (
              <>
                <button
                  onClick={() => saveEdit(editingId)}
                  disabled={loading}
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors text-sm"
                >
                  {loading ? "Saving..." : "Save Changes"}
                </button>
                <button
                  onClick={cancelEdit}
                  className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors text-sm"
                >
                  Cancel Edit
                </button>
              </>
            ) : (
              <button
                onClick={submitWeeklyReport}
                disabled={loading || !date}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors text-sm"
              >
                {loading ? "Saving Report..." : "Save Weekly Report"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table for Fire Extinguishers Entry */}
      <div className="mb-8 border rounded-lg p-4 bg-red-50">
        <h3 className="text-lg font-semibold mb-4">
          {editingId ? `Editing Report for ${date}` : date ? `Weekly Check Entry for ${date}` : "Select a date to begin"}
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full border border-slate-300 text-sm">
            <thead className="bg-red-600 text-white">
              <tr>
                <th className="border px-3 py-2">Name & Code</th>
                <th className="border px-3 py-2">Type of Fire Extinguisher</th>
                <th className="border px-3 py-2">Weight/Capacity</th>
                <th className="border px-3 py-2">Pressure Gauge (Red/Green)</th>
                <th className="border px-3 py-2">Exact Pressure (if ABC) / Weight (if Co2)</th>
                <th className="border px-3 py-2">Remarks</th>
              </tr>
            </thead>
            <tbody>
              {fireExtinguishers.map((ext) => (
                <tr key={ext.id} className="hover:bg-gray-50 bg-white">
                  <td className="border px-3 py-2 font-semibold">
                    {ext.code}
                  </td>
                  
                  <td className="border px-3 py-2">
                    <select
                      value={ext.type}
                      onChange={(e) => handleExtinguisherChange(ext.id, 'type', e.target.value)}
                      className="w-full border rounded p-1"
                    >
                      <option value="ABC">ABC</option>
                      <option value="Co2">Co2</option>
                      <option value="Water Foam">Water Foam</option>
                    </select>
                    
                    {ext.type === "ABC" && (
                      <select
                        value={ext.weight}
                        onChange={(e) => handleExtinguisherChange(ext.id, 'weight', e.target.value)}
                        className="w-full border rounded p-1 mt-1"
                      >
                        <option value="6">6 kg</option>
                        <option value="9">9 kg</option>
                      </select>
                    )}
                  </td>
                  
                  <td className="border px-3 py-2 font-semibold text-center">
                    {getWeightDisplay(ext)}
                  </td>
                  
                  <td className="border px-3 py-2">
                    <select
                      value={ext.pressureGauge}
                      onChange={(e) => handleExtinguisherChange(ext.id, 'pressureGauge', e.target.value)}
                      className={`w-full border rounded p-1 ${
                        ext.pressureGauge === 'red' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                      }`}
                    >
                      <option value="green">Green (Normal)</option>
                      <option value="red">Red (Needs Refill)</option>
                    </select>
                  </td>
                  
                  <td className="border px-3 py-2">
                    {ext.type === "ABC" && (
                      <input
                        type="text"
                        value={ext.exactPressure}
                        onChange={(e) => handleExtinguisherChange(ext.id, 'exactPressure', e.target.value)}
                        className="w-full border rounded p-1"
                        placeholder="Enter exact pressure..."
                      />
                    )}
                    {ext.type === "Co2" && (
                      <input
                        type="text"
                        value={ext.weightKg}
                        onChange={(e) => handleExtinguisherChange(ext.id, 'weightKg', e.target.value)}
                        className="w-full border rounded p-1"
                        placeholder="Enter weight in kg..."
                      />
                    )}
                    {ext.type === "Water Foam" && (
                      <div className="text-gray-500 text-center">N/A for Water Foam</div>
                    )}
                  </td>
                  
                  <td className="border px-3 py-2">
                    <textarea
                      value={ext.remarks}
                      onChange={(e) => handleExtinguisherChange(ext.id, 'remarks', e.target.value)}
                      className="w-full border rounded p-1"
                      rows={2}
                      placeholder="Remarks..."
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Saved Reports Table - SHOW DETAILED DATA */}
      <div className="mt-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Saved Weekly Check Reports</h3>
          <div className="text-sm text-gray-700">
            Total: {pagination.totalRecords} records
          </div>
        </div>
        
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No weekly check reports found.
          </div>
        ) : (
          <div className="space-y-6">
            {logs.map((entry) => {
              const isEditing = editingId === entry._id;
              const redCount = entry.extinguishers.filter(ext => ext.pressureGauge === 'red').length;
              const greenCount = entry.extinguishers.length - redCount;
              
              return (
                <div key={entry._id} className="border rounded-lg overflow-hidden">
                  {/* Report Header */}
                  <div className="bg-red-600 text-white p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="text-lg font-semibold">Report Date: {entry.date}</h4>
                        <div className="text-sm opacity-90">
                          Created by: {entry.createdBy?.name || 'N/A'} • 
                          Created on: {new Date(entry.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm">
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs mr-2">
                            Green: {greenCount}
                          </span>
                          <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs">
                            Red: {redCount}
                          </span>
                        </div>
                        <button
                          onClick={() => startEditing(entry)}
                          className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600 transition-colors text-sm mt-2"
                        >
                          Edit Report
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Detailed Extinguisher Table */}
                  <div className="overflow-x-auto">
                    <table className="min-w-full border border-slate-300 text-sm">
                      <thead className="bg-red-100">
                        <tr>
                          <th className="border px-3 py-2">Code</th>
                          <th className="border px-3 py-2">Type</th>
                          <th className="border px-3 py-2">Weight/Capacity</th>
                          <th className="border px-3 py-2">Pressure Gauge</th>
                          <th className="border px-3 py-2">Exact Pressure/Weight</th>
                          <th className="border px-3 py-2">Remarks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {entry.extinguishers.map((ext, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="border px-3 py-2 font-semibold">
                              {ext.code}
                            </td>
                            <td className="border px-3 py-2">
                              {ext.type}
                            </td>
                            <td className="border px-3 py-2 text-center">
                              {ext.type === "ABC" && `${ext.weight} kg`}
                              {ext.type === "Co2" && "4.5 kg"}
                              {ext.type === "Water Foam" && "45 ltr"}
                            </td>
                            <td className="border px-3 py-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                ext.pressureGauge === 'red' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                              }`}>
                                {ext.pressureGauge === 'red' ? 'Red (Needs Refill)' : 'Green (Normal)'}
                              </span>
                            </td>
                            <td className="border px-3 py-2">
                              {ext.type === "ABC" && ext.exactPressure && (
                                <span className="text-blue-600">{ext.exactPressure}</span>
                              )}
                              {ext.type === "Co2" && ext.weightKg && (
                                <span className="text-blue-600">{ext.weightKg} kg</span>
                              )}
                              {(ext.type === "Water Foam" || !ext.exactPressure) && (
                                <span className="text-gray-400">N/A</span>
                              )}
                            </td>
                            <td className="border px-3 py-2">
                              {ext.remarks || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Controls */}
        {pagination.totalPages > 1 && (
          <div className="flex justify-between items-center mt-6 px-4 py-3 bg-white border-t border-gray-200 rounded-lg">
            <div className="text-sm text-gray-700">
              Showing page {pagination.page} of {pagination.totalPages} 
              ({pagination.totalRecords} total records)
            </div>
            
            <div className="flex items-center space-x-1">
              <button
                onClick={() => handlePageChange(1)}
                disabled={pagination.page === 1}
                className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                First
              </button>
              
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              <span className="px-3 py-1 text-sm bg-red-500 text-white rounded">
                {pagination.page}
              </span>
              
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
              
              <button
                onClick={() => handlePageChange(pagination.totalPages)}
                disabled={pagination.page === pagination.totalPages}
                className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Last
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}