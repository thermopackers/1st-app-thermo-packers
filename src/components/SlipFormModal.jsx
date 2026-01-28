import React, { useState, useEffect } from "react";
import Modal from "react-modal";
import imageCompression from "browser-image-compression";
import ShowInternalImagesButton from "./ShowInternalImagesButton";
import axiosInstance from "../axiosInstance";
import Swal from 'sweetalert2';

Modal.setAppElement("#root");

const SlipFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  type,
  selectedOrder,
  selectedSections = {},
    products = [], 
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
const [cncFormData, setCNCFormData] = useState({
  productName: "",
  size: "",
  quantity: "",
  drawingName: "",
});
const [selectedProductFiles, setSelectedProductFiles] = useState([]);
const [showGradeDropdown, setShowGradeDropdown] = useState(false);
const [gradeProducts, setGradeProducts] = useState([]);
const [filteredGrades, setFilteredGrades] = useState([]);
const [danaFormData, setDanaFormData] = useState({
  typeOfRawBlock: "",
 densityValue: "",     // 🧠 for number only (e.g., "21")
  densityType: "",      // 🧠 from button (e.g., "FR")
  recycledDana: "",
  weight: "",
  grade: "",
});
// Fetch Thermocol Dana Raw Material products for grade dropdown
// Fetch Thermocol Dana Raw Material products for grade dropdown
useEffect(() => {
  const fetchGradeProducts = async () => {
    try {
      // First, get all categories to find the correct category ID
      const categoriesResponse = await axiosInstance.get('/categories');
      const categories = categoriesResponse.data || [];
      
      // Find the category with name "Thermocol Dana Raw Material"
      const danaCategory = categories.find(cat => 
        cat.name === "Thermocol Dana Raw Material"
      );
      
      if (danaCategory) {
        // Now fetch products with this category ID
        const response = await axiosInstance.get(`/purchase-products?category=${danaCategory._id}`);
        setGradeProducts(response.data.data || []);
        setFilteredGrades(response.data.data || []);
      } else {
        console.warn('Thermocol Dana Raw Material category not found');
        setGradeProducts([]);
        setFilteredGrades([]);
      }
    } catch (error) {
      console.error('Error fetching grade products:', error);
      setGradeProducts([]);
      setFilteredGrades([]);
    }
  };
  
  if (isOpen && type === "dana") {
    fetchGradeProducts();
  }
}, [isOpen, type]);
// Filter grade products based on search input
useEffect(() => {
  if (danaFormData.grade) {
    const filtered = gradeProducts.filter(product =>
      product.name.toLowerCase().includes(danaFormData.grade.toLowerCase()) ||
      (product.description && product.description.toLowerCase().includes(danaFormData.grade.toLowerCase()))
    );
    setFilteredGrades(filtered);
  } else {
    setFilteredGrades(gradeProducts);
  }
}, [danaFormData.grade, gradeProducts]);
// Close dropdown when clicking outside
useEffect(() => {
  const handleClickOutside = (event) => {
    if (!event.target.closest('.grade-dropdown-container')) {
      setShowGradeDropdown(false);
    }
  };

  if (showGradeDropdown) {
    document.addEventListener('mousedown', handleClickOutside);
  }

  return () => {
    document.removeEventListener('mousedown', handleClickOutside);
  };
}, [showGradeDropdown]);
const handleCNCChange = (field, value) => {
  setCNCFormData({ ...cncFormData, [field]: value });
};
const [missingFields, setMissingFields] = useState([]);
const inputClass = (field, base = "") =>
  `w-full border rounded-md px-4 py-3 ${base} ${
    missingFields.includes(field) ? "border-red-500" : "border-gray-300"
  }`;
const [drawingFiles, setDrawingFiles] = useState([]);
const [danaBeadsFormData, setDanaBeadsFormData] = useState({
  productName: "",
  density: "",
  quantity: "",
  recycleDana: "no",   // default
  nextGrade: "",
  remarks: "",
});

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





  const [loading, setLoading] = useState(false);

