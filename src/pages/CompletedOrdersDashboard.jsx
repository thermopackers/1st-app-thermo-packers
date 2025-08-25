import React, { useState, useEffect } from "react";
import axiosInstance from "../axiosInstance";
import InternalNavbar from "../components/InternalNavbar";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function CompletedOrdersDashboard() {
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const currentPage = parseInt(searchParams.get("page")) || 1;
  const navigate = useNavigate();

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/orders/completed-orders", {
        params: { page: currentPage, limit: 10, search, startDate, endDate },
      });
      setOrders(res.data.orders);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      console.error("Error fetching completed orders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [currentPage, search, startDate, endDate]);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setSearchParams({ page });
    }
  };

  return (
    <>
      <InternalNavbar />
      <div className="p-6 bg-gray-50 min-h-screen">
        <button
          onClick={() => navigate(-1)}
          className="mb-4 bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
        >
          ← Back
        </button>

        <h2 className="text-3xl font-bold mb-6 text-center text-black">
          ✅ Completed Orders
        </h2>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="p-2 border rounded"
          />
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="p-2 border rounded"
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="p-2 border rounded"
          />
          <button
            onClick={() => {
              setSearch("");
              setStartDate("");
              setEndDate("");
            }}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Clear
          </button>
        </div>

        {loading ? (
          <p className="text-center">Loading...</p>
        ) : orders.length === 0 ? (
          <p className="text-center text-gray-600">No completed orders found.</p>
        ) : (
          <div className="overflow-x-auto bg-white rounded shadow">
            <table className="min-w-full border text-sm text-left">
              <thead className="bg-green-100 text-gray-700">
                <tr>
                  <th className="px-4 py-2">Order ID</th>
                  <th className="px-4 py-2">Customer</th>
                  <th className="px-4 py-2">Product</th>
                  <th className="px-4 py-2">PO</th>
                  <th className="px-4 py-2">Date</th>
                  <th className="px-4 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o._id} className="hover:bg-gray-50">
                    <td className="px-4 py-2">{o.shortId}</td>
                    <td className="px-4 py-2">{o.customerName}</td>
                    <td className="px-4 py-2">{o.product}</td>
                    <td className="px-4 py-2">{o.po}</td>
                    <td className="px-4 py-2">
                      {new Date(o.updatedAt).toLocaleDateString("en-GB")}
                    </td>
                    <td className="px-4 py-2">
                      <span className="bg-green-200 text-green-700 px-2 py-1 rounded text-xs">
                        Completed
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {orders.length > 0 && (
          <div className="flex justify-center mt-6 gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1 bg-purple-500 text-white rounded disabled:opacity-50"
            >
              Prev
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => handlePageChange(i + 1)}
                className={`px-3 py-1 rounded ${
                  currentPage === i + 1
                    ? "bg-purple-700 text-white"
                    : "bg-gray-200 hover:bg-purple-300"
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 bg-purple-500 text-white rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </>
  );
}
