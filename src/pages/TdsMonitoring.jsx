import { useEffect, useState, useRef } from "react";
import axiosInstance from "../axiosInstance";
import InternalNavbar from "../components/InternalNavbar";
import Swal from "sweetalert2";

export default function TdsMonitoring() {
  const [logs, setLogs] = useState([]);
  const [savingRow, setSavingRow] = useState(null);
  const [deletingFile, setDeletingFile] = useState(null);
  const [newRowId, setNewRowId] = useState(null);
  const newRowRef = useRef(null);
  const [isVideoExpanded, setIsVideoExpanded] = useState(true); // Add this line - true means expanded by default

  // Pagination state
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [limit, setLimit] = useState(10);
  
  // Filter state
  const [filters, setFilters] = useState({
    date: "",
    startDate: "",
    endDate: "",
    search: ""
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, [page, limit, filters]);

  // Helper function to format date to DD/MM/YYYY
  const formatDateToDDMMYYYY = (date) => {
    if (!date) return "";
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Helper function to convert DD/MM/YYYY to YYYY-MM-DD for date input
  const convertToDateInputFormat = (ddmmyyyy) => {
    if (!ddmmyyyy) return "";
    const parts = ddmmyyyy.split('/');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return "";
  };

  // Helper function to convert YYYY-MM-DD to DD/MM/YYYY
  const convertToDisplayFormat = (yyyymmdd) => {
    if (!yyyymmdd) return "";
    const parts = yyyymmdd.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return yyyymmdd; // Return as-is if not in expected format
  };

  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const fetchLogs = async () => {
    try {
      setLoading(true);
      
      // Build query params
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      
      // Add filters if they exist (convert to DD/MM/YYYY format for backend)
      if (filters.date) params.append('date', convertToDisplayFormat(filters.date));
      if (filters.startDate) params.append('startDate', convertToDisplayFormat(filters.startDate));
      if (filters.endDate) params.append('endDate', convertToDisplayFormat(filters.endDate));
      if (filters.search) params.append('search', filters.search);
      
      const res = await axiosInstance.get(`/tds?${params.toString()}`);
      setLogs(res.data.logs);
      setTotalPages(res.data.totalPages);
      setTotalRecords(res.data.totalRecords);
    } catch (err) {
      console.error("Error fetching TDS logs:", err);
      Swal.fire("Error", "Failed to load TDS data", "error");
    } finally {
      setLoading(false);
    }
  };

  // Utility to get file URL
  const getFileUrl = (file) => {
    if (typeof file === 'string') return file;
    if (typeof file === 'object' && file !== null) {
      return file.url || Object.values(file).join('');
    }
    return String(file);
  };

  // Handle file upload
  const handleFileUpload = async (e, field, rowId) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    try {
      const uploadData = new FormData();
      files.forEach((file) => uploadData.append("files", file));
      
      // Use /tds/upload endpoint for TDS files
      const uploadRes = await axiosInstance.post("/tds/upload", uploadData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const updatedLogs = logs.map(log => {
        if (log._id === rowId) {
          const updatedField = {
            ...log[field],
            files: [...(log[field]?.files || []), ...uploadRes.data.urls]
          };
          return { ...log, [field]: updatedField };
        }
        return log;
      });

      setLogs(updatedLogs);
    } catch (err) {
      console.error("Error uploading files:", err);
      console.error("Error details:", err.response?.data || err.message);
      
      Swal.fire({
        title: "Upload Error",
        text: err.response?.data?.message || "Failed to upload files",
        icon: "error"
      });
    }
  };

// Handle file delete
const handleFileDelete = async (fileUrl, field, rowId, fileIndex) => {
  const confirm = await Swal.fire({
    title: "Delete File?",
    text: "This will remove it permanently from Cloudinary.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Yes, delete it",
  });

  if (confirm.isConfirmed) {
    try {
      setDeletingFile({ url: fileUrl, rowId, field });
                
      // Delete from Cloudinary
      const deleteRes = await axiosInstance.delete("/tds/file", { 
        data: { fileUrl } 
      });
      

      if (deleteRes.data.success) {
        // Update local state
        const updatedLogs = logs.map(log => {
          if (log._id === rowId) {
            const updatedFiles = log[field]?.files.filter((_, index) => index !== fileIndex) || [];
            const updatedField = {
              ...log[field],
              files: updatedFiles
            };
            return { ...log, [field]: updatedField };
          }
          return log;
        });

        setLogs(updatedLogs);
        
        // Update in database if not a new row
        if (rowId !== 'new') {
          const logToUpdate = updatedLogs.find(log => log._id === rowId);
          if (logToUpdate) {
            await axiosInstance.put(`/tds/${rowId}`, logToUpdate);
          }
        }

        Swal.fire({
          title: "Deleted!",
          text: deleteRes.data.message || "File removed successfully.",
          icon: "success",
          timer: 2000
        });
      } else {
        throw new Error(deleteRes.data.message || "Deletion failed");
      }
    } catch (error) {
      console.error("File deletion error details:", error);
      console.error("Error response:", error.response?.data);
      
      let errorMessage = "Could not delete file.";
      
      if (error.response?.data) {
        if (error.response.data.message) {
          errorMessage = error.response.data.message;
        }
        if (error.response.data.error) {
          errorMessage += `\nError: ${error.response.data.error}`;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Swal.fire({
        title: "Deletion Error", 
        text: errorMessage,
        icon: "error",
        confirmButtonText: "OK",
        width: 600
      });
    } finally {
      setDeletingFile(null);
    }
  }
};

  // Handle field change
  const handleFieldChange = (rowId, field, value) => {
    const updatedLogs = logs.map(log => {
      if (log._id === rowId) {
        if (field.includes('.')) {
          const [parent, child] = field.split('.');
          return {
            ...log,
            [parent]: {
              ...log[parent],
              [child]: value
            }
          };
        }
        return { ...log, [field]: value };
      }
      return log;
    });
    setLogs(updatedLogs);
  };

  // Handle date change (for table cells)
  const handleDateChange = (rowId, value) => {
    // Convert YYYY-MM-DD to DD/MM/YYYY for storage
    const formattedDate = convertToDisplayFormat(value);
    handleFieldChange(rowId, 'date', formattedDate);
  };

 // Save row - FIXED VERSION
const handleSaveRow = async (rowId) => {
  const logToSave = logs.find(log => log._id === rowId);
  if (!logToSave) return;

  try {
    setSavingRow(rowId);
    
    if (rowId === 'new') {
      // Create new entry - remove _id field for new entries
      const { _id, ...logData } = logToSave;
      
      // Ensure proper format for the data
      const formattedData = {
        ...logData,
        date: logData.date || formatDateToDDMMYYYY(new Date()),
        boreWaterTds: {
          value: logData.boreWaterTds?.value || "",
          files: logData.boreWaterTds?.files || []
        },
        feedWaterTds: {
          value: logData.feedWaterTds?.value || "",
          files: logData.feedWaterTds?.files || []
        },
        drainWaterTds: {
          value: logData.drainWaterTds?.value || "",
          files: logData.drainWaterTds?.files || []
        },
        remarks: logData.remarks || ""
      };
            
      // ✅ ADD THIS LINE: Actually send the data to backend
      const res = await axiosInstance.post("/tds", formattedData);
            
      // Refresh logs to get proper pagination
      fetchLogs();
      
      Swal.fire({
        title: "Success!",
        text: res.data.message || "New TDS entry added.",
        icon: "success",
        timer: 2000
      });
      
      setNewRowId(null);
    } else {
      // Update existing entry
      const formattedData = {
        ...logToSave,
        date: logToSave.date,
        boreWaterTds: {
          value: logToSave.boreWaterTds?.value || "",
          files: logToSave.boreWaterTds?.files || []
        },
        feedWaterTds: {
          value: logToSave.feedWaterTds?.value || "",
          files: logToSave.feedWaterTds?.files || []
        },
        drainWaterTds: {
          value: logToSave.drainWaterTds?.value || "",
          files: logToSave.drainWaterTds?.files || []
        },
        remarks: logToSave.remarks || ""
      };
      
      const res = await axiosInstance.put(`/tds/${rowId}`, formattedData);
      
      Swal.fire({
        title: "Updated!",
        text: res.data.message || "TDS entry updated.",
        icon: "success",
        timer: 2000
      });
    }
  } catch (err) {
    console.error("Error saving TDS entry:", err);
    
    // Show detailed error message
    let errorMessage = "Failed to save entry.";
    if (err.response) {
      console.error("Response data:", err.response.data);
      console.error("Response status:", err.response.status);
      
      if (err.response.data && err.response.data.message) {
        errorMessage = err.response.data.message;
        if (err.response.data.errors) {
          errorMessage += "\n" + err.response.data.errors.join("\n");
        }
      }
    } else if (err.request) {
      console.error("Request error:", err.request);
      errorMessage = "Network error - could not reach server.";
    } else {
      console.error("Error:", err.message);
      errorMessage = err.message;
    }
    
    Swal.fire({
      title: "Error",
      text: errorMessage,
      icon: "error",
      confirmButtonText: "OK"
    });
  } finally {
    setSavingRow(null);
  }
};

  // Add new row
  const handleAddRow = () => {
    const newRow = {
      _id: 'new',
      date: formatDateToDDMMYYYY(new Date()),
      boreWaterTds: { value: "", files: [] },
      feedWaterTds: { value: "", files: [] },
      drainWaterTds: { value: "", files: [] },
      remarks: ""
    };
    
    setLogs([newRow, ...logs]);
    setNewRowId('new');
    
    // Scroll to new row after a brief delay
    setTimeout(() => {
      if (newRowRef.current) {
        newRowRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  // Delete row
  const handleDeleteRow = async (rowId) => {
    if (rowId === 'new') {
      setLogs(logs.filter(log => log._id !== 'new'));
      setNewRowId(null);
      return;
    }

    const confirm = await Swal.fire({
      title: "Delete Entry?",
      text: "This will remove the TDS entry permanently.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it",
    });

    if (confirm.isConfirmed) {
      try {
        await axiosInstance.delete(`/tds/${rowId}`);
        // Refresh logs to update pagination
        fetchLogs();
        Swal.fire("Deleted!", "TDS entry removed.", "success");
      } catch (err) {
        console.error("Error deleting TDS entry:", err);
        Swal.fire("Error", "Failed to delete entry.", "error");
      }
    }
  };

  // File preview
  const openFilePreview = (url, fileName) => {
    const isImage = url.match(/\.(jpeg|jpg|gif|png|webp)$/i);
    const isPDF = url.match(/\.pdf$/i);

    if (isImage) {
      Swal.fire({
        imageUrl: url,
        imageAlt: fileName,
        showCloseButton: true,
        showConfirmButton: false,
      });
    } else if (isPDF) {
      Swal.fire({
        title: `PDF Preview`,
        html: `<iframe src="${url}" width="100%" height="500px" style="border:none;"></iframe>`,
        width: "600px",
        showCloseButton: true,
        showConfirmButton: false,
      });
    } else {
      Swal.fire({
        title: `File`,
        text: url,
        showCloseButton: true,
        showConfirmButton: false,
      });
    }
  };

  // Render file thumbnails
  const renderFileThumbnails = (files, field, rowId) => {
    if (!files || files.length === 0) return null;

    return (
      <div className="flex flex-wrap gap-1">
        {files.map((file, index) => {
          const fileUrl = getFileUrl(file);
          const isImage = fileUrl.match(/\.(jpeg|jpg|gif|png|webp)$/i);
          
          return (
            <div key={index} className="relative">
              <button
                onClick={() => openFilePreview(fileUrl, `File ${index + 1}`)}
                className="border rounded overflow-hidden w-12 h-12 flex items-center justify-center cursor-pointer"
              >
                {isImage ? (
                  <img
                    src={fileUrl}
                    className="object-cover w-full h-full"
                    alt={`File ${index + 1}`}
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                ) : (
                  <span className="text-xs">📄</span>
                )}
              </button>
              <button
                onClick={() => handleFileDelete(fileUrl, field, rowId, index)}
                disabled={deletingFile?.url === fileUrl && deletingFile?.rowId === rowId}
                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 text-xs flex items-center justify-center"
              >
                {deletingFile?.url === fileUrl && deletingFile?.rowId === rowId ? (
                  <div className="w-2 h-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  "×"
                )}
              </button>
            </div>
          );
        })}
      </div>
    );
  };

  // Handle filter change
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    // Reset to page 1 when filters change
    if (page !== 1) setPage(1);
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      date: "",
      startDate: "",
      endDate: "",
      search: ""
    });
    setPage(1);
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    setPage(newPage);
    // Scroll to top when changing pages
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle limit change
  const handleLimitChange = (e) => {
    const newLimit = parseInt(e.target.value);
    setLimit(newLimit);
    setPage(1); // Reset to page 1 when changing limit
  };

  // Date picker component for table cells
  const DatePickerCell = ({ value, onChange, disabled }) => {
    // Convert DD/MM/YYYY to YYYY-MM-DD for input
    const inputValue = convertToDateInputFormat(value);
    
    return (
      <input
        type="date"
        value={inputValue}
        onChange={(e) => onChange(e.target.value)}
        max={getTodayDate()} // Block future dates
        className="border rounded p-1 w-full text-xs"
        disabled={disabled}
      />
    );
  };

  // Date picker component for filters
  const FilterDatePicker = ({ value, onChange, placeholder }) => {
    // Convert DD/MM/YYYY to YYYY-MM-DD for input
    const inputValue = convertToDateInputFormat(value);
    
    return (
      <input
        type="date"
        value={inputValue}
        onChange={(e) => onChange(e.target.value)}
        max={getTodayDate()} // Block future dates
        className="border text-xs rounded p-2 w-full"
        placeholder={placeholder}
      />
    );
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <InternalNavbar />
      <div className="max-w-7xl mx-auto p-6">
        {/* Header with Add Button */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              TDS (Total Dissolved Solids)
            </h1>
             <h1 className="text-xl font-bold text-blue-500">
              Daily Checking
            </h1>
            <p className="text-gray-600 text-xs mt-1">
              Total Records: {totalRecords} | Showing page {page} of {totalPages}
            </p>
          </div>
        </div>

        {/* YouTube Instruction Video - Collapsible Section */}
<div className="bg-white shadow-lg rounded-lg mb-6 overflow-hidden">
  {/* Header - Always visible, click to toggle */}
  <button
    onClick={() => setIsVideoExpanded(!isVideoExpanded)}
    className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors duration-200"
  >
    <div className="flex items-center gap-3">
      <div className="bg-red-100 p-2 rounded-lg">
        <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 24 24">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
        </svg>
      </div>
      <div className="text-left">
        <h3 className="text-xs font-semibold text-gray-900">
          📺 How to Use TDS Monitoring - Instruction Video
        </h3>
        <p className="text-xs text-gray-600">
          {isVideoExpanded ? 'Click to collapse' : 'Click to expand and watch the tutorial'}
        </p>
      </div>
    </div>
    
    {/* Expand/Collapse Icon */}
    <div className="ml-4">
      <svg 
        className={`w-5 h-5 text-gray-500 transform transition-transform duration-300 ${isVideoExpanded ? 'rotate-180' : ''}`}
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  </button>

  {/* Collapsible Content */}
  <div 
    className={`transition-all duration-300 ease-in-out overflow-hidden ${
      isVideoExpanded ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
    }`}
  >
    <div className="p-4 border-t border-gray-200">
      <div className="flex items-start gap-4">
        <div className="flex-1">
          <p className="text-sm text-gray-600 mb-3">
            Watch this video to learn how to add, edit, and manage TDS entries effectively.
          </p>
          <div className="relative w-full aspect-video rounded-lg overflow-hidden shadow-lg border border-gray-200">
            <iframe
              className="absolute top-0 left-0 w-full h-full"
              src="https://www.youtube.com/embed/1ytoQ6rKSf4?si=l0cZjbhzVHGCg5q4"
              title="TDS Monitoring Instruction Video"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            ></iframe>
          </div>
          <div className="mt-3 text-xs text-gray-500 flex items-center gap-2">
            <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">💡 Tip</span>
            <span>You can pause the video anytime and follow along with the instructions</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

        {/* Filters Section */}
        <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {/* Date Filter */}
            <div>
              <label className="block text-xs font-medium mb-1">Filter by Date</label>
              <FilterDatePicker
                value={filters.date}
                onChange={(value) => handleFilterChange('date', value)}
                placeholder="Select Date"
              />
              {filters.date && (
                <div className="text-xs text-gray-500 mt-1">
                  Display: {convertToDisplayFormat(filters.date)}
                </div>
              )}
            </div>

            {/* Date Range Start */}
            <div>
              <label className="block text-xs font-medium mb-1">Start Date</label>
              <FilterDatePicker
                value={filters.startDate}
                onChange={(value) => handleFilterChange('startDate', value)}
                placeholder="Start Date"
              />
              {filters.startDate && (
                <div className="text-xs text-gray-500 mt-1">
                  Display: {convertToDisplayFormat(filters.startDate)}
                </div>
              )}
            </div>

            {/* Date Range End */}
            <div>
              <label className="block text-xs font-medium mb-1">End Date</label>
              <FilterDatePicker
                value={filters.endDate}
                onChange={(value) => handleFilterChange('endDate', value)}
                placeholder="End Date"
              />
              {filters.endDate && (
                <div className="text-xs text-gray-500 mt-1">
                  Display: {convertToDisplayFormat(filters.endDate)}
                </div>
              )}
            </div>

            {/* Search Filter */}
            <div>
              <label className="block text-xs font-medium mb-1">Search</label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="border rounded p-2 w-full text-xs"
                placeholder="Search in values or remarks..."
              />
            </div>
          </div>

          {/* Filter Actions */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 mr-4">
              <button
                onClick={clearFilters}
                className="bg-gray-500 text-xs hover:bg-gray-600 text-white px-4 py-2 rounded"
              >
                Clear Filters
              </button>
              <button
                onClick={fetchLogs}
                className="bg-blue-500 text-xs hover:bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Loading...
                  </>
                ) : (
                  <>
                    <span>↻</span>
                    <span>Refresh</span>
                  </>
                )}
              </button>
            </div>

            {/* Items per page selector */}
            <div className="flex items-center">
              <label className="text-xs font-medium">Items per page:</label>
              <select
                value={limit}
                onChange={handleLimitChange}
                className="border rounded p-1 text-xs"
                disabled={loading}
              >
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
              </select>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-8">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="ml-3 text-lg">Loading TDS data...</span>
          </div>
        )}

        {/* Main Table */}
        {!loading && (
          <>
           <button
            onClick={handleAddRow}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 mb-5"
          >
            <span>+</span>
            <span>Add New Row</span>
          </button>
          <div className="bg-white shadow-lg rounded-lg overflow-x-auto mb-6">
            <table className="min-w-full border-collapse">
              <thead className="bg-slate-200">
                <tr>
                  <th className="border p-3 text-left text-xs">Date</th>
                  <th className="border p-3 text-left text-xs">TDS of Submersible Bore Water from Ground (PPM)</th>
                  <th className="border p-3 text-left text-xs">TDS of Feed Water to Boiler from Softner Plant (PPM)</th>
                  <th className="border p-3 text-left text-xs">TDS of Blow Down/Drain Water (PPM)</th>
                  <th className="border p-3 text-left text-xs">Remarks</th>
                  <th className="border p-3 text-left text-xs">Actions</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, index) => (
                  <tr 
                    key={log._id} 
                    ref={log._id === newRowId ? newRowRef : null}
                    className={`${log._id === newRowId ? 'bg-blue-50' : 'hover:bg-slate-50'} ${
                      index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                    }`}
                  >
                    {/* Date with Date Picker */}
                    <td className="border p-2">
                      <div className="space-y-1">
                        <DatePickerCell
                          value={log.date || ""}
                          onChange={(value) => handleDateChange(log._id, value)}
                          disabled={savingRow === log._id}
                        />
                        <div className="text-xs text-gray-500">
                          {log.date || "No date selected"}
                        </div>
                      </div>
                    </td>

                    {/* Bore Water TDS */}
                    <td className="border p-2">
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={log.boreWaterTds?.value || ""}
                          onChange={(e) => handleFieldChange(log._id, 'boreWaterTds.value', e.target.value)}
                          className="border rounded p-1 w-full text-xs"
                          placeholder="Enter PPM value"
                          disabled={savingRow === log._id}
                        />
                        {renderFileThumbnails(log.boreWaterTds?.files || [], 'boreWaterTds', log._id)}
                        <input
                          type="file"
                          multiple
                          accept="image/*,.pdf"
                          onChange={(e) => handleFileUpload(e, 'boreWaterTds', log._id)}
                          className="text-xs w-full bg-yellow-200 p-1 rounded"
                          disabled={savingRow === log._id}
                        />
                      </div>
                    </td>

                    {/* Feed Water TDS */}
                    <td className="border p-2">
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={log.feedWaterTds?.value || ""}
                          onChange={(e) => handleFieldChange(log._id, 'feedWaterTds.value', e.target.value)}
                          className="border rounded p-1 w-full text-xs"
                          placeholder="Enter PPM value"
                          disabled={savingRow === log._id}
                        />
                        {renderFileThumbnails(log.feedWaterTds?.files || [], 'feedWaterTds', log._id)}
                        <input
                          type="file"
                          multiple
                          accept="image/*,.pdf"
                          onChange={(e) => handleFileUpload(e, 'feedWaterTds', log._id)}
                          className="text-xs w-full bg-yellow-200 p-1 rounded"
                          disabled={savingRow === log._id}
                        />
                      </div>
                    </td>

                    {/* Drain Water TDS */}
                    <td className="border p-2">
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={log.drainWaterTds?.value || ""}
                          onChange={(e) => handleFieldChange(log._id, 'drainWaterTds.value', e.target.value)}
                          className="border rounded p-1 w-full text-xs"
                          placeholder="Enter PPM value"
                          disabled={savingRow === log._id}
                        />
                        {renderFileThumbnails(log.drainWaterTds?.files || [], 'drainWaterTds', log._id)}
                        <input
                          type="file"
                          multiple
                          accept="image/*,.pdf"
                          onChange={(e) => handleFileUpload(e, 'drainWaterTds', log._id)}
                          className="text-xs w-full bg-yellow-200 p-1 rounded"
                          disabled={savingRow === log._id}
                        />
                      </div>
                    </td>

                    {/* Remarks */}
                    <td className="border p-2">
                      <textarea
                        value={log.remarks || ""}
                        onChange={(e) => handleFieldChange(log._id, 'remarks', e.target.value)}
                        className="border rounded p-1 w-full text-xs"
                        rows="2"
                        placeholder="Enter remarks"
                        disabled={savingRow === log._id}
                      />
                    </td>

                    {/* Actions */}
                    <td className="border p-2">
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => handleSaveRow(log._id)}
                          disabled={savingRow === log._id || loading}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {savingRow === log._id ? (
                            <div className="flex items-center justify-center gap-2">
                              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              Saving...
                            </div>
                          ) : (
                            "Save Row"
                          )}
                        </button>
                        <button
                          onClick={() => handleDeleteRow(log._id)}
                          disabled={loading}
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

            {logs.length === 0 && !loading && (
              <div className="text-center py-8 text-gray-500 bg-white rounded-lg shadow">
                <p className="text-lg">No TDS entries found.</p>
                <p className="mt-2">Try changing your filters or click "Add New Row" to create your first entry.</p>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && !loading && (
              <div className="flex justify-center items-center gap-4 mt-6">
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                  className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  ← Previous
                </button>
                
                <div className="flex items-center gap-2">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (page <= 3) {
                      pageNum = i + 1;
                    } else if (page >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = page - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`px-3 py-1 rounded ${
                          page === pageNum
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 hover:bg-gray-300'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  
                  {totalPages > 5 && page < totalPages - 2 && (
                    <>
                      <span>...</span>
                      <button
                        onClick={() => handlePageChange(totalPages)}
                        className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300"
                      >
                        {totalPages}
                      </button>
                    </>
                  )}
                </div>
                
                <span className="text-gray-600">
                  Page {page} of {totalPages}
                </span>
                
                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === totalPages}
                  className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}

        {/* Loading Overlays */}
        {(savingRow || deletingFile) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 flex flex-col items-center">
              <div className={`w-12 h-12 border-4 rounded-full animate-spin mb-4 ${
                savingRow ? 'border-blue-500 border-t-transparent' : 'border-red-500 border-t-transparent'
              }`}></div>
              <p className="text-lg font-medium">
                {savingRow ? 'Saving Entry...' : 'Deleting File...'}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Please wait while we process your request
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}