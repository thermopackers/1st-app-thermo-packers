import { useState } from "react";

const EditCuttingSlipForm = ({ order, onClose, onSave }) => {
  // Get existing values from order.cuttingSlip if available
  const existingData = order.cuttingSlip?.editedData || order.cuttingSlip?.products?.[0] || {};
  
  const [formData, setFormData] = useState({
    productName: existingData.productName || order.product || '',
    size: existingData.size || order.size || '',
    density: existingData.density || order.density || '',
    quantity: existingData.quantity || order.quantity || '',
    remarks: existingData.remarks || order.remarks || '',
    productRemarks: existingData.productRemarks || order.productRemarks || '',
  });

// In EditCuttingSlipForm.jsx - make sure the form is sending the correct data
const handleSubmit = (e) => {
  e.preventDefault();
  console.log("📤 Submitting edit with:", {
    size: formData.size,
    density: formData.density,
    quantity: formData.quantity,
    remarks: formData.remarks,
    productRemarks: formData.productRemarks
  });
  onSave(order._id, {
    size: formData.size,
    density: formData.density,
    quantity: formData.quantity,
    remarks: formData.remarks,
    productRemarks: formData.productRemarks
  });
};

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block font-semibold mb-1">Product Name</label>
        <input
          type="text"
          value={formData.productName}
          onChange={(e) => handleChange('productName', e.target.value)}
          className="w-full p-2 border border-gray-300 rounded"
          required
        />
      </div>

      <div>
        <label className="block font-semibold mb-1">Size</label>
        <input
          type="text"
          value={formData.size}
          onChange={(e) => handleChange('size', e.target.value)}
          className="w-full p-2 border border-gray-300 rounded"
          placeholder="e.g., 24x18x2 inch"
        />
      </div>

      <div>
        <label className="block font-semibold mb-1">Density (kg/m³)</label>
        <input
          type="text"
          value={formData.density}
          onChange={(e) => handleChange('density', e.target.value)}
          className="w-full p-2 border border-gray-300 rounded"
          placeholder="e.g., 12 Kg/m³"
        />
      </div>

      <div>
        <label className="block font-semibold mb-1">Quantity</label>
        <input
          type="number"
          value={formData.quantity}
          onChange={(e) => handleChange('quantity', e.target.value)}
          className="w-full p-2 border border-gray-300 rounded"
          required
        />
      </div>

      <div>
        <label className="block font-semibold mb-1">Remarks</label>
        <textarea
          value={formData.remarks}
          onChange={(e) => handleChange('remarks', e.target.value)}
          className="w-full p-2 border border-gray-300 rounded"
          rows={3}
        />
      </div>

      <div>
        <label className="block font-semibold mb-1">Product Remarks</label>
        <textarea
          value={formData.productRemarks}
          onChange={(e) => handleChange('productRemarks', e.target.value)}
          className="w-full p-2 border border-gray-300 rounded"
          rows={3}
          placeholder="Enter product remarks here..."
        />
      </div>

      <div className="flex justify-end space-x-4 pt-4">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Save Changes
        </button>
      </div>
    </form>
  );
};

export default EditCuttingSlipForm;