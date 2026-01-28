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
      type: "multi", // Mark as multi-unit
      color: "bg-blue-600 hover:bg-blue-700" 
    },
    { name: "DG Set (Diesel Generator) - Main Electric Panel", path: "/dg-set-log-book", color: "bg-blue-600 hover:bg-blue-700" },
    { name: "Shape Moulding Machine", path: "/maintenance/shape-moulding", color: "bg-blue-600 hover:bg-blue-700" },
    { name: "Boiler", path: "/maintenance/boiler", color: "bg-blue-600 hover:bg-blue-700" },
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
            
            // Check if other sections are enabled
            const isEnabled = s.name === "Air Compressors" || 
                             s.name === "Boiler" || 
                             s.name === "Earthing" ||
                             s.name === "DG Set (Diesel Generator) - Main Electric Panel" ||
                             s.name === "Water Filter" ||
                             s.name === "Fire Safety Check";
            
            // Regular buttons
            return isEnabled ? (
              <NavLink key={idx} to={s.path}>
                <button
                  className={`w-full h-32 rounded-2xl ${s.color} text-white text-xl font-semibold shadow-lg transition`}
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