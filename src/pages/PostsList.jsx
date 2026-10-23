import React, { useState, useEffect } from 'react';
import axiosInstance from "../axiosInstance";
import { useNavigate } from "react-router-dom";
import InternalNavbar from "../components/InternalNavbar";
import toast from "react-hot-toast";
import { format } from 'date-fns';
import { Search, Filter, ChevronLeft, ChevronRight, X } from 'lucide-react';

export default function PostsList() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    pages: 1
  });
  const [filters, setFilters] = useState({
    search: '',
    postType: '',
    category: '',
    status: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [postCategories, setPostCategories] = useState([]);

  // 🆕 Media preview modal state
  const [activePost, setActivePost] = useState(null);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);

  // Load categories
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await axiosInstance.get("/posts/settings/categories");
        setPostCategories(res.data.categories || []);
      } catch (err) {
        console.error("Failed to load categories", err);
      }
    };
    loadCategories();
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [pagination.page, filters]);

  // 🆕 Close modal on Esc
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') closeModal();
      if (!activePost) return;
      if (e.key === 'ArrowRight') nextMedia();
      if (e.key === 'ArrowLeft') prevMedia();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activePost, activeMediaIndex]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', pagination.page);
      params.set('limit', pagination.limit);
      if (filters.search) params.set('search', filters.search);
      if (filters.postType) params.set('postType', filters.postType);
      if (filters.category) params.set('category', filters.category);
      if (filters.status) params.set('status', filters.status);

      const res = await axiosInstance.get(`/posts?${params.toString()}`);
      setPosts(res.data.posts || []);
      setPagination({
        page: res.data.page || 1,
        limit: res.data.limit || 12,
        total: res.data.total || 0,
        pages: res.data.pages || 1
      });
    } catch (err) {
      toast.error("Failed to load posts");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this post?")) return;
    try {
      await axiosInstance.delete(`/posts/${id}`);
      toast.success("Post deleted");
      fetchPosts();
    } catch (err) {
      toast.error("Failed to delete post");
    }
  };

  // 🆕 Modal open/close
  const openModal = (post, index = 0) => {
    setActivePost(post);
    setActiveMediaIndex(index);
  };
  const closeModal = () => {
    setActivePost(null);
    setActiveMediaIndex(0);
  };
  const nextMedia = () => {
    if (!activePost) return;
    setActiveMediaIndex((i) =>
      i + 1 < activePost.mediaUrls.length ? i + 1 : i
    );
  };
  const prevMedia = () => {
    if (!activePost) return;
    setActiveMediaIndex((i) => (i - 1 >= 0 ? i - 1 : i));
  };

  const getMediaPreview = (post) => {
    if (!post.mediaUrls || post.mediaUrls.length === 0) return null;
    const firstMedia = post.mediaUrls[0];
    const firstType = post.mediaTypes?.[0] || 'image';

    if (firstType === 'image') {
      return (
        <div
          className="cursor-pointer"
          onClick={() => openModal(post, 0)}
          title="Click to view"
        >
          <img
            src={firstMedia}
            alt={post.title}
            className="w-full h-32 object-cover rounded-lg"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://via.placeholder.com/300x200?text=Media';
            }}
          />
        </div>
      );
    } else if (firstType === 'video') {
      return (
        <div
          className="relative w-full h-32 bg-black rounded-lg overflow-hidden cursor-pointer group"
          onClick={() => openModal(post, 0)}
          title="Click to play"
        >
          {/* 🆕 real video thumbnail (muted, no controls, pointer-events-none so click bubbles to wrapper) */}
          <video
            src={firstMedia}
            className="w-full h-32 object-cover pointer-events-none"
            muted
            playsInline
            preload="metadata"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/50 transition">
            <span className="text-white text-4xl drop-shadow-lg">▶️</span>
          </div>
        </div>
      );
    } else if (firstType === 'pdf') {
      return (
        <div
          className="w-full h-32 bg-red-50 flex flex-col items-center justify-center rounded-lg cursor-pointer border border-red-100"
          onClick={() => openModal(post, 0)}
          title="Click to view PDF"
        >
          <span className="text-4xl">📄</span>
          <span className="text-xs text-red-600 mt-1">PDF</span>
        </div>
      );
    }

    return (
      <div
        className="w-full h-32 bg-gray-200 flex items-center justify-center rounded-lg cursor-pointer"
        onClick={() => openModal(post, 0)}
        title="Click to view"
      >
        <span className="text-4xl">📎</span>
      </div>
    );
  };

  const getCategoryLabel = (post) => {
    if (post.categoryName) return post.categoryName;
    if (post.category && typeof post.category === 'object' && post.category.name) {
      return post.category.name;
    }
    return null;
  };

  if (loading && posts.length === 0) {
    return (
      <>
        <InternalNavbar />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </>
    );
  }

  // 🆕 Render current media inside the modal
  const renderActiveMedia = () => {
    if (!activePost) return null;
    const url = activePost.mediaUrls[activeMediaIndex];
    const type = activePost.mediaTypes?.[activeMediaIndex] || 'image';

    if (type === 'video') {
      return (
        <video
          key={url}
          src={url}
          controls
          autoPlay
          playsInline
          className="max-h-[80vh] max-w-[90vw] rounded-lg bg-black"
        />
      );
    }
    if (type === 'image') {
      return (
        <img
          key={url}
          src={url}
          alt={activePost.title}
          className="max-h-[80vh] max-w-[90vw] rounded-lg object-contain bg-black"
        />
      );
    }
    if (type === 'pdf') {
      return (
        <iframe
          key={url}
          src={url}
          title="PDF preview"
          className="w-[90vw] h-[80vh] rounded-lg bg-white"
        />
      );
    }
    return (
      <div className="bg-white rounded-lg p-6 text-center">
        <p className="mb-3">Preview not available</p>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 underline"
        >
          Open / download file
        </a>
      </div>
    );
  };

  return (
    <>
      <InternalNavbar />

      <div className="max-w-7xl mx-auto p-4 md:p-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">📱 Posts & Reels</h1>
            <p className="text-gray-600 text-sm mt-1">
              Total: {pagination.total} posts • Page {pagination.page} of {pagination.pages}
            </p>
          </div>

          <button
            onClick={() => navigate('/posts/new')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <span className="text-xl">+</span>
            Create New Post
          </button>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl border p-4 mb-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => {
                  setFilters(prev => ({ ...prev, search: e.target.value }));
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
                placeholder="Search posts..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="md:hidden flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg"
            >
              <Filter className="w-4 h-4" />
              Filters
            </button>

            <button
              onClick={fetchPosts}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Search
            </button>
          </div>

          <div className={`mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 ${showFilters ? 'block' : 'hidden md:grid'}`}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={filters.postType}
                onChange={(e) => {
                  setFilters(prev => ({ ...prev, postType: e.target.value }));
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">All Types</option>
                <option value="post">📝 Posts</option>
                <option value="reel">🎬 Reels</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => {
                  setFilters(prev => ({ ...prev, status: e.target.value }));
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
                <option value="">All Status</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={filters.category}
                onChange={(e) => {
                  setFilters(prev => ({ ...prev, category: e.target.value }));
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">All Categories</option>
                {postCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Posts Grid */}
        {posts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border">
            <p className="text-gray-500 mb-4">No posts found</p>
            <button
              onClick={() => navigate('/posts/new')}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Create Your First Post
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {posts.map(post => (
              <div key={post._id} className="bg-white rounded-xl border shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                {/* Media Preview */}
                <div className="relative">
                  {getMediaPreview(post)}
                  <div className="absolute top-2 right-2 flex gap-1 pointer-events-none">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      post.postType === 'reel'
                        ? 'bg-purple-500 text-white'
                        : 'bg-blue-500 text-white'
                    }`}>
                      {post.postType === 'reel' ? '🎬' : '📝'}
                    </span>
                  </div>
                  <div className="absolute bottom-2 left-2 pointer-events-none">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      post.status === 'published' ? 'bg-green-500 text-white' :
                      post.status === 'draft' ? 'bg-yellow-500 text-white' :
                      'bg-gray-500 text-white'
                    }`}>
                      {post.status}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-3">
                  <h3 className="font-medium text-gray-900 truncate">{post.title}</h3>
                  {getCategoryLabel(post) && (
                    <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full inline-block mt-1">
                      {getCategoryLabel(post)}
                    </span>
                  )}
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                    {post.description || 'No description'}
                  </p>

                  <div className="flex items-center justify-between mt-3 pt-2 border-t text-xs text-gray-500">
                    <span>{post.mediaUrls?.length || 0} media files</span>
                    <span>{format(new Date(post.createdAt), 'dd/MM/yyyy')}</span>
                  </div>

                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => openModal(post, 0)}
                      className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm"
                      title="Preview media"
                    >
                      👁
                    </button>
                    <button
                      onClick={() => navigate(`/posts/edit/${post._id}`)}
                      className="flex-1 text-center px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(post._id)}
                      className="px-3 py-1.5 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="mt-6 flex justify-center items-center gap-2">
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              disabled={pagination.page === 1}
              className="p-2 rounded border disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm">
              Page {pagination.page} of {pagination.pages}
            </span>
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              disabled={pagination.page === pagination.pages}
              className="p-2 rounded border disabled:opacity-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* 🆕 MEDIA PREVIEW MODAL (lightbox) */}
      {activePost && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={closeModal}
        >
          <div
            className="relative flex flex-col items-center max-w-[95vw]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="w-full flex items-center justify-between mb-2 text-white">
              <div className="truncate pr-4">
                <h3 className="font-semibold truncate">{activePost.title}</h3>
                {activePost.mediaUrls.length > 1 && (
                  <p className="text-xs text-gray-300">
                    {activeMediaIndex + 1} / {activePost.mediaUrls.length}
                  </p>
                )}
              </div>
              <button
                onClick={closeModal}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-full"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Media */}
            <div className="relative flex items-center justify-center">
              {activePost.mediaUrls.length > 1 && (
                <button
                  onClick={prevMedia}
                  disabled={activeMediaIndex === 0}
                  className="absolute left-2 z-10 p-2 bg-white/20 hover:bg-white/40 rounded-full disabled:opacity-30"
                  aria-label="Previous"
                >
                  <ChevronLeft className="w-6 h-6 text-white" />
                </button>
              )}

              {renderActiveMedia()}

              {activePost.mediaUrls.length > 1 && (
                <button
                  onClick={nextMedia}
                  disabled={activeMediaIndex === activePost.mediaUrls.length - 1}
                  className="absolute right-2 z-10 p-2 bg-white/20 hover:bg-white/40 rounded-full disabled:opacity-30"
                  aria-label="Next"
                >
                  <ChevronRight className="w-6 h-6 text-white" />
                </button>
              )}
            </div>

            {/* Thumbnails strip for multiple media */}
            {activePost.mediaUrls.length > 1 && (
              <div className="mt-3 flex gap-2 overflow-x-auto max-w-full">
                {activePost.mediaUrls.map((url, i) => {
                  const t = activePost.mediaTypes?.[i] || 'image';
                  return (
                    <button
                      key={i}
                      onClick={() => setActiveMediaIndex(i)}
                      className={`w-16 h-16 rounded border-2 flex items-center justify-center overflow-hidden flex-shrink-0 ${
                        i === activeMediaIndex ? 'border-blue-500' : 'border-white/30'
                      }`}
                    >
                      {t === 'image' ? (
                        <img src={url} className="w-full h-full object-cover" alt="" />
                      ) : t === 'video' ? (
                        <span className="text-2xl">🎬</span>
                      ) : (
                        <span className="text-2xl">📄</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}