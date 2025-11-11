import React, { useState, useEffect } from "react";
import { gsap } from "gsap";
import axiosInstance from "../axiosInstance";
import toast from "react-hot-toast";

const EditModal = ({ order, onSave, onClose }) => {
  const [updatedOrder, setUpdatedOrder] = useState({
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
  });

  const [allProducts, setAllProducts] = useState([]);

  useEffect(() => {
    gsap.from(".modal-content", { opacity: 0, y: -50, duration: 0.5 });
    axiosInstance
      .get("/products/all-backend-products")
      .then((res) => setAllProducts(res.data))
      .catch(console.error);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUpdatedOrder((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    await onSave(order._id, updatedOrder);
    onClose();
    toast.success("Order updated successfully!");
  };

  const Input = ({ label, name, value, onChange, type = "text" }) => (
    <div>
      <label className="block mb-1 font-semibold">{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        className="border border-gray-300 p-3 rounded-lg w-full"
      />
    </div>
  );

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 bg-opacity-50 flex justify-center items-center z-50 overflow-y-auto">
      <div className="modal-content bg-white p-6 rounded-lg shadow-lg max-w-3xl w-full my-10 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">Edit Order</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Quantity" name="quantity" value={updatedOrder.quantity} onChange={handleChange} />
          <Input label="Price" name="price" value={updatedOrder.price} onChange={handleChange} />
          <Input label="Freight" name="freight" value={updatedOrder.freight} onChange={handleChange} />
          <Input label="Freight Amount" name="freightAmount" value={updatedOrder.freightAmount} onChange={handleChange} />
          <Input label="Density" name="density" value={updatedOrder.density} onChange={handleChange} />
          <Input label="Packaging Charge" name="packagingCharge" value={updatedOrder.packagingCharge} onChange={handleChange} />
          <Input label="Size" name="size" value={updatedOrder.size} onChange={handleChange} />
          <Input label="Unit" name="unit" value={updatedOrder.unit} onChange={handleChange} />
          <Input label="Bill To" name="billTo" value={updatedOrder.billTo} onChange={handleChange} />
          <Input label="Ship To" name="shipTo" value={updatedOrder.shipTo} onChange={handleChange} />
          <Input label="Remarks" name="remarks" value={updatedOrder.remarks} onChange={handleChange} />
          <Input label="Date" name="date" type="date" value={updatedOrder.date} onChange={handleChange} />

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

          <div>
            <label className="block mb-1 font-semibold">Payment Terms</label>
            <select
              name="paymentTerms"
              value={updatedOrder.paymentTerms}
              onChange={handleChange}
              className="border border-gray-300 p-3 rounded-lg w-full"
            >
              <option value="">Select Option</option>
              <option value="Advance">Advance</option>
              <option value="Credit">Credit</option>
              <option value="Partial">Partial</option>
              <option value="Cash on Delivery">Cash on Delivery</option>
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