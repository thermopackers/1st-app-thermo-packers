import React from "react";
import * as XLSX from "xlsx";
import { useMemo } from "react";
import { saveAs } from "file-saver";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { gsap } from "gsap";
import InternalNavbar from "../components/InternalNavbar";
import toast from "react-hot-toast";
import axiosInstance from "../axiosInstance";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import "jspdf-autotable";
import SlipFormModal from "../components/SlipFormModal.jsx";
import { useUserContext } from "../context/UserContext.jsx";

export default function OrdersList() {
  const { shouldRefetchOrders, setShouldRefetchOrders } = useUserContext();
  const navigate = useNavigate();
  const [uploadingPOCopy, setUploadingPOCopy] = useState(false);
  const token = localStorage.getItem("token");
  const [expandedProductId, setExpandedProductId] = useState(null);
  const [orders, setOrders] = useState([]);
  const [editOrder, setEditOrder] = useState(null);
  const [selectedRadioByOrder, setSelectedRadioByOrder] = useState({});
  const [totalPages, setTotalPages] = useState(1);
  const [employees, setEmployees] = useState([]);
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [filterLoading, setFilterLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [sortOrder, setSortOrder] = useState("newest");
  const [statusFilter, setStatusFilter] = useState("");
  const [dispatchStatusFilter, setDispatchStatusFilter] = useState("");
  const [localSections, setLocalSections] = useState({});
  const [disabledOrders, setDisabledOrders] = useState({});
  const [modalOpen, setModalOpen] = useState(false);
    const [filteredOrders, setFilteredOrders] = useState([]);
  const [slipType, setSlipType] = useState(null); // 'production' or 'dispatch'
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [activeProductImage, setActiveProductImage] = useState(null);
 const [resolvedPOUrls, setResolvedPOUrls] = useState({});
const checkIfUrlExists = async (url) => {
  try {
    const res = await fetch(url, { method: "HEAD" });
    return res.ok;
  } catch (err) {
    console.error("URL check failed:", err);
    return false;
  }
};
console.log("orders",orders);

useEffect(() => {
  const resolveAllPOCopyUrls = async () => {
    const result = {};

    for (const order of filteredOrders) {
      const poCopyList = Array.isArray(order.poCopy)
        ? order.poCopy
        : order.poCopy
        ? [order.poCopy]
        : [];

      result[order._id] = [];

      for (const fileUrl of poCopyList) {
        let url = fileUrl;

        if (fileUrl.toLowerCase().includes(".pdf") && fileUrl.includes("/image/")) {
          const testRawUrl = fileUrl.replace("/image/", "/raw/");
          const exists = await checkIfUrlExists(testRawUrl);
          if (exists) url = testRawUrl;
        }

        result[order._id].push(url);
      }
    }

    setResolvedPOUrls(result);
  };

  if (filteredOrders.length) {
    resolveAllPOCopyUrls();
  }
}, [filteredOrders]);

  const [filters, setFilters] = useState({
    employeeId: "",
    startDate: "",
    endDate: "",
  });

const sectionsList = [
  { key: "preExpander", label: "EPS/Thermocol Block Molding Production Section" },
    { key: "danaBeads", label: "EPS/Thermocol Dana/Beads Production Section" },
  { key: "shapeMoulding", label: "EPS/Thermocol Shape Molding Production Section" },
  { key: "sheetCutting", label: "EPS/Thermocol Sheet Cutting & Dispatch Section" },
  { key: "shapePackaging", label: "EPS/Thermocol Shape Molding Packaging & Dispatch Section" },
  { key: "cncSection", label: "EPS/Thermocol CNC Hot Wire/CNC Router" },
];

  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState("sales");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [ordersFetched, setOrdersFetched] = useState(false);
  const location = useLocation();

  const ordersPerPage = 20;

  // 🔁 Maps section keys to slip types
const sectionToSlipType = {
  preExpander: "dana",
    danaBeads: "dana-beads",
  shapeMoulding: "production",
  sheetCutting: "dispatch",
  shapePackaging: "packaging",
  cncSection: "cnc-slip",
};

// 🧠 Helper to get slipType from selected sections
const getSlipTypeFromSection = (requiredSections) => {
  if (!requiredSections) return null;
  const active = Object.entries(requiredSections).find(([_, v]) => v);
  return active ? sectionToSlipType[active[0]] || null : null;
};


const groupOrdersByPO = (orders) => {
  // 👉 Sort orders by _id (newer first)
  const sorted = [...orders].sort((a, b) => b._id.localeCompare(a._id));

  return sorted.reduce((groups, order) => {
    const po = order.po || "N/A";
    if (!groups[po]) groups[po] = [];
    groups[po].push(order);
    return groups;
  }, {});
};


  const getStockForProduct = (productName) => {
    const product = products.find((p) => p.name === productName);
    return product
      ? product.quantity + product.materialPacked - product.materialDispatch
      : 0;
  };
  const [selectedSections, setSelectedSections] = useState({});
 
const handleSlipSubmit = async (payload) => {
  try {
    if (!selectedOrder) return;

   
    const selectedSections = selectedOrder?.requiredSections || {};

    const slipTypeToHandler = {
      dana: async () => {
        if (selectedSections.preExpander) {
          await axiosInstance.post("/slips/dana", {
            orderId: selectedOrder._id,
            ...payload.danaFormData,
          });
          await actuallySendToProduction(
            selectedOrder._id,
            null,
            null,
            null,
            payload.danaFormData
          );
        }
      },

      production: async () => {
        if (selectedSections.shapeMoulding) {
          await axiosInstance.post("/slips/production", {
            orderId: selectedOrder._id,
            ...payload.shapeFormData,
          });
          await actuallySendToProduction(
            selectedOrder._id,
            payload.shapeFormData,
            null,
            null
          );
        }
      },

      dispatch: async () => {
        if (selectedSections.sheetCutting) {
          await axiosInstance.post("/slips/dispatch", {
            orderId: selectedOrder._id,
            row: [payload.cuttingFormData],
          });
          await actuallySendToDispatch(selectedOrder._id, [payload.cuttingFormData]);
        }
      },

      packaging: async () => {
        if (selectedSections.shapePackaging) {
          await axiosInstance.post("/slips/packaging", {
            orderId: selectedOrder._id,
            ...payload.packagingFormData,
          });
          await actuallySendToPackaging(selectedOrder._id, payload.packagingFormData);
        }
      },

      "cnc-slip": async () => {
        if (selectedSections.cncSection) {
          await axiosInstance.post("/slips/cnc", {
            orderId: selectedOrder._id,
            ...payload.cncFormData,
          });
        }
      },
       "dana-beads": async () => {
    if (selectedSections.danaBeads) {
      await axiosInstance.post("/slips/dana-beads", {
        orderId: selectedOrder._id,
        ...payload.danaBeadsFormData,
      });
      await actuallySendToProduction(
        selectedOrder._id,
        null,
        null,
        null,
        null,
        payload.danaBeadsFormData
      );
    }
  },
    };

    const handler = slipTypeToHandler[slipType];
    if (!handler) {
      console.warn("⚠️ Unsupported slip type:", slipType);
      return;
    }

    await handler();

    await Swal.fire({
      icon: "success",
      title: "Success!",
      text: "Slip submitted successfully!",
    });

    setModalOpen(false);
    setSelectedOrder(null);
  } catch (err) {
    console.error("❌ Error submitting slip:", err);
    alert("Error submitting slip");
  }
};


  useEffect(() => {
    axiosInstance
      .get("/products/all-backend-products")
      .then((res) => setProducts(res.data))
      .catch((err) => console.error("Error fetching products:", err));
  }, []);

  // ✅ 2. This resets pagination ONLY when the searchTerm changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  useEffect(() => {
    gsap.from(".order-table", {
      opacity: 0,
      y: 50,
      duration: 1,
      ease: "power3.out",
      clearProps: "all", // ✅ Here too
    });
  }, []);

  useEffect(() => {
    const handleClickOutside = () => setExpandedProductId(null);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  useEffect(() => {
    const initialSections = {};
    orders.forEach((order) => {
      initialSections[order._id] = { ...order.requiredSections };
    });
    setLocalSections(initialSections);
  }, [orders]);
  const fetchOrders = async (page = 1) => {
    setLoading(true);
    try {
      const decoded = JSON.parse(atob(token.split(".")[1]));
      setRole(decoded.role);

     const params = {
  page,
  limit: ordersPerPage,
  ...filters,
  search: searchTerm,
  sort: ["newest", "oldest"].includes(sortOrder) ? sortOrder : "newest",
  status: statusFilter,
  dispatchStatus: dispatchStatusFilter,
};

// ✅ Add ageFilter only if it's one of the new options
if (
  ["olderThan10", "olderThan20", "olderThan30", "moreThan30"].includes(sortOrder)
) {
  params.ageFilter = sortOrder;
}

      let url = "/orders";
  
      const res = await axiosInstance.get(url, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });

      setOrders(res.data.orders);
      setFilteredOrders(res.data.orders);
      setTotalPages(res.data.totalPages);
      setOrdersFetched(true);
    } catch (err) {
      console.error("Error fetching orders:", err);
      toast.error("Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    fetchOrders(currentPage);
  }, [
  filters,
  token,
  location,
  currentPage,
  searchTerm,
  sortOrder,
  statusFilter,
  dispatchStatusFilter,
]);
useEffect(() => {
  if (shouldRefetchOrders) {
    fetchOrders();
    setShouldRefetchOrders(false);
  }
}, [shouldRefetchOrders]);

  const MySwal = withReactContent(Swal);

  useEffect(() => {
    const storedDisabled = localStorage.getItem("disabledOrders");
    if (storedDisabled) {
      setDisabledOrders(JSON.parse(storedDisabled));
    }
  }, []);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const decoded = JSON.parse(atob(token.split(".")[1]));
        const currentUser = { _id: decoded.userId, name: decoded.name };

        if (decoded.role === "admin" || decoded.role === "accounts") {
          const res = await axiosInstance.get("/users/employees", {
            headers: { Authorization: `Bearer ${token}` },
          });
          setEmployees([...res.data]);
        } else {
          // For sales/others — only show logged-in user
          setEmployees([currentUser]);
        }
      } catch (error) {
        console.error("Failed to fetch employees:", error);
      }
    };

    fetchEmployees();
  }, [token]);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this order?")) return;
    try {
      await axiosInstance.delete(`/orders/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(orders.filter((o) => o._id !== id));
      toast.success("Order deleted");
      fetchOrders();
    } catch (err) {
      console.error("Error deleting:", err);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
  };

  const handleSaveEdit = async (id, updatedData) => {
    try {
      await axiosInstance.put(`/orders/${id}`, updatedData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const updated = orders.map((o) =>
        o._id === id ? { ...o, ...updatedData } : o
      );
      setOrders(updated);
      fetchOrders();
    } catch (err) {
      console.error("Failed to update order:", err);
    }
  };

  const exportToExcel = () => {
    const data = filteredOrders.map((order) => ({
      OrderID: order._id,
      ShortID: order.shortId,
      Customer: order.customerName,
      Product: order.product,
      Quantity: order.quantity,
      Unit: order.unit,
      Size: order.size,
      Density: order.density,
      Price: order.price,
      PackagingCharge: order.packagingCharge,
      Freight: order.freight,
      FreightAmount: order.freightAmount,
      PO: order.po,
      Status: order.status,
      DispatchStatus: order.dispatchStatus,
      PackagingStatus: order.packagingStatus,
      Produced: order.produced,
      RemainingToProduce: order.remainingToProduce,
      Stock: order.stock,
      ReadyForPackaging: order.readyForPackaging ? "Yes" : "No",
      Remarks: order.remarks || "",
    CreatedAt: new Date(order.createdAt).toLocaleDateString("en-GB", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
}),
OrderDate: new Date(order.date).toLocaleDateString("en-GB", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
}),
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Orders");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(blob, `orders_${Date.now()}.xlsx`);
  };

  useEffect(() => {
    if (ordersFetched) {
      gsap.from(".order-table", {
        opacity: 0,
        y: 50,
        duration: 1,
        ease: "power3.out",
        clearProps: "all", // ✅ Here too
      });
      gsap.from(".order-row", {
        opacity: 0,
        y: 20,
        stagger: 0.1,
        duration: 1,
        ease: "power3.out",
        clearProps: "all", // Optional: for rows
      });
    }
  }, [ordersFetched]);

const currentOrders = filteredOrders;


 
const groupedOrders = useMemo(() => {
  const grouped = groupOrdersByPO(filteredOrders);

  // Sort PO groups by latest order._id inside them (descending)
  const sortedPOs = Object.entries(grouped).sort(([, a], [, b]) => {
    const latestA = a.reduce((max, curr) => (curr._id > max._id ? curr : max), a[0]);
    const latestB = b.reduce((max, curr) => (curr._id > max._id ? curr : max), b[0]);
    return latestB._id.localeCompare(latestA._id);
  });

  return sortedPOs;
}, [filteredOrders]);


  // ✅ Declare SweetAlert2 with Tailwind buttons globally

const handleSectionRadioChange = async (orderId, selectedKey) => {
 
  const updatedSections = {};

  // Set only the selected section to true
  sectionsList.forEach(({ key }) => {
    updatedSections[key] = key === selectedKey;
  });

  try {
    const { data: updatedOrder } = await axiosInstance.put(
      `/orders/${orderId}/sections`,
      { requiredSections: updatedSections }
    );

    // Update local state
    setOrders((prevOrders) =>
      prevOrders.map((o) =>
        o._id === orderId
          ? {
              ...o,
              requiredSections: updatedOrder.requiredSections,
              sentTo: updatedOrder.sentTo,
            }
          : o
      )
    );

    setLocalSections((prev) => ({
      ...prev,
      [orderId]: updatedOrder.requiredSections,
    }));

    // ✅ Store selected radio key for this order
    setSelectedRadioByOrder((prev) => ({
      ...prev,
      [orderId]: selectedKey,
    }));
    fetchOrders(currentPage);
  } catch (error) {
    console.error("Error updating section selection:", error);
  }
};

  const swalWithTailwindButtons = Swal.mixin({
    customClass: {
      confirmButton:
        "px-6 py-2 bg-blue-500 text-white font-semibold rounded-md hover:bg-blue-600",
      cancelButton:
        "px-6 py-2 bg-red-500 text-white font-semibold rounded-md hover:bg-red-600",
    },
    buttonsStyling: false,
  });

  // Send selected orders to Production

const actuallySendToProduction = async (
  orderId,
  shapeRowData,
  packagingFormData,
  cuttingFormData,
  danaFormData,
  danaBeadsFormData
) => {
   const danaBeadsRows = danaBeadsFormData
    ? [{
        productName: danaBeadsFormData.productName,
        density: danaBeadsFormData.density,
        quantity: danaBeadsFormData.quantity,
        recycleDana: danaBeadsFormData.recycleDana,
        nextGrade: danaBeadsFormData.nextGrade,
        remarks: danaBeadsFormData.remarks,
      }]
    : [];


  const freshOrder = orders.find((o) => o._id === orderId);
  if (!freshOrder) return;

  const selectedSections = Object.entries(freshOrder.requiredSections || {})
    .filter(([_, value]) => value)
    .map(([key]) => key);
    

  const product = products.find((p) => p.name === freshOrder.product);
  const stock = product ? product.quantity : 0;
  const remainingQuantity = Math.max(freshOrder.quantity - stock, 0);

  const danaRows = danaFormData
    ? [
        {
          productName: danaFormData.productName || freshOrder.product,
          rawMaterial: danaFormData.typeOfRawBlock,
          quantity: danaFormData.quantity,
          remarks: danaFormData.remarks,
          density: danaFormData.density || "",
          recycledDana: danaFormData.recycledDana || "",
          weight: danaFormData.weight || "",
          grade: danaFormData.grade || "",
        },
      ]
    : [];

  const cuttingRows = cuttingFormData?.size ? [cuttingFormData] : [];
  const dispatchSlip = cuttingFormData?.size
    ? {
        size: cuttingFormData.size,
        density: cuttingFormData.density,
        quantity: cuttingFormData.quantity,
        remarks: cuttingFormData.remarks,
      }
    : null;

  try {
    const payload = {
      sections: selectedSections,
      remainingToProduce: remainingQuantity,
    };

      if (selectedSections.includes("danaBeads") && danaBeadsFormData) {
    payload.danaBeadsRows = danaBeadsRows;
  }
  
    if (selectedSections.includes("blockMoulding") && danaFormData) {
      payload.danaRows = danaRows;
    }

    if (selectedSections.includes("shapeMoulding") && shapeRowData) {
      payload.shapeRows = [shapeRowData];
    }

    if (cuttingRows.length > 0) {
      payload.cuttingRows = cuttingRows;
    }

    if (dispatchSlip) {
      payload.dispatchSlip = dispatchSlip;
    }

    if (packagingFormData) {
      payload.packagingSlip = packagingFormData;
    }

    const res = await axiosInstance.put(
      `/orders/send-to-production/${orderId}`,
      payload
    );

    if (res.data.message === "Order sent to production") {
      setDisabledOrders((prev) => {
        const updated = { ...prev, [orderId]: true };
        localStorage.setItem("disabledOrders", JSON.stringify(updated));
        return updated;
      });
    }
  } catch (error) {
    console.error("❌ Error sending to Production:", error);
    alert(
      `Error submitting slip: ${
        error?.response?.data?.message || error.message
      }`
    );
  }
};


  const actuallySendToPackaging = async (orderId, packagingFormData) => {
    try {
      const res = await axiosInstance.post("/orders/send-to-packaging", {
        orderId,
        packagingRows: [packagingFormData],
      });

      if (res.data.success) {
        swalWithTailwindButtons.fire({
          title: "Sent!",
          text: "Order sent to Packaging.",
          icon: "success",
        });

        setDisabledOrders((prev) => {
          const updated = { ...prev, [orderId]: true };
          localStorage.setItem("disabledOrders", JSON.stringify(updated));
          return updated;
        });
      }
    } catch (err) {
      console.error("Failed to send to packaging:", err);
    }
  };

  const actuallySendToDispatch = async (orderId, cuttingFormData) => {
    const currentOrder = orders.find((o) => o._id === orderId);
    if (!currentOrder) return;

    const selectedSections = Object.entries(currentOrder.requiredSections || {})
      .filter(([_, value]) => value)
      .map(([key]) => key);

    try {
      const res = await axiosInstance.post("/orders/send-to-dispatch", {
        orderIds: [orderId],
        sections: selectedSections,
        cuttingRows: Array.isArray(cuttingFormData)
          ? cuttingFormData
          : [cuttingFormData],
      });

      const { updatedOrders = [] } = res.data;

      setDisabledOrders((prev) => {
        const updated = { ...prev, [orderId]: true };
        localStorage.setItem("disabledOrders", JSON.stringify(updated));
        return updated;
      });

      setProducts((prevProducts) =>
        prevProducts.map((product) => {
          const updated = updatedOrders.find((u) => u.product === product.name);
          return updated
            ? { ...product, stock: updated.remainingStock }
            : product;
        })
      );

      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order._id === orderId
            ? { ...order, dispatchStatus: "dispatched" }
            : order
        )
      );

      swalWithTailwindButtons.fire({
        title: "Sent!",
        text: "Order sent to Dispatch/Cutting.",
        icon: "success",
      });

      setSelectedOrders([]);
    } catch (error) {
      console.error("Error sending to Dispatch:", error);
    }
  };
 
  const sortedOrders = useMemo(() => {
  return [...orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}, [orders]);

// ✅ Mark order as completed with confirmation
const handleComplete = async (id) => {
  const confirm = await Swal.fire({
    title: "Mark as Completed?",
    text: "This will mark the order as completed. You won’t be able to revert this easily.",
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Yes, mark completed",
    cancelButtonText: "Cancel",
    confirmButtonColor: "#16a34a", // green
    cancelButtonColor: "#d33", // red
  });

  if (!confirm.isConfirmed) return;

  try {
     await axiosInstance.put(
      `/orders/${id}`,
      { 
        status: "completed",
        danaBeadsStatus: "completed" // Add this line to update danaBeadsStatus too
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );

     setOrders((prev) =>
      prev.map((o) =>
        o._id === id ? { 
          ...o, 
          status: "completed",
          danaBeadsStatus: "completed" // Update local state too
        } : o
      )
    );

    toast.success("Order marked as completed");
  } catch (err) {
    console.error("Failed to complete order:", err);
    toast.error("Failed to mark order completed");
  }
};

// ✅ Cancel order with confirmation
const handleCancel = async (id) => {
  const confirm = await Swal.fire({
    title: "Cancel this Order?",
    text: "This will cancel the order and remove it from dashboards.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Yes, cancel it",
    cancelButtonText: "Keep it",
    confirmButtonColor: "#d33", // red
    cancelButtonColor: "#3085d6", // blue
  });

  if (!confirm.isConfirmed) return;

  try {
    await axiosInstance.put(
      `/orders/${id}`,
      { status: "cancelled" },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    setOrders((prev) =>
      prev.map((o) =>
        o._id === id ? { ...o, status: "cancelled" } : o
      )
    );

    toast.success("Order cancelled");
  } catch (err) {
    console.error("Failed to cancel order:", err);
    toast.error("Failed to cancel order");
  }
};



  return (
    
    <div className="bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100">
      {uploadingPOCopy && (
        <div className="fixed inset-0 bg-[#000000af] bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white px-6 py-4 rounded-md shadow-md flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
            <p className="text-gray-700">Uploading PO Copy...</p>
          </div>
        </div>
      )}

      <InternalNavbar />
      <div className="max-w-7xl min-h-[100vh] mx-auto p-6 relative ">
        {/* Back Button */}
        <button
          className="absolute hidden md:block cursor-pointer left-4 bg-blue-500 text-white px-4 py-2 rounded-md shadow-md hover:bg-blue-600 back-button"
          onClick={() => navigate(-1)} // Go back to the previous page
        >
          ↩️ Back
        </button>
        <h2 className="md:text-4xl text-3xl font-extrabold mb-4 text-center text-gray-800">
          Orders
        </h2>

        {/* Admin Filters */}
        {(role === "admin" || role === "accounts") && (
          <div className="bg-white p-6 shadow-lg rounded-lg mb-6 grid md:grid-cols-2 gap-4 items-end">
            {/* Employee Filter */}
            <div className="col-span-1">
              <label
                htmlFor="employeeId"
                className="block text-base font-bold text-gray-700 mb-1"
              >
                Employees
              </label>
              <select
                name="employeeId"
                id="employeeId"
                className="w-full cursor-pointer px-3 py-2 border font-bold border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                value={filters.employeeId}
                onChange={handleFilterChange}
              >
                <option value="">All Employees</option>
                {employees
                  .filter((employee) => employee._id !== "admin") // Remove the fake admin option
                  .map((employee) => (
                    <option key={employee._id} value={employee._id}>
                      {employee.name}
                    </option>
                  ))}
              </select>
            </div>

            {/* Clear Filters Button */}
            <div className="col-span-1">
              <button
                onClick={() => {
                  setFilters({ employeeId: "", startDate: "", endDate: "" });
                  setSearchTerm("");
                   setSortOrder("newest");
  setStatusFilter("");
  setDispatchStatusFilter("");
                }}
                className="w-full bg-[#b632ebd7] font-bold hover:bg-[#B229EA] cursor-pointer text-white px-4 py-2 rounded-lg shadow-md transition"
              >
                ⟳ Clear Filters
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 px-6 py-6 bg-white rounded-lg shadow-md">
          {/* Search Field */}
          <div className="col-span-1">
            <label
              htmlFor="search"
              className="block text-sm font-semibold text-gray-700 mb-1"
            >
              🔍 Search
            </label>
            <input
              type="text"
              id="search"
              placeholder="Search by PO, Product, Order ID, or Customer"
              className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Start Date Filter */}
          <div className="col-span-1">
            <label
              htmlFor="startDate"
              className="block text-sm font-semibold text-gray-700 mb-1"
            >
              📅 Start Date
            </label>
            <input
              type="date"
              name="startDate"
              id="startDate"
              value={filters.startDate}
              onChange={handleFilterChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* End Date Filter */}
          <div className="col-span-1">
            <label
              htmlFor="endDate"
              className="block text-sm font-semibold text-gray-700 mb-1"
            >
              📅 End Date
            </label>
            <input
              type="date"
              name="endDate"
              id="endDate"
              value={filters.endDate}
              onChange={handleFilterChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {/* Clear Filters Button (Sales Role) */}
          {(role === "sales" ||
            role === "dispatch" ||
            role === "packaging") && (
            <div className="col-span-1 flex items-end">
              <button
                onClick={() => {
                  setFilters({ employeeId: "", startDate: "", endDate: "" });
                  setSearchTerm("");
                }}
                className="w-full bg-yellow-500 cursor-pointer hover:bg-yellow-600 text-white font-bold px-4 py-2 rounded-md shadow-lg transition"
              >
                ⟳ Clear Filters
              </button>
            </div>
          )}

          {/* Export Button */}
          {orders.length > 0 && (
            <div className="col-span-1 flex items-end">
              <button
                onClick={exportToExcel}
                className="w-full bg-green-600 cursor-pointer hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-md shadow-lg transition"
              >
                📥 Export to Excel
              </button>
            </div>
          )}
          {/* Sort Order */}
<div className="col-span-1">
  <label className="block text-sm font-semibold text-gray-700 mb-1">
    🕒 Sort By
  </label>
<select
  value={sortOrder}
  onChange={(e) => setSortOrder(e.target.value)}
  className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
>
  <option value="newest">Newest First</option>
  <option value="olderThan10">Older Than 10 Days</option>
  <option value="olderThan20">Older Than 20 Days</option>
  <option value="olderThan30">Older Than 30 Days</option>
  <option value="moreThan30">More Than 30 Days</option>
</select>

</div>

{/* Status Filter */}
<div className="col-span-1">
  <label className="block text-sm font-semibold text-gray-700 mb-1">
    🏷️ Production Status
  </label>
  <select
    value={statusFilter}
    onChange={(e) => setStatusFilter(e.target.value)}
    className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
  >
    <option value="">All</option>
    <option value="pending">Pending</option>
    <option value="in process">In Process</option>
    <option value="processed">Processed</option>
      <option value="completed">Completed</option>
    <option value="cancelled">Cancelled</option> {/* 👈 NEW */}
  </select>
</div>

{/* Dispatch Status Filter */}
<div className="col-span-1">
  <label className="block text-sm font-semibold text-gray-700 mb-1">
    🚚 Dispatch Status
  </label>
  <select
    value={dispatchStatusFilter}
    onChange={(e) => setDispatchStatusFilter(e.target.value)}
    className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
  >
    <option value="">All</option>
    <option value="not dispatched">Not Dispatched</option>
    <option value="ready to dispatch">Ready to Dispatch</option>
    <option value="dispatched">Dispatched</option>
  </select>
</div>
         {/* Cancelled Orders Button */}
{(role === "admin" || role === "accounts" || role === "sales" || role === "production") && (
  <div className="col-span-1 flex flex-col md:flex-row gap-3 w-full">
  <button
    onClick={() => navigate("/cancelled-orders")}
    className="w-full md:w-auto bg-red-600 cursor-pointer hover:bg-red-700 text-white font-semibold px-4 py-2 rounded-md shadow-lg transition"
  >
    ❌ View Cancelled Orders
  </button>

  <button
    onClick={() => navigate("/completed-orders")}
    className="w-full md:w-auto bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-md shadow-lg transition"
  >
    ✅ View Completed Orders
  </button>
</div>

)}
        </div>

        {/* Table and Pagination logic here */}
        {loading || filterLoading ? (
          <div className="flex justify-center items-center h-120">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 border-4 border-purple-300 border-t-[#355DFC] rounded-full animate-spin"></div>
              <p className="text-[#355DFC] font-medium">
                {loading ? "Loading orders..." : "Filtering orders..."}
              </p>
            </div>
          </div>
        ) : currentOrders.length === 0 ? (
          <h1 className="text-center font-bold text-2xl text-gray-600">
            No orders found!
          </h1>
        ) : (
       
          <div className="w-full overflow-x-auto mt-10 max-h-[80vh]">
  <div className="min-w-full inline-block align-middle">
    <div className="w-full overflow-x-auto overflow-y-auto max-h-[80vh]">
  <table className="order-table min-w-full divide-y divide-gray-200 table-auto text-xs sm:text-sm">
    <thead className="bg-gray-200 sticky top-0 z-30">
  <tr>
    <th className="sticky top-0 z-20 px-2 sm:px-4 py-2 text-left font-bold text-gray-700 uppercase tracking-wider bg-gray-200 text-[10px] sm:text-xs md:text-sm">
      Order Date
    </th>
    <th className="sticky top-0 z-20 px-2 sm:px-4 py-2 text-left font-bold text-gray-700 uppercase tracking-wider bg-gray-200 text-[10px] sm:text-xs md:text-sm">
      Order ID
    </th>
    <th className="sticky top-0 z-20 px-2 sm:px-4 py-2 text-left font-bold text-gray-700 uppercase tracking-wider bg-gray-200 text-[10px] sm:text-xs md:text-sm">
      Client Name
    </th>
    <th className="sticky top-0 z-20 px-2 sm:px-4 py-2 text-left font-bold text-gray-700 uppercase tracking-wider bg-gray-200 text-[10px] sm:text-xs md:text-sm">
      Product Name
    </th>
    <th className="sticky top-0 z-20 px-2 sm:px-4 py-2 text-left font-bold text-gray-700 uppercase tracking-wider bg-gray-200 text-[10px] sm:text-xs md:text-sm">
      Narration
    </th>
    <th className="sticky top-0 z-20 px-2 sm:px-4 py-2 text-left font-bold text-gray-700 uppercase tracking-wider bg-gray-200 text-[10px] sm:text-xs md:text-sm">
      Narration Images
    </th>
    <th className="sticky top-0 z-20 px-2 sm:px-4 py-2 text-left font-bold text-gray-700 uppercase tracking-wider bg-gray-200 text-[10px] sm:text-xs md:text-sm">
      Bill To
    </th>
    <th className="sticky top-0 z-20 px-2 sm:px-4 py-2 text-left font-bold text-gray-700 uppercase tracking-wider bg-gray-200 text-[10px] sm:text-xs md:text-sm">
      Ship To
    </th>
    <th className="sticky top-0 z-20 px-2 sm:px-4 py-2 text-left font-bold text-gray-700 uppercase tracking-wider bg-gray-200 text-[10px] sm:text-xs md:text-sm">
      Size
    </th>
    <th className="sticky top-0 z-20 px-2 sm:px-4 py-2 text-left font-bold text-gray-700 uppercase tracking-wider bg-gray-200 text-[10px] sm:text-xs md:text-sm">
      Qty
    </th>
    <th className="sticky top-0 z-20 px-2 sm:px-4 py-2 text-left font-bold text-gray-700 uppercase tracking-wider bg-gray-200 text-[10px] sm:text-xs md:text-sm">
      Stock
    </th>
    <th className="sticky top-0 z-20 px-2 sm:px-4 py-2 text-left font-bold text-gray-700 uppercase tracking-wider bg-gray-200 text-[10px] sm:text-xs md:text-sm">
      Remaining to Produce
    </th>
    <th className="sticky top-0 z-20 px-2 sm:px-4 py-2 text-left font-bold text-gray-700 uppercase tracking-wider bg-gray-200 text-[10px] sm:text-xs md:text-sm">
      Price
    </th>
    <th className="sticky top-0 z-20 px-2 sm:px-4 py-2 text-left font-bold text-gray-700 uppercase tracking-wider bg-gray-200 text-[10px] sm:text-xs md:text-sm">
      Density
    </th>
    <th className="sticky top-0 z-20 px-2 sm:px-4 py-2 text-left font-bold text-gray-700 uppercase tracking-wider bg-gray-200 text-[10px] sm:text-xs md:text-sm">
      Packaging Charge
    </th>
    <th className="sticky top-0 z-20 px-2 sm:px-4 py-2 text-left font-bold text-gray-700 uppercase tracking-wider bg-gray-200 text-[10px] sm:text-xs md:text-sm">
      P/O
    </th>
    <th className="sticky top-0 z-20 px-2 sm:px-4 py-2 text-left font-bold text-gray-700 uppercase tracking-wider bg-gray-200 text-[10px] sm:text-xs md:text-sm">
      Freight
    </th>
    <th className="sticky top-0 z-20 px-2 sm:px-4 py-2 text-left font-bold text-gray-700 uppercase tracking-wider bg-gray-200 text-[10px] sm:text-xs md:text-sm">
      Payments Terms
    </th>
    <th className="sticky top-0 z-20 px-2 sm:px-4 py-2 text-left font-bold text-gray-700 uppercase tracking-wider bg-gray-200 text-[10px] sm:text-xs md:text-sm">
      Dispatch Time
    </th>
    <th className="sticky top-0 z-20 px-2 sm:px-4 py-2 text-left font-bold text-gray-700 uppercase tracking-wider bg-gray-200 text-[10px] sm:text-xs md:text-sm">
      Remarks
    </th>
    <th className="sticky top-0 z-20 px-2 sm:px-4 py-2 text-left font-bold text-gray-700 uppercase tracking-wider bg-gray-200 text-[10px] sm:text-xs md:text-sm">
      PO Copy
    </th>
    {role !== "production" && role !== "dispatch" && role !== "packaging" && (
      <th className="sticky top-0 z-20 px-2 sm:px-4 py-2 text-left font-bold text-gray-700 uppercase tracking-wider bg-gray-200 text-[10px] sm:text-xs md:text-sm">
        Actions
      </th>
    )}
    {role !== "production" && role !== "dispatch" && role !== "sales" && role !== "admin" && role !== "packaging" && (
      <>
        <th className="sticky top-0 z-20 px-2 sm:px-4 py-2 text-left font-bold text-gray-700 uppercase tracking-wider bg-gray-200 text-[10px] sm:text-xs md:text-sm">
          Section
        </th>
        <th className="sticky top-0 z-20 px-2 sm:px-4 py-2 text-left font-bold text-gray-700 uppercase tracking-wider bg-gray-200 text-[10px] sm:text-xs md:text-sm">
          Actions
        </th>
      </>
    )}
    <th className="sticky top-0 z-20 px-2 sm:px-4 py-2 text-left font-bold text-gray-700 uppercase tracking-wider bg-gray-200 text-[10px] sm:text-xs md:text-sm">
      Production Status
    </th>
    <th className="sticky top-0 z-20 px-2 sm:px-4 py-2 text-left font-bold text-gray-700 uppercase tracking-wider bg-gray-200 text-[10px] sm:text-xs md:text-sm">
      Packaging Status
    </th>
    <th className="sticky top-0 z-20 px-2 sm:px-4 py-2 text-left font-bold text-gray-700 uppercase tracking-wider bg-gray-200 text-[10px] sm:text-xs md:text-sm">
      Dispatch Status
    </th>
  </tr>
</thead>
                  <tbody className="bg-white divide-y divide-gray-200 capitalize">
{sortedOrders.map((order, index) => {
                            return (
 <tr
      key={order._id}
      className="order-row odd:bg-white even:bg-gray-50 hover:bg-gray-100"
    >        <td className="px-2 sm:px-4 py-2 text-[11px] sm:text-sm text-gray-800">
                                 {new Date(order.createdAt).toLocaleDateString("en-GB", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
})}

                                </td>
        <td className="px-2 sm:px-4 py-2 text-[11px] sm:text-sm text-gray-800">
                                  {order.shortId}
                                </td>
        <td className="px-2 sm:px-4 py-2 whitespace-nowrap text-[11px] sm:text-sm">
                                  {order.customerName}
                                </td>

                                          <td className="px-2 sm:px-4 py-2 text-[11px] sm:text-sm text-blue-600 underline cursor-pointer">

                                  <button
                                    onClick={() => {
                                      const product = products.find(
                                        (p) => p.name === order.product
                                      );
                                      if (product?.images?.length > 0) {
                                        setActiveProductImage({
                                          name: product.name,
                                          images: product.images,
                                        });
                                      } else {
                                        Swal.fire({
                                          icon: "info",
                                          title: "No Image",
                                          text: "No images available for this product.",
                                        });
                                      }
                                    }}
                                  >
                                    {order.product}
                                  </button>
                                </td>
                                 {/* ✅ Narration text */}
        <td className="px-2 sm:px-4 py-2 text-[11px] sm:text-sm text-gray-800">
  {order.narration ? (
    <span>
      <strong>Narration:</strong> {order.narration}
    </span>
  ) : (
    <span>-</span>
  )}
</td>



    {/* ✅ Narration images */}
   
        <td className="px-2 sm:px-4 py-2 text-[11px] sm:text-sm text-gray-800">
          <strong>Narration Images:</strong>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "5px" }}>
            {order.narrationImages?.map((img, i) => (
              <img
                key={i}
                src={img}
                alt={`Narration ${i + 1}`}
                style={{
                  width: "100px",
                  height: "100px",
                  objectFit: "cover",
                  borderRadius: "4px",
                  cursor: "pointer"
                }}
                onClick={() => window.open(img, "_blank")}
              />
            ))}
          </div>
        </td>
        <td className="px-2 sm:px-4 py-2 text-[11px] sm:text-sm text-gray-800">
  <strong>Bill To:</strong><br />
  {order.billTo || "—"}
</td>

        <td className="px-2 sm:px-4 py-2 text-[11px] sm:text-sm text-gray-800">
  <strong>Ship To:</strong><br />
  {order.shipTo || "—"}
</td>

        <td className="px-2 sm:px-4 py-2 text-[11px] sm:text-sm text-gray-800">
                                  {order.size ? order.size : "N/A"}
                                </td>
        <td className="px-2 sm:px-4 py-2 text-[11px] sm:text-sm text-gray-800">
                                  {order.quantity}
                                </td>
        <td className="px-2 sm:px-4 py-2 text-[11px] sm:text-sm text-gray-800">
                                  {getStockForProduct(order.product)}
                                </td>
        <td className="px-2 sm:px-4 py-2 text-[11px] sm:text-sm text-gray-800">
                                  {Math.max(
                                    order.quantity -
                                      getStockForProduct(order.product),
                                    0
                                  )}
                                </td>

        <td className="px-2 sm:px-4 py-2 text-[11px] sm:text-sm text-gray-800">
                                  ₹{order.price}
                                </td>
        <td className="px-2 sm:px-4 py-2 text-[11px] sm:text-sm text-gray-800">
                                  {order.density}kg/m<sup>3</sup>
                                </td>
        <td className="px-2 sm:px-4 py-2 text-[11px] sm:text-sm text-gray-800">
                                  ₹{order.packagingCharge}
                                </td>
        <td className="px-2 sm:px-4 py-2 text-[11px] sm:text-sm text-gray-800">
                                  {order.po}
                                </td>
        <td className="px-2 sm:px-4 py-2 text-[11px] sm:text-sm text-gray-800">
                                  {`${order.freight}: ₹${order.freightAmount}`}
                                </td>

        <td className="px-2 sm:px-4 py-2 text-[11px] sm:text-sm text-gray-800">
  {order.paymentTerms || "—"}
</td>
                                {/* ✅ Dispatch Date */}
        <td className="px-2 sm:px-4 py-2 text-[11px] sm:text-sm text-gray-800">
                                  {(() => {
                                    if (!order.date) return "N/A";

                                    const today = new Date();
                                    const deliveryDate = new Date(order.date);

                                    // Set both dates to midnight to ignore the time portion
                                    today.setHours(0, 0, 0, 0);
                                    deliveryDate.setHours(0, 0, 0, 0);

                                    const diffDays = Math.ceil(
                                      (deliveryDate - today) /
                                        (1000 * 60 * 60 * 24)
                                    );

                                    // Compare the days difference
                                    if (diffDays <= 7) return "Within 1 Week";
                                    if (diffDays <= 14) return "Within 2 Weeks";
                                    if (diffDays <= 20) return "Within 20 Days";

                                    // If no match, return the date in the required format
                                    return deliveryDate.toLocaleDateString("en-GB", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

                                  })()}
                                </td>
        <td className="px-2 sm:px-4 py-2 text-[11px] sm:text-sm text-gray-800">
                                  {order.remarks || "N/A"}
                                </td>

                               {/* ✅ PO Copy */}
                               
        <td className="px-2 sm:px-4 py-2 text-[11px] sm:text-sm text-gray-800">
  <div className="flex flex-col gap-1">
    {/* ✅ Always treat poCopy as array */}
    {(() => {
  const poCopyArray = Array.isArray(order.poCopy)
    ? order.poCopy
    : order.poCopy
    ? [order.poCopy]
    : [];

  return poCopyArray.length > 0
    ? poCopyArray.map((fileUrl, idx) => {
        const isPdfFile = fileUrl.toLowerCase().includes(".pdf");
        const finalUrl = resolvedPOUrls?.[order._id]?.[idx] || fileUrl;

        const originalName = Array.isArray(order.poOriginalName)
          ? order.poOriginalName[idx] || `PO Copy ${idx + 1}`
          : order.poOriginalName || `PO Copy ${idx + 1}`;

        if (!finalUrl) {
          return (
            <div key={idx} className="text-sm text-gray-500 italic">
              📄 {originalName} — old file, not viewable.
            </div>
          );
        }

        return (
          <button
            key={idx}
            onClick={() => {
              Swal.fire({
                title: originalName,
               html: isPdfFile
  ? `<div style="height:500px">
       <p style="font-size:14px;color:gray;">⏳ Loading PDF preview...</p>
       <iframe src="${finalUrl}" width="100%" height="480px" style="border:none;"></iframe>
       <p style="font-size:12px;"><a href="${finalUrl}" target="_blank" style="color:blue;">Open in new tab</a></p>
     </div>`
  : `<img src="${finalUrl}" style="max-width:100%; max-height:500px;" />`,
                showCancelButton: true,
                showConfirmButton: false,
                cancelButtonText: "Close",
              });
            }}
            className="text-blue-600 underline hover:text-blue-800 text-left truncate"
          >
            📄 {originalName}
          </button>
        );
      })
    : (
      <div className="text-xs sm:text-sm text-gray-500 italic">
  No PO Copy uploaded yet.
</div>

    );
})()}


    {/* ✅ Upload Button — always visible */}
   <button
  onClick={async () => {
    const isArray = Array.isArray(order.poCopy);
    const title = isArray ? "Upload more PO Copies" : "Upload PO Copy";
    const multiple = isArray;

    const { value: files } = await Swal.fire({
      title,
      input: "file",
      inputAttributes: {
        accept: "application/pdf,image/*",
        multiple,
        "aria-label": "Upload PO Copy",
      },
      confirmButtonText: "Upload",
      showCancelButton: true,
    });

    if (files) {
      const selectedFiles = Array.from(
        files instanceof FileList ? files : [files]
      );
      const formData = new FormData();
      selectedFiles.forEach((f) => formData.append("poCopy", f));
      setUploadingPOCopy(true);

      try {
        await axiosInstance.post(
          `/files/upload/po-copy/${order._id}`,
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" },
          }
        );

        Swal.fire("✅ Uploaded!", "PO Copy uploaded successfully", "success");
        window.location.reload();
      } catch (err) {
        Swal.fire("❌ Error", "Failed to upload PO Copy", "error");
        console.error(err);
      } finally {
        setUploadingPOCopy(false);
      }
    }
  }}
  className="text-xs sm:text-sm text-gray-600 underline hover:text-red-600"
>
  📤 Upload PO Copy
</button>

  </div>
</td>






                                {/* ✅ Action Buttons */}
                               {role !== "production" &&
  role !== "dispatch" &&
  role !== "packaging" && (
    <td className="px-2 sm:px-4 py-2 text-[11px] sm:text-sm text-gray-800">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        <button
          className={`flex items-center gap-1 
                     px-2 py-1 sm:px-4 sm:py-1.5 
                     rounded-lg text-xs sm:text-sm 
                     shadow-md transition 
                     ${order.status === "completed" || order.status === "cancelled"
                       ? "bg-gray-400 cursor-not-allowed"
                       : "bg-yellow-500 hover:bg-yellow-600 text-white"
                     }`}
          onClick={() => order.status !== "completed" && order.status !== "cancelled" && setEditOrder(order)}
          disabled={order.status === "completed" || order.status === "cancelled"}
        >
          ✏️ Edit
        </button>

        <button
          className={`flex items-center gap-1 
                     px-2 py-1 sm:px-4 sm:py-1.5 
                     rounded-lg text-xs sm:text-sm 
                     shadow-md transition 
                     ${order.status === "completed" || order.status === "cancelled"
                       ? "bg-gray-400 cursor-not-allowed"
                       : "bg-red-500 hover:bg-red-600 text-white"
                     }`}
          onClick={() => order.status !== "completed" && order.status !== "cancelled" && handleDelete(order._id)}
          disabled={order.status === "completed" || order.status === "cancelled"}
        >
          🗑️ Delete
        </button>
        
        {/* Completed */}
        <button
          onClick={() => handleComplete(order._id)}
          className={`flex items-center gap-1 px-2 py-1 sm:px-4 sm:py-1.5 rounded-lg text-xs sm:text-sm shadow-md transition ${
            order.status === "completed" || order.status === "cancelled"
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-green-500 hover:bg-green-600 text-white"
          }`}
          disabled={order.status === "completed" || order.status === "cancelled"}
        >
          Mark Order Completed
        </button>

        {/* Cancelled */}
        <button
          onClick={() => handleCancel(order._id)}
          className={`flex items-center gap-1 px-2 py-1 sm:px-4 sm:py-1.5 rounded-lg text-xs sm:text-sm shadow-md transition ${
            order.status === "completed" || order.status === "cancelled"
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-red-500 hover:bg-red-600 text-white"
          }`}
          disabled={order.status === "completed" || order.status === "cancelled"}
        >
          Cancel Order
        </button>
      </div>
    </td>
  )}

                                {role !== "production" &&
                                  role !== "dispatch" &&
                                  role !== "sales" &&
                                  role !== "admin" &&
                                  role !== "packaging" && (
                                    <>
                                      {/* Section Checkboxes */}
                                      <td className="px-4 py-2 whitespace-nowrap">
                                        {sectionsList.map((section) => {
                                          const keyId = `${order._id}-${section.key}`;
const isSectionSent = (() => {
  // Check if this section is in the sentTo arrays
  const sentToProduction = order.sentTo?.production || [];
  const sentToDispatch = order.sentTo?.dispatch || [];
  
  // Determine which array to check based on section type
  const productionSections = ["preExpander", "danaBeads", "shapeMoulding", "cncSection"];
  const dispatchSections = ["sheetCutting", "shapePackaging"];
  
  if (productionSections.includes(section.key)) {
    return sentToProduction.includes(section.key);
  }
  
  if (dispatchSections.includes(section.key)) {
    return sentToDispatch.includes(section.key);
  }
  
  return false;
})();

                                          return (
                                            <label
                                              key={keyId}
                                              className="flex items-center gap-2"
                                            >
                                              <input
                                                type="radio"
                                                name={`section-${order._id}`} // Group radio buttons per order
                                                value={section.key}
                                                checked={
                                                  localSections[order._id]?.[
                                                    section.key
                                                  ] || false
                                                }
                                                onChange={() =>
                                                  handleSectionRadioChange(
                                                    order._id,
                                                    section.key
                                                  )
                                                }
                                              />
<>
  {section.label}
  {isSectionSent && (
    <span className="ml-1 text-green-600 text-xs font-semibold">✅ Sent</span>
  )}
</>
                                            </label>
                                          );
                                        })}
                                      </td>

                                      {/* Buttons Logic */}
        <td className="px-2 sm:px-4 py-2 text-[11px] sm:text-sm text-gray-800">
                                        {(() => {
                                          const stock = getStockForProduct(
                                            order.product
                                          );
                                          const requiredSections =
                                            order.requiredSections || {};
                                          const requiredKeys = Object.entries(
                                            requiredSections
                                          )
                                            .filter(([_, val]) => val)
                                            .map(([key]) => key);

                                          const sentToProduction =
                                            order.sentTo?.production || [];
                                          const sentToDispatch =
                                            order.sentTo?.dispatch || [];

                                          const alreadyDispatched =
                                            requiredKeys.every((section) =>
                                              sentToDispatch.includes(section)
                                            );

                                          const alreadySentToProduction =
                                            requiredKeys.every((section) =>
                                              sentToProduction.includes(section)
                                            );

                                          const isShapeOnly =
                                            requiredKeys.length === 1 &&
                                            requiredKeys.includes(
                                              "shapeMoulding"
                                            );

                                          // ✅ New Case: shape only + in stock => Send to Packaging
                                          if (
                                            isShapeOnly &&
                                            stock >= order.quantity
                                          ) {
                                            return (
                                              <button
                                                className="bg-purple-600 text-white px-2 py-1 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                                                disabled={
                                                  alreadyDispatched ||
                                                  disabledOrders[order._id]
                                                }
                                                onClick={async () => {
                                                  if (alreadyDispatched) {
                                                    Swal.fire({
                                                      icon: "info",
                                                      title: "Already Sent",
                                                      text: "This order has already been dispatched!",
                                                    });
                                                    return;
                                                  }

                                                  const result =
                                                    await swalWithTailwindButtons.fire(
                                                      {
                                                        title:
                                                          "Proceed to Packaging?",
                                                        text: "This shape moulding order is in stock. Fill packaging slip?",
                                                        icon: "question",
                                                        showCancelButton: true,
                                                        confirmButtonText:
                                                          "Yes!",
                                                        cancelButtonText:
                                                          "No, cancel!",
                                                        reverseButtons: true,
                                                        customClass: {
                                                          confirmButton:
                                                            "ml-2 px-4 py-2 bg-green-600 text-white rounded",
                                                          cancelButton:
                                                            "mr-2 px-4 py-2 bg-red-600 text-white rounded",
                                                        },
                                                      }
                                                    );

                                                  if (result.isConfirmed) {
                                                    setSlipType("packaging");
                                                    setSelectedOrder(order);
                                                    setSelectedSections(
                                                      order.requiredSections ||
                                                        {}
                                                    ); // new state
                                                    // ✅ Delay modal open to ensure state is set
                                                    setTimeout(() => {
                                                      setModalOpen(true);
                                                    }, 0);
                                                  }
                                                }}
                                              >
                                                📦 Send to Packaging
                                              </button>
                                            );
                                          }

                                          // Default: Dispatch (In Stock)
                                          if (stock >= order.quantity) {
                                            return (
                                              <button
                                                className="bg-green-600 text-white px-2 py-1 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                                                disabled={
                                                  alreadyDispatched ||
                                                  disabledOrders[order._id]
                                                }
                                                onClick={async () => {
                                                  if (alreadyDispatched) {
                                                    Swal.fire({
                                                      icon: "info",
                                                      title:
                                                        "Already Dispatched",
                                                      text: "This order has already been sent to dispatch!",
                                                    });
                                                    return;
                                                  }

                                                  const result =
                                                    await swalWithTailwindButtons.fire(
                                                      {
                                                        title: "Are you sure?",
                                                        text: "You want to send this order to Dispatch/Cutting!",
                                                        icon: "warning",
                                                        showCancelButton: true,
                                                        confirmButtonText:
                                                          "Yes!",
                                                        cancelButtonText:
                                                          "No, cancel!",
                                                        reverseButtons: true,
                                                        customClass: {
                                                          confirmButton:
                                                            "ml-2 px-4 py-2 bg-green-600 text-white rounded",
                                                          cancelButton:
                                                            "mr-2 px-4 py-2 bg-red-600 text-white rounded",
                                                        },
                                                      }
                                                    );

                                                  if (result.isConfirmed) {
                                                    const hasShapeMoulding =
                                                      order.requiredSections
                                                        ?.shapeMoulding;
                                                    setSlipType(
                                                      hasShapeMoulding
                                                        ? "packaging"
                                                        : "dispatch"
                                                    );
                                                    setSelectedOrder(order);
                                                    setTimeout(() => {
                                                      setModalOpen(true);
                                                    }, 0);
                                                  }
                                                }}
                                              >
                                                ✅ Dispatch (In Stock)
                                              </button>
                                            );
                                          }
const selectedKey = selectedRadioByOrder[order._id];

const isSectionSentToProduction = sentToProduction.includes(selectedKey);
const isSectionSentToDispatch = sentToDispatch.includes(selectedKey);

const isSectionAlreadySent =
  ["preExpander", "danaBeads", "shapeMoulding", "cncSection"].includes(selectedKey)
    ? isSectionSentToProduction
    : isSectionSentToDispatch;

                                          // Default: Send to Production
                                          return (
                                             <button
                                              className="bg-blue-500 text-white px-2 py-1 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                                              disabled={isSectionAlreadySent}

                                             onClick={async () => {
if (isSectionAlreadySent) {
  Swal.fire({
    icon: "info",
    title: "Already Sent",
    text: `This section (${selectedKey}) has already been sent.`,
  });
  return;
}



  const result = await swalWithTailwindButtons.fire({
    title: "Are you sure?",
    text: "You want to send this order to Production!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Yes!",
    cancelButtonText: "No, cancel!",
    reverseButtons: true,
    customClass: {
      confirmButton: "ml-2 px-4 py-2 bg-green-600 text-white rounded",
      cancelButton: "mr-2 px-4 py-2 bg-red-600 text-white rounded",
    },
  });

  if (result.isConfirmed) {
    const selectedKey = selectedRadioByOrder[order._id];

    // ✅ Rebuild selectedSections from selectedKey
    const oneSelected = sectionsList.reduce((acc, curr) => {
      acc[curr.key] = curr.key === selectedKey;
      return acc;
    }, {});

    
    // ✅ Set slip type
   setSlipType(sectionToSlipType[selectedKey] || "production");


    // ✅ Set correct section state and open modal
    setSelectedOrder(order);
    setSelectedSections(oneSelected);
    setTimeout(() => {
      setModalOpen(true);
    }, 0);
  }
}}



                                                
                                              
                                            > {isSectionAlreadySent ? "✅ Sent" : "🏭 Send to Production"}

                                            </button>
                                          );
                                        })()}
                                      </td>
                                    </>
                                  )}

                                {/* ✅ Status */}
        <td className="px-2 sm:px-4 py-2 text-[11px] sm:text-sm text-gray-800">
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={`w-3 h-3 rounded-full ${
                                        order.status?.toLowerCase() ===
                                        "pending"
                                          ? "bg-orange-500"
                                          : order.status?.toLowerCase() ===
                                            "in process"
                                          ? "bg-yellow-500"
                                          : order.status?.toLowerCase() ===
                                            "processed"
                                          ? "bg-green-500"
                                          : "bg-green-500"
                                      }`}
                                    ></span>

                                    <span className="capitalize">
                                      {(order.dispatchStatus === "dispatched" ||
                                        order.dispatchStatus ===
                                          "ready to dispatch") &&
                                      order.status === "pending"
                                        ? "Direct To Dispatch"
                                        : order.status}
                                    </span>
                                  </div>
                                </td>
       <td className="px-2 sm:px-4 py-2 text-[11px] sm:text-sm text-gray-800">
  <div className="flex items-center gap-2">
    <span
      className={`w-3 h-3 rounded-full ${
        order.status?.toLowerCase() === "completed" ||
        order.packagingStatus?.toLowerCase() === "packaged"
          ? "bg-green-500"
          : order.packagingStatus?.toLowerCase() === "unpackaged"
          ? "bg-orange-500"
          : "bg-gray-400"
      }`}
    ></span>
    <span className="capitalize">
      {order.status?.toLowerCase() === "completed" 
        ? "packaged" 
        : (order.dispatchStatus === "dispatched" ||
          order.dispatchStatus === "ready to dispatch") &&
          order.packagingStatus === "unpackaged"
        ? "packaged"
        : order.packagingStatus}
    </span>
  </div>
</td>
       <td className="px-2 sm:px-4 py-2 text-[11px] sm:text-sm text-gray-800">
  <div className="flex items-center gap-2">
    <span
      className={`w-3 h-3 rounded-full ${
        order.status?.toLowerCase() === "completed" ||
        order.dispatchStatus?.toLowerCase() === "dispatched"
          ? "bg-green-500"
          : order.dispatchStatus?.toLowerCase() === "ready to dispatch"
          ? "bg-yellow-500"
          : order.dispatchStatus?.toLowerCase() === "not dispatched"
          ? "bg-orange-500"
          : "bg-gray-400"
      }`}
    ></span>
    <span className="capitalize">
      {order.status?.toLowerCase() === "completed" 
        ? "dispatched" 
        : order.dispatchStatus || "Unknown"}
    </span>
  </div>
</td>
                               

                              </tr>
                            );
                          }
                    )}
                  </tbody>
                </table>
                {activeProductImage && (
                  <div
                    className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center p-6"
                    onClick={() => setActiveProductImage(null)}
                  >
                    <div
                      className="bg-white rounded-lg p-4 max-w-4xl w-full overflow-y-auto max-h-[90vh] relative"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => setActiveProductImage(null)}
                        className="absolute top-2 right-3 text-2xl font-bold text-red-500 hover:text-red-700"
                      >
                        ✖
                      </button>
                      <h2 className="text-lg font-semibold mb-4">
                        {activeProductImage.name} - Images
                      </h2>
                      {activeProductImage.images.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {activeProductImage.images.map((img, i) => (
                            <img
                              key={i}
                              src={
                                img.startsWith("http")
                                  ? img
                                  : `${
                                      import.meta.env.VITE_REACT_APP_API_URL
                                    }${img}`
                              }
                              alt={`Image ${i + 1}`}
                              className="w-full h-48 object-cover rounded border"
                            />
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500">No images available.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        {/* Pagination Controls */}
        {filteredOrders?.length > 0 && (
          <div className="overflow-x-auto w-full">
            <div className="flex justify-center items-center gap-2 mt-8 px-4 min-w-max">
              {/* Prev Button */}
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 
          ${
            currentPage === 1
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-blue-500 hover:bg-blue-600 text-white shadow-lg"
          }`}
              >
                ⏮ Prev
              </button>

              {/* Page Numbers */}
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`px-4 py-2 rounded-full transition-all duration-300 font-semibold text-sm
            ${
              currentPage === i + 1
                ? "bg-blue-500 hover:bg-blue-600 text-white shadow-lg scale-110"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
                >
                  {i + 1}
                </button>
              ))}

              {/* Next Button */}
              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 
          ${
            currentPage === totalPages
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-blue-500 hover:bg-blue-600 text-white shadow-lg"
          }`}
              >
                Next ⏭
              </button>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {editOrder && (
          <EditModal
            order={editOrder}
            onSave={handleSaveEdit}
            onClose={() => setEditOrder(null)}
          />
        )}
      </div>
      <SlipFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSlipSubmit}
        type={slipType}
        selectedOrder={selectedOrder}
        selectedSections={selectedSections}
      />
    </div>
  );
}

