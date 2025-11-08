import { useEffect, useState } from "react";
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
  const [showDocNotifications, setShowDocNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [invitationLink, setInvitationLink] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [driverVehicle, setDriverVehicle] = useState(null);
  const [docNotifCount, setDocNotifCount] = useState(0);

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

      {/* Enhanced Search Bar */}
      <motion.div
        className="sticky top-14 md:top-20 z-40 bg-white/95 backdrop-blur-md shadow-lg py-4 px-4 border-b border-gray-200"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="🔍 Search purchase or sales products..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                handleSearch(e.target.value);
              }}
              className="w-full border-2 border-gray-200 rounded-2xl px-6 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-white/80 backdrop-blur-sm"
            />
            {searchLoading && (
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
        </div>
      </motion.div>

      <ProductCustomerSearch />

      {/* Enhanced Search Results */}
      <AnimatePresence>
        {showSearchResults && (
          <motion.div
            className="fixed inset-x-0 top-32 z-50 max-w-2xl mx-auto bg-white rounded-2xl shadow-2xl border border-gray-200 max-h-96 overflow-y-auto"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-800 text-lg">
                  Search Results
                </h3>
                <button
                  onClick={() => setShowSearchResults(false)}
                  className="text-gray-500 hover:text-gray-700 transition-colors p-2 rounded-full hover:bg-gray-100"
                >
                  ✕
                </button>
              </div>

              {searchResults.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">🔍</div>
                  <p className="text-gray-500">No products found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {searchResults.map((product) => (
                    <motion.div
                      key={`${product.type}-${product.id}`}
                      onClick={() => {
                        if (product.type === "purchase") {
                          navigate(`/purchase-products/edit/${product.id}`);
                        } else {
                          navigate(`/products/edit/${product.id}`);
                        }
                        setShowSearchResults(false);
                        setSearchQuery("");
                      }}
                      className="p-4 border border-gray-100 rounded-xl hover:bg-blue-50 cursor-pointer transition-all duration-300 group"
                      whileHover={{ x: 5 }}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
                            {product.name}
                          </h4>
                          <p className="text-sm text-gray-600 mt-1">
                            {product.unit} •{" "}
                            <span
                              className={`font-medium ${
                                product.type === "purchase"
                                  ? "text-green-600"
                                  : "text-purple-600"
                              }`}
                            >
                              {product.type === "purchase"
                                ? "Purchase"
                                : "Sales"}{" "}
                              Product
                            </span>
                          </p>
                        </div>
                        {product.price && (
                          <span className="text-blue-600 font-bold">
                            ₹{product.price}
                          </span>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enhanced Attendance Banner */}
      {user.allowAttendance && (
        <motion.div
          className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-6 shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="mx-auto max-w-7xl px-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h2 className="text-xl md:text-2xl font-bold">
                  📋 Mark Your Attendance
                </h2>
                <p className="text-blue-100 mt-1">
                  Quickly record your daily check-in
                </p>
              </div>
              <motion.button
                onClick={() => navigate("/attendance")}
                className="bg-white text-blue-600 px-6 py-3 rounded-xl font-semibold shadow-lg hover:bg-gray-100 transition-all duration-300 flex items-center gap-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span>Go to Attendance</span>
                <span>→</span>
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Enhanced Documents Notification */}
      <div className="flex justify-end mx-auto max-w-7xl mt-6 px-4">
        {userRoles.includes("accounts") && (
          <motion.button
            onClick={() => setShowDocNotifications((prev) => !prev)}
            className="relative flex items-center gap-3 bg-white px-5 py-3 rounded-xl shadow-lg hover:shadow-xl border border-gray-200 transition-all duration-300 group"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="text-2xl group-hover:scale-110 transition-transform">
              📋
            </div>
            <span className="font-medium text-gray-700">Document Alerts</span>
            {docNotifCount > 0 && (
              <motion.span
                className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 500 }}
              >
                {docNotifCount}
              </motion.span>
            )}
          </motion.button>
        )}
      </div>

      {showDocNotifications && (
        <motion.div
          className="mx-auto max-w-7xl px-4 mt-4"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
        >
          <div className="rounded-2xl border border-blue-200 bg-white shadow-xl overflow-hidden">
            <DocumentNotifications setDocNotifCount={setDocNotifCount} />
          </div>
        </motion.div>
      )}

      {/* Main Dashboard Content */}
      <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 py-8">
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

          {/* Enhanced Profile Header */}
          <DashboardSection>
            <DashboardCard className="p-8">
              <div className="flex flex-col items-center gap-8">
                {/* Profile Picture - Always Centered */}
                <motion.div
                  className="flex flex-col items-center"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  {user.profilePicture ? (
                    <img
                      src={user.profilePicture}
                      alt="Profile"
                      className="w-45 h-45 md:w-45 md:h-45 rounded-full object-cover border-4 border-blue-200 shadow-lg"
                    />
                  ) : (
                    <div className="w-32 h-32 md:w-36 md:h-36 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center border-4 border-blue-200 shadow-lg">
                      <span className="text-3xl md:text-4xl font-bold text-white">
                        {user.name?.charAt(0)?.toUpperCase()}
                      </span>
                    </div>
                  )}
                  <p className="mt-3 text-xs text-slate-500 text-center max-w-[200px]">
                    Download and set a Profile Picture for WhatsApp, Gmail, etc.
                  </p>
                </motion.div>

                {/* User Info - Always Centered */}
                <div className="text-center flex-1">
                  <motion.h1
                    className="text-2xl md:text-4xl font-bold text-gray-900 mb-2"
                    variants={fadeInUp}
                  >
                    Welcome back,{" "}
                    <span className="text-blue-600">{user.name}</span>! 👋
                  </motion.h1>
                  <motion.p
                    className="text-lg text-gray-600 mb-1"
                    variants={fadeInUp}
                  >
                    {user.email}
                  </motion.p>
{!(userRoles.includes("suppliers") || userRoles.includes("viewer")) && (                    <motion.span
                      className="inline-block bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium mt-2"
                      variants={fadeInUp}
                    >
                      {parseUserRoles(user)
                        .map(
                          (role) => role.charAt(0).toUpperCase() + role.slice(1)
                        )
                        .join(", ")}{" "}
                    </motion.span>
                  )}
                </div>

                {/* Visiting Card - Centered */}
                {user.visitingCard && (
                  <motion.div
                    className="flex justify-center"
                    variants={fadeInUp}
                  >
                    <button
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
                      className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:bg-blue-700 transition-all duration-300 flex items-center gap-2"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <span>📇</span>
                      View or Download Visiting Card
                    </button>
                  </motion.div>
                )}
              </div>

              {/* Follow-up Notifications */}
              {followUps.length > 0 && (
                <motion.div
                  className="mt-6 bg-amber-50 border-l-4 border-amber-400 rounded-xl p-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <h3 className="font-semibold text-amber-900 text-lg mb-3 flex items-center gap-2">
                    🔔 Follow-up Reminders
                  </h3>
                  <div className="space-y-2">
                    {followUps.map((note, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-3 text-amber-800"
                      >
                        <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
                        <span className="flex-1">{note.message}</span>
                        {note.link && (
                          <NavLink
                            to={note.link}
                            className="text-blue-600 hover:text-blue-700 font-medium text-sm underline"
                          >
                            View Details
                          </NavLink>
                        )}
                      </div>
                    ))}
                  </div>

                  {totalPages > 1 && (
                    <div className="mt-4 flex items-center justify-end gap-2">
                      <button
                        onClick={() => setPage((p) => Math.max(p - 1, 1))}
                        disabled={page === 1}
                        className="px-4 py-2 bg-white border border-amber-300 rounded-lg text-amber-700 disabled:opacity-50 hover:bg-amber-100 transition-colors"
                      >
                        Previous
                      </button>
                      <span className="px-3 text-amber-700 font-medium">
                        Page {page} of {totalPages}
                      </span>
                      <button
                        onClick={() =>
                          setPage((p) => Math.min(p + 1, totalPages))
                        }
                        disabled={page === totalPages}
                        className="px-4 py-2 bg-white border border-amber-300 rounded-lg text-amber-700 disabled:opacity-50 hover:bg-amber-100 transition-colors"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </DashboardCard>
          </DashboardSection>

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

                {(userRoles.includes("accounts") || userRoles.includes("production")) && (
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
)}
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
                        Assign Dispatch Plan
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

{userRoles.some(role => ["guard", "accounts", "admin"].includes(role)) && (
  <DashboardSection>
    <DashboardCard>
      <h3 className="text-2xl font-bold text-gray-900 text-center mb-6 flex items-center justify-center gap-3">
        <span className="text-3xl">🚗</span>
        Goods Received Note (G.R.N.) Cum Quality Check / Control Goods Inwards
      </h3>
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
                  Employee management, ID Proof, Salary Sheets, ESIC, EPFO, and
                  more
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
