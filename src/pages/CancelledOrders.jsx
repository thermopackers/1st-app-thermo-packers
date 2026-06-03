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

  // ✅ Helper: Get product display
  const getProductDisplay = (order) => {
    if (hasMultipleProducts(order)) {
      const productNames = order.products.map(p => p.productName);
      if (productNames.length <= 2) {
        return productNames.join(", ");
      }
      return `${productNames.slice(0, 2).join(", ")} +${productNames.length - 2} more`;
    }
    return order.product;
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

  // ✅ Helper: Get density display
  const getDensityDisplay = (order) => {
    if (hasMultipleProducts(order)) {
      const densities = order.products.map(p => p.density).filter(d => d);
      if (densities.length === 0) return "N/A";
      const uniqueDensities = [...new Set(densities)];
      return uniqueDensities.length === 1 ? uniqueDensities[0] : "Multiple";
    }
    return order.density || "N/A";
  };

  // ✅ Helper: Get size display
  const getSizeDisplay = (order) => {
    if (hasMultipleProducts(order)) {
      const sizes = order.products.map(p => p.size).filter(s => s);
      if (sizes.length === 0) return "N/A";
      const uniqueSizes = [...new Set(sizes)];
      return uniqueSizes.length === 1 ? uniqueSizes[0] : "Multiple";
    }
    return order.size || "N/A";
  };

  // ✅ Helper: Get remarks display
  const getRemarksDisplay = (order) => {
    if (hasMultipleProducts(order)) {
      const productRemarks = order.products.filter(p => p.productRemarks);
      if (productRemarks.length === 0) return order.remarks || "-";
      return (
        <div className="space-y-1">
          {productRemarks.map((p, idx) => (
            <div key={idx} className="text-xs">
              <strong>{p.productName}:</strong> {p.productRemarks}
            </div>
          ))}
        </div>
      );
    }
    return order.remarks || "-";
  };

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
        <button
          onClick={() => navigate(-1)}
          className="mb-4 bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
        >
          ← Back
        </button>

        <h2 className="text-3xl font-bold mb-6 text-center">❌ Cancelled Orders</h2>

        {/* Search */}
        <div className="mb-4 flex justify-between items-center">
          <input
            type="text"
            placeholder="Search by Order ID, PO, Product, Customer..."
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
              <thead className="bg-gray-100 sticky top-0">
                <tr>
                  <th className="px-4 py-2">Order ID</th>
                  <th className="px-4 py-2">Customer</th>
                  <th className="px-4 py-2 text-left">Product(s)</th>
                  <th className="px-4 py-2 text-left">PO</th>
                  <th className="px-4 py-2">Order Date</th>
                  <th className="px-4 py-2">Density</th>
                  <th className="px-4 py-2">Size</th>
                  <th className="px-4 py-2">Freight</th>
                  <th className="px-4 py-2">Freight Amount</th>
                  <th className="px-4 py-2">Total Quantity</th>
                  <th className="px-4 py-2">Price</th>
                  <th className="px-4 py-2">Remarks</th>
                  <th className="px-4 py-2">Cancelled On</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {orders.map((o) => (
                  <tr key={o._id} className="hover:bg-gray-50">
                    {/* Order ID - Sticky */}
                    <td className="px-4 py-2 font-medium">{o.shortId}</td>
                    
                    {/* Customer Name - Sticky */}
                    <td className="px-4 py-2 font-medium">{o.customerName}</td>
                    
                    {/* Product(s) - Multi-product support */}
                    <td className="px-4 py-2">
                      {hasMultipleProducts(o) ? (
                        <div className="space-y-1">
                          {o.products.map((p, idx) => (
                            <div key={idx} className="border-b border-gray-200 pb-1 last:border-0">
                              <div className="font-medium text-sm">{p.productName}</div>
                              <div className="text-xs text-gray-500">
                                Qty: {p.quantity} | Price: ₹{parseFloat(p.price) || 0}
                              </div>
                            </div>
                          ))}
                          <div className="text-xs font-bold text-blue-600 pt-1">
                            Total Qty: {getTotalQuantity(o)}
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="font-medium">{o.product}</div>
                          <div className="text-xs text-gray-500">Qty: {o.quantity}</div>
                        </div>
                      )}
                    </td>
                    
                    {/* PO */}
                    <td className="px-4 py-2">{o.po}</td>
                    
                    {/* Order Date */}
                    <td className="px-4 py-2">
                      {o.createdAt
                        ? new Date(o.createdAt).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          })
                        : "-"}
                    </td>
                    
                    {/* Density */}
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
                    
                    {/* Size */}
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
                    
                    {/* Freight */}
                    <td className="px-4 py-2">{o.freight || "N/A"}</td>
                    <td className="px-4 py-2">₹{o.freightAmount || 0}</td>
                    
                    {/* Total Quantity */}
                    <td className="px-4 py-2 font-medium">{getTotalQuantity(o)}</td>
                    
                    {/* Price */}
                    <td className="px-4 py-2">{getPriceDisplay(o)}</td>
                    
                    {/* Remarks */}
                    <td className="px-4 py-2 max-w-[250px] whitespace-normal break-words">
                      {getRemarksDisplay(o)}
                    </td>
                    
                    {/* Cancelled On */}
                    <td className="px-4 py-2">
                      {o.updatedAt
                        ? new Date(o.updatedAt).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          })
                        : "-"}
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
            className="px-4 py-2 bg-gray-300 rounded disabled:opacity-50 hover:bg-gray-400"
          >
            ⬅ Prev
          </button>
          <span className="px-4 py-2">
            Page {page} of {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="px-4 py-2 bg-gray-300 rounded disabled:opacity-50 hover:bg-gray-400"
          >
            Next ➡
          </button>
        </div>
      </div>
    </div>
  );
}