import React, { useState, useEffect, Fragment } from "react";
import { motion } from "framer-motion";
import { 
  Calendar, 
  Users, 
  Clock, 
  Download, 
  Filter, 
  ChevronLeft, 
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Loader,
  FileText,
  User,
  Search,
  X,
  AlertCircle
} from "lucide-react";
import InternalNavbar from "../components/InternalNavbar";
import axiosInstance from "../axiosInstance";
import { useUserContext } from "../context/UserContext";
import Swal from "sweetalert2";

export default function GuardAttendanceHistory() {
  const { user } = useUserContext();
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ shift1: 0, shift2: 0, total: 0 });
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [employees, setEmployees] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage] = useState(20);
  const [dateRange, setDateRange] = useState({
    startDate: "",
    endDate: ""
  });
const [showFilters, setShowFilters] = useState(false);
const [expandedRow, setExpandedRow] = useState(null);  // <-- ADD THIS
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

  // Set default month and year to current
  useEffect(() => {
    const now = new Date();
    setSelectedYear(now.getFullYear().toString());
    setSelectedMonth((now.getMonth() + 1).toString().padStart(2, '0'));
  }, []);

  // Load employees on mount
  useEffect(() => {
    loadEmployees();
  }, []);

  // Load attendance when filters or page changes
  useEffect(() => {
    if (selectedMonth && selectedYear) {
      fetchAttendance();
    }
  }, [selectedMonth, selectedYear, selectedEmployee, currentPage]);

  // Load employees eligible for factory attendance
  const loadEmployees = async () => {
    try {
      const res = await axiosInstance.get("/users/factory-eligible");
      setEmployees(res.data);
    } catch (err) {
      console.error("Error loading employees:", err);
    }
  };

  // Fetch attendance history with pagination
  const fetchAttendance = async () => {
    setLoading(true);
    try {
      // Calculate date range from selected month/year
      const startDate = `${selectedYear}-${selectedMonth}-01`;
      const lastDay = new Date(selectedYear, parseInt(selectedMonth), 0).getDate();
      const endDate = `${selectedYear}-${selectedMonth}-${lastDay}`;

      let url = `/factory-attendance/history?startDate=${startDate}&endDate=${endDate}`;
      if (selectedEmployee) {
        url += `&userId=${selectedEmployee}`;
      }
      // Add pagination parameters
      url += `&page=${currentPage}&limit=${itemsPerPage}`;

      const res = await axiosInstance.get(url);
      
      // Handle paginated response
      if (res.data.data) {
        // New format with pagination
        setAttendance(res.data.data);
        setTotalPages(res.data.pagination.totalPages);
        
        // Fetch full data for stats (without pagination)
        const statsUrl = `/factory-attendance/history?startDate=${startDate}&endDate=${endDate}` + 
          (selectedEmployee ? `&userId=${selectedEmployee}` : "");
        const statsRes = await axiosInstance.get(statsUrl);
        const allData = statsRes.data.data || statsRes.data;
        calculateStats(allData, startDate, endDate);
      } else {
        // Old format (array) - fallback
        const attendanceData = res.data;
        setAttendance(attendanceData);
        setTotalPages(Math.ceil(attendanceData.length / itemsPerPage));
        calculateStats(attendanceData, startDate, endDate);
      }
      
    } catch (err) {
      console.error("Error fetching attendance:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to fetch attendance history",
      });
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const calculateStats = (data, startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    
    // Get unique users
    const uniqueUsers = new Set();
    data.forEach(record => {
      if (record.user) {
        uniqueUsers.add(record.user._id);
      }
    });

    // Count present by shift (check-ins without checkout are considered present)
    const shift1Present = new Set();
    const shift2Present = new Set();
    
    data.forEach(record => {
     if (record.user && (!record.checkOutTime || record.sessions?.some(s => !s.checkOutTime))) { // Currently checked in
        if (record.shift === "shift1") {
          shift1Present.add(record.user._id);
        } else {
          shift2Present.add(record.user._id);
        }
      }
    });

    setStats({
      totalEmployees: uniqueUsers.size,
      shift1: shift1Present.size,
      shift2: shift2Present.size,
      totalRecords: data.length,
      totalDays: totalDays
    });
  };

  // Handle filter reset
  const resetFilters = () => {
    const now = new Date();
    setSelectedYear(now.getFullYear().toString());
    setSelectedMonth((now.getMonth() + 1).toString().padStart(2, '0'));
    setSelectedEmployee("");
    setDateRange({ startDate: "", endDate: "" });
    setCurrentPage(1);
  };

  // Handle date range search
  const handleDateRangeSearch = async () => {
    if (!dateRange.startDate || !dateRange.endDate) {
      Swal.fire({
        icon: "warning",
        title: "Incomplete Dates",
        text: "Please select both start and end dates",
      });
      return;
    }

    setLoading(true);
    setCurrentPage(1); // Reset to first page
    try {
      let url = `/factory-attendance/history?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`;
      if (selectedEmployee) {
        url += `&userId=${selectedEmployee}`;
      }
      url += `&page=1&limit=${itemsPerPage}`;

      const res = await axiosInstance.get(url);
      
      if (res.data.data) {
        setAttendance(res.data.data);
        setTotalPages(res.data.pagination.totalPages);
        
        // Fetch full data for stats
        const statsUrl = `/factory-attendance/history?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}` +
          (selectedEmployee ? `&userId=${selectedEmployee}` : "");
        const statsRes = await axiosInstance.get(statsUrl);
        const allData = statsRes.data.data || statsRes.data;
        calculateStats(allData, dateRange.startDate, dateRange.endDate);
      } else {
        const attendanceData = res.data;
        setAttendance(attendanceData);
        setTotalPages(Math.ceil(attendanceData.length / itemsPerPage));
        calculateStats(attendanceData, dateRange.startDate, dateRange.endDate);
      }
      
    } catch (err) {
      console.error("Error fetching attendance:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to fetch attendance history",
      });
    } finally {
      setLoading(false);
    }
  };

  // Export to CSV
