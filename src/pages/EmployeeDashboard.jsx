import { useToDo } from '../context/ToDoContext';
import InternalNavbar from '../components/InternalNavbar';
import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';  // Make sure you have installed sweetalert2 via npm/yarn
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../axiosInstance';

const ITEMS_PER_PAGE = 5;

const EmployeeDashboard = () => {
  const { tasks, loading, markTaskDone, fetchTasks,user } = useToDo();
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL | DONE | NOT_DONE

  const navigate=useNavigate();
  const [notifications, setNotifications] = useState([]);
useEffect(() => {
    if (!user?._id) return; // 💡 Prevent running if user is not loaded
  axiosInstance
  .patch(`/notifications/mark-read/${user._id}`)
  .then(() => {
    console.log('Marked notifications as read');
    return axiosInstance.get(`/notifications/${user._id}`); // ✅ fetch again
  })
  .then((res) => setNotifications(res.data))
  .catch((err) =>
    console.error('Failed to mark notifications as read:', err)
  );

}, [user]);
useEffect(() => {
  const token = localStorage.getItem('token');
  if (!token) return; // ✅ prevent loop on login or unauthenticated pages

  fetchTasks();
}, []);


 // Only show tasks not soft-deleted by the employee
const employeeVisibleTasks = tasks
  .filter(task => !task.isDeletedByEmployee);

// Counters
const totalTasks = employeeVisibleTasks.length;
const doneCount = employeeVisibleTasks.filter(task => task.status === 'DONE').length;
const notDoneCount = totalTasks - doneCount;

// Apply status filter
const filteredTasks = employeeVisibleTasks.filter(task => {
  if (statusFilter === 'DONE') return task.status === 'DONE';
  if (statusFilter === 'NOT_DONE') return task.status !== 'DONE';
  return true; // ALL
});

// Sort: Not Done on top
const sortedTasks = [...filteredTasks].sort((a, b) => {
  if (a.status === 'DONE' && b.status !== 'DONE') return 1;
  if (a.status !== 'DONE' && b.status === 'DONE') return -1;
  return 0;
});

const totalPages = Math.ceil(sortedTasks.length / ITEMS_PER_PAGE);
const paginatedTasks = sortedTasks.slice(
  (currentPage - 1) * ITEMS_PER_PAGE,
  currentPage * ITEMS_PER_PAGE
);



  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  // New function with confirmation
const confirmMarkDone = async (taskId) => {
  const previewContainerId = 'preview-container-' + Date.now(); // Unique ID

  const { value: formValues } = await Swal.fire({
    title: 'Mark Task as Done',
    html: `
      <label for="remarks">Remarks:</label>
      <textarea id="remarks" class="swal2-textarea" placeholder="Enter remarks here..."></textarea>

      <label for="doneImages" style="margin-top: 10px;">Upload Images:</label>
      <input type="file" id="doneImages" multiple accept="image/*,application/pdf" class="swal2-file">

      <div id="${previewContainerId}" style="display: flex; flex-wrap: wrap; gap: 10px; margin-top: 10px;"></div>
    `,
    focusConfirm: false,
    showCancelButton: true,
    confirmButtonText: 'Mark as Done',
    cancelButtonText: 'Cancel',
    didOpen: () => {
      const fileInput = document.getElementById('doneImages');
      const previewContainer = document.getElementById(previewContainerId);
      let selectedFiles = [];

      fileInput.addEventListener('change', (e) => {
        const newFiles = Array.from(e.target.files);

        newFiles.forEach(file => {
          // Avoid duplicates
          if (!selectedFiles.some(f => f.name === file.name && f.size === file.size)) {
            selectedFiles.push(file);
          }
        });

        // Clear preview container
        previewContainer.innerHTML = '';

        selectedFiles.forEach((file, index) => {
          const isPDF = file.type === "application/pdf";

if (isPDF) {
  // Show PDF icon
  const previewDiv = document.createElement('div');
  previewDiv.style.position = 'relative';

  const img = document.createElement('img');
              img.src="./images/pdf.png"
  img.style.width = '80px';
  img.style.height = '80px';
  img.style.objectFit = 'contain';
  img.style.borderRadius = '4px';
  img.style.border = '1px solid #ccc';
  img.style.cursor = 'pointer';
  img.title = file.name;

  img.onclick = () => {
    const blobUrl = URL.createObjectURL(file);
    window.open(blobUrl, '_blank');
  };

  const removeBtn = document.createElement('span');
  // ... same remove button logic

  previewDiv.appendChild(img);
  previewDiv.appendChild(removeBtn);
  previewContainer.appendChild(previewDiv);
} else {
  // Existing FileReader logic for images
  const reader = new FileReader();
  reader.onload = () => {
    const previewDiv = document.createElement('div');
    previewDiv.style.position = 'relative';

    const img = document.createElement('img');
    img.src = reader.result;
    img.style.width = '80px';
    img.style.height = '80px';
    img.style.cursor = "zoom-in";
    img.setAttribute("data-full", reader.result);
    img.style.objectFit = 'cover';
    img.style.borderRadius = '4px';
    img.style.border = '1px solid #ccc';

    img.onclick = () => {
      Swal.fire({
        imageUrl: img.getAttribute("data-full"),
        imageAlt: "Preview",
        showConfirmButton: false,
        showCloseButton: true,
        width: 'auto',
        padding: '1em',
      });
    };

    const removeBtn = document.createElement('span');
    // ... same remove button logic

    previewDiv.appendChild(img);
    previewDiv.appendChild(removeBtn);
    previewContainer.appendChild(previewDiv);
  };
  reader.readAsDataURL(file);
}

        });

        // Replace the input files manually since Swal does not retain custom file selections
        fileInput._selectedFiles = selectedFiles;
      });
    },
    preConfirm: () => {
      const remarks = document.getElementById('remarks').value.trim();
      const fileInput = document.getElementById('doneImages');

      const files = fileInput._selectedFiles || [];

      if (!remarks) {
        Swal.showValidationMessage('Remarks are required before marking as done');
        return;
      }

      return { remarks, files };
    }
  });

  if (formValues) {
    const { remarks, files } = formValues;

    try {
      const formData = new FormData();
      formData.append('doneRemarks', remarks);
      files.forEach(file => {
        formData.append('doneFiles', file); // ✅ Matches backend
      });
Swal.fire({
  title: 'Uploading...',
  html: 'Please wait while we upload the images.',
  allowOutsideClick: false,
  didOpen: () => {
    Swal.showLoading();
  }
});

      await axiosInstance.patch(`/todos/complete/${taskId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      Swal.fire('Done!', 'Task has been marked as completed.', 'success');
      fetchTasks(); // Refresh task list
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'Failed to mark the task as done.', 'error');
    }
  }
};


  if (loading) return <div className="p-4">Loading tasks...</div>;


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
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
  <h1 className="text-2xl font-semibold text-center md:text-left">
    My ToDos
  </h1>

  <div className="flex flex-wrap gap-3 items-center justify-center md:justify-end">
    <span className="text-gray-700">Filter:</span>
    <button
      className={`px-3 py-1 rounded ${
        statusFilter === 'ALL' ? 'bg-blue-600 text-white' : 'bg-gray-200'
      }`}
      onClick={() => setStatusFilter('ALL')}
    >
      All ({totalTasks})
    </button>
    <button
      className={`px-3 py-1 rounded ${
        statusFilter === 'NOT_DONE' ? 'bg-yellow-500 text-white' : 'bg-gray-200'
      }`}
      onClick={() => setStatusFilter('NOT_DONE')}
    >
      Not Done ({notDoneCount})
    </button>
    <button
      className={`px-3 py-1 rounded ${
        statusFilter === 'DONE' ? 'bg-green-600 text-white' : 'bg-gray-200'
      }`}
      onClick={() => setStatusFilter('DONE')}
    >
      Done ({doneCount})
    </button>
  </div>
</div>


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

              

                  <div className="flex-1">
<h2 className="text-lg font-bold flex items-center">
  {task.title}
  {task.repeat !== 'ONE_TIME' && (
    <span className="ml-2 px-2 py-0.5 text-xs bg-yellow-200 text-yellow-800 rounded">
    ⟳ {task.repeat === 'MONTHLY' ? 'Monthly' : 'Yearly'}
    </span>
  )}
</h2>
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
<p className="text-sm text-gray-500">
  Repeat: {task.repeat === 'ONE_TIME' ? 'One time' : task.repeat === 'MONTHLY' ? 'Monthly' : 'Yearly'}
</p>
{task.repeat !== 'ONE_TIME' && task.nextRepeatDate && (
  <p className="text-sm text-gray-500">
    Next Repeat On: {new Date(task.nextRepeatDate).toLocaleDateString()}
  </p>
)}

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
{task.status !== 'DONE' && (
  <button
    onClick={() => confirmMarkDone(task._id)}
    className="mt-4 sm:mt-0 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700
      transition-colors duration-200"
  >
    Mark as Done
  </button>
)}
{/* Show assigned images */}
{task.images && task.images.length > 0 && (
  <div className="mt-4">
    <p className="font-medium mb-1">Assigned Files:</p>
    <div className="flex flex-wrap gap-2">
      {task.images.map((url, idx) => {
        const isPDF = url.toLowerCase().endsWith('.pdf');
        return isPDF ? (
          <a
            key={idx}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            title={`PDF File ${idx + 1}`}
          >
            <img
              src="./images/pdf.png"
              alt={`PDF File ${idx + 1}`}
              className="w-24 h-24 object-contain border rounded cursor-pointer"
            />
          </a>
        ) : (
          <img
            key={idx}
            src={url}
            alt={`Assigned ${idx + 1}`}
            className="w-24 h-24 object-cover border rounded cursor-pointer"
            onClick={() => {
              Swal.fire({
                imageUrl: url,
                imageAlt: `Assigned Image ${idx + 1}`,
                showConfirmButton: false,
                showCloseButton: true,
                width: 'auto',
                padding: '1em',
              });
            }}
          />
        );
      })}
    </div>
  </div>
)}

{task.doneFiles?.length > 0 && (
  <div>
    <h4 className="font-semibold text-gray-700 mb-2">Uploaded Files:</h4>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
      {task.doneFiles.map((url, i) => {
        const isPDF = url.toLowerCase().endsWith('.pdf');
        return isPDF ? (
          <a
            key={i}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            title={`View PDF File ${i + 1}`}
          >
            <img
              src="./images/pdf.png"
              alt={`PDF File ${i + 1}`}
              style={{
                width: '100px',
                height: '100px',
                objectFit: 'contain',
                cursor: 'pointer',
                borderRadius: '6px',
                border: '1px solid #ccc',
              }}
            />
          </a>
        ) : (
          <img
            key={i}
            src={url}
            alt={`Done File ${i + 1}`}
            style={{
              width: '100px',
              height: '100px',
              objectFit: 'cover',
              cursor: 'pointer',
              borderRadius: '6px',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)',
            }}
            onClick={() =>
              Swal.fire({
                imageUrl: url,
                imageAlt: `Done File ${i + 1}`,
                showConfirmButton: false,
                showCloseButton: true,
                width: '50vw',
                padding: '1em',
              })
            }
          />
        );
      })}
    </div>
  </div>
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
