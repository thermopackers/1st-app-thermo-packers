// src/components/GuardLoginForm.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiShield, FiMail, FiLock } from 'react-icons/fi';
import toast from 'react-hot-toast';
import axiosInstance from '../axiosInstance';

export default function GuardLoginForm({ setLoading }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const response = await axiosInstance.post('/login/login-guard', {
        email,
        password
      });

      const { token, user } = response.data;
      
      // Store token
      localStorage.setItem('token', token);
      
      // Navigate to dashboard
      navigate('/dashboard');
      
      toast.success(`Welcome back, ${user.name}!`);
      
    } catch (error) {
      console.error('Guard login error:', error);
      const message = error.response?.data?.message || 'Login failed. Please try again.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-blue-50 border-l-4 border-blue-500 p-3 mb-2">
        <div className="flex items-center gap-2">
          <FiShield className="text-blue-500 text-lg" />
          <p className="text-sm text-blue-700 font-medium">
            Guard Login
          </p>
        </div>
        <p className="text-xs text-blue-600 mt-1">
          Use your assigned email and password
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Email
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiMail className="text-gray-400" />
          </div>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter your email"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Password
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiLock className="text-gray-400" />
          </div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter your password"
            required
          />
        </div>
      </div>

      <button
        type="submit"
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition-colors duration-200"
      >
        Login with Password
      </button>
    </form>
  );
}