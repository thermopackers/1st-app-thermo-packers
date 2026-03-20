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

  const [formData, setFormData] = useState({
    name: "",
    unit: "",
    sizes: [],
    quantity: 0,
    hsnCode: "",
    gstPercent: "",
      description: "", // 🆕 Add this line
        weight: "", // 🆕 NEW FIELD - Add this
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Product images
  const [images, setImages] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [removedImages, setRemovedImages] = useState([]);

  // 🆕 Internal images/pdfs
  const [internalImages, setInternalImages] = useState([]);
  const [internalPreviewUrls, setInternalPreviewUrls] = useState([]);
  const [removedInternalImages, setRemovedInternalImages] = useState([]);

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
          hsnCode: res.data.hsnCode || "",
          gstPercent: res.data.gstPercent || "",
            description: res.data.description || "", // 🆕 Add this line
              weight: res.data.weight || "", // 🆕 NEW FIELD - Add this
        });

        // Existing product images
        if (res.data.images?.length > 0) {
          setPreviewUrls(res.data.images.map((img) => (img.startsWith("http") ? img : `${BASE_URL}${img}`)));
        }

        // 🆕 Existing internal images/pdfs
        if (res.data.internalImages?.length > 0) {
          setInternalPreviewUrls(
            res.data.internalImages.map((file) => (file.startsWith("http") ? file : `${BASE_URL}${file}`))
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
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSizesChange = (e) => {
    const sizesArray = e.target.value.split(",").map((s) => s.trim());
    setFormData((prev) => ({ ...prev, sizes: sizesArray }));
  };

  // Normal images
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

 

  // 🆕 Internal images/pdfs
  const handleInternalChange = async (e) => {
    const files = Array.from(e.target.files);
    const processed = [];

    for (const file of files) {
      if (file.type.startsWith("image/")) {
        const options = { maxSizeMB: 0.5, maxWidthOrHeight: 1024, useWebWorker: true };
        const compressedFile = await imageCompression(file, options);
        processed.push(compressedFile);
      } else {
        processed.push(file); // pdfs etc
      }
    }
    setInternalImages((prev) => [...prev, ...processed]);
    setInternalPreviewUrls((prev) => [...prev, ...processed.map((f) => URL.createObjectURL(f))]);
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
    data.append("description", formData.description || ""); // 🆕 Make sure this line is included
data.append("weight", formData.weight || ""); // 🆕 NEW FIELD - Add this

    // Images
    images.forEach((imgFile) => data.append("images", imgFile));
    removedImages.forEach((imgPath) => data.append("removedImages[]", imgPath));

    // 🆕 Internal
    internalImages.forEach((file) => data.append("internalImages", file));
    removedInternalImages.forEach((filePath) => data.append("removedInternalImages[]", filePath));

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
          {/* Basic fields with labels */}
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

    {/* 🆕 NEW FIELD - Product Weight */}
  {/* <div>
    <label className="block text-gray-700 font-semibold mb-2">Product Weight</label>
    <input 
      type="text" 
      name="weight" 
      value={formData.weight} 
      onChange={handleChange} 
      placeholder="e.g., 1kg, 500g, 2.5kg" 
      className="w-full border p-2 rounded"
    />
  </div> */}

  {/* 🆕 Description Field */}
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

 {/* Product images */}
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
              // Add event listener after the modal opens
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
         {/* 🆕 Internal images/pdfs */}
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
                // Add event listener after the modal opens
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

          <button type="submit" disabled={isSubmitting} className={`bg-blue-600 text-white px-4 py-2 rounded ${isSubmitting ? "opacity-50" : "hover:bg-blue-700"}`}>
            {isSubmitting ? "Updating..." : "Update Product"}
          </button>
        </form>
      </div>
    </>
  );
}
