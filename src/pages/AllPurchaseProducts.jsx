import { useEffect, useState } from "react";
import axiosInstance from "../axiosInstance";
import toast from "react-hot-toast";
import InternalNavbar from "../components/InternalNavbar";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

export default function AllPurchaseProducts() {
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchProducts();
  }, [page, query]);

  const fetchProducts = async () => {
    try {
      const res = await axiosInstance.get(`/purchase-products?page=${page}&limit=10&search=${query}`);
      setProducts(res.data.data);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      toast.error("Failed to fetch products");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    await axiosInstance.delete(`/purchase-products/${id}`);
    toast.success("Deleted");
    fetchProducts();
  };

  const handleSearch = () => {
    setPage(1);
    setQuery(search);
  };

  return (
    <>
      <InternalNavbar />
      <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">📦 All Purchase Products</h2>

          {/* 🔍 Search Input */}
          <div className="mb-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <input
              type="text"
              placeholder="Search by product name..."
              className="border border-gray-300 px-4 py-2 rounded-lg shadow-sm w-full sm:w-72"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <button
              onClick={handleSearch}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Search
            </button>
          </div>

          {/* 🧾 Product Table */}
          <div className="overflow-x-auto bg-white rounded-xl shadow-md">
            <table className="min-w-full table-auto text-sm text-gray-700">
              <thead className="bg-gray-100 text-gray-800 text-center">
                <tr>
                  <th className="p-3">Name</th>
                  <th className="p-3">Unit</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">HSN</th>
                  <th className="p-3">GST %</th>
                  <th className="p-3">Price</th>
                  <th className="p-3">Description</th>
                  <th className="p-3">Product Sheet Images</th>
                      <th className="p-3">Internal Product Sheet Images</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((prod) => (
                  <tr key={prod._id} className="border-t hover:bg-gray-50 text-center align-top">
                    <td className="p-3">{prod.name}</td>
                    <td className="p-3">{prod.unit}</td>
                    <td className="p-3">{prod.category?.name || "—"}</td>
                    <td className="p-3">{prod.hsnCode}</td>
                    <td className="p-3">{prod.gstPercent}</td>
                    <td className="p-3">₹ {prod.price}</td>
                    <td className="p-3 max-w-xs text-left">{prod.description}</td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-2 justify-center">
                        {prod.files?.map((file, index) => {
                          const fileUrl = typeof file === "string" ? file : file?.url || "";
                          const isPDF = fileUrl.toLowerCase().includes(".pdf");

                          return (
                            <div
                              key={index}
                              className="w-12 h-12 border rounded-lg flex items-center justify-center bg-gray-100 cursor-pointer overflow-hidden"
                            onClick={() => {
  if (!fileUrl) return;

  const isMobile = window.innerWidth < 768; // treat below 768px as mobile

  if (isMobile && prod.files.length > 1) {
    // Show all images or PDFs in a single modal for mobile
    const content = prod.files
      .map((f, i) => {
        const url = typeof f === "string" ? f : f?.url || "";
        const ext = url.toLowerCase();

        if (ext.includes(".pdf")) {
          return `<div class="mb-4"><iframe src="${url}" style="width:100%; height:400px;" frameborder="0"></iframe></div>`;
        }

        return `<div class="mb-4"><img src="${url}" alt="file-${i}" style="max-width:100%; border-radius:8px;" onerror="this.src='/broken-image.png'"/></div>`;
      })
      .join("");

    Swal.fire({
      html: `<div style="max-height:80vh; overflow-y:auto;">${content}</div>`,
      width: '95%',
      showCloseButton: true,
      showConfirmButton: false,
      background: "#f9fafb",
      customClass: {
        popup: "rounded-xl shadow-lg",
      },
    });

  } else {
    // Default individual preview logic (unchanged)
    if (isPDF) {
      Swal.fire({
        html: `<iframe src="${fileUrl}" width="100%" height="500px" style="border:none;"></iframe>`,
        width: '90%',
        showCloseButton: true,
        showConfirmButton: false,
        background: "#f9fafb",
        customClass: {
          popup: "rounded-xl shadow-lg",
        },
      });
    } else {
      Swal.fire({
        imageUrl: fileUrl,
        imageAlt: "Product Image",
        showCloseButton: true,
        showConfirmButton: false,
        background: "#f9fafb",
        customClass: {
          popup: "rounded-xl shadow-lg",
        },
      });
    }
  }
}}

                            >
                              {isPDF ? (
                                <span className="text-2xl text-red-600">📄</span>
                              ) : (
                                <img
                                  src={fileUrl}
                                  alt={`file-${index}`}
                                  className="object-cover w-full h-full"
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = "/broken-image.png";
                                  }}
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </td>
                     {/* 🆕 Internal Images column */}
      <td className="p-3">
        <div className="flex flex-wrap gap-2 justify-center">
          {prod.internalImages?.map((file, index) => {
            const fileUrl = typeof file === "string" ? file : file?.url || "";
            const isPDF = fileUrl.toLowerCase().includes(".pdf");

            return (
              <div
                key={index}
                className="w-12 h-12 border rounded-lg flex items-center justify-center bg-gray-100 cursor-pointer overflow-hidden"
onClick={() => {
  if (!fileUrl) return;

  const isMobile = window.innerWidth < 768;

  if (isMobile && prod.internalImages.length > 1) {
    const content = prod.internalImages
      .map((f, i) => {
        const url = typeof f === "string" ? f : f?.url || "";
        const ext = url.toLowerCase();

        if (ext.includes(".pdf")) {
          return `<div class="mb-4"><iframe src="${url}" style="width:100%; height:400px;" frameborder="0"></iframe></div>`;
        }

        return `<div class="mb-4"><img src="${url}" alt="internal-${i}" style="max-width:100%; border-radius:8px;" onerror="this.src='/broken-image.png'"/></div>`;
      })
      .join("");

    Swal.fire({
      html: `<div style="max-height:80vh; overflow-y:auto;">${content}</div>`,
      width: "95%",
      showCloseButton: true,
      showConfirmButton: false,
      background: "#f9fafb",
      customClass: { popup: "rounded-xl shadow-lg" },
    });
  } else {
    if (isPDF) {
      Swal.fire({
        html: `<iframe src="${fileUrl}" width="100%" height="500px" style="border:none;"></iframe>`,
        width: "90%",
        showCloseButton: true,
        showConfirmButton: false,
        background: "#f9fafb",
        customClass: { popup: "rounded-xl shadow-lg" },
      });
    } else {
      Swal.fire({
        imageUrl: fileUrl,
        imageAlt: "Internal Image",
        showCloseButton: true,
        showConfirmButton: false,
        background: "#f9fafb",
        customClass: { popup: "rounded-xl shadow-lg" },
      });
    }
  }
}}
              >
                {isPDF ? (
                  <span className="text-2xl text-blue-600">📄</span>
                ) : (
                  <img
                    src={fileUrl}
                    alt={`internal-${index}`}
                    className="object-cover w-full h-full"
                    onError={(e) => (e.target.src = "/broken-image.png")}
                  />
                )}
              </div>
            );
          })}
        </div>
      </td>
                    <td className="p-3 space-x-2">
                      <button
                        onClick={() => navigate(`/purchase-products/edit/${prod._id}`)}
                        className="text-blue-600 hover:underline"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete(prod._id)}
                        className="text-red-600 hover:underline"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
                {products.length === 0 && (
                  <tr>
                    <td colSpan="8" className="text-center p-4 text-gray-500">
                      No purchase products found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* 🔄 Pagination */}
          <div className="mt-8 flex flex-wrap justify-center items-center gap-2 text-sm">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50"
            >
              ◀ Prev
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
              <button
                key={pg}
                onClick={() => setPage(pg)}
                className={`px-4 py-2 rounded-lg border ${
                  pg === page
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-800 hover:bg-blue-100"
                }`}
              >
                {pg}
              </button>
            ))}

            <button
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={page === totalPages}
              className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50"
            >
              Next ▶
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
