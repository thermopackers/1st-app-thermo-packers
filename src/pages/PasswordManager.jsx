import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axiosInstance from '../axiosInstance';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';
import InternalNavbar from '../components/InternalNavbar';

export default function PasswordManager() {
  const navigate = useNavigate();
  const [passwords, setPasswords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingPassword, setEditingPassword] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState([]);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [userRoles, setUserRoles] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [showPassword, setShowPassword] = useState({});
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    username: '',
    password: '',
    url: '',
    notes: '',
    category: 'other',
    visibleToRoles: [],
    visibleToUsers: [],
    isPublic: false
  });

  const categories = [
    { value: 'all', label: 'All Categories', icon: '📋' },
    { value: 'email', label: 'Email', icon: '📧' },
    { value: 'social', label: 'Social Media', icon: '🌐' },
    { value: 'banking', label: 'Banking', icon: '🏦' },
    { value: 'business', label: 'Business', icon: '💼' },
    { value: 'other', label: 'Other', icon: '📌' }
  ];

  const roleOptions = [
    { value: 'admin', label: 'Admin', bg: 'bg-red-500' },
    { value: 'accounts', label: 'Accounts', bg: 'bg-green-500' },
    { value: 'sales', label: 'Sales', bg: 'bg-blue-500' },
    { value: 'production', label: 'Production', bg: 'bg-purple-500' },
    { value: 'dispatch', label: 'Dispatch', bg: 'bg-orange-500' },
    { value: 'packaging', label: 'Packaging', bg: 'bg-yellow-500' },
    { value: 'driver', label: 'Driver', bg: 'bg-indigo-500' },
    { value: 'suppliers', label: 'Suppliers', bg: 'bg-pink-500' },
    { value: 'guard', label: 'Guard', bg: 'bg-teal-500' },
    { value: 'plantMaintenance', label: 'Plant Maintenance', bg: 'bg-cyan-500' }
  ];

  // Load all data on mount
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        await fetchCurrentUser();
        await fetchPasswords();
      } catch (error) {
        console.error('Error loading initial data:', error);
      } finally {
        setInitialLoadComplete(true);
      }
    };
    
    loadInitialData();
  }, []);

  // Fetch users when we know if user can manage
  useEffect(() => {
    if (initialLoadComplete && canManage()) {
      fetchUsers();
    }
  }, [initialLoadComplete, userRoles]);

  useEffect(() => {
    if (initialLoadComplete) {
      fetchPasswords();
    }
  }, [selectedCategory, searchTerm]);

  const fetchCurrentUser = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axiosInstance.get('/users/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Current user:', res.data);
      setCurrentUser(res.data);
      
      // Parse user roles
      let roles = [];
      if (res.data.role) {
        if (Array.isArray(res.data.role)) {
          roles = res.data.role;
        } else if (typeof res.data.role === 'string') {
          try {
            roles = JSON.parse(res.data.role);
          } catch {
            roles = [res.data.role];
          }
        }
      }
      console.log('Parsed roles:', roles);
      setUserRoles(roles);
    } catch (err) {
      console.error('Error fetching user:', err);
    }
  };

  const fetchPasswords = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory !== 'all') {
        params.append('category', selectedCategory);
      }
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      
      const response = await axiosInstance.get(`/passwords?${params.toString()}`);
      console.log('Passwords:', response.data);
      setPasswords(response.data);
    } catch (err) {
      console.error('Error fetching passwords:', err);
      Swal.fire({
        title: 'Error',
        text: 'Failed to load passwords',
        icon: 'error',
        confirmButtonColor: '#2563eb'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      console.log('Fetching users...');
      const response = await axiosInstance.get('/passwords/users/list');
      console.log('Users response:', response.data);
      setUsers(response.data);
    } catch (err) {
      console.error('Error fetching users:', err);
      Swal.fire({
        title: 'Error',
        text: 'Failed to load users',
        icon: 'error',
        confirmButtonColor: '#2563eb'
      });
    } finally {
      setUsersLoading(false);
    }
  };

  const canManage = () => {
    const hasAccess = userRoles.includes('accounts') || userRoles.includes('admin');
    console.log('Can manage?', hasAccess, 'Roles:', userRoles);
    return hasAccess;
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleRoleToggle = (role) => {
    setFormData(prev => ({
      ...prev,
      visibleToRoles: prev.visibleToRoles.includes(role)
        ? prev.visibleToRoles.filter(r => r !== role)
        : [...prev.visibleToRoles, role]
    }));
  };

  const handleUserToggle = (userId) => {
    setFormData(prev => ({
      ...prev,
      visibleToUsers: prev.visibleToUsers.includes(userId)
        ? prev.visibleToUsers.filter(id => id !== userId)
        : [...prev.visibleToUsers, userId]
    }));
  };

  const resetForm = () => {
    setFormData({
      title: '',
      username: '',
      password: '',
      url: '',
      notes: '',
      category: 'other',
      visibleToRoles: [],
      visibleToUsers: [],
      isPublic: false
    });
    setEditingPassword(null);
    setShowForm(false);
    setUserSearchTerm('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingPassword) {
        await axiosInstance.put(`/passwords/${editingPassword._id}`, formData);
        Swal.fire({
          title: 'Success',
          text: 'Password updated successfully',
          icon: 'success',
          confirmButtonColor: '#2563eb',
          timer: 1500
        });
      } else {
        await axiosInstance.post('/passwords', formData);
        Swal.fire({
          title: 'Success',
          text: 'Password added successfully',
          icon: 'success',
          confirmButtonColor: '#2563eb',
          timer: 1500
        });
      }
      
      resetForm();
      fetchPasswords();
    } catch (err) {
      console.error('Error saving password:', err);
      Swal.fire({
        title: 'Error',
        text: 'Failed to save password',
        icon: 'error',
        confirmButtonColor: '#2563eb'
      });
    }
  };

  const handleEdit = (password) => {
    setEditingPassword(password);
    setFormData({
      title: password.title,
      username: password.username,
      password: '', // Don't prefill password for security
      url: password.url || '',
      notes: password.notes || '',
      category: password.category,
      visibleToRoles: password.visibleToRoles || [],
      visibleToUsers: password.visibleToUsers?.map(u => u._id) || [],
      isPublic: password.isPublic || false
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Delete Password?',
      text: 'Are you sure you want to delete this password?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it'
    });

    if (result.isConfirmed) {
      try {
        await axiosInstance.delete(`/passwords/${id}`);
        Swal.fire({
          title: 'Deleted!',
          text: 'Password has been deleted.',
          icon: 'success',
          confirmButtonColor: '#2563eb',
          timer: 1500
        });
        fetchPasswords();
      } catch (err) {
        console.error('Error deleting password:', err);
        Swal.fire({
          title: 'Error',
          text: 'Failed to delete password',
          icon: 'error',
          confirmButtonColor: '#2563eb'
        });
      }
    }
  };

  const handleViewPassword = async (id) => {
    // If already showing, hide it
    if (showPassword[id]) {
      setShowPassword(prev => ({ ...prev, [id]: false }));
      return;
    }

    try {
      const response = await axiosInstance.get(`/passwords/${id}`);
      setShowPassword(prev => ({ ...prev, [id]: response.data.password }));
    } catch (err) {
      console.error('Error fetching password:', err);
      Swal.fire({
        title: 'Error',
        text: 'Failed to retrieve password',
        icon: 'error',
        confirmButtonColor: '#2563eb'
      });
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    Swal.fire({
      title: 'Copied!',
      text: 'Password copied to clipboard',
      icon: 'success',
      confirmButtonColor: '#2563eb',
      timer: 1500,
      showConfirmButton: false
    });
  };

  const getCategoryIcon = (category) => {
    const cat = categories.find(c => c.value === category);
    return cat ? cat.icon : '📌';
  };

  // Filter users based on search term
  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
    (user.role && user.role.some(r => r.toLowerCase().includes(userSearchTerm.toLowerCase())))
  );

  // Filter passwords based on search and category
  const filteredPasswords = passwords.filter(p => {
    if (selectedCategory !== 'all' && p.category !== selectedCategory) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        p.title.toLowerCase().includes(term) ||
        p.username.toLowerCase().includes(term) ||
        (p.url && p.url.toLowerCase().includes(term))
      );
    }
    return true;
  });

  // Show loading while initial data is loading
  if (!initialLoadComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white">
        <div className="flex flex-col items-center gap-6">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-blue-700 font-semibold text-lg">Loading Password Manager...</p>
        </div>
      </div>
    );
  }

  return (

    <>
    <InternalNavbar />
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <button
                onClick={() => navigate(-1)}
                className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-xl shadow-lg hover:shadow-xl text-gray-700 font-medium transition-all duration-300 mb-4"
              >
                <span>←</span> Back
              </button>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <span className="text-4xl">🔐</span>
                Password Manager
              </h1>
              <p className="text-gray-600 mt-2">
                Securely store and manage all your passwords
              </p>
            </div>
            {canManage() && (
              <motion.button
                onClick={() => setShowForm(true)}
                className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span>➕</span>
                Add New Password
              </motion.button>
            )}
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          className="bg-white rounded-2xl shadow-lg p-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search passwords..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                🔍
              </span>
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>
                  {cat.icon} {cat.label}
                </option>
              ))}
            </select>

            {/* Stats */}
            <div className="flex items-center justify-end text-gray-600">
              <span className="font-semibold">{filteredPasswords.length}</span>
              <span className="ml-1">passwords found</span>
            </div>
          </div>
        </motion.div>

        {/* Add/Edit Form Modal */}
        <AnimatePresence>
          {showForm && canManage() && (
            <motion.div
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={resetForm}
            >
              <motion.div
                className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    {editingPassword ? 'Edit Password' : 'Add New Password'}
                  </h2>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Title *
                        </label>
                        <input
                          type="text"
                          name="title"
                          value={formData.title}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="e.g., Gmail, Facebook, Bank Account"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Category
                        </label>
                        <select
                          name="category"
                          value={formData.category}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {categories.filter(c => c.value !== 'all').map(cat => (
                            <option key={cat.value} value={cat.value}>
                              {cat.icon} {cat.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Username & Password */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Username/Email *
                        </label>
                        <input
                          type="text"
                          name="username"
                          value={formData.username}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Password {!editingPassword && '*'}
                        </label>
                        <input
                          type="password"
                          name="password"
                          value={formData.password}
                          onChange={handleInputChange}
                          required={!editingPassword}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder={editingPassword ? 'Leave blank to keep current' : ''}
                        />
                      </div>
                    </div>

                    {/* URL */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        URL (Optional)
                      </label>
                      <input
                        type="url"
                        name="url"
                        value={formData.url}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="https://example.com"
                      />
                    </div>

                    {/* Notes */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Notes (Optional)
                      </label>
                      <textarea
                        name="notes"
                        value={formData.notes}
                        onChange={handleInputChange}
                        rows="3"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Additional notes..."
                      />
                    </div>

                    {/* Visibility Settings */}
                    <div className="border-t border-gray-200 pt-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Who can see this password?
                      </h3>

                      {/* Public Toggle */}
                      <div className="mb-6">
                        <label className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            name="isPublic"
                            checked={formData.isPublic}
                            onChange={handleInputChange}
                            className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                          />
                          <span className="text-gray-700">
                            Make visible to all users (Public)
                          </span>
                        </label>
                      </div>

                      {!formData.isPublic && (
                        <>
                          {/* Role Selection */}
                          <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                              Visible to Roles
                            </label>
                            <div className="flex flex-wrap gap-3">
                              {roleOptions.map(role => {
                                const isSelected = formData.visibleToRoles.includes(role.value);
                                return (
                                  <button
                                    key={role.value}
                                    type="button"
                                    onClick={() => handleRoleToggle(role.value)}
                                    className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 ${
                                      isSelected 
                                        ? role.bg + ' text-white shadow-lg' 
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                  >
                                    {role.label}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* User Selection */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                              Visible to Specific Users
                            </label>
                            
                            {/* Search input for users */}
                            <div className="relative mb-3">
                              <input
                                type="text"
                                placeholder="Search users by name, email or role..."
                                value={userSearchTerm}
                                onChange={(e) => setUserSearchTerm(e.target.value)}
                                className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                              />
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                🔍
                              </span>
                            </div>
                            
                            <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-xl p-4">
                              {usersLoading ? (
                                <div className="text-center py-8">
                                  <div className="inline-block w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                                  <p className="text-gray-500 mt-2">Loading users...</p>
                                </div>
                              ) : filteredUsers.length === 0 ? (
                                <p className="text-center text-gray-500 py-4">
                                  {users.length === 0 ? 'No users found' : 'No users match your search'}
                                </p>
                              ) : (
                                filteredUsers.map(user => (
                                  <label key={user._id} className="flex items-start gap-3 py-2 hover:bg-gray-50 rounded-lg px-2 transition-colors">
                                    <input
                                      type="checkbox"
                                      checked={formData.visibleToUsers.includes(user._id)}
                                      onChange={() => handleUserToggle(user._id)}
                                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 mt-1"
                                    />
                                    <div className="flex-1">
                                      <div className="flex items-center flex-wrap gap-2">
                                        <span className="text-gray-700 font-medium">
                                          {user.name}
                                        </span>
                                        <span className="text-sm text-gray-500">
                                          ({user.email})
                                        </span>
                                      </div>
                                      {user.role && user.role.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-1">
                                          {user.role.map((role, idx) => (
                                            <span 
                                              key={idx} 
                                              className="inline-block px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full"
                                            >
                                              {role}
                                            </span>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </label>
                                ))
                              )}
                            </div>
                            
                            {/* Select/Deselect All buttons */}
                            {!usersLoading && filteredUsers.length > 0 && (
                              <div className="flex gap-2 mt-3">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const allUserIds = filteredUsers.map(u => u._id);
                                    setFormData(prev => ({
                                      ...prev,
                                      visibleToUsers: [...new Set([...prev.visibleToUsers, ...allUserIds])]
                                    }));
                                  }}
                                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                                >
                                  Select All
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const filteredUserIds = filteredUsers.map(u => u._id);
                                    setFormData(prev => ({
                                      ...prev,
                                      visibleToUsers: prev.visibleToUsers.filter(id => !filteredUserIds.includes(id))
                                    }));
                                  }}
                                  className="text-sm text-red-600 hover:text-red-800 font-medium"
                                >
                                  Clear All
                                </button>
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>

                    {/* Form Actions */}
                    <div className="flex justify-end gap-4 pt-6">
                      <button
                        type="button"
                        onClick={resetForm}
                        className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-gray-50 transition-all duration-300"
                      >
                        Cancel
                      </button>
                      <motion.button
                        type="submit"
                        className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {editingPassword ? 'Update' : 'Save'} Password
                      </motion.button>
                    </div>
                  </form>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Passwords Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          </div>
        ) : (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {filteredPasswords.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <div className="text-6xl mb-4">🔐</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No passwords found</h3>
                <p className="text-gray-600">
                  {canManage() 
                    ? 'Click "Add New Password" to get started'
                    : 'No passwords are visible to you yet'}
                </p>
              </div>
            ) : (
              filteredPasswords.map((password, index) => (
                <motion.div
                  key={password._id}
                  className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ y: -4 }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{getCategoryIcon(password.category)}</span>
                      <div>
                        <h3 className="font-bold text-gray-900">{password.title}</h3>
                        <p className="text-sm text-gray-600">{password.username}</p>
                      </div>
                    </div>
                    {canManage() && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(password)}
                          className="text-gray-400 hover:text-blue-500 transition-colors p-2"
                          title="Edit"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDelete(password._id)}
                          className="text-gray-400 hover:text-red-500 transition-colors p-2"
                          title="Delete"
                        >
                          🗑️
                        </button>
                      </div>
                    )}
                  </div>

                  {password.url && (
                    <a
                      href={password.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline mb-3 block truncate"
                    >
                      {password.url}
                    </a>
                  )}

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between bg-gray-50 p-3 rounded-xl">
                      <span className="text-sm font-medium text-gray-700">Password</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm">
                          {showPassword[password._id] ? showPassword[password._id] : '••••••••'}
                        </span>
                        <button
                          onClick={() => handleViewPassword(password._id)}
                          className="text-gray-400 hover:text-blue-500 transition-colors"
                          title={showPassword[password._id] ? 'Hide' : 'Show'}
                        >
                          {showPassword[password._id] ? '🙈' : '👁️'}
                        </button>
                        {showPassword[password._id] && (
                          <button
                            onClick={() => copyToClipboard(showPassword[password._id])}
                            className="text-gray-400 hover:text-green-500 transition-colors"
                            title="Copy to clipboard"
                          >
                            📋
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {password.notes && (
                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-xl mb-4">
                      {password.notes}
                    </p>
                  )}

                  {/* Visibility Badges */}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {password.isPublic && (
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                        Public
                      </span>
                    )}
                    {password.visibleToRoles?.map(role => (
                      <span key={role} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                        {role}
                      </span>
                    ))}
                  </div>

                  {/* Metadata */}
                  <div className="mt-4 text-xs text-gray-400 border-t border-gray-100 pt-4">
                    <p>Created by: {password.createdBy?.name || 'Unknown'}</p>
                    <p>{new Date(password.createdAt).toLocaleDateString()}</p>
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>
        )}
      </div>
    </div>
    </>
  );
}