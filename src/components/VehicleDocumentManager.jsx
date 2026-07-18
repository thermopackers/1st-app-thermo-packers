// components/VehicleDocumentManager.js
import { useState, useEffect } from 'react';
import { useUserContext } from '../context/UserContext';
import Swal from 'sweetalert2';
import imageCompression from "browser-image-compression";
import axiosInstance from '../axiosInstance';

const DOCUMENT_TYPES = {
  insurance_renewal: 'Insurance Renewal',
  rto_tax_receipt_renewal: 'RTO Tax Receipt(Renewal)',
  pollution_renewal: 'Pollution Renewal',
  fitness_renewal: 'Fitness Renewal',
  all_india_permit_renewal: 'All India Permit Renewal',
  gps_renewal: 'GPS Renewal',
   rc_copy: "RC Copy", 
  vehicle_images: "Vehicle Front And Rear Side Image (Non Loaded)",
    tempo_challan_copy: "(Himachal/Haryana/Jammu/UP Tax)",
  payment_receipts: "Tempo Challan Copy & Payment Receipts",
    vin_chassis_photo: "VIN - Chassis Number Photo", // Add this line
      punjab_permit: "Punjab Permit (Goods Permit)", // Add this new option
        fastag: "Fastag", // Add this new option
};

export default function VehicleDocumentManager({ vehicleNumber }) {
  const { token } = useUserContext();
  const [documents, setDocuments] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingDoc, setEditingDoc] = useState(null);
  const [formData, setFormData] = useState({
    documentType: '',
    issueDate: '',
    expiryDate: '',
    notes: '',
      mobileNumber: '', // Add this line
       fastagCompanyName: '',
  fastagNumber: '',
  fastagRechargeCode: '',
    companyName: '', // Add this for GPS and Insurance
    documents: []
  });

  useEffect(() => {
    fetchDocuments();
  }, [vehicleNumber]);

  const fetchDocuments = async () => {
    if (!vehicleNumber) return;
    
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/vehicle-documents/${vehicleNumber}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDocuments(res.data);
    } catch (err) {
      console.error('Error fetching documents:', err);
      Swal.fire('Error', 'Failed to load documents', 'error');
    } finally {
      setLoading(false);
    }
  };

  const compressFile = async (file) => {
  if (file.type?.startsWith("image/")) {
    try {
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1280,
        useWebWorker: true,
      };
      return await imageCompression(file, options);
    } catch (err) {
      console.error("Image compression error:", err);
      return file;
    }
  }
  return file; // PDFs or others unchanged
};

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

const handleFileChange = (e) => {
  setFormData(prev => ({
    ...prev,
    documents: [...prev.documents, ...Array.from(e.target.files)]  // ✅ append new
  }));
};



