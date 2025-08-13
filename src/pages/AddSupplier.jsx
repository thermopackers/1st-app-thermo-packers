import { useState, useEffect } from "react";
import axiosInstance from "../axiosInstance";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import InternalNavbar from "../components/InternalNavbar";
import imageCompression from "browser-image-compression";

export default function AddSupplier() {
const [form, setForm] = useState({
  name: "", phone: "", phone2: "", email: "", address: "", gstNumber: "",
  locationLink: "", accountName: "", accountNumber: "", ifscCode: "",
   bankName: "", vendorCategory: ""
});
const [gstError, setGstError] = useState("");

const [chequeFiles, setChequeFiles] = useState([]);
const [chequePreviewUrls, setChequePreviewUrls] = useState([]);
const [frequentProducts, setFrequentProducts] = useState([]);
const [currentPage, setCurrentPage] = useState(1);
const [totalPages, setTotalPages] = useState(1);

  const [files, setFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [existingCloudFiles, setExistingCloudFiles] = useState([]);

  const navigate = useNavigate();
  const { id } = useParams(); // ← Get supplier ID from URL

  // 🔄 Load supplier if in edit mode
  useEffect(() => {
    if (id) {
      fetchSupplier();
          fetchPaginatedProducts(1); // ensure initial paginated data
    }
  }, [id]);

  const fetchSupplier = async () => {
    try {
      const res = await axiosInstance.get(`/suppliers/${id}`);
setForm(res.data);
setExistingCloudFiles(res.data.files || []);
setPreviewUrls(res.data.files?.map(f => f.url || f) || []);

// ✅ Fetch frequently purchased items
try {
  const freqRes = await axiosInstance.get(`/purchase-orders/frequent-products/${id}?page=1&limit=5`);
setFrequentProducts(freqRes.data.data);
setTotalPages(freqRes.data.totalPages);
setCurrentPage(1);
} catch (err) {
  console.warn("Failed to load frequent products", err);
}
 } catch (err) {
      toast.error("Failed to load supplier data");
    }
  };
const fetchPaginatedProducts = async (page) => {
  try {
    const res = await axiosInstance.get(`/purchase-orders/frequent-products/${id}?page=${page}&limit=5`);
    setFrequentProducts(res.data.data);
    setTotalPages(res.data.totalPages);
    setCurrentPage(page);
  } catch (err) {
    console.warn("❌ Failed to paginate frequent products", err);
  }
};

const handleChange = (e) => {
  const { name, value } = e.target;

  if (name === "gstNumber") {
    if (value && value.length !== 15) {
      setGstError("GST number must be exactly 15 characters.");
    } else {
      setGstError("");
    }
  }

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
  const upload = async (fileArray) => {
    const uploads = fileArray.map(async (file) => {
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

  const gstUploads = await upload(files);
  const chequeUploads = await upload(chequeFiles);

  return { gstUploads, chequeUploads };
};



  const handleSubmit = async (e) => {
    e.preventDefault();
  if (form.gstNumber && form.gstNumber.length !== 15) {
  setGstError("GST number must be exactly 15 characters.");
  toast.error("GST number must be exactly 15 characters.");
  return;
}

    try {
      toast.loading(id ? "Updating..." : "Uploading files...");
     const { gstUploads, chequeUploads } = await uploadToCloudinary();
toast.dismiss();

const payload = {
  ...form,
  files: [...existingCloudFiles, ...gstUploads],
  chequeFiles: chequeUploads
};

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
const handleChequeFileChange = (e) => {
  const selectedFiles = Array.from(e.target.files);
  const previews = selectedFiles.map(file =>
    file.type.startsWith("image/") ? URL.createObjectURL(file) : "pdf"
  );
  setChequeFiles(prev => [...prev, ...selectedFiles]);
  setChequePreviewUrls(prev => [...prev, ...previews]);
};

  return (
    <>
      <InternalNavbar />
      <div className="max-w-2xl mx-auto p-6 bg-white rounded shadow mt-4">
        <h2 className="text-xl font-bold mb-4 text-center">
          {id ? "✏️ Edit Supplier" : "➕ Add New Supplier"}
        </h2>
       <form onSubmit={handleSubmit} className="space-y-4">
  {/* Supplier Fields */}
  <div>
    <label className="block font-semibold mb-1">Supplier Name</label>
    <input name="name"  placeholder="Enter supplier name"
 value={form.name} onChange={handleChange} className="w-full border p-2 rounded" required />
  </div>

  <div>
    <label className="block font-semibold mb-1">Phone Number</label>
    <input name="phone"  placeholder="Enter phone number"
 value={form.phone} onChange={handleChange} className="w-full border p-2 rounded" />
  </div>

<div>
  <label className="block font-semibold mb-1">Phone Number 2 (Optional)</label>
  <input 
    name="phone2"  
    placeholder="Enter alternate phone number"
    value={form.phone2} 
    onChange={handleChange} 
    className="w-full border p-2 rounded" 
  />
</div>

  <div>
    <label className="block font-semibold mb-1">Email</label>
    <input type="email"  placeholder="Enter email address"
 name="email" value={form.email} onChange={handleChange} className="w-full border p-2 rounded" />
  </div>

<div>
  <label className="block font-semibold mb-1">GST Number</label>
  <input
    name="gstNumber"
    placeholder="Enter GST number"
    value={form.gstNumber}
    onChange={handleChange}
    className={`w-full border p-2 rounded ${gstError ? "border-red-500 focus:ring-red-400" : ""}`}
  />
  {gstError && <p className="text-red-500 text-sm mt-1">{gstError}</p>}
</div>



  {/* GST Files */}
  <div>
    <label className="block font-semibold mb-1">GST Documents (Images or PDFs)</label>
    <input type="file" multiple accept="image/*,.pdf" onChange={handleFileChange} className="w-full border p-2 rounded" />
  </div>
 {/* Upload Previews */}
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

  <div>
  <label className="block font-semibold mb-1">Vendor Category</label>
  <select
    name="vendorCategory"
    value={form.vendorCategory}
    onChange={handleChange}
    className="w-full border p-2 rounded"
    required
  >
    <option value="">Select Category</option>
    <option value="wood">Wood</option>
    <option value="polythene bags">Polythene Bags</option>
    <option value="hardware">Hardware</option>
    <option value="raw materials">Raw Materials</option>
    <option value="iron sheets">Iron Sheets</option>
    <option value="aluminium casting/sheets">Aluminium Casting/Sheets</option>
    <option value="boiler materials">Boiler Materials</option>
    <option value="kraft paper">Kraft Paper</option>
  </select>
</div>

  <div>
    <label className="block font-semibold mb-1">Address</label>
    <textarea name="address"  placeholder="Enter full address"
 value={form.address} onChange={handleChange} className="w-full border p-2 rounded" />
  </div>

  {/* Google Maps Location */}
  <div>
    <label className="block font-semibold mb-1">Google Maps Location Link</label>
    <input name="locationLink"  placeholder="Paste Google Maps location link"
 value={form.locationLink || ""} onChange={handleChange} className="w-full border p-2 rounded" />
  </div>

  {/* Bank Details */}
  <div className="border-t pt-4">
    <h3 className="font-bold mb-2">Bank Details</h3>

    <div>
      <label className="block font-semibold mb-1">Account Name</label>
      <input name="accountName"  placeholder="Account holder's name"
 value={form.accountName || ""} onChange={handleChange} className="w-full border p-2 rounded" />
    </div>
<div>
  <label className="block font-semibold mb-1">Bank Name</label>
  <input
    name="bankName"
    placeholder="Enter bank name"
    value={form.bankName || ""}
    onChange={handleChange}
    className="w-full border p-2 rounded"
  />
</div>

    <div>
      <label className="block font-semibold mb-1">Account Number</label>
      <input name="accountNumber"  placeholder="Bank account number"
 value={form.accountNumber || ""} onChange={handleChange} className="w-full border p-2 rounded" />
    </div>

    <div>
      <label className="block font-semibold mb-1">IFSC Code</label>
      <input name="ifscCode"  placeholder="IFSC code (e.g. SBIN0001234)"
 value={form.ifscCode || ""} onChange={handleChange} className="w-full border p-2 rounded" />
    </div>
  </div>


{/* Cheque / Passbook Files */}
<div className="mt-4">
  <label className="block font-semibold mb-1">Upload Cheque Copy / Pass Book</label>
  <input
    type="file"
    multiple
    accept="image/*,.pdf"
    onChange={handleChequeFileChange}
    className="w-full border p-2 rounded"
  />
</div>
 {chequePreviewUrls.length > 0 && (
  <div className="flex flex-wrap gap-3 mt-3">
    {chequePreviewUrls.map((preview, i) => (
      <div
        key={i}
        className="relative border rounded bg-gray-100 w-24 h-24 flex items-center justify-center overflow-hidden"
      >
        {preview === "pdf" || preview.includes(".pdf") ? (
          <span className="text-3xl text-red-600">📄</span>
        ) : (
          <img
            src={preview}
            alt={`cheque-${i}`}
            className="object-cover w-full h-full"
          />
        )}
        {/* ❌ Remove Button */}
        <button
          type="button"
          onClick={() => {
            setChequeFiles(prev => prev.filter((_, idx) => idx !== i));
            setChequePreviewUrls(prev => prev.filter((_, idx) => idx !== i));
          }}
          className="absolute top-1 right-1 bg-red-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center"
        >
          ×
        </button>
      </div>
    ))}
  </div>
)}


  {/* Submit */}
  <button type="submit" className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
    {id ? "💾 Update Supplier" : "✅ Submit Supplier"}
  </button>
</form>

      </div>
      {frequentProducts.length > 0 && (
  <div className="mt-6">
    <h3 className="text-lg font-semibold mb-2 text-blue-700">📦 Frequently Purchased Products</h3>
    <div className="overflow-x-auto border rounded">
      <table className="min-w-full table-auto border-collapse text-sm">
        <thead className="bg-gray-100 text-left">
          <tr>
            <th className="px-4 py-2 border">Last Ordered</th>
            <th className="px-4 py-2 border">Product Name</th>
            <th className="px-4 py-2 border">Price</th>
            <th className="px-4 py-2 border">Remarks</th>
            <th className="px-4 py-2 border">Times Ordered</th>
          </tr>
        </thead>
        <tbody>
          {frequentProducts.map((item, i) => (
            <tr key={i}>
              <td className="px-4 py-2 border">{new Date(item.lastOrdered).toLocaleDateString()}</td>
              <td className="px-4 py-2 border">{item.productName}</td>
              <td className="px-4 py-2 border">₹ {item.price}</td>
              <td className="px-4 py-2 border">{item.remarks || "-"}</td>
              <td className="px-4 py-2 border text-center">{item.timesOrdered}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {totalPages > 1 && (
  <div className="flex justify-center items-center gap-2 p-3">
    <button
      disabled={currentPage === 1}
      onClick={() => fetchPaginatedProducts(currentPage - 1)}
      className="px-3 py-1 border rounded disabled:opacity-50"
    >
      ◀ Prev
    </button>
    <span className="text-sm text-gray-700">
      Page {currentPage} of {totalPages}
    </span>
    <button
      disabled={currentPage === totalPages}
      onClick={() => fetchPaginatedProducts(currentPage + 1)}
      className="px-3 py-1 border rounded disabled:opacity-50"
    >
      Next ▶
    </button>
  </div>
)}

    </div>
  </div>
)}

    </>
  );
}
