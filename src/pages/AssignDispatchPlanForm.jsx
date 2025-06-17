import { useState, useEffect } from "react";
import InternalNavbar from "../components/InternalNavbar";
import axiosInstance from "../axiosInstance";
import { useUserContext } from "../context/UserContext";
import toast from "react-hot-toast";

const vehicleOptions = [
  "PB08 EL 9364",
  "PB08 ER 8169",
  "PB08 EG 4821",
  "PB08 DC 2570",
  "PB08 DQ5360",
  "PB08 EN 3696",
  "PB08 FH 4109",
  "PB08 FR 2183",
];

export default function AssignDispatchPlanForm() {
  const { user, loading, token } = useUserContext();
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    vehicleNumber: "",
    driverEmail: "",
    customerName: "",
    location: "",
    productName: "",
    remarks: "",
  });
  const [manualVehicle, setManualVehicle] = useState("");
  const [drivers, setDrivers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [searchCustomer, setSearchCustomer] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (!token) return;
    axiosInstance
      .get("/users/get-all-users", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setDrivers(res.data.filter((u) => u.role === "driver"));
      })
      .catch((err) => console.error("Failed to fetch drivers:", err));
  }, [token]);
const handleDelete = async (planId) => {
  if (!window.confirm("Are you sure you want to delete this plan?")) return;

  try {
    await axiosInstance.delete(`/dispatch-plans/${planId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    alert("Plan deleted successfully.");
    fetchPlans();
  } catch (err) {
    console.error("Error deleting plan:", err);
    alert("Failed to delete plan.");
  }
};

  const fetchPlans = async () => {
    try {
      const query = new URLSearchParams({
        page,
        customer: searchCustomer,
        date: filterDate,
      });
      const res = await axiosInstance.get(
        `/dispatch-plans/paginated?${query}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setPlans(res.data.plans);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      console.error("Error fetching plans:", err);
    }
  };

  useEffect(() => {
    if (token) fetchPlans();
  }, [token, page, searchCustomer, filterDate]);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const vehicle = manualVehicle || formData.vehicleNumber;
    if (!vehicle) return alert("Please select or enter a vehicle number.");
  setSubmitting(true); // Show loader

    try {
      await axiosInstance.post(
        "/dispatch-plans/assign",
        { ...formData, vehicleNumber: vehicle },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      toast.success("Plan assigned successfully");
      setFormData({
        vehicleNumber: "",
        driverEmail: "",
        customerName: "",
        location: "",
        productName: "",
        remarks: "",
      });
      setManualVehicle("");
      fetchPlans();
    } catch (err) {
      toast.error("Error assigning plan");
      console.error(err);
    } finally {
    setSubmitting(false); // Hide loader
  }
  };

  if (loading) return <div className="p-6 text-center">Loading...</div>;
  if (!user)
    return <div className="p-6 text-center text-red-500">User not found</div>;

  return (
    <>
    {submitting && (
  <div className="fixed inset-0 bg-[#000000b6] bg-opacity-30 z-50 flex items-center justify-center">
    <div className="w-16 h-16 border-4 border-white border-t-blue-600 rounded-full animate-spin"></div>
  </div>
)}

      <InternalNavbar />

      {/* Assign Plan Form */}
      {user.role !== "dispatch" && user.role !== "packaging" && (
        <form
          onSubmit={handleSubmit}
  className={`max-w-3xl mx-auto bg-white p-6 mt-6 rounded-xl shadow space-y-4 transition duration-200 ${submitting ? "blur-sm pointer-events-none" : ""}`}
        >
          <h2 className="text-2xl font-bold text-blue-800">
            Assign Dispatch Plan
          </h2>

          <select
            name="vehicleNumber"
            value={formData.vehicleNumber}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          >
            <option value="">Select Vehicle</option>
            {vehicleOptions.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Or manually enter vehicle number"
            value={manualVehicle}
            onChange={(e) => setManualVehicle(e.target.value)}
            className="w-full p-2 border rounded"
          />

          <select
            name="driverEmail"
            value={formData.driverEmail}
            onChange={handleChange}
            required
            className="w-full p-2 border rounded"
          >
            <option value="">Select Driver</option>
            {drivers.map((d) => (
              <option key={d.email} value={d.email}>
                {d.name} ({d.email})
              </option>
            ))}
          </select>

          <input
            name="customerName"
            value={formData.customerName}
            onChange={handleChange}
            required
            placeholder="Customer Name"
            className="w-full p-2 border rounded"
          />
          <input
            name="location"
            value={formData.location}
            onChange={handleChange}
            required
            placeholder="Location"
            className="w-full p-2 border rounded"
          />
          <input
            name="productName"
            value={formData.productName}
            onChange={handleChange}
            required
            placeholder="Product Name"
            className="w-full p-2 border rounded"
          />
          <textarea
            name="remarks"
            value={formData.remarks}
            onChange={handleChange}
            placeholder="Remarks"
            className="w-full p-2 border rounded"
          />

          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition"
          >
            Assign
          </button>
        </form>
      )}

      {/* Dispatch Plan Table */}
      <div className="max-w-7xl mx-auto mt-10 px-4">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          Daily Dispatch Plan
        </h2>

        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <input
            type="text"
            placeholder="Search by customer"
            value={searchCustomer}
            onChange={(e) => {
              setPage(1);
              setSearchCustomer(e.target.value);
            }}
            className="border p-2 rounded w-full md:w-1/3"
          />

          <input
            type="date"
            value={filterDate}
            onChange={(e) => {
              setPage(1);
              setFilterDate(e.target.value);
            }}
            className="border p-2 rounded w-full md:w-1/4"
          />
        </div>

        <div className="overflow-auto rounded shadow">
          <table className="min-w-full bg-white text-sm">
           <thead className="bg-gray-100 text-left">
  <tr>
    <th className="p-2 border">Sr No</th>
    <th className="p-2 border">Vehicle</th>
    <th className="p-2 border">Driver</th>
    <th className="p-2 border">Customer</th>
    <th className="p-2 border">Location</th>
    <th className="p-2 border">Product</th>
    <th className="p-2 border">Status</th>
    <th className="p-2 border">Images</th>
    <th className="p-2 border">Actions</th>
  </tr>
</thead>


          <tbody>
  {plans.map((plan, index) => (
    <tr key={plan._id} className="hover:bg-gray-50">
      <td className="p-2 border">{(page - 1) * 10 + index + 1}</td>
      <td className="p-2 border">{plan.vehicleNumber}</td>
      <td className="p-2 border">{plan.driverName || plan.assignedTo?.name || "-"}</td>
      <td className="p-2 border">{plan.customerName}</td>
      <td className="p-2 border">{plan.location}</td>
      <td className="p-2 border">{plan.productName}</td>
      <td className="p-2 border">
        <span
          className={`px-2 py-1 rounded text-white text-xs ${
            plan.status === "Completed" ? "bg-green-600" : "bg-yellow-500"
          }`}
        >
          {plan.status}
        </span>
      </td>
      <td className="p-2 border whitespace-nowrap max-w-[150px] overflow-x-auto">
        {plan.imageUrls?.map((url, i) => (
          <img
            key={i}
            src={url}
            alt="Uploaded"
            className="inline-block w-10 h-10 object-cover rounded border mr-1 cursor-pointer"
            onClick={() => window.open(url, "_blank")}
          />
        ))}
      </td>
      <td className="p-2 border">
        <button
          onClick={() => handleDelete(plan._id)}
          className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs"
        >
          Delete
        </button>
      </td>
    </tr>
  ))}
</tbody>

          </table>
        </div>

        {/* Pagination */}
        <div className="flex justify-between items-center mt-4 text-sm">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
          >
            Previous
          </button>
          <span>
            Page {page} of {totalPages}
          </span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </>
  );
}
