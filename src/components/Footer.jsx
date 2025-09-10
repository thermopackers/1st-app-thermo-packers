import React, { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
gsap.registerPlugin(ScrollTrigger);
import {
  FaFacebookF,
  FaTwitter,
  FaInstagram,
  FaLinkedinIn,
  FaYoutube,
} from "react-icons/fa";

gsap.registerPlugin(ScrollTrigger);

export default function Footer() {
  const footerRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  
  useEffect(() => {
    // Initial animation to make sure it's visible on first load
    gsap.fromTo(
      footerRef.current,
      { y: 100, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 1.2,
        ease: "power3.out",
      }
    );
    
    const animation = gsap.fromTo(
      footerRef.current,
      { y: 100, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 1.2,
        ease: "power3.out",
        scrollTrigger: {
          trigger: footerRef.current,
          start: "top bottom",
          toggleActions: "restart none none none",
        },
      }
    );

    return () => {
      // Kill the ScrollTrigger on unmount or route change
      if (animation.scrollTrigger) {
        animation.scrollTrigger.kill();
      }
      animation.kill();
    };
  }, [location.pathname]); // Run on route change

  const handleLoginClick = () => {
    navigate('/login');
  };

  return (
    <footer
      ref={footerRef}
      className="footer relative bg-[#121212]/70 backdrop-blur-xl border-t border-white/10 shadow-[0_8px_32px_0_rgba(31,38,135,0.4)] rounded-t-3xl text-white px-6 py-16 md:px-20 overflow-hidden"
    >
      {/* Background Glass Layer */}
      <div className="absolute inset-0 z-0 rounded-t-3xl bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-[10px]" />

      <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-12">
        <div>
          <img src="/images/logo.png" alt="Thermo Packers" className="h-14 mb-4" />
          <p className="text-sm text-white/80 max-w-xs leading-relaxed">
            Delivering cutting-edge thermocol packaging & insulation solutions across industries.
          </p>
        </div>

        <div>
          <h4 className="text-lime-300 font-semibold text-lg mb-4">Contact Info</h4>
          <ul className="space-y-2 text-sm text-white/80">
            <li><strong>Phone:</strong> +91-9878165432, 9216562160, 9216660160</li>
            <li><strong>Email:</strong> <a href="mailto:thermopackers@gmail.com" className="hover:text-white">thermopackers@gmail.com</a></li>
            <li><strong>Address:</strong> Kapurthala Road, Jalandhar, Punjab</li>
            <li><strong>Hours:</strong> Mon - Sat / 9:00 AM - 6:00 PM</li>
          </ul>
        </div>

        <div>
          <h4 className="text-lime-300 font-semibold text-lg mb-4">Quick Links</h4>
          <ul className="space-y-2 text-sm text-white/80">
            <li><a href="/" className="hover:text-white">🏠 Home</a></li>
            <li><a href="/products" className="hover:text-white">📦 Products</a></li>
            <li><a href="/about" className="hover:text-white">📘 About Us</a></li>
            <li><a href="/contact" className="hover:text-white">☎️ Contact</a></li>
          </ul>
        </div>
      </div>

      <div className="my-10 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

      <div className="relative z-10 text-center">
        <h4 className="text-lime-300 font-semibold mb-4 text-lg">Follow Us</h4>
        <div className="flex justify-center gap-6 text-white text-xl mb-6">
          <a href="https://www.facebook.com/share/1HDPuxzLq2/?mibextid=wwXIfr" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition"><FaFacebookF /></a>
          {/* <a href="#" className="hover:text-sky-400 transition"><FaTwitter /></a> */}
          <a href="https://www.instagram.com/thermopackers/profilecard/?igsh=MTlwZnV2NTEybXh3ag==" target="_blank" rel="noopener noreferrer" className="hover:text-pink-500 transition"><FaInstagram /></a>
          <a href="https://www.linkedin.com/company/thermo-packers/" target="_blank" rel="noopener noreferrer" className="hover:text-blue-300 transition"><FaLinkedinIn /></a>
          <a href="https://youtube.com/@thermopackers?si=d1HWJiTXt2wzLvQp" target="_blank" rel="noopener noreferrer" className="hover:text-red-500 transition"><FaYoutube /></a>
        </div>

        <p className="text-xs text-white/60">
          © {new Date().getFullYear()} <span className="text-white font-medium">Thermo Packers</span>. All rights reserved.
        </p>

       {/* Login Section */}
<div className="mt-6 text-center">
  <p className="text-sm text-gray-400 mb-4 italic tracking-wide">
    Access your dedicated portal
  </p>

  <div className="flex flex-col sm:flex-row justify-center gap-4">
    {/* Employee Login Button */}
    <button
      onClick={() => navigate('/login')}
      className="relative cursor-pointer inline-flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold py-2 px-6 rounded-full text-sm sm:text-base transition-all duration-300 shadow-md hover:shadow-lg"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
      Employee Login
    </button>

    {/* Supplier Login Button */}
    <button
      onClick={() => navigate('/login?mode=customer')}
      className="relative cursor-pointer inline-flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-2 px-6 rounded-full text-sm sm:text-base transition-all duration-300 shadow-md hover:shadow-lg"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0zM12 16v3m0 0l-3-3m3 3l3-3m-5-4h6a2 2 0 012 2v3m0 0a2 2 0 01-2 2H7a2 2 0 01-2-2v-3a2 2 0 012-2z" />
      </svg>
      Customer Login
    </button>
  </div>

  <p className="text-xs text-gray-500 mt-4">
    Please select the appropriate login for your account type
  </p>
</div>

      </div>
    </footer>
  );
}
