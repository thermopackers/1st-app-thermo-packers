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
    name: "", unit: "", hsnCode: "", gstPercent: "", price: "", description: "", category: ""
  });

  const [files, setFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [existingFiles, setExistingFiles] = useState([]);
const [categories, setCategories] = useState([]);

  // 🆕 Internal
const [internalFiles, setInternalFiles] = useState([]);
const [internalPreviews, setInternalPreviews] = useState([]);
const [existingInternalFiles, setExistingInternalFiles] = useState([]);

  const navigate = useNavigate();
useEffect(() => {
  axiosInstance.get("/categories").then((res) => {
    setCategories(res.data); // assuming API returns array of { _id, name }
  });
}, []);

  // Fetch product if editing
  useEffect(() => {
    if (isEdit) {
      axiosInstance.get(`/purchase-products/${id}`).then((res) => {
        setForm(res.data);
        setExistingFiles(res.data.files || []);
              setExistingInternalFiles(res.data.internalImages || []); // 🆕 add this
      });
    }
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    const previews = selectedFiles.map(file =>
      file.type.startsWith("image/") ? URL.createObjectURL(file) : "pdf"
    );
    setFiles((prev) => [...prev, ...selectedFiles]);
    setPreviewUrls((prev) => [...prev, ...previews]);
  };

const handleRemoveFile = (index) => {
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
      setFiles((prev) => prev.filter((_, i) => i !== index));
      setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
    }
  });
};

const handleRemoveExistingFile = (index) => {
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
      setExistingFiles((prev) => prev.filter((_, i) => i !== index));
    }
  });
};

const handleRemoveInternal = (index) => {
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
      setInternalFiles((prev) => prev.filter((_, i) => i !== index));
      setInternalPreviews((prev) => prev.filter((_, i) => i !== index));
    }
  });
};

const handleRemoveExistingInternal = (index) => {
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

    const res = await fetch("https://api.cloudinary.com/v1_1/dcr8k5amk/upload", {
      method: "POST",
      body: data,
    });

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
  if (!form.hsnCode || form.hsnCode.length < 6 || form.hsnCode.length > 8 || isNaN(form.hsnCode)) {
  toast.error("HSN Code must be a number with 6 to 8 digits");
  return;
}

    try {
      toast.loading("Uploading files...");
const uploadedFiles = await uploadToCloudinary(files);
const uploadedInternal = await uploadToCloudinary(internalFiles);
const allFiles = [...existingFiles, ...uploadedFiles];
const allInternal = [...existingInternalFiles, ...uploadedInternal];
      toast.dismiss();

      if (isEdit) {
        await axiosInstance.put(`/purchase-products/${id}`, { ...form, files: allFiles,  internalImages: allInternal });
        toast.success("Product updated");
      } else {
        await axiosInstance.post("/purchase-products", { ...form, files: allFiles,  internalImages: allInternal });
        toast.success("Product added");
      }

      navigate("/all-purchase-products");
    } catch (err) {
      console.error(err);
      toast.error("Failed to submit product");
    }
  };

  const handleInternalChange = (e) => {
  const selected = Array.from(e.target.files);
  const previews = selected.map(file =>
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
{["name", "unit", "description", "hsnCode", "gstPercent", "price"].map((field) => (
  <div key={field}>
    <label className="block font-semibold mb-1 capitalize" htmlFor={field}>
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
        required
      />
    )}
  </div>
))}

<div>
  <label className="block font-semibold mb-1">Category</label>
  <select
    name="category"
    value={form.category}
    onChange={handleChange}
    className="w-full border p-2 rounded"
    required
  >
    <option value="">Select Category</option>
    {categories.map((cat) => (
      <option key={cat._id} value={cat._id}>{cat.name}</option>
    ))}
  </select>
</div>


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
      <div key={i} className="relative border rounded bg-gray-100 w-24 h-24 flex items-center justify-center overflow-hidden">
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
                imageAlt: 'Product Image',
                showConfirmButton: true,
                confirmButtonText: 'Close',
                confirmButtonColor: '#dc2626',
                width: 'auto',
                padding: 0
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
      <div key={i} className="relative border rounded bg-gray-100 w-24 h-24 flex items-center justify-center overflow-hidden">
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
                imageAlt: 'Product Image',
                showConfirmButton: true,
                confirmButtonText: 'Close',
                confirmButtonColor: '#dc2626',
                width: 'auto',
                padding: 0
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
  <label className="block font-semibold mb-1">Upload Internal Product Sheet Images</label>
  <input type="file" multiple accept="image/*,.pdf" onChange={handleInternalChange} className="w-full border p-2 rounded" />

 {/* Existing */}
{existingInternalFiles.length > 0 && (
  <div className="flex flex-wrap gap-3 mt-3">
    {existingInternalFiles.map((file, i) => (
      <div key={i} className="relative border rounded w-24 h-24 flex items-center justify-center bg-gray-100">
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
                imageAlt: 'Internal Product Image',
                showConfirmButton: true,
                confirmButtonText: 'Close',
                confirmButtonColor: '#dc2626',
                width: 'auto',
                padding: 0
              });
            }}
          />
        )}
        <button type="button" onClick={() => handleRemoveExistingInternal(i)} className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center">×</button>
      </div>
    ))}
  </div>
)}

{/* New Previews */}
{internalPreviews.length > 0 && (
  <div className="flex flex-wrap gap-3 mt-3">
    {internalPreviews.map((preview, i) => (
      <div key={i} className="relative border rounded w-24 h-24 flex items-center justify-center bg-gray-100">
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
                imageAlt: 'Internal Product Image',
                showConfirmButton: true,
                confirmButtonText: 'Close',
                confirmButtonColor: '#dc2626',
                width: 'auto',
                padding: 0
              });
            }}
          />
        )}
        <button type="button" onClick={() => handleRemoveInternal(i)} className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-5 h-5">×</button>
      </div>
    ))}
  </div>
)}
</div>


  <button type="submit" className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
    {isEdit ? "💾 Update Product" : "✅ Submit Purchase Product"}
  </button>
</form>

      </div>
    </>
  );
}
