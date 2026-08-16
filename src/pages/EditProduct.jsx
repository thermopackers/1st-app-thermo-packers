import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../axiosInstance";
import InternalNavbar from "../components/InternalNavbar";
import toast from "react-hot-toast";
import imageCompression from "browser-image-compression";
import Swal from "sweetalert2";

export default function EditProduct() {
  const { id } = useParams();
  const navigate = useNavigate();
  const BASE_URL = import.meta.env.VITE_REACT_APP_API_URL;

  const [polybagOptions, setPolybagOptions] = useState([]);
  const [purchaseProducts, setPurchaseProducts] = useState([]);
  const [loadingPurchaseProducts, setLoadingPurchaseProducts] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    unit: "",
    sizes: [],
    quantity: 0,
    hsnCode: "",
    gstPercent: "",
    description: "",
      density: "",  // ✅ NEW: Density field
    weight: "",
    pcsPerPacket: "",
    polybagSize: "",
    conversion: "",
    salesCategory: "",
    volumePerPiece: "",
    // ✅ NEW: Non-Thermocol product fields
    isNonThermocol: false,
    linkedPurchaseProductId: "",
    tradingConversion: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Product images
  const [images, setImages] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [removedImages, setRemovedImages] = useState([]);

  // Internal images/pdfs
  const [internalImages, setInternalImages] = useState([]);
  const [internalPreviewUrls, setInternalPreviewUrls] = useState([]);
  const [removedInternalImages, setRemovedInternalImages] = useState([]);

  const [additionalImages1, setAdditionalImages1] = useState([]);
  const [additionalPreviewUrls1, setAdditionalPreviewUrls1] = useState([]);
  const [removedAdditionalImages1, setRemovedAdditionalImages1] = useState([]);

  const [additionalImages2, setAdditionalImages2] = useState([]);
  const [additionalPreviewUrls2, setAdditionalPreviewUrls2] = useState([]);
  const [removedAdditionalImages2, setRemovedAdditionalImages2] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [drawings, setDrawings] = useState([]);
  const [drawingPreviewUrls, setDrawingPreviewUrls] = useState([]);
  const [removedDrawings, setRemovedDrawings] = useState([]);

  useEffect(() => {
    return () => {
      previewUrls.forEach(url => {
        if (url && url.startsWith('blob:')) URL.revokeObjectURL(url);
      });
      internalPreviewUrls.forEach(url => {
        if (url && url.startsWith('blob:')) URL.revokeObjectURL(url);
      });
      additionalPreviewUrls1.forEach(url => {
        if (url && url.startsWith('blob:')) URL.revokeObjectURL(url);
      });
      additionalPreviewUrls2.forEach(url => {
        if (url && url.startsWith('blob:')) URL.revokeObjectURL(url);
      });
      drawingPreviewUrls.forEach(url => {
        if (url && url.startsWith('blob:')) URL.revokeObjectURL(url);
      });
    };
  }, [previewUrls, internalPreviewUrls, additionalPreviewUrls1, additionalPreviewUrls2, drawingPreviewUrls]);

  useEffect(() => {
    const fetchPolybagProducts = async () => {
      try {
        const response = await axiosInstance.get("/purchase-products/category/Lifafa Polythene bags for Packing");
        setPolybagOptions(response.data);
      } catch (error) {
        console.error("Failed to fetch polybag products:", error);
      }
    };
    fetchPolybagProducts();
  }, []);

  // ✅ NEW: Fetch purchase products when non-thermocol checkbox is checked
  useEffect(() => {
    if (formData.isNonThermocol) {
      fetchPurchaseProducts();
    }
  }, [formData.isNonThermocol]);

  const fetchPurchaseProducts = async () => {
    setLoadingPurchaseProducts(true);
    try {
      const response = await axiosInstance.get("/purchase-products/purchase-products-all");
      setPurchaseProducts(response.data);
    } catch (error) {
      console.error("Failed to fetch purchase products:", error);
      toast.error("Failed to load purchase products");
    } finally {
      setLoadingPurchaseProducts(false);
    }
  };

  useEffect(() => {
    async function fetchProduct() {
      try {
        const res = await axiosInstance.get(`/products-multer/${id}`);
        
        let weightInGrams = "";
        if (res.data.weight) {
          const weightInKg = parseFloat(res.data.weight);
          weightInGrams = (weightInKg * 1000).toString();
        }
        
        setFormData({
          name: res.data.name || "",
          unit: res.data.unit || "",
          sizes: res.data.sizes || [],
          quantity: res.data.quantity || 0,
          hsnCode: res.data.hsnCode || "",
          gstPercent: res.data.gstPercent || "",
          description: res.data.description || "",
            density: res.data.density || "",
          weight: weightInGrams,
          pcsPerPacket: res.data.pcsPerPacket || "",
          polybagSize: res.data.polybagSize || "",
          conversion: res.data.conversion || "",
          salesCategory: res.data.salesCategory || "",
          volumePerPiece: res.data.volumePerPiece || "",
          // ✅ NEW: Non-Thermocol product fields
          isNonThermocol: res.data.isNonThermocol || false,
          linkedPurchaseProductId: res.data.linkedPurchaseProductId || "",
          tradingConversion: res.data.tradingConversion || "",
        });

        if (res.data.images?.length > 0) {
          setPreviewUrls(res.data.images.map((img) => (img.startsWith("http") ? img : `${BASE_URL}${img}`)));
        }

        if (res.data.internalImages?.length > 0) {
          setInternalPreviewUrls(
            res.data.internalImages.map((file) => (file.startsWith("http") ? file : `${BASE_URL}${file}`))
          );
        }

        if (res.data.additionalImages1?.length > 0) {
          setAdditionalPreviewUrls1(
            res.data.additionalImages1.map((file) => (file.startsWith("http") ? file : `${BASE_URL}${file}`))
          );
        }

        if (res.data.additionalImages2?.length > 0) {
          setAdditionalPreviewUrls2(
            res.data.additionalImages2.map((file) => (file.startsWith("http") ? file : `${BASE_URL}${file}`))
          );
        }

        if (res.data.drawings?.length > 0) {
          setDrawingPreviewUrls(
            res.data.drawings.map((file) => (file.startsWith("http") ? file : `${BASE_URL}${file}`))
          );
        }

      } catch (err) {
        setError("Failed to load product");
      } finally {
        setLoading(false);
      }
    }
    fetchProduct();
  }, [id, BASE_URL]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  const handleSizesChange = (e) => {
    const sizesArray = e.target.value.split(",").map((s) => s.trim());
    setFormData((prev) => ({ ...prev, sizes: sizesArray }));
  };

  const MAX_FILE_SIZE_MB = 10;

  const handleImagesChange = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter((file) => {
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        toast.error(`${file.name} is larger than 10MB and was not added.`);
        return false;
      }
      return true;
    });
    if (validFiles.length === 0) return;

    setImages((prev) => [...prev, ...validFiles]);
    setPreviewUrls((prev) => [...prev, ...validFiles.map((f) => URL.createObjectURL(f))]);
  };

  const handleInternalChange = async (e) => {
    const files = Array.from(e.target.files);
    const processed = [];

    for (const file of files) {
      if (file.type.startsWith("image/")) {
        const options = { maxSizeMB: 0.5, maxWidthOrHeight: 1024, useWebWorker: true };
        const compressedFile = await imageCompression(file, options);
        const renamedFile = new File([compressedFile], file.name, { type: compressedFile.type });
        processed.push(renamedFile);
      } else {
        processed.push(file);
      }
    }
    setInternalImages((prev) => [...prev, ...processed]);
    setInternalPreviewUrls((prev) => [...prev, ...processed.map((f) => URL.createObjectURL(f))]);
  };

  const handleAdditionalImages1Change = async (e) => {
    const files = Array.from(e.target.files);
    const processed = [];

    for (const file of files) {
      if (file.type.startsWith("image/")) {
        const options = { maxSizeMB: 0.5, maxWidthOrHeight: 1024, useWebWorker: true };
        const compressedFile = await imageCompression(file, options);
        const renamedFile = new File([compressedFile], file.name, { type: compressedFile.type });
        processed.push(renamedFile);
      } else {
        processed.push(file);
      }
    }
    setAdditionalImages1((prev) => [...prev, ...processed]);
    setAdditionalPreviewUrls1((prev) => [...prev, ...processed.map((f) => URL.createObjectURL(f))]);
  };

  const handleAdditionalImages2Change = async (e) => {
    const files = Array.from(e.target.files);
    const processed = [];

    for (const file of files) {
      if (file.type.startsWith("image/")) {
        const options = { maxSizeMB: 0.5, maxWidthOrHeight: 1024, useWebWorker: true };
        const compressedFile = await imageCompression(file, options);
        const renamedFile = new File([compressedFile], file.name, { type: compressedFile.type });
        processed.push(renamedFile);
      } else {
        processed.push(file);
      }
    }
    setAdditionalImages2((prev) => [...prev, ...processed]);
    setAdditionalPreviewUrls2((prev) => [...prev, ...processed.map((f) => URL.createObjectURL(f))]);
  };

  const handleRemoveImage = (indexToRemove) => {
    Swal.fire({
      title: 'Are you sure?',
      text: "You want to delete this image?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        const removedUrl = previewUrls[indexToRemove];
        if (!removedUrl.startsWith("blob:")) {
          const relativePath = removedUrl.replace(BASE_URL, "");
          setRemovedImages((prev) => [...prev, relativePath]);
        } else {
          setImages((prev) => prev.filter((_, i) => i !== indexToRemove));
        }
        setPreviewUrls((prev) => prev.filter((_, i) => i !== indexToRemove));
      }
    });
  };

  const handleRemoveInternal = (indexToRemove) => {
    Swal.fire({
      title: 'Are you sure?',
      text: "You want to delete this image?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        const removedUrl = internalPreviewUrls[indexToRemove];
        if (!removedUrl.startsWith("blob:")) {
          const relativePath = removedUrl.replace(BASE_URL, "");
          setRemovedInternalImages((prev) => [...prev, relativePath]);
        } else {
          setInternalImages((prev) => prev.filter((_, i) => i !== indexToRemove));
        }
        setInternalPreviewUrls((prev) => prev.filter((_, i) => i !== indexToRemove));
      }
    });
  };

  const handleRemoveAdditional1 = (indexToRemove) => {
    Swal.fire({
      title: 'Are you sure?',
      text: "You want to delete this file?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        const removedUrl = additionalPreviewUrls1[indexToRemove];
        if (!removedUrl.startsWith("blob:")) {
          const relativePath = removedUrl.replace(BASE_URL, "");
          setRemovedAdditionalImages1((prev) => [...prev, relativePath]);
        } else {
          setAdditionalImages1((prev) => prev.filter((_, i) => i !== indexToRemove));
        }
        setAdditionalPreviewUrls1((prev) => prev.filter((_, i) => i !== indexToRemove));
      }
    });
  };

  const handleRemoveAdditional2 = (indexToRemove) => {
    Swal.fire({
      title: 'Are you sure?',
      text: "You want to delete this file?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        const removedUrl = additionalPreviewUrls2[indexToRemove];
        if (!removedUrl.startsWith("blob:")) {
          const relativePath = removedUrl.replace(BASE_URL, "");
          setRemovedAdditionalImages2((prev) => [...prev, relativePath]);
        } else {
          setAdditionalImages2((prev) => prev.filter((_, i) => i !== indexToRemove));
        }
        setAdditionalPreviewUrls2((prev) => prev.filter((_, i) => i !== indexToRemove));
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const data = new FormData();
      data.append("name", formData.name);
      data.append("unit", formData.unit);
      data.append("sizes", JSON.stringify(formData.sizes));
      data.append("quantity", formData.quantity);
      data.append("hsnCode", formData.hsnCode);
      data.append("gstPercent", formData.gstPercent);
      data.append("description", formData.description || "");
      data.append("density", formData.density || 0);
      data.append("polybagSize", formData.polybagSize || "");
      data.append("conversion", formData.conversion || 0);
      data.append("salesCategory", formData.salesCategory || "");
      data.append("volumePerPiece", formData.volumePerPiece || 0);
      
      // ✅ NEW: Non-Thermocol product fields
      data.append("isNonThermocol", formData.isNonThermocol);
      data.append("linkedPurchaseProductId", formData.linkedPurchaseProductId || "");
      data.append("tradingConversion", formData.tradingConversion || 0);

      const weightInKg = formData.weight ? parseFloat(formData.weight) / 1000 : "";
      data.append("weight", weightInKg);
      
      if (formData.pcsPerPacket !== undefined && formData.pcsPerPacket !== null && formData.pcsPerPacket !== "") {
        data.append("pcsPerPacket", parseInt(formData.pcsPerPacket));
      } else if (formData.pcsPerPacket === "" && formData.pcsPerPacket !== undefined) {
        data.append("pcsPerPacket", 0);
      }

      images.forEach((imgFile) => data.append("images", imgFile));
      removedImages.forEach((imgPath) => data.append("removedImages[]", imgPath));

      internalImages.forEach((file) => data.append("internalImages", file));
      removedInternalImages.forEach((filePath) => data.append("removedInternalImages[]", filePath));

      additionalImages1.forEach((file) => data.append("additionalImages1", file));
      removedAdditionalImages1.forEach((filePath) => data.append("removedAdditionalImages1[]", filePath));

      additionalImages2.forEach((file) => data.append("additionalImages2", file));
      removedAdditionalImages2.forEach((filePath) => data.append("removedAdditionalImages2[]", filePath));

      drawings.forEach((file) => data.append("drawings", file));
      removedDrawings.forEach((filePath) => data.append("removedDrawings[]", filePath));

      await axiosInstance.put(`/products-multer/${id}`, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Product updated successfully");
      navigate("/all-products");
    } catch (err) {
      console.error(err);
      setError("Failed to update product");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDrawingsChange = async (e) => {
    const files = Array.from(e.target.files);
    const processed = [];

    for (const file of files) {
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg'];
      const isStepFile = file.name.toLowerCase().endsWith('.step');
      
      if (allowedTypes.includes(file.type) || isStepFile) {
        if (file.type.startsWith("image/")) {
          const options = { maxSizeMB: 0.5, maxWidthOrHeight: 1024, useWebWorker: true };
          const compressedFile = await imageCompression(file, options);
          const renamedFile = new File([compressedFile], file.name, { type: compressedFile.type });
          processed.push(renamedFile);
        } else {
          processed.push(file);
        }
      } else {
        toast.error(`${file.name} is not supported. Use PDF, JPEG, or STEP files.`);
      }
    }
    setDrawings((prev) => [...prev, ...processed]);
    setDrawingPreviewUrls((prev) => [...prev, ...processed.map((f) => URL.createObjectURL(f))]);
  };

  const handleRemoveDrawing = (indexToRemove) => {
    Swal.fire({
      title: 'Are you sure?',
      text: "You want to delete this drawing?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        const removedUrl = drawingPreviewUrls[indexToRemove];
        if (!removedUrl.startsWith("blob:")) {
          const relativePath = removedUrl.replace(BASE_URL, "");
          setRemovedDrawings((prev) => [...prev, relativePath]);
        } else {
          setDrawings((prev) => prev.filter((_, i) => i !== indexToRemove));
        }
        setDrawingPreviewUrls((prev) => prev.filter((_, i) => i !== indexToRemove));
      }
    });
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <>
      <InternalNavbar />

      <button
        className="absolute hidden top-25 md:block left-4 cursor-pointer bg-blue-500 text-white px-4 py-2 rounded-md shadow-md hover:bg-blue-600"
        onClick={() => navigate(-1)}
      >
        ↩️ Back
      </button>

      <div className="max-w-lg mx-auto p-6 relative">
        <h2 className="text-xl font-bold mb-4">Edit Sales Product</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* ✅ NEW: Non-Thermocol Product Checkbox */}
          <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <input
              id="isNonThermocol"
              name="isNonThermocol"
              type="checkbox"
              checked={formData.isNonThermocol}
              onChange={handleChange}
              className="w-5 h-5"
            />
            <label htmlFor="isNonThermocol" className="font-bold text-lg text-blue-700">
              🔄 Non-Thermocol Products (Trading Products)
            </label>
          </div>

          {/* ✅ NEW: Non-Thermocol Product Fields - Only shown when checkbox is checked */}
          {formData.isNonThermocol && (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 space-y-4">
              <h3 className="font-bold text-blue-700">Link to Purchase Product</h3>
              
              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  Select Purchase Product to Link *
                </label>
                <select
                  name="linkedPurchaseProductId"
                  value={formData.linkedPurchaseProductId}
                  onChange={handleChange}
                  className="w-full border p-2 rounded bg-white"
                  required={formData.isNonThermocol}
                >
                  <option value="">Select Purchase Product</option>
                  {loadingPurchaseProducts ? (
                    <option disabled>Loading products...</option>
                  ) : (
                    purchaseProducts.map((product) => (
                      <option key={product._id} value={product._id}>
                        {product.name} {product.unit ? `(${product.unit})` : ''}
                      </option>
                    ))
                  )}
                </select>
                <p className="text-sm text-gray-500 mt-1">
                  Select the purchase product whose price will be used for this sales product
                </p>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  Trading Conversion (₹ per kg)
                </label>
                <input
                  type="number"
                  step="any"
                  name="tradingConversion"
                  placeholder="e.g., 1.5, 2, 0.75"
                  value={formData.tradingConversion}
                  onChange={handleChange}
                  className="w-full border p-2 rounded"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Enter conversion rate for trading product (added to purchase price)
                </p>
              </div>
            </div>
          )}

          <div>
            <label className="block text-gray-700 font-semibold mb-2">Product Name *</label>
            <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full border p-2 rounded" required />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">Unit *</label>
            <input type="text" name="unit" value={formData.unit} onChange={handleChange} className="w-full border p-2 rounded" required />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">Sizes</label>
            <input type="text" name="sizes" value={formData.sizes.join(", ")} onChange={handleSizesChange} className="w-full border p-2 rounded" />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">HSN Code</label>
            <input type="text" name="hsnCode" value={formData.hsnCode} onChange={handleChange} className="w-full border p-2 rounded" placeholder="HSN Code" />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">GST Percentage</label>
            <input type="number" name="gstPercent" value={formData.gstPercent} onChange={handleChange} className="w-full border p-2 rounded" placeholder="GST %" min={0} max={100} />
          </div>

        <div>
  <label className="block text-gray-700 font-semibold mb-2">Density (kg/m³)</label>
  <input 
    type="number"
    step="0.01"
    min="0"
    name="density" 
    value={formData.density} 
    onChange={handleChange} 
    placeholder="e.g., 15, 25, 30" 
    className="w-full border p-2 rounded"
  />
  <p className="text-sm text-gray-500 mt-1">Enter density in kg/m³ (e.g., 15 for 15 kg/m³)</p>
</div>

<div>
  <label className="block text-gray-700 font-semibold mb-2">Product Dry Weight (grams)</label>
  <input 
    type="number"
    step="1"
    min="0"
    name="weight" 
    value={formData.weight} 
    onChange={handleChange} 
    placeholder="e.g., 500, 1000, 2500" 
    className="w-full border p-2 rounded"
  />
  <p className="text-sm text-gray-500 mt-1">Enter weight in grams (e.g., 500 for 500g)</p>
</div>
          <div>
            <label className="block text-gray-700 font-semibold mb-2">No. of Pieces in 1 Packet</label>
            <input 
              type="number"
              step="1"
              min="0"
              name="pcsPerPacket" 
              value={formData.pcsPerPacket} 
              onChange={handleChange} 
              placeholder="e.g., 10, 20, 50" 
              className="w-full border p-2 rounded"
            />
            <p className="text-sm text-gray-500 mt-1">Number of pieces contained in one packet</p>
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">Conversion</label>
            <input 
              type="number"
              step="any"
              name="conversion"
              placeholder="e.g., 1.5, 2, 0.75" 
              value={formData.conversion} 
              onChange={handleChange} 
              className="w-full border p-2 rounded"
            />
            <p className="text-sm text-gray-500 mt-1">Supports both integer and decimal values</p>
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">Sales Category</label>
            <input 
              type="text"
              name="salesCategory"
              placeholder="Enter sales category" 
              value={formData.salesCategory} 
              onChange={handleChange} 
              className="w-full border p-2 rounded"
            />
            <p className="text-sm text-gray-500 mt-1">Categorize product for sales reporting</p>
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">Volume of 1 Piece (m³)</label>
            <input 
              type="number"
              step="0.0001"
              min="0"
              name="volumePerPiece"
              placeholder="e.g., 0.001, 0.005" 
              value={formData.volumePerPiece} 
              onChange={handleChange} 
              className="w-full border p-2 rounded"
            />
            <p className="text-sm text-gray-500 mt-1">Enter volume in cubic meters (m³)</p>
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">Internal Description(Comments)</label>
            <textarea 
              name="description" 
              value={formData.description} 
              onChange={handleChange} 
              placeholder="Product Description"
              rows="4"
              className="w-full border p-2 rounded"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">Size of Polybag/Lifafa Used</label>
            <select 
              name="polybagSize" 
              value={formData.polybagSize} 
              onChange={handleChange}
              className="w-full border p-2 rounded bg-white"
            >
              <option value="">Select Polybag Size</option>
              {polybagOptions.map((option) => (
                <option key={option._id} value={option._id}>
                  {option.name} {option.size ? `(${option.size})` : ''}
                </option>
              ))}
            </select>
            <p className="text-sm text-gray-500 mt-1">Select the polybag/lifafa size used for packing</p>
          </div>

          <label className="block font-semibold">Product Sheet Images</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {previewUrls.map((url, i) => (
              <div key={i} className="relative">
                <img 
                  src={url} 
                  alt={`Preview ${i}`} 
                  className="w-32 h-32 object-cover rounded cursor-pointer"
                  onClick={() => {
                    Swal.fire({
                      html: `<div style="text-align: center;">
                               <img src="${url}" style="max-width: 100%; max-height: 70vh; border-radius: 8px;" />
                               <div style="margin-top: 10px;">
                                 <button id="closeImageBtn" style="padding: 8px 16px; background: #dc2626; color: white; border: none; border-radius: 4px; cursor: pointer;">Close</button>
                               </div>
                             </div>`,
                      showConfirmButton: false,
                      width: 'auto',
                      padding: 0,
                      didOpen: () => {
                        document.getElementById('closeImageBtn').addEventListener('click', () => {
                          Swal.close();
                        });
                      }
                    });
                  }}
                />
                <button type="button" onClick={() => handleRemoveImage(i)} className="absolute top-0 right-0 bg-red-600 text-white rounded-full w-5 h-5 text-xs">×</button>
              </div>
            ))}
          </div>
          <input type="file" accept="image/*" multiple onChange={handleImagesChange} className="w-full border p-2 rounded" />
          
          <label className="block font-semibold">Internal Product Sheet Images</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {internalPreviewUrls.map((url, i) => (
              <div key={i} className="relative w-32 h-32 border rounded flex items-center justify-center overflow-hidden">
                {url.endsWith(".pdf") ? (
                  <a href={url} target="_blank" rel="noopener noreferrer" className="text-red-600 font-semibold">📄 PDF</a>
                ) : (
                  <img 
                    src={url} 
                    alt={`Internal ${i}`} 
                    className="w-full h-full object-cover cursor-pointer"
                    onClick={() => {
                      Swal.fire({
                        html: `<div style="text-align: center;">
                                 <img src="${url}" style="max-width: 100%; max-height: 70vh; border-radius: 8px;" />
                                 <div style="margin-top: 10px;">
                                   <button id="closeImageBtn" style="padding: 8px 16px; background: #dc2626; color: white; border: none; border-radius: 4px; cursor: pointer;">Close</button>
                                 </div>
                               </div>`,
                        showConfirmButton: false,
                        width: 'auto',
                        padding: 0,
                        didOpen: () => {
                          document.getElementById('closeImageBtn').addEventListener('click', () => {
                            Swal.close();
                          });
                        }
                      });
                    }}
                  />
                )}
                <button type="button" onClick={() => handleRemoveInternal(i)} className="absolute top-0 right-0 bg-red-600 text-white rounded-full w-5 h-5 text-xs">×</button>
              </div>
            ))}
          </div>
          <input type="file" accept="image/*,application/pdf" multiple onChange={handleInternalChange} className="w-full border p-2 rounded" />

          <label className="block font-semibold">Image of Weight per Piece/Set</label>
          <span className="text-sm">(Put Image of Product on Small Kanda/Weighing Scale)</span>
          <div className="flex flex-wrap gap-2 mb-2">
            {additionalPreviewUrls1.map((url, i) => (
              <div key={i} className="relative w-32 h-32 border rounded flex items-center justify-center overflow-hidden">
                {url.endsWith(".pdf") ? (
                  <a href={url} target="_blank" rel="noopener noreferrer" className="text-red-600 font-semibold">📄 PDF</a>
                ) : (
                  <img 
                    src={url} 
                    alt={`Additional1 ${i}`} 
                    className="w-full h-full object-cover cursor-pointer"
                    onClick={() => {
                      Swal.fire({
                        html: `<div style="text-align: center;">
                                 <img src="${url}" style="max-width: 100%; max-height: 70vh; border-radius: 8px;" />
                                 <div style="margin-top: 10px;">
                                   <button id="closeImageBtn" style="padding: 8px 16px; background: #dc2626; color: white; border: none; border-radius: 4px; cursor: pointer;">Close</button>
                                 </div>
                               </div>`,
                        showConfirmButton: false,
                        width: 'auto',
                        padding: 0,
                        didOpen: () => {
                          document.getElementById('closeImageBtn').addEventListener('click', () => {
                            Swal.close();
                          });
                        }
                      });
                    }}
                  />
                )}
                <button type="button" onClick={() => handleRemoveAdditional1(i)} className="absolute top-0 right-0 bg-red-600 text-white rounded-full w-5 h-5 text-xs">×</button>
              </div>
            ))}
          </div>
          <input type="file" accept="image/*,application/pdf" multiple onChange={handleAdditionalImages1Change} className="w-full border p-2 rounded" />

          <label className="block font-semibold">Product Packed Image</label>
          <span className="text-sm">(Put Image of Product Packed in Packet with Outer Dimensions of Packet mentioned on Image)</span>
          <div className="flex flex-wrap gap-2 mb-2">
            {additionalPreviewUrls2.map((url, i) => (
              <div key={i} className="relative w-32 h-32 border rounded flex items-center justify-center overflow-hidden">
                {url.endsWith(".pdf") ? (
                  <a href={url} target="_blank" rel="noopener noreferrer" className="text-red-600 font-semibold">📄 PDF</a>
                ) : (
                  <img 
                    src={url} 
                    alt={`Additional2 ${i}`} 
                    className="w-full h-full object-cover cursor-pointer"
                    onClick={() => {
                      Swal.fire({
                        html: `<div style="text-align: center;">
                                 <img src="${url}" style="max-width: 100%; max-height: 70vh; border-radius: 8px;" />
                                 <div style="margin-top: 10px;">
                                   <button id="closeImageBtn" style="padding: 8px 16px; background: #dc2626; color: white; border: none; border-radius: 4px; cursor: pointer;">Close</button>
                                 </div>
                               </div>`,
                        showConfirmButton: false,
                        width: 'auto',
                        padding: 0,
                        didOpen: () => {
                          document.getElementById('closeImageBtn').addEventListener('click', () => {
                            Swal.close();
                          });
                        }
                      });
                    }}
                  />
                )}
                <button type="button" onClick={() => handleRemoveAdditional2(i)} className="absolute top-0 right-0 bg-red-600 text-white rounded-full w-5 h-5 text-xs">×</button>
              </div>
            ))}
          </div>
          <input type="file" accept="image/*,application/pdf" multiple onChange={handleAdditionalImages2Change} className="w-full border p-2 rounded" />

          <label className="block font-semibold mt-4">Product Drawings (2D/3D)</label>
          <span className="text-sm text-gray-500 block mb-2">Technical drawings in PDF, JPEG, or STEP format</span>
          <div className="flex flex-wrap gap-2 mb-2">
            {drawingPreviewUrls.map((url, i) => (
              <div key={i} className="relative w-32 h-32 border rounded flex items-center justify-center overflow-hidden bg-gray-50">
                {url.endsWith(".pdf") ? (
                  <a href={url} target="_blank" rel="noopener noreferrer" className="text-red-600 font-semibold text-center">
                    <div className="text-2xl">📄</div>
                    <div className="text-xs">PDF</div>
                  </a>
                ) : url.toLowerCase().endsWith(".step") ? (
                  <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 font-semibold text-center">
                    <div className="text-2xl">📐</div>
                    <div className="text-xs">STEP</div>
                  </a>
                ) : (
                  <img 
                    src={url} 
                    alt={`Drawing ${i}`} 
                    className="w-full h-full object-cover cursor-pointer"
                    onClick={() => {
                      Swal.fire({
                        html: `<div style="text-align: center;">
                                 <img src="${url}" style="max-width: 100%; max-height: 70vh; border-radius: 8px;" />
                                 <div style="margin-top: 10px;">
                                   <button id="closeImageBtn" style="padding: 8px 16px; background: #dc2626; color: white; border: none; border-radius: 4px; cursor: pointer;">Close</button>
                                 </div>
                               </div>`,
                        showConfirmButton: false,
                        width: 'auto',
                        padding: 0,
                        didOpen: () => {
                          document.getElementById('closeImageBtn').addEventListener('click', () => {
                            Swal.close();
                          });
                        }
                      });
                    }}
                  />
                )}
                <button type="button" onClick={() => handleRemoveDrawing(i)} className="absolute top-0 right-0 bg-red-600 text-white rounded-full w-5 h-5 text-xs">×</button>
              </div>
            ))}
          </div>
          <input type="file" accept=".pdf,.jpeg,.jpg,.step" multiple onChange={handleDrawingsChange} className="w-full border p-2 rounded" />

          <button type="submit" disabled={isSubmitting} className={`bg-blue-600 text-white px-4 py-2 rounded ${isSubmitting ? "opacity-50" : "hover:bg-blue-700"}`}>
            {isSubmitting ? "Updating..." : "Update Product"}
          </button>
        </form>
      </div>
    </>
  );
}