// RawBlockStockReport.jsx
import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Plus, Trash2, Save, X, Calendar, Copy, Edit2, 
  Check, AlertCircle, Loader, ChevronLeft, ChevronRight, 
  Search, Filter, RefreshCw 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from "../axiosInstance";
import InternalNavbar from './InternalNavbar';

// Toast Component
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === 'success' ? 'bg-green-50 border-green-500' : 
                  type === 'error' ? 'bg-red-50 border-red-500' : 
                  'bg-yellow-50 border-yellow-500';
  const textColor = type === 'success' ? 'text-green-800' : 
                    type === 'error' ? 'text-red-800' : 
                    'text-yellow-800';
  const icon = type === 'success' ? <Check className="h-5 w-5 text-green-500" /> : 
               type === 'error' ? <AlertCircle className="h-5 w-5 text-red-500" /> : 
               <AlertCircle className="h-5 w-5 text-yellow-500" />;

  return (
    <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg border-l-4 shadow-lg ${bgColor} ${textColor} min-w-[300px] max-w-md animate-slide-in`}>
      {icon}
      <span className="flex-1 text-sm font-medium">{message}</span>
      <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

const RawBlockStockReport = () => {
  const navigate = useNavigate();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [newEntry, setNewEntry] = useState(null);
  const [showDateInput, setShowDateInput] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [copyFromDate, setCopyFromDate] = useState('');
  const [editingEntryId, setEditingEntryId] = useState(null);
  const [editingData, setEditingData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  // Pagination state
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 20,
    hasNext: false,
    hasPrev: false
  });
  
  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState({ start: '', end: '' });
  const [sortField, setSortField] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');

  // Column configuration
  const columns = [
    { key: 'whiteND16kg20kgs', label: 'White ND (16kg/m³) 20kgs' },
    { key: 'white8kg32kgs', label: 'White (8kg/m³) 32kgs' },
    { key: 'white10kg42kgs', label: 'White (10kg/m³) 42kgs' },
    { key: 'white12kg52kgs', label: 'White (12kg/m³) 52kgs' },
    { key: 'white14kg62kgs', label: 'White (14kg/m³) 62kgs' },
    { key: 'white16kg72kgs', label: 'White (16kg/m³) 72kgs' },
    { key: 'pink13_14kg55kgs', label: 'Pink (13-14kg/m³) 55kgs' },
    { key: 'pink15_16kg72kgs', label: 'Pink (15-16kg/m³) 72kgs' },
    { key: 'pink20kg92kgs', label: 'Pink (20kg/m³) 92kgs' },
    { key: 'whiteFR15_16kg65kgs', label: 'White FR (15-16kg/m³) 65kgs' },
    { key: 'patterns20kg92kgs', label: 'Patterns (20kg/m³) 92kgs' },
    { key: 'patterns24kg112kgs', label: 'Patterns (24kg/m³) 112kgs' }
  ];

  const rowTypes = [
    { key: 'stockInHand', label: 'Stock in Hand', color: 'text-blue-600' },
    { key: 'newProduction', label: 'New Production', color: 'text-green-600' },
    { key: 'totalUsed', label: 'Total Used', color: 'text-orange-600' },
    { key: 'totalBalance', label: 'Total Balance', color: 'text-teal-600' }
  ];

  // Date formatting functions
  const formatDateToDDMMYYYY = (dateString) => {
    if (!dateString) return '';
    // If already in DD-MM-YYYY format, return as is
    if (/^\d{2}-\d{2}-\d{4}$/.test(dateString)) {
      return dateString;
    }
    // If in DD/MM/YYYY format, convert to DD-MM-YYYY
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
      return dateString.replace(/\//g, '-');
    }
    // If in YYYY-MM-DD format (from date input), convert to DD-MM-YYYY
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      const parts = dateString.split('-');
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return dateString;
  };

  const formatDateForDisplay = (dateString) => {
    return formatDateToDDMMYYYY(dateString);
  };

  const formatDateForAPI = (dateString) => {
    // Convert DD-MM-YYYY to DD/MM/YYYY for API
    if (/^\d{2}-\d{2}-\d{4}$/.test(dateString)) {
      return dateString.replace(/-/g, '/');
    }
    return dateString;
  };

  const formatDateForInput = (dateString) => {
    // Convert DD-MM-YYYY to YYYY-MM-DD for date input
    if (/^\d{2}-\d{2}-\d{4}$/.test(dateString)) {
      const parts = dateString.split('-');
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    // Convert DD/MM/YYYY to YYYY-MM-DD for date input
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
      const parts = dateString.split('/');
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return dateString;
  };

  // Mock data for testing (using DD-MM-YYYY format)
  const mockData = [
    {
      _id: '1',
      date: '29-08-2026',
      whiteND16kg20kgs: { stockInHand: 10, newProduction: 5, totalUsed: 2, totalBalance: 13 },
      white8kg32kgs: { stockInHand: 8, newProduction: 3, totalUsed: 1, totalBalance: 10 },
      white10kg42kgs: { stockInHand: 12, newProduction: 4, totalUsed: 3, totalBalance: 13 },
      white12kg52kgs: { stockInHand: 6, newProduction: 2, totalUsed: 1, totalBalance: 7 },
      white14kg62kgs: { stockInHand: 15, newProduction: 6, totalUsed: 4, totalBalance: 17 },
      white16kg72kgs: { stockInHand: 9, newProduction: 3, totalUsed: 2, totalBalance: 10 },
      pink13_14kg55kgs: { stockInHand: 7, newProduction: 2, totalUsed: 1, totalBalance: 8 },
      pink15_16kg72kgs: { stockInHand: 11, newProduction: 4, totalUsed: 3, totalBalance: 12 },
      pink20kg92kgs: { stockInHand: 5, newProduction: 1, totalUsed: 0, totalBalance: 6 },
      whiteFR15_16kg65kgs: { stockInHand: 13, newProduction: 5, totalUsed: 2, totalBalance: 16 },
      patterns20kg92kgs: { stockInHand: 4, newProduction: 2, totalUsed: 1, totalBalance: 5 },
      patterns24kg112kgs: { stockInHand: 3, newProduction: 1, totalUsed: 0, totalBalance: 4 }
    },
    {
      _id: '2',
      date: '28-08-2026',
      whiteND16kg20kgs: { stockInHand: 8, newProduction: 3, totalUsed: 1, totalBalance: 10 },
      white8kg32kgs: { stockInHand: 5, newProduction: 2, totalUsed: 0, totalBalance: 7 },
      white10kg42kgs: { stockInHand: 10, newProduction: 4, totalUsed: 2, totalBalance: 12 },
      white12kg52kgs: { stockInHand: 4, newProduction: 1, totalUsed: 0, totalBalance: 5 },
      white14kg62kgs: { stockInHand: 12, newProduction: 5, totalUsed: 3, totalBalance: 14 },
      white16kg72kgs: { stockInHand: 7, newProduction: 2, totalUsed: 1, totalBalance: 8 },
      pink13_14kg55kgs: { stockInHand: 5, newProduction: 1, totalUsed: 0, totalBalance: 6 },
      pink15_16kg72kgs: { stockInHand: 9, newProduction: 3, totalUsed: 2, totalBalance: 10 },
      pink20kg92kgs: { stockInHand: 3, newProduction: 1, totalUsed: 0, totalBalance: 4 },
      whiteFR15_16kg65kgs: { stockInHand: 10, newProduction: 4, totalUsed: 1, totalBalance: 13 },
      patterns20kg92kgs: { stockInHand: 2, newProduction: 1, totalUsed: 0, totalBalance: 3 },
      patterns24kg112kgs: { stockInHand: 1, newProduction: 0, totalUsed: 0, totalBalance: 1 }
    }
  ];

  // Fetch entries on component mount
  useEffect(() => {
    fetchEntries();
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  // Validate and sanitize value - prevent negatives
  const sanitizeValue = (value) => {
    const num = Number(value);
    if (isNaN(num) || num < 0) return 0;
    return num;
  };

  // Sanitize entire entry - ensure no negative values
  const sanitizeEntry = (entry) => {
    const sanitized = { ...entry };
    columns.forEach(col => {
      if (sanitized[col.key]) {
        rowTypes.forEach(rowType => {
          if (sanitized[col.key][rowType.key] !== undefined) {
            sanitized[col.key][rowType.key] = Math.max(0, Number(sanitized[col.key][rowType.key]) || 0);
          }
        });
        // Recalculate balance
        const stock = sanitized[col.key].stockInHand || 0;
        const production = sanitized[col.key].newProduction || 0;
        const used = sanitized[col.key].totalUsed || 0;
        sanitized[col.key].totalBalance = Math.max(0, stock + production - used);
      }
    });
    return sanitized;
  };

  const fetchEntries = async (page = 1) => {
    setLoading(true);
    try {
      let url = `/raw-block-stock?page=${page}&limit=${pagination.itemsPerPage}`;
      
      // Add sorting
      url += `&sortField=${sortField}&sortOrder=${sortOrder}`;
      
      // Add search filter - search in DD-MM-YYYY format
      if (searchTerm.trim()) {
        // Convert search term to DD-MM-YYYY if it's in DD/MM/YYYY format
        let searchValue = searchTerm.trim();
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(searchValue)) {
          searchValue = searchValue.replace(/\//g, '-');
        }
        url += `&search=${encodeURIComponent(searchValue)}`;
      }
      
      // Add date range filter - convert to DD-MM-YYYY
      if (dateFilter.start && dateFilter.end) {
        const startDate = formatDateToDDMMYYYY(dateFilter.start);
        const endDate = formatDateToDDMMYYYY(dateFilter.end);
        url += `&startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`;
      }
      
      const response = await axiosInstance.get(url);
      const data = response.data?.data || [];
      const paginationData = response.data?.pagination || {};
      
      // Ensure all dates are in DD-MM-YYYY format
      const sanitizedData = data.map(entry => {
        const sanitized = sanitizeEntry(entry);
        sanitized.date = formatDateToDDMMYYYY(sanitized.date);
        return sanitized;
      });
      setEntries(Array.isArray(sanitizedData) ? sanitizedData : []);
      
      setPagination({
        currentPage: paginationData.currentPage || 1,
        totalPages: paginationData.totalPages || 1,
        totalItems: paginationData.totalItems || 0,
        itemsPerPage: paginationData.itemsPerPage || 20,
        hasNext: paginationData.hasNext || false,
        hasPrev: paginationData.hasPrev || false
      });
      
      if (sanitizedData.length > 0) {
        showToast(`Loaded ${sanitizedData.length} entries (Page ${page})`, 'success');
      }
    } catch (err) {
      console.warn('API not available, using mock data:', err.message);
      // For demo, use mock data with pagination simulation
      const startIndex = (page - 1) * pagination.itemsPerPage;
      const endIndex = startIndex + pagination.itemsPerPage;
      const paginatedMock = mockData.slice(startIndex, endIndex);
      const sanitizedMock = paginatedMock.map(entry => {
        const sanitized = sanitizeEntry(entry);
        sanitized.date = formatDateToDDMMYYYY(sanitized.date);
        return sanitized;
      });
      setEntries(sanitizedMock);
      
      setPagination({
        currentPage: page,
        totalPages: Math.ceil(mockData.length / pagination.itemsPerPage),
        totalItems: mockData.length,
        itemsPerPage: pagination.itemsPerPage,
        hasNext: endIndex < mockData.length,
        hasPrev: page > 1
      });
      
      showToast('Using mock data (API not available)', 'warning');
    } finally {
      setLoading(false);
    }
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchEntries(newPage);
    }
  };

  // Handle search
  const handleSearch = () => {
    fetchEntries(1);
  };

  // Handle date filter
  const handleDateFilter = () => {
    fetchEntries(1);
  };

  // Clear filters
  const clearFilters = () => {
    setSearchTerm('');
    setDateFilter({ start: '', end: '' });
    setSortField('date');
    setSortOrder('desc');
    fetchEntries(1);
  };

  // Refresh data
  const handleRefresh = () => {
    fetchEntries(pagination.currentPage);
  };

  // Get unique dates from entries
  const getUniqueDates = () => {
    const dates = entries.map(entry => entry.date).filter(Boolean);
    return [...new Set(dates)];
  };

  // Get entry for a specific date
  const getEntryByDate = (date) => {
    return entries.find(entry => entry.date === date);
  };

  const handleAddEntryForDate = (date) => {
    // Format date to DD-MM-YYYY
    const formattedDate = formatDateToDDMMYYYY(date);
    
    const existingEntry = getEntryByDate(formattedDate);
    if (existingEntry) {
      showToast(`Entry for date ${formattedDate} already exists. You can edit it directly.`, 'warning');
      return;
    }

    const newEntryData = {
      date: formattedDate,
      ...columns.reduce((acc, col) => {
        acc[col.key] = {
          stockInHand: 0,
          newProduction: 0,
          totalUsed: 0,
          totalBalance: 0
        };
        return acc;
      }, {})
    };

    setNewEntry(newEntryData);
    setEntries(prev => [newEntryData, ...prev]);
    setShowDateInput(false);
    setSelectedDate('');
    showToast(`New entry created for ${formattedDate}`, 'success');
  };

  const handleShowDateInput = () => {
    setShowDateInput(true);
  };

  const handleDateSelect = (e) => {
    setSelectedDate(e.target.value);
  };

  const handleCopyFromDate = (e) => {
    setCopyFromDate(e.target.value);
  };

  const handleCreateWithCopy = () => {
    if (!selectedDate) {
      showToast('Please select a date', 'warning');
      return;
    }

    // Convert selected date to DD-MM-YYYY
    const formattedDate = formatDateToDDMMYYYY(selectedDate);
    
    const existingEntry = getEntryByDate(formattedDate);
    if (existingEntry) {
      showToast(`Entry for date ${formattedDate} already exists.`, 'warning');
      return;
    }

    let copiedData = {};
    
    if (copyFromDate) {
      const sourceEntry = getEntryByDate(copyFromDate);
      if (sourceEntry) {
        columns.forEach(col => {
          if (sourceEntry[col.key]) {
            copiedData[col.key] = {
              stockInHand: Math.max(0, sourceEntry[col.key].stockInHand || 0),
              newProduction: Math.max(0, sourceEntry[col.key].newProduction || 0),
              totalUsed: Math.max(0, sourceEntry[col.key].totalUsed || 0),
              totalBalance: Math.max(0, sourceEntry[col.key].totalBalance || 0)
            };
          } else {
            copiedData[col.key] = {
              stockInHand: 0,
              newProduction: 0,
              totalUsed: 0,
              totalBalance: 0
            };
          }
        });
        showToast(`Copying data from ${copyFromDate}`, 'success');
      } else {
        showToast(`Source entry for date ${copyFromDate} not found. Starting fresh.`, 'warning');
        columns.forEach(col => {
          copiedData[col.key] = {
            stockInHand: 0,
            newProduction: 0,
            totalUsed: 0,
            totalBalance: 0
          };
        });
      }
    } else {
      columns.forEach(col => {
        copiedData[col.key] = {
          stockInHand: 0,
          newProduction: 0,
          totalUsed: 0,
          totalBalance: 0
        };
      });
      showToast('Creating new entry with zeros', 'success');
    }

    const newEntryData = {
      date: formattedDate,
      ...copiedData
    };

    setNewEntry(newEntryData);
    setEntries(prev => [newEntryData, ...prev]);
    
    setShowDateInput(false);
    setSelectedDate('');
    setCopyFromDate('');
  };

  const handleSaveEntry = async () => {
    if (!newEntry) return;
    
    setSaving(true);
    try {
      const sanitizedEntry = sanitizeEntry(newEntry);
      // Ensure date is in DD-MM-YYYY format
      sanitizedEntry.date = formatDateToDDMMYYYY(sanitizedEntry.date);
      
      const response = await axiosInstance.post('/raw-block-stock', sanitizedEntry);
      const savedEntry = response.data.data;
      savedEntry.date = formatDateToDDMMYYYY(savedEntry.date);
      
      setEntries(prev => prev.map(entry => 
        entry === newEntry ? savedEntry : entry
      ));
      setNewEntry(null);
      showToast('Entry saved successfully!', 'success');
      setTimeout(() => fetchEntries(pagination.currentPage), 500);
    } catch (err) {
      console.warn('API save failed, saving locally:', err.message);
      const sanitizedEntry = sanitizeEntry(newEntry);
      sanitizedEntry.date = formatDateToDDMMYYYY(sanitizedEntry.date);
      const savedEntry = {
        ...sanitizedEntry,
        _id: `temp_${Date.now()}`
      };
      setEntries(prev => prev.map(entry => 
        entry === newEntry ? savedEntry : entry
      ));
      setNewEntry(null);
      showToast('Entry saved locally (API not available)', 'warning');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEntry = () => {
    setEntries(prev => prev.filter(entry => entry !== newEntry));
    setNewEntry(null);
    setShowDateInput(false);
    setSelectedDate('');
    setCopyFromDate('');
  };

  // Start editing an entry
  const startEditing = (entry) => {
    setEditingEntryId(entry._id);
    setEditingData(JSON.parse(JSON.stringify(entry)));
    showToast(`Editing entry for ${entry.date}`, 'success');
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingEntryId(null);
    setEditingData(null);
    showToast('Editing cancelled', 'warning');
  };

  // Update editing data with validation
  const updateEditingCell = (columnKey, rowType, value) => {
    if (!editingData) return;
    
    const sanitizedValue = sanitizeValue(value);
    
    const updatedData = { ...editingData };
    if (!updatedData[columnKey]) {
      updatedData[columnKey] = {
        stockInHand: 0,
        newProduction: 0,
        totalUsed: 0,
        totalBalance: 0
      };
    }
    updatedData[columnKey][rowType] = sanitizedValue;
    
    // Auto-calculate balance
    const stock = Math.max(0, updatedData[columnKey].stockInHand || 0);
    const production = Math.max(0, updatedData[columnKey].newProduction || 0);
    const used = Math.max(0, updatedData[columnKey].totalUsed || 0);
    updatedData[columnKey].totalBalance = Math.max(0, stock + production - used);
    
    setEditingData(updatedData);
  };

  // Save edited entry
  const saveEditing = async () => {
    if (!editingData) return;
    
    setSaving(true);
    try {
      const sanitizedData = sanitizeEntry(editingData);
      sanitizedData.date = formatDateToDDMMYYYY(sanitizedData.date);
      
      const response = await axiosInstance.put(`/raw-block-stock/${sanitizedData._id}`, sanitizedData);
      const updatedEntry = response.data.data;
      updatedEntry.date = formatDateToDDMMYYYY(updatedEntry.date);
      
      setEntries(prev => prev.map(entry => 
        entry._id === sanitizedData._id ? updatedEntry : entry
      ));
      setEditingEntryId(null);
      setEditingData(null);
      showToast('Entry updated successfully!', 'success');
      setTimeout(() => fetchEntries(pagination.currentPage), 500);
    } catch (err) {
      console.error('Error updating entry:', err);
      showToast('Failed to update entry. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateCell = (entryId, columnKey, rowType, value) => {
    const sanitizedValue = sanitizeValue(value);
    
    setEntries(prev => prev.map(entry => {
      const isTargetEntry = entry._id 
        ? entry._id === entryId 
        : entry === entryId;
      
      if (isTargetEntry) {
        const updatedEntry = { ...entry };
        if (!updatedEntry[columnKey]) {
          updatedEntry[columnKey] = {
            stockInHand: 0,
            newProduction: 0,
            totalUsed: 0,
            totalBalance: 0
          };
        }
        updatedEntry[columnKey][rowType] = sanitizedValue;
        
        const stock = Math.max(0, updatedEntry[columnKey].stockInHand || 0);
        const production = Math.max(0, updatedEntry[columnKey].newProduction || 0);
        const used = Math.max(0, updatedEntry[columnKey].totalUsed || 0);
        updatedEntry[columnKey].totalBalance = Math.max(0, stock + production - used);
        
        return updatedEntry;
      }
      return entry;
    }));
  };

  const handleDeleteEntry = async (id) => {
    if (!window.confirm('Are you sure you want to delete this entry?')) return;
    
    setDeleting(true);
    try {
      await axiosInstance.delete(`/raw-block-stock/${id}`);
      setEntries(prev => prev.filter(entry => entry._id !== id));
      showToast('Entry deleted successfully!', 'success');
      setTimeout(() => fetchEntries(pagination.currentPage), 500);
    } catch (err) {
      console.warn('API delete failed, deleting locally:', err.message);
      setEntries(prev => prev.filter(entry => entry._id !== id));
      showToast('Entry deleted locally (API not available)', 'warning');
    } finally {
      setDeleting(false);
    }
  };

  const getCellValue = (entry, columnKey, rowType) => {
    if (!entry || !entry[columnKey]) return 0;
    return Math.max(0, entry[columnKey][rowType] || 0);
  };

  // Get editing cell value
  const getEditingCellValue = (columnKey, rowType) => {
    if (!editingData || !editingData[columnKey]) return 0;
    return Math.max(0, editingData[columnKey][rowType] || 0);
  };

  // Group entries by date and sort
  const sortedEntries = [...entries].sort((a, b) => {
    // Convert DD-MM-YYYY to date for comparison
    const dateA = a.date?.split('-').reverse().join('-') || '';
    const dateB = b.date?.split('-').reverse().join('-') || '';
    return dateB.localeCompare(dateA);
  });

  if (loading && entries.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading entries...</p>
        </div>
      </div>
    );
  }

  return (
    <>
    <InternalNavbar/>
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Toast Notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-6 w-6 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  📊 Raw Block Stock Report
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  {pagination.totalItems} entries • Page {pagination.currentPage} of {pagination.totalPages}
                </p>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
              </button>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
              >
                <Filter className="h-4 w-4" /> Filters
              </button>
              <button
                onClick={handleShowDateInput}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors flex items-center gap-2"
              >
                <Calendar className="h-4 w-4" /> Add Entry for Date
              </button>
             
            </div>
          </div>

          {/* Filters Section */}
          {showFilters && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Search by Date
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="DD-MM-YYYY"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    />
                    <button
                      onClick={handleSearch}
                      className="px-3 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm"
                    >
                      <Search className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Date From
                  </label>
                  <input
                    type="date"
                    value={dateFilter.start}
                    onChange={(e) => setDateFilter({ ...dateFilter, start: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Date To
                  </label>
                  <input
                    type="date"
                    value={dateFilter.end}
                    onChange={(e) => setDateFilter({ ...dateFilter, end: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                  />
                </div>
                <div className="flex items-end gap-2">
                  <button
                    onClick={handleDateFilter}
                    className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    Apply Filter
                  </button>
                  <button
                    onClick={clearFilters}
                    className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
                  >
                    Clear
                  </button>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-4">
                <label className="text-xs font-medium text-gray-700">Sort By:</label>
                <select
                  value={sortField}
                  onChange={(e) => setSortField(e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                >
                  <option value="date">Date</option>
                  <option value="createdAt">Created At</option>
                </select>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                >
                  <option value="desc">Newest First</option>
                  <option value="asc">Oldest First</option>
                </select>
                <button
                  onClick={() => fetchEntries(1)}
                  className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                >
                  Apply Sort
                </button>
              </div>
            </div>
          )}

          {/* API Status */}
          <div className="mt-2 text-xs text-gray-500 flex items-center gap-2">
            <span className={`inline-block w-2 h-2 rounded-full ${loading ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`}></span>
            {loading ? 'Loading...' : `${entries.length} entries loaded`}
            {saving && (
              <span className="ml-2 flex items-center gap-1 text-blue-600">
                <Loader className="h-3 w-3 animate-spin" /> Saving...
              </span>
            )}
            {deleting && (
              <span className="ml-2 flex items-center gap-1 text-red-600">
                <Loader className="h-3 w-3 animate-spin" /> Deleting...
              </span>
            )}
          </div>

          {/* Date Input Form */}
          {showDateInput && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="font-semibold text-gray-700 mb-3">Add Entry for Specific Date</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Date
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={handleDateSelect}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Copy Data From (Optional)
                  </label>
                  <select
                    value={copyFromDate}
                    onChange={handleCopyFromDate}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="">None (Start Fresh)</option>
                    {getUniqueDates().map((date, idx) => (
                      <option key={idx} value={date}>{date}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end gap-2">
                  <button
                    onClick={handleCreateWithCopy}
                    disabled={!selectedDate || saving}
                    className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                      selectedDate && !saving
                        ? 'bg-green-600 text-white hover:bg-green-700' 
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {saving ? (
                      <Loader className="h-4 w-4 animate-spin" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                    Create Entry
                  </button>
                  <button
                    onClick={() => {
                      setShowDateInput(false);
                      setSelectedDate('');
                      setCopyFromDate('');
                    }}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
              {copyFromDate && (
                <p className="mt-2 text-sm text-blue-600">
                  ℹ️ Copying data from {copyFromDate}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gradient-to-r from-teal-600 to-teal-700">
                  <th className="p-3 text-left text-white font-semibold text-sm border-r border-teal-500 min-w-[120px] sticky left-0 bg-teal-600">
                    Description / Date
                  </th>
                  {columns.map((col, index) => (
                    <th key={index} className="p-3 text-center text-white font-semibold text-xs border-r border-teal-500 whitespace-nowrap min-w-[100px]">
                      {col.label}
                    </th>
                  ))}
                  <th className="p-3 text-center text-white font-semibold text-sm border-r border-teal-500 min-w-[120px]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {!entries || entries.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length + 2} className="p-8 text-center text-gray-500">
                      {loading ? 'Loading...' : 'No entries found. Click "Add Entry for Date" or "Quick Add" to create one.'}
                    </td>
                  </tr>
                ) : (
                  sortedEntries.map((entry, entryIndex) => {
                    const isEditing = editingEntryId === entry._id;
                    const isNewEntry = !entry._id;
                    const isSavingThis = saving && isNewEntry;
                    
                    // Use editing data if in edit mode, otherwise use entry data
                    const displayEntry = isEditing ? editingData : entry;

                    return (
                      <React.Fragment key={entry._id || entryIndex}>
                        {/* Date Row */}
                        <tr className={`${isNewEntry ? 'bg-yellow-50' : isEditing ? 'bg-blue-50' : 'bg-gray-50'}`}>
                          <td className="p-3 text-left font-medium text-gray-700 border-b border-r border-gray-200 sticky left-0 bg-gray-50">
                            <div className="flex items-center gap-2">
                              📅 {entry.date || 'No Date'}
                              {isNewEntry && (
                                <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded-full">
                                  New
                                </span>
                              )}
                              {isEditing && (
                                <span className="text-xs bg-blue-200 text-blue-800 px-2 py-0.5 rounded-full">
                                  Editing
                                </span>
                              )}
                              {entry._id && entry._id.toString().startsWith('temp_') && (
                                <span className="text-xs bg-blue-200 text-blue-800 px-2 py-0.5 rounded-full">
                                  Local
                                </span>
                              )}
                              {isSavingThis && (
                                <span className="text-xs bg-green-200 text-green-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                                  <Loader className="h-3 w-3 animate-spin" /> Saving...
                                </span>
                              )}
                            </div>
                          </td>
                          {columns.map((col, colIndex) => (
                            <td key={colIndex} className="p-3 text-center text-sm text-gray-700 border-b border-r border-gray-200">
                              {displayEntry && displayEntry[col.key]?.totalBalance !== undefined ? 
                                `Bal: ${displayEntry[col.key].totalBalance}` : 
                                '—'
                              }
                            </td>
                          ))}
                          <td className="p-3 text-center border-b border-gray-200">
                            {!isNewEntry && !isEditing && (
                              <button
                                onClick={() => startEditing(entry)}
                                className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors mr-2"
                                title="Edit entry"
                                disabled={saving || deleting}
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                            )}
                            {entry._id && !entry._id.toString().startsWith('temp_') && !isEditing && (
                              <button
                                onClick={() => handleDeleteEntry(entry._id)}
                                className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete entry"
                                disabled={saving || deleting}
                              >
                                {deleting ? (
                                  <Loader className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </button>
                            )}
                            {isEditing && (
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={saveEditing}
                                  className="p-1 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-colors"
                                  title="Save changes"
                                  disabled={saving}
                                >
                                  {saving ? (
                                    <Loader className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Save className="h-4 w-4" />
                                  )}
                                </button>
                                <button
                                  onClick={cancelEditing}
                                  className="p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors"
                                  title="Cancel editing"
                                  disabled={saving}
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>

                        {/* Data Rows */}
                        {rowTypes.map((rowType, rowIdx) => {
                          const isBalanceRow = rowType.key === 'totalBalance';
                          const isEditingRow = isEditing;
                          
                          return (
                            <tr 
                              key={rowIdx} 
                              className={`${isNewEntry ? 'bg-yellow-50/50' : isEditingRow ? 'bg-blue-50/50' : ''} 
                                ${isBalanceRow ? 'bg-teal-50 hover:bg-teal-100' : 'hover:bg-gray-50'} 
                                transition-colors`}
                            >
                              <td className={`p-3 text-left text-sm border-b border-r border-gray-200 sticky left-0 
                                ${isBalanceRow ? 'font-bold text-teal-700 bg-teal-50' : 'text-gray-600 bg-white'}`}>
                                {rowType.label}
                              </td>
                              {columns.map((col, colIndex) => {
                                const value = isEditingRow 
                                  ? getEditingCellValue(col.key, rowType.key)
                                  : getCellValue(entry, col.key, rowType.key);
                                
                                return (
                                  <td key={colIndex} className="p-2 border-b border-r border-gray-200">
                                    {isEditingRow && !isBalanceRow ? (
                                      <input
                                        type="number"
                                        min="0"
                                        value={value || ''}
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          if (val === '') {
                                            updateEditingCell(col.key, rowType.key, 0);
                                          } else {
                                            updateEditingCell(col.key, rowType.key, val);
                                          }
                                        }}
                                        onBlur={(e) => {
                                          const val = Number(e.target.value);
                                          if (val < 0 || isNaN(val)) {
                                            updateEditingCell(col.key, rowType.key, 0);
                                          }
                                        }}
                                        className="w-full p-1 text-sm text-center border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                        placeholder="0"
                                        disabled={saving}
                                      />
                                    ) : isEditingRow && isBalanceRow ? (
                                      <span className="block text-center font-bold text-teal-700">
                                        {value}
                                      </span>
                                    ) : isNewEntry && !isBalanceRow ? (
                                      <input
                                        type="number"
                                        min="0"
                                        value={value || ''}
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          if (val === '') {
                                            const identifier = entry._id || entry;
                                            handleUpdateCell(identifier, col.key, rowType.key, 0);
                                          } else {
                                            const identifier = entry._id || entry;
                                            handleUpdateCell(identifier, col.key, rowType.key, val);
                                          }
                                        }}
                                        onBlur={(e) => {
                                          const val = Number(e.target.value);
                                          if (val < 0 || isNaN(val)) {
                                            const identifier = entry._id || entry;
                                            handleUpdateCell(identifier, col.key, rowType.key, 0);
                                          }
                                        }}
                                        className="w-full p-1 text-sm text-center border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                                        placeholder="0"
                                        disabled={saving}
                                      />
                                    ) : (
                                      <span className={`block text-center ${isBalanceRow ? 'font-bold text-teal-700' : 'text-gray-700'}`}>
                                        {value}
                                      </span>
                                    )}
                                  </td>
                                );
                              })}
                              <td className="p-2 border-b border-gray-200"></td>
                            </tr>
                          );
                        })}

                        {/* New Entry Actions */}
                        {isNewEntry && (
                          <tr>
                            <td colSpan={columns.length + 2} className="p-3 bg-yellow-50 border-b border-gray-200">
                              <div className="flex justify-center gap-2">
                                <button
                                  onClick={handleSaveEntry}
                                  disabled={saving}
                                  className="px-4 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {saving ? (
                                    <>
                                      <Loader className="h-4 w-4 animate-spin" /> Saving...
                                    </>
                                  ) : (
                                    <>
                                      <Save className="h-4 w-4" /> Save Entry
                                    </>
                                  )}
                                </button>
                                <button
                                  onClick={handleCancelEntry}
                                  disabled={saving}
                                  className="px-4 py-1 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <X className="h-4 w-4" /> Cancel
                                </button>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between bg-white rounded-lg shadow-sm p-4">
            <div className="text-sm text-gray-600">
              Showing {entries.length} of {pagination.totalItems} entries
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={!pagination.hasPrev || loading}
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  let pageNum;
                  if (pagination.totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (pagination.currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (pagination.currentPage >= pagination.totalPages - 2) {
                    pageNum = pagination.totalPages - 4 + i;
                  } else {
                    pageNum = pagination.currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={i}
                      onClick={() => handlePageChange(pageNum)}
                      className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                        pageNum === pagination.currentPage
                          ? 'bg-teal-600 text-white'
                          : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                {pagination.totalPages > 5 && pagination.currentPage < pagination.totalPages - 2 && (
                  <>
                    <span className="text-gray-400">...</span>
                    <button
                      onClick={() => handlePageChange(pagination.totalPages)}
                      className="w-8 h-8 rounded-lg text-sm font-medium hover:bg-gray-100 text-gray-700 transition-colors"
                    >
                      {pagination.totalPages}
                    </button>
                  </>
                )}
              </div>

              <button
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={!pagination.hasNext || loading}
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        {/* Summary Stats */}
        {entries.length > 0 && (
          <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="text-sm text-gray-500">Total Entries</div>
              <div className="text-2xl font-bold text-gray-900">{pagination.totalItems}</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="text-sm text-gray-500">Current Page</div>
              <div className="text-2xl font-bold text-gray-900">{pagination.currentPage}</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="text-sm text-gray-500">Total Pages</div>
              <div className="text-2xl font-bold text-gray-900">{pagination.totalPages}</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="text-sm text-gray-500">Unique Dates</div>
              <div className="text-2xl font-bold text-gray-900">{getUniqueDates().length}</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="text-sm text-gray-500">Latest Entry</div>
              <div className="text-lg font-semibold text-gray-900">
                {sortedEntries.length > 0 ? sortedEntries[0].date : 'N/A'}
              </div>
            </div>
          </div>
        )}

     
      </div>
    </div>
    </>
  );
};

export default RawBlockStockReport;