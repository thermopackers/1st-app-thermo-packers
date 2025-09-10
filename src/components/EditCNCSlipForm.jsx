import { useState } from "react";

const EditCNCSlipForm = ({ order, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    productName: order.product || '',
    size: order.size || '',
    quantity: order.quantity || '',
    drawingName: order.cncSlip?.drawingName || '',
    remarks: order.remarks || '',
    productRemarks: order.productRemarks || '',
  });

  const [drawingFiles, setDrawingFiles] = useState([]);
  const [existingDrawings, setExistingDrawings] = useState(order.cncSlip?.drawingFiles || []);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(order._id, {
      ...formData,
      drawingFiles: [...existingDrawings, ...drawingFiles.map(file => URL.createObjectURL(file))]
    });
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDrawingFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    setDrawingFiles((prev) => [...prev, ...files]);
  };

  const handleRemoveDrawingFile = (index, isExisting = false) => {
    if (isExisting) {
      setExistingDrawings(prev => prev.filter((_, i) => i !== index));
    } else {
      setDrawingFiles(prev => prev.filter((_, i) => i !== index));
    }
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
        <label className="block font-semibold mb-1">Drawing Name</label>
        <input
          type="text"
          value={formData.drawingName}
          onChange={(e) => handleChange('drawingName', e.target.value)}
          className="w-full p-2 border border-gray-300 rounded"
          placeholder="Drawing reference name"
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

      <div>
        <label className="block font-semibold mb-1">Drawing Files</label>
        
        {/* Existing drawings */}
        {existingDrawings.length > 0 && (
          <div className="mb-4">
            <h3 className="text-sm font-medium mb-2">Existing Drawings:</h3>
            <div className="flex flex-wrap gap-2">
              {existingDrawings.map((url, index) => (
                <div key={index} className="relative border p-2 rounded bg-gray-100">
                  <span
                    onClick={() => handleRemoveDrawingFile(index, true)}
                    className="absolute top-0 right-1 text-red-600 cursor-pointer text-xl font-bold"
                  >
                    ×
                  </span>
                  <p className="text-sm max-w-[120px] truncate">{url.split('/').pop()}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* New drawings */}
        <input
          type="file"
          multiple
          accept="image/*,.pdf,.dxf,.dwg"
          onChange={handleDrawingFileChange}
          className="w-full p-2 border border-gray-300 rounded"
        />
        
        {/* Preview new files */}
        <div className="flex flex-wrap gap-2 mt-2">
          {drawingFiles.map((file, index) => (
            <div key={index} className="relative border p-2 rounded bg-gray-100">
              <span
                onClick={() => handleRemoveDrawingFile(index)}
                className="absolute top-0 right-1 text-red-600 cursor-pointer text-xl font-bold"
              >
                ×
              </span>
              <p className="text-sm max-w-[120px] truncate">{file.name}</p>
            </div>
          ))}
        </div>
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

export default EditCNCSlipForm;