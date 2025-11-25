import { useState, useEffect } from "react";
import axiosInstance from "../axiosInstance";
import toast from "react-hot-toast";
import { jwtDecode } from "jwt-decode";
import { useUserContext } from "../context/UserContext";
import { useNavigate } from "react-router-dom";

export default function OTPLogin({ setLoading, supplierMode = false }) {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState(1);
  const [suggestedEmails, setSuggestedEmails] = useState([]);
  const { setUser } = useUserContext();
  const navigate = useNavigate();

  useEffect(() => {
    const savedEmails = JSON.parse(localStorage.getItem("recentEmails")) || [];
    setSuggestedEmails(savedEmails);
  }, []);

  const saveEmail = (email) => {
    let saved = JSON.parse(localStorage.getItem("recentEmails")) || [];
    if (!saved.includes(email)) {
      saved.unshift(email);
      if (saved.length > 5) saved = saved.slice(0, 5);
      localStorage.setItem("recentEmails", JSON.stringify(saved));
    }
  };

  const requestOTP = async () => {
    setLoading(true);
    try {
      await axiosInstance.post("/login/request-otp", { 
        email,
        isSupplierLogin: supplierMode 
      });
      toast.success("OTP sent to your email");
      saveEmail(email);
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

const verifyOTP = async () => {
  setLoading(true);
  try {
    const res = await axiosInstance.post("/login/verify-otp", { 
      email, 
      otp,
      isSupplierLogin: supplierMode 
    });
    const { token } = res.data;
    localStorage.setItem("token", token);
    const decoded = jwtDecode(token);

    // ✅ FIX: Handle role array properly
    const userRoles = Array.isArray(decoded.role) ? decoded.role : [decoded.role];

    // Strict role validation based on login mode
    if (supplierMode) {
      if (!userRoles.includes('suppliers')) {
        localStorage.removeItem('token');
        throw new Error("supplier_only");
      }
      navigate("/dashboard");
    } else {
      const validRoles = ['admin', 'sales', 'accounts', 'production', 'dispatch', 'packaging', 'driver'];
      const hasValidRole = userRoles.some(role => validRoles.includes(role));
      
      if (!hasValidRole) {
        localStorage.removeItem('token');
        throw new Error("unauthorized_role");
      }
      navigate("/dashboard");
    }

    const userRes = await axiosInstance.get("/users/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    setUser(userRes.data);
    toast.success("Login successful!");
    
  } catch (err) {
    const errorMessage = 
      err.message === 'supplier_only' ? 'This portal is for suppliers only' :
      err.message === 'unauthorized_role' ? 'You are not authorized for this portal' :
      err.response?.data?.message || "Invalid OTP";
    
    toast.error(errorMessage);
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="space-y-4">
      {step === 1 && (
        <>
          <input
            type="email"
            placeholder={supplierMode ? "Enter customer email" : "Enter employee email"}
            className="w-full border p-2 rounded"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          {/* Suggestion List */}
          {suggestedEmails.length > 0 && (
            <div className="space-y-1 text-sm text-gray-600">
              <p className="font-semibold">Recently used:</p>
              {suggestedEmails.map((e, idx) => (
                <div
                  key={idx}
                  className="cursor-pointer bg-gray-100 hover:bg-blue-200 px-3 py-2 rounded shadow-sm"
                  onClick={() => setEmail(e)}
                >
                  {e}
                </div>
              ))}
            </div>
          )}

          {email.trim() && (
            <button
              onClick={requestOTP}
              className={`w-full py-2 rounded text-white ${
                supplierMode ? "bg-green-600 hover:bg-green-700" : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              Send OTP
            </button>
          )}
        </>
      )}

      {step === 2 && (
        <>
          <input
            type="text"
            placeholder="Enter OTP"
            className="w-full border p-2 rounded"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
          />
          <button
            onClick={verifyOTP}
            className={`w-full py-2 rounded text-white ${
              supplierMode ? "bg-green-600 hover:bg-green-700" : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            Verify & Login
          </button>
        </>
      )}
    </div>
  );
}