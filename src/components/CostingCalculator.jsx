import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../axiosInstance";
import InternalNavbar from "../components/InternalNavbar";
import toast from "react-hot-toast";
import { Calculator, Truck, Package, DollarSign, Share2 } from "lucide-react";
import pdfMake from 'pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import PipeSectionCalculator from "./PipeSectionCalculator";

// Configure pdfmake
pdfMake.vfs = pdfFonts.vfs;

export default function CostingCalculator() {
  const navigate = useNavigate();
  const [activeCalculator, setActiveCalculator] = useState(null);
  const [rmRate, setRmRate] = useState(0);
  const [loading, setLoading] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [formData, setFormData] = useState({
    length: "",
    lengthUnit: "mm",
    breadth: "",
    breadthUnit: "mm",
    height: "",
    heightUnit: "mm",
    density: "",
    customRmRate: "",
    conversionRate: "80",
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

// Calculate required volume in m³ with 0.5mm extra on all dimensions
const calculateRequiredVolume = () => {
  // Convert input to mm first
  let lengthMM = convertToMM(formData.length, formData.lengthUnit);
  let breadthMM = convertToMM(formData.breadth, formData.breadthUnit);
  let heightMM = convertToMM(formData.height, formData.heightUnit);
  
  // ✅ Add 0.5mm extra to each dimension
  lengthMM = lengthMM + 0.5;
  breadthMM = breadthMM + 0.5;
  heightMM = heightMM + 0.5;
  
  // Convert to meters
  const lengthM = lengthMM / 1000;
  const breadthM = breadthMM / 1000;
  const heightM = heightMM / 1000;
  
  // Volume in m³
  const volume = lengthM * breadthM * heightM;
  
  return { volume, lengthM, breadthM, heightM, lengthMM, breadthMM, heightMM };
};

  // Calculate best number of pieces from raw block
  const calculateBestPieces = (requiredL, requiredB, requiredH) => {
    const blockL = 6100;
    const blockB = 1220;
    const blockH = 620;
    
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
    
    const { volume, lengthM, breadthM, heightM, lengthMM, breadthMM, heightMM } = calculateRequiredVolume();
    
    if (volume === 0) {
      toast.error("Invalid dimensions");
      setLoading(false);
      return;
    }
    
    // Use the dimensions WITH 0.5mm extra for piece calculation
    const { maxPieces, bestOrientation } = calculateBestPieces(lengthMM, breadthMM, heightMM);
    
    const blockVolume = 4.6;
    const density = parseFloat(formData.density);
    const weightPerBlock = density * blockVolume;
    const effectiveRmRate = parseFloat(formData.customRmRate) || rmRate;
    const conversionRate = parseFloat(formData.conversionRate) || 0;
    const totalPerKg = effectiveRmRate + conversionRate;
    const costPerBlock = weightPerBlock * totalPerKg;
    const pricePerPiece = maxPieces > 0 ? costPerBlock / maxPieces : 0;
    const freight = parseFloat(formData.freight) || 0;
    const totalWithFreight = pricePerPiece + (freight / maxPieces);
    const gst = totalWithFreight * 0.18;
    const finalPrice = totalWithFreight + gst;
    const outerDimensionM3 = volume;
    const piecesInTempo = outerDimensionM3 > 0 ? Math.floor(12 / outerDimensionM3) : 0;
    const piecesInTruck = outerDimensionM3 > 0 ? Math.floor(40 / outerDimensionM3) : 0;
    
    // Calculate display dimensions with the +0.5mm addition
    const displayLengthMM = lengthMM;
    const displayBreadthMM = breadthMM;
    const displayHeightMM = heightMM;
    
    setResult({
      outerDimensions: {
        length: lengthM.toFixed(3),
        breadth: breadthM.toFixed(3),
        height: heightM.toFixed(3),
        volume: volume.toFixed(6),
        displayLength: `${formData.length} ${formData.lengthUnit} (+0.5mm = ${displayLengthMM.toFixed(1)}mm)`,
        displayBreadth: `${formData.breadth} ${formData.breadthUnit} (+0.5mm = ${displayBreadthMM.toFixed(1)}mm)`,
        displayHeight: `${formData.height} ${formData.heightUnit} (+0.5mm = ${displayHeightMM.toFixed(1)}mm)`
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
      outerDimensionM3: outerDimensionM3.toFixed(6),
      // Store the extra dimensions for reference
      extraDimensions: {
        original: {
          length: formData.length,
          breadth: formData.breadth,
          height: formData.height
        },
        added: {
          length: 0.5,
          breadth: 0.5,
          height: 0.5
        },
        final: {
          length: displayLengthMM.toFixed(1),
          breadth: displayBreadthMM.toFixed(1),
          height: displayHeightMM.toFixed(1)
        }
      }
    });
    
    toast.success("Calculation completed with +0.5mm added to all dimensions!");
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
      conversionRate: "80",
      freight: ""
    });
    setResult(null);
  };

// Generate and share PDF
const handleSharePDF = async () => {
  if (!result) {
    toast.error("Please calculate first");
    return;
  }
  
  setSharing(true);
  
  const currentDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  
  const docDefinition = {
    pageSize: 'A4',
    pageMargins: [40, 60, 40, 60],
    content: [
      {
        text: 'THERMO PACKERS',
        style: 'companyName',
        alignment: 'center',
        margin: [0, 0, 0, 5]
      },
      {
        text: `Date: ${currentDate}`,
        style: 'date',
        alignment: 'right',
        margin: [0, 0, 0, 20]
      },
      {
        text: 'Thermocol Sheet Costing Calculator',
        style: 'title',
        alignment: 'center',
        margin: [0, 0, 0, 20]
      },
      {
        text: 'INPUT DETAILS',
        style: 'sectionHeader',
        margin: [0, 0, 0, 10]
      },
      {
        table: {
          widths: ['40%', '60%'],
          body: [
            [{ text: 'Length', style: 'tableLabel' }, { text: result.outerDimensions.displayLength, style: 'tableValue' }],
            [{ text: 'Breadth/Width', style: 'tableLabel' }, { text: result.outerDimensions.displayBreadth, style: 'tableValue' }],
            [{ text: 'Height/Thickness', style: 'tableLabel' }, { text: result.outerDimensions.displayHeight, style: 'tableValue' }],
            [{ text: 'Density', style: 'tableLabel' }, { text: `${result.density} kg/m³`, style: 'tableValue' }],
            [{ text: 'RM Rate', style: 'tableLabel' }, { text: `₹${result.rmRate}/kg`, style: 'tableValue' }],
            [{ text: 'Conversion Rate', style: 'tableLabel' }, { text: `₹${result.conversionRate}/kg`, style: 'tableValue' }],
          ]
        },
        layout: 'noBorders',
        margin: [0, 0, 0, 15]
      },
      {
        text: 'CALCULATION RESULTS',
        style: 'sectionHeader',
        margin: [0, 0, 0, 10]
      },
      {
        table: {
          widths: ['40%', '60%'],
          body: [
            [{ text: 'Outer Volume per Piece', style: 'tableLabel' }, { text: `${result.outerDimensions.volume} m³`, style: 'tableValue' }],
            [{ text: 'Raw Block Volume', style: 'tableLabel' }, { text: `${result.blockVolume} m³`, style: 'tableValue' }],
            [{ text: 'Weight per Block', style: 'tableLabel' }, { text: `${result.weightPerBlock} kg`, style: 'tableValue' }],
            [{ text: 'Total/kg', style: 'tableLabel' }, { text: `₹${result.totalPerKg}`, style: 'tableValue' }],
            [{ text: 'Cost per Block', style: 'tableLabel' }, { text: `₹${result.costPerBlock}`, style: 'tableValue' }],
            [{ text: 'Best Orientation', style: 'tableLabel' }, { text: result.piecesFromBlock.orientation, style: 'tableValue' }],
            [{ text: 'Pieces Layout', style: 'tableLabel' }, { text: `${result.piecesFromBlock.piecesL} x ${result.piecesFromBlock.piecesB} x ${result.piecesFromBlock.piecesH}`, style: 'tableValue' }],
            [{ text: 'Total Pieces from Block', style: 'tableLabelBold' }, { text: `${result.piecesFromBlock.count} pcs`, style: 'tableValueBold' }],
            [{ text: 'Price per Piece', style: 'tableLabel' }, { 
              text: [
                { text: `₹${result.pricePerPiece}`, style: 'tableValueBold' },
                { text: `  (₹${result.costPerBlock} / ${result.piecesFromBlock.count} pcs)`, style: 'calculationText' }
              ], 
              style: 'tableValue' 
            }],
          ]
        },
        layout: 'noBorders',
        margin: [0, 0, 0, 15]
      },
      {
        text: 'TRANSPORT ESTIMATES',
        style: 'sectionHeader',
        margin: [0, 0, 0, 10]
      },
      {
        table: {
          widths: ['40%', '60%'],
          body: [
            [{ text: 'Pieces per Tempo (12m³)', style: 'tableLabel' }, { text: `${result.piecesInTempo} pcs`, style: 'tableValue' }],
            [{ text: 'Pieces per Truck (40m³)', style: 'tableLabel' }, { text: `${result.piecesInTruck} pcs`, style: 'tableValue' }],
          ]
        },
        layout: 'noBorders',
        margin: [0, 0, 0, 15]
      },
      {
        text: 'Note: GST 18% and Freight is Extra',
        style: 'note',
        alignment: 'center',
        margin: [0, 10, 0, 10],
        color: '#ff6600',
        bold: true
      },
      {
        text: 'Thank you for choosing Thermo Packers!',
        style: 'footer',
        alignment: 'center',
        margin: [0, 20, 0, 10]
      }
    ],
    styles: {
      companyName: { fontSize: 20, bold: true, color: '#1a56db' },
      date: { fontSize: 10, color: '#666666' },
      title: { fontSize: 16, bold: true, color: '#333333' },
      sectionHeader: { fontSize: 12, bold: true, color: '#ffffff', fillColor: '#1a56db', margin: [0, 5, 0, 5], padding: [10, 5, 10, 5] },
      tableLabel: { fontSize: 10, bold: true, color: '#555555' },
      tableValue: { fontSize: 10, color: '#333333' },
      tableLabelBold: { fontSize: 11, bold: true, color: '#1a56db' },
      tableValueBold: { fontSize: 12, bold: true, color: '#16a34a' },
      calculationText: { fontSize: 9, color: '#888888', italics: true },
      note: { fontSize: 11, italic: true, color: '#ff6600', bold: true, alignment: 'center' },
      footer: { fontSize: 10, italic: true, color: '#888888' }
    },
    defaultStyle: { font: 'Roboto' }
  };
  
  pdfMake.createPdf(docDefinition).getBlob((blob) => {
    const file = new File([blob], `Costing_Calculation_${currentDate.replace(/\//g, '-')}.pdf`, { type: 'application/pdf' });
    
    // For mobile with Web Share API
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      navigator.share({
        files: [file],
        title: 'Thermocol Sheet Costing',
        text: `Calculation for ${result.outerDimensions.displayLength} x ${result.outerDimensions.displayBreadth} x ${result.outerDimensions.displayHeight}`
      }).catch((error) => {
        console.log('Share failed:', error);
        // Fallback: download and show message
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Costing_Calculation_${currentDate.replace(/\//g, '-')}.pdf`;
        link.click();
        URL.revokeObjectURL(url);
        alert('PDF downloaded. You can now share it via WhatsApp from your device.');
      });
    } 
    // For desktop or when Web Share API not available
    else {
      // Download the file
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Costing_Calculation_${currentDate.replace(/\//g, '-')}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      
      // Open WhatsApp with a message
      const message = `📊 *Thermocol Sheet Costing Report*%0A%0A` +
        `📏 *Dimensions:* ${result.outerDimensions.displayLength} x ${result.outerDimensions.displayBreadth} x ${result.outerDimensions.displayHeight}%0A` +
        `🔢 *Total Pieces from Block:* ${result.piecesFromBlock.count} pcs%0A` +
        `💰 *Price per Piece:* ₹${result.pricePerPiece} (₹${result.costPerBlock} / ${result.piecesFromBlock.count} pcs)%0A` +
        `🚚 *Pieces per Tempo:* ${result.piecesInTempo} pcs%0A` +
        `🚛 *Pieces per Truck:* ${result.piecesInTruck} pcs%0A%0A` +
        `⚠️ *Note:* GST 18% and Freight is Extra%0A%0A` +
        `📎 *PDF attached for detailed report*`;
      
      window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
      toast.success('PDF downloaded! WhatsApp opened with calculation summary.');
    }
    
    setSharing(false);
  });
};

  if (!activeCalculator) {
    return (
      <>
        <InternalNavbar />
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-12 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
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
                <h2 className="text-xl font-bold text-gray-800 mb-2">EPS/Thermocol Sheet Costing Calculator</h2>
                <p className="text-gray-500 text-sm">Calculate costing for thermocol sheets based on dimensions, density, and more</p>
              </button>
                {/* New Calculator Button */}
  <button
    onClick={() => setActiveCalculator("pipeSection")}
    className="bg-white rounded-2xl shadow-xl p-8 text-center hover:shadow-2xl transition-all duration-200 border-2 border-transparent hover:border-purple-500"
  >
    <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
      <Package size={40} className="text-purple-600" />
    </div>
    <h2 className="text-xl font-bold text-gray-800 mb-2">EPS/Thermocol Tongue & Groove Pipe-section Calculator</h2>
    <p className="text-gray-500 text-sm">Calculate pipe section meters based on pipe size and thermocol thickness</p>
  </button>
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

    if (activeCalculator === "thermocol") {
    return (
      <>
        <InternalNavbar />
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-6 px-4">
          <div className="max-w-full mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => setActiveCalculator(null)}
                className="text-blue-600 hover:text-blue-800 flex items-center gap-2"
              >
                ← Back to Calculators
              </button>
              <h1 className="text-2xl font-bold text-gray-800">EPS/Thermocol Sheet Costing Calculator</h1>
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
                  {/* Dimension inputs - same as before */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Length of EPS/Thermocol Sheet</label>
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
                      <div className="flex items-center justify-center flex-col">
                        <p className="text-xs">Check Unit</p>
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
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Breadth/Width of EPS/Thermocol Sheet</label>
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
                      <div className="flex items-center justify-center flex-col">
                        <p className="text-xs">Check Unit</p>
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
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Height/Thickness of EPS/Thermocol Sheet</label>
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
                      <div className="flex items-center justify-center flex-col">
                        <p className="text-xs">Check Unit</p>
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
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Required Density (kg/m³)</label>
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
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      RM Rate (₹/kg)
                      <span className="text-xs text-gray-500 ml-1">(Current: ₹{rmRate.toFixed(2)}/kg)</span>
                      <span className="text-xs text-gray-500 ml-1">(Can edit if needed)</span>
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
    <label className="block text-xs font-medium text-gray-700 mb-1">Conversion Rate (₹/kg)</label>
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
                <div className="bg-gradient-to-r from-green-600 to-teal-600 px-6 py-4 flex justify-between items-center">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    Calculation Results
                  </h2>
                  <button
                    onClick={handleSharePDF}
                    disabled={sharing}
                    className="flex items-center gap-2 bg-white text-green-700 hover:bg-gray-100 font-semibold py-2 px-4 rounded-lg transition-all duration-200 disabled:opacity-50"
                  >
                    <Share2 size={18} />
                    {sharing ? "Sharing..." : "Share PDF"}
                  </button>
                </div>
                
                <div className="p-6 space-y-4">
                  {/* Outer Dimensions */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-800 mb-2">📏 Outer Dimensions of Thermocol Sheet</h3>
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
                      <h3 className="font-semibold text-gray-800 mb-2">💰 Costing Details (Raw Block size: 6100x1220x620 mm)</h3>
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
                        <p><span className="font-bold text-green-600">Total Pieces from Block:</span> {result.piecesFromBlock.count} pcs</p>
<div className="bg-gradient-to-br from-white to-purple-50/30 rounded-lg shadow-sm border border-purple-100 overflow-hidden">
  {/* Header Section */}
  <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-3 py-2">
    <p className="text-white text-sm">
      <span className="font-semibold">Final Price per Piece:</span>
      <span className="text-lg font-bold ml-1">₹{result.pricePerPiece}</span>
    </p>
  </div>
  
  {/* Calculation Section */}
  <div className="p-3">
    <div className="flex items-start gap-2">
      <div className="flex-shrink-0 w-6 h-6 bg-purple-100 rounded-md flex items-center justify-center">
        <svg className="w-3 h-3 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-6 3H7.5A2.5 2.5 0 015 14.5v-5A2.5 2.5 0 017.5 7H9m6 0h1.5a2.5 2.5 0 012.5 2.5v5a2.5 2.5 0 01-2.5 2.5H15M9 7h6"></path>
        </svg>
      </div>
      <div className="flex-1">
        <h4 className="text-xs font-semibold text-purple-700 uppercase tracking-wide">Calculation</h4>
        <p className="text-gray-500 text-xs">Cost per Block ÷ Total Pieces</p>
      </div>
    </div>

    {/* Formula Display */}
    <div className="mt-3 bg-purple-50 rounded-md p-2 border border-purple-200">
      <div className="flex items-center justify-center gap-2 flex-wrap text-sm">
        <div className="text-center">
          <div className="text-base font-bold text-purple-700">₹{result.costPerBlock}</div>
          <div className="text-[10px] text-gray-500">Cost per Block</div>
        </div>
        
        <div className="text-base font-bold text-purple-400">÷</div>
        
        <div className="text-center">
          <div className="text-base font-bold text-purple-700">{result.piecesFromBlock.count}</div>
          <div className="text-[10px] text-gray-500">Pieces</div>
        </div>
        
        <div className="text-base font-bold text-purple-400">=</div>
        
        <div className="text-center bg-purple-700 px-2 py-1 rounded-md">
          <div className="text-sm font-bold text-white">₹{(result.costPerBlock / result.piecesFromBlock.count).toFixed(2)}</div>
          <div className="text-[9px] text-purple-200">per piece</div>
        </div>
      </div>
    </div>
  </div>
</div>                        
<p className="bg-yellow-200 p-2 rounded mt-2"><span className="font-black">Note:</span> GST 18% and Freight is Extra</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Transport Details */}
                  <div>
                    <span className="bg-yellow-200 text-sm font-bold p-2 rounded">Material Loading Estimate in Tempo/Truck</span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                          <Truck size={18} /> Tempo (12m³)
                        </h3>
                        <p className="text-sm">Outer Dimension per piece: {result.outerDimensionM3} m³</p>
                        <p className="text-lg font-bold text-blue-700">Approximate Pieces per Tempo: {result.piecesInTempo} pcs</p>
                      </div>
                      
                      <div className="bg-orange-50 rounded-lg p-4">
                        <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                          <Truck size={18} /> Truck (40m³)
                        </h3>
                        <p className="text-sm">Outer Dimension per piece: {result.outerDimensionM3} m³</p>
                        <p className="text-lg font-bold text-orange-700">Approximate Pieces per Truck: {result.piecesInTruck} pcs</p>
                      </div>
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

  if (activeCalculator === "pipeSection") {
    return (
      <>
        <InternalNavbar />
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-6 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => setActiveCalculator(null)}
                className="text-blue-600 hover:text-blue-800 flex items-center gap-2"
              >
                ← Back to Calculators
              </button>
              <h1 className="text-2xl font-bold text-gray-800">EPS/Thermocol Tongue & Groove Pipe-section Calculator</h1>
              <div className="w-20"></div>
            </div>
            
            <PipeSectionCalculator onBack={() => setActiveCalculator(null)} />
          </div>
        </div>
      </>
    );
  }

  return null;
}