import { useEffect, useRef, useState } from "react";
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
  const [suppliers, setSuppliers] = useState([]);
const [selectedCategory, setSelectedCategory] = useState("");
const [selectedSupplier, setSelectedSupplier] = useState(null);
const detailRef = useRef(null);
  const navigate = useNavigate();

  const fetchSuppliers = async (category) => {
  try {
    const res = await axiosInstance.get(`/suppliers?category=${category}`);
    setSuppliers(res.data.data);
    setSelectedCategory(category);
    setSelectedSupplier(null); // Reset selected supplier
  } catch (err) {
    toast.error("Failed to load suppliers");
  }
};

const handleCategoryClick = (category) => {
  fetchSuppliers(category);
};

  useEffect(() => {
    fetchProducts();
  }, [page, query]);

  useEffect(() => {
  if (selectedSupplier && detailRef.current) {
    detailRef.current.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }
}, [selectedSupplier]);

useEffect(() => {
  if (selectedCategory && detailRef.current) {
    detailRef.current.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }
}, [selectedCategory]);


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

  const handleFilePreview = (file) => {
  if (!file?.url) return;

  const isImage = file.url.match(/\.(jpeg|jpg|png|gif|webp)$/i);
  const isPdf = file.url.match(/\.pdf$/i);

  if (isImage) {
    Swal.fire({
      imageUrl: file.url,
      imageAlt: file.filename || "File Preview",
      showCloseButton: true,
      showConfirmButton: false,
      width: "auto",
    });
  } else if (isPdf) {
    Swal.fire({
      html: `<iframe src="${file.url}" width="100%" height="500px"></iframe>`,
      width: "80%",
      showCloseButton: true,
      showConfirmButton: false,
    });
  } else {
    Swal.fire("Unsupported file type", "", "error");
  }
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
                    <th className="p-3">Current Stock in Hand</th>
                  <th className="p-3">Description</th>
                  <th className="p-3">Product Sheet Images</th>
                      <th className="p-3">Internal Product Sheet Images</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
              {products.map((prod) => (
  <tr 
    key={prod._id} 
    className={`border-t hover:bg-gray-50 text-center align-top ${
      prod.stock < 10 ? 'bg-red-300' : ''
    }`}
  >
                    <td className="p-3">{prod.name}</td>
                    <td className="p-3">{prod.unit}</td>
<td className="p-3">
  {prod.category?.name ? (
    <span
      className="text-blue-600 hover:underline cursor-pointer"
      onClick={() => handleCategoryClick(prod.category.name)}
    >
      {prod.category.name}
    </span>
  ) : (
    "—"
  )}
</td>
                    <td className="p-3">{prod.hsnCode}</td>
                    <td className="p-3">{prod.gstPercent}</td>
                    <td className="p-3">₹ {prod.price}</td>
<td className="p-3">
  <span className={prod.stock < 10 ? 'text-red-600 font-semibold' : ''}>
    {prod.stock || 0} {prod.unit}
  </span>
</td>                    <td className="p-3 max-w-xs text-left">{prod.description}</td>
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
          {/* Supplier Details Section */}
{selectedCategory && (
  <div className="mt-8 bg-white p-4 rounded-xl shadow-md">
    <h3 className="text-lg font-bold mb-4">
      Suppliers in {selectedCategory}
     <button
  onClick={() => {
    setSelectedCategory("");
    setSelectedSupplier(null);

    // scroll back to top after reset
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }}
  className="ml-4 text-red-200 px-2 py-1 rounded bg-red-600 text-sm font-normal"
>
  Close
</button>

    </h3>

    {suppliers.length > 0 ? (
      <div className="overflow-x-auto">
        <table className="w-full border text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="border px-2 py-1">Name</th>
              <th className="border px-2 py-1">Address</th>
              <th className="border px-2 py-1">Phone</th>
            </tr>
          </thead>
          <tbody>
            {suppliers.map((s) => (
              <tr
                key={s._id}
               onClick={() => setSelectedSupplier(s)
              }
                className="hover:bg-gray-50 cursor-pointer"
              >
                <td className="border px-2 py-1 text-blue-700">{s.name}</td>
                <td className="border px-2 py-1 text-blue-700">{s.address}</td>
                <td className="border px-2 py-1 text-blue-700">{s.phone}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ) : (
      <p className="text-gray-500">No suppliers in this category</p>
    )}

    <div ref={detailRef}>
      {selectedSupplier && (
        <div className="mt-4 p-4 border rounded bg-gray-50 shadow-md">
          <h4 className="font-bold mb-2">Supplier Details</h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            <p><strong>Name:</strong> {selectedSupplier.name}</p>
            <p><strong>Category:</strong> {selectedSupplier.vendorCategory}</p>
            <p><strong>Email:</strong> {selectedSupplier.email}</p>
            <p><strong>GST:</strong> {selectedSupplier.gstNumber}</p>
            <p><strong>Phone:</strong> {selectedSupplier.phone}</p>
            <p className="sm:col-span-2">
              <strong>Address:</strong> {selectedSupplier.address}
            </p>

            {/* Banking Details */}
            <p><strong>Acc Name:</strong> {selectedSupplier.accountName}</p>
            <p><strong>Bank Name:</strong> {selectedSupplier.bankName}</p>
            <p><strong>Acc No:</strong> {selectedSupplier.accountNumber}</p>
            <p><strong>IFSC:</strong> {selectedSupplier.ifscCode}</p>

            {/* Files */}
            {selectedSupplier.files?.length > 0 && (
              <div className="sm:col-span-2 mt-2">
                <strong>Files:</strong>
                <div className="flex flex-wrap gap-2 mt-1">
                  {selectedSupplier.files.map((f, i) => {
                    const isImage = f.url.match(/\.(jpeg|jpg|png|gif|webp)$/i);
                    const isPdf = f.url.match(/\.pdf$/i);
                    return (
                      <div
                        key={i}
                        onClick={() => handleFilePreview(f)}
                        className="cursor-pointer border rounded p-1 w-24 h-24 flex items-center justify-center bg-gray-100 hover:bg-gray-200"
                      >
                        {isImage ? (
                          <img
                            src={f.url}
                            alt={f.filename || `File ${i + 1}`}
                            className="w-full h-full object-cover rounded"
                          />
                        ) : isPdf ? (
                          <span className="text-red-600 font-bold">PDF</span>
                        ) : (
                          <span className="text-gray-500">File</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Cheque Files */}
            {selectedSupplier.chequeFiles?.length > 0 && (
              <div className="sm:col-span-2 mt-2">
                <strong>Cheque Files:</strong>
                <div className="flex flex-wrap gap-2 mt-1">
                  {selectedSupplier.chequeFiles.map((f, i) => {
                    const isImage = f.url.match(/\.(jpeg|jpg|png|gif|webp)$/i);
                    const isPdf = f.url.match(/\.pdf$/i);
                    return (
                      <div
                        key={i}
                        onClick={() => handleFilePreview(f)}
                        className="cursor-pointer border rounded p-1 w-24 h-24 flex items-center justify-center bg-gray-100 hover:bg-gray-200"
                      >
                        {isImage ? (
                          <img
                            src={f.url}
                            alt={f.filename || `Cheque ${i + 1}`}
                            className="w-full h-full object-cover rounded"
                          />
                        ) : isPdf ? (
                          <span className="text-red-600 font-bold">PDF</span>
                        ) : (
                          <span className="text-gray-500">File</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => setSelectedSupplier(null)}
            className="mt-3 bg-red-600 text-white px-3 py-1 rounded"
          >
            Close Details
          </button>
        </div>
      )}
    </div>
  </div>
)}
        </div>
      </div>
    </>
  );
}
