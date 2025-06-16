import React, { useEffect, useState } from "react";
import axiosInstance from "../axiosInstance";
import toast from "react-hot-toast";
import imageCompression from "browser-image-compression";
import axios from "axios";

const AssignTaskForm = ({
  users,
  onTaskCreated,
  task = null,
  onCancelEdit = () => {},
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedToList, setAssignedToList] = useState([""]);
  const [dueDate, setDueDate] = useState("");
  const [repeat, setRepeat] = useState("ONE_TIME");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [existingImages, setExistingImages] = useState([]);
  const [newImages, setNewImages] = useState([]);

  useEffect(() => {
    if (task) {
      setTitle(task.title || "");
      setDescription(task.description || "");
      setAssignedToList([task.assignedTo?._id || task.assignedTo || ""]);
      setDueDate(task.dueDate ? task.dueDate.slice(0, 10) : "");
      setRepeat(task.repeat || "ONE_TIME");
      setExistingImages(task.images || []);
    } else {
      setTitle("");
      setDescription("");
      setAssignedToList([""]);
      setDueDate("");
      setRepeat("ONE_TIME");
      setExistingImages([]);
      setNewImages([]);
    }
  }, [task]);

  const handleImageChange = async (e) => {
    const files = Array.from(e.target.files);
    const newImagesArray = [];

    for (const file of files) {
      if (file.type.startsWith("image/")) {
        const options = { maxSizeMB: 0.5, maxWidthOrHeight: 800 };
        const compressed = await imageCompression(file, options);
        compressed.originalName = file.name;
        newImagesArray.push(compressed);
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

  const uploadImagesToCloudinary = async () => {
    const uploaded = [];
    try {
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
    } catch (err) {
      console.error(
        "Cloudinary Upload Error:",
        err.response?.data || err.message
      );
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
      const uploadedImageUrls = await uploadImagesToCloudinary();
      const allImages = [...existingImages, ...uploadedImageUrls];

      await Promise.all(
        assignedToList.map(async (userId) => {
          const payload = {
            title,
            description,
            assignedTo: userId,
            dueDate: dueDate || null,
            repeat,
            images: allImages,
          };
          await axiosInstance.post("/todos/create", payload);
        })
      );

      toast.success("Tasks assigned successfully!");

      setTitle("");
      setDescription("");
      setAssignedToList([""]);
      setDueDate("");
      setRepeat("ONE_TIME");
      setExistingImages([]);
      setNewImages([]);
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
              {users.map((user) => (
                <option key={user._id} value={user._id}>
                  {user.name} ({user.role})
                </option>
              ))}
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
            <option value="DAILY">Repeat every day</option> {/* ✅ Add this */}
          <option value="MONTHLY">Repeat every month</option>
          <option value="YEARLY">Repeat every year</option>
        </select>
      </div>

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

        <input
          type="file"
          multiple
          accept="image/*,application/pdf"
          onChange={handleImageChange}
          className="mt-2"
        />
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
