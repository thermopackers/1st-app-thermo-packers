import React from 'react';

const StatusIndicator = ({ status, dispatchStatus, packagingStatus, type }) => {
  const getStatusConfig = () => {
    switch (type) {
      case "production":
        return {
          color: status?.toLowerCase() === "pending" ? "bg-orange-500" :
                 status?.toLowerCase() === "in process" ? "bg-yellow-500" :
                 status?.toLowerCase() === "processed" ? "bg-green-500" : "bg-green-500",
          text: (dispatchStatus === "dispatched" || dispatchStatus === "ready to dispatch") && status === "pending"
            ? "Direct To Dispatch"
            : status
        };
      
      case "packaging":
        return {
          color: status?.toLowerCase() === "completed" || packagingStatus?.toLowerCase() === "packaged" ? "bg-green-500" :
                 packagingStatus?.toLowerCase() === "unpackaged" ? "bg-orange-500" : "bg-gray-400",
          text: status?.toLowerCase() === "completed" ? "packaged" :
                (dispatchStatus === "dispatched" || dispatchStatus === "ready to dispatch") && packagingStatus === "unpackaged"
                ? "packaged" : packagingStatus
        };
      
      case "dispatch":
        return {
          color: status?.toLowerCase() === "completed" || dispatchStatus?.toLowerCase() === "dispatched" ? "bg-green-500" :
                 dispatchStatus?.toLowerCase() === "ready to dispatch" ? "bg-yellow-500" :
                 dispatchStatus?.toLowerCase() === "not dispatched" ? "bg-orange-500" : "bg-gray-400",
          text: status?.toLowerCase() === "completed" ? "dispatched" : dispatchStatus || "Unknown"
        };
      
      default:
        return { color: "bg-gray-400", text: "Unknown" };
    }
  };

  const { color, text } = getStatusConfig();

  return (
    <div className="flex items-center gap-2">
      <span className={`w-3 h-3 rounded-full ${color}`}></span>
      <span className="capitalize">{text}</span>
    </div>
  );
};

export default StatusIndicator;