import { useEffect, useState } from "react";
import axiosInstance from "../axiosInstance";
import InternalNavbar from "../components/InternalNavbar";
import toast from "react-hot-toast";
import Swal from "sweetalert2";
import {
  Package,
  Plus,
  Minus,
  History,
  Calendar,
  Filter,
  ArrowLeft,
  ArrowRight,
  Save,
  Eye,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Warehouse,
  RefreshCw
} from "lucide-react";

export default function StockManagement() {
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [products, setProducts] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Responsive detection
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleDateChange = (id, value) => {
    setQuantities((prev) => ({
      ...prev,
      [id]: { ...prev[id], date: value }
    }));
  };

  const fetchCategories = async () => {
    try {
      const res = await axiosInstance.get("/categories");
      setCategories(res.data);
    } catch (err) {
      toast.error("Failed to load categories");
    }
  };

  const fetchProducts = async (categoryId, pg = 1) => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(
        `/purchase-products?category=${categoryId}&page=${pg}&limit=10`
      );
      setProducts(res.data.data);
      setTotalPages(res.data.totalPages);
      setPage(res.data.page);
      setQuantities({});
    } catch (err) {
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = (id, type, value) => {
    setQuantities((prev) => ({
      ...prev,
      [id]: { ...prev[id], [type]: Number(value) }
    }));
  };

  const handleSave = async (id) => {
    const { add = 0, remove = 0, date } = quantities[id] || {};

    if (!add && !remove) {
      toast.error("Please enter a quantity to add or remove");
      return;
    }

    const chosenDate = date ? new Date(date) : new Date();
    const formattedDate = chosenDate.toISOString();

    const netChange = add - remove;
    const product = products.find((p) => p._id === id);

    const result = await Swal.fire({
      title: "Confirm Stock Update",
      html: `
        <div style="text-align:left; padding: 1rem;">
          <p><b>Product:</b> ${product?.name}</p>
          <p><b>Add:</b> <span style="color:green">+${add || 0}</span></p>
          <p><b>Remove:</b> <span style="color:red">-${remove || 0}</span></p>
          <p><b>Net Change:</b> <span style="color:${netChange >= 0 ? 'green' : 'red'}">${netChange >= 0 ? "+" + netChange : netChange}</span></p>
          <p><b>Date:</b> ${chosenDate.toLocaleDateString()}</p>
        </div>
      `,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "✅ Update Stock",
      cancelButtonText: "❌ Cancel",
      confirmButtonColor: "#16a34a",
      cancelButtonColor: "#dc2626",
      customClass: {
        popup: 'rounded-2xl'
      },
      background: '#f8fafc'
    });

    if (!result.isConfirmed) return;

    try {
      const res = await axiosInstance.put(`/purchase-products/${id}/stock`, {
        add,
        remove,
        date: formattedDate,
      });

      toast.success(`Stock updated! Current stock: ${res.data.stock}`);

      setProducts((prev) =>
        prev.map((p) =>
          p._id === id ? { ...p, stock: res.data.stock } : p
        )
      );

      setQuantities((prev) => ({ ...prev, [id]: { add: 0, remove: 0, date: "" } }));
    } catch (err) {
      toast.error("Failed to update stock");
    }
  };

  const showHistory = async (prod) => {
    let page = 1;
    let totalPages = 1;
    let history = [];

    const fetchHistory = async (pg = 1) => {
      try {
        const res = await axiosInstance.get(
          `/purchase-products/${prod._id}/history?page=${pg}&limit=10`
        );
        history = res.data.data;
        page = res.data.page;
        totalPages = res.data.totalPages;
      } catch (err) {
        toast.error("Failed to load stock history");
      }
    };

    const renderHistoryTable = () => {
      const formatDate = (dateStr) => {
        const d = new Date(dateStr);
        const day = String(d.getDate()).padStart(2, "0");
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
      };

      return `
        <div style="max-height: 400px; overflow-y: auto;">
          <table style="width:100%; text-align:left; border-collapse: collapse; font-size: 14px;">
            <thead style="background: #f8fafc; position: sticky; top: 0;">
              <tr>
                <th style="padding: 8px 12px; border-bottom: 2px solid #e5e7eb;">Date</th>
                <th style="padding: 8px 12px; border-bottom: 2px solid #e5e7eb;">Added</th>
                <th style="padding: 8px 12px; border-bottom: 2px solid #e5e7eb;">Removed</th>
                <th style="padding: 8px 12px; border-bottom: 2px solid #e5e7eb;">Stock After</th>
              </tr>
            </thead>
            <tbody>
              ${history
                .map(
                  (h) => `
                <tr style="border-bottom: 1px solid #e5e7eb;">
                  <td style="padding: 8px 12px;">${formatDate(h.date)}</td>
                  <td style="padding: 8px 12px; color: #16a34a; font-weight: 600;">+${h.added}</td>
                  <td style="padding: 8px 12px; color: #dc2626; font-weight: 600;">-${h.removed}</td>
                  <td style="padding: 8px 12px; font-weight: 700;">${h.newStock}</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
        </div>
        <div style="margin-top:15px; text-align:center; display: flex; align-items: center; justify-content: center; gap: 10px;">
          <button 
            id="prevBtn" 
            ${page === 1 ? "disabled" : ""}
            style="padding: 6px 12px; border: 1px solid #d1d5db; border-radius: 8px; background: ${page === 1 ? '#f3f4f6' : 'white'}; color: ${page === 1 ? '#9ca3af' : '#374151'}; cursor: ${page === 1 ? 'not-allowed' : 'pointer'};"
          >
            ← Previous
          </button>
          <span style="color: #6b7280; font-size: 14px;">Page ${page} of ${totalPages}</span>
          <button 
            id="nextBtn" 
            ${page === totalPages ? "disabled" : ""}
            style="padding: 6px 12px; border: 1px solid #d1d5db; border-radius: 8px; background: ${page === totalPages ? '#f3f4f6' : 'white'}; color: ${page === totalPages ? '#9ca3af' : '#374151'}; cursor: ${page === totalPages ? 'not-allowed' : 'pointer'};"
          >
            Next →
          </button>
        </div>
      `;
    };

    await fetchHistory(1);

    Swal.fire({
      title: `📜 Stock History - ${prod.name}`,
      html: renderHistoryTable(),
      showConfirmButton: false,
      width: 600,
      customClass: {
        popup: 'rounded-2xl'
      },
      background: '#f8fafc',
      didRender: () => {
        document
          .getElementById("prevBtn")
          ?.addEventListener("click", async () => {
            if (page > 1) {
              await fetchHistory(page - 1);
              Swal.update({ html: renderHistoryTable() });
            }
          });
        document
          .getElementById("nextBtn")
          ?.addEventListener("click", async () => {
            if (page < totalPages) {
              await fetchHistory(page + 1);
              Swal.update({ html: renderHistoryTable() });
            }
          });
      },
    });
  };

  const getTotalStock = () => {
    let total = 0;
    let unit = "";

    products.forEach((p) => {
      total += p.stock || 0;
      if (!unit && p.unit) unit = p.unit;
    });

    return { total, unit };
  };

  const showGradeImages = (prod) => {
    if (!prod.files || prod.files.length === 0) {
      Swal.fire({
        title: `${prod.name} - No Images`,
        text: "No images available for this grade.",
        icon: "info",
        customClass: {
          popup: 'rounded-2xl'
        },
        background: '#f8fafc'
      });
      return;
    }

    Swal.fire({
      title: `Images - ${prod.name}`,
      html: `
        <div style="display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; max-height: 60vh; overflow-y: auto;">
          ${prod.files
            .map(
              (file) => `
            <div style="border: 1px solid #e5e7eb; padding: 8px; border-radius: 12px; background: white;">
              <img 
                src="${file.url}" 
                alt="file" 
                style="width: 150px; height: 150px; object-fit: cover; border-radius: 8px; cursor: pointer;" 
                onclick="Swal.fire({
                  imageUrl: '${file.url}',
                  imageAlt: 'Product Image',
                  showCloseButton: true,
                  showConfirmButton: false,
                  background: '#f8fafc',
                  customClass: { popup: 'rounded-2xl' }
                })"
              />
            </div>
          `
            )
            .join("")}
        </div>
      `,
      showCloseButton: true,
      showConfirmButton: false,
      width: 700,
      customClass: {
        popup: 'rounded-2xl'
      },
      background: '#f8fafc'
    });
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  return (
    <>
      <InternalNavbar />
      
      {/* Main Container */}
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          
          {/* Header Section */}
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              📊 Stock Management
            </h1>
            <p className="text-gray-600 mt-2">
              Manage inventory levels and track stock movements
            </p>
          </div>

          {/* Category Filter */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-200">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-center gap-3">
                <Filter className="text-blue-600" size={24} />
                <h2 className="text-lg font-semibold text-gray-800">Filter Products</h2>
              </div>
              
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  fetchProducts(e.target.value, 1);
                }}
                className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white w-full lg:w-64"
              >
                <option value="">-- Select Category --</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Products Table/Cards */}
          {selectedCategory && (
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-3">
                  <Package size={24} />
                  Stock Management ({products.length} products)
                </h2>
              </div>

              {/* Loading State */}
              {loading && (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              )}

              {/* Desktop Table */}
              {!isMobile && !loading && products.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">
                          <Calendar size={16} className="inline mr-2" />
                          Date
                        </th>
                        <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Product</th>
                        <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Unit</th>
                        <th className="py-4 px-6 text-center text-sm font-semibold text-gray-700">
                          <Plus size={16} className="inline mr-2 text-green-600" />
                          Add Stock
                        </th>
                        <th className="py-4 px-6 text-center text-sm font-semibold text-gray-700">
                          <Minus size={16} className="inline mr-2 text-red-600" />
                          Remove Stock
                        </th>
                        <th className="py-4 px-6 text-center text-sm font-semibold text-gray-700">
                          <Warehouse size={16} className="inline mr-2 text-blue-600" />
                          Current Stock
                        </th>
                        <th className="py-4 px-6 text-center text-sm font-semibold text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {products.map((prod) => (
                        <tr key={prod._id} className="hover:bg-gray-50 transition-colors duration-150">
                          {/* Date */}
                          <td className="py-4 px-6">
                            <input
                              type="date"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                              value={quantities[prod._id]?.date || new Date().toISOString().split("T")[0]}
                              onChange={(e) => handleDateChange(prod._id, e.target.value)}
                              max={new Date().toISOString().split("T")[0]}
                            />
                          </td>

                          {/* Product Name */}
                          <td className="py-4 px-6">
                            <div 
                              className="text-blue-600 hover:text-blue-700 cursor-pointer transition-colors duration-200 font-medium flex items-center gap-2"
                              onClick={() => showGradeImages(prod)}
                            >
                              <Eye size={16} />
                              {prod.name}
                            </div>
                          </td>

                          {/* Unit */}
                          <td className="py-4 px-6 text-gray-600">
                            {prod.unit}
                          </td>

                          {/* Add Stock */}
                          <td className="py-4 px-6">
                            <input
                              type="number"
                              min="0"
                              className="w-24 px-3 py-2 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 text-center"
                              value={quantities[prod._id]?.add || ""}
                              onChange={(e) => handleQuantityChange(prod._id, "add", e.target.value)}
                              placeholder="0"
                            />
                          </td>

                          {/* Remove Stock */}
                          <td className="py-4 px-6">
                            <input
                              type="number"
                              min="0"
                              className="w-24 px-3 py-2 border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 text-center"
                              value={quantities[prod._id]?.remove || ""}
                              onChange={(e) => handleQuantityChange(prod._id, "remove", e.target.value)}
                              placeholder="0"
                            />
                          </td>

                          {/* Current Stock */}
                          <td className="py-4 px-6 text-center">
                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold ${
                              prod.stock < 10 
                                ? "bg-red-100 text-red-700" 
                                : "bg-green-100 text-green-700"
                            }`}>
                              {prod.stock < 10 && <TrendingDown size={14} />}
                              {prod.stock || 0}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="py-4 px-6">
                            <div className="flex flex-col gap-2">
                              <button
                                onClick={() => handleSave(prod._id)}
                                disabled={!quantities[prod._id]?.add && !quantities[prod._id]?.remove}
                                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-3 py-2 rounded-lg transition-colors duration-200 text-sm font-medium justify-center"
                              >
                                <Save size={16} />
                                Save
                              </button>
                              <button
                                onClick={() => showHistory(prod)}
                                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg transition-colors duration-200 text-sm font-medium justify-center"
                              >
                                <History size={16} />
                                History
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>

                    {/* Totals Footer */}
                    <tfoot className="bg-gray-50 border-t border-gray-200">
                      <tr>
                        <td colSpan="5" className="py-4 px-6 text-right font-semibold text-gray-700">
                          Total Current Stock:
                        </td>
                        <td className="py-4 px-6 text-center">
                          <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-bold">
                            {getTotalStock().total} {getTotalStock().unit}
                          </span>
                        </td>
                        <td className="py-4 px-6"></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}

              {/* Mobile Cards */}
              {isMobile && !loading && products.length > 0 && (
                <div className="p-4 space-y-4">
                  {products.map((prod) => (
                    <div key={prod._id} className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div 
                          className="text-blue-600 hover:text-blue-700 cursor-pointer transition-colors duration-200 font-medium flex items-center gap-2"
                          onClick={() => showGradeImages(prod)}
                        >
                          <Eye size={16} />
                          {prod.name}
                        </div>
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                          prod.stock < 10 
                            ? "bg-red-100 text-red-700" 
                            : "bg-green-100 text-green-700"
                        }`}>
                          {prod.stock || 0} {prod.unit}
                        </span>
                      </div>

                      {/* Date */}
                      <div className="mb-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                        <input
                          type="date"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={quantities[prod._id]?.date || new Date().toISOString().split("T")[0]}
                          onChange={(e) => handleDateChange(prod._id, e.target.value)}
                          max={new Date().toISOString().split("T")[0]}
                        />
                      </div>

                      {/* Quantity Inputs */}
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div>
                          <label className="block text-sm font-medium text-green-700 mb-1">Add</label>
                          <input
                            type="number"
                            min="0"
                            className="w-full px-3 py-2 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-center"
                            value={quantities[prod._id]?.add || ""}
                            onChange={(e) => handleQuantityChange(prod._id, "add", e.target.value)}
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-red-700 mb-1">Remove</label>
                          <input
                            type="number"
                            min="0"
                            className="w-full px-3 py-2 border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-center"
                            value={quantities[prod._id]?.remove || ""}
                            onChange={(e) => handleQuantityChange(prod._id, "remove", e.target.value)}
                            placeholder="0"
                          />
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 pt-3 border-t border-gray-200">
                        <button
                          onClick={() => handleSave(prod._id)}
                          disabled={!quantities[prod._id]?.add && !quantities[prod._id]?.remove}
                          className="flex-1 flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-3 py-2 rounded-lg transition-colors duration-200 text-sm font-medium justify-center"
                        >
                          <Save size={16} />
                          Save
                        </button>
                        <button
                          onClick={() => showHistory(prod)}
                          className="flex-1 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg transition-colors duration-200 text-sm font-medium justify-center"
                        >
                          <History size={16} />
                          History
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Mobile Total */}
                  <div className="bg-blue-50 rounded-2xl p-4 border border-blue-200">
                    <div className="text-center">
                      <p className="text-sm font-medium text-blue-700">Total Current Stock</p>
                      <p className="text-2xl font-bold text-blue-800">
                        {getTotalStock().total} {getTotalStock().unit}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Empty State */}
              {!loading && products.length === 0 && selectedCategory && (
                <div className="text-center py-12">
                  <Package className="text-gray-400 text-4xl mx-auto mb-3" />
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">No Products Found</h3>
                  <p className="text-gray-500">No products available in this category</p>
                </div>
              )}
            </div>
          )}

          {/* Pagination */}
          {selectedCategory && totalPages > 1 && !loading && (
            <div className="flex justify-center items-center gap-4 mt-8">
              <button
                onClick={() => fetchProducts(selectedCategory, page - 1)}
                disabled={page === 1}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-xl text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-all duration-200"
              >
                <ArrowLeft size={16} />
                Previous
              </button>

              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">
                  Page <span className="font-semibold">{page}</span> of {totalPages}
                </span>
              </div>

              <button
                onClick={() => fetchProducts(selectedCategory, page + 1)}
                disabled={page === totalPages}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-xl text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-all duration-200"
              >
                Next
                <ArrowRight size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}