import { useCallback, useEffect, useState, useRef } from "react";
import axiosInstance from "../../axiosInstance";

export const useOrders = (token, currentPage, filters, searchTerm, sortOrder, statusFilter, dispatchStatusFilter) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [ordersFetched, setOrdersFetched] = useState(false);

  const ordersPerPage = 20;
  const abortControllerRef = useRef(null);
  const requestIdRef = useRef(0);
  
  // ✅ Store scroll position
  const scrollPositionRef = useRef(0);
  const shouldRestoreScrollRef = useRef(false);

  const fetchOrders = useCallback(async (page = 1, options = {}) => {
    if (!token) return;
    
    // ✅ Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // ✅ Create new AbortController and request ID
    abortControllerRef.current = new AbortController();
    const currentRequestId = ++requestIdRef.current;
    
    // ✅ Save current scroll position before loading
    if (!options.preserveScroll) {
      scrollPositionRef.current = window.scrollY;
    } else {
      shouldRestoreScrollRef.current = true;
    }
    
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
        customerName: filters.customerName,
      };

      if (["olderThan10", "olderThan20", "olderThan30", "moreThan30"].includes(sortOrder)) {
        params.ageFilter = sortOrder;
      }

      const res = await axiosInstance.get("/orders", {
        headers: { Authorization: `Bearer ${token}` },
        params,
        signal: abortControllerRef.current.signal,
      });

      // ✅ Only update state if this is the most recent request
      if (currentRequestId === requestIdRef.current) {
        setOrders(res.data.orders || []);
        setTotalPages(res.data.totalPages || 1);
        setOrdersFetched(true);
        
        // ✅ Restore scroll position if needed
        if (shouldRestoreScrollRef.current && scrollPositionRef.current > 0) {
          setTimeout(() => {
            window.scrollTo({
              top: scrollPositionRef.current,
              behavior: 'instant'
            });
            shouldRestoreScrollRef.current = false;
          }, 50);
        }
      }
    } catch (err) {
      if (err.name !== 'CanceledError' && err.name !== 'AbortError') {
        console.error("Error fetching orders:", err);
        setOrders([]);
      }
    } finally {
      if (currentRequestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [token, filters, searchTerm, sortOrder, statusFilter, dispatchStatusFilter]);

  useEffect(() => {
    fetchOrders(currentPage);
    
    // ✅ Cleanup: Cancel request on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchOrders, currentPage]);

  const refetchOrders = useCallback((page = currentPage, preserveScroll = false) => {
    fetchOrders(page, { preserveScroll });
  }, [fetchOrders, currentPage]);

  return {
    orders,
    loading,
    totalPages,
    ordersFetched,
    refetchOrders,
    setOrders
  };
};