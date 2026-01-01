import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from "../axiosInstance";
import InternalNavbar from "../components/InternalNavbar";
import toast from "react-hot-toast";
import { format } from 'date-fns';
import { Search, ChevronLeft, ChevronRight, Filter, Download, RefreshCw } from 'lucide-react';

export default function CampaignDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showRestricted, setShowRestricted] = useState(false);
  
  // Recipients pagination state
  const [recipients, setRecipients] = useState([]);
  const [recipientsLoading, setRecipientsLoading] = useState(false);
  const [recipientsPagination, setRecipientsPagination] = useState({
    page: 1,
    limit: 20,
    totalRecipients: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false
  });
  const [recipientFilters, setRecipientFilters] = useState({
    status: 'all',
    search: ''
  });
  const [statusCounts, setStatusCounts] = useState({
    all: 0,
    sent: 0,
    failed: 0,
    pending: 0,
    skipped: 0,
    restricted: 0,
    queued: 0
  });
  const [exportingRecipients, setExportingRecipients] = useState(false);

  useEffect(() => {
    fetchCampaignDetails();
  }, [id]);

  useEffect(() => {
    if (activeTab === 'recipients' && campaign) {
      fetchRecipients();
    }
  }, [activeTab, recipientsPagination.page, recipientFilters]);

  const fetchCampaignDetails = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/campaigns/${id}`);
      setCampaign(res.data.campaign);
    } catch (err) {
      toast.error("Failed to load campaign details");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecipients = async () => {
    setRecipientsLoading(true);
    try {
      const params = new URLSearchParams({
        page: recipientsPagination.page,
        limit: recipientsPagination.limit,
        ...(recipientFilters.status !== 'all' && { status: recipientFilters.status }),
        ...(recipientFilters.search && { search: recipientFilters.search })
      });
      
      const res = await axiosInstance.get(`/campaigns/${id}/recipients?${params}`);
      setRecipients(res.data.recipients || []);
      setRecipientsPagination(res.data.pagination || recipientsPagination);
      setStatusCounts(res.data.statusCounts || statusCounts);
    } catch (err) {
      toast.error("Failed to load recipients");
      console.error(err);
    } finally {
      setRecipientsLoading(false);
    }
  };

  const handleRecipientPageChange = (newPage) => {
    if (newPage >= 1 && newPage <= recipientsPagination.totalPages) {
      setRecipientsPagination(prev => ({ ...prev, page: newPage }));
    }
  };

  const handleRecipientFilterChange = (key, value) => {
    setRecipientFilters(prev => ({ ...prev, [key]: value }));
    setRecipientsPagination(prev => ({ ...prev, page: 1 }));
  };

  const clearRecipientFilters = () => {
    setRecipientFilters({
      status: 'all',
      search: ''
    });
    setRecipientsPagination(prev => ({ ...prev, page: 1 }));
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

  const getRecipientStatusColor = (status) => {
    switch(status) {
      case 'sent': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'skipped': return 'bg-gray-100 text-gray-800';
      case 'restricted': return 'bg-orange-100 text-orange-800';
      case 'queued': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type) => {
    switch(type) {
      case 'whatsapp': return '💬';
      case 'email': return '✉️';
      case 'both': return '📢';
      default: return '📢';
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this campaign?")) return;
    
    try {
      await axiosInstance.delete(`/campaigns/${id}`);
      toast.success("Campaign deleted successfully");
      navigate("/campaigns");
    } catch (err) {
      toast.error("Failed to delete campaign");
    }
  };

  const exportRecipientsToCSV = async () => {
    setExportingRecipients(true);
    try {
      const response = await axiosInstance.get(`/campaigns/${id}/recipients/export`, {
        params: recipientFilters,
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `campaign-${campaign.title}-recipients-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success("Recipients exported successfully");
    } catch (err) {
      toast.error("Failed to export recipients");
      console.error(err);
    } finally {
      setExportingRecipients(false);
    }
  };

  const refreshCampaign = async () => {
    await fetchCampaignDetails();
    if (activeTab === 'recipients') {
      await fetchRecipients();
    }
    toast.success("Campaign data refreshed");
  };

  if (loading) {
    return (
      <>
        <InternalNavbar />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </>
    );
  }

  if (!campaign) {
    return (
      <>
        <InternalNavbar />
        <div className="max-w-6xl mx-auto p-6">
          <div className="bg-white rounded-lg border p-8 text-center">
            <p className="text-gray-500 mb-4">Campaign not found</p>
            <button
              onClick={() => navigate('/campaigns')}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Back to Campaigns
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <InternalNavbar />
      
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
            <button
              onClick={() => navigate('/campaigns')}
              className="text-blue-600 hover:text-blue-800 flex items-center gap-2 self-start"
            >
              ↩️ Back to Campaigns
            </button>
            
            <div className="flex gap-2">
              <button
                onClick={refreshCampaign}
                className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded hover:bg-gray-50 text-sm"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
              {campaign.status === 'scheduled' && (
                <button
                  onClick={handleDelete}
                  className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 text-sm"
                >
                  Cancel Campaign
                </button>
              )}
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{campaign.title}</h1>
              <div className="flex flex-wrap items-center gap-2 md:gap-4 mt-2">
                <span className="flex items-center gap-1 text-gray-600">
                  {getTypeIcon(campaign.type)}
                  <span className="capitalize">{campaign.type} Campaign</span>
                </span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(campaign.status)}`}>
                  {campaign.status}
                </span>
                <span className="text-gray-500 text-sm">
                  Scheduled: {format(new Date(campaign.scheduledAt), 'dd/MM/yyyy HH:mm')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b mb-6">
          <nav className="flex space-x-4 overflow-x-auto">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-2 px-4 border-b-2 font-medium whitespace-nowrap ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('recipients')}
              className={`py-2 px-4 border-b-2 font-medium whitespace-nowrap ${
                activeTab === 'recipients'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Recipients ({campaign.stats?.totalRecipients || 0})
            </button>
            <button
              onClick={() => setActiveTab('filters')}
              className={`py-2 px-4 border-b-2 font-medium whitespace-nowrap ${
                activeTab === 'filters'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Filters
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg border p-4 md:p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
                <div className="bg-blue-50 p-3 md:p-4 rounded-lg border">
                  <p className="text-sm text-gray-600">Total Recipients</p>
                  <p className="text-xl md:text-2xl font-bold">{campaign.stats?.totalRecipients || 0}</p>
                </div>
                <div className="bg-green-50 p-3 md:p-4 rounded-lg border">
                  <p className="text-sm text-gray-600">Sent Successfully</p>
                  <p className="text-xl md:text-2xl font-bold text-green-600">{campaign.stats?.sent || 0}</p>
                </div>
                <div className="bg-red-50 p-3 md:p-4 rounded-lg border">
                  <p className="text-sm text-gray-600">Failed</p>
                  <p className="text-xl md:text-2xl font-bold text-red-600">{campaign.stats?.failed || 0}</p>
                </div>
                <div className="bg-orange-50 p-3 md:p-4 rounded-lg border">
                  <p className="text-sm text-gray-600">Restricted</p>
                  <p className="text-xl md:text-2xl font-bold text-orange-600">{campaign.stats?.restricted || 0}</p>
                </div>
                <div className="bg-yellow-50 p-3 md:p-4 rounded-lg border col-span-2 md:col-span-1">
                  <p className="text-sm text-gray-600">Media Files</p>
                  <p className="text-xl md:text-2xl font-bold text-yellow-600">
                    {campaign.multiMediaEnabled && campaign.mediaUrls ? 
                      campaign.mediaUrls.length : 
                      (campaign.mediaUrl ? 1 : 0)
                    }
                  </p>
                </div>
              </div>

              {/* Message Preview */}
              <div>
                <h3 className="font-medium text-gray-800 mb-2">Message Content</h3>
                <div className="bg-gray-50 p-4 rounded-lg border">
                  {campaign.message ? (
                    <div className="whitespace-pre-line">{campaign.message}</div>
                  ) : (
                    <p className="text-gray-500">No message text</p>
                  )}
                  
                  {/* Check for multiple media first */}
                  {campaign.multiMediaEnabled && campaign.mediaUrls && campaign.mediaUrls.length > 0 ? (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-gray-600 mb-2">
                        Media Attachments ({campaign.mediaUrls.length} files):
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mt-3">
                        {campaign.mediaUrls.map((mediaUrl, index) => {
                          const mediaType = campaign.mediaTypes?.[index] || 'document';
                          const caption = campaign.mediaCaptions?.[index] || '';
                          
                          return (
                            <div key={index} className="border rounded-lg p-2 bg-white">
                              {mediaType === 'image' ? (
                                <div className="relative">
                                  <img 
                                    src={mediaUrl} 
                                    alt={`Attachment ${index + 1}`}
                                    className="w-full h-32 object-cover rounded-lg"
                                    onError={(e) => {
                                      e.target.onerror = null;
                                      e.target.src = 'https://via.placeholder.com/150?text=Image+Not+Found';
                                    }}
                                  />
                                  <span className="absolute top-1 right-1 bg-black bg-opacity-50 text-white text-xs px-1 rounded">
                                    {index + 1}
                                  </span>
                                </div>
                              ) : mediaType === 'pdf' ? (
                                <div className="h-32 bg-red-50 flex flex-col items-center justify-center rounded-lg">
                                  <div className="text-3xl mb-2">📕</div>
                                  <div className="text-xs text-center px-2">
                                    PDF Document
                                  </div>
                                </div>
                              ) : mediaType === 'video' ? (
                                <div className="h-32 bg-blue-50 flex flex-col items-center justify-center rounded-lg">
                                  <div className="text-3xl mb-2">🎬</div>
                                  <div className="text-xs text-center px-2">
                                    Video File
                                  </div>
                                </div>
                              ) : (
                                <div className="h-32 bg-gray-50 flex flex-col items-center justify-center rounded-lg">
                                  <div className="text-3xl mb-2">📄</div>
                                  <div className="text-xs text-center px-2">
                                    Document
                                  </div>
                                </div>
                              )}
                              
                              <div className="mt-2">
                                <a
                                  href={mediaUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 text-sm truncate block"
                                  title={mediaUrl}
                                >
                                  {mediaType === 'image' ? 'View Image' : 
                                   mediaType === 'pdf' ? 'Download PDF' : 
                                   mediaType === 'video' ? 'Download Video' : 
                                   'Download File'} #{index + 1}
                                </a>
                                
                                {caption && (
                                  <p className="text-xs text-gray-500 mt-1 truncate" title={caption}>
                                    {caption}
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      
                      {/* Summary info */}
                      <div className="mt-3 text-sm text-gray-600">
                        <p>
                          <span className="font-medium">Campaign Type:</span> {campaign.type === 'whatsapp' ? 'WhatsApp' : 
                                                                               campaign.type === 'email' ? 'Email' : 'Both'}
                        </p>
                        {campaign.type === 'whatsapp' && (
                          <p className="mt-1">
                            <span className="font-medium">WhatsApp Status:</span> Files sent sequentially with {
                              campaign.mediaDelaySeconds || 3
                            } second delay between each
                          </p>
                        )}
                      </div>
                    </div>
                  ) : campaign.mediaUrl && campaign.mediaUrl.trim() !== '' ? (
                    // Single media attachment (backward compatibility)
                    <div className="mt-4">
                      <p className="text-sm font-medium text-gray-600 mb-2">Media Attachment:</p>
                      {campaign.mediaType === 'image' ? (
                        <div>
                          <img 
                            src={campaign.mediaUrl} 
                            alt="Campaign media" 
                            className="max-w-xs rounded-lg border"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = 'https://via.placeholder.com/150?text=Image+Not+Found';
                            }}
                          />
                          <a
                            href={campaign.mediaUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline text-sm mt-2 inline-block"
                          >
                            Open image in new tab
                          </a>
                        </div>
                      ) : campaign.mediaType === 'pdf' ? (
                        <a
                          href={campaign.mediaUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline inline-flex items-center gap-2"
                        >
                          <span className="text-xl">📕</span>
                          View PDF Document
                        </a>
                      ) : campaign.mediaType === 'video' ? (
                        <a
                          href={campaign.mediaUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline inline-flex items-center gap-2"
                        >
                          <span className="text-xl">🎬</span>
                          Download Video File
                        </a>
                      ) : (
                        <a
                          href={campaign.mediaUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline inline-flex items-center gap-2"
                        >
                          <span className="text-xl">📄</span>
                          Download {campaign.mediaType || 'Document'} File
                        </a>
                      )}
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Restricted Customers Info */}
              {campaign.stats?.restricted > 0 && (
                <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                      ⚠️
                    </div>
                    <div>
                      <h4 className="font-medium text-orange-800">WhatsApp Restrictions Detected</h4>
                      <p className="text-sm text-orange-600">
                        {campaign.stats.restricted} customers cannot receive messages because they haven't replied in 24+ hours.
                        They've been sent a re-engagement message asking them to reply "YES".
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => setShowRestricted(!showRestricted)}
                    className="text-sm text-orange-700 hover:text-orange-900 font-medium"
                  >
                    {showRestricted ? 'Hide' : 'Show'} Restricted Customers →
                  </button>
                  
                  {showRestricted && (
                    <div className="mt-4">
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                          <thead>
                            <tr className="bg-orange-100">
                              <th className="p-2 text-left">Customer</th>
                              <th className="p-2 text-left">Phone</th>
                              <th className="p-2 text-left">Status</th>
                              <th className="p-2 text-left">Action Required</th>
                            </tr>
                          </thead>
                          <tbody>
                            {recipients
                              .filter(r => r.status === 'restricted')
                              .slice(0, 10) // Show only first 10
                              .map((recipient, idx) => (
                                <tr key={idx} className="border-t">
                                  <td className="p-2">{recipient.customer?.name || 'Unknown'}</td>
                                  <td className="p-2">{recipient.customer?.phone || '-'}</td>
                                  <td className="p-2">
                                    <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs">
                                      Restricted
                                    </span>
                                  </td>
                                  <td className="p-2">
                                    <span className="text-sm text-orange-700">
                                      Ask customer to reply "YES" on WhatsApp
                                    </span>
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                      {campaign.stats.restricted > 10 && (
                        <p className="text-sm text-orange-600 mt-2">
                          Showing 10 of {campaign.stats.restricted} restricted customers. 
                          Use the Recipients tab to see all restricted recipients.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Campaign Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-800 mb-2">Campaign Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex">
                      <span className="w-32 text-gray-600">Created by:</span>
                      <span>{campaign.createdBy?.name || 'Unknown'}</span>
                    </div>
                    <div className="flex">
                      <span className="w-32 text-gray-600">Created at:</span>
                      <span>{format(new Date(campaign.createdAt), 'dd/MM/yyyy HH:mm')}</span>
                    </div>
                    <div className="flex">
                      <span className="w-32 text-gray-600">Timezone:</span>
                      <span>{campaign.timezone}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-800 mb-2">Delivery Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex">
                      <span className="w-32 text-gray-600">Scheduled for:</span>
                      <span>{format(new Date(campaign.scheduledAt), 'dd/MM/yyyy HH:mm')}</span>
                    </div>
                    <div className="flex">
                      <span className="w-32 text-gray-600">Started at:</span>
                      <span>{campaign.startedAt ? format(new Date(campaign.startedAt), 'dd/MM/yyyy HH:mm') : 'Not started'}</span>
                    </div>
                    <div className="flex">
                      <span className="w-32 text-gray-600">Completed at:</span>
                      <span>{campaign.completedAt ? format(new Date(campaign.completedAt), 'dd/MM/yyyy HH:mm') : 'Not completed'}</span>
                    </div>
                    <div className="flex">
                      <span className="w-32 text-gray-600">Status:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(campaign.status)}`}>
                        {campaign.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'recipients' && (
            <div>
              <div className="mb-4 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                <div>
                  <h3 className="font-medium text-gray-800">Recipient List</h3>
                  <div className="text-sm text-gray-600">
                    Total: {recipientsPagination.totalRecipients} recipients
                  </div>
                </div>
                
                <div className="flex flex-col md:flex-row gap-3">
                  {/* Recipient Filters */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    {/* Search */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        value={recipientFilters.search}
                        onChange={(e) => handleRecipientFilterChange('search', e.target.value)}
                        placeholder="Search recipients..."
                        className="pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm w-full md:w-64"
                      />
                    </div>
                    
                    {/* Status Filter */}
                    <div className="flex items-center gap-2">
                      <Filter className="text-gray-400 w-4 h-4" />
                      <select
                        value={recipientFilters.status}
                        onChange={(e) => handleRecipientFilterChange('status', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm w-full"
                      >
                        <option value="all">All Status ({statusCounts.all})</option>
                        <option value="sent">Sent ({statusCounts.sent})</option>
                        <option value="failed">Failed ({statusCounts.failed})</option>
                        <option value="pending">Pending ({statusCounts.pending})</option>
                        <option value="skipped">Skipped ({statusCounts.skipped})</option>
                        <option value="restricted">Restricted ({statusCounts.restricted})</option>
                        <option value="queued">Queued ({statusCounts.queued})</option>
                      </select>
                    </div>
                    
                    {recipientFilters.status !== 'all' || recipientFilters.search ? (
                      <button
                        onClick={clearRecipientFilters}
                        className="text-sm text-red-600 hover:text-red-800 whitespace-nowrap px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                      >
                        Clear Filters
                      </button>
                    ) : null}
                  </div>
                  
                  {/* Export Button */}
                  <button
                    onClick={exportRecipientsToCSV}
                    disabled={exportingRecipients || recipientsPagination.totalRecipients === 0}
                    className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    {exportingRecipients ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Exporting...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        Export CSV
                      </>
                    )}
                  </button>
                </div>
              </div>
              
              {recipientsLoading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : recipients.length > 0 ? (
                <>
                  <div className="overflow-x-auto border rounded-lg">
                    <table className="min-w-full text-sm">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="p-3 text-left font-medium text-gray-700">Customer</th>
                          <th className="p-3 text-left font-medium text-gray-700">Phone</th>
                          <th className="p-3 text-left font-medium text-gray-700">Email</th>
                          <th className="p-3 text-left font-medium text-gray-700">Status</th>
                          <th className="p-3 text-left font-medium text-gray-700">Sent At</th>
                          <th className="p-3 text-left font-medium text-gray-700">Error</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recipients.map((recipient, index) => (
                          <tr key={index} className="border-t hover:bg-gray-50">
                            <td className="p-3">
                              <div className="font-medium">{recipient.customer?.name || 'Unknown'}</div>
                              {recipient.customer?.salesCategory && (
                                <div className="text-xs text-gray-500 mt-1">
                                  {recipient.customer.salesCategory}
                                </div>
                              )}
                            </td>
                            <td className="p-3 font-mono">{recipient.customer?.phone || '-'}</td>
                            <td className="p-3">{recipient.customer?.email || '-'}</td>
                            <td className="p-3">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRecipientStatusColor(recipient.status)}`}>
                                {recipient.status}
                              </span>
                              {recipient.whatsappRestricted && (
                                <div className="text-xs text-orange-600 mt-1">WhatsApp Restricted</div>
                              )}
                            </td>
                            <td className="p-3">
                              {recipient.sentAt ? format(new Date(recipient.sentAt), 'dd/MM/yyyy HH:mm') : '-'}
                            </td>
                            <td className="p-3">
                              <span className="text-red-500 text-sm max-w-xs truncate inline-block" title={recipient.error}>
                                {recipient.error || '-'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* Pagination */}
                  {recipientsPagination.totalPages > 1 && (
                    <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="text-sm text-gray-600">
                        Showing {((recipientsPagination.page - 1) * recipientsPagination.limit) + 1} to{' '}
                        {Math.min(recipientsPagination.page * recipientsPagination.limit, recipientsPagination.totalRecipients)} of{' '}
                        {recipientsPagination.totalRecipients} recipients
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleRecipientPageChange(recipientsPagination.page - 1)}
                          disabled={!recipientsPagination.hasPrevPage}
                          className="p-2 rounded border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                          title="Previous page"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        
                        <div className="flex items-center gap-1">
                          {Array.from({ length: Math.min(5, recipientsPagination.totalPages) }, (_, i) => {
                            let pageNum;
                            if (recipientsPagination.totalPages <= 5) {
                              pageNum = i + 1;
                            } else if (recipientsPagination.page <= 3) {
                              pageNum = i + 1;
                            } else if (recipientsPagination.page >= recipientsPagination.totalPages - 2) {
                              pageNum = recipientsPagination.totalPages - 4 + i;
                            } else {
                              pageNum = recipientsPagination.page - 2 + i;
                            }
                            
                            return (
                              <button
                                key={pageNum}
                                onClick={() => handleRecipientPageChange(pageNum)}
                                className={`w-8 h-8 rounded text-sm font-medium transition-colors ${
                                  recipientsPagination.page === pageNum
                                    ? 'bg-blue-600 text-white'
                                    : 'border hover:bg-gray-50'
                                }`}
                              >
                                {pageNum}
                              </button>
                            );
                          })}
                        </div>
                        
                        <button
                          onClick={() => handleRecipientPageChange(recipientsPagination.page + 1)}
                          disabled={!recipientsPagination.hasNextPage}
                          className="p-2 rounded border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                          title="Next page"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className="text-sm text-gray-600">
                        Page {recipientsPagination.page} of {recipientsPagination.totalPages}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12 border rounded-lg bg-gray-50">
                  <div className="text-gray-400 mb-2">📭</div>
                  <p className="text-gray-500 mb-2">No recipients found</p>
                  {recipientFilters.status !== 'all' || recipientFilters.search ? (
                    <p className="text-sm text-gray-400">
                      Try changing your filters or search term
                    </p>
                  ) : (
                    <p className="text-sm text-gray-400">
                      This campaign has no recipients
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'filters' && (
            <div>
              <h3 className="font-medium text-gray-800 mb-4">Applied Filters</h3>
              
              {Object.keys(campaign.filters || {}).length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No filters applied (all customers)
                </div>
              ) : (
                <div className="space-y-4">
                  {campaign.filters.search && (
                    <div className="flex items-center gap-4">
                      <span className="w-32 text-gray-600 font-medium">Search:</span>
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                        {campaign.filters.search}
                      </span>
                    </div>
                  )}
                  
                  {campaign.filters.categories?.length > 0 && (
                    <div className="flex items-start gap-4">
                      <span className="w-32 text-gray-600 font-medium mt-1">Categories:</span>
                      <div className="flex flex-wrap gap-2">
                        {campaign.filters.categories.map((category, idx) => (
                          <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                            {category}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {campaign.filters.createdBy && (
                    <div className="flex items-center gap-4">
                      <span className="w-32 text-gray-600 font-medium">Sales Person:</span>
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                        {campaign.filters.createdBy}
                      </span>
                    </div>
                  )}
                  
                  {campaign.filters.giftType && (
                    <div className="flex items-center gap-4">
                      <span className="w-32 text-gray-600 font-medium">Gift Type:</span>
                      <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                        {campaign.filters.giftType === 'all_gifts' ? 'Has Any Diwali Gift' :
                         campaign.filters.giftType === 'no_gifts' ? 'No Diwali Gifts' :
                         campaign.filters.giftType}
                      </span>
                    </div>
                  )}
                  
                  {campaign.filters.product && (
                    <div className="flex items-center gap-4">
                      <span className="w-32 text-gray-600 font-medium">Product:</span>
                      <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm">
                        {campaign.filters.product}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}