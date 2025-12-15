import { useEffect, useState } from "react";
import InternalNavbar from "../components/InternalNavbar";
import axiosInstance from "../axiosInstance";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const MySwal = withReactContent(Swal);

export default function AirCompressorMaintenance() {
  const [entries, setEntries] = useState([]);
const [existingFiles, setExistingFiles] = useState([]); // existing uploaded files
const [deletingFiles, setDeletingFiles] = useState({}); // Track deleting files by URL
const [selectedCompressor, setSelectedCompressor] = useState(""); // Add this line
  const [formData, setFormData] = useState({
      compressorName: "china-made-120-hp", // default value
    runningHours: "",
    foamCleaning: "No",
    currentConsumption: "",
    maintenanceActivity: "",
    oilAdded: "",
    sign: "",
    remarks: "",
  });
  const [files, setFiles] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  // Editable row states
  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [editFiles, setEditFiles] = useState([]);



const fetchLogs = async (pageNum = 1) => {
  try {
    setLoading(true);
    let url = `/air-compressors?page=${pageNum}&limit=${limit}`;
    
    // Add date filter if selected
    if (selectedDate) {
      url += `&date=${selectedDate}`;
    }
    
    // Add compressor filter if selected
    if (selectedCompressor) {
      url += `&compressorName=${selectedCompressor}`;
    }
    
    const res = await axiosInstance.get(url);
    setEntries(res.data.logs);
    setTotalPages(res.data.totalPages);
  } catch (err) {
    console.error("Error fetching logs:", err);
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    fetchLogs(page);
  }, [page,selectedDate, selectedCompressor]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({ ...prev, [name]: value }));
  };

