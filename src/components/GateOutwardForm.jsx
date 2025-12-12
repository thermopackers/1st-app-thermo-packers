import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import axiosInstance from '../axiosInstance';
import InternalNavbar from '../components/InternalNavbar';

const GateOutwardForm = () => {
  const navigate = useNavigate();
  const [isRepair, setIsRepair] = useState(false);
  const [GONO, setGONO] = useState('');
  const [challanNo, setChallanNo] = useState('');
  const [billNo, setBillNo] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [suppliers, setSuppliers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [purchaseProducts, setPurchaseProducts] = useState([]);
  const [salesProducts, setSalesProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [showManualProduct, setShowManualProduct] = useState(false);
  const [manualProductName, setManualProductName] = useState('');
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [remarks, setRemarks] = useState('');
  const [showManualSupplier, setShowManualSupplier] = useState(false);
  const [showManualCustomer, setShowManualCustomer] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
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
    fetchProducts();
    generateGONO();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      generateGONO();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
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
    const products = isRepair ? purchaseProducts : salesProducts;
    if (productSearchQuery.trim() === '') {
      setFilteredProducts(products);
    } else {
      const filtered = products.filter(product =>
        product.name.toLowerCase().includes(productSearchQuery.toLowerCase()) ||
        (product.code && product.code.toLowerCase().includes(productSearchQuery.toLowerCase()))
      );
      setFilteredProducts(filtered);
    }
  }, [productSearchQuery, purchaseProducts, salesProducts, isRepair]);

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

  const fetchProducts = async () => {
    try {
      // Fetch purchase products (for repair)
      const purchaseRes = await axiosInstance.get('/purchase-products');
      setPurchaseProducts(purchaseRes.data.data || purchaseRes.data.products || []);
      
      // Fetch sales products (for sale)
      const salesRes = await axiosInstance.get('/products-multer/all-products');
      setSalesProducts(salesRes.data);
      
      setFilteredProducts(purchaseRes.data.data || purchaseRes.data.products || []);
    } catch (err) {
      console.error('Failed to fetch products', err);
      Swal.fire('Error', 'Failed to load products', 'error');
    }
  };

  const generateGONO = async () => {
    try {
      const res = await axiosInstance.get('/gate-outwards?page=1&limit=1&sort=-createdAt');
      const latestEntries = res.data.entries || [];
      
      let nextNumber = 1;
      if (latestEntries.length > 0) {
        const latestEntryNumber = latestEntries[0].GONO;
        if (latestEntryNumber && latestEntryNumber.startsWith('GONO')) {
          const numberPart = latestEntryNumber.replace('GONO', '');
          const currentNumber = parseInt(numberPart, 10);
          if (!isNaN(currentNumber)) {
            nextNumber = currentNumber + 1;
          }
        }
      }
      
      setGONO(`GONO${String(nextNumber).padStart(2, '0')}`);
    } catch (err) {
      console.error('Failed to generate GONO:', err);
      setGONO('GONO--');
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

    setSelectedProducts(prev => {
      const newProducts = [...prev, { product: manualProduct, quantity: 1 }];
      selectedProductsRef.current = newProducts;
      return newProducts;
    });

    setManualProductName('');
    setShowManualProduct(false);
    
    Swal.fire({
      title: 'Product Added!',
      text: `"${manualProduct.name}" has been added to the entry`,
      icon: 'success',
      timer: 2000,
      showConfirmButton: false
    });
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
        newProducts = prev.map((p, index) => 
          index === existingProductIndex 
            ? { ...p, quantity: p.quantity + 1 }
            : p
        );
      } else {
        newProducts = [...prev, { product, quantity: 1 }];
      }
      
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
    
    const currentSelectedProducts = selectedProductsRef.current;
    
    if (photos.length === 0) {
      Swal.fire('Warning', 'Please upload at least one photo', 'warning');
      return;
    }

    if (isRepair) {
      if (!challanNo) {
        Swal.fire('Warning', 'Please enter challan number for repair entries', 'warning');
        return;
      }
      if (!supplierId && !supplierName) {
        Swal.fire('Warning', 'Please either select a supplier or enter supplier name for repair entries', 'warning');
        return;
      }
    } else {
      if (!billNo) {
        Swal.fire('Warning', 'Please enter bill number for sales entries', 'warning');
        return;
      }
      if (!customerId && !customerName) {
        Swal.fire('Warning', 'Please either select a customer or enter customer name for sales entries', 'warning');
        return;
      }
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('GONO', GONO);
      formData.append('isRepair', isRepair.toString());
      formData.append('remarks', remarks);
      
      if (isRepair) {
        formData.append('challanNo', challanNo);
        if (supplierId) formData.append('supplierId', supplierId);
        if (supplierName) formData.append('supplierName', supplierName);
      } else {
        formData.append('billNo', billNo);
        if (customerId) formData.append('customerId', customerId);
        if (customerName) formData.append('customerName', customerName);
      }
      
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
        formData.append('products', JSON.stringify(productsToSend));
      } else {
        formData.append('products', JSON.stringify([]));
      }
      
      photos.forEach(photo => {
        formData.append('photos', photo);
      });

      const response = await axiosInstance.post('/gate-outwards', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      const gateOutward = response.data.entry;

      Swal.fire({
        title: 'Success!',
        html: `
          <div class="text-center">
            <div class="text-4xl mb-4">✅</div>
            <div class="font-bold text-lg">Gate Outward Recorded Successfully!</div>
            <div class="mt-2 text-blue-600 font-mono text-xl">${gateOutward.GONO}</div>
            <div class="mt-2 text-gray-600">
              ${isRepair ? `Challan No: ${challanNo}` : `Bill No: ${billNo}`}
            </div>
            ${isRepair ? 
              `<div class="mt-1 text-sm text-orange-600">(Material Sent for Repair)</div>` : 
              `<div class="mt-1 text-sm text-green-600">(Material Sold)</div>`
            }
            ${gateOutward.remarks && gateOutward.remarks.trim() ? 
              `<div class="mt-1 text-sm text-gray-600">Remarks: ${gateOutward.remarks}</div>` : 
              ''}
          </div>
        `,
        icon: 'success',
        confirmButtonText: 'OK'
      });

      // Reset form
      setChallanNo('');
      setBillNo('');
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
      selectedProductsRef.current = [];
      setIsRepair(false);
      setShowManualCustomer(false);
      setShowManualSupplier(false);
      setShowManualProduct(false);
      
      await generateGONO();
      
    } catch (err) {
      console.error('Failed to submit gate outward', err);
      let errorMessage = 'Failed to record gate outward';
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      Swal.fire('Error!', errorMessage, 'error');
    } finally {
      setLoading(false);
    }
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
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              🚚 Gate Outward/GRN/Record Vehicle Exit/Material Outward
            </h2>
            <button
              onClick={() => navigate('/gate-outwards-view')}
              className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition flex items-center gap-2"
            >
              <span>📋</span>
              View All Outwards
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            {/* GONO Display with Live Clock */}
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
              <div className="text-sm text-blue-600 font-medium mb-1">GATE OUTWARD NUMBER</div>
              <div className="text-2xl font-bold text-blue-800 font-mono">{GONO}</div>
              
              <div className="mt-3 p-4 bg-black border-4 border-gray-700 rounded-2xl shadow-2xl">
                <div className="text-center">
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
                  
                  <div className="bg-gray-900 p-4 rounded-xl border-2 border-green-500">
                    <div className="flex justify-center items-baseline space-x-3">
                      <div className="font-mono text-3xl font-bold text-green-400 digital-text">
                        {currentDateTime.getHours().toString().padStart(2, '0')}
                        <span className="text-green-500 animate-pulse mx-1">:</span>
                        {currentDateTime.getMinutes().toString().padStart(2, '0')}
                        <span className="text-green-500 animate-pulse mx-1">:</span>
                        {currentDateTime.getSeconds().toString().padStart(2, '0')}
                      </div>
                      <div className="text-lg font-mono text-yellow-400">
                        {currentDateTime.getHours() >= 12 ? 'PM' : 'AM'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-3 flex justify-between items-center text-xs text-gray-500 font-mono">
                    <div>🟢 LIVE</div>
                  </div>
                </div>
              </div>
              
              <div className="text-xs text-blue-500 mt-2">Thermo Packers Gate Outward</div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Repair Checkbox */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isRepair"
                  checked={isRepair}
                  onChange={(e) => {
                    setIsRepair(e.target.checked);
                    if (e.target.checked) {
                      setCustomerId('');
                      setCustomerName('');
                      setCustomerSearchQuery('');
                      setShowManualCustomer(false);
                    } else {
                      setSupplierId('');
                      setSupplierName('');
                      setSearchQuery('');
                      setShowManualSupplier(false);
                    }
                    setSelectedProducts([]);
                    selectedProductsRef.current = [];
                  }}
                  className="w-4 h-4 text-orange-600 bg-gray-100 border-gray-300 rounded focus:ring-orange-500"
                />
                <label htmlFor="isRepair" className="ml-2 text-sm font-medium text-gray-900">
                  🔧 Material sent for repair
                </label>
              </div>

              {/* Challan No (for repair) */}
              {isRepair && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Challan Number *
                  </label>
                  <input
                    type="text"
                    value={challanNo}
                    onChange={(e) => setChallanNo(e.target.value.toUpperCase())}
                    placeholder="Enter challan number"
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              )}

              {/* Bill No (for sale) */}
              {!isRepair && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bill Number *
                  </label>
                  <input
                    type="text"
                    value={billNo}
                    onChange={(e) => setBillNo(e.target.value.toUpperCase())}
                    placeholder="Enter bill number"
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              )}

              {/* Supplier Selection (only show if repair) */}
              {isRepair && (
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Supplier Name *
                  </label>
                  
                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setShowDropdown(true);
                      }}
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
                              className={`px-4 py-3 cursor-pointer hover:bg-blue-50 transition ${supplierId === supplier._id ? 'bg-blue-100' : ''}`}
                            >
                              <div className="font-medium text-gray-900">{supplier.name}</div>
                              {supplier.contactPerson && (
                                <div className="text-sm text-gray-600 mt-1">Contact: {supplier.contactPerson}</div>
                              )}
                              {supplier.phone && (
                                <div className="text-sm text-gray-600">Phone: {supplier.phone}</div>
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

              {/* Customer Selection (only show if not repair) */}
              {!isRepair && (
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Customer Name *
                  </label>
                  
                  <div className="relative">
                    <input
                      type="text"
                      value={customerSearchQuery}
                      onChange={(e) => {
                        setCustomerSearchQuery(e.target.value);
                        setShowCustomerDropdown(true);
                      }}
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
                              className={`px-4 py-3 cursor-pointer hover:bg-blue-50 transition ${customerId === customer._id ? 'bg-blue-100' : ''}`}
                            >
                              <div className="font-medium text-gray-900">{customer.name}</div>
                              {customer.contactPerson && (
                                <div className="text-sm text-gray-600 mt-1">Contact: {customer.contactPerson}</div>
                              )}
                              {customer.phone && (
                                <div className="text-sm text-gray-600">Phone: {customer.phone}</div>
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

              {/* Products Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {isRepair ? 'Purchase Products' : 'Sales Products'}
                </label>
                
                <div className="relative mb-4">
                  <input
                    type="text"
                    value={productSearchQuery}
                    onChange={(e) => {
                      setProductSearchQuery(e.target.value);
                      setShowProductDropdown(true);
                    }}
                    onFocus={() => setShowProductDropdown(true)}
                    placeholder={`Search ${isRepair ? 'purchase' : 'sales'} products by name or code...`}
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
                        <div className="flex items-center gap-2">
  <input
    type="number"
    min="1"
    value={item.quantity}
    onChange={(e) => {
      const value = e.target.value;
      const numValue = parseInt(value, 10);
      
      // Allow empty input while typing
      if (value === '') {
        const newProducts = selectedProducts.map(p =>
          p.product._id === item.product._id
            ? { ...p, quantity: '' }
            : p
        );
        setSelectedProducts(newProducts);
        selectedProductsRef.current = newProducts;
      } else if (!isNaN(numValue) && numValue >= 1) {
        handleQuantityChange(item.product._id, numValue);
      }
    }}
    onBlur={(e) => {
      const value = e.target.value;
      const numValue = parseInt(value, 10);
      
      // When field loses focus, ensure valid value
      if (value === '' || isNaN(numValue) || numValue < 1) {
        handleQuantityChange(item.product._id, 1);
      }
    }}
    className="w-20 px-3 py-1 border border-gray-300 rounded text-center font-medium"
  />
  <div className="flex flex-col gap-1">
    <button
      type="button"
      onClick={() => handleQuantityChange(item.product._id, item.quantity + 1)}
      className="w-6 h-6 bg-gray-200 rounded flex items-center justify-center hover:bg-gray-300 text-sm"
    >
      ▲
    </button>
    <button
      type="button"
      onClick={() => handleQuantityChange(item.product._id, Math.max(1, item.quantity - 1))}
      className="w-6 h-6 bg-gray-200 rounded flex items-center justify-center hover:bg-gray-300 text-sm"
    >
      ▼
    </button>
  </div>
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
                  Remarks
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
                  Upload Photos (Max 5) *
                </label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3"
                />
                
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
                  disabled={loading || (isRepair && !supplierId && !supplierName) || (!isRepair && !customerId && !customerName)}
                  className={`flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold transition ${
                    loading || (isRepair && !supplierId && !supplierName) || (!isRepair && !customerId && !customerName) 
                      ? 'opacity-50 cursor-not-allowed' 
                      : 'hover:bg-blue-700'
                  }`}
                >
                  {loading ? `Recording ${GONO}...` : `Record ${GONO}`}
                </button>
                
                <button
                  type="button"
                  onClick={() => navigate('/gate-outwards-view')}
                  className="flex-1 bg-gray-500 text-white py-3 rounded-lg font-semibold hover:bg-gray-600 transition flex items-center justify-center gap-2"
                >
                  <span>📋</span>
                  View Outwards
                </button>
              </div>
            </form>

            <div className="mt-6 text-center text-sm text-gray-500">
              <p>📍 All outward entries are automatically timestamped</p>
              <p>🔍 Type to search suppliers/customers/products by name</p>
              <p>✏️ Can manually enter supplier/customer names if not in list</p>
              <p>✏️ Can manually enter product names if not in list</p>
              <p className="font-medium text-blue-600 mt-2">Current Outward: {GONO}</p>
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

export default GateOutwardForm;