import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { gsap } from "gsap";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import InternalNavbar from "../components/InternalNavbar";
import toast from "react-hot-toast";
import axiosInstance from "../axiosInstance.js";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import SlipFormModal from "../components/SlipFormModal.jsx";
import { useUserContext } from "../context/UserContext.jsx";
// Import optimized components
import OrderTable from "../components/OrderTable/OrderTable";
import OrderFilters from "../components/OrderFilters/OrderFilters";
import OrderPagination from "../components/OrderPagination/OrderPagination";
import { useOrders } from "../components/hooks/useOrders.js";
import { useOrderActions } from "../components/hooks/useOrderActions";
import { useOrderData } from "../components/hooks/useOrderData.js";
import EditModal from "../components/EditModal";
import ProductImageModal from "../components/ProductImageModal";
import '../index.css'
// Helper components
const UploadingOverlay = () => (
  <div className="fixed inset-0 bg-[#000000af] bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white px-6 py-4 rounded-md shadow-md flex flex-col items-center gap-3">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
      <p className="text-gray-700">Uploading PO Copy...</p>
    </div>
  </div>
);

const BackButton = ({ navigate }) => (
  <button
    className="absolute hidden md:block cursor-pointer left-4 bg-blue-500 text-white px-4 py-2 rounded-md shadow-md hover:bg-blue-600 back-button"
    onClick={() => navigate(-1)}
  >
    ↩️ Back
  </button>
);

const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-120">
    <div className="flex flex-col items-center gap-4">
      <div className="w-16 h-16 border-4 border-purple-300 border-t-[#355DFC] rounded-full animate-spin"></div>
      <p className="text-[#355DFC] font-medium">Loading orders...</p>
    </div>
  </div>
);

const NoOrdersMessage = () => (
  <h1 className="text-center font-bold text-2xl text-gray-600">
    No orders found!
  </h1>
);

export default function OrdersList() {
  const { shouldRefetchOrders, setShouldRefetchOrders } = useUserContext();
  const navigate = useNavigate();
  const location = useLocation();
  const tableContainerRef = useRef(null);

  const token = localStorage.getItem("token");
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");
  const [statusFilter, setStatusFilter] = useState("");
  const [dispatchStatusFilter, setDispatchStatusFilter] = useState("");
  
  const [filters, setFilters] = useState({
    employeeId: "",
    startDate: "",
    endDate: "",
        customerName: "", // ✅ ADD THIS for customer filtering
  });

  // State variables
  const [editOrder, setEditOrder] = useState(null);
  const [selectedRadioByOrder, setSelectedRadioByOrder] = useState({});
  const [localSections, setLocalSections] = useState({});
  const [disabledOrders, setDisabledOrders] = useState({});
  const [modalOpen, setModalOpen] = useState(false);
  const [slipType, setSlipType] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [activeProductImage, setActiveProductImage] = useState(null);
  const [selectedSections, setSelectedSections] = useState({});
  const [resolvedPOUrls, setResolvedPOUrls] = useState({});

  // Custom hooks - Now only loads current page data
  const { 
    orders, // Only current page orders (20 items)
    loading, 
    totalPages, 
    ordersFetched, 
    refetchOrders,
    setOrders
  } = useOrders(token, currentPage, filters, searchTerm, sortOrder, statusFilter, dispatchStatusFilter);

  const {
    uploadingPOCopy,
    setUploadingPOCopy,
    handleDelete,
    handleSaveEdit,
    handleComplete,
    handleCancel
  } = useOrderActions(token, setOrders, refetchOrders);

  const {
    products,
    employees,
    customers,
    role,
    getCustomerPhone,
    getStockForProduct,
  } = useOrderData(token);

  // Memoized values - Now works with only current page data
  const sortedOrders = useMemo(() => {
    return [...orders].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
  }, [orders]);

  const sectionsList = useMemo(() => [
    { key: "preExpander", label: "EPS/Thermocol Block Molding Production Section" },
    { key: "danaBeads", label: "EPS/Thermocol Dana/Beads Production Section" },
    { key: "shapeMoulding", label: "EPS/Thermocol Shape Molding Production Section" },
    { key: "sheetCutting", label: "EPS/Thermocol Sheet Cutting & Dispatch Section" },
    { key: "shapePackaging", label: "EPS/Thermocol Shape Molding Packaging & Dispatch Section" },
    { key: "cncSection", label: "EPS/Thermocol CNC Hot Wire/CNC Router" },
  ], []);

  const sectionToSlipType = useMemo(() => ({
    preExpander: "dana",
    danaBeads: "dana-beads",
    shapeMoulding: "production",
    sheetCutting: "dispatch",
    shapePackaging: "packaging",
    cncSection: "cnc-slip",
  }), []);

  const swalWithTailwindButtons = Swal.mixin({
    customClass: {
      confirmButton: "px-6 py-2 bg-blue-500 text-white font-semibold rounded-md hover:bg-blue-600",
      cancelButton: "px-6 py-2 bg-red-500 text-white font-semibold rounded-md hover:bg-red-600",
    },
    buttonsStyling: false,
  });

  // Effects
  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
  }, [token, navigate]);

    // Add this useEffect to handle navigation with customer name
  useEffect(() => {
    // Check if we're coming from customer list with customer name
    const searchParams = new URLSearchParams(location.search);
    const customerNameFromUrl = searchParams.get('customer');
    
    if (customerNameFromUrl) {
      setFilters(prev => ({
        ...prev,
        customerName: customerNameFromUrl
      }));
      // setSearchTerm(customerNameFromUrl); // Also set in search for better UX
    }
  }, [location.search]);

  useEffect(() => {
    if (shouldRefetchOrders) {
      refetchOrders(currentPage); // Refetch current page
      setShouldRefetchOrders(false);
    }
  }, [shouldRefetchOrders, refetchOrders, setShouldRefetchOrders, currentPage]);

  useEffect(() => {
    const initialSections = {};
    orders.forEach((order) => {
      initialSections[order._id] = { ...order.requiredSections };
    });
    setLocalSections(initialSections);
  }, [orders]);

  // Check URL existence for PO copies
  const checkIfUrlExists = useCallback(async (url) => {
    try {
      const res = await fetch(url, { method: "HEAD" });
      return res.ok;
    } catch (err) {
      console.error("URL check failed:", err);
      return false;
    }
  }, []);

  // Resolve PO Copy URLs - Only for current page orders
  useEffect(() => {
    const resolveAllPOCopyUrls = async () => {
      const result = {};

      for (const order of orders) { // Now only processes current page orders
        const poCopyList = Array.isArray(order.poCopy)
          ? order.poCopy
          : order.poCopy
          ? [order.poCopy]
          : [];

        result[order._id] = [];

        for (const fileUrl of poCopyList) {
          let url = fileUrl;

          if (
            fileUrl.toLowerCase().includes(".pdf") &&
            fileUrl.includes("/image/")
          ) {
            const testRawUrl = fileUrl.replace("/image/", "/raw/");
            const exists = await checkIfUrlExists(testRawUrl);
            if (exists) url = testRawUrl;
          }

          result[order._id].push(url);
        }
      }

      setResolvedPOUrls(result);
    };

    if (orders.length) {
      resolveAllPOCopyUrls();
    }
  }, [orders, checkIfUrlExists]);

  // Animation effects
  useEffect(() => {
    if (ordersFetched && orders.length > 0) {
      gsap.from(".order-table", {
        opacity: 0,
        y: 50,
        duration: 1,
        ease: "power3.out",
        clearProps: "all",
      });
      gsap.from(".order-row", {
        opacity: 0,
        y: 20,
        stagger: 0.1,
        duration: 1,
        ease: "power3.out",
        clearProps: "all",
      });
    }
  }, [ordersFetched, orders]);

  // Clear search when customer filter is applied to avoid conflicts
