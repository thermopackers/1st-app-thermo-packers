import React, { useEffect, useState } from "react";
import axiosInstance from "../axiosInstance";
import { FaDownload, FaEdit, FaTrash, FaUserPlus, FaSearch, FaFilePdf, FaMusic } from "react-icons/fa";
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";
import InternalNavbar from "../components/InternalNavbar";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { useUserContext } from "../context/UserContext";

const MySwal = withReactContent(Swal);

export default function RequisitionSlips() {
  const { user } = useUserContext();
  const [slips, setSlips] = useState([]);
  const [page, setPage] = useState(1);
  const [assigningSlipId, setAssigningSlipId] = useState(null);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Responsive detection
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    axiosInstance.get("/users/get-all-users")
      .then((res) => setEmployees(res.data))
      .catch((err) => console.error("Failed to load users", err));
  }, []);

  useEffect(() => {
    if (!user?._id || !user?.role) return;

    setLoading(true);
    axiosInstance
      .get(`/requisitions/all`, {
        params: {
          page,
          limit: 10,
          search,
          userId: user._id,
          role: user.role,
        },
      })
      .then((res) => {
        setSlips(res.data.slips);
        setTotalPages(res.data.totalPages);
      })
      .catch((err) => {
        console.error("Failed to load slips", err);
        Swal.fire("Error", "Failed to load requisition slips", "error");
      })
      .finally(() => setLoading(false));
  }, [page, search, user]);

  const formatDateDDMMYYYY = (d) => {
    if (!d) return "";
    const dateObj = new Date(d);
    if (isNaN(dateObj.getTime())) return "";
    const day = String(dateObj.getDate()).padStart(2, "0");
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const year = dateObj.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const forceDownload = async (url, fileName) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Failed to download file:", err);
      Swal.fire("Error", "Failed to download the PDF.", "error");
    }
  };

  const openPdfInSwal = (pdfUrl, slip) => {
    const fileName = `RequisitionSlip_${slip.createdBy}_${new Date(slip.date)
      .toLocaleDateString()
      .replace(/\//g, '-')}.pdf`;

    MySwal.fire({
      title: "📄 Material Requisition Slip",
      html: `
        <div id="swal-pdf-preview" class="text-center"></div>
      `,
      didOpen: () => {
        const container = document.getElementById("swal-pdf-preview");
        if (!container) return;

        const downloadBtn = document.createElement("button");
        downloadBtn.textContent = "⬇ Download PDF";
        downloadBtn.className = "mb-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 font-medium";
        downloadBtn.onclick = () => forceDownload(pdfUrl, fileName);

        const iframe = document.createElement("iframe");
        iframe.src = `https://docs.google.com/gview?url=${encodeURIComponent(pdfUrl)}&embedded=true`;
        iframe.width = "100%";
        iframe.height = "500px";
        iframe.style.border = "none";
        iframe.className = "rounded-lg";

        const loadingText = document.createElement("p");
        loadingText.textContent = "Loading PDF preview...";
        loadingText.className = "text-gray-500 text-sm mt-2";

        container.appendChild(downloadBtn);
        container.appendChild(loadingText);
        container.appendChild(iframe);

        iframe.onload = () => {
          loadingText.remove();
        };
      },
      width: "90%",
      showConfirmButton: false,
      showCloseButton: true,
      customClass: {
        popup: "rounded-2xl",
        closeButton: "hover:bg-gray-100 rounded-full p-2"
      },
    });
  };

  const handleDelete = async (id) => {
    const confirm = await Swal.fire({
      title: "Are you sure?",
      text: "This will permanently delete the requisition slip.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
      background: '#f8fafc',
      customClass: {
        popup: 'rounded-2xl'
      }
    });

    if (confirm.isConfirmed) {
      try {
        await axiosInstance.delete(`/requisitions/delete/${id}`);
        setSlips((prev) => prev.filter((s) => s._id !== id));
        Swal.fire({
          title: "Deleted!",
          text: "Requisition slip has been removed.",
          icon: "success",
          background: '#f8fafc',
          customClass: {
            popup: 'rounded-2xl'
          }
        });
      } catch (err) {
        console.error("Delete failed", err);
        Swal.fire("Error", "Failed to delete the requisition slip", "error");
      }
    }
  };

  const handleAssignToEmployee = async (slip, assignedTo) => {
    if (!assignedTo) return;
    
    setAssigningSlipId(slip._id);
    try {
      await axiosInstance.patch(`/requisitions/assign/${slip._id}`, {
        assignedTo: [assignedTo],
      });

      await axiosInstance.post("/todos/create", {
        title: `Handle Requisition Slip by ${slip.createdBy}`,
        description: `Please process this requisition slip dated ${new Date(
          slip.date
        ).toLocaleDateString()}.`,
        assignedTo,
        images: [slip.pdfUrl],
        origin: "requisition",
      });

      Swal.fire({
        title: "✅ Assigned",
        text: "Requisition slip assigned successfully!",
        icon: "success",
        background: '#f8fafc',
        customClass: {
          popup: 'rounded-2xl'
        }
      });

      setSlips((prev) =>
        prev.map((s) =>
          s._id === slip._id ? { ...s, assignedTo: [assignedTo] } : s
        )
      );
    } catch (err) {
      console.error("Failed to assign slip:", err);
      Swal.fire("Error", "Failed to assign requisition slip.", "error");
    } finally {
      setAssigningSlipId(null);
    }
  };

  const canEditDelete = user?.role === "admin" || user?.role === "accounts";

  return (
    <>
      <InternalNavbar />
      
      {/* Main Container */}
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          
          {/* Header Section */}
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-3 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              📄 Material Requisition Slips
            </h1>
            <p className="text-gray-600 text-lg">
              Manage and track all material requisition requests
            </p>
          </div>

          {/* Search and Controls */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-100">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              
              {/* Search Input */}
              <div className="relative flex-1 max-w-2xl">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaSearch className="text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search by person, date, or items..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>

              {/* Pagination Controls */}
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-600 font-medium">
                  Page <span className="text-blue-600">{page}</span> of {totalPages}
                </div>
                <div className="flex gap-2">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                    className="p-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
                  >
                    <IoIosArrowBack className="text-gray-600" />
                  </button>
                  <button
                    disabled={page === totalPages}
                    onClick={() => setPage(page + 1)}
                    className="p-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
                  >
                    <IoIosArrowForward className="text-gray-600" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          )}

          {/* Slips Grid */}
          {!loading && (
            <div className="space-y-6">
              {Array.isArray(slips) && slips.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl shadow-lg border border-gray-100">
                  <div className="text-6xl mb-4">📄</div>
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">No requisition slips found</h3>
                  <p className="text-gray-500">
                    {search ? "Try adjusting your search criteria" : "No slips have been created yet"}
                  </p>
                </div>
              ) : (
                slips.map((slip) => (
                  <div
                    key={slip._id}
                    className="bg-white rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                  >
                    <div className="p-6">
                      {/* Header Section */}
                      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-4">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-3 mb-3">
                            <h3 className="text-lg font-semibold text-gray-800 truncate">
                              {slip.createdBy}
                            </h3>
                            {slip.assignedTo?.[0] && (
                              <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                                ✅ Assigned
                              </span>
                            )}
                          </div>
                          
                          {/* Metadata Grid */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-gray-700">Date:</span>
                              <span>{formatDateDDMMYYYY(slip.updatedAt)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-gray-700">Items:</span>
                              <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-medium">
                                {slip.items?.length || 0} items
                              </span>
                            </div>
                            {slip.assignedTo?.[0] && (
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-gray-700">Assigned To:</span>
                                <span className="text-purple-600 font-medium">
                                  {employees.find(emp => emp._id === slip.assignedTo[0])?.name || "Unknown"}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Audio Attachments */}
                      {slip.attachments?.filter(url => url.endsWith(".mp3") || url.includes(".webm")).length > 0 && (
                        <div className="mb-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                          <div className="flex items-center gap-2 mb-3">
                            <FaMusic className="text-purple-500" />
                            <span className="font-semibold text-gray-700">Voice Notes</span>
                          </div>
                          <div className="space-y-3">
                            {slip.attachments
                              .filter(url => url.endsWith(".mp3") || url.includes(".webm"))
                              .map((audioUrl, idx) => (
                                <div key={idx} className="flex items-center gap-3">
                                  <audio
                                    controls
                                    src={audioUrl}
                                    className="flex-1 h-8 rounded-lg"
                                  />
                                </div>
                              ))}
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4 border-t border-gray-200">
                        <div className="flex flex-wrap gap-2">
                          {/* View PDF Button */}
                          <button
                            onClick={() => openPdfInSwal(slip.pdfUrl, slip)}
                            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all duration-200 font-medium transform hover:scale-105 shadow-lg"
                          >
                            <FaFilePdf className="text-lg" />
                            {isMobile ? "View PDF" : "View Requisition Slip"}
                          </button>

                          {/* Edit Button */}
                          {canEditDelete && (
                            <button
                              onClick={() => {
                                localStorage.setItem("editRequisitionSlip", JSON.stringify(slip));
                                window.location.href = "/material-requisition";
                              }}
                              className="inline-flex items-center gap-2 px-4 py-2.5 bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl transition-all duration-200 font-medium transform hover:scale-105 shadow-lg"
                            >
                              <FaEdit />
                              {isMobile ? "Edit" : "Edit Slip"}
                            </button>
                          )}

                          {/* Delete Button */}
                          {canEditDelete && (
                            <button
                              onClick={() => handleDelete(slip._id)}
                              className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all duration-200 font-medium transform hover:scale-105 shadow-lg"
                            >
                              <FaTrash />
                              {isMobile ? "Delete" : "Delete"}
                            </button>
                          )}
                        </div>

                        {/* Assignment Dropdown */}
                       {canEditDelete && (
  <div className="relative w-full sm:w-auto">
    {/* Mobile View - Full Width Button with Dropdown */}
    <div className="block sm:hidden">
      <select
        value={slip.assignedTo?.[0] || ""}
        onChange={(e) => handleAssignToEmployee(slip, e.target.value)}
        className="w-full appearance-none bg-white border border-gray-300 rounded-xl px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 cursor-pointer shadow-sm text-base"
        disabled={assigningSlipId === slip._id}
      >
        <option value="">👤 Assign to employee...</option>
        {employees.map((emp) => (
          <option key={emp._id} value={emp._id}>
            {emp.name} ({emp.role})
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-700">
        <FaUserPlus className="text-lg" />
      </div>
    </div>

    {/* Tablet & Desktop View - Compact Dropdown */}
    <div className="hidden sm:block">
      <select
        value={slip.assignedTo?.[0] || ""}
        onChange={(e) => handleAssignToEmployee(slip, e.target.value)}
        className="appearance-none bg-white border border-gray-300 rounded-xl px-4 py-2.5 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 cursor-pointer shadow-sm min-w-[200px] lg:min-w-[220px] text-sm lg:text-base"
        disabled={assigningSlipId === slip._id}
      >
        <option value="">👤 Assign employee...</option>
        {employees.map((emp) => (
          <option key={emp._id} value={emp._id}>
            {emp.name} ({emp.role})
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
        <FaUserPlus />
      </div>
    </div>

    {/* Loading State */}
    {assigningSlipId === slip._id && (
      <div className="absolute inset-0 bg-white/80 rounded-xl flex items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-blue-600">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span className="hidden sm:inline">Assigning...</span>
        </div>
      </div>
    )}
  </div>
)}
                      </div>

                      {/* Loading Overlay */}
                      {assigningSlipId === slip._id && (
                        <div className="absolute inset-0 bg-white/80 rounded-2xl flex items-center justify-center">
                          <div className="text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600 mx-auto mb-2"></div>
                            <p className="text-sm text-gray-600">Assigning...</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Bottom Pagination for Mobile */}
          {totalPages > 1 && isMobile && (
            <div className="flex justify-center items-center gap-4 mt-8 pt-6 border-t border-gray-200">
              <button
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-xl text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-all duration-200"
              >
                <IoIosArrowBack />
                Previous
              </button>
              <span className="text-sm text-gray-600 font-medium">
                {page} / {totalPages}
              </span>
              <button
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-xl text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-all duration-200"
              >
                Next
                <IoIosArrowForward />
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}