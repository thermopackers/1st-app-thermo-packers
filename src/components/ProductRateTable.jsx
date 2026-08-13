import { useState, useEffect } from "react";
import axiosInstance from "../axiosInstance";
import toast from "react-hot-toast";
import { Download, Search, RefreshCw, ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from "lucide-react";
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

export default function ProductRateTable() {
  const [isOpen, setIsOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]); // Store all for export
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [rmRate, setRmRate] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState("name");
  const [sortDirection, setSortDirection] = useState("asc");
  const [purchaseProducts, setPurchaseProducts] = useState([]); // ✅ NEW: For trading products
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [totalProducts, setTotalProducts] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchData();
      fetchPurchaseProducts(); // ✅ NEW: Fetch purchase products for trading items
    }
  }, [isOpen]);

  // ✅ NEW: Fetch purchase products for trading items
  const fetchPurchaseProducts = async () => {
    try {
      const res = await axiosInstance.get("/purchase-products/purchase-products-all");
      setPurchaseProducts(res.data);
    } catch (err) {
      console.error("Error fetching purchase products:", err);
    }
  };

  // Fetch data with pagination
  const fetchData = async (page = 1) => {
    setLoading(true);
    try {
      // Only fetch first page initially (20 products)
      const [productsRes, rmRateRes] = await Promise.all([
        axiosInstance.get(`/products-multer?page=${page}&limit=${itemsPerPage}`),
        axiosInstance.get("/rm-rate")
      ]);
      
      const newProducts = productsRes.data.products || [];
      const total = productsRes.data.total || 0;
      
      setProducts(newProducts);
      setFilteredProducts(newProducts);
      setTotalProducts(total);
      setCurrentPage(page);
      setRmRate(rmRateRes.data.rate || 0);
      
    } catch (err) {
      console.error("Error fetching data:", err);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  // Load all products ONLY for export (not for display)
  const loadAllProductsForExport = async () => {
    try {
      const res = await axiosInstance.get("/products-multer?limit=10000");
      return res.data.products || [];
    } catch (err) {
      console.error("Error loading all products:", err);
      toast.error("Failed to load products for export");
      return [];
    }
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > Math.ceil(totalProducts / itemsPerPage)) return;
    fetchData(newPage);
  };

  // Handle items per page change
  const handleItemsPerPageChange = (e) => {
    const newLimit = parseInt(e.target.value);
    setItemsPerPage(newLimit);
    fetchData(1); // Reset to first page with new limit
  };

  // Search - filter only current page products
  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    
    if (term.trim() === "") {
      setFilteredProducts(products);
      return;
    }
    
    const filtered = products.filter(product => 
      product.name.toLowerCase().includes(term) ||
      product.unit?.toLowerCase().includes(term)
    );
    setFilteredProducts(filtered);
  };

  // Sort current page products
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // ✅ UPDATED: Calculate price with support for Non-Thermocol products
  const calculatePrice = (product) => {
    let conversionRate = 0;
    let purchasePrice = 0;
    let isNonThermocol = product.isNonThermocol || false;
    let totalPerKg = 0;
    
    // ✅ For Non-Thermocol products - use purchase product price + trading conversion
    if (isNonThermocol && product.linkedPurchaseProductId) {
      const linkedPurchase = purchaseProducts.find(p => p._id === product.linkedPurchaseProductId);
      if (linkedPurchase) {
        purchasePrice = linkedPurchase.price || 0;
        conversionRate = parseFloat(product.tradingConversion) || 0;
        totalPerKg = purchasePrice + conversionRate;
      } else {
        // Fallback to RM rate if linked product not found
        conversionRate = parseFloat(product.conversion) || 0;
        totalPerKg = rmRate + conversionRate;
      }
    } else {
      // ✅ Regular products - use RM rate + conversion (EXISTING BEHAVIOR)
      conversionRate = parseFloat(product.conversion) || 0;
      totalPerKg = rmRate + conversionRate;
    }
    
    let weightInKg = 0;
    let weightInGrams = 0;
    
    if (product.weight) {
      const num = parseFloat(product.weight);
      if (!isNaN(num)) {
        weightInKg = num;
        weightInGrams = num * 1000;
      }
    }
    
    const unit = product.unit?.toLowerCase() || "";
    const isKgUnit = unit === "kg" || unit === "kgs";
    
    let pricePerPiece = 0;
    let isWeightBased = false;
    
    if (isKgUnit) {
      pricePerPiece = totalPerKg;
      isWeightBased = false;
    } else {
      if (weightInKg > 0) {
        pricePerPiece = totalPerKg * weightInKg;
        isWeightBased = true;
      } else {
        pricePerPiece = totalPerKg;
        isWeightBased = false;
      }
    }
    
    const gstPercent = parseFloat(product.gstPercent) || 18;
    const gstAmount = pricePerPiece * (gstPercent / 100);
    const finalPrice = pricePerPiece + gstAmount;
    
    return {
      conversionRate,
      weightInKg,
      weightInGrams: Math.round(weightInGrams),
      totalPerKg,
      pricePerPiece: pricePerPiece,
      isWeightBased,
      gstAmount: gstAmount,
      finalPrice: finalPrice,
      unit: product.unit || "kg",
      isNonThermocol,
      purchasePrice: isNonThermocol ? purchasePrice : null,
      gstPercent
    };
  };

  // Get sorted products from current page
  const getSortedProducts = () => {
    const sorted = [...filteredProducts];
    sorted.sort((a, b) => {
      let aVal, bVal;
      
      if (sortField === "name") {
        aVal = a.name?.toLowerCase() || "";
        bVal = b.name?.toLowerCase() || "";
      } else if (sortField === "unit") {
        aVal = a.unit?.toLowerCase() || "";
        bVal = b.unit?.toLowerCase() || "";
      } else if (sortField === "conversion") {
        const aCalc = calculatePrice(a);
        const bCalc = calculatePrice(b);
        aVal = aCalc ? aCalc.conversionRate : 0;
        bVal = bCalc ? bCalc.conversionRate : 0;
      } else if (sortField === "weight") {
        aVal = parseFloat(a.weight) || 0;
        bVal = parseFloat(b.weight) || 0;
      } else if (sortField === "pricePerPiece") {
        const aCalc = calculatePrice(a);
        const bCalc = calculatePrice(b);
        aVal = aCalc ? aCalc.pricePerPiece : 0;
        bVal = bCalc ? bCalc.pricePerPiece : 0;
      } else if (sortField === "finalPrice") {
        const aCalc = calculatePrice(a);
        const bCalc = calculatePrice(b);
        aVal = aCalc ? aCalc.finalPrice : 0;
        bVal = bCalc ? bCalc.finalPrice : 0;
      } else if (sortField === "gstAmount") {
        const aCalc = calculatePrice(a);
        const bCalc = calculatePrice(b);
        aVal = aCalc ? aCalc.gstAmount : 0;
        bVal = bCalc ? bCalc.gstAmount : 0;
      } else {
        aVal = a[sortField] || "";
        bVal = b[sortField] || "";
      }
      
      if (typeof aVal === "string") {
        return sortDirection === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
    });
    return sorted;
  };

  // ✅ NEW: Export to Excel with trading product info
  const exportToExcel = async () => {
    try {
      toast.loading("Loading all products for export...");
      const allProductsData = await loadAllProductsForExport();
      
      // Also fetch purchase products for trading items
      const purchaseRes = await axiosInstance.get("/purchase-products/purchase-products-all");
      const allPurchaseProducts = purchaseRes.data || [];
      
      const exportData = allProductsData.map(product => {
        const calc = calculatePrice(product);
        let linkedProductName = '';
        let purchasePrice = 0;
        
        // Get linked purchase product info for trading products
        if (product.isNonThermocol && product.linkedPurchaseProductId) {
          const linked = allPurchaseProducts.find(p => p._id === product.linkedPurchaseProductId);
          if (linked) {
            linkedProductName = linked.name || '';
            purchasePrice = linked.price || 0;
          }
        }
        
        return {
          'Product Name': product.name || '',
          'Unit': product.unit || '',
          'Weight (g)': calc?.weightInGrams || 0,
          'Conversion (₹/kg)': calc?.conversionRate?.toFixed(2) || '0.00',
          'Total/kg (₹)': calc?.totalPerKg?.toFixed(2) || '0.00',
          'Basic Price/Packet (₹)': calc?.pricePerPiece?.toFixed(2) || '0.00',
          'GST (%)': calc?.gstPercent || 18,
          'GST Amount (₹)': calc?.gstAmount?.toFixed(2) || '0.00',
          'Total Price Ex-Factory (₹)': calc?.finalPrice?.toFixed(2) || '0.00',
          'Product Type': product.isNonThermocol ? 'Trading Product' : 'Regular Product',
          'Linked Purchase Product': linkedProductName || 'N/A',
          'Purchase Price (₹/kg)': purchasePrice > 0 ? purchasePrice.toFixed(2) : 'N/A',
          'Trading Conversion (₹/kg)': product.isNonThermocol ? (product.tradingConversion || 0).toFixed(2) : 'N/A',
        };
      });

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);
      
      // Set column widths
      const colWidths = [
        { wch: 30 }, // Product Name
        { wch: 10 }, // Unit
        { wch: 12 }, // Weight
        { wch: 18 }, // Conversion
        { wch: 15 }, // Total/kg
        { wch: 22 }, // Basic Price
        { wch: 10 }, // GST %
        { wch: 18 }, // GST Amount
        { wch: 25 }, // Total Price
        { wch: 18 }, // Product Type
        { wch: 25 }, // Linked Purchase Product
        { wch: 20 }, // Purchase Price
        { wch: 22 }, // Trading Conversion
      ];
      ws['!cols'] = colWidths;

      XLSX.utils.book_append_sheet(wb, ws, 'Products');
      
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
      saveAs(blob, `Product_Rate_Summary_${new Date().toISOString().split('T')[0]}.xlsx`);
      
      toast.dismiss();
      toast.success(`Exported ${exportData.length} products successfully!`);
    } catch (err) {
      console.error("Export error:", err);
      toast.dismiss();
      toast.error("Failed to export data");
    }
  };

  const sortedProducts = getSortedProducts();
  const totalPages = Math.ceil(totalProducts / itemsPerPage);

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 transition-all duration-200"
      >
        <div className="flex items-center gap-2">
          <span className="text-xl">📊</span>
          <span className="font-semibold">Product Rate Summary</span>
          {!isOpen && products.length > 0 && (
            <span className="ml-2 bg-white text-blue-600 text-xs font-bold px-2 py-1 rounded-full">
              {totalProducts} products
            </span>
          )}
        </div>
        {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </button>

      {isOpen && (
        <div className="p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                📊 Product Rate Summary
              </h3>
              <p className="text-sm text-gray-500">
                Showing {sortedProducts.length} of {totalProducts} products • RM Rate: ₹{rmRate.toFixed(2)}/kg
              </p>
            </div>
            
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => fetchData(currentPage)}
                className="flex items-center gap-2 bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-2 rounded-lg transition-colors duration-200"
              >
                <RefreshCw size={16} />
                Refresh
              </button>
              <button
                onClick={exportToExcel}
                className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg transition-colors duration-200"
              >
                <Download size={16} />
                Export Excel
              </button>
            </div>
          </div>

          {/* Search and Pagination Controls */}
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={18} className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={handleSearch}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Show:</label>
              <select
                value={itemsPerPage}
                onChange={handleItemsPerPageChange}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading products...</span>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort("name")}>
                        Product Name {sortField === "name" && (sortDirection === "asc" ? "↑" : "↓")}
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort("unit")}>
                        Unit {sortField === "unit" && (sortDirection === "asc" ? "↑" : "↓")}
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort("weight")}>
                        Weight {sortField === "weight" && (sortDirection === "asc" ? "↑" : "↓")}
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort("conversion")}>
                        Conversion {sortField === "conversion" && (sortDirection === "asc" ? "↑" : "↓")}
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total/kg</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort("pricePerPiece")}>
                        Basic Price/Packet {sortField === "pricePerPiece" && (sortDirection === "asc" ? "↑" : "↓")}
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort("gstAmount")}>
                        GST {sortField === "gstAmount" && (sortDirection === "asc" ? "↑" : "↓")}
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort("finalPrice")}>
                        Total Price {sortField === "finalPrice" && (sortDirection === "asc" ? "↑" : "↓")}
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sortedProducts.length === 0 ? (
                      <tr>
                        <td colSpan="9" className="px-3 py-8 text-center text-gray-500">No products found</td>
                      </tr>
                    ) : (
                      sortedProducts.map((product) => {
                        const calc = calculatePrice(product);
                        if (!calc) return null;
                        return (
                          <tr key={product._id} className="hover:bg-gray-50">
                            <td className="px-3 py-2.5 text-gray-800 min-w-[200px] max-w-[300px] break-words" title={product.name}>
                              {product.name}
                              {/* ✅ Show badge for Non-Thermocol products */}
                              {product.isNonThermocol && (
                                <span className="ml-2 inline-block text-[10px] font-bold text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded">
                                  Trading
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-2.5 text-gray-600">{product.unit || '-'}</td>
                            <td className="px-3 py-2.5 text-gray-600">{calc.weightInGrams > 0 ? `${calc.weightInGrams}g` : '-'}</td>
                            <td className="px-3 py-2.5 text-gray-600">
                              ₹{calc.conversionRate.toFixed(2)}
                              {/* ✅ Show trading conversion source */}
                              {product.isNonThermocol && calc.purchasePrice !== null && (
                                <span className="block text-[10px] text-blue-500">
                                  (Purchase: ₹{calc.purchasePrice.toFixed(2)}/kg)
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-2.5 text-green-600 font-medium">₹{calc.totalPerKg.toFixed(2)}</td>
                            <td className="px-3 py-2.5 font-semibold text-purple-600">₹{calc.pricePerPiece.toFixed(2)}</td>
                            <td className="px-3 py-2.5 text-orange-600">₹{calc.gstAmount.toFixed(2)}</td>
                            <td className="px-3 py-2.5 font-bold text-green-700">₹{calc.finalPrice.toFixed(2)}</td>
                            <td className="px-3 py-2.5">
                              <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                                product.isNonThermocol 
                                  ? 'bg-blue-100 text-blue-700' 
                                  : 'bg-green-100 text-green-700'
                              }`}>
                                {product.isNonThermocol ? '🔄 Trading' : '✅ Regular'}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {totalProducts > itemsPerPage && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 pt-4 border-t border-gray-200">
                  <div className="text-sm text-gray-600">
                    Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, totalProducts)} of {totalProducts} products
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className={`p-2 rounded-lg border ${
                        currentPage === 1 
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                          : 'bg-white hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <ChevronLeft size={18} />
                    </button>
                    
                    <span className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg font-medium">
                      Page {currentPage} of {totalPages}
                    </span>
                    
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className={`p-2 rounded-lg border ${
                        currentPage === totalPages 
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                          : 'bg-white hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}