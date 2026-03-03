// components/FaceRegistrationModal.jsx
import React, { useRef, useState } from "react";
import ReactWebcam from "react-webcam";
import Swal from "sweetalert2";
import axios from "axios";
import axiosInstance from "../axiosInstance";

const FaceRegistrationModal = ({ visible, onClose, user }) => {
  const webcamRef = useRef(null);
  const [facingMode, setFacingMode] = useState("user"); // "user" for front, "environment" for rear
  const [isUploading, setIsUploading] = useState(false); // ✅ Add this line

  const captureImage = () => {
    return webcamRef.current?.getScreenshot();
  };

  const switchCamera = () => {
    setFacingMode(prevMode => prevMode === "user" ? "environment" : "user");
  };

const saveFace = async () => {
  const image = captureImage();
  if (!image) return Swal.fire("Error", "No image captured", "error");

  setIsUploading(true);

  try {
    // Upload to Cloudinary
    const base64 = image.split(",")[1];
    const normalizedName = user.name.toLowerCase().replace(/\s+/g, "_");
    const timestamp = Date.now();
    const publicId = `faces/${normalizedName}_${timestamp}`;

    const formData = new FormData();
    formData.append("file", `data:image/jpeg;base64,${base64}`);
    formData.append("upload_preset", "attendance_preset");
    formData.append("public_id", publicId);

    const uploadRes = await axios.post(
      `https://api.cloudinary.com/v1_1/dcr8k5amk/image/upload`, 
      formData
    );
    const faceUrl = uploadRes.data.secure_url;

    // Get auth token
    const token = localStorage.getItem("token");
    if (!token) {
      Swal.fire("Error", "No authentication token found", "error");
      return;
    }

    // If user already has a face, delete it first
    if (user.faceUrl) {
      try {
        await axiosInstance.post(
          "/users/delete-face-url",
          { userId: user._id },  // Make sure this matches backend expectation
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        console.log("Old face deleted successfully");
      } catch (deleteErr) {
        console.log("Delete error:", deleteErr.response?.data);
        // If error is "No face registered", continue anyway
        if (deleteErr.response?.data?.error !== 'No face registered for this user.') {
          // For other errors, show warning but continue
          console.warn("Could not delete old face:", deleteErr.response?.data);
        }
      }
    }

    // Save new face URL
    const saveResponse = await axiosInstance.post(
      "/users/save-face-url",
      { 
        url: faceUrl, 
        userId: user._id 
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    console.log("Save response:", saveResponse.data);
    
    Swal.fire({
      icon: "success",
      title: "Success!",
      text: "Face registered successfully!",
      timer: 2000,
      showConfirmButton: false
    });
    
    onClose();
    
    // Small delay before reload to ensure database updates
    setTimeout(() => {
      window.location.reload();
    }, 500);
    
  } catch (err) {
    console.error("Full error:", err);
    console.error("Error response:", err.response?.data);
    
    let errorMessage = "Failed to upload face";
    
    if (err.response?.data?.error) {
      errorMessage = err.response.data.error;
    } else if (err.message) {
      errorMessage = err.message;
    }
    
    Swal.fire({
      icon: "error",
      title: "Error",
      text: errorMessage
    });
  } finally {
    setIsUploading(false);
  }
};

  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-xl shadow-xl text-center max-w-md w-full relative">
        <button onClick={onClose} className="absolute top-2 right-3 text-xl">×</button>
        <h3 className="text-xl font-semibold mb-4">Register Face for {user.name}</h3>
        
        {/* Camera switch button */}
        <div className="mb-4">
          <button
            onClick={switchCamera}
            disabled={isUploading} // ✅ Disable while uploading
            className={`px-3 py-1 rounded text-sm ${
              isUploading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-gray-600 hover:bg-gray-700 text-white'
            }`}
          >
            {facingMode === "user" ? "Switch to Rear Camera" : "Switch to Front Camera"}
          </button>
        </div>

        <ReactWebcam
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          width={320}
          height={240}
          className="rounded-md border"
          videoConstraints={{
            facingMode: facingMode,
            width: 320,
            height: 240
          }}
        />
        
        {/* ✅ Updated Save Face button with loader */}
        <button
          onClick={saveFace}
          disabled={isUploading}
          className={`mt-4 px-4 py-2 rounded w-full flex items-center justify-center ${
            isUploading 
              ? 'bg-indigo-400 cursor-not-allowed' 
              : 'bg-indigo-600 hover:bg-indigo-700 text-white'
          }`}
        >
          {isUploading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Uploading...
            </>
          ) : (
            'Save Face'
          )}
        </button>

        {/* ✅ Optional: Full overlay loader (uncomment if you want full screen loader) */}
        {isUploading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
            <div className="bg-white p-6 rounded-lg shadow-xl flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
              <p className="text-gray-700">Uploading face image...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FaceRegistrationModal;