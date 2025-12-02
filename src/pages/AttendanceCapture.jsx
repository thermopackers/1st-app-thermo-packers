import React, { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";
import ReactWebcam from "react-webcam";
import Swal from "sweetalert2";
import axiosInstance from "../axiosInstance";
import axios from "axios";
import { loadLabeledDescriptorForUser } from "../utils/labeledDescriptors";
import { useUserContext } from "../context/UserContext";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, UserCheck, MapPin, Clock, Loader, X, CheckCircle, AlertCircle } from "lucide-react";

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
  const [locationStatus, setLocationStatus] = useState("pending");
  const [currentLocation, setCurrentLocation] = useState(null);

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
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);

        const timestamp = new Date().toLocaleString("en-IN", {
          dateStyle: "medium",
          timeStyle: "medium",
        });

        // Add timestamp overlay
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
        ctx.fillRect(10, canvas.height - 40, 280, 30);
        
        ctx.fillStyle = "white";
        ctx.font = "14px monospace";
        ctx.fillText(timestamp, 20, canvas.height - 20);

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

  // ✅ Load face-api models
  useEffect(() => {
    const loadModels = async () => {
      try {
        Swal.fire({
          title: "⏳ Loading Face Recognition...",
          text: "Please wait while AI models are being loaded.",
          allowOutsideClick: false,
          allowEscapeKey: false,
          didOpen: () => {
            Swal.showLoading();
          },
        });

        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
          faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
          faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
        ]);

        console.log("✅ Face-api models loaded");
        setModelsLoaded(true);
        Swal.close();
      } catch (err) {
        console.error("❌ Model load error:", err);
        Swal.fire({
          icon: "error",
          title: "Model Load Failed",
          text: "Failed to load face recognition models. Please refresh the page.",
          confirmButtonColor: "#B0BC27",
        });
      }
    };

    loadModels();
  }, []);

  useEffect(() => {
    if (user?.name && modelsLoaded) {
      getDescriptor();
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
      setLocationStatus("fetching");
      
      if (!navigator.geolocation) {
        setLocationStatus("unsupported");
        return resolve({ lat: null, lng: null });
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const location = { 
            lat: pos.coords.latitude, 
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy
          };
          setCurrentLocation(location);
          setLocationStatus("success");
          resolve(location);
        },
        (err) => {
          console.warn("Geolocation error:", err);
          setLocationStatus("failed");
          resolve({ lat: null, lng: null });
        },
        { 
          enableHighAccuracy: true, 
          timeout: 10000,
          maximumAge: 60000 
        }
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
  if (isSaving) return;
  setIsSaving(true);

  if (!modelsLoaded) {
    Swal.fire({
      icon: "info",
      title: "Please Wait",
      text: "Face recognition models are still loading.",
      confirmButtonColor: "#B0BC27",
    });
    setIsSaving(false);
    return;
  }

  // 🚫 Block if face is not registered
  if (!user?.faceUrl) {
    Swal.fire({
      icon: "error",
      title: "Face Not Registered",
      html: `
        <div class="text-center">
          <div class="text-6xl mb-4">👤</div>
          <p class="text-gray-600 mb-4">Your face is not registered for attendance.</p>
          <p class="text-sm text-gray-500">Please contact Accounts/Admin department.</p>
        </div>
      `,
      confirmButtonColor: "#B0BC27",
    });
    setIsSaving(false);
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

    try {
      const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 96 });

      // 📸 First frame
      const image1 = await captureImageWithTimestamp();
      if (!image1 || image1.length < 1000) {
        Swal.fire({
          icon: "error",
          title: "Camera Error",
          text: "Camera capture failed. Please try again.",
          confirmButtonColor: "#B0BC27",
        });
        setIsSaving(false);
                setCapturing(false); // Also add this
        return;
      }

      const img1 = await faceapi.fetchImage(image1);

      // Small wait for natural movement
      await new Promise((res) => setTimeout(res, 500));

      // 📸 Second frame
      const image2 = await captureImageWithTimestamp();
      if (!image2 || image2.length < 1000) {
        Swal.fire({
          icon: "error",
          title: "Camera Error",
          text: "Second camera frame failed.",
          confirmButtonColor: "#B0BC27",
        });
        setIsSaving(false);
                setCapturing(false); // Add this line
        return;
      }

      const img2 = await faceapi.fetchImage(image2);

      // Face detection
      const [face1, face2] = await Promise.all([
        faceapi.detectSingleFace(img1, options).withFaceLandmarks().withFaceDescriptor(),
        faceapi.detectSingleFace(img2, options).withFaceLandmarks().withFaceDescriptor(),
      ]);

      if (!face1 || !face2) {
        Swal.fire({
          icon: "error",
          title: "Face Not Detected",
          html: `
            <div class="text-center">
              <div class="text-6xl mb-4">🔍</div>
              <p class="text-gray-600 mb-2">Make sure your face is:</p>
              <ul class="text-sm text-gray-500 text-left max-w-xs mx-auto">
                <li>• Well-lit and clearly visible</li>
                <li>• Centered in the frame</li>
                <li>• Close to the camera</li>
                <li>• Not wearing sunglasses</li>
              </ul>
            </div>
          `,
          confirmButtonColor: "#B0BC27",
        });
        setIsSaving(false);
                setCapturing(false); // Also add this
        return;
      }

      // Liveness detection
      const eye1 = Math.abs(face1.landmarks.getLeftEye()[1].y - face1.landmarks.getLeftEye()[5].y);
      const eye2 = Math.abs(face2.landmarks.getLeftEye()[1].y - face2.landmarks.getLeftEye()[5].y);
      const blink = eye2 < eye1 * 0.5;

      const noseShift = Math.abs(face1.landmarks.getNose()[3].x - face2.landmarks.getNose()[3].x);
      const headMoved = noseShift > 5;

      if (!blink && !headMoved) {
        Swal.fire({
          icon: "error",
          title: "Liveness Check Failed",
          html: `
            <div class="text-center">
              <div class="text-6xl mb-4">👀</div>
              <p class="text-gray-600">Please blink or move your head slightly during capture.</p>
            </div>
          `,
          confirmButtonColor: "#B0BC27",
        });
        setIsSaving(false);
                setCapturing(false); // Also add this
        return;
      }

      // ✅ Face match
      const descriptor = await getDescriptor();
      const faceMatcher = new faceapi.FaceMatcher([descriptor], 0.45);
      const bestMatch = faceMatcher.findBestMatch(face1.descriptor);

      if (bestMatch.label === "unknown") {
        Swal.fire({
          icon: "error",
          title: "Face Not Recognized",
          text: "Face doesn't match your registered profile.",
          confirmButtonColor: "#B0BC27",
        });
        setIsSaving(false);
                setCapturing(false); // Also add this
        return;
      }

         // 🗜️ Compress image
      const compressedImage = await compressImage(image1, 0.3);
      const location = await getLocation();

           // 📤 Upload attendance FIRST, then show success
      const photoPayload = compressedImage.startsWith("data:")
        ? compressedImage
        : `data:image/jpeg;base64,${compressedImage}`;

      const response = await axiosInstance.post(
        "/attendance/mark",
        { type, photo: photoPayload, location },
        { 
          headers: { 
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json"
          } 
        }
      );

      // Only show success if API returns success
      if (response.data.success) {
        Swal.fire({
          icon: "success",
          title: `Attendance ${type === "check-in" ? "Checked In" : "Checked Out"}!`,
          html: `
            <div class="text-center">
              <div class="text-6xl mb-4">✅</div>
              <p class="text-gray-600 mb-2">${type === "check-in" ? "Welcome to work!" : "Have a great day!"}</p>
              <p class="text-sm text-gray-500">Time: ${new Date().toLocaleTimeString()}</p>
            </div>
          `,
          confirmButtonColor: "#B0BC27",
        });
        
        setCapturing(false);
        
        // Refresh the logs to show updated attendance
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        throw new Error(response.data.error || "Attendance not saved");
      }

        } catch (err) {
      console.error("Error marking attendance:", err);
      
      // Show specific error messages
      let errorMessage = "Failed to save attendance. Please try again.";
      
      if (err.response?.data?.error) {
        if (err.response.data.error.includes("already marked")) {
          errorMessage = `You already marked ${type} today.`;
        } else if (err.response.data.error.includes("Face not registered")) {
          errorMessage = "Face not registered. Please contact Accounts department.";
        } else {
          errorMessage = err.response.data.error;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      Swal.fire({
        icon: "error",
        title: "Attendance Failed",
        text: errorMessage,
        confirmButtonColor: "#B0BC27",
      });
      
      setCapturing(false);
    } finally {
      setIsSaving(false);
      console.timeEnd("🕒 Total Attendance Time");
    }
  };

const handleCapture = (captureType) => {
  if (!modelsLoaded || isSaving) {
    Swal.fire({
      icon: "info",
      title: "Please Wait",
      text: "Face recognition models are still loading.",
      confirmButtonColor: "#B0BC27",
    });
    return;
  }
  
  setIsSaving(true);

  if (!user?.faceUrl) {
    Swal.fire({
      icon: "error",
      title: "Face Not Registered",
      html: `
        <div class="text-center">
          <div class="text-6xl mb-4">👤</div>
          <p class="text-gray-600 mb-4">Your face is not registered for attendance.</p>
          <p class="text-sm text-gray-500">Please contact Accounts/Admin department.</p>
        </div>
      `,
      confirmButtonColor: "#B0BC27",
    });
    setIsSaving(false); // Reset saving state
    return;
  }

  const now = new Date();
  const formatted = now.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "medium",
  });

  setCaptureTimestamp(formatted);
  setType(captureType);

  Swal.fire({
    title: "📷 Initializing Camera...",
    text: "Please hold still and look at the camera.",
    allowOutsideClick: false,
    allowEscapeKey: false,
    didOpen: () => Swal.showLoading(),
  });

  setTimeout(() => {
    setCapturing(true);
    Swal.close();
  }, 800);
};

  function AutoCaptureTrigger({ saveAttendance }) {
    useEffect(() => {
      const timer = setTimeout(() => {
        saveAttendance();
      }, 1200);
      return () => clearTimeout(timer);
    }, [saveAttendance]);

    return (
      <motion.p 
        className="text-white text-center text-lg font-medium mt-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        📸 Capturing automatically...
      </motion.p>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };

  return (
    <>
      {/* Main Attendance Interface */}
      {!capturing ? (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 max-w-2xl mx-auto border border-gray-200"
        >
          {/* Header */}
          <motion.div 
            className="text-center mb-8"
            variants={itemVariants}
          >
            <div className="w-20 h-20 bg-gradient-to-br from-[#B0BC27] to-[#9ca824] rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <UserCheck className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
              Mark Your Attendance
            </h2>
            <p className="text-gray-600 text-lg">
              Secure face recognition attendance system
            </p>
          </motion.div>

          {/* Status Indicators */}
          <motion.div 
            className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8"
            variants={itemVariants}
          >
            <div className={`flex items-center gap-3 p-3 rounded-xl border-2 ${
              modelsLoaded 
                ? "border-green-200 bg-green-50" 
                : "border-amber-200 bg-amber-50"
            }`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                modelsLoaded ? "bg-green-500" : "bg-amber-500"
              }`}>
                {modelsLoaded ? (
                  <CheckCircle className="w-5 h-5 text-white" />
                ) : (
                  <Loader className="w-5 h-5 text-white animate-spin" />
                )}
              </div>
              <div>
                <p className="font-medium text-sm">AI Models</p>
                <p className="text-xs text-gray-600">
                  {modelsLoaded ? "Ready" : "Loading..."}
                </p>
              </div>
            </div>

            <div className={`flex items-center gap-3 p-3 rounded-xl border-2 ${
              user?.faceUrl 
                ? "border-green-200 bg-green-50" 
                : "border-red-200 bg-red-50"
            }`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                user?.faceUrl ? "bg-green-500" : "bg-red-500"
              }`}>
                {user?.faceUrl ? (
                  <CheckCircle className="w-5 h-5 text-white" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-white" />
                )}
              </div>
              <div>
                <p className="font-medium text-sm">Face Registered</p>
                <p className="text-xs text-gray-600">
                  {user?.faceUrl ? "Verified" : "Not Registered"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl border-2 border-blue-200 bg-blue-50">
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-medium text-sm">Location</p>
                <p className="text-xs text-gray-600">
                  {locationStatus === "success" ? "Captured" : "Required"}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div 
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
            variants={itemVariants}
          >
            <motion.button
              onClick={() => handleCapture("check-in")}
              disabled={!modelsLoaded || !user?.faceUrl}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`flex items-center justify-center gap-3 p-4 rounded-2xl font-semibold text-lg transition-all duration-300 ${
                modelsLoaded && user?.faceUrl
                  ? "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg hover:shadow-xl"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              <CheckCircle className="w-6 h-6" />
              Check In
            </motion.button>

            <motion.button
              onClick={() => handleCapture("check-out")}
              disabled={!modelsLoaded || !user?.faceUrl}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`flex items-center justify-center gap-3 p-4 rounded-2xl font-semibold text-lg transition-all duration-300 ${
                modelsLoaded && user?.faceUrl
                  ? "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg hover:shadow-xl"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              <X className="w-6 h-6" />
              Check Out
            </motion.button>
          </motion.div>

          {/* Instructions */}
          <motion.div 
            className="mt-8 p-4 bg-blue-50 rounded-xl border border-blue-200"
            variants={itemVariants}
          >
            <h3 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Important Instructions
            </h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Ensure good lighting and clear face visibility</li>
              <li>• Remove sunglasses or face coverings</li>
              <li>• Stay still during face capture</li>
              <li>• Allow location access when prompted</li>
            </ul>
          </motion.div>
        </motion.div>
      ) : (
        /* Camera Capture Interface */
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 backdrop-blur-sm flex flex-col items-center justify-center z-50 p-4"
          >
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-6"
            >
              <h3 className="text-2xl font-bold text-white mb-2 capitalize">
                {type} - Face Verification
              </h3>
              <p className="text-gray-300">
                Please look directly at the camera and stay still
              </p>
            </motion.div>

            {/* Camera Container */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="relative w-full max-w-2xl h-96 sm:h-[480px] rounded-2xl overflow-hidden shadow-2xl border-4 border-white/20"
            >
              <ReactWebcam
                ref={webcamRef}
                audio={false}
                screenshotFormat="image/jpeg"
                className="absolute inset-0 w-full h-full object-cover"
                videoConstraints={{
                  facingMode: "user",
                  width: { ideal: 1280 },
                  height: { ideal: 720 }
                }}
              />
              
              {/* Camera Overlay */}
              <div className="absolute inset-0 border-8 border-white/10 rounded-2xl pointer-events-none"></div>
            </motion.div>

            {/* Auto Capture Trigger */}
            {capturing && <AutoCaptureTrigger saveAttendance={saveAttendance} />}

            {/* Close Button */}
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              onClick={() => setCapturing(false)}
              className="mt-6 text-white hover:text-red-400 transition-colors duration-300 flex items-center gap-2"
            >
              <X className="w-5 h-5" />
              Cancel Capture
            </motion.button>
          </motion.div>
        </AnimatePresence>
      )}

      {/* Loading Overlay */}
      <AnimatePresence>
        {isSaving && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white/10 backdrop-blur-md rounded-2xl p-8 text-center max-w-sm mx-4"
            >
              <Loader className="w-12 h-12 text-white animate-spin mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                Processing Attendance
              </h3>
              <p className="text-gray-300 text-sm">
                Verifying face and location data...
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Liveness Check Overlay */}
      <AnimatePresence>
        {showLivenessPrompt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-sm flex justify-center items-center z-50"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-gradient-to-br from-blue-600 to-purple-700 rounded-3xl p-8 sm:p-10 text-center text-white max-w-md mx-4 shadow-2xl"
            >
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="text-6xl mb-6"
              >
                👀
              </motion.div>
              
              <h2 className="text-2xl sm:text-3xl font-bold mb-4">
                Liveness Check
              </h2>
              
              <p className="text-lg text-blue-100 mb-6 leading-relaxed">
                Please <span className="font-semibold text-white">blink naturally</span> or{" "}
                <span className="font-semibold text-white">turn your head</span> slightly
              </p>

              <motion.div
                key={livenessCountdown}
                initial={{ scale: 1.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-8xl font-bold text-yellow-300 mb-4"
              >
                {livenessCountdown}
              </motion.div>

              <p className="text-sm text-blue-200">
                Verifying authenticity and preventing spoofing...
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

