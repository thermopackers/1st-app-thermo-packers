import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../axiosInstance";
import InternalNavbar from "../components/InternalNavbar";
import toast from "react-hot-toast";
import { useUserContext } from "../context/UserContext";

export default function EditCustomer() {
  const {user} = useUserContext();
  const { id } = useParams();
  const navigate = useNavigate();
const [gstError, setGstError] = useState("");

  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [newFiles, setNewFiles] = useState([]);
  const [removedDocs, setRemovedDocs] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [frequentProducts, setFrequentProducts] = useState([]);

  useEffect(() => {
  async function fetchUsers() {
    try {
      const res = await axiosInstance.get("/users/all"); // create this route if not already
      setAllUsers(res.data.filter(u => ["sales", "accounts"].includes(u.role)));
    } catch (err) {
      console.error("Failed to load users", err);
    }
  }

  fetchUsers();
}, []);

  useEffect(() => {
    async function fetchCustomer() {
      try {
        const res = await axiosInstance.get(`/customers/${id}`);
        setCustomer(res.data);
          // ✅ Fetch frequently bought products here
      if (res.data.name) {
        const ordersRes = await axiosInstance.get(
          `/orders/customer-summary/${encodeURIComponent(res.data.name)}`
        );
        setFrequentProducts(ordersRes.data);
      }
      } catch (err) {
        if (err.response?.status === 404) {
          toast.error("Customer not found or deleted");
          navigate("/customers");
        } else {
          toast.error("Failed to load customer");
        }
      } finally {
        setLoading(false);
      }
    }

    fetchCustomer();
  }, [id, navigate]);

const handleChange = (e) => {
  const { name, value } = e.target;

  if (name === "company") {
    if (value.length !== 15) {
      setGstError("GST number must be exactly 15 characters.");
    } else {
      setGstError("");
    }
  }

  setCustomer((prev) => ({ ...prev, [name]: value }));
};

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setNewFiles((prev) => [...prev, ...files]);
  };

  const handleRemoveExistingDoc = (url) => {
    setRemovedDocs((prev) => [...prev, url]);
    setCustomer((prev) => ({
      ...prev,
      gstDocs: prev.gstDocs?.filter((doc) => doc !== url),
    }));
  };

  const handleRemoveNewDoc = (index) => {
    setNewFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadToCloudinary = async (files) => {
    const uploads = files.map(async (file) => {
      const data = new FormData();
      data.append("file", file);
      data.append("upload_preset", "todo_uploads");
      data.append("cloud_name", "dcr8k5amk");

      const res = await fetch("https://api.cloudinary.com/v1_1/dcr8k5amk/upload", {
        method: "POST",
        body: data,
      });

      const result = await res.json();
      return result.secure_url;
    });

    return Promise.all(uploads);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
if (customer.company && customer.company !== "URP" && customer.company.length !== 15) {
  setGstError("GST number must be exactly 15 characters.");
  toast.error("GST number must be exactly 15 characters.");
  setSubmitting(false);
  return;
}
// 🔥 Auto-fill URN
if (!customer.company || customer.company.trim() === "") {
  customer.company = "URP";
}

    try {
      let uploadedUrls = [];
      if (newFiles.length > 0) {
        toast.loading("Uploading new documents...");
        uploadedUrls = await uploadToCloudinary(newFiles);
        toast.dismiss();
      }

      const updatedCustomer = {
        ...customer,
          createdBy: customer.createdBy, // ✅ ensure it's sent
        gstDocs: [...(customer.gstDocs || []), ...uploadedUrls],
      };

      await axiosInstance.put(`/customers/${id}`, updatedCustomer);
      toast.success("Customer updated successfully");
      navigate("/customers");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update customer");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this customer?")) return;
    setDeleting(true);

    try {
      await axiosInstance.delete(`/customers/${id}`);
      toast.success("Customer deleted successfully!");
      navigate("/customers");
    } catch (err) {
      toast.error("Failed to delete customer");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <p>Loading customer...</p>;
  if (!customer) return null;

  return (
    <>
      <InternalNavbar />
        <h2 className="text-2xl text-center py-2 font-bold">Edit Customer</h2>
<div className="flex flex-col lg:flex-row gap-6 max-w-7xl mx-auto p-6">

       
        {frequentProducts.length > 0 && (
  <div className="mt-6">
    <h3 className="text-lg font-semibold mb-2">Frequently Bought Products</h3>
    <div className="border rounded">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-100 text-left">
          <tr>
            <th className="px-3 py-2">Last Ordered</th>
            <th className="px-3 py-2">Product</th>
            <th className="px-3 py-2">Price</th>
            <th className="px-3 py-2">Remarks</th>
            <th className="px-3 py-2">Times Ordered</th>
          </tr>
        </thead>
        <tbody>
          {frequentProducts.map((item, idx) => (
            <tr key={idx} className="border-t">
<td className="px-3 py-2">
  {item.orderDate ? new Date(item.orderDate).toLocaleDateString() : "-"}
</td>
              <td className="px-3 py-2">{item.product}</td>
<td className="px-3 py-2 text-green-700 font-semibold">
  ₹{item.price}
  <span className="ml-1 text-xs text-gray-500">(last)</span>
</td>
              <td className="px-3 py-2">{item.remarks || "-"}</td>
              <td className="px-3 py-2">{item.timesOrdered}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
)}
 <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1 font-semibold">Name</label>
            <input
              type="text"
              name="name"
              value={customer.name || ""}
              onChange={handleChange}
              required
              className="w-full border p-2 rounded"
            />
          </div>

       <div>
  <label className="block mb-1 font-semibold">GST No. (Leave this field if no GST No. It will take URP automatically)</label>
  <input
    type="text"
    name="company"
    value={customer.company || ""}
    onChange={handleChange}
    className={`w-full border p-2 rounded ${
      gstError ? "border-red-500 focus:ring-red-400" : ""
    }`}
        placeholder={customer.company?.trim() === "" ? "URP (If no GST No.)" : "GST No."}

  />
  {gstError && <p className="text-red-500 text-sm mt-1">{gstError}</p>}
</div>


          <div>
            <label className="block mb-1 font-semibold">Phone</label>
            <input
              type="tel"
              name="phone"
              value={customer.phone || ""}
              onChange={handleChange}
              className="w-full border p-2 rounded"
            />
          </div>

          <div>
            <label className="block mb-1 font-semibold">Email</label>
            <input
              type="email"
              name="email"
              value={customer.email || ""}
              onChange={handleChange}
              className="w-full border p-2 rounded"
            />
          </div>

          <div>
            <label className="block mb-1 font-semibold">Address</label>
            <textarea
              name="address"
              value={customer.address || ""}
              onChange={handleChange}
              rows={3}
              className="w-full border p-2 rounded"
            />
          </div>
      {!["sales"].includes(user.role) && (    
<div>
  <label className="block mb-1 font-semibold">Customer Handled/Managed by</label>
  <select
    name="createdBy"
    value={customer.createdBy || ""}
    onChange={(e) =>
      setCustomer((prev) => ({ ...prev, createdBy: e.target.value }))
    }
    className="w-full border p-2 rounded"
    required
  >
    <option value="">Select Sales Person</option>
    {allUsers.map((user) => (
      <option key={user._id} value={user._id}>
        {user.name} ({user.email})
      </option>
    ))}
  </select>
</div>)}

          <div>
            <label className="block mb-1 font-semibold">Google Maps Link</label>
            <input
              name="locationLink"
              value={customer.locationLink || ""}
              onChange={handleChange}
              placeholder="https://maps.google.com/..."
              className="w-full border p-2 rounded"
            />
          </div>

          <div>
            <label className="block mb-1 font-semibold">GST Documents</label>
            <input
              type="file"
              accept="image/*,.pdf"
              multiple
              onChange={handleFileChange}
              className="w-full border p-2 rounded"
            />

            {/* Show existing */}
            {customer.gstDocs?.length > 0 && (
              <div className="mt-2 space-y-1">
                <p className="text-sm font-medium text-gray-600">Existing Files:</p>
                <div className="flex flex-wrap gap-3">
                  {customer.gstDocs.map((url, i) => (
                    <div key={i} className="relative border p-2 rounded bg-gray-100">
                      {url?.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                        <img
                          src={url}
                          alt={`doc-${i}`}
                          className="w-24 h-24 object-cover rounded"
                        />
                      ) : (
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 underline"
                        >
                          📄 PDF {i + 1}
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveExistingDoc(url)}
                        className="absolute top-1 right-1 text-white bg-red-500 hover:bg-red-600 rounded-full w-5 h-5 text-xs"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Show new */}
            {newFiles.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-600">New Files to Upload:</p>
                <div className="flex flex-wrap gap-3">
                  {newFiles.map((file, i) => {
                    const isImage = file.type.startsWith("image/");
                    return (
                      <div key={i} className="relative border p-2 rounded bg-gray-100">
                        {isImage ? (
                          <img
                            src={URL.createObjectURL(file)}
                            alt={`new-doc-${i}`}
                            className="w-24 h-24 object-cover rounded"
                          />
                        ) : (
                          <p className="text-xs text-center">{file.name}</p>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveNewDoc(i)}
                          className="absolute top-1 right-1 text-white bg-red-500 hover:bg-red-600 rounded-full w-5 h-5 text-xs"
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center space-x-4">
            <button
              type="submit"
              disabled={submitting || deleting}
              className={`bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 ${
                submitting || deleting ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {submitting ? "Saving..." : "Save Changes"}
            </button>

            <button
              type="button"
              onClick={handleDelete}
              disabled={submitting || deleting}
              className={`bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 ${
                submitting || deleting ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {deleting ? "Deleting..." : "Delete Customer"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
