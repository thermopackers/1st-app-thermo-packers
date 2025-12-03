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
  const [notifications, setNotifications] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [driverVehicle, setDriverVehicle] = useState(null);
  const [docNotifCount, setDocNotifCount] = useState(0);
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
        axiosInstance.get(`/products-multer?search=${query}&limit=5`),
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
      className={`bg-white rounded-3xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300 ${className}`}
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

  return (
 <>
  <InternalNavbar />
  
  {/* Compact Profile Button */}
  <div className="fixed top-47 left-4 z-50">
<motion.button
  ref={profileButtonRef}
  onClick={() => setShowProfilePanel(!showProfilePanel)}
  className="relative bg-white rounded-full p-3 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300 group"
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
        <div className="flex items-center gap-1">
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
        </div>
      </div>
    </motion.button>

{/* Profile Panel */}
<AnimatePresence>
  {showProfilePanel && (
    <motion.div
      ref={profilePanelRef}
      className="absolute top-16 left-0 bg-white rounded-2xl shadow-2xl border border-gray-200 p-6 min-w-80 max-w-md z-50 mobile:left-4 mobile:right-4 mobile:max-w-none"
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
  <p className="text-gray-600 text-xs truncate" title={user?.email}>
    {user?.email}
  </p>
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
                  background: "#f8fafc",
                  customClass: {
                    popup: "rounded-2xl",
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

          {/* Document Notifications (if accounts role) */}
        {userRoles.includes("accounts") && (
  <motion.button
    onClick={() => {
      setShowDocNotifications((prev) => !prev);
      setShowProfilePanel(false); // Close profile panel when opening document alerts
    }}
    className="w-full bg-white border border-gray-300 px-4 py-3 rounded-xl font-medium shadow-sm hover:shadow-md transition-all duration-300 flex items-center justify-between mb-4"
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    data-doc-notifications-button
  >
    <div className="flex items-center gap-3">
      <div className="text-xl">📋</div>
      <span>Document Alerts</span>
    </div>
    {docNotifCount > 0 && (
      <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
        {docNotifCount}
      </span>
    )}
  </motion.button>
)}

          {/* Follow-up Notifications */}
          {followUps.length > 0 && (
            <motion.div
              className="bg-amber-50 border-l-4 border-amber-400 rounded-xl p-4 mb-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h3 className="font-semibold text-amber-900 text-sm mb-2 flex items-center gap-2">
                🔔 Follow-up Reminders ({followUps.length})
              </h3>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {followUps.slice(0, 3).map((note, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2 text-amber-800 text-xs"
                  >
                    <div className="w-1.5 h-1.5 bg-amber-400 rounded-full mt-1.5 flex-shrink-0"></div>
                    <span className="flex-1 leading-tight">{note.message}</span>
                  </div>
                ))}
                {followUps.length > 3 && (
                  <p className="text-amber-600 text-xs text-center mt-2">
                    +{followUps.length - 3} more reminders
                  </p>
                )}
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
    className="fixed top-65 left-4 z-40 max-w-md w-full bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden max-h-[80vh] overflow-y-auto"
    initial={{ opacity: 0, y: -20, scale: 0.95 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, y: -20, scale: 0.95 }}
    style={{ position: 'fixed' }}
  >
    <DocumentNotifications setDocNotifCount={setDocNotifCount} />
  </motion.div>
)}
      <ProductCustomerSearch />

      {/* Main Dashboard Content */}
<main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 py-8 pt-20">       
   <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Back Button */}
          <motion.div
            className="mb-6 hidden md:block"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-3 bg-white px-4 py-3 rounded-xl shadow-lg hover:shadow-xl text-gray-700 font-medium transition-all duration-300 group"
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
    ))) && (
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

                          {userRoles.includes("accounts") && (
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
  </ActionButton>
                </div>
              </DashboardCard>

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

              {/* Enhanced Vehicles Management */}
            {(user.allowVehiclesManagement ||
  userRoles.some((role) =>
    ["admin", "accounts"].includes(role)
  )) && (
                <DashboardCard>
                  <h3 className="text-2xl font-bold text-gray-900 text-center mb-6 flex items-center justify-center gap-3">
                    <span className="text-3xl">🚗</span>
                    Vehicles Management
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

          {/* Enhanced Quotation & Sales Sections */}
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
                    <div className="border-t border-gray-200 pt-6">
                      <h4 className="text-lg font-bold text-gray-900 text-center mb-4">
                        Purchase Product / Suppliers
                      </h4>
                      <div className="flex justify-center">
                        <ActionButton
                          onClick={() =>
                            navigate("/purchase-products-suppliers")
                          }
                          variant="indigo"
                          icon="🏪"
                          className="max-w-md"
                        >
                          <div className="text-lg font-semibold">
                            Purchase Product / Suppliers
                          </div>
                        </ActionButton>
                      </div>
                    </div>
                  )}
                </DashboardCard>
              )}
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
                  <DashboardCard>
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
                </div>
              )}
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
          className="opacity-60 cursor-not-allowed"
          whileHover={{ scale: 1.02 }}
        >
          <div className="w-full bg-gray-400 text-white p-6 rounded-2xl shadow-lg">
            <div className="flex flex-col items-center text-center">
              <div className="text-3xl mb-3">📑</div>
              <div className="text-lg font-semibold mb-2">
                ESIC Management
              </div>
              <div className="text-gray-200 text-sm opacity-90">
                ESIC Monthly Challan & Payment Receipts
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="opacity-60 cursor-not-allowed"
          whileHover={{ scale: 1.02 }}
        >
          <div className="w-full bg-gray-400 text-white p-6 rounded-2xl shadow-lg">
            <div className="flex flex-col items-center text-center">
              <div className="text-3xl mb-3">📑</div>
              <div className="text-lg font-semibold mb-2">
                EPFO Management
              </div>
              <div className="text-gray-200 text-sm opacity-90">
                EPFO Monthly Challan & Payment Receipts
              </div>
            </div>
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
          <DashboardSection>
            <DashboardCard>
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
            </DashboardCard>
          </DashboardSection>

          {/* Enhanced Attendance Logs */}
          {user.allowAttendance && (
            <DashboardSection>
              <DashboardCard>
                <h3 className="text-2xl font-bold text-gray-900 text-center mb-6 flex items-center justify-center gap-3">
                  <span className="text-3xl">📅</span>
                  Attendance Management
                </h3>
                <ActionButton
                  to="/attendance-logs"
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
              </DashboardCard>
            </DashboardSection>
          )}

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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
    </>
  );
}
