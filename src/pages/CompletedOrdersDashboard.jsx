import React, { useState, useEffect } from "react";
import axiosInstance from "../axiosInstance";
import InternalNavbar from "../components/InternalNavbar";
import { useNavigate, useSearchParams } from "react-router-dom";
import {useOrderData} from "../components/hooks/useOrderData"
import POCopySection from '../components/OrderTable/POCopySection';

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
  const token = localStorage.getItem("token") || sessionStorage.getItem("token");

  const {
    getCustomerPhone,
    resolvedPOUrls
  } = useOrderData(token);

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

    const handleDeleteOrder = async (orderId) => {
    if (!window.confirm("Are you sure you want to delete this completed order?")) {
      return;
    }

    try {
      await axiosInstance.delete(`/orders/${orderId}`);
      // Refresh the orders list after deletion
      fetchOrders();
      alert("Order deleted successfully!");
    } catch (err) {
      console.error("Error deleting order:", err);
      alert("Failed to delete order");
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
  lang="en-GB"
  className="p-2 border rounded"
/>
<input
  type="date"
  value={endDate}
  onChange={(e) => setEndDate(e.target.value)}
  lang="en-GB"
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
                  <th className="px-4 py-2">Ordered Date</th>
                  <th className="px-4 py-2">Customer Name</th>
                  <th className="px-4 py-2">Product Name</th>
                                    <th className="px-4 py-2">Narration</th>
                  <th className="px-4 py-2">Narration Images</th>
                  <th className="px-4 py-2">Bill To</th>
                  <th className="px-4 py-2">Ship To</th>
                  <th className="px-4 py-2">PO</th>
                  <th className="px-4 py-2">Density</th>
                                    <th className="px-4 py-2">Packaging Charge</th>
                  <th className="px-4 py-2">Size</th>
                  <th className="px-4 py-2">freight</th>
                  <th className="px-4 py-2">freight Amount</th>
                  <th className="px-4 py-2">Payment Terms</th>
                                    <th className="px-4 py-2">Dispatch Time</th>
                                    <th className="px-4 py-2">Quantity</th>
                                    <th className="px-4 py-2">Delivered Quantity</th>
                  <th className="px-4 py-2">Basic Price</th>
                  <th className="px-4 py-2">Remarks</th>
                                    <th className="px-4 py-2">Po Copy</th>
                  <th className="px-4 py-2">Completed Date</th>
                  <th className="px-4 py-2">Status</th>
                                    <th className="px-4 py-2">Actions</th> {/* NEW COLUMN */}
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o._id} className="hover:bg-gray-50">
                    <td className="px-4 py-2">{o.shortId}</td>
                    <td className="px-4 py-2">
  {o.createdAt
    ? new Date(o.createdAt).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "-"}
</td>

                    <td className="px-4 py-2">{o.customerName}</td>
                    <td className="px-4 py-2">{o.product}</td>
                      <td>
        {o.narration ? (
          <span>
            <strong>Narration:</strong> {o.narration}
          </span>
        ) : (
          <span>-</span>
        )}
      </td>
        <td>
        <strong>Narration Images:</strong>
        <div className="flex gap-2 flex-wrap mt-1">
          {o.narrationImages?.map((img, i) => (
            <img
              key={i}
              src={img}
              alt={`Narration ${i + 1}`}
              className="w-16 h-16 object-cover rounded cursor-pointer"
              onClick={() => window.open(img, "_blank")}
            />
          ))}
        </div>
      </td>

      <td>
        <strong>Bill To:</strong>
        <br />
        {o.billTo || "—"}
        <br />
        <span className="text-gray-600">
          📞 {o.customer?.phone || getCustomerPhone(o.customerName)}
        </span>
      </td>

      <td>
        <strong>Ship To:</strong>
        <br />
        {o.shipTo || "—"}
        <br />
        <span className="text-gray-600">
          📞 {o.customer?.phone || getCustomerPhone(o.customerName)}
        </span>
      </td>
                    <td className="px-4 py-2">{o.po}</td>
                      <td className="px-4 py-2">{o.density}</td>
                                            <td className="px-4 py-2">{o.packagingCharge}</td>
                      <td className="px-4 py-2">{o.size}</td>
                      <td className="px-4 py-2">{o.freight}</td>
                      <td className="px-4 py-2">{o.freightAmount}</td>
                                            <td className="px-4 py-2">{o.paymentTerms}</td>
                                             <td>
                                                    {(() => {
                                                      if (!o.date) return "N/A";
                                                      const today = new Date();
                                                      const deliveryDate = new Date(o.date);
                                                      today.setHours(0, 0, 0, 0);
                                                      deliveryDate.setHours(0, 0, 0, 0);
                                                      const diffDays = Math.ceil((deliveryDate - today) / (1000 * 60 * 60 * 24));
                                                      
                                                      if (diffDays <= 7) return "Within 1 Week";
                                                      if (diffDays <= 14) return "Within 2 Weeks";
                                                      if (diffDays <= 20) return "Within 20 Days";
                                                      
                                                      return deliveryDate.toLocaleDateString("en-GB", {
                                                        day: "2-digit",
                                                        month: "2-digit",
                                                        year: "numeric",
                                                      });
                                                    })()}
                                                  </td>
                      <td className="px-4 py-2">{o.quantity}</td>
                      <td className="px-4 py-2">
                       {o.deliveredQuantity}
                      </td>
                      <td className="px-4 py-2">{o.price}</td>
<td className="px-4 py-2 whitespace-normal break-words">
  {o.remarks}
</td>
  <td>
        <POCopySection 
          order={o}
          resolvedPOUrls={resolvedPOUrls}
        />
      </td>
<td className="px-4 py-2">
  {o.updatedAt
    ? new Date(o.updatedAt).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "-"}
</td>
                    <td className="px-4 py-2">
                      <span className="bg-green-200 text-green-700 px-2 py-1 rounded text-xs">
                        Completed
                      </span>
                    </td>
                      <td className="px-4 py-2">
                      <button
                        onClick={() => handleDeleteOrder(o._id)}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                      >
                        Delete
                      </button>
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
