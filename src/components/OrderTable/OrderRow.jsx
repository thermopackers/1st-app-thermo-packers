import React, { useState } from 'react';
import OrderCell from './OrderCell';
import SectionSelection from './SectionSelection';
import StatusIndicator from './StatusIndicator';
import POCopySection from './POCopySection';
import SectionActions from './SectionActions';
import OrderActions from './OrderActions';
import Swal from "sweetalert2";  // ✅ Add this import
import axiosInstance from "../../axiosInstance";  // ✅ Add this import

const OrderRow = ({
  order,
  products,
  role,
  customers,
  resolvedPOUrls,
  sectionsList,
  localSections,
  selectedRadioByOrder,
  disabledOrders,
  handleComplete,
  handleCancel,
  handleDelete,
  setEditOrder,
  handleSectionRadioChange,
  setActiveProductImage,
  setSlipType,
  setSelectedOrder,
  setSelectedSections,
  setModalOpen,
  getStockForProduct,
  getCustomerPhone,
  sectionToSlipType,
  swalWithTailwindButtons,
  token,  // ✅ Add this prop (pass it from OrderTable)
  refetchOrders  // ✅ Add this prop (pass it from OrderTable)
}) => {

    // ✅ Use state to control the input value
  const [localDeliveredQuantity, setLocalDeliveredQuantity] = useState(order.deliveredQuantity || 0);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Calculate remaining balance
  const deliveredQuantity = order.deliveredQuantity || 0;
  const remainingBalance = order.remainingBalance || (order.quantity - deliveredQuantity);
  
  // Determine row color
  const getRowClass = () => {
    if (order.status === "cancelled") return "bg-red-50";
    
    if (remainingBalance === 0 && deliveredQuantity > 0) {
      return "bg-green-50 border-l-4 border-l-green-500";
    } else if (remainingBalance > 0 && deliveredQuantity > 0) {
      return "bg-yellow-50 border-l-4 border-l-yellow-500";
    }
    
    return "odd:bg-white even:bg-gray-50";
  };

   // ✅ Save delivered quantity function
  const saveDeliveredQuantity = async () => {
    const newValue = parseInt(localDeliveredQuantity) || 0;
    
    // Validation
    if (newValue < 0 || newValue > order.quantity) {
      Swal.fire({
        icon: "error",
        title: "Invalid Quantity",
        text: `Delivered quantity must be between 0 and ${order.quantity}`,
      });
      setLocalDeliveredQuantity(order.deliveredQuantity || 0);
      setIsEditing(false);
      return;
    }
    
    setIsSaving(true);
    
    try {
      await axiosInstance.put(
        `/orders/${order._id}`,
        { deliveredQuantity: newValue },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      Swal.fire({
        icon: "success",
        title: "Updated!",
        text: `Delivered quantity updated to ${newValue}`,
        timer: 1500
      });
      
      refetchOrders && refetchOrders();
    } catch (err) {
      console.error("Error updating delivered quantity:", err);
      Swal.fire({
        icon: "error",
        title: "Update Failed",
        text: err.response?.data?.message || "Failed to update delivered quantity",
      });
      // Revert to original value on error
      setLocalDeliveredQuantity(order.deliveredQuantity || 0);
    } finally {
      setIsSaving(false);
      setIsEditing(false);
    }
  };

  // ✅ Handle Enter key press
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      saveDeliveredQuantity();
    } else if (e.key === 'Escape') {
      setLocalDeliveredQuantity(order.deliveredQuantity || 0);
      setIsEditing(false);
    }
  };

  // ✅ Handle blur (when user clicks outside)
  const handleBlur = () => {
    if (localDeliveredQuantity !== (order.deliveredQuantity || 0)) {
      saveDeliveredQuantity();
    } else {
      setIsEditing(false);
    }
  };

  return (
    <tr className={`order-row hover:bg-gray-100 ${getRowClass()}`}>  {/* ✅ Added dynamic row class */}
      <OrderCell>
        {new Date(order.createdAt).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })}
      </OrderCell>
      
      <OrderCell>{order.shortId}</OrderCell>
      
      <OrderCell className="whitespace-nowrap">
        {order.employee ? (
          <>
            <div>{order.employee.name}</div>
            <div className="text-xs text-gray-500">{order.employee.email}</div>
          </>
        ) : (
          "N/A"
        )}
      </OrderCell>

      <OrderCell className="whitespace-nowrap">
        {order.customer?.name || order.customerName}
      </OrderCell>

      <OrderCell>
        <OrderActions
          order={order}
          handleComplete={handleComplete}
          handleCancel={handleCancel}
        />
      </OrderCell>

      <OrderCell className="text-blue-600 underline cursor-pointer">
        <button
          onClick={() => {
            const product = products.find((p) => p.name === order.product);
            if (product?.images?.length > 0) {
              setActiveProductImage({
                name: product.name,
                images: product.images,
              });
            } else {
              Swal.fire({
                icon: "info",
                title: "No Image",
                text: "No images available for this product.",
              });
            }
          }}
        >
          {order.product}
        </button>
      </OrderCell>

      <OrderCell>
        {order.narration ? (
          <span>
            <strong>Narration:</strong> {order.narration}
          </span>
        ) : (
          <span>-</span>
        )}
      </OrderCell>

      <OrderCell>
        <strong>Narration Images:</strong>
        <div className="flex gap-2 flex-wrap mt-1">
          {order.narrationImages?.map((img, i) => (
            <img
              key={i}
              src={img}
              alt={`Narration ${i + 1}`}
              className="w-16 h-16 object-cover rounded cursor-pointer"
              onClick={() => window.open(img, "_blank")}
            />
          ))}
        </div>
      </OrderCell>

      <OrderCell>
        <strong>Bill To:</strong>
        <br />
        {order.billTo || "—"}
        <br />
        <span className="text-gray-600">
          📞 {order.customer?.phone || getCustomerPhone(order.customerName)}
        </span>
      </OrderCell>

      <OrderCell>
        <strong>Ship To:</strong>
        <br />
        {order.shipTo || "—"}
        <br />
        <span className="text-gray-600">
          📞 {order.customer?.phone || getCustomerPhone(order.customerName)}
        </span>
      </OrderCell>

      <OrderCell>{order.size ? order.size : "N/A"}</OrderCell>
      
     <OrderCell>{order.quantity}</OrderCell>

   {/* Delivered Quantity (One-Liner) */}
