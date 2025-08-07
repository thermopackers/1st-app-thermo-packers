import React, { useState } from 'react';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import InternalNavbar from './InternalNavbar';
import axiosInstance from '../axiosInstance';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const DrawingUploadForm = () => {
  const [formData, setFormData] = useState({
  date: new Date().toISOString().split("T")[0],
    drawingName: '',
    drawingVideo: [],
    margin: '',
    shrinkageAllowance: '',
    stepFile: [],
    customerRemarks: '',
  });

  const [uploading, setUploading] = useState(false);
const navigate=useNavigate();
const handleUpload = async (file, folder) => {
  const data = new FormData();
  data.append('file', file);
  data.append('upload_preset', "upload_drawings_preset");
  data.append('folder', folder);

  setUploading(true);
  try {
    const res = await axios.post(
      `https://api.cloudinary.com/v1_1/dcr8k5amk/auto/upload`,
      data
    );

    return {
      url: res.data.secure_url,
      public_id: res.data.public_id
    };
  } catch (err) {
    console.error('Upload failed:', err);
    return null;
  } finally {
    setUploading(false);
  }
};

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

const handleMultipleFilesChange = async (e, fieldName, folderName) => {
  const files = e.target.files;
  if (!files.length) return;

  setUploading(true);
  try {
    const uploads = [];
    for (let file of files) {
      const uploaded = await handleUpload(file, folderName);
      if (uploaded) uploads.push(uploaded);
    }

    setFormData(prev => ({
      ...prev,
      [fieldName]: [...prev[fieldName], ...uploads],
    }));
  } catch (err) {
    console.error('Error uploading files:', err);
  } finally {
    setUploading(false);
  }
};


  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axiosInstance.post('/drawing-orders', formData);
      console.log('Saved:', res.data);
      toast.success('Order submitted successfully!');
      navigate('/drawing-orders-table');
      setFormData({
        date: '',
        drawingName: '',
        drawingVideo: [],
        margin: '',
        shrinkageAllowance: '',
        stepFile: [],
        customerRemarks: '',
      });
    } catch (error) {
      console.error('Failed to submit order:', error);
      toast.error('Submission failed');
    }
  };

  return (
    <>
      <InternalNavbar />
      {uploading && (
  <div className="fixed inset-0 z-50 bg-[#000000b4] bg-opacity-50 flex items-center justify-center">
    <div className="text-center">
      <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-white text-lg font-semibold">Uploading files, please wait...</p>
    </div>
  </div>
)}

      <div className="max-w-4xl mx-auto px-6 py-8 bg-white shadow-xl rounded-2xl mt-6 mb-10 transition-all duration-300">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 tracking-tight">Drawing & Order Submission</h1>
        <form onSubmit={handleSubmit} className="space-y-8">

          {/* Date & Drawing Name */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold mb-1">Date</label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className="border border-gray-300 focus:ring-2 focus:ring-blue-500 p-3 rounded-md w-full"
                disabled
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1">Drawing Name</label>
              <input
                type="text"
                name="drawingName"
                placeholder="Enter drawing name"
                value={formData.drawingName}
                onChange={handleChange}
                className="border border-gray-300 focus:ring-2 focus:ring-blue-500 p-3 rounded-md w-full"
                required
              />
            </div>
          </div>

          {/* Drawing Videos */}
          <div>
            <label className="block text-sm font-semibold mb-1">Upload Drawing Video(s)</label>
            <input
              type="file"
              accept="video/*"
              multiple
              onChange={(e) => handleMultipleFilesChange(e, 'drawingVideo', 'drawing_videos')}
              className="mb-2"
              required
            />
            {formData.drawingVideo.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-4">
             {formData.drawingVideo.map((video, idx) => (
  <div key={idx} className="relative w-36">
    <video src={video.url} controls className="w-full rounded shadow-lg" />
    <button
      type="button"
      onClick={() => {
        setFormData(prev => ({
          ...prev,
          drawingVideo: prev.drawingVideo.filter((_, i) => i !== idx)
        }));
      }}
      className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 text-xs flex items-center justify-center shadow hover:bg-red-700"
    >
      ×
    </button>
  </div>
))}

              </div>
            )}
          </div>

          {/* Margin & Shrinkage */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold mb-1">Margin</label>
              <input
                name="margin"
                placeholder="e.g. 5 mm"
                value={formData.margin}
                onChange={handleChange}
                required
                className="border border-gray-300 focus:ring-2 focus:ring-blue-500 p-3 rounded-md w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1">Shrinkage Allowance</label>
              <input
                name="shrinkageAllowance"
                placeholder="e.g. 2%"
                value={formData.shrinkageAllowance}
                onChange={handleChange}
                required
                className="border border-gray-300 focus:ring-2 focus:ring-blue-500 p-3 rounded-md w-full"
              />
            </div>
          </div>

          {/* STEP File Upload */}
          <div>
            <label className="block text-sm font-semibold mb-1">Upload STEP or 3D Model File(s)</label>
            <input
              type="file"
              multiple
              onChange={(e) => handleMultipleFilesChange(e, 'stepFile', 'step_models')}
              className="mb-2"
              required
            />
            {formData.stepFile.length > 0 && (
              <ul className="mt-3 flex flex-wrap gap-6">
             {formData.stepFile.map((file, idx) => {
  const fileUrl = typeof file === 'string' ? file : file.url;
  const isVideo = fileUrl.match(/\.(mp4|webm|ogg)$/i);
  const isImage = fileUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i);

  return (
    <li
      key={idx}
      className="relative border bg-blue-50 px-4 py-3 rounded-lg shadow-md w-fit max-w-xs"
    >
      <a
        href={fileUrl}
        target="_blank"
        rel="noreferrer"
        className="block underline text-blue-700 font-medium mb-2"
      >
        View File {idx + 1}
      </a>
      {isVideo ? (
        <video src={fileUrl} controls className="w-40 rounded shadow" />
      ) : isImage ? (
        <img src={fileUrl} alt={`Preview ${idx + 1}`} className="w-40 rounded shadow" />
      ) : (
        <p className="text-gray-500 italic">Preview not available</p>
      )}
      <button
        type="button"
        onClick={() => {
          setFormData(prev => ({
            ...prev,
            stepFile: prev.stepFile.filter((_, i) => i !== idx)
          }));
        }}
        className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center shadow hover:bg-red-700"
      >
        ×
      </button>
    </li>
  );
})}

              </ul>
            )}
          </div>

          {/* Customer Remarks */}
          <div>
            <label className="block text-sm font-semibold mb-1">Remarks by Customer</label>
            <textarea
              name="customerRemarks"
              placeholder="Enter any notes or instructions"
              value={formData.customerRemarks}
              onChange={handleChange}
              className="w-full border border-gray-300 focus:ring-2 focus:ring-blue-500 p-3 rounded-md min-h-[100px]"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={uploading}
            className={`w-full p-3 rounded-md text-white font-semibold text-lg transition-all ${
              uploading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {uploading ? 'Uploading...' : 'Submit Order'}
          </button>
        </form>
      </div>
    </>
  );
};

export default DrawingUploadForm;
