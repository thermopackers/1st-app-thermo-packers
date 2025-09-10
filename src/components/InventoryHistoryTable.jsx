import React, { useState } from "react";

const ITEMS_PER_PAGE = 2;

const InventoryHistoryTable = ({ history=[] }) => {
  const [filterDate, setFilterDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const filtered = filterDate
    ? history.filter((h) => h.date === filterDate)
    : history;

const totalPages = Math.ceil((filtered.length || 0) / ITEMS_PER_PAGE);
  const paginatedData = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handlePrev = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNext = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  return (
    <div className="my-6 w-full px-4">
      <div className="max-w-5xl mx-auto bg-white shadow-xl rounded-2xl p-6">
        <label className="block text-lg font-semibold text-gray-700 mb-3">
          📅 Filter by Date:
        </label>
        <input
          type="date"
          value={filterDate}
          onChange={(e) => {
            setFilterDate(e.target.value);
            setCurrentPage(1);
          }}
          className="border border-gray-300 rounded-lg px-4 py-2 mb-6 w-full sm:w-64 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        />

        <div className="overflow-x-auto">
          <table className="w-full table-auto border-collapse text-sm sm:text-base">
            <thead className="bg-blue-100 text-blue-800">
              <tr>
                <th className="px-4 py-3 border">Date</th>
                <th className="px-4 py-3 border">Previous Stock</th>
                <th className="px-4 py-3 border">Material Packed</th>
                <th className="px-4 py-3 border">Material Dispatched</th>
                <th className="px-4 py-3 border">Net Stock</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((entry, index) => (
                <tr
                  key={index}
                  className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}
                >
                  <td className="px-4 py-3 border">{entry.date}</td>
                  <td className="px-4 py-3 border">{entry.previousStock}</td>
                  <td className="px-4 py-3 border">{entry.materialPacked}</td>
                  <td className="px-4 py-3 border">{entry.materialDispatch}</td>
                  <td className="px-4 py-3 border">{entry.netStock}</td>
                </tr>
              ))}
              {paginatedData.length === 0 && (
                <tr>
                  <td
                    colSpan="5"
                    className="text-center text-gray-500 py-6 border"
                  >
                    No records found for this date.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center mt-6">
            <button
              onClick={handlePrev}
              disabled={currentPage === 1}
              className={`px-4 py-2 rounded-lg font-medium ${
                currentPage === 1
                  ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                  : "bg-blue-500 text-white hover:bg-blue-600"
              }`}
            >
              ⬅ Prev
            </button>
            <span className="text-gray-700 font-semibold">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={handleNext}
              disabled={currentPage === totalPages}
              className={`px-4 py-2 rounded-lg font-medium ${
                currentPage === totalPages
                  ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                  : "bg-blue-500 text-white hover:bg-blue-600"
              }`}
            >
              Next ➡
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default InventoryHistoryTable;
