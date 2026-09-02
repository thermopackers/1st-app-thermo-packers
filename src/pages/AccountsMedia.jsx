import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { motion } from 'framer-motion';
import '../index.css';
import InternalNavbar from '../components/InternalNavbar';

const AccountsMedia = () => {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileUrl, setFileUrl] = useState(null);
  const [fileType, setFileType] = useState(null);
  const [fileName, setFileName] = useState('');
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [fileSize, setFileSize] = useState(0);
  const [isLooping, setIsLooping] = useState(false);
  const [playbackInterval, setPlaybackInterval] = useState(null);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const videoRef = useRef(null);
  const iframeRef = useRef(null);
  const fullscreenRef = useRef(null);
  const fileInputRef = useRef(null);

  // Handle file selection
  const handleFileSelect = (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      const file = files[0];
      
      // Validate file type
      const validTypes = [
        'video/mp4', 
        'video/webm', 
        'video/ogg', 
        'video/quicktime',
        'application/pdf', 
        'application/vnd.ms-powerpoint', 
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
      ];
      
      if (!validTypes.includes(file.type)) {
        Swal.fire({
          title: 'Invalid File',
          text: 'Please select PPT, PDF, image, or video files only',
          icon: 'warning',
          confirmButtonColor: '#2563eb',
        });
        return;
      }

      // Clean up previous URL
      if (fileUrl) {
        URL.revokeObjectURL(fileUrl);
      }

      // Create local URL
      const url = URL.createObjectURL(file);
      
      // Determine file type for display
      let type = 'ppt';
      if (file.type.includes('video')) {
        type = 'video';
      } else if (file.type.includes('pdf') || file.type.includes('ppt') || file.type.includes('pptx')) {
        type = 'ppt';
      } else if (file.type.includes('image')) {
        type = 'image';
      }

      setSelectedFile(file);
      setFileUrl(url);
      setFileType(type);
      setFileName(file.name);
      setFileSize(file.size);
      setIsPlaying(false);
      setIsLooping(false);
      setCurrentProgress(0);
      setVideoDuration(0);
      
      // Close any playing interval
      if (playbackInterval) {
        clearInterval(playbackInterval);
        setPlaybackInterval(null);
      }

      // Show success message
      Swal.fire({
        title: 'File Loaded!',
        text: `${file.name} loaded successfully`,
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
      });
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle video metadata loaded
  const handleVideoLoadedMetadata = () => {
    if (videoRef.current) {
      setVideoDuration(videoRef.current.duration);
    }
  };

  // Handle video time update
  const handleVideoTimeUpdate = () => {
    if (videoRef.current) {
      const progress = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setCurrentProgress(progress);
      
      // Check if video ended
      if (videoRef.current.currentTime >= videoRef.current.duration) {
        if (isLooping) {
          // Restart video
          videoRef.current.currentTime = 0;
          videoRef.current.play();
        } else {
          setIsPlaying(false);
        }
      }
    }
  };

  // Play media
  const playMedia = () => {
    if (!fileUrl) return;

    if (fileType === 'video' && videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  // Toggle loop
  const toggleLoop = () => {
    setIsLooping(!isLooping);
    if (videoRef.current) {
      videoRef.current.loop = !isLooping;
    }
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
      // Clean up URL
      if (fileUrl) {
        URL.revokeObjectURL(fileUrl);
      }
    };
  }, []);

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Format time (seconds to MM:SS)
  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Render media player based on type
  const renderMediaPlayer = () => {
    if (!fileUrl) {
      return (
        <div className="flex flex-col items-center justify-center h-96 bg-gray-100 rounded-xl">
          <div className="text-6xl mb-4">🎯</div>
          <p className="text-lg text-gray-500">Select a file to play</p>
          <p className="text-sm text-gray-400">Upload PPT, PDF, or video files</p>
        </div>
      );
    }

    const isVideo = fileType === 'video';
    const isPPT = fileType === 'ppt' || fileType === 'image';

    return (
      <div ref={fullscreenRef} className="relative w-full bg-black rounded-xl overflow-hidden">
        {isVideo && (
          <>
            <video
              ref={videoRef}
              src={fileUrl}
              className="w-full h-auto max-h-[70vh] object-contain"
              controls={!isFullScreen}
              playsInline
              onLoadedMetadata={handleVideoLoadedMetadata}
              onTimeUpdate={handleVideoTimeUpdate}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onEnded={() => {
                if (!isLooping) {
                  setIsPlaying(false);
                }
              }}
              controlsList="nodownload"
            />
            
            {/* Video Progress Bar */}
            {videoDuration > 0 && (
              <div className="absolute bottom-16 left-4 right-4">
                <div className="flex items-center gap-3">
                  <span className="text-white text-xs font-mono bg-black/50 px-2 py-1 rounded">
                    {formatTime(videoRef.current?.currentTime || 0)}
                  </span>
                  <div className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden cursor-pointer">
                    <div 
                      className="h-full bg-blue-500 transition-all duration-300"
                      style={{ width: `${currentProgress}%` }}
                    />
                  </div>
                  <span className="text-white text-xs font-mono bg-black/50 px-2 py-1 rounded">
                    {formatTime(videoDuration)}
                  </span>
                </div>
              </div>
            )}
          </>
        )}
        
        {isPPT && (
          <iframe
            ref={iframeRef}
            src={fileType === 'pdf' 
              ? `https://docs.google.com/gview?url=${encodeURIComponent(fileUrl)}&embedded=true`
              : fileUrl
            }
            className="w-full h-[70vh]"
            title={fileName || 'File Viewer'}
            allowFullScreen
          />
        )}
        
        {/* Controls overlay */}
        <div className="absolute bottom-4 left-4 right-4 flex justify-center gap-3">
          {isVideo && (
            <>
              <button
                onClick={playMedia}
                className="bg-white/20 backdrop-blur-sm text-white p-2 rounded-full hover:bg-white/30 transition"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? '⏸' : '▶'}
              </button>
              <button
                onClick={toggleLoop}
                className={`p-2 rounded-full transition ${
                  isLooping 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-white/20 backdrop-blur-sm text-white hover:bg-white/30'
                }`}
                title={isLooping ? 'Loop On' : 'Loop Off'}
              >
                🔁
              </button>
            </>
          )}
          <button
            onClick={toggleFullScreen}
            className="bg-white/20 backdrop-blur-sm text-white p-2 rounded-full hover:bg-white/30 transition"
            title="Fullscreen"
          >
            {isFullScreen ? '⛶' : '⛶'}
          </button>
        </div>

        {/* Loop status indicator */}
        {isLooping && isVideo && (
          <div className="absolute top-4 right-4 bg-blue-500/80 text-white px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm">
            🔁 Loop On
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <InternalNavbar/>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="text-gray-600 hover:text-gray-900 flex items-center gap-2"
              >
                ← Back to Dashboard
              </button>
              <h1 className="text-3xl font-bold text-gray-900">📺 Accounts Media Center</h1>
            </div>
            <div className="flex items-center gap-3">
              {/* Select File Button */}
              <label className="cursor-pointer bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 transition shadow-lg">
                📂 Select File
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept=".ppt,.pptx,.pdf,.mp4,.webm,.ogg,.mov,.jpg,.jpeg,.png,.gif,.webp"
                  onChange={handleFileSelect}
                />
              </label>
            </div>
          </div>

          {/* File Info */}
          {fileName && (
            <div className="bg-white rounded-2xl shadow-lg p-4 mb-6">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">
                    {fileType === 'video' ? '🎬' : fileType === 'image' ? '🖼️' : '📄'}
                  </span>
                  <span className="font-semibold text-gray-800 truncate max-w-xs">
                    {fileName}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span>📦 {formatFileSize(fileSize)}</span>
                  {fileType === 'video' && videoDuration > 0 && (
                    <span>⏱️ {formatTime(videoDuration)}</span>
                  )}
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    fileType === 'video' 
                      ? 'bg-purple-100 text-purple-700' 
                      : fileType === 'image'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {fileType?.toUpperCase() || 'FILE'}
                  </span>
                  {isPlaying && (
                    <span className="text-green-500 animate-pulse">● Playing</span>
                  )}
                  {isLooping && (
                    <span className="text-blue-500">🔁 Loop</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Main Content - Media Player */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            {renderMediaPlayer()}
          </div>

          {/* Instructions */}
          <div className="mt-6 text-center text-sm text-gray-500">
            <p>📌 Select a file from your computer to play it locally</p>
            <p className="text-xs text-gray-400 mt-1">
              Supports: MP4, WebM, OGG, PDF, PPT, PPTX, Images
              {fileType === 'video' && ' | Click 🔁 to toggle loop on/off'}
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default AccountsMedia;