import React, { useEffect, useState } from "react";
import axiosInstance from "../axiosInstance";
import { useUserContext } from "../context/UserContext";
import toast from "react-hot-toast";
import InternalNavbar from "../components/InternalNavbar";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import InventoryHistoryTable from "../components/InventoryHistoryTable";

export default function InventoryManager() {
  const { user } = useUserContext();
  const navigate = useNavigate();

  const [inventory, setInventory] = useState([]);
  const [editedInventory, setEditedInventory] = useState({});
  const [packedState, setPackedState] = useState({});
  const [dispatchedState, setDispatchedState] = useState({});
  const [netStockState, setNetStockState] = useState({});
  const [loading, setLoading] = useState(true);
  const [hoveredRow, setHoveredRow] = useState(null);
  const [expandedRow, setExpandedRow] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [stockFilter, setStockFilter] = useState("");
  const [isFilterInitialized, setIsFilterInitialized] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    localStorage.setItem("stockFilter", stockFilter);
    setCurrentPage(1);
  }, [stockFilter]);

useEffect(() => {
  const savedPage = parseInt(localStorage.getItem("currentPage"), 10);
  if (!isNaN(savedPage)) {
    setCurrentPage(savedPage);
  }
  fetchInventory();
}, []);

useEffect(() => {
  localStorage.setItem("currentPage", currentPage);
  window.scrollTo({ top: 0, behavior: "smooth" });
}, [currentPage]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentPage]);

  const fetchInventory = async () => {
    try {
      const { data } = await axiosInstance.get("/products/all-backend-products");
      setInventory(data);

      const netStockMap = {};
      data.forEach((item) => {
        netStockMap[item._id] = item.netStock ?? 0;
      });
      setNetStockState(netStockMap);

      setPackedState({});
      setDispatchedState({});

      const savedFilter = localStorage.getItem("stockFilter");
      if (savedFilter !== null) {
        setStockFilter(savedFilter);
      }
      setIsFilterInitialized(true);
    } catch (err) {
      console.error("Error fetching inventory:", err);
    } finally {
      setLoading(false);
    }
  };

  const updateStock = async (productId, updatedFields) => {
    try {
      const response = await axiosInstance.put(`/products/${productId}`, {
        previousStock: Number(updatedFields.previousStock) || 0,
        materialPacked: Number(updatedFields.materialPacked) || 0,
        materialDispatch: Number(updatedFields.materialDispatch) || 0,
        quantity: Number(updatedFields.quantity) || 0,
        stockStatus: updatedFields.stockStatus,
      });

      const updated = response.data;
      toast.success("Stock updated!");

      setInventory((prev) =>
        prev.map((item) => (item._id === productId ? updated : item))
      );

      setNetStockState((prev) => ({
        ...prev,
        [productId]: updated.netStock ?? 0,
      }));

      setEditedInventory((prev) => {
        const newState = { ...prev };
        delete newState[productId];
        return newState;
      });
    } catch (err) {
      alert("Error updating product");
      console.error(err);
    }
  };

  const handleChange = (id, field, value) => {
    const number = Number(value);
    if (number < 0) return;
    setEditedInventory((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: number,
      },
    }));
  };

  const handleStatusChange = (id, value, currentQuantity) => {
    setEditedInventory((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        stockStatus: value,
        quantity: prev[id]?.quantity ?? currentQuantity,
      },
    }));
  };

  useEffect(() => {
    localStorage.setItem("stockFilter", stockFilter);
  }, [stockFilter]);

  const filteredInventory = inventory
    .filter((item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter((item) => {
      if (stockFilter === "") return true;
      return item.stockStatus?.toLowerCase() === stockFilter.toLowerCase();
    });

  const totalPages = Math.ceil(filteredInventory.length / itemsPerPage);
  const paginatedItems = filteredInventory.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (
    user?.role !== "dispatch" &&
    user?.role !== "admin" &&
    user?.role !== "accounts"
  ) {
    return (
      <div className="p-6 text-center text-red-600 font-semibold text-lg">
        🚫 Access Denied: Dispatch Only
      </div>
    );
  }

  if (loading || !isFilterInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-dashed rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg font-medium text-blue-700">
            Loading inventory...
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <InternalNavbar />
      <div className="p-4 sm:p-6 max-w-7xl mx-auto relative">
        <button
          className="absolute cursor-pointer left-4 top-6 bg-blue-500 text-white px-4 py-2 rounded-md shadow hover:bg-blue-600 transition md:block hidden"
          onClick={() => navigate(-1)}
        >
          ↩️ Back
        </button>
        <h2 className="md:text-4xl text-3xl font-bold mb-8 text-center text-gray-800">
          Inventory Management
        </h2>

        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4 flex-wrap">
          <input
            type="text"
            placeholder="🔍 Search product..."
            className="p-2 border border-gray-300 rounded-md w-full sm:w-1/3 shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select
            className="p-2 border cursor-pointer border-gray-300 rounded-md w-full sm:w-1/4 shadow-sm"
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="In Stock">In Stock</option>
            <option value="Out of Stock">Out of Stock</option>
          </select>

          <button
            onClick={() => {
              setSearchTerm("");
              setStockFilter("");
            }}
            className="p-2 bg-red-500 cursor-pointer text-white rounded-md shadow hover:bg-red-600 transition w-full sm:w-auto"
          >
            ✖ Clear Filters
          </button>
        </div>

        <div className="overflow-auto shadow ring-1 ring-gray-300 rounded-lg">
          <table className="min-w-full text-sm text-left bg-white border border-gray-300-collapse">
            <thead className="bg-blue-100 text-center text-base sticky top-0">
              <tr>
                <th className="px-4 py-3 border border-gray-300">Product</th>
                <th className="px-4 py-3 border border-gray-300">Previous Stock</th>
                <th className="px-4 py-3 border border-gray-300">Manufactured/Packed(Add new manufactured items)</th>
                <th className="px-4 py-3 border border-gray-300">Dispatched</th>
                <th className="px-4 py-3 border border-gray-300">Current Stock</th>
                <th className="px-4 py-3 border border-gray-300">Stock Status</th>
                <th className="px-4 py-3 border border-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {paginatedItems.map((item) => {
                const edited = editedInventory[item._id] || {};
                const prevStock = item.quantity ?? 0;

                const packed = packedState[item._id] ?? "";
                const dispatched = dispatchedState[item._id] ?? "";

                const currentQuantity = edited.quantity ?? prevStock;

                const isExpanded = expandedRow === item._id;

                return (
                  <React.Fragment key={item._id}>
                    <>
                      <tr
                        className="bg-white transition cursor-pointer hover:bg-white"
                        onClick={() =>
                          setExpandedRow(expandedRow === item._id ? null : item._id)
                        }
                      >
                        <td className="p-3 border border-gray-300 text-center font-semibold text-gray-800">
                          {item.name}
                        </td>

                        <td className="p-3 border border-gray-300 text-center">
                          <input
                            type="number"
                            className="w-24 text-center border border-gray-300 rounded-md p-1 bg-gray-100 font-medium"
                            value={currentQuantity}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) =>
                              handleChange(item._id, "quantity", e.target.value)
                            }
                          />
                        </td>

                        <td className="p-3 border border-gray-300 text-center">
                          <input
                            type="number"
                            className="w-24 text-center border border-gray-300 rounded-md p-1"
                            value={packed}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => {
                              const value =
                                e.target.value === "" ? "" : Number(e.target.value);
                              if (value !== "" && value < 0) return;
                              setPackedState((prev) => ({
                                ...prev,
                                [item._id]: value,
                              }));
                            }}
                          />
                        </td>

                        <td className="p-3 border border-gray-300 text-center">
                          <input
                            type="number"
                            className="w-24 text-center border border-gray-300 rounded-md p-1"
                            value={dispatched}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => {
                              const value =
                                e.target.value === "" ? "" : Number(e.target.value);
                              if (value !== "" && value < 0) return;
                              setDispatchedState((prev) => ({
                                ...prev,
                                [item._id]: value,
                              }));
                            }}
                          />
                        </td>

                        <td
                          onClick={(e) => e.stopPropagation()}
                          className="p-3 border border-gray-300 text-center font-semibold text-green-600"
                        >
                          {netStockState[item._id] ?? 0}
                        </td>

                       <td className="p-3 border border-gray-300 text-center">
  <select
    className="border border-gray-300 p-2 rounded-md bg-white"
    value={
      // Calculate net stock here:
      ((edited.quantity ?? item.quantity ?? 0) +
        (packedState[item._id] || 0) -
        (dispatchedState[item._id] || 0)) > 0
        ? "In Stock"
        : edited.stockStatus ?? item.stockStatus
    }
    onClick={(e) => e.stopPropagation()}
    disabled
    onChange={(e) =>
      handleStatusChange(item._id, e.target.value, edited.quantity ?? item.quantity)
    }
  >
    <option value="In Stock">In Stock</option>
    <option value="Out of Stock">Out of Stock</option>
  </select>
