import React, { useEffect, useRef, useState } from "react";
import ReactWebcam from "react-webcam";
import Swal from "sweetalert2";
import * as faceapi from "face-api.js";
import axiosInstance from "../axiosInstance";
import { useUserContext } from "../context/UserContext";
import { motion } from "framer-motion";
import { Camera, Users, Clock, Loader, AlertCircle, Zap } from "lucide-react";
import InternalNavbar from "../components/InternalNavbar";

// Sound utility
const playSuccessSound = () => {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    gainNode.gain.value = 0.5;
    
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.3);
  } catch (err) {
    console.log("Audio not supported");
  }
};

export default function GuardAttendance() {
  const { user } = useUserContext();
  const webcamRef = useRef(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentShift, setCurrentShift] = useState("shift1");
  const [isProcessing, setIsProcessing] = useState(false);
  const [todayStats, setTodayStats] = useState({ shift1: 0, shift2: 0 });
  const [isReady, setIsReady] = useState(false);
  const [faceMatcher, setFaceMatcher] = useState(null);
const [voicesLoaded, setVoicesLoaded] = useState(false);
// Add this state
const [cachedVoice, setCachedVoice] = useState(null);

// Add this useEffect to cache the voice
useEffect(() => {
  if ('speechSynthesis' in window) {
    // Wait for voices to load
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      // Cache the default voice or a specific one
      if (voices.length > 0) {
        setCachedVoice(voices[0]); // Cache the first/default voice
        console.log("Voice cached:", voices[0].name);
      }
    };
    
    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }
}, []);
// Load available voices
useEffect(() => {
  const loadVoices = () => {
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      console.log("✅ Voices loaded:", voices.length);
      setVoicesLoaded(true);
    }
  };

  loadVoices();
  
  // For Chrome, voices are loaded asynchronously
  if (window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }

  return () => {
    window.speechSynthesis.onvoiceschanged = null;
  };
}, []);
  // Parse user roles
  const parseUserRoles = (user) => {
    if (!user || !user.role) return [];
    if (Array.isArray(user.role)) return user.role;
    if (typeof user.role === 'string') {
      try {
        return JSON.parse(user.role);
      } catch {
        return [user.role];
      }
    }
    return [];
  };

  const userRoles = user ? parseUserRoles(user) : [];

  // Determine shift based on current time
  useEffect(() => {
    const updateShift = () => {
      const now = new Date();
      const hour = now.getHours();
      const minute = now.getMinutes();
      
      if (hour >= 8 && hour < 20) {
        setCurrentShift("shift1");
      } else if (hour === 20 && minute < 30) {
        setCurrentShift("shift1");
      } else {
        setCurrentShift("shift2");
      }
    };
    
    updateShift();
    const interval = setInterval(updateShift, 60000);
    return () => clearInterval(interval);
  }, []);

  // Load face-api models and employee data
  useEffect(() => {
    const initialize = async () => {
      try {
        setLoading(true);
        
        Swal.fire({
          title: "⏳ Loading System...",
          text: "Loading face recognition models...",
          allowOutsideClick: false,
          didOpen: () => Swal.showLoading(),
        });

        // Load models
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
          faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
          faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
        ]);

        console.log("✅ Models loaded");
        
        Swal.update({
          text: "Loading employee data..."
        });

        await loadEmployeesAndCreateMatcher();
        
        Swal.close();
        setModelsLoaded(true);
        setLoading(false);
        
        await fetchTodayStats();

      } catch (err) {
        console.error("❌ Initialization error:", err);
        Swal.fire({
          icon: "error",
          title: "Loading Failed",
          text: "Failed to load face recognition system",
        });
        setLoading(false);
      }
    };

    initialize();
  }, []);

