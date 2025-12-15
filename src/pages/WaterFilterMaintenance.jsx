import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import Swal from "sweetalert2";
import InternalNavbar from "../components/InternalNavbar";
import { useUserContext } from "../context/UserContext";
import axiosInstance from "../axiosInstance";

export default function WaterFilterMaintenance() {
  const { user } = useUserContext();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [isLoadingAction, setIsLoadingAction] = useState(false);
  
  // Pagination state
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalEntries: 0,
    hasNextPage: false,
    hasPrevPage: false,
    limit: 10
  });

  // New entry form state
  const [newEntry, setNewEntry] = useState({
    date: "",
    maintenanceActivity: "",
    serviceDoneBy: "",
  });

  // Edit entry form state
  const [editEntry, setEditEntry] = useState({
    date: "",
    maintenanceActivity: "",
    serviceDoneBy: "",
  });

  const [files, setFiles] = useState([]);
  const [editFiles, setEditFiles] = useState([]);
  const [filesToDelete, setFilesToDelete] = useState([]);

  // Upload files to backend - MOVE THIS FUNCTION TO TOP
  const uploadFilesToBackend = async (filesToUpload) => {
    if (filesToUpload.length === 0) return [];

    const formData = new FormData();
    filesToUpload.forEach(file => {
      formData.append('files', file);
    });

    const response = await axiosInstance.post(
      '/water-filter-maintenance/upload-files',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data.files;
  };

  // Fetch all entries with pagination
  const fetchEntries = async (page = 1) => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/water-filter-maintenance?page=${page}&limit=10`);
      setEntries(response.data.entries);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error("Error fetching entries:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewEntry({
      ...newEntry,
      [name]: value,
    });
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditEntry({
      ...editEntry,
      [name]: value,
    });
  };

  // Handle file selection
  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  const handleEditFileChange = (e) => {
    setEditFiles(Array.from(e.target.files));
  };

  // Add new entry
  const handleAddEntry = async () => {
    if (!newEntry.date || !newEntry.maintenanceActivity || !newEntry.serviceDoneBy) {
      alert("Please fill all required fields");
      return;
    }

    if (new Date(newEntry.date) > new Date()) {
      alert("Date cannot be in the future");
      return;
    }

    setIsLoadingAction(true);
    try {
      let uploadedFiles = [];
      if (files.length > 0) {
        uploadedFiles = await uploadFilesToBackend(files);
      }

      const entryData = {
        ...newEntry,
        dataEnteredBy: user?.name || "Unknown",
        files: uploadedFiles,
        enteredByUserId: user?.id,
      };

      const response = await axiosInstance.post("/water-filter-maintenance", entryData);
      
      setEntries([response.data, ...entries]);
      setNewEntry({
        date: "",
        maintenanceActivity: "",
        serviceDoneBy: "",
      });
      setFiles([]);
      if (document.getElementById("fileInput")) {
        document.getElementById("fileInput").value = "";
      }
      
      fetchEntries(pagination.currentPage);
    } catch (error) {
      console.error("Error adding entry:", error);
      alert("Failed to add entry");
    } finally {
      setIsLoadingAction(false);
    }
  };

  // Start editing an entry
  const startEdit = (entry) => {
    setEditingId(entry._id);
    setEditEntry({
      date: entry.date.split('T')[0],
      maintenanceActivity: entry.maintenanceActivity,
      serviceDoneBy: entry.serviceDoneBy,
    });
    setEditFiles([]);
    setFilesToDelete([]);
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingId(null);
    setEditEntry({
      date: "",
      maintenanceActivity: "",
      serviceDoneBy: "",
    });
    setEditFiles([]);
    setFilesToDelete([]);
  };

  // Update entry
  const handleUpdateEntry = async (id) => {
    if (!editEntry.date || !editEntry.maintenanceActivity || !editEntry.serviceDoneBy) {
      alert("Please fill all required fields");
      return;
    }

    if (new Date(editEntry.date) > new Date()) {
      alert("Date cannot be in the future");
      return;
    }

    setIsLoadingAction(true);
    try {
      const entryData = {
        date: editEntry.date,
        maintenanceActivity: editEntry.maintenanceActivity,
        serviceDoneBy: editEntry.serviceDoneBy,
        filesToDelete: filesToDelete.map(file => file.public_id),
        newFiles: []
      };

      if (editFiles.length > 0) {
        const uploadedFiles = await uploadFilesToBackend(editFiles);
        entryData.newFiles = uploadedFiles;
      }

      const response = await axiosInstance.put(`/water-filter-maintenance/${id}`, entryData);
      
      setEntries(entries.map(entry => 
        entry._id === id ? response.data : entry
      ));
      
      cancelEdit();
    } catch (error) {
      console.error("Error updating entry:", error);
      alert("Failed to update entry");
    } finally {
      setIsLoadingAction(false);
    }
  };

  // Delete entry
  const handleDeleteEntry = async (id) => {
    if (!window.confirm("Are you sure you want to delete this entry?")) {
      return;
    }

    setIsLoadingAction(true);
    try {
      await axiosInstance.delete(`/water-filter-maintenance/${id}`);
      setEntries(entries.filter(entry => entry._id !== id));
      fetchEntries(pagination.currentPage);
    } catch (error) {
      console.error("Error deleting entry:", error);
      alert("Failed to delete entry");
    } finally {
      setIsLoadingAction(false);
    }
  };

  // Mark file for deletion during edit
  const markFileForDeletion = (file) => {
    setFilesToDelete([...filesToDelete, file]);
  };

  // Unmark file for deletion
  const unmarkFileForDeletion = (file) => {
    setFilesToDelete(filesToDelete.filter(f => f.public_id !== file.public_id));
  };

  // Preview file in modal
  const previewFile = (fileUrl, fileName) => {
    const isImage = /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(fileUrl);
    
    if (isImage) {
      Swal.fire({
        title: fileName,
        html: `
          <div class="flex justify-center">
            <img src="${fileUrl}" alt="${fileName}" class="max-w-full max-h-[70vh] object-contain" />
          </div>
        `,
        showCloseButton: true,
        showConfirmButton: false,
        width: '90%',
        padding: '1rem',
        customClass: {
          popup: 'rounded-xl',
          closeButton: 'absolute top-4 right-4 text-slate-500 hover:text-slate-700'
        }
      });
    } else {
      window.open(fileUrl, '_blank');
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <InternalNavbar />
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-6">
          <NavLink 
            to="/plant-machinery-maintenance" 
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            ← Back to Plant & Machinery Maintenance
          </NavLink>
          <h1 className="text-3xl font-bold text-slate-900 mt-4">
            Water Filter Monthly Maintenance
          </h1>
        </div>
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
                Don't use soap while cleaning the tanks.
              </p>
              <p className="text-sm font-semibold mt-1 opacity-90">
                Please ensure compliance with maintenance schedule
              </p>
              <p className="text-sm font-semibold mt-1 opacity-90">
                After each 15 days, cleaning of the Tanks should be done.
              </p>
            </div>
            <div className="flex-shrink-0 ml-4">
              <svg className="h-8 w-8 text-white animate-bounce" fill="currentColor" viewBox="0 0 20 20" style={{animationDelay: '0.2s'}}>
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
        {/* Add New Entry Form */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">Add New Maintenance Entry</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Date *
              </label>
              <input
                type="date"
                name="date"
                value={newEntry.date}
                onChange={handleInputChange}
                max={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Type of Maintenance Activity *
              </label>
              <input
                type="text"
                name="maintenanceActivity"
                value={newEntry.maintenanceActivity}
                onChange={handleInputChange}
                placeholder="e.g., Filter Replacement, System Cleaning"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Service Done By *
              </label>
              <input
                type="text"
                name="serviceDoneBy"
                value={newEntry.serviceDoneBy}
                onChange={handleInputChange}
                placeholder="Name of service provider"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Upload Files (Images/Documents)
            </label>
            <input
              id="fileInput"
              type="file"
              multiple
              onChange={handleFileChange}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {files.length > 0 && (
              <p className="text-sm text-slate-600 mt-2">
                {files.length} file(s) selected
              </p>
            )}
          </div>

          <button
            onClick={handleAddEntry}
            disabled={isLoadingAction}
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoadingAction ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Adding...
              </>
            ) : (
              'Add Entry'
            )}
          </button>
        </div>

        {/* Entries Table */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-slate-600">Loading entries...</p>
              </div>
            ) : entries.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-slate-500">No maintenance entries yet. Add your first entry above.</p>
              </div>
            ) : (
              <>
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                        Maintenance Activity
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                        Service Done By
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                        Data Entered By
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                        Files
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {entries.map((entry) => (
                      <tr key={entry._id} className="hover:bg-slate-50">
                        {editingId === entry._id ? (
                          // Edit Mode
                          <>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <input
                                type="date"
                                name="date"
                                value={editEntry.date}
                                onChange={handleEditInputChange}
                                max={new Date().toISOString().split('T')[0]}
                                className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full"
                              />
                            </td>
                            <td className="px-6 py-4">
                              <input
                                type="text"
                                name="maintenanceActivity"
                                value={editEntry.maintenanceActivity}
                                onChange={handleEditInputChange}
                                className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full"
                              />
                            </td>
                            <td className="px-6 py-4">
                              <input
                                type="text"
                                name="serviceDoneBy"
                                value={editEntry.serviceDoneBy}
                                onChange={handleEditInputChange}
                                className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full"
                              />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                              {entry.dataEnteredBy}
                            </td>
                            <td className="px-6 py-4">
                              <div className="space-y-2">
                                {entry.files && entry.files.map((file) => {
                                  const isMarkedForDeletion = filesToDelete.some(f => f.public_id === file.public_id);
                                  return (
                                    <div key={file.public_id} className="flex items-center space-x-2">
                                      <button
                                        onClick={() => previewFile(file.url, file.originalName)}
                                        className={`text-blue-600 hover:text-blue-800 text-sm truncate max-w-xs text-left ${isMarkedForDeletion ? 'line-through opacity-50' : ''}`}
                                      >
                                        {file.originalName}
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => isMarkedForDeletion ? unmarkFileForDeletion(file) : markFileForDeletion(file)}
                                        className={`text-xs px-2 py-1 rounded ${isMarkedForDeletion ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                                      >
                                        {isMarkedForDeletion ? 'Restore' : 'Delete'}
                                      </button>
                                    </div>
                                  );
                                })}
                                
                                <div>
                                  <input
                                    type="file"
                                    multiple
                                    onChange={handleEditFileChange}
                                    className="text-sm text-slate-600"
                                  />
                                  {editFiles.length > 0 && (
                                    <p className="text-xs text-slate-500 mt-1">
                                      +{editFiles.length} new file(s)
                                    </p>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap space-x-2">
                              <button
                                onClick={() => handleUpdateEntry(entry._id)}
                                disabled={isLoadingAction}
                                className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors disabled:bg-green-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                              >
                                {isLoadingAction ? (
                                  <>
                                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                    Saving...
                                  </>
                                ) : (
                                  'Save'
                                )}
                              </button>
                              <button
                                onClick={cancelEdit}
                                disabled={isLoadingAction}
                                className="px-4 py-2 bg-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Cancel
                              </button>
                            </td>
                          </>
                        ) : (
                          // View Mode
                          <>
                            <td className="px-6 py-4 whitespace-nowrap text-slate-900 font-medium">
                              {formatDate(entry.date)}
                            </td>
                            <td className="px-6 py-4 text-slate-800">
                              {entry.maintenanceActivity}
                            </td>
                            <td className="px-6 py-4 text-slate-800">
                              {entry.serviceDoneBy}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                              {entry.dataEnteredBy}
                            </td>
                            <td className="px-6 py-4">
                              {entry.files && entry.files.length > 0 ? (
                                <div className="space-y-1">
                                  {entry.files.map((file) => (
                                    <div key={file.public_id}>
                                      <button
                                        onClick={() => previewFile(file.url, file.originalName)}
                                        className="text-blue-600 hover:text-blue-800 text-sm block truncate max-w-xs flex items-center gap-1"
                                        title={file.originalName}
                                      >
                                        📎 {file.originalName}
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-slate-400 text-sm">No files</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap space-x-2">
                              <button
                                onClick={() => startEdit(entry)}
                                disabled={isLoadingAction}
                                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteEntry(entry._id)}
                                disabled={isLoadingAction}
                                className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors disabled:bg-red-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                              >
                                {isLoadingAction ? (
                                  <>
                                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                    Deleting...
                                  </>
                                ) : (
                                  'Delete'
                                )}
                              </button>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Pagination Controls */}
                <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-200">
                  <div className="text-sm text-slate-600">
                    Showing {((pagination.currentPage - 1) * pagination.limit) + 1} to{" "}
                    {Math.min(pagination.currentPage * pagination.limit, pagination.totalEntries)} of{" "}
                    {pagination.totalEntries} entries
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => fetchEntries(pagination.currentPage - 1)}
                      disabled={!pagination.hasPrevPage || isLoadingAction}
                      className={`px-4 py-2 text-sm font-medium rounded-lg ${
                        !pagination.hasPrevPage || isLoadingAction
                          ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                          : "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      Previous
                    </button>
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                        let pageNum;
                        if (pagination.totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (pagination.currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (pagination.currentPage >= pagination.totalPages - 2) {
                          pageNum = pagination.totalPages - 4 + i;
                        } else {
                          pageNum = pagination.currentPage - 2 + i;
                        }
                        
                        return (
                          <button
                            key={pageNum}
                            onClick={() => fetchEntries(pageNum)}
                            disabled={isLoadingAction}
                            className={`px-3 py-1 text-sm font-medium rounded-lg ${
                              pagination.currentPage === pageNum
                                ? "bg-blue-600 text-white"
                                : "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50"
                            } ${isLoadingAction ? "cursor-not-allowed opacity-50" : ""}`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                    <button
                      onClick={() => fetchEntries(pagination.currentPage + 1)}
                      disabled={!pagination.hasNextPage || isLoadingAction}
                      className={`px-4 py-2 text-sm font-medium rounded-lg ${
                        !pagination.hasNextPage || isLoadingAction
                          ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                          : "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      Next
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}