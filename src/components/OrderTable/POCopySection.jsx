import React from 'react';
import Swal from "sweetalert2";
import axiosInstance from "../../axiosInstance";

const POCopySection = ({ order, resolvedPOUrls }) => {
  const handleUploadPOCopy = async () => {
    const isArray = Array.isArray(order.poCopy);
    const title = isArray ? "Upload more PO Copies" : "Upload PO Copy";
    const multiple = isArray;

    const { value: files } = await Swal.fire({
      title,
      input: "file",
      inputAttributes: {
        accept: "application/pdf,image/*",
        multiple,
        "aria-label": "Upload PO Copy",
      },
      confirmButtonText: "Upload",
      showCancelButton: true,
    });

    if (files) {
      const selectedFiles = Array.from(files instanceof FileList ? files : [files]);
      const formData = new FormData();
      selectedFiles.forEach((f) => formData.append("poCopy", f));

      try {
        await axiosInstance.post(`/files/upload/po-copy/${order._id}`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

        Swal.fire("✅ Uploaded!", "PO Copy uploaded successfully", "success");
        window.location.reload();
      } catch (err) {
        Swal.fire("❌ Error", "Failed to upload PO Copy", "error");
        console.error(err);
      }
    }
  };

  const poCopyArray = Array.isArray(order.poCopy)
    ? order.poCopy
    : order.poCopy
    ? [order.poCopy]
    : [];

  return (
    <div className="flex flex-col gap-1">
      {poCopyArray.length > 0 ? (
        poCopyArray.map((fileUrl, idx) => {
          const isPdfFile = fileUrl.toLowerCase().includes(".pdf");
          const finalUrl = resolvedPOUrls?.[order._id]?.[idx] || fileUrl;
          const originalName = Array.isArray(order.poOriginalName)
            ? order.poOriginalName[idx] || `PO Copy ${idx + 1}`
            : order.poOriginalName || `PO Copy ${idx + 1}`;

          if (!finalUrl) {
            return (
              <div key={idx} className="text-sm text-gray-500 italic">
                📄 {originalName} — old file, not viewable.
              </div>
            );
          }

          return (
            <button
              key={idx}
              onClick={() => {
                Swal.fire({
                  title: originalName,
                  html: isPdfFile
                    ? `<div style="height:500px">
                         <p style="font-size:14px;color:gray;">⏳ Loading PDF preview...</p>
                         <iframe src="${finalUrl}" width="100%" height="480px" style="border:none;"></iframe>
                         <p style="font-size:12px;"><a href="${finalUrl}" target="_blank" style="color:blue;">Open in new tab</a></p>
                       </div>`
                    : `<img src="${finalUrl}" style="max-width:100%; max-height:500px;" />`,
                  showCancelButton: true,
                  showConfirmButton: false,
                  cancelButtonText: "Close",
                });
              }}
              className="text-blue-600 underline hover:text-blue-800 text-left truncate"
            >
              📄 {originalName}
            </button>
          );
        })
      ) : (
        <div className="text-xs sm:text-sm text-gray-500 italic">
          No PO Copy uploaded yet.
        </div>
      )}

      <button
        onClick={handleUploadPOCopy}
        className="text-xs sm:text-sm text-gray-600 underline hover:text-red-600"
      >
        📤 Upload PO Copy
      </button>
    </div>
  );
};

export default POCopySection;