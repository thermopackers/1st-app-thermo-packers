import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import axiosInstance from '../axiosInstance';
import InternalNavbar from '../components/InternalNavbar';

const GuardEntryForm = () => {
  const navigate = useNavigate();
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [suppliers, setSuppliers] = useState([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [entryNumber, setEntryNumber] = useState('');

  useEffect(() => {
    fetchSuppliers();
    generateEntryNumber();
  }, []);

  // Add this useEffect to periodically refresh the entry number
useEffect(() => {
  const interval = setInterval(() => {
    generateEntryNumber();
  }, 30000); // Refresh every 30 seconds

  return () => clearInterval(interval);
}, []);

  useEffect(() => {
    // Filter suppliers based on search query
    if (searchQuery.trim() === '') {
      setFilteredSuppliers(suppliers);
    } else {
      const filtered = suppliers.filter(supplier =>
        supplier.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredSuppliers(filtered);
    }
  }, [searchQuery, suppliers]);

  const fetchSuppliers = async () => {
    try {
      const res = await axiosInstance.get('/suppliers/all');
      setSuppliers(res.data.data || []);
      setFilteredSuppliers(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch suppliers', err);
      Swal.fire('Error', 'Failed to load suppliers', 'error');
    }
  };

const generateEntryNumber = async () => {
  try {
    // Get the latest entry to determine the next number
    const res = await axiosInstance.get('/guard-entries?page=1&limit=1&sort=-createdAt');
    const latestEntries = res.data.entries || [];
    
    let nextNumber = 1;
    if (latestEntries.length > 0) {
      // Extract number from the latest entry's entryNumber
      const latestEntryNumber = latestEntries[0].entryNumber;
      if (latestEntryNumber && latestEntryNumber.startsWith('TPGI')) {
        const numberPart = latestEntryNumber.replace('TPGI', '');
        const currentNumber = parseInt(numberPart, 10);
        if (!isNaN(currentNumber)) {
          nextNumber = currentNumber + 1;
        }
      }
    }
    
    setEntryNumber(`TPGI${String(nextNumber).padStart(2, '0')}`);
    
  } catch (err) {
    console.error('Failed to generate entry number:', err);
    // Fallback: show placeholder
    setEntryNumber('TPGI--');
  }
};

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + photos.length > 5) {
      Swal.fire('Warning', 'Maximum 5 photos allowed', 'warning');
      return;
    }
    setPhotos(prev => [...prev, ...files]);
  };

  const removePhoto = (index) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSupplierSelect = (supplier) => {
    setSupplierId(supplier._id);
    setSearchQuery(supplier.name);
    setShowDropdown(false);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setShowDropdown(true);
    if (!e.target.value) {
      setSupplierId('');
    }
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  
  if (!vehicleNumber || !supplierId || photos.length === 0) {
    Swal.fire('Warning', 'Please fill all fields and upload at least one photo', 'warning');
    return;
  }

  setLoading(true);
  try {
    const formData = new FormData();
    formData.append('vehicleNumber', vehicleNumber);
    formData.append('supplierId', supplierId);
    
    photos.forEach(photo => {
      formData.append('photos', photo);
    });

    const response = await axiosInstance.post('/guard-entries', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    const guardEntry = response.data.entry;

    Swal.fire({
      title: 'Success!',
      html: `
        <div class="text-center">
          <div class="text-4xl mb-4">✅</div>
          <div class="font-bold text-lg">Entry Recorded Successfully!</div>
          <div class="mt-2 text-blue-600 font-mono text-xl">${guardEntry.entryNumber}</div>
          <div class="mt-2 text-gray-600">Vehicle: ${vehicleNumber}</div>
          ${guardEntry.entryNumber !== entryNumber ? 
            `<div class="mt-1 text-sm text-green-600">Entry number updated from ${entryNumber}</div>` : 
            ''
          }
        </div>
      `,
      icon: 'success'
    });

    // Reset form and regenerate entry number
    setVehicleNumber('');
    setSupplierId('');
    setSearchQuery('');
    setPhotos([]);
    await generateEntryNumber(); // Regenerate for next entry
    
  } catch (err) {
    console.error('Failed to submit entry', err);
    Swal.fire('Error', err.response?.data?.message || 'Failed to record entry', 'error');
  } finally {
    setLoading(false);
  }
};

  const handleViewEntries = () => {
    navigate('/guard-entries-view');
  };

  const clearSupplierSelection = () => {
    setSupplierId('');
    setSearchQuery('');
    setShowDropdown(true);
  };

  return (
    <>
      <InternalNavbar />
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Header with View Button */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              🚗 Vehicle Entry Record
            </h2>
            <button
              onClick={handleViewEntries}
              className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition flex items-center gap-2"
            >
              <span>📋</span>
              View All Entries
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            {/* Entry Number Display */}
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
              <div className="text-sm text-blue-600 font-medium mb-1">ENTRY NUMBER</div>
              <div className="text-2xl font-bold text-blue-800 font-mono">{entryNumber}</div>
              <div className="text-xs text-blue-500 mt-1">Thermo Packers Guard Entry</div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Vehicle Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vehicle Number *
                </label>
                <input
                  type="text"
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                  placeholder="e.g. PB08AB1234"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Supplier Selection with Search */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Supplier Name *
                </label>
                
                {/* Search Input */}
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    onFocus={() => setShowDropdown(true)}
                    placeholder="Search supplier by name..."
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                  />
                  
                  {/* Clear Button */}
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={clearSupplierSelection}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      ✕
                    </button>
                  )}
                  
                  {/* Search Icon */}
                  {!searchQuery && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                      🔍
                    </div>
                  )}
                </div>

                {/* Dropdown Results */}
                {showDropdown && filteredSuppliers.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredSuppliers.map(supplier => (
                      <div
                        key={supplier._id}
                        onClick={() => handleSupplierSelect(supplier)}
                        className={`px-4 py-3 cursor-pointer hover:bg-blue-50 transition ${
                          supplierId === supplier._id ? 'bg-blue-100' : ''
                        }`}
                      >
                        <div className="font-medium text-gray-900">{supplier.name}</div>
                        {supplier.contactPerson && (
                          <div className="text-sm text-gray-600 mt-1">
                            Contact: {supplier.contactPerson}
                          </div>
                        )}
                        {supplier.phone && (
                          <div className="text-sm text-gray-600">
                            Phone: {supplier.phone}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* No Results Message */}
                {showDropdown && searchQuery && filteredSuppliers.length === 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4 text-center text-gray-500">
                    No suppliers found matching "{searchQuery}"
                  </div>
                )}

                {/* Selected Supplier Display */}
                {supplierId && (
                  <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="font-medium text-green-800">
                          ✅ Selected: {suppliers.find(s => s._id === supplierId)?.name}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={clearSupplierSelection}
                        className="text-green-600 hover:text-green-800 text-sm"
                      >
                        Change
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Photo Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Photos (Max 5) *
                </label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3"
                />
                
                {/* Photo Previews */}
                {photos.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    {photos.map((photo, index) => (
                      <div key={index} className="relative">
                        <img
                          src={URL.createObjectURL(photo)}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removePhoto(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
               <button
  type="submit"
  disabled={loading || !supplierId}
  className={`flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold transition ${
    loading || !supplierId ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'
  }`}
>
  {loading ? `Recording ${entryNumber}...` : `Record ${entryNumber}`}
</button>
                
                <button
                  type="button"
                  onClick={handleViewEntries}
                  className="flex-1 bg-gray-500 text-white py-3 rounded-lg font-semibold hover:bg-gray-600 transition flex items-center justify-center gap-2"
                >
                  <span>📋</span>
                  View Entries
                </button>
              </div>
            </form>

            <div className="mt-6 text-center text-sm text-gray-500">
              <p>📍 All entries are automatically timestamped</p>
              <p>🔍 Type to search suppliers by name</p>
              <p className="font-medium text-blue-600 mt-2">Current Entry: {entryNumber}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Close dropdown when clicking outside */}
      {showDropdown && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowDropdown(false)}
        />
      )}
    </>
  );
};

export default GuardEntryForm;