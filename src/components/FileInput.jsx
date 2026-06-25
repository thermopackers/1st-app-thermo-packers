import React, { useState, useEffect } from "react";

const FileInput = ({ 
  label, 
  name, 
  onChange, 
  multiple = false, 
  resetTrigger,
  initialFiles = [],
  onRemoveExisting,
  onViewFile // NEW: Callback to view files
}) => {
  const [previews, setPreviews] = useState([]);
  const [files, setFiles] = useState(multiple ? [] : null);
  const [existingFiles, setExistingFiles] = useState(initialFiles);

  // Initialize with existing files when in edit mode
  useEffect(() => {
    if (initialFiles && initialFiles.length > 0) {
      setExistingFiles(initialFiles);
      setPreviews(initialFiles);
    } else {
      setExistingFiles([]);
      setPreviews([]);
      setFiles(multiple ? [] : null);
    }
  }, [initialFiles, multiple, resetTrigger]);

  const handleChange = (e) => {
    const newFiles = Array.from(e.target.files);
    if (newFiles.length === 0) return;

    if (multiple) {
      // Add new files on top of existing ones
      const updatedFiles = [...(files || []), ...newFiles];

      // ✅ Deduplicate by name+size
      const uniqueFiles = Array.from(
        new Map(updatedFiles.map(f => [f.name + f.size, f])).values()
      );

      setFiles(uniqueFiles);
      onChange(uniqueFiles);

      // Keep existing previews + add new unique previews
      const newPreviews = newFiles.map(file => URL.createObjectURL(file));
      setPreviews(prev => [...prev, ...newPreviews]);
    } else {
      // Single file field → replace
      const singleFile = newFiles[0];
      setFiles(singleFile);
      onChange(singleFile);
      setPreviews([URL.createObjectURL(singleFile)]);
    }
  };

  const removeFile = (index) => {
    if (multiple) {
      // Remove both the file and its preview at the same index
      setFiles(prev => prev.filter((_, i) => i !== index));
      setPreviews(prev => prev.filter((_, i) => i !== index));

      // Update parent (RegisterUser)
      onChange(files.filter((_, i) => i !== index));
    } else {
      setFiles(null);
      setPreviews([]);
      onChange(null);
    }
  };

  const removeExistingFile = (index) => {
    const fileToRemove = existingFiles[index];
    
    // Remove from existing files
    const updatedExisting = existingFiles.filter((_, i) => i !== index);
    setExistingFiles(updatedExisting);
    
    // Remove from previews (existing files are at the beginning of previews array)
    setPreviews(prev => prev.filter((_, i) => i !== index));
    
    // Notify parent
    if (onRemoveExisting) {
      onRemoveExisting(fileToRemove);
    }
  };

  // NEW: Handle click on image to view it
  const handleViewFile = (src, index) => {
    if (onViewFile) {
      // Determine if it's an existing file or a new upload
      const isExisting = existingFiles.includes(src);
      const fileName = isExisting ? `Existing ${label}` : `New ${label}`;
      onViewFile(src, `${label} ${index + 1}`);
    }
  };

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <input
        type="file"
        name={name}
        multiple={multiple}
        onChange={handleChange}
        className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-400 outline-none"
      />
      
      {previews.length > 0 && (
        <div className="mt-3">
          <p className="text-sm text-gray-600 mb-2">
            {existingFiles.length > 0 ? "Files (click to view):" : "Selected files:"}
          </p>
          <div className="flex flex-wrap gap-2">
            {previews.map((src, i) => (
              <div key={i} className="relative group">
                {/* Make the image clickable to view */}
                <img 
                  src={src} 
                  alt={`preview-${i}`} 
                  className="h-16 w-16 object-cover rounded border cursor-pointer hover:opacity-80 transition"
                  onClick={() => handleViewFile(src, i)}
                  title="Click to view"
                />
                {/* Remove button - appears on hover */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent triggering view
                    existingFiles.includes(src) ? removeExistingFile(i) : removeFile(i);
                  }}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600 transition shadow-md"
                  title="Remove file"
                >
                  ×
                </button>
                {existingFiles.includes(src) && (
                  <span className="absolute bottom-0 left-0 bg-blue-500 text-white text-[8px] px-1 rounded">
                    Existing
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileInput;