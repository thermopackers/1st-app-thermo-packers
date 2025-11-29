import { useEffect, useState } from "react";
import axiosInstance from "../axiosInstance";
import InternalNavbar from "../components/InternalNavbar";
import Swal from "sweetalert2";

export default function BoilerMaintenance() {
  const [logs, setLogs] = useState([]);
   const [deletingFile, setDeletingFile] = useState(null); // Track which file is being deleted
  const [savingEntry, setSavingEntry] = useState(false); // Track if entry is being saved
    const [filterDate, setFilterDate] = useState(""); // Add this line for date filter
  const [form, setForm] = useState({
    date: new Date().toLocaleDateString('en-GB'),
    boilerRunningTime: "",
    chemicalQty: "",
    saltQty: "",
    blowDownTime: "",
    blowDownDuration: "",
    remarks: "",
    uploadedFiles: [],
  });
  // Utility to extract file URL regardless of storage format
const getFileUrl = (file) => {
  if (typeof file === 'string') return file;
  if (typeof file === 'object' && file !== null) {
    return file.url || Object.values(file).join('');
  }
  return String(file);
};

// Utility to calculate time difference in hours
const calculateTimeDifference = (startTime, endTime) => {
  if (!startTime || !endTime) return "";
  
  try {
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const [endHours, endMinutes] = endTime.split(':').map(Number);
    
    let startTotalMinutes = startHours * 60 + startMinutes;
    let endTotalMinutes = endHours * 60 + endMinutes;
    
    // Handle case where end time is next day
    if (endTotalMinutes < startTotalMinutes) {
      endTotalMinutes += 24 * 60; // Add 24 hours
    }
    
    const diffMinutes = endTotalMinutes - startTotalMinutes;
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  } catch (error) {
    console.error('Error calculating time difference:', error);
    return "";
  }
};

  const [files, setFiles] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [newFiles, setNewFiles] = useState([]);

  useEffect(() => {
    fetchLogs(page);
  }, [page]);

  const fetchLogs = async (pageNum) => {
    try {
      const res = await axiosInstance.get(`/boiler?page=${pageNum}&limit=10`);
      setLogs(res.data.logs);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      console.error("Error fetching logs:", err);
    }
  };

// ✅ Add new entry
const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    setSavingEntry(true);
    let uploadedUrls = [];
    if (files.length > 0) {
      const uploadData = new FormData();
      files.forEach((file) => uploadData.append("files", file));
      const uploadRes = await axiosInstance.post("/boiler/upload", uploadData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      
      // Ensure URLs are properly formatted strings
      uploadedUrls = uploadRes.data.urls.map(url => {
        if (typeof url === 'string') {
          return url;
        } else if (typeof url === 'object' && url !== null) {
          // If it's an object, try to reconstruct the string
          return Object.values(url).join('');
        }
        return String(url);
      });
    }

    await axiosInstance.post("/boiler", { ...form, uploadedFiles: uploadedUrls });

     setForm({
      date: new Date().toLocaleDateString('en-GB'),
      boilerRunningTime: "",
      chemicalQty: "",
      saltQty: "",
      blowDownTime: "",
      blowDownDuration: "",
      remarks: "",
      uploadedFiles: [],
    });
    setFiles([]);
    fetchLogs(page);
  } catch (err) {
    console.error("Error saving log:", err);
    alert("Error saving entry.");
  } finally {
    setSavingEntry(false);
  }
};

// ✅ Start editing - FIXED
const handleEdit = (entry) => {
  setEditingId(entry._id);
  // Ensure uploadedFiles is properly formatted as array of strings
  const formattedEntry = {
    ...entry,
    uploadedFiles: Array.isArray(entry.uploadedFiles) 
      ? entry.uploadedFiles.map(file => 
          typeof file === 'object' ? file.url : file
        )
      : []
  };
  setEditData(formattedEntry);
};