// Load employees and create face matcher - ULTRA FAST VERSION
const loadEmployeesAndCreateMatcher = async () => {
  try {
    setLoading(true);
    
    // Get pre-processed descriptors
    const res = await axiosInstance.get("/users/preprocessed-descriptors");
    const employeesWithDescriptors = res.data;
    
    console.log(`Found ${employeesWithDescriptors.length} pre-processed faces`);
    
    if (employeesWithDescriptors.length === 0) {
      // Fallback to regular loading if no pre-processed faces
      console.log("No pre-processed faces found, loading regular employees...");
      const fallbackRes = await axiosInstance.get("/users/factory-eligible");
      setEmployees(fallbackRes.data);
      
      if (fallbackRes.data.length > 0) {
        Swal.fire({
          icon: "info",
          title: "Processing Required",
          text: "Please run face preprocessing from admin panel first for faster recognition.",
          timer: 3000
        });
      }
      
      setIsReady(false);
      setLoading(false);
      return;
    }

    // Create labeled descriptors array
    const labeledDescriptors = employeesWithDescriptors.map(emp => 
      new faceapi.LabeledFaceDescriptors(
        emp._id,
        [new Float32Array(emp.descriptor)]
      )
    );

    // Create face matcher
    const matcher = new faceapi.FaceMatcher(labeledDescriptors, 0.5);
    setFaceMatcher(matcher);
    
    // Store employees for reference
    setEmployees(employeesWithDescriptors.map(emp => ({
      _id: emp._id,
      name: emp.name,
      designation: emp.designation
    })));
    
    setIsReady(true);
    console.log(`✅ Face matcher created with ${labeledDescriptors.length} pre-processed employees`);
    
    // Show success message
    Swal.fire({
      icon: "success",
      title: "Ready!",
      text: `${labeledDescriptors.length} employees loaded instantly`,
      timer: 1500,
      showConfirmButton: false
    });

  } catch (err) {
    console.error("Error loading descriptors:", err);
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "Failed to load face data",
    });
  } finally {
    setLoading(false);
  }
};

  // Fetch today's stats
  const fetchTodayStats = async () => {
    try {
      const res = await axiosInstance.get("/factory-attendance/today");
      setTodayStats(res.data);
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  };

  // Ultra-fast face capture and match
  const handleCapture = async () => {
    if (!modelsLoaded || !faceMatcher) {
      Swal.fire({
        icon: "info",
        title: "Not Ready",
        text: "System is still loading. Please wait.",
        timer: 1500,
        showConfirmButton: false
      });
      return;
    }

    if (isProcessing) return;

    setIsProcessing(true);

    try {
      // Capture face - smaller resolution for faster processing
      const screenshot = webcamRef.current?.getScreenshot();
      if (!screenshot) throw new Error("No screenshot captured");

      // Create image element from screenshot
      const img = await faceapi.fetchImage(screenshot);
      
      // Detect face and get descriptor - OPTIMIZED for speed
      const detection = await faceapi
        .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions({ 
          inputSize: 160, // Balanced between speed and accuracy
          scoreThreshold: 0.3 
        }))
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        Swal.fire({
          icon: "error",
          title: "Face Not Detected",
          text: "Please ensure face is clearly visible",
          timer: 1500,
          showConfirmButton: false
        });
        setIsProcessing(false);
        return;
      }

      // Find best match - instantaneous
      const bestMatch = faceMatcher.findBestMatch(detection.descriptor);
      
      if (bestMatch.label === "unknown") {
        Swal.fire({
          icon: "error",
          title: "No Match Found",
          text: "Employee not found in database",
          timer: 1500,
          showConfirmButton: false
        });
        setIsProcessing(false);
        return;
      }

      // Find the matched employee
      const matchedEmployee = employees.find(emp => emp._id === bestMatch.label);
      
      if (!matchedEmployee) {
        setIsProcessing(false);
        return;
      }

      const confidence = Math.round((1 - bestMatch.distance) * 100);

      // Play success sound immediately
      playSuccessSound();

      // Ask for check-in/out
      const result = await Swal.fire({
        title: `Welcome ${matchedEmployee.name}`,
        html: `
          <div class="text-left">
            <p><strong>Designation:</strong> ${matchedEmployee.designation}</p>
            <p><strong>Match:</strong> ${confidence}%</p>
          </div>
        `,
        icon: "question",
        showCancelButton: true,
        showDenyButton: true,
        confirmButtonText: "✅ Check In",
        denyButtonText: "👋 Check Out",
        cancelButtonText: "❌ Cancel",
        confirmButtonColor: "#22c55e",
        denyButtonColor: "#ef4444",
        timer: 10000,
        timerProgressBar: true,
      });

      if (result.isConfirmed) {
        await markAttendance(matchedEmployee._id, matchedEmployee.name, "check-in");
      } else if (result.isDenied) {
        await markAttendance(matchedEmployee._id, matchedEmployee.name, "check-out");
      }

    } catch (err) {
      console.error("Error during capture:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Face detection failed. Please try again.",
        timer: 1500,
        showConfirmButton: false
      });
    } finally {
      setCapturing(false);
      setIsProcessing(false);
    }
  };

const playSuccessWithVoice = () => {
  // Play beep and voice in parallel for maximum speed
  
  // Beep sound
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    if (audioContext.state === 'suspended') audioContext.resume();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.frequency.value = 800;
    gainNode.gain.value = 0.5;
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.15); // Slightly shorter beep
  } catch (err) {
    console.log("Beep error:", err);
  }

  // Voice - play immediately without any delay
  if ('speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel(); // Stop any previous speech
      
      const utterance = new SpeechSynthesisUtterance('अटेंडेंस लग गया');
      utterance.volume = 1;
      utterance.rate = 1.3; // Faster speech
      utterance.pitch = 1;
      utterance.lang = 'hi-IN';
      
      // Use the cached voice if available
      if (cachedVoice) {
        utterance.voice = cachedVoice;
      }
      
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.log("Voice error:", err);
    }
  }
};



