import { useEffect, useState } from "react";
import axiosInstance from "../axiosInstance";
import InternalNavbar from "../components/InternalNavbar";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

export default function ViewRFQs() {
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showWhatsappModal, setShowWhatsappModal] = useState(false);
  const [selectedSuppliers, setSelectedSuppliers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [currentRFQ, setCurrentRFQ] = useState(null);
  const [whatsappContacts, setWhatsappContacts] = useState([]);
  const [rfqs, setRfqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 6;
  const navigate = useNavigate();

  const fetchSuppliersByCategory = async (category) => {
    try {
      const res = await axiosInstance.get(`/rfqs/suppliers-by-category/${category}`);
      setSuppliers(res.data || []);
      setSelectedSuppliers(res.data.map((s) => s._id)); // all checked by default
    } catch (err) {
      toast.error("Failed to load suppliers");
    }
  };

  const fetchRFQs = async (pageNum) => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/rfqs?page=${pageNum}&limit=${limit}`);
      setRfqs(res.data.rfqs);
      setTotalPages(res.data.totalPages);
      setPage(res.data.page);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load RFQs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRFQs(page);
  }, [page]);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this RFQ?")) return;
    try {
      await axiosInstance.delete(`/rfqs/${id}`);
      toast.success("RFQ deleted successfully");
      fetchRFQs(page);
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete RFQ");
    }
  };

  const formatDateDDMMYYYY = (dateInput) => {
  if (!dateInput) return "";
  const d = new Date(dateInput);
  if (isNaN(d)) return "";
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

  const formatPhoneNumber = (phone) => {
    if (!phone) return null;
    
    // Remove all non-digit characters
    let cleaned = phone.replace(/\D/g, '');
    
    // If number starts with 0 (common in India), remove it
    if (cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1);
    }
    
    // Add country code if missing (assuming India +91)
    if (!cleaned.startsWith('91') && cleaned.length === 10) {
      cleaned = `91${cleaned}`;
    }
    
    return cleaned;
  };

const handleWhatsAppSend = () => {
  const selectedContacts = suppliers
    .filter((s) => selectedSuppliers.includes(s._id))
    .map((s) => ({
      name: s.name,
      phone: formatPhoneNumber(s.phone)
    }))
    .filter(s => s.phone && s.phone.length >= 10);

  if (selectedContacts.length === 0) {
    toast.error("No valid phone numbers selected");
    return;
  }

  const message = `Hello,\n\nPlease find the details for the RFQ below:\n\nItem: ${currentRFQ.itemName}\nQuantity: ${currentRFQ.quantity}\nRequired By: ${formatDateDDMMYYYY(currentRFQ.requiredByDate)}\nSize: ${currentRFQ.size || "N/A"}\nRemarks: ${currentRFQ.remarks || "None"}\nCategory: ${currentRFQ.category}\n\nDownload RFQ PDF: ${currentRFQ.fileUrl}\n\nRegards,\n${JSON.parse(localStorage.getItem("user"))?.name || ""}`;

  // Check if on mobile device
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  if (isMobile) {
    // Mobile - show instructions and let user control the flow
    setWhatsappContacts(selectedContacts.map(contact => ({
      ...contact,
      url: `https://api.whatsapp.com/send?phone=${contact.phone}&text=${encodeURIComponent(message)}`
    })));
    
    // Show instruction toast
    toast.success(`Prepared ${selectedContacts.length} WhatsApp links. Tap each one to send.`, {
      duration: 4000
    });
  } else {
    // Desktop - show clickable links
    setWhatsappContacts(selectedContacts.map(contact => ({
      ...contact,
      url: `https://web.whatsapp.com/send?phone=${contact.phone}&text=${encodeURIComponent(message)}`
    })));
  }
};
  return (
    <>
      <InternalNavbar />
      <div className="max-w-4xl mx-auto p-6">
        <h2 className="text-2xl font-bold mb-4">📄 All RFQs</h2>

        {loading ? (
          <p>Loading...</p>
        ) : rfqs.length === 0 ? (
          <p>No RFQs found.</p>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rfqs.map((rfq) => (
                <div
                  key={rfq._id}
                  className="border rounded-lg p-4 shadow-sm bg-white flex flex-col justify-between"
                >
                  <div>
                    <h3 className="font-bold text-lg break-words">{rfq.itemName}</h3>
                    <p className="text-sm text-gray-500">Category: {rfq.category}</p>
                    <p className="text-sm text-gray-500">
                      Created: {new Date(rfq.createdAt).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-4">
                    <a
                      href={rfq.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 flex-1 min-w-[130px] text-center"
                    >
                      📥 View PDF
                    </a>
                    <button
                      onClick={() => navigate(`/edit-rfq/${rfq._id}`, { state: { rfq } })}
                      className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600 flex-1 min-w-[130px]"
                    >
                      ✏ Edit
                    </button>
                    <button
                      onClick={() => handleDelete(rfq._id)}
                      className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 flex-1 min-w-[130px]"
                    >
                      🗑 Delete
                    </button>
                    <button
                      onClick={() => {
                        setCurrentRFQ(rfq);
                        fetchSuppliersByCategory(rfq.category);
                        setShowEmailModal(true);
                      }}
                      className="bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700 flex-1 min-w-[130px]"
                    >
                      📧 Send Email
                    </button>
                    <button
                      onClick={() => {
                        setCurrentRFQ(rfq);
                        fetchSuppliersByCategory(rfq.category);
                        setShowWhatsappModal(true);
                      }}
                      className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 flex-1 min-w-[130px]"
                    >
                      💬 WhatsApp All
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Email Modal */}
            {showEmailModal && (
              <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
                <div className="bg-white rounded p-6 w-full max-w-lg">
                  <h3 className="text-lg font-bold mb-4">Send RFQ: {currentRFQ?.itemName}</h3>

                  <div className="max-h-64 overflow-y-auto border p-2 rounded">
                    {suppliers.map((supplier) => (
                      <label key={supplier._id} className="flex items-center gap-2 mb-2">
                        <input
                          type="checkbox"
                          checked={selectedSuppliers.includes(supplier._id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedSuppliers((prev) => [...prev, supplier._id]);
                            } else {
                              setSelectedSuppliers((prev) => prev.filter((id) => id !== supplier._id));
                            }
                          }}
                        />
                        <span>{supplier.name} ({supplier.email || "No email"})</span>
                      </label>
                    ))}
                  </div>

                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => {
                        const toEmails = suppliers
                          .filter((s) => selectedSuppliers.includes(s._id))
                          .map((s) => s.email)
                          .join(",");

                        const subject = `RFQ - ${currentRFQ.itemName}`;
                        const body = `
Hello,

Please find the details for the RFQ below:

Item: ${currentRFQ.itemName}
Quantity: ${currentRFQ.quantity}
Required By: ${formatDateDDMMYYYY(currentRFQ.requiredByDate)}
Size: ${currentRFQ.size || "N/A"}
Remarks: ${currentRFQ.remarks || "None"}
Category: ${currentRFQ.category}

Download RFQ PDF: ${currentRFQ.fileUrl}

Regards,
${JSON.parse(localStorage.getItem("user"))?.name || ""}
                        `;

                        const mailtoLink = `mailto:${encodeURIComponent(toEmails)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                        window.location.href = mailtoLink;
                        setShowEmailModal(false);
                      }}
                      className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                    >
                      📤 Open in Email Client
                    </button>

                    <button
                      onClick={() => setShowEmailModal(false)}
                      className="bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600"
                    >
                      ❌ Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* WhatsApp Modal */}
{showWhatsappModal && (
  <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
    <div className="bg-white rounded p-6 w-full max-w-lg">
      <h3 className="text-lg font-bold mb-4">Send RFQ via WhatsApp: {currentRFQ?.itemName}</h3>

      {/* Supplier selection */}
      <div className="max-h-64 overflow-y-auto border p-2 rounded mb-4">
        {suppliers.map((supplier) => (
          <label key={supplier._id} className="flex items-center gap-2 mb-2">
            <input
              type="checkbox"
              checked={selectedSuppliers.includes(supplier._id)}
              onChange={(e) => {
                if (e.target.checked) {
                  setSelectedSuppliers((prev) => [...prev, supplier._id]);
                } else {
                  setSelectedSuppliers((prev) => prev.filter((id) => id !== supplier._id));
                }
              }}
            />
            <span>{supplier.name} ({formatPhoneNumber(supplier.phone) || "No phone"})</span>
          </label>
        ))}
      </div>

      {/* WhatsApp links - shown on both desktop and mobile */}
      {whatsappContacts.length > 0 && (
        <div className="mt-4">
          <p className="mb-2">Click to send to each supplier:</p>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {whatsappContacts.map((contact, index) => (
              <a
                key={index}
                href={contact.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-left bg-green-100 text-green-800 p-2 rounded hover:bg-green-200"
                onClick={() => {
                  // Close modal after last contact on mobile
                  if (index === whatsappContacts.length - 1) {
                    setTimeout(() => setShowWhatsappModal(false), 300);
                  }
                }}
              >
                💬 Send to {contact.name} ({contact.phone})
              </a>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2 mt-4">
        <button
          onClick={handleWhatsAppSend}
          className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
        >
          {whatsappContacts.length > 0 ? '🔄 Regenerate Links' : '📱 Prepare WhatsApp Links'}
        </button>

        <button
          onClick={() => {
            setShowWhatsappModal(false);
            setWhatsappContacts([]);
          }}
          className="bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600"
        >
          ❌ Close
        </button>
      </div>
    </div>
  </div>
)}

            {/* Pagination Controls */}
            <div className="flex justify-center mt-6 space-x-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                ⬅ Prev
              </button>
              <span className="px-3 py-1">{page} / {totalPages}</span>
              <button
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Next ➡
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}