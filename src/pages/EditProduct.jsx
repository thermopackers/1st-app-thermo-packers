import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../axiosInstance";
import InternalNavbar from "../components/InternalNavbar";
import toast from "react-hot-toast";

export default function EditProduct() {
  const { id } = useParams();
  const navigate = useNavigate();
  const BASE_URL = import.meta.env.VITE_REACT_APP_API_URL;

  const [formData, setFormData] = useState({
    name: "",
    unit: "",
    sizes: [],
    quantity: 0,
  });

  // Newly selected image files (File objects)
  const [images, setImages] = useState([]);
  // Preview URLs for existing images + newly selected images
  const [previewUrls, setPreviewUrls] = useState([]);

  // Store relative paths of existing images that user removed
  const [removedImages, setRemovedImages] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchProduct() {
      try {
        const res = await axiosInstance.get(`/products-multer/${id}`);

        setFormData({
          name: res.data.name || "",
          unit: res.data.unit || "",
          sizes: res.data.sizes || [],
          quantity: res.data.quantity || 0,
        });

        // Show existing images as previews if any
        if (res.data.images && res.data.images.length > 0) {
          setPreviewUrls(res.data.images.map((img) => `${BASE_URL}${img}`));
        } else if (res.data.image) {
          setPreviewUrls([`${BASE_URL}${res.data.image}`]);
        } else {
          setPreviewUrls([]);
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
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSizesChange = (e) => {
    const sizesArray = e.target.value.split(",").map((s) => s.trim());
    setFormData((prev) => ({ ...prev, sizes: sizesArray }));
  };

  // Append newly selected images
  const handleImagesChange = (e) => {
    const files = Array.from(e.target.files);

    setImages((prev) => [...prev, ...files]);

    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setPreviewUrls((prev) => [...prev, ...newPreviews]);
  };

  // Remove image by index from previews and images or mark existing as removed
  const handleRemoveImage = (indexToRemove) => {
    const removedUrl = previewUrls[indexToRemove];

    // Check if image is existing (not blob URL)
    if (!removedUrl.startsWith("blob:")) {
      // Remove BASE_URL part to get relative path
      const relativePath = removedUrl.replace(BASE_URL, "");
      setRemovedImages((prev) => [...prev, relativePath]);
    } else {
      // Remove from newly selected images
      setImages((prev) => prev.filter((_, i) => i !== indexToRemove));
    }

    setPreviewUrls((prev) => prev.filter((_, i) => i !== indexToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const data = new FormData();
      data.append("name", formData.name);
      data.append("unit", formData.unit);
      data.append("sizes", JSON.stringify(formData.sizes));
      data.append("quantity", formData.quantity);

      images.forEach((imgFile) => {
        data.append("images", imgFile);
      });

      removedImages.forEach((imgPath) => {
        data.append("removedImages[]", imgPath);
      });

      await axiosInstance.put(`/products-multer/${id}`, data, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("Product updated successfully");
      navigate("/all-products");
    } catch (err) {
      console.error(err);
      setError("Failed to update product");
    }
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <>
      <InternalNavbar />

      <button
        className="absolute hidden top-25 md:block left-4 cursor-pointer bg-blue-500 text-white px-4 py-2 rounded-md shadow-md hover:bg-blue-600 back-button"
        onClick={() => navigate(-1)}
      >
        ↩️ Back
      </button>

      <div className="max-w-lg mx-auto p-6 relative">
        <h2 className="text-xl font-bold mb-4">Edit Product</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1 font-semibold">Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full border p-2 rounded"
            />
          </div>

          <div>
            <label className="block mb-1 font-semibold">Unit</label>
            <input
              type="text"
              name="unit"
              value={formData.unit}
              onChange={handleChange}
              required
              className="w-full border p-2 rounded"
            />
          </div>

          <div>
            <label className="block mb-1 font-semibold">Sizes (comma separated)</label>
            <input
              type="text"
              name="sizes"
              value={formData.sizes.join(", ")}
              onChange={handleSizesChange}
              className="w-full border p-2 rounded"
            />
          </div>

          <div>
            <label className="block mb-1 font-semibold">Quantity</label>
            <input
              type="number"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              min={0}
              className="w-full border p-2 rounded"
            />
          </div>

          <div>
            <label className="block mb-1 font-semibold">Product Images</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {previewUrls.map((url, i) => (
                <div key={i} className="relative">
                  <img
                    src={url}
                    alt={`Preview ${i + 1}`}
                    className="w-32 h-32 object-cover rounded"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(i)}
                    className="absolute top-0 right-0 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs transform translate-x-1/2 -translate-y-1/2 hover:bg-red-700"
                    title="Remove"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImagesChange}
              className="w-full border p-2 rounded"
            />
          </div>

          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Update Product
          </button>
        </form>
      </div>
    </>
  );
}