const exportToCSV = async () => {
  try {
    let url = `/factory-attendance/history?`;
    if (selectedMonth && selectedYear) {
      const startDate = `${selectedYear}-${selectedMonth}-01`;
      const lastDay = new Date(selectedYear, parseInt(selectedMonth), 0).getDate();
      const endDate = `${selectedYear}-${selectedMonth}-${lastDay}`;
      url += `startDate=${startDate}&endDate=${endDate}`;
    } else if (dateRange.startDate && dateRange.endDate) {
      url += `startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`;
    }
    if (selectedEmployee) {
      url += `&userId=${selectedEmployee}`;
    }
    url += `&limit=10000`;

    const res = await axiosInstance.get(url);
    const exportData = res.data.data || res.data;
    
    if (exportData.length === 0) {
      Swal.fire({
        icon: "info",
        title: "No Data",
        text: "No attendance records to export",
      });
      return;
    }

    const headers = ["Date", "Employee Name", "Designation", "Shift", "Sessions", "Total Hours", "Overtime", "Status"];
    
    const csvData = exportData.map(record => {
      let sessionsStr = "";
      let totalHours = 0;
      let hasOvertime = false;
      let overtimeTotal = 0;
      
      if (record.sessions && record.sessions.length > 0) {
        sessionsStr = record.sessions.map((session, idx) => {
          totalHours += session.totalWorkingHours || 0;
          if (session.isOvertime) {
            hasOvertime = true;
            overtimeTotal += session.overtimeHours || 0;
          }
          return `Session${idx+1}:${session.checkInTime ? new Date(session.checkInTime).toLocaleTimeString() : '—'}-${session.checkOutTime ? new Date(session.checkOutTime).toLocaleTimeString() : '—'}(${(session.totalWorkingHours || 0).toFixed(1)}h)`;
        }).join(" | ");
      } else {
        // Fallback for old format
        totalHours = record.totalWorkingHours || 0;
        hasOvertime = record.isOvertime || false;
        overtimeTotal = record.overtimeHours || 0;
        sessionsStr = `Session1:${record.checkInTime ? new Date(record.checkInTime).toLocaleTimeString() : '—'}-${record.checkOutTime ? new Date(record.checkOutTime).toLocaleTimeString() : '—'}(${totalHours.toFixed(1)}h)`;
      }
      
      return [
        record.date,
        record.user?.name || "N/A",
        record.user?.designation || "N/A",
        record.shift === "shift1" ? "Shift 1" : record.shift === "shift2" ? "Shift 2" : "Driver",
        sessionsStr,
        totalHours.toFixed(1) + " hrs",
        hasOvertime ? overtimeTotal.toFixed(1) + " hrs" : "No",
        record.sessions?.some(s => !s.checkOutTime) || (!record.checkOutTime && record.checkInTime) ? "Active" : "Completed"
      ];
    });

    const csvContent = [
      headers.join(","),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url_blob = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url_blob;
    a.download = `factory-attendance-${selectedYear}-${selectedMonth}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url_blob);
    
  } catch (err) {
    console.error("Error exporting data:", err);
    Swal.fire({
      icon: "error",
      title: "Export Failed",
      text: "Failed to export attendance data",
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

  return (
    <>
      <InternalNavbar />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-xl p-6 mb-6"
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                  <FileText className="w-6 h-6 text-blue-600" />
                  Factory Attendance History
                </h1>
                <p className="text-gray-600 mt-1">
                  View and manage attendance records for operators, helpers & drivers
                </p>
              </div>
              
              <button
                onClick={exportToCSV}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
              <div className="bg-blue-50 p-4 rounded-xl">
                <div className="flex items-center gap-2 text-blue-700 mb-1">
                  <Users className="w-4 h-4" />
                  <span className="font-semibold">Total Employees</span>
                </div>
                <p className="text-2xl font-bold text-blue-600">{stats.totalEmployees || 0}</p>
              </div>
              
              <div className="bg-green-50 p-4 rounded-xl">
                <div className="flex items-center gap-2 text-green-700 mb-1">
                  <Clock className="w-4 h-4" />
                  <span className="font-semibold">Shift 1 Active</span>
                </div>
                <p className="text-2xl font-bold text-green-600">{stats.shift1 || 0}</p>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-xl">
                <div className="flex items-center gap-2 text-purple-700 mb-1">
                  <Clock className="w-4 h-4" />
                  <span className="font-semibold">Shift 2 Active</span>
                </div>
                <p className="text-2xl font-bold text-purple-600">{stats.shift2 || 0}</p>
              </div>
              
              <div className="bg-amber-50 p-4 rounded-xl">
                <div className="flex items-center gap-2 text-amber-700 mb-1">
                  <Calendar className="w-4 h-4" />
                  <span className="font-semibold">Total Records</span>
                </div>
                <p className="text-2xl font-bold text-amber-600">{stats.totalRecords || 0}</p>
              </div>
            </div>
          </motion.div>

          {/* Filters Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl shadow-xl p-6 mb-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Filters
              </h2>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                {showFilters ? "Hide" : "Show"} Advanced Filters
              </button>
            </div>

            {/* Basic Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                >
                  {[2024, 2025, 2026].map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                >
                  {Array.from({ length: 12 }, (_, i) => {
                    const month = (i + 1).toString().padStart(2, '0');
                    const monthName = new Date(2000, i, 1).toLocaleString('default', { month: 'long' });
                    return (
                      <option key={month} value={month}>{monthName}</option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Employee</label>
                <select
                  value={selectedEmployee}
                  onChange={(e) => setSelectedEmployee(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Employees</option>
                  {employees.map(emp => (
                    <option key={emp._id} value={emp._id}>
                      {emp.name} ({emp.designation})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={resetFilters}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium"
                >
                  Reset
                </button>
              </div>
            </div>

            {/* Advanced Filters - Date Range */}
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 pt-4 border-t border-gray-200"
              >
                <h3 className="text-md font-medium text-gray-700 mb-3">Custom Date Range</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={dateRange.startDate}
                      onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                    <input
                      type="date"
                      value={dateRange.endDate}
                      onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div className="flex items-end">
                    <button
                      onClick={handleDateRangeSearch}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium flex items-center gap-2"
                    >
                      <Search className="w-4 h-4" />
                      Search
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* Attendance Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl shadow-xl overflow-hidden"
          >
            {loading ? (
              <div className="text-center py-12">
                <Loader className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
                <p className="text-gray-600">Loading attendance records...</p>
              </div>
            ) : attendance.length === 0 ? (
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
    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Employee</th>
    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Designation</th>
    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Gender</th>
    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Shift</th>
    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Sessions</th>
    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Total Hours</th>
    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Overtime</th>
    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Details</th>
  </tr>
</thead>
                <tbody className="divide-y divide-gray-200">
  {attendance.map((record) => {
    // Calculate totals from sessions
    const sessionCount = record.sessions?.length || (record.checkInTime ? 1 : 0);
    const totalHours = record.sessions?.reduce((sum, s) => sum + (s.totalWorkingHours || 0), 0) || record.totalWorkingHours || 0;
    const hasOvertime = record.sessions?.some(s => s.isOvertime) || record.isOvertime || false;
    const overtimeTotal = record.sessions?.reduce((sum, s) => sum + (s.overtimeHours || 0), 0) || record.overtimeHours || 0;
    const isActive = record.sessions?.some(s => !s.checkOutTime) || (!record.checkOutTime && record.checkInTime);
    const hasSessions = record.sessions && record.sessions.length > 0;
    
    return (
      <React.Fragment key={record._id}>
        {/* Main Row */}
        <tr 
          className="hover:bg-gray-50 cursor-pointer"
          onClick={() => setExpandedRow(expandedRow === record._id ? null : record._id)}
        >
          <td className="px-4 py-3 text-sm">
            {new Date(record.date).toLocaleDateString('en-IN', {
              day: '2-digit',
              month: 'short',
              year: 'numeric'
            })}
          </td>
          <td className="px-4 py-3">
            <div className="font-medium text-gray-900">{record.user?.name || "N/A"}</div>
          </td>
          <td className="px-4 py-3 text-sm capitalize">{record.user?.designation || "N/A"}</td>
          <td className="px-4 py-3 text-sm capitalize">{record.user?.gender || "N/A"}</td>
          <td className="px-4 py-3">
            <span className={`px-2 py-1 rounded-full text-xs ${
              record.shift === "shift1" ? "bg-blue-100 text-blue-700" : 
              record.shift === "shift2" ? "bg-purple-100 text-purple-700" : "bg-green-100 text-green-700"
            }`}>
              {record.shift === "shift1" ? "Shift 1" : record.shift === "shift2" ? "Shift 2" : "Driver"}
            </span>
          </td>
          <td className="px-4 py-3 text-sm">
            <span className="font-medium">{sessionCount}</span>
            <span className="text-gray-400 text-xs ml-1">session(s)</span>
          </td>
          <td className="px-4 py-3 text-sm font-medium">{totalHours.toFixed(1)} hrs</td>
          <td className="px-4 py-3">
            {hasOvertime ? (
              <span className="text-green-600 font-medium">+{overtimeTotal.toFixed(1)} hrs</span>
            ) : <span className="text-gray-400">—</span>}
          </td>
          <td className="px-4 py-3">
            <span className={`px-2 py-1 rounded-full text-xs ${
              !isActive ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
            }`}>
              {!isActive ? "Completed" : "Active"}
            </span>
          </td>
          <td className="px-4 py-3">
            <button className="text-blue-600 hover:text-blue-800">
              {expandedRow === record._id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </td>
        </tr>
        
        {/* Expanded Row - Session Details */}
        {expandedRow === record._id && (
          <tr className="bg-gray-50">
            <td colSpan="10" className="px-4 py-4">
              <div className="space-y-2">
                <h4 className="font-medium text-gray-700 text-sm mb-2 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-500" />
                  Session Details for {new Date(record.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
                </h4>
                
                {hasSessions ? (
                  <div className="space-y-2">
                    {record.sessions.map((session, idx) => (
                      <div key={idx} className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-semibold text-blue-600">Session #{idx + 1}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            session.checkOutTime ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {session.checkOutTime ? 'Completed' : 'Active'}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                          <div>
                            <span className="text-gray-500">Check In:</span>
                            <div className="font-medium">{formatTime(session.checkInTime)}</div>
                          </div>
                          <div>
                            <span className="text-gray-500">Check Out:</span>
                            <div className="font-medium">{formatTime(session.checkOutTime)}</div>
                          </div>
                          <div>
                            <span className="text-gray-500">Hours Worked:</span>
                            <div className="font-medium">{formatDuration(session.totalWorkingHours)}</div>
                          </div>
                          <div>
                            <span className="text-gray-500">Overtime:</span>
                            <div className="font-medium text-green-600">
                              {session.isOvertime ? formatDuration(session.overtimeHours) : "—"}
                            </div>
                          </div>
                        </div>
                        {session.sessionType && session.sessionType !== "normal" && (
                          <div className="mt-2 text-xs">
                            <span className={`px-2 py-0.5 rounded-full ${
                              session.sessionType === "lunch_break" ? "bg-orange-100 text-orange-700" :
                              session.sessionType === "end_of_day" ? "bg-green-100 text-green-700" :
                              "bg-gray-100 text-gray-700"
                            }`}>
                              {session.sessionType === "lunch_break" ? "🍽️ Lunch Break" :
                               session.sessionType === "end_of_day" ? "🏁 End of Day" :
                               session.sessionType === "short_break" ? "☕ Short Break" : ""}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  // Fallback for old format (single session)
                  <div className="bg-white p-3 rounded-lg border border-gray-200">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div>
                        <span className="text-gray-500">Check In:</span>
                        <div className="font-medium">{formatTime(record.checkInTime)}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Check Out:</span>
                        <div className="font-medium">{formatTime(record.checkOutTime)}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Hours:</span>
                        <div className="font-medium">{record.totalWorkingHours?.toFixed(1) || "—"} hrs</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Overtime:</span>
                        <div className="font-medium">{record.isOvertime ? record.overtimeHours?.toFixed(1) + " hrs" : "—"}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </td>
          </tr>
        )}
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
                      Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalPages * itemsPerPage)} of {totalPages * itemsPerPage} entries
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`w-8 h-8 rounded-lg text-sm ${
                              currentPage === pageNum
                                ? "bg-blue-600 text-white"
                                : "border border-gray-300 hover:bg-gray-50"
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                      
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </motion.div>

          {/* Summary Section */}
          {attendance.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-6 bg-blue-50 rounded-xl p-4"
            >
              <h3 className="font-semibold text-blue-800 mb-2">📊 Summary</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-blue-600">Total Working Days:</span>
                  <br />
                  <span className="font-medium">{stats.totalDays || 0} days</span>
                </div>
                <div>
                  <span className="text-blue-600">Avg. Working Hours:</span>
                  <br />
                  <span className="font-medium">
                    {attendance.length > 0 
                      ? (attendance.reduce((sum, r) => sum + (r.totalWorkingHours || 0), 0) / attendance.length).toFixed(1) 
                      : 0} hrs
                  </span>
                </div>
                <div>
                  <span className="text-blue-600">Overtime Cases:</span>
                  <br />
                  <span className="font-medium">
                    {attendance.filter(r => r.isOvertime).length} employees
                  </span>
                </div>
                <div>
                  <span className="text-blue-600">Active Now:</span>
                  <br />
                  <span className="font-medium">{stats.shift1 + stats.shift2} employees</span>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </>
  );
}