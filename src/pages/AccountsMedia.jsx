import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../axiosInstance';
import Swal from 'sweetalert2';
import { motion, AnimatePresence } from 'framer-motion';
import '../index.css';

// Cloudinary configuration
const CLOUDINARY_CLOUD_NAME = 'dcr8k5amk';
const CLOUDINARY_UPLOAD_PRESET = 'accounts_media'; // You need to create this in Cloudinary

const AccountsMedia = () => {
  const navigate = useNavigate();
  const [mediaItems, setMediaItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [mediaType, setMediaType] = useState('all'); // 'all', 'ppt', 'video'
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [playbackInterval, setPlaybackInterval] = useState(null);
  const videoRef = useRef(null);
  const iframeRef = useRef(null);
  const fullscreenRef = useRef(null);

  // Fetch media items from backend
  useEffect(() => {
    fetchMediaItems();
  }, []);

  const fetchMediaItems = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axiosInstance.get('/accounts/media', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMediaItems(res.data || []);
    } catch (err) {
      console.error('Failed to fetch media items:', err);
      Swal.fire({
        title: 'Error',
        text: 'Failed to load media items',
        icon: 'error',
        confirmButtonColor: '#2563eb',
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle file upload to Cloudinary
  const handleFileUpload = async (file) => {
    setUploading(true);
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    formData.append('folder', 'accounts_media');

    // Determine resource type
    const fileType = file.type;
    let resourceType = 'auto';
    if (fileType.includes('video')) {
      resourceType = 'video';
    } else if (fileType.includes('pdf') || fileType.includes('ppt') || fileType.includes('pptx')) {
      resourceType = 'auto';
    }

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );
      const data = await response.json();

      if (data.secure_url) {
        // Save media info to your backend
        const mediaData = {
          url: data.secure_url,
          publicId: data.public_id,
          type: fileType.includes('video') ? 'video' : 'ppt',
          name: file.name,
          size: file.size,
          format: file.type,
        };

        const token = localStorage.getItem('token');
        const saveRes = await axiosInstance.post('/accounts/media', mediaData, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setMediaItems([saveRes.data, ...mediaItems]);
        Swal.fire({
          title: 'Success!',
          text: 'Media uploaded successfully',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false,
        });
      }
    } catch (err) {
      console.error('Upload error:', err);
      Swal.fire({
        title: 'Upload Failed',
        text: 'Failed to upload file',
        icon: 'error',
        confirmButtonColor: '#2563eb',
      });
    } finally {
      setUploading(false);
    }
  };

  // Handle file selection
  const handleFileSelect = (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      const file = files[0];
      // Validate file type
      const validTypes = ['video/mp4', 'video/webm', 'video/ogg', 'application/pdf', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'];
      if (!validTypes.includes(file.type)) {
        Swal.fire({
          title: 'Invalid File',
          text: 'Please upload PPT or video files only',
          icon: 'warning',
          confirmButtonColor: '#2563eb',
        });
        return;
      }
      handleFileUpload(file);
    }
  };

  // Play media in loop
  const startLoopPlayback = () => {
    if (mediaItems.length === 0) return;

    setIsPlaying(true);
    let index = 0;
    
    // Clear any existing interval
    if (playbackInterval) {
      clearInterval(playbackInterval);
    }

    // Start with first item
    setSelectedMedia(mediaItems[0]);
    setCurrentIndex(0);

    // Set interval to change media
    const interval = setInterval(() => {
      index = (index + 1) % mediaItems.length;
      setSelectedMedia(mediaItems[index]);
      setCurrentIndex(index);
      
      // Reset video if it's a video
      if (videoRef.current && mediaItems[index].type === 'video') {
        videoRef.current.load();
        videoRef.current.play();
      }
    }, 10000); // Change every 10 seconds

    setPlaybackInterval(interval);
  };

  // Stop loop playback
  const stopLoopPlayback = () => {
    if (playbackInterval) {
      clearInterval(playbackInterval);
      setPlaybackInterval(null);
    }
    setIsPlaying(false);
  };

  // Toggle fullscreen
  const toggleFullScreen = () => {
    if (!isFullScreen) {
      if (fullscreenRef.current) {
        if (fullscreenRef.current.requestFullscreen) {
          fullscreenRef.current.requestFullscreen();
        } else if (fullscreenRef.current.webkitRequestFullscreen) {
          fullscreenRef.current.webkitRequestFullscreen();
        } else if (fullscreenRef.current.msRequestFullscreen) {
          fullscreenRef.current.msRequestFullscreen();
        }
        setIsFullScreen(true);
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
      setIsFullScreen(false);
    }
  };

  // Handle fullscreen change event
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      if (playbackInterval) {
        clearInterval(playbackInterval);
      }
    };
  }, []);

  // Delete media item
  const deleteMedia = async (id) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'This will permanently delete this media item',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it!',
    });

    if (result.isConfirmed) {
      try {
        const token = localStorage.getItem('token');
        await axiosInstance.delete(`/accounts/media/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMediaItems(mediaItems.filter(item => item._id !== id));
        if (selectedMedia?._id === id) {
          setSelectedMedia(null);
        }
        Swal.fire({
          title: 'Deleted!',
          text: 'Media item has been deleted',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false,
        });
      } catch (err) {
        console.error('Delete error:', err);
        Swal.fire({
          title: 'Error',
          text: 'Failed to delete media',
          icon: 'error',
          confirmButtonColor: '#2563eb',
        });
      }
    }
  };

  // Filter media based on type
  const filteredMedia = mediaItems.filter(item => {
    if (mediaType === 'all') return true;
    return item.type === mediaType;
  });

  // Render media player based on type
  const renderMediaPlayer = (media) => {
    if (!media) return (
      <div className="flex items-center justify-center h-96 bg-gray-100 rounded-xl">
        <p className="text-gray-500">Select a media item to play</p>
      </div>
    );

    const isVideo = media.type === 'video';
    const isPPT = media.type === 'ppt';

    return (
      <div ref={fullscreenRef} className="relative w-full bg-black rounded-xl overflow-hidden">
        {isVideo && (
          <video
            ref={videoRef}
            src={media.url}
            className="w-full h-auto max-h-[70vh] object-contain"
            controls={!isFullScreen}
            autoPlay={isPlaying}
            loop
            playsInline
          />
        )}
        {isPPT && (
          <iframe
            ref={iframeRef}
            src={`https://docs.google.com/gview?url=${encodeURIComponent(media.url)}&embedded=true`}
            className="w-full h-[70vh]"
            title={media.name || 'PPT Viewer'}
            allowFullScreen
          />
        )}
        
        {/* Controls overlay */}
        <div className="absolute bottom-4 left-4 right-4 flex justify-center gap-4">
          <button
            onClick={toggleFullScreen}
            className="bg-white/20 backdrop-blur-sm text-white p-2 rounded-full hover:bg-white/30 transition"
          >
            {isFullScreen ? '⛶' : '⛶'}
          </button>
          <button
            onClick={isPlaying ? stopLoopPlayback : startLoopPlayback}
            className={`px-4 py-2 rounded-lg font-semibold transition ${
              isPlaying 
                ? 'bg-red-500 hover:bg-red-600 text-white' 
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            {isPlaying ? '⏹ Stop Loop' : '▶ Play Loop'}
          </button>
          {isPlaying && (
            <span className="text-white bg-black/50 px-3 py-1 rounded-full text-sm">
              {currentIndex + 1}/{mediaItems.length}
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen mt-20 bg-gradient-to-br from-blue-50 via-white to-cyan-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
           
            <h1 className="text-3xl font-bold text-gray-900">📺 Accounts Media Center</h1>
          </div>
          <div className="flex items-center gap-3">
            {/* Upload Button */}
            <label className="cursor-pointer bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 transition shadow-lg">
              {uploading ? '⏳ Uploading...' : '📤 Upload Media'}
              <input
                type="file"
                className="hidden"
                accept=".ppt,.pptx,.pdf,.mp4,.webm,.ogg"
                onChange={handleFileSelect}
                disabled={uploading}
              />
            </label>
          </div>
        </div>

        {/* Media Filter */}
        <div className="flex gap-2 mb-6">
          {['all', 'ppt', 'video'].map(type => (
            <button
              key={type}
              onClick={() => setMediaType(type)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                mediaType === type
                  ? 'bg-blue-500 text-white shadow-lg'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Media List */}
          <div className="lg:col-span-1 bg-white rounded-2xl shadow-lg p-4 max-h-[600px] overflow-y-auto">
            <h3 className="font-semibold text-gray-700 mb-3">Media Files ({filteredMedia.length})</h3>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-200 border-t-blue-600"></div>
              </div>
            ) : filteredMedia.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No media files found</p>
            ) : (
              <div className="space-y-2">
                {filteredMedia.map((item, index) => (
                  <div
                    key={item._id}
                    className={`p-3 rounded-xl cursor-pointer transition flex items-center justify-between group ${
                      selectedMedia?._id === item._id
                        ? 'bg-blue-50 border-2 border-blue-500'
                        : 'hover:bg-gray-50 border-2 border-transparent'
                    }`}
                    onClick={() => {
                      setSelectedMedia(item);
                      setCurrentIndex(index);
                      if (isPlaying) {
                        stopLoopPlayback();
                      }
                    }}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xl">
                        {item.type === 'video' ? '🎬' : '📄'}
                      </span>
                      <span className="text-sm truncate flex-1">{item.name || 'Untitled'}</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteMedia(item._id);
                      }}
                      className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 transition p-1"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Media Player */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              {selectedMedia ? (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-800 truncate">
                      {selectedMedia.name || 'Untitled'}
                    </h3>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      selectedMedia.type === 'video' 
                        ? 'bg-purple-100 text-purple-700' 
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {selectedMedia.type.toUpperCase()}
                    </span>
                  </div>
                  {renderMediaPlayer(selectedMedia)}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                  <div className="text-6xl mb-4">🎯</div>
                  <p className="text-lg">Select a media file to play</p>
                  <p className="text-sm">Upload PPT or video files to get started</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountsMedia;