import React, { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  FaFacebookF,
  FaTwitter,
  FaInstagram,
  FaLinkedinIn,
  FaYoutube,
  FaPhone,
  FaEnvelope,
  FaMapMarkerAlt,
  FaClock,
  FaUserTie,
  FaTruck,
  FaShieldAlt,
  FaAward
} from "react-icons/fa";

gsap.registerPlugin(ScrollTrigger);

export default function Footer() {
  const footerRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  
  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;

    const ctx = gsap.context(() => {
      // Main footer animation
      gsap.fromTo(
        footerRef.current,
        { 
          y: 100, 
          opacity: 0 
        },
        {
          y: 0,
          opacity: 1,
          duration: 1.2,
          ease: "power3.out",
          scrollTrigger: {
            trigger: footerRef.current,
            start: "top 90%",
            end: "bottom bottom",
            toggleActions: "play none none reverse",
          },
        }
      );

      // Stagger animation for footer sections
      gsap.fromTo(
        ".footer-section",
        {
          y: 30,
          opacity: 0
        },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.15,
          ease: "back.out(1.7)",
          scrollTrigger: {
            trigger: footerRef.current,
            start: "top 85%",
            toggleActions: "play none none reverse",
          },
        }
      );

      // Social icons animation
      gsap.fromTo(
        ".social-icon",
        {
          scale: 0,
          rotation: -180
        },
        {
          scale: 1,
          rotation: 0,
          duration: 0.6,
          stagger: 0.1,
          ease: "back.out(1.7)",
          scrollTrigger: {
            trigger: footerRef.current,
            start: "top 80%",
            toggleActions: "play none none reverse",
          },
        }
      );

      ScrollTrigger.refresh();
    }, footerRef);

    return () => ctx.revert();
  }, [location.pathname]);

  const handleLoginClick = (mode = 'employee') => {
    navigate(`/login${mode === 'customer' ? '?mode=customer' : ''}`);
  };

  const quickLinks = [
    { path: "/", label: "Home", icon: "🏠" },
    { path: "/products", label: "Products", icon: "📦" },
    { path: "/about", label: "About Us", icon: "📘" },
    { path: "/contact", label: "Contact", icon: "☎️" }
  ];

  const contactInfo = [
    { 
      icon: <FaPhone className="w-4 h-4" />, 
      text: "+91-9878165432, 9216562160, 9216660160",
      href: "tel:+919878165432"
    },
    { 
      icon: <FaEnvelope className="w-4 h-4" />, 
      text: "thermopackers@gmail.com",
      href: "mailto:thermopackers@gmail.com"
    },
    { 
      icon: <FaMapMarkerAlt className="w-4 h-4" />, 
      text: "Kapurthala Road, Jalandhar, Punjab",
      href: "https://maps.google.com/?q=Kapurthala+Road,Jalandhar,Punjab"
    },
    { 
      icon: <FaClock className="w-4 h-4" />, 
      text: "Mon - Sat / 9:00 AM - 6:00 PM",
      href: null
    }
  ];

  const socialLinks = [
    { 
      icon: <FaFacebookF />, 
      href: "https://www.facebook.com/share/1HDPuxzLq2/?mibextid=wwXIfr",
      color: "hover:text-blue-400",
      name: "Facebook"
    },
    { 
      icon: <FaInstagram />, 
      href: "https://www.instagram.com/thermopackers/profilecard/?igsh=MTlwZnV2NTEybXh3ag==",
      color: "hover:text-pink-500",
      name: "Instagram"
    },
    { 
      icon: <FaLinkedinIn />, 
      href: "https://www.linkedin.com/company/thermo-packers/",
      color: "hover:text-blue-300",
      name: "LinkedIn"
    },
    { 
      icon: <FaYoutube />, 
      href: "https://youtube.com/@thermopackers?si=d1HWJiTXt2wzLvQp",
      color: "hover:text-red-500",
      name: "YouTube"
    }
  ];

  const features = [
    { icon: <FaShieldAlt className="w-5 h-5" />, text: "Quality Certified" },
    { icon: <FaTruck className="w-5 h-5" />, text: "Fast Delivery" },
    { icon: <FaAward className="w-5 h-5" />, text: "Industry Leaders" }
  ];

  return (
    <footer
      ref={footerRef}
      className="relative bg-gradient-to-br from-gray-900 via-[#121212] to-gray-800 border-t border-white/10 shadow-2xl rounded-t-3xl text-white overflow-hidden"
    >
      {/* Background Effects */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 left-0 w-72 h-72 bg-[#B0BC27]/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl translate-x-1/3 translate-y-1/3"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5 backdrop-blur-[1px]"></div>
      </div>

      <div className="relative z-10 px-4 xs:px-6 sm:px-8 lg:px-12 xl:px-20 py-12 md:py-16 lg:py-20">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 md:gap-10 lg:gap-12 mb-12">
          {/* Company Info */}
          <div className="footer-section lg:col-span-1">
            <div className="flex flex-col items-start lg:items-start">
              <img 
                src="/images/logo.png" 
                alt="Thermo Packers" 
                className="h-16 lg:h-20 mb-4 lg:mb-6 object-contain hover:scale-105 transition-transform duration-300"
              />
              <p className="text-sm lg:text-base text-white/80 leading-relaxed mb-6 max-w-xs">
                Delivering cutting-edge thermocol packaging & insulation solutions across industries since 1998.
              </p>
              
              {/* Features */}
              <div className="space-y-3">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-3 text-white/70">
                    <div className="text-[#B0BC27]">
                      {feature.icon}
                    </div>
                    <span className="text-sm font-medium">{feature.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="footer-section">
            <h4 className="text-[#B0BC27] font-bold text-lg lg:text-xl mb-6 flex items-center gap-2">
              <FaPhone className="w-5 h-5" />
              Contact Info
            </h4>
            <ul className="space-y-4">
              {contactInfo.map((item, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="text-[#B0BC27] mt-0.5 flex-shrink-0">
                    {item.icon}
                  </div>
                  {item.href ? (
                    <a 
                      href={item.href}
                      className="text-sm lg:text-base text-white/80 hover:text-white transition-colors duration-300 leading-relaxed"
                    >
                      {item.text}
                    </a>
                  ) : (
                    <span className="text-sm lg:text-base text-white/80 leading-relaxed">
                      {item.text}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Links */}
          <div className="footer-section">
            <h4 className="text-[#B0BC27] font-bold text-lg lg:text-xl mb-6">
              Quick Links
            </h4>
            <ul className="space-y-3">
              {quickLinks.map((link, index) => (
                <li key={index}>
                  <a 
                    href={link.path}
                    className="flex items-center gap-3 text-sm lg:text-base text-white/80 hover:text-white transition-all duration-300 group py-2"
                  >
                    <span className="text-lg">{link.icon}</span>
                    <span className="group-hover:translate-x-1 transition-transform duration-300">
                      {link.label}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Login Portal */}
          <div className="footer-section">
            <h4 className="text-[#B0BC27] font-bold text-lg lg:text-xl mb-6 flex items-center gap-2">
              <FaUserTie className="w-5 h-5" />
              Client Portal
            </h4>
            
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
              <p className="text-white/70 text-sm mb-4 text-center italic">
                Access your dedicated portal
              </p>

              <div className="space-y-3">
                {/* Employee Login */}
                <button
                  onClick={() => handleLoginClick('employee')}
                  className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold py-3 px-4 rounded-xl text-sm transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
                >
                  <FaUserTie className="w-4 h-4" />
                  Employee Login
                </button>

                {/* Customer Login */}
                <button
                  onClick={() => handleLoginClick('customer')}
                  className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-3 px-4 rounded-xl text-sm transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
                >
                  <FaTruck className="w-4 h-4" />
                  Customer Login
                </button>
              </div>

              <p className="text-xs text-white/50 text-center mt-4">
                Select your account type
              </p>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="my-8 lg:my-12 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

        {/* Bottom Section */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6 lg:gap-8">
          {/* Social Links */}
          <div className="flex flex-col items-center lg:items-start">
            <h5 className="text-[#B0BC27] font-semibold mb-4 text-center lg:text-left">
              Follow Us
            </h5>
            <div className="flex gap-4 lg:gap-6">
              {socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`social-icon bg-white/10 backdrop-blur-sm p-3 rounded-2xl text-white/80 ${social.color} transition-all duration-300 hover:scale-110 hover:bg-white/20 shadow-lg`}
                  aria-label={social.name}
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Copyright */}
          <div className="text-center lg:text-right">
            <p className="text-xs lg:text-sm text-white/60">
              © {new Date().getFullYear()} <span className="text-white font-semibold">Thermo Packers</span>. All rights reserved.
            </p>
            <p className="text-xs text-white/40 mt-2">
              Crafting packaging excellence since 1998
            </p>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Padding */}
      <div className="h-4 lg:h-6"></div>
    </footer>
  );
}