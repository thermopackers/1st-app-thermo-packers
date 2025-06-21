import React, { useEffect, useState } from "react";
import { useToDo } from "../context/ToDoContext";
import axiosInstance from "../axiosInstance";
import Swal from "sweetalert2"; // Make sure you have installed sweetalert2 via npm/yarn
import InternalNavbar from "../components/InternalNavbar";
import AssignTaskForm from "../components/AssignTaskForm";
import { useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import SalesFollowUpForm from "./SalesFollowUpForm";
import { useUserContext } from "../context/UserContext";

const AdminDashboard = () => {
  const { user } = useUserContext(); // Get logged-in user info

  const {
    tasks,
    fetchAllTasks,
    loading,
    totalPages,
    currentPage,
    setCurrentPage,
  } = useToDo();
  console.log("tasks", tasks);

  const [users, setUsers] = useState([]);
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Get filters from URL or default
  const filterStatus = searchParams.get("status") || "";
  const selectedUser = searchParams.get("assignedTo") || "";
  const page = parseInt(searchParams.get("page") || "1", 10);
  const repeatFilter = searchParams.get("repeat") || "";

  // Fetch users once on mount
  useEffect(() => {
    axiosInstance
      .get("/users/get-all-users")
      .then((res) => setUsers(res.data))
      .catch((err) => console.error("Error fetching users:", err));
  }, []);

  // Fetch tasks whenever filters or page changes
  useEffect(() => {
    const params = {
      page,
      limit: 9,
      status: filterStatus || undefined,
      assignedTo: selectedUser || undefined,
      repeat: repeatFilter || undefined,
        assignedBy: user?._id, // 👈 Add this line to fetch only tasks assigned by current user
    };

    fetchAllTasks(params);
    setCurrentPage(page);
  }, [filterStatus, selectedUser, page]);

  // Update URL params when filters change
  const updateFilters = (newFilters) => {
    const repeatFilter = searchParams.get("repeat") || "";
    const updated = {
      status: newFilters.status ?? filterStatus,
      assignedTo: newFilters.assignedTo ?? selectedUser,
      repeat: newFilters.repeat ?? repeatFilter,
      page: newFilters.page ?? 1,
    };

    // Remove empty keys to keep URL clean
    Object.keys(updated).forEach((key) => {
      if (!updated[key]) delete updated[key];
    });

    setSearchParams(updated);
  };

  const clearFilters = () => {
    setSearchParams({});
  };

  const goToPage = (pageNum) => {
    updateFilters({ page: pageNum });
  };

  const handleDelete = async (taskId) => {
    if (confirm("Are you sure you want to delete this task?")) {
      try {
        await axiosInstance.delete(`/todos/${taskId}`);
        toast.success("Task deleted successfully!");
        fetchAllTasks({
          page: currentPage,
          limit: 9,
          status: filterStatus || undefined,
          assignedTo: selectedUser || undefined,
        });
      } catch (error) {
        console.error("Delete error:", error);
        toast.error("Failed to delete task");
      }
    }
  };

  return (
    <>
      <InternalNavbar />
      <div className="max-w-6xl mx-auto p-6 space-y-8">
        <button
          className="absolute cursor-pointer left-4 hidden md:block bg-blue-500 text-white px-4 py-2 rounded-md shadow-md hover:bg-blue-600 back-button"
          onClick={() => navigate(-1)}
        >
          ↩️ Back
        </button>
        <h1 className="md:text-4xl text-3xl font-extrabold text-indigo-700">
          Admin / Accounts ToDo Dashboard
        </h1>

        {/* Filters and Assign Task Button */}
        <div className="flex flex-wrap items-center gap-4">
          {!searchParams.get("isOrderFollowUp") && (
            <select
              className="border cursor-pointer border-gray-300 p-2 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              onChange={(e) =>
                updateFilters({ repeat: e.target.value, page: 1 })
              }
              value={searchParams.get("repeat") || ""}
            >
              <option value="">All Type of Tasks</option>
              <option value="One time">One time</option>
              <option value="Repeat every month">Repeat every month</option>
              <option value="Repeat every year">Repeat every year</option>
            </select>
          )}

          <select
            className="border cursor-pointer border-gray-300 p-2 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            onChange={(e) => updateFilters({ status: e.target.value, page: 1 })}
            value={filterStatus}
          >
            <option value="">All Status</option>
            <option value="NOT DONE">Pending</option>
            <option value="DONE">Done</option>
          </select>

          <button
            onClick={clearFilters}
            className="bg-gray-300 cursor-pointer font-bold hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-md shadow transition"
            title="Clear filters"
          >
            🗙 Clear Filters
          </button>

          <button
            onClick={() => {
              setShowAssignForm(!showAssignForm);
              setEditingTask(null);
            }}
            className="ml-auto cursor-pointer font-bold bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-md shadow transition flex items-center"
          >
            {showAssignForm ? "🗙 Close Assign Task" : "✏️ Assign Task"}
          </button>
        </div>

        {/* Assign Task Form */}
       <div
  className={`transition-all duration-500 ease-in-out max-w-3xl mx-auto rounded-lg shadow-lg
  bg-gradient-to-r from-indigo-50 via-white to-indigo-50 border border-indigo-300
  ${
    showAssignForm
      ? "opacity-100 p-8 mt-8"
      : "opacity-0 p-0 mt-0 hidden"
  }
  `}
>

          <h3 className="text-2xl font-semibold text-indigo-700 mb-6 border-b border-indigo-200 pb-3 select-none">
            {editingTask ? "Updating Existing Task" : "Assign New Task"}
          </h3>
          <AssignTaskForm
            users={users}
            task={editingTask}
            onTaskCreated={() => {
              fetchAllTasks({
                page: currentPage,
                limit: 9,
                status: filterStatus || undefined,
                assignedTo: selectedUser || undefined,
              });
              setShowAssignForm(false);
              setEditingTask(null);
            }}
            onCancelEdit={() => {
              setEditingTask(null);
              setShowAssignForm(false);
            }}
          />
        </div>

        {/* Task List */}
        <div>
          {loading ? (
            <p className="text-center text-gray-500 mt-12">Loading...</p>
          ) : tasks.length === 0 ? (
            <p className="text-center text-gray-500 mt-12">No tasks found!</p>
          ) : (
            <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {tasks.map((task) => {
                console.log(
                  "Task:",
                  task.title,
                  "isOrderFollowUp:",
                  task.isOrderFollowUp
                );

                return (
                  <div
                    key={task._id}
                    className={`bg-white p-5 shadow rounded-lg border-l-4 ${
                      task.isOrderFollowUp
                        ? "border-orange-500"
                        : "border-indigo-500"
                    } hover:shadow-lg transition relative`}
                  >
                    {task.isOrderFollowUp && (
                      <span className="text-orange-600 font-semibold p-1 bg-orange-200 text-sm ml-1">
                        Follow-up Task
                      </span>
                    )}

                    <h2
                      className={`text-xl font-semibold mb-2 ${
                        task.isOrderFollowUp
                          ? "text-orange-700"
                          : "text-indigo-800"
                      }`}
                    >
                      {task.title}
                    </h2>

                    <p className="text-gray-700 mb-3 break-words whitespace-pre-wrap">
                      {task.description}
                    </p>
                    {task.images && task.images.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {task.images.map((url, idx) => {
  const isPDF = url.toLowerCase().endsWith(".pdf");
  const isAudio = url.includes("audio") || url.includes(".webm");

  if (isAudio) {
    return (
      <div key={idx} className="w-full mt-2">
        <p className="text-sm text-gray-600 mb-1">🎧 Voice Note:</p>
        <audio controls className="w-full">
          <source src={url} type="audio/webm" />
          Your browser does not support the audio element.
        </audio>
      </div>
    );
  }

  if (isPDF) {
    return (
      <a
        key={idx}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block w-24 h-24 bg-gray-100 flex items-center justify-center rounded overflow-hidden"
      >
        <img
          src="./images/pdf.png"
          alt="PDF"
          className="w-12 h-12 object-contain"
        />
      </a>
    );
  }

  return (
    <img
      key={idx}
      src={url}
      alt={`Assigned File ${idx + 1}`}
      className="w-24 h-24 object-cover rounded cursor-pointer"
      onClick={() =>
        Swal.fire({
          imageUrl: url,
          imageAlt: `Assigned Image ${idx + 1}`,
          showConfirmButton: false,
          showCloseButton: true,
          width: "auto",
          padding: "1em",
        })
      }
    />
  );
})}

                      </div>
                    )}

                    <p className="text-sm text-gray-500">
                      Assigned To:{" "}
                      <span className="font-medium">
                        {task.assignedTo?.name || "N/A"}
                      </span>
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                      Assigned by: {task.assignedBy?.name || "N/A"}
                    </p>
                    <p className="text-sm text-gray-500">
                      Assigned on:{" "}
                      {task.assignedOn
                        ? new Date(task.assignedOn).toLocaleDateString()
                        : "N/A"}
                    </p>

                    {!task.isOrderFollowUp && task.repeat && (
                      <p className="text-sm text-gray-500 mt-1">
                        Repeat: {task.repeat}
                      </p>
                    )}

                    {!task.isOrderFollowUp && (
                      <p
                        className={`text-sm font-semibold mt-1 ${
                          task.status === "DONE"
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        Status: {task.status}
                      </p>
                    )}

                    {!task.isOrderFollowUp &&
                      task.status === "DONE" &&
                      task.doneRemarks && (
                        <p className="mt-2 text-gray-700 italic">
                          <strong>Remarks:</strong> {task.doneRemarks}
                        </p>
                      )}

                    {!task.isOrderFollowUp &&
                      task.status === "DONE" &&
                      task.doneFiles &&
                      task.doneFiles.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {task.doneFiles.map((url, idx) => {
  const isPdf = url.toLowerCase().endsWith(".pdf");
  const isAudio = url.includes("audio") || url.endsWith(".webm");

  if (isAudio) {
    return (
      <div key={idx} className="w-full mt-2">
        <p className="text-sm text-gray-600 mb-1">🎤 Uploaded Voice Note:</p>
        <audio controls className="w-full">
          <source src={url} type="audio/webm" />
          Your browser does not support the audio element.
        </audio>
      </div>
    );
  }

  if (isPdf) {
    return (
      <div
        key={idx}
        className="w-20 h-20 flex flex-col items-center justify-center bg-gray-100 rounded shadow cursor-pointer"
        onClick={() => window.open(url, "_blank")}
      >
        <img
          src="https://cdn-icons-png.flaticon.com/512/337/337946.png"
          alt={`PDF File ${idx + 1}`}
          className="w-10 h-10"
        />
        <span className="text-xs text-center mt-1">PDF {idx + 1}</span>
      </div>
    );
  }

  return (
    <img
      key={idx}
      src={url}
      alt={`Done Image ${idx + 1}`}
      className="w-20 h-20 object-cover rounded shadow cursor-pointer"
      onClick={() => {
        Swal.fire({
          imageUrl: url,
          imageAlt: "Done Image",
          showConfirmButton: false,
          showCloseButton: true,
          width: "50vw",
          padding: "1em",
        });
      }}
    />
  );
})
}
                        </div>
                      )}

                    {!task.isOrderFollowUp &&
                      task.status === "DONE" &&
                      task.doneOn && (
                        <p className="text-sm text-gray-500 mt-1">
                          Done on: {new Date(task.doneOn).toLocaleDateString()}
                        </p>
                      )}

                    {task.followUps && task.followUps.length > 0 && (
                      <div className="mt-4 text-sm text-gray-700 bg-gray-100 p-3 rounded">
                        <h4 className="font-semibold text-indigo-700 mb-2">
                          Sales Follow-Up
                        </h4>
                        {task.followUps.map((entry, idx) => (
                          <div key={idx} className="mb-2 border-b pb-2">
                            <p>
                              <strong>Status:</strong> {entry.response}
                            </p>
                            {entry.comments && (
                              <p>
                                <strong>Comment:</strong> {entry.comments}
                              </p>
                            )}
                            <p className="text-gray-500">
                              <strong>Submitted:</strong>{" "}
                              {new Date(entry.date).toLocaleDateString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="mt-4 flex gap-3">
                      <button
                        onClick={() => {
                          setEditingTask(task);
                          setShowAssignForm(true);
                          window.scrollTo({ top: 0, behavior: "smooth" }); // 👈 scrolls to top
                        }}
                        className="w-full flex items-center cursor-pointer justify-center gap-1 px-3 py-2 bg-indigo-500 text-white rounded-md shadow hover:bg-indigo-600 transition"
                        aria-label={`Edit task ${task.title}`}
                      >
                        <span>✏️</span> Edit
                      </button>

                      <button
                        onClick={() => handleDelete(task._id)}
                        className="w-full flex items-center cursor-pointer justify-center gap-1 px-3 py-2 bg-rose-500 text-white rounded-md shadow hover:bg-rose-600 transition"
                        aria-label={`Delete task ${task.title}`}
                      >
                        <span>🗑️</span> Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-8 space-x-3 flex-wrap">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className={`px-3 py-1 cursor-pointer rounded border ${
                  currentPage === 1
                    ? "text-gray-400 border-gray-300 cursor-not-allowed"
                    : "text-indigo-600 border-indigo-600 hover:bg-indigo-100"
                }`}
              >
                Prev
              </button>

              {[...Array(totalPages).keys()].map((_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => goToPage(pageNum)}
                    className={`px-3 py-1 rounded border ${
                      pageNum === currentPage
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "text-indigo-600 border-indigo-600 hover:bg-indigo-100"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`px-3 py-1 cursor-pointer rounded border ${
                  currentPage === totalPages
                    ? "text-gray-400 border-gray-300 cursor-not-allowed"
                    : "text-indigo-600 border-indigo-600 hover:bg-indigo-100"
                }`}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default AdminDashboard;
