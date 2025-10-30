import React, { useState, useEffect } from 'react';
import axiosInstance from '../axiosInstance';
import axios from 'axios';
import InternalNavbar from './InternalNavbar';
import Swal from 'sweetalert2';
import toast from 'react-hot-toast';

const OutgoingPayments = () => {
  const [payments, setPayments] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [editUploading, setEditUploading] = useState(false);
const [editUploadProgress, setEditUploadProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [nextBillNo, setNextBillNo] = useState(1);
  const [uploading, setUploading] = useState(false);
const [uploadProgress, setUploadProgress] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
   const [filterSupplier, setFilterSupplier] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [filteredPayments, setFilteredPayments] = useState([]);
  // Filter payments based on supplier and date range
useEffect(() => {
  if (payments.length > 0) {
    let filtered = payments;
    
    // Filter by supplier
    if (filterSupplier) {
      filtered = filtered.filter(payment => 
        payment.supplierName?.toLowerCase().includes(filterSupplier.toLowerCase())
      );
    }
    
    // Filter by date range
    if (filterDateFrom) {
      filtered = filtered.filter(payment => {
        const paymentDate = new Date(payment.dateOfPayment);
        const fromDate = new Date(filterDateFrom);
        return paymentDate >= fromDate;
      });
    }
    
    if (filterDateTo) {
      filtered = filtered.filter(payment => {
        const paymentDate = new Date(payment.dateOfPayment);
        const toDate = new Date(filterDateTo);
        // Set toDate to end of day for inclusive filtering
        toDate.setHours(23, 59, 59, 999);
        return paymentDate <= toDate;
      });
    }
    
    setFilteredPayments(filtered);
  } else {
    setFilteredPayments(payments);
  }
}, [payments, filterSupplier, filterDateFrom, filterDateTo]);

// Reset all filters
const resetFilters = () => {
  setFilterSupplier('');
  setFilterDateFrom('');
  setFilterDateTo('');
};

  const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Invalid Date';
  
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  
  return `${day}/${month}/${year}`;
};

// Helper function to format date for input field (YYYY-MM-DD)
const formatDateForInput = (date) => {
  if (!date) return '';
  
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) return '';
  
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};
  const [formData, setFormData] = useState({
  dateOfPayment: formatDateForInput(new Date()), // Use the new function
    supplierName: '',
    amount: '',
    paymentAuthorizedBy: '',
    modeOfPayment: '',
    billNo: '',
    remarks: '',
    files: []
  });
const [editingPayment, setEditingPayment] = useState(null);
const [editFormData, setEditFormData] = useState({
  dateOfPayment: '',
  supplierName: '',
  amount: '',
  paymentAuthorizedBy: '',
  modeOfPayment: '',
  billNo: '',
  remarks: '',
  files: []
});
const [editLoading, setEditLoading] = useState(false);
  // Fetch suppliers
  useEffect(() => {
    fetchSuppliers();
  }, []);

  // Fetch payments with pagination
  useEffect(() => {
    fetchPayments(currentPage);
  }, [currentPage]);

  // Calculate next bill number when payments are loaded
