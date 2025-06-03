import { useToDo } from '../context/ToDoContext';
import InternalNavbar from '../components/InternalNavbar';
import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';  // Make sure you have installed sweetalert2 via npm/yarn
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../axiosInstance';

const ITEMS_PER_PAGE = 5;

const EmployeeDashboard = () => {
  const { tasks, loading, markTaskDone, fetchTasks } = useToDo();
  const [currentPage, setCurrentPage] = useState(1);
  const navigate=useNavigate();
useEffect(() => {
  const token = localStorage.getItem('token');
  if (!token) return; // ✅ prevent loop on login or unauthenticated pages

  fetchTasks();
}, []);


 // Only show tasks not soft-deleted by the employee
const employeeVisibleTasks = tasks.filter(task => !task.isDeletedByEmployee);

const totalPages = Math.ceil(employeeVisibleTasks.length / ITEMS_PER_PAGE);
const paginatedTasks = employeeVisibleTasks.slice(
  (currentPage - 1) * ITEMS_PER_PAGE,
  currentPage * ITEMS_PER_PAGE
);


  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  // New function with confirmation
const confirmMarkDone = async (taskId) => {
  const { value: remarks } = await Swal.fire({
    title: 'Mark Task as Done',
    input: 'textarea',
    inputLabel: 'Remarks',
    inputPlaceholder: 'Enter remarks here...',
    inputAttributes: {
      'aria-label': 'Enter remarks here',
    },
    showCancelButton: true,
    confirmButtonText: 'Mark as Done',
    cancelButtonText: 'Cancel',
    inputValidator: (value) => {
      if (!value || value.trim() === '') {
        return 'Remarks are required before marking as done';
      }
      return null;
    }
  });

  if (remarks !== undefined) {  // If user did not cancel
    try {
      await markTaskDone(taskId, remarks);  // Pass remarks to your API call
      Swal.fire('Done!', 'Task has been marked as completed.', 'success');
      fetchTasks(); // Refresh tasks after marking done
    } catch (error) {
      Swal.fire('Error', 'Failed to mark the task as done.', 'error');
    }
  }
};


  if (loading) return <div className="p-4">Loading tasks...</div>;
const confirmDeleteTask = async (taskId) => {
  const result = await Swal.fire({
    title: 'Delete Completed Task?',
    text: 'Are you sure you want to delete this completed task?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Yes, delete it!',
    cancelButtonText: 'Cancel',
  });

  if (result.isConfirmed) {
    try {
      console.log('Sending PATCH to hide task:', taskId);
await axiosInstance.patch(`/todos/${taskId}/hide`);
  console.log('Patch success');

      Swal.fire('Deleted!', 'Task has been deleted.', 'success');
      fetchTasks(); // Refresh the task list
    } catch (error) {
      console.error('Delete error:', error);
      Swal.fire('Error', 'Failed to delete the task.', 'error');
    }
  }
};


  return (
    <>
      <InternalNavbar />
      <div className="p-4 max-w-5xl mx-auto">
          <button
          className="absolute cursor-pointer left-4 hidden md:block bg-blue-500 text-white px-4 py-2 rounded-md shadow-md hover:bg-blue-600 back-button"
          onClick={() => navigate(-1)}
        >
          ↩️ Back
        </button>
        <h1 className="text-2xl font-semibold mb-6 text-center md:text-left">
          My ToDos
        </h1>

        {tasks.length === 0 ? (
          <p className="text-center text-gray-600">No tasks assigned.</p>
        ) : (
          <>
            <div className="space-y-6">
              {paginatedTasks.map((task) => (
                <div
  key={task._id}
  className="bg-white shadow-md rounded-xl p-4 border-l-4 border-blue-500
    sm:flex sm:justify-between sm:items-center sm:space-x-4 relative"
>

                  {/* Show delete button only for DONE tasks */}
{task.status === 'DONE' && (
  <button
    onClick={() => confirmDeleteTask(task._id)}
    className="absolute top-2 right-2 text-red-500 hover:text-red-700"
    title="Delete Task"
  >
    🗑️
  </button>
)}

                  <div className="flex-1">
                    <h2 className="text-lg font-bold">{task.title}</h2>
                    <p className="text-gray-700 mt-1">{task.description}</p>
                    <p className="text-sm text-gray-500 mt-2">
  Assigned by: {task.assignedBy?.name || 'N/A'}
</p>
<p className="text-sm text-gray-500">
  Assigned on: {task.assignedOn ? new Date(task.assignedOn).toLocaleDateString() : 'N/A'}
</p>

                    <p className="text-sm text-gray-500">
                      Due: {task.dueDate?.slice(0, 10) || 'N/A'}
                    </p>
                    <p className="mt-2 font-medium">
                      Status:{' '}
                      <span
                        className={
                          task.status === 'DONE' ? 'text-green-600' : 'text-red-600'
                        }
                      >
                        {task.status}
                      </span>
                    </p>
                   {/* Show done remarks if task is DONE and remarks exist */}
{task.status === 'DONE' && task.doneRemarks && (
  <p className="mt-2 text-gray-700 italic">
    <strong>Remarks:</strong> {task.doneRemarks}
  </p>
)}

{/* Optionally show doneOn date */}
{task.status === 'DONE' && task.doneOn && (
  <p className="text-sm text-gray-500 mt-1">
    Done on: {new Date(task.doneOn).toLocaleDateString()}
  </p>
)}

                  </div>

                 {/* Show Mark as Done button if status is NOT DONE OR if edited after done */}
{(task.status !== 'DONE' || task.editedAfterDone) && (
  <button
    onClick={() => confirmMarkDone(task._id)}
    className="mt-4 sm:mt-0 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700
      transition-colors duration-200"
  >
    Mark as Done
  </button>
)}

                </div>
              ))}
            </div>

            {/* Pagination controls */}
            <div className="flex justify-center mt-8 space-x-3 flex-wrap">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className={`px-3 py-1 rounded border ${
                  currentPage === 1
                    ? 'text-gray-400 border-gray-300 cursor-not-allowed'
                    : 'text-blue-600 border-blue-600 hover:bg-blue-100'
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
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'text-blue-600 border-blue-600 hover:bg-blue-100'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`px-3 py-1 rounded border ${
                  currentPage === totalPages
                    ? 'text-gray-400 border-gray-300 cursor-not-allowed'
                    : 'text-blue-600 border-blue-600 hover:bg-blue-100'
                }`}
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default EmployeeDashboard;
