import { useState, useEffect } from 'react';
import axiosInstance from '../axiosInstance';
import { useUserContext } from '../context/UserContext';
import InternalNavbar from '../components/InternalNavbar';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

export default function DriverDispatchDashboard() {
  const { user, token } = useUserContext();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadingPlanId, setUploadingPlanId] = useState(null);
const [page, setPage] = useState(1);
const [totalPages, setTotalPages] = useState(1);
const limit = 6; // or any number you want per page

const fetchPlans = async (currentPage = 1) => {
    setLoading(true);
  try {
    const res = await axiosInstance.get(`/dispatch-plans/my-plans?page=${currentPage}&limit=${limit}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    setPlans(res.data.data); // response has data, totalPages, etc.
    setTotalPages(res.data.totalPages);
    setPage(currentPage);
  } catch (err) {
    console.error("Failed to fetch plans:", err);
  } finally {
    setLoading(false);
  }
};


useEffect(() => {
  if (token) fetchPlans(1);
}, [token]);



const markCompleted = async (id) => {
  const result = await Swal.fire({
    title: "Mark as Completed?",
    text: "Are you sure this dispatch is completed?",
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Yes, mark as completed",
    cancelButtonText: "Cancel",
    confirmButtonColor: "#28a745",
    cancelButtonColor: "#d33",
  });

  if (result.isConfirmed) {
    try {
      await axiosInstance.patch(
        `/dispatch-plans/${id}/status`,
        { status: "Completed" },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      Swal.fire("Success!", "Status updated to Completed.", "success");
      fetchPlans();
    } catch (err) {
      Swal.fire("Error", "Failed to update status.", "error");
    }
  }
};


  const handleImageUpload = async (e, planId) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploadingPlanId(planId);

    try {
      const uploadedUrls = [];

      for (let file of files) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", "todo_uploads");
        formData.append("cloud_name", "dcr8k5amk");

        const res = await fetch("https://api.cloudinary.com/v1_1/dcr8k5amk/image/upload", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error?.message || "Upload failed");

        uploadedUrls.push(data.secure_url);
      }

      await axiosInstance.patch(
        `/dispatch-plans/${planId}/images`,
        { imageUrls: uploadedUrls },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchPlans();
    } catch (err) {
      console.error("Upload error:", err);
      alert("Image upload failed. Please try again.");
    } finally {
      setUploadingPlanId(null);
    }
  };

  const showImages = (urls) => {
    MySwal.fire({
      html: (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {urls.map((url, i) => (
            <img key={i} src={url} alt="Uploaded" className="w-full max-h-64 object-contain rounded shadow" />
          ))}
        </div>
      ),
      width: '90vw',
      showConfirmButton: false,
      showCloseButton: true,
    });
  };

  return (
    <>
      <InternalNavbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold mb-6 text-center text-indigo-800">My Dispatch Plans</h2>

      {loading ? (
 <div className="flex justify-center items-center min-h-[200px] transition-opacity duration-300">
  <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
    <span className="ml-3 text-blue-600">Loading dispatch plans...</span>
  </div>
) : (
   <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan, index) => (
            <div
              key={plan._id}
              className="bg-white shadow-md rounded-lg p-4 border hover:shadow-lg transition"
            >
              <h3 className="font-semibold text-lg text-gray-800 mb-2">
                🚛 Vehicle: {plan.vehicleNumber}
              </h3>
              <p><strong>Customer:</strong> {plan.customerName}</p>
              <p><strong>Location:</strong> {plan.location}</p>
              <p><strong>Product:</strong> {plan.productName}</p>
              <p><strong>Remarks:</strong> {plan.remarks || '-'}</p>
              <p className="mt-2">
                <strong>Status:</strong>{" "}
                <span
                  className={`font-medium ${
                    plan.status === 'Completed' ? 'text-green-600' : 'text-yellow-600'
                  }`}
                >
                  {plan.status}
                </span>
              </p>

              <div className="mt-4 flex flex-col gap-2">
                {plan.status === 'Pending' && (
                  <button
                    onClick={() => markCompleted(plan._id)}
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded transition"
                  >
                    ✅ Mark Completed
                  </button>
                )}

                <label className="block">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, plan._id)}
                    className="text-sm bg-amber-300 w-full p-1 text-gray-600 mt-1"
                  />
                </label>

                {uploadingPlanId === plan._id && (
                  <p className="text-blue-500 text-sm">Uploading...</p>
                )}

                {plan.imageUrls?.length > 0 && (
                  <button
                    onClick={() => showImages(plan.imageUrls)}
                    className="text-indigo-600 hover:underline text-sm"
                  >
                    📷 View Images ({plan.imageUrls.length})
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
)}

<div className="flex justify-center gap-4 mt-6">
  <button
    disabled={page === 1}
    onClick={() => fetchPlans(page - 1)}
    className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
  >
    ⬅️ Previous
  </button>
  <span className="px-4 py-1">{page} / {totalPages}</span>
  <button
    disabled={page === totalPages}
    onClick={() => fetchPlans(page + 1)}
    className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
  >
    Next ➡️
  </button>
</div>

     {!loading && plans.length === 0 && (
  <p className="text-center text-gray-500 mt-8">No dispatch plans assigned.</p>
)}

      </div>
    </>
  );
}
