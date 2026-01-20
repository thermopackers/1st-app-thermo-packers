import React, { useEffect, useState } from "react";
import axiosInstance from "../axiosInstance";
import InternalNavbar from "../components/InternalNavbar";
import { motion } from "framer-motion";

export default function CustomerGiftsDashboard() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [giftItems, setGiftItems] = useState([]); // State for gift items
  const [loadingGifts, setLoadingGifts] = useState(true); // Loading state for gifts

  // search
  const [searchCustomer, setSearchCustomer] = useState("");
  const [searchGift, setSearchGift] = useState("");

  // pagination
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const limit = 10;

  // Fetch gift items from /purchase-products-all endpoint
  const fetchGiftItems = async () => {
    try {
      setLoadingGifts(true);
      const res = await axiosInstance.get("/purchase-products-all", {
        params: {
          isGiftItem: "true" // Only fetch gift items
        }
      });
      
      // Filter and sort gift items
      const giftItems = (res.data || [])
        .filter(item => item.isGiftItem) // Double-check it's a gift item
        .sort((a, b) => {
          // Sort by category first, then name
          const categoryA = a.giftCategory || "Other";
          const categoryB = b.giftCategory || "Other";
          
          if (categoryA < categoryB) return -1;
          if (categoryA > categoryB) return 1;
          
          // Same category, sort by name
          return a.name.localeCompare(b.name);
        });
      
      setGiftItems(giftItems);
    } catch (err) {
      console.error("❌ Failed to fetch gift items", err);
    } finally {
      setLoadingGifts(false);
    }
  };

  const fetchCustomers = async (pageNo = 1) => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("/customers", {
        params: {
          page: pageNo,
          limit,
          search: searchCustomer,
          giftType: searchGift
        }
      });

      setCustomers(res.data.customers || []);
      setPage(res.data.page);
      setPages(res.data.pages);
    } catch (err) {
      console.error("❌ Failed to fetch customers", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGiftItems(); // Fetch gift items on component mount
  }, []);

  useEffect(() => {
    fetchCustomers(page);
  }, [page, searchCustomer, searchGift]);

  // Get selected gift name for display
  const getSelectedGiftName = () => {
    if (searchGift === 'all_gifts') return '🎁 All Gifted Customers';
    if (searchGift === 'no_gifts') return '❌ No Gifts Received';
    if (!searchGift) return '';
    
    const selectedGift = giftItems.find(g => g._id === searchGift);
    return selectedGift ? selectedGift.name : '';
  };

  // Get selected gift details
  const getSelectedGiftDetails = () => {
    if (!searchGift || searchGift === 'all_gifts' || searchGift === 'no_gifts') return null;
    
    return giftItems.find(g => g._id === searchGift);
  };

  // Group gift items by category
  const groupGiftItemsByCategory = () => {
    const grouped = {};
    
    giftItems.forEach(item => {
      const category = item.giftCategory || "Other Gifts";
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(item);
    });
    
    return grouped;
  };

  return (
    <>
      <InternalNavbar />

      <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 pt-24 px-4">
        <div className="max-w-7xl mx-auto">

          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              🎁 Customer Gifts History
            </h1>
            <p className="text-gray-600">
              View and filter customer gift distributions
            </p>
          </div>

          {/* Search Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Customer Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Customer
              </label>
              <input
                type="text"
                placeholder="Customer name, phone, email..."
                value={searchCustomer}
                onChange={(e) => {
                  setSearchCustomer(e.target.value);
                  setPage(1);
                }}
                className="border rounded-xl px-4 py-3 shadow-sm w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Gift Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Gift Type
              </label>
              <div className="relative">
                <select
                  value={searchGift}
                  onChange={(e) => {
                    setSearchGift(e.target.value);
                    setPage(1);
                  }}
                  className="border rounded-xl px-4 py-3 shadow-sm bg-white w-full appearance-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={loadingGifts}
                >
                  <option value="">Select a gift type...</option>
                  <option value="all_gifts">🎁 All Gifted Customers</option>
                  <option value="no_gifts">❌ No Gifts Received</option>
                  
                  {/* Gift items grouped by category */}
                  {(() => {
                    const groupedGifts = groupGiftItemsByCategory();
                    
                    return Object.entries(groupedGifts).map(([category, items]) => (
                      <optgroup key={category} label={`🎁 ${category} (${items.length})`}>
                        {items.map(gift => (
                          <option key={gift._id} value={gift._id}>
                            {gift.name} 
                            {gift.stock !== undefined && (
                              ` (Stock: ${gift.stock} ${gift.unit || 'units'})`
                            )}
                          </option>
                        ))}
                      </optgroup>
                    ));
                  })()}
                </select>
                
                {/* Loading indicator */}
                {loadingGifts && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                  </div>
                )}
              </div>
              
              {/* Gift item details */}
              {getSelectedGiftDetails() && (
                <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-blue-800">
                        {getSelectedGiftDetails().name}
                      </h4>
                      <div className="text-sm text-blue-600">
                        Category: {getSelectedGiftDetails().giftCategory || "General"}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-blue-700">
                        Stock: {getSelectedGiftDetails().stock || 0} 
                        {getSelectedGiftDetails().unit && ` ${getSelectedGiftDetails().unit}`}
                      </div>
                      <div className="text-xs text-blue-500">
                        Available: {getSelectedGiftDetails().availableQuantity || 0}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Stats Summary */}
          {!loading && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-white p-4 rounded-xl shadow-sm border">
                <div className="text-sm text-gray-500">Total Customers</div>
                <div className="text-2xl font-bold text-gray-800">
                  {customers.length}
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-xl shadow-sm border">
                <div className="text-sm text-gray-500">Current Filter</div>
                <div className="text-lg font-semibold text-blue-600">
                  {searchGift ? getSelectedGiftName() : "All Gifts"}
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-xl shadow-sm border">
                <div className="text-sm text-gray-500">Total Gift Items</div>
                <div className="text-2xl font-bold text-green-600">
                  {giftItems.length}
                </div>
              </div>
            </div>
          )}

          {/* Active Filter Display */}
          {(searchGift || searchCustomer) && (
            <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
              <div className="flex flex-wrap gap-3 items-center">
                <span className="font-semibold text-blue-800 text-sm">Active Filters:</span>
                
                {searchCustomer && (
                  <span className="inline-flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-blue-300 text-sm">
                    <span className="text-blue-600">👤 Customer:</span>
                    <span className="font-medium">{searchCustomer}</span>
                    <button 
                      onClick={() => setSearchCustomer("")}
                      className="text-blue-500 hover:text-blue-700 text-xs ml-1"
                      title="Remove filter"
                    >
                      ✕
                    </button>
                  </span>
                )}
                
                {searchGift && (
                  <span className="inline-flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-blue-300 text-sm">
                    <span className="text-blue-600">🎁 Gift:</span>
                    <span className="font-medium">{getSelectedGiftName()}</span>
                    <button 
                      onClick={() => setSearchGift("")}
                      className="text-blue-500 hover:text-blue-700 text-xs ml-1"
                      title="Remove filter"
                    >
                      ✕
                    </button>
                  </span>
                )}
                
                {(searchGift || searchCustomer) && (
                  <button 
                    onClick={() => {
                      setSearchCustomer("");
                      setSearchGift("");
                    }}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium ml-2"
                  >
                    Clear All
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Content Section */}
          {loading ? (
            <div className="text-center py-16">
              <div className="inline-block animate-spin rounded-full h-14 w-14 border-b-2 border-blue-500 mb-4"></div>
              <p className="text-gray-600 text-lg">Loading gifts history...</p>
              <p className="text-gray-400 text-sm mt-2">
                Fetching customer data and gift records
              </p>
            </div>
          ) : customers.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl shadow-sm border">
              <div className="text-6xl mb-4 opacity-50">🎁</div>
              <p className="text-gray-500 text-lg mb-2">No customer records found</p>
              <p className="text-gray-400 mb-4">
                {searchCustomer || searchGift 
                  ? "Try adjusting your search filters" 
                  : "No customers have been added yet"}
              </p>
              {searchCustomer || searchGift ? (
                <button 
                  onClick={() => {
                    setSearchCustomer("");
                    setSearchGift("");
                  }}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Clear All Filters
                </button>
              ) : null}
            </div>
          ) : (
            <>
              {/* Customer Cards */}
              <div className="space-y-6">
                {customers.map((customer) => (
                  <motion.div
                    key={customer._id}
                    className="bg-white rounded-2xl shadow-lg p-6 border hover:shadow-xl transition-shadow"
                    whileHover={{ scale: 1.005 }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {/* Customer Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-5 pb-4 border-b">
                      <div>
                        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                          <span className="text-blue-500">👤</span>
                          {customer.name}
                          {customer.phone && (
                            <span className="text-gray-600 font-normal ml-2">
                              — 📱 {customer.phone}
                            </span>
                          )}
                        </h2>
                        {customer.email && (
                          <p className="text-gray-500 text-sm mt-1 flex items-center gap-1">
                            <span>✉️</span>
                            {customer.email}
                          </p>
                        )}
                        {customer.company && (
                          <p className="text-gray-500 text-sm mt-1 flex items-center gap-1">
                            <span>🏢</span>
                            {customer.company}
                          </p>
                        )}
                      </div>
                      
                      <div className="mt-3 md:mt-0">
                        <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full">
                          <span className="font-semibold">
                            {customer.giftHistory?.length || 0}
                          </span>
                          <span className="text-sm">
                            gift{customer.giftHistory?.length !== 1 ? 's' : ''} received
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Gift History */}
                    {customer.giftHistory && customer.giftHistory.length > 0 ? (
                      <div className="mt-4">
                        <h3 className="font-medium text-gray-700 mb-3 text-sm uppercase tracking-wider">
                          Gift History
                        </h3>
                        <div className="overflow-x-auto rounded-lg border">
                          <table className="w-full">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="p-3 text-left text-sm font-semibold text-gray-700">Gift</th>
                                <th className="p-3 text-left text-sm font-semibold text-gray-700">Category</th>
                                <th className="p-3 text-left text-sm font-semibold text-gray-700">Qty</th>
                                <th className="p-3 text-left text-sm font-semibold text-gray-700">Date</th>
                                <th className="p-3 text-left text-sm font-semibold text-gray-700">Notes</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {customer.giftHistory.map((gift, idx) => (
                                <tr 
                                  key={idx} 
                                  className="hover:bg-gray-50 transition-colors"
                                >
                                  <td className="p-3">
                                    <div className="font-medium text-gray-800">
                                      {gift.giftType?.name || "Unknown Gift"}
                                    </div>
                                  </td>
                                  <td className="p-3">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                      {gift.giftType?.giftCategory || "General"}
                                    </span>
                                  </td>
                                  <td className="p-3">
                                    <div className="flex items-center">
                                      <span className="font-semibold text-gray-800 mr-2">
                                        {gift.quantity}
                                      </span>
                                      {gift.giftType?.unit && (
                                        <span className="text-sm text-gray-500">
                                          {gift.giftType.unit}
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="p-3">
                                    <div className="text-gray-700 whitespace-nowrap">
                                      {new Date(gift.date).toLocaleDateString('en-IN', {
                                        day: '2-digit',
                                        month: 'short',
                                        year: 'numeric'
                                      })}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {new Date(gift.date).toLocaleTimeString('en-IN', {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}
                                    </div>
                                  </td>
                                  <td className="p-3">
                                    <div className="max-w-xs">
                                      {gift.notes ? (
                                        <div className="text-gray-600 text-sm bg-gray-50 p-2 rounded">
                                          {gift.notes}
                                        </div>
                                      ) : (
                                        <span className="text-gray-400 text-sm">-</span>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-400">
                        <div className="text-4xl mb-3 opacity-30">🎁</div>
                        <p className="text-gray-500">No gifts issued to this customer</p>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>

              {/* Pagination */}
              {pages > 1 && (
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-10 pb-10 pt-6 border-t">
                  <div className="text-sm text-gray-600">
                    Showing <span className="font-semibold">{customers.length}</span> customers
                    on page <span className="font-semibold">{page}</span> of <span className="font-semibold">{pages}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      disabled={page === 1}
                      onClick={() => setPage(page - 1)}
                      className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 text-sm"
                    >
                      <span>←</span>
                      Previous
                    </button>
                    
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, pages) }, (_, i) => {
                        let pageNum;
                        if (pages <= 5) {
                          pageNum = i + 1;
                        } else if (page <= 3) {
                          pageNum = i + 1;
                        } else if (page >= pages - 2) {
                          pageNum = pages - 4 + i;
                        } else {
                          pageNum = page - 2 + i;
                        }
                        
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setPage(pageNum)}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${
                              page === pageNum
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                    
                    <button
                      disabled={page === pages}
                      onClick={() => setPage(page + 1)}
                      className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 text-sm"
                    >
                      Next
                      <span>→</span>
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </>
  );
}