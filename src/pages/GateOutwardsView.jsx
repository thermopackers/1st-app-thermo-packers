import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../axiosInstance';
import Swal from 'sweetalert2';
import InternalNavbar from '../components/InternalNavbar';
import { useUserContext } from '../context/UserContext';

// Product Editor Component for Gate Outwards
const GateOutwardProductEditor = ({ products, onProductsChange, isRepair }) => {
  const [purchaseProducts, setPurchaseProducts] = useState([]);
  const [salesProducts, setSalesProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [showManualProduct, setShowManualProduct] = useState(false);
  const [manualProductName, setManualProductName] = useState('');

  useEffect(() => {
    fetchProducts();
  }, [isRepair]);

useEffect(() => {
  const currentProducts = isRepair ? purchaseProducts : salesProducts;
  console.log('Current products for filtering:', currentProducts); // Debug
  console.log('isRepair:', isRepair); // Debug
  
  if (productSearchQuery.trim() === '') {
    setFilteredProducts(currentProducts);
  } else {
    const filtered = currentProducts.filter(product => {
      const matchesName = product.name && 
        product.name.toLowerCase().includes(productSearchQuery.toLowerCase());
      const matchesCode = product.code && 
        product.code.toLowerCase().includes(productSearchQuery.toLowerCase());
      return matchesName || matchesCode;
    });
    console.log('Filtered products:', filtered); // Debug
    setFilteredProducts(filtered);
  }
}, [productSearchQuery, purchaseProducts, salesProducts, isRepair]);

 const fetchProducts = async () => {
  try {
    if (isRepair) {
      // For repair: products are in res.data.data
      const res = await axiosInstance.get('/purchase-products');
      setPurchaseProducts(res.data.data || []);
      setFilteredProducts(res.data.data || []);
    } else {
      // For sales: products are directly in res.data (array)
      const res = await axiosInstance.get('/products-multer/all-products');
      console.log('Sales products API response:', res.data); // Debug
      
      // res.data is already an array of products
      const products = res.data || [];
      console.log('Sales products extracted:', products); // Debug
      
      setSalesProducts(products);
      setFilteredProducts(products);
    }
  } catch (err) {
    console.error('Failed to fetch products', err);
    Swal.fire('Error', `Failed to load ${isRepair ? 'purchase' : 'sales'} products`, 'error');
  }
};

const handleProductSelect = (product) => {
  console.log('Selected product:', product); // Debug
  console.log('Current products list:', products); // Debug
  
  const existingProductIndex = products.findIndex(p => {
    const matchById = p.product?._id === product._id;
    const matchByName = p.productName === product.name;
    console.log('Checking match:', { matchById, matchByName, productId: product._id, productName: product.name }); // Debug
    return matchById || matchByName;
  });
  
  console.log('Existing product index:', existingProductIndex); // Debug
  
  let newProducts;
  if (existingProductIndex !== -1) {
    newProducts = products.map((p, index) => 
      index === existingProductIndex 
        ? { ...p, quantity: p.quantity + 1 }
        : p
    );
  } else {
    newProducts = [...products, { 
      product: { _id: product._id, name: product.name, code: product.code },
      quantity: 1 
    }];
  }
  
  console.log('New products after selection:', newProducts); // Debug
  onProductsChange(newProducts);
  setProductSearchQuery('');
  setShowProductDropdown(false);
};

  const handleAddManualProduct = () => {
    if (!manualProductName.trim()) {
      Swal.fire('Warning', 'Please enter product name', 'warning');
      return;
    }

    const newProducts = [...products, { 
      productName: manualProductName.trim(),
      quantity: 1,
      product: { _id: `manual_${Date.now()}`, name: manualProductName.trim(), isManual: true }
    }];
    
    onProductsChange(newProducts);
    setManualProductName('');
    setShowManualProduct(false);
  };

  const handleRemoveProduct = (productId) => {
    const newProducts = products.filter(p => 
      p.product?._id !== productId && p.productName !== productId
    );
    onProductsChange(newProducts);
  };

  const handleQuantityChange = (productId, newQuantity) => {
    if (newQuantity < 1) return;
    
    const newProducts = products.map(p =>
      (p.product?._id === productId || p.productName === productId)
        ? { ...p, quantity: newQuantity }
        : p
    );
    onProductsChange(newProducts);
  };

  return (
    <div className="space-y-4">
      {/* Product Search */}
      <div className="relative" onClick={(e) => e.stopPropagation()}>
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
            onClick={() => setProductSearchQuery('')}
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
            onClick={() => setShowManualProduct(!showManualProduct)}
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
        <div className="text-xs text-gray-500 mt-1">ID: {product._id}</div> {/* Debug info */}
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
      {products.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-gray-700">Selected Products ({products.length}):</h4>
          {products.map((item, index) => (
            <div key={item.product?._id || item.productName} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
              <div className="flex-1">
                <div className="font-medium flex items-center gap-2">
                  {item.product?.name || item.productName}
                  {item.productName && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Manual</span>
                  )}
                </div>
                {item.product?.code && !item.productName && (
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
        const productId = item.product?._id || item.productName;
        const newProducts = products.map(p =>
          (p.product?._id === productId || p.productName === productId)
            ? { ...p, quantity: '' }
            : p
        );
        onProductsChange(newProducts);
      } else if (!isNaN(numValue) && numValue >= 1) {
        handleQuantityChange(item.product?._id || item.productName, numValue);
      }
    }}
    onBlur={(e) => {
      const value = e.target.value;
      const numValue = parseInt(value, 10);
      
      // When field loses focus, ensure valid value
      if (value === '' || isNaN(numValue) || numValue < 1) {
        handleQuantityChange(item.product?._id || item.productName, 1);
      }
    }}
    className="w-20 px-3 py-1 border border-gray-300 rounded text-center font-medium"
  />
  <div className="flex flex-col gap-1">
    <button
      type="button"
      onClick={() => handleQuantityChange(item.product?._id || item.productName, item.quantity + 1)}
      className="w-6 h-6 bg-gray-200 rounded flex items-center justify-center hover:bg-gray-300 text-sm"
    >
      ▲
    </button>
    <button
      type="button"
      onClick={() => handleQuantityChange(item.product?._id || item.productName, Math.max(1, item.quantity - 1))}
      className="w-6 h-6 bg-gray-200 rounded flex items-center justify-center hover:bg-gray-300 text-sm"
    >
      ▼
    </button>
  </div>
</div>
                <button
                  type="button"
                  onClick={() => handleRemoveProduct(item.product?._id || item.productName)}
                  className="text-red-600 hover:text-red-800 p-1"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const GateOutwardsView = () => {
  const { user } = useUserContext();
  const navigate = useNavigate();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState('');
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalEntries: 0,
    hasNext: false,
    hasPrev: false,
    limit: 10
  });

  // For editing specific entry
  const [editingEntryId, setEditingEntryId] = useState(null);
  const [editingProducts, setEditingProducts] = useState(false);
  const [editingRemarks, setEditingRemarks] = useState(false);
  const [editingPhotos, setEditingPhotos] = useState(false);
  const [tempProducts, setTempProducts] = useState([]);
  const [tempRemarks, setTempRemarks] = useState('');
  const [tempPhotos, setTempPhotos] = useState([]);
  const [newPhotos, setNewPhotos] = useState([]);
  const [savingProducts, setSavingProducts] = useState(false);
  const [savingPhotos, setSavingPhotos] = useState(false);
  const [savingRemarks, setSavingRemarks] = useState(false);

  useEffect(() => {
    fetchEntries();
  }, [filterDate, pagination.currentPage]);

  const fetchEntries = async () => {
    try {
      setLoading(true);
      let url = `/gate-outwards?page=${pagination.currentPage}&limit=${pagination.limit}`;
      if (filterDate) {
        url += `&date=${filterDate}`;
      }
      
      const res = await axiosInstance.get(url);
      setEntries(res.data.entries);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error('Failed to fetch gate outward entries', err);
      Swal.fire('Error', 'Failed to load gate outward entries', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showPhoto = (url, title) => {
    Swal.fire({
      title: title,
      html: `<div style="text-align:center;">
             <img src="${url}" alt="${title}" style="max-width:100%; max-height:70vh; border-radius:8px;" />
           </div>`,
      showCloseButton: true,
      showConfirmButton: false,
      width: "80%",
      background: "#fff",
    });
  };

const showProducts = (products, title, isRepair) => {
  if (!products || products.length === 0) {
    Swal.fire('Info', 'No products recorded for this entry', 'info');
    return;
  }

  console.log('Products data for display:', products); // Debug log

  const productsHtml = products.map((item, index) => {
    let productName = 'Unknown Product';
    let productCode = null;
    let isManual = false;
    
    // Debug logging to see the structure
    console.log('Product item:', item);
    
    // Check if it's a manual product first
    if (item.productName) {
      productName = item.productName;
      isManual = true;
    } 
    // Check if product is populated (has name property)
    else if (item.product && typeof item.product === 'object') {
      // For sales products (from Product collection)
      if (item.product.name) {
        productName = item.product.name;
        productCode = item.product.code;
      }
      // For purchase products (from PurchaseProduct collection) 
      else if (item.product.productName) {
        productName = item.product.productName;
        productCode = item.product.productCode || null;
      }
    }
    // Check if product is just an ID string (not populated)
    else if (item.product && typeof item.product === 'string') {
      productName = `Product ID: ${item.product.substring(0, 8)}...`;
    }
    
    const quantity = item.quantity || 0;

    return `
      <div class="border-b border-gray-200 py-3">
        <div class="flex justify-between items-start">
          <div class="flex-1">
            <div class="font-medium text-gray-900">${productName}</div>
            ${productCode ? `<div class="text-sm text-gray-600 mt-1">Code: ${productCode}</div>` : ''}
            ${isManual ? `<div class="text-xs text-green-600 mt-1 font-medium">📝 Manual Entry</div>` : ''}
          </div>
          <div class="text-right">
            <div class="text-lg font-bold ${isRepair ? 'text-orange-600' : 'text-green-600'}">${quantity}</div>
            <div class="text-xs text-gray-500">Qty</div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  Swal.fire({
    title: title,
    html: `<div class="text-left max-h-96 overflow-y-auto">
           <div class="space-y-2">${productsHtml}</div>
         </div>`,
    showCloseButton: true,
    showConfirmButton: false,
    width: "500px",
    background: "#fff",
  });
};

  const showRemarks = (remarks, title) => {
    if (!remarks || remarks.trim() === '') {
      Swal.fire('Info', 'No remarks provided for this entry', 'info');
      return;
    }

    Swal.fire({
      title: title,
      html: `<div class="text-left max-w-md">
             <div class="bg-gray-50 p-4 rounded-lg border border-gray-200">
               <p class="text-gray-700 whitespace-pre-wrap">${remarks}</p>
             </div>
           </div>`,
      showCloseButton: true,
      showConfirmButton: false,
      width: "600px",
      background: "#fff",
    });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  const formatFilterDateForDisplay = (isoDate) => {
    if (!isoDate) return '';
    const date = new Date(isoDate);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({
      ...prev,
      currentPage: newPage
    }));
  };

  const handleAddOutward = () => {
    navigate('/gate-outward');
  };

  const canEditEntries = () => {
    if (!user || !user.role) return false;
    const userRoles = Array.isArray(user.role) ? user.role : [user.role];
    return userRoles.some(role => ["accounts", "admin"].includes(role));
  };

  // Handler functions for editing
  const handleEditRemarks = (entry) => {
    setEditingEntryId(entry._id);
    setTempRemarks(entry.remarks || '');
    setEditingRemarks(true);
  };

  const handleSaveRemarks = async () => {
    if (!editingEntryId) return;
    
    setSavingRemarks(true);
    try {
      const response = await axiosInstance.patch(`/gate-outwards/${editingEntryId}`, {
        remarks: tempRemarks
      });
      
      // Update local state
      setEntries(prev => prev.map(entry => 
        entry._id === editingEntryId 
          ? { ...entry, remarks: tempRemarks }
          : entry
      ));
      
      setEditingRemarks(false);
      setEditingEntryId(null);
      Swal.fire('Success!', 'Remarks updated successfully', 'success');
    } catch (error) {
      console.error('Failed to update remarks', error);
      Swal.fire('Error', 'Failed to update remarks', 'error');
    } finally {
      setSavingRemarks(false);
    }
  };

  const handleEditProducts = (entry) => {
    setEditingEntryId(entry._id);
    const formattedProducts = entry.products.map(item => ({
      product: item.product ? {
        _id: item.product._id,
        name: item.product.name,
        code: item.product.code
      } : null,
      productName: item.productName || null,
      quantity: item.quantity
    }));
    setTempProducts(formattedProducts);
    setEditingProducts(true);
  };

const handleSaveProducts = async () => {
  if (!editingEntryId) return;
  if (tempProducts.length === 0) {
    Swal.fire('Warning', 'Please add at least one product', 'warning');
    return;
  }
  
  setSavingProducts(true);
  try {
    const entry = entries.find(e => e._id === editingEntryId);
    
    const productsToSend = tempProducts.map(item => {
      const productData = {
        quantity: item.quantity || 1
      };

      // Check if it's a selected product (from dropdown)
      if (item.product?._id && !item.productName) {
        productData.product = item.product._id;
        productData.productName = null;
      } 
      // Check if it's a manual product
      else if (item.productName) {
        productData.product = null;
        productData.productName = item.productName;
      }
      // If no product info, it might be an existing product being updated
      else if (item.product?._id && item.productName) {
        productData.product = item.product._id;
        productData.productName = null;
      }

      return productData;
    });

    console.log('Sending products to backend:', productsToSend);

    const response = await axiosInstance.patch(`/gate-outwards/${editingEntryId}`, {
      products: JSON.stringify(productsToSend)
    });

    console.log('Response from backend:', response.data);

    setEntries(prev => prev.map(entry => 
      entry._id === editingEntryId 
        ? { ...entry, products: response.data.entry.products }
        : entry
    ));
    
    setEditingProducts(false);
    setEditingEntryId(null);
    Swal.fire('Success!', 'Products updated successfully', 'success');
  } catch (error) {
    console.error('Failed to update products', error);
    Swal.fire('Error', 'Failed to update products: ' + error.message, 'error');
  } finally {
    setSavingProducts(false);
  }
};

  const handleEditPhotos = (entry) => {
    setEditingEntryId(entry._id);
    setTempPhotos([...entry.photos]);
    setEditingPhotos(true);
  };

  const handleNewPhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    const totalPhotos = tempPhotos.length + newPhotos.length + files.length;
    
    if (totalPhotos > 5) {
      Swal.fire('Warning', 'Maximum 5 photos allowed in total', 'warning');
      return;
    }
    
    setNewPhotos(prev => [...prev, ...files]);
  };

  const handleRemovePhoto = async (index) => {
    const photoToRemove = tempPhotos[index];
    
    if (!photoToRemove.startsWith('blob:')) {
      try {
        await axiosInstance.delete(`/gate-outwards/${editingEntryId}/photos`, {
          data: { photoUrl: photoToRemove }
        });
      } catch (error) {
        console.error('Failed to delete photo from server', error);
        Swal.fire('Error', 'Failed to delete photo', 'error');
        return;
      }
    }
    
    const updatedPhotos = tempPhotos.filter((_, i) => i !== index);
    setTempPhotos(updatedPhotos);
  };

  const handleRemoveNewPhoto = (index) => {
    setNewPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSavePhotos = async () => {
    if (!editingEntryId) return;
    
    setSavingPhotos(true);
    try {
      const formData = new FormData();
      
      newPhotos.forEach(photo => {
        formData.append('photos', photo);
      });

      const response = await axiosInstance.patch(`/gate-outwards/${editingEntryId}/photos`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setEntries(prev => prev.map(entry => 
        entry._id === editingEntryId 
          ? { ...entry, photos: response.data.entry.photos }
          : entry
      ));
      
      setEditingPhotos(false);
      setEditingEntryId(null);
      setNewPhotos([]);
      Swal.fire('Success!', 'Photos updated successfully', 'success');
    } catch (error) {
      console.error('Failed to update photos', error);
      Swal.fire('Error', 'Failed to update photos', 'error');
    } finally {
      setSavingPhotos(false);
    }
  };

  if (loading) {
    return (
      <>
        <InternalNavbar />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading gate outward entries...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <InternalNavbar />
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  📤 Gate Outward Records
                </h2>
                <p className="text-gray-600">
                  Viewing all gate outward entries
                </p>
                {canEditEntries() && (
                  <p className="text-sm text-blue-600 mt-1">
                    ✏️ You can edit entries (Accounts/Admin access)
                  </p>
                )}
              </div>
              
              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                {/* Add Outward Button */}
                <button
                  onClick={handleAddOutward}
                  className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition flex items-center gap-2"
                >
                  <span>➕</span>
                  Add New Outward
                </button>
                
                {/* Filter Controls */}
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Filter by Date
                    </label>
                    <input
                      type="date"
                      value={filterDate}
                      onChange={(e) => {
                        setFilterDate(e.target.value);
                        setPagination(prev => ({ ...prev, currentPage: 1 }));
                      }}
                      className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <button
                    onClick={() => {
                      setFilterDate('');
                      setPagination(prev => ({ ...prev, currentPage: 1 }));
                    }}
                    className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition mt-6 sm:mt-0"
                  >
                    Clear Filter
                  </button>
                  <button
                    onClick={fetchEntries}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition mt-2 sm:mt-0 flex items-center gap-2"
                  >
                    <span>🔄</span>
                    Refresh
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Entries Table */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold">Gate Outward Entries</h3>
              {canEditEntries() && (
                <span className="bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full">
                  ✏️ Click Edit buttons to modify entries
                </span>
              )}
            </div>
            {entries.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🚚</div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  No gate outward entries found
                </h3>
                <p className="text-gray-500 mb-6">
                  {filterDate 
                    ? `No entries found for ${formatFilterDateForDisplay(filterDate)}` 
                    : 'No gate outward entries recorded yet'
                  }
                </p>
                <button
                  onClick={handleAddOutward}
                  className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition flex items-center gap-2 mx-auto"
                >
                  <span>➕</span>
                  Add Your First Outward Entry
                </button>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left text-gray-600">
                    <thead className="bg-gray-100 text-gray-700 uppercase text-xs">
                      <tr>
                        <th className="px-4 py-3">GONO</th>
                        <th className="px-4 py-3">Date & Time</th>
                        <th className="px-4 py-3">Type</th>
    <th className="px-4 py-3">Document No</th> {/* Changed from conditional */}
                        <th className="px-4 py-3">Supplier/Customer</th>
                        <th className="px-4 py-3">Products</th>
                        <th className="px-4 py-3">Remarks</th>
                        <th className="px-4 py-3">Recorded By</th>
                        <th className="px-4 py-3">Photos</th>
                        {canEditEntries() && (
                          <th className="px-4 py-3">Actions</th>
                        )}
                        <th className="px-4 py-3">Print</th>
                      </tr>
                    </thead>
                    <tbody>
                      {entries.map((entry) => (
                        <tr key={entry._id} className="border-b hover:bg-gray-50 transition">
                          <td className="px-4 py-4">
                            <div className={`font-bold px-2 py-1 rounded text-center font-mono ${
                              entry.isRepair ? 'bg-orange-50 text-orange-600' : 'bg-green-50 text-green-600'
                            }`}>
                              {entry.GONO || 'N/A'}
                              <div className="text-xs mt-1">
                                {entry.isRepair ? '(Repair)' : '(Sale)'}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="font-medium text-gray-900">
                              {formatDate(entry.createdAt)}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              entry.isRepair ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'
                            }`}>
                              {entry.isRepair ? 'Repair' : 'Sale'}
                            </span>
                          </td>
                       <td className="px-4 py-4">
  <span className="font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded">
    {entry.isRepair ? entry.challanNo : entry.billNo}
  </span>
  <div className="text-xs text-gray-500 mt-1">
    {entry.isRepair ? 'Challan' : 'Bill'}
  </div>
</td>
                          <td className="px-4 py-4">
                            <div className="font-medium text-gray-900">
                              {entry.isRepair 
                                ? (entry.supplier?.name || entry.supplierName || 'N/A')
                                : (entry.customer?.name || entry.customerName || 'N/A')
                              }
                            </div>
                            {entry.isRepair ? (
                              entry.supplierName && (
                                <div className="text-xs text-green-600 font-medium">📝 Manual</div>
                              )
                            ) : (
                              entry.customerName && (
                                <div className="text-xs text-green-600 font-medium">📝 Manual</div>
                              )
                            )}
                          </td>
                         <td className="px-4 py-4">
  <div className="flex gap-2 flex-wrap">
    {entry.products && entry.products.length > 0 ? (
      <button
        onClick={() => showProducts(
          entry.products, 
          `${entry.GONO} - Products (${entry.products.length})`,
          entry.isRepair
        )}
        className="px-3 py-1 bg-purple-600 text-white rounded text-xs hover:bg-purple-700 transition flex items-center gap-1"
      >
        <span>📦</span>
        View Products ({entry.products.length})
      </button>
    ) : (
      <span className="text-gray-400 text-xs">No products</span>
    )}
  </div>
</td>
                          <td className="px-4 py-4">
                            <div className="flex gap-2 flex-wrap">
                              {entry.remarks && entry.remarks.trim() ? (
                                <button
                                  onClick={() => showRemarks(entry.remarks, `${entry.GONO} - Remarks`)}
                                  className="px-3 py-1 bg-gray-600 text-white rounded text-xs hover:bg-gray-700 transition flex items-center gap-1"
                                >
                                  <span>📝</span>
                                  View Remarks
                                </button>
                              ) : (
                                <span className="text-gray-400 text-xs">No remarks</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="text-gray-700">
                              {entry.recordedBy?.name || 'N/A'}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex gap-2 flex-wrap">
                              {entry.photos.map((photo, index) => (
                                <button
                                  key={index}
                                  onClick={() => showPhoto(photo, `${entry.GONO} - Photo ${index + 1}`)}
                                  className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition flex items-center gap-1"
                                >
                                  <span>📸</span>
                                  Photo {index + 1}
                                </button>
                              ))}
                            </div>
                          </td>
                          {canEditEntries() && (
                            <td className="px-4 py-4">
                              <div className="flex flex-col gap-2">
                                <button
                                  onClick={() => handleEditRemarks(entry)}
                                  className="px-3 py-1 bg-yellow-600 text-white rounded text-xs hover:bg-yellow-700 transition"
                                >
                                  Edit Remarks
                                </button>
                                <button
                                  onClick={() => handleEditProducts(entry)}
                                  className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition"
                                >
                                  Edit Products
                                </button>
                                <button
                                  onClick={() => handleEditPhotos(entry)}
                                  className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition"
                                >
                                  Edit Photos
                                </button>
                              </div>
                            </td>
                          )}
                          <td className="px-4 py-4">
  <button
    onClick={(e) => {
      e.stopPropagation();
      navigate(`/gate-outward-printout/${entry._id}`);
    }}
    className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition flex items-center gap-1"
  >
    <span>🖨️</span>
    Print
  </button>
</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row justify-between items-center mt-6 pt-6 border-t border-gray-200 gap-4">
                    <div className="text-sm text-gray-600">
                      Showing {((pagination.currentPage - 1) * pagination.limit) + 1} to{' '}
                      {Math.min(pagination.currentPage * pagination.limit, pagination.totalEntries)} of{' '}
                      {pagination.totalEntries} entries
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handlePageChange(pagination.currentPage - 1)}
                        disabled={!pagination.hasPrev}
                        className={`px-4 py-2 rounded-lg border flex items-center gap-2 ${
                          pagination.hasPrev
                            ? 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
                        }`}
                      >
                        <span>←</span>
                        Previous
                      </button>
                      
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                          const pageNum = i + 1;
                          return (
                            <button
                              key={pageNum}
                              onClick={() => handlePageChange(pageNum)}
                              className={`w-8 h-8 rounded-lg border text-sm ${
                                pagination.currentPage === pageNum
                                  ? 'bg-blue-600 text-white border-blue-600'
                                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                        {pagination.totalPages > 5 && (
                          <span className="text-gray-500 mx-1">...</span>
                        )}
                      </div>
                      
                      <button
                        onClick={() => handlePageChange(pagination.currentPage + 1)}
                        disabled={!pagination.hasNext}
                        className={`px-4 py-2 rounded-lg border flex items-center gap-2 ${
                          pagination.hasNext
                            ? 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
                        }`}
                      >
                        Next
                        <span>→</span>
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Edit Modals */}
          {editingRemarks && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl p-6 w-full max-w-md">
                <h3 className="text-lg font-semibold mb-4">Edit Remarks</h3>
                <textarea
                  value={tempRemarks}
                  onChange={(e) => setTempRemarks(e.target.value)}
                  rows={4}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 mb-4"
                  placeholder="Enter remarks..."
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveRemarks}
                    disabled={savingRemarks}
                    className={`flex-1 bg-green-600 text-white py-2 rounded-lg ${savingRemarks ? 'opacity-50' : ''}`}
                  >
                    {savingRemarks ? 'Saving...' : 'Save Remarks'}
                  </button>
                  <button
                    onClick={() => {
                      setEditingRemarks(false);
                      setEditingEntryId(null);
                    }}
                    className="flex-1 bg-gray-500 text-white py-2 rounded-lg"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {editingProducts && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <h3 className="text-lg font-semibold mb-4">Edit Products</h3>
                <GateOutwardProductEditor 
                  products={tempProducts}
                  onProductsChange={setTempProducts}
                  isRepair={entries.find(e => e._id === editingEntryId)?.isRepair || false}
                />
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={handleSaveProducts}
                    disabled={savingProducts}
                    className={`flex-1 bg-green-600 text-white py-2 rounded-lg ${savingProducts ? 'opacity-50' : ''}`}
                  >
                    {savingProducts ? 'Saving...' : 'Save Products'}
                  </button>
                  <button
                    onClick={() => {
                      setEditingProducts(false);
                      setEditingEntryId(null);
                    }}
                    className="flex-1 bg-gray-500 text-white py-2 rounded-lg"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {editingPhotos && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <h3 className="text-lg font-semibold mb-4">Edit Photos</h3>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload New Photos (Max 5 total)
                  </label>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleNewPhotoUpload}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3"
                  />
                </div>

                {/* Current photos */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                  {tempPhotos.map((photo, index) => (
                    <div key={index} className="relative">
                      <img
                        src={photo}
                        alt={`Photo ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>

                {/* New photo previews */}
                {newPhotos.length > 0 && (
                  <div className="mb-4">
                    <h5 className="font-medium text-gray-700 mb-2">New Photos to Upload:</h5>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {newPhotos.map((photo, index) => (
                        <div key={index} className="relative">
                          <img
                            src={URL.createObjectURL(photo)}
                            alt={`New photo ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveNewPhoto(index)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={handleSavePhotos}
                    disabled={savingPhotos}
                    className={`flex-1 bg-green-600 text-white py-2 rounded-lg ${savingPhotos ? 'opacity-50' : ''}`}
                  >
                    {savingPhotos ? 'Saving...' : 'Save Photos'}
                  </button>
                  <button
                    onClick={() => {
                      setEditingPhotos(false);
                      setEditingEntryId(null);
                      setNewPhotos([]);
                    }}
                    className="flex-1 bg-gray-500 text-white py-2 rounded-lg"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default GateOutwardsView;