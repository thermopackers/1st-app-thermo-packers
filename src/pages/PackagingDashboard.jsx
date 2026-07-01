import React, { useState, useEffect, useRef } from "react";
import axiosInstance from "../axiosInstance";
import gsap from "gsap";
import Swal from "sweetalert2";
import { NavLink, useSearchParams } from "react-router-dom";
import InternalNavbar from "../components/InternalNavbar";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useUserContext } from "../context/UserContext";
import EditPackagingSlipForm from "../components/EditPackagingSlipForm";

const PackagingDashboard = () => {
  // Helper function to parse roles properly
const parseUserRoles = (user) => {
  if (!user || !user.role) {
    return [];
  }
  
  let userRoles = [];
  
  // Case 1: Already a proper array (your current format)
  if (Array.isArray(user.role)) {
    // Check if it's an array of strings (new format)
    if (user.role.length > 0 && typeof user.role[0] === 'string') {
      // If it's a JSON string inside array (old format)
      if (user.role[0].startsWith('[')) {
        try {
          userRoles = JSON.parse(user.role[0]);
        } catch (parseError) {
          userRoles = user.role;
        }
      } else {
        // It's already a proper array of role strings (new format)
        userRoles = user.role;
      }
    } else {
      userRoles = user.role;
    }
  } 
  // Case 2: String that might be JSON
  else if (typeof user.role === 'string') {
    try {
      userRoles = JSON.parse(user.role);
    } catch (parseError) {
      userRoles = [user.role];
    }
  } 
  // Case 3: Single value
  else {
    userRoles = [user.role];
  }
  
  // Ensure we always return an array
  return Array.isArray(userRoles) ? userRoles : [userRoles];
};
  const { user } = useUserContext();
  const [orders, setOrders] = useState([]);
                       const baseUrl = import.meta.env.VITE_REACT_APP_API_URL;
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [totalPages, setTotalPages] = useState(1);
    const [products, setProducts] = useState([]);
      const [activeProductImage, setActiveProductImage] = useState(null);
const [sortOrder, setSortOrder] = useState("newest");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
const [searchParams, setSearchParams] = useSearchParams();
const currentPage = parseInt(searchParams.get("page")) || 1;
  const [loading, setLoading] = useState(true);
  const [filterLoading, setFilterLoading] = useState(false); // ✅ NEW
  const ordersPerPage = 5;
  const cardsRef = useRef([]);
  const navigate = useNavigate();
  const orderContainerRef = useRef(null);
 const [editModalOpen, setEditModalOpen] = useState(false);
const [selectedOrderForEdit, setSelectedOrderForEdit] = useState(null);
  // ✅ Add userRoles declaration
  const userRoles = user ? parseUserRoles(user) : [];

   // Check if user has access to packaging dashboard
  useEffect(() => {
    if (user && !userRoles.some(role => ["packaging", "accounts", "admin", "production"].includes(role))) {
      Swal.fire({
        title: "Access Denied",
        text: "You don't have permission to access the Packaging Dashboard",
        icon: "error",
        confirmButtonText: "OK"
      }).then(() => {
        navigate("/dashboard");
      });
    }
  }, [user, userRoles, navigate]);

  // If no user or unauthorized, show loading
  if (!user || !userRoles.some(role => ["packaging", "accounts", "admin", "production"].includes(role))) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-purple-300 border-t-purple-600 rounded-full animate-spin"></div>
          <p className="text-purple-700 font-medium">Loading...</p>
        </div>
      </div>
    );
  }
  const groupOrdersByPO = (orders) => {
    return orders.reduce((groups, order) => {
      const po = order.po || "N/A";
      if (!groups[po]) groups[po] = [];
      groups[po].push(order);
      return groups;
    }, {});
  };
