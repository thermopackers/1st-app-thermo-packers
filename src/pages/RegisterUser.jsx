import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Trash2 } from 'lucide-react';
import InternalNavbar from '../components/InternalNavbar';
import axiosInstance from '../axiosInstance';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const RegisterUser = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('sales');
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(null);
  const [users, setUsers] = useState([]);
const [productionSection, setProductionSection] = useState([]);
console.log("userss",users);

  const handleRegister = async (e) => {
    e.preventDefault();
    if (role === 'production' && productionSection.length === 0) {
  toast.error('Please select at least one production section.');
  return;
}
    try {
      const res = await axiosInstance.post('/users/register', { name, email, role, productionSection  });
      setMessage(res.data.message);
      setIsSuccess(true);
      setName('');
      setEmail('');
      setRole('sales');
      toast.success('User registered successfully!');
      fetchUsers();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Something went wrong');
      setIsSuccess(false);
      toast.error('Failed to register user');
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await axiosInstance.get('/users/all');
      setUsers(res.data);
    } catch (err) {
      toast.error('Failed to fetch users');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await axiosInstance.delete(`/users/delete-user/${id}`);
      toast.success('User deleted');
      fetchUsers();
    } catch (err) {
      toast.error('Failed to delete user');
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <>
      <InternalNavbar />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white px-4 py-10">
        <div className="w-full max-w-lg mx-auto bg-white rounded-2xl shadow-lg p-6 sm:p-10 mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-blue-700 mb-6 flex items-center gap-2">
            Register New User
          </h2>

          <form onSubmit={handleRegister} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                required
                placeholder="John Doe"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-400 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                required
                placeholder="example@domain.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-400 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Role</label>
              <select
                value={role}
                onChange={e => setRole(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2 bg-white focus:ring-2 focus:ring-blue-400 outline-none"
              >
                <option value="sales">Sales</option>
                <option value="accounts">Accounts</option>
                <option value="dispatch">Dispatch</option>
                <option value="production">Production</option>
                <option value="packaging">Packaging</option>
              </select>
            </div>
{role === 'production' && (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">Production Sections</label>
    <div className="flex flex-col gap-2">
      {['blockMoulding', 'shapeMoulding', 'cnc'].map((section) => (
        <label key={section} className="inline-flex items-center">
          <input
            type="checkbox"
            value={section}
            checked={productionSection.includes(section)}
            onChange={(e) => {
              if (e.target.checked) {
                setProductionSection([...productionSection, section]);
              } else {
                setProductionSection(productionSection.filter(s => s !== section));
              }
            }}
            className="mr-2"
          />
          {section}
        </label>
      ))}
    </div>
  </div>
)}


            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Register User
            </button>
          </form>

          {message && (
            <div
              className={`mt-6 flex items-center gap-2 px-4 py-2 rounded-md ${
                isSuccess ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}
            >
              {isSuccess ? <CheckCircle size={20} /> : <XCircle size={20} />}
              <span className="text-sm font-medium">{message}</span>
            </div>
          )}
        </div>

        <div className="max-w-5xl mx-auto bg-white shadow-md rounded-xl p-4 sm:p-6 overflow-x-auto">
          <h3 className="text-xl font-bold text-gray-800 mb-4">All Registered Users and Vehicles</h3>
          <table className="w-full text-sm text-left text-gray-600">
            <thead className="bg-gray-100 text-gray-700 uppercase text-xs">
              <tr>
                <th className="px-4 py-2">#</th>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Email</th>
                <th className="px-4 py-2">Role</th>
                <th className="px-4 py-2">Prod. Section</th>
                <th className="px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => (
                <tr key={u._id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-2">{i + 1}</td>
                  <td className="px-4 py-2">{u.name}</td>
                  <td className="px-4 py-2">{u.email}</td>
                  <td className="px-4 py-2 capitalize">{u.role}</td>
<td className="px-4 py-2 capitalize">
  {Array.isArray(u.productionSection) && u.productionSection.length > 0
    ? u.productionSection.join(', ')
    : '-'}
</td>
                  <td className="px-4 py-2">
                    <button
                      onClick={() => handleDelete(u._id)}
                      className="text-red-600 hover:text-red-800 flex items-center gap-1"
                    >
                      <Trash2 size={16} />
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center py-4 text-gray-400">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default RegisterUser;