const handleSubmit = async (e) => {
  e.preventDefault();

  if ((!formData.documents || formData.documents.length === 0) && !editingDoc) {
    Swal.fire("Error", "Please upload at least one document", "error");
    return;
  }

  const submitData = new FormData();

  // Append normal fields (skip `documents`)
Object.keys(formData).forEach((key) => {
  if (key !== "documents" && formData[key] !== null && formData[key] !== "") {
    submitData.append(key, formData[key]);
  }
});

  // Separate existing URLs and new files
  const existingUrls = [];
  if (formData.documents && formData.documents.length > 0) {
 for (const file of formData.documents) {
  if (file.isExisting) {
    existingUrls.push(file.url);
  } else {
    const compressed = await compressFile(file);
    submitData.append("documents", compressed);
  }
}
  }

  // Add existingUrls as JSON string
  if (existingUrls.length > 0) {
    submitData.append("existingUrls", JSON.stringify(existingUrls));
  }

  try {
        setSubmitting(true); // ⏳ show overlay
    if (editingDoc) {
      await axiosInstance.put(`/vehicle-documents/${editingDoc._id}`, submitData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      Swal.fire("Success", "Document updated successfully", "success");
    } else {
      submitData.append("vehicleNumber", vehicleNumber);
      await axiosInstance.post("/vehicle-documents", submitData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      Swal.fire("Success", "Document added successfully", "success");
    }

    // Reset form
    setShowForm(false);
    setEditingDoc(null);
 setFormData({
  documentType: "",
  issueDate: "",
  expiryDate: "",
  notes: "",
  mobileNumber: "",
  fastagCompanyName: "",
  fastagNumber: "",
  fastagRechargeCode: "",
    companyName: "", // Add this
  documents: []
});

    fetchDocuments();
  } catch (err) {
    console.error("Error saving document:", err);
    Swal.fire("Error", "Failed to save document", "error");
  } finally {
    setSubmitting(false); // ✅ hide overlay
  }
};




const handleEdit = (doc) => {
  setEditingDoc(doc);
  setFormData({
    documentType: doc.documentType,
    issueDate: doc.issueDate ? doc.issueDate.split('T')[0] : '',
    expiryDate: doc.expiryDate ? doc.expiryDate.split('T')[0] : '',
    notes: doc.notes || '',
    mobileNumber: doc.mobileNumber || '',
    fastagCompanyName: doc.fastagCompanyName || '',
    fastagNumber: doc.fastagNumber || '',
    fastagRechargeCode: doc.fastagRechargeCode || '',
        companyName: doc.companyName || '', // Add this
    documents: doc.documentUrls?.map(url => ({ url, isExisting: true })) || []
  });
  setShowForm(true);
};

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'This action cannot be undone',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        await axiosInstance.delete(`/vehicle-documents/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        Swal.fire('Deleted!', 'Document has been deleted.', 'success');
        fetchDocuments();
      } catch (err) {
        console.error('Error deleting document:', err);
        Swal.fire('Error', 'Failed to delete document', 'error');
      }
    }
  };

  const isExpiring = (expiryDate) => {
    const oneWeekFromNow = new Date();
    oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);
    return new Date(expiryDate) <= oneWeekFromNow;
  };

  const isExpired = (expiryDate) => {
    return new Date(expiryDate) < new Date();
  };

  const getDocumentLabel = (docType) => {
  return DOCUMENT_TYPES[docType] || 'Document';
};

  if (loading) {
    return <div className="text-center py-4">Loading documents...</div>;
  }

  return (
    <div className="mt-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Vehicle Documents</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          {showForm ? 'Cancel' : 'Add Document'}
        </button>
      </div>

      {showForm && (
<form 
  onSubmit={handleSubmit} 
  className="bg-white p-4 rounded shadow mb-6 max-h-[80vh] overflow-y-auto"
>
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div>
      <label className="block text-sm font-medium mb-1">Document Type</label>
      <select
        name="documentType"
        value={formData.documentType}
        onChange={handleInputChange}
        className="w-full p-2 border rounded"
        required
      >
        <option value="">Select Type</option>
        {Object.entries(DOCUMENT_TYPES).map(([value, label]) => (
          <option key={value} value={value}>{label}</option>
        ))}
      </select>
    </div>
    {editingDoc && (
      <div>
        <label className="block text-sm font-medium mb-1">Document Number</label>
        <input
          type="text"
          value={editingDoc.documentNumber}
          readOnly
          className="w-full p-2 border rounded bg-gray-100 cursor-not-allowed"
        />
      </div>
    )}

  {!["vehicle_images", "vin_chassis_photo", "rc_copy", "payment_receipts", "fastag"].includes(formData.documentType) && (
  <>
    {/* Show company name for GPS and Insurance */}
    {["insurance_renewal", "gps_renewal"].includes(formData.documentType) && (
      <div>
        <label className="block text-sm font-medium mb-1">
          {formData.documentType ? `${getDocumentLabel(formData.documentType)} Company Name` : 'Company Name'}
        </label>
        <input
          type="text"
          name="companyName"
          value={formData.companyName || ''}
          onChange={handleInputChange}
          className="w-full p-2 border rounded"
          placeholder={`Enter ${getDocumentLabel(formData.documentType)} company name`}
          required
        />
      </div>
    )}

    <div>
      <label className="block text-sm font-medium mb-1">
        {formData.documentType ? `${getDocumentLabel(formData.documentType)} Issue Date` : 'Issue Date'}
      </label>
      <input
        type="date"
        lang="en-GB"
        name="issueDate"
        value={formData.issueDate}
        onChange={handleInputChange}
        className="w-full p-2 border rounded"
        required
      />
    </div>

    <div>
      <label className="block text-sm font-medium mb-1">
        {formData.documentType ? `${getDocumentLabel(formData.documentType)} Expiry Date` : 'Expiry Date'}
      </label>
      <input
        type="date"
        lang="en-GB"
        name="expiryDate"
        value={formData.expiryDate}
        onChange={handleInputChange}
        className="w-full p-2 border rounded"
        required
      />
    </div>
  </>
)}

 {formData.documentType === "fastag" && (
  <>
    <div>
      <label className="block text-sm font-medium mb-1">Fastag Company Name</label>
      <input
        type="text"
        name="fastagCompanyName"
        value={formData.fastagCompanyName || ''}
        onChange={handleInputChange}
        className="w-full p-2 border rounded"
        placeholder="Enter Fastag company name"
        required
      />
    </div>

    <div>
      <label className="block text-sm font-medium mb-1">Fastag Number</label>
      <input
        type="text"
        name="fastagNumber"
        value={formData.fastagNumber || ''}
        onChange={handleInputChange}
        className="w-full p-2 border rounded"
        placeholder="Enter Fastag number"
        required
      />
    </div>

    <div>
      <label className="block text-sm font-medium mb-1">Fastag Recharge Code</label>
      <input
        type="text"
        name="fastagRechargeCode"
        value={formData.fastagRechargeCode || ''}
        onChange={handleInputChange}
        className="w-full p-2 border rounded"
        placeholder="Enter Fastag recharge code"
        required
      />
    </div>

    <div className="md:col-span-2">
      <label className="block text-sm font-medium mb-1">Fastag Document File</label>
      <input
        type="file"
        onChange={handleFileChange}
        className="w-full p-2 border rounded"
        required={!editingDoc}
        accept=".pdf,.jpg,.jpeg,.png"
        multiple
      />
      <p className="text-xs text-gray-600 mt-1">
        📌 Note: Don't delete any old documents, instead upload the new ones along with the previous documents.
      </p>
    </div>

    <div className="md:col-span-2">
      <label className="block text-sm font-medium mb-1">Fastag Notes</label>
      <textarea
        name="notes"
        value={formData.notes}
        onChange={handleInputChange}
        className="w-full p-2 border rounded"
        rows="3"
      />
    </div>
  </>
)}

    {formData.documentType !== "fastag" && (
      <>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1">
            {formData.documentType ? `${getDocumentLabel(formData.documentType)} Document File` : 'Document File'}
          </label>
          <input
            type="file"
            onChange={handleFileChange}
            className="w-full p-2 border rounded"
            required={!editingDoc}
            accept=".pdf,.jpg,.jpeg,.png"
            multiple
          />
          <p className="text-xs text-gray-600 mt-1">
            📌 Note: Don't delete any old documents, instead upload the new ones along with the previous documents.
          </p>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1">
            {formData.documentType ? `${getDocumentLabel(formData.documentType)} Notes` : 'Notes'}
          </label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleInputChange}
            className="w-full p-2 border rounded"
            rows="3"
          />
        </div>
      </>
    )}

    {formData.documents.length > 0 && (
      <div className="mt-3 grid grid-cols-2 gap-2 max-h-60 overflow-y-auto p-2 border rounded md:col-span-2">
        {formData.documents.map((file, idx) => (
          <div key={idx} className="relative border rounded p-1">
            {file.isExisting ? (
              file.url.match(/\.(jpeg|jpg|png|gif|webp)$/i) ? (
                <img src={file.url} alt={`preview-${idx}`} className="h-32 object-contain w-full rounded" />
              ) : (
                <div className="flex items-center justify-center h-32 bg-gray-100 text-sm">
                  📄 {file.url.split('/').pop()}
                </div>
              )
            ) : (
              file.type?.includes("image") ? (
                <img
                  src={URL.createObjectURL(file)}
                  alt={`preview-${idx}`}
                  className="h-32 object-contain w-full rounded"
                />
              ) : (
                <div className="flex items-center justify-center h-32 bg-gray-100 text-sm">
                  📄 {file.name}
                </div>
              )
            )}
            <button
              type="button"
              onClick={() =>
                setFormData(prev => {
                  const updatedDocs = prev.documents.filter((_, i) => i !== idx);
                  return { ...prev, documents: updatedDocs };
                })
              }
              className="absolute top-1 right-1 bg-red-600 text-white text-xs px-2 rounded-full"
            >
              ❌
            </button>
          </div>
        ))}
      </div>
    )}
  </div>

  <button
    type="submit"
    className="mt-4 bg-green-600 text-white px-4 py-2 rounded"
  >
    {editingDoc ? 'Update Document' : 'Add Document'}
  </button>
</form>
      )}

     <div className="overflow-x-auto overflow-y-auto">
  <table className="min-w-full bg-white rounded shadow">
          <thead>
          <tr className="bg-gray-100">
  <th className="p-3 text-left">Type</th>
  <th className="p-3 text-left">Issue Date</th>
  <th className="p-3 text-left">Expiry Date</th>
  <th className="p-3 text-left">Company/Details</th>
  <th className="p-3 text-left">Notes</th>
  <th className="p-3 text-left">Status</th>
  <th className="p-3 text-left">Actions</th>
</tr>
          </thead>
          <tbody>
            {documents.map((doc) => {
            let status = "Valid";
let statusClass = "bg-green-100 text-green-800";

if (!["vehicle_images", "vin_chassis_photo", "rc_copy", "payment_receipts","fastag"].includes(doc.documentType)) {
  const expiring = isExpiring(doc.expiryDate);
  const expired = isExpired(doc.expiryDate);

  if (expired) {
    status = "Expired";
    statusClass = "bg-red-100 text-red-800";
  } else if (expiring) {
    status = "Expiring Soon";
    statusClass = "bg-yellow-100 text-yellow-800";
  }
}

              
              return (
              <tr key={doc._id} className="border-b">
  <td className="p-3">{DOCUMENT_TYPES[doc.documentType]}</td>
  <td className="p-3">
    {doc.documentType !== "vehicle_images" && doc.issueDate && doc.documentType !== "fastag"
      ? new Date(doc.issueDate).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })
      : doc.documentType === "fastag" 
        ? "—" 
        : "—"}
  </td>
  <td className="p-3">
    {doc.documentType !== "vehicle_images" && doc.expiryDate && doc.documentType !== "fastag"
      ? new Date(doc.expiryDate).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })
      : doc.documentType === "fastag" 
        ? "—" 
        : "—"}
  </td>
<td className="p-3 whitespace-normal break-words max-w-xs">
  {doc.documentType === "fastag" ? (
    <div className="text-xs">
      <div><strong>Company:</strong> {doc.fastagCompanyName || '—'}</div>
      <div><strong>Number:</strong> {doc.fastagNumber || '—'}</div>
      <div><strong>Recharge Code:</strong> {doc.fastagRechargeCode || '—'}</div>
    </div>
  ) : ["insurance_renewal", "gps_renewal"].includes(doc.documentType) ? (
    <div className="text-xs">
      <div><strong>Company:</strong> {doc.companyName || '—'}</div>
    </div>
  ) : (
    "—"
  )}
</td>
  <td className="p-3 whitespace-normal break-words max-w-xs">
    {doc.notes}
  </td>
  <td className="p-3">
    <span className={`px-2 py-1 rounded-full text-xs ${statusClass}`}>
      {status}
    </span>
  </td>
  <td className="p-3">
    <div className="flex flex-wrap gap-2">
      {doc.documentUrls?.map((url, idx) => (
        <div key={idx} className="relative w-24 h-24 border rounded">
          {url.match(/\.(jpeg|jpg|png|gif|webp)$/i) ? (
            <img src={url} className="w-full h-full object-contain rounded" />
          ) : (
            <embed src={url} type="application/pdf" className="w-full h-full rounded" />
          )}
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs text-center"
          >
            View
          </a>
        </div>
      ))}
    </div>
    <button
      onClick={() => handleEdit(doc)}
      className="text-yellow-600 hover:underline mr-3"
    >
      Edit
    </button>
    <button
      onClick={() => handleDelete(doc._id)}
      className="text-red-600 hover:underline"
    >
      Delete
    </button>
  </td>
</tr>
              );
            })}
          </tbody>
        </table>
        
        {documents.length === 0 && (
          <div className="text-center py-6 text-gray-500">
            No documents found for this vehicle
          </div>
        )}
      </div>
      {submitting && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="bg-white p-6 rounded shadow flex flex-col items-center">
      <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-3"></div>
      <p className="text-blue-600 font-medium">Uploading document...</p>
    </div>
  </div>
)}

    </div>
    
  );
  
}