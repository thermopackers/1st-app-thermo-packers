import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar as CalendarIcon, CheckCircle, Clock, AlertCircle, ChevronLeft, ChevronRight, Gift } from "lucide-react";
import ReactCalendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import axiosInstance from "../axiosInstance";
import { useUserContext } from "../context/UserContext";
import HolidaysList from "./HolidaysList";

const UserGoogleCalendar = ({ isOpen, onClose, user }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [markedDates, setMarkedDates] = useState({});
  const [showHolidays, setShowHolidays] = useState(false);
  const { user: currentUser } = useUserContext();

  // Fetch tasks for the current user
  useEffect(() => {
    if (isOpen && currentUser?._id) {
      fetchUserTasks();
    }
  }, [isOpen, currentUser]);

  const fetchUserTasks = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axiosInstance.get("/todos/my-tasks", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const tasksList = response.data;
      setTasks(tasksList);
      
      // Mark dates that have tasks
      const marked = {};
      tasksList.forEach(task => {
        if (task.dueDate) {
          const dateKey = new Date(task.dueDate).toDateString();
          if (!marked[dateKey]) {
            marked[dateKey] = [];
          }
          marked[dateKey].push({
            title: task.title,
            status: task.status,
            id: task._id,
            description: task.description
          });
        }
      });
      setMarkedDates(marked);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  // Get tasks for selected date
  const getTasksForDate = (date) => {
    const dateKey = date.toDateString();
    return markedDates[dateKey] || [];
  };

  const selectedDateTasks = getTasksForDate(selectedDate);

  // Custom tile content for calendar
  const tileContent = ({ date, view }) => {
    if (view === 'month') {
      const dateKey = date.toDateString();
      const tasksOnDate = markedDates[dateKey];
      if (tasksOnDate && tasksOnDate.length > 0) {
        const hasPending = tasksOnDate.some(t => t.status !== "DONE");
        const hasCompleted = tasksOnDate.some(t => t.status === "DONE");
        
        return (
          <div className="flex justify-center gap-0.5 mt-1">
            {hasPending && <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>}
            {hasCompleted && <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>}
          </div>
        );
      }
    }
    return null;
  };

  // Custom tile className
  const tileClassName = ({ date, view }) => {
    if (view === 'month') {
      const dateKey = date.toDateString();
      const tasksOnDate = markedDates[dateKey];
      if (tasksOnDate && tasksOnDate.length > 0) {
        const hasPending = tasksOnDate.some(t => t.status !== "DONE");
        if (hasPending) {
          return "has-pending-task";
        }
        return "has-task";
      }
    }
    return "";
  };

  // Format date for display
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Get status badge color
  const getStatusBadge = (status) => {
    if (status === "DONE") {
      return { color: "bg-green-100 text-green-800", icon: <CheckCircle className="w-3 h-3" />, text: "Completed" };
    }
    return { color: "bg-orange-100 text-orange-800", icon: <Clock className="w-3 h-3" />, text: "Pending" };
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-[95%] max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700 sticky top-0 z-10">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-white" />
                  <h2 className="text-lg font-semibold text-white">My Task Calendar</h2>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowHolidays(true)}
                    className="flex items-center gap-1 px-2 py-1 bg-green-500 text-white rounded-lg text-xs hover:bg-green-600 transition-colors"
                    title="View Holidays"
                  >
                    <Gift className="w-3 h-3" />
                    Holidays
                  </button>
                  <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Legend */}
              <div className="p-4 bg-gray-50 border-b border-gray-200 flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-gray-600">Completed Tasks</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                  <span className="text-gray-600">Pending Tasks</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="text-gray-600">Selected Date</span>
                </div>
              </div>

              {/* Calendar and Tasks Section */}
              <div className="p-4 md:p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Calendar */}
                  <div className="calendar-container">
                    <ReactCalendar
                      onChange={setSelectedDate}
                      value={selectedDate}
                      tileContent={tileContent}
                      tileClassName={tileClassName}
                      className="w-full border-0 shadow-sm rounded-lg"
                      nextLabel={<ChevronRight className="w-4 h-4" />}
                      prevLabel={<ChevronLeft className="w-4 h-4" />}
                      next2Label={null}
                      prev2Label={null}
                    />
                  </div>

                  {/* Tasks List for Selected Date */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="mb-4">
                      <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                        <CalendarIcon className="w-4 h-4 text-blue-600" />
                        Tasks for {formatDate(selectedDate)}
                      </h3>
                    </div>

                    {loading ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="text-gray-500 mt-2">Loading tasks...</p>
                      </div>
                    ) : selectedDateTasks.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="text-5xl mb-3">📭</div>
                        <p className="text-gray-500">No tasks scheduled for this date</p>
                        <p className="text-xs text-gray-400 mt-2">Enjoy your day!</p>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {selectedDateTasks.map((task, idx) => {
                          const badge = getStatusBadge(task.status);
                          return (
                            <div
                              key={task.id || idx}
                              className="bg-white rounded-lg p-3 shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                  <p className="font-medium text-gray-800 text-sm">{task.title}</p>
                                  {task.description && (
                                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{task.description}</p>
                                  )}
                                </div>
                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
                                  {badge.icon}
                                  {badge.text}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-3 bg-gray-50 border-t border-gray-200 text-center">
                <p className="text-xs text-gray-500">
                  Showing tasks assigned to you with due dates
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Holidays List Modal */}
      <HolidaysList isOpen={showHolidays} onClose={() => setShowHolidays(false)} />

      <style jsx>{`
        :global(.react-calendar) {
          border: none;
          font-family: inherit;
          width: 100%;
        }
        
        :global(.react-calendar__navigation) {
          margin-bottom: 1rem;
        }
        
        :global(.react-calendar__navigation button) {
          color: #1f2937;
          font-weight: 500;
        }
        
        :global(.react-calendar__navigation button:enabled:hover),
        :global(.react-calendar__navigation button:enabled:focus) {
          background-color: #e5e7eb;
          border-radius: 0.5rem;
        }
        
        :global(.react-calendar__month-view__weekdays) {
          text-transform: uppercase;
          font-weight: 600;
          font-size: 0.75rem;
          color: #6b7280;
        }
        
        :global(.react-calendar__month-view__weekdays__weekday) {
          padding: 0.5rem;
        }
        
        :global(.react-calendar__month-view__weekdays__weekday abbr) {
          text-decoration: none;
        }
        
        :global(.react-calendar__tile) {
          padding: 0.75rem 0.5rem;
          position: relative;
          border-radius: 0.5rem;
          transition: all 0.2s ease;
        }
        
        :global(.react-calendar__tile:enabled:hover) {
          background-color: #dbeafe;
        }
        
        :global(.react-calendar__tile--now) {
          background-color: #eff6ff;
          font-weight: 600;
        }
        
        :global(.react-calendar__tile--active) {
          background-color: #3b82f6 !important;
          color: white !important;
        }
        
        :global(.react-calendar__tile--active:enabled:hover) {
          background-color: #2563eb !important;
        }
        
        :global(.has-pending-task) {
          background-color: #fff7ed;
        }
        
        :global(.has-pending-task.react-calendar__tile--active) {
          background-color: #3b82f6 !important;
        }
        
        :global(.has-task) {
          background-color: #f0fdf4;
        }
        
        :global(.has-task.react-calendar__tile--active) {
          background-color: #3b82f6 !important;
        }
        
        @media (max-width: 768px) {
          :global(.react-calendar__tile) {
            padding: 0.5rem 0.25rem;
            font-size: 0.875rem;
          }
        }
      `}</style>
    </>
  );
};

export default UserGoogleCalendar;