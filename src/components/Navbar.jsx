import React, { useState, useEffect, useRef } from "react";
import { NavLink, Link } from "react-router-dom";
import { FiMenu, FiX } from "react-icons/fi";
import { useAppContext } from "../context/AppContext";

export default function Navbar() {
  const { menuOpen, setMenuOpen } = useAppContext();
  const menuRef = useRef(null);
  const iconRef = useRef(null);
  const [scrolled, setScrolled] = useState(false);

  const navLinkClass = ({ isActive }) =>
    `relative drop-shadow-md block px-4 py-2 text-sm md:text-base font-semibold transition-colors duration-300
    after:content-[''] after:absolute after:left-1/4 after:-bottom-1 after:h-[2px] after:bg-[#B0BC27]
    after:transition-all after:duration-500
    ${isActive ? "text-[#B0BC27] after:w-1/2" : "text-gray-700 hover:text-[#B0BC27] after:w-0 hover:after:w-1/2"}`;

  // Handle close on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        menuOpen &&
        menuRef.current &&
        !menuRef.current.contains(event.target) &&
        iconRef.current &&
        !iconRef.current.contains(event.target)
      ) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  // Handle scroll change effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-6 md:py-4 py-2 flex justify-between items-center
        ${scrolled || menuOpen ? "bg-white/80 backdrop-blur-md shadow-md" : "bg-transparent"}
      `}
    >
      <Link to="/">
        <img
          className="h-12 w-auto object-contain hover:scale-105 transition-transform duration-300"
          src="/images/logo.png"
          alt="Logo"
        />
      </Link>

      {/* Desktop Nav */}
      <div className="hidden md:flex items-center justify-center w-full">
        <div className="space-x-6 flex items-center text-sm md:text-base relative">
          <NavLink to="/" end className={navLinkClass}>
            Home
          </NavLink>
          <NavLink to="/products" className={navLinkClass}>
            Products
          </NavLink>
          <NavLink to="/about" className={navLinkClass}>
            About
          </NavLink>
          <NavLink to="/contact" className={navLinkClass}>
            Contact Us
          </NavLink>
        </div>
      </div>

      {/* Mobile Menu Icon */}
      <div className="md:hidden z-50" ref={iconRef}>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <FiX size={26} /> : <FiMenu size={26} />}
        </button>
      </div>

      {/* Mobile Dropdown Menu */}
      <div
        ref={menuRef}
        className={`absolute top-full left-0 w-full bg-white/90 backdrop-blur-md shadow-lg z-40 overflow-hidden transition-all duration-500 ease-in-out md:hidden ${
          menuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="flex flex-col items-center text-center space-y-4 p-4">
          <NavLink to="/" end className={navLinkClass} onClick={() => setMenuOpen(false)}>
            Home
          </NavLink>
          <NavLink to="/products" className={navLinkClass} onClick={() => setMenuOpen(false)}>
            Products
          </NavLink>
          <NavLink to="/about" className={navLinkClass} onClick={() => setMenuOpen(false)}>
            About
          </NavLink>
          <NavLink to="/contact" className={navLinkClass} onClick={() => setMenuOpen(false)}>
            Contact Us
          </NavLink>
        </div>
      </div>
    </nav>
  );
}
