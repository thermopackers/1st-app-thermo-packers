import React, { useState, useEffect, useRef } from "react";
import axiosInstance from "../axiosInstance";
import gsap from "gsap";
import Swal from "sweetalert2";
import { NavLink, useSearchParams } from "react-router-dom";
import InternalNavbar from "../components/InternalNavbar";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useUserContext } from "../context/UserContext";
import EditDanaBeadsSlipForm from "../components/EditDanaBeadsSlipForm";

const DanaBeadsDashboard = () => {
  // Helper function to parse roles properly
const parseUserRoles = (user) => {
  if (!user || !user.role) {
    return [];
  }
  
  let userRoles = [];
  if (Array.isArray(user.role)) {
    if (user.role.length > 0 && typeof user.role[0] === 'string' && user.role[0].startsWith('[')) {
      try {
        userRoles = JSON.parse(user.role[0]);
      } catch (parseError) {
        userRoles = user.role;
      }
    } else {
      userRoles = user.role;
    }
  } else if (typeof user.role === 'string') {
    try {
      userRoles = JSON.parse(user.role);
    } catch (parseError) {
      userRoles = [user.role];
    }
  } else {
    userRoles = [user.role];
  }
  return userRoles;
};
  const { user } = useUserContext();
  const [orders, setOrders] = useState([]);
  const baseUrl = import.meta.env.VITE_REACT_APP_API_URL;
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState(""); // uses danaBeadsStatus
  const [totalPages, setTotalPages] = useState(1);
  const [products, setProducts] = useState([]);
  const [activeProductImage, setActiveProductImage] = useState(null);
  const [sortOrder, setSortOrder] = useState("newest");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();
  const currentPage = parseInt(searchParams.get("page")) || 1;
  const [loading, setLoading] = useState(true);
  const [filterLoading, setFilterLoading] = useState(false);
  const ordersPerPage = 5;
  const cardsRef = useRef([]);
  const navigate = useNavigate();
  const orderContainerRef = useRef(null);
const [editModalOpen, setEditModalOpen] = useState(false);
const [selectedOrderForEdit, setSelectedOrderForEdit] = useState(null);

  // ✅ ADD THIS LINE - Parse user roles
  const userRoles = user ? parseUserRoles(user) : [];

  const groupOrdersByPO = (orders) => {
    return orders.reduce((groups, order) => {
      const po = order.po || "N/A";
      if (!groups[po]) groups[po] = [];
      groups[po].push(order);
      return groups;
    }, {});
  };

   // ✅ ADD THIS AUTHORIZATION CHECK
  useEffect(() => {
    if (!user) return;
    
    const hasAccess = userRoles.includes("accounts") || 
                      userRoles.includes("admin") || 
                      userRoles.includes("production");
    
    if (!hasAccess) {
      Swal.fire({
        title: "Access Denied",
        text: "You don't have permission to access the Dana/Beads Dashboard",
        icon: "error",
        confirmButtonText: "OK"
      }).then(() => {
        navigate("/dashboard");
      });
    }
  }, [user, userRoles, navigate]);

  useEffect(() => {
    setSearchParams({ page: 1 });
  }, [searchTerm, statusFilter, startDate, endDate]);

  useEffect(() => {
    axiosInstance
      .get("/products/all-backend-products")
      .then((res) => setProducts(res.data))
      .catch((err) => console.error("Error fetching products:", err));
  }, []);

  useEffect(() => {
    const fetchOrders = async () => {
      setFilterLoading(true);
      try {
        const token = localStorage.getItem("token");
        const res = await axiosInstance.get("/orders/dana-beads", {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            page: currentPage,
            limit: ordersPerPage,
            startDate,
            endDate,
            search: searchTerm,
            status: statusFilter,     // danaBeadsStatus
            sort: sortOrder,
          },
        });

const list = (res.data.orders || [])
  // ✅ only include orders with a danaBeadsSlip
  .filter((o) => o.danaBeadsSlip && o.danaBeadsSlip.url);

        setOrders(list);
        setFilteredOrders(list);
        setTotalPages(res.data.totalPages || 1);
      } catch (err) {
        console.error("Failed to fetch dana/beads orders:", err);
        setOrders([]);
        setFilteredOrders([]);
      } finally {
        setFilterLoading(false);
        setLoading(false);
      }
    };

    fetchOrders();
  }, [statusFilter, startDate, endDate, currentPage, searchTerm, sortOrder]);

  useEffect(() => {
    gsap.from(orderContainerRef.current, {
      opacity: 0,
      y: 20,
      duration: 0.6,
      ease: "power2.out",
    });
  }, []);

  const handleProductionStatusChange = async (orderId, newStatus) => {
    try {
      const token = localStorage.getItem("token");
      await axiosInstance.put(
        `/orders/dana-beads-status/${orderId}`,
        { danaBeadsStatus: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setOrders((prev) =>
        prev.map((order) =>
          order._id === orderId ? { ...order, danaBeadsStatus: newStatus } : order
        )
      );
      setFilteredOrders((prev) =>
        prev.map((order) =>
          order._id === orderId ? { ...order, danaBeadsStatus: newStatus } : order
        )
      );

      toast.success(`Dana/Beads status set to ${newStatus}`);
    } catch (error) {
      console.error("Failed to update dana/beads status:", error);
      toast.error("Failed to update dana/beads status.");
    }
  };

const handleDeleteFromSection = async (orderId) => {
  const confirm = await Swal.fire({
    title: "Are you sure?",
    text: "This will delete the Dana/Beads Slip and remove the order from Dana/Beads Dashboard (but not from main Order List).",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Yes, delete it",
    cancelButtonText: "Cancel",
  });

  if (confirm.isConfirmed) {
    try {
      const token = localStorage.getItem("token");
      await axiosInstance.delete(`/orders/remove-dana-beads/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setOrders((prev) => prev.filter((o) => o._id !== orderId));
      setFilteredOrders((prev) => prev.filter((o) => o._id !== orderId));

      toast.success("Order removed from Dana/Beads Dashboard.");
    } catch (err) {
      console.error("Error removing from dana/beads:", err);
      toast.error("Failed to remove order.");
    }
  }
};


  const currentOrders = filteredOrders;

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setSearchParams({ page });
    }
  };

  const handleEditSlip = (order) => {
  if (!order.danaBeadsSlip?.url) {
    toast.error("No Dana/Beads slip found for editing");
    return;
  }
  
  setSelectedOrderForEdit(order);
  setEditModalOpen(true);
};

const handleSaveEditedSlip = async (orderId, formData) => {
  try {
    setLoading(true);
    
    const response = await axiosInstance.put(
      `/orders/${orderId}/edit-dana-beads-slip`,
      formData,
      {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      }
    );

    toast.success("Dana/Beads slip updated successfully!");
    setEditModalOpen(false);
    setSelectedOrderForEdit(null);
    
    // Refresh the orders list
    const token = localStorage.getItem("token");
    const res = await axiosInstance.get("/orders/dana-beads", {
      headers: { Authorization: `Bearer ${token}` },
      params: {
        page: currentPage,
        limit: ordersPerPage,
        startDate,
        endDate,
        search: searchTerm,
        status: statusFilter,
        sort: sortOrder,
      },
    });

    const list = (res.data.orders || [])
      .filter((o) => o.danaBeadsSlip && o.danaBeadsSlip.url);

    setOrders(list);
    setFilteredOrders(list);
    
  } catch (err) {
    console.error("Error editing Dana/Beads slip", err);
    toast.error("Failed to update Dana/Beads slip");
  } finally {
    setLoading(false);
  }
};

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-purple-300 border-t-purple-600 rounded-full animate-spin"></div>
          <p className="text-purple-700 font-medium">Loading orders...</p>
        </div>
      </div>
    );
  }

  // ✅ ADD THIS CHECK - If user doesn't have access, don't render the dashboard
  if (user && !userRoles.includes("accounts") && !userRoles.includes("admin") && !userRoles.includes("production")) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-4">You don't have permission to access this dashboard.</p>
          <button 
            onClick={() => navigate("/dashboard")}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }
  return (
    <>
      <InternalNavbar />
      <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
        <button
          className="absolute cursor-pointer left-4 hidden md:block bg-purple-500 text-white px-4 py-2 rounded-md shadow-md hover:bg-purple-600 back-button"
          onClick={() => navigate(-1)}
        >
          ↩️ Back
        </button>

        <h2 className="text-3xl md:text-4xl font-bold mb-6 text-center text-black">
          EPS/Thermocol Dana/Beads Production Section
        </h2>

        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
          <div className="flex flex-col">
            <label className="mb-1 text-sm font-medium text-gray-700">Production Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="">Select</option>
              <option value="pending">Pending</option>
              <option value="in process">In Process</option>
              <option value="processed">Processed</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div className="flex flex-col">
            <label className="mb-1 text-sm font-medium text-gray-700">Date Range:</label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <span className="text-gray-500">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
          </div>

          <div className="flex flex-col w-full md:w-1/2">
            <label className="mb-1 text-sm font-medium text-gray-700">Search Orders:</label>
            <input
              type="text"
              placeholder="🔍 Search by PO, Order ID, Customer or Product..."
              className="p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

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

          <div className="flex md:mt-6 items-center pt-6 md:pt-0">
            <button
              onClick={() => {
                setStatusFilter("");
                setStartDate("");
                setEndDate("");
                setSearchTerm("");
                setSortOrder("newest");
              }}
              className="p-3 bg-red-500 text-white cursor-pointer rounded-lg shadow hover:bg-red-600 transition"
            >
              ✖ Clear Filters
            </button>
          </div>
        </div>

        {filterLoading ? (
          <div className="flex items-center justify-center h-120">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 border-4 border-purple-300 border-t-purple-600 rounded-full animate-spin"></div>
              <p className="text-purple-700 font-medium">Filtering orders...</p>
            </div>
          </div>
        ) : currentOrders.length > 0 ? (
          <>
            <div ref={orderContainerRef} className="w-full overflow-x-auto px-2 md:px-4">
              <div className="rounded-xl shadow-lg">
                <table className="min-w-full text-sm text-left text-gray-800 border border-gray-200">
                  <thead className="bg-purple-100 text-gray-700 text-xs uppercase">
                    <tr>
                      <th className="px-4 py-3">Order ID</th>
                      <th className="px-4 py-3">Date of Order</th>
                      <th className="px-4 py-3">Customer Name</th>
                      <th className="px-4 py-3">PO</th>
                      <th className="px-4 py-3">Product</th>
                      <th className="px-4 py-3">Density</th>
                      <th className="px-4 py-3">Quantity</th>
                      <th className="px-4 py-3">Remarks</th>
                      <th className="px-4 py-3">Slip</th>
                      <th className="px-4 py-3">Dana/Beads Status</th>
                      <th className="px-4 py-3">Update Status</th>
                      <th className="px-4 py-3">Remove</th>
                    </tr>
                  </thead>
                <tbody className="bg-white divide-y divide-gray-200">
  {currentOrders.map((order, i) => (
     <tr key={order._id} ref={(el) => (cardsRef.current[i] = el)} className="hover:bg-gray-50 transition duration-150">
                            <td className="px-4 py-3 font-medium">{order.shortId}</td>
<td className="px-6 py-4">
  <div className="text-xs text-gray-500">
    {new Date(order.createdAt).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })}
  </div>
</td>

                            <td className="px-4 py-3 capitalize">{order.customerName}</td>
                            <td className="px-4 py-3 capitalize">{order.po}</td>

                            <td className="px-4 py-2 text-blue-600 underline cursor-pointer">
                              <button
                                onClick={() => {
                                  const product = products.find((p) => p.name === order.product);
                                  if (product?.images?.length > 0) {
                                    setActiveProductImage({ name: product.name, images: product.images });
                                  } else {
                                    Swal.fire({ icon: "info", title: "No Image", text: "No images available for this product." });
                                  }
                                }}
                              >
                                {order.product}
                              </button>
                            </td>

                            <td className="px-4 py-3">{order.density || "-"}</td>
                            <td className="px-4 py-3">{order.quantity || "-"}</td>
                            <td className="px-4 py-3">{order.remarks || "-"}</td>

                            <td className="px-4 py-3">
                              {order.danaBeadsSlip?.url && (
                                <a href={order.danaBeadsSlip.url} download className="text-purple-600 underline">
                                  🧾 Download Slip
                                </a>
                              )}
                            </td>

                           <td className="px-4 py-2 whitespace-nowrap">
  {order.status === "cancelled" ? (
    <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
      🚫 Cancelled
    </span>
  ) : (
   <span
  className={`px-2 py-1 rounded-full text-xs font-semibold ${
    order.danaBeadsStatus === "completed"
      ? "bg-green-700 text-white"
      : order.danaBeadsStatus === "processed"
      ? "bg-green-100 text-green-700"
      : order.danaBeadsStatus === "in process"
      ? "bg-yellow-100 text-yellow-700"
      : order.danaBeadsStatus === "pending"
      ? "bg-orange-100 text-orange-700"
      : "bg-gray-100 text-gray-700"
  }`}
>
  {order.danaBeadsStatus || "Pending"}
</span>

  )}
</td>


                           <td className="px-4 py-3">
  {order.status === "cancelled" ? (
    <span className="text-red-600 font-semibold"> 🚫 Order cancelled, not to be processed!</span>
  ) : (
   <select
  value={order.danaBeadsStatus || ""}
  onChange={(e) => handleProductionStatusChange(order._id, e.target.value)}
  disabled={order.danaBeadsStatus === "completed"} // ✅ prevent further edits
  className={`w-full border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring focus:ring-purple-300 ${
    order.danaBeadsStatus === "completed" ? "bg-gray-100 cursor-not-allowed" : ""
  }`}
>
      <option value="" disabled>Change Status</option>
      <option value="pending">Pending</option>
      <option value="in process">In Process</option>
      <option value="processed">Processed</option>
  <option value="completed" disabled>Completed</option>
    </select>
  )}
</td>


                         <td className="px-4 py-3">
  <div className="flex flex-col space-y-2">
    <button
      onClick={() => handleDeleteFromSection(order._id)}
      className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs"
    >
      ❌ Delete
    </button>
    
    {/* Edit Button */}
    {order.danaBeadsSlip?.url && (
      <button
        onClick={() => handleEditSlip(order)}
        className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs"
      >
        ✏️ Edit
      </button>
    )}
  </div>
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
                              src={img.startsWith("http") ? img : `${import.meta.env.VITE_REACT_APP_API_URL}${img}`}
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
            </div>

            {currentOrders.length > 0 && (
              <div className="flex justify-center mt-6 gap-2 flex-wrap">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-purple-500 text-white rounded disabled:opacity-50"
                >
                  Prev
                </button>
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => handlePageChange(i + 1)}
                    className={`px-4 py-2 rounded ${
                      currentPage === i + 1
                        ? "bg-purple-700 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-purple-300"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-purple-500 text-white rounded disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        ) : (
          <p className="text-center text-gray-600 mt-8">No orders found.</p>
        )}
        {editModalOpen && selectedOrderForEdit && (
  <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center p-6">
    <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      <h2 className="text-2xl font-bold mb-4">
        Edit Dana/Beads Slip for Order {selectedOrderForEdit.shortId}
      </h2>
      
      <EditDanaBeadsSlipForm
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

export default DanaBeadsDashboard;
