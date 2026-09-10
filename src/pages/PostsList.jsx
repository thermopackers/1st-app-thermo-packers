import React, { useState, useEffect } from 'react';
import axiosInstance from "../axiosInstance";
import { useNavigate } from "react-router-dom";
import InternalNavbar from "../components/InternalNavbar";
import toast from "react-hot-toast";
import { format } from 'date-fns';
import { Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';

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
    status: 'published'
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, [pagination.page, filters]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        ...(filters.search && { search: filters.search }),
        ...(filters.postType && { postType: filters.postType }),
        ...(filters.category && { category: filters.category }),
        ...(filters.status && { status: filters.status })
      });

      const res = await axiosInstance.get(`/posts?${params}`);
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

  const getMediaPreview = (post) => {
    if (!post.mediaUrls || post.mediaUrls.length === 0) return null;
    const firstMedia = post.mediaUrls[0];
    const firstType = post.mediaTypes?.[0] || 'image';
    
    if (firstType === 'image') {
      return (
        <img 
          src={firstMedia} 
          alt={post.title}
          className="w-full h-32 object-cover rounded-lg"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = 'https://via.placeholder.com/300x200?text=Media';
          }}
        />
      );
    } else if (firstType === 'video') {
      return (
        <div className="w-full h-32 bg-gray-800 flex items-center justify-center rounded-lg">
          <span className="text-white text-4xl">🎬</span>
        </div>
      );
    }
    return (
      <div className="w-full h-32 bg-gray-200 flex items-center justify-center rounded-lg">
        <span className="text-4xl">📄</span>
      </div>
    );
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
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value, page: 1 }))}
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
                onChange={(e) => setFilters(prev => ({ ...prev, postType: e.target.value, page: 1 }))}
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
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value, page: 1 }))}
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
              <input
                type="text"
                value={filters.category}
                onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value, page: 1 }))}
                placeholder="Filter by category..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
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
                  <div className="absolute top-2 right-2 flex gap-1">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      post.postType === 'reel' 
                        ? 'bg-purple-500 text-white' 
                        : 'bg-blue-500 text-white'
                    }`}>
                      {post.postType === 'reel' ? '🎬' : '📝'}
                    </span>
                  </div>
                  <div className="absolute bottom-2 left-2">
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
                  {post.category && (
                    <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full inline-block mt-1">
                      {post.category}
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
    </>
  );
}