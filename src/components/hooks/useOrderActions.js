import { useState, useCallback } from 'react';
import axiosInstance from "../../axiosInstance";
import Swal from "sweetalert2";
import toast from "react-hot-toast";

export const useOrderActions = (token, setOrders, refetchOrders) => {
  const [uploadingPOCopy, setUploadingPOCopy] = useState(false);

  const handleDelete = useCallback(async (id) => {
    if (!window.confirm("Are you sure you want to delete this order?")) return;
    try {
      await axiosInstance.delete(`/orders/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(prev => prev.filter((o) => o._id !== id));
      toast.success("Order deleted");
      refetchOrders();
    } catch (err) {
      console.error("Error deleting:", err);
    }
  }, [token, setOrders, refetchOrders]);

  const handleSaveEdit = useCallback(async (id, updatedData) => {
    try {
      await axiosInstance.put(`/orders/${id}`, updatedData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(prev => prev.map((o) =>
        o._id === id ? { ...o, ...updatedData } : o
      ));
      refetchOrders();
    } catch (err) {
      console.error("Failed to update order:", err);
    }
  }, [token, setOrders, refetchOrders]);

  const handleComplete = useCallback(async (id) => {
    const confirm = await Swal.fire({
      title: "Mark as Completed?",
      text: "This will mark the order as completed. You won't be able to revert this easily.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, mark completed",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#16a34a",
      cancelButtonColor: "#d33",
    });

    if (!confirm.isConfirmed) return;

    try {
      await axiosInstance.put(
        `/orders/${id}`,
        {
          status: "completed",
          danaBeadsStatus: "completed",
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setOrders(prev => prev.map((o) =>
        o._id === id
          ? {
              ...o,
              status: "completed",
              danaBeadsStatus: "completed",
            }
          : o
      ));

      toast.success("Order marked as completed");
    } catch (err) {
      console.error("Failed to complete order:", err);
      toast.error("Failed to mark order completed");
    }
  }, [token, setOrders]);

  const handleCancel = useCallback(async (id) => {
    const confirm = await Swal.fire({
      title: "Cancel this Order?",
      text: "This will cancel the order and remove it from dashboards.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, cancel it",
      cancelButtonText: "Keep it",
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
    });

    if (!confirm.isConfirmed) return;

    try {
      await axiosInstance.put(
        `/orders/${id}`,
        { status: "cancelled" },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setOrders(prev => prev.map((o) => (o._id === id ? { ...o, status: "cancelled" } : o)));
      toast.success("Order cancelled");
    } catch (err) {
      console.error("Failed to cancel order:", err);
      toast.error("Failed to cancel order");
    }
  }, [token, setOrders]);

  return {
    uploadingPOCopy,
    setUploadingPOCopy,
    handleDelete,
    handleSaveEdit,
    handleComplete,
    handleCancel
  };
};