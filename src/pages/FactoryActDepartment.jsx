import { useState } from "react";
import { useNavigate } from "react-router-dom";
import InternalNavbar from "../components/InternalNavbar";
import { motion } from "framer-motion";

export default function FactoryActDepartment() {
  const navigate = useNavigate();

  const sections = [
    {
      name: "Factory Act Certificates",
      path: "/factory-act/certificates",
      icon: "📋",
      color: "from-blue-500 to-blue-600",
      description: "Manage all factory act related certificates, licenses, and documents"
    },
  {
    name: "Air Receiver Tank Certificate",
    path: "/factory-act/air-receiver-certificate",
    icon: "🏭",
    color: "from-blue-500 to-blue-600",
    description: "Manage Air Receiver Tank certificates and compliance documents"
  },
  {
    name: "Manual Chain Pully Block Certificate",
    path: "/factory-act/manual-chain-pully-certificate",
    icon: "⛓️",
    color: "from-purple-500 to-purple-600",
    description: "Manage Manual Chain Pully Block certificates and compliance documents"
  }
  ];

  return (
    <div className="min-h-screen bg-slate-100">
      <InternalNavbar />
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Factory Act Department
          </h1>
          <p className="text-gray-600">
            Manage Factory Act compliance, certificates, and documentation
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sections.map((section, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              whileHover={{ scale: 1.02 }}
              className={`bg-gradient-to-br ${section.color} rounded-2xl shadow-lg overflow-hidden cursor-pointer ${
                section.comingSoon ? 'opacity-70' : ''
              }`}
              onClick={() => {
                if (!section.comingSoon) {
                  navigate(section.path);
                } else {
                  alert("Coming Soon!");
                }
              }}
            >
              <div className="p-6 text-white">
                <div className="text-5xl mb-4">{section.icon}</div>
                <h3 className="text-xl font-bold mb-2">{section.name}</h3>
                <p className="text-sm opacity-90">{section.description}</p>
                {section.comingSoon && (
                  <span className="inline-block mt-3 text-xs bg-white/20 px-2 py-1 rounded">
                    Coming Soon
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}