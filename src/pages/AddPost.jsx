import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from "../axiosInstance";
import InternalNavbar from "../components/InternalNavbar";
import toast from "react-hot-toast";
import { useUserContext } from "../context/UserContext";

export default function AddPost() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useUserContext();
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    mediaUrls: [],
    mediaTypes: [],
    postType: "post",
    duration: 0,
    category: "",
    status: "draft",
    tags: [],
    scheduledPublishDate: ""
  });

  const [mediaFiles, setMediaFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(isEdit);

  // Load post data if editing
  useEffect(() => {
    if (isEdit) {
      fetchPost();
    }
  }, [id]);

  const fetchPost = async () => {
    try {
      const res = await axiosInstance.get(`/posts/${id}`);
      const post = res.data.post;
      setFormData({
        title: post.title || "",
        description: post.description || "",
        mediaUrls: post.mediaUrls || [],
        mediaTypes: post.mediaTypes || [],
        postType: post.postType || "post",
        duration: post.duration || 0,
        category: post.category || "",
        status: post.status || "draft",
        tags: post.tags || [],
        scheduledPublishDate: post.scheduledPublishDate ? post.scheduledPublishDate.split('T')[0] : ""
      });
    } catch (err) {
      toast.error("Failed to load post");
      navigate("/posts");
    } finally {
      setLoading(false);
    }
  };

  const uploadToCloudinary = async (files) => {
    const uploads = files.map(async (file) => {
      const data = new FormData();
      data.append("file", file);
      data.append("upload_preset", "todo_uploads");
      data.append("cloud_name", "dcr8k5amk");

      const res = await fetch("https://api.cloudinary.com/v1_1/dcr8k5amk/upload", {
        method: "POST",
        body: data,
      });

      const result = await res.json();
      return {
        url: result.secure_url,
        type: file.type.startsWith("image/") ? "image" : 
              file.type.startsWith("video/") ? "video" : 
              file.type === "application/pdf" ? "pdf" : "document"
      };
    });

    return Promise.all(uploads);
  };

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    try {
      const uploaded = await uploadToCloudinary(files);
      
      setFormData(prev => ({
        ...prev,
        mediaUrls: [...prev.mediaUrls, ...uploaded.map(u => u.url)],
        mediaTypes: [...prev.mediaTypes, ...uploaded.map(u => u.type)]
      }));

      toast.success(`${uploaded.length} file(s) uploaded successfully`);
    } catch (err) {
      toast.error("Failed to upload files");
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const removeMedia = (index) => {
    setFormData(prev => ({
      ...prev,
      mediaUrls: prev.mediaUrls.filter((_, i) => i !== index),
      mediaTypes: prev.mediaTypes.filter((_, i) => i !== index)
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTagChange = (e) => {
    const tags = e.target.value.split(',').map(t => t.trim()).filter(t => t);
    setFormData(prev => ({ ...prev, tags }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error("Title is required");
      return;
    }

    if (formData.mediaUrls.length === 0) {
      toast.error("At least one media file is required");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        title: formData.title.trim(),
        tags: formData.tags,
        createdBy: user?._id
      };

      let response;
      if (isEdit) {
        response = await axiosInstance.put(`/posts/${id}`, payload);
        toast.success("Post updated successfully");
      } else {
        response = await axiosInstance.post("/posts", payload);
        toast.success("Post created successfully");
      }

      navigate("/posts");
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to save post");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <>
        <InternalNavbar />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </>
    );
  }

  return (
    <>
      <InternalNavbar />
      
      <div className="max-w-4xl mx-auto p-4 md:p-6">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => navigate('/posts')}
              className="text-gray-600 hover:text-gray-800"
            >
              ↩️ Back
            </button>
            <h1 className="text-2xl font-bold text-gray-800">
              {isEdit ? '✏️ Edit Post' : '📱 Create New Post'}
            </h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label className="block mb-2 font-medium text-gray-700">Title *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-400"
                placeholder="Enter post title..."
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block mb-2 font-medium text-gray-700">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-400"
                placeholder="Enter description..."
                rows={3}
              />
            </div>

            {/* Media Upload */}
            <div>
              <label className="block mb-2 font-medium text-gray-700">Media Files *</label>
              <input
                type="file"
                accept="image/*,video/*,.pdf"
                multiple
                onChange={handleFileChange}
                disabled={uploading}
                className="w-full px-4 py-2 border border-gray-300 rounded-md"
              />
              {uploading && (
                <p className="text-sm text-blue-600 mt-1">Uploading files...</p>
              )}
              
              {formData.mediaUrls.length > 0 && (
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                  {formData.mediaUrls.map((url, index) => (
                    <div key={index} className="relative border rounded-lg p-2 bg-gray-50">
                      {formData.mediaTypes[index] === 'image' ? (
                        <img 
                          src={url} 
                          alt={`Media ${index + 1}`}
                          className="w-full h-24 object-cover rounded"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://via.placeholder.com/150?text=Image';
                          }}
                        />
                      ) : formData.mediaTypes[index] === 'video' ? (
                        <div className="w-full h-24 bg-gray-800 flex items-center justify-center rounded">
                          <span className="text-white text-3xl">🎬</span>
                        </div>
                      ) : (
                        <div className="w-full h-24 bg-gray-200 flex items-center justify-center rounded">
                          <span className="text-3xl">📄</span>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => removeMedia(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Post Type */}
            <div>
              <label className="block mb-2 font-medium text-gray-700">Post Type</label>
              <select
                name="postType"
                value={formData.postType}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-400"
              >
                <option value="post">📝 Post</option>
                <option value="reel">🎬 Reel</option>
              </select>
            </div>

            {/* Duration (for reels) */}
            {formData.postType === 'reel' && (
              <div>
                <label className="block mb-2 font-medium text-gray-700">Duration (seconds)</label>
                <input
                  type="number"
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-400"
                  placeholder="e.g., 30"
                />
              </div>
            )}

            {/* Category */}
            <div>
              <label className="block mb-2 font-medium text-gray-700">Category</label>
              <input
                type="text"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-400"
                placeholder="e.g., Product, Promotional, Educational"
              />
            </div>

            {/* Tags */}
            <div>
              <label className="block mb-2 font-medium text-gray-700">Tags (comma separated)</label>
              <input
                type="text"
                value={formData.tags.join(', ')}
                onChange={handleTagChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-400"
                placeholder="e.g., new product, sale, diwali"
              />
            </div>

            {/* Status */}
            <div>
              <label className="block mb-2 font-medium text-gray-700">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-400"
              >
                <option value="draft">📝 Draft</option>
                <option value="published">✅ Published</option>
                <option value="archived">📦 Archived</option>
              </select>
            </div>

            {/* Scheduled Publish Date */}
            <div>
              <label className="block mb-2 font-medium text-gray-700">Scheduled Publish Date</label>
              <input
                type="date"
                name="scheduledPublishDate"
                value={formData.scheduledPublishDate}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-400"
              />
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-4 pt-4 border-t">
              <button
                type="button"
                onClick={() => navigate('/posts')}
                className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || uploading}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? 'Saving...' : isEdit ? '💾 Update Post' : '✅ Create Post'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}