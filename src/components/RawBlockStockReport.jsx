// RawBlockStockReport.jsx
import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Plus, Trash2, Save, X, Calendar, Copy, Edit2, 
  Check, AlertCircle, Loader, ChevronLeft, ChevronRight, 
  Search, Filter, RefreshCw, Info 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from "../axiosInstance";
import InternalNavbar from "../components/InternalNavbar";

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

  // ==================== DATE HELPERS ====================
  
  const formatDateToDDMMYYYY = (dateString) => {
    if (!dateString) return '';
    if (/^\d{2}-\d{2}-\d{4}$/.test(dateString)) return dateString;
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) return dateString.replace(/\//g, '-');
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      const parts = dateString.split('-');
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return dateString;
  };

  // Convert DD-MM-YYYY to comparable Date object
  const parseDate = (dateStr) => {
    if (!dateStr) return new Date(0);
    const formatted = formatDateToDDMMYYYY(dateStr);
    const [day, month, year] = formatted.split('-');
    return new Date(`${year}-${month}-${day}`);
  };

  // Compare two dates in DD-MM-YYYY format
  const isDateBefore = (dateA, dateB) => {
    return parseDate(dateA) < parseDate(dateB);
  };

  const isDateAfter = (dateA, dateB) => {
    return parseDate(dateA) > parseDate(dateB);
  };

  const isSameDate = (dateA, dateB) => {
    return formatDateToDDMMYYYY(dateA) === formatDateToDDMMYYYY(dateB);
  };

  // ==================== CARRY FORWARD LOGIC ====================
  
  /**
   * Get the immediate previous entry (before the given date)
   * Uses ALL loaded entries (not just current page)
   */
  const getPreviousEntry = (date) => {
    const sorted = [...entries]
      .filter(e => e.date && !isSameDate(e.date, date))
      .sort((a, b) => parseDate(a.date) - parseDate(b.date));
    
    // Find the entry with the largest date that is still before `date`
    let previousEntry = null;
    for (const entry of sorted) {
      if (isDateBefore(entry.date, date)) {
        if (!previousEntry || isDateAfter(entry.date, previousEntry.date)) {
          previousEntry = entry;
        }
      }
    }
    return previousEntry;
  };

  /**
   * Get carried-forward stock for a specific column from previous entry
   */
  const getCarriedForwardStock = (columnKey, date, allEntries = entries) => {
    const sorted = [...allEntries]
      .filter(e => e.date && !isSameDate(e.date, date))
      .sort((a, b) => parseDate(a.date) - parseDate(b.date));
    
    let previousEntry = null;
    for (const entry of sorted) {
      if (isDateBefore(entry.date, date)) {
        if (!previousEntry || isDateAfter(entry.date, previousEntry.date)) {
          previousEntry = entry;
        }
      }
    }
    
    if (previousEntry && previousEntry[columnKey]) {
      return Math.max(0, previousEntry[columnKey].totalBalance || 0);
    }
    return 0;
  };

  /**
   * Recalculate all balances with carry-forward logic
   * Sort entries oldest -> newest, then calculate each one's balance
   */
  const recalculateWithCarryForward = (allEntries) => {
    // Sort oldest first
    const sorted = [...allEntries].sort((a, b) => parseDate(a.date) - parseDate(b.date));
    
    const recalculated = [];
    let previousBalances = {}; // { columnKey: balance }
    
    // Initialize with 0
    columns.forEach(col => {
      previousBalances[col.key] = 0;
    });
    
    for (const entry of sorted) {
      const newEntry = { ...entry };
      
      columns.forEach(col => {
        const existing = newEntry[col.key] || {
          stockInHand: 0,
          newProduction: 0,
          totalUsed: 0,
          totalBalance: 0
        };
        
        // Auto-fill stock in hand from previous balance
        // Only if the entry doesn't have a manually set stockInHand
        // (we treat stockInHand === 0 as "not set" - can be adjusted)
        const carriedStock = previousBalances[col.key] || 0;
        
        // If the entry has 0 stockInHand, auto-fill from carry forward
        // (For existing data with real stockInHand values, we respect them)
        const effectiveStock = existing.stockInHand > 0 
          ? existing.stockInHand 
          : carriedStock;
        
        const newProduction = Math.max(0, existing.newProduction || 0);
        const totalUsed = Math.max(0, existing.totalUsed || 0);
        const totalBalance = Math.max(0, effectiveStock + newProduction - totalUsed);
        
        newEntry[col.key] = {
          stockInHand: effectiveStock,
          newProduction,
          totalUsed,
          totalBalance
        };
        
        // Store balance for next entry
        previousBalances[col.key] = totalBalance;
      });
      
      recalculated.push(newEntry);
    }
    
    return recalculated;
  };

  // ==================== MOCK DATA ====================
  
  const mockData = [
    {
      _id: '1',
      date: '28-08-2026',
      whiteND16kg20kgs: { stockInHand: 10, newProduction: 2, totalUsed: 1, totalBalance: 11 },
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
      date: '29-08-2026',
      whiteND16kg20kgs: { stockInHand: 11, newProduction: 5, totalUsed: 2, totalBalance: 14 },
      white8kg32kgs: { stockInHand: 10, newProduction: 3, totalUsed: 1, totalBalance: 12 },
      white10kg42kgs: { stockInHand: 13, newProduction: 4, totalUsed: 3, totalBalance: 14 },
      white12kg52kgs: { stockInHand: 7, newProduction: 2, totalUsed: 1, totalBalance: 8 },
      white14kg62kgs: { stockInHand: 17, newProduction: 6, totalUsed: 4, totalBalance: 19 },
      white16kg72kgs: { stockInHand: 10, newProduction: 3, totalUsed: 2, totalBalance: 11 },
      pink13_14kg55kgs: { stockInHand: 8, newProduction: 2, totalUsed: 1, totalBalance: 9 },
      pink15_16kg72kgs: { stockInHand: 12, newProduction: 4, totalUsed: 3, totalBalance: 13 },
      pink20kg92kgs: { stockInHand: 6, newProduction: 1, totalUsed: 0, totalBalance: 7 },
      whiteFR15_16kg65kgs: { stockInHand: 16, newProduction: 5, totalUsed: 2, totalBalance: 19 },
      patterns20kg92kgs: { stockInHand: 5, newProduction: 2, totalUsed: 1, totalBalance: 6 },
      patterns24kg112kgs: { stockInHand: 4, newProduction: 1, totalUsed: 0, totalBalance: 5 }
    }
  ];

  useEffect(() => {
    fetchEntries();
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const sanitizeValue = (value) => {
    const num = Number(value);
    if (isNaN(num) || num < 0) return 0;
    return num;
  };

  const sanitizeEntry = (entry) => {
    const sanitized = { ...entry };
    columns.forEach(col => {
      if (sanitized[col.key]) {
        rowTypes.forEach(rowType => {
          if (sanitized[col.key][rowType.key] !== undefined) {
            sanitized[col.key][rowType.key] = Math.max(0, Number(sanitized[col.key][rowType.key]) || 0);
          }
        });
        const stock = sanitized[col.key].stockInHand || 0;
        const production = sanitized[col.key].newProduction || 0;
        const used = sanitized[col.key].totalUsed || 0;
        sanitized[col.key].totalBalance = Math.max(0, stock + production - used);
      }
    });
    return sanitized;
  };

  // ==================== FETCH ====================
  
  const fetchEntries = async (page = 1) => {
    setLoading(true);
    try {
      // Fetch ALL entries (large limit) so carry-forward works across pages
      let url = `/raw-block-stock?page=1&limit=1000`;
      url += `&sortField=date&sortOrder=asc`;
      
      if (searchTerm.trim()) {
        let searchValue = searchTerm.trim();
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(searchValue)) {
          searchValue = searchValue.replace(/\//g, '-');
        }
        url += `&search=${encodeURIComponent(searchValue)}`;
      }
      
      if (dateFilter.start && dateFilter.end) {
        const startDate = formatDateToDDMMYYYY(dateFilter.start);
        const endDate = formatDateToDDMMYYYY(dateFilter.end);
        url += `&startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`;
      }
      
      const response = await axiosInstance.get(url);
      const data = response.data?.data || [];
      
      // Sanitize + normalize dates
      const sanitizedData = data.map(entry => {
        const sanitized = sanitizeEntry(entry);
        sanitized.date = formatDateToDDMMYYYY(sanitized.date);
        return sanitized;
      });
      
      // Apply carry-forward recalculation
      const recalculated = recalculateWithCarryForward(sanitizedData);
      
      // Sort newest first for display
      recalculated.sort((a, b) => parseDate(b.date) - parseDate(a.date));
      
      setEntries(recalculated);
      
      const totalItems = recalculated.length;
      const totalPages = Math.ceil(totalItems / pagination.itemsPerPage) || 1;
      
      setPagination({
        currentPage: page,
        totalPages,
        totalItems,
        itemsPerPage: pagination.itemsPerPage,
        hasNext: page < totalPages,
        hasPrev: page > 1
      });
      
      if (recalculated.length > 0) {
        showToast(`Loaded ${recalculated.length} entries`, 'success');
      }
    } catch (err) {
      console.warn('API not available, using mock data:', err.message);
      
      const sanitizedMock = mockData.map(entry => {
        const sanitized = sanitizeEntry(entry);
        sanitized.date = formatDateToDDMMYYYY(sanitized.date);
        return sanitized;
      });
      
      const recalculated = recalculateWithCarryForward(sanitizedMock);
      recalculated.sort((a, b) => parseDate(b.date) - parseDate(a.date));
      
      setEntries(recalculated);
      
      const totalItems = recalculated.length;
      const totalPages = Math.ceil(totalItems / pagination.itemsPerPage) || 1;
      
      setPagination({
        currentPage: 1,
        totalPages,
        totalItems,
        itemsPerPage: pagination.itemsPerPage,
        hasNext: 1 < totalPages,
        hasPrev: false
      });
      
      showToast('Using mock data with carry-forward', 'warning');
    } finally {
      setLoading(false);
    }
  };

  // Get paginated entries for display
  const getPaginatedEntries = () => {
    const startIndex = (pagination.currentPage - 1) * pagination.itemsPerPage;
    const endIndex = startIndex + pagination.itemsPerPage;
    return entries.slice(startIndex, endIndex);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, currentPage: newPage }));
    }
  };

  const handleSearch = () => fetchEntries(1);
  const handleDateFilter = () => fetchEntries(1);

  const clearFilters = () => {
    setSearchTerm('');
    setDateFilter({ start: '', end: '' });
    setSortField('date');
    setSortOrder('desc');
    fetchEntries(1);
  };

  const handleRefresh = () => fetchEntries(pagination.currentPage);

  const getUniqueDates = () => {
    const dates = entries.map(entry => entry.date).filter(Boolean);
    return [...new Set(dates)].sort((a, b) => parseDate(b) - parseDate(a));
  };

  const getEntryByDate = (date) => {
    const formatted = formatDateToDDMMYYYY(date);
    return entries.find(entry => isSameDate(entry.date, formatted));
  };

  // ==================== ADD / CREATE ====================
  
  /**
   * Build a new entry with stock carried forward from previous date
   */
  const buildNewEntryWithCarryForward = (date, sourceEntry = null) => {
    const formattedDate = formatDateToDDMMYYYY(date);
    const previousEntry = getPreviousEntry(formattedDate);
    
    const entryData = { date: formattedDate };
    
    columns.forEach(col => {
      let stockInHand = 0;
      let newProduction = 0;
      let totalUsed = 0;
      
      if (sourceEntry && sourceEntry[col.key]) {
        // When copying from source, use source values
        // (but stock in hand should still carry forward)
        newProduction = Math.max(0, sourceEntry[col.key].newProduction || 0);
        totalUsed = Math.max(0, sourceEntry[col.key].totalUsed || 0);
        // Stock in hand = previous balance (carry forward)
        stockInHand = previousEntry && previousEntry[col.key]
          ? Math.max(0, previousEntry[col.key].totalBalance || 0)
          : 0;
      } else {
        // No source - carry forward the balance from previous date
        stockInHand = previousEntry && previousEntry[col.key]
          ? Math.max(0, previousEntry[col.key].totalBalance || 0)
          : 0;
      }
      
      const totalBalance = Math.max(0, stockInHand + newProduction - totalUsed);
      
      entryData[col.key] = {
        stockInHand,
        newProduction,
        totalUsed,
        totalBalance
      };
    });
    
    return entryData;
  };

  const handleAddEntryForDate = (date) => {
    const formattedDate = formatDateToDDMMYYYY(date);
    
    const existingEntry = getEntryByDate(formattedDate);
    if (existingEntry) {
      showToast(`Entry for date ${formattedDate} already exists. You can edit it directly.`, 'warning');
      return;
    }

    const newEntryData = buildNewEntryWithCarryForward(formattedDate);
    
    setNewEntry(newEntryData);
    setEntries(prev => [newEntryData, ...prev]);
    setShowDateInput(false);
    setSelectedDate('');
    showToast(`New entry created for ${formattedDate} with carried-forward stock`, 'success');
  };

  const handleShowDateInput = () => setShowDateInput(true);
  const handleDateSelect = (e) => setSelectedDate(e.target.value);
  const handleCopyFromDate = (e) => setCopyFromDate(e.target.value);

  const handleCreateWithCopy = () => {
    if (!selectedDate) {
      showToast('Please select a date', 'warning');
      return;
    }

    const formattedDate = formatDateToDDMMYYYY(selectedDate);
    
    const existingEntry = getEntryByDate(formattedDate);
    if (existingEntry) {
      showToast(`Entry for date ${formattedDate} already exists.`, 'warning');
      return;
    }

    let sourceEntry = null;
    if (copyFromDate) {
      sourceEntry = getEntryByDate(copyFromDate);
      if (sourceEntry) {
        showToast(`Copying production/usage from ${copyFromDate}`, 'success');
      } else {
        showToast(`Source entry for date ${copyFromDate} not found. Starting fresh.`, 'warning');
      }
    } else {
      showToast('Creating new entry with carried-forward stock', 'success');
    }

    const newEntryData = buildNewEntryWithCarryForward(formattedDate, sourceEntry);
    
    setNewEntry(newEntryData);
    setEntries(prev => [newEntryData, ...prev]);
    
    setShowDateInput(false);
    setSelectedDate('');
    setCopyFromDate('');
  };

  // ==================== SAVE / UPDATE ====================
  
  const handleSaveEntry = async () => {
    if (!newEntry) return;
    
    setSaving(true);
    try {
      const sanitizedEntry = sanitizeEntry(newEntry);
      sanitizedEntry.date = formatDateToDDMMYYYY(sanitizedEntry.date);
      
      const response = await axiosInstance.post('/raw-block-stock', sanitizedEntry);
      const savedEntry = response.data.data;
      savedEntry.date = formatDateToDDMMYYYY(savedEntry.date);
      
      // Replace temp entry with saved
      const updatedEntries = entries.map(entry => 
        entry === newEntry ? savedEntry : entry
      );
      
      // Recalculate all carry-forward
      const recalculated = recalculateWithCarryForward(updatedEntries);
      recalculated.sort((a, b) => parseDate(b.date) - parseDate(a.date));
      
      setEntries(recalculated);
      setNewEntry(null);
      showToast('Entry saved! Balances recalculated for all subsequent dates.', 'success');
    } catch (err) {
      console.warn('API save failed, saving locally:', err.message);
      const sanitizedEntry = sanitizeEntry(newEntry);
      sanitizedEntry.date = formatDateToDDMMYYYY(sanitizedEntry.date);
      const savedEntry = { ...sanitizedEntry, _id: `temp_${Date.now()}` };
      
      const updatedEntries = entries.map(entry => 
        entry === newEntry ? savedEntry : entry
      );
      
      const recalculated = recalculateWithCarryForward(updatedEntries);
      recalculated.sort((a, b) => parseDate(b.date) - parseDate(a.date));
      
      setEntries(recalculated);
      setNewEntry(null);
      showToast('Entry saved locally with recalculated balances', 'warning');
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

  const startEditing = (entry) => {
    setEditingEntryId(entry._id);
    setEditingData(JSON.parse(JSON.stringify(entry)));
    showToast(`Editing entry for ${entry.date}`, 'success');
  };

  const cancelEditing = () => {
    setEditingEntryId(null);
    setEditingData(null);
    showToast('Editing cancelled', 'warning');
  };

  /**
   * Update editing cell - also recalc balance
   * Stock in Hand: manual override (uses typed value)
   * Other fields: recalc balance
   */
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
    
    // Recalc balance for this column
    const stock = Math.max(0, updatedData[columnKey].stockInHand || 0);
    const production = Math.max(0, updatedData[columnKey].newProduction || 0);
    const used = Math.max(0, updatedData[columnKey].totalUsed || 0);
    updatedData[columnKey].totalBalance = Math.max(0, stock + production - used);
    
    setEditingData(updatedData);
  };

  /**
   * Save edited entry - and RECALCULATE all subsequent dates' carry-forward
   */
  const saveEditing = async () => {
    if (!editingData) return;
    
    setSaving(true);
    try {
      const sanitizedData = sanitizeEntry(editingData);
      sanitizedData.date = formatDateToDDMMYYYY(sanitizedData.date);
      
      const response = await axiosInstance.put(`/raw-block-stock/${sanitizedData._id}`, sanitizedData);
      const updatedEntry = response.data.data;
      updatedEntry.date = formatDateToDDMMYYYY(updatedEntry.date);
      
      // Replace in entries
      const updatedEntries = entries.map(entry => 
        entry._id === sanitizedData._id ? updatedEntry : entry
      );
      
      // Recalculate carry-forward for ALL entries
      const recalculated = recalculateWithCarryForward(updatedEntries);
      recalculated.sort((a, b) => parseDate(b.date) - parseDate(a.date));
      
      setEntries(recalculated);
      setEditingEntryId(null);
      setEditingData(null);
      showToast('Entry updated! All subsequent balances recalculated.', 'success');
      
      // Optionally sync to backend
      syncRecalculatedEntries(recalculated);
    } catch (err) {
      console.error('Error updating entry:', err);
      showToast('Failed to update entry. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  /**
   * Sync recalculated entries to backend (in background)
   * Updates only entries whose stockInHand / totalBalance changed
   */
  const syncRecalculatedEntries = async (recalculated) => {
    try {
      const updates = recalculated
        .filter(e => e._id && !e._id.toString().startsWith('temp_'))
        .map(async (entry) => {
          try {
            const sanitized = sanitizeEntry(entry);
            await axiosInstance.put(`/raw-block-stock/${sanitized._id}`, sanitized);
          } catch (err) {
            console.warn(`Failed to sync entry ${entry.date}:`, err.message);
          }
        });
      await Promise.all(updates);
    } catch (err) {
      console.warn('Sync failed:', err.message);
    }
  };

  // ==================== CELL UPDATE (NEW ENTRY) ====================
  
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
    if (!window.confirm('Are you sure you want to delete this entry? Subsequent dates will be recalculated.')) return;
    
    setDeleting(true);
    try {
      await axiosInstance.delete(`/raw-block-stock/${id}`);
      const updatedEntries = entries.filter(entry => entry._id !== id);
      const recalculated = recalculateWithCarryForward(updatedEntries);
      recalculated.sort((a, b) => parseDate(b.date) - parseDate(a.date));
      
      setEntries(recalculated);
      showToast('Entry deleted! Subsequent balances recalculated.', 'success');
      
      syncRecalculatedEntries(recalculated);
    } catch (err) {
      console.warn('API delete failed, deleting locally:', err.message);
      const updatedEntries = entries.filter(entry => entry._id !== id);
      const recalculated = recalculateWithCarryForward(updatedEntries);
      recalculated.sort((a, b) => parseDate(b.date) - parseDate(a.date));
      
      setEntries(recalculated);
      showToast('Entry deleted locally. Subsequent balances recalculated.', 'warning');
    } finally {
      setDeleting(false);
    }
  };

  const getCellValue = (entry, columnKey, rowType) => {
    if (!entry || !entry[columnKey]) return 0;
    return Math.max(0, entry[columnKey][rowType] || 0);
  };

  const getEditingCellValue = (columnKey, rowType) => {
    if (!editingData || !editingData[columnKey]) return 0;
    return Math.max(0, editingData[columnKey][rowType] || 0);
  };

  // Get entries for display (paginated)
  const displayEntries = getPaginatedEntries();

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

          {/* Filters */}
          {showFilters && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Search by Date</label>
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
                  <label className="block text-xs font-medium text-gray-700 mb-1">Date From</label>
                  <input
                    type="date"
                    value={dateFilter.start}
                    onChange={(e) => setDateFilter({ ...dateFilter, start: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Date To</label>
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
                    Apply
                  </button>
                  <button
                    onClick={clearFilters}
                    className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Status */}
          <div className="mt-2 text-xs text-gray-500 flex items-center gap-2">
            <span className={`inline-block w-2 h-2 rounded-full ${loading ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`}></span>
            {loading ? 'Loading...' : `${entries.length} total entries loaded`}
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select Date</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={handleDateSelect}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Copy Production/Usage From (Optional)
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
                    {saving ? <Loader className="h-4 w-4 animate-spin" /> : <Copy className="h-4 w-4" />}
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
              <p className="mt-2 text-xs text-blue-600">
                ℹ️ Stock in Hand will auto-fill from the previous date's Total Balance.
              </p>
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
                {!displayEntries || displayEntries.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length + 2} className="p-8 text-center text-gray-500">
                      {loading ? 'Loading...' : 'No entries found.'}
                    </td>
                  </tr>
                ) : (
                  displayEntries.map((entry, entryIndex) => {
                    const isEditing = editingEntryId === entry._id;
                    const isNewEntry = !entry._id;
                    const isSavingThis = saving && isNewEntry;
                    const displayEntry = isEditing ? editingData : entry;
                    
                    // Check if this entry's stock was carried forward
                    const previousEntry = getPreviousEntry(entry.date);
                    const hasCarryForward = !!previousEntry;

                    return (
                      <React.Fragment key={entry._id || entryIndex}>
                        {/* Date Row */}
                        <tr className={`${isNewEntry ? 'bg-yellow-50' : isEditing ? 'bg-blue-50' : 'bg-gray-50'}`}>
                          <td className="p-3 text-left font-medium text-gray-700 border-b border-r border-gray-200 sticky left-0 bg-gray-50">
                            <div className="flex items-center gap-2 flex-wrap">
                              📅 {entry.date || 'No Date'}
                              {isNewEntry && (
                                <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded-full">New</span>
                              )}
                              {isEditing && (
                                <span className="text-xs bg-blue-200 text-blue-800 px-2 py-0.5 rounded-full">Editing</span>
                              )}
                              {/* {hasCarryForward && !isNewEntry && (
                                <span className="text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full" title={`Carried forward from ${previousEntry.date}`}>
                                  🔄 CF
                                </span>
                              )} */}
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
                                `Bal: ${displayEntry[col.key].totalBalance}` : '—'
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
                                {deleting ? <Loader className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
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
                                  {saving ? <Loader className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
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
                          const isStockRow = rowType.key === 'stockInHand';
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
                                <div className="flex items-center gap-1">
                                  {rowType.label}
                                  {isStockRow && hasCarryForward && (
                                    <span className="text-xs text-teal-600 font-normal" title="Auto-carried from previous date">
                                      (auto)
                                    </span>
                                  )}
                                </div>
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
                                          updateEditingCell(col.key, rowType.key, val === '' ? 0 : val);
                                        }}
                                        onBlur={(e) => {
                                          const val = Number(e.target.value);
                                          if (val < 0 || isNaN(val)) {
                                            updateEditingCell(col.key, rowType.key, 0);
                                          }
                                        }}
                                        className={`w-full p-1 text-sm text-center border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                                          isStockRow 
                                            ? 'border-teal-300 bg-teal-50 focus:ring-teal-500' 
                                            : 'border-gray-300 focus:ring-blue-500'
                                        }`}
                                        placeholder="0"
                                        disabled={saving}
                                      />
                                    ) : isEditingRow && isBalanceRow ? (
                                      <span className="block text-center font-bold text-teal-700">{value}</span>
                                    ) : isNewEntry && !isBalanceRow ? (
                                      <input
                                        type="number"
                                        min="0"
                                        value={value || ''}
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          const identifier = entry._id || entry;
                                          handleUpdateCell(identifier, col.key, rowType.key, val === '' ? 0 : val);
                                        }}
                                        onBlur={(e) => {
                                          const val = Number(e.target.value);
                                          if (val < 0 || isNaN(val)) {
                                            const identifier = entry._id || entry;
                                            handleUpdateCell(identifier, col.key, rowType.key, 0);
                                          }
                                        }}
                                        className={`w-full p-1 text-sm text-center border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                                          isStockRow 
                                            ? 'border-teal-300 bg-teal-50 focus:ring-teal-500' 
                                            : 'border-gray-300 focus:ring-teal-500'
                                        }`}
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
                                    <><Loader className="h-4 w-4 animate-spin" /> Saving...</>
                                  ) : (
                                    <><Save className="h-4 w-4" /> Save Entry</>
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
              Showing {displayEntries.length} of {pagination.totalItems} entries
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
                  if (pagination.totalPages <= 5) pageNum = i + 1;
                  else if (pagination.currentPage <= 3) pageNum = i + 1;
                  else if (pagination.currentPage >= pagination.totalPages - 2) pageNum = pagination.totalPages - 4 + i;
                  else pageNum = pagination.currentPage - 2 + i;
                  
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

        {/* Stats */}
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
                {displayEntries.length > 0 ? displayEntries[0].date : 'N/A'}
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