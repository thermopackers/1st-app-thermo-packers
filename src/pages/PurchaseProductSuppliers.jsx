// src/pages/PurchaseProductSuppliers.jsx
import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useUserContext } from "../context/UserContext";
import InternalNavbar from "../components/InternalNavbar";

export default function PurchaseProductSuppliers() {
    const { user } = useUserContext();
    const navigate = useNavigate();
  return (
    <>
    <InternalNavbar />


    {["accounts"].includes(user.role) && (

    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Purchase Product / Suppliers</h1>
      <p>Here you can manage purchased products and suppliers.</p>
 {/* RFQ Section */}
<div className="bg-white rounded-lg shadow-md p-4 mb-6">
  <h3 className="text-xl font-bold text-gray-800 text-center mb-4">
    RFQ (Request for Quotation)
  </h3>
  <div className="grid grid-cols-1 gap-4">
    <button
      onClick={() => navigate("/send-rfq")}
      className="w-full bg-blue-500 hover:bg-blue-600 text-white border border-gray-300 rounded-lg p-6 text-sm sm:text-base text-center cursor-pointer font-semibold"
    >
      📩 Raise New RFQ
    </button>
    <button
      onClick={() => navigate("/view-rfqs")}
      className="w-full bg-green-500 hover:bg-green-600 text-white border border-gray-300 rounded-lg p-6 text-sm sm:text-base text-center cursor-pointer font-semibold"
    >
      📜 View/Edit/Delete/Share OLD RFQ
    </button>
  </div>
</div>

     {["admin", "accounts"].includes(user.role) && (
  <div className="mt-6">
    {/* Purchase - Products / Services */}
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      <h3 className="text-xl font-bold text-gray-800 text-center mb-4">
        PURCHASE - Products / Services
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <NavLink to="/add-purchase-product" className="w-full">
          <button className="w-full bg-indigo-500 hover:bg-indigo-600 text-white border border-gray-300 rounded-lg p-6 text-sm sm:text-base text-center cursor-pointer">
            ➕ Add New Product/Service for Purchase
          </button>
        </NavLink>
        <NavLink to="/all-purchase-products" className="w-full">
          <button className="w-full bg-blue-500 hover:bg-blue-600 text-white border border-gray-300 rounded-lg p-6 text-sm sm:text-base text-center cursor-pointer">
            📦 View/Edit/Delete Products/Services for Purchase
          </button>
        </NavLink>
      </div>
    </div>

    {/* Supplier/Vendor Info */}
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      <h3 className="text-xl font-bold text-gray-800 text-center mb-4">
        SUPPLIER / VENDOR Information
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <NavLink to="/add-supplier" className="w-full">
          <button className="w-full bg-emerald-500 hover:bg-emerald-600 text-white border border-gray-300 rounded-lg p-6 text-sm sm:text-base text-center cursor-pointer">
            ➕ Add New Supplier/Vendor
          </button>
        </NavLink>
        <NavLink to="/all-suppliers" className="w-full">
          <button className="w-full bg-teal-500 hover:bg-teal-600 text-white border border-gray-300 rounded-lg p-6 text-sm sm:text-base text-center cursor-pointer">
            📂 View/Edit/Delete Supplier/Vendor
          </button>
        </NavLink>
      </div>
    </div>

    {/* Purchase Order Section */}
    <div className="bg-white rounded-lg shadow-md p-4">
      <h3 className="text-xl font-bold text-gray-800 text-center mb-4">
        PURCHASE ORDER - To Suppliers/Vendors
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <NavLink to="/create-purchase-order" className="w-full">
          <button className="w-full bg-orange-500 hover:bg-orange-600 text-white border border-gray-300 rounded-lg p-6 text-sm sm:text-base text-center cursor-pointer">
            📝 Make New Purchase Order
          </button>
        </NavLink>
        <NavLink to="/purchase-orders" className="w-full">
          <button className="w-full bg-yellow-500 hover:bg-yellow-600 text-white border border-gray-300 rounded-lg p-6 text-sm sm:text-base text-center cursor-pointer">
            📄 View/Edit Old Purchase Orders
          </button>
        </NavLink>
      </div>
    </div>
  </div>
)}

    </div>
    )}
    </>
  );
}