useEffect(() => {
  if (filters.customerName && searchTerm === filters.customerName) {
    setSearchTerm(""); // Clear search if it matches the customer name
  }
}, [filters.customerName, searchTerm]);
  // Auto-complete orders - Only for current page
// In the auto-complete useEffect, update the condition to check remainingBalance:
useEffect(() => {
  const checkAndCompleteOrders = async () => {
    for (const order of orders) {
      const isProductionComplete = order.status?.toLowerCase() === "processed";
      const isPackagingComplete = order.packagingStatus?.toLowerCase() === "packaged";
      const isDispatchComplete = order.dispatchStatus?.toLowerCase() === "dispatched";
      const isNotCompleted = order.status?.toLowerCase() !== "completed";
      const isFullyDelivered = (order.remainingBalance || order.quantity) === 0;  // ADD THIS
      
      if (isProductionComplete && isPackagingComplete && isDispatchComplete && isNotCompleted && isFullyDelivered) {  // MODIFIED THIS LINE
        try {
          await axiosInstance.put(
            `/orders/${order._id}`,
            {
              status: "completed",
              danaBeadsStatus: "completed",
            },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          
          setOrders(prev =>
            prev.map(o =>
              o._id === order._id
                ? {
                    ...o,
                    status: "completed",
                    danaBeadsStatus: "completed",
                  }
                : o
            )
          );
          
        } catch (err) {
          console.error("Failed to auto-complete order:", err);
        }
      }
    }
  };

  if (orders.length > 0) {
    checkAndCompleteOrders();
  }
}, [orders, token, setOrders]);

  // Add this useEffect after your other useEffect hooks
useEffect(() => {
  // When customer filter is applied, automatically reset status filter to show all orders
  if (filters.customerName) {
    setStatusFilter(""); // Reset status filter to show all (pending, in process, processed, completed)
  }
}, [filters.customerName]);

// Add this useEffect after your other useEffect hooks
useEffect(() => {
  // When customer filter is applied, automatically reset status filter to show all orders
  if (filters.customerName) {
    setStatusFilter(""); // Reset status filter to show all (pending, in process, processed, completed)
  }
}, [filters.customerName]);

// In OrdersList.jsx - Replace the existing exportToExcel function

const exportToExcel = useCallback(async () => {
  try {
    toast.loading("Preparing export...", { id: "export" });
    
    // For export, get all data without pagination
    const params = {
      limit: 10000, // Large limit for export
      page: 1,
      ...filters,
      search: searchTerm,
      sort: sortOrder,
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

    const orders = res.data.orders;
    
    // Prepare data for Excel
    const data = [];
    
    for (const order of orders) {
      // Check if multi-product order
      const hasMultipleProducts = order.products && order.products.length > 0;
      
      if (hasMultipleProducts) {
        // For multi-product orders, create a separate row for each product
        for (const product of order.products) {
          data.push({
            "Order ID": order.shortId,
            "Short ID": order.shortId,
            "Order Date": new Date(order.createdAt).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            }),
            "Customer Name": order.customerName || order.customer?.name || "",
            "Customer Phone": order.customer?.phone || "",
            "PO Number": order.po,
            "Product Name": product.productName,
            "Size": product.size || "",
            "Quantity": product.quantity,
            "Delivered Quantity": product.deliveredQuantity || 0,
            "Remaining Balance": (product.quantity || 0) - (product.deliveredQuantity || 0),
            "Basic Price": product.price,
            "Density": product.density || "",
            "Product Remarks": product.productRemarks || "",
            "Narration": product.narration || order.narration || "",
            "Total Order Quantity": order.products.reduce((sum, p) => sum + (parseInt(p.quantity) || 0), 0),
            "Total Delivered": order.products.reduce((sum, p) => sum + (p.deliveredQuantity || 0), 0),
            "Overall Balance": order.remainingBalance || 0,
            "Freight": order.freight,
            "Freight Amount": order.freightAmount,
            "Packaging Charge": order.packagingCharge,
            "Bill To": order.billTo || "",
            "Ship To": order.shipTo || "",
            "Payment Terms": order.paymentTerms || "",
            "Status": order.status,
            "Dispatch Status": order.dispatchStatus,
            "Packaging Status": order.packagingStatus,
            "Production Status": order.status,
            "Remarks": order.remarks || "",
            "Created At": new Date(order.createdAt).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            }),
            "Delivery Date": order.date ? new Date(order.date).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            }) : "",
            "Delivery Option": order.deliveryOption || "",
          });
        }
      } else {
        // For single product orders
        data.push({
          "Order ID": order.shortId,
          "Short ID": order.shortId,
          "Order Date": new Date(order.createdAt).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          }),
          "Customer Name": order.customerName || order.customer?.name || "",
          "Customer Phone": order.customer?.phone || "",
          "PO Number": order.po,
          "Product Name": order.product,
          "Size": order.size || "",
          "Quantity": order.quantity,
          "Delivered Quantity": order.deliveredQuantity || 0,
          "Remaining Balance": order.remainingBalance || (order.quantity - (order.deliveredQuantity || 0)),
          "Basic Price": order.price,
          "Density": order.density || "",
          "Product Remarks": order.productRemarks || "",
          "Narration": order.narration || "",
          "Total Order Quantity": order.quantity,
          "Total Delivered": order.deliveredQuantity || 0,
          "Overall Balance": order.remainingBalance || (order.quantity - (order.deliveredQuantity || 0)),
          "Freight": order.freight,
          "Freight Amount": order.freightAmount,
          "Packaging Charge": order.packagingCharge,
          "Bill To": order.billTo || "",
          "Ship To": order.shipTo || "",
          "Payment Terms": order.paymentTerms || "",
          "Status": order.status,
          "Dispatch Status": order.dispatchStatus,
          "Packaging Status": order.packagingStatus,
          "Production Status": order.status,
          "Remarks": order.remarks || "",
          "Created At": new Date(order.createdAt).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          }),
          "Delivery Date": order.date ? new Date(order.date).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          }) : "",
          "Delivery Option": order.deliveryOption || "",
        });
      }
    }

    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(data);
    
    // Auto-size columns (optional - sets approximate widths)
    const colWidths = [
      { wch: 12 }, // Order ID
      { wch: 12 }, // Short ID
      { wch: 12 }, // Order Date
      { wch: 25 }, // Customer Name
      { wch: 15 }, // Customer Phone
      { wch: 15 }, // PO Number
      { wch: 35 }, // Product Name
      { wch: 15 }, // Size
      { wch: 10 }, // Quantity
      { wch: 10 }, // Delivered Quantity
      { wch: 12 }, // Remaining Balance
      { wch: 12 }, // Basic Price
      { wch: 10 }, // Density
      { wch: 30 }, // Product Remarks
      { wch: 30 }, // Narration
      { wch: 12 }, // Total Order Quantity
      { wch: 12 }, // Total Delivered
      { wch: 12 }, // Overall Balance
      { wch: 12 }, // Freight
      { wch: 12 }, // Freight Amount
      { wch: 12 }, // Packaging Charge
      { wch: 30 }, // Bill To
      { wch: 30 }, // Ship To
      { wch: 20 }, // Payment Terms
      { wch: 15 }, // Status
      { wch: 15 }, // Dispatch Status
      { wch: 15 }, // Packaging Status
      { wch: 15 }, // Production Status
      { wch: 30 }, // Remarks
      { wch: 12 }, // Created At
      { wch: 12 }, // Delivery Date
      { wch: 15 }, // Delivery Option
    ];
    worksheet['!cols'] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Orders");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    
    const fileName = `orders_${new Date().toISOString().split('T')[0]}.xlsx`;
    saveAs(blob, fileName);
    
    toast.dismiss("export");
    toast.success(`Exported ${data.length} order items successfully!`);
  } catch (err) {
    console.error("Error exporting orders:", err);
    toast.dismiss("export");
    toast.error("Failed to export orders");
  }
}, [filters, searchTerm, sortOrder, statusFilter, dispatchStatusFilter, token]);

