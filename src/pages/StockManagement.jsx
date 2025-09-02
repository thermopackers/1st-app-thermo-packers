// src/pages/StockManagement.jsx
import { useEffect, useState } from "react";
import axiosInstance from "../axiosInstance";
import InternalNavbar from "../components/InternalNavbar";
import toast from "react-hot-toast";
import Swal from "sweetalert2";

export default function StockManagement() {
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [products, setProducts] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [page, setPage] = useState(1);          // 🆕 pagination
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await axiosInstance.get("/categories");
      setCategories(res.data);
    } catch (err) {
      toast.error("Failed to load categories");
    }
  };

  const fetchProducts = async (categoryId, pg = 1) => {
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
    }
  };

  const handleQuantityChange = (id, type, value) => {
    setQuantities((prev) => ({
      ...prev,
      [id]: { ...prev[id], [type]: Number(value) }
    }));
  };

  const handleSave = async (id) => {
    const { add = 0, remove = 0 } = quantities[id] || {};

    if (!add && !remove) {
      toast.error("Please enter a quantity to add or remove");
      return;
    }

    const netChange = add - remove;

    const result = await Swal.fire({
      title: "Confirm Stock Update",
      html: `
        <div style="text-align:left">
          <p><b>Product:</b> ${products.find((p) => p._id === id)?.name}</p>
          <p><b>Add:</b> ${add || 0}</p>
          <p><b>Remove:</b> ${remove || 0}</p>
          <p><b>Net Change:</b> ${netChange >= 0 ? "+" + netChange : netChange}</p>
        </div>
      `,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "✅ Yes, update",
      cancelButtonText: "❌ Cancel",
      confirmButtonColor: "#16a34a",
      cancelButtonColor: "#dc2626",
    });

    if (!result.isConfirmed) return;

    try {
      const res = await axiosInstance.put(`/purchase-products/${id}/stock`, { add, remove });

      toast.success(`Stock updated. Current stock: ${res.data.stock}`);

      setProducts((prev) =>
        prev.map((p) => (p._id === id ? { ...p, stock: res.data.stock } : p))
      );

      setQuantities((prev) => ({ ...prev, [id]: { add: 0, remove: 0 } }));
    } catch (err) {
      toast.error("Failed to update stock");
    }
  };

  return (
    <>
      <InternalNavbar />
      <div className="p-6">
        <h2 className="text-2xl font-bold text-center mb-6">📊 Stock Management</h2>

        {/* Category filter */}
        <div className="mb-6 flex justify-center">
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              fetchProducts(e.target.value, 1); // reset to page 1
            }}
            className="border px-4 py-2 rounded-lg"
          >
            <option value="">-- Select Category --</option>
            {categories.map((cat) => (
              <option key={cat._id} value={cat._id}>{cat.name}</option>
            ))}
          </select>
        </div>

        {/* Product Table */}
        {products.length > 0 ? (
          <>
            <div className="overflow-x-auto bg-white rounded-xl shadow-md">
              <table className="min-w-full table-auto text-sm text-gray-700">
                <thead className="bg-gray-100 text-gray-800 text-center">
                  <tr>
                    <th className="p-3">Grade Name</th>
                    <th className="p-3">Add Quantity</th>
                    <th className="p-3">Remove Quantity</th>
                    <th className="p-3">Current Stock</th>
                    <th className="p-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((prod) => (
                    <tr key={prod._id} className="border-t hover:bg-gray-50 text-center">
                      <td className="p-3">{prod.name}</td>
                      <td className="p-3">
                        <input
                          type="number"
                          className="border rounded px-2 py-1 w-24"
                          value={quantities[prod._id]?.add || ""}
                          onChange={(e) =>
                            handleQuantityChange(prod._id, "add", e.target.value)
                          }
                        />
                      </td>
                      <td className="p-3">
                        <input
                          type="number"
                          className="border rounded px-2 py-1 w-24"
                          value={quantities[prod._id]?.remove || ""}
                          onChange={(e) =>
                            handleQuantityChange(prod._id, "remove", e.target.value)
                          }
                        />
                      </td>
                      <td className="p-3">{prod.stock || 0}</td>
                      <td className="p-3">
                        <button
                          onClick={() => handleSave(prod._id)}
                          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                        >
                          💾 Save
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="mt-6 flex justify-center items-center gap-2 text-sm">
              <button
                onClick={() => fetchProducts(selectedCategory, page - 1)}
                disabled={page === 1}
                className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50"
              >
                ◀ Prev
              </button>

              <span className="px-4">
                Page {page} of {totalPages}
              </span>

              <button
                onClick={() => fetchProducts(selectedCategory, page + 1)}
                disabled={page === totalPages}
                className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50"
              >
                Next ▶
              </button>
            </div>
          </>
        ) : (
          selectedCategory && (
            <p className="text-center text-gray-500">No products found in this category.</p>
          )
        )}
      </div>
    </>
  );
}
