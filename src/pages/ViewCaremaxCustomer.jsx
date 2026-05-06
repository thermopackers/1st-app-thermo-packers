import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../axiosInstance";
import InternalNavbar from "../components/InternalNavbar";
import Swal from "sweetalert2";

export default function ViewCaremaxCustomer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCustomer() {
      try {
        const res = await axiosInstance.get(`/caremax-customers/${id}`);
        if (res.data && res.data.success && res.data.customer) {
          setCustomer(res.data.customer);
        }
      } catch (error) {
        console.error("Error fetching customer:", error);
        Swal.fire({
          title: "Error",
          text: "Failed to load customer details",
          icon: "error",
          confirmButtonColor: "#dc2626"
        });
      } finally {
        setLoading(false);
      }
    }
    fetchCustomer();
  }, [id]);

  const handleImageClick = (imageUrl) => {
    Swal.fire({
      html: `<div style="text-align: center;">
               <img src="${imageUrl}" style="max-width: 100%; max-height: 70vh; border-radius: 8px;" />
               <div style="margin-top: 10px;">
                 <button id="closeImageBtn" style="padding: 8px 16px; background: #dc2626; color: white; border: none; border-radius: 4px; cursor: pointer;">Close</button>
               </div>
             </div>`,
      showConfirmButton: false,
      width: 'auto',
      padding: 0,
      didOpen: () => {
        const closeBtn = document.getElementById('closeImageBtn');
        if (closeBtn) {
          closeBtn.addEventListener('click', () => {
            Swal.close();
          });
        }
      }
    });
  };

  if (loading) {
    return (
      <>
        <InternalNavbar />
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading customer details...</p>
        </div>
      </>
    );
  }

  if (!customer) {
    return (
      <>
        <InternalNavbar />
        <div className="text-center py-12">
          <p className="text-red-600 text-lg">Customer not found</p>
          <button
            onClick={() => navigate("/caremax-impex/all-customers")}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Back to Customers
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <InternalNavbar />
      <div className="max-w-4xl mx-auto mt-8 p-6 bg-white rounded-lg shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-800">Customer Details</h2>
          <button
            onClick={() => navigate(-1)}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            ← Back
          </button>
        </div>

        {/* Customer Code Badge */}
        {customer.customerCode && (
          <div className="mb-4 inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
            Code: {customer.customerCode}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* Basic Information */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">Basic Information</h3>
            
            <div>
              <label className="font-semibold text-gray-700 block">Customer Name:</label>
              <p className="text-gray-900">{customer.name}</p>
            </div>
            
            <div>
              <label className="font-semibold text-gray-700 block">GST Number:</label>
              <p className="text-gray-900">{customer.gstNo || "URP"}</p>
            </div>
            
            <div>
              <label className="font-semibold text-gray-700 block">GST Status:</label>
              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${customer.isURP ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                {customer.isURP ? "Unregistered Person (URP)" : "Registered"}
              </span>
            </div>
            
            <div>
              <label className="font-semibold text-gray-700 block">Phone Number:</label>
              <p className="text-gray-900">{customer.phoneNo}</p>
            </div>
            
            {customer.email && (
              <div>
                <label className="font-semibold text-gray-700 block">Email:</label>
                <p className="text-gray-900">{customer.email}</p>
              </div>
            )}
          </div>

          {/* Address Information */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">Address Information</h3>
            
            {customer.address && (
              <div>
                <label className="font-semibold text-gray-700 block">Address:</label>
                <p className="text-gray-900 whitespace-pre-wrap">{customer.address}</p>
              </div>
            )}
            
            {customer.city && (
              <div>
                <label className="font-semibold text-gray-700 block">City:</label>
                <p className="text-gray-900">{customer.city}</p>
              </div>
            )}
            
            {customer.state && (
              <div>
                <label className="font-semibold text-gray-700 block">State:</label>
                <p className="text-gray-900">{customer.state}</p>
              </div>
            )}
            
            {customer.pinCode && (
              <div>
                <label className="font-semibold text-gray-700 block">Pin Code:</label>
                <p className="text-gray-900">{customer.pinCode}</p>
              </div>
            )}
            
            {customer.googleMapsLink && (
              <div>
                <label className="font-semibold text-gray-700 block">Google Maps:</label>
                <a href={customer.googleMapsLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  Open in Google Maps →
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Additional Information */}
        {(customer.specialInstructions || customer.handledByName) && (
          <div className="mt-6 border-t pt-4">
            <h3 className="text-lg font-semibold text-gray-700 mb-3">Additional Information</h3>
            
            {customer.specialInstructions && (
              <div className="mb-3">
                <label className="font-semibold text-gray-700 block">Special Instructions:</label>
                <p className="text-gray-900 whitespace-pre-wrap">{customer.specialInstructions}</p>
              </div>
            )}
            
            {customer.handledByName && (
              <div>
                <label className="font-semibold text-gray-700 block">Handled By:</label>
                <p className="text-gray-900">{customer.handledByName} ({customer.handledByEmail})</p>
              </div>
            )}
          </div>
        )}

        {/* GST Documents */}
        {customer.gstDocuments && customer.gstDocuments.length > 0 && (
          <div className="mt-6 border-t pt-4">
            <h3 className="text-lg font-semibold text-gray-700 mb-3">GST Documents</h3>
            <div className="flex flex-wrap gap-2">
              {customer.gstDocuments.map((doc, idx) => (
                doc.endsWith(".pdf") ? (
                  <a
                    key={idx}
                    href={doc}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-red-600 font-semibold underline flex items-center gap-1"
                  >
                    📄 PDF Document {idx + 1}
                  </a>
                ) : (
                  <img
                    key={idx}
                    src={doc}
                    alt={`Document ${idx + 1}`}
                    className="w-32 h-32 object-cover rounded cursor-pointer border hover:opacity-80"
                    onClick={() => handleImageClick(doc)}
                  />
                )
              ))}
            </div>
          </div>
        )}

        {/* Status */}
        <div className="mt-6 flex justify-between items-center">
          <div>
            {customer.isActive ? (
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">Active</span>
            ) : (
              <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-semibold">Inactive</span>
            )}
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={() => navigate(`/caremax-impex/edit-customer/${customer._id}`)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Edit Customer
            </button>
          </div>
        </div>
      </div>
    </>
  );
}