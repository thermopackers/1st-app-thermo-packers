import React from 'react';

const NavigationButtons = ({ navigate }) => (
  <div className="col-span-1 flex flex-col md:flex-row gap-3 w-full">
    <button
      onClick={() => navigate("/cancelled-orders")}
      className="w-full md:w-auto bg-red-600 cursor-pointer hover:bg-red-700 text-white font-semibold px-4 py-2 rounded-md shadow-lg transition"
    >
      ❌ View Cancelled Orders
    </button>

    <button
      onClick={() => navigate("/completed-orders")}
      className="w-full md:w-auto bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-md shadow-lg transition"
    >
      ✅ View Completed Orders
    </button>
  </div>
);

export default NavigationButtons;