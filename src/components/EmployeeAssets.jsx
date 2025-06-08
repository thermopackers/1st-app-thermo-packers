import { useEffect, useState } from "react";
import axiosInstance from "../axiosInstance";
import InternalNavbar from "./InternalNavbar";
import { useNavigate } from "react-router-dom";
import { useUserContext } from "../context/UserContext";
import AssetManagement from "./AssetManagement";

const EmployeeAssets = () => {
  const { user } = useUserContext();

  const [assets, setAssets] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="loader">Loading...</div>
      </div>
    );
  }

  return (
    <>
      {selectedImage && (
        <div
          className="fixed inset-0 bg-[#000000de] bg-opacity-70 flex items-center justify-center z-50"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-3xl w-full p-4">
            <img
              src={selectedImage}
              alt="Preview"
              className="w-full h-auto rounded-xl shadow-lg"
            />
            <button
              className="absolute top-2 right-2 text-white text-3xl font-bold"
              onClick={() => setSelectedImage(null)}
            >
              &times;
            </button>
          </div>
        </div>
      )}
      <InternalNavbar />

      <div className="p-4 w-full mx-auto mt-6">
        <button
          className="mb-4 hidden md:block cursor-pointer bg-blue-600 text-white px-5 py-2 rounded-lg shadow hover:bg-blue-700 transition duration-300"
          onClick={() => navigate(-1)}
        >
          ↩️ Back
        </button>

        {error && <p className="text-red-600 text-center">{error}</p>}

        {user.role !== "admin" ? (
          <>
            <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <h2 className="text-4xl font-extrabold text-center text-gray-800 mb-10">
                💼 My Issued Assets
              </h2>

              {/* Wrap table in a div that allows horizontal scroll */}
              <div className="overflow-x-auto w-full max-w-full bg-white shadow-lg rounded-2xl border border-gray-200">
                <table className="w-full table-auto bg-white rounded-lg shadow-md">
                  <thead className="bg-blue-600 text-white">
                    <tr>
                      <th className="px-3 sm:px-6 py-3 text-left font-semibold whitespace-nowrap">
                        Employee Name
                      </th>
                      <th className="px-3 sm:px-6 py-3 text-left font-semibold whitespace-nowrap">
                        Designation
                      </th>
                      <th className="px-3 sm:px-6 py-3 text-left font-semibold whitespace-nowrap">
                        Assets
                      </th>
                      <th className="px-3 sm:px-6 py-3 text-left font-semibold whitespace-nowrap">
                        User Email ID
                      </th>
                      <th className="px-3 sm:px-6 py-3 text-left font-semibold whitespace-nowrap">
                        Issued Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-700">
                    {assets.length > 0 ? (
                      assets.map((asset, i) => (
                        <tr
                          key={i}
                          className="even:bg-gray-50 hover:bg-blue-50 transition duration-150"
                        >
                          <td className="px-3 sm:px-6 py-2 capitalize whitespace-nowrap">
                            {asset.issuedTo.name}
                          </td>
                          <td className="px-3 sm:px-6 py-2 capitalize whitespace-nowrap">
                            {asset.issuedTo.role}
                          </td>

                          <td className="px-3 sm:px-6 py-2">
                            <ul className="space-y-4 list-none">
                              {asset.assets.map((e, index) => (
                                <li key={index} className="capitalize">
                                  <div>
                                    <span className="font-semibold">{e.assetName}</span> -{" "}
                                    {e.assetDescription}
                                  </div>

                                  {/* Render images */}
                                  {e.images && e.images.length > 0 && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 mt-2">
                                      {e.images.map((img, imgIndex) => {
                                        // Cloudinary optimization
                                        const optimizedImg = img.replace(
                                          "/upload/",
                                          "/upload/w_300,q_auto,f_auto/"
                                        );
                                        return (
                                          <img
                                            key={imgIndex}
                                            src={optimizedImg}
                                            alt={`asset-img-${imgIndex}`}
                                            className="w-full h-auto object-cover rounded shadow cursor-pointer transition-transform hover:scale-105"
                                            loading="lazy"
                                            onClick={() => setSelectedImage(img)} // original full-res
                                            onError={(e) => {
                                              e.target.style.display = "none";
                                            }}
                                          />
                                        );
                                      })}
                                    </div>
                                  )}
                                </li>
                              ))}
                            </ul>
                          </td>

                          <td className="px-3 sm:px-6 py-2 whitespace-nowrap">
                            {asset.issuedTo.email}
                          </td>
                          <td className="px-3 sm:px-6 py-2 whitespace-nowrap">
                            {new Date(asset.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="text-center py-6 text-gray-500">
                          No assets found!
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <AssetManagement hideNavbar={true} />
        )}
      </div>
    </>
  );
};

export default EmployeeAssets;
