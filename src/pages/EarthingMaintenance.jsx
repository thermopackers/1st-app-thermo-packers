import { useEffect, useState } from "react";
import axiosInstance from "../axiosInstance";
import InternalNavbar from "../components/InternalNavbar";
import Swal from "sweetalert2";

export default function EarthingMaintenance() {
  // Add this to your state declarations
const [totalRecords, setTotalRecords] = useState(0);
  const [logs, setLogs] = useState([]);
  const [form, setForm] = useState({
    earthingNo: "",
    waterTopUp: "No",
    earthingCurrent: "",
    sign: "",
    remarks: "",
  });
  const [files, setFiles] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  // Editing
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editFiles, setEditFiles] = useState([]);
  const [existingFiles, setExistingFiles] = useState([]);
  const [deletingFiles, setDeletingFiles] = useState({});

  // Filter
  const [filterDate, setFilterDate] = useState("");
  const [filteredLogs, setFilteredLogs] = useState([]);

  useEffect(() => {
    fetchLogs(page);
  }, [page]);

useEffect(() => {
  generateNextEarthingNo();
}, [logs, filteredLogs]); // Add filteredLogs as dependency


  // Helper function to convert dd/mm/yyyy to yyyy-mm-dd for date input
const convertToYYYYMMDD = (dateString) => {
  if (!dateString) return "";
  const [day, month, year] = dateString.split('/');
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
};

// Helper function to convert yyyy-mm-dd to dd/mm/yyyy
const convertToDDMMYYYY = (dateString) => {
  if (!dateString) return "";
  const [year, month, day] = dateString.split('-');
  return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
};

// ✅ Fetch logs with pagination and date filter - IMPROVED
const fetchLogs = async (pageNum, dateFilter = "") => {
  try {
    setLoading(true);
    let url = `/earthing?page=${pageNum}&limit=10`;
    if (dateFilter) {
      url += `&date=${encodeURIComponent(dateFilter)}`;
    }
    
    console.log("Fetching URL:", url); // Debug log
    
    const res = await axiosInstance.get(url);
    setLogs(res.data.logs);
    setTotalPages(res.data.totalPages);
    setTotalRecords(res.data.totalRecords);
    
    // Always set filteredLogs to the API response
    setFilteredLogs(res.data.logs);
    
    console.log("Fetched logs:", res.data.logs.length); // Debug log
  } catch (err) {
    console.error("Error fetching logs:", err);
    Swal.fire("Error", "Failed to fetch logs", "error");
  } finally {
    setLoading(false);
  }
};

