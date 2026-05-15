import React, { useState, useEffect } from 'react';
import axiosInstance from '../axiosInstance';
import { FaWhatsapp, FaEnvelope, FaPhone, FaCalendarAlt, FaFilter, FaDownload, FaChartLine, FaEye, FaCheckCircle, FaClock, FaUserPlus, FaSpinner } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import InternalNavbar from './InternalNavbar';

const LeadDashboard = () => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLead, setSelectedLead] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    new: 0,
    contacted: 0,
    converted: 0
  });

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/leads');
      const leadsData = response.data.leads;
      setLeads(leadsData);
      
      // Calculate stats
      setStats({
        total: leadsData.length,
        new: leadsData.filter(l => l.status === 'new').length,
        contacted: leadsData.filter(l => l.status === 'contacted').length,
        converted: leadsData.filter(l => l.status === 'converted').length
      });
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateLeadStatus = async (id, status) => {
    try {
      await axiosInstance.put(`/leads/${id}/status`, { status });
      fetchLeads();
    } catch (error) {
      console.error('Error updating lead:', error);
    }
  };

  const exportToCSV = () => {
    const csv = leads.map(lead => 
      `${lead.name},${lead.email},${lead.phone},${lead.message},${lead.status},${new Date(lead.createdAt).toLocaleString()}`
    ).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads_${new Date().toISOString()}.csv`;
    a.click();
  };

  const filteredLeads = leads.filter(lead => {
    if (filter !== 'all' && lead.status !== filter) return false;
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return lead.name?.toLowerCase().includes(search) ||
             lead.email?.toLowerCase().includes(search) ||
             lead.phone?.includes(search) ||
             lead.message?.toLowerCase().includes(search);
    }
    return true;
  });

  const getStatusColor = (status) => {
    switch(status) {
      case 'new': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'contacted': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'converted': return 'bg-green-100 text-green-800 border-green-200';
      case 'lost': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'new': return <FaClock className="w-3 h-3" />;
      case 'contacted': return <FaEye className="w-3 h-3" />;
      case 'converted': return <FaCheckCircle className="w-3 h-3" />;
      default: return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <FaSpinner className="w-12 h-12 text-green-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading leads...</p>
        </div>
      </div>
    );
  }

  return (
     <>
    <InternalNavbar />
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header Section */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
                WhatsApp Lead Manager
              </h1>
              <p className="text-gray-500 text-sm mt-1">Track and manage all your WhatsApp inquiries</p>
            </div>
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition shadow-md hover:shadow-lg"
            >
              <FaDownload className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-blue-500"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Leads</p>
                <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
              </div>
              <FaUserPlus className="w-8 h-8 text-blue-500 opacity-50" />
            </div>
          </motion.div>
          
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-yellow-500"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">New</p>
                <p className="text-2xl font-bold text-gray-800">{stats.new}</p>
              </div>
              <FaClock className="w-8 h-8 text-yellow-500 opacity-50" />
            </div>
          </motion.div>
          
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-blue-400"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Contacted</p>
                <p className="text-2xl font-bold text-gray-800">{stats.contacted}</p>
              </div>
              <FaEye className="w-8 h-8 text-blue-400 opacity-50" />
            </div>
          </motion.div>
          
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-green-500"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Converted</p>
                <p className="text-2xl font-bold text-gray-800">{stats.converted}</p>
              </div>
              <FaChartLine className="w-8 h-8 text-green-500 opacity-50" />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search Bar */}
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by name, email, phone, or message..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            
            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-2">
              <button 
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  filter === 'all' 
                    ? 'bg-green-600 text-white shadow-md' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All ({stats.total})
              </button>
              <button 
                onClick={() => setFilter('new')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  filter === 'new' 
                    ? 'bg-yellow-500 text-white shadow-md' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                New ({stats.new})
              </button>
              <button 
                onClick={() => setFilter('contacted')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  filter === 'contacted' 
                    ? 'bg-blue-500 text-white shadow-md' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Contacted ({stats.contacted})
              </button>
              <button 
                onClick={() => setFilter('converted')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  filter === 'converted' 
                    ? 'bg-green-500 text-white shadow-md' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Converted ({stats.converted})
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Leads Cards (Mobile) & Table (Desktop) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Mobile Card View */}
        <div className="block lg:hidden space-y-4">
          <AnimatePresence>
            {filteredLeads.map((lead) => (
              <motion.div
                key={lead._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{lead.name}</h3>
                    <p className="text-sm text-gray-500">{lead.email}</p>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(lead.status)}`}>
                    {getStatusIcon(lead.status)}
                    {lead.status}
                  </span>
                </div>
                
                <div className="space-y-2 mb-3">
                  <div className="flex items-center gap-2 text-sm">
                    <FaPhone className="w-4 h-4 text-green-600" />
                    <a href={`tel:${lead.phone}`} className="text-gray-700 hover:text-green-600">
                      {lead.phone}
                    </a>
                  </div>
                  <div className="text-sm text-gray-600">
                    <p className="line-clamp-2">{lead.message}</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <FaCalendarAlt className="w-3 h-3" />
                    {new Date(lead.createdAt).toLocaleString()}
                  </div>
                </div>
                
                <div className="flex gap-2 pt-3 border-t border-gray-100">
                  <select
                    value={lead.status}
                    onChange={(e) => updateLeadStatus(lead._id, e.target.value)}
                    className="flex-1 text-sm rounded-lg border-gray-200 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="converted">Converted</option>
                    <option value="lost">Lost</option>
                  </select>
                  <a
                    href={`https://wa.me/${lead.phone}?text=${encodeURIComponent("Hi! Thanks for your interest. How can I help you today?")}`}
                    target="_blank"
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition"
                  >
                    <FaWhatsapp className="w-4 h-4" />
                    Chat
                  </a>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Desktop Table View */}
        <div className="hidden lg:block bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Message</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <AnimatePresence>
                  {filteredLeads.map((lead, index) => (
                    <motion.tr 
                      key={lead._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-gray-50 transition"
                    >
                      <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                        {new Date(lead.createdAt).toLocaleDateString()}
                        <div className="text-xs text-gray-400">
                          {new Date(lead.createdAt).toLocaleTimeString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{lead.name}</div>
                        <div className="text-sm text-gray-500">{lead.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <a 
                          href={`tel:${lead.phone}`}
                          className="text-sm text-gray-900 hover:text-green-600 flex items-center gap-1"
                        >
                          <FaPhone className="w-3 h-3" />
                          {lead.phone}
                        </a>
                        <a 
                          href={`https://wa.me/${lead.phone}`}
                          target="_blank"
                          className="text-xs text-green-600 hover:text-green-700 flex items-center gap-1 mt-1"
                        >
                          <FaWhatsapp className="w-3 h-3" />
                          WhatsApp
                        </a>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600 max-w-md truncate" title={lead.message}>
                          {lead.message}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={lead.status}
                          onChange={(e) => updateLeadStatus(lead._id, e.target.value)}
                          className={`text-sm rounded-full px-3 py-1 font-semibold border cursor-pointer ${getStatusColor(lead.status)}`}
                        >
                          <option value="new">🟡 New</option>
                          <option value="contacted">🔵 Contacted</option>
                          <option value="converted">🟢 Converted</option>
                          <option value="lost">🔴 Lost</option>
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        <a
                          href={`https://wa.me/${lead.phone}?text=${encodeURIComponent("Hi! Thanks for your interest. How can I help you today?")}`}
                          target="_blank"
                          className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition shadow-sm"
                        >
                          <FaWhatsapp className="w-4 h-4" />
                          Chat
                        </a>
                      </td>
                     </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>

        {/* Empty State */}
        {filteredLeads.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No leads found</h3>
            <p className="text-gray-500">No leads match your current filter or search criteria.</p>
          </div>
        )}

        {/* Results Count */}
        {filteredLeads.length > 0 && (
          <div className="mt-4 text-center text-sm text-gray-500">
            Showing {filteredLeads.length} of {leads.length} leads
          </div>
        )}
      </div>
    </div>
    </>
  );
};

export default LeadDashboard;