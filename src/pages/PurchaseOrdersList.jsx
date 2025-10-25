import React, { useEffect, useState } from "react";
import axiosInstance from "../axiosInstance";
import InternalNavbar from "../components/InternalNavbar";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import { useUserContext } from "../context/UserContext";
import { motion, AnimatePresence } from "framer-motion";

export default function PurchaseOrdersList() {
  const { user } = useUserContext();
  const [orders, setOrders] = useState([]);
  const [page, setPage] = useState(1);
  const [suppliers, setSuppliers] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  
  const navigate = useNavigate();

  // Fetch orders with pagination and search
  const fetchOrders = async (page = 1, search = "") => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("/purchase-orders", {
        params: { page, limit: 10, search },
      });
      setOrders(res.data.data || []);
      setTotalPages(res.data.totalPages || 1);
    } catch (err) {
      console.error("❌ Failed to fetch orders:", err);
      toast.error("Failed to load purchase orders");
    } finally {
      setLoading(false);
    }
  };

  // Fetch orders whenever page/search changes
  useEffect(() => {
    fetchOrders(page, search);
  }, [page, search]);

  // Fetch suppliers ONCE on initial mount
  useEffect(() => {
    axiosInstance.get("/suppliers").then((res) => {
      setSuppliers(res.data.data || []);
    });
  }, []);

  // Delete PO and its corresponding PDF from Cloudinary
  const handleDelete = async (orderId) => {
    const confirmed = await Swal.fire({
      title: "Are you sure?",
      text: "This will permanently delete the PO and its PDF!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });

    if (confirmed.isConfirmed) {
      try {
        const res = await axiosInstance.delete(`/purchase-orders/${orderId}`);
        if (res.status === 200) {
          setOrders(orders.filter((order) => order._id !== orderId));

          await Swal.fire({
            icon: "success",
            title: "Deleted!",
            text: "✅ PO and its PDF have been deleted.",
            timer: 1500,
            showConfirmButton: false,
          });
        }
      } catch (err) {
        console.error("❌ Error deleting PO:", err);
        Swal.fire({
          icon: "error",
          title: "Oops!",
          text: "❌ Failed to delete PO.",
        });
      }
    }
  };

  const getSupplierContact = (supplierData) => {
    if (supplierData && typeof supplierData === 'object') {
      return {
        email: supplierData.email || "",
        phone: supplierData.phone || "",
      };
    }
    
    const supplier = suppliers.find((s) => s._id === supplierData);
    return {
      email: supplier?.email || "",
      phone: supplier?.phone || "",
    };
  };

  const handleSendEmail = (order) => {
    const to = getSupplierContact(order.supplier?._id)?.email;
    const from = user?.email;
    const poNumber = order?.poNumber || "PO-0001";
    const pdfUrl = order?.pdfUrl || "https://example.com/sample-po.pdf";

    if (!to) {
      return Swal.fire("❌ No email", "Supplier email not found", "error");
    }

    const subject = `Purchase Order ${poNumber}`;
    const body = encodeURIComponent(`
Dear Vendor,

Please find the Purchase Order ${poNumber} at the following link:

${pdfUrl}

Sent by: ${from}
    `);

    const mailtoLink = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${body}`;
    window.location.href = mailtoLink;
  };

  const handleSendWhatsApp = (order) => {
    const phone = order.supplier?.phone;
    if (!phone) return Swal.fire("❌ No phone", "Supplier phone not found", "error");

    const message = `Hello,\nPlease find the Purchase Order (${order.poNumber}) here:\n${order.pdfUrl}`;
    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  };

  const canApprove = ["prateek@thermopackers.com", "496saurabh@mail.com", "it.thermopackers@gmail.com"].includes(user?.email);

  const handleApprove = async (orderId) => {
    try {
      setLoadingOrders(prev => [...prev, orderId]);
      
      const confirmed = await Swal.fire({
        title: "Approve Purchase Order?",
        text: "This will mark the PO as approved and generate a new PDF.",
        icon: "question",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Yes, approve it!",
      });

      if (confirmed.isConfirmed) {
        const response = await axiosInstance.post(`/purchase-orders/generate-pdf/${orderId}`, {
          status: "approved",
          approvedBy: user._id
        });
        
        fetchOrders(page, search);
        Swal.fire("Approved!", "The PO has been approved and a new PDF was generated.", "success");
      }
    } catch (err) {
      console.error("Error approving PO:", err);
      Swal.fire("Error", "Failed to approve PO.", "error");
    } finally {
      setLoadingOrders(prev => prev.filter(id => id !== orderId));
    }
  };

  const handleReject = async (orderId) => {
    try {
      setLoadingOrders(prev => [...prev, orderId]);
      
      const confirmed = await Swal.fire({
        title: "Reject Purchase Order?",
        text: "This will mark the PO as rejected and generate a new PDF.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "Yes, reject it!",
      });

      if (confirmed.isConfirmed) {
        const response = await axiosInstance.post(`/purchase-orders/generate-pdf/${orderId}`, {
          status: "rejected",
          approvedBy: user._id
        });
        
        fetchOrders(page, search);
        Swal.fire("Rejected!", "The PO has been rejected and a new PDF was generated.", "success");
      }
    } catch (err) {
      console.error("Error rejecting PO:", err);
      Swal.fire("Error", "Failed to reject PO.", "error");
    } finally {
      setLoadingOrders(prev => prev.filter(id => id !== orderId));
    }
  };

  const formatDate = (date) => {
    if (!date) return "-";
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const handleCancel = async (orderId) => {
    try {
      const { value: reason } = await Swal.fire({
        title: "Cancel Purchase Order?",
        text: "Please provide reason for cancellation:",
        icon: "question",
        input: "text",
        inputPlaceholder: "e.g., Delay in Supply",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "Yes, cancel PO",
        inputValidator: (value) => {
          if (!value) {
            return "Please provide a cancellation reason!";
          }
        }
      });

      if (reason) {
        setLoadingOrders(prev => [...prev, orderId]);
        
        const response = await axiosInstance.post(`/purchase-orders/generate-pdf/${orderId}`, {
          status: "cancelled",
          cancellationReason: reason,
          cancelledBy: user._id
        });
        
        fetchOrders(page, search);
        Swal.fire("Cancelled!", "The PO has been cancelled and a new PDF was generated.", "success");
      }
    } catch (err) {
      console.error("Error cancelling PO:", err);
      Swal.fire("Error", "Failed to cancel PO.", "error");
    } finally {
      setLoadingOrders(prev => prev.filter(id => id !== orderId));
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      approved: { color: "bg-green-100 text-green-800", icon: "✅" },
      rejected: { color: "bg-red-100 text-red-800", icon: "❌" },
      cancelled: { color: "bg-orange-100 text-orange-800", icon: "🚫" },
      pending: { color: "bg-yellow-100 text-yellow-800", icon: "⏳" }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 w-fit ${config.color}`}>
        <span>{config.icon}</span>
        {status || "pending"}
      </span>
    );
  };

  // Loading Overlay Component
  const LoaderOverlay = ({ loadingOrders }) => {
    if (loadingOrders.length === 0) return null;
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-6 flex items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-700">Processing...</span>
        </div>
      </div>
    );
  };

  // Order Details Modal Component
  const OrderDetailsModal = ({ order, onClose }) => {
    if (!order) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-white rounded-xl shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        >
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800">Purchase Order Details</h3>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-3">
                <div>
                  <label className="font-semibold text-gray-600">PO Number</label>
                  <p className="text-gray-900">{order.poNumber}</p>
                </div>
                <div>
                  <label className="font-semibold text-gray-600">Supplier</label>
                  <p className="text-gray-900">{order.supplier?.name || "—"}</p>
                </div>
                <div>
                  <label className="font-semibold text-gray-600">Created Date</label>
                  <p className="text-gray-900">{formatDate(order.createdAt)}</p>
                </div>
                <div>
                  <label className="font-semibold text-gray-600">Generated By</label>
                  <p className="text-gray-900">{order.createdBy?.name || "-"}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="font-semibold text-gray-600">Status</label>
                  <div className="mt-1">{getStatusBadge(order.status)}</div>
                </div>
                {order.approvedBy && (
                  <div>
                    <label className="font-semibold text-gray-600">Approved By</label>
                    <p className="text-gray-900">{order.approvedBy?.name || "-"}</p>
                  </div>
                )}
                {order.cancelledBy && (
                  <div>
                    <label className="font-semibold text-gray-600">Cancelled By</label>
                    <p className="text-gray-900">{order.cancelledBy?.name || "-"}</p>
                  </div>
                )}
                {order.cancellationReason && (
                  <div className="md:col-span-2">
                    <label className="font-semibold text-gray-600">Cancellation Reason</label>
                    <p className="text-gray-900">{order.cancellationReason}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              <a
                href={order.pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                📄 View PDF
              </a>
              <button
                onClick={() => handleSendEmail(order)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                📧 Email
              </button>
              <button
                onClick={() => handleSendWhatsApp(order)}
                className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2"
              >
                📱 WhatsApp
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  };

  return (
    <>
      <InternalNavbar />
      <LoaderOverlay loadingOrders={loadingOrders} />
      
      <AnimatePresence>
        {selectedOrder && (
          <OrderDetailsModal 
            order={selectedOrder} 
            onClose={() => setSelectedOrder(null)} 
          />
        )}
      </AnimatePresence>

      {/* Main Container */}
      <div className="min-h-screen bg-gray-50 py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          
          {/* Header Section */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3">
                  <span className="bg-blue-100 text-blue-800 p-3 rounded-xl">📄</span>
                  Purchase Orders Management
                </h1>
                <p className="text-gray-600 mt-2">
                  View, manage, and track all purchase orders in one place
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => navigate("/create-purchase-order")}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <span>➕</span>
                  Create New PO
                </button>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <div className="flex-1 w-full">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500">🔍</span>
                  </div>
                  <input
                    type="text"
                    placeholder="Search by PO number, supplier, or status..."
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1);
                    }}
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                  Total: {orders.length}
                </span>
              </div>
            </div>
          </div>

          {/* Orders Table */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📋</div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">No Purchase Orders Found</h3>
                <p className="text-gray-600 mb-6">Get started by creating your first purchase order.</p>
                <button
                  onClick={() => navigate("/purchase-orders/create")}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Create Purchase Order
                </button>
              </div>
            ) : (
              <>
                {/* Mobile Cards View */}
                <div className="lg:hidden space-y-4 p-4">
                  {orders.map((order) => (
                    <motion.div
                      key={order._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => setSelectedOrder(order)}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-bold text-gray-900">{order.poNumber}</h4>
                          <p className="text-gray-600 text-sm">{order.supplier?.name || "—"}</p>
                        </div>
                        {getStatusBadge(order.status)}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mb-3">
                        <div>
                          <span className="font-medium">Date:</span> {formatDate(order.createdAt)}
                        </div>
                        <div>
                          <span className="font-medium">By:</span> {order.createdBy?.name || "-"}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <a
                          href={order.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="bg-blue-100 text-blue-700 px-3 py-1 rounded text-sm hover:bg-blue-200 transition-colors"
                        >
                          View PDF
                        </a>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSendEmail(order);
                          }}
                          className="bg-green-100 text-green-700 px-3 py-1 rounded text-sm hover:bg-green-200 transition-colors"
                        >
                          Email
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Desktop Table View */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          PO Details
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Supplier
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date & Created By
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {orders.map((order) => (
                        <motion.tr
                          key={order._id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="font-medium text-gray-900">{order.poNumber}</div>
                              <a
                                href={order.pdfUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                              >
                                📄 View PDF
                              </a>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">{order.supplier?.name || "—"}</div>
                            <div className="text-sm text-gray-500">{order.supplier?.email || ""}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">{formatDate(order.createdAt)}</div>
                            <div className="text-sm text-gray-500">By: {order.createdBy?.name || "-"}</div>
                          </td>
                          <td className="px-6 py-4">
                            {getStatusBadge(order.status)}
                            {order.approvedBy && (
                              <div className="text-xs text-gray-500 mt-1">
                                Approved by: {order.approvedBy?.name}
                              </div>
                            )}
                            {order.cancelledBy && (
                              <div className="text-xs text-gray-500 mt-1">
                                Cancelled by: {order.cancelledBy?.name}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-2">
                              {/* Primary Actions */}
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleSendEmail(order)}
                                  className="bg-green-100 text-green-700 px-3 py-1 rounded text-sm hover:bg-green-200 transition-colors flex items-center gap-1"
                                >
                                  Email
                                </button>
                                <button
                                  onClick={() => handleSendWhatsApp(order)}
                                  className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded text-sm hover:bg-emerald-200 transition-colors flex items-center gap-1"
                                >
                                  Whatsapp
                                </button>
                                <button
                                  onClick={() => setSelectedOrder(order)}
                                  className="bg-gray-100 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-200 transition-colors flex items-center gap-1"
                                >
                                  View Details
                                </button>
                              </div>

                              {/* Management Actions */}
                              <div className="flex gap-2 flex-wrap">
                                {/* Show Delete & Edit ONLY if not approved and not cancelled */}
                                {order.status !== "approved" && order.status !== "cancelled" && (
                                  <>
                                    <button
                                      onClick={() => handleDelete(order._id)}
                                      className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs hover:bg-red-200 transition-colors"
                                    >
                                      🗑 Delete
                                    </button>
                                    <button
                                      onClick={() => navigate(`/purchase-orders/edit/${order._id}`)}
                                      className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs hover:bg-blue-200 transition-colors"
                                    >
                                      ✏️ Edit
                                    </button>
                                  </>
                                )}

                                {/* Approve/Reject only for approvers - hide if cancelled */}
                                {canApprove && order.status !== "cancelled" && (
                                  <>
                                    <button
                                      onClick={() => handleApprove(order._id)}
                                      disabled={order.status === "approved" || order.status === "rejected" || loadingOrders.includes(order._id)}
                                      className={`px-2 py-1 rounded text-xs transition ${
                                        order.status === "approved" || order.status === "rejected" || loadingOrders.includes(order._id)
                                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                          : "bg-green-100 text-green-700 hover:bg-green-200"
                                      }`}
                                    >
                                      {loadingOrders.includes(order._id) ? "⏳" : "✅ Approve"}
                                    </button>
                                    <button
                                      onClick={() => handleReject(order._id)}
                                      disabled={order.status === "approved" || order.status === "rejected" || loadingOrders.includes(order._id)}
                                      className={`px-2 py-1 rounded text-xs transition ${
                                        order.status === "approved" || order.status === "rejected" || loadingOrders.includes(order._id)
                                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                          : "bg-red-100 text-red-700 hover:bg-red-200"
                                      }`}
                                    >
                                      {loadingOrders.includes(order._id) ? "⏳" : "❌ Reject"}
                                    </button>
                                  </>
                                )}

                                {/* Cancel PO button - only show for approved POs */}
                                {order.status === "approved" && (
                                  <button
                                    onClick={() => handleCancel(order._id)}
                                    disabled={loadingOrders.includes(order._id)}
                                    className={`px-2 py-1 rounded text-xs transition ${
                                      loadingOrders.includes(order._id)
                                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                        : "bg-orange-100 text-orange-700 hover:bg-orange-200"
                                    }`}
                                  >
                                    {loadingOrders.includes(order._id) ? "⏳" : "🚫 Cancel"}
                                  </button>
                                )}
                              </div>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-6 flex-wrap gap-2">
              <button
                className="px-4 py-2 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                disabled={page === 1}
              >
                ⬅ Previous
              </button>

              {[...Array(totalPages)].map((_, index) => {
                const pageNumber = index + 1;
                // Show limited pages with ellipsis for better mobile experience
                if (
                  pageNumber === 1 ||
                  pageNumber === totalPages ||
                  (pageNumber >= page - 1 && pageNumber <= page + 1)
                ) {
                  return (
                    <button
                      key={pageNumber}
                      onClick={() => setPage(pageNumber)}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        pageNumber === page
                          ? "bg-blue-600 text-white"
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                      }`}
                    >
                      {pageNumber}
                    </button>
                  );
                } else if (pageNumber === page - 2 || pageNumber === page + 2) {
                  return <span key={pageNumber} className="px-2 py-2">...</span>;
                }
                return null;
              })}

              <button
                className="px-4 py-2 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={page === totalPages}
              >
                Next ➡
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}