// pages/PlantMachineryMaintenance.jsx
import { NavLink } from "react-router-dom";
import InternalNavbar from "../components/InternalNavbar";
import { useEffect, useState } from "react";
import axiosInstance from "../axiosInstance";

export default function PlantMachineryMaintenance() {
 const sections = [
  { name: "Air Compressors", path: "/maintenance/air-compressors", color: "bg-blue-600 hover:bg-blue-700" },
  { 
    name: "Power Factor - Main Electric Panel", 
    type: "multi",
    color: "bg-blue-600 hover:bg-blue-700" 
  },
  { name: "DG Set (Diesel Generator) - Main Electric Panel", path: "/dg-set-log-book", color: "bg-blue-600 hover:bg-blue-700" },
  { name: "Shape Moulding Machine", path: "/maintenance/shape-moulding", color: "bg-blue-600 hover:bg-blue-700" },
  { 
    name: "Water Quality Tests", 
    type: "water-quality-grid", // Updated type
    color: "bg-gradient-to-r from-blue-600 via-green-600 to-purple-600" 
  },
  { name: "Earthing", path: "/maintenance/earthing", color: "bg-blue-600 hover:bg-blue-700" },
  { name: "Water Softner", path: "/maintenance/water-softner", color: "bg-blue-600 hover:bg-blue-700" },
  { name: "Water Filter", path: "/maintenance/water-filter", color: "bg-blue-600 hover:bg-blue-700" },
  { name: "Pre-expander", path: "/maintenance/pre-expander", color: "bg-blue-600 hover:bg-blue-700" },
  { name: "Block Moulding Machine", path: "/maintenance/block-moulding", color: "bg-blue-600 hover:bg-blue-700" },
  { name: "Fire Safety Check", path: "/maintenance/fire-safety", color: "bg-blue-600 hover:bg-blue-700" },
];

  const [unitAverages, setUnitAverages] = useState({
    unit1: 0,
    unit2: 0,
    unit3: 0
  });
  const [loadingAverages, setLoadingAverages] = useState(true);

  // Fetch weekly averages on component mount
  useEffect(() => {
    fetchWeeklyAverages();
  }, []);

  const fetchWeeklyAverages = async () => {
    try {
      setLoadingAverages(true);
      const [unit1Data, unit2Data, unit3Data] = await Promise.all([
        axiosInstance.get("/main-electric-panel/weekly-average"),
        axiosInstance.get("/main-electric-panel-unit2/weekly-average"),
        axiosInstance.get("/main-electric-panel-unit3/weekly-average")
      ]);
      
      setUnitAverages({
        unit1: unit1Data.data.average || 0,
        unit2: unit2Data.data.average || 0,
        unit3: unit3Data.data.average || 0
      });
    } catch (error) {
      console.error("Error fetching weekly averages:", error);
    } finally {
      setLoadingAverages(false);
    }
  };

  const getPowerFactorColor = (value) => {
    if (value >= 0.95) return "text-green-300";
    if (value >= 0.90) return "text-yellow-300";
    return "text-red-300";
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <InternalNavbar />
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-center text-slate-900 mb-8">
          Plant & Machinery Maintenance
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {sections.map((s, idx) => {
            // Handle Power Factor multi-unit button separately
            if (s.type === "multi") {
              return (
                <div key={idx} className="w-full min-h-[12rem] rounded-2xl bg-blue-600 shadow-lg overflow-hidden">
                  <div className="h-1/4 bg-blue-700 flex items-center justify-center text-white font-semibold p-2">
                    Power Factor - Main Electric Panel
                    <button 
                      onClick={fetchWeeklyAverages}
                      className="ml-2 text-xs bg-blue-800 hover:bg-blue-900 px-2 py-1 rounded"
                      title="Refresh averages"
                    >
                      ↻
                    </button>
                  </div>
                  <div className="h-3/4 grid grid-cols-3 gap-1 p-1">
                    {/* Unit 1 */}
                    <NavLink to="/plant-machinery-maintenance-power-factor" className="h-full">
                      <div className="h-full bg-blue-500 hover:bg-blue-600 text-white flex flex-col items-center justify-center rounded-lg transition p-2">
                        <div className="font-medium text-lg">Unit 1</div>
                        <div className="text-xs text-blue-100 mt-0.5">PSPCL Account No: 3002811256</div>
                        <div className="text-sm mt-2">Weekly Avg:</div>
                        <div className={`text-lg font-bold ${getPowerFactorColor(unitAverages.unit1)}`}>
                          {loadingAverages ? "..." : unitAverages.unit1.toFixed(3)}
                        </div>
                      </div>
                    </NavLink>
                    
                    {/* Unit 2 */}
                    <NavLink to="/plant-machinery-maintenance-power-factor-unit2" className="h-full">
                      <div className="h-full bg-blue-500 hover:bg-blue-600 text-white flex flex-col items-center justify-center rounded-lg transition p-2">
                        <div className="font-medium text-lg">Unit 2</div>
                        <div className="text-xs text-blue-100 mt-0.5">PSPCL Account No: 3002901879</div>
                        <div className="text-sm mt-2">Weekly Avg:</div>
                        <div className={`text-lg font-bold ${getPowerFactorColor(unitAverages.unit2)}`}>
                          {loadingAverages ? "..." : unitAverages.unit2.toFixed(3)}
                        </div>
                      </div>
                    </NavLink>
                    
                    {/* Unit 3 */}
                    <NavLink to="/plant-machinery-maintenance-power-factor-unit3" className="h-full">
                      <div className="h-full bg-blue-500 hover:bg-blue-600 text-white flex flex-col items-center justify-center rounded-lg transition p-2">
                        <div className="font-medium text-lg">Unit 3</div>
                        <div className="text-xs text-blue-100 mt-0.5">PSPCL Account No: 3009129953</div>
                        <div className="text-sm mt-2">Weekly Avg:</div>
                        <div className={`text-lg font-bold ${getPowerFactorColor(unitAverages.unit3)}`}>
                          {loadingAverages ? "..." : unitAverages.unit3.toFixed(3)}
                        </div>
                      </div>
                    </NavLink>
                  </div>
                </div>
              );
            }
            
        // Handle Boiler, TDS, PH & Hardness in 2×2 Grid
if (s.type === "water-quality-grid") {
  return (
    <div key={idx} className="w-full h-80 rounded-2xl shadow-lg overflow-hidden border-2 border-white">
      <div className="h-full grid grid-rows-3 grid-cols-2 gap-0">
        {/* Row 3: Alkalinity - Full Width */}
        <NavLink to="/maintenance/alkalinity" className="h-full">
          <div className="h-full bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white flex flex-col items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 relative overflow-hidden group">
            <div className="relative z-10 text-center p-2">
              <div className="text-3xl mb-1 group-hover:scale-110 transition-transform duration-300">⚗️</div>
              <div className="font-bold text-sm mb-0.5">Alkalinity</div>
              <div className="text-xs opacity-90 leading-tight">Daily Check Log Book</div>
            </div>
          </div>
        </NavLink>
        
        {/* Row 1, Col 2: TDS */}
        <NavLink to="/maintenance/tds" className="h-full">
          <div className="h-full bg-gradient-to-br from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white flex flex-col items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 relative overflow-hidden group">
            <div className="relative z-10 text-center p-2">
              <div className="text-3xl mb-1 group-hover:scale-110 transition-transform duration-300">💧</div>
              <div className="font-bold text-sm mb-0.5">TDS</div>
              <div className="text-xs opacity-90 leading-tight">Daily Check Log Book</div>
            </div>
          </div>
        </NavLink>
        
        {/* Row 2, Col 1: PH */}
        <NavLink to="/maintenance/ph" className="h-full">
          <div className="h-full bg-gradient-to-br from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white flex flex-col items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 relative overflow-hidden group">
            <div className="relative z-10 text-center p-2">
              <div className="text-3xl mb-1 group-hover:scale-110 transition-transform duration-300">🧪</div>
              <div className="font-bold text-sm mb-0.5">PH</div>
              <div className="text-xs opacity-90 leading-tight">Daily Check Log Book</div>
            </div>
          </div>
        </NavLink>
        
        {/* Row 2, Col 2: Hardness */}
        <NavLink to="/maintenance/hardness" className="h-full">
          <div className="h-full bg-gradient-to-br from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white flex flex-col items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 relative overflow-hidden group">
            <div className="relative z-10 text-center p-2">
              <div className="text-3xl mb-1 group-hover:scale-110 transition-transform duration-300">💎</div>
              <div className="font-bold text-sm mb-0.5">Hardness</div>
              <div className="text-xs opacity-90 leading-tight">Daily Check Log Book</div>
            </div>
          </div>
        </NavLink>
        
        {/* Row 1, Col 1: Boiler */}
        <NavLink to="/maintenance/boiler" className="h-full col-span-2">
          <div className="h-full bg-gradient-to-r from-pink-600 to-pink-700 hover:from-pink-700 hover:to-pink-800 text-white flex flex-col items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 relative overflow-hidden group">
            <div className="relative z-10 text-center p-4">
              <div className="text-4xl mb-2 group-hover:scale-110 transition-transform duration-300">🔥</div>
              <div className="font-bold text-sm mb-1">Boiler</div>
              <div className="text-xs opacity-90 leading-tight">Monthly Report</div>
            </div>
          </div>
        </NavLink>
          
         
      </div>
    </div>
  );
}
            
            // Check if other sections are enabled
            const isEnabled = s.name === "Air Compressors" || 
                             s.name === "Earthing" ||
                             s.name === "DG Set (Diesel Generator) - Main Electric Panel" ||
                             s.name === "Water Filter" ||
                             s.name === "Fire Safety Check";
            
            // Regular buttons
            return isEnabled ? (
              <NavLink key={idx} to={s.path}>
                <button
                  className={`w-full h-32 rounded-2xl ${s.color} text-white text-xl font-semibold shadow-lg transition hover:scale-105 active:scale-95`}
                >
                  {s.name}
                </button>
              </NavLink>
            ) : (
              <button
                key={idx}
                disabled
                className="w-full h-32 rounded-2xl bg-gray-400 text-white text-xl font-semibold shadow-lg cursor-not-allowed opacity-70"
              >
                {s.name}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}