import React, { useState, useEffect } from 'react';
import axiosInstance from "../axiosInstance";
import { useNavigate } from "react-router-dom";
import InternalNavbar from "../components/InternalNavbar";
import toast from "react-hot-toast";
import { format } from 'date-fns';
import { Search, Filter, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

export default function CampaignsList() {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalCampaigns: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false
  });
  const [filters, setFilters] = useState({
    search: '',
    type: 'all',
    status: 'all'
  });
  const [showFilters, setShowFilters] = useState(false);
  
  useEffect(() => {
    fetchCampaigns();
  }, [pagination.page, filters]);
  
  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        ...(filters.search && { search: filters.search }),
        ...(filters.type !== 'all' && { type: filters.type }),
        ...(filters.status !== 'all' && { status: filters.status })
      });
      
      const res = await axiosInstance.get(`/campaigns?${params}`);
      setCampaigns(res.data.campaigns || []);
      setPagination(res.data.pagination || pagination);
    } catch (err) {
      toast.error("Failed to load campaigns");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  const getStatusColor = (status) => {
    switch(status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'processing': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'restricted': return 'bg-orange-100 text-orange-800';
      case 'partially_queued': return 'bg-purple-100 text-purple-800';
      case 'completed_with_restrictions': return 'bg-amber-100 text-amber-800';
      case 'all_restricted': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getStatusText = (status) => {
    const statusMap = {
      'scheduled': 'Scheduled',
      'processing': 'Processing',
      'completed': 'Completed',
      'failed': 'Failed',
      'restricted': 'Restricted',
      'partially_queued': 'Partially Queued',
      'completed_with_restrictions': 'Completed with Restrictions',
      'all_restricted': 'All Restricted',
      'completed_with_issues': 'Completed with Issues'
    };
    return statusMap[status] || status;
  };
  
  const getTypeIcon = (type) => {
    switch(type) {
      case 'whatsapp': return '💬';
      case 'email': return '✉️';
      case 'both': return '📢';
      default: return '📢';
    }
  };
  
  const getTypeText = (type) => {
    const typeMap = {
      'whatsapp': 'WhatsApp',
      'email': 'Email',
      'both': 'Both'
    };
    return typeMap[type] || type;
  };
  
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this campaign?")) return;
    
    try {
      await axiosInstance.delete(`/campaigns/${id}`);
      toast.success("Campaign deleted");
      fetchCampaigns();
    } catch (err) {
      toast.error("Failed to delete campaign");
    }
  };
  
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, page: newPage }));
    }
  };
  
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to page 1 when filters change
  };
  
  const handleSearch = (e) => {
    e.preventDefault();
    fetchCampaigns();
  };
  
  const clearFilters = () => {
    setFilters({
      search: '',
      type: 'all',
      status: 'all'
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };
  
  const getMediaInfo = (campaign) => {
    if (campaign.multiMediaEnabled && campaign.mediaUrls && campaign.mediaUrls.length > 0) {
      return `${campaign.mediaUrls.length} files`;
    } else if (campaign.mediaUrl) {
      return `1 ${campaign.mediaType || 'file'}`;
    }
    return 'No media';
  };
  
  if (loading && campaigns.length === 0) {
    return (
      <>
        <InternalNavbar />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </>
    );
  }
  
  return (
    <>
      <InternalNavbar />
      
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">📢 Campaigns</h1>
            <p className="text-gray-600 text-sm mt-1">
              Total: {pagination.totalCampaigns} campaigns • Page {pagination.page} of {pagination.totalPages}
            </p>
          </div>
          
          <div className="flex flex-col gap-2 sm:flex-row">
  {/* WhatsApp Button */}
  <div className="flex-1">
    <button
      onClick={() => navigate('/campaigns/new/whatsapp')}
      className="w-full bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 active:bg-green-800 flex items-center justify-center gap-2 transition-colors"
    >
      <span className="text-xl">💬</span>
      <span className="flex flex-col items-start">
        <span className="text-sm font-medium">WhatsApp Campaign</span>
      </span>
    </button>
  </div>
  
  {/* Email Button */}
  <div className="flex-1">
    <button
      onClick={() => navigate('/campaigns/new/email')}
      className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 active:bg-blue-800 flex items-center justify-center gap-2 transition-colors"
    >
      <span className="text-xl">✉️</span>
      <span className="flex flex-col items-start">
        <span className="text-sm font-medium">Email Campaign</span>
      </span>
    </button>
  </div>
</div>
        </div>
        
        {/* Search and Filters */}
        <div className="bg-white rounded-xl border p-4 mb-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            {/* Search */}
            <form onSubmit={handleSearch} className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  placeholder="Search campaigns..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </form>
            
            {/* Filter Toggle for Mobile */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="md:hidden flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Filter className="w-4 h-4" />
              Filters
            </button>
          </div>
          
          {/* Filters (Collapsible on mobile) */}
          <div className={`mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 ${showFilters ? 'block' : 'hidden md:grid'}`}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Types</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="email">Email</option>
                <option value="both">Both</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="scheduled">Scheduled</option>
                <option value="processing">Processing</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
                <option value="restricted">Restricted</option>
              </select>
            </div>
            
            <div className="flex items-end gap-2">
              <button
                onClick={clearFilters}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Clear Filters
              </button>
              {/* <button
                onClick={fetchCampaigns}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Apply
              </button> */}
            </div>
          </div>
        </div>
        
        {/* Campaigns Table/Grid */}
        {campaigns.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border">
            <p className="text-gray-500 mb-4">No campaigns found</p>
            <button
              onClick={() => navigate('/campaigns/new/whatsapp')}
              className="bg-green-600 text-white px-4 py-2 rounded-lg shadow hover:bg-green-700"
            >
              Create Your First Campaign
            </button>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden lg:block bg-white rounded-xl border overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="p-4 text-left text-sm font-medium text-gray-700">Campaign</th>
                      <th className="p-4 text-left text-sm font-medium text-gray-700">Type</th>
                      <th className="p-4 text-left text-sm font-medium text-gray-700">Scheduled</th>
                      <th className="p-4 text-left text-sm font-medium text-gray-700">Status</th>
                      <th className="p-4 text-left text-sm font-medium text-gray-700">Recipients</th>
                      <th className="p-4 text-left text-sm font-medium text-gray-700">Media</th>
                      <th className="p-4 text-left text-sm font-medium text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {campaigns.map(campaign => (
                      <tr key={campaign._id} className="hover:bg-gray-50 transition-colors">
                        <td className="p-4">
                          <div>
                            <p className="font-medium text-gray-900">{campaign.title}</p>
                            <p className="text-sm text-gray-500 truncate max-w-xs">
                              {campaign.message?.substring(0, 60)}...
                            </p>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="flex items-center gap-2">
                            <span className="text-lg">{getTypeIcon(campaign.type)}</span>
                            <span className="font-medium">{getTypeText(campaign.type)}</span>
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="text-sm">
                            <p className="font-medium">{format(new Date(campaign.scheduledAt), 'dd/MM/yyyy')}</p>
                            <p className="text-gray-500">{format(new Date(campaign.scheduledAt), 'HH:mm')}</p>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(campaign.status)}`}>
                            {getStatusText(campaign.status)}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="text-sm">
                            <div className="flex gap-2 mb-1">
                              <span className="text-green-600 font-medium">✓ {campaign.stats?.sent || 0}</span>
                              <span className="text-red-600 font-medium">✗ {campaign.stats?.failed || 0}</span>
                              <span className="text-gray-600 font-medium">⏳ {campaign.stats?.pending || 0}</span>
                            </div>
                            <p className="text-gray-500">Total: {campaign.stats?.totalRecipients || 0}</p>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="text-sm text-gray-600">
                            {getMediaInfo(campaign)}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex gap-3">
                            <button
                              onClick={() => navigate(`/campaigns/${campaign._id}`)}
                              className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                            >
                              View
                            </button>
                            {campaign.status === 'scheduled' && (
                              <button
                                onClick={() => handleDelete(campaign._id)}
                                className="text-red-600 hover:text-red-800 font-medium text-sm"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Mobile/Tablet Cards */}
            <div className="lg:hidden space-y-4">
              {campaigns.map(campaign => (
                <div key={campaign._id} className="bg-white rounded-xl border p-4 shadow-sm">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 text-lg">{campaign.title}</h3>
                      <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                        {campaign.message || 'No message'}
                      </p>
                    </div>
                    <span className={`ml-2 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(campaign.status)}`}>
                      {getStatusText(campaign.status)}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                    <div>
                      <p className="text-gray-500">Type</p>
                      <p className="font-medium flex items-center gap-1">
                        {getTypeIcon(campaign.type)} {getTypeText(campaign.type)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Scheduled</p>
                      <p className="font-medium">
                        {format(new Date(campaign.scheduledAt), 'dd/MM/yyyy HH:mm')}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Recipients</p>
                      <p className="font-medium">
                        {campaign.stats?.totalRecipients || 0} total
                      </p>
                      <div className="flex gap-2 text-xs mt-1">
                        <span className="text-green-600">✓ {campaign.stats?.sent || 0}</span>
                        <span className="text-red-600">✗ {campaign.stats?.failed || 0}</span>
                        <span className="text-gray-600">⏳ {campaign.stats?.pending || 0}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-gray-500">Media</p>
                      <p className="font-medium">
                        {getMediaInfo(campaign)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center pt-4 border-t">
                    <div className="text-sm text-gray-500">
                      Created by: {campaign.createdBy?.name || 'Unknown'}
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => navigate(`/campaigns/${campaign._id}`)}
                        className="px-4 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                      >
                        View
                      </button>
                      {campaign.status === 'scheduled' && (
                        <button
                          onClick={() => handleDelete(campaign._id)}
                          className="px-4 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
        
        {/* Pagination */}
{pagination.totalPages > 1 && (
  <div className="mt-6 bg-white rounded-xl border p-4 shadow-sm">
    <div className="flex flex-col gap-4">
      {/* Top Row: Info and Page Size */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="text-sm text-gray-600 text-center sm:text-left">
          Showing <span className="font-medium">{((pagination.page - 1) * pagination.limit) + 1}</span> to{' '}
          <span className="font-medium">{Math.min(pagination.page * pagination.limit, pagination.totalCampaigns)}</span> of{' '}
          <span className="font-medium">{pagination.totalCampaigns}</span> campaigns
        </div>
        
        {/* Page size selector - Mobile full width, Desktop inline */}
        <div className="w-full sm:w-auto">
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <span className="text-sm text-gray-600 whitespace-nowrap">Show per page:</span>
            <select
              value={pagination.limit}
              onChange={(e) => setPagination(prev => ({ ...prev, limit: parseInt(e.target.value), page: 1 }))}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Bottom Row: Pagination Controls */}
      <div className="flex flex-col xs:flex-row items-center justify-between gap-3">
        {/* Page Info */}
        <div className="text-sm text-gray-600">
          Page <span className="font-medium">{pagination.page}</span> of{' '}
          <span className="font-medium">{pagination.totalPages}</span>
        </div>
        
        {/* Pagination Buttons */}
        <div className="flex items-center justify-center w-full xs:w-auto">
          <div className="flex items-center gap-1">
            {/* First Page - Mobile hidden, Tablet+ visible */}
            <button
              onClick={() => handlePageChange(1)}
              disabled={!pagination.hasPrevPage}
              className="hidden sm:inline-flex p-2 rounded-lg border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              aria-label="First page"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>
            
            {/* Previous Page */}
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={!pagination.hasPrevPage}
              className="p-2 rounded-lg border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            {/* Page Numbers - Responsive display */}
            <div className="flex items-center gap-1 mx-1">
              {/* Always show page 1 */}
              {pagination.page > 3 && pagination.totalPages > 5 && (
                <>
                  <button
                    onClick={() => handlePageChange(1)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium border hover:bg-gray-50 transition-colors ${
                      pagination.page === 1 ? 'bg-blue-600 text-white border-blue-600' : ''
                    }`}
                  >
                    1
                  </button>
                  {pagination.page > 4 && <span className="px-1 text-gray-400">...</span>}
                </>
              )}
              
              {/* Dynamic page numbers */}
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                let pageNum;
                if (pagination.totalPages <= 5) {
                  pageNum = i + 1;
                } else if (pagination.page <= 3) {
                  pageNum = i + 1;
                } else if (pagination.page >= pagination.totalPages - 2) {
                  pageNum = pagination.totalPages - 4 + i;
                } else {
                  pageNum = pagination.page - 2 + i;
                }
                
                // Hide on very small screens if not current or adjacent
                const isVisibleOnMobile = 
                  pageNum === pagination.page || 
                  Math.abs(pageNum - pagination.page) <= 1 ||
                  pageNum === 1 || 
                  pageNum === pagination.totalPages;
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`hidden xs:inline-flex w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                      pagination.page === pageNum
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border hover:bg-gray-50'
                    } ${!isVisibleOnMobile ? 'hidden sm:inline-flex' : ''}`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              
              {/* Mobile current page display */}
              <div className="xs:hidden flex items-center gap-2 mx-2">
                <span className="text-sm text-gray-600">Page</span>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  {pagination.page}
                </span>
                <span className="text-sm text-gray-600">of {pagination.totalPages}</span>
              </div>
              
              {/* Last page indicator */}
              {pagination.totalPages > 5 && pagination.page < pagination.totalPages - 2 && (
                <>
                  {pagination.page < pagination.totalPages - 3 && (
                    <span className="hidden sm:inline px-1 text-gray-400">...</span>
                  )}
                  <button
                    onClick={() => handlePageChange(pagination.totalPages)}
                    className={`hidden sm:inline-flex w-8 h-8 rounded-lg text-sm font-medium border hover:bg-gray-50 transition-colors ${
                      pagination.page === pagination.totalPages ? 'bg-blue-600 text-white border-blue-600' : ''
                    }`}
                  >
                    {pagination.totalPages}
                  </button>
                </>
              )}
            </div>
            
            {/* Next Page */}
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={!pagination.hasNextPage}
              className="p-2 rounded-lg border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            
            {/* Last Page - Mobile hidden, Tablet+ visible */}
            <button
              onClick={() => handlePageChange(pagination.totalPages)}
              disabled={!pagination.hasNextPage}
              className="hidden sm:inline-flex p-2 rounded-lg border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              aria-label="Last page"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* Quick Jump for Desktop */}
        <div className="hidden md:flex items-center gap-2">
          <span className="text-sm text-gray-600 whitespace-nowrap">Go to:</span>
          <div className="relative">
            <input
              type="number"
              min="1"
              max={pagination.totalPages}
              defaultValue={pagination.page}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const page = parseInt(e.target.value);
                  if (page >= 1 && page <= pagination.totalPages) {
                    handlePageChange(page);
                    e.target.value = '';
                  }
                }
              }}
              className="w-16 px-2 py-1 border border-gray-300 rounded text-sm text-center"
              placeholder="Page"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
)}
      </div>
    </>
  );
}