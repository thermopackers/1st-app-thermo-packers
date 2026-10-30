import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import "../index.css";
import InternalNavbar from "../components/InternalNavbar";

// Unit conversion factors to meters (for length/width/thickness)
const LENGTH_UNITS = {
  inch: 0.0254,
  ft: 0.3048,
  cm: 0.01,
  mm: 0.001,
  m: 1,
};

// Unit conversion factors to kg (for weight)
const WEIGHT_UNITS = {
  gram: 0.001,
  kg: 1,
};

export default function ThermocolDensityCalculator() {
  const navigate = useNavigate();

  const [length, setLength] = useState("");
  const [width, setWidth] = useState("");
  const [thickness, setThickness] = useState("");
  const [weight, setWeight] = useState("");

  const [lengthUnit, setLengthUnit] = useState("inch");
  const [widthUnit, setWidthUnit] = useState("inch");
  const [thicknessUnit, setThicknessUnit] = useState("inch");
  const [weightUnit, setWeightUnit] = useState("gram");

  const [density, setDensity] = useState(null);

   const calculateDensity = () => {
    const l = parseFloat(length);
    const w = parseFloat(width);
    const t = parseFloat(thickness);
    const wt = parseFloat(weight);

    if (
      isNaN(l) || isNaN(w) || isNaN(t) || isNaN(wt) ||
      l <= 0 || w <= 0 || t <= 0 || wt <= 0
    ) {
      setDensity(null);
      alert("Please enter valid positive values in all fields.");
      return;
    }

    // Step 1: raw input
    const rawLength = l;
    const rawWidth = w;
    const rawThickness = t;
    const rawWeight = wt;

    // Step 2: unit factors
    const lengthFactor = LENGTH_UNITS[lengthUnit];
    const widthFactor = LENGTH_UNITS[widthUnit];
    const thicknessFactor = LENGTH_UNITS[thicknessUnit];
    const weightFactor = WEIGHT_UNITS[weightUnit];

    // Step 3: converted to SI (meters / kg)
    const lengthM = rawLength * lengthFactor;
    const widthM = rawWidth * widthFactor;
    const thicknessM = rawThickness * thicknessFactor;
    const weightKg = rawWeight * weightFactor;

    // Step 4: volume in cubic meters
    const volumeM3 = lengthM * widthM * thicknessM;

    // Step 5: density in kg/m³
    const densityKgM3 = weightKg / volumeM3;

    setDensity({
      // raw
      rawLength,
      rawWidth,
      rawThickness,
      rawWeight,
      lengthUnit,
      widthUnit,
      thicknessUnit,
      weightUnit,
      // factors
      lengthFactor,
      widthFactor,
      thicknessFactor,
      weightFactor,
      // converted
      lengthM,
      widthM,
      thicknessM,
      weightKg,
      // results
      volumeM3,
      densityKgM3,
    });
  };
  const resetAll = () => {
    setLength("");
    setWidth("");
    setThickness("");
    setWeight("");
    setLengthUnit("inch");
    setWidthUnit("inch");
    setThicknessUnit("inch");
    setWeightUnit("gram");
    setDensity(null);
  };

  const renderUnitSelect = (value, onChange) => (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
    >
      {Object.keys(LENGTH_UNITS).map((u) => (
        <option key={u} value={u}>{u}</option>
      ))}
    </select>
  );

  return (
    <>
    <InternalNavbar/>
    <main
      className="min-h-screen py-8"
      style={{
        background:
          "linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(255, 255, 255, 0.4) 40%, rgba(139, 92, 246, 0.08) 100%)",
      }}
    >
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <button
            onClick={() => navigate(-1)}
            className="glass-btn inline-flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 font-medium transition-all duration-300 group"
          >
            <span className="text-xl group-hover:-translate-x-1 transition-transform">←</span>
            Back
          </button>
        </motion.div>

        <motion.div
          className="glass-card p-6 md:p-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-2 flex items-center justify-center gap-3">
            <span className="text-3xl">🧊</span>
            Thermocol Sheet Density Calculator
          </h1>
                 
          {/* How to measure — pictorial instructions */}
          <div className="mb-8 p-4 rounded-2xl bg-blue-50/60 border border-blue-200">
            <p className="text-center text-sm font-bold text-blue-900 mb-1">
              📏 How to measure — step by step
            </p>
            <p className="text-center text-[11px] text-blue-700 mb-4">
              Use a measuring tape for dimensions and a weighing scale for weight
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {/* Length */}
              <div className="bg-white rounded-xl p-3 border border-blue-100 flex flex-col items-center text-center">
                <svg viewBox="0 0 120 80" className="w-full h-16 mb-2">
                  {/* sheet */}
                  <rect x="10" y="25" width="100" height="35" rx="3"
                        fill="#dbeafe" stroke="#3b82f6" strokeWidth="1.5" />
                  {/* length arrow */}
                  <line x1="10" y1="70" x2="110" y2="70" stroke="#ef4444" strokeWidth="1.5" />
                  <polygon points="10,70 18,66 18,74" fill="#ef4444" />
                  <polygon points="110,70 102,66 102,74" fill="#ef4444" />
                  <text x="60" y="15" textAnchor="middle" fontSize="10" fill="#1e40af" fontWeight="bold">Length</text>
                </svg>
                <p className="text-[11px] font-semibold text-gray-800">1) Length</p>
                <p className="text-[10px] text-gray-500 leading-tight">Longer side of the sheet</p>
              </div>

              {/* Width */}
              <div className="bg-white rounded-xl p-3 border border-blue-100 flex flex-col items-center text-center">
                <svg viewBox="0 0 120 80" className="w-full h-16 mb-2">
                  <rect x="25" y="15" width="70" height="50" rx="3"
                        fill="#dbeafe" stroke="#3b82f6" strokeWidth="1.5" />
                  <line x1="15" y1="15" x2="15" y2="65" stroke="#ef4444" strokeWidth="1.5" />
                  <polygon points="15,15 11,23 19,23" fill="#ef4444" />
                  <polygon points="15,65 11,57 19,57" fill="#ef4444" />
                  <text x="60" y="78" textAnchor="middle" fontSize="10" fill="#1e40af" fontWeight="bold">Width</text>
                </svg>
                <p className="text-[11px] font-semibold text-gray-800">2) Width</p>
                <p className="text-[10px] text-gray-500 leading-tight">Shorter side of the sheet</p>
              </div>

              {/* Thickness */}
              <div className="bg-white rounded-xl p-3 border border-blue-100 flex flex-col items-center text-center">
                <svg viewBox="0 0 120 80" className="w-full h-16 mb-2">
                  {/* side view of sheet */}
                  <rect x="20" y="45" width="80" height="18" rx="2"
                        fill="#dbeafe" stroke="#3b82f6" strokeWidth="1.5" />
                  {/* thickness arrow */}
                  <line x1="108" y1="45" x2="108" y2="63" stroke="#ef4444" strokeWidth="1.5" />
                  <polygon points="108,45 104,52 112,52" fill="#ef4444" />
                  <polygon points="108,63 104,56 112,56" fill="#ef4444" />
                  <text x="60" y="25" textAnchor="middle" fontSize="10" fill="#1e40af" fontWeight="bold">Thickness</text>
                  <text x="60" y="75" textAnchor="middle" fontSize="8" fill="#64748b">(side view)</text>
                </svg>
                <p className="text-[11px] font-semibold text-gray-800">3) Thickness</p>
                <p className="text-[10px] text-gray-500 leading-tight">Height of the sheet</p>
              </div>

              {/* Weight */}
              <div className="bg-white rounded-xl p-3 border border-blue-100 flex flex-col items-center text-center">
                <svg viewBox="0 0 120 80" className="w-full h-16 mb-2">
                  {/* weighing scale base */}
                  <rect x="25" y="55" width="70" height="15" rx="3"
                        fill="#e5e7eb" stroke="#6b7280" strokeWidth="1.5" />
                  {/* display */}
                  <rect x="45" y="58" width="30" height="9" rx="1.5" fill="#fff" stroke="#6b7280" strokeWidth="1" />
                  <text x="60" y="65" textAnchor="middle" fontSize="6" fill="#059669" fontWeight="bold">12.5 g</text>
                  {/* sheet on top */}
                  <rect x="35" y="38" width="50" height="15" rx="2"
                        fill="#dbeafe" stroke="#3b82f6" strokeWidth="1.5" />
                  <text x="60" y="20" textAnchor="middle" fontSize="10" fill="#1e40af" fontWeight="bold">Weight</text>
                </svg>
                <p className="text-[11px] font-semibold text-gray-800">4) Weight</p>
                <p className="text-[10px] text-gray-500 leading-tight">Weigh on a digital scale</p>
              </div>
            </div>

            
          </div>

          <div className="space-y-5">
            {/* Length */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                1) Length of Sheet
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={length}
                  onChange={(e) => setLength(e.target.value)}
                  placeholder="Enter length"
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                {renderUnitSelect(lengthUnit, setLengthUnit)}
              </div>
            </div>

            {/* Width */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                2) Width of Sheet
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={width}
                  onChange={(e) => setWidth(e.target.value)}
                  placeholder="Enter width"
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                {renderUnitSelect(widthUnit, setWidthUnit)}
              </div>
            </div>

            {/* Thickness */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                3) Thickness of Sheet
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={thickness}
                  onChange={(e) => setThickness(e.target.value)}
                  placeholder="Enter thickness"
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                {renderUnitSelect(thicknessUnit, setThicknessUnit)}
              </div>
            </div>

            {/* Weight */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                4) Weight of Sheet
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="Enter weight"
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                <select
                  value={weightUnit}
                  onChange={(e) => setWeightUnit(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value="gram">gram</option>
                  <option value="kg">kg</option>
                </select>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 mt-8">
            <motion.button
              onClick={calculateDensity}
              className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-3 rounded-xl font-semibold shadow-lg transition-all"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Calculate Density
            </motion.button>
            <motion.button
              onClick={resetAll}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold transition-all"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Reset
            </motion.button>
          </div>

                {/* Result — full calculation breakdown */}
          {density && density.densityKgM3 !== undefined && (
                        <motion.div
              className="mt-6 p-5 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 space-y-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {/* Final result */}
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">Final Density</p>
                <p className="text-3xl font-bold text-emerald-700">
                  {density.densityKgM3 >= 1
                    ? density.densityKgM3.toFixed(2)
                    : density.densityKgM3.toPrecision(4)}{" "}
                  <span className="text-lg">kg/m³</span>
                </p>
                <p className="text-[11px] text-gray-500 mt-1 font-mono">
                  = weight (kg) ÷ volume (m³)
                </p>
              </div>

              {/* Step 1: Raw input */}
              <div className="pt-3 border-t border-emerald-200">
                <p className="text-xs font-bold text-gray-700 mb-2">
                  Step 1 — Raw input
                </p>
                <div className="text-xs text-gray-700 grid grid-cols-2 gap-y-1 font-mono">
                  <span>Length</span>
                  <span className="text-right">
                    {density.rawLength} {density.lengthUnit}
                  </span>
                  <span>Width</span>
                  <span className="text-right">
                    {density.rawWidth} {density.widthUnit}
                  </span>
                  <span>Thickness</span>
                  <span className="text-right">
                    {density.rawThickness} {density.thicknessUnit}
                  </span>
                  <span>Weight</span>
                  <span className="text-right">
                    {density.rawWeight} {density.weightUnit}
                  </span>
                </div>
              </div>

              {/* Step 2: Unit factors */}
              <div className="pt-3 border-t border-emerald-200">
                <p className="text-xs font-bold text-gray-700 mb-2">
                  Step 2 — Unit conversion factors
                </p>
                <div className="text-xs text-gray-700 grid grid-cols-2 gap-y-1 font-mono">
                  <span>Length → m</span>
                  <span className="text-right">× {density.lengthFactor}</span>
                  <span>Width → m</span>
                  <span className="text-right">× {density.widthFactor}</span>
                  <span>Thickness → m</span>
                  <span className="text-right">× {density.thicknessFactor}</span>
                  <span>Weight → kg</span>
                  <span className="text-right">× {density.weightFactor}</span>
                </div>
              </div>

              {/* Step 3: Converted values */}
              <div className="pt-3 border-t border-emerald-200">
                <p className="text-xs font-bold text-gray-700 mb-2">
                  Step 3 — Converted to SI units
                </p>
                <div className="text-xs text-gray-700 grid grid-cols-2 gap-y-1 font-mono">
                  <span>Length</span>
                  <span className="text-right">
                    {density.rawLength} × {density.lengthFactor} ={" "}
                    {density.lengthM.toFixed(6)} m
                  </span>
                  <span>Width</span>
                  <span className="text-right">
                    {density.rawWidth} × {density.widthFactor} ={" "}
                    {density.widthM.toFixed(6)} m
                  </span>
                  <span>Thickness</span>
                  <span className="text-right">
                    {density.rawThickness} × {density.thicknessFactor} ={" "}
                    {density.thicknessM.toFixed(6)} m
                  </span>
                  <span>Weight</span>
                  <span className="text-right">
                    {density.rawWeight} × {density.weightFactor} ={" "}
                    {density.weightKg.toFixed(6)} kg
                  </span>
                </div>
              </div>

              {/* Step 4: Volume */}
              <div className="pt-3 border-t border-emerald-200">
                <p className="text-xs font-bold text-gray-700 mb-2">
                  Step 4 — Volume
                </p>
                <p className="text-xs text-gray-700 font-mono break-all">
                  Volume = Length × Width × Thickness
                  <br />
                  = {density.lengthM.toFixed(6)} × {density.widthM.toFixed(6)} ×{" "}
                  {density.thicknessM.toFixed(6)}
                  <br />
                  = <span className="font-bold">{density.volumeM3.toFixed(6)} m³</span>
                </p>
              </div>

              {/* Step 5: Density */}
              <div className="pt-3 border-t border-emerald-200">
                <p className="text-xs font-bold text-gray-700 mb-2">
                  Step 5 — Density
                </p>
                <p className="text-xs text-gray-700 font-mono break-all">
                  Density = Weight ÷ Volume
                  <br />
                  = {density.weightKg.toFixed(6)} kg ÷ {density.volumeM3.toFixed(6)} m³
                  <br />
                  ={" "}
                  <span className="font-bold text-emerald-700">
                    {density.densityKgM3 >= 1
                      ? density.densityKgM3.toFixed(2)
                      : density.densityKgM3.toPrecision(4)}{" "}
                    kg/m³
                  </span>
                </p>
              </div>

          
            </motion.div>
          )}
        </motion.div>
      </div>
    </main>
        </>

  );
}