import { useState } from "react";

const EditSlipForm = ({ order, type, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    quantity: order.quantity || '',
    remarks: order.remarks || '',
    productRemarks: order.productRemarks || '',
    // Shape-specific fields
    ...(type === 'shape' ? { dryWeight: order.density || '' } : {}),
    // Dana-specific fields
    ...(type === 'dana' ? { 
      typeOfRawBlock: order.typeOfRawBlock || '',
      densityValue: order.density?.split(' ')[0] || '',
      densityType: order.density?.split(' ')[1] || '',
      recycledDana: order.recycledDana || 'No',
      weight: order.weight || '',
      grade: order.grade || '',
      customRawBlock: '' // For custom input
    } : {})
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(order._id, type, formData);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Handle raw block type selection
  const handleRawBlockChange = (value) => {
    if (value === "custom") {
      // When custom is selected, focus on custom input
      setTimeout(() => {
        document.getElementById("customRawBlockInput")?.focus();
      }, 100);
    } else {
      handleChange('typeOfRawBlock', value);
      handleChange('customRawBlock', ''); // Clear custom input when a preset is selected
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Common fields */}
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

      {/* Type-specific fields */}
      {type === 'shape' && (
        <div>
          <label className="block font-semibold mb-1">Dry Weight / Density</label>
          <input
            type="text"
            value={formData.dryWeight}
            onChange={(e) => handleChange('dryWeight', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded"
          />
        </div>
      )}

      {type === 'dana' && (
        <>
          <div>
            <label className="block font-semibold mb-1">Density Value</label>
            <input
              type="text"
              value={formData.densityValue}
              onChange={(e) => handleChange('densityValue', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded"
              placeholder="e.g., 21"
            />
          </div>
          
          <div>
            <label className="block font-semibold mb-1">Density Type</label>
            <select
              value={formData.densityType}
              onChange={(e) => handleChange('densityType', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded"
            >
              <option value="">Select Type</option>
              <option value="FR">FR</option>
              <option value="Non FR">Non FR</option>
              <option value="Pink FR">Pink FR</option>
              <option value="Pink Non FR">Pink Non FR</option>
              <option value="ND">ND</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold mb-1">Type of Raw Block</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
              {[
                "With Both Gutka",
                "Without Both Gutka", 
                "Bottom Gutka",
                "Side Gutka",
                "Thermocol Dana"
              ].map(option => (
                <label key={option} className="flex items-center p-2 border rounded hover:bg-gray-50">
                  <input
                    type="radio"
                    name="typeOfRawBlock"
                    value={option}
                    checked={formData.typeOfRawBlock === option}
                    onChange={(e) => handleRawBlockChange(e.target.value)}
                    className="mr-2"
                  />
                  {option}
                </label>
              ))}
              
              <label className="flex items-center p-2 border rounded hover:bg-gray-50">
                <input
                  type="radio"
                  name="typeOfRawBlock"
                  value="custom"
                  checked={![
                    "With Both Gutka",
                    "Without Both Gutka", 
                    "Bottom Gutka",
                    "Side Gutka",
                    "Thermocol Dana"
                  ].includes(formData.typeOfRawBlock) && formData.typeOfRawBlock !== ""}
                  onChange={(e) => handleRawBlockChange(e.target.value)}
                  className="mr-2"
                />
                Other (specify)
              </label>
            </div>
            
            {/* Custom input for other raw block types */}
            {(![
              "With Both Gutka",
              "Without Both Gutka", 
              "Bottom Gutka",
              "Side Gutka",
              "Thermocol Dana"
            ].includes(formData.typeOfRawBlock) && formData.typeOfRawBlock !== "") && (
              <div className="mt-2">
                <input
                  id="customRawBlockInput"
                  type="text"
                  value={formData.typeOfRawBlock}
                  onChange={(e) => handleChange('typeOfRawBlock', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded"
                  placeholder="Enter custom raw block type"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block font-semibold mb-1">Recycled Dana</label>
            <div className="flex space-x-4">
              {["30%", "50%", "No"].map(option => (
                <label key={option} className="flex items-center">
                  <input
                    type="radio"
                    name="recycledDana"
                    value={option}
                    checked={formData.recycledDana === option}
                    onChange={(e) => handleChange('recycledDana', e.target.value)}
                    className="mr-2"
                  />
                  {option}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-1">Weight of Raw Block (kg)</label>
            <input
              type="text"
              value={formData.weight}
              onChange={(e) => handleChange('weight', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded"
              placeholder="Weight in kg"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">Grade of Raw Material</label>
            <input
              type="text"
              value={formData.grade}
              onChange={(e) => handleChange('grade', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded"
              placeholder="Grade information"
            />
          </div>
        </>
      )}

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

export default EditSlipForm;