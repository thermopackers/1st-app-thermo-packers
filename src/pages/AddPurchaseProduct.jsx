import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import InternalNavbar from "../components/InternalNavbar";
import axiosInstance from "../axiosInstance";
import imageCompression from "browser-image-compression";

export default function AddPurchaseProduct() {
  const { id } = useParams();
  const isEdit = !!id;

  const [form, setForm] = useState({
    name: "", unit: "", hsnCode: "", gstPercent: "", price: "", description: ""
  });

  const [files, setFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [existingFiles, setExistingFiles] = useState([]);

  const navigate = useNavigate();

  // Fetch product if editing
  useEffect(() => {
    if (isEdit) {
      axiosInstance.get(`/purchase-products/${id}`).then((res) => {
        setForm(res.data);
        setExistingFiles(res.data.files || []);
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
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRemoveExistingFile = (index) => {
    setExistingFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadToCloudinary = async () => {
    const uploads = files.map(async (file) => {
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
      const uploaded = await uploadToCloudinary();
      const allFiles = [...existingFiles, ...uploaded];
      toast.dismiss();

      if (isEdit) {
        await axiosInstance.put(`/purchase-products/${id}`, { ...form, files: allFiles });
        toast.success("Product updated");
      } else {
        await axiosInstance.post("/purchase-products", { ...form, files: allFiles });
        toast.success("Product added");
      }

      navigate("/all-purchase-products");
    } catch (err) {
      console.error(err);
      toast.error("Failed to submit product");
    }
  };

  return (
    <>
      <InternalNavbar />
      <div className="max-w-2xl mx-auto p-6 bg-white rounded shadow mt-4">
        <h2 className="text-xl font-bold mb-4 text-center">
          {isEdit ? "✏️ Edit Purchase Product" : "➕ Add Purchase Product"}
        </h2>

       <form onSubmit={handleSubmit} className="space-y-4">
  {["name", "unit", "hsnCode", "gstPercent", "price"].map((field) => (
    <div key={field}>
      <label className="block font-semibold mb-1 capitalize" htmlFor={field}>
        {field === "hsnCode" ? "HSN Code" : field === "gstPercent" ? "GST (%)" : field.charAt(0).toUpperCase() + field.slice(1)}
      </label>
      <input
        id={field}
        name={field}
        value={form[field]}
        onChange={handleChange}
        placeholder={field.toUpperCase()}
        className="w-full border p-2 rounded"
        required
      />
    </div>
  ))}

  <div>
    <label className="block font-semibold mb-1" htmlFor="description">
      Description
    </label>
    <textarea
      id="description"
      name="description"
      value={form.description}
      onChange={handleChange}
      placeholder="Description"
      className="w-full border p-2 rounded"
    />
  </div>

  <div>
    <label className="block font-semibold mb-1" htmlFor="fileInput">
      Upload Files (Images or PDFs)
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
              <img src={file.url} alt={`file-${i}`} className="object-cover w-full h-full" />
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
              <img src={preview} alt={`file-${i}`} className="object-cover w-full h-full" />
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

  <button type="submit" className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
    {isEdit ? "💾 Update Product" : "✅ Submit Purchase Product"}
  </button>
</form>

      </div>
    </>
  );
}
