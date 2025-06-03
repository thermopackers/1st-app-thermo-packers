import React from "react";
import { FaWhatsapp } from "react-icons/fa";

const FloatingWhatsApp = () => {
  return (
    <div className="fixed bottom-6 right-7 z-50 group">
      <a
        href="https://wa.me/919878165432?text=Hi%20there!%20I'm%20interested%20in%20your%20services"
        target="_blank"
        rel="noopener noreferrer"
        className="relative flex items-center justify-center w-14 h-14 bg-gradient-to-br from-green-500 via-green-600 to-green-700 text-white rounded-full shadow-[0_6px_20px_rgba(0,0,0,0.3)] hover:scale-110 transition-transform duration-200 ease-in-out animate-bounce"
      >
        <FaWhatsapp size={27} className="drop-shadow-sm" />
        
        {/* Tooltip */}
        <span className="absolute right-20 bg-black text-white text-sm px-3 py-1 rounded opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap">
          Chat with us
        </span>
      </a>
    </div>
  );
};

export default FloatingWhatsApp;
