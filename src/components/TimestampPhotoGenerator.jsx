import React, { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Camera, Upload, Calendar, Clock, Download, X } from "lucide-react";
import InternalNavbar from "./InternalNavbar";

export default function TimestampPhotoGenerator() {
  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);
  const [originalImage, setOriginalImage] = useState(null);
  const [processedImage, setProcessedImage] = useState(null);
  const [customDate, setCustomDate] = useState("");
  const [customTime, setCustomTime] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  // Set current date and time as default
  React.useEffect(() => {
    const now = new Date();
    setCustomDate(now.toISOString().split('T')[0]);
    setCustomTime(now.toTimeString().slice(0, 5));
  }, []);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setOriginalImage(e.target.result);
        setProcessedImage(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const captureFromCamera = () => {
    // You can integrate webcam capture similar to your attendance component
    // For now, we'll use file upload as fallback
    triggerFileUpload();
  };

  const generateTimestampImage = () => {
    if (!originalImage || !customDate || !customTime) return;

    setIsGenerating(true);

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
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

      // Add timestamp overlay
      ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
      ctx.fillRect(10, canvas.height - 40, 280, 30);
      
      ctx.fillStyle = "white";
      ctx.font = "14px monospace";
      ctx.fillText(formattedTimestamp, 20, canvas.height - 20);

      // Convert to data URL and set as processed image
      const timestampedImage = canvas.toDataURL("image/jpeg", 0.9);
      setProcessedImage(timestampedImage);
      setIsGenerating(false);
    };

    img.src = originalImage;
  };

  const downloadImage = () => {
    if (!processedImage) return;

    const link = document.createElement('a');
    link.download = `timestamped-photo-${customDate}-${customTime.replace(':', '-')}.jpg`;
    link.href = processedImage;
    link.click();
  };

  const resetAll = () => {
    setOriginalImage(null);
    setProcessedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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

  return (
    <>
    <InternalNavbar />
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="min-h-screen bg-gray-50 py-8 px-4"
    >
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div 
          className="text-center mb-8"
          variants={itemVariants}
        >
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Camera className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Timestamp Photo Generator
          </h1>
          <p className="text-gray-600 text-lg">
            Add custom timestamps to your photos
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Panel - Controls */}
          <motion.div 
            className="bg-white rounded-2xl shadow-lg p-6"
            variants={itemVariants}
          >
            <h2 className="text-xl font-semibold text-gray-800 mb-6">
              Photo & Timestamp Settings
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
            </div>

            {/* Date & Time Selection */}
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

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <motion.button
                onClick={generateTimestampImage}
                disabled={!originalImage || isGenerating}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl font-medium transition-all ${
                  originalImage && !isGenerating
                    ? "bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}
              >
                {isGenerating ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Clock className="w-5 h-5" />
                    Add Timestamp
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
            {processedImage && (
              <motion.button
                onClick={downloadImage}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full mt-4 flex items-center justify-center gap-2 p-3 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 transition-colors"
              >
                <Download className="w-5 h-5" />
                Download Timestamped Photo
              </motion.button>
            )}
          </motion.div>

          {/* Right Panel - Preview */}
          <motion.div 
            className="bg-white rounded-2xl shadow-lg p-6"
            variants={itemVariants}
          >
            <h2 className="text-xl font-semibold text-gray-800 mb-6">
              Preview
            </h2>

            <div className="space-y-4">
              {/* Original Image */}
              {originalImage && (
                <div>
                  <h3 className="text-sm font-medium text-gray-600 mb-2">Original Photo</h3>
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-4">
                    <img
                      src={originalImage}
                      alt="Original"
                      className="w-full h-48 object-contain rounded-lg"
                    />
                  </div>
                </div>
              )}

              {/* Processed Image */}
              {processedImage && (
                <div>
                  <h3 className="text-sm font-medium text-gray-600 mb-2">
                    With Timestamp ({customDate} {customTime})
                  </h3>
                  <div className="border-2 border-green-500 border-dashed rounded-xl p-4 bg-green-50">
                    <img
                      src={processedImage}
                      alt="With Timestamp"
                      className="w-full h-48 object-contain rounded-lg"
                    />
                  </div>
                </div>
              )}

              {/* Empty State */}
              {!originalImage && (
                <div className="text-center py-12">
                  <Camera className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Upload or capture a photo to get started</p>
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