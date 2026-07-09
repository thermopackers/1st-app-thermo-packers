import { useState, useEffect } from "react";
import axiosInstance from "../axiosInstance";
import toast from "react-hot-toast";
import { Search, Package, TrendingUp } from "lucide-react";

export default function ProductRateChecker() {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [rmRate, setRmRate] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    fetchProducts();
    fetchRMRate();
  }, []);

 const fetchProducts = async () => {
  setLoading(true);
  try {
    // ✅ Use dashboard-fast endpoint - returns only id and name
    const res = await axiosInstance.get("/products-multer/dashboard-fast?limit=1000");
    setProducts(res.data.products || []);
    setFilteredProducts(res.data.products || []);
  } catch (err) {
    console.error("Error fetching products:", err);
    toast.error("Failed to load products");
  } finally {
    setLoading(false);
  }
};

  const fetchRMRate = async () => {
    try {
      const res = await axiosInstance.get("/rm-rate");
      setRmRate(res.data.rate || 0);
    } catch (err) {
      console.error("Error fetching RM rate:", err);
    }
  };

  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    
    if (term.trim() === "") {
      setFilteredProducts(products);
      setShowResults(false);
      setSelectedProduct(null);
      return;
    }
    
    const filtered = products.filter(product => 
      product.name.toLowerCase().includes(term)
    );
    setFilteredProducts(filtered);
    setShowResults(true);
  };

  const handleProductSelect = (product) => {
    setSelectedProduct(product);
    setSearchTerm(product.name);
    setShowResults(false);
  };

  const calculatePrice = (product) => {
    if (!product) return null;
    
    // Get conversion rate from product (default to 0 if not set)
    const conversionRate = product.conversion || 0;
    
    // Get weight - weight is stored in kg in the database
    // e.g., "1" = 1kg = 1000g, "0.5" = 0.5kg = 500g
    let weightInKg = 0;
    let weightInGrams = 0;
    
    if (product.weight) {
      const num = parseFloat(product.weight);
      if (!isNaN(num)) {
        // Weight is stored in kg (e.g., "1" = 1kg, "0.5" = 0.5kg)
        weightInKg = num;
        weightInGrams = num * 1000; // Convert kg to grams
      }
    }
    
    // Calculate total per kg
    const totalPerKg = rmRate + conversionRate;
    
    // Calculate price per piece
    let pricePerPiece = 0;
    let isWeightBased = false;
    
    // Check if unit is kg or kgs
    const unit = product.unit?.toLowerCase() || "";
    const isKgUnit = unit === "kg" || unit === "kgs";
    
    if (isKgUnit) {
      // For kg products, price is per kg
      pricePerPiece = totalPerKg;
      isWeightBased = false;
    } else {
      // For non-kg products, calculate based on weight
      if (weightInKg > 0) {
        pricePerPiece = totalPerKg * weightInKg;
        isWeightBased = true;
      } else {
        pricePerPiece = totalPerKg;
        isWeightBased = false;
      }
    }
    
    // Add GST 18%
    const gstAmount = pricePerPiece * 0.18;
    const finalPrice = pricePerPiece + gstAmount;
    
    return {
      conversionRate,
      weightInGrams: Math.round(weightInGrams),
      weightInKg: weightInKg,
      totalPerKg,
      pricePerPiece: pricePerPiece.toFixed(2),
      isWeightBased,
      gstAmount: gstAmount.toFixed(2),
      finalPrice: finalPrice.toFixed(2),
      unit: product.unit || "kg"
    };
  };

  const result = selectedProduct ? calculatePrice(selectedProduct) : null;

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 relative">
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
        <span className="text-2xl">₹</span>
        Product Rate Checker
      </h3>
      
      <p className="text-sm text-gray-600 mb-4">
        Search any sales product to see its current rate with GST
      </p>
      
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search size={18} className="text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search product by name..."
          value={searchTerm}
          onChange={handleSearch}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
        />
      </div>
      
      {/* Search Results Dropdown */}
      {showResults && filteredProducts.length > 0 && (
        <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto left-0">
          {filteredProducts.map((product) => (
            <button
              key={product._id}
              onClick={() => handleProductSelect(product)}
              className="w-full text-left px-4 py-2 hover:bg-blue-50 transition-colors duration-150 flex items-center gap-2 border-b border-gray-100 last:border-0"
            >
              <Package size={16} className="text-blue-500 flex-shrink-0" />
              <span className="text-sm font-medium text-gray-800">{product.name}</span>
              <span className="text-xs text-gray-500 ml-auto">{product.unit || 'kg'}</span>
            </button>
          ))}
        </div>
      )}
      
      {showResults && filteredProducts.length === 0 && searchTerm.trim() !== "" && (
        <div className="mt-2 text-sm text-gray-500 text-center py-2">
          No products found matching "{searchTerm}"
        </div>
      )}
      
      {/* Results Display */}
      {selectedProduct && result && (
        <div className="mt-6 border-t border-gray-200 pt-4">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-800 text-sm mb-2">
              {selectedProduct.name}
            </h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-500 text-sm">Unit:</span>
                <span className="ml-2 font-medium text-sm">{selectedProduct.unit || 'kg'}</span>
              </div>
              <div>
                <span className="text-gray-500 text-sm">RM Rate:</span>
                <span className="ml-2 font-medium text-sm">₹{rmRate.toFixed(2)}/kg</span>
              </div>
              <div>
                <span className="text-gray-500 text-sm">Conversion Rate:</span>
                <span className="ml-2 font-medium text-sm">₹{result.conversionRate.toFixed(2)}/kg</span>
              </div>
              <div>
                <span className="text-gray-500 text-sm">Total/kg:</span>
                <span className="ml-2 font-medium text-green-600 text-sm">₹{result.totalPerKg.toFixed(2)}</span>
              </div>
              {result.isWeightBased && (
                <>
                  <div>
                    <span className="text-gray-500 text-sm">Weight:</span>
                    <span className="ml-2 font-medium text-sm">{result.weightInGrams > 0 ? `${result.weightInGrams} g` : 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 text-sm">Weight in kg:</span>
                    <span className="ml-2 font-medium text-sm">{result.weightInKg.toFixed(3)} kg</span>
                  </div>
                </>
              )}
            </div>
            
            <div className="mt-4 pt-3 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-medium text-sm">Price per {result.isWeightBased ? 'Piece' : 'kg'}:</span>
                <span className="text-sm font-bold text-purple-600">₹{result.pricePerPiece}</span>
              </div>
              <div className="flex justify-between items-center mt-1 text-sm">
                <span className="text-gray-500 text-sm">GST (18%):</span>
                <span className="text-orange-600 font-medium text-sm">₹{result.gstAmount}</span>
              </div>
              <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-200">
                <span className="text-gray-700 font-semibold text-sm">Final Price (incl. GST):</span>
                <span className="text-sm font-bold text-green-600">₹{result.finalPrice}</span>
              </div>
            </div>
            
            <div className="mt-3 text-xs text-gray-400 flex items-center gap-1">
              <TrendingUp size={12} />
              <span>Based on current RM rate: ₹{rmRate.toFixed(2)}/kg</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}