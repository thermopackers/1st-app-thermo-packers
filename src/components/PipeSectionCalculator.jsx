import { useState } from "react";
import { Calculator, Truck, Package, DollarSign, Share2 } from "lucide-react";
import toast from "react-hot-toast";
import pdfMake from 'pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';

pdfMake.vfs = pdfFonts.vfs;

// Pipe size data
const pipeData = [
  { size: 0.5, boreMM: 15, odMM: 22 },
  { size: 0.75, boreMM: 20, odMM: 28 },
  { size: 1, boreMM: 25, odMM: 35 },
  { size: 1.25, boreMM: 32, odMM: 43 },
  { size: 1.5, boreMM: 40, odMM: 49 },
  { size: 2, boreMM: 50, odMM: 61 },
  { size: 2.5, boreMM: 65, odMM: 77 },
  { size: 3, boreMM: 80, odMM: 90 },
  { size: 4, boreMM: 100, odMM: 115 },
  { size: 5, boreMM: 125, odMM: 141 },
  { size: 6, boreMM: 150, odMM: 166 },
  { size: 8, boreMM: 200, odMM: 219 },
  { size: 10, boreMM: 250, odMM: 272 },
  { size: 11, boreMM: 300, odMM: 324 },
  { size: 14, boreMM: 350, odMM: 375 },
  { size: 16, boreMM: 400, odMM: 407 }
];

// Function to get pipe bore based on thickness in inches
const getBoreForThickness = (thicknessInches) => {
  // Find the pipe that matches the thickness size
  const matchedPipe = pipeData.find(p => p.size === thicknessInches);
  return matchedPipe ? matchedPipe.boreMM : thicknessInches * 25.4; // Fallback to conversion if not found
};

