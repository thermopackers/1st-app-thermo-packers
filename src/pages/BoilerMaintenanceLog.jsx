import { useEffect, useState } from "react";
import axiosInstance from "../axiosInstance";
import InternalNavbar from "../components/InternalNavbar";
import Swal from "sweetalert2";
import { motion, AnimatePresence } from "framer-motion";

export default function BoilerMaintenanceLog() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  
  // Simple form state
  const [date, setDate] = useState("");
  const [fdFanValue, setFdFanValue] = useState("");
  const [idFanValue, setIdFanValue] = useState("");
  const [tubesValue, setTubesValue] = useState("");
  const [ashValue, setAshValue] = useState("");
  const [maintenanceDesc, setMaintenanceDesc] = useState("");
  const [generalRemarks, setGeneralRemarks] = useState("");
  
  // File upload states with multiple files - store only file info, not the actual files
  const [fdFanFiles, setFdFanFiles] = useState([]);
  const [fdFanUploading, setFdFanUploading] = useState(false);
  
  const [idFanFiles, setIdFanFiles] = useState([]);
  const [idFanUploading, setIdFanUploading] = useState(false);
  
  const [tubesFiles, setTubesFiles] = useState([]);
  const [tubesUploading, setTubesUploading] = useState(false);
  
  const [ashFiles, setAshFiles] = useState([]);
  const [ashUploading, setAshUploading] = useState(false);
  
  const [serviceReports, setServiceReports] = useState([]);
  const [serviceReportUploading, setServiceReportUploading] = useState(false);
  
  // Track if any upload is in progress
  const isAnyUploading = fdFanUploading || idFanUploading || tubesUploading || ashUploading || serviceReportUploading;

  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getMinDate = () => {
    const today = new Date();
    today.setFullYear(today.getFullYear() - 5);
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    fetchRecords();
  }, [currentPage, startDate, endDate]);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      let url = `/boiler-maintenance?page=${currentPage}&limit=20`;
      if (startDate && endDate) {
        url += `&startDate=${startDate}&endDate=${endDate}`;
      }
      const res = await axiosInstance.get(url);
      if (res.data.success) {
        setRecords(res.data.records);
        setTotalPages(res.data.totalPages);
        setTotalRecords(res.data.totalRecords);
      }
    } catch (err) {
      console.error("Error fetching records:", err);
      Swal.fire("Error", "Failed to load records", "error");
    } finally {
      setLoading(false);
    }
  };

  const uploadMultipleFiles = async (files, endpoint, setFiles, setUploading) => {
    if (!files || files.length === 0) return;
    
    // Check file sizes
    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        Swal.fire("Error", `${file.name} is larger than 5MB`, "error");
        return;
      }
    }
    
    setUploading(true);
    const formData = new FormData();
    for (const file of files) {
      formData.append("files", file);
    }
    
    try {
      const res = await axiosInstance.post(endpoint, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 30000 // 30 second timeout
      });
      if (res.data.success) {
        setFiles(prev => [...prev, ...res.data.files]);
        Swal.fire({
          title: "Success!",
          text: `${res.data.files.length} file(s) uploaded successfully`,
          icon: "success",
          timer: 1500,
          showConfirmButton: false
        });
      }
    } catch (err) {
      console.error("Upload error:", err);
      Swal.fire("Error", "Failed to upload files", "error");
    } finally {
      setUploading(false);
    }
  };

  const handleFdFanFiles = (e) => {
    const files = Array.from(e.target.files);
    if (files.length) uploadMultipleFiles(files, "/boiler-maintenance/upload/fdFanBearingGreasing", setFdFanFiles, setFdFanUploading);
    e.target.value = '';
  };

  const handleIdFanFiles = (e) => {
    const files = Array.from(e.target.files);
    if (files.length) uploadMultipleFiles(files, "/boiler-maintenance/upload/idFanBearingGreasing", setIdFanFiles, setIdFanUploading);
    e.target.value = '';
  };

  const handleTubesFiles = (e) => {
    const files = Array.from(e.target.files);
    if (files.length) uploadMultipleFiles(files, "/boiler-maintenance/upload/tubesCleaned", setTubesFiles, setTubesUploading);
    e.target.value = '';
  };

  const handleAshFiles = (e) => {
    const files = Array.from(e.target.files);
    if (files.length) uploadMultipleFiles(files, "/boiler-maintenance/upload/ashRemoved", setAshFiles, setAshUploading);
    e.target.value = '';
  };

  const handleServiceReports = (e) => {
    const files = Array.from(e.target.files);
    if (files.length) uploadMultipleFiles(files, "/boiler-maintenance/upload/maintenanceActivity", setServiceReports, setServiceReportUploading);
    e.target.value = '';
  };

  const removeFile = (setFiles, index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!date) {
      Swal.fire("Error", "Please select date", "error");
      return;
    }

    // Check if any upload is in progress
    if (isAnyUploading) {
      Swal.fire("Error", "Please wait for all file uploads to complete", "error");
      return;
    }

    // Compare dates correctly without time component
    const selectedDate = new Date(date);
    const today = new Date();
    selectedDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate > today) {
      Swal.fire("Error", "Cannot select future dates. Please select today or an earlier date.", "error");
      return;
    }

    try {
      setLoading(true);
      
      // Prepare clean data without undefined values
      const submitData = {
        date: date,
        generalRemarks: generalRemarks || ""
      };
      
      // Add fdFan data only if value is selected or files exist
      if (fdFanValue || fdFanFiles.length > 0) {
        submitData.fdFanBearingGreasing = { 
          value: fdFanValue || "",
          files: fdFanFiles.map(f => ({ url: f.url, publicId: f.publicId, originalName: f.originalName })),
          remarks: ""
        };
      }
      
      // Add idFan data only if value is selected or files exist
      if (idFanValue || idFanFiles.length > 0) {
        submitData.idFanBearingGreasing = { 
          value: idFanValue || "",
          files: idFanFiles.map(f => ({ url: f.url, publicId: f.publicId, originalName: f.originalName })),
          remarks: ""
        };
      }
      
      // Add tubes data only if value is selected or files exist
      if (tubesValue || tubesFiles.length > 0) {
        submitData.tubesCleaned = { 
          value: tubesValue || "",
          files: tubesFiles.map(f => ({ url: f.url, publicId: f.publicId, originalName: f.originalName })),
          remarks: ""
        };
      }
      
      // Add ash data only if value is selected or files exist
      if (ashValue || ashFiles.length > 0) {
        submitData.ashRemoved = { 
          value: ashValue || "",
          files: ashFiles.map(f => ({ url: f.url, publicId: f.publicId, originalName: f.originalName })),
          remarks: ""
        };
      }
      
      // Add maintenance activity data
      if (maintenanceDesc || serviceReports.length > 0) {
        submitData.maintenanceActivity = {
          description: maintenanceDesc || "",
          serviceReports: serviceReports.map(f => ({ url: f.url, publicId: f.publicId, originalName: f.originalName }))
        };
      }
      
      const res = await axiosInstance.post("/boiler-maintenance", submitData);
      
      if (res.data.success) {
        Swal.fire({
          title: "Success!",
          text: editingId ? "Record updated successfully" : "Record added successfully",
          icon: "success",
          timer: 2000,
          showConfirmButton: false
        });
        
        resetForm();
        fetchRecords();
      } else {
        Swal.fire("Error", res.data.message || "Failed to save record", "error");
      }
    } catch (err) {
      console.error("Submit error:", err);
      Swal.fire("Error", err.response?.data?.message || "Failed to save record", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (record) => {
    setEditingId(record._id);
    setDate(new Date(record.date).toISOString().split('T')[0]);
    setFdFanValue(record.fdFanBearingGreasing?.value || "");
    setIdFanValue(record.idFanBearingGreasing?.value || "");
    setTubesValue(record.tubesCleaned?.value || "");
    setAshValue(record.ashRemoved?.value || "");
    setMaintenanceDesc(record.maintenanceActivity?.description || "");
    setGeneralRemarks(record.generalRemarks || "");
    setFdFanFiles(record.fdFanBearingGreasing?.files || []);
    setIdFanFiles(record.idFanBearingGreasing?.files || []);
    setTubesFiles(record.tubesCleaned?.files || []);
    setAshFiles(record.ashRemoved?.files || []);
    setServiceReports(record.maintenanceActivity?.serviceReports || []);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    const confirm = await Swal.fire({
      title: "Delete Record?",
      text: "This will permanently delete the record",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it",
    });

    if (confirm.isConfirmed) {
      try {
        await axiosInstance.delete(`/boiler-maintenance/${id}`);
        Swal.fire("Deleted!", "Record deleted successfully", "success");
        fetchRecords();
      } catch (err) {
        console.error("Delete error:", err);
        Swal.fire("Error", "Failed to delete record", "error");
      }
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setDate("");
    setFdFanValue("");
    setIdFanValue("");
    setTubesValue("");
    setAshValue("");
    setMaintenanceDesc("");
    setGeneralRemarks("");
    setFdFanFiles([]);
    setIdFanFiles([]);
    setTubesFiles([]);
    setAshFiles([]);
    setServiceReports([]);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-GB');
  };

  const viewFileInSwal = (file) => {
    const isImage = file.url?.match(/\.(jpg|jpeg|png|gif|webp)$/i);
    
    if (isImage) {
      Swal.fire({
        title: file.originalName || "Image",
        imageUrl: file.url,
        imageAlt: file.originalName,
        showCloseButton: true,
        showConfirmButton: false,
        width: 'auto',
        background: '#1a1a1a',
        customClass: {
          popup: 'rounded-2xl',
          image: 'max-h-[80vh] object-contain rounded-lg'
        }
      });
    } else {
      window.open(file.url, "_blank");
    }
  };

  const renderFileList = (files, label) => {
    if (!files || files.length === 0) return null;
    
    return (
      <div className="mt-2 space-y-2">
        {files.map((file, idx) => {
          const isImage = file.url?.match(/\.(jpg|jpeg|png|gif|webp)$/i);
          const fileName = file.originalName || `File ${idx + 1}`;
          const shortName = fileName.length > 20 ? fileName.substring(0, 20) + '...' : fileName;
          
          return (
            <div key={idx} className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer" onClick={() => viewFileInSwal(file)}>
              {isImage ? (
                <div className="w-10 h-10 rounded overflow-hidden bg-gray-200 flex-shrink-0">
                  <img src={file.url} alt={shortName} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-xl">📄</span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-blue-600 text-xs font-medium truncate" title={fileName}>{shortName}</p>
                <span className="text-gray-400 text-xs">{isImage ? 'Image' : 'Document'}</span>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const FileUploadCell = ({ files, uploading, onUpload, onRemove, label }) => (
    <div className="flex flex-col gap-2">
      <input
        type="file"
        multiple
        accept=".pdf,.jpg,.jpeg,.png,.gif,.webp"
        onChange={onUpload}
        disabled={uploading}
        className="text-xs w-full file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
      />
      {uploading && (
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs text-blue-500">Uploading...</span>
        </div>
      )}
      {files.length > 0 && !uploading && (
        <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
          {files.map((file, idx) => {
            const isImage = file.url?.match(/\.(jpg|jpeg|png|gif|webp)$/i);
            const fileName = file.originalName || `File ${idx + 1}`;
            const shortName = fileName.length > 25 ? fileName.substring(0, 25) + '...' : fileName;
            
            return (
              <div key={idx} className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg">
                {isImage ? (
                  <div className="w-10 h-10 rounded overflow-hidden bg-gray-200 flex-shrink-0 cursor-pointer" onClick={() => viewFileInSwal(file)}>
                    <img src={file.url} alt={shortName} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded bg-blue-100 flex items-center justify-center flex-shrink-0 cursor-pointer" onClick={() => viewFileInSwal(file)}>
                    <span className="text-lg">📄</span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-green-600 text-xs font-medium truncate" title={fileName}>✓ {shortName}</p>
                </div>
                <button
                  type="button"
                  onClick={() => onRemove(idx)}
                  className="text-red-500 hover:text-red-700 text-xs px-2 py-1 rounded hover:bg-red-50"
                >
                  ✕
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200">
      <InternalNavbar />
      <div className="max-w-full mx-auto p-4 md:p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
              Boiler Maintenance Report
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Total Records: <span className="font-semibold">{totalRecords}</span> | Page {currentPage} of {totalPages}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} max={getTodayDate()} className="border rounded-lg px-3 py-2 text-sm" />
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} max={getTodayDate()} className="border rounded-lg px-3 py-2 text-sm" />
            <button onClick={() => { setStartDate(""); setEndDate(""); setCurrentPage(1); }} className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm">Clear Filter</button>
            <button onClick={() => setShowForm(!showForm)} className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-5 py-2 rounded-lg font-medium flex items-center gap-2 shadow-md">
              {showForm ? "✕ Cancel" : "+ Add Record"}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {showForm && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="bg-white rounded-2xl shadow-xl mb-6 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
                <h2 className="text-xl font-bold text-white">{editingId ? "Edit Record" : "Add New Record"}</h2>
              </div>
              <form onSubmit={handleSubmit} className="p-6">
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Date *</label>
                  <input type="date" value={date} onChange={(e) => setDate(e.target.value)} max={getTodayDate()} min={getMinDate()} className="border rounded-lg p-2.5 w-full md:w-64" required />
                  <p className="text-xs text-gray-500 mt-1">* Only past and today's dates are allowed</p>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse">
                    <thead>
                      <tr className="bg-gradient-to-r from-gray-100 to-gray-200">
                        <th className="border p-3 text-left text-sm font-semibold">Activity</th>
                        <th className="border p-3 text-left text-sm font-semibold">Status</th>
                        <th className="border p-3 text-left text-sm font-semibold">File Upload (Multiple)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr><td className="border p-3 font-medium">FD Fan Bearing Greasing Done</td><td className="border p-3"><select value={fdFanValue} onChange={(e) => setFdFanValue(e.target.value)} className="border rounded-lg p-2 w-32"><option value="">-- Select --</option><option value="YES">✅ YES</option><option value="NO">❌ NO</option></select></td><td className="border p-3"><FileUploadCell files={fdFanFiles} uploading={fdFanUploading} onUpload={handleFdFanFiles} onRemove={(idx) => removeFile(setFdFanFiles, idx)} /></td></tr>
                      <tr><td className="border p-3 font-medium">ID Fan Bearing Greasing Done</td><td className="border p-3"><select value={idFanValue} onChange={(e) => setIdFanValue(e.target.value)} className="border rounded-lg p-2 w-32"><option value="">-- Select --</option><option value="YES">✅ YES</option><option value="NO">❌ NO</option></select></td><td className="border p-3"><FileUploadCell files={idFanFiles} uploading={idFanUploading} onUpload={handleIdFanFiles} onRemove={(idx) => removeFile(setIdFanFiles, idx)} /></td></tr>
                      <tr><td className="border p-3 font-medium">Tubes Cleaned with Brush</td><td className="border p-3"><select value={tubesValue} onChange={(e) => setTubesValue(e.target.value)} className="border rounded-lg p-2 w-32"><option value="">-- Select --</option><option value="YES">✅ YES</option><option value="NO">❌ NO</option></select></td><td className="border p-3"><FileUploadCell files={tubesFiles} uploading={tubesUploading} onUpload={handleTubesFiles} onRemove={(idx) => removeFile(setTubesFiles, idx)} /></td></tr>
                      <tr><td className="border p-3 font-medium">Ash Removed</td><td className="border p-3"><select value={ashValue} onChange={(e) => setAshValue(e.target.value)} className="border rounded-lg p-2 w-32"><option value="">-- Select --</option><option value="YES">✅ YES</option><option value="NO">❌ NO</option></select></td><td className="border p-3"><FileUploadCell files={ashFiles} uploading={ashUploading} onUpload={handleAshFiles} onRemove={(idx) => removeFile(setAshFiles, idx)} /></td></tr>
                      <tr><td className="border p-3 font-medium align-top">Type of Maintenance Activity Done</td><td colSpan="2" className="border p-3"><textarea value={maintenanceDesc} onChange={(e) => setMaintenanceDesc(e.target.value)} className="border rounded-lg p-2 w-full" rows="3" placeholder="Describe maintenance activity..." /><div className="mt-3 pt-3 border-t"><label className="block text-sm font-medium text-gray-700 mb-2">Service Report Files (Multiple)</label><FileUploadCell files={serviceReports} uploading={serviceReportUploading} onUpload={handleServiceReports} onRemove={(idx) => removeFile(setServiceReports, idx)} /></div></td></tr>
                    </tbody>
                  </table>
                </div>

                <div className="mt-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">General Remarks</label>
                  <textarea value={generalRemarks} onChange={(e) => setGeneralRemarks(e.target.value)} className="border rounded-lg p-3 w-full" rows="3" placeholder="Enter any general remarks..." />
                </div>
                
                <div className="flex gap-3 mt-6 pt-4 border-t">
                  <button type="submit" disabled={loading || isAnyUploading} className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-6 py-2.5 rounded-lg font-medium disabled:opacity-50 flex items-center gap-2 shadow-md">
                    {(loading || isAnyUploading) ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>Saving...</> : (editingId ? "Update Record" : "Save Record")}
                  </button>
                  <button type="button" onClick={resetForm} className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2.5 rounded-lg font-medium">Cancel</button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {loading ? (
          <div className="flex flex-col justify-center items-center py-20"><div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div><p className="text-gray-500">Loading records...</p></div>
        ) : (
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead className="bg-gradient-to-r from-gray-100 to-gray-200">
                  <tr><th className="border p-3 text-left text-xs font-semibold">S.No</th><th className="border p-3 text-left text-xs font-semibold">Date</th><th className="border p-3 text-left text-xs font-semibold">FD Fan</th><th className="border p-3 text-left text-xs font-semibold">ID Fan</th><th className="border p-3 text-left text-xs font-semibold">Tubes</th><th className="border p-3 text-left text-xs font-semibold">Ash</th><th className="border p-3 text-left text-xs font-semibold">Maintenance Activity</th><th className="border p-3 text-left text-xs font-semibold">General Remarks</th><th className="border p-3 text-left text-xs font-semibold">Actions</th></tr>
                </thead>
                <tbody>
                  {records.map((record, index) => (
                    <tr key={record._id} className="hover:bg-gray-50">
                      <td className="border p-2 text-xs text-center">{(currentPage - 1) * 20 + index + 1}</td>
                      <td className="border p-2 text-xs font-medium">{formatDate(record.date)}</td>
                      <td className="border p-2"><span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${record.fdFanBearingGreasing?.value === "YES" ? "bg-green-100 text-green-700" : record.fdFanBearingGreasing?.value === "NO" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-500"}`}>{record.fdFanBearingGreasing?.value || "-"}</span>{renderFileList(record.fdFanBearingGreasing?.files, "File")}</td>
                      <td className="border p-2"><span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${record.idFanBearingGreasing?.value === "YES" ? "bg-green-100 text-green-700" : record.idFanBearingGreasing?.value === "NO" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-500"}`}>{record.idFanBearingGreasing?.value || "-"}</span>{renderFileList(record.idFanBearingGreasing?.files, "File")}</td>
                      <td className="border p-2"><span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${record.tubesCleaned?.value === "YES" ? "bg-green-100 text-green-700" : record.tubesCleaned?.value === "NO" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-500"}`}>{record.tubesCleaned?.value || "-"}</span>{renderFileList(record.tubesCleaned?.files, "File")}</td>
                      <td className="border p-2"><span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${record.ashRemoved?.value === "YES" ? "bg-green-100 text-green-700" : record.ashRemoved?.value === "NO" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-500"}`}>{record.ashRemoved?.value || "-"}</span>{renderFileList(record.ashRemoved?.files, "File")}</td>
                      <td className="border p-2 text-xs max-w-xs"><p className="break-words">{record.maintenanceActivity?.description || "-"}</p>{renderFileList(record.maintenanceActivity?.serviceReports, "Service Report")}</td>
                      <td className="border p-2 text-xs max-w-xs"><p className="break-words">{record.generalRemarks || "-"}</p></td>
                      <td className="border p-2 whitespace-nowrap"><div className="flex gap-1"><button onClick={() => handleEdit(record)} className="bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded text-xs">Edit</button><button onClick={() => handleDelete(record._id)} className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs">Delete</button></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-3 mt-6">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-4 py-2 bg-white border rounded-lg hover:bg-gray-50 disabled:opacity-50">← Previous</button>
            <span className="text-sm">Page {currentPage} of {totalPages}</span>
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-4 py-2 bg-white border rounded-lg hover:bg-gray-50 disabled:opacity-50">Next →</button>
          </div>
        )}
      </div>
    </div>
  );
}