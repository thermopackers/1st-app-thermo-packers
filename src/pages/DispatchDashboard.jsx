import React, { useState, useEffect, useRef } from "react";
import axiosInstance from "../axiosInstance";
import gsap from "gsap";

import InternalNavbar from "../components/InternalNavbar";
import { useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";

const DispatchDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
                       const baseUrl = import.meta.env.VITE_REACT_APP_API_URL;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
const [totalPages, setTotalPages] = useState(1);
const [searchParams, setSearchParams] = useSearchParams();
const currentPage = parseInt(searchParams.get("page")) || 1;
const ordersPerPage = 5;
const handlePageChange = (page) => {
  if (page >= 1 && page <= totalPages) {
    setSearchParams({ page });
        window.scrollTo({ top: 0, behavior: "smooth" }); // ✅ Optional UX boost

  }
};
console.log("ord",orders);

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
}, [currentPage, startDate, endDate, statusFilter, searchTerm]);



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

const currentOrders = filteredOrders; // Already paginated from backend

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
          Packaging & Dispatch Dashboard (Block Moulds)
        </h2>

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

  <div className="flex flex-col self-end">
    <button
      onClick={() => {
        setStatusFilter("");
        setSearchTerm("");
        setStartDate("");
        setEndDate("");
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
                      <th className="px-4 py-3">Customer Name</th>
                      <th className="px-4 py-3">PO</th>
                      <th className="px-4 py-3">Product Name</th>
                      <th className="px-4 py-3">Size</th>
                      <th className="px-4 py-3">Quantity</th>
                      <th className="px-4 py-3">Price</th>
                      <th className="px-4 py-3">Freight</th>
                      <th className="px-4 py-3">Packaging Charge</th>
                      <th className="px-4 py-3">Remarks</th>
                      <th className="px-4 py-3">Slip</th>
                      <th className="px-4 py-3">Production Status</th>
                      <th className="px-4 py-3">Packaging Status</th>
                      <th className="px-4 py-3">Update Packaging Status</th>
                      <th className="px-4 py-3">Dispatch Status</th>
                      <th className="px-4 py-3">Update Dispatch Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {Object.entries(groupOrdersByPO(currentOrders)).map(([poNumber, poOrders], index) => (
                      <React.Fragment key={poNumber}>
                        <tr className={`${index % 2 === 0 ? "bg-blue-100" : "bg-purple-100"}`}>
                          <td colSpan="100%" className="px-4 py-2 font-semibold text-left text-gray-800">
                            📄 <strong>PO:</strong> {poNumber} — {poOrders.length} order{poOrders.length > 1 ? "s" : ""}
                          </td>
                        </tr>
                        {poOrders.map((order) => (
                          <tr key={order._id} className="hover:bg-gray-50 transition duration-150">
                            <td className="px-4 py-3 font-medium">{order.shortId}</td>
                            <td className="px-4 py-3 capitalize">{order.customerName}</td>
                            <td className="px-4 py-3 capitalize">{order.po}</td>
                            <td className="px-4 py-3">{order.product}</td>
                            <td className="px-4 py-3">{order.size}</td>
                            <td className="px-4 py-3">{order.quantity}</td>
                            <td className="px-4 py-3">₹{order.price}</td>
                            <td className="px-4 py-3">{`${order.freight}: ₹${order.freightAmount}`}</td>
                            <td className="px-4 py-3">₹{order.packagingCharge}</td>
                            <td className="px-4 py-3">{order.remarks}</td>
                            <td className="px-4 py-3">
                              {order.cuttingSlip?.url && (
                                <a
                                        href={`${baseUrl}${order.cuttingSlip.url}`}
                                  download
                                  className="text-blue-600 underline"
                                >
                                  📥 Cutting Slip
                                </a>
                              )}
                            </td>
                           
                            <td className="px-4 py-2 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <span className={`w-3 h-3 rounded-full ${
                                  order.status?.toLowerCase() === "pending"
                                    ? "bg-orange-500"
                                    : order.status?.toLowerCase() === "in process"
                                    ? "bg-yellow-500"
                                    : order.status?.toLowerCase() === "processed"
                                    ? "bg-green-500"
                                    : "bg-gray-400"
                                }`}></span>
                                <span className="capitalize">
                                  {order.danaSlip ? order.status || "Unknown" : "Direct Dispatch"}
                                </span>
                              </div>
                            </td>
                             <td className="px-4 py-3">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              order.packagingStatus === "packaged"
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {order.packagingStatus || "Unpackaged"}
                          </span>
                        </td>
                            {/* Packaging Status Dropdown */}
                            <td className="px-4 py-3">
                              <select
                                value={order.packagingStatus || ""}
                                onChange={(e) => handlePackagingStatusChange(order._id, e.target.value)}
                                className="p-2 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                              >
                               <option value="" disabled>Select</option>
              <option value="unpackaged">Unpackaged</option>
              <option value="packaged">Packaged</option>
                              </select>
                            </td>
                             <td className="px-4 py-3">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              order.dispatchStatus === "dispatched"
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {order.dispatchStatus || "not dispatched"}
                          </span>
                        </td>
                            <td className="px-4 py-3">
                              <select
                                value={order.dispatchStatus}
                                onChange={(e) =>
                                  handleDispatchStatusChange(order._id, e.target.value)
                                }
                                className="p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                              >
                                <option value="not dispatched">Not Dispatched</option>
                                <option value="ready to dispatch">Ready to Dispatch</option>
                                <option value="dispatched">Dispatched</option>
                              </select>
                            </td>
                          </tr>
                        ))}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
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
      </div>
    </>
  );
};

export default DispatchDashboard;
