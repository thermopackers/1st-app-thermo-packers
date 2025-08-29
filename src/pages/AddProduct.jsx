import imageCompression from 'browser-image-compression';
import { useState } from "react";
import axiosInstance from "../axiosInstance";
import { useNavigate } from "react-router-dom";
import InternalNavbar from "../components/InternalNavbar";
import toast from "react-hot-toast";

export default function AddProduct() {
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    unit: "",
    sizes: "",
    hsnCode: "",
    gstPercent: "",
  });

  const [images, setImages] = useState([]); // product images
  const [internalImages, setInternalImages] = useState([]); // 🆕 internal images/pdfs
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ✅ Normal images compression
  const handleImageChange = async (e) => {
    const files = Array.from(e.target.files);
    const compressed = [];

    for (const file of files) {
      const options = { maxSizeMB: 0.5, maxWidthOrHeight: 1024, useWebWorker: true };
      const compressedFile = await imageCompression(file, options);
      compressed.push(compressedFile);
    }

    setImages((prev) => [...prev, ...compressed].slice(0, 5));
  };

  // ✅ Internal images & PDFs (skip compression for PDFs)
  const handleInternalChange = async (e) => {
    const files = Array.from(e.target.files);
    const processed = [];

    for (const file of files) {
      if (file.type.startsWith("image/")) {
        const options = { maxSizeMB: 0.5, maxWidthOrHeight: 1024, useWebWorker: true };
        const compressedFile = await imageCompression(file, options);
        processed.push(compressedFile);
      } else {
        // PDFs or non-images → push directly
        processed.push(file);
      }
    }

    setInternalImages((prev) => [...prev, ...processed].slice(0, 5));
  };

  const handleRemoveImage = (idx) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleRemoveInternal = (idx) => {
    setInternalImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const data = new FormData();

    // Append text fields
    Object.entries(formData).forEach(([key, val]) => {
      if (key === "sizes") {
        data.append(key, JSON.stringify(val.split(",").map((s) => s.trim())));
      } else {
        data.append(key, val);
      }
    });

    // Append product images
    images.forEach((file) => {
      data.append("images", file);
    });

    // Append internal images/pdfs
    internalImages.forEach((file) => {
      data.append("internalImages", file);
    });

    try {
      await axiosInstance.post("/products-multer", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Product added successfully!");
      navigate("/dashboard");
    } catch (err) {
      console.error("Product addition failed", err);
      const message = err.response?.data?.error || "Failed to add product";
      alert(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <InternalNavbar />
      <div className="max-w-xl mx-auto mt-12 p-6 bg-white rounded-lg shadow-lg relative">
        <button
          className="hidden md:block absolute top-6 left-6 cursor-pointer bg-blue-600 text-white px-4 py-2 rounded-md shadow-md hover:bg-blue-700 transition-colors"
          onClick={() => navigate(-1)}
        >
          ↩️ Back
        </button>

        <h2 className="text-3xl font-extrabold text-center mb-8 text-gray-800">
          Add New Product
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Text fields */}
          <input name="name" placeholder="Product Name" required value={formData.name} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-lg" />
          <input name="unit" placeholder="Unit (e.g. kg)" required value={formData.unit} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-lg" />
          <input name="sizes" placeholder="Sizes (comma separated)" value={formData.sizes} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-lg" />
          <input name="hsnCode" placeholder="HSN Code" value={formData.hsnCode} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-lg" />
          <input name="gstPercent" placeholder="GST %" type="number" min="0" max="100" value={formData.gstPercent} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-lg" />

          {/* Product Images */}
          <label className="block text-gray-700 font-semibold mb-2">Uplaod Product Sheet Images (max 5)</label>
          <input type="file" accept="image/*" multiple onChange={handleImageChange} className="w-full border rounded p-2" />
          <div className="flex flex-wrap gap-4 mt-4">
            {images.map((file, idx) => (
              <div key={idx} className="relative w-24 h-24 border rounded-lg overflow-hidden shadow">
                <img src={URL.createObjectURL(file)} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                <button type="button" onClick={() => handleRemoveImage(idx)} className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center">&times;</button>
              </div>
            ))}
          </div>

          {/* Internal Images / PDFs */}
          <label className="block text-gray-700 font-semibold mb-2">Upload Internal Product Sheet Images (max 5)</label>
          <input type="file" accept="image/*,application/pdf" multiple onChange={handleInternalChange} className="w-full border rounded p-2" />
          <div className="flex flex-wrap gap-4 mt-4">
            {internalImages.map((file, idx) => (
              <div key={idx} className="relative w-24 h-24 border rounded-lg flex items-center justify-center text-xs shadow overflow-hidden">
                {file.type === "application/pdf" ? (
                  <span className="text-red-600 font-semibold">📄 PDF</span>
                ) : (
                  <img src={URL.createObjectURL(file)} alt={`Internal ${idx + 1}`} className="w-full h-full object-cover" />
                )}
                <button type="button" onClick={() => handleRemoveInternal(idx)} className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center">&times;</button>
              </div>
            ))}
          </div>

          {/* Submit */}
          <button type="submit" disabled={isLoading} className={`w-full font-bold py-3 rounded-lg shadow ${isLoading ? "bg-blue-400" : "bg-blue-600 hover:bg-blue-700 text-white"}`}>
            {isLoading ? "Adding Product..." : "Add Product"}
          </button>
          {isLoading && <p className="text-center text-blue-600 mt-2">Please wait, uploading product...</p>}
        </form>
      </div>
    </>
  );
}
