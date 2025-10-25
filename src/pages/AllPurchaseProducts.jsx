import { useEffect, useRef, useState } from "react";
import axiosInstance from "../axiosInstance";
import toast from "react-hot-toast";
import InternalNavbar from "../components/InternalNavbar";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
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
  DollarSign,
  Archive,
  Users,
  Phone,
  MapPin,
  Mail,
  Building,
  CreditCard,
  X,
  ArrowLeft,
  ArrowRight,
  Filter,
  Download,
  AlertTriangle
} from "lucide-react";

export default function AllPurchaseProducts() {
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [suppliers, setSuppliers] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [totalProducts, setTotalProducts] = useState(0);
  const detailRef = useRef(null);
  const navigate = useNavigate();

  // Responsive detection
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchSuppliers = async (category) => {
    try {
      const res = await axiosInstance.get(`/suppliers?category=${category}`);
      setSuppliers(res.data.data);
      setSelectedCategory(category);
      setSelectedSupplier(null);
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
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/purchase-products?page=${page}&limit=10&search=${query}`);
      setProducts(res.data.data);
      setTotalPages(res.data.totalPages);
      setTotalProducts(res.data.total || res.data.data.length);
    } catch (err) {
      toast.error("Failed to fetch products");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This action cannot be undone!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
      customClass: {
        popup: 'rounded-2xl'
      },
      background: '#f8fafc'
    });

    if (!result.isConfirmed) return;
    
    try {
      await axiosInstance.delete(`/purchase-products/${id}`);
      toast.success("Product deleted successfully");
      fetchProducts();
    } catch (err) {
      toast.error("Failed to delete product");
    }
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
        background: '#f8fafc',
        customClass: {
          popup: 'rounded-2xl'
        }
      });
    } else if (isPdf) {
      Swal.fire({
        html: `<iframe src="${file.url}" width="100%" height="500px" style="border-radius: 8px;"></iframe>`,
        width: "80%",
        showCloseButton: true,
        showConfirmButton: false,
        background: '#f8fafc',
        customClass: {
          popup: 'rounded-2xl'
        }
      });
    } else {
      Swal.fire("Unsupported file type", "", "error");
    }
  };

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
                📦 Purchase Products
              </h1>
              <p className="text-gray-600 mt-2">
                Manage and track all purchase products and suppliers
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              {/* Add New Product */}
              <button
                onClick={() => navigate("/add-purchase-product")}
                className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-6 py-3 rounded-xl shadow-lg transition-all duration-200 flex items-center justify-center gap-2 font-semibold transform hover:scale-105"
              >
                <Plus size={20} />
                Add Purchase Product
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
                  placeholder="Search products by name, category, HSN code..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
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
            {/* Header */}
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
                      <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Product Details</th>
                      <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Tax & Pricing</th>
                      <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Stock</th>
                      <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Files</th>
                      <th className="py-4 px-6 text-center text-sm font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {products.map((prod) => (
                      <tr key={prod._id} className={`hover:bg-gray-50 transition-colors duration-150 ${prod.stock < 10 ? 'bg-red-50 border-l-4 border-l-red-500' : ''}`}>
                        
                        {/* Product Details */}
                        <td className="py-4 px-6">
                          <div className="space-y-2">
                            <h3 className="font-semibold text-gray-800 text-lg">{prod.name}</h3>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                          <span>Unit:</span>
                              <span>{prod.unit}</span>
                            </div>
                            <div 
                              className="text-blue-600 hover:text-blue-700 cursor-pointer transition-colors duration-200 flex items-center gap-1 text-sm font-medium"
                              onClick={() => handleCategoryClick(prod.category?.name)}
                            >
                          <span>Category:</span>
                              {prod.category?.name || "—"}
                            </div>
                            {prod.description && (
                              <p className="text-sm text-gray-600 line-clamp-2">
                                {prod.description}
                              </p>
                            )}
                            {prod.comment && (
                              <p className="text-sm text-gray-500 italic line-clamp-2">
                                {prod.comment}
                              </p>
                            )}
                          </div>
                        </td>

                        {/* Tax & Pricing */}
                        <td className="py-4 px-6">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                          <span>HSN:</span>
                              <span className="text-sm font-medium text-gray-700">
                                {prod.hsnCode || "—"}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                          <span>GST:</span>
                              <span className="text-sm font-medium text-gray-700">
                                {prod.gstPercent || "—"}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                          <span>price:</span>
                              <span className="text-sm font-bold text-green-600">
                                ₹{prod.price}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Stock */}
                        <td className="py-4 px-6">
                          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold ${
                            prod.stock < 10 
                              ? "bg-red-100 text-red-700" 
                              : "bg-green-100 text-green-700"
                          }`}>
                            {prod.stock < 10 && <AlertTriangle size={14} />}
                            {prod.stock || 0} {prod.unit}
                          </div>
                        </td>

                        {/* Files */}
                        <td className="py-4 px-6">
                          <div className="space-y-3">
                            {/* Product Files */}
                            <div>
                              <p className="text-xs text-gray-500 mb-2">Product Files</p>
                              <div className="flex flex-wrap gap-2">
                                {prod.files?.map((file, index) => {
                                  const fileUrl = typeof file === "string" ? file : file?.url || "";
                                  const isPDF = fileUrl.toLowerCase().includes(".pdf");
                                  return (
                                    <div
                                      key={index}
                                      onClick={() => {
                                        if (!fileUrl) return;
                                        if (isPDF) {
                                          Swal.fire({
                                            html: `<iframe src="${fileUrl}" width="100%" height="500px" style="border:none; border-radius:8px;"></iframe>`,
                                            width: '90%',
                                            showCloseButton: true,
                                            showConfirmButton: false,
                                            background: "#f8fafc",
                                            customClass: { popup: "rounded-2xl" },
                                          });
                                        } else {
                                          Swal.fire({
                                            imageUrl: fileUrl,
                                            imageAlt: "Product Image",
                                            showCloseButton: true,
                                            showConfirmButton: false,
                                            background: "#f8fafc",
                                            customClass: { popup: "rounded-2xl" },
                                          });
                                        }
                                      }}
                                      className="w-12 h-12 border border-gray-300 rounded-lg flex items-center justify-center bg-gray-100 cursor-pointer hover:bg-gray-200 transition-colors duration-200 overflow-hidden"
                                    >
                                      {isPDF ? (
                                        <FileText size={20} className="text-red-500" />
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
                            </div>

                            {/* Internal Files */}
                            <div>
                              <p className="text-xs text-gray-500 mb-2">Internal Files</p>
                              <div className="flex flex-wrap gap-2">
                                {prod.internalImages?.map((file, index) => {
                                  const fileUrl = typeof file === "string" ? file : file?.url || "";
                                  const isPDF = fileUrl.toLowerCase().includes(".pdf");
                                  return (
                                    <div
                                      key={index}
                                      onClick={() => {
                                        if (!fileUrl) return;
                                        if (isPDF) {
                                          Swal.fire({
                                            html: `<iframe src="${fileUrl}" width="100%" height="500px" style="border:none; border-radius:8px;"></iframe>`,
                                            width: '90%',
                                            showCloseButton: true,
                                            showConfirmButton: false,
                                            background: "#f8fafc",
                                            customClass: { popup: "rounded-2xl" },
                                          });
                                        } else {
                                          Swal.fire({
                                            imageUrl: fileUrl,
                                            imageAlt: "Internal Image",
                                            showCloseButton: true,
                                            showConfirmButton: false,
                                            background: "#f8fafc",
                                            customClass: { popup: "rounded-2xl" },
                                          });
                                        }
                                      }}
                                      className="w-12 h-12 border border-gray-300 rounded-lg flex items-center justify-center bg-blue-100 cursor-pointer hover:bg-blue-200 transition-colors duration-200 overflow-hidden"
                                    >
                                      {isPDF ? (
                                        <FileText size={20} className="text-blue-500" />
                                      ) : (
                                        <img
                                          src={fileUrl}
                                          alt={`internal-${index}`}
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
                            </div>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-6">
                          <div className="flex flex-col gap-2">
                            <button
                              onClick={() => navigate(`/purchase-products/edit/${prod._id}`)}
                              className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 rounded-lg transition-colors duration-200 text-sm font-medium justify-center"
                            >
                              <Edit size={16} />
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(prod._id)}
                              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg transition-colors duration-200 text-sm font-medium justify-center"
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
                {products.map((prod) => (
                  <div key={prod._id} className={`bg-gray-50 rounded-2xl p-4 border border-gray-200 ${prod.stock < 10 ? 'border-l-4 border-l-red-500 bg-red-50' : ''}`}>
                    
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-800 text-lg mb-1">{prod.name}</h3>
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                          <span>Unit:</span>
                          <span>{prod.unit}</span>
                        </div>
                        <div 
                          className="text-blue-600 hover:text-blue-700 cursor-pointer transition-colors duration-200 flex items-center gap-1 text-sm font-medium mb-2"
                          onClick={() => handleCategoryClick(prod.category?.name)}
                        >
                          <span>Category:</span>
                          {prod.category?.name || "—"}
                        </div>
                      </div>
                      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                        prod.stock < 10 
                          ? "bg-red-100 text-red-700" 
                          : "bg-green-100 text-green-700"
                      }`}>
                        {prod.stock < 10 && <AlertTriangle size={12} />}
                        {prod.stock || 0} {prod.unit}
                      </div>
                    </div>

                    {/* Description */}
                    {prod.description && (
                      <>
                                    <span>Desc:</span>
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                        {prod.description}
                      </p>
                      </>
                    )}
                    {prod.comment && (
                      <>
                                                <span>Internal Desc:</span>
                      <p className="text-sm text-gray-500 italic mb-3 line-clamp-2">
                        {prod.comment}
                      </p>
                      </>
                    )}

                    {/* Tax & Pricing */}
                    <div className="flex items-center gap-4 mb-3 text-sm">
                      <div className="flex items-center gap-1">
                          <span>HSN:</span>
                        <span className="text-gray-700">{prod.hsnCode || "—"}</span>
                      </div>
                      <div className="flex items-center gap-1">
                          <span>GST:</span>
                        <span className="text-gray-700">{prod.gstPercent || "—"}</span>
                      </div>
                      <div className="flex items-center gap-1">
                          <span>PRICE:</span>
                        <span className="font-bold text-green-600">₹{prod.price}</span>
                      </div>
                    </div>

                    {/* Files */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      {/* Product Files */}
                      <div>
                        <p className="text-xs text-gray-500 mb-2">Product Files</p>
                        <div className="flex flex-wrap gap-1">
                          {prod.files?.slice(0, 2).map((file, index) => {
                            const fileUrl = typeof file === "string" ? file : file?.url || "";
                            const isPDF = fileUrl.toLowerCase().includes(".pdf");
                            return (
                              <div
                                key={index}
                                onClick={() => {
                                  if (!fileUrl) return;
                                  if (isPDF) {
                                    Swal.fire({
                                      html: `<iframe src="${fileUrl}" width="100%" height="400px" style="border:none; border-radius:8px;"></iframe>`,
                                      width: '95%',
                                      showCloseButton: true,
                                      showConfirmButton: false,
                                      background: "#f8fafc",
                                      customClass: { popup: "rounded-2xl" },
                                    });
                                  } else {
                                    Swal.fire({
                                      imageUrl: fileUrl,
                                      imageAlt: "Product Image",
                                      showCloseButton: true,
                                      showConfirmButton: false,
                                      background: "#f8fafc",
                                      customClass: { popup: "rounded-2xl" },
                                    });
                                  }
                                }}
                                className="w-10 h-10 border border-gray-300 rounded-lg flex items-center justify-center bg-gray-100 cursor-pointer overflow-hidden"
                              >
                                {isPDF ? (
                                  <FileText size={16} className="text-red-500" />
                                ) : (
                                  <img
                                    src={fileUrl}
                                    alt={`file-${index}`}
                                    className="object-cover w-full h-full"
                                  />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Internal Files */}
                      <div>
                        <p className="text-xs text-gray-500 mb-2">Internal Files</p>
                        <div className="flex flex-wrap gap-1">
                          {prod.internalImages?.slice(0, 2).map((file, index) => {
                            const fileUrl = typeof file === "string" ? file : file?.url || "";
                            const isPDF = fileUrl.toLowerCase().includes(".pdf");
                            return (
                              <div
                                key={index}
                                onClick={() => {
                                  if (!fileUrl) return;
                                  if (isPDF) {
                                    Swal.fire({
                                      html: `<iframe src="${fileUrl}" width="100%" height="400px" style="border:none; border-radius:8px;"></iframe>`,
                                      width: '95%',
                                      showCloseButton: true,
                                      showConfirmButton: false,
                                      background: "#f8fafc",
                                      customClass: { popup: "rounded-2xl" },
                                    });
                                  } else {
                                    Swal.fire({
                                      imageUrl: fileUrl,
                                      imageAlt: "Internal Image",
                                      showCloseButton: true,
                                      showConfirmButton: false,
                                      background: "#f8fafc",
                                      customClass: { popup: "rounded-2xl" },
                                    });
                                  }
                                }}
                                className="w-10 h-10 border border-gray-300 rounded-lg flex items-center justify-center bg-blue-100 cursor-pointer overflow-hidden"
                              >
                                {isPDF ? (
                                  <FileText size={16} className="text-blue-500" />
                                ) : (
                                  <img
                                    src={fileUrl}
                                    alt={`internal-${index}`}
                                    className="object-cover w-full h-full"
                                  />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-3 border-t border-gray-200">
                      <button
                        onClick={() => navigate(`/purchase-products/edit/${prod._id}`)}
                        className="flex-1 flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 rounded-lg transition-colors duration-200 text-sm font-medium justify-center"
                      >
                        <Edit size={16} />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(prod._id)}
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
                  {query ? "Try adjusting your search criteria" : "Get started by adding your first purchase product"}
                </p>
                {!query && (
                  <button
                    onClick={() => navigate("/purchase-products/add")}
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
          {totalPages > 1 && !loading && (
            <div className="flex justify-center items-center gap-4 mt-8">
              <button
                onClick={() => setPage(page - 1)}
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
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-xl text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-all duration-200"
              >
                Next
                <ArrowRight size={16} />
              </button>
            </div>
          )}

          {/* Supplier Details Section */}
          {selectedCategory && (
            <div ref={detailRef} className="mt-8 bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-white flex items-center gap-3">
                    <Users size={24} />
                    Suppliers in {selectedCategory}
                  </h3>
                  <button
                    onClick={() => {
                      setSelectedCategory("");
                      setSelectedSupplier(null);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="text-white hover:text-gray-200 p-2 rounded-lg transition-colors duration-200"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="p-6">
                {suppliers.length > 0 ? (
                  <div className="space-y-4">
                    {/* Suppliers List */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {suppliers.map((supplier) => (
                        <div
                          key={supplier._id}
                          onClick={() => setSelectedSupplier(supplier)}
                          className="bg-gray-50 hover:bg-blue-50 border border-gray-200 rounded-xl p-4 cursor-pointer transition-all duration-200 hover:shadow-md"
                        >
                          <h4 className="font-semibold text-gray-800 mb-2">{supplier.name}</h4>
                          <div className="space-y-1 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <MapPin size={14} />
                              <span className="line-clamp-1">{supplier.address}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Phone size={14} />
                              <span>{supplier.phone}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Selected Supplier Details */}
                    {selectedSupplier && (
                      <div className="mt-6 bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl p-6 border border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-lg font-bold text-gray-800">Supplier Details</h4>
                          <button
                            onClick={() => setSelectedSupplier(null)}
                            className="text-gray-500 hover:text-gray-700 transition-colors duration-200"
                          >
                            <X size={20} />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Basic Info */}
                          <div className="space-y-4">
                            <div>
                              <h5 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                <Users size={16} />
                                Basic Information
                              </h5>
                              <div className="space-y-2 text-sm">
                                <p><strong>Name:</strong> {selectedSupplier.name}</p>
                                <p><strong>Category:</strong> {selectedSupplier.vendorCategory}</p>
                                <p><strong>GST:</strong> {selectedSupplier.gstNumber || "—"}</p>
                              </div>
                            </div>

                            {/* Contact Info */}
                            <div>
                              <h5 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                <Phone size={16} />
                                Contact Information
                              </h5>
                              <div className="space-y-2 text-sm">
                                <p><strong>Email:</strong> {selectedSupplier.email || "—"}</p>
                                <p><strong>Phone:</strong> {selectedSupplier.phone}</p>
                                <p><strong>Address:</strong> {selectedSupplier.address}</p>
                              </div>
                            </div>
                          </div>

                          {/* Banking & Files */}
                          <div className="space-y-4">
                            {/* Banking Details */}
                            <div>
                              <h5 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                <CreditCard size={16} />
                                Banking Details
                              </h5>
                              <div className="space-y-2 text-sm">
                                <p><strong>Account Name:</strong> {selectedSupplier.accountName || "—"}</p>
                                <p><strong>Bank Name:</strong> {selectedSupplier.bankName || "—"}</p>
                                <p><strong>Account No:</strong> {selectedSupplier.accountNumber || "—"}</p>
                                <p><strong>IFSC Code:</strong> {selectedSupplier.ifscCode || "—"}</p>
                              </div>
                            </div>

                            {/* Files */}
                            {(selectedSupplier.files?.length > 0 || selectedSupplier.chequeFiles?.length > 0) && (
                              <div>
                                <h5 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                  <FileText size={16} />
                                  Documents
                                </h5>
                                <div className="space-y-3">
                                  {selectedSupplier.files?.length > 0 && (
                                    <div>
                                      <p className="text-sm font-medium text-gray-600 mb-2">Supplier Files</p>
                                      <div className="flex flex-wrap gap-2">
                                        {selectedSupplier.files.map((file, index) => (
                                          <div
                                            key={index}
                                            onClick={() => handleFilePreview(file)}
                                            className="w-16 h-16 border border-gray-300 rounded-lg flex items-center justify-center bg-white cursor-pointer hover:bg-gray-100 transition-colors duration-200 overflow-hidden"
                                          >
                                            {file.url.match(/\.pdf$/i) ? (
                                              <FileText size={20} className="text-red-500" />
                                            ) : (
                                              <img
                                                src={file.url}
                                                alt={file.filename || `File ${index + 1}`}
                                                className="object-cover w-full h-full"
                                              />
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {selectedSupplier.chequeFiles?.length > 0 && (
                                    <div>
                                      <p className="text-sm font-medium text-gray-600 mb-2">Cheque Files</p>
                                      <div className="flex flex-wrap gap-2">
                                        {selectedSupplier.chequeFiles.map((file, index) => (
                                          <div
                                            key={index}
                                            onClick={() => handleFilePreview(file)}
                                            className="w-16 h-16 border border-gray-300 rounded-lg flex items-center justify-center bg-white cursor-pointer hover:bg-gray-100 transition-colors duration-200 overflow-hidden"
                                          >
                                            {file.url.match(/\.pdf$/i) ? (
                                              <FileText size={20} className="text-blue-500" />
                                            ) : (
                                              <img
                                                src={file.url}
                                                alt={file.filename || `Cheque ${index + 1}`}
                                                className="object-cover w-full h-full"
                                              />
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="text-gray-400 text-4xl mx-auto mb-3" />
                    <p className="text-gray-500">No suppliers found in this category</p>
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