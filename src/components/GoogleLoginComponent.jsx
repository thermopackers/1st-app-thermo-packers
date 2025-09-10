import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import axiosInstance from '../axiosInstance';
import { useUserContext } from '../context/UserContext';

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
      console.log("userRes.data",userRes.data);
      
      toast.success('Login successful!');
      
      // Handle redirection based on user type
      if (supplierMode) {
        if (userRes.data.role === 'suppliers' || userRes.data.isAssistant) {
          navigate('/dashboard');
        } else {
          localStorage.removeItem('token');
          toast.error('This portal is for customers only');
        }
      } else {
        // Regular employee handling
        if (userRes.data.role === 'suppliers') {
          localStorage.removeItem('token');
          toast.error('Please use the customer portal');
        } else {
          navigate('/dashboard');
        }
      }

    } catch (err) {
      console.error('Login error:', err);
      localStorage.removeItem('token');
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <GoogleLogin
      onSuccess={onSuccess}
      onError={() => {
        toast.error('Google Sign-In Error');
        setLoading(false);
      }}
      useOneTap={supplierMode} // Optional: Show one-tap for suppliers
      auto_select={supplierMode} // Optional: Auto-select for suppliers
    />
  );
};

export default GoogleLoginComponent;