<OrderCell>
  {role.includes("accounts") ? (
    isEditing ? (
      <div className="flex items-center gap-1">
        <input
          type="number"
          min="0"
          max={order.quantity}
          value={localDeliveredQuantity}
          onChange={(e) => setLocalDeliveredQuantity(parseInt(e.target.value) || 0)}
          onKeyDown={(e) => e.key === 'Enter' && saveDeliveredQuantity()}
          className="w-14 px-1 py-0.5 border border-gray-300 rounded text-center text-sm"
          autoFocus
        />
        <button
          onClick={saveDeliveredQuantity}
          className="text-green-600 hover:text-green-800 text-xs"
          title="Save"
        >
          save
        </button>
        <button
          onClick={() => setIsEditing(false)}
          className="text-gray-500 hover:text-gray-700 text-xs"
          title="Cancel"
        >
          cancel
        </button>
      </div>
    ) : (
      <div 
        className="flex items-center gap-1 cursor-pointer hover:text-blue-600"
        onClick={() => setIsEditing(true)}
        title="Click to edit"
      >
        <span className={deliveredQuantity > 0 ? "font-medium text-blue-600" : "text-gray-700"}>
          {deliveredQuantity}
        </span>
        <span className="text-gray-500">/</span>
        <span className="text-gray-600">{order.quantity}</span>
        <span className="text-blue-500 text-xs ml-1">✏️</span>
      </div>
    )
  ) : (
    <div className="flex items-center gap-1">
      <span className={deliveredQuantity > 0 ? "font-medium text-blue-600" : "text-gray-700"}>
        {deliveredQuantity}
      </span>
      <span className="text-gray-500">/</span>
      <span className="text-gray-600">{order.quantity}</span>
    </div>
  )}
