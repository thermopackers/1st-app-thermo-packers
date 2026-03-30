import React, { useEffect, useState } from 'react';
import axiosInstance from '../axiosInstance';
import InternalNavbar from '../components/InternalNavbar';
import { useUserContext } from '../context/UserContext';
import toast from 'react-hot-toast';
import { debounce } from 'lodash';

// Helper function to parse roles properly
const parseUserRoles = (user) => {
  if (!user || !user.role) {
    return [];
  }
  
  let userRoles = [];
  if (Array.isArray(user.role)) {
    if (user.role.length > 0 && typeof user.role[0] === 'string' && user.role[0].startsWith('[')) {
      try {
        userRoles = JSON.parse(user.role[0]);
      } catch (parseError) {
        userRoles = user.role;
      }
    } else {
      userRoles = user.role;
    }
  } else if (typeof user.role === 'string') {
    try {
      userRoles = JSON.parse(user.role);
    } catch (parseError) {
      userRoles = [user.role];
    }
  } else {
    userRoles = [user.role];
  }
  return userRoles;
};

const ROWS_PER_PAGE = 20;

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

  // Parse user roles properly
  const userRoles = user ? parseUserRoles(user) : [];

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

    if (userRoles.includes('accounts') || userRoles.includes('packaging')) {
      fetchData();
    }
  }, [user, currentPage, searchTerm, filterDate, userRoles]);

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
      pcsPerPacket: '',
      productWeight: '',
      dryWeight: '',
      polytheneSize: '',
      packedQty: '',
      dispatchQty: '',
      balanceStock: '',
      tapeUsed: '',
      isNew: true,
    };

    const updated = {
      ...groupedData,
      [today]: groupedData[today] ? [...groupedData[today], newRow] : [newRow],
    };

    updated[today] = updated[today].map((r, idx) => ({
      ...r,
      srNo: idx + 1,
    }));
    
    setGroupedData(updated);
    
    // Find which page today's date belongs to
    const allDates = Object.keys(updated).sort((a, b) => new Date(b) - new Date(a));
    const dateIndex = allDates.indexOf(today);
    if (dateIndex !== -1) {
      const newPage = Math.floor(dateIndex / ROWS_PER_PAGE) + 1;
      setCurrentPage(newPage);
    }
  };

  // Function to get pcsPerPacket for a product
  const getPcsPerPacket = (productName) => {
    if (!productName || !productOptions.length) return '';
    const product = productOptions.find(p => (p.productName || p.name) === productName);
    return product?.pcsPerPacket || '';
  };

  // Auto-fill pcsPerPacket when product is selected
  const handleProductChange = (date, idx, value) => {
    const updated = { ...groupedData };
    const pcsPerPacket = getPcsPerPacket(value);
    updated[date][idx] = {
      ...updated[date][idx],
      productionProduct: value,
      pcsPerPacket: pcsPerPacket,
    };
    setGroupedData(updated);
  };

  // Function to calculate packet display text
  const getPacketDisplay = (quantity, pcsPerPacket) => {
    if (!quantity || quantity === 0 || !pcsPerPacket || pcsPerPacket === 0) {
      return `${quantity || 0} pcs`;
    }
    
    const qty = parseFloat(quantity);
    const pcsPerPkt = parseFloat(pcsPerPacket);
    
    const fullPackets = Math.floor(qty / pcsPerPkt);
    const remainingPcs = qty % pcsPerPkt;
    
    if (fullPackets === 0) {
      return `${qty} pcs (0+${remainingPcs})`;
    } else if (remainingPcs === 0) {
      return `${qty} pcs (${fullPackets})`;
    } else {
      return `${qty} pcs (${fullPackets}+${remainingPcs})`;
    }
  };

  // Handle packed quantity change
  const handlePackedQtyChange = (date, idx, value) => {
    const updated = { ...groupedData };
    updated[date][idx] = {
      ...updated[date][idx],
      packedQty: value,
    };
    setGroupedData(updated);
  };

  // Handle dispatch quantity change
  const handleDispatchQtyChange = (date, idx, value) => {
    const updated = { ...groupedData };
    updated[date][idx] = {
      ...updated[date][idx],
      dispatchQty: value,
    };
    setGroupedData(updated);
  };

  // Handle balance stock change
  const handleBalanceStockChange = (date, idx, value) => {
    const updated = { ...groupedData };
    updated[date][idx] = {
      ...updated[date][idx],
      balanceStock: value,
    };
    setGroupedData(updated);
  };

  const handleDeleteRow = async (date, index) => {
    const updated = { ...groupedData };
    const row = updated[date]?.[index];
    if (!row) return;

    // If saved (has _id), delete from DB
    if (row._id) {
      try {
        await axiosInstance.delete(`/packaging-report/delete/${row._id}`, {
          headers: { 
            Authorization: `Bearer ${user?.token}`
          },
        });
        toast.success("Row deleted from server.");
      } catch (err) {
        console.error("Delete error:", err);
        if (err.response?.status === 403) {
          toast.error("Permission denied. You need accounts or packaging role.");
        } else if (err.response?.status === 401) {
          toast.error("Authentication failed. Please login again.");
        } else {
          toast.error("Failed to delete row from server.");
        }
        return;
      }
    }

    // Remove from UI
    updated[date].splice(index, 1);
    if (updated[date].length === 0) {
      delete updated[date];
    } else {
      updated[date] = updated[date].map((r, idx) => ({
        ...r,
        srNo: idx + 1,
      }));
    }

    setGroupedData(updated);
  };

  const handleSave = async () => {
    const flatData = Object.values(groupedData).flat();
    try {
      await axiosInstance.post('/packaging-report/packaging-report-update', flatData, {
        headers: { Authorization: `Bearer ${user.token}` },
      });

      // Remove isNew after saving
      const cleaned = {};
      for (const date in groupedData) {
        cleaned[date] = groupedData[date].map(({ isNew, ...rest }) => rest);
      }

      setGroupedData(cleaned);
      toast.success('Data saved successfully!');
    } catch (err) {
      toast.error('Failed to save data');
      console.error(err);
    }
  };

  // Use userRoles for access control
  if (!(userRoles.includes('accounts') || userRoles.includes('packaging'))) {
    return (
      <>
        <InternalNavbar />
        <div className="w-screen px-4 mt-8 mb-12">
          <div className="text-center py-10">
            <h2 className="text-xl font-bold text-red-600">Access Denied</h2>
            <p className="text-gray-600">You don't have permission to access this page.</p>
          </div>
        </div>
      </>
    );
  }

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
            <table className="w-full text-sm table-fixed">
              <thead className="bg-blue-600 text-white">
                <tr>
                  <th className="px-3 py-2 text-center w-12">Sr No.</th>
                  <th className="px-3 py-2 text-center w-24">Date</th>
                  <th className="px-3 py-2 text-center w-28">Lady Name</th>
                  <th className="px-3 py-2 text-center w-40">Product in Production</th>
                  <th className="px-3 py-2 text-center w-20">No. of Pcs in 1 Packet</th>
                  <th className="px-3 py-2 text-center w-24">Wet Weight (g)</th>
                  <th className="px-3 py-2 text-center w-24">Dry Weight (g)</th>
                  <th className="px-3 py-2 text-center w-24">Polythene Size</th>
                  <th className="px-3 py-2 text-center w-36">Packed Qty (Pcs & Packets)</th>
                  <th className="px-3 py-2 text-center w-36">Total Dispatch (Pcs & Packets)</th>
                  <th className="px-3 py-2 text-center w-36">Balance Stock (Pcs & Packets)</th>
                  <th className="px-3 py-2 text-center w-20">Tape Used</th>
                  <th className="px-3 py-2 text-center w-16">Actions</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(groupedData).length === 0 ? (
                  <tr>
                    <td colSpan={13} className="text-center py-4 text-gray-500">No data available</td>
                  </tr>
                ) : (
                  (() => {
                    // Get all dates from groupedData (already paginated by backend)
                    const dates = Object.keys(groupedData).sort((a, b) => new Date(b) - new Date(a));
                    let serialNo = (currentPage - 1) * ROWS_PER_PAGE;

                    return dates.map((date) => {
                      const rows = groupedData[date];
                      const totalPackedQty = rows.reduce((sum, r) => sum + (parseFloat(r.packedQty) || 0), 0);
                      const totalDispatchQty = rows.reduce((sum, r) => sum + (parseFloat(r.dispatchQty) || 0), 0);
                      const totalBalanceStock = rows.reduce((sum, r) => sum + (parseFloat(r.balanceStock) || 0), 0);
                      
                      // Calculate total packets for summary (using first row's pcsPerPacket as reference)
                      const firstRowPcsPerPacket = rows[0]?.pcsPerPacket;
                      const totalPacketDisplay = firstRowPcsPerPacket ? 
                        getPacketDisplay(totalPackedQty, firstRowPcsPerPacket) : `${totalPackedQty} pcs`;

                      return (
                        <React.Fragment key={date}>
                          {rows.map((row, idx) => {
                            serialNo += 1;
                            const packedDisplay = getPacketDisplay(row.packedQty, row.pcsPerPacket);
                            const dispatchDisplay = getPacketDisplay(row.dispatchQty, row.pcsPerPacket);
                            const balanceDisplay = getPacketDisplay(row.balanceStock, row.pcsPerPacket);

                            return (
                              <tr
                                key={`${date}-${idx}`}
                                className={
                                  row.isNew
                                    ? 'bg-green-200 border-green-500'
                                    : idx % 2 === 0
                                    ? 'bg-gray-50'
                                    : ''
                                }
                              >
                                <td className="px-2 py-1 text-center">{serialNo}</td>
                                <td className="px-2 py-1 text-center">
                                  <input
                                    type="date"
                                    value={row.date}
                                    max={new Date().toISOString().split('T')[0]}
                                    onChange={(e) => handleInputChange(date, idx, 'date', e.target.value)}
                                    className="border rounded px-2 py-1 w-full"
                                  />
                                </td>
                                <td className="px-2 py-1">
                                  <input
                                    type="text"
                                    value={row.ladyName || ''}
                                    onChange={(e) => handleInputChange(date, idx, 'ladyName', e.target.value)}
                                    className="border rounded px-2 py-1 w-full min-w-[110px]"
                                    placeholder="Name"
                                  />
                                </td>
                                <td className="px-2 py-1">
                                  <input
                                    list={`product-options-${date}-${idx}`}
                                    value={row.productionProduct || ''}
                                    onChange={(e) => handleProductChange(date, idx, e.target.value)}
                                    className="border rounded px-2 py-1 w-full min-w-[150px]"
                                    placeholder="Type or select product"
                                  />
                                  <datalist id={`product-options-${date}-${idx}`}>
                                    {productOptions.map((prod, i) => (
                                      <option key={i} value={prod.productName || prod.name} />
                                    ))}
                                  </datalist>
                                </td>
                                <td className="px-2 py-1 text-center">
                                  <input
                                    type="text"
                                    value={row.pcsPerPacket || ''}
                                    readOnly
                                    className="border rounded px-2 py-1 w-full bg-gray-100 text-center"
                                    placeholder="Auto"
                                  />
                                </td>
                                <td className="px-2 py-1">
                                  <input
                                    type="number"
                                    value={row.productWeight || ''}
                                    onChange={(e) => handleInputChange(date, idx, 'productWeight', e.target.value)}
                                    className="border rounded px-2 py-1 w-full"
                                    placeholder="Grams"
                                  />
                                </td>
                                <td className="px-2 py-1">
                                  <input
                                    type="number"
                                    value={row.dryWeight || ''}
                                    onChange={(e) => handleInputChange(date, idx, 'dryWeight', e.target.value)}
                                    className="border rounded px-2 py-1 w-full"
                                    placeholder="Dry (grams)"
                                  />
                                </td>
                                <td className="px-2 py-1">
                                  <input
                                    type="text"
                                    value={row.polytheneSize || ''}
                                    onChange={(e) => handleInputChange(date, idx, 'polytheneSize', e.target.value)}
                                    className="border rounded px-2 py-1 w-full"
                                    placeholder="Size"
                                  />
                                </td>
                                <td className="px-2 py-1">
                                  <div className="flex flex-col gap-1">
                                    <input
                                      type="number"
                                      value={row.packedQty || ''}
                                      onChange={(e) => handlePackedQtyChange(date, idx, e.target.value)}
                                      className="border rounded px-2 py-1 w-full"
                                      placeholder="Enter pcs"
                                    />
                                    {row.packedQty && row.pcsPerPacket && (
                                      <span className="text-xs text-green-600 font-medium bg-green-50 px-2 py-1 rounded">
                                        {packedDisplay}
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-2 py-1">
                                  <div className="flex flex-col gap-1">
                                    <input
                                      type="number"
                                      value={row.dispatchQty || ''}
                                      onChange={(e) => handleDispatchQtyChange(date, idx, e.target.value)}
                                      className="border rounded px-2 py-1 w-full"
                                      placeholder="Enter pcs"
                                    />
                                    {row.dispatchQty && row.pcsPerPacket && (
                                      <span className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-1 rounded">
                                        {dispatchDisplay}
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-2 py-1">
                                  <div className="flex flex-col gap-1">
                                    <input
                                      type="number"
                                      value={row.balanceStock || ''}
                                      onChange={(e) => handleBalanceStockChange(date, idx, e.target.value)}
                                      className="border rounded px-2 py-1 w-full"
                                      placeholder="Enter pcs"
                                    />
                                    {row.balanceStock && row.pcsPerPacket && (
                                      <span className="text-xs text-purple-600 font-medium bg-purple-50 px-2 py-1 rounded">
                                        {balanceDisplay}
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-2 py-1">
                                  <input
                                    type="number"
                                    value={row.tapeUsed || ''}
                                    onChange={(e) => handleInputChange(date, idx, 'tapeUsed', e.target.value)}
                                    className="border rounded px-2 py-1 w-full"
                                    placeholder="Tapes"
                                  />
                                </td>
                                <td className="px-2 py-1 text-center">
                                  <button
                                    onClick={() => handleDeleteRow(date, idx)}
                                    className="text-red-600 hover:text-red-800 text-sm font-medium whitespace-nowrap"
                                  >
                                    Delete
                                  </button>
                                </td>
                              </tr>
                            );
                          })}

                          {/* Total Row for each date */}
                          <tr className="bg-yellow-100 font-semibold text-gray-900">
                            <td colSpan={8} className="text-right px-3 py-2">
                              Total for {date}
                            </td>
                            <td className="text-center font-bold">
                              {totalPackedQty} pcs
                              {firstRowPcsPerPacket && (
                                <div className="text-xs text-green-700">
                                  {getPacketDisplay(totalPackedQty, firstRowPcsPerPacket)}
                                </div>
                              )}
                            </td>
                            <td className="text-center font-bold">
                              {totalDispatchQty} pcs
                              {firstRowPcsPerPacket && (
                                <div className="text-xs text-blue-700">
                                  {getPacketDisplay(totalDispatchQty, firstRowPcsPerPacket)}
                                </div>
                              )}
                            </td>
                            <td className="text-center font-bold">
                              {totalBalanceStock} pcs
                              {firstRowPcsPerPacket && (
                                <div className="text-xs text-purple-700">
                                  {getPacketDisplay(totalBalanceStock, firstRowPcsPerPacket)}
                                </div>
                              )}
                            </td>
                            <td colSpan={2}></td>
                          </tr>
                        </React.Fragment>
                      );
                    });
                  })()
                )}
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