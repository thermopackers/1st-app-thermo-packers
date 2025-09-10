import { useState } from "react";

const EditDanaBeadsSlipForm = ({ order, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    productName: order.product || '',
    density: order.density || '',
    quantity: order.quantity || '',
    recycleDana: order.danaBeadsSlip?.form?.recycleDana || 'no',
    nextGrade: order.danaBeadsSlip?.form?.nextGrade || '',
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
        <label className="block font-semibold mb-1">Density</label>
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
        <label className="block font-semibold mb-1">Recycle Dana</label>
        <select
          value={formData.recycleDana}
          onChange={(e) => handleChange('recycleDana', e.target.value)}
          className="w-full p-2 border border-gray-300 rounded"
        >
          <option value="no">No</option>
          <option value="30%">30%</option>
          <option value="50%">50%</option>
        </select>
      </div>

      <div>
        <label className="block font-semibold mb-1">Next Grade of Raw Material</label>
        <input
          type="text"
          value={formData.nextGrade}
          onChange={(e) => handleChange('nextGrade', e.target.value)}
          className="w-full p-2 border border-gray-300 rounded"
          placeholder="Enter next grade"
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
export default EditDanaBeadsSlipForm;