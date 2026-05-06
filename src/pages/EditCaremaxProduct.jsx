import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../axiosInstance";
import InternalNavbar from "../components/InternalNavbar";
import toast from "react-hot-toast";
import imageCompression from "browser-image-compression";
import { motion } from "framer-motion";
import Swal from "sweetalert2";

export default function EditCaremaxProduct() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [product, setProduct] = useState(null);
  
  const [formData, setFormData] = useState({
    productCode: "",
    name: "",
    category: "Other",
    subCategory: "",
    unit: "Pcs",
    sizes: "",
    colors: "",
    material: "",
    brand: "Caremax Impex",
    description: "",
    technicalSpecs: "",
    weight: "",
    dimensions: { length: "", width: "", height: "", unit: "cm" },
    pcsPerPacket: "",
    mrp: "",
    sellingPrice: "",
    purchasePrice: "",
    gstPercent: "18",
    hsnCode: "",
    stockQuantity: "0",
    minStockLevel: "10",
    maxStockLevel: "1000",
    location: "",
    isActive: true,
    isFeatured: false,
    tags: "",
  });

  const [existingImages, setExistingImages] = useState([]);
  const [existingDocuments, setExistingDocuments] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [newDocuments, setNewDocuments] = useState([]);
  const [removedImages, setRemovedImages] = useState([]);
  const [removedDocuments, setRemovedDocuments] = useState([]);

  const categories = [
    "Construction", "Industrial", "Packaging", "Automotive", "Consumer", "Other"
  ];

  const units = ["Pcs", "Kg", "Gm", "Ltr", "Mtr", "Set", "Box", "Packet", "Roll"];
  const BASE_URL = import.meta.env.VITE_REACT_APP_API_URL;

  // Fetch product data
