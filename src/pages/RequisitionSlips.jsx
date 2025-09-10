

import React, { useEffect, useState } from "react";
import axiosInstance from "../axiosInstance";
import { FaDownload } from "react-icons/fa";
import InternalNavbar from "../components/InternalNavbar";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { useUserContext } from "../context/UserContext";

const MySwal = withReactContent(Swal);

export default function RequisitionSlips() {
  const { user } = useUserContext(); // ✅ Current logged-in user

  const [slips, setSlips] = useState([]);
  const [page, setPage] = useState(1);
  const [assigningSlipId, setAssigningSlipId] = useState(null); // for overlay loader
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
const [employees, setEmployees] = useState([]);
console.log("slips",slips);

useEffect(() => {
  axiosInstance.get("/users/get-all-users")
    .then((res) => setEmployees(res.data))
    .catch((err) => console.error("Failed to load users", err));
}, []);

useEffect(() => {
  if (!user?._id || !user?.role) return;

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
    .catch((err) => console.error("Failed to load slips", err));
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
  } catch (err) {
    console.error("Failed to download file:", err);
    Swal.fire("Error", "Failed to download the PDF.", "error");
  }
};

const openPdfInSwal = (pdfUrl, slip) => {
  const fileName = `RequisitionSlip_${slip.createdBy}_${new Date(slip.date)
    .toLocaleDateString()
    .replace(/\//g, '-')}.pdf`;

  // Create a custom React element instead of HTML string
  MySwal.fire({
    title: "📄 Material Requisition Slip",
    html: `
      <div id="swal-pdf-preview"></div>
    `,
    didOpen: () => {
      const container = document.getElementById("swal-pdf-preview");
      if (!container) return;

      const downloadBtn = document.createElement("button");
      downloadBtn.textContent = "⬇ Download PDF";
      downloadBtn.className =
        "mb-3 px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm";
      downloadBtn.onclick = () => forceDownload(pdfUrl, fileName);

      const iframe = document.createElement("iframe");
      iframe.src = `https://docs.google.com/gview?url=${encodeURIComponent(pdfUrl)}&embedded=true`;
      iframe.width = "100%";
      iframe.height = "500px";
      iframe.style.border = "none";

      container.appendChild(downloadBtn);
      container.appendChild(iframe);
    },
    width: "80%",
    showConfirmButton: false,
    showCloseButton: true,
    customClass: {
      popup: "rounded-xl",
    },
  });
};





  const handleDelete = async (id) => {
    const confirm = await Swal.fire({
      title: "Are you sure?",
      text: "This will permanently delete the slip.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });

    if (confirm.isConfirmed) {
      try {
        await axiosInstance.delete(`/requisitions/delete/${id}`);
        setSlips((prev) => prev.filter((s) => s._id !== id));
        Swal.fire("Deleted!", "Slip has been removed.", "success");
      } catch (err) {
        console.error("Delete failed", err);
        Swal.fire("Error", "Failed to delete the slip", "error");
      }
    }
  };

  return (
    <>
      <InternalNavbar />
      <div className="p-4 sm:p-6 max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">
          📄 Material Requisition Slips
        </h1>

        {/* Search & Pagination */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <input
            type="text"
            placeholder="Search by person/date"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border px-3 py-2 rounded w-full sm:w-1/2"
          />
          <div className="flex items-center gap-2 text-sm">
            Page {page} of {totalPages}
            <button
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="px-2 py-1 rounded border bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
            >
              ◀
            </button>
            <button
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
              className="px-2 py-1 rounded border bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
            >
              ▶
            </button>
          </div>
        </div>

        {/* Slip List */}
        {Array.isArray(slips) && slips.length === 0 ? (
          <p className="text-gray-500">No slips found.</p>
        ) : (
          <div className="grid gap-4">
            {slips.map((slip) => (
            <div
  key={slip._id}
  className="relative bg-white p-4 rounded-xl shadow-md flex flex-col sm:flex-row justify-between sm:items-center gap-4"
>

                <div className="text-sm break-words">
                  <p>
                    <span className="font-semibold">Person:</span>{" "}
                    {slip.createdBy}
                  </p>
             <p>
  <span className="font-semibold">Date:</span>{" "}
  {formatDateDDMMYYYY(slip.updatedAt)}
</p>


                  <p>
                    <span className="font-semibold">Items:</span>{" "}
                    {slip.items?.length || 0}
                  </p>
                </div>

                <div className="flex flex-col sm:items-end gap-2 w-full sm:w-auto">
  {/* 🎧 Voice Preview */}
{slip.attachments
  ?.filter((url) => url.endsWith(".mp3") || url.includes(".webm"))
  .map((audioUrl, idx) => (
    <audio
      key={idx}
      controls
      src={audioUrl}
      className="w-full sm:w-64 rounded"
    />
  ))}


  {/* Buttons */}
<div className="flex flex-wrap gap-2">
  <button
    onClick={() => openPdfInSwal(slip.pdfUrl, slip)}
    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
  >
    <FaDownload className="mr-2" /> View Slip
  </button>

{(user?.role === "admin" || user?.role === "accounts") && (
    <button
      onClick={() => {
        localStorage.setItem("editRequisitionSlip", JSON.stringify(slip));
        window.location.href = "/material-requisition";
      }}
      className="inline-flex items-center px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition"
    >
      ✏️ Edit
    </button>


)}


<>
 {(user?.role === "admin" || user?.role === "accounts") && (
 
    <button
      onClick={() => handleDelete(slip._id)}
      className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
    >
      ❌ Delete
    </button>
)}


  {/* 👇 Employee Assignment Dropdown */}
{user?.role === "admin" || user?.role === "accounts" ? (
  <select
value={slip.assignedTo?.[0] || ""} 
    className="ml-2 px-3 py-2 border border-gray-300 rounded-md text-sm"
    onChange={async (e) => {
      const assignedTo = e.target.value;
      if (!assignedTo) return;
  setAssigningSlipId(slip._id); // show loader

      try {
        // ✅ Use new lightweight route
        await axiosInstance.patch(`/requisitions/assign/${slip._id}`, {
          assignedTo: [assignedTo],
        });

        // ✅ Create associated task
        await axiosInstance.post("/todos/create", {
          title: `Handle Requisition Slip by ${slip.createdBy}`,
          description: `Please process this requisition slip dated ${new Date(
            slip.date
          ).toLocaleDateString()}.`,
          assignedTo,
          images: [slip.pdfUrl],
          origin: "requisition",
        });

        Swal.fire("✅ Assigned", "Slip assigned successfully!", "success");

        // ✅ Locally update state
        setSlips((prev) =>
          prev.map((s) =>
            s._id === slip._id ? { ...s, assignedTo: [assignedTo] } : s
          )
        );
      } catch (err) {
        console.error("Failed to assign slip:", err);
        Swal.fire("Error", "Failed to assign slip.", "error");
      } finally {
    setAssigningSlipId(null); // hide loader
  }
    }}
  >
    <option value="" disabled>Assign to employee</option>
    {employees.map((emp) => (
      <option key={emp._id} value={emp._id}>
        {emp.name} ({emp.role})
      </option>
    ))}
  </select>
) : null}

{assigningSlipId === slip._id && (
  <div className="absolute inset-0 bg-white/70 z-10 flex items-center justify-center rounded-lg">
    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-blue-600 border-opacity-70"></div>
  </div>
)}


</>

</div>

</div>

              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
