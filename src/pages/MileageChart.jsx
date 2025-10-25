import React, { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
  ResponsiveContainer, CartesianGrid, LineChart, Line, PieChart, Pie, Cell
} from "recharts";
import { useUserContext } from "../context/UserContext";
import dayjs from "dayjs";
import InternalNavbar from "../components/InternalNavbar";
import axiosInstance from "../axiosInstance";

export default function MileageChart() {
  const { token } = useUserContext();
  const [month, setMonth] = useState(dayjs().format("YYYY-MM"));
  const [vehicleFilter, setVehicleFilter] = useState("");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [vehicleList, setVehicleList] = useState([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [chartType, setChartType] = useState("bar"); // 'bar', 'line', 'pie'
  const [stats, setStats] = useState({
    totalMileage: 0,
    totalKms: 0,
    totalDiesel: 0,
    avgMileage: 0
  });

  const COLORS = ['#4f46e5', '#38bdf8', '#f97316', '#10b981', '#f59e0b', '#ef4444'];

  const fetchMileage = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(
        `/diesel/mileage-report?month=${month}&vehicleNumber=${vehicleFilter}&page=${page}&limit=${limit}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const cleaned = res.data.data.map(d => ({
        ...d,
        mileage: isNaN(d.mileage) ? 0 : +d.mileage,
        kmsRun: isNaN(d.kmsRun) ? 0 : +d.kmsRun,
        dieselUsed: isNaN(d.dieselUsed) ? 0 : +d.dieselUsed,
        label: `${d.vehicleNumber}\n(${d.tripStart}→${d.tripEnd})`,
        shortLabel: `${d.vehicleNumber.split(' ').pop()}`
      }));

      setData(cleaned);
      setTotalPages(Math.ceil(res.data.total / limit));

      // Calculate statistics
      if (cleaned.length > 0) {
        const totalMileage = cleaned.reduce((sum, item) => sum + (item.mileage || 0), 0);
        const totalKms = cleaned.reduce((sum, item) => sum + (item.kmsRun || 0), 0);
        const totalDiesel = cleaned.reduce((sum, item) => sum + (item.dieselUsed || 0), 0);
        const avgMileage = totalMileage / cleaned.length;

        setStats({
          totalMileage: totalMileage.toFixed(1),
          totalKms: totalKms.toFixed(0),
          totalDiesel: totalDiesel.toFixed(1),
          avgMileage: avgMileage.toFixed(2)
        });
      }
    } catch (err) {
      console.error("Failed to fetch mileage data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchMileage();

      axiosInstance.get("/vehicles/all", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setVehicleList(res.data);
      })
      .catch((err) => {
        console.error("Failed to fetch vehicle list:", err);
      });
    }
  }, [month, vehicleFilter, page, token]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900 mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: <span className="font-semibold">{entry.value} {entry.name.includes('Mileage') ? 'km/L' : entry.name.includes('KMs') ? 'km' : 'L'}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const renderChart = () => {
    switch (chartType) {
      case 'line':
        return (
          <LineChart data={data} margin={{ top: 20, right: 30, bottom: 50, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="shortLabel" 
              angle={-45} 
              textAnchor="end" 
              height={60}
              tick={{ fontSize: 12 }}
            />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="mileage" 
              name="Mileage (KM/L)" 
              stroke="#4f46e5" 
              strokeWidth={3}
              dot={{ fill: '#4f46e5', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, fill: '#4f46e5' }}
            />
            <Line 
              type="monotone" 
              dataKey="kmsRun" 
              name="KMs Run" 
              stroke="#38bdf8" 
              strokeWidth={2}
              dot={{ fill: '#38bdf8', strokeWidth: 2, r: 4 }}
            />
          </LineChart>
        );
      
      case 'pie':
        const pieData = data.map(item => ({
          name: item.vehicleNumber,
          value: item.mileage || 0,
          kms: item.kmsRun || 0,
          diesel: item.dieselUsed || 0
        }));

        return (
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, value }) => `${name}: ${value.toFixed(1)} km/L`}
              outerRadius={120}
              fill="#8884d8"
              dataKey="value"
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value, name, props) => [
                `${value} km/L\n${props.payload.kms} km run\n${props.payload.diesel} L diesel`,
                props.payload.name
              ]}
            />
            <Legend />
          </PieChart>
        );
      
      default:
        return (
          <BarChart data={data} margin={{ top: 20, right: 30, bottom: 50, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="shortLabel" 
              angle={-45} 
              textAnchor="end" 
              height={60}
              tick={{ fontSize: 12 }}
            />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey="mileage" name="Mileage (KM/L)" fill="#4f46e5" radius={[4, 4, 0, 0]} />
            <Bar dataKey="kmsRun" name="KMs Run" fill="#38bdf8" radius={[4, 4, 0, 0]} />
            <Bar dataKey="dieselUsed" name="Diesel (L)" fill="#f97316" radius={[4, 4, 0, 0]} />
          </BarChart>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <InternalNavbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            📊 Vehicle Mileage Analytics
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Comprehensive analysis of vehicle performance, fuel efficiency, and trip statistics
          </p>
        </div>

        {/* Statistics Cards */}
        {data.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-blue-50 mr-4">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Average Mileage</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.avgMileage} km/L</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-green-50 mr-4">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Distance</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalKms} km</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-orange-50 mr-4">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Fuel Consumed</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalDiesel} L</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-purple-50 mr-4">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Records</p>
                  <p className="text-2xl font-bold text-gray-900">{data.length}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Filters Section */}
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-1">Mileage Report</h2>
                <p className="text-gray-600">Analyze vehicle performance and fuel efficiency</p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                {/* Chart Type Selector */}
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setChartType('bar')}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors duration-200 ${
                      chartType === 'bar' 
                        ? 'bg-white text-blue-600 shadow-sm' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Bar
                  </button>
                  <button
                    onClick={() => setChartType('line')}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors duration-200 ${
                      chartType === 'line' 
                        ? 'bg-white text-blue-600 shadow-sm' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Line
                  </button>
                  <button
                    onClick={() => setChartType('pie')}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors duration-200 ${
                      chartType === 'pie' 
                        ? 'bg-white text-blue-600 shadow-sm' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Pie
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              {/* Month Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Month
                </label>
                <input
                  type="month"
                  value={month}
                  onChange={(e) => {
                    setMonth(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                />
              </div>

              {/* Vehicle Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filter by Vehicle
                </label>
                <select
                  value={vehicleFilter}
                  onChange={(e) => {
                    setVehicleFilter(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                >
                  <option value="">All Vehicles</option>
                  {vehicleList.map((v) => (
                    <option key={v._id} value={v.vehicleNumber}>
                      {v.vehicleNumber}
                    </option>
                  ))}
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex items-end gap-2">
                <button
                  onClick={() => {
                    setVehicleFilter("");
                    setMonth(dayjs().format("YYYY-MM"));
                    setPage(1);
                  }}
                  className="flex-1 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors duration-200 font-medium"
                >
                  Clear Filters
                </button>
                <button
                  onClick={fetchMileage}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh
                </button>
              </div>
            </div>
          </div>

          {/* Chart Section */}
          <div className="p-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600 font-medium">Loading mileage data...</p>
              </div>
            ) : data.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">📊</div>
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No mileage data available</h3>
                <p className="text-gray-500">
                  {vehicleFilter || month !== dayjs().format("YYYY-MM") 
                    ? "Try adjusting your filters" 
                    : "No data recorded for the selected period"}
                </p>
              </div>
            ) : (
              <>
                {/* Chart Container */}
                <div className="w-full h-[400px] mb-8">
                  <ResponsiveContainer width="100%" height="100%">
                    {renderChart()}
                  </ResponsiveContainer>
                </div>

                {/* Data Table */}
                <div className="overflow-x-auto rounded-lg border border-gray-200">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Vehicle
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Start KMs
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          End KMs
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          KM Run
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Diesel (L)
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Mileage
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {data.map((v, idx) => (
                        <tr key={idx} className="hover:bg-gray-50 transition-colors duration-150">
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {v.date}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                            {v.vehicleNumber}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                            {v.tripStart} km
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                            {v.tripEnd} km
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-blue-600 font-semibold">
                            {v.kmsRun} km
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-orange-600 font-semibold">
                            {v.dieselUsed} L
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              v.mileage > 15 ? 'bg-green-100 text-green-800' :
                              v.mileage > 10 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {v.mileage} km/L
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6 p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600">
                      Showing {data.length} records
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setPage(p => Math.max(p - 1, 1))}
                        disabled={page === 1}
                        className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Previous
                      </button>
                      
                      <span className="px-4 py-2 text-sm font-medium text-gray-700">
                        Page {page} of {totalPages}
                      </span>
                      
                      <button
                        onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                        disabled={page === totalPages}
                        className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center gap-2"
                      >
                        Next
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}