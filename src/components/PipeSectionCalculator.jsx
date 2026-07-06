import { useState, useEffect } from "react";
import { Calculator, Truck, Package, DollarSign, Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import axiosInstance from "../axiosInstance";
import toast from "react-hot-toast";
import pdfMake from 'pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import React from "react";

pdfMake.vfs = pdfFonts.vfs;

// Pipe size reference data (OD in mm)
const pipeData = {
  0.5: { bore: 15, od: 22 },
  0.75: { bore: 20, od: 28 },
  1: { bore: 25, od: 35 },
  1.25: { bore: 32, od: 43 },
  1.5: { bore: 40, od: 49 },
  2: { bore: 50, od: 61 },
  2.5: { bore: 65, od: 77 },
  3: { bore: 80, od: 90 },
  4: { bore: 100, od: 115 },
  5: { bore: 125, od: 141 },
  6: { bore: 150, od: 166 },
  8: { bore: 200, od: 219 },
  10: { bore: 250, od: 272 },
  11: { bore: 300, od: 324 },
  14: { bore: 350, od: 375 },
  16: { bore: 400, od: 407 }
};

const thicknessOptions = [1, 1.5, 2, 2.5, 3, 4];

// Convert inches to mm using 1 inch = 25mm (simplified)
const inchToMM = (inches) => {
  return parseFloat(inches) * 25;
};

export default function PipeSectionCalculator() {
  const [rmRate, setRmRate] = useState(0);
  const [loading, setLoading] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [expandedRow, setExpandedRow] = useState(null);
  const [showWastage, setShowWastage] = useState(false);
  const [includeWastageInPrice, setIncludeWastageInPrice] = useState(true);
const [globalFormData, setGlobalFormData] = useState({
  density: "16",
  customRmRate: "",
  conversionRate: "120",
  freight: "",
  wastageRate: "40"
});
  const [sizes, setSizes] = useState([
    { id: Date.now(), pipeSize: "3", thickness: "2" }
  ]);
  const [results, setResults] = useState([]);
  const [totalFreight, setTotalFreight] = useState(0);
  const [totalGST, setTotalGST] = useState(0);
  const [grandTotal, setGrandTotal] = useState(0);

  useEffect(() => {
    fetchRMRate();
  }, []);

// Recalculate totals when includeWastageInPrice changes
useEffect(() => {
  if (results.length > 0) {
    const subtotal = results.reduce((sum, r) => sum + (includeWastageInPrice ? parseFloat(r.priceWithWastage) : parseFloat(r.theoreticalPricePerPiece)), 0);
    const totalWithFreight = subtotal + totalFreight;
    const gst = totalWithFreight * 0.18;
    const grandTotalPrice = totalWithFreight + gst;
    
    setTotalGST(gst);
    setGrandTotal(grandTotalPrice);
  }
}, [includeWastageInPrice, results, totalFreight]);

const fetchRMRate = async () => {
  try {
    const res = await axiosInstance.get("/rm-rate");
    setRmRate(res.data.rate || 0);
    setGlobalFormData(prev => ({ 
      ...prev, 
      customRmRate: res.data.rate || 0,
      density: prev.density || "16",
      conversionRate: prev.conversionRate || "120",
      wastageRate: prev.wastageRate || "40"
    }));
  } catch (err) {
    console.error("Error fetching RM rate:", err);
    toast.error("Failed to load RM rate");
  }
};

  const handleGlobalChange = (e) => {
    const { name, value } = e.target;
    setGlobalFormData(prev => ({ ...prev, [name]: value }));
  };

  const addSize = () => {
    setSizes([...sizes, { id: Date.now(), pipeSize: "3", thickness: "2" }]);
  };

  const removeSize = (id) => {
    if (sizes.length === 1) {
      toast.error("At least one size is required");
      return;
    }
    setSizes(sizes.filter(s => s.id !== id));
  };

  const updateSize = (id, field, value) => {
    setSizes(sizes.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  // Calculate OD: Pipe OD + (Thermocol thickness in mm × 2)
  const calculateOD = (pipeSize, thickness) => {
    const pipe = pipeData[parseFloat(pipeSize)];
    if (!pipe) return 0;
    const thicknessMM = inchToMM(thickness);
    return pipe.od + (thicknessMM * 2);
  };

  // Calculate volume of cylinder in m³
  const calculateVolume = (odMM, lengthMM = 1000) => {
    const radiusM = (odMM / 2) / 1000;
    const lengthM = lengthMM / 1000;
    const volume = Math.PI * radiusM * radiusM * lengthM;
    return volume;
  };

  const calculateBestPieces = (odMM, lengthMM = 1000) => {
    const blockL = 6100;
    const blockB = 1220;
    const blockH = 620;
    
    const orientations = [
      { l: blockL, b: blockB, h: blockH, name: "Length along L axis (6100mm)" },
      { l: blockL, b: blockH, h: blockB, name: "Length along L axis, rotated (6100mm)" },
      { l: blockB, b: blockL, h: blockH, name: "Length along B axis (1220mm)" },
      { l: blockB, b: blockH, h: blockL, name: "Length along B axis, rotated (1220mm)" },
      { l: blockH, b: blockL, h: blockB, name: "Length along H axis (620mm)" },
      { l: blockH, b: blockB, h: blockL, name: "Length along H axis, rotated (620mm)" }
    ];
    
    let maxPieces = 0;
    let bestOrientation = null;
    
    orientations.forEach(orient => {
      if (lengthMM <= orient.l) {
        const piecesL = Math.floor(orient.l / lengthMM);
        const piecesB = Math.floor(orient.b / odMM);
        const piecesH = Math.floor(orient.h / odMM);
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
      }
    });
    
    if (maxPieces === 0) {
      const piecesL = Math.floor(blockL / lengthMM);
      const piecesB = Math.floor(blockB / odMM);
      const piecesH = Math.floor(blockH / odMM);
      maxPieces = piecesL * piecesB * piecesH;
      bestOrientation = {
        orientation: "Default (L axis)",
        piecesL,
        piecesB,
        piecesH,
        totalPieces: maxPieces
      };
    }
    
    return { maxPieces, bestOrientation };
  };

  // Calculate wastage analysis with wastage rate
  const calculateWastage = (odMM, piecesFromBlock, volumeM3, density, wastageRatePerKg) => {
    const blockVolume = 4.6;
    const totalPipeVolume = piecesFromBlock * volumeM3;
    const wastageVolume = blockVolume - totalPipeVolume;
    const wastagePercentage = (wastageVolume / blockVolume) * 100;
    
    // Calculate wastage weight and cost
    const wastageWeight = wastageVolume * density;
    const wastageCost = wastageWeight * wastageRatePerKg;
    
    // Calculate linear waste
    const blockL = 6100;
    const blockB = 1220;
    const blockH = 620;
    const pipeLength = 1000;
    
    const wasteL = blockL - (Math.floor(blockL / pipeLength) * pipeLength);
    const wasteB = blockB - (Math.floor(blockB / odMM) * odMM);
    const wasteH = blockH - (Math.floor(blockH / odMM) * odMM);
    
    return {
      totalPipeVolume: totalPipeVolume.toFixed(4),
      wastageVolume: wastageVolume.toFixed(4),
      wastagePercentage: wastagePercentage.toFixed(2),
      wastageWeight: wastageWeight.toFixed(2),
      wastageCost: wastageCost.toFixed(2),
      wasteL,
      wasteB,
      wasteH,
      blockVolume
    };
  };

const handleCalculate = () => {
  if (!globalFormData.density) {
    toast.error("Please enter density");
    return;
  }

  setLoading(true);
  
  try {
    const effectiveRmRate = parseFloat(globalFormData.customRmRate) || rmRate;
    const conversionRate = parseFloat(globalFormData.conversionRate) || 0;
    const totalPerKg = effectiveRmRate + conversionRate;
    const density = parseFloat(globalFormData.density);
    const blockVolume = 4.6;
    const weightPerBlock = density * blockVolume;
    const costPerBlock = weightPerBlock * totalPerKg;
    const freight = parseFloat(globalFormData.freight) || 0;
    const wastageRatePerKg = parseFloat(globalFormData.wastageRate) || 0;

    const calculatedResults = sizes.map(size => {
      const odMM = calculateOD(size.pipeSize, size.thickness);
      const volumeM3 = calculateVolume(odMM);
      const { maxPieces, bestOrientation } = calculateBestPieces(odMM);
      
      const priceWithWastage = maxPieces > 0 ? costPerBlock / maxPieces : 0;
      
      // Calculate wastage with wastage rate
      const wastage = calculateWastage(odMM, maxPieces, volumeM3, density, wastageRatePerKg);
      
      const usableVolumePerPiece = volumeM3;
      const theoreticalPricePerPiece = (usableVolumePerPiece * density * totalPerKg);
      
      // Price without wastage = (Cost per Block - Wastage Cost) / pieces
      const wastageCostTotal = parseFloat(wastage.wastageCost);
      const costPerBlockWithoutWastage = costPerBlock - wastageCostTotal;
      const priceWithoutWastage = maxPieces > 0 ? costPerBlockWithoutWastage / maxPieces : 0;
      const wastageCostPerPiece = maxPieces > 0 ? wastageCostTotal / maxPieces : 0;
      
      const outerDimensionM3 = volumeM3;
      const piecesInTempo = outerDimensionM3 > 0 ? Math.floor(12 / outerDimensionM3) : 0;
      const piecesInTruck = outerDimensionM3 > 0 ? Math.floor(40 / outerDimensionM3) : 0;
      
      const pipe = pipeData[parseFloat(size.pipeSize)];
      const thicknessMM = inchToMM(size.thickness);
      
      return {
        id: size.id,
        pipeSize: size.pipeSize,
        thickness: size.thickness,
        odMM: odMM.toFixed(2),
        pipeOD: pipe?.od || 0,
        thicknessMM: thicknessMM,
        volumeM3: volumeM3.toFixed(6),
        piecesFromBlock: maxPieces,
        orientation: bestOrientation?.orientation || "N/A",
        piecesLayout: bestOrientation ? `${bestOrientation.piecesL} x ${bestOrientation.piecesB} x ${bestOrientation.piecesH}` : "N/A",
        priceWithWastage: priceWithWastage.toFixed(2),
        priceWithoutWastage: priceWithoutWastage.toFixed(2),
        wastageCostPerPiece: wastageCostPerPiece.toFixed(2),
        theoreticalPricePerPiece: theoreticalPricePerPiece.toFixed(2),
        piecesInTempo,
        piecesInTruck,
        wastage,
        calculationSteps: {
          blockVolume: blockVolume,
          weightPerBlock: weightPerBlock.toFixed(2),
          totalPerKg: totalPerKg.toFixed(2),
          costPerBlock: costPerBlock.toFixed(2),
          costPerBlockWithoutWastage: costPerBlockWithoutWastage.toFixed(2),
          effectiveRmRate: effectiveRmRate,
          conversionRate: conversionRate,
          density: density,
          freight: freight,
          wastageRate: wastageRatePerKg
        }
      };
    });
    
    setResults(calculatedResults);
    
    // Calculate totals with freight added once
    const subtotal = calculatedResults.reduce((sum, r) => sum + (includeWastageInPrice ? parseFloat(r.priceWithWastage) : parseFloat(r.theoreticalPricePerPiece)), 0);
    const totalWithFreight = subtotal + freight;
    const gst = totalWithFreight * 0.18;
    const grandTotalPrice = totalWithFreight + gst;
    
    setTotalFreight(freight);
    setTotalGST(gst);
    setGrandTotal(grandTotalPrice);
    
    toast.success(`Calculated ${calculatedResults.length} pipe sizes!`);
  } catch (err) {
    console.error("Calculation error:", err);
    toast.error("Failed to calculate");
  } finally {
    setLoading(false);
  }
};

  const toggleExpand = (id) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

const generatePDF = async () => {
  if (results.length === 0) {
    toast.error("Please calculate first");
    return;
  }
  
  setSharing(true);
  
  const currentDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  
  // Build content array
  const content = [
    { text: 'THERMO PACKERS', style: 'companyName', alignment: 'center', margin: [0, 0, 0, 5] },
    { text: `Date: ${currentDate}`, style: 'date', alignment: 'right', margin: [0, 0, 0, 20] },
    { text: 'EPS/Thermocol Tongue & Groove Pipe Section Costing', style: 'title', alignment: 'center', margin: [0, 0, 0, 20] },
    { text: 'INPUT DETAILS', style: 'sectionHeader', margin: [0, 0, 0, 10] },
    {
      table: {
        widths: ['25%', '25%', '25%', '25%'],
        body: [
          [{ text: `Density: ${globalFormData.density} kg/m³`, style: 'tableValue' },
           { text: `RM Rate: ₹${parseFloat(globalFormData.customRmRate) || rmRate}/kg`, style: 'tableValue' },
           { text: `Conversion: ₹${globalFormData.conversionRate || 0}/kg`, style: 'tableValue' },
           { text: `Wastage Rate: ₹${globalFormData.wastageRate || 0}/kg`, style: 'tableValue' }]
        ]
      },
      layout: 'noBorders'
    }
  ];

  // Add detailed calculations for each pipe size
  results.forEach((r, index) => {
    const displayPrice = includeWastageInPrice ? parseFloat(r.priceWithoutWastage) : parseFloat(r.theoreticalPricePerPiece);
    
    content.push(
      { text: `\n${index + 1}. PIPE SIZE: ${r.pipeSize}" × ${r.thickness}"`, style: 'pipeHeader', margin: [0, 10, 0, 5] }
    );
    
    // Step 1: Outer Diameter Calculation
    content.push(
      { text: '1. Outer Diameter Calculation:', style: 'stepHeader', margin: [0, 5, 0, 2] },
      { text: `   Pipe OD = ${r.pipeOD} mm`, style: 'stepDetail' },
      { text: `   Thickness = ${r.thickness}" × 25 = ${r.thicknessMM} mm`, style: 'stepDetail' },
      { text: `   Final OD = ${r.pipeOD} + (${r.thicknessMM} × 2) = ${r.odMM} mm`, style: 'stepDetail' }
    );

    // Step 2: Volume per Piece
    const radiusM = (parseFloat(r.odMM) / 2 / 1000).toFixed(4);
    content.push(
      { text: '\n2. Volume per Piece:', style: 'stepHeader', margin: [0, 5, 0, 2] },
      { text: `   Radius = ${r.odMM}/2 = ${parseFloat(r.odMM)/2} mm = ${radiusM} m`, style: 'stepDetail' },
      { text: `   Volume = π × r² × h = 3.1416 × ${radiusM}² × 1 = ${r.volumeM3} m³`, style: 'stepDetail' }
    );

    // Step 3: Pieces per Block
    content.push(
      { text: '\n3. Pieces per Block:', style: 'stepHeader', margin: [0, 5, 0, 2] },
      { text: `   Block size: 6100 × 1220 × 620 mm`, style: 'stepDetail' },
      { text: `   Orientation: ${r.orientation}`, style: 'stepDetail' },
      { text: `   Layout: ${r.piecesLayout} = ${r.piecesFromBlock} pieces`, style: 'stepDetail' }
    );

    // Step 4: Cost per Block
    content.push(
      { text: '\n4. Cost per Block:', style: 'stepHeader', margin: [0, 5, 0, 2] },
      { text: `   Block Volume = ${r.calculationSteps.blockVolume} m³`, style: 'stepDetail' },
      { text: `   Weight per Block = Density × Volume = ${r.calculationSteps.density} × ${r.calculationSteps.blockVolume} = ${r.calculationSteps.weightPerBlock} kg`, style: 'stepDetail' },
      { text: `   Total Rate = RM Rate + Conversion = ${r.calculationSteps.effectiveRmRate} + ${r.calculationSteps.conversionRate} = ₹${r.calculationSteps.totalPerKg}/kg`, style: 'stepDetail' },
      { text: `   Cost per Block = Weight × Rate = ${r.calculationSteps.weightPerBlock} × ${r.calculationSteps.totalPerKg} = ₹${r.calculationSteps.costPerBlock}`, style: 'stepDetail' }
    );

    // Step 5: Price per Piece (conditional based on showWastage)
    if (!showWastage) {
      // When checkbox is NOT checked - Show Price without Wastage with calculation
      const netCostPerBlock = parseFloat(r.calculationSteps.costPerBlock);
      const pieces = r.piecesFromBlock;
      const pricePerPiece = (netCostPerBlock / pieces).toFixed(2);
      
      content.push(
        { text: '\n5. Price per Piece:', style: 'stepHeader', margin: [0, 5, 0, 2] },
        { text: `   Cost per Block = ₹${netCostPerBlock.toFixed(2)}`, style: 'stepDetail' },
        { text: `   Price per Piece = ₹${netCostPerBlock.toFixed(2)} ÷ ${pieces} = ₹${pricePerPiece}`, style: 'stepDetailHighlight' }
      );
    } else {
      // When checkbox IS checked - Show wastage details and price with wastage
      const netCostPerBlock = parseFloat(r.calculationSteps.costPerBlock) - parseFloat(r.wastage.wastageCost);
      const pieces = r.piecesFromBlock;
      const pricePerPiece = (netCostPerBlock / pieces).toFixed(2);
      
      content.push(
        { text: '\n5. Block Wastage Analysis:', style: 'stepHeader', margin: [0, 5, 0, 2] },
        { text: `   Block Volume = ${r.wastage.blockVolume} m³`, style: 'stepDetail' },
        { text: `   Total Pipe Volume = ${r.wastage.totalPipeVolume} m³`, style: 'stepDetail' },
        { text: `   Wastage Volume = ${r.wastage.wastageVolume} m³`, style: 'stepDetail' },
        { text: `   Wastage Percentage = ${r.wastage.wastagePercentage}%`, style: 'stepDetailHighlight' },
        { text: `   Wastage Weight = ${r.wastage.wastageWeight} kg`, style: 'stepDetail' },
        { text: `   Wastage Cost = ₹${r.wastage.wastageCost}`, style: 'stepDetail' },
        { text: `   Wastage Cost per Piece = ₹${r.wastageCostPerPiece}`, style: 'stepDetail' },
        { text: `   Cost per Block = ₹${r.calculationSteps.costPerBlock}`, style: 'stepDetail' },
        { text: `   Wastage Cost per Block = ₹${r.wastage.wastageCost}`, style: 'stepDetail' },
        { text: `   Net Cost per Block = ₹${r.calculationSteps.costPerBlock} - ₹${r.wastage.wastageCost} = ₹${netCostPerBlock.toFixed(2)}`, style: 'stepDetail' }
      );
      
      content.push(
        { text: '\n6. Price per Piece:', style: 'stepHeader', margin: [0, 5, 0, 2] },
        { text: `   Price per Piece = ₹${netCostPerBlock.toFixed(2)} ÷ ${pieces} = ₹${pricePerPiece}`, style: 'stepDetailHighlight' }
      );
    }

    // Transport Estimates
    content.push(
      { text: '\nTransport Estimates:', style: 'stepHeader', margin: [0, 5, 0, 2] },
      { text: `   Pieces per Tempo (12m³): ${r.piecesInTempo} | Pieces per Truck (40m³): ${r.piecesInTruck}`, style: 'stepDetail' }
    );

    // Add separator between pipe sizes
    if (index < results.length - 1) {
      content.push({ text: '\n' + '─'.repeat(80), style: 'separator', alignment: 'center' });
    }
  });

  // Calculate totals based on showWastage
  let subtotal;
  if (!showWastage) {
    subtotal = results.reduce((sum, r) => sum + parseFloat(r.priceWithWastage), 0);
  } else {
    subtotal = results.reduce((sum, r) => sum + parseFloat(r.priceWithoutWastage), 0);
  }
  
  const totalWithFreight = subtotal + totalFreight;
  const gst = totalWithFreight * 0.18;
  const grandTotalPrice = totalWithFreight + gst;

  // Add Summary Section
  content.push(
    { text: '\n\nSUMMARY', style: 'sectionHeader', margin: [0, 20, 0, 10] }
  );

  // Add wastage summary if showWastage is true
  if (showWastage) {
    const totalWastageCost = results.reduce((sum, r) => sum + parseFloat(r.wastageCostPerPiece), 0);
    const avgWastagePercentage = results.reduce((sum, r) => sum + parseFloat(r.wastage.wastagePercentage), 0) / results.length;
    const totalWastageWeight = results.reduce((sum, r) => sum + parseFloat(r.wastage.wastageWeight), 0);
    
    content.push(
      { text: 'Wastage Summary:', style: 'summaryHeader', margin: [0, 5, 0, 2] },
      { text: `   Total Wastage Cost: ₹${totalWastageCost.toFixed(2)}`, style: 'stepDetail' },
      { text: `   Average Wastage Percentage: ${avgWastagePercentage.toFixed(2)}%`, style: 'stepDetail' },
      { text: `   Total Wastage Weight: ${totalWastageWeight.toFixed(2)} kg`, style: 'stepDetail' },
      { text: '' }
    );
  }

  // Add financial summary
  content.push(
    { text: `Subtotal: ₹${subtotal.toFixed(2)}`, style: 'subtotal', alignment: 'right', margin: [0, 5, 0, 5] },
    { text: `GST (18%): ₹${gst.toFixed(2)}`, style: 'gst', alignment: 'right', margin: [0, 5, 0, 5] },
    { text: `Grand Total: ₹${grandTotalPrice.toFixed(2)}`, style: 'total', alignment: 'right', margin: [0, 10, 0, 10] },
    { text: 'Thank you for choosing Thermo Packers!', style: 'footer', alignment: 'center', margin: [0, 20, 0, 10] }
  );

  const docDefinition = {
    pageSize: 'A4',
    pageMargins: [20, 40, 20, 40],
    content: content,
    styles: {
      companyName: { fontSize: 20, bold: true, color: '#1a56db' },
      date: { fontSize: 10, color: '#666666' },
      title: { fontSize: 14, bold: true, color: '#333333' },
      sectionHeader: { fontSize: 14, bold: true, color: '#ffffff', fillColor: '#1a56db', margin: [0, 5, 0, 5], padding: [10, 5, 10, 5] },
      pipeHeader: { fontSize: 13, bold: true, color: '#1a56db' },
      stepHeader: { fontSize: 11, bold: true, color: '#333333' },
      stepDetail: { fontSize: 10, color: '#555555', margin: [0, 1, 0, 1] },
      stepDetailHighlight: { fontSize: 10, bold: true, color: '#16a34a', margin: [0, 1, 0, 1] },
      summaryHeader: { fontSize: 12, bold: true, color: '#d97706' },
      separator: { fontSize: 8, color: '#cccccc' },
      tableValue: { fontSize: 9, color: '#333333' },
      subtotal: { fontSize: 12, color: '#555555' },
      freight: { fontSize: 12, color: '#555555' },
      gst: { fontSize: 12, color: '#555555' },
      total: { fontSize: 16, bold: true, color: '#16a34a' },
      footer: { fontSize: 10, italic: true, color: '#888888' }
    }
  };
  
  pdfMake.createPdf(docDefinition).download(`Pipe_Section_Costing_${currentDate.replace(/\//g, '-')}.pdf`);
  toast.success("PDF downloaded!");
  setSharing(false);
};

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-6 px-4">
      <div className="max-w-8xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Package size={24} />
              EPS/Thermocol Tongue & Groove Pipe Section Costing
            </h2>
            <p className="text-white/80 text-sm mt-1">Calculate costing for multiple pipe sizes at once</p>
          </div>
          
          <div className="p-6">
            {/* Global Settings */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-gray-800 mb-3">Common Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Density (kg/m³) *</label>
                  <input
                    type="number"
                    step="any"
                    name="density"
                    value={globalFormData.density}
                    onChange={handleGlobalChange}
                    placeholder="Enter density"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">RM Rate (₹/kg)</label>
                  <input
                    type="number"
                    step="0.01"
                    name="customRmRate"
                    value={globalFormData.customRmRate}
                    onChange={handleGlobalChange}
                    placeholder="RM Rate"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500">Current: ₹{rmRate.toFixed(2)}/kg</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Conversion Rate (₹/kg)</label>
                  <input
                    type="number"
                    step="0.01"
                    name="conversionRate"
                    value={globalFormData.conversionRate}
                    onChange={handleGlobalChange}
                    placeholder="Conversion rate"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
    
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Wastage Rate (₹/kg)</label>
                  <input
                    type="number"
                    step="0.01"
                    name="wastageRate"
                    value={globalFormData.wastageRate}
                    onChange={handleGlobalChange}
                    placeholder="Wastage rate per kg"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500">Enter wastage cost per kg (e.g., 40)</p>
                </div>
              </div>
            </div>
            
            {/* Wastage Options */}
            <div className="mb-4 flex items-center gap-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="showWastage"
                  checked={showWastage}
                  onChange={(e) => setShowWastage(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="showWastage" className="text-sm font-medium text-gray-700">
                  Show Block Wastage Analysis
                </label>
              </div>
              
              {/* <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="includeWastageInPrice"
                  checked={includeWastageInPrice}
                  onChange={(e) => setIncludeWastageInPrice(e.target.checked)}
                  className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                />
                <label htmlFor="includeWastageInPrice" className="text-sm font-medium text-gray-700">
                  Include Wastage Cost in Final Price
                </label>
              </div> */}
            </div>
            
            {/* Pipe Sizes Table */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-gray-800">Pipe Sizes</h3>
                <button
                  onClick={addSize}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                >
                  <Plus size={16} /> Add Size
                </button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-200">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="p-3 border text-left">Pipe Size (inches)</th>
                      <th className="p-3 border text-left">Thermocol Thickness (inches)</th>
                      <th className="p-3 border text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sizes.map((size) => (
                      <tr key={size.id} className="hover:bg-gray-50">
                        <td className="p-3 border">
                         <select
  value={size.pipeSize}
  onChange={(e) => updateSize(size.id, 'pipeSize', e.target.value)}
  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
>
  {Object.keys(pipeData)
    .map(Number)
    .sort((a, b) => a - b)
    .map(pipe => (
      <option key={pipe} value={pipe}>{pipe}" ({pipeData[pipe].bore}mm bore / {pipeData[pipe].od}mm OD)</option>
    ))}
</select>
                        </td>
                        <td className="p-3 border">
                          <div className="flex gap-2">
                            <select
                              value={size.thickness}
                              onChange={(e) => updateSize(size.id, 'thickness', e.target.value)}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              {thicknessOptions.map(th => (
                                <option key={th} value={th}>{th}"</option>
                              ))}
                            </select>
                            <input
                              type="number"
                              step="0.5"
                              placeholder="Custom"
                              className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              onBlur={(e) => {
                                if (e.target.value) {
                                  updateSize(size.id, 'thickness', e.target.value);
                                }
                              }}
                            />
                          </div>
                        </td>
                        <td className="p-3 border text-center">
                          <button
                            onClick={() => removeSize(size.id)}
                            className="text-red-600 hover:text-red-800"
                            title="Remove size"
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Calculate Button */}
            <div className="flex gap-4 mb-6">
              <button
                onClick={handleCalculate}
                disabled={loading}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 disabled:opacity-50"
              >
                {loading ? "Calculating..." : "Calculate All Sizes"}
              </button>
              {results.length > 0 && (
                <button
                  onClick={generatePDF}
                  disabled={sharing}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 disabled:opacity-50"
                >
                  <Package size={18} />
                  {sharing ? "Generating..." : "Download PDF"}
                </button>
              )}
            </div>
            
            {/* Results Table with Expandable Rows */}
            {results.length > 0 && (
              <div className="mt-6">
                <h3 className="font-semibold text-gray-800 mb-3">Calculation Results</h3>
                <div className="space-y-6">
                  {results.map((r) => {
const displayPrice = includeWastageInPrice ? parseFloat(r.priceWithoutWastage) : parseFloat(r.theoreticalPricePerPiece);

                    // Calculate individual order summary for this pipe size
                    const individualSubtotal = displayPrice;
                    const individualTotalWithFreight = individualSubtotal + (totalFreight / results.length);
                    const individualGST = individualTotalWithFreight * 0.18;
                    const individualGrandTotal = individualTotalWithFreight + individualGST;
                    
                    return (
                      <div key={r.id} className="border border-gray-200 rounded-lg overflow-hidden">
                        {/* Expandable Row */}
                        <div className="hover:bg-gray-50 cursor-pointer" onClick={() => toggleExpand(r.id)}>
                          <div className="grid grid-cols-10 gap-2 p-3 text-sm bg-gray-50 border-b">
                            <div className="col-span-1 text-center">
                              {expandedRow === r.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </div>
                            <div className="col-span-1 text-center font-semibold">{r.pipeSize}"</div>
                            <div className="col-span-1 text-center">{r.thickness}"</div>
                            <div className="col-span-1 text-center">{r.odMM}</div>
                            <div className="col-span-1 text-center">{r.volumeM3}</div>
                            <div className="col-span-1 text-center font-bold text-blue-600">{r.piecesFromBlock}</div>
                            <div className="col-span-1 text-center text-xs">{r.piecesLayout}</div>
                            <div className="col-span-1 text-center">₹{displayPrice.toFixed(2)}</div>
                            <div className="col-span-1 text-center">{r.piecesInTempo}</div>
                            <div className="col-span-1 text-center">{r.piecesInTruck}</div>
                          </div>
                        </div>
                        
                        {/* Expanded Details */}
                    {expandedRow === r.id && (
  <div className="bg-gray-50 p-4 border-t">
    <div className="text-sm">
      <h4 className="font-bold mb-2 text-blue-600">📊 Calculation Steps for {r.pipeSize}" Pipe with {r.thickness}" Thickness:</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <p><strong>1. Outer Diameter Calculation:</strong></p>
          <p className="ml-4">Pipe OD = {r.pipeOD} mm</p>
          <p className="ml-4">Thickness = {r.thickness}" × 25 = {r.thicknessMM} mm</p>
          <p className="ml-4">Final OD = {r.pipeOD} + ({r.thicknessMM} × 2) = <strong>{r.odMM} mm</strong></p>
          
          <p className="mt-2"><strong>2. Volume per Piece:</strong></p>
          <p className="ml-4">Radius = {r.odMM}/2 = {r.odMM/2} mm = {(r.odMM/2/1000).toFixed(4)} m</p>
          <p className="ml-4">Volume = π × r² × h = 3.1416 × {(r.odMM/2/1000).toFixed(4)}² × 1 = <strong>{r.volumeM3} m³</strong></p>
          
          <p className="mt-2"><strong>3. Pieces per Block:</strong></p>
          <p className="ml-4">Block size: 6100 × 1220 × 620 mm</p>
          <p className="ml-4">Orientation: {r.orientation}</p>
          <p className="ml-4">Layout: {r.piecesLayout} = <strong>{r.piecesFromBlock} pieces</strong></p>
        </div>
        
        <div className="space-y-1">
          <p><strong>4. Cost per Block:</strong></p>
          <p className="ml-4">Block Volume = {r.calculationSteps.blockVolume} m³</p>
          <p className="ml-4">Weight per Block = Density × Volume = {r.calculationSteps.density} × {r.calculationSteps.blockVolume} = <strong>{r.calculationSteps.weightPerBlock} kg</strong></p>
          <p className="ml-4">Total Rate = RM Rate + Conversion = {r.calculationSteps.effectiveRmRate} + {r.calculationSteps.conversionRate} = <strong>₹{r.calculationSteps.totalPerKg}/kg</strong></p>
          <p className="ml-4">Cost per Block = Weight × Rate = {r.calculationSteps.weightPerBlock} × {r.calculationSteps.totalPerKg} = <strong>₹{r.calculationSteps.costPerBlock}</strong></p>
          
          {!showWastage ? (
            <>
              <p className="mt-2"><strong>5. Price per Piece:</strong></p>
             <div className="bg-gradient-to-br from-white to-purple-50/30 rounded-lg shadow-sm border border-purple-100 overflow-hidden">
  {/* Header Section */}
  <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-3 py-2">
    <p className="text-white text-sm">
      <span className="font-semibold">Final Price per Piece without Wastage:</span>
      <span className="text-lg font-bold ml-1">₹{r.priceWithWastage}</span>
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
        <p className="text-gray-500 text-xs">Net Cost per Block ÷ Total Pieces</p>
      </div>
    </div>

    {/* Formula Display */}
    <div className="mt-3 bg-purple-50 rounded-md p-2 border border-purple-200">
      <div className="flex items-center justify-center gap-2 flex-wrap text-sm">
        <div className="text-center">
          <div className="text-base font-bold text-purple-700">₹{r.calculationSteps.costPerBlock}</div>
          <div className="text-[10px] text-gray-500">Cost per Block</div>
        </div>
        
        <div className="text-base font-bold text-purple-400">÷</div>
        
        <div className="text-center">
          <div className="text-base font-bold text-purple-700">{r.piecesFromBlock}</div>
          <div className="text-[10px] text-gray-500">Pieces</div>
        </div>
        
        <div className="text-base font-bold text-purple-400">=</div>
        
        <div className="text-center bg-purple-700 px-2 py-1 rounded-md">
          <div className="text-sm font-bold text-white">₹{(r.calculationSteps.costPerBlock / r.piecesFromBlock).toFixed(2)}</div>
          <div className="text-[9px] text-purple-200">per piece</div>
        </div>
      </div>
    </div>
  </div>
</div> 
            </>
          ) : (
            <>
                          <div className="mt-2 p-2 bg-red-50 rounded border border-red-200">
            <p className="font-bold text-red-700">5. Block Wastage Analysis:</p>
                <p className="ml-4 text-xs">Block Volume = {r.wastage.blockVolume} m³</p>
                <p className="ml-4 text-xs">Total Pipe Volume = {r.wastage.totalPipeVolume} m³</p>
                <p className="ml-4 text-xs">Wastage Volume = {r.wastage.wastageVolume} m³</p>
                <p className="ml-4 text-xs font-bold">Wastage Percentage = {r.wastage.wastagePercentage}%</p>
                <p className="ml-4 text-xs">Wastage Weight = {r.wastage.wastageWeight} kg</p>
                <p className="ml-4 text-xs">Wastage Cost = ₹{r.wastage.wastageCost}</p>
                           </div>
                 <p className="mt-2"><strong>6. Price per Piece:</strong></p>
                               <p className="ml-4">Wastage Cost per Piece = ₹{r.wastageCostPerPiece}</p>
                   <p className="ml-4">Cost per Block = <strong>₹{r.calculationSteps.costPerBlock}</strong></p>
                <p className="ml-4">Wastage Cost per Block = <strong>₹{r.wastage.wastageCost}</strong></p>
                <p className="ml-4">Net Cost per Block = ₹{r.calculationSteps.costPerBlock} - ₹{r.wastage.wastageCost} = <strong>₹{r.calculationSteps.costPerBlock - r.wastage.wastageCost}</strong></p>
              <div className="bg-gradient-to-br from-white to-purple-50/30 rounded-lg shadow-sm border border-purple-100 overflow-hidden">
  {/* Header Section */}
  <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-3 py-2">
    <p className="text-white text-sm">
      <span className="font-semibold">Final Price per Piece with Wastage:</span>
      <span className="text-lg font-bold ml-1">₹{r.priceWithoutWastage}</span>
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
        <p className="text-gray-500 text-xs">Net Cost per Block ÷ Total Pieces</p>
      </div>
    </div>

    {/* Formula Display */}
    <div className="mt-3 bg-purple-50 rounded-md p-2 border border-purple-200">
      <div className="flex items-center justify-center gap-2 flex-wrap text-sm">
        <div className="text-center">
          <div className="text-base font-bold text-purple-700">₹{r.calculationSteps.costPerBlock - r.wastage.wastageCost}</div>
          <div className="text-[10px] text-gray-500">Cost per Block</div>
        </div>
        
        <div className="text-base font-bold text-purple-400">÷</div>
        
        <div className="text-center">
          <div className="text-base font-bold text-purple-700">{r.piecesFromBlock}</div>
          <div className="text-[10px] text-gray-500">Pieces</div>
        </div>
        
        <div className="text-base font-bold text-purple-400">=</div>
        
        <div className="text-center bg-purple-700 px-2 py-1 rounded-md">
          <div className="text-sm font-bold text-white">₹{((r.calculationSteps.costPerBlock - r.wastage.wastageCost) / r.piecesFromBlock).toFixed(2)}</div>
          <div className="text-[9px] text-purple-200">per piece</div>
        </div>
      </div>
    </div>
  </div>
</div> 
              
            </>
          )}

          {!includeWastageInPrice && !showWastage && (
            <>
              <p className="mt-2"><strong>6. Theoretical Price (without wastage):</strong></p>
              <p className="ml-4">Theoretical Price = ₹{r.theoreticalPricePerPiece}</p>
            </>
          )}
        </div>
      </div>
      
      <div className="mt-3 pt-2 border-t border-gray-200">
        <p className="text-xs text-gray-500"><strong>Transport Estimates:</strong> Pieces per Tempo (12m³): {r.piecesInTempo} | Pieces per Truck (40m³): {r.piecesInTruck}</p>
      </div>
    </div>
  </div>
)}
                        
                       {/* Order Summary for this pipe size */}
<div className="p-4 bg-gray-100 border-t">
  <h4 className="font-semibold text-gray-800 mb-2">Order Summary for {r.pipeSize}" × {r.thickness}" Pipe</h4>
  <div className="space-y-1 text-sm">
    {!showWastage ? (
      <>
        <div className="flex justify-between">
          <span>Price per Piece (wastage not included):</span>
          <span className="font-medium">₹{r.priceWithWastage}</span>
        </div>
      </>
    ) : (
      <>
        <div className="flex justify-between">
          <span>Wastage Cost per Piece:</span>
          <span className="font-medium">₹{r.wastageCostPerPiece}</span>
        </div>
        <div className="flex justify-between">
          <span>Price per Piece (including wastage):</span>
          <span className="font-medium">₹{displayPrice.toFixed(2)}</span>
        </div>
      </>
    )}
  </div>
</div>
                      </div>
                    );
                  })}
                </div>
                
              {/* Overall Summary */}
<div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
  <h4 className="font-semibold text-blue-800 mb-2">Overall Summary (All Sizes Combined)</h4>
  <div className="space-y-1 text-sm">
    {!showWastage ? (
      <>
        <div className="flex justify-between">
          <span>Total Subtotal (without wastage):</span>
          <span className="font-medium">₹{results.reduce((sum, r) => sum + parseFloat(r.priceWithWastage), 0).toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>Total GST:</span>
          <span className="font-medium">₹{(results.reduce((sum, r) => sum + parseFloat(r.priceWithWastage), 0) * 0.18).toFixed(2)}</span>
        </div>
        <div className="border-t border-blue-300 pt-2 mt-2">
          <div className="flex justify-between">
            <span className="font-bold text-lg">Overall Grand Total:</span>
<span className="font-bold text-lg text-green-700">₹{(results.reduce((sum, r) => sum + parseFloat(r.priceWithWastage), 0) + (results.reduce((sum, r) => sum + parseFloat(r.priceWithWastage), 0) * 0.18)).toFixed(2)}</span>
          </div>
        </div>
      </>
    ) : (
      <>
        <div className="flex justify-between">
          <span>Total Wastage Cost:</span>
          <span className="font-medium">₹{results.reduce((sum, r) => sum + parseFloat(r.wastageCostPerPiece), 0).toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>Total Subtotal (including wastage):</span>
          <span className="font-medium">₹{results.reduce((sum, r) => sum + parseFloat(r.priceWithoutWastage), 0).toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>Total GST:</span>
          <span className="font-medium">₹{(results.reduce((sum, r) => sum + parseFloat(r.priceWithoutWastage), 0) * 0.18).toFixed(2)}</span>
        </div>
        <div className="border-t border-blue-300 pt-2 mt-2">
          <div className="flex justify-between">
            <span className="font-bold text-lg">Overall Grand Total:</span>
<span className="font-bold text-lg text-green-700">₹{(results.reduce((sum, r) => sum + parseFloat(r.priceWithoutWastage), 0) + (results.reduce((sum, r) => sum + parseFloat(r.priceWithoutWastage), 0) * 0.18)).toFixed(2)}</span>
          </div>
        </div>
      </>
    )}
  </div>
</div>
                
                <div className="mt-2 space-y-1">
                  <p className="text-xs text-gray-500">
                    Note: 1 inch = 25mm conversion used. GST 18% applied on subtotal + freight. Block size: 6100 x 1220 x 620 mm
                  </p>
                  <p className="text-xs text-blue-500">💡 Click on any row to expand and see detailed calculation steps!</p>
                  {showWastage && (
                    <p className="text-xs text-red-500">⚠️ Wastage analysis is enabled. Check expanded rows for details.</p>
                  )}
                  {!includeWastageInPrice && (
                    <p className="text-xs text-orange-500">ℹ️ Wastage cost is NOT included in final price (theoretical price shown).</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}