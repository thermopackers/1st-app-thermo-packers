import RecordRTC from 'recordrtc'; // ✅ Add this at the top
import Swal from "sweetalert2";
import { useState, useEffect } from "react";
import InternalNavbar from "../components/InternalNavbar";
import axiosInstance from "../axiosInstance";
import { useUserContext } from "../context/UserContext";
import toast from "react-hot-toast";



export default function AssignDispatchPlanForm() {
  const { user, loading, token } = useUserContext();
  const [submitting, setSubmitting] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
const [audioUrl, setAudioUrl] = useState(null);
const [recording, setRecording] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);
  const [recorder, setRecorder] = useState(null);
  const [customerNames, setCustomerNames] = useState([""]);
const [customerList, setCustomerList] = useState([]);
  const [formData, setFormData] = useState({
  vehicleNumber: "",
  location: "",
  remarks: "",
  driverName: "",
});
  const [registeredVehicles, setRegisteredVehicles] = useState([]);

const fetchRegisteredVehicles = async () => {
  try {
    const res = await axiosInstance.get("/vehicles/all", {
      headers: { Authorization: `Bearer ${token}` },
    });
    setRegisteredVehicles(res.data);
  } catch (err) {
    console.error("Failed to fetch registered vehicles:", err);
  }
};



const startRecording = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    const newRecorder = new RecordRTC(stream, {
      type: 'audio',
      mimeType: 'audio/wav',
      recorderType: RecordRTC.StereoAudioRecorder,
      numberOfAudioChannels: 1,
      desiredSampRate: 16000,
    });

    newRecorder.startRecording();
    setRecorder(newRecorder);
    setRecording(true);
  } catch (err) {
    console.error("🎤 Microphone access denied:", err);
    toast.error("Microphone access denied.");
  }
};

const stopRecording = () => {
  if (recorder) {
    recorder.stopRecording(() => {
      const blob = recorder.getBlob();
      setAudioBlob(blob);
      setAudioUrl(URL.createObjectURL(blob));
      setRecording(false);
    });
  }
};

const clearAudio = () => {
  setAudioBlob(null);
  setAudioUrl(null);
  setRecording(false);
};




useEffect(() => {
 fetchRegisteredVehicles();
}, []);


  const [drivers, setDrivers] = useState([]);
  const [plans, setPlans] = useState([]);
const [searchTerm, setSearchTerm] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
useEffect(() => {
  axiosInstance
    .get("/customers/all/dropdown", { headers: { Authorization: `Bearer ${token}` } })
    .then((res) => setCustomerList(res.data))
    .catch((err) => console.error("Error fetching customers:", err));
}, []);

const [newVehicle, setNewVehicle] = useState({
  vehicleNumber: "",
  driverEmail: "",
  driverName: "",
  driverPhone: "",
});

