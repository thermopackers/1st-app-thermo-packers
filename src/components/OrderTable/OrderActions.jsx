import React from 'react';

const OrderActions = ({ order, handleComplete, handleCancel }) => {
  return (
    <div className="flex flex-col gap-1">
      <button
        onClick={() => handleComplete(order._id)}
        className={`flex items-center gap-1 px-1 py-0.5 sm:px-2 sm:py-1 rounded text-[10px] sm:text-xs shadow-md transition ${
          order.status === "completed" || order.status === "cancelled"
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-green-500 hover:bg-green-600 text-white"
        }`}
        disabled={order.status === "completed" || order.status === "cancelled"}
      >
        Mark Order Complete
      </button>

      <button
        onClick={() => handleCancel(order._id)}
        className={`flex items-center gap-1 px-1 py-0.5 sm:px-2 sm:py-1 rounded text-[10px] sm:text-xs shadow-md transition ${
          order.status === "completed" || order.status === "cancelled"
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-red-500 hover:bg-red-600 text-white"
        }`}
        disabled={order.status === "completed" || order.status === "cancelled"}
      >
        Cancel Order
      </button>
    </div>
  );
};

export default OrderActions;