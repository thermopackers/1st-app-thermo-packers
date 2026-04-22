import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, Search, ChevronLeft, ChevronRight, Filter } from "lucide-react";
import { holidays2026, getHolidaysByMonth, getUpcomingHolidays } from "../data/holidays2026";

const HolidaysList = ({ isOpen, onClose }) => {
  const [viewMode, setViewMode] = useState("all"); // "all", "monthly", "upcoming"
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [searchTerm, setSearchTerm] = useState("");
  
  const { months, holidaysByMonth } = getHolidaysByMonth();
  const upcomingHolidays = getUpcomingHolidays();
  
  // Format date for display
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { 
      day: 'numeric', 
      month: 'short',
      year: 'numeric'
    });
  };
  
  // Filter holidays by search term
  const filterHolidays = (holidays) => {
    if (!searchTerm) return holidays;
    return holidays.filter(h => 
      h.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.date.includes(searchTerm)
    );
  };
  
  // Get current month name
  const getMonthName = (monthIndex) => {
    return months[monthIndex];
  };
  
  // Navigation for monthly view
  const prevMonth = () => {
    setCurrentMonth(prev => prev === 0 ? 11 : prev - 1);
  };
  
  const nextMonth = () => {
    setCurrentMonth(prev => prev === 11 ? 0 : prev + 1);
  };
  
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />
          
          {/* Holidays Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-green-600 to-teal-600">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-white" />
                <h2 className="text-lg font-semibold text-white">
                  Yearly Holidays Chart 2026
                </h2>
              </div>
              <button
                onClick={onClose}
                className="text-white/80 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* View Mode Tabs */}
            <div className="flex border-b border-gray-200 bg-gray-50">
              <button
                onClick={() => setViewMode("all")}
                className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                  viewMode === "all"
                    ? "text-green-600 border-b-2 border-green-600 bg-white"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                All Holidays Yearly
              </button>
              <button
                onClick={() => setViewMode("monthly")}
                className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                  viewMode === "monthly"
                    ? "text-green-600 border-b-2 border-green-600 bg-white"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Monthly View
              </button>
              <button
                onClick={() => setViewMode("upcoming")}
                className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                  viewMode === "upcoming"
                    ? "text-green-600 border-b-2 border-green-600 bg-white"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Upcoming Holidays
              </button>
            </div>
            
            {/* Search Bar */}
            <div className="p-4 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search holidays..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>
            
            {/* Content */}
            <div className="p-4 overflow-y-auto flex-1">
              {/* All Holidays View */}
              {viewMode === "all" && (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead className="bg-gray-100 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">S.N.</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Holiday</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Date</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Saka Date</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Day</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filterHolidays(holidays2026).map((holiday) => (
                        <tr key={holiday.sn} className="hover:bg-gray-50">
                          <td className="px-3 py-2 text-sm text-gray-600">{holiday.sn}</td>
                          <td className="px-3 py-2 text-sm font-medium text-gray-800">{holiday.name}</td>
                          <td className="px-3 py-2 text-sm text-gray-600">{formatDate(holiday.date)}</td>
                          <td className="px-3 py-2 text-sm text-gray-600">{holiday.sakaDate}</td>
                          <td className="px-3 py-2 text-sm">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              holiday.day === "Sunday" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-700"
                            }`}>
                              {holiday.day}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filterHolidays(holidays2026).length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No holidays found matching your search
                    </div>
                  )}
                </div>
              )}
              
              {/* Monthly View */}
              {viewMode === "monthly" && (
                <div>
                  {/* Month Navigation */}
                  <div className="flex items-center justify-between mb-4">
                    <button
                      onClick={prevMonth}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <h3 className="text-lg font-semibold text-gray-800">
                      {getMonthName(currentMonth)} 2026
                    </h3>
                    <button
                      onClick={nextMonth}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                  
                  {/* Holidays in selected month */}
                  {holidaysByMonth[currentMonth].length > 0 ? (
                    <div className="space-y-2">
                      {holidaysByMonth[currentMonth].map((holiday) => (
                        <div key={holiday.sn} className="p-3 bg-green-50 rounded-lg border border-green-200">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-semibold text-gray-800">{holiday.name}</p>
                              <p className="text-sm text-gray-600 mt-1">
                                📅 {formatDate(holiday.date)} | {holiday.day}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                Saka Date: {holiday.sakaDate}
                              </p>
                            </div>
                            <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                              Holiday
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                      No holidays in {getMonthName(currentMonth)}
                    </div>
                  )}
                </div>
              )}
              
              {/* Upcoming Holidays View */}
              {viewMode === "upcoming" && (
                <div className="space-y-3">
                  {filterHolidays(upcomingHolidays).map((holiday, index) => (
                    <div key={holiday.sn} className="p-3 bg-gradient-to-r from-green-50 to-teal-50 rounded-lg border border-green-200">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-bold text-green-600">#{index + 1}</span>
                            <h4 className="font-semibold text-gray-800">{holiday.name}</h4>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm mt-2">
                            <div>
                              <span className="text-gray-500">Date:</span>
                              <span className="ml-2 text-gray-700">{formatDate(holiday.date)}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Day:</span>
                              <span className={`ml-2 ${holiday.day === "Sunday" ? "text-red-600" : "text-gray-700"}`}>
                                {holiday.day}
                              </span>
                            </div>
                            <div className="col-span-2">
                              <span className="text-gray-500">Saka Date:</span>
                              <span className="ml-2 text-gray-700">{holiday.sakaDate}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                            <Calendar className="w-3 h-3" />
                            Holiday
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {filterHolidays(upcomingHolidays).length === 0 && (
                    <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                      No upcoming holidays for the rest of the year
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Footer with stats */}
            <div className="p-3 bg-gray-50 border-t border-gray-200 text-center text-xs text-gray-500">
              <span>Total Holidays in 2026: {holidays2026.length}</span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default HolidaysList;