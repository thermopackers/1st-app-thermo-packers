// components/VehicleDocumentsView.js
import { useState, useEffect } from 'react';
import axiosInstance from '../axiosInstance';
import { useUserContext } from '../context/UserContext';
import Swal from "sweetalert2";

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
};

export default function VehicleDocumentsView({ vehicleNumber }) {
  const { token, user } = useUserContext();
   // ✅ Add this helper function
  const parseUserRoles = (user) => {
    if (!user || !user.role) {
      return [];
    }
    
    
    // If role is already an array, return it directly
    if (Array.isArray(user.role)) {
      return user.role;
    }
    
    // If it's a string (legacy format), try to parse it
    if (typeof user.role === 'string') {
      try {
        return JSON.parse(user.role);
      } catch (parseError) {
        return [user.role];
      }
    }
    
    return [user.role];
  };

  // ✅ Parse user roles
  const userRoles = user ? parseUserRoles(user) : [];
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (vehicleNumber) {
      fetchDocuments();
    }
  }, [vehicleNumber]);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/vehicle-documents/${vehicleNumber}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDocuments(res.data);
    } catch (err) {
      console.error('Error fetching documents:', err);
    } finally {
      setLoading(false);
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

  if (loading) {
    return <div className="text-center py-4">Loading documents...</div>;
  }
const handleDeleteFile = async (docId, fileUrl) => {
  if (!window.confirm("Remove this file?")) return;
  try {
    await axiosInstance.patch(
      `/vehicle-documents/${docId}/remove-file`,
      { fileUrl },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    fetchDocuments(); // refresh list
  } catch (err) {
    console.error("Failed to delete file:", err);
  }
};
const openInSwal = (url, isImage) => {
  Swal.fire({
    html: isImage
      ? `<img src="${url}" class="w-full max-h-[80vh] object-contain rounded" />`
      : `<embed src="${url}" type="application/pdf" width="100%" height="600px" />`,
    width: "80%",
    showCloseButton: true,
    showConfirmButton: false,
    customClass: {
      popup: "rounded-xl shadow-lg",
    },
  });
};

  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold mb-4">Vehicle Documents</h3>
      
      {documents.length === 0 ? (
        <p className="text-gray-500">No documents available for this vehicle.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((doc) => {
            const expiring = isExpiring(doc.expiryDate);
            const expired = isExpired(doc.expiryDate);
            let statusClass = 'bg-green-100 text-green-800';
            
            if (expired) {
              statusClass = 'bg-red-100 text-red-800';
            } else if (expiring) {
              statusClass = 'bg-yellow-100 text-yellow-800';
            }
            
            return (
              <div key={doc._id} className="bg-white p-4 rounded shadow">
                <h4 className="font-medium text-blue-800">
                  {DOCUMENT_TYPES[doc.documentType]}
                </h4>
                <p className="text-sm mt-2">
                  <span className="font-semibold">Document #:</span> {doc.documentNumber}
                </p>
{!["vehicle_images", "vin_chassis_photo"].includes(doc.documentType) ? (
  <>
  <p className="text-sm">
  <span className="font-semibold">Issue Date:</span>{" "}
  {doc.issueDate
    ? new Date(doc.issueDate).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "-"}
</p>
<p className="text-sm">
  <span className="font-semibold">Expiry Date:</span>{" "}
  {doc.expiryDate
    ? new Date(doc.expiryDate).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "-"}
</p>

  </>
) : (
  <p className="text-sm text-gray-500 italic">No expiry dates required</p>
)}
                <div className="mt-2">
                  <span className={`px-2 py-1 rounded-full text-xs ${statusClass}`}>
                    {expired ? 'Expired' : expiring ? 'Expiring Soon' : 'Valid'}
                  </span>
                </div>
                {doc.notes && (
                  <p className="text-sm mt-2">
                    <span className="font-semibold">Notes:</span> {doc.notes}
                  </p>
                )}
          <div className="mt-3 grid grid-cols-2 gap-2">
  {doc.documentUrls?.map((url, idx) => (
    <div
      key={idx}
      className="relative group border rounded p-1 bg-gray-50 cursor-pointer"
      onClick={() =>
        openInSwal(url, url.match(/\.(jpeg|jpg|png|gif|webp)$/i))
      }
    >
      {url.match(/\.(jpeg|jpg|png|gif|webp)$/i) ? (
        <img
          src={url}
          alt={`doc-${idx}`}
          className="w-full h-32 object-contain rounded"
        />
      ) : url.match(/\.pdf$/i) ? (
        <embed
          src={url}
          type="application/pdf"
          className="w-full h-32 border rounded"
        />
      ) : (
        <span className="text-blue-600 underline text-sm">View File</span>
      )}

      {/* ❌ delete button */}
{!userRoles.includes("driver") && (
    <button
    onClick={(e) => {
      e.stopPropagation(); // prevent opening swal when deleting
      handleDeleteFile(doc._id, url);
    }}
    className="absolute top-1 right-1 bg-red-600 text-white rounded-full px-2 py-0.5 text-xs opacity-80 hover:opacity-100"
  >
    ❌
  </button>
)}

    </div>
  ))}
</div>



              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}