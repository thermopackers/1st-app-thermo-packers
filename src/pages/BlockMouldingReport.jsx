import React, { useEffect, useState } from 'react';
import { debounce } from 'lodash';
import axiosInstance from '../axiosInstance';
import { useUserContext } from '../context/UserContext';
import InternalNavbar from '../components/InternalNavbar';
import toast from 'react-hot-toast';

const ROWS_PER_PAGE = 5; // Now means 5 dates per page

const BlockMouldingReport = () => {
  const { user } = useUserContext();
  // const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
const [rawSearchTerm, setRawSearchTerm] = useState('');
const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState('');
const [groupedData, setGroupedData] = useState({});
const [totalPages, setTotalPages] = useState(1);

useEffect(() => {
  const debounced = debounce(() => {
    setSearchTerm(rawSearchTerm);
    setCurrentPage(1);
  }, 800); // delay in ms

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
      const res = await axiosInstance.get('/production-reports-block/block-moulding', {
        params: {
          page: currentPage,
          limit: ROWS_PER_PAGE,
          search: searchTerm,
          date: filterDate,
        },
        headers: { Authorization: `Bearer ${user.token}` },
      });

      if (res.data?.data) {
        setGroupedData(res.data.data); // Object of { date: [...rows] }
        setTotalPages(res.data.totalPages);
      }
    } catch (err) {
      console.error('Error fetching block moulding report:', err);
    } finally {
      setLoading(false);
    }
  };

  if (user.role === 'accounts' || user.productionSection === 'blockMoulding') {
    fetchData();
  }
}, [user, currentPage, searchTerm, filterDate]);


  if (!(user.role === 'accounts' || user.productionSection === 'blockMoulding')) return null;


const handleInputChange = (date, index, field, value) => {
  const updatedGrouped = { ...groupedData };
  updatedGrouped[date][index] = {
    ...updatedGrouped[date][index],
    [field]: value,
  };
  setGroupedData(updatedGrouped);
};


const handleAddRow = () => {
  const today = new Date().toISOString().split('T')[0];
  const newRow = {
    srNo: (groupedData[today]?.length || 0) + 1,
    date: today,
    mouldName: '',
    weightOfBlock: '',
    noOfBlocks: '',
  };

  const updatedGrouped = {
    ...groupedData,
    [today]: groupedData[today] ? [...groupedData[today], newRow] : [newRow],
  };

  setGroupedData(updatedGrouped);
  setCurrentPage(1); // Optional: Reset to first page
};


const handleSave = async () => {
  const flatData = Object.values(groupedData).flat();
  try {
    await axiosInstance.post('/production-reports-block/block-moulding-update', flatData, {
      headers: { Authorization: `Bearer ${user.token}` },
    });
    toast.success('Data saved successfully!');
  } catch (err) {
    console.error('Error saving block moulding report:', err);
    toast.error('Failed to save data');
  }
};

const paginatedDates = Object.keys(groupedData).sort((a, b) => new Date(b) - new Date(a));

  return (
    <>
      <InternalNavbar />
      <div className="max-w-6xl mx-auto px-4 mt-8 mb-12">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Block Moulding Report</h2>
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
            placeholder="Search Mould Name"
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
              setRawSearchTerm('');
              setFilterDate('');
            }}
            className="text-sm text-blue-600 underline hover:text-blue-800"
          >
            Reset Filters
          </button>
        </div>

        {/* Table */}
        <div className="w-full overflow-x-auto shadow rounded border border-gray-300">
          <table className="w-full table-auto divide-y divide-gray-200">
            <thead className="bg-blue-600">
              <tr>
                {['Sr No', 'Date', 'Mould Name', 'Weight of Block', 'No of Blocks', 'Total Weight'].map((head) => (
                  <th key={head} className="px-3 py-2 text-white text-sm font-semibold text-center whitespace-nowrap">
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedDates.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-6 text-gray-500">
                    No data available
                  </td>
                </tr>
              )}
              {paginatedDates.map((date) => {
                const rows = groupedData[date];
                const totalBlocks = rows.reduce((sum, r) => sum + (parseInt(r.noOfBlocks) || 0), 0);
                const totalWeight = rows.reduce((sum, r) => {
                  const weight = parseFloat(r.weightOfBlock) || 0;
                  const blocks = parseInt(r.noOfBlocks) || 0;
                  return sum + weight * blocks;
                }, 0);

                return (
                  <React.Fragment key={date}>
                    {rows.map((row, idx) => (
                      <tr key={`${date}-${idx}`} className={idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                        <td className="px-3 py-2 text-center text-gray-700">{row.srNo}</td>
                        <td className="px-2 py-1">
                          <input
                            type="date"
                            value={row.date}
                            onChange={(e) => handleInputChange(date, idx, 'date', e.target.value)}
                            className="w-full border border-gray-300 rounded px-2 py-1"
                          />
                        </td>
                        <td className="px-2 py-1">
                          <input
                            type="text"
                            value={row.mouldName}
                            onChange={(e) => handleInputChange(date, idx, 'mouldName', e.target.value)}
                            className="w-full border border-gray-300 rounded px-2 py-1"
                            placeholder="Mould Name"
                          />
                        </td>
                        <td className="px-2 py-1">
                          <input
                            type="number"
                            min="0"
                            value={row.weightOfBlock}
                            onChange={(e) => handleInputChange(date, idx, 'weightOfBlock', e.target.value)}
                            className="w-full border border-gray-300 rounded px-2 py-1"
                            placeholder="Weight"
                          />
                        </td>
                        <td className="px-2 py-1">
                          <input
                            type="number"
                            min="0"
                            value={row.noOfBlocks}
                            onChange={(e) => handleInputChange(date, idx, 'noOfBlocks', e.target.value)}
                            className="w-full border border-gray-300 rounded px-2 py-1"
                            placeholder="Blocks"
                          />
                        </td>
                        <td className="px-2 py-1 text-center text-gray-700 bg-gray-100">
                          {row.weightOfBlock && row.noOfBlocks
                            ? (parseFloat(row.weightOfBlock) * parseInt(row.noOfBlocks)).toFixed(2)
                            : ''}
                        </td>
                      </tr>
                    ))}
                    {/* Summary Row */}
                    <tr className="bg-yellow-100 font-semibold text-gray-900">
                      <td colSpan={4} className="text-right px-3 py-2">
                        Total for {date}
                      </td>
                      <td className="text-center">{totalBlocks}</td>
                      <td className="text-center">{totalWeight.toFixed(2)}</td>
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
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            Previous
          </button>

          <span className="text-gray-700 font-medium">
            Page {currentPage} of {totalPages || 1}
          </span>

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages || totalPages === 0}
            className={`px-4 py-2 rounded ${
              currentPage === totalPages || totalPages === 0
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            Next
          </button>
        </div>

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
                </>
)}
      </div>
    </>
  );
};

export default BlockMouldingReport;
