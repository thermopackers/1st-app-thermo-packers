import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../axiosInstance';
import Swal from 'sweetalert2';
import InternalNavbar from '../components/InternalNavbar';
import { useUserContext } from '../context/UserContext';

// Product Editor Component
const ProductEditor = ({ products, onProductsChange }) => {
  const [purchaseProducts, setPurchaseProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [showManualProduct, setShowManualProduct] = useState(false);
  const [manualProductName, setManualProductName] = useState('');


  useEffect(() => {
    fetchPurchaseProducts();
  }, []);

  useEffect(() => {
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

  // Add this useEffect inside ProductEditor component
useEffect(() => {
  const handleClickOutside = () => {
    setShowProductDropdown(false);
  };

  document.addEventListener('click', handleClickOutside);
  return () => {
    document.removeEventListener('click', handleClickOutside);
  };
}, []);

  const fetchPurchaseProducts = async () => {
    try {
      const res = await axiosInstance.get('/purchase-products');
      setPurchaseProducts(res.data.data || []);
      setFilteredProducts(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch purchase products', err);
    }
  };

  const handleProductSelect = (product) => {
    const existingProductIndex = products.findIndex(p => 
      p.product?._id === product._id || p.productName === product.name
    );
    
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
    placeholder="Search products by name or code..."
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
                <div className="flex items-center gap-2 bg-white px-3 py-1 rounded border">
                  <button
                    type="button"
                    onClick={() => handleQuantityChange(item.product?._id || item.productName, item.quantity - 1)}
                    className="w-6 h-6 bg-gray-200 rounded flex items-center justify-center hover:bg-gray-300"
                  >
                    -
                  </button>
                  <span className="w-8 text-center font-medium">{item.quantity}</span>
                  <button
                    type="button"
                    onClick={() => handleQuantityChange(item.product?._id || item.productName, item.quantity + 1)}
                    className="w-6 h-6 bg-gray-200 rounded flex items-center justify-center hover:bg-gray-300"
                  >
                    +
                  </button>
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


const GoodsInwardForm = () => {
  const { user } = useUserContext();
  const navigate = useNavigate();
  const { guardEntryId } = useParams();
  
  const [guardEntry, setGuardEntry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [epsGrades, setEpsGrades] = useState([]);
  
    const [editingProducts, setEditingProducts] = useState(false);
  const [editingPhotos, setEditingPhotos] = useState(false);
  const [tempProducts, setTempProducts] = useState([]);
  const [tempPhotos, setTempPhotos] = useState([]);
  const [newPhotos, setNewPhotos] = useState([]);
const [savingProducts, setSavingProducts] = useState(false);
const [savingPhotos, setSavingPhotos] = useState(false);
  // Items state - array of categories
  const [items, setItems] = useState([
    {
      id: 1,
      category: '',
      // Wood fields
      moisture: '',
      woodTypes: [],
      // EPS fields
      epsGrade: '',
      numberOfEpsBags: '',
      grossWeight: '',
      emptyBagWeight: '',
      // Polybag fields
      numberOfPolybags: '',
      polybagSize: '',
      polybagWeight: '',
      // Hardware fields
      hardwareSize: '',
      hardwareWeight: '',
      // Common fields
      description: '',
      quantity: '',
      weight: '',
      // Photos for this specific item
      photos: []
    }
  ]);

  // New state for goods inward entries
  const [goodsInwards, setGoodsInwards] = useState([]);
  const [loadingEntries, setLoadingEntries] = useState(false);
  const [showEntries, setShowEntries] = useState(false);
  const userRoles = Array.isArray(user?.role) ? user.role : [user?.role];

  // Wood type options
  const woodTypeOptions = [
    'deak', 'safeda', 'popular', 'shreen', 'mudh', 'thin_dande', 'jungli'
  ];

  const categoryOptions = [
    { value: 'wood', label: 'Wood' },
    { value: 'eps_bags_thermocol_dana', label: 'EPS Bags/Thermocol Dana' },
    { value: 'raw_aluminium_casting', label: 'Raw Aluminium Casting' },
    { value: 'iron_for_mould_chest', label: 'Iron for Mould Chest' },
    { value: 'full_eps_mould', label: 'Full EPS Mould' },
    { value: 'polybags_plastic_material', label: 'Polybags/Plastic Material' },
    { value: 'hardware_material', label: 'Hardware Material (Nut/Bolt/Screws)' },
    { value: 'misc_items', label: 'Misc. Items' }
  ];

  useEffect(() => {
    fetchGuardEntryDetails();
    fetchEpsGrades();
    fetchGoodsInwards(); // Fetch existing entries when component loads
  }, [guardEntryId]);

useEffect(() => {
  // Check if user has accounts role
  if (!userRoles.includes('accounts') && !userRoles.includes('admin')) {
    Swal.fire('Access Denied', 'Only accounts team can access this page', 'error');
    navigate('/guard-entries-view');
  }
}, [user, navigate, userRoles]);

  const fetchGuardEntryDetails = async () => {
    try {
      const res = await axiosInstance.get(`/guard-entries?page=1&limit=1000`);
      const entries = res.data.entries || [];
      const entry = entries.find(e => e._id === guardEntryId);
      
      if (entry) {
        setGuardEntry(entry);
      } else {
        Swal.fire('Error', 'Guard entry not found', 'error');
        navigate('/guard-entries-view');
      }
    } catch (err) {
      console.error('Failed to fetch guard entry', err);
      Swal.fire('Error', 'Failed to load guard entry details', 'error');
      navigate('/guard-entries-view');
    } finally {
      setLoading(false);
    }
  };

  const fetchEpsGrades = async () => {
    try {
      const res = await axiosInstance.get('/purchase-products');
      
      setEpsGrades(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch EPS grades', err);
    }
  };

  const fetchGoodsInwards = async () => {
    try {
      setLoadingEntries(true);
      const res = await axiosInstance.get(`/goods-inward/guard-entry/${guardEntryId}`);
      setGoodsInwards(res.data.goodsInwardEntries || []);
    } catch (err) {
      console.error('Failed to fetch goods inward entries', err);
      // Don't show error if no entries exist yet
    } finally {
      setLoadingEntries(false);
    }
  };

  // Item management functions
  const addItem = () => {
    if (items.length >= 10) {
      Swal.fire('Warning', 'Maximum 10 categories allowed', 'warning');
      return;
    }
    
    const newItem = {
      id: Date.now(),
      category: '',
      moisture: '',
      woodTypes: [],
      epsGrade: '',
      numberOfEpsBags: '',
      grossWeight: '',
      emptyBagWeight: '',
      numberOfPolybags: '',
      polybagSize: '',
      polybagWeight: '',
      hardwareSize: '',
      hardwareWeight: '',
      description: '',
      quantity: '',
      weight: '',
      photos: []
    };
    
    setItems(prev => [...prev, newItem]);
  };

  const removeItem = (index) => {
    if (items.length === 1) {
      Swal.fire('Warning', 'At least one category is required', 'warning');
      return;
    }
    
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const updateItem = (index, field, value) => {
    setItems(prev => prev.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ));
  };

  const handlePhotoUpload = (e, index) => {
    const files = Array.from(e.target.files);
    const currentPhotos = items[index].photos || [];
    
    if (files.length + currentPhotos.length > 5) {
      Swal.fire('Warning', 'Maximum 5 photos allowed per category', 'warning');
      return;
    }
    
    updateItem(index, 'photos', [...currentPhotos, ...files]);
  };

  const removePhoto = (itemIndex, photoIndex) => {
    updateItem(itemIndex, 'photos', 
      items[itemIndex].photos.filter((_, i) => i !== photoIndex)
    );
  };

  const handleWoodTypeChange = (index, type) => {
    const currentTypes = items[index].woodTypes || [];
    const newTypes = currentTypes.includes(type) 
      ? currentTypes.filter(t => t !== type)
      : [...currentTypes, type];
    
    updateItem(index, 'woodTypes', newTypes);
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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  const formatCategoryName = (category) => {
    const categoryMap = {
      'wood': 'Wood',
      'eps_bags_thermocol_dana': 'EPS Bags/Thermocol Dana',
      'raw_aluminium_casting': 'Raw Aluminium Casting',
      'iron_for_mould_chest': 'Iron for Mould Chest',
      'full_eps_mould': 'Full EPS Mould',
      'polybags_plastic_material': 'Polybags/Plastic Material',
      'hardware_material': 'Hardware Material',
      'misc_items': 'Misc. Items'
    };
    return categoryMap[category] || category;
  };

  const getCategoryDetails = (item) => {
    switch (item.category) {
      case 'wood':
        return `Moisture: ${item.wood?.moisture}% | Types: ${item.wood?.types?.join(', ') || 'None'}`;
      
      case 'eps_bags_thermocol_dana':
        return `Grade: ${item.epsBags?.grade} | Bags: ${item.epsBags?.numberOfBags} | Gross Wt: ${item.epsBags?.grossWeight}kg`;
      
      case 'polybags_plastic_material':
        return `Bags: ${item.polybags?.numberOfBags} | Size: ${item.polybags?.size} | Wt: ${item.polybags?.weight}kg`;
      
      case 'hardware_material':
        return `Size: ${item.hardware?.size} | Wt: ${item.hardware?.weight}kg`;
      
      default:
        return `Desc: ${item.description} | Qty: ${item.quantity} | Wt: ${item.weight}kg`;
    }
  };

  const renderCategoryFields = (item, index) => {
    switch (item.category) {
      case 'wood':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Moisture Content (%)
              </label>
              <input
                type="number"
                step="0.01"
                value={item.moisture}
                onChange={(e) => updateItem(index, 'moisture', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter moisture percentage"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type of Wood
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {woodTypeOptions.map(type => (
                  <label key={type} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={item.woodTypes.includes(type)}
                      onChange={() => handleWoodTypeChange(index, type)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 capitalize">{type.replace('_', ' ')}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        );

      case 'eps_bags_thermocol_dana':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Grade of EPS
              </label>
            <select
  value={item.epsGrade}
  onChange={(e) => updateItem(index, 'epsGrade', e.target.value)}
  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
>
  <option value="">Select EPS Grade</option>
  {epsGrades.map(product => (
    <option key={product._id} value={product.name}>{product.name}</option>
  ))}
</select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number of EPS Bags
              </label>
              <input
                type="number"
                value={item.numberOfEpsBags}
                onChange={(e) => updateItem(index, 'numberOfEpsBags', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter number of bags"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Random Gross Weight of EPS Bags (kg)
              </label>
              <input
                type="number"
                step="0.01"
                value={item.grossWeight}
                onChange={(e) => updateItem(index, 'grossWeight', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter gross weight"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Weight of Empty Plastic Bag + Polythene (kg)
              </label>
              <input
                type="number"
                step="0.01"
                value={item.emptyBagWeight}
                onChange={(e) => updateItem(index, 'emptyBagWeight', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter empty bag weight"
              />
            </div>
          </div>
        );

      case 'polybags_plastic_material':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number of Bags
              </label>
              <input
                type="number"
                value={item.numberOfPolybags}
                onChange={(e) => updateItem(index, 'numberOfPolybags', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter number of bags"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Size of Polybags
              </label>
              <input
                type="text"
                value={item.polybagSize}
                onChange={(e) => updateItem(index, 'polybagSize', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., 12x18 inches"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Weight of Polybag Packet (kg)
              </label>
              <input
                type="number"
                step="0.01"
                value={item.polybagWeight}
                onChange={(e) => updateItem(index, 'polybagWeight', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter weight"
              />
            </div>
          </div>
        );

      case 'hardware_material':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Size of Nut/Bolt/Screws
              </label>
              <input
                type="text"
                value={item.hardwareSize}
                onChange={(e) => updateItem(index, 'hardwareSize', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., M8, 1/2 inch, etc."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Weight of Nut/Bolt/Screws (kg)
              </label>
              <input
                type="number"
                step="0.01"
                value={item.hardwareWeight}
                onChange={(e) => updateItem(index, 'hardwareWeight', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter weight"
              />
            </div>
          </div>
        );

      default:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={item.description}
                onChange={(e) => updateItem(index, 'description', e.target.value)}
                rows="3"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter item description"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity
                </label>
                <input
                  type="number"
                  value={item.quantity}
                  onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter quantity"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Weight (kg)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={item.weight}
                  onChange={(e) => updateItem(index, 'weight', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter weight"
                />
              </div>
            </div>
          </div>
        );
    }
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  
  // Validate that all items have a category
  const invalidItems = items.filter(item => !item.category);
  if (invalidItems.length > 0) {
    Swal.fire('Warning', 'Please select a category for all items', 'warning');
    return;
  }

  setSubmitting(true);
  try {
    const formData = new FormData();
    formData.append('guardEntryId', guardEntryId);
    formData.append('items', JSON.stringify(items));

    // Add all photos with their item index information
    items.forEach((item, itemIndex) => {
      // Add item index as metadata for each photo
      item.photos.forEach((photo, photoIndex) => {
        // Create a new file with the same content but with item index in the name
        const newFile = new File([photo], `item_${itemIndex}_${photo.name}`, { 
          type: photo.type 
        });
        formData.append('photos', newFile);
      });
    });

    await axiosInstance.post('/goods-inward', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    Swal.fire({
      title: 'Success!',
      text: 'Goods inward recorded successfully',
      icon: 'success',
      confirmButtonText: 'OK'
    }).then(() => {
      // Reset form and refresh entries
      setItems([{
        id: 1,
        category: '',
        moisture: '',
        woodTypes: [],
        epsGrade: '',
        numberOfEpsBags: '',
        grossWeight: '',
        emptyBagWeight: '',
        numberOfPolybags: '',
        polybagSize: '',
        polybagWeight: '',
        hardwareSize: '',
        hardwareWeight: '',
        description: '',
        quantity: '',
        weight: '',
        photos: []
      }]);
      fetchGoodsInwards();
      setShowEntries(true);
    });

  } catch (err) {
    console.error('Failed to submit goods inward', err);
    Swal.fire('Error', err.response?.data?.message || 'Failed to record goods inward', 'error');
  } finally {
    setSubmitting(false);
  }
};

  if (loading) {
    return (
      <>
        <InternalNavbar />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      </>
    );
  }
// Handler functions for editing guard data
const handleEditRemarks = async () => {
  const { value: newRemarks } = await Swal.fire({
    title: 'Edit Remarks',
    input: 'textarea',
    inputValue: guardEntry.remarks || '',
    inputPlaceholder: 'Enter new remarks...',
    showCancelButton: true,
    confirmButtonText: 'Update Remarks',
    cancelButtonText: 'Cancel'
  });

  if (newRemarks !== undefined) {
    try {
      const response = await axiosInstance.patch(`/guard-entries/${guardEntryId}`, {
        remarks: newRemarks
      });
      setGuardEntry(prev => ({ ...prev, remarks: newRemarks }));
      Swal.fire('Success!', 'Remarks updated successfully', 'success');
    } catch (error) {
      console.error('Failed to update remarks', error);
      Swal.fire('Error', 'Failed to update remarks', 'error');
    }
  }
};

const handleEditProducts = () => {
  // Convert guard entry products to the format expected by ProductEditor
  const formattedProducts = guardEntry.purchaseProducts.map(item => ({
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
  if (tempProducts.length === 0) {
    Swal.fire('Warning', 'Please add at least one product', 'warning');
    return;
  }
  setSavingProducts(true);

  try {
    const productsToSend = tempProducts.map(item => ({
      product: item.product?._id || null,
      productName: item.productName || item.product?.name || null,
      quantity: item.quantity
    }));

    const response = await axiosInstance.patch(`/guard-entries/${guardEntryId}`, {
      purchaseProducts: JSON.stringify(productsToSend)
    });

    setGuardEntry(prev => ({ ...prev, purchaseProducts: response.data.entry.purchaseProducts }));
    setEditingProducts(false);
    Swal.fire('Success!', 'Products updated successfully', 'success');
  } catch (error) {
    console.error('Failed to update products', error);
    Swal.fire('Error', 'Failed to update products', 'error');
  } finally {
    setSavingProducts(false);
  }
};

const handleEditPhotos = () => {
  setTempPhotos([...guardEntry.photos]);
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
  
  // If it's an existing photo (not a new one), we need to delete from Cloudinary
  if (!photoToRemove.startsWith('blob:')) {
    try {
      await axiosInstance.delete(`/guard-entries/${guardEntryId}/photos`, {
        data: { photoUrl: photoToRemove }
      });
    } catch (error) {
      console.error('Failed to delete photo from server', error);
      Swal.fire('Error', 'Failed to delete photo', 'error');
      return; // Don't proceed if deletion fails
    }
  }
  
  const updatedPhotos = tempPhotos.filter((_, i) => i !== index);
  setTempPhotos(updatedPhotos);
};

const handleRemoveNewPhoto = (index) => {
  setNewPhotos(prev => prev.filter((_, i) => i !== index));
};

const handleSavePhotos = async () => {
    setSavingPhotos(true);
  try {
    const formData = new FormData();
    
    // Add new photos
    newPhotos.forEach(photo => {
      formData.append('photos', photo);
    });

    // Send the update request
    const response = await axiosInstance.patch(`/guard-entries/${guardEntryId}/photos`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    setGuardEntry(prev => ({ ...prev, photos: response.data.entry.photos }));
    setEditingPhotos(false);
    setNewPhotos([]);
    Swal.fire('Success!', 'Photos updated successfully', 'success');
  } catch (error) {
    console.error('Failed to update photos', error);
    Swal.fire('Error', 'Failed to update photos', 'error');
  } finally {
    setSavingPhotos(false);
  }
};

  if (!guardEntry) {
    return null;
  }

  return (
    <>
      <InternalNavbar />
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <div className="flex justify-between items-start mb-4">
             <div>
  <h2 className="text-2xl font-bold text-gray-800 mb-2">
    📦 Goods Inward Entry
    {guardEntry.isRejected && (
      <span className="text-sm text-red-600 ml-2">(Rejected Material)</span>
    )}
  </h2>
  <p className="text-gray-600">
    Record goods received from {guardEntry.isRejected ? 'customer' : 'supplier'}
  </p>
  <p className="text-sm text-blue-600 mt-1">
    {guardEntry.isRejected 
      ? `Customer: ${guardEntry.customer?.name || guardEntry.customerName || 'N/A'}`
      : `Supplier: ${guardEntry.supplier?.name || guardEntry.supplierName || 'N/A'}`
    }
    {(guardEntry.isRejected && guardEntry.customerName) || (!guardEntry.isRejected && guardEntry.supplierName) ? 
      ' (Manual Entry)' : ''
    }
  </p>
</div>
              <button
                onClick={() => navigate('/guard-entries-view')}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition"
              >
                Back to Entries
              </button>
            </div>

            {/* Guard Entry Details - FIXED */}
<div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-blue-50 rounded-lg">
  <div>
    <div className="text-sm text-blue-600 font-medium">Entry Number</div>
    <div className="font-bold text-blue-800">{guardEntry.entryNumber}</div>
    {guardEntry.isRejected && (
      <div className="text-xs text-red-600 font-medium mt-1">(Rejected Entry)</div>
    )}
  </div>
  <div>
    <div className="text-sm text-blue-600 font-medium">
      {guardEntry.isRejected ? 'Customer' : 'Supplier'}
    </div>
    <div className="font-bold text-blue-800 flex items-center gap-2">
      {guardEntry.isRejected 
        ? (guardEntry.customer?.name || guardEntry.customerName || 'N/A')
        : (guardEntry.supplier?.name || guardEntry.supplierName || 'N/A')
      }
      {(guardEntry.isRejected && guardEntry.customerName) || (!guardEntry.isRejected && guardEntry.supplierName) ? (
        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Manual</span>
      ) : null}
    </div>
  </div>
  <div>
    <div className="text-sm text-blue-600 font-medium">Vehicle Number</div>
    <div className="font-bold text-blue-800">{guardEntry.vehicleNumber}</div>
  </div>
</div>
          </div>

          {/* Goods Inward Form */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
     {/* Guard Uploaded Data Display - EDITABLE FOR ACCOUNTS ROLE */}
<div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 mb-6">
  <div className="flex justify-between items-center mb-4">
    <h3 className="text-lg font-semibold text-yellow-800">
      📋 Data Uploaded by Guard
    </h3>
    <div className="text-sm text-blue-600 font-medium">
      Entry Time: {formatDate(guardEntry.createdAt)}
    </div>
  </div>
  
  {/* Products from Guard Entry - EDITABLE */}
  {guardEntry.purchaseProducts && guardEntry.purchaseProducts.length > 0 && (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-2">
        <h4 className="font-medium text-yellow-700">Products Recorded by Guard:</h4>
        {userRoles.includes('accounts') && !editingProducts && (
          <button
            type="button"
            onClick={() => handleEditProducts()}
            className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
          >
            Edit Products
          </button>
        )}
      </div>

      {!editingProducts ? (
        // Display mode
        <div className="space-y-2">
          {guardEntry.purchaseProducts.map((product, index) => (
            <div key={index} className="bg-white p-3 rounded-lg border border-yellow-100">
              <div className="flex justify-between items-start">
                <div>
                  <span className="font-medium text-gray-900">
                    {product.product?.name || product.productName || 'Unknown Product'}
                  </span>
                  {product.product?.code && (
                    <div className="text-sm text-gray-600">Code: {product.product.code}</div>
                  )}
                  {product.productName && (
                    <div className="text-xs text-green-600 font-medium">📝 Manual Entry</div>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-blue-600">{product.quantity}</div>
                  <div className="text-xs text-gray-500">Quantity</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Edit mode for products
        <div className="bg-white p-4 rounded-lg border border-yellow-200">
          <ProductEditor 
            products={tempProducts}
            onProductsChange={setTempProducts}
          />
          <div className="flex gap-2 mt-4">
           <button
  type="button"
  onClick={handleSaveProducts}
  disabled={savingProducts}
  className={`bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 ${
    savingProducts ? 'opacity-50 cursor-not-allowed' : ''
  }`}
>
  {savingProducts ? 'Saving...' : 'Save Products'}
</button>
            <button
              type="button"
              onClick={() => setEditingProducts(false)}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )}

  {/* Remarks from Guard Entry - EDITABLE */}
  <div className="mb-4">
    <div className="flex justify-between items-center mb-2">
      <h4 className="font-medium text-yellow-700">Remarks by Guard:</h4>
      {userRoles.includes('accounts') && (
        <button
          type="button"
          onClick={() => handleEditRemarks()}
          className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
        >
          Edit Remarks
        </button>
      )}
    </div>
    <div className="bg-white p-3 rounded-lg border border-yellow-100">
      <p className="text-gray-700 whitespace-pre-wrap">
        {guardEntry.remarks || 'No remarks provided by guard'}
      </p>
    </div>
  </div>

  {/* Photos from Guard Entry - EDITABLE */}
  <div>
    <div className="flex justify-between items-center mb-2">
      <h4 className="font-medium text-yellow-700">
        Photos by Guard ({guardEntry.photos?.length || 0}):
        {editingPhotos && <span className="text-blue-600 ml-2">Editing Mode</span>}
      </h4>
      {userRoles.includes('accounts') && !editingPhotos && (
        <button
          type="button"
          onClick={() => handleEditPhotos()}
          className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
        >
          Edit Photos
        </button>
      )}
    </div>

    {!editingPhotos ? (
      // Display mode for photos
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {guardEntry.photos?.map((photo, index) => (
          <div key={index} className="relative">
            <img
              src={photo}
              alt={`Guard photo ${index + 1}`}
              className="w-full h-32 object-cover rounded-lg cursor-pointer"
              onClick={() => showPhoto(photo, `Guard Photo ${index + 1} - ${guardEntry.vehicleNumber}`)}
            />
            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 text-center">
              Guard Photo {index + 1}
            </div>
          </div>
        ))}
      </div>
    ) : (
      // Edit mode for photos
      <div className="bg-white p-4 rounded-lg border border-yellow-200">
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

        {/* Current photos with delete option */}
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
              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 text-center">
                {photo.startsWith('blob:') ? 'New Photo' : `Photo ${index + 1}`}
              </div>
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
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 text-center">
                    New Photo {index + 1}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2">
        <button
  type="button"
  onClick={handleSavePhotos}
  disabled={savingPhotos}
  className={`bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 ${
    savingPhotos ? 'opacity-50 cursor-not-allowed' : ''
  }`}
>
  {savingPhotos ? 'Saving...' : 'Save Photos'}
</button>
          <button
            type="button"
            onClick={() => {
              setEditingPhotos(false);
              setNewPhotos([]);
            }}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            Cancel
          </button>
        </div>
      </div>
    )}
  </div>
</div>
            <form onSubmit={handleSubmit} className="space-y-6">
          
              {/* Items List */}
              {items.map((item, index) => (
                <div key={item.id} className="border-2 border-dashed border-gray-300 rounded-2xl p-6">
                  {/* Item Header */}
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">
                      Category #{index + 1}
                    </h3>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600 transition text-sm"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  {/* Category Selection */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category *
                    </label>
                    <select
                      value={item.category}
                      onChange={(e) => updateItem(index, 'category', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select Category</option>
                      {categoryOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Dynamic Category Fields */}
                  {item.category && renderCategoryFields(item, index)}

                  {/* Photo Upload for this item */}
                  <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Upload Photos for this Category (Max 5)
                    </label>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => handlePhotoUpload(e, index)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3"
                    />
                    
                    {/* Photo Previews */}
                    {item.photos.length > 0 && (
                      <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                        {item.photos.map((photo, photoIndex) => (
                          <div key={photoIndex} className="relative">
                            <img
                              src={URL.createObjectURL(photo)}
                              alt={`Preview ${photoIndex + 1}`}
                              className="w-full h-32 object-cover rounded-lg"
                            />
                            <button
                              type="button"
                              onClick={() => removePhoto(index, photoIndex)}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Add More Category Button */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={addItem}
                  className="bg-green-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-600 transition flex items-center gap-2 mx-auto"
                >
                  <span>➕</span>
                  Add Another Category
                </button>
              </div>

              {/* Submit Button */}
              <div className="flex gap-4 pt-6 border-t">
                <button
                  type="submit"
                  disabled={submitting}
                  className={`flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold transition ${
                    submitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'
                  }`}
                >
                  {submitting ? 'Recording...' : `Record ${items.length} Categor${items.length === 1 ? 'y' : 'ies'}`}
                </button>
                
                <button
                  type="button"
                  onClick={() => navigate('/guard-entries-view')}
                  className="flex-1 bg-gray-500 text-white py-3 rounded-lg font-semibold hover:bg-gray-600 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
           {/* Toggle Button for Entries */}
          <div className="mb-6 text-center">
            <button
              onClick={() => {
                setShowEntries(!showEntries);
                if (!showEntries) {
                  fetchGoodsInwards();
                }
              }}
              className="bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition flex items-center gap-2 mx-auto mt-4"
            >
              <span>{showEntries ? '👇' : '👆'}</span>
              {showEntries ? 'Hide All Inward Entries' : 'Show All Inward Entries'}
              <span className="bg-white text-purple-600 px-2 py-1 rounded text-sm">
                {goodsInwards.length}
              </span>
            </button>
          </div>

          {/* Previous Goods Inward Entries */}
          {showEntries && (
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                📋 Previous Goods Inward Entries
              </h3>
              
              {loadingEntries ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading entries...</p>
                </div>
              ) : goodsInwards.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No goods inward entries recorded yet for this guard entry.
                </div>
              ) : (
                <div className="space-y-4">
        {goodsInwards.map((goodsInward) => (
          <div key={goodsInward._id} className="border-2 border-gray-200 rounded-2xl p-6 hover:border-blue-300 transition">
            {/* Header - Update grid to 5 columns */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4 p-4 bg-blue-50 rounded-lg">
              <div>
                <div className="text-sm text-blue-600 font-medium">Recorded On</div>
                <div className="font-bold text-blue-800">{formatDate(goodsInward.createdAt)}</div>
              </div>
              <div>
                <div className="text-sm text-blue-600 font-medium">Total Categories</div>
                <div className="font-bold text-blue-800">{goodsInward.items?.length || 0}</div>
              </div>
              <div>
                <div className="text-sm text-blue-600 font-medium">Recorded By</div>
                <div className="font-bold text-blue-800">{goodsInward.recordedBy?.name}</div>
              </div>
              <div>
                <div className="text-sm text-blue-600 font-medium">Status</div>
                <div className="font-bold text-green-800">Completed</div>
              </div>
              <div>
                <div className="text-sm text-blue-600 font-medium">Entry Number</div>
                <div className="font-bold text-blue-800">{goodsInward.entryNumber}</div>
              </div>
            </div>

            {/* ✅ Show Remarks if exists */}
            {goodsInward.remarks && (
              <div className="mb-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="text-sm text-yellow-700 font-medium">Remarks:</div>
                <div className="text-yellow-800">{goodsInward.remarks}</div>
              </div>
            )}

                      {/* Items */}
                      <div className="space-y-3">
                        <h4 className="font-semibold text-gray-800">Items Received:</h4>
                        {goodsInward.items?.map((item, itemIndex) => (
                          <div key={itemIndex} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <span className="font-medium text-gray-900">
                                  {formatCategoryName(item.category)}
                                </span>
                                <div className="text-sm text-gray-600 mt-1">
                                  {getCategoryDetails(item)}
                                </div>
                              </div>
                              <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                                {itemIndex + 1}
                              </span>
                            </div>
                            
                            {/* Photos */}
                            {item.photos && item.photos.length > 0 && (
                              <div className="mt-3">
                                <div className="text-sm text-gray-700 mb-2">Photos:</div>
                                <div className="flex gap-2 flex-wrap">
                                  {item.photos.map((photo, photoIndex) => (
                                    <button
                                      key={photoIndex}
                                      onClick={() => showPhoto(photo, `${goodsInward.entryNumber} - ${formatCategoryName(item.category)} - Photo ${photoIndex + 1}`)}
                                      className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition flex items-center gap-1"
                                    >
                                      <span>📸</span>
                                      Photo {photoIndex + 1}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default GoodsInwardForm;