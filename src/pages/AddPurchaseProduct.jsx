import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import InternalNavbar from "../components/InternalNavbar";
import axiosInstance from "../axiosInstance";
import imageCompression from "browser-image-compression";
import Swal from "sweetalert2";

export default function AddPurchaseProduct() {
  const { id } = useParams();
  const isEdit = !!id;

  const [form, setForm] = useState({
    name: "",
    unit: "",
        weight: "", // 🆕 Add this
    hsnCode: "",
    gstPercent: "",
    price: "",
    description: "",
    category: "",
    comment: "",
    initialQuantity: "",
    isGiftItem: false,
    giftCategory: "Diwali"
  });

  const [files, setFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [existingFiles, setExistingFiles] = useState([]);
  const [categories, setCategories] = useState([]);

  const [internalFiles, setInternalFiles] = useState([]);
  const [internalPreviews, setInternalPreviews] = useState([]);
  const [existingInternalFiles, setExistingInternalFiles] = useState([]);

  const navigate = useNavigate();
  
  useEffect(() => {
    axiosInstance.get("/categories").then((res) => {
      setCategories(res.data || []);
    });
  }, []);

// Fetch product if editing
useEffect(() => {
  if (isEdit) {
    axiosInstance.get(`/purchase-products/${id}`).then((res) => {
      const productData = res.data;
      
      // Fix: Extract category ID if category is an object
      if (productData.category && typeof productData.category === 'object') {
        productData.category = productData.category._id;
      }
      
      // 🆕 Convert weight from kg (stored) to grams for display
      if (productData.weight) {
        productData.weight = (productData.weight * 1000).toString();
      }
      
      setForm(productData);
      setExistingFiles(productData.files || []);
      setExistingInternalFiles(productData.internalImages || []);
    });
  }
}, [id]);
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    const previews = selectedFiles.map((file) =>
      file.type.startsWith("image/") ? URL.createObjectURL(file) : "pdf"
    );
    setFiles((prev) => [...prev, ...selectedFiles]);
    setPreviewUrls((prev) => [...prev, ...previews]);
  };

  const handleRemoveFile = (index) => {
    Swal.fire({
      title: "Are you sure?",
      text: "You want to delete this image?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
    }).then((result) => {
      if (result.isConfirmed) {
        setFiles((prev) => prev.filter((_, i) => i !== index));
        setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
      }
    });
  };

  const handleRemoveExistingFile = (index) => {
    Swal.fire({
      title: "Are you sure?",
      text: "You want to delete this image?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
    }).then((result) => {
      if (result.isConfirmed) {
        setExistingFiles((prev) => prev.filter((_, i) => i !== index));
      }
    });
  };

  const handleRemoveInternal = (index) => {
    Swal.fire({
      title: "Are you sure?",
      text: "You want to delete this image?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
    }).then((result) => {
      if (result.isConfirmed) {
        setInternalFiles((prev) => prev.filter((_, i) => i !== index));
        setInternalPreviews((prev) => prev.filter((_, i) => i !== index));
      }
    });
  };

  const handleRemoveExistingInternal = (index) => {
    Swal.fire({
      title: "Are you sure?",
      text: "You want to delete this image?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
    }).then((result) => {
      if (result.isConfirmed) {
        setExistingInternalFiles((prev) => prev.filter((_, i) => i !== index));
      }
    });
  };

  const uploadToCloudinary = async (fileList) => {
    const uploads = fileList.map(async (file) => {
      let fileToUpload = file;

      if (file.type.startsWith("image/")) {
        try {
          fileToUpload = await imageCompression(file, {
            maxSizeMB: 0.5,
            maxWidthOrHeight: 1200,
            useWebWorker: true,
          });
        } catch (err) {
          console.warn("Image compression failed", err);
        }
      }

      const data = new FormData();
      data.append("file", fileToUpload);
      data.append("upload_preset", "todo_uploads");
      data.append("cloud_name", "dcr8k5amk");

      const res = await fetch(
        "https://api.cloudinary.com/v1_1/dcr8k5amk/upload",
        {
          method: "POST",
          body: data,
        }
      );

      const result = await res.json();
      return {
        url: result.secure_url,
        public_id: result.public_id,
      };
    });

    return Promise.all(uploads);
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  
  // For gift items, don't validate HSN code
  if (!form.isGiftItem) {
    if (
      !form.hsnCode ||
      form.hsnCode.length < 6 ||
      form.hsnCode.length > 8 ||
      isNaN(form.hsnCode)
    ) {
      toast.error("HSN Code must be a number with 6 to 8 digits");
      return;
    }
  }

  try {
    toast.loading("Uploading files...");
    const uploadedFiles = await uploadToCloudinary(files);
    const uploadedInternal = await uploadToCloudinary(internalFiles);
    const allFiles = [...existingFiles, ...uploadedFiles];
    const allInternal = [...existingInternalFiles, ...uploadedInternal];
    toast.dismiss();

    // ✅ Prepare data based on whether it's a gift or regular product
    let submitData = {
      ...form,
      files: allFiles,
      internalImages: allInternal,
    };
    
    // 🆕 Convert weight from grams to kilograms for storage
    if (submitData.weight) {
      submitData.weight = parseFloat(submitData.weight) / 1000;
    }
    
    // For Diwali gift items
    if (form.isGiftItem) {
      // Remove category field if empty for gifts
      if (!submitData.category) {
        delete submitData.category;
      }
      
      // Set initial quantity as stock and available quantity
      if (form.initialQuantity) {
        submitData.stock = parseInt(form.initialQuantity);
        submitData.availableQuantity = parseInt(form.initialQuantity);
      }
      
      // ✅ For Diwali gifts, automatically set giftCategory to "Diwali"
      submitData.giftCategory = "Diwali";
      
      // For gift items, don't require price, hsnCode, gstPercent
      // Set default values if not provided
      if (!submitData.price) submitData.price = 0;
      if (!submitData.hsnCode) submitData.hsnCode = "GIFT001";
      if (!submitData.gstPercent) submitData.gstPercent = 0;
      
      // Validate required fields for Diwali gifts
      if (!submitData.name || submitData.name.trim() === "") {
        toast.error("Diwali gift name is required");
        return;
      }
      
      if (!submitData.initialQuantity || parseInt(submitData.initialQuantity) < 1) {
        toast.error("Initial quantity is required for Diwali gifts");
        return;
      }
    } else {
      // For regular products, ensure category is provided
      if (!submitData.category) {
        toast.error("Category is required for regular products");
        return;
      }
    }

    if (isEdit) {
      await axiosInstance.put(`/purchase-products/${id}`, submitData);
      toast.success(form.isGiftItem ? "Diwali gift updated" : "Product updated");
    } else {
      await axiosInstance.post("/purchase-products", submitData);
      toast.success(form.isGiftItem ? "Diwali gift added" : "Product added");
    }

    navigate("/all-purchase-products");
  } catch (err) {
    console.error("Add purchase product error:", err);
    toast.error(err.response?.data?.error || "Failed to submit product");
  }
};

  const handleInternalChange = (e) => {
    const selected = Array.from(e.target.files);
    const previews = selected.map((file) =>
      file.type.startsWith("image/") ? URL.createObjectURL(file) : "pdf"
    );
    setInternalFiles((prev) => [...prev, ...selected]);
    setInternalPreviews((prev) => [...prev, ...previews]);
  };

  return (
    <>
      <InternalNavbar />
      <div className="max-w-2xl mx-auto p-6 bg-white rounded shadow mt-4">
        <h2 className="text-xl font-bold mb-4 text-center">
          {isEdit ? "✏️ Edit Purchase Product" : "➕ Add Purchase Product"}
        </h2>

       <form onSubmit={handleSubmit} className="space-y-4">
  {/* Gift Item Checkbox - Always shown at top */}
  <div className="flex items-center gap-3 p-4 bg-orange-50 rounded-lg border border-orange-200">
    <input
      id="isGiftItem"
      name="isGiftItem"
      type="checkbox"
      checked={form.isGiftItem}
      onChange={(e) => setForm(prev => ({ ...prev, isGiftItem: e.target.checked }))}
      className="w-5 h-5"
    />
    <label htmlFor="isGiftItem" className="font-bold text-lg text-orange-700">
      🪔 This is a Diwali Gift Item
    </label>
  </div>

  {/* Regular Product Form - Only shown when NOT a Diwali gift */}
  {!form.isGiftItem ? (
    <>
      {["name", "unit", "description", "hsnCode", "gstPercent", "price"].map((field) => (
        <div key={field}>
          <label
            className="block font-semibold mb-1 capitalize"
            htmlFor={field}
          >
            {field === "hsnCode"
              ? "HSN Code"
              : field === "gstPercent"
              ? "GST (%)"
              : field === "description"
              ? "Specifications / Description of Product"
              : field.charAt(0).toUpperCase() + field.slice(1)}
          </label>
          {field === "description" ? (
            <textarea
              id={field}
              name={field}
              value={form[field]}
              onChange={handleChange}
              placeholder="Enter description"
              className="w-full border p-2 rounded"
            />
          ) : (
            <input
              id={field}
              name={field}
              value={form[field]}
              onChange={handleChange}
              placeholder={field.toUpperCase()}
              className="w-full border p-2 rounded"
              required={!form.isGiftItem}
            />
          )}
        </div>
      ))}

    {/* 🆕 Weight Field - Now in grams */}
<div>
  <label className="block font-semibold mb-1" htmlFor="weight">
    Weight (grams)
  </label>
  <input
    id="weight"
    name="weight"
    type="number"
    step="1"
    min="0"
    value={form.weight}
    onChange={handleChange}
    placeholder="e.g., 1500, 2750, 500"
    className="w-full border p-2 rounded"
  />
  <p className="text-sm text-gray-500 mt-1">
    Enter weight in grams (used for costing calculations)
  </p>
</div>

      {/* Category Field - Required for regular products */}
      <div>
        <label className="block font-semibold mb-1">Category *</label>
        <select
          name="category"
          value={form.category}
          onChange={handleChange}
          className="w-full border p-2 rounded"
          required={!form.isGiftItem}
        >
          <option value="">Select Category</option>
          {categories.map((cat) => (
            <option key={cat._id} value={cat._id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* Regular product file uploads */}
      <div>
        <label className="block font-semibold mb-1" htmlFor="fileInput">
          Upload Product Sheet Images (Images or PDFs)
        </label>
        <input
          id="fileInput"
          type="file"
          multiple
          accept="image/*,.pdf"
          onChange={handleFileChange}
          className="w-full border p-2 rounded"
        />

        {/* Existing uploaded files */}
        {existingFiles.length > 0 && (
          <div className="flex flex-wrap gap-3 mt-3">
            {existingFiles.map((file, i) => (
              <div
                key={i}
                className="relative border rounded bg-gray-100 w-24 h-24 flex items-center justify-center overflow-hidden"
              >
                {file.url.toLowerCase().includes(".pdf") ? (
                  <span className="text-3xl text-red-600">📄</span>
                ) : (
                  <img
                    src={file.url}
                    alt={`file-${i}`}
                    className="object-cover w-full h-full cursor-pointer"
                    onClick={() => {
                      Swal.fire({
                        imageUrl: file.url,
                        imageAlt: "Product Image",
                        showConfirmButton: true,
                        confirmButtonText: "Close",
                        confirmButtonColor: "#dc2626",
                        width: "auto",
                        padding: 0,
                      });
                    }}
                  />
                )}
                <button
                  type="button"
                  onClick={() => handleRemoveExistingFile(i)}
                  className="absolute top-1 right-1 bg-red-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {/* New file previews */}
        {previewUrls.length > 0 && (
          <div className="flex flex-wrap gap-3 mt-3">
            {previewUrls.map((preview, i) => (
              <div
                key={i}
                className="relative border rounded bg-gray-100 w-24 h-24 flex items-center justify-center overflow-hidden"
              >
                {preview === "pdf" || files[i]?.type?.includes("pdf") ? (
                  <span className="text-3xl text-red-600">📄</span>
                ) : (
                  <img
                    src={preview}
                    alt={`file-${i}`}
                    className="object-cover w-full h-full cursor-pointer"
                    onClick={() => {
                      Swal.fire({
                        imageUrl: preview,
                        imageAlt: "Product Image",
                        showConfirmButton: true,
                        confirmButtonText: "Close",
                        confirmButtonColor: "#dc2626",
                        width: "auto",
                        padding: 0,
                      });
                    }}
                  />
                )}
                <button
                  type="button"
                  onClick={() => handleRemoveFile(i)}
                  className="absolute top-1 right-1 bg-red-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <label className="block font-semibold mb-1">
          Upload Internal Product Sheet Images
        </label>
        <input
          type="file"
          multiple
          accept="image/*,.pdf"
          onChange={handleInternalChange}
          className="w-full border p-2 rounded"
        />

        {/* Existing internal files */}
        {existingInternalFiles.length > 0 && (
          <div className="flex flex-wrap gap-3 mt-3">
            {existingInternalFiles.map((file, i) => (
              <div
                key={i}
                className="relative border rounded w-24 h-24 flex items-center justify-center bg-gray-100"
              >
                {file.url.toLowerCase().includes(".pdf") ? (
                  <span className="text-3xl">📄</span>
                ) : (
                  <img
                    src={file.url}
                    alt="internal"
                    className="object-cover w-full h-full cursor-pointer"
                    onClick={() => {
                      Swal.fire({
                        imageUrl: file.url,
                        imageAlt: "Internal Product Image",
                        showConfirmButton: true,
                        confirmButtonText: "Close",
                        confirmButtonColor: "#dc2626",
                        width: "auto",
                        padding: 0,
                      });
                    }}
                  />
                )}
                <button
                  type="button"
                  onClick={() => handleRemoveExistingInternal(i)}
                  className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {/* New internal previews */}
        {internalPreviews.length > 0 && (
          <div className="flex flex-wrap gap-3 mt-3">
            {internalPreviews.map((preview, i) => (
              <div
                key={i}
                className="relative border rounded w-24 h-24 flex items-center justify-center bg-gray-100"
              >
                {preview === "pdf" ? (
                  <span className="text-3xl">📄</span>
                ) : (
                  <img
                    src={preview}
                    alt="preview"
                    className="object-cover w-full h-full cursor-pointer"
                    onClick={() => {
                      Swal.fire({
                        imageUrl: preview,
                        imageAlt: "Internal Product Image",
                        showConfirmButton: true,
                        confirmButtonText: "Close",
                        confirmButtonColor: "#dc2626",
                        width: "auto",
                        padding: 0,
                      });
                    }}
                  />
                )}
                <button
                  type="button"
                  onClick={() => handleRemoveInternal(i)}
                  className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-5 h-5"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <label className="block font-semibold mb-1" htmlFor="comment">
          Internal Description(Comments)
        </label>
        <textarea
          id="comment"
          name="comment"
          value={form.comment}
          onChange={handleChange}
          placeholder="Enter any additional comments or notes about this product"
          className="w-full border p-2 rounded"
          rows="3"
        />
      </div>
    </>
  ) : (
    /* Diwali Gift Form - Only shown when IS a Diwali gift */
    <div className="space-y-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
      <h3 className="font-bold text-lg text-orange-700 mb-4">🪔 Diwali Gift Item Details</h3>
      
      {/* Gift Name */}
      <div>
        <label className="block font-semibold mb-1" htmlFor="name">
          Diwali Gift Name *
        </label>
        <input
          id="name"
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Enter Diwali gift name (e.g., Diwali Hamper, Diwali Sweet Box, etc.)"
          className="w-full border p-2 rounded"
          required
        />
      </div>

      {/* Initial Quantity */}
      <div>
        <label className="block font-semibold mb-1" htmlFor="initialQuantity">
          Initial Quantity (Available for distribution) *
        </label>
        <input
          id="initialQuantity"
          name="initialQuantity"
          type="number"
          min="1"
          value={form.initialQuantity}
          onChange={handleChange}
          placeholder="Enter initial quantity"
          className="w-full border p-2 rounded"
          required
        />
        <p className="text-sm text-gray-500 mt-1">
          This will be set as the available stock for Diwali gift distribution.
        </p>
      </div>

      {/* Gift Description */}
      <div>
        <label className="block font-semibold mb-1" htmlFor="description">
          Gift Description (Optional)
        </label>
        <textarea
          id="description"
          name="description"
          value={form.description}
          onChange={handleChange}
          placeholder="Describe the Diwali gift item"
          className="w-full border p-2 rounded"
          rows="3"
        />
      </div>

      {/* Gift Image Upload */}
      <div>
        <label className="block font-semibold mb-1" htmlFor="fileInput">
          Upload Diwali Gift Images (Optional)
        </label>
        <input
          id="fileInput"
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileChange}
          className="w-full border p-2 rounded"
        />
        <p className="text-sm text-gray-500 mt-1">
          Upload images of the Diwali gift item for reference
        </p>

        {/* Existing gift images */}
        {existingFiles.length > 0 && (
          <div className="mt-3">
            <p className="text-sm font-medium text-gray-600 mb-2">Existing Diwali Gift Images:</p>
            <div className="flex flex-wrap gap-3">
              {existingFiles.map((file, i) => (
                <div
                  key={i}
                  className="relative border rounded bg-gray-100 w-24 h-24 flex items-center justify-center overflow-hidden"
                >
                  <img
                    src={file.url}
                    alt={`gift-${i}`}
                    className="object-cover w-full h-full cursor-pointer"
                    onClick={() => {
                      Swal.fire({
                        imageUrl: file.url,
                        imageAlt: "Diwali Gift Image",
                        showConfirmButton: true,
                        confirmButtonText: "Close",
                        confirmButtonColor: "#dc2626",
                        width: "auto",
                        padding: 0,
                      });
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveExistingFile(i)}
                    className="absolute top-1 right-1 bg-red-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* New gift image previews */}
        {previewUrls.length > 0 && (
          <div className="mt-3">
            <p className="text-sm font-medium text-gray-600 mb-2">New Diwali Gift Images:</p>
            <div className="flex flex-wrap gap-3">
              {previewUrls.map((preview, i) => (
                <div
                  key={i}
                  className="relative border rounded bg-gray-100 w-24 h-24 flex items-center justify-center overflow-hidden"
                >
                  <img
                    src={preview}
                    alt={`new-gift-${i}`}
                    className="object-cover w-full h-full cursor-pointer"
                    onClick={() => {
                      Swal.fire({
                        imageUrl: preview,
                        imageAlt: "Diwali Gift Image",
                        showConfirmButton: true,
                        confirmButtonText: "Close",
                        confirmButtonColor: "#dc2626",
                        width: "auto",
                        padding: 0,
                      });
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveFile(i)}
                    className="absolute top-1 right-1 bg-red-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )}

  <button
    type="submit"
    className={`w-full px-4 py-2 rounded font-bold ${
      form.isGiftItem 
        ? "bg-orange-600 hover:bg-orange-700 text-white" 
        : "bg-green-600 hover:bg-green-700 text-white"
    }`}
  >
    {isEdit 
      ? form.isGiftItem 
        ? "🪔 Update Diwali Gift" 
        : "💾 Update Product"
      : form.isGiftItem 
        ? "🪔 Add Diwali Gift" 
        : "✅ Add Purchase Product"
    }
  </button>
</form>
      </div>
    </>
  );
}