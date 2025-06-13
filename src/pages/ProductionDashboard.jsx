import React, { useEffect, useState } from "react";
import InternalNavbar from "../components/InternalNavbar";
import { useSearchParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { gsap } from "gsap";
import axiosInstance from "../axiosInstance";
import { useUserContext } from "../context/UserContext";
import toast from "react-hot-toast";


const ITEMS_PER_PAGE = 15;

const ProductionDashboard = () => {
  const { user, loading: userLoading } = useUserContext();
                     const baseUrl = import.meta.env.VITE_REACT_APP_API_URL;
  const [orders, setOrders] = useState([]);
const [searchParams, setSearchParams] = useSearchParams();
const currentPage = parseInt(searchParams.get("page")) || 1;
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [dispatchedOrders, setDispatchedOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
    const [activeProductImage, setActiveProductImage] = useState(null);

  const [totalPages, setTotalPages] = useState(1);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [packagingReadyOrders, setPackagingReadyOrders] = useState([]);
  
const groupOrdersByPO = (orders) => {
  return orders.reduce((groups, order) => {
    const po = order.po || "N/A";
    if (!groups[po]) groups[po] = [];
    groups[po].push(order);
    return groups;
  }, {});
};

 useEffect(() => {
    axiosInstance
      .get("/products/all-backend-products")
      .then((res) => setProducts(res.data))
      .catch((err) => console.error("Error fetching products:", err));
  }, []);

  const navigate = useNavigate();
const handlePageChange = (newPage) => {
  if (newPage < 1 || newPage > totalPages) return;
  setSearchParams({ page: newPage });
};

const fetchOrders = async () => {
  try {
    setLoading(true);

    // Build query params
    const params = new URLSearchParams();
    params.append("page", currentPage);
    params.append("limit", ITEMS_PER_PAGE);
    if (searchTerm) params.append("searchTerm", searchTerm);
    if (statusFilter !== "all") params.append("status", statusFilter);
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);

    const response = await axiosInstance.get(
      `/orders/production-dashboard?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );

    let enrichedOrders = response.data.orders;

    // Filter orders based on user.productionSection (if needed, can move to backend for further optimization)
    if (user && user.productionSection) {
      enrichedOrders = enrichedOrders.filter((order) => {
        if (user.productionSection === "shapeMoulding") {
          return order.requiredSections?.shapeMoulding === true;
        } else {
          return !order.requiredSections?.shapeMoulding;
        }
      });
    }

    setOrders(enrichedOrders);

    // Setup dispatched and packaging ready arrays
    const ready = enrichedOrders
      .filter((order) => order.sentTo?.dispatchReady)
      .map((order) => order._id);
    setDispatchedOrders(ready);

    const packaged = enrichedOrders
      .filter((order) => order.readyForPackaging)
      .map((order) => order._id);
    setPackagingReadyOrders(packaged);

    // Update total pages from backend response
    setTotalPages(response.data.totalPages);
  } catch (error) {
    console.error("Failed to fetch orders:", error);
  } finally {
    setLoading(false);
  }
};


  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await axiosInstance.put(
        `/orders/${orderId}/status`,
        { status: newStatus },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      toast.success(newStatus)
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order._id === orderId ? { ...order, status: newStatus } : order
        )
      );
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };


 const currentOrders = orders;

  console.log("currentOrders", currentOrders);

  useEffect(() => {
    fetchOrders();
    gsap.from(".dashboard-title", { opacity: 0, y: -30, duration: 1 });
    gsap.from(".back-button", { opacity: 0, x: -30, duration: 1, delay: 0.5 });
    gsap.from(".table-row", {
      opacity: 0,
      y: 20,
      stagger: 0.2,
      duration: 1,
      delay: 1,
    });
  }, [currentPage, searchTerm, statusFilter, startDate, endDate]);
const onSearchChange = (e) => {
  setSearchTerm(e.target.value);
  setSearchParams({ page: 1 });
};

const onStatusChange = (e) => {
  setStatusFilter(e.target.value);
  setSearchParams({ page: 1 });
};

const onStartDateChange = (e) => {
  setStartDate(e.target.value);
  setSearchParams({ page: 1 });
};

const onEndDateChange = (e) => {
  setEndDate(e.target.value);
  setSearchParams({ page: 1 });
};

  return (
    <>
      <InternalNavbar />

      <button
            className="absolute hidden md:block left-4 top-[12vh] cursor-pointer bg-blue-500 text-white px-4 py-2 rounded-md shadow-md hover:bg-blue-600 back-button"
            onClick={() => navigate(-1)}
          >
            ↩️ Back
          </button>
      <div className="relative md:mt-8 mt-4 px-4">
        <h2 className="text-3xl md:text-4xl text-center font-semibold dashboard-title">
          Production Dashboard
        </h2>
 <div>
       <div className="p-4 flex flex-col md:flex-row gap-4 justify-center">
        {(user.role === "accounts" || user.productionSection === "shapeMoulding") && (
          <button
            onClick={() => navigate("/reports/shape-moulding")}
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            View Shape Moulding Production Report
          </button>
        )}
        {(user.role === "accounts" || user.productionSection === "blockMoulding") && (
          <button
            onClick={() => navigate("/reports/block-moulding")}
            className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            View Block Moulding Production Report
          </button>
        )}
      </div>
    </div>
       <div className="mb-6 flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6 flex-wrap">
  {/* Search Bar */}
  <div className="flex flex-col md:w-1/3 w-full">
    <label className="text-sm text-gray-600 mb-1">Search Orders:</label>
    <input
      type="text"
      placeholder="🔍 Search by PO No, Client, Product, or Order ID"
      className="w-full md:w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
      value={searchTerm}
  onChange={onSearchChange}
    />
  </div>

  {/* Start Date */}
  <div className="flex flex-col w-full md:w-1/6">
    <label className="text-sm text-gray-600 mb-1">Start Date</label>
    <input
      type="date"
      value={startDate}
  onChange={onStartDateChange}
      className="p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
    />
  </div>

  {/* End Date */}
  <div className="flex flex-col w-full md:w-1/6">
    <label className="text-sm text-gray-600 mb-1">End Date</label>
    <input
      type="date"
      value={endDate}
  onChange={onEndDateChange}
      className="p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
    />
  </div>

  {/* Status Filter */}
  <div className="flex flex-col w-full md:w-1/6">
    <label className="text-sm text-gray-600 mb-1">Status</label>
    <select
      className="p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
      value={statusFilter}
  onChange={onStatusChange}
    >
      <option value="all">All</option>
      <option value="pending">Pending</option>
      <option value="in process">In Process</option>
      <option value="processed">Processed</option>
    </select>
  </div>

  {/* Clear Filters Button */}
  <div className="flex flex-col justify-end">
    <label className="invisible text-sm mb-1">Clear</label>
    <button
      onClick={() => {
        setSearchTerm("");
        setStartDate("");
        setEndDate("");
        setStatusFilter("all");
      }}
      className="px-4 py-3 cursor-pointer bg-red-500 text-white rounded-lg shadow hover:bg-red-600 transition"
    >
      ✖ Clear Filters
    </button>
  </div>
</div>


        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="w-12 h-12 border-4 border-blue-400 border-dashed rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-300 shadow-lg rounded-lg overflow-hidden">
              <thead>
                <tr className="bg-gray-100 text-gray-600">
                  <th className="px-6 py-4 text-left font-medium">Order ID</th>
                  <th className="px-6 py-4 text-left font-medium">
                    Client Name
                  </th>
                  <th className="px-6 py-4 text-left font-medium">PO</th>
                  <th className="px-6 py-4 text-left font-medium">
                    Product Name
                  </th>
                  <th className="px-6 py-4 text-left font-medium">Quantity</th>
                  <th className="px-6 py-4 text-left font-medium">Slip</th>

                  <th className="px-6 py-4 text-left font-medium">
                    Sent to Production Sections
                  </th>
                  <th className="px-6 py-4 text-left font-medium">
                    Production Status
                  </th>
                  <th className="px-6 py-4 text-left font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
               {Object.entries(groupOrdersByPO(currentOrders)).map(([poNumber, poOrders], index) => (
  <React.Fragment key={poNumber}>
    {/* PO Group Header Row */}
    <tr className={`${index % 2 === 0 ? 'bg-blue-100' : 'bg-purple-100'}`}>
      <td colSpan="100%" className="px-4 py-2 font-semibold text-left text-gray-800">
        📄 <strong>PO:</strong> {poNumber} — {poOrders.length} order{poOrders.length > 1 ? "s" : ""}
      </td>
    </tr>

    {/* Orders under this PO */}
    {poOrders.map((order) => (
       <tr key={order._id} className="table-row capitalize">
                    <td className="px-6 py-4">{order.shortId}</td>
                    <td className="px-6 py-4">{order.customerName}</td>
                    <td className="px-6 py-4">{order.po}</td>
 <td className="px-4 py-2 text-blue-600 underline cursor-pointer">
  <button
    onClick={() => {
      const product = products.find((p) => p.name === order.product);
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
<td className="px-6 py-4">{order.quantity}</td>
                    <td className="px-6 py-4">

{order.requiredSections?.shapeMoulding
  ? order.shapeSlip?.url && (
      <a
  href={order.shapeSlip.url} // ✅ Correct: no prefix
        download
        className="text-green-600 underline"
      >
        🏭 Shape Slip
      </a>
    )
  : order.danaSlip?.url && (
      <a
href={order.danaSlip.url}
        download
        className="text-green-600 underline"
      >
        🧪 Dana Slip
      </a>
    )}

                    </td>

                    <td className="px-6 py-4">
                      {order.sentTo?.production?.length > 0
                        ? order.sentTo.production.join(", ")
                        : "N/A"}
                    </td>
                    <td className="px-6 py-4 flex items-center">
                      {order.status}
                      <span
                        className={`w-3 h-3 rounded-full ml-2 ${
                          order.status?.trim().toLowerCase() === "pending"
                            ? "bg-orange-500"
                            : order.status?.trim().toLowerCase() ===
                              "in process"
                            ? "bg-yellow-500"
                            : order.status?.trim().toLowerCase() === "processed"
                            ? "bg-green-500"
                            : "bg-gray-400"
                        }`}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
                        <select
                          value={order.status}
                          onChange={(e) =>
                            handleStatusChange(order._id, e.target.value)
                          }
                          className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                        >
                          <option value="pending">Pending</option>
                          <option value="in process">In Process</option>
                          <option value="processed">Processed</option>
                        </select>

                        
                      </div>
                    </td>
                  </tr>
    ))}
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
      {activeProductImage.images.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {activeProductImage.images.map((img, i) => (
            <img
              key={i}
              src={
                img.startsWith("http")
                  ? img
                  : `${import.meta.env.VITE_REACT_APP_API_URL}${img}`
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
        )}

        {!loading && currentOrders.length > 0 && (
          <div className="flex justify-center items-center gap-4 mt-6">
           <button
  onClick={() => handlePageChange(currentPage - 1)}
  disabled={currentPage === 1}
  className={`px-4 py-2 rounded-md font-medium shadow-md ${
    currentPage === 1
      ? "bg-gray-300 text-gray-600 cursor-not-allowed"
      : "bg-blue-500 text-white hover:bg-blue-600"
  }`}
>
  Previous
</button>

<span className="text-gray-700 font-medium">
  Page {currentPage} of {totalPages}
</span>

<button
  onClick={() => handlePageChange(currentPage + 1)}
  disabled={currentPage === totalPages}
  className={`px-4 py-2 rounded-md font-medium shadow-md ${
    currentPage === totalPages
      ? "bg-gray-300 text-gray-600 cursor-not-allowed"
      : "bg-blue-500 text-white hover:bg-blue-600"
  }`}
>
  Next
</button>

          </div>
        )}
      </div>
    </>
  );
};

export default ProductionDashboard;
