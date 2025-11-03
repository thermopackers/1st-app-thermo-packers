import React, { useEffect, useState } from "react";
import InternalNavbar from "../components/InternalNavbar";
import { NavLink, useSearchParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { gsap } from "gsap";
import axiosInstance from "../axiosInstance";
import { useUserContext } from "../context/UserContext";
import toast from "react-hot-toast";
import EditSlipForm from "../components/EditSlipForm";

const ITEMS_PER_PAGE = 15;

const ProductionDashboard = () => {
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
  const { setShouldRefetchOrders } = useUserContext();
  const { user, loading: userLoading } = useUserContext();
                     const baseUrl = import.meta.env.VITE_REACT_APP_API_URL;
  const [orders, setOrders] = useState([]);
const [searchParams, setSearchParams] = useSearchParams();
const currentPage = parseInt(searchParams.get("page")) || 1;
const typeFilter = searchParams.get("type"); // shape or dana
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");
  const [dispatchedOrders, setDispatchedOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
    const [activeProductImage, setActiveProductImage] = useState(null);

  const [totalPages, setTotalPages] = useState(1);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [packagingReadyOrders, setPackagingReadyOrders] = useState([]);
const type = searchParams.get('type');
console.log("orders",orders);
const [editModalOpen, setEditModalOpen] = useState(false);
const [selectedOrderForEdit, setSelectedOrderForEdit] = useState(null);
const [editType, setEditType] = useState(null); // 'shape' or 'dana'

  // ✅ ADD THIS LINE - Parse user roles
  const userRoles = user ? parseUserRoles(user) : [];

  if (userLoading) {
  return (
    <div className="flex justify-center items-center h-40">
      <div className="w-12 h-12 border-4 border-blue-400 border-dashed rounded-full animate-spin"></div>
    </div>
  );
}

const handleEditSlip = (order) => {
  // Determine slip type
  const type = order.shapeSlip?.url ? 'shape' : order.danaSlip?.url ? 'dana' : null;
  if (!type) {
    toast.error("No slip found for editing");
    return;
  }
  
  setSelectedOrderForEdit(order);
  setEditType(type);
  setEditModalOpen(true);
};
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

  const navigate = useNavigate();
const handlePageChange = (newPage) => {
  if (newPage < 1 || newPage > totalPages) return;
  const currentParams = Object.fromEntries([...searchParams]);
  setSearchParams({ ...currentParams, page: newPage });
};


const fetchOrders = async () => {
  try {
    setLoading(true);

    // Build query params
    const params = new URLSearchParams();
    params.append("page", currentPage);
    params.append("limit", ITEMS_PER_PAGE);
    if (searchTerm) params.append("searchTerm", searchTerm);
    if (statusFilter !== "all") params.append("status", statusFilter);
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);
    params.append("sort", sortOrder);

    const response = await axiosInstance.get(
      `/orders/production-dashboard?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );

    let enrichedOrders = response.data.orders;

    // ✅ FIXED: Use userRoles instead of user.role
    if (userRoles.includes("accounts")) {
      enrichedOrders = enrichedOrders.filter((o) => {
        const assigned = o.sentTo?.production?.length > 0;

        if (!assigned) return false;

        if (typeFilter === "shape") {
          return !!o.shapeSlip?.url;
        }

        if (typeFilter === "dana") {
          return !!o.danaSlip?.url;
        }

        // fallback: if type is missing, show both
        return o.shapeSlip?.url || o.danaSlip?.url;
      });
    } else if (user?.productionSection?.length > 0 && typeFilter) {
      enrichedOrders = enrichedOrders.filter((o) => {
        const assignedSections = o.sentTo?.production || [];
        const userSections = user.productionSection;

        if (typeFilter === "shape") {
          return (
            userSections.includes("shapeMoulding") &&
            assignedSections.includes("shapeMoulding") &&
            !!o.shapeSlip?.url
          );
        }

        if (typeFilter === "dana") {
          return (
            userSections.includes("blockMoulding") &&
            assignedSections.includes("preExpander") &&
            !!o.danaSlip?.url
          );
        }

        return false; // fallback
      });
    }

    setOrders(enrichedOrders);

    // Setup dispatched and packaging ready arrays
    const ready = enrichedOrders
      .filter((order) => order.sentTo?.dispatchReady)
      .map((order) => order._id);
    setDispatchedOrders(ready);

    const packaged = enrichedOrders
      .filter((order) => order.readyForPackaging)
      .map((order) => order._id);
    setPackagingReadyOrders(packaged);

    // Update total pages from backend response
    setTotalPages(response.data.totalPages);
  } catch (error) {
    console.error("Failed to fetch orders:", error);
  } finally {
    setLoading(false);
  }
};


  const handleStatusChange = async (orderId, newStatus) => {
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
      toast.success(newStatus)
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order._id === orderId ? { ...order, status: newStatus } : order
        )
      );
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };


const currentOrders = orders;


 
  useEffect(() => {
    fetchOrders();
    gsap.from(".dashboard-title", { opacity: 0, y: -30, duration: 1 });
    gsap.from(".back-button", { opacity: 0, x: -30, duration: 1, delay: 0.5 });
    gsap.from(".table-row", {
      opacity: 0,
      y: 20,
      stagger: 0.2,
      duration: 1,
      delay: 1,
    });
  }, [currentPage, searchTerm, statusFilter, startDate, endDate, sortOrder, typeFilter]);
const onSearchChange = (e) => {
  setSearchTerm(e.target.value);
  const currentParams = Object.fromEntries([...searchParams]);
  setSearchParams({ ...currentParams, page: 1 });
};


const onStatusChange = (e) => {
  setStatusFilter(e.target.value);
  const currentParams = Object.fromEntries([...searchParams]);
  setSearchParams({ ...currentParams, page: 1 });
};


const onStartDateChange = (e) => {
  setStartDate(e.target.value);
  const currentParams = Object.fromEntries([...searchParams]);
  setSearchParams({ ...currentParams, page: 1 });
};


const onEndDateChange = (e) => {
  setEndDate(e.target.value);
  const currentParams = Object.fromEntries([...searchParams]);
  setSearchParams({ ...currentParams, page: 1 });
};

const handleRemoveFromProduction = async (order) => {
  const type = order.shapeSlip?.url ? "shape" : order.danaSlip?.url ? "dana" : null;
  if (!type) return toast.error("No slip found for removal");

  const confirm = await Swal.fire({
    title: "Remove from Production?",
    text: "This will remove the slip and allow re-sending from OrderList.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Yes, remove it",
  });

  if (!confirm.isConfirmed) return;

  try {
    await axiosInstance.put(
      `/orders/${order._id}/remove-from-production?type=${type}`,
      {},
      {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      }
    );

    toast.success("Removed from production!");
    setOrders((prev) => prev.filter((o) => o._id !== order._id));
    setShouldRefetchOrders(true); // 🚀 trigger refresh in OrderList
  } catch (err) {
    console.error("Error removing from production", err);
    toast.error("Failed to remove");
  }
};


const handleSaveEditedSlip = async (orderId, type, formData) => {
  try {
    setLoading(true);
    
    const response = await axiosInstance.put(
      `/orders/${orderId}/edit-slip?type=${type}`,
      formData,
      {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      }
    );

    toast.success("Slip updated successfully!");
    setEditModalOpen(false);
    setSelectedOrderForEdit(null);
    setEditType(null);
    
    // Refresh the orders list
    fetchOrders();
    
  } catch (err) {
    console.error("Error editing slip", err);
    toast.error("Failed to update slip");
  } finally {
    setLoading(false);
  }
};

  return (
    <>
      <InternalNavbar />
      <div className="relative md:mt-8 mt-4 px-4">
        <h2 className="text-3xl md:text-4xl text-center font-semibold dashboard-title">
  {type === 'shape'
    ? 'EPS/Thermocol Shape Moulding Production Dashboard'
    : 'EPS/Thermocol Block Moulding Production Dashboard'}
</h2>

        
<div className="flex justify-center mt-6">
  <div className="p-4 bg-white rounded-xl shadow-md flex flex-col md:flex-row gap-4 items-center justify-center">
    {/* ✅ FIXED: Use userRoles instead of user.role */}
    {type !== "dana" && (userRoles.includes("accounts") || user.productionSection?.includes("shapeMoulding")) && (
      <button
        onClick={() => navigate("/reports/shape-moulding")}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-lg w-full md:w-auto"
      >
        📦 Daily Shape Moulding Production Report
      </button>
    )}

    {/* ✅ FIXED: Use userRoles instead of user.role */}
    {type !== "shape" && (userRoles.includes("accounts") || user.productionSection?.includes("blockMoulding")) && (
      <button
        onClick={() => navigate("/reports/block-moulding")}
        className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition shadow-lg w-full md:w-auto"
      >
        🧱 Daily Block Moulding Production Report
      </button>
    )}
  </div>
</div>

       <div className="mb-6 mt-2 flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6 flex-wrap">
  {/* Search Bar */}
  <div className="flex flex-col md:w-1/3 w-full">
    <label className="text-sm text-gray-600 mb-1">Search Orders:</label>
    <input
      type="text"
      placeholder="🔍 Search by PO No, Client, Product, or Order ID"
      className="w-full md:w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
      value={searchTerm}
  onChange={onSearchChange}
    />
  </div>

  {/* Start Date */}
  <div className="flex flex-col w-full md:w-1/6">
    <label className="text-sm text-gray-600 mb-1">Start Date</label>
    <input
      type="date"
      value={startDate}
  onChange={onStartDateChange}
      className="p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
    />
  </div>

  {/* End Date */}
  <div className="flex flex-col w-full md:w-1/6">
    <label className="text-sm text-gray-600 mb-1">End Date</label>
    <input
      type="date"
      value={endDate}
  onChange={onEndDateChange}
      className="p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
    />
  </div>

  {/* Status Filter */}
  <div className="flex flex-col w-full md:w-1/6">
    <label className="text-sm text-gray-600 mb-1">Status</label>
    <select
      className="p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
      value={statusFilter}
  onChange={onStatusChange}
    >
      <option value="all">All</option>
      <option value="pending">Pending</option>
      <option value="in process">In Process</option>
      <option value="processed">Processed</option>
    </select>
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


  {/* Clear Filters Button */}
  <div className="flex flex-col justify-end">
    <label className="invisible text-sm mb-1">Clear</label>
    <button
      onClick={() => {
        setSearchTerm("");
        setStartDate("");
        setEndDate("");
        setStatusFilter("all");
        setSortOrder("newest"); // ✅ Reset sort too
      }}
      className="px-4 py-3 cursor-pointer bg-red-500 text-white rounded-lg shadow hover:bg-red-600 transition"
    >
      ✖ Clear Filters
    </button>
  </div>
</div>


        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="w-12 h-12 border-4 border-blue-400 border-dashed rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-300 shadow-lg rounded-lg overflow-hidden">
              <thead>
                <tr className="bg-gray-100 text-gray-600">
                  <th className="px-6 py-4 text-left font-medium">Order ID</th>
                  <th className="px-6 py-4 text-left font-medium">Date of Order</th>
                  <th className="px-6 py-4 text-left font-medium">
                    Client Name
                  </th>
                  <th className="px-6 py-4 text-left font-medium">PO</th>
                  <th className="px-6 py-4 text-left font-medium">
                    Product Name
                  </th>
                  <th className="px-6 py-4 text-left font-medium">Quantity</th>
                  <th className="px-6 py-4 text-left font-medium">Slip</th>

                 
                  <th className="px-6 py-4 text-left font-medium">
                    Production Status
                  </th>
                  <th className="px-6 py-4 text-left font-medium">Actions</th>
                                      <th className="px-4 py-3">Delete This order from here</th>

                </tr>
              </thead>
             <tbody>
  {currentOrders.map((order, index) => (
    <tr key={order._id} className="table-row capitalize">
                    <td className="px-6 py-4">{order.shortId}</td>
                    <td className="px-6 py-4">
  <div className="text-xs text-gray-500">
    {new Date(order.createdAt).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })}
  </div>
</td>

                    <td className="px-6 py-4">{order.customerName}</td>
                    <td className="px-6 py-4">{order.po}</td>
 <td className="px-4 py-2 text-blue-600 underline cursor-pointer">
  <button
    onClick={() => {
      const product = products.find((p) => p.name === order.product);
      if (product?.images?.length > 0) {
        setActiveProductImage({
          name: product.name,
          images: product.images,
        });
      } else {
        Swal.fire({
          icon: "info",
          title: "No Image",
          text: "No images available for this product.",
        });
      }
    }}
  >
    {order.product}
  </button>
</td>       
{editModalOpen && selectedOrderForEdit && (
  <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center p-6">
    <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      <h2 className="text-2xl font-bold mb-4">
        Edit {editType === 'shape' ? 'Shape' : 'Dana'} Slip for Order {selectedOrderForEdit.shortId}
      </h2>
      
      <EditSlipForm
        order={selectedOrderForEdit}
        type={editType}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedOrderForEdit(null);
          setEditType(null);
        }}
        onSave={handleSaveEditedSlip}
      />
    </div>
  </div>
)}             
<td className="px-6 py-4">{order.quantity}</td>
                   <td className="px-6 py-4 space-y-1">
  {order.shapeSlip?.url && (
    <a
      href={order.shapeSlip.url}
      download
      className="text-green-600 underline block"
    >
      🏭 Shape Slip
    </a>
  )}
  {order.danaSlip?.url && (
    <a
      href={order.danaSlip.url}
      download
      className="text-blue-600 underline block"
    >
      🧪 Dana Slip
    </a>
  )}
</td>


                   
                   <td className="px-6 py-4 flex items-center">
 {order.status === "cancelled" ? (
  <span className="text-red-600 font-semibold">
    🚫 Order cancelled, not to be processed!
  </span>
) : order.status === "completed" ? (
  <span className="text-green-600 font-semibold">
    ✅ Order completed!
  </span>
) : (
  <>
    {order.status}
    <span
      className={`w-3 h-3 rounded-full ml-2 ${
        order.status?.trim().toLowerCase() === "pending"
          ? "bg-orange-500"
          : order.status?.trim().toLowerCase() === "in process"
          ? "bg-yellow-500"
          : order.status?.trim().toLowerCase() === "processed"
          ? "bg-green-500"
          : order.status?.trim().toLowerCase() === "completed"
          ? "bg-green-700"
          : "bg-gray-400"
      }`}
    />
  </>
)}

</td>

                  <td className="px-6 py-4">
  <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
 <select
  value={order.status}
  onChange={(e) => handleStatusChange(order._id, e.target.value)}
  disabled={order.status === "cancelled" || order.status === "completed"} // 🚫 disable for cancelled & completed
  className={`border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition ${
    order.status === "cancelled" || order.status === "completed"
      ? "bg-gray-100 cursor-not-allowed"
      : ""
  }`}
>
  <option value="pending">Pending</option>
  <option value="in process">In Process</option>
  <option value="processed">Processed</option>
  <option value="completed" disabled>Completed</option>
</select>

  </div>
</td>

                                       <td className="px-6 py-4 flex items-center">
  {/* 🗑 Delete Slip Button */}
  <button
    className="mt-2 sm:mt-0 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-md text-sm"
    onClick={() => handleRemoveFromProduction(order)}
  >
    🗑 Remove from Production
  </button>
  
  {/* ✏️ Edit Slip Button */}
  <button
    className="mt-2 sm:mt-0 ml-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md text-sm"
    onClick={() => handleEditSlip(order)}
  >
    ✏️ Edit Slip
  </button>
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
        )}

        {!loading && currentOrders.length > 0 && (
          <div className="flex justify-center items-center gap-4 mt-6">
           <button
  onClick={() => handlePageChange(currentPage - 1)}
  disabled={currentPage === 1}
  className={`px-4 py-2 rounded-md font-medium shadow-md ${
    currentPage === 1
      ? "bg-gray-300 text-gray-600 cursor-not-allowed"
      : "bg-blue-500 text-white hover:bg-blue-600"
  }`}
>
  Previous
</button>

<span className="text-gray-700 font-medium">
  Page {currentPage} of {totalPages}
</span>

<button
  onClick={() => handlePageChange(currentPage + 1)}
  disabled={currentPage === totalPages}
  className={`px-4 py-2 rounded-md font-medium shadow-md ${
    currentPage === totalPages
      ? "bg-gray-300 text-gray-600 cursor-not-allowed"
      : "bg-blue-500 text-white hover:bg-blue-600"
  }`}
>
  Next
</button>

          </div>
        )}
      </div>
    </>
  );
};

export default ProductionDashboard;
