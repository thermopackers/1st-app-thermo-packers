import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import InternalNavbar from "../components/InternalNavbar";
import axiosInstance from "../axiosInstance";
import toast from "react-hot-toast";

export default function ProductList() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [previewImage, setPreviewImage] = useState(null);

  const [searchParams, setSearchParams] = useSearchParams();
  const BASE_URL = import.meta.env.VITE_REACT_APP_API_URL;

  // Get page from URL, default to 1
  const pageFromUrl = parseInt(searchParams.get("page")) || 1;
  const [page, setPage] = useState(pageFromUrl);

  const fetchProducts = useCallback(async () => {
      setLoading(true);
    try {
      const res = await axiosInstance.get("/products-multer", {
        params: { search, page, limit: 10 },
      });
      setProducts(res.data.products);
      setTotalPages(res.data.pages);
    } catch (err) {
      console.error("Failed to fetch products", err);
    } finally {
    setLoading(false);
  }
  }, [search, page]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchProducts();
    }, 300);
    return () => clearTimeout(timeout);
  }, [fetchProducts]);

  // Sync page state to URL
  useEffect(() => {
    setSearchParams({ page });
  }, [page, setSearchParams]);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    try {
      await axiosInstance.delete(`/products-multer/${id}`);
      toast.success("Product deleted successfully!")
      fetchProducts();
    } catch (err) {
      alert("Failed to delete product");
    }
  };
const handleSearchChange = (e) => {
  setSearch(e.target.value);
  setPage(1); // resets to page 1 when search changes
};
const handlePageChange = (newPage) => {
  setLoading(true);
  setPage(newPage);
};

  return (
    <>
      <InternalNavbar />

      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
        <div className="relative mb-4">
          
          <h2 className="text-3xl font-semibold text-center text-gray-800">All Products</h2>
        </div>

        <div className="mb-6">
          <input
            type="text"
            placeholder="🔍 Search products..."
            value={search}
onChange={handleSearchChange}
            className="w-full max-w-md mx-auto block border border-gray-300 rounded-md p-3 shadow-sm focus:outline-none focus:ring focus:border-blue-400"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full table-auto border-collapse text-sm sm:text-base rounded-lg overflow-hidden shadow-md">
            <thead className="bg-blue-100 text-gray-700">
              <tr>
                <th className="border px-3 py-2 text-left">Images</th>
                <th className="border px-3 py-2 text-left">Name</th>
                <th className="border px-3 py-2 text-left">Unit</th>
                <th className="border px-3 py-2 text-left">Stock Status</th>
                <th className="border px-3 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p._id} className="hover:bg-gray-50 transition-colors duration-200">
                  <td className="border p-2">
                    <div className="flex flex-wrap gap-2">
                      {p.images?.length > 0 ? (
                        p.images.map((img, i) => (
                          <img
                            key={i}
src={img}
                            alt={`${p.name} ${i}`}
onClick={() =>
  setPreviewImage(img.startsWith("http") ? img : `${BASE_URL}${img}`)
}
                            className="w-14 h-14 object-cover rounded-md cursor-pointer hover:scale-105 transition-transform duration-200"
                          />
                        ))
                      ) : p.image ? (
                        <img
                          src={`${BASE_URL}${p.image}`}
                          alt={p.name}
onClick={() =>
  setPreviewImage(p.image.startsWith("http") ? p.image : `${BASE_URL}${p.image}`)
}
                          className="w-16 h-16 object-cover rounded-md cursor-pointer hover:scale-105 transition-transform duration-200"
                        />
                      ) : (
                        <span className="italic text-gray-400">No image</span>
                      )}
                    </div>
                  </td>
                  <td className="border px-3 py-2">{p.name}</td>
                  <td className="border px-3 py-2">{p.unit}</td>
                  <td className="border px-3 py-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        p.quantity > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      }`}
                    >
                      {p.quantity > 0 ? "In Stock" : "Out of Stock"}
                    </span>
                  </td>
                  <td className="border px-3 py-2 space-x-2">
                    <Link to={`/products/edit/${p._id}`} className="text-blue-600 hover:underline">
                      Edit
                    </Link>
                    <button onClick={() => handleDelete(p._id)} className="text-red-600 hover:underline">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center p-6 text-gray-500 italic">
                    No products found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3 text-sm">
         <button
  disabled={page === 1}
  onClick={() => handlePageChange(page - 1)}
  className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 disabled:opacity-50 transition"
>
  ⬅️ Prev
</button>
          <span className="text-gray-700">
            Page <strong>{page}</strong> of <strong>{totalPages}</strong>
          </span>
        
<button
  disabled={page === totalPages}
  onClick={() => handlePageChange(page + 1)}
  className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 disabled:opacity-50 transition"
>
  Next ➡️
</button>
        </div>
      </div>

      {/* Image Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50"
          onClick={() => setPreviewImage(null)}
        >
          <img
            src={previewImage}
            alt="Preview"
            className="max-w-[90vw] max-h-[90vh] rounded-lg shadow-lg"
          />
        </div>
      )}
     {loading && (
  <div className="fixed inset-0 z-50 bg-[#000000c0] bg-opacity-40 flex items-center justify-center">
    <div className="flex flex-col items-center gap-3">
      <div className="w-14 h-14 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-white text-lg font-medium">Loading...</p>
    </div>
  </div>
)}


    </>
  );
}
