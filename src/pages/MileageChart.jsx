import React, { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
  ResponsiveContainer, CartesianGrid,
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
  const [limit] = useState(5);
  const [totalPages, setTotalPages] = useState(1);

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
      mileage: isNaN(d.mileage) ? null : +d.mileage,
      kmsRun: isNaN(d.kmsRun) ? 0 : +d.kmsRun,
      dieselUsed: isNaN(d.dieselUsed) ? 0 : +d.dieselUsed,
label: `${d.vehicleNumber} (${d.tripStart}→${d.tripEnd})`
    }));

    setData(cleaned);
    setTotalPages(Math.ceil(res.data.total / limit));
  } catch (err) {
    console.error("Failed to fetch mileage data:", err);
  } finally {
    setLoading(false);
  }
};


useEffect(() => {
  if (token) {
    fetchMileage();

    // ✅ Fetch vehicle list
    axiosInstance.get("/vehicles/all", {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then((res) => {
      setVehicleList(res.data); // assume res.data = ["PB08 EL 9364", "PB10 XY 1234"]
    })
    .catch((err) => {
      console.error("Failed to fetch vehicle list:", err);
    });
  }
}, [month, vehicleFilter, page, token]);

  return (
    <>
      <InternalNavbar />
    <div className="p-4 sm:p-6 bg-white shadow rounded-xl max-w-7xl mx-auto mt-6">
  <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-indigo-700 text-center">
    📊 Vehicle Mileage Report
  </h2>

  {/* Filters */}
  <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4 mb-6">
    {/* Month Selector */}
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1">
      <label className="text-sm font-medium text-gray-600">Select Month:</label>
      <input
        type="month"
        value={month}
        onChange={(e) => {
          setMonth(e.target.value);
          setPage(1);
        }}
        className="border rounded px-2 py-1 text-sm"
      />
    </div>

    {/* Vehicle Filter */}
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1">
      <label className="text-sm font-medium text-gray-600">Vehicle:</label>
      <select
        value={vehicleFilter}
        onChange={(e) => {
          setVehicleFilter(e.target.value);
          setPage(1);
        }}
        className="border rounded px-3 py-1 text-sm"
      >
        <option value="">All Vehicles</option>
        {vehicleList.map((v) => (
          <option key={v._id} value={v.vehicleNumber}>
            {v.vehicleNumber}
          </option>
        ))}
      </select>
    </div>

    {/* Clear + Refresh */}
    <div className="flex gap-2 mt-2 sm:mt-0">
      <button
        onClick={() => {
          setVehicleFilter("");
          setMonth(dayjs().format("YYYY-MM"));
          setPage(1);
        }}
        className="bg-gray-200 text-gray-800 px-3 py-2 rounded hover:bg-gray-300 text-sm"
      >
        ❌ Clear Filters
      </button>

      <button
        onClick={fetchMileage}
        className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 text-sm"
      >
        🔄 Refresh
      </button>
    </div>
  </div>

  {/* Chart */}
  {loading ? (
    <div className="text-center text-blue-600">Loading mileage data...</div>
  ) : data.length === 0 ? (
    <p className="text-center text-gray-500">No mileage data available for this month.</p>
  ) : (
    <>
      <div className="w-full h-[350px] sm:h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 30, bottom: 50, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" angle={-45} textAnchor="end" height={60} />
            <YAxis />
            <Tooltip
              formatter={(value, name) => {
                if (name === "Mileage (KM/L)") return [`${value} km/L`, name];
                if (name === "KMs Run") return [`${value} km`, name];
                if (name === "Diesel (L)") return [`${value} L`, name];
                return [value, name];
              }}
              labelFormatter={(label) => `Trip: ${label}`}
            />
            <Legend />
            <Bar dataKey="mileage" name="Mileage (KM/L)" fill="#4f46e5" />
            <Bar dataKey="kmsRun" name="KMs Run" fill="#38bdf8" />
            <Bar dataKey="dieselUsed" name="Diesel (L)" fill="#f97316" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Table */}
      <div className="mt-8 overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-indigo-100 text-indigo-800 font-semibold">
            <tr>
              <th className="p-3 text-left">Date</th>
              <th className="p-3 text-left">Vehicle</th>
              <th className="p-3 text-left">Start KMs</th>
              <th className="p-3 text-left">End KMs</th>
              <th className="p-3 text-left">KM Run</th>
              <th className="p-3 text-left">Diesel</th>
              <th className="p-3 text-left">Mileage</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.map((v, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                <td className="p-3">{v.date}</td>
                <td className="p-3">{v.vehicleNumber}</td>
                <td className="p-3">{v.tripStart} km</td>
                <td className="p-3">{v.tripEnd} km</td>
                <td className="p-3">{v.kmsRun} km</td>
                <td className="p-3">{v.dieselUsed} L</td>
                <td className="p-3 font-semibold">{v.mileage} km/L</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-end mt-6 gap-3 items-center">
          <button
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={page === 1}
            className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
          >
            ⬅️ Prev
          </button>
          <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
          <button
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            disabled={page === totalPages}
            className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
          >
            Next ➡️
          </button>
        </div>
      )}
    </>
  )}
</div>

    </>
  );
}
