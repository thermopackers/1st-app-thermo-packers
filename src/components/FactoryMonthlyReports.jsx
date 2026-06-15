import React, { useState, useEffect } from "react";
import axiosInstance from "../axiosInstance";
import { useUserContext } from "../context/UserContext";
import InternalNavbar from "../components/InternalNavbar";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Calendar, 
  Users, 
  Download, 
  Filter, 
  ChevronDown, 
  ChevronUp,
  Clock,
  UserCheck,
  UserX,
  AlertTriangle,
  TrendingUp,
  BarChart3,
  Loader,
  FileText,
  Layers
} from "lucide-react";

export default function FactoryMonthlyReports() {
  const { user } = useUserContext();
  
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

  const [month, setMonth] = useState("");
  const [employee, setEmployee] = useState("");
  const [employees, setEmployees] = useState([]);
  const [report, setReport] = useState(null);
  const [view, setView] = useState("attendance");
  const [loading, setLoading] = useState(false);
  const [selectedMonthName, setSelectedMonthName] = useState("");
  const [expandedUser, setExpandedUser] = useState(null);
  const [downloadingPDF, setDownloadingPDF] = useState(false);

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

  const fetchReport = async (type) => {
    setExpandedUser(null);
    if (!month) {
      alert("Please select a month");
      return;
    }

    setLoading(true);
    const [year, m] = month.split("-");
    
    try {
      setView(type);
      
      const params = { year, month: m };
      if (employee) {
        params.userId = employee;
      }
      
      // Use the new monthly-report endpoint that includes leave data
      const res = await axiosInstance.get("/factory-attendance/monthly-report", { params });
      
      setReport(res.data);
      
    } catch (err) {
      console.error("Error fetching monthly report:", err);
      alert("Failed to fetch report. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getAttendancePercentage = (presentDays, totalWorkingDays) => {
    if (totalWorkingDays === 0) return 0;
    const percentage = Math.round((presentDays / totalWorkingDays) * 100);
    return Math.min(percentage, 100);
  };

  // Add this helper function near the top of your component (after other helper functions)
const calculateOvertime = (detail, userDesignation, userGender) => {
  if (!detail.checkInTime || !detail.checkOutTime) return { isOvertime: false, hours: 0 };
  
  const checkIn = new Date(detail.checkInTime);
  const checkOut = new Date(detail.checkOutTime);
  const dateKey = detail.date;
  const isDriver = userDesignation?.toLowerCase() === "driver";
  const isFemale = userGender?.toLowerCase() === "female";
  
  // Calculate total hours worked
  const diffMs = checkOut - checkIn;
  const totalHours = diffMs / (1000 * 60 * 60);
  
  let regularHours = 0;
  let overtimeHours = 0;
  
  if (isDriver) {
    // Drivers: Regular hours = 18 hours (4 AM to 10 PM)
    regularHours = 18;
    if (totalHours > regularHours) {
      overtimeHours = totalHours - regularHours;
    }
  } else {
    // Operators/Helpers
    if (detail.shift === "shift1") {
      // For lady workers: expected check-out at 4:30 PM = 8.5 hours (from 8 AM)
      // For men workers: expected check-out at 8:30 PM = 12.5 hours (from 8 AM)
      regularHours = isFemale ? 8.5 : 12.5;
      if (totalHours > regularHours) {
        overtimeHours = totalHours - regularHours;
      }
    } else if (detail.shift === "shift2") {
      // Shift 2: Regular hours = 12 hours (8:30 PM to 8:30 AM next day)
      regularHours = 12;
      if (totalHours > regularHours) {
        overtimeHours = totalHours - regularHours;
      }
    }
  }
  
  return {
    isOvertime: overtimeHours > 0,
    hours: overtimeHours
  };
};

  const getStatusColor = (percentage) => {
    if (percentage >= 90) return "text-green-600 bg-green-50";
    if (percentage >= 75) return "text-yellow-600 bg-yellow-50";
    return "text-red-600 bg-red-50";
  };

  const getStatusBadge = (percentage) => {
    if (percentage >= 90) return { text: "Excellent", color: "bg-green-100 text-green-800" };
    if (percentage >= 75) return { text: "Good", color: "bg-yellow-100 text-yellow-800" };
    if (percentage >= 60) return { text: "Average", color: "bg-orange-100 text-orange-800" };
    return { text: "Poor", color: "bg-red-100 text-red-800" };
  };

const formatTime = (dateString) => {
  if (!dateString) return "No check-out";
  
  // Create date object and force IST interpretation
  const date = new Date(dateString);
  
  // Format in IST
  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata'
  });
};

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short'
    });
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

  const isDriver = (user) => {
    return user?.designation?.toLowerCase() === "driver";
  };

  // NEW: Calculate total session count for a user
  const getTotalSessions = (employeeData) => {
    return employeeData.presentDetails?.length || 0;
  };

  // NEW: Calculate average session duration
  const getAverageSessionDuration = (employeeData) => {
    if (!employeeData.presentDetails || employeeData.presentDetails.length === 0) return 0;
    const totalHours = employeeData.totalHours || 0;
    const sessionCount = employeeData.presentDetails.length;
    return sessionCount > 0 ? totalHours / sessionCount : 0;
  };

  const renderSummaryCards = () => {
    if (!report || report.length === 0) return null;

    const totalStats = report.reduce((acc, curr) => ({
      totalDays: acc.totalDays + curr.totalDays,
      totalWorkingDays: acc.totalWorkingDays + curr.totalWorkingDays,
      presentDays: acc.presentDays + curr.presentDays,
      absentDays: acc.absentDays + curr.absentDays,
      leaveDays: acc.leaveDays + (curr.leaveDays || 0),
      lateArrivals: acc.lateArrivals + curr.lateArrivals,
      halfDays: acc.halfDays + curr.halfDays,
      earlyDepartures: acc.earlyDepartures + curr.earlyDepartures,
      totalHours: acc.totalHours + curr.totalHours,
      totalOvertime: acc.totalOvertime + curr.totalOvertime
    }), { 
      totalDays: 0, 
      totalWorkingDays: 0,
      presentDays: 0, 
      absentDays: 0,
      leaveDays: 0,
      lateArrivals: 0, 
      halfDays: 0,
      earlyDepartures: 0,
      totalHours: 0,
      totalOvertime: 0
    });

    const overallPercentage = getAttendancePercentage(totalStats.presentDays, totalStats.totalWorkingDays);
    const statusBadge = getStatusBadge(overallPercentage);

    const cards = [
      {
        title: "Total Present Days",
        value: totalStats.presentDays,
        color: "text-green-600 bg-green-50",
        icon: <UserCheck className="w-6 h-6" />
      },
      {
        title: "Total Absent Days",
        value: totalStats.absentDays,
        color: "text-red-600 bg-red-50",
        icon: <UserX className="w-6 h-6" />
      },
      {
        title: "Total Sessions",
        value: report.reduce((sum, emp) => sum + (emp.presentDetails?.length || 0), 0),
        color: "text-indigo-600 bg-indigo-50",
        icon: <Layers className="w-6 h-6" />
      },
      {
        title: "Total Leave Days",
        value: totalStats.leaveDays,
        color: "text-purple-600 bg-purple-50",
        icon: <Calendar className="w-6 h-6" />
      },
      {
        title: "Total Late Arrivals",
        value: totalStats.lateArrivals,
        color: "text-orange-600 bg-orange-50",
        icon: <Clock className="w-6 h-6" />
      },
      {
        title: "Total Half Days",
        value: totalStats.halfDays,
        color: "text-amber-600 bg-amber-50",
        icon: <AlertTriangle className="w-6 h-6" />
      },
      {
        title: "Total Hours",
        value: `${Math.round(totalStats.totalHours)} hrs`,
        color: "text-blue-600 bg-blue-50",
        icon: <TrendingUp className="w-6 h-6" />
      },
      {
        title: "Overtime Hours",
        value: `${totalStats.totalOvertime.toFixed(1)} hrs`,
        color: "text-purple-600 bg-purple-50",
        icon: <BarChart3 className="w-6 h-6" />
      },
      {
        title: "Overall Attendance",
        value: `${overallPercentage}%`,
        color: statusBadge.color,
        icon: <TrendingUp className="w-6 h-6" />,
        subtitle: statusBadge.text
      }
    ];

    return (
      <motion.div 
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-4 mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ staggerChildren: 0.1 }}
      >
        {cards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white p-4 rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 rounded-lg ${card.color.split(' ')[1]}`}>
                <div className={card.color.split(' ')[0]}>
                  {card.icon}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-gray-800">{card.value}</div>
                {card.subtitle && (
                  <div className="text-xs text-gray-500 mt-1">{card.subtitle}</div>
                )}
              </div>
            </div>
            <div className="text-xs font-medium text-gray-600">{card.title}</div>
          </motion.div>
        ))}
      </motion.div>
    );
  };

const renderLateDetails = (lateDetails, userDesignation) => {
  if (!lateDetails || lateDetails.length === 0) return null;

  const isDriver = userDesignation?.toLowerCase() === "driver";

  return (
    <motion.div 
      className="mt-3 bg-orange-50 p-4 rounded-xl border border-orange-200"
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
    >
      <h4 className="font-medium text-orange-800 mb-3 flex items-center gap-2">
        <Clock className="w-4 h-4" />
        {isDriver ? "Late Check-In Details (Expected by 4 AM)" : "Late Check-In Details (Shift 1 Expected by 8 AM)"}
      </h4>
      <div className="space-y-2">
        {lateDetails.map((detail, index) => {
          const lateByMinutes = detail.lateBy;
          const hours = Math.floor(lateByMinutes / 60);
          const minutes = lateByMinutes % 60;

          const checkInTime = detail.checkInTime ? new Date(detail.checkInTime).toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
            timeZone: 'Asia/Kolkata'
          }) : '—';

          return (
            <div key={index} className="flex justify-between items-center text-sm text-orange-700 bg-orange-100 p-2 rounded-lg">
              <span>
                📅 {formatDate(detail.date)} (
                {detail.shift === "shift1" ? "Shift 1" : 
                 detail.shift === "shift2" ? "Shift 2" : 
                 "Driver"}): {checkInTime}
                <span className="font-medium ml-2">(Late by {hours}h {minutes}m)</span>
              </span>
              {detail.isHalfDay && (
                <span className="bg-amber-500 text-white px-2 py-0.5 rounded text-xs font-medium ml-2">
                  Half Day
                </span>
              )}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};

const renderEarlyDetails = (earlyDetails, userDesignation) => {
  if (!earlyDetails || earlyDetails.length === 0) return null;

  const isDriver = userDesignation?.toLowerCase() === "driver";

  return (
    <motion.div 
      className="mt-3 bg-yellow-50 p-4 rounded-xl border border-yellow-200"
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
    >
      <h4 className="font-medium text-yellow-800 mb-3 flex items-center gap-2">
        <AlertTriangle className="w-4 h-4" />
        {isDriver ? "Early Check-Out Details (Expected by 10 PM)" : "Early Check-Out Details (Shift 1 Expected by 8:30 PM)"}
      </h4>
      <div className="space-y-2">
        {earlyDetails.map((detail, index) => {
          const earlyByMinutes = detail.earlyBy;
          const hours = Math.floor(earlyByMinutes / 60);
          const minutes = earlyByMinutes % 60;

          const checkOutTime = detail.checkOutTime ? new Date(detail.checkOutTime).toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
            timeZone: 'Asia/Kolkata'
          }) : '—';

          return (
            <div key={index} className="text-sm text-yellow-700 bg-yellow-100 p-2 rounded-lg">
              📅 {formatDate(detail.date)} (
              {detail.shift === "shift1" ? "Shift 1" : 
               detail.shift === "shift2" ? "Shift 2" : 
               "Driver"}): {checkOutTime}
              <span className="font-medium ml-2">(Early by {hours}h {minutes}m)</span>
              {isDriver && (
                <span className="ml-2 text-xs text-gray-600">
                  (May result in Half Day)
                </span>
              )}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};

  const renderAbsentDetails = (absentDates) => {
    if (!absentDates || absentDates.length === 0) return null;

    return (
      <motion.div 
        className="mt-3 bg-red-50 p-4 rounded-xl border border-red-200"
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
      >
        <h4 className="font-medium text-red-800 mb-3 flex items-center gap-2">
          <UserX className="w-4 h-4" />
          Absent Dates
        </h4>
        <div className="flex flex-wrap gap-2">
          {absentDates.map((date, index) => (
            <span key={index} className="text-sm text-red-700 bg-red-100 px-3 py-1 rounded-lg">
              {formatDate(date)}
            </span>
          ))}
        </div>
      </motion.div>
    );
  };

  const renderLeaveDetails = (leaveDates) => {
    if (!leaveDates || leaveDates.length === 0) return null;

    return (
      <motion.div 
        className="mt-3 bg-purple-50 p-4 rounded-xl border border-purple-200"
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
      >
        <h4 className="font-medium text-purple-800 mb-3 flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          Leave Dates (Approved Leaves)
        </h4>
        <div className="flex flex-wrap gap-2">
          {leaveDates.map((date, index) => (
            <span key={index} className="text-sm text-purple-700 bg-purple-100 px-3 py-1 rounded-lg">
              {formatDate(date)}
            </span>
          ))}
        </div>
      </motion.div>
    );
  };

const downloadAttendanceTable = async (employeeData, month) => {
  setDownloadingPDF(true);
  try {
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');
    
    const doc = new jsPDF('landscape');
    
    const [year, m] = month.split("-");
    const monthName = new Date(year, parseInt(m) - 1).toLocaleString('default', { 
      month: 'long', 
      year: 'numeric' 
    });
    
    // Title
    doc.setFontSize(18);
    doc.text(`Factory Attendance Report - ${employeeData.user.name}`, 14, 15);
    doc.setFontSize(12);
    doc.text(`Month: ${monthName}`, 14, 25);
    doc.text(`Designation: ${employeeData.user.designation || "N/A"}`, 14, 32);
    doc.text(`Generated: ${new Date().toLocaleDateString('en-IN')}`, 14, 39);
    
    // Prepare table data
    const tableData = employeeData.presentDetails.map(detail => {
      const dateObj = new Date(detail.date);
      const dayName = dateObj.toLocaleDateString("en-IN", { weekday: "short" });
      const isSunday = dateObj.getDay() === 0;
      const isDriver = employeeData.user.designation?.toLowerCase() === "driver";
      
      // Calculate worked hours directly from check-in and check-out times
      const workedHoursDisplay = (() => {
        if (!detail.checkInTime || !detail.checkOutTime) return "—";
        
        const checkIn = new Date(detail.checkInTime);
        const checkOut = new Date(detail.checkOutTime);
        const diffMs = checkOut - checkIn;
        const totalMinutes = Math.round(diffMs / (1000 * 60));
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
        
        return `${hours}h ${formattedMinutes}m`;
      })();
      
      // Calculate overtime
      const overtimeDisplay = (() => {
        if (!detail.checkInTime || !detail.checkOutTime) return "No";
        
        const checkIn = new Date(detail.checkInTime);
        const checkOut = new Date(detail.checkOutTime);
        const diffMs = checkOut - checkIn;
        const totalHours = diffMs / (1000 * 60 * 60);
        
        let regularHours = 0;
        let overtimeHours = 0;
        
        if (isDriver) {
          // Drivers: Regular hours = 18 hours (4 AM to 10 PM)
          regularHours = 18;
          if (totalHours > regularHours) {
            overtimeHours = totalHours - regularHours;
          }
        } else {
          // Operators/Helpers
          if (detail.shift === "shift1") {
            // Shift 1: Regular hours = 12.5 hours (8 AM to 8:30 PM)
            regularHours = 12.5;
            if (totalHours > regularHours) {
              overtimeHours = totalHours - regularHours;
            }
          } else if (detail.shift === "shift2") {
            // Shift 2: Regular hours = 12 hours (8:30 PM to 8:30 AM next day)
            regularHours = 12;
            if (totalHours > regularHours) {
              overtimeHours = totalHours - regularHours;
            }
          }
        }
        
        if (overtimeHours > 0) {
          const hrs = Math.floor(overtimeHours);
          const mins = Math.round((overtimeHours - hrs) * 60);
          const formattedMins = mins < 10 ? `0${mins}` : mins;
          return `${hrs}h ${formattedMins}m`;
        }
        return "No";
      })();
      
      // Determine attendance type
      let attendanceType = "Full Day";
      
      if (isSunday) {
        attendanceType = "Weekly Off";
      } else if (isDriver) {
        // For drivers: Check if it was a half day
        const hasOnlyCheckIn = detail.checkInTime && !detail.checkOutTime;
        const hasOnlyCheckOut = !detail.checkInTime && detail.checkOutTime;
        
        if (hasOnlyCheckIn || hasOnlyCheckOut) {
          attendanceType = "Half Day";
        } else if (detail.checkInTime && detail.checkOutTime) {
          const checkInDate = new Date(detail.checkInTime);
          const checkOutDate = new Date(detail.checkOutTime);
          const expectedCheckIn = new Date(detail.date + "T04:00:00+05:30");
          const expectedCheckOut = new Date(detail.date + "T22:00:00+05:30");
          
          const isLateCheckIn = checkInDate > expectedCheckIn;
          const isEarlyCheckOut = checkOutDate < expectedCheckOut;
          
          if (isLateCheckIn || isEarlyCheckOut) {
            attendanceType = "Half Day";
          }
        }
      } else {
        // For operators/helpers
        if (!isSunday && detail.shift === "shift1") {
          const isIncomplete = detail.checkInTime && !detail.checkOutTime;
          
          let isLateHalfDay = false;
          if (detail.checkInTime) {
            const checkInDate = new Date(detail.checkInTime);
            const halfDayThreshold = new Date(detail.date + "T08:31:00+05:30");
            isLateHalfDay = checkInDate > halfDayThreshold;
          }
          
          let isEarlyHalfDay = false;
          if (detail.checkOutTime) {
            const checkOutDate = new Date(detail.checkOutTime);
            const expectedTime = new Date(detail.date + "T20:30:00+05:30");
            isEarlyHalfDay = checkOutDate < expectedTime;
          }
          
          if (isIncomplete || isLateHalfDay || isEarlyHalfDay) {
            attendanceType = "Half Day";
          }
        }
      }
      
      return [
        formatDate(detail.date),
        dayName,
        detail.shift === "shift1" ? "Shift 1" : 
        detail.shift === "shift2" ? "Shift 2" : 
        "Driver",
        detail.checkInTime ? formatTime(detail.checkInTime) : "—",
        detail.checkOutTime ? formatTime(detail.checkOutTime) : "—",
        workedHoursDisplay,
        overtimeDisplay,
        attendanceType
      ];
    });
    
    // Sort by date
    tableData.sort((a, b) => new Date(a[0]) - new Date(b[0]));
    
    // Generate table
    autoTable(doc, {
      head: [['Date', 'Day', 'Shift', 'Check-In', 'Check-Out', 'Worked Hours', 'Overtime', 'Attendance']],
      body: tableData,
      startY: 45,
      theme: 'striped',
      headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 25 },
        2: { cellWidth: 30 },
        3: { cellWidth: 35 },
        4: { cellWidth: 35 },
        5: { cellWidth: 30 },
        6: { cellWidth: 30 },
        7: { cellWidth: 30 }
      }
    });
    
    // Calculate totals from presentDetails
    const isDriver = employeeData.user.designation?.toLowerCase() === "driver";
    let totalMinutes = 0;
    let totalOvertimeMinutes = 0;
    let totalHalfDays = 0;
    let totalLateArrivals = 0;
    let totalEarlyDepartures = 0;
    
    employeeData.presentDetails.forEach(detail => {
      if (detail.checkInTime && detail.checkOutTime) {
        const checkIn = new Date(detail.checkInTime);
        const checkOut = new Date(detail.checkOutTime);
        const diffMs = checkOut - checkIn;
        const minutes = Math.round(diffMs / (1000 * 60));
        totalMinutes += minutes;
        
        // Calculate overtime for this entry
        const totalHours = minutes / 60;
        let regularHours = 0;
        
        if (isDriver) {
          regularHours = 18;
        } else {
          if (detail.shift === "shift1") {
            regularHours = 12.5;
          } else if (detail.shift === "shift2") {
            regularHours = 12;
          }
        }
        
        if (totalHours > regularHours) {
          const overtimeHours = totalHours - regularHours;
          totalOvertimeMinutes += overtimeHours * 60;
        }
      }
      
      // Count half days
      const dateObj = new Date(detail.date);
      const isSunday = dateObj.getDay() === 0;
      
      if (!isSunday) {
        if (isDriver) {
          const hasOnlyCheckIn = detail.checkInTime && !detail.checkOutTime;
          const hasOnlyCheckOut = !detail.checkInTime && detail.checkOutTime;
          
          if (hasOnlyCheckIn || hasOnlyCheckOut) {
            totalHalfDays++;
          } else if (detail.checkInTime && detail.checkOutTime) {
            const checkInDate = new Date(detail.checkInTime);
            const checkOutDate = new Date(detail.checkOutTime);
            const expectedCheckIn = new Date(detail.date + "T04:00:00+05:30");
            const expectedCheckOut = new Date(detail.date + "T22:00:00+05:30");
            
            if (checkInDate > expectedCheckIn || checkOutDate < expectedCheckOut) {
              totalHalfDays++;
            }
          }
        } else if (detail.shift === "shift1") {
          const isIncomplete = detail.checkInTime && !detail.checkOutTime;
          
          let isLateHalfDay = false;
          if (detail.checkInTime) {
            const checkInDate = new Date(detail.checkInTime);
            const halfDayThreshold = new Date(detail.date + "T08:31:00+05:30");
            isLateHalfDay = checkInDate > halfDayThreshold;
          }
          
          let isEarlyHalfDay = false;
          if (detail.checkOutTime) {
            const checkOutDate = new Date(detail.checkOutTime);
            const expectedTime = new Date(detail.date + "T20:30:00+05:30");
            isEarlyHalfDay = checkOutDate < expectedTime;
          }
          
          if (isIncomplete || isLateHalfDay || isEarlyHalfDay) {
            totalHalfDays++;
          }
        }
      }
      
      // Count late arrivals and early departures (using existing data)
      if (detail.checkInTime && !isSunday) {
        const checkInDate = new Date(detail.checkInTime);
        if (isDriver) {
          const expectedCheckIn = new Date(detail.date + "T04:00:00+05:30");
          if (checkInDate > expectedCheckIn) totalLateArrivals++;
        } else if (detail.shift === "shift1") {
          const expectedCheckIn = new Date(detail.date + "T08:00:00+05:30");
          if (checkInDate > expectedCheckIn) totalLateArrivals++;
        }
      }
      
      if (detail.checkOutTime && !isSunday) {
        const checkOutDate = new Date(detail.checkOutTime);
        if (isDriver) {
          const expectedCheckOut = new Date(detail.date + "T22:00:00+05:30");
          if (checkOutDate < expectedCheckOut) totalEarlyDepartures++;
        } else if (detail.shift === "shift1") {
          const expectedCheckOut = new Date(detail.date + "T20:30:00+05:30");
          if (checkOutDate < expectedCheckOut) totalEarlyDepartures++;
        }
      }
    });
    
    const totalHours = Math.floor(totalMinutes / 60);
    const totalMins = totalMinutes % 60;
    const formattedTotalMins = totalMins < 10 ? `0${totalMins}` : totalMins;
    
    const totalOvertimeHours = Math.floor(totalOvertimeMinutes / 60);
    const totalOvertimeMins = Math.round(totalOvertimeMinutes % 60);
    const formattedOvertimeMins = totalOvertimeMins < 10 ? `0${totalOvertimeMins}` : totalOvertimeMins;
    
    // Add summary at the bottom with calculated values
    const finalY = doc.lastAutoTable.finalY || 45;
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(`Summary:`, 14, finalY + 15);
    doc.setFont('helvetica', 'normal');
    
    doc.text(`Total Days in Month: ${employeeData.totalDays}`, 14, finalY + 25);
    doc.text(`Sundays: ${employeeData.sundayCount}`, 14, finalY + 35);
    doc.text(`Working Days: ${employeeData.totalWorkingDays}`, 14, finalY + 45);
    doc.text(`Present: ${employeeData.presentDays} | Absent: ${employeeData.absentDays} | Leave: ${employeeData.leaveDays || 0}`, 14, finalY + 55);
    doc.text(`Shift 1 Days: ${employeeData.shift1Days || 0} | Shift 2 Days: ${employeeData.shift2Days || 0}`, 14, finalY + 65);
    doc.text(`Late Arrivals: ${totalLateArrivals} | Half Days: ${totalHalfDays}`, 14, finalY + 75);
    doc.text(`Early Departures: ${totalEarlyDepartures}`, 14, finalY + 85);
    doc.text(`Total Hours: ${totalHours}h ${formattedTotalMins}m | Overtime: ${totalOvertimeHours}h ${formattedOvertimeMins}m`, 14, finalY + 95);
    
    // Save PDF
    doc.save(`factory-attendance-${employeeData.user.name}-${month}.pdf`);
    
  } catch (error) {
    console.error("Error generating PDF:", error);
    alert("Failed to generate PDF. Please try again.");
  } finally {
    setDownloadingPDF(false);
  }
};

const renderPresentDetails = (employeeData) => {
  if (!employeeData || !employeeData.presentDetails || employeeData.presentDetails.length === 0) return null;

  const isDriverUser = isDriver(employeeData.user);

  return (
    <motion.div 
      className="mt-4 bg-white p-4 rounded-xl border border-gray-200"
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
    >
      <div className="flex justify-between items-center mb-4">
        <h4 className="font-medium text-gray-800 flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          Daily Attendance Details
        </h4>
        
        {/* Download PDF Button */}
        <button
          onClick={() => downloadAttendanceTable(employeeData, month)}
          disabled={downloadingPDF}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
        >
          {downloadingPDF ? <Loader className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          Download PDF
        </button>
      </div>
      
      {/* Summary Badges */}
      <div className="flex flex-wrap gap-2 mb-4">
        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
          Present: {employeeData.presentDays}
        </span>
        <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
          Absent: {employeeData.absentDays}
        </span>
        <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
          Leave: {employeeData.leaveDays || 0}
        </span>
        <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium">
          Late: {employeeData.lateArrivals}
        </span>
        <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm font-medium">
          Sessions: {employeeData.presentDetails.length}
        </span>
        {!isDriverUser && (
          <>
            <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm font-medium">
              Half Days: {employeeData.halfDays}
            </span>
            <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
              Early: {employeeData.earlyDepartures}
            </span>
          </>
        )}
        {!isDriverUser && (
          <>
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
              Shift 1: {employeeData.shift1Days}
            </span>
            <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
              Shift 2: {employeeData.shift2Days}
            </span>
          </>
        )}
      </div>
      
      {/* Detailed Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-200 rounded-lg overflow-hidden">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-3 py-2 text-left text-sm font-medium text-gray-800">Date</th>
              <th className="px-3 py-2 text-left text-sm font-medium text-gray-800">Day</th>
              <th className="px-3 py-2 text-left text-sm font-medium text-gray-800">Shift</th>
              <th className="px-3 py-2 text-left text-sm font-medium text-gray-800">Check-In</th>
              <th className="px-3 py-2 text-left text-sm font-medium text-gray-800">Check-Out</th>
              <th className="px-3 py-2 text-left text-sm font-medium text-gray-800">Hours</th>
              <th className="px-3 py-2 text-left text-sm font-medium text-gray-800">Overtime</th>
              <th className="px-3 py-2 text-left text-sm font-medium text-gray-800">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {employeeData.presentDetails
              .sort((a, b) => new Date(a.date) - new Date(b.date))
              .map((detail, index) => {
                const dateObj = new Date(detail.date);
                const dayName = dateObj.toLocaleDateString("en-IN", { weekday: "short" });
                const isSunday = dateObj.getDay() === 0;
                
                let attendanceType = "Full Day";
                let attendanceColor = "bg-green-100 text-green-800";

                if (isSunday) {
                  attendanceType = "Weekly Off";
                  attendanceColor = "bg-orange-100 text-orange-800";
                } else if (isDriverUser) {
                  const hasOnlyCheckIn = detail.checkInTime && !detail.checkOutTime;
                  const hasOnlyCheckOut = !detail.checkInTime && detail.checkOutTime;
                  
                  if (hasOnlyCheckIn || hasOnlyCheckOut) {
                    attendanceType = "Half Day";
                    attendanceColor = "bg-amber-100 text-amber-800";
                  } else if (detail.checkInTime && detail.checkOutTime) {
                    const checkInDate = new Date(detail.checkInTime);
                    const checkOutDate = new Date(detail.checkOutTime);
                    const expectedCheckIn = new Date(detail.date + "T04:00:00+05:30");
                    const expectedCheckOut = new Date(detail.date + "T22:00:00+05:30");
                    
                    const isLateCheckIn = checkInDate > expectedCheckIn;
                    const isEarlyCheckOut = checkOutDate < expectedCheckOut;
                    
                    if (isLateCheckIn || isEarlyCheckOut) {
                      attendanceType = "Half Day";
                      attendanceColor = "bg-amber-100 text-amber-800";
                    }
                  }
                } else if (!isDriverUser && detail.shift === "shift1") {
                  const isFemale = employeeData.user?.gender?.toLowerCase() === "female";
                  const isIncomplete = detail.checkInTime && !detail.checkOutTime;
                  
                  let isLateHalfDay = false;
                  if (detail.checkInTime) {
                    const checkInDate = new Date(detail.checkInTime);
                    const halfDayThreshold = new Date(detail.date + "T08:31:00+05:30");
                    isLateHalfDay = checkInDate > halfDayThreshold;
                  }
                  
                  let isEarlyHalfDay = false;
                  if (detail.checkOutTime) {
                    const checkOutDate = new Date(detail.checkOutTime);
                    let expectedHour = isFemale ? 16 : 20;
                    let expectedMinute = isFemale ? 30 : 30;
                    const expectedTime = new Date(detail.date);
                    expectedTime.setHours(expectedHour, expectedMinute, 0, 0);
                    isEarlyHalfDay = checkOutDate < expectedTime;
                  }
                  
                  if (isIncomplete || isLateHalfDay || isEarlyHalfDay) {
                    attendanceType = "Half Day";
                    attendanceColor = "bg-amber-100 text-amber-800";
                  }
                }
                
                // Calculate hours
                let hoursDisplay = "—";
                if (detail.checkInTime && detail.checkOutTime) {
                  const checkIn = new Date(detail.checkInTime);
                  const checkOut = new Date(detail.checkOutTime);
                  const diffMs = checkOut - checkIn;
                  const totalMinutes = Math.round(diffMs / (1000 * 60));
                  const hours = Math.floor(totalMinutes / 60);
                  const minutes = totalMinutes % 60;
                  hoursDisplay = `${hours}h ${minutes.toString().padStart(2, '0')}m`;
                }
                
                // Calculate overtime
                let overtimeDisplay = "—";
                if (detail.checkInTime && detail.checkOutTime) {
                  const overtime = calculateOvertime(detail, employeeData.user?.designation, employeeData.user?.gender);
                  if (overtime.isOvertime) {
                    const hrs = Math.floor(overtime.hours);
                    const mins = Math.round((overtime.hours - hrs) * 60);
                    overtimeDisplay = `${hrs}h ${mins.toString().padStart(2, '0')}m`;
                  }
                }
                
                return (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-3 py-2 text-sm">{formatDate(detail.date)}</td>
                    <td className="px-3 py-2 text-sm">{dayName}</td>
                    <td className="px-3 py-2 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        detail.shift === "shift1" 
                          ? "bg-blue-100 text-blue-700" 
                          : detail.shift === "shift2"
                          ? "bg-purple-100 text-purple-700"
                          : "bg-green-100 text-green-700"
                      }`}>
                        {detail.shift === "shift1" ? "Shift 1" : 
                         detail.shift === "shift2" ? "Shift 2" : 
                         "Driver"}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-sm">{detail.checkInTime ? formatTime(detail.checkInTime) : "—"}</td>
                    <td className="px-3 py-2 text-sm">{detail.checkOutTime ? formatTime(detail.checkOutTime) : "—"}</td>
                    <td className="px-3 py-2 text-sm">{hoursDisplay}</td>
                    <td className="px-3 py-2 text-sm">
                      {overtimeDisplay !== "—" ? (
                        <span className="text-green-600 font-medium">{overtimeDisplay}</span>
                      ) : "—"}
                    </td>
                    <td className="px-3 py-2 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${attendanceColor}`}>
                        {attendanceType}
                      </span>
                    </td>
                  </tr>
                );
              })}
          </tbody>
          <tfoot className="bg-gray-50 border-t-2 border-gray-300">
            <tr>
              <td colSpan="8" className="px-3 py-3 text-sm text-right">
                <span className="font-semibold text-gray-800">
                  Total Hours: {employeeData.totalHours?.toFixed(1) || 0} hrs | 
                  Overtime: {employeeData.totalOvertime?.toFixed(1) || 0} hrs
                </span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </motion.div>
  );
};

  const reportButtons = [
    { key: "attendance", label: "All Attendance", color: "blue", icon: <BarChart3 className="w-4 h-4" /> },
    { key: "present", label: "Present", color: "green", icon: <UserCheck className="w-4 h-4" /> },
    { key: "absent", label: "Absent", color: "red", icon: <UserX className="w-4 h-4" /> },
    { key: "late", label: "Late Arrivals", color: "orange", icon: <Clock className="w-4 h-4" /> },
    { key: "early", label: "Early Departures", color: "yellow", icon: <AlertTriangle className="w-4 h-4" /> },
  ];

  const renderTable = () => {
    if (!report || report.length === 0) {
      return (
        <motion.div 
          className="text-center py-12 bg-gray-50 rounded-xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            No Data Available
          </h3>
          <p className="text-gray-600">
            {loading ? "Generating report..." : "No attendance records found for selected period"}
          </p>
        </motion.div>
      );
    }

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
      <motion.div 
        className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Designation
                </th>
                 <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  gender
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Present
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Absent
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Leave
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Shift 1
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Shift 2
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Late
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Half Days
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Early
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Total Hours
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Attendance %
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredReport.map((item, index) => {
                const attendancePercent = getAttendancePercentage(item.presentDays, item.totalWorkingDays);
                const statusBadge = getStatusBadge(attendancePercent);
                const isDriverUser = isDriver(item.user);
                
                return (
                  <React.Fragment key={item.user._id}>
                    <motion.tr 
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => toggleUserDetails(item.user._id)}
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{item.user.name}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 capitalize">
                        {item.user.designation || "N/A"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 capitalize">
                        {item.user.gender}
                      </td>
                      <td className="px-4 py-3 text-sm text-green-600 font-medium">
                        {item.presentDays}
                      </td>
                      <td className="px-4 py-3 text-sm text-red-600">
                        {item.absentDays}
                      </td>
                      <td className="px-4 py-3 text-sm text-purple-600 font-medium">
                        {item.leaveDays || 0}
                      </td>
                        <td className="px-4 py-3 text-sm text-indigo-600 font-medium">
                        {item.presentDetails?.length || 0}
                      </td>
                      <td className="px-4 py-3 text-sm text-blue-600">
                        {isDriverUser ? "—" : (item.shift1Days || 0)}
                      </td>
                      <td className="px-4 py-3 text-sm text-purple-600">
                        {isDriverUser ? "—" : (item.shift2Days || 0)}
                      </td>
                      <td className="px-4 py-3 text-sm text-orange-600">
                        {item.lateArrivals}
                      </td>
                      <td className="px-4 py-3 text-sm text-amber-600">
                        {isDriverUser ? "—" : (item.halfDays || 0)}
                      </td>
                      <td className="px-4 py-3 text-sm text-yellow-600">
                        {isDriverUser ? "—" : (item.earlyDepartures || 0)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {item.totalHours.toFixed(1)} hrs
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusBadge.color}`}>
                          {attendancePercent}%
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button className="text-blue-600 hover:text-blue-800 transition-colors">
                          {expandedUser === item.user._id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </td>
                    </motion.tr>
                    
                    <AnimatePresence>
                      {expandedUser === item.user._id && (
                        <motion.tr
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                        >
                          <td colSpan="13" className="px-4 py-4 bg-gray-50">
                            <div className="space-y-4">
                              {view === "present" && (
                                <>
                                  {renderPresentDetails(item)}
                                  {renderLateDetails(item.lateDetails, item.user?.designation)}
                                  {renderEarlyDetails(item.earlyDetails, item.user?.designation)}
                                  {renderLeaveDetails(item.leaveDates)}
                                </>
                              )}
                              {view === "absent" && (
                                <>
                                  {renderAbsentDetails(item.absentDates)}
                                  {renderLeaveDetails(item.leaveDates)}
                                </>
                              )}
                              {view === "late" && (
                                <>
                                  {renderLateDetails(item.lateDetails, item.user?.designation)}
                                  {renderPresentDetails(item)}
                                  {renderLeaveDetails(item.leaveDates)}
                                </>
                              )}
                              {view === "early" && (
                                <>
                                  {renderEarlyDetails(item.earlyDetails, item.user?.designation)}
                                  {renderPresentDetails(item)}
                                  {renderLeaveDetails(item.leaveDates)}
                                </>
                              )}
                              {view === "attendance" && (
                                <>
                                  {renderPresentDetails(item)}
                                  {renderAbsentDetails(item.absentDates)}
                                  {renderLeaveDetails(item.leaveDates)}
                                  {renderLateDetails(item.lateDetails, item.user?.designation)}
                                  {renderEarlyDetails(item.earlyDetails, item.user?.designation)}
                                </>
                              )}
                            </div>
                          </td>
                        </motion.tr>
                      )}
                    </AnimatePresence>
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>
    );
  };

  if (!isPrivileged) {
    return (
      <>
        <InternalNavbar />
        <div className="min-h-screen flex items-center justify-center">
          <div className="bg-red-50 p-8 rounded-2xl text-center">
            <Users className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-red-700 mb-2">Access Denied</h2>
            <p className="text-red-600">Only admins, accounts, drivers and guards can view factory reports</p>
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
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                  Factory Monthly Reports
                </h1>
                <p className="text-gray-600">
                  Monthly attendance summary for Operators, Helpers & Drivers
                </p>
              </div>
              <div className="mt-4 lg:mt-0">
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                  <p className="text-sm text-blue-700 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <strong>Shift 1:</strong> 8 AM - 8:30 PM | <strong>Shift 2:</strong> After 8:30 PM | <strong>Driver:</strong> Flexible timing
                  </p>
                </div>
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
                  onClick={() => fetchReport(view)}
                  disabled={!month || loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-xl font-medium flex items-center justify-center gap-2"
                >
                  {loading ? <Loader className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                  Generate Report
                </button>
              </div>
            </div>

            {/* Report Type Buttons */}
            <motion.div 
              className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {reportButtons.map((btn) => (
                <motion.button
                  key={btn.key}
                  onClick={() => fetchReport(btn.key)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                    view === btn.key 
                      ? `bg-${btn.color}-600 text-white shadow-lg` 
                      : `bg-${btn.color}-100 hover:bg-${btn.color}-200 text-${btn.color}-800`
                  }`}
                >
                  {btn.icon}
                  <span className="hidden sm:inline">{btn.label}</span>
                </motion.button>
              ))}
            </motion.div>

            {/* Loading State */}
            <AnimatePresence>
              {loading && (
                <motion.div 
                  className="text-center py-12"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <Loader className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
                  <p className="text-gray-600">Generating report for {selectedMonthName}...</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Summary Cards */}
            {!loading && report && report.length > 0 && view === "attendance" && renderSummaryCards()}

            {/* Results */}
            {!loading && renderTable()}
          </motion.div>
        </div>
      </div>
    </>
  );
}