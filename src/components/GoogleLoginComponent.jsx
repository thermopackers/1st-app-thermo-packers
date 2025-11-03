// import { GoogleLogin } from '@react-oauth/google';
// import { jwtDecode } from 'jwt-decode';
// import { useNavigate } from 'react-router-dom';
// import toast from 'react-hot-toast';
// import axiosInstance from '../axiosInstance';
// import { useUserContext } from '../context/UserContext';

// const GoogleLoginComponent = ({ setLoading, supplierMode = false }) => {
//   const navigate = useNavigate();
//   const { setUser } = useUserContext();

//   const onSuccess = async (credentialResponse) => {
//     setLoading(true);
//     try {
//       if (!credentialResponse.credential) {
//         throw new Error('Missing Google credential token');
//       }

//       const res = await axiosInstance.post('/users/login/google', {
//         token: credentialResponse.credential,
//         isSupplierLogin: supplierMode
//       });

//       const { token } = res.data;
//       localStorage.setItem('token', token);
      
//       // Get user data with the new token
//       const userRes = await axiosInstance.get('/users/me', {
//         headers: { Authorization: `Bearer ${token}` }
//       });
      
//       setUser(userRes.data);
//       console.log("userRes.data",userRes.data);
      
//       toast.success('Login successful!');
      
//       // Handle redirection based on user type
//       if (supplierMode) {
//         if (userRes.data.role === 'suppliers' || userRes.data.isAssistant) {
//           navigate('/dashboard');
//         } else {
//           localStorage.removeItem('token');
//           toast.error('This portal is for customers only');
//         }
//       } else {
//         // Regular employee handling
//         if (userRes.data.role === 'suppliers') {
//           localStorage.removeItem('token');
//           toast.error('Please use the customer portal');
//         } else {
//           navigate('/dashboard');
//         }
//       }

//     } catch (err) {
//       console.error('Login error:', err);
//       localStorage.removeItem('token');
//       toast.error(err.response?.data?.message || 'Login failed');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <GoogleLogin
//       onSuccess={onSuccess}
//       onError={() => {
//         toast.error('Google Sign-In Error');
//         setLoading(false);
//       }}
//       useOneTap={supplierMode} // Optional: Show one-tap for suppliers
//       auto_select={supplierMode} // Optional: Auto-select for suppliers
//     />
//   );
// };

// export default GoogleLoginComponent;

import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import axiosInstance from '../axiosInstance';
import { useUserContext } from '../context/UserContext';

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
      
      // Get user data with the new token
      const userRes = await axiosInstance.get('/users/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setUser(userRes.data);
      console.log("User data after login:", userRes.data);
      
      toast.success('Login successful!');
      
      // ✅ FIX: Handle redirection with proper role parsing
      const userRoles = parseUserRoles(userRes.data);
      
      if (supplierMode) {
        // Supplier portal - only allow suppliers and their assistants
        if (userRoles.includes('suppliers') || userRes.data.isAssistant) {
          navigate('/dashboard');
        } else {
          localStorage.removeItem('token');
          setUser(null);
          toast.error('This portal is for customers only');
        }
      } else {
        // Regular employee portal - don't allow suppliers
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