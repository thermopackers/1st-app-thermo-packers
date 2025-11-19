import React, { useState, useEffect, useRef } from 'react';
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
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [purchaseProducts, setPurchaseProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [entryNumber, setEntryNumber] = useState('');
  const [isRejected, setIsRejected] = useState(false);
  const [customerId, setCustomerId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [showManualCustomer, setShowManualCustomer] = useState(false);
  const [showManualSupplier, setShowManualSupplier] = useState(false);
  const [showManualProduct, setShowManualProduct] = useState(false); // New state for manual product
  const [manualProductName, setManualProductName] = useState(''); // New state for manual product name
  const [remarks, setRemarks] = useState(''); // New state for remarks
  const [currentDateTime, setCurrentDateTime] = useState(new Date()); // New state for live clock
const selectedProductsRef = useRef([]);

  // Live clock effect
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchSuppliers();
    fetchCustomers();
    fetchPurchaseProducts();
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

  useEffect(() => {
    // Filter customers based on search query
    if (customerSearchQuery.trim() === '') {
      setFilteredCustomers(customers);
    } else {
      const filtered = customers.filter(customer =>
        customer.name.toLowerCase().includes(customerSearchQuery.toLowerCase())
      );
      setFilteredCustomers(filtered);
    }
  }, [customerSearchQuery, customers]);

  useEffect(() => {
    // Filter products based on search query
    if (productSearchQuery.trim() === '') {
      setFilteredProducts(purchaseProducts);
    } else {
      const filtered = purchaseProducts.filter(product =>
        product.name.toLowerCase().includes(productSearchQuery.toLowerCase()) ||
        (product.code && product.code.toLowerCase().includes(productSearchQuery.toLowerCase()))
      );
      setFilteredProducts(filtered);
    }
  }, [productSearchQuery, purchaseProducts]);

  // Add this useEffect to monitor selectedProducts state
// useEffect(() => {
//   console.log('selectedProducts state updated:', selectedProducts);
// }, [selectedProducts]);

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

  const fetchCustomers = async () => {
    try {
      const res = await axiosInstance.get('/customers/all-customers');
      setCustomers(res.data.data || res.data.customers || []);
      setFilteredCustomers(res.data.data || res.data.customers || []);
    } catch (err) {
      console.error('Failed to fetch customers', err);
      Swal.fire('Error', 'Failed to load customers', 'error');
    }
  };

  const fetchPurchaseProducts = async () => {
    try {
      const res = await axiosInstance.get('/purchase-products');
      setPurchaseProducts(res.data.data || res.data.products || []);
      setFilteredProducts(res.data.data || res.data.products || []);
    } catch (err) {
      console.error('Failed to fetch purchase products', err);
      Swal.fire('Error', 'Failed to load purchase products', 'error');
    }
  };

  const generateEntryNumber = async () => {
    try {
      const res = await axiosInstance.get('/guard-entries?page=1&limit=1&sort=-createdAt');
      const latestEntries = res.data.entries || [];
      
      let nextNumber = 1;
      if (latestEntries.length > 0) {
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
    setShowManualSupplier(false);
    setSupplierName('');
  };

  const handleCustomerSelect = (customer) => {
    setCustomerId(customer._id);
    setCustomerSearchQuery(customer.name);
    setShowCustomerDropdown(false);
    setShowManualCustomer(false);
    setCustomerName('');
  };

  const handleProductSelect = (product) => {
    handleAddProduct(product);
    setProductSearchQuery('');
    setShowProductDropdown(false);
  };

// Replace your handleAddManualProduct function
const handleAddManualProduct = () => {
  
  if (!manualProductName.trim()) {
    Swal.fire('Warning', 'Please enter product name', 'warning');
    return;
  }

  const manualProduct = {
    _id: `manual_${Date.now()}`,
    name: manualProductName.trim(),
    isManual: true
  };

  
  // Directly update both state and ref to ensure it works
  setSelectedProducts(prev => {
    const newProducts = [...prev, { product: manualProduct, quantity: 1 }];
    selectedProductsRef.current = newProducts;
  return newProducts;
  });

  setManualProductName('');
  setShowManualProduct(false);
  
  // Show immediate success feedback
  Swal.fire({
    title: 'Product Added!',
    text: `"${manualProduct.name}" has been added to the entry`,
    icon: 'success',
    timer: 2000,
    showConfirmButton: false
  });
};

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setShowDropdown(true);
    if (!e.target.value) {
      setSupplierId('');
      setSupplierName('');
    }
  };

  const handleCustomerSearchChange = (e) => {
    setCustomerSearchQuery(e.target.value);
    setShowCustomerDropdown(true);
    if (!e.target.value) {
      setCustomerId('');
      setCustomerName('');
    }
  };

  const handleProductSearchChange = (e) => {
    setProductSearchQuery(e.target.value);
    setShowProductDropdown(true);
  };

const handleAddProduct = (product) => {
  
  setSelectedProducts(prev => {
    const existingProductIndex = prev.findIndex(p => {
      if (p.product.isManual && product.isManual) {
        return p.product.name === product.name;
      } else if (!p.product.isManual && !product.isManual) {
        return p.product._id === product._id;
      }
      return false;
    });
    
    let newProducts;
    if (existingProductIndex !== -1) {
      // Product exists, increase quantity
      newProducts = prev.map((p, index) => 
        index === existingProductIndex 
          ? { ...p, quantity: p.quantity + 1 }
          : p
      );
    } else {
      // Add new product
      newProducts = [...prev, { product, quantity: 1 }];
    }
    
    // Update the ref with the new state
    selectedProductsRef.current = newProducts;
 
    return newProducts;
  });
};

const handleRemoveProduct = (productId) => {
  
  setSelectedProducts(prev => {
    const newProducts = prev.filter(p => p.product._id !== productId);
    selectedProductsRef.current = newProducts;
    return newProducts;
  });
};

const handleQuantityChange = (productId, newQuantity) => {
  if (newQuantity < 1) return;
  
  setSelectedProducts(prev => {
    const newProducts = prev.map(p =>
      p.product._id === productId
        ? { ...p, quantity: newQuantity }
        : p
    );
    selectedProductsRef.current = newProducts;
    return newProducts;
  });
};

const handleSubmit = async (e) => {
  e.preventDefault();
  

  
  // Use the ref value which is always current
  const currentSelectedProducts = selectedProductsRef.current;
  
  // Validation based on rejection status
  if (!vehicleNumber || photos.length === 0) {
    Swal.fire('Warning', 'Please fill vehicle number and upload at least one photo', 'warning');
    return;
  }

  if (isRejected) {
    if (!customerId && !customerName) {
      Swal.fire('Warning', 'Please either select a customer or enter customer name for rejected entries', 'warning');
      return;
    }
  } else {
    if (!supplierId && !supplierName) {
      Swal.fire('Warning', 'Please either select a supplier or enter supplier name', 'warning');
      return;
    }
  }

  setLoading(true);
  try {
    const formData = new FormData();
    formData.append('vehicleNumber', vehicleNumber);
    formData.append('isRejected', isRejected.toString());
    formData.append('remarks', remarks);
    
    if (isRejected) {
      if (customerId) formData.append('customerId', customerId);
      if (customerName) formData.append('customerName', customerName);
    } else {
      if (supplierId) formData.append('supplierId', supplierId);
      if (supplierName) formData.append('supplierName', supplierName);
    }
    
    // Use the ref value for products
    if (currentSelectedProducts.length > 0) {
      const productsToSend = currentSelectedProducts.map(sp => {
        if (sp.product.isManual) {
          return {
            productName: sp.product.name,
            quantity: sp.quantity
          };
        } else {
          return {
            product: sp.product._id,
            quantity: sp.quantity
          };
        }
      });
      
      formData.append('purchaseProducts', JSON.stringify(productsToSend));
    } else {
      formData.append('purchaseProducts', JSON.stringify([]));
    }
    
    photos.forEach(photo => {
      formData.append('photos', photo);
    });

    // for (let [key, value] of formData.entries()) {
    //   console.log(key, value);
    // }

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
          ${guardEntry.isRejected ? '<div class="mt-1 text-sm text-red-600">(Rejected/Returned Entry)</div>' : ''}
          ${(supplierName || customerName) ? '<div class="mt-1 text-sm text-green-600">(Manual Entry)</div>' : ''}
          ${guardEntry.purchaseProducts && guardEntry.purchaseProducts.length > 0 ? 
            `<div class="mt-1 text-sm text-purple-600">Products: ${guardEntry.purchaseProducts.length} items</div>` : 
            ''}
          ${guardEntry.remarks && guardEntry.remarks.trim() ? 
            `<div class="mt-1 text-sm text-gray-600">Remarks: ${guardEntry.remarks}</div>` : 
            ''}
          ${guardEntry.entryNumber !== entryNumber ? 
            `<div class="mt-1 text-sm text-green-600">Entry number updated from ${entryNumber}</div>` : 
            ''
          }
        </div>
      `,
      icon: 'success',
      confirmButtonText: 'OK',
      customClass: {
        confirmButton: 'bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition'
      }
    });

    // Reset form and regenerate entry number
    setVehicleNumber('');
    setSupplierId('');
    setCustomerId('');
    setCustomerName('');
    setSupplierName('');
    setCustomerSearchQuery('');
    setSearchQuery('');
    setProductSearchQuery('');
    setManualProductName('');
    setRemarks('');
    setPhotos([]);
    setSelectedProducts([]);
    selectedProductsRef.current = []; // Also reset the ref
    setIsRejected(false);
    setShowManualCustomer(false);
    setShowManualSupplier(false);
    setShowManualProduct(false);
    
    // Regenerate entry number for next entry
    await generateEntryNumber();
    
  } catch (err) {
    console.error('Failed to submit entry', err);
    
    let errorMessage = 'Failed to record entry';
    if (err.response?.data?.message) {
      errorMessage = err.response.data.message;
    } else if (err.message) {
      errorMessage = err.message;
    }
    
    Swal.fire({
      title: 'Error!',
      text: errorMessage,
      icon: 'error',
      confirmButtonText: 'OK',
      customClass: {
        confirmButton: 'bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition'
      }
    });
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
    setSupplierName('');
    setShowManualSupplier(false);
    setShowDropdown(true);
  };

  const clearCustomerSelection = () => {
    setCustomerId('');
    setCustomerSearchQuery('');
    setCustomerName('');
    setShowManualCustomer(false);
    setShowCustomerDropdown(true);
  };

  const clearProductSearch = () => {
    setProductSearchQuery('');
    setShowProductDropdown(true);
  };

  const toggleManualCustomer = () => {
    setShowManualCustomer(!showManualCustomer);
    setCustomerId('');
    setCustomerSearchQuery('');
  };

  const toggleManualSupplier = () => {
    setShowManualSupplier(!showManualSupplier);
    setSupplierId('');
    setSearchQuery('');
  };

  const toggleManualProduct = () => {
    setShowManualProduct(!showManualProduct);
    setProductSearchQuery('');
  };

  // Format date and time for display
  const formatDateTime = (date) => {
    const options = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    };
    return date.toLocaleDateString('en-IN', options);
  };

  return (
    <>
      <InternalNavbar />
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Header with View Button */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              🚗 Gate Inward/GRN/Record Vehicle Entry/Material Inward
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
            {/* Entry Number Display with Live Clock */}
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
              <div className="text-sm text-blue-600 font-medium mb-1">ENTRY NUMBER</div>
              <div className="text-2xl font-bold text-blue-800 font-mono">{entryNumber}</div>
              
              {/* LED Style Digital Clock */}
<div className="mt-3 p-4 bg-black border-4 border-gray-700 rounded-2xl shadow-2xl">
  <div className="text-center">
    {/* Date Display */}
    <div className="mb-3">
      <div className="text-xs text-gray-400 font-mono uppercase tracking-widest mb-1">
        SYSTEM TIME
      </div>
      <div className="text-sm font-mono text-green-400 bg-gray-900 py-2 px-4 rounded-lg border border-gray-600 glow">
        {currentDateTime.toLocaleDateString('en-IN', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })}
      </div>
    </div>
    
    {/* Digital Clock */}
    <div className="bg-gray-900 p-4 rounded-xl border-2 border-green-500">
      <div className="flex justify-center items-baseline space-x-3">
        {/* Digital Time */}
        <div className="font-mono text-3xl font-bold text-green-400 digital-text">
          {currentDateTime.getHours().toString().padStart(2, '0')}
          <span className="text-green-500 animate-pulse mx-1">:</span>
          {currentDateTime.getMinutes().toString().padStart(2, '0')}
          <span className="text-green-500 animate-pulse mx-1">:</span>
          {currentDateTime.getSeconds().toString().padStart(2, '0')}
        </div>
        
        {/* Period */}
        <div className="text-lg font-mono text-yellow-400">
          {currentDateTime.getHours() >= 12 ? 'PM' : 'AM'}
        </div>
      </div>
    </div>
    
    {/* Status Bar */}
    <div className="mt-3 flex justify-between items-center text-xs text-gray-500 font-mono">
      <div>🟢 LIVE</div>
    </div>
  </div>
</div>

{/* Add this CSS for glow effect */}
<style jsx>{`
  .glow {
    box-shadow: 0 0 10px rgba(72, 187, 120, 0.3);
  }
  .digital-text {
    text-shadow: 0 0 10px rgba(72, 187, 120, 0.7);
  }
`}</style>
              
              <div className="text-xs text-blue-500 mt-2">Thermo Packers Guard Entry</div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Rejected Checkbox */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isRejected"
                  checked={isRejected}
                  onChange={(e) => {
                    setIsRejected(e.target.checked);
                    if (e.target.checked) {
                      setSupplierId('');
                      setSearchQuery('');
                      setSupplierName('');
                      setShowManualSupplier(false);
                    } else {
                      setCustomerId('');
                      setCustomerName('');
                      setCustomerSearchQuery('');
                      setShowManualCustomer(false);
                    }
                  }}
                  className="w-4 h-4 text-red-600 bg-gray-100 border-gray-300 rounded focus:ring-red-500"
                />
                <label htmlFor="isRejected" className="ml-2 text-sm font-medium text-gray-900">
                  ❌ Rejected or Returned Material
                </label>
              </div>

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

              {/* Supplier Selection (only show if not rejected) */}
              {!isRejected && (
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Supplier Name *
                  </label>
                  
                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={handleSearchChange}
                      onFocus={() => setShowDropdown(true)}
                      placeholder="Search supplier by name..."
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                      disabled={showManualSupplier}
                    />
                    
                    {searchQuery && !showManualSupplier && (
                      <button
                        type="button"
                        onClick={clearSupplierSelection}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        ✕
                      </button>
                    )}
                    
                    {!searchQuery && !showManualSupplier && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                        🔍
                      </div>
                    )}
                  </div>

                  {/* Manual Supplier Toggle */}
                  <div className="mt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={toggleManualSupplier}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      {showManualSupplier ? 'Select from list' : 'Not in list? Add manually'}
                    </button>
                  </div>

                  {showManualSupplier ? (
                    <div className="mt-2">
                      <input
                        type="text"
                        value={supplierName}
                        onChange={(e) => setSupplierName(e.target.value)}
                        placeholder="Enter supplier name manually..."
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  ) : (
                    <>
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

                      {showDropdown && searchQuery && filteredSuppliers.length === 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4 text-center text-gray-500">
                          No suppliers found matching "{searchQuery}"
                        </div>
                      )}
                    </>
                  )}

                  {(supplierId || supplierName) && (
                    <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="font-medium text-green-800">
                            ✅ Selected: {supplierId ? suppliers.find(s => s._id === supplierId)?.name : supplierName}
                            {supplierName && <span className="text-green-600"> (Manual Entry)</span>}
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
              )}

              {/* Customer Selection (only show if rejected) */}
              {isRejected && (
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Customer Name *
                  </label>
                  
                  <div className="relative">
                    <input
                      type="text"
                      value={customerSearchQuery}
                      onChange={handleCustomerSearchChange}
                      onFocus={() => setShowCustomerDropdown(true)}
                      placeholder="Search customer by name..."
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                      disabled={showManualCustomer}
                    />
                    
                    {customerSearchQuery && !showManualCustomer && (
                      <button
                        type="button"
                        onClick={clearCustomerSelection}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        ✕
                      </button>
                    )}
                    
                    {!customerSearchQuery && !showManualCustomer && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                        🔍
                      </div>
                    )}
                  </div>

                  {/* Manual Customer Toggle */}
                  <div className="mt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={toggleManualCustomer}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      {showManualCustomer ? 'Select from list' : 'Not in list? Add manually'}
                    </button>
                  </div>

                  {showManualCustomer ? (
                    <div className="mt-2">
                      <input
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Enter customer name manually..."
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  ) : (
                    <>
                      {showCustomerDropdown && filteredCustomers.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          {filteredCustomers.map(customer => (
                            <div
                              key={customer._id}
                              onClick={() => handleCustomerSelect(customer)}
                              className={`px-4 py-3 cursor-pointer hover:bg-blue-50 transition ${
                                customerId === customer._id ? 'bg-blue-100' : ''
                              }`}
                            >
                              <div className="font-medium text-gray-900">{customer.name}</div>
                              {customer.contactPerson && (
                                <div className="text-sm text-gray-600 mt-1">
                                  Contact: {customer.contactPerson}
                                </div>
                              )}
                              {customer.phone && (
                                <div className="text-sm text-gray-600">
                                  Phone: {customer.phone}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {showCustomerDropdown && customerSearchQuery && filteredCustomers.length === 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4 text-center text-gray-500">
                          No customers found matching "{customerSearchQuery}"
                        </div>
                      )}
                    </>
                  )}

                  {(customerId || customerName) && (
                    <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="font-medium text-green-800">
                            ✅ Selected: {customerId ? customers.find(c => c._id === customerId)?.name : customerName}
                            {customerName && <span className="text-green-600"> (Manual Entry)</span>}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={clearCustomerSelection}
                          className="text-green-600 hover:text-green-800 text-sm"
                        >
                          Change
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Purchase Products with Search and Manual Entry */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Purchase Products/Material Supplied
                </label>
                
                {/* Product Search Input */}
                <div className="relative mb-4">
                  <input
                    type="text"
                    value={productSearchQuery}
                    onChange={handleProductSearchChange}
                    onFocus={() => setShowProductDropdown(true)}
                    placeholder="Search products by name or code..."
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                    disabled={showManualProduct}
                  />
                  
                  {productSearchQuery && !showManualProduct && (
                    <button
                      type="button"
                      onClick={clearProductSearch}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      ✕
                    </button>
                  )}
                  
                  {!productSearchQuery && !showManualProduct && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                      🔍
                    </div>
                  )}

                  {/* Manual Product Toggle */}
                  <div className="mt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={toggleManualProduct}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      {showManualProduct ? 'Select from list' : 'Not in list? Add manually'}
                    </button>
                  </div>

                  {showManualProduct ? (
                    <div className="mt-2">
                      <input
                        type="text"
                        value={manualProductName}
                        onChange={(e) => setManualProductName(e.target.value)}
                        placeholder="Enter product name manually..."
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-2"
                      />
                      <button
                        type="button"
                        onClick={handleAddManualProduct}
                        className="w-full bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 transition"
                      >
                        ➕ Add Manual Product
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* Product Dropdown Results */}
                      {showProductDropdown && filteredProducts.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          {filteredProducts.map(product => (
                            <div
                              key={product._id}
                              onClick={() => handleProductSelect(product)}
                              className="px-4 py-3 cursor-pointer hover:bg-blue-50 transition border-b border-gray-100 last:border-b-0"
                            >
                              <div className="font-medium text-gray-900">{product.name}</div>
                              {product.code && (
                                <div className="text-sm text-gray-600">Code: {product.code}</div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* No Products Found Message */}
                      {showProductDropdown && productSearchQuery && filteredProducts.length === 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4 text-center text-gray-500">
                          No products found matching "{productSearchQuery}"
                        </div>
                      )}
                    </>
                  )}
                </div>

  {/* Selected Products Display */}
{selectedProducts.length > 0 && (
  <div className="mt-4 space-y-3">
    <h4 className="font-medium text-gray-700">Selected Products ({selectedProducts.length}):</h4>
    {selectedProducts.map((item, index) => (
      <div key={item.product._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
        <div className="flex-1">
          <div className="font-medium flex items-center gap-2">
            {item.product.name}
            {item.product.isManual && (
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Manual</span>
            )}
          </div>
          {item.product.code && !item.product.isManual && (
            <div className="text-sm text-gray-600">Code: {item.product.code}</div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white px-3 py-1 rounded border">
            <button
              type="button"
              onClick={() => handleQuantityChange(item.product._id, item.quantity - 1)}
              className="w-6 h-6 bg-gray-200 rounded flex items-center justify-center hover:bg-gray-300"
            >
              -
            </button>
            <span className="w-8 text-center font-medium">{item.quantity}</span>
            <button
              type="button"
              onClick={() => handleQuantityChange(item.product._id, item.quantity + 1)}
              className="w-6 h-6 bg-gray-200 rounded flex items-center justify-center hover:bg-gray-300"
            >
              +
            </button>
          </div>
          <button
            type="button"
            onClick={() => handleRemoveProduct(item.product._id)}
            className="text-red-600 hover:text-red-800 p-1"
          >
            🗑️
          </button>
        </div>
      </div>
    ))}
    <div className="flex justify-between items-center p-2">
      <span className="text-sm text-gray-600">
        Total items: {selectedProducts.reduce((sum, item) => sum + item.quantity, 0)}
      </span>
      <button
        type="button"
        onClick={() => setSelectedProducts([])}
        className="text-red-600 hover:text-red-800 text-sm font-medium"
      >
        Clear All Products
      </button>
    </div>
  </div>
)}
              </div>

              {/* Remarks Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Remarks (Can Mention Quantity or Any Other Details)
                </label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Enter any additional remarks or notes..."
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>

              {/* Photo Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Click Live Pictures of Material & Bill copy/Upload Photos (Max 5) *
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
                  disabled={loading || (!isRejected && !supplierId && !supplierName) || (isRejected && !customerId && !customerName)}
                  className={`flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold transition ${
                    loading || (!isRejected && !supplierId && !supplierName) || (isRejected && !customerId && !customerName) 
                      ? 'opacity-50 cursor-not-allowed' 
                      : 'hover:bg-blue-700'
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
              <p>🔍 Type to search suppliers/customers/products by name</p>
              <p>✏️ Can manually enter supplier/customer names if not in list</p>
              <p>✏️ Can manually enter product/material names if not in list</p>
              <p className="font-medium text-blue-600 mt-2">Current Entry: {entryNumber}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Close dropdowns when clicking outside */}
      {(showDropdown || showCustomerDropdown || showProductDropdown) && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => {
            setShowDropdown(false);
            setShowCustomerDropdown(false);
            setShowProductDropdown(false);
          }}
        />
      )}
    </>
  );
};

export default GuardEntryForm;