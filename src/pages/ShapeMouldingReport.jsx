import React, { useEffect, useState } from "react";
import { debounce } from "lodash";
import axiosInstance from "../axiosInstance";
import { useUserContext } from "../context/UserContext";
import InternalNavbar from "../components/InternalNavbar";
import toast from "react-hot-toast";

const ROWS_PER_PAGE = 5; // 5 dates per page

const ShapeMouldingReport = () => {
  const { user } = useUserContext();
  const [loading, setLoading] = useState(true);
  const [allProducts, setAllProducts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [rawSearchTerm, setRawSearchTerm] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [groupedData, setGroupedData] = useState({});
  const [totalPages, setTotalPages] = useState(1);
const isKnownProduct = (name) =>
  allProducts.some((p) => p.name.trim().toLowerCase() === name.trim().toLowerCase());

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await axiosInstance.get("/products/all-backend-products", {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        console.log("ddadat", res.data);

        setAllProducts(res.data); // assuming array of products
      } catch (err) {
        console.error("Error fetching products:", err);
        toast.error("Failed to load product list");
      }
    };

    fetchProducts();
  }, []);

  useEffect(() => {
    const debounced = debounce(() => {
      setSearchTerm(rawSearchTerm);
      setCurrentPage(1);
    }, 500); // delay in ms

    debounced();
    return () => debounced.cancel();
  }, [rawSearchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterDate]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await axiosInstance.get(
          "/production-reports/shape-moulding",
          {
            params: {
              page: currentPage,
              limit: ROWS_PER_PAGE,
              search: searchTerm,
              date: filterDate,
            },
            headers: { Authorization: `Bearer ${user.token}` },
          }
        );

        if (res.data?.data) {
          setGroupedData(res.data.data); // Object of { date: [...rows] }
          setTotalPages(res.data.totalPages);
        }
      } catch (err) {
        console.error("Error fetching shape moulding report:", err);
        toast.error("Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };

    if (
      user.role === "accounts" ||
      user.productionSection === "shapeMoulding"
    ) {
      fetchData();
    }
  }, [user, currentPage, searchTerm, filterDate]);

  if (!(user.role === "accounts" || user.productionSection === "shapeMoulding"))
    return null;

  const handleInputChange = (date, index, field, value) => {
    const updatedGrouped = { ...groupedData };
    updatedGrouped[date][index] = {
      ...updatedGrouped[date][index],
      [field]: value,
    };
    setGroupedData(updatedGrouped);
  };

  const handleAddRow = () => {
    const today = new Date().toISOString().split("T")[0];
    const newRow = {
      srNo: (groupedData[today]?.length || 0) + 1,
      date: today,
      product: "",
      operator: "",
      cycle: "",
      pcs: "",
      dryWt: "",
      rejects: "",
    };

    const updatedGrouped = {
      ...groupedData,
      [today]: groupedData[today] ? [...groupedData[today], newRow] : [newRow],
    };

    setGroupedData(updatedGrouped);
    setCurrentPage(1); // Optional: Reset to first page
  };

  const handleSave = async () => {
const flatData = Object.values(groupedData).flat().map((row) => ({
  ...row,
  product:
    !isKnownProduct(row.product) || row.product === '__other__'
      ? row.customProduct
      : row.product,
}));

    try {
      await axiosInstance.post(
        "/production-reports/shape-moulding-update",
        flatData,
        {
          headers: { Authorization: `Bearer ${user.token}` },
        }
      );
      toast.success("Data saved successfully!");
    } catch (err) {
      console.error("Error saving shape moulding report:", err);
      toast.error("Failed to save data");
    }
  };
  const paginatedDates = Object.keys(groupedData);

  return (
    <>
      <InternalNavbar />
      <div className="w-screen px-4 mt-8 mb-12">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">
          Daily Shape Moulding Production Report
        </h2>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <svg
              className="animate-spin h-8 w-8 text-blue-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              ></path>
            </svg>
            <span className="ml-3 text-blue-600 font-semibold">Loading...</span>
          </div>
        ) : (
          <>
            {/* Filters */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
              <input
                type="text"
                placeholder="Search Product"
                value={rawSearchTerm}
                onChange={(e) => setRawSearchTerm(e.target.value)}
                className="border border-gray-300 rounded px-3 py-2 w-full sm:w-1/3"
              />
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="border border-gray-300 rounded px-3 py-2 w-full sm:w-1/3"
              />
              <button
                onClick={() => {
                  setRawSearchTerm("");
                  setFilterDate("");
                }}
                className="text-sm text-blue-600 underline hover:text-blue-800"
              >
                Reset Filters
              </button>
              {/* Actions */}
              <div className="mt-6 flex gap-4">
                <button
                  onClick={handleAddRow}
                  className="px-5 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
                >
                  Add Row
                </button>

                <button
                  onClick={handleSave}
                  className="px-5 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                >
                  Save
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="w-full overflow-x-auto shadow rounded border border-gray-300">
              <table className="w-full table-auto divide-y divide-gray-200">
                <thead className="bg-blue-600">
                  <tr>
                    {[
                      "Sr No",
                      "Date",
                      "Select Product",
                      "Product",
                      "Operator",
                      "Cycle",
                      "Pcs",
                      "Total Qty",
                      "Dry Wt(in gms)",
                      "Total Wt(in kgs)",
                      "Rejection(in No of Pcs)",
                    ].map((head) => (
                      <th
                        key={head}
                        className="px-3 py-2 text-white text-sm font-semibold text-center whitespace-nowrap"
                      >
                        {head}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedDates.length === 0 && (
                    <tr>
                      <td
                        colSpan={10}
                        className="text-center py-6 text-gray-500"
                      >
                        No data available
                      </td>
                    </tr>
                  )}
                  {paginatedDates.map((date) => {
                    const rows = groupedData[date];
                    // Calculate totals
                    const totalCycle = rows.reduce(
                      (sum, r) => sum + (parseInt(r.cycle) || 0),
                      0
                    );
                    const totalPcs = rows.reduce(
                      (sum, r) => sum + (parseInt(r.pcs) || 0),
                      0
                    );
                    const totalQty = rows.reduce(
                      (sum, r) =>
                        sum + (parseInt(r.cycle) || 0) * (parseInt(r.pcs) || 0),
                      0
                    );
                    const totalDryWt = rows.reduce(
                      (sum, r) => sum + (parseFloat(r.dryWt) || 0),
                      0
                    );
                    const totalWt = rows.reduce(
                      (sum, r) =>
                        sum +
                        (parseInt(r.cycle) || 0) *
                          (parseInt(r.pcs) || 0) *
                          (parseFloat(r.dryWt) || 0),
                      0
                    );
                    const totalRejects = rows.reduce(
                      (sum, r) => sum + (parseInt(r.rejects) || 0),
                      0
                    );

                    return (
                      <React.Fragment key={date}>
                        {rows.map((row, idx) => {
                          const totalQtyRow =
                            (parseInt(row.cycle) || 0) *
                            (parseInt(row.pcs) || 0);
                          const totalWtRow =
                            totalQtyRow * (parseFloat(row.dryWt) || 0);

                          return (
                            <tr
                              key={`${date}-${idx}`}
                              className={
                                idx % 2 === 0 ? "bg-gray-50" : "bg-white"
                              }
                            >
                              <td className="px-3 py-2 text-center text-gray-700">
                                {row.srNo}
                              </td>
                              <td className="px-2 py-1">
                                <input
                                  type="date"
                                  value={row.date}
                                  max={new Date().toISOString().split("T")[0]} // 👈 restricts to today
                                  onChange={(e) =>
                                    handleInputChange(
                                      date,
                                      idx,
                                      "date",
                                      e.target.value
                                    )
                                  }
                                  className="w-full border border-gray-300 rounded px-2 py-1"
                                />
                              </td>
                             <td className="px-2 py-1">
  {row.product === '__other__' ? (

    <input
      type="text"
value={row.customProduct || ''}
      onChange={(e) =>
        handleInputChange(date, idx, 'customProduct', e.target.value)
      }
      placeholder="Enter custom product"
      className="w-full border border-gray-300 rounded px-2 py-1"
    />
  ) : (
    <select
      value={row.product}
      onChange={(e) => {
  const value = e.target.value;
  handleInputChange(date, idx, 'product', value);
  if (value === '__other__') {
    handleInputChange(date, idx, 'customProduct', '');
  } else {
    handleInputChange(date, idx, 'customProduct', '');
  }
}}

      className="w-full border border-gray-300 rounded px-2 py-1"
    >
      <option value="__other__">Other</option>
      <option value="">Select Product</option>
      {allProducts.map((product) => (
        <option key={product._id} value={product.name}>
          {product.name}
        </option>
      ))}
    </select>
  )}
</td>
<td className="px-3 py-2 text-center text-gray-700">
                                {row.product}
                              </td>

                              <td className="px-2 py-1">
                                <input
                                  type="text"
                                  value={row.operator}
                                  onChange={(e) =>
                                    handleInputChange(
                                      date,
                                      idx,
                                      "operator",
                                      e.target.value
                                    )
                                  }
                                  className="w-full border border-gray-300 rounded px-2 py-1"
                                  placeholder="Operator"
                                />
                              </td>
                              <td className="px-2 py-1">
                                <input
                                  type="number"
                                  min="0"
                                  value={row.cycle}
                                  onChange={(e) =>
                                    handleInputChange(
                                      date,
                                      idx,
                                      "cycle",
                                      e.target.value
                                    )
                                  }
                                  className="w-full border border-gray-300 rounded px-2 py-1"
                                  placeholder="Cycle"
                                />
                              </td>
                              <td className="px-2 py-1">
                                <input
                                  type="number"
                                  min="0"
                                  value={row.pcs}
                                  onChange={(e) =>
                                    handleInputChange(
                                      date,
                                      idx,
                                      "pcs",
                                      e.target.value
                                    )
                                  }
                                  className="w-full border border-gray-300 rounded px-2 py-1"
                                  placeholder="Pcs"
                                />
                              </td>
                              <td className="px-2 py-1 text-center text-gray-700 bg-gray-100">
                                {totalQtyRow}
                              </td>
                              <td className="px-2 py-1">
                                <div className="flex items-center">
                                  <input
                                    type="number"
                                    min="0"
                                    step="any"
                                    value={row.dryWt}
                                    onChange={(e) =>
                                      handleInputChange(
                                        date,
                                        idx,
                                        "dryWt",
                                        e.target.value
                                      )
                                    }
                                    className="w-full border border-gray-300 rounded px-2 py-1"
                                    placeholder="Dry Wt"
                                  />
                                  <span className="ml-1 text-gray-600 text-sm">
                                    gms
                                  </span>
                                </div>
                              </td>
                              <td className="px-2 py-1 text-center text-gray-700 bg-gray-100">
                                {(totalWtRow / 1000).toFixed(2)} kg
                              </td>
                              <td className="px-2 py-1">
                                <input
                                  type="number"
                                  min="0"
                                  value={row.rejects}
                                  onChange={(e) =>
                                    handleInputChange(
                                      date,
                                      idx,
                                      "rejects",
                                      e.target.value
                                    )
                                  }
                                  className="w-full border border-gray-300 rounded px-2 py-1"
                                  placeholder="Rejects"
                                />
                              </td>
                            </tr>
                          );
                        })}
                        {/* Summary Row */}
                        <tr className="bg-yellow-100 font-semibold text-gray-900">
                          <td colSpan={5} className="text-right px-3 py-2">
                            Total for {date}
                          </td>
                          <td className="text-center">{totalCycle}</td>
                          <td className="text-center">{totalPcs}</td>
                          <td className="text-center">{totalQty}</td>
                          <td className="text-center">
                            {totalDryWt.toFixed(2)} gms
                          </td>
<td className="text-center">{(totalWt / 1000).toFixed(2)} kg</td>
                          <td className="text-center">{totalRejects}</td>
                        </tr>
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="flex justify-between items-center mt-4">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className={`px-4 py-2 rounded ${
                  currentPage === 1
                    ? "bg-gray-300 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700 text-white"
                }`}
              >
                Previous
              </button>

              <span className="text-gray-700 font-medium">
                Page {currentPage} of {totalPages || 1}
              </span>

              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages || totalPages === 0}
                className={`px-4 py-2 rounded ${
                  currentPage === totalPages || totalPages === 0
                    ? "bg-gray-300 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700 text-white"
                }`}
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default ShapeMouldingReport;