useEffect(() => {
  if (!loading && payments.length >= 0) {
    calculateNextBillNo();
  }
}, [payments, loading]);

  const fetchSuppliers = async () => {
    try {
      const response = await axiosInstance.get('/suppliers');
      console.log('Suppliers API response:', response.data); // Debug log
      
      // Handle different response structures
      let suppliersData = [];
      
      if (Array.isArray(response.data)) {
        suppliersData = response.data;
      } else if (response.data && Array.isArray(response.data.suppliers)) {
        suppliersData = response.data.suppliers;
      } else if (response.data && Array.isArray(response.data.data)) {
        suppliersData = response.data.data;
      }
      
      setSuppliers(suppliersData || []);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      setSuppliers([]);
    }
  };

  const fetchPayments = async (page) => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/outgoing-payments?page=${page}&limit=10`);
      
      // Handle different response structures
      let paymentsData = [];
      let pagesData = 1;
      
      if (response.data && Array.isArray(response.data.payments)) {
        paymentsData = response.data.payments;
        pagesData = response.data.totalPages || 1;
      } else if (Array.isArray(response.data)) {
        paymentsData = response.data;
      } else if (response.data && Array.isArray(response.data.data)) {
        paymentsData = response.data.data;
        pagesData = response.data.totalPages || 1;
      }
      
      setPayments(paymentsData);
      setTotalPages(pagesData);
    } catch (error) {
      console.error('Error fetching payments:', error);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

const handleFileUpload = async (e) => {
  const files = Array.from(e.target.files);
  if (files.length === 0) return;

  const uploadedFiles = [];
  setUploading(true);
  setUploadProgress(0);

  try {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        alert(`File ${file.name} is too large. Maximum size is 10MB.`);
        continue;
      }

      const uploadData = new FormData();
      uploadData.append('file', file);
      uploadData.append('upload_preset', 'bank_uploads');

      // Update progress for current file
      setUploadProgress(Math.round((i / files.length) * 100));

      try {
        const response = await axios.post(
          `https://api.cloudinary.com/v1_1/dcr8k5amk/upload`,
          uploadData,
          {
            onUploadProgress: (progressEvent) => {
              if (progressEvent.total) {
                const fileProgress = Math.round(
                  (progressEvent.loaded * 100) / progressEvent.total
                );
                // Calculate overall progress including current file
                const overallProgress = Math.round(
                  (i / files.length) * 100 + (fileProgress / files.length)
                );
                setUploadProgress(overallProgress);
              }
            }
          }
        );
        
        uploadedFiles.push({
          url: response.data.secure_url,
          public_id: response.data.public_id,
          name: file.name
        });
      } catch (error) {
        console.error('Error uploading file:', error);
        alert(`Error uploading file: ${file.name} - ${error.response?.data?.error?.message || error.message}`);
      }
    }

    // Final progress
    setUploadProgress(100);
    
    // Add uploaded files to form data
    setFormData(prev => ({
      ...prev,
      files: [...prev.files, ...uploadedFiles]
    }));

  } catch (error) {
    console.error('Upload process failed:', error);
    alert('Upload failed. Please try again.');
  } finally {
    // Small delay to show 100% progress
    setTimeout(() => {
      setUploading(false);
      setUploadProgress(0);
    }, 500);
  }
};

  const removeFile = (index) => {
    setFormData(prev => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index)
    }));
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    await axiosInstance.post('/outgoing-payments', formData);
    toast.success('Payment created successfully!');
    
    // Reset form with current date in proper format
    setFormData(prev => ({
      dateOfPayment: formatDateForInput(new Date()), // Use the new function
      supplierName: '',
      amount: '',
      paymentAuthorizedBy: '',
      modeOfPayment: '',
      billNo: prev.billNo,
      remarks: '',
      files: []
    }));
    
    fetchPayments(currentPage);
  } catch (error) {
    console.error('Error creating payment:', error);
    toast.error('Error creating payment: ' + (error.response?.data?.message || error.message));
  }
};

