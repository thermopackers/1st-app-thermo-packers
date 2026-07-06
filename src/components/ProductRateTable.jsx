import { useState, useEffect } from "react";
import axiosInstance from "../axiosInstance";
import toast from "react-hot-toast";
import { Download, Search, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

export default function ProductRateTable() {
  const [isOpen, setIsOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [rmRate, setRmRate] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState("name");
  const [sortDirection, setSortDirection] = useState("asc");

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [productsRes, rmRateRes] = await Promise.all([
        axiosInstance.get("/products-multer?limit=10000"),
        axiosInstance.get("/rm-rate")
      ]);
      
      setProducts(productsRes.data.products || []);
      setFilteredProducts(productsRes.data.products || []);
      setRmRate(rmRateRes.data.rate || 0);
    } catch (err) {
      console.error("Error fetching data:", err);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const calculatePrice = (product) => {
    const conversionRate = product.conversion || 0;
    const totalPerKg = rmRate + conversionRate;
    
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
    
    const gstAmount = pricePerPiece * 0.18;
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
      unit: product.unit || "kg"
    };
  };

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

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

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
        aVal = parseFloat(a.conversion) || 0;
        bVal = parseFloat(b.conversion) || 0;
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

  const exportToExcel = () => {
    const sortedProducts = getSortedProducts();
    const excelData = sortedProducts.map(product => {
      const calc = calculatePrice(product);
      return {
        "Product Name": product.name || "",
        "Unit": product.unit || "",
        "Weight (kg)": product.weight || "",
        "Weight (g)": calc?.weightInGrams || 0,
        "Conversion Rate": calc?.conversionRate || 0,
        "RM Rate": rmRate,
        "Total/kg": calc?.totalPerKg?.toFixed(2) || 0,
        "Price/Piece": calc?.pricePerPiece?.toFixed(2) || 0,
        "GST (18%)": calc?.gstAmount?.toFixed(2) || 0,
        "Final Price": calc?.finalPrice?.toFixed(2) || 0,
        "HSN Code": product.hsnCode || "",
        "GST %": product.gstPercent || 0,
        "Sales Category": product.salesCategory || ""
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Product Rates");
    
    const colWidths = [
      { wch: 50 },
      { wch: 10 },
      { wch: 12 },
      { wch: 12 },
      { wch: 15 },
      { wch: 12 },
      { wch: 12 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 12 },
      { wch: 20 }
    ];
    worksheet['!cols'] = colWidths;

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    
    saveAs(data, `product_rates_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success(`Exported ${sortedProducts.length} products successfully!`);
  };

  const sortedProducts = getSortedProducts();

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      {/* Collapsible Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 transition-all duration-200"
      >
        <div className="flex items-center gap-2">
          <span className="text-xl">📊</span>
          <span className="font-semibold">Product Rate Summary</span>
          {!isOpen && products.length > 0 && (
            <span className="ml-2 bg-white text-blue-600 text-xs font-bold px-2 py-1 rounded-full">
              {products.length} products
            </span>
          )}
        </div>
        {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </button>

      {/* Collapsible Content */}
      {isOpen && (
        <div className="p-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                📊 Product Rate Summary
              </h3>
              <p className="text-sm text-gray-500">
                {sortedProducts.length} products • RM Rate: ₹{rmRate.toFixed(2)}/kg
              </p>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={fetchData}
                className="flex items-center gap-2 bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-2 rounded-lg transition-colors duration-200"
              >
                <RefreshCw size={16} />
                Refresh
              </button>
              <button
                onClick={exportToExcel}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
              >
                <Download size={18} />
                Export Excel
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-4">
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

          {/* Loading State */}
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading products...</span>
            </div>
          ) : (
            /* Table */
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th 
                      className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort("name")}
                    >
                      Product Name {sortField === "name" && (sortDirection === "asc" ? "↑" : "↓")}
                    </th>
                    <th 
                      className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort("unit")}
                    >
                      Unit {sortField === "unit" && (sortDirection === "asc" ? "↑" : "↓")}
                    </th>
                    <th 
                      className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort("weight")}
                    >
                      Weight {sortField === "weight" && (sortDirection === "asc" ? "↑" : "↓")}
                    </th>
                    <th 
                      className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort("conversion")}
                    >
                      Conversion {sortField === "conversion" && (sortDirection === "asc" ? "↑" : "↓")}
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total(RM Rate + Conversion)
                    </th>
                    <th 
                      className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort("pricePerPiece")}
                    >
                     Basic Price/Packet {sortField === "pricePerPiece" && (sortDirection === "asc" ? "↑" : "↓")}
                    </th>
                    <th 
                      className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort("gstAmount")}
                    >
                      GST 18% {sortField === "gstAmount" && (sortDirection === "asc" ? "↑" : "↓")}
                    </th>
                    <th 
                      className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort("finalPrice")}
                    >
                      total Price Ex-Factory {sortField === "finalPrice" && (sortDirection === "asc" ? "↑" : "↓")}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedProducts.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="px-3 py-8 text-center text-gray-500">
                        No products found
                      </td>
                    </tr>
                  ) : (
                    sortedProducts.map((product) => {
                      const calc = calculatePrice(product);
                      if (!calc) return null;
                      
                      return (
                        <tr key={product._id} className="hover:bg-gray-50">
                         <td className="px-3 py-2.5 text-gray-800 min-w-[200px] max-w-[300px] break-words" title={product.name}>
  {product.name}
</td>
                          <td className="px-3 py-2.5 text-gray-600">
                            {product.unit || '-'}
                          </td>
                          <td className="px-3 py-2.5 text-gray-600">
                            {calc.weightInGrams > 0 ? `${calc.weightInGrams}g` : '-'}
                          </td>
                          <td className="px-3 py-2.5 text-gray-600">
                            ₹{calc.conversionRate.toFixed(2)}
                          </td>
                          <td className="px-3 py-2.5 text-green-600 font-medium">
                            ₹{calc.totalPerKg.toFixed(2)}
                          </td>
                          <td className="px-3 py-2.5 font-semibold text-purple-600">
                            ₹{calc.pricePerPiece.toFixed(2)}
                          </td>
                          <td className="px-3 py-2.5 text-orange-600">
                            ₹{calc.gstAmount.toFixed(2)}
                          </td>
                          <td className="px-3 py-2.5 font-bold text-green-700">
                            ₹{calc.finalPrice.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan="8" className="px-3 py-3 text-sm text-gray-500">
                      Total Products: {sortedProducts.length} • RM Rate: ₹{rmRate.toFixed(2)}/kg
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}