import { useEffect, useState } from "react";
import axiosInstance from "../axiosInstance";
import InternalNavbar from "../components/InternalNavbar";
import Swal from "sweetalert2";

export default function AirPollutionCertificate() {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [formData, setFormData] = useState({
    expiryDate: "",
    certificateFile: null,
    remarks: ""
  });
  
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);

  useEffect(() => {
    fetchCertificates();
  }, [page]);

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get(`/air-pollution-certificate?page=${page}&limit=10`);
      setCertificates(res.data.certificates);
      setTotalPages(res.data.totalPages);
      setTotalRecords(res.data.totalRecords);
    } catch (err) {
      console.error("Error fetching certificates:", err);
      Swal.fire("Error", "Failed to load certificates", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const uploadData = new FormData();
    uploadData.append("file", file);

    try {
      const res = await axiosInstance.post("/air-pollution-certificate/upload", uploadData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data.success) {
        setUploadedFile({
          url: res.data.url,
          publicId: res.data.publicId,
          originalName: res.data.originalName
        });
        
        Swal.fire({
          title: "Success!",
          text: "File uploaded successfully",
          icon: "success",
          timer: 1500,
          showConfirmButton: false
        });
      }
    } catch (err) {
      console.error("Upload error:", err);
      Swal.fire("Error", "Failed to upload file", "error");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.expiryDate) {
      Swal.fire("Error", "Please select expiry date", "error");
      return;
    }

    if (!uploadedFile) {
      Swal.fire("Error", "Please upload certificate file", "error");
      return;
    }

    try {
      setLoading(true);
      
      const submitData = {
        expiryDate: formData.expiryDate,
        certificateFile: uploadedFile,
        remarks: formData.remarks
      };

      let res;
      if (editingId) {
        res = await axiosInstance.put(`/air-pollution-certificate/${editingId}`, submitData);
      } else {
        res = await axiosInstance.post("/air-pollution-certificate", submitData);
      }

      if (res.data.success) {
        Swal.fire({
          title: "Success!",
          text: editingId ? "Certificate updated successfully" : "Certificate added successfully",
          icon: "success",
          timer: 2000,
          showConfirmButton: false
        });
        
        resetForm();
        fetchCertificates();
      }
    } catch (err) {
      console.error("Submit error:", err);
      Swal.fire("Error", err.response?.data?.message || "Failed to save certificate", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (certificate) => {
    setEditingId(certificate._id);
    setFormData({
      expiryDate: new Date(certificate.expiryDate).toISOString().split('T')[0],
      remarks: certificate.remarks || ""
    });
    setUploadedFile(certificate.certificateFile);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    const confirm = await Swal.fire({
      title: "Delete Certificate?",
      text: "This will permanently delete the certificate",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it",
    });

    if (confirm.isConfirmed) {
      try {
        await axiosInstance.delete(`/air-pollution-certificate/${id}`);
        Swal.fire("Deleted!", "Certificate deleted successfully", "success");
        fetchCertificates();
      } catch (err) {
        console.error("Delete error:", err);
        Swal.fire("Error", "Failed to delete certificate", "error");
      }
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      expiryDate: "",
      certificateFile: null,
      remarks: ""
    });
    setUploadedFile(null);
  };

  const getStatusBadge = (status, daysUntilExpiry) => {
    if (status === "expired") {
      return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">Expired</span>;
    } else if (status === "expiring_soon") {
      return <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-semibold">{daysUntilExpiry} days left</span>;
    } else if (status === "warning") {
      return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold">{daysUntilExpiry} days left</span>;
    } else {
      return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">Valid</span>;
    }
  };

  const formatDate = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString('en-GB');
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <InternalNavbar />
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Air Pollution Certificate Management
            </h1>
            <p className="text-gray-600 text-xs mt-1">
              Total Records: {totalRecords} | Showing page {page} of {totalPages}
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2"
          >
            {showForm ? "✕ Cancel" : "+ Add New Certificate"}
          </button>
        </div>

        {/* Add/Edit Form */}
        {showForm && (
          <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">{editingId ? "Edit Certificate" : "Add New Certificate"}</h2>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Expiry Date *</label>
                  <input
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                    className="border rounded p-2 w-full"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Certificate File *</label>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileUpload}
                    className="border rounded p-2 w-full"
                    disabled={uploading}
                  />
                  {uploading && <p className="text-xs text-blue-500 mt-1">Uploading...</p>}
                  {uploadedFile && (
                    <p className="text-xs text-green-600 mt-1">
                      ✓ File uploaded: {uploadedFile.originalName || "Certificate"}
                    </p>
                  )}
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Remarks</label>
                  <textarea
                    value={formData.remarks}
                    onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                    className="border rounded p-2 w-full"
                    rows="3"
                    placeholder="Enter any remarks..."
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={loading || uploading}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium disabled:opacity-50"
                >
                  {loading ? "Saving..." : editingId ? "Update" : "Save"}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Certificates Table */}
        {loading && certificates.length === 0 ? (
          <div className="flex justify-center items-center py-8">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="bg-white shadow-lg rounded-lg overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead className="bg-slate-200">
                <tr>
                  <th className="border p-3 text-left text-xs">S.No</th>
                  <th className="border p-3 text-left text-xs">Expiry Date</th>
                  <th className="border p-3 text-left text-xs">Status</th>
                  <th className="border p-3 text-left text-xs">Certificate</th>
                  <th className="border p-3 text-left text-xs">Remarks</th>
                  <th className="border p-3 text-left text-xs">Added On</th>
                  <th className="border p-3 text-left text-xs">Actions</th>
                </tr>
              </thead>
              <tbody>
                {certificates.map((cert, index) => (
                  <tr key={cert._id} className="hover:bg-slate-50">
                    <td className="border p-2 text-xs">{(page - 1) * 10 + index + 1}</td>
                    <td className="border p-2 text-xs">{formatDate(cert.expiryDate)}</td>
                    <td className="border p-2">{getStatusBadge(cert.status, cert.daysUntilExpiry)}</td>
                    <td className="border p-2">
                      {cert.certificateFile?.url && (
                        <button
                          onClick={() => {
                            const isPDF = cert.certificateFile.url.match(/\.pdf$/i);
                            if (isPDF) {
                              window.open(cert.certificateFile.url, "_blank");
                            } else {
                              Swal.fire({
                                imageUrl: cert.certificateFile.url,
                                imageAlt: "Certificate",
                                showCloseButton: true,
                                showConfirmButton: false,
                              });
                            }
                          }}
                          className="text-blue-600 hover:text-blue-800 underline text-xs"
                        >
                          View File
                        </button>
                      )}
                    </td>
                    <td className="border p-2 text-xs">{cert.remarks || "-"}</td>
                    <td className="border p-2 text-xs">{formatDate(cert.createdAt)}</td>
                    <td className="border p-2">
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleEdit(cert)}
                          className="bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded text-xs"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(cert._id)}
                          className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs"
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
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-6">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 disabled:opacity-50"
            >
              ← Previous
            </button>
            <span>Page {page} of {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 disabled:opacity-50"
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}