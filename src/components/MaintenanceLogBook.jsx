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
  const [editingEntry, setEditingEntry] = useState(null);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    mileageReading: '',
    maintenanceWork: '',
    amountSpent: '',
    remarks: '',
    files: [],
    existingImageUrls: [] // NEW: Track existing URLs when editing
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalEntries: 0,
    hasNext: false,
    hasPrev: false
  });
  const [submitting, setSubmitting] = useState(false); // NEW: Loader state for form submission

  const fetchMaintenanceEntries = async (page = 1) => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/maintenance-log/${vehicleNumber}?page=${page}&limit=10`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMaintenanceEntries(res.data.entries);
      setPagination(res.data.pagination); // Set pagination info
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

  const handleFileChange = (e) => {
    setFormData(prev => ({
      ...prev,
      files: [...prev.files, ...Array.from(e.target.files)]
    }));
  };

  const removeFile = (index, type) => {
    setFormData(prev => {
      if (type === 'existing') {
        // Remove from existingImageUrls
        const updatedExistingUrls = prev.existingImageUrls.filter((_, i) => i !== index);
        return {
          ...prev,
          existingImageUrls: updatedExistingUrls
        };
      } else {
        // Remove from new files
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

    setSubmitting(true); // Start loader
    try {
      // Upload NEW files to Cloudinary
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

      // Combine existing URLs with newly uploaded URLs
      const allImageUrls = [...formData.existingImageUrls, ...newUploadedUrls];

      // Create JSON payload
      const payload = {
        date: formData.date,
        mileageReading: formData.mileageReading,
        maintenanceWork: formData.maintenanceWork,
        amountSpent: formData.amountSpent || '0',
        remarks: formData.remarks,
        imageUrls: allImageUrls // ← Send as array directly
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
      setFormData({
        date: new Date().toISOString().split('T')[0],
        mileageReading: '',
        maintenanceWork: '',
        amountSpent: '',
        remarks: '',
        files: [],
        existingImageUrls: []
      });
      fetchMaintenanceEntries(pagination.currentPage);
    } catch (err) {
      console.error('Error saving maintenance entry:', err);
      toast.error('Failed to save entry');
    } finally {
      setSubmitting(false); // Stop loader
    }
  };

  const handleEdit = (entry) => {
    setEditingEntry(entry);
    setFormData({
      date: entry.date.split('T')[0],
      mileageReading: entry.mileageReading,
      maintenanceWork: entry.maintenanceWork,
      amountSpent: entry.amountSpent,
      remarks: entry.remarks || '',
      files: [], // New files to be added
      existingImageUrls: entry.imageUrls || [] // PRESERVE existing URLs
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
    confirmButtonText: 'Yes, delete it!'
  });

  if (result.isConfirmed) {
    try {
      // First, get the entry to access the image URLs
      const entryToDelete = maintenanceEntries.find(entry => entry._id === id);
      
      if (entryToDelete && entryToDelete.imageUrls && entryToDelete.imageUrls.length > 0) {
        // Delete files from Cloudinary
        for (const imageUrl of entryToDelete.imageUrls) {
          try {
            // Extract public_id from Cloudinary URL
            const urlParts = imageUrl.split('/');
            const fileNameWithExtension = urlParts[urlParts.length - 1];
            const publicId = fileNameWithExtension.split('.')[0];
            
            // Delete from Cloudinary
            await axiosInstance.post('/maintenance-log/delete-image', {
              public_id: publicId
            }, {
              headers: { Authorization: `Bearer ${token}` }
            });
          } catch (cloudinaryErr) {
            console.warn('Failed to delete file from Cloudinary:', cloudinaryErr);
            // Continue with deletion even if Cloudinary deletion fails
          }
        }
      }

      // Then delete the database entry
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

  // Function to render file previews (both existing and new)
  const renderFilePreviews = () => {
    const allFiles = [
      ...formData.existingImageUrls.map(url => ({ type: 'existing', data: url })),
      ...formData.files.map(file => ({ type: 'new', data: file }))
    ];

    if (allFiles.length === 0) return null;

    return (
      <div className="mt-2 grid grid-cols-3 gap-2">
        {allFiles.map((item, index) => {
          const isExisting = item.type === 'existing';
          const isImage = isExisting ? true : item.data.type.startsWith('image/');
          const previewUrl = isExisting ? item.data : URL.createObjectURL(item.data);
          const fileName = isExisting ? `File ${index + 1}` : item.data.name;

          return (
            <div key={index} className="relative border rounded p-1">
              {isImage ? (
                <img src={previewUrl} alt={`preview-${index}`} className="h-20 object-cover w-full rounded" />
              ) : (
                <div className="flex items-center justify-center h-20 bg-gray-100 text-sm">
                  📄 {fileName}
                </div>
              )}
              <button
                type="button"
                onClick={() => removeFile(index, item.type)}
                className="absolute top-1 right-1 bg-red-600 text-white text-xs px-1 rounded-full"
              >
                ×
              </button>
              {isExisting && (
                <span className="absolute top-1 left-1 bg-blue-600 text-white text-xs px-1 rounded">Existing</span>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // Add this helper function
const formatDateToDDMMYYYY = (dateString) => {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      {/* Loader Overlay */}
      {submitting && (
        <div className="fixed inset-0 bg-[#000000c4] bg-opacity-70 flex items-center justify-center z-60">
          <div className="bg-white rounded-lg p-6 flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-700">
              {editingEntry ? 'Updating entry...' : 'Adding new entry...'}
            </p>
          </div>
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-semibold">Maintenance Log Book - {vehicleNumber}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>
        
        <div className="p-4 overflow-auto max-h-[80vh]">
          <div className="flex justify-between mb-4">
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-blue-600 text-white px-4 py-2 rounded"
              disabled={submitting} // Disable button while submitting
            >
              {showForm ? 'Cancel' : 'Add New Entry'}
            </button>
          </div>

          {showForm && (
            <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded mb-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Date *</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({...prev, date: e.target.value}))}
                    className="w-full p-2 border rounded"
                    required
                    disabled={submitting} // Disable inputs while submitting
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Kms/Mileage Reading *</label>
                  <input
                    type="number"
                    value={formData.mileageReading}
                    onChange={(e) => setFormData(prev => ({...prev, mileageReading: e.target.value}))}
                    className="w-full p-2 border rounded"
                    required
                    disabled={submitting}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Type of Maintenance Work *</label>
                  <textarea
                    value={formData.maintenanceWork}
                    onChange={(e) => setFormData(prev => ({...prev, maintenanceWork: e.target.value}))}
                    className="w-full p-2 border rounded"
                    rows="3"
                    required
                    disabled={submitting}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Amount Spent (₹)</label>
                  <input
                    type="number"
                    value={formData.amountSpent}
                    onChange={(e) => setFormData(prev => ({...prev, amountSpent: e.target.value}))}
                    className="w-full p-2 border rounded"
                    disabled={submitting}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Remarks</label>
                  <input
                    type="text"
                    value={formData.remarks}
                    onChange={(e) => setFormData(prev => ({...prev, remarks: e.target.value}))}
                    className="w-full p-2 border rounded"
                    disabled={submitting}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Pictures/Bills</label>
                  <input
                    type="file"
                    multiple
                    accept="image/*,.pdf"
                    onChange={handleFileChange}
                    className="w-full p-2 border rounded"
                    disabled={submitting}
                  />
                  
                  {/* Show both existing and new files */}
                  {renderFilePreviews()}
                  
                  {/* Show message if editing with existing files */}
                  {editingEntry && formData.existingImageUrls.length > 0 && (
                    <p className="text-xs text-gray-600 mt-2">
                      💡 Blue "Existing" tags show files already attached to this entry. 
                      You can remove them or add new files.
                    </p>
                  )}
                </div>
              </div>
              <button 
                type="submit" 
                className="mt-4 bg-green-600 text-white px-4 py-2 rounded flex items-center justify-center"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {editingEntry ? 'Updating...' : 'Adding...'}
                  </>
                ) : (
                  editingEntry ? 'Update Entry' : 'Add Entry'
                )}
              </button>
            </form>
          )}

          {loading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading entries...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white rounded shadow">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-3 text-left">Date</th>
                    <th className="p-3 text-left">Kms Reading</th>
                    <th className="p-3 text-left">Maintenance Work</th>
                    <th className="p-3 text-left">Amount (₹)</th>
                    <th className="p-3 text-left">Pictures/Bills</th>
                    <th className="p-3 text-left">Remarks</th>
                    <th className="p-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {maintenanceEntries.map((entry) => (
                    <tr key={entry._id} className="border-b">
<td className="p-3">{formatDateToDDMMYYYY(entry.date)}</td>
                      <td className="p-3">{entry.mileageReading}</td>
                      <td className="p-3 whitespace-normal max-w-xs">{entry.maintenanceWork}</td>
                      <td className="p-3">₹{entry.amountSpent}</td>
                      <td className="p-3">
                        <div className="flex gap-1 flex-wrap">
                          {entry.imageUrls?.map((url, index) => (
                            <button 
                              key={index} 
                              onClick={() => {
                                // Check if it's an image or PDF
                                const isImage = url.match(/\.(jpeg|jpg|gif|png|bmp|webp)$/i);
                                
                                if (isImage) {
                                  // Show image in modal
                                  Swal.fire({
                                    imageUrl: url,
                                    imageAlt: `Maintenance document ${index + 1}`,
                                    showCloseButton: true,
                                    showConfirmButton: false,
                                    background: 'transparent',
                                    backdrop: 'rgba(0,0,0,0.8)',
                                    width: 'auto',
                                    padding: '0'
                                  });
                                } else {
                                  // Show PDF in iframe or download link
                                  Swal.fire({
                                    title: 'Document Viewer',
                                    html: `
                                      <div style="height: 70vh; width: 100%;">
                                        <iframe src="${url}" style="width: 100%; height: 100%; border: none;"></iframe>
                                      </div>
                                      <div class="mt-3">
                                        <a href="${url}" target="_blank" class="text-blue-600 hover:underline">Open in new tab</a>
                                      </div>
                                    `,
                                    showCloseButton: true,
                                    showConfirmButton: false,
                                    width: '90%',
                                    padding: '20px'
                                  });
                                }
                              }}
                              className="text-blue-600 text-xs border border-blue-200 px-2 py-1 rounded hover:bg-blue-50 cursor-pointer"
                              disabled={submitting} // Disable while submitting
                            >
                              File {index + 1}
                            </button>
                          ))}
                        </div>
                      </td>
                      <td className="p-3">{entry.remarks}</td>
                      <td className="p-3">
                        <button 
                          onClick={() => handleEdit(entry)} 
                          className="text-yellow-600 mr-2 hover:underline"
                          disabled={submitting} // Disable while submitting
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDelete(entry._id)} 
                          className="text-red-600 hover:underline"
                          disabled={submitting} // Disable while submitting
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {maintenanceEntries.length > 0 && (
                <div className="flex justify-between items-center mt-4">
                  <button
                    onClick={() => fetchMaintenanceEntries(pagination.currentPage - 1)}
                    disabled={!pagination.hasPrev || submitting}
                    className={`px-4 py-2 rounded ${!pagination.hasPrev || submitting ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-blue-600 text-white'}`}
                  >
                    Previous
                  </button>
                  
                  <span className="text-sm text-gray-600">
                    Page {pagination.currentPage} of {pagination.totalPages} 
                    ({pagination.totalEntries} total entries)
                  </span>
                  
                  <button
                    onClick={() => fetchMaintenanceEntries(pagination.currentPage + 1)}
                    disabled={!pagination.hasNext || submitting}
                    className={`px-4 py-2 rounded ${!pagination.hasNext || submitting ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-blue-600 text-white'}`}
                  >
                    Next
                  </button>
                </div>
              )}
              {maintenanceEntries.length === 0 && !loading && (
                <div className="text-center py-6 text-gray-500">No maintenance entries found</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MaintenanceLogBook;