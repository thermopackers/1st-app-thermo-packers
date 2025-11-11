import { useState, useEffect, useCallback } from 'react';
import axiosInstance from "../../axiosInstance";

export const useOrders = (token, currentPage, filters, searchTerm, sortOrder, statusFilter, dispatchStatusFilter) => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
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
        sort: ["newest", "oldest"].includes(sortOrder) ? sortOrder : "newest",
        status: statusFilter,
        dispatchStatus: dispatchStatusFilter,
      };

      if (["olderThan10", "olderThan20", "olderThan30", "moreThan30"].includes(sortOrder)) {
        params.ageFilter = sortOrder;
      }

      const res = await axiosInstance.get("/orders", {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });

      setOrders(res.data.orders);
      setFilteredOrders(res.data.orders);
      setTotalPages(res.data.totalPages);
      setOrdersFetched(true);
    } catch (err) {
      console.error("Error fetching orders:", err);
    } finally {
      setLoading(false);
    }
  }, [token, filters, searchTerm, sortOrder, statusFilter, dispatchStatusFilter]);

  useEffect(() => {
    fetchOrders(currentPage);
  }, [fetchOrders, currentPage]);

  return {
    orders,
    filteredOrders,
    loading,
    totalPages,
    ordersFetched,
    refetchOrders: fetchOrders,
    setOrders
  };
};