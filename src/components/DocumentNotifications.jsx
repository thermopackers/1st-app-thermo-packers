import { useEffect, useState } from "react";
import { useUserContext } from "../context/UserContext";
import axiosInstance from "../axiosInstance";
import Swal from "sweetalert2";

const DOCUMENT_TYPES = {
  insurance_renewal: "Insurance Renewal",
  rto_tax_receipt_renewal: 'RTO Tax Receipt(Renewal)',
  pollution_renewal: "Pollution Renewal",
  fitness_renewal: "Fitness Renewal",
  all_india_permit_renewal: "All India Permit Renewal",
  gps_renewal: "GPS Renewal",
  rc_copy: "RC Copy", 
  vehicle_images: "Vehicle Front And Rear Side Image (Non Loaded)",
  tempo_challan_copy: "(Himachal/Haryana/Jammu/UP Tax)",
  payment_receipts: "Tempo Challan Copy & Payment Receipts",
   vin_chassis_photo: "VIN - Chassis Number Photo", // Add this line
      punjab_permit: "Punjab Permit (Goods Permit)", // Add this new option
};

export default function DocumentNotifications({ setDocNotifCount }) {
  const { token, user } = useUserContext();
  const [expiringDocuments, setExpiringDocuments] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // ✅ FIX: Handle role array properly
    const userRoles = Array.isArray(user?.role) ? user.role : [user?.role];
    if (userRoles.includes("accounts")) {
      fetchExpiringDocuments();
    }
  }, [user]);

  const fetchExpiringDocuments = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(
        "/vehicle-documents/notifications/expiring",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setExpiringDocuments(res.data);
      if (setDocNotifCount) setDocNotifCount(res.data.length);
    } catch (err) {
      console.error("Error fetching expiring documents:", err);
    } finally {
      setLoading(false);
    }
  };

  const getDaysUntilExpiry = (expiryDate) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