</td>


                        <td className="p-3 border border-gray-300 text-center">
                          <button
                            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md transition shadow-md"
                            onClick={async (e) => {
                              e.stopPropagation();

                              const result = await Swal.fire({
                                title: "Are you sure?",
                                text: "You want to save changes?",
                                icon: "warning",
                                showCancelButton: true,
                                confirmButtonColor: "#3085d6",
                                cancelButtonColor: "#d33",
                                confirmButtonText: "Yes, save it!",
                              });

                              if (result.isConfirmed) {
                                await updateStock(item._id, {
                                  previousStock: item.previousStock || 0,
                                  materialPacked:
                                    packedState[item._id] === ""
                                      ? 0
                                      : packedState[item._id] || 0,
                                  materialDispatch:
                                    dispatchedState[item._id] === ""
                                      ? 0
                                      : dispatchedState[item._id] || 0,
                                  quantity: edited.quantity ?? prevStock,
                                  stockStatus: edited.stockStatus ?? item.stockStatus,
                                });

                                setPackedState((prev) => ({
                                  ...prev,
                                  [item._id]: "",
                                }));

                                setDispatchedState((prev) => ({
                                  ...prev,
                                  [item._id]: "",
                                }));

                                setEditedInventory((prev) => {
                                  const newState = { ...prev };
                                  delete newState[item._id];
                                  return newState;
                                });
                              }
                            }}
                          >
                            Save
                          </button>
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr className="bg-gray-100 text-sm">
                          <td
                            colSpan="7"
                            className="border border-gray-300 p-4 text-left max-w-[800px]"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {/* Inventory History Table */}
        {item.inventoryHistory?.length > 0 ? (
          <div className="mt-2 border-t pt-3">
            <h4 className="font-semibold text-gray-800 mb-2 text-center">Inventory History</h4>
            <InventoryHistoryTable history={item.inventoryHistory} />
          </div>
        ) : (
          <p className="text-center text-gray-500">No history available.</p>
        )}
                          </td>
                        </tr>
                      )}
                    </>
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-4 flex-wrap">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 bg-blue-500 text-white rounded-md disabled:bg-gray-300"
            >
              Prev
            </button>

            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`px-3 py-1 rounded-md ${
                  currentPage === i + 1
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 hover:bg-gray-300"
                }`}
              >
                {i + 1}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 bg-blue-500 text-white rounded-md disabled:bg-gray-300"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </>
  );
}
