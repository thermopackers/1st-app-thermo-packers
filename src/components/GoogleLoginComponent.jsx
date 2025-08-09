import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import axiosInstance from '../axiosInstance';
import { useUserContext } from '../context/UserContext';

const GoogleLoginComponent = ({ setLoading, supplierMode = false }) => {
  const navigate = useNavigate();
  const { setUser } = useUserContext();

  const redirectToDashboard = (role) => {
    if (supplierMode) {
      // STRICT supplier validation
      if (role === 'suppliers') {
        navigate('/dashboard');
      } else {
        // Immediately log out non-suppliers
        localStorage.removeItem('token');
        toast.error('This portal is for customers only. Please use the employee login.');
        return;
      }
    } else {
      // Regular employee handling (existing logic)
      switch (role) {
        case 'admin':
          navigate('/admin-dashboard');
          break;
        case 'sales':
        case 'accounts':
        case 'dispatch':
        case 'packaging':
        case 'production':
        case 'driver':
          navigate('/dashboard');
          break;
        default:
          localStorage.removeItem('token');
          toast.error('You do not have permission to access this application.');
          break;
      }
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

          const res = await axiosInstance.post('/users/login/google', {
            token: credentialResponse.credential,
            isSupplierLogin: supplierMode // Send mode to backend
          });

          const { token } = res.data;
          localStorage.setItem('token', token);
          const decoded = jwtDecode(token);

          // STRICT frontend validation
          if (supplierMode && decoded.role !== 'suppliers') {
            localStorage.removeItem('token');
            throw new Error('customers_only');
          }

          if (!supplierMode && decoded.role === 'suppliers') {
            localStorage.removeItem('token');
            throw new Error('employee_portal_only');
          }

          const userRes = await axiosInstance.get('/users/me', {
            headers: { Authorization: `Bearer ${token}` },
          });
          
          setUser(userRes.data);
          toast.success('Login successful!');
          redirectToDashboard(userRes.data.role);
          
        } catch (err) {
          console.error('Login error:', err);
          const errorMessage = 
            err.message === 'customers_only' ? 'This portal is for customers only' :
            err.message === 'employee_portal_only' ? 'Customers must use the customers portal' :
            err.response?.data?.message || 'Login failed';
            
          toast.error(errorMessage);
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
