import React, { useEffect, useState } from "react";
import axiosInstance from "../axiosInstance";
import InternalNavbar from "../components/InternalNavbar";
import toast from "react-hot-toast";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import { Eye, Mail, MessageCircle } from "lucide-react";
import { useUserContext } from "../context/UserContext";

export default function ProformaInvoiceDashboard() {
  const { user } =useUserContext();
  const [invoices, setInvoices] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;  
const navigate=useNavigate();
  const fetchInvoices = async () => {
    try {
      const res = await axiosInstance.get("/proforma/all", {
        params: { page, limit, search },
      });
      setInvoices(res.data.invoices);
      setTotal(res.data.total);
    } catch (err) {
      console.error("Error fetching invoices", err);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [page, search]);

const handleEmailShare = async (invoice, user) => {
  const { value: toEmail } = await Swal.fire({
    title: "Send Invoice via Email",
    input: 'email',
    inputLabel: 'Customer Email',
    inputValue: invoice.customerEmail || 'example@example.com',
    showCancelButton: true,
    confirmButtonText: 'Open Email App',
    inputPlaceholder: 'Enter customer email'
  });

  if (!toEmail) return;

  const subject = encodeURIComponent(`Proforma Invoice - ${invoice.invoiceNo}`);
  const body = encodeURIComponent(
    `Dear Customer,

Please find your Proforma Invoice and Statement below:

Proforma Invoice: ${invoice.pdfUrl}
Statement: ${invoice.statementUrl || 'Not available'}

Let us know in case of any questions.

Best regards,
${user.name}
(${user.email})`
  );

  const mailtoLink = `mailto:${toEmail}?subject=${subject}&body=${body}`;

  // Open user's email client
  window.location.href = mailtoLink;
};


  const totalPages = Math.ceil(total / limit);
const deleteInvoice = async (id) => {
  if (!window.confirm("Are you sure you want to delete this invoice?")) return;

  try {
    await axiosInstance.delete(`/proforma/${id}`);
    toast.success("Invoice deleted successfully");
    fetchInvoices(); // refresh list
  } catch (err) {
    console.error("Failed to delete invoice", err);
    toast.error("Error deleting invoice");
  }
};

const formatDateDDMMYYYY = (dateInput) => {
  if (!dateInput) return "";
  const d = new Date(dateInput);
  if (isNaN(d)) return "";
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

  return (
    <>
      <InternalNavbar />
      <div className="p-4 max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold text-blue-700 mb-6 text-center">📄 Proforma Invoice Dashboard</h2>

        {/* Search */}
        <div className="flex justify-center mb-4">
          <input
            type="text"
            placeholder="🔍 Search by P/I No, Bill To, Ship To..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full max-w-md px-4 py-2 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
          />
        </div>

        {/* Table */}
        <div className="overflow-auto bg-white rounded shadow">
          <table className="w-full text-sm">
            <thead className="bg-blue-100 text-gray-700">
              <tr>
                <th className="px-3 py-2 text-left">S.No</th>
                <th className="px-3 py-2 text-left">P/I ID</th>
                <th className="px-3 py-2 text-left">Date</th>
                    <th className="px-3 py-2 text-left">Customer Name</th> {/* Added */}
                <th className="px-3 py-2 text-left">Bill To</th>
                <th className="px-3 py-2 text-left">Ship To</th>
                <th className="px-3 py-2 text-center">Total Products</th>
                <th className="px-3 py-2 text-center">Invoice</th>
                <th className="px-3 py-2 text-center">Edit</th>
                <th className="px-3 py-2 text-center">Delete</th>
                <th className="px-3 py-2 text-center">Convert</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv,index) => (
                <tr key={inv._id} className="even:bg-gray-50 hover:bg-blue-50 transition">
                  <td className="px-3 py-2">{(page - 1) * limit + index + 1}</td>
                  <td className="px-3 py-2">{inv.invoiceNo}</td>
<td className="px-3 py-2">{formatDateDDMMYYYY(inv.date)}</td>
                        <td className="px-3 py-2">{inv.customerName || "—"}</td> {/* Added */}
                  <td className="px-3 py-2">{inv.billTo}</td>
                  <td className="px-3 py-2">{inv.shipTo}</td>
                  <td className="px-3 py-2 text-center">{inv.products?.length}</td>
                 <td className="px-3 py-2 text-center space-y-1">
  {/* View PDF */}
  <a
    href={inv.pdfUrl}
    target="_blank"
    rel="noopener noreferrer"
    className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-1 rounded transition"
  >
    <Eye size={16} />
    View Invoice
  </a>

  {/* Share via Email */}
  <button
    onClick={() => handleEmailShare(inv, user)}
    className="flex items-center justify-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white text-sm px-3 py-1 rounded transition"
  >
    <Mail size={16} />
    Email Customer
  </button>

  {/* Share via WhatsApp */}
  <a
    href={`https://wa.me/${inv.contact.replace(/\D/g, '')}?text=${encodeURIComponent(`Hello, please find your Proforma Invoice:\n${inv.pdfUrl}`)}`}
    target="_blank"
    className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white text-sm px-3 py-1 rounded transition"
  >
    <MessageCircle size={16} />
    WhatsApp Customer
  </a>
</td>


                  <td className="px-3 py-2 text-center">
  <button
    onClick={() => navigate(`/proforma-edit/${inv._id}`)}
    className="text-green-600 hover:text-green-800 font-medium"
  >
    ✏️ Edit
  </button>
</td>

                  <td className="px-3 py-2 text-center">
  <button
    onClick={() => deleteInvoice(inv._id)}
    className="text-red-500 hover:text-red-700 font-medium"
  >
    ❌
  </button>
</td>
<td className="px-3 py-2 text-center">
  <button
    onClick={() =>
      navigate("/add-order", { state: { fromProforma: true, invoice: inv } })
    }
    className="bg-indigo-600 hover:bg-indigo-700 cursor-pointer text-white px-4 py-1 rounded shadow"
  >
    🔄 Convert to Sales Order
  </button>
</td>


                </tr>
              ))}
              {invoices.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center text-gray-500 py-6 italic">
                    No invoices found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-6 flex-wrap gap-2">
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => setPage(i + 1)}
                className={`px-3 py-1 rounded border border-gray-300 hover:bg-blue-100 transition ${
                  page === i + 1 ? "bg-blue-600 text-white font-semibold" : "bg-white text-gray-700"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
