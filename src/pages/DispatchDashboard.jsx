import React, { useState, useEffect, useRef } from "react";
import axiosInstance from "../axiosInstance";
import gsap from "gsap";
import Swal from "sweetalert2";
import InternalNavbar from "../components/InternalNavbar";
import { NavLink, useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { useUserContext } from "../context/UserContext";
import EditCuttingSlipForm from "../components/EditCuttingSlipForm";

const DispatchDashboard = () => {
  const { setShouldRefetchOrders } = useUserContext();
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [editModalOpen, setEditModalOpen] = useState(false);
const [selectedOrderForEdit, setSelectedOrderForEdit] = useState(null);
  
  const [products, setProducts] = useState([]);
    const [activeProductImage, setActiveProductImage] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
                       const baseUrl = import.meta.env.VITE_REACT_APP_API_URL;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
const [totalPages, setTotalPages] = useState(1);
const [searchParams, setSearchParams] = useSearchParams();
const [sortOrder, setSortOrder] = useState("newest");
const currentPage = parseInt(searchParams.get("page")) || 1;
const ordersPerPage = 5;
const handlePageChange = (page) => {
  if (page >= 1 && page <= totalPages) {
    setSearchParams({ page });
        window.scrollTo({ top: 0, behavior: "smooth" }); // ✅ Optional UX boost

  }
};
 
  const cardsRef = useRef([]);
  const navigate = useNavigate();
  const orderContainerRef = useRef(null);

  const groupOrdersByPO = (orders) => {
    return orders.reduce((groups, order) => {
      const po = order.po || "N/A";
      if (!groups[po]) groups[po] = [];
      groups[po].push(order);
      return groups;
    }, {});
  };

  
 useEffect(() => {
    axiosInstance
      .get("/products/all-backend-products")
      .then((res) => setProducts(res.data))
      .catch((err) => console.error("Error fetching products:", err));
  }, []);



useEffect(() => {
  // Reset page to 1 whenever filters or searchTerm change
  setSearchParams((prev) => {
    const params = new URLSearchParams(prev);
    params.set("page", 1);
    return params;
  });
}, [searchTerm, statusFilter, startDate, endDate]);

useEffect(() => {
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const res = await axiosInstance.get("/orders/dispatch-dashboard", {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          page: currentPage,
          limit: ordersPerPage,
          startDate,
          endDate,
          status: statusFilter,
          search: searchTerm,
            sort: sortOrder, // ✅ add this line
        },
      });

      setOrders(res.data.orders);
      setFilteredOrders(res.data.orders); // Already paginated, no slicing needed
      setTotalPages(res.data.totalPages);
    } catch (err) {
      console.error("Error fetching orders:", err);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  fetchOrders();
}, [currentPage, startDate, endDate, statusFilter, searchTerm,sortOrder]);



  useEffect(() => {
    gsap.from(orderContainerRef.current, {
      opacity: 0,
      y: 20,
      duration: 0.6,
      ease: "power2.out",
    });
  }, []);


  const handleDispatchStatusChange = async (orderId, newStatus) => {
    const token = localStorage.getItem("token");
    try {
      await axiosInstance.put(
        `/orders/dispatch-status/${orderId}`,
        { dispatchStatus: newStatus },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order._id === orderId ? { ...order, dispatchStatus: newStatus } : order
        )
      );
      setFilteredOrders((prevOrders) =>
  prevOrders.map((order) =>
    order._id === orderId ? { ...order, dispatchStatus: newStatus } : order
  )
);
      toast.success(newStatus);
    } catch (err) {
      console.error("Error updating dispatch status:", err);
      alert("Failed to update dispatch status. Try again.");
    }
  };

  const handlePackagingStatusChange = async (orderId, newStatus) => {
    const token = localStorage.getItem("token");
    try {
      await axiosInstance.put(
        `/orders/packaging-status/${orderId}`,
        { packagingStatus: newStatus },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order._id === orderId ? { ...order, packagingStatus: newStatus } : order
        )
      );
      setFilteredOrders((prevOrders) =>
  prevOrders.map((order) =>
    order._id === orderId ? { ...order, packagingStatus: newStatus } : order
  )
);
      toast.success(`Packaging: ${newStatus}`);
    } catch (err) {
      console.error("Error updating packaging status:", err);
      alert("Failed to update packaging status. Try again.");
    }
  };

