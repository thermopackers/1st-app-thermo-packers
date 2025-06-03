import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import toast from 'react-hot-toast';
import axiosInstance from '../axiosInstance';
import { useUserContext } from '../context/UserContext';

const GoogleLoginComponent = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { setUser } = useUserContext();

  const redirectToDashboard = (role) => {
    switch (role) {
      case 'admin':
        navigate('/admin-dashboard');
        break;
      case 'sales':
      case 'accounts':
      case 'dispatch':
      case 'packaging':
        navigate('/dashboard');
        break;
      case 'production':
        navigate('/production-dashboard');
        break;
      default:
        toast.error('You do not have permission to access this application.');
        break;
    }
  };

  return (
    <GoogleLogin
      onSuccess={async (credentialResponse) => {
        setLoading(true);
        try {
          if (!credentialResponse.credential) {
            throw new Error('Missing credential token from Google');
          }

          // Send Google token to backend for JWT
          const res = await axiosInstance.post('/users/login/google', {
            token: credentialResponse.credential,
          });

          const { token } = res.data;
          localStorage.setItem('token', token);

          // Decode token for role check (optional, but useful for safety)
          const decoded = jwtDecode(token);
          const validRoles = ['admin', 'sales', 'accounts', 'production', 'dispatch', 'packaging'];
          if (!validRoles.includes(decoded.role)) {
            throw new Error('Unauthorized user role');
          }

          // ✅ Immediately fetch user from backend and set context
          const userRes = await axiosInstance.get('/users/me', {
            headers: { Authorization: `Bearer ${token}` },
          });
          setUser(userRes.data); // update context with fetched user

          toast.success('Google Login Success!');
          redirectToDashboard(userRes.data.role);
        } catch (err) {
          console.error('Login error:', err);
          toast.error(
            err.response?.data?.message || err.message || 'Google login failed or unauthorized access'
          );
        } finally {
          setLoading(false);
        }
      }}
      onError={() => {
        toast.error('Google Sign-In Error');
        setLoading(false);
      }}
    />
  );
};

export default GoogleLoginComponent;
