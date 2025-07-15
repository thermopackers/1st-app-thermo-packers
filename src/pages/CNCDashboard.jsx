// CNC Dashboard.jsx
import React, { useState, useEffect } from "react";
import axiosInstance from "../axiosInstance";
import InternalNavbar from "../components/InternalNavbar";
import { NavLink, useNavigate, useSearchParams } from "react-router-dom";

const CNCDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");
  const [endDate, setEndDate] = useState("");
  const [cncStatus, setCncStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [filterLoading, setFilterLoading] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [totalPages, setTotalPages] = useState(1);
  const currentPage = parseInt(searchParams.get("page")) || 1;
  const navigate = useNavigate();

  const ordersPerPage = 10;

  useEffect(() => {
    setSearchParams({ page: 1 });
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
    await axiosInstance.put(`/orders/cnc-status/${orderId}`, { cncStatus: newStatus });
    setOrders((prev) =>
      prev.map((o) =>
        o._id === orderId ? { ...o, cncStatus: newStatus } : o
      )
    );
  } catch (err) {
    console.error("Failed to update CNC status:", err);
  }
};

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
          className="absolute left-4 hidden md:block bg-purple-500 text-white px-4 py-2 rounded-md shadow-md hover:bg-purple-600"
          onClick={() => navigate(-1)}
        >
          ↩ Back
        </button>

        <h2 className="text-3xl md:text-4xl font-bold mb-6 text-center text-black">
          EPS / Thermocol CNC Hot Wire/CNC Router Dashboard
        </h2>
<div className="flex justify-center my-6">
  <NavLink to="/reports/packaging" className="w-full md:w-auto">
    <button className="px-6 py-3 bg-fuchsia-500 text-white rounded-lg hover:bg-fuchsia-600 transition shadow-lg w-full md:w-auto">
      📋 Daily Shape Moulding, Packaging & Dispatch Report
    </button>
  </NavLink>
</div>

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
    <th className="px-4 py-3">Price</th>
    <th className="px-4 py-3">Freight</th>
    <th className="px-4 py-3">Packaging Charge</th>
    <th className="px-4 py-3">Remarks</th>
    <th className="px-4 py-3">Slip</th>
    <th className="px-4 py-3">Status</th>
    <th className="px-4 py-3">CNC Status</th>
  </tr>
</thead>
              <tbody>
                {orders.map((order) => (
                 <tr key={order._id} className="hover:bg-gray-50 transition duration-150">
  <td className="px-4 py-2">{order.shortId}</td>
  <td className="px-4 py-2 capitalize">{order.customerName}</td>
  <td className="px-4 py-2 capitalize">{order.po}</td>
  <td className="px-4 py-2">{order.product}</td>
  <td className="px-4 py-2">{order.size}</td>
  <td className="px-4 py-2">{order.quantity}</td>
  <td className="px-4 py-2">₹{order.price}</td>
  <td className="px-4 py-2">{`${order.freight}: ₹${order.freightAmount}`}</td>
  <td className="px-4 py-2">₹{order.packagingCharge || "0"}</td>
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
    value={order.cncStatus || "pending"}
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
    order.cncStatus === "processed"
      ? "bg-green-100 text-green-700"
      : order.cncStatus === "in process"
      ? "bg-yellow-100 text-yellow-700"
      : "bg-red-100 text-red-700"
  }`}>
    {order.cncStatus || "pending"}
  </span>
</td>

</tr>

                ))}
              </tbody>
            </table>
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
