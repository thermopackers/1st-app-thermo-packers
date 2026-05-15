// src/components/TaskAssignmentModal.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axiosInstance from '../axiosInstance';
import Swal from 'sweetalert2';

const TaskAssignmentModal = ({ isOpen, onClose, currentUser }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    absentUser: '',
    assigningUser: '',
    responsibilities: ''
  });

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axiosInstance.get('/users/all', {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Filter out current user if needed
      const allUsers = response.data || [];
      setUsers(allUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      Swal.fire({
        title: 'Error',
        text: 'Failed to load users list',
        icon: 'error',
        confirmButtonColor: '#2563eb'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.absentUser || !formData.assigningUser || !formData.responsibilities) {
      Swal.fire({
        title: 'Missing Fields',
        text: 'Please fill in all fields',
        icon: 'warning',
        confirmButtonColor: '#2563eb'
      });
      return;
    }

    if (formData.absentUser === formData.assigningUser) {
      Swal.fire({
        title: 'Invalid Selection',
        text: 'Absent user and assigning user cannot be the same',
        icon: 'warning',
        confirmButtonColor: '#2563eb'
      });
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      const response = await axiosInstance.post('/task-assignment/assign', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        Swal.fire({
          title: 'Success!',
          text: 'Task assignment created successfully. Both users have been notified.',
          icon: 'success',
          confirmButtonColor: '#2563eb'
        });
        
        // Reset form and close modal
        setFormData({
          absentUser: '',
          assigningUser: '',
          responsibilities: ''
        });
        onClose();
      }
    } catch (error) {
      console.error('Error creating task assignment:', error);
      Swal.fire({
        title: 'Error',
        text: error.response?.data?.message || 'Failed to create task assignment',
        icon: 'error',
        confirmButtonColor: '#2563eb'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getSelectedUserDetails = (userId) => {
    const user = users.find(u => u._id === userId);
    return user;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <span className="text-3xl">👤➡️👥</span>
                  Assign Tasks for Absent User
                </h2>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Assign an absent user's tasks to another user for the day
              </p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Absent User Field */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Absent User <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.absentUser}
                  onChange={(e) => setFormData({ ...formData, absentUser: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  required
                  disabled={loading}
                >
                  <option value="">Select absent user</option>
                  {users.map((user) => (
                    <option key={user._id} value={user._id}>
                      {user.name} - {user.email} {user.designation ? `(${user.designation})` : ''}
                    </option>
                  ))}
                </select>
                {formData.absentUser && (
                  <p className="text-xs text-gray-500 mt-1">
                    This user's tasks will be reassigned
                  </p>
                )}
              </div>

              {/* Assigning User Field */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Assigning User <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.assigningUser}
                  onChange={(e) => setFormData({ ...formData, assigningUser: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  required
                  disabled={loading}
                >
                  <option value="">Select user to assign tasks</option>
                  {users
                    .filter(user => user._id !== formData.absentUser)
                    .map((user) => (
                      <option key={user._id} value={user._id}>
                        {user.name} - {user.email} {user.designation ? `(${user.designation})` : ''}
                      </option>
                    ))}
                </select>
                {formData.assigningUser && (
                  <p className="text-xs text-gray-500 mt-1">
                    This user will handle the absent user's responsibilities
                  </p>
                )}
              </div>

              {/* Responsibilities Textarea */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Job Responsibilities & Instructions <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.responsibilities}
                  onChange={(e) => setFormData({ ...formData, responsibilities: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  rows="6"
                  placeholder="Explain the absent user's job responsibilities, daily tasks, and any specific instructions for today..."
                  required
                />
                <p className="text-xs text-gray-400 mt-1">
                  Be specific about tasks, deadlines, and important contacts
                </p>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Assigning...
                    </>
                  ) : (
                    'Assign Tasks & Notify Users'
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TaskAssignmentModal;