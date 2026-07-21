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
  const [startDate, setStartDate] = useState(dayjs().startOf('month').format("YYYY-MM-DD"));
  const [endDate, setEndDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [vehicleList, setVehicleList] = useState([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [chartType, setChartType] = useState("bar");
  const [stats, setStats] = useState({
    totalMileage: 0,
    totalKms: 0,
    totalDiesel: 0,
    avgMileage: 0
  });

  // State for mileage entry form
  const [mileageEntries, setMileageEntries] = useState([]);
  const [entryFormData, setEntryFormData] = useState({
    date: dayjs().format("YYYY-MM-DD"),
    vehicleNo: "",
    fuelSlipNo: "",
    meterReading: "",
    dieselLtrs: "",
    files: []
  });
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [entryLoading, setEntryLoading] = useState(false);
  const [entrySuccess, setEntrySuccess] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  // State for entries pagination
  const [entriesPage, setEntriesPage] = useState(1);
  const [entriesLimit] = useState(10);
  const [entriesTotalPages, setEntriesTotalPages] = useState(1);
  const [entriesTotal, setEntriesTotal] = useState(0);
  const [entriesLoading, setEntriesLoading] = useState(false);

  const COLORS = ['#4f46e5', '#38bdf8', '#f97316', '#10b981', '#f59e0b', '#ef4444'];

  // Fetch mileage for all trips within date range
  const fetchMileageData = async () => {
    setLoading(true);
    try {
      // Build query params with date range
      let queryParams = new URLSearchParams();
      if (startDate) queryParams.append('startDate', startDate);
      if (endDate) queryParams.append('endDate', endDate);
      if (vehicleFilter) queryParams.append('vehicleNumber', vehicleFilter);
      queryParams.append('page', page);
      queryParams.append('limit', limit);

      const res = await axiosInstance.get(
        `/diesel/trip-mileage?${queryParams.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Process the data
      const processedData = res.data.data.map(d => ({
        ...d,
        mileage: isNaN(d.mileage) ? 0 : +d.mileage,
        kmsRun: isNaN(d.kmsRun) ? 0 : +d.kmsRun,
        dieselUsed: isNaN(d.dieselUsed) ? 0 : +d.dieselUsed,
        // For grouping by vehicle when "All Vehicles" is selected
        vehicleNumber: d.vehicleNumber,
        tripLabel: `${d.vehicleNumber} - ${d.date || 'N/A'}`,
        label: `${d.vehicleNumber}\n(${d.tripStart}→${d.tripEnd})`,
        fullLabel: d.vehicleNumber
      }));

      setData(processedData);
      setTotalPages(Math.ceil(res.data.total / limit));

      if (processedData.length > 0) {
        const totalMileage = processedData.reduce((sum, item) => sum + (item.mileage || 0), 0);
        const totalKms = processedData.reduce((sum, item) => sum + (item.kmsRun || 0), 0);
        const totalDiesel = processedData.reduce((sum, item) => sum + (item.dieselUsed || 0), 0);
        const avgMileage = totalMileage / processedData.length;

        setStats({
          totalMileage: totalMileage.toFixed(1),
          totalKms: totalKms.toFixed(0),
          totalDiesel: totalDiesel.toFixed(1),
          avgMileage: avgMileage.toFixed(2)
        });
      } else {
        setStats({
          totalMileage: 0,
          totalKms: 0,
          totalDiesel: 0,
          avgMileage: 0
        });
      }
    } catch (err) {
      console.error("Failed to fetch mileage data:", err);
      toast?.error("Failed to fetch mileage data");
    } finally {
      setLoading(false);
    }
  };

  const fetchMileageEntries = async (pageNum = entriesPage) => {
    setEntriesLoading(true);
    try {
      const res = await axiosInstance.get(
        `/diesel/entries?page=${pageNum}&limit=${entriesLimit}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setMileageEntries(res.data.data);
      setEntriesTotal(res.data.total);
      setEntriesTotalPages(res.data.totalPages);
      setEntriesPage(res.data.page);
    } catch (err) {
      console.error("Failed to fetch mileage entries:", err);
    } finally {
      setEntriesLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchMileageData();
      fetchMileageEntries();

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
  }, [startDate, endDate, vehicleFilter, page, token, entriesPage]);

  const handleDateRangeChange = () => {
    setPage(1);
    fetchMileageData();
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(files);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEntryFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmitEntry = async (e) => {
    e.preventDefault();
    setEntryLoading(true);
    setEntrySuccess(false);

    try {
      let imageUrls = [];
      if (selectedFiles.length > 0) {
        const formData = new FormData();
        selectedFiles.forEach(file => {
          formData.append('images', file);
        });

        const uploadRes = await axiosInstance.post('/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`
          }
        });
        imageUrls = uploadRes.data.fileUrls || [];
      }

      const payload = {
        vehicleNumber: entryFormData.vehicleNo,
        date: entryFormData.date,
        kmsReading: parseFloat(entryFormData.meterReading),
        dieselLiters: parseFloat(entryFormData.dieselLtrs),
        imageUrls: imageUrls,
        fuelSlipNo: entryFormData.fuelSlipNo
      };

      await axiosInstance.post('/diesel/add', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setEntryFormData({
        date: dayjs().format("YYYY-MM-DD"),
        vehicleNo: "",
        fuelSlipNo: "",
        meterReading: "",
        dieselLtrs: "",
        files: []
      });
      setSelectedFiles([]);
      document.getElementById('fileInput').value = '';
      
      setEntrySuccess(true);
      setTimeout(() => setEntrySuccess(false), 3000);

      setEntriesPage(1);
      fetchMileageData();
      fetchMileageEntries(1);

    } catch (err) {
      console.error("Failed to add mileage entry:", err);
      alert("Failed to add mileage entry. Please try again.");
    } finally {
      setEntryLoading(false);
    }
  };

  const handleEntriesPageChange = (newPage) => {
    setEntriesPage(newPage);
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900 mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: <span className="font-semibold">{entry.value} km/L</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const renderChart = () => {
    // Sort data by mileage for better visualization
    const sortedData = [...data].sort((a, b) => b.mileage - a.mileage);

    switch (chartType) {
      case 'line':
        return (
          <LineChart data={sortedData} margin={{ top: 20, right: 30, bottom: 80, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="tripLabel" 
              angle={-45} 
              textAnchor="end" 
              height={80}
              tick={{ fontSize: 10, fontWeight: '500' }}
              interval={0}
              width={120}
            />
            <YAxis 
              label={{ 
                value: 'Mileage (km/L)', 
                angle: -90, 
                position: 'insideLeft',
                style: { textAnchor: 'middle', fontWeight: 'bold', fontSize: 12 }
              }}
              domain={[0, 'auto']}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="mileage" 
              name="Trip Mileage" 
              stroke="#4f46e5" 
              strokeWidth={3}
              dot={{ fill: '#4f46e5', strokeWidth: 2, r: 5 }}
              activeDot={{ r: 7, fill: '#4f46e5' }}
            />
          </LineChart>
        );
      
      case 'pie':
        // For pie chart, group by vehicle to show average mileage per vehicle
        const vehicleGroups = {};
        sortedData.forEach(item => {
          if (!vehicleGroups[item.vehicleNumber]) {
            vehicleGroups[item.vehicleNumber] = {
              name: item.vehicleNumber,
              value: 0,
              count: 0,
              totalKms: 0,
              totalDiesel: 0
            };
          }
          vehicleGroups[item.vehicleNumber].value += item.mileage || 0;
          vehicleGroups[item.vehicleNumber].count += 1;
          vehicleGroups[item.vehicleNumber].totalKms += item.kmsRun || 0;
          vehicleGroups[item.vehicleNumber].totalDiesel += item.dieselUsed || 0;
        });

        const pieData = Object.values(vehicleGroups).map(group => ({
          name: group.name,
          value: +(group.value / group.count).toFixed(2),
          kms: group.totalKms,
          diesel: group.totalDiesel,
          trips: group.count
        }));

        return (
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              labelLine={true}
              label={({ name, value }) => `${name}\n${value.toFixed(1)} km/L`}
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
                `Avg: ${value} km/L\nTotal KMs: ${props.payload.kms} km\nTotal Diesel: ${props.payload.diesel} L\nTrips: ${props.payload.trips}`,
                props.payload.name
              ]}
            />
            <Legend />
          </PieChart>
        );
      
      default:
        // For bar chart, when "All Vehicles" is selected, show grouped by vehicle
        let chartData = sortedData;
        
        // If no vehicle filter (All Vehicles), group by vehicle and show average
        if (!vehicleFilter) {
          const vehicleGroups = {};
          sortedData.forEach(item => {
            if (!vehicleGroups[item.vehicleNumber]) {
              vehicleGroups[item.vehicleNumber] = {
                vehicleNumber: item.vehicleNumber,
                mileage: 0,
                kmsRun: 0,
                dieselUsed: 0,
                count: 0,
                trips: []
              };
            }
            vehicleGroups[item.vehicleNumber].mileage += item.mileage || 0;
            vehicleGroups[item.vehicleNumber].kmsRun += item.kmsRun || 0;
            vehicleGroups[item.vehicleNumber].dieselUsed += item.dieselUsed || 0;
            vehicleGroups[item.vehicleNumber].count += 1;
            vehicleGroups[item.vehicleNumber].trips.push(item);
          });

          chartData = Object.values(vehicleGroups).map(group => ({
            vehicleNumber: group.vehicleNumber,
            mileage: +(group.mileage / group.count).toFixed(2),
            kmsRun: group.kmsRun,
            dieselUsed: group.dieselUsed,
            tripCount: group.count,
            label: `${group.vehicleNumber}\n(${group.count} trips)`
          }));
        }

        return (
          <BarChart data={chartData} margin={{ top: 20, right: 30, bottom: 80, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="vehicleNumber" 
              angle={-45} 
              textAnchor="end" 
              height={80}
              tick={{ fontSize: 11, fontWeight: '500' }}
              interval={0}
              width={120}
            />
            <YAxis 
              label={{ 
                value: 'Average Mileage (km/L)', 
                angle: -90, 
                position: 'insideLeft',
                style: { textAnchor: 'middle', fontWeight: 'bold', fontSize: 12 }
              }}
              domain={[0, 'auto']}
            />
            <Tooltip 
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
                      <p className="font-semibold text-gray-900 mb-2">{label}</p>
                      <p className="text-sm text-blue-600">
                        Average Mileage: <span className="font-semibold">{data.mileage} km/L</span>
                      </p>
                      {data.tripCount && (
                        <p className="text-sm text-gray-600">
                          Total Trips: {data.tripCount}
                        </p>
                      )}
                      {data.kmsRun && (
                        <p className="text-sm text-gray-600">
                          Total KMs: {data.kmsRun} km
                        </p>
                      )}
                      {data.dieselUsed && (
                        <p className="text-sm text-gray-600">
                          Total Diesel: {data.dieselUsed} L
                        </p>
                      )}
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend />
            <Bar 
              dataKey="mileage" 
              name="Average Mileage (km/L)" 
              fill="#4f46e5" 
              radius={[4, 4, 0, 0]} 
            />
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
            📊 Vehicle Trip Mileage Analytics
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Track trip-wise mileage performance of all vehicles within selected date range
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
                  <p className="text-2xl font-bold text-gray-900">{stats.avgMileage || 0} km/L</p>
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
                  <p className="text-2xl font-bold text-gray-900">{stats.totalKms || 0} km</p>
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
                  <p className="text-2xl font-bold text-gray-900">{stats.totalDiesel || 0} L</p>
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
                  <p className="text-sm font-medium text-gray-600">Total Trips</p>
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
                <h2 className="text-xl font-semibold text-gray-900 mb-1">Trip Mileage Report</h2>
                <p className="text-gray-600">Track trip-wise mileage performance within selected date range</p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
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

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
              {/* Start Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                />
              </div>

              {/* End Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
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
                  <option value="">All Vehicles (Grouped)</option>
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
                    setStartDate(dayjs().startOf('month').format("YYYY-MM-DD"));
                    setEndDate(dayjs().format("YYYY-MM-DD"));
                    setPage(1);
                  }}
                  className="flex-1 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors duration-200 font-medium"
                >
                  Clear Filters
                </button>
                <button
                  onClick={handleDateRangeChange}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Apply Date Range
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
                  {vehicleFilter || startDate || endDate
                    ? "Try adjusting your filters or date range" 
                    : "No data recorded for the selected period"}
                </p>
              </div>
            ) : (
              <>
                <div className="w-full h-[450px] mb-8">
                  <ResponsiveContainer width="100%" height="100%">
                    {renderChart()}
                  </ResponsiveContainer>
                </div>

                <div className="overflow-x-auto rounded-lg border border-gray-200">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Vehicle
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Trip Date
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
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                            {v.vehicleNumber}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {v.date || 'N/A'}
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

        {/* Mileage Entry Form & Table - Keep existing code */}
        <div className="mt-12 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-green-50 to-teal-50">
            <h2 className="text-xl font-semibold text-gray-900 mb-1">📝 Add Mileage Entry</h2>
            <p className="text-gray-600">Record fuel slip details, meter reading, and upload supporting documents</p>
          </div>

          <div className="p-6">
            {entrySuccess && (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Mileage entry added successfully!
              </div>
            )}

            <form onSubmit={handleSubmitEntry} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date *
                </label>
                <input
                  type="date"
                  name="date"
                  value={entryFormData.date}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition duration-200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vehicle No *
                </label>
                <select
                  name="vehicleNo"
                  value={entryFormData.vehicleNo}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition duration-200"
                >
                  <option value="">Select Vehicle</option>
                  {vehicleList.map((v) => (
                    <option key={v._id} value={v.vehicleNumber}>
                      {v.vehicleNumber}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fuel Slip No *
                </label>
                <input
                  type="text"
                  name="fuelSlipNo"
                  value={entryFormData.fuelSlipNo}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., FSL-2025-001"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition duration-200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Meter Reading (KM) *
                </label>
                <input
                  type="number"
                  name="meterReading"
                  value={entryFormData.meterReading}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., 12500"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition duration-200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Diesel (Liters) *
                </label>
                <input
                  type="number"
                  name="dieselLtrs"
                  value={entryFormData.dieselLtrs}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., 45.5"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition duration-200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Files (Multiple)
                </label>
                <input
                  type="file"
                  id="fileInput"
                  multiple
                  onChange={handleFileChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition duration-200 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                />
                {selectedFiles.length > 0 && (
                  <p className="mt-1 text-sm text-gray-500">
                    {selectedFiles.length} file(s) selected
                  </p>
                )}
              </div>

              <div className="md:col-span-2 lg:col-span-3 flex justify-end">
                <button
                  type="submit"
                  disabled={entryLoading}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {entryLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Adding...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Add Entry
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Mileage Entries Table with Pagination - Keep existing */}
            <div className="mt-8">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">📋 Mileage Entries</h3>
                <span className="text-sm text-gray-500">
                  Total: {entriesTotal} entries
                </span>
              </div>
              
              {entriesLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                </div>
              ) : mileageEntries.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No mileage entries found. Add your first entry above!
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto rounded-lg border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Vehicle No
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Fuel Slip No
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Meter Reading
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Diesel (L)
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Files
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {mileageEntries.map((entry, idx) => (
                          <tr key={idx} className="hover:bg-gray-50 transition-colors duration-150">
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                              {dayjs(entry.date).format("DD-MM-YYYY")}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                              {entry.vehicleNumber}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                              {entry.fuelSlipNo || '-'}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-blue-600 font-semibold">
                              {entry.kmsReading || entry.reading} km
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-orange-600 font-semibold">
                              {entry.dieselLiters || entry.dieselQuantity} L
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                              {entry.imageUrls && entry.imageUrls.length > 0 ? (
                                <div className="flex items-center gap-2">
                                  <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                  </svg>
                                  <div className="flex flex-wrap gap-1">
                                    {entry.imageUrls.map((url, index) => (
                                      <button
                                        key={index}
                                        onClick={() => setPreviewImage(url)}
                                        className="text-blue-600 hover:text-blue-800 hover:bg-blue-100 text-xs bg-blue-50 px-2 py-1 rounded-md transition-colors duration-200 border border-blue-200"
                                      >
                                        📎 File {index + 1}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-gray-400">No files</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {entriesTotalPages > 1 && (
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-4 p-4 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-600">
                        Showing {(entriesPage - 1) * entriesLimit + 1} - {Math.min(entriesPage * entriesLimit, entriesTotal)} of {entriesTotal} entries
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEntriesPageChange(entriesPage - 1)}
                          disabled={entriesPage === 1}
                          className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                          Previous
                        </button>
                        
                        <span className="px-4 py-2 text-sm font-medium text-gray-700">
                          Page {entriesPage} of {entriesTotalPages}
                        </span>
                        
                        <button
                          onClick={() => handleEntriesPageChange(entriesPage + 1)}
                          disabled={entriesPage === entriesTotalPages}
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

      {/* Image Preview Modal */}
      {previewImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300 transition-colors duration-200"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img 
              src={previewImage} 
              alt="Preview" 
              className="max-w-full max-h-[85vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}