import React, { useEffect, useState } from "react";
import axiosInstance from "../axiosInstance";
import InternalNavbar from "../components/InternalNavbar";
import toast from "react-hot-toast";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import { 
  Eye, 
  Mail, 
  MessageCircle, 
  FileText, 
  Search, 
  Edit, 
  Trash2, 
  RefreshCw,
  Plus,
  ArrowLeft,
  ArrowRight,
  Download,
  Share2,
  CheckCircle,
  Filter
} from "lucide-react";
import { useUserContext } from "../context/UserContext";

// Centralized conversion tracking utility
const ConversionTracker = {
  getConvertedInvoices: () => {
    try {
      const saved = localStorage.getItem('convertedInvoices');
      return saved ? JSON.parse(saved) : {};
    } catch (error) {
      console.error("Error loading converted invoices:", error);
      return {};
    }
  },
  
  markAsConverted: (invoiceId) => {
    try {
      const converted = ConversionTracker.getConvertedInvoices();
      converted[invoiceId] = true;
      localStorage.setItem('convertedInvoices', JSON.stringify(converted));
      return true;
    } catch (error) {
      console.error("Error marking invoice as converted:", error);
      return false;
    }
  },
  
  isConverted: (invoiceId) => {
    const converted = ConversionTracker.getConvertedInvoices();
    return !!converted[invoiceId];
  },
  
  clearAll: () => {
    localStorage.removeItem('convertedInvoices');
  }
};

