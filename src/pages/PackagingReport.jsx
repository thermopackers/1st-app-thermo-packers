import React, { useEffect, useState } from 'react';
import axiosInstance from '../axiosInstance';
import InternalNavbar from '../components/InternalNavbar';
import { useUserContext } from '../context/UserContext';
import toast from 'react-hot-toast';
import { debounce } from 'lodash';

const ROWS_PER_PAGE = 5;

const PackagingReport = () => {
  const { user } = useUserContext();
  const [groupedData, setGroupedData] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [productOptions, setProductOptions] = useState([]);
  const [rawSearchTerm, setRawSearchTerm] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const debounced = debounce(() => {
      setSearchTerm(rawSearchTerm);
      setCurrentPage(1);
    }, 600);
    debounced();
    return () => debounced.cancel();
  }, [rawSearchTerm]);
useEffect(() => {
  const fetchProducts = async () => {
    try {
      const res = await axiosInstance.get('/products/all-backend-products', {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setProductOptions(res.data || []);
    } catch (err) {
      console.error('Failed to load product list', err);
    }
  };

  if (user) fetchProducts();
}, [user]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await axiosInstance.get('/packaging-report/get-packaging-report', {
          params: {
            page: currentPage,
            limit: ROWS_PER_PAGE,
            search: searchTerm,
            date: filterDate,
          },
          headers: { Authorization: `Bearer ${user.token}` },
        });

        if (res.data?.data) {
          setGroupedData(res.data.data);
          setTotalPages(res.data.totalPages);
        }
      } catch (err) {
        toast.error('Error fetching packaging report');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (user.role === 'accounts' || user.role === 'packaging') {
      fetchData();
    }
  }, [user, currentPage, searchTerm, filterDate]);

  const handleInputChange = (date, index, field, value) => {
    const updated = { ...groupedData };
    updated[date][index] = {
      ...updated[date][index],
      [field]: value,
    };
    setGroupedData(updated);
  };

  const handleAddRow = () => {
    const today = new Date().toISOString().split('T')[0];
    const newRow = {
      srNo: (groupedData[today]?.length || 0) + 1,
      date: today,
      ladyName: '',
      productionProduct: '',
      productWeight: '',
      dryWeight: '',
      polytheneSize: '',
      packedQty: '',
      balanceStock: '',
      tapeUsed: '',
    };

    const updated = {
      ...groupedData,
      [today]: groupedData[today] ? [...groupedData[today], newRow] : [newRow],
    };

    setGroupedData(updated);
    setCurrentPage(1);
  };

  const handleSave = async () => {
    const flatData = Object.values(groupedData).flat();
    try {
      await axiosInstance.post('/packaging-report/packaging-report-update', flatData, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      toast.success('Data saved successfully!');
    } catch (err) {
      toast.error('Failed to save data');
      console.error(err);
    }
  };

  const paginatedDates = Object.keys(groupedData).sort((a, b) => new Date(b) - new Date(a));

  if (!(user.role === 'accounts' || user.role === 'packaging')) return null;

  return (
    <>
      <InternalNavbar />
      <div className="w-screen px-4 mt-8 mb-12">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Daily Shape Moulding Section, Packaging & Dispatch Report</h2>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
          <input
            type="text"
placeholder="Search Lady or Product"
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

        {/* Actions */}
        <div className="flex gap-4 mb-4">
          <button
            onClick={handleAddRow}
            className="px-5 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Add Row
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Save
          </button>
        </div>

        {/* Table */}
        {loading ? (
          <p className="text-center py-10 text-blue-600">Loading...</p>
        ) : (
          <div className="w-full overflow-x-auto shadow rounded border border-gray-300">
            <table className="w-full text-sm table-auto">
              <thead className="bg-blue-600 text-white">
                <tr>
                  {[
                    'Sr No.', 'Date', 'Lady Name', 'Product in Production', 'Wet Weight (g)',
                    'Dry Weight (g)', 'Polythene Size', 'Packed Qty(material should be packed Dry)',
                    'Balance Stock in Factory(Old Stock + New Packed Material)', 'No. of Tape Used'
                  ].map((head) => (
                    <th key={head} className="px-3 py-2 text-center">{head}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedDates.length === 0 && (
                  <tr>
                    <td colSpan={10} className="text-center py-4 text-gray-500">No data available</td>
                  </tr>
                )}
               {paginatedDates.map((date) => {
  const rows = groupedData[date];
  const totalPackedQty = rows.reduce((sum, r) => sum + (parseFloat(r.packedQty) || 0), 0);

  return (
    <React.Fragment key={date}>
      {rows.map((row, idx) => (
        <tr key={`${date}-${idx}`} className={idx % 2 === 0 ? 'bg-gray-50' : ''}>
          <td className="px-2 py-1 text-center">{row.srNo}</td>
          <td className="px-2 py-1 text-center">
            <input
  type="date"
  value={row.date}
  max={new Date().toISOString().split('T')[0]} // restrict to today
  onChange={(e) => handleInputChange(date, idx, 'date', e.target.value)}
  className="border rounded px-2 py-1 w-full"
/>

          </td>
          <td className="px-2 py-1">
            <input
              type="text"
              value={row.ladyName}
              onChange={(e) => handleInputChange(date, idx, 'ladyName', e.target.value)}
              className="border rounded px-2 py-1 w-full"
              placeholder="Name"
            />
          </td>
          <td className="px-2 py-1">
          <input
  list={`product-options-${date}-${idx}`}
  value={row.productionProduct}
  onChange={(e) => handleInputChange(date, idx, 'productionProduct', e.target.value)}
  className="border rounded px-2 py-1 w-full"
  placeholder="Type or select product"
/>

<datalist id={`product-options-${date}-${idx}`}>
  {productOptions.map((prod, i) => (
    <option key={i} value={prod.productName || prod.name} />
  ))}
</datalist>

          </td>
          <td className="px-2 py-1">
            <input
              type="number"
              value={row.productWeight}
              onChange={(e) => handleInputChange(date, idx, 'productWeight', e.target.value)}
              className="border rounded px-2 py-1 w-full"
placeholder="Grams"
            />
          </td>
          <td className="px-2 py-1">
            <input
              type="number"
              value={row.dryWeight}
              onChange={(e) => handleInputChange(date, idx, 'dryWeight', e.target.value)}
              className="border rounded px-2 py-1 w-full"
              placeholder="Dry (grams)"
            />
          </td>
          <td className="px-2 py-1">
            <input
              type="text"
              value={row.polytheneSize}
              onChange={(e) => handleInputChange(date, idx, 'polytheneSize', e.target.value)}
              className="border rounded px-2 py-1 w-full"
              placeholder="Size"
            />
          </td>
          <td className="px-2 py-1">
            <input
              type="number"
              value={row.packedQty}
              onChange={(e) => handleInputChange(date, idx, 'packedQty', e.target.value)}
              className="border rounded px-2 py-1 w-full"
              placeholder="Qty"
            />
          </td>
          <td className="px-2 py-1">
            <input
              type="number"
              value={row.balanceStock}
              onChange={(e) => handleInputChange(date, idx, 'balanceStock', e.target.value)}
              className="border rounded px-2 py-1 w-full"
              placeholder="Balance"
            />
          </td>
          <td className="px-2 py-1">
            <input
              type="number"
              value={row.tapeUsed}
              onChange={(e) => handleInputChange(date, idx, 'tapeUsed', e.target.value)}
              className="border rounded px-2 py-1 w-full"
              placeholder="Tapes"
            />
          </td>
        </tr>
      ))}

      {/* ✅ Total Row */}
      <tr className="bg-yellow-100 font-semibold text-gray-900">
        <td colSpan={7} className="text-right px-3 py-2">
          Total Packed Qty for {date}
        </td>
        <td className="text-center">{totalPackedQty}</td>
        <td colSpan={2}></td>
      </tr>
    </React.Fragment>
  );
})}

              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="flex justify-between items-center mt-6">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
          >
            Previous
          </button>
          <span>Page {currentPage} of {totalPages || 1}</span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
          >
            Next
          </button>
        </div>
      </div>
    </>
  );
};

export default PackagingReport;
