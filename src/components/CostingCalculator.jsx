import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../axiosInstance";
import InternalNavbar from "../components/InternalNavbar";
import toast from "react-hot-toast";
import { Calculator, Truck, Package, DollarSign } from "lucide-react";

export default function CostingCalculator() {
  const navigate = useNavigate();
  const [activeCalculator, setActiveCalculator] = useState(null);
  const [rmRate, setRmRate] = useState(0);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    length: "",
    lengthUnit: "mm",
    breadth: "",
    breadthUnit: "mm",
    height: "",
    heightUnit: "mm",
    density: "",
    customRmRate: "",
    conversionRate: "",
    freight: ""
  });
  const [result, setResult] = useState(null);

  // Fetch RM rate on load
  useEffect(() => {
    fetchRMRate();
  }, []);

  const fetchRMRate = async () => {
    try {
      const res = await axiosInstance.get("/rm-rate");
      setRmRate(res.data.rate || 0);
      setFormData(prev => ({ ...prev, customRmRate: res.data.rate || 0 }));
    } catch (err) {
      console.error("Error fetching RM rate:", err);
      toast.error("Failed to load RM rate");
    }
  };

  // Convert dimension to mm
  const convertToMM = (value, unit) => {
    const num = parseFloat(value);
    if (isNaN(num)) return 0;
    
    switch (unit) {
      case "mm": return num;
      case "cm": return num * 10;
      case "inch": return num * 25.4;
      case "feet": return num * 304.8;
      default: return num;
    }
  };

  // Calculate required volume in m³
  const calculateRequiredVolume = () => {
    const lengthMM = convertToMM(formData.length, formData.lengthUnit);
    const breadthMM = convertToMM(formData.breadth, formData.breadthUnit);
    const heightMM = convertToMM(formData.height, formData.heightUnit);
    
    // Convert to meters
    const lengthM = lengthMM / 1000;
    const breadthM = breadthMM / 1000;
    const heightM = heightMM / 1000;
    
    // Volume in m³
    const volume = lengthM * breadthM * heightM;
    return { volume, lengthM, breadthM, heightM };
  };

  // Calculate best number of pieces from raw block
  const calculateBestPieces = (requiredL, requiredB, requiredH) => {
    // Raw block dimensions in mm
    const blockL = 6100;
    const blockB = 1220;
    const blockH = 620;
    
    // All possible orientations
    const orientations = [
      { l: blockL, b: blockB, h: blockH, name: "6100 x 1220 x 620" },
      { l: blockL, b: blockH, h: blockB, name: "6100 x 620 x 1220" },
      { l: blockB, b: blockL, h: blockH, name: "1220 x 6100 x 620" },
      { l: blockB, b: blockH, h: blockL, name: "1220 x 620 x 6100" },
      { l: blockH, b: blockL, h: blockB, name: "620 x 6100 x 1220" },
      { l: blockH, b: blockB, h: blockL, name: "620 x 1220 x 6100" }
    ];
    
    let maxPieces = 0;
    let bestOrientation = null;
    
    orientations.forEach(orient => {
      const piecesL = Math.floor(orient.l / requiredL);
      const piecesB = Math.floor(orient.b / requiredB);
      const piecesH = Math.floor(orient.h / requiredH);
      const totalPieces = piecesL * piecesB * piecesH;
      
      if (totalPieces > maxPieces) {
        maxPieces = totalPieces;
        bestOrientation = {
          orientation: orient.name,
          piecesL,
          piecesB,
          piecesH,
          totalPieces
        };
      }
    });
    
    return { maxPieces, bestOrientation };
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCalculate = () => {
    setLoading(true);
    
    try {
      // Validate required fields
      if (!formData.length || !formData.breadth || !formData.height) {
        toast.error("Please enter all dimensions");
        setLoading(false);
        return;
      }
      
      if (!formData.density) {
        toast.error("Please enter density");
        setLoading(false);
        return;
      }
      
      const { volume, lengthM, breadthM, heightM } = calculateRequiredVolume();
      
      if (volume === 0) {
        toast.error("Invalid dimensions");
        setLoading(false);
        return;
      }
      
      // Get dimensions in mm for piece calculation
      const lengthMM = convertToMM(formData.length, formData.lengthUnit);
      const breadthMM = convertToMM(formData.breadth, formData.breadthUnit);
      const heightMM = convertToMM(formData.height, formData.heightUnit);
      
      // Calculate best pieces from block
      const { maxPieces, bestOrientation } = calculateBestPieces(lengthMM, breadthMM, heightMM);
      
      // Raw block volume (4.6 m³)
      const blockVolume = 4.6;
      
      // Weight per block
      const density = parseFloat(formData.density);
      const weightPerBlock = density * blockVolume;
      
      // RM rate (use custom if provided, else fetched rate)
      const effectiveRmRate = parseFloat(formData.customRmRate) || rmRate;
      
      // Conversion rate
      const conversionRate = parseFloat(formData.conversionRate) || 0;
      
      // Total per kg
      const totalPerKg = effectiveRmRate + conversionRate;
      
      // Cost per block
      const costPerBlock = weightPerBlock * totalPerKg;
      
      // Price per piece
      const pricePerPiece = maxPieces > 0 ? costPerBlock / maxPieces : 0;
      
      // Freight and GST
      const freight = parseFloat(formData.freight) || 0;
      const totalWithFreight = pricePerPiece + (freight / maxPieces);
      const gst = totalWithFreight * 0.18;
      const finalPrice = totalWithFreight + gst;
      
      // Outer dimension in m³
      const outerDimensionM3 = volume;
      
      // No. of pieces in tempo (12m³)
      const piecesInTempo = outerDimensionM3 > 0 ? Math.floor(12 / outerDimensionM3) : 0;
      
      // No. of pieces in truck (40m³)
      const piecesInTruck = outerDimensionM3 > 0 ? Math.floor(40 / outerDimensionM3) : 0;
      
      setResult({
        outerDimensions: {
          length: lengthM.toFixed(3),
          breadth: breadthM.toFixed(3),
          height: heightM.toFixed(3),
          volume: volume.toFixed(6),
          displayLength: `${formData.length} ${formData.lengthUnit}`,
          displayBreadth: `${formData.breadth} ${formData.breadthUnit}`,
          displayHeight: `${formData.height} ${formData.heightUnit}`
        },
        density: density,
        blockVolume: blockVolume,
        weightPerBlock: weightPerBlock.toFixed(2),
        rmRate: effectiveRmRate,
        conversionRate: conversionRate,
        totalPerKg: totalPerKg.toFixed(2),
        costPerBlock: costPerBlock.toFixed(2),
        piecesFromBlock: {
          count: maxPieces,
          orientation: bestOrientation?.orientation,
          piecesL: bestOrientation?.piecesL,
          piecesB: bestOrientation?.piecesB,
          piecesH: bestOrientation?.piecesH
        },
        pricePerPiece: pricePerPiece.toFixed(2),
        freight: freight,
        freightPerPiece: (freight / maxPieces).toFixed(2),
        totalWithFreight: totalWithFreight.toFixed(2),
        gst: gst.toFixed(2),
        finalPrice: finalPrice.toFixed(2),
        piecesInTempo: piecesInTempo,
        piecesInTruck: piecesInTruck,
        outerDimensionM3: outerDimensionM3.toFixed(6)
      });
      
      toast.success("Calculation completed!");
    } catch (err) {
      console.error("Calculation error:", err);
      toast.error("Failed to calculate");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      length: "",
      lengthUnit: "mm",
      breadth: "",
      breadthUnit: "mm",
      height: "",
      heightUnit: "mm",
      density: "",
      customRmRate: rmRate.toString(),
      conversionRate: "",
      freight: ""
    });
    setResult(null);
  };

  if (!activeCalculator) {
    return (
      <>
        <InternalNavbar />
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-12 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Costing Calculator
              </h1>
              <p className="text-gray-600 mt-2">Select a calculator type</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <button
                onClick={() => setActiveCalculator("thermocol")}
                className="bg-white rounded-2xl shadow-xl p-8 text-center hover:shadow-2xl transition-all duration-200 border-2 border-transparent hover:border-blue-500"
              >
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Package size={40} className="text-blue-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-800 mb-2">Thermocol Sheet Costing Calculator</h2>
                <p className="text-gray-500 text-sm">Calculate costing for thermocol sheets based on dimensions, density, and more</p>
              </button>
              
              {/* Add more calculator buttons here in the future */}
            </div>
            
            <div className="mt-8 text-center">
              <button
                onClick={() => navigate(-1)}
                className="text-gray-600 hover:text-gray-800"
              >
                ← Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <InternalNavbar />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-6 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => setActiveCalculator(null)}
              className="text-blue-600 hover:text-blue-800 flex items-center gap-2"
            >
              ← Back to Calculators
            </button>
            <h1 className="text-2xl font-bold text-gray-800">Thermocol Sheet Costing Calculator</h1>
            <div className="w-20"></div>
          </div>
          
          {/* Form Card */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-6">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Calculator size={24} />
                Enter Dimensions & Details
              </h2>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Length</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="any"
                      name="length"
                      value={formData.length}
                      onChange={handleChange}
                      placeholder="Enter length"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <select
                      name="lengthUnit"
                      value={formData.lengthUnit}
                      onChange={handleChange}
                      className="w-20 px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="mm">mm</option>
                      <option value="cm">cm</option>
                      <option value="inch">inch</option>
                      <option value="feet">feet</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Breadth/Width</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="any"
                      name="breadth"
                      value={formData.breadth}
                      onChange={handleChange}
                      placeholder="Enter breadth"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <select
                      name="breadthUnit"
                      value={formData.breadthUnit}
                      onChange={handleChange}
                      className="w-20 px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="mm">mm</option>
                      <option value="cm">cm</option>
                      <option value="inch">inch</option>
                      <option value="feet">feet</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Height/Thickness</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="any"
                      name="height"
                      value={formData.height}
                      onChange={handleChange}
                      placeholder="Enter height"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <select
                      name="heightUnit"
                      value={formData.heightUnit}
                      onChange={handleChange}
                      className="w-20 px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="mm">mm</option>
                      <option value="cm">cm</option>
                      <option value="inch">inch</option>
                      <option value="feet">feet</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Required Density (kg/m³)</label>
                  <input
                    type="number"
                    step="any"
                    name="density"
                    value={formData.density}
                    onChange={handleChange}
                    placeholder="Enter density"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    RM Rate (₹/kg)
                    <span className="text-xs text-gray-500 ml-1">(Current: ₹{rmRate.toFixed(2)}/kg)</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="customRmRate"
                    value={formData.customRmRate}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Conversion Rate (₹/kg)</label>
                  <input
                    type="number"
                    step="0.01"
                    name="conversionRate"
                    value={formData.conversionRate}
                    onChange={handleChange}
                    placeholder="Enter conversion rate"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                {/* <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Freight Outward (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    name="freight"
                    value={formData.freight}
                    onChange={handleChange}
                    placeholder="Enter freight amount"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div> */}
              </div>
              
              <div className="flex gap-4">
                <button
                  onClick={handleCalculate}
                  disabled={loading}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 disabled:opacity-50"
                >
                  {loading ? "Calculating..." : "Calculate Costing"}
                </button>
                <button
                  onClick={handleReset}
                  className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition-all duration-200"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
          
          {/* Results Card */}
          {result && (
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-green-600 to-teal-600 px-6 py-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <DollarSign size={24} />
                  Calculation Results
                </h2>
              </div>
              
              <div className="p-6 space-y-4">
                {/* Outer Dimensions */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-800 mb-2">📏 Outer Dimensions</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                    <p><span className="text-gray-600">Length:</span> {result.outerDimensions.displayLength} ({result.outerDimensions.length} m)</p>
                    <p><span className="text-gray-600">Breadth:</span> {result.outerDimensions.displayBreadth} ({result.outerDimensions.breadth} m)</p>
                    <p><span className="text-gray-600">Height:</span> {result.outerDimensions.displayHeight} ({result.outerDimensions.height} m)</p>
                    <p><span className="text-gray-600">Volume:</span> {result.outerDimensions.volume} m³</p>
                  </div>
                </div>
                
                {/* Costing Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-800 mb-2">💰 Costing Details</h3>
                    <div className="space-y-1 text-sm">
                      <p><span className="text-gray-600">Density:</span> {result.density} kg/m³</p>
                      <p><span className="text-gray-600">Raw Block Volume:</span> {result.blockVolume} m³</p>
                      <p><span className="text-gray-600">Weight per Block:</span> {result.weightPerBlock} kg</p>
                      <p><span className="text-gray-600">RM Rate:</span> ₹{result.rmRate}/kg</p>
                      <p><span className="text-gray-600">Conversion Rate:</span> ₹{result.conversionRate}/kg</p>
                      <p><span className="text-gray-600">Total/kg:</span> ₹{result.totalPerKg}</p>
                      <p><span className="text-gray-600">Cost per Block:</span> ₹{result.costPerBlock}</p>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-800 mb-2">📦 Pieces Calculation</h3>
                    <div className="space-y-1 text-sm">
                      <p><span className="text-gray-600">Best Orientation:</span> {result.piecesFromBlock.orientation}</p>
                      <p><span className="text-gray-600">Pieces Layout:</span> {result.piecesFromBlock.piecesL} x {result.piecesFromBlock.piecesB} x {result.piecesFromBlock.piecesH}</p>
                      <p><span className="text-gray-600 font-bold text-green-600">Total Pieces from Block:</span> {result.piecesFromBlock.count} pcs</p>
                      <p><span className="text-lg font-bold text-purple-600">Final Price per Piece:</span> ₹{result.pricePerPiece}</p>
                      {/* <p><span className="text-gray-600">Freight:</span> ₹{result.freight} (₹{result.freightPerPiece}/pc)</p>
                      <p><span className="text-gray-600">Total with Freight:</span> ₹{result.totalWithFreight}</p>
                      <p><span className="text-gray-600">GST (18%):</span> ₹{result.gst}</p> */}
                      {/* <p><span className="text-lg font-bold text-purple-600">Final Price per Piece:</span> ₹{result.finalPrice}</p> */}
                    </div>
                  </div>
                </div>
                
                {/* Transport Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                      <Truck size={18} /> Tempo (12m³)
                    </h3>
                    <p className="text-sm">Outer Dimension per piece: {result.outerDimensionM3} m³</p>
                    <p className="text-lg font-bold text-blue-700">Pieces per Tempo: {result.piecesInTempo} pcs</p>
                  </div>
                  
                  <div className="bg-orange-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                      <Truck size={18} /> Truck (40m³)
                    </h3>
                    <p className="text-sm">Outer Dimension per piece: {result.outerDimensionM3} m³</p>
                    <p className="text-lg font-bold text-orange-700">Pieces per Truck: {result.piecesInTruck} pcs</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}