const handleFileClick = (files, startIndex = 0) => {
  const file = files[startIndex];
  const isImage = file.url.match(/\.(jpg|jpeg|png|gif|webp)$/i);
  const isPDF = file.url.match(/\.(pdf)$/i);
  
  if (isPDF) {
    // Display PDF in iframe
    Swal.fire({
      title: file.name,
      html: `
        <div class="text-left">
          <div class="mb-4" style="height: 70vh;">
            <iframe 
              src="${file.url}" 
              width="100%" 
              height="100%" 
              frameborder="0"
              style="border: 1px solid #e5e7eb; border-radius: 0.5rem;"
            >
              Your browser does not support PDFs. 
              <a href="${file.url}" target="_blank">Download PDF</a>
            </iframe>
          </div>
          <div class="text-sm text-gray-600 mb-4">
            <p><strong>File Name:</strong> ${file.name}</p>
            <p><strong>File Type:</strong> PDF</p>
            ${files.length > 1 ? `<p><strong>File ${startIndex + 1} of ${files.length}</strong></p>` : ''}
          </div>
          <div class="text-center mt-4">
            <a 
              href="${file.url}" 
              target="_blank" 
              class="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
              Open in New Tab
            </a>
          </div>
        </div>
      `,
      showCloseButton: true,
      showConfirmButton: false,
      width: '90%',
      padding: '1rem',
      customClass: {
        popup: 'pdf-modal'
      },
      didOpen: () => {
        // Add custom styles for PDF modal
        const popup = Swal.getPopup();
        if (popup) {
          popup.style.maxWidth = '1200px';
          popup.style.maxHeight = '90vh';
        }
      }
    });
  } else if (isImage) {
    // Display image
    Swal.fire({
      title: file.name,
      html: `
        <div class="text-left">
          <div class="mb-4">
            <img src="${file.url}" alt="${file.name}" class="max-w-full max-h-96 mx-auto rounded-lg shadow-md">
          </div>
          <div class="text-sm text-gray-600 mb-4">
            <p><strong>File Name:</strong> ${file.name}</p>
            <p><strong>File Type:</strong> Image</p>
            ${files.length > 1 ? `<p><strong>File ${startIndex + 1} of ${files.length}</strong></p>` : ''}
          </div>
        </div>
      `,
      showCloseButton: true,
      showConfirmButton: false,
      width: 'auto',
      padding: '2rem'
    });
  } else {
    // Display other file types
    Swal.fire({
      title: file.name,
      html: `
        <div class="text-left">
          <div class="mb-4 text-center">
            <div class="bg-gray-100 p-4 rounded-lg inline-block">
              <svg class="w-16 h-16 mx-auto text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
              <p class="text-gray-600 mt-2">Document File</p>
            </div>
          </div>
          <div class="text-sm text-gray-600 mb-4">
            <p><strong>File Name:</strong> ${file.name}</p>
            <p><strong>File Type:</strong> Document</p>
            ${files.length > 1 ? `<p><strong>File ${startIndex + 1} of ${files.length}</strong></p>` : ''}
          </div>
          <div class="text-center">
            <a 
              href="${file.url}" 
              target="_blank" 
              class="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Download File
            </a>
          </div>
        </div>
      `,
      showCloseButton: true,
      showConfirmButton: false,
      width: 'auto',
      padding: '2rem'
    });
  }
};

// Start editing a payment
const handleEditClick = (payment) => {
  setEditingPayment(payment._id);
  setEditFormData({
    dateOfPayment: formatDateForInput(payment.dateOfPayment), // Use the new function
    supplierName: payment.supplierName,
    amount: payment.amount,
    paymentAuthorizedBy: payment.paymentAuthorizedBy,
    modeOfPayment: payment.modeOfPayment,
    billNo: payment.billNo,
    remarks: payment.remarks || '',
    files: payment.files || []
  });
};

// Cancel editing
const handleCancelEdit = () => {
  setEditingPayment(null);
  setEditFormData({
    dateOfPayment: '',
    supplierName: '',
    amount: '',
    paymentAuthorizedBy: '',
    modeOfPayment: '',
    billNo: '',
    remarks: '',
    files: []
  });
};

// Handle edit form input changes
const handleEditInputChange = (e) => {
  const { name, value } = e.target;
  setEditFormData(prev => ({
    ...prev,
    [name]: value
  }));
};

