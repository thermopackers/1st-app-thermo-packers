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
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [purchaseProducts, setPurchaseProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]); // New state for filtered products
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [productSearchQuery, setProductSearchQuery] = useState(''); // New state for product search
  const [showDropdown, setShowDropdown] = useState(false);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [showProductDropdown, setShowProductDropdown] = useState(false); // New state for product dropdown
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [entryNumber, setEntryNumber] = useState('');
  const [isRejected, setIsRejected] = useState(false);
  const [customerId, setCustomerId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [showManualCustomer, setShowManualCustomer] = useState(false);
  const [showManualSupplier, setShowManualSupplier] = useState(false);

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
    const existingProduct = selectedProducts.find(p => p.product._id === product._id);
    if (existingProduct) {
      setSelectedProducts(prev =>
        prev.map(p =>
          p.product._id === product._id
            ? { ...p, quantity: p.quantity + 1 }
            : p
        )
      );
    } else {
      setSelectedProducts(prev => [...prev, { product, quantity: 1 }]);
    }
  };

  const handleRemoveProduct = (productId) => {
    setSelectedProducts(prev => prev.filter(p => p.product._id !== productId));
  };

  const handleQuantityChange = (productId, newQuantity) => {
    if (newQuantity < 1) return;
    setSelectedProducts(prev =>
      prev.map(p =>
        p.product._id === productId
          ? { ...p, quantity: newQuantity }
          : p
      )
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
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
      
      if (isRejected) {
        if (customerId) {
          formData.append('customerId', customerId);
        }
        if (customerName) {
          formData.append('customerName', customerName);
        }
      } else {
        if (supplierId) {
          formData.append('supplierId', supplierId);
        }
        if (supplierName) {
          formData.append('supplierName', supplierName);
        }
      }
      
      // Add purchase products
      if (selectedProducts.length > 0) {
        formData.append('purchaseProducts', JSON.stringify(selectedProducts.map(sp => ({
          product: sp.product._id,
          quantity: sp.quantity
        }))));
      }
      
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
            ${guardEntry.isRejected ? '<div class="mt-1 text-sm text-red-600">(Rejected/Returned Entry)</div>' : ''}
            ${(supplierName || customerName) ? '<div class="mt-1 text-sm text-green-600">(Manual Entry)</div>' : ''}
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
      setCustomerId('');
      setCustomerName('');
      setSupplierName('');
      setCustomerSearchQuery('');
      setSearchQuery('');
      setProductSearchQuery('');
      setPhotos([]);
      setSelectedProducts([]);
      setIsRejected(false);
      setShowManualCustomer(false);
      setShowManualSupplier(false);
      await generateEntryNumber();
      
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

              {/* Purchase Products with Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Purchase Products
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
                  />
                  
                  {productSearchQuery && (
                    <button
                      type="button"
                      onClick={clearProductSearch}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      ✕
                    </button>
                  )}
                  
                  {!productSearchQuery && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                      🔍
                    </div>
                  )}

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
                </div>

                {/* Selected Products List */}
                {selectedProducts.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-700">Selected Products:</h4>
                    {selectedProducts.map((item) => (
                      <div key={item.product._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium">{item.product.name}</div>
                          {item.product.code && (
                            <div className="text-sm text-gray-600">Code: {item.product.code}</div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleQuantityChange(item.product._id, item.quantity - 1)}
                            className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center"
                          >
                            -
                          </button>
                          <span className="w-12 text-center font-medium">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => handleQuantityChange(item.product._id, item.quantity + 1)}
                            className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center"
                          >
                            +
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveProduct(item.product._id)}
                            className="ml-2 text-red-600 hover:text-red-800"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Photo Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Click Live Pictures/Upload Photos (Max 5) *
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