import React, { useState, useEffect } from "react";
import axiosInstance from "../axiosInstance";
import { useUserContext } from "../context/UserContext";
import InternalNavbar from "../components/InternalNavbar";

export default function MonthlyReports() {
  const { user } = useUserContext();
  const [month, setMonth] = useState("");
  const [employee, setEmployee] = useState("");
  const [employees, setEmployees] = useState([]);
  const [report, setReport] = useState(null);
  const [view, setView] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedMonthName, setSelectedMonthName] = useState("");
const [expandedUser, setExpandedUser] = useState(null);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        if (["admin", "accounts"].includes(user?.role)) {
          const res = await axiosInstance.get("/users/all");
          setEmployees(res.data);
        }
      } catch (err) {
        console.error("Error fetching employees:", err);
      }
    };
    fetchEmployees();
  }, [user]);

  useEffect(() => {
    if (month) {
      const [year, m] = month.split("-");
      const monthName = new Date(year, parseInt(m) - 1).toLocaleString('default', { month: 'long', year: 'numeric' });
      setSelectedMonthName(monthName);
    }
  }, [month]);

const fetchReport = async (type) => {
  setExpandedUser(null);
  if (!month) return alert("Please select a month");

  setLoading(true);
  const [year, m] = month.split("-");
  const from = `${year}-${m}-01`;
  const lastDay = new Date(year, parseInt(m), 0).getDate();
  const to = `${year}-${m}-${String(lastDay).padStart(2, "0")}`;
  
  // Get current date to filter out future dates
  const currentDate = new Date();
  const currentDateStr = currentDate.toISOString().split('T')[0];
  
  // Calculate number of Sundays in the month up to today only
  let sundayCount = 0;
  for (let day = 1; day <= lastDay; day++) {
    const dateStr = `${year}-${m}-${String(day).padStart(2, "0")}`;
    const date = new Date(dateStr);
    
    // Only count Sundays that are today or in the past
    if (dateStr <= currentDateStr && date.getDay() === 0) {
      sundayCount++;
    }
  }
  
  try {
    setView(type);
    const res = await axiosInstance.get("/attendance/monthly", {
      params: { from, to, userId: employee },
    });
    
    // Add sundayCount and calculate working days
    const reportWithSundays = res.data.map(item => ({
      ...item,
      sundayCount,
      totalWorkingDays: item.totalDays - sundayCount,
      absentDays: item.absentDates ? item.absentDates.length : 0
    }));
    
    console.log("📊 Monthly report response:", reportWithSundays);
    setReport(reportWithSundays);
  } catch (err) {
    console.error("❌ Error fetching monthly report:", err.response?.data || err);
    alert("Failed to fetch report. Please try again.");
  } finally {
    setLoading(false);
  }
};

const getAttendancePercentage = (presentDays, totalWorkingDays) => {
  if (totalWorkingDays === 0) return 0;
  return Math.round((presentDays / totalWorkingDays) * 100);
};

  const getStatusColor = (percentage) => {
    if (percentage >= 90) return "text-green-600";
    if (percentage >= 75) return "text-yellow-600";
    return "text-red-600";
  };

const renderSummaryCards = () => {
  if (!report || report.length === 0) return null;

  const totalStats = report.reduce((acc, curr) => ({
    totalDays: acc.totalDays + curr.totalDays,
    totalWorkingDays: acc.totalWorkingDays + curr.totalWorkingDays,
    presentDays: acc.presentDays + curr.presentDays,
    lateArrivals: acc.lateArrivals + curr.lateArrivals,
    earlyDepartures: acc.earlyDepartures + curr.earlyDepartures,
    sundayCount: curr.sundayCount // All items will have the same sundayCount
  }), { 
    totalDays: 0, 
    totalWorkingDays: 0,
    presentDays: 0, 
    lateArrivals: 0, 
    earlyDepartures: 0,
    sundayCount: 0
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      <div className="bg-white p-4 rounded-lg shadow border">
        <div className="text-2xl font-bold text-blue-600">{totalStats.presentDays}</div>
        <div className="text-sm text-gray-600">Total Present Days</div>
      </div>
      <div className="bg-white p-4 rounded-lg shadow border">
        <div className="text-2xl font-bold text-red-600">{totalStats.lateArrivals}</div>
        <div className="text-sm text-gray-600">Total Late Arrivals</div>
      </div>
      <div className="bg-white p-4 rounded-lg shadow border">
        <div className="text-2xl font-bold text-orange-600">{totalStats.earlyDepartures}</div>
        <div className="text-sm text-gray-600">Total Early Departures</div>
      </div>
      <div className="bg-white p-4 rounded-lg shadow border">
        <div className="text-2xl font-bold text-purple-600">
          {getAttendancePercentage(totalStats.presentDays, totalStats.totalWorkingDays)}%
        </div>
        <div className="text-sm text-gray-600">Overall Attendance</div>
      </div>
      <div className="bg-white p-4 rounded-lg shadow border">
        <div className="text-2xl font-bold text-gray-600">{totalStats.sundayCount}</div>
        <div className="text-sm text-gray-600">Sundays (Included)</div>
      </div>
    </div>
  );
};

  // ADD THESE NEW HELPER FUNCTIONS:

const formatTime = (dateString) => {
  if (!dateString) return "No check-out";
  return new Date(dateString).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short'
  });
};

const formatDuration = (minutes) => {
  if (!minutes) return "N/A";
  const hrs = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return `${hrs}h ${mins}m`;
};

const formatWorkedHours = (hours) => {
  if (!hours) return "N/A";
  const hrs = Math.floor(hours);
  const mins = Math.round((hours - hrs) * 60);
  return `${hrs}h ${mins}m`;
};

const toggleUserDetails = (userId) => {
  setExpandedUser(expandedUser === userId ? null : userId);
};

const renderLateDetails = (lateDetails) => {
  if (!lateDetails || lateDetails.length === 0) return null;

  return (
    <div className="mt-3 bg-orange-50 p-3 rounded-lg">
      <h4 className="font-medium text-orange-800 mb-2">Late Check-In Details:</h4>
      <div className="space-y-1">
        {lateDetails.map((detail, index) => {
          // Calculate late duration correctly in frontend
          const checkInDate = new Date(detail.checkInTime);
          const expectedTime = new Date(detail.date);
          expectedTime.setHours(9, 30, 0, 0); // Set to 9:30 AM
          
          const lateByMs = checkInDate - expectedTime;
          const lateByMinutes = Math.round(lateByMs / 60000);
          const hours = Math.floor(lateByMinutes / 60);
          const minutes = lateByMinutes % 60;

          return (
            <div key={index} className="text-sm text-orange-700">
              📅 {formatDate(detail.date)}: {formatTime(detail.checkInTime)} 
              (Late by {hours}h {minutes}m)
            </div>
          );
        })}
      </div>
    </div>
  );
};

const renderEarlyDetails = (earlyDetails) => {
  if (!earlyDetails || earlyDetails.length === 0) return null;

  return (
    <div className="mt-3 bg-yellow-50 p-3 rounded-lg">
      <h4 className="font-medium text-yellow-800 mb-2">Early Check-Out Details:</h4>
      <div className="space-y-1">
        {earlyDetails.map((detail, index) => {
          if (!detail.checkOutTime) return null;
          
          const checkOutDate = new Date(detail.checkOutTime);
          const expectedTime = new Date(detail.date);
          expectedTime.setHours(18, 0, 0, 0); // Set to 6:00 PM
          
          // Only show as early if they left BEFORE 6:00 PM
          if (checkOutDate >= expectedTime) {
            return null; // Skip if not actually early (after 6 PM)
          }
          
          const earlyByMs = expectedTime - checkOutDate;
          const earlyByMinutes = Math.round(earlyByMs / 60000);
          const hours = Math.floor(earlyByMinutes / 60);
          const minutes = earlyByMinutes % 60;

          return (
            <div key={index} className="text-sm text-yellow-700">
              📅 {formatDate(detail.date)}: {formatTime(detail.checkOutTime)} 
              (Early by {hours}h {minutes}m)
            </div>
          );
        })}
      </div>
    </div>
  );
};

