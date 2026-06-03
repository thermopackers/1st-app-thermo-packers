import React, { useState } from 'react';
import OrderCell from './OrderCell';
import SectionSelection from './SectionSelection';
import StatusIndicator from './StatusIndicator';
import POCopySection from './POCopySection';
import SectionActions from './SectionActions';
import OrderActions from './OrderActions';
import Swal from "sweetalert2";
import axiosInstance from "../../axiosInstance";

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
  token,
  refetchOrders
}) => {

  // ✅ Check if order has multiple products
  const hasMultipleProducts = order.products && order.products.length > 0;
  
  // ✅ For multi-product: store delivered quantities per product
  const [perProductDelivered, setPerProductDelivered] = useState(() => {
    if (hasMultipleProducts && order.products) {
      return order.products.map(prod => ({
        productName: prod.productName,
        deliveredQuantity: prod.deliveredQuantity || 0,
        originalQuantity: prod.quantity
      }));
    }
    return [];
  });
  
  const [isEditingProduct, setIsEditingProduct] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const productList = hasMultipleProducts ? order.products : [{ 
    productName: order.product, 
    quantity: order.quantity,
    size: order.size,
    density: order.density,
    price: order.price,
    productRemarks: order.productRemarks,
    deliveredQuantity: order.deliveredQuantity || 0
  }];
  
  // Calculate total quantity and total delivered
  const totalQuantity = hasMultipleProducts 
    ? productList.reduce((sum, p) => sum + (parseInt(p.quantity) || 0), 0)
    : order.quantity;
  
  const totalDelivered = hasMultipleProducts
    ? perProductDelivered.reduce((sum, p) => sum + (parseInt(p.deliveredQuantity) || 0), 0)
    : (order.deliveredQuantity || 0);
  
  const remainingBalance = totalQuantity - totalDelivered;
  
  // Determine row color
  const getRowClass = () => {
    if (order.status === "cancelled") return "bg-red-50";
    
    if (remainingBalance === 0 && totalDelivered > 0) {
      return "bg-green-300 border-l-4 border-l-green-500";
    } else if (remainingBalance > 0 && totalDelivered > 0) {
      return "bg-yellow-300 border-l-4 border-l-yellow-500";
    }
    
    return "odd:bg-white even:bg-gray-50";
  };

// In OrderRow.jsx - saveProductDeliveredQuantity function
const saveProductDeliveredQuantity = async (productIndex, newValue) => {
  const product = productList[productIndex];
  const originalQuantity = parseInt(product.quantity) || 0;
  
  if (newValue < 0 || newValue > originalQuantity) {
    Swal.fire({
      icon: "error",
      title: "Invalid Quantity",
      text: `Delivered quantity must be between 0 and ${originalQuantity} for ${product.productName}`,
    });
    return;
  }
  
  setIsSaving(true);
  
  try {
    // Create the productsDelivered array
    const updatedDelivered = [...perProductDelivered];
    updatedDelivered[productIndex] = {
      productName: product.productName,
      deliveredQuantity: newValue
    };
    
    // Send to backend
    const response = await axiosInstance.put(
      `/orders/${order._id}`,
      { 
        productsDelivered: updatedDelivered.map(p => ({
          productName: p.productName,
          deliveredQuantity: p.deliveredQuantity
        }))
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    // Update local state with response data
    if (response.data.updatedOrder) {
      const updatedOrder = response.data.updatedOrder;
      // Update perProductDelivered from the response
      if (updatedOrder.products) {
        const newPerProductDelivered = updatedOrder.products.map(p => ({
          productName: p.productName,
          deliveredQuantity: p.deliveredQuantity || 0,
          originalQuantity: p.quantity
        }));
        setPerProductDelivered(newPerProductDelivered);
      }
    } else {
      // Fallback: update local state
      setPerProductDelivered(updatedDelivered);
    }
    
    Swal.fire({
      icon: "success",
      title: "Updated!",
      text: `Delivered quantity for ${product.productName} updated to ${newValue}`,
      timer: 1500
    });
    
    // Refresh orders to get latest data
    refetchOrders && refetchOrders();
    
  } catch (err) {
    console.error("Error updating delivered quantity:", err);
    Swal.fire({
      icon: "error",
      title: "Update Failed",
      text: err.response?.data?.message || "Failed to update delivered quantity",
    });
  } finally {
    setIsSaving(false);
    setIsEditingProduct(null);
  }
};

  const handleProductKeyDown = (e, productIndex, newValue) => {
    if (e.key === 'Enter') {
      saveProductDeliveredQuantity(productIndex, newValue);
    } else if (e.key === 'Escape') {
      setIsEditingProduct(null);
    }
  };

  return (
    <tr className={`order-row hover:bg-gray-100 ${getRowClass()}`} data-order-id={order._id}>
      
      {/* Order Date */}
      <OrderCell>
        {new Date(order.createdAt).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })}
      </OrderCell>
      
      {/* Order ID */}
      <OrderCell>{order.shortId}</OrderCell>
      
      {/* Customer Handled By */}
      <OrderCell className="whitespace-nowrap">
        {order.customer?.createdBy ? (
          <>
            <div>{order.customer.createdBy.name}</div>
            <div className="text-[10px] text-gray-500">{order.customer.createdBy.email}</div>
          </>
        ) : order.employee ? (
          <>
            <div>{order.employee.name}</div>
            <div className="text-[5px] text-gray-500">{order.employee.email}</div>
          </>
        ) : (
          "N/A"
        )}
      </OrderCell>

      {/* Order Added By */}
      <OrderCell className="whitespace-nowrap">
        {order.createdBy ? (
          <>
            <div className="font-medium">{order.createdBy.name}</div>
            <div className="text-[10px] text-gray-500">{order.createdBy.email}</div>
            <div className="text-xs text-gray-400 mt-1">
              📅 {new Date(order.createdAt).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric"
              })}
            </div>
          </>
        ) : order.employee ? (
          <>
            <div className="font-medium">{order.employee.name}</div>
            <div className="text-xs text-gray-500">{order.employee.email}</div>
            <div className="text-xs text-gray-400 mt-1">
              📅 {new Date(order.createdAt).toLocaleDateString("en-GB")}
            </div>
          </>
        ) : (
          "N/A"
        )}
      </OrderCell>

      {/* Customer Name */}
      <OrderCell className="whitespace-nowrap">
        {order.customer?.name || order.customerName}
      </OrderCell>

      {/* Order Actions */}
      <OrderCell>
        <OrderActions
          order={order}
          handleComplete={handleComplete}
          handleCancel={handleCancel}
        />
      </OrderCell>

      {/* PRODUCT NAME */}
      <OrderCell className="text-indigo-600 font-bold">
        {hasMultipleProducts ? (
          <div className="space-y-2">
            {productList.map((prod, idx) => (
              <div key={idx} className="border-b border-gray-200 pb-1 last:border-0">
                <button
                  onClick={() => {
                    const product = products.find((p) => p.name === prod.productName);
                    if (product?.images?.length > 0) {
                      setActiveProductImage({
                        name: prod.productName,
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
                  className="underline cursor-pointer text-left"
                >
                  {prod.productName}
                </button>
                <div className="text-xs text-gray-500 mt-0.5">
                  Qty: {prod.quantity} | Size: {prod.size || "N/A"} | Density: {prod.density || "N/A"}
                </div>
              </div>
            ))}
          </div>
        ) : (
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
            className="underline cursor-pointer"
          >
            {order.product}
          </button>
        )}
      </OrderCell>

      {/* Narration */}
      <OrderCell>
        {order.narration ? (
          <span>
            <strong>Narration:</strong> {order.narration}
          </span>
        ) : hasMultipleProducts && productList.some(p => p.narration) ? (
          <div className="space-y-1">
            {productList.map((prod, idx) => prod.narration && (
              <div key={idx} className="text-xs">
                <strong>{prod.productName}:</strong> {prod.narration}
              </div>
            ))}
          </div>
        ) : (
          <span>-</span>
        )}
      </OrderCell>

      {/* Narration Images */}
      <OrderCell>
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
          {hasMultipleProducts && productList.map((prod, idx) => 
            prod.narrationImages?.map((img, imgIdx) => (
              <img
                key={`${idx}-${imgIdx}`}
                src={img}
                alt={`${prod.productName} narration`}
                className="w-16 h-16 object-cover rounded cursor-pointer border-2 border-blue-200"
                onClick={() => window.open(img, "_blank")}
                title={`${prod.productName} narration image`}
              />
            ))
          )}
        </div>
      </OrderCell>

      {/* Bill To */}
      <OrderCell>
        <strong>Bill To:</strong>
        <br />
        {order.billTo || "—"}
        <br />
        <span className="text-gray-600">
          📞 {order.customer?.phone || getCustomerPhone(order.customerName)}
        </span>
      </OrderCell>

      {/* Ship To */}
      <OrderCell>
        <strong>Ship To:</strong>
        <br />
        {order.shipTo || "—"}
        <br />
        <span className="text-gray-600">
          📞 {order.customer?.phone || getCustomerPhone(order.customerName)}
        </span>
      </OrderCell>

      {/* SIZE */}
      <OrderCell>
        {hasMultipleProducts ? (
          <div className="space-y-1">
            {productList.map((prod, idx) => (
              <div key={idx} className="text-xs">
                {prod.size || "N/A"}
              </div>
            ))}
          </div>
        ) : (
          order.size ? order.size : "N/A"
        )}
      </OrderCell>
      
      {/* QUANTITY - Show each product's quantity and total */}
      <OrderCell>
        {hasMultipleProducts ? (
          <div>
            <div className="space-y-1">
              {productList.map((prod, idx) => (
                <div key={idx} className="text-xs">
                  {prod.productName}: <span className='bg-blue-200 p-1 rounded'>{prod.quantity}</span>
                </div>
              ))}
            </div>
            <div className="mt-1 pt-1 border-t border-gray-200">
              <span className="font-bold text-blue-600">Total: {totalQuantity}</span>
            </div>
          </div>
        ) : (
          order.quantity
        )}
      </OrderCell>

      {/* ✅ DELIVERED QUANTITY - Per product for multi-product */}
      <OrderCell>
        {hasMultipleProducts ? (
          <div className="space-y-2">
            {productList.map((prod, idx) => {
              const currentDelivered = perProductDelivered[idx]?.deliveredQuantity || 0;
              const isEditing = isEditingProduct === idx;
              
              return (
                <div key={idx} className="text-sm">
                  <span className="text-gray-600 text-xs">{prod.productName}:</span>
                  {role.includes("accounts") ? (
                    isEditing ? (
                      <div className="flex items-center gap-1 mt-1">
                        <input
                          type="number"
                          min="0"
                          max={prod.quantity}
                          value={currentDelivered}
                          onChange={(e) => {
                            const updated = [...perProductDelivered];
                            updated[idx] = { ...updated[idx], deliveredQuantity: parseInt(e.target.value) || 0 };
                            setPerProductDelivered(updated);
                          }}
                          onKeyDown={(e) => handleProductKeyDown(e, idx, parseInt(e.target.value) || 0)}
                          className="w-16 px-1 py-0.5 border border-gray-300 rounded text-center text-sm"
                          autoFocus
                        />
                        <button
                          onClick={() => saveProductDeliveredQuantity(idx, currentDelivered)}
                          className="text-green-600 hover:text-green-800 text-xs"
                          title="Save"
                        >
                          save
                        </button>
                        <button
                          onClick={() => setIsEditingProduct(null)}
                          className="text-gray-500 hover:text-gray-700 text-xs"
                          title="Cancel"
                        >
                          cancel
                        </button>
                      </div>
                    ) : (
                      <div 
                        className="flex items-center gap-1 cursor-pointer hover:text-blue-600 mt-1"
                        onClick={() => setIsEditingProduct(idx)}
                        title="Click to edit"
                      >
                        <span className={currentDelivered > 0 ? "font-medium text-blue-600" : "text-gray-700"}>
                          {currentDelivered}
                        </span>
                        <span className="text-gray-500">/</span>
                        <span className="text-gray-600">{prod.quantity}</span>
                        <span className="text-blue-500 text-xs ml-1">✏️</span>
                      </div>
                    )
                  ) : (
                    <div className="mt-1">
                      <span className={currentDelivered > 0 ? "font-medium text-blue-600" : "text-gray-700"}>
                        {currentDelivered}
                      </span>
                      <span className="text-gray-500">/</span>
                      <span className="text-gray-600">{prod.quantity}</span>
                    </div>
                  )}
                </div>
              );
            })}
            <div className="pt-1 border-t border-gray-200">
              <span className="font-medium">Total Delivered: {totalDelivered}</span>
            </div>
          </div>
        ) : (
          // Single product - simple view
          (() => {
            const delivered = order.deliveredQuantity || 0;
            const [localDelivered, setLocalDelivered] = useState(delivered);
            const [isEditing, setIsEditing] = useState(false);
            
            return role.includes("accounts") ? (
              isEditing ? (
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="0"
                    max={order.quantity}
                    value={localDelivered}
                    onChange={(e) => setLocalDelivered(parseInt(e.target.value) || 0)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        saveSingleDelivered(localDelivered);
                      } else if (e.key === 'Escape') {
                        setIsEditing(false);
                        setLocalDelivered(delivered);
                      }
                    }}
                    className="w-14 px-1 py-0.5 border border-gray-300 rounded text-center text-sm"
                    autoFocus
                  />
                  <button
                    onClick={() => saveSingleDelivered(localDelivered)}
                    className="text-green-600 hover:text-green-800 text-xs"
                  >
                    save
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setLocalDelivered(delivered);
                    }}
                    className="text-gray-500 hover:text-gray-700 text-xs"
                  >
                    cancel
                  </button>
                </div>
              ) : (
                <div 
                  className="flex items-center gap-1 cursor-pointer hover:text-blue-600"
                  onClick={() => setIsEditing(true)}
                >
                  <span className={delivered > 0 ? "font-medium text-blue-600" : "text-gray-700"}>
                    {delivered}
                  </span>
                  <span className="text-gray-500">/</span>
                  <span className="text-gray-600">{order.quantity}</span>
                  <span className="text-blue-500 text-xs ml-1">✏️</span>
                </div>
              )
            ) : (
              <div className="flex items-center gap-1">
                <span className={delivered > 0 ? "font-medium text-blue-600" : "text-gray-700"}>
                  {delivered}
                </span>
                <span className="text-gray-500">/</span>
                <span className="text-gray-600">{order.quantity}</span>
              </div>
            );
          })()
        )}
      </OrderCell>
      
      {/* ✅ REMAINING BALANCE - Per product for multi-product */}
      <OrderCell>
        {hasMultipleProducts ? (
          <div className="space-y-2">
            {productList.map((prod, idx) => {
              const delivered = perProductDelivered[idx]?.deliveredQuantity || 0;
              const remaining = (parseInt(prod.quantity) || 0) - delivered;
              return (
                <div key={idx} className="text-sm">
                  <span className="text-gray-600 text-xs">{prod.productName}:</span>
                  <span className={`ml-2 px-1 py-0.5 rounded text-xs ${
                    remaining === 0 
                      ? "bg-green-100 text-green-800" 
                      : delivered > 0 
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                  }`}>
                    {remaining === 0 ? "✅ Completed" : `${remaining} left`}
                  </span>
                </div>
              );
            })}
            <div className="pt-1 border-t border-gray-200">
              <span className={`font-bold px-2 py-1 rounded inline-block text-center ${
                remainingBalance === 0 
                  ? "bg-green-100 text-green-800" 
                  : totalDelivered > 0
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-red-100 text-red-800"
              }`}>
                {remainingBalance === 0 ? "All Completed" : `${remainingBalance} total remaining`}
              </span>
            </div>
          </div>
        ) : (
          (() => {
            const remaining = order.quantity - (order.deliveredQuantity || 0);
            return (
              <span className={`font-bold px-2 py-1 rounded inline-block min-w-[80px] text-center ${
                remaining === 0 
                  ? "bg-green-100 text-green-800 border border-green-300" 
                  : order.deliveredQuantity > 0
                    ? "bg-yellow-100 text-yellow-800 border border-yellow-300"
                    : "bg-red-100 text-red-800 border border-red-300"
              }`}>
                {remaining === 0 ? "Fully Delivered" : `${remaining} remaining`}
              </span>
            );
          })()
        )}
      </OrderCell>
      
      {/* Price - Show each product's price for multi-product */}
<OrderCell>
  {hasMultipleProducts ? (
    <div className="space-y-1">
      {productList.map((prod, idx) => (
        <div key={idx} className="text-xs">
<span className="font-medium">{prod.productName}:</span> <span className="bg-blue-200 p-1 rounded">₹{parseFloat(prod.price) || 0}</span>        </div>
      ))}
    </div>
  ) : (
    `₹${order.price}`
  )}
</OrderCell>

      {/* Density */}
      <OrderCell>
        {hasMultipleProducts ? (
          <div className="space-y-1">
            {productList.map((prod, idx) => (
              <div key={idx} className="text-xs">
                {prod.productName}: <span className="bg-blue-200 p-1 rounded">{prod.density || "N/A"}</span> kg/m³
              </div>
            ))}
          </div>
        ) : (
          `${order.density}kg/m³`
        )}
      </OrderCell>

      {/* Packaging Charge */}
      <OrderCell>₹{order.packagingCharge || 0}</OrderCell>

      {/* PO Number */}
      <OrderCell>{order.po}</OrderCell>

      {/* Freight */}
      <OrderCell>{`${order.freight}: ₹${order.freightAmount || 0}`}</OrderCell>

      {/* Payment Terms */}
      <OrderCell>{order.paymentTerms || "—"}</OrderCell>

      {/* Delivery Time */}
      <OrderCell>
        {(() => {
          if (!order.date) return "N/A";
          const today = new Date();
          const deliveryDate = new Date(order.date);
          today.setHours(0, 0, 0, 0);
          deliveryDate.setHours(0, 0, 0, 0);
          const diffDays = Math.ceil((deliveryDate - today) / (1000 * 60 * 60 * 24));
          
          const deliveryOption = order.deliveryOption;
          
          if (deliveryOption === "1week") {
            return (
              <div>
                <span className="font-medium text-blue-600">Within 1 Week</span>
                <br />
                <span className="text-xs text-gray-500">
                  Delivery by: {deliveryDate.toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
            );
          }
          
          if (deliveryOption === "2weeks") {
            return (
              <div>
                <span className="font-medium text-blue-600">Within 2 Weeks</span>
                <br />
                <span className="text-xs text-gray-500">
                  Delivery by: {deliveryDate.toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
            );
          }
          
          if (deliveryOption === "particular") {
            return (
              <div>
                <span className="font-medium text-green-600">Particular Date</span>
                <br />
                <span className="text-xs text-gray-700 font-medium">
                  {deliveryDate.toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
            );
          }
          
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

      {/* Remarks */}
      <OrderCell>
        {order.remarks || (hasMultipleProducts && productList.some(p => p.productRemarks) ? (
          <div className="space-y-1">
            {productList.map((prod, idx) => prod.productRemarks && (
              <div key={idx} className="text-xs">
                <strong>{prod.productName}:</strong> {prod.productRemarks}
              </div>
            ))}
          </div>
        ) : "N/A")}
      </OrderCell>

      {/* PO Copy */}
      <OrderCell>
        <POCopySection 
          order={order}
          resolvedPOUrls={resolvedPOUrls}
        />
      </OrderCell>

      {/* Edit/Delete Buttons */}
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

      {/* Section Selection */}
      {!role.includes("production") && !role.includes("dispatch") && !role.includes("admin") && !role.includes("packaging") && (
        <>
          <OrderCell className="whitespace-nowrap">
            <div id={`section-selection-${order._id}`} style={{ minWidth: '300px' }}>
              <SectionSelection
                order={order}
                sectionsList={sectionsList}
                localSections={localSections}
                handleSectionRadioChange={handleSectionRadioChange}
              />
            </div>
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

      {/* Production Status */}
      <OrderCell>
        <StatusIndicator 
          status={order.status}
          dispatchStatus={order.dispatchStatus}
          type="production"
        />
      </OrderCell>

      {/* Packaging Status */}
      <OrderCell>
        <StatusIndicator 
          status={order.status}
          packagingStatus={order.packagingStatus}
          dispatchStatus={order.dispatchStatus}
          type="packaging"
        />
      </OrderCell>

      {/* Dispatch Status */}
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