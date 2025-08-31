import RecordRTC from 'recordrtc'; // ✅ Add this at the top
import Swal from "sweetalert2";
import { useState, useEffect, useRef } from "react";
import InternalNavbar from "../components/InternalNavbar";
import axiosInstance from "../axiosInstance";
import { useUserContext } from "../context/UserContext";
import toast from "react-hot-toast";
import VehicleDocumentManager from '../components/VehicleDocumentManager';



export default function AssignDispatchPlanForm() {
  const { user, loading, token } = useUserContext();
  const [submitting, setSubmitting] = useState(false);
  const [showVehicles, setShowVehicles] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [audioBlob, setAudioBlob] = useState(null);
    const [uploadingPlanId, setUploadingPlanId] = useState(null);
const [selectedVehicle, setSelectedVehicle] = useState(null);
const docsRef = useRef(null);

const [audioUrl, setAudioUrl] = useState(null);
const [customerDetails, setCustomerDetails] = useState([]);
const [recording, setRecording] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);
  const [recorder, setRecorder] = useState(null);
  const [customerNames, setCustomerNames] = useState([""]);
const [customerList, setCustomerList] = useState([]);
const [dieselImagesMap, setDieselImagesMap] = useState({});
  const [formData, setFormData] = useState({
  vehicleNumber: "",
  remarks: "",
  driverName: "",
    dateOfTrip: (() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0]; // YYYY-MM-DD
  })(),
});
  const [registeredVehicles, setRegisteredVehicles] = useState([]);
