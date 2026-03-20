import { useState, useEffect, useRef } from "react";
import { ChevronDown, ChevronUp, Calculator, Package, DollarSign } from "lucide-react";
import axiosInstance from "../axiosInstance";
import toast from "react-hot-toast";

export default function CostingSheet({ customerId }) {
  const [isOpen, setIsOpen] = useState(false);
  const [rawMaterials, setRawMaterials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [rmRate, setRmRate] = useState(0);
  const [conversionRates, setConversionRates] = useState({});
  const [calculatedPrices, setCalculatedPrices] = useState({});
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [savedCostingSheets, setSavedCostingSheets] = useState([]);
  const [isRecalculating, setIsRecalculating] = useState(false);
  
  // Use refs to track current values for comparison in async functions
  const rmRateRef = useRef(rmRate);
  const savedSheetsRef = useRef(savedCostingSheets);
  
  // Update refs when state changes
  useEffect(() => {
    rmRateRef.current = rmRate;
  }, [rmRate]);
  
  useEffect(() => {
    savedSheetsRef.current = savedCostingSheets;
  }, [savedCostingSheets]);

  // Fetch categories first to get the Thermocol Dana Raw Material category ID
  useEffect(() => {
    fetchCategories();
  }, []);

  // Fetch saved costing sheets when component mounts
  useEffect(() => {
    if (customerId) {
      fetchSavedCostingSheets();
    }
  }, [customerId]);

  // Set up periodic RM rate checking when component is open
  useEffect(() => {
    let interval;
    
    if (isOpen) {
      // Check for RM rate changes every 10 seconds (reduced from 30)
      interval = setInterval(() => {
        console.log("Checking for RM rate updates...");
        fetchRMRate(true); // Pass true to indicate it's a periodic check
      }, 10000); // 10 seconds
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isOpen]);

  const fetchSavedCostingSheets = async () => {
    try {
      const res = await axiosInstance.get(`/customers/${customerId}/costing-sheets`);
      const sheets = res.data || [];
      console.log("Fetched saved sheets:", sheets);
      setSavedCostingSheets(sheets);
      
      // If there are saved sheets, pre-fill the conversion rates and calculations
      if (sheets.length > 0) {
        const savedRates = {};
        const savedCalculations = {};
        
        // Get the latest sheet for each product
        const latestSheets = {};
        sheets.forEach(sheet => {
          if (!latestSheets[sheet.productId] || 
              new Date(sheet.updatedAt || sheet.date) > new Date(latestSheets[sheet.productId].updatedAt || latestSheets[sheet.productId].date)) {
            latestSheets[sheet.productId] = sheet;
          }
        });
        
        Object.values(latestSheets).forEach(sheet => {
          savedRates[sheet.productId] = sheet.conversionRate;
          
          const pricePerPiece = typeof sheet.pricePerPiece === 'number' 
            ? sheet.pricePerPiece.toFixed(2) 
            : sheet.pricePerPiece;
            
          savedCalculations[sheet.productId] = {
            totalPerKg: sheet.totalPerKg,
            pricePerPiece: pricePerPiece,
            productWeight: sheet.productWeight,
            rmRate: sheet.rmRate
          };
        });
        
        setConversionRates(savedRates);
        setCalculatedPrices(savedCalculations);
      }
    } catch (err) {
      console.error("Error fetching saved costing sheets:", err);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await axiosInstance.get("/categories");
      setCategories(res.data);
      
      // Find the Thermocol Dana Raw Material category
      const thermocolCategory = res.data.find(cat => 
        cat.name.toLowerCase().includes("thermocol") || 
        cat.name.toLowerCase().includes("dana") ||
        cat.name.toLowerCase().includes("raw material")
      );
      
      if (thermocolCategory) {
        setSelectedCategory(thermocolCategory._id);
      }
    } catch (err) {
      console.error("Error fetching categories:", err);
      toast.error("Failed to load categories");
    }
  };

  // Fetch raw materials (thermocol dana products from purchase products)
  useEffect(() => {
    if (isOpen && selectedCategory) {
      fetchRawMaterials();
      fetchRMRate(false);
    }
  }, [isOpen, selectedCategory]);

  const fetchRawMaterials = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/purchase-products?category=${selectedCategory}&limit=100`);
      const products = res.data.data || res.data;
      setRawMaterials(products);
    } catch (err) {
      console.error("Error fetching raw materials:", err);
      toast.error("Failed to load raw materials");
    } finally {
      setLoading(false);
    }
  };

  const fetchRMRate = async (isPeriodicCheck = false) => {
    try {
      const res = await axiosInstance.get("/rm-rate");
      const newRate = res.data.rate || 0;
      
      // Get current values from refs (not state, to avoid closure issues)
      const currentRate = rmRateRef.current;
      const currentSheets = savedSheetsRef.current;
      
      console.log("Current rmRate ref:", currentRate);
      console.log("New rate from API:", newRate);
      console.log("Has saved sheets:", currentSheets.length > 0);
      
      // If this is the first load (rmRate is 0), just set the rate
      if (currentRate === 0) {
        console.log("Initial RM rate load");
        setRmRate(newRate);
        
        // After setting initial rate, recalculate prices for unsaved products
        setTimeout(() => {
          Object.keys(conversionRates).forEach(productId => {
            if (conversionRates[productId] > 0) {
              calculateProductPrice(productId, conversionRates[productId], newRate);
            }
          });
        }, 100);
        
        return;
      }
      
      // If rate changed and we have saved sheets, auto-recalculate
      if (currentRate !== newRate) {
        console.log(`RM rate changed from ${currentRate} to ${newRate}`);
        
        // First update the RM rate state
        setRmRate(newRate);
        
        // Then auto-recalculate all saved sheets
        if (currentSheets.length > 0) {
          await autoRecalculateSheets(newRate);
        }
        
        // Also recalculate unsaved products
        setTimeout(() => {
          Object.keys(conversionRates).forEach(productId => {
            if (conversionRates[productId] > 0) {
              calculateProductPrice(productId, conversionRates[productId], newRate);
            }
          });
        }, 200);
      } else {
        if (isPeriodicCheck) {
          console.log("RM rate unchanged during periodic check");
        }
      }
      
    } catch (err) {
      console.error("Error fetching RM rate:", err);
      if (!isPeriodicCheck) {
        toast.error("Failed to load RM rate");
      }
    }
  };

  const autoRecalculateSheets = async (newRmRate) => {
    const currentSheets = savedSheetsRef.current;
    
    if (currentSheets.length === 0) {
      console.log("No saved sheets to recalculate");
      return;
    }
    
    setIsRecalculating(true);
    try {
      console.log(`Auto-recalculating ${currentSheets.length} sheets with new RM rate: ${newRmRate}`);
      
      const res = await axiosInstance.post(`/customers/${customerId}/costing-sheets/recalculate`, {
        newRmRate
      });
      
      const updatedSheets = res.data.costingSheets;
      console.log("Received updated sheets:", updatedSheets);
      
      setSavedCostingSheets(updatedSheets);
      
      // Update conversion rates and calculated prices
      const savedRates = {};
      const savedCalculations = {};
      
      // Get latest sheet for each product
      const latestSheets = {};
      updatedSheets.forEach(sheet => {
        if (!latestSheets[sheet.productId] || 
            new Date(sheet.updatedAt || sheet.date) > new Date(latestSheets[sheet.productId].updatedAt || latestSheets[sheet.productId].date)) {
          latestSheets[sheet.productId] = sheet;
        }
      });
      
      Object.values(latestSheets).forEach(sheet => {
        savedRates[sheet.productId] = sheet.conversionRate;
        savedCalculations[sheet.productId] = {
          totalPerKg: sheet.totalPerKg,
          pricePerPiece: sheet.pricePerPiece.toFixed(2),
          productWeight: sheet.productWeight,
          rmRate: sheet.rmRate
        };
      });
      
      setConversionRates(savedRates);
      setCalculatedPrices(savedCalculations);
      
      // Show a subtle toast notification
      toast.success(`${updatedSheets.length} costing sheets updated with new RM rate`, {
        duration: 3000,
        icon: '🔄'
      });
      
    } catch (err) {
      console.error("Error auto-recalculating sheets:", err);
      toast.error("Failed to auto-update costing sheets");
    } finally {
      setIsRecalculating(false);
    }
  };

  const handleConversionRateChange = (productId, value) => {
    const rate = parseFloat(value) || 0;
    setConversionRates(prev => ({
      ...prev,
      [productId]: rate
    }));
    
    calculateProductPrice(productId, rate, rmRate);
    
    // Remove from saved sheets when conversion rate changes
    setSavedCostingSheets(prev => 
      prev.filter(sheet => sheet.productId !== productId)
    );
  };

  const calculateProductPrice = (productId, conversionRate, currentRmRate) => {
    const product = rawMaterials.find(p => p._id === productId);
    if (!product) return;
    
    const productWeight = parseFloat(product.weight) || 0;
    
    if (productWeight === 0) {
      console.warn("Product weight is 0, cannot calculate price");
      return;
    }
    
    const totalPerKg = currentRmRate + conversionRate;
    const pricePerPiece = totalPerKg * productWeight;
    
    setCalculatedPrices(prev => ({
      ...prev,
      [productId]: {
        totalPerKg,
        pricePerPiece: pricePerPiece.toFixed(2),
        productWeight
      }
    }));
  };

  const saveCostingSheet = async (productId) => {
    const product = rawMaterials.find(p => p._id === productId);
    const calculation = calculatedPrices[productId];
    const conversionRate = conversionRates[productId];
    
    if (!calculation || !conversionRate || conversionRate <= 0) {
      toast.error("Please enter conversion rate first");
      return;
    }

    try {
      const res = await axiosInstance.post(`/customers/${customerId}/costing-sheets`, {
        productId,
        productName: product.name,
        productWeight: calculation.productWeight,
        rmRate,
        conversionRate,
        totalPerKg: calculation.totalPerKg,
        pricePerPiece: parseFloat(calculation.pricePerPiece),
        date: new Date()
      });
      
      const savedSheet = res.data.costingSheet;
      
      setSavedCostingSheets(prev => {
        const existingIndex = prev.findIndex(sheet => sheet.productId === productId);
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = savedSheet;
          return updated;
        } else {
          return [...prev, savedSheet];
        }
      });
      
      toast.success("Costing sheet saved successfully");
    } catch (err) {
      console.error("Error saving costing sheet:", err);
      toast.error("Failed to save costing sheet");
    }
  };

  const getLatestSheetForProduct = (productId) => {
    const productSheets = savedCostingSheets.filter(
      sheet => sheet.productId === productId
    );
    
    if (productSheets.length === 0) return null;
    
    return productSheets.sort((a, b) => 
      new Date(b.updatedAt || b.date) - new Date(a.updatedAt || a.date)
    )[0];
  };

  // If no category found
  if (!selectedCategory && categories.length > 0) {
    return (
      <div className="mt-6 border border-gray-200 rounded-lg overflow-hidden">
        <div className="p-4 bg-yellow-50 text-yellow-700">
          <p className="font-medium">⚠️ Thermocol Dana Raw Material category not found</p>
          <p className="text-sm mt-1">Please create a category named "Thermocol Dana Raw Material" first.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 border border-gray-200 rounded-lg overflow-hidden">
      {/* Collapsible Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 transition-all duration-200"
      >
        <div className="flex items-center gap-2">
          <Calculator size={20} />
          <span className="font-semibold">Costing Sheet - Thermocol Dana Raw Materials</span>
         
          {isRecalculating && (
            <span className="ml-2 bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse">
              Updating...
            </span>
          )}
        </div>
        {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </button>

      {/* Collapsible Content */}
      {isOpen && (
        <div className="p-4 bg-gray-50">
          {/* Current RM Rate Display */}
          <div className="mb-4 p-3 bg-white rounded-lg border border-blue-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-blue-700">
                <DollarSign size={18} />
                <span className="font-medium">Current RM Rate:</span>
                <span className="text-lg font-bold">₹{rmRate.toFixed(2)}/kg</span>
              </div>
              
              {isRecalculating && (
                <span className="text-sm text-yellow-600 flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600"></div>
                  Auto-updating sheets...
                </span>
              )}
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : rawMaterials.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Package size={40} className="mx-auto mb-2 opacity-50" />
              <p>No thermocol dana raw materials found in this category</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rawMaterials.map((product) => {
                const savedSheet = getLatestSheetForProduct(product._id);
                const hasSavedSheet = !!savedSheet;
                
                let calculation;
                if (hasSavedSheet && !calculatedPrices[product._id]) {
                  calculation = {
                    totalPerKg: savedSheet.totalPerKg,
                    pricePerPiece: typeof savedSheet.pricePerPiece === 'number' 
                      ? savedSheet.pricePerPiece.toFixed(2) 
                      : savedSheet.pricePerPiece,
                    productWeight: savedSheet.productWeight
                  };
                } else if (calculatedPrices[product._id]) {
                  calculation = calculatedPrices[product._id];
                } else {
                  calculation = {
                    totalPerKg: 0,
                    pricePerPiece: "0.00",
                    productWeight: parseFloat(product.weight) || 0
                  };
                }

                return (
                  <div key={product._id} className={`bg-white rounded-lg border shadow-sm hover:shadow-md transition-shadow duration-200 ${
                    hasSavedSheet ? 'border-green-300 bg-green-50' : 'border-gray-200'
                  }`}>
                    {/* Product Header */}
                    <div className={`p-3 border-b ${hasSavedSheet ? 'border-green-200' : 'border-gray-100'} bg-gradient-to-r from-gray-50 to-white`}>
                      <div className="flex justify-between items-start">
                        <h3 className="font-semibold text-gray-800 truncate" title={product.name}>
                          {product.name}
                        </h3>
                        {hasSavedSheet && (
                          <span className="text-xs bg-green-500 text-white px-2 py-1 rounded-full">
                            Saved
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">Unit: {product.unit || 'kg'}</p>
                      {product.weight && (
                        <p className="text-xs text-gray-500">Weight: {product.weight} kg</p>
                      )}
                    </div>

                    {/* Costing Calculation */}
                    <div className="p-3 space-y-2">
                      {/* RM Rate */}
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">RM Rate/kg:</span>
                        <span className="font-medium">₹{rmRate.toFixed(2)}</span>
                      </div>

                      {/* Conversion Rate Input */}
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Conversion/kg:</span>
                        <div className="relative flex-1">
                          <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400">₹</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={conversionRates[product._id] !== undefined ? conversionRates[product._id] : (savedSheet?.conversionRate || '')}
                            onChange={(e) => handleConversionRateChange(product._id, e.target.value)}
                            className={`w-full pl-6 pr-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                              hasSavedSheet ? 'border-green-400 bg-green-50' : 'border-gray-300'
                            }`}
                            placeholder="0.00"
                          />
                        </div>
                      </div>

                      {/* Total per kg */}
                      <div className="flex justify-between items-center text-sm font-medium">
                        <span className="text-gray-600">Total/kg:</span>
                        <span className="text-green-600">₹{calculation.totalPerKg.toFixed(2)}</span>
                      </div>

                      {/* Product Weight */}
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Product Weight:</span>
                        <span className="font-medium">{calculation.productWeight} kg</span>
                      </div>

                      {/* Divider */}
                      <div className="border-t border-gray-200 my-2"></div>

                      {/* Final Price per piece */}
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-semibold text-gray-700">Price/Piece:</span>
                        <span className="text-lg font-bold text-purple-600">
                          ₹{calculation.pricePerPiece}
                        </span>
                      </div>

                      {/* Save Button */}
                      <button
                        onClick={() => saveCostingSheet(product._id)}
                        disabled={!conversionRates[product._id] && !savedSheet?.conversionRate}
                        className={`w-full mt-2 text-white text-sm font-medium py-2 px-3 rounded transition-colors duration-200 ${
                          hasSavedSheet
                            ? 'bg-green-600 hover:bg-green-700'
                            : 'bg-blue-600 hover:bg-blue-700'
                        } disabled:bg-gray-400`}
                      >
                        {hasSavedSheet ? 'Update Costing Sheet' : 'Save Costing Sheet'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}