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
      <>
        <InternalNavbar />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading printout...</p>
          </div>
        </div>
      </>
    );
  }

  if (!guardEntry) {
    return null;
  }

  return (
    <>
      <InternalNavbar />
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Action Buttons - Hidden during print */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 print:hidden">
            <div className="flex justify-between items-center">
              <button
                onClick={handleBack}
                className="bg-gray-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-600 transition flex items-center gap-2"
              >
                ← Back to Entries
              </button>
              <button
                onClick={handlePrint}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition flex items-center gap-2"
              >
                🖨️ Print Now
              </button>
            </div>
          </div>

          {/* Printout Content - A4 Size */}
          <div className="bg-white shadow-2xl rounded-lg print:shadow-none print:rounded-none">
            {/* A4 Print Container */}
            <div className="p-8 print:p-12 min-h-[297mm]">
              {/* Company Header */}
              <div className="text-center border-b-2 border-gray-300 pb-6 mb-8">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">THERMO PACKERS</h1>
                <p className="text-xs text-gray-600 mb-1"> Mfrs & Suppliers of Thermocol Sheets, All Kinds of Thermocol Packing, PU Products
 VILL SANGAL SOHAL, OPP JALANDHAR KUNJ, KAPURTHALA ROAD, JALANDHAR-144031 (PUNJAB)</p>
                <p className="text-gray-600 text-sm">Phone: +91-9216860160 | Email: thermopackers@gmail.com</p>
              </div>

              {/* Document Title */}
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-blue-800 mb-2">
                  GATE INWARD RECORD
                </h2>
                <div className={`inline-block px-4 py-2 rounded-lg text-white font-semibold ${
                  guardEntry.isRejected ? 'bg-red-600' : 'bg-green-600'
                }`}>
                  {guardEntry.isRejected ? 'REJECTED/RETURNED MATERIAL' : 'SUPPLIER MATERIAL INWARD'}
                </div>
              </div>

              {/* Main Content Grid */}
              <div className="grid grid-cols-2 gap-8 mb-8">
                {/* Left Column - Basic Information */}
                <div className="space-y-4">
                  <div className="border-b pb-2">
                    <div className="text-sm text-gray-500 font-medium">Entry Number</div>
                    <div className="text-sm font-bold text-blue-800">{guardEntry.entryNumber}</div>
                  </div>
                  
                  <div className="border-b pb-2">
                    <div className="text-sm text-gray-500 font-medium">Entry Date & Time</div>
                    <div className="text-sm font-semibold">{formatDate(guardEntry.createdAt)}</div>
                  </div>
                  
                  <div className="border-b pb-2">
                    <div className="text-sm text-gray-500 font-medium">Vehicle Number</div>
                    <div className="text-sm font-bold text-green-700">{guardEntry.vehicleNumber}</div>
                  </div>
                </div>

                {/* Right Column - Supplier/Customer Information */}
                <div className="space-y-4">
                  <div className="border-b pb-2">
                    <div className="text-sm text-gray-500 font-medium">
                      {guardEntry.isRejected ? 'Customer Name' : 'Supplier Name'}
                    </div>
                    <div className="text-sm font-semibold">
                      {guardEntry.isRejected 
                        ? (guardEntry.customer?.name || guardEntry.customerName || 'N/A')
                        : (guardEntry.supplier?.name || guardEntry.supplierName || 'N/A')
                      }
                      {(guardEntry.isRejected && guardEntry.customerName) || (!guardEntry.isRejected && guardEntry.supplierName) ? (
                        <span className="text-sm text-green-600 ml-2">(Manual Entry)</span>
                      ) : null}
                    </div>
                  </div>
                  
                  <div className="border-b pb-2">
                    <div className="text-sm text-gray-500 font-medium">Recorded By</div>
                    <div className="text-sm font-semibold">{guardEntry.recordedBy?.name || 'N/A'}</div>
                  </div>
                  
                  <div className="border-b pb-2">
                    <div className="text-sm text-gray-500 font-medium">Status</div>
                    <div className={`text-sm font-semibold ${
                      guardEntry.isRejected ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {guardEntry.isRejected ? 'Rejected Material' : 'Supplier Material'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Products/Materials Section */}
              <div className="mb-8">
                <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">
                  MATERIALS / PRODUCTS RECEIVED
                </h3>
                
                {guardEntry.purchaseProducts && guardEntry.purchaseProducts.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border border-gray-300 px-4 py-3 text-left font-semibold">S.No.</th>
                          <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Product Name</th>
                          <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Quantity</th>
                          <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Type</th>
                        </tr>
                      </thead>
                      <tbody>
                        {guardEntry.purchaseProducts.map((product, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="border border-gray-300 px-4 py-3 text-sm">{index + 1}</td>
                            <td className="border border-gray-300 px-4 py-3 font-medium text-sm">
                              {product.product?.name || product.productName || 'N/A'}
                            </td>
                            <td className="border border-gray-300 px-4 py-3 text-sm">{product.quantity}</td>
                            <td className="border border-gray-300 px-4 py-3 text-sm">
                              {product.productName ? (
                                <span className="text-green-600 font-semibold">Manual Entry</span>
                              ) : (
                                <span className="text-blue-600">Standard Product</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-6 border border-gray-300 rounded-lg">
                    <p className="text-gray-500 text-lg">No products recorded for this entry</p>
                  </div>
                )}
              </div>

              {/* Remarks Section */}
              {guardEntry.remarks && (
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">REMARKS</h3>
                  <div className="bg-gray-50 border border-gray-300 rounded-lg p-4">
                    <p className="text-gray-700 whitespace-pre-wrap text-sm">{guardEntry.remarks}</p>
                  </div>
                </div>
              )}

              {/* Photos Section */}
              {guardEntry.photos && guardEntry.photos.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">
                    ATTACHED PHOTOS ({guardEntry.photos.length})
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {guardEntry.photos.map((photo, index) => (
                      <div key={index} className="border border-gray-300 rounded-lg overflow-hidden">
                        <img
                          src={photo}
                          alt={`Vehicle/Material Photo ${index + 1}`}
                          className="w-full h-48 object-cover print:h-32"
                        />
                        <div className="p-2 text-center bg-gray-100">
                          <span className="text-sm text-gray-600">Photo {index + 1}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

          
            </div>
          </div>

          {/* Print Instructions */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-6 print:hidden">
            <div className="flex items-start gap-3">
              <span className="text-yellow-600 text-xl">💡</span>
              <div>
                <h4 className="font-semibold text-yellow-800">Print Instruction</h4>
                <p className="text-yellow-700 text-sm mt-1">
                  • Click "Print Now" button to generate A4 printout<br/>
              </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Print Styles */}
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
            padding: 3rem !important;
          }
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          .print\\:rounded-none {
            border-radius: 0 !important;
          }
          .print\\:h-32 {
            height: 8rem !important;
          }
          @page {
            margin: 0;
            size: A4;
          }
        }
      `}</style>
    </>
  );
};

export default GateInwardPrintout;