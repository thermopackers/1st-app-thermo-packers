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

export default function MainElectricPanelPageUnit3() {
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
        `/main-electric-panel-unit3?page=${p}&limit=${limit}`
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
    kwh: 0,  // Change from "" to 0
    kvah: 0, // Change from "" to 0
    netKwh: 0,
    netKvah: 0,
    powerFactor: "",
    checked: false,
    checkedBy: "",
    remarks: "",
    attachments: [],
  };
  setRows((prev) => [...prev, newRow]);

  // Scroll to last row
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
  
  // Update the field value
  if (field === "kwh" || field === "kvah") {
    updated[i][field] = value === "" ? "" : parseFloat(value) || 0;
  } else {
    updated[i][field] = value;
  }

  // Calculate net values only when kwh or kvah changes
  if (field === "kwh" || field === "kvah") {
    // For the first row, net values are the same as current values
    if (i === 0) {
      if (field === "kwh") {
        updated[i].netKwh = updated[i].kwh || 0;
      }
      if (field === "kvah") {
        updated[i].netKvah = updated[i].kvah || 0;
      }
    } else {
      // For subsequent rows, calculate net by subtracting previous row values
      const prev = updated[i - 1];
      
      if (field === "kwh") {
        const currentKwh = updated[i].kwh || 0;
        const prevKwh = prev.kwh || 0;
        updated[i].netKwh = currentKwh - prevKwh;
      }
      
      if (field === "kvah") {
        const currentKvah = updated[i].kvah || 0;
        const prevKvah = prev.kvah || 0;
        updated[i].netKvah = currentKvah - prevKvah;
      }
    }

// Calculate power factor if both net values are available and valid
if (updated[i].netKwh !== undefined && updated[i].netKvah !== undefined && updated[i].netKvah !== 0) {
  let calculatedPF = updated[i].netKwh / updated[i].netKvah;
  // Ensure power factor doesn't exceed 1 and is at least 0
  calculatedPF = Math.max(0, Math.min(calculatedPF, 1));
  updated[i].powerFactor = Number(calculatedPF.toFixed(2));
} else {
  updated[i].powerFactor = "";
}
  }

  // Handle checked field
  if (field === "checked") {
    updated[i].checked = value;
    updated[i].checkedBy = value ? user.name : "";
  }

  setRows(updated);
};

  const handleSave = async (row) => {
    try {
      setSaving(true);
      await axiosInstance.post("/main-electric-panel-unit3", row);
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
      await axiosInstance.post("/main-electric-panel-unit3/delete-cloudinary-file", { 
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
          axiosInstance.post("/main-electric-panel-unit3/delete-cloudinary-file", { 
            public_id: attachment.public_id 
          })
        );
      
      // Use Promise.allSettled to continue even if some deletions fail
      await Promise.allSettled(deletePromises);
    }
    
    // Then delete the row from the database
    await axiosInstance.delete(`/main-electric-panel-unit3/${row._id}`);
    
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

  const openExampleImage = (type) => {
  const imageUrls = {
    KWH: "/images/po2.jpg", // Adjust filename as needed
    KVAH: "/images/po1.jpg" // Adjust filename as needed
  };

  const imageTitles = {
    KWH: "KWH Meter Reading Example",
    KVAH: "KVAH Meter Reading Example"
  };

  MySwal.fire({
    title: imageTitles[type],
    html: `<img src="${imageUrls[type]}" alt="${imageTitles[type]}" style="max-width:100%; max-height:70vh; object-fit:contain;" />`,
    showCloseButton: true,
    showConfirmButton: false,
    width: "90%",
    background: '#f8f9fa'
  });
};

  return (
    <>
      <InternalNavbar />
        {/* Add this unit switcher section */}
  <div className="bg-gray-100 py-2 border-b">
    <div className="max-w-6xl mx-auto px-4">
      <div className="flex flex-wrap items-center justify-center gap-2">
        <span className="text-sm font-medium text-gray-700">Switch Unit:</span>
        <div className="flex gap-2">
          <button
            onClick={() => window.location.href = "/plant-machinery-maintenance-power-factor"}
            className="bg-gray-300 text-gray-800 px-4 py-1 rounded hover:bg-gray-400 text-sm"
          >
            Unit 1 
          </button>
          <button
            onClick={() => window.location.href = "/plant-machinery-maintenance-power-factor-unit2"}
            className="bg-gray-300 text-gray-800 px-4 py-1 rounded hover:bg-gray-400 text-sm"
          >
            Unit 2
          </button>
          <button
            onClick={() => window.location.href = "/plant-machinery-maintenance-power-factor-unit3"}
            className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700 text-sm"
          >
            Unit 3 (Current)
          </button>
        </div>
      </div>
    </div>
  </div>
      <div className="p-2 sm:p-4 relative">
        <h1 className="text-xl font-bold mb-4 text-center sm:text-left">
          THERMO PACKERS - Unit 3 - Daily Electricity PF (Power Factor Report)
        </h1>

        <div className="flex flex-col sm:flex-row justify-between items-center mb-2 gap-2">
          <h2 className="text-lg font-semibold">Main Electric Panel- Unit 3</h2>
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
   <th className="border px-2 py-1">
  <div className="flex flex-col items-center">
    <span>KWH</span>
    <img 
      src="/images/po2.jpg" // Adjust filename as needed
      alt="KWH Example" 
      className="w-10 h-10 object-cover border rounded cursor-pointer mt-1"
      onClick={() => openExampleImage("KWH")}
      title="Click to view larger example"
    />
  </div>
</th>
<th className="border px-2 py-1">
  <div className="flex flex-col items-center">
    <span>KVAH</span>
    <img 
      src="/images/po1.jpg" // Adjust filename as needed
      alt="KVAH Example" 
      className="w-10 h-10 object-cover border rounded cursor-pointer mt-1"
      onClick={() => openExampleImage("KVAH")}
      title="Click to view larger example"
    />
  </div>
</th>
    <th className="border px-2 py-1">Net KWH (New KWH - Old KWH)</th>
    <th className="border px-2 py-1">Net KVAH (New KVAH - Old KVAH)</th>
    <th className="border px-2 py-1">Power Factor (Net KWH/Net KVAH)(Should be near to 0.99)</th>
    {/* <th className="border px-2 py-1">Sign of Plant Manager</th> */}
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
  <input
    type="date"
    value={new Date(r.date || new Date()).toISOString().split('T')[0]}
    onChange={(e) => handleInputChange(i, "date", new Date(e.target.value))}
    max={new Date().toISOString().split('T')[0]} // This restricts future dates
    className="w-28 sm:w-32 border p-1 text-xs"
  />
</td>
                  <td className="border px-2 py-1">
               <input
  type="number"
  step="0.01"
  value={r.kwh === 0 ? 0 : r.kwh || ""}
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
  r.powerFactor >= 0.95 && r.powerFactor <= 1
    ? "bg-green-200"
    : "bg-red-200"
}`}
                  >
                    {r.powerFactor || "-"}
                  </td>
                  {/* <td className="border px-2 py-1">
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
                  </td> */}
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