// Handle file upload for editing with loader
const handleEditFileUpload = async (e) => {
  const files = Array.from(e.target.files);
  if (files.length === 0) return;

  const uploadedFiles = [];
  setEditUploading(true);
  setEditUploadProgress(0);

  try {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        alert(`File ${file.name} is too large. Maximum size is 10MB.`);
        continue;
      }

      const uploadData = new FormData();
      uploadData.append('file', file);
      uploadData.append('upload_preset', 'bank_uploads');

      // Update progress for current file
      setEditUploadProgress(Math.round((i / files.length) * 100));

      try {
        const response = await axios.post(
          `https://api.cloudinary.com/v1_1/dcr8k5amk/upload`,
          uploadData,
          {
            onUploadProgress: (progressEvent) => {
              if (progressEvent.total) {
                const fileProgress = Math.round(
                  (progressEvent.loaded * 100) / progressEvent.total
                );
                // Calculate overall progress including current file
                const overallProgress = Math.round(
                  (i / files.length) * 100 + (fileProgress / files.length)
                );
                setEditUploadProgress(overallProgress);
              }
            }
          }
        );
        
        uploadedFiles.push({
          url: response.data.secure_url,
          public_id: response.data.public_id,
          name: file.name
        });
      } catch (error) {
        console.error('Error uploading file:', error);
        alert(`Error uploading file: ${file.name} - ${error.response?.data?.error?.message || error.message}`);
      }
    }

    // Final progress
    setEditUploadProgress(100);
    
    // Add uploaded files to edit form data
    setEditFormData(prev => ({
      ...prev,
      files: [...prev.files, ...uploadedFiles]
    }));

  } catch (error) {
    console.error('Upload process failed:', error);
    alert('Upload failed. Please try again.');
  } finally {
    // Small delay to show 100% progress
    setTimeout(() => {
      setEditUploading(false);
      setEditUploadProgress(0);
    }, 500);
  }
};

// Remove file from edit form and delete from Cloudinary via backend
const handleRemoveEditFile = async (index) => {
  const fileToRemove = editFormData.files[index];
  
  const result = await Swal.fire({
    title: 'Delete File?',
    text: "This file will be permanently deleted from Cloudinary!",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
    confirmButtonText: 'Yes, delete it!'
  });

  if (!result.isConfirmed) return;

  // Delete from Cloudinary via backend
  if (fileToRemove.public_id) {
    try {
      await axiosInstance.delete('/outgoing-payments/delete-file', {
        data: { public_id: fileToRemove.public_id }
      });
      
      console.log('File deleted from Cloudinary:', fileToRemove.public_id);
      Swal.fire('Deleted!', 'File has been permanently deleted.', 'success');
    } catch (error) {
      console.error('Error deleting file from Cloudinary:', error);
      console.error('Error details:', error.response?.data);
      
      Swal.fire('Warning!', 'File removed from payment but could not delete from Cloudinary.', 'warning');
    }
  } else {
    console.warn('No public_id found for file:', fileToRemove);
    Swal.fire('Info!', 'File removed from payment.', 'info');
  }

  // Remove from local state
  setEditFormData(prev => ({
    ...prev,
    files: prev.files.filter((_, i) => i !== index)
  }));
};

// Update payment
const handleUpdatePayment = async (e) => {
  e.preventDefault();
  if (!editingPayment) return;

  try {
    setEditLoading(true);
    await axiosInstance.put(`/outgoing-payments/${editingPayment}`, editFormData);
    
    toast.success('Payment updated successfully!');
    setEditingPayment(null);
    fetchPayments(currentPage); // Refresh the list
  } catch (error) {
    console.error('Error updating payment:', error);
    toast.error('Error updating payment: ' + (error.response?.data?.message || error.message));
  } finally {
    setEditLoading(false);
  }
};

// Delete payment and all associated files from Cloudinary
const handleDeletePayment = async (paymentId, files) => {
  const result = await Swal.fire({
    title: 'Are you sure?',
    text: "You won't be able to revert this!",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
    confirmButtonText: 'Yes, delete it!'
  });

  if (result.isConfirmed) {
    try {
      // Delete payment from database (backend will handle Cloudinary deletion)
      await axiosInstance.delete(`/outgoing-payments/${paymentId}`);
      
      Swal.fire('Deleted!', 'Payment has been deleted.', 'success');
      fetchPayments(currentPage); // Refresh the list
    } catch (error) {
      console.error('Error deleting payment:', error);
      Swal.fire('Error!', 'Failed to delete payment.', 'error');
    }
  }
};

