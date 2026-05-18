import { useState, useEffect } from "react";
import axiosInstance from "../axiosInstance";
import toast from "react-hot-toast";
import { jwtDecode } from "jwt-decode";
import { useUserContext } from "../context/UserContext";
import { useNavigate } from "react-router-dom";

export default function OTPLogin({ setLoading, supplierMode = false }) {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState(1);
  const [suggestedEmails, setSuggestedEmails] = useState([]);
  const [otpMethod, setOtpMethod] = useState('email'); // 'email' or 'whatsapp'
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
    if (!email && !phone) {
      toast.error("Please enter email or phone number");
      return;
    }

    setLoading(true);
    try {
      const payload = { 
        isSupplierLogin: supplierMode 
      };
      
      if (email) {
        payload.email = email;
        setOtpMethod('email');
      } else if (phone) {
        payload.phone = phone;
        setOtpMethod('whatsapp');
      }

      const response = await axiosInstance.post("/login/request-otp", payload);
      
      if (email) {
        saveEmail(email);
      }
      
      toast.success(`OTP sent to your ${otpMethod === 'email' ? 'email' : 'WhatsApp'}`);
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
      const payload = { 
        otp,
        isSupplierLogin: supplierMode 
      };
      
      if (email) {
        payload.email = email;
      } else if (phone) {
        payload.phone = phone;
      }

      const res = await axiosInstance.post("/login/verify-otp", payload);
      const { token } = res.data;
      localStorage.setItem("token", token);
      const decoded = jwtDecode(token);

      // Handle role array properly
      const userRoles = Array.isArray(decoded.role) ? decoded.role : [decoded.role];

      // Strict role validation based on login mode
      if (supplierMode) {
        if (!userRoles.includes('suppliers')) {
          localStorage.removeItem('token');
          throw new Error("supplier_only");
        }
        navigate("/dashboard");
      } else {
        const validRoles = ['admin', 'sales', 'accounts', 'production', 'dispatch', 'packaging', 'driver', 'guard'];
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

  const clearInputs = () => {
    if (email) setPhone("");
    if (phone) setEmail("");
  };

  return (
    <div className="space-y-4">
      {step === 1 && (
        <>
          <div className="space-y-3">
            {/* Email Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                placeholder={supplierMode ? "Enter customer email" : "Enter employee email"}
                className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (e.target.value) setPhone("");
                }}
              />
            </div>

            {/* Divider */}
            <div className="flex items-center">
              <div className="flex-1 border-t border-gray-300"></div>
              <div className="px-3 text-sm text-gray-500">OR</div>
              <div className="flex-1 border-t border-gray-300"></div>
            </div>

            {/* Phone Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number (WhatsApp)
              </label>
              <input
                type="tel"
                placeholder="+91XXXXXXXXXX"
                className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  if (e.target.value) setEmail("");
                }}
              />
              <p className="text-xs text-gray-500 mt-1">
                OTP will be sent via WhatsApp
              </p>
            </div>
          </div>

          {/* Suggestion List (only show for email) */}
          {suggestedEmails.length > 0 && email === "" && phone === "" && (
            <div className="space-y-2 text-sm text-gray-600">
              <p className="font-semibold">Recently used emails:</p>
              {suggestedEmails.map((e, idx) => (
                <div
                  key={idx}
                  className="cursor-pointer bg-gray-100 hover:bg-blue-100 px-3 py-2 rounded-lg border border-gray-200 transition-colors"
                  onClick={() => setEmail(e)}
                >
                  {e}
                </div>
              ))}
            </div>
          )}

          {/* Send OTP Button */}
          {(email.trim() || phone.trim()) && (
            <button
              onClick={requestOTP}
              className={`w-full py-3 rounded-lg text-white font-semibold transition-colors ${
                supplierMode 
                  ? "bg-green-600 hover:bg-green-700" 
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              Send OTP via {email ? 'Email' : 'WhatsApp'}
            </button>
          )}
        </>
      )}

      {step === 2 && (
        <>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-blue-800 text-sm">
              OTP sent to your <strong>{otpMethod === 'email' ? 'email' : 'WhatsApp'}</strong>
              {email && <span>: {email}</span>}
              {phone && <span>: {phone}</span>}
            </p>
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Enter OTP
            </label>
            <input
              type="text"
              placeholder="Enter 6-digit OTP"
              className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center text-lg font-mono"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              maxLength={6}
            />
            
            <div className="flex gap-2">
              <button
                onClick={() => setStep(1)}
                className="flex-1 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
              <button
                onClick={verifyOTP}
                disabled={otp.length !== 6}
                className={`flex-1 py-2 rounded-lg text-white font-semibold transition-colors ${
                  supplierMode 
                    ? "bg-green-600 hover:bg-green-700 disabled:bg-green-400" 
                    : "bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400"
                }`}
              >
                Verify & Login
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}