import { useEffect, useState, useRef } from "react";
import axiosInstance from "../axiosInstance";
import InternalNavbar from "../components/InternalNavbar";
import Swal from "sweetalert2";

export default function AlkalinityMonitoring() {
  const [logs, setLogs] = useState([]);
  const [savingRow, setSavingRow] = useState(null);
  const [deletingFile, setDeletingFile] = useState(null);
  const [newRowId, setNewRowId] = useState(null);
  const newRowRef = useRef(null);
  
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [limit, setLimit] = useState(10);
  
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

  const formatDateToDDMMYYYY = (date) => {
    if (!date) return "";
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const convertToDateInputFormat = (ddmmyyyy) => {
    if (!ddmmyyyy) return "";
    const parts = ddmmyyyy.split('/');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return "";
  };

  const convertToDisplayFormat = (yyyymmdd) => {
    if (!yyyymmdd) return "";
    const parts = yyyymmdd.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return yyyymmdd;
  };

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
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      
      if (filters.date) params.append('date', convertToDisplayFormat(filters.date));
      if (filters.startDate) params.append('startDate', convertToDisplayFormat(filters.startDate));
      if (filters.endDate) params.append('endDate', convertToDisplayFormat(filters.endDate));
      if (filters.search) params.append('search', filters.search);
      
      const res = await axiosInstance.get(`/alkalinity?${params.toString()}`);
      setLogs(res.data.logs);
      setTotalPages(res.data.totalPages);
      setTotalRecords(res.data.totalRecords);
    } catch (err) {
      console.error("Error fetching Alkalinity logs:", err);
      Swal.fire("Error", "Failed to load Alkalinity data", "error");
    } finally {
      setLoading(false);
    }
  };

  const getFileUrl = (file) => {
    if (typeof file === 'string') return file;
    if (typeof file === 'object' && file !== null) {
      return file.url || Object.values(file).join('');
    }
    return String(file);
  };

  const handleFileUpload = async (e, field, rowId) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    try {
      const uploadData = new FormData();
      files.forEach((file) => uploadData.append("files", file));
      
      const uploadRes = await axiosInstance.post("/alkalinity/upload", uploadData, {
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
      Swal.fire({
        title: "Upload Error",
        text: err.response?.data?.message || "Failed to upload files",
        icon: "error"
      });
    }
  };

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
        
        const deleteRes = await axiosInstance.delete("/alkalinity/file", { 
          data: { fileUrl } 
        });

        if (deleteRes.data.success) {
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
          
          if (rowId !== 'new') {
            const logToUpdate = updatedLogs.find(log => log._id === rowId);
            if (logToUpdate) {
              await axiosInstance.put(`/alkalinity/${rowId}`, logToUpdate);
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
        console.error("File deletion error:", error);
        
        let errorMessage = "Could not delete file.";
        if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        }
        
        Swal.fire({
          title: "Error", 
          text: errorMessage,
          icon: "error"
        });
      } finally {
        setDeletingFile(null);
      }
    }
  };

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

  const handleDateChange = (rowId, value) => {
    const formattedDate = convertToDisplayFormat(value);
    handleFieldChange(rowId, 'date', formattedDate);
  };

  const handleSaveRow = async (rowId) => {
    const logToSave = logs.find(log => log._id === rowId);
    if (!logToSave) return;

    try {
      setSavingRow(rowId);
      
      if (rowId === 'new') {
        const { _id, ...logData } = logToSave;
        
        const formattedData = {
          ...logData,
          date: logData.date || formatDateToDDMMYYYY(new Date()),
          feedWaterAlkalinity: {
            value: logData.feedWaterAlkalinity?.value || "",
            files: logData.feedWaterAlkalinity?.files || []
          },
          blowDownAlkalinity: {
            value: logData.blowDownAlkalinity?.value || "",
            files: logData.blowDownAlkalinity?.files || []
          },
          remarks: logData.remarks || ""
        };
        
        const res = await axiosInstance.post("/alkalinity", formattedData);
        
        fetchLogs();
        
        Swal.fire({
          title: "Success!",
          text: res.data.message || "New Alkalinity entry added.",
          icon: "success",
          timer: 2000
        });
        
        setNewRowId(null);
      } else {
        const formattedData = {
          ...logToSave,
          date: logToSave.date,
          feedWaterAlkalinity: {
            value: logToSave.feedWaterAlkalinity?.value || "",
            files: logToSave.feedWaterAlkalinity?.files || []
          },
          blowDownAlkalinity: {
            value: logToSave.blowDownAlkalinity?.value || "",
            files: logToSave.blowDownAlkalinity?.files || []
          },
          remarks: logToSave.remarks || ""
        };
        
        await axiosInstance.put(`/alkalinity/${rowId}`, formattedData);
        
        Swal.fire({
          title: "Updated!",
          text: "Alkalinity entry updated.",
          icon: "success",
          timer: 2000
        });
      }
    } catch (err) {
      console.error("Error saving Alkalinity entry:", err);
      
      let errorMessage = "Failed to save entry.";
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
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

  const handleAddRow = () => {
    const newRow = {
      _id: 'new',
      date: formatDateToDDMMYYYY(new Date()),
      feedWaterAlkalinity: { value: "", files: [] },
      blowDownAlkalinity: { value: "", files: [] },
      remarks: ""
    };
    
    setLogs([newRow, ...logs]);
    setNewRowId('new');
    
    setTimeout(() => {
      if (newRowRef.current) {
        newRowRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  const handleDeleteRow = async (rowId) => {
    if (rowId === 'new') {
      setLogs(logs.filter(log => log._id !== 'new'));
      setNewRowId(null);
      return;
    }

    const confirm = await Swal.fire({
      title: "Delete Entry?",
      text: "This will remove the Alkalinity entry permanently.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it",
    });

    if (confirm.isConfirmed) {
      try {
        await axiosInstance.delete(`/alkalinity/${rowId}`);
        fetchLogs();
        Swal.fire("Deleted!", "Alkalinity entry removed.", "success");
      } catch (err) {
        console.error("Error deleting Alkalinity entry:", err);
        Swal.fire("Error", "Failed to delete entry.", "error");
      }
    }
  };

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

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    if (page !== 1) setPage(1);
  };

  const clearFilters = () => {
    setFilters({
      date: "",
      startDate: "",
      endDate: "",
      search: ""
    });
    setPage(1);
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLimitChange = (e) => {
    const newLimit = parseInt(e.target.value);
    setLimit(newLimit);
    setPage(1);
  };

  const DatePickerCell = ({ value, onChange, disabled }) => {
    const inputValue = convertToDateInputFormat(value);
    
    return (
      <input
        type="date"
        value={inputValue}
        onChange={(e) => onChange(e.target.value)}
        max={getTodayDate()}
        className="border rounded p-1 w-full text-xs"
        disabled={disabled}
      />
    );
  };

  const FilterDatePicker = ({ value, onChange, placeholder }) => {
    const inputValue = convertToDateInputFormat(value);
    
    return (
      <input
        type="date"
        value={inputValue}
        onChange={(e) => onChange(e.target.value)}
        max={getTodayDate()}
        className="border text-xs rounded p-2 w-full"
        placeholder={placeholder}
      />
    );
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <InternalNavbar />
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Alkalinity Testing
            </h1>
            <h1 className="text-xl font-bold text-blue-500">
              Daily Checking
            </h1>
            <p className="text-gray-600 text-xs mt-1">
              Total Records: {totalRecords} | Showing page {page} of {totalPages}
            </p>
          </div>
        </div>

        <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
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

        {loading && (
          <div className="flex justify-center items-center py-8">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="ml-3 text-lg">Loading Alkalinity data...</span>
          </div>
        )}

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
                  <th className="border p-3 text-left text-xs">Alkalinity of Feed Water (PPM)</th>
                  <th className="border p-3 text-left text-xs">Alkalinity of Blow Down Water (PPM)</th>
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

                    <td className="border p-2">
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={log.feedWaterAlkalinity?.value || ""}
                          onChange={(e) => handleFieldChange(log._id, 'feedWaterAlkalinity.value', e.target.value)}
                          className="border rounded p-1 w-full text-xs"
                          placeholder="Enter PPM value"
                          disabled={savingRow === log._id}
                        />
                        {renderFileThumbnails(log.feedWaterAlkalinity?.files || [], 'feedWaterAlkalinity', log._id)}
                        <input
                          type="file"
                          multiple
                          accept="image/*,.pdf"
                          onChange={(e) => handleFileUpload(e, 'feedWaterAlkalinity', log._id)}
                          className="text-xs w-full bg-yellow-200 p-1 rounded"
                          disabled={savingRow === log._id}
                        />
                      </div>
                    </td>

                    <td className="border p-2">
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={log.blowDownAlkalinity?.value || ""}
                          onChange={(e) => handleFieldChange(log._id, 'blowDownAlkalinity.value', e.target.value)}
                          className="border rounded p-1 w-full text-xs"
                          placeholder="Enter PPM value"
                          disabled={savingRow === log._id}
                        />
                        {renderFileThumbnails(log.blowDownAlkalinity?.files || [], 'blowDownAlkalinity', log._id)}
                        <input
                          type="file"
                          multiple
                          accept="image/*,.pdf"
                          onChange={(e) => handleFileUpload(e, 'blowDownAlkalinity', log._id)}
                          className="text-xs w-full bg-yellow-200 p-1 rounded"
                          disabled={savingRow === log._id}
                        />
                      </div>
                    </td>

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
                <p className="text-lg">No Alkalinity entries found.</p>
                <p className="mt-2">Try changing your filters or click "Add New Row" to create your first entry.</p>
              </div>
            )}

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