useEffect(() => {
  async function fetchProduct() {
    try {
      const res = await axiosInstance.get(`/caremax-products/${id}`);
      if (res.data && res.data.success && res.data.product) {
        const productData = res.data.product;
        setProduct(productData);
        
        // Format form data with proper defaults
        setFormData({
          productCode: productData.productCode || "",
          name: productData.name || "",
          category: productData.category || "Other",
          subCategory: productData.subCategory || "",
          unit: productData.unit || "Pcs",
          sizes: productData.sizes ? productData.sizes.join(", ") : "",
          colors: productData.colors ? productData.colors.join(", ") : "",
          material: productData.material || "",
          brand: productData.brand || "Caremax Impex",
          description: productData.description || "",
          technicalSpecs: productData.technicalSpecs || "",
          weight: productData.weight || "",
          dimensions: productData.dimensions || { length: "", width: "", height: "", unit: "cm" },
          pcsPerPacket: productData.pcsPerPacket || "",
          mrp: productData.mrp || "",
          sellingPrice: productData.sellingPrice || "",
          purchasePrice: productData.purchasePrice || "",
          gstPercent: productData.gstPercent || "18",
          hsnCode: productData.hsnCode || "",
          stockQuantity: productData.stockQuantity !== undefined && productData.stockQuantity !== null 
            ? productData.stockQuantity.toString() 
            : "0",  // ✅ Ensure it's a string
          minStockLevel: productData.minStockLevel !== undefined && productData.minStockLevel !== null
            ? productData.minStockLevel.toString()
            : "10",
          maxStockLevel: productData.maxStockLevel !== undefined && productData.maxStockLevel !== null
            ? productData.maxStockLevel.toString()
            : "1000",
          location: productData.location || "",
          isActive: productData.isActive !== false,
          isFeatured: productData.isFeatured || false,
          tags: productData.tags ? productData.tags.join(", ") : "",
        });
        
        setExistingImages(productData.images || []);
        setExistingDocuments(productData.documents || []);
      }
    } catch (error) {
      console.error("Error fetching product:", error);
      toast.error("Failed to load product data");
      navigate("/caremax-impex/all-products");
    } finally {
      setIsLoading(false);
    }
  }
  fetchProduct();
}, [id, navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleDimensionsChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      dimensions: { ...prev.dimensions, [name]: value }
    }));
  };

  const handleImageChange = async (e) => {
    const files = Array.from(e.target.files);
    const compressed = [];
    
    for (const file of files) {
      const options = { maxSizeMB: 0.5, maxWidthOrHeight: 1024, useWebWorker: true };
      const compressedFile = await imageCompression(file, options);
      compressed.push(compressedFile);
    }
    
    setNewImages(prev => [...prev, ...compressed]);
  };

  const handleDocumentChange = (e) => {
    const files = Array.from(e.target.files);
    setNewDocuments(prev => [...prev, ...files]);
  };

  const removeExistingImage = (index) => {
    const imageToRemove = existingImages[index];
    setRemovedImages(prev => [...prev, imageToRemove]);
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeNewImage = (index) => {
    setNewImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingDocument = (index) => {
    const docToRemove = existingDocuments[index];
    setRemovedDocuments(prev => [...prev, docToRemove]);
    setExistingDocuments(prev => prev.filter((_, i) => i !== index));
  };

  const removeNewDocument = (index) => {
    setNewDocuments(prev => prev.filter((_, i) => i !== index));
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  setIsSubmitting(true);

  const data = new FormData();
  
  // Append all form data with proper number conversion
  Object.entries(formData).forEach(([key, val]) => {
    if (key === "sizes" || key === "colors" || key === "tags") {
      if (val && typeof val === 'string') {
        const arr = val.split(",").map(s => s.trim()).filter(s => s);
        data.append(key, JSON.stringify(arr));
      } else {
        data.append(key, JSON.stringify([]));
      }
    } else if (key === "dimensions") {
      data.append(key, JSON.stringify(val));
    } else if (key === "stockQuantity" || key === "minStockLevel" || key === "maxStockLevel") {
      // ✅ Ensure numbers are valid
      const numValue = parseInt(val);
      const finalValue = isNaN(numValue) ? 0 : numValue;
      data.append(key, finalValue);
    } else if (key === "weight" || key === "mrp" || key === "sellingPrice" || key === "purchasePrice" || key === "gstPercent") {
      // ✅ Handle decimal numbers
      const numValue = parseFloat(val);
      const finalValue = isNaN(numValue) ? 0 : numValue;
      data.append(key, finalValue);
    } else if (typeof val !== 'object') {
      data.append(key, val || "");
    }
  });

  // Append removed items
  removedImages.forEach(img => data.append("removedImages", img));
  removedDocuments.forEach(doc => data.append("removedDocuments", doc));

  // Append new images and documents
  newImages.forEach(file => data.append("images", file));
  newDocuments.forEach(file => data.append("documents", file));

  try {
    const response = await axiosInstance.put(`/caremax-products/${id}`, data, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    if (response.data.success) {
      toast.success("Product updated successfully!");
      navigate("/caremax-impex/all-products");
    }
  } catch (err) {
    console.error("Failed to update product", err);
    const errorMessage = err.response?.data?.error || "Failed to update product";
    toast.error(errorMessage);
  } finally {
    setIsSubmitting(false);
  }
};

  if (isLoading) {
    return (
      <>
        <InternalNavbar />
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
          <p className="mt-2 text-gray-600">Loading product data...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <InternalNavbar />
      <div className="max-w-4xl mx-auto mt-8 p-6 bg-white rounded-lg shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-emerald-700">Edit Caremax Product</h2>
          <button
            onClick={() => navigate("/caremax-impex/all-products")}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
          >
            ← Back
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="border rounded-lg p-4">
            <h3 className="text-xl font-bold mb-4 text-gray-700">Basic Information</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Product Code</label>
                <input
                  name="productCode"
                  value={formData.productCode}
                  onChange={handleChange}
                  readOnly
                  className="w-full p-2 border rounded bg-gray-100"
                />
                <p className="text-xs text-gray-500 mt-1">Product code cannot be changed</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Product Name *</label>
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full p-2 border rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Category *</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Sub Category</label>
                <input
                  name="subCategory"
                  value={formData.subCategory}
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Unit *</label>
                <select
                  name="unit"
                  value={formData.unit}
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                >
                  {units.map(unit => (
                    <option key={unit} value={unit}>{unit}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Brand</label>
                <input
                  name="brand"
                  value={formData.brand}
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Material</label>
                <input
                  name="material"
                  value={formData.material}
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Sizes (comma separated)</label>
                <input
                  name="sizes"
                  value={formData.sizes}
                  onChange={handleChange}
                  placeholder="e.g., S, M, L, XL"
                  className="w-full p-2 border rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Colors (comma separated)</label>
                <input
                  name="colors"
                  value={formData.colors}
                  onChange={handleChange}
                  placeholder="e.g., Red, Blue, Green"
                  className="w-full p-2 border rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Tags (comma separated)</label>
                <input
                  name="tags"
                  value={formData.tags}
                  onChange={handleChange}
                  placeholder="e.g., bestseller, new, sale"
                  className="w-full p-2 border rounded"
                />
              </div>
            </div>
          </div>

          {/* Dimensions */}
          <div className="border rounded-lg p-4">
            <h3 className="text-xl font-bold mb-4 text-gray-700">Dimensions</h3>
            <div className="grid md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Length</label>
                <input
                  name="length"
                  type="number"
                  value={formData.dimensions.length}
                  onChange={handleDimensionsChange}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Width</label>
                <input
                  name="width"
                  type="number"
                  value={formData.dimensions.width}
                  onChange={handleDimensionsChange}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Height</label>
                <input
                  name="height"
                  type="number"
                  value={formData.dimensions.height}
                  onChange={handleDimensionsChange}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Unit</label>
                <select
                  name="unit"
                  value={formData.dimensions.unit}
                  onChange={handleDimensionsChange}
                  className="w-full p-2 border rounded"
                >
                  <option value="cm">cm</option>
                  <option value="inch">inch</option>
                  <option value="mm">mm</option>
                </select>
              </div>
            </div>
          </div>

          {/* Weight & Packaging Details */}
<div className="border rounded-lg p-4">
  <h3 className="text-xl font-bold mb-4 text-gray-700">Weight & Packaging Details</h3>
  <div className="grid md:grid-cols-2 gap-4">
    <div>
      <label className="block text-sm font-medium mb-1">
        Product Weight <span className="text-gray-400 text-xs">(in grams)</span>
      </label>
      <input
        name="weight"
        type="number"
        step="1"
        min="0"
        value={formData.weight}
        onChange={handleChange}
        placeholder="e.g., 500, 1000, 2500"
        className="w-full p-2 border rounded"
      />
      <p className="text-xs text-gray-500 mt-1">Enter weight in grams (e.g., 500 for 500g)</p>
    </div>
    
    <div>
      <label className="block text-sm font-medium mb-1">
        No. of Pieces in 1 Packet
      </label>
      <input
        name="pcsPerPacket"
        type="number"
        step="1"
        min="0"
        value={formData.pcsPerPacket}
        onChange={handleChange}
        placeholder="e.g., 10, 20, 50"
        className="w-full p-2 border rounded"
      />
      <p className="text-xs text-gray-500 mt-1">Number of pieces contained in one packet</p>
    </div>
  </div>
</div>

          {/* Pricing & GST */}
          <div className="border rounded-lg p-4">
            <h3 className="text-xl font-bold mb-4 text-gray-700">Pricing & GST</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">MRP (₹)</label>
                <input
                  name="mrp"
                  type="number"
                  step="0.01"
                  value={formData.mrp}
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Selling Price (₹) *</label>
                <input
                  name="sellingPrice"
                  type="number"
                  step="0.01"
                  value={formData.sellingPrice}
                  onChange={handleChange}
                  required
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Purchase Price (₹)</label>
                <input
                  name="purchasePrice"
                  type="number"
                  step="0.01"
                  value={formData.purchasePrice}
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">GST %</label>
                <input
                  name="gstPercent"
                  type="number"
                  step="0.1"
                  value={formData.gstPercent}
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">HSN Code</label>
                <input
                  name="hsnCode"
                  value={formData.hsnCode}
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                />
              </div>
            </div>
          </div>

          {/* Inventory */}
          <div className="border rounded-lg p-4">
            <h3 className="text-xl font-bold mb-4 text-gray-700">Inventory</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Stock Quantity</label>
                <input
                  name="stockQuantity"
                  type="number"
                  min="0"
                  value={formData.stockQuantity}
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Min Stock Level</label>
                <input
                  name="minStockLevel"
                  type="number"
                  min="0"
                  value={formData.minStockLevel}
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Max Stock Level</label>
                <input
                  name="maxStockLevel"
                  type="number"
                  min="0"
                  value={formData.maxStockLevel}
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Storage Location</label>
                <input
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="border rounded-lg p-4">
            <h3 className="text-xl font-bold mb-4 text-gray-700">Description</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Product Description</label>
                <textarea
                  name="description"
                  rows="3"
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Technical Specifications</label>
                <textarea
                  name="technicalSpecs"
                  rows="3"
                  value={formData.technicalSpecs}
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                />
              </div>
            </div>
          </div>

          {/* Existing Images */}
          {existingImages.length > 0 && (
            <div className="border rounded-lg p-4">
              <h3 className="text-xl font-bold mb-4 text-gray-700">Existing Images</h3>
              <div className="flex flex-wrap gap-2">
                {existingImages.map((img, idx) => (
                  <div key={idx} className="relative w-20 h-20 border rounded overflow-hidden">
                    <img src={img} alt={`Product ${idx + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeExistingImage(idx)}
                      className="absolute top-0 right-0 bg-red-600 text-white rounded-full w-5 h-5 text-xs hover:bg-red-700"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add New Images */}
          <div className="border rounded-lg p-4">
            <h3 className="text-xl font-bold mb-4 text-gray-700">Add New Images</h3>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageChange}
              className="w-full border rounded p-2"
            />
            <div className="flex flex-wrap gap-2 mt-2">
              {newImages.map((file, idx) => (
                <div key={idx} className="relative w-20 h-20 border rounded overflow-hidden">
                  <img src={URL.createObjectURL(file)} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeNewImage(idx)}
                    className="absolute top-0 right-0 bg-red-600 text-white rounded-full w-5 h-5 text-xs"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Existing Documents */}
          {existingDocuments.length > 0 && (
            <div className="border rounded-lg p-4">
              <h3 className="text-xl font-bold mb-4 text-gray-700">Existing Documents</h3>
              <div className="flex flex-wrap gap-2">
                {existingDocuments.map((doc, idx) => (
                  <div key={idx} className="relative w-20 h-20 border rounded flex items-center justify-center bg-gray-50">
                    {doc.endsWith(".pdf") ? (
                      <span className="text-red-600 text-xs">📄 PDF</span>
                    ) : (
                      <img src={doc} alt="Document" className="w-full h-full object-cover" />
                    )}
                    <button
                      type="button"
                      onClick={() => removeExistingDocument(idx)}
                      className="absolute top-0 right-0 bg-red-600 text-white rounded-full w-5 h-5 text-xs"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add New Documents */}
          <div className="border rounded-lg p-4">
            <h3 className="text-xl font-bold mb-4 text-gray-700">Add New Documents</h3>
            <input
              type="file"
              accept="image/*,application/pdf"
              multiple
              onChange={handleDocumentChange}
              className="w-full border rounded p-2"
            />
            <div className="flex flex-wrap gap-2 mt-2">
              {newDocuments.map((file, idx) => (
                <div key={idx} className="relative w-20 h-20 border rounded flex items-center justify-center">
                  {file.type === "application/pdf" ? (
                    <span className="text-red-600">📄 PDF</span>
                  ) : (
                    <img src={URL.createObjectURL(file)} alt="Doc" className="w-full h-full object-cover" />
                  )}
                  <button
                    type="button"
                    onClick={() => removeNewDocument(idx)}
                    className="absolute top-0 right-0 bg-red-600 text-white rounded-full w-5 h-5 text-xs"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Status */}
          <div className="border rounded-lg p-4">
            <h3 className="text-xl font-bold mb-4 text-gray-700">Status</h3>
            <div className="flex gap-6">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleChange}
                />
                Active Product
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="isFeatured"
                  checked={formData.isFeatured}
                  onChange={handleChange}
                />
                Featured Product
              </label>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`flex-1 bg-emerald-600 text-white py-3 rounded-lg font-semibold ${isSubmitting ? 'opacity-50' : 'hover:bg-emerald-700'}`}
            >
              {isSubmitting ? "Updating..." : "Update Product"}
            </button>
            <button
              type="button"
              onClick={() => navigate("/caremax-impex/all-products")}
              className="px-6 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </>
  );
}