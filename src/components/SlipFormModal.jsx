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
        narrationImages: selectedOrder.narrationImages || [],
              images: selectedOrder.images || [], // ✅ ADD THIS
      }] : [];

  const [cncFormData, setCNCFormData] = useState({
    productName: "",
    size: "",
    quantity: "",
    drawingName: "",
    remarks: "",
  });
const [selectedTypeImages, setSelectedTypeImages] = useState({});
  const [selectedProductFiles, setSelectedProductFiles] = useState([]);
  const [showGradeDropdown, setShowGradeDropdown] = useState(false);
  const [gradeProducts, setGradeProducts] = useState([]);
  const [filteredGrades, setFilteredGrades] = useState([]);
  const [showDanaBeadsGradeDropdown, setShowDanaBeadsGradeDropdown] = useState(false);
const [danaBeadsGradeProducts, setDanaBeadsGradeProducts] = useState([]);
const [filteredDanaBeadsGrades, setFilteredDanaBeadsGrades] = useState([]);
const [selectedDanaBeadsProductFiles, setSelectedDanaBeadsProductFiles] = useState([]);
const [activeGradeIndex, setActiveGradeIndex] = useState(null);
const [activeNextGradeIndex, setActiveNextGradeIndex] = useState(null);
const TYPE_IMAGES = {
  'Bottom Gutka': 'https://res.cloudinary.com/dcr8k5amk/image/upload/v1785221664/WhatsApp_Images_2026-07-28_at_12.16.25_PM_z7fcoi.jpg',
  'Without Both Gutka': 'https://res.cloudinary.com/dcr8k5amk/image/upload/v1785221582/WhatsApp_Image_2026-07-28_at_12.16.25_PM_offpnj.jpg',
};
  // ✅ Use selectedProducts as an array of booleans
  const [selectedProducts, setSelectedProducts] = useState([]);

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
// Fetch grade products for Dana Beads
useEffect(() => {
  const fetchDanaBeadsGradeProducts = async () => {
    try {
      const categoriesResponse = await axiosInstance.get('/categories');
      const categories = categoriesResponse.data || [];
      const danaCategory = categories.find(cat => cat.name === "Thermocol Dana Raw Material");
      
      if (danaCategory) {
        const response = await axiosInstance.get(`/purchase-products?category=${danaCategory._id}`);
        setDanaBeadsGradeProducts(response.data.data || []);
        setFilteredDanaBeadsGrades(response.data.data || []);
      } else {
        setDanaBeadsGradeProducts([]);
        setFilteredDanaBeadsGrades([]);
      }
    } catch (error) {
      console.error('Error fetching Dana Beads grade products:', error);
      setDanaBeadsGradeProducts([]);
      setFilteredDanaBeadsGrades([]);
    }
  };
  
  if (isOpen && type === "dana-beads") {
    fetchDanaBeadsGradeProducts();
  }
}, [isOpen, type]);

// Filter Dana Beads grade products
useEffect(() => {
  if (danaBeadsFormData.nextGrade) {
    const filtered = danaBeadsGradeProducts.filter(product =>
      product.name.toLowerCase().includes(danaBeadsFormData.nextGrade.toLowerCase()) ||
      (product.description && product.description.toLowerCase().includes(danaBeadsFormData.nextGrade.toLowerCase()))
    );
    setFilteredDanaBeadsGrades(filtered);
  } else {
    setFilteredDanaBeadsGrades(danaBeadsGradeProducts);
  }
}, [danaBeadsFormData.nextGrade, danaBeadsGradeProducts]);

  // ✅ Initialize selectedProducts when modal opens
  useEffect(() => {
    if (isOpen && selectedOrder && hasMultipleProducts) {
      // Select all products by default
      setSelectedProducts(productList.map(() => true));
    } else if (isOpen && selectedOrder && !hasMultipleProducts) {
      // For single product, select it by default
      setSelectedProducts([true]);
    }
  }, [isOpen, selectedOrder, hasMultipleProducts, productList]);

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
  // Filter grade products
  useEffect(() => {
    if (activeGradeIndex !== null) {
      const gradeValue = danaFormData[`grade_${activeGradeIndex}`] || "";
      if (gradeValue) {
        const filtered = gradeProducts.filter(product =>
          product.name.toLowerCase().includes(gradeValue.toLowerCase()) ||
          (product.description && product.description.toLowerCase().includes(gradeValue.toLowerCase()))
        );
        setFilteredGrades(filtered);
      } else {
        setFilteredGrades(gradeProducts);
      }
    } else {
      setFilteredGrades(gradeProducts);
    }
  }, [danaFormData, activeGradeIndex, gradeProducts]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.grade-dropdown-container')) {
        setShowGradeDropdown(false);
        setActiveGradeIndex(null);
      }

       if (!event.target.closest('.dana-beads-grade-dropdown-container')) {
      setShowDanaBeadsGradeDropdown(false);
      setActiveNextGradeIndex(null);
    }
    };

    if (showGradeDropdown || showDanaBeadsGradeDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showGradeDropdown, showDanaBeadsGradeDropdown]);

  // ✅ Toggle product selection
  const toggleProduct = (idx) => {
    const newSelected = [...selectedProducts];
    newSelected[idx] = !newSelected[idx];
    setSelectedProducts(newSelected);
  };

  // ✅ Select all products
  const selectAll = () => {
    setSelectedProducts(productList.map(() => true));
  };

  // ✅ Deselect all products
  const deselectAll = () => {
    setSelectedProducts(productList.map(() => false));
  };

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
    // Find the product in the products list to get its unit
    const productFromList = products.find(p => p.name === product.productName);
    initialShapeData[`dryWeight_${idx}`] = product.density || "";
    initialShapeData[`quantity_${idx}`] = product.quantity;
    initialShapeData[`remarks_${idx}`] = selectedOrder.remarks || product.productRemarks || "";
    initialShapeData[`productUnit_${idx}`] = productFromList?.unit || product.productUnit || ""; // ✅ ADD THIS
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
  // Dana Slip - Initialize with per-product fields for multi-product
const densityParts = selectedOrder.density?.split(" ") || ["", ""];

