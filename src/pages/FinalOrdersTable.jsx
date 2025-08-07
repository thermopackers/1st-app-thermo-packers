import React, { useEffect, useState } from 'react';
import axiosInstance from '../axiosInstance';
import InternalNavbar from '../components/InternalNavbar';

const FinalOrdersTable = () => {
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
console.log("orders",orders);

  const fetchOrders = async (pageNum = 1, searchText = '') => {
    try {
      setLoading(true);
      const res = await axiosInstance.get('/final-orders', {
        params: {
          page: pageNum,
          limit: 10,
          search: searchText,
        },
      });
      setOrders(res.data.orders);
      setPage(res.data.page);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      console.error('Failed to fetch final orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(page, search);
  }, [page, search]);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1); // reset to first page when search changes
  };

  return (
    <>
      <InternalNavbar />
      <div className="p-4 sm:p-6">
        <h1 className="text-2xl sm:text-3xl font-bold mb-4">Final Orders</h1>

        <input
          type="text"
          placeholder="Search by customer or drawing name"
          className="p-2 border border-gray-300 rounded mb-4 w-full max-w-md"
          value={search}
          onChange={handleSearchChange}
        />

        {loading ? (
          <p>Loading...</p>
        ) : (
          <>
            <div className="overflow-x-auto rounded shadow bg-white">
              <table className="min-w-[800px] w-full text-sm border-collapse">
                <thead className="bg-gray-100 text-gray-700">
                  <tr>
                    <th className="px-4 py-2">Date</th>
                    <th className="px-4 py-2">Customer</th>
                    <th className="px-4 py-2">Drawing Name</th>
                    <th className="px-4 py-2">Drawing Video</th>
                    <th className="px-4 py-2">Step File</th>
                    <th className="px-4 py-2">Drawing Dimension</th>
                    <th className="px-4 py-2">Shrinkage</th>
                    <th className="px-4 py-2">Margin</th>
                    <th className="px-4 py-2">Final Dimension</th>
                    <th className="px-4 py-2">Weight</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="text-center py-4 text-gray-500">
                        No orders found
                      </td>
                    </tr>
                  ) : (
                    orders.map((order, index) => (
                      <tr key={index} className="text-center border-t hover:bg-gray-50">
                        <td className="px-4 py-2">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-2">{order.customer}</td>
                        <td className="px-4 py-2">{order.drawingName}</td><td className="px-4 py-3 border-b">
  {Array.isArray(order.drawingVideo) && order.drawingVideo.length > 0 ? (
    <div className="flex gap-2 flex-wrap">
      {order.drawingVideo.map((videoObj, idx) => (
        <video key={idx} src={videoObj.url} controls className="w-32 h-auto rounded shadow" />
      ))}
    </div>
  ) : '—'}
</td>

<td className="px-4 py-3 border-b">
  {Array.isArray(order.stepFile) && order.stepFile.length > 0 ? (
    <ul className="flex gap-3 flex-wrap">
      {order.stepFile.map((file, idx) => (
        <li key={idx}>
          <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
            STEP {idx + 1}
          </a>
        </li>
      ))}
    </ul>
  ) : '—'}
</td>
                        <td className="px-4 py-2">{order.drawingDimension}</td>
                        <td className="px-4 py-2">{order.shrinkage}</td>
                        <td className="px-4 py-2">{order.margin}</td>
                        <td className="px-4 py-2">{order.finalDimension}</td>
                        <td className="px-4 py-2">{order.weight}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
           <div className="flex flex-wrap gap-2 items-center justify-center mt-4">
  {/* Prev Button */}
  <button
    onClick={() => setPage((prev) => Math.max(1, prev - 1))}
    disabled={page === 1}
    className="px-3 py-1 rounded bg-blue-600 text-white disabled:bg-gray-400"
  >
    Prev
  </button>

  {/* Page Number Buttons */}
  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
    <button
      key={pageNum}
      onClick={() => setPage(pageNum)}
      className={`px-3 py-1 rounded ${
        page === pageNum
          ? 'bg-blue-700 text-white font-bold'
          : 'bg-gray-200 text-gray-800 hover:bg-blue-100'
      }`}
    >
      {pageNum}
    </button>
  ))}

  {/* Next Button */}
  <button
    onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
    disabled={page === totalPages}
    className="px-3 py-1 rounded bg-blue-600 text-white disabled:bg-gray-400"
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

export default FinalOrdersTable;
