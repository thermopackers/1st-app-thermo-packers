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
  const [cameraReady, setCameraReady] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentShift, setCurrentShift] = useState("shift1");
  const [isProcessing, setIsProcessing] = useState(false);
  const [shouldAutoRestart, setShouldAutoRestart] = useState(false);
  const [todayStats, setTodayStats] = useState({ shift1: 0, shift2: 0 });
  const [isReady, setIsReady] = useState(false);
  const [autoStart, setAutoStart] = useState(false);
  const [faceMatcher, setFaceMatcher] = useState(null);
  const [voicesLoaded, setVoicesLoaded] = useState(false);
  const [autoStarting, setAutoStarting] = useState(false);

  // Add this state
  const [cachedVoice, setCachedVoice] = useState(null);
  const captureLockRef = useRef(false);
  const autoCaptureTimerRef = useRef(null);
  const scanningIntervalRef = useRef(null);
  const lastProcessedUserRef = useRef(null);
  const heartbeatIntervalRef = useRef(null);
  const lastProcessedTimeRef = useRef(0);
  const [recentMatches, setRecentMatches] = useState([]);
  const [todaySessions, setTodaySessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const lastCaptureAttemptRef = useRef(0);
  const MIN_CAPTURE_INTERVAL = 2000;

  // OPTIMAL COOLDOWN - 18 seconds (balanced for all scenarios)
  const OPTIMAL_COOLDOWN_MS = 18000; // 18 seconds

  // Fetch sessions when a user is successfully matched
  useEffect(() => {
    const fetchSessionsForUser = async () => {
      if (lastProcessedUserRef.current) {
        await fetchTodaySessions(lastProcessedUserRef.current);
      }
    };
    
    // Only fetch if we have a user and not processing
    if (lastProcessedUserRef.current && !isProcessing) {
      fetchSessionsForUser();
    }
  }, [lastProcessedUserRef.current, isProcessing]);

  // ============================================
  // CAMERA KEEP-ALIVE HEARTBEAT
  // Prevents camera from going to sleep after being idle
  // ============================================
  useEffect(() => {
    if (!capturing || !cameraReady) return;

    console.log("💓 Starting camera keep-alive heartbeat...");
    
    // Clear any existing heartbeat
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }

    // Send a "heartbeat" every 30 seconds to keep camera active
    heartbeatIntervalRef.current = setInterval(() => {
      if (!capturing || !cameraReady || isProcessing || captureLockRef.current) {
        return;
      }
      
      console.log("💓 Camera heartbeat - keeping alive");
      
      // Force a tiny capture to keep the camera stream active
      try {
        if (webcamRef.current && webcamRef.current.video) {
          const video = webcamRef.current.video;
          if (video.readyState === 4) {
            // Just read a frame to keep the stream active
            const canvas = document.createElement('canvas');
            canvas.width = 1;
            canvas.height = 1;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0, 1, 1);
          }
        }
      } catch (err) {
        // Silent fail
      }
    }, 30000); // Every 30 seconds

    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }
    };
  }, [capturing, cameraReady, isProcessing]);

  // Add at the very top of GuardAttendance component
  useEffect(() => {
    // Fix for Fully Kiosk browser
    if (window.FullyKiosk) {
      console.log("Running in Fully Kiosk");
      // Disable strict mode features that cause white page
      document.body.style.backgroundColor = "#f3f4f6";
    }
  }, []);

  // Reset camera ready when capturing stops
  useEffect(() => {
    if (!capturing) {
      setCameraReady(false);
      setIsScanning(false);
      // Clear scanning interval when not capturing
      if (scanningIntervalRef.current) {
        clearInterval(scanningIntervalRef.current);
        scanningIntervalRef.current = null;
      }
    }
  }, [capturing]);

  // Check if webcam is actually ready to take screenshots
  useEffect(() => {
    if (!capturing) return;
    
    const checkWebcamReady = setInterval(() => {
      if (webcamRef.current && webcamRef.current.video && webcamRef.current.video.readyState === 4) {
        const testShot = webcamRef.current.getScreenshot();
        if (testShot) {
          console.log("✅ Webcam is ready for screenshots");
          clearInterval(checkWebcamReady);
        }
      }
    }, 500);
    
    return () => clearInterval(checkWebcamReady);
  }, [capturing]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const auto = params.get('auto');
    if (auto === 'true') {
      setAutoStart(true);
    }
  }, []);

  // Safe voice loading for Fully Kiosk
  useEffect(() => {
    const loadVoicesSafely = () => {
      try {
        // Check if speechSynthesis exists (Fully Kiosk may not have it)
        if (typeof window !== 'undefined' && window.speechSynthesis && window.speechSynthesis.getVoices) {
          const voices = window.speechSynthesis.getVoices();
          if (voices && voices.length > 0) {
            // Try to find a Hindi voice first
            const hindiVoice = voices.find(v => v.lang === 'hi-IN' || v.lang === 'hi');
            setCachedVoice(hindiVoice || voices[0]);
            setVoicesLoaded(true);
            console.log("✅ Voice loaded:", (hindiVoice || voices[0])?.name);
          } else if (voices && voices.length === 0) {
            // Voices might load asynchronously
            console.log("Waiting for voices to load...");
            setTimeout(loadVoicesSafely, 200);
          } else {
            setVoicesLoaded(true);
          }
        } else {
          console.log("Speech synthesis not supported");
          setVoicesLoaded(true);
        }
      } catch (err) {
        console.warn("Error loading voices:", err);
        setVoicesLoaded(true);
      }
    };

    loadVoicesSafely();
    
    // Set up voices changed event if available
    if (typeof window !== 'undefined' && window.speechSynthesis && window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoicesSafely;
      
      return () => {
        if (window.speechSynthesis) {
          window.speechSynthesis.onvoiceschanged = null;
        }
      };
    }
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

  // Ultra-fast auto-capture when camera becomes active - WITH DELAY FOR STABILIZATION
  useEffect(() => {
    console.log("🔍 Auto-capture check - capturing:", capturing, "cameraReady:", cameraReady, "modelsLoaded:", modelsLoaded, "faceMatcher:", !!faceMatcher, "locked:", captureLockRef.current);
    
    if (capturing && cameraReady && webcamRef.current && modelsLoaded && faceMatcher && !captureLockRef.current) {
      // Check throttle
      const now = Date.now();
      if (now - lastCaptureAttemptRef.current < MIN_CAPTURE_INTERVAL) {
        console.log("⏱️ Skipping auto-capture - too soon since last attempt");
        return;
      }
      
      console.log("🎯 Auto-capture triggered! Starting handleCapture instantly");
      lastCaptureAttemptRef.current = now;
      
      // Clear any existing timer
      if (autoCaptureTimerRef.current) {
        clearTimeout(autoCaptureTimerRef.current);
      }
      
      // 🔴 FIX: Add delay for first capture to let camera stabilize
      const isFirstCapture = !lastProcessedUserRef.current;
      const delay = isFirstCapture ? 1500 : 100; // 1.5s for first, 100ms for subsequent
      
      console.log(`⏳ ${isFirstCapture ? 'First capture' : 'Subsequent capture'} - waiting ${delay}ms...`);
      
      autoCaptureTimerRef.current = setTimeout(() => {
        console.log("⚡ Instant capture!");
        if (webcamRef.current && !captureLockRef.current && !isProcessing) {
          handleCapture();
        }
        autoCaptureTimerRef.current = null;
      }, delay);
    }
    
    return () => {
      if (autoCaptureTimerRef.current) {
        console.log("🧹 Cleaning up auto-capture timer");
        clearTimeout(autoCaptureTimerRef.current);
        autoCaptureTimerRef.current = null;
      }
    };
  }, [capturing, cameraReady, modelsLoaded, faceMatcher, isProcessing]);

  // ============================================
  // TAB VISIBILITY HANDLER
  // Restarts camera when tab becomes visible again
  // ============================================
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log("📱 Tab became visible again - checking camera status...");
        
        // Check if camera is still responsive
        if (capturing && webcamRef.current && webcamRef.current.video) {
          const video = webcamRef.current.video;
          if (video.readyState !== 4 || video.videoWidth === 0) {
            console.log("🔄 Camera not responsive after tab return - restarting...");
            setCapturing(false);
            setTimeout(() => setCapturing(true), 500);
          }
        } else if (autoStart && !capturing && isReady) {
          console.log("🔄 Restarting camera after tab return...");
          setCapturing(true);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [capturing, autoStart, isReady]);

  // Continuous face scanning - keeps checking for faces
  useEffect(() => {
    // Don't start scanning if conditions not met
    if (!capturing || !cameraReady || !modelsLoaded || !faceMatcher) {
      if (scanningIntervalRef.current) {
        console.log("🧹 Clearing scanning interval - conditions not met");
        clearInterval(scanningIntervalRef.current);
        scanningIntervalRef.current = null;
        setIsScanning(false);
      }
      return;
    }

    // If already processing, don't start new scan
    if (isProcessing || captureLockRef.current) {
      return;
    }

    console.log("👁️ Starting continuous face scanning...");
    setIsScanning(true);
    
    // Clear any existing interval to avoid duplicates
    if (scanningIntervalRef.current) {
      clearInterval(scanningIntervalRef.current);
      scanningIntervalRef.current = null;
    }

    // Start scanning every 1000ms
    scanningIntervalRef.current = setInterval(async () => {
      // Don't scan if already processing or locked
      if (isProcessing || captureLockRef.current) {
        return;
      }
      
      // Throttle: Don't attempt capture too frequently
      const now = Date.now();
      if (now - lastCaptureAttemptRef.current < MIN_CAPTURE_INTERVAL) {
        // Too soon since last capture attempt, skip
        return;
      }
      
      // Check if webcam is ready
      if (!webcamRef.current || !webcamRef.current.video) {
        return;
      }
      
      const video = webcamRef.current.video;
      if (video.readyState !== 4 || video.videoWidth === 0) {
        return;
      }
      
      // Test if we can get a screenshot
      let testScreenshot = null;
      try {
        testScreenshot = webcamRef.current.getScreenshot();
      } catch(e) {
        return;
      }
      
      if (!testScreenshot) {
        return;
      }
      
      try {
        // Capture current frame from video
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = canvas.toDataURL('image/jpeg');
        
        if (!imageData) return;
        
        // Quick face detection on the frame
        const img = await faceapi.fetchImage(imageData);
        const detections = await faceapi.detectAllFaces(img, new faceapi.TinyFaceDetectorOptions({ 
          inputSize: 160,
          scoreThreshold: 0.5 
        }));
        
        if (detections && detections.length > 0) {
          // Check if face is large enough
          const largestFace = detections.reduce((max, d) => {
            const area = d.box.width * d.box.height;
            return area > max.area ? { detection: d, area } : max;
          }, { detection: detections[0], area: 0 });
          
          const faceArea = largestFace.area;
          const videoArea = video.videoWidth * video.videoHeight;
          const faceRatio = faceArea / videoArea;
          
          if (faceRatio > 0.08) {
            console.log(`👤 Face detected! Size: ${Math.round(faceRatio * 100)}%. Triggering capture...`);
            // Update last attempt time
            lastCaptureAttemptRef.current = Date.now();
            
            // Stop scanning immediately
            if (scanningIntervalRef.current) {
              clearInterval(scanningIntervalRef.current);
              scanningIntervalRef.current = null;
            }
            setIsScanning(false);
            setTimeout(() => {
              if (!isProcessing && !captureLockRef.current) {
                handleCapture();
              }
            }, 300);
          }
        }
      } catch (err) {
        // Silent fail
      }
    }, 1000);
    
    // Cleanup
    return () => {
      if (scanningIntervalRef.current) {
        console.log("🧹 Stopping continuous face scanning (cleanup)");
        clearInterval(scanningIntervalRef.current);
        scanningIntervalRef.current = null;
      }
      setIsScanning(false);
    };
  }, [capturing, cameraReady, modelsLoaded, faceMatcher, isProcessing]);

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

  // Enable audio context for Fully Kiosk (needs user interaction)
  useEffect(() => {
    const enableAudioOnFirstTouch = async () => {
      try {
        if (window.AudioContext || window.webkitAudioContext) {
          const audioContext = new (window.AudioContext || window.webkitAudioContext)();
          if (audioContext.state === 'suspended') {
            await audioContext.resume();
            console.log("Audio context resumed for Fully Kiosk");
          }
        }
      } catch (err) {
        console.log("Audio enable error:", err);
      }
    };
    
    // Add one-time click/touch listener to enable audio
    const handleFirstInteraction = () => {
      enableAudioOnFirstTouch();
      document.body.removeEventListener('click', handleFirstInteraction);
      document.body.removeEventListener('touchstart', handleFirstInteraction);
    };
    
    document.body.addEventListener('click', handleFirstInteraction);
    document.body.addEventListener('touchstart', handleFirstInteraction);
    
    return () => {
      document.body.removeEventListener('click', handleFirstInteraction);
      document.body.removeEventListener('touchstart', handleFirstInteraction);
    };
  }, []);

  // Check camera permissions on mount
  useEffect(() => {
    const checkCameraPermission = async () => {
      try {
        // Check if mediaDevices is supported
        if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
          console.log("MediaDevices not supported");
          return;
        }

        // Check if we have camera permission
        const devices = await navigator.mediaDevices.enumerateDevices();
        const hasCamera = devices.some(device => device.kind === 'videoinput');
        
        if (!hasCamera) {
          Swal.fire({
            icon: "warning",
            title: "No Camera Found",
            text: "No camera detected on this device. Please connect a camera and try again.",
            confirmButtonColor: "#2563eb"
          });
          return;
        }

        // Check permission status
        const permissionStatus = await navigator.permissions.query({ name: 'camera' });
        
        if (permissionStatus.state === 'denied') {
          Swal.fire({
            icon: "error",
            title: "Camera Access Denied",
            html: `
              <div class="text-left">
                <p class="mb-2">Please allow camera access:</p>
                <p class="text-sm text-gray-600">1. Click the camera icon in address bar</p>
                <p class="text-sm text-gray-600">2. Select "Allow" for camera permission</p>
                <p class="text-sm text-gray-600">3. Refresh the page</p>
              </div>
            `,
            confirmButtonColor: "#2563eb"
          });
        }
        
      } catch (err) {
        console.error("Error checking camera permission:", err);
      }
    };
    
    checkCameraPermission();
  }, []);

  // Auto-start capture when component mounts OR when shouldAutoRestart changes
  useEffect(() => {
    if (!autoStart) return;
    if (!isReady || loading) return;

    const autoStartRecognition = async () => {
      setAutoStarting(true);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const hasPermission = await requestCameraPermission();
      if (hasPermission) {
        setCameraReady(false);
        // Small delay before setting capturing to true
        setTimeout(() => {
          setCapturing(true);
        }, 500);
      } else {
        Swal.fire({
          icon: "error",
          title: "Camera Access Required",
          html: `
            <div class="text-left">
              <p class="mb-2">Please allow camera access:</p>
              <p class="text-sm text-gray-600">1. Click the camera icon in address bar</p>
              <p class="text-sm text-gray-600">2. Select "Allow" for camera permission</p>
              <p class="text-sm text-gray-600">3. Refresh the page</p>
            </div>
          `,
          confirmButtonColor: "#2563eb"
        });
      }
      setAutoStarting(false);
      setShouldAutoRestart(false);
    };
    
    autoStartRecognition();
  }, [autoStart, isReady, loading, shouldAutoRestart]);

  const loadEmployeesAndCreateMatcher = async () => {
    try {
      setLoading(true);
      
      // Get pre-processed descriptors
      const res = await axiosInstance.get("/users/preprocessed-descriptors");
      const employeesWithDescriptors = res.data;
      
      console.log(`Found ${employeesWithDescriptors.length} pre-processed faces`);
      
      if (employeesWithDescriptors.length === 0) {
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

      // 🔴 CRITICAL FIX: Use STRICTER threshold for better accuracy
      const MATCH_THRESHOLD = 0.45; // Lower = more strict (was 0.5)
      
      // Create labeled descriptors array with validation
      const labeledDescriptors = [];
      const validEmployees = [];
      
      employeesWithDescriptors.forEach(emp => {
        if (emp.descriptor && emp.descriptor.length === 128) {
          try {
            const descriptorArray = new Float32Array(emp.descriptor);
            // Validate descriptor has valid values (not all zeros)
            const sum = descriptorArray.reduce((a, b) => a + Math.abs(b), 0);
            if (sum > 0) {
              labeledDescriptors.push(
                new faceapi.LabeledFaceDescriptors(
                  emp._id,
                  [descriptorArray]
                )
              );
              validEmployees.push({
                _id: emp._id,
                name: emp.name,
                designation: emp.designation
              });
            } else {
              console.warn(`⚠️ Invalid descriptor (all zeros) for ${emp.name}`);
            }
          } catch (err) {
            console.warn(`⚠️ Error processing descriptor for ${emp.name}:`, err);
          }
        } else {
          console.warn(`⚠️ Invalid descriptor format for ${emp.name}`);
        }
      });

      if (labeledDescriptors.length === 0) {
        console.error("❌ No valid descriptors found");
        Swal.fire({
          icon: "error",
          title: "No Valid Faces",
          text: "No valid face data found. Please re-register faces.",
        });
        setIsReady(false);
        setLoading(false);
        return;
      }

      console.log(`✅ Created ${labeledDescriptors.length} valid face descriptors`);
      
      // Create face matcher with STRICT threshold
      const matcher = new faceapi.FaceMatcher(labeledDescriptors, MATCH_THRESHOLD);
      setFaceMatcher(matcher);
      
      // Store employees for reference
      setEmployees(validEmployees);
      
      setIsReady(true);
      console.log(`✅ Face matcher ready with ${labeledDescriptors.length} employees (threshold: ${MATCH_THRESHOLD})`);
      
      // Show success message
      Swal.fire({
        icon: "success",
        title: "Ready!",
        text: `${labeledDescriptors.length} employees loaded with strict matching`,
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

  const handleCapture = async () => {
    console.log("🔍 handleCapture called - isProcessing:", isProcessing, "captureLockRef:", captureLockRef.current);
    
    // Prevent multiple simultaneous captures
    if (isProcessing) {
      console.log("❌ Already processing, skipping");
      return;
    }
    
    if (captureLockRef.current) {
      console.log("❌ Already locked, skipping");
      return;
    }
    
    if (!modelsLoaded || !faceMatcher) {
      console.log("❌ Models not ready - modelsLoaded:", modelsLoaded, "faceMatcher:", !!faceMatcher);
      Swal.fire({
        icon: "info",
        title: "Not Ready",
        text: "System is still loading. Please wait.",
        timer: 1500,
        showConfirmButton: false
      });
      return;
    }

    // Set lock
    captureLockRef.current = true;
    setIsProcessing(true);
    console.log("✅ Starting capture process - lock acquired");

    try {
      // Check if webcam is ready
      if (!webcamRef.current) {
        console.log("❌ Webcam ref is null");
        throw new Error("Webcam not ready");
      }
      
      const video = webcamRef.current.video;
      if (!video || video.readyState !== 4) {
        console.log("❌ Video not ready, readyState:", video?.readyState);
        throw new Error("Video not ready");
      }
      
      // Method 1: Try getScreenshot() first with retries
      console.log("📸 Taking screenshot...");
      let screenshot = null;
      let retryCount = 0;
      const maxRetries = 3;
      
      while (!screenshot && retryCount < maxRetries) {
        try {
          screenshot = webcamRef.current.getScreenshot();
        } catch(e) {
          console.log(`⚠️ Screenshot attempt ${retryCount + 1} error:`, e.message);
        }
        
        if (!screenshot) {
          console.log(`⚠️ Screenshot attempt ${retryCount + 1} failed, retrying...`);
          await new Promise(resolve => setTimeout(resolve, 200));
          retryCount++;
        }
      }
      
      // Method 2: If getScreenshot fails, use canvas capture
      if (!screenshot) {
        console.log("📸 getScreenshot failed, trying canvas capture...");
        try {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          screenshot = canvas.toDataURL('image/jpeg');
          console.log("✅ Canvas capture successful");
        } catch(e) {
          console.log("❌ Canvas capture failed:", e.message);
        }
      }
      
      console.log("📸 Screenshot taken:", screenshot ? "Yes (length: " + screenshot.length + ")" : "No");
      
      if (!screenshot) {
        console.log("❌ Could not take screenshot after multiple attempts");
        Swal.fire({
          icon: "info",
          title: "Camera Not Ready",
          text: "Please wait a moment and try again",
          timer: 1500,
          showConfirmButton: false
        });
        setIsProcessing(false);
        captureLockRef.current = false;
        if (autoStart) {
          setTimeout(() => {
            if (!capturing && !isProcessing) {
              setCapturing(true);
            }
          }, 1000);
        }
        return;
      }

      console.log("🖼️ Creating image from screenshot...");
      const img = await faceapi.fetchImage(screenshot);
      console.log("✅ Image created");

      console.log("🔍 Detecting all faces...");
      const detections = await faceapi
        .detectAllFaces(img, new faceapi.TinyFaceDetectorOptions({ 
          inputSize: 224,
          scoreThreshold: 0.4 
        }))
        .withFaceLandmarks()
        .withFaceDescriptors();

      if (!detections || detections.length === 0) {
        console.log("❌ No face detected - please ensure good lighting and face is visible");
        // Silent fail - no popup, just log and continue scanning
        setIsProcessing(false);
        captureLockRef.current = false;
        if (autoStart) {
          setTimeout(() => {
            if (!capturing && !isProcessing) {
              setCapturing(true);
            }
          }, 500);
        }
        return;
      }

      console.log(`✅ ${detections.length} face(s) detected`);

      // Take the LARGEST face (closest to camera)
      let bestDetection = detections[0];
      let largestArea = 0;
      
      for (const detection of detections) {
        const box = detection.detection.box;
        const area = box.width * box.height;
        if (area > largestArea) {
          largestArea = area;
          bestDetection = detection;
        }
      }
      
      // 🔴 FIX: More strict face size requirement for first capture
      const isFirstCapture = !lastProcessedUserRef.current;
      const minFaceRatio = isFirstCapture ? 0.10 : 0.08;
      
      // Check if face is large enough
      if (video) {
        const videoArea = video.videoWidth * video.videoHeight;
        const faceRatio = largestArea / videoArea;
        if (faceRatio < minFaceRatio) {
          console.log(`⚠️ Face too small (${Math.round(faceRatio * 100)}% of frame). Need ${Math.round(minFaceRatio * 100)}%.`);
          if (isFirstCapture) {
            await Swal.fire({
              icon: "info",
              title: "Move Closer",
              text: "Please move closer to the camera for better recognition",
              timer: 1500,
              showConfirmButton: false
            });
          }
          setIsProcessing(false);
          captureLockRef.current = false;
          if (autoStart) {
            setTimeout(() => {
              if (!capturing && !isProcessing) {
                setCapturing(true);
              }
            }, 1000);
          }
          return;
        }
        console.log(`✅ Face size: ${Math.round(faceRatio * 100)}% of frame - Good!`);
      }

      // 🔴 FIX: Use STRICTER threshold for matching
      // Find best match across all faces with stricter threshold
      let bestMatch = null;
      let bestDistance = 0.45; // STRICT THRESHOLD (was 0.5)
      let matchedEmployee = null;
      let allMatches = [];

      // Log all detections for debugging
      console.log(`🔍 Comparing ${detections.length} face(s) against ${employees.length} employees`);

      for (const detection of detections) {
        const match = faceMatcher.findBestMatch(detection.descriptor);
        console.log(`  Face match: label=${match.label}, distance=${match.distance.toFixed(4)}`);
        
        if (match.label !== "unknown") {
          allMatches.push({ label: match.label, distance: match.distance });
        }
        
        if (match.label !== "unknown" && match.distance < bestDistance) {
          bestDistance = match.distance;
          bestMatch = match;
          matchedEmployee = employees.find(emp => emp._id === match.label);
          console.log(`  ✅ New best match: ${matchedEmployee?.name} (${(1 - bestDistance) * 100}%)`);
        }
      }

      // 🔴 ADD THIS: Log all matches found
      if (allMatches.length > 0) {
        console.log(`📊 All matches found:`, allMatches.map(m => `${m.label} (${(1-m.distance)*100}%)`));
      }

      // 🔴 ADD THIS: Check for ambiguous matches
      if (allMatches.length > 1) {
        // Sort by distance (lower is better)
        const sorted = [...allMatches].sort((a, b) => a.distance - b.distance);
        const best = sorted[0];
        const secondBest = sorted[1];
        
        // If the difference between best and second best is too small, it's ambiguous
        if (secondBest && (best.distance - secondBest.distance) < 0.05) {
          console.warn(`⚠️ Ambiguous match: ${best.distance.toFixed(4)} vs ${secondBest.distance.toFixed(4)} - rejecting`);
          // Reject ambiguous matches
          bestMatch = null;
          matchedEmployee = null;
        }
      }

      if (!bestMatch || bestMatch.label === "unknown" || !matchedEmployee) {
        console.log("❌ No match found in database");
        await Swal.fire({
          icon: "error",
          title: "Not Recognized",
          text: "Face not recognized. Please try again with better lighting.",
          timer: 1500,
          showConfirmButton: false
        });
        setIsProcessing(false);
        captureLockRef.current = false;
        if (autoStart) {
          setTimeout(() => {
            if (!capturing && !isProcessing) {
              setCapturing(true);
            }
          }, 1000);
        }
        return;
      }

      const confidence = Math.round((1 - bestDistance) * 100);
      console.log(`👤 Matched: ${matchedEmployee.name} (${confidence}%)`);

      // 🔴 ADD THIS: Double-check confidence is reasonable
      if (confidence < 55) {
        console.log(`⚠️ Low confidence match (${confidence}%) - rejecting`);
        await Swal.fire({
          icon: "error",
          title: "Low Confidence",
          text: `Match confidence too low (${confidence}%). Please try again.`,
          timer: 1500,
          showConfirmButton: false
        });
        setIsProcessing(false);
        captureLockRef.current = false;
        if (autoStart) {
          setTimeout(() => {
            if (!capturing && !isProcessing) {
              setCapturing(true);
            }
          }, 1000);
        }
        return;
      }

      // 🔴 ADD THIS: Verify this employee is in the current session list
      const employeeExists = employees.some(emp => emp._id === matchedEmployee._id);
      if (!employeeExists) {
        console.log(`❌ Matched employee ${matchedEmployee.name} not found in active employees list`);
        await Swal.fire({
          icon: "error",
          title: "Error",
          text: "Employee not active. Please contact admin.",
          timer: 1500,
          showConfirmButton: false
        });
        setIsProcessing(false);
        captureLockRef.current = false;
        if (autoStart) {
          setTimeout(() => {
            if (!capturing && !isProcessing) {
              setCapturing(true);
            }
          }, 1000);
        }
        return;
      }

      // FETCH USER'S SESSIONS FOR TODAY FIRST
      let sessionsData = null;
      let activeSessionExists = false;
      let activeSessionData = null;

      try {
        console.log("📊 Fetching user sessions for:", matchedEmployee.name);
        const sessionsRes = await axiosInstance.get(`/factory-attendance/my-sessions/${matchedEmployee._id}`);
        sessionsData = sessionsRes.data;
        activeSessionExists = !!sessionsData.activeSession;
        activeSessionData = sessionsData.activeSession;
        console.log("Sessions data:", { activeSessionExists, sessionCount: sessionsData.sessionCount });
      } catch (err) {
        console.log("Could not fetch sessions, using fallback logic");
      }

      // CHECK COOLDOWN - only for users who are NOT already checked in
      const now = Date.now();
      if (lastProcessedUserRef.current === matchedEmployee._id && 
          (now - lastProcessedTimeRef.current) < OPTIMAL_COOLDOWN_MS) {
        const secondsLeft = Math.ceil((OPTIMAL_COOLDOWN_MS - (now - lastProcessedTimeRef.current)) / 1000);
        console.log(`⏱️ ${matchedEmployee.name} on cooldown (${secondsLeft}s left)`);
        
        await Swal.fire({
          icon: "info",
          title: `Welcome back ${matchedEmployee.name}`,
          html: `<div class="text-center"><p class="text-md">Please wait ${secondsLeft} seconds</p></div>`,
          timer: 1000,
          showConfirmButton: false
        });
        
        setIsProcessing(false);
        setCapturing(false);
        captureLockRef.current = false;
        if (autoStart) setTimeout(() => setShouldAutoRestart(true), 1000);
        return;
      }

      // ============================================
      // INTELLIGENT AUTO DECISION LOGIC
      // ============================================
      
      const currentHour = new Date().getHours();
      const currentMinutes = new Date().getMinutes();
      const isLunchTime = (currentHour === 12) || (currentHour === 13) || (currentHour === 14 && currentMinutes < 30);
      const isNearEndOfDay = currentHour >= 17; // After 5 PM
      const isEarlyMorning = currentHour < 11; // Before 11 AM
      
      let action = null;
      let actionReason = "";
      let sessionType = "normal";

      // CASE 1: NO ACTIVE SESSION - They are entering the building
      if (!activeSessionExists) {
        action = "check-in";
        
        if (!sessionsData || sessionsData.sessions.length === 0) {
          actionReason = "First arrival of the day";
          sessionType = "first_checkin";
        } else {
          const lastSession = sessionsData.sessions[sessionsData.sessions.length - 1];
          if (lastSession && lastSession.checkOutTime) {
            const lastCheckoutTime = new Date(lastSession.checkOutTime);
            const minutesSinceLastCheckout = (Date.now() - lastCheckoutTime) / (1000 * 60);
            
            if (minutesSinceLastCheckout < 120 && isLunchTime) {
              actionReason = "Returning from lunch break";
              sessionType = "return_from_lunch";
            } else {
              actionReason = "Returning to building";
              sessionType = "reentry";
            }
          } else {
            actionReason = "Starting new session";
            sessionType = "new_session";
          }
        }
        
        console.log(`🟢 AUTO CHECK-IN: ${matchedEmployee.name} - ${actionReason}`);
        
      } 
      // CASE 2: ACTIVE SESSION EXISTS - They might be leaving
      else if (activeSessionExists && activeSessionData) {
        const sessionStartTime = new Date(activeSessionData.checkInTime);
        const sessionDurationMinutes = (Date.now() - sessionStartTime) / (1000 * 60);
        
        console.log(`Current session duration: ${sessionDurationMinutes.toFixed(0)} minutes`);
        
        if (sessionDurationMinutes < 2) {
          console.log("⚠️ Very short session - likely accidental double scan, ignoring");
          action = null;
          actionReason = "Accidental double scan - ignoring";
          
          await Swal.fire({
            icon: "info",
            title: matchedEmployee.name,
            html: `<div class="text-center"><p class="text-md">Already checked in</p><p class="text-sm text-gray-500">${new Date().toLocaleTimeString()}</p></div>`,
            timer: 1000,
            showConfirmButton: false
          });
          
          setIsProcessing(false);
          setCapturing(false);
          captureLockRef.current = false;
          if (autoStart) setTimeout(() => setShouldAutoRestart(true), 1000);
          return;
        }
        else if (isLunchTime && sessionDurationMinutes > 60) {
          action = "check-out";
          actionReason = "Going for lunch break (will return)";
          sessionType = "lunch_break";
          console.log(`🍽️ ${actionReason}`);
        }
        else if (isNearEndOfDay && sessionDurationMinutes > 120) {
          action = "check-out";
          actionReason = "End of work day - going home";
          sessionType = "end_of_day";
          console.log(`🏁 ${actionReason}`);
        }
        else if (isEarlyMorning && sessionDurationMinutes > 30) {
          action = "check-out";
          actionReason = "Short break/errand (will return)";
          sessionType = "short_break";
          console.log(`🚶 ${actionReason}`);
        }
        else if (sessionDurationMinutes > 240) {
          action = "check-out";
          actionReason = sessionDurationMinutes > 480 ? "End of long work day" : "Extended break";
          sessionType = sessionDurationMinutes > 480 ? "end_of_day" : "extended_break";
          console.log(`⏰ ${actionReason}`);
        }
        else {
          action = "check-out";
          actionReason = "Leaving building";
          sessionType = "leaving";
          console.log(`🔴 ${actionReason}`);
        }
      }

      // ============================================
      // EXECUTE THE ACTION
      // ============================================
      
      if (action === "check-in") {
        console.log(`🟢 EXECUTING CHECK-IN for ${matchedEmployee.name} (ID: ${matchedEmployee._id})...`);
        await markAttendance(matchedEmployee._id, matchedEmployee.name, "check-in");
        
        // Store who was just processed
        lastProcessedUserRef.current = matchedEmployee._id;
        lastProcessedTimeRef.current = Date.now();
        
        const sessionNumber = (sessionsData?.sessionCount || 0) + 1;
        
        let messageTitle = "✅ Check In Successful";
        let messageHtml = `<div class="text-center">
          <p class="text-lg font-semibold text-green-600 mb-2">${matchedEmployee.name}</p>
          <p class="text-md mb-1">Session #${sessionNumber} Started</p>
          <p class="text-sm text-gray-500">${new Date().toLocaleTimeString()}</p>`;
        
        if (sessionType === "return_from_lunch") {
          messageHtml += `<p class="text-xs text-green-500 mt-1">Welcome back from lunch!</p>`;
        } else if (sessionType === "first_checkin") {
          messageHtml += `<p class="text-xs text-blue-500 mt-1">Good morning! Have a great day.</p>`;
        }
        messageHtml += `</div>`;
        
        await Swal.fire({
          icon: "success",
          title: messageTitle,
          html: messageHtml,
          timer: 2000,
          showConfirmButton: false
        });
        
      } 
      else if (action === "check-out") {
        console.log(`🔴 EXECUTING CHECK-OUT for ${matchedEmployee.name} (ID: ${matchedEmployee._id})...`);
        await markAttendance(matchedEmployee._id, matchedEmployee.name, "check-out");
        
        lastProcessedUserRef.current = matchedEmployee._id;
        lastProcessedTimeRef.current = Date.now();
        
        const sessionNumber = sessionsData?.sessions?.length || 1;
        
        let messageTitle = "👋 Check Out Successful";
        let messageIcon = "success";
        let messageHtml = `<div class="text-center">
          <p class="text-lg font-semibold text-blue-600 mb-2">${matchedEmployee.name}</p>
          <p class="text-md mb-1">Session #${sessionNumber} Ended</p>
          <p class="text-sm text-gray-500">${new Date().toLocaleTimeString()}</p>`;
        
        if (sessionType === "lunch_break") {
          messageTitle = "🍽️ Lunch Break Started";
          messageHtml += `<p class="text-xs text-orange-500 mt-1">Please scan again when you return</p>`;
        } else if (sessionType === "end_of_day") {
          messageTitle = "🏁 End of Day";
          messageHtml += `<p class="text-xs text-green-500 mt-1">Thank you! See you tomorrow.</p>`;
        } else if (sessionType === "short_break") {
          messageTitle = "☕ Break Started";
          messageHtml += `<p class="text-xs text-purple-500 mt-1">Scan again when you return</p>`;
        }
        messageHtml += `</div>`;
        
        await Swal.fire({
          icon: messageIcon,
          title: messageTitle,
          html: messageHtml,
          timer: 2000,
          showConfirmButton: false
        });
      } else {
        console.log("ℹ️ No action taken, restarting scan...");
        setIsProcessing(false);
        setCapturing(false);
        captureLockRef.current = false;
        if (autoStart) {
          setTimeout(() => setShouldAutoRestart(true), 1000);
        }
        return;
      }

      // Reset for next person
      setIsProcessing(false);
      setCapturing(false);
      captureLockRef.current = false;
      
      // 🔴 ADD THIS: Log successful processing
      console.log(`✅ Successfully processed ${matchedEmployee.name} - ${action}`);
      
      if (autoStart) {
        console.log("🔄 Auto-restarting for next person in 2 seconds...");
        setTimeout(() => {
          resetRecognitionState();
          setShouldAutoRestart(true);
        }, 2000);
      }

    } catch (err) {
      console.error("❌ Error during capture:", err);
      setIsProcessing(false);
      captureLockRef.current = false;
      
      if (autoStart) {
        setTimeout(() => setShouldAutoRestart(true), 1000);
      }
    }
  };

  const playSuccessWithVoice = () => {
    // Play beep sound
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
      oscillator.stop(audioContext.currentTime + 0.15);
    } catch (err) {
      console.log("Beep error:", err);
    }

    // Voice - with safety checks for Fully Kiosk
    try {
      if (typeof window !== 'undefined' && window.speechSynthesis && window.SpeechSynthesisUtterance) {
        window.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance('अटेंडेंस लग गया');
        utterance.volume = 1;
        utterance.rate = 1.1;
        utterance.pitch = 1;
        utterance.lang = 'hi-IN';
        
        if (cachedVoice) {
          utterance.voice = cachedVoice;
        }
        
        // For Fully Kiosk, handle errors gracefully
        utterance.onerror = (event) => {
          console.log("Speech error (non-critical):", event);
        };
        
        window.speechSynthesis.speak(utterance);
      } else {
        console.log("Speech synthesis not available - beep only");
      }
    } catch (err) {
      console.log("Voice error (continuing with beep only):", err);
    }
  };

  // Fetch sessions periodically
  const fetchTodaySessions = async (userId) => {
    try {
      const res = await axiosInstance.get(`/factory-attendance/my-sessions/${userId}`);
      setTodaySessions(res.data.sessions);
      setActiveSession(res.data.activeSession);
    } catch (err) {
      console.error("Error fetching sessions");
    }
  };

  // In the markAttendance function
  const markAttendance = async (userId, userName, type, shiftParam = null) => {
    try {
      const userDetails = employees.find(emp => emp._id === userId);
      const isDriver = userDetails?.designation?.toLowerCase() === "driver";
      
      let shift;
      if (isDriver) {
        shift = "driver";
      } else {
        shift = shiftParam || currentShift;
      }
      
      const response = await axiosInstance.post("/factory-attendance/mark", {
        userId,
        type,
        shift,
        source: 'guard'
      });

      playSuccessWithVoice();
      addToRecentMatches(userName);
      fetchTodayStats();

      await Swal.fire({
        icon: "success",
        title: "✅ अटेंडेंस लग गया!",
        html: `
          <div class="text-center">
            <p class="text-lg font-semibold text-green-600 mb-2">${userName}</p>
            <p class="text-md mb-1">${type === "check-in" ? "✅ Check In" : "👋 Check Out"} Successful</p>
            <p class="text-sm text-gray-600">${isDriver ? 'Driver Attendance' : `Shift: ${shift === "shift1" ? "8 AM - 8:30 PM" : "8:30 PM onwards"}`}</p>
            <p class="text-sm text-gray-600">Time: ${new Date().toLocaleTimeString()}</p>
          </div>
        `,
        timer: 2000,
        showConfirmButton: false
      });

      // Reset for next person
      setCapturing(false);
      setIsProcessing(false);
      captureLockRef.current = false;
      setCameraReady(false);
      
      // Clear any existing scanning interval
      if (scanningIntervalRef.current) {
        clearInterval(scanningIntervalRef.current);
        scanningIntervalRef.current = null;
      }
      setIsScanning(false);

      // Auto-restart for next person if autoStart is enabled
      if (autoStart) {
        console.log("🔄 Will auto-restart for next person in 1.5 seconds...");
        setTimeout(() => {
          console.log("🔄 Triggering auto-restart...");
          resetRecognitionState();
          setShouldAutoRestart(true);
        }, 1500);
      } else {
        // If not autoStart, still restart scanning after a short delay
        setTimeout(() => {
          if (capturing === false && !isProcessing) {
            console.log("🔄 Restarting scanning after attendance...");
            setCapturing(true);
          }
        }, 1000);
      }

    } catch (err) {
      console.error("Error marking attendance:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.response?.data?.error || "Failed to mark attendance",
        timer: 2000,
        showConfirmButton: false
      });
      
      setCapturing(false);
      setIsProcessing(false);
      captureLockRef.current = false;
      setCameraReady(false);
    }
  };

  // Add this function to reset the system state
  const resetRecognitionState = () => {
    console.log("🔄 Resetting recognition state...");
    lastProcessedUserRef.current = null;
    lastProcessedTimeRef.current = 0;
    captureLockRef.current = false;
    setIsProcessing(false);
    
    // Clear any existing scanning interval
    if (scanningIntervalRef.current) {
      clearInterval(scanningIntervalRef.current);
      scanningIntervalRef.current = null;
    }
    setIsScanning(false);
    
    // Clear auto-capture timer
    if (autoCaptureTimerRef.current) {
      clearTimeout(autoCaptureTimerRef.current);
      autoCaptureTimerRef.current = null;
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

  const requestCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (err) {
      console.error("Camera permission denied:", err);
      return false;
    }
  };

  const handleStartRecognition = async () => {
    // This function is no longer needed but kept for compatibility
    const hasPermission = await requestCameraPermission();
    if (hasPermission) {
      setCapturing(true);
    }
  };

  // Check if user needs shift change
  const checkShiftStatus = async (userId) => {
    try {
      console.log("Checking shift status for user:", userId);
      const res = await axiosInstance.get(`/factory-attendance/check-shift-status/${userId}`);
      console.log("Shift status response:", res.data);
      
      if (res.data.needsAction) {
        const result = await Swal.fire({
          title: "⚠️ Shift Change Required",
          html: `
            <div class="text-left">
              <p class="mb-2">${res.data.message}</p>
              <p class="text-sm text-gray-600">Checked in at: ${new Date(res.data.checkInTime).toLocaleTimeString()}</p>
              <p class="text-sm text-gray-600 mt-2">Click below to complete your shift change:</p>
            </div>
          `,
          icon: "warning",
          showCancelButton: true,
          confirmButtonText: "Complete Shift Change",
          cancelButtonText: "Later",
          confirmButtonColor: "#f59e0b"
        });

        if (result.isConfirmed) {
          // Show processing message
          Swal.fire({
            title: "Processing Shift Change...",
            text: "Please wait",
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading()
          });

          // First check out from Shift 1
          await markAttendance(userId, "check-out", "shift1");
          
          // Small delay then check in for Shift 2
          setTimeout(async () => {
            await markAttendance(userId, "check-in", "shift2");
            Swal.close();
            setCapturing(false);
            setIsProcessing(false);
            captureLockRef.current = false;
          }, 500);
        }
        return true;
      }
      return false;
    } catch (err) {
      console.error("Error checking shift status:", err);
      return false;
    }
  };

  // Add this function to show who was recently processed
  const addToRecentMatches = (employeeName) => {
    setRecentMatches(prev => {
      const newMatches = [employeeName, ...prev].slice(0, 3);
      return newMatches;
    });
    setTimeout(() => {
      setRecentMatches(prev => prev.filter(name => name !== employeeName));
    }, 5000);
  };

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

            {/* Session History */}
            {todaySessions.filter(s => s.checkOutTime).length > 0 && (
              <div className="mt-2 text-xs text-gray-500">
                Completed sessions: {todaySessions.filter(s => s.checkOutTime).length}
              </div>
            )}
          </motion.div>

          {!capturing ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl shadow-xl p-8 text-center"
            >
              {autoStarting ? (
                <div className="py-12">
                  <Loader className="w-16 h-16 text-blue-600 animate-spin mx-auto mb-6" />
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">Starting Camera...</h3>
                  <p className="text-gray-600">Please wait while we prepare the camera</p>
                </div>
              ) : (
                <>
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
                    onClick={() => {
                      console.log("🖱️ Manual button clicked - capturing:", capturing, "isReady:", isReady, "loading:", loading, "locked:", captureLockRef.current);
                      if (!capturing && isReady && !loading && !captureLockRef.current) {
                        console.log("🎯 Manual trigger - setting capturing to true");
                        setCapturing(true);
                      } else {
                        console.log("❌ Manual trigger blocked - conditions not met");
                      }
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="bg-blue-600 text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-lg hover:bg-blue-700 transition-all flex items-center gap-2 mx-auto"
                    disabled={!isReady || loading}
                  >
                    <Zap className="w-5 h-5" />
                    {loading ? "Loading..." : !isReady ? "No Employees" : "Manual Start"}
                  </motion.button>
                </>
              )}
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
                    width: { ideal: 480 },
                    height: { ideal: 360 },
                    aspectRatio: { ideal: 4/3 }
                  }}
                  onUserMedia={() => {
                    console.log("Camera started successfully");
                    if (webcamRef.current && webcamRef.current.video) {
                      webcamRef.current.video.style.transform = 'scaleX(-1)';
                      const stream = webcamRef.current.video.srcObject;
                      if (stream) {
                        const track = stream.getVideoTracks()[0];
                        if (track && track.getCapabilities) {
                          try {
                            track.applyConstraints({
                              width: { ideal: 640 },
                              height: { ideal: 480 },
                              frameRate: { ideal: 30 }
                            }).catch(e => console.log("Could not set higher resolution"));
                          } catch(e) { console.log("Could not set constraints"); }
                        }
                      }
                    }
                    // Wait longer for camera to stabilize (1 second instead of 200ms)
                    setTimeout(() => {
                      setCameraReady(true);
                      console.log("✅ Camera fully ready, can now take screenshots");
                    }, 1000);
                  }}
                  onUserMediaError={(err) => {
                    console.error("Camera error:", err);
                    setCameraReady(false);
                    setCapturing(false);
                    
                    let errorMsg = "Could not access camera. ";
                    
                    if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
                      errorMsg += "Please allow camera access in your browser settings.";
                    } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
                      errorMsg += "No camera found on this device.";
                    } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
                      errorMsg += "Camera is already in use by another app.";
                    } else {
                      errorMsg += "Please check your camera and try again.";
                    }
                    
                    Swal.fire({
                      icon: "error",
                      title: "Camera Error",
                      text: errorMsg,
                      confirmButtonColor: "#2563eb"
                    });
                  }}
                  mirrored={true}
                />
                
                {/* Face overlay guide */}
                <div className="absolute inset-0 border-4 border-blue-400 border-dashed rounded-xl pointer-events-none"></div>
                <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-1 rounded-lg text-sm">
                  Position face in center
                </div>
                
                {/* Scanning indicator */}
                {isScanning && (
                  <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-3 py-1 rounded-full text-xs animate-pulse shadow-lg z-10">
                    🔍 Scanning for faces...
                  </div>
                )}
              </div>

              <div className="flex justify-between mt-6">
                <button
                  onClick={() => setCapturing(false)}
                  className="px-6 py-3 bg-gray-200 rounded-xl font-medium hover:bg-gray-300 transition"
                  disabled={isProcessing}
                >
                  Cancel
                </button>
                
                <div className="text-sm text-gray-500 flex items-center">
                  {isProcessing ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin mr-2" />
                      Processing...
                    </>
                  ) : isScanning ? (
                    <>
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
                      Auto-detecting...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 text-green-500 mr-1" />
                      Ready - Waiting for face
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Recent matches indicator - shows who was just processed */}
          {recentMatches.length > 0 && (
            <div className="absolute bottom-4 left-4 right-4 bg-black/70 text-white p-2 rounded-lg text-center">
              <p className="text-sm">✓ Recently marked: {recentMatches.join(" → ")}</p>
            </div>
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