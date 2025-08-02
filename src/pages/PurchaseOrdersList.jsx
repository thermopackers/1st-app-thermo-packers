import React, { useEffect, useState } from "react";
import axiosInstance from "../axiosInstance";
import InternalNavbar from "../components/InternalNavbar";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import { useUserContext } from "../context/UserContext";

export default function PurchaseOrdersList() {
  const { user } = useUserContext();
  const [orders, setOrders] = useState([]);
  const [page, setPage] = useState(1);
  const [suppliers, setSuppliers] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  console.log("suppliers",suppliers.data);
  
const navigate = useNavigate();
  // Fetch orders with pagination and search
  const fetchOrders = async (page = 1, search = "") => {
    try {
      const res = await axiosInstance.get("/purchase-orders", {
        params: { page, limit: 10, search },
      });
      setOrders(res.data.data || []);
      setTotalPages(res.data.totalPages || 1);
    } catch (err) {
      console.error("❌ Failed to fetch orders:", err);
    }
  };

// Fetch orders whenever page/search changes
useEffect(() => {
  fetchOrders(page, search);
}, [page, search]);

// Fetch suppliers ONCE on initial mount
useEffect(() => {
  axiosInstance.get("/suppliers").then((res) => {
    setSuppliers(res.data.data || []);
  });
}, []);


  // Delete PO and its corresponding PDF from Cloudinary
 const handleDelete = async (orderId) => {
  const confirmed = await Swal.fire({
    title: "Are you sure?",
    text: "This will permanently delete the PO and its PDF!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    cancelButtonColor: "#3085d6",
    confirmButtonText: "Yes, delete it!",
  });

  if (confirmed.isConfirmed) {
    try {
      const res = await axiosInstance.delete(`/purchase-orders/${orderId}`);
      if (res.status === 200) {
        setOrders(orders.filter((order) => order._id !== orderId));

        await Swal.fire({
          icon: "success",
          title: "Deleted!",
          text: "✅ PO and its PDF have been deleted.",
          timer: 1500,
          showConfirmButton: false,
        });
      }
    } catch (err) {
      console.error("❌ Error deleting PO:", err);
      Swal.fire({
        icon: "error",
        title: "Oops!",
        text: "❌ Failed to delete PO.",
      });
    }
  }
};
const getSupplierContact = (supplierId) => {
  const supplier = suppliers.find((s) => s._id === supplierId);
  return {
    email: supplier?.email || "",
    phone: supplier?.phone || "",
  };
};

const handleSendEmail = (order) => {
  const to = getSupplierContact(order.supplier?._id)?.email;
  const from = user?.email; // Only shown in body
  const poNumber = order?.poNumber || "PO-0001";
  const pdfUrl = order?.pdfUrl || "https://example.com/sample-po.pdf";

  if (!to) {
    return Swal.fire("❌ No email", "Supplier email not found", "error");
  }

  const subject = `Purchase Order ${poNumber}`;
  const body = encodeURIComponent(`
Dear Vendor,

Please find the Purchase Order ${poNumber} at the following link:

${pdfUrl}

Sent by: ${from}
  `);

  const mailtoLink = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${body}`;
  window.location.href = mailtoLink;
};



const handleSendWhatsApp = (order) => {
  const { phone } = getSupplierContact(order.supplier?._id);
  if (!phone) return Swal.fire("❌ No phone", "Supplier phone not found", "error");

  const message = `Hello,\nPlease find the Purchase Order (${order.poNumber}) here:\n${order.pdfUrl}`;
  const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  window.open(whatsappUrl, "_blank");
};

  return (
    <>
      <InternalNavbar />
      <div className="max-w-5xl mx-auto px-4 py-6">
        <h2 className="text-2xl font-bold mb-6 text-center">📄 All Purchase Orders</h2>

        <div className="flex justify-between items-center mb-4">
          <input
            type="text"
            placeholder="🔍 Search by PO number or supplier..."
            className="border p-2 rounded w-full max-w-sm"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1); // Reset page when searching
            }}
          />
        </div>

        {orders.length === 0 ? (
          <p className="text-center text-gray-500">No purchase orders found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-300">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border px-4 py-2">PO Number</th>
                  <th className="border px-4 py-2">Supplier</th>
                  <th className="border px-4 py-2">Date</th>
                  <th className="border px-4 py-2">PDF</th>
                  <th className="border px-4 py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order._id}>
                    <td className="border px-4 py-2 text-center">{order.poNumber}</td>
                    <td className="border px-4 py-2">{order.supplier?.name || "—"}</td>
                    <td className="border px-4 py-2 text-center">
                      {new Date(order.createdAt).toLocaleDateString("en-GB")}
                    </td>
                    <td className="border px-4 py-2 text-center">
                      <a
                        href={order.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        View PDF
                      </a>
                    </td>
                 <td className="border px-2 py-2 text-center">
  <div className="flex flex-col sm:flex-row sm:flex-wrap sm:justify-center gap-2">
    <button
      onClick={() => handleDelete(order._id)}
      className="bg-red-100 text-red-700 px-3 py-1 rounded hover:bg-red-200 text-sm transition"
    >
      🗑 Delete
    </button>
    <button
      onClick={() => navigate(`/purchase-orders/edit/${order._id}`)}
      className="bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200 text-sm transition"
    >
      ✏️ Edit
    </button>
    <button
      onClick={() => handleSendEmail(order)}
      className="bg-green-100 text-green-700 px-3 py-1 rounded hover:bg-green-200 text-sm transition"
    >
      📧 Email
    </button>
    <button
      onClick={() => handleSendWhatsApp(order)}
      className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded hover:bg-emerald-200 text-sm transition"
    >
      📱 WhatsApp
    </button>
  </div>
</td>



                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

       {totalPages > 1 && (
  <div className="flex justify-center mt-4 flex-wrap gap-2">
    <button
      className="px-4 py-2 bg-red-500 text-white font-semibold rounded hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
      onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
      disabled={page === 1}
    >
      ⬅ Prev
    </button>

    {[...Array(totalPages)].map((_, index) => {
      const pageNumber = index + 1;
      return (
        <button
          key={pageNumber}
          onClick={() => setPage(pageNumber)}
          className={`px-4 py-2 rounded font-medium ${
            pageNumber === page
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          {pageNumber}
        </button>
      );
    })}

    <button
      className="px-4 py-2 bg-blue-500 text-white font-semibold rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
      onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
      disabled={page === totalPages}
    >
      Next ➡
    </button>
  </div>
)}

      </div>
    </>
  );
}
