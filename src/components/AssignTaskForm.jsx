import React, { useEffect, useState } from "react";
import axiosInstance from "../axiosInstance";
import RecordRTC from 'recordrtc';
import toast from "react-hot-toast";
import imageCompression from "browser-image-compression";
import axios from "axios";
import Select from "react-select";

const AssignTaskForm = ({
  users,
  onTaskCreated,
  task = null,
  onCancelEdit = () => {},
}) => {
  const [title, setTitle] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [description, setDescription] = useState("");
  const [isOrderFollowUp, setIsOrderFollowUp] = useState(false);
  const [assignedToList, setAssignedToList] = useState([""]);
  const [dueDate, setDueDate] = useState("");
  const [repeat, setRepeat] = useState("ONE_TIME");
  const [recordedBlob, setRecordedBlob] = useState(null);
const [recording, setRecording] = useState(false);
const [recorder, setRecorder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [existingImages, setExistingImages] = useState([]);
  const [newImages, setNewImages] = useState([]);
const [products, setProducts] = useState([]);
const [productSearch, setProductSearch] = useState("");
const [selectedProducts, setSelectedProducts] = useState([]);

// Check for microphone permission in Fully Kiosk
useEffect(() => {
  const isFullyKiosk = navigator.userAgent.includes('FullyKiosk') || window.FullyKiosk;
  
  if (isFullyKiosk) {
    console.log("Running in Fully Kiosk - configuring mic access");
    
    // Check if mediaDevices is available
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.warn("getUserMedia not supported in this browser");
      
      // Show warning after a delay
      setTimeout(() => {
        toast.error(
          "Voice recording may not work in this app. Use Chrome browser for voice notes.",
          { duration: 5000 }
        );
      }, 1000);
    }
  }
}, []);

useEffect(() => {
  const fetchProducts = async () => {
    try {
      const res = await axiosInstance.get(`/products-multer?search=${productSearch}`);
      setProducts(res.data.products || []);
    } catch (err) {
      console.error("Error fetching products:", err);
    }
  };
  fetchProducts();
}, [productSearch]);

  useEffect(() => {
    if (task) {
      setTitle(task.title || "");
      setDescription(task.description || "");
      setAssignedToList([task.assignedTo?._id || task.assignedTo || ""]);
      setDueDate(task.dueDate ? task.dueDate.slice(0, 10) : "");
      setRepeat(task.repeat || "ONE_TIME");
      setExistingImages(task.images || []);
      setIsOrderFollowUp(task?.isOrderFollowUp || false);
      setCustomerPhone(task?.customerPhone || ""); // ✅ Add this line
      setSelectedProducts( // ✅ Add this for products
        task.products?.map(p => ({
          value: p._id,
          label: `${p.name} ${p.unit ? `(${p.unit})` : ''}`
        })) || []
      );
    } else {
      setTitle("");
      setDescription("");
      setAssignedToList([""]);
      setDueDate("");
      setRepeat("ONE_TIME");
      setExistingImages([]);
      setNewImages([]);
      setIsOrderFollowUp(false);
      setCustomerPhone(""); // ✅ Reset customer phone
      setSelectedProducts([]); // ✅ Reset products
    }
  }, [task]);
  
const startRecording = async () => {
  try {
    // Check if getUserMedia is available
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      toast.error('Voice recording is not supported in this browser. Please use Chrome.');
      return;
    }
    
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const newRecorder = new RecordRTC(stream, {
      type: 'audio',
      mimeType: 'audio/webm',
    });
    newRecorder.startRecording();
    setRecorder(newRecorder);
    setRecording(true);
    toast.success('Recording started. Click Stop when done.');
  } catch (err) {
    console.error('Microphone error:', err);
    
    if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
      toast.error('Microphone access denied. Please allow microphone in browser settings.');
    } else if (err.name === 'NotFoundError') {
      toast.error('No microphone found on this device.');
    } else {
      toast.error('Failed to start recording. Please check microphone.');
    }
  }
};

const stopRecording = () => {
  recorder.stopRecording(() => {
    const blob = recorder.getBlob();
    setRecordedBlob(blob);
    setRecorder(null);
    setRecording(false);
  });
};

