import { useState } from "react";
import axiosInstance from "../axiosInstance";
import InternalNavbar from "../components/InternalNavbar";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const categories = [
  "wood", "polythene bags", "hardware", "raw materials",
  "iron sheets", "aluminium casting/sheets", "boiler materials", "Kraft Paper"
];

export default function SendRFQ() {
  const [form, setForm] = useState({
    itemName: "",
    quantity: "",
    requiredByDate: "",
    size: "",
    remarks: "",
    category: ""
  });
  const [loading, setLoading] = useState(false);
const navigate=useNavigate();
  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);

  try {
    const user = JSON.parse(localStorage.getItem("user"));

    // Step 1: Fetch suppliers by selected category
    const res = await axiosInstance.get(`/suppliers?category=${form.category}`);
    
    const supplierEmails = res.data.data?.map(supplier => supplier.email).filter(Boolean);

    if (!supplierEmails || supplierEmails.length === 0) {
      toast.error("No suppliers found for this category.");
      setLoading(false);
      return;
    }

    // Step 2: Compose the mailto link
    const subject = encodeURIComponent("New RFQ Requirement");
    const body = encodeURIComponent(`
Hello,

Please find the RFQ details below:

Item Name: ${form.itemName}
Quantity: ${form.quantity}
Required By: ${form.requiredByDate}
Size: ${form.size || "N/A"}
Category: ${form.category}
Remarks: ${form.remarks || "None"}

Sent by: ${user?.email || "Unknown User"}
`);

    const mailtoLink = `mailto:${supplierEmails.join(",")}?subject=${subject}&body=${body}`;
    window.location.href = mailtoLink;

    toast.success("Opening your email client...");

    // Reset form and redirect
    setForm({
      itemName: "", quantity: "", requiredByDate: "",
      size: "", remarks: "", category: ""
    });
    navigate('/all-suppliers');
  } catch (err) {
    console.error(err);
    toast.error("Failed to send RFQ.");
  } finally {
    setLoading(false);
  }
};


  return (
    <>
      <InternalNavbar />
      <div className="max-w-xl mx-auto p-6">
        <h2 className="text-2xl font-bold mb-4 text-center">📩 Send RFQ to Suppliers</h2>
         {/* Loader Overlay */}
        {loading && (
          <div className="absolute inset-0 bg-white/80 flex justify-center items-center z-10 rounded">
            <div className="loader border-t-4 border-blue-500 border-solid rounded-full w-10 h-10 animate-spin"></div>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="text" name="itemName" placeholder="Item Name" required
            className="w-full border p-2 rounded" value={form.itemName} onChange={handleChange} />
          <input type="number" name="quantity" placeholder="Quantity" required
            className="w-full border p-2 rounded" value={form.quantity} onChange={handleChange} />
          <input type="date" name="requiredByDate" required
            className="w-full border p-2 rounded" value={form.requiredByDate} onChange={handleChange} />
          <input type="text" name="size" placeholder="Size (optional)"
            className="w-full border p-2 rounded" value={form.size} onChange={handleChange} />
          <textarea name="remarks" placeholder="Remarks" rows={3}
            className="w-full border p-2 rounded" value={form.remarks} onChange={handleChange} />
          <select name="category" required
            className="w-full border p-2 rounded bg-white" value={form.category} onChange={handleChange}>
            <option value="">Select Category</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <button type="submit"
            className="w-full bg-blue-600 text-white font-semibold py-2 rounded hover:bg-blue-700">
            📤 Send RFQ
          </button>
        </form>
      </div>
    {/* Loader styles */}
      <style>{`
        .loader {
          border-top-color: #3b82f6;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

    </>
  );
}