const currentOrders =
  sortOrder === "newest" || sortOrder === "oldest"
    ? filteredOrders
    : [...filteredOrders].sort((a, b) => {
        const dispatchPriority = (status) => {
          if (!status || status.toLowerCase() === "not dispatched") return 1;
          if (status.toLowerCase() === "ready to dispatch") return 2;
          if (status.toLowerCase() === "dispatched") return 3;
          return 4;
        };

        const packagingPriority = (status) => {
          if (!status || status.toLowerCase() === "unpackaged") return 1;
          if (status.toLowerCase() === "packaged") return 2;
          return 3;
        };

        const aDispatch = dispatchPriority(a.dispatchStatus);
        const bDispatch = dispatchPriority(b.dispatchStatus);

        if (aDispatch !== bDispatch) return aDispatch - bDispatch;

        const aPack = packagingPriority(a.packagingStatus);
        const bPack = packagingPriority(b.packagingStatus);

        if (aPack !== bPack) return aPack - bPack;

        return new Date(b.createdAt) - new Date(a.createdAt); // fallback to date
      });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-xl text-gray-600">Loading Dispatch Dashboard...</p>
        </div>
      </div>
    );
  }
const handleProductionStatusChange = async (orderId, newStatus) => {
  try {
    await axiosInstance.put(
      `/orders/${orderId}/status`,
      { status: newStatus },
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );
    toast.success(`Production: ${newStatus}`);
    setOrders((prev) =>
      prev.map((order) =>
        order._id === orderId ? { ...order, status: newStatus } : order
      )
    );
    setFilteredOrders((prev) =>
      prev.map((order) =>
        order._id === orderId ? { ...order, status: newStatus } : order
      )
    );
  } catch (err) {
    console.error("Error updating production status:", err);
    toast.error("Failed to update production status.");
  }
};

const handleEditSlip = (order) => {
  if (!order.cuttingSlip?.url) {
    toast.error("No cutting slip found for editing");
    return;
  }
  
  setSelectedOrderForEdit(order);
  setEditModalOpen(true);
};

const handleSaveEditedSlip = async (orderId, formData) => {
  try {
    setLoading(true);
    
    const response = await axiosInstance.put(
      `/orders/${orderId}/edit-cutting-slip`,
      formData,
      {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      }
    );

    toast.success("Cutting slip updated successfully!");
    setEditModalOpen(false);
    setSelectedOrderForEdit(null);
    
    // Refresh the orders list
    const token = localStorage.getItem("token");
    const res = await axiosInstance.get("/orders/dispatch-dashboard", {
      headers: { Authorization: `Bearer ${token}` },
      params: {
        page: currentPage,
        limit: ordersPerPage,
        startDate,
        endDate,
        status: statusFilter,
        search: searchTerm,
        sort: sortOrder,
      },
    });

    setOrders(res.data.orders);
    setFilteredOrders(res.data.orders);
    
  } catch (err) {
    console.error("Error editing cutting slip", err);
    toast.error("Failed to update cutting slip");
  } finally {
    setLoading(false);
  }
};

// ✅ Helper: Check if order has multiple products
const hasMultipleProducts = (order) => {
  return order.products && order.products.length > 0;
};

