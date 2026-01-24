// pages/PlantMachineryMaintenance.jsx
import { NavLink } from "react-router-dom";
import InternalNavbar from "../components/InternalNavbar";

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
                <div key={idx} className="w-full h-32 rounded-2xl bg-blue-600 shadow-lg overflow-hidden">
                  <div className="h-1/3 bg-blue-700 flex items-center justify-center text-white font-semibold">
                    Power Factor - Main Electric Panel
                  </div>
                  <div className="h-2/3 grid grid-cols-3 gap-1 p-1">
                    <NavLink to="/plant-machinery-maintenance-power-factor" className="h-full">
                      <div className="h-full bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center rounded-lg transition">
                        Unit 1
                      </div>
                    </NavLink>
                    <NavLink to="/plant-machinery-maintenance-power-factor-unit2" className="h-full">
                      <div className="h-full bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center rounded-lg transition">
                        Unit 2
                      </div>
                    </NavLink>
                    <NavLink to="/plant-machinery-maintenance-power-factor-unit3" className="h-full">
                      <div className="h-full bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center rounded-lg transition">
                        Unit 3
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