</OrderCell>
      
      {/* Remaining Balance */}
      <OrderCell>
        <span className={`
          font-bold px-2 py-1 rounded inline-block min-w-[60px] text-center
          ${remainingBalance > 0 
            ? "bg-yellow-100 text-yellow-800 border border-yellow-300" 
            : "bg-green-100 text-green-800 border border-green-300"
          }
        `}>
{`${remainingBalance} balance`}
        </span>
      </OrderCell>

      {/* Stock */}
      {/* <OrderCell>{getStockForProduct(order.product)}</OrderCell> */}
      
      {/* Remaining to Produce */}
      {/* <OrderCell>
        {Math.max(order.quantity - getStockForProduct(order.product), 0)}
      </OrderCell> */}
      
     
      
   
      
      {/* Continue with other cells */}
      <OrderCell>₹{order.price}</OrderCell>
      <OrderCell>{order.density}kg/m<sup>3</sup></OrderCell>
      <OrderCell>₹{order.packagingCharge}</OrderCell>
      <OrderCell>{order.po}</OrderCell>
      <OrderCell>{`${order.freight}: ₹${order.freightAmount}`}</OrderCell>
      <OrderCell>{order.paymentTerms || "—"}</OrderCell>

      <OrderCell>
        {(() => {
          if (!order.date) return "N/A";
          const today = new Date();
          const deliveryDate = new Date(order.date);
          today.setHours(0, 0, 0, 0);
          deliveryDate.setHours(0, 0, 0, 0);
          const diffDays = Math.ceil((deliveryDate - today) / (1000 * 60 * 60 * 24));
          
          if (diffDays <= 7) return "Within 1 Week";
          if (diffDays <= 14) return "Within 2 Weeks";
          if (diffDays <= 20) return "Within 20 Days";
          
          return deliveryDate.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          });
        })()}
      </OrderCell>

      <OrderCell>{order.remarks || "N/A"}</OrderCell>

      <OrderCell>
        <POCopySection 
          order={order}
          resolvedPOUrls={resolvedPOUrls}
        />
      </OrderCell>

      {!role.includes("production") && !role.includes("dispatch") && !role.includes("packaging") && (
        <OrderCell>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <button
              className={`flex items-center gap-1 px-2 py-1 sm:px-4 sm:py-1.5 rounded-lg text-xs sm:text-sm shadow-md transition ${
                order.status === "completed" || order.status === "cancelled"
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-yellow-500 hover:bg-yellow-600 text-white"
              }`}
              onClick={() => order.status !== "completed" && order.status !== "cancelled" && setEditOrder(order)}
              disabled={order.status === "completed" || order.status === "cancelled"}
            >
              ✏️ Edit
            </button>

            <button
              className={`flex items-center gap-1 px-2 py-1 sm:px-4 sm:py-1.5 rounded-lg text-xs sm:text-sm shadow-md transition ${
                order.status === "completed" || order.status === "cancelled"
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-red-500 hover:bg-red-600 text-white"
              }`}
              onClick={() => order.status !== "completed" && order.status !== "cancelled" && handleDelete(order._id)}
              disabled={order.status === "completed" || order.status === "cancelled"}
            >
              🗑️ Delete
            </button>
          </div>
        </OrderCell>
      )}

      {!role.includes("production") && !role.includes("dispatch") && !role.includes("admin") && !role.includes("packaging") && (
        <>
          <OrderCell className="whitespace-nowrap">
            <SectionSelection
              order={order}
              sectionsList={sectionsList}
              localSections={localSections}
              handleSectionRadioChange={handleSectionRadioChange}
            />
          </OrderCell>

          <OrderCell>
            <SectionActions
              order={order}
              getStockForProduct={getStockForProduct}
              sectionToSlipType={sectionToSlipType}
              selectedRadioByOrder={selectedRadioByOrder}
              disabledOrders={disabledOrders}
              sectionsList={sectionsList}
              setSlipType={setSlipType}
              setSelectedOrder={setSelectedOrder}
              setSelectedSections={setSelectedSections}
              setModalOpen={setModalOpen}
              swalWithTailwindButtons={swalWithTailwindButtons}
            />
          </OrderCell>
        </>
      )}

      <OrderCell>
        <StatusIndicator 
          status={order.status}
          dispatchStatus={order.dispatchStatus}
          type="production"
        />
      </OrderCell>

      <OrderCell>
        <StatusIndicator 
          status={order.status}
          packagingStatus={order.packagingStatus}
          dispatchStatus={order.dispatchStatus}
          type="packaging"
        />
      </OrderCell>

      <OrderCell>
        <StatusIndicator 
          status={order.status}
          dispatchStatus={order.dispatchStatus}
          type="dispatch"
        />
      </OrderCell>
    </tr>
  );
};

export default OrderRow;