import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { gsap } from "gsap";
import GoogleLoginComponent from "../components/GoogleLoginComponent";
import OTPLogin from "../components/OTPLogin";
import { FiUser, FiTruck, FiAlertTriangle } from "react-icons/fi"; // Added missing imports

export default function LoginPage() {
  const navigate = useNavigate();
  const formRef = useRef(null);
  const [loading, setLoading] = useState(false);
const [isSupplierLogin, setIsSupplierLogin] = useState(
  new URLSearchParams(window.location.search).get('mode') === 'customer'
);
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      navigate("/dashboard");
    }
  }, [navigate]);

  useEffect(() => {
    gsap.from(formRef.current, {
      y: 50,
      opacity: 0,
      duration: 1,
      ease: "power3.out",
    });
  }, []);

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 px-4">
      {/* LOGIN FORM */}
      <div
        ref={formRef}
        className="bg-white/80 backdrop-blur-md p-8 rounded-3xl shadow-lg w-full max-w-md transition-all"
      >
        <h2 className="text-3xl font-extrabold text-center mb-6 text-gray-800">
          {isSupplierLogin ? "Customer Login" : "Employee Login"}
        </h2>

        <div className="space-y-4">
          {/* Mode selector with clear labels */}
          <div className="flex justify-center gap-4 mb-6">
            <button
              onClick={() => setIsSupplierLogin(false)}
              className={`px-6 py-3 rounded-xl font-semibold text-sm transition-all ${
                !isSupplierLogin
                  ? "bg-blue-600 text-white shadow-lg"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <div className="flex items-center gap-2">
                <FiUser className="text-lg" />
                Employee Portal
              </div>
            </button>
            <button
              onClick={() => setIsSupplierLogin(true)}
              className={`px-6 py-3 rounded-xl font-semibold text-sm transition-all ${
                isSupplierLogin
                  ? "bg-green-600 text-white shadow-lg"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <div className="flex items-center gap-2">
                <FiTruck className="text-lg" />
                Customer Portal
              </div>
            </button>
          </div>

          {/* Warning message for suppliers */}
          {isSupplierLogin && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <FiAlertTriangle className="h-5 w-5 text-yellow-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    This portal is exclusively for authorized customers only.
                  </p>
                </div>
              </div>
            </div>
          )}

          {isSupplierLogin ? (
            // Supplier-specific login components
            <>
              <GoogleLoginComponent 
                setLoading={setLoading} 
                supplierMode={true} 
              />
              <div className="text-center text-gray-500 text-sm">
                OR LOGIN WITH OTP
              </div>
              <OTPLogin setLoading={setLoading} supplierMode={true} />
            </>
          ) : (
            // Regular employee login components
            <>
              <GoogleLoginComponent setLoading={setLoading} />
              <div className="text-center text-gray-500 text-sm">
                OR LOGIN WITH OTP
              </div>
              <OTPLogin setLoading={setLoading} />
            </>
          )}

          <button
            onClick={() => navigate("/")}
            className="w-full cursor-pointer bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold py-3 rounded-lg transition-all duration-300 shadow-md hover:shadow-xl"
          >
            Home
          </button>
        </div>
      </div>

      {/* Loading overlay remains the same */}
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#00000094] bg-opacity-40 backdrop-blur-sm">
          <div className="flex flex-col items-center space-y-2">
            <svg className="animate-spin h-8 w-8 text-white" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            <span className="text-white font-semibold text-lg">
              Logging in...
            </span>
          </div>
        </div>
      )}
    </div>
  );
}