const handleAddRow = async () => {
  if (!formData.runningHours || !formData.currentConsumption) {
    alert("Please fill all required fields");
    return;
  }

  try {
    setLoading(true);
    const fd = new FormData();
    Object.entries(formData).forEach(([key, val]) => fd.append(key, val));
    
    // Append files only if they exist (optional)
    files.forEach((file) => fd.append("files", file));

    await axiosInstance.post("/air-compressors", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    fetchLogs(page);
    setFormData({
        compressorName: "china-made-120-hp", // Reset to default
      runningHours: "",
      foamCleaning: "No",
      currentConsumption: "",
      maintenanceActivity: "",
      oilAdded: "",
      sign: "",
      remarks: "",
    });
    setFiles([]);
  } catch (err) {
    console.error("Error saving log:", err);
    alert("Failed to save entry. Try again.");
  } finally {
    setLoading(false);
  }
};

const startEditing = (entry) => {
  setEditingId(entry._id);
  setEditFormData({
        compressorName: entry.compressorName,
    runningHours: entry.runningHours,
    foamCleaning: entry.foamCleaning,
    currentConsumption: entry.currentConsumption,
    maintenanceActivity: entry.maintenanceActivity,
    oilAdded: entry.oilAdded,
    sign: entry.sign,
    remarks: entry.remarks,
  });
  setEditFiles([]);
  setExistingFiles(entry.uploadedFiles || []); // populate existing files
};

const cancelEditing = () => {
  setEditingId(null);
  setEditFormData({});
  setEditFiles([]);
  setExistingFiles([]);
};

const saveEdit = async (id) => {
  if (!editFormData.compressorName || !editFormData.runningHours || !editFormData.currentConsumption) {
    alert("Please fill all required fields including Compressor Name");
    return;
  }

  try {
    setLoading(true);
    const fd = new FormData();

    // Append updated fields
    Object.entries(editFormData).forEach(([key, val]) => fd.append(key, val));

    // Append new files only if they exist (optional)
    editFiles.forEach((file) => fd.append("files", file));

    // Send existing file URLs as JSON string
    fd.append("existingFiles", JSON.stringify(existingFiles));

    await axiosInstance.put(`/air-compressors/${id}`, fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    fetchLogs(page);
    cancelEditing();
  } catch (err) {
    console.error("Error updating log:", err);
    alert("Failed to update entry. Try again.");
  } finally {
    setLoading(false);
  }
};

const openFileModal = (url) => {
  const isImage = url.match(/\.(jpeg|jpg|gif|png|webp)$/i);
  const isPDF = url.match(/\.pdf$/i);

  if (isImage) {
    MySwal.fire({
      imageUrl: url,
      imageAlt: 'File preview',
      showCloseButton: true,
      showConfirmButton: false,
      width: '60%',
    });
  } else if (isPDF) {
    MySwal.fire({
      html: `<iframe src="${url}" width="100%" height="500px"></iframe>`,
      width: '80%',
      showCloseButton: true,
      showConfirmButton: false,
    });
  } else {
    // Fallback for other file types
    window.open(url, "_blank");
  }
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  
  // If it's already in YYYY-MM-DD format, convert to locale
  if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB');
  }
  
  // If it's already in locale format, return as is
  return dateString;
};

  return (
    <div className="min-h-screen bg-slate-100">
      <InternalNavbar />
      <div className="max-w-7xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-center text-blue-800 mb-8">
          Air Compressor Maintenance Log Book
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
                Cleaning of Compressor on Every Sunday.
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
{/* Add this above the table */}
<div className="mb-4">
  {/* Filters container */}
  <div className="bg-gray-50 p-3 sm:p-4 rounded-lg border">
    <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
      {/* Date Filter */}
      <div className="flex flex-col">
        <label htmlFor="dateFilter" className="text-xs sm:text-sm font-medium text-gray-700 mb-1">
          Filter by Date:
        </label>
        <input
          type="date"
          id="dateFilter"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="border rounded p-2 text-sm w-full"
        />
      </div>
      
      {/* Compressor Filter */}
      <div className="flex flex-col">
        <label htmlFor="compressorFilter" className="text-xs sm:text-sm font-medium text-gray-700 mb-1">
          Filter by Compressor:
        </label>
        <select
          id="compressorFilter"
          value={selectedCompressor}
          onChange={(e) => setSelectedCompressor(e.target.value)}
          className="border rounded p-2 text-sm w-full"
        >
          <option value="">All Compressors</option>
          <option value="china-made-120-hp">China Made - 120 HP</option>
          <option value="china-made-30-hp">China Made - 30 HP</option>
          <option value="cp-60-hp">CP - 60 HP</option>
        </select>
      </div>
      
      {/* Clear Button - on mobile it spans full width, on desktop it's inline */}
      <div className="flex flex-col sm:col-span-1 lg:col-span-2">
        <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1 invisible sm:visible">
          &nbsp;
        </label>
        <button
          onClick={() => {
            setSelectedDate("");
            setSelectedCompressor("");
            setPage(1);
            fetchLogs(1);
          }}
          className="px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded text-sm w-full sm:w-auto"
        >
          Clear All Filters
        </button>
      </div>
    </div>
  </div>
</div>
        <div className="overflow-x-auto bg-white shadow-lg rounded-2xl p-4">
          <table className="min-w-full border border-slate-300 text-sm text-center">
            <thead className="bg-blue-600 text-white">
              <tr>
                  <th className="border px-3 py-2">Air Compressor</th>
                <th className="border px-3 py-2">Date</th>
                <th className="border px-3 py-2">Compressor Running Hours (Dont mention Loading Hours, Mention Running Hours)</th>
                <th className="border px-3 py-2">Compressor Suction Foam Cleaning Done (Yes/No)</th>
                <th className="border px-3 py-2">Compressor Current Consumption in Amperes (A)</th>
                <th className="border px-3 py-2">Type of Maintenance Activity Done (Mention Air Filters, Oil Filters, Air/Oil separator changed)</th> 
                <th className="border px-3 py-2">Quantity of Oil Added</th>
                <th className="border px-3 py-2">Sign of Plant Manager</th>
                <th className="border px-3 py-2">Remarks (Mention any Maintenance Required)</th>
                <th className="border px-3 py-2">Files</th>
                <th className="border px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, i) => {
                const isEditing = editingId === entry._id;
                return (
                  <tr key={entry._id || i} className="border-b">
                  <td className="border px-3 py-2">
  {isEditing ? (
    <select
      name="compressorName"
      value={editFormData.compressorName}
      onChange={handleEditChange}
      className="w-full border rounded p-1"
    >
      <option value="china-made-120-hp">China Made - 120 HP</option>
      <option value="china-made-30-hp">China Made - 30 HP</option>
      <option value="cp-60-hp">CP - 60 HP</option>
    </select>
  ) : (
    entry.compressorName === "china-made-120-hp" ? "China Made - 120 HP" :
    entry.compressorName === "china-made-30-hp" ? "China Made - 30 HP" :
    entry.compressorName === "cp-60-hp" ? "CP - 60 HP" : entry.compressorName
  )}
</td>
<td className="border px-3 py-2">
  {formatDate(entry.date)}
</td>                   
 <td className="border px-3 py-2">
                      {isEditing ? (
                        <input
                          type="number"
                          name="runningHours"
                          value={editFormData.runningHours}
                          onChange={handleEditChange}
                          className="w-full border rounded p-1"
                        />
                      ) : (
                        entry.runningHours
                      )}
                    </td>
                    <td className="border px-3 py-2">
                      {isEditing ? (
                        <select
                          name="foamCleaning"
                          value={editFormData.foamCleaning}
                          onChange={handleEditChange}
                          className="w-full border rounded p-1"
                        >
                          <option value="No">No</option>
                          <option value="Yes">Yes</option>
                        </select>
                      ) : (
                        entry.foamCleaning
                      )}
                    </td>
                    <td className="border px-3 py-2">
                      {isEditing ? (
                        <input
                          type="number"
                          name="currentConsumption"
                          value={editFormData.currentConsumption}
                          onChange={handleEditChange}
                          className="w-full border rounded p-1"
                        />
                      ) : (
                        entry.currentConsumption
                      )}
                    </td>
                    <td className="border px-3 py-2">
                      {isEditing ? (
                        <input
                          type="text"
                          name="maintenanceActivity"
                          value={editFormData.maintenanceActivity}
                          onChange={handleEditChange}
                          className="w-full border rounded p-1"
                        />
                      ) : (
                        entry.maintenanceActivity
                      )}
                    </td>
                    <td className="border px-3 py-2">
                      {isEditing ? (
                        <input
                          type="text"
                          name="oilAdded"
                          value={editFormData.oilAdded}
                          onChange={handleEditChange}
                          className="w-full border rounded p-1"
                        />
                      ) : (
                        entry.oilAdded
                      )}
                    </td>
                    <td className="border px-3 py-2">
                      {isEditing ? (
                        <input
                          type="text"
                          name="sign"
                          value={editFormData.sign}
                          onChange={handleEditChange}
                          className="w-full border rounded p-1"
                        />
                      ) : (
                        entry.sign
                      )}
                    </td>
                    <td className="border px-3 py-2">
                      {isEditing ? (
                        <input
                          type="text"
                          name="remarks"
                          value={editFormData.remarks}
                          onChange={handleEditChange}
                          className="w-full border rounded p-1"
                        />
                      ) : (
                        entry.remarks
                      )}
                    </td>
           <td className="border px-3 py-2 space-y-2 min-w-[180px] sm:min-w-[220px]">
  <div className="flex flex-wrap gap-2">
    {isEditing ? (
      <>
        {existingFiles.map((url, idx) => (
          <div key={idx} className="flex items-center gap-2 p-1 border rounded">
            <button
              type="button"
              onClick={() => openFileModal(url)}
              className="flex items-center justify-center"
            >
              {url.match(/\.(jpeg|jpg|gif|png|webp)$/i) && (
                <img
                  src={url}
                  className="w-16 h-16 sm:w-12 sm:h-12 object-cover rounded"
                  alt={`File ${idx + 1}`}
                />
              )}
              {url.match(/\.pdf$/i) && <span className="text-sm sm:text-xs">📄 File {idx + 1}</span>}
              {!url.match(/\.(jpeg|jpg|gif|png|webp|pdf)$/i) && (
                <span className="text-sm sm:text-xs">File {idx + 1}</span>
              )}
            </button>
            <button
              type="button"
              onClick={async () => {
                try {
                  setDeletingFiles((prev) => ({ ...prev, [url]: true }));
                  await axiosInstance.delete("/air-compressors/file", {
                    data: { entryId: entry._id, fileUrl: url },
                  });
                  setExistingFiles((prev) => prev.filter((f) => f !== url));
                } catch (err) {
                  console.error("Failed to delete file:", err);
                  alert("Failed to delete file. Try again.");
                } finally {
                  setDeletingFiles((prev) => ({ ...prev, [url]: false }));
                }
              }}
              disabled={deletingFiles[url]}
              className={`px-2 py-1 rounded flex items-center gap-1 ${
                deletingFiles[url] ? "bg-gray-400 cursor-not-allowed" : "bg-red-600 hover:bg-red-700"
              } text-white text-xs`}
            >
              {deletingFiles[url] ? "Deleting..." : "Delete"}
            </button>
          </div>
        ))}

        {/* File upload input */}
        <div className="w-full mt-2">
          <input
            type="file"
            multiple
            accept="image/*,.pdf"
            onChange={(e) => setEditFiles(Array.from(e.target.files))}
            className="w-full border rounded p-1 text-xs"
          />
          {editFiles.length > 0 && (
            <div className="text-xs text-green-600 mt-1">{editFiles.length} file(s) selected for upload</div>
          )}
        </div>
      </>
    ) : (
      entry.uploadedFiles?.map((url, idx) => (
        <button
          key={idx}
          type="button"
          onClick={() => openFileModal(url)}
          className="border rounded p-1 m-1 inline-block w-16 h-16 sm:w-12 sm:h-12"
        >
          {url.match(/\.(jpeg|jpg|gif|png|webp)$/i) && (
            <img src={url} className="w-full h-full object-cover rounded" alt={`File ${idx + 1}`} />
          )}
          {url.match(/\.pdf$/i) && <span className="text-sm sm:text-xs">📄 {idx + 1}</span>}
          {!url.match(/\.(jpeg|jpg|gif|png|webp|pdf)$/i) && (
            <span className="text-sm sm:text-xs">File {idx + 1}</span>
          )}
        </button>
      ))
    )}
  </div>
</td>


                    <td className="border px-3 py-2 space-x-2">
                      {isEditing ? (
                        <>
                          <button
                            onClick={() => saveEdit(entry._id)}
                            className="px-2 py-1 bg-green-600 text-white rounded"
                          >
                            Save
                          </button>
                         
                        </>
                      ) : (
                        <button
                          onClick={() => startEditing(entry)}
                          className="px-2 py-1 bg-blue-600 text-white rounded"
                        >
                          Edit
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}

              {/* Input Row for new entry */}
              <tr className="bg-slate-50">
               <td className="border px-3 py-2">
  <select
    name="compressorName"
    value={formData.compressorName}
    onChange={handleChange}
    className="w-full border rounded p-1"
  >
    <option value="china-made-120-hp">China Made - 120 HP</option>
    <option value="china-made-30-hp">China Made - 30 HP</option>
    <option value="cp-60-hp">CP - 60 HP</option>
  </select>
</td>
<td className="border px-3 py-2 font-medium text-blue-700">
  {new Date().toLocaleDateString()}
</td>
                <td className="border px-3 py-2">
                  <input
                    type="number"
                    name="runningHours"
                    value={formData.runningHours}
                    onChange={handleChange}
                    className="w-full border rounded p-1"
                    placeholder="hrs"
                  />
                </td>
                <td className="border px-3 py-2">
                  <select
                    name="foamCleaning"
                    value={formData.foamCleaning}
                    onChange={handleChange}
                    className="w-full border rounded p-1"
                  >
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </td>
                <td className="border px-3 py-2">
                  <input
                    type="number"
                    name="currentConsumption"
                    value={formData.currentConsumption}
                    onChange={handleChange}
                    className="w-full border rounded p-1"
                    placeholder="A"
                  />
                </td>
                <td className="border px-3 py-2">
                  <input
                    type="text"
                    name="maintenanceActivity"
                    value={formData.maintenanceActivity}
                    onChange={handleChange}
                    className="w-full border rounded p-1"
                    placeholder="Air filters, Oil filters..."
                  />
                </td>
                <td className="border px-3 py-2">
                  <input
                    type="text"
                    name="oilAdded"
                    value={formData.oilAdded}
                    onChange={handleChange}
                    className="w-full border rounded p-1"
                    placeholder="litres"
                  />
                </td>
                <td className="border px-3 py-2">
                  <input
                    type="text"
                    name="sign"
                    value={formData.sign}
                    onChange={handleChange}
                    className="w-full border rounded p-1"
                    placeholder="Signature"
                  />
                </td>
                <td className="border px-3 py-2">
                  <input
                    type="text"
                    name="remarks"
                    value={formData.remarks}
                    onChange={handleChange}
                    className="w-full border rounded p-1"
                    placeholder="Remarks"
                  />
                </td>
                <td className="border px-3 py-2">
                  <input
                    type="file"
                    multiple
                    accept="image/*,.pdf"
                    onChange={(e) => setFiles(Array.from(e.target.files))}
                    className="w-full border rounded p-1"
                  />
                </td>
                <td className="border px-3 py-2">
                  <button
                    onClick={handleAddRow}
                    disabled={loading}
                    className={`${
                      loading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
                    } text-white font-semibold px-4 py-1 rounded-lg`}
                  >
                    {loading ? "Saving..." : "Add"}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>

          {/* Pagination */}
          <div className="flex justify-between items-center mt-6">
            <div>
              Page {page} of {totalPages}
            </div>
            <div className="space-x-3">
              <button
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page === 1 || loading}
                className="px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded-lg disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                disabled={page === totalPages || loading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
