import { useEffect, useRef, useState } from "react";
import { useNavigate, NavLink, useLocation } from "react-router-dom";
import axiosInstance from "../axiosInstance";
import InternalNavbar from "../components/InternalNavbar";
import "../index.css";
import AssistantInvitationForm from "../components/AssistantInvitationForm";
import DocumentNotifications from "../components/DocumentNotifications";
import VehicleDocumentsView from "../components/VehicleDocumentsView";
import Swal from "sweetalert2";
import { motion, AnimatePresence } from "framer-motion";
import IncomingPaymentForm from "./IncomingPaymentForm";
import ProductCustomerSearch from "../components/ProductCustomerSearch";
import NotificationBell from "../components/NotificationBell";
import AttendanceNotification from "../components/AttendanceNotification";
import DailyTodoList from "../components/DailyTodoList";
import { Calendar } from "lucide-react"; // Add Calendar icon to existing imports
import UserGoogleCalendar from "../components/UserGoogleCalendar";
import TaskAssignmentModal from "../components/TaskAssignmentModal";
import ViewAllUsersModal from "../components/ViewAllUsersModal";
import ProductRateChecker from "../components/calculateProductPrice";
import ProductRateTable from "../components/ProductRateTable";


export default function Dashboard() {
 // Helper function to parse roles properly
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

  const navigate = useNavigate();
  const location = useLocation();
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showDocs, setShowDocs] = useState(false);
  // Add these missing state variables near your other useState declarations
const [showSearchResults, setShowSearchResults] = useState(false);
const [searchResults, setSearchResults] = useState([]);
const [searchLoading, setSearchLoading] = useState(false);
  const [showProfilePanel, setShowProfilePanel] = useState(false);
  const [showDocNotifications, setShowDocNotifications] = useState(false);
  const [user, setUser] = useState(null);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [invitationLink, setInvitationLink] = useState(null);
  const [expiringFactoryCertificates, setExpiringFactoryCertificates] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [driverVehicle, setDriverVehicle] = useState(null);
  const [showAllUsersModal, setShowAllUsersModal] = useState(false);
  const [docNotifCount, setDocNotifCount] = useState(0);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showTaskAssignment, setShowTaskAssignment] = useState(false);
  // Add this new state variable with your other useState declarations
const [birthdayUsers, setBirthdayUsers] = useState([]);
const [showConfetti, setShowConfetti] = useState(false);
const [expiringCertificates, setExpiringCertificates] = useState([]);
const [showProductRates, setShowProductRates] = useState(false);
// Add these new state variables
const [expiringAirReceiverCertificates, setExpiringAirReceiverCertificates] = useState([]);
const [expiringManualChainPullyCertificates, setExpiringManualChainPullyCertificates] = useState([]);
const [expiringAirPollutionCertificates, setExpiringAirPollutionCertificates] = useState([]);
const [expiringWaterPollutionCertificates, setExpiringWaterPollutionCertificates] = useState([]);
// Add this state with your other useState declarations (around line 20-30)
const [hasShownBirthday, setHasShownBirthday] = useState(() => {
  // Check localStorage for today's date
  const lastShownDate = localStorage.getItem('birthdayShownDate');
  const today = new Date().toDateString();
  return lastShownDate === today;
});
  // Add these refs near your other state declarations
const profileButtonRef = useRef(null);
const profilePanelRef = useRef(null);
const docNotificationsRef = useRef(null);
    // ✅ ADD THIS LINE - Declare userRoles at component level
  const userRoles = user ? parseUserRoles(user) : [];

  // Animation variants
  const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut",
      },
    },
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const cardHover = {
    hover: {
      y: -8,
      scale: 1.02,
      boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
      transition: {
        duration: 0.3,
        ease: "easeInOut",
      },
    },
  };

  const buttonHover = {
    hover: {
      scale: 1.05,
      transition: {
        duration: 0.2,
        ease: "easeInOut",
      },
    },
    tap: {
      scale: 0.95,
    },
  };

useEffect(() => {
  // ✅ Fix: Add null check
  if (!user) return;
  if (!userRoles.includes("driver")) return;
  
  const token = localStorage.getItem("token");
  const fetchVehicle = async () => {
    try {
      const res = await axiosInstance.get("/vehicles/all", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const vehicle = res.data.find((v) => v.driverEmail === user.email);
      setDriverVehicle(vehicle);
    } catch (err) {
      console.error("❌ Failed to fetch driver vehicle", err);
    }
  };
  fetchVehicle();
}, [user,userRoles]);

// Fetch ALL expiring certificates in one API call
useEffect(() => {
  if (!user) return;
  
  const fetchAllExpiringCertificates = async () => {
    try {
      // Create a single combined API call
      const res = await axiosInstance.get("/certificates/expiring/all");
      if (res.data) {
        setExpiringCertificates(res.data.boiler || []);
        setExpiringFactoryCertificates(res.data.factory || []);
        setExpiringAirReceiverCertificates(res.data.airReceiver || []);
        setExpiringManualChainPullyCertificates(res.data.manualChain || []);
        setExpiringAirPollutionCertificates(res.data.airPollution || []);
        setExpiringWaterPollutionCertificates(res.data.waterPollution || []);
      }
    } catch (err) {
      console.error("Error fetching expiring certificates:", err);
    }
  };
  
  fetchAllExpiringCertificates();
}, [user]);


// Enhanced useEffect to fetch birthday users with localStorage tracking
useEffect(() => {
  if (!user) return;
  
  // Skip if already shown today
  const today = new Date().toDateString();
  const lastShownDate = localStorage.getItem('birthdayShownDate');
  if (lastShownDate === today) return;
  
  const fetchBirthdays = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axiosInstance.get("/users/todays-birthdays", {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (res.data && res.data.length > 0) {
        setBirthdayUsers(res.data);
        
        // Auto-show confetti if it's the current user's birthday
        const isMyBirthday = res.data.some(birthdayUser => birthdayUser._id === user?._id);
        if (isMyBirthday) {
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 5000);
        }
      }
    } catch (err) {
      console.error("Failed to fetch birthdays", err);
    }
  };
  
  fetchBirthdays();
}, [user]);

