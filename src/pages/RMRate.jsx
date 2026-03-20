import { useState, useEffect } from "react";
import axiosInstance from "../axiosInstance";
import InternalNavbar from "../components/InternalNavbar";
import toast from "react-hot-toast";
import Swal from "sweetalert2";
import { 
  DollarSign, 
  Save, 
  History, 
  TrendingUp, 
  Calendar,
  ArrowLeft,
  Edit
} from "lucide-react";

export default function RMRate() {
  const [currentRate, setCurrentRate] = useState(null);
  const [newRate, setNewRate] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotalPages, setHistoryTotalPages] = useState(1);

  // Fetch current rate on load
  useEffect(() => {
    fetchCurrentRate();
  }, []);

  const fetchCurrentRate = async () => {
    setFetching(true);
    try {
      const res = await axiosInstance.get("/rm-rate");
      setCurrentRate(res.data);
      if (res.data.rate) {
        setNewRate(res.data.rate.toString());
      }
    } catch (err) {
      console.error("Error fetching RM rate:", err);
      toast.error("Failed to load RM rate");
    } finally {
      setFetching(false);
    }
  };

  const fetchHistory = async (page = 1) => {
    try {
      const res = await axiosInstance.get(`/rm-rate/history?page=${page}&limit=10`);
      setHistory(res.data.data);
      setHistoryPage(res.data.page);
      setHistoryTotalPages(res.data.totalPages);
    } catch (err) {
      toast.error("Failed to load history");
    }
  };

  const handleSaveRate = async (e) => {
    e.preventDefault();
    
    if (!newRate || parseFloat(newRate) < 0) {
      toast.error("Please enter a valid rate");
      return;
    }

    const confirmResult = await Swal.fire({
      title: "Confirm RM Rate Update",
      html: `
        <div style="text-align:left; padding: 1rem;">
          <p><b>New Rate:</b> ₹${parseFloat(newRate).toFixed(2)}</p>
          ${notes ? `<p><b>Notes:</b> ${notes}</p>` : ''}
          <p style="color: #666; margin-top: 10px;">This will update the raw material rate for all calculations.</p>
        </div>
      `,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "✅ Update Rate",
      cancelButtonText: "❌ Cancel",
      confirmButtonColor: "#16a34a",
      cancelButtonColor: "#dc2626",
      customClass: {
        popup: 'rounded-2xl'
      },
      background: '#f8fafc'
    });

    if (!confirmResult.isConfirmed) return;

    setLoading(true);
    try {
      const res = await axiosInstance.post("/rm-rate", {
        rate: parseFloat(newRate),
        notes: notes
      });

      setCurrentRate(res.data);
      toast.success("RM Rate updated successfully!");
      setNotes("");
      
      // Refresh history if showing
      if (showHistory) {
        fetchHistory(1);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to update rate");
    } finally {
      setLoading(false);
    }
  };

  const toggleHistory = () => {
    if (!showHistory) {
      fetchHistory(1);
    }
    setShowHistory(!showHistory);
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <>
      <InternalNavbar />
      
      {/* Main Container */}
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              💰 Raw Material Rate
            </h1>
            <p className="text-gray-600 mt-2">
              Manage the current rate for raw materials
            </p>
          </div>

          {/* Current Rate Card */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden mb-6">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-3">
                <DollarSign size={24} />
                Current RM Rate
              </h2>
            </div>

            <div className="p-6">
              {fetching ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="text-center mb-6">
                  <div className="text-5xl font-bold text-gray-800 mb-2">
                    ₹{currentRate?.rate ? currentRate.rate.toFixed(2) : '0.00'}
                  </div>
                  {currentRate?.updatedAt && (
                    <p className="text-sm text-gray-500 flex items-center justify-center gap-2">
                      <Calendar size={14} />
                      Last updated: {formatDate(currentRate.updatedAt)}
                    </p>
                  )}
                  {currentRate?.notes && (
                    <p className="text-sm text-gray-600 mt-2 p-2 bg-gray-50 rounded-lg">
                      📝 {currentRate.notes}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Update Rate Form */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden mb-6">
            <div className="bg-gradient-to-r from-green-600 to-teal-600 px-6 py-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-3">
                <Edit size={24} />
                Update RM Rate
              </h2>
            </div>

            <form onSubmit={handleSaveRate} className="p-6">
              <div className="mb-4">
                <label className="block text-gray-700 font-semibold mb-2">
                  New Rate (₹) *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500">₹</span>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={newRate}
                    onChange={(e) => setNewRate(e.target.value)}
                    className="w-full pl-8 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                    placeholder="Enter rate"
                    required
                  />
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-gray-700 font-semibold mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                  placeholder="Add any notes about this rate update..."
                />
              </div>

              <button
                type="submit"
                disabled={loading || !newRate}
                className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-3 px-4 rounded-lg shadow-lg transition-all duration-200"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Updating...
                  </>
                ) : (
                  <>
                    <Save size={20} />
                    Update RM Rate
                  </>
                )}
              </button>
            </form>
          </div>

          {/* History Toggle Button */}
          <button
            onClick={toggleHistory}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg shadow-lg transition-all duration-200 mb-4"
          >
            <History size={20} />
            {showHistory ? "Hide History" : "View Rate History"}
          </button>

          {/* History Section */}
          {showHistory && (
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-3">
                  <History size={24} />
                  Rate History
                </h2>
              </div>

              <div className="p-6">
                {history.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">No history available</p>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Date</th>
                            <th className="py-3 px-4 text-right text-sm font-semibold text-gray-700">Rate (₹)</th>
                            <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Notes</th>
                            <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Updated By</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {history.map((item) => (
                            <tr key={item._id} className="hover:bg-gray-50">
                              <td className="py-3 px-4 text-sm text-gray-600">
                                {formatDate(item.updatedAt)}
                              </td>
                              <td className="py-3 px-4 text-right font-semibold text-blue-600">
                                ₹{item.rate.toFixed(2)}
                              </td>
                              <td className="py-3 px-4 text-sm text-gray-600">
                                {item.notes || '-'}
                              </td>
                              <td className="py-3 px-4 text-sm text-gray-600">
                                {item.updatedBy?.name || 'Unknown'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    {historyTotalPages > 1 && (
                      <div className="flex justify-center items-center gap-4 mt-6">
                        <button
                          onClick={() => fetchHistory(historyPage - 1)}
                          disabled={historyPage === 1}
                          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg disabled:opacity-50 hover:bg-gray-200 transition-all duration-200"
                        >
                          Previous
                        </button>
                        <span className="text-sm text-gray-600">
                          Page {historyPage} of {historyTotalPages}
                        </span>
                        <button
                          onClick={() => fetchHistory(historyPage + 1)}
                          disabled={historyPage === historyTotalPages}
                          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg disabled:opacity-50 hover:bg-gray-200 transition-all duration-200"
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}