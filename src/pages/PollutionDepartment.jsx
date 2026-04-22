import { useState } from "react";
import { useNavigate } from "react-router-dom";
import InternalNavbar from "../components/InternalNavbar";
import { motion } from "framer-motion";

export default function PollutionDepartment() {
  const navigate = useNavigate();

  const sections = [
    {
      name: "Air Pollution Certificate",
      path: "/pollution/air-pollution-certificate",
      icon: "🌬️",
      color: "from-blue-500 to-cyan-600",
      description: "Manage Air Pollution Control certificates and compliance documents"
    },
    {
      name: "Water Pollution Certificate",
      path: "/pollution/water-pollution-certificate",
      icon: "💧",
      color: "from-teal-500 to-green-600",
      description: "Manage Water Pollution Control certificates and compliance documents"
    }
  ];

  return (
    <div className="min-h-screen bg-slate-100">
      <InternalNavbar />
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Pollution Department
          </h1>
          <p className="text-gray-600">
            Manage environmental compliance certificates for air and water pollution control
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {sections.map((section, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              whileHover={{ scale: 1.02 }}
              className={`bg-gradient-to-br ${section.color} rounded-2xl shadow-lg overflow-hidden cursor-pointer`}
              onClick={() => navigate(section.path)}
            >
              <div className="p-8 text-white text-center">
                <div className="text-6xl mb-4">{section.icon}</div>
                <h3 className="text-2xl font-bold mb-2">{section.name}</h3>
                <p className="text-sm opacity-90">{section.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}