import { useEffect, useState } from "react";
import axiosInstance from "../axiosInstance";
import InternalNavbar from "../components/InternalNavbar";
import Swal from "sweetalert2";
import { motion, AnimatePresence } from "framer-motion";

export default function EPFOManagement() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [availableYears, setAvailableYears] = useState([]);
  
  // Form states
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingDoc, setEditingDoc] = useState(null);
  
  // Monthly Challan states
  const [challanFile, setChallanFile] = useState(null);
  const [challanUploading, setChallanUploading] = useState(false);
  const [challanRemarks, setChallanRemarks] = useState("");
  const [uploadedChallan, setUploadedChallan] = useState(null);
  const [existingChallan, setExistingChallan] = useState(null);
  
  // Payment Receipt states
  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptUploading, setReceiptUploading] = useState(false);
  const [receiptRemarks, setReceiptRemarks] = useState("");
  const [uploadedReceipt, setUploadedReceipt] = useState(null);
  const [existingReceipt, setExistingReceipt] = useState(null);

  const months = [
    { value: 1, name: "January" },
    { value: 2, name: "February" },
    { value: 3, name: "March" },
    { value: 4, name: "April" },
    { value: 5, name: "May" },
    { value: 6, name: "June" },
    { value: 7, name: "July" },
    { value: 8, name: "August" },
    { value: 9, name: "September" },
    { value: 10, name: "October" },
    { value: 11, name: "November" },
    { value: 12, name: "December" }
  ];

  // Generate year range (current year - 5 to current year + 2)
  const generateYearRange = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear - 5; i <= currentYear + 2; i++) {
      years.push(i);
    }
    return years;
  };

  useEffect(() => {
    fetchDocuments();
  }, [selectedYear]);

  useEffect(() => {
    // Update available years based on fetched documents
    if (documents.length > 0) {
      const years = [...new Set(documents.map(doc => doc.year))];
      const allYears = [...new Set([...generateYearRange(), ...years])];
      setAvailableYears(allYears.sort((a, b) => b - a));
    } else {
      setAvailableYears(generateYearRange().sort((a, b) => b - a));
    }
  }, [documents]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get(`/epfo?year=${selectedYear}`);
      if (res.data.success) {
        setDocuments(res.data.documents);
      }
    } catch (err) {
      console.error("Error fetching EPFO documents:", err);
      Swal.fire("Error", "Failed to load EPFO documents", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleChallanUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setChallanUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axiosInstance.post("/epfo/upload-challan", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data.success) {
        setUploadedChallan({
          url: res.data.url,
          publicId: res.data.publicId,
          originalName: res.data.originalName
        });
        
        Swal.fire({
          title: "Success!",
          text: "Monthly challan uploaded successfully",
          icon: "success",
          timer: 1500,
          showConfirmButton: false
        });
      }
    } catch (err) {
      console.error("Upload error:", err);
      Swal.fire("Error", "Failed to upload file", "error");
    } finally {
      setChallanUploading(false);
    }
  };

  const handleReceiptUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setReceiptUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axiosInstance.post("/epfo/upload-receipt", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data.success) {
        setUploadedReceipt({
          url: res.data.url,
          publicId: res.data.publicId,
          originalName: res.data.originalName
        });
        
        Swal.fire({
          title: "Success!",
          text: "Payment receipt uploaded successfully",
          icon: "success",
          timer: 1500,
          showConfirmButton: false
        });
      }
    } catch (err) {
      console.error("Upload error:", err);
      Swal.fire("Error", "Failed to upload file", "error");
    } finally {
      setReceiptUploading(false);
    }
  };

  const handleEdit = (month, doc) => {
    setEditingDoc(doc);
    setSelectedMonth(month);
    
    // Set existing challan data
    if (doc?.monthlyChallan) {
      setExistingChallan(doc.monthlyChallan);
      setChallanRemarks(doc.monthlyChallan.remarks || "");
    } else {
      setExistingChallan(null);
      setChallanRemarks("");
    }
    
    // Set existing receipt data
    if (doc?.paymentReceipt) {
      setExistingReceipt(doc.paymentReceipt);
      setReceiptRemarks(doc.paymentReceipt.remarks || "");
    } else {
      setExistingReceipt(null);
      setReceiptRemarks("");
    }
    
    // Reset new uploads
    setUploadedChallan(null);
    setUploadedReceipt(null);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedMonth) {
      Swal.fire("Error", "Please select a month", "error");
      return;
    }

    if (!uploadedChallan && !uploadedReceipt && !existingChallan && !existingReceipt) {
      Swal.fire("Error", "Please upload at least one document", "error");
      return;
    }

    try {
      setLoading(true);
      
      const submitData = {
        year: selectedYear,
        month: selectedMonth,
        monthlyChallan: uploadedChallan ? {
          file: uploadedChallan,
          remarks: challanRemarks
        } : (existingChallan ? {
          file: existingChallan.file,
          remarks: challanRemarks
        } : undefined),
        paymentReceipt: uploadedReceipt ? {
          file: uploadedReceipt,
          remarks: receiptRemarks
        } : (existingReceipt ? {
          file: existingReceipt.file,
          remarks: receiptRemarks
        } : undefined)
      };
      
      const res = await axiosInstance.post("/epfo", submitData);
      
      if (res.data.success) {
        Swal.fire({
          title: "Success!",
          text: editingDoc ? "EPFO documents updated successfully" : "EPFO documents saved successfully",
          icon: "success",
          timer: 2000,
          showConfirmButton: false
        });
        
        resetForm();
        fetchDocuments();
      }
    } catch (err) {
      console.error("Submit error:", err);
      Swal.fire("Error", err.response?.data?.message || "Failed to save EPFO documents", "error");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingDoc(null);
    setSelectedMonth(null);
    setChallanFile(null);
    setChallanRemarks("");
    setUploadedChallan(null);
    setExistingChallan(null);
    setReceiptFile(null);
    setReceiptRemarks("");
    setUploadedReceipt(null);
    setExistingReceipt(null);
  };

  const handleDeleteChallan = async (docId) => {
    const confirm = await Swal.fire({
      title: "Delete Monthly Challan?",
      text: "This will permanently delete the file",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it",
    });

    if (confirm.isConfirmed) {
      try {
        await axiosInstance.delete(`/epfo/challan/${docId}`);
        Swal.fire("Deleted!", "Monthly challan deleted successfully", "success");
        fetchDocuments();
      } catch (err) {
        console.error("Delete error:", err);
        Swal.fire("Error", "Failed to delete monthly challan", "error");
      }
    }
  };

  const handleDeleteReceipt = async (docId) => {
    const confirm = await Swal.fire({
      title: "Delete Payment Receipt?",
      text: "This will permanently delete the file",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it",
    });

    if (confirm.isConfirmed) {
      try {
        await axiosInstance.delete(`/epfo/receipt/${docId}`);
        Swal.fire("Deleted!", "Payment receipt deleted successfully", "success");
        fetchDocuments();
      } catch (err) {
        console.error("Delete error:", err);
        Swal.fire("Error", "Failed to delete payment receipt", "error");
      }
    }
  };

  const getDocumentForMonth = (month) => {
    return documents.find(doc => doc.month === month);
  };

  const formatDate = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString('en-GB');
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <InternalNavbar />
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              EPFO Document Management
            </h1>
            <p className="text-gray-600 text-xs mt-1">
              Manage Monthly Challan and Payment Receipt documents for EPFO
            </p>
          </div>
          <div className="flex gap-3">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="border rounded-lg px-4 py-2 bg-white"
            >
              {availableYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2"
            >
              {showForm ? "✕ Cancel" : "+ Add Documents"}
            </button>
          </div>
        </div>

        {/* Add/Edit Form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white shadow-lg rounded-lg p-6 mb-6"
            >
              <h2 className="text-xl font-bold mb-4">
                {editingDoc ? `Edit Documents for ${months.find(m => m.value === selectedMonth)?.name}` : "Add EPFO Documents"}
              </h2>
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Select Month *</label>
                    <select
                      value={selectedMonth || ""}
                      onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                      className="border rounded p-2 w-full"
                      required
                      disabled={editingDoc}
                    >
                      <option value="">Select Month</option>
                      {months.map(month => (
                        <option key={month.value} value={month.value}>
                          {month.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Monthly Challan Section */}
                <div className="border-t pt-4 mb-4">
                  <h3 className="text-lg font-semibold mb-3 text-blue-700">📋 Monthly Challan</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Challan File {!existingChallan && "(Required for new)"}
                      </label>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleChallanUpload}
                        className="border rounded p-2 w-full"
                        disabled={challanUploading}
                      />
                      {challanUploading && <p className="text-xs text-blue-500 mt-1">Uploading...</p>}
                      {uploadedChallan && (
                        <p className="text-xs text-green-600 mt-1">
                          ✓ New file uploaded: {uploadedChallan.originalName}
                        </p>
                      )}
                      {existingChallan && !uploadedChallan && (
                        <p className="text-xs text-blue-600 mt-1">
                          Current file: {existingChallan.file?.originalName || "Existing file"}
                          <button
                            type="button"
                            onClick={() => {
                              setExistingChallan(null);
                              setUploadedChallan(null);
                            }}
                            className="ml-2 text-red-500 hover:text-red-700 text-xs underline"
                          >
                            Remove and upload new
                          </button>
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Remarks</label>
                      <textarea
                        value={challanRemarks}
                        onChange={(e) => setChallanRemarks(e.target.value)}
                        className="border rounded p-2 w-full"
                        rows="2"
                        placeholder="Enter remarks for monthly challan..."
                      />
                    </div>
                  </div>
                </div>

                {/* Payment Receipt Section */}
                <div className="border-t pt-4 mb-4">
                  <h3 className="text-lg font-semibold mb-3 text-green-700">💰 Payment Receipt</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Receipt File {!existingReceipt && "(Required for new)"}
                      </label>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleReceiptUpload}
                        className="border rounded p-2 w-full"
                        disabled={receiptUploading}
                      />
                      {receiptUploading && <p className="text-xs text-blue-500 mt-1">Uploading...</p>}
                      {uploadedReceipt && (
                        <p className="text-xs text-green-600 mt-1">
                          ✓ New file uploaded: {uploadedReceipt.originalName}
                        </p>
                      )}
                      {existingReceipt && !uploadedReceipt && (
                        <p className="text-xs text-blue-600 mt-1">
                          Current file: {existingReceipt.file?.originalName || "Existing file"}
                          <button
                            type="button"
                            onClick={() => {
                              setExistingReceipt(null);
                              setUploadedReceipt(null);
                            }}
                            className="ml-2 text-red-500 hover:text-red-700 text-xs underline"
                          >
                            Remove and upload new
                          </button>
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Remarks</label>
                      <textarea
                        value={receiptRemarks}
                        onChange={(e) => setReceiptRemarks(e.target.value)}
                        className="border rounded p-2 w-full"
                        rows="2"
                        placeholder="Enter remarks for payment receipt..."
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={loading || challanUploading || receiptUploading}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium disabled:opacity-50"
                  >
                    {loading ? "Saving..." : editingDoc ? "Update Documents" : "Save Documents"}
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
            </motion.div>
          )}
        </AnimatePresence>

        {/* EPFO Documents Table */}
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="bg-white shadow-lg rounded-lg overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead className="bg-slate-200">
                <tr>
                  <th className="border p-3 text-left text-xs">S.No</th>
                  <th className="border p-3 text-left text-xs">Month</th>
                  <th className="border p-3 text-left text-xs">Monthly Challan</th>
                  <th className="border p-3 text-left text-xs">Challan Remarks</th>
                  <th className="border p-3 text-left text-xs">Payment Receipt</th>
                  <th className="border p-3 text-left text-xs">Receipt Remarks</th>
                  <th className="border p-3 text-left text-xs">Uploaded By</th>
                  <th className="border p-3 text-left text-xs">Last Updated</th>
                  <th className="border p-3 text-left text-xs">Actions</th>
                </tr>
              </thead>
              <tbody>
                {months.map((month, index) => {
                  const doc = getDocumentForMonth(month.value);
                  return (
                    <tr key={month.value} className="hover:bg-slate-50">
                      <td className="border p-2 text-xs">{index + 1}</td>
                      <td className="border p-2 text-xs font-semibold">{month.name}</td>
                      
                      {/* Monthly Challan */}
                      <td className="border p-2">
                        {doc?.monthlyChallan?.file?.url ? (
                          <button
                            onClick={() => {
                              const isPDF = doc.monthlyChallan.file.url.match(/\.pdf$/i);
                              if (isPDF) {
                                window.open(doc.monthlyChallan.file.url, "_blank");
                              } else {
                                Swal.fire({
                                  imageUrl: doc.monthlyChallan.file.url,
                                  imageAlt: "Monthly Challan",
                                  showCloseButton: true,
                                  showConfirmButton: false,
                                });
                              }
                            }}
                            className="text-blue-600 hover:text-blue-800 underline text-xs"
                          >
                            View Challan
                          </button>
                        ) : (
                          <span className="text-gray-400 text-xs">Not uploaded</span>
                        )}
                      </td>
                      <td className="border p-2 text-xs">
                        {doc?.monthlyChallan?.remarks || "-"}
                      </td>
                      
                      {/* Payment Receipt */}
                      <td className="border p-2">
                        {doc?.paymentReceipt?.file?.url ? (
                          <button
                            onClick={() => {
                              const isPDF = doc.paymentReceipt.file.url.match(/\.pdf$/i);
                              if (isPDF) {
                                window.open(doc.paymentReceipt.file.url, "_blank");
                              } else {
                                Swal.fire({
                                  imageUrl: doc.paymentReceipt.file.url,
                                  imageAlt: "Payment Receipt",
                                  showCloseButton: true,
                                  showConfirmButton: false,
                                });
                              }
                            }}
                            className="text-green-600 hover:text-green-800 underline text-xs"
                          >
                            View Receipt
                          </button>
                        ) : (
                          <span className="text-gray-400 text-xs">Not uploaded</span>
                        )}
                      </td>
                      <td className="border p-2 text-xs">
                        {doc?.paymentReceipt?.remarks || "-"}
                      </td>
                      
                      <td className="border p-2 text-xs">
                        {doc?.monthlyChallan?.uploadedBy?.name || 
                         doc?.paymentReceipt?.uploadedBy?.name || "-"}
                      </td>
                      <td className="border p-2 text-xs">
                        {doc?.updatedAt ? formatDate(doc.updatedAt) : 
                         doc?.createdAt ? formatDate(doc.createdAt) : "-"}
                      </td>
                      
                      <td className="border p-2">
                        <div className="flex gap-1 flex-wrap">
                          {doc && (
                            <>
                              <button
                                onClick={() => handleEdit(month.value, doc)}
                                className="bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded text-xs"
                              >
                                Edit
                              </button>
                              {doc.monthlyChallan?.file?.url && (
                                <button
                                  onClick={() => handleDeleteChallan(doc._id)}
                                  className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs"
                                >
                                  Delete Challan
                                </button>
                              )}
                              {doc.paymentReceipt?.file?.url && (
                                <button
                                  onClick={() => handleDeleteReceipt(doc._id)}
                                  className="bg-orange-500 hover:bg-orange-600 text-white px-2 py-1 rounded text-xs"
                                >
                                  Delete Receipt
                                </button>
                              )}
                            </>
                          )}
                          {!doc && (
                            <button
                              onClick={() => {
                                setSelectedMonth(month.value);
                                setEditingDoc(null);
                                setExistingChallan(null);
                                setExistingReceipt(null);
                                setChallanRemarks("");
                                setReceiptRemarks("");
                                setUploadedChallan(null);
                                setUploadedReceipt(null);
                                setShowForm(true);
                              }}
                              className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs"
                            >
                              Add Documents
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}