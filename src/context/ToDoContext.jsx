import React, { createContext, useContext, useEffect, useState } from 'react';
import axiosInstance from '../axiosInstance';

const ToDoContext = createContext();

export const useToDo = () => useContext(ToDoContext);

export const ToDoProvider = ({ children }) => {
 const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

const fetchAllTasks = async (params = {}) => {
  try {
    setLoading(true);

    // Clean query parameters to avoid sending undefined
    const cleanParams = {};
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== 'undefined') {
        cleanParams[key] = value;
      }
    }

    // ✅ Use cleanParams instead of original params
    const query = new URLSearchParams(cleanParams).toString();

    const res = await axiosInstance.get(`/todos/all?${query}`);

    setTasks(res.data.tasks);
    setTotalCount(res.data.totalCount);
    setTotalPages(res.data.totalPages);
    setCurrentPage(res.data.currentPage);
  } catch (err) {
    console.error('❌ fetchAllTasks error:', err.response?.data || err.message);
  } finally {
    setLoading(false);
  }
};




  // ✅ Safe fetch for "my tasks"
  const fetchTasks = async () => {
    const token = localStorage.getItem('token');
    if (!token) return; // ⛔ don't fetch if user is not logged in

    try {
      setLoading(true);
      const res = await axiosInstance.get('/todos/my-tasks', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setTasks(res.data);
    } catch (err) {
      console.error('❌ Error fetching tasks', err);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Create & refresh
  const assignTask = async (taskData) => {
    try {
      await axiosInstance.post('/todos/create', taskData);
      await fetchTasks();  // refresh after assignment
    } catch (error) {
      console.error('❌ Error assigning task:', error);
    }
  };

  // ✅ Mark done with remarks
  const markTaskDone = async (taskId, remarks) => {
     if (!taskId) {
      console.error('❌ No taskId provided to markTaskDone');
      return;
    }
    try {
      await axiosInstance.patch(`/todos/complete/${taskId}`, {
        doneRemarks: remarks,
      });
      fetchTasks(); // refresh list
    } catch (err) {
      console.error('❌ Error marking task as done', err);
    }
  };

  // ✅ Fetch only if token exists
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchTasks();
    }
  }, []);

  return (
    <ToDoContext.Provider
      value={{
        tasks,
        loading,
        fetchTasks,
        fetchAllTasks,
        assignTask,
        markTaskDone,
          totalPages,
        totalCount,
        currentPage,
        setCurrentPage,
      }}
    >
      {children}
    </ToDoContext.Provider>
  );
};