// Section radio change handler - NO REFETCH
const handleSectionRadioChange = useCallback(async (orderId, selectedKey) => {
  const updatedSections = {};

  sectionsList.forEach(({ key }) => {
    updatedSections[key] = key === selectedKey;
  });

  try {
    const { data: updatedOrder } = await axiosInstance.put(
      `/orders/${orderId}/sections`,
      { requiredSections: updatedSections }
    );

    // ✅ Update local state immediately - no refetch needed
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

    setSelectedRadioByOrder((prev) => ({
      ...prev,
      [orderId]: selectedKey,
    }));
        
  } catch (error) {
    console.error("Error updating section selection:", error);
    toast.error("Failed to update section selection");
  }
}, [sectionsList, setOrders]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, searchTerm, sortOrder, statusFilter, dispatchStatusFilter]);

useEffect(() => {
  const locationState = location.state;
  
  if (locationState?.scrollToOrderId && orders.length > 0 && !loading) {
    
    setTimeout(() => {
      const tableContainer = document.querySelector('.w-full.overflow-x-auto.mt-10');
      
      if (tableContainer) {
        // Since we have 30 columns total and column 26 is near the end
        // Scroll to show right side of table (section column is near the end)
        const totalWidth = tableContainer.scrollWidth;
        
        // Column 26 out of 30 columns = ~87% of the way
        const scrollPosition = totalWidth * 0.85;
                
        tableContainer.scrollTo({
          left: scrollPosition,
          behavior: 'smooth'
        });
        
        // Also try to find and highlight the specific section cell
        setTimeout(() => {
          const targetRow = document.querySelector(`[data-order-id="${locationState.scrollToOrderId}"]`);
          if (targetRow) {
            const cells = targetRow.querySelectorAll('td');
            if (cells[25]) {
              cells[25].style.backgroundColor = '#fff3cd';
              cells[25].style.border = '3px solid #ffc107';
              
              setTimeout(() => {
                cells[25].style.backgroundColor = '';
                cells[25].style.border = '';
              }, 3000);
            }
          }
        }, 800);
      }
    }, 1000);
    
    navigate(location.pathname, { replace: true, state: {} });
  }
}, [orders, location.state, navigate, loading]);

  // Filter change handler
  const handleFilterChange = useCallback((e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  }, []);

  // Clear all filters
  const handleClearFilters = useCallback(() => {
    setFilters({ employeeId: "", startDate: "", endDate: "", customerName: "" });
    setSearchTerm("");
    setSortOrder("newest");
    setStatusFilter("");
    setDispatchStatusFilter("");
    setCurrentPage(1);
  }, []);

  // Complex slip submission function
