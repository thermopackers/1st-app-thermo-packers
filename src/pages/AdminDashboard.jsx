import React, { useEffect, useState } from 'react';
import { useToDo } from '../context/ToDoContext';
import axiosInstance from '../axiosInstance';
import InternalNavbar from '../components/InternalNavbar';
import AssignTaskForm from '../components/AssignTaskForm';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const {
    tasks,
    fetchAllTasks,
    loading,
    totalPages,
    currentPage,
    setCurrentPage,
  } = useToDo();

  const [users, setUsers] = useState([]);
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Get filters from URL or default
  const filterStatus = searchParams.get('status') || '';
  const selectedUser = searchParams.get('assignedTo') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);

  // Fetch users once on mount
  useEffect(() => {
    axiosInstance.get('/users/get-all-users')
      .then(res => setUsers(res.data))
      .catch(err => console.error('Error fetching users:', err));
  }, []);

  // Fetch tasks whenever filters or page changes
  useEffect(() => {
    const params = {
      page,
      limit: 9,
      status: filterStatus || undefined,
      assignedTo: selectedUser || undefined,
    };
    fetchAllTasks(params);
    setCurrentPage(page);
  }, [filterStatus, selectedUser, page]);

  // Update URL params when filters change
  const updateFilters = (newFilters) => {
    const updated = {
      status: newFilters.status ?? filterStatus,
      assignedTo: newFilters.assignedTo ?? selectedUser,
      page: newFilters.page ?? 1, // reset page on filter change by default
    };

    // Remove empty keys to keep URL clean
    Object.keys(updated).forEach(key => {
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
    if (confirm('Are you sure you want to delete this task?')) {
      try {
        await axiosInstance.delete(`/todos/${taskId}`);
        toast.success('Task deleted successfully!');
        fetchAllTasks({
          page: currentPage,
          limit: 9,
          status: filterStatus || undefined,
          assignedTo: selectedUser || undefined,
        });
      } catch (error) {
        console.error('Delete error:', error);
        toast.error('Failed to delete task');
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
          <select
            className="border cursor-pointer border-gray-300 p-2 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            onChange={(e) => updateFilters({ assignedTo: e.target.value, page: 1 })}
            value={selectedUser}
          >
            <option value="">All Users</option>
            {users.map(user => (
              <option key={user._id} value={user._id}>
                {user.name} ({user.role})
              </option>
            ))}
          </select>

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
            {showAssignForm ? '🗙 Close Assign Task' : '✏️ Assign Task'}
          </button>
        </div>

        {/* Assign Task Form */}
        <div
          className={`transition-all duration-500 ease-in-out overflow-hidden max-w-3xl mx-auto rounded-lg shadow-lg
          bg-gradient-to-r from-indigo-50 via-white to-indigo-50 border border-indigo-300
          ${showAssignForm ? 'max-h-[1200px] opacity-100 p-8 mt-8' : 'max-h-0 opacity-0 p-0 border-0 mt-0'}
          `}
        >
          <h3 className="text-2xl font-semibold text-indigo-700 mb-6 border-b border-indigo-200 pb-3 select-none">
            {editingTask ? 'Updating Existing Task' : 'Assign New Task'}
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
              {tasks.map(task => (
                <div
                  key={task._id}
                  className="bg-white p-5 shadow rounded-lg border-l-4 border-indigo-500 hover:shadow-lg transition relative"
                >
                  <h2 className="text-xl font-semibold text-indigo-800 mb-2">{task.title}</h2>
                  <p className="text-gray-700 mb-3">{task.description}</p>
                  <p className="text-sm text-gray-500">
                    Assigned To: <span className="font-medium">{task.assignedTo?.name || 'N/A'}</span>
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Assigned by: {task.assignedBy?.name || 'N/A'}
                  </p>
                  <p className="text-sm text-gray-500">
                    Assigned on: {task.assignedOn ? new Date(task.assignedOn).toLocaleDateString() : 'N/A'}
                  </p>

                  <p className={`text-sm font-semibold mt-1 ${task.status === 'DONE' ? 'text-green-600' : 'text-red-600'}`}>
                    Status: {task.status}
                  </p>

                  {task.status === 'DONE' && task.doneRemarks && (
                    <p className="mt-2 text-gray-700 italic">
                      <strong>Remarks:</strong> {task.doneRemarks}
                    </p>
                  )}

                  {task.status === 'DONE' && task.doneOn && (
                    <p className="text-sm text-gray-500 mt-1">
                      Done on: {new Date(task.doneOn).toLocaleDateString()}
                    </p>
                  )}

                  <div className="mt-4 flex gap-3">
                    <button
                      onClick={() => {
                        setEditingTask(task);
                        setShowAssignForm(true);
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
              ))}
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
                    ? 'text-gray-400 border-gray-300 cursor-not-allowed'
                    : 'text-indigo-600 border-indigo-600 hover:bg-indigo-100'
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
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'text-indigo-600 border-indigo-600 hover:bg-indigo-100'
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
                    ? 'text-gray-400 border-gray-300 cursor-not-allowed'
                    : 'text-indigo-600 border-indigo-600 hover:bg-indigo-100'
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
