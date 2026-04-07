import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, Gift, ExternalLink, AlertCircle } from "lucide-react";
import HolidaysList from "./HolidaysList";

const UserGoogleCalendar = ({ isOpen, onClose, user }) => {
  const [showHolidays, setShowHolidays] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // Detect mobile device
  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  const userEmail = user?.email;
  
  // Google Calendar Web URL (opens in new tab)
  const calendarWebUrl = userEmail 
    ? `https://calendar.google.com/calendar/u/0/r?tab=mc`
    : `https://calendar.google.com/calendar/u/0/r`;
  
  // Alternative: Direct link to user's calendar
  const directCalendarUrl = `https://calendar.google.com/calendar/embed?src=${encodeURIComponent(userEmail || '')}&ctz=Asia/Kolkata`;
  
  // Open calendar in new tab
  const openCalendarInNewTab = () => {
    window.open(calendarWebUrl, '_blank', 'noopener,noreferrer');
  };
  
  // For desktop: use iframe
  // For mobile: show button to open in new tab
  const renderContent = () => {
    if (isMobile) {
      return (
        <div className="flex flex-col items-center justify-center p-6 sm:p-8 text-center">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Calendar className="w-10 h-10 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            Open Google Calendar
          </h3>
          <p className="text-gray-500 text-sm mb-6 max-w-xs">
            For the best experience on mobile, open Google Calendar in a new tab
          </p>
          <button
            onClick={openCalendarInNewTab}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Open Google Calendar
          </button>
          
          <div className="mt-6 p-3 bg-amber-50 rounded-lg border border-amber-200">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5" />
              <p className="text-xs text-amber-700 text-left">
                Make sure you're logged into your Google account in your browser
              </p>
            </div>
          </div>
        </div>
      );
    }
    
    // Desktop: use iframe
    const calendarSrc = userEmail 
      ? `https://calendar.google.com/calendar/embed?src=${encodeURIComponent(userEmail)}&ctz=Asia%2FKolkata&mode=MONTH&showPrint=0&showCalendars=0&showTz=1`
      : `https://calendar.google.com/calendar/embed?ctz=Asia%2FKolkata&mode=MONTH&showPrint=0&showCalendars=0&showTz=1`;
    
    return (
      <>
        <div className="px-4 py-2 text-xs text-amber-700 bg-amber-50 border-b border-amber-200 flex items-center gap-2">
          <span>ℹ️</span>
          <span>Login to Google Calendar to see your events</span>
        </div>
        <div className="p-2 h-[70vh] bg-gray-50">
          <iframe
            src={calendarSrc}
            className="w-full h-full rounded-lg border-0 shadow-inner"
            title="Google Calendar"
            frameBorder="0"
            scrolling="yes"
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-popups-to-escape-sandbox"
          />
        </div>
      </>
    );
  };

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

              {/* Content - Mobile/Desktop different */}
              {renderContent()}

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