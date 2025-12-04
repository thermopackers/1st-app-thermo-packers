import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../axiosInstance';
import Swal from 'sweetalert2';
import InternalNavbar from '../components/InternalNavbar';

const GateOutwardPrintout = () => {
  const { gateOutwardId } = useParams();
  const navigate = useNavigate();
  const [gateOutward, setGateOutward] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGateOutwardDetails();
  }, [gateOutwardId]);

  const fetchGateOutwardDetails = async () => {
    try {
      const res = await axiosInstance.get(`/gate-outwards/${gateOutwardId}`);
      
      if (res.data.entry) {
        setGateOutward(res.data.entry);
        console.log('Gate outward data:', res.data.entry); // Debug log
      } else {
        Swal.fire('Error', 'Gate outward entry not found', 'error');
        navigate('/gate-outwards-view');
      }
    } catch (err) {
      console.error('Failed to fetch gate outward entry', err);
      Swal.fire('Error', 'Failed to load gate outward details', 'error');
      navigate('/gate-outwards-view');
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
    navigate('/gate-outwards-view');
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

  if (!gateOutward) {
    return null;
  }

  // Debug: Check product structure
  console.log('Gate outward products:', gateOutward.products);

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
                ← Back to Outwards
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
                  GATE OUTWARD RECORD
                </h2>
                <div className={`inline-block px-3 py-1 rounded text-white font-semibold text-sm ${
                  gateOutward.isRepair ? 'bg-orange-600' : 'bg-green-600'
                }`}>
                  {gateOutward.isRepair ? 'MATERIAL SENT FOR REPAIR' : 'MATERIAL SOLD TO CUSTOMER'}
                </div>
              </div>

              {/* Main Content Grid - Minimal spacing */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                {/* Left Column - Basic Information */}
                <div className="space-y-2">
                  <div className="border-b pb-1">
                    <div className="text-xs text-gray-500 font-medium">GONO (Gate Outward No.)</div>
                    <div className="text-sm font-bold text-blue-800">{gateOutward.GONO}</div>
                  </div>
                  
                  <div className="border-b pb-1">
                    <div className="text-xs text-gray-500 font-medium">Outward Date & Time</div>
                    <div className="text-sm font-semibold">{formatDate(gateOutward.createdAt)}</div>
                  </div>
                  
                  <div className="border-b pb-1">
                    <div className="text-xs text-gray-500 font-medium">{gateOutward.isRepair ? 'Challan No.' : 'Bill No.'}</div>
                    <div className="text-sm font-bold text-green-700">
                      {gateOutward.isRepair ? gateOutward.challanNo : gateOutward.billNo}
                    </div>
                   
                  </div>
                </div>

                {/* Right Column - Supplier/Customer Information */}
                <div className="space-y-2">
                  <div className="border-b pb-1">
                    <div className="text-xs text-gray-500 font-medium">
                      {gateOutward.isRepair ? 'Supplier Name' : 'Customer Name'}
                    </div>
                    <div className="text-sm font-semibold">
                      {gateOutward.isRepair 
                        ? (gateOutward.supplier?.name || gateOutward.supplierName || 'N/A')
                        : (gateOutward.customer?.name || gateOutward.customerName || 'N/A')
                      }
                      {(gateOutward.isRepair && gateOutward.supplierName) || (!gateOutward.isRepair && gateOutward.customerName) ? (
                        <span className="text-xs text-green-600 ml-1">(Manual)</span>
                      ) : null}
                    </div>
                  </div>
                  
                  <div className="border-b pb-1">
                    <div className="text-xs text-gray-500 font-medium">Recorded By</div>
                    <div className="text-sm font-semibold">{gateOutward.recordedBy?.name || 'N/A'}</div>
                  </div>
                  
                  <div className="border-b pb-1">
                    <div className="text-xs text-gray-500 font-medium">Type</div>
                    <div className={`text-sm font-semibold ${
                      gateOutward.isRepair ? 'text-orange-600' : 'text-green-600'
                    }`}>
                      {gateOutward.isRepair ? 'Repair' : 'Sale'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Products/Materials Section - Minimal margin */}
              <div className="mb-4">
                <h3 className="text-lg font-bold text-gray-800 mb-2 border-b pb-1">
                  MATERIALS / PRODUCTS SENT
                </h3>
                
                {gateOutward.products && gateOutward.products.length > 0 ? (
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
                        {gateOutward.products.map((item, index) => {
                          // Get product name - check product object first, then productName
                          const productName = item.product?.name || item.productName || 'Unknown Product';
                          const productCode = item.product?.code;
                          const isManual = !item.product && item.productName;
                          
                          return (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="border border-gray-300 px-2 py-1 text-center">{index + 1}</td>
                              <td className="border border-gray-300 px-2 py-1 font-medium">
                                {productName}
                                {isManual && (
                                  <span className="text-xs text-green-600 ml-1">(Manual)</span>
                                )}
                              </td>
                              <td className="border border-gray-300 px-2 py-1 text-center">{item.quantity}</td>
                             
                              <td className="border border-gray-300 px-2 py-1 text-center">
                                {isManual ? (
                                  <span className="text-green-600 font-semibold text-xs">Manual</span>
                                ) : (
                                  <span className="text-blue-600 text-xs">Standard</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                        {/* Total Row */}
                        <tr className="bg-gray-100 font-bold">
                          <td className="border border-gray-300 px-2 py-1 text-center" colSpan="2">TOTAL</td>
                          <td className="border border-gray-300 px-2 py-1 text-center">
                            {gateOutward.products.reduce((sum, product) => sum + (product.quantity || 0), 0)}
                          </td>
                          <td className="border border-gray-300 px-2 py-1 text-center" colSpan="2">
                            Items: {gateOutward.products.length}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-3 border border-gray-300 rounded">
                    <p className="text-gray-500 text-sm">No products recorded for this outward</p>
                  </div>
                )}
              </div>

              {/* Remarks Section - Minimal margin */}
              {gateOutward.remarks && gateOutward.remarks.trim() && (
                <div className="mb-4">
                  <h3 className="text-lg font-bold text-gray-800 mb-2 border-b pb-1">REMARKS</h3>
                  <div className="bg-gray-50 border border-gray-300 rounded p-2">
                    <p className="text-gray-700 whitespace-pre-wrap text-xs">{gateOutward.remarks}</p>
                  </div>
                </div>
              )}

              {/* Photos Section - Minimal margin */}
              {gateOutward.photos && gateOutward.photos.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-lg font-bold text-gray-800 mb-2 border-b pb-1">
                    ATTACHED PHOTOS ({gateOutward.photos.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {gateOutward.photos.map((photo, index) => (
                      <div key={index} className="border border-gray-300 rounded-lg overflow-hidden bg-white">
                        <img
                          src={photo}
                          alt={`Material/Vehicle Photo ${index + 1}`}
                          className="w-full h-64 object-contain print:h-48 print:object-contain"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://via.placeholder.com/400x300?text=Photo+Not+Available';
                          }}
                        />
                        <div className="p-2 text-center bg-gray-100 border-t border-gray-300">
                          <span className="text-sm font-medium text-gray-700">
                            Photo {index + 1} - {gateOutward.isRepair ? 'Repair Material' : 'Sale Material'}
                          </span>
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

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:p-12 {
            padding: 0.5rem !important;
          }
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          .print\\:rounded-none {
            border-radius: 0 !important;
          }
          .print\\:h-48 {
            height: 8rem !important;
            max-height: 8rem !important;
          }
          .print\\:object-contain {
            object-fit: contain !important;
          }
          @page {
            margin: 0.5cm;
            size: A4 portrait;
          }
          table {
            page-break-inside: auto !important;
          }
          tr {
            page-break-inside: avoid !important;
            page-break-after: auto !important;
          }
          thead {
            display: table-header-group !important;
          }
          tfoot {
            display: table-footer-group !important;
          }
        }
      `}</style>
    </div>
  );
};

export default GateOutwardPrintout;