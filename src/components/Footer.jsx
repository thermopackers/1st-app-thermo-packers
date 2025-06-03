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

        {/* Login Button */}
        <div className="mt-6 text-center">
  <p className="text-sm text-gray-400 mt-2 italic tracking-wide">
    For Employees Only
  </p>

  <button
    onClick={handleLoginClick}
    className="relative cursor-pointer inline-flex items-center justify-center gap-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold py-3 px-8 rounded-full text-lg transition-all duration-300 group shadow-lg hover:shadow-xl"
  >
    Login
    
  </button>
</div>

      </div>
    </footer>
  );
}
