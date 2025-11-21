import { useState, useEffect } from "react";
import axiosInstance from "../axiosInstance";
import Swal from "sweetalert2";

export default function IncomingPaymentForm({ onClose, editPaymentId = null }) {
// Get current date in YYYY-MM-DD format for input fields, and dd/mm/yyyy for display
const getCurrentDate = () => {
  const now = new Date();
  const timezoneOffset = now.getTimezoneOffset() * 60000;
  const localDate = new Date(now.getTime() - timezoneOffset);
  return localDate.toISOString().split('T')[0];
};

// Format date to dd/mm/yyyy for display
const formatDateForDisplay = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  
  // Get day, month, and year
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Months are 0-based
  const year = date.getFullYear();
  
  return `${day}/${month}/${year}`;
};

  const [formData, setFormData] = useState({
    dateOfPayment: getCurrentDate(),
    customerName: "",
    modeOfPayment: "cash",
    chequeDate: "",
    chequeNumber: "",
    bankName: "",
    cashGivenTo: "",
    amount: "",
    remarks: "",
    files: []
  });
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [deletingFiles, setDeletingFiles] = useState([]);

  // Fetch customers
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await axiosInstance.get("/customers/all");
        
        let customersData = [];
        
        if (Array.isArray(response.data)) {
          customersData = response.data;
        } else if (response.data && Array.isArray(response.data.data)) {
          customersData = response.data.data;
        } else if (response.data && response.data.customers && Array.isArray(response.data.customers)) {
          customersData = response.data.customers;
        } else if (response.data && response.data.data && Array.isArray(response.data.data.customers)) {
          customersData = response.data.data.customers;
        }
        
        setCustomers(customersData);
        
      } catch (error) {
        console.error("Error fetching customers:", error);
        Swal.fire({
          title: "Error!",
          text: "Failed to fetch customers",
          icon: "error",
          confirmButtonColor: "#2563eb",
        });
      }
    };
    fetchCustomers();
  }, []);

  // Fetch payment data if editing
  useEffect(() => {
    if (editPaymentId) {
      const fetchPaymentData = async () => {
        try {
          setLoading(true);
          const response = await axiosInstance.get(`/incoming-payments/${editPaymentId}`);
          const payment = response.data.data;
          
          
          setFormData({
  dateOfPayment: new Date(payment.dateOfPayment).toISOString().split('T')[0],
  customerName: payment.customerName,
  modeOfPayment: payment.modeOfPayment,
  chequeDate: payment.chequeDate ? new Date(payment.chequeDate).toISOString().split('T')[0] : "",
  chequeNumber: payment.chequeNumber || "",
  bankName: payment.bankName || "",
  cashGivenTo: payment.cashGivenTo || "",
  amount: payment.amount.toString(),
  remarks: payment.remarks || "",
  files: payment.files || []
});
          
          setIsEditing(true);
        } catch (error) {
          console.error("Error fetching payment data:", error);
          Swal.fire({
            title: "Error!",
            text: "Failed to load payment data",
            icon: "error",
            confirmButtonColor: "#2563eb",
          });
          onClose();
        } finally {
          setLoading(false);
        }
      };
      
      fetchPaymentData();
    }
  }, [editPaymentId, onClose]);

const handleInputChange = (e) => {
  const { name, value } = e.target;
  setFormData(prev => ({
    ...prev,
    [name]: value
  }));

  // Auto-open dropdown when typing in customer name field
  if (name === 'customerName' && value.length > 0) {
    setIsCustomerDropdownOpen(true);
  }
};

 // Replace the deleteFileFromCloudinary function and removeFile function with:

// Function to delete file from Cloudinary via backend
const deleteFileFromCloudinary = async (fileUrl) => {
  try {
    
    const response = await axiosInstance.post("/cloudinary/delete", {
      fileUrl: fileUrl
    });

    if (!response.data.success) {
      throw new Error(response.data.message);
    }

    return true;
  } catch (error) {
    console.error("Error deleting file from Cloudinary:", error);
    throw error;
  }
};

