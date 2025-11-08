import { useState, useEffect } from "react";
import axiosInstance from "../axiosInstance";
import { motion, AnimatePresence } from "framer-motion";
import * as XLSX from "xlsx";
import Swal from "sweetalert2";

export default function ProductCustomerSearch() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [categories, setCategories] = useState([]);

  // Fetch categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axiosInstance.get("/categories");
        setCategories(res.data);
      } catch (err) {
        console.error("Failed to load categories", err);
      }
    };
    fetchCategories();
  }, []);

  // Helper function to safely get string values
  const safeString = (value, defaultValue = "") => {
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return value.toString();
    return defaultValue;
  };

  const handleProductSearch = async (query) => {
    if (!query.trim()) {
      setShowResults(false);
      setSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      const [purchaseRes, salesRes] = await Promise.all([
        axiosInstance.get(`/purchase-products?search=${query}&limit=10`),
        axiosInstance.get(`/products-multer?search=${query}&limit=10`)
      ]);

      const purchaseProducts = purchaseRes.data.data || [];
      const salesProducts = salesRes.data.products || [];

      // Find matching categories
      const matchingCategories = categories.filter(cat => 
        cat.name.toLowerCase().includes(query.toLowerCase())
      );

      let suppliers = [];
      
      // If we have matching categories, fetch suppliers for those categories
      if (matchingCategories.length > 0) {
        const supplierPromises = matchingCategories.map(category =>
          axiosInstance.get(`/suppliers?category=${encodeURIComponent(category.name)}&limit=10`)
        );
        
        const supplierResults = await Promise.all(supplierPromises);
        suppliers = supplierResults.flatMap(res => res.data.data || []);
        
        // Remove duplicates based on supplier ID
        suppliers = suppliers.filter((supplier, index, self) =>
          index === self.findIndex(s => s._id === supplier._id)
        );
      }

      // Ensure all data is properly formatted
      const results = [
        ...purchaseProducts.map(p => ({
          _id: p._id || `purchase-${Date.now()}`,
          type: 'purchase',
          id: p._id,
          name: safeString(p.name, 'Unnamed Product'),
          unit: safeString(p.unit),
          price: typeof p.price === 'number' ? p.price : safeString(p.price),
          rawData: p
        })),
        ...salesProducts.map(p => ({
          _id: p._id || `sales-${Date.now()}`,
          type: 'sales',
          id: p._id,
          name: safeString(p.name, 'Unnamed Product'),
          unit: safeString(p.unit),
          price: typeof p.price === 'number' ? p.price : safeString(p.price),
          rawData: p
        })),
        ...suppliers.map(s => ({
          _id: s._id || `supplier-${Date.now()}`,
          type: 'supplier',
          id: s._id,
          name: safeString(s.name, 'Unnamed Supplier'),
          vendorCategory: Array.isArray(s.vendorCategory) ? s.vendorCategory : [s.vendorCategory].filter(Boolean),
          phone: safeString(s.phone),
          phone2: safeString(s.phone2),
          email: safeString(s.email),
          address: safeString(s.address),
          gstNumber: safeString(s.gstNumber),
          locationLink: safeString(s.locationLink),
          accountName: safeString(s.accountName),
          bankName: safeString(s.bankName),
          accountNumber: safeString(s.accountNumber),
          ifscCode: safeString(s.ifscCode),
          rawData: s,
          // Add category info for display
          matchedCategory: matchingCategories.find(cat => 
            Array.isArray(s.vendorCategory) 
              ? s.vendorCategory.includes(cat.name)
              : s.vendorCategory === cat.name
          )?.name
        }))
      ];

      setSearchResults(results);
      setShowResults(true);
    } catch (err) {
      console.error("Product search error:", err);
      Swal.fire({
        title: "Search Error",
        text: "Failed to search products",
        icon: "error",
        confirmButtonColor: "#2563eb",
        background: '#f8fafc',
        customClass: {
          popup: 'rounded-2xl'
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProductSelect = async (product) => {
    setSelectedProduct(product);
    setShowResults(false);
    setSearchQuery(product.name);
    
    try {
      setLoading(true);
      
      if (product.type === 'sales') {
        // Fetch customers who have ordered this sales product
        const res = await axiosInstance.get(`/orders/product-customers/${encodeURIComponent(product.name)}`);
        
        // Ensure customer data is properly formatted
        const customers = Array.isArray(res.data) ? res.data : [];
        const formattedCustomers = customers.map(customer => ({
          _id: customer._id || `customer-${Date.now()}`,
          customerName: safeString(customer.customerName, 'Unknown Customer'),
          company: safeString(customer.company, 'URP'),
          phone: safeString(customer.phone, '-'),
          email: safeString(customer.email, '-'),
          address: safeString(customer.address, '-'),
          locationLink: safeString(customer.locationLink),
          instructions: safeString(customer.instructions),
          totalOrders: typeof customer.totalOrders === 'number' ? customer.totalOrders : 0,
          lastPrice: typeof customer.lastPrice === 'number' ? customer.lastPrice : safeString(customer.lastPrice),
          lastOrderDate: customer.lastOrderDate ? new Date(customer.lastOrderDate).toISOString() : null
        }));
        
        setSearchResults(formattedCustomers);
      } else if (product.type === 'purchase' || product.type === 'supplier') {
        // For purchase products or suppliers, show the item itself
        setSearchResults([product]);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      Swal.fire({
        title: "Error",
        text: "Failed to fetch data",
        icon: "error",
        confirmButtonColor: "#2563eb",
      });
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = () => {
    if (!selectedProduct || searchResults.length === 0 || selectedProduct.type !== 'sales') return;

    try {
      const worksheetData = [
        ["Customer Name", "Company", "Phone", "Email", "Address", "Location", "Instructions", "Total Orders", "Last Order Date", "Last Price"],
        ...searchResults.map(customer => [
          safeString(customer.customerName),
          safeString(customer.company, "URP"),
          safeString(customer.phone, "-"),
          safeString(customer.email, "-"),
          safeString(customer.address, "-"),
          safeString(customer.locationLink, "-"),
          safeString(customer.instructions, "-"),
          customer.totalOrders || 0,
          customer.lastOrderDate ? new Date(customer.lastOrderDate).toLocaleDateString() : "-",
          customer.lastPrice ? `₹${customer.lastPrice}` : "-"
        ])
      ];

      const ws = XLSX.utils.aoa_to_sheet(worksheetData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Customers");

      const colWidths = [
        { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 25 }, 
        { wch: 30 }, { wch: 30 }, { wch: 30 }, { wch: 12 }, 
        { wch: 15 }, { wch: 12 }
      ];
      ws['!cols'] = colWidths;

      XLSX.writeFile(wb, `${selectedProduct.name}_customers.xlsx`);
    } catch (error) {
      console.error("Export error:", error);
      Swal.fire({
        title: "Export Error",
        text: "Failed to export data",
        icon: "error",
        confirmButtonColor: "#2563eb",
      });
    }
  };

  const resetSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setSelectedProduct(null);
    setShowResults(false);
  };

  // Safe render functions
  const renderSearchResultItem = (item) => {
    const name = safeString(item.name);
    const unit = safeString(item.unit);
    const price = item.price;
    const category = Array.isArray(item.vendorCategory) ? item.vendorCategory.join(', ') : safeString(item.vendorCategory);
    const matchedCategory = item.matchedCategory;

    return (
      <div className="flex justify-between items-start">
        <div>
          <h5 className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
            {name}
          </h5>
          <p className="text-sm text-gray-600 mt-1">
            {unit && `${unit} • `}
            <span className={`font-medium ml-1 ${
              item.type === 'purchase' ? 'text-green-600' : 
              item.type === 'sales' ? 'text-purple-600' : 'text-orange-600'
            }`}>
              {item.type === 'purchase' ? 'Purchase Product' : 
               item.type === 'sales' ? 'Sales Product' : 
               'Supplier'}
            </span>
            {price && (
              <span className="ml-2 text-blue-600 font-bold">
                {typeof price === 'number' ? `₹${price}` : `₹${safeString(price)}`}
              </span>
            )}
          </p>
          {(category || matchedCategory) && (
            <p className="text-xs text-gray-500 mt-1">
              Category: {matchedCategory || category}
            </p>
          )}
        </div>
      </div>
    );
  };

  const renderResultDetails = (item) => {
    if (selectedProduct.type === 'supplier' || selectedProduct.type === 'purchase') {
      const vendorCategory = Array.isArray(item.vendorCategory) ? item.vendorCategory.join(', ') : safeString(item.vendorCategory);
      
      return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <h5 className="font-semibold text-gray-900 text-lg mb-2">
              {safeString(item.name)}
            </h5>
            <div className="space-y-1 text-sm text-gray-600">
              <p><span className="font-medium">Type:</span> {item.type === 'supplier' ? 'Supplier' : 'Purchase Product'}</p>
              {vendorCategory && (
                <p><span className="font-medium">Category:</span> {vendorCategory}</p>
              )}
              {item.phone && (
                <p><span className="font-medium">Phone:</span> {safeString(item.phone)}</p>
              )}
              {item.email && (
                <p><span className="font-medium">Email:</span> {safeString(item.email)}</p>
              )}
              {item.gstNumber && (
                <p><span className="font-medium">GST:</span> {safeString(item.gstNumber)}</p>
              )}
            </div>
          </div>
          
          <div className="space-y-1 text-sm text-gray-600">
            {item.address && (
              <p><span className="font-medium">Address:</span> {safeString(item.address)}</p>
            )}
            {item.locationLink && (
              <p>
                <span className="font-medium">Location:</span>{" "}
                <a 
                  href={safeString(item.locationLink)} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  View on Map
                </a>
              </p>
            )}
            {item.accountName && (
              <p><span className="font-medium">Account Name:</span> {safeString(item.accountName)}</p>
            )}
            {item.bankName && (
              <p><span className="font-medium">Bank:</span> {safeString(item.bankName)}</p>
            )}
          </div>
        </div>
      );
    } else {
      // Customer display
      return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <h5 className="font-semibold text-gray-900 text-lg mb-2">
              {safeString(item.customerName, 'Unknown Customer')}
            </h5>
            <div className="space-y-1 text-sm text-gray-600">
              <p><span className="font-medium">GST:</span> {safeString(item.company, "URP")}</p>
              <p><span className="font-medium">Phone:</span> {safeString(item.phone, "-")}</p>
              <p><span className="font-medium">Email:</span> {safeString(item.email, "-")}</p>
              <p><span className="font-medium">Total Orders:</span> {item.totalOrders || 0}</p>
              {item.lastPrice && (
                <p><span className="font-medium">Last Price:</span> ₹{safeString(item.lastPrice)}</p>
              )}
            </div>
          </div>
          
          <div className="space-y-1 text-sm text-gray-600">
            <p><span className="font-medium">Address:</span> {safeString(item.address, "-")}</p>
            {item.locationLink && (
              <p>
                <span className="font-medium">Location:</span>{" "}
                <a 
                  href={safeString(item.locationLink)} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  View on Map
                </a>
              </p>
            )}
            {item.instructions && (
              <p>
                <span className="font-medium">Instructions:</span> {safeString(item.instructions)}
              </p>
            )}
            {item.lastOrderDate && (
              <p>
                <span className="font-medium">Last Ordered:</span>{" "}
                {new Date(item.lastOrderDate).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
      );
    }
  };

  return (
    <motion.div 
      className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-100"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <span className="text-2xl">🔍</span>
          Search Products & Suppliers
        </h3>
        
        {selectedProduct && searchResults.length > 0 && selectedProduct.type === 'sales' && (
          <motion.button
            onClick={exportToExcel}
            className="bg-green-600 text-white px-4 py-2 rounded-xl font-semibold shadow-lg hover:bg-green-700 transition-all duration-300 flex items-center gap-2"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span>📊</span>
            Export to Excel
          </motion.button>
        )}
      </div>

      <div className="relative mb-4">
        <input
          type="text"
          placeholder="Search products by name or suppliers by category..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            handleProductSearch(e.target.value);
          }}
          className="w-full border-2 border-gray-200 rounded-2xl px-6 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-white/80 backdrop-blur-sm"
        />
        {loading && (
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      <div className="text-sm text-gray-600 mb-2">
        💡 <strong>Tip:</strong> Search for product names or supplier categories (e.g., "wood", "steel", "plastic")
      </div>

      {/* Search Results */}
      <AnimatePresence>
        {showResults && searchResults.length > 0 && !selectedProduct && (
          <motion.div
            className="absolute z-50 w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-gray-200 max-h-96 overflow-y-auto mt-2"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className="p-4">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-bold text-gray-800">Select Product or Supplier</h4>
                <button 
                  onClick={() => setShowResults(false)}
                  className="text-gray-500 hover:text-gray-700 transition-colors p-1 rounded-full hover:bg-gray-100"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-2">
                {searchResults.map((item) => (
                  <motion.div 
                    key={`${item.type}-${item._id}`}
                    onClick={() => handleProductSelect(item)}
                    className="p-3 border border-gray-100 rounded-xl hover:bg-blue-50 cursor-pointer transition-all duration-300 group"
                    whileHover={{ x: 5 }}
                  >
                    {renderSearchResultItem(item)}
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Customer/Supplier Results */}
      {selectedProduct && (
        <motion.div
          className="mt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-gray-900">
              {selectedProduct.type === 'supplier' ? 'Supplier Details:' : 
               selectedProduct.type === 'purchase' ? 'Purchase Product Supplier:' : 
               'Customers for:'} 
              <span className="text-blue-600"> {safeString(selectedProduct.name)}</span>
            </h4>
            <button
              onClick={resetSearch}
              className="text-gray-500 hover:text-gray-700 text-sm font-medium flex items-center gap-1"
            >
              ✕ Clear Search
            </button>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-gray-600">Loading data...</p>
            </div>
          ) : searchResults.length > 0 ? (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {searchResults.map((item, index) => (
                <motion.div
                  key={item._id || index}
                  className="bg-gray-50 rounded-xl p-4 border border-gray-200"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  {renderResultDetails(item)}
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-gray-50 rounded-xl">
              <div className="text-4xl mb-2">😔</div>
              <p className="text-gray-600">No data found.</p>
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}