useEffect(() => {
  if (isOpen && selectedOrder) {
    // Shape Slip
    setShapeFormData({
      productName: selectedOrder.product || "",
      dryWeight: selectedOrder.density || "",
      quantity: selectedOrder.quantity || "",
      remarks: selectedOrder.remarks || "",
    });

    // Dana Slip
    const densityParts = selectedOrder.density?.split(" ") || ["", ""];
    setDanaFormData({
      productName: selectedOrder.product || "",
      quantity: selectedOrder.quantity || "",
      remarks: selectedOrder.remarks || "",
      density: selectedOrder.density || "",
      densityValue: densityParts[0],
      densityType: densityParts[1],
      typeOfRawBlock: "",
      recycledDana: "",
      weight: "",
      grade: "",
    });

    // Packaging Slip
    setPackagingFormData({
      productName: selectedOrder.product || "",
      quantity: selectedOrder.quantity || "",
      remarks: selectedOrder.remarks || "",
      packagingWeight: "",
      packagingType: "",
    });

    // Cutting Slip
    setCuttingFormData({
      productName: selectedOrder.product || "",
      size: selectedOrder.size || "",
      density: selectedOrder.density || "",
      quantity: selectedOrder.quantity || "",
      remarks: selectedOrder.remarks || "",
    });

    // CNC Slip
    setCNCFormData({
      productName: selectedOrder.product || "",
      size: selectedOrder.size || "",
      quantity: selectedOrder.quantity || "",
      drawingName: "",
      remarks: selectedOrder.remarks || "",
    });
    // Dana/Beads Slip
setDanaBeadsFormData({
  productName: selectedOrder.product || "",
  density: selectedOrder.density || "",
  quantity: selectedOrder.quantity || "",
  recycleDana: "no",
  nextGrade: "",
  remarks: selectedOrder.remarks || "",
});
  }
}, [isOpen, selectedOrder]);




