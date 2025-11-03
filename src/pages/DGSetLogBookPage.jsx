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
  const [deleting, setDeleting] = useState(false);
  const lastRowRef = useRef(null);
  const limit = 10;

  // All your existing functions remain exactly the same...
  const fetchData = async (p = page) => {
    try {
      const res = await axiosInstance.get(`/dg-log-book?page=${p}&limit=${limit}`);
      setRows(res.data.data || []);
      setPage(res.data.page);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      console.error("Error fetching:", err);
    }
  };

  const addNewRow = () => {
    const newRow = {
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
      lastRowRef.current?.scrollIntoView({ behavior: "smooth" });
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
      await axiosInstance.post("/dg-log-book", row);
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
            </div>
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-sm p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{rows.length}</div>
              <div className="text-sm text-gray-600">Total Entries</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {rows.filter(r => r.checked).length}
              </div>
              <div className="text-sm text-gray-600">Verified</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">
                {rows.filter(r => r.attachments?.length > 0).length}
              </div>
              <div className="text-sm text-gray-600">With Attachments</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{page}</div>
              <div className="text-sm text-gray-600">Current Page</div>
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
              {/* Mobile Cards View */}
<div className="lg:hidden space-y-4 p-4">
  {rows.map((row, index) => (
    <motion.div
      key={row._id || index}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
      ref={index === rows.length - 1 ? lastRowRef : null}
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <h4 className="font-bold text-gray-900">{ddmmyyyy(row.date || new Date())}</h4>
          <p className="text-gray-600 text-sm">Entry #{index + 1}</p>
        </div>
        {row.checked && (
          <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
            ✅ Verified
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-2 gap-3 text-sm mb-3">
        <div>
          <span className="font-medium text-gray-600">Start:</span>
          <input
            type="time"
            value={row.startTime || ""}
            onChange={(e) => handleInputChange(index, "startTime", e.target.value)}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm mt-1"
          />
        </div>
        <div>
          <span className="font-medium text-gray-600">Shutdown:</span>
          <input
            type="time"
            value={row.shutdownTime || ""}
            onChange={(e) => handleInputChange(index, "shutdownTime", e.target.value)}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm mt-1"
          />
        </div>
        <div>
          <span className="font-medium text-gray-600">Running:</span>
          <div className="text-gray-900 font-semibold mt-1">{row.netRunning || "—"}</div>
        </div>
        <div>
          <span className="font-medium text-gray-600">Diesel:</span>
          <input
            type="number"
            value={row.dieselQuantity || ""}
            onChange={(e) => handleInputChange(index, "dieselQuantity", e.target.value)}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm mt-1"
            placeholder="Liters"
          />
        </div>
      </div>

      {/* Verification Checkbox for Mobile */}
{(Array.isArray(user.role) ? user.role.some(role => ["accounts", "admin"].includes(role)) : ["accounts", "admin"].includes(user.role)) && (        <div className="mb-3 flex items-center gap-2">
          <input
            type="checkbox"
            checked={row.checked || false}
            onChange={() => handleInputChange(index, "checked", !row.checked)}
            className="w-4 h-4 text-blue-600 rounded"
          />
          <span className="text-sm text-gray-700">Verified by me</span>
        </div>
      )}

      {/* Remarks for Mobile */}
      <div className="mb-3">
        <label className="font-medium text-gray-600 text-sm">Remarks:</label>
        <textarea
          value={row.remarks || ""}
          onChange={(e) => handleInputChange(index, "remarks", e.target.value)}
          className="w-full px-2 py-1 border border-gray-300 rounded text-sm mt-1 resize-none"
          rows={2}
          placeholder="Add any remarks..."
        />
      </div>

      {/* File Upload Section for Mobile */}
      <div className="mb-3">
        <label className="font-medium text-gray-600 text-sm block mb-2">Attachments:</label>
        <input
          type="file"
          multiple
          accept="image/*,.pdf"
          onChange={(e) => handleFileUpload(e, index)}
          className="block w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          disabled={uploading}
        />
        
        {/* File Attachments Display */}
        {row.attachments?.length > 0 && (
          <div className="mt-2">
            <div className="flex flex-wrap gap-2">
              {row.attachments.map((file, idx) => (
                <div key={idx} className="relative group">
                  <button
                    onClick={() => showFileInSwal(file)}
                    className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 rounded-lg px-2 py-1 transition-colors text-xs"
                  >
                    {file.resource_type === 'image' ? (
                      <>
                        <img 
                          src={file.url} 
                          alt={file.original_filename}
                          className="w-6 h-6 object-cover rounded"
                        />
                        <span className="hidden sm:inline truncate max-w-[80px]">
                          {file.original_filename}
                        </span>
                      </>
                    ) : (
                      <>
                        <div className="w-6 h-6 bg-blue-100 flex items-center justify-center rounded">
                          <span className="text-xs">📄</span>
                        </div>
                        <span className="hidden sm:inline truncate max-w-[80px]">
                          {file.original_filename}
                        </span>
                      </>
                    )}
                  </button>
                  {row._id && (
                    <button
                      onClick={() => handleDeleteFile(row._id, file.public_id)}
                      className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 text-[10px] flex items-center justify-center hover:bg-red-600 transition-colors"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {row.attachments.length} file{row.attachments.length !== 1 ? 's' : ''} attached
            </p>
          </div>
        )}
      </div>

      <div className="flex gap-2 pt-3 border-t">
        <button
          onClick={() => handleSave(row)}
          className="bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 transition-colors flex-1 text-center flex items-center justify-center gap-1"
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
            className="bg-red-600 text-white px-3 py-2 rounded text-sm hover:bg-red-700 transition-colors flex-1 text-center flex items-center justify-center gap-1"
          >
            🗑️ Delete
          </button>
        )}
      </div>
    </motion.div>
  ))}
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
                          key={row._id || index}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="hover:bg-gray-50 transition-colors"
                          ref={index === rows.length - 1 ? lastRowRef : null}
                        >
                          {/* Date & Time Column */}
                          <td className="px-6 py-4">
                            <div className="space-y-2">
                              <div className="font-medium text-gray-900">
                                {ddmmyyyy(row.date || new Date())}
                              </div>
                              <div className="text-sm text-gray-600">
                                Entry #{index + 1}
                              </div>
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
    </>
  );
}