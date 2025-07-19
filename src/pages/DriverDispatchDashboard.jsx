import { useState, useEffect } from "react";
import axiosInstance from "../axiosInstance";
import { useUserContext } from "../context/UserContext";
import InternalNavbar from "../components/InternalNavbar";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const MySwal = withReactContent(Swal);

export default function DriverDispatchDashboard() {
  const { user, token } = useUserContext();
  const [plans, setPlans] = useState([]);
  const [customerDetails, setCustomerDetails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadingPlanId, setUploadingPlanId] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 6; // or any number you want per page
 
  const fetchPlans = async (currentPage = 1) => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(
        `/dispatch-plans/my-plans?page=${currentPage}&limit=${limit}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const activePlans = res.data.data.filter(
        (plan) => plan.status !== "Completed"
      );
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
    fetchPlans(1);

    // Fetch customer details once
    axiosInstance
      .get("/customers/all/dropdown", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setCustomerDetails(res.data);
      })
      .catch((err) => console.error("Failed to fetch customer details:", err));
  }, []);

  const showImages = (urls) => {
    MySwal.fire({
      html: (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {urls.map((url, i) => (
            <img
              key={i}
              src={url}
              alt="Uploaded"
              className="w-full max-h-64 object-contain rounded shadow"
            />
          ))}
        </div>
      ),
      width: "90vw",
      showConfirmButton: false,
      showCloseButton: true,
    });
  };
const openDieselEntryModal = async (plan) => {
  let locationText = "Location not available";

  // Fetch location
  try {
     // ⏳ Show loading overlay
    const loadingSwal = Swal.fire({
      title: "Loading...",
      html: "Please wait...",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });
    const pos = await new Promise((resolve, reject) =>
      navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true })
    );
    const { latitude, longitude } = pos.coords;
try {
  const geoRes = await fetch(`https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=4668826883d64e78895168e889e48122`);
  const geoData = await geoRes.json();
  const formatted = geoData?.results?.[0]?.formatted;
  locationText = formatted || `Lat: ${latitude.toFixed(5)}, Lng: ${longitude.toFixed(5)}`;
} catch {
  locationText = `Lat: ${latitude.toFixed(5)}, Lng: ${longitude.toFixed(5)}`;
}
  } catch {
    locationText = "Location unavailable";
  }

  const { value: formValues } = await Swal.fire({
    title: "⛽ Add Diesel Entry",
    html: `
      <input id="diesel-date" type="date" class="swal2-input" value="${new Date().toISOString().slice(0, 10)}" />
      <label for="kms-filled" class="block text-sm font-semibold text-gray-700 -mb-4">
    कृपया मान्य KM रीडिंग दर्ज करें
  </label>
      <input id="kms-reading" type="number" class="swal2-input" placeholder="KM Reading" />
       <label class="block text-sm font-semibold text-gray-700 -mb-4">भरा हुआ डीजल (लीटर में)</label>
      <input id="diesel-liters" type="number" class="swal2-input" placeholder="Diesel in Liters (optional)" />
      <video id="video" autoplay playsinline class="w-full mt-2 rounded shadow border" style="max-height: 200px;"></video>
      <canvas id="canvas" style="display:none;"></canvas>
      <button id="capture" class="swal2-confirm swal2-styled mt-3">📸 Capture Image</button>
      <img id="preview" class="w-full mt-3 hidden border rounded" />
      <p class="text-xs mt-2 text-gray-600">* Live camera only | Date, Time & Location will be embedded</p>
    `,
    didOpen: async () => {
      const video = document.getElementById("video");
      const canvas = document.getElementById("canvas");
      const preview = document.getElementById("preview");

      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      video.srcObject = stream;

      document.getElementById("capture").onclick = () => {
        const ctx = canvas.getContext("2d");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);

        // Add overlay text
        ctx.fillStyle = "white";
        ctx.font = "24px sans-serif";
        ctx.fillText(`📅 ${new Date().toLocaleString()}`, 20, 40);
        ctx.fillText(`📍 ${locationText}`, 20, 80);

        const imageData = canvas.toDataURL("image/jpeg", 0.8);
        preview.src = imageData;
        preview.classList.remove("hidden");
        window._dieselImageData = imageData;
      };
    },
    preConfirm: () => {
      const date = document.getElementById("diesel-date").value;
      const kmsReading = parseInt(document.getElementById("kms-reading").value);
      const dieselInput = document.getElementById("diesel-liters").value;
      const dieselLiters = dieselInput ? parseFloat(dieselInput) : null;
      const imageData = window._dieselImageData;

      if (!date || isNaN(kmsReading)) {
        Swal.showValidationMessage("Please enter a valid date and KM reading");
        return false;
      }

      if (!imageData) {
        Swal.showValidationMessage("Please capture an image before submitting");
        return false;
      }

const latLng = locationText.match(/Lat: ([-\d.]+), Lng: ([-\d.]+)/);
const lat = latLng ? parseFloat(latLng[1]) : null;
const lng = latLng ? parseFloat(latLng[2]) : null;

return { date, kmsReading, dieselLiters, imageData, lat, lng };
    },
    confirmButtonText: "Submit Entry",
    showCancelButton: true,
  });

  if (formValues) {
    try {
      setLoading(true);
      const { imageData, ...rest } = formValues;

      const blob = await (await fetch(imageData)).blob();
      const formData = new FormData();
      formData.append("file", blob);
      formData.append("upload_preset", "todo_uploads");
      formData.append("cloud_name", "dcr8k5amk");

      const res = await fetch("https://api.cloudinary.com/v1_1/dcr8k5amk/image/upload", {
        method: "POST",
        body: formData,
      });

      const uploadRes = await res.json();
      if (!uploadRes.secure_url) throw new Error("Upload failed");

      await axiosInstance.post("/diesel/add", {
        ...rest,
        vehicleNumber: plan.vehicleNumber,
        imageUrl: uploadRes.secure_url,
         driverName: plan.driverName,      // optional, for human trace
  planId: plan._id,                 // ✅ this is key
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      Swal.fire("✅ Entry Saved", "Diesel entry added successfully.", "success");
    } catch (err) {
      console.error("Failed to save diesel entry:", err);
      Swal.fire("❌ Error", "Failed to save diesel entry", "error");
    } finally {
      setLoading(false);
    }
  }
};

const markCompleted = async (planId) => {
  try {
    setUploadingPlanId(planId);

    // Only update the status — no image upload
    await axiosInstance.patch(
      `/dispatch-plans/${planId}/status`,
      { status: "Completed" },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    Swal.fire("✅ Completed!", "Plan marked as completed.", "success");
    fetchPlans(page);
  } catch (err) {
    console.error("Mark Completion Error:", err);
    Swal.fire("❌ Error", "Failed to mark as completed", "error");
  } finally {
    setUploadingPlanId(null);
  }
};


  return (
    <>
      <InternalNavbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold mb-6 text-center text-indigo-800">
          My Dispatch Plans
        </h2>
<div className="mt-6">
  <p className="text-sm text-gray-700 mb-2 font-semibold">📸 Sample Images:</p>
  <div className="flex flex-wrap gap-3 justify-start">
    {[
      "./images/sample1.jpg",
      "./images/sample2.jpg",
      "./images/sample3.jpg",
      "./images/sample4.jpg",
      "./images/sample5.jpg",
      "./images/sample6.jpg",
      "./images/sample7.jpg",
    ].map((src, i) => (
      <img
        key={i}
        src={src}
        loading="lazy"
        alt={`Sample ${i + 1}`}
        className="w-20 h-20 object-cover border border-gray-300 rounded-lg shadow cursor-pointer hover:scale-105 hover:shadow-lg transition-transform"
        onClick={() => {
          Swal.fire({
            imageUrl: src,
            imageAlt: `Sample ${i + 1}`,
            showCloseButton: true,
            showConfirmButton: false,
            width: "90%",
            background: "#f9fafb",
            customClass: {
              popup: "rounded-xl",
            },
          });
        }}
      />
    ))}
  </div>
</div>

        {loading ? (
          <div className="flex justify-center items-center min-h-[200px] transition-opacity duration-300">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="ml-3 text-blue-600">
              Loading dispatch plans...
            </span>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-10">
            {plans.map((plan) => (
              <div
                key={plan._id}
                className="relative backdrop-blur-md bg-white/80 shadow-xl border border-gray-200 rounded-3xl p-6 pt-14 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl overflow-hidden"
              >
                {/* Top Center Driver Badge */}
                <div className="absolute capitalize top-4 right-4 bg-indigo-600 text-white text-xs sm:text-sm px-4 py-1 rounded-full shadow-lg z-10">
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
                      <strong>Date of Trip:</strong>{" "}
                      {new Date(plan.dateOfTrip).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>Assigned On:</strong>{" "}
                      {new Date(plan.assignedOn).toLocaleString()}
                    </p>
                  </div>

                  {/* Grid Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-gray-700 text-sm">
                    {/* Customer Info Block - Full width */}
                    <div className="sm:col-span-2 space-y-1">
                      <strong className="text-gray-700">🏢 Customers:</strong>
                      {plan.customerNames?.map((customerName, i) => {
                        const detail = customerDetails.find(
                          (c) => c.name === customerName
                        );
                        return (
                          <div
                            key={i}
                            className="ml-2 mt-1 p-2 bg-blue-50 rounded-lg border border-blue-100 shadow-sm"
                          >
                            <p className="text-sm font-medium text-indigo-800">
                              {customerName}
                            </p>

                            {detail?.address && (
                              <p className="text-xs text-gray-600">
                                🏠 {detail.address}
                              </p>
                            )}
                            {detail?.phone && (
                              <p className="text-xs text-gray-600">
                                📞 {detail.phone}
                              </p>
                            )}

                            {detail?.locationLink && (
                              <a
                                href={detail.locationLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-600 underline hover:text-blue-800"
                              >
                                📍 View on Google Maps
                              </a>
                            )}
                          </div>
                        );
                      })}

                      {/* ✅ Remarks directly below customers */}
                      <p className="mt-3 break-words whitespace-pre-wrap">
                        <strong>📝 Remarks:</strong> {plan.remarks || "—"}
                      </p>
                    </div>

                    {/* Status */}
                    <p className="sm:col-span-2">
                      <strong>📊 Status:</strong>{" "}
                      <span
                        className={`inline-block font-semibold px-2 py-1 rounded-full text-xs ${
                          plan.status === "Completed"
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {plan.status}
                      </span>
                    </p>
                  </div>

                  {/* Audio Player */}
                  {plan.audioUrl && (
                    <div>
                      <label className="text-sm text-gray-500 font-medium block mb-1">
                        🎙️ Voice Note:
                      </label>
                      <audio
                        controls
                        className="w-full bg-white bg-opacity-80 rounded-lg shadow-md border"
                      >
                        <source src={plan.audioUrl} type="audio/mpeg" />
                      </audio>
                      <p className="text-xs text-red-500 mt-1">
                        🎧 Play Voice Message
                      </p>
                    </div>
                  )}
                  {plan.attachmentUrls?.length > 0 && (
                    <div className="mt-3 space-y-1">
                      <label className="text-sm text-gray-600 font-medium block">
                        📎 Attachments:
                      </label>
                      <div className="flex flex-wrap gap-3">
                        {plan.attachmentUrls.map((url, i) => {
                          const isImage = url.match(
                            /\.(jpeg|jpg|png|gif|webp)$/i
                          );
                          const isPdf = url.endsWith(".pdf");
                          return (
                            <div key={i} className="w-24 h-24 relative">
                              {isImage ? (
                                <img
                                  src={url}
                                  alt={`Attachment ${i + 1}`}
                                  className="w-full h-full object-cover rounded border cursor-pointer shadow"
                                  onClick={() =>
                                    Swal.fire({
                                      imageUrl: url,
                                      imageAlt: `Attachment ${i + 1}`,
                                      showCloseButton: true,
                                      showConfirmButton: false,
                                      width: "90%",
                                      background: "#f9fafb",
                                      customClass: { popup: "rounded-xl" },
                                    })
                                  }
                                />
                              ) : isPdf ? (
                                <a
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="w-full h-full flex items-center justify-center bg-red-100 text-red-800 font-semibold text-xs border rounded shadow hover:underline"
                                >
                                  📄 PDF
                                </a>
                              ) : (
                                <a
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block text-xs text-blue-600 underline"
                                >
                                  File {i + 1}
                                </a>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
{plan.status !== "Completed" && (
  <button
    onClick={() => openDieselEntryModal(plan)}
    className="bg-yellow-500 hover:bg-yellow-600 text-white font-medium px-4 py-2 rounded-xl transition-all shadow w-full"
  >
    ⛽ Add Diesel Entry
  </button>
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
          <span className="px-4 py-1">
            {page} / {totalPages}
          </span>
          <button
            disabled={page === totalPages}
            onClick={() => fetchPlans(page + 1)}
            className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
          >
            Next ➡️
          </button>
        </div>

        {!loading && plans.length === 0 && (
          <p className="text-center text-gray-500 mt-8">
            No dispatch plans assigned.
          </p>
        )}
      </div>
      {uploadingPlanId && (
        <div className="fixed inset-0 bg-[#000000b7] bg-opacity-50 z-[2147483647] flex items-center justify-center">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-white text-lg font-semibold">
              Uploading images...
            </p>
          </div>
        </div>
      )}
    </>
  );
}
