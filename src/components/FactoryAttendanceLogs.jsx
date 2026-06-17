import React, { useState, useEffect, Fragment } from "react";
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
  ChevronDown,
  ChevronUp,
  Loader,
  FileText,
  Users,
  UserCircle
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
  const isDriver = userRoles.includes("driver");

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

  // 🔴 ADD THIS SORTING FUNCTION
  const sortByPunchTime = (data) => {
    if (!data || data.length === 0) return data;
    
    // Group by date
    const groupedByDate = {};
    data.forEach(record => {
      if (!groupedByDate[record.date]) {
        groupedByDate[record.date] = [];
      }
      groupedByDate[record.date].push(record);
    });
    
    // Sort dates (newest first)
    const sortedDates = Object.keys(groupedByDate).sort((a, b) => new Date(b) - new Date(a));
    
    const result = [];
    sortedDates.forEach(date => {
      const records = groupedByDate[date];
      
      // Sort records within the date by earliest check-in time (oldest first)
      records.sort((a, b) => {
        const getEarliestTime = (record) => {
          if (record.sessions && record.sessions.length > 0) {
            const times = record.sessions.map(s => new Date(s.checkInTime));
            return new Date(Math.min(...times));
          }
          return new Date(record.checkInTime || record.createdAt || 0);
        };
        return getEarliestTime(a) - getEarliestTime(b);
      });
      
      result.push(...records);
    });
    
    return result;
  };

  const fetchLogs = async () => {
    setLoading(true);
    try {
      let params = new URLSearchParams();
      params.append('page', page);
      params.append('limit', limit);
      
      const userRoles = parseUserRoles(user);
      const isDriver = userRoles.includes("driver");
      
      if (isDriver) {
        params.append('userId', user._id);
        setEmployeeFilter(user._id);
      } else if (employeeFilter) {
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
      
      let logsData = [];
      let totalPagesCount = 1;
      
      if (res.data.data) {
        logsData = res.data.data;
        totalPagesCount = res.data.pagination.totalPages;
      } else {
        logsData = res.data;
        totalPagesCount = 1;
      }
      
      // 🔴 FIX: Sort by punch time (who punched first)
      const sortedData = sortByPunchTime(logsData);
      setLogs(sortedData);
      setTotalPages(totalPagesCount);
      
    } catch (err) {
      console.error("Error fetching factory attendance:", err);
    } finally {
      setLoading(false);
    }
  };

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
      hour12: true,
      timeZone: 'Asia/Kolkata'
    });
  };

  const formatDuration = (hours) => {
    if (!hours) return "—";
    const hrs = Math.floor(hours);
    const mins = Math.round((hours - hrs) * 60);
    return `${hrs}h ${mins}m`;
  };

  const exportToCSV = () => {
    const headers = ["Date", "Employee", "Shift", "Sessions", "Total Hours", "Status"];
    const csvData = logs.map(entry => {
      let sessionsStr = "";
      let totalHours = 0;
      
      if (entry.sessions && entry.sessions.length > 0) {
        sessionsStr = entry.sessions.map((session, idx) => {
          totalHours += session.totalWorkingHours || 0;
          return `Session${idx+1}:${formatTime(session.checkInTime)}-${formatTime(session.checkOutTime)}(${(session.totalWorkingHours || 0).toFixed(1)}h)`;
        }).join(" | ");
      } else {
        totalHours = entry.totalWorkingHours || 0;
        sessionsStr = `Session1:${formatTime(entry.checkInTime)}-${formatTime(entry.checkOutTime)}(${totalHours.toFixed(1)}h)`;
      }
      
      return [
        formatDate(entry.date),
        entry.user?.name || "N/A",
        entry.shift === "shift1" ? "Shift 1" : entry.shift === "shift2" ? "Shift 2" : "Driver",
        sessionsStr,
        totalHours.toFixed(1),
        entry.checkOutTime ? "Completed" : "Active"
      ];
    });

    const csvContent = [
      headers.join(","),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(","))
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
                    Monthly Reports
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
                  disabled={isDriver}
                  className={`pl-10 pr-4 py-2 w-full border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 appearance-none bg-white ${
                    isDriver ? 'bg-gray-100 cursor-not-allowed' : ''
                  }`}
                >
                  {isDriver ? (
                    <option value={user._id}>{user.name} (Driver)</option>
                  ) : (
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

          {/* Table - ALL ROWS EXPANDED */}
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
                    <thead className="bg-gray-50 border-b sticky top-0 z-10">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Employee</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Shift</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Sessions</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Total Hours</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {logs.map((entry, index) => {
                        const totalHours = entry.sessions?.reduce((sum, s) => sum + (s.totalWorkingHours || 0), 0) || entry.totalWorkingHours || 0;
                        const sessionCount = entry.sessions?.length || (entry.checkInTime ? 1 : 0);
                        const isActive = entry.sessions?.some(s => !s.checkOutTime) || (!entry.checkOutTime && entry.checkInTime);
                        const hasSessions = entry.sessions && entry.sessions.length > 0;
                        const bgColor = index % 2 === 0 ? 'bg-white' : 'bg-gray-50';
                        
                        return (
                          <React.Fragment key={entry._id || index}>
                            {/* Main Row */}
                            <tr className={`${bgColor} hover:bg-blue-50 transition-colors`}>
                              <td className="px-4 py-3 text-sm border-l-4 border-blue-500">
                                {formatDate(entry.date)}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <UserCircle className="w-5 h-5 text-blue-600" />
                                  <div>
                                    <div className="font-semibold text-gray-900">{entry.user?.name || "N/A"}</div>
                                    <div className="text-xs text-gray-500">{entry.user?.designation || ""}</div>
                                  </div>
                                  {/* 🔴 ADD THIS: Show first puncher badge */}
                                  {(() => {
                                    // Check if this is the first record for this date
                                    const isFirstOfDay = index === 0 || logs[index - 1]?.date !== entry.date;
                                    if (isFirstOfDay) {
                                      return (
                                        <span className="ml-2 text-xs bg-yellow-400 text-black px-2 py-0.5 rounded-full font-bold animate-pulse">
                                          🏆 First Punch!
                                        </span>
                                      );
                                    }
                                    return null;
                                  })()}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                  entry.shift === "shift1" ? "bg-blue-100 text-blue-700" : 
                                  entry.shift === "shift2" ? "bg-purple-100 text-purple-700" : "bg-green-100 text-green-700"
                                }`}>
                                  {entry.shift === "shift1" ? "Shift 1" : entry.shift === "shift2" ? "Shift 2" : "Driver"}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm">
                                <span className="font-medium">{sessionCount}</span>
                                <span className="text-gray-400 text-xs ml-1">session(s)</span>
                              </td>
                              <td className="px-4 py-3 text-sm font-medium">{totalHours.toFixed(1)} hrs</td>
                              <td className="px-4 py-3">
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                  !isActive ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                                }`}>
                                  {!isActive ? "Completed" : "Active"}
                                </span>
                              </td>
                            </tr>
                            
                            {/* Expanded Row - ALWAYS VISIBLE */}
                            <tr className={`${bgColor} border-t border-blue-200`}>
                              <td colSpan="6" className="px-4 py-4">
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2 mb-3">
                                    <Clock className="w-4 h-4 text-blue-500" />
                                    <h4 className="font-medium text-gray-700 text-sm">
                                      Session Details for {formatDate(entry.date)}
                                    </h4>
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                                      entry.shift === "shift1" ? "bg-blue-100 text-blue-700" : 
                                      entry.shift === "shift2" ? "bg-purple-100 text-purple-700" : "bg-green-100 text-green-700"
                                    }`}>
                                      {entry.shift === "shift1" ? "Shift 1" : entry.shift === "shift2" ? "Shift 2" : "Driver"}
                                    </span>
                                  </div>
                                  
                                  {hasSessions ? (
                                    <div className="space-y-2 ml-4">
                                      {entry.sessions.map((session, idx) => (
                                        <div key={idx} className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                                          <div className="flex justify-between items-center mb-2">
                                            <span className="font-semibold text-blue-600">Session #{idx + 1}</span>
                                            <div className="flex gap-2 flex-wrap">
                                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                                session.checkOutTime ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                              }`}>
                                                {session.checkOutTime ? '✅ Completed' : '🟡 Active'}
                                              </span>
                                              {session.sessionType && session.sessionType !== "normal" && (
                                                <span className={`text-xs px-2 py-0.5 rounded-full ${
                                                  session.sessionType === "lunch_break" ? "bg-orange-100 text-orange-700" :
                                                  session.sessionType === "end_of_day" ? "bg-green-100 text-green-700" :
                                                  "bg-gray-100 text-gray-700"
                                                }`}>
                                                  {session.sessionType === "lunch_break" ? "🍽️ Lunch Break" :
                                                   session.sessionType === "end_of_day" ? "🏁 End of Day" :
                                                   session.sessionType === "short_break" ? "☕ Short Break" : session.sessionType}
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                            <div>
                                              <span className="text-gray-500">📥 Check In:</span>
                                              <div className="font-medium">{formatTime(session.checkInTime)}</div>
                                            </div>
                                            <div>
                                              <span className="text-gray-500">📤 Check Out:</span>
                                              <div className="font-medium">{formatTime(session.checkOutTime)}</div>
                                            </div>
                                            <div>
                                              <span className="text-gray-500">⏱️ Hours:</span>
                                              <div className="font-medium">{formatDuration(session.totalWorkingHours)}</div>
                                            </div>
                                            <div>
                                              <span className="text-gray-500">🔄 Overtime:</span>
                                              <div className="font-medium text-green-600">
                                                {session.isOvertime ? formatDuration(session.overtimeHours) : "—"}
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    // Fallback for old format
                                    <div className="bg-white p-3 rounded-lg border border-gray-200 ml-4">
                                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                        <div>
                                          <span className="text-gray-500">📥 Check In:</span>
                                          <div className="font-medium">{formatTime(entry.checkInTime)}</div>
                                        </div>
                                        <div>
                                          <span className="text-gray-500">📤 Check Out:</span>
                                          <div className="font-medium">{formatTime(entry.checkOutTime)}</div>
                                        </div>
                                        <div>
                                          <span className="text-gray-500">⏱️ Hours:</span>
                                          <div className="font-medium">{entry.totalWorkingHours?.toFixed(1) || "—"} hrs</div>
                                        </div>
                                        <div>
                                          <span className="text-gray-500">🔄 Overtime:</span>
                                          <div className="font-medium">{entry.isOvertime ? entry.overtimeHours?.toFixed(1) + " hrs" : "—"}</div>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          </React.Fragment>
                        );
                      })}
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