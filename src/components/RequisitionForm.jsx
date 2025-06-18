import React, { useState } from "react";
import toast from "react-hot-toast";
import InternalNavbar from "./InternalNavbar";
import axiosInstance from "../axiosInstance";

export default function RequisitionForm() {
  const [assignedTo, setAssignedTo] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [items, setItems] = useState([{ name: "", quantity: 1, requiredBy: "", remarks: "" }]);

  const handleItemChange = (i, field, value) => {
    const updated = [...items];
    updated[i][field] = value;
    setItems(updated);
  };

  const addItem = () => {
    setItems([...items, { name: "", quantity: 1, requiredBy: "", remarks: "" }]);
  };

  const removeItem = (index) => {
    if (items.length === 1) {
      toast.error("At least one item is required.");
      return;
    }
    const updated = [...items];
    updated.splice(index, 1);
    setItems(updated);
  };

  const resetForm = () => {
    setAssignedTo("");
    setDate(new Date().toISOString().slice(0, 10));
    setItems([{ name: "", quantity: 1, requiredBy: "", remarks: "" }]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      toast.dismiss();
      toast.loading("Uploading...");
      const res = await axiosInstance.post("/requisitions/create", {
        createdBy: assignedTo,
        date,
        items: JSON.stringify(items),
      });
      toast.dismiss();
      toast.success("Requisition uploaded!");
      console.log(res.data);
      resetForm();
    } catch (err) {
      toast.dismiss();
      toast.error("Failed to upload");
      console.error(err);
    }
  };

  return (
    <>
      <InternalNavbar />
      <div className="max-w-5xl mx-auto p-6 mt-6 bg-white shadow-xl rounded-xl">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">📋 Material Requisition Slip</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              placeholder="Assigned To"
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
            />
           <input
  type="date"
  value={date}
  max={new Date().toISOString().slice(0, 10)} // ✅ today's date as max
  onChange={(e) => setDate(e.target.value)}
  className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
  required
/>

          </div>

          <div className="space-y-4">
            {items.map((item, i) => (
              <div key={i} className="grid grid-cols-1 sm:grid-cols-5 gap-4 items-center">
                <input
                  placeholder="Item Name"
                  value={item.name}
                  onChange={(e) => handleItemChange(i, "name", e.target.value)}
                  className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                  required
                />
                <input
                  type="number"
                  placeholder="Qty"
                  value={item.quantity}
                  onChange={(e) => handleItemChange(i, "quantity", e.target.value)}
                  className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                  required
                />
                <input
                  placeholder="Required By"
                  value={item.requiredBy}
                  onChange={(e) => handleItemChange(i, "requiredBy", e.target.value)}
                  className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                <input
                  placeholder="Remarks"
                  value={item.remarks}
                  onChange={(e) => handleItemChange(i, "remarks", e.target.value)}
                  className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                <button
                  type="button"
                  onClick={() => removeItem(i)}
                  title="Remove Item"
                  className="text-red-600 text-lg hover:text-red-800 transition transform hover:scale-110"
                >
                  ❌
                </button>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <button
              type="button"
              onClick={addItem}
              className="w-full sm:w-auto px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              + Add Item
            </button>

            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              ✅ Submit
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