const handleImageChange = async (e) => {
  const files = Array.from(e.target.files);
  const newImagesArray = [];

  for (const file of files) {
    if (file.type.startsWith("image/")) {
      // Remove compression - just use the original file
      file.originalName = file.name;
      newImagesArray.push(file);
    } else {
      file.originalName = file.name;
      newImagesArray.push(file);
    }
  }

  setNewImages((prev) => [...prev, ...newImagesArray]);
};

  const handleRemoveNewImage = (index) => {
    const updated = [...newImages];
    updated.splice(index, 1);
    setNewImages(updated);
  };

  const handleRemoveExistingImage = (index) => {
    const updated = [...existingImages];
    updated.splice(index, 1);
    setExistingImages(updated);
  };

const uploadFilesToCloudinary = async () => {
  const uploaded = [];

  try {
    // Upload new images or PDFs
    for (const image of newImages) {
      const formData = new FormData();
      formData.append("file", image);
      formData.append("upload_preset", "todo_uploads");
      formData.append("folder", "todos");

      const resourceType = image.type === "application/pdf" ? "raw" : "image";

      const res = await axios.post(
        `https://api.cloudinary.com/v1_1/dcr8k5amk/${resourceType}/upload`,
        formData
      );

      uploaded.push(res.data.secure_url);
    }

    // Upload recorded audio if exists
    if (recordedBlob) {
      const audioData = new FormData();
      audioData.append("file", recordedBlob);
      audioData.append("upload_preset", "todo_uploads");
      audioData.append("folder", "todos");

      const audioRes = await axios.post(
        `https://api.cloudinary.com/v1_1/dcr8k5amk/video/upload`, // 📌 use `video` for audio/webm
        audioData
      );

      uploaded.push(audioRes.data.secure_url);
    }

  } catch (err) {
    console.error("Cloudinary Upload Error:", err.response?.data || err.message);
    throw err;
  }

  return uploaded;
};


const handleSubmit = async (e) => {
  e.preventDefault();
  setError("");

  if (!title.trim() || assignedToList.some((id) => !id)) {
    setError("Please fill title and assign all users.");
    return;
  }

  setLoading(true);

  try {
const uploadedImageUrls = await uploadFilesToCloudinary();
    const allImages = [...existingImages, ...uploadedImageUrls];

    if (task?._id) {
      // ✅ Update the existing task (only 1 user can be updated)
      const payload = {
        title,
        description,
        assignedTo: assignedToList[0],
        dueDate: dueDate || null,
        repeat,
        images: allImages,
        isOrderFollowUp,
products: selectedProducts.map((p) => p.value), // ✅ correct
customerPhone
      };
      await axiosInstance.put(`/todos/${task._id}`, payload);
      toast.success("Task updated successfully!");
    } else {
      // ✅ Create tasks for each user
      await Promise.all(
        assignedToList.map(async (userId) => {
          const payload = {
            title,
            description,
            assignedTo: userId,
            dueDate: dueDate || null,
            repeat,
            images: allImages,
            isOrderFollowUp,
products: selectedProducts.map((p) => p.value), // ✅ correct
customerPhone
          };
          await axiosInstance.post("/todos/create", payload);
        })
      );
      toast.success("Tasks assigned successfully!");
    }

    // Clear form
    setTitle("");
    setDescription("");
    setAssignedToList([""]);
    setDueDate("");
    setRepeat("ONE_TIME");
    setExistingImages([]);
    setNewImages([]);
      setRecordedBlob(null); // ✅ This clears the audio recording
    onTaskCreated();
  } catch (err) {
    setError("Failed to save task.");
    toast.error("Failed to save task. Please try again.");
  } finally {
    setLoading(false);
  }
};


  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white p-8 rounded-lg shadow-lg max-w-md mx-auto space-y-6 border border-gray-200"
    >
      <h2 className="text-2xl font-bold text-indigo-700 mb-4 text-center select-none">
        {task ? "Update Task" : "Assign New Task"}
      </h2>

      {error && (
        <p className="text-center text-red-600 bg-red-100 border border-red-300 rounded px-4 py-2">
          {error}
        </p>
      )}

      <div>
        <label
          htmlFor="title"
          className="block text-gray-700 font-semibold mb-2"
        >
          Title<span className="text-red-500">*</span>
        </label>
        <input
          id="title"
          type="text"
          className="w-full border border-gray-300 rounded-md p-3"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Task title"
          required
        />
      </div>

      <div>
        <label
          htmlFor="description"
          className="block text-gray-700 font-semibold mb-2"
        >
          Description
        </label>
        <textarea
          id="description"
          className="w-full border border-gray-300 rounded-md p-3 resize-none"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Task description"
          rows={4}
        />
      </div>

    <div>
  <label className="block text-gray-700 font-semibold mb-2">
    Select Products to sell:
  </label>

