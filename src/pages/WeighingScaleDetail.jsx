import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../axiosInstance";
import InternalNavbar from "../components/InternalNavbar";
import Swal from "sweetalert2";
import { compressImage, compressMultipleImages } from "../utils/imageCompression";

export default function WeighingScaleDetail() {
  const { scaleId } = useParams();
  const navigate = useNavigate();
  const [scale, setScale] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [showRecordForm, setShowRecordForm] = useState(false);
  const newRecordRef = useRef(null);

// Date formatting helper functions - FIXED
const formatDateToDDMMYYYY = (date) => {
  if (!date) return "";
  
  // If date is already in DD-MM-YYYY format
  if (typeof date === 'string' && date.includes('-')) {
    const parts = date.split('-');
    if (parts.length === 3 && parts[0].length === 2 && parts[1].length === 2 && parts[2].length === 4) {
      return date; // Already in DD-MM-YYYY
    }
  }
  
  // Handle Date object or string
  const d = new Date(date);
  if (isNaN(d.getTime())) return date; // Return original if invalid
  
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
};

const formatDateToYYYYMMDD = (date) => {
  if (!date) return "";
  
  // If date is in DD-MM-YYYY format
  if (typeof date === 'string' && date.includes('-')) {
    const parts = date.split('-');
    if (parts.length === 3 && parts[0].length === 2 && parts[1].length === 2 && parts[2].length === 4) {
      // Already in DD-MM-YYYY? Convert to YYYY-MM-DD
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    // If already in YYYY-MM-DD format
    if (parts[0].length === 4) {
      return date;
    }
  }
  
  // Handle Date object
  const d = new Date(date);
  if (isNaN(d.getTime())) {
    // Try to parse as YYYY-MM-DD string
    if (typeof date === 'string' && date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return date;
    }
    return "";
  }
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const convertToDisplayFormat = (yyyymmdd) => {
  if (!yyyymmdd) return "";
  
  // If already in DD-MM-YYYY format
  if (yyyymmdd.match(/^\d{2}-\d{2}-\d{4}$/)) {
    return yyyymmdd;
  }
  
  // Convert YYYY-MM-DD to DD-MM-YYYY
  if (yyyymmdd.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const parts = yyyymmdd.split('-');
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  
  // Try to parse as date
  const d = new Date(yyyymmdd);
  if (!isNaN(d.getTime())) {
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  }
  
  return yyyymmdd;
};

// Add this helper function with your other date functions
const getTodayDateString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

  // Scale details state
  const [scaleDetails, setScaleDetails] = useState({
    brandName: "",
    brandImage: { url: "", publicId: "" },
    calibrationValue: "",
    location: ""
  });

// Update the recordForm initialization (around line 70-80)
const [recordForm, setRecordForm] = useState({
  date: getTodayDateString(), // Use the function instead of formatDateToYYYYMMDD(new Date())
  beforeCalibration: { value: "", files: [] },
  afterCalibration: { value: "", files: [] },
  remarks: ""
});

  // File upload states
  const [uploadingBefore, setUploadingBefore] = useState(false);
  const [uploadingAfter, setUploadingAfter] = useState(false);
  const [uploadingBrand, setUploadingBrand] = useState(false);

  useEffect(() => {
    fetchScale();
  }, [scaleId]);

  const fetchScale = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get(`/weighing-scale/scale/${scaleId}`);
      if (res.data.success) {
        setScale(res.data.scale);
        setScaleDetails({
          brandName: res.data.scale.brandName || "",
          brandImage: res.data.scale.brandImage || { url: "", publicId: "" },
          calibrationValue: res.data.scale.calibrationValue || "",
          location: res.data.scale.location || ""
        });
      }
    } catch (err) {
      console.error("Error fetching scale:", err);
      Swal.fire("Error", "Failed to load scale data", "error");
    } finally {
      setLoading(false);
    }
  };

  const openFilePreview = (url, fileName) => {
    const isImage = url.match(/\.(jpeg|jpg|gif|png|webp)$/i);
    const isPDF = url.match(/\.pdf$/i);

    if (isImage) {
      Swal.fire({
        title: fileName || "Image Preview",
        imageUrl: url,
        imageAlt: fileName || "Image",
        imageWidth: "600",
        imageHeight: "auto",
        showCloseButton: true,
        showConfirmButton: false,
        width: "700px",
        padding: "1rem",
        customClass: {
          popup: "rounded-2xl",
          image: "rounded-lg"
        }
      });
    } else if (isPDF) {
      Swal.fire({
        title: fileName || "PDF Preview",
        html: `<iframe src="${url}" width="100%" height="500px" style="border:none; border-radius: 8px;"></iframe>`,
        width: "700px",
        showCloseButton: true,
        showConfirmButton: false,
      });
    } else {
      Swal.fire({
        title: "File",
        text: url,
        showCloseButton: true,
        showConfirmButton: false,
      });
    }
  };

  const handleBrandImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingBrand(true);
    const compressedFile = await compressImage(file);
    const formData = new FormData();
    formData.append("files", compressedFile);

    try {
      const res = await axiosInstance.post("/weighing-scale/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data.success && res.data.urls.length > 0) {
        setScaleDetails(prev => ({
          ...prev,
          brandImage: { url: res.data.urls[0], publicId: "" }
        }));
        
        Swal.fire({
          title: "Success!",
          text: "Brand image uploaded successfully",
          icon: "success",
          timer: 1500,
          showConfirmButton: false
        });
      }
    } catch (err) {
      console.error("Upload error:", err);
      Swal.fire("Error", "Failed to upload image", "error");
    } finally {
      setUploadingBrand(false);
    }
  };

  const saveScaleDetails = async () => {
    try {
      setSaving(true);
      const res = await axiosInstance.put(`/weighing-scale/scale/${scaleId}`, scaleDetails);
      if (res.data.success) {
        Swal.fire({
          title: "Success!",
          text: "Scale details saved successfully",
          icon: "success",
          timer: 1500,
          showConfirmButton: false
        });
        fetchScale();
      }
    } catch (err) {
      console.error("Error saving scale details:", err);
      Swal.fire("Error", "Failed to save scale details", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (e, type) => {
    let files = Array.from(e.target.files);
    if (files.length === 0) return;

    if (type === 'before') setUploadingBefore(true);
    else setUploadingAfter(true);

    const compressedFiles = await compressMultipleImages(files);
    const formData = new FormData();
    compressedFiles.forEach(file => formData.append("files", file));

    try {
      const res = await axiosInstance.post("/weighing-scale/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data.success) {
        const newFiles = res.data.urls.map(url => ({ url, publicId: "" }));
        
        if (type === 'before') {
          setRecordForm(prev => ({
            ...prev,
            beforeCalibration: {
              ...prev.beforeCalibration,
              files: [...prev.beforeCalibration.files, ...newFiles]
            }
          }));
        } else {
          setRecordForm(prev => ({
            ...prev,
            afterCalibration: {
              ...prev.afterCalibration,
              files: [...prev.afterCalibration.files, ...newFiles]
            }
          }));
        }
      }
    } catch (err) {
      console.error("Upload error:", err);
      Swal.fire("Error", "Failed to upload files", "error");
    } finally {
      if (type === 'before') setUploadingBefore(false);
      else setUploadingAfter(false);
    }
  };

  const handleFileDelete = async (fileUrl, type, index) => {
    const confirm = await Swal.fire({
      title: "Delete File?",
      text: "This will remove the file permanently",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it",
    });

    if (confirm.isConfirmed) {
      try {
        await axiosInstance.delete("/weighing-scale/file", { data: { fileUrl } });
        
        if (type === 'before') {
          const updatedFiles = recordForm.beforeCalibration.files.filter((_, i) => i !== index);
          setRecordForm(prev => ({
            ...prev,
            beforeCalibration: { ...prev.beforeCalibration, files: updatedFiles }
          }));
        } else {
          const updatedFiles = recordForm.afterCalibration.files.filter((_, i) => i !== index);
          setRecordForm(prev => ({
            ...prev,
            afterCalibration: { ...prev.afterCalibration, files: updatedFiles }
          }));
        }
        
        Swal.fire("Deleted!", "File removed successfully", "success");
      } catch (err) {
        console.error("Delete error:", err);
        Swal.fire("Error", "Failed to delete file", "error");
      }
    }
  };

  const saveCalibrationRecord = async () => {
    if (!recordForm.date) {
      Swal.fire("Error", "Please select date", "error");
      return;
    }

    if (!recordForm.beforeCalibration.value) {
      Swal.fire("Error", "Please enter before calibration weight", "error");
      return;
    }

    if (!recordForm.afterCalibration.value) {
      Swal.fire("Error", "Please enter after calibration weight", "error");
      return;
    }

    try {
      setSaving(true);
      
      const recordData = {
        date: convertToDisplayFormat(recordForm.date), // Store as DD-MM-YYYY
        beforeCalibration: {
          value: recordForm.beforeCalibration.value,
          files: recordForm.beforeCalibration.files
        },
        afterCalibration: {
          value: recordForm.afterCalibration.value,
          files: recordForm.afterCalibration.files
        },
        remarks: recordForm.remarks
      };

      let res;
      if (editingRecord) {
        res = await axiosInstance.put(`/weighing-scale/record/${scaleId}/${editingRecord._id}`, recordData);
      } else {
        res = await axiosInstance.post(`/weighing-scale/record/${scaleId}`, recordData);
      }

      if (res.data.success) {
        Swal.fire({
          title: "Success!",
          text: editingRecord ? "Record updated successfully" : "Calibration record added successfully",
          icon: "success",
          timer: 1500,
          showConfirmButton: false
        });
        
        resetRecordForm();
        fetchScale();
      }
    } catch (err) {
      console.error("Error saving record:", err);
      Swal.fire("Error", "Failed to save calibration record", "error");
    } finally {
      setSaving(false);
    }
  };

  const editRecord = (record) => {
    setEditingRecord(record);
    setRecordForm({
      date: formatDateToYYYYMMDD(record.date), // Convert to YYYY-MM-DD for input
      beforeCalibration: {
        value: record.beforeCalibration?.value || "",
        files: record.beforeCalibration?.files || []
      },
      afterCalibration: {
        value: record.afterCalibration?.value || "",
        files: record.afterCalibration?.files || []
      },
      remarks: record.remarks || ""
    });
    setShowRecordForm(true);
    setTimeout(() => {
      if (newRecordRef.current) {
        newRecordRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  const deleteRecord = async (recordId) => {
    const confirm = await Swal.fire({
      title: "Delete Record?",
      text: "This will permanently delete this calibration record",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it",
    });

    if (confirm.isConfirmed) {
      try {
        await axiosInstance.delete(`/weighing-scale/record/${scaleId}/${recordId}`);
        Swal.fire("Deleted!", "Record deleted successfully", "success");
        fetchScale();
      } catch (err) {
        console.error("Error deleting record:", err);
        Swal.fire("Error", "Failed to delete record", "error");
      }
    }
  };

const resetRecordForm = () => {
  setShowRecordForm(false);
  setEditingRecord(null);
  setRecordForm({
    date: getTodayDateString(), // Use the function
    beforeCalibration: { value: "", files: [] },
    afterCalibration: { value: "", files: [] },
    remarks: ""
  });
};

  const renderFileThumbnails = (files, type) => {
    if (!files || files.length === 0) return null;

    return (
      <div className="flex flex-wrap gap-2 mt-2">
        {files.map((file, index) => {
          const fileUrl = typeof file === 'string' ? file : file.url;
          const isImage = fileUrl?.match(/\.(jpeg|jpg|gif|png|webp)$/i);
          
          return (
            <div key={index} className="relative">
              <button
                onClick={() => openFilePreview(fileUrl, `File ${index + 1}`)}
                className="border-2 border-gray-200 rounded-lg overflow-hidden w-16 h-16 flex items-center justify-center cursor-pointer hover:border-blue-500 transition-all hover:scale-105"
              >
                {isImage ? (
                  <img
                    src={fileUrl}
                    className="object-cover w-full h-full"
                    alt={`File ${index + 1}`}
                    onError={(e) => {
                      e.target.src = "https://via.placeholder.com/64?text=Error";
                    }}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center w-full h-full bg-gray-100">
                    <span className="text-2xl">📄</span>
                    <span className="text-xs mt-1">PDF</span>
                  </div>
                )}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleFileDelete(fileUrl, type, index);
                }}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center shadow-md hover:bg-red-600 transition-colors z-10"
              >
                ×
              </button>
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100">
        <InternalNavbar />
        <div className="flex justify-center items-center h-96">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <InternalNavbar />
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <button
              onClick={() => navigate("/weighing-scale")}
              className="text-blue-600 hover:text-blue-800 mb-2 flex items-center gap-1"
            >
              ← Back to Scales
            </button>
            <h1 className="text-2xl font-bold text-slate-900">{scaleId} - Calibration Management</h1>
          </div>
        </div>

        {/* Scale Details Section */}
        <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Scale Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-1">Brand Name</label>
              <input
                type="text"
                value={scaleDetails.brandName}
                onChange={(e) => setScaleDetails({ ...scaleDetails, brandName: e.target.value })}
                className="border rounded p-2 w-full"
                placeholder="Enter brand name"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Calibration Value (kg/g)</label>
              <input
                type="text"
                value={scaleDetails.calibrationValue}
                onChange={(e) => setScaleDetails({ ...scaleDetails, calibrationValue: e.target.value })}
                className="border rounded p-2 w-full"
                placeholder="e.g., 100kg, 50g"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Location</label>
              <input
                type="text"
                value={scaleDetails.location}
                onChange={(e) => setScaleDetails({ ...scaleDetails, location: e.target.value })}
                className="border rounded p-2 w-full"
                placeholder="Enter scale location"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Brand Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleBrandImageUpload}
                disabled={uploadingBrand}
                className="border rounded p-2 w-full"
              />
              {uploadingBrand && <p className="text-xs text-blue-500 mt-1">Uploading...</p>}
              {scaleDetails.brandImage?.url && (
                <div className="mt-3">
                  <div className="relative inline-block group">
                    <button
                      onClick={() => {
                        const isImage = scaleDetails.brandImage.url.match(/\.(jpeg|jpg|gif|png|webp)$/i);
                        if (isImage) {
                          Swal.fire({
                            title: "Brand Image",
                            imageUrl: scaleDetails.brandImage.url,
                            imageAlt: "Brand Image",
                            imageWidth: "500",
                            imageHeight: "auto",
                            showCloseButton: true,
                            showConfirmButton: false,
                            width: "600px",
                            customClass: {
                              popup: "rounded-2xl"
                            }
                          });
                        } else {
                          window.open(scaleDetails.brandImage.url, "_blank");
                        }
                      }}
                      className="border-2 border-gray-200 rounded-lg overflow-hidden hover:border-blue-500 transition-all hover:scale-105"
                    >
                      <img
                        src={scaleDetails.brandImage.url}
                        alt="Brand"
                        className="w-20 h-20 object-cover"
                        onError={(e) => {
                          e.target.src = "https://via.placeholder.com/80?text=No+Image";
                        }}
                      />
                    </button>
                    <span className="absolute -top-2 -right-2 bg-blue-500 text-white rounded-full px-1.5 py-0.5 text-xs">
                      ✓
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Click image to enlarge</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-4">
            <button
              onClick={saveScaleDetails}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Scale Details"}
            </button>
          </div>
        </div>

        {/* Add/Edit Record Button */}
        <div className="mb-6">
          <button
            onClick={() => {
              resetRecordForm();
              setShowRecordForm(true);
              setTimeout(() => {
                if (newRecordRef.current) {
                  newRecordRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
              }, 100);
            }}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium"
          >
            + Add Calibration Record
          </button>
        </div>

        {/* Calibration Record Form */}
        {showRecordForm && (
          <div ref={newRecordRef} className="bg-white shadow-lg rounded-lg p-6 mb-6 border-2 border-blue-300">
            <h2 className="text-xl font-bold mb-4">{editingRecord ? "Edit Calibration Record" : "New Calibration Record"}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
             <div>
  <label className="block text-sm font-medium mb-1">Date *</label>
  <input
    type="date"
    value={recordForm.date}
    onChange={(e) => setRecordForm({ ...recordForm, date: e.target.value })}
    max={getTodayDateString()} // This prevents future dates
    className="border rounded p-2 w-full"
    required
  />
  {recordForm.date && (
    <p className="text-xs text-gray-500 mt-1">
      Selected: {convertToDisplayFormat(recordForm.date)}
    </p>
  )}
</div>
            </div>

            {/* Before Calibration */}
            <div className="border rounded-lg p-4 mb-6 bg-gray-50">
              <h3 className="font-bold mb-3">Before Calibration</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Weight at Platform (with {scaleDetails.calibrationValue || "calibrated"} weight) *
                  </label>
                  <input
                    type="text"
                    value={recordForm.beforeCalibration.value}
                    onChange={(e) => setRecordForm({
                      ...recordForm,
                      beforeCalibration: { ...recordForm.beforeCalibration, value: e.target.value }
                    })}
                    className="border rounded p-2 w-full"
                    placeholder={`Enter weight (${scaleDetails.calibrationValue})`}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Upload Files</label>
                  <input
                    type="file"
                    multiple
                    accept="image/*,.pdf"
                    onChange={(e) => handleFileUpload(e, 'before')}
                    disabled={uploadingBefore}
                    className="border rounded p-2 w-full"
                  />
                  {uploadingBefore && <p className="text-xs text-blue-500 mt-1">Uploading...</p>}
                  {renderFileThumbnails(recordForm.beforeCalibration.files, 'before')}
                </div>
              </div>
            </div>

            {/* After Calibration */}
            <div className="border rounded-lg p-4 mb-6 bg-gray-50">
              <h3 className="font-bold mb-3">After Calibration</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Weight at Platform (with {scaleDetails.calibrationValue || "calibrated"} weight) *
                  </label>
                  <input
                    type="text"
                    value={recordForm.afterCalibration.value}
                    onChange={(e) => setRecordForm({
                      ...recordForm,
                      afterCalibration: { ...recordForm.afterCalibration, value: e.target.value }
                    })}
                    className="border rounded p-2 w-full"
                    placeholder={`Enter weight (${scaleDetails.calibrationValue})`}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Upload Files</label>
                  <input
                    type="file"
                    multiple
                    accept="image/*,.pdf"
                    onChange={(e) => handleFileUpload(e, 'after')}
                    disabled={uploadingAfter}
                    className="border rounded p-2 w-full"
                  />
                  {uploadingAfter && <p className="text-xs text-blue-500 mt-1">Uploading...</p>}
                  {renderFileThumbnails(recordForm.afterCalibration.files, 'after')}
                </div>
              </div>
            </div>

            {/* Remarks */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-1">Remarks</label>
              <textarea
                value={recordForm.remarks}
                onChange={(e) => setRecordForm({ ...recordForm, remarks: e.target.value })}
                className="border rounded p-2 w-full"
                rows="3"
                placeholder="Enter any remarks..."
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={saveCalibrationRecord}
                disabled={saving}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium disabled:opacity-50"
              >
                {saving ? "Saving..." : editingRecord ? "Update Record" : "Save Record"}
              </button>
              <button
                onClick={resetRecordForm}
                className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Calibration Records Table */}
        <div className="bg-white shadow-lg rounded-lg overflow-x-auto">
          <h2 className="text-xl font-bold p-4 border-b">Calibration Records</h2>
          <table className="min-w-full border-collapse">
            <thead className="bg-slate-200">
              <tr>
                <th className="border p-3 text-left text-xs">S.No</th>
                <th className="border p-3 text-left text-xs">Date</th>
                <th className="border p-3 text-left text-xs">Before Calibration</th>
                <th className="border p-3 text-left text-xs">After Calibration</th>
                <th className="border p-3 text-left text-xs">Difference</th>
                <th className="border p-3 text-left text-xs">Status</th>
                <th className="border p-3 text-left text-xs">Remarks</th>
                <th className="border p-3 text-left text-xs">Actions</th>
              </tr>
            </thead>
            <tbody>
              {scale?.calibrationRecords?.map((record, index) => {
                const beforeValue = parseFloat(record.beforeCalibration?.value) || 0;
                const afterValue = parseFloat(record.afterCalibration?.value) || 0;
                const difference = afterValue - beforeValue;
                const isAccurate = Math.abs(difference) <= 0.1;
                
                return (
                  <tr key={record._id} className="hover:bg-slate-50">
                    <td className="border p-2 text-xs">{index + 1}</td>
                    <td className="border p-2 text-xs">{formatDateToDDMMYYYY(record.date)}</td>
                    <td className="border p-2">
                      <div>
                        <span className="font-medium">{record.beforeCalibration?.value || "-"}</span>
                        {record.beforeCalibration?.files?.length > 0 && (
                          <div className="mt-2">
                            <div className="flex flex-wrap gap-1">
                              {record.beforeCalibration.files.map((file, idx) => {
                                const fileUrl = typeof file === 'string' ? file : file.url;
                                const isImage = fileUrl?.match(/\.(jpeg|jpg|gif|png|webp)$/i);
                                return (
                                  <button
                                    key={idx}
                                    onClick={() => openFilePreview(fileUrl, `Before Calibration File ${idx + 1}`)}
                                    className="border rounded overflow-hidden w-8 h-8 flex items-center justify-center cursor-pointer hover:border-blue-500"
                                  >
                                    {isImage ? (
                                      <img src={fileUrl} className="object-cover w-full h-full" alt="" />
                                    ) : (
                                      <span className="text-xs">📄</span>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="border p-2">
                      <div>
                        <span className="font-medium">{record.afterCalibration?.value || "-"}</span>
                        {record.afterCalibration?.files?.length > 0 && (
                          <div className="mt-2">
                            <div className="flex flex-wrap gap-1">
                              {record.afterCalibration.files.map((file, idx) => {
                                const fileUrl = typeof file === 'string' ? file : file.url;
                                const isImage = fileUrl?.match(/\.(jpeg|jpg|gif|png|webp)$/i);
                                return (
                                  <button
                                    key={idx}
                                    onClick={() => openFilePreview(fileUrl, `After Calibration File ${idx + 1}`)}
                                    className="border rounded overflow-hidden w-8 h-8 flex items-center justify-center cursor-pointer hover:border-blue-500"
                                  >
                                    {isImage ? (
                                      <img src={fileUrl} className="object-cover w-full h-full" alt="" />
                                    ) : (
                                      <span className="text-xs">📄</span>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="border p-2 text-xs">
                      <span className={difference === 0 ? "text-green-600" : difference > 0 ? "text-orange-600" : "text-red-600"}>
                        {difference > 0 ? `+${difference}` : difference}
                      </span>
                    </td>
                    <td className="border p-2">
                      {isAccurate ? (
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">Accurate</span>
                      ) : (
                        <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">Needs Adjustment</span>
                      )}
                    </td>
                    <td className="border p-2 text-xs">{record.remarks || "-"}</td>
                    <td className="border p-2">
                      <div className="flex gap-1">
                        <button
                          onClick={() => editRecord(record)}
                          className="bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded text-xs"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteRecord(record._id)}
                          className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {(!scale?.calibrationRecords || scale.calibrationRecords.length === 0) && (
            <div className="text-center py-8 text-gray-500">
              No calibration records found. Click "Add Calibration Record" to create one.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}