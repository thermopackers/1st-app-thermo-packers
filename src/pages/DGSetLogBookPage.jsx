// pages/DGSetLogBookPage.jsx
import { useEffect, useState, useRef } from "react";
import axiosInstance from "../axiosInstance";
import { useUserContext } from "../context/UserContext";
import InternalNavbar from "../components/InternalNavbar";
import imageCompression from "browser-image-compression";
import Swal from 'sweetalert2';

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
const [deleting, setDeleting] = useState(false);  // NEW
  const lastRowRef = useRef(null);
  const limit = 10;

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
    let diff = (endDate - startDate) / (1000 * 60); // minutes
    if (diff < 0) diff += 24 * 60; // handle next-day shutdown
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
      console.log("Original file:", file.name, "Size:", Math.round(file.size / 1024) + "KB");
      
      let processedFile = file;
      
      // Only compress images, not PDFs or other files
      if (file.type.startsWith('image/')) {
        try {
          processedFile = await imageCompression(file, {
            maxSizeMB: 1,
            maxWidthOrHeight: 1920,
            useWebWorker: true,
            fileType: file.type,
          });
          console.log("Compressed file:", processedFile.name, "Size:", Math.round(processedFile.size / 1024) + "KB");
        } catch (compressError) {
          console.warn("Compression failed, using original file:", compressError);
          processedFile = file;
        }
      }
      
      const formData = new FormData();
      formData.append("file", processedFile);
      formData.append("upload_preset", "PF_upload_preset"); // ✅ Fixed: Use correct preset name
      
      // For better organization, you can add a folder
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
        console.error("Cloudinary upload error:", errorData);
        throw new Error(errorData.error?.message || `Upload failed with status ${res.status}`);
      }
      
      const data = await res.json();
      console.log("Upload successful:", data);
      
      return {
        public_id: data.public_id,
        url: data.secure_url,
        original_filename: data.original_filename,
        resource_type: data.resource_type,
        format: data.format
      };
    });

    const uploadedFiles = await Promise.all(uploadPromises);
    console.log("All files uploaded:", uploadedFiles);

    // Update the UI immediately with the new files
    const updated = [...rows];
    updated[rowIndex].attachments = [
      ...(updated[rowIndex].attachments || []),
      ...uploadedFiles
    ];
    setRows(updated);

    // Auto-save the row
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
    e.target.value = ""; // Reset file input
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

  // keep backup always
  const originalRows = [...rows];

  try {
        setDeleting(true);   // show loader
    // remove from UI
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

    // call backend (with encodeURIComponent fix)
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
    setRows(originalRows); // rollback UI
    Swal.fire({
      icon: "error",
      title: "Delete Failed",
      text: err.response?.data?.details || err.message || "Failed to delete file. Please try again.",
    });
  } finally {
    setDeleting(false);   // hide loader
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
      showConfirmButton: false, // ❌ removed Download
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
      showConfirmButton: false, // ❌ removed Download
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
      showConfirmButton: false, // ❌ removed Download
    });
  }
};

  useEffect(() => {
    fetchData(1);
  }, []);

  return (
    <>
      <InternalNavbar />
      <div className="p-2 sm:p-4">
        <h1 className="text-xl font-bold mb-4 text-center sm:text-left">
          DG Set Log Book (300 KVA)
        </h1>

        <button
          onClick={addNewRow}
          className="bg-green-500 text-white px-3 py-1 rounded mb-2"
        >
          + Add New Row
        </button>

        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-300 text-xs sm:text-sm">
            <thead className="bg-gray-200">
              <tr>
                <th className="border px-2 py-1">Date</th>
                <th className="border px-2 py-1">Start Time</th>
                <th className="border px-2 py-1">Shutdown Time</th>
                <th className="border px-2 py-1">Net Running</th>
                <th className="border px-2 py-1">Diesel Qty</th>
                <th className="border px-2 py-1">Sign Plant Manager</th>
                <th className="border px-2 py-1">Remarks</th>
                <th className="border px-2 py-1">Attachments</th>
                <th className="border px-2 py-1">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r._id || i} ref={i === rows.length - 1 ? lastRowRef : null}>
<td className="border px-2 py-1">
  {ddmmyyyy(r.date || new Date())}