useEffect(() => {
  // ✅ Fix: Add null check
  if (!user) return;
  if (!userRoles.includes("accounts")) return;
  
  const token = localStorage.getItem("token");
  const fetchDocNotifCount = async () => {
    try {
      const res = await axiosInstance.get(
        `/vehicle-documents/notifications/expiring`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setDocNotifCount(res.data.length || 0);
    } catch (err) {
      console.error("Failed to fetch document notifications count", err);
    }
  };
  fetchDocNotifCount();
}, [user,userRoles]);



  useEffect(() => {
    if (!user) return;
    const fetchNotifications = async () => {
      try {
        const res = await axiosInstance.get(
          `/notifications/${user._id}?page=${page}&limit=5`
        );
        setNotifications(res.data.notifications || []);
        setTotalPages(res.data.totalPages || 1);
      } catch (err) {
        console.error("Error fetching notifications:", err);
      }
    };
    fetchNotifications();
  }, [user, page]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    const fetchUser = async () => {
      try {
        const res = await axiosInstance.get("/users/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(res.data);
         // Store user ID in localStorage for notification filtering
      if (res.data._id) {
        localStorage.setItem('userId', res.data._id);
      }
      
        setLoading(false);
      } catch (err) {
        console.error(
          "Failed to fetch user",
          err?.response ? err.response.data : err.message
        );
        localStorage.removeItem("token");
        navigate("/login");
      }
    };
    fetchUser();
  }, [navigate]);

// Add click outside functionality
useEffect(() => {
  const handleClickOutside = (event) => {
    // Close profile panel if clicked outside (only if doc notifications is not open)
    if (showProfilePanel && !showDocNotifications) {
      if (profilePanelRef.current && 
          !profilePanelRef.current.contains(event.target) && 
          profileButtonRef.current && 
          !profileButtonRef.current.contains(event.target)) {
        setShowProfilePanel(false);
      }
    }

    // Close document notifications if clicked outside
    if (showDocNotifications) {
      if (docNotificationsRef.current && 
          !docNotificationsRef.current.contains(event.target)) {
        setShowDocNotifications(false);
      }
    }
  };

  document.addEventListener('mousedown', handleClickOutside);
  return () => {
    document.removeEventListener('mousedown', handleClickOutside);
  };
}, [showProfilePanel, showDocNotifications]);

  const handleSearch = async (query) => {
    if (!query.trim()) {
      setShowSearchResults(false);
      return;
    }

    setSearchLoading(true);
    try {
      const [purchaseRes, salesRes] = await Promise.all([
        axiosInstance.get(`/purchase-products?search=${query}&limit=5`),
        axiosInstance.get(`/products-multer/dashboard-fast?search=${query}&limit=5`),

      ]);

      const purchaseProducts = purchaseRes.data.data || [];
      const salesProducts = salesRes.data.products || [];

      const results = [
        ...purchaseProducts.map((p) => ({
          ...p,
          type: "purchase",
          id: p._id,
          name: p.name,
          unit: p.unit,
          price: p.price,
        })),
        ...salesProducts.map((p) => ({
          ...p,
          type: "sales",
          id: p._id,
          name: p.name,
          unit: p.unit,
          price: p.price,
        })),
      ];

      setSearchResults(results);
      setShowSearchResults(true);
    } catch (err) {
      console.error("Search error:", err);
      Swal.fire({
        title: "Search Error",
        text: "Failed to search products",
        icon: "error",
        confirmButtonColor: "#2563eb",
        background: "#f8fafc",
        customClass: {
          popup: "rounded-2xl",
        },
      });
    } finally {
      setSearchLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white">
        <motion.div
          className="flex flex-col items-center gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <motion.p
            className="text-blue-700 font-semibold text-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Preparing your dashboard...
          </motion.p>
        </motion.div>
      </div>
    );
  }

  const unreadCount = notifications.filter((n) => !n.read).length;
  const followUps = notifications.filter((n) =>
    n.message?.toLowerCase()?.includes("follow-up")
  );

  const DashboardSection = ({ children, className = "" }) => (
    <motion.section
      className={`mb-8 ${className}`}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      variants={staggerContainer}
    >
      {children}
    </motion.section>
  );

const DashboardCard = ({ children, className = "", variants = fadeInUp }) => (
  <motion.div
    className={`glass-card glass-card-hover p-6 ${className}`}
    variants={variants}
    whileHover="hover"
  >
    {children}
  </motion.div>
);


  const ActionButton = ({
    to,
    onClick,
    children,
    className = "",
    icon,
    variant = "primary",
  }) => {
   const variants = {
  primary: "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700",
  success: "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700",
  warning: "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700",
  danger: "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700",
  indigo: "bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700",
  purple: "bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700",
  pink: "bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700",
  
  // Additional colors
  teal: "bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700",
  cyan: "bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700",
  emerald: "bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700",
  lime: "bg-gradient-to-r from-lime-500 to-lime-600 hover:from-lime-600 hover:to-lime-700",
  orange: "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700",
  rose: "bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700",
  fuchsia: "bg-gradient-to-r from-fuchsia-500 to-fuchsia-600 hover:from-fuchsia-600 hover:to-fuchsia-700",
  violet: "bg-gradient-to-r from-violet-500 to-violet-600 hover:from-violet-600 hover:to-violet-700",
  
  // Cool gradients
  ocean: "bg-gradient-to-r from-blue-400 to-cyan-500 hover:from-blue-500 hover:to-cyan-600",
  sunset: "bg-gradient-to-r from-orange-400 to-pink-500 hover:from-orange-500 hover:to-pink-600",
  forest: "bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600",
  royal: "bg-gradient-to-r from-purple-400 to-indigo-500 hover:from-purple-500 hover:to-indigo-600",
  berry: "bg-gradient-to-r from-pink-400 to-rose-500 hover:from-pink-500 hover:to-rose-600",
  
  // Dark variants
  dark: "bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-800 hover:to-gray-900",
  midnight: "bg-gradient-to-r from-blue-900 to-indigo-900 hover:from-blue-800 hover:to-indigo-800",
  
  // Light variants
  light: "bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-800",
  sky: "bg-gradient-to-r from-blue-100 to-cyan-100 hover:from-blue-200 hover:to-cyan-200 text-gray-800",
};
    const buttonContent = (
      <motion.button
        className={`w-full text-white p-6 rounded-2xl shadow-lg transition-all duration-300 group ${variants[variant]} ${className}`}
        whileHover="hover"
        whileTap="tap"
        variants={buttonHover}
        onClick={onClick}
      >
        <div className="flex flex-col items-center text-center">
          {icon && (
            <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">
              {icon}
            </div>
          )}
          {children}
        </div>
      </motion.button>
    );

    if (to) {
      return <NavLink to={to}>{buttonContent}</NavLink>;
    }

    return buttonContent;
  };

// Advanced Happy Birthday Notification Component - Professional Design
const BirthdayNotification = ({ birthdayUsers, onClose, currentUser }) => {
  const [showConfetti, setShowConfetti] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  
  if (!birthdayUsers || birthdayUsers.length === 0) return null;
  
  // ✅ FIX: Check if current user is the one having birthday - use email comparison as fallback
  const isMyBirthday = birthdayUsers.some(birthdayUser => {
    // Compare by ID if both exist
    if (currentUser?._id && birthdayUser._id) {
      return currentUser._id === birthdayUser._id;
    }
    // Fallback to email comparison
    if (currentUser?.email && birthdayUser.email) {
      return currentUser.email === birthdayUser.email;
    }
    return false;
  });
  
  // Auto-rotate between multiple birthday people
  useEffect(() => {
    if (birthdayUsers.length > 1) {
      const interval = setInterval(() => {
        setActiveIndex((prev) => (prev + 1) % birthdayUsers.length);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [birthdayUsers.length]);
  
  // Stop confetti after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowConfetti(false);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);
  
  const currentPerson = birthdayUsers[activeIndex];
  
  return (
    <>
      {/* Full Page Overlay - Subtle Gradient */}
      <motion.div
        className="fixed inset-0 z-[100] flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.6 }}
        style={{
          background: 'radial-gradient(circle at center, rgba(251, 113, 133, 0.15) 0%, rgba(244, 114, 182, 0.08) 50%, rgba(139, 92, 246, 0.05) 100%)',
          backdropFilter: 'blur(20px)'
        }}
      >
        {/* Animated Floating Particles - Subtle */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(30)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 rounded-full"
              style={{
                background: `linear-gradient(135deg, rgba(251, 113, 133, 0.3), rgba(244, 114, 182, 0.2))`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`
              }}
              animate={{
                y: [0, -30, 0],
                x: [0, Math.random() * 20 - 10, 0],
                opacity: [0, 0.5, 0]
              }}
              transition={{
                duration: 4 + Math.random() * 3,
                delay: Math.random() * 5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>
        
        {/* Main Content Card - Glass Morphism */}
        <motion.div
          className="relative z-10 max-w-2xl w-full mx-6"
          initial={{ scale: 0.95, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ 
            type: "spring",
            damping: 25,
            stiffness: 200,
            delay: 0.2
          }}
        >
         <div className="glass-card relative overflow-hidden border-white/30 shadow-2xl">
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-white/40 transition-all duration-300"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            {/* Content */}
            <div className="p-8 md:p-10 text-center">
              {/* Animated Icon */}
              <motion.div
                className="relative inline-block mb-6"
                animate={{ 
                  y: [0, -8, 0],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ 
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <div className="text-7xl md:text-8xl relative">
                  🎂
                  <motion.div
                    className="absolute -top-2 -right-2 text-2xl"
                    animate={{ 
                      scale: [1, 1.2, 1],
                      rotate: [0, 10, -10, 0]
                    }}
                    transition={{ 
                      duration: 1,
                      repeat: Infinity,
                      repeatDelay: 2
                    }}
                  >
                    ✨
                  </motion.div>
                </div>
              </motion.div>
              
              {/* Greeting Text - Gradient */}
              <motion.h1
                className="text-3xl md:text-5xl font-bold mb-3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                style={{
                  background: 'linear-gradient(135deg, #f43f5e 0%, #ec489a 50%, #a855f7 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}
              >
                {isMyBirthday ? "Happy Birthday! 🎉" : "Birthday Celebration! 🎊"}
              </motion.h1>
              
              {/* Birthday Person Spotlight */}
              <motion.div
                className="mb-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                {birthdayUsers.length === 1 ? (
                  <div className="inline-flex items-center gap-3 bg-gradient-to-r from-rose-50 to-pink-50 rounded-2xl px-6 py-3 shadow-sm border border-rose-100">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center text-2xl shadow-lg">
                      🎁
                    </div>
                    <div className="text-left">
                      <p className="text-sm text-gray-500">Celebrating today</p>
                      <p className="text-xl font-semibold text-gray-800">{birthdayUsers[0].name}</p>
                      {birthdayUsers[0].designation && (
                        <p className="text-xs text-gray-500">{birthdayUsers[0].designation}</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-gray-600 text-sm">Today we're celebrating:</p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {birthdayUsers.map((person, idx) => (
                        <motion.div
                          key={person._id}
                          className={`px-4 py-2 rounded-full transition-all duration-300 ${
                            idx === activeIndex 
                              ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-lg scale-105' 
                              : 'bg-gray-100 text-gray-600'
                          }`}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.5 + idx * 0.1 }}
                        >
                          <span className="text-sm font-medium">{person.name}</span>
                        </motion.div>
                      ))}
                    </div>
                    {birthdayUsers.length > 1 && (
                      <div className="mt-3">
                        <div className="bg-gradient-to-r from-rose-500 to-pink-500 rounded-xl p-4 shadow-lg">
                          <p className="text-white text-lg font-semibold">
                            {currentPerson?.name}
                          </p>
                          {currentPerson?.designation && (
                            <p className="text-white/80 text-sm mt-1">{currentPerson.designation}</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
              
              {/* Birthday Message */}
              <motion.div
                className="mb-8 p-5 rounded-2xl bg-gradient-to-r from-rose-50/50 to-pink-50/50 border border-rose-100/50"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <p className="text-gray-700 text-base md:text-lg leading-relaxed">
                  {isMyBirthday 
                    ? "🎁 May your day be filled with joy, laughter, and wonderful surprises! Here's to another amazing year! 🎁"
                    : `🎈 Join us in wishing ${birthdayUsers.length === 1 ? birthdayUsers[0].name : 'our team members'} a fantastic birthday! Let's make their day special! 🎈`
                  }
                </p>
              </motion.div>
              
              {/* Celebration Actions */}
              <motion.div
                className="flex flex-col sm:flex-row gap-3 justify-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                <motion.button
                  onClick={() => {
                    setShowConfetti(true);
                    setTimeout(() => setShowConfetti(false), 5000);
                  }}
                  className="group px-6 py-2.5 rounded-xl font-medium transition-all duration-300 relative overflow-hidden"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    background: 'linear-gradient(135deg, #f43f5e 0%, #ec489a 100%)',
                    boxShadow: '0 4px 15px rgba(244, 63, 94, 0.3)'
                  }}
                >
                  <span className="relative z-10 text-white flex items-center gap-2">
                    <span>🎉</span>
                    Celebrate Again
                  </span>
                </motion.button>
                
                <motion.button
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl font-medium transition-all duration-300 bg-white/80 backdrop-blur-sm text-gray-700 hover:bg-white border border-gray-200"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Close
                </motion.button>
              </motion.div>
            </div>
            
            {/* Subtle Decorative Elements */}
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-rose-200 to-transparent" />
          </div>
        </motion.div>
      </motion.div>
      
      {/* Elegant Confetti Effect */}
      {showConfetti && typeof window !== 'undefined' && (
        <div className="fixed inset-0 pointer-events-none z-[200]">
          {[...Array(80)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute"
              style={{
                width: `${4 + Math.random() * 6}px`,
                height: `${4 + Math.random() * 6}px`,
                background: `linear-gradient(135deg, 
                  hsl(${Math.random() * 60 + 330}, 70%, 60%),
                  hsl(${Math.random() * 60 + 330}, 70%, 50%))`,
                borderRadius: Math.random() > 0.5 ? '50%' : '2px',
                left: `${Math.random() * 100}%`,
                top: '-20px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
              animate={{
                y: window.innerHeight + 100,
                x: `calc(${Math.random() * 200 - 100}px)`,
                rotate: Math.random() * 720,
                opacity: [1, 1, 0]
              }}
              transition={{
                duration: 1.5 + Math.random() * 1.5,
                delay: Math.random() * 0.3,
                ease: "easeOut"
              }}
            />
          ))}
        </div>
      )}
    </>
  );
};

  return (
 <>
<BirthdayNotification 
  birthdayUsers={birthdayUsers} 
  currentUser={user}
  onClose={() => {
    const today = new Date().toDateString();
    localStorage.setItem('birthdayShownDate', today);
    setBirthdayUsers([]);
  }}
/>
      <InternalNavbar />

  {/* Compact Profile Button */}
  <div className="fixed top-47 left-4 z-50">
<motion.button
  ref={profileButtonRef}
  onClick={() => setShowProfilePanel(!showProfilePanel)}
  className="glass relative rounded-full p-3 group"
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
>
      <div className="flex items-center gap-3">
        {/* Profile Picture */}
        {user?.profilePicture ? (
          <img
            src={user.profilePicture}
            alt="Profile"
            className="w-10 h-10 rounded-full object-cover border-2 border-blue-200"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center border-2 border-blue-200">
            <span className="text-white font-bold text-sm">
              {user?.name?.charAt(0)?.toUpperCase()}
            </span>
          </div>
        )}
        
        {/* Notification Badges */}
        {/* <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <motion.span
              className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
            >
              {unreadCount}
            </motion.span>
          )}
          {docNotifCount > 0 && userRoles.includes("accounts") && (
            <motion.span
              className="bg-amber-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
            >
              {docNotifCount}
            </motion.span>
          )}
        </div> */}
      </div>
    </motion.button>

{/* Profile Panel */}
<AnimatePresence>
  {showProfilePanel && (
 <motion.div
  ref={profilePanelRef}
  className="glass absolute top-16 left-0 rounded-2xl p-6 min-w-80 max-w-md z-50 mobile:left-4 mobile:right-4 mobile:max-w-none"
  initial={{ opacity: 0, y: -10, scale: 0.95 }}
  animate={{ opacity: 1, y: 0, scale: 1 }}
  exit={{ opacity: 0, y: -10, scale: 0.95 }}
  transition={{ duration: 0.2 }}
>
      {/* Profile Header */}
      <div className="flex items-center gap-4 mb-6">
        {user?.profilePicture ? (
          <img
            src={user.profilePicture}
            alt="Profile"
            className="w-16 h-16 rounded-full object-cover border-2 border-blue-200"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center border-2 border-blue-200">
            <span className="text-white font-bold text-xl">
              {user?.name?.charAt(0)?.toUpperCase()}
            </span>
          </div>
        )}
        <div className="flex-1">
          <h3 className="font-bold text-gray-900 text-lg">{user?.name}</h3>
          <p className="text-gray-600 text-[8px]">{user?.email}</p>
          {!(userRoles.includes("suppliers") || userRoles.includes("viewer")) && (
            <span className="inline-block bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-medium mt-1">
              {parseUserRoles(user)
                .map((role) => role.charAt(0).toUpperCase() + role.slice(1))
                .join(", ")}
            </span>
          )}
        </div>
      </div>

      {/* Visiting Card */}
      {user?.visitingCard && (
        <motion.button
          onClick={() =>
          Swal.fire({
  title: "Your Visiting Card",
  imageUrl: user.visitingCard,
  imageAlt: "Visiting Card",
  confirmButtonText: "Close",
  confirmButtonColor: "#2563eb",
  width: "auto",
  background: "rgba(255, 255, 255, 0.85)",
  backdrop: "rgba(0, 0, 0, 0.05)",
  customClass: {
    popup: "rounded-2xl backdrop-blur-xl glass",
  },
})
          }
          className="w-full bg-blue-600 text-white px-4 py-3 rounded-xl font-semibold shadow-lg hover:bg-blue-700 transition-all duration-300 flex items-center justify-center gap-2 mb-4"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <span>📇</span>
          View Visiting Card
        </motion.button>
      )}

      {/* Attendance Banner (if allowed) */}
      {user?.allowAttendance && (
        <motion.div
          className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-xl mb-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-sm">📋 Mark Attendance</p>
              <p className="text-blue-100 text-xs">Daily check-in</p>
            </div>
            <motion.button
              onClick={() => navigate("/attendance")}
              className="bg-white text-blue-600 px-3 py-1 rounded-lg font-semibold text-sm hover:bg-gray-100 transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Go
            </motion.button>
          </div>
        </motion.div>
      )}
    </motion.div>
  )}
</AnimatePresence>
  </div>

{/* Document Notifications Panel */}
{showDocNotifications && (
<motion.div
  ref={docNotificationsRef}
  className="glass fixed top-65 left-4 z-40 max-w-md w-full rounded-2xl overflow-hidden max-h-[80vh] overflow-y-auto"
  initial={{ opacity: 0, y: -20, scale: 0.95 }}
  animate={{ opacity: 1, y: 0, scale: 1 }}
  exit={{ opacity: 0, y: -20, scale: 0.95 }}
  style={{ position: 'fixed' }}
>
    <DocumentNotifications setDocNotifCount={setDocNotifCount} />
  </motion.div>
)}
               <ProductCustomerSearch />

      <div className="flex justify-center items-center gap-4 md:mt-5 mt-1">


{/* Document Alerts Button - Top Center */}
{userRoles.includes("accounts") && docNotifCount > 0 && (
  <div className="flex justify-center">
<motion.button
  onClick={() => {
    setShowDocNotifications((prev) => !prev);
    setShowProfilePanel(false);
  }}
  className="glass-btn px-4 py-3 rounded-xl font-medium flex items-center justify-between"
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
  initial={{ opacity: 0, y: -10 }}
  animate={{ opacity: 1, y: 0 }}
>
      <div className="flex items-center gap-3">
        <div className="text-xl">📋</div>
        <span className="font-semibold text-xs">Document Alerts</span>
      </div>
      <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full ml-3">
        {docNotifCount}
      </span>
    </motion.button>
  </div>
)}

{/* Follow-up Reminders Button - Fixed Position */}
{followUps.length > 0 && (
 <motion.button
  onClick={() => {
    // Show follow-ups in a modal with links
    const followUpContent = followUps.slice(0, 5).map((note, idx) => {
      // Check if note has a link (e.g., sales order link)
      let linkText = note.message;
      let linkUrl = "#";
      
      // Extract link from message if available (you can customize this based on your notification structure)
      if (note.link) {
        linkUrl = note.link;
      } else if (note.message?.includes("Sales Order")) {
        // Example: Extract sales order ID from message
        const orderMatch = note.message.match(/Sales Order\s*[:#]?\s*(\w+)/i);
        if (orderMatch) {
          linkUrl = `/orders/${orderMatch[1]}`;
        }
      }
      
      return `
        <div class="flex items-start gap-2 mb-2 p-2 hover:bg-white/30 rounded-lg transition-all">
          <div class="w-1.5 h-1.5 bg-amber-400 rounded-full mt-1.5 flex-shrink-0"></div>
          <a href="${linkUrl}" class="flex-1 text-sm text-gray-700 hover:text-blue-600 hover:underline" 
             onclick="event.preventDefault(); window.location.href='${linkUrl}'">
            ${linkText}
          </a>
        </div>
      `;
    }).join('');

    Swal.fire({
      title: "🔔 Follow-up Reminders",
      html: `
        <div class="text-left max-h-60 overflow-y-auto">
          <p class="mb-3 text-gray-600">You have <strong class="text-amber-600">${followUps.length}</strong> follow-up reminders:</p>
          <div class="space-y-1">
            ${followUpContent}
          </div>
          ${followUps.length > 5 ? 
            `<p class="mt-3 text-sm text-gray-500 text-center">
              +${followUps.length - 5} more reminders
            </p>` : 
            ''
          }
        </div>
      `,
      icon: "info",
      confirmButtonText: "Close",
      showCancelButton: true,
      cancelButtonText: "View All Notifications",
      confirmButtonColor: "#2563eb",
      cancelButtonColor: "#6b7280",
      background: "rgba(255, 255, 255, 0.85)",
      backdrop: "rgba(0, 0, 0, 0.1)",
      customClass: {
        popup: "rounded-2xl backdrop-blur-xl",
        confirmButton: "px-4 py-2",
        cancelButton: "px-4 py-2"
      },
    }).then((result) => {
      if (result.dismiss === Swal.DismissReason.cancel) {
        navigate("/my-tasks"); // Or your notifications page
      }
    });
  }}
  className="glass-btn px-4 py-3 rounded-xl font-medium flex items-center justify-between border-l-4 border-amber-400"
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
  initial={{ opacity: 0, y: -10 }}
  animate={{ opacity: 1, y: 0 }}
>
    <div className="flex items-center gap-3">
      <div className="text-xl">🔔</div>
      <span className="font-semibold text-xs text-amber-900">Follow-up Reminders</span>
    </div>
    <span className="bg-amber-500 text-white text-xs font-bold px-2 py-1 rounded-full ml-3">
      {followUps.length}
    </span>
  </motion.button>
)}
<NotificationBell />
</div>
<div className="flex items-center justify-center gap-2">
{userRoles.includes("accounts") &&
      <div className="flex justify-center items-center gap-4 md:mt-5 mt-1">
 {user?.allowAttendance && <AttendanceNotification />}
</div>}
{/* Calendar Button - Top Right */}
<motion.button
  onClick={() => setShowCalendar(true)}
  className="glass-btn rounded-lg p-2 md:mt-4.5 mt-1"
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
  title="View Task Calendar"
>
    <Calendar className="w-5 h-5 text-blue-600" />
  </motion.button>

{/* Calendar Modal */}
<UserGoogleCalendar 
  isOpen={showCalendar} 
  onClose={() => setShowCalendar(false)}
  user={user}
/>
</div>
{/* Collapsible Daily Todo List */}
<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
  <DailyTodoList userId={user?._id} />
  {/* Boiler Certificate Expiry Alert */}
{expiringCertificates.length > 0 && (
  <motion.div
    className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4"
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
  >
    <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded shadow">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <p className="text-sm text-orange-700">
            <strong>⚠️ Boiler Certificate Expiry Alert</strong>
          </p>
          <p className="text-xs text-orange-600 mt-1">
            {expiringCertificates.length} certificate{expiringCertificates.length > 1 ? 's are' : ' is'} expiring soon:
          </p>
          <ul className="mt-2 space-y-1">
            {expiringCertificates.map(cert => (
              <li key={cert._id} className="text-xs text-orange-600">
                • Expires on {new Date(cert.expiryDate).toLocaleDateString('en-GB')} 
                ({cert.daysUntilExpiry} days remaining)
              </li>
            ))}
          </ul>
          <button
            onClick={() => navigate("/maintenance/boiler-certificate")}
            className="mt-2 text-xs text-orange-700 font-semibold hover:text-orange-800 underline"
          >
            Go to Certificate Management →
          </button>
        </div>
        <button
          onClick={() => setExpiringCertificates([])}
          className="flex-shrink-0 text-orange-400 hover:text-orange-500"
        >
          ✕
        </button>
      </div>
    </div>
  </motion.div>
)}
{/* Factory Act Certificate Expiry Alert */}
{expiringFactoryCertificates.length > 0 && (
  <motion.div
    className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4"
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
  >
    <div className="bg-indigo-50 border-l-4 border-indigo-500 p-4 rounded shadow">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-indigo-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <p className="text-sm text-indigo-700">
            <strong>📋 Factory Act Certificate Expiry Alert</strong>
          </p>
          <p className="text-xs text-indigo-600 mt-1">
            {expiringFactoryCertificates.length} certificate{expiringFactoryCertificates.length > 1 ? 's are' : ' is'} expiring soon:
          </p>
          <ul className="mt-2 space-y-1">
            {expiringFactoryCertificates.map(cert => (
              <li key={cert._id} className="text-xs text-indigo-600">
                • {cert.certificateName} - Expires on {new Date(cert.expiryDate).toLocaleDateString('en-GB')} 
                ({cert.daysUntilExpiry} days remaining)
              </li>
            ))}
          </ul>
          <button
            onClick={() => navigate("/factory-act/certificates")}
            className="mt-2 text-xs text-indigo-700 font-semibold hover:text-indigo-800 underline"
          >
            Go to Certificate Management →
          </button>
        </div>
        <button
          onClick={() => setExpiringFactoryCertificates([])}
          className="flex-shrink-0 text-indigo-400 hover:text-indigo-500"
        >
          ✕
        </button>
      </div>
    </div>
  </motion.div>
)}
{/* Air Receiver Certificate Expiry Alert */}
{expiringAirReceiverCertificates.length > 0 && (
  <motion.div
    className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4"
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
  >
    <div className="bg-cyan-50 border-l-4 border-cyan-500 p-4 rounded shadow">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-cyan-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <p className="text-sm text-cyan-700">
            <strong>⚠️ Air Receiver Tank Certificate Expiry Alert</strong>
          </p>
          <p className="text-xs text-cyan-600 mt-1">
            {expiringAirReceiverCertificates.length} certificate{expiringAirReceiverCertificates.length > 1 ? 's are' : ' is'} expiring soon:
          </p>
          <ul className="mt-2 space-y-1">
            {expiringAirReceiverCertificates.map(cert => (
              <li key={cert._id} className="text-xs text-cyan-600">
                • Expires on {new Date(cert.expiryDate).toLocaleDateString('en-GB')} 
                ({cert.daysUntilExpiry} days remaining)
              </li>
            ))}
          </ul>
          <button
            onClick={() => navigate("/factory-act/air-receiver-certificate")}
            className="mt-2 text-xs text-cyan-700 font-semibold hover:text-cyan-800 underline"
          >
            Go to Certificate Management →
          </button>
        </div>
        <button
          onClick={() => setExpiringAirReceiverCertificates([])}
          className="flex-shrink-0 text-cyan-400 hover:text-cyan-500"
        >
          ✕
        </button>
      </div>
    </div>
  </motion.div>
)}

{/* Manual Chain Pully Certificate Expiry Alert */}
{expiringManualChainPullyCertificates.length > 0 && (
  <motion.div
    className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4"
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
  >
    <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded shadow">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <p className="text-sm text-purple-700">
            <strong>⚠️ Manual Chain Pully Block Certificate Expiry Alert</strong>
          </p>
          <p className="text-xs text-purple-600 mt-1">
            {expiringManualChainPullyCertificates.length} certificate{expiringManualChainPullyCertificates.length > 1 ? 's are' : ' is'} expiring soon:
          </p>
          <ul className="mt-2 space-y-1">
            {expiringManualChainPullyCertificates.map(cert => (
              <li key={cert._id} className="text-xs text-purple-600">
                • Expires on {new Date(cert.expiryDate).toLocaleDateString('en-GB')} 
                ({cert.daysUntilExpiry} days remaining)
              </li>
            ))}
          </ul>
          <button
            onClick={() => navigate("/factory-act/manual-chain-pully-certificate")}
            className="mt-2 text-xs text-purple-700 font-semibold hover:text-purple-800 underline"
          >
            Go to Certificate Management →
          </button>
        </div>
        <button
          onClick={() => setExpiringManualChainPullyCertificates([])}
          className="flex-shrink-0 text-purple-400 hover:text-purple-500"
        >
          ✕
        </button>
      </div>
    </div>
  </motion.div>
)}

{/* Air Pollution Certificate Expiry Alert */}
{expiringAirPollutionCertificates.length > 0 && (
  <motion.div
    className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4"
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
  >
    <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded shadow">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <p className="text-sm text-green-700">
            <strong>🌬️ Air Pollution Certificate Expiry Alert</strong>
          </p>
          <p className="text-xs text-green-600 mt-1">
            {expiringAirPollutionCertificates.length} certificate{expiringAirPollutionCertificates.length > 1 ? 's are' : ' is'} expiring soon:
          </p>
          <ul className="mt-2 space-y-1">
            {expiringAirPollutionCertificates.map(cert => (
              <li key={cert._id} className="text-xs text-green-600">
                • Expires on {new Date(cert.expiryDate).toLocaleDateString('en-GB')} 
                ({cert.daysUntilExpiry} days remaining)
              </li>
            ))}
          </ul>
          <button
            onClick={() => navigate("/pollution/air-pollution-certificate")}
            className="mt-2 text-xs text-green-700 font-semibold hover:text-green-800 underline"
          >
            Go to Certificate Management →
          </button>
        </div>
        <button
          onClick={() => setExpiringAirPollutionCertificates([])}
          className="flex-shrink-0 text-green-400 hover:text-green-500"
        >
          ✕
        </button>
      </div>
    </div>
  </motion.div>
)}

{/* Water Pollution Certificate Expiry Alert */}
{expiringWaterPollutionCertificates.length > 0 && (
  <motion.div
    className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4"
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
  >
    <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded shadow">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <p className="text-sm text-blue-700">
            <strong>💧 Water Pollution Certificate Expiry Alert</strong>
          </p>
          <p className="text-xs text-blue-600 mt-1">
            {expiringWaterPollutionCertificates.length} certificate{expiringWaterPollutionCertificates.length > 1 ? 's are' : ' is'} expiring soon:
          </p>
          <ul className="mt-2 space-y-1">
            {expiringWaterPollutionCertificates.map(cert => (
              <li key={cert._id} className="text-xs text-blue-600">
                • Expires on {new Date(cert.expiryDate).toLocaleDateString('en-GB')} 
                ({cert.daysUntilExpiry} days remaining)
              </li>
            ))}
          </ul>
          <button
            onClick={() => navigate("/pollution/water-pollution-certificate")}
            className="mt-2 text-xs text-blue-700 font-semibold hover:text-blue-800 underline"
          >
            Go to Certificate Management →
          </button>
        </div>
        <button
          onClick={() => setExpiringWaterPollutionCertificates([])}
          className="flex-shrink-0 text-blue-400 hover:text-blue-500"
        >
          ✕
        </button>
      </div>
    </div>
  </motion.div>
)}
</div>

{/* Main Dashboard Content */}
<main className="min-h-screen py-8 pt-20" style={{ 
  background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(255, 255, 255, 0.4) 40%, rgba(139, 92, 246, 0.08) 100%)',
}}>      
   <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Back Button */}
          <motion.div
            className="mb-6 hidden md:block"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
          <button
  onClick={() => navigate(-1)}
  className="glass-btn inline-flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 font-medium transition-all duration-300 group"
  whileHover={{ x: -5 }}
>
              <span className="text-xl group-hover:-translate-x-1 transition-transform">
                ←
              </span>
              Back to Previous
            </button>
          </motion.div>

   

          {/* Enhanced Driver Section */}
         {userRoles.includes("driver") && (

                <DashboardSection>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Dispatch Plans */}
                    <DashboardCard>
                      <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                        <span className="text-3xl">🚚</span>
                        My Dispatch Plans
                      </h3>
                      <p className="text-gray-600 mb-6">
                        View your assigned daily dispatch plans and delivery
                        schedules
                      </p>
                      <ActionButton to="/my-plans" variant="indigo" icon="📋">
                        <div className="text-xl font-semibold mb-2">
                          View Dispatch Plans
                        </div>
                        <div className="text-indigo-100 text-sm opacity-90">
                          Check your daily assignments
                        </div>
                      </ActionButton>
                    </DashboardCard>

                    {/* Vehicle Documents */}
                    {driverVehicle && (
                      <DashboardCard>
                        <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                          <span className="text-3xl">📄</span>
                          Vehicle Documents
                        </h3>
                        <p className="text-gray-600 mb-6">
                          Manage insurance, tax, pollution, and permit renewals
                        </p>
                        <div className="space-y-4">
                          <motion.button
                            onClick={() => setShowDocs((prev) => !prev)}
                            className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            {showDocs ? "Hide Documents" : "View Documents"}
                          </motion.button>

                          <AnimatePresence>
                            {showDocs && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                              >
                                <VehicleDocumentsView
                                  vehicleNumber={driverVehicle.vehicleNumber}
                                />
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </DashboardCard>
                    )}
                  </div>
                </DashboardSection>
              )}
     {/* Enhanced Sales Orders Section */}
{(userRoles.some((role) =>
  ["sales", "admin", "accounts"].includes(role)
) ||
  (userRoles.includes("production") &&
    user.productionSection?.some((s) =>
      ["blockMoulding", "cnc"].includes(s)
    ))) && 
  // Hide for specific production user
  !(userRoles.includes("production") && user.email === "production.thermopackers@gmail.com") && (
                <DashboardSection>
                  <DashboardCard>
                    <h3 className="text-2xl font-bold text-gray-900 text-center mb-6">
                      📦 Sales Orders Management
                    </h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <ActionButton to="/add-order" variant="success" icon="➕">
                        <div className="text-xl font-semibold mb-2">
                          Add New Sales Order
                        </div>
                        <div className="text-green-100 text-sm opacity-90">
                          Check customer details before creating
                        </div>
                      </ActionButton>

                      <ActionButton to="/orders" variant="primary" icon="📂">
                        <div className="text-xl font-semibold mb-2">
                          Manage Sales Orders
                        </div>
                        <div className="text-blue-100 text-sm opacity-90">
                          View, edit, and manage existing orders
                        </div>
                      </ActionButton>
                    </div>
                  </DashboardCard>
                </DashboardSection>
              )}

<DashboardSection>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8"> 
    {/* Enhanced Quotation Section */}
              {!userRoles.some((role) =>
  ["driver",'guard','plantMaintenance'].includes(role)
) && (
  userRoles.includes("admin") || 
  userRoles.includes("accounts") || 
  userRoles.includes("sales") || 
  user.allowQuotation // Add this condition
) && (
                <DashboardCard>
                  <h3 className="text-2xl font-bold text-gray-900 text-center mb-6 flex items-center justify-center gap-3">
                    QUOTATION / PROFORMA INVOICE / ESTIMATE
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <ActionButton
                      to="/proforma-invoice"
                      variant="success"
                      icon="✨"
                    >
                      <div className="text-lg font-semibold mb-2">
                        Create Quotation
                      </div>
                      <div className="text-green-100 text-sm opacity-90">
                        Make New Quotation / Proforma / Estimate
                      </div>
                    </ActionButton>

                    <ActionButton
                      to="/proforma-dashboard"
                      variant="primary"
                      icon="📊"
                    >
                      <div className="text-lg font-semibold mb-2">
                        View Quotations
                      </div>
                      <div className="text-blue-100 text-sm opacity-90">
                        View Old Quotation / Proforma / Estimate
                      </div>
                    </ActionButton>
                  </div>

            {userRoles.includes("accounts") && (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
    {/* Purchase Product / Suppliers Section */}
    <div className="border-t border-gray-200 pt-6 flex flex-col">
      <h4 className="text-lg md:text-xl font-bold text-gray-900 text-center mb-4">
        Purchase Product / Suppliers
      </h4>
      <div className="flex-1 flex flex-col sm:flex-row items-center justify-center gap-4">
        <ActionButton
          onClick={() => navigate("/purchase-products-suppliers")}
          variant="indigo"
          icon="🏪"
          className="w-full sm:w-auto sm:flex-1 max-w-md"
        >
          <div className="text-base md:text-lg font-semibold">
            Purchase Product / Suppliers
          </div>
        </ActionButton>
      </div>
    </div>
    
    {/* RM Rate Section */}
    <div className="border-t border-gray-200 pt-6 flex flex-col">
      <h4 className="text-lg md:text-xl font-bold text-gray-900 text-center mb-4">
        RM Rate
      </h4>
      <div className="flex-1 flex items-center justify-center">
        <NavLink to="/rm-rate" className="w-full block">
          <button className="w-full bg-orange-500 hover:bg-orange-600 active:bg-orange-700 transition-all duration-200 text-white border border-gray-300 rounded-2xl p-4 sm:p-5 md:p-6 text-sm sm:text-base text-center shadow-sm hover:shadow-md transform hover:scale-[1.02] active:scale-[0.98]">
            <span className="inline-flex items-center justify-center gap-2">
              <span className="text-lg sm:text-xl">💵</span>
              <span className="font-medium">Access RM Rate</span>
            </span>
          </button>
        </NavLink>
      </div>
    </div>
  </div>
)}
                </DashboardCard>
              )}
</div>
</DashboardSection>

          {/* Enhanced Production Sections */}
        {userRoles.some((role) =>
  ["production", "packaging", "dispatch", "accounts"].includes(role)
) && (
                <DashboardSection>
                  <DashboardCard>
                    <h3 className="text-2xl font-bold text-gray-900 text-center mb-6">
                      🏭 Go To All Type of Production / Dispatch Sections
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {/* Also update individual checks inside */}
                      {(userRoles.includes("accounts") ||
                        userRoles.includes("production")) && (
                        <>
                          {(userRoles.includes("accounts") ||
                            user.productionSection?.includes(
                              "blockMoulding"
                            )) && (
                            <ActionButton
                              to="/production-dashboard?type=dana"
                              variant="indigo"
                              icon="🏭"
                            >
                              <div className="text-lg font-semibold mb-2">
                                Block Molding
                              </div>
                              <div className="text-indigo-100 text-xs opacity-90">
                                EPS/Thermocol Block Molding Production Section
                              </div>
                            </ActionButton>
                          )}

{(userRoles.includes("accounts") || user.allowDanaBeads) && (
                            <ActionButton
                              to="/dana-beads-dashboard"
                              variant="pink"
                              icon="●"
                            >
                              <div className="text-lg font-semibold mb-2">
                                Dana / Beads
                              </div>
                              <div className="text-pink-100 text-xs opacity-90">
                                EPS/Thermocol Dana / Beads Production Section
                              </div>
                            </ActionButton>
                          )}

                          {(userRoles.includes("accounts") ||
                            user.productionSection?.includes(
                              "shapeMoulding"
                            )) && (
                            <ActionButton
                              to="/production-dashboard?type=shape"
                              variant="purple"
                              icon="🔷"
                            >
                              <div className="text-lg font-semibold mb-2">
                                Shape Molding
                              </div>
                              <div className="text-purple-100 text-xs opacity-90">
                                EPS/Thermocol Shape Molding Production Section
                              </div>
                            </ActionButton>
                          )}
                        </>
                      )}

                      {(userRoles.includes("dispatch") ||
                        userRoles.includes("accounts")) && (
                        <ActionButton
                          to="/dispatch-dashboard"
                          variant="primary"
                          icon="🚛"
                        >
                          <div className="text-lg font-semibold mb-2">
                            Sheet Cutting
                          </div>
                          <div className="text-blue-100 text-xs opacity-90">
                            EPS/Thermocol Sheet Cutting & Dispatch Section
                          </div>
                        </ActionButton>
                      )}

                      {(userRoles.includes("packaging") ||
                        userRoles.includes("accounts")) && (
                        <ActionButton
                          to="/packaging-dashboard"
                          variant="success"
                          icon="📦"
                        >
                          <div className="text-lg font-semibold mb-2">
                            Packaging
                          </div>
                          <div className="text-green-100 text-xs opacity-90">
                            EPS/Thermocol Shape Moulding Packaging & Dispatch
                            Section
                          </div>
                        </ActionButton>
                      )}

                      {(userRoles.includes("accounts") ||
                        (userRoles.includes("production") &&
                          user.productionSection?.includes("cnc"))) && (
                        <ActionButton
                          to="/cnc-dashboard"
                          variant="warning"
                          icon="⚡"
                        >
                          <div className="text-lg font-semibold mb-2">
                            CNC Section
                          </div>
                          <div className="text-amber-100 text-xs opacity-90">
                            EPS/Thermocol CNC Hot Wire / CNC Router Section
                          </div>
                        </ActionButton>
                      )}
                    </div>
                  </DashboardCard>
                </DashboardSection>
              )}

          {/* Enhanced Admin Tools */}
        {userRoles.includes("admin") && (

                <DashboardSection>
                  <DashboardCard className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
                    <div className="text-center">
                      <div className="text-4xl mb-4">🛠️</div>
                      <h3 className="text-2xl font-bold text-amber-900 mb-3">
                        Admin Tools
                      </h3>
                      <p className="text-amber-700 mb-6">
                        Full access to manage users, permissions, and system
                        settings
                      </p>
                      <ActionButton
                        to="/admin-dashboard"
                        variant="warning"
                        icon="⚙️"
                        className="max-w-md mx-auto"
                      >
                        <div className="text-xl font-semibold">Admin Panel</div>
                      </ActionButton>
                    </div>
                  </DashboardCard>
                </DashboardSection>
              )}

             {userRoles.some(role => ["guard"].includes(role)) && (
    <DashboardSection>
      <DashboardCard>
        <h3 className="text-2xl font-bold text-gray-900 text-center mb-6 flex items-center justify-center gap-3">
          <span className="text-3xl">👥</span>
          Factory Attendance
        </h3>
        <p className="text-gray-600 text-center mb-6">
          For Operators, Helpers & Drivers - Fast face recognition attendance
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ActionButton 
            to="/guard-attendance?auto=true" 
            variant="primary" 
            icon="📸"
          >
            <div className="text-xl font-semibold mb-2">
              Mark Attendance
            </div>
            <div className="text-blue-100 text-sm opacity-90">
              Punch attendance with face recognition
            </div>
          </ActionButton>
          
          <ActionButton 
            to="/guard-attendance-history" 
            variant="success" 
            icon="📊"
          >
            <div className="text-xl font-semibold mb-2">
              View History
            </div>
            <div className="text-green-100 text-sm opacity-90">
              Check today's attendance records
            </div>
          </ActionButton>
        </div>
      </DashboardCard>
    </DashboardSection>
)}

 {userRoles.some(role => ["guard"].includes(role)) && (
    <DashboardSection>
      <DashboardCard>
         <h3 className="text-2xl font-bold text-gray-900 text-center mb-6 flex items-center justify-center gap-3">
          <span className="text-3xl">👥</span>
          View all employees with photos
        </h3>
<ActionButton 
  onClick={() => setShowAllUsersModal(true)}
  variant="purple" 
  icon="👥"
  className="glass-btn"
>
            <div className="text-xl font-semibold mb-2">
              View All Employees
            </div>
            <div className="text-purple-100 text-sm opacity-90">
              See all employees with photos
            </div>
          </ActionButton>
          </DashboardCard>
 </DashboardSection>)}

              {userRoles.some(role => ["guard"].includes(role)) && (
  <DashboardSection>
    <DashboardCard>
      <h3 className="text-2xl font-bold text-gray-900 text-center mb-6 flex items-center justify-center gap-3">
        <span className="text-3xl">🚗</span>
Make get Inwards/GRN/Record Vehicle Entry      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
  <ActionButton 
    to="/guard-entry" 
    variant="cyan" 
    icon="📝"
  >
    <div className="text-xl font-semibold mb-2">
      Record Vehicle Entry
    </div>
    <div className="text-blue-100 text-sm opacity-90">
      Add vehicle number, supplier details and photos
    </div>
  </ActionButton>
  
  {userRoles.includes("guard") ? (
    <ActionButton 
      to="/guard-entries-view" 
      variant="success" 
      icon="📋"
    >
      <div className="text-xl font-semibold mb-2">
        View All Entries
      </div>
      <div className="text-green-100 text-sm opacity-90">
        Check previous vehicle entry records
      </div>
    </ActionButton>
  ) : (
    <ActionButton 
      to="/guard-entries-view" 
      variant="fuchsia" 
      icon="📦"
    >
      <div className="text-xl font-semibold mb-2">
        Manage Goods Inwards
      </div>
      <div className="text-yellow-100 text-sm opacity-90">
        Manage and control incoming goods
      </div>
    </ActionButton>
  )}
</div>
    </DashboardCard>
  </DashboardSection>
)}

{userRoles.some(role => ["guard"].includes(role)) && (
  <DashboardSection>
    <DashboardCard>
      <h3 className="text-2xl font-bold text-gray-900 text-center mb-6 flex items-center justify-center gap-3">
        <span className="text-3xl">🚚</span>
        Gate Outwards/Record Vehicle Exit
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ActionButton 
          to="/gate-outward" 
          variant="orange" 
          icon="📤"
        >
          <div className="text-xl font-semibold mb-2">
            Record Vehicle Exit
          </div>
          <div className="text-orange-100 text-sm opacity-90">
            Record material sent for repair or sale to customer
          </div>
        </ActionButton>
        
        <ActionButton 
          to="/gate-outwards-view" 
          variant="purple" 
          icon="📋"
        >
          <div className="text-xl font-semibold mb-2">
            View All Outwards
          </div>
          <div className="text-purple-100 text-sm opacity-90">
            Check previous gate outward records
          </div>
        </ActionButton>
      </div>
    </DashboardCard>
  </DashboardSection>
)}

          {/* Enhanced Main Grid Section */}
          <DashboardSection>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Enhanced Tasks Section */}
              <DashboardCard>
                <h3 className="text-2xl font-bold text-gray-900 text-center mb-6 flex items-center justify-center gap-3">
                  <span className="text-3xl">✅</span>
                  TASKS / TO DO / WORK GIVEN INFORMATION
                </h3>
                <div className="grid grid-cols-1 gap-6">
                  <div className="relative">
                    <ActionButton to="/my-tasks" variant="primary" icon="📝">
                      <div className="text-lg font-semibold mb-2">
                        My Tasks / Assigned Work
                      </div>
                      <div className="text-blue-100 text-sm opacity-90">
                        View and complete assigned personal tasks
                      </div>
                    </ActionButton>
                    {unreadCount > 0 && (
                      <motion.span
                        className="absolute -top-2 -right-2 bg-red-500 text-white text-sm font-bold px-3 py-1 rounded-full shadow-lg"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 500 }}
                      >
                        {unreadCount} new
                      </motion.span>
                    )}
                  </div>
  {!userRoles.some(role => ["guard"].includes(role)) && (
  <ActionButton
    to="/task-dashboard"
    variant="danger"
    icon="👥"
  >
    <div className="text-lg font-semibold mb-2">
      Task Dashboard
    </div>
    <div className="text-red-100 text-sm opacity-90">
      Assign / View / Edit / Delete Task
    </div>
  </ActionButton>)}
  {!userRoles.some(role => ["guard"].includes(role)) && (
    <ActionButton
      onClick={() => setShowTaskAssignment(true)}
      variant="purple"
      icon="👤➡️👥"
    >
      <div className="text-lg font-semibold mb-2">
        Roaster
      </div>
      <div className="text-purple-100 text-sm opacity-90">
        Assign tasks when someone is absent
      </div>
    </ActionButton>)}
    <ActionButton
  to="/task-assignments"
  variant="teal"
  icon="📋"
>
  <div className="text-lg font-semibold mb-2">
    View Roaster
  </div>
  <div className="text-teal-100 text-sm opacity-90">
    See all assigned jobs for absent users
  </div>
</ActionButton>
                </div>
              </DashboardCard>


{/* Alternative: Smaller button that fits in the existing button row */}
{(userRoles.some((role) => ["admin", "accounts"].includes(role))) && (
  <DashboardCard>
 <h3 className="text-2xl font-bold text-gray-900 text-center mb-6 flex items-center justify-center gap-3">
                    <span className="text-2xl">🏢</span>
                  Go To Caremax Impex Page
                  </h3>
                  <div className="flex items-center justify-center">
  <motion.button
    onClick={() => navigate("/caremax-impex")}
    className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-5 py-2 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2"
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
  >
    Caremax Impex
  </motion.button>
  </div>
  </DashboardCard>
)}

              {/* Enhanced Assets Section */}
              <DashboardCard>
                <h3 className="text-2xl font-bold text-gray-900 text-center mb-6 flex items-center justify-center gap-3">
                  <span className="text-3xl">💼</span>
                  Assets Management
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <ActionButton
                    to="/my-assets"
                    variant="primary"
                    icon="📦"
                    className="h-full"
                  >
                    <div className="text-sm font-semibold mb-1">My Assets</div>
                    <div className="text-blue-100 text-xs opacity-90">
                      View assigned assets
                    </div>
                  </ActionButton>

                  {userRoles.includes("accounts") && (
                    <>
                      <ActionButton
                        to="/issue-asset"
                        variant="success"
                        icon="🎁"
                        className="h-full"
                      >
                        <div className="text-sm font-semibold mb-1">
                          Issue Assets to Employees
                        </div>
                        <div className="text-green-100 text-xs opacity-90">
                          Click to issue assets
                        </div>
                      </ActionButton>
                      <ActionButton
                        to="/asset-management"
                        variant="warning"
                        icon="🛠️"
                        className="h-full"
                      >
                        <div className="text-sm font-semibold mb-1">
                          Manage Assets
                        </div>
                        <div className="text-amber-100 text-xs opacity-90">
                          Click to manage all assets
                        </div>
                      </ActionButton>
                    </>
                  )}
                </div>
              </DashboardCard>

              {/* Password Manager Button */}
  <DashboardSection>
    <DashboardCard className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-purple-900 mb-3">
          🔐 Password Manager
        </h3>
      
        <ActionButton
          to="/password-manager"
          variant="purple"
          icon="🔐"
          className="max-w-md mx-auto"
        >
          <div className="text-xl font-semibold">Manage Passwords</div>
        </ActionButton>
      </div>
    </DashboardCard>
  </DashboardSection>


              {/* Enhanced Vehicles Management */}
            {(user.allowVehiclesManagement ||
  userRoles.some((role) =>
    ["admin", "accounts"].includes(role)
  )) && (
                <DashboardCard>
                  <h3 className="text-2xl font-bold text-gray-900 text-center mb-6 flex items-center justify-center gap-3">
                    <span className="text-3xl">🚗</span>
                    Vehicles Management & Outward Diesel, Freight & Kharcha Calculator
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <ActionButton
                      to="/assign-dispatch"
                      variant="primary"
                      icon="📋"
                    >
                      <div className="text-lg font-semibold mb-2">
                        Daily Dispatch Plan
                      </div>
                      <div className="text-blue-100 text-sm opacity-90">
                        Plan and assign tasks to drivers/vehicles
                      </div>
                    </ActionButton>

                    {userRoles.some(role => ["admin", "accounts"].includes(role)) && (
                      <ActionButton
                        to="/mileage-chart"
                        variant="indigo"
                        icon="📊"
                      >
                        <div className="text-lg font-semibold mb-2">
                          Vehicle Mileage Reports
                        </div>
                        <div className="text-indigo-100 text-sm opacity-90">
                          View KM/L for vehicles
                        </div>
                      </ActionButton>
                    )}

                    {userRoles.some(role => ["admin", "accounts"].includes(role)) && (
                      <ActionButton
                        to="/registered-vehicles"
                        variant="success"
                        icon="📄"
                        className="md:col-span-2"
                      >
                        <div className="text-lg font-semibold mb-2">
                          Vehicles Maintenance Log Book & Documents
                        </div>
                        <div className="text-green-100 text-sm opacity-90">
                          Reistered Vehicles Documents, RC, Vehicle Pictures and
                          Due Date for Insurance, Registration Tax, Pollution,
                          Fitness, All India Permit, Pollution etc.
                        </div>
                      </ActionButton>
                    )}
                     {/* New Outward Freight Calculator Button */}
      <ActionButton
        to="/freight-calculator"
        variant="teal"
        icon="🚚"
        className="md:col-span-2"
      >
        <div className="text-lg font-semibold">
         Outward Diesel, Freight & Kharcha Calculator
        </div>
      </ActionButton>
                  </div>
                </DashboardCard>
              )}

           {userRoles.some(role => ["admin", "accounts", "sales"].includes(role)) && (
                              <DashboardCard>
 <h3 className="text-2xl font-bold text-gray-900 text-center mb-6 flex items-center justify-center gap-3">
                    <span className="text-5xl">🖩</span>
                   Thermocol Sheet or Packaging Costing Calculator
                  </h3>
  <div className="w-full">
    <button
      onClick={() => navigate("/costing-calculator")}
      className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition-all duration-200"
    >
      Costing Calculator
    </button>
  </div>
                  </DashboardCard>

)}

              {/* Enhanced Material Requisition */}
              {userRoles.some((role) =>
                [
                  "admin",
                  "sales",
                  "accounts",
                  "dispatch",
                  "packaging",
                  "production",
                ].includes(role)
              ) && (
                <DashboardCard>
                  <h3 className="text-2xl font-bold text-gray-900 text-center mb-6 flex items-center justify-center gap-3">
                    <span className="text-3xl">📋</span>
                    Material Requisition
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <ActionButton
                      to="/material-requisition"
                      variant="danger"
                      icon="📝"
                    >
                      <div className="text-lg font-semibold mb-2">
                        New Requisition Form
                      </div>
                      <div className="text-red-100 text-sm opacity-90">
                        Submit a new requisition for raw materials
                      </div>
                    </ActionButton>

                    <ActionButton
                      to="/requisition-slips"
                      variant="warning"
                      icon="📑"
                    >
                      <div className="text-lg font-semibold mb-2">
                        View Requisition Slips
                      </div>
                      <div className="text-amber-100 text-sm opacity-90">
                        View/download all requisition PDFs
                      </div>
                    </ActionButton>
                  </div>
                </DashboardCard>
              )}
            </div>
          </DashboardSection>

{userRoles.some(role => ["accounts", "admin"].includes(role)) && (
  <DashboardSection>
    <DashboardCard>
      <h3 className="text-2xl font-bold text-gray-900 text-center mb-6 flex items-center justify-center gap-3">
        <span className="text-3xl">🚗</span>
Make get Inwards/GRN/Record Vehicle Entry      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
  <ActionButton 
    to="/guard-entry" 
    variant="cyan" 
    icon="📝"
  >
    <div className="text-xl font-semibold mb-2">
      Record Vehicle Entry
    </div>
    <div className="text-blue-100 text-sm opacity-90">
      Add vehicle number, supplier details and photos
    </div>
  </ActionButton>
  
  {userRoles.includes("guard") ? (
    <ActionButton 
      to="/guard-entries-view" 
      variant="success" 
      icon="📋"
    >
      <div className="text-xl font-semibold mb-2">
        View All Entries
      </div>
      <div className="text-green-100 text-sm opacity-90">
        Check previous vehicle entry records
      </div>
    </ActionButton>
  ) : (
    <ActionButton 
      to="/guard-entries-view" 
      variant="fuchsia" 
      icon="📦"
    >
      <div className="text-xl font-semibold mb-2">
        Manage Goods Inwards
      </div>
      <div className="text-yellow-100 text-sm opacity-90">
        Manage and control incoming goods
      </div>
    </ActionButton>
  )}
</div>
    </DashboardCard>
  </DashboardSection>
)}

{userRoles.some(role => ["accounts", "admin"].includes(role)) && (
  <DashboardSection>
    <DashboardCard>
      <h3 className="text-2xl font-bold text-gray-900 text-center mb-6 flex items-center justify-center gap-3">
        <span className="text-3xl">🚚</span>
        Gate Outwards Management
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ActionButton 
          to="/gate-outward" 
          variant="orange" 
          icon="📤"
        >
          <div className="text-xl font-semibold mb-2">
            Record Gate Outward
          </div>
          <div className="text-orange-100 text-sm opacity-90">
            Material sent for repair or sold
          </div>
        </ActionButton>
        
        <ActionButton 
          to="/gate-outwards-view" 
          variant="emerald" 
          icon="📊"
        >
          <div className="text-xl font-semibold mb-2">
            Manage Outwards
          </div>
          <div className="text-amber-100 text-sm opacity-90">
            View, edit & manage all outward entries
          </div>
        </ActionButton>
      </div>
    </DashboardCard>
  </DashboardSection>
)}

          {/* Enhanced Quotation & Sales Sections */}
          <DashboardSection>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         
           {(userRoles.includes("accounts") ||
  userRoles.includes("sales") ||
  user.allowIncomingPayments) && (
  <DashboardCard>
    <h3 className="text-xl font-bold text-gray-900 text-center mb-4 flex items-center justify-center gap-2">
      <span className="text-2xl">📥</span>
      Bank Incoming Payment
    </h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <ActionButton
        to="/payment-records"
        variant="primary"
        icon="📥"
        className="h-full"
      >
        <div className="text-sm font-semibold mb-1">
          Manage Incoming Payments
        </div>
        <div className="text-blue-100 text-xs opacity-90">
          Daily Cheques/RTGS/UPI/NEFT/Payment from Customers to
          Thermo Packers
        </div>
      </ActionButton>
    </div>
  </DashboardCard>
)}

              {/* Outgoing Payments - Only for Accounts Role */}
              {userRoles.includes("accounts") && (
                <DashboardCard>
                  <h3 className="text-xl font-bold text-gray-900 text-center mb-4 flex items-center justify-center gap-2">
                    <span className="text-2xl">📤</span>
                    Bank Outgoing Payments
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ActionButton
                      to="/outgoing-payment"
                      variant="warning"
                      icon="📤"
                      className="h-full"
                    >
                      <div className="text-sm font-semibold mb-1">
                        Manage Outgoing Payments
                      </div>
                      <div className="text-amber-100 text-xs opacity-90">
                        Daily Cheques/RTGS/UPI/NEFT/Payment to Suppliers/Vendors
                      </div>
                    </ActionButton>
                  </div>
                </DashboardCard>
              )}
        {/* Enhanced Sales & Customers Section */}
{userRoles.some((role) =>
  ["admin", "sales", "accounts"].includes(role)
) && (
  <div className="space-y-6">
    {/* Campaign Management Section */}
    <DashboardCard>
      <h3 className="text-xl font-bold text-gray-900 text-center mb-4 flex items-center justify-center gap-2">
        <span className="text-2xl">📢</span>
        Campaign Management
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ActionButton
          onClick={() => navigate('/campaigns/new/whatsapp')}
          variant="success"
          icon="💬"
          className="h-full"
        >
          <div className="text-sm font-semibold mb-1">
            Start WhatsApp Campaign
          </div>
          <div className="text-green-100 text-xs opacity-90">
            Send bulk WhatsApp messages to customers
          </div>
        </ActionButton>

        <ActionButton
          onClick={() => navigate('/campaigns/new/email')}
          variant="primary"
          icon="✉️"
          className="h-full"
        >
          <div className="text-sm font-semibold mb-1">
            Start Email Campaign
          </div>
          <div className="text-blue-100 text-xs opacity-90">
            Send bulk emails to customers
          </div>
        </ActionButton>
         <ActionButton
          onClick={() => navigate('/campaigns')}
          variant="cyan"
          icon="📑"
          className="h-full"
        >
          <div className="text-sm font-semibold mb-1">
            Monitor Old Campaigns
          </div>
        </ActionButton>
      </div>
    </DashboardCard>

    <DashboardCard>
      <h3 className="text-xl font-bold text-gray-900 text-center mb-4 flex items-center justify-center gap-2">
        <span className="text-2xl">📈</span>
        Sales Products
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {!userRoles.some((role) =>
  ["sales"].includes(role)
) && (
        <ActionButton
          to="/add-product"
          variant="success"
          icon="➕"
          className="h-full"
        >
          <div className="text-sm font-semibold mb-1">
            Add new Product
          </div>
          <div className="text-green-100 text-xs opacity-90">
            New sales product
          </div>
        </ActionButton>
)}

        <ActionButton
          to="/all-products"
          variant="warning"
          icon="📋"
          className="h-full"
        >
          <div className="text-sm font-semibold mb-1">
            Manage Products
          </div>
          <div className="text-amber-100 text-xs opacity-90">
            View / Edit / Delete Products
          </div>
        </ActionButton>
      </div>




      {/* Product Rate Checker - Only for accounts role */}
{/* Product Rate Checker - Only for accounts role */}
{userRoles.some((role) =>
  ["admin", "sales", "accounts"].includes(role)
) && (
  <>
  <div className="relative mt-6">
    <ProductRateChecker />
  </div>
    <div className="mt-6">
      <button
        onClick={() => setShowProductRates(!showProductRates)}
        className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2"
      >
        {showProductRates ? '📊 Hide Product Rate Table' : '📊 Show Product Rate Table'}
      </button>
      {showProductRates && <ProductRateTable />}
    </div>
    </>
)}
    </DashboardCard>



    <DashboardCard>
      <h3 className="text-xl font-bold text-gray-900 text-center mb-4 flex items-center justify-center gap-2">
        <span className="text-2xl">👥</span>
        Customers
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ActionButton
          to="/add-customer"
          variant="primary"
          icon="➕"
          className="h-full"
        >
          <div className="text-sm font-semibold mb-1">
            Add new Customer
          </div>
          <div className="text-blue-100 text-xs opacity-90">
            New customer profile
          </div>
        </ActionButton>

        <ActionButton
          to="/customers"
          variant="purple"
          icon="📊"
          className="h-full"
        >
          <div className="text-sm font-semibold mb-1">
            Manage Customers
          </div>
          <div className="text-purple-100 text-xs opacity-90">
            View / Edit / Delete Customer
          </div>
        </ActionButton>
      </div>
    </DashboardCard>
    {/* ⭐ Potential Customers Section */}
{userRoles.some((role) =>
  ["admin", "sales", "accounts"].includes(role)
) && (
  <DashboardCard>
    <h3 className="text-xl font-bold text-gray-900 text-center mb-4 flex items-center justify-center gap-2">
      <span className="text-2xl">⭐</span>
      Potential Customers
    </h3>
    <p className="text-gray-600 text-center text-sm mb-4">
      Manage Potential Customers, and convert to customers
    </p>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <ActionButton
        to="/add-potential-customer"
        variant="orange"
        icon="➕"
        className="h-full"
      >
        <div className="text-sm font-semibold mb-1">
          Add New Potential Customer
        </div>
        <div className="text-orange-100 text-xs opacity-90">
          Create new Potential Customer
        </div>
      </ActionButton>

      <ActionButton
        to="/potential-customers"
        variant="emerald"
        icon="📊"
        className="h-full"
      >
        <div className="text-sm font-semibold mb-1">
          Manage Potential Customer
        </div>
        <div className="text-emerald-100 text-xs opacity-90">
          View / Edit / Delete Potential Customer
        </div>
      </ActionButton>
    </div>


  </DashboardCard>
)}
  </div>
)}

  <DashboardCard>
{userRoles.some((role) =>
  ["production"].includes(role)
) && (<>
  <h3 className="text-xl font-bold text-gray-900 text-center mb-4 flex items-center justify-center gap-2">
        <span className="text-2xl">📈</span>
        Sales Products
      </h3>
       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ActionButton
          to="/add-product"
          variant="success"
          icon="➕"
          className="h-full"
        >
          <div className="text-sm font-semibold mb-1">
            Add new Product
          </div>
          <div className="text-green-100 text-xs opacity-90">
            New sales product
          </div>
        </ActionButton>

        <ActionButton
          to="/all-products"
          variant="warning"
          icon="📋"
          className="h-full"
        >
          <div className="text-sm font-semibold mb-1">
            Manage Products
          </div>
          <div className="text-amber-100 text-xs opacity-90">
            View / Edit / Delete Products
          </div>
        </ActionButton>
      </div>
      </>
)}
  </DashboardCard>

            </div>
          </DashboardSection>

      {/* Enhanced HR Section */}
{(user.allowHR ||
  userRoles.some((role) => ["admin", "accounts"].includes(role))) && (
  <DashboardSection>
    <DashboardCard>
      <h3 className="text-2xl font-bold text-gray-900 text-center mb-6 flex items-center justify-center gap-3">
        <span className="text-3xl">👨‍💼</span>
        HR (Human Resource)
      </h3>
      <p className="text-gray-600 text-center mb-6">
        Employee management, ID Proof, Salary Sheets, ESIC, EPFO, Leave Management, and more
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ActionButton to="/register-user" variant="primary" icon="👥">
          <div className="text-lg font-semibold mb-2">
            Employee Management
          </div>
          <div className="text-blue-100 text-sm opacity-90">
            ➕ Add / View / Edit / Delete Employees
          </div>
        </ActionButton>

    

        <motion.div
          whileHover={{ scale: 1.02 }}
        >
            <div className="flex flex-col items-center text-center">
                      <ActionButton to="/esic">
              <div className="text-3xl mb-3">📑</div>
              <div className="text-lg font-semibold mb-2">
                ESIC Management
              </div>
              <div className="text-gray-200 text-sm opacity-90">
                ESIC Monthly Challan & Payment Receipts
              </div>
               </ActionButton>
            </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
        >
            <div className="flex flex-col items-center text-center">
              <ActionButton to="/epfo">
              <div className="text-3xl mb-3">📑</div>
              <div className="text-lg font-semibold mb-2">
                EPFO Management
              </div>
              <div className="text-gray-200 text-sm opacity-90">
                EPFO Monthly Challan & Payment Receipts
              </div>
              </ActionButton>
            </div>
        </motion.div>

        <motion.div
          className="opacity-60 cursor-not-allowed md:col-span-2"
          whileHover={{ scale: 1.02 }}
        >
          <div className="w-full bg-gray-400 text-white p-6 rounded-2xl shadow-lg">
            <div className="flex flex-col items-center text-center">
              <div className="text-3xl mb-3">📊</div>
              <div className="text-lg font-semibold mb-2">
                Salary Sheets
              </div>
              <div className="text-gray-200 text-sm opacity-90">
                Monthly Salary Sheets
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </DashboardCard>
  </DashboardSection>
)}




   {/* ✅ NEW LEAVE MANAGEMENT SECTION */}
                 <div className="flex flex-col md:flex-row items-center justify-center bg-white rounded-3xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300 mb-6">
          {!userRoles.some((role) =>
            ["guard"].includes(role)
          ) && (

 <DashboardSection>
              <h3 className="text-2xl font-bold text-gray-900 text-center mb-6 flex items-center justify-center gap-3">
                <span className="text-3xl">📋</span>
                Leave Management
              </h3>
              <p className="text-gray-600 text-center mb-6">
                Manage employee leave applications, approvals, and records
              </p>
              <div className="flex justify-center">
                <ActionButton to="/leave-management" variant="teal" icon="📋" className="max-w-md">
                  <div className="text-xl font-semibold mb-2">
                    Leave Management System
                  </div>
                  <div className="text-teal-100 text-sm opacity-90">
                    Apply for leave, manage applications & view records
                  </div>
                </ActionButton>
              </div>
          </DashboardSection>
          )}

          {/* Enhanced Attendance Logs */}
          {user.allowAttendance && (
            <DashboardSection>
                <h3 className="text-2xl font-bold text-gray-900 text-center mb-6 flex items-center justify-center gap-3">
                  <span className="text-3xl">📅</span>
                  Attendance Management
                </h3>
                <ActionButton
                  to={userRoles.includes("driver") ? "/factory-attendance-logs" : "/attendance-logs"}
                  variant="success"
                  icon="📊"
                  className="max-w-2xl mx-auto"
                >
                  <div className="text-xl font-semibold mb-2">
                    View Attendance Logs
                  </div>
                  <div className="text-green-100 text-sm opacity-90">
                    View Daily check-ins and attendance records
                  </div>
                </ActionButton>
            </DashboardSection>
          )}
                        </div>


          {/* Enhanced Supplier Section */}
          {userRoles.some((role) =>
            ["suppliers", "accounts", "viewer"].includes(role)
          ) && (
            <DashboardSection>
              <DashboardCard>
                <h3 className="text-2xl font-bold text-gray-900 text-center mb-6 flex items-center justify-center gap-3">
                  <span className="text-3xl">🎨</span>
                  Pattern Orders & Status
                </h3>

                {userRoles.includes("suppliers") && (
                  <motion.div
                    className="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-2xl p-6 mb-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="flex flex-col items-center gap-4">
                      <motion.button
                        onClick={() => setShowInviteForm(!showInviteForm)}
                        className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:bg-emerald-700 transition-all duration-300 flex items-center gap-2"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {showInviteForm ? (
                          <>❌ Cancel Invitation</>
                        ) : (
                          <>👥 Invite Assistant</>
                        )}
                      </motion.button>

                      <AnimatePresence>
                        {showInviteForm && (
                          <motion.div
                            className="w-full"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                          >
                            <AssistantInvitationForm
                              supplierId={user._id}
                              onInviteSent={(link) => setInvitationLink(link)}
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
{(userRoles.includes("suppliers") || userRoles.includes("viewer")) && (                    <ActionButton
                      onClick={() => navigate("/drawing-upload-form")}
                      variant="warning"
                      icon="📝"
                    >
                      <div className="text-lg font-semibold mb-2">
                        Submit Drawing
                      </div>
                      <div className="text-amber-100 text-sm opacity-90">
                        Submit New Drawing for making EPS/Thermocol Pattern
                      </div>
                    </ActionButton>
                  )}

                  <ActionButton
                    onClick={() => navigate("/drawing-orders-table")}
                    variant="success"
                    icon="📊"
                  >
                    <div className="text-lg font-semibold mb-2">
                      View Orders
                    </div>
                    <div className="text-green-100 text-sm opacity-90">
                      View Old Patterns Orders Quotation & Price Finalization
                      Real Time Status of Orders
                    </div>
                  </ActionButton>
                </div>
              </DashboardCard>
            </DashboardSection>
          )}

          {/* Enhanced Plant & Machinery */}
          {(user.allowPlantMaintenance ||
            userRoles.some((role) => ["accounts", "admin","plantMaintenance"].includes(role))) && (
            <DashboardSection>
              <DashboardCard>
                <h3 className="text-2xl font-bold text-gray-900 text-center mb-6 flex items-center justify-center gap-3">
                  <span className="text-3xl">⚙️</span>
                  Plant & Machinery Maintenance
                </h3>
                <ActionButton
                  to="/plant-machinery-maintenance"
                  variant="danger"
                  icon="🔧"
                  className="max-w-2xl mx-auto"
                >
                  <div className="text-xl font-semibold mb-2">
                    Maintenance Dashboard
                  </div>
                  <div className="text-red-100 text-sm opacity-90">
                    Plant & machinery maintenance tracking
                  </div>
                </ActionButton>
              </DashboardCard>
            </DashboardSection>
          )}

         {/* Enhanced Tour Expenses */}
{(user.allowTourExpenses ||
  userRoles.some((role) => ["sales", "accounts"].includes(role))) && (
  <DashboardSection>
    <DashboardCard>
      <h3 className="text-2xl font-bold text-gray-900 text-center mb-6 flex items-center justify-center gap-3">
        <span className="text-3xl">✈️</span>
        Tour Expenses
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6"> {/* Changed to 3 columns */}
       

        <ActionButton to="/tour-expenses" variant="primary" icon="➕">
          <div className="text-lg font-semibold mb-2">
            Add Tour Expenses
          </div>
          <div className="text-blue-100 text-sm opacity-90">
            Submit travel expenses
          </div>
        </ActionButton>

        <ActionButton
          to="/tour-expenses-dashboard"
          variant="purple"
          icon="📊"
        >
          <div className="text-lg font-semibold mb-2">
            View Tour Expenses
          </div>
          <div className="text-purple-100 text-sm opacity-90">
            Dashboard & reports
          </div>
        </ActionButton>
         {/* Tour Planning Button - NEW */}
        <ActionButton 
          to="/tour-planning" 
          variant="cyan" 
          icon="🗺️"
        >
          <div className="text-lg font-semibold mb-2">
            Tour Planning
          </div>
          <div className="text-cyan-100 text-sm opacity-90">
            Plan tour by city & filter customers
          </div>
        </ActionButton>
      </div>
    </DashboardCard>
  </DashboardSection>
)}

          {/* 🎁 Customer Gifts Section */}
{userRoles.some(role => ["admin", "accounts", "sales"].includes(role)) && (
  <DashboardSection>
    <DashboardCard>
      <h3 className="text-2xl font-bold text-gray-900 text-center mb-6 flex items-center justify-center gap-3">
        <span className="text-3xl">🎁</span>
        Customer Gifts
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Issue Gifts */}
        <ActionButton
          to="/customers"
          variant="orange"
          icon="🎁"
        >
          <div className="text-lg font-semibold mb-2">
            Issue gifts to a customer
          </div>
          <div className="text-orange-100 text-sm opacity-90">
            Select customer and issue new gifts
          </div>
        </ActionButton>

        {/* View Old Gifts */}
        <ActionButton
          to="/customer-gifts"
          variant="purple"
          icon="📜"
        >
          <div className="text-lg font-semibold mb-2">
            Check old gifts issued
          </div>
          <div className="text-purple-100 text-sm opacity-90">
            View previously issued customer gifts
          </div>
        </ActionButton>

      </div>
    </DashboardCard>
  </DashboardSection>
)}


          {/* Enhanced Important Numbers */}
          <DashboardSection>
            <DashboardCard>
              <h3 className="text-2xl font-bold text-gray-900 text-center mb-6 flex items-center justify-center gap-3">
                <span className="text-3xl">📞</span>
                Important Numbers
              </h3>
              <div className="text-center">
                <p className="text-gray-600 mb-6">
                  {userRoles.some((role) =>
                    ["admin", "accounts"].includes(role)
                  )
                    ? "Manage and view important contact numbers"
                    : "View important contact numbers"}
                </p>
                <ActionButton
                  to="/important-numbers"
                  variant={userRoles.some(role => ["admin", "accounts"].includes(role)) ? "primary" : "success"}
                  icon="📱"
                  className="max-w-md mx-auto"
                >
                  <div className="text-xl font-semibold">
{userRoles.some(role => ["admin", "accounts"].includes(role))                      ? "Manage Important Numbers"
                      : "View Important Numbers"}
                  </div>
                </ActionButton>
              </div>
            </DashboardCard>
          </DashboardSection>
        </div>
        {showPaymentForm && (
          <IncomingPaymentForm onClose={() => setShowPaymentForm(false)} />
        )}
      </main>
         <TaskAssignmentModal 
        isOpen={showTaskAssignment} 
        onClose={() => setShowTaskAssignment(false)}
        currentUser={user}
      />
            {/* View All Users Modal */}
      {showAllUsersModal && (
        <ViewAllUsersModal onClose={() => setShowAllUsersModal(false)} />
      )}
    </>
  );
}