// In your markAttendance function, replace playSuccessSound() with:
const markAttendance = async (userId, userName, type) => {
  try {
    const response = await axiosInstance.post("/factory-attendance/mark", {
      userId,
      type,
      shift: currentShift
    });

    // Play combined sound (beep + voice)
    playSuccessWithVoice();

    // Update stats
    fetchTodayStats();

    // Show success message
    Swal.fire({
      icon: "success",
      title: "✅ अटेंडेंस लग गया!",
      html: `
        <div class="text-center">
          <p class="text-lg font-semibold text-green-600 mb-2">${userName}</p>
          <p class="text-md mb-1">${type === "check-in" ? "✅ Check In" : "👋 Check Out"} Successful</p>
          <p class="text-sm text-gray-600">Time: ${new Date().toLocaleTimeString()}</p>
        </div>
      `,
      timer: 2000,
      showConfirmButton: false
    });

  } catch (err) {
    console.error("Error marking attendance:", err);
    Swal.fire({
      icon: "error",
      title: "Error",
      text: err.response?.data?.error || "Failed to mark attendance",
      timer: 2000,
      showConfirmButton: false
    });
  }
};

  // If not guard, show access denied
  if (!userRoles.includes("guard")) {
    return (
      <>
        <InternalNavbar />
        <div className="min-h-screen flex items-center justify-center">
          <div className="bg-red-50 p-8 rounded-2xl text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-red-700 mb-2">Access Denied</h2>
            <p className="text-red-600">Only guards can access this page</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <InternalNavbar />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-xl p-6 mb-6"
          >
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                  <Zap className="w-6 h-6 text-yellow-500" />
                  Factory Attendance
                </h1>
                <p className="text-gray-600 mt-1">
                  For Operators, Helpers & Drivers
                </p>
              </div>
              <div className="bg-blue-50 px-4 py-2 rounded-xl">
                <Clock className="w-4 h-4 text-blue-600 inline mr-2" />
                <span className="font-medium">
                  Shift {currentShift === "shift1" ? "1 (8 AM - 8:30 PM)" : "2 (8:30 PM onwards)"}
                </span>
              </div>
            </div>

            {/* Status indicator */}
            <div className="mt-4 flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isReady ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
              <span className="text-sm text-gray-600">
                {loading ? "Loading..." : 
                 isReady ? `${employees.length} employees loaded` : 
                 "No employees with registered faces"}
              </span>
            </div>
          </motion.div>

          {/* Camera Interface */}
          {!capturing ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl shadow-xl p-8 text-center"
            >
              <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Camera className="w-12 h-12 text-blue-600" />
              </div>
              
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Ready to Mark Attendance
              </h2>
              
              <p className="text-gray-600 mb-8">
                Click below and look at the camera - takes less than 2 seconds!
              </p>

              <motion.button
                onClick={() => setCapturing(true)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="bg-blue-600 text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-lg hover:bg-blue-700 transition-all flex items-center gap-2 mx-auto"
                disabled={!isReady || loading}
              >
                <Zap className="w-5 h-5" />
                {loading ? "Loading..." : !isReady ? "No Employees" : "Start Recognition"}
              </motion.button>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white rounded-2xl shadow-xl p-6"
            >
              <div className="relative">
                <ReactWebcam
                  ref={webcamRef}
                  audio={false}
                  screenshotFormat="image/jpeg"
                  className="w-full rounded-xl"
                  videoConstraints={{
                    facingMode: "user",
                    width: 480,
                    height: 360
                  }}
                />
                
                {/* Face overlay guide */}
                <div className="absolute inset-0 border-4 border-blue-400 border-dashed rounded-xl pointer-events-none"></div>
                <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-1 rounded-lg text-sm">
                  Position face in center
                </div>
              </div>

              <div className="flex justify-between mt-6">
                <button
                  onClick={() => setCapturing(false)}
                  className="px-6 py-3 bg-gray-200 rounded-xl font-medium hover:bg-gray-300 transition"
                  disabled={isProcessing}
                >
                  Cancel
                </button>
                
                <motion.button
                  onClick={handleCapture}
                  disabled={isProcessing}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-8 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition flex items-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Matching...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      Capture & Match
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* Today's Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <div className="bg-white p-6 rounded-xl shadow">
              <h3 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                Shift 1 Present
              </h3>
              <p className="text-3xl font-bold text-blue-600">{todayStats.shift1 || 0}</p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow">
              <h3 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-600" />
                Shift 2 Present
              </h3>
              <p className="text-3xl font-bold text-purple-600">{todayStats.shift2 || 0}</p>
            </div>
          </motion.div>

          {/* Quick Tips */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-6 bg-blue-50 p-4 rounded-xl"
          >
            <h4 className="font-medium text-blue-800 mb-2">⚡ Tips for fastest recognition:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Good lighting on your face</li>
              <li>• Remove mask/sunglasses</li>
              <li>• Look directly at camera</li>
              <li>• Stay still for a moment</li>
            </ul>
          </motion.div>
        </div>
      </div>
    </>
  );
}