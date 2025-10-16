// pages/PlantMachineryMaintenance.jsx
import { NavLink } from "react-router-dom";
import InternalNavbar from "../components/InternalNavbar";

export default function PlantMachineryMaintenance() {
  const sections = [
    { name: "Air Compressors", path: "/maintenance/air-compressors", color: "bg-blue-600 hover:bg-blue-700" },
    { name: "Main Electric Panel", path: "/maintenance/main-electric-panel", color: "bg-indigo-600 hover:bg-indigo-700" },
    { name: "Shape Moulding Machine", path: "/maintenance/shape-moulding", color: "bg-emerald-600 hover:bg-emerald-700" },
    { name: "Boiler", path: "/maintenance/boiler", color: "bg-rose-600 hover:bg-rose-700" },
    { name: "Earthing", path: "/maintenance/earthing", color: "bg-yellow-600 hover:bg-yellow-700" },
    { name: "Water Softner", path: "/maintenance/water-softner", color: "bg-purple-600 hover:bg-purple-700" },
    { name: "Water Filter", path: "/maintenance/water-filter", color: "bg-teal-600 hover:bg-teal-700" },
    { name: "Pre-expander", path: "/maintenance/pre-expander", color: "bg-orange-600 hover:bg-orange-700" },
    { name: "Block Moulding Machine", path: "/maintenance/block-moulding", color: "bg-pink-600 hover:bg-pink-700" },
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
const isEnabled = s.name === "Main Electric Panel" || s.name === "Air Compressors" || s.name === "Boiler" || s.name === "Earthing";
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
