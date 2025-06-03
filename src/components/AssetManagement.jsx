import { useEffect, useState, memo } from "react";
import axiosInstance from "../axiosInstance";
import { useUserContext } from "../context/UserContext";
import InternalNavbar from "./InternalNavbar";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

// ✅ Optimized Memoized Image Component
const AssetImage = memo(({ imgUrl, onClick }) => {
  const optimizedUrl = imgUrl?.includes("/upload/")
    ? imgUrl.replace("/upload/", "/upload/w_300,q_auto,f_auto/")
    : imgUrl;

  return (
    <img
      src={optimizedUrl}
      alt="Asset"
      loading="lazy"
      onClick={onClick}
      onError={(e) => {
        e.target.src = "https://via.placeholder.com/150"; // fallback
      }}
      className="h-12 w-12 object-cover rounded border cursor-pointer"
    />
  );
});

const AssetManagement = ({ hideNavbar }) => {
  const [assets, setAssets] = useState([]);
  const [isEdit, setIsEdit] = useState(false);
  const [editAsset, setEditAsset] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    mobileNumber: "",
    issuedTo: "",
    assets: [{ assetName: "", assetDescription: "" }],
    images: [],
  });
  const [modalImage, setModalImage] = useState(null);

  const { user } = useUserContext();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAssets = async () => {
      try {
        const res = await axiosInstance.get("/assets/all-assets", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        setAssets(res.data);
      } catch (err) {
        console.error("Error fetching assets:", err);
      }
    };

    if (user && (user.role === "admin" || user.role === "accounts")) {
      fetchAssets();
    }
  }, [user]);

  const deleteAsset = async (id) => {
    if (!window.confirm("Are you sure you want to delete this asset?")) return;

    try {
      await axiosInstance.delete(`/assets/delete-asset/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setAssets((prev) => prev.filter((a) => a._id !== id));
      toast.success("Asset deleted successfully!");
    } catch (err) {
      console.error("Error deleting asset:", err);
      toast.error("Failed to delete asset.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const form = new FormData();
      form.append("mobileNumber", formData.mobileNumber);
      form.append("issuedTo", editAsset.issuedTo._id || editAsset.issuedTo);

      const cleanedAssets = formData.assets.map(({ newFiles, ...a }) => a);
      form.append("assets", JSON.stringify(cleanedAssets));

      formData.assets.forEach((a, i) => {
        if (a.newFiles) {
          a.newFiles.forEach((f) => {
            form.append("assetImages", f, `${i}_${f.name}`);
          });
        }
      });

      const config = {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "multipart/form-data",
        },
      };

      await axiosInstance.put(`/assets/update-asset/${editAsset._id}`, form, config);
      toast.success("Asset updated!");

      // Reset form
      setIsEdit(false);
      setEditAsset(null);
      setFormData({
        mobileNumber: "",
        issuedTo: "",
        assets: [{ assetName: "", assetDescription: "", images: [] }],
      });

      const updated = await axiosInstance.get("/assets/all-assets", config);
      setAssets(updated.data);
    } catch (err) {
      console.error("Error updating asset:", err);
      toast.error("Failed to update asset.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (asset) => {
    setIsEdit(true);
    setEditAsset(asset);
    setFormData({
      mobileNumber: asset.mobileNumber,
      issuedTo: asset.issuedTo,
      assets: asset.assets || [],
      images: [],
    });
  };
useEffect(()=>{
      window.scrollTo({ top: 0, behavior: "smooth" });

},[handleEdit])
  return (
    <>
      {!hideNavbar && <InternalNavbar />}

      {isLoading && (
        <div className="fixed inset-0 z-50 bg-black/50 flex justify-center items-center">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin" />
            <p className="text-white mt-4 text-lg">Updating asset...</p>
          </div>
        </div>
      )}

      <div className="min-h-screen bg-gray-50 p-4 sm:p-8 md:p-10 lg:p-14">
        {!hideNavbar && (
          <button
            className="mb-4 hidden md:block bg-blue-600 text-white px-5 py-2 rounded-lg shadow hover:bg-blue-700 transition"
            onClick={() => navigate(-1)}
          >
            ↩️ Back
          </button>
        )}

        {/* Edit Form */}
        {isEdit && (
          <form
            onSubmit={handleSubmit}
            className="bg-white p-6 rounded-lg shadow-md mb-6"
            encType="multipart/form-data"
          >
            <h2 className="text-3xl font-bold text-center mb-6 text-blue-700">Edit Asset</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Mobile Number"
                className="p-3 border rounded-md"
                value={formData.mobileNumber}
                onChange={(e) =>
                  setFormData({ ...formData, mobileNumber: e.target.value })
                }
              />

              {formData.assets.map((asset, index) => (
                <div key={index} className="flex flex-col gap-2 border p-3 rounded-md mb-4">
                  <div className="flex md:flex-row flex-col gap-2 items-center">
                    <input
                      type="text"
                      placeholder="Asset Name"
                      className="p-3 border rounded-md flex-1"
                      value={asset.assetName}
                      onChange={(e) => {
                        const updated = [...formData.assets];
                        updated[index].assetName = e.target.value;
                        setFormData({ ...formData, assets: updated });
                      }}
                    />
                    <input
                      type="text"
                      placeholder="Asset Description"
                      className="p-3 border rounded-md flex-1"
                      value={asset.assetDescription}
                      onChange={(e) => {
                        const updated = [...formData.assets];
                        updated[index].assetDescription = e.target.value;
                        setFormData({ ...formData, assets: updated });
                      }}
                    />
                    <button
                      type="button"
                      className="text-red-600 font-bold text-xl hover:text-red-800"
                      onClick={() => {
                        const updated = formData.assets.filter((_, i) => i !== index);
                        setFormData({ ...formData, assets: updated });
                      }}
                    >
                      ×
                    </button>
                  </div>

                  {/* Image thumbnails */}
                  <div className="flex gap-2 flex-wrap mt-2">
                    {asset.images?.length ? (
                      asset.images.map((imgUrl, imgIndex) => (
                        <div key={imgIndex} className="relative inline-block">
                          <AssetImage imgUrl={imgUrl} onClick={() => setModalImage(imgUrl)} />
                          <button
                            type="button"
                            className="absolute top-0 right-0 bg-red-600 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center hover:bg-red-700"
                            onClick={() => {
                              const updated = [...formData.assets];
                              updated[index].images = updated[index].images.filter(
                                (_, i) => i !== imgIndex
                              );
                              setFormData({ ...formData, assets: updated });
                            }}
                          >
                            ×
                          </button>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">No images</p>
                    )}
                  </div>

                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    className="mt-2 bg-[#fe0] p-1"
                    onChange={(e) => {
                      const files = Array.from(e.target.files);
                      const updated = [...formData.assets];
                      updated[index].newFiles = files;
                      setFormData({ ...formData, assets: updated });
                    }}
                  />
                </div>
              ))}

              <button
                type="button"
                className="mt-2 bg-green-500 text-white px-4 py-1 rounded hover:bg-green-600"
                onClick={() =>
                  setFormData({
                    ...formData,
                    assets: [...formData.assets, { assetName: "", assetDescription: "" }],
                  })
                }
              >
                ➕ Add Asset
              </button>
            </div>

            <button
              type="submit"
              className="mt-4 bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Update Asset
            </button>
          </form>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <h1 className="text-3xl md:text-4xl font-bold text-center mb-6">All Employees with Assets:</h1>
          <table className="min-w-full bg-white rounded-lg shadow-md table-auto">
            <thead className="bg-gray-200 text-gray-700">
              <tr>
                <th className="py-3 px-4 text-left text-sm font-semibold">Employee Name</th>
                <th className="py-3 px-4 text-left text-sm font-semibold">Designation</th>
                <th className="py-3 px-4 text-center text-sm font-semibold">Assets</th>
                <th className="py-3 px-4 text-center text-sm font-semibold">Mobile</th>
                <th className="py-3 px-4 text-left text-sm font-semibold">Email</th>
                <th className="py-3 px-4 text-left text-sm font-semibold">Assigned</th>
                <th className="py-3 px-4 text-left text-sm font-semibold">Updated</th>
                <th className="py-3 px-4 text-left text-sm font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {assets.map((asset) => (
                <tr key={asset._id} className="hover:bg-gray-50 transition">
                  <td className="py-3 px-4 text-sm capitalize">{asset.issuedTo?.name}</td>
                  <td className="py-3 px-4 text-sm capitalize">{asset.issuedTo?.role}</td>
                  <td className="py-3 px-4 text-sm">
                    {asset.assets?.map((a, i) => (
                      <div key={i} className="mb-1">
                        <strong>{a.assetName}:</strong> {a.assetDescription}
                        <div className="flex gap-2 mt-1 flex-wrap">
                          {a.images?.map((imgUrl, idx) => (
                            <AssetImage
                              key={idx}
                              imgUrl={imgUrl}
                              onClick={() => setModalImage(imgUrl)}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </td>
                  <td className="py-3 px-4 text-sm">{asset.mobileNumber}</td>
                  <td className="py-3 px-4 text-sm">{asset.issuedTo?.email}</td>
                  <td className="py-3 px-4 text-sm">{new Date(asset.createdAt).toLocaleString()}</td>
                  <td className="py-3 px-4 text-sm">{new Date(asset.updatedAt).toLocaleString()}</td>
                  <td className="py-3 px-4 text-sm">
                    <div className="flex flex-col md:flex-row gap-2">
                      <button
                        onClick={() => handleEdit(asset)}
                        className="bg-yellow-500 text-white px-4 py-1 rounded hover:bg-yellow-600"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteAsset(asset._id)}
                        className="bg-red-600 text-white px-4 py-1 rounded hover:bg-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Modal Image Viewer */}
        {modalImage && (
          <div
            className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50 cursor-pointer"
            onClick={() => setModalImage(null)}
          >
            <img
              src={modalImage}
              alt="Asset Preview"
              className="max-w-full max-h-full rounded shadow-lg"
            />
          </div>
        )}
      </div>
    </>
  );
};

export default AssetManagement;
