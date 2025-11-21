// pages/DGSetLogBookPage.jsx
import { useEffect, useState, useRef } from "react";
import axiosInstance from "../axiosInstance";
import { useUserContext } from "../context/UserContext";
import InternalNavbar from "../components/InternalNavbar";
import imageCompression from "browser-image-compression";
import Swal from 'sweetalert2';
import { motion, AnimatePresence } from "framer-motion";

const ddmmyyyy = (d) => {
  const date = new Date(d);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

export default function DGSetLogBookPage() {
  const { user } = useUserContext();
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [consumptionData, setConsumptionData] = useState(null);
const [showConsumptionModal, setShowConsumptionModal] = useState(false);
const [selectedPeriod, setSelectedPeriod] = useState("month");
const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const limit = 10;

  // All your existing functions remain exactly the same...
const fetchData = async (p = page) => {
  try {
    const res = await axiosInstance.get(`/dg-log-book?page=${p}&limit=${limit}`);
    const rowsWithIds = (res.data.data || []).map(row => ({
      ...row,
      id: row.id || `row-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }));
    setRows(rowsWithIds);
    setPage(res.data.page);
    setTotalPages(res.data.totalPages);
  } catch (err) {
    console.error("Error fetching:", err);
  }
};

const addNewRow = () => {
  const rowId = `row-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const newRow = {
    id: rowId, // Add unique ID
    date: new Date(),
    startTime: "",
    shutdownTime: "",
    netRunning: "",
    dieselQuantity: "",
    checked: false,
    checkedBy: "",
    remarks: "",
    attachments: [],
  };
  
  setRows((prev) => [...prev, newRow]);

  setTimeout(() => {
    const newRowElement = document.getElementById(rowId);
    if (newRowElement) {
      newRowElement.scrollIntoView({ 
        behavior: "smooth", 
        block: "center" 
      });
      
      // Highlight the new row
      newRowElement.classList.add('bg-blue-50', 'border-2', 'border-blue-200');
      setTimeout(() => {
        newRowElement.classList.remove('bg-blue-50', 'border-2', 'border-blue-200');
      }, 2000);
    }
  }, 100);
};

  const calculateNetRunning = (start, end) => {
    if (!start || !end) return "";
    const startDate = new Date(`1970-01-01T${start}:00`);
    const endDate = new Date(`1970-01-01T${end}:00`);
    let diff = (endDate - startDate) / (1000 * 60);
    if (diff < 0) diff += 24 * 60;
    const hrs = Math.floor(diff / 60);
    const mins = diff % 60;
    return `${hrs}h ${mins}m`;
  };

  const handleInputChange = (i, field, value) => {
    const updated = [...rows];
    updated[i][field] = value;

    if (field === "startTime" || field === "shutdownTime") {
      updated[i].netRunning = calculateNetRunning(updated[i].startTime, updated[i].shutdownTime);
    }

    if (field === "checked") {
      updated[i].checked = value;
      updated[i].checkedBy = value ? user.name : "";
    }

    setRows(updated);
  };

  const compressImage = async (file) => {
    if (!file.type.startsWith("image/")) return file;
    try {
      return await imageCompression(file, { maxSizeMB: 1, maxWidthOrHeight: 1920 });
    } catch {
      return file;
    }
  };

  const handleFileUpload = async (e, rowIndex) => {
    const files = e.target.files;
    if (!files.length) return;

    try {
      setUploading(true);
      const uploadPromises = Array.from(files).map(async (file) => {
        let processedFile = file;
        
        if (file.type.startsWith('image/')) {
          try {
            processedFile = await imageCompression(file, {
              maxSizeMB: 1,
              maxWidthOrHeight: 1920,
              useWebWorker: true,
              fileType: file.type,
            });
          } catch (compressError) {
            processedFile = file;
          }
        }
        
        const formData = new FormData();
        formData.append("file", processedFile);
        formData.append("upload_preset", "PF_upload_preset");
        formData.append("folder", "dg-set-logbook");

        const res = await fetch(
          "https://api.cloudinary.com/v1_1/dcr8k5amk/auto/upload",
          { 
            method: "POST", 
            body: formData 
          }
        );
        
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error?.message || `Upload failed with status ${res.status}`);
        }
        
        const data = await res.json();
        
        return {
          public_id: data.public_id,
          url: data.secure_url,
          original_filename: data.original_filename,
          resource_type: data.resource_type,
          format: data.format
        };
      });

      const uploadedFiles = await Promise.all(uploadPromises);

      const updated = [...rows];
      updated[rowIndex].attachments = [
        ...(updated[rowIndex].attachments || []),
        ...uploadedFiles
      ];
      setRows(updated);

      await handleSave(updated[rowIndex]);
      
    } catch (error) {
      console.error("Upload failed:", error);
      Swal.fire({
        icon: 'error',
        title: 'Upload Failed',
        text: error.message || 'File upload failed. Please try again.',
      });
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

const handleSave = async (row) => {
  try {
    setSaving(true);
    
    // Prepare data with user information
    const saveData = {
      ...row,
      createdBy: user?._id || null // Include user ID when saving
    };
    
    await axiosInstance.post("/dg-log-book", saveData);
    fetchData(page);
  } finally {
    setSaving(false);
  }
};

  const handleDeleteRow = async (id) => {
    if (!window.confirm("Delete this row?")) return;
    try {
      await axiosInstance.delete(`/dg-log-book/${id}`);
      fetchData(page);
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const handleDeleteFile = async (rowId, public_id) => {
    if (!window.confirm("Delete this file?")) return;

    const originalRows = [...rows];

    try {
      setDeleting(true);
      const updatedRows = rows.map(row => {
        if (row._id === rowId) {
          return {
            ...row,
            attachments: row.attachments?.filter(file => file.public_id !== public_id) || []
          };
        }
        return row;
      });
      setRows(updatedRows);

      const response = await axiosInstance.delete(
        `/dg-log-book/${rowId}/file?public_id=${encodeURIComponent(public_id)}`
      );

      if (response.data.success) {
        Swal.fire({
          icon: "success",
          title: "File Deleted",
          text: "File has been successfully deleted",
          timer: 2000,
          showConfirmButton: false,
        });
      } else {
        throw new Error(response.data.error || "Delete failed");
      }
    } catch (err) {
      console.error("File delete failed:", err);
      setRows(originalRows);
      Swal.fire({
        icon: "error",
        title: "Delete Failed",
        text: err.response?.data?.details || err.message || "Failed to delete file. Please try again.",
      });
    } finally {
      setDeleting(false);
    }
  };

  const showFileInSwal = (file) => {
    const fileType = file.resource_type || (file.format === 'pdf' ? 'pdf' : 'image');

    if (fileType === 'image') {
      Swal.fire({
        title: file.original_filename,
        imageUrl: file.url,
        imageAlt: file.original_filename,
        showCloseButton: true,
        showConfirmButton: false,
      });
    } else if (fileType === 'pdf') {
      Swal.fire({
        title: file.original_filename,
        html: `
          <div style="height: 400px; overflow: auto;">
            <iframe src="${file.url}" width="100%" height="100%" frameborder="0"></iframe>
          </div>
        `,
        showCloseButton: true,
        showConfirmButton: false,
        width: '80%',
      });
    } else {
      Swal.fire({
        title: file.original_filename,
        html: `
          <div class="text-left">
            <p><strong>File Name:</strong> ${file.original_filename}</p>
            <p><strong>Type:</strong> ${file.format || 'File'}</p>
            <p>This file type cannot be previewed.</p>
          </div>
        `,
        showCloseButton: true,
        showConfirmButton: false,
      });
    }
  };

  useEffect(() => {
    fetchData(1);
  }, []);

  // Loading Component
  const LoadingOverlay = ({ message = "Processing..." }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 flex items-center gap-3 shadow-lg">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-gray-700">{message}</span>
      </div>
    </div>
  );

  const fetchConsumptionData = async () => {
  try {
    const params = new URLSearchParams({
      period: selectedPeriod,
      year: selectedYear.toString(),
      month: (selectedMonth + 1).toString()
    });

    const res = await axiosInstance.get(`/dg-log-book/consumption?${params}`);
    setConsumptionData(res.data);
  } catch (err) {
    console.error("Error fetching consumption data:", err);
    Swal.fire({
      icon: 'error',
      title: 'Failed to load consumption data',
      text: err.message,
    });
  }
};

  return (
    <>
      <InternalNavbar />
      
      {/* Main Container */}
      <div className="min-h-screen bg-gradient-to-br from-white to-blue-50 py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          
          {/* Header Section */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 flex items-center gap-3">
                  <span className="bg-orange-100 text-orange-800 p-3 rounded-xl">🛢️</span>
                  DG Set Log Book (300 KVA)
                </h1>
                <p className="text-gray-600 mt-2">
                  Track and monitor diesel generator set operations and maintenance
                </p>
              </div>
              
              <motion.button
                onClick={addNewRow}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2"
              >
                <span>➕</span>
                Add New Entry
              </motion.button>
              <motion.button
  onClick={() => {
    setShowConsumptionModal(true);
    fetchConsumptionData();
  }}
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.98 }}
  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
>
  <span>📊</span>
  Diesel Consumption Report
</motion.button>
            </div>
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-sm p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{rows.length}</div>
              <div className="text-sm text-gray-600">Total Entries</div>
            </div>
           
           
          </div>

          {/* Table Section */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {rows.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🛢️</div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">No DG Set Log Entries</h3>
                <p className="text-gray-600 mb-6">Start by adding your first generator log entry</p>
                <button
                  onClick={addNewRow}
                  className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  Add First Entry
                </button>
              </div>
            ) : (
              <>
            {/* Mobile Table View */}
<div className="lg:hidden overflow-x-auto">
  <table className="w-full min-w-full border-collapse border border-gray-200 text-sm">
    <thead className="bg-gray-50">
      <tr>
        <th className="border border-gray-300 px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
        <th className="border border-gray-300 px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">Start</th>
        <th className="border border-gray-300 px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">Shutdown</th>
        <th className="border border-gray-300 px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">Running</th>
        <th className="border border-gray-300 px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">Diesel (L)</th>
                <th className="border border-gray-300 px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">Data Entered By</th> {/* ADD THIS */}
        <th className="border border-gray-300 px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">Files</th>
        <th className="border border-gray-300 px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">Remarks</th>
        <th className="border border-gray-300 px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
      </tr>
    </thead>
    <tbody>
      {rows.map((row, index) => (
          <motion.tr
    key={row._id || row.id || index}
    id={row.id || `row-${index}`}
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="hover:bg-gray-50 transition-colors"
  >
          {/* Date */}
          <td className="border border-gray-300 px-2 py-2">
            <input
              type="date"
              value={row.date ? new Date(row.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}
              onChange={(e) => {
                const selectedDate = new Date(e.target.value);
                const today = new Date();
                today.setHours(23, 59, 59, 999);
                
                if (selectedDate <= today) {
                  handleInputChange(index, "date", selectedDate);
                } else {
                  Swal.fire({
                    icon: 'warning',
                    title: 'Invalid Date',
                    text: 'Please select a date that is not in the future.',
                    timer: 3000
                  });
                }
              }}
              max={new Date().toISOString().split('T')[0]}
              className="w-full px-1 py-1 border border-gray-300 rounded text-xs"
            />
            {row.checked && (
              <div className="text-xs text-green-600 font-medium mt-1">✅</div>
            )}
          </td>

          {/* Start Time */}
          <td className="border border-gray-300 px-2 py-2">
            <input
              type="time"
              value={row.startTime || ""}
              onChange={(e) => handleInputChange(index, "startTime", e.target.value)}
              className="w-full px-1 py-1 border border-gray-300 rounded text-xs"
            />
          </td>

          {/* Shutdown Time */}
          <td className="border border-gray-300 px-2 py-2">
            <input
              type="time"
              value={row.shutdownTime || ""}
              onChange={(e) => handleInputChange(index, "shutdownTime", e.target.value)}
              className="w-full px-1 py-1 border border-gray-300 rounded text-xs"
            />
          </td>

          {/* Net Running */}
          <td className="border border-gray-300 px-2 py-2">
            <div className="text-xs font-semibold text-green-600 text-center">{row.netRunning || "—"}</div>
          </td>

          {/* Diesel Quantity */}
          <td className="border border-gray-300 px-2 py-2">
            <input
              type="number"
              value={row.dieselQuantity || ""}
              onChange={(e) => handleInputChange(index, "dieselQuantity", e.target.value)}
              className="w-full px-1 py-1 border border-gray-300 rounded text-xs"
              placeholder="L"
            />
          </td>

          {/* Data Entered By - ADD THIS COLUMN */}
       <td className="border border-gray-300 px-2 py-2">
            <div className="text-xs text-gray-700 text-center">
              <div className="font-semibold">{row.createdBy?.name || user?.name || 'Current User'}</div>
              <div className="text-gray-500 truncate" title={row.createdBy?.email || user?.email}>
                {row.createdBy?.email || user?.email || ''}
              </div>
            </div>
          </td>

          {/* Files */}
          <td className="border border-gray-300 px-2 py-2">
            <div className="space-y-1">
              {/* File Upload */}
              <input
                type="file"
                multiple
                accept="image/*,.pdf"
                onChange={(e) => handleFileUpload(e, index)}
                className="block w-full text-xs text-gray-500"
                disabled={uploading}
              />
              
              {/* File Attachments */}
              {row.attachments?.length > 0 && (
                <div className="flex flex-wrap gap-1 justify-center">
                  {row.attachments.map((file, idx) => (
                    <div key={idx} className="relative group">
                      <button
                        onClick={() => showFileInSwal(file)}
                        className="flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded p-1 transition-colors text-xs w-6 h-6"
                        title={file.original_filename}
                      >
                        {file.resource_type === 'image' ? '🖼️' : '📄'}
                      </button>
                      {row._id && (
                        <button
                          onClick={() => handleDeleteFile(row._id, file.public_id)}
                          className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-3 h-3 text-[8px] flex items-center justify-center hover:bg-red-600 transition-colors"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {row.attachments?.length > 0 && (
                <div className="text-xs text-gray-500 text-center">
                  {row.attachments.length} file{row.attachments.length !== 1 ? 's' : ''}
                </div>
              )}
            </div>
          </td>

          {/* Remarks */}
          <td className="border border-gray-300 px-2 py-2">
            <textarea
              value={row.remarks || ""}
              onChange={(e) => handleInputChange(index, "remarks", e.target.value)}
              className="w-full px-1 py-1 border border-gray-300 rounded text-xs resize-none"
              rows={2}
              placeholder="Add remarks..."
            />
          </td>

          {/* Actions */}
          <td className="border border-gray-300 px-2 py-2">
            <div className="flex flex-col gap-1">
              <button
                onClick={() => handleSave(row)}
                className="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700 transition-colors flex items-center justify-center gap-1"
                disabled={saving}
              >
                {saving ? (
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  "💾"
                )}
              </button>
              {row._id && (
                <button
                  onClick={() => handleDeleteRow(row._id)}
                  className="bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700 transition-colors flex items-center justify-center gap-1"
                >
                  🗑️
                </button>
              )}
            </div>
          </td>
        </motion.tr>
      ))}
    </tbody>
  </table>
</div>

                {/* Desktop Table View */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date & Time
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Operations
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Verification
                        </th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          Entered By {/* ADD THIS COLUMN */}
        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Documents
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {rows.map((row, index) => (
                          <motion.tr
    key={row._id || row.id || index}
    id={row.id || `row-${index}`}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="hover:bg-gray-50 transition-colors"
  >
                          {/* Date & Time Column */}
                         {/* Date Column */}
<td className="px-6 py-4">
  <div className="space-y-2">
    <input
      type="date"
      value={row.date ? new Date(row.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}
      onChange={(e) => {
        const selectedDate = new Date(e.target.value);
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        
        if (selectedDate <= today) {
          handleInputChange(index, "date", selectedDate);
        } else {
          Swal.fire({
            icon: 'warning',
            title: 'Invalid Date',
            text: 'Please select a date that is not in the future.',
            timer: 3000
          });
        }
      }}
      max={new Date().toISOString().split('T')[0]}
      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
    />
    {row.checked && (
      <div className="text-sm text-green-600 font-medium">✅ Verified</div>
    )}
  </div>
</td>

                          {/* Operations Column */}
                          <td className="px-6 py-4">
                            <div className="space-y-3">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">Start Time</label>
                                  <input
                                    type="time"
                                    value={row.startTime || ""}
                                    onChange={(e) => handleInputChange(index, "startTime", e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">Shutdown Time</label>
                                  <input
                                    type="time"
                                    value={row.shutdownTime || ""}
                                    onChange={(e) => handleInputChange(index, "shutdownTime", e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                                  />
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <span className="block text-xs font-medium text-gray-600">Net Running</span>
                                  <span className="text-lg font-semibold text-green-600">{row.netRunning || "—"}</span>
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">Diesel (L)</label>
                                  <input
                                    type="number"
                                    value={row.dieselQuantity || ""}
                                    onChange={(e) => handleInputChange(index, "dieselQuantity", e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                                  />
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Verification Column */}
                          <td className="px-6 py-4">
                            <div className="space-y-3">
{(Array.isArray(user.role) ? user.role.some(role => ["accounts", "admin"].includes(role)) : ["accounts", "admin"].includes(user.role)) ? (                                <div className="flex items-center gap-3">
                                  <input
                                    type="checkbox"
                                    checked={row.checked || false}
                                    onChange={() => handleInputChange(index, "checked", !row.checked)}
                                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                                  />
                                  {row.checked && (
                                    <div className="text-sm text-green-600 font-medium">
                                      ✅ {user.name}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="text-sm text-gray-500">Verification only</div>
                              )}
                              
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Remarks</label>
                                <textarea
                                  value={row.remarks || ""}
                                  onChange={(e) => handleInputChange(index, "remarks", e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none"
                                  rows={3}
                                  placeholder="Add any remarks..."
                                />
                              </div>
                            </div>
                          </td>

    {/* Data Entered By Column - ADD THIS */}
          <td className="px-6 py-4">
            <div className="text-sm text-gray-700">
              <div className="font-semibold">{row.createdBy?.name || user?.name || 'Current User'}</div>
              <div className="text-gray-500 text-xs truncate" title={row.createdBy?.email || user?.email}>
                {row.createdBy?.email || user?.email || ''}
              </div>
              {row.createdBy && (
                <div className="text-xs text-green-600 mt-1">
                  ✅ Saved
                </div>
              )}
            </div>
          </td>

                          {/* Documents Column */}
                          <td className="px-6 py-4">
                            <div className="space-y-3">
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-2">
                                  Attach Files
                                </label>
                                <input
                                  type="file"
                                  multiple
                                  accept="image/*,.pdf"
                                  onChange={(e) => handleFileUpload(e, index)}
                                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                  disabled={uploading}
                                />
                              </div>
                              
                              {row.attachments?.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                  {row.attachments.map((file, idx) => (
                                    <div key={idx} className="relative group">
                                      <button
                                        onClick={() => showFileInSwal(file)}
                                        className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 rounded-lg px-3 py-2 transition-colors"
                                      >
                                        {file.resource_type === 'image' ? (
                                          <img 
                                            src={file.url} 
                                            alt={file.original_filename}
                                            className="w-8 h-8 object-cover rounded"
                                          />
                                        ) : (
                                          <div className="w-8 h-8 bg-blue-100 flex items-center justify-center rounded">
                                            <span className="text-sm">📄</span>
                                          </div>
                                        )}
                                      </button>
                                      {row._id && (
                                        <button
                                          onClick={() => handleDeleteFile(row._id, file.public_id)}
                                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center hover:bg-red-600 transition-colors"
                                        >
                                          ×
                                        </button>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Actions Column */}
                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-2">
                              <button
                                onClick={() => handleSave(row)}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                                disabled={saving}
                              >
                                {saving ? (
                                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                  "💾"
                                )}
                                Save
                              </button>
                              
                              {row._id && (
                                <button
                                  onClick={() => handleDeleteRow(row._id)}
                                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                                >
                                  🗑️ Delete
                                </button>
                              )}
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-6">
              <div className="flex items-center gap-2 bg-white rounded-lg p-4 shadow-sm">
                <button
                  onClick={() => fetchData(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  ⬅️ Previous
                </button>
                
                <div className="flex gap-1">
                  {[...Array(Math.min(5, totalPages))].map((_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => fetchData(pageNum)}
                        className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                          page === pageNum
                            ? "bg-blue-600 text-white"
                            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={() => fetchData(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  Next ➡️
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Loading Overlays */}
      <AnimatePresence>
        {(uploading || deleting || saving) && (
          <LoadingOverlay message={
            uploading ? "Uploading files..." :
            deleting ? "Deleting file..." :
            "Saving data..."
          } />
        )}
      </AnimatePresence>
{/* Consumption Report Modal */}
<AnimatePresence>
  {showConsumptionModal && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4"
      onClick={() => setShowConsumptionModal(false)}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[85vh] sm:max-h-[90vh] overflow-hidden mx-2 sm:mx-4 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 sm:p-6 text-white flex-shrink-0">
          <div className="flex justify-between items-start sm:items-center">
            <div className="flex-1 mr-4">
              <h2 className="text-xl sm:text-2xl font-bold">Diesel Consumption Report</h2>
              <p className="text-blue-100 mt-1 text-sm sm:text-base">
                Analyze fuel consumption patterns and trends
              </p>
            </div>
            <button
              onClick={() => setShowConsumptionModal(false)}
              className="text-white hover:text-blue-200 text-2xl flex-shrink-0 mt-1 sm:mt-0"
            >
              ×
            </button>
          </div>
        </div>

                                    {/* Filter Controls - Collapsible */}
        <div className="border-b border-gray-200 flex-shrink-0">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className={`transform transition-transform ${showFilters ? 'rotate-180' : ''}`}>
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              <span className="font-medium text-gray-800">Filters</span>
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                {selectedPeriod === 'month' 
                  ? `Monthly | ${new Date(selectedYear, selectedMonth).toLocaleString('default', { month: 'long' })} ${selectedYear}`
                  : `Weekly | ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} week`
                }
              </span>
            </div>
            <span className="text-sm text-gray-500">
              {showFilters ? 'Hide' : 'Show'} filters
            </span>
          </button>

          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="p-4 sm:p-6 bg-gray-50 border-t border-gray-200">
                  <div className="space-y-4 sm:space-y-0 sm:flex sm:flex-wrap sm:gap-4 sm:items-end">
                    <div className="flex-1 min-w-[140px]">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Period
                      </label>
                      <select
                        value={selectedPeriod}
                        onChange={(e) => setSelectedPeriod(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm sm:text-base bg-white"
                      >
                        <option value="month">Monthly</option>
                        <option value="week">Weekly (Current Week)</option>
                      </select>
                    </div>

                    {selectedPeriod === 'month' && (
                      <>
                        <div className="flex-1 min-w-[140px]">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Month
                          </label>
                          <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm sm:text-base bg-white"
                          >
                            {Array.from({ length: 12 }, (_, i) => (
                              <option key={i} value={i}>
                                {new Date(0, i).toLocaleString('default', { month: 'long' })}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="flex-1 min-w-[140px]">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Year
                          </label>
                          <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm sm:text-base bg-white"
                          >
                            {Array.from({ length: 5 }, (_, i) => {
                              const year = new Date().getFullYear() - 2 + i;
                              return (
                                <option key={year} value={year}>
                                  {year}
                                </option>
                              );
                            })}
                          </select>
                        </div>
                      </>
                    )}

                    {selectedPeriod === 'week' && (
                      <div className="flex-1">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <p className="text-sm text-blue-800 font-medium">
                            Weekly Report
                          </p>
                          <p className="text-xs text-blue-600 mt-1">
                            Showing data for current week ({new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })})
                          </p>
                        </div>
                      </div>
                    )}

                    <button
                      onClick={() => {
                        fetchConsumptionData();
                        setShowFilters(false);
                      }}
                      className="w-full sm:w-auto bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium text-sm sm:text-base flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Generate Report
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Consumption Data - Scrollable Area */}
        <div className="flex-1 overflow-auto p-4 sm:p-6">
          {consumptionData ? (
            <div className="space-y-4 sm:space-y-6">
              {/* Summary Cards - Smaller on mobile */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
                <div className="bg-blue-50 rounded-xl p-3 text-center border border-blue-100">
                  <div className="text-lg sm:text-2xl font-bold text-blue-600">
                    {consumptionData.summary.totalDiesel.toFixed(1)} L
                  </div>
                  <div className="text-xs text-gray-600 mt-1">Total Consumption</div>
                </div>
              
                  <div className="bg-purple-50 rounded-xl p-3 text-center border border-purple-100">
    <div className="text-lg sm:text-2xl font-bold text-purple-600">
      {consumptionData.summary.totalRunningTime}
    </div>
    <div className="text-xs text-gray-600 mt-1">Total Running Time</div>
  </div>
                <div className="bg-orange-50 rounded-xl p-3 text-center border border-orange-100">
                  <div className="text-lg sm:text-2xl font-bold text-orange-600">
                    {consumptionData.summary.averagePerDay.toFixed(1)} L
                  </div>
                  <div className="text-xs text-gray-600 mt-1">Average Per Day</div>
                </div>
                <div className="bg-green-50 rounded-xl p-3 text-center border border-green-100">
    <div className="text-lg sm:text-2xl font-bold text-green-600">
      {consumptionData.summary.daysWithData}
    </div>
    <div className="text-xs text-gray-600 mt-1">
      Day{consumptionData.summary.daysWithData !== 1 ? 's' : ''}
    </div>
  </div>
              </div>

  {/* Daily Breakdown - Updated with Running Time */}
{consumptionData.dailyBreakdown.length > 0 && (
  <div className="mt-4">
    <h3 className="text-lg font-semibold text-gray-800 mb-3">
      Daily Breakdown
    </h3>
    <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
      <div className="space-y-2 max-h-[40vh] sm:max-h-none overflow-y-auto">
        {consumptionData.dailyBreakdown.map((day, index) => (
          <div key={index} className="flex justify-between items-center bg-white p-3 rounded-lg shadow-sm border border-gray-200">
            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-900 text-sm sm:text-base">
                {new Date(day._id).toLocaleDateString('en-US', { 
                  weekday: 'short', 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </div>
              <div className="text-xs text-gray-500">
                {day.entries} entr{day.entries !== 1 ? 'ies' : 'y'}
              </div>
            </div>
            <div className="flex flex-col items-end gap-1 ml-2 flex-shrink-0">
              <div className="text-base sm:text-lg font-bold text-blue-600">
                {day.dailyConsumption.toFixed(1)} L
              </div>
              <div className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded">
                {day.runningTime}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
)}

              {consumptionData.dailyBreakdown.length === 0 && (
                <div className="text-center py-6 text-gray-500">
                  <div className="text-4xl mb-2">🛢️</div>
                  <p className="text-sm sm:text-base">No consumption data found for the selected period</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <div className="text-gray-600">Loading consumption data...</div>
            </div>
          )}
        </div>

        {/* Close Button for Mobile */}
        <div className="p-4 border-t border-gray-200 flex-shrink-0 sm:hidden">
          <button
            onClick={() => setShowConsumptionModal(false)}
            className="w-full bg-gray-600 text-white px-4 py-3 rounded-lg hover:bg-gray-700 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>
    </>
  );
}