// Function to open document in SweetAlert
const openDocument = (doc) => {
  if (!doc.documentUrls || doc.documentUrls.length === 0) {
    Swal.fire({
      title: "No Document Available",
      text: "This document doesn't have any files attached.",
      icon: "warning",
      confirmButtonColor: "#2563eb",
    });
    return;
  }

  // Create content for ALL documents
  let contentHtml = `
    <div class="space-y-4 max-h-[70vh] overflow-y-auto">
      <div class="text-center mb-4 p-3 bg-blue-50 rounded-lg">
        <p class="text-sm text-gray-700"><strong>🚗 Vehicle:</strong> ${doc.vehicleNumber}</p>
        <p class="text-sm text-gray-700"><strong>📄 Type:</strong> ${DOCUMENT_TYPES[doc.documentType]}</p>
        ${doc.documentNumber ? `<p class="text-sm text-gray-700"><strong>🔢 Doc Number:</strong> ${doc.documentNumber}</p>` : ''}
        ${doc.issueDate ? `<p class="text-sm text-gray-700"><strong>📅 Issue Date:</strong> ${new Date(doc.issueDate).toLocaleDateString('en-GB')}</p>` : ''}
        ${doc.expiryDate ? `<p class="text-sm text-gray-700"><strong>⚠️ Expiry Date:</strong> ${new Date(doc.expiryDate).toLocaleDateString('en-GB')}</p>` : ''}
        ${doc.notes ? `<p class="text-sm text-gray-700"><strong>📝 Notes:</strong> ${doc.notes}</p>` : ''}
      </div>
  `;

  // Add each document to the content
  doc.documentUrls.forEach((url, index) => {
    const isImage = url.match(/\.(jpeg|jpg|png|gif|webp)$/i);
    const isPDF = url.match(/\.pdf$/i);
    
    contentHtml += `
      <div class="border border-gray-200 rounded-lg p-4 bg-white">
        <div class="flex justify-between items-center mb-3">
          <h4 class="font-semibold text-gray-800">Document ${index + 1}</h4>
        </div>
    `;

    if (isImage) {
      contentHtml += `
        <img src="${url}" 
             class="w-full max-h-96 object-contain rounded-lg shadow-sm border" 
             alt="Document ${index + 1}" 
             onerror="this.style.display='none'; this.nextElementSibling.style.display='block';" />
        <div style="display: none;" class="text-center p-4 bg-gray-100 rounded-lg">
          <p class="text-gray-600 mb-2">Image failed to load</p>
          <a href="${url}" target="_blank" class="text-blue-600 hover:text-blue-800 underline">
            Open in new tab
          </a>
        </div>
      `;
    } else if (isPDF) {
      contentHtml += `
        <embed src="${url}" 
               type="application/pdf" 
               width="100%" 
               height="400px" 
               class="rounded-lg border" 
               onerror="this.style.display='none'; this.nextElementSibling.style.display='block';" />
        <div style="display: none;" class="text-center p-4 bg-gray-100 rounded-lg">
          <p class="text-gray-600 mb-2">PDF failed to load</p>
          <a href="${url}" target="_blank" class="text-blue-600 hover:text-blue-800 underline">
            Open PDF in new tab
          </a>
        </div>
      `;
    } else {
      contentHtml += `
        <div class="text-center p-6 bg-gray-100 rounded-lg">
          <p class="text-gray-600 mb-3">This file type cannot be previewed in the browser</p>
          <a href="${url}" target="_blank" class="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
            📥 Download / Open File
          </a>
        </div>
      `;
    }

    contentHtml += `</div>`;
  });

  contentHtml += `</div>`;

  Swal.fire({
    title: `${DOCUMENT_TYPES[doc.documentType]}`,
    html: contentHtml,
    width: "90%",
    showCloseButton: true,
    showConfirmButton: false,
    background: "#f8fafc",
    customClass: {
      popup: "rounded-2xl",
    },
  });
};

  if (loading) {
    return (
      <div className="flex justify-center items-center py-6">
        <div className="w-8 h-8 border-4 border-rose-400 border-t-transparent rounded-full animate-spin"></div>
        <span className="ml-3 text-slate-600">Loading notifications...</span>
      </div>
    );
  }

  if (expiringDocuments.length === 0) {
    return (
      <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl p-4 text-center">
        ✅ No documents expiring in the next 7 days.
      </div>
    );
  }

  return (
<div className="overflow-x-auto rounded-xl shadow bg-white max-h-[70vh] overflow-y-auto">      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-100">
          <tr>
            <th className="px-3 py-2 text-left text-sm font-semibold text-slate-700">Vehicle</th>
            <th className="px-3 py-2 text-left text-sm font-semibold text-slate-700">Type</th>
            <th className="px-3 py-2 text-left text-sm font-semibold text-slate-700">Expiry</th>
            <th className="px-3 py-2 text-left text-sm font-semibold text-slate-700">Days Left</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {expiringDocuments.map((doc) => {
            const daysLeft = getDaysUntilExpiry(doc.expiryDate);
            const isExpired = daysLeft < 0;

            let urgencyClass = "";
            if (isExpired) {
              urgencyClass = "bg-red-200 text-red-700";
            } else if (daysLeft <= 3) {
              urgencyClass = "bg-red-100 text-red-700";
            } else {
              urgencyClass = "bg-yellow-100 text-yellow-700";
            }

            return (
              <tr 
  key={doc._id} 
  className="hover:bg-slate-50 cursor-pointer transition-colors"
  onClick={() => openDocument(doc)}
>
  <td className="px-3 py-2 text-sm text-blue-600">{doc.vehicleNumber}</td>
  <td className="px-3 py-2 text-sm font-medium text-blue-600">
    {DOCUMENT_TYPES[doc.documentType]}
  </td>
  <td className="px-3 py-2 text-sm text-blue-600">
    {new Date(doc.expiryDate).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })}
  </td>
  <td className="px-3 py-2 text-sm">
    <span className={`px-2 py-1 rounded-full text-xs ${urgencyClass}`}>
      {isExpired ? "Expired" : `${daysLeft} day${daysLeft !== 1 ? "s" : ""}`}
    </span>
  </td>
</tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}