export default function ProformaInvoiceDashboard() {
  const { user } = useUserContext();
  const [invoices, setInvoices] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [convertedInvoices, setConvertedInvoices] = useState({});
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const limit = 10;
  const navigate = useNavigate();

  // Responsive detection
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Load converted invoices from localStorage on component mount
  useEffect(() => {
    const loadConvertedInvoices = () => {
      const converted = ConversionTracker.getConvertedInvoices();
      setConvertedInvoices(converted);
    };
    
    loadConvertedInvoices();
    
    const intervalId = setInterval(loadConvertedInvoices, 2000);
    return () => clearInterval(intervalId);
  }, []);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/proforma/all", {
        params: { page, limit, search },
      });
      setInvoices(res.data.invoices);
      setTotal(res.data.total);
    } catch (err) {
      console.error("Error fetching invoices", err);
      toast.error("Failed to load invoices");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [page, search]);

  const handleEmailShare = async (invoice) => {
    const { value: toEmail } = await Swal.fire({
      title: "Send Invoice via Email",
      input: 'email',
      inputLabel: 'Customer Email',
      inputValue: invoice.customerEmail || '',
      showCancelButton: true,
      confirmButtonText: 'Open Email App',
      inputPlaceholder: 'Enter customer email',
      customClass: {
        popup: 'rounded-2xl',
        confirmButton: 'bg-blue-600 hover:bg-blue-700'
      },
      background: '#f8fafc'
    });

    if (!toEmail) return;

    const subject = encodeURIComponent(`Proforma Invoice - ${invoice.invoiceNo}`);
    const body = encodeURIComponent(
      `Dear Customer,

Please find your Proforma Invoice and Statement below:

Proforma Invoice: ${invoice.pdfUrl}
${invoice.statementUrl ? `Statement: ${invoice.statementUrl}` : ''}

Let us know in case of any questions.

Best regards,
${user.name}
${user.email ? `(${user.email})` : ''}`
    );

    const mailtoLink = `mailto:${toEmail}?subject=${subject}&body=${body}`;
    window.location.href = mailtoLink;
  };

  const handleWhatsAppShare = (invoice) => {
    const phone = invoice.contact?.replace(/\D/g, '');
    if (!phone) {
      toast.error("No phone number available for this customer");
      return;
    }

    const message = encodeURIComponent(
      `Hello, please find your Proforma Invoice:\n${invoice.pdfUrl}`
    );
    
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
  };

  const totalPages = Math.ceil(total / limit);
  
  const deleteInvoice = async (id) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This action cannot be undone!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
      customClass: {
        popup: 'rounded-2xl'
      },
      background: '#f8fafc'
    });

    if (!result.isConfirmed) return;

    try {
      await axiosInstance.delete(`/proforma/${id}`);
      toast.success("Invoice deleted successfully");
      fetchInvoices();
    } catch (err) {
      console.error("Failed to delete invoice", err);
      toast.error("Error deleting invoice");
    }
  };

  const formatDateDDMMYYYY = (dateInput) => {
    if (!dateInput) return "";
    const d = new Date(dateInput);
    if (isNaN(d)) return "";
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const handleConvertToSalesOrder = (invoice) => {
    localStorage.setItem('convertingInvoiceId', invoice._id);
    navigate("/add-order", { 
      state: { fromProforma: true, invoice: invoice } 
    });
  };

  const resetConversionStatus = (invoiceId) => {
    const converted = ConversionTracker.getConvertedInvoices();
    delete converted[invoiceId];
    localStorage.setItem('convertedInvoices', JSON.stringify(converted));
    setConvertedInvoices({...converted});
    toast.success("Conversion status reset");
  };

  const downloadPdf = (pdfUrl, invoiceNo) => {
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = `Proforma_Invoice_${invoiceNo}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <InternalNavbar />
      
      {/* Main Container */}
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          
          {/* Header Section */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
            <div className="text-center lg:text-left">
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                📄 Proforma Invoices
              </h1>
              <p className="text-gray-600 mt-2">
                Manage and track all proforma invoices
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              {/* Create New Invoice */}
              <button
                onClick={() => navigate("/proforma-invoice")}
                className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-6 py-3 rounded-xl shadow-lg transition-all duration-200 flex items-center justify-center gap-2 font-semibold transform hover:scale-105"
              >
                <Plus size={20} />
                Create Invoice
              </button>
            </div>
          </div>

          {/* Search and Stats */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-200">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              
              {/* Search Input */}
              <div className="relative flex-1 max-w-2xl">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="text-gray-400" size={20} />
                </div>
                <input
                  type="text"
                  placeholder="Search by P/I No, Customer, Bill To, Ship To..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4">
                <div className="bg-blue-50 rounded-xl px-4 py-2 border border-blue-200">
                  <p className="text-sm text-blue-600 font-medium">Total Invoices</p>
                  <p className="text-2xl font-bold text-blue-700">{total}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Invoices Table/Cards */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
            {/* Table Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-3">
                <FileText size={24} />
                Proforma Invoices ({invoices.length})
              </h2>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            )}

            {/* Desktop Table */}
            {!isMobile && !loading && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">S.No</th>
                      <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">P/I ID</th>
                      <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Date</th>
                      <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Customer</th>
                      <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Bill To</th>
                      <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Products</th>
                      <th className="py-4 px-6 text-center text-sm font-semibold text-gray-700">Actions</th>
                      <th className="py-4 px-6 text-center text-sm font-semibold text-gray-700">Convert</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {invoices.map((inv, index) => {
                      const isConverted = ConversionTracker.isConverted(inv._id);
                      
                      return (
                        <tr key={inv._id} className="hover:bg-gray-50 transition-colors duration-150">
                          <td className="py-4 px-6 text-sm text-gray-600">
                            {(page - 1) * limit + index + 1}
                          </td>
                          <td className="py-4 px-6">
                            <p className="font-semibold text-gray-800">{inv.invoiceNo}</p>
                          </td>
                          <td className="py-4 px-6 text-sm text-gray-600">
                            {formatDateDDMMYYYY(inv.date)}
                          </td>
                          <td className="py-4 px-6">
                            <p className="font-medium text-gray-800">{inv.customerName || "—"}</p>
                          </td>
                          <td className="py-4 px-6 text-sm text-gray-600 max-w-xs truncate">
                            {inv.billTo}
                          </td>
                          <td className="py-4 px-6 text-center">
                            <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                              {inv.products?.length || 0}
                            </span>
                          </td>
                          
                          {/* Actions */}
                          <td className="py-4 px-6">
                            <div className="flex flex-col gap-2 min-w-[200px]">
                              {/* View PDF */}
                              <button
                                onClick={() => downloadPdf(inv.pdfUrl, inv.invoiceNo)}
                                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg transition-colors duration-200 text-sm font-medium"
                              >
                                <Download size={16} />
                                Download PDF
                              </button>

                              {/* Share Actions */}
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleEmailShare(inv)}
                                  className="flex-1 flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 rounded-lg transition-colors duration-200 text-sm font-medium"
                                >
                                  <Mail size={16} />
                                  Email
                                </button>
                                <button
                                  onClick={() => handleWhatsAppShare(inv)}
                                  className="flex-1 flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg transition-colors duration-200 text-sm font-medium"
                                >
                                  <MessageCircle size={16} />
                                  WhatsApp
                                </button>
                              </div>

                              {/* Edit & Delete */}
                              <div className="flex gap-2">
                                {!isConverted ? (
                                  <button
                                    onClick={() => navigate(`/proforma-edit/${inv._id}`)}
                                    className="flex-1 flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 rounded-lg transition-colors duration-200 text-sm font-medium"
                                  >
                                    <Edit size={16} />
                                    Edit
                                  </button>
                                ) : (
                                  <div className="flex-1 bg-gray-100 text-gray-500 px-3 py-2 rounded-lg text-sm text-center">
                                    Read Only
                                  </div>
                                )}
                                <button
                                  onClick={() => deleteInvoice(inv._id)}
                                  className="flex-1 flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg transition-colors duration-200 text-sm font-medium"
                                >
                                  <Trash2 size={16} />
                                  Delete
                                </button>
                              </div>
                            </div>
                          </td>

                          {/* Convert to Sales Order */}
                          <td className="py-4 px-6">
                            <button
                              onClick={() => handleConvertToSalesOrder(inv)}
                              disabled={isConverted}
                              className={`w-full py-2 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 font-medium ${
                                isConverted 
                                  ? "bg-gray-100 text-gray-500 cursor-not-allowed" 
                                  : "bg-indigo-600 hover:bg-indigo-700 text-white transform hover:scale-105 shadow-lg"
                              }`}
                            >
                              {isConverted ? (
                                <>
                                  <CheckCircle size={16} />
                                  Converted
                                </>
                              ) : (
                                <>
                                  <RefreshCw size={16} />
                                  Convert to Sales
                                </>
                              )}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Mobile Cards */}
            {isMobile && !loading && (
              <div className="p-4 space-y-4">
                {invoices.map((inv, index) => {
                  const isConverted = ConversionTracker.isConverted(inv._id);
                  
                  return (
                    <div key={inv._id} className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
                      {/* Header */}
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="font-bold text-gray-800">{inv.invoiceNo}</h3>
                          <p className="text-sm text-gray-600">{formatDateDDMMYYYY(inv.date)}</p>
                        </div>
                        <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-medium">
                          {inv.products?.length || 0} products
                        </span>
                      </div>

                      {/* Customer Info */}
                      <div className="mb-3">
                        <p className="font-medium text-gray-800">{inv.customerName || "—"}</p>
                        <p className="text-sm text-gray-600 truncate">{inv.billTo}</p>
                      </div>

                      {/* Actions */}
                      <div className="space-y-2">
                        {/* PDF Actions */}
                        <div className="flex gap-2">
                          <button
                            onClick={() => downloadPdf(inv.pdfUrl, inv.invoiceNo)}
                            className="flex-1 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg transition-colors duration-200 text-sm font-medium"
                          >
                            <Download size={16} />
                            PDF
                          </button>
                        </div>

                        {/* Share Actions */}
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEmailShare(inv)}
                            className="flex-1 flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 rounded-lg transition-colors duration-200 text-sm font-medium"
                          >
                            <Mail size={16} />
                            Email
                          </button>
                          <button
                            onClick={() => handleWhatsAppShare(inv)}
                            className="flex-1 flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg transition-colors duration-200 text-sm font-medium"
                          >
                            <MessageCircle size={16} />
                            WhatsApp
                          </button>
                        </div>

                        {/* Edit & Delete */}
                        <div className="flex gap-2">
                          {!isConverted ? (
                            <button
                              onClick={() => navigate(`/proforma-edit/${inv._id}`)}
                              className="flex-1 flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 rounded-lg transition-colors duration-200 text-sm font-medium"
                            >
                              <Edit size={16} />
                              Edit
                            </button>
                          ) : (
                            <div className="flex-1 bg-gray-100 text-gray-500 px-3 py-2 rounded-lg text-sm text-center">
                              Read Only
                            </div>
                          )}
                          <button
                            onClick={() => deleteInvoice(inv._id)}
                            className="flex-1 flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg transition-colors duration-200 text-sm font-medium"
                          >
                            <Trash2 size={16} />
                            Delete
                          </button>
                        </div>

                        {/* Convert Button */}
                        <button
                          onClick={() => handleConvertToSalesOrder(inv)}
                          disabled={isConverted}
                          className={`w-full py-2 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 font-medium ${
                            isConverted 
                              ? "bg-gray-100 text-gray-500 cursor-not-allowed" 
                              : "bg-indigo-600 hover:bg-indigo-700 text-white"
                          }`}
                        >
                          {isConverted ? (
                            <>
                              <CheckCircle size={16} />
                              Already Converted
                            </>
                          ) : (
                            <>
                              <RefreshCw size={16} />
                              Convert to Sales
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Empty State */}
            {!loading && invoices.length === 0 && (
              <div className="text-center py-12">
                <div className="bg-gray-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="text-gray-400 text-2xl" />
                </div>
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No Invoices Found</h3>
                <p className="text-gray-500 max-w-md mx-auto mb-6">
                  {search ? "Try adjusting your search criteria" : "Get started by creating your first proforma invoice"}
                </p>
                {!search && (
                  <button
                    onClick={() => navigate("/create-proforma")}
                    className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-6 py-3 rounded-xl shadow-lg transition-all duration-200 flex items-center gap-2 font-semibold mx-auto"
                  >
                    <Plus size={20} />
                    Create First Invoice
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-8">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-xl text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-all duration-200"
              >
                <ArrowLeft size={16} />
                Previous
              </button>

              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">
                  Page <span className="font-semibold">{page}</span> of {totalPages}
                </span>
              </div>

              <button
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-xl text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-all duration-200"
              >
                Next
                <ArrowRight size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}