import React, { useState, useEffect } from "react";
import { FaWhatsapp, FaTimes, FaSpinner } from "react-icons/fa";
import axiosInstance from "../axiosInstance";

const FloatingWhatsApp = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // YOUR BUSINESS WHATSAPP NUMBER
  const BUSINESS_WHATSAPP_NUMBER = "919878165432"; // Remove the first 0 if present
    // const BUSINESS_WHATSAPP_NUMBER = "916206002096"; // Remove the first 0 if present

  const [leadFormData, setLeadFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "Hi there! I'm interested in your packaging services"
  });

  const [leadSubmitted, setLeadSubmitted] = useState(() => {
    return sessionStorage.getItem('whatsapp_lead_submitted') === 'true';
  });

const captureLead = async (leadData) => {
  setError(null);
  setLoading(true);
  
  const cleanPhone = leadData.phone.replace(/\D/g, '');
  
  const payload = {
    name: leadData.name,
    email: leadData.email,
    phone: cleanPhone,
    message: leadData.message,
    pageUrl: window.location.href,
    userAgent: navigator.userAgent
  };
  
  try {
    // Save to database
    const response = await axiosInstance.post('/leads/whatsapp', payload);
    
    if (response.data.success) {
      sessionStorage.setItem('whatsapp_lead_submitted', 'true');
      sessionStorage.setItem('lead_phone', cleanPhone);
      
      setShowLeadForm(false);
      setIsOpen(false);
      
      // 🟢 CREATE COMPLETE MESSAGE WITH ALL DETAILS
      const completeMessage = `*🟢 NEW LEAD DETAILS*

Name: ${leadData.name}
Email: ${leadData.email}
Phone: +91${cleanPhone}
Message: ${leadData.message}
Page: ${window.location.pathname || 'Homepage'}
Time: ${new Date().toLocaleString()}

📞 Phone: +91${cleanPhone}
💬 Reply to this message to connect!`;

      // Use your business WhatsApp number (without + or spaces)
      const BUSINESS_NUMBER = "916206002096"; // Your number from logs
      const encodedMessage = encodeURIComponent(completeMessage);
      const whatsappUrl = `https://wa.me/${BUSINESS_NUMBER}?text=${encodedMessage}`;
      
      console.log("Opening WhatsApp with complete details");
      window.open(whatsappUrl, "_blank");
      
      return true;
    }
  } catch (error) {
    console.error("Error saving lead:", error);
    
    // Still open WhatsApp even if save fails
    const completeMessage = `*🟢 NEW LEAD INQUIRY*

Name: ${leadData.name}
Email: ${leadData.email}
Phone: +91${cleanPhone}
Message: ${leadData.message}`;
    
    const BUSINESS_NUMBER = "916206002096";
    const whatsappUrl = `https://wa.me/${BUSINESS_NUMBER}?text=${encodeURIComponent(completeMessage)}`;
    window.open(whatsappUrl, "_blank");
    
    setTimeout(() => {
      setShowLeadForm(false);
      setIsOpen(false);
    }, 2000);
    
    return false;
  } finally {
    setLoading(false);
  }
};

  const handleClick = () => {
    if (isOpen) {
      setIsOpen(false);
      setShowLeadForm(false);
      setError(null);
    } else {
      setIsOpen(true);
      setTimeout(() => setShowLeadForm(true), 300);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    
    if (!leadFormData.name.trim()) {
      setError("Please enter your name");
      return;
    }
    if (!leadFormData.email.trim()) {
      setError("Please enter your email");
      return;
    }
    if (!leadFormData.phone.trim()) {
      setError("Please enter your WhatsApp number");
      return;
    }
    
    const phoneDigits = leadFormData.phone.replace(/\D/g, '');
    if (phoneDigits.length !== 10) {
      setError("Please enter a valid 10-digit WhatsApp number");
      return;
    }
    
    setError(null);
    await captureLead(leadFormData);
  };

  const handleInputChange = (e) => {
    setLeadFormData({
      ...leadFormData,
      [e.target.name]: e.target.value
    });
    if (error) setError(null);
  };

  const openWhatsAppDirect = () => {
    const whatsappUrl = `https://wa.me/${BUSINESS_WHATSAPP_NUMBER}`;
    window.open(whatsappUrl, "_blank");
    setIsOpen(false);
    setShowLeadForm(false);
    setError(null);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 xs:bottom-6 right-4 xs:right-6 z-50 group">
      <button
        onClick={handleClick}
        className="relative flex items-center justify-center w-14 h-14 xs:w-16 xs:h-16 bg-gradient-to-br from-green-500 via-green-600 to-green-700 text-white rounded-full shadow-[0_6px_20px_rgba(0,0,0,0.3)] hover:shadow-[0_8px_25px_rgba(0,0,0,0.4)] transition-all duration-300 ease-in-out hover:scale-110 active:scale-95"
        aria-label="Contact us on WhatsApp"
      >
        {loading ? (
          <FaSpinner className="w-6 h-6 xs:w-7 xs:h-7 animate-spin" />
        ) : (
          <FaWhatsapp className="w-6 h-6 xs:w-7 xs:h-7 drop-shadow-sm" />
        )}
        
        {!leadSubmitted && (
          <>
            <div className="absolute -top-1 -right-1 w-3 h-3 xs:w-3.5 xs:h-3.5 bg-red-500 rounded-full border-2 border-white animate-ping"></div>
            <div className="absolute -top-1 -right-1 w-3 h-3 xs:w-3.5 xs:h-3.5 bg-red-500 rounded-full border-2 border-white"></div>
          </>
        )}
      </button>

      {isOpen && showLeadForm && !leadSubmitted && (
        <div className="absolute bottom-10 right-0 w-80 bg-white rounded-2xl shadow-2xl overflow-hidden animate-slideIn">
          <div className="bg-gradient-to-r from-green-600 to-green-700 px-4 py-3 flex justify-between items-center">
            <div>
              <h3 className="text-white font-semibold text-sm">Quick Contact</h3>
              <p className="text-green-100 text-xs">We'll get back to you soon</p>
            </div>
            <button 
              onClick={openWhatsAppDirect}
              className="text-white text-xs px-2 py-1 bg-green-500 rounded-lg hover:bg-green-400 transition"
            >
              Skip →
            </button>
          </div>
          
          <form onSubmit={handleFormSubmit} className="p-4 space-y-3">
            {error && (
              <div className="bg-red-50 text-red-600 text-xs p-2 rounded-lg border border-red-200">
                {error}
              </div>
            )}
            
            <div>
              <input
                type="text"
                name="name"
                placeholder="Your Name *"
                value={leadFormData.name}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <input
                type="email"
                name="email"
                placeholder="Your Email *"
                value={leadFormData.email}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <input
                type="tel"
                name="phone"
                placeholder="WhatsApp Number * (10 digits)"
                value={leadFormData.phone}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <p className="text-xs text-gray-400 mt-1">Enter 10-digit number without +91</p>
            </div>
            <div>
              <textarea
                name="message"
                placeholder="Your Message"
                rows="2"
                value={leadFormData.message}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-2 rounded-lg font-medium hover:from-green-700 hover:to-green-800 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <FaSpinner className="animate-spin" />
                  Saving...
                </>
              ) : (
                "Chat on WhatsApp →"
              )}
            </button>
            <p className="text-xs text-gray-400 text-center">
              We'll save your details and connect on WhatsApp
            </p>
          </form>
        </div>
      )}

      {isOpen && leadSubmitted && (
        <div className="absolute bottom-20 right-0 w-64 bg-white rounded-2xl shadow-2xl p-4 text-center animate-slideIn">
          <div className="text-green-600 text-4xl mb-2">✓</div>
          <p className="text-gray-700 text-sm font-medium">You've already connected with us!</p>
          <button
            onClick={openWhatsAppDirect}
            className="mt-3 text-green-600 text-sm font-semibold hover:text-green-700"
          >
            Open WhatsApp →
          </button>
        </div>
      )}

      <div className="absolute right-20 bottom-1/2 transform translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none">
        <div className="bg-gray-900 text-white text-sm px-3 py-2 rounded-lg shadow-lg whitespace-nowrap">
          Chat with us on WhatsApp
          <div className="absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2 rotate-45 w-2 h-2 bg-gray-900"></div>
        </div>
      </div>

     

      <div className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-20 pointer-events-none"></div>
    </div>
  );
};

export default FloatingWhatsApp;