useEffect(() => {
  setSearchParams({
    page: 1,
   
  });
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
      const res = await axiosInstance.get("/orders", {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          page: currentPage,
          limit: ordersPerPage,
          startDate,
          endDate,
            search: searchTerm, // ✅ send search to backend
  packagingStatus: statusFilter,   // send packagingStatus filter here
    readyForPackaging: true,  
      sort: sortOrder, // ✅ add this
        },
      });

      // ✅ Use res.data.orders
    let ready = res.data.orders
  .filter((order) => order.readyForPackaging && order.status !== "cancelled");

if (statusFilter) {
  ready = ready.filter((order) => order.packagingStatus === statusFilter);
}

setOrders(ready);
setFilteredOrders(ready);

      setTotalPages(res.data.totalPages); // ✅ Set from backend
    } catch (err) {
      console.error("Failed to fetch packaging orders:", err);
      setOrders([]);
    } finally {
      setFilterLoading(false);
      setLoading(false);
    }
  };

  fetchOrders();
}, [statusFilter, startDate, endDate, currentPage,searchTerm,sortOrder]);


  useEffect(() => {
    gsap.from(orderContainerRef.current, {
      opacity: 0,
      y: 20,
      duration: 0.6,
      ease: "power2.out",
    });
  }, []);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const token = localStorage.getItem("token");
      await axiosInstance.put(
        `/orders/packaging-status/${orderId}`,
        { packagingStatus: newStatus },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setOrders((prev) =>
        prev.map((order) =>
          order._id === orderId ? { ...order, packagingStatus: newStatus } : order
        )
      );
      setFilteredOrders((prev) =>
  prev.map((order) =>
    order._id === orderId ? { ...order, packagingStatus: newStatus } : order
  )
);
      toast.success(`Status set to ${newStatus}`);
    } catch (error) {
  console.error("Failed to update packaging status:", error.response?.data || error.message);
  toast.error("Failed to update packaging status.");
}
  };

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


const currentOrders = filteredOrders;


const handlePageChange = (page) => {
  if (page >= 1 && page <= totalPages) {
    setSearchParams({ page });
  }
};

