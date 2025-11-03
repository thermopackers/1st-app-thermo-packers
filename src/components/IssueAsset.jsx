import { useState, useEffect } from 'react';
import axiosInstance from '../axiosInstance';
import InternalNavbar from './InternalNavbar';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { 
  FaArrowLeft, 
  FaPlus, 
  FaTrash, 
  FaImage, 
  FaUpload, 
  FaUser, 
  FaBox, 
  FaSpinner,
  FaCheckCircle,
  FaExclamationTriangle
} from 'react-icons/fa';

const IssueAsset = () => {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Form state with employee info + dynamic assets array
  const [formData, setFormData] = useState({
    issuedTo: '',
    manualUser: '',
    assets: [
      { assetName: '', assetDescription: '', images: [] }
    ],
  });

  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreviews, setImagePreviews] = useState({});
console.log("usersdd",users);

  // Responsive detection
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const res = await axiosInstance.get('/users/get-all-users');
        setUsers(res.data);
      } catch (error) {
        toast.error('Failed to load users');
      } finally {
        setLoadingUsers(false);
      }
    }
    fetchUsers();
  }, []);

  // Handle input change for text inputs
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle dynamic asset field changes
  const handleAssetChange = (index, e) => {
    const { name, value } = e.target;
    const newAssets = [...formData.assets];
    newAssets[index][name] = value;
    setFormData(prev => ({ ...prev, assets: newAssets }));
  };

  // Add another asset input row
  const addAsset = () => {
    setFormData(prev => ({
      ...prev,
      assets: [...prev.assets, { assetName: '', assetDescription: '', images: [] }],
    }));
  };

  // Remove asset input row by index
  const removeAsset = (index) => {
    const newAssets = formData.assets.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, assets: newAssets }));
  };

  // Add images for a specific asset (append to existing)
  const addImages = (index, files) => {
    const newAssets = [...formData.assets];
    const newImages = [...newAssets[index].images, ...files];
    newAssets[index].images = newImages;
    setFormData(prev => ({ ...prev, assets: newAssets }));

    // Create preview URLs
    const newPreviews = { ...imagePreviews };
    files.forEach(file => {
      const previewUrl = URL.createObjectURL(file);
      if (!newPreviews[index]) newPreviews[index] = [];
      newPreviews[index].push(previewUrl);
    });
    setImagePreviews(newPreviews);
  };

  // Remove a specific image from an asset by assetIndex and imageIndex
  const removeImage = (assetIndex, imgIndex) => {
    const newAssets = [...formData.assets];
    newAssets[assetIndex].images = newAssets[assetIndex].images.filter((_, i) => i !== imgIndex);
    setFormData(prev => ({ ...prev, assets: newAssets }));

    // Clean up preview URL
    const newPreviews = { ...imagePreviews };
    if (newPreviews[assetIndex]?.[imgIndex]) {
      URL.revokeObjectURL(newPreviews[assetIndex][imgIndex]);
      newPreviews[assetIndex] = newPreviews[assetIndex].filter((_, i) => i !== imgIndex);
      setImagePreviews(newPreviews);
    }
  };

  // Clean up preview URLs on unmount
  useEffect(() => {
    return () => {
      Object.values(imagePreviews).forEach(previewArray => {
        previewArray.forEach(url => URL.revokeObjectURL(url));
      });
    };
  }, [imagePreviews]);

  // Basic validation before submit
  const validateForm = () => {
    if (!formData.issuedTo) {
      setFormError('Please select or enter a user');
      return false;
    }

    if (formData.issuedTo === 'manual' && !formData.manualUser.trim()) {
      setFormError('Please enter the name or email for the manual user');
      return false;
    }

    if (formData.assets.length === 0 || formData.assets.some(a => !a.assetName.trim())) {
      setFormError('Please add at least one asset with a name');
      return false;
    }

    setFormError('');
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);

    const form = new FormData();
    form.append('issuedTo', formData.issuedTo || '');
    form.append('manualUser', formData.manualUser || '');

    const assetsToSend = formData.assets.map((asset, index) => {
      asset.images.forEach((file, fileIdx) => {
        form.append('assetImages', file, `${index}_${fileIdx}_${file.name}`);
      });
      return {
        assetName: asset.assetName,
        assetDescription: asset.assetDescription,
      };
    });

    form.append('assets', JSON.stringify(assetsToSend));

    try {
      const res = await axiosInstance.post('/assets/issue', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data?.success === false) {
        toast.error(res.data.message || 'Asset issue failed.');
        setIsSubmitting(false);
        return;
      }

      toast.success('Assets issued successfully!');
      navigate('/asset-management');
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to issue assets. Please try again.';
      toast.error(message);
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <InternalNavbar />
      
      {/* Main Container */}
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          
          {/* Header Section */}
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={() => navigate(-1)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-xl shadow-lg transition-all duration-200 flex items-center gap-2 font-medium transform hover:scale-105"
            >
              <FaArrowLeft className="text-lg" />
              {isMobile ? "" : "Back"}
            </button>
            
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                📦 Issue Assets
              </h1>
              <p className="text-gray-600 mt-2">
                Assign assets to employees or external users
              </p>
            </div>
          </div>

          {/* Form Container */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-3">
                <FaBox className="text-lg" />
                Asset Issue Form
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-8" noValidate>
              
              {/* User Selection Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <FaUser className="text-blue-600 text-lg" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800">Assign To</h3>
                </div>

                <div className="grid gap-4">
                  {/* User Dropdown */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select User <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="issuedTo"
                      value={formData.issuedTo}
                      onChange={(e) => {
                        setFormData(prev => ({
                          ...prev,
                          issuedTo: e.target.value,
                          manualUser: e.target.value === 'manual' ? '' : prev.manualUser
                        }));
                      }}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                      required
                      disabled={loadingUsers}
                    >
                      <option value="">-- Select a User --</option>
                      {users.map(user => (
                       <option key={user._id} value={user._id}>
  {user.name} ({user.email}) - {Array.isArray(user.role) ? user.role.join(', ') : user.role}
</option>
                      ))}
                      <option value="manual">➕ Other (Not in List)</option>
                    </select>
                    {loadingUsers && (
                      <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                        <FaSpinner className="animate-spin" />
                        Loading users...
                      </div>
                    )}
                  </div>

                  {/* Manual User Input */}
                  {formData.issuedTo === 'manual' && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Enter Name or Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="manualUser"
                        value={formData.manualUser}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-yellow-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200 bg-white"
                        placeholder="Enter name or email address"
                        required
                      />
                      <p className="text-sm text-yellow-700 mt-2 flex items-center gap-2">
                        <FaExclamationTriangle />
                        This will create a manual user entry
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Assets Section */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-green-100 p-2 rounded-lg">
                      <FaBox className="text-green-600 text-lg" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800">
                      Assets to Issue <span className="text-red-500">*</span>
                    </h3>
                  </div>
                  <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                    {formData.assets.length} asset(s)
                  </span>
                </div>

                {/* Assets List */}
                <div className="space-y-6">
                  {formData.assets.map((asset, idx) => (
                    <div key={idx} className="bg-gray-50 border border-gray-200 rounded-2xl p-6 transition-all duration-200 hover:border-gray-300">
                      
                      {/* Asset Header */}
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                          <FaBox className="text-gray-400" />
                          Asset #{idx + 1}
                        </h4>
                        {formData.assets.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeAsset(idx)}
                            className="text-red-600 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-colors duration-200"
                            aria-label={`Remove asset ${idx + 1}`}
                          >
                            <FaTrash />
                          </button>
                        )}
                      </div>

                      {/* Asset Fields */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Asset Name <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            name="assetName"
                            value={asset.assetName}
                            onChange={(e) => handleAssetChange(idx, e)}
                            placeholder="E.g., Laptop, Mobile Phone, Monitor"
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Description
                          </label>
                          <input
                            type="text"
                            name="assetDescription"
                            value={asset.assetDescription}
                            onChange={(e) => handleAssetChange(idx, e)}
                            placeholder="Serial number, model, or details"
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                          />
                        </div>
                      </div>

                      {/* Images Section */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                          <FaImage className="text-gray-400" />
                          Images ({asset.images.length})
                        </label>

                        {/* Image Previews */}
                        {asset.images.length > 0 && (
                          <div className="mb-4">
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                              {asset.images.map((imgFile, i) => {
                                const previewUrl = imagePreviews[idx]?.[i];
                                return (
                                  <div key={i} className="relative group">
                                    <div className="aspect-square rounded-xl overflow-hidden border border-gray-300 bg-gray-100">
                                      {previewUrl && (
                                        <img
                                          src={previewUrl}
                                          alt={`asset-${idx}-img-${i}`}
                                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                        />
                                      )}
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => removeImage(idx, i)}
                                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors duration-200 opacity-0 group-hover:opacity-100 shadow-lg"
                                      aria-label="Remove image"
                                    >
                                      <FaTrash className="text-xs" />
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* File Upload */}
                        <div className="border-2 border-dashed border-gray-300 rounded-2xl p-6 text-center hover:border-blue-400 transition-colors duration-200 bg-gray-50">
                          <FaUpload className="text-gray-400 text-2xl mx-auto mb-3" />
                          <p className="text-sm text-gray-600 mb-3">
                            Drag & drop images or click to browse
                          </p>
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={(e) => {
                              const files = Array.from(e.target.files);
                              if (files.length > 0) {
                                addImages(idx, files);
                              }
                              e.target.value = null;
                            }}
                            className="hidden"
                            id={`asset-images-${idx}`}
                          />
                          <label
                            htmlFor={`asset-images-${idx}`}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg cursor-pointer transition-colors duration-200 inline-flex items-center gap-2 font-medium"
                          >
                            <FaUpload />
                            Choose Images
                          </label>
                          <p className="text-xs text-gray-500 mt-2">
                            Supports JPG, PNG, WebP • Max 10MB per file
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add Another Asset Button */}
                <button
                  type="button"
                  onClick={addAsset}
                  className="w-full border-2 border-dashed border-gray-300 hover:border-blue-400 rounded-2xl p-6 text-center transition-all duration-200 hover:bg-blue-50 group"
                >
                  <div className="flex items-center justify-center gap-3">
                    <div className="bg-blue-100 group-hover:bg-blue-200 p-3 rounded-full transition-colors duration-200">
                      <FaPlus className="text-blue-600 group-hover:text-blue-700" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-gray-800">Add Another Asset</p>
                      <p className="text-sm text-gray-600">Click to add more assets to this issue</p>
                    </div>
                  </div>
                </button>
              </div>

              {/* Error Message */}
              {formError && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
                  <div className="flex items-center gap-3">
                    <FaExclamationTriangle className="text-red-500 text-lg" />
                    <p className="text-red-700 font-medium">{formError}</p>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-6 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={loadingUsers || isSubmitting}
                  className={`w-full py-4 px-6 rounded-xl font-bold text-white transition-all duration-200 flex items-center justify-center gap-3 ${
                    isSubmitting || loadingUsers
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 shadow-lg'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <FaSpinner className="animate-spin" />
                      Issuing Assets...
                    </>
                  ) : loadingUsers ? (
                    <>
                      <FaSpinner className="animate-spin" />
                      Loading Users...
                    </>
                  ) : (
                    <>
                      <FaCheckCircle />
                      Issue Assets
                    </>
                  )}
                </button>
                
                {/* Form Help Text */}
                <p className="text-center text-gray-500 text-sm mt-4">
                  All fields marked with <span className="text-red-500">*</span> are required
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default IssueAsset;