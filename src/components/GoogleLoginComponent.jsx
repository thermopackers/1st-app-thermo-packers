import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import axiosInstance from '../axiosInstance';
import { useUserContext } from '../context/UserContext';
import { useState, useEffect } from 'react';

// Helper function to parse roles properly
const parseUserRoles = (user) => {
  if (!user || !user.role) return [];
  let userRoles = [];
  if (Array.isArray(user.role)) {
    if (user.role.length > 0 && typeof user.role[0] === 'string' && user.role[0].startsWith('[')) {
      try {
        userRoles = JSON.parse(user.role[0]);
      } catch (parseError) {
        userRoles = user.role;
      }
    } else {
      userRoles = user.role;
    }
  } else if (typeof user.role === 'string') {
    try {
      userRoles = JSON.parse(user.role);
    } catch (parseError) {
      userRoles = [user.role];
    }
  } else {
    userRoles = [user.role];
  }
  return userRoles;
};

const GoogleLoginComponent = ({ setLoading, supplierMode = false }) => {
  const navigate = useNavigate();
  const { setUser } = useUserContext();
  const [isFullyKiosk, setIsFullyKiosk] = useState(false);

  // Detect if running in Fully Kiosk
  useEffect(() => {
    const userAgent = navigator.userAgent;
    const isFully = userAgent.includes('FullyKiosk') || window.FullyKiosk;
    setIsFullyKiosk(isFully);
    if (isFully) {
      console.log('Running in Fully Kiosk - using fallback login');
    }
  }, []);

  const onSuccess = async (credentialResponse) => {
    setLoading(true);
    try {
      if (!credentialResponse.credential) {
        throw new Error('Missing Google credential token');
      }

      const res = await axiosInstance.post('/users/login/google', {
        token: credentialResponse.credential,
        isSupplierLogin: supplierMode
      });

      const { token } = res.data;
      localStorage.setItem('token', token);
      
      const userRes = await axiosInstance.get('/users/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setUser(userRes.data);
      
      toast.success('Login successful!');
      
      const userRoles = parseUserRoles(userRes.data);
      
      if (supplierMode) {
        if (userRoles.includes('suppliers') || userRes.data.isAssistant) {
          navigate('/dashboard');
        } else {
          localStorage.removeItem('token');
          setUser(null);
          toast.error('This portal is for customers only');
        }
      } else {
        if (userRoles.includes('suppliers')) {
          localStorage.removeItem('token');
          setUser(null);
          toast.error('Please use the customer portal');
        } else {
          navigate('/dashboard');
        }
      }

    } catch (err) {
      console.error('Login error:', err);
      localStorage.removeItem('token');
      setUser(null);
      
      if (err.response?.status === 401) {
        toast.error('Invalid credentials or account not found');
      } else if (err.response?.status === 403) {
        toast.error('Access denied');
      } else {
        toast.error(err.response?.data?.message || 'Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const onError = () => {
    toast.error('Google Sign-In failed. Please try again.');
    setLoading(false);
  };

  // For Fully Kiosk, show instruction message
  if (isFullyKiosk) {
    return (
      <div className="text-center space-y-3">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-3">
          <p className="text-sm text-yellow-800 mb-2">
            📱 For Google login in this app:
          </p>
          <p className="text-xs text-gray-600">
            1. Use the <strong>OTP Login</strong> option below instead<br/>
            2. Or open this page in Chrome browser
          </p>
        </div>
        <button
          onClick={() => {
            toast.error('Please use OTP Login option below for this device');
          }}
          className="w-full py-3 px-4 border border-gray-300 rounded-lg flex items-center justify-center gap-3 bg-gray-50 hover:bg-gray-100 transition"
        >
          <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
          <span className="text-gray-500">Google Login (Not Available)</span>
        </button>
      </div>
    );
  }

  return (
    <GoogleLogin
      onSuccess={onSuccess}
      onError={onError}
      useOneTap={supplierMode}
      auto_select={supplierMode}
      theme={supplierMode ? "filled_blue" : "outline"}
      size="large"
      text={supplierMode ? "continue_with" : "signin_with"}
    />
  );
};

export default GoogleLoginComponent;