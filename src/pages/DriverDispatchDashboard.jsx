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
console.log("plans",plans);

const fetchPlans = async (currentPage = 1) => {
    setLoading(true);
  try {
    const res = await axiosInstance.get(`/dispatch-plans/my-plans?page=${currentPage}&limit=${limit}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

const activePlans = res.data.data.filter(plan => plan.status !== "Completed");
setPlans(activePlans);
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



const markCompleted = async (planId) => {
  return new Promise((resolve) => {
    let selectedFiles = [];

    const renderImagePreview = () => {
      const previewContainer = document.getElementById("image-preview");
      if (!previewContainer) return;
      previewContainer.innerHTML = "";

      selectedFiles.forEach((file, index) => {
        const reader = new FileReader();
        reader.onload = () => {
          const wrapper = document.createElement("div");
          wrapper.className = "relative inline-block m-2";

          const img = document.createElement("img");
          img.src = reader.result;
          img.alt = `Image ${index + 1}`;
          img.className = "w-24 h-24 object-cover rounded border";

          const removeBtn = document.createElement("button");
          removeBtn.textContent = "🗙";
removeBtn.className = "absolute top-[-8px] right-[-8px] bg-red-600 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center hover:bg-red-700 transition";
          removeBtn.onclick = () => {
            selectedFiles.splice(index, 1);
            renderImagePreview();
          };

          wrapper.appendChild(img);
          wrapper.appendChild(removeBtn);
          previewContainer.appendChild(wrapper);
        };
        reader.readAsDataURL(file);
      });
    };

    Swal.fire({
      title: "Upload Images Before Completion",
      html: `
<input type="file" id="image-upload" multiple accept="image/*" class="swal2-file" style="background-color: #e0f2fe; padding: 10px; border-radius: 8px;" />
        <div id="image-preview" class="flex flex-wrap mt-3 gap-2"></div>
        <p class="text-sm text-gray-500 mt-2">Upload images as proof before marking complete.</p>
      `,
      showCancelButton: true,
      confirmButtonText: "Submit",
      cancelButtonText: "Cancel",
      didOpen: () => {
        const fileInput = Swal.getPopup().querySelector("#image-upload");
        fileInput.addEventListener("change", (e) => {
selectedFiles = [...selectedFiles, ...Array.from(e.target.files)];
          renderImagePreview();
        });
      },
      preConfirm: async () => {
        if (selectedFiles.length === 0) {
          Swal.showValidationMessage("Please upload at least one image");
          return false;
        }

        try {
          setUploadingPlanId(planId);

          const uploadedUrls = [];
          for (let file of selectedFiles) {
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

          // Save uploaded URLs
          await axiosInstance.patch(
            `/dispatch-plans/${planId}/images`,
            { imageUrls: uploadedUrls },
            { headers: { Authorization: `Bearer ${token}` } }
          );

          // Then update status
          await axiosInstance.patch(
            `/dispatch-plans/${planId}/status`,
            { status: "Completed" },
            { headers: { Authorization: `Bearer ${token}` } }
          );

          Swal.fire("✅ Completed!", "Plan marked as completed and images saved.", "success");
          fetchPlans(page);
        } catch (err) {
          console.error("Upload/Completion Error:", err);
          Swal.showValidationMessage("Something went wrong during upload. Try again.");
        } finally {
          setUploadingPlanId(null);
        }
      },
    });
  });
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
          console.log("🌐 Cloudinary upload response:", data); // ✅ DEBUG

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
        {plans.map((plan) => (
  <div
  key={plan._id}
  className="relative backdrop-blur-md bg-white/80 shadow-xl border border-gray-200 rounded-3xl p-6 pt-14 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl overflow-hidden"
>
  {/* Top Center Driver Badge */}
<div className="absolute top-4 right-4 bg-indigo-600 text-white text-xs sm:text-sm px-4 py-1 rounded-full shadow-lg z-10">
  👨‍✈️ For: {plan.driverName || "N/A"}
</div>


  {/* Card Body (below badge) */}
  <div className="space-y-4 mt-2">
    {/* Vehicle & Date */}
    <div>
      <h2 className="text-2xl font-extrabold text-indigo-800 tracking-wide">
        🚛 {plan.vehicleNumber}
      </h2>
      <p className="text-sm text-gray-600">
        <strong>Assigned On:</strong> {new Date(plan.assignedOn).toLocaleString()}
      </p>
    </div>

    {/* Grid Info */}
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-gray-700 text-sm">
      <p><strong>📍 Location:</strong> {plan.location}</p>
<p>
  <strong>🏢 Customers:</strong>{" "}
  {Array.isArray(plan.customerNames) && plan.customerNames.length > 0
    ? plan.customerNames.join(", ")
    : "—"}
</p>
      <p className="break-words whitespace-pre-wrap"><strong>📝 Remarks:</strong> {plan.remarks || "—"}</p>
      <p className="sm:col-span-2">
        <strong>📊 Status:</strong>{" "}
        <span className={`inline-block font-semibold px-2 py-1 rounded-full text-xs ${
          plan.status === "Completed" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
        }`}>
          {plan.status}
        </span>
      </p>
    </div>

    {/* Audio Player */}
    {plan.audioUrl && (
      <div>
        <label className="text-sm text-gray-500 font-medium block mb-1">🎙️ Voice Note:</label>
        <audio
          controls
          className="w-full bg-white bg-opacity-80 rounded-lg shadow-md border"
        >
          <source src={plan.audioUrl} type="audio/mpeg" />
        </audio>
        <p className="text-xs text-red-500 mt-1">🎧 Play Voice Message</p>
      </div>
    )}

    {/* Actions */}
    <div className="flex flex-col gap-3">
      {plan.status === "Pending" && (
        <button
          onClick={() => markCompleted(plan._id)}
          className="bg-emerald-500 hover:bg-emerald-600 text-white font-medium px-4 py-2 rounded-xl transition-all shadow"
        >
          ✅ Mark Completed
        </button>
      )}

     

      {plan.imageUrls?.length > 0 && (
        <button
          onClick={() => showImages(plan.imageUrls)}
          className="text-indigo-600 hover:text-indigo-800 underline text-sm font-semibold"
        >
          📷 View Images ({plan.imageUrls.length})
        </button>
      )}
    </div>
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
      {uploadingPlanId && (
  <div className="fixed inset-0 bg-[#000000b7] bg-opacity-50 z-[2147483647] flex items-center justify-center">
    <div className="flex flex-col items-center">
      <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-white text-lg font-semibold">Uploading images...</p>
    </div>
  </div>
)}

    </>
  );
}
