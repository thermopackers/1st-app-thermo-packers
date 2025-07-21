import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle, XCircle, Trash2 } from 'lucide-react';
import InternalNavbar from '../components/InternalNavbar';
import axiosInstance from '../axiosInstance';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import FaceRegistrationModal from '../components/FaceRegistrationModal';

const RegisterUser = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isEditing, setIsEditing] = useState(false);
const [editUserId, setEditUserId] = useState(null);
const [allowAttendance, setAllowAttendance] = useState(false);
  const [role, setRole] = useState('sales');
  const [phone, setPhone] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
const [modalVisible, setModalVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(null);
  const [users, setUsers] = useState([]);
const [productionSection, setProductionSection] = useState([]);
 const formRef = useRef(null);
console.log("uusers",users);

const handleSubmit = async (e) => {
  e.preventDefault();
  if (role === 'production' && productionSection.length === 0) {
    toast.error('Please select at least one production section.');
    return;
  }

  try {
const payload = { name, email, phone, role, productionSection, allowAttendance };

    if (isEditing) {
      await axiosInstance.put(`/users/update-user/${editUserId}`, payload);
      toast.success('User updated successfully!');
    } else {
      await axiosInstance.post('/users/register', payload);
      toast.success('User registered successfully!');
    }

    // Reset form
    setName('');
    setEmail('');
    setPhone('');
    setRole('sales');
    setProductionSection([]);
    setIsEditing(false);
    setEditUserId(null);
    fetchUsers();
  } catch (err) {
    toast.error(err.response?.data?.message || 'Operation failed');
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
const handleEdit = (user) => {
  setIsEditing(true);
  setEditUserId(user._id);
  setName(user.name);
  setEmail(user.email);
  setRole(user.role);
  setPhone(user.phone?.replace('+91', '') || '');
  setProductionSection(user.productionSection || []);
  setAllowAttendance(user.allowAttendance || false);
   // Scroll form into view
  setTimeout(() => {
    formRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, 100); // slight delay ensures UI updates first
};
const handleCancelEdit = () => {
  setIsEditing(false);
  setEditUserId(null);
  setName('');
  setEmail('');
  setPhone('');
  setRole('sales');
  setProductionSection([]);
  setAllowAttendance(false);
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

<form ref={formRef} onSubmit={handleSubmit} className="space-y-5">
           {isEditing && (
  <div className="mb-4 text-blue-700 font-semibold text-sm">
    ✏️ Editing user. Make changes and click "Update User" or cancel.
  </div>
)}
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
  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
  <input
    type="tel"
    placeholder="e.g. 9876543210"
    value={phone}
  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))} // Optional: allow only digits
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
                <option value="dispatch">EPS/Thermocol Sheet Cutting, Packaging and Dispatch Section</option>
                <option value="production">Production</option>
                <option value="packaging">EPS/Thermocol Shape Molding, Packaging and Dispatch Section</option>
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
<div className="flex items-center space-x-2">
  <input
    type="checkbox"
    id="attendance"
    checked={allowAttendance}
    onChange={() => setAllowAttendance(!allowAttendance)}
    className="w-4 h-4"
  />
  <label htmlFor="attendance" className="text-sm text-gray-700">
    Allow for Attendance
  </label>
</div>



          <button
  type="submit"
  className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
>
  {isEditing ? 'Update User' : 'Register User'}
</button>
{isEditing && (
  <button
    type="button"
    onClick={handleCancelEdit}
    className="w-full bg-gray-300 text-gray-800 py-2 rounded-lg hover:bg-gray-400 transition"
  >
    Cancel Editing
  </button>
)}


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
                <th className="px-4 py-2">Phone</th>
                <th className="px-4 py-2">Attendance</th>
                <th className="px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => (
                <tr key={u._id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-2">{i + 1}</td>
                  <td className="px-4 py-2">{u.name}</td>
                  <td className="px-4 py-2">{u.email}</td>
<td className="px-4 py-2">
  {{
    sales: 'Sales',
    accounts: 'Accounts',
    dispatch: 'EPS/Thermocol Sheet Cutting, Packaging and Dispatch Section',
    production: 'Production',
    packaging: 'EPS/Thermocol Shape Molding, Packaging and Dispatch Section',
  }[u.role] || u.role}
</td>
<td className="px-4 py-2 capitalize">
  {Array.isArray(u.productionSection) && u.productionSection.length > 0
    ? u.productionSection.join(', ')
    : '-'}
</td>
<td className="px-4 py-2 capitalize">
 {u.phone? u.phone : "-"}
</td>
<td className="px-4 py-2">
  {u.allowAttendance ? 'Yes' : 'No'}
</td>


<td className="px-4 py-2">
  <div className="flex flex-col sm:flex-row flex-wrap gap-2">
    <button
      onClick={() => handleEdit(u)}
      className="text-sm text-white bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded shadow transition"
    >
      ✏️ Edit
    </button>
    <button
      onClick={() => handleDelete(u._id)}
      className="text-sm text-white bg-red-600 hover:bg-red-700 px-3 py-1 rounded shadow transition"
    >
      🗑️ Delete
    </button>
    <button
      onClick={() => {
        setSelectedUser(u);
        setModalVisible(true);
      }}
      className="text-sm text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1 rounded shadow transition"
    >
      👤 Register Face
    </button>
    {u.faceUrl && (
      <button
        onClick={async () => {
          try {
            const confirm = window.confirm("Are you sure you want to delete the registered face?");
            if (!confirm) return;
            await axiosInstance.post("/users/delete-face-url", { userId: u._id });
            toast.success("Face deleted successfully");
            fetchUsers();
          } catch (err) {
            toast.error(err.response?.data?.error || "Failed to delete face");
          }
        }}
        className="text-sm text-white bg-red-500 hover:bg-red-600 px-3 py-1 rounded shadow transition"
      >
        ❌ Delete Face
      </button>
    )}
  </div>

  <div className="mt-2 text-sm text-gray-700">
    {u.faceUrl ? (
      <span className="text-green-600">✅ Face Registered</span>
    ) : (
      <span className="text-red-600">❌ Face Not Registered</span>
    )}
  </div>
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
      <FaceRegistrationModal
  visible={modalVisible}
  onClose={() => setModalVisible(false)}
  user={selectedUser}
/>

    </>
  );
};

export default RegisterUser;
