import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import InternalNavbar from "../components/InternalNavbar";
import { motion } from "framer-motion";
import axiosInstance from "../axiosInstance";

export default function WeighingScale() {
  const navigate = useNavigate();
  const [scalesData, setScalesData] = useState({});
  const [loading, setLoading] = useState(true);

  const scales = [
    { id: "TPWS1", name: "Weighing Scale 1", defaultLocation: "" },
    { id: "TPWS2", name: "Weighing Scale 2", defaultLocation: "" },
    { id: "TPWS3", name: "Weighing Scale 3", defaultLocation: "" },
    { id: "TPWS4", name: "Weighing Scale 4", defaultLocation: "" },
    { id: "TPWS5", name: "Weighing Scale 5", defaultLocation: "" },
    { id: "TPWS6", name: "Weighing Scale 6", defaultLocation: "" },
    { id: "TPWS7", name: "Weighing Scale 7", defaultLocation: "" },
    { id: "TPWS8", name: "Weighing Scale 8", defaultLocation: "" }
  ];

  useEffect(() => {
    fetchAllScalesData();
  }, []);

  const fetchAllScalesData = async () => {
    setLoading(true);
    const data = {};
    
    for (const scale of scales) {
      try {
        const res = await axiosInstance.get(`/weighing-scale/scale/${scale.id}`);
        if (res.data.success && res.data.scale) {
          data[scale.id] = {
            location: res.data.scale.location || scale.defaultLocation,
            brandName: res.data.scale.brandName || "",
            calibrationValue: res.data.scale.calibrationValue || "",
            brandImage: res.data.scale.brandImage?.url || null
          };
        } else {
          data[scale.id] = {
            location: scale.defaultLocation,
            brandName: "",
            calibrationValue: "",
            brandImage: null
          };
        }
      } catch (err) {
        console.error(`Error fetching data for ${scale.id}:`, err);
        data[scale.id] = {
          location: scale.defaultLocation,
          brandName: "",
          calibrationValue: "",
          brandImage: null
        };
      }
    }
    
    setScalesData(data);
    setLoading(false);
  };

  const getScaleLocation = (scaleId) => {
    return scalesData[scaleId]?.location || scales.find(s => s.id === scaleId)?.defaultLocation || "Location not set";
  };

  const getBrandInfo = (scaleId) => {
    const data = scalesData[scaleId];
    if (data?.brandName) {
      return data.brandName;
    }
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100">
        <InternalNavbar />
        <div className="flex justify-center items-center h-96">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <InternalNavbar />
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Weighing Scale Calibration
          </h1>
          <p className="text-gray-600">
            Select a weighing scale to manage calibration records
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {scales.map((scale, idx) => {
            const location = getScaleLocation(scale.id);
            const brandName = getBrandInfo(scale.id);
            
            return (
              <motion.div
                key={scale.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                whileHover={{ scale: 1.02 }}
                className="bg-white rounded-2xl shadow-lg overflow-hidden cursor-pointer hover:shadow-xl transition-all"
                onClick={() => navigate(`/weighing-scale/${scale.id}`)}
              >
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 text-white">
                  <div className="text-2xl font-bold">{scale.id}</div>
                  <div className="text-sm opacity-90">{scale.name}</div>
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-2 text-gray-600 mb-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-sm font-medium">Location:</span>
                    <span className="text-sm text-gray-700">{location}</span>
                  </div>
                  
                  {brandName && (
                    <div className="flex items-center gap-2 text-gray-600 mb-3">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      <span className="text-sm font-medium">Brand:</span>
                      <span className="text-sm text-gray-700">{brandName}</span>
                    </div>
                  )}
                  
                 <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium transition mt-2">
  Manage Scale
  <span className="block text-xs text-blue-200 mt-1">📅 To Be Done Once in a Month</span>
</button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}