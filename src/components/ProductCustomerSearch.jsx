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

      const results = [
        ...purchaseProducts.map(p => ({
          ...p,
          type: 'purchase',
          id: p._id,
          name: p.name,
          unit: p.unit,
          price: p.price
        })),
        ...salesProducts.map(p => ({
          ...p,
          type: 'sales',
          id: p._id,
          name: p.name,
          unit: p.unit,
          price: p.price
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
      // Fetch customers who have ordered this product
      const res = await axiosInstance.get(`/orders/product-customers/${encodeURIComponent(product.name)}`);
      setSearchResults(res.data);
    } catch (err) {
      console.error("Error fetching customers:", err);
      Swal.fire({
        title: "Error",
        text: "Failed to fetch customer data",
        icon: "error",
        confirmButtonColor: "#2563eb",
      });
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = () => {
    if (!selectedProduct || searchResults.length === 0) return;

    const worksheetData = [
      ["Customer Name", "Company", "Phone", "Email", "Address", "Location", "Instructions", "Total Orders", "Last Order Date", "Last Price"],
      ...searchResults.map(customer => [
        customer.customerName,
        customer.company || "URP",
        customer.phone || "-",
        customer.email || "-",
        customer.address || "-",
        customer.locationLink || "-",
        customer.instructions || "-",
        customer.totalOrders,
        customer.lastOrderDate ? new Date(customer.lastOrderDate).toLocaleDateString() : "-",
        customer.lastPrice ? `₹${customer.lastPrice}` : "-"
      ])
    ];

    const ws = XLSX.utils.aoa_to_sheet(worksheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Customers");

    // Auto-size columns
    const colWidths = [
      { wch: 20 }, // Customer Name
      { wch: 15 }, // Company
      { wch: 15 }, // Phone
      { wch: 25 }, // Email
      { wch: 30 }, // Address
      { wch: 30 }, // Location
      { wch: 30 }, // Instructions
      { wch: 12 }, // Total Orders
      { wch: 15 }, // Last Order Date
      { wch: 12 }  // Last Price
    ];
    ws['!cols'] = colWidths;

    XLSX.writeFile(wb, `${selectedProduct.name}_customers.xlsx`);
  };

  const resetSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setSelectedProduct(null);
    setShowResults(false);
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
          Search Customers by Product
        </h3>
        
        {selectedProduct && searchResults.length > 0 && (
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
          placeholder="Search product to find customers..."
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
                <h4 className="font-bold text-gray-800">Select Product</h4>
                <button 
                  onClick={() => setShowResults(false)}
                  className="text-gray-500 hover:text-gray-700 transition-colors p-1 rounded-full hover:bg-gray-100"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-2">
                {searchResults.map((product) => (
                  <motion.div 
                    key={`${product.type}-${product.id}`}
                    onClick={() => handleProductSelect(product)}
                    className="p-3 border border-gray-100 rounded-xl hover:bg-blue-50 cursor-pointer transition-all duration-300 group"
                    whileHover={{ x: 5 }}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h5 className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
                          {product.name}
                        </h5>
                        <p className="text-sm text-gray-600 mt-1">
                          {product.unit} • 
                          <span className={`font-medium ml-1 ${product.type === 'purchase' ? 'text-green-600' : 'text-purple-600'}`}>
                            {product.type === 'purchase' ? 'Purchase' : 'Sales'} Product
                          </span>
                          {product.price && (
                            <span className="ml-2 text-blue-600 font-bold">₹{product.price}</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Customer Results */}
      {selectedProduct && (
        <motion.div
          className="mt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-gray-900">
              Customers for: <span className="text-blue-600">{selectedProduct.name}</span>
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
              <p className="text-gray-600">Loading customer data...</p>
            </div>
          ) : searchResults.length > 0 ? (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {searchResults.map((customer, index) => (
                <motion.div
                  key={customer._id || index}
                  className="bg-gray-50 rounded-xl p-4 border border-gray-200"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div>
                      <h5 className="font-semibold text-gray-900 text-lg mb-2">
                        {customer.customerName}
                      </h5>
                      <div className="space-y-1 text-sm text-gray-600">
                        <p><span className="font-medium">Company:</span> {customer.company || "URP"}</p>
                        <p><span className="font-medium">Phone:</span> {customer.phone || "-"}</p>
                        <p><span className="font-medium">Email:</span> {customer.email || "-"}</p>
                        <p><span className="font-medium">Total Orders:</span> {customer.totalOrders || 0}</p>
                        {customer.lastPrice && (
                          <p><span className="font-medium">Last Price:</span> ₹{customer.lastPrice}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-1 text-sm text-gray-600">
                      <p><span className="font-medium">Address:</span> {customer.address || "-"}</p>
                      {customer.locationLink && (
                        <p>
                          <span className="font-medium">Location:</span>{" "}
                          <a 
                            href={customer.locationLink} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            View on Map
                          </a>
                        </p>
                      )}
                      {customer.instructions && (
                        <p>
                          <span className="font-medium">Instructions:</span> {customer.instructions}
                        </p>
                      )}
                      {customer.lastOrderDate && (
                        <p>
                          <span className="font-medium">Last Ordered:</span>{" "}
                          {new Date(customer.lastOrderDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-gray-50 rounded-xl">
              <div className="text-4xl mb-2">😔</div>
              <p className="text-gray-600">No customers found for this product.</p>
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}