// components/FaceRegistrationModal.jsx
import React, { useRef, useState } from "react";
import ReactWebcam from "react-webcam";
import Swal from "sweetalert2";
import axios from "axios";
import axiosInstance from "../axiosInstance";

const FaceRegistrationModal = ({ visible, onClose, user }) => {
  const webcamRef = useRef(null);
console.log("user in modal", user);

  const captureImage = () => {
    return webcamRef.current?.getScreenshot();
  };

  const saveFace = async () => {
    const image = captureImage();
    if (!image) return Swal.fire("Error", "No image captured", "error");

    const base64 = image.split(",")[1];
    const normalizedName = user.name.toLowerCase().replace(/\s+/g, "_");

    const formData = new FormData();
    formData.append("file", `data:image/jpeg;base64,${base64}`);
    formData.append("upload_preset", "attendance_preset");
    formData.append("public_id", `faces/${normalizedName}`);

    try {
      const res = await axios.post(`https://api.cloudinary.com/v1_1/dcr8k5amk/image/upload`, formData);
      const faceUrl = res.data.secure_url;

      await axiosInstance.post(
        "/users/save-face-url",
        { url: faceUrl, userId: user._id },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );

      Swal.fire("Success", "Face registered successfully!", "success");
      onClose();
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to upload face", "error");
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-xl shadow-xl text-center max-w-md w-full relative">
        <button onClick={onClose} className="absolute top-2 right-3 text-xl">×</button>
        <h3 className="text-xl font-semibold mb-4">Register Face for {user.name}</h3>
        <ReactWebcam
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          width={320}
          height={240}
          className="rounded-md border"
        />
        <button
          onClick={saveFace}
          className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
        >
          Save Face
        </button>
      </div>
    </div>
  );
};

export default FaceRegistrationModal;