useEffect(() => {
  const fetchCustomerDetails = async () => {
    try {
      const res = await axiosInstance.get("/customers/all/dropdown", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCustomerDetails(res.data);
    } catch (err) {
      console.error("❌ Failed to fetch customer details", err);
    }
  };

  if (token) fetchCustomerDetails();
}, [token]);

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

useEffect(() => {
  if (selectedVehicle && docsRef.current) {
    docsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}, [selectedVehicle]);

useEffect(() => {
  if (user.role === "driver") {
    const driverVehicle = registeredVehicles.find(
      (v) => v.driverEmail === user.email
    );
    if (driverVehicle) {
      setFormData((prev) => ({
        ...prev,
        vehicleNumber: driverVehicle.vehicleNumber,
        driverName: user.name || driverVehicle.driverName || "",
      }));
    }
  }
}, [user, registeredVehicles]);


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
  console.log("plans", plans);
  
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
    phone: "", // ✅ Add this
});
const fetchPlans = async () => {
  setTableLoading(true);
  try {
    const query = new URLSearchParams({
      page,
      search: searchTerm,
      date: filterDate,
    });

    // 🟦 FIRST: FETCH DIESEL ENTRIES
    const dieselRes = await axiosInstance.get("/diesel/entries", {
      headers: { Authorization: `Bearer ${token}` },
    });

   const dieselMap = {};
dieselRes.data.forEach((entry) => {
  if (entry.planId) {
    if (!dieselMap[entry.planId]) dieselMap[entry.planId] = [];
    dieselMap[entry.planId].push(entry); // full entries, not just images
  }
});


    setDieselImagesMap(dieselMap); // Optional

    // ✅ THEN: FETCH DISPATCH PLANS
    const res = await axiosInstance.get(
      `/dispatch-plans/paginated?${query}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    // ✅ NOW: MERGE DIESEL IMAGES INTO PLANS
   const mergedPlans = res.data.plans.map((plan) => {
  const matchedVehicle = registeredVehicles.find(
    (v) => v.vehicleNumber === plan.vehicleNumber
  );

  const dispatchImages = plan.imageUrls || [];
  const dieselEntries = dieselMap[plan._id] || [];

  const dieselImages = dieselEntries.flatMap((d) => d.imageUrls || []);

  return {
    ...plan,
    gpsLink: matchedVehicle?.gpsLink || null,
    imageUrls: [...dispatchImages, ...dieselImages], // merged images
    dieselEntries, // ✅ new field
  };
});


    setPlans(mergedPlans);
    setTotalPages(res.data.totalPages);
  } catch (err) {
    console.error("Error fetching plans:", err);
  } finally {
    setTableLoading(false);
  }
};
const openDieselEntryModal = async (plan, existingEntry = null) => {
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
let video;
  const { value: formValues } = await Swal.fire({
    title: "⛽ Add Diesel Entry",
    html: `
<input id="diesel-date" type="date" class="swal2-input" value="${existingEntry?.date?.slice(0, 10) || new Date().toISOString().slice(0, 10)}" />
      <label for="kms-filled" class="block text-sm font-semibold text-gray-700 -mb-4">
    कृपया मान्य KM रीडिंग दर्ज करें
  </label>
<input id="kms-reading" type="number" class="swal2-input" placeholder="KM Reading" value="${existingEntry?.kmsReading ?? ''}" />
       <label class="block text-sm font-semibold text-gray-700 -mb-4">भरा हुआ डीजल (लीटर में)</label>
<input id="diesel-liters" type="number" class="swal2-input" placeholder="Diesel in Liters (optional)" value="${existingEntry?.dieselLiters ?? ''}" />
      <video id="video" autoplay playsinline class="w-full mt-2 rounded shadow border" style="max-height: 200px;"></video>
      <canvas id="canvas" style="display:none;"></canvas>
      <button id="capture" class="swal2-confirm swal2-styled mt-3">📸 Capture Image</button>
      <img id="preview" class="w-full mt-3 hidden border rounded" />
      <p class="text-xs mt-2 text-gray-600">* Live camera only | Date, Time & Location will be embedded</p>
      <label for="gallery-upload" class="swal2-input cursor-pointer bg-blue-100 text-blue-700 text-center hover:bg-blue-200 transition">
  📁 Choose from Gallery
</label>
<input id="gallery-upload" type="file" accept="image/*" multiple style="display:none;" />
    `,
 didOpen: async () => {
  video = document.getElementById("video");
  const canvas = document.getElementById("canvas");
  const previewContainer = document.createElement("div");
  previewContainer.id = "preview-container";
  previewContainer.classList.add("grid", "grid-cols-2", "gap-2", "mt-3");

  document.querySelector(".swal2-html-container").appendChild(previewContainer);

let stream;
try {
  // Try to get back camera first
  stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: { ideal: "environment" } }
  });
} catch (err1) {
  console.warn("Back camera not available, falling back to front camera:", err1);
  try {
    // Fallback to front camera
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user" }
    });
  } catch (err2) {
    console.error("Failed to access any camera:", err2);
    Swal.showValidationMessage("⚠️ Camera access denied or unavailable.");
    return;
  }
}
video.srcObject = stream;
  video.srcObject = stream;

  // 🧠 Setup image storage
  window._dieselImages = [];

  // ✅ 1. PRELOAD EXISTING IMAGES if editing
  if (existingEntry?.imageUrls?.length > 0) {
    for (const url of existingEntry.imageUrls) {
      window._dieselImages.push(url);

      const wrapper = document.createElement("div");
      wrapper.style.position = "relative";
      wrapper.style.maxHeight = "160px";
      wrapper.style.border = "1px solid #ccc";
      wrapper.style.borderRadius = "0.5rem";
      wrapper.style.overflow = "hidden";
      wrapper.style.boxShadow = "0 2px 6px rgba(0,0,0,0.1)";
      wrapper.style.marginBottom = "8px";

      const img = document.createElement("img");
      img.src = url;
      img.style.width = "100%";
      img.style.height = "auto";
      img.style.objectFit = "contain";

      const closeBtn = document.createElement("button");
      closeBtn.innerHTML = "❌";
      closeBtn.type = "button";
      closeBtn.style.position = "absolute";
      closeBtn.style.top = "4px";
      closeBtn.style.right = "4px";
      closeBtn.style.backgroundColor = "#dc2626";
      closeBtn.style.color = "white";
      closeBtn.style.fontSize = "12px";
      closeBtn.style.padding = "2px 6px";
      closeBtn.style.borderRadius = "9999px";
      closeBtn.style.cursor = "pointer";
      closeBtn.style.zIndex = "20";
      closeBtn.onclick = () => {
        wrapper.remove();
        window._dieselImages = window._dieselImages.filter((img) => img !== url);
      };

      wrapper.appendChild(img);
      wrapper.appendChild(closeBtn);
      previewContainer.appendChild(wrapper);
    }
  }

  // ✅ 2. Handle New Image Capture
  document.getElementById("capture").onclick = () => {
    const ctx = canvas.getContext("2d");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    ctx.fillStyle = "white";
    ctx.font = "24px sans-serif";
    ctx.fillText(`📅 ${new Date().toLocaleString()}`, 20, 40);
    ctx.fillText(`📍 ${locationText}`, 20, 80);

    const imageData = canvas.toDataURL("image/jpeg", 0.8);
    window._dieselImages.push(imageData);

    const wrapper = document.createElement("div");
    wrapper.style.position = "relative";
    wrapper.style.maxHeight = "160px";
    wrapper.style.border = "1px solid #ccc";
    wrapper.style.borderRadius = "0.5rem";
    wrapper.style.overflow = "hidden";
    wrapper.style.boxShadow = "0 2px 6px rgba(0,0,0,0.1)";
    wrapper.style.marginBottom = "8px";

    const img = document.createElement("img");
    img.src = imageData;
    img.style.width = "100%";
    img.style.height = "auto";
    img.style.objectFit = "contain";

    const closeBtn = document.createElement("button");
    closeBtn.innerHTML = "❌";
    closeBtn.type = "button";
    closeBtn.style.position = "absolute";
    closeBtn.style.top = "4px";
    closeBtn.style.right = "4px";
    closeBtn.style.backgroundColor = "#dc2626";
    closeBtn.style.color = "white";
    closeBtn.style.fontSize = "12px";
    closeBtn.style.padding = "2px 6px";
    closeBtn.style.borderRadius = "9999px";
    closeBtn.style.cursor = "pointer";
    closeBtn.style.zIndex = "20";
    closeBtn.onclick = () => {
      wrapper.remove();
      window._dieselImages = window._dieselImages.filter((img) => img !== imageData);
    };

    wrapper.appendChild(img);
    wrapper.appendChild(closeBtn);
    previewContainer.appendChild(wrapper);
  };
const galleryInput = document.getElementById("gallery-upload");
galleryInput.addEventListener("change", async (event) => {
  const files = Array.from(event.target.files);

  for (const file of files) {
    const imgElement = document.createElement("img");

    const reader = new FileReader();
    reader.onload = async () => {
      imgElement.src = reader.result;

      imgElement.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 800; // compress width
        const scaleSize = MAX_WIDTH / imgElement.width;
        canvas.width = MAX_WIDTH;
        canvas.height = imgElement.height * scaleSize;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(imgElement, 0, 0, canvas.width, canvas.height);

        // Compress to JPEG with 70% quality
        const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.7);

        window._dieselImages.push(compressedDataUrl);

        // Preview
        const wrapper = document.createElement("div");
        wrapper.style.position = "relative";
        wrapper.style.maxHeight = "160px";
        wrapper.style.border = "1px solid #ccc";
        wrapper.style.borderRadius = "0.5rem";
        wrapper.style.overflow = "hidden";
        wrapper.style.boxShadow = "0 2px 6px rgba(0,0,0,0.1)";
        wrapper.style.marginBottom = "8px";

        const img = document.createElement("img");
        img.src = compressedDataUrl;
        img.style.width = "100%";
        img.style.height = "auto";
        img.style.objectFit = "contain";

        const closeBtn = document.createElement("button");
        closeBtn.innerHTML = "❌";
        closeBtn.type = "button";
        closeBtn.style.position = "absolute";
        closeBtn.style.top = "4px";
        closeBtn.style.right = "4px";
        closeBtn.style.backgroundColor = "#dc2626";
        closeBtn.style.color = "white";
        closeBtn.style.fontSize = "12px";
        closeBtn.style.padding = "2px 6px";
        closeBtn.style.borderRadius = "9999px";
        closeBtn.style.cursor = "pointer";
        closeBtn.style.zIndex = "20";
        closeBtn.onclick = () => {
          wrapper.remove();
          window._dieselImages = window._dieselImages.filter((img) => img !== compressedDataUrl);
        };

        wrapper.appendChild(img);
        wrapper.appendChild(closeBtn);
        previewContainer.appendChild(wrapper);
      };
    };

    reader.readAsDataURL(file);
  }
});

Swal.getPopup().addEventListener("swalClose", () => {
  if (video.srcObject) {
    video.srcObject.getTracks().forEach((track) => track.stop());
    video.srcObject = null;
  }
});

},
    preConfirm: () => {
  const date = document.getElementById("diesel-date").value;
  const kmsReading = parseInt(document.getElementById("kms-reading").value);
  const dieselInput = document.getElementById("diesel-liters").value;
  const dieselLiters = dieselInput ? parseFloat(dieselInput) : null;
  const images = window._dieselImages || [];

  if (!date || isNaN(kmsReading)) {
    Swal.showValidationMessage("Please enter a valid date and KM reading");
    return false;
  }

  if (images.length === 0) {
    Swal.showValidationMessage("Please capture at least 1 image before submitting");
    return false;
  }

  const latLng = locationText.match(/Lat: ([-\d.]+), Lng: ([-\d.]+)/);
  const lat = latLng ? parseFloat(latLng[1]) : null;
  const lng = latLng ? parseFloat(latLng[2]) : null;

  return { date, kmsReading, dieselLiters, lat, lng, images };
},

    confirmButtonText: "Submit Entry",
    showCancelButton: true,
  });

 if (formValues) {
  try {
    const { images, ...rest } = formValues;

    // 🌀 Show loader overlay while uploading
    const loadingSwal = Swal.fire({
      title: "Uploading...",
      html: "Please wait while we save your entry.",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

   const uploadUrls = [];

for (const img of images) {
  if (img.startsWith("http")) {
    // ✅ Already uploaded, no need to upload again
    uploadUrls.push(img);
    continue;
  }

  const blob = await (await fetch(img)).blob();
  const formData = new FormData();
  formData.append("file", blob);
  formData.append("upload_preset", "todo_uploads");

  const res = await fetch("https://api.cloudinary.com/v1_1/dcr8k5amk/image/upload", {
    method: "POST",
    body: formData,
  });

  const uploadRes = await res.json();
  if (uploadRes.secure_url) {
    uploadUrls.push(uploadRes.secure_url);
  }
}


    if (uploadUrls.length === 0) throw new Error("No images uploaded");

  if (existingEntry?._id) {
  // UPDATE
  await axiosInstance.patch(
    `/diesel/update/${existingEntry._id}`,
    {
      ...rest,
    imageUrls: uploadUrls, // ✅ send only final image array (old + new, deduplicated)
    },
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
} else {
  // NEW ENTRY
  await axiosInstance.post(
    "/diesel/add",
    {
      ...rest,
      vehicleNumber: plan.vehicleNumber,
      imageUrls: uploadUrls,
      driverName: plan.driverName,
      planId: plan._id,
    },
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
}


    // ✅ Close loading modal
    Swal.close();
if (video.srcObject) {
  video.srcObject.getTracks().forEach((track) => track.stop());
  video.srcObject = null;
}

    // ✅ Show success message
    Swal.fire("✅ Entry Saved", "Diesel entry added successfully.", "success");
  } catch (err) {
    console.error("Failed to save diesel entry:", err);

    // ❌ Make sure loader is closed before error
    Swal.close();
    Swal.fire("❌ Error", "Failed to save diesel entry", "error");
  } finally {
    setUploadingPlanId(null);
  }
} else {
  setUploadingPlanId(null);
}

};
const handleVehicleRegister = async () => {
  try {
    const res = await axiosInstance.post("/vehicles/register", newVehicle, {
      headers: { Authorization: `Bearer ${token}` },
    });
    toast.success("Vehicle registered");
    setNewVehicle({ vehicleNumber: "", driverEmail: "", driverName: "", gpsLink: "" });
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

const handleEditTripDate = async (planId, currentDate) => {
  const { value: formValues } = await Swal.fire({
    title: "Edit Date of Trip",
    html: `
      <input type="date" id="trip-date" class="swal2-input" value="${currentDate ? new Date(currentDate).toISOString().split("T")[0] : ''}" />
    `,
    focusConfirm: false,
    preConfirm: () => {
      const date = document.getElementById("trip-date").value;
      if (!date) {
        Swal.showValidationMessage("Please select a valid date.");
        return false;
      }
      return date;
    },
    showCancelButton: true,
    confirmButtonText: "Update Date",
    cancelButtonText: "Cancel",
  });

  if (!formValues) return;

  try {
    await axiosInstance.patch(
      `/dispatch-plans/${planId}/date`,
      { dateOfTrip: formValues },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    toast.success("Date of Trip updated");
    fetchPlans(); // Refresh the table
  } catch (err) {
    console.error("Failed to update date:", err);
    toast.error("Failed to update date");
  }
};


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



useEffect(() => {
  if (token && registeredVehicles.length > 0) {
    fetchPlans();
  }
}, [token, page, searchTerm, filterDate, registeredVehicles]);


  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

const handleSubmit = async (e) => {
  e.preventDefault();

  const { vehicleNumber, driverName, remarks } = formData;

 if (!vehicleNumber || !driverName) {
  toast.error("Please select vehicle and driver name.");
  return;
}
if (customerNames.length === 0 || customerNames.some((name) => !name.trim())) {
  toast.error("Please enter valid customer name(s).");
  return;
}


  setSubmitting(true);

  try {
    const payload = {
      vehicleNumber,
      driverName,
      remarks,
      customerNames,
        dateOfTrip: formData.dateOfTrip, // ✅ Add this
    };

    // ✅ Upload audio if exists
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

    // ✅ Upload image/PDF attachments if exist
    if (attachments.length > 0) {
      const uploadedFiles = [];

      for (let file of attachments) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", "todo_uploads");
        formData.append("cloud_name", "dcr8k5amk");

        const uploadUrl = file.type === "application/pdf"
          ? "https://api.cloudinary.com/v1_1/dcr8k5amk/raw/upload"
          : "https://api.cloudinary.com/v1_1/dcr8k5amk/image/upload";

        const res = await fetch(uploadUrl, {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error?.message || "Attachment upload failed");

        uploadedFiles.push(data.secure_url);
      }

      payload.attachmentUrls = uploadedFiles;
    }

    // ✅ Send the final payload
    await axiosInstance.post("/dispatch-plans/assign", payload, {
      headers: { Authorization: `Bearer ${token}` },
    });

    toast.success("Plan assigned successfully");

    // ✅ Reset all fields
  setFormData({
  vehicleNumber: "",
  driverName: "",
  location: "",
  remarks: "",
  dateOfTrip: (() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  })(),
});

    setCustomerNames([""]);
    setAudioBlob(null);
    setAudioUrl(null);
    setAttachments([]); // ✅ reset file state
    fetchPlans();
  } catch (err) {
    toast.error("Error assigning plan");
    console.error("🔥 ASSIGN ERROR:", err?.response?.data || err);
  } finally {
    setSubmitting(false);
  }
};

const handleEditVehicle = async (vehicle) => {
  const { value: updatedValues } = await Swal.fire({
    title: "Edit Vehicle",
    html: `
      <input type="text" id="vehicleNumber" class="swal2-input" placeholder="Vehicle Number" value="${vehicle.vehicleNumber}" disabled />
      <input type="email" id="driverEmail" class="swal2-input" placeholder="Driver Email" value="${vehicle.driverEmail}" />
      <input type="tel" id="phone" class="swal2-input" placeholder="Phone" value="${vehicle.phone || ""}" />
      <input type="url" id="gpsLink" class="swal2-input" placeholder="GPS Link" value="${vehicle.gpsLink || ""}" />
    `,
    focusConfirm: false,
    showCancelButton: true,
    preConfirm: () => {
      return {
        driverEmail: document.getElementById("driverEmail").value,
        phone: document.getElementById("phone").value,
        gpsLink: document.getElementById("gpsLink").value,
      };
    },
  });

  if (!updatedValues) return;

  try {
    await axiosInstance.patch(`/vehicles/update/${vehicle._id}`, updatedValues, {
      headers: { Authorization: `Bearer ${token}` },
    });
    toast.success("Vehicle updated");
    fetchRegisteredVehicles(); // Refresh list
  } catch (err) {
    console.error("❌ Error updating vehicle:", err);
    toast.error(err.response?.data?.message || "Update failed");
  }
};

const handleEditDieselEntry = async (entry) => {
  const { value: formValues } = await Swal.fire({
    title: "Edit Diesel Entry",
    html: `
      <input type="number" id="dieselQuantity" class="swal2-input" placeholder="Diesel Quantity (in L)" value="${entry.dieselQuantity || ""}" />
      <input type="number" id="reading" class="swal2-input" placeholder="Vehicle Reading" value="${entry.reading || ""}" />
    `,
    focusConfirm: false,
    preConfirm: () => {
      const dieselQuantity = document.getElementById("dieselQuantity").value;
      const reading = document.getElementById("reading").value;

      if (!dieselQuantity || isNaN(dieselQuantity)) {
        Swal.showValidationMessage("Enter a valid diesel quantity.");
        return false;
      }

  return {
  dieselLiters: parseFloat(dieselQuantity),
  kmsReading: parseInt(reading),
};

    },
    showCancelButton: true,
    confirmButtonText: "Update",
    cancelButtonText: "Cancel",
  });

  if (!formValues) return;

  try {
    await axiosInstance.patch(`/diesel/update/${entry._id}`, formValues, {
      headers: { Authorization: `Bearer ${token}` },
    });
    toast.success("Diesel entry updated");
    fetchPlans(); // refresh
  } catch (err) {
    toast.error("Failed to update diesel entry");
    console.error("❌ Diesel update failed:", err);
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
           {user.role !== "driver" && (
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
    <div className="flex flex-col">
  <label className="mb-1 font-medium text-sm text-gray-700">GPS Link (optional)</label>
  <input
    type="url"
    placeholder="Paste GPS tracking link"
    className="border p-2 rounded"
    value={newVehicle.gpsLink}
    onChange={(e) =>
      setNewVehicle((v) => ({ ...v, gpsLink: e.target.value }))
    }
  />
</div>
<div className="flex flex-col">
  <label className="mb-1 font-medium text-sm text-gray-700">Driver Phone</label>
  <input
    type="tel"
    placeholder="e.g. 9876543210"
    className="border p-2 rounded"
    value={newVehicle.phone || ""}
    onChange={(e) =>
      setNewVehicle((v) => ({ ...v, phone: e.target.value.replace(/\D/g, '') }))
    }
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
        

<div className="flex justify-center mt-4">
  <button
    onClick={() => setShowVehicles((prev) => !prev)}
    className="mb-2 bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 transition"
  >
    {showVehicles ? "Hide Registered Vehicles" : "Show Registered Vehicles"}
  </button>
</div>
</>
 )}

<div
  className={`transition-all duration-500 ease-in-out transform ${
    showVehicles
      ? "max-h-[1000px] overflow-y-auto opacity-100 scale-100"
      : "max-h-0 opacity-0 scale-95"
  }`}
>

  <div className="mt-6">
    <h4 className="font-semibold text-md mb-2 text-center">Registered Vehicles</h4>
  <ul className="space-y-2">
  {registeredVehicles.map((vehicle) => (
    <li
      key={vehicle._id}
      className="flex justify-between items-center border p-2 rounded shadow-sm"
    >
      <div>
        <p className="font-medium">{vehicle.vehicleNumber}</p>
        <p className="text-sm text-gray-600">{vehicle.driverEmail}</p>
      </div>
      <div className="flex gap-2">
        <button
          className="text-blue-600 underline text-sm"
          onClick={() => handleEditVehicle(vehicle)}
        >
          ✏️ Edit
        </button>
        <button
          className="text-green-600 underline text-sm"
          onClick={() => setSelectedVehicle(vehicle)}
        >
          📄 Manage Docs
        </button>
      </div>
    </li>
  ))}
  {selectedVehicle && user.role === "accounts" && (
  <div ref={docsRef} className="mt-6 p-4 border rounded bg-white shadow">
    <h3 className="font-semibold mb-2">
      Managing Documents for: {selectedVehicle.vehicleNumber}
    </h3>
    <VehicleDocumentManager vehicleNumber={selectedVehicle.vehicleNumber} />
  </div>
)}

</ul>

  </div>
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
  <label className="mb-1 font-medium text-sm text-gray-700">Date of Trip</label>
  <input
    type="date"
    name="dateOfTrip"
    value={formData.dateOfTrip}
    onChange={handleChange}
    className="w-full p-2 border rounded shadow-sm"
    required
  />
</div>

  <div className="flex flex-col">
    <label className="mb-1 font-medium text-sm text-gray-700">Vehicle Number</label>
   <select
  name="vehicleNumber"
  value={formData.vehicleNumber}
  onChange={handleChange}
  className="w-full p-2 border rounded shadow-sm"
  disabled={user.role === "driver"}
>

      <option value="">Select Vehicle</option>
    {registeredVehicles
  .filter((v) =>
    user.role === "driver"
      ? v.driverEmail === user.email // only their vehicle
      : true // show all for others
  )
  .map((v) => (
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
  // value={formData.driverName || ""}
  onChange={(e) =>
    setFormData((prev) => ({ ...prev, driverName: e.target.value }))
  }
  placeholder="Enter Driver Name"
  required
  className="w-full p-2 border rounded shadow-sm"
/>

  </div>

<div className="md:col-span-2">
  <label className="font-medium text-sm text-gray-700 mb-2 block">Customer Names</label>

{customerNames.map((name, index) => {
  const customer = customerList.find(c => c.name === name);

  return (
    <div key={index} className="flex flex-col gap-1 mb-3">
      <div className="flex gap-2">
       <input
  type="text"
  placeholder="Search customer..."
  value={name}
  onChange={(e) => {
    const updated = [...customerNames];
    updated[index] = e.target.value;
    setCustomerNames(updated);
  }}
  list={`customer-options-${index}`}
  className="w-full p-2 border rounded"
/>

<datalist id={`customer-options-${index}`}>
  {customerList
    .filter((c) => c.name.toLowerCase().includes(name.toLowerCase()))
    .map((c) => (
      <option key={c._id} value={c.name} />
    ))}
</datalist>


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

      {/* ✅ Address if exists */}
      {customer?.address && (
         <div className='flex items-center text-sm text-gray-600'>
        
        <span>address:</span>
        <p className="text-sm text-gray-600 ml-1">🏠 {customer.address}</p></div>
      )}

      {/* ✅ Google Maps link if exists */}
      {customer?.locationLink && (
        <div className='flex items-center text-sm text-gray-600'>
        
        <span>location:</span>
        <a
          href={customer.locationLink}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-blue-600 underline ml-1"
        >
          📍 View Location on Google Maps
        </a>
        </div>
      )}
    </div>
  );
})}


  <button
    type="button"
    onClick={() => setCustomerNames([...customerNames, ""])}
    className="mt-2 px-3 py-1 bg-blue-500 text-white rounded text-sm"
  >
    ➕ Add Customer
  </button>
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

<div className="md:col-span-2">
  <label className="block text-sm font-medium mb-1">Attachments (Images/PDFs)</label>
  <input
    type="file"
    multiple
    accept="image/*,.pdf"
    onChange={(e) => {
      const files = Array.from(e.target.files);
      setAttachments((prev) => [...prev, ...files]);
    }}
    className="mb-2"
  />

  <div className="flex flex-wrap gap-4">
    {attachments.map((file, index) => {
      const isImage = file.type.startsWith("image/");
      const previewUrl = URL.createObjectURL(file);
      return (
        <div key={index} className="relative">
          {isImage ? (
            <img
              src={previewUrl}
              alt={`preview ${index}`}
              className="w-20 h-20 object-cover border rounded"
            />
          ) : (
            <a
              href={previewUrl}
              target="_blank"
              rel="noreferrer"
              className="block text-xs border p-2 rounded w-20 h-20 bg-gray-100 flex items-center justify-center text-blue-600 text-center"
            >
              PDF File
            </a>
          )}
          <button
            type="button"
            onClick={() => {
              const updated = [...attachments];
              updated.splice(index, 1);
              setAttachments(updated);
            }}
            className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center"
          >
            ×
          </button>
        </div>
      );
    })}
  </div>
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
            {user.role !== "driver" && (

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
                          <th className="p-3 font-medium border">Date of Trip</th> {/* ✅ New */}
                    <th className="p-3 font-medium border">Vehicle</th>
                    <th className="p-3 font-medium border">LIVE location /(GPS Link for Tempo/Tracking)</th>
                    <th className="p-3 font-medium border">Driver</th>
                          <th className="p-3 font-medium border">Customers</th>
                          <th className="p-3 font-medium border">Remarks</th> {/* ✅ New */}
                    <th className="p-3 font-medium border">Status</th>
                    <th className="p-3 font-medium border">Images</th>
                    <th className="p-3 font-medium border">Actions</th>
                    <th className="p-3 font-medium border">Fuels/Readings by Drivers</th>
                  </tr>
                </thead>
                <tbody>
                  {plans.map((plan, index) => (
                    <tr key={plan._id} className="hover:bg-gray-100 transition">
                      <td className="p-3 border">
                        {(page - 1) * 10 + index + 1}
                      </td>
                      <td className="p-3 border text-xs text-gray-800">
  <div className="flex items-center gap-2">
    {plan.dateOfTrip ? (
      <span>{new Date(plan.dateOfTrip).toLocaleDateString()}</span>
    ) : (
      <span className="text-gray-400">—</span>
    )}
    <button
      onClick={() => handleEditTripDate(plan._id, plan.dateOfTrip)}
      className="text-blue-600 underline text-xs hover:text-blue-800"
    >
      Edit
    </button>
  </div>
</td>
                      <td className="p-3 border">{plan.vehicleNumber}</td>
                      <td className="p-3 border">
  {plan.gpsLink ? (
    <a
      href={plan.gpsLink}
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-600 hover:underline text-xs"
    >
      🔗 View GPS
    </a>
  ) : (
    <span className="text-gray-400 text-xs">No Link</span>
  )}
</td>

                      <td className="p-3 border">
                        {plan.driverName || plan.assignedTo?.name || "-"}
                      </td>

<td className="p-3 border space-y-2">
  {/* If plan.customerNames (array) exists and has values */}
  {Array.isArray(plan.customerNames) && plan.customerNames.length > 0 ? (
    plan.customerNames.map((name, i) => {
      if (!customerDetails || customerDetails.length === 0) return null;
      const customer = customerDetails.find(c => c.name === name);
      return (
        <div key={i} className="text-xs leading-snug">
          <p className="font-medium text-gray-700">{name}</p>
          {customer?.address && (
            <p className="text-gray-500">🏠 {customer.address}</p>
          )}
          {customer?.phone && (
            <p className="text-gray-500">📞 {customer.phone}</p>
          )}
          {customer?.locationLink && (
            <a
              href={customer.locationLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline hover:text-blue-800"
            >
              📍 Google Maps
            </a>
          )}
        </div>
      );
    })
  ) : (
    // Else show plan.customerName if it exists
    plan.customerName && (
      <div className="text-xs leading-snug">
        <p className="font-semibold text-gray-800">{plan.customerName}</p>
      </div>
    )
  )}
</td>
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
        <td className="p-3 border align-top min-w-[300px] max-w-[400px]">
  <div className="flex gap-2 overflow-x-auto rounded-md py-1">
{(plan.imageUrls || []).map((url, i) => (
      <img
        key={i}
        src={url}
        alt={`Uploaded ${i + 1}`}
        loading="lazy"
        width={48}
        height={48}
        className="w-14 h-14 object-cover rounded-lg border border-gray-300 shadow-sm hover:scale-105 hover:shadow-lg transition-transform duration-200 cursor-pointer"
        title={`Click to view image ${i + 1}`}
        onClick={() => {
          Swal.fire({
            imageUrl: url,
            imageAlt: `Uploaded ${i + 1}`,
            showCloseButton: true,
            showConfirmButton: false,
            width: '90%',
            background: '#f9fafb',
            customClass: { popup: 'rounded-xl' },
          });
        }}
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
                     <td className="p-3 border text-xs leading-tight align-top">
  {(plan.dieselEntries || []).length > 0 ? (
    plan.dieselEntries.map((entry, i) => (
      <div key={entry._id || i} className="mb-2 border-b pb-1">
        <p><span className="font-semibold">Diesel:</span> {entry.dieselLiters ?? entry.dieselQuantity ?? "Not recorded"} L</p>
        <p><span className="font-semibold">Reading:</span> {entry.kmsReading ?? entry.reading ?? "Not recorded"}</p>
        <button
          onClick={() => handleEditDieselEntry(entry)}
          className="text-blue-600 text-xs underline"
        >
          Edit
        </button>
      </div>
    ))
  ) : (
    <p className="text-gray-400 italic">No diesel entries</p>
  )}

  {/* ✅ Add Button to open modal for ADD/EDIT diesel manually */}
  <button
    onClick={() => openDieselEntryModal(plan)}
    className="mt-2 inline-block bg-yellow-500 hover:bg-yellow-600 text-white text-xs px-2 py-1 rounded"
  >
    ➕ Add Entry
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
            )}
      </main>
    </div>
  );
}
