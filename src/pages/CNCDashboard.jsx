// CNC Dashboard.jsx
import React, { useState, useEffect } from "react";
import axiosInstance from "../axiosInstance";
import Swal from "sweetalert2";
import InternalNavbar from "../components/InternalNavbar";
import { NavLink, useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { useUserContext } from "../context/UserContext";

const CNCDashboard = () => {
  const { setShouldRefetchOrders } = useUserContext();
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");
      const [activeProductImage, setActiveProductImage] = useState(null);
  const [endDate, setEndDate] = useState("");
    const [products, setProducts] = useState([]);
  const [cncStatus, setCncStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [filterLoading, setFilterLoading] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [totalPages, setTotalPages] = useState(1);
  const currentPage = parseInt(searchParams.get("page")) || 1;
  const navigate = useNavigate();

  const ordersPerPage = 10;
 useEffect(() => {
    axiosInstance
      .get("/products/all-backend-products")
      .then((res) => setProducts(res.data))
      .catch((err) => console.error("Error fetching products:", err));
  }, []);
useEffect(() => {
  // Instead of resetting the page silently,
  // reset it only if the current page is NOT 1.
  if (currentPage !== 1) {
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      params.set("page", 1);
      return params;
    });
  }
}, [searchTerm, startDate, endDate]);

  useEffect(() => {
    const fetchOrders = async () => {
      setFilterLoading(true);
      try {
       const res = await axiosInstance.get("/orders/cnc-orders", {
  params: {
    page: currentPage,
    limit: ordersPerPage,
    search: searchTerm,
    startDate,
    endDate,
    sort: sortOrder,
      cncStatus, // ✅ include this
  },
});

       setOrders(res.data.orders);

        setTotalPages(res.data.totalPages);
      } catch (err) {
        console.error("Failed to fetch CNC orders:", err);
      } finally {
        setFilterLoading(false);
        setLoading(false);
      }
    };

    fetchOrders();
  }, [searchTerm, startDate, endDate, currentPage,sortOrder,cncStatus]);
const updateCNCStatus = async (orderId, newStatus) => {
  try {
    await axiosInstance.put(`/orders/${orderId}/status`, {
      status: newStatus,
    });
    setOrders((prev) =>
      prev.map((o) =>
        o._id === orderId ? { ...o, status: newStatus } : o
      )
    );
    toast.success("CNC status updated successfully");
  } catch (err) {
    toast.error("Failed to update CNC status");
    console.error("Failed to update CNC status:", err);
  }
};

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setSearchParams({ page });
    }
  };

  const handleDeleteCNC = async (orderId) => {
  const confirm = await Swal.fire({
    title: "Are you sure?",
    text: "This will remove the order from CNC Dashboard (not from main Order List).",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Yes, remove",
    cancelButtonText: "Cancel",
  });

  if (confirm.isConfirmed) {
    try {
      const token = localStorage.getItem("token");
      await axiosInstance.delete(`/orders/remove-from-cnc/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setOrders((prev) => prev.filter((o) => o._id !== orderId));
      toast.success("Order removed from CNC Dashboard.");
      setShouldRefetchOrders(true); // 👈 this will trigger OrderList to refresh
    } catch (err) {
      console.error("Error deleting CNC entry:", err);
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

  return (
    <>
      <InternalNavbar />
      <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
        <button
          className="absolute left-4 hidden md:block bg-purple-500 text-white px-4 py-2 rounded-md shadow-md hover:bg-purple-600"
          onClick={() => navigate(-1)}
        >
          ↩ Back
        </button>

        <h2 className="text-3xl md:text-4xl font-bold mb-6 text-center text-black">
          EPS / Thermocol CNC Hot Wire/CNC Router Dashboard
        </h2>

        <div className="flex flex-wrap items-end gap-4 mb-6">
          <div className="flex flex-col">
            <label className="text-sm font-medium">Start Date:</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="p-2 border border-gray-300 rounded"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-sm font-medium">End Date:</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="p-2 border border-gray-300 rounded"
            />
          </div>
          <div className="flex flex-col w-full md:w-1/3">
            <label className="text-sm font-medium">Search:</label>
            <input
              type="text"
              placeholder="Search by product, PO, customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="p-2 border border-gray-300 rounded"
            />
          </div>
          <div className="flex flex-col">
  <label className="text-sm font-medium">Sort Order:</label>
  <select
    value={sortOrder}
    onChange={(e) => setSortOrder(e.target.value)}
    className="p-2 border border-gray-300 rounded"
  >
    <option value="newest">Newest First</option>
    <option value="oldest">Oldest First</option>
  </select>
</div>
<select
  value={cncStatus}
  onChange={(e) => setCncStatus(e.target.value)}
  className="p-2 border border-gray-300 rounded"
>
  <option value="">All</option>
  <option value="pending">Pending</option>
  <option value="in process">In Process</option>
  <option value="processed">Processed</option>
</select>

          <button
            onClick={() => {
              setSearchTerm("");
              setStartDate("");
              setEndDate("");
                setSortOrder("newest");
                    setCncStatus(""); // ✅ Add this to clear CNC status filter
            }}
            className="bg-red-500 text-white px-4 py-2 rounded shadow hover:bg-red-600"
          >
            Clear Filters
          </button>
        </div>

        {filterLoading ? (
          <div className="text-center text-purple-600">Filtering...</div>
        ) : orders.length === 0 ? (
          <div className="text-center text-gray-500">No orders found</div>
        ) : (
          <div className="overflow-x-auto bg-white rounded shadow">
            <table className="min-w-full text-sm text-left border">
             <thead className="bg-blue-100 text-gray-700 text-xs uppercase">
  <tr>
    <th className="px-4 py-3">Order ID</th>
    <th className="px-4 py-3">Customer Name</th>
    <th className="px-4 py-3">PO</th>
    <th className="px-4 py-3">Product Name</th>
    <th className="px-4 py-3">Size</th>
    <th className="px-4 py-3">Quantity</th>
    <th className="px-4 py-3">Remarks</th>
    <th className="px-4 py-3">Slip</th>
    <th className="px-4 py-3">Status</th>
    <th className="px-4 py-3">CNC Status</th>
                      <th className="px-4 py-3">Delete This order from here</th>
  </tr>
</thead>
              <tbody>
                {orders.map((order) => (
                 <tr key={order._id} className="hover:bg-gray-50 transition duration-150">
  <td className="px-4 py-2">{order.shortId}</td>
  <td className="px-4 py-2 capitalize">{order.customerName}</td>
  <td className="px-4 py-2 capitalize">{order.po}</td>
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
  <td className="px-4 py-2">{order.size}</td>
  <td className="px-4 py-2">{order.quantity}</td>
  <td className="px-4 py-2">{order.remarks}</td>
  <td className="px-4 py-2">
    {order.cncSlip?.url && (
      <a
        href={order.cncSlip.url}
        download
        className="text-blue-600 underline"
      >
        🧾 Download Slip
      </a>
    )}
  </td>
<td className="px-4 py-2">
  <select
    value={order.status || "pending"}
    onChange={(e) => updateCNCStatus(order._id, e.target.value)}
    className="border border-gray-300 rounded px-2 py-1 text-sm"
  >
    <option value="pending">Pending</option>
    <option value="in process">In Process</option>
    <option value="processed">Processed</option>
  </select>
</td>
<td className="px-4 py-2 whitespace-nowrap">
  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
    order.status === "processed"
      ? "bg-green-100 text-green-700"
      : order.status === "in process"
      ? "bg-yellow-100 text-yellow-700"
      : "bg-red-100 text-red-700"
  }`}>
    {order.status || "pending"}
  </span>
</td>
<td className="px-4 py-2">
  <button
    onClick={() => handleDeleteCNC(order._id)}
    className="text-red-600 hover:text-red-800 underline"
  >
    ❌ Delete
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

        {orders.length > 0 && (
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
      </div>
    </>
  );
};

export default CNCDashboard;