// Update your date input handler
const handleDateFilterChange = (selectedDate) => {
  if (selectedDate) {
    // Convert yyyy-mm-dd to dd/mm/yyyy for filtering
    const [year, month, day] = selectedDate.split('-');
    const formattedDate = `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
    setFilterDate(formattedDate);
    setPage(1);
    fetchLogs(1, formattedDate);
  } else {
    setFilterDate("");
    setPage(1);
    fetchLogs(1);
  }
};

// Update your filter handler
const handleDateFilter = (date) => {
  setFilterDate(date);
  setPage(1); // Reset to first page when filtering
  fetchLogs(1, date);
};

  // ✅ Auto-generate Earthing No - Improved version
const generateNextEarthingNo = () => {
  // Use all logs (not filtered logs) for number generation
  const allLogsForNumbering = filterDate ? logs : filteredLogs;
  
  if (allLogsForNumbering.length === 0) {
    setForm((prev) => ({ ...prev, earthingNo: "Earth1" }));
  } else {
    // find highest number from all available logs
    const numbers = allLogsForNumbering
      .map((l) => parseInt(l.earthingNo?.replace(/\D/g, "")))
      .filter((n) => !isNaN(n));
    const max = numbers.length > 0 ? Math.max(...numbers) : 0;
    setForm((prev) => ({ ...prev, earthingNo: `Earth${max + 1}` }));
  }
};

  // ✅ Add new entry
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      let uploadedUrls = [];

      if (files.length > 0) {
        const fd = new FormData();
        files.forEach((file) => fd.append("files", file));
        const uploadRes = await axiosInstance.post("/earthing/upload", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        uploadedUrls = uploadRes.data.urls;
      }

      await axiosInstance.post("/earthing", {
        ...form,
        uploadedFiles: uploadedUrls,
      });

      setFiles([]);
      fetchLogs(page);
      Swal.fire("Saved!", "Earthing entry added successfully", "success");

      // auto-generate next number
      const nextNumber = parseInt(form.earthingNo.replace(/\D/g, "")) + 1;
      setForm({
        earthingNo: `Earth${nextNumber}`,
        waterTopUp: "No",
        earthingCurrent: "",
        sign: "",
        remarks: "",
      });
    } catch (err) {
      console.error("Error saving log:", err);
      Swal.fire("Error", "Error saving entry", "error");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Editing
  const startEditing = (entry) => {
    setEditingId(entry._id);
    setEditForm({
      earthingNo: entry.earthingNo,
      waterTopUp: entry.waterTopUp,
      earthingCurrent: entry.earthingCurrent,
      sign: entry.sign,
      remarks: entry.remarks,
    });
    setExistingFiles(entry.uploadedFiles || []);
    setEditFiles([]);
  };

  const saveEdit = async (id) => {
    try {
      setLoading(true);
      
      // Get files marked for deletion
      const filesToDelete = deletingFiles[id] || [];
      
      // Delete files from Cloudinary FIRST
      if (filesToDelete.length > 0) {
        await Promise.all(
          filesToDelete.map(fileUrl => 
            axiosInstance.delete('/earthing/file', { data: { fileUrl } })
          )
        );
      }

      // Create the updated files array (existing files minus deleted ones)
      const updatedFiles = existingFiles.filter(file => !filesToDelete.includes(file));

      const updatedData = { 
        ...editForm, 
        uploadedFiles: updatedFiles // Use the filtered files
      };

      // Upload new files if any
      if (editFiles.length > 0) {
        const fd = new FormData();
        editFiles.forEach((f) => fd.append("files", f));
        const uploadRes = await axiosInstance.post("/earthing/upload", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        updatedData.uploadedFiles = [...updatedFiles, ...uploadRes.data.urls];
      }

      // Save the updated data to database
      await axiosInstance.put(`/earthing/${id}`, updatedData);
      
      // Clean up states
      setEditingId(null);
      setEditForm({});
      setEditFiles([]);
      setExistingFiles([]);
      setDeletingFiles(prev => {
        const newState = { ...prev };
        delete newState[id];
        return newState;
      });
      
      // Refresh the logs to show updated data
      fetchLogs(page);
      Swal.fire("Updated!", "Entry updated successfully", "success");
    } catch (err) {
      console.error("Error updating log:", err);
      Swal.fire("Error", "Failed to update entry", "error");
    } finally {
      setLoading(false);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
    setEditFiles([]);
    setExistingFiles([]);
    setDeletingFiles({});
  };

  const openFileModal = (url) => {
    const isImage = url.match(/\.(jpeg|jpg|gif|png|webp)$/i);
    const isPDF = url.match(/\.pdf$/i);
    if (isImage) {
      Swal.fire({ imageUrl: url, showCloseButton: true, showConfirmButton: false });
    } else if (isPDF) {
      Swal.fire({
        html: `<iframe src="${url}" width="100%" height="500px"></iframe>`,
        width: "80%",
        showCloseButton: true,
      });
    } else window.open(url, "_blank");
  };

  // Delete existing file during editing
  const deleteExistingFile = async (fileUrl, entryId) => {
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
        // Remove from UI immediately
        setExistingFiles(prev => prev.filter(file => file !== fileUrl));
        
        // Track files to be deleted when saving
        setDeletingFiles(prev => ({
          ...prev,
          [entryId]: [...(prev[entryId] || []), fileUrl]
        }));

        Swal.fire('Marked for deletion!', 'File will be removed when you save changes.', 'success');
      }
    } catch (err) {
      console.error('Error in delete process:', err);
      Swal.fire('Error', 'Failed to mark file for deletion', 'error');
    }
  };

  // Remove file from new files during editing
  const removeNewFile = (index) => {
    setEditFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Add files during editing
  const handleEditFilesChange = (e) => {
    setEditFiles(Array.from(e.target.files));
  };

  // Clear date filter
  const clearFilter = () => {
    setFilterDate("");
  };

  // Get unique dates for dropdown suggestions
  const uniqueDates = [...new Set(logs.map(entry => entry.date))].sort((a, b) => {
    // Sort dates in dd/mm/yyyy format
    const [dayA, monthA, yearA] = a.split('/').map(Number);
    const [dayB, monthB, yearB] = b.split('/').map(Number);
    const dateA = new Date(yearA, monthA - 1, dayA);
    const dateB = new Date(yearB, monthB - 1, dayB);
    return dateB - dateA; // Descending order (newest first)
  });

  return (
    <div className="min-h-screen bg-slate-100">
      <InternalNavbar />
      <div className="max-w-7xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-center text-yellow-700 mb-8">
          Earthing - Water Top Up Report
        </h1>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="bg-white shadow-lg rounded-lg p-6 mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Earthing No.</label>
              <input
                type="text"
                readOnly
                value={form.earthingNo}
                className="border rounded p-2 w-full bg-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Date of Activity</label>
              <input
                type="text"
                readOnly
                value={new Date().toLocaleDateString('en-GB')}
                className="border rounded p-2 w-full bg-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Water Top Up Done</label>
              <select
                value={form.waterTopUp}
                onChange={(e) => setForm({ ...form, waterTopUp: e.target.value })}
                className="border rounded p-2 w-full"
              >
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Earthing Current (Weak?)</label>
              <input
                type="text"
                value={form.earthingCurrent}
                onChange={(e) => setForm({ ...form, earthingCurrent: e.target.value })}
                className="border rounded p-2 w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Sign</label>
              <input
                type="text"
                value={form.sign}
                onChange={(e) => setForm({ ...form, sign: e.target.value })}
                className="border rounded p-2 w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Upload Files</label>
              <input
                type="file"
                multiple
                accept="image/*,.pdf"
                onChange={(e) => setFiles(Array.from(e.target.files))}
                className="border rounded p-2 w-full"
              />
            </div>

            <div className="col-span-full">
              <label className="block text-sm font-medium mb-1">Remarks</label>
              <textarea
                value={form.remarks}
                onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                className="border rounded p-2 w-full"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-6 bg-yellow-600 text-white px-6 py-2 rounded hover:bg-yellow-700 transition"
          >
            {loading ? "Saving..." : "Add Entry"}
          </button>
        </form>

 {/* FILTER SECTION */}
<div className="bg-white shadow-lg rounded-lg p-6 mb-6">
  <div className="flex flex-col sm:flex-row gap-4 items-center">
    <div className="flex-1">
      <label className="block text-sm font-medium mb-2 text-gray-700">
        Filter by Date
      </label>
      <div className="flex gap-2">
        <input
          type="date"
          value={filterDate ? convertToYYYYMMDD(filterDate) : ""}
          onChange={(e) => handleDateFilterChange(e.target.value)}
          className="border rounded p-2 flex-1"
        />
        {filterDate && (
          <button
            onClick={() => {
              setFilterDate("");
              setPage(1);
              fetchLogs(1);
            }}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition"
          >
            Clear
          </button>
        )}
      </div>
    </div>
    <div className="text-sm text-gray-600">
      Showing {filteredLogs.length} entries
      {filterDate && ` for ${filterDate}`}
      {!filterDate && ` out of ${totalRecords} total`}
    </div>
  </div>
  
  {/* Date suggestions dropdown */}
  {!filterDate && (
    <div className="mt-4">
      <label className="block text-sm font-medium mb-2 text-gray-700">
        Quick Date Filters
      </label>
      <select 
        onChange={(e) => {
          if (e.target.value) {
            setFilterDate(e.target.value);
            setPage(1);
            fetchLogs(1, e.target.value);
          }
        }}
        className="border rounded p-2 w-full"
      >
        <option value="">Select a date</option>
        {uniqueDates.map(date => (
          <option key={date} value={date}>{date}</option>
        ))}
      </select>
    </div>
  )}
</div>
        {/* TABLE */}
        <div className="overflow-x-auto bg-white shadow-lg rounded-lg">
          <table className="min-w-full border border-slate-300 text-sm text-center">
            <thead className="bg-yellow-600 text-white">
              <tr>
                <th className="border px-3 py-2">Earthing No</th>
                <th className="border px-3 py-2">Date</th>
                <th className="border px-3 py-2">Water Top Up</th>
                <th className="border px-3 py-2">Earthing Current</th>
                <th className="border px-3 py-2">Sign</th>
                <th className="border px-3 py-2">Files</th>
                <th className="border px-3 py-2">Remarks</th>
                <th className="border px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="8" className="border px-3 py-4 text-gray-500">
                    {filterDate ? `No entries found for ${filterDate}` : "No entries found"}
                  </td>
                </tr>
              ) : (
                filteredLogs.map((entry) => {
                  const isEditing = editingId === entry._id;
                  return (
                    <tr key={entry._id}>
                      <td className="border px-3 py-2">{entry.earthingNo}</td>
                      <td className="border px-3 py-2">{entry.date}</td>
                      <td className="border px-3 py-2">
                        {isEditing ? (
                          <select
                            value={editForm.waterTopUp}
                            onChange={(e) => setEditForm({ ...editForm, waterTopUp: e.target.value })}
                            className="border rounded p-1 w-full"
                          >
                            <option value="No">No</option>
                            <option value="Yes">Yes</option>
                          </select>
                        ) : (
                          entry.waterTopUp
                        )}
                      </td>
                      <td className="border px-3 py-2">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editForm.earthingCurrent}
                            onChange={(e) => setEditForm({ ...editForm, earthingCurrent: e.target.value })}
                            className="w-full border rounded p-1"
                          />
                        ) : (
                          entry.earthingCurrent
                        )}
                      </td>
                      <td className="border px-3 py-2">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editForm.sign}
                            onChange={(e) => setEditForm({ ...editForm, sign: e.target.value })}
                            className="w-full border rounded p-1"
                          />
                        ) : (
                          entry.sign
                        )}
                      </td>

                      <td className="border px-3 py-2">
                        <div className="flex flex-wrap gap-1 justify-center">
                          {/* Show entry files when NOT editing */}
                          {!isEditing && entry.uploadedFiles?.map((url, i) => (
                            <div key={`view-${i}`} className="relative">
                              <button
                                onClick={() => openFileModal(url)}
                                className="border rounded p-1 hover:bg-gray-100 transition"
                              >
                                {url.match(/\.(jpeg|jpg|gif|png|webp)$/i) ? (
                                  <img src={url} alt={`File ${i + 1}`} className="w-12 h-12 object-cover" />
                                ) : (
                                  <span>📄</span>
                                )}
                              </button>
                            </div>
                          ))}
                          
                          {/* Show editing interface when editing */}
                          {isEditing && (
                            <>
                              {/* Existing Files with delete option */}
                              {existingFiles.map((url, i) => (
                                <div key={`existing-${i}`} className="relative group">
                                  <button
                                    onClick={() => openFileModal(url)}
                                    className="border rounded p-1 hover:bg-gray-100 transition"
                                  >
                                    {url.match(/\.(jpeg|jpg|gif|png|webp)$/i) ? (
                                      <img src={url} alt={`File ${i + 1}`} className="w-12 h-12 object-cover" />
                                    ) : (
                                      <span>📄</span>
                                    )}
                                  </button>
                                  <button
                                    onClick={() => deleteExistingFile(url, entry._id)}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="Delete file"
                                  >
                                    ×
                                  </button>
                                </div>
                              ))}
                              
                              {/* New Files (during editing) */}
                              {editFiles.map((file, i) => (
                                <div key={`new-${i}`} className="relative group">
                                  <div className="border rounded p-1 bg-blue-50">
                                    {file.type.startsWith('image/') ? (
                                      <img 
                                        src={URL.createObjectURL(file)} 
                                        alt={`New file ${i + 1}`} 
                                        className="w-12 h-12 object-cover" 
                                      />
                                    ) : (
                                      <span>📄 {file.name}</span>
                                    )}
                                  </div>
                                  <button
                                    onClick={() => removeNewFile(i)}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="Remove file"
                                  >
                                    ×
                                  </button>
                                </div>
                              ))}
                              
                              {/* File Upload Input (during editing) */}
                              <div className="flex items-center justify-center">
                                <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 rounded p-2 text-xs transition">
                                  📁 Add Files
                                  <input
                                    type="file"
                                    multiple
                                    accept="image/*,.pdf"
                                    onChange={handleEditFilesChange}
                                    className="hidden"
                                  />
                                </label>
                              </div>
                            </>
                          )}
                        </div>
                      </td>

                      <td className="border px-3 py-2">
                        {isEditing ? (
                          <textarea
                            value={editForm.remarks}
                            onChange={(e) => setEditForm({ ...editForm, remarks: e.target.value })}
                            className="w-full border rounded p-1"
                            rows={2}
                          />
                        ) : (
                          entry.remarks
                        )}
                      </td>

                      <td className="border px-3 py-2">
                        {isEditing ? (
                          <>
                            <button
                              onClick={() => saveEdit(entry._id)}
                              className="bg-green-600 text-white px-2 py-1 rounded mr-2"
                            >
                              Save
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="bg-gray-400 text-white px-2 py-1 rounded"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => startEditing(entry)}
                            className="bg-yellow-500 text-white px-2 py-1 rounded"
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

      {/* PAGINATION - Show when not filtering OR when server-side filtering is implemented */}
{(!filterDate || totalPages > 1) && (
  <div className="flex justify-center items-center gap-2 mt-4">
    <button
      disabled={page === 1}
      onClick={() => {
        const newPage = page - 1;
        setPage(newPage);
        fetchLogs(newPage, filterDate);
      }}
      className="px-3 py-1 bg-gray-300 rounded disabled:opacity-50"
    >
      Prev
    </button>
    <span>
      Page {page} of {totalPages}
    </span>
    <button
      disabled={page === totalPages}
      onClick={() => {
        const newPage = page + 1;
        setPage(newPage);
        fetchLogs(newPage, filterDate);
      }}
      className="px-3 py-1 bg-gray-300 rounded disabled:opacity-50"
    >
      Next
    </button>
  </div>
)}
      </div>
    </div>
  );
}