// Calculate next bill number from existing payments
const calculateNextBillNo = () => {
  if (payments.length === 0) {
    // If no payments exist, start from 1
    setFormData(prev => ({
      ...prev,
      billNo: '1'
    }));
    return;
  }

  // Find the highest bill number from all payments, but ignore very large numbers
  let highestBillNo = 0;
  let validPaymentsCount = 0;
  
  payments.forEach(payment => {
    if (payment.billNo) {
      const billNoNum = parseInt(payment.billNo);
      // Only consider numbers that are reasonable (less than 1000)
      if (!isNaN(billNoNum) && billNoNum < 1000) {
        if (billNoNum > highestBillNo) {
          highestBillNo = billNoNum;
        }
        validPaymentsCount++;
      }
    }
  });
  
  // If we found valid payments with small numbers, continue from there
  if (validPaymentsCount > 0) {
    const nextBillNo = highestBillNo + 1;
    setFormData(prev => ({
      ...prev,
      billNo: nextBillNo.toString()
    }));
  } else {
    // If all existing payments have large numbers, start fresh from 1
    setFormData(prev => ({
      ...prev,
      billNo: '1'
    }));
  }
};

  return (
    <>
    <InternalNavbar />
    <div className="min-h-screen bg-gray-50 p-6">
            {/* Upload Loader Overlay */}
    {uploading && (
      <div className="fixed inset-0 bg-[#00000092] bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Uploading Files</h3>
            <p className="text-gray-600 mb-4">Please wait while we upload your files...</p>
            
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-500">{uploadProgress}% Complete</p>
          </div>
        </div>
      </div>
    )}

     {/* ADD THIS - Upload Loader Overlay for Edit Form */}
      {editUploading && (
        <div className="fixed inset-0 bg-[#00000092] bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mb-4"></div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Uploading Files for Edit</h3>
              <p className="text-gray-600 mb-4">Please wait while we upload your files...</p>
              
              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div 
                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${editUploadProgress}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-500">{editUploadProgress}% Complete</p>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Outgoing Payments</h1>
        
        {/* Payment Form */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-6">Create New Payment</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Date of Payment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
  Date of Payment *
</label>
<input
  type="date"
  name="dateOfPayment"
  value={formData.dateOfPayment}
  onChange={handleInputChange}
  required
  max={new Date().toISOString().split('T')[0]}
  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
/>
            </div>

            {/* Supplier Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Supplier Name *
              </label>
              <select
                name="supplierName"
                value={formData.supplierName}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Supplier</option>
                {Array.isArray(suppliers) && suppliers.map(supplier => (
                  <option key={supplier._id || supplier.id} value={supplier.name || supplier.supplierName}>
                    {supplier.name || supplier.supplierName || 'Unnamed Supplier'}
                  </option>
                ))}
              </select>
              {(!Array.isArray(suppliers) || suppliers.length === 0) && (
                <p className="text-red-500 text-sm mt-1">No suppliers available</p>
              )}
            </div>

        {/* Bill No */}
<div>
  <label className="block text-sm font-medium text-gray-700 mb-2">
    Bill No *
  </label>
  <input
    type="text"
    name="billNo"
    value={formData.billNo}
    onChange={handleInputChange}
    required
    readOnly
    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-100 cursor-not-allowed"
    placeholder="Auto-generated"
  />
  <p className="text-xs text-gray-500 mt-1">Bill number is auto-generated</p>
</div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount (₹) *
              </label>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleInputChange}
                required
                step="0.01"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>

            {/* Payment Authorized By */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Authorized By *
              </label>
              <input
                type="text"
                name="paymentAuthorizedBy"
                value={formData.paymentAuthorizedBy}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter authorizer name"
              />
            </div>

            {/* Mode of Payment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mode of Payment *
              </label>
              <select
                name="modeOfPayment"
                value={formData.modeOfPayment}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Mode</option>
                <option value="upi">UPI</option>
                <option value="bank transfer">Bank Transfer</option>
                <option value="cash">Cash</option>
                <option value="cheque">Cheque</option>
              </select>
            </div>

            {/* File Upload */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Files (Multiple files supported)
              </label>
              <input
                type="file"
                multiple
                onChange={handleFileUpload}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              />
              <p className="text-sm text-gray-500 mt-1">
                Supported formats: PDF, JPG, PNG, DOC (Max 10MB per file)
              </p>
              
              {/* File Previews */}
              {formData.files.length > 0 && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Uploaded Files:
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {formData.files.map((file, index) => (
                      <div key={index} className="relative border rounded-lg p-2 bg-gray-50">
                        <div className="h-20 bg-white rounded flex items-center justify-center overflow-hidden">
                          {file.url.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                            <img
                              src={file.url}
                              alt="Preview"
                              className="h-full w-full object-cover rounded"
                            />
                          ) : (
                            <div className="text-center p-2">
                              <svg className="w-8 h-8 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <p className="text-xs mt-1 truncate">{file.name}</p>
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Remarks */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Remarks
              </label>
              <textarea
                name="remarks"
                value={formData.remarks}
                onChange={handleInputChange}
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Additional notes or comments..."
              />
            </div>

            {/* Submit Button */}
            <div className="md:col-span-2">
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 font-medium transition duration-200"
              >
                Create Payment
              </button>
            </div>
          </form>
        </div>

    {/* Payments List */}
<div className="bg-white rounded-lg shadow-md p-6">
  <h2 className="text-xl font-semibold mb-6">Payment History</h2>
  
  {/* Filters Section - ADD THIS */}
  <div className="mb-6 p-4 bg-gray-50 rounded-lg">
    <div className="flex flex-col md:flex-row gap-4 items-end">
      {/* Supplier Filter */}
      <div className="flex-1">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Filter by Supplier
        </label>
        <select
          value={filterSupplier}
          onChange={(e) => setFilterSupplier(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Suppliers</option>
          {Array.isArray(suppliers) && suppliers.map(supplier => (
            <option key={supplier._id || supplier.id} value={supplier.name || supplier.supplierName}>
              {supplier.name || supplier.supplierName || 'Unnamed Supplier'}
            </option>
          ))}
        </select>
      </div>

      {/* Date From Filter */}
      <div className="flex-1">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Date From
        </label>
        <input
          type="date"
          value={filterDateFrom}
          onChange={(e) => setFilterDateFrom(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Date To Filter */}
      <div className="flex-1">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Date To
        </label>
        <input
          type="date"
          value={filterDateTo}
          onChange={(e) => setFilterDateTo(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Reset Filters Button */}
      <div>
        <button
          onClick={resetFilters}
          className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
        >
          Reset Filters
        </button>
      </div>
    </div>

    {/* Active Filters Info */}
    {(filterSupplier || filterDateFrom || filterDateTo) && (
      <div className="mt-3 text-sm text-gray-600">
        <span className="font-medium">Active filters:</span>
        {filterSupplier && <span className="ml-2 bg-blue-100 text-blue-800 px-2 py-1 rounded">Supplier: {filterSupplier}</span>}
        {filterDateFrom && <span className="ml-2 bg-green-100 text-green-800 px-2 py-1 rounded">From: {formatDate(filterDateFrom)}</span>}
        {filterDateTo && <span className="ml-2 bg-green-100 text-green-800 px-2 py-1 rounded">To: {formatDate(filterDateTo)}</span>}
        <span className="ml-2 bg-gray-100 text-gray-800 px-2 py-1 rounded">
          Showing {filteredPayments.length} of {payments.length} payments
        </span>
      </div>
    )}
  </div>
  
  {loading ? (
    <div className="text-center py-8">
      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <p className="mt-2 text-gray-600">Loading payments...</p>
    </div>
  ) : (
    <>
      {filteredPayments.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          {payments.length === 0 ? (
            "No payments found. Create your first payment above."
          ) : (
            "No payments match your current filters. Try adjusting your search criteria."
          )}
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bill No
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Supplier
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Authorized By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mode
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Files
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPayments.map(payment => (
                  <React.Fragment key={payment._id}>
                    {editingPayment === payment._id ? (
                      // Edit Form Row (keep your existing edit form code)
                      <tr className="bg-yellow-50">
                        <td className="px-6 py-4">
                          <input
                            type="date"
                            name="dateOfPayment"
                            value={editFormData.dateOfPayment}
                            onChange={handleEditInputChange}
                            required
                            disabled
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm bg-gray-100 cursor-not-allowed"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="text"
                            name="billNo"
                            value={editFormData.billNo}
                            onChange={handleEditInputChange}
                            required
                            disabled
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm bg-gray-100 cursor-not-allowed"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <select
                            name="supplierName"
                            value={editFormData.supplierName}
                            onChange={handleEditInputChange}
                            required
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          >
                            <option value="">Select Supplier</option>
                            {Array.isArray(suppliers) && suppliers.map(supplier => (
                              <option key={supplier._id} value={supplier.name}>
                                {supplier.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="number"
                            name="amount"
                            value={editFormData.amount}
                            onChange={handleEditInputChange}
                            required
                            step="0.01"
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="text"
                            name="paymentAuthorizedBy"
                            value={editFormData.paymentAuthorizedBy}
                            onChange={handleEditInputChange}
                            required
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <select
                            name="modeOfPayment"
                            value={editFormData.modeOfPayment}
                            onChange={handleEditInputChange}
                            required
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          >
                            <option value="upi">UPI</option>
                            <option value="bank transfer">Bank Transfer</option>
                            <option value="cash">Cash</option>
                            <option value="cheque">Cheque</option>
                          </select>
                        </td>
                        <td className="px-6 py-4">
                          {/* File Upload for Edit */}
                          <div className="space-y-2">
                            <input
                              type="file"
                              multiple
                              onChange={handleEditFileUpload}
                              className="w-full text-sm"
                              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                            />
                            {/* Existing Files with Remove Option */}
                            {editFormData.files.length > 0 && (
                              <div className="grid grid-cols-2 gap-2 mt-2">
                                {editFormData.files.map((file, index) => (
                                  <div key={index} className="relative border rounded p-1 bg-gray-50 text-xs">
                                    <div className="flex items-center justify-between">
                                      <span className="truncate">{file.name}</span>
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveEditFile(index)}
                                        className="text-red-500 hover:text-red-700 ml-1"
                                      >
                                        ×
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 space-x-2">
                          <button
                            onClick={handleUpdatePayment}
                            disabled={editLoading}
                            className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 disabled:opacity-50"
                          >
                            {editLoading ? 'Saving...' : 'Save'}
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600"
                          >
                            Cancel
                          </button>
                        </td>
                      </tr>
                    ) : (
                      // Normal Display Row (keep your existing display code)
                      <tr className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(payment.dateOfPayment)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {payment.billNo}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {payment.supplierName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                          ₹{payment.amount?.toLocaleString('en-IN')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {payment.paymentAuthorizedBy}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            payment.modeOfPayment === 'upi' ? 'bg-purple-100 text-purple-800' :
                            payment.modeOfPayment === 'bank transfer' ? 'bg-blue-100 text-blue-800' :
                            payment.modeOfPayment === 'cash' ? 'bg-green-100 text-green-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {payment.modeOfPayment}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {payment.files?.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {payment.files.slice(0, 3).map((file, index) => (
                                <button
                                  key={index}
                                  onClick={() => handleFileClick(payment.files, index)}
                                  className="inline-flex items-center px-2 py-1 rounded text-xs bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors cursor-pointer"
                                >
                                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                  File {index + 1}
                                </button>
                              ))}
                              {payment.files.length > 3 && (
                                <button
                                  onClick={() => handleFileClick(payment.files)}
                                  className="text-xs text-gray-500 px-2 py-1 hover:text-gray-700 cursor-pointer"
                                >
                                  +{payment.files.length - 3} more
                                </button>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400 text-xs">No files</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <button
                            onClick={() => handleEditClick(payment)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeletePayment(payment._id, payment.files)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-6">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            
            <span className="text-sm text-gray-700">
              Page {currentPage} of {totalPages}
            </span>
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </>
      )}
    </>
  )}
</div>
      </div>
    </div>
    </>
  );
};

export default OutgoingPayments;