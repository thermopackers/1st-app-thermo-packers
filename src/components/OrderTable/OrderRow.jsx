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
  ? productList.reduce((sum, p) => sum + (parseFloat(p.quantity) || 0), 0)
  : (parseFloat(order.quantity) || 0);

const totalDelivered = hasMultipleProducts
  ? perProductDelivered.reduce((sum, p) => sum + (parseFloat(p.deliveredQuantity) || 0), 0)
  : (parseFloat(order.deliveredQuantity) || 0);
  const remainingBalance = totalQuantity - totalDelivered;
  
  // Determine row color
  const getRowClass = () => {
    if (order.status === "cancelled") return "bg-red-50";
    
    if (Math.abs(remainingBalance) < 0.01 && totalDelivered > 0) {
  return "bg-green-300 border-l-4 border-l-green-500";
} else if (remainingBalance > 0.01 && totalDelivered > 0) {
  return "bg-yellow-300 border-l-4 border-l-yellow-500";
}
    
    return "odd:bg-white even:bg-gray-50";
  };

const saveProductDeliveredQuantity = async (productIndex, newValue) => {
  const product = productList[productIndex];
  // ✅ Use parseFloat instead of parseInt to allow decimals
  const originalQuantity = parseFloat(product.quantity) || 0;
  const deliveredValue = parseFloat(newValue) || 0;
  
  // Validate decimal places (max 2)
  const decimalMatch = newValue.toString().match(/\.(\d+)$/);
  if (decimalMatch && decimalMatch[1].length > 2) {
    Swal.fire({
      icon: "error",
      title: "Invalid Quantity",
      text: `Delivered quantity for ${product.productName} can have at most 2 decimal places.`,
    });
    return;
  }
  
  if (deliveredValue < 0 || deliveredValue > originalQuantity) {
    Swal.fire({
      icon: "error",
      title: "Invalid Quantity",
      text: `Delivered quantity must be between 0 and ${originalQuantity.toFixed(2)} for ${product.productName}`,
    });
    return;
  }
  
  setIsSaving(true);
  
  try {
    const updatedDelivered = [...perProductDelivered];
    updatedDelivered[productIndex] = {
      productName: product.productName,
      deliveredQuantity: deliveredValue
    };
    
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
      if (updatedOrder.products) {
        const newPerProductDelivered = updatedOrder.products.map(p => ({
          productName: p.productName,
          deliveredQuantity: parseFloat(p.deliveredQuantity) || 0,
          originalQuantity: parseFloat(p.quantity) || 0
        }));
        setPerProductDelivered(newPerProductDelivered);
      }
    } else {
      setPerProductDelivered(updatedDelivered);
    }
    
    Swal.fire({
      icon: "success",
      title: "Updated!",
      text: `Delivered quantity for ${product.productName} updated to ${deliveredValue.toFixed(2)}`,
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
  } finally {
    setIsSaving(false);
    setIsEditingProduct(null);
  }
};

const handleProductKeyDown = (e, productIndex, newValue) => {
  if (e.key === 'Enter') {
    saveProductDeliveredQuantity(productIndex, parseFloat(newValue) || 0);
  } else if (e.key === 'Escape') {
    setIsEditingProduct(null);
  }
};

const saveSingleDelivered = async (newValue) => {
  const originalQuantity = parseFloat(order.quantity) || 0;
  const deliveredValue = parseFloat(newValue) || 0;
  
  if (deliveredValue < 0 || deliveredValue > originalQuantity) {
    Swal.fire({
      icon: "error",
      title: "Invalid Quantity",
      text: `Delivered quantity must be between 0 and ${originalQuantity.toFixed(2)}`,
    });
    return;
  }
  
  setIsSaving(true);
  
  try {
    await axiosInstance.put(
      `/orders/${order._id}`,
      { deliveredQuantity: deliveredValue },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    Swal.fire({
      icon: "success",
      title: "Updated!",
      text: `Delivered quantity updated to ${deliveredValue.toFixed(2)}`,
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
  } finally {
    setIsSaving(false);
  }
};

// Determine row background color for sticky columns
const getStickyBgClass = () => {
  if (order.status === "cancelled") return "bg-red-50";
  if (Math.abs(remainingBalance) < 0.01 && totalDelivered > 0) return "bg-green-300";
  if (remainingBalance > 0.01 && totalDelivered > 0) return "bg-yellow-300";
  return ""; // Will use odd/even from parent
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
            {/* <div className="text-[10px] text-gray-500">{order.customer.createdBy.email}</div> */}
          </>
        ) : order.employee ? (
          <>
            <div>{order.employee.name}</div>
            {/* <div className="text-[5px] text-gray-500">{order.employee.email}</div> */}
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
            {/* <div className="text-[10px] text-gray-500">{order.createdBy.email}</div> */}
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
            {/* <div className="text-xs text-gray-500">{order.employee.email}</div> */}
            <div className="text-xs text-gray-400 mt-1">
              📅 {new Date(order.createdAt).toLocaleDateString("en-GB")}
            </div>
          </>
        ) : (
          "N/A"
        )}
      </OrderCell>

      {/* Customer Name */}
      {/* Customer Name */}
      <OrderCell className="sticky !text-[9px] md:!text-sm left-0 z-25 min-w-[80px] max-w-[100px] bg-white break-words">
        <div>
          {order.customer?.name || order.customerName}
        </div>
      </OrderCell>

      {/* PRODUCT NAME */}
 <OrderCell className="text-indigo-600 !text-[9px] md:!text-sm font-bold sticky md:left-[110px] left-[80px] z-25 min-w-[100px] max-w-[250px] bg-white break-words">
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
          <div className="text-xs text-gray-500 mt-0.5 !text-[9px] md:!text-sm">
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

       {/* Order Actions */}
      <OrderCell>
        <OrderActions
          order={order}
          handleComplete={handleComplete}
          handleCancel={handleCancel}
        />
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
            <span className='bg-blue-200 p-1 rounded'>{parseFloat(prod.quantity).toFixed(2)}</span>
          </div>
        ))}
      </div>
      <div className="mt-1 pt-1 border-t border-gray-200">
        <span className="font-bold text-blue-600">Total: {totalQuantity.toFixed(2)}</span>
      </div>
    </div>
  ) : (
    parseFloat(order.quantity).toFixed(2)
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
            {role.includes("accounts") ? (
              isEditing ? (
                <div className="flex items-center gap-1 mt-1">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max={parseFloat(prod.quantity)}
                    value={currentDelivered}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      if (!isNaN(value) && value >= 0 && value <= parseFloat(prod.quantity)) {
                        const updated = [...perProductDelivered];
                        updated[idx] = { ...updated[idx], deliveredQuantity: value };
                        setPerProductDelivered(updated);
                      } else if (e.target.value === "") {
                        const updated = [...perProductDelivered];
                        updated[idx] = { ...updated[idx], deliveredQuantity: 0 };
                        setPerProductDelivered(updated);
                      }
                    }}
                    onBlur={() => {
                      const currentValue = perProductDelivered[idx]?.deliveredQuantity || 0;
                      saveProductDeliveredQuantity(idx, currentValue);
                      setIsEditingProduct(null);
                    }}
                    className="w-24 px-2 py-1 border border-gray-300 rounded text-center text-sm"
                    autoFocus
                  />
                  <button
                    onClick={() => {
                      const currentValue = perProductDelivered[idx]?.deliveredQuantity || 0;
                      saveProductDeliveredQuantity(idx, currentValue);
                    }}
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
                    {currentDelivered.toFixed(2)}
                  </span>
                  <span className="text-gray-500">/</span>
                  <span className="text-gray-600">{parseFloat(prod.quantity).toFixed(2)}</span>
                  <span className="text-blue-500 text-xs ml-1">✏️</span>
                </div>
              )
            ) : (
              <div className="mt-1">
                <span className={currentDelivered > 0 ? "font-medium text-blue-600" : "text-gray-700"}>
                  {currentDelivered.toFixed(2)}
                </span>
                <span className="text-gray-500">/</span>
                <span className="text-gray-600">{parseFloat(prod.quantity).toFixed(2)}</span>
              </div>
            )}
          </div>
        );
      })}
      <div className="pt-1 border-t border-gray-200">
        <span className="font-medium">Total Delivered: {totalDelivered.toFixed(2)}</span>
      </div>
    </div>
  ) : (
    // Single product view
    (() => {
      const delivered = order.deliveredQuantity || 0;
      const [localDelivered, setLocalDelivered] = useState(delivered);
      const [isEditing, setIsEditing] = useState(false);
      
      return role.includes("accounts") ? (
        isEditing ? (
          <div className="flex items-center gap-1">
            <input
              type="number"
              step="0.01"
              min="0"
              max={parseFloat(order.quantity)}
              value={localDelivered}
              onChange={(e) => {
                const value = parseFloat(e.target.value);
                if (!isNaN(value) && value >= 0 && value <= parseFloat(order.quantity)) {
                  setLocalDelivered(value);
                } else if (e.target.value === "") {
                  setLocalDelivered(0);
                }
              }}
              onBlur={() => {
                saveSingleDelivered(localDelivered);
                setIsEditing(false);
              }}
              className="w-24 px-2 py-1 border border-gray-300 rounded text-center text-sm"
              autoFocus
            />
            <button
              onClick={() => {
                saveSingleDelivered(localDelivered);
                setIsEditing(false);
              }}
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
              {delivered.toFixed(2)}
            </span>
            <span className="text-gray-500">/</span>
            <span className="text-gray-600">{parseFloat(order.quantity).toFixed(2)}</span>
            <span className="text-blue-500 text-xs ml-1">✏️</span>
          </div>
        )
      ) : (
        <div className="flex items-center gap-1">
          <span className={delivered > 0 ? "font-medium text-blue-600" : "text-gray-700"}>
            {delivered.toFixed(2)}
          </span>
          <span className="text-gray-500">/</span>
          <span className="text-gray-600">{parseFloat(order.quantity).toFixed(2)}</span>
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
const remaining = (parseFloat(prod.quantity) || 0) - delivered;
              return (
                <div key={idx} className="text-sm">
                 <span className={`ml-2 px-1 py-0.5 rounded text-xs ${
  remaining === 0 
    ? "bg-green-100 text-green-800" 
    : delivered > 0 
      ? "bg-yellow-100 text-yellow-800"
      : "bg-red-100 text-red-800"
}`}>
  {remaining === 0 ? "✅ Completed" : `${remaining.toFixed(2)} left`}
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
  {remainingBalance === 0 ? "All Completed" : `${remainingBalance.toFixed(2)} total remaining`}
</span>
            </div>
          </div>
        ) : (
          (() => {
const remaining = (parseFloat(order.quantity) || 0) - (parseFloat(order.deliveredQuantity) || 0);
            return (
             <span className={`font-bold px-2 py-1 rounded inline-block min-w-[80px] text-center ${
  remaining === 0 
    ? "bg-green-100 text-green-800 border border-green-300" 
    : order.deliveredQuantity > 0
      ? "bg-yellow-100 text-yellow-800 border border-yellow-300"
      : "bg-red-100 text-red-800 border border-red-300"
}`}>
  {remaining === 0 ? "Fully Delivered" : `${remaining.toFixed(2)} remaining`}
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
 <span className="bg-blue-200 p-1 rounded">₹{parseFloat(prod.price) || 0}</span>        </div>
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
                <span className="bg-blue-200 p-1 rounded">{prod.density || "N/A"}</span> kg/m³
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
{/* Freight */}
<OrderCell>
  {order.freight === "To pay(Material sent via part load, Payment to be done to TRANSPORTER as per actual GR Copy Amount)" ? (
    <div className="text-sm">
      <span className="font-medium text-orange-600">To pay</span>
      <br />
      <span className="text-xs text-gray-600">
        (Material sent via part load, Payment to be done to TRANSPORTER as per actual GR Copy Amount)
      </span>
      <br />
      <span className="font-semibold">₹{order.freightAmount || 0}</span>
    </div>
  ) : (
    <span>{order.freight}: ₹{order.freightAmount || 0}</span>
  )}
</OrderCell>
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