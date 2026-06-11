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
  
  // ✅ Helper: Check if order has multiple products
  const hasMultipleProducts = selectedOrder?.products && selectedOrder.products.length > 0;
  const productList = hasMultipleProducts 
    ? selectedOrder.products 
    : selectedOrder ? [{
        productName: selectedOrder.product,
        quantity: selectedOrder.quantity,
        size: selectedOrder.size,
        density: selectedOrder.density,
        price: selectedOrder.price,
        productRemarks: selectedOrder.productRemarks,
        narration: selectedOrder.narration,
        narrationImages: selectedOrder.narrationImages || []
      }] : [];

  const [cncFormData, setCNCFormData] = useState({
    productName: "",
    size: "",
    quantity: "",
    drawingName: "",
    remarks: "",
  });
  
  const [selectedProductFiles, setSelectedProductFiles] = useState([]);
  const [showGradeDropdown, setShowGradeDropdown] = useState(false);
  const [gradeProducts, setGradeProducts] = useState([]);
  const [filteredGrades, setFilteredGrades] = useState([]);
  
  const [danaFormData, setDanaFormData] = useState({
    typeOfRawBlock: "",
    densityValue: "",
    densityType: "",
    recycledDana: "",
    weight: "",
    grade: "",
  });
  
  const [missingFields, setMissingFields] = useState([]);
  const [drawingFiles, setDrawingFiles] = useState([]);
  
  const [danaBeadsFormData, setDanaBeadsFormData] = useState({
    productName: "",
    density: "",
    quantity: "",
    recycleDana: "no",
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

  // Fetch grade products for Dana slip
  useEffect(() => {
    const fetchGradeProducts = async () => {
      try {
        const categoriesResponse = await axiosInstance.get('/categories');
        const categories = categoriesResponse.data || [];
        const danaCategory = categories.find(cat => cat.name === "Thermocol Dana Raw Material");
        
        if (danaCategory) {
          const response = await axiosInstance.get(`/purchase-products?category=${danaCategory._id}`);
          setGradeProducts(response.data.data || []);
          setFilteredGrades(response.data.data || []);
        } else {
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

  // Filter grade products
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

useEffect(() => {
  if (isOpen && selectedOrder) {
    // For multi-product orders, show "Multiple Products" placeholder
    const isMultiProduct = hasMultipleProducts;
    const firstProduct = productList[0] || {};
    
   // Shape Slip (Production) - Initialize with per-product fields for multi-product
if (isMultiProduct) {
  const initialShapeData = {
    productName: "Multiple Products",
  };
  // Add per-product fields
  productList.forEach((product, idx) => {
    initialShapeData[`dryWeight_${idx}`] = product.density || "";
    initialShapeData[`quantity_${idx}`] = product.quantity;
    initialShapeData[`remarks_${idx}`] = selectedOrder.remarks || product.productRemarks || "";
  });
  setShapeFormData(initialShapeData);
} else {
  setShapeFormData({
    productName: selectedOrder.product || "",
    dryWeight: selectedOrder.density || "",
    quantity: selectedOrder.quantity || "",
    remarks: selectedOrder.remarks || "",
  });
}

    // Dana Slip - Initialize with per-product fields for multi-product
const densityParts = selectedOrder.density?.split(" ") || ["", ""];

if (isMultiProduct) {
  const initialDanaData = {
    typeOfRawBlock: "",
    densityValue: densityParts[0],
    densityType: densityParts[1],
    recycledDana: "",
    weight: "",
    grade: "",
    productName: "Multiple Products",
    remarks: selectedOrder.remarks || "",
  };
  // Add per-product fields
  productList.forEach((product, idx) => {
    initialDanaData[`quantity_${idx}`] = product.quantity;
    initialDanaData[`remarks_${idx}`] = selectedOrder.remarks || product.productRemarks || "";
  });
  setDanaFormData(initialDanaData);
} else {
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
}

   // Packaging Slip - Initialize with per-product fields for multi-product
if (isMultiProduct) {
  const initialPackagingData = {
    productName: "Multiple Products",
  };
  // Add per-product fields
  productList.forEach((product, idx) => {
    initialPackagingData[`packagingWeight_${idx}`] = "";
    initialPackagingData[`packagingType_${idx}`] = "";
    initialPackagingData[`quantity_${idx}`] = product.quantity;
    initialPackagingData[`remarks_${idx}`] = selectedOrder.remarks || product.productRemarks || "";
  });
  setPackagingFormData(initialPackagingData);
} else {
  setPackagingFormData({
    productName: selectedOrder.product || "",
    quantity: selectedOrder.quantity || "",
    remarks: selectedOrder.remarks || "",
    packagingWeight: "",
    packagingType: "",
  });
}

// Cutting Slip - Initialize with per-product fields for multi-product
if (isMultiProduct) {
  const initialCuttingData = {
    productName: "Multiple Products",
  };
  // Add per-product fields
  productList.forEach((product, idx) => {
    initialCuttingData[`size_${idx}`] = product.size || "";
    initialCuttingData[`density_${idx}`] = product.density || "";
    initialCuttingData[`quantity_${idx}`] = product.quantity;
    initialCuttingData[`remarks_${idx}`] = selectedOrder.remarks || product.productRemarks || "";
  });
  setCuttingFormData(initialCuttingData);
} else {
  setCuttingFormData({
    productName: selectedOrder.product || "",
    size: selectedOrder.size || "",
    density: selectedOrder.density || "",
    quantity: selectedOrder.quantity || "",
    remarks: selectedOrder.remarks || "",
  });
}

// ✅ CNC Slip - Initialize with per-product fields for multi-product
if (isMultiProduct) {
  const initialCNCData = {
    productName: "Multiple Products",
    drawingName: "",
    remarks: selectedOrder.remarks || "",
  };
  // Add per-product fields
  productList.forEach((product, idx) => {
    initialCNCData[`size_${idx}`] = product.size || "";
    initialCNCData[`quantity_${idx}`] = product.quantity;
    initialCNCData[`remarks_${idx}`] = selectedOrder.remarks || product.productRemarks || "";
  });
  setCNCFormData(initialCNCData);
} else {
  setCNCFormData({
    productName: selectedOrder.product || "",
    size: selectedOrder.size || "",
    quantity: selectedOrder.quantity || "",
    drawingName: "",
    remarks: selectedOrder.remarks || "",
  });
}

 // ✅ Dana/Beads Slip - ADD THIS BLOCK
const initialDanaBeadsFormData = {
  productName: isMultiProduct ? "Multiple Products" : (selectedOrder.product || ""),
  recycleDana: "no",
  nextGrade: "",
  remarks: selectedOrder.remarks || "",
};

// Add per-product fields for multi-product Dana/Beads
if (isMultiProduct) {
  productList.forEach((product, idx) => {
    initialDanaBeadsFormData[`density_${idx}`] = product.density || "";
    initialDanaBeadsFormData[`quantity_${idx}`] = product.quantity;
    initialDanaBeadsFormData[`remarks_${idx}`] = selectedOrder.remarks || product.productRemarks || "";  // ✅ Add this line
  });
} else {
  initialDanaBeadsFormData.density = selectedOrder.density || "";
  initialDanaBeadsFormData.quantity = selectedOrder.quantity || "";
}
setDanaBeadsFormData(initialDanaBeadsFormData);
  }
}, [isOpen, selectedOrder, hasMultipleProducts, productList]);

  const inputClass = (field, base = "") =>
    `w-full border rounded-md px-4 py-3 ${base} ${
      missingFields.includes(field) ? "border-red-500" : "border-gray-300"
    }`;

  const handleCNCChange = (field, value) => {
    setCNCFormData({ ...cncFormData, [field]: value });
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

  const product = products?.find((p) => p.name === selectedOrder?.product) || null;

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
      });
    } else if (isPdf) {
      Swal.fire({
        title: fileName || "PDF Preview",
        html: `<iframe src="${fileUrl}" width="100%" height="500px" style="border:none;"></iframe>`,
        width: "80%",
        showCloseButton: true,
        showConfirmButton: false,
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
      });
    }
  };

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

   // Add this right before the validation checks
console.log("🔍 Type:", type);
console.log("🔍 Has multiple products:", hasMultipleProducts);
console.log("🔍 Dana Form Data:", danaFormData);
console.log("🔍 Product List length:", productList.length);

if (type === "dana") {
  // Check batch settings fields
  const batchFields = ["typeOfRawBlock", "densityValue", "densityType", "recycledDana", "weight", "grade"];
  batchFields.forEach(field => {
    if (!danaFormData[field]?.toString().trim()) {
      console.log(`❌ Missing batch field: ${field}`);
      missing.push(field);
    }
  });
  
  // For multi-product, check per-product quantity and remarks
  if (hasMultipleProducts) {
    for (let idx = 0; idx < productList.length; idx++) {
      const quantity = danaFormData[`quantity_${idx}`];
      if (!quantity?.toString().trim()) {
        console.log(`❌ Missing quantity for product ${idx}`);
        missing.push(`quantity_${idx}`);
      }
      // remarks are optional
    }
  } else {
    // Single product - check regular quantity
    if (!danaFormData.quantity?.toString().trim()) {
      console.log(`❌ Missing quantity`);
      missing.push("quantity");
    }
  }
} else if (type === "production") {
  // For multi-product, check per-product fields instead
  if (hasMultipleProducts) {
    for (let idx = 0; idx < productList.length; idx++) {
      if (!shapeFormData[`dryWeight_${idx}`]?.toString().trim()) {
        console.log(`❌ Missing dryWeight for product ${idx}`);
        missing.push(`dryWeight_${idx}`);
      }
      if (!shapeFormData[`quantity_${idx}`]?.toString().trim()) {
        console.log(`❌ Missing quantity for product ${idx}`);
        missing.push(`quantity_${idx}`);
      }
      // remarks are optional
    }
  } else {
    // Single product - check regular fields
    checkMissing(["dryWeight", "quantity", "remarks"], shapeFormData);
  }
} else if (type === "dispatch") {
  // For multi-product, check per-product fields instead of single fields
  if (hasMultipleProducts) {
    // Check each product has size, density, and quantity
    for (let idx = 0; idx < productList.length; idx++) {
      if (!cuttingFormData[`size_${idx}`]?.toString().trim()) {
        missing.push(`size_${idx}`);
      }
      if (!cuttingFormData[`density_${idx}`]?.toString().trim()) {
        missing.push(`density_${idx}`);
      }
      if (!cuttingFormData[`quantity_${idx}`]?.toString().trim()) {
        missing.push(`quantity_${idx}`);
      }
      // remarks are optional
    }
  } else {
    // Single product - check regular fields
    checkMissing(["size", "density", "quantity", "remarks"], cuttingFormData);
  }
} else if (type === "cnc-slip") {
  // For multi-product, check per-product fields
  if (hasMultipleProducts) {
    // Check each product has size and quantity
    let allValid = true;
    for (let idx = 0; idx < productList.length; idx++) {
      const size = cncFormData[`size_${idx}`];
      const quantity = cncFormData[`quantity_${idx}`];
      
      if (!size?.toString().trim()) {
        console.log(`❌ Missing size for product ${idx}`);
        missing.push(`size_${idx}`);
        allValid = false;
      }
      if (!quantity?.toString().trim()) {
        console.log(`❌ Missing quantity for product ${idx}`);
        missing.push(`quantity_${idx}`);
        allValid = false;
      }
    }
    // Only check remarks if it's required (make it optional)
    // if (!cncFormData.remarks?.toString().trim()) {
    //   missing.push("remarks");
    // }
  } else {
    // Single product - check regular fields
    if (!cncFormData.productName?.toString().trim()) {
      missing.push("productName");
    }
    if (!cncFormData.size?.toString().trim()) {
      missing.push("size");
    }
    if (!cncFormData.quantity?.toString().trim()) {
      missing.push("quantity");
    }
  }
  // Remarks are optional, don't require them
} else if (type === "packaging" || type === "shape-packaging") {
  if (hasMultipleProducts) {
    // For multi-product, check each product's quantity and remarks
    for (let idx = 0; idx < productList.length; idx++) {
      const quantity = packagingFormData[`quantity_${idx}`];
      if (!quantity?.toString().trim()) {
        console.log(`❌ Missing quantity for product ${idx}`);
        missing.push(`quantity_${idx}`);
      }
      // remarks are optional
    }
  } else {
    // Single product - check regular fields
    if (!packagingFormData.quantity?.toString().trim()) {
      missing.push("quantity");
    }
    // remarks are optional
  }
} else if (type === "dana-beads") {
  // For multi-product, check per-product fields
  if (hasMultipleProducts) {
    for (let idx = 0; idx < productList.length; idx++) {
      if (!danaBeadsFormData[`density_${idx}`]?.toString().trim()) {
        console.log(`❌ Missing density for product ${idx}`);
        missing.push(`density_${idx}`);
      }
      if (!danaBeadsFormData[`quantity_${idx}`]?.toString().trim()) {
        console.log(`❌ Missing quantity for product ${idx}`);
        missing.push(`quantity_${idx}`);
      }
    }
  } else {
    // Single product - check regular fields
    if (!danaBeadsFormData.productName?.toString().trim()) missing.push("productName");
    if (!danaBeadsFormData.density?.toString().trim()) missing.push("density");
    if (!danaBeadsFormData.quantity?.toString().trim()) missing.push("quantity");
  }
}

    if (missing.length > 0) {
      setMissingFields(missing);
      setLoading(false);
      return;
    }

    setMissingFields([]);

    try {
     if (type === "dana") {
  const finalDensity = danaFormData.densityValue && danaFormData.densityType
    ? `${danaFormData.densityValue} ${danaFormData.densityType}`
    : "";

  // ✅ Prepare per-product data for multi-product orders
  let productsData = null;
  if (hasMultipleProducts) {
    productsData = productList.map((product, idx) => ({
      productName: product.productName,
      // ✅ Get quantity from danaFormData per-product field, or fallback to product.quantity
      quantity: danaFormData[`quantity_${idx}`] !== undefined ? danaFormData[`quantity_${idx}`] : product.quantity,
      // ✅ Get remarks from danaFormData per-product field, or fallback to product.productRemarks
      remarks: danaFormData[`remarks_${idx}`] !== undefined ? danaFormData[`remarks_${idx}`] : (product.productRemarks || ""),
    }));
  }

  console.log("📤 Sending dana data:", {
    danaFormData: {
      ...danaFormData,
      density: finalDensity,
      productName: hasMultipleProducts ? "Multiple Products" : (selectedOrder?.product || ""),
    },
    isMultiProduct: hasMultipleProducts,
    productsData,
  });

  await onSubmit({
    danaFormData: {
      ...danaFormData,
      density: finalDensity,
      productName: hasMultipleProducts ? "Multiple Products" : (selectedOrder?.product || ""),
      isMultiProduct: hasMultipleProducts,
      products: productsData,
    },
  });
} else if (type === "production") {
  // Prepare per-product data for multi-product orders
  let productsData = null;
  if (hasMultipleProducts) {
    productsData = productList.map((product, idx) => ({
      productName: product.productName,
      // ✅ Get dryWeight from per-product field
      dryWeight: shapeFormData[`dryWeight_${idx}`] !== undefined 
        ? shapeFormData[`dryWeight_${idx}`] 
        : (product.density || ""),
      // ✅ Get quantity from per-product field
      quantity: shapeFormData[`quantity_${idx}`] !== undefined 
        ? shapeFormData[`quantity_${idx}`] 
        : product.quantity,
      // ✅ Get remarks from per-product field
      remarks: shapeFormData[`remarks_${idx}`] !== undefined 
        ? shapeFormData[`remarks_${idx}`] 
        : (product.productRemarks || ""),
    }));
  }

  console.log("📤 Submitting Production slip:", {
    isMultiProduct: hasMultipleProducts,
    productsData,
    shapeFormData,
  });

  await onSubmit({ 
    shapeFormData: {
      productName: shapeFormData.productName,
      dryWeight: shapeFormData.dryWeight,
      quantity: shapeFormData.quantity,
      remarks: shapeFormData.remarks,
      isMultiProduct: hasMultipleProducts,
      products: productsData,
    },
  });
} else if (type === "dispatch") {
  // ✅ Prepare per-product data for multi-product orders
  let rowData = [];
  
  if (hasMultipleProducts) {
    // Create an array of products with their individual values
    rowData = productList.map((product, idx) => ({
      productName: product.productName,
      size: cuttingFormData[`size_${idx}`] !== undefined 
        ? cuttingFormData[`size_${idx}`] 
        : (product.size || ""),
      density: cuttingFormData[`density_${idx}`] !== undefined 
        ? cuttingFormData[`density_${idx}`] 
        : (product.density || ""),
      quantity: cuttingFormData[`quantity_${idx}`] !== undefined 
        ? cuttingFormData[`quantity_${idx}`] 
        : product.quantity,
      remarks: cuttingFormData[`remarks_${idx}`] !== undefined 
        ? cuttingFormData[`remarks_${idx}`] 
        : (product.productRemarks || ""),
    }));
  }

  await onSubmit({ 
    cuttingFormData: {
      productName: cuttingFormData.productName,
      size: cuttingFormData.size,
      density: cuttingFormData.density,
      quantity: cuttingFormData.quantity,
      remarks: cuttingFormData.overallRemarks || cuttingFormData.remarks,
      isMultiProduct: hasMultipleProducts,
      products: hasMultipleProducts ? rowData : null,
    },
  });
} else if (type === "cnc-slip") {
  const uploadedUrls = [];

  for (const file of drawingFiles) {
    let compressedFile = file;
    if (file.type.startsWith("image/")) {
      try {
        compressedFile = await imageCompression(file, {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
        });
      } catch (err) {
        console.warn("⚠️ Image compression failed, uploading original file.");
      }
    }

    const formData = new FormData();
    formData.append("file", compressedFile);
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
    console.log("✅ Uploaded drawing URL:", data.secure_url);
    } else {
      console.error("❌ Upload failed:", data);
    }
  }
    console.log("📤 All uploaded drawing URLs:", uploadedUrls);


  // ✅ Prepare per-product data for multi-product orders
  let productsData = null;
  if (hasMultipleProducts) {
    productsData = productList.map((product, idx) => ({
      productName: product.productName,
      // ✅ Get size from cncFormData per-product field, or fallback to product.size
      size: cncFormData[`size_${idx}`] !== undefined ? cncFormData[`size_${idx}`] : (product.size || ""),
      // ✅ Get quantity from cncFormData per-product field, or fallback to product.quantity
      quantity: cncFormData[`quantity_${idx}`] !== undefined ? cncFormData[`quantity_${idx}`] : product.quantity,
      // ✅ Get remarks from cncFormData per-product field, or fallback to product.productRemarks
      remarks: cncFormData[`remarks_${idx}`] !== undefined ? cncFormData[`remarks_${idx}`] : (product.productRemarks || ""),
    }));
  }

  // ✅ Log to debug
  console.log("📤 Submitting CNC slip:", {
    isMultiProduct: hasMultipleProducts,
    productsData,
    drawingName: cncFormData.drawingName,
    overallRemarks: cncFormData.remarks,
    drawingFilesCount: uploadedUrls.length
  });

  await onSubmit({
    cncFormData: {
      productName: cncFormData.productName,
      drawingName: cncFormData.drawingName,
      remarks: cncFormData.remarks,
      drawingFiles: uploadedUrls,
      isMultiProduct: hasMultipleProducts,
      products: productsData,
    },
  });
} else if (type === "packaging" || type === "shape-packaging") {
  // ✅ Prepare per-product data for multi-product orders
  let productsData = null;
  if (hasMultipleProducts) {
    productsData = productList.map((product, idx) => ({
      productName: product.productName,
      packagingWeight: packagingFormData[`packagingWeight_${idx}`] !== undefined 
        ? packagingFormData[`packagingWeight_${idx}`] 
        : "",
      packagingType: packagingFormData[`packagingType_${idx}`] !== undefined 
        ? packagingFormData[`packagingType_${idx}`] 
        : "",
      quantity: packagingFormData[`quantity_${idx}`] !== undefined 
        ? packagingFormData[`quantity_${idx}`] 
        : product.quantity,
      remarks: packagingFormData[`remarks_${idx}`] !== undefined 
        ? packagingFormData[`remarks_${idx}`] 
        : (product.productRemarks || ""),
    }));
  }

  await onSubmit({ 
    packagingFormData: {
      productName: packagingFormData.productName,
      packagingWeight: packagingFormData.packagingWeight,
      packagingType: packagingFormData.packagingType,
      quantity: packagingFormData.quantity,
      remarks: packagingFormData.overallRemarks || packagingFormData.remarks,
      isMultiProduct: hasMultipleProducts,
      products: productsData,
    },
  });
} else if (type === "dana-beads") {
  // ✅ Prepare per-product data for multi-product orders
  let productsData = null;
  if (hasMultipleProducts) {
    productsData = productList.map((product, idx) => ({
      productName: product.productName,
      // ✅ Use density from the form's per-product field
      density: danaBeadsFormData[`density_${idx}`] !== undefined 
        ? danaBeadsFormData[`density_${idx}`] 
        : product.density,
      // ✅ Use quantity from the form's per-product field
      quantity: danaBeadsFormData[`quantity_${idx}`] !== undefined 
        ? danaBeadsFormData[`quantity_${idx}`] 
        : product.quantity,
      // ✅ Use remarks from the form's per-product field (THIS WAS MISSING)
      remarks: danaBeadsFormData[`remarks_${idx}`] !== undefined 
        ? danaBeadsFormData[`remarks_${idx}`] 
        : (product.productRemarks || ""),
    }));
  }

  console.log("📤 Submitting Dana/Beads with productsData:", JSON.stringify(productsData, null, 2));

  await onSubmit({ 
    danaBeadsFormData: {
      productName: danaBeadsFormData.productName,
      recycleDana: danaBeadsFormData.recycleDana,
      nextGrade: danaBeadsFormData.nextGrade,
      remarks: danaBeadsFormData.remarks,
      isMultiProduct: hasMultipleProducts,
      products: productsData,
    },
  });
}

      // Reset fields
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
      setDrawingFiles([]);
      onClose();
    } catch (error) {
      console.error("❌ Error submitting form:", error);
      Swal.fire({
        icon: "error",
        title: "Submission Failed",
        text: error.message || "Something went wrong",
      });
    } finally {
      setLoading(false);
    }
  };

  // ✅ Render product list summary for multi-product orders
  const renderProductSummary = () => {
    if (!hasMultipleProducts || !selectedOrder) return null;
    
    return (
      <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <h4 className="font-bold text-blue-800 mb-2">📦 Products in this Order ({productList.length} items):</h4>
        <div className="space-y-1 text-sm">
          {productList.map((prod, idx) => (
            <div key={idx} className="flex justify-between border-b border-blue-100 pb-1">
              <span className="font-medium">{prod.productName}</span>
              <span>Qty: {prod.quantity}</span>
              {prod.size && <span className="text-gray-600">Size: {prod.size}</span>}
              {prod.density && <span className="text-gray-600">Density: {prod.density}</span>}
            </div>
          ))}
          <div className="mt-2 pt-1 border-t border-blue-200 font-bold">
            Total Quantity: {productList.reduce((sum, p) => sum + (parseInt(p.quantity) || 0), 0)} units
          </div>
        </div>
      </div>
    );
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

        {/* ✅ Show product summary for multi-product orders */}
        {renderProductSummary()}

        <form onSubmit={handleSubmit} className="space-y-8">
       {/* Dana Slip (Block Molding) */}
{type === "dana" && (
  <>
    <section className="space-y-4">
      <h3 className="text-2xl bg-yellow-200 py-2 text-center font-semibold text-indigo-700 border-b border-indigo-300 pb-2 select-none">
        Raw Block/Dana Slip
      </h3>

      {/* ✅ Show product list with editable fields for multi-product */}
      {hasMultipleProducts ? (
        <div className="mb-4">
          <label className="font-bold text-xl mb-2 block">Products</label>
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-200 text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2 border">Product Name</th>
                  <th className="p-2 border">Quantity</th>
                  <th className="p-2 border">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {productList.map((product, idx) => (
                  <tr key={idx}>
                    <td className="p-2 border">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{product.productName}</span>
                        <ShowInternalImagesButton product={products.find(p => p.name === product.productName)} />
                      </div>
                    </td>
                    <td className="p-2 border">
                      <input
                        type="number"
                        value={danaFormData[`quantity_${idx}`] !== undefined ? danaFormData[`quantity_${idx}`] : product.quantity}
                        onChange={(e) => handleDanaChange(`quantity_${idx}`, e.target.value)}
                        placeholder="Quantity"
                        className="w-24 p-1 border border-gray-300 rounded"
                      />
                    </td>
                    <td className="p-2 border">
                      <input
                        type="text"
                        value={danaFormData[`remarks_${idx}`] !== undefined ? danaFormData[`remarks_${idx}`] : (product.productRemarks || "")}
                        onChange={(e) => handleDanaChange(`remarks_${idx}`, e.target.value)}
                        placeholder="Remarks"
                        className="w-40 p-1 border border-gray-300 rounded"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        // Single product view
        <>
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
        </>
      )}
    </section>

    {/* Common Batch Settings for Dana Slip */}
    <section className="space-y-4 pt-6 border-t border-gray-200">
      <h4 className="text-lg font-bold text-indigo-700">Batch Settings (Applies to all products)</h4>
      
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
      <div className="flex flex-wrap gap-4">
        {["30%", "50%", "No"].map((val) => (
          <label key={val} className="flex items-center gap-1 px-2 py-1 rounded-md">
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
                    setSelectedProductFiles(product.files || []);
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
    </section>
  </>
)}

         {/* Shape Moulding Slip */}
{type === "production" && (
  <section className="space-y-4">
    <h3 className="text-2xl bg-yellow-200 py-2 text-center font-semibold text-indigo-700 border-b border-indigo-300 pb-2 select-none">
      Shape Moulding Production Slip / Die Moulding
    </h3>

    {/* ✅ Show product list with editable fields for multi-product */}
    {hasMultipleProducts ? (
      <div className="mb-4">
        <label className="font-bold text-xl mb-2 block">Products</label>
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200 text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 border">Product Name</th>
                <th className="p-2 border">Dry Weight / Density</th>
                <th className="p-2 border">Quantity</th>
                <th className="p-2 border">Remarks</th>
              </tr>
              </thead>
              <tbody>
                {productList.map((product, idx) => (
                  <tr key={idx}>
                    <td className="p-2 border">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{product.productName}</span>
                        <ShowInternalImagesButton product={products.find(p => p.name === product.productName)} />
                      </div>
                    </td>
                    <td className="p-2 border">
                      <input
                        type="text"
                        value={shapeFormData[`dryWeight_${idx}`] !== undefined 
                          ? shapeFormData[`dryWeight_${idx}`] 
                          : (product.density || "")}
                        onChange={(e) => {
                          setShapeFormData(prev => ({
                            ...prev,
                            [`dryWeight_${idx}`]: e.target.value
                          }));
                        }}
                        placeholder="Dry Weight / Density"
                        className="w-32 p-1 border border-gray-300 rounded"
                      />
                    </td>
                    <td className="p-2 border">
                      <input
                        type="number"
                        value={shapeFormData[`quantity_${idx}`] !== undefined 
                          ? shapeFormData[`quantity_${idx}`] 
                          : product.quantity}
                        onChange={(e) => {
                          setShapeFormData(prev => ({
                            ...prev,
                            [`quantity_${idx}`]: e.target.value
                          }));
                        }}
                        placeholder="Quantity"
                        className="w-24 p-1 border border-gray-300 rounded"
                      />
                    </td>
                    <td className="p-2 border">
                      <input
                        type="text"
                        value={shapeFormData[`remarks_${idx}`] !== undefined 
                          ? shapeFormData[`remarks_${idx}`] 
                          : (product.productRemarks || "")}
                        onChange={(e) => {
                          setShapeFormData(prev => ({
                            ...prev,
                            [`remarks_${idx}`]: e.target.value
                          }));
                        }}
                        placeholder="Remarks"
                        className="w-40 p-1 border border-gray-300 rounded"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        // Single product view
        <>
          <label className="font-bold text-xl">Product Name:</label>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <input
              type="text"
              disabled={hasMultipleProducts}
              value={shapeFormData.productName}
              onChange={(e) => handleShapeChange("productName", e.target.value)}
              className="flex-1 bg-gray-100 border border-gray-300 rounded-md px-4 py-3 text-gray-700"
            />
            {!hasMultipleProducts && <ShowInternalImagesButton product={product} />}
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
        </>
      )}
  </section>
)}

      {/* Dana/Beads Slip */}
{type === "dana-beads" && (
  <section className="space-y-4">
    {/* ✅ Show product list with editable fields for multi-product */}
    {hasMultipleProducts ? (
      <div className="mb-4">
        <label className="font-bold text-xl mb-2 block">Products</label>
        <div className="overflow-x-auto max-h-96 overflow-y-auto">
          <table className="min-w-full border border-gray-200 text-sm">
            <thead className="bg-gray-100 sticky top-0">
              <tr>
                <th className="p-2 border">Product Name</th>
                <th className="p-2 border">Density (kg/m³)</th>
                <th className="p-2 border">Quantity</th>
                <th className="p-2 border">Remarks</th>
              </tr>
              </thead>
              <tbody>
                {productList.map((product, idx) => (
                  <tr key={idx}>
                    <td className="p-2 border">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{product.productName}</span>
                        <ShowInternalImagesButton product={products.find(p => p.name === product.productName)} />
                      </div>
                    </td>
                    <td className="p-2 border">
                      <input
                        type="text"
                        value={danaBeadsFormData[`density_${idx}`] !== undefined 
                          ? danaBeadsFormData[`density_${idx}`] 
                          : (product.density || "")}
                        onChange={(e) => {
                          setDanaBeadsFormData(prev => ({
                            ...prev,
                            [`density_${idx}`]: e.target.value
                          }));
                        }}
                        placeholder="Density"
                        className="w-28 p-1 border border-gray-300 rounded"
                      />
                    </td>
                    <td className="p-2 border">
                      <input
                        type="number"
                        value={danaBeadsFormData[`quantity_${idx}`] !== undefined 
                          ? danaBeadsFormData[`quantity_${idx}`] 
                          : product.quantity}
                        onChange={(e) => {
                          setDanaBeadsFormData(prev => ({
                            ...prev,
                            [`quantity_${idx}`]: e.target.value
                          }));
                        }}
                        placeholder="Quantity"
                        className="w-24 p-1 border border-gray-300 rounded"
                      />
                    </td>
                    <td className="p-2 border">
                      <input
                        type="text"
                        value={danaBeadsFormData[`remarks_${idx}`] !== undefined 
                          ? danaBeadsFormData[`remarks_${idx}`] 
                          : (product.productRemarks || "")}
                        onChange={(e) => {
                          setDanaBeadsFormData(prev => ({
                            ...prev,
                            [`remarks_${idx}`]: e.target.value
                          }));
                        }}
                        placeholder="Remarks"
                        className="w-40 p-1 border border-gray-300 rounded"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        // Single product view
        <>
          <label className="font-bold text-xl">Product Name:</label>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <input
              type="text"
              disabled
              value={danaBeadsFormData.productName}
              onChange={(e) => setDanaBeadsFormData({ ...danaBeadsFormData, productName: e.target.value })}
              className={inputClass("productName")}
            />
            <ShowInternalImagesButton product={product} />
          </div>

          <label className="font-bold text-xl">Density (kg/m³):</label>
          <input
            type="text"
            value={danaBeadsFormData.density}
            onChange={(e) => setDanaBeadsFormData({ ...danaBeadsFormData, density: e.target.value })}
            className={inputClass("density")}
            placeholder="e.g., 12 kg/m³"
          />

          <label className="font-bold text-xl">Quantity:</label>
          <input
            type="number"
            value={danaBeadsFormData.quantity}
            onChange={(e) => setDanaBeadsFormData({ ...danaBeadsFormData, quantity: e.target.value })}
            className={inputClass("quantity")}
          />
        </>
      )}

      {/* Common fields for Dana/Beads (apply to all products) */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="font-bold text-xl">Recycle Dana:</label>
            <select
              value={danaBeadsFormData.recycleDana}
              onChange={(e) => setDanaBeadsFormData({ ...danaBeadsFormData, recycleDana: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-4 py-3"
            >
              <option value="30%">30%</option>
              <option value="50%">50%</option>
              <option value="no">No</option>
            </select>
          </div>

          <div>
            <label className="font-bold text-xl">Grade of Raw Material / Thermocol Dana:</label>
            <input
              type="text"
              value={danaBeadsFormData.nextGrade}
              onChange={(e) => setDanaBeadsFormData({ ...danaBeadsFormData, nextGrade: e.target.value })}
              className={inputClass("nextGrade")}
              placeholder="Enter grade name"
            />
          </div>
        </div>

        {/* <label className="font-bold text-xl mt-4 block">Overall Remarks:</label>
        <textarea
          value={danaBeadsFormData.remarks}
          onChange={(e) => setDanaBeadsFormData({ ...danaBeadsFormData, remarks: e.target.value })}
          rows={3}
          className={inputClass("remarks", "resize-none")}
          placeholder="Enter overall remarks for this Dana/Beads production"
        /> */}
      </div>
  </section>
)}
     {/* Packaging Slip */}
{isPackaging && (
  <section className="space-y-4">
    <h3 className="text-2xl bg-yellow-200 py-2 text-center font-semibold text-indigo-700 border-b border-indigo-300 pb-2 select-none">
      Shape Moulding Packaging Slip
    </h3>

    {/* ✅ Show product list with editable fields for multi-product */}
    {hasMultipleProducts ? (
      <div className="mb-4">
        <label className="font-bold text-xl mb-2 block">Products</label>
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200 text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 border">Product Name</th>
                <th className="p-2 border">Packaging Weight (kg)</th>
                <th className="p-2 border">Packaging Type</th>
                <th className="p-2 border">Quantity</th>
                <th className="p-2 border">Remarks</th>
              </tr>
              </thead>
              <tbody>
                {productList.map((product, idx) => (
                  <tr key={idx}>
                    <td className="p-2 border">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{product.productName}</span>
                        <ShowInternalImagesButton product={products.find(p => p.name === product.productName)} />
                      </div>
                    </td>
                    <td className="p-2 border">
                      <input
                        type="text"
                        value={packagingFormData[`packagingWeight_${idx}`] !== undefined 
                          ? packagingFormData[`packagingWeight_${idx}`] 
                          : ""}
                        onChange={(e) => {
                          setPackagingFormData(prev => ({
                            ...prev,
                            [`packagingWeight_${idx}`]: e.target.value
                          }));
                        }}
                        placeholder="Weight"
                        className="w-28 p-1 border border-gray-300 rounded"
                      />
                    </td>
                    <td className="p-2 border">
                      <input
                        type="text"
                        value={packagingFormData[`packagingType_${idx}`] !== undefined 
                          ? packagingFormData[`packagingType_${idx}`] 
                          : ""}
                        onChange={(e) => {
                          setPackagingFormData(prev => ({
                            ...prev,
                            [`packagingType_${idx}`]: e.target.value
                          }));
                        }}
                        placeholder="Type"
                        className="w-28 p-1 border border-gray-300 rounded"
                      />
                    </td>
                    <td className="p-2 border">
                      <input
                        type="number"
                        value={packagingFormData[`quantity_${idx}`] !== undefined 
                          ? packagingFormData[`quantity_${idx}`] 
                          : product.quantity}
                        onChange={(e) => {
                          setPackagingFormData(prev => ({
                            ...prev,
                            [`quantity_${idx}`]: e.target.value
                          }));
                        }}
                        placeholder="Quantity"
                        className="w-24 p-1 border border-gray-300 rounded"
                      />
                    </td>
                    <td className="p-2 border">
                      <input
                        type="text"
                        value={packagingFormData[`remarks_${idx}`] !== undefined 
                          ? packagingFormData[`remarks_${idx}`] 
                          : (product.productRemarks || "")}
                        onChange={(e) => {
                          setPackagingFormData(prev => ({
                            ...prev,
                            [`remarks_${idx}`]: e.target.value
                          }));
                        }}
                        placeholder="Remarks"
                        className="w-40 p-1 border border-gray-300 rounded"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
        </div>
        {/* Overall remarks for packaging slip */}
        {/* <div className="mt-4 pt-4 border-t border-gray-200">
          <label className="font-bold text-xl">Overall Remarks:</label>
          <textarea
            value={packagingFormData.overallRemarks || ""}
            onChange={(e) => setPackagingFormData(prev => ({ ...prev, overallRemarks: e.target.value }))}
            rows={3}
            className="w-full border border-gray-300 rounded-md px-4 py-3"
            placeholder="Enter overall remarks for this packaging slip"
          />
        </div> */}
      </div>
    ) : (
      // Single product view
      <>
        <label className="font-bold text-xl">Product Name:</label>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <input
            type="text"
            disabled={hasMultipleProducts}
            placeholder="Product Name"
            value={packagingFormData.productName}
            className="flex-1 bg-gray-100 border border-gray-300 rounded-md px-4 py-3 text-gray-700"
          />
          {!hasMultipleProducts && <ShowInternalImagesButton product={product} />}
        </div>

        <label className="font-bold text-xl">Packaging Weight (kg):</label>
        <input
          type="text"
          placeholder="Packaging Weight"
          value={packagingFormData.packagingWeight}
          onChange={(e) => handlePackagingChange("packagingWeight", e.target.value)}
          className={inputClass("packagingWeight")}
        />

        <label className="font-bold text-xl">Packaging Type:</label>
        <input
          type="text"
          placeholder="Packaging Type"
          value={packagingFormData.packagingType}
          onChange={(e) => handlePackagingChange("packagingType", e.target.value)}
          className={inputClass("packagingType")}
        />

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
      </>
    )}
  </section>
)}

 {/* Cutting Slip - Dispatch */}
{type === "dispatch" && (
  <section className="space-y-4">
    <h3 className="text-2xl bg-yellow-200 py-2 text-center font-semibold text-indigo-700 border-b border-indigo-300 pb-2 select-none">
      Cutting Slip
    </h3>

    {/* ✅ Show product list with editable fields for multi-product */}
    {hasMultipleProducts ? (
      <>
        <div className="mb-4">
          <label className="font-bold text-xl mb-2 block">Products</label>
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-200 text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2 border">Product Name</th>
                  <th className="p-2 border">Size</th>
                  <th className="p-2 border">Density (kg/m³)</th>
                  <th className="p-2 border">Quantity</th>
                  <th className="p-2 border">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {productList.map((product, idx) => (
                  <tr key={idx}>
                    <td className="p-2 border">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{product.productName}</span>
                        <ShowInternalImagesButton product={products.find(p => p.name === product.productName)} />
                      </div>
                    </td>
                    <td className="p-2 border">
                      <input
                        type="text"
                        value={cuttingFormData[`size_${idx}`] !== undefined 
                          ? cuttingFormData[`size_${idx}`] 
                          : (product.size || "")}
                        onChange={(e) => {
                          setCuttingFormData(prev => ({
                            ...prev,
                            [`size_${idx}`]: e.target.value
                          }));
                        }}
                        placeholder="Size"
                        className="w-32 p-1 border border-gray-300 rounded"
                      />
                    </td>
                    <td className="p-2 border">
                      <input
                        type="text"
                        value={cuttingFormData[`density_${idx}`] !== undefined 
                          ? cuttingFormData[`density_${idx}`] 
                          : (product.density || "")}
                        onChange={(e) => {
                          setCuttingFormData(prev => ({
                            ...prev,
                            [`density_${idx}`]: e.target.value
                          }));
                        }}
                        placeholder="Density"
                        className="w-28 p-1 border border-gray-300 rounded"
                      />
                    </td>
                    <td className="p-2 border">
                      <input
                        type="number"
                        value={cuttingFormData[`quantity_${idx}`] !== undefined 
                          ? cuttingFormData[`quantity_${idx}`] 
                          : product.quantity}
                        onChange={(e) => {
                          setCuttingFormData(prev => ({
                            ...prev,
                            [`quantity_${idx}`]: e.target.value
                          }));
                        }}
                        placeholder="Quantity"
                        className="w-24 p-1 border border-gray-300 rounded"
                      />
                    </td>
                    <td className="p-2 border">
                      <input
                        type="text"
                        value={cuttingFormData[`remarks_${idx}`] !== undefined 
                          ? cuttingFormData[`remarks_${idx}`] 
                          : (product.productRemarks || "")}
                        onChange={(e) => {
                          setCuttingFormData(prev => ({
                            ...prev,
                            [`remarks_${idx}`]: e.target.value
                          }));
                        }}
                        placeholder="Remarks"
                        className="w-40 p-1 border border-gray-300 rounded"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        {/* Overall remarks for cutting slip */}
        {/* <div className="mt-4 pt-4 border-t border-gray-200">
          <label className="font-bold text-xl">Overall Remarks:</label>
          <textarea
            value={cuttingFormData.overallRemarks || ""}
            onChange={(e) => setCuttingFormData(prev => ({ ...prev, overallRemarks: e.target.value }))}
            rows={3}
            className="w-full border border-gray-300 rounded-md px-4 py-3"
            placeholder="Enter overall remarks for this cutting slip"
          />
        </div> */}
      </>
    ) : (
      <>
        {/* Single product view */}
        <div>
          <label className="font-bold text-xl">Product Name:</label>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <input
              type="text"
              disabled={hasMultipleProducts}
              value={cuttingFormData.productName}
              readOnly
              className="flex-1 bg-gray-100 border border-gray-300 rounded-md px-4 py-3 text-gray-700"
            />
            {!hasMultipleProducts && <ShowInternalImagesButton product={product} />}
          </div>
        </div>

        <div>
          <label className="font-bold text-xl">Size:</label>
          <input
            type="text"
            placeholder="Size (e.g., 24x18x2 inch)"
            value={cuttingFormData.size}
            onChange={(e) => handleCuttingChange("size", e.target.value)}
            className={inputClass("size")}
          />
        </div>

        <div>
          <label className="font-bold text-xl">Density (kg/m³):</label>
          <input
            type="text"
            placeholder="Density (e.g., 12 Kg/m³)"
            value={cuttingFormData.density}
            onChange={(e) => handleCuttingChange("density", e.target.value)}
            className={inputClass("density")}
          />
        </div>

        <div>
          <label className="font-bold text-xl">Quantity:</label>
          <input
            type="number"
            placeholder="Quantity"
            value={cuttingFormData.quantity}
            onChange={(e) => handleCuttingChange("quantity", e.target.value)}
            className={inputClass("quantity")}
          />
        </div>

        <div>
          <label className="font-bold text-xl">Remarks:</label>
          <textarea
            placeholder="Remarks"
            value={cuttingFormData.remarks}
            onChange={(e) => handleCuttingChange("remarks", e.target.value)}
            rows={3}
            className={inputClass("remarks", "resize-none")}
          />
        </div>
      </>
    )}
  </section>
)}

     {/* CNC Slip */}
{type === "cnc-slip" && (
  <section className="space-y-4">
    {/* Show product list with editable fields for multi-product */}
    {hasMultipleProducts ? (
      <div className="mb-4">
        <label className="font-bold text-xl mb-2 block">Products</label>
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200 text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 border">Product Name</th>
                <th className="p-2 border">Size <span className="text-red-500">*</span></th>
                <th className="p-2 border">Quantity <span className="text-red-500">*</span></th>
                <th className="p-2 border">Remarks</th>
              </tr>
              </thead>
              <tbody>
                {productList.map((product, idx) => (
                  <tr key={idx}>
                    <td className="p-2 border">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{product.productName}</span>
                        <ShowInternalImagesButton product={products.find(p => p.name === product.productName)} />
                      </div>
                    </td>
                    <td className="p-2 border">
                      <input
                        type="text"
                        value={cncFormData[`size_${idx}`] !== undefined ? cncFormData[`size_${idx}`] : (product.size || "")}
                        onChange={(e) => {
                          setCNCFormData(prev => ({
                            ...prev,
                            [`size_${idx}`]: e.target.value
                          }));
                        }}
                        placeholder="Size"
                        className={`w-32 p-1 border rounded ${missingFields.includes(`size_${idx}`) ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                      />
                    </td>
                    <td className="p-2 border">
                      <input
                        type="number"
                        value={cncFormData[`quantity_${idx}`] !== undefined ? cncFormData[`quantity_${idx}`] : product.quantity}
                        onChange={(e) => {
                          setCNCFormData(prev => ({
                            ...prev,
                            [`quantity_${idx}`]: e.target.value
                          }));
                        }}
                        placeholder="Quantity"
                        className={`w-24 p-1 border rounded ${missingFields.includes(`quantity_${idx}`) ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                      />
                    </td>
                    <td className="p-2 border">
                      <input
                        type="text"
                        value={cncFormData[`remarks_${idx}`] !== undefined ? cncFormData[`remarks_${idx}`] : (product.productRemarks || "")}
                        onChange={(e) => {
                          setCNCFormData(prev => ({
                            ...prev,
                            [`remarks_${idx}`]: e.target.value
                          }));
                        }}
                        placeholder="Remarks"
                        className="w-40 p-1 border border-gray-300 rounded"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        // Single product view
        <>
          <label className="font-bold text-xl">Product Name <span className="text-red-500">*</span>:</label>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <input
              type="text"
              disabled={hasMultipleProducts}
              value={cncFormData.productName}
              onChange={(e) => handleCNCChange("productName", e.target.value)}
              className={inputClass("productName")}
            />
            {!hasMultipleProducts && <ShowInternalImagesButton product={product} />}
          </div>

          <label className="font-bold text-xl">Size <span className="text-red-500">*</span>:</label>
          <input
            type="text"
            value={cncFormData.size}
            onChange={(e) => handleCNCChange("size", e.target.value)}
            className={inputClass("size")}
          />

          <label className="font-bold text-xl">Quantity <span className="text-red-500">*</span>:</label>
          <input
            type="number"
            value={cncFormData.quantity}
            onChange={(e) => handleCNCChange("quantity", e.target.value)}
            className={inputClass("quantity")}
          />
        </>
      )}

      {/* Rest of CNC form remains the same */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <label className="font-bold text-xl">Drawing Name (Optional):</label>
        <input
          type="text"
          value={cncFormData.drawingName}
          onChange={(e) => handleCNCChange("drawingName", e.target.value)}
          className="w-full border border-gray-300 rounded-md px-4 py-3"
          placeholder="Enter drawing reference name"
        />
      </div>

      <label className="font-bold text-xl">Upload Drawings:</label>
      <input
        type="file"
        multiple
        accept="image/*,.pdf,.dxf,.dwg"
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

      {/* <label className="font-bold text-xl">Overall Remarks (Optional):</label>
      <textarea
        value={cncFormData.remarks}
        onChange={(e) => handleCNCChange("remarks", e.target.value)}
        rows={4}
        className="w-full border border-gray-300 rounded-md px-4 py-3"
        placeholder="Enter overall remarks for this CNC job"
      /> */}
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

        {loading && (
          <div className="absolute inset-0 bg-gray-100 bg-opacity-70 flex justify-center items-center z-50 pointer-events-auto">
            <div className="loader ease-linear rounded-full border-8 border-t-8 border-indigo-600 h-16 w-16"></div>
          </div>
        )}
      </Modal>

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