import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../axiosInstance";
import Swal from "sweetalert2";
import { motion } from "framer-motion";

const MoldDieForm = ({ onClose, editId }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dies, setDies] = useState([]);
  const [editingId, setEditingId] = useState(editId || null);
  const [formData, setFormData] = useState({
    srNo: "",
    nameOfDie: "",
    dieNo: "",
    photo: [],
    dieCavity: "",
    remarks: "",
    ownerName: "",
    dieLocation: "",
    challanImage: [],
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const CLOUDINARY_CLOUD_NAME = "dcr8k5amk";
  const CLOUDINARY_UPLOAD_PRESET = "unsigned_preset"; // ⚠️ Replace with your actual preset

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

  useEffect(() => {
    if (editId) loadForEdit(editId);
  }, [editId]);

  // Auto-set Sr No when adding a new record (not editing)
  useEffect(() => {
    if (!editingId) {
      const nextSr = dies.length + 1;
      setFormData((prev) => ({ ...prev, srNo: String(nextSr) }));
    }
  }, [dies, editingId]);

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

  const loadForEdit = async (id) => {
    try {
      const res = await axiosInstance.get(`/mold-die/${id}`);
      const die = res.data;
      setFormData({
        srNo: die.srNo || "",
        nameOfDie: die.nameOfDie || "",
        dieNo: die.dieNo || "",
        photo: normalizeFiles(die.photo),
        dieCavity: die.dieCavity || "",
        remarks: die.remarks || "",
        ownerName: die.ownerName || "",
        dieLocation: die.dieLocation || "",
        challanImage: normalizeFiles(die.challanImage),
      });
      setEditingId(die._id);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      console.error("Error loading die:", err);
      Swal.fire({
        title: "Error",
        text: "Failed to load record for editing",
        icon: "error",
        confirmButtonColor: "#2563eb",
      });
    }
  };

  // ---------- Cloudinary Upload ----------
  const uploadToCloudinary = async (file, folder = "mold-die") => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
    fd.append("folder", folder);

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`,
      {
        method: "POST",
        body: fd,
      }
    );

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      console.error("Cloudinary error:", errorData);
      throw new Error(errorData?.error?.message || "Cloudinary upload failed");
    }

    const data = await res.json();
    return data.secure_url;
  };

  const handleFileUpload = async (e, field) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const validTypes = [
      "image/jpeg",
      "image/png",
      "image/jpg",
      "image/webp",
      "application/pdf",
    ];

    for (const file of files) {
      if (!validTypes.includes(file.type)) {
        Swal.fire({
          title: "Invalid File",
          text: `"${file.name}" is not allowed. Only JPG, PNG, WEBP, PDF.`,
          icon: "warning",
          confirmButtonColor: "#2563eb",
        });
        e.target.value = "";
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        Swal.fire({
          title: "File Too Large",
          text: `"${file.name}" exceeds 10MB limit.`,
          icon: "warning",
          confirmButtonColor: "#2563eb",
        });
        e.target.value = "";
        return;
      }
    }

    try {
      setUploading(true);
      const uploadedUrls = await Promise.all(
        files.map((file) => uploadToCloudinary(file, `mold-die/${field}`))
      );

      setFormData((prev) => ({
        ...prev,
        [field]: [...prev[field], ...uploadedUrls],
      }));

      Swal.fire({
        title: "Uploaded!",
        text: `${uploadedUrls.length} file(s) uploaded successfully`,
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (err) {
      console.error("Upload error:", err);
      Swal.fire({
        title: "Upload Failed",
        text: err.message || "Failed to upload files to Cloudinary",
        icon: "error",
        confirmButtonColor: "#2563eb",
      });
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleRemoveFile = (field, index) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !formData.nameOfDie ||
      !formData.dieNo ||
      !formData.ownerName ||
      !formData.dieLocation
    ) {
      Swal.fire({
        title: "Missing Fields",
        text: "Please fill all required fields",
        icon: "warning",
        confirmButtonColor: "#2563eb",
      });
      return;
    }

    if (
      formData.dieLocation === "sentBackToCustomer" &&
      formData.challanImage.length === 0
    ) {
      Swal.fire({
        title: "Challan Required",
        text: "Please upload at least one challan (image or PDF) when sending back to customer",
        icon: "warning",
        confirmButtonColor: "#2563eb",
      });
      return;
    }

    try {
      setLoading(true);
      if (editingId) {
        await axiosInstance.put(`/mold-die/${editingId}`, formData);
        Swal.fire({
          title: "Updated!",
          text: "Die/Mold record updated successfully",
          icon: "success",
          confirmButtonColor: "#2563eb",
        });
      } else {
        await axiosInstance.post("/mold-die", formData);
        Swal.fire({
          title: "Added!",
          text: "Die/Mold record added successfully",
          icon: "success",
          confirmButtonColor: "#2563eb",
        });
      }
      resetForm();
      fetchDies();
    } catch (err) {
      console.error("Submit error:", err);
      Swal.fire({
        title: "Error",
        text: err.response?.data?.message || "Failed to save record",
        icon: "error",
        confirmButtonColor: "#2563eb",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      srNo: "",
      nameOfDie: "",
      dieNo: "",
      photo: [],
      dieCavity: "",
      remarks: "",
      ownerName: "",
      dieLocation: "",
      challanImage: [],
    });
    setEditingId(null);
  };

  const handleEdit = (die) => {
    setFormData({
      srNo: die.srNo || "",
      nameOfDie: die.nameOfDie || "",
      dieNo: die.dieNo || "",
      photo: normalizeFiles(die.photo),
      dieCavity: die.dieCavity || "",
      remarks: die.remarks || "",
      ownerName: die.ownerName || "",
      dieLocation: die.dieLocation || "",
      challanImage: normalizeFiles(die.challanImage),
    });
    setEditingId(die._id);
    window.scrollTo({ top: 0, behavior: "smooth" });
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
        if (editingId === id) resetForm();
        fetchDies();
      } catch (err) {
        Swal.fire("Error!", "Failed to delete record.", "error");
      }
    }
  };

  const totalPages = Math.ceil(dies.length / itemsPerPage);
  const paginatedDies = dies.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // ---------- Reusable preview grid ----------
  const FilePreviewGrid = ({ field, urls, size = "w-20 h-20" }) => {
    if (!urls || urls.length === 0) return null;
    return (
      <div className="flex flex-wrap gap-3 mt-2">
        {urls.map((url, i) => (
          <div key={i} className="relative inline-block">
            {isPDF(url) ? (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center justify-center ${size} bg-red-50 border-2 border-red-200 rounded-lg text-red-600 font-bold text-xs hover:bg-red-100`}
              >
                📄 PDF
              </a>
            ) : (
              <img
                src={url}
                alt="preview"
                className={`${size} object-cover rounded-lg border cursor-pointer`}
                onClick={() => window.open(url, "_blank")}
              />
            )}
            <button
              type="button"
              onClick={() => handleRemoveFile(field, i)}
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center text-xs shadow-lg transition-all"
              title="Remove this file"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center bg-black/40 backdrop-blur-sm overflow-y-auto py-8">
      <motion.div
        className="glass-card w-full max-w-7xl mx-4 p-6 relative"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/60 hover:bg-white flex items-center justify-center text-gray-600 z-10"
        >
          ✕
        </button>

        <h2 className="text-2xl font-bold text-gray-900 text-center mb-6">
          {editingId ? "✏️ Edit Die/Mold" : "➕ Add Die/Mold"}
        </h2>

        {/* ================= FORM ================= */}
        <form onSubmit={handleSubmit} className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Sr No (Auto) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sr No <span className="text-gray-400 text-xs">(auto)</span>
              </label>
              <input
                type="text"
                name="srNo"
                value={formData.srNo}
                readOnly
                className="w-full px-3 py-2 border border-gray-200 bg-gray-100 rounded-lg text-gray-600 cursor-not-allowed"
                placeholder="Auto"
              />
            </div>

            {/* Name of Die */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name of Die <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="nameOfDie"
                value={formData.nameOfDie}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Enter die name"
                required
              />
            </div>

            {/* Die No */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Die No <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="dieNo"
                value={formData.dieNo}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Enter die number"
                required
              />
            </div>

            {/* Photo - MULTIPLE */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Photo / Files (multiple allowed)
              </label>
              <input
                type="file"
                accept="image/*,application/pdf"
                multiple
                onChange={(e) => handleFileUpload(e, "photo")}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                disabled={uploading}
              />
              {uploading && (
                <p className="text-xs text-blue-600 mt-1">Uploading...</p>
              )}
              <FilePreviewGrid field="photo" urls={formData.photo} />
            </div>

            {/* Die Cavity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Die Cavity
              </label>
              <input
                type="text"
                name="dieCavity"
                value={formData.dieCavity}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 4 cavity"
              />
            </div>

            {/* Remarks */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Remarks
              </label>
              <input
                type="text"
                name="remarks"
                value={formData.remarks}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Any remarks"
              />
            </div>

            {/* Owner Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Owner Name <span className="text-red-500">*</span>
              </label>
              <select
                name="ownerName"
                value={formData.ownerName}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select Owner</option>
                <option value="Thermo Packers">Thermo Packers</option>
                <option value="Customer">Customer</option>
              </select>
            </div>

            {/* Die Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Die Location <span className="text-red-500">*</span>
              </label>
              <select
                name="dieLocation"
                value={formData.dieLocation}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select Location</option>
                <option value="withThermoPackers">With Thermo Packers</option>
                <option value="sentBackToCustomer">
                  Sent Back to Customer
                </option>
                <option value="withSupplier">With Supplier for Job Work</option>
              </select>
            </div>

            {/* Challan - MULTIPLE, only when sentBackToCustomer */}
            {formData.dieLocation === "sentBackToCustomer" && (
              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Challan Files (multiple allowed){" "}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  multiple
                  onChange={(e) => handleFileUpload(e, "challanImage")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  disabled={uploading}
                />
                {uploading && (
                  <p className="text-xs text-blue-600 mt-1">Uploading...</p>
                )}
                <FilePreviewGrid
                  field="challanImage"
                  urls={formData.challanImage}
                  size="w-24 h-24"
                />
              </div>
            )}
          </div>

          <div className="flex gap-3 mt-6 justify-end">
            <button
              type="button"
              onClick={resetForm}
              className="px-5 py-2.5 bg-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-300"
            >
              Reset
            </button>
            <button
              type="submit"
              disabled={loading || uploading}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 disabled:opacity-50"
            >
              {loading ? "Saving..." : editingId ? "Update" : "Add"}
            </button>
          </div>
        </form>

        {/* ================= TABLE ================= */}
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
              {loading && dies.length === 0 ? (
                <tr>
                  <td colSpan="10" className="text-center p-4 text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : dies.length === 0 ? (
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
                          type="button"
                          onClick={() => handleEdit(die)}
                          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
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

        {/* ================= PAGINATION ================= */}
        {dies.length > 0 && (
          <div className="flex items-center justify-between mt-4 flex-wrap gap-3">
            <div className="text-sm text-gray-600">
              Showing {(currentPage - 1) * itemsPerPage + 1}–
              {Math.min(currentPage * itemsPerPage, dies.length)} of{" "}
              {dies.length} records
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
                type="button"
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
                    type="button"
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
                type="button"
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
      </motion.div>
    </div>
  );
};

export default MoldDieForm;