// In OrdersList.jsx - replace the dispatch case in handleSlipSubmit

const handleSlipSubmit = useCallback(async (payload) => {
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
          // ✅ Remove the actuallySendToProduction call
          // await actuallySendToProduction(selectedOrder._id, null, null, null, payload.danaFormData);
        }
      },

     production: async () => {
  if (selectedSections.shapeMoulding) {
    // ✅ Prepare the data properly for multi-product orders
    const shapeData = {
      orderId: selectedOrder._id,
      productName: payload.shapeFormData.productName,
      dryWeight: payload.shapeFormData.dryWeight,
      quantity: payload.shapeFormData.quantity,
      remarks: payload.shapeFormData.remarks,
      isMultiProduct: payload.shapeFormData.isMultiProduct,
      products: payload.shapeFormData.products,
    };
    
    console.log("📤 Submitting Production slip:", shapeData);
    
    await axiosInstance.post("/slips/production", shapeData);
  }
},
     dispatch: async () => {
        if (selectedSections.sheetCutting) {
          // ✅ Prepare the data properly for multi-product orders
          const cuttingData = {
            orderId: selectedOrder._id,
            isMultiProduct: payload.cuttingFormData?.isMultiProduct || false,
          };

          // ✅ If multi-product, send the products array
          if (payload.cuttingFormData?.isMultiProduct && payload.cuttingFormData?.products) {
            cuttingData.products = payload.cuttingFormData.products;
            cuttingData.overallRemarks = payload.cuttingFormData.remarks;
          } else {
            // Single product - use row format
            cuttingData.row = [{
              productName: payload.cuttingFormData.productName,
              size: payload.cuttingFormData.size,
              density: payload.cuttingFormData.density,
              quantity: payload.cuttingFormData.quantity,
              remarks: payload.cuttingFormData.remarks,
            }];
          }

          console.log("📤 Submitting Dispatch slip:", cuttingData);
          await axiosInstance.post("/slips/dispatch", cuttingData);
        }
      },

     packaging: async () => {
  if (selectedSections.shapePackaging) {
    // ✅ Prepare the data properly for multi-product orders
    const packagingData = {
      orderId: selectedOrder._id,
      productName: payload.packagingFormData.productName,
      packagingWeight: payload.packagingFormData.packagingWeight,
      packagingType: payload.packagingFormData.packagingType,
      quantity: payload.packagingFormData.quantity,
      remarks: payload.packagingFormData.remarks,
      isMultiProduct: payload.packagingFormData.isMultiProduct || false,
    };

    // ✅ If multi-product, send the products array
    if (payload.packagingFormData?.isMultiProduct && payload.packagingFormData?.products) {
      packagingData.products = payload.packagingFormData.products;
      packagingData.overallRemarks = payload.packagingFormData.remarks;
    }

    console.log("📤 Submitting Packaging slip:", packagingData);
    
    await axiosInstance.post("/slips/packaging", packagingData);
  }
},
        "cnc-slip": async () => {
    if (selectedSections.cncSection) {
      console.log("📤 Submitting CNC slip with payload:", payload.cncFormData);
      
      await axiosInstance.post("/slips/cnc", {
        orderId: selectedOrder._id,
        productName: payload.cncFormData.productName,
        drawingName: payload.cncFormData.drawingName,
        remarks: payload.cncFormData.remarks,
        drawingFiles: payload.cncFormData.drawingFiles || [],
        isMultiProduct: payload.cncFormData.isMultiProduct,
        products: payload.cncFormData.products,
      });
    }
  },
      
      "dana-beads": async () => {
        if (selectedSections.danaBeads) {
          console.log("📤 Submitting Dana/Beads slip with payload:", payload.danaBeadsFormData);
          
          await axiosInstance.post("/slips/dana-beads", {
            orderId: selectedOrder._id,
            productName: payload.danaBeadsFormData.productName,
            density: payload.danaBeadsFormData.density,
            quantity: payload.danaBeadsFormData.quantity,
            recycleDana: payload.danaBeadsFormData.recycleDana,
            nextGrade: payload.danaBeadsFormData.nextGrade,
            remarks: payload.danaBeadsFormData.remarks,
            isMultiProduct: payload.danaBeadsFormData.isMultiProduct,
            products: payload.danaBeadsFormData.products,
          });
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
    refetchOrders(); // Refresh the orders list
  } catch (err) {
    console.error("❌ Error submitting slip:", err);
    Swal.fire({
      icon: "error",
      title: "Error!",
      text: err.response?.data?.message || "Error submitting slip",
    });
  }
}, [selectedOrder, slipType, refetchOrders]);

  // Production sending functions
  const actuallySendToProduction = useCallback(async (
    orderId,
    shapeRowData,
    packagingFormData,
    cuttingFormData,
    danaFormData,
    danaBeadsFormData
  ) => {
    const danaBeadsRows = danaBeadsFormData
      ? [
          {
            productName: danaBeadsFormData.productName,
            density: danaBeadsFormData.density,
            quantity: danaBeadsFormData.quantity,
            recycleDana: danaBeadsFormData.recycleDana,
            nextGrade: danaBeadsFormData.nextGrade,
            remarks: danaBeadsFormData.remarks,
          },
        ]
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
  }, [orders, products]);

  const actuallySendToPackaging = useCallback(async (orderId, packagingFormData) => {
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
  }, [swalWithTailwindButtons]);

  const actuallySendToDispatch = useCallback(async (orderId, cuttingFormData) => {
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

    } catch (error) {
      console.error("Error sending to Dispatch:", error);
    }
  }, [orders, setOrders, swalWithTailwindButtons]);

  return (
    <div className="bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100" ref={tableContainerRef}>
      {uploadingPOCopy && <UploadingOverlay />}

      <InternalNavbar />
      
      <div className="max-w-7xl min-h-[100vh] mx-auto p-6 relative">
        <BackButton navigate={navigate} />
        
      <h2 className="md:text-4xl text-3xl font-extrabold mb-4 text-center text-gray-800">
  {filters.customerName 
    ? `All Orders for ${filters.customerName}` 
    : "View Pending Orders"
  }
</h2>

        <OrderFilters
          role={role}
          employees={employees}
          filters={filters}
          handleFilterChange={handleFilterChange}
            setFilters={setFilters} // ✅ ADD THIS LINE
          handleClearFilters={handleClearFilters}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          sortOrder={sortOrder}
          setSortOrder={setSortOrder}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          dispatchStatusFilter={dispatchStatusFilter}
          setDispatchStatusFilter={setDispatchStatusFilter}
          navigate={navigate}
          orders={orders}
          exportToExcel={exportToExcel}
        />

        {loading ? (
          <LoadingSpinner />
        ) : orders.length === 0 ? (
          <NoOrdersMessage />
        ) : (
                    <LoadingSpinner />
          // <OrderTable
          //   sortedOrders={sortedOrders}
          //   products={products}
          //   role={role}
          //   customers={customers}
          //   resolvedPOUrls={resolvedPOUrls}
          //   sectionsList={sectionsList}
          //   localSections={localSections}
          //   selectedRadioByOrder={selectedRadioByOrder}
          //   disabledOrders={disabledOrders}
          //   handleComplete={handleComplete}
          //   handleCancel={handleCancel}
          //   handleDelete={handleDelete}
          //   setEditOrder={setEditOrder}
          //   handleSectionRadioChange={handleSectionRadioChange}
          //   setActiveProductImage={setActiveProductImage}
          //   setSlipType={setSlipType}
          //   setSelectedOrder={setSelectedOrder}
          //   setSelectedSections={setSelectedSections}
          //   setModalOpen={setModalOpen}
          //   getStockForProduct={getStockForProduct}
          //   getCustomerPhone={getCustomerPhone}
          //   sectionToSlipType={sectionToSlipType}
          //   swalWithTailwindButtons={swalWithTailwindButtons}
          //     filters={filters}
          // />
        )}

        <OrderPagination
          currentPage={currentPage}
          totalPages={totalPages}
          setCurrentPage={setCurrentPage}
          hasOrders={orders.length > 0}
        />

        {editOrder && (
          <EditModal
            order={editOrder}
            onSave={handleSaveEdit}
            onClose={() => setEditOrder(null)}
          />
        )}

        {activeProductImage && (
          <ProductImageModal
            activeProductImage={activeProductImage}
            setActiveProductImage={setActiveProductImage}
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
        products={products}
      />
    </div>
  );
}