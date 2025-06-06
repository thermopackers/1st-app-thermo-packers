import React from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { gsap } from "gsap";
import InternalNavbar from "../components/InternalNavbar";
import toast from "react-hot-toast";
import axiosInstance from "../axiosInstance";
import Swal from "sweetalert2";
import "jspdf-autotable";
import SlipFormModal from "../components/SlipFormModal.jsx";

export default function OrdersList() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [expandedProductId, setExpandedProductId] = useState(null);
  const [orders, setOrders] = useState([]);
  const [editOrder, setEditOrder] = useState(null);
  const [totalPages, setTotalPages] = useState(1);
  const [employees, setEmployees] = useState([]);
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [filterLoading, setFilterLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [localSections, setLocalSections] = useState({});
  const [disabledOrders, setDisabledOrders] = useState({});
  const [modalOpen, setModalOpen] = useState(false);
  const [slipType, setSlipType] = useState(null); // 'production' or 'dispatch'
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [activeProductImage, setActiveProductImage] = useState(null);

  const [filters, setFilters] = useState({
    employeeId: "",
    startDate: "",
    endDate: "",
  });
  
  const sectionsList = [
    {
      key: "preExpander",
      label: "EPS/Thermocol Block Moulding",
    },
    { key: "shapeMoulding", label: "EPS/Thermocol Shape Moulding" },
   
  ];
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState("sales");
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [ordersFetched, setOrdersFetched] = useState(false);
const location = useLocation();

  const ordersPerPage = 8;
const groupOrdersByPO = (orders) => {
  return orders.reduce((groups, order) => {
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
  console.log("selectedSections", selectedSections);
 


const handleSlipSubmit = async (payload) => {
  try {
    if (!selectedOrder) return;

    console.log("🟡 Slip type:", slipType);
    console.log("🟡 Selected order ID:", selectedOrder._id);
    console.log("🟡 Full Payload:", payload);
    console.log("✅ shapeFormData:", payload.shapeFormData);
    console.log("✅ packagingFormData:", payload.packagingFormData);

    if (slipType === "production") {
  const hasShapeMoulding = selectedOrder?.requiredSections?.shapeMoulding;

  if (hasShapeMoulding) {
    // ✅ SHAPE MOULDING FLOW
    await axiosInstance.post("/slips/production", {
      ...payload.shapeFormData,
      orderId: selectedOrder._id,
    });

    await actuallySendToProduction(
      selectedOrder._id,
      payload.shapeFormData,
      null,
      payload.shapeFormData,
      payload.packagingFormData
    );

    // ✅ Send to Packaging Automatically
    await actuallySendToPackaging(selectedOrder._id, payload.packagingFormData);

  } else {
    // ✅ BLOCK MOULDING FLOW
    await axiosInstance.post("/slips/dana", {
      orderId: selectedOrder._id,
      productName: payload.shapeFormData.productName,
      rawMaterial: payload.shapeFormData.dryWeight,
      quantity: payload.shapeFormData.quantity,
      remarks: payload.shapeFormData.remarks,
    });

    await axiosInstance.post("/slips/dispatch", {
      orderId: selectedOrder._id,
      row: [payload.cuttingFormData],
    });

    await actuallySendToProduction(
      selectedOrder._id,
      {
        productName: payload.shapeFormData.productName,
        dryWeight: payload.shapeFormData.dryWeight,
        quantity: payload.shapeFormData.quantity,
        remarks: payload.shapeFormData.remarks,
      },
      null,
      payload.cuttingFormData,
      payload.shapeFormData
    );

    // ✅ Send to Dispatch Automatically
    await actuallySendToDispatch(selectedOrder._id, [payload.cuttingFormData]);
  }

  await Swal.fire({
    icon: "success",
    title: "Success!",
    text: "Production slip submitted successfully!",
  });

  setModalOpen(false);
  setSelectedOrder(null);
  return;
}


    let endpoint;
    let formToSave;

    if (slipType === "packaging") {
      endpoint = "/slips/packaging";
      formToSave = {
        ...payload.packagingFormData,
        orderId: selectedOrder._id,
      };
    } else if (slipType === "dispatch") {
      endpoint = "/slips/dispatch";

      formToSave = {
        orderId: selectedOrder._id,
        row: [payload.cuttingFormData],  // <-- important fix here
      };

      console.log("🔥 Dispatch cuttingFormData:", payload.cuttingFormData);
    } else if (slipType === "shape-packaging") {
      console.log("📦 Submitting shape-packaging forms...");

      await axiosInstance.post("/slips/production", {
        ...payload.shapeFormData,
        orderId: selectedOrder._id,
      });

      await axiosInstance.post("/slips/packaging", {
        ...payload.packagingFormData,
        orderId: selectedOrder._id,
      });

      await actuallySendToProduction(
        selectedOrder._id,
        payload.shapeFormData,
        null,
        payload.shapeFormData,
    payload.packagingFormData
      );
  await actuallySendToPackaging(selectedOrder._id, payload.packagingFormData);

      await Swal.fire({
        icon: "success",
        title: "Success!",
        text: "Shape and packaging slips submitted successfully!",
      });

      setModalOpen(false);
      setSelectedOrder(null);
      return;
    } else {
      console.warn("⚠️ Unsupported slip type:", slipType);
      return;
    }

    // Submit to dispatch or packaging
    console.log("📤 Submitting form to:", endpoint);
    console.log("📄 Form data being sent:", formToSave);

    await axiosInstance.post(endpoint, formToSave);

    if (slipType === "packaging") {
      await actuallySendToPackaging(selectedOrder._id, payload.packagingFormData);
    } else if (slipType === "dispatch") {
      await actuallySendToDispatch(selectedOrder._id, [payload.cuttingFormData]);
    }

    await Swal.fire({
      icon: "success",
      title: "Success!",
      text: `${slipType === "dispatch" ? "Dispatch" : "Packaging"} slip submitted successfully!`,
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
      search: searchTerm, // ✅ send to backend
    };

    let url = "/orders";
    if (decoded.role === "production") url = "/orders/production-dashboard";
    else if (decoded.role === "dispatch") url = "/orders/dispatch-dashboard";

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
  }, [filters, token,location,currentPage,searchTerm]);
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
      fetchOrders()
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
      CreatedAt: new Date(order.createdAt).toLocaleString(),
      OrderDate: new Date(order.date).toLocaleDateString(),
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


  const currentOrders = filteredOrders; // Already paginated from server

  console.log("currentOrders", currentOrders);
  const groupedOrders = groupOrdersByPO(currentOrders);

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
     // Call fetchOrders here to refresh the data
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

 const actuallySendToProduction = async (orderId, shapeRowData,packagingFormData, cuttingFormData) => {
 console.log("cuttocut😍",cuttingFormData);
 
  const freshOrder = orders.find((o) => o._id === orderId);
  if (!freshOrder) return;

  const selectedSections = Object.entries(freshOrder.requiredSections || {})
    .filter(([_, value]) => value)
    .map(([key]) => key);

  const product = products.find((p) => p.name === freshOrder.product);
  const stock = product ? product.quantity : 0;
  const remainingQuantity = Math.max(freshOrder.quantity - stock, 0);

  // ✅ Construct danaSlip from shapeRowData
  const danaSlip = {
    rawMaterial: shapeRowData.dryWeight,
    quantity: shapeRowData.quantity,
    remarks: shapeRowData.remarks,
  };

  // ✅ Construct dispatchSlip from cuttingFormData
  const dispatchSlip = {
    size: cuttingFormData.size,
    density: cuttingFormData.density,
    quantity: cuttingFormData.quantity,
    remarks: cuttingFormData.remarks,
  };

  try {
    const res = await axiosInstance.put(
      `/orders/send-to-production/${orderId}`,
      {
        sections: selectedSections,
        remainingToProduce: remainingQuantity,
        shapeRows: shapeRowData ? [shapeRowData] : [],
        cuttingRows: cuttingFormData ? [cuttingFormData] : [],
        packagingSlip: packagingFormData || null,
        danaSlip,
        dispatchSlip,
      }
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
  console.log("DISABLED ORDERS:", disabledOrders);

  return (
    <div className="bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100">
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
{(role === "sales" || role === "dispatch" || role === "packaging") && (
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
          <div className="w-full overflow-x-auto mt-10">
            <div className="min-w-full inline-block align-middle">
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
                <table className="order-table min-w-full divide-y divide-gray-200 table-auto text-sm">
                  <thead className="shadow-md bg-gray-200">
                    <tr>
                      <th className="px-4 py-2 text-left font-bold text-gray-700 uppercase tracking-wider">
                        Order Date
                      </th>
                      <th className="px-4 py-2 text-left font-bold text-gray-700 uppercase tracking-wider">
                        Order ID
                      </th>
                      <th className="px-4 py-2 text-left font-bold text-gray-700 uppercase tracking-wider">
                        Client Name
                      </th>
                      <th className="px-4 py-2 text-left font-bold text-gray-700 uppercase tracking-wider">
                        Product Name
                      </th>
                      <th className="px-4 py-2 text-left font-bold text-gray-700 uppercase tracking-wider">
                        Size
                      </th>
                      <th className="px-4 py-2 text-left font-bold text-gray-700 uppercase tracking-wider">
                        Qty
                      </th>
                      <th className="px-4 py-2 text-left font-bold text-gray-700 uppercase tracking-wider">
                        Stock
                      </th>
                      <th className="px-4 py-2 text-left font-bold text-gray-700 uppercase tracking-wider">
                        Remaining to Produce
                      </th>
                      <th className="px-4 py-2 text-left font-bold text-gray-700 uppercase tracking-wider">
                        Price
                      </th>
                      <th className="px-4 py-2 text-left font-bold text-gray-700 uppercase tracking-wider">
                        Density
                      </th>
                      <th className="px-4 py-2 text-left font-bold text-gray-700 uppercase tracking-wider">
                        Packaging Charge
                      </th>
                      <th className="px-4 py-2 text-left font-bold text-gray-700 uppercase tracking-wider">
                        P/O
                      </th>
                      <th className="px-4 py-2 text-left font-bold text-gray-700 uppercase tracking-wider">
                        Freight
                      </th>
                      <th className="px-4 py-2 text-left font-bold text-gray-700 uppercase tracking-wider min-w-[160px]">
                        Dispatch Time
                      </th>
                      <th className="px-4 py-2 text-left font-bold text-gray-700 uppercase tracking-wider min-w-[120px]">
                        PO Copy
                      </th>
                      {role !== "production" &&
                        role !== "dispatch" &&
                        role !== "packaging" && (
                          <th className="px-4 py-2 text-left font-bold text-gray-700 uppercase tracking-wider">
                            Actions
                          </th>
                        )}
                      {role !== "production" &&
                        role !== "dispatch" &&
                        role !== "sales" &&
                        role !== "admin" &&
                        role !== "packaging" && (
                          <>
                            <th className="px-4 py-2 text-left font-bold text-gray-700 uppercase tracking-wider">
                              Section
                            </th>
                            <th className="px-4 py-2 text-left font-bold text-gray-700 uppercase tracking-wider">
                              Actions
                            </th>
                          </>
                        )}
                      <th className="px-4 py-2 text-left font-bold text-gray-700 uppercase tracking-wider">
                        Production Status
                      </th>
                      <th className="px-4 py-2 text-left font-bold text-gray-700 uppercase tracking-wider">
                        Packaging Status
                      </th>
                      {/* {role !== "dispatch" && ( */}
                        <th className="px-4 py-2 text-left font-bold text-gray-700 uppercase tracking-wider">
                          Dispatch Status
                        </th>
                      {/* )} */}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200 capitalize">
                    {Object.entries(groupOrdersByPO(currentOrders)).map(([poNumber, poOrders], index) => (
  <React.Fragment key={poNumber}>
    <tr className={`${index % 2 === 0 ? 'bg-blue-100' : 'bg-purple-100'} text-left`}>
      <td colSpan="100%" className="px-4 py-2 font-bold text-gray-800">
        📄 <strong>PO:</strong> {poNumber} — {poOrders.length} order{poOrders.length > 1 ? "s" : ""}
      </td>
    </tr>

    {poOrders.map((order) => {
      const isSent =
        order.packagingSlip || order.cuttingSlip || order.shapeSlip || order.danaSlip;
const productKey = order.product.toLowerCase();
      return (
         <tr key={order._id} className="order-row">
                          <td className="px-4 py-2 text-sm text-gray-800">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-800">
                            {order.shortId}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap">
                            {order.customerName}
                          </td>
                          
                          
                         <td
  className="px-4 py-2 text-blue-600 underline cursor-pointer"
  onClick={() => {
    const product = products.find((p) => p.name === order.product);
    if (product?.images?.length > 0) {
      setActiveProductImage({
        name: product.name,
        images: product.images,
      });
    }
  }}
>
  {order.product}
</td>


                          <td className="px-4 py-2 whitespace-nowrap">
                            {order.size ? order.size : "N/A"}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap">
                            {order.quantity}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap">
                            {getStockForProduct(order.product)}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap font-bold bg-red-200">
                            {Math.max(
                              order.quantity -
                                getStockForProduct(order.product),
                              0
                            )}
                          </td>

                          <td className="px-4 py-2 whitespace-nowrap">
                            ₹{order.price}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap">
                            {order.density}kg/m<sup>3</sup>
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap">
                            ₹{order.packagingCharge}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap">
                            {order.po}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap">
                            {`${order.freight}: ₹${order.freightAmount}`}
                          </td>

                          {/* ✅ Dispatch Date */}
                          <td className="px-4 py-2 whitespace-nowrap max-w-[160px] truncate">
                            {(() => {
                              if (!order.date) return "N/A";

                              const today = new Date();
                              const deliveryDate = new Date(order.date);

                              // Set both dates to midnight to ignore the time portion
                              today.setHours(0, 0, 0, 0);
                              deliveryDate.setHours(0, 0, 0, 0);

                              const diffDays = Math.ceil(
                                (deliveryDate - today) / (1000 * 60 * 60 * 24)
                              );

                              // Compare the days difference
                              if (diffDays <= 7) return "Within 1 Week";
                              if (diffDays <= 14) return "Within 2 Weeks";
                              if (diffDays <= 20) return "Within 20 Days";

                              // If no match, return the date in the required format
                              return deliveryDate.toLocaleDateString("en-IN", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              });
                            })()}
                          </td>

                          {/* ✅ PO Copy */}
                          <td className="px-4 py-2 whitespace-nowrap max-w-[120px]">
                            {order.poCopy ? (
                              <a
                                href={`${
                                  process.env.NODE_ENV === "production"
                                    ? `${window.location.origin}/api/files/download/${order._id}`
                                    : `http://localhost:3001/api/files/download/${order._id}`
                                }`}
                                className="text-blue-600 underline hover:text-blue-800 block truncate"
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                📥 Save
                              </a>
                            ) : (
                              "-"
                            )}
                          </td>

                          {/* ✅ Action Buttons */}
                          {role !== "production" &&
                            role !== "dispatch" &&
                            role !== "packaging" && (
                              <td className="px-4 py-2 whitespace-nowrap">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                 <button
  className={`flex items-center gap-1 px-4 py-1.5 rounded-lg text-sm shadow-md transition 
    ${isSent
      ? "bg-gray-400 text-white cursor-not-allowed"
      : "bg-yellow-500 hover:bg-yellow-600 text-white cursor-pointer"}
  `}
  disabled={isSent}
  onClick={() => {
    if (isSent) return;
    setEditOrder(order);
  }}
>
  ✏️ Edit
</button>

                                  <button
                                    className="flex cursor-pointer items-center gap-1 bg-red-500 hover:bg-red-600 text-white px-4 py-1.5 rounded-lg text-sm shadow-md transition"
                                    onClick={() => handleDelete(order._id)}
                                  >
                                    🗑️ Delete
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

  return (
    <label key={keyId} className="flex items-center gap-2">
      <input
        type="radio"
        name={`section-${order._id}`} // Group radio buttons per order
        value={section.key}
        checked={localSections[order._id]?.[section.key] || false}
        disabled={!!disabledOrders[order._id]}
        onChange={() => handleSectionRadioChange(order._id, section.key)}
      />
      {section.label}
    </label>
  );
})}

                                </td>

                                {/* Buttons Logic */}
                                <td className="p-2 flex md:flex-col gap-2">
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
                                      requiredKeys.includes("shapeMoulding");

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
                                                  confirmButtonText: "Yes!",
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
                                                order.requiredSections || {}
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
                                                title: "Already Dispatched",
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
                                                  confirmButtonText: "Yes!",
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
                                              setModalOpen(true);
                                            }
                                          }}
                                        >
                                          ✅ Dispatch (In Stock)
                                        </button>
                                      );
                                    }

                                    // Default: Send to Production
                                    return (
                                      <button
                                        className="bg-blue-500 text-white px-2 py-1 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                                        disabled={
                                          alreadySentToProduction ||
                                          alreadyDispatched ||
                                          disabledOrders[order._id]
                                        }
                                        onClick={async () => {
                                          if (alreadySentToProduction) {
                                            Swal.fire({
                                              icon: "info",
                                              title: "Already Sent",
                                              text: "This order has already been sent to production!",
                                            });
                                            return;
                                          }

                                          if (alreadyDispatched) {
                                            Swal.fire({
                                              icon: "info",
                                              title: "Already Dispatched",
                                              text: "You cannot send to production after dispatch!",
                                            });
                                            return;
                                          }

                                          const result =
                                            await swalWithTailwindButtons.fire({
                                              title: "Are you sure?",
                                              text: "You want to send this order to Production!",
                                              icon: "warning",
                                              showCancelButton: true,
                                              confirmButtonText: "Yes!",
                                              cancelButtonText: "No, cancel!",
                                              reverseButtons: true,
                                              customClass: {
                                                confirmButton:
                                                  "ml-2 px-4 py-2 bg-green-600 text-white rounded",
                                                cancelButton:
                                                  "mr-2 px-4 py-2 bg-red-600 text-white rounded",
                                              },
                                            });

                                          const isShapeOnly =
                                            order.requiredSections
                                              ?.shapeMoulding &&
                                            !order.requiredSections
                                              ?.preExpander &&
                                            !order.requiredSections
                                              ?.handMoulding &&
                                            !order.requiredSections?.cncSection;

                                          if (result.isConfirmed) {
                                            const slipTypeToSet = isShapeOnly
                                              ? "shape-packaging"
                                              : "production";
                                            setSlipType(slipTypeToSet);
                                            setSelectedOrder(order);
                                            setSelectedSections(
                                              order.requiredSections || {}
                                            ); // ✅ CRITICAL LINE
                                            setModalOpen(true);
                                          }
                                        }}
                                      >
                                        🏭 Send to Production
                                      </button>
                                    );
                                  })()}
                                </td>
                              </>
                            )}

                          {/* ✅ Status */}
                          <td className="px-4 py-2 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span
                                className={`w-3 h-3 rounded-full ${
                                  order.status?.toLowerCase() === "pending"
                                    ? "bg-orange-500"
                                    : order.status?.toLowerCase() ===
                                      "in process"
                                    ? "bg-yellow-500"
                                    : order.status?.toLowerCase() ===
                                      "processed"
                                    ? "bg-green-500"
                                    : "bg-gray-400"
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
                          <td className="px-4 py-2 whitespace-nowrap">
                               {" "}
                            <div className="flex items-center gap-2">
                                   {" "}
                              <span
                                className={`w-3 h-3 rounded-full ${
                                  order.packagingStatus?.toLowerCase() ===
                                  "unpackaged"
                                    ? "bg-orange-500"
                                    : order.packagingStatus?.toLowerCase() ===
                                      "packaged"
                                    ? "bg-green-500"
                                    : "bg-gray-400"
                                }`}
                              ></span>
                                
                              <span className="capitalize">
                                {(order.dispatchStatus === "dispatched" ||
                                  order.dispatchStatus ===
                                    "ready to dispatch") &&
                                order.packagingStatus === "unpackaged"
                                  ? "packaged"
                                  : order.packagingStatus}
                              </span>
                                 {" "}
                            </div>
                             {" "}
                          </td>
                            <td className="px-4 py-2 whitespace-nowrap">
                                 {" "}
                              <div className="flex items-center gap-2">
                                     {" "}
                                <span
                                  className={`w-3 h-3 rounded-full ${
                                    order.dispatchStatus?.toLowerCase() ===
                                    "not dispatched"
                                      ? "bg-orange-500"
                                      : order.dispatchStatus?.toLowerCase() ===
                                        "ready to dispatch"
                                      ? "bg-yellow-500"
                                      : order.dispatchStatus?.toLowerCase() ===
                                        "dispatched"
                                      ? "bg-green-500"
                                      : "bg-gray-400"
                                  }`}
                                ></span>
                                     {" "}
                                <span className="capitalize">
                                  {order.dispatchStatus || "Unknown"}
                                </span>
                                   {" "}
                              </div>
                               {" "}
                            </td>
                        </tr>
      );
    })}
  </React.Fragment>
))}

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
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {activeProductImage.images.map((img, i) => (
          <img
            key={i}
            src={`${import.meta.env.VITE_REACT_APP_API_URL}${img}`}
            alt={`Image ${i + 1}`}
            className="w-full h-48 object-cover rounded border"
          />
        ))}
      </div>
    </div>
  </div>
)}

              </div>
            </div>
          </div>
        )}
        {/* Pagination Controls */}
        {filteredOrders?.length > 0 && (
  <div className="flex justify-center items-center gap-2 mt-8">
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
      onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
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
    po: order.po,
    freight: order.freight || "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUpdatedOrder({ ...updatedOrder, [name]: value });
  };

  const handleSave = async () => {
    await onSave(order._id, updatedOrder); // wait for save
    onClose(); // close modal after saving
    toast.success("order updated successfully!");
  };

  useEffect(() => {
    gsap.from(".modal-content", { opacity: 0, y: -50, duration: 0.5 });
  }, []);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 bg-opacity-50 flex justify-center items-center z-50 overflow-y-auto">
      <div className="modal-content bg-white p-6 rounded-lg shadow-lg max-w-lg w-full my-10 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">Edit Order</h2>

        <div className="space-y-4">
          <div>
            <label className="block mb-1 font-semibold">Quantity</label>
            <input
              type="number"
              name="quantity"
              value={updatedOrder.quantity}
              onChange={handleChange}
              className="border border-gray-300 p-3 rounded-lg w-full"
            />
          </div>

          <div>
            <label className="block mb-1 font-semibold">Price</label>
            <input
              type="number"
              name="price"
              value={updatedOrder.price}
              onChange={handleChange}
              className="border border-gray-300 p-3 rounded-lg w-full"
            />
          </div>

          <div>
            <label className="block mb-1 font-semibold">Freight</label>
            <input
              type="text"
              name="freight"
              value={updatedOrder.freight}
              onChange={handleChange}
              className="border border-gray-300 p-3 rounded-lg w-full"
            />
          </div>

          <div>
            <label className="block mb-1 font-semibold">P/O</label>
            <input
              type="text"
              name="po"
              value={updatedOrder.po}
              onChange={handleChange}
              className="border border-gray-300 p-3 rounded-lg w-full"
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end space-x-3 mt-6">
          <button
            className="bg-[#ffea00] hover:bg-[#fff158] text-black cursor-pointer px-6 py-3 rounded-lg"
            onClick={onClose}
          >
            ❌ Cancel
          </button>
          <button
            className="bg-green-600 cursor-pointer hover:bg-green-700 text-white px-6 py-3 rounded-lg"
            onClick={handleSave}
          >
            📑 Save
          </button>
        </div>
      </div>
    </div>
  );
}
