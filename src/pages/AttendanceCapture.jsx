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
   const parseUserRoles = (user) => {
    // ✅ Add null check
    if (!user || !user.role) {
      return [];
    }
    
    let userRoles = [];
    if (Array.isArray(user.role)) {
      if (user.role.length > 0 && typeof user.role[0] === 'string' && user.role[0].startsWith('[')) {
        try {
          userRoles = JSON.parse(user.role[0]);
        } catch (parseError) {
          userRoles = user.role;
        }
      } else {
        userRoles = user.role;
      }
    } else if (typeof user.role === 'string') {
      try {
        userRoles = JSON.parse(user.role);
      } catch (parseError) {
        userRoles = [user.role];
      }
    } else {
      userRoles = [user.role];
    }
    return userRoles;
  };
  const { user, token } = useUserContext();
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
  const userRoles = user ? parseUserRoles(user) : [];

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

      // Add a tiny random pixel to ensure uniqueness (optional)
      ctx.fillStyle = `rgb(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255})`;
      ctx.fillRect(0, 0, 1, 1);

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
          lng: pos.coords.longitude
          // Remove accuracy check entirely
        };
        setCurrentLocation(location);
        setLocationStatus("success");
        resolve(location);
      },
      (err) => {
        console.warn("Geolocation error:", err);
        setLocationStatus("failed");
        // Reject instead of resolve so we can catch the error properly
        reject(err);
      },
      { 
        // Remove enableHighAccuracy to use default settings
        timeout: 10000,
        maximumAge: 60000 
      }
    );
  });
};

const getDescriptor = async () => {
  // Clear cache if user changes
  if (descriptorCache && descriptorCache.userId !== user?._id) {
    console.log("🔄 User changed, clearing descriptor cache");
    setDescriptorCache(null);
    return null;
  }
  
  if (descriptorCache) {
    console.log("✅ Using cached descriptor for user:", user?.name);
    return descriptorCache.descriptor;
  }
  
  try {
    console.log("🔍 Loading descriptor for user:", user?.name, "ID:", user?._id);
    const labeledDescriptor = await loadLabeledDescriptorForUser(user.name);
    
    if (labeledDescriptor) {
      console.log("✅ Descriptor loaded successfully, type:", labeledDescriptor.constructor.name);
      
      // Extract the actual descriptor array from LabeledFaceDescriptors
      // LabeledFaceDescriptors has a property 'descriptors' which is an array of descriptors
      // Usually it's the first (and only) descriptor
      let descriptorArray = null;
      
      if (labeledDescriptor.descriptors && labeledDescriptor.descriptors.length > 0) {
        // Get the first descriptor from the descriptors array
        descriptorArray = labeledDescriptor.descriptors[0];
        console.log("📊 Extracted descriptor from LabeledFaceDescriptors, length:", descriptorArray.length);
      } else if (labeledDescriptor.descriptor) {
        // Some versions might have a direct descriptor property
        descriptorArray = labeledDescriptor.descriptor;
        console.log("📊 Extracted descriptor from property, length:", descriptorArray.length);
      } else {
        console.error("❌ Could not extract descriptor from LabeledFaceDescriptors:", labeledDescriptor);
        return null;
      }
      
      // Ensure it's a Float32Array
      let finalDescriptor;
      if (descriptorArray instanceof Float32Array) {
        finalDescriptor = descriptorArray;
      } else if (Array.isArray(descriptorArray)) {
        console.log("🔄 Converting array to Float32Array");
        finalDescriptor = new Float32Array(descriptorArray);
      } else {
        console.error("❌ Unknown descriptor format:", typeof descriptorArray);
        return null;
      }
      
      console.log("✅ Final descriptor ready, type:", finalDescriptor.constructor.name, "length:", finalDescriptor.length);
      
      // Store with user ID to handle user switching
      setDescriptorCache({
        userId: user?._id,
        descriptor: finalDescriptor
      });
      return finalDescriptor;
    } else {
      console.error("❌ No descriptor found for user:", user?.name);
      return null;
    }
  } catch (err) {
    console.error("❌ Error loading descriptor:", err);
    return null;
  }
};

