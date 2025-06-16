import React, { useState, useEffect } from "react";
import Modal from "react-modal";

Modal.setAppElement("#root");

const SlipFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  type,
  selectedOrder,
  selectedSections = {},
}) => {
  const isProduction = type === "production";
  const isPackaging = type === "packaging" || type === "shape-packaging";
  const isShapeOnly = type === "shape-packaging";
  const shouldShowShapeSlip =
    isShapeOnly ||
    (isProduction &&
      (selectedSections.preExpander || selectedSections.handMoulding));
  const showAsDanaSlip =
    isProduction &&
    !selectedSections.shapeMoulding &&
    selectedSections.preExpander;

  const [cuttingFormData, setCuttingFormData] = useState({
  productName: "",
  size: "",
  density: "",
  quantity: "",
  remarks: "",
});


  const [shapeFormData, setShapeFormData] = useState({
    productName: "",
    dryWeight: "",
    quantity: "",
    remarks: "",
  });

  const [packagingFormData, setPackagingFormData] = useState({
    productName: "",
    packagingWeight: "",
    packagingType: "",
    quantity: "",
    remarks: "",
  });

const [danaFormData, setDanaFormData] = useState({
  typeOfRawBlock: "",
 densityValue: "",     // 🧠 for number only (e.g., "21")
  densityType: "",      // 🧠 from button (e.g., "FR")
  recycledDana: "",
  weight: "",
  grade: "",
});



  const [loading, setLoading] = useState(false);

useEffect(() => {
  if (isOpen && selectedOrder) {
    setShapeFormData((prev) => ({
      productName: selectedOrder.product || "",
      dryWeight: prev.dryWeight || selectedOrder.density || "",
      quantity: prev.quantity || selectedOrder.quantity || "",
      remarks: prev.remarks || selectedOrder.remarks || "",
    }));

    setDanaFormData((prev) => ({
      ...prev,
      productName: prev.productName || selectedOrder.product || "",
      quantity: prev.quantity || selectedOrder.quantity || "",
      remarks: prev.remarks || selectedOrder.remarks || "",
      density: prev.density || selectedOrder.density || "",
        densityValue: prev.densityValue || selectedOrder.density?.split(" ")[0] || "",

    }));

    setPackagingFormData((prev) => ({
      productName: selectedOrder.product || "",
      quantity: prev.quantity || selectedOrder.quantity || "",
      remarks: prev.remarks || selectedOrder.remarks || "",
      packagingWeight: prev.packagingWeight || "",
      packagingType: prev.packagingType || "",
    }));

    setCuttingFormData((prev) => ({
      productName: selectedOrder.product || "",
      size: prev.size || selectedOrder.size || "",
      density: prev.density || selectedOrder.density || "",
      quantity: prev.quantity || selectedOrder.quantity || "",
      remarks: prev.remarks || selectedOrder.remarks || "",
    }));
  }
}, [isOpen, selectedOrder]);




  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
     if (type === "production") {
const mergedDanaFormData = {
  ...danaFormData,
  productName: danaFormData.productName || selectedOrder?.product || "",
  quantity: danaFormData.quantity || selectedOrder?.quantity || "",
  remarks: danaFormData.remarks || selectedOrder?.remarks || "",
};




await onSubmit({ cuttingFormData, shapeFormData, danaFormData: mergedDanaFormData });
} else if (type === "shape-packaging") {
        await onSubmit({ shapeFormData, packagingFormData });
      } else if (type === "packaging") {
        await onSubmit({ packagingFormData });
      } else {
        await onSubmit({ cuttingFormData });
      }

      setCuttingFormData({ size: "", density: "", quantity: "", remarks: "" });
      setShapeFormData({
        productName: "",
        dryWeight: "",
        quantity: "",
        remarks: "",
      });
      setPackagingFormData({
        productName: selectedOrder?.product || "",
        packagingWeight: "",
        packagingType: "",
        quantity: "",
        remarks: "",
      });

      onClose();
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCuttingChange = (field, value) => {
    setCuttingFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleShapeChange = (field, value) => {
    setShapeFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handlePackagingChange = (field, value) => {
    setPackagingFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleDanaChange = (field, value) => {
  setDanaFormData((prev) => ({ ...prev, [field]: value }));
};


  return (
    <>
      <Modal
        isOpen={isOpen}
        onRequestClose={onClose}
        contentLabel="Slip Form"
        className="relative bg-white rounded-lg shadow-xl max-w-xl w-full max-h-[90vh] overflow-y-auto mx-4 md:mx-auto mt-16 p-8 border border-gray-200"
        overlayClassName="fixed inset-0 backdrop-blur-sm flex justify-center items-start z-100 bg-grey-100/10"
      >
        <h2 className="text-2xl font-extrabold mb-6 text-gray-900 select-none">
          {isProduction
            ? showAsDanaSlip
              ? "Production Slip Details (Dana + Cutting)"
              : "Production Slip Details (Shape + Cutting)"
            : isPackaging
            ? "Material Packaging Slip"
            : "Cutting Slip Details"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Shape Slip */}
          {shouldShowShapeSlip && (
            <section className="space-y-4">
              <h3 className="text-2xl bg-yellow-200 py-2 text-center font-semibold text-indigo-700 border-b border-indigo-300 pb-2 select-none">
                {showAsDanaSlip ? "Raw Block/Dana Slip" : "Shape Moulding Production Slip/Die Moulding"}
              </h3>
              <label className="font-bold text-xl">Product Name:</label>
              <input
                type="text"
                disabled
                placeholder="Product Name"
                value={
        showAsDanaSlip
          ? danaFormData.productName
          : shapeFormData.productName
      }
      onChange={(e) =>
        showAsDanaSlip
          ? handleDanaChange("productName", e.target.value)
          : handleShapeChange("productName", e.target.value)
      }
                className="w-full bg-gray-100 border border-gray-300 rounded-md px-4 py-3 text-gray-700"
              />
              <label className="font-bold text-xl">
  {showAsDanaSlip ? "Density (Kg/m³)" : "Dry Weight / Density"}
</label>
<input
  type="text"
  placeholder={showAsDanaSlip ? "Density" : "Dry Weight / Density"}
  value={showAsDanaSlip ? danaFormData.density : shapeFormData.dryWeight}
  onChange={(e) =>
    showAsDanaSlip
      ? handleDanaChange("density", e.target.value)
      : handleShapeChange("dryWeight", e.target.value)
  }
  disabled={showAsDanaSlip}  // ⬅️ Disable if Dana Slip
  required
  className="w-full border border-gray-300 rounded-md px-4 py-3 bg-gray-100 text-gray-700"
/>

              <label className="font-bold text-xl">Quantity:</label>
              <input
                type="number"
                placeholder="Quantity"
                 value={
        showAsDanaSlip
          ? danaFormData.quantity
          : shapeFormData.quantity
      }
      onChange={(e) =>
        showAsDanaSlip
          ? handleDanaChange("quantity", e.target.value)
          : handleShapeChange("quantity", e.target.value)
      }
                required
                min={1}
                className="w-full border border-gray-300 rounded-md px-4 py-3"
              />
              <label className="font-bold text-xl">Remarks:</label>
              <textarea
                placeholder="Remarks"
                 value={
        showAsDanaSlip
          ? danaFormData.remarks
          : shapeFormData.remarks
      }
      onChange={(e) =>
        showAsDanaSlip
          ? handleDanaChange("remarks", e.target.value)
          : handleShapeChange("remarks", e.target.value)
      }
                rows={3}
                required
                className="w-full border border-gray-300 rounded-md px-4 py-3 resize-none"
              />
            </section>
          )}
{showAsDanaSlip && (
  <section className="space-y-4">
    <label className="font-bold text-xl">Type of Raw Block:</label>
    <div className="flex flex-wrap gap-2">
      {["With Both Gutka", "Without Gutka", "Bottom Gutka", "Side Gutka", "Thermocol Dana"].map((option) => (
        <label key={option} className="flex items-center gap-1">
          <input
            type="radio"
            name="typeOfRawBlock"
            value={option}
            checked={danaFormData.typeOfRawBlock === option}
            onChange={(e) => handleDanaChange("typeOfRawBlock", e.target.value)}
          />
          {option}
        </label>
      ))}
    </div>
    <input
      type="text"
      placeholder="Custom Raw Block Type"
      value={danaFormData.typeOfRawBlock}
      onChange={(e) => handleDanaChange("typeOfRawBlock", e.target.value)}
      className="w-full border border-gray-300 rounded-md px-4 py-2"
    />

{/* Density Input */}
<label className="font-bold text-xl">Density (Kg/m³):</label>
<div className="flex gap-2 items-center">
  <input
    type="text"
    placeholder="e.g. 21"
    value={danaFormData.densityValue}
    onChange={(e) => {
      const value = e.target.value;
      handleDanaChange("densityValue", value);
      handleDanaChange("density", `${value} ${danaFormData.densityType}`.trim());
    }}
    className="w-1/2 border border-gray-300 rounded-md px-4 py-2"
  />

  <div className="flex flex-wrap gap-2">
    {["FR", "Pink FR", "Non FR", "Pink Non FR"].map((type) => (
      <button
        key={type}
        type="button"
        onClick={() => {
          handleDanaChange("densityType", type);
          handleDanaChange("density", `${danaFormData.densityValue} ${type}`.trim());
        }}
        className={`px-3 py-1 border rounded-md text-sm ${
          danaFormData.densityType === type
            ? "bg-indigo-600 text-white"
            : "bg-white text-gray-800 border-gray-300"
        }`}
      >
        {type}
      </button>
    ))}
  </div>
</div>








    <label className="font-bold text-xl">Recycled Dana:</label>
    <div className="flex gap-4">
      {["30%", "50%", "No"].map((val) => (
        <label key={val} className="flex items-center gap-1">
          <input
            type="radio"
            name="recycledDana"
            value={val}
            checked={danaFormData.recycledDana === val}
            onChange={(e) => handleDanaChange("recycledDana", e.target.value)}
          />
          {val}
        </label>
      ))}
    </div>

    <label className="font-bold text-xl">Weight of Raw Block (kg):</label>
    <input
      type="text"
      placeholder="Weight"
      value={danaFormData.weight}
      onChange={(e) => handleDanaChange("weight", e.target.value)}
      className="w-full border border-gray-300 rounded-md px-4 py-2"
    />

    <label className="font-bold text-xl">Grade of Raw Material:</label>
    <input
      type="text"
      placeholder="Grade"
      value={danaFormData.grade}
      onChange={(e) => handleDanaChange("grade", e.target.value)}
      className="w-full border border-gray-300 rounded-md px-4 py-2"
    />

  
  </section>
)}

          {/* Packaging Slip */}
          {isPackaging && (
            <section className="space-y-4">
              <h3 className="text-2xl bg-yellow-200 py-2 text-center font-semibold text-indigo-700 border-b border-indigo-300 pb-2 select-none">
                Shape Moulding Packaging Slip
              </h3>
              <label className="font-bold text-xl">Product Name:</label>
              <input
                type="text"
                placeholder="Product Name"
                value={packagingFormData.productName}
                className="w-full bg-gray-100 border border-gray-300 rounded-md px-4 py-3 text-gray-700"
              />
              <label className="font-bold text-xl">Quantity:</label>
              <input
                type="number"
                placeholder="Quantity"
                value={packagingFormData.quantity}
                onChange={(e) => handlePackagingChange("quantity", e.target.value)}
                required
                min={1}
                className="w-full border border-gray-300 rounded-md px-4 py-3"
              />
              <label className="font-bold text-xl">Remarks:</label>
              <textarea
                placeholder="Remarks"
                required
                value={packagingFormData.remarks}
                onChange={(e) => handlePackagingChange("remarks", e.target.value)}
                rows={3}
                className="w-full border border-gray-300 rounded-md px-4 py-3 resize-none"
              />
            </section>
          )}

          {/* Cutting Slip */}
          {!isPackaging && (
            <section className="space-y-4">
              <h3 className="text-2xl bg-yellow-200 py-2 text-center font-semibold text-indigo-700 border-b border-indigo-300 pb-2 select-none">
                Cutting Slip
              </h3>
              <label className="font-bold text-xl">Product Name:</label>
<input
  type="text"
  value={cuttingFormData.productName}
  readOnly
  className="w-full bg-gray-100 border border-gray-300 rounded-md px-4 py-3 text-gray-700"
/>

              <label className="font-bold text-xl">Size:</label>
              <input
                type="text"
                placeholder="Size (e.g., 24x18x2 inch)"
                value={cuttingFormData.size}
                onChange={(e) => handleCuttingChange("size", e.target.value)}
                required
                className="w-full border border-gray-300 rounded-md px-4 py-3"
              />
              <label className="font-bold text-xl">Density(kg/m³):</label>
              <input
                type="text"
                placeholder="Density (e.g., 12 Kg/m³)"
                value={cuttingFormData.density}
                onChange={(e) => handleCuttingChange("density", e.target.value)}
                required
                className="w-full border border-gray-300 rounded-md px-4 py-3"
              />
              <label className="font-bold text-xl">Quantity:</label>
              <input
                type="number"
                placeholder="Quantity"
                value={cuttingFormData.quantity}
                onChange={(e) => handleCuttingChange("quantity", e.target.value)}
                required
                min={1}
                className="w-full border border-gray-300 rounded-md px-4 py-3"
              />
              <label className="font-bold text-xl">Remarks:</label>
              <textarea
                placeholder="Remarks"
                value={cuttingFormData.remarks}
                onChange={(e) => handleCuttingChange("remarks", e.target.value)}
                rows={3}
                required
                className="w-full border border-gray-300 rounded-md px-4 py-3 resize-none"
              />
            </section>
          )}

          {/* Footer */}
          <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className={`bg-gray-300 text-gray-800 px-5 py-2 rounded-md hover:bg-gray-400 ${
                loading ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`bg-indigo-600 text-white px-5 py-2 rounded-md hover:bg-indigo-700 ${
                loading ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {loading ? "Saving..." : "Save and Continue"}
            </button>
          </div>
        </form>

        {/* Loader Overlay */}
        {loading && (
          <div className="absolute inset-0 bg-gray-100 bg-opacity-70 flex justify-center items-center z-50 pointer-events-auto">
            <div className="loader ease-linear rounded-full border-8 border-t-8 border-indigo-600 h-16 w-16"></div>
          </div>
        )}
      </Modal>

      {/* Loader CSS */}
      <style jsx>{`
        .loader {
          border-top-color: #4f46e5;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </>
  );
};

export default SlipFormModal;
