import React, { useState } from "react";
import { FaWhatsapp, FaTimes } from "react-icons/fa";

const FloatingWhatsApp = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  const handleClick = () => {
    if (isOpen) {
      setIsOpen(false);
    } else {
      // Open WhatsApp in new tab
      window.open(
        "https://wa.me/919878165432?text=Hi%20there!%20I'm%20interested%20in%20your%20packaging%20services",
        "_blank",
        "noopener,noreferrer"
      );
    }
  };

  const handleClose = () => {
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 xs:bottom-6 right-4 xs:right-6 z-50 group">
      {/* Main WhatsApp Button */}
      <button
        onClick={handleClick}
        className="relative flex items-center justify-center w-14 h-14 xs:w-16 xs:h-16 bg-gradient-to-br from-green-500 via-green-600 to-green-700 text-white rounded-full shadow-[0_6px_20px_rgba(0,0,0,0.3)] hover:shadow-[0_8px_25px_rgba(0,0,0,0.4)] transition-all duration-300 ease-in-out hover:scale-110 active:scale-95"
        aria-label="Contact us on WhatsApp"
      >
        <FaWhatsapp className="w-6 h-6 xs:w-7 xs:h-7 drop-shadow-sm" />
        
        {/* Notification Dot */}
        <div className="absolute -top-1 -right-1 w-3 h-3 xs:w-3.5 xs:h-3.5 bg-red-500 rounded-full border-2 border-white animate-ping"></div>
        <div className="absolute -top-1 -right-1 w-3 h-3 xs:w-3.5 xs:h-3.5 bg-red-500 rounded-full border-2 border-white"></div>
      </button>

      {/* Tooltip */}
      <div className="absolute right-20 bottom-1/2 transform translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none">
        <div className="bg-gray-900 text-white text-sm px-3 py-2 rounded-lg shadow-lg whitespace-nowrap">
          Chat with us on WhatsApp
          <div className="absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2 rotate-45 w-2 h-2 bg-gray-900"></div>
        </div>
      </div>

      {/* Close Button */}
      <button
        onClick={handleClose}
        className="absolute -top-2 -left-2 w-6 h-6 xs:w-7 xs:h-7 bg-gray-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-700 transition-all duration-200 opacity-0 group-hover:opacity-100 transform scale-0 group-hover:scale-100"
        aria-label="Close WhatsApp button"
      >
        <FaTimes className="w-3 h-3 xs:w-3.5 xs:h-3.5" />
      </button>

      {/* Pulse Animation */}
      <div className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-20 pointer-events-none"></div>
    </div>
  );
};

export default FloatingWhatsApp;