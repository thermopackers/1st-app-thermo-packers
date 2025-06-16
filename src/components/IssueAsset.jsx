import { useState, useEffect } from 'react';
import axiosInstance from '../axiosInstance';
import InternalNavbar from './InternalNavbar';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ClipLoader } from 'react-spinners';

const IssueAsset = () => {
  const navigate = useNavigate();

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
    newAssets[index].images = [...newAssets[index].images, ...files];
    setFormData(prev => ({ ...prev, assets: newAssets }));
  };

  // Remove a specific image from an asset by assetIndex and imageIndex
  const removeImage = (assetIndex, imgIndex) => {
    const newAssets = [...formData.assets];
    newAssets[assetIndex].images = newAssets[assetIndex].images.filter((_, i) => i !== imgIndex);
    setFormData(prev => ({ ...prev, assets: newAssets }));
  };

  // Basic validation before submit
  const validateForm = () => {
    if (
      !formData.issuedTo
    ) {
      setFormError('Please fill all required fields');
      return false;
    }
    if (
      formData.assets.length === 0 ||
      formData.assets.some(a => !a.assetName.trim())
    ) {
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
      <div className="min-h-screen bg-gray-50 p-6 md:p-10 lg:p-14">
        <button
          className="fixed hidden md:block left-4 cursor-pointer bg-blue-500 text-white px-4 py-2 rounded-md shadow-md hover:bg-blue-600 back-button"
          onClick={() => navigate(-1)}
        >
          ↩️ Back
        </button>

        <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center">Issue Assets</h2>

        <form
          onSubmit={handleSubmit}
          className="max-w-4xl mx-auto bg-white p-8 rounded shadow grid gap-6"
          noValidate
        >
          {/* Employee Details */}

          <div>
  <label className="block mb-1 font-medium">Assign to User *</label>
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
    className="w-full p-3 border border-gray-400 rounded"
    required
  >
    <option value="">-- Select User --</option>
    {users.map(user => (
      <option key={user._id} value={user._id}>
        {user.name} ({user.email})
      </option>
    ))}
    <option value="manual">Other (Not in List)</option>
  </select>

  {formData.issuedTo === 'manual' && (
    <div className="mt-3">
      <label className="block mb-1 font-medium">Enter Name or Email of User *</label>
      <input
        type="text"
        name="manualUser"
        value={formData.manualUser}
        onChange={handleInputChange}
        className="w-full p-3 border border-gray-400 rounded"
        placeholder="Enter name/email"
        required
      />
    </div>
  )}
</div>


          {/* Dynamic Asset List */}
          <div>
            <h3 className="text-xl font-semibold mb-4">Assets to Issue *</h3>
            {formData.assets.map((asset, idx) => (
              <div key={idx} className="flex flex-col gap-4 mb-6 border p-4 rounded shadow-sm">
                <div className="flex gap-4 items-end">
                  <div className="flex-1">
                    <label className="block mb-1 font-medium">Asset Name *</label>
                    <input
                      type="text"
                      name="assetName"
                      value={asset.assetName}
                      onChange={(e) => handleAssetChange(idx, e)}
                      placeholder="E.g., Laptop, Mobile Phone"
                      className="w-full p-3 border border-gray-400 rounded"
                      required
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block mb-1 font-medium">Description</label>
                    <input
                      type="text"
                      name="assetDescription"
                      value={asset.assetDescription}
                      onChange={(e) => handleAssetChange(idx, e)}
                      placeholder="Optional description or serial number"
                      className="w-full p-3 border border-gray-400 rounded"
                    />
                  </div>
                  {formData.assets.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeAsset(idx)}
                      className="text-red-600 font-bold px-2 py-1 rounded hover:bg-red-100"
                      aria-label={`Remove asset ${idx + 1}`}
                    >
                      &times;
                    </button>
                  )}
                </div>

                {/* Images preview and upload */}
                <div>
                  <label className="block mb-2 font-medium">Images</label>

                  {/* Thumbnails */}
                  <div className="flex gap-2 flex-wrap mb-2">
                    {asset.images.map((imgFile, i) => {
                      const imgUrl = URL.createObjectURL(imgFile);
                      return (
                        <div key={i} className="relative w-24 h-24 border rounded overflow-hidden">
                          <img
                            src={imgUrl}
                            alt={`asset-${idx}-img-${i}`}
                            className="w-full h-full object-cover"
                            onLoad={() => URL.revokeObjectURL(imgUrl)} // revoke URL after load
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(idx, i)}
                            className="absolute top-0 right-0 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-700"
                            aria-label="Remove image"
                          >
                            &times;
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  {/* Upload more images */}
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => {
                      const files = Array.from(e.target.files);
                      addImages(idx, files);
                      // Clear the input value so same files can be selected again if needed
                      e.target.value = null;
                    }}
                    className="block bg-yellow-200 cursor-pointer w-full p-1"
                  />
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={addAsset}
              className="bg-green-600 cursor-pointer text-white px-4 py-2 rounded hover:bg-green-700"
            >
              + Add Another Asset
            </button>
          </div>

          {formError && (
            <p className="text-center text-red-600 font-semibold">{formError}</p>
          )}

          <button
            type="submit"
            className={`mt-6 w-full bg-blue-600 font-bold text-white py-3 rounded hover:bg-blue-700 flex justify-center items-center gap-2 ${
              isSubmitting ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'
            }`}
            disabled={loadingUsers || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <ClipLoader size={20} color="#fff" />
                Issuing...
              </>
            ) : (
              'Issue Assets'
            )}
          </button>
        </form>
      </div>
    </>
  );
};

export default IssueAsset;