export default function PipeSectionCalculator({ onBack }) {
  const [pipeSize, setPipeSize] = useState("");
  const [thermocolThickness, setThermocolThickness] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sharing, setSharing] = useState(false);

  const calculateMeters = () => {
    if (!pipeSize || !thermocolThickness) {
      toast.error("Please select pipe size and enter thermocol thickness");
      return;
    }

    setLoading(true);

    try {
      // Find selected pipe
      const selectedPipe = pipeData.find(p => p.size.toString() === pipeSize.toString());
      if (!selectedPipe) {
        toast.error("Invalid pipe size selected");
        setLoading(false);
        return;
      }

      // Get OD of the selected pipe
      const odMM = selectedPipe.odMM;
      
      // Get pipe bore based on thermocol thickness (not pipe size)
      const thicknessInches = parseFloat(thermocolThickness);
      const thicknessBoreMM = getBoreForThickness(thicknessInches);
      
      // Total OD = Pipe OD + (Pipe Bore of Thermocol Thickness × 2)
      const totalOD = odMM + (thicknessBoreMM * 2);
      
      // Calculate pieces
      const pieces1200 = Math.floor(1200 / totalOD);
      const pieces600 = Math.floor(600 / (totalOD / 2));
      
      const totalPieces = pieces1200 * pieces600;
      const totalMeters = totalPieces / 2;
      
      setResult({
        pipeSize: selectedPipe.size,
        pipeBoreMM: selectedPipe.boreMM,
        pipeODMM: selectedPipe.odMM,
        thermocolThicknessInches: thicknessInches,
        thermocolThicknessBoreMM: thicknessBoreMM,
        totalOD: totalOD,
        pieces1200: pieces1200,
        pieces600: pieces600,
        totalPieces: totalPieces,
        totalMeters: totalMeters.toFixed(2)
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
    setPipeSize("");
    setThermocolThickness("");
    setResult(null);
  };

  const handleSharePDF = () => {
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
          text: 'EPS/Thermocol Tongue & Groove Pipe Section Calculator',
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
              [{ text: 'Pipe Size', style: 'tableLabel' }, { text: `${result.pipeSize} inches`, style: 'tableValue' }],
              [{ text: 'Pipe Bore (mm)', style: 'tableLabel' }, { text: `${result.pipeBoreMM} mm`, style: 'tableValue' }],
              [{ text: 'Pipe Outer Diameter (OD)', style: 'tableLabel' }, { text: `${result.pipeODMM} mm`, style: 'tableValue' }],
              [{ text: 'Thermocol Thickness', style: 'tableLabel' }, { text: `${result.thermocolThicknessInches} inches (Bore: ${result.thermocolThicknessBoreMM} mm)`, style: 'tableValue' }],
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
              [{ text: 'Total OD after adding thickness', style: 'tableLabel' }, { text: `${result.totalOD} mm`, style: 'tableValue' }],
              [{ text: 'Pieces in 1200mm', style: 'tableLabel' }, { text: `${result.pieces1200} pcs`, style: 'tableValue' }],
              [{ text: 'Pieces in 600mm', style: 'tableLabel' }, { text: `${result.pieces600} pcs`, style: 'tableValue' }],
              [{ text: 'Total Pieces', style: 'tableLabel' }, { text: `${result.totalPieces} pcs`, style: 'tableValue' }],
              [{ text: 'Total Meters', style: 'tableLabelBold' }, { text: `${result.totalMeters} mtrs`, style: 'tableValueBold' }],
            ]
          },
          layout: 'noBorders',
          margin: [0, 0, 0, 15]
        },
        {
          text: 'CALCULATION FORMULA',
          style: 'sectionHeader',
          margin: [0, 0, 0, 10]
        },
        {
          text: `• Total OD = Pipe OD + (Thermocol Thickness Bore × 2) = ${result.pipeODMM} + (${result.thermocolThicknessBoreMM} × 2) = ${result.totalOD} mm
• Pieces in 1200mm = 1200 ÷ ${result.totalOD} = ${result.pieces1200}
• Pieces in 600mm = 600 ÷ (${result.totalOD} ÷ 2) = ${result.pieces600}
• Total Pieces = ${result.pieces1200} × ${result.pieces600} = ${result.totalPieces}
• Total Meters = Total Pieces ÷ 2 = ${result.totalPieces} ÷ 2 = ${result.totalMeters} mtrs`,
          style: 'formulaText',
          margin: [10, 0, 10, 15]
        },
        {
          text: 'Note: Standard sheet size considered is 1200mm x 600mm',
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
        formulaText: { fontSize: 10, color: '#444444', lineHeight: 1.5 },
        note: { fontSize: 11, italic: true, color: '#ff6600', bold: true, alignment: 'center' },
        footer: { fontSize: 10, italic: true, color: '#888888' }
      },
      defaultStyle: { font: 'Roboto' }
    };

    pdfMake.createPdf(docDefinition).getBlob((blob) => {
      const file = new File([blob], `Pipe_Section_Calculation_${currentDate.replace(/\//g, '-')}.pdf`, { type: 'application/pdf' });
      
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        navigator.share({
          files: [file],
          title: 'Pipe Section Calculation',
          text: `Calculation for ${result.pipeSize} inch pipe with ${result.thermocolThicknessInches} inch thickness`
        }).catch((error) => {
          console.log('Share failed:', error);
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `Pipe_Section_Calculation_${currentDate.replace(/\//g, '-')}.pdf`;
          link.click();
          URL.revokeObjectURL(url);
          alert('PDF downloaded. You can now share it via WhatsApp from your device.');
        });
      } else {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Pipe_Section_Calculation_${currentDate.replace(/\//g, '-')}.pdf`;
        link.click();
        URL.revokeObjectURL(url);
        
        const message = `📊 *EPS/Thermocol Tongue & Groove Pipe Section Report*%0A%0A` +
          `📏 *Pipe Size:* ${result.pipeSize} inches%0A` +
          `📐 *Thermocol Thickness:* ${result.thermocolThicknessInches} inches (Bore: ${result.thermocolThicknessBoreMM} mm)%0A` +
          `📏 *Total Meters:* ${result.totalMeters} mtrs%0A%0A` +
          `📎 *PDF attached for detailed report*`;
        
        window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
        toast.success('PDF downloaded! WhatsApp opened with calculation summary.');
      }
      
      setSharing(false);
    });
  };

  return (
    <div>
      {/* Form Card */}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-6">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Calculator size={24} />
            Enter Pipe Details
          </h2>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pipe Size (inches) *
              </label>
              <select
                value={pipeSize}
                onChange={(e) => setPipeSize(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Pipe Size</option>
                {pipeData.map((pipe) => (
                  <option key={pipe.size} value={pipe.size}>
                    {pipe.size} inch ({pipe.boreMM}mm bore / {pipe.odMM}mm OD)
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Thermocol Thickness (inches) *
              </label>
              <input
                type="number"
                step="0.25"
                min="0"
                value={thermocolThickness}
                onChange={(e) => setThermocolThickness(e.target.value)}
                placeholder="Enter thickness in inches (e.g., 2, 5)"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">Enter thickness in inches (e.g., 2 for 2 inches)</p>
            </div>
          </div>
          
          <div className="flex gap-4">
            <button
              onClick={calculateMeters}
              disabled={loading}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 disabled:opacity-50"
            >
              {loading ? "Calculating..." : "Calculate Meters"}
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
            {/* Input Summary */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-2">📋 Input Summary</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <p><span className="text-gray-600">Pipe Size:</span> {result.pipeSize} inches</p>
                <p><span className="text-gray-600">Pipe Bore:</span> {result.pipeBoreMM} mm</p>
                <p><span className="text-gray-600">Pipe OD:</span> {result.pipeODMM} mm</p>
                <p><span className="text-gray-600">Thermocol Thickness:</span> {result.thermocolThicknessInches} inches (Bore: {result.thermocolThicknessBoreMM} mm)</p>
              </div>
            </div>
            
            {/* Calculation Results */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-2">📐 Calculation Results</h3>
              <div className="space-y-2 text-sm">
                <p><span className="text-gray-600">Total OD after adding thickness:</span> <span className="font-semibold">{result.totalOD} mm</span></p>
                <p className="mt-2 text-blue-600 font-medium">Formula: Pipe OD + (Thermocol Thickness Bore × 2) = {result.pipeODMM} + ({result.thermocolThicknessBoreMM} × 2) = {result.totalOD} mm</p>
                
                <div className="border-t border-gray-200 my-3 pt-3">
                  <p><span className="text-gray-600">Pieces in 1200mm sheet:</span> <span className="font-semibold">{result.pieces1200} pcs</span></p>
                  <p className="text-xs text-gray-500">1200 ÷ {result.totalOD} = {result.pieces1200}</p>
                  
                  <p><span className="text-gray-600">Pieces in 600mm sheet:</span> <span className="font-semibold">{result.pieces600} pcs</span></p>
                  <p className="text-xs text-gray-500">600 ÷ ({result.totalOD} ÷ 2) = {result.pieces600}</p>
                </div>
                
                <div className="border-t border-gray-200 my-3 pt-3">
                  <p><span className="text-gray-600">Total Pieces per sheet:</span> <span className="font-semibold">{result.totalPieces} pcs</span></p>
                  <p className="text-xs text-gray-500">{result.pieces1200} × {result.pieces600} = {result.totalPieces}</p>
                  
                  <p className="text-lg font-bold text-purple-600 mt-2">Total Meters:</p>
                  <p className="text-2xl font-bold text-green-600">{result.totalMeters} mtrs</p>
                  <p className="text-xs text-gray-500">{result.totalPieces} ÷ 2 = {result.totalMeters}</p>
                </div>
              </div>
            </div>
            
            {/* Note */}
            <div className="bg-yellow-50 rounded-lg p-3">
              <p className="text-sm text-yellow-800">
                <span className="font-bold">Note:</span> Standard sheet size considered is 1200mm x 600mm.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}