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
  });
  const [images, setImages] = useState([]); // Array for multiple images
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const newFiles = Array.from(e.target.files);
    console.log("Selected files:", newFiles);

    // Append new images but limit total to 5
    setImages((prev) => {
      // Combine previous and new, then slice max 5
      const combined = [...prev, ...newFiles].slice(0, 5);
      return combined;
    });
  };

  // Optionally: Remove image by index
  const handleRemoveImage = (idx) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true); // Start loader

    const data = new FormData();

    // Append form fields
    Object.entries(formData).forEach(([key, val]) => {
      if (key === "sizes") {
        data.append(key, JSON.stringify(val.split(",").map((s) => s.trim())));
      } else {
        data.append(key, val);
      }
    });

    // Append all images under 'images' key
    images.forEach((file) => {
      data.append("images", file);
    });

    try {
      await axiosInstance.post("/products-multer", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Product added successfully!");
      navigate("/dashboard");
    } catch (err) {
      console.error("Product addition failed", err);
      alert("Failed to add product");
    } finally {
      setIsLoading(false); // Stop loader
    }
  };

  return (
    <>
      <InternalNavbar />

     

      <div className="max-w-xl mx-auto mt-12 p-6 bg-white rounded-lg shadow-lg relative">
        {/* Back button for md+ screens */}
        <button
          className="hidden md:block absolute top-6 left-6 cursor-pointer bg-blue-600 text-white px-4 py-2 rounded-md shadow-md hover:bg-blue-700 transition-colors"
          onClick={() => navigate(-1)}
          aria-label="Back"
        >
          ↩️ Back
        </button>

        <h2 className="text-3xl font-extrabold text-center mb-8 text-gray-800">
          Add New Product
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <input
            name="name"
            placeholder="Product Name"
            required
            value={formData.name}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />

          <input
            name="unit"
            placeholder="Unit (e.g. kg)"
            required
            value={formData.unit}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />

          <input
            name="sizes"
            placeholder="Sizes (comma separated, e.g. S, M, L)"
            value={formData.sizes}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />
         

          <label className="block text-gray-700 font-semibold mb-2">
            Upload Images (max 5)
          </label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageChange}
            className="w-full cursor-pointer rounded border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />

          {/* Preview selected images with remove button */}
          <div className="flex flex-wrap gap-4 mt-4">
            {images.map((file, idx) => (
              <div
                key={idx}
                className="relative w-24 h-24 rounded-lg border overflow-hidden shadow-md"
              >
                <img
                  src={URL.createObjectURL(file)}
                  alt={`Preview ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveImage(idx)}
                  className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-700 transition"
                  aria-label="Remove image"
                >
                  &times;
                </button>
              </div>
            ))}
          </div>

         <button
  type="submit"
  disabled={isLoading}
  className={`w-full font-bold py-3 rounded-lg shadow-lg transition-colors
    ${isLoading ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 text-white"}`}
>
  {isLoading ? "Adding Product..." : "Add Product"}
</button>
{isLoading && (
  <p className="text-center text-blue-600 mt-2">Please wait, uploading product...</p>
)}

        </form>
      </div>
    </>
  );
}
