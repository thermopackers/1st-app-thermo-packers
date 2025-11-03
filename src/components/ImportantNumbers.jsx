import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../axiosInstance';
import InternalNavbar from '../components/InternalNavbar';
import Swal from 'sweetalert2';

// Helper function to parse roles properly
const parseUserRoles = (user) => {
  if (!user || !user.role) {
    return [];
  }
  
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

const ImportantNumbers = () => {
  const [user, setUser] = useState(null);
  const [numbers, setNumbers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    number: '',
    description: '',
    visibleToRoles: []
  });
  const navigate = useNavigate();

  const roles = ['admin', 'accounts', 'sales', 'production', 'dispatch', 'packaging', 'driver'];

  // ✅ Get user roles properly
  const userRoles = user ? parseUserRoles(user) : [];
  const hasAdminAccess = userRoles.some(role => ['admin', 'accounts'].includes(role));

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchUser = async () => {
      try {
        const res = await axiosInstance.get('/users/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(res.data);
      } catch (err) {
        console.error('Failed to fetch user', err);
        navigate('/login');
      }
    };

    fetchUser();
  }, [navigate]);

  useEffect(() => {
    if (user) {
      fetchNumbers();
    }
  }, [user]);

  const fetchNumbers = async () => {
    try {
      const res = await axiosInstance.get('/important-numbers');
      setNumbers(res.data);
    } catch (err) {
      console.error('Failed to fetch numbers', err);
      Swal.fire('Error', 'Failed to load important numbers', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axiosInstance.put(`/important-numbers/${editingId}`, formData);
        Swal.fire('Success', 'Number updated successfully', 'success');
      } else {
        await axiosInstance.post('/important-numbers', formData);
        Swal.fire('Success', 'Number added successfully', 'success');
      }
      setFormData({ title: '', number: '', description: '', visibleToRoles: [] });
      setEditingId(null);
      fetchNumbers();
    } catch (err) {
      Swal.fire('Error', 'Operation failed', 'error');
    }
  };

  const handleEdit = (number) => {
    setFormData({
      title: number.title,
      number: number.number,
      description: number.description,
      visibleToRoles: number.visibleToRoles
    });
    setEditingId(number._id);
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        await axiosInstance.delete(`/important-numbers/${id}`);
        Swal.fire('Deleted!', 'Number has been deleted.', 'success');
        fetchNumbers();
      } catch (err) {
        Swal.fire('Error', 'Failed to delete number', 'error');
      }
    }
  };

  if (loading) {
    return (
      <>
        <InternalNavbar />
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </>
    );
  }

  return (
    <>
      <InternalNavbar />
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <button 
              onClick={() => navigate(-1)}
              className="mb-4 inline-flex items-center gap-2 rounded-lg bg-slate-800 px-3 py-2 text-sm text-white shadow hover:bg-slate-900"
            >
              ↩️ Back to Dashboard
            </button>
            
            <h1 className="text-3xl font-bold text-gray-900">Important Numbers</h1>
            <p className="text-gray-600">Manage and view important contact numbers</p>
          </div>

          {/* ✅ FIX: Use hasAdminAccess instead of user?.role check */}
          {hasAdminAccess && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">
                {editingId ? 'Edit Number' : 'Add New Number'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Title *</label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                      placeholder="e.g., Emergency Contact"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Number *</label>
                    <input
                      type="text"
                      required
                      value={formData.number}
                      onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                      placeholder="e.g., +91 9876543210"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                    placeholder="Optional description"
                    rows="2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Visible To Roles *
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {roles.map(role => (
                      <label key={role} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.visibleToRoles.includes(role)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({
                                ...formData,
                                visibleToRoles: [...formData.visibleToRoles, role]
                              });
                            } else {
                              setFormData({
                                ...formData,
                                visibleToRoles: formData.visibleToRoles.filter(r => r !== role)
                              });
                            }
                          }}
                          className="mr-2"
                        />
                        <span className="text-sm capitalize">{role}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                  >
                    {editingId ? 'Update' : 'Add'} Number
                  </button>
                  
                  {editingId && (
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({ title: '', number: '', description: '', visibleToRoles: [] });
                        setEditingId(null);
                      }}
                      className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>
          )}

          {/* ✅ FIX: Use hasAdminAccess instead of user?.role check */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">
              {hasAdminAccess 
                ? 'All Important Numbers' 
                : 'Numbers Visible to You'
              }
            </h2>
            
            {numbers.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No numbers found</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {numbers.map((number) => (
                  <div key={number._id} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-lg">{number.title}</h3>
                      {/* ✅ FIX: Use hasAdminAccess instead of user?.role check */}
                      {hasAdminAccess && (
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleEdit(number)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDelete(number._id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            🗑️
                          </button>
                        </div>
                      )}
                    </div>
                    
                    <p className="text-2xl font-bold text-blue-600 mb-2">{number.number}</p>
                    
                    {number.description && (
                      <p className="text-gray-600 text-sm mb-2">{number.description}</p>
                    )}
                    
                    <div className="text-xs text-gray-500">
                      Visible to: {number.visibleToRoles.map(r => r).join(', ')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ImportantNumbers;