const renderPresentDetails = (presentDetails, absentDates, totalDays) => {
  if ((!presentDetails || presentDetails.length === 0) && (!absentDates || absentDates.length === 0)) {
    return null;
  }

  // Map absentDates into same structure as presentDetails
  const absentMapped = absentDates.map(entry => ({
    date: entry.date,
    status: entry.type === "sunday" ? "sunday" : "absent",
    checkInTime: null,
    checkOutTime: null,
    workedHours: null
  }));

  // Mark presents
  const presentMapped = presentDetails.map(detail => ({
    date: detail.date,
    status: "present",
    checkInTime: detail.checkInTime,
    checkOutTime: detail.checkOutTime,
    workedHours: detail.workedHours
  }));

  // Merge both arrays
  const allDays = [...presentMapped, ...absentMapped].sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );

  return (
    <div className="mt-3 bg-green-50 p-3 rounded-lg">
      <h4 className="font-medium text-green-800 mb-3">Day-wise Attendance:</h4>
      <div className="overflow-x-auto">
        <table className="min-w-full border border-green-200 rounded-lg overflow-hidden">
          <thead className="bg-green-100">
            <tr>
              <th className="px-3 py-2 text-left text-sm font-medium text-green-800">Date</th>
              <th className="px-3 py-2 text-left text-sm font-medium text-green-800">Day</th>
              <th className="px-3 py-2 text-left text-sm font-medium text-green-800">Status</th>
              <th className="px-3 py-2 text-left text-sm font-medium text-green-800">Check-In</th>
              <th className="px-3 py-2 text-left text-sm font-medium text-green-800">Check-Out</th>
              <th className="px-3 py-2 text-left text-sm font-medium text-green-800">Worked Hours</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-green-200">
            {allDays.map((detail, index) => {
              const dayName = new Date(detail.date).toLocaleDateString("en-IN", {
                weekday: "short",
              });

              let rowClass = "";
              if (detail.status === "present") rowClass = "text-green-700";
              if (detail.status === "absent") rowClass = "text-red-700 bg-red-50";
              if (detail.status === "sunday") rowClass = "text-orange-700 bg-orange-50";

              return (
                <tr key={index} className={`hover:bg-green-50 ${rowClass}`}>
                  <td className="px-3 py-2 text-sm">{formatDate(detail.date)}</td>
                  <td className="px-3 py-2 text-sm">{dayName}</td>
                  <td className="px-3 py-2 text-sm capitalize">{detail.status}</td>
                  <td className="px-3 py-2 text-sm">
                    {detail.checkInTime ? formatTime(detail.checkInTime) : "—"}
                  </td>
                  <td className="px-3 py-2 text-sm">
                    {detail.checkOutTime ? formatTime(detail.checkOutTime) : "—"}
                  </td>
                  <td className="px-3 py-2 text-sm">
                    {detail.workedHours ? formatWorkedHours(detail.workedHours) : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};



const renderAbsentDetails = (absentDates) => {
  if (!absentDates || absentDates.length === 0) return null;

  return (
    <div className="mt-3 bg-red-50 p-3 rounded-lg">
      <h4 className="font-medium text-red-800 mb-2">Absent Dates:</h4>
      <div className="flex flex-wrap gap-1">
     {absentDates.map((entry, index) => {
  const colorClass = entry.type === "sunday"
    ? "text-orange-800 bg-orange-300"
    : "text-red-700 bg-red-100";

  return (
    <span key={index} className={`text-sm px-2 py-1 rounded ${colorClass}`}>
      {formatDate(entry.date)}
    </span>
  );
})}

      </div>
    </div>
  );
};

// WITH THIS ENHANCED VERSION:
const renderTable = () => {
  if (!report || report.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        {loading ? "📊 Generating report..." : "No data available for selected period"}
      </div>
    );
  }

  // Filter data based on view type
  let filteredReport = [...report];
  
  switch (view) {
    case "present":
      filteredReport = report.filter(item => item.presentDays > 0);
      break;
    case "absent":
      filteredReport = report.filter(item => item.absentDays > 0);
      break;
    case "late":
      filteredReport = report.filter(item => item.lateArrivals > 0);
      break;
    case "early":
      filteredReport = report.filter(item => item.earlyDepartures > 0);
      break;
    default:
      // "attendance" shows all data
      break;
  }

  if (filteredReport.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No {view} records found for selected period
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Employee
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Days
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Working Days
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Present
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Absent
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Late
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Early
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Attendance %
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Details
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredReport.map((r) => { 
              const attendancePercent = getAttendancePercentage(r.presentDays, r.totalWorkingDays);
              return (
                <React.Fragment key={r.user._id}>
                  <tr className="hover:bg-gray-50 cursor-pointer" onClick={() => toggleUserDetails(r.user._id)}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{r.user.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                      {r.user.role}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {r.totalDays} <span className="text-xs text-gray-400">({r.sundayCount} Sundays)</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {r.totalWorkingDays}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                      {r.presentDays}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                      {r.absentDays || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-orange-600">
                      {r.lateArrivals}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-600">
                      {r.earlyDepartures}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`font-medium ${getStatusColor(attendancePercent)}`}>
                        {attendancePercent}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button className="text-blue-600 hover:text-blue-800">
                        {expandedUser === r.user._id ? '▲' : '▼'}
                      </button>
                    </td>
                  </tr>
                  {expandedUser === r.user._id && (
                    <tr>
                      <td colSpan="10" className="px-6 py-4 bg-gray-50">
                     <div className="space-y-4">
{view === "present" && renderPresentDetails(r.presentDetails, r.absentDates, r.totalDays)}
  {view === "absent" && renderAbsentDetails(r.absentDates)}
  {view === "late" && renderLateDetails(r.lateDetails)}
  {view === "early" && renderEarlyDetails(r.earlyDetails)}
  {view === "attendance" && (
    <>
      {renderPresentDetails(r.presentDetails)}
      {renderAbsentDetails(r.absentDates)}
      {renderLateDetails(r.lateDetails)}
      {renderEarlyDetails(r.earlyDetails)}
    </>
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
    </div>
  );
};

  return (
    <>
    <InternalNavbar />
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Monthly Attendance Reports</h2>
              <p className="text-sm text-gray-600 mt-1">
                Track employee attendance, punctuality, and working patterns
              </p>
            </div>
            <div className="mt-4 sm:mt-0">
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-blue-700">
                  ⏰ <strong>Working Hours:</strong> Check-in by 9:30 AM | Check-out after 6:00 PM
                </p>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Month
              </label>
              <input
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {["admin", "accounts"].includes(user?.role) && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Employee
                </label>
                <select
                  value={employee}
                  onChange={(e) => setEmployee(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Employees</option>
                  {employees.map((emp) => (
                    <option key={emp._id} value={emp._id}>
                      {emp.name} ({emp.role})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Report Buttons */}
         <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
  <button className="bg-blue-100 hover:bg-blue-200 text-blue-800 px-4 py-3 rounded-lg font-medium transition-colors" onClick={() => fetchReport("attendance")}>
    Attendance Report
  </button>
  <button className="bg-green-100 hover:bg-green-200 text-green-800 px-4 py-3 rounded-lg font-medium transition-colors" onClick={() => fetchReport("present")}>
    Present Report
  </button>
  <button className="bg-red-100 hover:bg-red-200 text-red-800 px-4 py-3 rounded-lg font-medium transition-colors" onClick={() => fetchReport("absent")}>
    Absent Report
  </button>
  <button className="bg-orange-100 hover:bg-orange-200 text-orange-800 px-4 py-3 rounded-lg font-medium transition-colors" onClick={() => fetchReport("late")}>
    Late Arrival Report
  </button>
  <button className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-4 py-3 rounded-lg font-medium transition-colors" onClick={() => fetchReport("early")}>
    Early Departure Report
  </button>
</div>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-3 text-gray-600">Generating report for {selectedMonthName}...</p>
            </div>
          )}

          {/* Summary Cards */}
          {!loading && report && report.length > 0 && view === "attendance" && renderSummaryCards()}

          {/* Results */}
          {!loading && renderTable()}

          {/* Empty State with Guidance */}
          {!loading && report && report.length === 0 && month && (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <div className="text-6xl mb-4">📊</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Data Available
              </h3>
              <p className="text-gray-600">
                No attendance records found for {selectedMonthName}. 
                {employee ? " for the selected employee." : " Please check if attendance has been marked."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  );
}