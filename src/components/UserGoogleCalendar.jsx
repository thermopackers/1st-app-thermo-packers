import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, ExternalLink, Gift } from "lucide-react";
import HolidaysList from "./HolidaysList";

const UserGoogleCalendar = ({ isOpen, onClose, user }) => {
  const [showHolidays, setShowHolidays] = useState(false);

  const openGoogleCalendar = () => {
    window.open('https://calendar.google.com/calendar/u/0/r', '_blank');
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
              className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-[90%] max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-white" />
                  <h2 className="text-lg font-semibold text-white">Google Calendar</h2>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowHolidays(true)}
                    className="flex items-center gap-1 px-2 py-1 bg-green-500 text-white rounded-lg text-xs"
                  >
                    <Gift className="w-3 h-3" />
                    Holidays
                  </button>
                  <button onClick={onClose} className="text-white/80">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 text-center">
                <div className="text-6xl mb-4">📅</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  Google Calendar
                </h3>
                <p className="text-gray-600 mb-6 text-sm">
                  Click the button below to open Google Calendar in a new tab
                </p>
                <button
                  onClick={openGoogleCalendar}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors w-full justify-center"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open Google Calendar
                </button>
                <p className="text-xs text-gray-400 mt-4">
                  Make sure you're logged into your Google account
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <HolidaysList isOpen={showHolidays} onClose={() => setShowHolidays(false)} />
    </>
  );
};

export default UserGoogleCalendar;