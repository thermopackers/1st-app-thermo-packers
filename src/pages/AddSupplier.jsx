import { useState, useEffect } from "react";
import axiosInstance from "../axiosInstance";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import InternalNavbar from "../components/InternalNavbar";
import imageCompression from "browser-image-compression";
import '../index.css'
export default function AddSupplier() {
const [form, setForm] = useState({
  name: "", phone: "", phone2: "", email: "", address: "", gstNumber: "",
  locationLink: "", accountName: "", accountNumber: "", ifscCode: "",
   bankName: "", vendorCategory: []
});
const [gstError, setGstError] = useState("");
const [existingChequeCloudFiles, setExistingChequeCloudFiles] = useState([]);
const [chequeFiles, setChequeFiles] = useState([]);
const [chequePreviewUrls, setChequePreviewUrls] = useState([]);
const [frequentProducts, setFrequentProducts] = useState([]);
const [currentPage, setCurrentPage] = useState(1);
const [totalPages, setTotalPages] = useState(1);
const [supplierData, setSupplierData] = useState(null); // Add this line
const [dieMolds, setDieMolds] = useState([]);
const [securityCheques, setSecurityCheques] = useState([]);
const [showDieMoldForm, setShowDieMoldForm] = useState(false);
const [showSecurityChequeForm, setShowSecurityChequeForm] = useState(false);
const [dieMoldForm, setDieMoldForm] = useState({
  dieMoldName: "",
  remarks: "",
  files: []
});
const [securityChequeForm, setSecurityChequeForm] = useState({
  amount: "",
  chequeFile: null,
  remarks: ""
});
const [editingDieMoldId, setEditingDieMoldId] = useState(null);
const [editingSecurityChequeId, setEditingSecurityChequeId] = useState(null);
  const [files, setFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [existingCloudFiles, setExistingCloudFiles] = useState([]);

  const navigate = useNavigate();
  const { id } = useParams(); // ← Get supplier ID from URL
// Before: const categories = [ "wood", ... ];

// After:
const [categories, setCategories] = useState([]);

useEffect(() => {
  const fetchCategories = async () => {
    try {
      const res = await axiosInstance.get("/categories");
      setCategories(res.data);
    } catch (err) {
      toast.error("Failed to load categories");
    }
  };
  fetchCategories();
}, []);

  // 🔄 Load supplier if in edit mode
  // 🔄 Load supplier if in edit mode
  useEffect(() => {
    if (id) {
      fetchSupplier();
      fetchPaginatedProducts(1); // ensure initial paginated data
      fetchDieMolds();
      fetchSecurityCheques();
    }
  }, [id]);

const fetchSupplier = async () => {
  try {
    const res = await axiosInstance.get(`/suppliers/${id}`);
    const supplier = res.data;
    
    // Store complete supplier data for WhatsApp sharing
    setSupplierData(supplier);

    // 🔄 Always make vendorCategory an array
    setForm({
      ...supplier,
      vendorCategory: Array.isArray(supplier.vendorCategory)
        ? supplier.vendorCategory
        : supplier.vendorCategory
        ? [supplier.vendorCategory]
        : []
    });

    setExistingCloudFiles(supplier.files || []);
    setPreviewUrls(supplier.files?.map(f => f.url || f) || []);

    // ✅ Load existing cheque files
    setExistingChequeCloudFiles(supplier.chequeFiles || []);
    setChequePreviewUrls(supplier.chequeFiles?.map(f => f.url || f) || []);

    // ✅ Fetch frequently purchased items
    try {
      const freqRes = await axiosInstance.get(
        `/purchase-orders/frequent-products/${id}?page=1&limit=5`
      );
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

const fetchDieMolds = async () => {
  try {
    const res = await axiosInstance.get(`/suppliers/${id}/die-molds`);
    if (res.data.success) {
      setDieMolds(res.data.dieMolds || []);
    }
  } catch (err) {
    console.error("Failed to fetch die/molds", err);
  }
};

const fetchSecurityCheques = async () => {
  try {
    const res = await axiosInstance.get(`/suppliers/${id}/security-cheques`);
    if (res.data.success) {
      setSecurityCheques(res.data.securityCheques || []);
    }
  } catch (err) {
    console.error("Failed to fetch security cheques", err);
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

// WhatsApp share function
const shareOnWhatsApp = () => {
  if (!supplierData) {
    toast.error("Supplier data not loaded yet");
    return;
  }

  // Format the message
  const message = `*Supplier Details*%0A
🏢 *Name:* ${supplierData.name || 'N/A'}%0A
📞 *Phone:* ${supplierData.phone || 'N/A'}${supplierData.phone2 ? `, ${supplierData.phone2}` : ''}%0A
📧 *Email:* ${supplierData.email || 'N/A'}%0A
📍 *Address:* ${supplierData.address || 'N/A'}%0A
🗺️ *Location:* ${supplierData.locationLink || 'N/A'}%0A`;

  // Open WhatsApp with the message
  window.open(`https://wa.me/?text=${message}`, '_blank');
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
      chequeFiles: [...existingChequeCloudFiles, ...chequeUploads] // Include existing cheque files
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

const handleRemoveChequeFile = (index) => {
  if (index < existingChequeCloudFiles.length) {
    // Remove existing cloud file
    setExistingChequeCloudFiles(prev => prev.filter((_, i) => i !== index));
  } else {
    // Remove local file
    const localFileIndex = index - existingChequeCloudFiles.length;
    setChequeFiles(prev => prev.filter((_, i) => i !== localFileIndex));
  }
  setChequePreviewUrls(prev => prev.filter((_, i) => i !== index));
};

// ==================== DIE/MOLD HANDLERS ====================

const handleEditDieMold = (dieMold) => {
  setDieMoldForm({
    dieMoldName: dieMold.dieMoldName,
    remarks: dieMold.remarks || "",
    files: dieMold.files || []
  });
  setEditingDieMoldId(dieMold._id);
  setShowDieMoldForm(true);
  
  setTimeout(() => {
    const formSection = document.getElementById('die-mold-section');
    if (formSection) {
      formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, 100);
};

const handleDeleteDieMold = async (dieMoldId) => {
  if (!dieMoldId) {
    toast.error("Invalid die/mold ID");
    return;
  }

  if (!window.confirm("Are you sure you want to delete this die/mold?")) {
    return;
  }

  try {
    await axiosInstance.delete(`/suppliers/${id}/die-mold/${dieMoldId}`);
    toast.success("Die/Mold deleted successfully!");
    fetchDieMolds();
  } catch (err) {
    console.error("Delete die/mold error:", err);
    toast.error(err.response?.data?.error || "Failed to delete die/mold");
  }
};

// ==================== SECURITY CHEQUE HANDLERS ====================

const handleEditSecurityCheque = (cheque) => {
  setSecurityChequeForm({
    amount: cheque.amount,
    chequeFile: cheque.chequeFile,
    remarks: cheque.remarks || ""
  });
  setEditingSecurityChequeId(cheque._id);
  setShowSecurityChequeForm(true);
  
  setTimeout(() => {
    const formSection = document.getElementById('security-cheque-section');
    if (formSection) {
      formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, 100);
};

const handleDeleteSecurityCheque = async (chequeId) => {
  if (!chequeId) {
    toast.error("Invalid cheque ID");
    return;
  }

  if (!window.confirm("Are you sure you want to delete this security cheque?")) {
    return;
  }

  try {
    await axiosInstance.delete(`/suppliers/${id}/security-cheque/${chequeId}`);
    toast.success("Security cheque deleted successfully!");
    fetchSecurityCheques();
  } catch (err) {
    console.error("Delete security cheque error:", err);
    toast.error(err.response?.data?.error || "Failed to delete security cheque");
  }
};

  return (
    <>
      <InternalNavbar />
      <div className="max-w-2xl mx-auto p-6 bg-white rounded shadow mt-4">
       <div className="flex justify-between items-center mb-4">
  <h2 className="text-xl font-bold">
    {id ? "✏️ Edit Supplier" : "➕ Add New Supplier"}
  </h2>
  
  {/* WhatsApp Share Button - Only show in edit mode */}
  {id && supplierData && (
    <button
      type="button"
      onClick={shareOnWhatsApp}
      className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 shadow-sm"
      title="Share supplier details on WhatsApp"
    >
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="20" 
        height="20" 
        viewBox="0 0 24 24" 
        fill="currentColor"
        className="text-white"
      >
        <path d="M19.077 4.928C17.191 3.041 14.683 2 12.006 2 6.798 2 2.537 6.193 2.523 11.396c-.004 1.7.435 3.365 1.258 4.832L2.4 21.6l5.444-1.401c1.414.786 2.998 1.2 4.63 1.201h.004c5.203 0 9.47-4.197 9.484-9.4.007-2.511-.967-4.87-2.885-6.772zm-7.07 14.459c-1.441 0-2.856-.387-4.089-1.116l-.293-.176-3.234.832.864-3.153-.192-.305c-.806-1.285-1.232-2.764-1.229-4.289.012-4.297 3.5-7.79 7.806-7.79 2.081 0 4.04.812 5.515 2.287 1.473 1.473 2.282 3.43 2.277 5.51-.012 4.302-3.5 7.795-7.8 7.8z"/>
        <path d="M16.205 14.087c-.226.113-1.338.657-1.544.732-.205.075-.354.113-.502-.113s-.646-.796-.849-1.08c-.202-.283-.354-.321-.58-.107-.226.214-.871.803-.954.963-.083.16-.166.174-.393.06-.226-.113-.956-.352-1.822-1.124-.673-.6-1.128-1.342-1.26-1.569-.132-.227-.014-.35.099-.463.101-.101.226-.264.339-.396.113-.132.151-.226.226-.377.075-.15.038-.283-.019-.396-.056-.113-.502-1.21-.689-1.658-.181-.433-.366-.374-.503-.381-.13-.007-.279-.009-.428-.009s-.393.056-.599.283c-.205.226-.783.765-.783 1.866 0 1.101.801 2.165.913 2.315.113.151 1.552 2.427 3.767 3.326 2.215.899 2.215.599 2.614.561.399-.037 1.289-.527 1.471-1.036.183-.509.183-.945.128-1.036-.056-.09-.205-.146-.428-.259z"/>
      </svg>
      Share on WhatsApp
    </button>
  )}
</div>
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
    onChange={(e) => {
      const selectedOptions = Array.from(e.target.selectedOptions, opt => opt.value);
      setForm({ ...form, vendorCategory: selectedOptions });
    }}
    className="w-full border p-2 rounded"
    multiple
    required
  >
    {categories.map((cat) => (
      <option key={cat._id} value={cat.name}>{cat.name}</option>
    ))}
  </select>
</div>

  <div>
    <label className="block font-semibold mb-1">Address</label>
    <textarea name="address"  placeholder="Enter full address"
 value={form.address} onChange={handleChange} className="w-full border p-2 rounded" />
  </div>

  {/* Google Maps Location */}
  <div>
    <label className="block font-semibold mb-1">Google Maps Location Link(Factory Location)</label>
    <input name="locationLink"  placeholder="Enter Google Map location by going on to Google Maps and copy the link of Coordinates and paste it here."
 value={form.locationLink || ""} onChange={handleChange} className="w-full border p-2 rounded text-xs" />
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

{/* Cheque Files Preview - Shows both existing and new files */}
{(existingChequeCloudFiles.length > 0 || chequePreviewUrls.length > 0) && (
  <div className="flex flex-wrap gap-3 mt-3">
    {/* Existing cheque files from cloud */}
    {existingChequeCloudFiles.map((file, i) => (
      <div
        key={`existing-${i}`}
        className="relative border rounded bg-blue-50 w-24 h-24 flex items-center justify-center overflow-hidden"
      >
        {file.url?.includes('.pdf') ? (
          <span className="text-3xl text-blue-600">📄</span>
        ) : (
          <img
            src={file.url}
            alt={`existing-cheque-${i}`}
            className="object-cover w-full h-full"
          />
        )}
        {/* Remove button for existing files */}
        <button
          type="button"
          onClick={() => handleRemoveChequeFile(i)}
          className="absolute top-1 right-1 bg-red-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center"
        >
          ×
        </button>
        <div className="absolute bottom-0 left-0 right-0 bg-blue-600 text-white text-xs text-center py-1">
          Existing
        </div>
      </div>
    ))}
    
    {/* New cheque files to be uploaded */}
    {chequePreviewUrls.slice(existingChequeCloudFiles.length).map((preview, i) => (
      <div
        key={`new-${i}`}
        className="relative border rounded bg-gray-100 w-24 h-24 flex items-center justify-center overflow-hidden"
      >
        {preview === "pdf" || preview.includes(".pdf") ? (
          <span className="text-3xl text-red-600">📄</span>
        ) : (
          <img
            src={preview}
            alt={`new-cheque-${i}`}
            className="object-cover w-full h-full"
          />
        )}
        {/* Remove button for new files */}
        <button
          type="button"
          onClick={() => handleRemoveChequeFile(existingChequeCloudFiles.length + i)}
          className="absolute top-1 right-1 bg-red-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center"
        >
          ×
        </button>
        <div className="absolute bottom-0 left-0 right-0 bg-green-600 text-white text-xs text-center py-1">
          New
        </div>
      </div>
    ))}
  </div>
)}


  {/* Submit */}
  <button type="submit" className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
    {id ? "💾 Update Supplier" : "✅ Submit Supplier"}
  </button>
</form>

{/* ==================== DIE/MOLD & SECURITY CHEQUE SECTION ==================== */}
{id && (
  <div id="die-mold-section" className="mt-8 border-t pt-8">
    <div className="flex justify-between items-center mb-4">
      <h3 className="text-xl font-bold">🔧 Die/Mold for Job Work & Security Cheque</h3>
      <div className="flex gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => {
            setShowDieMoldForm(!showDieMoldForm);
            setEditingDieMoldId(null);
            setDieMoldForm({ dieMoldName: "", remarks: "", files: [] });
          }}
          className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700"
        >
          {showDieMoldForm ? "Cancel" : "➕ Add Die/Mold"}
        </button>
        <button
          type="button"
          onClick={() => {
            setShowSecurityChequeForm(!showSecurityChequeForm);
            setEditingSecurityChequeId(null);
            setSecurityChequeForm({ amount: "", chequeFile: null, remarks: "" });
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {showSecurityChequeForm ? "Cancel" : "🏦 Security Cheque"}
        </button>
      </div>
    </div>

    {/* Die/Mold Form */}
    {showDieMoldForm && (
      <div className="bg-orange-50 p-4 rounded-lg mb-6">
        <h4 className="font-semibold mb-3">
          {editingDieMoldId ? "✏️ Edit Die/Mold" : "🔧 Add Die/Mold for Job Work"}
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block mb-1 font-semibold">Die/Mold Name *</label>
            <input
              type="text"
              value={dieMoldForm.dieMoldName}
              onChange={(e) => setDieMoldForm(prev => ({ ...prev, dieMoldName: e.target.value }))}
              className="w-full border p-2 rounded"
              placeholder="Enter die/mold name"
              required
            />
          </div>
          
          <div>
            <label className="block mb-1 font-semibold">Upload Files *</label>
            <input
              type="file"
              accept="image/*,.pdf,.doc,.docx"
              multiple
              onChange={(e) => {
                const files = Array.from(e.target.files);
                if (editingDieMoldId && dieMoldForm.files.length > 0) {
                  setDieMoldForm(prev => ({ 
                    ...prev, 
                    files: [...prev.files, ...files] 
                  }));
                } else {
                  setDieMoldForm(prev => ({ ...prev, files }));
                }
              }}
              className="w-full border p-2 rounded"
              required={!editingDieMoldId}
            />
            {editingDieMoldId && (
              <p className="text-xs text-gray-500 mt-1">Add new files (existing files will be kept)</p>
            )}
          </div>
          
          <div className="md:col-span-2">
            <label className="block mb-1 font-semibold">Remarks</label>
            <textarea
              value={dieMoldForm.remarks}
              onChange={(e) => setDieMoldForm(prev => ({ ...prev, remarks: e.target.value }))}
              className="w-full border p-2 rounded"
              placeholder="Add remarks about this die/mold"
              rows={2}
            />
          </div>

          {/* Show existing files when editing */}
          {editingDieMoldId && dieMoldForm.files.length > 0 && (
            <div className="md:col-span-2">
              <p className="text-sm font-medium text-gray-600">Existing Files:</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {dieMoldForm.files
                  .filter(file => typeof file === 'string' && file.startsWith('http'))
                  .map((file, index) => {
                    const isImage = typeof file === 'string' && file?.match(/\.(jpg|jpeg|png|gif)$/i);
                    return (
                      <div key={index} className="relative">
                        {isImage ? (
                          <img src={file} alt={`File ${index + 1}`} className="w-16 h-16 object-cover rounded border" />
                        ) : (
                          <a href={file} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline text-sm">
                            📄 File {index + 1}
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            const remainingFiles = dieMoldForm.files.filter(f => f !== file);
                            setDieMoldForm(prev => ({ ...prev, files: remainingFiles }));
                          }}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs hover:bg-red-600"
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Show new files to upload */}
          {dieMoldForm.files.length > 0 && dieMoldForm.files.some(file => file instanceof File) && (
            <div className="md:col-span-2">
              <p className="text-sm font-medium text-gray-600">New files to upload:</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {dieMoldForm.files
                  .filter(file => file instanceof File)
                  .map((file, index) => (
                    <span key={index} className="px-2 py-1 bg-gray-100 rounded text-sm flex items-center gap-2">
                      📄 {file.name}
                      <button
                        type="button"
                        onClick={() => {
                          const newFiles = dieMoldForm.files.filter((_, i) => 
                            dieMoldForm.files.indexOf(file) !== i
                          );
                          setDieMoldForm(prev => ({ ...prev, files: newFiles }));
                        }}
                        className="text-red-500 hover:text-red-700"
                      >
                        ×
                      </button>
                    </span>
                  ))}
              </div>
            </div>
          )}
        </div>
        
        <button
          type="button"
          onClick={async () => {
            try {
              if (!dieMoldForm.dieMoldName) {
                toast.error("Please enter die/mold name");
                return;
              }
              
              let uploadedUrls = [];
              const newFiles = dieMoldForm.files.filter(file => file instanceof File);
              const existingUrls = dieMoldForm.files.filter(file => typeof file === 'string' && file.startsWith('http'));
              
              if (newFiles.length > 0) {
                toast.loading("Uploading files...");
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
                    return result.secure_url;
                  });
                  return Promise.all(uploads);
                };
                uploadedUrls = await upload(newFiles);
                toast.dismiss();
              }
              
              const finalFiles = [...existingUrls, ...uploadedUrls];
              
              if (finalFiles.length === 0) {
                toast.error("Please upload at least one file");
                return;
              }
              
              const dieMoldData = {
                dieMoldName: dieMoldForm.dieMoldName,
                remarks: dieMoldForm.remarks,
                files: finalFiles
              };
              
              if (editingDieMoldId) {
                await axiosInstance.put(`/suppliers/${id}/die-mold/${editingDieMoldId}`, dieMoldData);
                toast.success("Die/Mold updated successfully!");
                setEditingDieMoldId(null);
              } else {
                await axiosInstance.post(`/suppliers/${id}/die-mold`, dieMoldData);
                toast.success("Die/Mold added successfully!");
              }
              
              setDieMoldForm({ dieMoldName: "", remarks: "", files: [] });
              setShowDieMoldForm(false);
              fetchDieMolds();
              
            } catch (err) {
              console.error("Save die/mold error:", err);
              toast.error(err.response?.data?.error || "Failed to save die/mold");
            }
          }}
          className="mt-4 bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700"
        >
          {editingDieMoldId ? "💾 Update Die/Mold" : "💾 Save Die/Mold"}
        </button>
        
        {editingDieMoldId && (
          <button
            type="button"
            onClick={() => {
              setEditingDieMoldId(null);
              setDieMoldForm({ dieMoldName: "", remarks: "", files: [] });
              setShowDieMoldForm(false);
            }}
            className="mt-4 ml-2 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            Cancel Edit
          </button>
        )}
      </div>
    )}

    {/* Die/Mold Table */}
    {dieMolds.length > 0 && (
      <div className="mt-6">
        <h4 className="font-semibold mb-3">🔧 Die/Molds</h4>
        <div className="overflow-x-auto">
          <table className="min-w-full border">
            <thead className="bg-orange-50">
              <tr>
                <th className="p-2 border">Date</th>
                <th className="p-2 border">Die/Mold Name</th>
                <th className="p-2 border">Files</th>
                <th className="p-2 border">Remarks</th>
                <th className="p-2 border">Added By</th>
                <th className="p-2 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {dieMolds.map((dieMold, index) => (
                <tr key={dieMold._id || index}>
                  <td className="p-2 border">
                    {new Date(dieMold.date).toLocaleDateString()}
                  </td>
                  <td className="p-2 border font-semibold">{dieMold.dieMoldName}</td>
                  <td className="p-2 border">
                    <div className="flex flex-wrap gap-2">
                      {dieMold.files?.map((file, fileIndex) => (
                        file?.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                          <a key={fileIndex} href={file} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                            <img src={file} alt={`File ${fileIndex + 1}`} className="w-12 h-12 object-cover rounded" />
                          </a>
                        ) : (
                          <a key={fileIndex} href={file} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline text-sm">
                            📄 File {fileIndex + 1}
                          </a>
                        )
                      ))}
                    </div>
                  </td>
                  <td className="p-2 border">{dieMold.remarks || "-"}</td>
                  <td className="p-2 border">
                    {dieMold.addedBy?.name || dieMold.addedBy || "Unknown"}
                  </td>
                  <td className="p-2 border">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditDieMold(dieMold)}
                        className="text-blue-600 hover:text-blue-800 text-sm px-2 py-1 border border-blue-300 rounded hover:bg-blue-50"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => handleDeleteDieMold(dieMold._id?.toString())}
                        className="text-red-600 hover:text-red-800 text-sm px-2 py-1 border border-red-300 rounded hover:bg-red-50"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )}

    {/* Security Cheque Form */}
    {showSecurityChequeForm && (
      <div id="security-cheque-section" className="bg-blue-50 p-4 rounded-lg mb-6 mt-6">
        <h4 className="font-semibold mb-3">
          {editingSecurityChequeId ? "✏️ Edit Security Cheque" : "🏦 Add Security Cheque"}
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block mb-1 font-semibold">Amount *</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={securityChequeForm.amount}
              onChange={(e) => setSecurityChequeForm(prev => ({ ...prev, amount: e.target.value }))}
              className="w-full border p-2 rounded"
              placeholder="Enter amount"
              required
            />
          </div>
          
          <div>
            <label className="block mb-1 font-semibold">Upload Cheque Image/PDF *</label>
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => setSecurityChequeForm(prev => ({ ...prev, chequeFile: e.target.files[0] }))}
              className="w-full border p-2 rounded"
              required
            />
          </div>
          
          <div className="md:col-span-2">
            <label className="block mb-1 font-semibold">Remarks</label>
            <textarea
              value={securityChequeForm.remarks}
              onChange={(e) => setSecurityChequeForm(prev => ({ ...prev, remarks: e.target.value }))}
              className="w-full border p-2 rounded"
              placeholder="Add remarks about this cheque"
              rows={2}
            />
          </div>
        </div>
        
        <button
          type="button"
          onClick={async () => {
            try {
              if (!securityChequeForm.amount) {
                toast.error("Please enter amount");
                return;
              }
              
              let chequeFileUrl = securityChequeForm.chequeFile;
              
              if (chequeFileUrl instanceof File) {
                toast.loading("Uploading cheque file...");
                const data = new FormData();
                data.append("file", chequeFileUrl);
                data.append("upload_preset", "todo_uploads");
                data.append("cloud_name", "dcr8k5amk");

                const res = await fetch("https://api.cloudinary.com/v1_1/dcr8k5amk/upload", {
                  method: "POST",
                  body: data,
                });
                const result = await res.json();
                chequeFileUrl = result.secure_url;
                toast.dismiss();
              } else if (typeof chequeFileUrl === 'string' && !chequeFileUrl.startsWith('http')) {
                toast.error("Invalid cheque file");
                return;
              }
              
              if (!chequeFileUrl) {
                toast.error("Please upload cheque file");
                return;
              }
              
              const chequeData = {
                amount: securityChequeForm.amount,
                chequeFile: chequeFileUrl,
                remarks: securityChequeForm.remarks
              };
              
              if (editingSecurityChequeId) {
                await axiosInstance.put(`/suppliers/${id}/security-cheque/${editingSecurityChequeId}`, chequeData);
                toast.success("Security cheque updated successfully!");
                setEditingSecurityChequeId(null);
              } else {
                await axiosInstance.post(`/suppliers/${id}/security-cheque`, chequeData);
                toast.success("Security cheque added successfully!");
              }
              
              setSecurityChequeForm({ amount: "", chequeFile: null, remarks: "" });
              setShowSecurityChequeForm(false);
              fetchSecurityCheques();
              
            } catch (err) {
              console.error("Save security cheque error:", err);
              toast.error(err.response?.data?.error || "Failed to save security cheque");
            }
          }}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {editingSecurityChequeId ? "💾 Update Security Cheque" : "💾 Save Security Cheque"}
        </button>
        
        {editingSecurityChequeId && (
          <button
            type="button"
            onClick={() => {
              setEditingSecurityChequeId(null);
              setSecurityChequeForm({ amount: "", chequeFile: null, remarks: "" });
              setShowSecurityChequeForm(false);
            }}
            className="mt-4 ml-2 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            Cancel Edit
          </button>
        )}
      </div>
    )}

    {/* Security Cheques Table */}
    {securityCheques.length > 0 && (
      <div className="mt-6">
        <h4 className="font-semibold mb-3">🏦 Security Cheques</h4>
        <div className="overflow-x-auto">
          <table className="min-w-full border">
            <thead className="bg-blue-50">
              <tr>
                <th className="p-2 border">Date</th>
                <th className="p-2 border">Amount</th>
                <th className="p-2 border">Cheque File</th>
                <th className="p-2 border">Remarks</th>
                <th className="p-2 border">Added By</th>
                <th className="p-2 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {securityCheques.map((cheque, index) => (
                <tr key={cheque._id || index}>
                  <td className="p-2 border">
                    {new Date(cheque.date).toLocaleDateString()}
                  </td>
                  <td className="p-2 border font-semibold">₹{cheque.amount}</td>
                  <td className="p-2 border">
                    {cheque.chequeFile?.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                      <a href={cheque.chequeFile} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                        <img src={cheque.chequeFile} alt="Cheque" className="w-16 h-16 object-cover rounded" />
                      </a>
                    ) : (
                      <a href={cheque.chequeFile} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                        📄 View File
                      </a>
                    )}
                  </td>
                  <td className="p-2 border">{cheque.remarks || "-"}</td>
                  <td className="p-2 border">
                    {cheque.addedBy?.name || cheque.addedBy || "Unknown"}
                  </td>
                  <td className="p-2 border">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditSecurityCheque(cheque)}
                        className="text-blue-600 hover:text-blue-800 text-sm px-2 py-1 border border-blue-300 rounded hover:bg-blue-50"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => handleDeleteSecurityCheque(cheque._id?.toString())}
                        className="text-red-600 hover:text-red-800 text-sm px-2 py-1 border border-red-300 rounded hover:bg-red-50"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )}
  </div>
)}

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
