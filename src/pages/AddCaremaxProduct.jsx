import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../axiosInstance";
import InternalNavbar from "../components/InternalNavbar";
import toast from "react-hot-toast";
import imageCompression from "browser-image-compression";
import { motion } from "framer-motion";

export default function AddCaremaxProduct() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  
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

  const [images, setImages] = useState([]);
  const [documents, setDocuments] = useState([]);

  const categories = [
    "Construction", "Industrial", "Packaging", "Automotive", "Consumer", "Other"
  ];

  const units = ["Pcs", "Kg", "Gm", "Ltr", "Mtr", "Set", "Box", "Packet", "Roll"];

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
    
    setImages(prev => [...prev, ...compressed].slice(0, 10));
  };

  const handleDocumentChange = (e) => {
    const files = Array.from(e.target.files);
    setDocuments(prev => [...prev, ...files].slice(0, 5));
  };

  const removeImage = (idx) => {
    setImages(prev => prev.filter((_, i) => i !== idx));
  };

  const removeDocument = (idx) => {
    setDocuments(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const data = new FormData();
    
    // Append all form data
    Object.entries(formData).forEach(([key, val]) => {
      if (key === "sizes" || key === "colors" || key === "tags") {
        data.append(key, JSON.stringify(val.split(",").map(s => s.trim())));
      } else if (key === "dimensions") {
        data.append(key, JSON.stringify(val));
      } else if (typeof val !== 'object') {
        data.append(key, val);
      }
    });

    // Append images and documents
    images.forEach(file => data.append("images", file));
    documents.forEach(file => data.append("documents", file));

    try {
      await axiosInstance.post("/caremax-products", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Caremax product added successfully!");
      navigate("/caremax-impex/all-products");
    } catch (err) {
      console.error("Failed to add product", err);
      toast.error(err.response?.data?.error || "Failed to add product");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <InternalNavbar />
      <div className="max-w-4xl mx-auto mt-8 p-6 bg-white rounded-lg shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-emerald-700">Add Caremax Product</h2>
          <button
            onClick={() => navigate("/caremax-impex")}
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
                <label className="block text-sm font-medium mb-1">Product Code *</label>
                <input
                  name="productCode"
                  value={formData.productCode}
                  onChange={handleChange}
                  placeholder="Auto-generated if empty"
                  className="w-full p-2 border rounded"
                />
                <p className="text-xs text-gray-500 mt-1">Leave empty for auto-generation</p>
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

          {/* Images */}
          <div className="border rounded-lg p-4">
            <h3 className="text-xl font-bold mb-4 text-gray-700">Product Images</h3>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageChange}
              className="w-full border rounded p-2"
            />
            <div className="flex flex-wrap gap-2 mt-2">
              {images.map((file, idx) => (
                <div key={idx} className="relative w-20 h-20 border rounded overflow-hidden">
                  <img src={URL.createObjectURL(file)} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute top-0 right-0 bg-red-600 text-white rounded-full w-5 h-5 text-xs"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Documents */}
          <div className="border rounded-lg p-4">
            <h3 className="text-xl font-bold mb-4 text-gray-700">Documents (PDF, Images)</h3>
            <input
              type="file"
              accept="image/*,application/pdf"
              multiple
              onChange={handleDocumentChange}
              className="w-full border rounded p-2"
            />
            <div className="flex flex-wrap gap-2 mt-2">
              {documents.map((file, idx) => (
                <div key={idx} className="relative w-20 h-20 border rounded flex items-center justify-center">
                  {file.type === "application/pdf" ? (
                    <span className="text-red-600">📄 PDF</span>
                  ) : (
                    <img src={URL.createObjectURL(file)} alt="Doc" className="w-full h-full object-cover" />
                  )}
                  <button
                    type="button"
                    onClick={() => removeDocument(idx)}
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

          {/* Submit Button */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={isLoading}
              className={`flex-1 bg-emerald-600 text-white py-3 rounded-lg font-semibold ${isLoading ? 'opacity-50' : 'hover:bg-emerald-700'}`}
            >
              {isLoading ? "Adding Product..." : "Add Caremax Product"}
            </button>
            <button
              type="button"
              onClick={() => navigate("/caremax-impex")}
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