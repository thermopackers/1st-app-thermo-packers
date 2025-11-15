import React, { useState, useEffect } from 'react';
import { Upload, FileText, Calendar, User, Trash2, Eye, Download, Filter, BarChart3, Search } from 'lucide-react';
import axiosInstance from '../axiosInstance';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import InternalNavbar from './InternalNavbar';

const LeaveManagement = () => {
  const [leaveApplications, setLeaveApplications] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [leaveFiles, setLeaveFiles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statistics, setStatistics] = useState(null);
  const [showStatistics, setShowStatistics] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    user: '',
    leaveType: '',
    dateRange: '',
    search: '',
  });

  const [leaveForm, setLeaveForm] = useState({
    leaveType: 'casual',
    startDate: '',
    endDate: '',
    reason: '',
  });

  useEffect(() => {
    fetchLeaveApplications();
    fetchUsers();
    fetchStatistics();
  }, [filters]);

  const fetchLeaveApplications = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.user) queryParams.append('user', filters.user);
      if (filters.leaveType) queryParams.append('leaveType', filters.leaveType);
      if (filters.dateRange) queryParams.append('dateRange', filters.dateRange);
      if (filters.search) queryParams.append('search', filters.search);

      const res = await axiosInstance.get(`/leave/applications?${queryParams}`);
      setLeaveApplications(res.data);
    } catch (err) {
      toast.error('Failed to fetch leave applications');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await axiosInstance.get('/users/all');
      setUsers(res.data);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  };

  const fetchStatistics = async () => {
    try {
      const res = await axiosInstance.get('/leave/statistics');
      setStatistics(res.data);
    } catch (err) {
      console.error('Failed to fetch statistics:', err);
    }
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 5) {
      toast.error('Maximum 5 files allowed');
      return;
    }
    setLeaveFiles(files);
  };

  const removeFile = (index) => {
    setLeaveFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmitLeave = async (e) => {
    e.preventDefault();
    
    if (!selectedUser) {
      toast.error('Please select a user');
      return;
    }

    if (leaveFiles.length === 0) {
      toast.error('Please upload at least one leave application file');
      return;
    }

    if (!leaveForm.startDate || !leaveForm.endDate || !leaveForm.reason) {
      toast.error('Please fill all required fields');
      return;
    }

    const startDate = new Date(leaveForm.startDate);
    const endDate = new Date(leaveForm.endDate);
    
    if (startDate > endDate) {
      toast.error('End date cannot be before start date');
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('userId', selectedUser);
      formData.append('leaveType', leaveForm.leaveType);
      formData.append('startDate', leaveForm.startDate);
      formData.append('endDate', leaveForm.endDate);
      formData.append('reason', leaveForm.reason);

      leaveFiles.forEach(file => {
        formData.append('applicationFiles', file);
      });

      await axiosInstance.post('/leave/submit', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      toast.success('Leave application submitted successfully!');
      
      // Reset form
      setSelectedUser('');
      setLeaveFiles([]);
      setLeaveForm({
        leaveType: 'casual',
        startDate: '',
        endDate: '',
        reason: '',
      });
      
      // Refresh data
      fetchLeaveApplications();
      fetchStatistics();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit leave application');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusUpdate = async (applicationId, status) => {
    try {
      const { value: comments } = await Swal.fire({
        title: `Are you sure you want to ${status} this leave?`,
        input: status === 'rejected' ? 'textarea' : undefined,
        inputLabel: 'Comments (optional)',
        inputPlaceholder: 'Enter your comments here...',
        showCancelButton: true,
        confirmButtonText: `Yes, ${status}`,
        cancelButtonText: 'Cancel',
        inputValidator: (value) => {
          if (status === 'rejected' && !value?.trim()) {
            return 'Please provide reason for rejection';
          }
        }
      });

      if (comments !== undefined) {
        await axiosInstance.put(`/leave/update-status/${applicationId}`, {
          status,
          comments: comments || ''
        });

        toast.success(`Leave application ${status} successfully!`);
        fetchLeaveApplications();
        fetchStatistics();
      }
    } catch (err) {
      toast.error('Failed to update leave status');
    }
  };

  const deleteLeaveApplication = async (applicationId) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "This will permanently delete the leave application and all associated files!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        await axiosInstance.delete(`/leave/delete/${applicationId}`);
        toast.success('Leave application deleted successfully!');
        fetchLeaveApplications();
        fetchStatistics();
      } catch (err) {
        toast.error('Failed to delete leave application');
      }
    }
  };

  const downloadFile = (url, filename) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const showDocument = (url, title) => {
    const extension = url.split('.').pop().toLowerCase();
    const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension);

    if (isImage) {
      Swal.fire({
        title: title,
        html: `<div style="text-align:center;">
               <img src="${url}" alt="${title}" style="max-width:100%; max-height:70vh; border-radius:8px;" />
             </div>`,
        showCloseButton: true,
        showConfirmButton: false,
        width: "80%",
        background: "#fff",
      });
    } else {
      // For PDF and other documents, open in new tab
      window.open(url, '_blank');
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', label: 'Pending' },
      approved: { color: 'bg-green-100 text-green-800 border-green-200', label: 'Approved' },
      rejected: { color: 'bg-red-100 text-red-800 border-red-200', label: 'Rejected' },
      cancelled: { color: 'bg-gray-100 text-gray-800 border-gray-200', label: 'Cancelled' },
    };
    const config = statusConfig[status] || statusConfig.pending;
    return <span className={`px-3 py-1 rounded-full text-xs font-medium border ${config.color}`}>{config.label}</span>;
  };

  const getLeaveTypeBadge = (type) => {
    const typeConfig = {
      casual: { color: 'bg-blue-100 text-blue-800 border-blue-200', label: 'Casual' },
      sick: { color: 'bg-orange-100 text-orange-800 border-orange-200', label: 'Sick' },
      earned: { color: 'bg-purple-100 text-purple-800 border-purple-200', label: 'Earned' },
      maternity: { color: 'bg-pink-100 text-pink-800 border-pink-200', label: 'Maternity' },
      paternity: { color: 'bg-teal-100 text-teal-800 border-teal-200', label: 'Paternity' },
      emergency: { color: 'bg-red-100 text-red-800 border-red-200', label: 'Emergency' },
      other: { color: 'bg-gray-100 text-gray-800 border-gray-200', label: 'Other' },
    };
    const config = typeConfig[type] || typeConfig.other;
    return <span className={`px-3 py-1 rounded-full text-xs font-medium border ${config.color}`}>{config.label}</span>;
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      user: '',
      leaveType: '',
      dateRange: '',
      search: '',
    });
  };

  return (
    <>
      <InternalNavbar />
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                  <FileText className="w-6 h-6" />
                  Leave Applications Management
                </h1>
                <p className="text-gray-600 mt-1">Manage and track employee leave applications</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowStatistics(!showStatistics)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  <BarChart3 className="w-4 h-4" />
                  Statistics
                </button>
              </div>
            </div>

            {/* Statistics Card */}
            {showStatistics && statistics && (
              <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <p className="text-blue-600 text-sm font-medium">Total</p>
                  <p className="text-2xl font-bold text-blue-700">{statistics.totalApplications}</p>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <p className="text-yellow-600 text-sm font-medium">Pending</p>
                  <p className="text-2xl font-bold text-yellow-700">{statistics.pendingApplications}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <p className="text-green-600 text-sm font-medium">Approved</p>
                  <p className="text-2xl font-bold text-green-700">{statistics.approvedApplications}</p>
                </div>
                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <p className="text-red-600 text-sm font-medium">Rejected</p>
                  <p className="text-2xl font-bold text-red-700">{statistics.rejectedApplications}</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <p className="text-purple-600 text-sm font-medium">This Month</p>
                  <p className="text-2xl font-bold text-purple-700">{statistics.monthlyApplications}</p>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Submit Leave Application */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm p-6 sticky top-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  Submit Leave Application
                </h2>

                <form onSubmit={handleSubmitLeave} className="space-y-4">
                  {/* User Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Select Employee *
                    </label>
                    <select
                      value={selectedUser}
                      onChange={(e) => setSelectedUser(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-400 outline-none"
                      required
                    >
                      <option value="">Select Employee</option>
                      {users.map(user => (
                        <option key={user._id} value={user._id}>
                          {user.name} - {user.designation || 'No Designation'}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Leave Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Leave Type *
                    </label>
                    <select
                      value={leaveForm.leaveType}
                      onChange={(e) => setLeaveForm(prev => ({ ...prev, leaveType: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-400 outline-none"
                    >
                      <option value="casual">Casual Leave</option>
                      <option value="sick">Sick Leave</option>
                      <option value="earned">Earned Leave</option>
                      <option value="maternity">Maternity Leave</option>
                      <option value="paternity">Paternity Leave</option>
                      <option value="emergency">Emergency Leave</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  {/* Date Range */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Start Date *
                      </label>
                      <input
                        type="date"
                        value={leaveForm.startDate}
                        onChange={(e) => setLeaveForm(prev => ({ ...prev, startDate: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-400 outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        End Date *
                      </label>
                      <input
                        type="date"
                        value={leaveForm.endDate}
                        onChange={(e) => setLeaveForm(prev => ({ ...prev, endDate: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-400 outline-none"
                        required
                      />
                    </div>
                  </div>

                  {/* Reason */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Reason for Leave *
                    </label>
                    <textarea
                      value={leaveForm.reason}
                      onChange={(e) => setLeaveForm(prev => ({ ...prev, reason: e.target.value }))}
                      rows="3"
                      className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-400 outline-none"
                      placeholder="Enter reason for leave..."
                      required
                    />
                  </div>

                  {/* File Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Upload Leave Application Files *
                    </label>
                    <input
                      type="file"
                      multiple
                      onChange={handleFileUpload}
                      className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-400 outline-none"
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Maximum 5 files, Supported: PDF, JPG, PNG, DOC, DOCX
                    </p>
                  </div>

                  {/* File Preview */}
                  {leaveFiles.length > 0 && (
                    <div className="border rounded-lg p-3 bg-gray-50">
                      <p className="text-sm font-medium text-gray-700 mb-2">Selected Files ({leaveFiles.length}/5):</p>
                      <div className="space-y-2">
                        {leaveFiles.map((file, index) => (
                          <div key={index} className="flex items-center justify-between text-sm">
                            <span className="truncate flex-1">{file.name}</span>
                            <span className="text-xs text-gray-500 ml-2">
                              ({(file.size / 1024 / 1024).toFixed(2)} MB)
                            </span>
                            <button
                              type="button"
                              onClick={() => removeFile(index)}
                              className="text-red-600 hover:text-red-800 ml-2"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-medium ${
                      isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Leave Application'}
                  </button>
                </form>
              </div>
            </div>

            {/* Right Column - Leave Applications List */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm p-6">
                {/* Header with Filters */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <Filter className="w-5 h-5" />
                    Leave Applications
                  </h3>
                  <div className="flex gap-2">
                    <button
                      onClick={clearFilters}
                      className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                    >
                      Clear Filters
                    </button>
                  </div>
                </div>

                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                  <div className="md:col-span-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        placeholder="Search by name..."
                        value={filters.search}
                        onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none text-sm"
                      />
                    </div>
                  </div>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                    className="border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-400 outline-none text-sm"
                  >
                    <option value="">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="cancelled">Cancelled</option>
                  </select>

                  <select
                    value={filters.user}
                    onChange={(e) => setFilters(prev => ({ ...prev, user: e.target.value }))}
                    className="border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-400 outline-none text-sm"
                  >
                    <option value="">All Employees</option>
                    {users.map(user => (
                      <option key={user._id} value={user._id}>{user.name}</option>
                    ))}
                  </select>

                  <select
                    value={filters.leaveType}
                    onChange={(e) => setFilters(prev => ({ ...prev, leaveType: e.target.value }))}
                    className="border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-400 outline-none text-sm"
                  >
                    <option value="">All Types</option>
                    <option value="casual">Casual</option>
                    <option value="sick">Sick</option>
                    <option value="earned">Earned</option>
                    <option value="maternity">Maternity</option>
                    <option value="paternity">Paternity</option>
                    <option value="emergency">Emergency</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {/* Applications List */}
                <div className="space-y-4">
                  {loading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="text-gray-600 mt-2">Loading applications...</p>
                    </div>
                  ) : leaveApplications.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                      <p>No leave applications found</p>
                      {Object.values(filters).some(filter => filter) && (
                        <button
                          onClick={clearFilters}
                          className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Clear filters to see all applications
                        </button>
                      )}
                    </div>
                  ) : (
                    leaveApplications.map(application => (
                      <div key={application._id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <User className="w-4 h-4 text-gray-500" />
                              <h3 className="font-semibold text-gray-800">{application.userName}</h3>
                              <span className="text-sm text-gray-500">({application.userDesignation || 'No Designation'})</span>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {new Date(application.startDate).toLocaleDateString()} - {new Date(application.endDate).toLocaleDateString()}
                              </span>
                              <span>({application.totalDays} days)</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {getLeaveTypeBadge(application.leaveType)}
                            {getStatusBadge(application.status)}
                          </div>
                        </div>

                        <p className="text-gray-700 mb-3 text-sm">{application.reason}</p>

                        {/* Files */}
                        {application.applicationFiles && application.applicationFiles.length > 0 && (
                          <div className="mb-3">
                            <p className="text-sm font-medium text-gray-700 mb-2">Application Files:</p>
                            <div className="flex flex-wrap gap-2">
                              {application.applicationFiles.map((file, index) => (
                                <div key={index} className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-1 text-sm">
                                  <FileText className="w-4 h-4 text-gray-600" />
                                  <span className="text-gray-700">Document {index + 1}</span>
                                  <button
                                    onClick={() => showDocument(file, `Leave Document ${index + 1}`)}
                                    className="text-blue-600 hover:text-blue-800"
                                    title="View"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => downloadFile(file, `leave_document_${index + 1}`)}
                                    className="text-green-600 hover:text-green-800"
                                    title="Download"
                                  >
                                    <Download className="w-4 h-4" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center justify-between pt-3 border-t">
                          <div className="text-xs text-gray-500">
                            Applied: {new Date(application.appliedDate).toLocaleDateString()}
                            {application.reviewedBy && ` • Reviewed: ${new Date(application.reviewedAt).toLocaleDateString()}`}
                            {application.reviewerName && ` by ${application.reviewerName}`}
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {application.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleStatusUpdate(application._id, 'approved')}
                                  className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleStatusUpdate(application._id, 'rejected')}
                                  className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => deleteLeaveApplication(application._id)}
                              className="p-1 text-red-600 hover:text-red-800 transition"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Review Comments */}
                        {application.reviewComments && (
                          <div className="mt-3 p-3 bg-yellow-50 rounded border border-yellow-200">
                            <p className="text-sm font-medium text-yellow-800">Review Comments:</p>
                            <p className="text-sm text-yellow-700 mt-1">{application.reviewComments}</p>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default LeaveManagement;