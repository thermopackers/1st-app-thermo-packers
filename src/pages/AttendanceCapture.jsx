import React, { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";
import ReactWebcam from "react-webcam";
import Swal from "sweetalert2";
import axiosInstance from "../axiosInstance";
import axios from "axios";
import { loadLabeledDescriptorForUser } from "../utils/labeledDescriptors";
import { useUserContext } from "../context/UserContext";

export default function AttendanceCapture() {
    const { user } = useUserContext();
  const webcamRef = useRef(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [showLivenessPrompt, setShowLivenessPrompt] = useState(false);
const [livenessCountdown, setLivenessCountdown] = useState(3);
  const [capturing, setCapturing] = useState(false);
  const [type, setType] = useState("");
  const [captureTimestamp, setCaptureTimestamp] = useState("");
  const [descriptorCache, setDescriptorCache] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const [showFaceRegistration, setShowFaceRegistration] = useState(false);


const captureImageWithTimestamp = () => {
  return new Promise((resolve, reject) => {
    const screenshot = webcamRef.current?.getScreenshot();

    if (!screenshot || screenshot.length < 1000) {
      console.warn("❌ Screenshot is blank or invalid");
      return reject("Invalid screenshot");
    }

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width; // Don't hardcode 240x180 yet
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);

      const timestamp = new Date().toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "medium",
      });

      ctx.fillStyle = "white";
      ctx.font = "16px sans-serif";
      ctx.fillText(timestamp, 10, canvas.height - 10);

      const finalImage = canvas.toDataURL("image/jpeg", 0.9);
      resolve(finalImage);
    };

    img.onerror = () => {
      console.error("❌ Failed to load captured image");
      reject("Failed to load captured image");
    };

    img.src = screenshot;
  });
};



  // ✅ Load face-api models only in this component
useEffect(() => {
  const loadModels = async () => {
    try {
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
        faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
        faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
      ]);
      console.log("✅ Face-api models loaded");
      setModelsLoaded(true);
    } catch (err) {
      console.error("❌ Model load error:", err);
      Swal.fire("Error", "Failed to load face recognition models", "error");
    }
  };

  loadModels();
}, []);

useEffect(() => {
  if (user?.name && modelsLoaded) {
    getDescriptor(); // preload descriptor for speed
  }
}, [user, modelsLoaded]);



const compressImage = (base64Str, quality = 0.3) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      const compressed = canvas.toDataURL("image/jpeg", quality);
      resolve(compressed);
    };
    img.src = base64Str;
  });
};



const getLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject("Geolocation not supported");
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => {
        console.warn("Geolocation error:", err);
        resolve({ lat: null, lng: null });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });
};


const getDescriptor = async () => {
  if (descriptorCache) return descriptorCache;
  const descriptor = await loadLabeledDescriptorForUser(user.name);
  setDescriptorCache(descriptor);
  return descriptor;
};


const saveAttendance = async () => {
  if (!modelsLoaded) {
    Swal.fire("Please wait", "Face recognition models are still loading.", "info");
    return;
  }

  // ⏳ Countdown before capture
  setShowLivenessPrompt(true);
  for (let i = 3; i > 0; i--) {
    setLivenessCountdown(i);
    await new Promise((res) => setTimeout(res, 1000));
  }
  setShowLivenessPrompt(false);

  console.time("🕒 Total Attendance Time");
  setIsSaving(true);

  try {
  const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 96 });

// 📸 First frame
const image1 = await captureImageWithTimestamp();
if (!image1 || image1.length < 1000) {
  Swal.fire("Error", "Camera capture failed. Please try again.", "error");
  setIsSaving(false);
  return;
}
console.log("📸 Image1 Base64 (len):", image1?.length);

const img1 = await faceapi.fetchImage(image1);

// Small wait
await new Promise((res) => setTimeout(res, 500));

// 📸 Second frame
const image2 = await captureImageWithTimestamp();
if (!image2 || image2.length < 1000) {
  Swal.fire("Error", "Second camera frame failed.", "error");
  setIsSaving(false);
  return;
}
console.log("📸 Image2 Base64 (len):", image2?.length);

const img2 = await faceapi.fetchImage(image2);

// Face detection
const [face1, face2] = await Promise.all([
  faceapi.detectSingleFace(img1, options).withFaceLandmarks().withFaceDescriptor(),
  faceapi.detectSingleFace(img2, options).withFaceLandmarks().withFaceDescriptor(),
]);

if (!face1 || !face2) {
  console.warn("Face detection failed. Possibly due to lighting, angle, or distance.");
  Swal.fire(
    "Face Not Detected",
    "Make sure your face is well-lit, centered, and close to the camera. Try again.",
    "error"
  );
  setIsSaving(false);
  return;
}



    const eye1 = Math.abs(face1.landmarks.getLeftEye()[1].y - face1.landmarks.getLeftEye()[5].y);
    const eye2 = Math.abs(face2.landmarks.getLeftEye()[1].y - face2.landmarks.getLeftEye()[5].y);
    const blink = eye2 < eye1 * 0.5;

    const noseShift = Math.abs(face1.landmarks.getNose()[3].x - face2.landmarks.getNose()[3].x);
    const headMoved = noseShift > 5;

    if (!blink && !headMoved) {
      Swal.fire("Liveness Failed", "Please blink or move your head slightly.", "error");
      setIsSaving(false);
      return;
    }

    // ✅ Face match
    const descriptor = await getDescriptor();
    const faceMatcher = new faceapi.FaceMatcher([descriptor], 0.45);
    const bestMatch = faceMatcher.findBestMatch(face1.descriptor);

    if (bestMatch.label === "unknown") {
      Swal.fire("Face Not Recognized", "Face doesn't match your profile", "error");
      setIsSaving(false);
      return;
    }

    // 🗜️ Compress image
    const compressedImage = await compressImage(image1, 0.3);
    const location = await getLocation();

    // 📤 Send to server
    await axiosInstance.post(
      "/attendance/mark",
      { type, photo: compressedImage, location },
      { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
    );

    Swal.fire("Success", `Attendance marked: ${type}`, "success");
    setCapturing(false);
  } catch (err) {
    console.error("Error marking attendance:", err);
if (err.response?.data?.error?.includes("already marked")) {
  Swal.fire("Already Marked", err.response.data.error, "info");
} else if (err.response?.data?.error === "Cloudinary rejected the image") {
  Swal.fire("Upload Failed", "Face photo could not be uploaded. Try again.", "error");
} else {
  Swal.fire("Error", "Failed to mark attendance", "error");
}
  } finally {
    setIsSaving(false);
    console.timeEnd("🕒 Total Attendance Time");
  }
};



