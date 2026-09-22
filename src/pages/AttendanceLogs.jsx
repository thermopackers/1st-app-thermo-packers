import React, { useState, useEffect, useMemo } from "react";
import axiosInstance from "../axiosInstance";
import { useUserContext } from "../context/UserContext";
import InternalNavbar from "../components/InternalNavbar";
import { NavLink } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  Filter, 
  Download, 
  Calendar, 
  User, 
  MapPin, 
  Clock, 
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  Loader,
  FileText,
  Users
} from "lucide-react";

const AttendanceLogs = () => {
  const { token, user } = useUserContext();
  const [groupedLogs, setGroupedLogs] = useState([]);
  const [dateFilter, setDateFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [userFilter, setUserFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  
  // ✅ FIX: Add helper function and proper role checking
  const parseUserRoles = (user) => {
    if (!user || !user.role) {
      return [];
    }
    
    let userRoles = [];
    if (Array.isArray(user.role)) {
      // If it's already a proper array, use it directly
      userRoles = user.role;
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

  const userRoles = user ? parseUserRoles(user) : [];
  const isPrivileged = userRoles.some(role => ["admin", "accounts"].includes(role));
  const limit = 20;

const fetchLogs = async () => {
  setLoading(true);
  try {
    const res = await axiosInstance.get("/attendance", {
      headers: { Authorization: `Bearer ${token}` },
      params: {
        date: dateFilter,
        role: roleFilter,
        userId: userFilter,
        page,
        limit,
      },
    });
    // Backend now returns grouped logs directly
    setGroupedLogs(res.data.logs);
    setTotalPages(res.data.totalPages);
  } catch (err) {
    console.error("Error fetching attendance:", err);
  } finally {
    setLoading(false);
  }
};

// ✅ ADD THIS USEEFFECT HOOK
useEffect(() => {
  fetchLogs();
}, [page, dateFilter, roleFilter, userFilter]);

  const clearFilters = () => {
    setDateFilter("");
    setRoleFilter("");
    setUserFilter("");
    setPage(1);
    setIsMobileFilterOpen(false);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const calculateWorkingHours = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return "—";
    
    const start = new Date(checkIn.time);
    const end = new Date(checkOut.time);
    const diffMs = end - start;
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  };

  const handleViewImage = (log, type) => {
    setSelectedLog({ ...log, type });
    setShowImageModal(true);
  };

  const handleViewLocation = (location) => {
    if (location?.lat && location?.lng) {
      window.open(
        `https://www.google.com/maps?q=${location.lat},${location.lng}`,
        "_blank",
        "noopener,noreferrer"
      );
    }
  };

  const exportToCSV = () => {
    const headers = ["Date", "Employee", "Role", "Check-In", "Check-Out", "Working Hours", "Status"];
    const csvData = groupedLogs.map(entry => [
      formatDate(entry.date),
      entry.user?.name || "N/A",
      entry.user?.role || "N/A",
      entry.checkIn ? formatTime(entry.checkIn.time) : "—",
      entry.checkOut ? formatTime(entry.checkOut.time) : "—",
      calculateWorkingHours(entry.checkIn, entry.checkOut),
      entry.checkIn && entry.checkOut ? "Complete" : "Incomplete"
    ]);

    const csvContent = [
      headers.join(","),
      ...csvData.map(row => row.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance-logs-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

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

  const tableRowVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: (i) => ({
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.4,
        delay: i * 0.05,
      }
    })
  };

const getCheckInColor = (checkInTime) => {
  if (!checkInTime) return '';
  const date = new Date(checkInTime);
  const hours = date.getHours();
  const minutes = date.getMinutes();
  
  // After 9:45 AM - Red
  if (hours > 9 || (hours === 9 && minutes > 45)) {
    return 'bg-red-500 text-white';
  }
  // 9:30 AM to 9:45 AM - Orange
  if (hours === 9 && minutes >= 30 && minutes <= 45) {
    return 'bg-orange-400 text-white';
  }
  // Before 9:30 AM - Normal (no background)
  return '';
};

// Add near other helper functions
const getOnTourBadge = (entry) => {
  if (entry.checkIn?.onTour) {
    return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
      🌍 On Tour
    </span>;
  }
  if (entry.checkOut?.onTour) {
    return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
      🌍 On Tour
    </span>;
  }
  return null;
};

  return (
    <>
      <InternalNavbar />
      
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-6 px-4 sm:px-6 lg:px-8"
      >
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <motion.div 
            className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8"
            variants={itemVariants}
          >
            <div className="mb-4 lg:mb-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
                {isPrivileged ? "Employee Attendance Logs" : "Your Attendance Logs"}
              </h1>
              <p className="text-gray-600">
                Track and manage attendance records {isPrivileged ? "across your organization" : "for your account"}
              </p>
            </div>

          <div className="flex flex-wrap gap-3">
  {/* Export Button */}
  <motion.button
    onClick={exportToCSV}
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl font-medium transition-colors duration-200 shadow-lg"
  >
    <Download className="w-4 h-4" />
    <span className="hidden sm:inline">Export CSV</span>
    <span className="text-xs ml-1 bg-white/20 px-1.5 py-0.5 rounded-md">Export to Excel</span>
  </motion.button>

  {/* Monthly Reports Button - Show to ALL users */}
  <NavLink to="/monthly-reports">
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-medium transition-colors duration-200 shadow-lg"
    >
      <FileText className="w-4 h-4" />
      <span className="hidden sm:inline">Monthly Reports</span>
      <span className="text-xs ml-1 bg-white/20 px-1.5 py-0.5 rounded-md">Staff Monthly Reports</span>
    </motion.div>
  </NavLink>

  {isPrivileged && (
    <NavLink to="/factory-attendance-logs">
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl font-medium transition-colors duration-200 shadow-lg"
      >
        <Users className="w-4 h-4" />
        <span className="hidden sm:inline">Drivers & Workers Attendance</span>
        <span className="text-xs ml-1 bg-white/20 px-1.5 py-0.5 rounded-md">Drivers/Workers Attendance</span>
      </motion.div>
    </NavLink>
  )}
</div>
          </motion.div>

          {/* Filters Section */}
          <motion.div 
            className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-200"
            variants={itemVariants}
          >
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              {/* Desktop Filters */}
              <div className="hidden lg:flex items-center gap-4 flex-wrap">
                <div className="relative">
                  <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  />
                </div>

                {isPrivileged && (
                  <>
                    <div className="relative">
                      <User className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                      <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="pl-10 pr-8 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                      >
                        <option value="">All Roles</option>
                        <option value="admin">Admin</option>
                        <option value="sales">Sales</option>
                        <option value="production">Production</option>
                        <option value="dispatch">Dispatch</option>
                        <option value="accounts">Accounts</option>
                        {/* <option value="driver">Driver</option> */}
                      </select>
                    </div>

                    <div className="relative">
                      <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search by name..."
                        value={userFilter}
                        onChange={(e) => setUserFilter(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 w-64"
                      />
                    </div>
                  </>
                )}

                <motion.button
                  onClick={clearFilters}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-xl font-medium transition-colors duration-200"
                >
                  <X className="w-4 h-4" />
                  Clear Filters
                </motion.button>
              </div>

              {/* Mobile Filter Button */}
              <button
                onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
                className="lg:hidden flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl font-medium w-full justify-center"
              >
                <Filter className="w-4 h-4" />
                Filters
              </button>
            </div>

            {/* Mobile Filters Dropdown */}
            <AnimatePresence>
              {isMobileFilterOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="lg:hidden mt-4 space-y-4 overflow-hidden"
                >
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <input
                      type="date"
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {isPrivileged && (
                    <>
                      <div className="relative">
                        <User className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                        <select
                          value={roleFilter}
                          onChange={(e) => setRoleFilter(e.target.value)}
                          className="w-full pl-10 pr-8 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                        >
                          <option value="">All Roles</option>
                          <option value="admin">Admin</option>
                          <option value="sales">Sales</option>
                          <option value="production">Production</option>
                          <option value="dispatch">Dispatch</option>
                          <option value="accounts">Accounts</option>
                          {/* <option value="driver">Driver</option> */}
                        </select>
                      </div>

                      <div className="relative">
                        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="Search by name..."
                          value={userFilter}
                          onChange={(e) => setUserFilter(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </>
                  )}

                  <button
                    onClick={clearFilters}
                    className="w-full flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-xl font-medium justify-center"
                  >
                    <X className="w-4 h-4" />
                    Clear Filters
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Table Section */}
          <motion.div 
            className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden"
            variants={itemVariants}
          >
            {loading ? (
              <div className="flex justify-center items-center py-16">
                <div className="text-center">
                  <Loader className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
                  <p className="text-gray-600">Loading attendance logs...</p>
                </div>
              </div>
            ) : groupedLogs.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">📊</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">No records found</h3>
                <p className="text-gray-600 mb-6">
                  {dateFilter || roleFilter || userFilter 
                    ? "Try adjusting your filters to see more results." 
                    : "No attendance records available for the selected period."
                  }
                </p>
                {(dateFilter || roleFilter || userFilter) && (
                  <button
                    onClick={clearFilters}
                    className="bg-blue-600 text-white px-6 py-2 rounded-xl font-medium hover:bg-blue-700 transition-colors"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Employee
                        </th>
                        {isPrivileged && (
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Role
                          </th>
                        )}
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Check-In
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Check-Out
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Hours
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                   <tbody className="divide-y divide-gray-200">
  <AnimatePresence>
    {groupedLogs.map((entry, index) => (
      <motion.tr
        key={`${entry.user?._id}-${entry.date}`}
        custom={index}
        initial="hidden"
        animate="visible"
        exit="hidden"
        variants={tableRowVariants}
        className="hover:bg-gray-50 transition-colors duration-150"
      >
        <td className="px-4 py-3 text-sm text-gray-900 font-medium">
          {formatDate(entry.date)}
        </td>
        <td className="px-4 py-3 text-sm text-gray-900">
          {entry.user?.name || "N/A"}
        </td>
        {isPrivileged && (
          <td className="px-4 py-3 text-sm text-gray-600 capitalize">
            {entry.user?.role || "N/A"}
          </td>
        )}
     <td className={`px-4 py-3 text-sm ${getCheckInColor(entry.checkIn?.time)}`}>
  {entry.checkIn ? (
    <div className="space-y-1">
      <div className="flex items-center gap-1">
        <Clock className="w-3 h-3 text-green-600" />
        <span>{formatTime(entry.checkIn.time)}</span>
      </div>
      <div className="flex items-center gap-2 mt-2">
        {entry.checkIn.photo && (
          <button
            onClick={() => handleViewImage(entry.checkIn, 'check-in')}
            className="flex items-center gap-1 text-blue-600 hover:text-blue-800 transition-colors text-xs"
            title="View Check-In Photo"
          >
            <Eye className="w-3 h-3" />
            <span>Photo</span>
          </button>
        )}
        {entry.checkIn.location && (
          <button
            onClick={() => handleViewLocation(entry.checkIn.location)}
            className="flex items-center gap-1 text-green-600 hover:text-green-800 transition-colors text-xs"
            title="View Check-In Location"
          >
            <MapPin className="w-3 h-3" />
            <span>Location</span>
          </button>
        )}
      </div>
    </div>
  ) : (
    <span className="text-gray-400">—</span>
  )}
</td>
        <td className="px-4 py-3 text-sm text-gray-600">
          {entry.checkOut ? (
            <div className="space-y-1">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-red-600" />
                <span>{formatTime(entry.checkOut.time)}</span>
              </div>
              <div className="flex items-center gap-2 mt-2">
                {entry.checkOut.photo && (
                  <button
                    onClick={() => handleViewImage(entry.checkOut, 'check-out')}
                    className="flex items-center gap-1 text-blue-600 hover:text-blue-800 transition-colors text-xs"
                    title="View Check-Out Photo"
                  >
                    <Eye className="w-3 h-3" />
                    <span>Photo</span>
                  </button>
                )}
                {entry.checkOut.location && (
                  <button
                    onClick={() => handleViewLocation(entry.checkOut.location)}
                    className="flex items-center gap-1 text-green-600 hover:text-green-800 transition-colors text-xs"
                    title="View Check-Out Location"
                  >
                    <MapPin className="w-3 h-3" />
                    <span>Location</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <span className="text-gray-400">—</span>
          )}
        </td>
        <td className="px-4 py-3 text-sm font-medium">
          {calculateWorkingHours(entry.checkIn, entry.checkOut)}
        </td>
        <td className="px-4 py-3">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            entry.checkIn && entry.checkOut 
              ? "bg-green-100 text-green-800" 
              : "bg-yellow-100 text-yellow-800"
          }`}>
            {entry.checkIn && entry.checkOut ? "Complete" : "Incomplete"}
          </span>
        </td>
        <td className="px-4 py-3">
  {getOnTourBadge(entry)}
</td>
      </motion.tr>
    ))}
  </AnimatePresence>
</tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <motion.div 
                    className="flex flex-wrap items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <div className="text-sm text-gray-600 mb-4 sm:mb-0">
                      Showing page {page} of {totalPages}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                        disabled={page === 1}
                        className="flex items-center gap-1 px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Previous
                      </button>

                      <div className="flex gap-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (page <= 3) {
                            pageNum = i + 1;
                          } else if (page >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = page - 2 + i;
                          }

                          return (
                            <button
                              key={pageNum}
                              onClick={() => setPage(pageNum)}
                              className={`w-8 h-8 text-sm rounded-lg transition-colors ${
                                page === pageNum
                                  ? "bg-blue-600 text-white"
                                  : "bg-white border border-gray-300 hover:bg-gray-50"
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                      </div>

                      <button
                        onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={page === totalPages}
                        className="flex items-center gap-1 px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Next
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                )}
              </>
            )}
          </motion.div>
        </div>
      </motion.div>

      {/* Image Modal */}
      <AnimatePresence>
        {showImageModal && selectedLog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowImageModal(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 capitalize">
                  {selectedLog.type} Photo - {selectedLog.user?.name}
                </h3>
                <button
                  onClick={() => setShowImageModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="p-4">
                <img
                  src={selectedLog.photo}
                  alt={`${selectedLog.type} photo`}
                  className="w-full h-auto rounded-lg shadow-lg"
                />
                <div className="mt-4 text-sm text-gray-600">
                  <p><strong>Time:</strong> {formatTime(selectedLog.time)}</p>
                  <p><strong>Date:</strong> {formatDate(selectedLog.time)}</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AttendanceLogs;