const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);

  const missing = [];

  const checkMissing = (fields, data) => {
    fields.forEach((field) => {
      if (!data[field]?.toString().trim()) {
        missing.push(field);
      }
    });
  };

  if (type === "dana") {
    checkMissing(
      [
        "typeOfRawBlock",
        "densityValue",
        "densityType",
        "recycledDana",
        "weight",
        "grade",
        "quantity",
        "remarks",
      ],
      danaFormData
    );
  } else if (type === "production") {
    checkMissing(["dryWeight", "quantity", "remarks"], shapeFormData);
  } else if (type === "dispatch") {
    checkMissing(["size", "density", "quantity", "remarks"], cuttingFormData);
  } else if (type === "cnc-slip") {
    checkMissing(
      ["productName", "size", "quantity", "remarks"],
      cncFormData
    );
    
  } else if (type === "packaging" || type === "shape-packaging") {
    checkMissing(["quantity", "remarks"], packagingFormData);
  } else if (type === "dana-beads") {
  checkMissing(["productName", "density", "quantity"], danaBeadsFormData);
}


  if (missing.length > 0) {
    setMissingFields(missing); // you must declare this state: const [missingFields, setMissingFields] = useState([]);
    setLoading(false);
    return;
  }

  setMissingFields([]); // clear on valid

  try {
    if (type === "dana") {
      const finalDensity =
        danaFormData.densityValue && danaFormData.densityType
          ? `${danaFormData.densityValue} ${danaFormData.densityType}`
          : "";

      await onSubmit({
        danaFormData: {
          ...danaFormData,
          density: finalDensity,
          productName: selectedOrder.product || "",
        },
      });
    } else if (type === "production") {
      await onSubmit({ shapeFormData });
    } else if (type === "dispatch") {
      await onSubmit({ cuttingFormData });
    } else if (type === "cnc-slip") {
     const uploadedUrls = [];

for (const file of drawingFiles) {
  let compressedFile = file;

  // ✅ Compress if image
  if (file.type.startsWith("image/")) {
    try {
      compressedFile = await imageCompression(file, {
        maxSizeMB: 1, // Max 1MB (adjust if needed)
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      });
    } catch (err) {
      console.warn("⚠️ Image compression failed, uploading original file.");
    }
  }

  const formData = new FormData();
  formData.append("file", compressedFile); // ✅ Use compressed version
  formData.append("upload_preset", "cnc_upload_preset");
  formData.append("folder", "cnc_drawings");
  formData.append("cloud_name", "dcr8k5amk");

  const res = await fetch(`https://api.cloudinary.com/v1_1/dcr8k5amk/auto/upload`, {
    method: "POST",
    body: formData,
  });

  const data = await res.json();
  if (data.secure_url) {
    uploadedUrls.push(data.secure_url);
  }
}


      await onSubmit({
        cncFormData: {
          ...cncFormData,
          drawingFiles: uploadedUrls,
        },
      });
    } else if (type === "packaging" || type === "shape-packaging") {
      await onSubmit({ packagingFormData });
    } else if (type === "dana-beads") {
  await onSubmit({ danaBeadsFormData });
}

    // Reset fields after submit
    setCuttingFormData({ productName: "", size: "", density: "", quantity: "", remarks: "" });
    setShapeFormData({ productName: "", dryWeight: "", quantity: "", remarks: "" });
    setPackagingFormData({
      productName: selectedOrder?.product || "",
      packagingWeight: "",
      packagingType: "",
      quantity: "",
      remarks: "",
    });
    setDanaFormData({
      typeOfRawBlock: "",
      densityValue: "",
      densityType: "",
      recycledDana: "",
      weight: "",
      grade: "",
    });
    setCNCFormData({
      productName: "",
      size: "",
      quantity: "",
      drawingName: "",
            remarks: "",
    });
    setDanaBeadsFormData({
  productName: "",
  density: "",
  quantity: "",
  recycleDana: "no",
  nextGrade: "",
  remarks: "",
});
    setDrawingFiles([]); // ✅ Reset drawing files
    onClose();
  } catch (error) {
    console.error("❌ Error submitting form:", error);
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

const handleDrawingFileChange = (e) => {
  const files = Array.from(e.target.files || []);
  setDrawingFiles((prev) => [...prev, ...files]);
};

const handleRemoveDrawingFile = (index) => {
  setDrawingFiles((prev) => prev.filter((_, i) => i !== index));
};

  const product =
    products?.find((p) => p.name === selectedOrder?.product) || null;

    const handleFilePreview = (file, fileName) => {
  const fileUrl = typeof file === "string" ? file : file?.url || "";
  
  if (!fileUrl) {
    Swal.fire({
      icon: 'error',
      title: 'File Error',
      text: 'File URL not found',
    });
    return;
  }

  const isImage = fileUrl.match(/\.(jpeg|jpg|png|gif|webp)$/i);
  const isPdf = fileUrl.match(/\.pdf$/i);

  if (isImage) {
    Swal.fire({
      imageUrl: fileUrl,
      imageAlt: fileName || "File Preview",
      showCloseButton: true,
      showConfirmButton: false,
      width: "auto",
      background: "#f9fafb",
      customClass: {
        popup: "rounded-xl shadow-lg",
      },
    });
  } else if (isPdf) {
    Swal.fire({
      title: fileName || "PDF Preview",
      html: `<iframe src="${fileUrl}" width="100%" height="500px" style="border:none;"></iframe>`,
      width: "80%",
      showCloseButton: true,
      showConfirmButton: false,
      background: "#f9fafb",
      customClass: {
        popup: "rounded-xl shadow-lg",
      },
    });
  } else {
    Swal.fire({
      title: fileName || "File Preview",
      html: `
        <div class="text-center py-4">
          <div class="text-4xl mb-2">📎</div>
          <p class="text-gray-600 mb-4">This file type cannot be previewed</p>
          <a href="${fileUrl}" target="_blank" class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 no-underline">
            Download File
          </a>
        </div>
      `,
      showCloseButton: true,
      showConfirmButton: false,
      background: "#f9fafb",
      customClass: {
        popup: "rounded-xl shadow-lg",
      },
    });
  }
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
  {type === "dana"
    ? "Raw Block/Dana Slip"
    : type === "production"
    ? "Shape Moulding Production Slip"
    : type === "packaging"
    ? "Material Packaging Slip"
    : type === "cnc-slip"
    ? "CNC Slip"
    : type === "dana-beads"
    ? "Dana/Bead Order Slip"
    : "Cutting Slip Details"}
</h2>


        <form onSubmit={handleSubmit} className="space-y-8">
       {/* Dana Slip */}
{type === "dana" && (
  <>
    <section className="space-y-4">
      <h3 className="text-2xl bg-yellow-200 py-2 text-center font-semibold text-indigo-700 border-b border-indigo-300 pb-2 select-none">
        Raw Block/Dana Slip
      </h3>

     <label className="font-bold text-xl">Product Name:</label>
<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
  <input
    type="text"
    disabled
    placeholder="Product Name"
    value={danaFormData.productName}
    onChange={(e) => handleDanaChange("productName", e.target.value)}
    className="flex-1 bg-gray-100 border border-gray-300 rounded-md px-4 py-3 text-gray-700"
  />
  <ShowInternalImagesButton product={product} />
</div>


      {/* <label className="font-bold text-xl">Density (Kg/m³):</label>
      <input
        type="text"
        placeholder="Density"
        value={danaFormData.density}
        onChange={(e) => handleDanaChange("density", e.target.value)}
        disabled
        required
        className="w-full border border-gray-300 rounded-md px-4 py-3 bg-gray-100 text-gray-700"
      /> */}

      <label className="font-bold text-xl">Quantity:</label>
      <input
  type="number"
  placeholder="Quantity"
  value={danaFormData.quantity}
  onChange={(e) => handleDanaChange("quantity", e.target.value)}
  className={inputClass("quantity")}
/>

      <label className="font-bold text-xl">Remarks:</label>
   <textarea
  placeholder="Remarks"
  value={danaFormData.remarks}
  onChange={(e) => handleDanaChange("remarks", e.target.value)}
  rows={3}
  className={inputClass("remarks", "resize-none")}
/>
    </section>

    <section className="space-y-4 pt-6">
      <label className="font-bold text-xl">Type of Raw Block:</label>
      <div className="flex flex-wrap gap-2">
        {["With Both Gutka", "Without Both Gutka", "Bottom Gutka", "Side Gutka", "Thermocol Dana"].map((option) => (
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
  className={inputClass("typeOfRawBlock")}
/>

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
  className={inputClass("densityValue")}
/>

        <div className="flex flex-wrap gap-2">
        {["FR", "Pink FR", "Non FR", "ND", "Pink Non FR"].map((type) => (
  <button
    key={type}
    type="button"
    onClick={() => {
      handleDanaChange("densityType", type);
      handleDanaChange(
        "density",
        `${danaFormData.densityValue} ${type}`.trim()
      );
    }}
    className={`px-3 py-1 border rounded-md text-sm ${
      danaFormData.densityType === type
        ? "bg-indigo-600 text-white"
        : "bg-white text-gray-800 border-gray-300"
    } ${missingFields.includes("densityType") ? "ring-2 ring-red-500" : ""}`}
  >
    {type}
  </button>
))}

        </div>
      </div>

     <label className="font-bold text-xl">Recycled Dana:</label>
<div className="flex flex-wrap gap-4">
  {["30%", "50%", "No"].map((val) => (
    <label
      key={val}
      className={`flex items-center gap-1 px-2 py-1 rounded-md ${
        missingFields.includes("recycledDana") ? "ring-2 ring-red-500" : ""
      }`}
    >
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
  className={inputClass("weight")}
/>

  <label className="font-bold text-xl">Grade of Raw Material:</label>
<div className="relative grade-dropdown-container">
  <input
    type="text"
    placeholder="Search or select grade..."
    value={danaFormData.grade}
    onChange={(e) => {
      handleDanaChange("grade", e.target.value);
      setShowGradeDropdown(true);
    }}
    onFocus={() => setShowGradeDropdown(true)}
    className={inputClass("grade")}
  />
  
  {showGradeDropdown && (
    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
      {filteredGrades.length > 0 ? (
        filteredGrades.map((product) => (
          <div
            key={product._id}
            className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-200"
            onClick={() => {
              handleDanaChange("grade", product.name);
              setShowGradeDropdown(false);
              setSelectedProductFiles(product.files || []); // Store files for display
            }}
          >
            <div className="font-medium">{product.name}</div>
            {product.description && (
              <div className="text-sm text-gray-500 truncate">
                {product.description}
              </div>
            )}
          </div>
        ))
      ) : (
        <div className="px-4 py-2 text-gray-500">
          {gradeProducts.length === 0 ? 'Loading products...' : 'No products found'}
        </div>
      )}
    </div>
  )}
</div>

{/* Display files for selected product */}
{selectedProductFiles.length > 0 && (
  <div className="mt-4">
    <label className="font-bold text-xl mb-2 block">Product Files:</label>
    <div className="flex flex-wrap gap-3">
      {selectedProductFiles.map((file, index) => {
        const fileUrl = typeof file === "string" ? file : file?.url || "";
        const isImage = fileUrl.match(/\.(jpeg|jpg|png|gif|webp)$/i);
        const isPdf = fileUrl.match(/\.pdf$/i);
        const fileName = typeof file === "string" 
          ? `File ${index + 1}` 
          : file?.filename || `File ${index + 1}`;

        return (
          <div
            key={index}
            className="relative group cursor-pointer border rounded-lg p-2 bg-gray-50 hover:bg-gray-100 transition-all duration-200"
            onClick={() => handleFilePreview(file, fileName)}
          >
            {/* File Preview Thumbnail */}
            <div className="w-16 h-16 flex items-center justify-center bg-white rounded border">
              {isImage ? (
                <img
                  src={fileUrl}
                  alt={fileName}
                  className="w-full h-full object-cover rounded"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "/broken-image.png";
                  }}
                />
              ) : isPdf ? (
                <div className="text-center">
                  <div className="text-2xl text-red-600">📄</div>
                  <div className="text-xs mt-1 text-gray-600">PDF</div>
                </div>
              ) : (
                <div className="text-center">
                  <div className="text-2xl text-blue-600">📎</div>
                  <div className="text-xs mt-1 text-gray-600">File</div>
                </div>
              )}
            </div>
            
            {/* File Name */}
            <div className="mt-2 text-xs text-gray-700 truncate max-w-[80px]">
              {fileName}
            </div>
            
            {/* Hover effect */}
            <div className="absolute inset-0 bg-blue-500 bg-opacity-10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
              <span className="text-blue-600 font-semibold text-sm">View</span>
            </div>
          </div>
        );
      })}
    </div>
  </div>
)}
{selectedProductFiles.length > 0 && (
  <div className="mt-2">
    <button
      type="button"
      onClick={() => setSelectedProductFiles([])}
      className="text-sm text-red-600 hover:text-red-800 underline"
    >
      Clear Files
    </button>
  </div>
)}
    </section>
  </>
)}

{/* Shape Moulding Slip */}
{type === "production" && (
  <section className="space-y-4">
    <h3 className="text-2xl bg-yellow-200 py-2 text-center font-semibold text-indigo-700 border-b border-indigo-300 pb-2 select-none">
      Shape Moulding Production Slip / Die Moulding
    </h3>

   <label className="font-bold text-xl">Product Name:</label>
<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
  <input
    type="text"
    disabled
    value={shapeFormData.productName}
    onChange={(e) => handleShapeChange("productName", e.target.value)}
    className="flex-1 bg-gray-100 border border-gray-300 rounded-md px-4 py-3 text-gray-700"
  />
  <ShowInternalImagesButton product={product} />
</div>


    <label className="font-bold text-xl">Dry Weight / Density:</label>
   <input
  type="text"
  placeholder="Dry Weight / Density"
  value={shapeFormData.dryWeight}
  onChange={(e) => handleShapeChange("dryWeight", e.target.value)}
  className={inputClass("dryWeight")}
/>

    <label className="font-bold text-xl">Quantity:</label>
   <input
  type="number"
  placeholder="Quantity"
  value={shapeFormData.quantity}
  onChange={(e) => handleShapeChange("quantity", e.target.value)}
  className={inputClass("quantity")}
/>

    <label className="font-bold text-xl">Remarks:</label>
 <textarea
  placeholder="Remarks"
  value={shapeFormData.remarks}
  onChange={(e) => handleShapeChange("remarks", e.target.value)}
  rows={3}
  className={inputClass("remarks", "resize-none")}
/>
  </section>
)}

{/* Dana/Beads Slip */}
{type === "dana-beads" && (
  <section className="space-y-4">
    <h3 className="text-2xl bg-yellow-200 py-2 text-center font-semibold text-indigo-700 border-b border-indigo-300 pb-2">
      Dana/Bead Order Slip
    </h3>

    <label className="font-bold text-xl">Product Name:</label>
<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
  <input
    type="text"
    disabled
    value={danaBeadsFormData.productName}
    onChange={(e) =>
      setDanaBeadsFormData({ ...danaBeadsFormData, productName: e.target.value })
    }
    className={inputClass("productName")}
  />
  <ShowInternalImagesButton product={product} />
</div>


    <label className="font-bold text-xl">Density:</label>
    <input
      type="text"
      value={danaBeadsFormData.density}
      onChange={(e) =>
        setDanaBeadsFormData({ ...danaBeadsFormData, density: e.target.value })
      }
      className={inputClass("density")}
    />

    <label className="font-bold text-xl">Quantity:</label>
    <input
      type="number"
      value={danaBeadsFormData.quantity}
      onChange={(e) =>
        setDanaBeadsFormData({ ...danaBeadsFormData, quantity: e.target.value })
      }
      className={inputClass("quantity")}
    />

    <label className="font-bold text-xl">Recycle Dana:</label>
    <select
      value={danaBeadsFormData.recycleDana}
      onChange={(e) =>
        setDanaBeadsFormData({ ...danaBeadsFormData, recycleDana: e.target.value })
      }
      className="w-full border border-gray-300 rounded-md px-4 py-3"
    >
      <option value="30%">30%</option>
      <option value="50%">50%</option>
      <option value="no">No</option>
    </select>

    <label className="font-bold text-xl">Grade of Raw Material / Thermocol Dana:</label>
    <input
      type="text"
      value={danaBeadsFormData.nextGrade}
      onChange={(e) =>
        setDanaBeadsFormData({ ...danaBeadsFormData, nextGrade: e.target.value })
      }
      className={inputClass("nextGrade")}
    />

    <label className="font-bold text-xl">Remarks:</label>
    <textarea
      value={danaBeadsFormData.remarks}
      onChange={(e) =>
        setDanaBeadsFormData({ ...danaBeadsFormData, remarks: e.target.value })
      }
      rows={3}
      className={inputClass("remarks", "resize-none")}
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
<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
  <input
    type="text"
    placeholder="Product Name"
    value={packagingFormData.productName}
    className="flex-1 bg-gray-100 border border-gray-300 rounded-md px-4 py-3 text-gray-700"
  />
  <ShowInternalImagesButton product={product} />
</div>

              <label className="font-bold text-xl">Quantity:</label>
             <input
  type="number"
  placeholder="Quantity"
  value={packagingFormData.quantity}
  onChange={(e) => handlePackagingChange("quantity", e.target.value)}
  className={inputClass("quantity")}
/>
              <label className="font-bold text-xl">Remarks:</label>
              <textarea
  placeholder="Remarks"
  value={packagingFormData.remarks}
  onChange={(e) => handlePackagingChange("remarks", e.target.value)}
  rows={3}
  className={inputClass("remarks", "resize-none")}
/>
            </section>
          )}

          {/* Cutting Slip */}
          {type === "dispatch" && (
            <section className="space-y-4">
              <h3 className="text-2xl bg-yellow-200 py-2 text-center font-semibold text-indigo-700 border-b border-indigo-300 pb-2 select-none">
                Cutting Slip
              </h3>
              <label className="font-bold text-xl">Product Name:</label>
<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
  <input
    type="text"
    value={cuttingFormData.productName}
    readOnly
    className="flex-1 bg-gray-100 border border-gray-300 rounded-md px-4 py-3 text-gray-700"
  />
  <ShowInternalImagesButton product={product} />
</div>


              <label className="font-bold text-xl">Size:</label>
              <input
  type="text"
  placeholder="Size (e.g., 24x18x2 inch)"
  value={cuttingFormData.size}
  onChange={(e) => handleCuttingChange("size", e.target.value)}
  className={inputClass("size")}
/>
              <label className="font-bold text-xl">Density(kg/m³):</label>
             <input
  type="text"
  placeholder="Density (e.g., 12 Kg/m³)"
  value={cuttingFormData.density}
  onChange={(e) => handleCuttingChange("density", e.target.value)}
  className={inputClass("density")}
/>
              <label className="font-bold text-xl">Quantity:</label>
             <input
  type="number"
  placeholder="Quantity"
  value={cuttingFormData.quantity}
  onChange={(e) => handleCuttingChange("quantity", e.target.value)}
  className={inputClass("quantity")}
/>
              <label className="font-bold text-xl">Remarks:</label>
             <textarea
  placeholder="Remarks"
  value={cuttingFormData.remarks}
  onChange={(e) => handleCuttingChange("remarks", e.target.value)}
  rows={3}
  className={inputClass("remarks", "resize-none")}
/>
            </section>
          )}
{type === "cnc-slip" && (
  <section className="space-y-4">
   <label className="font-bold text-xl">Product Name:</label>
<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
  <input
    type="text"
    value={cncFormData.productName}
    onChange={(e) => handleCNCChange("productName", e.target.value)}
    className={inputClass("productName")}
  />
  <ShowInternalImagesButton product={product} />
</div>

    <label className="font-bold text-xl">Size:</label>
  <input
  type="text"
  value={cncFormData.size}
  onChange={(e) => handleCNCChange("size", e.target.value)}
  className={inputClass("size")}
/>
    <label className="font-bold text-xl">Quantity:</label>
  <input
  type="number"
  value={cncFormData.quantity}
  onChange={(e) => handleCNCChange("quantity", e.target.value)}
  className={inputClass("quantity")}
/>
    <label className="font-bold text-xl">Drawing Name:</label>
  
<input
  type="text"
  value={cncFormData.drawingName}
  onChange={(e) => handleCNCChange("drawingName", e.target.value)}
  className={inputClass("drawingName")}
/>
<label className="font-bold text-xl">Upload Drawings:</label>
<input
  type="file"
  multiple
  accept="*"
  onChange={handleDrawingFileChange}
  className="w-full border border-gray-300 rounded-md px-4 py-3"
/>

{/* Preview UI */}
<div className="flex flex-wrap gap-2 mt-2">
  {drawingFiles.map((file, idx) => (
    <div key={idx} className="relative border p-2 rounded bg-gray-100">
      <span
        onClick={() => handleRemoveDrawingFile(idx)}
        className="absolute top-0 right-1 text-red-600 cursor-pointer text-xl font-bold"
      >
        ×
      </span>
      <p className="text-sm max-w-[120px] truncate">{file.name}</p>
    </div>
  ))}
</div>

    <label className="font-bold text-xl">Remarks:</label>
<textarea
  value={cncFormData.remarks}
  onChange={(e) => handleCNCChange("remarks", e.target.value)}
  rows={4}
  className={inputClass("remarks", "resize-none")}
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