// ✅ Save changes - FIXED
const handleSave = async (id) => {
  try {
    setSavingEntry(true);
    let updatedFiles = [...(editData.uploadedFiles || [])];

    // Upload new files
    if (newFiles.length > 0) {
      const uploadData = new FormData();
      newFiles.forEach((file) => uploadData.append("files", file));
      const uploadRes = await axiosInstance.post("/boiler/upload", uploadData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      
      // Ensure new URLs are proper strings
      const newUrls = uploadRes.data.urls.map(url => {
        if (typeof url === 'string') {
          return url;
        } else if (typeof url === 'object' && url !== null) {
          return Object.values(url).join('');
        }
        return String(url);
      });
      
      updatedFiles = [...updatedFiles, ...newUrls];
    }

    // Send the update with properly formatted file data
    await axiosInstance.put(`/boiler/${id}`, { 
      ...editData, 
      uploadedFiles: updatedFiles 
    });

    Swal.fire("Updated!", "Entry updated successfully.", "success");
    setEditingId(null);
    setNewFiles([]);
    fetchLogs(page);
  } catch (err) {
    console.error("Error updating entry:", err);
    Swal.fire("Error", "Failed to update entry.", "error");
  } finally {
    setSavingEntry(false);
  }
};

  // ✅ Cancel editing
  const handleCancel = () => {
    setEditingId(null);
    setEditData({});
    setNewFiles([]);
  };

 // ✅ Delete a file from Cloudinary and DB - FIXED
const handleFileDelete = async (url, entryId) => {
  const confirm = await Swal.fire({
    title: "Delete File?",
    text: "This will remove it permanently from Cloudinary.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Yes, delete it",
  });

  if (confirm.isConfirmed) {
    try {
      setDeletingFile(url); // Set the file being deleted
      
      // Delete from Cloudinary
      await axiosInstance.delete("/boiler/file", { 
        data: { fileUrl: url } 
      });
      
      // Update the edit data to remove the deleted file
      const updatedFiles = editData.uploadedFiles.filter((file) => file !== url);
      setEditData({ ...editData, uploadedFiles: updatedFiles });
      
      // Immediately update the database
      await axiosInstance.put(`/boiler/${entryId}`, { 
        ...editData, 
        uploadedFiles: updatedFiles 
      });
      
      Swal.fire("Deleted!", "File removed successfully.", "success");
    } catch (error) {
      console.error("File deletion error:", error);
      Swal.fire({
        title: "Error", 
        text: error.response?.data?.message || "Could not delete file.",
        icon: "error"
      });
    } finally {
      setDeletingFile(null); // Clear the deleting state
    }
  }
};
 // ✅ Open file in modal
const openFile = (url, i) => {
  // Add safety check
  if (typeof url !== 'string') {
    console.error('Invalid URL provided to openFile:', url);
    Swal.fire({
      title: `Error`,
      text: "Cannot open file - invalid URL",
      icon: "error",
      showCloseButton: true,
      showConfirmButton: false,
    });
    return;
  }

  const isImage = url.match(/\.(jpeg|jpg|gif|png|webp)$/i);
  const isPDF = url.match(/\.pdf$/i);

  if (isImage) {
    Swal.fire({
      imageUrl: url,
      imageAlt: `File ${i + 1}`,
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

  return (
    <div className="min-h-screen bg-slate-100">
      <InternalNavbar />
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-center text-slate-900 mb-8">
          Boiler Monthly Running Report
        </h1>


        {/* IMPORTANT NOTICE MESSAGE - VIVID VERSION */}
        <div className="bg-gradient-to-r from-red-500 to-orange-500 border-4 border-yellow-300 text-white p-6 mb-6 shadow-2xl rounded-lg transform hover:scale-105 transition-all duration-500">
          <div className="flex items-center justify-center">
            <div className="flex-shrink-0 mr-4">
              <svg className="h-8 w-8 text-white animate-bounce" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-xl font-extrabold tracking-wide uppercase drop-shadow-lg">
                ⚠️ IMPORTANT NOTICE ⚠️
              </p>
              <p className="text-lg font-bold mt-2 drop-shadow-md">
                Cleaning of Boiler Pipes, Tubes & Ash Every Sunday.
              </p>
              <p className="text-sm font-semibold mt-1 opacity-90">
                Please ensure compliance with maintenance schedule
              </p>
            </div>
            <div className="flex-shrink-0 ml-4">
              <svg className="h-8 w-8 text-white animate-bounce" fill="currentColor" viewBox="0 0 20 20" style={{animationDelay: '0.2s'}}>
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
        {/* ADD FORM */}
        <form onSubmit={handleSubmit} className="bg-white shadow-lg rounded-lg p-6 mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                  <div>
              <label className="block text-sm font-medium mb-1">Date</label>
              <input
                type="text"
                value={form.date || new Date().toLocaleDateString('en-GB')}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="border rounded p-2 w-full"
                placeholder="DD/MM/YYYY"
              />
            </div>

        {[
  ["Boiler Starting Time", "boilerRunningTime", "time"],
  ["Scale Preventing Chemical (Ltrs)", "chemicalQty", "number"],
  ["Namak / Salt (Kgs)", "saltQty", "number"],
  ["Boiler Ending Time", "blowDownTime", "time"],
].map(([label, key, type]) => (
  <div key={key}>
    <label className="block text-sm font-medium mb-1">{label}</label>
    <input
      type={type}
      value={form[key]}
      onChange={(e) => {
        const updatedForm = { ...form, [key]: e.target.value };
        // Auto-calculate duration when both times are available
        if (updatedForm.boilerRunningTime && updatedForm.blowDownTime) {
          updatedForm.blowDownDuration = calculateTimeDifference(
            updatedForm.boilerRunningTime, 
            updatedForm.blowDownTime
          );
        }
        setForm(updatedForm);
      }}
      className="border rounded p-2 w-full"
    />
  </div>
))}

{/* Duration Field - Readonly and auto-calculated */}
<div>
  <label className="block text-sm font-medium mb-1">
    Duration of Blow Down (before ending the Boiler)
  </label>
  <input
    type="text"
    value={form.blowDownDuration}
    readOnly
    className="border rounded p-2 w-full bg-gray-100"
    placeholder="Auto-calculated"
  />
</div>

            <div>
              <label className="block text-sm font-medium mb-1">Upload Files (images or PDFs)</label>
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
                placeholder="Enter any additional notes"
                value={form.remarks}
                onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                className="border rounded p-2 w-full"
              />
            </div>
          </div>

                    <button
            type="submit"
            disabled={savingEntry}
            className="mt-6 bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition disabled:opacity-50"
          >
            {savingEntry ? "Saving..." : "Add Entry"}
          </button>
        </form>

  {/* DATE FILTER */}
        <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <label className="block text-sm font-medium mb-1 sm:mb-0">
              Filter by Date:
            </label>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="border rounded p-2 w-full sm:w-auto"
            />
            <button
              onClick={() => setFilterDate("")}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition"
            >
              Clear Filter
            </button>
          </div>
        </div>

        {/* TABLE */}
        <div className="overflow-x-auto bg-white shadow rounded-lg">
          <table className="min-w-full border-collapse">
            <thead className="bg-slate-200 text-left">
              <tr>
                <th className="border p-2">Date</th>
                <th className="border p-2">Boiler Starting Time</th>
                <th className="border p-2">Chemical (Ltrs)</th>
                <th className="border p-2">Salt (Kgs)</th>
                <th className="border p-2">Boiler Ending Time</th>
                <th className="border p-2">Duration</th>
                <th className="border p-2 min-w-[200px]">Files</th>
                <th className="border p-2">Remarks</th>
                <th className="border p-2 text-center">Actions</th>
              </tr>
            </thead>

                                   <tbody>
              {logs
                .filter((entry) => {
                  if (!filterDate) return true;
                  
                  // Convert filter date to dd/mm/yyyy format for comparison
                  const filterDateObj = new Date(filterDate);
                  const filterDateFormatted = filterDateObj.toLocaleDateString('en-GB');
                  
                  return entry.date === filterDateFormatted;
                })
                .map((entry) => (
                             <tr key={entry._id}>
                  <td className="border p-2">
                    {editingId === entry._id ? (
                      <input
                        type="text"
                        value={editData.date || entry.date}
                        onChange={(e) =>
                          setEditData({ ...editData, date: e.target.value })
                        }
                        className="border rounded p-1 w-full"
                        placeholder="DD/MM/YYYY"
                      />
                    ) : (
                      entry.date
                    )}
                  </td>
                  {[
  "boilerRunningTime",
  "chemicalQty",
  "saltQty",
  "blowDownTime",
].map((key) => (
  <td key={key} className="border p-2">
    {editingId === entry._id ? (
      <input
        type="text"
        value={editData[key] || ""}
        onChange={(e) => {
          const updatedEditData = { ...editData, [key]: e.target.value };
          // Auto-calculate duration when both times are available in edit mode
          if (updatedEditData.boilerRunningTime && updatedEditData.blowDownTime) {
            updatedEditData.blowDownDuration = calculateTimeDifference(
              updatedEditData.boilerRunningTime, 
              updatedEditData.blowDownTime
            );
          }
          setEditData(updatedEditData);
        }}
        className="border rounded p-1 w-full"
      />
    ) : (
      entry[key]
    )}
  </td>
))}

{/* Duration Field - Readonly in edit mode */}
<td className="border p-2">
  {editingId === entry._id ? (
    <input
      type="text"
      value={editData.blowDownDuration || ""}
      readOnly
      className="border rounded p-1 w-full bg-gray-100"
    />
  ) : (
    entry.blowDownDuration
  )}
</td>

         {/* FILE THUMBNAILS - FIXED */}
<td className="border p-2 flex flex-wrap gap-2">
  {(editingId === entry._id
    ? editData.uploadedFiles
    : entry.uploadedFiles
  )?.map((file, i) => {
    const fileUrl = getFileUrl(file);
    
    if (typeof fileUrl !== 'string' || !fileUrl) {
      console.warn('Invalid file URL:', file);
      return null;
    }
    
    const isImage = fileUrl.match(/\.(jpeg|jpg|gif|png|webp)$/i);
    const isPDF = fileUrl.match(/\.pdf$/i);
    
    return (
      <div key={i} className="relative">
        <button
          onClick={() => openFile(fileUrl, i)}
          className="border rounded overflow-hidden w-16 h-16 flex items-center justify-center cursor-pointer"
        >
          {isImage ? (
            <img
              src={fileUrl}
              className="object-cover w-full h-full"
              alt={`File ${i + 1}`}
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          ) : (
            <span className="text-xs text-center">📄 {i + 1}</span>
          )}
        </button>
        {editingId === entry._id && (
                  <button
          onClick={() => handleFileDelete(fileUrl, entry._id)}
          disabled={deletingFile === fileUrl}
          className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center"
        >
          {deletingFile === fileUrl ? (
            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            "×"
          )}
        </button>
        )}
      </div>
    );
  })}

  {editingId === entry._id && (
    <input
      type="file"
      multiple
      accept="image/*,.pdf"
      onChange={(e) => setNewFiles(Array.from(e.target.files))}
      className="border rounded p-1 text-xs"
    />
  )}
</td>

                  <td className="border p-2">
                    {editingId === entry._id ? (
                      <textarea
                        value={editData.remarks || ""}
                        onChange={(e) =>
                          setEditData({ ...editData, remarks: e.target.value })
                        }
                        className="border rounded p-1 w-full"
                      />
                    ) : (
                      entry.remarks
                    )}
                  </td>

                  <td className="border p-2 text-center">
                    {editingId === entry._id ? (
                      <>
                                               <button
                          onClick={() => handleSave(entry._id)}
                          disabled={savingEntry}
                          className="bg-green-600 text-white px-3 py-1 rounded mr-2 disabled:opacity-50"
                        >
                          {savingEntry ? "Saving..." : "Save"}
                        </button>
                        
                      </>
                    ) : (
                      <button
                        onClick={() => handleEdit(entry)}
                        className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded"
                      >
                        Edit
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        <div className="flex justify-center items-center gap-2 mt-4">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-3 py-1 bg-gray-300 rounded disabled:opacity-50"
          >
            Prev
          </button>
          <span>
            Page {page} of {totalPages}
          </span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1 bg-gray-300 rounded disabled:opacity-50"
          >
            Next
          </button>
           {/* Saving Entry Loader Overlay */}
        {savingEntry && (
          <div className="fixed inset-0 bg-[#000000ab] bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 flex flex-col items-center">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-lg font-medium">Saving Entry...</p>
              <p className="text-sm text-gray-600">Please wait while we save your data</p>
            </div>
          </div>
        )}

        {/* Deleting File Loader Overlay */}
        {deletingFile && (
          <div className="fixed inset-0 bg-[#000000ab] bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 flex flex-col items-center">
              <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-lg font-medium">Deleting File...</p>
              <p className="text-sm text-gray-600">Please wait while we remove the file</p>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
