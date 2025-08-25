import React, { useEffect, useState } from "react";
import axiosInstance from "../axiosInstance";
import InternalNavbar from "../components/InternalNavbar";
import { useNavigate } from "react-router-dom";

export default function CancelledOrders() {
  const [orders, setOrders] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  const fetchCancelledOrders = async (pageNo = 1) => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/orders/cancelled", {
        headers: { Authorization: `Bearer ${token}` },
        params: { page: pageNo, limit: 10, search },
      });

      setOrders(res.data.orders);
      setTotalPages(res.data.totalPages);
      setPage(res.data.page);
    } catch (err) {
      console.error("Error fetching cancelled orders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCancelledOrders(page);
  }, [page, search]);

  return (
    <div className="bg-gray-100 min-h-screen">
      <InternalNavbar />
      <div className="max-w-7xl mx-auto p-6">
        <h2 className="text-3xl font-bold mb-6 text-center">❌ Cancelled Orders</h2>

        {/* Search */}
        <div className="mb-4 flex justify-between items-center">
          <input
            type="text"
            placeholder="Search by PO, Product, Client..."
            className="border px-4 py-2 rounded-md w-1/2"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Table */}
        {loading ? (
          <p className="text-center">Loading...</p>
        ) : orders.length === 0 ? (
          <p className="text-center text-gray-500">No cancelled orders found.</p>
        ) : (
          <div className="overflow-x-auto bg-white shadow rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left">Order ID</th>
                  <th className="px-4 py-2 text-left">Customer</th>
                  <th className="px-4 py-2 text-left">Product</th>
                  <th className="px-4 py-2 text-left">Quantity</th>
                  <th className="px-4 py-2 text-left">PO</th>
                  <th className="px-4 py-2 text-left">Cancelled On</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {orders.map((o) => (
                  <tr key={o._id}>
                    <td className="px-4 py-2">{o.shortId}</td>
                    <td className="px-4 py-2">{o.customerName}</td>
                    <td className="px-4 py-2">{o.product}</td>
                    <td className="px-4 py-2">{o.quantity}</td>
                    <td className="px-4 py-2">{o.po}</td>
                    <td className="px-4 py-2">
                      {new Date(o.updatedAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="flex justify-center mt-6 gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-4 py-2 bg-gray-300 rounded disabled:opacity-50"
          >
            ⬅ Prev
          </button>
          <span className="px-4 py-2">Page {page} of {totalPages}</span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="px-4 py-2 bg-gray-300 rounded disabled:opacity-50"
          >
            Next ➡
          </button>
        </div>
      </div>
    </div>
  );
}
