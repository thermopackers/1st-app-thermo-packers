import imageCompression from 'browser-image-compression';

export const compressImage = async (file) => {
  const options = {
    maxSizeMB: 0.5, // Maximum size in MB (500KB)
    maxWidthOrHeight: 1024, // Max width or height in pixels
    useWebWorker: true, // Use web worker for better performance
    fileType: 'image/jpeg', // Convert to JPEG for better compression
    quality: 0.8, // Image quality (0-1)
  };

  try {
    // Check if it's an image
    if (!file.type.startsWith('image/')) {
      return file; // Return original if not an image
    }

    // Compress the image
    const compressedFile = await imageCompression(file, options);
    console.log(`Original size: ${(file.size / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Compressed size: ${(compressedFile.size / 1024 / 1024).toFixed(2)} MB`);
    
    return compressedFile;
  } catch (error) {
    console.error('Error compressing image:', error);
    return file; // Return original file if compression fails
  }
};

export const compressMultipleImages = async (files) => {
  const compressedFiles = [];
  for (const file of files) {
    const compressed = await compressImage(file);
    compressedFiles.push(compressed);
  }
  return compressedFiles;
};