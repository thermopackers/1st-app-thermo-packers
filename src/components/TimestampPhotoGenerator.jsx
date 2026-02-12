import React, { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Camera, Upload, Calendar, Clock, Download, X, Image as ImageIcon } from "lucide-react";
import InternalNavbar from "./InternalNavbar";

export default function TimestampPhotoGenerator() {
  const fileInputRef = useRef(null);
  const compressFileInputRef = useRef(null);
  const canvasRef = useRef(null);
  const [originalImage, setOriginalImage] = useState(null);
  const [processedImage, setProcessedImage] = useState(null);
  const [customDate, setCustomDate] = useState("");
  const [customTime, setCustomTime] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  
  // New states for compression-only feature
  const [compressOriginalImage, setCompressOriginalImage] = useState(null);
  const [compressedImage, setCompressedImage] = useState(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [activeTab, setActiveTab] = useState("timestamp"); // "timestamp" or "compress"

  // Set current date and time as default
  React.useEffect(() => {
    const now = new Date();
    setCustomDate(now.toISOString().split('T')[0]);
    setCustomTime(now.toTimeString().slice(0, 5));
  }, []);

  // ✅ Add the same compression function from your attendance system
 // ✅ REPLACE WITH THIS FUNCTION THAT MAINTAINS ASPECT RATIO:
const compressImage = (base64Str, quality = 0.3, targetWidth = 320, targetHeight = 568) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      
      // Calculate aspect ratios
      const imgAspectRatio = img.width / img.height;
      const targetAspectRatio = targetWidth / targetHeight;
      
      let drawWidth, drawHeight, offsetX = 0, offsetY = 0;
      
      // Fit image within target dimensions while maintaining aspect ratio
      if (imgAspectRatio > targetAspectRatio) {
        // Image is wider - fit to width
        drawWidth = targetWidth;
        drawHeight = targetWidth / imgAspectRatio;
        offsetY = (targetHeight - drawHeight) / 2; // Center vertically
      } else {
        // Image is taller - fit to height
        drawHeight = targetHeight;
        drawWidth = targetHeight * imgAspectRatio;
        offsetX = (targetWidth - drawWidth) / 2; // Center horizontally
      }
      
      // Set canvas to target dimensions
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      
      const ctx = canvas.getContext("2d");
      
      // Fill background with white (optional)
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, targetWidth, targetHeight);
      
      // Draw image centered and maintaining aspect ratio
      ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
      
      const compressed = canvas.toDataURL("image/jpeg", quality);
      resolve(compressed);
    };
    img.src = base64Str;
  });
};

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (activeTab === "timestamp") {
          setOriginalImage(e.target.result);
          setProcessedImage(null);
        } else {
          setCompressOriginalImage(e.target.result);
          setCompressedImage(null);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileUpload = () => {
    if (activeTab === "timestamp") {
      fileInputRef.current?.click();
    } else {
      compressFileInputRef.current?.click();
    }
  };

  const captureFromCamera = () => {
    triggerFileUpload();
  };

  const generateTimestampImage = async () => {
    if (!originalImage || !customDate || !customTime) return;

    setIsGenerating(true);

    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      const img = new Image();

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = originalImage;
      });

      // Set canvas dimensions to match image
      canvas.width = img.width;
      canvas.height = img.height;

      // Draw original image
      ctx.drawImage(img, 0, 0);

      // Create formatted timestamp
      const dateObj = new Date(`${customDate}T${customTime}`);
      const formattedTimestamp = dateObj.toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "medium",
      });

      // Add timestamp overlay (same style as attendance system)
      ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
      ctx.fillRect(10, canvas.height - 40, 280, 30);
      
      ctx.fillStyle = "white";
      ctx.font = "14px monospace";
      ctx.fillText(formattedTimestamp, 20, canvas.height - 20);

      // Convert to data URL and compress (same compression as attendance system)
      const timestampedImage = canvas.toDataURL("image/jpeg", 0.9);
      
      // ✅ Apply the same compression as in attendance system (quality: 0.3)
      const compressedImage = await compressImage(timestampedImage, 0.3);
      
      setProcessedImage(compressedImage);
    } catch (error) {
      console.error("Error generating timestamp image:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  // ✅ New function to compress image only (without timestamp)
  const compressImageOnly = async () => {
    if (!compressOriginalImage) return;

    setIsCompressing(true);

    try {
      // ✅ Apply the same compression as in attendance system (quality: 0.3)
      const compressedResult = await compressImage(compressOriginalImage, 0.3);
      setCompressedImage(compressedResult);
    } catch (error) {
      console.error("Error compressing image:", error);
    } finally {
      setIsCompressing(false);
    }
  };

  const downloadImage = () => {
    let imageToDownload, filename;
    
    if (activeTab === "timestamp" && processedImage) {
      imageToDownload = processedImage;
      filename = `timestamped-photo-${customDate}-${customTime.replace(':', '-')}.jpg`;
    } else if (activeTab === "compress" && compressedImage) {
      imageToDownload = compressedImage;
      filename = `compressed-photo-${new Date().toISOString().split('T')[0]}.jpg`;
    } else {
      return;
    }

    const link = document.createElement('a');
    link.download = filename;
    link.href = imageToDownload;
    link.click();
  };

  const resetAll = () => {
    if (activeTab === "timestamp") {
      setOriginalImage(null);
      setProcessedImage(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } else {
      setCompressOriginalImage(null);
      setCompressedImage(null);
      if (compressFileInputRef.current) {
        compressFileInputRef.current.value = '';
      }
    }
  };

  const getCurrentImage = () => {
    if (activeTab === "timestamp") {
      return {
        original: originalImage,
        processed: processedImage,
        isProcessing: isGenerating
      };
    } else {
      return {
        original: compressOriginalImage,
        processed: compressedImage,
        isProcessing: isCompressing
      };
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };

  const { original, processed, isProcessing } = getCurrentImage();

  return (
    <>
      <InternalNavbar />
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="min-h-screen bg-gray-50 py-8 px-4"
      >
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <motion.div 
            className="text-center mb-8"
            variants={itemVariants}
          >
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Camera className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Photo Tools
            </h1>
            <p className="text-gray-600 text-lg">
              Compress images and add custom timestamps
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Images are automatically compressed to 30% quality (same as attendance system)
            </p>
          </motion.div>

          {/* Tab Navigation */}
          <motion.div 
            className="flex justify-center mb-8"
            variants={itemVariants}
          >
            <div className="bg-white rounded-2xl shadow-lg p-2 flex">
              <button
                onClick={() => setActiveTab("timestamp")}
                className={`px-6 py-3 rounded-xl font-medium transition-all ${
                  activeTab === "timestamp"
                    ? "bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-md"
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                <Clock className="w-5 h-5 inline mr-2" />
                Add Timestamp
              </button>
              <button
                onClick={() => setActiveTab("compress")}
                className={`px-6 py-3 rounded-xl font-medium transition-all ${
                  activeTab === "compress"
                    ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md"
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
<ImageIcon className="w-5 h-5 inline mr-2" />
                Compress Only
              </button>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Panel - Controls */}
            <motion.div 
              className="bg-white rounded-2xl shadow-lg p-6"
              variants={itemVariants}
            >
              <h2 className="text-xl font-semibold text-gray-800 mb-6">
                {activeTab === "timestamp" ? "Photo & Timestamp Settings" : "Image Compression"}
              </h2>

              {/* Upload/Capture Section */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select Photo
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <motion.button
                    onClick={captureFromCamera}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center justify-center gap-2 p-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors"
                  >
                    <Camera className="w-5 h-5" />
                    Capture
                  </motion.button>

                  <motion.button
                    onClick={triggerFileUpload}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center justify-center gap-2 p-3 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 transition-colors"
                  >
                    <Upload className="w-5 h-5" />
                    Upload
                  </motion.button>
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="hidden"
                />
                <input
                  type="file"
                  ref={compressFileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="hidden"
                />
              </div>

              {/* Date & Time Selection - Only show for timestamp tab */}
              {activeTab === "timestamp" && (
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Calendar className="w-4 h-4 inline mr-1" />
                      Date
                    </label>
                    <input
                      type="date"
                      value={customDate}
                      onChange={(e) => setCustomDate(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Clock className="w-4 h-4 inline mr-1" />
                      Time
                    </label>
                    <input
                      type="time"
                      value={customTime}
                      onChange={(e) => setCustomTime(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <motion.button
                  onClick={activeTab === "timestamp" ? generateTimestampImage : compressImageOnly}
                  disabled={!original || isProcessing}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl font-medium transition-all ${
                    original && !isProcessing
                      ? activeTab === "timestamp" 
                        ? "bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700"
                        : "bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700"
                      : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  {isProcessing ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      {activeTab === "timestamp" ? "Generating..." : "Compressing..."}
                    </>
                  ) : (
                    <>
{activeTab === "timestamp" ? <Clock className="w-5 h-5" /> : <ImageIcon className="w-5 h-5" />}
                      {activeTab === "timestamp" ? "Add Timestamp" : "Compress Image"}
                    </>
                  )}
                </motion.button>

                <motion.button
                  onClick={resetAll}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center justify-center gap-2 p-3 bg-gray-500 text-white rounded-xl font-medium hover:bg-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                  Reset
                </motion.button>
              </div>

              {/* Download Button */}
              {processed && (
                <motion.button
                  onClick={downloadImage}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full mt-4 flex items-center justify-center gap-2 p-3 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 transition-colors"
                >
                  <Download className="w-5 h-5" />
                  Download {activeTab === "timestamp" ? "Timestamped" : "Compressed"} Photo
                </motion.button>
              )}

              {/* Compression Info */}
              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-xs text-blue-700">
                  <strong>Note:</strong> All images are compressed to 30% quality for optimal file size, 
                  same as the attendance system compression.
                </p>
              </div>
            </motion.div>

            {/* Right Panel - Preview */}
            <motion.div 
              className="bg-white rounded-2xl shadow-lg p-6"
              variants={itemVariants}
            >
              <h2 className="text-xl font-semibold text-gray-800 mb-6">
                Preview - {activeTab === "timestamp" ? "Timestamp" : "Compression"}
              </h2>

              <div className="space-y-4">
                {/* Original Image */}
                {original && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-600 mb-2">Original Photo</h3>
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-4">
                      <img
                        src={original}
                        alt="Original"
                        className="w-full h-48 object-contain rounded-lg"
                      />
                    </div>
                  </div>
                )}

                {/* Processed Image */}
                {processed && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-600 mb-2">
                      {activeTab === "timestamp" 
                        ? `With Timestamp (${customDate} ${customTime})`
                        : "Compressed Image"
                      }
                    </h3>
                    <div className="border-2 border-green-500 border-dashed rounded-xl p-4 bg-green-50">
                      <img
                        src={processed}
                        alt={activeTab === "timestamp" ? "With Timestamp" : "Compressed"}
                        className="w-full h-48 object-contain rounded-lg"
                      />
                      <p className="text-xs text-green-600 mt-2 text-center">
                        ✓ {activeTab === "timestamp" ? "Compressed and timestamped" : "Compressed to 30% quality"}
                      </p>
                    </div>
                  </div>
                )}

                {/* Empty State */}
                {!original && (
                  <div className="text-center py-12">
                    <Camera className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">
                      {activeTab === "timestamp" 
                        ? "Upload or capture a photo to add timestamp" 
                        : "Upload or capture a photo to compress"
                      }
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Hidden Canvas for Processing */}
          <canvas ref={canvasRef} className="hidden" />
        </div>
      </motion.div>
    </>
  );
}