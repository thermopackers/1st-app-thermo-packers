import { useState, useEffect } from "react";
import axiosInstance from "../axiosInstance";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import InternalNavbar from "../components/InternalNavbar";
import imageCompression from "browser-image-compression";

export default function AddSupplier() {
  const [form, setForm] = useState({
    name: "", company: "", phone: "", email: "", address: "", gstNumber: ""
  });
  const [files, setFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [existingCloudFiles, setExistingCloudFiles] = useState([]);

  const navigate = useNavigate();
  const { id } = useParams(); // ← Get supplier ID from URL

  // 🔄 Load supplier if in edit mode
  useEffect(() => {
    if (id) {
      fetchSupplier();
    }
  }, [id]);

  const fetchSupplier = async () => {
    try {
      const res = await axiosInstance.get(`/suppliers/${id}`);
      setForm(res.data);
      setExistingCloudFiles(res.data.files || []);
      setPreviewUrls(res.data.files?.map(f => f.url || f) || []);
    } catch (err) {
      toast.error("Failed to load supplier data");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    const previews = selectedFiles.map(file =>
      file.type.startsWith("image/") ? URL.createObjectURL(file) : "pdf"
    );
    setFiles(prev => [...prev, ...selectedFiles]);
    setPreviewUrls(prev => [...prev, ...previews]);
  };

  const handleRemoveFile = (index) => {
    if (index < existingCloudFiles.length) {
      setExistingCloudFiles(prev => prev.filter((_, i) => i !== index));
    } else {
      const localFileIndex = index - existingCloudFiles.length;
      setFiles(prev => prev.filter((_, i) => i !== localFileIndex));
    }
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
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
          console.warn("Compression error", err);
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
      return { url: result.secure_url, public_id: result.public_id };
    });

    return Promise.all(uploads);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      toast.loading(id ? "Updating..." : "Uploading files...");
      const uploaded = await uploadToCloudinary();
      toast.dismiss();

      const payload = { ...form, files: [...existingCloudFiles, ...uploaded] };

      if (id) {
        await axiosInstance.put(`/suppliers/${id}`, payload);
        toast.success("Supplier updated");
      } else {
        await axiosInstance.post("/suppliers", payload);
        toast.success("Supplier added");
      }

      navigate("/all-suppliers");
    } catch (err) {
      console.error(err);
      toast.error("Failed to submit");
    }
  };

  return (
    <>
      <InternalNavbar />
      <div className="max-w-2xl mx-auto p-6 bg-white rounded shadow mt-4">
        <h2 className="text-xl font-bold mb-4 text-center">
          {id ? "✏️ Edit Supplier" : "➕ Add New Supplier"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {["name", "company", "phone", "email", "gstNumber"].map((field) => (
            <input
              key={field}
              name={field}
              value={form[field]}
              onChange={handleChange}
              placeholder={field.toUpperCase()}
              className="w-full border p-2 rounded"
              required={field === "name"}
            />
          ))}
          <textarea
            name="address"
            value={form.address}
            onChange={handleChange}
            placeholder="Address"
            className="w-full border p-2 rounded"
          />

          <div>
            <label className="block font-semibold mb-1">Upload Files (Images or PDFs)</label>
            <input
              type="file"
              multiple
              accept="image/*,.pdf"
              onChange={handleFileChange}
              className="w-full border p-2 rounded"
            />

            {previewUrls.length > 0 && (
              <div className="flex flex-wrap gap-3 mt-3">
                {previewUrls.map((preview, i) => (
                  <div key={i} className="relative border rounded bg-gray-100 w-24 h-24 flex items-center justify-center overflow-hidden">
                    {preview === "pdf" || preview.includes(".pdf") ? (
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
            {id ? "💾 Update Supplier" : "✅ Submit Supplier"}
          </button>
        </form>
      </div>
    </>
  );
}
