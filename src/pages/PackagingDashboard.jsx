import React, { useState, useEffect, useRef } from "react";
import axiosInstance from "../axiosInstance";
import gsap from "gsap";
import { useSearchParams } from "react-router-dom";
import InternalNavbar from "../components/InternalNavbar";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const PackagingDashboard = () => {
  const [orders, setOrders] = useState([]);
                       const baseUrl = import.meta.env.VITE_REACT_APP_API_URL;
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [totalPages, setTotalPages] = useState(1);
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
console.log("orders",orders);

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
        },
      });

      // ✅ Use res.data.orders
      let ready = res.data.orders.filter((order) => order.readyForPackaging);

      if (statusFilter) {
        ready = ready.filter((order) => order.packagingStatus === statusFilter);
      }

      ready.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

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
}, [statusFilter, startDate, endDate, currentPage,searchTerm]);


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


  const currentOrders = filteredOrders

const handlePageChange = (page) => {
  if (page >= 1 && page <= totalPages) {
    setSearchParams({ page });
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
          className="absolute cursor-pointer left-4 hidden md:block bg-purple-500 text-white px-4 py-2 rounded-md shadow-md hover:bg-purple-600 back-button"
          onClick={() => navigate(-1)}
        >
          ↩️ Back
        </button>

        <h2 className="text-3xl md:text-4xl font-bold mb-6 text-center text-black">
          Packaging & Dispatch Dashboard(Shape Moulds)
        </h2>

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

          <div className="flex md:mt-6 items-center pt-6 md:pt-0">
            <button
              onClick={() => {
                setStatusFilter("");
                setStartDate("");
                setEndDate("");
                setSearchTerm("");
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
                      <th className="px-4 py-3">Customer Name</th>
                      <th className="px-4 py-3">PO</th>
                      <th className="px-4 py-3">Product</th>
                      <th className="px-4 py-3">Size</th>
                      <th className="px-4 py-3">Quantity</th>
                      <th className="px-4 py-3">Price</th>
                      <th className="px-4 py-3">Freight</th>
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
    {/* PO Group Header Row */}
    <tr className={`${index % 2 === 0 ? 'bg-blue-100' : 'bg-purple-100'}`}>
      <td colSpan="100%" className="px-4 py-2 font-semibold text-left text-gray-800">
        📄 <strong>PO:</strong> {poNumber} — {poOrders.length} order{poOrders.length > 1 ? "s" : ""}
      </td>
    </tr>

    {/* Orders under this PO */}
    {poOrders.map((order) => (
     <tr
                        key={order._id}
                        ref={(el) => (cardsRef.current[index] = el)}
                        className="hover:bg-gray-50 transition duration-150"
                      >
                        <td className="px-4 py-3 font-medium">{order.shortId}</td>
                        <td className="px-4 py-3 capitalize">{order.customerName}</td>
                        <td className="px-4 py-3 capitalize">{order.po}</td>
                        <td className="px-4 py-3">{order.product}</td>
                        <td className="px-4 py-3">{order.size}</td>
                        <td className="px-4 py-3">{order.quantity}</td>
                        <td className="px-4 py-3">₹{order.price}</td>
                        <td className="px-4 py-3">{`${order.freight}: ₹${order.freightAmount}`}</td>
                        <td className="px-4 py-3">{order.remarks}</td>
                        <td className="px-4 py-3">
                          {order.packagingSlip?.url && (
                            <a
                                    href={order.packagingSlip.url}
                              download
                              className="text-purple-600 underline"
                            >
                              📦 Download Slip
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
                                  {order.shapeSlip ? order.status || "Unknown" : "Direct Dispatch"}
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
                        <td className="px-4 py-3">
                          <select
                            value={order.packagingStatus || ""}
                            onChange={(e) => handleStatusChange(order._id, e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring focus:ring-purple-300"
                          >
                            <option value="" disabled>Select Status</option>
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
                            value={order.dispatchStatus || ""}
                            onChange={(e) => handleDispatchStatusChange(order._id, e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring focus:ring-purple-300"
                          >
                          <option value="not dispatched">Not Dispatched</option>
                            <option value="ready to dispatch">Ready To Dispatch</option>
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
      </div>
    </>
  );
};

export default PackagingDashboard;
