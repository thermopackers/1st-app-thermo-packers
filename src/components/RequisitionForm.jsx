import RecordRTC from "recordrtc";
import React, { useEffect, useState } from "react";
import imageCompression from "browser-image-compression";
import toast from "react-hot-toast";
import InternalNavbar from "./InternalNavbar";
import axiosInstance from "../axiosInstance";

export default function RequisitionForm() {
  const [assignedTo, setAssignedTo] = useState("");

const [recorder, setRecorder] = useState(null);
const [audioBlob, setAudioBlob] = useState(null);
const [audioURL, setAudioURL] = useState("");
const [isRecording, setIsRecording] = useState(false);

const startRecording = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const newRecorder = new RecordRTC(stream, { type: "audio" });
    newRecorder.startRecording();
    setRecorder(newRecorder);
    setIsRecording(true);
  } catch (err) {
    console.error("Microphone access denied or failed:", err);
    toast.error("🎙️ Please allow microphone access to start recording.");
  }
};


const stopRecording = async () => {
  recorder.stopRecording(() => {
    const blob = recorder.getBlob();
    setAudioBlob(blob);
    setAudioURL(URL.createObjectURL(blob));
    setIsRecording(false);
  });
};

  const [items, setItems] = useState([
    { name: "", quantity: 1, requiredBy: "", remarks: "" },
  ]);
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [editId, setEditId] = useState(null); // 🆕
 useEffect(() => {
    const stored = localStorage.getItem("editRequisitionSlip");
    if (stored) {
      const data = JSON.parse(stored);
      setAssignedTo(data.createdBy || "");
      setItems(data.items || []);
     setPreviews(
  (data.attachments || [])
    .filter((url) => url.startsWith("http") && url.includes("cloudinary"))
    .map((url) => {
      const type = url.includes(".pdf")
        ? "pdf"
        : url.includes(".webm") || url.includes(".mp3")
        ? "audio"
        : "image";
      return { name: url, url, type };
    })
);


      setEditId(data._id); // 🆕 set edit mode
    }
  }, []);
  const handleItemChange = (i, field, value) => {
    const updated = [...items];
    updated[i][field] = value;
    setItems(updated);
  };

  const addItem = () =>
    setItems([
      ...items,
      { name: "", quantity: 1, requiredBy: "", remarks: "" },
    ]);

  const removeItem = (index) => {
    if (items.length === 1)
      return toast.error("At least one item is required.");
    const updated = [...items];
    updated.splice(index, 1);
    setItems(updated);
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    const newFiles = [...files, ...selectedFiles];

    const newPreviews = selectedFiles.map((file) =>
      file.type.startsWith("image/")
        ? { name: file.name, url: URL.createObjectURL(file), type: "image" }
        : { name: file.name, url: "", type: "pdf" }
    );

    setFiles(newFiles);
    setPreviews([...previews, ...newPreviews]);
  };

  const removeFile = (index) => {
    const updatedFiles = [...files];
    const updatedPreviews = [...previews];
    updatedFiles.splice(index, 1);
    updatedPreviews.splice(index, 1);
    setFiles(updatedFiles);
    setPreviews(updatedPreviews);
  };

  const uploadFilesToCloudinary = async () => {
    const uploadPromises = files.map(async (file) => {
      const isImage = file.type.startsWith("image/");
      const uploadFile = isImage
        ? await imageCompression(file, {
            maxSizeMB: 0.3,
            maxWidthOrHeight: 1024,
            useWebWorker: true,
          })
        : file;

      const formData = new FormData();
      formData.append("file", uploadFile);
      formData.append("upload_preset", "todo_uploads");
      formData.append("cloud_name", "dcr8k5amk");

      const res = await fetch(
        "https://api.cloudinary.com/v1_1/dcr8k5amk/upload",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await res.json();
      return data.secure_url;
    });

     if (audioBlob) {
    const audioForm = new FormData();
    audioForm.append("file", audioBlob);
    audioForm.append("upload_preset", "todo_uploads");
    audioForm.append("resource_type", "video"); // audio is uploaded as video
    const res = await fetch("https://api.cloudinary.com/v1_1/dcr8k5amk/upload", {
      method: "POST",
      body: audioForm,
    });
    const data = await res.json();
    uploadPromises.push(Promise.resolve(data.secure_url));
  }

  const uploadedUrls = await Promise.all(uploadPromises);
  return uploadedUrls.filter(Boolean);
};

  const resetForm = () => {
    setAssignedTo("");
    setItems([{ name: "", quantity: 1, requiredBy: "", remarks: "" }]);
    setFiles([]);
    setPreviews([]);
     setAudioBlob(null);
  setAudioURL("");
  setRecorder(null);
  setIsRecording(false);
   setEditId(null); // 🆕
  localStorage.removeItem("editRequisitionSlip"); // 🆕
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    toast.dismiss();
  toast.loading(editId ? "Updating..." : "Uploading...");

    try {
        const attachments = await uploadFilesToCloudinary();
const allAttachments = [
  ...attachments,
  ...previews
    .filter((p) => p.url.startsWith("http") && p.url.includes("cloudinary"))
    .map((p) => p.url),
];

    const payload = {
      createdBy: assignedTo,
      items: JSON.stringify(items),
      attachments: allAttachments,
    };

    let res;
    if (editId) {
      res = await axiosInstance.put(`/requisitions/update/${editId}`, payload);
    } else {
      res = await axiosInstance.post("/requisitions/create", payload);
    }

      toast.dismiss();
    toast.success(editId ? "Requisition updated!" : "Requisition uploaded!");
      console.log(res.data);
      resetForm();
    } catch (err) {
      toast.dismiss();
      toast.error("Failed to upload requisition.");
      console.error(err);
    }
  };

  return (
    <>
      <InternalNavbar />
      <div className="max-w-5xl mx-auto p-6 mt-6 bg-white shadow-xl rounded-xl">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          📋 Material Requisition Slip
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <input
            type="text"
            placeholder="Material required for which Department/Area/Machine"
            value={assignedTo}
            onChange={(e) => setAssignedTo(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400"
            required
          />

          {items.map((item, i) => (
           <div key={i} className="grid grid-cols-1 sm:grid-cols-5 gap-4 items-start">
  <div className="flex flex-col">
    <label className="text-sm font-medium mb-1">Item Name(Mention specifications like Gauge/quality etc)</label>
    <input
      placeholder="Item Name"
      value={item.name}
      onChange={(e) => handleItemChange(i, "name", e.target.value)}
      className="p-3 border border-gray-300 rounded-lg"
      required
    />
  </div>

  <div className="flex flex-col">
    <label className="text-sm font-medium mb-1">Quantity</label>
    <input
      type="text"
      placeholder="Qty"
      value={item.quantity}
      onChange={(e) => handleItemChange(i, "quantity", e.target.value)}
      className="p-3 border border-gray-300 rounded-lg"
      required
    />
  </div>

  <div className="flex flex-col">
    <label className="text-sm font-medium mb-1">Required By Date</label>
    <input
      type="date"
      value={item.requiredBy}
      onChange={(e) => handleItemChange(i, "requiredBy", e.target.value)}
      className="p-3 border border-gray-300 rounded-lg"
    />
  </div>

  <div className="flex flex-col">
    <label className="text-sm font-medium mb-1">Remarks</label>
    <input
      placeholder="Remarks"
      value={item.remarks}
      onChange={(e) => handleItemChange(i, "remarks", e.target.value)}
      className="p-3 border border-gray-300 rounded-lg"
    />
  </div>

  <div className="flex items-end">
    <button
      type="button"
      onClick={() => removeItem(i)}
      title="Remove Item"
      className="text-red-600 text-lg hover:text-red-800 transition"
    >
      ❌
    </button>
  </div>
</div>

          ))}

          <input
            type="file"
            multiple
            onChange={handleFileChange}
            accept="image/*,.pdf"
            className="w-full border border-dashed border-gray-400 p-4 rounded-lg"
          />

        {previews.length > 0 && (
  <div className="flex flex-wrap gap-4 mt-4">
    {previews.map((file, i) => (
      <div
        key={i}
        className="relative border rounded-lg p-2 bg-gray-50 shadow"
      >
        {file.type === "image" ? (
          <img
            src={file.url}
            alt={file.name}
            className="h-24 w-24 object-cover rounded"
          />
        ) : file.type === "pdf" ? (
          <div className="h-24 w-24 flex items-center justify-center bg-gray-200 text-sm text-gray-600 rounded">
            📄 PDF
          </div>
        ) : file.type === "audio" ? (
          <audio controls src={file.url} className="w-48 h-12 rounded" />
        ) : null}

        <button
          type="button"
          onClick={() => removeFile(i)}
          className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center hover:bg-red-700"
        >
          ×
        </button>
      </div>
    ))}
  </div>
)}


        <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-wrap">
  {/* Add Item Button */}
  <button
    type="button"
    onClick={addItem}
    className="w-full sm:w-auto px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
  >
    + Add Item
  </button>

  {/* Recording Controls */}
  <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
    {!isRecording ? (
      <button
        type="button"
        onClick={startRecording}
        className="px-6 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 w-full sm:w-auto"
      >
        🎙️ Start Recording
      </button>
    ) : (
      <button
        type="button"
        onClick={stopRecording}
        className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 w-full sm:w-auto"
      >
        ⏹️ Stop Recording
      </button>
    )}

   {audioURL && (
  <div className="relative w-full sm:w-64 mt-2 sm:mt-0">
    <audio
      controls
      src={audioURL}
      className="w-full rounded"
    />
    <button
      type="button"
      onClick={() => {
        setAudioURL("");
        setAudioBlob(null);
        setRecorder(null);
      }}
      className="absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center hover:bg-red-700"
      title="Remove recording"
    >
      ×
    </button>
  </div>
)}

  </div>

  {/* Submit Button */}
  <button
    type="submit"
    className="w-full sm:w-auto px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
  >
    ✅ Submit
  </button>
</div>
{editId && (
  <button
    type="button"
    onClick={resetForm}
    className="w-full sm:w-auto px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
  >
    ❌ Cancel Edit
  </button>
)}

        </form>
      </div>
    </>
  );
}
