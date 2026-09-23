import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../axiosInstance";
import Swal from "sweetalert2";
import { motion } from "framer-motion";
import InternalNavbar from "../components/InternalNavbar";
import MoldDieForm from "../components/MoldDieForm";

const MoldDieList = () => {
  const navigate = useNavigate();
  const [dies, setDies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);
  const [editId, setEditId] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // ---------- Helpers ----------
  const normalizeFiles = (value) => {
    if (!value) return [];
    if (Array.isArray(value)) {
      return value.filter((v) => typeof v === "string" && v.trim());
    }
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (!trimmed) return [];
      if (trimmed.startsWith("[")) {
        try {
          const parsed = JSON.parse(trimmed);
          if (Array.isArray(parsed)) {
            return parsed.filter((v) => typeof v === "string" && v.trim());
          }
        } catch {
          // ignore
        }
      }
      return [trimmed];
    }
    return [];
  };

  const isPDF = (url) => {
    if (!url) return false;
    if (typeof url !== "string") return false;
    return url.toLowerCase().includes(".pdf");
  };

  const getLocationLabel = (loc) => {
    const labels = {
      withThermoPackers: "With Thermo Packers",
      sentBackToCustomer: "Sent Back to Customer",
      withSupplier: "With Supplier for Job Work",
    };
    return labels[loc] || loc;
  };

  // ---------- Fetch ----------
  useEffect(() => {
    fetchDies();
  }, []);

  const fetchDies = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("/mold-die");
      const normalized = (res.data || []).map((d) => ({
        ...d,
        photo: normalizeFiles(d.photo),
        challanImage: normalizeFiles(d.challanImage),
      }));
      setDies(normalized);
    } catch (err) {
      console.error("Error fetching dies:", err);
      Swal.fire({
        title: "Error",
        text: "Failed to fetch die/mold records",
        icon: "error",
        confirmButtonColor: "#2563eb",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });

    if (result.isConfirmed) {
      try {
        await axiosInstance.delete(`/mold-die/${id}`);
        Swal.fire("Deleted!", "Record has been deleted.", "success");
        fetchDies();
      } catch (err) {
        Swal.fire("Error!", "Failed to delete record.", "error");
      }
    }
  };

  const handleEditClick = (id) => {
    setEditId(id);
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditId(null);
    fetchDies();
  };

  // ---------- Filter + Pagination ----------
  const filteredDies = dies.filter(
    (d) =>
      d.nameOfDie?.toLowerCase().includes(search.toLowerCase()) ||
      d.dieNo?.toLowerCase().includes(search.toLowerCase()) ||
      d.ownerName?.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const totalPages = Math.ceil(filteredDies.length / itemsPerPage);
  const paginatedDies = filteredDies.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <>
      <InternalNavbar />
      <div
        className="min-h-screen py-8 pt-20"
        style={{
          background:
            "linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(255, 255, 255, 0.4) 40%, rgba(139, 92, 246, 0.08) 100%)",
        }}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            className="mb-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <button
              onClick={() => navigate(-1)}
              className="glass-btn inline-flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 font-medium"
            >
              ← Back
            </button>
          </motion.div>

          <div className="glass-card p-6">
            <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
              <h2 className="text-2xl font-bold text-gray-900">
                🔩 Die/Mold List
              </h2>
              <div className="flex gap-3 flex-wrap">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name, die no, owner..."
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={() => navigate("/add-edit-mold-die")}
                  className="px-5 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold"
                >
                  ➕ Add New
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border p-2 text-left">Sr No</th>
                    <th className="border p-2 text-left">Name of Die</th>
                    <th className="border p-2 text-left">Die No</th>
                    <th className="border p-2 text-left">Photo</th>
                    <th className="border p-2 text-left">Die Cavity</th>
                    <th className="border p-2 text-left">Remarks</th>
                    <th className="border p-2 text-left">Owner Name</th>
                    <th className="border p-2 text-left">Die Location</th>
                    <th className="border p-2 text-left">Challan</th>
                    <th className="border p-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="10" className="text-center p-4 text-gray-500">
                        Loading...
                      </td>
                    </tr>
                  ) : paginatedDies.length === 0 ? (
                    <tr>
                      <td colSpan="10" className="text-center p-4 text-gray-500">
                        No records found
                      </td>
                    </tr>
                  ) : (
                    paginatedDies.map((die, idx) => (
                      <tr key={die._id} className="hover:bg-gray-50">
                        <td className="border p-2">
                          {(currentPage - 1) * itemsPerPage + idx + 1}
                        </td>
                        <td className="border p-2">{die.nameOfDie}</td>
                        <td className="border p-2">{die.dieNo}</td>
                        <td className="border p-2">
                          {Array.isArray(die.photo) && die.photo.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {die.photo.map((url, i) =>
                                isPDF(url) ? (
                                  <a
                                    key={i}
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center w-10 h-10 bg-red-50 border border-red-200 rounded text-red-600 font-bold text-[9px]"
                                  >
                                    PDF
                                  </a>
                                ) : (
                                  <img
                                    key={i}
                                    src={url}
                                    alt="die"
                                    className="w-10 h-10 object-cover rounded cursor-pointer"
                                    onClick={() => window.open(url, "_blank")}
                                  />
                                )
                              )}
                            </div>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="border p-2">{die.dieCavity || "—"}</td>
                        <td className="border p-2">{die.remarks || "—"}</td>
                        <td className="border p-2">{die.ownerName}</td>
                        <td className="border p-2">
                          {getLocationLabel(die.dieLocation)}
                        </td>
                        <td className="border p-2">
                          {Array.isArray(die.challanImage) &&
                          die.challanImage.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {die.challanImage.map((url, i) =>
                                isPDF(url) ? (
                                  <a
                                    key={i}
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center w-10 h-10 bg-red-50 border border-red-200 rounded text-red-600 font-bold text-[9px]"
                                  >
                                    PDF
                                  </a>
                                ) : (
                                  <img
                                    key={i}
                                    src={url}
                                    alt="challan"
                                    className="w-10 h-10 object-cover rounded cursor-pointer"
                                    onClick={() => window.open(url, "_blank")}
                                  />
                                )
                              )}
                            </div>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="border p-2">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditClick(die._id)}
                              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(die._id)}
                              className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-xs"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {filteredDies.length > 0 && (
              <div className="flex items-center justify-between mt-4 flex-wrap gap-3">
                <div className="text-sm text-gray-600">
                  Showing {(currentPage - 1) * itemsPerPage + 1}–
                  {Math.min(currentPage * itemsPerPage, filteredDies.length)} of{" "}
                  {filteredDies.length} records
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="px-2 py-1.5 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value={5}>5 / page</option>
                    <option value={10}>10 / page</option>
                    <option value={25}>25 / page</option>
                    <option value={50}>50 / page</option>
                  </select>

                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 rounded-lg bg-gray-200 text-gray-700 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-300"
                  >
                    ← Prev
                  </button>

                  {(() => {
                    const pages = [];
                    const maxVisible = 5;
                    let start = Math.max(
                      1,
                      currentPage - Math.floor(maxVisible / 2)
                    );
                    let end = Math.min(totalPages, start + maxVisible - 1);
                    if (end - start + 1 < maxVisible) {
                      start = Math.max(1, end - maxVisible + 1);
                    }
                    for (let i = start; i <= end; i++) pages.push(i);
                    return pages.map((p) => (
                      <button
                        key={p}
                        onClick={() => setCurrentPage(p)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                          currentPage === p
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        {p}
                      </button>
                    ));
                  })()}

                  <button
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage >= totalPages}
                    className="px-3 py-1.5 rounded-lg bg-gray-200 text-gray-700 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-300"
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <MoldDieForm editId={editId} onClose={closeEditModal} />
      )}
    </>
  );
};

export default MoldDieList;