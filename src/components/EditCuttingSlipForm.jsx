import { useState } from "react";

const EditCuttingSlipForm = ({ order, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    productName: order.product || '',
    size: order.size || '',
    density: order.density || '',
    quantity: order.quantity || '',
    remarks: order.remarks || '',
    productRemarks: order.productRemarks || '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(order._id, formData);
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