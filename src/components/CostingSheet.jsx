import { useState, useEffect, useRef } from "react";
import { ChevronDown, ChevronUp, Calculator, Package, DollarSign, Truck } from "lucide-react";
import axiosInstance from "../axiosInstance";
import toast from "react-hot-toast";

export default function CostingSheet({ customerId, frequentProducts = [] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [rawMaterials, setRawMaterials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [rmRate, setRmRate] = useState(0);
  const [conversionRates, setConversionRates] = useState({});
  const [freightOutward, setFreightOutward] = useState({});
  const [inPcsMode, setInPcsMode] = useState({});
  const [calculatedPrices, setCalculatedPrices] = useState({});
  const [savedCostingSheets, setSavedCostingSheets] = useState([]);
  const [isRecalculating, setIsRecalculating] = useState(false);
  
  // Use refs to track current values
  const rmRateRef = useRef(rmRate);
  const savedSheetsRef = useRef(savedCostingSheets);
  
  // Update refs when state changes
  useEffect(() => {
    rmRateRef.current = rmRate;
  }, [rmRate]);
  
  useEffect(() => {
    savedSheetsRef.current = savedCostingSheets;
  }, [savedCostingSheets]);

  // Fetch saved costing sheets when component mounts
  useEffect(() => {
    if (customerId) {
      fetchSavedCostingSheets();
    }
  }, [customerId]);

  // Fetch RM rate when opened
  useEffect(() => {
    if (isOpen) {
      fetchRMRate();
    }
  }, [isOpen]);

  // Fetch products based on frequentProducts when component opens
  useEffect(() => {
    if (isOpen && frequentProducts.length > 0) {
      fetchProductsFromFrequentList();
    }
  }, [isOpen, frequentProducts]);

const fetchProductsFromFrequentList = async () => {
  if (frequentProducts.length === 0) {
    setRawMaterials([]);
    return;
  }
  
  setLoading(true);
  try {
    console.log("Frequent products data:", frequentProducts);
    
    const validProducts = frequentProducts.filter(p => p.productId && p.productId !== null);
    console.log("Valid products with IDs:", validProducts);
    
    if (validProducts.length === 0) {
      console.warn("No valid product IDs found in frequent products");
      toast.warning("Products don't have valid IDs. Please check product data.");
      setRawMaterials([]);
      setLoading(false);
      return;
    }
    
    const productIds = validProducts.map(p => p.productId);
    console.log("Product IDs to fetch:", productIds);
    
    let products = [];
    
    try {
      console.log("Trying batch endpoint...");
      const batchRes = await axiosInstance.post("/products/products-multer/batch", { productIds });
      products = batchRes.data;
      console.log("Batch fetch successful, got", products.length, "products");
    } catch (batchError) {
      console.warn("Batch endpoint failed, falling back to individual fetches:", batchError.message);
      const productPromises = productIds.map(async (id) => {
        try {
          const res = await axiosInstance.get(`/products/products-multer/${id}`);
          return res.data;
        } catch (err) {
          console.error(`Failed to fetch product ${id}:`, err.message);
          return null;
        }
      });
      const responses = await Promise.all(productPromises);
      products = responses.filter(p => p !== null);
    }
    
    console.log("Loaded products:", products);
    
    if (products.length === 0) {
      toast.error("No products found. Please check product IDs.");
      setRawMaterials([]);
      setLoading(false);
      return;
    }
    
    setRawMaterials(products);
    
    // Initialize states from saved sheets
    const initialRates = {};
    const initialFreight = {};
    const initialInPcs = {};
    const initialCalculations = {};
    
    products.forEach(product => {
      // Check if there's a saved sheet for this product
      const savedSheet = getLatestSheetForProduct(product._id);
      
      if (savedSheet) {
        console.log(`Loading saved sheet for ${product.name}:`, savedSheet);
        // Load saved values
        initialRates[product._id] = savedSheet.conversionRate || 0;
        initialFreight[product._id] = savedSheet.freight || 0;
        initialInPcs[product._id] = savedSheet.isInPcs || false;
        
        initialCalculations[product._id] = {
          totalPerKg: savedSheet.totalPerKg,
          pricePerPiece: savedSheet.pricePerPiece,
          productWeight: savedSheet.productWeight,
          freight: savedSheet.freight || 0,
          totalWithFreight: savedSheet.totalWithFreight || savedSheet.pricePerPiece,
          totalWithGST: savedSheet.totalWithGST || (savedSheet.pricePerPiece * 1.18),
          isInPcs: savedSheet.isInPcs || false,
          weightDisplay: product.weight
        };
      } else {
        // Default values
        initialRates[product._id] = 0;
        initialFreight[product._id] = 0;
        initialInPcs[product._id] = false;
      }
    });
    
    setConversionRates(initialRates);
    setFreightOutward(initialFreight);
    setInPcsMode(initialInPcs);
    setCalculatedPrices(initialCalculations);
    
    // If there are no saved calculations, recalculate for products with rates
    if (Object.keys(initialCalculations).length === 0) {
      products.forEach(product => {
        if (initialRates[product._id] > 0) {
          calculateProductPrice(
            product._id, 
            initialRates[product._id], 
            rmRate, 
            initialInPcs[product._id], 
            initialFreight[product._id]
          );
        }
      });
    }
    
  } catch (err) {
    console.error("Error fetching products:", err);
    console.error("Error details:", err.response?.data);
    toast.error("Failed to load products: " + (err.response?.data?.error || err.message));
    setRawMaterials([]);
  } finally {
    setLoading(false);
  }
};

  const fetchSavedCostingSheets = async () => {
    try {
      const res = await axiosInstance.get(`/customers/${customerId}/costing-sheets`);
      const sheets = res.data || [];
      setSavedCostingSheets(sheets);
      
      if (sheets.length > 0) {
        const savedRates = {};
        const savedFreight = {};
        const savedModes = {};
        const savedCalculations = {};
        
        const latestSheets = {};
        sheets.forEach(sheet => {
          if (!latestSheets[sheet.productId] || 
              new Date(sheet.updatedAt || sheet.date) > new Date(latestSheets[sheet.productId].updatedAt || latestSheets[sheet.productId].date)) {
            latestSheets[sheet.productId] = sheet;
          }
        });
        
        Object.values(latestSheets).forEach(sheet => {
          savedRates[sheet.productId] = sheet.conversionRate;
          savedFreight[sheet.productId] = sheet.freight || 0;
          savedModes[sheet.productId] = sheet.isInPcs || false;
          
          savedCalculations[sheet.productId] = {
            totalPerKg: sheet.totalPerKg,
            pricePerPiece: sheet.pricePerPiece,
            productWeight: sheet.productWeight,
            rmRate: sheet.rmRate,
            freight: sheet.freight || 0,
            totalWithFreight: sheet.totalWithFreight || sheet.pricePerPiece,
            totalWithGST: sheet.totalWithGST || (sheet.pricePerPiece * 1.18),
            isInPcs: sheet.isInPcs || false
          };
        });
        
        setConversionRates(savedRates);
        setFreightOutward(savedFreight);
        setInPcsMode(savedModes);
        setCalculatedPrices(savedCalculations);
      }
    } catch (err) {
      console.error("Error fetching saved costing sheets:", err);
    }
  };

  const fetchRMRate = async () => {
    try {
      const res = await axiosInstance.get("/rm-rate");
      const newRate = res.data.rate || 0;
      const currentRate = rmRateRef.current;
      const currentSheets = savedSheetsRef.current;
      
      if (currentRate === 0) {
        setRmRate(newRate);
        return;
      }
      
      if (currentRate !== newRate) {
        setRmRate(newRate);
        if (currentSheets.length > 0) {
          await autoRecalculateSheets(newRate);
        }
      }
    } catch (err) {
      console.error("Error fetching RM rate:", err);
      toast.error("Failed to load RM rate");
    }
  };

  const autoRecalculateSheets = async (newRmRate) => {
    const currentSheets = savedSheetsRef.current;
    if (currentSheets.length === 0) return;
    
    setIsRecalculating(true);
    try {
      const res = await axiosInstance.post(`/customers/${customerId}/costing-sheets/recalculate`, {
        newRmRate
      });
      
      const updatedSheets = res.data.costingSheets;
      setSavedCostingSheets(updatedSheets);
      
      const savedRates = {};
      const savedFreight = {};
      const savedModes = {};
      const savedCalculations = {};
      const latestSheets = {};
      updatedSheets.forEach(sheet => {
        if (!latestSheets[sheet.productId] || 
            new Date(sheet.updatedAt || sheet.date) > new Date(latestSheets[sheet.productId].updatedAt || latestSheets[sheet.productId].date)) {
          latestSheets[sheet.productId] = sheet;
        }
      });
      
      Object.values(latestSheets).forEach(sheet => {
        savedRates[sheet.productId] = sheet.conversionRate;
        savedFreight[sheet.productId] = sheet.freight || 0;
        savedModes[sheet.productId] = sheet.isInPcs || false;
        savedCalculations[sheet.productId] = {
          totalPerKg: sheet.totalPerKg,
          pricePerPiece: sheet.pricePerPiece,
          productWeight: sheet.productWeight,
          rmRate: sheet.rmRate,
          freight: sheet.freight || 0,
          totalWithFreight: sheet.totalWithFreight || sheet.pricePerPiece,
          totalWithGST: sheet.totalWithGST || (sheet.pricePerPiece * 1.18),
          isInPcs: sheet.isInPcs || false
        };
      });
      
      setConversionRates(savedRates);
      setFreightOutward(savedFreight);
      setInPcsMode(savedModes);
      setCalculatedPrices(savedCalculations);
      
      toast.success(`${updatedSheets.length} costing sheets updated with new RM rate`);
    } catch (err) {
      console.error("Error auto-recalculating sheets:", err);
      toast.error("Failed to auto-update costing sheets");
    } finally {
      setIsRecalculating(false);
    }
  };

  const handleConversionRateChange = (productId, value) => {
    const rate = parseFloat(value) || 0;
    setConversionRates(prev => ({ ...prev, [productId]: rate }));
    calculateProductPrice(productId, rate, rmRate, inPcsMode[productId], freightOutward[productId]);
    // Mark as unsaved
    setSavedCostingSheets(prev => prev.filter(sheet => sheet.productId !== productId));
  };

  const handleFreightChange = (productId, value) => {
    const freight = parseFloat(value) || 0;
    setFreightOutward(prev => ({ ...prev, [productId]: freight }));
    calculateProductPrice(productId, conversionRates[productId], rmRate, inPcsMode[productId], freight);
    // Mark as unsaved
    setSavedCostingSheets(prev => prev.filter(sheet => sheet.productId !== productId));
  };

  const handleInPcsToggle = (productId, checked) => {
    setInPcsMode(prev => ({ ...prev, [productId]: checked }));
    calculateProductPrice(productId, conversionRates[productId], rmRate, checked, freightOutward[productId]);
    // Mark as unsaved
    setSavedCostingSheets(prev => prev.filter(sheet => sheet.productId !== productId));
  };

  const calculateProductPrice = (productId, conversionRate, currentRmRate, isInPcs, freight) => {
    const product = rawMaterials.find(p => p._id === productId);
    if (!product) return;
    
    let basePrice = 0;
    let productWeight = 0;
    let totalPerKg = currentRmRate + conversionRate;
    
    if (isInPcs) {
      // Case 2: With product weight (in kg or grams)
      const weightStr = product.weight || "";
      if (weightStr.toLowerCase().includes("kg")) {
        const match = weightStr.match(/(\d+(?:\.\d+)?)/);
        if (match) productWeight = parseFloat(match[1]);
      } else if (weightStr.toLowerCase().includes("g")) {
        const match = weightStr.match(/(\d+(?:\.\d+)?)/);
        if (match) productWeight = parseFloat(match[1]) / 1000;
      } else {
        productWeight = parseFloat(weightStr) || 0;
      }
      
      basePrice = totalPerKg * productWeight;
    } else {
      // Case 1: Without product weight (per kg basis)
      basePrice = totalPerKg;
    }
    
    const totalWithFreight = basePrice + freight;
    const totalWithGST = totalWithFreight * 1.18; // 18% GST
    
    setCalculatedPrices(prev => ({
      ...prev,
      [productId]: {
        totalPerKg,
        pricePerPiece: basePrice.toFixed(2),
        productWeight: isInPcs ? productWeight : 0,
        weightDisplay: product.weight,
        freight: freight,
        totalWithFreight: totalWithFreight.toFixed(2),
        totalWithGST: totalWithGST.toFixed(2),
        isInPcs
      }
    }));
  };

 const saveCostingSheet = async (productId) => {
  const product = rawMaterials.find(p => p._id === productId);
  const calculation = calculatedPrices[productId];
  const conversionRate = conversionRates[productId];
  const freight = freightOutward[productId];
  const isInPcs = inPcsMode[productId];
  
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
      freight: freight,
      totalWithFreight: parseFloat(calculation.totalWithFreight),
      totalWithGST: parseFloat(calculation.totalWithGST),
      isInPcs,
      date: new Date()
    });
    
    const savedSheet = res.data.costingSheet;
    
    // Update saved sheets state with the new/updated sheet
    setSavedCostingSheets(prev => {
      const existingIndex = prev.findIndex(sheet => sheet.productId === productId);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = savedSheet;
        return updated;
      }
      return [...prev, savedSheet];
    });
    
    // CRITICAL: Update the local states with the saved values to persist them
    setConversionRates(prev => ({
      ...prev,
      [productId]: savedSheet.conversionRate
    }));
    
    setFreightOutward(prev => ({
      ...prev,
      [productId]: savedSheet.freight || 0
    }));
    
    setInPcsMode(prev => ({
      ...prev,
      [productId]: savedSheet.isInPcs || false
    }));
    
    // Update calculated prices with saved data
    setCalculatedPrices(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        totalPerKg: savedSheet.totalPerKg,
        pricePerPiece: savedSheet.pricePerPiece,
        productWeight: savedSheet.productWeight,
        freight: savedSheet.freight || 0,
        totalWithFreight: savedSheet.totalWithFreight || savedSheet.pricePerPiece,
        totalWithGST: savedSheet.totalWithGST || (savedSheet.pricePerPiece * 1.18),
        isInPcs: savedSheet.isInPcs || false
      }
    }));
    
    toast.success("Costing sheet saved successfully");
    
    // Force a re-render to show saved state
    setIsOpen(false);
    setTimeout(() => setIsOpen(true), 100);
    
  } catch (err) {
    console.error("Error saving costing sheet:", err);
    toast.error("Failed to save costing sheet");
  }
};

  const getLatestSheetForProduct = (productId) => {
    const productSheets = savedCostingSheets.filter(sheet => sheet.productId === productId);
    if (productSheets.length === 0) return null;
    return productSheets.sort((a, b) => new Date(b.updatedAt || b.date) - new Date(a.updatedAt || a.date))[0];
  };

  if (frequentProducts.length === 0) {
    return (
      <div className="mt-6 border border-gray-200 rounded-lg overflow-hidden">
        <div className="p-4 bg-yellow-50 text-yellow-700">
          <p className="font-medium">⚠️ No frequent products found</p>
          <p className="text-sm mt-1">Add products to the "Frequently Bought Products" section first.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 transition-all duration-200"
      >
        <div className="flex items-center gap-2">
          <Calculator size={20} />
          <span className="font-semibold">Costing Sheet - Frequently Bought Products</span>
          {/* {savedCostingSheets.length > 0 && (
            <span className="ml-2 bg-white text-blue-600 text-xs font-bold px-2 py-1 rounded-full">
              {savedCostingSheets.length} saved
            </span>
          )} */}
          {isRecalculating && (
            <span className="ml-2 bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse">Updating...</span>
          )}
        </div>
        {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </button>

      {isOpen && (
        <div className="p-4 bg-gray-50">
          <div className="mb-4 p-3 bg-white rounded-lg border border-blue-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-blue-700">
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
              <p>No products found in frequent products list</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rawMaterials.map((product) => {
                const savedSheet = getLatestSheetForProduct(product._id);
                const hasSavedSheet = !!savedSheet;
                const isInPcs = inPcsMode[product._id];
                const savedConversionRate = savedSheet?.conversionRate || 0;
                const savedFreight = savedSheet?.freight || 0;
                
                const calculation = calculatedPrices[product._id] || {
                  totalPerKg: 0,
                  pricePerPiece: "0.00",
                  productWeight: 0,
                  freight: 0,
                  totalWithFreight: "0.00",
                  totalWithGST: "0.00",
                  isInPcs: false
                };

                return (
                  <div key={product._id} className={`bg-white rounded-lg border shadow-sm hover:shadow-md transition-shadow duration-200 ${hasSavedSheet ? 'border-green-300 bg-green-50' : 'border-gray-200'}`}>
                    <div className={`p-3 border-b ${hasSavedSheet ? 'border-green-200' : 'border-gray-100'} bg-gradient-to-r from-gray-50 to-white`}>
                      <div className="flex justify-between items-start">
                        <h3 className="font-semibold text-gray-800 truncate">{product.name}</h3>
                        {hasSavedSheet && <span className="text-xs bg-green-500 text-white px-2 py-1 rounded-full">Saved</span>}
                      </div>
                      <p className="text-xs text-gray-500">Unit: {product.unit || 'kg'}</p>
                      
                      {/* Checkbox for "in pcs" mode */}
                      <label className="flex items-center gap-2 mt-2 text-xs cursor-pointer">
                     <input
  type="checkbox"
  checked={inPcsMode[product._id] !== undefined ? inPcsMode[product._id] : (savedSheet?.isInPcs || false)}
  onChange={(e) => handleInPcsToggle(product._id, e.target.checked)}
  className="w-3 h-3"
/>
                        <span className="text-gray-600">Calculate per piece (with product weight)</span>
                      </label>
                    </div>

                    <div className="p-3 space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">RM Rate/kg:</span>
                        <span className="font-medium">₹{rmRate.toFixed(2)}</span>
                      </div>

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
  className="w-full pl-6 pr-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
  placeholder="0.00"
/>
                        </div>
                      </div>

                      <div className="flex justify-between items-center text-sm font-medium">
                        <span className="text-gray-600">Total/kg:</span>
                        <span className="text-green-600">₹{calculation.totalPerKg.toFixed(2)}</span>
                      </div>

                      {isInPcs && (
                        <>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-600">Product Weight:</span>
                            <span className="font-medium">{calculation.productWeight} kg</span>
                          </div>
                          <div className="border-t border-gray-200 my-2"></div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-semibold text-gray-700">Price/Piece:</span>
                            <span className="text-lg font-bold text-purple-600">₹{calculation.pricePerPiece}</span>
                          </div>
                        </>
                      )}

                      {!isInPcs && (
                        <>
                          <div className="border-t border-gray-200 my-2"></div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-semibold text-gray-700">Price/kg:</span>
                            <span className="text-lg font-bold text-purple-600">₹{calculation.pricePerPiece}</span>
                          </div>
                        </>
                      )}

                      {/* Freight Outward Field */}
                      <div className="flex items-center gap-2 mt-2">
                        <Truck size={16} className="text-gray-500" />
                        <span className="text-sm text-gray-600">Freight Outward:</span>
                        <div className="relative flex-1">
                          <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400">₹</span>
                         <input
  type="number"
  step="0.01"
  min="0"
  value={freightOutward[product._id] !== undefined ? freightOutward[product._id] : (savedSheet?.freight || '')}
  onChange={(e) => handleFreightChange(product._id, e.target.value)}
  className="w-full pl-6 pr-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
  placeholder="0.00"
/>
                        </div>
                        <span className="text-xs text-gray-500">{isInPcs ? '/pc' : '/kg'}</span>
                      </div>

                      <div className="flex justify-between items-center text-sm font-medium text-blue-600">
                        <span className="text-gray-600">Total with Freight:</span>
                        <span className="font-bold">₹{calculation.totalWithFreight}</span>
                      </div>

                      <div className="bg-gray-100 rounded p-2 mt-2">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">GST (18%):</span>
                          <span className="font-medium text-orange-600">
                            ₹{(parseFloat(calculation.totalWithFreight) * 0.18).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-base font-bold mt-1">
                          <span className="text-gray-700">Final Price (incl. GST):</span>
                          <span className="text-green-700">₹{calculation.totalWithGST}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => saveCostingSheet(product._id)}
                        disabled={!conversionRates[product._id] && !savedConversionRate}
                        className={`w-full mt-2 text-white text-sm font-medium py-2 px-3 rounded transition-colors duration-200 ${
                          hasSavedSheet ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'
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