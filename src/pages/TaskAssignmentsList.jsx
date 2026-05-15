// src/components/TaskAssignmentsList.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axiosInstance from '../axiosInstance';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

const TaskAssignmentsList = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, active, completed
  const navigate = useNavigate();

  useEffect(() => {
    fetchAssignments();
  }, []);

// In TaskAssignmentsList.jsx
const fetchAssignments = async () => {
  try {
    setLoading(true);
    const token = localStorage.getItem('token');
    const response = await axiosInstance.get('/task-assignment/all', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('Fetched assignments:', response.data.assignments);
    setAssignments(response.data.assignments || []);
  } catch (error) {
    console.error('Error fetching assignments:', error);
    Swal.fire({
      title: 'Error',
      text: 'Failed to load task assignments',
      icon: 'error',
      confirmButtonColor: '#2563eb'
    });
  } finally {
    setLoading(false);
  }
};

  const markAsCompleted = async (assignmentId) => {
    try {
      const token = localStorage.getItem('token');
      await axiosInstance.put(`/task-assignment/${assignmentId}/complete`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      Swal.fire({
        title: 'Success!',
        text: 'Task assignment marked as completed',
        icon: 'success',
        confirmButtonColor: '#2563eb',
        timer: 2000
      });
      
      fetchAssignments(); // Refresh the list
    } catch (error) {
      console.error('Error marking assignment as completed:', error);
      Swal.fire({
        title: 'Error',
        text: 'Failed to update assignment status',
        icon: 'error',
        confirmButtonColor: '#2563eb'
      });
    }
  };

  const filteredAssignments = assignments.filter(assignment => {
    if (filter === 'all') return true;
    if (filter === 'active') return assignment.status === 'active';
    if (filter === 'completed') return assignment.status === 'completed';
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white">
        <div className="flex flex-col items-center gap-6">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-blue-700 font-semibold">Loading task assignments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <button
            onClick={() => navigate(-1)}
            className="mb-4 inline-flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
          >
            ← Back
          </button>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <span className="text-4xl">📋</span>
            Task Assignments (Absent User Coverage)
          </h1>
          <p className="text-gray-600 mt-2">
            View all task assignments created when users were absent
          </p>
        </motion.div>

        {/* Filter Tabs */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            All ({assignments.length})
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'active'
                ? 'bg-green-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Active ({assignments.filter(a => a.status === 'active').length})
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'completed'
                ? 'bg-gray-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Completed ({assignments.filter(a => a.status === 'completed').length})
          </button>
        </div>

        {/* Assignments List */}
        {filteredAssignments.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-2xl shadow-lg p-12 text-center"
          >
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Task Assignments</h3>
            <p className="text-gray-600">
              {filter === 'all' 
                ? 'No task assignments have been created yet.' 
                : filter === 'active' 
                ? 'No active task assignments.' 
                : 'No completed task assignments.'}
            </p>
            <button
              onClick={() => navigate('/dashboard')}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go to Dashboard
            </button>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {filteredAssignments.map((assignment, index) => (
              <motion.div
                key={assignment._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          assignment.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {assignment.status === 'active' ? '🟢 Active' : '✅ Completed'}
                        </span>
                        <span className="text-xs text-gray-500">
                          Created: {new Date(assignment.createdAt).toLocaleDateString()}
                        </span>
                        {assignment.date && (
                          <span className="text-xs text-gray-500">
                            For Date: {new Date(assignment.date).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-4 mb-4">
                        <div className="bg-red-50 rounded-lg p-3">
                          <p className="text-xs text-red-600 font-semibold mb-1">ABSENT USER</p>
                          <p className="font-medium text-gray-900">{assignment.absentUser?.name || 'Unknown'}</p>
                          <p className="text-sm text-gray-600">{assignment.absentUser?.email}</p>
                          {assignment.absentUser?.designation && (
                            <p className="text-xs text-gray-500">{assignment.absentUser.designation}</p>
                          )}
                        </div>
                        
                        <div className="bg-green-50 rounded-lg p-3">
                          <p className="text-xs text-green-600 font-semibold mb-1">ASSIGNED TO</p>
                          <p className="font-medium text-gray-900">{assignment.assigningUser?.name || 'Unknown'}</p>
                          <p className="text-sm text-gray-600">{assignment.assigningUser?.email}</p>
                          {assignment.assigningUser?.designation && (
                            <p className="text-xs text-gray-500">{assignment.assigningUser.designation}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 rounded-lg p-3 mb-4">
                        <p className="text-xs text-gray-600 font-semibold mb-2">📝 RESPONSIBILITIES & INSTRUCTIONS</p>
                        <p className="text-gray-700 whitespace-pre-wrap">{assignment.responsibilities}</p>
                      </div>
                      
                      <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                        <div className="text-xs text-gray-500">
                          Assigned by: {assignment.assignedBy?.name || 'Unknown'}
                          {assignment.assignedBy?.designation && ` (${assignment.assignedBy.designation})`}
                        </div>
                        
                        {assignment.status === 'active' && (
                          <button
                            onClick={() => markAsCompleted(assignment._id)}
                            className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                          >
                            <span>✓</span>
                            Mark as Completed
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskAssignmentsList;