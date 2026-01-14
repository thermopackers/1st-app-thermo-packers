import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../axiosInstance';
import Swal from 'sweetalert2';
import InternalNavbar from '../components/InternalNavbar';

const GateInwardPrintout = () => {
  const { guardEntryId } = useParams();
  const navigate = useNavigate();
  const [guardEntry, setGuardEntry] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGuardEntryDetails();
  }, [guardEntryId]);

  const fetchGuardEntryDetails = async () => {
    try {
      const res = await axiosInstance.get(`/guard-entries?page=1&limit=1000`);
      const entries = res.data.entries || [];
      const entry = entries.find(e => e._id === guardEntryId);
      
      if (entry) {
        setGuardEntry(entry);
      } else {
        Swal.fire('Error', 'Guard entry not found', 'error');
        navigate('/guard-entries-view');
      }
    } catch (err) {
      console.error('Failed to fetch guard entry', err);
      Swal.fire('Error', 'Failed to load guard entry details', 'error');
      navigate('/guard-entries-view');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return date.toLocaleDateString('en-IN', options);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleBack = () => {
    navigate('/guard-entries-view');
  };

if (loading) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading printout...</p>
      </div>
    </div>
  );
}

  if (!guardEntry) {
    return null;
  }

return (
  <div className="min-h-screen bg-gray-50">
    {/* Navbar - Hidden during print */}
    <div className="print:hidden">
      <InternalNavbar />
    </div>
    
    <div className="py-4 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Action Buttons - Hidden during print */}
        <div className="bg-white rounded-2xl shadow-lg p-4 mb-4 print:hidden">
          <div className="flex justify-between items-center">
            <button
              onClick={handleBack}
              className="bg-gray-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-600 transition flex items-center gap-2"
            >
              ← Back to Entries
            </button>
            <button
              onClick={handlePrint}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition flex items-center gap-2"
            >
              🖨️ Print Now
            </button>
          </div>
        </div>

        {/* Printout Content - A4 Size */}
        <div className="bg-white shadow-2xl rounded-lg print:shadow-none print:rounded-none">
          {/* A4 Print Container - Minimal padding */}
          <div className="p-4 print:p-4 min-h-[297mm]">
            {/* Company Header - Minimal padding */}
            <div className="text-center border-b-2 border-gray-300 pb-2 mb-4">
              <h1 className="text-2xl font-bold text-gray-800">THERMO PACKERS</h1>
              <p className="text-xs text-gray-600 mt-1">Mfrs & Suppliers of Thermocol Sheets, All Kinds of Thermocol Packing, PU Products</p>
              <p className="text-xs text-gray-600">VILL SANGAL SOHAL, OPP JALANDHAR KUNJ, KAPURTHALA ROAD, JALANDHAR-144031 (PUNJAB)</p>
              <p className="text-gray-600 text-xs mt-1">Phone: +91-9216860160 | Email: thermopackers@gmail.com</p>
            </div>

            {/* Document Title - Minimal margin */}
            <div className="text-center mb-4">
              <h2 className="text-xl font-bold text-blue-800 mb-1">
                GATE INWARD RECORD
              </h2>
              <div className={`inline-block px-3 py-1 rounded text-white font-semibold text-sm ${
                guardEntry.isRejected ? 'bg-red-600' : 'bg-green-600'
              }`}>
                {guardEntry.isRejected ? 'REJECTED/RETURNED MATERIAL' : 'SUPPLIER MATERIAL INWARD'}
              </div>
            </div>

            {/* Main Content Grid - Minimal spacing */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              {/* Left Column - Basic Information */}
              <div className="space-y-2">
                <div className="border-b pb-1">
                  <div className="text-xs text-gray-500 font-medium">Entry Number</div>
                  <div className="text-sm font-bold text-blue-800">{guardEntry.entryNumber}</div>
                </div>
                
                <div className="border-b pb-1">
                  <div className="text-xs text-gray-500 font-medium">Entry Date & Time</div>
                  <div className="text-sm font-semibold">{formatDate(guardEntry.createdAt)}</div>
                </div>
                
                <div className="border-b pb-1">
                  <div className="text-xs text-gray-500 font-medium">Vehicle Number</div>
                  <div className="text-sm font-bold text-green-700">{guardEntry.vehicleNumber}</div>
                </div>
              </div>

              {/* Right Column - Supplier/Customer Information */}
              <div className="space-y-2">
                <div className="border-b pb-1">
                  <div className="text-xs text-gray-500 font-medium">
                    {guardEntry.isRejected ? 'Customer Name' : 'Supplier Name'}
                  </div>
                  <div className="text-sm font-semibold">
                    {guardEntry.isRejected 
                      ? (guardEntry.customer?.name || guardEntry.customerName || 'N/A')
                      : (guardEntry.supplier?.name || guardEntry.supplierName || 'N/A')
                    }
                    {(guardEntry.isRejected && guardEntry.customerName) || (!guardEntry.isRejected && guardEntry.supplierName) ? (
                      <span className="text-xs text-green-600 ml-1">(Manual)</span>
                    ) : null}
                  </div>
                </div>
                
                <div className="border-b pb-1">
                  <div className="text-xs text-gray-500 font-medium">Recorded By</div>
                  <div className="text-sm font-semibold">{guardEntry.recordedBy?.name || 'N/A'}</div>
                </div>
                
                <div className="border-b pb-1">
                  <div className="text-xs text-gray-500 font-medium">Status</div>
                  <div className={`text-sm font-semibold ${
                    guardEntry.isRejected ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {guardEntry.isRejected ? 'Rejected Material' : 'Supplier Material'}
                  </div>
                </div>
              </div>
            </div>

            {/* Products/Materials Section - Minimal margin */}
            <div className="mb-4">
              <h3 className="text-lg font-bold text-gray-800 mb-2 border-b pb-1">
                MATERIALS / PRODUCTS RECEIVED
              </h3>
              
              {guardEntry.purchaseProducts && guardEntry.purchaseProducts.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300 text-xs">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 px-2 py-1 text-left font-semibold">S.No.</th>
                        <th className="border border-gray-300 px-2 py-1 text-left font-semibold">Product Name</th>
                        <th className="border border-gray-300 px-2 py-1 text-left font-semibold">Quantity</th>
                        <th className="border border-gray-300 px-2 py-1 text-left font-semibold">Type</th>
                      </tr>
                    </thead>
                    <tbody>
                      {guardEntry.purchaseProducts.map((product, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="border border-gray-300 px-2 py-1">{index + 1}</td>
                          <td className="border border-gray-300 px-2 py-1 font-medium">
                            {product.product?.name || product.productName || 'N/A'}
                          </td>
                          <td className="border border-gray-300 px-2 py-1">{product.quantity}</td>
                          <td className="border border-gray-300 px-2 py-1">
                            {product.productName ? (
                              <span className="text-green-600 font-semibold text-xs">Manual</span>
                            ) : (
                              <span className="text-blue-600 text-xs">Standard</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-3 border border-gray-300 rounded">
                  <p className="text-gray-500 text-sm">No products recorded for this entry</p>
                </div>
              )}
            </div>

            {/* Remarks Section - Minimal margin */}
            {guardEntry.remarks && (
              <div className="mb-4">
                <h3 className="text-lg font-bold text-gray-800 mb-2 border-b pb-1">REMARKS</h3>
                <div className="bg-gray-50 border border-gray-300 rounded p-2">
                  <p className="text-gray-700 whitespace-pre-wrap text-xs">{guardEntry.remarks}</p>
                </div>
              </div>
            )}

            {/* Photos Section - Minimal margin */}
          {guardEntry.photos && guardEntry.photos.length > 0 && (
  <div className="mb-4">
    <h3 className="text-lg font-bold text-gray-800 mb-2 border-b pb-1">
      ATTACHED PHOTOS ({guardEntry.photos.length})
    </h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {guardEntry.photos.map((photo, index) => (
        <div key={index} className="border border-gray-300 rounded-lg overflow-hidden bg-white">
          <img
            src={photo}
            alt={`Vehicle/Material Photo ${index + 1}`}
            className="w-auto h-64 object-contain print:h-64 print:object-contain"
          />
          <div className="p-2 text-center bg-gray-100 border-t border-gray-300">
            <span className="text-sm font-medium text-gray-700">Image {index + 1}</span>
          </div>
        </div>
      ))}
    </div>
  </div>
)}
          </div>
        </div>

        {/* Print Instructions */}
        <div className="bg-yellow-50 border border-yellow-200 rounded p-2 mt-4 print:hidden">
          <div className="flex items-start gap-2">
            <span className="text-yellow-600 text-lg">💡</span>
            <div>
              <h4 className="font-semibold text-yellow-800 text-sm">Print Instruction</h4>
              <p className="text-yellow-700 text-xs mt-1">
                • Click "Print Now" button to generate A4 printout<br/>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Print Styles - Minimal padding */}
    <style jsx global>{`
      @media print {
        body {
          background: white !important;
          margin: 0;
          padding: 0;
        }
        .print\\:hidden {
          display: none !important;
        }
        .print\\:p-12 {
          padding: 1rem !important;
        }
        .print\\:shadow-none {
          box-shadow: none !important;
        }
        .print\\:rounded-none {
          border-radius: 0 !important;
        }
        .print\\:h-32 {
          height: 6rem !important;
        }
        @page {
          margin: 0.3cm;
          size: A4;
        }
      }
    `}</style>
  </div>
);
};

export default GateInwardPrintout;