const saveFaceToServer = async () => {
  try {
const imageSrc = await captureImageWithTimestamp();
    if (!imageSrc) return Swal.fire("Error", "No image captured", "error");

    const base64Data = imageSrc.split(",")[1]; // Remove base64 prefix
    const normalizedName = user.name.toLowerCase().replace(/\s+/g, "_");

    // ✅ Create FormData (NOT JSON)
    const formData = new FormData();
    formData.append("file", `data:image/jpeg;base64,${base64Data}`);
    formData.append("upload_preset", "attendance_preset"); // must match Cloudinary's unsigned preset
    formData.append("public_id", `faces/${normalizedName}`); // e.g., faces/pradyumna_kumar

    // ✅ Upload using FormData
    const uploadRes = await axios.post(
      `https://api.cloudinary.com/v1_1/dcr8k5amk/image/upload`,
      formData
    );

    const cloudinaryUrl = uploadRes.data.secure_url;

    // ✅ Optional: Save to DB
    await axiosInstance.post(
      "/users/save-face-url",
      { url: cloudinaryUrl },
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );

    Swal.fire("Success", "Face registered successfully!", "success");
    setShowFaceRegistration(false);
 } catch (err) {
  console.error("Cloudinary upload failed:", err);

  if (err.response?.data?.error?.includes("already registered")) {
    Swal.fire("Already Registered", err.response.data.error, "info");
  } else if (err.response?.data?.error?.includes("already marked")) {
    Swal.fire("Already Marked", err.response.data.error, "info");
  } else {
    Swal.fire("Error", "Failed to upload face", "error");
  }
}

};
const handleCapture = (type) => {
  if (!modelsLoaded) {
    Swal.fire("Please wait", "Face recognition models are still loading.", "info");
    return;
  }

  const now = new Date();
  const formatted = now.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "medium",
  });

  setCaptureTimestamp(formatted);
  setType(type);

  // ⏳ Wait for webcam to be ready
  setTimeout(() => {
    setCapturing(true); // now show webcam + controls
  }, 500);
};

  if (!modelsLoaded) {
    return (
      <div className="text-center p-6">
        <p className="text-blue-600 font-semibold">⏳ Loading Face Recognition Models...</p>
      </div>
    );
  }

  return (
    <>
      {!capturing ? (
<div className="shadow-xl rounded-2xl p-6 sm:p-8 max-w-2xl mx-auto">
  <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-800 mb-6">
    📋 Mark Attendance
  </h2>

  <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
    <button
      onClick={() => handleCapture("check-in")}
      className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-full text-base font-semibold shadow-md transition duration-200 focus:outline-none focus:ring-2 focus:ring-green-400 w-full sm:w-auto justify-center"
    >
      ✅ Check In
    </button>

    <button
      onClick={() => handleCapture("check-out")}
      className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-full text-base font-semibold shadow-md transition duration-200 focus:outline-none focus:ring-2 focus:ring-red-400 w-full sm:w-auto justify-center"
    >
      ⏹️ Check Out
    </button>

    <button
      onClick={() => setShowFaceRegistration(true)}
      className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-full text-base font-semibold shadow-md transition duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 w-full sm:w-auto justify-center"
    >
      👤 Register My Face
    </button>
  </div>
</div>

     ) : (
        <div className="flex flex-col items-center gap-4">
         <ReactWebcam
  ref={webcamRef}
  audio={false}
  screenshotFormat="image/jpeg"
  width={320}
  height={240}
  videoConstraints={{
    width: { ideal: 320 },
    height: { ideal: 240 },
    facingMode: "user",
  }}
  className="rounded-lg shadow border"
/>

          {captureTimestamp && (
  <p className="text-sm text-gray-600 mt-2">
    🕒 Captured on: <span className="font-medium">{captureTimestamp}</span>
  </p>
)}

          <button
            onClick={saveAttendance}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg"
          >
            📸 Save {type} Attendance
          </button>
          <button
            onClick={() => setCapturing(false)}
            className="text-red-500 hover:text-red-700 text-sm"
          >
            Cancel
          </button>
        </div>
      )}

      {isSaving && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="loader border-t-4 border-blue-500 w-10 h-10 rounded-full animate-spin"></div>
        </div>
      )}
       {capturing && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
    <div className="relative bg-white w-full max-w-sm mx-4 p-6 rounded-2xl shadow-2xl flex flex-col items-center animate-fade-in">

      {/* Cancel Button (Top-right) */}
      <button
        className="absolute top-2 right-2 text-gray-500 hover:text-red-600 text-xl font-bold focus:outline-none"
        onClick={() => setCapturing(false)}
        aria-label="Close"
      >
        ×
      </button>

      <h3 className="text-xl font-bold mb-4 text-gray-800 capitalize">
        {type} - Capture Photo
      </h3>

      <ReactWebcam
        audio={false}
        ref={webcamRef}
        screenshotFormat="image/jpeg"
          width={320}
  height={240}
        className="rounded-lg shadow-md w-full h-auto max-w-full mb-4 border border-gray-300"
      />

      <button
        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 text-sm font-semibold rounded-lg shadow-md transition duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
        onClick={saveAttendance}
      >
        📸 Save Attendance
      </button>
    </div>
  </div>
)}


{isSaving && (
  <div className="fixed inset-0 bg-[#000000ad] bg-opacity-50 flex justify-center items-center z-50">
    <div className="loader border-t-4 border-blue-500 rounded-full w-12 h-12 animate-spin"></div>
  </div>
)}

{showFaceRegistration && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
    <div className="relative bg-white w-full max-w-sm mx-4 p-6 rounded-xl shadow-xl flex flex-col items-center">
      <button
        className="absolute top-2 right-2 text-gray-500 hover:text-red-600 text-xl font-bold"
        onClick={() => setShowFaceRegistration(false)}
      >
        ×
      </button>
      <h3 className="text-lg font-bold mb-4">📷 Register Your Face</h3>
      <ReactWebcam
        ref={webcamRef}
        audio={false}
        screenshotFormat="image/jpeg"
        className="rounded-lg shadow-md w-full max-w-full mb-4 border"
      />
      <button
        onClick={saveFaceToServer}
        className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded shadow"
      >
        💾 Save Face
      </button>
    </div>
  </div>
)}
{showLivenessPrompt && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
    <div className="bg-white rounded-xl p-6 shadow-2xl text-center animate-fade-in w-full max-w-sm mx-4">
      <h2 className="text-xl font-semibold text-gray-800 mb-2">🧠 Liveness Check</h2>
      <p className="text-gray-600 mb-4">
        Please <strong>blink</strong> or <strong>turn your head slightly</strong> to prove you're real.
      </p>
      <p className="text-4xl font-bold text-blue-600">{livenessCountdown}</p>
    </div>
  </div>
)}


    </>
  );
}
