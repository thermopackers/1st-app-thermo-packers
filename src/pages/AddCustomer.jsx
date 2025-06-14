import { useState } from "react";
import axiosInstance from "../axiosInstance";
import { useNavigate } from "react-router-dom";
import InternalNavbar from "../components/InternalNavbar";
import toast from "react-hot-toast";
import { useUserContext } from "../context/UserContext";

export default function AddCustomer() {
    const { user } = useUserContext();
  
  const [formData, setFormData] = useState({
    name: "",
    company: "",
    phone: "",
    email: "",
    address: "",
  });
const [submitting, setSubmitting] = useState(false);

  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
      setSubmitting(true);

    try {
      await axiosInstance.post("/customers", formData);
      toast.success("Customer added successfully!");
      if(user.role === "sales"){
        navigate('/dashboard')
      }else{
        navigate("/customers");
      }
    } catch (err) {
      console.error("Customer addition failed", err);
      alert("Failed to add customer");
    } finally {
    setSubmitting(false);
  }
  };

  return (
    <>
      <InternalNavbar />

      <div className="max-w-2xl mx-auto mt-8 px-4 sm:px-6 lg:px-8">
        <div className="relative bg-white p-6 sm:p-8 rounded-2xl shadow-lg">
          <button
            className="absolute left-4 cursor-pointer top-4 hidden md:inline-block bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded shadow"
            onClick={() => navigate(-1)}
          >
            ↩️ Back
          </button>

          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6 text-center">
            Add New Customer
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block mb-1 font-medium text-gray-700">Name</label>
              <input
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="Customer Name"
              />
            </div>

            <div>
              <label className="block mb-1 font-medium text-gray-700">GST No.</label>
              <input
                name="company"
                value={formData.company}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="GST No."
              />
            </div>

            <div>
              <label className="block mb-1 font-medium text-gray-700">Phone No.</label>
              <input
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="Phone Number"
              />
            </div>

            <div>
              <label className="block mb-1 font-medium text-gray-700">Email</label>
              <input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="Email Address"
              />
            </div>

            <div>
              <label className="block mb-1 font-medium text-gray-700">Address(Mention pincode)</label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="Address"
                rows={3}
              />
            </div>

           <button
  type="submit"
  disabled={submitting}
  className={`w-full font-semibold py-2 rounded-md shadow-md transition-all duration-200 ${
    submitting ? "bg-green-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700 text-white"
  }`}
>
  {submitting ? "Adding..." : "✅ Add Customer"}
</button>

          </form>
        </div>
      </div>
    </>
  );
}
