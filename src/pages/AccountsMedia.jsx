import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
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
  const [currentProgress, setCurrentProgress] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [fileContent, setFileContent] = useState(null);
  const [showControls, setShowControls] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const videoRef = useRef(null);
  const fullscreenRef = useRef(null);
  const fileInputRef = useRef(null);
  const objectUrlRef = useRef(null);
  const controlsTimeoutRef = useRef(null);

  // ============ FULLSCREEN EVENT LISTENER ============
  // FIXED: This useEffect has NO dependencies that change during playback
  // so it will only run on mount/unmount
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.msFullscreenElement
      );
      setIsFullScreen(isCurrentlyFullscreen);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    };
  }, []); // ✅ Empty deps - only runs once

  // ============ CLEANUP ON UNMOUNT ONLY ============
  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, []); // ✅ Empty deps - cleanup only on unmount

  // ============ FILE SELECT HANDLER ============
  const handleFileSelect = (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      const file = files[0];

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
        'text/plain',
      ];

      if (!validTypes.includes(file.type) && !file.name.match(/\.(ppt|pptx|pdf|mp4|webm|ogg|mov|jpg|jpeg|png|gif|webp|txt)$/i)) {
        Swal.fire({
          title: 'Invalid File',
          text: 'Please select PPT, PDF, image, or video files only',
          icon: 'warning',
          confirmButtonColor: '#2563eb',
        });
        return;
      }

      // Clean up previous URL
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }

      const url = URL.createObjectURL(file);
      objectUrlRef.current = url;

      let type = 'other';
      if (file.type.includes('video') || file.name.match(/\.(mp4|webm|ogg|mov)$/i)) {
        type = 'video';
      } else if (file.type.includes('pdf') || file.name.match(/\.pdf$/i)) {
        type = 'pdf';
      } else if (file.type.includes('ppt') || file.name.match(/\.(ppt|pptx)$/i)) {
        type = 'ppt';
      } else if (file.type.includes('image') || file.name.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
        type = 'image';
      } else if (file.type.includes('text') || file.name.match(/\.(txt|md|json|xml|html|css|js)$/i)) {
        type = 'text';
      }

      if (type === 'text') {
        const reader = new FileReader();
        reader.onload = (ev) => {
          setFileContent(ev.target.result);
        };
        reader.readAsText(file);
      } else {
        setFileContent(null);
      }

      // Reset states
      setSelectedFile(file);
      setFileUrl(url);
      setFileType(type);
      setFileName(file.name);
      setFileSize(file.size);
      setIsPlaying(false);
      setIsLooping(false);
      setCurrentProgress(0);
      setVideoDuration(0);
      setCurrentTime(0);

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

  // ============ VIDEO EVENT HANDLERS ============
  const handleVideoLoadedMetadata = () => {
    if (videoRef.current) {
      setVideoDuration(videoRef.current.duration);
    }
  };

  const handleVideoTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      const duration = videoRef.current.duration;
      setCurrentTime(current);
      if (duration > 0) {
        setCurrentProgress((current / duration) * 100);
      }
    }
  };

  const handleVideoPlay = () => {
    setIsPlaying(true);
  };

  const handleVideoPause = () => {
    setIsPlaying(false);
  };

  const handleVideoEnded = () => {
    if (isLooping && videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(err => console.log('Loop replay error:', err));
    } else {
      setIsPlaying(false);
    }
  };

  // ============ PLAY CONTROLS ============
  const playMedia = () => {
    if (!fileUrl || !videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().catch(err => console.log('Play error:', err));
    } else {
      videoRef.current.pause();
    }
  };

  const toggleLoop = () => {
    const newLooping = !isLooping;
    setIsLooping(newLooping);
    if (videoRef.current) {
      videoRef.current.loop = newLooping;
    }
  };

  const skipBackward = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10);
    }
  };

  const skipForward = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.min(
        videoRef.current.duration,
        videoRef.current.currentTime + 10
      );
    }
  };

  const seekVideo = (e) => {
    if (!videoRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    videoRef.current.currentTime = pos * videoRef.current.duration;
  };

  // ============ FULLSCREEN TOGGLE ============
  const toggleFullScreen = async () => {
    try {
      if (!document.fullscreenElement && !document.webkitFullscreenElement) {
        const element = fullscreenRef.current;
        if (element) {
          if (element.requestFullscreen) {
            await element.requestFullscreen();
          } else if (element.webkitRequestFullscreen) {
            await element.webkitRequestFullscreen();
          } else if (element.msRequestFullscreen) {
            await element.msRequestFullscreen();
          }
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          await document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
          await document.msExitFullscreen();
        }
      }
    } catch (error) {
      console.error('Fullscreen error:', error);
      Swal.fire({
        title: 'Fullscreen Error',
        text: 'Your browser may not support fullscreen or it was blocked.',
        icon: 'warning',
        confirmButtonColor: '#2563eb',
      });
    }
  };

  // ============ MOUSE MOVE HANDLER ============
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isFullScreen && isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  };

  // ============ HELPERS ============
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const downloadFile = () => {
    if (fileUrl) {
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const closeFile = () => {
    if (videoRef.current) {
      videoRef.current.pause();
    }
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setSelectedFile(null);
    setFileUrl(null);
    setFileType(null);
    setFileName('');
    setFileSize(0);
    setFileContent(null);
    setIsPlaying(false);
    setCurrentProgress(0);
    setCurrentTime(0);
    setVideoDuration(0);
  };

  // ============ MEDIA PLAYER RENDER ============
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
    const isPDF = fileType === 'pdf';
    const isPPT = fileType === 'ppt';
    const isImage = fileType === 'image';
    const isText = fileType === 'text';

    // ===== VIDEO =====
    if (isVideo) {
      return (
        <div
          ref={fullscreenRef}
          className={`relative bg-black overflow-hidden ${
            isFullScreen ? 'w-screen h-screen' : 'w-full rounded-xl'
          }`}
          onMouseMove={handleMouseMove}
        >
          <video
            ref={videoRef}
            src={fileUrl}
            className={`w-full h-full object-contain ${
              isFullScreen ? '' : 'max-h-[70vh]'
            }`}
            controls={!isFullScreen}
            playsInline
            onLoadedMetadata={handleVideoLoadedMetadata}
            onTimeUpdate={handleVideoTimeUpdate}
            onPlay={handleVideoPlay}
            onPause={handleVideoPause}
            onEnded={handleVideoEnded}
            controlsList="nodownload"
          />

          {/* Custom controls in fullscreen */}
          {isFullScreen && (
            <div
              className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-6 transition-opacity duration-300 ${
                showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
            >
              {/* Progress bar */}
              <div className="flex items-center gap-3 mb-4">
                <span className="text-white text-sm font-mono w-14 text-center">
                  {formatTime(currentTime)}
                </span>
                <div
                  className="flex-1 h-1.5 bg-white/30 rounded-full overflow-hidden cursor-pointer group"
                  onClick={seekVideo}
                >
                  <div
                    className="h-full bg-blue-500 group-hover:bg-blue-400 transition-colors"
                    style={{ width: `${currentProgress}%` }}
                  />
                </div>
                <span className="text-white text-sm font-mono w-14 text-center">
                  {formatTime(videoDuration)}
                </span>
              </div>

              {/* Control buttons */}
              <div className="flex justify-center items-center gap-4">
                <button
                  onClick={skipBackward}
                  className="bg-white/20 backdrop-blur-sm text-white p-3 rounded-full hover:bg-white/30 transition"
                  title="Back 10s"
                >
                  ⏪
                </button>
                <button
                  onClick={playMedia}
                  className="bg-white/30 backdrop-blur-sm text-white p-4 rounded-full hover:bg-white/40 transition text-xl"
                  title={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? '⏸' : '▶'}
                </button>
                <button
                  onClick={skipForward}
                  className="bg-white/20 backdrop-blur-sm text-white p-3 rounded-full hover:bg-white/30 transition"
                  title="Forward 10s"
                >
                  ⏩
                </button>
                <button
                  onClick={toggleLoop}
                  className={`p-3 rounded-full transition ${
                    isLooping
                      ? 'bg-blue-500 text-white'
                      : 'bg-white/20 backdrop-blur-sm text-white hover:bg-white/30'
                  }`}
                  title={isLooping ? 'Loop On' : 'Loop Off'}
                >
                  🔁
                </button>
                <button
                  onClick={toggleFullScreen}
                  className="bg-white/20 backdrop-blur-sm text-white p-3 rounded-full hover:bg-white/30 transition"
                  title="Exit Fullscreen"
                >
                  ⛶
                </button>
                <button
                  onClick={closeFile}
                  className="bg-red-500/80 backdrop-blur-sm text-white p-3 rounded-full hover:bg-red-600 transition"
                  title="Close"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* Non-fullscreen controls */}
          {!isFullScreen && (
            <div className="absolute bottom-4 left-4 right-4 flex justify-center gap-3">
              <button
                onClick={playMedia}
                className="bg-white/20 backdrop-blur-sm text-white p-2 rounded-full hover:bg-white/30 transition"
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
              >
                🔁
              </button>
              <button
                onClick={downloadFile}
                className="bg-white/20 backdrop-blur-sm text-white p-2 rounded-full hover:bg-white/30 transition"
              >
                ⬇️
              </button>
              <button
                onClick={toggleFullScreen}
                className="bg-white/20 backdrop-blur-sm text-white p-2 rounded-full hover:bg-white/30 transition"
              >
                ⛶
              </button>
            </div>
          )}

          {/* Loop indicator */}
          {isLooping && (!isFullScreen || showControls) && (
            <div className="absolute top-4 right-4 bg-blue-500/80 text-white px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm">
              🔁 Loop On
            </div>
          )}
        </div>
      );
    }

    // ===== IMAGE =====
    if (isImage) {
      return (
        <div
          ref={fullscreenRef}
          className={`relative bg-black overflow-hidden ${
            isFullScreen ? 'w-screen h-screen flex items-center justify-center' : 'w-full rounded-xl'
          }`}
        >
          <img
            src={fileUrl}
            alt={fileName}
            className={`object-contain ${
              isFullScreen ? 'max-w-full max-h-full' : 'w-full max-h-[70vh]'
            }`}
          />
          <div className="absolute bottom-4 left-4 right-4 flex justify-center gap-3">
            <button
              onClick={downloadFile}
              className="bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-xl font-semibold hover:bg-white/30 transition"
            >
              ⬇️ Download
            </button>
            <button
              onClick={toggleFullScreen}
              className="bg-white/20 backdrop-blur-sm text-white p-2 rounded-full hover:bg-white/30 transition"
            >
              {isFullScreen ? '⛶' : '⛶'}
            </button>
            {isFullScreen && (
              <button
                onClick={closeFile}
                className="bg-red-500/80 backdrop-blur-sm text-white p-2 rounded-full hover:bg-red-600 transition"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      );
    }

    // ===== TEXT =====
    if (isText && fileContent) {
      return (
        <div
          ref={fullscreenRef}
          className={`relative bg-white overflow-hidden ${
            isFullScreen ? 'w-screen h-screen' : 'w-full rounded-xl'
          }`}
        >
          <div className={`overflow-auto p-6 bg-gray-50 ${isFullScreen ? 'h-screen' : 'h-[70vh]'}`}>
            <pre className="text-sm whitespace-pre-wrap font-mono text-gray-800">
              {fileContent}
            </pre>
          </div>
          <div className="absolute bottom-4 left-4 right-4 flex justify-center gap-3">
            <button
              onClick={downloadFile}
              className="bg-gray-800/80 backdrop-blur-sm text-white px-4 py-2 rounded-xl font-semibold hover:bg-gray-900 transition"
            >
              ⬇️ Download
            </button>
            <button
              onClick={toggleFullScreen}
              className="bg-gray-800/80 backdrop-blur-sm text-white p-2 rounded-full hover:bg-gray-900 transition"
            >
              {isFullScreen ? '⛶' : '⛶'}
            </button>
          </div>
        </div>
      );
    }

    // ===== PDF =====
    if (isPDF) {
      return (
        <div
          ref={fullscreenRef}
          className={`relative bg-white overflow-hidden ${
            isFullScreen ? 'w-screen h-screen' : 'w-full rounded-xl'
          }`}
        >
          <iframe
            src={fileUrl}
            className={`w-full border-0 ${isFullScreen ? 'h-screen' : 'h-[70vh]'}`}
            title={fileName || 'PDF Viewer'}
          />
          <div className="absolute bottom-4 left-4 right-4 flex justify-center gap-3">
            <button
              onClick={downloadFile}
              className="bg-blue-500/80 backdrop-blur-sm text-white px-4 py-2 rounded-xl font-semibold hover:bg-blue-600 transition"
            >
              ⬇️ Download
            </button>
            <button
              onClick={toggleFullScreen}
              className="bg-blue-500/80 backdrop-blur-sm text-white p-2 rounded-full hover:bg-blue-600 transition"
            >
              {isFullScreen ? '⛶' : '⛶'}
            </button>
          </div>
        </div>
      );
    }

    // ===== PPT =====
    if (isPPT) {
      return (
        <div
          ref={fullscreenRef}
          className={`relative bg-white overflow-hidden ${
            isFullScreen ? 'w-screen h-screen' : 'w-full rounded-xl'
          }`}
        >
          <div
            className={`flex flex-col items-center justify-center p-8 ${
              isFullScreen ? 'h-screen' : 'h-[70vh]'
            }`}
          >
            <div className="text-6xl mb-6">📊</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">{fileName}</h3>
            <p className="text-gray-500 mb-6">PowerPoint - {formatFileSize(fileSize)}</p>
            <div className="flex gap-4">
              <button
                onClick={downloadFile}
                className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-semibold transition"
              >
                ⬇️ Download PPT
              </button>
              <button
                onClick={() => window.open(fileUrl, '_blank')}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-xl font-semibold transition"
              >
                📂 Open in New Tab
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-4">
              💡 PowerPoint files open best in PowerPoint or Google Slides
            </p>
          </div>
          <div className="absolute bottom-4 left-4 right-4 flex justify-center gap-3">
            <button
              onClick={toggleFullScreen}
              className="bg-orange-500/80 backdrop-blur-sm text-white p-2 rounded-full hover:bg-orange-600 transition"
            >
              {isFullScreen ? '⛶' : '⛶'}
            </button>
          </div>
        </div>
      );
    }

    // ===== FALLBACK =====
    return (
      <div className="flex flex-col items-center justify-center h-96 bg-gray-100 rounded-xl p-8">
        <div className="text-6xl mb-4">📁</div>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">{fileName}</h3>
        <p className="text-gray-500 mb-4">File type: {fileType || 'Unknown'}</p>
        <p className="text-xs text-gray-400 mb-6">Size: {formatFileSize(fileSize)}</p>
        <button
          onClick={downloadFile}
          className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold transition"
        >
          ⬇️ Download File
        </button>
      </div>
    );
  };

  return (
    <>
      {!isFullScreen && <InternalNavbar />}

      <div
        className={`min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 ${
          isFullScreen ? 'p-0' : 'py-8'
        }`}
      >
        <div className={isFullScreen ? 'w-full' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'}>
          {!isFullScreen && (
            <>
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
                  <label className="cursor-pointer bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 transition shadow-lg">
                    📂 Select File
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      accept=".ppt,.pptx,.pdf,.mp4,.webm,.ogg,.mov,.jpg,.jpeg,.png,.gif,.webp,.txt"
                      onChange={handleFileSelect}
                    />
                  </label>
                </div>
              </div>

              {fileName && (
                <div className="bg-white rounded-2xl shadow-lg p-4 mb-6">
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">
                        {fileType === 'video'
                          ? '🎬'
                          : fileType === 'image'
                          ? '🖼️'
                          : fileType === 'pdf'
                          ? '📄'
                          : fileType === 'ppt'
                          ? '📊'
                          : fileType === 'text'
                          ? '📝'
                          : '📁'}
                      </span>
                      <span className="font-semibold text-gray-800 truncate max-w-xs">{fileName}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>📦 {formatFileSize(fileSize)}</span>
                      {fileType === 'video' && videoDuration > 0 && (
                        <span>⏱️ {formatTime(videoDuration)}</span>
                      )}
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          fileType === 'video'
                            ? 'bg-purple-100 text-purple-700'
                            : fileType === 'image'
                            ? 'bg-green-100 text-green-700'
                            : fileType === 'pdf'
                            ? 'bg-red-100 text-red-700'
                            : fileType === 'ppt'
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {fileType?.toUpperCase() || 'FILE'}
                      </span>
                      {isPlaying && <span className="text-green-500 animate-pulse">● Playing</span>}
                      {isLooping && <span className="text-blue-500">🔁 Loop</span>}
                      <button
                        onClick={closeFile}
                        className="text-red-500 hover:text-red-700 font-semibold ml-auto"
                      >
                        ✕ Close
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          <div className={isFullScreen ? '' : 'bg-white rounded-2xl shadow-lg p-6'}>
            {renderMediaPlayer()}
          </div>

          {!isFullScreen && (
            <div className="mt-6 text-center text-sm text-gray-500">
              <p>📌 Select a file from your computer to view it locally</p>
              <p className="text-xs text-gray-400 mt-1">
                Supports: Videos | PDF | PPT | Images | Text
                {fileType === 'video' && ' | Click ⛶ for fullscreen'}
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default AccountsMedia;