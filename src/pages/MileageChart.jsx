import React, { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
  ResponsiveContainer, CartesianGrid, LineChart, Line, PieChart, Pie, Cell
} from "recharts";
import { useUserContext } from "../context/UserContext";
import dayjs from "dayjs";
import InternalNavbar from "../components/InternalNavbar";
import axiosInstance from "../axiosInstance";
import toast from "react-hot-toast";  // ✅ ADD THIS IMPORT
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Swal from 'sweetalert2';

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
  // State for Mileage Entries filters
const [entriesSearchTerm, setEntriesSearchTerm] = useState("");
const [entriesStartDate, setEntriesStartDate] = useState("");
const [entriesEndDate, setEntriesEndDate] = useState("");
const [entriesVehicleFilter, setEntriesVehicleFilter] = useState("");

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
const [editSelectedFiles, setEditSelectedFiles] = useState([]);
const [editUploading, setEditUploading] = useState(false);

  // State for entries pagination
  const [entriesPage, setEntriesPage] = useState(1);
  const [entriesLimit] = useState(10);
  const [entriesTotalPages, setEntriesTotalPages] = useState(1);
  const [entriesTotal, setEntriesTotal] = useState(0);
  const [entriesLoading, setEntriesLoading] = useState(false);
// Add these state variables at the top with other states
const [deleteLoading, setDeleteLoading] = useState(false);

  // State for all data (for chart) - this will hold ALL data without pagination
  const [allData, setAllData] = useState([]);

  // State for editing entries
  const [editingEntry, setEditingEntry] = useState(null);
  const [editFormData, setEditFormData] = useState({
    date: "",
    vehicleNumber: "",
    fuelSlipNo: "",
    kmsReading: "",
    dieselLiters: "",
    imageUrls: []
  });
  const [editLoading, setEditLoading] = useState(false);

  const COLORS = ['#4f46e5', '#38bdf8', '#f97316', '#10b981', '#f59e0b', '#ef4444'];

  // Fetch all mileage data for chart (no pagination)
  const fetchAllMileageData = async () => {
    try {
      let queryParams = new URLSearchParams();
      if (startDate) queryParams.append('startDate', startDate);
      if (endDate) queryParams.append('endDate', endDate);
      if (vehicleFilter) queryParams.append('vehicleNumber', vehicleFilter);

      const res = await axiosInstance.get(
        `/diesel/trip-mileage?${queryParams.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      let rawData = [];
      if (res.data.data && Array.isArray(res.data.data)) {
        rawData = res.data.data;
      } else if (Array.isArray(res.data)) {
        rawData = res.data;
      }

      const processedData = rawData.map(d => ({
        ...d,
        mileage: isNaN(d.mileage) ? 0 : +d.mileage,
        kmsRun: isNaN(d.kmsRun) ? 0 : +d.kmsRun,
        dieselUsed: isNaN(d.dieselUsed) ? 0 : +d.dieselUsed,
        vehicleNumber: d.vehicleNumber,
        tripLabel: `${d.vehicleNumber} - ${d.date || 'N/A'}`,
        label: `${d.vehicleNumber}\n(${d.tripStart}→${d.tripEnd})`,
        fullLabel: d.vehicleNumber
      }));

      setAllData(processedData);

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
      console.error("Failed to fetch all mileage data:", err);
      toast?.error("Failed to fetch mileage data");
    }
  };

  // Fetch paginated data for table
  const fetchTableData = async () => {
    setLoading(true);
    try {
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

      const processedData = res.data.data.map(d => ({
        ...d,
        mileage: isNaN(d.mileage) ? 0 : +d.mileage,
        kmsRun: isNaN(d.kmsRun) ? 0 : +d.kmsRun,
        dieselUsed: isNaN(d.dieselUsed) ? 0 : +d.dieselUsed,
        vehicleNumber: d.vehicleNumber,
        tripLabel: `${d.vehicleNumber} - ${d.date || 'N/A'}`,
        label: `${d.vehicleNumber}\n(${d.tripStart}→${d.tripEnd})`,
        fullLabel: d.vehicleNumber
      }));

      setData(processedData);
      setTotalPages(Math.ceil(res.data.total / limit));
    } catch (err) {
      console.error("Failed to fetch table data:", err);
    } finally {
      setLoading(false);
    }
  };

 const fetchMileageEntries = async (pageNum = entriesPage) => {
  setEntriesLoading(true);
  try {
    let queryParams = new URLSearchParams();
    queryParams.append('page', pageNum);
    queryParams.append('limit', entriesLimit);
    
    // Add filters
    if (entriesSearchTerm) {
      queryParams.append('search', entriesSearchTerm);
    }
    if (entriesStartDate) {
      queryParams.append('startDate', entriesStartDate);
    }
    if (entriesEndDate) {
      queryParams.append('endDate', entriesEndDate);
    }
    if (entriesVehicleFilter) {
      queryParams.append('vehicleNumber', entriesVehicleFilter);
    }

    const res = await axiosInstance.get(
      `/diesel/entries?${queryParams.toString()}`,
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
    toast.error("Failed to fetch mileage entries");
  } finally {
    setEntriesLoading(false);
  }
};

useEffect(() => {
  if (token) {
    fetchAllMileageData();
    fetchTableData();
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
}, [startDate, endDate, vehicleFilter, page, token, entriesPage, entriesSearchTerm, entriesStartDate, entriesEndDate, entriesVehicleFilter]);

  const handleDateRangeChange = () => {
    setPage(1);
    fetchAllMileageData();
    fetchTableData();
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

    // ✅ FIX: Handle 0 value properly - check if value exists, allow 0
    const meterReading = entryFormData.meterReading !== undefined && entryFormData.meterReading !== "" 
      ? parseFloat(entryFormData.meterReading) 
      : 0;

    const dieselLiters = entryFormData.dieselLtrs !== undefined && entryFormData.dieselLtrs !== "" 
      ? parseFloat(entryFormData.dieselLtrs) 
      : null;

    const payload = {
      vehicleNumber: entryFormData.vehicleNo,
      date: entryFormData.date,
      kmsReading: meterReading,
      dieselLiters: dieselLiters,
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
    fetchAllMileageData();
    fetchTableData();
    fetchMileageEntries(1);

  } catch (err) {
    console.error("Failed to add mileage entry:", err);
    // ✅ Show more specific error message
    const errorMsg = err.response?.data?.message || "Failed to add mileage entry. Please try again.";
    toast.error(errorMsg);
  } finally {
    setEntryLoading(false);
  }
};

  const handleEntriesPageChange = (newPage) => {
    setEntriesPage(newPage);
  };

const handleEditClick = (entry) => {
  setEditingEntry(entry);
  setEditFormData({
    date: entry.date ? dayjs(entry.date).format("YYYY-MM-DD") : "",
    vehicleNumber: entry.vehicleNumber || "",
    fuelSlipNo: entry.fuelSlipNo || "",
    kmsReading: entry.kmsReading || entry.reading || "",
    dieselLiters: entry.dieselLiters || entry.dieselQuantity || "",
    imageUrls: entry.imageUrls || []
  });
    setEditSelectedFiles([]); // Reset file selection
};

// Handle edit file change
const handleEditFileChange = (e) => {
  const files = Array.from(e.target.files);
  setEditSelectedFiles(files);
};

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

const handleUpdateEntry = async (e) => {
  e.preventDefault();
  setEditLoading(true);
  setEditUploading(true);

  try {
    let imageUrls = editFormData.imageUrls || [];
    
    // Upload new files if any
    if (editSelectedFiles.length > 0) {
      const formData = new FormData();
      editSelectedFiles.forEach(file => {
        formData.append('images', file);
      });

      const uploadRes = await axiosInstance.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      });
      
      const newUrls = uploadRes.data.fileUrls || [];
      imageUrls = [...imageUrls, ...newUrls];
    }

    const payload = {
      dieselLiters: parseFloat(editFormData.dieselLiters) || null,
      kmsReading: parseFloat(editFormData.kmsReading),
      fuelSlipNo: editFormData.fuelSlipNo || null,
      imageUrls: imageUrls
    };

    await axiosInstance.patch(`/diesel/update/${editingEntry._id}`, payload, {
      headers: { Authorization: `Bearer ${token}` }
    });

    toast.success("Entry updated successfully!");
    
    setEditingEntry(null);
    setEditSelectedFiles([]);
    
    fetchMileageEntries(entriesPage);
    fetchAllMileageData();
    fetchTableData();

  } catch (err) {
    console.error("Failed to update entry:", err);
    
    // Handle specific error messages
    if (err.response?.status === 413) {
      toast.error(err.response?.data?.message || "File too large. Maximum size is 20MB.");
    } else if (err.response?.data?.message) {
      toast.error(err.response.data.message);
    } else {
      toast.error("Failed to update entry. Please try again.");
    }
  } finally {
    setEditLoading(false);
    setEditUploading(false);
  }
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

  // Add this style in your component or in a CSS file
const printStyles = `
  @media print {
    body { background: white !important; }
    .no-print { display: none !important; }
    #mileage-report-container { 
      max-width: 100% !important; 
      padding: 20px !important;
      margin: 0 !important;
    }
    .bg-gray-50 { background: white !important; }
    .shadow-sm { box-shadow: none !important; }
    .border { border: 1px solid #e5e7eb !important; }
  }
`;

const renderChart = () => {
  const sortedData = [...allData].sort((a, b) => b.mileage - a.mileage);

  switch (chartType) {
    case 'line':
      // Format dates for line chart
      const lineData = sortedData.map(item => ({
        ...item,
        displayLabel: item.date ? dayjs(item.date).format("DD-MM-YYYY") : item.tripLabel || 'N/A'
      }));

      return (
        <LineChart data={lineData} margin={{ top: 20, right: 30, bottom: 80, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="displayLabel"
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
      // Pie chart doesn't need date formatting as it shows vehicle names
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
  // ✅ If a specific vehicle is selected, show individual trips by date
  if (vehicleFilter) {
    // Show each trip's mileage with date as X-axis label in Indian format
    let tripData = sortedData
      .filter(item => item.vehicleNumber === vehicleFilter)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .map(item => ({
        ...item,
        displayLabel: item.date ? dayjs(item.date).format("DD-MM-YYYY") : 'N/A'
      }));

    // ✅ FIX: Group by date to show one bar per day
    // If there are multiple trips on the same day, show the average mileage
    const groupedByDate = {};
    tripData.forEach(item => {
      const dateKey = item.date;
      if (!groupedByDate[dateKey]) {
        groupedByDate[dateKey] = {
          date: dateKey,
          displayLabel: item.displayLabel,
          mileage: 0,
          kmsRun: 0,
          dieselUsed: 0,
          tripStart: item.tripStart,
          tripEnd: item.tripEnd,
          count: 0,
          trips: []
        };
      }
      groupedByDate[dateKey].mileage += item.mileage;
      groupedByDate[dateKey].kmsRun += item.kmsRun;
      groupedByDate[dateKey].dieselUsed += item.dieselUsed;
      groupedByDate[dateKey].count += 1;
      // Keep the first trip's start and last trip's end for display
      if (groupedByDate[dateKey].count === 1) {
        groupedByDate[dateKey].tripStart = item.tripStart;
      }
      groupedByDate[dateKey].tripEnd = item.tripEnd;
      groupedByDate[dateKey].trips.push(item);
    });

    // Convert to array and calculate average mileage per day
    const groupedData = Object.values(groupedByDate).map(group => ({
      ...group,
      mileage: +(group.mileage / group.count).toFixed(2),
      // For display label, show date with trip count
      displayLabel: `${group.displayLabel} (${group.count} trips)`,
      // Keep the first trip start and last trip end
      tripStart: group.trips[0].tripStart,
      tripEnd: group.trips[group.trips.length - 1].tripEnd,
    }));

    return (
      <BarChart data={groupedData} margin={{ top: 20, right: 30, bottom: 80, left: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis 
          dataKey="displayLabel"
          angle={-45} 
          textAnchor="end" 
          height={80}
          tick={{ fontSize: 11, fontWeight: '500' }}
          interval={0}
          width={100}
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
                  <p className="text-sm text-gray-600">
                    Total Trips: {data.count}
                  </p>
                  <p className="text-sm text-gray-600">
                    Total Distance: {data.kmsRun} km
                  </p>
                  <p className="text-sm text-gray-600">
                    Total Diesel: {data.dieselUsed} L
                  </p>
                  {data.trips && data.trips.length > 0 && (
                    <div className="mt-2 text-xs text-gray-500">
                      {data.trips.map((trip, idx) => (
                        <div key={idx}>
                          Trip {idx + 1}: {trip.tripStart} → {trip.tripEnd} km, {trip.mileage} km/L
                        </div>
                      ))}
                    </div>
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
          name="Avg Trip Mileage (km/L)" 
          fill="#4f46e5" 
          radius={[4, 4, 0, 0]} 
        />
      </BarChart>
    );
  }

      // ✅ If "All Vehicles" is selected, show grouped by vehicle (average)
      if (allData.length > 0) {
        const vehicleGroups = {};
        allData.forEach(item => {
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

        const chartData = Object.values(vehicleGroups).map(group => ({
          vehicleNumber: group.vehicleNumber,
          mileage: +(group.mileage / group.count).toFixed(2),
          kmsRun: group.kmsRun,
          dieselUsed: group.dieselUsed,
          tripCount: group.count,
          label: `${group.vehicleNumber}\n(${group.count} trips)`
        }));

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
                      <p className="text-sm text-gray-600">
                        Total Trips: {data.tripCount}
                      </p>
                      <p className="text-sm text-gray-600">
                        Total KMs: {data.kmsRun} km
                      </p>
                      <p className="text-sm text-gray-600">
                        Total Diesel: {data.dieselUsed} L
                      </p>
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
      return null;
  }
};

// Add this function to fetch all data for PDF
const fetchAllDataForPDF = async () => {
  try {
    let queryParams = new URLSearchParams();
    if (startDate) queryParams.append('startDate', startDate);
    if (endDate) queryParams.append('endDate', endDate);
    if (vehicleFilter) queryParams.append('vehicleNumber', vehicleFilter);
    // ✅ IMPORTANT: No page/limit to get ALL data

    const res = await axiosInstance.get(
      `/diesel/trip-mileage?${queryParams.toString()}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    let rawData = [];
    if (res.data.data && Array.isArray(res.data.data)) {
      rawData = res.data.data;
    } else if (Array.isArray(res.data)) {
      rawData = res.data;
    }

    return rawData.map(d => ({
      ...d,
      mileage: isNaN(d.mileage) ? 0 : +d.mileage,
      kmsRun: isNaN(d.kmsRun) ? 0 : +d.kmsRun,
      dieselUsed: isNaN(d.dieselUsed) ? 0 : +d.dieselUsed,
      vehicleNumber: d.vehicleNumber,
      date: d.date,
      tripStart: d.tripStart,
      tripEnd: d.tripEnd,
    }));
  } catch (err) {
    console.error("Failed to fetch all data for PDF:", err);
    throw err;
  }
};

const downloadPageAsPDF = async () => {
  if (allData.length === 0) {
    toast.error("No data to export");
    return;
  }

  toast.loading("Fetching all data for PDF...", { id: "pdf-download" });

  try {
    // ✅ Fetch ALL data for PDF
    const allDataForPDF = await fetchAllDataForPDF();
    
    if (!allDataForPDF || allDataForPDF.length === 0) {
      toast.error("No data available for PDF", { id: "pdf-download" });
      return;
    }

    toast.loading("Generating PDF...", { id: "pdf-download" });

    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    // Add company header
    pdf.setFillColor(59, 130, 246);
    pdf.rect(0, 0, 297, 22, 'F');
    
    pdf.setFontSize(16);
    pdf.setTextColor(255, 255, 255);
    pdf.text('Vehicle Trip Mileage Report', 148, 13, { align: 'center' });
    
    // Add generation date
    pdf.setFontSize(9);
    pdf.setTextColor(255, 255, 255);
    pdf.text(`Generated on: ${dayjs().format("DD-MM-YYYY HH:mm")}`, 148, 19, { align: 'center' });

    // Statistics Summary (using all data)
    let yPosition = 30;
    pdf.setFontSize(10);
    pdf.setTextColor(0, 0, 0);
    pdf.setFont(undefined, 'bold');
    pdf.text('Summary Statistics', 14, yPosition);
    pdf.setFont(undefined, 'normal');
    pdf.setFontSize(9);
    yPosition += 6;
    
    // Calculate stats from all data
    const totalMileage = allDataForPDF.reduce((sum, item) => sum + (item.mileage || 0), 0);
    const totalKms = allDataForPDF.reduce((sum, item) => sum + (item.kmsRun || 0), 0);
    const totalDiesel = allDataForPDF.reduce((sum, item) => sum + (item.dieselUsed || 0), 0);
    const avgMileage = allDataForPDF.length > 0 ? totalMileage / allDataForPDF.length : 0;

    pdf.text(`Average Mileage: ${avgMileage.toFixed(2)} km/L`, 14, yPosition);
    pdf.text(`Total Distance: ${totalKms.toFixed(0)} km`, 70, yPosition);
    pdf.text(`Fuel Consumed: ${totalDiesel.toFixed(1)} L`, 130, yPosition);
    pdf.text(`Total Trips: ${allDataForPDF.length}`, 190, yPosition);
    pdf.text(`Vehicle: ${vehicleFilter || 'All Vehicles'}`, 230, yPosition);
    
    yPosition += 10;

    // ✅ NEW: Calculate average mileage per vehicle
    const vehicleAvgMap = {};
    allDataForPDF.forEach(item => {
      if (!vehicleAvgMap[item.vehicleNumber]) {
        vehicleAvgMap[item.vehicleNumber] = {
          vehicleNumber: item.vehicleNumber,
          totalMileage: 0,
          totalKms: 0,
          totalDiesel: 0,
          count: 0
        };
      }
      vehicleAvgMap[item.vehicleNumber].totalMileage += item.mileage || 0;
      vehicleAvgMap[item.vehicleNumber].totalKms += item.kmsRun || 0;
      vehicleAvgMap[item.vehicleNumber].totalDiesel += item.dieselUsed || 0;
      vehicleAvgMap[item.vehicleNumber].count += 1;
    });

    // Convert to array and calculate averages
    const vehicleAvgData = Object.values(vehicleAvgMap).map(vehicle => ({
      vehicleNumber: vehicle.vehicleNumber,
      avgMileage: +(vehicle.totalMileage / vehicle.count).toFixed(2),
      totalKms: vehicle.totalKms,
      totalDiesel: +(vehicle.totalDiesel).toFixed(1),
      tripCount: vehicle.count
    }));

    // Sort by vehicle number
    vehicleAvgData.sort((a, b) => a.vehicleNumber.localeCompare(b.vehicleNumber));

    // ✅ Add Vehicle Average Summary Table
    pdf.setFontSize(10);
    pdf.setTextColor(0, 0, 0);
    pdf.setFont(undefined, 'bold');
    pdf.text('Vehicle Average Mileage Summary', 14, yPosition);
    pdf.setFont(undefined, 'normal');
    yPosition += 6;

    // Vehicle Average table
    const vehicleAvgHeaders = ['Sr No', 'Vehicle Number', 'Avg Mileage (km/L)', 'Total KMs', 'Total Diesel (L)', 'Trips'];
    const vehicleAvgRows = vehicleAvgData.map((v, idx) => [
      (idx + 1).toString(),
      v.vehicleNumber,
      v.avgMileage + ' km/L',
      v.totalKms + ' km',
      v.totalDiesel + ' L',
      v.tripCount.toString()
    ]);

    autoTable(pdf, {
      startY: yPosition,
      head: [vehicleAvgHeaders],
      body: vehicleAvgRows,
      theme: 'grid',
      styles: { fontSize: 7, cellPadding: 2 },
      headStyles: { 
        fillColor: [34, 197, 94], // Green color for summary
        textColor: [255, 255, 255], 
        fontSize: 8, 
        fontStyle: 'bold',
        halign: 'center'
      },
      columnStyles: {
        0: { cellWidth: 12, halign: 'center' },
        1: { cellWidth: 45 },
        2: { cellWidth: 35, halign: 'center' },
        3: { cellWidth: 30, halign: 'right' },
        4: { cellWidth: 30, halign: 'right' },
        5: { cellWidth: 20, halign: 'center' },
      },
      margin: { left: 10, right: 10 },
      pageBreak: 'auto',
      tableWidth: 'auto'
    });

    // Get the Y position after the vehicle summary table
    const afterSummaryY = pdf.lastAutoTable.finalY + 10;

    // ✅ Detailed Trip Table
    pdf.setFontSize(10);
    pdf.setTextColor(0, 0, 0);
    pdf.setFont(undefined, 'bold');
    pdf.text('Detailed Trip Records', 14, afterSummaryY);
    pdf.setFont(undefined, 'normal');
    
    const tableY = afterSummaryY + 6;

    // Add table with ALL data
    const tableHeaders = ['Sr No', 'Date', 'Vehicle', 'Start KMs', 'End KMs', 'KM Run', 'Diesel (L)', 'Mileage'];
    const tableData = allDataForPDF.map((v, idx) => [
      (idx + 1).toString(),
      v.date ? dayjs(v.date).format("DD-MM-YYYY") : 'N/A',
      v.vehicleNumber,
      v.tripStart + ' km',
      v.tripEnd + ' km',
      v.kmsRun + ' km',
      v.dieselUsed + ' L',
      v.mileage + ' km/L'
    ]);

    autoTable(pdf, {
      startY: tableY,
      head: [tableHeaders],
      body: tableData,
      theme: 'grid',
      styles: { fontSize: 7, cellPadding: 2 },
      headStyles: { 
        fillColor: [59, 130, 246], 
        textColor: [255, 255, 255], 
        fontSize: 8, 
        fontStyle: 'bold',
        halign: 'center'
      },
      columnStyles: {
        0: { cellWidth: 12, halign: 'center' },
        1: { cellWidth: 22, halign: 'center' },
        2: { cellWidth: 35 },
        3: { cellWidth: 25, halign: 'right' },
        4: { cellWidth: 25, halign: 'right' },
        5: { cellWidth: 22, halign: 'right' },
        6: { cellWidth: 22, halign: 'right' },
        7: { cellWidth: 25, halign: 'center' },
      },
      margin: { left: 10, right: 10 },
      pageBreak: 'auto',
      rowPageBreak: 'auto',
      tableWidth: 'auto'
    });

    // Add footer
    const pageCount = pdf.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      pdf.setFontSize(7);
      pdf.setTextColor(128, 128, 128);
      pdf.text(`Page ${i} of ${pageCount}`, 280, 195, { align: 'right' });
      pdf.text(`Total Records: ${allDataForPDF.length}`, 15, 195);
      pdf.text(`Date Range: ${dayjs(startDate).format("DD-MM-YYYY")} to ${dayjs(endDate).format("DD-MM-YYYY")}`, 15, 190);
    }

    pdf.save(`mileage-report-${dayjs().format("DD-MM-YYYY")}.pdf`);
    toast.success("PDF downloaded successfully!", { id: "pdf-download" });
  } catch (error) {
    console.error("Error generating PDF:", error);
    toast.error("Failed to generate PDF. Please try again.", { id: "pdf-download" });
  }
};

// Reset entries filters
const resetEntriesFilters = () => {
  setEntriesSearchTerm("");
  setEntriesStartDate("");
  setEntriesEndDate("");
  setEntriesVehicleFilter("");
  setEntriesPage(1);
};

// Add delete entry function
const handleDeleteEntry = async (entryId) => {
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
    setDeleteLoading(true);
    try {
      await axiosInstance.delete(`/diesel/delete/${entryId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success("Entry deleted successfully!");
      fetchMileageEntries(entriesPage);
      fetchAllMileageData();
      fetchTableData();
    } catch (err) {
      console.error("Failed to delete entry:", err);
      toast.error("Failed to delete entry. Please try again.");
    } finally {
      setDeleteLoading(false);
    }
  }
};

// Add function to remove individual file from entry
const handleRemoveFile = async (entryId, fileUrl) => {
  const result = await Swal.fire({
    title: 'Remove File?',
    text: "Are you sure you want to remove this file?",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
    confirmButtonText: 'Yes, remove it!'
  });

  if (result.isConfirmed) {
    try {
      // Find the entry first
      const entry = mileageEntries.find(e => e._id === entryId);
      if (!entry) {
        toast.error("Entry not found");
        return;
      }

      // Filter out the file URL
      const updatedImageUrls = entry.imageUrls.filter(url => url !== fileUrl);

      // Update the entry
      await axiosInstance.patch(`/diesel/update/${entryId}`, {
        imageUrls: updatedImageUrls
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success("File removed successfully!");
      fetchMileageEntries(entriesPage);
      fetchAllMileageData();
      fetchTableData();
    } catch (err) {
      console.error("Failed to remove file:", err);
      toast.error("Failed to remove file. Please try again.");
    }
  }
};

  return (
    <div className="min-h-screen bg-gray-50">
      <InternalNavbar />
      
      <div id="mileage-report-container" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
        {allData.length > 0 && (
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
                  <p className="text-2xl font-bold text-gray-900">{allData.length}</p>
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
              <button
  onClick={downloadPageAsPDF}
  disabled={allData.length === 0}
  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200 flex items-center gap-2 font-medium"
>
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
  Download PDF
</button>
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
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
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
            ) : allData.length === 0 ? (
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

                {/* Table */}
                {/* <div className="mt-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">📋 Trip Details</h3>
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
  {v.date ? dayjs(v.date).format("DD-MM-YYYY") : 'N/A'}
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
                        
                        <button                          onClick={() => setPage(p => Math.min(p + 1, totalPages))}
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
                </div> */}
              </>
            )}
          </div>
        </div>

        {/* Mileage Entry Form & Table with Edit */}
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
      value={entryFormData.fuelSlipNo}  // ✅ FIXED
      onChange={handleInputChange}       // ✅ FIXED
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
     FUEL-Petrol/Diesel/CNG (in Ltrs/Kg)
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
          {/* Mileage Entries Table with Edit */}
<div className="mt-8">
  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
    <h3 className="text-lg font-semibold text-gray-900">📋 Mileage Entries Filter</h3>
    <span className="text-sm text-gray-500">
      Total: {entriesTotal} entries
    </span>
  </div>

  {/* Filter Bar */}
  <div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
      {/* Search by Vehicle or Fuel Slip No */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Search
        </label>
        <input
          type="text"
          placeholder="Vehicle or Fuel Slip No..."
          value={entriesSearchTerm}
          onChange={(e) => {
            setEntriesSearchTerm(e.target.value);
            setEntriesPage(1);
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
        />
      </div>

      {/* Vehicle Filter */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Vehicle
        </label>
        <select
          value={entriesVehicleFilter}
          onChange={(e) => {
            setEntriesVehicleFilter(e.target.value);
            setEntriesPage(1);
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
        >
          <option value="">All Vehicles</option>
          {vehicleList.map((v) => (
            <option key={v._id} value={v.vehicleNumber}>
              {v.vehicleNumber}
            </option>
          ))}
        </select>
      </div>

      {/* Start Date */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          From Date
        </label>
        <input
          type="date"
          value={entriesStartDate}
          onChange={(e) => {
            setEntriesStartDate(e.target.value);
            setEntriesPage(1);
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
        />
      </div>

      {/* End Date */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          To Date
        </label>
        <input
          type="date"
          value={entriesEndDate}
          onChange={(e) => {
            setEntriesEndDate(e.target.value);
            setEntriesPage(1);
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
        />
      </div>
    </div>

    {/* Filter Actions */}
    <div className="flex flex-wrap gap-2 mt-3">
      <button
        onClick={() => {
          setEntriesSearchTerm("");
          setEntriesVehicleFilter("");
          setEntriesStartDate("");
          setEntriesEndDate("");
          setEntriesPage(1);
        }}
        className="px-4 py-1.5 bg-gray-500 text-white rounded-lg text-sm hover:bg-gray-600 transition-colors duration-200"
      >
        Clear Filters
      </button>
      <button
        onClick={() => {
          setEntriesPage(1);
          fetchMileageEntries(1);
        }}
        className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors duration-200 flex items-center gap-1"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        Apply Filters
      </button>
      {(entriesSearchTerm || entriesVehicleFilter || entriesStartDate || entriesEndDate) && (
        <span className="text-xs text-gray-500 flex items-center ml-2">
          Filters applied
        </span>
      )}
    </div>
  </div>

  {entriesLoading ? (
    <div className="text-center py-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
    </div>
  ) : mileageEntries.length === 0 ? (
    <div className="text-center py-8 text-gray-500">
      No mileage entries found. {entriesSearchTerm || entriesVehicleFilter || entriesStartDate || entriesEndDate ? 'Try adjusting your filters.' : 'Add your first entry above!'}
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
                FUEL-Petrol/Diesel/CNG (in Ltrs/Kg)
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Files
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
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
          <div key={index} className="flex items-center gap-0.5 bg-blue-50 rounded-md px-1.5 py-0.5 border border-blue-200">
            <button
              onClick={() => setPreviewImage(url)}
              className="text-blue-600 hover:text-blue-800 text-xs hover:underline"
            >
              📎 {index + 1}
            </button>
            <button
              onClick={() => handleRemoveFile(entry._id, url)}
              className="text-red-500 hover:text-red-700 text-xs font-bold ml-0.5"
              title="Remove file"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  ) : (
    <span className="text-gray-400">No files</span>
  )}
</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm">
                  <button
                    onClick={() => handleEditClick(entry)}
                    className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit
                  </button>
                  <button
      onClick={() => handleDeleteEntry(entry._id)}
      disabled={deleteLoading}
      className="text-red-600 hover:text-red-800 font-medium text-sm flex items-center gap-1"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
      Delete
    </button>
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

{/* Edit Modal */}
{editingEntry && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Edit Mileage Entry
        </h3>
        <p className="text-gray-600 mt-1">
          Update the mileage entry details
        </p>
      </div>

      <form onSubmit={handleUpdateEntry} className="p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date
            </label>
            <input
              type="date"
              name="date"
              value={editFormData.date}
              onChange={handleEditInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
              disabled
            />
            <p className="text-xs text-gray-500 mt-1">Date cannot be changed</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Vehicle Number
            </label>
            <input
              type="text"
              name="vehicleNumber"
              value={editFormData.vehicleNumber}
              onChange={handleEditInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
              disabled
            />
            <p className="text-xs text-gray-500 mt-1">Vehicle cannot be changed</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fuel Slip No
            </label>
            <input
              type="text"
              name="fuelSlipNo"
              value={editFormData.fuelSlipNo}
              onChange={handleEditInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
              placeholder="Enter fuel slip number"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Meter Reading (KM) *
            </label>
            <input
              type="number"
              name="kmsReading"
              value={editFormData.kmsReading}
              onChange={handleEditInputChange}
              required
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
             FUEL-Petrol/Diesel/CNG (in Ltrs/Kg)
            </label>
            <input
              type="number"
              name="dieselLiters"
              value={editFormData.dieselLiters}
              onChange={handleEditInputChange}
              required
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload New Files
            </label>
            <input
              type="file"
              id="editFileInput"
              multiple
              onChange={handleEditFileChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {editSelectedFiles.length > 0 && (
              <p className="mt-1 text-sm text-blue-600">
                {editSelectedFiles.length} new file(s) selected
              </p>
            )}
          </div>
        </div>

      {/* Existing Files */}
{editFormData.imageUrls && editFormData.imageUrls.length > 0 && (
  <div className="mt-2">
    <label className="block text-sm font-medium text-gray-700 mb-2">
      Existing Files
    </label>
    <div className="flex flex-wrap gap-2">
      {editFormData.imageUrls.map((url, index) => (
        <div key={index} className="flex items-center gap-1 bg-blue-50 border border-blue-200 rounded-md px-3 py-1.5">
          <button
            type="button"
            onClick={() => setPreviewImage(url)}
            className="text-blue-600 hover:text-blue-800 text-xs hover:underline flex items-center gap-1"
          >
            📎 File {index + 1}
          </button>
          <button
            type="button"
            onClick={async () => {
              const result = await Swal.fire({
                title: 'Remove File?',
                text: `Are you sure you want to remove File ${index + 1}?`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#3085d6',
                confirmButtonText: 'Yes, remove it!'
              });

              if (result.isConfirmed) {
                const updatedUrls = editFormData.imageUrls.filter((_, i) => i !== index);
                setEditFormData(prev => ({
                  ...prev,
                  imageUrls: updatedUrls
                }));
                toast.success("File will be removed on save");
              }
            }}
            className="text-red-500 hover:text-red-700 text-xs font-bold"
          >
            ×
          </button>
        </div>
      ))}
    </div>
    <p className="text-xs text-gray-500 mt-1">Click on file to preview, or × to remove</p>
  </div>
)}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={() => {
              setEditingEntry(null);
              setEditSelectedFiles([]);
            }}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors duration-200 font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={editLoading || editUploading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {(editLoading || editUploading) ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                {editUploading ? 'Uploading...' : 'Saving...'}
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Save Changes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  </div>
)}

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