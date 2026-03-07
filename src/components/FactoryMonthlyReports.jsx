import React, { useState, useEffect } from "react";
import axiosInstance from "../axiosInstance";
import { useUserContext } from "../context/UserContext";
import InternalNavbar from "../components/InternalNavbar";
import { motion } from "framer-motion";
import { 
  Calendar, 
  Users, 
  Download, 
  Clock,
  UserCheck,
  Loader,
  TrendingUp,
  FileText
} from "lucide-react";

export default function FactoryMonthlyReports() {
  const { user } = useUserContext();
  const [month, setMonth] = useState("");
  const [employee, setEmployee] = useState("");
  const [employees, setEmployees] = useState([]);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedMonthName, setSelectedMonthName] = useState("");

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
  const isPrivileged = userRoles.some(role => ["admin", "accounts", "guard"].includes(role));

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (month) {
      const [year, m] = month.split("-");
      const monthName = new Date(year, parseInt(m) - 1).toLocaleString('default', { 
        month: 'long', 
        year: 'numeric' 
      });
      setSelectedMonthName(monthName);
    }
  }, [month]);

  const fetchEmployees = async () => {
    try {
      const res = await axiosInstance.get("/users/factory-eligible");
      setEmployees(res.data);
    } catch (err) {
      console.error("Error fetching employees:", err);
    }
  };

const fetchReport = async () => {
  if (!month) {
    alert("Please select a month");
    return;
  }

  setLoading(true);
  const [year, m] = month.split("-");
  const from = `${year}-${m}-01`;
  const lastDay = new Date(year, parseInt(m), 0).getDate();
  const to = `${year}-${m}-${String(lastDay).padStart(2, "0")}`;

  try {
    const params = { startDate: from, endDate: to };
    if (employee) {
      params.userId = employee;
    }

    const res = await axiosInstance.get("/factory-attendance/history", { params });
    
    // 🔴 FIX: Extract data from response
    const attendanceData = res.data.data || res.data;
    
    // Process the data to create monthly summary
    const summary = processMonthlyData(attendanceData, from, to);
    setReport(summary);
    
  } catch (err) {
    console.error("Error fetching monthly report:", err);
    alert("Failed to fetch report. Please try again.");
  } finally {
    setLoading(false);
  }
};

  const processMonthlyData = (data, from, to) => {
    const start = new Date(from);
    const end = new Date(to);
    const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

    // Group by user
    const userMap = {};
    
    data.forEach(record => {
      const userId = record.user?._id;
      if (!userId) return;
      
      if (!userMap[userId]) {
        userMap[userId] = {
          user: record.user,
          totalPresent: 0,
          totalOvertime: 0,
          totalHours: 0,
          shift1Days: 0,
          shift2Days: 0,
          records: []
        };
      }
      
      userMap[userId].records.push(record);
      
      if (record.checkOutTime) {
        userMap[userId].totalPresent++;
        userMap[userId].totalHours += record.totalWorkingHours || 0;
        if (record.isOvertime) {
          userMap[userId].totalOvertime += record.overtimeHours || 0;
        }
      }
      
      if (record.shift === "shift1") userMap[userId].shift1Days++;
      else userMap[userId].shift2Days++;
    });

    return {
      totalDays,
      employees: Object.values(userMap)
    };
  };

  const exportToCSV = () => {
    if (!report || report.employees.length === 0) return;

    const headers = ["Employee", "Designation", "Present Days", "Shift 1 Days", "Shift 2 Days", "Total Hours", "Overtime Hours"];
    
    const csvData = report.employees.map(emp => [
      emp.user?.name || "N/A",
      emp.user?.designation || "N/A",
      emp.totalPresent,
      emp.shift1Days,
      emp.shift2Days,
      emp.totalHours.toFixed(1),
      emp.totalOvertime.toFixed(1)
    ]);

    const csvContent = [
      headers.join(","),
      ...csvData.map(row => row.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `factory-monthly-report-${month}.csv`;
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
            <p className="text-red-600">Only admins, accounts, and guards can view factory reports</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <InternalNavbar />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-xl p-6 sm:p-8"
          >
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                  Factory Monthly Reports
                </h1>
                <p className="text-gray-600">
                  Monthly attendance summary for Operators, Helpers & Drivers
                </p>
              </div>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Month
                </label>
                <input
                  type="month"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Employee
                </label>
                <select
                  value={employee}
                  onChange={(e) => setEmployee(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Employees</option>
                  {employees.map((emp) => (
                    <option key={emp._id} value={emp._id}>
                      {emp.name} ({emp.designation})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={fetchReport}
                  disabled={!month || loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-xl font-medium flex items-center justify-center gap-2"
                >
                  {loading ? <Loader className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                  Generate Report
                </button>
              </div>
            </div>

            {/* Report Results */}
            {loading && (
              <div className="text-center py-12">
                <Loader className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
                <p className="text-gray-600">Generating report for {selectedMonthName}...</p>
              </div>
            )}

            {!loading && report && (
              <>
                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  <div className="bg-blue-50 p-4 rounded-xl">
                    <p className="text-sm text-blue-600 mb-1">Total Days</p>
                    <p className="text-2xl font-bold text-blue-700">{report.totalDays}</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-xl">
                    <p className="text-sm text-green-600 mb-1">Employees</p>
                    <p className="text-2xl font-bold text-green-700">{report.employees.length}</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-xl">
                    <p className="text-sm text-purple-600 mb-1">Total Present</p>
                    <p className="text-2xl font-bold text-purple-700">
                      {report.employees.reduce((sum, e) => sum + e.totalPresent, 0)}
                    </p>
                  </div>
                  <div className="bg-amber-50 p-4 rounded-xl">
                    <p className="text-sm text-amber-600 mb-1">Total Overtime</p>
                    <p className="text-2xl font-bold text-amber-700">
                      {report.employees.reduce((sum, e) => sum + e.totalOvertime, 0).toFixed(1)} hrs
                    </p>
                  </div>
                </div>

                {/* Export Button */}
                <div className="flex justify-end mb-4">
                  <button
                    onClick={exportToCSV}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl font-medium"
                  >
                    <Download className="w-4 h-4" />
                    Export Report
                  </button>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Employee</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Designation</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Present</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Shift 1</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Shift 2</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Total Hours</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Overtime</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {report.employees.map((emp, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium">{emp.user?.name}</td>
                          <td className="px-4 py-3 capitalize">{emp.user?.designation}</td>
                          <td className="px-4 py-3">{emp.totalPresent}</td>
                          <td className="px-4 py-3">{emp.shift1Days}</td>
                          <td className="px-4 py-3">{emp.shift2Days}</td>
                          <td className="px-4 py-3">{emp.totalHours.toFixed(1)} hrs</td>
                          <td className="px-4 py-3 text-green-600 font-medium">{emp.totalOvertime.toFixed(1)} hrs</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </motion.div>
        </div>
      </div>
    </>
  );
}