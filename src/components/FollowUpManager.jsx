import React, { useState, useEffect } from 'react';
import axiosInstance from '../axiosInstance';
import toast from 'react-hot-toast';
import { useUserContext } from '../context/UserContext';

export default function FollowUpManager({ customerId, customerName }) {
  const { user } = useUserContext();
  const [followUps, setFollowUps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    status: 'pending',
    notes: '',
    nextFollowUpDate: ''
  });
  const [editingId, setEditingId] = useState(null);

  const fetchFollowUps = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get(`/potential-customers/${customerId}/follow-ups`);
      setFollowUps(res.data.followUps || []);
    } catch (err) {
      console.error('Failed to fetch follow-ups:', err);
      toast.error('Failed to load follow-ups');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (customerId) {
      fetchFollowUps();
    }
  }, [customerId]);

  const handleAddFollowUp = async () => {
    if (!formData.status) {
      toast.error('Status is required');
      return;
    }

    try {
      setLoading(true);
      const res = await axiosInstance.post(`/potential-customers/${customerId}/follow-up`, formData);
      
      if (res.data.success) {
        toast.success('Follow-up added successfully');
        setFormData({ status: 'pending', notes: '', nextFollowUpDate: '' });
        setShowForm(false);
        fetchFollowUps();
      }
    } catch (err) {
      console.error('Failed to add follow-up:', err);
      toast.error(err.response?.data?.error || 'Failed to add follow-up');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateFollowUp = async (followUpId) => {
    if (!formData.status) {
      toast.error('Status is required');
      return;
    }

    try {
      setLoading(true);
      const res = await axiosInstance.put(`/potential-customers/${customerId}/follow-up/${followUpId}`, formData);
      
      if (res.data.success) {
        toast.success('Follow-up updated successfully');
        setFormData({ status: 'pending', notes: '', nextFollowUpDate: '' });
        setEditingId(null);
        fetchFollowUps();
      }
    } catch (err) {
      console.error('Failed to update follow-up:', err);
      toast.error(err.response?.data?.error || 'Failed to update follow-up');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFollowUp = async (followUpId) => {
    if (!window.confirm('Are you sure you want to delete this follow-up?')) return;

    try {
      setLoading(true);
      const res = await axiosInstance.delete(`/potential-customers/${customerId}/follow-up/${followUpId}`);
      
      if (res.data.success) {
        toast.success('Follow-up deleted successfully');
        fetchFollowUps();
      }
    } catch (err) {
      console.error('Failed to delete follow-up:', err);
      toast.error('Failed to delete follow-up');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-300';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-300';
      case 'rescheduled': return 'bg-purple-100 text-purple-800 border-purple-300';
      default: return 'bg-gray-100 text-gray-600 border-gray-300';
    }
  };

  const getStatusLabel = (status) => {
    switch(status) {
      case 'completed': return '✅ Completed';
      case 'pending': return '⏳ Pending';
      case 'cancelled': return '❌ Cancelled';
      case 'rescheduled': return '🔄 Rescheduled';
      default: return '—';
    }
  };

  const startEdit = (followUp) => {
    setFormData({
      status: followUp.status,
      notes: followUp.notes || '',
      nextFollowUpDate: followUp.nextFollowUpDate ? new Date(followUp.nextFollowUpDate).toISOString().split('T')[0] : ''
    });
    setEditingId(followUp._id);
    setShowForm(true);
  };

  const cancelForm = () => {
    setFormData({ status: 'pending', notes: '', nextFollowUpDate: '' });
    setEditingId(null);
    setShowForm(false);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">
          Follow-ups for {customerName || 'Customer'}
        </h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-3 py-1.5 rounded-md hover:bg-blue-700 text-sm"
        >
          {showForm ? '✕ Cancel' : '➕ Add Follow-up'}
        </button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-gray-50 p-4 rounded-lg mb-4 border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="pending">⏳ Pending</option>
                <option value="completed">✅ Completed</option>
                <option value="cancelled">❌ Cancelled</option>
                <option value="rescheduled">🔄 Rescheduled</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Next Follow-up Date</label>
              <input
                type="date"
                value={formData.nextFollowUpDate}
                onChange={(e) => setFormData({ ...formData, nextFollowUpDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes / Remarks</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Enter follow-up notes..."
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => {
                if (editingId) {
                  handleUpdateFollowUp(editingId);
                } else {
                  handleAddFollowUp();
                }
              }}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : (editingId ? 'Update' : 'Save')}
            </button>
            <button
              onClick={cancelForm}
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Follow-ups List */}
      {loading && !showForm ? (
        <div className="text-center py-4">Loading...</div>
      ) : followUps.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No follow-ups recorded yet. Click "Add Follow-up" to get started.
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {followUps.map((followUp) => (
            <div key={followUp._id} className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={`px-2 py-0.5 text-xs rounded-full border ${getStatusColor(followUp.status)}`}>
                      {getStatusLabel(followUp.status)}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(followUp.date).toLocaleDateString()} at {new Date(followUp.date).toLocaleTimeString()}
                    </span>
                    {followUp.addedBy && (
                      <span className="text-xs text-gray-500">
                        by {followUp.addedBy.name}
                      </span>
                    )}
                  </div>
                  {followUp.notes && (
                    <p className="text-sm text-gray-700 mt-1">{followUp.notes}</p>
                  )}
                  {followUp.nextFollowUpDate && (
                    <p className="text-xs text-blue-600 mt-1">
                      Next follow-up: {new Date(followUp.nextFollowUpDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <div className="flex gap-1 ml-2">
                  <button
                    onClick={() => startEdit(followUp)}
                    className="text-blue-600 hover:text-blue-800 text-sm px-2 py-1"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDeleteFollowUp(followUp._id)}
                    className="text-red-600 hover:text-red-800 text-sm px-2 py-1"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}