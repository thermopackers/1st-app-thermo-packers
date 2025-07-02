import React, { useEffect, useState } from "react";
import axiosInstance from "../axiosInstance";
import InternalNavbar from "../components/InternalNavbar";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

export default function ProformaInvoiceDashboard() {
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
                <th className="px-3 py-2 text-left">P/I No</th>
                <th className="px-3 py-2 text-left">Date</th>
                    <th className="px-3 py-2 text-left">Customer Name</th> {/* Added */}
                <th className="px-3 py-2 text-left">Bill To</th>
                <th className="px-3 py-2 text-left">Ship To</th>
                <th className="px-3 py-2 text-center">Total Products</th>
                <th className="px-3 py-2 text-center">Invoice</th>
                <th className="px-3 py-2 text-center">Edit</th>
                <th className="px-3 py-2 text-center">Delete</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv._id} className="even:bg-gray-50 hover:bg-blue-50 transition">
                  <td className="px-3 py-2">{inv.invoiceNo}</td>
                  <td className="px-3 py-2">{inv.date}</td>
                        <td className="px-3 py-2">{inv.customerName || "—"}</td> {/* Added */}
                  <td className="px-3 py-2">{inv.billTo}</td>
                  <td className="px-3 py-2">{inv.shipTo}</td>
                  <td className="px-3 py-2 text-center">{inv.products?.length}</td>
                  <td className="px-3 py-2 text-center">
                    <a
                      href={inv.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline font-medium"
                    >
                      View
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