const handleVehicleRegister = async () => {
  try {
    const res = await axiosInstance.post("/vehicles/register", newVehicle, {
      headers: { Authorization: `Bearer ${token}` },
    });
    toast.success("Vehicle registered");
    setNewVehicle({ vehicleNumber: "", driverEmail: "", driverName: "", driverPhone: "" });
    fetchRegisteredVehicles(); // Refresh dropdown
  } catch (err) {
    toast.error(err.response?.data?.message || "Registration failed");
  }
};

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
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });

    if (!result.isConfirmed) return;

    try {
      await axiosInstance.delete(`/dispatch-plans/${planId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Plan deleted successfully");
      fetchPlans();
    } catch (err) {
      console.error("Error deleting plan:", err);
      toast.error("Failed to delete plan");
    }
  };

  const fetchPlans = async () => {
    setTableLoading(true);
    try {
      const query = new URLSearchParams({
        page,
  search: searchTerm, // ✅ unified search for customer or driver
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
    } finally {
      setTableLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchPlans();
  }, [token, page, searchTerm, filterDate]);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

const handleSubmit = async (e) => {
  e.preventDefault();

  const { vehicleNumber, driverName, location, remarks } = formData;

  // Validate required fields
  if (
    !vehicleNumber ||
    !driverName ||
    !location ||
    customerNames.length === 0 ||
    customerNames.some((name) => !name.trim())
  ) {
    toast.error("Please fill all required fields.");
    return;
  }

  setSubmitting(true);

  try {
    const payload = {
      vehicleNumber,
      driverName,
      location,
      remarks,
      customerNames,
    };

    // ✅ Upload audio if available
    if (audioBlob) {
      const audioForm = new FormData();
      audioForm.append("file", audioBlob);
      audioForm.append("upload_preset", "todo_uploads");
      audioForm.append("cloud_name", "dcr8k5amk");

      const res = await fetch("https://api.cloudinary.com/v1_1/dcr8k5amk/raw/upload", {
        method: "POST",
        body: audioForm,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Audio upload failed");

      payload.audioUrl = data.secure_url;
    }

    await axiosInstance.post("/dispatch-plans/assign", payload, {
      headers: { Authorization: `Bearer ${token}` },
    });

    toast.success("Plan assigned successfully");

    // Reset form
    setFormData({
      vehicleNumber: "",
      driverName: "",
      location: "",
      remarks: "",
    });
    setCustomerNames([""]);
    setAudioBlob(null);
    setAudioUrl(null);
    fetchPlans();
  } catch (err) {
    toast.error("Error assigning plan");
    console.error("🔥 ASSIGN ERROR:", err?.response?.data || err);
  } finally {
    setSubmitting(false);
  }
};




  if (loading) return <div className="p-6 text-center">Loading...</div>;
  if (!user)
    return <div className="p-6 text-center text-red-500">User not found</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      {submitting && (
        <div className="fixed inset-0 bg-[#000000b6] bg-opacity-30 z-50 flex items-center justify-center">
          <div className="w-16 h-16 border-4 border-white border-t-blue-600 rounded-full animate-spin"></div>
        </div>
      )}

      <InternalNavbar />
      <main className="max-w-7xl mx-auto px-4 py-6">
        {user.role !== "dispatch" && user.role !== "packaging" && (
          <>
        <div className="bg-white shadow p-4 rounded mb-6 max-w-3xl mx-auto">
  <h3 className="font-bold text-lg mb-2">Register New Vehicle</h3>

  <p className="text-sm text-gray-600 mb-4">
    <span className="font-medium text-gray-700">Format (eg.):</span>
    <code className="bg-gray-100 p-1 rounded text-sm">PB08 EL 9364 : pb08el9364thermopackers@gmail.com</code>
  </p>

  <div className="grid md:grid-cols-2 gap-4">
    <div className="flex flex-col">
      <label className="mb-1 font-medium text-sm text-gray-700">Vehicle Number</label>
      <input
        type="text"
        placeholder="Enter vehicle number (e.g. PB08 EL 9364)"
        className="border p-2 rounded"
        value={newVehicle.vehicleNumber.toUpperCase()}
        onChange={e => setNewVehicle(v => ({ ...v, vehicleNumber: e.target.value }))}
      />
    </div>

    <div className="flex flex-col">
      <label className="mb-1 font-medium text-sm text-gray-700">Vehicle Email</label>
      <input
        type="email"
        placeholder="Enter vehicle email (e.g. pb08el9364thermopackers@gmail.com)"
        className="border p-2 rounded"
        value={newVehicle.driverEmail}
        onChange={e => setNewVehicle(v => ({ ...v, driverEmail: e.target.value }))}
      />
    </div>
  </div>

  <button
    className="mt-4 bg-blue-600 text-white px-4 py-2 rounded"
    onClick={handleVehicleRegister}
  >
    Register Vehicle
  </button>
</div>



        <form
  onSubmit={handleSubmit}
  className={`grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto bg-white p-6 mt-6 rounded-xl shadow transition duration-200 ${
    submitting ? "blur-sm pointer-events-none" : ""
  }`}
>
  <h2 className="md:col-span-2 text-2xl font-bold text-blue-800">
    Assign Dispatch Plan
  </h2>

  <div className="flex flex-col">
    <label className="mb-1 font-medium text-sm text-gray-700">Vehicle Number</label>
    <select
      name="vehicleNumber"
      value={formData.vehicleNumber}
      onChange={handleChange}
      className="w-full p-2 border rounded shadow-sm"
    >
      <option value="">Select Vehicle</option>
      {registeredVehicles.map((v) => (
        <option key={v._id} value={v.vehicleNumber}>
          {v.vehicleNumber}
        </option>
      ))}
    </select>
  </div>

  <div className="flex flex-col">
    <label className="mb-1 font-medium text-sm text-gray-700">Driver Name</label>
    <input
      type="text"
      name="driverName"
      value={formData.driverName || ""}
      onChange={(e) =>
        setFormData((prev) => ({ ...prev, driverName: e.target.value }))
      }
      placeholder="Enter Driver Name"
      required
      className="w-full p-2 border rounded shadow-sm focus:ring-2 focus:ring-blue-300 focus:outline-none"
    />
  </div>

<div className="md:col-span-2">
  <label className="font-medium text-sm text-gray-700 mb-2 block">Customer Names</label>
  {customerNames.map((name, index) => (
    <div key={index} className="flex gap-2 mb-2">
      <select
        value={name}
        onChange={(e) => {
          const updated = [...customerNames];
          updated[index] = e.target.value;
          setCustomerNames(updated);
        }}
        className="w-full p-2 border rounded"
      >
        <option value="">Select Customer</option>
       {customerList.map((c) => (
  <option key={c._id} value={c.name}>{c.name}</option>
))}

      </select>
      {index > 0 && (
        <button
          type="button"
          onClick={() => {
            const updated = [...customerNames];
            updated.splice(index, 1);
            setCustomerNames(updated);
          }}
          className="text-red-500 font-bold"
        >
          ❌
        </button>
      )}
    </div>
  ))}
  <button
    type="button"
    onClick={() => setCustomerNames([...customerNames, ""])}
    className="mt-2 px-3 py-1 bg-blue-500 text-white rounded text-sm"
  >
    ➕ Add Customer
  </button>
</div>


  <div className="flex flex-col">
    <label className="mb-1 font-medium text-sm text-gray-700">Location</label>
    <input
      name="location"
      value={formData.location}
      onChange={handleChange}
      required
      placeholder="Location"
      className="w-full p-2 border rounded shadow-sm focus:ring-2 focus:ring-blue-300 focus:outline-none"
    />
  </div>

<div className="md:col-span-2">
  <label className="block text-sm font-medium mb-1">Voice Message</label>

  {audioUrl ? (
    <div className="flex items-center gap-4">
<audio controls className="w-full">
<source src={audioUrl} type="audio/wav" />
  Your browser does not support the audio element.
</audio>
      <button
        type="button"
        onClick={clearAudio}
        className="text-red-600 font-bold text-sm hover:underline"
      >
        ❌ Remove
      </button>
    </div>
  ) : recording ? (
    <button
      type="button"
      onClick={stopRecording}
      className="bg-red-500 text-white px-4 py-1 rounded"
    >
      ⏹️ Stop Recording
    </button>
  ) : (
    <button
      type="button"
      onClick={startRecording}
      className="bg-blue-600 text-white px-4 py-1 rounded"
    >
      🎙️ Start Recording
    </button>
  )}
</div>


  <div className="md:col-span-2 flex flex-col">
    <label className="mb-1 font-medium text-sm text-gray-700">Remarks</label>
    <textarea
      name="remarks"
      value={formData.remarks}
      onChange={handleChange}
      placeholder="Remarks"
      className="w-full p-2 border rounded shadow-sm focus:ring-2 focus:ring-blue-300 focus:outline-none"
    />
  </div>

  <button
    type="submit"
    className="md:col-span-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition font-medium"
  >
    Assign
  </button>
</form>
</>
        )}

        <div className="max-w-7xl mx-auto mt-10 px-4">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            Daily Dispatch Plan
          </h2>

          <div className="flex flex-wrap gap-4 mb-4 items-center">
           <input
  type="text"
  placeholder="Search by customer or driver"
  value={searchTerm}
  onChange={(e) => {
    setPage(1);
    setSearchTerm(e.target.value);
  }}
  className="border p-2 rounded w-full md:w-auto flex-1 shadow-sm focus:ring-2 focus:ring-blue-300 focus:outline-none"
/>


            <input
              type="date"
              value={filterDate}
              onChange={(e) => {
                setPage(1);
                setFilterDate(e.target.value);
              }}
              className="border p-2 rounded w-full md:w-auto flex-1 shadow-sm focus:ring-2 focus:ring-blue-300 focus:outline-none"
            />

            <button
              onClick={() => {
setSearchTerm("");
                setFilterDate("");
                setPage(1);
              }}
              className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-sm font-medium"
            >
              Clear Filters
            </button>
          </div>

          <div className="overflow-auto rounded shadow min-h-[200px] relative bg-white">
            {tableLoading ? (
              <div className="absolute inset-0 flex items-center justify-center bg-white/70 z-10">
                <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <table className="min-w-full bg-white text-sm rounded overflow-hidden shadow">
                <thead className="bg-blue-50 text-blue-800">
                  <tr className="text-left">
                    <th className="p-3 font-medium border">Sr No</th>
                    <th className="p-3 font-medium border">Vehicle</th>
                    <th className="p-3 font-medium border">Driver</th>
                          <th className="p-3 font-medium border">Customers</th>
                    <th className="p-3 font-medium border">Location</th>
                          <th className="p-3 font-medium border">Remarks</th> {/* ✅ New */}
                    <th className="p-3 font-medium border">Status</th>
                    <th className="p-3 font-medium border">Images</th>
                    <th className="p-3 font-medium border">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {plans.map((plan, index) => (
                    <tr key={plan._id} className="hover:bg-gray-100 transition">
                      <td className="p-3 border">
                        {(page - 1) * 10 + index + 1}
                      </td>
                      <td className="p-3 border">{plan.vehicleNumber}</td>
                      <td className="p-3 border">
                        {plan.driverName || plan.assignedTo?.name || "-"}
                      </td>
                             <td className="p-3 border">
  {Array.isArray(plan.customerNames) && plan.customerNames.length > 0
    ? plan.customerNames.join(", ")
    : "-"}
</td>

                      <td className="p-3 border">{plan.location}</td>
                              <td className="p-3 border">{plan.remarks || "-"}</td> {/* ✅ New */}
                      <td className="p-3 border">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            plan.status === "Completed"
                              ? "bg-green-600"
                              : "bg-yellow-500"
                          } text-white`}
                        >
                          {plan.status}
                        </span>
                      </td>
                    <td className="p-3 border align-top min-w-[300px]">
  <div className="flex gap-2 overflow-x-auto max-w-[400px] rounded-md py-1">

    {plan.imageUrls?.map((url, i) => (
      <img
        key={i}
        src={url}
        alt={`Uploaded ${i + 1}`}
        className="w-12 h-12 object-cover rounded-lg border border-gray-300 shadow-sm hover:scale-105 hover:shadow-lg transition-transform duration-200 cursor-pointer"
onClick={() => {
  Swal.fire({
    imageUrl: url,
    imageAlt: `Uploaded ${i + 1}`,
    showCloseButton: true,
    showConfirmButton: false,
    width: '90%',
    background: '#f9fafb',
    customClass: {
      popup: 'rounded-xl',
    },
  });
}}
        title={`Click to view image ${i + 1}`}
      />
    ))}
  </div>
</td>

                      <td className="p-3 border">
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
            )}
          </div>

          {/* Pagination */}
          <div className="flex justify-between items-center mt-6 text-sm gap-4 flex-wrap">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-4 py-2 rounded bg-blue-100 hover:bg-blue-200 text-blue-800 disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-gray-600">
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-4 py-2 rounded bg-blue-100 hover:bg-blue-200 text-blue-800 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
