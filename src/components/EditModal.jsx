import React, { useState, useEffect } from "react";
import { gsap } from "gsap";
import axiosInstance from "../axiosInstance";
import toast from "react-hot-toast";

const EditModal = ({ order, onSave, onClose }) => {
  // ✅ Check if multi-product order
  const hasMultipleProducts = order.products && order.products.length > 0;
  
  // ✅ Add loading state
  const [isSaving, setIsSaving] = useState(false);
  
  // ✅ Initialize state for multi-product orders
  const [updatedOrder, setUpdatedOrder] = useState(() => {
    if (hasMultipleProducts) {
      // For multi-product orders, store products array
      return {
        products: order.products.map(prod => ({
          productName: prod.productName,
          quantity: prod.quantity,
          price: prod.price,
          size: prod.size || "",
          density: prod.density || "",
          productRemarks: prod.productRemarks || "",
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

  useEffect(() => {
    gsap.from(".modal-content", { opacity: 0, y: -50, duration: 0.5 });
    axiosInstance
      .get("/products/dropdown-products")
      .then((res) => setAllProducts(res.data))
      .catch(console.error);
  }, []);

  // Add this right after the useState initialization
  useEffect(() => {
    console.log("🔍 EditModal - Order data:", order);
    console.log("🔍 EditModal - Has multiple products:", hasMultipleProducts);
    if (hasMultipleProducts) {
      console.log("🔍 EditModal - Products array:", order.products);
      console.log("🔍 EditModal - First product keys:", Object.keys(order.products[0] || {}));
      console.log("🔍 EditModal - First product:", order.products[0]);
    }
  }, [order, hasMultipleProducts]);

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
    // ✅ Set loading state to true
    setIsSaving(true);
    
    try {
      let dataToSave;
      
      if (hasMultipleProducts || updatedOrder.products) {
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
    } catch (error) {
      console.error("Error saving order:", error);
      toast.error("Failed to update order. Please try again.");
    } finally {
      // ✅ Set loading state back to false
      setIsSaving(false);
    }
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
        disabled={isSaving}
      />
    </div>
  );

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 bg-opacity-50 flex justify-center items-center z-50 overflow-y-auto">
      <div className="modal-content bg-white p-6 rounded-lg shadow-lg max-w-5xl w-full my-10 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">Edit Order</h2>
        
        {/* ✅ Multi-Product Table */}
        {(hasMultipleProducts || updatedOrder.products) && updatedOrder.products && (
          <div className="mb-6">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-bold text-blue-700">Products</h3>
              <button
                type="button"
                onClick={addProductRow}
                className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                disabled={isSaving}
              >
                + Add Product
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-200 text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-2 border">Product Name</th>
                    <th className="p-2 border">Quantity</th>
                    <th className="p-2 border">Price</th>
                    <th className="p-2 border">Size</th>
                    <th className="p-2 border">Density</th>
                    <th className="p-2 border">Remarks</th>
                    <th className="p-2 border">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {updatedOrder.products.map((prod, idx) => (
                    <tr key={idx}>
                      <td className="p-2 border">
                        <select
                          value={prod.productName}
                          onChange={(e) => handleProductChange(idx, "productName", e.target.value)}
                          className="border border-gray-300 p-2 rounded w-full text-sm"
                          disabled={isSaving}
                        >
                          <option value="">Select Product</option>
                          {allProducts.map((p) => (
                            <option key={p._id} value={p.name}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="p-2 border">
                        <input
                          type="number"
                          value={prod.quantity || ""}
                          onChange={(e) => handleProductChange(idx, "quantity", e.target.value)}
                          className="border border-gray-300 p-2 rounded w-24"
                          placeholder="Qty"
                          disabled={isSaving}
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
                          disabled={isSaving}
                        />
                      </td>
                      <td className="p-2 border">
                        <input
                          type="text"
                          value={prod.size || ""}
                          onChange={(e) => handleProductChange(idx, "size", e.target.value)}
                          className="border border-gray-300 p-2 rounded w-24"
                          placeholder="Size"
                          disabled={isSaving}
                        />
                      </td>
                      <td className="p-2 border">
                        <input
                          type="text"
                          value={prod.density || ""}
                          onChange={(e) => handleProductChange(idx, "density", e.target.value)}
                          className="border border-gray-300 p-2 rounded w-24"
                          placeholder="Density"
                          disabled={isSaving}
                        />
                      </td>
                      <td className="p-2 border">
                        <input
                          type="text"
                          value={prod.productRemarks || ""}
                          onChange={(e) => handleProductChange(idx, "productRemarks", e.target.value)}
                          className="border border-gray-300 p-2 rounded w-32"
                          placeholder="Remarks"
                          disabled={isSaving}
                        />
                      </td>
                      <td className="p-2 border text-center">
                        <button
                          type="button"
                          onClick={() => removeProductRow(idx)}
                          className="text-red-500 hover:text-red-700 text-xl font-bold"
                          disabled={isSaving}
                        >
                          ×
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ✅ Single Product Fields (shown only for non-multi-product orders) */}
        {!hasMultipleProducts && !updatedOrder.products && (
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
                disabled={isSaving}
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
              disabled={isSaving}
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
              disabled={isSaving}
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
            disabled={isSaving}
          >
            ❌ Cancel
          </button>
          <button
            className={`bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 ${
              isSaving ? "opacity-70 cursor-not-allowed" : ""
            }`}
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </>
            ) : (
              "📑 Save"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditModal;