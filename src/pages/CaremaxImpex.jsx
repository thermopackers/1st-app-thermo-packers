// src/pages/CaremaxImpex.jsx
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import InternalNavbar from "../components/InternalNavbar";

export default function CaremaxImpex() {
  const navigate = useNavigate();

  const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut",
      },
    },
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const buttonHover = {
    hover: {
      scale: 1.05,
      transition: {
        duration: 0.2,
        ease: "easeInOut",
      },
    },
    tap: {
      scale: 0.95,
    },
  };

  return (
    <>
      <InternalNavbar />
      
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header Section */}
          <motion.div
            className="text-center mb-12"
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
          >
            <motion.div
              className="inline-block mb-4"
              whileHover={{ scale: 1.05, rotate: 5 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <span className="text-7xl md:text-8xl">🏢</span>
            </motion.div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-3">
              Caremax Impex
            </h1>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Complete Product & Customer Management Solution
            </p>
          </motion.div>

          {/* Back Button */}
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-md hover:shadow-lg text-gray-700 font-medium transition-all duration-300"
            >
              <span className="text-xl">←</span>
              Back to Dashboard
            </button>
          </motion.div>

          {/* Products Section Title */}
          <motion.h2
            className="text-2xl font-bold text-gray-700 mb-6 border-l-4 border-emerald-500 pl-4"
            variants={fadeInUp}
          >
            📦 Product Management
          </motion.h2>

          {/* Product Management Cards */}
          <motion.div
            className="grid md:grid-cols-2 gap-8 mb-12"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {/* Add Product Card */}
            <motion.div
              variants={fadeInUp}
              className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 border border-gray-100"
            >
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6">
                <div className="text-center">
                  <span className="text-5xl">➕</span>
                  <h2 className="text-2xl font-bold text-white mt-3">Add New Product</h2>
                </div>
              </div>
              <div className="p-8">
                <p className="text-gray-600 text-center mb-6">
                  Create and add new products to your sales catalog.
                </p>
                <motion.button
                  onClick={() => navigate("/caremax-impex/add-product")}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all duration-300"
                  variants={buttonHover}
                  whileHover="hover"
                  whileTap="tap"
                >
                  Add Product →
                </motion.button>
              </div>
            </motion.div>

            {/* Manage Products Card */}
            <motion.div
              variants={fadeInUp}
              className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 border border-gray-100"
            >
              <div className="bg-gradient-to-r from-teal-500 to-cyan-600 p-6">
                <div className="text-center">
                  <span className="text-5xl">✏️</span>
                  <h2 className="text-2xl font-bold text-white mt-3">Manage Products</h2>
                </div>
              </div>
              <div className="p-8">
                <p className="text-gray-600 text-center mb-6">
                  View, edit, update, or delete existing products.
                </p>
                <motion.button
                  onClick={() => navigate("/caremax-impex/all-products")}
                  className="w-full bg-gradient-to-r from-teal-500 to-cyan-600 text-white py-3 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all duration-300"
                  variants={buttonHover}
                  whileHover="hover"
                  whileTap="tap"
                >
                  Manage Products →
                </motion.button>
              </div>
            </motion.div>
          </motion.div>

          {/* Customers Section Title */}
          <motion.h2
            className="text-2xl font-bold text-gray-700 mb-6 border-l-4 border-blue-500 pl-4"
            variants={fadeInUp}
          >
            👥 Customer Management
          </motion.h2>

          {/* Customer Management Cards */}
          <motion.div
            className="grid md:grid-cols-2 gap-8 mb-12"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {/* Add Customer Card */}
            <motion.div
              variants={fadeInUp}
              className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 border border-gray-100"
            >
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6">
                <div className="text-center">
                  <span className="text-5xl">👥</span>
                  <h2 className="text-2xl font-bold text-white mt-3">Add New Customer</h2>
                </div>
              </div>
              <div className="p-8">
               
                <motion.button
                  onClick={() => navigate("/caremax-impex/add-customer")}
                  className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all duration-300"
                  variants={buttonHover}
                  whileHover="hover"
                  whileTap="tap"
                >
                  Add Customer →
                </motion.button>
              </div>
            </motion.div>

            {/* Manage Customers Card */}
            <motion.div
              variants={fadeInUp}
              className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 border border-gray-100"
            >
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6">
                <div className="text-center">
                  <span className="text-5xl">📋</span>
                  <h2 className="text-2xl font-bold text-white mt-3">Manage Customers</h2>
                </div>
              </div>
              <div className="p-8">
                
                <motion.button
                  onClick={() => navigate("/caremax-impex/all-customers")}
                  className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-3 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all duration-300"
                  variants={buttonHover}
                  whileHover="hover"
                  whileTap="tap"
                >
                  Manage Customers →
                </motion.button>
              </div>
            </motion.div>
          </motion.div>

          {/* 👇 ADD THIS NEW SECTION - Quotations Section Title */}
          <motion.h2
            className="text-2xl font-bold text-gray-700 mb-6 border-l-4 border-orange-500 pl-4"
            variants={fadeInUp}
          >
            📄 Quotation Management
          </motion.h2>

          {/* 👇 ADD THIS NEW SECTION - Quotation Management Cards */}
          <motion.div
            className="grid md:grid-cols-2 gap-8 mb-12"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {/* Make New Quotation Card */}
            <motion.div
              variants={fadeInUp}
              className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 border border-gray-100"
            >
              <div className="bg-gradient-to-r from-orange-500 to-red-600 p-6">
                <div className="text-center">
                  <span className="text-5xl">📝</span>
                  <h2 className="text-2xl font-bold text-white mt-3">Make New Quotation</h2>
                </div>
              </div>
              <div className="p-8">
               
                <motion.button
                  onClick={() => navigate("/caremax-impex/add-quotation")}
                  className="w-full bg-gradient-to-r from-orange-500 to-red-600 text-white py-3 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all duration-300"
                  variants={buttonHover}
                  whileHover="hover"
                  whileTap="tap"
                >
                  Create New Quotation →
                </motion.button>
              </div>
            </motion.div>

            {/* Manage Old Quotations Card */}
            <motion.div
              variants={fadeInUp}
              className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 border border-gray-100"
            >
              <div className="bg-gradient-to-r from-amber-500 to-yellow-600 p-6">
                <div className="text-center">
                  <span className="text-5xl">📊</span>
                  <h2 className="text-2xl font-bold text-white mt-3">Manage Old Quotations</h2>
                </div>
              </div>
              <div className="p-8">
               
                <motion.button
                  onClick={() => navigate("/caremax-impex/all-quotations")}
                  className="w-full bg-gradient-to-r from-amber-500 to-yellow-600 text-white py-3 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all duration-300"
                  variants={buttonHover}
                  whileHover="hover"
                  whileTap="tap"
                >
                  Manage Quotations →
                </motion.button>
              </div>
            </motion.div>
          </motion.div>

          {/* Quick Stats or Additional Info */}
          <motion.div
            className="mt-12 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <p className="text-sm text-gray-500">
              🚀 Efficiently manage your products, customers, and quotations with Caremax Impex
            </p>
          </motion.div>
        </div>
      </div>
    </>
  );
}