const saveAttendance = async () => {
  if (isSaving) return;

  if (!modelsLoaded) {
    Swal.fire({
      icon: "info",
      title: "Please Wait",
      text: "Face recognition models are still loading.",
      confirmButtonColor: "#B0BC27",
    });
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
    return;
  }

  // 🔴 Check and request location permission
  let location = null;
  try {
    location = await getLocation();
    
    if (!location.lat || !location.lng) {
      Swal.fire({
        icon: "warning",
        title: "Location Required",
        html: `
          <div class="text-center">
            <div class="text-6xl mb-4">📍</div>
            <p class="text-gray-600 mb-4">Location access is required for attendance.</p>
            <p class="text-sm text-gray-500 mb-4">Please enable location services and allow access in your browser settings.</p>
          </div>
        `,
        confirmButtonColor: "#B0BC27",
      });
      setIsSaving(false);
      return;
    }
    
  } catch (err) {
    console.warn("Location error:", err);
    Swal.fire({
      icon: "error",
      title: "Location Error",
      text: "Could not access your location. Please check your device settings and allow location access.",
      confirmButtonColor: "#B0BC27",
    });
    setIsSaving(false);
    return;
  }

  console.time("🕒 Total Attendance Time");
  setIsSaving(true);

  try {
    const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 96 });

    // 📸 Capture single image
    const image1 = await captureImageWithTimestamp();
    if (!image1 || image1.length < 1000) {
      Swal.fire({
        icon: "error",
        title: "Camera Error",
        text: "Camera capture failed. Please try again.",
        confirmButtonColor: "#B0BC27",
      });
      setIsSaving(false);
      return;
    }

    const img1 = await faceapi.fetchImage(image1);

    // Face detection
    const face1 = await faceapi
      .detectSingleFace(img1, options)
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!face1) {
      Swal.fire({
        icon: "error",
        title: "Face Not Detected",
        html: `
          <div class="text-center">
            <div class="text-6xl mb-4">🔍</div>
            <p class="text-gray-600 mb-2">Make sure your face is clearly visible and centered.</p>
          </div>
        `,
        confirmButtonColor: "#B0BC27",
      });
      setIsSaving(false);
      return;
    }

    console.log("✅ Face detected, descriptor length:", face1.descriptor.length);

    // ✅ Face match
    console.log("🔍 Getting descriptor for user:", user?.name, "ID:", user?._id);
    const descriptorData = await getDescriptor();
    
    let descriptor;
    if (!descriptorData) {
      console.error("❌ No descriptor found in cache/DB");
      
      try {
        console.log("🔄 Attempting to fetch descriptor directly from API...");
        const response = await axiosInstance.get("/users/preprocessed-descriptors");
        const descriptors = response.data;
        console.log(`📊 API returned ${descriptors.length} descriptors`);
        
        const userDescriptor = descriptors.find(d => d._id === user._id);
        if (userDescriptor && userDescriptor.descriptor) {
          console.log("✅ Found descriptor in API response");
          const descriptorArray = new Float32Array(userDescriptor.descriptor);
          setDescriptorCache({
            userId: user._id,
            descriptor: descriptorArray
          });
          descriptor = descriptorArray;
        } else {
          Swal.fire({
            icon: "error",
            title: "Face Data Missing",
            text: "Your face descriptor data is missing. Please contact admin.",
            confirmButtonColor: "#B0BC27",
          });
          setIsSaving(false);
          return;
        }
      } catch (fetchErr) {
        console.error("❌ Failed to fetch descriptors:", fetchErr);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Failed to load face recognition data.",
          confirmButtonColor: "#B0BC27",
        });
        setIsSaving(false);
        return;
      }
    } else {
      if (descriptorData instanceof Float32Array) {
        descriptor = descriptorData;
      } else if (Array.isArray(descriptorData)) {
        console.log("🔄 Converting regular array to Float32Array");
        descriptor = new Float32Array(descriptorData);
      } else {
        console.error("❌ Descriptor is in unknown format:", typeof descriptorData);
        Swal.fire({
          icon: "error",
          title: "Format Error",
          text: "Face descriptor is in wrong format. Please contact admin.",
          confirmButtonColor: "#B0BC27",
        });
        setIsSaving(false);
        return;
      }
    }

    const faceMatcher = new faceapi.FaceMatcher([descriptor], 0.7);
    const bestMatch = faceMatcher.findBestMatch(face1.descriptor);
    console.log("🔍 Match result:", {
      label: bestMatch.label,
      distance: bestMatch.distance,
    });
    
    if (bestMatch.label === "unknown") {
      console.log("🔄 Retrying with lower threshold (0.6)...");
      const faceMatcherLower = new faceapi.FaceMatcher([descriptor], 0.6);
      const retryMatch = faceMatcherLower.findBestMatch(face1.descriptor);
      
      if (retryMatch.label === "unknown") {
        Swal.fire({
          icon: "error",
          title: "Face Not Recognized",
          text: "Face doesn't match your registered profile.",
          confirmButtonColor: "#B0BC27",
        });
        setIsSaving(false);
        return;
      }
    }

    // 🗜️ Compress image MORE aggressively
    console.log("🖼️ Original image size:", Math.round(image1.length / 1024), "KB");
    
    // Compress with lower quality (0.2 instead of 0.3)
    let compressedImage = await compressImage(image1, 0.2);
    
    // If still too large (> 150KB), compress further
    let quality = 0.2;
    let imageSizeKB = compressedImage.length / 1024;
    
    while (imageSizeKB > 150 && quality > 0.1) {
      quality -= 0.05;
      console.log(`🔄 Re-compressing with quality ${quality}, current size: ${Math.round(imageSizeKB)}KB`);
      compressedImage = await compressImage(image1, quality);
      imageSizeKB = compressedImage.length / 1024;
    }
    
    console.log("✅ Final compressed size:", Math.round(imageSizeKB), "KB");

    const photoPayload = compressedImage.startsWith("data:")
      ? compressedImage
      : `data:image/jpeg;base64,${compressedImage}`;

    // Determine user type
    const workerDesignations = ["operator", "helper", "driver"];
    const isWorker = workerDesignations.includes(user?.designation?.toLowerCase());
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    const currentShift = (hour >= 8 && hour < 20) || (hour === 20 && minute < 30) ? "shift1" : "shift2";

    // Function to make API call with retry
    const makeApiCallWithRetry = async (apiCall, maxRetries = 2) => {
      let lastError;
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(`📡 API attempt ${attempt} of ${maxRetries}...`);
          
          // Set timeout for the request (30 seconds)
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error("Request timeout")), 30000);
          });
          
          const apiPromise = apiCall();
          const response = await Promise.race([apiPromise, timeoutPromise]);
          
          console.log(`✅ API call successful on attempt ${attempt}`);
          return response;
        } catch (err) {
          lastError = err;
          console.error(`❌ Attempt ${attempt} failed:`, err.message);
          
          if (attempt < maxRetries) {
            // Wait before retrying (exponential backoff)
            const waitTime = attempt * 2000;
            console.log(`⏳ Waiting ${waitTime}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
          }
        }
      }
      throw lastError;
    };

    // For staff, check check-in status before check-out
    if (!isWorker && type === "check-out") {
      try {
        const today = new Date().toISOString().split('T')[0];
        console.log("📅 Checking for check-in on:", today);
        
        const attendanceResponse = await axiosInstance.get("/attendance", {
          params: { date: today },
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000
        });
        
        let attendanceData = [];
        if (attendanceResponse.data.logs) {
          attendanceData = attendanceResponse.data.logs;
        } else if (Array.isArray(attendanceResponse.data)) {
          attendanceData = attendanceResponse.data;
        }
        
        const hasCheckIn = attendanceData.some(record => {
          const recordUserId = record.user?._id || record.user;
          if (recordUserId !== user._id) return false;
          
          const isCheckIn = record.type === "check-in" || 
                            (record.checkIn && record.checkIn.time) ||
                            (record.checkInTime);
          
          const recordDate = new Date(record.time || record.checkIn?.time || record.date || record.checkInTime).toISOString().split('T')[0];
          
          return recordDate === today && isCheckIn;
        });
        
        if (!hasCheckIn) {
          Swal.fire({
            icon: "error",
            title: "Cannot Check Out",
            text: "You haven't checked in today. Please check in first.",
            confirmButtonColor: "#B0BC27",
          });
          setIsSaving(false);
          return;
        }
      } catch (checkErr) {
        console.error("❌ Error checking attendance:", checkErr);
        Swal.fire({
          icon: "error",
          title: "Verification Failed",
          text: "Could not verify your check-in status. Please try again.",
          confirmButtonColor: "#B0BC27",
        });
        setIsSaving(false);
        return;
      }
    }

    // Make the API call with retry logic
    let response;
    try {
      if (isWorker) {
        console.log("👷 Worker detected, using factory attendance system");
        response = await makeApiCallWithRetry(() =>
          axiosInstance.post(
            "/factory-attendance/mark",
            { 
              type, 
              photo: photoPayload, 
              location,
              userId: user._id,
              shift: currentShift,
              source: 'portal'
            },
            { 
              headers: { Authorization: `Bearer ${token}` },
              timeout: 30000
            }
          )
        );
      } else {
        console.log("👔 Staff detected, using regular attendance system");
        response = await makeApiCallWithRetry(() =>
          axiosInstance.post(
            "/attendance/mark",
            { type, photo: photoPayload, location },
            { 
              headers: { Authorization: `Bearer ${token}` },
              timeout: 30000
            }
          )
        );
      }

      // Show success message
      Swal.fire({
        icon: "success",
        title: `Attendance ${type === "check-in" ? "Checked In" : "Checked Out"}!`,
        html: `
          <div class="text-center">
            <div class="text-6xl mb-4">✅</div>
            <p class="text-gray-600 mb-2">${type === "check-in" ? "Welcome to work!" : "Have a great day!"}</p>
            <p class="text-sm text-gray-500 mb-4">Time: ${new Date().toLocaleTimeString()}</p>
            <a href="${userRoles.includes("driver") ? "/factory-attendance-logs" : "/attendance-logs"}" 
               class="inline-block px-4 py-2 bg-[#B0BC27] text-white rounded-lg hover:bg-[#9ca824] transition-colors duration-300 text-sm font-medium">
              View Attendance Logs
            </a>
          </div>
        `,
        confirmButtonColor: "#B0BC27",
        showConfirmButton: false,
        timer: 3000
      });

      setCapturing(false);
      console.log("✅ Attendance saved successfully");

    } catch (err) {
      setCapturing(false);
      
      if (err.message === "Request timeout") {
        Swal.fire({
          icon: "error",
          title: "Network Timeout",
          text: "Request took too long. Please check your internet connection and try again.",
          confirmButtonColor: "#B0BC27",
        });
      } else if (err.response?.data?.error?.includes("already marked")) {
        Swal.fire({
          icon: "info",
          title: "Already Marked",
          text: `You already marked ${type} for today.`,
          confirmButtonColor: "#B0BC27",
        });
      } else if (err.response?.data?.error?.includes("location")) {
        Swal.fire({
          icon: "error",
          title: "Location Error",
          text: "Location is required for attendance. Please enable location services.",
          confirmButtonColor: "#B0BC27",
        });
      } else {
        // Store failed attempt in localStorage for later retry
        const failedUploads = JSON.parse(localStorage.getItem('failedAttendanceUploads') || '[]');
        failedUploads.push({
          data: { type, photo: photoPayload, location },
          timestamp: new Date().toISOString(),
          userId: user._id,
          isWorker: isWorker
        });
        // Keep only last 10 failed attempts
        if (failedUploads.length > 10) failedUploads.shift();
        localStorage.setItem('failedAttendanceUploads', JSON.stringify(failedUploads));
        
        Swal.fire({
          icon: "error",
          title: "Save Failed",
          text: err.response?.data?.error || err.message || "Failed to save attendance. It will be retried automatically.",
          confirmButtonColor: "#B0BC27",
        });
      }
    }

  } catch (err) {
    console.error("Error marking attendance:", err);
    Swal.fire({
      icon: "error",
      title: "Attendance Failed",
      text: "An unexpected error occurred. Please try again.",
      confirmButtonColor: "#B0BC27",
    });
  } finally {
    setIsSaving(false);
    console.timeEnd("🕒 Total Attendance Time");
  }
};

  const retryFailedUploads = async () => {
    const failedUploads = JSON.parse(localStorage.getItem('failedAttendanceUploads') || '[]');
    
    if (failedUploads.length === 0) return;
    
    const successfulRetries = [];
    
    for (const upload of failedUploads) {
      try {
        await axiosInstance.post(
          "/attendance/mark",
          upload.data,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        successfulRetries.push(upload);
        console.log("✅ Retried and saved:", upload.data.type);
      } catch (err) {
        console.error("❌ Retry failed:", err.message);
      }
    }
    
    // Remove successful retries
    const remainingUploads = failedUploads.filter(
      upload => !successfulRetries.includes(upload)
    );
    
    localStorage.setItem('failedAttendanceUploads', JSON.stringify(remainingUploads));
  };

// Call this on component mount or when connection is restored
useEffect(() => {
  if (navigator.onLine) {
    retryFailedUploads();
  }
}, [token]);

  const handleCapture = (captureType) => {
    if (!modelsLoaded) {
      Swal.fire({
        icon: "info",
        title: "Please Wait",
        text: "Face recognition models are still loading.",
        confirmButtonColor: "#B0BC27",
      });
      return;
    }

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
      return;
    }

    setIsSaving(true);
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
      setIsSaving(false);
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

     {/* Face Capture Overlay */}
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
          📸
        </motion.div>
        
        <h2 className="text-2xl sm:text-3xl font-bold mb-4">
          Capturing Face
        </h2>
        
        <p className="text-lg text-blue-100 mb-6 leading-relaxed">
          Please look directly at the camera
        </p>

        <motion.div
          key={livenessCountdown}
          initial={{ scale: 1.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-8xl font-bold text-yellow-300 mb-4"
        >
          {livenessCountdown}
        </motion.div>
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>
    </>
  );
}

