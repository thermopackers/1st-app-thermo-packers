import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axiosInstance from '../axiosInstance';
import Swal from 'sweetalert2';

export default function DailyTodoList({ userId }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [loading, setLoading] = useState(false);
const [datesWithTasks, setDatesWithTasks] = useState([]);
const [loadingDates, setLoadingDates] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const MAX_CHARS = 500; // Match the model limit

  useEffect(() => {
    if (isExpanded) {
      fetchTasks();
          fetchDatesWithTasks(); // Add this line
    }
  }, [selectedDate, isExpanded]);

  useEffect(() => {
    setCharCount(newTask.length);
  }, [newTask]);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(`/daily-todos/${selectedDate}`);
      setTasks(response.data.tasks || []);
    } catch (err) {
      console.error('Error fetching tasks:', err);
      Swal.fire({
        title: 'Error',
        text: 'Failed to load tasks',
        icon: 'error',
        confirmButtonColor: '#2563eb',
        timer: 2000
      });
    } finally {
      setLoading(false);
    }
  };

  // Add this new function after fetchTasks function
const fetchDatesWithTasks = async () => {
  setLoadingDates(true);
  try {
    const response = await axiosInstance.get('/daily-todos/dates');
    setDatesWithTasks(response.data.dates || []);
  } catch (err) {
    console.error('Error fetching dates with tasks:', err);
    // Silent fail - don't show error toast for this
  } finally {
    setLoadingDates(false);
  }
};

  const addTask = async (e) => {
    e.preventDefault();
    
    // Client-side validation
    if (!newTask.trim()) {
      Swal.fire({
        title: 'Empty Task',
        text: 'Please enter a task description',
        icon: 'warning',
        confirmButtonColor: '#2563eb',
        timer: 2000
      });
      return;
    }

    if (newTask.length > MAX_CHARS) {
      Swal.fire({
        title: 'Task Too Long',
        text: `Task cannot exceed ${MAX_CHARS} characters. Current: ${newTask.length}`,
        icon: 'warning',
        confirmButtonColor: '#2563eb'
      });
      return;
    }

    const newTaskObj = {
      text: newTask.trim(),
      completed: false,
      createdAt: new Date().toISOString()
    };

    const updatedTasks = [...tasks, newTaskObj];

    try {
      await axiosInstance.post('/daily-todos', {
        date: selectedDate,
        tasks: updatedTasks
      });
      
      setTasks(updatedTasks);
      setNewTask('');
      setCharCount(0);
      
      Swal.fire({
        title: 'Success',
        text: 'Task added successfully',
        icon: 'success',
        confirmButtonColor: '#2563eb',
        timer: 1500,
        showConfirmButton: false
      });
    } catch (err) {
      console.error('Error adding task:', err);
      
      // Handle validation errors from server
      if (err.response?.data?.message?.includes('validation failed')) {
        Swal.fire({
          title: 'Validation Error',
          text: 'Task is too long or invalid',
          icon: 'error',
          confirmButtonColor: '#2563eb'
        });
      } else {
        Swal.fire({
          title: 'Error',
          text: 'Failed to add task',
          icon: 'error',
          confirmButtonColor: '#2563eb'
        });
      }
    }
  };

  const toggleTask = async (taskId, index) => {
    const updatedTasks = tasks.map((task, i) => 
      i === index ? { ...task, completed: !task.completed } : task
    );

    try {
      if (taskId) {
        await axiosInstance.patch(`/daily-todos/${selectedDate}/tasks/${taskId}/toggle`);
      } else {
        await axiosInstance.post('/daily-todos', {
          date: selectedDate,
          tasks: updatedTasks
        });
      }
      
      setTasks(updatedTasks);
    } catch (err) {
      console.error('Error toggling task:', err);
      Swal.fire({
        title: 'Error',
        text: 'Failed to update task',
        icon: 'error',
        confirmButtonColor: '#2563eb'
      });
    }
  };

  const deleteTask = async (taskId, index) => {
    const result = await Swal.fire({
      title: 'Delete Task?',
      text: 'Are you sure you want to delete this task?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it'
    });

    if (result.isConfirmed) {
      const updatedTasks = tasks.filter((_, i) => i !== index);

      try {
        if (taskId) {
          await axiosInstance.delete(`/daily-todos/${selectedDate}/tasks/${taskId}`);
        } else {
          await axiosInstance.post('/daily-todos', {
            date: selectedDate,
            tasks: updatedTasks
          });
        }
        
        setTasks(updatedTasks);
        
        Swal.fire({
          title: 'Deleted!',
          text: 'Task has been deleted.',
          icon: 'success',
          confirmButtonColor: '#2563eb',
          timer: 1500
        });
      } catch (err) {
        console.error('Error deleting task:', err);
        Swal.fire({
          title: 'Error',
          text: 'Failed to delete task',
          icon: 'error',
          confirmButtonColor: '#2563eb'
        });
      }
    }
  };

  const completedCount = tasks.filter(t => t.completed).length;
  const progress = tasks.length ? (completedCount / tasks.length) * 100 : 0;

  return (
    <motion.div
      className="bg-white rounded-3xl shadow-lg border border-gray-200 overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header - Always visible */}
      <motion.button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 transition-all duration-300"
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        <div className="flex items-center gap-3">
          <span className="text-xs">✅</span>
          <div className="text-left">
            <h3 className="text-xs font-bold text-gray-900">My Daily Todo List</h3>
            {tasks.length > 0 && !isExpanded && (
              <p className="text-xs text-gray-600">
                {completedCount}/{tasks.length} tasks completed
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {!isExpanded && tasks.length > 0 && (
            <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-500 to-green-500"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          )}
          <motion.span
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.3 }}
            className="text-xs text-gray-600"
          >
            ▼
          </motion.span>
        </div>
      </motion.button>

      {/* Expandable Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="p-6 border-t border-gray-100">
              {/* Date Selector */}
              <div className="mb-6">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full text-xs px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Add this entire block after the date selector input and before the Progress Bar */}
{/* Dates with Tasks - Quick Select */}
{datesWithTasks.length > 0 && (
  <div className="mb-6">
    <p className="text-xs font-medium text-gray-700 mb-2">
      📅 Dates with tasks ({datesWithTasks.length})
    </p>
    <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
      {loadingDates ? (
        <div className="w-full text-center py-2">
          <div className="inline-block w-4 h-4 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        </div>
      ) : (
        datesWithTasks.map((date, idx) => {
          const dateObj = new Date(date);
          const formattedDate = dateObj.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
          });
          const isSelected = selectedDate === date;
          
          return (
            <motion.button
              key={idx}
              onClick={() => setSelectedDate(date)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                isSelected
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {formattedDate}
            </motion.button>
          );
        })
      )}
    </div>
  </div>
)}

              {/* Progress Bar */}
              {tasks.length > 0 && (
                <div className="mb-6">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Today's Progress</span>
                    <span>{completedCount}/{tasks.length} tasks</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <motion.div
                      className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>
              )}

              {/* Add Task Form with Character Counter */}
              <form onSubmit={addTask} className="mb-6">
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={newTask}
                        onChange={(e) => setNewTask(e.target.value)}
                        placeholder="Add a new task..."
                        className={`w-full text-xs px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 pr-16 ${
                          newTask.length > MAX_CHARS 
                            ? 'border-red-500 bg-red-50' 
                            : 'border-gray-300'
                        }`}
                        maxLength={MAX_CHARS + 100} // Allow slightly more for UX but will be blocked
                      />
                      <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs ${
                        newTask.length > MAX_CHARS 
                          ? 'text-red-600 font-bold' 
                          : newTask.length > MAX_CHARS * 0.8 
                            ? 'text-amber-600' 
                            : 'text-gray-400'
                      }`}>
                        {charCount}/{MAX_CHARS}
                      </span>
                    </div>
                    <motion.button
                      type="submit"
                      className="bg-gradient-to-r text-xs from-blue-500 to-blue-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      whileHover={{ scale: newTask.trim() && newTask.length <= MAX_CHARS ? 1.05 : 1 }}
                      whileTap={{ scale: newTask.trim() && newTask.length <= MAX_CHARS ? 0.95 : 1 }}
                      disabled={!newTask.trim() || newTask.length > MAX_CHARS}
                    >
                      Add
                    </motion.button>
                  </div>
                  {newTask.length > MAX_CHARS && (
                    <p className="text-red-600 text-sm">
                      Task is too long ({charCount}/{MAX_CHARS} characters)
                    </p>
                  )}
                </div>
              </form>

              {/* Tasks List */}
              {loading ? (
                <div className="text-center py-8">
                  <div className="inline-block w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                </div>
              ) : (
                <AnimatePresence>
                  {tasks.length === 0 ? (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center text-xs text-gray-500 py-8"
                    >
                      No tasks for this date. Add one above!
                    </motion.p>
                  ) : (
                    <ul className="space-y-3 max-h-80 overflow-y-auto pr-2">
                      {tasks.map((task, index) => (
                        <motion.li
                          key={task._id || index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all group"
                        >
                          <motion.button
                            onClick={() => toggleTask(task._id, index)}
                            className={`flex-shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                              task.completed
                                ? 'bg-green-500 border-green-500 text-white'
                                : 'border-gray-400 hover:border-blue-500'
                            }`}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            {task.completed && '✓'}
                          </motion.button>
                          
                          <div className="flex-1 min-w-0">
                            <span
                              className={`block text-gray-800 text-xs break-words ${
                                task.completed ? 'line-through text-xs text-gray-400' : ''
                              }`}
                            >
                              {task.text}
                            </span>
                            {task.text.length > 400 && (
                              <span className="text-xs text-gray-400 mt-1 block">
                                {task.text.length} characters
                              </span>
                            )}
                          </div>
                          
                          <motion.button
                            onClick={() => deleteTask(task._id, index)}
                            className="text-gray-400 hover:text-red-500 transition-colors p-2"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            🗑️
                          </motion.button>
                        </motion.li>
                      ))}
                    </ul>
                  )}
                </AnimatePresence>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}