const removeFile = async (index) => {
  const fileToRemove = formData.files[index];
  
  // Show confirmation for deletion
  const result = await Swal.fire({
    title: "Delete File?",
    text: "This file will be permanently deleted from Cloudinary.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    cancelButtonColor: "#2563eb",
    confirmButtonText: "Yes, delete it!",
    cancelButtonText: "Cancel"
  });

  if (!result.isConfirmed) return;

  try {
    setDeletingFiles(prev => [...prev, index]);
    
    // Delete from Cloudinary only if it's a Cloudinary URL
    if (fileToRemove.includes('cloudinary.com')) {
      await deleteFileFromCloudinary(fileToRemove);
    }
    
    // Remove from form data
    setFormData(prev => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index)
    }));

    Swal.fire({
      title: "Deleted!",
      text: "File has been deleted successfully.",
      icon: "success",
      confirmButtonColor: "#2563eb",
    });
  } catch (error) {
    console.error("Error deleting file:", error);
    Swal.fire({
      title: "Delete Failed!",
      text: error.response?.data?.message || "Failed to delete file from Cloudinary. It has been removed from this payment but may still exist in Cloudinary.",
      icon: "warning",
      confirmButtonColor: "#2563eb",
    });
    
    // Still remove from form data even if Cloudinary deletion fails
    setFormData(prev => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index)
    }));
  } finally {
    setDeletingFiles(prev => prev.filter(i => i !== index));
  }
};

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    try {
      const uploadPromises = files.map(async (file) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", "bank_uploads");

        const response = await fetch(
          `https://api.cloudinary.com/v1_1/dcr8k5amk/upload`,
          {
            method: "POST",
            body: formData,
          }
        );

        if (!response.ok) throw new Error("Upload failed");
        const data = await response.json();
        return data.secure_url;
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      setFormData(prev => ({
        ...prev,
        files: [...prev.files, ...uploadedUrls]
      }));

      Swal.fire({
        title: "Success!",
        text: "Files uploaded successfully",
        icon: "success",
        confirmButtonColor: "#2563eb",
      });
    } catch (error) {
      console.error("Upload error:", error);
      Swal.fire({
        title: "Upload Failed!",
        text: "Failed to upload files",
        icon: "error",
        confirmButtonColor: "#2563eb",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.customerName || !formData.amount) {
      Swal.fire({
        title: "Missing Fields!",
        text: "Please fill in all required fields",
        icon: "warning",
        confirmButtonColor: "#2563eb",
      });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        amount: parseFloat(formData.amount)
      };


      let response;
      if (isEditing) {
        response = await axiosInstance.put(`/incoming-payments/${editPaymentId}`, payload);
      } else {
        response = await axiosInstance.post("/incoming-payments", payload);
      }
      
      
      Swal.fire({
        title: "Success!",
        text: `Payment ${isEditing ? 'updated' : 'recorded'} successfully`,
        icon: "success",
        confirmButtonColor: "#2563eb",
      });
      
      onClose();
    } catch (error) {
      console.error("Error submitting payment:", error);
      
      if (error.response) {
        console.error("Response data:", error.response.data);
        console.error("Response status:", error.response.status);
        
        Swal.fire({
          title: "Error!",
          text: error.response.data.message || `Failed to ${isEditing ? 'update' : 'record'} payment`,
          icon: "error",
          confirmButtonColor: "#2563eb",
        });
      } else if (error.request) {
        console.error("Request error:", error.request);
        Swal.fire({
          title: "Network Error!",
          text: "No response received from server",
          icon: "error",
          confirmButtonColor: "#2563eb",
        });
      } else {
        console.error("Error:", error.message);
        Swal.fire({
          title: "Error!",
          text: error.message,
          icon: "error",
          confirmButtonColor: "#2563eb",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const getMaxDate = () => {
    return getCurrentDate();
  };

  // Function to view file in new tab
  const viewFile = (fileUrl) => {
    window.open(fileUrl, '_blank');
  };

  // Get file type icon
  const getFileIcon = (fileUrl) => {
    const extension = fileUrl.split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(extension)) {
      return '🖼️';
    } else if (['pdf'].includes(extension)) {
      return '📄';
    } else if (['doc', 'docx'].includes(extension)) {
      return '📝';
    } else if (['xls', 'xlsx'].includes(extension)) {
      return '📊';
    } else {
      return '📎';
    }
  };

  if (loading && isEditing) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
            <p className="text-blue-700 font-semibold">Loading payment data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {isEditing ? 'Edit Payment' : 'Record Incoming Payment from Customer'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
              {/* Mode of Payment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mode of Payment *
              </label>
              <select
                name="modeOfPayment"
                value={formData.modeOfPayment}
                onChange={handleInputChange}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                required
              >
                <option value="cash">Cash</option>
                <option value="upi">UPI</option>
                <option value="cheque">Cheque</option>
                <option value="bankTransfer">Bank Transfer</option>
              </select>
            </div>

 {/* Conditional Fields based on Payment Mode */}
            {formData.modeOfPayment === "cheque" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-blue-50 rounded-xl">
                <div>
                    <div className="flex items-center space-x-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cheque Date
                  </label>
                 <span className="text-red-500 text-xs font-bold">*</span>
  </div>
  <p className="text-xs text-gray-600 font-medium">
    Date mention on top right side of cheque
  </p>
                  <input
                    type="date"
                    name="chequeDate"
                    value={formData.chequeDate}
                    onChange={handleInputChange}
                    max={getMaxDate()}
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cheque Number
                  </label>
                  <input
                    type="text"
                    name="chequeNumber"
                    value={formData.chequeNumber}
                    onChange={handleInputChange}
                    placeholder="Enter cheque number"
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bank Name
                  </label>
                  <input
                    type="text"
                    name="bankName"
                    value={formData.bankName}
                    onChange={handleInputChange}
                    placeholder="Enter bank name"
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                  />
                </div>
              </div>
            )}

            {formData.modeOfPayment === "cash" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cash Given To
                </label>
                <input
                  type="text"
                  name="cashGivenTo"
                  value={formData.cashGivenTo}
                  onChange={handleInputChange}
                  placeholder="Enter recipient name"
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                />
              </div>
            )}


            {/* Date of Payment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date of Receipt of Cheque *
              </label>
              <input
                type="date"
                name="dateOfPayment"
                value={formData.dateOfPayment}
                onChange={handleInputChange}
                max={getMaxDate()}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                required
              />
             <p className="text-xs text-gray-500 mt-1">
  Maximum allowed date: {formatDateForDisplay(getMaxDate())}
</p>
            </div>

       {/* Customer Name with Search and Manual Entry */}
<div className="relative">
  <label className="block text-sm font-medium text-gray-700 mb-2">
    Customer Name *
  </label>
  <div className="relative">
    <input
      type="text"
      name="customerName"
      value={formData.customerName}
      onChange={handleInputChange}
      onFocus={() => setIsCustomerDropdownOpen(true)}
      onBlur={() => setTimeout(() => setIsCustomerDropdownOpen(false), 200)}
      placeholder="Type to search customers or enter manually..."
      required
      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
    />
    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  </div>
  
  {/* Search Dropdown */}
  {isCustomerDropdownOpen && customers.length > 0 && (
    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
      {customers
        .filter(customer => {
          const customerName = customer.name || '';
          return customerName.toLowerCase().includes(formData.customerName.toLowerCase());
        })
        .map(customer => (
          <div
            key={customer._id}
            onClick={() => {
              setFormData(prev => ({
                ...prev,
                customerName: customer.name
              }));
              setIsCustomerDropdownOpen(false);
            }}
            className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors duration-150"
          >
            <div className="font-medium text-gray-900">
              {customer.name}
            </div>
            {customer.email && (
              <div className="text-sm text-gray-500 mt-1">
                {customer.email}
              </div>
            )}
            {customer.phone && (
              <div className="text-sm text-gray-500">
                📞 {customer.phone}
              </div>
            )}
          </div>
        ))
      }
      
      {/* Manual Entry Option */}
      {formData.customerName && customers.filter(customer => 
        customer.name?.toLowerCase().includes(formData.customerName.toLowerCase())
      ).length === 0 && (
        <div
          onClick={() => {
            setIsCustomerDropdownOpen(false);
          }}
          className="px-4 py-3 bg-green-50 hover:bg-green-100 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors duration-150"
        >
          <div className="font-medium text-gray-900 flex items-center">
            <span className="mr-2">➕</span>
            Use "{formData.customerName}" as new customer
          </div>
          <div className="text-sm text-gray-500 mt-1">
            This customer will be added manually
          </div>
        </div>
      )}
      
      {/* No results message when no input */}
      {!formData.customerName && customers.filter(customer => 
        customer.name?.toLowerCase().includes(formData.customerName.toLowerCase())
      ).length === 0 && (
        <div className="px-4 py-3 text-gray-500 text-center">
          Type to search customers or enter a new customer name
        </div>
      )}
    </div>
  )}
  
  {/* Info text */}
  <p className="text-gray-500 text-sm mt-1">
    {customers.length === 0 
      ? "Loading customers..." 
      : "Select from dropdown or type to add new customer manually"
    }
  </p>
</div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount *
              </label>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleInputChange}
                placeholder="Enter amount"
                step="0.01"
                min="0"
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                required
              />
            </div>

            {/* Files Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Files
              </label>
              <input
                type="file"
                multiple
                onChange={handleFileUpload}
                disabled={uploading}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
              />
              {uploading && (
                <p className="text-blue-600 text-sm mt-2">Uploading files...</p>
              )}
              
              {/* Display uploaded files */}
              {formData.files.length > 0 && (
                <div className="mt-3 space-y-2">
                  <p className="text-sm font-medium text-gray-700">
                    {isEditing ? 'Current Files' : 'Uploaded Files'}:
                  </p>
                  {formData.files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-center space-x-3 flex-1">
                        <button
                          type="button"
                          onClick={() => viewFile(file)}
                          className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 text-sm font-medium truncate flex-1 text-left"
                        >
                          <span className="text-base">{getFileIcon(file)}</span>
                          <span className="truncate">{file.split('/').pop()}</span>
                        </button>
                        <span className="text-xs text-gray-500 bg-blue-100 px-2 py-1 rounded">
                          {file.split('.').pop().toUpperCase()}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        disabled={deletingFiles.includes(index)}
                        className="text-red-500 hover:text-red-700 ml-3 p-1 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Delete file from Cloudinary"
                      >
                        {deletingFiles.includes(index) ? (
                          <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          "✕"
                        )}
                      </button>
                    </div>
                  ))}
                  <p className="text-xs text-gray-500">
                    Click on file name to view. Click ✕ to permanently delete from Cloudinary.
                  </p>
                </div>
              )}
            </div>

   {/* Remarks */}
<div>
  <label className="block text-sm font-medium text-gray-700 mb-2">
    Remarks {formData.modeOfPayment === "cheque" && "(Mention if Cheque needs to be deposited after the Cheque presented)"}
    {formData.modeOfPayment !== "cheque" && "(Additional notes or instructions)"}
  </label>
  <textarea
    name="remarks"
    value={formData.remarks}
    onChange={handleInputChange}
    placeholder={
      formData.modeOfPayment === "cheque" 
        ? "E.g., Cheque needs to be deposited, hold for clearance, etc."
        : "Enter any additional remarks or instructions"
    }
    rows="3"
    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
  />
</div>

            {/* Submit Button */}
            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-500 text-white py-3 rounded-xl font-semibold hover:bg-gray-600 transition-all duration-300"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-all duration-300 disabled:opacity-50"
              >
                {loading ? "Processing..." : (isEditing ? "Update Payment" : "Record Payment")}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}