const handleProductionStatusChange = async (orderId, newStatus) => {
  try {
    const token = localStorage.getItem("token");
    await axiosInstance.put(
      `/orders/${orderId}/status`,
      { status: newStatus },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

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

    toast.success(`Production status set to ${newStatus}`);
  } catch (error) {
    console.error("Failed to update production status:", error);
    toast.error("Failed to update production status.");
  }
};

const handleDeleteFromPackaging = async (orderId) => {
  const confirm = await Swal.fire({
    title: "Are you sure?",
    text: "This will delete the Packaging Slip and remove the order from this dashboard (but not from main Order List).",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Yes, delete it",
    cancelButtonText: "Cancel",
  });

  if (confirm.isConfirmed) {
    try {
      const token = localStorage.getItem("token");
      await axiosInstance.delete(`/orders/remove-packaging/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // ✅ Frontend: remove the order from dashboard view
      setOrders((prev) => prev.filter((o) => o._id !== orderId));
      setFilteredOrders((prev) => prev.filter((o) => o._id !== orderId));

      toast.success("Order removed from Packaging Dashboard.");
    } catch (err) {
      console.error("Error removing from packaging:", err);
      toast.error("Failed to remove order.");
    }
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

  const handleEditSlip = (order) => {
  if (!order.packagingSlip?.url) {
    toast.error("No packaging slip found for editing");
    return;
  }
  
  setSelectedOrderForEdit(order);
  setEditModalOpen(true);
};

const handleSaveEditedSlip = async (orderId, formData) => {
  try {
    setLoading(true);
    
    const response = await axiosInstance.put(
      `/orders/${orderId}/edit-packaging-slip`,
      formData,
      {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      }
    );

    toast.success("Packaging slip updated successfully!");
    setEditModalOpen(false);
    setSelectedOrderForEdit(null);
    
    // Refresh the orders list
    const token = localStorage.getItem("token");
    const res = await axiosInstance.get("/orders", {
      headers: { Authorization: `Bearer ${token}` },
      params: {
        page: currentPage,
        limit: ordersPerPage,
        startDate,
        endDate,
        search: searchTerm,
        packagingStatus: statusFilter,
        readyForPackaging: true,
        sort: sortOrder,
      },
    });

    let ready = res.data.orders
      .filter((order) => order.readyForPackaging && order.status !== "cancelled");

    if (statusFilter) {
      ready = ready.filter((order) => order.packagingStatus === statusFilter);
    }

    setOrders(ready);
    setFilteredOrders(ready);
    
  } catch (err) {
    console.error("Error editing packaging slip", err);
    toast.error("Failed to update packaging slip");
  } finally {
    setLoading(false);
  }
};

// Helper function to render delivery time
const renderDeliveryTime = (order) => {
  if (!order.date) return "N/A";
  
  const today = new Date();
  const deliveryDate = new Date(order.date);
  today.setHours(0, 0, 0, 0);
  deliveryDate.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((deliveryDate - today) / (1000 * 60 * 60 * 24));
  
  const deliveryOption = order.deliveryOption;
  
  if (deliveryOption === "1week") {
    return (
      <div>
        <span className="font-medium text-blue-600">Within 1 Week</span>
        <br />
        <span className="text-xs text-gray-500">
          By: {deliveryDate.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
        </span>
      </div>
    );
  }
  
  if (deliveryOption === "2weeks") {
    return (
      <div>
        <span className="font-medium text-blue-600">Within 2 Weeks</span>
        <br />
        <span className="text-xs text-gray-500">
          By: {deliveryDate.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
        </span>
      </div>
    );
  }
  
  if (deliveryOption === "particular") {
    return (
      <div>
        <span className="font-medium text-green-600">Particular Date</span>
        <br />
        <span className="text-xs text-gray-700 font-medium">
          {deliveryDate.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "long",
            year: "numeric",
          })}
        </span>
      </div>
    );
  }
  
  if (diffDays <= 7) return "Within 1 Week";
  if (diffDays <= 14) return "Within 2 Weeks";
  if (diffDays <= 20) return "Within 20 Days";
  
  return deliveryDate.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

// Helper function to render narration images
const renderNarrationImages = (order) => {
  const hasOrderImages = order.narrationImages && order.narrationImages.length > 0;
  const hasProductImages = order.products && order.products.some(p => p.narrationImages && p.narrationImages.length > 0);
  
  if (!hasOrderImages && !hasProductImages) {
    return <span className="text-gray-400 text-xs">No images</span>;
  }
  
  // Collect all images from order level and product level
  const allImages = [];
  
  // Add order level narration images
  if (order.narrationImages && order.narrationImages.length > 0) {
    order.narrationImages.forEach(img => {
      allImages.push({ url: img, type: 'order', label: 'Order Narration' });
    });
  }
  
  // Add product level narration images
  if (order.products && order.products.length > 0) {
    order.products.forEach(product => {
      if (product.narrationImages && product.narrationImages.length > 0) {
        product.narrationImages.forEach(img => {
          allImages.push({ 
            url: img, 
            type: 'product', 
            label: product.productName 
          });
        });
      }
    });
  }
  
  // Show first 3 images with preview on click
  const displayImages = allImages.slice(0, 3);
  const remainingCount = allImages.length - 3;
  
  return (
    <div className="flex flex-wrap gap-2">
      {displayImages.map((img, idx) => (
        <img
          key={idx}
          src={img.url}
          alt={`Narration ${idx + 1}`}
          className="w-12 h-12 object-cover rounded cursor-pointer border border-gray-300 hover:border-blue-500 transition-all"
          onClick={() => {
            Swal.fire({
              title: img.type === 'order' ? 'Order Narration Image' : `Product: ${img.label}`,
              html: `<img src="${img.url}" class="max-w-full max-h-96 mx-auto rounded-lg shadow-lg" style="max-height: 70vh; object-fit: contain;" />`,
              showCloseButton: true,
              showConfirmButton: false,
              width: 'auto',
              padding: '20px',
              background: '#f8fafc'
            });
          }}
        />
      ))}
      {remainingCount > 0 && (
        <div 
          className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center cursor-pointer hover:bg-gray-200 border border-gray-300"
          onClick={() => {
            // Show all images in a grid
            Swal.fire({
              title: `Narration Images (${allImages.length})`,
              html: `
                <div class="grid grid-cols-3 gap-4 max-h-96 overflow-y-auto p-4">
                  ${allImages.map(img => `
                    <div class="text-center">
                      <img src="${img.url}" class="w-full h-32 object-cover rounded cursor-pointer" onclick="window.open('${img.url}', '_blank')" />
                      <p class="text-xs mt-1 truncate max-w-[100px]">${img.type === 'order' ? 'Order' : img.label}</p>
                    </div>
                  `).join('')}
                </div>
              `,
              showCloseButton: true,
              showConfirmButton: false,
              width: '700px',
              background: '#f8fafc'
            });
          }}
          title={`${remainingCount} more images`}
        >
          <span className="text-xs font-medium">+{remainingCount}</span>
        </div>
      )}
    </div>
  );
};

// ✅ Helper: Check if packaging slip has products
const hasPackagingSlipProducts = (order) => {
  return order.packagingSlip?.products && order.packagingSlip.products.length > 0;
};

// ✅ Helper: Get product details from packaging slip if available
const getProductDetailsFromSlip = (order) => {
  // First check if packaging slip has products
  if (hasPackagingSlipProducts(order)) {
    return order.packagingSlip.products.map(p => ({
      name: p.productName,
      quantity: p.quantity,
      packagingWeight: p.packagingWeight || "N/A",
      packagingType: p.packagingType || "N/A",
      remarks: p.remarks || ""
    }));
  }
  
  // Fallback to order products
  if (order.products && order.products.length > 0) {
    return order.products.map(p => ({
      name: p.productName,
      quantity: p.quantity,
      size: p.size || "N/A",
      density: p.density || "N/A",
      remarks: p.productRemarks || ""
    }));
  }
  
  // Single product fallback
  return [{
    name: order.product,
    quantity: order.quantity,
    size: order.size || "N/A",
    density: order.density || "N/A",
    remarks: order.remarks || ""
  }];
};

// ✅ Helper: Get total quantity from packaging slip if available
const getTotalQuantityFromSlip = (order) => {
  if (hasPackagingSlipProducts(order)) {
    return order.packagingSlip.products.reduce((sum, p) => sum + (parseInt(p.quantity) || 0), 0);
  }
  
  if (order.products && order.products.length > 0) {
    return order.products.reduce((sum, p) => sum + (parseInt(p.quantity) || 0), 0);
  }
  return order.quantity;
};

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
EPS/Thermocol Shape Molding Packaging & Dispatch Section        </h2>
  <div className="flex justify-center mb-6">
      <NavLink to="/reports/packaging">
        <button className="bg-fuchsia-500 hover:bg-fuchsia-600 text-white px-4 py-2 rounded-lg transition-all shadow-lg">
          Daily Shape Moulding Section, Packaging & Dispatch Report
        </button>
      </NavLink>
    </div>



        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
          <div className="flex flex-col">
            <label className="mb-1 text-sm font-medium text-gray-700">Packaging Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="" >Select</option>
              <option value="unpackaged">Unpackaged</option>
              <option value="packaged">Packaged</option>
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

        {/* 🟣 Filter loading spinner */}
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
                      <th className="px-4 py-3">Size</th>
                      <th className="px-4 py-3">Quantity</th>
                                                    <th className="px-4 py-3">Delivery Time(Material required by Customer on Date?)</th>  {/* NEW COLUMN */}
                      <th className="px-4 py-3">Remarks</th>
                          <th className="px-6 py-4 text-left font-medium">Narration Images</th>  {/* NEW COLUMN */}
                      <th className="px-4 py-3">Slip</th>
                      <th className="px-4 py-3">Production Status</th>
                      <th className="px-4 py-3">Packaging Status</th>
                      <th className="px-4 py-3">Update Packaging Status</th>
                      <th className="px-4 py-3">Dispatch Status</th>
                      <th className="px-4 py-3">Update Dispatch Status</th>
                      <th className="px-4 py-3">Delete This order from here</th>
                    </tr>
                  </thead>
                <tbody className="bg-white divide-y divide-gray-200">
  {currentOrders.map((order, index) => {
    // Helper to check multi-product
    const hasMultipleProducts = order.products && order.products.length > 0;
    const productList = hasMultipleProducts ? order.products : [{
      productName: order.product,
      quantity: order.quantity,
      size: order.size,
      density: order.density,
      productRemarks: order.productRemarks
    }];
    const totalQuantity = hasMultipleProducts 
      ? productList.reduce((sum, p) => sum + (parseInt(p.quantity) || 0), 0)
      : order.quantity;

    return (
      <tr
        key={order._id}
        ref={(el) => (cardsRef.current[index] = el)}
        className="hover:bg-gray-50 transition duration-150"
      >
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

       {/* Product - From packaging slip if available */}
<td className="px-4 py-2">
  {(() => {
    const productList = getProductDetailsFromSlip(order);
    const isMulti = productList.length > 1;
    
    if (!isMulti) {
      const p = productList[0];
      return (
        <button
          onClick={() => {
            const product = products.find((prod) => prod.name === p.name);
            if (product?.images?.length > 0) {
              setActiveProductImage({ name: p.name, images: product.images });
            } else {
              Swal.fire({ icon: "info", title: "No Image", text: "No images available for this product." });
            }
          }}
          className="text-blue-600 underline cursor-pointer"
        >
          {p.name}
        </button>
      );
    }
    
    return (
      <div className="space-y-1">
        {productList.map((p, idx) => (
          <div key={idx} className="border-b border-gray-200 pb-1 last:border-0">
            <button
              onClick={() => {
                const product = products.find((prod) => prod.name === p.name);
                if (product?.images?.length > 0) {
                  setActiveProductImage({ name: p.name, images: product.images });
                } else {
                  Swal.fire({ icon: "info", title: "No Image", text: "No images available for this product." });
                }
              }}
              className="text-blue-600 underline cursor-pointer text-left text-sm"
            >
              {p.name}
            </button>
            <div className="text-xs text-gray-500 mt-0.5">
              Qty: {p.quantity} 
              {p.packagingWeight && p.packagingWeight !== "N/A" && ` | Weight: ${p.packagingWeight}`}
              {p.packagingType && p.packagingType !== "N/A" && ` | Type: ${p.packagingType}`}
              {p.remarks && <span className="ml-2 text-purple-600">| Note: {p.remarks}</span>}
            </div>
          </div>
        ))}
      </div>
    );
  })()}
</td>

       {/* Size - From packaging slip if available */}
<td className="px-4 py-3">
  {(() => {
    const productList = getProductDetailsFromSlip(order);
    if (productList.length > 1) {
      return (
        <div className="space-y-1 text-xs">
          {productList.map((p, idx) => (
            <div key={idx}>
              {p.size || (p.packagingType && p.packagingType !== "N/A" ? p.packagingType : "N/A")}
            </div>
          ))}
        </div>
      );
    }
    const p = productList[0];
    return p?.size || p?.packagingType || order.size || "N/A";
  })()}
</td>
{/* Quantity - From packaging slip if available */}
<td className="px-4 py-3">
  {(() => {
    const productList = getProductDetailsFromSlip(order);
    const isMulti = productList.length > 1;
    
    if (isMulti) {
      return (
        <div>
          <div className="space-y-1">
            {productList.map((p, idx) => (
              <div key={idx} className="text-xs">
                <span className="font-medium">{p.name}:</span>{' '}
                <span className="bg-blue-100 px-2 py-0.5 rounded">
                  {parseFloat(p.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-1 pt-1 border-t border-gray-200">
            <span className="font-bold text-blue-600">
              Total: {getTotalQuantityFromSlip(order)}
            </span>
          </div>
        </div>
      );
    }
    
    return (
      <span className="bg-blue-100 px-2 py-0.5 rounded">
        {parseFloat(productList[0]?.quantity || 0).toFixed(2)}
      </span>
    );
  })()}
</td>

         {/* ✅ Delivery Time - NEW COLUMN */}
        <td className="px-4 py-2">
          {renderDeliveryTime(order)}
        </td>

       {/* Remarks - From packaging slip if available */}
<td className="px-4 py-3">
  {(() => {
    const productList = getProductDetailsFromSlip(order);
    const slipRemarks = order.packagingSlip?.slipRemarks || order.packagingSlip?.remarks;
    
    // Show slip-level remarks if they exist
    if (slipRemarks) {
      return (
        <div>
          <div className="text-sm font-medium text-purple-700">{slipRemarks}</div>
          {productList.length > 1 && (
            <div className="text-xs text-gray-500 mt-1 space-y-1">
              {productList.map((p, idx) => p.remarks && (
                <div key={idx}>
                  <strong>{p.name}:</strong> {p.remarks}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }
    
    // Fallback to product-level remarks
    if (productList.length > 1) {
      const hasRemarks = productList.some(p => p.remarks);
      if (hasRemarks) {
        return (
          <div className="space-y-1 text-xs">
            {productList.map((p, idx) => p.remarks && (
              <div key={idx}><strong>{p.name}:</strong> {p.remarks}</div>
            ))}
          </div>
        );
      }
      return <span className="text-gray-400">-</span>;
    }
    
    return productList[0]?.remarks || order.remarks || "-";
  })()}
</td>

          {/* ✅ Narration Images - NEW COLUMN */}
      <td className="px-6 py-4">
        {renderNarrationImages(order)}
      </td>

        {/* Slip */}
        <td className="px-4 py-3">
          {order.packagingSlip?.url && (
            <a href={order.packagingSlip.url} download className="text-purple-600 underline">
              📦 Download Slip
            </a>
          )}
        </td>

        {/* Production Status */}
        <td className="px-4 py-2 whitespace-nowrap">
          {order.status === "cancelled" ? (
            <span className="text-red-600 font-semibold">🚫 Order cancelled, not to be processed!</span>
          ) : order.status === "completed" ? (
            <span className="text-green-600 font-semibold">✅ Order completed!</span>
          ) : (
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${
                  order.status?.toLowerCase() === "pending" ? "bg-orange-500" :
                  order.status?.toLowerCase() === "in process" ? "bg-yellow-500" :
                  order.status?.toLowerCase() === "processed" ? "bg-green-500" : "bg-gray-400"
                }`}></span>
                <span className="capitalize">
                  {order.shapeSlip ? order.status || "Unknown" : "Direct Dispatch"}
                </span>
              </div>
              {order.shapeSlip && (
                <select
                  value={order.status || ""}
                  onChange={(e) => handleProductionStatusChange(order._id, e.target.value)}
                  disabled={order.status === "completed"}
                  className={`mt-1 border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring focus:ring-purple-300 ${
                    order.status === "completed" ? "bg-gray-100 cursor-not-allowed" : ""
                  }`}
                >
                  <option value="" disabled>Change Status</option>
                  <option value="pending">Pending</option>
                  <option value="in process">In Process</option>
                  <option value="processed">Processed</option>
                  <option value="completed" disabled>Completed</option>
                </select>
              )}
            </div>
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
              order.packagingStatus === "packaged" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
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
              onChange={(e) => handleStatusChange(order._id, e.target.value)}
              className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring focus:ring-purple-300"
            >
              <option value="" disabled>Select Status</option>
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
              order.dispatchStatus === "dispatched" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
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
              value={order.dispatchStatus || ""}
              onChange={(e) => handleDispatchStatusChange(order._id, e.target.value)}
              className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring focus:ring-purple-300"
            >
              <option value="not dispatched">Not Dispatched</option>
              <option value="ready to dispatch">Ready To Dispatch</option>
              <option value="dispatched">Dispatched</option>
            </select>
          )}
        </td>

        {/* Actions - Delete & Edit */}
        <td className="px-4 py-3">
          <div className="flex flex-col space-y-2">
            <button
              onClick={() => handleDeleteFromPackaging(order._id)}
              className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs"
            >
              ❌ Delete
            </button>
            {order.packagingSlip?.url && (
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
    );
  })}
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
        Edit Packaging Slip for Order {selectedOrderForEdit.shortId}
      </h2>
      
      <EditPackagingSlipForm
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

export default PackagingDashboard;
