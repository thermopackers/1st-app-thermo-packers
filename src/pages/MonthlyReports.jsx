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
  Loader
} from "lucide-react";

export default function MonthlyReports() {
  const { user } = useUserContext();
  // Helper function to parse roles properly
const parseUserRoles = (user) => {
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
  const [month, setMonth] = useState("");
  const [employee, setEmployee] = useState("");
  const [employees, setEmployees] = useState([]);
  const [report, setReport] = useState(null);
  const [view, setView] = useState("attendance");
  const [loading, setLoading] = useState(false);
  const [selectedMonthName, setSelectedMonthName] = useState("");
  const [expandedUser, setExpandedUser] = useState(null);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
const [downloadingPDF, setDownloadingPDF] = useState(false);

  useEffect(() => {
  const fetchEmployees = async () => {
    try {
      // ✅ FIX: Handle role array properly
      const userRoles = parseUserRoles(user);
      const hasAdminAccess = userRoles.some(role => ['admin', 'accounts'].includes(role));
      
      if (hasAdminAccess) {
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
      const monthName = new Date(year, parseInt(m) - 1).toLocaleString('default', { 
        month: 'long', 
        year: 'numeric' 
      });
      setSelectedMonthName(monthName);
    }
  }, [month]);

 const fetchReport = async (type) => {
  setExpandedUser(null);
  if (!month) {
    alert("Please select a month");
    return;
  }

  setLoading(true);
  const [year, m] = month.split("-");
  const from = `${year}-${m}-01`;
  const lastDay = new Date(year, parseInt(m), 0).getDate();
  const to = `${year}-${m}-${String(lastDay).padStart(2, "0")}`;
  
  // Get current date to filter out future dates
  const currentDate = new Date();
  const currentDateStr = currentDate.toISOString().split('T')[0];
  
  // Calculate all dates in the month (only up to today)
  const allDates = [];
  for (let day = 1; day <= lastDay; day++) {
    const dateStr = `${year}-${m}-${String(day).padStart(2, "0")}`;
    // Only include dates that are today or in the past
    if (dateStr <= currentDateStr) {
      allDates.push(dateStr);
    }
  }
  
  // Calculate number of Sundays in the month up to today only
  let sundayCount = 0;
  for (const dateStr of allDates) {
    const date = new Date(dateStr);
    if (date.getDay() === 0) {
      sundayCount++;
    }
  }
  
  try {
    setView(type);
    
    // ✅ FIX: Only pass userId if user has admin/accounts role
    const userRoles = parseUserRoles(user);
    const hasAdminAccess = userRoles.some(role => ['admin', 'accounts'].includes(role));
    
    const params = { from, to };
    
    // Only add userId parameter for admin/accounts users
    if (hasAdminAccess && employee) {
      params.userId = employee;
    }
    
    const res = await axiosInstance.get("/attendance/monthly", { params });
    
    // Add sundayCount and calculate working days
    const reportWithSundays = res.data.map(item => ({
      ...item,
      sundayCount,
      totalWorkingDays: item.totalDays - sundayCount,
      absentDays: item.absentDates ? item.absentDates.length : 0,
      allDates: allDates
    }));
    
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
  const percentage = Math.round((presentDays / totalWorkingDays) * 100);
  return Math.min(percentage, 100); // Cap at 100%
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

  const renderSummaryCards = () => {
    if (!report || report.length === 0) return null;

const totalStats = report.reduce((acc, curr) => ({
  totalDays: acc.totalDays + curr.totalDays,
  totalWorkingDays: acc.totalWorkingDays + curr.totalWorkingDays,
  presentDays: acc.presentDays + curr.presentDays,
  leaveDays: acc.leaveDays + (curr.leaveDates ? curr.leaveDates.length : 0),
  lateArrivals: acc.lateArrivals + curr.lateArrivals,
  halfDays: acc.halfDays + (curr.halfDays || 0),
  earlyDepartures: acc.earlyDepartures + curr.earlyDepartures,
  sundayCount: curr.sundayCount
}), { 
  totalDays: 0, 
  totalWorkingDays: 0,
  presentDays: 0, 
  leaveDays: 0,
  lateArrivals: 0, 
  halfDays: 0,
  earlyDepartures: 0,
  sundayCount: 0
});

    const overallPercentage = getAttendancePercentage(totalStats.presentDays, totalStats.totalWorkingDays);
    const statusBadge = getStatusBadge(overallPercentage);

   const cards = [
  {
    title: "Total Present Days",
    value: totalStats.presentDays,
    color: "text-blue-600 bg-blue-50",
    icon: <UserCheck className="w-6 h-6" />
  },
  {
    title: "Total Leave Days",
    value: totalStats.leaveDays || 0,
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
    title: "Total Early Departures",
    value: totalStats.earlyDepartures,
    color: "text-yellow-600 bg-yellow-50",
    icon: <AlertTriangle className="w-6 h-6" />
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
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ staggerChildren: 0.1 }}
      >
        {cards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white p-4 rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 rounded-lg ${card.color.split(' ')[1]}`}>
                <div className={card.color.split(' ')[0]}>
                  {card.icon}
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-800">{card.value}</div>
                {card.subtitle && (
                  <div className="text-xs text-gray-500 mt-1">{card.subtitle}</div>
                )}
              </div>
            </div>
            <div className="text-sm font-medium text-gray-600">{card.title}</div>
          </motion.div>
        ))}
      </motion.div>
    );
  };

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
    <motion.div 
      className="mt-3 bg-orange-50 p-4 rounded-xl border border-orange-200"
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
    >
      <h4 className="font-medium text-orange-800 mb-3 flex items-center gap-2">
        <Clock className="w-4 h-4" />
        Late Check-In Details
      </h4>
      <div className="space-y-2">
        {lateDetails.map((detail, index) => {
          const checkInDate = new Date(detail.checkInTime);
          const expectedTime = new Date(detail.date);
          expectedTime.setHours(9, 50, 0, 0);
          
          const lateByMs = checkInDate - expectedTime;
          const lateByMinutes = Math.round(lateByMs / 60000);
          const hours = Math.floor(lateByMinutes / 60);
          const minutes = lateByMinutes % 60;
          
          // Check if this is a half day (check-in after 9:51 AM)
          const halfDayThreshold = new Date(detail.date);
          halfDayThreshold.setHours(9, 51, 0, 0);
          const isHalfDay = checkInDate > halfDayThreshold;

          return (
            <div key={index} className="flex justify-between items-center text-sm text-orange-700 bg-orange-100 p-2 rounded-lg">
              <span>
                📅 {formatDate(detail.date)}: {formatTime(detail.checkInTime)} 
                <span className="font-medium ml-2">(Late by {hours}h {minutes}m)</span>
              </span>
              {isHalfDay && (
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

  const renderEarlyDetails = (earlyDetails) => {
    if (!earlyDetails || earlyDetails.length === 0) return null;

    return (
      <motion.div 
        className="mt-3 bg-yellow-50 p-4 rounded-xl border border-yellow-200"
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
      >
        <h4 className="font-medium text-yellow-800 mb-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          Early Check-Out Details
        </h4>
        <div className="space-y-2">
          {earlyDetails.map((detail, index) => {
            if (!detail.checkOutTime) return null;
            
            const checkOutDate = new Date(detail.checkOutTime);
            const expectedTime = new Date(detail.date);
            expectedTime.setHours(18, 0, 0, 0);
            
            if (checkOutDate >= expectedTime) return null;
            
            const earlyByMs = expectedTime - checkOutDate;
            const earlyByMinutes = Math.round(earlyByMs / 60000);
            const hours = Math.floor(earlyByMinutes / 60);
            const minutes = earlyByMinutes % 60;

            return (
              <div key={index} className="text-sm text-yellow-700 bg-yellow-100 p-2 rounded-lg">
                📅 {formatDate(detail.date)}: {formatTime(detail.checkOutTime)} 
                <span className="font-medium ml-2">(Early by {hours}h {minutes}m)</span>
              </div>
            );
          })}
        </div>
      </motion.div>
    );
  };

// Update the PDF download function with full attendance status text and optimized for more rows
const downloadAttendanceTable = async (attendanceRecords, month, userId, fdCount, hdCount, leaveCount) => {
  setDownloadingPDF(true);
  try {
    // Dynamically import jspdf and jspdf-autotable
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');
    
    // Use portrait orientation for more rows per page
    const doc = new jsPDF('portrait');
    
    // Get user name
    let userName = "Employee";
    if (userId && report) {
      const userReport = report.find(r => r.user._id === userId);
      if (userReport) {
        userName = userReport.user.name;
      }
    }
    
    // Format month name
    let monthName = month;
    if (month) {
      const [year, m] = month.split("-");
      monthName = new Date(year, parseInt(m) - 1).toLocaleString('default', { 
        month: 'long', 
        year: 'numeric' 
      });
    }
    
    // Title
    doc.setFontSize(14);
    doc.text(`Attendance Report - ${userName}`, 14, 15);
    doc.setFontSize(10);
    doc.text(`Month: ${monthName}`, 14, 23);
    doc.text(`Generated: ${new Date().toLocaleDateString('en-IN')}`, 14, 31);
    
    // Calculate all dates in the month up to today
    const [year, m] = month.split("-");
    const monthNum = parseInt(m);
    const today = new Date();
    
    // Get last day of the month
    const lastDay = new Date(year, monthNum, 0).getDate();
    
    // Generate all dates in the month up to today
    const allDatesInMonth = [];
    const sundays = [];
    
    for (let day = 1; day <= lastDay; day++) {
      const dateStr = `${year}-${String(monthNum).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const date = new Date(dateStr);
      
      // Only include dates up to today
      if (date <= today) {
        allDatesInMonth.push(dateStr);
        if (date.getDay() === 0) {
          sundays.push(dateStr);
        }
      }
    }
    
    // Create a map of attendance records by date for quick lookup
    const attendanceMap = {};
    attendanceRecords.forEach(record => {
      attendanceMap[record.date] = record;
    });
    
    // Prepare table data for ALL dates in the month with FULL status text
    const tableData = allDatesInMonth.map(dateStr => {
      const record = attendanceMap[dateStr];
      const dateObj = new Date(dateStr);
      const dayName = dateObj.toLocaleDateString("en-IN", { weekday: "short" });
      const isSunday = dateObj.getDay() === 0;
      
      let checkIn = "—";
      let checkOut = "—";
      let hours = "—";
      let attendanceType = "";
      
      if (record) {
        if (record.type === 'leave') {
          attendanceType = "On Leave";
        } else if (record.type === 'present') {
          checkIn = record.checkInTime ? formatTime(record.checkInTime) : "—";
          checkOut = record.checkOutTime ? formatTime(record.checkOutTime) : "—";
          
          // Calculate worked hours
          if (record.checkInTime && record.checkOutTime) {
            const checkInDate = new Date(record.checkInTime);
            const checkOutDate = new Date(record.checkOutTime);
            const diffMs = checkOutDate - checkInDate;
            const totalMinutes = Math.round(diffMs / (1000 * 60));
            const hrs = Math.floor(totalMinutes / 60);
            const mins = totalMinutes % 60;
            hours = `${hrs}h ${mins}m`;
          }
        }
      }
      
      // Determine attendance type if not already set
      if (!attendanceType) {
        if (isSunday) {
          attendanceType = "Weekly Off";
        } else if (record && record.type === 'present') {
          // Check for half day reasons
          const isIncomplete = record.checkInTime && !record.checkOutTime;
          const isLateHalfDay = (() => {
            if (!record.checkInTime) return false;
            const checkInDate = new Date(record.checkInTime);
            const thresholdTime = new Date(dateStr);
            thresholdTime.setHours(9, 51, 0, 0);
            return checkInDate > thresholdTime;
          })();
          const isEarlyHalfDay = (() => {
            if (!record.checkOutTime) return false;
            const checkOutDate = new Date(record.checkOutTime);
            const expectedTime = new Date(dateStr);
            expectedTime.setHours(18, 0, 0, 0);
            return checkOutDate < expectedTime;
          })();
          
          const isHalfDay = isIncomplete || isLateHalfDay || isEarlyHalfDay;
          
          if (isHalfDay) {
            if (isIncomplete) {
              attendanceType = "Half Day (Incomplete)";
            } else if (isLateHalfDay && isEarlyHalfDay) {
              attendanceType = "Half Day (Late & Early)";
            } else if (isLateHalfDay) {
              attendanceType = "Half Day (Late)";
            } else if (isEarlyHalfDay) {
              attendanceType = "Half Day (Early)";
            } else {
              attendanceType = "Half Day";
            }
          } else {
            attendanceType = "Full Day";
          }
        } else {
          attendanceType = "Absent";
        }
      }
      
      return [
        formatDate(dateStr),
        dayName,
        checkIn,
        checkOut,
        hours,
        attendanceType
      ];
    });
    
    // Calculate statistics
    const presentRecords = attendanceRecords.filter(r => r.type === 'present');
    const leaveRecords = attendanceRecords.filter(r => r.type === 'leave');
    const presentDates = presentRecords.map(r => r.date);
    const leaveDates = leaveRecords.map(r => r.date);
    
    // Calculate working days
    const workingDays = allDatesInMonth.filter(date => {
      const dateObj = new Date(date);
      const isSunday = dateObj.getDay() === 0;
      const isPresent = presentDates.includes(date);
      if (isSunday) return isPresent;
      return true;
    });
    
    const absentDays = workingDays.filter(date => {
      const isPresent = presentDates.includes(date);
      const isOnLeave = leaveDates.includes(date);
      return !isPresent && !isOnLeave;
    });
    
    const presentCount = presentDates.length;
    const sundaysWorked = presentDates.filter(date => {
      const dateObj = new Date(date);
      return dateObj.getDay() === 0;
    }).length;
    
    // Monthly Off Logic
    const monthlyOff = 1;
    const netLeaves = leaveCount > 0 ? leaveCount - monthlyOff : 0;
    const monthlyOffDisplay = leaveCount > 0 ? monthlyOff : 1;
    
    // Generate table with optimized settings for more rows
    autoTable(doc, {
      head: [['Date', 'Day', 'Check-In', 'Check-Out', 'Hours', 'Status']],
      body: tableData,
      startY: 40,
      theme: 'striped',
      headStyles: { 
        fillColor: [41, 128, 185], 
        textColor: 255, 
        fontStyle: 'bold',
        fontSize: 9,
        cellPadding: 2
      },
      styles: { 
        fontSize: 8, 
        cellPadding: 2,
        lineHeight: 1.2,
        valign: 'middle'
      },
      columnStyles: {
        0: { cellWidth: 25 },  // Date
        1: { cellWidth: 18 },  // Day
        2: { cellWidth: 28 },  // Check-In
        3: { cellWidth: 28 },  // Check-Out
        4: { cellWidth: 25 },  // Hours
        5: { cellWidth: 45 }   // Status (wider for full text)
      },
      margin: { top: 40, bottom: 50, left: 10, right: 10 },
      pageBreak: 'auto',
      rowPageBreak: 'avoid'
    });
    
    // Get the final Y position after table
    let finalY = doc.lastAutoTable.finalY || 40;
    
    // Add summary on the same page if space allows, otherwise new page
    if (finalY + 50 > 280) {
      doc.addPage();
      finalY = 20;
    } else {
      finalY += 10;
    }
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`Summary:`, 14, finalY);
    doc.setFont('helvetica', 'normal');
    
    let currentY = finalY + 8;
    
    // Line 1
    doc.text(`Total Days: ${allDatesInMonth.length}`, 14, currentY);
    currentY += 6;
    
    // Line 2
    doc.text(`Sundays: ${sundays.length} total (${sundaysWorked} worked, ${sundays.length - sundaysWorked} off)`, 14, currentY);
    currentY += 6;
    
    // Line 3
    doc.text(`Working Days: ${workingDays.length}`, 14, currentY);
    currentY += 6;
    
    // Line 4
    doc.text(`Present: ${presentCount} | Absent: ${absentDays.length}`, 14, currentY);
    currentY += 6;
    
    // Line 5
    doc.text(`Full Days (FD): ${fdCount} | Half Days (HD): ${hdCount}`, 14, currentY);
    currentY += 6;
    
    // Line 6
    if (leaveCount > 0) {
      doc.text(`Leaves: ${leaveCount} total | Monthly Off: 1 | Net Leaves: ${netLeaves}`, 14, currentY);
    } else {
      doc.text(`Monthly Off: ${monthlyOffDisplay}`, 14, currentY);
    }
    
    // Save PDF
    doc.save(`attendance-${userName}-${month}.pdf`);

  } catch (error) {
    console.error("Error generating PDF:", error);
    alert("Failed to generate PDF. Please try again.");
  } finally {
    setDownloadingPDF(false);
  }
};

const renderPresentDetails = (presentDetails, absentDates, month, leaveDates = [], userId = null) => {
  if (!presentDetails && !absentDates && !leaveDates) return null;

  let allDates = [];
  let firstDayOffset = 0;
  
  if (month) {
    const [year, m] = month.split("-");
    const lastDay = new Date(year, parseInt(m), 0).getDate();
    const firstDay = new Date(year, parseInt(m) - 1, 1);
    firstDayOffset = firstDay.getDay();
    
    const currentDate = new Date();
    const currentDateStr = currentDate.toISOString().split('T')[0];
    
    for (let day = 1; day <= lastDay; day++) {
      const dateStr = `${year}-${m}-${String(day).padStart(2, "0")}`;
      if (dateStr <= currentDateStr) {
        allDates.push(dateStr);
      }
    }
  }

  const presentDateMap = {};
  if (presentDetails) {
    presentDetails.forEach(detail => {
      presentDateMap[detail.date] = detail;
    });
  }

  const absentDateMap = {};
  if (absentDates) {
    absentDates.forEach(date => {
      absentDateMap[date] = true;
    });
  }

  const leaveDateMap = {};
  if (leaveDates) {
    leaveDates.forEach(date => {
      leaveDateMap[date] = true;
    });
  }

  // Calculate FD and HD counts (only from present days)
  let fdCount = 0;
  let hdCount = 0;
  let totalPresentCount = 0;
  let totalLeaveCount = leaveDates ? leaveDates.length : 0;

  if (presentDetails) {
    presentDetails.forEach(detail => {
      // Count as present
      totalPresentCount++;
      
      const dateStr = detail.date;
      const isSunday = new Date(dateStr).getDay() === 0;
      
      // Skip Sunday for half-day calculations (they're weekly off)
      if (isSunday) {
        return;
      }
      
      // Check if it's an incomplete day (only check-in, no check-out)
      const isIncomplete = detail.checkInTime && !detail.checkOutTime;
      
      // Check if it's a half day due to late check-in (after 9:51 AM)
      let isLateHalfDay = false;
      if (detail.checkInTime) {
        const checkInDate = new Date(detail.checkInTime);
        const thresholdTime = new Date(dateStr);
        thresholdTime.setHours(9, 51, 0, 0);
        isLateHalfDay = checkInDate > thresholdTime;
      }
      
      // Check if it's a half day due to early checkout (before 6:00 PM)
      let isEarlyHalfDay = false;
      if (detail.checkOutTime) {
        const checkOutDate = new Date(detail.checkOutTime);
        const expectedTime = new Date(dateStr);
        expectedTime.setHours(18, 0, 0, 0); // 6:00 PM
        isEarlyHalfDay = checkOutDate < expectedTime;
      }
      
      // It's a half day if ANY of these conditions are true:
      // 1. Incomplete (only check-in, no check-out)
      // 2. Late check-in (after 9:51 AM)
      // 3. Early checkout (before 6:00 PM)
      const isHalfDay = isIncomplete || isLateHalfDay || isEarlyHalfDay;
      
      if (isHalfDay) {
        hdCount++;
      } else {
        fdCount++;
      }
    });
  }

  // Combine all attendance records for the table (present + leave + Sundays)
  const allAttendanceRecords = [];
  
  // First, add all dates in the month
  allDates.forEach(dateStr => {
    const isPresent = presentDateMap[dateStr];
    const isOnLeave = leaveDateMap[dateStr];
    const isSunday = new Date(dateStr).getDay() === 0;
    
    if (isPresent) {
      // Add present day record
      allAttendanceRecords.push({
        ...presentDateMap[dateStr],
        type: 'present'
      });
    } else if (isOnLeave) {
      // Add leave day record
      allAttendanceRecords.push({
        date: dateStr,
        type: 'leave',
        checkInTime: null,
        checkOutTime: null,
        workedHours: null
      });
    } else if (isSunday) {
      // Add Sunday as Weekly Off (only if no attendance and not on leave)
      allAttendanceRecords.push({
        date: dateStr,
        type: 'sunday',
        checkInTime: null,
        checkOutTime: null,
        workedHours: null
      });
    }
    // Absent weekdays will be handled by the absentDates section elsewhere
  });

  // Sort by date
  allAttendanceRecords.sort((a, b) => new Date(a.date) - new Date(b.date));

  return (
    <motion.div 
      className="mt-4 bg-white p-4 rounded-xl border border-gray-200"
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
    >
      <div className="flex justify-between items-center mb-4">
        <h4 className="font-medium text-gray-800 flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          Daily Attendance Calendar
        </h4>
        
        {/* Download PDF Button */}
        <button
          onClick={() => downloadAttendanceTable(allAttendanceRecords, month, userId, fdCount, hdCount, totalLeaveCount)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
        >
          <Download className="w-4 h-4" />
          Download PDF
        </button>
      </div>
      
      {/* Status Legend */}
      <div className="flex flex-wrap gap-4 mb-4 text-sm">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-green-500 rounded mr-2"></div>
          <span>Present (FD)</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-amber-500 rounded mr-2"></div>
          <span>Present (HD)</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-purple-500 rounded mr-2"></div>
          <span>On Leave</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-orange-500 rounded mr-2"></div>
          <span>Sunday/Weekly Off</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-red-500 rounded mr-2"></div>
          <span>Absent (Weekday)</span>
        </div>
      </div>
      
      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 mb-6">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
            {day}
          </div>
        ))}
        
        {Array.from({ length: firstDayOffset }, (_, i) => (
          <div key={`empty-${i}`} className="p-2 rounded text-center text-sm bg-gray-50 opacity-50"></div>
        ))}
        
        {allDates.map(dateStr => {
          const dateObj = new Date(dateStr);
          const dayOfMonth = dateObj.getDate();
          const isSunday = dateObj.getDay() === 0;
          const isPresent = presentDateMap[dateStr];
          const isAbsent = absentDateMap[dateStr] && !isPresent;
          const isOnLeave = leaveDateMap[dateStr];

          let bgColor = "bg-gray-100";
          let textColor = "text-gray-800";
          let titleText = "";
          
          if (isOnLeave) {
            bgColor = "bg-purple-100";
            textColor = "text-purple-800";
            titleText = "On Leave";
          } else if (isPresent) {
            // Check if worked on Sunday
            if (isSunday) {
              bgColor = "bg-orange-100";
              textColor = "text-orange-800";
              titleText = "Sunday (Worked)";
            } else {
              // Check if incomplete (only check-in)
              const isIncomplete = presentDateMap[dateStr].checkInTime && !presentDateMap[dateStr].checkOutTime;
              
              // Check if half day due to late check-in
              const isLateHalfDay = (() => {
                const checkInDate = new Date(presentDateMap[dateStr].checkInTime);
                const thresholdTime = new Date(dateStr);
                thresholdTime.setHours(9, 51, 0, 0);
                return checkInDate > thresholdTime;
              })();
              
              // Check if half day due to early checkout
              const isEarlyHalfDay = (() => {
                if (!presentDateMap[dateStr].checkOutTime) return false;
                const checkOutDate = new Date(presentDateMap[dateStr].checkOutTime);
                const expectedTime = new Date(dateStr);
                expectedTime.setHours(18, 0, 0, 0);
                return checkOutDate < expectedTime;
              })();
              
              const isHalfDay = isIncomplete || isLateHalfDay || isEarlyHalfDay;
              
              bgColor = isHalfDay ? "bg-amber-100" : "bg-green-100";
              textColor = isHalfDay ? "text-amber-800" : "text-green-800";
              
              let reasons = [];
              if (isIncomplete) reasons.push("Incomplete");
              if (isLateHalfDay) reasons.push("Late Check-in");
              if (isEarlyHalfDay) reasons.push("Early Check-out");
              
              titleText = isHalfDay ? `Half Day${reasons.length ? ' (' + reasons.join(', ') + ')' : ''}` : "Full Day";
            }
            
            if (presentDateMap[dateStr]) {
              titleText += `\nCheck-in: ${formatTime(presentDateMap[dateStr].checkInTime)}\nCheck-out: ${presentDateMap[dateStr].checkOutTime ? formatTime(presentDateMap[dateStr].checkOutTime) : 'Not checked out'}`;
            }
          } else if (isSunday) {
            bgColor = "bg-orange-100";
            textColor = "text-orange-800";
            titleText = "Weekly Off";
          } else if (isAbsent) {
            bgColor = "bg-red-100";
            textColor = "text-red-800";
            titleText = "Absent";
          }
          
          return (
            <div 
              key={dateStr} 
              className={`p-2 rounded text-center text-sm ${bgColor} ${textColor} relative cursor-help`}
              title={titleText}
            >
              {dayOfMonth}
              {isOnLeave && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-purple-500 rounded-full"></span>
              )}
              {isPresent && !isOnLeave && !isSunday && (
                <span className={`absolute -top-1 -right-1 w-2 h-2 ${
                  (presentDateMap[dateStr] && !presentDateMap[dateStr].checkOutTime) || 
                  (presentDateMap[dateStr] && new Date(presentDateMap[dateStr].checkInTime) > new Date(dateStr + "T09:51:00")) ||
                  (presentDateMap[dateStr] && presentDateMap[dateStr].checkOutTime && new Date(presentDateMap[dateStr].checkOutTime) < new Date(dateStr + "T18:00:00"))
                    ? 'bg-amber-500' 
                    : 'bg-green-500'
                } rounded-full`}></span>
              )}
              {isPresent && isSunday && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-orange-500 rounded-full"></span>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Detailed Table with FD/HD Column - INCLUDING LEAVES AND SUNDAYS */}
      {allAttendanceRecords.length > 0 && (
        <>
          <div className="flex justify-between items-center mb-3">
            <h4 className="font-medium text-gray-800">Attendance Details (Including Leaves)</h4>
            
            {/* Summary Badges */}
            <div className="flex gap-2 text-sm">
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full font-medium">
                FD: {fdCount}
              </span>
              <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full font-medium">
                HD: {hdCount}
              </span>
              <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full font-medium">
                Leave: {totalLeaveCount}
              </span>
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full font-medium">
                Total Present: {totalPresentCount}
              </span>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-200 rounded-lg overflow-hidden">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-3 py-2 text-left text-sm font-medium text-gray-800">Date</th>
                  <th className="px-3 py-2 text-left text-sm font-medium text-gray-800">Day</th>
                  <th className="px-3 py-2 text-left text-sm font-medium text-gray-800">Check-In</th>
                  <th className="px-3 py-2 text-left text-sm font-medium text-gray-800">Check-Out</th>
                  <th className="px-3 py-2 text-left text-sm font-medium text-gray-800">Worked Hours</th>
                  <th className="px-3 py-2 text-left text-sm font-medium text-gray-800">Attendance</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {allAttendanceRecords.map((record, index) => {
                  const dayName = new Date(record.date).toLocaleDateString("en-IN", { weekday: "short" });
                  const isSunday = new Date(record.date).getDay() === 0;
                  
                  let rowColor = "";
                  let textColor = "";
                  let attendanceType = "";
                  let attendanceColor = "";
                  
                  if (record.type === 'leave') {
                    rowColor = "bg-purple-50";
                    textColor = "text-purple-700";
                    attendanceType = "On Leave";
                    attendanceColor = "bg-purple-100 text-purple-800";
                  } else if (record.type === 'sunday') {
                    rowColor = "bg-orange-50";
                    textColor = "text-orange-700";
                    attendanceType = "Weekly Off";
                    attendanceColor = "bg-orange-100 text-orange-800";
                  } else {
                    // Present day
                    if (isSunday) {
                      rowColor = "bg-orange-100";
                      textColor = "text-orange-800";
                      attendanceType = "Sunday (Worked)";
                      attendanceColor = "bg-orange-200 text-orange-800";
                    } else {
                      // Check if incomplete (only check-in)
                      const isIncomplete = record.checkInTime && !record.checkOutTime;
                      
                      // Check if half day due to late check-in
                      const isLateHalfDay = (() => {
                        if (!record.checkInTime) return false;
                        const checkInDate = new Date(record.checkInTime);
                        const thresholdTime = new Date(record.date);
                        thresholdTime.setHours(9, 51, 0, 0);
                        return checkInDate > thresholdTime;
                      })();
                      
                      // Check if half day due to early checkout
                      const isEarlyHalfDay = (() => {
                        if (!record.checkOutTime) return false;
                        const checkOutDate = new Date(record.checkOutTime);
                        const expectedTime = new Date(record.date);
                        expectedTime.setHours(18, 0, 0, 0);
                        return checkOutDate < expectedTime;
                      })();
                      
                      const isHalfDay = isIncomplete || isLateHalfDay || isEarlyHalfDay;
                      
                      rowColor = isHalfDay ? "bg-amber-50" : "bg-green-50";
                      textColor = isHalfDay ? "text-amber-700" : "text-green-700";
                      
                      let reasons = [];
                      if (isIncomplete) reasons.push("Incomplete");
                      if (isLateHalfDay) reasons.push("Late");
                      if (isEarlyHalfDay) reasons.push("Early");
                      
                      attendanceType = isHalfDay ? `Half Day${reasons.length ? ' (' + reasons.join(', ') + ')' : ''}` : "Full Day";
                      attendanceColor = isHalfDay ? "bg-amber-100 text-amber-800" : "bg-green-100 text-green-800";
                    }
                  }

                  // Calculate worked hours if present
                  const workedHoursDisplay = (() => {
                    if (!record.checkInTime || !record.checkOutTime) return "—";
                    const checkIn = new Date(record.checkInTime);
                    const checkOut = new Date(record.checkOutTime);
                    const diffMs = checkOut - checkIn;
                    const totalMinutes = Math.round(diffMs / (1000 * 60));
                    const hours = Math.floor(totalMinutes / 60);
                    const minutes = totalMinutes % 60;
                    const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
                    return `${hours}h ${formattedMinutes}m`;
                  })();

                  return (
                    <tr key={index} className={`hover:opacity-90 ${rowColor}`}>
                      <td className={`px-3 py-2 text-sm ${textColor}`}>{formatDate(record.date)}</td>
                      <td className={`px-3 py-2 text-sm ${textColor}`}>{dayName}</td>
                      <td className={`px-3 py-2 text-sm ${textColor}`}>
                        {record.checkInTime ? formatTime(record.checkInTime) : "—"}
                      </td>
                      <td className={`px-3 py-2 text-sm ${textColor}`}>
                        {record.checkOutTime ? formatTime(record.checkOutTime) : "—"}
                      </td>
                      <td className={`px-3 py-2 text-sm ${textColor}`}>
                        {workedHoursDisplay}
                      </td>
                      <td className={`px-3 py-2 text-sm`}>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${attendanceColor}`}>
                          {attendanceType}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {/* Table Footer with Totals */}
              <tfoot className="bg-gray-50 border-t-2 border-gray-300">
                <tr>
                  <td colSpan="5" className="px-3 py-3 text-sm font-semibold text-gray-800 text-right">
                    Total Days: {allAttendanceRecords.length} | 
                  </td>
                  <td className="px-3 py-3 text-sm">
                    <span className="font-semibold text-gray-800">
                      FD: {fdCount} | HD: {hdCount} | Leave: {totalLeaveCount}
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </>
      )}
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
  case "leave": // Add this case
    filteredReport = report.filter(item => item.leaveDates && item.leaveDates.length > 0);
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
                  Role
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Total Days
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Working Days
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
                  Late
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
  Half Days
</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Early
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
              {filteredReport.map((r, index) => { 
                const attendancePercent = getAttendancePercentage(r.presentDays, r.totalWorkingDays);
                const statusBadge = getStatusBadge(attendancePercent);
                
                return (
                  <React.Fragment key={r.user._id}>
                    <motion.tr 
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => toggleUserDetails(r.user._id)}
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{r.user.name}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 capitalize">
                        {r.user.role}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {r.totalDays} <span className="text-xs text-gray-400">({r.sundayCount} Sundays)</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {r.totalWorkingDays}
                      </td>
                      <td className="px-4 py-3 text-sm text-green-600 font-medium">
                        {r.presentDays}
                      </td>
                      <td className="px-4 py-3 text-sm text-red-600">
                        {r.absentDays || 0}
                      </td>
                      <td className="px-4 py-3 text-sm text-purple-600 font-medium"> {/* Add this cell */}
  {r.leaveDates ? r.leaveDates.length : 0}
</td>
                      <td className="px-4 py-3 text-sm text-orange-600">
                        {r.lateArrivals}
                      </td>
                      <td className="px-4 py-3 text-sm text-amber-600">
  {r.halfDays || 0}
</td>
                      <td className="px-4 py-3 text-sm text-yellow-600">
                        {r.earlyDepartures}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusBadge.color}`}>
                          {attendancePercent}%
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button className="text-blue-600 hover:text-blue-800 transition-colors">
                          {expandedUser === r.user._id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </td>
                    </motion.tr>
                <AnimatePresence>
  {expandedUser === r.user._id && (
    <motion.tr
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
    >
      <td colSpan="10" className="px-4 py-4 bg-gray-50">
        <div className="space-y-4">
          {view === "present" && (
            <>
{renderPresentDetails(r.presentDetails, r.absentDates, month, r.leaveDates, r.user._id)}
              {renderLeaveDetails(r.leaveDates)}
              {renderUpcomingLeaves(r.upcomingLeaves)}
            </>
          )}
          {view === "absent" && (
            <>
              {renderAbsentDetails(r.absentDates)}
              {renderLeaveDetails(r.leaveDates)}
              {renderUpcomingLeaves(r.upcomingLeaves)}
            </>
          )}
          {view === "late" && (
            <>
              {renderLateDetails(r.lateDetails)}
              {renderLeaveDetails(r.leaveDates)}
              {renderUpcomingLeaves(r.upcomingLeaves)}
            </>
          )}
          {view === "early" && (
            <>
              {renderEarlyDetails(r.earlyDetails)}
              {renderLeaveDetails(r.leaveDates)}
              {renderUpcomingLeaves(r.upcomingLeaves)}
            </>
          )}
          {view === "attendance" && (
            <>
{renderPresentDetails(r.presentDetails, r.absentDates, month, r.leaveDates, r.user._id)}
              {renderAbsentDetails(r.absentDates)}
              {renderLateDetails(r.lateDetails)}
              {renderEarlyDetails(r.earlyDetails)}
              {renderLeaveDetails(r.leaveDates)}
              {renderUpcomingLeaves(r.upcomingLeaves)}
            </>
          )}
          {view === "leave" && (
            <>
              {renderLeaveDetails(r.leaveDates)}
              {renderUpcomingLeaves(r.upcomingLeaves)}
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

const reportButtons = [
  { key: "attendance", label: "Attendance Report", color: "blue", icon: <BarChart3 className="w-4 h-4" /> },
  { key: "present", label: "Present Report", color: "green", icon: <UserCheck className="w-4 h-4" /> },
  { key: "absent", label: "Absent Report", color: "red", icon: <UserX className="w-4 h-4" /> },
  { key: "late", label: "Late Arrival Report", color: "orange", icon: <Clock className="w-4 h-4" /> },
  { key: "early", label: "Early Departure Report", color: "yellow", icon: <AlertTriangle className="w-4 h-4" /> },
];

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
        Leave Dates
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

const renderUpcomingLeaves = (upcomingLeaves) => {
  if (!upcomingLeaves || upcomingLeaves.length === 0) return null;

  return (
    <motion.div 
      className="mt-3 bg-indigo-50 p-4 rounded-xl border border-indigo-200"
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
    >
      <h4 className="font-medium text-indigo-800 mb-3 flex items-center gap-2">
        <Calendar className="w-4 h-4" />
        Upcoming Approved Leaves
      </h4>
      <div className="space-y-2">
        {upcomingLeaves.map((leave, index) => (
          <div key={index} className="text-sm text-indigo-700 bg-indigo-100 p-3 rounded-lg">
            <div className="font-medium">
              {formatDate(leave.startDate)} to {formatDate(leave.endDate)}
            </div>
            <div className="text-xs text-indigo-600 mt-1">
              Duration: {calculateLeaveDuration(leave.startDate, leave.endDate)} days
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

// Add this helper function
const calculateLeaveDuration = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end dates
  return diffDays;
};

  return (
    <>
      <InternalNavbar />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            className="bg-white rounded-2xl shadow-xl p-6 sm:p-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                  Monthly Attendance Reports
                </h1>
                <p className="text-gray-600">
                  Comprehensive attendance analytics and insights
                </p>
              </div>
              <div className="mt-4 lg:mt-0">
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                  <p className="text-sm text-blue-700 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <strong>Working Hours:</strong> Check-in by 9:50 AM | Check-out after 6:00 PM
                  </p>
                </div>
              </div>
            </div>

            {/* Filters */}
            <motion.div 
              className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Select Month
                </label>
                <input
                  type="month"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                />
              </div>

           {(() => {
  // ✅ FIX: Handle role array properly
  const userRoles = parseUserRoles(user);
  const hasAdminAccess = userRoles.some(role => ['admin', 'accounts'].includes(role));
  
  return hasAdminAccess ? (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
        <Users className="w-4 h-4" />
        Select Employee
      </label>
      <select
        value={employee}
        onChange={(e) => setEmployee(e.target.value)}
        className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
      >
        <option value="">All Employees</option>
        {employees.map((emp) => (
          <option key={emp._id} value={emp._id}>
            {emp.name} ({emp.role})
          </option>
        ))}
      </select>
    </div>
  ) : (
    // Show current user's name for non-admin users
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
        <Users className="w-4 h-4" />
        Employee
      </label>
      <div className="w-full border border-gray-300 rounded-xl px-4 py-3 bg-gray-50 text-gray-600">
        {user?.name} (You)
      </div>
    </div>
  );
})()}

              <div className="flex items-end">
                <button
                  onClick={() => fetchReport(view)}
                  disabled={!month || loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-xl font-medium transition-colors duration-200 flex items-center justify-center gap-2"
                >
                  {loading ? <Loader className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  Generate Report
                </button>
              </div>
            </motion.div>

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