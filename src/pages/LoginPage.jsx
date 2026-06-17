import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { gsap } from "gsap";
import GoogleLoginComponent from "../components/GoogleLoginComponent";
import OTPLogin from "../components/OTPLogin";
import AssistantLoginForm from "../components/AssistantLoginForm";
import GuardLoginForm from "../components/GuardLoginForm";
import { FiUser, FiTruck, FiAlertTriangle } from "react-icons/fi";
import toast from "react-hot-toast";
import axiosInstance from "../axiosInstance";

export default function LoginPage() {
  const navigate = useNavigate();
  const formRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [isSupplierLogin, setIsSupplierLogin] = useState(
    new URLSearchParams(window.location.search).get('mode') === 'customer'
  );
  const [isChecking, setIsChecking] = useState(true); // ✅ ADD THIS

  // Check for existing token - FIXED with cleanup
  useEffect(() => {
    let isMounted = true;
    const token = localStorage.getItem("token");
    
    if (token) {
      axiosInstance.get('/users/me')
        .then(() => {
          if (isMounted) {
            navigate("/dashboard");
          }
        })
        .catch(() => {
          if (isMounted) {
            localStorage.removeItem("token");
            setIsChecking(false);
          }
        });
    } else {
      if (isMounted) {
        setIsChecking(false);
      }
    }

    return () => {
      isMounted = false;
    };
  }, [navigate]); // ✅ Only depends on navigate

  // Animation on mount
  useEffect(() => {
    gsap.from(formRef.current, {
      y: 50,
      opacity: 0,
      duration: 1,
      ease: "power3.out",
    });
  }, []);

  const handleModeChange = (supplierMode) => {
    setIsSupplierLogin(supplierMode);
    toast.dismiss();
  };

  // ✅ Show loading while checking token
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100">
        <div className="flex flex-col items-center space-y-2">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <span className="text-gray-600 font-semibold">Checking authentication...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 px-4">
      {/* Login Form Container */}
      <div
        ref={formRef}
        className="bg-white/80 backdrop-blur-md p-8 rounded-3xl shadow-lg w-full max-w-md transition-all"
      >
        <h2 className="text-3xl font-extrabold text-center mb-6 text-gray-800">
          {isSupplierLogin ? "Customer Portal" : "Employee Portal"}
        </h2>

        <div className="space-y-4">
          {/* Portal Selection Toggle */}
          <div className="flex justify-center gap-4 mb-6">
            <button
              onClick={() => handleModeChange(false)}
              className={`px-6 py-3 rounded-xl font-semibold text-sm transition-all ${
                !isSupplierLogin
                  ? "bg-blue-600 text-white shadow-lg"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <div className="flex items-center gap-2">
                <FiUser className="text-lg" />
                Employee Login
              </div>
            </button>
            <button
              onClick={() => handleModeChange(true)}
              className={`px-6 py-3 rounded-xl font-semibold text-sm transition-all ${
                isSupplierLogin
                  ? "bg-green-600 text-white shadow-lg"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <div className="flex items-center gap-2">
                <FiTruck className="text-lg" />
                Customer Login
              </div>
            </button>
          </div>

          {/* Customer Portal Notice */}
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

          {/* Login Options */}
          {isSupplierLogin ? (
            <>
              <GoogleLoginComponent 
                setLoading={setLoading} 
                supplierMode={true} 
                key="supplier-google"
              />
              <div className="text-center text-gray-500 text-sm">
                OR LOGIN WITH
              </div>
              <div className="flex flex-col gap-4">
                <OTPLogin setLoading={setLoading} supplierMode={true} />
                <AssistantLoginForm setLoading={setLoading} />
              </div>
            </>
          ) : (
            <>
              <GoogleLoginComponent 
                setLoading={setLoading}
                key="employee-google" 
              />
              <div className="text-center text-gray-500 text-sm">
                OR LOGIN WITH OTP
              </div>
              <OTPLogin setLoading={setLoading} />
              
              {/* Guard Login Section */}
              <div className="relative my-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white/80 text-gray-500">Guard Login</span>
                </div>
              </div>
              <GuardLoginForm setLoading={setLoading} />
            </>
          )}

          <button
            onClick={() => navigate("/")}
            className="w-full mt-4 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold py-3 rounded-lg transition-all duration-300 shadow-md hover:shadow-xl"
          >
            Return to Homepage
          </button>
        </div>
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="flex flex-col items-center space-y-2">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
            <span className="text-white font-semibold text-lg">
              Authenticating...
            </span>
          </div>
        </div>
      )}
    </div>
  );
}