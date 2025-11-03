import { useEffect, useState, useRef } from "react";
import axiosInstance from "../axiosInstance";
import { useUserContext } from "../context/UserContext";
import InternalNavbar from "../components/InternalNavbar";
import imageCompression from 'browser-image-compression';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const MySwal = withReactContent(Swal);
// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const ddmmyyyy = (d) => {
  const date = new Date(d);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

export default function MainElectricPanelPage() {
  const { user } = useUserContext();
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const limit = 10;

  // 👇 Ref for last row
  const lastRowRef = useRef(null);

  const fetchData = async (p = page) => {
    try {
      const res = await axiosInstance.get(
        `/main-electric-panel?page=${p}&limit=${limit}`
      );
      setRows(res.data.data || []);
      setPage(res.data.page);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      console.error("Error fetching:", err);
    }
  };

  const addNewRow = () => {
    const newRow = {
      date: new Date(),
      kwh: "",
      kvah: "",
      netKwh: "",
      netKvah: "",
      powerFactor: "",
      checked: false,
      checkedBy: "",
      remarks: "",
      attachments: [],
    };
    setRows((prev) => [...prev, newRow]);

    // 👇 Scroll to last row after short delay (wait for DOM render)
    setTimeout(() => {
      if (lastRowRef.current) {
        lastRowRef.current.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    }, 100);
  };

  const handleInputChange = (i, field, value) => {
    const updated = [...rows];
    updated[i][field] =
      field === "kwh" || field === "kvah" ? parseFloat(value) || "" : value;

    if (field === "kwh" || field === "kvah") {
      const prev = i > 0 ? updated[i - 1] : null;

      if (prev && prev.kwh !== undefined) {
        updated[i].netKwh = (updated[i].kwh || 0) - (prev.kwh || 0);
      }
      if (prev && prev.kvah !== undefined) {
        updated[i].netKvah = (updated[i].kvah || 0) - (prev.kvah || 0);
      }

      if (updated[i].netKwh && updated[i].netKvah) {
        updated[i].powerFactor = (
          updated[i].netKwh / updated[i].netKvah
        ).toFixed(2);
      }
    }

    if (field === "checked") {
      updated[i].checked = value;
      updated[i].checkedBy = value ? user.name : "";
    }

    setRows(updated);
  };

  const handleSave = async (row) => {
    try {
      setSaving(true);
      await axiosInstance.post("/main-electric-panel", row);
      await fetchData(page);
    } catch (err) {
      console.error("Error saving:", err);
    } finally {
      setSaving(false);
    }
  };

  // Compress image files before upload
  const compressImage = async (file) => {
    if (!file.type.startsWith('image/')) return file;
    
    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
      fileType: file.type,
    };
    
    try {
      const compressedFile = await imageCompression(file, options);
      return compressedFile;
    } catch (error) {
      console.error('Error compressing image:', error);
      return file; // Return original if compression fails
    }
  };

const handleFileUpload = async (e, rowIndex) => {
  const files = e.target.files;
  if (!files.length) return;

  try {
    setUploading(true);
    
    // Compress and upload each file to Cloudinary
    const uploadPromises = Array.from(files).map(async (file) => {
      // Compress if it's an image
      const processedFile = await compressImage(file);
      
      const formData = new FormData();
      formData.append("file", processedFile);
      formData.append("upload_preset", "PF_upload_preset");
      
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/dcr8k5amk/auto/upload`,
        {
          method: "POST",
          body: formData,
        }
      );
      
      const data = await response.json();
      return {
        public_id: data.public_id,
        url: data.secure_url,
        format: data.format,
        original_filename: data.original_filename,
        resource_type: data.resource_type // Ensure this is included
      };
    });
    
    const uploadedFiles = await Promise.all(uploadPromises);
    
    // Filter out any files that don't have a public_id
    const validFiles = uploadedFiles.filter(file => file.public_id);
    
    const updatedRows = [...rows];
    updatedRows[rowIndex].attachments = [
      ...(updatedRows[rowIndex].attachments || []),
      ...validFiles
    ];
    
    setRows(updatedRows);
    await handleSave(updatedRows[rowIndex]);
    
  } catch (err) {
    console.error("Error uploading files:", err);
  } finally {
    setUploading(false);
    e.target.value = ""; // Reset file input
  }
};


const handleDeleteAttachment = async (rowIndex, attachmentIndex, attachment) => {
  try {
    // Only try to delete from Cloudinary if we have a public_id
    if (attachment.public_id) {
      await axiosInstance.post("/main-electric-panel/delete-cloudinary-file", { 
        public_id: attachment.public_id 
      });
    }
    
    // Then update the UI regardless of Cloudinary deletion
    const updatedRows = [...rows];
    updatedRows[rowIndex].attachments.splice(attachmentIndex, 1);
    setRows(updatedRows);
    
    // Auto-save the row after deleting attachment
    await handleSave(updatedRows[rowIndex]);
  } catch (err) {
    console.error("Error deleting attachment:", err);
    // Even if Cloudinary deletion fails, remove from UI
    const updatedRows = [...rows];
    updatedRows[rowIndex].attachments.splice(attachmentIndex, 1);
    setRows(updatedRows);
    await handleSave(updatedRows[rowIndex]);
  }
};

const handleDeleteRow = async (row) => {
  // For unsaved rows (no _id), just remove from local state
  if (!row._id) {
    setRows(prev => prev.filter(r => r !== row));
    return;
  }
  
  if (!window.confirm("Are you sure you want to delete this row? This will also delete all associated files.")) {
    return;
  }
  
  try {
    setDeleting(true);
    
    // First delete all attachments from Cloudinary (only those with public_id)
    if (row.attachments && row.attachments.length) {
      const deletePromises = row.attachments
        .filter(attachment => attachment.public_id) // Only try to delete files with public_id
        .map(attachment => 
          axiosInstance.post("/main-electric-panel/delete-cloudinary-file", { 
            public_id: attachment.public_id 
          })
        );
      
      // Use Promise.allSettled to continue even if some deletions fail
      await Promise.allSettled(deletePromises);
    }
    
    // Then delete the row from the database
    await axiosInstance.delete(`/main-electric-panel/${row._id}`);
    
    // Refresh the data
    await fetchData(page);
  } catch (err) {
    console.error("Error deleting row:", err);
    alert("Error deleting row: " + (err.response?.data?.error || err.message));
  } finally {
    setDeleting(false);
  }
};

const openFilePreview = (file) => {
  const url = file.url || file.secure_url;
  const format = file.format;

  if (!url || url.startsWith("blob:")) {
    MySwal.fire({
      icon: "info",
      title: "Preview not available",
      text: `Please save first, then preview.`,
    });
    return;
  }

  // Determine file type from format or URL extension
  const isImage = format ? ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(format.toLowerCase()) 
                       : /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
  const isPDF = format ? format.toLowerCase() === 'pdf' 
                      : /\.pdf$/i.test(url);

  if (isImage) {
    MySwal.fire({
      title: file.original_filename,
      html: `<img src="${url}" alt="${file.original_filename}" style="max-width:100%; max-height:70vh; object-fit:contain;" />`,
      showCloseButton: true,
      showConfirmButton: false,
      width: "80%",
    });
  } else if (isPDF) {
    MySwal.fire({
      title: file.original_filename,
      html: `<iframe src="${url}" style="width:100%;height:70vh;" frameborder="0"></iframe>`,
      showCloseButton: true,
      showConfirmButton: false,
      width: "80%",
    });
  } else {
    MySwal.fire({
      icon: "info",
      title: "Preview not available",
      footer: `<a href="${url}" target="_blank" rel="noopener noreferrer">Download ${file.original_filename}</a>`,
    });
  }
};

  useEffect(() => {
    fetchData(1);
  }, []);

  return (
    <>
      <InternalNavbar />
      <div className="p-2 sm:p-4 relative">
        <h1 className="text-xl font-bold mb-4 text-center sm:text-left">
          THERMO PACKERS - Daily Electricity PF (Power Factor Report)
        </h1>

        <div className="flex flex-col sm:flex-row justify-between items-center mb-2 gap-2">
          <h2 className="text-lg font-semibold">Main Electric Panel</h2>
          <button
            onClick={addNewRow}
            className="bg-green-500 text-white px-3 py-1 rounded w-full sm:w-auto"
          >
            + Add New Row
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-300 text-xs sm:text-sm">
            <thead className="bg-gray-200">
              <tr>
                <th className="border px-2 py-1">Date</th>
                <th className="border px-2 py-1">KWH</th>
                <th className="border px-2 py-1">KVAH</th>
                <th className="border px-2 py-1">Net KWH (New KWH - Old KWH)</th>
                <th className="border px-2 py-1">Net KVAH (New KVAH - Old KVAH)</th>
                <th className="border px-2 py-1">Power Factor (Net KWH/Net KVAH)(Should be near to 0.99)</th>
                <th className="border px-2 py-1">Sign of Plant Manager</th>
                <th className="border px-2 py-1">Remarks</th>
                <th className="border px-2 py-1">Attachments</th>
                <th className="border px-2 py-1">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr
                  key={i}
                  ref={i === rows.length - 1 ? lastRowRef : null} // 👈 attach ref to last row
                >
                  <td className="border px-2 py-1">
                    {ddmmyyyy(r.date || new Date())}
                  </td>
                  <td className="border px-2 py-1">
                    <input
                      type="number"
                      step="0.01"
                      value={r.kwh || ""}
                      onChange={(e) =>
                        handleInputChange(i, "kwh", e.target.value)
                      }
                      className="w-20 sm:w-24 border p-1"
                    />
                  </td>
                  <td className="border px-2 py-1">
                    <input
                      type="number"
                      step="0.01"
                      value={r.kvah || ""}
                      onChange={(e) =>
                        handleInputChange(i, "kvah", e.target.value)
                      }
                      className="w-20 sm:w-24 border p-1"
                    />
                  </td>
                  <td className="border px-2 py-1">{r.netKwh || "-"}</td>
                  <td className="border px-2 py-1">{r.netKvah || "-"}</td>
                  <td
                    className={`border px-2 py-1 ${
                      r.powerFactor >= 0.95 && r.powerFactor <= 0.99
                        ? "bg-green-200"
                        : "bg-red-200"
                    }`}
                  >
                    {r.powerFactor || "-"}
                  </td>
                  <td className="border px-2 py-1">
{(Array.isArray(user.role) ? user.role.some(role => ["accounts", "admin"].includes(role)) : ["accounts", "admin"].includes(user.role)) ? (
                        <>
                        <input
                          type="checkbox"
                          checked={r.checked || false}
                          onChange={() =>
                            handleInputChange(i, "checked", !r.checked)
                          }
                        />
                        {r.checked && (
                          <span className="ml-1 text-xs sm:text-sm">
                            {user.name}
                          </span>
                        )}
                      </>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="border px-2 py-1">
                    <textarea
                      value={r.remarks || ""}
                      onChange={(e) =>
                        handleInputChange(i, "remarks", e.target.value)
                      }
                      className="w-32 sm:w-48 border p-1 resize-y"
                      rows={2}
                    />
                  </td>
                  <td className="border px-2 py-1">
                    <div className="flex flex-wrap gap-2">
                      <input
                        type="file"
                        multiple
                        accept="image/*,.pdf"
                        onChange={(e) => handleFileUpload(e, i)}
    className="text-xs mb-1 bg-amber-200 p-2"
                        disabled={uploading}
                      />
                     {/* In your attachment rendering code */}
{r.attachments && r.attachments.map((file, idx) => {
  const isImage = file.format
    ? ["jpg", "jpeg", "png", "gif", "webp"].includes(file.format.toLowerCase())
    : /\.(jpg|jpeg|png|gif|webp)$/i.test(file.url);
  const isPDF = file.format
    ? file.format.toLowerCase() === "pdf"
    : /\.pdf$/i.test(file.url);

  return (
    <div key={idx} className="relative group flex items-center gap-2">
      <button
        onClick={() => openFilePreview(file)}
        className="flex items-center gap-1 text-left"
        title={file.original_filename}
      >
        {isImage ? (
          <img
            src={file.url}
            alt={file.original_filename}
            className="w-15 h-15 object-cover border rounded"
          />
        ) : isPDF ? (
          <div className="w-15 h-15 flex items-center justify-center border rounded bg-gray-100 text-red-600 font-bold">
            PDF
          </div>
        ) : (
          <div className="w-15 h-15 flex items-center justify-center border rounded bg-gray-100 text-gray-600 text-xs">
            FILE
          </div>
        )}
       
      </button>

      {/* delete button */}
      <button
        onClick={() => handleDeleteAttachment(i, idx, file)}
className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-4 h-4 text-xs"
      >
        ×
      </button>
    </div>
  );
})}

                    </div>
                  </td>
                  <td className="border px-2 py-1 text-center">
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => handleSave(r)}
                        className="bg-blue-500 text-white px-2 sm:px-3 py-1 rounded text-xs sm:text-sm"
                        disabled={saving}
                      >
                        Save
                      </button>
                      {r._id && (
                        <button
                          onClick={() => handleDeleteRow(r)}
                          className="bg-red-500 text-white px-2 sm:px-3 py-1 rounded text-xs sm:text-sm"
                          disabled={deleting}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap justify-center mt-4 gap-2">
          {[...Array(totalPages).keys()].map((n) => (
            <button
              key={n}
              onClick={() => fetchData(n + 1)}
              className={`px-2 sm:px-3 py-1 rounded text-xs sm:text-sm ${
                page === n + 1 ? "bg-blue-500 text-white" : "bg-gray-200"
              }`}
            >
              {n + 1}
            </button>
          ))}
        </div>

      
        {(saving || uploading || deleting) && (
          <div className="fixed inset-0 bg-[#000000ad] bg-opacity-40 flex items-center justify-center z-50">
            <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>
    </>
  );
}