</td>
                  <td className="border px-2 py-1">
                    <input
                      type="time"
                      value={r.startTime || ""}
                      onChange={(e) => handleInputChange(i, "startTime", e.target.value)}
                      className="w-24 border p-1"
                    />
                  </td>
                  <td className="border px-2 py-1">
                    <input
                      type="time"
                      value={r.shutdownTime || ""}
                      onChange={(e) => handleInputChange(i, "shutdownTime", e.target.value)}
                      className="w-24 border p-1"
                    />
                  </td>
                  <td className="border px-2 py-1">{r.netRunning || "-"}</td>
                  <td className="border px-2 py-1">
                    <input
                      type="number"
                      value={r.dieselQuantity || ""}
                      onChange={(e) => handleInputChange(i, "dieselQuantity", e.target.value)}
                      className="w-20 border p-1"
                    />
                  </td>
                  <td className="border px-2 py-1">
                    {["accounts", "admin"].includes(user.role) ? (
                      <>
                        <input
                          type="checkbox"
                          checked={r.checked || false}
                          onChange={() => handleInputChange(i, "checked", !r.checked)}
                        />
                        {r.checked && <span className="ml-1">{user.name}</span>}
                      </>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="border px-2 py-1">
                    <textarea
                      value={r.remarks || ""}
                      onChange={(e) => handleInputChange(i, "remarks", e.target.value)}
                      className="w-40 border p-1 resize-y"
                      rows={2}
                    />
                  </td>
                <td className="border px-2 py-1">
  <input
    type="file"
    multiple
    accept="image/*,.pdf"
    onChange={(e) => handleFileUpload(e, i)}
    disabled={uploading}
    className="text-xs mb-1 bg-amber-200 p-2"
  />
  <div className="flex flex-wrap gap-1">
    {r.attachments?.map((file, idx) => (
      <div key={idx} className="relative group flex items-center bg-gray-100 rounded p-1">
        {/* File thumbnail or icon */}
        {file.resource_type === 'image' ? (
          <img 
            src={file.url} 
            alt={file.original_filename}
            className="w-8 h-8 object-cover rounded mr-1 cursor-pointer"
            onClick={() => showFileInSwal(file)}
          />
        ) : (
          <div 
            className="w-8 h-8 bg-blue-100 flex items-center justify-center rounded mr-1 cursor-pointer"
            onClick={() => showFileInSwal(file)}
          >
            <span className="text-xs">📄</span>
          </div>
        )}
        
       
        
       {/* Delete button */}
{r._id && (
  <button
    onClick={() => handleDeleteFile(r._id, file.public_id)}
    className="ml-1 text-red-500 text-xs hover:text-red-700"
    title="Delete file"
  >
    ×
  </button>
)}

      </div>
    ))}
  </div>
</td>
                <td className="border px-2 py-1">
  <div className="flex flex-wrap gap-2">
    <button
      onClick={() => handleSave(r)}
      className="bg-blue-500 text-white px-3 py-1 rounded text-xs sm:text-sm flex-1 sm:flex-none"
      disabled={saving}
    >
      Save
    </button>
    {r._id && (
      <button
        onClick={() => handleDeleteRow(r._id)}
        className="bg-red-500 text-white px-3 py-1 rounded text-xs sm:text-sm flex-1 sm:flex-none"
      >
        Delete
      </button>
    )}
  </div>
</td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap justify-center mt-4 gap-2">
          {[...Array(totalPages).keys()].map((n) => (
            <button
              key={n}
              onClick={() => fetchData(n + 1)}
              className={`px-2 py-1 rounded text-xs ${
                page === n + 1 ? "bg-blue-500 text-white" : "bg-gray-200"
              }`}
            >
              {n + 1}
            </button>
          ))}
        </div>
   {(uploading || deleting || saving) && (
  <div className="fixed inset-0 bg-[#000000ad] bg-opacity-40 flex items-center justify-center z-50">
    <div className="bg-white p-4 rounded shadow flex flex-col items-center">
      <div className="loader border-4 border-blue-500 border-t-transparent rounded-full w-8 h-8 animate-spin mb-2"></div>
      <p className="text-sm text-gray-700">
        {uploading
          ? "Uploading files..."
          : deleting
          ? "Deleting file..."
          : "Saving row..."}
      </p>
    </div>
  </div>
)}


      </div>
    </>
  );
}
