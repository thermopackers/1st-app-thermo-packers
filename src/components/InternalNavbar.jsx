import { NavLink, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { gsap } from "gsap";
import { FaBars, FaTimes } from "react-icons/fa";
import toast from "react-hot-toast";
import { useUserContext } from "../context/UserContext";

export default function InternalNavbar() {
  const { user } = useUserContext();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const role = user?.role;

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
    toast.success("logged out");
  };

  useEffect(() => {
    gsap.from(".nav-item", { opacity: 0, y: -20, stagger: 0.1, duration: 0.5 });
  }, []);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const closeMenu = () => {
    setMenuOpen(false);
  };

  return (
    <nav className="bg-blue-600 text-white shadow-md sticky top-0 z-50 w-full">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center relative">
        {/* Logo */}
        <div className="flex items-center space-x-4">
          <img
            className="rounded md:h-10 h-6 md:w-auto object-contain hover:scale-105 transition-transform duration-300"
            src="/images/logo-removebg-preview.jpg"
            alt="Logo"
          />
          <NavLink
            to="/"
            className={({ isActive }) =>
              `nav-item text-base font-semibold ${
                isActive ? "text-yellow-300" : "hover:text-yellow-300"
              }`
            }
          >
            🏠 Home
          </NavLink>
        </div>

        {/* Desktop Menu (only on extra large screens and up) */}
        <div className="hidden xl:flex space-x-8 items-center">
          {role === "accounts" && (
            <>
              <NavLink
                to="/issue-asset"
                className={({ isActive }) =>
                  `nav-item text-base font-semibold ${
                    isActive ? "text-yellow-300" : "hover:text-yellow-300"
                  }`
                }
              >
                📤 Issue Assets
              </NavLink>
              <NavLink
                to="/asset-management"
                className={({ isActive }) =>
                  `nav-item text-base font-semibold ${
                    isActive ? "text-yellow-300" : "hover:text-yellow-300"
                  }`
                }
              >
                💼 Manage Assets
              </NavLink>
            </>
          )}
          {role === "admin" && (
            <NavLink
              to="/inventory"
              className={({ isActive }) =>
                `nav-item text-base font-semibold ${
                  isActive ? "text-yellow-300" : "hover:text-yellow-300"
                }`
              }
            >
              📦 Manage Inventory
            </NavLink>
          )}

          <NavLink
            to="/my-assets"
            className={({ isActive }) =>
              `nav-item text-base font-semibold ${
                isActive ? "text-yellow-300" : "hover:text-yellow-300"
              }`
            }
          >
            🔐 My Assets
          </NavLink>

          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `nav-item text-base font-semibold ${
                isActive ? "text-yellow-300" : "hover:text-yellow-300"
              }`
            }
          >
            🖥️ Manage Orders
          </NavLink>

          <NavLink
            to="/orders"
            className={({ isActive }) =>
              `nav-item text-base font-semibold ${
                isActive ? "text-yellow-300" : "hover:text-yellow-300"
              }`
            }
          >
            📄 Orders
          </NavLink>

          <button
            onClick={handleLogout}
            className="bg-gradient-to-r cursor-pointer from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold px-6 py-3 rounded-full shadow-lg transform hover:scale-105 transition-transform duration-300"
          >
            🚪 Logout
          </button>
        </div>

        {/* Mobile / Tablet / Laptop Hamburger Icon */}
        <div className="xl:hidden flex items-center">
          <button onClick={toggleMenu} className="focus:outline-none">
            {menuOpen ? (
              <FaTimes className="h-6 w-6 text-white" />
            ) : (
              <FaBars className="h-6 w-6 text-white" />
            )}
          </button>
        </div>

        {/* Mobile / Tablet / Laptop Dropdown Menu */}
        {menuOpen && (
          <div className="absolute top-16 right-6 w-56 bg-white rounded-lg shadow-lg py-4 flex flex-col items-start text-gray-800 animate-fade-in z-50">
            {role === "admin" && (
              <NavLink
                to="/inventory"
                className="px-4 py-2 w-full hover:bg-blue-100 font-medium"
                onClick={closeMenu}
              >
                📦 Manage Inventory
              </NavLink>
            )}
            <NavLink
              to="/dashboard"
              onClick={closeMenu}
              className="px-4 py-2 w-full hover:bg-blue-100 font-medium"
            >
              🖥️ Manage Orders
            </NavLink>
            <NavLink
              to="/orders"
              onClick={closeMenu}
              className="px-4 py-2 w-full hover:bg-blue-100 font-medium"
            >
              📄 Orders
            </NavLink>
            {role === "accounts" && (
              <>
                <NavLink
                  to="/issue-asset"
                  onClick={closeMenu}
                  className="px-4 py-2 w-full hover:bg-blue-100 font-medium"
                >
                  📤 Issue Assets
                </NavLink>
                <NavLink
                  to="/asset-management"
                  onClick={closeMenu}
                  className="px-4 py-2 w-full hover:bg-blue-100 font-medium"
                >
                  💼 Manage Assets
                </NavLink>
              </>
            )}
            <NavLink
              to="/my-assets"
              onClick={closeMenu}
              className="px-4 py-2 w-full hover:bg-blue-100 font-medium"
            >
              🔐 My Assets
            </NavLink>
            <button
              onClick={() => {
                closeMenu();
                handleLogout();
              }}
              className="px-4 py-2 w-full text-left hover:bg-red-100 font-medium text-red-600"
            >
              🚪 Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
