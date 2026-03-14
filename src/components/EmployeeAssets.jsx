import { useEffect, useState } from "react";
import axiosInstance from "../axiosInstance";
import InternalNavbar from "./InternalNavbar";
import { useNavigate } from "react-router-dom";
import { useUserContext } from "../context/UserContext";
import AssetManagement from "./AssetManagement";
import { FaArrowLeft, FaImage, FaBox, FaCalendarAlt, FaUser, FaEnvelope, FaBriefcase } from "react-icons/fa";

// ✅ Add the parseUserRoles function here too
const parseUserRoles = (user) => {
  if (!user || !user.role) {
    return [];
  }
  
  if (Array.isArray(user.role)) {
    if (user.role.length === 1 && typeof user.role[0] === 'string') {
      return user.role;
    }
    return user.role;
  }
  
  return [user.role];
};

const EmployeeAssets = () => {
  const { user } = useUserContext();
  const [assets, setAssets] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const navigate = useNavigate();

  // ✅ Parse user roles
  const userRoles = user ? parseUserRoles(user) : [];

  // Responsive detection
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchAssets = async () => {
      try {
        const response = await axiosInstance.get("/assets/my-assets", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        setAssets(response.data);
        setLoading(false);
      } catch (err) {
        setError("Failed to fetch assets");
        setLoading(false);
        console.error(err);
      }
    };

    fetchAssets();
  }, []);

  // Loading component
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg font-medium">Loading your assets...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl w-full max-h-[90vh]">
            <img
              src={selectedImage}
              alt="Preview"
              className="w-full h-auto max-h-[80vh] object-contain rounded-2xl shadow-2xl"
            />
            <button
              className="absolute top-4 right-4 bg-red-500 hover:bg-red-600 text-white w-10 h-10 rounded-full flex items-center justify-center text-xl font-bold transition-all duration-200 transform hover:scale-110 shadow-lg"
              onClick={() => setSelectedImage(null)}
            >
              ×
            </button>
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-4 py-2 rounded-lg text-sm">
              Click anywhere to close
            </div>
          </div>
        </div>
      )}

      <InternalNavbar />

      {/* Main Content */}
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-xl shadow-lg transition-all duration-200 flex items-center gap-2 font-medium transform hover:scale-105"
              >
                <FaArrowLeft className="text-lg" />
                {isMobile ? "" : "Back"}
              </button>
              
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  💼 My Issued Assets
                </h1>
                <p className="text-gray-600 mt-2">
                  Manage and view all assets assigned to you
                </p>
              </div>
            </div>

            {/* Stats Summary */}
            {assets.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-4 border border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 p-3 rounded-xl">
                    <FaBox className="text-blue-600 text-xl" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-800">{assets.length}</p>
                    <p className="text-sm text-gray-600">Total Asset Records</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="bg-red-100 p-2 rounded-lg">
                  <span className="text-red-600 text-lg">⚠️</span>
                </div>
                <p className="text-red-700 font-medium">{error}</p>
              </div>
            </div>
          )}

          {/* ✅ FIXED: Use userRoles instead of user.role */}
          {!userRoles.includes("admin") ? (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              {/* Table Header for Desktop */}
              {!isMobile && assets.length > 0 && (
                <div className="hidden lg:grid grid-cols-12 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4 font-semibold text-sm">
                  <div className="col-span-2 flex items-center gap-2">
                    <FaUser />
                    Employee
                  </div>
                  <div className="col-span-2 flex items-center gap-2">
                    <FaBriefcase />
                    Designation
                  </div>
                  <div className="col-span-4 flex items-center gap-2">
                    <FaBox />
                    Assets & Images
                  </div>
                  <div className="col-span-2 flex items-center gap-2">
                    <FaEnvelope />
                    Email
                  </div>
                  <div className="col-span-2 flex items-center gap-2">
                    <FaCalendarAlt />
                    Issued Date
                  </div>
                </div>
              )}

              {/* Assets List */}
              <div className="divide-y divide-gray-200">
                {assets.length > 0 ? (
                  assets.map((asset, index) => (
                    <div
                      key={index}
                      className="hover:bg-gray-50 transition-all duration-200 p-4 lg:p-6"
                    >
                      {/* Mobile Card View */}
                      {isMobile ? (
                        <div className="space-y-4">
                          {/* Header */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="bg-blue-100 p-2 rounded-lg">
                                <FaUser className="text-blue-600" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-gray-800 capitalize">
                                  {typeof asset.issuedTo === "object" ? asset.issuedTo.name : asset.issuedTo}
                                </h3>
                                <p className="text-sm text-gray-600 capitalize">
                                  {typeof asset.issuedTo === "object" ? asset.issuedTo.role : "—"}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-500">Issued</p>
                              <p className="text-sm font-medium text-gray-700">
                                {new Date(asset.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>

                          {/* Email */}
                          <div className="flex items-center gap-2 text-sm">
                            <FaEnvelope className="text-gray-400" />
                            <span className="text-gray-600">
                              {typeof asset.issuedTo === "object" ? asset.issuedTo.email : "—"}
                            </span>
                          </div>

                          {/* Assets List */}
                          <div className="space-y-3">
                            <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                              <FaBox />
                              Assets ({asset.assets.length})
                            </h4>
                            {asset.assets.map((item, itemIndex) => (
                              <div key={itemIndex} className="bg-gray-50 rounded-xl p-3">
    <div className="mb-2">
      <div className="flex items-center gap-2 flex-wrap">
        <h5 className="font-semibold text-gray-800 capitalize">
          {item.assetName}
        </h5>
        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
          Added: {item.addedAt ? new Date(item.addedAt).toLocaleDateString() : new Date(asset.createdAt).toLocaleDateString()}
        </span>
      </div>
      <p className="text-sm text-gray-600">
        {item.assetDescription}
      </p>
    </div>

                                {/* Images */}
                                {item.images && item.images.length > 0 && (
                                  <div>
                                    <div className="flex items-center gap-2 mb-2">
                                      <FaImage className="text-gray-400" />
                                      <span className="text-sm text-gray-600">
                                        {item.images.length} image(s)
                                      </span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                      {item.images.map((img, imgIndex) => {
                                        const optimizedImg = img.replace(
                                          "/upload/",
                                          "/upload/w_200,q_auto,f_auto/"
                                        );
                                        return (
                                          <div
                                            key={imgIndex}
                                            className="relative aspect-square rounded-lg overflow-hidden cursor-pointer transform hover:scale-105 transition-transform duration-200"
                                            onClick={() => setSelectedImage(img)}
                                          >
                                            <img
                                              src={optimizedImg}
                                              alt={`${item.assetName} - ${imgIndex + 1}`}
                                              className="w-full h-full object-cover"
                                              loading="lazy"
                                              onError={(e) => {
                                                e.target.style.display = "none";
                                                e.target.nextSibling.style.display = "flex";
                                              }}
                                            />
                                            <div className="absolute inset-0 bg-gray-100 hidden items-center justify-center">
                                              <FaImage className="text-gray-400 text-xl" />
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        /* Desktop Table View */
                        <div className="grid grid-cols-12 gap-4 items-start">
                          {/* Employee Name */}
                          <div className="col-span-2">
                            <div className="flex items-center gap-3">
                              <div className="bg-blue-100 p-2 rounded-lg">
                                <FaUser className="text-blue-600 text-sm" />
                              </div>
                              <div>
                                <p className="font-semibold text-gray-800 capitalize">
                                  {typeof asset.issuedTo === "object" ? asset.issuedTo.name : asset.issuedTo}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Designation */}
                          <div className="col-span-2">
                            <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-medium capitalize">
                              {typeof asset.issuedTo === "object" ? asset.issuedTo.role : "—"}
                            </span>
                          </div>

                          {/* Assets */}
                          <div className="col-span-4">
                            <div className="space-y-3">
                              {asset.assets.map((item, itemIndex) => (
                                <div key={itemIndex} className="bg-gray-50 rounded-lg p-3">
    <div className="mb-2">
      <div className="flex items-center gap-2 flex-wrap">
        <h5 className="font-semibold text-gray-800 capitalize text-sm">
          {item.assetName}
        </h5>
        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
          {item.addedAt ? new Date(item.addedAt).toLocaleDateString() : new Date(asset.createdAt).toLocaleDateString()}
        </span>
      </div>
      <p className="text-xs text-gray-600">
        {item.assetDescription}
      </p>
    </div>

                                  {/* Images */}
                                  {item.images && item.images.length > 0 && (
                                    <div className="flex flex-wrap gap-1">
                                      {item.images.map((img, imgIndex) => {
                                        const optimizedImg = img.replace(
                                          "/upload/",
                                          "/upload/w_80,q_auto,f_auto/"
                                        );
                                        return (
                                          <img
                                            key={imgIndex}
                                            src={optimizedImg}
                                            alt={`${item.assetName} - ${imgIndex + 1}`}
                                            className="w-12 h-12 object-cover rounded cursor-pointer hover:scale-110 transition-transform duration-200 border border-gray-300"
                                            onClick={() => setSelectedImage(img)}
                                            loading="lazy"
                                            onError={(e) => {
                                              e.target.style.display = "none";
                                            }}
                                          />
                                        );
                                      })}
                                      {item.images.length > 4 && (
                                        <div className="w-12 h-12 bg-blue-100 rounded flex items-center justify-center text-blue-600 text-xs font-medium">
                                          +{item.images.length - 4}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Email */}
                          <div className="col-span-2">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <FaEnvelope className="text-gray-400" />
                              <span className="truncate">
                                {typeof asset.issuedTo === "object" ? asset.issuedTo.email : "—"}
                              </span>
                            </div>
                          </div>

                          {/* Issued Date */}
                          <div className="col-span-2">
                            <div className="flex items-center gap-2 text-sm">
                              <FaCalendarAlt className="text-gray-400" />
                              <span className="text-gray-700 font-medium">
                                {new Date(asset.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  /* Empty State */
                  <div className="text-center py-12">
                    <div className="bg-gray-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FaBox className="text-gray-400 text-3xl" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-600 mb-2">
                      No Assets Found
                    </h3>
                    <p className="text-gray-500 max-w-md mx-auto">
                      You haven't been assigned any assets yet. Assets assigned to you will appear here.
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Admin View */
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                  <FaBriefcase className="text-blue-600" />
                  Asset Management Dashboard
                </h2>
                <p className="text-gray-600 mt-2">
                  Administrative view for managing all company assets
                </p>
              </div>
              <AssetManagement hideNavbar={true} />
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default EmployeeAssets;