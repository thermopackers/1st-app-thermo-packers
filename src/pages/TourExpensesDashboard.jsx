import { useEffect, useState } from "react";
import axiosInstance from "../axiosInstance";
import { useUserContext } from "../context/UserContext";
import { toast } from "react-hot-toast";
import InternalNavbar from "../components/InternalNavbar";
import Swal from "sweetalert2";
import { motion, AnimatePresence } from "framer-motion";

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

export default function TourExpensesDashboard() {
  const { user, loading: userLoading } = useUserContext();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterName, setFilterName] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  // ✅ Get user roles properly
  const userRoles = user ? parseUserRoles(user) : [];
  const isAccounts = userRoles.includes("accounts");

  // All your existing functions remain exactly the same...
  const fetchExpenses = async (nameFilter = "", pageNumber = 1) => {
    try {
      const res = await axiosInstance.get("/tour-expenses", {
        params: {
          salesName: nameFilter || undefined,
          page: pageNumber,
          limit: 10,
        },
      });
      setExpenses(res.data.expenses);
      setPages(res.data.pages);
      setPage(res.data.page);
    } catch (err) {
      toast.error("Failed to load expenses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!userLoading && user) {
      fetchExpenses(filterName, page);
    }
  }, [userLoading, user, page]);

  const handleFilter = () => {
    setPage(1);
    fetchExpenses(filterName, 1);
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        await axiosInstance.delete(`/tour-expenses/${id}`);
        toast.success('Expense deleted successfully');
        fetchExpenses(filterName, page);
      } catch (err) {
        toast.error('Failed to delete expense');
        console.error(err);
      }
    }
  };

  if (userLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white to-blue-50 flex items-center justify-center">
        <div className="bg-white rounded-xl p-6 shadow-sm flex items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-700">Loading user information...</span>
        </div>
      </div>
    );
  }

  // Loading Component
  const LoadingOverlay = () => (
    <div className="flex justify-center items-center py-12">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Loading expenses...</p>
      </div>
    </div>
  );

  return (
    <>
      <InternalNavbar />
      
      {/* Main Container */}
      <div className="min-h-screen bg-gradient-to-br from-white to-blue-50 py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          
          {/* Header Section */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                {/* ✅ FIX: Use isAccounts variable */}
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 flex items-center gap-3">
                  <span className="bg-purple-100 text-purple-800 p-3 rounded-xl">✈️</span>
                  {isAccounts ? "All Tour Expenses" : "My Tour Expenses"}
                </h1>
                <p className="text-gray-600 mt-2">
                  Track and manage tour expenses with detailed reporting
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                  Page {page} of {pages}
                </span>
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                  {expenses.length} expenses
                </span>
              </div>
            </div>
          </div>

          {/* ✅ FIX: Filter Section for Accounts - use isAccounts variable */}
          {isAccounts && (
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <div className="flex flex-col sm:flex-row gap-4 items-center">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Filter by Sales Employee
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500">🔍</span>
                    </div>
                    <input
                      type="text"
                      value={filterName}
                      onChange={(e) => setFilterName(e.target.value)}
                      placeholder="Enter sales employee name..."
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    />
                  </div>
                </div>
                <motion.button
                  onClick={handleFilter}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium mt-6 sm:mt-0"
                >
                  Apply Filter
                </motion.button>
              </div>
            </div>
          )}

          {/* Expenses Table */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {loading ? (
              <LoadingOverlay />
            ) : expenses.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📊</div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">No Expenses Found</h3>
                <p className="text-gray-600">
                  {filterName ? "No expenses match your filter criteria" : "No tour expenses recorded yet"}
                </p>
              </div>
            ) : (
              <>
                {/* Mobile Cards View */}
                <div className="lg:hidden space-y-4 p-4">
                  {expenses.map((exp) => {
                    const moneyTakenTotal = exp.moneyTaken?.reduce((sum, m) => sum + (parseFloat(m.amount) || 0), 0) || 0;
                    const balance = moneyTakenTotal - exp.total;

                    return (
                      <motion.div
                        key={exp._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        {/* Header */}
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            {/* ✅ FIX: Use isAccounts variable */}
                            {isAccounts && (
                              <div className="text-sm text-gray-600 mb-1">{exp.user?.name || "—"}</div>
                            )}
                            <h4 className="font-bold text-gray-900">{exp.location}</h4>
                            <p className="text-gray-600 text-sm">
                              {new Date(exp.startDate).toLocaleDateString("en-GB")} – {new Date(exp.endDate).toLocaleDateString("en-GB")}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-green-600">₹{exp.total}</div>
                            <div className={`text-sm font-semibold ${
                              balance >= 0 ? "text-green-600" : "text-red-600"
                            }`}>
                              {balance >= 0 ? `₹${balance} Remaining` : `₹${Math.abs(balance)} Over`}
                            </div>
                          </div>
                        </div>

                        {/* Expenses List */}
                        <div className="mb-3">
                          <h5 className="font-medium text-gray-700 text-sm mb-2">Expenses:</h5>
                          <div className="space-y-1">
                            {exp.expenses.map((e, idx) => (
                              <div key={idx} className="flex justify-between text-sm">
                                <span className="text-gray-600">{e.description}</span>
                                <span className="text-green-700 font-medium">₹{e.amount}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Money Taken */}
                        {exp.moneyTaken?.length > 0 && (
                          <div className="mb-3">
                            <h5 className="font-medium text-gray-700 text-sm mb-2">Money Taken:</h5>
                            <div className="space-y-1">
                              {exp.moneyTaken.map((m, idx) => (
                                <div key={idx} className="flex justify-between text-sm">
                                  <div>
                                    <span className="text-gray-600">
                                      {new Date(m.date).toLocaleDateString("en-GB")}
                                    </span>
                                    {m.remarks && (
                                      <span className="text-gray-500 text-xs ml-2">({m.remarks})</span>
                                    )}
                                  </div>
                                  <span className="text-blue-600 font-medium">₹{m.amount}</span>
                                </div>
                              ))}
                              <div className="flex justify-between text-sm font-semibold border-t pt-1">
                                <span>Total Taken:</span>
                                <span className="text-blue-600">₹{moneyTakenTotal}</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Files */}
                        {exp.files.length > 0 && (
                          <div className="mb-3">
                            <h5 className="font-medium text-gray-700 text-sm mb-2">Files:</h5>
                            <div className="flex flex-wrap gap-2">
                              {exp.files.map((fileData, idx) => (
                                <button
                                  key={idx}
                                  onClick={() =>
                                    Swal.fire({
                                      title: `File ${idx + 1}`,
                                      html: `<iframe src="${fileData.url}" style="width:100%;height:500px;" frameborder="0"></iframe>`,
                                      width: "80%",
                                      showCloseButton: true,
                                      showConfirmButton: false,
                                    })
                                  }
                                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded text-sm transition-colors"
                                >
                                  📄 File {idx + 1}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* ✅ FIX: Delete Action for Accounts - use isAccounts variable */}
                        {isAccounts && (
                          <div className="flex justify-end pt-3 border-t">
                            <button
                              onClick={() => handleDelete(exp._id)}
                              className="bg-red-100 text-red-700 hover:bg-red-200 px-3 py-1 rounded text-sm transition-colors flex items-center gap-1"
                            >
                              🗑️ Delete
                            </button>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>

                {/* Desktop Table View */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        {/* ✅ FIX: Use isAccounts variable */}
                        {isAccounts && (
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Sales Employee
                          </th>
                        )}
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tour Details
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Expenses
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Financial Summary
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Files
                        </th>
                        {/* ✅ FIX: Use isAccounts variable */}
                        {isAccounts && (
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {expenses.map((exp) => {
                        const moneyTakenTotal = exp.moneyTaken?.reduce((sum, m) => sum + (parseFloat(m.amount) || 0), 0) || 0;
                        const balance = moneyTakenTotal - exp.total;

                        return (
                          <motion.tr
                            key={exp._id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="hover:bg-gray-50 transition-colors"
                          >
                            {/* ✅ FIX: Sales Employee Column - use isAccounts variable */}
                            {isAccounts && (
                              <td className="px-6 py-4">
                                <div className="text-sm font-medium text-gray-900">{exp.user?.name || "—"}</div>
                              </td>
                            )}

                            {/* Tour Details Column */}
                            <td className="px-6 py-4">
                              <div className="space-y-2">
                                <div className="font-medium text-gray-900">{exp.location}</div>
                                <div className="text-sm text-gray-600">
                                  {new Date(exp.startDate).toLocaleDateString("en-GB")} – {new Date(exp.endDate).toLocaleDateString("en-GB")}
                                </div>
                              </div>
                            </td>

                            {/* Expenses Column */}
                            <td className="px-6 py-4">
                              <div className="space-y-2 max-w-xs">
                                {exp.expenses.map((e, idx) => (
                                  <div key={idx} className="flex justify-between text-sm">
                                    <span className="text-gray-600 truncate">{e.description}</span>
                                    <span className="text-green-700 font-medium ml-2">₹{e.amount}</span>
                                  </div>
                                ))}
                                <div className="flex justify-between text-sm font-bold border-t pt-2">
                                  <span>Total:</span>
                                  <span className="text-green-600">₹{exp.total}</span>
                                </div>
                              </div>
                            </td>

                            {/* Financial Summary Column */}
                            <td className="px-6 py-4">
                              <div className="space-y-3">
                                {/* Money Taken */}
                                {exp.moneyTaken?.length > 0 && (
                                  <div>
                                    <div className="text-xs font-medium text-gray-600 mb-1">Money Taken</div>
                                    <div className="space-y-1">
                                      {exp.moneyTaken.map((m, idx) => (
                                        <div key={idx} className="flex justify-between text-sm">
                                          <div>
                                            <span className="text-gray-600">
                                              {new Date(m.date).toLocaleDateString("en-GB")}
                                            </span>
                                            {m.remarks && (
                                              <span className="text-gray-500 text-xs ml-1">({m.remarks})</span>
                                            )}
                                          </div>
                                          <span className="text-blue-600">₹{m.amount}</span>
                                        </div>
                                      ))}
                                      <div className="flex justify-between text-sm font-semibold border-t pt-1">
                                        <span>Total Taken:</span>
                                        <span className="text-blue-600">₹{moneyTakenTotal}</span>
                                      </div>
                                    </div>
                                  </div>
                                )}
                                
                                {/* Balance */}
                                <div>
                                  <div className="text-xs font-medium text-gray-600 mb-1">Balance</div>
                                  <div className={`text-lg font-bold ${
                                    balance >= 0 ? "text-green-600" : "text-red-600"
                                  }`}>
                                    {balance >= 0 ? `₹${balance} Remaining` : `₹${Math.abs(balance)} Over Spent`}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Files Column */}
                            <td className="px-6 py-4">
                              <div className="flex flex-wrap gap-2">
                                {exp.files.map((fileData, idx) => (
                                  <button
                                    key={idx}
                                    onClick={() =>
                                      Swal.fire({
                                        title: `File ${idx + 1}`,
                                        html: `<iframe src="${fileData.url}" style="width:100%;height:500px;" frameborder="0"></iframe>`,
                                        width: "80%",
                                        showCloseButton: true,
                                        showConfirmButton: false,
                                      })
                                    }
                                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded text-sm transition-colors flex items-center gap-1"
                                  >
                                    📄 File {idx + 1}
                                  </button>
                                ))}
                              </div>
                            </td>

                            {/* ✅ FIX: Actions Column - use isAccounts variable */}
                            {isAccounts && (
                              <td className="px-6 py-4">
                                <button
                                  onClick={() => handleDelete(exp._id)}
                                  className="bg-red-100 text-red-700 hover:bg-red-200 px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                                  title="Delete expense"
                                >
                                  🗑️ Delete
                                </button>
                              </td>
                            )}
                          </motion.tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex justify-center mt-6">
              <div className="flex items-center gap-2 bg-white rounded-lg p-4 shadow-sm">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(prev => prev - 1)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  ⬅️ Previous
                </button>
                
                <div className="flex gap-1">
                  {Array.from({ length: Math.min(5, pages) }, (_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                          pageNum === page
                            ? "bg-blue-600 text-white"
                            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  disabled={page >= pages}
                  onClick={() => setPage(prev => prev + 1)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  Next ➡️
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}