import { useState, useEffect, useRef } from "react";
import { ChevronDown, ChevronUp, Calculator, Package, DollarSign, Truck, Edit2 } from "lucide-react";
import axiosInstance from "../axiosInstance";
import toast from "react-hot-toast";
// At the top of your file
import pdfMake from 'pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';

// Configure pdfmake
pdfMake.vfs = pdfFonts.vfs;
export default function CostingSheet({ customerId, frequentProducts = [] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [rawMaterials, setRawMaterials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [rmRate, setRmRate] = useState(0);
  const [internalNotes, setInternalNotes] = useState({});  // 🆕 Store internal notes per product
const [remarks, setRemarks] = useState({});              // 🆕 Store remarks per product
  const [conversionRates, setConversionRates] = useState({});
  const [freightOutward, setFreightOutward] = useState({});
  const [inPcsMode, setInPcsMode] = useState({});
  const [customWeights, setCustomWeights] = useState({}); // 🆕 Store custom weight per product
  const [calculatedPrices, setCalculatedPrices] = useState({});
  const [savedCostingSheets, setSavedCostingSheets] = useState([]);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [editingWeightId, setEditingWeightId] = useState(null); // 🆕 Track which product is being edited
  
  // Use refs to track current values
  const rmRateRef = useRef(rmRate);
  const savedSheetsRef = useRef(savedCostingSheets);
  
  // Update refs when state changes
  useEffect(() => {
    rmRateRef.current = rmRate;
  }, [rmRate]);

useEffect(() => {
  // When RM rate changes and we have products, recalculate all prices
  if (rmRate > 0 && rawMaterials.length > 0) {
    console.log("RM rate changed to:", rmRate, "Recalculating all product prices...");
    
    rawMaterials.forEach(product => {
      const productId = product._id;
      const conversionRate = conversionRates[productId] || 0;
      const freight = freightOutward[productId] || 0;
      // ✅ Get the correct isInPcs value based on unit
      const isKg = isUnitKg(product.unit || "");
      const isInPcs = !isKg;
      const customWeight = customWeights[productId];
      
      if (conversionRate > 0) {
        calculateProductPrice(productId, conversionRate, rmRate, isInPcs, freight, customWeight);
      }
    });
  }
}, [rmRate, rawMaterials]);
  
  useEffect(() => {
    savedSheetsRef.current = savedCostingSheets;
  }, [savedCostingSheets]);

// Track if initial load has been done
const initialLoadDone = useRef(false);

useEffect(() => {
  // Only restore calculations on initial load, not on every update
  if (!initialLoadDone.current && savedCostingSheets.length > 0 && rawMaterials.length > 0) {
    console.log("Initial restore of calculations from saved sheets...");
    
    const restoredRates = {};
    const restoredFreight = {};
    const restoredModes = {};
    const restoredWeights = {};
    const restoredCalculations = {};
    
    // Get the latest sheet for each product
    const latestSheets = {};
    savedCostingSheets.forEach(sheet => {
      if (!latestSheets[sheet.productId] || 
          new Date(sheet.updatedAt || sheet.date) > new Date(latestSheets[sheet.productId].updatedAt || latestSheets[sheet.productId].date)) {
        latestSheets[sheet.productId] = sheet;
      }
    });
    
    Object.values(latestSheets).forEach(sheet => {
      restoredRates[sheet.productId] = sheet.conversionRate;
      restoredFreight[sheet.productId] = sheet.freight || 0;
      restoredModes[sheet.productId] = sheet.isInPcs || false;
      if (sheet.customWeight !== undefined && sheet.customWeight !== null) {
        restoredWeights[sheet.productId] = sheet.customWeight;
      }
      restoredCalculations[sheet.productId] = {
        totalPerKg: sheet.totalPerKg,
        pricePerPiece: sheet.pricePerPiece,
        productWeight: sheet.productWeight,
        freight: sheet.freight || 0,
        totalWithFreight: sheet.totalWithFreight || sheet.pricePerPiece,
        totalWithGST: sheet.totalWithGST || (sheet.pricePerPiece * 1.18),
        isInPcs: sheet.isInPcs || false,
        weightDisplay: rawMaterials.find(p => p._id === sheet.productId)?.weight || ""
      };
    });
    
    setConversionRates(restoredRates);
    setFreightOutward(restoredFreight);
    setInPcsMode(restoredModes);
    setCustomWeights(restoredWeights);
    setCalculatedPrices(restoredCalculations);
    
    initialLoadDone.current = true;
  }
}, [savedCostingSheets, rawMaterials]);

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

// Helper function to determine if product unit is kg or kgs
const isUnitKg = (unit) => {
  const normalizedUnit = unit?.toLowerCase().trim();
  return normalizedUnit === "kg" || normalizedUnit === "kgs";
};

  // Initialize per piece mode based on unit
  const initializeInPcsMode = (product) => {
    const unit = product.unit || "";
    return !isUnitKg(unit);
  };

const getEffectiveWeight = (productId) => {
  const product = rawMaterials.find(p => p._id === productId);
  if (!product) return 0;
  
  console.log(`getEffectiveWeight for ${product.name}:`, {
    customWeight: customWeights[productId],
    savedCustomWeight: getLatestSheetForProduct(productId)?.customWeight,
    productWeight: product.weight
  });
  
  // First check customWeights state (this is the live state)
  if (customWeights[productId] !== undefined && customWeights[productId] !== null && customWeights[productId] !== 0) {
    return customWeights[productId];
  }
  
  // Then check if there's a saved sheet with custom weight
  const savedSheet = getLatestSheetForProduct(productId);
  if (savedSheet && savedSheet.customWeight !== undefined && savedSheet.customWeight !== null && savedSheet.customWeight !== 0) {
    return savedSheet.customWeight;
  }
  
  // Otherwise use product's original weight
  const weightStr = product.weight || "";
  if (weightStr.toLowerCase().includes("kg")) {
    const match = weightStr.match(/(\d+(?:\.\d+)?)/);
    if (match) return parseFloat(match[1]);
  } else if (weightStr.toLowerCase().includes("g")) {
    const match = weightStr.match(/(\d+(?:\.\d+)?)/);
    if (match) return parseFloat(match[1]) / 1000;
  }
  return parseFloat(weightStr) || 0;
};
  
// Update the formatWeightDisplay function to always show in grams
const formatWeightDisplay = (weightInKg) => {
  const grams = weightInKg * 1000;
  return `${grams.toFixed(0)} g`;
};

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
        const batchRes = await axiosInstance.post("/products-multer/batch", { productIds });
        products = batchRes.data;
        console.log("Batch fetch successful, got", products.length, "products");
      } catch (batchError) {
        console.warn("Batch endpoint failed, falling back to individual fetches:", batchError.message);
        const productPromises = productIds.map(async (id) => {
          try {
            const res = await axiosInstance.get(`/products-multer/${id}`);
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
      
      // Initialize states from saved sheets or based on unit
      const initialRates = {};
      const initialFreight = {};
      const initialInPcs = {};
      const initialWeights = {};
      const initialCalculations = {};
      const initialInternalNotes = {};
const initialRemarks = {};

      products.forEach(product => {
        // Check if there's a saved sheet for this product
        const savedSheet = getLatestSheetForProduct(product._id);
  const isKg = isUnitKg(product.unit || "");
  // For non-kg units, force per-piece mode regardless of saved data
  const defaultInPcs = !isKg;

        if (savedSheet) {
          console.log(`Loading saved sheet for ${product.name}:`, savedSheet);
  // Load saved values
  initialRates[product._id] = savedSheet.conversionRate || 0;
  initialFreight[product._id] = savedSheet.freight || 0;
    initialInPcs[product._id] = !isKg ? true : (savedSheet.isInPcs || false);
    initialInternalNotes[product._id] = savedSheet.internalNotes || "";
  initialRemarks[product._id] = savedSheet.remarks || "";
  // ✅ Load custom weight if saved
  if (savedSheet.customWeight !== undefined && savedSheet.customWeight !== null) {
    initialWeights[product._id] = savedSheet.customWeight;
  }
          
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
          // Default values - set inPcs based on unit
          const defaultInPcs = initializeInPcsMode(product);
          initialRates[product._id] = 0;
          initialFreight[product._id] = 0;
          initialInPcs[product._id] = defaultInPcs;
        }
      });
      
   setConversionRates(prev => Object.keys(prev).length ? prev : initialRates);
setFreightOutward(prev => Object.keys(prev).length ? prev : initialFreight);
setInPcsMode(prev => Object.keys(prev).length ? prev : initialInPcs);
setCustomWeights(prev => Object.keys(prev).length ? prev : initialWeights);
setCalculatedPrices(prev => Object.keys(prev).length ? prev : initialCalculations);
      setInternalNotes(initialInternalNotes);
setRemarks(initialRemarks);
      // If there are no saved calculations, recalculate for products with rates
      if (Object.keys(initialCalculations).length === 0) {
        products.forEach(product => {
          if (initialRates[product._id] > 0) {
            calculateProductPrice(
              product._id, 
              initialRates[product._id], 
              rmRate, 
              initialInPcs[product._id], 
              initialFreight[product._id],
              initialWeights[product._id]
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
    
    // Only auto-fill if this is the first load AND we don't have existing user inputs
    // The useEffect above will handle initial restore
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
      console.log(`RM rate changed from ${currentRate} to ${newRate}`);
      setRmRate(newRate);
      
      // ✅ Recalculate all product prices with the new RM rate
      if (rawMaterials.length > 0) {
        console.log("Recalculating all product prices with new RM rate...");
        
        // Recalculate each product's price with the correct isInPcs value
        rawMaterials.forEach(product => {
          const productId = product._id;
          const conversionRate = conversionRates[productId] || 0;
          const freight = freightOutward[productId] || 0;
          // ✅ Get the correct isInPcs value based on unit
          const isKg = isUnitKg(product.unit || "");
          const isInPcs = !isKg; // For non-kg units, force per-piece mode
          const customWeight = customWeights[productId];
          
          if (conversionRate > 0) {
            calculateProductPrice(productId, conversionRate, newRate, isInPcs, freight, customWeight);
          }
        });
      }
      
      // Also recalculate saved sheets if any
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
      const savedWeights = {};
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
        if (sheet.customWeight !== undefined) {
          savedWeights[sheet.productId] = sheet.customWeight;
        }
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
      setCustomWeights(savedWeights);
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
  
  // Get the product to check its unit
  const product = rawMaterials.find(p => p._id === productId);
  const isKg = isUnitKg(product?.unit || "");
  // For non-kg units, force isInPcs to true
  const forceInPcs = !isKg;
  
  // Use forced value if non-kg, otherwise use stored mode
  const actualInPcs = forceInPcs ? true : inPcsMode[productId];
  
  setConversionRates(prev => ({ ...prev, [productId]: rate }));
  calculateProductPrice(productId, rate, rmRate, actualInPcs, freightOutward[productId], customWeights[productId]);
  setSavedCostingSheets(prev => prev.filter(sheet => sheet.productId !== productId));
};

const handleFreightChange = (productId, value) => {
  const freight = parseFloat(value) || 0;
  
  // Get the product to check its unit
  const product = rawMaterials.find(p => p._id === productId);
  const isKg = isUnitKg(product?.unit || "");
  const forceInPcs = !isKg;
  const actualInPcs = forceInPcs ? true : inPcsMode[productId];
  
  setFreightOutward(prev => ({ ...prev, [productId]: freight }));
  calculateProductPrice(productId, conversionRates[productId], rmRate, actualInPcs, freight, customWeights[productId]);
  setSavedCostingSheets(prev => prev.filter(sheet => sheet.productId !== productId));
};

  const handleInPcsToggle = (productId, checked) => {
    setInPcsMode(prev => ({ ...prev, [productId]: checked }));
    calculateProductPrice(productId, conversionRates[productId], rmRate, checked, freightOutward[productId], customWeights[productId]);
    setSavedCostingSheets(prev => prev.filter(sheet => sheet.productId !== productId));
  };
  
// Handle custom weight change (weight is in kg)
const handleWeightChange = (productId, value) => {
  if (value === '') {
    setCustomWeights(prev => ({ ...prev, [productId]: 0 }));
    return;
  }
  
  const weight = parseFloat(value);
  if (!isNaN(weight) && weight >= 0) {
    setCustomWeights(prev => ({ ...prev, [productId]: weight }));
    
    // Get the product to check its unit
    const product = rawMaterials.find(p => p._id === productId);
    const isKg = isUnitKg(product?.unit || "");
    const forceInPcs = !isKg;
    const actualInPcs = forceInPcs ? true : inPcsMode[productId];
    
    calculateProductPrice(productId, conversionRates[productId], rmRate, actualInPcs, freightOutward[productId], weight);
    setSavedCostingSheets(prev => prev.filter(sheet => sheet.productId !== productId));
  }
};

// Handle internal notes change
const handleInternalNotesChange = (productId, value) => {
  setInternalNotes(prev => ({ ...prev, [productId]: value }));
  setSavedCostingSheets(prev => prev.filter(sheet => sheet.productId !== productId));
};

// Handle remarks change
const handleRemarksChange = (productId, value) => {
  setRemarks(prev => ({ ...prev, [productId]: value }));
  setSavedCostingSheets(prev => prev.filter(sheet => sheet.productId !== productId));
};

const calculateProductPrice = (productId, conversionRate, currentRmRate, isInPcs, freight, customWeight) => {
  const product = rawMaterials.find(p => p._id === productId);
  if (!product) return;
  
  console.log(`CALCULATING for ${product.name}:`, {
    isInPcs,
    conversionRate,
    currentRmRate,
    freight,
    customWeight,
    productWeight: product.weight
  });
  
  let basePrice = 0;
  let productWeight = 0;
  let totalPerKg = currentRmRate + conversionRate;
  
  if (isInPcs) {
  if (customWeight !== undefined && customWeight > 0) {
    productWeight = customWeight;
  } else {
    const weightStr = product.weight || "";
    if (weightStr.toLowerCase().includes("kg")) {
      const match = weightStr.match(/(\d+(?:\.\d+)?)/);
      if (match) productWeight = parseFloat(match[1]);
    } else if (weightStr.toLowerCase().includes("g")) {
      const match = weightStr.match(/(\d+(?:\.\d+)?)/);
      if (match) productWeight = parseFloat(match[1]) / 1000;
    } else if (weightStr && !isNaN(parseFloat(weightStr))) {
      // If it's just a number, assume it's in kg
      productWeight = parseFloat(weightStr);
    } else {
      // ✅ If no weight is set, try to get from custom weight or use a default message
      console.warn(`No weight set for product: ${product.name}`);
      productWeight = 1; // Fallback to 1kg for calculation
    }
  }
  basePrice = totalPerKg * productWeight;
} else {
    basePrice = totalPerKg;
  }
  
  const totalWithFreight = basePrice + freight;
  const totalWithGST = totalWithFreight * 1.18;
  
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
  const customWeight = customWeights[productId];
  const internalNote = internalNotes[productId] || "";
  const remark = remarks[productId] || "";
  
  // Get the correct isInPcs value based on unit
  const isKg = isUnitKg(product?.unit || "");
  const isInPcs = !isKg ? true : inPcsMode[productId];
  
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
        customWeight: customWeight, // 🆕 Save custom weight
          internalNotes: internalNote,  // 🆕 Add this
      remarks: remark,              // 🆕 Add this
        date: new Date()
      });
      
      const savedSheet = res.data.costingSheet;
      
      setConversionRates(prev => ({ ...prev, [productId]: savedSheet.conversionRate }));
      setFreightOutward(prev => ({ ...prev, [productId]: savedSheet.freight || 0 }));
      setInPcsMode(prev => ({ ...prev, [productId]: savedSheet.isInPcs || false }));
      if (savedSheet.customWeight !== undefined) {
        setCustomWeights(prev => ({ ...prev, [productId]: savedSheet.customWeight }));
      }
      
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
          isInPcs: savedSheet.isInPcs || false,
          saved: true
        }
      }));
      
      setSavedCostingSheets(prev => {
        const existingIndex = prev.findIndex(sheet => sheet.productId === productId);
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = savedSheet;
          return updated;
        }
        return [...prev, savedSheet];
      });
      
      toast.success("Costing sheet saved successfully");
      
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

// Generate PDF and share via WhatsApp
const generatePDF = async (product, calculation, remarks) => {
  const currentDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  // Fetch the first image of the product
  let productImageUrl = null;
  try {
    // Fetch product details to get images
    const productRes = await axiosInstance.get(`/products-multer/${product._id}`);
    if (productRes.data && productRes.data.images && productRes.data.images.length > 0) {
      productImageUrl = productRes.data.images[0];
      console.log("Product image found:", productImageUrl);
    }
  } catch (err) {
    console.error("Failed to fetch product image:", err);
  }

  // Convert image to base64 if available
  let imageBase64 = null;
  if (productImageUrl) {
    try {
      const response = await fetch(productImageUrl);
      const blob = await response.blob();
      imageBase64 = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });
    } catch (err) {
      console.error("Failed to convert image to base64:", err);
    }
  }

  // Define document definition
  const docDefinition = {
    pageSize: 'A4',
    pageMargins: [40, 60, 40, 60],
    content: [
      // Page border wrapper
      {
        layout: 'noBorders',
        table: {
          widths: ['*'],
          body: [[
            {
              stack: [
                // Header - Company name centered
                {
                  text: 'THERMO PACKERS',
                  style: 'companyName',
                  alignment: 'center',
                  margin: [0, 0, 0, 5]
                },
                // Date on right side
                {
                  text: `Date: ${currentDate}`,
                  style: 'date',
                  alignment: 'right',
                  margin: [0, 0, 0, 20]
                },
                {
                  text: 'Costing Sheet',
                  style: 'title',
                  alignment: 'center',
                  margin: [0, 0, 0, 20]
                },
              ]
            }
          ]]
        },
        margin: [0, 0, 0, 0]
      }
    ],
    styles: {
      companyName: {
        fontSize: 20,
        bold: true,
        color: '#1a56db'
      },
      date: {
        fontSize: 10,
        color: '#666666'
      },
      title: {
        fontSize: 16,
        bold: true,
        color: '#333333'
      },
      sectionHeader: {
        fontSize: 12,
        bold: true,
        color: '#ffffff',
        fillColor: '#1a56db',
        margin: [0, 5, 0, 5],
        padding: [10, 5, 10, 5]
      },
      tableLabel: {
        fontSize: 10,
        bold: true,
        color: '#555555'
      },
      tableValue: {
        fontSize: 10,
        color: '#333333'
      },
      tableLabelBold: {
        fontSize: 11,
        bold: true,
        color: '#1a56db'
      },
      tableValueBold: {
        fontSize: 12,
        bold: true,
        color: '#16a34a'
      },
      remarksLabel: {
        fontSize: 10,
        bold: true,
        color: '#1a56db'
      },
      remarksText: {
        fontSize: 10,
        color: '#444444',
        margin: [0, 5, 0, 5]
      },
      footer: {
        fontSize: 10,
        italic: true,
        color: '#888888'
      },
      productImage: {
        alignment: 'center',
        margin: [0, 0, 0, 15]
      }
    },
    defaultStyle: {
      font: 'Roboto'
    }
  };

  // Add product image if available
  if (imageBase64) {
    docDefinition.content[0].table.body[0][0].stack.push({
      image: imageBase64,
      width: 150,
      height: 150,
      alignment: 'center',
      margin: [0, 0, 0, 15]
    });
  }

  // Add Product Details Section
  docDefinition.content[0].table.body[0][0].stack.push(
    {
      text: 'PRODUCT DETAILS',
      style: 'sectionHeader',
      margin: [0, 0, 0, 10]
    },
    {
      table: {
        widths: ['40%', '60%'],
        body: [
          [{ text: 'Product Name', style: 'tableLabel' }, { text: product.name, style: 'tableValue' }],
          [{ text: 'RM Rate', style: 'tableLabel' }, { text: `₹${rmRate.toFixed(2)}/kg`, style: 'tableValue' }],
          [{ text: 'Conversion', style: 'tableLabel' }, { text: `₹${conversionRates[product._id] || 0}/kg`, style: 'tableValue' }],
          [{ text: 'Total/kg', style: 'tableLabel' }, { text: `₹${calculation.totalPerKg.toFixed(2)}`, style: 'tableValue' }],
        ]
      },
      layout: 'noBorders',
      margin: [0, 0, 0, 15]
    }
  );

  // Pricing Section
  docDefinition.content[0].table.body[0][0].stack.push(
    {
      text: 'PRICING DETAILS',
      style: 'sectionHeader',
      margin: [0, 0, 0, 10]
    },
    {
      table: {
        widths: ['40%', '60%'],
        body: [
          ...(calculation.isInPcs ? [
            [{ text: 'Product Weight', style: 'tableLabel' }, { text: formatWeightDisplay(calculation.productWeight), style: 'tableValue' }],
            [{ text: 'Price/Piece', style: 'tableLabel' }, { text: `₹${calculation.pricePerPiece}`, style: 'tableValue' }],
          ] : [
            [{ text: 'Price/kg', style: 'tableLabel' }, { text: `₹${calculation.pricePerPiece}`, style: 'tableValue' }],
          ]),
          [{ text: 'Freight Outward', style: 'tableLabel' }, { text: `₹${calculation.freight || 0}${calculation.isInPcs ? '/pc' : '/kg'}`, style: 'tableValue' }],
          [{ text: 'Total with Freight', style: 'tableLabel' }, { text: `₹${calculation.totalWithFreight}`, style: 'tableValue' }],
        ]
      },
      layout: 'noBorders',
      margin: [0, 0, 0, 15]
    }
  );

  // GST Section
  docDefinition.content[0].table.body[0][0].stack.push(
    {
      text: 'TAX DETAILS',
      style: 'sectionHeader',
      margin: [0, 0, 0, 10]
    },
    {
      table: {
        widths: ['40%', '60%'],
        body: [
          [{ text: 'GST (18%)', style: 'tableLabel' }, { text: `₹${(parseFloat(calculation.totalWithFreight) * 0.18).toFixed(2)}`, style: 'tableValue' }],
          [{ text: 'Final Price (incl. GST)', style: 'tableLabelBold' }, { text: `₹${calculation.totalWithGST}`, style: 'tableValueBold' }],
        ]
      },
      layout: 'noBorders',
      margin: [0, 0, 0, 15]
    }
  );

  // Add Remarks section if exists
  if (remarks && remarks.trim()) {
    docDefinition.content[0].table.body[0][0].stack.push(
      {
        text: 'REMARKS',
        style: 'sectionHeader',
        margin: [0, 0, 0, 10]
      },
      {
        stack: [
          { text: 'Remarks:', style: 'remarksLabel', margin: [0, 0, 0, 5] },
          { text: remarks, style: 'remarksText' }
        ],
        margin: [10, 0, 10, 15]
      }
    );
  }

  // Add Footer
  docDefinition.content[0].table.body[0][0].stack.push(
    {
      text: 'Thank you for choosing Thermo Packers!',
      style: 'footer',
      alignment: 'center',
      margin: [0, 20, 0, 10]
    }
  );

  // Add page border
  docDefinition.pageMargins = [30, 50, 30, 50];
  
  // Wrap everything in a bordered container
  const borderedContent = {
    layout: {
      fillColor: function(rowIndex, node, columnIndex) {
        return null;
      },
      hLineWidth: function(i, node) {
        return 1;
      },
      vLineWidth: function(i, node) {
        return 1;
      },
      hLineColor: function(i, node) {
        return '#333333';
      },
      vLineColor: function(i, node) {
        return '#333333';
      },
      paddingLeft: function(i, node) {
        return 10;
      },
      paddingRight: function(i, node) {
        return 10;
      },
      paddingTop: function(i, node) {
        return 10;
      },
      paddingBottom: function(i, node) {
        return 10;
      }
    },
    table: {
      widths: ['*'],
      body: [[
        {
          stack: docDefinition.content[0].table.body[0][0].stack,
          margin: [5, 5, 5, 5]
        }
      ]]
    },
    margin: [0, 0, 0, 0]
  };

  docDefinition.content = [borderedContent];

  // Generate PDF and share via WhatsApp
  pdfMake.createPdf(docDefinition).getBlob((blob) => {
    const file = new File([blob], `Costing_Sheet_${product.name}_${currentDate.replace(/\//g, '-')}.pdf`, { type: 'application/pdf' });
    
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      navigator.share({
        files: [file],
        title: 'Costing Sheet',
        text: ''
      }).catch((error) => {
        console.log('Error sharing:', error);
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Costing_Sheet_${product.name}_${currentDate.replace(/\//g, '-')}.pdf`;
        link.click();
        URL.revokeObjectURL(url);
        alert('PDF downloaded. You can now share it via WhatsApp from your device.');
      });
    } else {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Costing_Sheet_${product.name}_${currentDate.replace(/\//g, '-')}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      alert('PDF downloaded! You can now share it via WhatsApp from your device or computer.');
    }
  });
};

  return (
    <div className="mt-6 border border-gray-200 rounded-lg overflow-hidden">
    <button
  onClick={() => setIsOpen(!isOpen)}
  data-costing-sheet-toggle="true"
  data-expanded={isOpen}
  className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 transition-all duration-200"
>
        <div className="flex items-center gap-2">
          <Calculator size={20} />
          <span className="font-semibold">Costing Sheet - Frequently Bought Products</span>
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
 // Update this section in your map function:
const savedSheet = getLatestSheetForProduct(product._id);
const hasSavedSheet = !!savedSheet;
const unit = product.unit || "";
const isKg = isUnitKg(unit);

let showCheckbox = false;
let isInPcs = false;

// For non-kg units, force per-piece mode
if (!isKg) {
  // Non-kg units: always per-piece mode, no checkbox needed
  isInPcs = true;
  showCheckbox = false;
} else {
  // kg/kgs units: per-kg mode by default, but can be toggled if there's a saved sheet with per-piece mode
  if (hasSavedSheet) {
    isInPcs = inPcsMode[product._id] !== undefined ? inPcsMode[product._id] : (savedSheet?.isInPcs || false);
  } else {
    isInPcs = false;
  }
  showCheckbox = true; // Show checkbox only for kg units to allow per-piece mode
}
  
  const savedConversionRate = savedSheet?.conversionRate || 0;
  const savedFreight = savedSheet?.freight || 0;
  
  // ✅ ADD THESE TWO LINES HERE:
  const effectiveWeight = customWeights[product._id] !== undefined ? customWeights[product._id] : getEffectiveWeight(product._id);
  const effectiveWeightInGrams = (effectiveWeight * 1000).toFixed(0);
  
  const isEditing = editingWeightId === product._id;
  
  const calculation = calculatedPrices[product._id] || {
    totalPerKg: 0,
    pricePerPiece: "0.00",
    productWeight: effectiveWeight,
    freight: 0,
    totalWithFreight: "0.00",
    totalWithGST: "0.00",
    isInPcs: isInPcs
  };

  // Delete costing sheet for a product
const deleteCostingSheet = async (productId, sheetId) => {
  if (!window.confirm("Are you sure you want to delete this costing sheet? This action cannot be undone.")) {
    return;
  }
  
  try {
    const response = await axiosInstance.delete(`/customers/${customerId}/costing-sheet/${sheetId}`);
    
    if (response.data.success) {
      toast.success("Costing sheet deleted successfully!");
      
      // Clear the local state for this product
      setConversionRates(prev => {
        const newState = { ...prev };
        delete newState[productId];
        return newState;
      });
      
      setFreightOutward(prev => {
        const newState = { ...prev };
        delete newState[productId];
        return newState;
      });
      
      setInPcsMode(prev => {
        const newState = { ...prev };
        delete newState[productId];
        return newState;
      });
      
      setCustomWeights(prev => {
        const newState = { ...prev };
        delete newState[productId];
        return newState;
      });
      
      setCalculatedPrices(prev => {
        const newState = { ...prev };
        delete newState[productId];
        return newState;
      });
      
      setInternalNotes(prev => {
        const newState = { ...prev };
        delete newState[productId];
        return newState;
      });
      
      setRemarks(prev => {
        const newState = { ...prev };
        delete newState[productId];
        return newState;
      });
      
      // Update the savedCostingSheets list
      setSavedCostingSheets(prev => prev.filter(sheet => sheet._id !== sheetId));
      
      // Reset initial load flag to allow re-initialization if needed
      initialLoadDone.current = false;
    }
  } catch (err) {
    console.error("Delete costing sheet error:", err);
    toast.error(err.response?.data?.error || "Failed to delete costing sheet");
  }
};

                return (
                  <div key={product._id} className={`bg-white rounded-lg border shadow-sm hover:shadow-md transition-shadow duration-200 ${hasSavedSheet ? 'border-green-300 bg-green-50' : 'border-gray-200'}`}>
                    <div className={`p-3 border-b ${hasSavedSheet ? 'border-green-200' : 'border-gray-100'} bg-gradient-to-r from-gray-50 to-white`}>
                      <div className="flex justify-between items-start">
<h3 className="font-semibold text-gray-800 break-words">{product.name}</h3>
                        {hasSavedSheet && <span className="text-xs bg-green-500 text-white px-2 py-1 rounded-full">Saved</span>}
                      </div>
                      <p className="text-xs text-gray-500">Unit: {unit || 'kg'}</p>
                      
                      {showCheckbox && (
                        <label className="items-center gap-2 mt-2 text-xs cursor-pointer hidden">
                          <input
                            type="checkbox"
                            checked={isInPcs}
                            onChange={(e) => handleInPcsToggle(product._id, e.target.checked)}
                            className="w-3 h-3"
                          />
                          <span className="text-gray-600">Calculate per piece (with product weight)</span>
                        </label>
                      )}
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
                            value={conversionRates[product._id] !== undefined ? conversionRates[product._id] : savedConversionRate}
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

                    {isInPcs && isKg === false && (
  <>
    {/* Editable Product Weight - Only show for non-kg units */}
    <div className="flex justify-between items-center text-sm">
      <span className="text-gray-600">Product Weight (Enter wt. in grams):</span>
      <div className="flex items-center gap-1">
        {isEditing ? (
          <>
            <input
              type="text"
              value={effectiveWeightInGrams}
              onChange={(e) => {
                const value = e.target.value;
                if (value === '' || /^\d*\.?\d*$/.test(value)) {
                  const grams = parseFloat(value);
                  if (!isNaN(grams)) {
                    const kgValue = grams / 1000;
                    handleWeightChange(product._id, kgValue);
                  } else if (value === '') {
                    handleWeightChange(product._id, '');
                  }
                }
              }}
              className="w-24 px-2 py-1 text-sm border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              autoFocus
              onBlur={() => {
                const currentWeight = customWeights[product._id] !== undefined ? customWeights[product._id] : getEffectiveWeight(product._id);
                if (currentWeight <= 0) {
                  handleWeightChange(product._id, 0);
                }
                setEditingWeightId(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const currentWeight = customWeights[product._id] !== undefined ? customWeights[product._id] : getEffectiveWeight(product._id);
                  if (currentWeight <= 0) {
                    handleWeightChange(product._id, 0);
                  }
                  setEditingWeightId(null);
                }
                if (e.key === 'Escape') {
                  setEditingWeightId(null);
                }
              }}
            />
            <span className="text-xs text-gray-500">g</span>
            <button
              onClick={() => setEditingWeightId(null)}
              className="text-gray-400 hover:text-gray-600 text-xs"
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <span className="font-medium">
              {formatWeightDisplay(effectiveWeight)}
            </span>
            <button
              onClick={() => setEditingWeightId(product._id)}
              className="text-blue-500 hover:text-blue-700"
              title="Edit weight for this costing sheet"
            >
              <Edit2 size={12} />
            </button>
          </>
        )}
      </div>
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
                            value={freightOutward[product._id] !== undefined ? freightOutward[product._id] : savedFreight}
                            onChange={(e) => handleFreightChange(product._id, e.target.value)}
                            className="w-full pl-6 pr-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="0.00"
                          />
                        </div>
                        <span className="text-xs text-gray-500">{isInPcs ? '/pc' : '/kg'}</span>
                      </div>

                      <div className="flex justify-between items-center text-sm font-medium text-blue-600">
                        <span className="text-gray-600">Total Price with Outward Freight:</span>
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


{/* Remarks Field */}
<div className="mt-2">
  <label className="block text-xs text-gray-600 mb-1">Remarks: (Shared with Costing Sheet)</label>
  <textarea
    rows="2"
    value={remarks[product._id] || ""}
    onChange={(e) => handleRemarksChange(product._id, e.target.value)}
    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
    placeholder="Add remarks..."
  />
</div>

{/* Internal Notes Field */}
<div className="mt-2">
  <label className="block text-xs text-gray-600 mb-1">Internal Notes: (Only for Internal reference - Not Shared in Costing Sheet)</label>
  <textarea
    rows="2"
    value={internalNotes[product._id] || ""}
    onChange={(e) => handleInternalNotesChange(product._id, e.target.value)}
    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
    placeholder="Add internal notes..."
  />
</div>
<div className="flex gap-2 mt-2">
  <button
    onClick={() => generatePDF(product, calculation, remarks[product._id] || savedSheet?.remarks || "")}
    className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2 px-3 rounded transition-colors duration-200"
  >
    📤 Share
  </button>
  <button
    onClick={() => saveCostingSheet(product._id)}
    disabled={!conversionRates[product._id] && !savedConversionRate}
    className={`flex-1 text-white text-sm font-medium py-2 px-3 rounded transition-colors duration-200 ${
      hasSavedSheet ? 'bg-blue-600 hover:bg-blue-700' : 'bg-purple-600 hover:bg-purple-700'
    } disabled:bg-gray-400`}
  >
    {hasSavedSheet ? '💾 Update' : '💾 Save'}
  </button>
  {hasSavedSheet && (
    <button
      onClick={() => deleteCostingSheet(product._id, savedSheet._id)}
      className="bg-red-600 hover:bg-red-700 text-white text-sm font-medium py-2 px-3 rounded transition-colors duration-200"
      title="Delete this costing sheet"
    >
      🗑️ Delete
    </button>
  )}
</div>
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