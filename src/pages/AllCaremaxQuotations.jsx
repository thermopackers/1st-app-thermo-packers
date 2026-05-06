import React, { useEffect, useState } from "react";
import axiosInstance from "../axiosInstance";
import InternalNavbar from "../components/InternalNavbar";
import toast from "react-hot-toast";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import { Search, Eye, Download, Mail, MessageCircle, Edit, Trash2, Plus } from "lucide-react";

export default function AllCaremaxQuotations() {
  const [quotations, setQuotations] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);
  const limit = 10;
  const navigate = useNavigate();

  const fetchQuotations = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/caremax-quotations/all", {
        params: { page, limit, search },
      });
      setQuotations(res.data.quotations);
      setTotal(res.data.total);
    } catch (err) {
      console.error("Error fetching quotations", err);
      toast.error("Failed to load quotations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotations();
  }, [page, search]);

  const totalPages = Math.ceil(total / limit);

  const formatDate = (dateInput) => {
    if (!dateInput) return "";
    const d = new Date(dateInput);
    if (isNaN(d)) return "";
    return d.toLocaleDateString('en-GB');
  };

  const handleView = (quotation) => {
    if (quotation.pdfUrl) {
      window.open(quotation.pdfUrl, '_blank');
    } else {
      toast.error("PDF not available");
    }
  };

  const handleDownload = async (quotation) => {
    if (!quotation.pdfUrl) {
      toast.error("PDF not available");
      return;
    }
    
    setDownloadingId(quotation._id);
    try {
      const response = await fetch(quotation.pdfUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Quotation_${quotation.invoiceNo}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("Download started");
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download PDF");
    } finally {
      setDownloadingId(null);
    }
  };

  const handleEmailShare = (quotation) => {
    const subject = encodeURIComponent(`Quotation - ${quotation.invoiceNo}`);
    const body = encodeURIComponent(
      `Dear Customer,\n\nPlease find your quotation attached.\n\nQuotation: ${quotation.pdfUrl}\n\nBest regards,\nCaremax Impex`
    );
    window.location.href = `mailto:${quotation.customerEmail || ''}?subject=${subject}&body=${body}`;
  };

  const handleWhatsAppShare = (quotation) => {
    const phone = quotation.contact?.replace(/\D/g, '');
    if (!phone) {
      toast.error("No phone number available");
      return;
    }
    const message = encodeURIComponent(`Hello, please find your quotation:\n${quotation.pdfUrl}`);
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
  };

  const handleEdit = (quotation) => {
    navigate(`/caremax-impex/edit-quotation/${quotation._id}`);
  };

  const handleDelete = async (quotation) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: `Delete quotation ${quotation.invoiceNo}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });

    if (result.isConfirmed) {
      try {
        await axiosInstance.delete(`/caremax-quotations/${quotation._id}`);
        toast.success("Quotation deleted successfully");
        fetchQuotations();
      } catch (err) {
        console.error("Delete error:", err);
        toast.error("Failed to delete quotation");
      }
    }
  };

  return (
    <>
      <InternalNavbar />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-800">
                📄 Caremax Quotations
              </h1>
              <p className="text-gray-600 mt-2">Manage all your quotations and proforma invoices</p>
            </div>
            <button
              onClick={() => navigate("/caremax-impex/add-quotation")}
              className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-6 py-3 rounded-xl shadow-lg transition-all duration-200 flex items-center gap-2 font-semibold"
            >
              <Plus size={20} />
              Create New Quotation
            </button>
          </div>

          {/* Search */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="text-gray-400" size={20} />
              </div>
              <input
                type="text"
                placeholder="Search by Invoice No, Customer Name, Bill To..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Quotations Table */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
              <h2 className="text-xl font-bold text-white">Quotations ({quotations.length})</h2>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : quotations.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No quotations found</p>
                <button
                  onClick={() => navigate("/caremax-impex/add-quotation")}
                  className="mt-4 text-blue-600 hover:text-blue-700 font-semibold"
                >
                  Create your first quotation
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="py-3 px-4 text-left text-sm font-semibold">S.No</th>
                      <th className="py-3 px-4 text-left text-sm font-semibold">Invoice No</th>
                      <th className="py-3 px-4 text-left text-sm font-semibold">Date</th>
                      <th className="py-3 px-4 text-left text-sm font-semibold">Customer</th>
                      <th className="py-3 px-4 text-left text-sm font-semibold">Contact</th>
                      <th className="py-3 px-4 text-left text-sm font-semibold">Products</th>
                      <th className="py-3 px-4 text-center text-sm font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {quotations.map((quotation, index) => (
                      <tr key={quotation._id} className="hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm">{(page - 1) * limit + index + 1}</td>
                        <td className="py-3 px-4 font-semibold text-gray-800">{quotation.invoiceNo}</td>
                        <td className="py-3 px-4 text-sm">{formatDate(quotation.date)}</td>
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium">{quotation.customerName || "-"}</p>
                            <p className="text-xs text-gray-500">{quotation.gstin === 'URP' ? 'URP' : 'GST: ' + quotation.gstin}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm">{quotation.contact || "-"}</td>
                        <td className="py-3 px-4 text-center">
                          <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-medium">
                            {quotation.products?.length || 0}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap gap-2 justify-center">
                            <button
                              onClick={() => handleView(quotation)}
                              className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                              title="View PDF"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              onClick={() => handleDownload(quotation)}
                              disabled={downloadingId === quotation._id}
                              className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
                              title="Download PDF"
                            >
                              <Download size={16} />
                            </button>
                            <button
                              onClick={() => handleEmailShare(quotation)}
                              className="p-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600"
                              title="Share via Email"
                            >
                              <Mail size={16} />
                            </button>
                            <button
                              onClick={() => handleWhatsAppShare(quotation)}
                              className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                              title="Share via WhatsApp"
                            >
                              <MessageCircle size={16} />
                            </button>
                            <button
                              onClick={() => handleEdit(quotation)}
                              className="p-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
                              title="Edit"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(quotation)}
                              className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 py-4 border-t">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border rounded-lg disabled:opacity-50 hover:bg-gray-50"
                >
                  Previous
                </button>
                <span className="text-sm">Page {page} of {totalPages}</span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 border rounded-lg disabled:opacity-50 hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}