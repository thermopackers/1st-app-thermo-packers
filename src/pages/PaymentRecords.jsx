import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../axiosInstance";
import Swal from "sweetalert2";
import { motion } from "framer-motion";
import IncomingPaymentForm from "./IncomingPaymentForm";
import InternalNavbar from "../components/InternalNavbar";

export default function PaymentRecords() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState([]);
  const [filters, setFilters] = useState({
    customerName: "",
    modeOfPayment: "",
    startDate: "",
    endDate: ""
  });
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [editingPaymentId, setEditingPaymentId] = useState(null);
  
  // Pagination state
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasNext: false,
    hasPrev: false
  });
  const [pageSize, setPageSize] = useState(10); // Records per page

  const navigate = useNavigate();

  // Fetch payments with pagination
  const fetchPayments = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      // Add pagination parameters
      params.append('page', page.toString());
      params.append('limit', pageSize.toString());
      
      // Add filter parameters
      if (filters.customerName) params.append('customerName', filters.customerName);
      if (filters.modeOfPayment) params.append('modeOfPayment', filters.modeOfPayment);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const response = await axiosInstance.get(`/incoming-payments?${params}`);
      setPayments(response.data.data || []);
      
      // Update pagination info
      if (response.data.pagination) {
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error("Error fetching payments:", error);
      Swal.fire({
        title: "Error!",
        text: "Failed to load payment records",
        icon: "error",
        confirmButtonColor: "#2563eb",
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch customers for dropdown
  const fetchCustomers = async () => {
    try {
      const response = await axiosInstance.get("/incoming-payments/customers/list");
      setCustomers(response.data.data || []);
    } catch (error) {
      console.error("Error fetching customers:", error);
    }
  };

  useEffect(() => {
    fetchPayments(1);
    fetchCustomers();
  }, []);

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle page size change
  const handlePageSizeChange = (e) => {
    const newSize = parseInt(e.target.value);
    setPageSize(newSize);
    // Reset to page 1 when changing page size
    setTimeout(() => fetchPayments(1), 100);
  };

  // Apply filters
  const applyFilters = () => {
    fetchPayments(1); // Reset to first page when applying filters
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      customerName: "",
      modeOfPayment: "",
      startDate: "",
      endDate: ""
    });
    fetchPayments(1); // Reset to first page when resetting filters
  };

  // Pagination handlers
  const goToPage = (page) => {
    if (page >= 1 && page <= pagination.totalPages) {
      fetchPayments(page);
    }
  };

  const goToNextPage = () => {
    if (pagination.hasNext) {
      fetchPayments(pagination.currentPage + 1);
    }
  };

  const goToPrevPage = () => {
    if (pagination.hasPrev) {
      fetchPayments(pagination.currentPage - 1);
    }
  };

  // Start editing a payment
  const startEdit = (payment) => {
    setEditingPaymentId(payment._id);
    setShowPaymentForm(true);
  };

  // Delete payment
  const deletePayment = async (paymentId) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#2563eb",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel"
    });

    if (result.isConfirmed) {
      try {
        await axiosInstance.delete(`/incoming-payments/${paymentId}`);
        
        Swal.fire({
          title: "Deleted!",
          text: "Payment record has been deleted.",
          icon: "success",
          confirmButtonColor: "#2563eb",
        });

        // Refresh the current page after deletion
        fetchPayments(pagination.currentPage);
      } catch (error) {
        console.error("Error deleting payment:", error);
        Swal.fire({
          title: "Error!",
          text: error.response?.data?.message || "Failed to delete payment",
          icon: "error",
          confirmButtonColor: "#2563eb",
        });
      }
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  // Format date to dd/mm/yyyy
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    
    // Get day, month, and year
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Months are 0-based
    const year = date.getFullYear();
    
    return `${day}/${month}/${year}`;
  };

  // Get mode badge color
  const getModeColor = (mode) => {
    switch (mode) {
      case 'cash': return 'bg-green-100 text-green-800';
      case 'upi': return 'bg-blue-100 text-blue-800';
      case 'cheque': return 'bg-purple-100 text-purple-800';
      case 'bankTransfer': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
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

  // Show file in SweetAlert2
  const showFileInSwal = (fileUrl) => {
    const fileName = fileUrl.split('/').pop();
    const fileExtension = fileUrl.split('.').pop().toLowerCase();
    
    // Check if it's an image
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];
    
    if (imageExtensions.includes(fileExtension)) {
      Swal.fire({
        title: fileName,
        imageUrl: fileUrl,
        imageAlt: fileName,
        showCloseButton: true,
        showConfirmButton: false,
        width: '80%',
        background: '#f8fafc',
        customClass: {
          popup: 'rounded-2xl',
          image: 'rounded-lg max-h-[70vh] object-contain'
        }
      });
    } else {
      // For non-image files, show a download link
      Swal.fire({
        title: fileName,
        html: `
          <div class="text-center">
            <div class="text-4xl mb-4">${getFileIcon(fileUrl)}</div>
            <p class="text-gray-600 mb-4">This file cannot be previewed directly.</p>
            <a 
              href="${fileUrl}" 
              target="_blank" 
              rel="noopener noreferrer"
              class="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <span>Download File</span>
              <span>⬇️</span>
            </a>
          </div>
        `,
        showCloseButton: true,
        showConfirmButton: false,
        background: '#f8fafc',
        customClass: {
          popup: 'rounded-2xl'
        }
      });
    }
  };

  // Render file previews
  const renderFilePreviews = (files) => {
    if (!files || files.length === 0) {
      return <span className="text-gray-400 text-sm">No files</span>;
    }

    return (
      <div className="flex flex-wrap gap-2">
        {files.slice(0, 3).map((file, index) => (
          <button
            key={index}
            onClick={() => showFileInSwal(file)}
            className="flex items-center gap-1 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg px-2 py-1 text-xs transition-colors group"
            title="Click to view file"
          >
            <span className="text-xs">{getFileIcon(file)}</span>
            <span className="max-w-[80px] truncate">
              {file.split('/').pop()}
            </span>
          </button>
        ))}
        {files.length > 3 && (
          <button
            onClick={() => {
              // Show all files in a SweetAlert
              Swal.fire({
                title: `All Files (${files.length})`,
                html: `
                  <div class="space-y-2 max-h-96 overflow-y-auto">
                    ${files.map((file, index) => `
                      <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div class="flex items-center gap-3">
                          <span class="text-lg">${getFileIcon(file)}</span>
                          <span class="text-sm font-medium">${file.split('/').pop()}</span>
                        </div>
                        <button 
                          onclick="window.open('${file}', '_blank')"
                          class="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          View
                        </button>
                      </div>
                    `).join('')}
                  </div>
                `,
                showCloseButton: true,
                showConfirmButton: false,
                width: '500px',
                background: '#f8fafc',
                customClass: {
                  popup: 'rounded-2xl'
                }
              });
            }}
            className="bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg px-2 py-1 text-xs text-gray-600 transition-colors"
          >
            +{files.length - 3} more
          </button>
        )}
      </div>
    );
  };

  // Render cheque details
  const renderChequeDetails = (payment) => {
    if (payment.modeOfPayment !== 'cheque') return null;

    return (
      <div className="mt-2 space-y-1 text-xs text-gray-600">
        {payment.chequeDate && (
          <div className="flex items-center gap-1">
            <span className="font-medium">Cheque Date:</span>
            <span>{formatDate(payment.chequeDate)}</span>
          </div>
        )}
        {payment.chequeNumber && (
          <div className="flex items-center gap-1">
            <span className="font-medium">Cheque No:</span>
            <span>{payment.chequeNumber}</span>
          </div>
        )}
        {payment.bankName && (
          <div className="flex items-center gap-1">
            <span className="font-medium">Bank:</span>
            <span>{payment.bankName}</span>
          </div>
        )}
      </div>
    );
  };

  // Render cash details
  const renderCashDetails = (payment) => {
    if (payment.modeOfPayment !== 'cash') return null;

    return (
      <div className="mt-2 space-y-1 text-xs text-gray-600">
        {payment.cashGivenTo && (
          <div className="flex items-center gap-1">
            <span className="font-medium">Given To:</span>
            <span>{payment.cashGivenTo}</span>
          </div>
        )}
      </div>
    );
  };

  // Render pagination controls
  const renderPagination = () => {
    if (pagination.totalPages <= 1) return null;

    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, pagination.currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(pagination.totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => goToPage(i)}
          className={`px-3 py-1 rounded-lg font-medium transition-colors ${
            pagination.currentPage === i
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          {i}
        </button>
      );
    }

    return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
        <div className="text-sm text-gray-600">
          Showing {((pagination.currentPage - 1) * pageSize) + 1} to {Math.min(pagination.currentPage * pageSize, pagination.totalCount)} of {pagination.totalCount} entries
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={goToPrevPage}
            disabled={!pagination.hasPrev}
            className="px-3 py-1 bg-white border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          
          <div className="flex gap-1">
            {pages}
          </div>
          
          <button
            onClick={goToNextPage}
            disabled={!pagination.hasNext}
            className="px-3 py-1 bg-white border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Show:</span>
          <select
            value={pageSize}
            onChange={handlePageSizeChange}
            className="border border-gray-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
          <span className="text-sm text-gray-600">per page</span>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-blue-700 font-semibold">Loading payment records...</p>
        </div>
      </div>
    );
  }

  return (
    <>
    <InternalNavbar />
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Payment Records</h1>
              <p className="text-gray-600 mt-2">View and manage all incoming payments</p>
            </div>
        <button
  onClick={() => setShowPaymentForm(true)}
  className="mt-4 md:mt-0 bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:bg-blue-700 transition-all duration-300 flex items-center gap-2"
>
  <span>➕</span>
  Add Incoming Payment
</button>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div 
          className="bg-white rounded-2xl shadow-lg p-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
         <div className="relative">
  <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
  <div className="relative">
    <input
      type="text"
      placeholder="Search or select customer..."
      value={filters.customerName}
      onChange={(e) => {
        const value = e.target.value;
        setFilters(prev => ({
          ...prev,
          customerName: value
        }));
        setIsCustomerDropdownOpen(true);
      }}
      onFocus={() => {
        setIsCustomerDropdownOpen(true);
      }}
      onBlur={() => {
        setTimeout(() => {
          setIsCustomerDropdownOpen(false);
        }, 200);
      }}
      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 pr-8"
    />
    {filters.customerName && (
      <button
        onClick={(e) => {
          e.stopPropagation();
          setFilters(prev => ({
            ...prev,
            customerName: ""
          }));
          setIsCustomerDropdownOpen(true);
          setTimeout(() => {
            const input = e.currentTarget.parentElement?.querySelector('input');
            if (input) input.focus();
          }, 0);
        }}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg"
      >
        ×
      </button>
    )}
  </div>
  {isCustomerDropdownOpen && customers.length > 0 && (
    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
      {(() => {
        // Filter customers based on search text
        const filteredCustomers = filters.customerName 
          ? customers.filter(customer => 
              customer.toLowerCase().includes(filters.customerName.toLowerCase())
            )
          : customers; // Show ALL customers when no search text
        
        if (filteredCustomers.length === 0) {
          return (
            <div className="px-3 py-2 text-sm text-gray-500">
              No customers found
            </div>
          );
        }
        
        return filteredCustomers.map(customer => (
          <div
            key={customer}
            onMouseDown={(e) => {
              e.preventDefault();
            }}
            onClick={() => {
              setFilters(prev => ({
                ...prev,
                customerName: customer
              }));
              setIsCustomerDropdownOpen(false);
            }}
            className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm text-gray-700 border-b border-gray-100 last:border-0"
          >
            {customer}
          </div>
        ));
      })()}
    </div>
  )}
</div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Mode</label>
              <select
                name="modeOfPayment"
                value={filters.modeOfPayment}
                onChange={handleFilterChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Modes</option>
                <option value="cash">Cash</option>
                <option value="upi">UPI</option>
                <option value="cheque">Cheque</option>
                <option value="bankTransfer">Bank Transfer</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
              <input
                type="date"
                name="startDate"
                value={filters.startDate}
                onChange={handleFilterChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
              <input
                type="date"
                name="endDate"
                value={filters.endDate}
                onChange={handleFilterChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex gap-3 mt-4">
            <button
              onClick={applyFilters}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Apply Filters
            </button>
            <button
              onClick={resetFilters}
              className="bg-gray-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-gray-600 transition-colors"
            >
              Reset
            </button>
          </div>
        </motion.div>

        {/* Payment Records Table */}
        <motion.div 
          className="bg-white rounded-2xl shadow-lg overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details Uploaded By</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mode & Details</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Files</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remarks</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                      No payment records found
                    </td>
                  </tr>
                ) : (
                  payments.map((payment) => (
                    <tr key={payment._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(payment.dateOfPayment)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
          <div className="flex flex-col">
            <span className="font-medium text-gray-900">
              {payment.createdBy?.name || 'N/A'}
            </span>
            {payment.createdBy?.email && (
              <span className="text-xs text-gray-500 mt-1">
                {payment.createdBy.email}
              </span>
            )}
          </div>
        </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {payment.customerName}
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getModeColor(payment.modeOfPayment)}`}>
                            {payment.modeOfPayment}
                          </span>
                          {/* Show cheque details */}
                          {renderChequeDetails(payment)}
                          {/* Show cash details */}
                          {renderCashDetails(payment)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        {formatCurrency(payment.amount)}
                      </td>
                      <td className="px-6 py-4">
                        {renderFilePreviews(payment.files)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                        {payment.remarks || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => startEdit(payment)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deletePayment(payment._id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {renderPagination()}
        </motion.div>

        {/* Statistics - Update to show current page stats */}
        <motion.div 
          className="bg-white rounded-2xl shadow-lg p-6 mt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Statistics</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-100 text-blue-800 p-4 rounded-lg border border-blue-200">
              <div className="text-2xl font-bold">{pagination.totalCount}</div>
              <div className="text-sm">Total Payments</div>
            </div>
            
            <div className="bg-green-100 text-green-800 p-4 rounded-lg border border-green-200">
              <div className="text-2xl font-bold">
                {payments.filter(p => p.modeOfPayment === 'cash').length}
              </div>
              <div className="text-sm">Cash Payments</div>
            </div>

            <div className="bg-purple-100 text-purple-800 p-4 rounded-lg border border-purple-200">
              <div className="text-2xl font-bold">
                {payments.filter(p => p.modeOfPayment === 'cheque').length}
              </div>
              <div className="text-sm">Cheque Payments</div>
            </div>

            <div className="bg-indigo-100 text-indigo-800 p-4 rounded-lg border border-indigo-200">
              <div className="text-2xl font-bold">
                {formatCurrency(payments.reduce((sum, p) => sum + p.amount, 0))}
              </div>
              <div className="text-sm">Current Page Total</div>
            </div>
          </div>
        </motion.div>

        {/* Payment Form Modal */}
        {showPaymentForm && (
          <IncomingPaymentForm 
            onClose={() => {
              setShowPaymentForm(false);
              setEditingPaymentId(null);
              fetchPayments(pagination.currentPage); // Refresh the current page after editing
            }} 
            editPaymentId={editingPaymentId}
          />
        )}
      </div>
    </div>
    </>
  );
}