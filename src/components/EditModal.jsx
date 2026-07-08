import React, { useState, useEffect } from "react";
import { gsap } from "gsap";
import axiosInstance from "../axiosInstance";
import toast from "react-hot-toast";

const EditModal = ({ order, onSave, onClose }) => {
  // ✅ Check if multi-product order
  const hasMultipleProducts = order.products && order.products.length > 0;
  
  // ✅ Initialize state for multi-product orders
  const [updatedOrder, setUpdatedOrder] = useState(() => {
    if (hasMultipleProducts) {
      // For multi-product orders, store products array
      return {
        products: order.products.map(prod => ({
          productName: prod.productName || prod.product || "",
          quantity: prod.quantity,
          price: prod.price,
          size: prod.size || "",
          density: prod.density || "",
          productRemarks: prod.productRemarks || prod.remarks || "",
        })),
        freight: order.freight || "",
        freightAmount: order.freightAmount || "",
        packagingCharge: order.packagingCharge || "",
        paymentTerms: order.paymentTerms || "",
        remarks: order.remarks || "",
        billTo: order.billTo || "",
        shipTo: order.shipTo || "",
        date: order.date ? new Date(order.date).toISOString().split("T")[0] : "",
        deliveryOption: order.deliveryOption || "",
      };
    } else {
      // For single product orders
      return {
        quantity: order.quantity,
        price: order.price,
        freight: order.freight || "",
        freightAmount: order.freightAmount || "",
        product: order.product,
        density: order.density,
        packagingCharge: order.packagingCharge || "",
        paymentTerms: order.paymentTerms || "",
        remarks: order.remarks || "",
        billTo: order.billTo || "",
        shipTo: order.shipTo || "",
        size: order.size || "",
        unit: order.unit || "pcs",
        date: order.date ? new Date(order.date).toISOString().split("T")[0] : "",
        deliveryOption: order.deliveryOption || "",
      };
    }
  });

  const [allProducts, setAllProducts] = useState([]);

  // Debug - Remove after fixing
  useEffect(() => {
    console.log("🔍 EditModal - Order data:", order);
    console.log("🔍 EditModal - Has multiple products:", hasMultipleProducts);
    if (hasMultipleProducts) {
      console.log("🔍 EditModal - Products array:", order.products);
    }
  }, [order, hasMultipleProducts]);

  useEffect(() => {
    gsap.from(".modal-content", { opacity: 0, y: -50, duration: 0.5 });
    axiosInstance
      .get("/products/all-backend-products")
      .then((res) => {
        console.log("📦 All products loaded:", res.data);
        setAllProducts(res.data);
      })
      .catch(console.error);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUpdatedOrder((prev) => ({ ...prev, [name]: value }));
  };

  // ✅ Handle product field changes for multi-product
  const handleProductChange = (index, field, value) => {
    const updatedProducts = [...updatedOrder.products];
    updatedProducts[index] = { ...updatedProducts[index], [field]: value };
    setUpdatedOrder((prev) => ({ ...prev, products: updatedProducts }));
  };

  // ✅ Handle product selection from dropdown
  const handleProductSelect = (index, productName) => {
    const updatedProducts = [...updatedOrder.products];
    updatedProducts[index] = { 
      ...updatedProducts[index], 
      productName: productName 
    };
    setUpdatedOrder((prev) => ({ ...prev, products: updatedProducts }));
  };

  // ✅ Add new product row
  const addProductRow = () => {
    setUpdatedOrder((prev) => ({
      ...prev,
      products: [
        ...prev.products,
        {
          productName: "",
          quantity: "",
          price: "",
          size: "",
          density: "",
          productRemarks: "",
        },
      ],
    }));
  };

  // ✅ Remove product row
  const removeProductRow = (index) => {
    const updatedProducts = updatedOrder.products.filter((_, i) => i !== index);
    setUpdatedOrder((prev) => ({ ...prev, products: updatedProducts }));
  };

  const handleSave = async () => {
    let dataToSave;
    
    if (hasMultipleProducts || (updatedOrder.products && updatedOrder.products.length > 1)) {
      // For multi-product orders
      dataToSave = {
        products: updatedOrder.products,
        freight: updatedOrder.freight,
        freightAmount: updatedOrder.freightAmount,
        packagingCharge: updatedOrder.packagingCharge,
        paymentTerms: updatedOrder.paymentTerms,
        remarks: updatedOrder.remarks,
        billTo: updatedOrder.billTo,
        shipTo: updatedOrder.shipTo,
        date: updatedOrder.date,
        deliveryOption: updatedOrder.deliveryOption,
      };
    } else {
      // For single product orders
      dataToSave = {
        quantity: updatedOrder.quantity,
        price: updatedOrder.price,
        freight: updatedOrder.freight,
        freightAmount: updatedOrder.freightAmount,
        product: updatedOrder.product,
        density: updatedOrder.density,
        packagingCharge: updatedOrder.packagingCharge,
        paymentTerms: updatedOrder.paymentTerms,
        remarks: updatedOrder.remarks,
        billTo: updatedOrder.billTo,
        shipTo: updatedOrder.shipTo,
        size: updatedOrder.size,
        unit: updatedOrder.unit,
        date: updatedOrder.date,
        deliveryOption: updatedOrder.deliveryOption,
      };
    }
    
    await onSave(order._id, dataToSave);
    onClose();
    toast.success("Order updated successfully!");
  };

  const Input = ({ label, name, value, onChange, type = "text", required = false }) => (
    <div>
      <label className="block mb-1 font-semibold">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        name={name}
        value={value || ""}
        onChange={onChange}
        className="border border-gray-300 p-3 rounded-lg w-full"
      />
    </div>
  );

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 bg-opacity-50 flex justify-center items-center z-50 overflow-y-auto">
      <div className="modal-content bg-white p-6 rounded-lg shadow-lg max-w-5xl w-full my-10 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">Edit Order</h2>
        
        {/* ✅ Multi-Product Table - Only show if order actually has multiple products */}
        {(hasMultipleProducts || (updatedOrder.products && updatedOrder.products.length > 1)) && (
          <div className="mb-6">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-bold text-blue-700">Products</h3>
              <button
                type="button"
                onClick={addProductRow}
                className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
              >
                + Add Product
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-200 text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-2 border" style={{ minWidth: '300px' }}>Product Name</th>
                    <th className="p-2 border" style={{ minWidth: '80px' }}>Quantity</th>
                    <th className="p-2 border" style={{ minWidth: '80px' }}>Price</th>
                    <th className="p-2 border" style={{ minWidth: '80px' }}>Size</th>
                    <th className="p-2 border" style={{ minWidth: '80px' }}>Density</th>
                    <th className="p-2 border" style={{ minWidth: '120px' }}>Remarks</th>
                    <th className="p-2 border" style={{ minWidth: '50px' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {updatedOrder.products.map((prod, idx) => {
                    // Check if this product exists in the product list
                    const productExists = allProducts.some(p => p.name === prod.productName);
                    
                    return (
                      <tr key={idx}>
                        <td className="p-2 border">
                          <div className="flex flex-col gap-1">
                            {/* ✅ Show product name in a textarea/input for full visibility */}
                            <textarea
                              value={prod.productName}
                              onChange={(e) => handleProductChange(idx, "productName", e.target.value)}
                              className="border border-gray-300 p-2 rounded w-full text-sm"
                              rows="2"
                              placeholder="Enter product name"
                              style={{ resize: 'vertical', minHeight: '40px' }}
                            />
                            
                            {/* ✅ Dropdown to select from existing products */}
                            <select
                              value=""
                              onChange={(e) => {
                                if (e.target.value) {
                                  handleProductSelect(idx, e.target.value);
                                }
                              }}
                              className="border border-gray-300 p-1 rounded w-full text-sm bg-gray-50"
                            >
                              <option value="">-- Select from products --</option>
                              {allProducts.map((p) => (
                                <option key={p._id} value={p.name}>
                                  {p.name}
                                </option>
                              ))}
                            </select>
                            
                            {/* ✅ Show warning if product doesn't exist in list */}
                            {prod.productName && !productExists && (
                              <span className="text-xs text-amber-600">
                                ⚠️ This product is not in the current product list
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-2 border">
                          <input
                            type="number"
                            value={prod.quantity || ""}
                            onChange={(e) => handleProductChange(idx, "quantity", e.target.value)}
                            className="border border-gray-300 p-2 rounded w-24"
                            placeholder="Qty"
                          />
                        </td>
                        <td className="p-2 border">
                          <input
                            type="number"
                            step="0.01"
                            value={prod.price || ""}
                            onChange={(e) => handleProductChange(idx, "price", e.target.value)}
                            className="border border-gray-300 p-2 rounded w-24"
                            placeholder="Price"
                          />
                        </td>
                        <td className="p-2 border">
                          <input
                            type="text"
                            value={prod.size || ""}
                            onChange={(e) => handleProductChange(idx, "size", e.target.value)}
                            className="border border-gray-300 p-2 rounded w-24"
                            placeholder="Size"
                          />
                        </td>
                        <td className="p-2 border">
                          <input
                            type="text"
                            value={prod.density || ""}
                            onChange={(e) => handleProductChange(idx, "density", e.target.value)}
                            className="border border-gray-300 p-2 rounded w-24"
                            placeholder="Density"
                          />
                        </td>
                        <td className="p-2 border">
                          <input
                            type="text"
                            value={prod.productRemarks || ""}
                            onChange={(e) => handleProductChange(idx, "productRemarks", e.target.value)}
                            className="border border-gray-300 p-2 rounded w-32"
                            placeholder="Remarks"
                          />
                        </td>
                        <td className="p-2 border text-center">
                          <button
                            type="button"
                            onClick={() => removeProductRow(idx)}
                            className="text-red-500 hover:text-red-700 text-xl font-bold"
                            disabled={updatedOrder.products.length <= 1}
                          >
                            ×
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ✅ Single Product Fields - Only show if order is single product */}
        {!hasMultipleProducts && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Quantity" name="quantity" value={updatedOrder.quantity} onChange={handleChange} />
            <Input label="Price" name="price" value={updatedOrder.price} onChange={handleChange} />
            <Input label="Size" name="size" value={updatedOrder.size} onChange={handleChange} />
            <Input label="Density" name="density" value={updatedOrder.density} onChange={handleChange} />
            
            <div>
              <label className="block mb-1 font-semibold">Product</label>
              <select
                name="product"
                value={updatedOrder.product}
                onChange={handleChange}
                className="border border-gray-300 p-3 rounded-lg w-full"
              >
                <option value="">Select Product</option>
                {allProducts.map((p) => (
                  <option key={p._id} value={p.name}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* ✅ Common Fields for both single and multi-product */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <Input label="Freight" name="freight" value={updatedOrder.freight} onChange={handleChange} />
          <Input label="Freight Amount" name="freightAmount" value={updatedOrder.freightAmount} onChange={handleChange} />
          <Input label="Packaging Charge" name="packagingCharge" value={updatedOrder.packagingCharge} onChange={handleChange} />
          <Input label="Unit" name="unit" value={updatedOrder.unit} onChange={handleChange} />
          <Input label="Bill To" name="billTo" value={updatedOrder.billTo} onChange={handleChange} />
          <Input label="Ship To" name="shipTo" value={updatedOrder.shipTo} onChange={handleChange} />
          <Input label="Remarks" name="remarks" value={updatedOrder.remarks} onChange={handleChange} />
          <Input label="Date" name="date" type="date" value={updatedOrder.date} onChange={handleChange} />

          <div>
            <label className="block mb-1 font-semibold">Payment Terms</label>
            <select
              name="paymentTerms"
              value={updatedOrder.paymentTerms}
              onChange={handleChange}
              className="border border-gray-300 p-3 rounded-lg w-full"
            >
              <option value="">Select Option</option>
              <option value="100% Advance">100% Advance</option>
              <option value="Cash on Delivery (Driver to get Cash payment on delivery)">Cash on Delivery</option>
              <option value="PDC (Cheque on Delivery) - Driver to get cheque on delivery on material">PDC (Cheque on Delivery)</option>
              <option value="50% Advance & Balance 50% before Dispatch against PI">50% Advance & Balance 50%</option>
              <option value="Credit (Udhaar): 45 Days">Credit (Udhaar): 45 Days</option>
            </select>
          </div>

          <div>
            <label className="block mb-1 font-semibold">Delivery Option</label>
            <select
              name="deliveryOption"
              value={updatedOrder.deliveryOption}
              onChange={handleChange}
              className="border border-gray-300 p-3 rounded-lg w-full"
            >
              <option value="">Select Delivery Option</option>
              <option value="1week">Within 1 Week</option>
              <option value="2weeks">Within 2 Weeks</option>
              <option value="particular">Particular Date</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button
            className="bg-yellow-400 hover:bg-yellow-500 text-black px-6 py-3 rounded-lg"
            onClick={onClose}
          >
            ❌ Cancel
          </button>
          <button
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg"
            onClick={handleSave}
          >
            📑 Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditModal;