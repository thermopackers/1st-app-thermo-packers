import React, { useState, useEffect } from "react";
import axiosInstance from "../axiosInstance";
import { useUserContext } from "../context/UserContext";
import InternalNavbar from "../components/InternalNavbar";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  Filter, 
  Download, 
  Calendar, 
  User, 
  Clock, 
  ChevronLeft,
  ChevronRight,
  Loader,
  FileText,
  Users
} from "lucide-react";
import { NavLink } from "react-router-dom";

const FactoryAttendanceLogs = () => {
  const { user } = useUserContext();
  const [logs, setLogs] = useState([]);
  const [dateFilter, setDateFilter] = useState("");
  const [employeeFilter, setEmployeeFilter] = useState("");
  const [shiftFilter, setShiftFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [employees, setEmployees] = useState([]);
  const limit = 20;
console.log("loggss", logs);

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
  const isPrivileged = userRoles.some(role => ["admin", "accounts", "guard", "driver"].includes(role));
  const isDriver = userRoles.includes("driver"); // Add this line

  useEffect(() => {
    fetchEmployees();
    fetchLogs();
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [page, dateFilter, employeeFilter, shiftFilter]);

  const fetchEmployees = async () => {
    try {
      const res = await axiosInstance.get("/users/factory-eligible");
      setEmployees(res.data);
    } catch (err) {
      console.error("Error fetching employees:", err);
    }
  };

const fetchLogs = async () => {
  setLoading(true);
  try {
    let params = new URLSearchParams();
    params.append('page', page);
    params.append('limit', limit);
    
    // If user is a driver, always filter by their own ID
    const userRoles = parseUserRoles(user);
    const isDriver = userRoles.includes("driver");
    
    if (isDriver) {
      // Drivers can only see their own logs
      params.append('userId', user._id);
      // Disable employee filter for drivers
      setEmployeeFilter(user._id);
    } else if (employeeFilter) {
      // For other privileged users, respect the filter
      params.append('userId', employeeFilter);
    }
    
    if (dateFilter) {
      params.append('startDate', dateFilter);
      params.append('endDate', dateFilter);
    }
    if (shiftFilter) {
      params.append('shift', shiftFilter);
    }

    const res = await axiosInstance.get(`/factory-attendance/history?${params.toString()}`);
    
    // Handle both old and new response formats
    if (res.data.data) {
      // New paginated format
      setLogs(res.data.data);
      setTotalPages(res.data.pagination.totalPages);
    } else {
      // Old format (array)
      setLogs(res.data);
      setTotalPages(1);
    }
  } catch (err) {
    console.error("Error fetching factory attendance:", err);
    toast.error("Failed to fetch attendance logs");
  } finally {
    setLoading(false);
  }
}; // ✅ Properly closed fetchLogs function

// ✅ clearFilters is now properly defined OUTSIDE fetchLogs
const clearFilters = () => {
  setDateFilter("");
  setEmployeeFilter("");
  setShiftFilter("");
  setPage(1);
};

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const exportToCSV = () => {
    const headers = ["Date", "Employee", "Designation", "Shift", "Check In", "Check Out", "Hours", "Overtime", "Status"];
    const csvData = logs.map(entry => [
      formatDate(entry.date),
      entry.user?.name || "N/A",
      entry.user?.designation || "N/A",
      entry.shift === "shift1" ? "8 AM - 8:30 PM" : "8:30 PM onwards",
      entry.checkInTime ? formatTime(entry.checkInTime) : "—",
      entry.checkOutTime ? formatTime(entry.checkOutTime) : "—",
      entry.totalWorkingHours?.toFixed(1) || "—",
      entry.isOvertime ? `${entry.overtimeHours?.toFixed(1)} hrs` : "No",
      entry.checkOutTime ? "Completed" : "Active"
    ]);

    const csvContent = [
      headers.join(","),
      ...csvData.map(row => row.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `factory-attendance-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!isPrivileged) {
    return (
      <>
        <InternalNavbar />
        <div className="min-h-screen flex items-center justify-center">
          <div className="bg-red-50 p-8 rounded-2xl text-center">
            <Users className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-red-700 mb-2">Access Denied</h2>
            <p className="text-red-600">Only admins, accounts, drivers and guards can view factory attendance logs</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <InternalNavbar />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-6 px-4 sm:px-6 lg:px-8"
      >
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-xl p-6 mb-6"
          >
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
                  Factory Attendance Logs
                </h1>
                <p className="text-gray-600">
                  Track attendance for Operators, Helpers & Drivers
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={exportToCSV}
                  disabled={logs.length === 0}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
                    logs.length === 0
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : "bg-green-600 hover:bg-green-700 text-white shadow-lg"
                  }`}
                >
                  <Download className="w-4 h-4" />
                  Export CSV
                </button>
                
                <NavLink to="/factory-monthly-reports">
                  <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-medium shadow-lg">
                    <FileText className="w-4 h-4" />
                   Drivers & Workers Monthly Reports
                  </button>
                </NavLink>
              </div>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
              <div className="relative">
                <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                />
              </div>

            <div className="relative">
  <User className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
  <select
    value={employeeFilter}
    onChange={(e) => setEmployeeFilter(e.target.value)}
    disabled={isDriver} // Disable for drivers
    className={`pl-10 pr-4 py-2 w-full border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 appearance-none bg-white ${
      isDriver ? 'bg-gray-100 cursor-not-allowed' : ''
    }`}
  >
    {isDriver ? (
      // Show only the driver's name
      <option value={user._id}>
        {user.name} (Driver)
      </option>
    ) : (
      // Show all employees for other privileged users
      <>
        <option value="">All Employees</option>
        {employees.map(emp => (
          <option key={emp._id} value={emp._id}>
            {emp.name} ({emp.designation})
          </option>
        ))}
      </>
    )}
  </select>
</div>

              <div className="relative">
                <Clock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <select
                  value={shiftFilter}
                  onChange={(e) => setShiftFilter(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
                >
                  <option value="">All Shifts</option>
                  <option value="shift1">Shift 1 (8 AM - 8:30 PM)</option>
                  <option value="shift2">Shift 2 (8:30 PM onwards)</option>
                </select>
              </div>

              <button
                onClick={clearFilters}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </motion.div>

          {/* Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-xl overflow-hidden"
          >
            {loading ? (
              <div className="text-center py-12">
                <Loader className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
                <p className="text-gray-600">Loading attendance logs...</p>
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No attendance records found</p>
                <p className="text-sm text-gray-500 mt-2">Try adjusting your filters</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Employee</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Designation</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Gender</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Shift</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Check In</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Check Out</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Hours</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Overtime</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {logs.map((entry, index) => (
                        <tr key={entry._id || index} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm">{formatDate(entry.date)}</td>
                          <td className="px-4 py-3 text-sm font-medium">{entry.user?.name || "N/A"}</td>
                          <td className="px-4 py-3 text-sm capitalize">{entry.user?.designation || "N/A"}</td>
                                                    <td className="px-4 py-3 text-sm capitalize">{entry.user?.gender}</td>
                         <td className="px-4 py-3">
  <span className={`px-2 py-1 rounded-full text-xs ${
    entry.shift === "shift1" 
      ? "bg-blue-100 text-blue-700" 
      : entry.shift === "shift2"
      ? "bg-purple-100 text-purple-700"
      : "bg-green-100 text-green-700"
  }`}>
    {entry.shift === "shift1" ? "Shift 1" : 
     entry.shift === "shift2" ? "Shift 2" : 
     "Driver"}
  </span>
</td>
                          <td className="px-4 py-3 text-sm">{entry.checkInTime ? formatTime(entry.checkInTime) : "—"}</td>
                          <td className="px-4 py-3 text-sm">{entry.checkOutTime ? formatTime(entry.checkOutTime) : "—"}</td>
                          <td className="px-4 py-3 text-sm">{entry.totalWorkingHours?.toFixed(1) || "—"}</td>
                          <td className="px-4 py-3 text-sm">
                            {entry.isOvertime ? (
                              <span className="text-green-600 font-medium">
                                {entry.overtimeHours?.toFixed(1)} hrs
                              </span>
                            ) : "—"}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              entry.checkOutTime 
                                ? "bg-green-100 text-green-700" 
                                : "bg-yellow-100 text-yellow-700"
                            }`}>
                              {entry.checkOutTime ? "Completed" : "Active"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-6 py-4 border-t">
                    <div className="text-sm text-gray-600">
                      Page {page} of {totalPages}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                        disabled={page === 1}
                        className="p-2 rounded-lg border hover:bg-gray-50 disabled:opacity-50"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={page === totalPages}
                        className="p-2 rounded-lg border hover:bg-gray-50 disabled:opacity-50"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </motion.div>
        </div>
      </motion.div>
    </>
  );
};

export default FactoryAttendanceLogs;