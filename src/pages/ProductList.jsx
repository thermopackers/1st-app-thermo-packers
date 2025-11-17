import React, { useEffect, useState, useCallback } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import InternalNavbar from "../components/InternalNavbar";
import axiosInstance from "../axiosInstance";
import toast from "react-hot-toast";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  FileText,
  Package,
  Hash,
  Percent,
  Archive,
  ArrowLeft,
  ArrowRight,
  Loader,
  Filter,
  Download
} from "lucide-react";

export default function ProductList() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [previewImage, setPreviewImage] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [totalProducts, setTotalProducts] = useState(0);
 
  const [searchParams, setSearchParams] = useSearchParams();
  const BASE_URL = import.meta.env.VITE_REACT_APP_API_URL;

  // Get page from URL, default to 1
  const pageFromUrl = parseInt(searchParams.get("page")) || 1;
  const [page, setPage] = useState(pageFromUrl);

  // Responsive detection
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/products-multer", {
        params: { search, page, limit: 10 },
      });
      setProducts(res.data.products);
      setTotalPages(res.data.pages);
      setTotalProducts(res.data.total || res.data.products.length);
    } catch (err) {
      console.error("Failed to fetch products", err);
      toast.error("Failed to load products");
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
    const result = await new Promise((resolve) => {
      const confirmed = window.confirm("Are you sure you want to delete this product?");
      resolve(confirmed);
    });
    
    if (!result) return;
    
    try {
      await axiosInstance.delete(`/products-multer/${id}`);
      toast.success("Product deleted successfully!");
      fetchProducts();
    } catch (err) {
      toast.error("Failed to delete product");
    }
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  const navigate = useNavigate();

  return (
    <>
      <InternalNavbar />

      {/* Main Container */}
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          
          {/* Header Section */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
            <div className="text-center lg:text-left">
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                📦 Product Catalog
              </h1>
              <p className="text-gray-600 mt-2">
                Manage and browse all sales products
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              {/* Add New Product */}
              <button
                onClick={() => navigate("/add-product")}
                className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-6 py-3 rounded-xl shadow-lg transition-all duration-200 flex items-center justify-center gap-2 font-semibold transform hover:scale-105"
              >
                <Plus size={20} />
                Add Product
              </button>
            </div>
          </div>

          {/* Search and Stats */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-200">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              
              {/* Search Input */}
              <div className="relative flex-1 max-w-2xl">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="text-gray-400" size={20} />
                </div>
                <input
                  type="text"
                  placeholder="Search products by name, description, HSN code..."
                  value={search}
                  onChange={handleSearchChange}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4">
                <div className="bg-blue-50 rounded-xl px-4 py-2 border border-blue-200">
                  <p className="text-sm text-blue-600 font-medium">Total Products</p>
                  <p className="text-2xl font-bold text-blue-700">{totalProducts}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Products Table/Cards */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
            {/* Table Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-3">
                <Package size={24} />
                Products ({products.length})
              </h2>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            )}

            {/* Desktop Table */}
            {!isMobile && !loading && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Images</th>
                      <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Internal Files</th>
                      <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Product Details</th>
                      <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Tax Info</th>
                      <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Stock</th>
                      <th className="py-4 px-6 text-center text-sm font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {products.map((p) => (
                      <tr key={p._id} className="hover:bg-gray-50 transition-colors duration-150">
                        {/* Product Images */}
                        <td className="py-4 px-6">
                          <div className="flex flex-wrap gap-2 max-w-[120px]">
                            {p.images?.length > 0 ? (
                              p.images.map((img, i) => (
                                <img
                                  key={i}
                                  src={img}
                                  alt={`${p.name} ${i + 1}`}
                                  onClick={() => setPreviewImage(img.startsWith("http") ? img : `${BASE_URL}${img}`)}
                                  className="w-12 h-12 object-cover rounded-lg cursor-pointer hover:scale-110 transition-transform duration-200 border border-gray-300"
                                />
                              ))
                            ) : p.image ? (
                              <img
                                src={`${BASE_URL}${p.image}`}
                                alt={p.name}
                                onClick={() => setPreviewImage(p.image.startsWith("http") ? p.image : `${BASE_URL}${p.image}`)}
                                className="w-12 h-12 object-cover rounded-lg cursor-pointer hover:scale-110 transition-transform duration-200 border border-gray-300"
                              />
                            ) : (
                              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                                <Package className="text-gray-400" size={20} />
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Internal Files */}
                        <td className="py-4 px-6">
                          <div className="flex flex-wrap gap-2 max-w-[120px]">
                            {p.internalImages?.length > 0 ? (
                              p.internalImages.map((file, i) => (
                                file.endsWith(".pdf") ? (
                                  <a
                                    key={i}
                                    href={file}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 bg-red-100 hover:bg-red-200 text-red-700 px-2 py-1 rounded-lg text-xs font-medium transition-colors duration-200"
                                  >
                                    <FileText size={12} />
                                    PDF
                                  </a>
                                ) : (
                                  <img
                                    key={i}
                                    src={file}
                                    alt={`${p.name} internal ${i + 1}`}
                                    onClick={() => setPreviewImage(file)}
                                    className="w-12 h-12 object-cover rounded-lg cursor-pointer hover:scale-110 transition-transform duration-200 border border-gray-300"
                                  />
                                )
                              ))
                            ) : (
                              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                                <Archive className="text-gray-400" size={20} />
                              </div>
                            )}
                          </div>
                        </td>

                     {/* Product Details */}
<td className="py-4 px-6">
  <div className="space-y-2">
    <button
      onClick={() => navigate(`/customers?product=${encodeURIComponent(p.name)}`)}
      className="font-semibold text-lg text-blue-600 hover:underline cursor-pointer text-left"
    >
      {p.name}
    </button>
    <div className="flex items-center gap-2 text-sm text-gray-600">
      <span className="text-gray-700">Unit:</span>
      <span>{p.unit || "No unit"}</span>
    </div>
    {p.description && (<>
      <span className="text-gray-700 font-bold">Internal Product Desc:</span>
      <p className="text-sm text-gray-600 line-clamp-2" title={p.description}>
        {p.description}
      </p>
    </>
    )}
  </div>
</td>

                        {/* Tax Information */}
                        <td className="py-4 px-6">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                        <span className="text-gray-700">HSN:</span>
                              <span className="text-sm font-medium text-gray-700">
                                {p.hsnCode || "—"}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                        <span className="text-gray-700">GST:</span>
                              <span className="text-sm font-medium text-gray-700">
                                {p.gstPercent != null ? `${p.gstPercent}%` : "—"}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Stock Status */}
                        <td className="py-4 px-6">
                          <span
                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold ${
                              p.quantity > 0 
                                ? "bg-green-100 text-green-700" 
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {p.quantity > 0 ? (
                              <>
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                In Stock
                              </>
                            ) : (
                              <>
                                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                Out of Stock
                              </>
                            )}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-6">
                          <div className="flex flex-col gap-2">
                            <Link
                              to={`/products/edit/${p._id}`}
                              className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 rounded-lg transition-colors duration-200 text-sm font-medium"
                            >
                              <Edit size={16} />
                              Edit
                            </Link>
                            <button
                              onClick={() => handleDelete(p._id)}
                              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg transition-colors duration-200 text-sm font-medium"
                            >
                              <Trash2 size={16} />
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Mobile Cards */}
            {isMobile && !loading && (
              <div className="p-4 space-y-4">
                {products.map((p) => (
                  <div key={p._id} className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
                {/* Header */}
<div className="flex items-start justify-between mb-3">
  <div className="flex-1">
    <button
      onClick={() => navigate(`/customers?product=${encodeURIComponent(p.name)}`)}
      className="font-bold text-gray-800 text-lg mb-1 hover:text-blue-600 hover:underline cursor-pointer text-left"
    >
      {p.name}
    </button>
    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
      <span className="text-gray-700">Unit:</span>
      <span>{p.unit || "No unit"}</span>
    </div>
  </div>
  <span
    className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
      p.quantity > 0 
        ? "bg-green-100 text-green-700" 
        : "bg-red-100 text-red-700"
    }`}
  >
    {p.quantity > 0 ? "In Stock" : "Out of Stock"}
  </span>
</div>

                    {/* Description */}
                    {p.description && (<>
                                              <span className="text-gray-700 font-bold">Internal Product Desc:</span>

                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {p.description}
                      </p></>
                    )}

                    {/* Tax Info */}
                    <div className="flex items-center gap-4 mb-3 text-sm">
                      <div className="flex items-center gap-1">
                        <span className="text-gray-700">HSN:</span>
                        <span className="text-gray-700">{p.hsnCode || "—"}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-gray-700">GST:</span>
                        <span className="text-gray-700">{p.gstPercent != null ? `${p.gstPercent}%` : "—"}</span>
                      </div>
                    </div>

                    {/* Images */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      {/* Product Images */}
                      <div>
                        <p className="text-xs text-gray-500 mb-2">Product Images</p>
                        <div className="flex flex-wrap gap-1">
                          {p.images?.length > 0 ? (
                            p.images.slice(0, 2).map((img, i) => (
                              <img
                                key={i}
                                src={img}
                                alt={`${p.name} ${i + 1}`}
                                onClick={() => setPreviewImage(img.startsWith("http") ? img : `${BASE_URL}${img}`)}
                                className="w-10 h-10 object-cover rounded-lg cursor-pointer border border-gray-300"
                              />
                            ))
                          ) : p.image ? (
                            <img
                              src={`${BASE_URL}${p.image}`}
                              alt={p.name}
                              onClick={() => setPreviewImage(p.image.startsWith("http") ? p.image : `${BASE_URL}${p.image}`)}
                              className="w-10 h-10 object-cover rounded-lg cursor-pointer border border-gray-300"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                              <Package className="text-gray-400" size={16} />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Internal Files */}
                      <div>
                        <p className="text-xs text-gray-500 mb-2">Internal Files</p>
                        <div className="flex flex-wrap gap-1">
                          {p.internalImages?.length > 0 ? (
                            p.internalImages.slice(0, 2).map((file, i) => (
                              file.endsWith(".pdf") ? (
                                <a
                                  key={i}
                                  href={file}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 bg-red-100 hover:bg-red-200 text-red-700 px-2 py-1 rounded text-xs font-medium"
                                >
                                  <FileText size={10} />
                                  PDF
                                </a>
                              ) : (
                                <img
                                  key={i}
                                  src={file}
                                  alt={`${p.name} internal ${i + 1}`}
                                  onClick={() => setPreviewImage(file)}
                                  className="w-10 h-10 object-cover rounded-lg cursor-pointer border border-gray-300"
                                />
                              )
                            ))
                          ) : (
                            <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                              <Archive className="text-gray-400" size={16} />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-3 border-t border-gray-200">
                      <Link
                        to={`/products/edit/${p._id}`}
                        className="flex-1 flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 rounded-lg transition-colors duration-200 text-sm font-medium justify-center"
                      >
                        <Edit size={16} />
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(p._id)}
                        className="flex-1 flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg transition-colors duration-200 text-sm font-medium justify-center"
                      >
                        <Trash2 size={16} />
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Empty State */}
            {!loading && products.length === 0 && (
              <div className="text-center py-12">
                <div className="bg-gray-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Package className="text-gray-400 text-2xl" />
                </div>
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No Products Found</h3>
                <p className="text-gray-500 max-w-md mx-auto mb-6">
                  {search ? "Try adjusting your search criteria" : "Get started by adding your first product"}
                </p>
                {!search && (
                  <button
                    onClick={() => navigate("/products/add")}
                    className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-6 py-3 rounded-xl shadow-lg transition-all duration-200 flex items-center gap-2 font-semibold mx-auto"
                  >
                    <Plus size={20} />
                    Add First Product
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col items-center justify-center gap-4 mt-8">
              {/* Page Info */}
              <div className="text-sm text-gray-600">
                Page <span className="font-semibold text-blue-600">{page}</span> of {totalPages}
              </div>

              {/* Pagination Controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-xl text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-all duration-200"
                >
                  <ArrowLeft size={16} />
                  Previous
                </button>

                {/* Page Numbers */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((p) => p === 1 || p === totalPages || (p >= page - 1 && p <= page + 1))
                    .map((p, idx, arr) => (
                      <React.Fragment key={p}>
                        {idx > 0 && p - arr[idx - 1] > 1 && (
                          <span className="px-2 text-gray-400">...</span>
                        )}
                        <button
                          onClick={() => handlePageChange(p)}
                          className={`w-10 h-10 rounded-xl border transition-all duration-200 font-medium ${
                            page === p
                              ? "bg-blue-600 text-white border-blue-600 shadow-lg"
                              : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                          }`}
                        >
                          {p}
                        </button>
                      </React.Fragment>
                    ))}
                </div>

                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === totalPages}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-xl text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-all duration-200"
                >
                  Next
                  <ArrowRight size={16} />
                </button>
              </div>

              {/* Go to Page */}
              <div className="flex items-center gap-2 mt-2">
                <span className="text-sm text-gray-600">Go to page:</span>
                <input
                  type="number"
                  min="1"
                  max={totalPages}
                  value={page}
                  onChange={(e) => {
                    const value = Number(e.target.value);
                    if (value >= 1 && value <= totalPages) {
                      handlePageChange(value);
                    }
                  }}
                  className="w-20 border border-gray-300 rounded-lg px-3 py-2 text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Image Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-4xl w-full max-h-[90vh]">
            <img
              src={previewImage}
              alt="Preview"
              className="w-full h-auto max-h-[80vh] object-contain rounded-2xl shadow-2xl"
            />
            <button
              className="absolute top-4 right-4 bg-red-500 hover:bg-red-600 text-white w-10 h-10 rounded-full flex items-center justify-center text-xl font-bold transition-all duration-200 transform hover:scale-110 shadow-lg"
              onClick={() => setPreviewImage(null)}
            >
              ×
            </button>
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-4 py-2 rounded-lg text-sm">
              Click anywhere to close
            </div>
          </div>
        </div>
      )}
    </>
  );
}