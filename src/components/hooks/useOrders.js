import { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../../axiosInstance';

export const useOrders = (token, currentPage, filters, searchTerm, sortOrder, statusFilter, dispatchStatusFilter) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [ordersFetched, setOrdersFetched] = useState(false);

  const ordersPerPage = 20;

  const fetchOrders = useCallback(async (page = 1) => {
    if (!token) return;
    
    setLoading(true);
    try {
      const params = {
        page,
        limit: ordersPerPage,
        ...filters,
        search: searchTerm,
        sort: sortOrder,
        status: statusFilter,
        dispatchStatus: dispatchStatusFilter,
      };

      // Add ageFilter for server-side filtering
      if (["olderThan10", "olderThan20", "olderThan30", "moreThan30"].includes(sortOrder)) {
        params.ageFilter = sortOrder;
      }

      const res = await axiosInstance.get("/orders", {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });

      // 🚀 Only set the current page orders
      setOrders(res.data.orders || []);
      setTotalPages(res.data.totalPages || 1);
      setOrdersFetched(true);
    } catch (err) {
      console.error("Error fetching orders:", err);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [token, filters, searchTerm, sortOrder, statusFilter, dispatchStatusFilter]);

  useEffect(() => {
    fetchOrders(currentPage);
  }, [fetchOrders, currentPage]);

  return {
    orders, // Only current page orders
    loading,
    totalPages,
    ordersFetched,
    refetchOrders: fetchOrders,
    setOrders
  };
};