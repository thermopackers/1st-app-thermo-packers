import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../axiosInstance';
import toast from 'react-hot-toast';

const AssistantLoginForm = ({ onSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
   try {
  const res = await axiosInstance.post('/login/go-login/assistant', {
    email,
    password
  });
  
  localStorage.setItem('token', res.data.token);
  toast.success('Login successful!');

  if (res.data.user.isAssistant) {
    navigate('/dashboard'); // ✅ Go to assistant dashboard
  } else {
    navigate('/dashboard'); // In case somehow a main supplier logs in here
  }
} catch (err) {
  toast.error(err.response?.data?.message || 'Login failed');
}
 finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">Assistant Login</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
        
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-blue-400"
        >
          {isLoading ? 'Logging in...' : 'Login as Assistant'}
        </button>
      </form>
    </div>
  );
};

export default AssistantLoginForm;