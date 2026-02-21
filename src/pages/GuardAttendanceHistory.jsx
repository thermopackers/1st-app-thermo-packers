import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Calendar, 
  Users, 
  Clock, 
  Download, 
  Filter, 
  ChevronLeft, 
  ChevronRight,
  Loader,
  FileText,
  User,
  Search,
  X
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
  const [filteredAttendance, setFilteredAttendance] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [dateRange, setDateRange] = useState({
    startDate: "",
    endDate: ""
  });
  const [showFilters, setShowFilters] = useState(false);

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

  // Load attendance when filters change
  useEffect(() => {
    if (selectedMonth && selectedYear) {
      fetchAttendance();
    }
  }, [selectedMonth, selectedYear, selectedEmployee]);

  // Load employees eligible for factory attendance
  const loadEmployees = async () => {
    try {
      const res = await axiosInstance.get("/users/factory-eligible");
      setEmployees(res.data);
    } catch (err) {
      console.error("Error loading employees:", err);
    }
  };

  // Fetch attendance history
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

      const res = await axiosInstance.get(url);
      setAttendance(res.data);
      
      // Calculate stats
      calculateStats(res.data, startDate, endDate);
      
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
      if (record.user && !record.checkOutTime) { // Currently checked in
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
    try {
      let url = `/factory-attendance/history?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`;
      if (selectedEmployee) {
        url += `&userId=${selectedEmployee}`;
      }

      const res = await axiosInstance.get(url);
      setAttendance(res.data);
      calculateStats(res.data, dateRange.startDate, dateRange.endDate);
      
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
  const exportToCSV = () => {
    if (filteredData.length === 0) {
      Swal.fire({
        icon: "info",
        title: "No Data",
        text: "No attendance records to export",
      });
      return;
    }

    const headers = ["Date", "Employee Name", "Designation", "Shift", "Check In Time", "Check Out Time", "Working Hours", "Overtime", "Status"];
    
    const csvData = filteredData.map(record => [
      record.date,
      record.user?.name || "N/A",
      record.user?.designation || "N/A",
      record.shift === "shift1" ? "8 AM - 8:30 PM" : "8:30 PM onwards",
      record.checkInTime ? new Date(record.checkInTime).toLocaleTimeString() : "—",
      record.checkOutTime ? new Date(record.checkOutTime).toLocaleTimeString() : "—",
      record.totalWorkingHours ? record.totalWorkingHours.toFixed(1) + " hrs" : "—",
      record.isOvertime ? record.overtimeHours.toFixed(1) + " hrs" : "No",
      record.checkOutTime ? "Completed" : "Active"
    ]);

    const csvContent = [
      headers.join(","),
      ...csvData.map(row => row.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `factory-attendance-${selectedYear}-${selectedMonth}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Pagination
  const filteredData = filteredAttendance.length > 0 ? filteredAttendance : attendance;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

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
              
              {/* Export Button */}
              <button
                onClick={exportToCSV}
                disabled={filteredData.length === 0}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
                  filteredData.length === 0
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-green-600 text-white hover:bg-green-700"
                }`}
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
            ) : currentItems.length === 0 ? (
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
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Employee
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Designation
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Shift
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Check In
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Check Out
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Hours
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Overtime
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {currentItems.map((record) => (
                        <tr key={record._id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm">
                            {new Date(record.date).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-medium text-gray-900">
                              {record.user?.name || "N/A"}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm capitalize">
                            {record.user?.designation || "N/A"}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              record.shift === "shift1" 
                                ? "bg-blue-100 text-blue-700" 
                                : "bg-purple-100 text-purple-700"
                            }`}>
                              {record.shift === "shift1" ? "Shift 1" : "Shift 2"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {record.checkInTime ? new Date(record.checkInTime).toLocaleTimeString() : "—"}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {record.checkOutTime ? new Date(record.checkOutTime).toLocaleTimeString() : "—"}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {record.totalWorkingHours ? record.totalWorkingHours.toFixed(1) + " hrs" : "—"}
                          </td>
                          <td className="px-4 py-3">
                            {record.isOvertime ? (
                              <span className="text-green-600 font-medium">
                                +{record.overtimeHours?.toFixed(1)} hrs
                              </span>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              record.checkOutTime 
                                ? "bg-green-100 text-green-700" 
                                : "bg-yellow-100 text-yellow-700"
                            }`}>
                              {record.checkOutTime ? "Completed" : "Active"}
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
                      Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredData.length)} of {filteredData.length} entries
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
          {currentItems.length > 0 && (
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