if (isMultiProduct) {
  const initialDanaData = {
    productName: "Multiple Products",
    remarks: selectedOrder.remarks || "",
  };
  // Add per-product fields for each Dana batch setting
  productList.forEach((product, idx) => {
                          const productFromList = products.find(p => p.name === product.productName);
    initialDanaData[`typeOfRawBlock_${idx}`] = "";
    initialDanaData[`typeOfRawBlockCustom_${idx}`] = "";
    initialDanaData[`densityValue_${idx}`] = "";
    initialDanaData[`densityType_${idx}`] = "";
    initialDanaData[`recycledDana_${idx}`] = "";
    initialDanaData[`weight_${idx}`] = "";
    initialDanaData[`grade_${idx}`] = "";
    initialDanaData[`quantity_${idx}`] = product.quantity;
    initialDanaData[`remarks_${idx}`] = selectedOrder.remarks || product.productRemarks || "";
        initialDanaData[`productUnit_${idx}`] = productFromList?.unit || product.productUnit || ""; // ✅ ADD
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
              const productFromList = products.find(p => p.name === product.productName);
          initialPackagingData[`packagingWeight_${idx}`] = "";
          initialPackagingData[`packagingType_${idx}`] = "";
          initialPackagingData[`quantity_${idx}`] = product.quantity;
          initialPackagingData[`remarks_${idx}`] = selectedOrder.remarks || product.productRemarks || "";
              initialPackagingData[`productUnit_${idx}`] = productFromList?.unit || product.productUnit || ""; // ✅ ADD
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
                      const productFromList = products.find(p => p.name === product.productName);
          initialCuttingData[`size_${idx}`] = product.size || "";
          initialCuttingData[`density_${idx}`] = product.density || "";
          initialCuttingData[`quantity_${idx}`] = product.quantity;
          initialCuttingData[`remarks_${idx}`] = selectedOrder.remarks || product.productRemarks || "";
              initialCuttingData[`productUnit_${idx}`] = productFromList?.unit || product.productUnit || ""; // ✅ ADD
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
    remarks: selectedOrder.remarks || "",
  };
  // Add per-product fields
  productList.forEach((product, idx) => {
    const productFromList = products.find(p => p.name === product.productName);
    initialCNCData[`size_${idx}`] = product.size || "";
    initialCNCData[`quantity_${idx}`] = product.quantity;
    initialCNCData[`remarks_${idx}`] = selectedOrder.remarks || product.productRemarks || "";
    initialCNCData[`drawingName_${idx}`] = ""; // ✅ Add per-product drawing name
    initialCNCData[`productUnit_${idx}`] = productFromList?.unit || product.productUnit || ""; // ✅ ADD THIS
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

// ✅ Dana/Beads Slip
const initialDanaBeadsFormData = {
  productName: isMultiProduct ? "Multiple Products" : (selectedOrder.product || ""),
  recycleDana: "no",
  nextGrade: "",
  remarks: selectedOrder.remarks || "",
};

// Add per-product fields for multi-product Dana/Beads
if (isMultiProduct) {
  productList.forEach((product, idx) => {
    // 🔍 Find the product in the products list to get its unit
    const productFromList = products.find(p => p.name === product.productName);
    initialDanaBeadsFormData[`density_${idx}`] = product.density || "";
    initialDanaBeadsFormData[`quantity_${idx}`] = product.quantity;
    initialDanaBeadsFormData[`remarks_${idx}`] = selectedOrder.remarks || product.productRemarks || "";
    initialDanaBeadsFormData[`productUnit_${idx}`] = productFromList?.unit || product.productUnit || "";
    initialDanaBeadsFormData[`recycleDana_${idx}`] = "no";
    initialDanaBeadsFormData[`nextGrade_${idx}`] = "";
  });
} else {
  initialDanaBeadsFormData.density = selectedOrder.density || "";
  initialDanaBeadsFormData.quantity = selectedOrder.quantity || "";
  // 🔍 Find the product in the products list for single product
  const productFromList = products.find(p => p.name === selectedOrder?.product);
  initialDanaBeadsFormData.productUnit = productFromList?.unit || selectedOrder?.productUnit || "";
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
  
  // Show image preview for the specific product
  if (field === 'typeOfRawBlock' || field.startsWith('typeOfRawBlock_')) {
    const typeValue = value;
    // Extract the index if it's a per-product field
    let index = null;
    if (field.startsWith('typeOfRawBlock_')) {
      index = parseInt(field.replace('typeOfRawBlock_', ''));
    }
    
    if (typeValue === 'Bottom Gutka' || typeValue === 'Without Both Gutka') {
      // Store the image for this specific product
      if (index !== null) {
        setSelectedTypeImages(prev => ({
          ...prev,
          [index]: TYPE_IMAGES[typeValue]
        }));
      } else {
        // For single product mode (non-multi)
        setSelectedTypeImages(prev => ({
          ...prev,
          single: TYPE_IMAGES[typeValue]
        }));
      }
    } else {
      // Clear the image for this specific product
      if (index !== null) {
        setSelectedTypeImages(prev => {
          const newState = { ...prev };
          delete newState[index];
          return newState;
        });
      } else {
        setSelectedTypeImages(prev => {
          const newState = { ...prev };
          delete newState.single;
          return newState;
        });
      }
    }
  }
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

  console.log("🔍 Type:", type);
  console.log("🔍 Has multiple products:", hasMultipleProducts);
  console.log("🔍 Selected products:", selectedProducts);
  console.log("🔍 Product List length:", productList.length);

  // Get filtered products based on selection
  const getFilteredProducts = () => {
    if (!hasMultipleProducts) return productList;
    // Ensure selectedProducts has the same length as productList
    const selected = selectedProducts.length === productList.length 
      ? selectedProducts 
      : productList.map(() => true); // Fallback: select all
    return productList.filter((_, idx) => selected[idx] || false);
  };

  const filteredProductList = getFilteredProducts();
  console.log("🔍 Filtered products:", filteredProductList.length);

  // Validation for each type
if (type === "dana") {
  // For multi-product, check each selected product's fields
  if (hasMultipleProducts) {
    const selected = selectedProducts.length === productList.length ? selectedProducts : productList.map(() => true);
    for (let idx = 0; idx < productList.length; idx++) {
      if (selected[idx]) {
        // Check Type of Raw Block (either from select or custom input)
        const typeOfRawBlock = danaFormData[`typeOfRawBlock_${idx}`] || danaFormData[`typeOfRawBlockCustom_${idx}`];
        if (!typeOfRawBlock?.toString().trim()) {
          console.log(`❌ Missing typeOfRawBlock for selected product ${idx}`);
          missing.push(`typeOfRawBlock_${idx}`);
        }
        if (!danaFormData[`densityValue_${idx}`]?.toString().trim()) {
          console.log(`❌ Missing densityValue for selected product ${idx}`);
          missing.push(`densityValue_${idx}`);
        }
        if (!danaFormData[`densityType_${idx}`]?.toString().trim()) {
          console.log(`❌ Missing densityType for selected product ${idx}`);
          missing.push(`densityType_${idx}`);
        }
        if (!danaFormData[`recycledDana_${idx}`]?.toString().trim()) {
          console.log(`❌ Missing recycledDana for selected product ${idx}`);
          missing.push(`recycledDana_${idx}`);
        }
        if (!danaFormData[`weight_${idx}`]?.toString().trim()) {
          console.log(`❌ Missing weight for selected product ${idx}`);
          missing.push(`weight_${idx}`);
        }
        if (!danaFormData[`grade_${idx}`]?.toString().trim()) {
          console.log(`❌ Missing grade for selected product ${idx}`);
          missing.push(`grade_${idx}`);
        }
        if (!danaFormData[`quantity_${idx}`]?.toString().trim()) {
          console.log(`❌ Missing quantity for selected product ${idx}`);
          missing.push(`quantity_${idx}`);
        }
      }
    }
  } else {
    // Single product - check regular fields
    const batchFields = ["typeOfRawBlock", "densityValue", "densityType", "recycledDana", "weight", "grade", "quantity"];
    batchFields.forEach(field => {
      if (!danaFormData[field]?.toString().trim()) {
        console.log(`❌ Missing batch field: ${field}`);
        missing.push(field);
      }
    });
  }
} else if (type === "production") {
    // For multi-product, check only selected products
    if (hasMultipleProducts) {
      const selected = selectedProducts.length === productList.length ? selectedProducts : productList.map(() => true);
      for (let idx = 0; idx < productList.length; idx++) {
        if (selected[idx]) {
          if (!shapeFormData[`dryWeight_${idx}`]?.toString().trim()) {
            console.log(`❌ Missing dryWeight for selected product ${idx}`);
            missing.push(`dryWeight_${idx}`);
          }
          if (!shapeFormData[`quantity_${idx}`]?.toString().trim()) {
            console.log(`❌ Missing quantity for selected product ${idx}`);
            missing.push(`quantity_${idx}`);
          }
          // remarks are optional
        }
      }
    } else {
      // Single product - check regular fields
      checkMissing(["dryWeight", "quantity", "remarks"], shapeFormData);
    }
  } else if (type === "dispatch") {
    // For multi-product, check only selected products
    if (hasMultipleProducts) {
      const selected = selectedProducts.length === productList.length ? selectedProducts : productList.map(() => true);
      for (let idx = 0; idx < productList.length; idx++) {
        if (selected[idx]) {
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
      }
    } else {
      // Single product - check regular fields
      checkMissing(["size", "density", "quantity", "remarks"], cuttingFormData);
    }
  } else if (type === "cnc-slip") {
    // For multi-product, check only selected products
    if (hasMultipleProducts) {
      const selected = selectedProducts.length === productList.length ? selectedProducts : productList.map(() => true);
      for (let idx = 0; idx < productList.length; idx++) {
        if (selected[idx]) {
          const size = cncFormData[`size_${idx}`];
          const quantity = cncFormData[`quantity_${idx}`];
          
          if (!size?.toString().trim()) {
            console.log(`❌ Missing size for selected product ${idx}`);
            missing.push(`size_${idx}`);
          }
          if (!quantity?.toString().trim()) {
            console.log(`❌ Missing quantity for selected product ${idx}`);
            missing.push(`quantity_${idx}`);
          }
        }
      }
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
      const selected = selectedProducts.length === productList.length ? selectedProducts : productList.map(() => true);
      for (let idx = 0; idx < productList.length; idx++) {
        if (selected[idx]) {
          const quantity = packagingFormData[`quantity_${idx}`];
          if (!quantity?.toString().trim()) {
            console.log(`❌ Missing quantity for selected product ${idx}`);
            missing.push(`quantity_${idx}`);
          }
          // remarks are optional
        }
      }
    } else {
      // Single product - check regular fields
      if (!packagingFormData.quantity?.toString().trim()) {
        missing.push("quantity");
      }
      // remarks are optional
    }
  } else if (type === "dana-beads") {
  // For multi-product, check only selected products
  if (hasMultipleProducts) {
    const selected = selectedProducts.length === productList.length ? selectedProducts : productList.map(() => true);
    for (let idx = 0; idx < productList.length; idx++) {
      if (selected[idx]) {
        if (!danaBeadsFormData[`density_${idx}`]?.toString().trim()) {
          console.log(`❌ Missing density for selected product ${idx}`);
          missing.push(`density_${idx}`);
        }
        if (!danaBeadsFormData[`quantity_${idx}`]?.toString().trim()) {
          console.log(`❌ Missing quantity for selected product ${idx}`);
          missing.push(`quantity_${idx}`);
        }
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
  // Filter products based on selection
  let productsData = null;
  let topLevelTypeOfRawBlock = "";
  let topLevelDensity = "";
  
  if (hasMultipleProducts) {
    const selected = selectedProducts.length === productList.length ? selectedProducts : productList.map(() => true);
    const filteredProducts = productList.filter((_, idx) => selected[idx]);
    if (filteredProducts.length > 0) {
      productsData = filteredProducts.map((product) => {
        const originalIdx = productList.indexOf(product);
        const typeOfRawBlock = danaFormData[`typeOfRawBlock_${originalIdx}`] || danaFormData[`typeOfRawBlockCustom_${originalIdx}`] || "";
        const densityValue = danaFormData[`densityValue_${originalIdx}`] || "";
        const densityType = danaFormData[`densityType_${originalIdx}`] || "";
        const density = `${densityValue} ${densityType}`.trim();
        
        // Use first product's values for top-level fields
        if (originalIdx === filteredProducts[0] && productsData === null) {
          topLevelTypeOfRawBlock = typeOfRawBlock;
          topLevelDensity = density;
        }
        
                const productFromList = products.find(p => p.name === product.productName);

        return {
          productName: product.productName,
          typeOfRawBlock: typeOfRawBlock,
          density: density,
          densityValue: densityValue,
          densityType: densityType,
          recycledDana: danaFormData[`recycledDana_${originalIdx}`] || "",
          weight: danaFormData[`weight_${originalIdx}`] || "",
          grade: danaFormData[`grade_${originalIdx}`] || "",
          quantity: danaFormData[`quantity_${originalIdx}`] !== undefined 
            ? danaFormData[`quantity_${originalIdx}`] 
            : product.quantity,
          remarks: danaFormData[`remarks_${originalIdx}`] !== undefined 
            ? danaFormData[`remarks_${originalIdx}`] 
            : (product.productRemarks || ""),
                    productUnit: danaFormData[`productUnit_${originalIdx}`] || product.productUnit || "", // ✅ ADD
                productImages: productFromList?.images || product.images || [], // ✅ ADD THIS
  };
      });
    }
  }

  await onSubmit({
    danaFormData: {
      ...danaFormData,
      productName: hasMultipleProducts ? "Multiple Products" : (selectedOrder?.product || ""),
      isMultiProduct: hasMultipleProducts,
      // Add these top-level fields required by backend
      typeOfRawBlock: hasMultipleProducts ? topLevelTypeOfRawBlock : danaFormData.typeOfRawBlock,
      density: hasMultipleProducts ? topLevelDensity : danaFormData.density,
      products: productsData,
    },
  });
}
 else if (type === "production") {
      // Filter products based on selection
      let productsData = null;
      if (hasMultipleProducts) {
        const selected = selectedProducts.length === productList.length ? selectedProducts : productList.map(() => true);
        const filteredProducts = productList.filter((_, idx) => selected[idx]);
        if (filteredProducts.length > 0) {
          productsData = filteredProducts.map((product) => {
            const originalIdx = productList.indexOf(product);
                               const productFromList = products.find(p => p.name === product.productName);
            return {
              productName: product.productName,
              dryWeight: shapeFormData[`dryWeight_${originalIdx}`] !== undefined 
                ? shapeFormData[`dryWeight_${originalIdx}`] 
                : (product.density || ""),
              quantity: shapeFormData[`quantity_${originalIdx}`] !== undefined 
                ? shapeFormData[`quantity_${originalIdx}`] 
                : product.quantity,
              remarks: shapeFormData[`remarks_${originalIdx}`] !== undefined 
                ? shapeFormData[`remarks_${originalIdx}`] 
                : (product.productRemarks || ""),
          productUnit: shapeFormData[`productUnit_${originalIdx}`] || product.productUnit || "", // ✅ USE FORM DATA
          productImages: productFromList?.images || product.images || [], // ✅ FIX: Use 'images'
     };
          });
        }
      }

      console.log("📤 Submitting Production slip:", {
        isMultiProduct: hasMultipleProducts,
        productsData,
        selectedCount: productsData?.length || 0,
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
      // Filter products based on selection
      let rowData = [];
      if (hasMultipleProducts) {
        const selected = selectedProducts.length === productList.length ? selectedProducts : productList.map(() => true);
        const filteredProducts = productList.filter((_, idx) => selected[idx]);

        if (filteredProducts.length > 0) {
          rowData = filteredProducts.map((product) => {
            const originalIdx = productList.indexOf(product);
                           const productFromList = products.find(p => p.name === product.productName);
            return {
              productName: product.productName,
              size: cuttingFormData[`size_${originalIdx}`] !== undefined 
                ? cuttingFormData[`size_${originalIdx}`] 
                : (product.size || ""),
              density: cuttingFormData[`density_${originalIdx}`] !== undefined 
                ? cuttingFormData[`density_${originalIdx}`] 
                : (product.density || ""),
              quantity: cuttingFormData[`quantity_${originalIdx}`] !== undefined 
                ? cuttingFormData[`quantity_${originalIdx}`] 
                : product.quantity,
              remarks: cuttingFormData[`remarks_${originalIdx}`] !== undefined 
                ? cuttingFormData[`remarks_${originalIdx}`] 
                : (product.productRemarks || ""),
          productUnit: cuttingFormData[`productUnit_${originalIdx}`] || product.productUnit || "", // ✅ ADD
          productImages: productFromList?.images || product.images || [], // ✅ FIX: Use 'images'
 };
          });
        }
      }

      console.log("📤 Submitting Dispatch slip:", {
        isMultiProduct: hasMultipleProducts,
        rowData,
        selectedCount: rowData.length,
      });

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

   // Filter products based on selection
  let productsData = null;
  if (hasMultipleProducts) {
    const selected = selectedProducts.length === productList.length ? selectedProducts : productList.map(() => true);
    const filteredProducts = productList.filter((_, idx) => selected[idx]);
    if (filteredProducts.length > 0) {
      productsData = filteredProducts.map((product) => {
        const originalIdx = productList.indexOf(product);
               const productFromList = products.find(p => p.name === product.productName);

        return {
          productName: product.productName,
          size: cncFormData[`size_${originalIdx}`] !== undefined 
            ? cncFormData[`size_${originalIdx}`] 
            : (product.size || ""),
          quantity: cncFormData[`quantity_${originalIdx}`] !== undefined 
            ? cncFormData[`quantity_${originalIdx}`] 
            : product.quantity,
          drawingName: cncFormData[`drawingName_${originalIdx}`] !== undefined 
            ? cncFormData[`drawingName_${originalIdx}`] 
            : "",
          remarks: cncFormData[`remarks_${originalIdx}`] !== undefined 
            ? cncFormData[`remarks_${originalIdx}`] 
            : (product.productRemarks || ""),
          productUnit: cncFormData[`productUnit_${originalIdx}`] || product.productUnit || "", // ✅ USE FORM DATA
          productImages: productFromList?.images || product.images || [], // ✅ FIX: Use 'images'
   };
      });
    }
  }

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
      // Filter products based on selection
      let productsData = null;
      if (hasMultipleProducts) {
        const selected = selectedProducts.length === productList.length ? selectedProducts : productList.map(() => true);
        const filteredProducts = productList.filter((_, idx) => selected[idx]);
        if (filteredProducts.length > 0) {
          productsData = filteredProducts.map((product) => {
            const originalIdx = productList.indexOf(product);
                   const productFromList = products.find(p => p.name === product.productName);

            return {
              productName: product.productName,
              packagingWeight: packagingFormData[`packagingWeight_${originalIdx}`] !== undefined 
                ? packagingFormData[`packagingWeight_${originalIdx}`] 
                : "",
              packagingType: packagingFormData[`packagingType_${originalIdx}`] !== undefined 
                ? packagingFormData[`packagingType_${originalIdx}`] 
                : "",
              quantity: packagingFormData[`quantity_${originalIdx}`] !== undefined 
                ? packagingFormData[`quantity_${originalIdx}`] 
                : product.quantity,
              remarks: packagingFormData[`remarks_${originalIdx}`] !== undefined 
                ? packagingFormData[`remarks_${originalIdx}`] 
                : (product.productRemarks || ""),
          productUnit: packagingFormData[`productUnit_${originalIdx}`] || product.productUnit || "", // ✅ ADD
          productImages: productFromList?.images || product.images || [], // ✅ FIX: Use 'images'
 };
          });
        }
      }

      console.log("📤 Submitting Packaging slip:", {
        isMultiProduct: hasMultipleProducts,
        productsData,
        selectedCount: productsData?.length || 0,
      });

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
  // Filter products based on selection
  let productsData = null;
  if (hasMultipleProducts) {
    const selected = selectedProducts.length === productList.length ? selectedProducts : productList.map(() => true);
    const filteredProducts = productList.filter((_, idx) => selected[idx]);
    if (filteredProducts.length > 0) {
      productsData = filteredProducts.map((product) => {
        const originalIdx = productList.indexOf(product);
            const productFromList = products.find(p => p.name === product.productName);

        return {
          productName: product.productName,
          density: danaBeadsFormData[`density_${originalIdx}`] !== undefined 
            ? danaBeadsFormData[`density_${originalIdx}`] 
            : product.density,
          quantity: danaBeadsFormData[`quantity_${originalIdx}`] !== undefined 
            ? danaBeadsFormData[`quantity_${originalIdx}`] 
            : product.quantity,
          remarks: danaBeadsFormData[`remarks_${originalIdx}`] !== undefined 
            ? danaBeadsFormData[`remarks_${originalIdx}`] 
            : (product.productRemarks || ""),
          // ✅ Add recycleDana and nextGrade per product
          recycleDana: danaBeadsFormData[`recycleDana_${originalIdx}`] || danaBeadsFormData.recycleDana || "no",
          nextGrade: danaBeadsFormData[`nextGrade_${originalIdx}`] || danaBeadsFormData.nextGrade || "",
          // ✅ Add productUnit per product
          productUnit: danaBeadsFormData[`productUnit_${originalIdx}`] || product.productUnit || "",
          productImages: productFromList?.images || product.images || [], // ✅ FIX: Use 'images'
 };
      });
    }
  }

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

// ✅ Helper: Get filtered products based on selection
const getFilteredProductList = () => {
  if (!hasMultipleProducts) return productList;
  // Ensure selectedProducts has the same length as productList
  const selected = selectedProducts.length === productList.length 
    ? selectedProducts 
    : productList.map(() => true);
  return productList.filter((_, idx) => selected[idx] || false);
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

        {/* ✅ Show product selection for multi-product orders */}
        {hasMultipleProducts && selectedOrder && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-bold text-blue-800">📦 Products in this Order ({productList.length} items):</h4>
              <div className="flex gap-2">
                <button 
                  type="button"
                  onClick={selectAll}
                  className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                >
                  Select All
                </button>
                <button 
                  type="button"
                  onClick={deselectAll}
                  className="text-xs bg-gray-500 text-white px-2 py-1 rounded hover:bg-gray-600"
                >
                  Deselect All
                </button>
              </div>
            </div>
            <div className="text-sm text-gray-600 mb-2">
              Selected: {selectedProducts.filter(Boolean).length} of {productList.length} products
            </div>
            <div className="space-y-1 text-sm max-h-40 overflow-y-auto">
              {productList.map((prod, idx) => (
                <div key={idx} className="flex items-center gap-2 border-b border-blue-100 pb-1">
                  <input
                    type="checkbox"
                    checked={selectedProducts[idx] || false}
                    onChange={() => toggleProduct(idx)}
                    className="w-4 h-4 accent-blue-600"
                  />
                  <span className="font-medium flex-1">{prod.productName}</span>
                  <span className="text-gray-600">Qty: {prod.quantity}</span>
                  {prod.size && <span className="text-gray-600">Size: {prod.size}</span>}
                  {prod.density && <span className="text-gray-600">Density: {prod.density}</span>}
                </div>
              ))}
            </div>
            <div className="mt-2 pt-1 border-t border-blue-200 font-bold text-blue-800">
              Total: {productList.reduce((sum, p) => sum + (parseInt(p.quantity) || 0), 0)} units
              (Selected: {productList.reduce((sum, p, idx) => sum + (selectedProducts[idx] ? (parseInt(p.quantity) || 0) : 0), 0)} units)
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Dana Slip (Block Molding) */}
        {type === "dana" && (
  <>
    <section className="space-y-4">
      <h3 className="text-2xl bg-yellow-200 py-2 text-center font-semibold text-indigo-700 border-b border-indigo-300 pb-2 select-none">
        Raw Block Order Slip
      </h3>

      {hasMultipleProducts ? (
        <div className="mb-4">
          <label className="font-bold text-xl mb-2 block">Products ({getFilteredProductList().length} selected of {productList.length})</label>
          <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
            <table className="min-w-full border border-gray-200 text-sm">
              <thead className="bg-gray-100 sticky top-0">
                <tr>
                  <th className="p-2 border min-w-[120px]">Product Name</th>
                  <th className="p-2 border min-w-[180px]">Type of Raw Block</th>
                  <th className="p-2 border min-w-[180px]">Density (Kg/m³)</th>
                  <th className="p-2 border min-w-[140px]">Recycled Dana</th>
                  <th className="p-2 border min-w-[120px]">Weight (kg)</th>
                  <th className="p-2 border min-w-[150px]">Grade</th>
                  <th className="p-2 border min-w-[80px]">Quantity</th>
                  <th className="p-2 border min-w-[150px]">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {getFilteredProductList().map((product, idx) => {
                  const originalIdx = productList.indexOf(product);
                  return (
                    <tr key={originalIdx}>
                      <td className="p-2 border">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{product.productName}</span>
                          <ShowInternalImagesButton product={products.find(p => p.name === product.productName)} />
                        </div>
                      </td>
                     <td className="p-2 border">
  <select
    value={danaFormData[`typeOfRawBlock_${originalIdx}`] || ""}
    onChange={(e) => handleDanaChange(`typeOfRawBlock_${originalIdx}`, e.target.value)}
    className="w-full p-1 border border-gray-300 rounded text-sm"
  >
    <option value="">Select...</option>
    <option value="With Both Gutka">With Both Gutka</option>
    <option value="Without Both Gutka">Without Both Gutka</option>
    <option value="Bottom Gutka">Bottom Gutka</option>
    <option value="Side Gutka">Side Gutka</option>
  </select>
  <input
    type="text"
    value={danaFormData[`typeOfRawBlockCustom_${originalIdx}`] || ""}
    onChange={(e) => handleDanaChange(`typeOfRawBlockCustom_${originalIdx}`, e.target.value)}
    placeholder="Custom type"
    className="w-full mt-1 p-1 border border-gray-300 rounded text-sm"
  />
  {/* ✅ Show image only for this specific product */}
  {selectedTypeImages[originalIdx] && (
    <div className="mt-2 p-2 border border-gray-300 rounded">
      <p className="text-sm font-medium text-gray-700">Image Reference:</p>
      <img 
        src={selectedTypeImages[originalIdx]} 
        alt="Type of Raw Block" 
        className="max-w-[200px] max-h-[100px] object-contain border border-gray-200 rounded mt-1"
      />
    </div>
  )}
</td>
                      <td className="p-2 border">
                        <div className="flex flex-col gap-1">
                          <div className="flex gap-1">
                            <input
                              type="text"
                              value={danaFormData[`densityValue_${originalIdx}`] || ""}
                              onChange={(e) => handleDanaChange(`densityValue_${originalIdx}`, e.target.value)}
                              placeholder="e.g. 21"
                              className="w-16 p-1 border border-gray-300 rounded text-sm"
                            />
                            <select
                              value={danaFormData[`densityType_${originalIdx}`] || ""}
                              onChange={(e) => handleDanaChange(`densityType_${originalIdx}`, e.target.value)}
                              className="p-1 border border-gray-300 rounded text-sm"
                            >
                              <option value="">Type</option>
                              <option value="FR">FR</option>
                              <option value="Pink FR">Pink FR</option>
                              <option value="Non FR">Non FR</option>
                              <option value="ND">ND</option>
                              <option value="Pink Non FR">Pink Non FR</option>
                            </select>
                          </div>
                        </div>
                      </td>
                      <td className="p-2 border">
                        <select
                          value={danaFormData[`recycledDana_${originalIdx}`] || ""}
                          onChange={(e) => handleDanaChange(`recycledDana_${originalIdx}`, e.target.value)}
                          className="w-full p-1 border border-gray-300 rounded text-sm"
                        >
                          <option value="">Select</option>
                          <option value="30%">30%</option>
                          <option value="50%">50%</option>
                          <option value="No">No</option>
                        </select>
                      </td>
                      <td className="p-2 border">
                        <input
                          type="text"
                          value={danaFormData[`weight_${originalIdx}`] || ""}
                          onChange={(e) => handleDanaChange(`weight_${originalIdx}`, e.target.value)}
                          placeholder="Weight"
                          className="w-full p-1 border border-gray-300 rounded text-sm"
                        />
                      </td>
                    <td className="p-2 border">
  <div className="relative grade-dropdown-container">
    <input
      type="text"
      value={danaFormData[`grade_${originalIdx}`] || ""}
      onChange={(e) => {
        const value = e.target.value;
        handleDanaChange(`grade_${originalIdx}`, value);
        setActiveGradeIndex(originalIdx);
        setShowGradeDropdown(true);
        if (value) {
          const filtered = gradeProducts.filter(product =>
            product.name.toLowerCase().includes(value.toLowerCase()) ||
            (product.description && product.description.toLowerCase().includes(value.toLowerCase()))
          );
          setFilteredGrades(filtered);
        } else {
          setFilteredGrades(gradeProducts);
        }
      }}
      onFocus={() => {
        setActiveGradeIndex(originalIdx);
        setShowGradeDropdown(true);
        setFilteredGrades(gradeProducts);
      }}
      placeholder="Grade"
      className="w-full p-1 border border-gray-300 rounded text-sm"
    />
    {showGradeDropdown && activeGradeIndex === originalIdx && (
      <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
        {filteredGrades.length > 0 ? (
          filteredGrades.map((product) => (
            <div
              key={product._id}
              className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-200"
              onClick={() => {
                handleDanaChange(`grade_${originalIdx}`, product.name);
                setShowGradeDropdown(false);
                setActiveGradeIndex(null);
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
</td>
                      <td className="p-2 border">
                        <input
                          type="number"
                          value={danaFormData[`quantity_${originalIdx}`] !== undefined ? danaFormData[`quantity_${originalIdx}`] : product.quantity}
                          onChange={(e) => handleDanaChange(`quantity_${originalIdx}`, e.target.value)}
                          placeholder="Qty"
                          className="w-full p-1 border border-gray-300 rounded text-sm"
                        />
                      </td>
                      <td className="p-2 border">
                        <input
                          type="text"
                          value={danaFormData[`remarks_${originalIdx}`] !== undefined ? danaFormData[`remarks_${originalIdx}`] : (product.productRemarks || "")}
                          onChange={(e) => handleDanaChange(`remarks_${originalIdx}`, e.target.value)}
                          placeholder="Remarks"
                          className="w-full p-1 border border-gray-300 rounded text-sm"
                        />
                      </td>
                    </tr>
                  );
                })}
                {getFilteredProductList().length === 0 && (
                  <tr>
                    <td colSpan="8" className="p-4 text-center text-gray-500">
                      No products selected. Please select at least one product.
                    </td>
                  </tr>
                )}
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
{selectedTypeImages.single && (
  <div className="mt-2 p-2 border border-gray-300 rounded">
    <p className="text-sm font-medium text-gray-700">Image Reference:</p>
    <img 
      src={selectedTypeImages.single} 
      alt="Type of Raw Block" 
      className="max-w-[200px] max-h-[100px] object-contain border border-gray-200 rounded mt-1"
    />
  </div>
)}

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
      const value = e.target.value;
      handleDanaChange("grade", value);
      setShowGradeDropdown(true);
      if (value) {
        const filtered = gradeProducts.filter(product =>
          product.name.toLowerCase().includes(value.toLowerCase()) ||
          (product.description && product.description.toLowerCase().includes(value.toLowerCase()))
        );
        setFilteredGrades(filtered);
      } else {
        setFilteredGrades(gradeProducts);
      }
    }}
    onFocus={() => {
      setShowGradeDropdown(true);
      setFilteredGrades(gradeProducts);
    }}
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
  </>
)}

          {/* Shape Moulding Slip */}
          {type === "production" && (
            <section className="space-y-4">
              <h3 className="text-2xl bg-yellow-200 py-2 text-center font-semibold text-indigo-700 border-b border-indigo-300 pb-2 select-none">
                Shape Moulding Production Slip / Die Moulding
              </h3>

            {hasMultipleProducts ? (
  <div className="mb-4">
    <label className="font-bold text-xl mb-2 block">Products ({getFilteredProductList().length} selected of {productList.length})</label>
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
          {getFilteredProductList().map((product, idx) => {
            const originalIdx = productList.indexOf(product);
            return (
              <tr key={originalIdx}>
                <td className="p-2 border">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{product.productName}</span>
                    <ShowInternalImagesButton product={products.find(p => p.name === product.productName)} />
                  </div>
                </td>
                <td className="p-2 border">
                  <input
                    type="text"
                    value={shapeFormData[`dryWeight_${originalIdx}`] !== undefined 
                      ? shapeFormData[`dryWeight_${originalIdx}`] 
                      : (product.density || "")}
                    onChange={(e) => {
                      setShapeFormData(prev => ({
                        ...prev,
                        [`dryWeight_${originalIdx}`]: e.target.value
                      }));
                    }}
                    placeholder="Dry Weight / Density"
                    className="w-32 p-1 border border-gray-300 rounded"
                  />
                </td>
                <td className="p-2 border">
                  <input
                    type="number"
                    value={shapeFormData[`quantity_${originalIdx}`] !== undefined 
                      ? shapeFormData[`quantity_${originalIdx}`] 
                      : product.quantity}
                    onChange={(e) => {
                      setShapeFormData(prev => ({
                        ...prev,
                        [`quantity_${originalIdx}`]: e.target.value
                      }));
                    }}
                    placeholder="Quantity"
                    className="w-24 p-1 border border-gray-300 rounded"
                  />
                </td>
                <td className="p-2 border">
                  <input
                    type="text"
                    value={shapeFormData[`remarks_${originalIdx}`] !== undefined 
                      ? shapeFormData[`remarks_${originalIdx}`] 
                      : (product.productRemarks || "")}
                    onChange={(e) => {
                      setShapeFormData(prev => ({
                        ...prev,
                        [`remarks_${originalIdx}`]: e.target.value
                      }));
                    }}
                    placeholder="Remarks"
                    className="w-40 p-1 border border-gray-300 rounded"
                  />
                </td>
              </tr>
            );
          })}
          {getFilteredProductList().length === 0 && (
            <tr>
              <td colSpan="4" className="p-4 text-center text-gray-500">
                No products selected. Please select at least one product.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
) : (
                <>
                  <label className="font-bold text-xl">Product Name:</label>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <input
                      type="text"
                      disabled
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
    {hasMultipleProducts ? (
      <div className="mb-4">
        <label className="font-bold text-xl mb-2 block">Products ({getFilteredProductList().length} selected of {productList.length})</label>
        <div className="overflow-x-auto max-h-96 overflow-y-auto">
          <table className="min-w-full border border-gray-200 text-sm">
            <thead className="bg-gray-100 sticky top-0">
              <tr>
                <th className="p-2 border">Product Name</th>
                <th className="p-2 border">Density (kg/m³)</th>
                <th className="p-2 border">Quantity</th>
                <th className="p-2 border">Recycle Dana</th>
<th className="p-2 border min-w-[200px]">Next Grade</th>
                <th className="p-2 border">Remarks</th>
              </tr>
            </thead>
            <tbody>
              {getFilteredProductList().map((product, idx) => {
                const originalIdx = productList.indexOf(product);
                return (
                  <tr key={originalIdx}>
                    <td className="p-2 border">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{product.productName}</span>
                        <ShowInternalImagesButton product={products.find(p => p.name === product.productName)} />
                      </div>
                    </td>
                    <td className="p-2 border">
                      <input
                        type="text"
                        value={danaBeadsFormData[`density_${originalIdx}`] !== undefined 
                          ? danaBeadsFormData[`density_${originalIdx}`] 
                          : (product.density || "")}
                        onChange={(e) => {
                          setDanaBeadsFormData(prev => ({
                            ...prev,
                            [`density_${originalIdx}`]: e.target.value
                          }));
                        }}
                        placeholder="Density"
                        className="w-28 p-1 border border-gray-300 rounded"
                      />
                    </td>
                    <td className="p-2 border">
                      <input
                        type="number"
                        value={danaBeadsFormData[`quantity_${originalIdx}`] !== undefined 
                          ? danaBeadsFormData[`quantity_${originalIdx}`] 
                          : product.quantity}
                        onChange={(e) => {
                          setDanaBeadsFormData(prev => ({
                            ...prev,
                            [`quantity_${originalIdx}`]: e.target.value
                          }));
                        }}
                        placeholder="Quantity"
                        className="w-24 p-1 border border-gray-300 rounded"
                      />
                    </td>
                    <td className="p-2 border">
                      <select
                        value={danaBeadsFormData[`recycleDana_${originalIdx}`] || "no"}
                        onChange={(e) => {
                          setDanaBeadsFormData(prev => ({
                            ...prev,
                            [`recycleDana_${originalIdx}`]: e.target.value
                          }));
                        }}
                        className="w-full p-1 border border-gray-300 rounded text-sm"
                      >
                        <option value="30%">30%</option>
                        <option value="50%">50%</option>
                        <option value="no">No</option>
                      </select>
                    </td>
                   <td className="p-2 border">
  <div className="relative dana-beads-grade-dropdown-container">
    <input
      type="text"
      value={danaBeadsFormData[`nextGrade_${originalIdx}`] || ""}
      onChange={(e) => {
        const value = e.target.value;
        setDanaBeadsFormData(prev => ({
          ...prev,
          [`nextGrade_${originalIdx}`]: value
        }));
        setActiveNextGradeIndex(originalIdx);
        setShowDanaBeadsGradeDropdown(true);
        if (value) {
          const filtered = danaBeadsGradeProducts.filter(product =>
            product.name.toLowerCase().includes(value.toLowerCase()) ||
            (product.description && product.description.toLowerCase().includes(value.toLowerCase()))
          );
          setFilteredDanaBeadsGrades(filtered);
        } else {
          setFilteredDanaBeadsGrades(danaBeadsGradeProducts);
        }
      }}
      onFocus={() => {
        setActiveNextGradeIndex(originalIdx);
        setShowDanaBeadsGradeDropdown(true);
        setFilteredDanaBeadsGrades(danaBeadsGradeProducts);
      }}
      placeholder="Next Grade"
      className="w-full p-1 border border-gray-300 rounded text-sm"
    />
    {showDanaBeadsGradeDropdown && activeNextGradeIndex === originalIdx && (
      <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
        {filteredDanaBeadsGrades.length > 0 ? (
          filteredDanaBeadsGrades.map((product) => (
            <div
              key={product._id}
              className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-200"
              onClick={() => {
                setDanaBeadsFormData(prev => ({
                  ...prev,
                  [`nextGrade_${originalIdx}`]: product.name
                }));
                setShowDanaBeadsGradeDropdown(false);
                setActiveNextGradeIndex(null);
                setSelectedDanaBeadsProductFiles(product.files || []);
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
            {danaBeadsGradeProducts.length === 0 ? 'Loading products...' : 'No products found'}
          </div>
        )}
      </div>
    )}
  </div>
</td>
                    <td className="p-2 border">
                      <input
                        type="text"
                        value={danaBeadsFormData[`remarks_${originalIdx}`] !== undefined 
                          ? danaBeadsFormData[`remarks_${originalIdx}`] 
                          : (product.productRemarks || "")}
                        onChange={(e) => {
                          setDanaBeadsFormData(prev => ({
                            ...prev,
                            [`remarks_${originalIdx}`]: e.target.value
                          }));
                        }}
                        placeholder="Remarks"
                        className="w-40 p-1 border border-gray-300 rounded"
                      />
                    </td>
                  </tr>
                );
              })}
              {getFilteredProductList().length === 0 && (
                <tr>
                  <td colSpan="6" className="p-4 text-center text-gray-500">
                    No products selected. Please select at least one product.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    ) : (
      // Single product view (keep existing)
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

      <label className="font-bold text-xl">Grade of Raw Material / Thermocol Dana:</label>
<div className="relative dana-beads-grade-dropdown-container">
  <input
    type="text"
    placeholder="Search or select grade..."
    value={danaBeadsFormData.nextGrade}
    onChange={(e) => {
      const value = e.target.value;
      setDanaBeadsFormData({ ...danaBeadsFormData, nextGrade: value });
      setShowDanaBeadsGradeDropdown(true);
      if (value) {
        const filtered = danaBeadsGradeProducts.filter(product =>
          product.name.toLowerCase().includes(value.toLowerCase()) ||
          (product.description && product.description.toLowerCase().includes(value.toLowerCase()))
        );
        setFilteredDanaBeadsGrades(filtered);
      } else {
        setFilteredDanaBeadsGrades(danaBeadsGradeProducts);
      }
    }}
    onFocus={() => {
      setShowDanaBeadsGradeDropdown(true);
      setFilteredDanaBeadsGrades(danaBeadsGradeProducts);
    }}
    className={inputClass("nextGrade")}
  />
  
  {showDanaBeadsGradeDropdown && (
    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
      {filteredDanaBeadsGrades.length > 0 ? (
        filteredDanaBeadsGrades.map((product) => (
          <div
            key={product._id}
            className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-200"
            onClick={() => {
              setDanaBeadsFormData({ 
                ...danaBeadsFormData, 
                nextGrade: product.name 
              });
              setShowDanaBeadsGradeDropdown(false);
              setSelectedDanaBeadsProductFiles(product.files || []);
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
          {danaBeadsGradeProducts.length === 0 ? 'Loading products...' : 'No products found'}
        </div>
      )}
    </div>
  )}
</div>
      </>
    )}
  </section>
)}

          {/* Packaging Slip */}
          {isPackaging && (
            <section className="space-y-4">
              <h3 className="text-2xl bg-yellow-200 py-2 text-center font-semibold text-indigo-700 border-b border-indigo-300 pb-2 select-none">
                Shape Moulding Packaging Slip
              </h3>

             {hasMultipleProducts ? (
  <div className="mb-4">
    <label className="font-bold text-xl mb-2 block">Products ({getFilteredProductList().length} selected of {productList.length})</label>
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
          {getFilteredProductList().map((product, idx) => {
            const originalIdx = productList.indexOf(product);
            return (
              <tr key={originalIdx}>
                <td className="p-2 border">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{product.productName}</span>
                    <ShowInternalImagesButton product={products.find(p => p.name === product.productName)} />
                  </div>
                </td>
                <td className="p-2 border">
                  <input
                    type="text"
                    value={packagingFormData[`packagingWeight_${originalIdx}`] !== undefined 
                      ? packagingFormData[`packagingWeight_${originalIdx}`] 
                      : ""}
                    onChange={(e) => {
                      setPackagingFormData(prev => ({
                        ...prev,
                        [`packagingWeight_${originalIdx}`]: e.target.value
                      }));
                    }}
                    placeholder="Weight"
                    className="w-28 p-1 border border-gray-300 rounded"
                  />
                </td>
                <td className="p-2 border">
                  <input
                    type="text"
                    value={packagingFormData[`packagingType_${originalIdx}`] !== undefined 
                      ? packagingFormData[`packagingType_${originalIdx}`] 
                      : ""}
                    onChange={(e) => {
                      setPackagingFormData(prev => ({
                        ...prev,
                        [`packagingType_${originalIdx}`]: e.target.value
                      }));
                    }}
                    placeholder="Type"
                    className="w-28 p-1 border border-gray-300 rounded"
                  />
                </td>
                <td className="p-2 border">
                  <input
                    type="number"
                    value={packagingFormData[`quantity_${originalIdx}`] !== undefined 
                      ? packagingFormData[`quantity_${originalIdx}`] 
                      : product.quantity}
                    onChange={(e) => {
                      setPackagingFormData(prev => ({
                        ...prev,
                        [`quantity_${originalIdx}`]: e.target.value
                      }));
                    }}
                    placeholder="Quantity"
                    className="w-24 p-1 border border-gray-300 rounded"
                  />
                </td>
                <td className="p-2 border">
                  <input
                    type="text"
                    value={packagingFormData[`remarks_${originalIdx}`] !== undefined 
                      ? packagingFormData[`remarks_${originalIdx}`] 
                      : (product.productRemarks || "")}
                    onChange={(e) => {
                      setPackagingFormData(prev => ({
                        ...prev,
                        [`remarks_${originalIdx}`]: e.target.value
                      }));
                    }}
                    placeholder="Remarks"
                    className="w-40 p-1 border border-gray-300 rounded"
                  />
                </td>
              </tr>
            );
          })}
          {getFilteredProductList().length === 0 && (
            <tr>
              <td colSpan="5" className="p-4 text-center text-gray-500">
                No products selected. Please select at least one product.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
) : (
                <>
                  <label className="font-bold text-xl">Product Name:</label>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <input
                      type="text"
                      disabled
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

             {hasMultipleProducts ? (
  <>
    <div className="mb-4">
      <label className="font-bold text-xl mb-2 block">Products ({getFilteredProductList().length} selected of {productList.length})</label>
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
            {getFilteredProductList().map((product, idx) => {
              const originalIdx = productList.indexOf(product);
              return (
                <tr key={originalIdx}>
                  <td className="p-2 border">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{product.productName}</span>
                      <ShowInternalImagesButton product={products.find(p => p.name === product.productName)} />
                    </div>
                  </td>
                  <td className="p-2 border">
                    <input
                      type="text"
                      value={cuttingFormData[`size_${originalIdx}`] !== undefined 
                        ? cuttingFormData[`size_${originalIdx}`] 
                        : (product.size || "")}
                      onChange={(e) => {
                        setCuttingFormData(prev => ({
                          ...prev,
                          [`size_${originalIdx}`]: e.target.value
                        }));
                      }}
                      placeholder="Size"
                      className="w-32 p-1 border border-gray-300 rounded"
                    />
                  </td>
                  <td className="p-2 border">
                    <input
                      type="text"
                      value={cuttingFormData[`density_${originalIdx}`] !== undefined 
                        ? cuttingFormData[`density_${originalIdx}`] 
                        : (product.density || "")}
                      onChange={(e) => {
                        setCuttingFormData(prev => ({
                          ...prev,
                          [`density_${originalIdx}`]: e.target.value
                        }));
                      }}
                      placeholder="Density"
                      className="w-28 p-1 border border-gray-300 rounded"
                    />
                  </td>
                  <td className="p-2 border">
                    <input
                      type="number"
                      value={cuttingFormData[`quantity_${originalIdx}`] !== undefined 
                        ? cuttingFormData[`quantity_${originalIdx}`] 
                        : product.quantity}
                      onChange={(e) => {
                        setCuttingFormData(prev => ({
                          ...prev,
                          [`quantity_${originalIdx}`]: e.target.value
                        }));
                      }}
                      placeholder="Quantity"
                      className="w-24 p-1 border border-gray-300 rounded"
                    />
                  </td>
                  <td className="p-2 border">
                    <input
                      type="text"
                      value={cuttingFormData[`remarks_${originalIdx}`] !== undefined 
                        ? cuttingFormData[`remarks_${originalIdx}`] 
                        : (product.productRemarks || "")}
                      onChange={(e) => {
                        setCuttingFormData(prev => ({
                          ...prev,
                          [`remarks_${originalIdx}`]: e.target.value
                        }));
                      }}
                      placeholder="Remarks"
                      className="w-40 p-1 border border-gray-300 rounded"
                    />
                  </td>
                </tr>
              );
            })}
            {getFilteredProductList().length === 0 && (
              <tr>
                <td colSpan="5" className="p-4 text-center text-gray-500">
                  No products selected. Please select at least one product.
                </td>
            </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  </>
) : (
                <>
                  <div>
                    <label className="font-bold text-xl">Product Name:</label>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <input
                        type="text"
                        disabled
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
    {hasMultipleProducts ? (
      <div className="mb-4">
        <label className="font-bold text-xl mb-2 block">Products ({getFilteredProductList().length} selected of {productList.length})</label>
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200 text-sm">
           <thead className="bg-gray-100">
  <tr>
    <th className="p-2 border">Product Name</th>
    <th className="p-2 border">Size <span className="text-red-500">*</span></th>
    <th className="p-2 border">Quantity <span className="text-red-500">*</span></th>
    <th className="p-2 border">Drawing Name</th>
    <th className="p-2 border">Remarks</th>
  </tr>
</thead>
            <tbody>
              {getFilteredProductList().map((product, idx) => {
  const originalIdx = productList.indexOf(product);
  return (
    <tr key={originalIdx}>
      <td className="p-2 border">
        <div className="flex items-center gap-2">
          <span className="font-medium">{product.productName}</span>
          <ShowInternalImagesButton product={products.find(p => p.name === product.productName)} />
        </div>
      </td>
      <td className="p-2 border">
        <input
          type="text"
          value={cncFormData[`size_${originalIdx}`] !== undefined ? cncFormData[`size_${originalIdx}`] : (product.size || "")}
          onChange={(e) => {
            setCNCFormData(prev => ({
              ...prev,
              [`size_${originalIdx}`]: e.target.value
            }));
          }}
          placeholder="Size"
          className={`w-32 p-1 border rounded ${missingFields.includes(`size_${originalIdx}`) ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
        />
      </td>
      <td className="p-2 border">
        <input
          type="number"
          value={cncFormData[`quantity_${originalIdx}`] !== undefined ? cncFormData[`quantity_${originalIdx}`] : product.quantity}
          onChange={(e) => {
            setCNCFormData(prev => ({
              ...prev,
              [`quantity_${originalIdx}`]: e.target.value
            }));
          }}
          placeholder="Quantity"
          className={`w-24 p-1 border rounded ${missingFields.includes(`quantity_${originalIdx}`) ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
        />
      </td>
      <td className="p-2 border">
        <input
          type="text"
          value={cncFormData[`drawingName_${originalIdx}`] !== undefined ? cncFormData[`drawingName_${originalIdx}`] : ""}
          onChange={(e) => {
            setCNCFormData(prev => ({
              ...prev,
              [`drawingName_${originalIdx}`]: e.target.value
            }));
          }}
          placeholder="Drawing Name"
          className="w-32 p-1 border border-gray-300 rounded"
        />
      </td>
      <td className="p-2 border">
        <input
          type="text"
          value={cncFormData[`remarks_${originalIdx}`] !== undefined ? cncFormData[`remarks_${originalIdx}`] : (product.productRemarks || "")}
          onChange={(e) => {
            setCNCFormData(prev => ({
              ...prev,
              [`remarks_${originalIdx}`]: e.target.value
            }));
          }}
          placeholder="Remarks"
          className="w-40 p-1 border border-gray-300 rounded"
        />
      </td>
    </tr>
  );
})}
              {getFilteredProductList().length === 0 && (
                <tr>
                  <td colSpan="4" className="p-4 text-center text-gray-500">
                    No products selected. Please select at least one product.
                  </td>
                </tr>
              )}
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
            disabled
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