{selectedProducts.map((prod, index) => (
  <div key={index} className="flex space-x-2 mb-2">
    <Select
      options={products.map((p) => ({
        value: p._id,
        label: `${p.name} (${p.unit})`,
      }))}
      value={prod || null}   // 👈 just use the object directly
      onInputChange={(val) => setProductSearch(val)}
      onChange={(opt) => {
        const newList = [...selectedProducts];
        newList[index] = opt || null;  // 👈 save object
        setSelectedProducts(newList.filter(Boolean));
      }}
      isClearable
      placeholder="Search & select product..."
      className="flex-1"
    />
    {selectedProducts.length > 1 && (
      <button
        type="button"
        onClick={() =>
          setSelectedProducts(selectedProducts.filter((_, i) => i !== index))
        }
        className="text-red-600 font-bold"
      >
        ✕
      </button>
    )}
  </div>
))}


<button
  type="button"
  onClick={() => setSelectedProducts([...selectedProducts, null])}
  className="text-sm text-indigo-600 hover:underline"
>
  ➕ Add another product
</button>

</div>




      <div>
        <label
          htmlFor="assignedTo"
          className="block text-gray-700 font-semibold mb-2"
        >
          Assign To<span className="text-red-500">*</span>
        </label>
        {assignedToList.map((userId, index) => (
          <div key={index} className="flex space-x-2 mb-2">
            <select
              className="w-full border border-gray-300 rounded-md p-3"
              value={userId}
              onChange={(e) => {
                const newList = [...assignedToList];
                newList[index] = e.target.value;
                setAssignedToList(newList);
              }}
              required
            >
              <option value="">Select user</option>
             {users
  .filter((user) => user.role && 
    (Array.isArray(user.role) ? user.role.length > 0 : user.role.trim() !== "")
  )
  .map((user) => {
    const roleDisplay = Array.isArray(user.role) 
      ? user.role.join(", ") 
      : user.role;
    
    return (
      <option key={user._id} value={user._id}>
        {user.name} ({roleDisplay})
      </option>
    );
  })}
            </select>
            {assignedToList.length > 1 && (
              <button
                type="button"
                onClick={() =>
                  setAssignedToList(
                    assignedToList.filter((_, i) => i !== index)
                  )
                }
                className="text-red-600 font-bold"
              >
                ✕
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={() => setAssignedToList([...assignedToList, ""])}
          className="text-sm text-indigo-600 hover:underline"
        >
          ➕ Add another user
        </button>
      </div>

     {!isOrderFollowUp && (
  <div>
    <label
      htmlFor="dueDate"
      className="block text-gray-700 font-semibold mb-2"
    >
      Due Date
    </label>
    <input
      id="dueDate"
      type="date"
      className="w-full border border-gray-300 rounded-md p-3"
      value={dueDate}
      onChange={(e) => setDueDate(e.target.value)}
    />
  </div>
)}


  {!isOrderFollowUp && (
  <div>
    <label
      htmlFor="repeat"
      className="block text-gray-700 font-semibold mb-2"
    >
      Repeat
    </label>
    <select
      id="repeat"
      className="w-full border border-gray-300 rounded-md p-3"
      value={repeat}
      onChange={(e) => setRepeat(e.target.value)}
    >
      <option value="ONE_TIME">One time</option>
      <option value="DAILY">Repeat every day</option>
      <option value="MONTHLY">Repeat every month</option>
      <option value="YEARLY">Repeat every year</option>
    </select>
  </div>
)}

      <div className="flex items-center mt-2">
  <input
    type="checkbox"
    id="followUp"
    checked={isOrderFollowUp}
    onChange={(e) => setIsOrderFollowUp(e.target.checked)}
    className="mr-2"
  />
  <label htmlFor="followUp" className="text-gray-700 font-medium">
    This task requires daily sales follow-up
  </label>
</div>

{isOrderFollowUp && (
  <div>
    <label
      htmlFor="customerPhone"
      className="block text-gray-700 font-semibold mb-2"
    >
      Customer Phone Number
    </label>
    <input
      id="customerPhone"
      type="tel"
      className="w-full border border-gray-300 rounded-md p-3"
      value={customerPhone}
      onChange={(e) => setCustomerPhone(e.target.value)}
      placeholder="Customer phone number for WhatsApp"
    />
  </div>
)}

      <div className="space-y-2">
        <label className="block text-gray-700 font-semibold mb-2">Images</label>
        {existingImages.map((url, idx) => (
          <div key={idx} className="relative inline-block mr-2">
            <img
              src={url}
              alt="existing"
              className="w-24 h-24 object-cover rounded"
            />
            <button
              type="button"
              onClick={() => handleRemoveExistingImage(idx)}
              className="absolute top-0 right-0 bg-red-600 text-white rounded-full p-1 text-xs"
            >
              ✕
            </button>
          </div>
        ))}

        {newImages.map((file, idx) => (
          <div key={idx} className="relative inline-block mr-2">
            {file.type === "application/pdf" ? (
              <div className="w-24 h-24 bg-gray-100 flex items-center justify-center rounded overflow-hidden">
                <img
                  src="./images/pdf.png"
                  alt="PDF preview"
                  className="w-12 h-12 object-contain"
                  onClick={() =>
                    window.open(URL.createObjectURL(file), "_blank")
                  }
                  style={{ cursor: "pointer" }}
                />
              </div>
            ) : (
              <img
                src={URL.createObjectURL(file)}
                alt="preview"
                className="w-24 h-24 object-cover rounded"
              />
            )}
            <button
              type="button"
              onClick={() => handleRemoveNewImage(idx)}
              className="absolute top-0 right-0 bg-red-600 text-white rounded-full p-1 text-xs"
            >
              ✕
            </button>
          </div>
        ))}

       {/* Camera/Photo buttons for Fully Kiosk compatibility */}
<div className="flex flex-col gap-3 mt-2">
  <div className="flex gap-3">
    <button
      type="button"
      onClick={() => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*,application/pdf';
        input.multiple = true;
        input.capture = 'environment';
        input.onchange = (e) => handleImageChange(e);
        input.click();
      }}
      className="flex-1 bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 transition flex items-center justify-center gap-2 text-sm"
    >
      📸 Take Photo
    </button>
    
    {/* <button
      type="button"
      onClick={() => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*,application/pdf';
        input.multiple = true;
        input.onchange = (e) => handleImageChange(e);
        input.click();
      }}
      className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2 text-sm"
    >
      📁 Choose File
    </button> */}
  </div>
  
  <input
    type="file"
    multiple
    accept="image/*,application/pdf"
    onChange={handleImageChange}
    className="hidden"
    id="fileUploadInput"
  />
  
 
</div>
      </div>
<div className="mt-4 space-y-2">
  <label className="block text-gray-700 font-semibold mb-2">Voice Note</label>
  
  {recording ? (
    <button
      type="button"
      onClick={stopRecording}
      className="bg-red-500 text-white px-4 py-2 rounded w-full flex items-center justify-center gap-2"
    >
      ⏹ Stop Recording (Recording in progress...)
    </button>
  ) : (
    <button
      type="button"
      onClick={startRecording}
      className="bg-green-600 text-white px-4 py-2 rounded w-full flex items-center justify-center gap-2"
    >
      🎙 Start Recording Voice Note
    </button>
  )}
  
  {recordedBlob && (
    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
      <audio controls className="w-full">
        <source src={URL.createObjectURL(recordedBlob)} type="audio/webm" />
      </audio>
      <button
        type="button"
        onClick={() => setRecordedBlob(null)}
        className="mt-2 text-red-600 text-sm hover:text-red-800"
      >
        Remove Recording
      </button>
    </div>
  )}
</div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-indigo-600 text-white py-3 rounded-md font-semibold hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed transition duration-300"
      >
        {task ? "Update Task" : "Assign Task"}
      </button>

      {task?._id && (
        <button
          type="button"
          onClick={onCancelEdit}
          className="ml-3 px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
        >
          Cancel Edit
        </button>
      )}
    </form>
  );
};

export default AssignTaskForm;