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
      setData(res.data.data);
      setTotalPages(Math.ceil(res.data.total / limit));
    } catch (err) {
      console.error("Failed to fetch mileage data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchMileage();
  }, [month, vehicleFilter, page, token]);

  return (
    <>
      <InternalNavbar />
      <div className="p-6 bg-white shadow rounded-xl max-w-7xl mx-auto mt-6">
        <h2 className="text-2xl font-bold mb-4 text-indigo-700 text-center">📊 Vehicle Mileage Report</h2>

        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
          <label className="text-sm font-medium text-gray-600">
            Select Month:
            <input
              type="month"
              value={month}
              onChange={(e) => {
                setMonth(e.target.value);
                setPage(1);
              }}
              className="ml-2 border rounded px-2 py-1"
            />
          </label>

          <input
            type="text"
            placeholder="Filter by Vehicle Number"
            value={vehicleFilter}
            onChange={(e) => {
              setVehicleFilter(e.target.value);
              setPage(1);
            }}
            className="border rounded px-3 py-1"
          />

          <button
            onClick={fetchMileage}
            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 text-sm"
          >
            🔄 Refresh
          </button>
        </div>

        {loading ? (
          <div className="text-center text-blue-600">Loading mileage data...</div>
        ) : data.length === 0 ? (
          <p className="text-center text-gray-500">No mileage data available for this month.</p>
        ) : (
          <>
            {/* Chart */}
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={data} margin={{ top: 20, right: 30, bottom: 50, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="vehicleNumber" angle={-45} textAnchor="end" height={60} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="mileage" name="Mileage (KM/L)" fill="#4f46e5" />
                <Bar dataKey="kmsRun" name="KMs Run" fill="#38bdf8" />
                <Bar dataKey="dieselUsed" name="Diesel (L)" fill="#f97316" />
              </BarChart>
            </ResponsiveContainer>

            {/* Table */}
          {/* Trip Table */}
{/* Trip Table with Units */}
<div className="mt-8 overflow-x-auto">
  <table className="min-w-full border text-sm text-left">
    <thead className="bg-indigo-100 text-indigo-800">
      <tr>
        <th className="p-3 border">Date</th>
        <th className="p-3 border">Vehicle</th>
        <th className="p-3 border">Start KMs</th>
        <th className="p-3 border">End KMs</th>
        <th className="p-3 border">KM Run</th>
        <th className="p-3 border">Diesel</th>
        <th className="p-3 border">Mileage</th>
      </tr>
    </thead>
    <tbody>
      {data.map((v, idx) => (
        <tr key={idx} className="hover:bg-gray-50">
          <td className="p-3 border">{v.date}</td>
          <td className="p-3 border">{v.vehicleNumber}</td>
          <td className="p-3 border">{v.tripStart} km</td>
          <td className="p-3 border">{v.tripEnd} km</td>
          <td className="p-3 border">{v.kmsRun} km</td>
          <td className="p-3 border">{v.dieselUsed} L</td>
          <td className="p-3 border font-semibold">{v.mileage} km/L</td>
        </tr>
      ))}
    </tbody>
  </table>
</div>



            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-end mt-4 gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  disabled={page === 1}
                  className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
                >
                  Prev
                </button>
                <span className="px-3 py-1 text-sm text-gray-600">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                  disabled={page === totalPages}
                  className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
