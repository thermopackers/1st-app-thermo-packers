import React, { useEffect, useState } from 'react';
import axiosInstance from '../axiosInstance';
import toast from 'react-hot-toast';

const AssignTaskForm = ({ users, onTaskCreated,task = null, onCancelEdit = () => {}   }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [repeat, setRepeat] = useState('ONE_TIME');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
  if (task) {
    setTitle(task.title || '');
    setDescription(task.description || '');
    setAssignedTo(task.assignedTo?._id || task.assignedTo || '');
    setDueDate(task.dueDate ? task.dueDate.slice(0, 10) : '');
    setRepeat(task.repeat || 'ONE_TIME'); // <-- Add this
  } else {
    setTitle('');
    setDescription('');
    setAssignedTo('');
    setDueDate('');
    setRepeat('ONE_TIME'); // <-- Add this
  }
}, [task]);

   useEffect(() => {
    if (task) {
      setTitle(task.title || '');
      setDescription(task.description || '');
      setAssignedTo(task.assignedTo?._id || task.assignedTo || '');
      setDueDate(task.dueDate ? task.dueDate.slice(0, 10) : '');
    } else {
      // Clear form if no task (like after cancel)
      setTitle('');
      setDescription('');
      setAssignedTo('');
      setDueDate('');
    }
  }, [task]);
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!title.trim() || !assignedTo) {
      setError('Please fill title and select a user.');
      return;
    }

    setLoading(true);

    try {
      if (task?._id) {
        await axiosInstance.put(`/todos/${task._id}`, {
          title,
          description,
          assignedTo,
          dueDate: dueDate || null,
            repeat, // <-- Add this
        });
        toast.success('Task updated successfully!');
      } else {
        await axiosInstance.post('/todos/create', {
          title,
          description,
          assignedTo,
          dueDate: dueDate || null,
            repeat, // <-- Add this

        });
        toast.success('Task assigned successfully!');
      }

      setTitle('');
      setDescription('');
      setAssignedTo('');
      setDueDate('');
      onTaskCreated();
      setRepeat('ONE_TIME');

    } catch (err) {
      setError('Failed to save task.');
      toast.error('Failed to save task. Please try again.');
    } finally {
      setLoading(false);
    }
  };


  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white p-8 rounded-lg shadow-lg max-w-md mx-auto space-y-6
                 border border-gray-200"
    >
      <h2 className="text-2xl font-bold text-indigo-700 mb-4 text-center select-none">
       {task?'Update Task':'Assign New Task'} 
      </h2>

      {error && (
        <p className="text-center text-red-600 bg-red-100 border border-red-300 rounded px-4 py-2">
          {error}
        </p>
      )}

      <div>
        <label htmlFor="title" className="block text-gray-700 font-semibold mb-2">
          Title<span className="text-red-500">*</span>
        </label>
        <input
          id="title"
          type="text"
          className="w-full border border-gray-300 rounded-md p-3 
                     focus:outline-none focus:ring-2 focus:ring-indigo-400
                     transition duration-200"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Task title"
          required
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-gray-700 font-semibold mb-2">
          Description
        </label>
        <textarea
          id="description"
          className="w-full border border-gray-300 rounded-md p-3 resize-none
                     focus:outline-none focus:ring-2 focus:ring-indigo-400
                     transition duration-200"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Task description"
          rows={4}
        />
      </div>

      <div>
        <label htmlFor="assignedTo" className="block text-gray-700 font-semibold mb-2">
          Assign To<span className="text-red-500">*</span>
        </label>
        <select
          id="assignedTo"
          className="w-full border border-gray-300 rounded-md p-3
                     focus:outline-none focus:ring-2 focus:ring-indigo-400
                     transition duration-200"
          value={assignedTo}
          onChange={(e) => setAssignedTo(e.target.value)}
          required
        >
          <option value="">Select user</option>
          {users.map((user) => (
            <option key={user._id} value={user._id}>
              {user.name} ({user.role})
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="dueDate" className="block text-gray-700 font-semibold mb-2">
          Due Date
        </label>
        <input
          id="dueDate"
          type="date"
          className="w-full border border-gray-300 rounded-md p-3
                     focus:outline-none focus:ring-2 focus:ring-indigo-400
                     transition duration-200"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />
      </div>
      <div>
  <label htmlFor="repeat" className="block text-gray-700 font-semibold mb-2">
    Repeat
  </label>
  <select
    id="repeat"
    className="w-full border border-gray-300 rounded-md p-3
               focus:outline-none focus:ring-2 focus:ring-indigo-400
               transition duration-200"
    value={repeat}
    onChange={(e) => setRepeat(e.target.value)}
  >
    <option value="ONE_TIME">One time</option>
    <option value="MONTHLY">Repeat every month</option>
    <option value="YEARLY">Repeat every year</option>
  </select>
</div>


      <button
        type="submit"
        disabled={loading}
        className="w-full cursor-pointer bg-indigo-600 text-white py-3 rounded-md font-semibold
                   hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed
                   transition duration-300"
      >
        {task ? 'Update Task' : 'Assign Task'}
      </button>
      {task?._id && (
  <button
    type="button"
    onClick={onCancelEdit}
    className="ml-3 px-4 py-2 cursor-pointer bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
  >
    Cancel Edit
  </button>
)}

    </form>
  );
};

export default AssignTaskForm;
