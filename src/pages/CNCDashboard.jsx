// CNC Dashboard.jsx
import React, { useState, useEffect } from "react";
import axiosInstance from "../axiosInstance";
import Swal from "sweetalert2";
import InternalNavbar from "../components/InternalNavbar";
import { NavLink, useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { useUserContext } from "../context/UserContext";
import EditCNCSlipForm from "../components/EditCNCSlipForm";

const CNCDashboard = () => {
  const { setShouldRefetchOrders } = useUserContext();
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");
      const [activeProductImage, setActiveProductImage] = useState(null);
  const [endDate, setEndDate] = useState("");
    const [products, setProducts] = useState([]);
    const [editModalOpen, setEditModalOpen] = useState(false);
const [selectedOrderForEdit, setSelectedOrderForEdit] = useState(null);
  const [cncStatus, setCncStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [filterLoading, setFilterLoading] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [totalPages, setTotalPages] = useState(1);
  const currentPage = parseInt(searchParams.get("page")) || 1;
  const navigate = useNavigate();
  const [uploadingFiles, setUploadingFiles] = useState({});
const [deletingFiles, setDeletingFiles] = useState({});
  const ordersPerPage = 10;
 useEffect(() => {
    axiosInstance
      .get("/products/all-backend-products")
      .then((res) => setProducts(res.data))
      .catch((err) => console.error("Error fetching products:", err));
  }, []);
useEffect(() => {
  // Instead of resetting the page silently,
  // reset it only if the current page is NOT 1.
  if (currentPage !== 1) {
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      params.set("page", 1);
      return params;
    });
  }
}, [searchTerm, startDate, endDate]);

  useEffect(() => {
    const fetchOrders = async () => {
      setFilterLoading(true);
      try {
       const res = await axiosInstance.get("/orders/cnc-orders", {
  params: {
    page: currentPage,
    limit: ordersPerPage,
    search: searchTerm,
    startDate,
    endDate,
    sort: sortOrder,
      cncStatus, // ✅ include this
  },
});

       setOrders(res.data.orders);

        setTotalPages(res.data.totalPages);
      } catch (err) {
        console.error("Failed to fetch CNC orders:", err);
      } finally {
        setFilterLoading(false);
        setLoading(false);
      }
    };

    fetchOrders();
  }, [searchTerm, startDate, endDate, currentPage,sortOrder,cncStatus]);
const updateCNCStatus = async (orderId, newStatus) => {
  try {
    await axiosInstance.put(`/orders/${orderId}/status`, {
      status: newStatus,
    });
    setOrders((prev) =>
      prev.map((o) =>
        o._id === orderId ? { ...o, status: newStatus } : o
      )
    );
    toast.success("CNC status updated successfully");
  } catch (err) {
    toast.error("Failed to update CNC status");
    console.error("Failed to update CNC status:", err);
  }
};

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setSearchParams({ page });
    }
  };

  const handleDeleteCNC = async (orderId) => {
  const confirm = await Swal.fire({
    title: "Are you sure?",
    text: "This will remove the order from CNC Dashboard (not from main Order List).",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Yes, remove",
    cancelButtonText: "Cancel",
  });

  if (confirm.isConfirmed) {
    try {
      const token = localStorage.getItem("token");
      await axiosInstance.delete(`/orders/remove-from-cnc/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setOrders((prev) => prev.filter((o) => o._id !== orderId));
      toast.success("Order removed from CNC Dashboard.");
      setShouldRefetchOrders(true); // 👈 this will trigger OrderList to refresh
    } catch (err) {
      console.error("Error deleting CNC entry:", err);
      toast.error("Failed to remove order.");
    }
  }
};
const handleEditSlip = (order) => {
  if (!order.cncSlip?.url) {
    toast.error("No CNC slip found for editing");
    return;
  }
  
  setSelectedOrderForEdit(order);
  setEditModalOpen(true);
};

const handleSaveEditedSlip = async (orderId, formData) => {
  try {
    setLoading(true);
    
    const response = await axiosInstance.put(
      `/orders/${orderId}/edit-cnc-slip`,
      formData,
      {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      }
    );

    toast.success("CNC slip updated successfully!");
    setEditModalOpen(false);
    setSelectedOrderForEdit(null);
    
    // Refresh the orders list
    const res = await axiosInstance.get("/orders/cnc-orders", {
      params: {
        page: currentPage,
        limit: ordersPerPage,
        search: searchTerm,
        startDate,
        endDate,
        sort: sortOrder,
        cncStatus,
      },
    });

    setOrders(res.data.orders);
    
  } catch (err) {
    console.error("Error editing CNC slip", err);
    toast.error("Failed to update CNC slip");
  } finally {
    setLoading(false);
  }
};

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-purple-300 border-t-purple-600 rounded-full animate-spin"></div>
          <p className="text-purple-700 font-medium">Loading orders...</p>
        </div>
      </div>
    );
  }


const handleFileUpload = async (orderId, files) => {
  if (!files || files.length === 0) return;

  setUploadingFiles(prev => ({ ...prev, [orderId]: true }));
  
  try {
    const formData = new FormData();
    Array.from(files).forEach(file => {
      formData.append('files', file); // Note: 'files' matches the multer field name
    });

    const response = await axiosInstance.put(
      `/orders/${orderId}/cnc-finished-files`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      }
    );

    // Update local state with the files from backend response
    setOrders(prev => prev.map(order => 
      order._id === orderId 
        ? { 
            ...order, 
            cncFinishedFiles: response.data.order.cncFinishedFiles
          }
        : order
    ));

    toast.success('Files uploaded successfully to Cloudinary!');
  } catch (error) {
    console.error('Error uploading files:', error);
    toast.error('Failed to upload files');
  } finally {
    setUploadingFiles(prev => ({ ...prev, [orderId]: false }));
  }
};

const handleDeleteFile = async (orderId, fileId) => {
  // Show confirmation dialog first
  const confirm = await Swal.fire({
    title: "Are you sure?",
    text: "This file will be permanently deleted.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Yes, delete it!",
    cancelButtonText: "Cancel",
    confirmButtonColor: "#d33",
    cancelButtonColor: "#3085d6",
  });

  if (!confirm.isConfirmed) return;

  // Set loading state for this specific file
  setDeletingFiles(prev => ({ ...prev, [fileId]: true }));

  try {
    console.log("Deleting file - Order:", orderId, "File ID:", fileId);
    
    // Encode the fileId to handle special characters like slashes
    const encodedFileId = encodeURIComponent(fileId);
    console.log("Encoded File ID:", encodedFileId);
    
    await axiosInstance.delete(`/orders/${orderId}/cnc-finished-files/${encodedFileId}`);
    
    // Remove from local state
    setOrders(prev => prev.map(order => 
      order._id === orderId 
        ? { 
            ...order, 
            cncFinishedFiles: order.cncFinishedFiles.filter(file => file.public_id !== fileId)
          }
        : order
    ));
    
    // Show success message
    await Swal.fire({
      title: "Deleted!",
      text: "File has been deleted successfully.",
      icon: "success",
      timer: 2000,
      showConfirmButton: false
    });
    
  } catch (error) {
    console.error('Error deleting file:', error);
    console.error('Error details:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
    
    // Show error message
    await Swal.fire({
      title: "Error!",
      text: error.response?.data?.message || "Failed to delete file. Please try again.",
      icon: "error",
      confirmButtonText: "OK",
      confirmButtonColor: "#d33",
    });
  } finally {
    // Clear loading state
    setDeletingFiles(prev => ({ ...prev, [fileId]: false }));
  }
};

// File preview handler
const handleFilePreview = (file) => {
  const fileExtension = file.originalName.split('.').pop()?.toLowerCase();
  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(fileExtension);
  const isPDF = fileExtension === 'pdf';
  
  if (isImage) {
    // Show image in modal
    Swal.fire({
      title: file.originalName,
      html: `
        <div class="text-center">
          <img src="${file.url}" alt="${file.originalName}" 
               class="max-w-full max-h-96 mx-auto rounded-lg shadow-lg" 
               style="max-height: 70vh; object-fit: contain;" />
          <div class="mt-4 text-sm text-gray-600">
            <a href="${file.url}" target="_blank" 
               class="text-blue-600 hover:underline">
               📎 Open in new tab
            </a>
          </div>
        </div>
      `,
      showCloseButton: true,
      showConfirmButton: false,
      width: 'auto',
      padding: '20px',
      background: '#f8fafc'
    });
  } else if (isPDF) {
    // Show PDF in modal
    Swal.fire({
      title: file.originalName,
      html: `
        <div class="text-center">
          <iframe src="${file.url}" 
                  class="w-full h-96 border rounded-lg" 
                  style="min-height: 500px;">
          </iframe>
          <div class="mt-4 text-sm text-gray-600">
            <a href="${file.url}" target="_blank" 
               class="text-blue-600 hover:underline">
               📎 Open in new tab
            </a>
          </div>
        </div>
      `,
      showCloseButton: true,
      showConfirmButton: false,
      width: '80%',
      padding: '20px',
      background: '#f8fafc'
    });
  } else {
    // For other file types, show download option
    Swal.fire({
      title: file.originalName,
      html: `
        <div class="text-center">
          <div class="text-6xl mb-4">📄</div>
          <p class="text-gray-600 mb-4">This file type cannot be previewed.</p>
          <div class="space-y-2">
            <a href="${file.url}" target="_blank" 
               class="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors">
               📎 Open in new tab
            </a>
            <br>
            <a href="${file.url}" download="${file.originalName}"
               class="inline-block bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors">
               ⬇️ Download file
            </a>
          </div>
        </div>
      `,
      showCloseButton: true,
      showConfirmButton: false,
      width: 'auto',
      padding: '20px'
    });
  }
};

// Helper function to show file icons
const getFileIcon = (fileName) => {
  const extension = fileName.split('.').pop()?.toLowerCase();
  
  const iconMap = {
    // Images
    'jpg': '🖼️', 'jpeg': '🖼️', 'png': '🖼️', 'gif': '🖼️', 'webp': '🖼️', 'bmp': '🖼️',
    // Documents
    'pdf': '📕',
    'doc': '📄', 'docx': '📄',
    'xls': '📊', 'xlsx': '📊',
    'ppt': '📑', 'pptx': '📑',
    'txt': '📝',
    // Default
    'default': '📎'
  };
  
  return iconMap[extension] || iconMap.default;
};

  return (
    <>
      <InternalNavbar />
      <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
        <button
          className="absolute left-4 hidden md:block bg-purple-500 text-white px-4 py-2 rounded-md shadow-md hover:bg-purple-600"
          onClick={() => navigate(-1)}
        >
          ↩ Back
        </button>

       <div className="mb-6 flex flex-col md:flex-row md:justify-between items-center gap-4">
  <h2 className="text-3xl md:text-4xl font-bold text-center text-black">
    EPS / Thermocol CNC Hot Wire/CNC Router Dashboard
  </h2>
  <div className="flex gap-4">
    <button
      onClick={() => navigate('/drawing-orders-table')}
      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md shadow"
    >
      📐 Drawing Orders
    </button>
   
  </div>
</div>


        <div className="flex flex-wrap items-end gap-4 mb-6">
          <div className="flex flex-col">
            <label className="text-sm font-medium">Start Date:</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="p-2 border border-gray-300 rounded"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-sm font-medium">End Date:</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="p-2 border border-gray-300 rounded"
            />
          </div>
          <div className="flex flex-col w-full md:w-1/3">
            <label className="text-sm font-medium">Search:</label>
            <input
              type="text"
              placeholder="Search by product, PO, customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="p-2 border border-gray-300 rounded"
            />
          </div>
          <div className="flex flex-col">
  <label className="text-sm font-medium">Sort Order:</label>
  <select
    value={sortOrder}
    onChange={(e) => setSortOrder(e.target.value)}
    className="p-2 border border-gray-300 rounded"
  >
    <option value="newest">Newest First</option>
    <option value="oldest">Oldest First</option>
  </select>
</div>
<select
  value={cncStatus}
  onChange={(e) => setCncStatus(e.target.value)}
  className="p-2 border border-gray-300 rounded"
>
  <option value="">All</option>
  <option value="pending">Pending</option>
  <option value="in process">In Process</option>
  <option value="processed">Processed</option>
  <option value="completed">Completed</option>
</select>

          <button
            onClick={() => {
              setSearchTerm("");
              setStartDate("");
              setEndDate("");
                setSortOrder("newest");
                    setCncStatus(""); // ✅ Add this to clear CNC status filter
            }}
            className="bg-red-500 text-white px-4 py-2 rounded shadow hover:bg-red-600"
          >
            Clear Filters
          </button>
        </div>

        {filterLoading ? (
          <div className="text-center text-purple-600">Filtering...</div>
        ) : orders.length === 0 ? (
          <div className="text-center text-gray-500">No orders found</div>
        ) : (
          <div className="overflow-x-auto bg-white rounded shadow">
            <table className="min-w-full text-sm text-left border">
             <thead className="bg-blue-100 text-gray-700 text-xs uppercase">
  <tr>
    <th className="px-4 py-3">Order ID</th>
    <th className="px-4 py-3">Date of Order</th>
    <th className="px-4 py-3">Customer Name</th>
    <th className="px-4 py-3">PO</th>
    <th className="px-4 py-3">Product Name</th>
    <th className="px-4 py-3">Size</th>
    <th className="px-4 py-3">Quantity</th>
    <th className="px-4 py-3">Remarks</th>
    <th className="px-4 py-3">Slip</th>
    <th className="px-4 py-3">Status</th>
    <th className="px-4 py-3">CNC Status</th>
    <th className="px-4 py-3">Finished Product Pictures</th>
                      <th className="px-4 py-3">Delete This order from here</th>
  </tr>
</thead>
              <tbody>
                {orders.map((order) => (
                 <tr key={order._id} className="hover:bg-gray-50 transition duration-150">
  <td className="px-4 py-2">{order.shortId}</td>
   <td className="px-6 py-4">
  <div className="text-xs text-gray-500">
    {new Date(order.createdAt).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })}
  </div>
</td>

  <td className="px-4 py-2 capitalize">{order.customerName}</td>
  <td className="px-4 py-2 capitalize">{order.po}</td>
 <td className="px-4 py-2 text-blue-600 underline cursor-pointer">
  <button
    onClick={() => {
      const product = products.find((p) => p.name === order.product);
      if (product?.images?.length > 0) {
        setActiveProductImage({
          name: product.name,
          images: product.images,
        });
      } else {
        Swal.fire({
          icon: "info",
          title: "No Image",
          text: "No images available for this product.",
        });
      }
    }}
  >
    {order.product}
  </button>
</td> 
  <td className="px-4 py-2">{order.size}</td>
  <td className="px-4 py-2">{order.quantity}</td>
  <td className="px-4 py-2">{order.remarks}</td>
  <td className="px-4 py-2">
    {order.cncSlip?.url && (
      <a
        href={order.cncSlip.url}
        download
        className="text-blue-600 underline"
      >
        🧾 Download Slip
      </a>
    )}
  </td>
<td className="px-4 py-2">
  {order.status === "cancelled" ? (
    <span className="text-red-600 font-semibold">
      🚫 Order cancelled, not to be processed!
    </span>
  ) : (
   <select
  value={order.status || "pending"}
  onChange={(e) => updateCNCStatus(order._id, e.target.value)}
  disabled={order.status === "completed"} // lock after completed
  className={`border border-gray-300 rounded px-2 py-1 text-sm ${
    order.status === "completed" ? "bg-gray-100 cursor-not-allowed" : ""
  }`}
>
  <option value="pending">Pending</option>
  <option value="in process">In Process</option>
  <option value="processed">Processed(Ready For Dispatch)</option>
  <option value="completed" disabled>Already Dispatched</option>
</select>

  )}
</td>

<td className="px-4 py-2 whitespace-nowrap">
 <span
  className={`px-2 py-1 rounded-full text-xs font-semibold ${
    order.status === "completed"
      ? "bg-green-700 text-white"
      : order.status === "processed"
      ? "bg-green-100 text-green-700"
      : order.status === "in process"
      ? "bg-yellow-100 text-yellow-700"
      : order.status === "cancelled"
      ? "bg-red-200 text-red-800"
      : order.status === "pending"
      ? "bg-orange-100 text-orange-700"
      : "bg-gray-100 text-gray-700"
  }`}
>
  {order.status === "completed" ? "✅ Completed" : order.status || "pending"}
</span>

</td>
<td className="px-4 py-2">
  <div className="flex flex-col space-y-2">
    {/* File Upload Input */}
    <input
      type="file"
      multiple
      accept="image/*,.pdf,.doc,.docx"
      onChange={(e) => handleFileUpload(order._id, e.target.files)}
      disabled={uploadingFiles[order._id]}
      className="text-sm text-gray-700 file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
    />
    
    {/* Uploading Indicator */}
    {uploadingFiles[order._id] && (
      <div className="text-blue-600 text-xs">Uploading...</div>
    )}
    
    {/* Uploaded Files List */}
   {order.cncFinishedFiles && order.cncFinishedFiles.length > 0 && (
  <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
    {order.cncFinishedFiles.map((file, index) => (
      <div key={index} className="flex items-center justify-between text-xs bg-gray-100 p-2 rounded border">
        <button
          onClick={() => handleFilePreview(file)}
          className="text-blue-600 hover:text-blue-800 hover:underline truncate flex-1 text-left"
          title={`Click to preview: ${file.originalName}`}
        >
          {getFileIcon(file.originalName)} {file.originalName}
        </button>
       <button
  onClick={() => handleDeleteFile(order._id, file.public_id)}
  disabled={deletingFiles[file.public_id]}
  className={`ml-2 text-sm font-bold ${
    deletingFiles[file.public_id] 
      ? 'text-gray-400 cursor-not-allowed' 
      : 'text-red-500 hover:text-red-700'
  }`}
  title={deletingFiles[file.public_id] ? "Deleting..." : "Delete file"}
>
  {deletingFiles[file.public_id] ? (
    <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
  ) : (
    '×'
  )}
</button>
      </div>
    ))}
  </div>
)}
  </div>
</td>
<td className="px-4 py-2">
  <div className="flex flex-col space-y-2">
    <button
      onClick={() => handleDeleteCNC(order._id)}
      className="text-red-600 hover:text-red-800 underline text-sm"
    >
      ❌ Delete
    </button>
    
    {/* Edit Button */}
    {order.cncSlip?.url && (
      <button
        onClick={() => handleEditSlip(order)}
        className="text-blue-600 hover:text-blue-800 underline text-sm"
      >
        ✏️ Edit
      </button>
    )}
  </div>
</td>
</tr>

                ))}
              </tbody>
            </table>
            {activeProductImage && (
  <div
    className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center p-6"
    onClick={() => setActiveProductImage(null)}
  >
    <div
      className="bg-white rounded-lg p-4 max-w-4xl w-full overflow-y-auto max-h-[90vh] relative"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        onClick={() => setActiveProductImage(null)}
        className="absolute top-2 right-3 text-2xl font-bold text-red-500 hover:text-red-700"
      >
        ✖
      </button>
      <h2 className="text-lg font-semibold mb-4">
        {activeProductImage.name} - Images
      </h2>
      {activeProductImage.images.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {activeProductImage.images.map((img, i) => (
            <img
              key={i}
              src={
                img.startsWith("http")
                  ? img
                  : `${import.meta.env.VITE_REACT_APP_API_URL}${img}`
              }
              alt={`Image ${i + 1}`}
              className="w-full h-48 object-cover rounded border"
            />
          ))}
        </div>
      ) : (
        <p className="text-gray-500">No images available.</p>
      )}
    </div>
  </div>
)}
          </div>
        )}

        {orders.length > 0 && (
          <div className="flex justify-center mt-6 gap-2 flex-wrap">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-purple-500 text-white rounded disabled:opacity-50"
            >
              Prev
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => handlePageChange(i + 1)}
                className={`px-4 py-2 rounded ${
                  currentPage === i + 1
                    ? "bg-purple-700 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-purple-300"
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-purple-500 text-white rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
        {editModalOpen && selectedOrderForEdit && (
  <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center p-6">
    <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      <h2 className="text-2xl font-bold mb-4">
        Edit CNC Slip for Order {selectedOrderForEdit.shortId}
      </h2>
      
      <EditCNCSlipForm
        order={selectedOrderForEdit}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedOrderForEdit(null);
        }}
        onSave={handleSaveEditedSlip}
      />
    </div>
  </div>
)}
      </div>
    </>
  );
};

export default CNCDashboard;
