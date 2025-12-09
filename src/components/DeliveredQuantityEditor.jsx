import React, { useState, useRef } from 'react';
import Swal from "sweetalert2";
import axiosInstance from "../../axiosInstance";

const DeliveredQuantityEditor = ({ order, token, onUpdate }) => {
  const [deliveredQty, setDeliveredQty] = useState(order.deliveredQuantity || 0);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [originalQty, setOriginalQty] = useState(order.deliveredQuantity || 0);
  
  const containerRef = useRef(null);
  const cancelButtonRef = useRef(null);
  const saveButtonRef = useRef(null);
  const closeButtonRef = useRef(null);

  const handleUpdate = async () => {
    if (deliveredQty < 0 || deliveredQty > order.quantity) {
      Swal.fire({
        icon: "error",
        title: "Invalid Quantity",
        text: `Delivered quantity must be between 0 and ${order.quantity}`,
      });
      return;
    }

    // Don't save if value hasn't changed
    if (deliveredQty === originalQty) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    
    try {
      await axiosInstance.put(
        `/orders/${order._id}`,
        { deliveredQuantity: deliveredQty },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setOriginalQty(deliveredQty); // Update original value after successful save
      
      Swal.fire({
        icon: "success",
        title: "Updated!",
        text: `Delivered quantity updated to ${deliveredQty}`,
        timer: 1500
      }).then(() => {
        setIsEditing(false);
        // ✅ Only call onUpdate AFTER user closes the success message
        onUpdate && onUpdate();
      });
      
    } catch (err) {
      console.error("Error updating delivered quantity:", err);
      Swal.fire({
        icon: "error",
        title: "Update Failed",
        text: err.response?.data?.message || "Failed to update delivered quantity",
      }).then(() => {
        // Revert to original value on error
        setDeliveredQty(originalQty);
        setIsEditing(false);
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset to original value
    setDeliveredQty(originalQty);
    setIsEditing(false);
    // ⚠️ DO NOT call onUpdate() here!
  };

  const handleStartEditing = () => {
    // Store current value as original when starting to edit
    setOriginalQty(order.deliveredQuantity || 0);
    setDeliveredQty(order.deliveredQuantity || 0);
    setIsEditing(true);
  };

  // Handle blur (clicking outside) - ask to save or cancel
  const handleBlur = (e) => {
    // Don't trigger if blur is caused by clicking Cancel, Save, or Close buttons
    const relatedTarget = e.relatedTarget;
    const isClickingCancelButton = 
      relatedTarget === cancelButtonRef.current ||
      relatedTarget?.closest('button[class*="bg-red-"]');
    
    const isClickingSaveButton = 
      relatedTarget === saveButtonRef.current ||
      relatedTarget?.closest('button[class*="bg-green-"]');
    
    const isClickingCloseButton = 
      relatedTarget === closeButtonRef.current;

    // If clicking on any control button, don't show save dialog
    if (isClickingCancelButton || isClickingSaveButton || isClickingCloseButton) {
      return;
    }

    // Check if click was outside the editor
    if (!containerRef.current?.contains(relatedTarget) && deliveredQty !== originalQty) {
      Swal.fire({
        title: "Unsaved Changes",
        text: `You changed the value from ${originalQty} to ${deliveredQty}. Save changes?`,
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Save",
        cancelButtonText: "Discard",
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
      }).then((result) => {
        if (result.isConfirmed) {
          handleUpdate();
        } else {
          handleCancel();
        }
      });
    }
  };

  // Add event listener for Escape key globally
  React.useEffect(() => {
    const handleEscapeKey = (e) => {
      if (e.key === 'Escape' && isEditing) {
        handleCancel();
      }
    };

    if (isEditing) {
      document.addEventListener('keydown', handleEscapeKey);
      return () => {
        document.removeEventListener('keydown', handleEscapeKey);
      };
    }
  }, [isEditing, deliveredQty, originalQty]);

  if (!isEditing) {
    return (
      <div 
        className="cursor-pointer hover:bg-gray-100 p-1 rounded transition-all duration-200 group relative"
        onClick={handleStartEditing}
        title="Click to edit delivered quantity"
      >
        {/* ... rest of non-editing JSX remains the same ... */}
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-pulse group-hover:animate-none"></div>
        
        <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <span className="text-yellow-600 text-xs font-bold">✏️</span>
        </div>
        
        <span className={`
          relative px-2 py-1 rounded transition-all duration-200
          ${order.deliveredQuantity > 0 
            ? "font-bold text-blue-700 bg-blue-50 border border-blue-200" 
            : "text-gray-700 bg-gray-50 border border-gray-200"
          }
          group-hover:bg-yellow-50 group-hover:border-yellow-300 group-hover:shadow-sm
        `}>
          {order.deliveredQuantity || 0}
        </span>
        
        <span className="text-xs text-gray-500 block mt-1">
          / {order.quantity}
        </span>
        
        <div className="absolute left-0 -bottom-6 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap z-10">
          Click to edit
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="flex flex-col gap-2 p-2 bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-400 rounded-lg shadow-lg animate-pulse-once relative"
      onBlur={handleBlur}
      tabIndex={-1}
    >
      {/* CLOSE BUTTON IN TOP RIGHT */}
      <button
        ref={closeButtonRef}
        onClick={handleCancel}
        className="absolute top-1 right-1 w-6 h-6 flex items-center justify-center bg-red-100 hover:bg-red-200 text-red-600 rounded-full text-xs z-10"
        title="Close without saving"
      >
        ×
      </button>
      
      {/* 🟡 EDIT MODE INDICATOR */}
      <div className="flex items-center justify-between mb-1 pr-6">
        <span className="text-xs font-bold text-yellow-700 flex items-center gap-1">
          <span className="animate-pulse">🟡</span> 
          EDITING DELIVERED QTY
        </span>
        <span className="text-xs text-gray-500">
          Order: {order.shortId}
        </span>
      </div>
      
      {/* ✏️ EDIT CONTROLS */}
      <div className="flex items-center gap-2">
        <input
          type="number"
          min="0"
          max={order.quantity}
          value={deliveredQty}
          onChange={(e) => setDeliveredQty(parseInt(e.target.value) || 0)}
          className="w-24 px-3 py-2 border-2 border-yellow-500 rounded-lg text-center font-bold text-gray-800 bg-white shadow-inner focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleUpdate();
            if (e.key === 'Escape') handleCancel();
          }}
          disabled={isSaving}
        />
        
        <div className="flex flex-col gap-1">
          <button
            ref={saveButtonRef}
            onClick={handleUpdate}
            disabled={isSaving || deliveredQty === originalQty}
            className={`
              px-3 py-2 text-white text-xs font-bold rounded-lg transition-all duration-200 flex items-center justify-center gap-1
              ${isSaving 
                ? "bg-gray-400 cursor-not-allowed" 
                : deliveredQty === originalQty
                ? "bg-gray-300 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700 shadow-md hover:shadow-lg"
              }
            `}
          >
            {isSaving ? (
              <>
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Saving...
              </>
            ) : (
              <>
                ✓ Save
              </>
            )}
          </button>
          
          <button
            ref={cancelButtonRef}
            onClick={handleCancel}
            disabled={isSaving}
            className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
          >
            ✗ Cancel
          </button>
        </div>
      </div>
      
      {/* 📊 VISUAL GUIDE */}
      <div className="grid grid-cols-3 gap-2 mt-2">
        <div className="text-center p-1 bg-blue-50 rounded border border-blue-200">
          <div className="text-xs text-gray-500">Order Qty</div>
          <div className="font-bold text-blue-700">{order.quantity}</div>
        </div>
        
        <div className="text-center p-1 bg-yellow-50 rounded border border-yellow-300">
          <div className="text-xs text-gray-500">
            Entering {deliveredQty !== originalQty && (
              <span className={`
                ml-1 px-1 py-0.5 rounded text-xs
                ${deliveredQty > originalQty 
                  ? "bg-green-100 text-green-800" 
                  : "bg-red-100 text-red-800"
                }
              `}>
                {deliveredQty > originalQty ? '+' : ''}{deliveredQty - originalQty}
              </span>
            )}
          </div>
          <div className="font-bold text-yellow-700">{deliveredQty}</div>
        </div>
        
        <div className="text-center p-1 bg-green-50 rounded border border-green-200">
          <div className="text-xs text-gray-500">Will Remain</div>
          <div className="font-bold text-green-700">
            {Math.max(order.quantity - deliveredQty, 0)}
          </div>
        </div>
      </div>
      
      {/* ⚠️ UNSAVED CHANGES WARNING */}
      {deliveredQty !== originalQty && (
        <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded">
          <div className="flex items-center gap-2">
            <span className="text-orange-600">⚠️</span>
            <span className="text-xs text-orange-700 font-medium">
              Unsaved changes: {deliveredQty > originalQty ? '+' : ''}{deliveredQty - originalQty}
              <br />
              <span className="text-orange-600">Click "Save" to keep changes or "Cancel" to discard</span>
            </span>
          </div>
        </div>
      )}
      
      {/* ⌨️ KEYBOARD SHORTCUTS */}
      <div className="mt-2 pt-2 border-t border-yellow-300">
        <div className="text-xs text-gray-600 flex justify-between">
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">Enter</kbd>
            <span>to save</span>
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">Esc</kbd>
            <span>to cancel</span>
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">Click outside</kbd>
            <span>to choose</span>
          </span>
        </div>
      </div>
    </div>
  );
};

// Add this CSS for the one-time pulse animation
const styles = `
  @keyframes pulse-once {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.8; }
  }
  .animate-pulse-once {
    animation: pulse-once 1s ease-in-out;
  }
`;

// Inject the styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}

export default DeliveredQuantityEditor;