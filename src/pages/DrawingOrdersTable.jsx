import React, { useEffect, useState } from 'react';
import InternalNavbar from '../components/InternalNavbar';
import axiosInstance from '../axiosInstance';
import { useUserContext } from '../context/UserContext';
import imageCompression from 'browser-image-compression';
import axios from 'axios';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

const DrawingOrdersTable = () => {
    const { user } = useUserContext();
  const [orders, setOrders] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
const [isUploading, setIsUploading] = useState(false);
const [isDeleting, setIsDeleting] = useState(false);
const isSupplierLocked = (order) =>
  user.role === 'suppliers' && order.priceConfirmedStatus === 'confirmed';

// Compress image file
const compressImage = async (file) => {
  const options = {
    maxSizeMB: 0.5,
    maxWidthOrHeight: 800,
    useWebWorker: true
  };
  return await imageCompression(file, options);
};

// Compress video using ffmpeg.js would require setup, alternatively skip or limit file size
const compressVideo = async (file) => {
  if (file.size > 10 * 1024 * 1024) {
    alert("Video is too large. Please upload under 10MB.");
    return null;
  }
  return file; // or integrate ffmpeg.js if necessary
};

  const fetchOrders = async (pageNum = 1, searchText = '') => {
    try {
      const res = await axiosInstance.get('/drawing-orders', {
        params: { page: pageNum, limit: 10, search: searchText }
      });
      setOrders(res.data.orders);
      setTotalPages(res.data.totalPages);
      setPage(res.data.page);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      setOrders([]);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    fetchOrders(page, search);
  }, [page, search]);
const handleMultipleImageUpload = async (files, orderId) => {
  try {
    setIsUploading(true);
    const uploadedUrls = [];

    for (const file of files) {
      const compressedFile = await compressImage(file);

      const formData = new FormData();
      formData.append('file', compressedFile);
      formData.append('upload_preset', 'upload_drawings_preset');
      formData.append('folder', 'upload_drawings_preset');

      const res = await axios.post('https://api.cloudinary.com/v1_1/dcr8k5amk/auto/upload', formData);
      uploadedUrls.push(res.data.secure_url);
    }

    const existing = orders.find(o => o._id === orderId)?.finishedProductImage || [];
    const updated = [...existing, ...uploadedUrls];

    await handleFieldChange(orderId, 'finishedProductImage', updated);
    toast.success('uploaded!')
  } catch (err) {
    toast.error('Multiple image upload failed:', err);
  } finally {
    setIsUploading(false);
  }
};


const handleFieldChange = async (orderId, field, value) => {
  try {
    const updated = await axiosInstance.put(`/drawing-orders/${orderId}`, { [field]: value });
    setOrders(prev =>
      prev.map(order => (order._id === orderId ? { ...order, [field]: value } : order))
    );
    toast.success('updated')
  } catch (err) {
    toast.error(`Failed to update ${field}:`, err);
  }
};
const handleVideoUpload = async (file, orderId) => {
  try {
        setIsUploading(true); // Show loader
    const compressedVideo = await compressVideo(file);
    if (!compressedVideo) return;

    const data = new FormData();
    data.append('file', compressedVideo);
    data.append('upload_preset', 'upload_drawings_preset');
    data.append('folder', 'upload_drawings_preset');

    const res = await axios.post(`https://api.cloudinary.com/v1_1/dcr8k5amk/video/upload`, data);

const newVideo = {
  url: res.data.secure_url,
  public_id: res.data.public_id,
};

const existingVideos = orders.find(o => o._id === orderId)?.drawingVideo || [];
const updated = [...existingVideos, newVideo];

await handleFieldChange(orderId, 'drawingVideo', updated);

    toast.success('Video uploaded!')
  } catch (err) {
console.error('Video upload failed:', err);
toast.error('Video upload failed!');
  } finally {
    setIsUploading(false); // Hide loader
  }
};

const handleDeleteVideo = async (orderId, publicId) => {
  try {
        setIsDeleting(true); // Show loader
    // 1. Delete from Cloudinary
    await axiosInstance.delete(`/drawing-orders/cloudinary/video/${encodeURIComponent(publicId)}`);

    // 2. Remove the video from the local state (frontend)
    const order = orders.find(o => o._id === orderId);
    const updatedVideos = order.drawingVideo.filter(v => v.public_id !== publicId);

    await handleFieldChange(orderId, 'drawingVideo', updatedVideos);

    toast.success('Video deleted!');
  } catch (err) {
    console.error('Video delete failed:', err);
    toast.error('Failed to delete video');
  } finally {
    setIsDeleting(false); // Hide loader
  }
};

const handleStepUpload = async (file, orderId) => {
  try {
        setIsUploading(true); // Show loader
    const data = new FormData();
    data.append('file', file);
    data.append('upload_preset', 'upload_drawings_preset');
    data.append('folder', 'upload_drawings_preset');

    const res = await axios.post(`https://api.cloudinary.com/v1_1/dcr8k5amk/auto/upload`, data);
    const newFile = { url: res.data.secure_url, public_id: res.data.public_id, resource_type: res.data.resource_type };

    const existingFiles = orders.find(o => o._id === orderId)?.stepFile || [];
    const updatedFiles = [...existingFiles, newFile];

    await handleFieldChange(orderId, 'stepFile', updatedFiles);
    toast.success('STEP file uploaded!');
  } catch (err) {
    toast.error('STEP file upload failed');
    console.error(err);
  } finally {
    setIsUploading(false); // Hide loader
  }
};


const handleStepDelete = async (orderId, public_id) => {
  try {
    setIsDeleting(true);
    await axiosInstance.delete(`/drawing-orders/cloudinary/file/${encodeURIComponent(public_id)}`);

    const order = orders.find(o => o._id === orderId);
    const updated = order.stepFile.filter(file => file.public_id !== public_id);

    await handleFieldChange(orderId, 'stepFile', updated);
    toast.success('Deleted successfully');
  } catch (err) {
    toast.error('Failed to delete file');
    console.error(err);
  } finally {
    setIsDeleting(false);
  }
};


const handleFilePreview = (file) => {
  const isImage = file.url.match(/\.(jpg|jpeg|png|gif|webp)$/i);
  const isVideo = file.url.match(/\.(mp4|webm|ogg)$/i);
  const isOther = !isImage && !isVideo;

  MySwal.fire({
    title: 'Preview',
    html: isImage ? (
      `<img src="${file.url}" class="w-full max-w-[90vw] max-h-[80vh] object-contain rounded shadow" />`
    ) : isVideo ? (
      `<video src="${file.url}" controls class="w-full max-w-[90vw] max-h-[80vh] rounded shadow" autoplay></video>`
    ) : (
      `<a href="${file.url}" target="_blank" class="text-blue-600 underline">Open File</a>`
    ),
    width: '90vw',
    showCloseButton: true,
    showConfirmButton: false,
    customClass: {
      popup: 'bg-white rounded-xl p-4'
    }
  });
};
const handleImagePreview = (imgUrl) => {
  MySwal.fire({
    html: `<img src="${imgUrl}" alt="Preview" style="max-width: 90vw; max-height: 80vh; border-radius: 10px;" />`,
    showCloseButton: true,
    showConfirmButton: false,
    background: '#f9fafb',
    width: 'auto',
    padding: '1rem',
  });
};

const handleFinishedImageDelete = async (orderId, imageUrl) => {
  try {
    setIsDeleting(true);
    
    // Extract public_id from imageUrl
    const publicId = imageUrl
      .split('/')
      .slice(-2)
      .join('/')
      .replace(/\.[^/.]+$/, ""); // remove extension

    // 1. Delete from Cloudinary
    await axiosInstance.delete(`/drawing-orders/cloudinary/file/${encodeURIComponent(publicId)}`);

    // 2. Remove from state & DB
    const order = orders.find(o => o._id === orderId);
    const updated = order.finishedProductImage.filter(url => url !== imageUrl);
    await handleFieldChange(orderId, 'finishedProductImage', updated);

    toast.success('Image deleted!');
  } catch (err) {
    console.error('Failed to delete finished product image:', err);
    toast.error('Failed to delete image');
  } finally {
    setIsDeleting(false);
  }
};

  return (
    <>
      <InternalNavbar />
      {isUploading && (
  <div className="fixed inset-0 z-50 bg-[#000000a1] bg-opacity-50 flex items-center justify-center">
<div className="animate-spin h-10 w-10 border-4 border-teal-500 border-t-transparent rounded-full"></div>
      <p className="text-white font-medium">Uploading file...</p>
  </div>
)}
      {isDeleting && (
  <div className="fixed inset-0 z-50 bg-[#000000a1] bg-opacity-50 flex items-center justify-center">
<div className="animate-spin h-10 w-10 border-4 border-teal-500 border-t-transparent rounded-full"></div>
      <p className="text-white font-medium">Deleting file...</p>
  </div>
)}

      <div className="max-w-full overflow-x-auto p-6 bg-gradient-to-br from-white to-blue-50 min-h-screen transition-all duration-300 ease-in-out">
        <h1 className="text-3xl font-extrabold text-gray-800 mb-6 tracking-tight">My Orders</h1>

        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <input
            type="text"
            placeholder="Search by drawing name or remarks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-400 p-2 rounded-md w-full md:max-w-xs transition-all"
          />

          <div className="flex items-center space-x-3 text-sm">
            <button
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Prev
            </button>
            <span className="font-medium text-gray-600">
              Page <strong>{page}</strong> of {totalPages}
            </span>
            <button
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Next
            </button>
          </div>
        </div>

        <div className="overflow-auto rounded-lg shadow-lg">
          <table className="min-w-[1200px] w-full text-sm border-collapse bg-white rounded-lg">
            <thead className="bg-gray-100 text-gray-700 text-left">
              <tr>
                {[
                  'S. No', 'Date', 'Drawing Name', 'Video of Drawing', 'Margin', 'Shrinkage Allowance',
                  '3D Model (STEP)', 'Customer Remarks', 'Price Quoted', 'Customer Price Status',
                  'Thermo Packers Remarks', 'Status', 'Finished Product Image'
                ].map((header, i) => (
                  <th key={i} className="px-4 py-3 border-b font-semibold">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan="13" className="text-center py-6 text-gray-500">
                    No orders found.
                  </td>
                </tr>
              ) : (
                orders.map((order, index) => (
                  <tr key={order._id} className="hover:bg-gray-50 transition-all">
                    <td className="px-4 py-3 border-b">{index + 1}</td>
                    <td className="px-4 py-3 border-b">{order.date}</td>
<td className="px-4 py-3 border-b">
  {user.role === 'suppliers' && !isSupplierLocked(order) ? (
    <input
      type="text"
      value={order.drawingName || ''}
      onChange={(e) => handleFieldChange(order._id, 'drawingName', e.target.value)}
      className="border p-1 rounded w-40"
    />
  ) : order.drawingName || '—'}
</td>
              <td className="px-4 py-3 border-b min-w-[240px]">
  {user.role === 'suppliers' && !isSupplierLocked(order) && (
    <input
      type="file"
      accept="video/*"
      onChange={(e) => {
        if (e.target.files[0]) handleVideoUpload(e.target.files[0], order._id);
      }}
      className="text-xs mb-2"
    />
  )}
  
  {Array.isArray(order.drawingVideo) && order.drawingVideo.length > 0 ? (
    <div className="flex gap-2 flex-wrap">
      {order.drawingVideo.map((videoObj, idx) => (
        <div key={idx} className="relative w-40">
         <div
  onClick={() => handleFilePreview(videoObj)}
  className="cursor-pointer relative group"
>
  <video
    src={videoObj.url}
    className="w-full h-auto max-h-32 rounded shadow border pointer-events-none"
  />
  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-medium rounded">
    Click to preview
  </div>
</div>

          {user.role === 'suppliers' && !isSupplierLocked(order) && (
            <button
              type="button"
              onClick={() => handleDeleteVideo(order._id, videoObj.public_id)}
              className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center shadow"
            >
              ×
            </button>
          )}
        </div>
      ))}
    </div>
  ) : '—'}
</td>



<td className="px-4 py-3 border-b">
  {user.role === 'suppliers' && !isSupplierLocked(order) ? (
    <input
      type="text"
      value={order.margin || ''}
      onChange={(e) => handleFieldChange(order._id, 'margin', e.target.value)}
      className="border p-1 rounded w-32"
    />
  ) : order.margin || '—'}
</td>
<td className="px-4 py-3 border-b">
  {user.role === 'suppliers' && !isSupplierLocked(order) ? (
    <input
      type="text"
      value={order.shrinkageAllowance || ''}
      onChange={(e) => handleFieldChange(order._id, 'shrinkageAllowance', e.target.value)}
      className="border p-1 rounded w-32"
    />
  ) : order.shrinkageAllowance || '—'}
</td>
             <td className="px-4 py-3 border-b">
  {user.role === 'suppliers' && !isSupplierLocked(order) && (
    <input
      type="file"
      accept="*"
      onChange={(e) => {
        if (e.target.files[0]) handleStepUpload(e.target.files[0], order._id);
      }}
      className="text-xs mb-2"
    />
  )}

  {Array.isArray(order.stepFile) && order.stepFile.length > 0 ? (
    <ul className="flex flex-wrap gap-4">
    {order.stepFile.map((file, idx) => {
  const isVideo = file.url.match(/\.(mp4|webm|ogg)$/i);
  const isImage = file.url.match(/\.(jpg|jpeg|png|gif|webp)$/i);
  return (
    <li
      key={idx}
      className="relative bg-gray-100 rounded-md p-2 shadow-md cursor-pointer"
      onClick={() => handleFilePreview(file)}
    >
      {isVideo ? (
        <video src={file.url} className="w-40 rounded pointer-events-none" />
      ) : isImage ? (
        <img src={file.url} alt={`Preview ${idx + 1}`} className="w-40 rounded pointer-events-none" />
      ) : (
        <div className="text-blue-600 underline">View File {idx + 1}</div>
      )}
      {user.role === 'suppliers' && !isSupplierLocked(order) && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation(); // Prevent triggering preview
            handleStepDelete(order._id, file.public_id);
          }}
          className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center shadow hover:bg-red-700"
        >
          ×
        </button>
      )}
    </li>
  );
})}

    </ul>
  ) : (
    '—'
  )}
</td>



<td className="px-4 py-3 border-b">
  {user.role === 'suppliers' && !isSupplierLocked(order) ? (
    <textarea
      value={order.customerRemarks || ''}
      onChange={(e) => handleFieldChange(order._id, 'customerRemarks', e.target.value)}
      className="border p-1 rounded w-40"
    />
  ) : order.customerRemarks || '—'}
</td>
<td className="px-3 py-2 border">
  {user.role === 'accounts' ? (
    <input
      type="text"
      value={order.priceQuoted || ''}
      onChange={(e) => handleFieldChange(order._id, 'priceQuoted', e.target.value)}
      className="border p-1 rounded w-28"
    />
  ) : (
    order.priceQuoted || '—'
  )}
</td>

                <td className="px-4 py-3 border-b">
  {user.role === 'suppliers' ? (
    order.priceQuoted ? (
      <select
        value={order.priceConfirmedStatus || ''}
        onChange={(e) => handleFieldChange(order._id, 'priceConfirmedStatus', e.target.value)}
        className="border p-1 rounded w-40"
        disabled={order.priceConfirmedStatus === 'confirmed'} // Disable if already confirmed
      >
        <option value="">Select</option>
        <option value="confirmed">✅ Confirm as per Quotated Price</option>
        <option value="not_confirmed">❌ Not Confirm as per Quotated Price</option>
        <option value="high">⚠️ Price is High as per Quotated Price</option>
      </select>
    ) : (
      <span className="italic text-gray-500">Quote pending</span>
    )
  ) : (
    order.priceConfirmedStatus === 'confirmed'
      ? '✅ Confirmed'
      : order.priceConfirmedStatus === 'not_confirmed'
      ? '❌ Not Confirmed'
      : order.priceConfirmedStatus === 'high'
      ? '⚠️ Price is High'
      : '—'
  )}
</td>


<td className="px-4 py-3 border-b">
  {user.role === 'accounts' ? (
    <textarea
      value={order.thermoRemarks || ''}
      onChange={(e) => handleFieldChange(order._id, 'thermoRemarks', e.target.value)}
      className="border p-1 rounded w-40"
    />
  ) : order.thermoRemarks || '—'}
</td>
                 <td className="px-4 py-3 border-b">
  {user.role === 'accounts' ? (
    <select
      value={order.status || ''}
      onChange={(e) => handleFieldChange(order._id, 'status', e.target.value)}
      className="border p-1 rounded w-40"
    >
      <option value="">Select</option>
      <option value="not_processed">Not Processed</option>
      <option value="in_process">In Process</option>
      <option value="ready_to_dispatch">Ready to Dispatch</option>
    </select>
  ) : (
    order.status === 'not_processed'
      ? 'Not Processed'
      : order.status === 'in_process'
      ? 'In Process'
      : order.status === 'ready_to_dispatch'
      ? 'Ready to Dispatch'
      : '—'
  )}
</td>

          <td className="px-4 py-3 border-b">
  {user.role === 'accounts' ? (
    <div className="flex flex-col gap-2">
      {Array.isArray(order.finishedProductImage) && order.finishedProductImage.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {order.finishedProductImage.map((img, idx) => (
            <div key={idx} className="relative cursor-pointer" onClick={() => handleImagePreview(img)}>
              <img
                src={img}
                alt={`Finished ${idx + 1}`}
                className="w-20 h-16 object-cover rounded border"
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation(); // prevent preview when clicking delete
                  handleFinishedImageDelete(order._id, img);
                }}
                className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center shadow hover:bg-red-700"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      ) : (
        <span className="text-gray-500">No images</span>
      )}
      <input
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => {
          const files = Array.from(e.target.files);
          if (files.length > 0) handleMultipleImageUpload(files, order._id);
        }}
        className="text-xs"
      />
    </div>
  ) : (
    Array.isArray(order.finishedProductImage) && order.finishedProductImage.length > 0 ? (
      <div className="flex flex-wrap gap-2">
        {order.finishedProductImage.map((img, idx) => (
          <img
            key={idx}
            src={img}
            alt={`Finished ${idx + 1}`}
            className="w-20 h-16 object-cover rounded border cursor-pointer"
            onClick={() => handleImagePreview(img)}
          />
        ))}
      </div>
    ) : '—'
  )}
</td>





                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default DrawingOrdersTable;
