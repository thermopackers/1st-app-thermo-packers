import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../axiosInstance";
import InternalNavbar from "../components/InternalNavbar";
import toast from "react-hot-toast";

export default function EditCustomer() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
const [submitting, setSubmitting] = useState(false);
const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function fetchCustomer() {
      try {
        const res = await axiosInstance.get(`/customers/${id}`);
        setCustomer(res.data);
        setError("");
      } catch (err) {
        if (err.response?.status === 404) {
          toast.error("Customer not found or deleted");
          navigate("/customers");
        } else {
          setError("Failed to load customer");
        }
      } finally {
        setLoading(false);
      }
    }

    fetchCustomer();
  }, [id, navigate]);

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCustomer((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
      setSubmitting(true);

    try {
      await axiosInstance.put(`/customers/${id}`, customer);
      toast.success("Customer updated successfully!");
            navigate("/customers");

    } catch (err) {
      toast.error("Failed to update customer");
    } finally {
    setSubmitting(false);
  }
  };

  if (loading) return <p>Loading customer...</p>;
  if (error) return <p className="text-red-600">{error}</p>;
  if (!customer) return null; // In case of redirect

  return (
    <>
      <InternalNavbar />
      <div className="max-w-lg mx-auto p-6">
        <h2 className="text-xl font-bold mb-4">Edit Customer</h2>

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
            <label className="block mb-1 font-semibold">Company</label>
            <input
              type="text"
              name="company"
              value={customer.company || ""}
              onChange={handleChange}
              className="w-full border p-2 rounded"
            />
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

          <div className="flex justify-between items-center space-x-4">
          <button
  type="submit"
  disabled={submitting || deleting}
  className={`bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 ${submitting || deleting ? "opacity-50 cursor-not-allowed" : ""}`}
>
  {submitting ? "Saving..." : "Save Changes"}
</button>

           <button
  type="button"
  onClick={handleDelete}
  disabled={submitting || deleting}
  className={`bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 ${submitting || deleting ? "opacity-50 cursor-not-allowed" : ""}`}
>
  {deleting ? "Deleting..." : "Delete Customer"}
</button>
          </div>
        </form>
      </div>
    </>
  );
}
