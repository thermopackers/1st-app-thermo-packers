import { useEffect, useState } from "react";
import { useUserContext } from "../context/UserContext";
import toast from "react-hot-toast";
import axiosInstance from "../axiosInstance";
import Swal from "sweetalert2";

// Maintenance Log Book Component
const MaintenanceLogBook = ({ vehicleNumber, onClose }) => {
  const { token } = useUserContext();
  const [maintenanceEntries, setMaintenanceEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [runningKmsInfo, setRunningKmsInfo] = useState(null);
  const [editingEntry, setEditingEntry] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [totalAmount, setTotalAmount] = useState(0);
  const [dateFilter, setDateFilter] = useState({
    startDate: '',
    endDate: ''
  });

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    mileageReading: '',
    maintenanceWork: '',
    amountSpent: '',
    remarks: '',
    files: [],
    existingImageUrls: []
  });

  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalEntries: 0,
    hasNext: false,
    hasPrev: false
  });

  const [viewMode, setViewMode] = useState('table'); // 'table' or 'card'
  const [sortBy, setSortBy] = useState('date-desc'); // 'date-asc', 'date-desc', 'amount-asc', 'amount-desc'

  const fetchMaintenanceEntries = async (page = 1) => {
    setLoading(true);
    try {
      let url = `/maintenance-log/${vehicleNumber}?page=${page}&limit=10`;
      
      if (dateFilter.startDate && dateFilter.endDate) {
        url += `&startDate=${dateFilter.startDate}&endDate=${dateFilter.endDate}`;
      }

      const res = await axiosInstance.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMaintenanceEntries(res.data.entries);
      setPagination(res.data.pagination);
      setTotalAmount(res.data.totalAmount || 0);
          setRunningKmsInfo(res.data.runningKmsInfo); // Add this line
    } catch (err) {
      console.error('Error fetching maintenance entries:', err);
      toast.error('Failed to load maintenance entries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (vehicleNumber) {
      fetchMaintenanceEntries(pagination.currentPage);
    }
  }, [vehicleNumber]);

  // Sort entries based on selected criteria
  const getSortedEntries = () => {
    const entries = [...maintenanceEntries];
    
    switch (sortBy) {
      case 'date-asc':
        return entries.sort((a, b) => new Date(a.date) - new Date(b.date));
      case 'date-desc':
        return entries.sort((a, b) => new Date(b.date) - new Date(a.date));
      case 'amount-asc':
        return entries.sort((a, b) => parseFloat(a.amountSpent) - parseFloat(b.amountSpent));
      case 'amount-desc':
        return entries.sort((a, b) => parseFloat(b.amountSpent) - parseFloat(a.amountSpent));
      default:
        return entries;
    }
  };

  const handleDateFilterChange = (e) => {
    const { name, value } = e.target;
    setDateFilter(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const applyDateFilter = () => {
    if (dateFilter.startDate && dateFilter.endDate) {
      if (new Date(dateFilter.startDate) > new Date(dateFilter.endDate)) {
        toast.error('Start date cannot be after end date');
        return;
      }
    }
    fetchMaintenanceEntries(1);
  };

  const clearDateFilter = () => {
    setDateFilter({
      startDate: '',
      endDate: ''
    });
    fetchMaintenanceEntries(1);
  };

  const handleFileChange = (e) => {
    setFormData(prev => ({
      ...prev,
      files: [...prev.files, ...Array.from(e.target.files)]
    }));
  };

  const removeFile = (index, type) => {
    setFormData(prev => {
      if (type === 'existing') {
        const updatedExistingUrls = prev.existingImageUrls.filter((_, i) => i !== index);
        return {
          ...prev,
          existingImageUrls: updatedExistingUrls
        };
      } else {
        const updatedFiles = prev.files.filter((_, i) => i !== index);
        return {
          ...prev,
          files: updatedFiles
        };
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.date || !formData.mileageReading || !formData.maintenanceWork) {
      toast.error('Please fill all required fields');
      return;
    }

    setSubmitting(true);
    try {
      const newUploadedUrls = [];
      for (const file of formData.files) {
        const fileFormData = new FormData();
        fileFormData.append('file', file);
        fileFormData.append('upload_preset', 'todo_uploads');
        
        const uploadRes = await fetch('https://api.cloudinary.com/v1_1/dcr8k5amk/image/upload', {
          method: 'POST',
          body: fileFormData
        });
        
        const uploadData = await uploadRes.json();
        if (uploadData.secure_url) {
          newUploadedUrls.push(uploadData.secure_url);
        }
      }

      const allImageUrls = [...formData.existingImageUrls, ...newUploadedUrls];

      const payload = {
        date: formData.date,
        mileageReading: formData.mileageReading,
        maintenanceWork: formData.maintenanceWork,
        amountSpent: formData.amountSpent || '0',
        remarks: formData.remarks,
        imageUrls: allImageUrls
      };

      if (editingEntry) {
        await axiosInstance.put(`/maintenance-log/${editingEntry._id}`, payload, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        toast.success('Maintenance entry updated');
      } else {
        payload.vehicleNumber = vehicleNumber;
        await axiosInstance.post('/maintenance-log', payload, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        toast.success('Maintenance entry added');
      }

      setShowForm(false);
      setEditingEntry(null);
      resetForm();
      fetchMaintenanceEntries(pagination.currentPage);
    } catch (err) {
      console.error('Error saving maintenance entry:', err);
      toast.error('Failed to save entry');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      mileageReading: '',
      maintenanceWork: '',
      amountSpent: '',
      remarks: '',
      files: [],
      existingImageUrls: []
    });
  };

  const handleEdit = (entry) => {
    setEditingEntry(entry);
    setFormData({
      date: entry.date.split('T')[0],
      mileageReading: entry.mileageReading,
      maintenanceWork: entry.maintenanceWork,
      amountSpent: entry.amountSpent,
      remarks: entry.remarks || '',
      files: [],
      existingImageUrls: entry.imageUrls || []
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'This will delete the entry and all associated files permanently!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!',
      background: '#fff',
      customClass: {
        popup: 'rounded-xl'
      }
    });

    if (result.isConfirmed) {
      try {
        const entryToDelete = maintenanceEntries.find(entry => entry._id === id);
        
        if (entryToDelete && entryToDelete.imageUrls && entryToDelete.imageUrls.length > 0) {
          for (const imageUrl of entryToDelete.imageUrls) {
            try {
              const urlParts = imageUrl.split('/');
              const fileNameWithExtension = urlParts[urlParts.length - 1];
              const publicId = fileNameWithExtension.split('.')[0];
              
              await axiosInstance.post('/maintenance-log/delete-image', {
                public_id: publicId
              }, {
                headers: { Authorization: `Bearer ${token}` }
              });
            } catch (cloudinaryErr) {
              console.warn('Failed to delete file from Cloudinary:', cloudinaryErr);
            }
          }
        }

        await axiosInstance.delete(`/maintenance-log/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        toast.success('Entry and associated files deleted successfully');
        fetchMaintenanceEntries(pagination.currentPage);
      } catch (err) {
        console.error('Error deleting entry:', err);
        toast.error('Failed to delete entry');
      }
    }
  };

  const renderFilePreviews = () => {
    const allFiles = [
      ...formData.existingImageUrls.map(url => ({ type: 'existing', data: url })),
      ...formData.files.map(file => ({ type: 'new', data: file }))
    ];

    if (allFiles.length === 0) return null;

    return (
      <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {allFiles.map((item, index) => {
          const isExisting = item.type === 'existing';
          const isImage = isExisting ? true : item.data.type.startsWith('image/');
          const previewUrl = isExisting ? item.data : URL.createObjectURL(item.data);
          const fileName = isExisting ? `File ${index + 1}` : item.data.name;

          return (
            <div key={index} className="relative border border-gray-200 rounded-lg p-2 bg-white shadow-sm hover:shadow-md transition-shadow duration-200">
              {isImage ? (
                <img 
                  src={previewUrl} 
                  alt={`preview-${index}`} 
                  className="h-20 w-full object-cover rounded-md"
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-20 bg-gray-50 rounded-md text-sm p-2">
                  <div className="text-2xl mb-1">📄</div>
                  <span className="text-xs text-center text-gray-600 truncate w-full">
                    {fileName}
                  </span>
                </div>
              )}
              <button
                type="button"
                onClick={() => removeFile(index, item.type)}
                className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors duration-200 shadow-md"
                disabled={submitting}
              >
                ×
              </button>
              {isExisting && (
                <span className="absolute -top-2 -left-2 bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full text-[10px] font-medium shadow-md">
                  Existing
                </span>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const formatDateToDDMMYYYY = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const openFileViewer = (url, index) => {
    const isImage = url.match(/\.(jpeg|jpg|gif|png|bmp|webp)$/i);
    
    if (isImage) {
      Swal.fire({
        imageUrl: url,
        imageAlt: `Maintenance document ${index + 1}`,
        showCloseButton: true,
        showConfirmButton: false,
        background: 'transparent',
        backdrop: 'rgba(0,0,0,0.9)',
        width: 'auto',
        padding: '0',
        customClass: {
          popup: 'rounded-lg'
        }
      });
    } else {
      Swal.fire({
        title: 'Document Viewer',
        html: `
          <div class="h-96 w-full bg-gray-100 rounded-lg overflow-hidden">
            <iframe src="${url}" class="w-full h-full border-0"></iframe>
          </div>
          <div class="mt-4 text-center">
            <a href="${url}" target="_blank" class="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
              </svg>
              Open in new tab
            </a>
          </div>
        `,
        showCloseButton: true,
        showConfirmButton: false,
        width: '90%',
        padding: '20px',
        background: '#fff',
        customClass: {
          popup: 'rounded-xl'
        }
      });
    }
  };

  const sortedEntries = getSortedEntries();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      {/* Loader Overlay */}
      {submitting && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-60">
          <div className="bg-white rounded-xl p-6 flex flex-col items-center shadow-2xl">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-700 font-medium">
              {editingEntry ? 'Updating entry...' : 'Adding new entry...'}
            </p>
          </div>
        </div>
      )}
      
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-7xl max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 sm:p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 flex-shrink-0">
          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Maintenance Log Book</h3>
            <p className="text-sm sm:text-base text-gray-600 mt-1">Vehicle: {vehicleNumber}</p>
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-700 p-2 hover:bg-white rounded-lg transition-colors duration-200"
            disabled={submitting}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Main Content - Fixed scrolling area */}
        <div className="flex-1 overflow-auto">
          <div className="flex flex-col">
            {/* Filters and Controls */}
            <div className="p-4 sm:p-6 border-b border-gray-200 bg-white flex-shrink-0">
              {/* Date Filter Section */}
              <div className="bg-gray-50 p-4 rounded-xl mb-4 border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-3">Date Filter</h4>
                <div className="flex flex-col lg:flex-row gap-4 items-end">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                      <input
                        type="date"
                        name="startDate"
                        value={dateFilter.startDate}
                        onChange={handleDateFilterChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                        disabled={submitting}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                      <input
                        type="date"
                        name="endDate"
                        value={dateFilter.endDate}
                        onChange={handleDateFilterChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                        disabled={submitting}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={applyDateFilter}
                      disabled={submitting}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors duration-200 font-medium"
                    >
                      Apply Filter
                    </button>
                    <button
                      onClick={clearDateFilter}
                      disabled={submitting}
                      className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 disabled:bg-gray-400 transition-colors duration-200 font-medium"
                    >
                      Clear
                    </button>
                  </div>
                </div>
                
                {/* Total Amount Display */}
                <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
                  <div className="flex flex-col sm:flex-row justify-between items-center">
                    <span className="font-semibold text-gray-900 text-lg">Total Amount Spent on Repair & Maintenance:</span>
                    <span className="text-2xl font-bold text-green-600 mt-1 sm:mt-0">
                      ₹{totalAmount.toLocaleString()}
                      {dateFilter.startDate && dateFilter.endDate && (
                        <span className="text-sm font-normal text-gray-600 ml-2 block sm:inline text-center sm:text-left">
                          (Filtered: {formatDateToDDMMYYYY(dateFilter.startDate)} to {formatDateToDDMMYYYY(dateFilter.endDate)})
                        </span>
                      )}
                    </span>
                  </div>
                </div>
                {/* Running Kilometers Display */}
{runningKmsInfo && (
  <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200 shadow-sm">
    <h5 className="font-semibold text-green-900 mb-3 text-lg">Running Kilometers Analysis</h5>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
      <div className="bg-white rounded-lg p-3 border border-green-100">
        <div className="text-sm text-green-700 font-medium mb-1">Start</div>
        <div className="text-lg font-bold text-green-900">{runningKmsInfo.startKms.toLocaleString()} km</div>
        <div className="text-xs text-green-600 mt-1">
          {formatDateToDDMMYYYY(runningKmsInfo.startDate)}
        </div>
      </div>
      <div className="bg-white rounded-lg p-3 border border-green-100">
        <div className="text-sm text-green-700 font-medium mb-1">End</div>
        <div className="text-lg font-bold text-green-900">{runningKmsInfo.endKms.toLocaleString()} km</div>
        <div className="text-xs text-green-600 mt-1">
          {formatDateToDDMMYYYY(runningKmsInfo.endDate)}
        </div>
      </div>
      <div className="bg-white rounded-lg p-3 border border-green-100">
        <div className="text-sm text-green-700 font-medium mb-1">Net Running</div>
        <div className="text-2xl font-bold text-green-600">{runningKmsInfo.netRunningKms.toLocaleString()} km</div>
        <div className="text-xs text-green-600 mt-1">Distance covered</div>
      </div>
    </div>
    {runningKmsInfo.netRunningKms > 0 && (
      <div className="mt-3 text-center">
        <p className="text-sm text-green-700">
          Maintenance performed over <strong>{runningKmsInfo.netRunningKms.toLocaleString()} km </strong> 
          from {formatDateToDDMMYYYY(runningKmsInfo.startDate)} to {formatDateToDDMMYYYY(runningKmsInfo.endDate)}
        </p>
      </div>
    )}
  </div>
)}
              </div>

              {/* Controls */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowForm(!showForm)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors duration-200 font-medium flex items-center gap-2"
                    disabled={submitting}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    {showForm ? 'Cancel' : 'Add New Entry'}
                  </button>
                </div>

                <div className="flex gap-3">
                  {/* View Mode Toggle */}
                  <div className="flex bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => setViewMode('table')}
                      className={`px-3 py-1 rounded-md text-sm font-medium transition-colors duration-200 ${
                        viewMode === 'table' 
                          ? 'bg-white text-blue-600 shadow-sm' 
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Table
                    </button>
                    <button
                      onClick={() => setViewMode('card')}
                      className={`px-3 py-1 rounded-md text-sm font-medium transition-colors duration-200 ${
                        viewMode === 'card' 
                          ? 'bg-white text-blue-600 shadow-sm' 
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Cards
                    </button>
                  </div>

                  {/* Sort Dropdown */}
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 text-sm"
                  >
                    <option value="date-desc">Newest First</option>
                    <option value="date-asc">Oldest First</option>
                    <option value="amount-desc">Highest Amount</option>
                    <option value="amount-asc">Lowest Amount</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Form */}
            {showForm && (
              <div className="p-4 sm:p-6 border-b border-gray-200 bg-gray-50 flex-shrink-0">
                <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <h4 className="text-lg font-semibold text-gray-900 mb-6">
                    {editingEntry ? `Edit Maintenance Entry` : 'Add New Maintenance Entry'}
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Date *</label>
                      <input
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData(prev => ({...prev, date: e.target.value}))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                        required
                        disabled={submitting}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Kms/Mileage Reading *</label>
                      <input
                        type="number"
                        value={formData.mileageReading}
                        onChange={(e) => setFormData(prev => ({...prev, mileageReading: e.target.value}))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                        required
                        disabled={submitting}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Type of Maintenance Work *</label>
                      <textarea
                        value={formData.maintenanceWork}
                        onChange={(e) => setFormData(prev => ({...prev, maintenanceWork: e.target.value}))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                        rows="3"
                        required
                        disabled={submitting}
                        placeholder="Describe the maintenance work performed..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Amount Spent (₹)</label>
                      <input
                        type="number"
                        value={formData.amountSpent}
                        onChange={(e) => setFormData(prev => ({...prev, amountSpent: e.target.value}))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                        disabled={submitting}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Remarks (can mention Supplier name/Mechanic name)</label>
                      <input
                        type="text"
                        value={formData.remarks}
                        onChange={(e) => setFormData(prev => ({...prev, remarks: e.target.value}))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                        disabled={submitting}
                        placeholder="Additional notes..."
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Pictures/Bills</label>
                      <input
                        type="file"
                        multiple
                        accept="image/*,.pdf"
                        onChange={handleFileChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        disabled={submitting}
                      />
                      
                      {renderFilePreviews()}
                      
                      {editingEntry && formData.existingImageUrls.length > 0 && (
                        <p className="text-xs text-gray-600 mt-3 flex items-center gap-1">
                          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                          Blue "Existing" tags show files already attached to this entry. 
                          You can remove them or add new files.
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-3 mt-6">
                    <button 
                      type="submit" 
                      className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400 transition-colors duration-200 flex items-center justify-center gap-2"
                      disabled={submitting}
                    >
                      {submitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          {editingEntry ? 'Updating...' : 'Adding...'}
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          {editingEntry ? 'Update Entry' : 'Add Entry'}
                        </>
                      )}
                    </button>
                    
                    {editingEntry && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowForm(false);
                          setEditingEntry(null);
                          resetForm();
                        }}
                        className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors duration-200"
                        disabled={submitting}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </div>
            )}

            {/* Content Area */}
            <div className="p-4 sm:p-6">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600 font-medium">Loading maintenance entries...</p>
                </div>
              ) : (
                <>
                  {/* Table View */}
                  {viewMode === 'table' && (
                    <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-200">
                      <table className="min-w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kms Reading</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Maintenance Work</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount (₹)</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Documents</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remarks</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {sortedEntries.map((entry) => (
                            <tr key={entry._id} className="hover:bg-gray-50 transition-colors duration-150">
                              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                                {formatDateToDDMMYYYY(entry.date)}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                {entry.mileageReading}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900 max-w-xs">
                                <div className="line-clamp-2">{entry.maintenanceWork}</div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-green-600">
                                ₹{entry.amountSpent}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex gap-1 flex-wrap">
                                  {entry.imageUrls?.map((url, index) => (
                                    <button 
                                      key={index} 
                                      onClick={() => openFileViewer(url, index)}
                                      className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-lg hover:bg-blue-100 transition-colors duration-200 border border-blue-200"
                                      disabled={submitting}
                                    >
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                      </svg>
                                      Doc {index + 1}
                                    </button>
                                  ))}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600 max-w-xs">
                                <div className="line-clamp-2">{entry.remarks || '-'}</div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm">
                                <div className="flex gap-2">
                                  <button 
                                    onClick={() => handleEdit(entry)} 
                                    className="text-blue-600 hover:text-blue-800 font-medium transition-colors duration-200 flex items-center gap-1"
                                    disabled={submitting}
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                    Edit
                                  </button>
                                  <button 
                                    onClick={() => handleDelete(entry._id)} 
                                    className="text-red-600 hover:text-red-800 font-medium transition-colors duration-200 flex items-center gap-1"
                                    disabled={submitting}
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Card View */}
                  {viewMode === 'card' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {sortedEntries.map((entry) => (
                        <div key={entry._id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow duration-200">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h4 className="font-semibold text-gray-900 text-lg">
                                {formatDateToDDMMYYYY(entry.date)}
                              </h4>
                              <p className="text-sm text-gray-600">Kms: {entry.mileageReading}</p>
                            </div>
                            <span className="text-lg font-bold text-green-600">₹{entry.amountSpent}</span>
                          </div>
                          
                          <div className="mb-3">
                            <p className="text-sm text-gray-700 line-clamp-3">{entry.maintenanceWork}</p>
                          </div>
                          
                          {entry.remarks && (
                            <div className="mb-3">
                              <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded-lg">
                                <span className="font-medium">Remarks:</span> {entry.remarks}
                              </p>
                            </div>
                          )}
                          
                          <div className="flex flex-wrap gap-1 mb-4">
                            {entry.imageUrls?.map((url, index) => (
                              <button 
                                key={index} 
                                onClick={() => openFileViewer(url, index)}
                                className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-lg hover:bg-blue-100 transition-colors duration-200 border border-blue-200"
                                disabled={submitting}
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                Doc {index + 1}
                              </button>
                            ))}
                          </div>
                          
                          <div className="flex gap-2 pt-3 border-t border-gray-100">
                            <button 
                              onClick={() => handleEdit(entry)} 
                              className="flex-1 bg-blue-50 text-blue-700 py-2 px-3 rounded-lg font-medium hover:bg-blue-100 transition-colors duration-200 text-sm flex items-center justify-center gap-1"
                              disabled={submitting}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              Edit
                            </button>
                            <button 
                              onClick={() => handleDelete(entry._id)} 
                              className="flex-1 bg-red-50 text-red-700 py-2 px-3 rounded-lg font-medium hover:bg-red-100 transition-colors duration-200 text-sm flex items-center justify-center gap-1"
                              disabled={submitting}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Empty State */}
                  {sortedEntries.length === 0 && !loading && (
                    <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
                      <div className="text-gray-400 text-6xl mb-4">🔧</div>
                      <h3 className="text-lg font-semibold text-gray-600 mb-2">No maintenance entries found</h3>
                      <p className="text-gray-500 mb-6">Start by adding your first maintenance entry</p>
                      <button
                        onClick={() => setShowForm(true)}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
                      >
                        Add First Entry
                      </button>
                    </div>
                  )}

                  {/* Pagination */}
                  {sortedEntries.length > 0 && (
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6 p-4 bg-white rounded-xl shadow-sm border border-gray-200">
                      <div className="text-sm text-gray-600">
                        Showing {sortedEntries.length} of {pagination.totalEntries} entries
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => fetchMaintenanceEntries(pagination.currentPage - 1)}
                          disabled={!pagination.hasPrev || submitting}
                          className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2 ${
                            !pagination.hasPrev || submitting 
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                              : 'bg-blue-600 text-white hover:bg-blue-700'
                          }`}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                          Previous
                        </button>
                        
                        <span className="px-4 py-2 text-sm font-medium text-gray-700">
                          Page {pagination.currentPage} of {pagination.totalPages}
                        </span>
                        
                        <button
                          onClick={() => fetchMaintenanceEntries(pagination.currentPage + 1)}
                          disabled={!pagination.hasNext || submitting}
                          className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2 ${
                            !pagination.hasNext || submitting 
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                              : 'bg-blue-600 text-white hover:bg-blue-700'
                          }`}
                        >
                          Next
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MaintenanceLogBook;