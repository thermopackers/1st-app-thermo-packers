import { useEffect, useState } from "react";
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
  MapPin,
  Building,
  Phone,
  Mail,
  Hash,
  CreditCard,
  Users,
  ArrowLeft,
  ArrowRight,
  Filter,
  Download,
  ExternalLink
} from "lucide-react";

export default function AllSuppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [totalSuppliers, setTotalSuppliers] = useState(0);
  const navigate = useNavigate();

  // Responsive detection
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetchSuppliers();
  }, [page, query]);

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/suppliers?page=${page}&limit=10&search=${query}`);
      setSuppliers(res.data.data);
      setTotalPages(res.data.totalPages);
      setTotalSuppliers(res.data.total || res.data.data.length);
    } catch (err) {
      toast.error("Failed to fetch suppliers");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    setQuery(search);
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
      await axiosInstance.delete(`/suppliers/${id}`);
      toast.success("Supplier deleted successfully");
      fetchSuppliers();
    } catch (err) {
      toast.error("Failed to delete supplier");
    }
  };

  const handleFilePreview = (files, title = "Files") => {
    if (!files || files.length === 0) {
      Swal.fire({
        title: "No Files",
        text: `No ${title.toLowerCase()} available`,
        icon: "info",
        customClass: { popup: 'rounded-2xl' },
        background: '#f8fafc'
      });
      return;
    }

    const isMobile = window.innerWidth < 768;
    
    if (isMobile && files.length > 1) {
      const content = files
        .map((file, i) => {
          const url = file?.url || "";
          const isPDF = url.toLowerCase().includes(".pdf");

          if (isPDF) {
            return `
              <div class="mb-6 p-4 bg-white rounded-xl shadow-sm border border-gray-200">
                <div class="flex items-center gap-3 mb-3">
                  <div class="bg-red-100 p-2 rounded-lg">
                    <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                  </div>
                  <span class="font-medium text-gray-800">PDF Document ${i + 1}</span>
                </div>
                <iframe src="${url}" class="w-full h-80 rounded-lg border border-gray-300"></iframe>
              </div>
            `;
          }

          return `
            <div class="mb-6 p-4 bg-white rounded-xl shadow-sm border border-gray-200">
              <div class="flex items-center gap-3 mb-3">
                <div class="bg-blue-100 p-2 rounded-lg">
                  <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                  </svg>
                </div>
                <span class="font-medium text-gray-800">Image ${i + 1}</span>
              </div>
              <img src="${url}" alt="File ${i + 1}" class="w-full h-auto rounded-lg border border-gray-300" onerror="this.src='/broken-image.png'" />
            </div>
          `;
        })
        .join("");

      Swal.fire({
        title: title,
        html: `<div class="max-h-[70vh] overflow-y-auto">${content}</div>`,
        width: '95%',
        showCloseButton: true,
        showConfirmButton: false,
        background: "#f8fafc",
        customClass: { popup: "rounded-2xl" },
      });
    } else {
      const file = files[0];
      const url = file?.url || "";
      const isPDF = url.toLowerCase().includes(".pdf");

      if (isPDF) {
        Swal.fire({
          html: `
            <div class="p-4">
              <div class="flex items-center gap-3 mb-4">
                <div class="bg-red-100 p-2 rounded-lg">
                  <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                </div>
                <span class="font-semibold text-gray-800">PDF Document</span>
              </div>
              <iframe src="${url}" class="w-full h-96 rounded-lg border border-gray-300"></iframe>
            </div>
          `,
          width: '90%',
          showCloseButton: true,
          showConfirmButton: false,
          background: "#f8fafc",
          customClass: { popup: "rounded-2xl" },
        });
      } else {
        Swal.fire({
          imageUrl: url,
          imageAlt: "File Preview",
          showCloseButton: true,
          showConfirmButton: false,
          width: "auto",
          background: "#f8fafc",
          customClass: { popup: "rounded-2xl" },
        });
      }
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
                👥 Supplier Management
              </h1>
              <p className="text-gray-600 mt-2">
                Manage and track all your suppliers and vendors
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              {/* Add New Supplier */}
              <button
                onClick={() => navigate("/suppliers/add")}
                className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-6 py-3 rounded-xl shadow-lg transition-all duration-200 flex items-center justify-center gap-2 font-semibold transform hover:scale-105"
              >
                <Plus size={20} />
                Add Supplier
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
                  placeholder="Search suppliers by name, email, phone, category..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4">
                <div className="bg-blue-50 rounded-xl px-4 py-2 border border-blue-200">
                  <p className="text-sm text-blue-600 font-medium">Total Suppliers</p>
                  <p className="text-2xl font-bold text-blue-700">{totalSuppliers}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Suppliers Table/Cards */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-3">
                <Users size={24} />
                Suppliers ({suppliers.length})
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
                      <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Supplier Details</th>
                      <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Contact Info</th>
                      <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Documents</th>
                      <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Banking</th>
                      <th className="py-4 px-6 text-center text-sm font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {suppliers.map((supplier) => (
                      <tr key={supplier._id} className="hover:bg-gray-50 transition-colors duration-150">
                        
                        {/* Supplier Details */}
                        <td className="py-4 px-6">
                          <div className="space-y-2">
                            <h3 className="font-semibold text-gray-800 text-lg">{supplier.name}</h3>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="text-gray-500">Category:</span>
                              <span className="capitalize">
                                {Array.isArray(supplier.vendorCategory) 
                                  ? supplier.vendorCategory.join(", ") 
                                  : supplier.vendorCategory || "—"}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="text-gray-500">GST:</span>
                              <span>{supplier.gstNumber || "No GST"}</span>
                            </div>
                            {supplier.address && (
                              <p className="text-sm text-gray-600 line-clamp-2">
                                {supplier.address}
                              </p>
                            )}
                            {supplier.locationLink && (
                              <a
                                href={supplier.locationLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors duration-200"
                              >
                                <MapPin size={14} />
                                View on Map
                                <ExternalLink size={12} />
                              </a>
                            )}
                          </div>
                        </td>

                        {/* Contact Info */}
                        <td className="py-4 px-6">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm">
                              <Mail size={16} className="text-gray-400" />
                              <span className="text-gray-700">{supplier.email || "—"}</span>
                            </div>
                            <div className="space-y-1">
                              {supplier.phone && (
                                <div className="flex items-center gap-2 text-sm">
                                  <Phone size={16} className="text-gray-400" />
                                  <span className="text-gray-700">{supplier.phone}</span>
                                </div>
                              )}
                              {supplier.phone2 && (
                                <div className="flex items-center gap-2 text-sm">
                                  <Phone size={16} className="text-gray-400" />
                                  <span className="text-gray-700">{supplier.phone2}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Documents */}
                        <td className="py-4 px-6">
                          <div className="space-y-3">
                            {/* Supplier Files */}
                            <div>
                              <p className="text-xs text-gray-500 mb-2">Supplier Files</p>
                              <div className="flex flex-wrap gap-2">
                                {supplier.files?.map((file, index) => {
                                  const fileUrl = file?.url || "";
                                  const isPDF = fileUrl.toLowerCase().includes(".pdf");
                                  return (
                                    <div
                                      key={index}
                                      onClick={() => handleFilePreview(supplier.files, "Supplier Files")}
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
                                {(!supplier.files || supplier.files.length === 0) && (
                                  <span className="text-xs text-gray-400">No files</span>
                                )}
                              </div>
                            </div>

                            {/* Cheque Files */}
                            <div>
                              <p className="text-xs text-gray-500 mb-2">Cheque Files</p>
                              <div className="flex flex-wrap gap-2">
                                {supplier.chequeFiles?.map((file, index) => {
                                  const fileUrl = file?.url || "";
                                  const isPDF = fileUrl.toLowerCase().includes(".pdf");
                                  return (
                                    <div
                                      key={index}
                                      onClick={() => handleFilePreview(supplier.chequeFiles, "Cheque Files")}
                                      className="w-12 h-12 border border-gray-300 rounded-lg flex items-center justify-center bg-blue-100 cursor-pointer hover:bg-blue-200 transition-colors duration-200 overflow-hidden"
                                    >
                                      {isPDF ? (
                                        <FileText size={20} className="text-blue-500" />
                                      ) : (
                                        <img
                                          src={fileUrl}
                                          alt={`cheque-${index}`}
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
                                {(!supplier.chequeFiles || supplier.chequeFiles.length === 0) && (
                                  <span className="text-xs text-gray-400">No cheques</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Banking Details */}
                        <td className="py-4 px-6">
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2">
                        <span className="text-gray-500">Acc Name:</span>
                              <span className="font-medium text-gray-700">
                                {supplier.accountName || "—"}
                              </span>
                            </div>
                            {supplier.bankName && (
                              <>
                                                      <span className="text-gray-500">Bank:</span>
                              <p className="text-gray-600">{supplier.bankName}</p>
                              </>
                            )}
                            {supplier.accountNumber && (
                              <p className="text-gray-600">Acc: {supplier.accountNumber}</p>
                            )}
                            {supplier.ifscCode && (
                              <p className="text-gray-600">IFSC: {supplier.ifscCode}</p>
                            )}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-6">
                          <div className="flex flex-col gap-2">
                            <button
                              onClick={() => navigate(`/suppliers/edit/${supplier._id}`)}
                              className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 rounded-lg transition-colors duration-200 text-sm font-medium justify-center"
                            >
                              <Edit size={16} />
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(supplier._id)}
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
                {suppliers.map((supplier) => (
                  <div key={supplier._id} className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
                    
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-800 text-lg mb-1">{supplier.name}</h3>
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                        <span className="text-gray-500">Category:</span>
                          <span className="capitalize">
                            {Array.isArray(supplier.vendorCategory) 
                              ? supplier.vendorCategory.join(", ") 
                              : supplier.vendorCategory || "—"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Contact Info */}
                    <div className="space-y-2 mb-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Mail size={16} className="text-gray-400" />
                        <span className="text-gray-700">{supplier.email || "—"}</span>
                      </div>
                      <div className="space-y-1">
                        {supplier.phone && (
                          <div className="flex items-center gap-2 text-sm">
                            <Phone size={16} className="text-gray-400" />
                            <span className="text-gray-700">{supplier.phone}</span>
                          </div>
                        )}
                        {supplier.phone2 && (
                          <div className="flex items-center gap-2 text-sm">
                            <Phone size={16} className="text-gray-400" />
                            <span className="text-gray-700">{supplier.phone2}</span>
                          </div>
                        )}
                      </div>
                      {supplier.gstNumber && (
                        <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-500">GST:</span>
                          <span className="text-gray-700">{supplier.gstNumber}</span>
                        </div>
                      )}
                    </div>

                    {/* Address */}
                    {supplier.address && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {supplier.address}
                      </p>
                    )}

                    {/* Location Link */}
                    {supplier.locationLink && (
                      <a
                        href={supplier.locationLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium mb-3 transition-colors duration-200"
                      >
                        <MapPin size={16} />
                        View on Map
                      </a>
                    )}

                    {/* Documents */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      {/* Supplier Files */}
                      <div>
                        <p className="text-xs text-gray-500 mb-2">Supplier Files</p>
                        <div className="flex flex-wrap gap-1">
                          {supplier.files?.slice(0, 2).map((file, index) => {
                            const fileUrl = file?.url || "";
                            const isPDF = fileUrl.toLowerCase().includes(".pdf");
                            return (
                              <div
                                key={index}
                                onClick={() => handleFilePreview(supplier.files, "Supplier Files")}
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

                      {/* Cheque Files */}
                      <div>
                        <p className="text-xs text-gray-500 mb-2">Cheque Files</p>
                        <div className="flex flex-wrap gap-1">
                          {supplier.chequeFiles?.slice(0, 2).map((file, index) => {
                            const fileUrl = file?.url || "";
                            const isPDF = fileUrl.toLowerCase().includes(".pdf");
                            return (
                              <div
                                key={index}
                                onClick={() => handleFilePreview(supplier.chequeFiles, "Cheque Files")}
                                className="w-10 h-10 border border-gray-300 rounded-lg flex items-center justify-center bg-blue-100 cursor-pointer overflow-hidden"
                              >
                                {isPDF ? (
                                  <FileText size={16} className="text-blue-500" />
                                ) : (
                                  <img
                                    src={fileUrl}
                                    alt={`cheque-${index}`}
                                    className="object-cover w-full h-full"
                                  />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Banking Details */}
                    {(supplier.accountName || supplier.bankName) && (
                      <div className="mb-3 p-3 bg-white rounded-lg border border-gray-200">
                        <p className="text-xs text-gray-500 mb-2">Banking Details</p>
                        <div className="space-y-1 text-xs">
                          {supplier.accountName && (
                            <p><strong>Acc Name:</strong> {supplier.accountName}</p>
                          )}
                          {supplier.bankName && (
                            <p><strong>Bank:</strong> {supplier.bankName}</p>
                          )}
                          {supplier.accountNumber && (
                            <p><strong>Acc No:</strong> {supplier.accountNumber}</p>
                          )}
                          {supplier.ifscCode && (
                            <p><strong>IFSC:</strong> {supplier.ifscCode}</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-3 border-t border-gray-200">
                      <button
                        onClick={() => navigate(`/suppliers/edit/${supplier._id}`)}
                        className="flex-1 flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 rounded-lg transition-colors duration-200 text-sm font-medium justify-center"
                      >
                        <Edit size={16} />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(supplier._id)}
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
            {!loading && suppliers.length === 0 && (
              <div className="text-center py-12">
                <div className="bg-gray-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="text-gray-400 text-2xl" />
                </div>
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No Suppliers Found</h3>
                <p className="text-gray-500 max-w-md mx-auto mb-6">
                  {query ? "Try adjusting your search criteria" : "Get started by adding your first supplier"}
                </p>
                {!query && (
                  <button
                    onClick={() => navigate("/suppliers/add")}
                    className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-6 py-3 rounded-xl shadow-lg transition-all duration-200 flex items-center gap-2 font-semibold mx-auto"
                  >
                    <Plus size={20} />
                    Add First Supplier
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
        </div>
      </div>
    </>
  );
}