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
  const [page, setPage] = useState(1); // pagination
  const [totalPages, setTotalPages] = useState(1);
console.log("products",products);

  useEffect(() => {
    fetchCategories();
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
    const { add = 0, remove = 0, date } = quantities[id] || {};

    if (!add && !remove) {
      toast.error("Please enter a quantity to add or remove");
      return;
    }
      const chosenDate = date ? new Date(date) : new Date();
  const formattedDate = chosenDate.toISOString(); // Send as ISO string

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
      const res = await axiosInstance.put(`/purchase-products/${id}/stock`, {
        add,
        remove,
         date: formattedDate,
      });

      toast.success(`Stock updated. Current stock: ${res.data.stock}`);

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

  // 🔹 Show stock history with pagination inside Swal
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
    <table style="width:100%; text-align:left; border-collapse: collapse;">
      <tr><th>Date</th><th>Added</th><th>Removed</th><th>Stock After</th></tr>
      ${history
        .map(
          (h) => `
        <tr>
          <td>${formatDate(h.date)}</td>
          <td style="color:green;">+${h.added}</td>
          <td style="color:red;">-${h.removed}</td>
          <td><b>${h.newStock}</b></td>
        </tr>
      `
        )
        .join("")}
    </table>
    <div style="margin-top:10px; text-align:center;">
      <button id="prevBtn" ${page === 1 ? "disabled" : ""}>⬅ Prev</button>
      <span> Page ${page} of ${totalPages} </span>
      <button id="nextBtn" ${
        page === totalPages ? "disabled" : ""
      }>Next ➡</button>
    </div>
  `;
};

    await fetchHistory(1);

    Swal.fire({
      title: `📜 Stock History - ${prod.name}`,
      html: renderHistoryTable(),
      showConfirmButton: false,
      width: 650,
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
    if (!unit && p.unit) unit = p.unit; // take first non-empty unit
  });

  return { total, unit };
};

const showGradeImages = (prod) => {
  if (!prod.files || prod.files.length === 0) {
    Swal.fire({
      title: `${prod.name} - No Images`,
      text: "No images available for this grade.",
      icon: "info",
    });
    return;
  }

  Swal.fire({
    title: `Images - ${prod.name}`,
    html: `
      <div style="display: flex; flex-wrap: wrap; gap: 10px; justify-content: center;">
        ${prod.files
          .map(
            (file) => `
          <div style="border:1px solid #ddd; padding:5px; border-radius:8px;">
            <img src="${file.url}" alt="file" style="max-width:150px; max-height:150px; object-fit:cover; border-radius:6px;" />
          </div>
        `
          )
          .join("")}
      </div>
    `,
    showCloseButton: true, // ❌ close button
    showConfirmButton: false,
    width: 700,
  });
};


  return (
    <>
      <InternalNavbar />
      <div className="p-6">
        <h2 className="text-2xl font-bold text-center mb-6">
          📊 Stock Management
        </h2>

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
              <option key={cat._id} value={cat._id}>
                {cat.name}
              </option>
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
                        <th className="p-3">📅 Date</th>   {/* NEW */}
                    <th className="p-3">Grade Name</th>
                    <th className="p-3">Unit</th>
                    <th className="p-3">Material Purchased New</th>
                    <th className="p-3">Material Consumed</th>
                    <th className="p-3">Current Stock in Hand</th>
                    <th className="p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((prod) => (
                    <tr
                      key={prod._id}
                      className="border-t hover:bg-gray-50 text-center"
                    >
 <td className="p-3">
  <input
    type="date"
    className="border rounded px-2 py-1"
    value={
      quantities[prod._id]?.date ||
      new Date().toISOString().split("T")[0] // default = today
    }
    onChange={(e) => handleDateChange(prod._id, e.target.value)}
    max={new Date().toISOString().split("T")[0]} // ⛔ no future dates
  />
</td>


<td 
  className="p-3 text-blue-600 cursor-pointer underline"
  onClick={() => showGradeImages(prod)}
>
  {prod.name}
</td>
                      <td className="p-3">{prod.unit}</td>
                      <td className="p-3">
                        <input
                          type="number"
                          className="border rounded px-2 py-1 w-24"
                          value={quantities[prod._id]?.add || ""}
                          onChange={(e) =>
                            handleQuantityChange(
                              prod._id,
                              "add",
                              e.target.value
                            )
                          }
                        />
                      </td>
                      <td className="p-3">
                        <input
                          type="number"
                          className="border rounded px-2 py-1 w-24"
                          value={quantities[prod._id]?.remove || ""}
                          onChange={(e) =>
                            handleQuantityChange(
                              prod._id,
                              "remove",
                              e.target.value
                            )
                          }
                        />
                      </td>
                      <td className="p-3">{prod.stock || 0}</td>
                     <td className="p-3">
  <div className="flex flex-col sm:flex-row gap-2 justify-center">
    <button
      onClick={() => handleSave(prod._id)}
      className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 w-full sm:w-auto"
    >
      💾 Save
    </button>
    <button
      onClick={() => showHistory(prod)}
      className="bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 w-full sm:w-auto"
    >
      📜 View History
    </button>
  </div>
</td>

                    </tr>
                  ))}
                </tbody>
              {/* ✅ Totals Row */}
<tfoot>
  <tr className="bg-gray-200 font-bold text-center">
    <td colSpan="5" className="p-3 text-right">Total Current Stock in Hand:</td>
    <td className="p-3 text-left" colSpan="2">
      {getTotalStock().total} {getTotalStock().unit}
    </td>
  </tr>
</tfoot>

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
            <p className="text-center text-gray-500">
              No products found in this category.
            </p>
          )
        )}
      </div>
    </>
  );
}
