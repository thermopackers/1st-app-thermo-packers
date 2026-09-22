import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Calendar,
  Search,
  ChevronLeft,
  ChevronRight,
  Plus,
  Pencil,
  Trash2,
  Save,
  Loader,
} from "lucide-react";
import Swal from "sweetalert2";
import axiosInstance from "../axiosInstance";
import { useUserContext } from "../context/UserContext";

const HolidaysList = ({ isOpen, onClose }) => {
  const { user } = useUserContext();

  // Helper to parse roles
  const parseUserRoles = (u) => {
    if (!u || !u.role) return [];
    if (Array.isArray(u.role)) return u.role;
    if (typeof u.role === "string") {
      try {
        return JSON.parse(u.role);
      } catch {
        return [u.role];
      }
    }
    return [u.role];
  };

  const userRoles = parseUserRoles(user);
  const canManage = userRoles.some((r) => ["admin", "accounts"].includes(r));

  const [viewMode, setViewMode] = useState("all");
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [searchTerm, setSearchTerm] = useState("");
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    date: "",
    day: "",
  });

  // Fetch holidays
  const fetchHolidays = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axiosInstance.get("/holidays", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setHolidays(res.data || []);
    } catch (err) {
      console.error("Failed to fetch holidays:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) fetchHolidays();
  }, [isOpen]);

  // Auto compute day name from date
  useEffect(() => {
    if (formData.date) {
      const d = new Date(formData.date);
      if (!isNaN(d.getTime())) {
        const dayName = d.toLocaleDateString("en-IN", { weekday: "long" });
        setFormData((prev) => ({ ...prev, day: dayName }));
      }
    }
  }, [formData.date]);

  // Derived: sorted holidays
  const sortedHolidays = [...holidays].sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );

  // Derived: by month
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  const holidaysByMonth = months.map((_, idx) =>
    sortedHolidays.filter((h) => new Date(h.date).getMonth() === idx)
  );

  // Derived: upcoming
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const upcomingHolidays = sortedHolidays.filter(
    (h) => new Date(h.date) >= today
  );

  // Format date
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // Search filter
  const filterHolidays = (list) => {
    if (!searchTerm) return list;
    const term = searchTerm.toLowerCase();
    return list.filter(
      (h) => h.name.toLowerCase().includes(term) || h.date.includes(term)
    );
  };

  // Month navigation
  const prevMonth = () =>
    setCurrentMonth((prev) => (prev === 0 ? 11 : prev - 1));
  const nextMonth = () =>
    setCurrentMonth((prev) => (prev === 11 ? 0 : prev + 1));

  // Reset form
  const resetForm = () => {
    setFormData({
      name: "",
      date: "",
      day: "",
    });
    setEditingHoliday(null);
  };

  // Open Add form
  const handleAddClick = () => {
    resetForm();
    setShowForm(true);
  };

  // Open Edit form
  const handleEditClick = (holiday) => {
    setFormData({
      name: holiday.name,
      date: holiday.date?.slice(0, 10),
      day: holiday.day || "",
    });
    setEditingHoliday(holiday);
    setShowForm(true);
  };

  // Submit add/edit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.date) {
      Swal.fire("Validation", "Name and Date are required.", "warning");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      if (editingHoliday) {
        await axiosInstance.put(
          `/holidays/${editingHoliday._id}`,
          formData,
          { headers }
        );
        Swal.fire("Updated!", "Holiday updated successfully.", "success");
      } else {
        await axiosInstance.post("/holidays", formData, { headers });
        Swal.fire("Added!", "Holiday added successfully.", "success");
      }

      setShowForm(false);
      resetForm();
      fetchHolidays();
    } catch (err) {
      console.error(err);
      Swal.fire(
        "Error",
        err.response?.data?.message || "Something went wrong.",
        "error"
      );
    }
  };

  // Delete holiday
  const handleDelete = async (holiday) => {
    const confirm = await Swal.fire({
      title: "Delete Holiday?",
      html: `<b>${holiday.name}</b> on ${formatDate(holiday.date)}`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete",
    });

    if (!confirm.isConfirmed) return;

    try {
      const token = localStorage.getItem("token");
      await axiosInstance.delete(`/holidays/${holiday._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      Swal.fire("Deleted!", "Holiday has been deleted.", "success");
      fetchHolidays();
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to delete holiday.", "error");
    }
  };

  return (
    <>
      {/* ==================== MAIN MODAL ==================== */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-green-600 to-teal-600">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-white" />
                  <h2 className="text-lg font-semibold text-white">
                    Yearly Holidays Chart 2026
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  {canManage && (
                    <button
                      onClick={handleAddClick}
                      className="flex items-center gap-1 px-3 py-1.5 bg-white text-green-700 rounded-lg text-sm font-medium hover:bg-green-50 transition"
                    >
                      <Plus className="w-4 h-4" />
                      Add Holiday
                    </button>
                  )}
                  <button
                    onClick={onClose}
                    className="text-white/80 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-gray-200 bg-gray-50">
                {[
                  { key: "all", label: "All Holidays Yearly" },
                  { key: "monthly", label: "Monthly View" },
                  { key: "upcoming", label: "Upcoming Holidays" },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setViewMode(tab.key)}
                    className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                      viewMode === tab.key
                        ? "text-green-600 border-b-2 border-green-600 bg-white"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Search */}
              <div className="p-4 border-b border-gray-200">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search holidays..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Content */}
              <div className="p-4 overflow-y-auto flex-1">
                {loading ? (
                  <div className="flex justify-center py-10">
                    <Loader className="w-6 h-6 animate-spin text-green-600" />
                  </div>
                ) : (
                  <>
                    {/* ALL */}
                    {viewMode === "all" && (
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                          <thead className="bg-gray-100 sticky top-0">
                            <tr>
                              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">S.N.</th>
                              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Holiday</th>
                              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Date</th>
                              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Day</th>
                              {canManage && (
                                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Actions</th>
                              )}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {filterHolidays(sortedHolidays).map((h, idx) => (
                              <tr key={h._id} className="hover:bg-gray-50">
                                <td className="px-3 py-2 text-sm text-gray-600">{idx + 1}</td>
                                <td className="px-3 py-2 text-sm font-medium text-gray-800">{h.name}</td>
                                <td className="px-3 py-2 text-sm text-gray-600">{formatDate(h.date)}</td>
                                <td className="px-3 py-2 text-sm">
                                  <span
                                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                                      h.day === "Sunday"
                                        ? "bg-red-100 text-red-700"
                                        : "bg-gray-100 text-gray-700"
                                    }`}
                                  >
                                    {h.day}
                                  </span>
                                </td>
                                {canManage && (
                                  <td className="px-3 py-2 text-sm">
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => handleEditClick(h)}
                                        className="p-1.5 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 transition"
                                        title="Edit"
                                      >
                                        <Pencil className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => handleDelete(h)}
                                        className="p-1.5 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition"
                                        title="Delete"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </td>
                                )}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {filterHolidays(sortedHolidays).length === 0 && (
                          <div className="text-center py-8 text-gray-500">
                            No holidays found.
                          </div>
                        )}
                      </div>
                    )}

                    {/* MONTHLY */}
                    {viewMode === "monthly" && (
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <button
                            onClick={prevMonth}
                            className="p-2 hover:bg-gray-100 rounded-lg transition"
                          >
                            <ChevronLeft className="w-5 h-5" />
                          </button>
                          <h3 className="text-lg font-semibold text-gray-800">
                            {months[currentMonth]} 2026
                          </h3>
                          <button
                            onClick={nextMonth}
                            className="p-2 hover:bg-gray-100 rounded-lg transition"
                          >
                            <ChevronRight className="w-5 h-5" />
                          </button>
                        </div>

                        {holidaysByMonth[currentMonth].length > 0 ? (
                          <div className="space-y-2">
                            {holidaysByMonth[currentMonth].map((h) => (
                              <div
                                key={h._id}
                                className="p-3 bg-green-50 rounded-lg border border-green-200"
                              >
                                <div className="flex justify-between items-start">
                                  <div>
                                    <p className="font-semibold text-gray-800">{h.name}</p>
                                    <p className="text-sm text-gray-600 mt-1">
                                      📅 {formatDate(h.date)} | {h.day}
                                    </p>
                                  </div>
                                  <div className="flex flex-col gap-2 items-end">
                                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                                      Holiday
                                    </span>
                                    {canManage && (
                                      <div className="flex gap-1">
                                        <button
                                          onClick={() => handleEditClick(h)}
                                          className="p-1 rounded bg-blue-100 text-blue-700 hover:bg-blue-200"
                                        >
                                          <Pencil className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          onClick={() => handleDelete(h)}
                                          className="p-1 rounded bg-red-100 text-red-700 hover:bg-red-200"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                            No holidays in {months[currentMonth]}
                          </div>
                        )}
                      </div>
                    )}

                    {/* UPCOMING */}
                    {viewMode === "upcoming" && (
                      <div className="space-y-3">
                        {filterHolidays(upcomingHolidays).map((h, index) => (
                          <div
                            key={h._id}
                            className="p-3 bg-gradient-to-r from-green-50 to-teal-50 rounded-lg border border-green-200"
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-sm font-bold text-green-600">
                                    #{index + 1}
                                  </span>
                                  <h4 className="font-semibold text-gray-800">{h.name}</h4>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-sm mt-2">
                                  <div>
                                    <span className="text-gray-500">Date:</span>
                                    <span className="ml-2 text-gray-700">
                                      {formatDate(h.date)}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-gray-500">Day:</span>
                                    <span
                                      className={`ml-2 ${
                                        h.day === "Sunday"
                                          ? "text-red-600"
                                          : "text-gray-700"
                                      }`}
                                    >
                                      {h.day}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="text-right flex flex-col gap-2 items-end">
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                                  <Calendar className="w-3 h-3" />
                                  Holiday
                                </span>
                                {canManage && (
                                  <div className="flex gap-1">
                                    <button
                                      onClick={() => handleEditClick(h)}
                                      className="p-1 rounded bg-blue-100 text-blue-700 hover:bg-blue-200"
                                    >
                                      <Pencil className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => handleDelete(h)}
                                      className="p-1 rounded bg-red-100 text-red-700 hover:bg-red-200"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                        {filterHolidays(upcomingHolidays).length === 0 && (
                          <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                            No upcoming holidays for the rest of the year
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Footer */}
              <div className="p-3 bg-gray-50 border-t border-gray-200 text-center text-xs text-gray-500">
                <span>Total Holidays in 2026: {holidays.length}</span>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ==================== ADD / EDIT FORM MODAL ==================== */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100]"
            onClick={() => {
              setShowForm(false);
              resetForm();
            }}
          >
            <motion.form
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              onSubmit={handleSubmit}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-600 to-teal-600 shrink-0">
                <h3 className="text-white font-semibold">
                  {editingHoliday ? "Edit Holiday" : "Add Holiday"}
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                  className="text-white/80 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable body */}
              <div className="p-4 space-y-3 overflow-y-auto flex-1">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Holiday Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="e.g. Diwali"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Day (auto)
                  </label>
                  <input
                    type="text"
                    value={formData.day}
                    readOnly
                    className="w-full border border-gray-200 bg-gray-50 rounded-lg px-3 py-2 text-gray-600"
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-2 p-4 border-t border-gray-200 bg-gray-50 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                  className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700"
                >
                  <Save className="w-4 h-4" />
                  {editingHoliday ? "Update" : "Save"}
                </button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default HolidaysList;