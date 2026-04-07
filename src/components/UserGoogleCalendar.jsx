import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, Gift } from "lucide-react";
import HolidaysList from "./HolidaysList";

const UserGoogleCalendar = ({ isOpen, onClose, user }) => {
  const [showHolidays, setShowHolidays] = useState(false);
  
  const userEmail = user?.email;
  
  const calendarSrc = userEmail 
    ? `https://calendar.google.com/calendar/embed?src=${encodeURIComponent(userEmail)}&ctz=Asia/Kolkata&mode=MONTH&showPrint=0&showCalendars=0&showTz=1`
    : `https://calendar.google.com/calendar/embed?ctz=Asia/Kolkata&mode=MONTH&showPrint=0&showCalendars=0&showTz=1`;

  return (
    <>
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

            {/* Calendar Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-white" />
                  <h2 className="text-lg font-semibold text-white">
                    Google Calendar (IST)
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  {/* Yearly Holidays Chart Button */}
                  <button
                    onClick={() => setShowHolidays(true)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors text-sm font-medium"
                  >
                    <Gift className="w-4 h-4" />
                    Yearly Holidays Chart
                  </button>
                  <button
                    onClick={onClose}
                    className="text-white/80 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

             

              {/* Calendar Iframe */}
              <div className="p-2 h-[80vh] bg-gray-50">
                <iframe
                  src={calendarSrc}
                  className="w-full h-full rounded-lg border-0 shadow-inner"
                  title="Google Calendar"
                  style={{ minHeight: "600px" }}
                  frameBorder="0"
                  scrolling="yes"
                />
              </div>

             
            </motion.div>
          </>
        )}
      </AnimatePresence>
      
      {/* Holidays List Modal */}
      <HolidaysList 
        isOpen={showHolidays} 
        onClose={() => setShowHolidays(false)} 
      />
    </>
  );
};

export default UserGoogleCalendar;