function EditModal({ order, onSave, onClose }) {
  const [updatedOrder, setUpdatedOrder] = useState({
    quantity: order.quantity,
    price: order.price,
    freight: order.freight || "",
    freightAmount: order.freightAmount || "",
    product: order.product,
    density: order.density,
    packagingCharge: order.packagingCharge || "",
    paymentTerms: order.paymentTerms || "",
    remarks: order.remarks || "",
    billTo: order.billTo || "",
    shipTo: order.shipTo || "",
    size: order.size || "",
    unit: order.unit || "pcs",
    date: order.date ? new Date(order.date).toISOString().split("T")[0] : "",
  });

  const [allProducts, setAllProducts] = useState([]);

  useEffect(() => {
    gsap.from(".modal-content", { opacity: 0, y: -50, duration: 0.5 });
    axiosInstance
      .get("/products/all-backend-products")
      .then((res) => setAllProducts(res.data))
      .catch(console.error);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUpdatedOrder((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    await onSave(order._id, updatedOrder);
    onClose();
    toast.success("Order updated successfully!");
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 bg-opacity-50 flex justify-center items-center z-50 overflow-y-auto">
      <div className="modal-content bg-white p-6 rounded-lg shadow-lg max-w-3xl w-full my-10 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">Edit Order</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* All Editable Fields */}
          <Input label="Quantity" name="quantity" value={updatedOrder.quantity} onChange={handleChange} />
          <Input label="Price" name="price" value={updatedOrder.price} onChange={handleChange} />
          <Input label="Freight" name="freight" value={updatedOrder.freight} onChange={handleChange} />
          <Input label="Freight Amount" name="freightAmount" value={updatedOrder.freightAmount} onChange={handleChange} />
          <Input label="Density" name="density" value={updatedOrder.density} onChange={handleChange} />
          <Input label="Packaging Charge" name="packagingCharge" value={updatedOrder.packagingCharge} onChange={handleChange} />
          <Input label="Size" name="size" value={updatedOrder.size} onChange={handleChange} />
          <Input label="Unit" name="unit" value={updatedOrder.unit} onChange={handleChange} />
          <Input label="Bill To" name="billTo" value={updatedOrder.billTo} onChange={handleChange} />
          <Input label="Ship To" name="shipTo" value={updatedOrder.shipTo} onChange={handleChange} />
          <Input label="Remarks" name="remarks" value={updatedOrder.remarks} onChange={handleChange} />
          <Input label="Date" name="date" type="date" value={updatedOrder.date} onChange={handleChange} />
          
          {/* Product Dropdown */}
          <div>
            <label className="block mb-1 font-semibold">Product</label>
            <select name="product" value={updatedOrder.product} onChange={handleChange}
              className="border border-gray-300 p-3 rounded-lg w-full">
              <option value="">Select Product</option>
              {allProducts.map((p) => (
                <option key={p._id} value={p.name}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Payment Terms Dropdown */}
          <div>
            <label className="block mb-1 font-semibold">Payment Terms</label>
            <select name="paymentTerms" value={updatedOrder.paymentTerms} onChange={handleChange}
              className="border border-gray-300 p-3 rounded-lg w-full">
              <option value="">Select Option</option>
              <option value="Advance">Advance</option>
              <option value="Credit">Credit</option>
              <option value="Partial">Partial</option>
              <option value="Cash on Delivery">Cash on Delivery</option>
            </select>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end space-x-3 mt-6">
          <button className="bg-yellow-400 hover:bg-yellow-500 text-black px-6 py-3 rounded-lg" onClick={onClose}>
            ❌ Cancel
          </button>
          <button className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg" onClick={handleSave}>
            📑 Save
          </button>
        </div>
      </div>
    </div>
  );
}

const Input = ({ label, name, value, onChange, type = "text" }) => (
  <div>
    <label className="block mb-1 font-semibold">{label}</label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      className="border border-gray-300 p-3 rounded-lg w-full"
    />
  </div>
);

