import React, { useState, useEffect } from "react";
import axiosInstance from "../axiosInstance";
import InternalNavbar from "../components/InternalNavbar";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useOrderData } from "../components/hooks/useOrderData";
import POCopySection from '../components/OrderTable/POCopySection';
import Swal from "sweetalert2";

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

  // ✅ Helper: Check if order has multiple products
  const hasMultipleProducts = (order) => {
    return order.products && order.products.length > 0;
  };

  // ✅ Helper: Get total quantity
  const getTotalQuantity = (order) => {
    if (hasMultipleProducts(order)) {
      return order.products.reduce((sum, p) => sum + (parseInt(p.quantity) || 0), 0);
    }
    return order.quantity;
  };

  // ✅ Helper: Get total delivered
  const getTotalDelivered = (order) => {
    if (hasMultipleProducts(order)) {
      return order.products.reduce((sum, p) => sum + (p.deliveredQuantity || 0), 0);
    }
    return order.deliveredQuantity || 0;
  };

  // ✅ Helper: Get price display
  const getPriceDisplay = (order) => {
    if (hasMultipleProducts(order)) {
      const prices = order.products.map(p => parseFloat(p.price)).filter(p => !isNaN(p));
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      return minPrice === maxPrice ? `₹${minPrice}` : `₹${minPrice} - ₹${maxPrice}`;
    }
    return `₹${order.price}`;
  };

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
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This will permanently delete this completed order.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    try {
      await axiosInstance.delete(`/orders/${orderId}`);
      fetchOrders();
      Swal.fire("Deleted!", "Order has been deleted.", "success");
    } catch (err) {
      console.error("Error deleting order:", err);
      Swal.fire("Error!", "Failed to delete order", "error");
    }
  };

  // ✅ Render product cell for multi-product
  const renderProductCell = (order) => {
    if (!hasMultipleProducts(order)) {
      return (
        <div>
          <div className="font-medium">{order.product}</div>
          <div className="text-xs text-gray-500">Qty: {order.quantity}</div>
        </div>
      );
    }

    return (
      <div className="space-y-1 max-w-xs">
        {order.products.map((prod, idx) => (
          <div key={idx} className="border-b border-gray-200 pb-1 last:border-0">
            <div className="font-medium text-sm">{prod.productName}</div>
            <div className="text-xs text-gray-500">
              Qty: {prod.quantity} | Size: {prod.size || "N/A"}
            </div>
          </div>
        ))}
        <div className="text-xs font-bold text-blue-600 pt-1">
          Total: {getTotalQuantity(order)}
        </div>
      </div>
    );
  };

  // ✅ Render delivered quantity cell
  const renderDeliveredCell = (order) => {
    if (!hasMultipleProducts(order)) {
      return `${order.deliveredQuantity || 0} / ${order.quantity}`;
    }

    return (
      <div className="space-y-1">
        {order.products.map((prod, idx) => (
          <div key={idx} className="text-xs">
            <span className="font-medium">{prod.productName}:</span>{" "}
            {prod.deliveredQuantity || 0} / {prod.quantity}
          </div>
        ))}
        <div className="text-xs font-bold text-blue-600 pt-1">
          Total: {getTotalDelivered(order)} / {getTotalQuantity(order)}
        </div>
      </div>
    );
  };

  // ✅ Render remarks cell
  const renderRemarksCell = (order) => {
    if (!hasMultipleProducts(order)) {
      return order.remarks || "-";
    }

    const productRemarks = order.products.filter(p => p.productRemarks);
    if (productRemarks.length === 0) return order.remarks || "-";

    return (
      <div className="space-y-1">
        {productRemarks.map((prod, idx) => (
          <div key={idx} className="text-xs">
            <strong>{prod.productName}:</strong> {prod.productRemarks}
          </div>
        ))}
      </div>
    );
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
            placeholder="Search by Order ID, Customer, PO..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="p-2 border rounded w-64"
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
              <thead className="bg-green-100 text-gray-700 sticky top-0">
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
                  <th className="px-4 py-2">Freight</th>
                  <th className="px-4 py-2">Freight Amount</th>
                  <th className="px-4 py-2">Payment Terms</th>
                  <th className="px-4 py-2">Dispatch Time</th>
                  <th className="px-4 py-2">Quantity</th>
                  <th className="px-4 py-2">Delivered Quantity</th>
                  <th className="px-4 py-2">Basic Price</th>
                  <th className="px-4 py-2">Remarks</th>
                  <th className="px-4 py-2">PO Copy</th>
                  <th className="px-4 py-2">Completed Date</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o._id} className="hover:bg-gray-50 border-b">
                    <td className="px-4 py-2 font-medium">{o.shortId}</td>
                    <td className="px-4 py-2">
                      {o.createdAt
                        ? new Date(o.createdAt).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          })
                        : "-"}
                    </td>
                    <td className="px-4 py-2 font-medium">{o.customerName}</td>
                    
                    {/* Product Name - Multi-product support */}
                    <td className="px-4 py-2">{renderProductCell(o)}</td>
                    
                    {/* Narration */}
                    <td className="px-4 py-2">
                      {o.narration || (hasMultipleProducts(o) && o.products.some(p => p.narration) ? (
                        <div className="space-y-1">
                          {o.products.map((p, idx) => p.narration && (
                            <div key={idx} className="text-xs">
                              <strong>{p.productName}:</strong> {p.narration}
                            </div>
                          ))}
                        </div>
                      ) : "-")}
                    </td>
                    
                    {/* Narration Images */}
                    <td className="px-4 py-2">
                      <div className="flex gap-2 flex-wrap">
                        {o.narrationImages?.map((img, i) => (
                          <img
                            key={i}
                            src={img}
                            alt={`Narration ${i + 1}`}
                            className="w-12 h-12 object-cover rounded cursor-pointer"
                            onClick={() => window.open(img, "_blank")}
                          />
                        ))}
                        {hasMultipleProducts(o) && o.products.map((p, idx) => 
                          p.narrationImages?.map((img, imgIdx) => (
                            <img
                              key={`${idx}-${imgIdx}`}
                              src={img}
                              alt={`${p.productName} narration`}
                              className="w-12 h-12 object-cover rounded cursor-pointer border border-blue-200"
                              onClick={() => window.open(img, "_blank")}
                            />
                          ))
                        )}
                      </div>
                    </td>
                    
                    {/* Bill To */}
                    <td className="px-4 py-2">
                      <div className="max-w-[200px] whitespace-normal break-words">
                        {o.billTo || "—"}
                      </div>
                      <span className="text-xs text-gray-500">
                        📞 {o.customer?.phone || getCustomerPhone(o.customerName)}
                      </span>
                    </td>
                    
                    {/* Ship To */}
                    <td className="px-4 py-2">
                      <div className="max-w-[200px] whitespace-normal break-words">
                        {o.shipTo || "—"}
                      </div>
                      <span className="text-xs text-gray-500">
                        📞 {o.customer?.phone || getCustomerPhone(o.customerName)}
                      </span>
                    </td>
                    
                    <td className="px-4 py-2">{o.po}</td>
                    
                    {/* Density - Multi-product */}
                    <td className="px-4 py-2">
                      {hasMultipleProducts(o) ? (
                        <div className="space-y-1">
                          {o.products.map((p, idx) => (
                            <div key={idx} className="text-xs">
                              {p.productName}: {p.density || "N/A"} kg/m³
                            </div>
                          ))}
                        </div>
                      ) : (
                        `${o.density}kg/m³`
                      )}
                    </td>
                    
                    <td className="px-4 py-2">₹{o.packagingCharge || 0}</td>
                    
                    {/* Size - Multi-product */}
                    <td className="px-4 py-2">
                      {hasMultipleProducts(o) ? (
                        <div className="space-y-1">
                          {o.products.map((p, idx) => (
                            <div key={idx} className="text-xs">
                              {p.productName}: {p.size || "N/A"}
                            </div>
                          ))}
                        </div>
                      ) : (
                        o.size || "N/A"
                      )}
                    </td>
                    
                    <td className="px-4 py-2">{o.freight}</td>
                    <td className="px-4 py-2">₹{o.freightAmount || 0}</td>
                    <td className="px-4 py-2">{o.paymentTerms || "—"}</td>
                    
                    {/* Dispatch Time */}
                    <td className="px-4 py-2">
                      {(() => {
                        if (!o.date) return "N/A";
                        const deliveryDate = new Date(o.date);
                        const deliveryOption = o.deliveryOption;
                        
                        if (deliveryOption === "1week") return "Within 1 Week";
                        if (deliveryOption === "2weeks") return "Within 2 Weeks";
                        if (deliveryOption === "particular") {
                          return deliveryDate.toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          });
                        }
                        return "N/A";
                      })()}
                    </td>
                    
                    {/* Quantity - Multi-product */}
                    <td className="px-4 py-2">
                      {hasMultipleProducts(o) ? (
                        <div>
                          {o.products.map((p, idx) => (
                            <div key={idx} className="text-xs">
                              {p.productName}: {p.quantity}
                            </div>
                          ))}
                          <div className="text-xs font-bold text-blue-600 mt-1">
                            Total: {getTotalQuantity(o)}
                          </div>
                        </div>
                      ) : (
                        o.quantity
                      )}
                    </td>
                    
                    {/* Delivered Quantity - Multi-product */}
                    <td className="px-4 py-2">
                      {hasMultipleProducts(o) ? (
                        <div>
                          {o.products.map((p, idx) => (
                            <div key={idx} className="text-xs">
                              {p.productName}: {p.deliveredQuantity || 0} / {p.quantity}
                            </div>
                          ))}
                          <div className="text-xs font-bold text-green-600 mt-1">
                            Total: {getTotalDelivered(o)} / {getTotalQuantity(o)}
                          </div>
                        </div>
                      ) : (
                        `${o.deliveredQuantity || 0} / ${o.quantity}`
                      )}
                    </td>
                    
                    {/* Basic Price - Multi-product */}
                    <td className="px-4 py-2">
                      {hasMultipleProducts(o) ? (
                        <div className="space-y-1">
                          {o.products.map((p, idx) => (
                            <div key={idx} className="text-xs">
                              {p.productName}: ₹{parseFloat(p.price) || 0}
                            </div>
                          ))}
                        </div>
                      ) : (
                        `₹${o.price}`
                      )}
                    </td>
                    
                    {/* Remarks - Multi-product */}
                    <td className="px-4 py-2 max-w-[250px] whitespace-normal break-words">
                      {renderRemarksCell(o)}
                    </td>
                    
                    {/* PO Copy */}
                    <td className="px-4 py-2">
                      <POCopySection 
                        order={o}
                        resolvedPOUrls={resolvedPOUrls}
                      />
                    </td>
                    
                    {/* Completed Date */}
                    <td className="px-4 py-2">
                      {o.updatedAt
                        ? new Date(o.updatedAt).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          })
                        : "-"}
                    </td>
                    
                    {/* Status */}
                    <td className="px-4 py-2">
                      <span className="bg-green-200 text-green-700 px-2 py-1 rounded text-xs">
                        Completed
                      </span>
                    </td>
                    
                    {/* Actions */}
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