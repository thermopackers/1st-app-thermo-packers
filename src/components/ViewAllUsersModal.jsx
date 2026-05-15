import { useState, useEffect } from "react";
import axiosInstance from "../axiosInstance";
import { motion, AnimatePresence } from "framer-motion";

export default function ViewAllUsersModal({ onClose }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [enlargedImage, setEnlargedImage] = useState(null);
  const [currentUserImage, setCurrentUserImage] = useState(null);

  useEffect(() => {
    fetchAllUsers();
  }, []);

  const fetchAllUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      // First try to get all users without pagination
      let allUsers = [];
      
      // Try the /all endpoint first (might have all users)
      try {
        const response = await axiosInstance.get("/users/all", {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (response.data && Array.isArray(response.data)) {
          allUsers = response.data;
        }
      } catch (err) {
        console.log("/users/all failed, trying paginated endpoint");
        
        // If /all fails, use pagination to get all users
        let page = 1;
        let hasMore = true;
        
        while (hasMore) {
          try {
            const paginatedResponse = await axiosInstance.get(
              `/users/all-user-pagination?page=${page}&limit=100`,
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            );
            
            if (paginatedResponse.data && paginatedResponse.data.users) {
              allUsers = [...allUsers, ...paginatedResponse.data.users];
              hasMore = paginatedResponse.data.pagination?.hasNext || false;
              page++;
            } else {
              hasMore = false;
            }
          } catch (err) {
            console.error("Error fetching paginated users:", err);
            hasMore = false;
          }
        }
      }
      
      // Filter users that have at least one image (profile or front face)
      // But also include users without images, just mark them differently
      const usersWithInfo = allUsers.map(user => ({
        ...user,
        hasImages: !!(user.profilePicture || user.frontFacePicture)
      }));
      
      // Sort: users with images first, then by name
      usersWithInfo.sort((a, b) => {
        if (a.hasImages === b.hasImages) {
          return (a.name || "").localeCompare(b.name || "");
        }
        return a.hasImages ? -1 : 1;
      });
      
      setUsers(usersWithInfo);
    } catch (err) {
      console.error("Error fetching users:", err);
      setError("Failed to load users. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleImageClick = (imageUrl, userName, imageType) => {
    if (imageUrl) {
      setEnlargedImage(imageUrl);
      setCurrentUserImage({ name: userName, type: imageType });
    }
  };

  const closeEnlarged = () => {
    setEnlargedImage(null);
    setCurrentUserImage(null);
  };

  // Count users with images
  const usersWithImages = users.filter(u => u.hasImages).length;

  return (
    <>
      <div className="modal-overlay" onClick={onClose}>
        <div className="users-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>
              👥 All Employees ({users.length} total)
            </h2>
            <button className="close-modal" onClick={onClose}>
              ×
            </button>
          </div>
          <div className="modal-body">
            {loading ? (
              <div className="loading-users">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                  <p>Loading employees...</p>
                </div>
              </div>
            ) : error ? (
              <div className="error-message">
                <p>⚠️ {error}</p>
                <button
                  onClick={fetchAllUsers}
                  className="mt-3 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  Try Again
                </button>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No employees found.</p>
              </div>
            ) : (
              <>
                {usersWithImages < users.length && (
                  <div className="mb-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
                    ℹ️ Showing {usersWithImages} employees with photos out of {users.length} total employees
                  </div>
                )}
                <div className="users-grid">
                  {users.map((user) => (
                    <motion.div
                      key={user._id}
                      className={`user-card ${!user.hasImages ? 'opacity-60' : ''}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="user-images">
                        {/* Profile Picture */}
                        <div
                          className="profile-image-container"
                          onClick={() =>
                            user.profilePicture &&
                            handleImageClick(
                              user.profilePicture,
                              user.name,
                              "Profile Picture"
                            )
                          }
                          style={{ cursor: user.profilePicture ? 'pointer' : 'default' }}
                        >
                          {user.profilePicture ? (
                            <>
                              <img
                                src={user.profilePicture}
                                alt={`${user.name} profile`}
                                className="user-image"
                              />
                              <span className="image-label">Profile</span>
                            </>
                          ) : (
                            <div className="no-images flex flex-col items-center justify-center">
                              <span className="text-2xl mb-1">📷</span>
                              <span className="text-xs">No Profile</span>
                            </div>
                          )}
                        </div>

                        {/* Front Face Picture */}
                        <div
                          className="front-face-container"
                          onClick={() =>
                            user.frontFacePicture &&
                            handleImageClick(
                              user.frontFacePicture,
                              user.name,
                              "Front Face"
                            )
                          }
                          style={{ cursor: user.frontFacePicture ? 'pointer' : 'default' }}
                        >
                          {user.frontFacePicture ? (
                            <>
                              <img
                                src={user.frontFacePicture}
                                alt={`${user.name} front face`}
                                className="user-image"
                              />
                              <span className="image-label">Front Face</span>
                            </>
                          ) : (
                            <div className="no-images flex flex-col items-center justify-center">
                              <span className="text-2xl mb-1">👤</span>
                              <span className="text-xs">No Front Face</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="user-info">
                        <h3 className="user-name">{user.name || 'Unknown'}</h3>
                        {user.designation && (
                          <p className="text-xs text-gray-500 mt-1">
                            {user.designation}
                          </p>
                        )}
                        {user.email && (
                          <p className="text-xs text-gray-400 mt-1 truncate">
                            {user.email}
                          </p>
                        )}
                        {user.phone && (
                          <p className="text-xs text-gray-400 mt-1">
                            {user.phone}
                          </p>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Enlarged Image Modal */}
      <AnimatePresence>
        {enlargedImage && (
          <motion.div
            className="enlarged-modal"
            onClick={closeEnlarged}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div
              className="enlarged-image-container"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={enlargedImage}
                alt={currentUserImage?.name}
                className="enlarged-image"
              />
              <button className="enlarged-close" onClick={closeEnlarged}>
                ×
              </button>
              {currentUserImage && (
                <div className="image-caption">
                  {currentUserImage.name} - {currentUserImage.type}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}