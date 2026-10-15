import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import InternalNavbar from "../components/InternalNavbar";
import axiosInstance from "../axiosInstance";
import toast from "react-hot-toast";
import {
  Users,
  Clock,
  Package,
  Filter,
  ArrowLeft,
  ArrowRight,
  TrendingUp,
  Globe,
  Loader,
  Calendar,
} from "lucide-react";

export default function TrafficChecker() {
  const navigate = useNavigate();
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [totalVisitors, setTotalVisitors] = useState(0);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [searchParams, setSearchParams] = useSearchParams();

  const pageFromUrl = parseInt(searchParams.get("page")) || 1;
  const [page, setPage] = useState(pageFromUrl);

  const fetchTraffic = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/traffic/visitors", {
        params: { date: selectedDate, page, limit: 10 },
      });
      setVisitors(res.data.visitors || []);
      setTotalPages(res.data.pages || 1);
      setTotalVisitors(res.data.total || 0);
    } catch (err) {
      console.error("Failed to fetch traffic data", err);
      toast.error("Failed to load traffic data");
    } finally {
      setLoading(false);
    }
  }, [selectedDate, page]);

  useEffect(() => {
    fetchTraffic();
  }, [fetchTraffic]);

  useEffect(() => {
    setSearchParams({ page });
  }, [page, setSearchParams]);

  const stats = {
    totalVisitors: totalVisitors,
    avgTimeSpent:
      visitors.length > 0
        ? (
            visitors.reduce((acc, v) => acc + (v.timeSpent || 0), 0) /
            visitors.length
          ).toFixed(1)
        : 0,
    uniqueProducts: new Set(
      visitors.flatMap((v) => v.productsChecked || [])
    ).size,
    uniqueCategories: new Set(
      visitors.flatMap((v) => v.categoriesChecked || [])
    ).size,
  };

  return (
    <>
      <InternalNavbar />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                📊 Traffic Checker
              </h1>
              <p className="text-gray-600 mt-2">
                Monitor website visitors and their activity
              </p>
            </div>
            <button
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-xl hover:bg-gray-50 transition-all"
            >
              <ArrowLeft size={18} />
              Back to Dashboard
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Visitors</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {stats.totalVisitors}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Avg Time Spent</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {stats.avgTimeSpent}s
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Package className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Products Viewed</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {stats.uniqueProducts}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Categories</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {stats.uniqueCategories}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Filter */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-200">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-gray-500" />
                <label className="text-gray-700 font-medium">
                  Filter by Date:
                </label>
              </div>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setPage(1);
                }}
                className="border border-gray-300 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Visitors Table */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-3">
                <Globe size={24} />
                Visitor Activity ({visitors.length})
              </h2>
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-12">
                <Loader className="w-10 h-10 text-blue-600 animate-spin" />
              </div>
            ) : visitors.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-5xl mb-4">📭</div>
                <h3 className="text-xl font-semibold text-gray-600 mb-2">
                  No visitors found
                </h3>
                <p className="text-gray-500">
                  No traffic data available for {selectedDate}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">
                        Visitor
                      </th>
                      <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">
                        Time Spent
                      </th>
                      <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">
                        Products Checked
                      </th>
                      <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">
                        Categories
                      </th>
                      <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {visitors.map((v, idx) => (
                      <tr
                        key={v._id || idx}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="py-4 px-6">
                          <div>
                            <p className="font-semibold text-gray-800">
                              {v.visitorId || v.ip || "Anonymous"}
                            </p>
                            <p className="text-xs text-gray-500">
                              {v.location || v.country || "Unknown location"}
                            </p>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                            <Clock size={14} />
                            {v.timeSpent || 0}s
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex flex-wrap gap-1">
                            {v.productsChecked?.length > 0 ? (
                              v.productsChecked.map((p, i) => (
                                <span
                                  key={i}
                                  className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs font-medium"
                                >
                                  {p}
                                </span>
                              ))
                            ) : (
                              <span className="text-gray-400 text-sm">—</span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex flex-wrap gap-1">
                            {v.categoriesChecked?.length > 0 ? (
                              v.categoriesChecked.map((c, i) => (
                                <span
                                  key={i}
                                  className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-medium capitalize"
                                >
                                  {c}
                                </span>
                              ))
                            ) : (
                              <span className="text-gray-400 text-sm">—</span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-6 text-sm text-gray-600">
                          {v.date
                            ? new Date(v.date).toLocaleDateString("en-GB")
                            : selectedDate}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 py-4 border-t border-gray-200">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="flex items-center gap-1 px-4 py-2 bg-white border border-gray-300 rounded-xl text-gray-700 disabled:opacity-50 hover:bg-gray-50"
                >
                  <ArrowLeft size={16} /> Previous
                </button>
                <span className="text-sm text-gray-600 px-4">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="flex items-center gap-1 px-4 py-2 bg-white border border-gray-300 rounded-xl text-gray-700 disabled:opacity-50 hover:bg-gray-50"
                >
                  Next <ArrowRight size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}