// ✅ Helper: Get total quantity
const getTotalQuantity = (order) => {
  if (hasMultipleProducts(order)) {
    return order.products.reduce((sum, p) => sum + (parseInt(p.quantity) || 0), 0);
  }
  return order.quantity;
};

  return (
    <>
      <InternalNavbar />
      <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
        <button
          className="absolute cursor-pointer left-4 hidden md:block bg-blue-500 text-white px-4 py-2 rounded-md shadow-md hover:bg-blue-600 back-button"
          onClick={() => navigate(-1)}
        >
          ↩️ Back
        </button>

        <h2 className="text-3xl md:text-4xl font-bold mb-6 text-center text-black">
EPS/Thermocol Sheet Cutting & Dispatch Section        </h2>

        {/* Filters omitted for brevity — unchanged */}
<div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6">
  <div className="flex flex-col">
    <label className="mb-1 text-sm font-medium text-gray-700">Status Filter:</label>
    <select
      value={statusFilter}
      onChange={(e) => setStatusFilter(e.target.value)}
      className="p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
    >
      <option value="">All</option>
      <option value="not dispatched">Not Dispatched</option>
      <option value="ready to dispatch">Ready to Dispatch</option>
      <option value="dispatched">Dispatched</option>
    </select>
  </div>

  <div className="flex flex-col w-full md:w-1/2">
    <label className="mb-1 text-sm font-medium text-gray-700">Search Orders:</label>
    <input
      type="text"
      placeholder="🔍 Search by Po, Order ID, Customer or Product..."
      className="p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
    />
  </div>

  <div className="flex flex-col">
    <label className="mb-1 text-sm font-medium text-gray-700">Start Date:</label>
    <input
      type="date"
      className="p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
      value={startDate}
      onChange={(e) => setStartDate(e.target.value)}
    />
  </div>

  <div className="flex flex-col">
    <label className="mb-1 text-sm font-medium text-gray-700">End Date:</label>
    <input
      type="date"
      className="p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
      value={endDate}
      onChange={(e) => setEndDate(e.target.value)}
    />
  </div>
{/* Sort Order Filter */}
<div className="flex flex-col">
  <label className="mb-1 text-sm font-medium text-gray-700">Sort Order:</label>
  <select
    value={sortOrder}
    onChange={(e) => setSortOrder(e.target.value)}
    className="p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
  >
    <option value="newest">Newest First</option>
    <option value="oldest">Oldest First</option>
  </select>
</div>

  <div className="flex flex-col self-end">
    <button
      onClick={() => {
        setStatusFilter("");
        setSearchTerm("");
        setStartDate("");
        setEndDate("");
          setSortOrder("newest");
      }}
      className="mt-1 px-4 py-2 cursor-pointer bg-red-500 text-white rounded-lg shadow hover:bg-red-600 transition"
    >
     ✖ Clear Filters
    </button>
  </div>
</div>
        {error ? (
          <p className="text-center text-red-600">{error}</p>
        ) : currentOrders.length > 0 ? (
          <>
            <div ref={orderContainerRef} className="w-full overflow-x-auto px-2 md:px-4">
              <div className="rounded-xl shadow-lg">
                <table className="min-w-full text-sm text-left text-gray-800 border border-gray-200">
                  <thead className="bg-blue-100 text-gray-700 text-xs uppercase">
                    <tr>
                      <th className="px-4 py-3">Order ID</th>
                      <th className="px-4 py-3">Date of Order</th>
                      <th className="px-4 py-3">Customer Name</th>
                      <th className="px-4 py-3">PO</th>
                      <th className="px-4 py-3">Product Name</th>
                      <th className="px-4 py-3">Size</th>
                      <th className="px-4 py-3">Quantity</th>
                     
                      <th className="px-4 py-3">Remarks</th>
                      <th className="px-4 py-3">Slip</th>
                      <th className="px-4 py-3">Production Status</th>
                      <th className="px-4 py-3">Update Production Status</th>
                      <th className="px-4 py-3">Packaging Status</th>
                      <th className="px-4 py-3">Update Packaging Status</th>
                      <th className="px-4 py-3">Dispatch Status</th>
                      <th className="px-4 py-3">Update Dispatch Status</th>
                      <th className="px-4 py-3">Delete this order from here</th>
                    </tr>
                  </thead>
                <tbody className="bg-white divide-y divide-gray-200">
  {currentOrders.map((order) => (
    <tr key={order._id} className="hover:bg-gray-50 transition duration-150">
      {/* Order ID */}
      <td className="px-4 py-3 font-medium">{order.shortId}</td>
      
      {/* Date of Order */}
      <td className="px-6 py-4">
        <div className="text-xs text-gray-500">
          {new Date(order.createdAt).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })}
        </div>
      </td>

      {/* Customer Name */}
      <td className="px-4 py-3 capitalize">{order.customerName}</td>
      
      {/* PO */}
      <td className="px-4 py-3 capitalize">{order.po}</td>

      {/* Product Name - Multi-product support */}
      <td className="px-4 py-2">
        {order.products && order.products.length > 0 ? (
          <div className="space-y-1">
            {order.products.map((prod, idx) => (
              <div key={idx} className="border-b border-gray-200 pb-1 last:border-0">
                <button
                  onClick={() => {
                    const product = products.find((p) => p.name === prod.productName);
                    if (product?.images?.length > 0) {
                      setActiveProductImage({ name: prod.productName, images: product.images });
                    } else {
                      Swal.fire({ icon: "info", title: "No Image", text: "No images available for this product." });
                    }
                  }}
                  className="text-blue-600 underline cursor-pointer text-left text-sm"
                >
                  {prod.productName}
                </button>
                <div className="text-xs text-gray-500 mt-0.5">
                  Qty: {prod.quantity} | Size: {prod.size || "N/A"} | Density: {prod.density || "N/A"}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <button
            onClick={() => {
              const product = products.find((p) => p.name === order.product);
              if (product?.images?.length > 0) {
                setActiveProductImage({ name: order.product, images: product.images });
              } else {
                Swal.fire({ icon: "info", title: "No Image", text: "No images available for this product." });
              }
            }}
            className="text-blue-600 underline cursor-pointer"
          >
            {order.product}
          </button>
        )}
      </td>

      {/* Size - Multi-product support */}
      <td className="px-4 py-3">
        {order.products && order.products.length > 0 ? (
          <div className="space-y-1 text-xs">
            {order.products.map((prod, idx) => (
              <div key={idx}>{prod.size || "N/A"}</div>
            ))}
          </div>
        ) : (
          order.size || "N/A"
        )}
      </td>

      {/* Quantity - Multi-product support */}
      <td className="px-4 py-3">
        {order.products && order.products.length > 0 ? (
          <div>
            <span className="font-bold text-blue-600">
              {order.products.reduce((sum, p) => sum + (parseInt(p.quantity) || 0), 0)}
            </span>
            <span className="text-xs text-gray-500 block">({order.products.length} products)</span>
          </div>
        ) : (
          order.quantity
        )}
      </td>

      {/* Remarks - Multi-product support */}
      <td className="px-4 py-3">
        {order.products && order.products.length > 0 ? (
          <div className="space-y-1 text-xs">
            {order.products.map((prod, idx) => prod.productRemarks && (
              <div key={idx}><strong>{prod.productName}:</strong> {prod.productRemarks}</div>
            ))}
            {!order.products.some(p => p.productRemarks) && <span className="text-gray-400">-</span>}
          </div>
        ) : (
          order.cuttingSlip?.remarks || order.remarks || "-"
        )}
      </td>

      {/* Slip */}
      <td className="px-4 py-3">
        {order.cuttingSlip?.url && (
          <a href={order.cuttingSlip.url} download className="text-blue-600 underline">
            📥 Cutting Slip
          </a>
        )}
      </td>

      {/* Production Status */}
      <td className="px-4 py-2 whitespace-nowrap">
        <div className="flex items-center gap-2">
          <span className={`w-3 h-3 rounded-full ${
            order.status?.toLowerCase() === "completed"
              ? "bg-green-700"
              : order.status?.toLowerCase() === "processed"
              ? "bg-green-500"
              : order.status?.toLowerCase() === "in process"
              ? "bg-yellow-500"
              : order.status?.toLowerCase() === "pending"
              ? "bg-orange-500"
              : "bg-gray-400"
          }`}></span>
          <span className="capitalize">
            {order.status === "completed" ? "✅ Completed" : order.danaSlip ? order.status || "Unknown" : "Direct Dispatch"}
          </span>
        </div>
      </td>

      {/* Update Production Status */}
      <td className="px-4 py-2">
        {order.status === "cancelled" ? (
          <span className="text-red-600 font-semibold">🚫 Order cancelled, not to be processed!</span>
        ) : (
          <select
            value={order.status || ""}
            onChange={(e) => handleProductionStatusChange(order._id, e.target.value)}
            disabled={order.status === "completed"}
            className={`p-2 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 ${
              order.status === "completed" ? "bg-gray-100 cursor-not-allowed" : ""
            }`}
          >
            <option value="" disabled>Select</option>
            <option value="pending">Pending</option>
            <option value="in process">In Process</option>
            <option value="processed">Processed</option>
            <option value="completed" disabled>Completed</option>
          </select>
        )}
      </td>

      {/* Packaging Status */}
      <td className="px-4 py-3">
        {order.status === "cancelled" ? (
          <span className="text-red-600 font-semibold">🚫 Cancelled</span>
        ) : order.status === "completed" ? (
          <span className="text-gray-500 italic">Completed - No Packaging Needed</span>
        ) : (
          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
            order.packagingStatus === "packaged"
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}>
            {order.packagingStatus || "Unpackaged"}
          </span>
        )}
      </td>

      {/* Update Packaging Status */}
      <td className="px-4 py-3">
        {order.status === "cancelled" ? (
          <span className="text-gray-500 italic">Locked</span>
        ) : order.status === "completed" ? (
          <span className="text-gray-500 italic">Completed - No Update Needed</span>
        ) : (
          <select
            value={order.packagingStatus || ""}
            onChange={(e) => handlePackagingStatusChange(order._id, e.target.value)}
            className="p-2 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="" disabled>Select</option>
            <option value="unpackaged">Unpackaged</option>
            <option value="packaged">Packaged</option>
          </select>
        )}
      </td>

      {/* Dispatch Status */}
      <td className="px-4 py-3">
        {order.status === "cancelled" ? (
          <span className="text-red-600 font-semibold">🚫 Cancelled</span>
        ) : order.status === "completed" ? (
          <span className="text-gray-500 italic">Completed - No Dispatch Needed</span>
        ) : (
          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
            order.dispatchStatus === "dispatched"
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}>
            {order.dispatchStatus || "not dispatched"}
          </span>
        )}
      </td>

      {/* Update Dispatch Status */}
      <td className="px-4 py-3">
        {order.status === "cancelled" ? (
          <span className="text-gray-500 italic">Locked</span>
        ) : order.status === "completed" ? (
          <span className="text-gray-500 italic">Completed - No Update Needed</span>
        ) : (
          <select
            value={order.dispatchStatus}
            onChange={(e) => handleDispatchStatusChange(order._id, e.target.value)}
            className="p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="not dispatched">Not Dispatched</option>
            <option value="ready to dispatch">Ready to Dispatch</option>
            <option value="dispatched">Dispatched</option>
          </select>
        )}
      </td>

      {/* Actions - Delete & Edit */}
      <td className="px-4 py-3">
        {order.cuttingSlip?.url && (
          <div className="flex flex-col space-y-2">
            <button
              className="text-red-600 underline hover:text-red-800 text-sm"
              onClick={async () => {
                const result = await Swal.fire({
                  title: "Are you sure?",
                  text: "This will remove the Cutting Slip and free the order for re-sending.",
                  icon: "warning",
                  showCancelButton: true,
                  confirmButtonText: "Yes, delete it!",
                  cancelButtonText: "Cancel",
                });
                if (result.isConfirmed) {
                  try {
                    await axiosInstance.put(
                      `/orders/remove-from-dispatch/${order._id}`,
                      {},
                      { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
                    );
                    toast.success("Removed from dispatch successfully!");
                    setOrders((prev) => prev.filter((o) => o._id !== order._id));
                    setShouldRefetchOrders(true);
                  } catch (error) {
                    console.error("Error removing from dispatch:", error);
                    toast.error("Failed to remove from dispatch.");
                  }
                }
              }}
            >
              ❌ Delete
            </button>
            <button
              className="text-blue-600 underline hover:text-blue-800 text-sm"
              onClick={() => handleEditSlip(order)}
            >
              ✏️ Edit
            </button>
          </div>
        )}
      </td>
    </tr>
  ))}
</tbody>

                </table>
                
{activeProductImage && (
  <div
    className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center p-6"
    onClick={() => setActiveProductImage(null)}
  >
    <div
      className="bg-white rounded-lg p-4 max-w-4xl w-full overflow-y-auto max-h-[90vh] relative"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        onClick={() => setActiveProductImage(null)}
        className="absolute top-2 right-3 text-2xl font-bold text-red-500 hover:text-red-700"
      >
        ✖
      </button>
      <h2 className="text-lg font-semibold mb-4">
        {activeProductImage.name} - Images
      </h2>
      {activeProductImage.images.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {activeProductImage.images.map((img, i) => (
            <img
              key={i}
              src={
                img.startsWith("http")
                  ? img
                  : `${import.meta.env.VITE_REACT_APP_API_URL}${img}`
              }
              alt={`Image ${i + 1}`}
              className="w-full h-48 object-cover rounded border"
            />
          ))}
        </div>
      ) : (
        <p className="text-gray-500">No images available.</p>
      )}
    </div>
  </div>
)}
              </div>

              {/* Pagination (unchanged) */}
            {totalPages > 1 && (
  <div className="flex justify-center mt-6 gap-2 flex-wrap">
    <button
      onClick={() => handlePageChange(currentPage - 1)}
      disabled={currentPage === 1}
      className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
    >
      Prev
    </button>

    {Array.from({ length: totalPages }, (_, i) => (
      <button
        key={i}
        onClick={() => handlePageChange(i + 1)}
        className={`px-3 py-1 border rounded ${
          currentPage === i + 1
            ? "bg-blue-600 text-white"
            : "bg-white text-blue-600 hover:bg-blue-100"
        }`}
      >
        {i + 1}
      </button>
    ))}

    <button
      onClick={() => handlePageChange(currentPage + 1)}
      disabled={currentPage === totalPages}
      className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
    >
      Next
    </button>
  </div>
)}

            </div>
          </>
        ) : (
          <p className="text-center text-gray-500">No orders found.</p>
        )}
        {editModalOpen && selectedOrderForEdit && (
  <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center p-6">
    <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      <h2 className="text-2xl font-bold mb-4">
        Edit Cutting Slip for Order {selectedOrderForEdit.shortId}
      </h2>
      
      <EditCuttingSlipForm
        order={selectedOrderForEdit}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedOrderForEdit(null);
        }}
        onSave={handleSaveEditedSlip}
      />
    </div>
  </div>
)}
      </div>
    </>
  );
};

export default DispatchDashboard;
