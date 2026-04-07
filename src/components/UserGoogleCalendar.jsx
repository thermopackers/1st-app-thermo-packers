import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, Gift } from "lucide-react";
import HolidaysList from "./HolidaysList";

const UserGoogleCalendar = ({ isOpen, onClose, user }) => {
  const [showHolidays, setShowHolidays] = useState(false);
  
  // Safely encode the email to prevent malformed requests
  const userEmail = user?.email ? encodeURIComponent(user.email) : null;
  
  // Create calendar embed URL with proper encoding
  const calendarSrc = userEmail 
    ? `https://calendar.google.com/calendar/embed?src=${userEmail}&ctz=Asia%2FKolkata&mode=MONTH&showPrint=0&showCalendars=0&showTz=1`
    : `https://calendar.google.com/calendar/embed?ctz=Asia%2FKolkata&mode=MONTH&showPrint=0&showCalendars=0&showTz=1`;

  // If no user or no email, don't render the calendar
  if (!user || !user.email) {
    return null;
  }

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
              className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-[95%] max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden"
              style={{ maxHeight: "90vh" }}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  <h2 className="text-sm sm:text-lg font-semibold text-white">
                    Google Calendar (IST)
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  {/* Yearly Holidays Chart Button */}
                  <button
                    onClick={() => setShowHolidays(true)}
                    className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors text-xs sm:text-sm font-medium"
                  >
                    <Gift className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Yearly Holidays Chart</span>
                    <span className="sm:hidden">Holidays</span>
                  </button>
                  <button
                    onClick={onClose}
                    className="text-white/80 hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>
              </div>

              {/* Info Banner */}
              <div className="px-3 sm:px-4 py-2 text-xs text-amber-700 bg-amber-50 border-b border-amber-200 flex items-center gap-2">
                <span>ℹ️</span>
                <span className="text-[10px] sm:text-xs">Login to Google Calendar to see your events</span>
              </div>

              {/* Calendar Iframe - with error handling */}
              <div className="p-1 sm:p-2 h-[60vh] sm:h-[70vh] bg-gray-50">
                <iframe
                  key={calendarSrc}
                  src={calendarSrc}
                  className="w-full h-full rounded-lg border-0 shadow-inner"
                  title="Google Calendar"
                  style={{ minHeight: "400px" }}
                  frameBorder="0"
                  scrolling="yes"
                  sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-scripts"
                />
              </div>

              {/* Footer */}
              <div className="p-2 sm:p-3 bg-gray-50 border-t border-gray-200 text-center text-[10px] sm:text-xs text-gray-500">
                <span>🕐 Timezone: Indian Standard Time (IST) | UTC+5:30</span>
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