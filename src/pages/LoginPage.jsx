import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { gsap } from "gsap";
import GoogleLoginComponent from "../components/GoogleLoginComponent";

export default function LoginPage() {
  const navigate = useNavigate();
  const formRef = useRef(null);
  const [loading, setLoading] = useState(false); // controls overlay

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
          Login
        </h2>

        <div className="space-y-4">
          <GoogleLoginComponent setLoading={setLoading} />

          <button
            onClick={() => navigate("/")}
            className="w-full cursor-pointer bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold py-3 rounded-lg transition-all duration-300 shadow-md hover:shadow-xl"
          >
            Home
          </button>
        </div>
      </div>

      {/* FULLSCREEN LOADING OVERLAY */}
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
