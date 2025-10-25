import { useEffect, useState } from "react";
import axiosInstance from "../axiosInstance";
import InternalNavbar from "../components/InternalNavbar";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import {
  FileText,
  Mail,
  MessageCircle,
  Edit,
  Trash2,
  Download,
  Users,
  Calendar,
  Package,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  X,
  Filter,
  Search,
  Plus,
  Phone,
  User
} from "lucide-react";

export default function ViewRFQs() {
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showWhatsappModal, setShowWhatsappModal] = useState(false);
  const [selectedSuppliers, setSelectedSuppliers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [currentRFQ, setCurrentRFQ] = useState(null);
  const [whatsappContacts, setWhatsappContacts] = useState([]);
  const [rfqs, setRfqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [searchTerm, setSearchTerm] = useState("");
  const limit = 6;
  const navigate = useNavigate();

  // Responsive detection
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchSuppliersByCategory = async (category) => {
    try {
      const res = await axiosInstance.get(`/rfqs/suppliers-by-category/${category}`);
      setSuppliers(res.data || []);
      setSelectedSuppliers(res.data.map((s) => s._id));
    } catch (err) {
      toast.error("Failed to load suppliers");
    }
  };

  const fetchRFQs = async (pageNum) => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/rfqs?page=${pageNum}&limit=${limit}&search=${searchTerm}`);
      setRfqs(res.data.rfqs);
      setTotalPages(res.data.totalPages);
      setPage(res.data.page);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load RFQs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRFQs(page);
  }, [page, searchTerm]);

  const handleDelete = async (id) => {
    const result = await new Promise((resolve) => {
      const confirmed = window.confirm("Are you sure you want to delete this RFQ?");
      resolve(confirmed);
    });
    
    if (!result) return;
    
    try {
      await axiosInstance.delete(`/rfqs/${id}`);
      toast.success("RFQ deleted successfully");
      fetchRFQs(page);
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete RFQ");
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

  const formatPhoneNumber = (phone) => {
    if (!phone) return null;
    
    let cleaned = phone.replace(/\D/g, '');
    
    if (cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1);
    }
    
    if (!cleaned.startsWith('91') && cleaned.length === 10) {
      cleaned = `91${cleaned}`;
    }
    
    return cleaned;
  };

  const handleWhatsAppSend = () => {
    const selectedContacts = suppliers
      .filter((s) => selectedSuppliers.includes(s._id))
      .map((s) => ({
        name: s.name,
        phone: formatPhoneNumber(s.phone)
      }))
      .filter(s => s.phone && s.phone.length >= 10);

    if (selectedContacts.length === 0) {
      toast.error("No valid phone numbers selected");
      return;
    }

    const productList = currentRFQ.products.map((product, index) => 
      `Product ${index + 1}: ${product.itemName} - Qty: ${product.quantity} ${product.unit || ''}`
    ).join('\n');

    const message = `Hello,\n\nPlease find the details for the RFQ below:\n\n${productList}\n\nRequired By: ${formatDateDDMMYYYY(currentRFQ.requiredByDate)}\nCategory: ${currentRFQ.category}\n\nDownload RFQ PDF: ${currentRFQ.fileUrl}\n\nRegards,\n${JSON.parse(localStorage.getItem("user"))?.name || ""}`;
    
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    if (isMobile) {
      setWhatsappContacts(selectedContacts.map(contact => ({
        ...contact,
        url: `https://api.whatsapp.com/send?phone=${contact.phone}&text=${encodeURIComponent(message)}`
      })));
      
      toast.success(`Prepared ${selectedContacts.length} WhatsApp links. Tap each one to send.`, {
        duration: 4000
      });
    } else {
      setWhatsappContacts(selectedContacts.map(contact => ({
        ...contact,
        url: `https://web.whatsapp.com/send?phone=${contact.phone}&text=${encodeURIComponent(message)}`
      })));
    }
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
                📄 Request for Quotations
              </h1>
              <p className="text-gray-600 mt-2">
                Manage and send RFQs to suppliers
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              {/* Create New RFQ */}
              <button
                onClick={() => navigate("/send-rfq")}
                className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-6 py-3 rounded-xl shadow-lg transition-all duration-200 flex items-center justify-center gap-2 font-semibold transform hover:scale-105"
              >
                <Plus size={20} />
                Create RFQ
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
                  placeholder="Search RFQs by item name, category..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPage(1);
                  }}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4">
                <div className="bg-blue-50 rounded-xl px-4 py-2 border border-blue-200">
                  <p className="text-sm text-blue-600 font-medium">Total RFQs</p>
                  <p className="text-2xl font-bold text-blue-700">{rfqs.length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* RFQs Grid */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-3">
                <FileText size={24} />
                RFQ List ({rfqs.length})
              </h2>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            )}

            {/* RFQ Cards */}
            {!loading && (
              <div className="p-6">
                {rfqs.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="bg-gray-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FileText className="text-gray-400 text-2xl" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-600 mb-2">No RFQs Found</h3>
                    <p className="text-gray-500 max-w-md mx-auto mb-6">
                      {searchTerm ? "Try adjusting your search criteria" : "Get started by creating your first RFQ"}
                    </p>
                    {!searchTerm && (
                      <button
                        onClick={() => navigate("/create-rfq")}
                        className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-6 py-3 rounded-xl shadow-lg transition-all duration-200 flex items-center gap-2 font-semibold mx-auto"
                      >
                        <Plus size={20} />
                        Create First RFQ
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {rfqs.map((rfq) => (
                      <div
                        key={rfq._id}
                        className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                      >
                        <div className="p-6">
                          {/* Header */}
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <h3 className="font-bold text-gray-800 text-lg mb-2 line-clamp-2">
                                {rfq.itemName}
                              </h3>
                              <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                                <Package size={16} />
                                <span className="capitalize">{rfq.category}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Calendar size={16} />
                                <span>{new Date(rfq.createdAt).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>

                          {/* Products Summary */}
                          {rfq.products && rfq.products.length > 0 && (
                            <div className="mb-4">
                              <p className="text-sm font-medium text-gray-700 mb-2">
                                Products ({rfq.products.length})
                              </p>
                              <div className="space-y-1 max-h-20 overflow-y-auto">
                                {rfq.products.slice(0, 3).map((product, index) => (
                                  <div key={index} className="text-xs text-gray-600 bg-gray-50 rounded px-2 py-1">
                                    {product.itemName} - {product.quantity} {product.unit}
                                  </div>
                                ))}
                                {rfq.products.length > 3 && (
                                  <div className="text-xs text-gray-500">
                                    +{rfq.products.length - 3} more products
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className="space-y-2">
                            {/* Primary Actions */}
                            <div className="grid grid-cols-2 gap-2">
                              <a
                                href={rfq.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg transition-colors duration-200 text-sm font-medium justify-center"
                              >
                                <Download size={16} />
                                PDF
                              </a>
                              <button
                                onClick={() => navigate(`/edit-rfq/${rfq._id}`, { state: { rfq } })}
                                className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 rounded-lg transition-colors duration-200 text-sm font-medium justify-center"
                              >
                                <Edit size={16} />
                                Edit
                              </button>
                            </div>

                            {/* Secondary Actions */}
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                onClick={() => {
                                  setCurrentRFQ(rfq);
                                  fetchSuppliersByCategory(rfq.category);
                                  setShowEmailModal(true);
                                }}
                                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg transition-colors duration-200 text-sm font-medium justify-center"
                              >
                                <Mail size={16} />
                                Email
                              </button>
                              <button
                                onClick={() => {
                                  setCurrentRFQ(rfq);
                                  fetchSuppliersByCategory(rfq.category);
                                  setShowWhatsappModal(true);
                                }}
                                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg transition-colors duration-200 text-sm font-medium justify-center"
                              >
                                <MessageCircle size={16} />
                                WhatsApp
                              </button>
                            </div>

                            {/* Delete Action */}
                            <button
                              onClick={() => handleDelete(rfq._id)}
                              className="w-full flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg transition-colors duration-200 text-sm font-medium justify-center"
                            >
                              <Trash2 size={16} />
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && !loading && (
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

      {/* Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-3">
                <Mail size={24} />
                Send RFQ via Email
              </h3>
              <p className="text-blue-100 text-sm mt-1">{currentRFQ?.itemName}</p>
            </div>

            <div className="p-6">
              {/* Supplier Selection */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Users size={18} />
                  Select Suppliers ({selectedSuppliers.length} selected)
                </h4>
                <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-xl p-4 bg-gray-50">
                  {suppliers.map((supplier) => (
                    <label key={supplier._id} className="flex items-center gap-3 p-2 hover:bg-white rounded-lg transition-colors duration-150">
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="checkbox"
                          checked={selectedSuppliers.includes(supplier._id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedSuppliers((prev) => [...prev, supplier._id]);
                            } else {
                              setSelectedSuppliers((prev) => prev.filter((id) => id !== supplier._id));
                            }
                          }}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-gray-800">{supplier.name}</p>
                          <p className="text-sm text-gray-600">{supplier.email || "No email"}</p>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    const toEmails = suppliers
                      .filter((s) => selectedSuppliers.includes(s._id))
                      .map((s) => s.email)
                      .join(",");

                    const subject = `RFQ - ${currentRFQ.itemName}`;
                    const body = `
Hello,

Please find the details for the RFQ below:

Item: ${currentRFQ.itemName}
Quantity: ${currentRFQ.quantity}
Required By: ${formatDateDDMMYYYY(currentRFQ.requiredByDate)}
Size: ${currentRFQ.size || "N/A"}
Remarks: ${currentRFQ.remarks || "None"}
Category: ${currentRFQ.category}

Download RFQ PDF: ${currentRFQ.fileUrl}

Regards,
${JSON.parse(localStorage.getItem("user"))?.name || ""}
                    `;

                    const mailtoLink = `mailto:${encodeURIComponent(toEmails)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                    window.location.href = mailtoLink;
                    setShowEmailModal(false);
                  }}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 font-semibold transform hover:scale-105"
                  disabled={selectedSuppliers.length === 0}
                >
                  <Mail size={20} />
                  Open Email Client
                </button>

                <button
                  onClick={() => setShowEmailModal(false)}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 font-medium"
                >
                  <X size={20} />
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp Modal */}
      {showWhatsappModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-3">
                <MessageCircle size={24} />
                Send RFQ via WhatsApp
              </h3>
              <p className="text-green-100 text-sm mt-1">{currentRFQ?.itemName}</p>
            </div>

            <div className="p-6">
              {/* Supplier Selection */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Users size={18} />
                  Select Suppliers ({selectedSuppliers.length} selected)
                </h4>
                <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-xl p-4 bg-gray-50">
                  {suppliers.map((supplier) => (
                    <label key={supplier._id} className="flex items-center gap-3 p-2 hover:bg-white rounded-lg transition-colors duration-150">
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="checkbox"
                          checked={selectedSuppliers.includes(supplier._id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedSuppliers((prev) => [...prev, supplier._id]);
                            } else {
                              setSelectedSuppliers((prev) => prev.filter((id) => id !== supplier._id));
                            }
                          }}
                          className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-gray-800">{supplier.name}</p>
                          <p className="text-sm text-gray-600 flex items-center gap-1">
                            <Phone size={14} />
                            {formatPhoneNumber(supplier.phone) || "No phone"}
                          </p>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* WhatsApp Links */}
              {whatsappContacts.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <CheckCircle size={18} className="text-green-600" />
                    Ready to Send ({whatsappContacts.length})
                  </h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {whatsappContacts.map((contact, index) => (
                      <a
                        key={index}
                        href={contact.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full text-left bg-green-50 hover:bg-green-100 border border-green-200 text-green-800 p-3 rounded-xl transition-all duration-200 flex items-center gap-3"
                        onClick={() => {
                          if (index === whatsappContacts.length - 1) {
                            setTimeout(() => setShowWhatsappModal(false), 300);
                          }
                        }}
                      >
                        <MessageCircle size={18} className="text-green-600" />
                        <div>
                          <p className="font-medium">Send to {contact.name}</p>
                          <p className="text-sm text-green-600">{contact.phone}</p>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={handleWhatsAppSend}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 font-semibold transform hover:scale-105"
                  disabled={selectedSuppliers.length === 0}
                >
                  <MessageCircle size={20} />
                  {whatsappContacts.length > 0 ? 'Regenerate Links' : 'Prepare WhatsApp Links'}
                </button>

                <button
                  onClick={() => {
                    setShowWhatsappModal(false);
                    setWhatsappContacts([]);
                  }}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 font-medium"
                >
                  <X size={20} />
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}