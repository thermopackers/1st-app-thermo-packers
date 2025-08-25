import React, { useState, useEffect } from "react";
import axiosInstance from "../axiosInstance";
import { useUserContext } from "../context/UserContext";
import InternalNavbar from "../components/InternalNavbar";
import { NavLink } from "react-router-dom";

const AttendanceLogs = () => {
const { token, user } = useUserContext();
  const [logs, setLogs] = useState([]);
  const [groupedLogs, setGroupedLogs] = useState([]);
  const [dateFilter, setDateFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [userFilter, setUserFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
const isPrivileged = ["admin", "accounts"].includes(user?.role);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/attendance", {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          date: dateFilter,
          role: roleFilter,
          userId: userFilter,
          page,
          limit: 20,
        },
      });
      setLogs(res.data.logs);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      console.error("Error fetching attendance:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, dateFilter, roleFilter, userFilter]);

  useEffect(() => {
    const groupByUserAndDate = () => {
      const groups = {};
      logs.forEach((log) => {
        const userId = log.user?._id;
        const date = new Date(log.time).toISOString().split("T")[0];
        const key = `${userId}-${date}`;

        if (!groups[key]) {
          groups[key] = {
            user: log.user,
            date,
            checkIn: null,
            checkOut: null,
          };
        }

        if (log.type === "check-in") {
          groups[key].checkIn = log;
        } else if (log.type === "check-out") {
          groups[key].checkOut = log;
        }
      });

      setGroupedLogs(Object.values(groups));
    };

    groupByUserAndDate();
  }, [logs]);

  const clearFilters = () => {
    setDateFilter("");
    setRoleFilter("");
    setUserFilter("");
    setPage(1);
  };

  return (
    <>
      <InternalNavbar />
      <div className="p-4 max-w-7xl mx-auto bg-white shadow-lg rounded-xl">
<h2 className="text-2xl font-bold mb-6 text-gray-800">
  {isPrivileged ? "All Employee Attendance Logs" : "Your Attendance Logs"}
</h2>

        {/* Filters */}
     <div className="flex flex-wrap gap-3 items-center mb-6">
  <input
    type="date"
    value={dateFilter}
    onChange={(e) => setDateFilter(e.target.value)}
    className="border border-gray-300 rounded-md px-4 py-2 text-sm w-full sm:w-auto"
  />

  {isPrivileged && (
    <select
      value={roleFilter}
      onChange={(e) => setRoleFilter(e.target.value)}
      className="border border-gray-300 rounded-md px-4 py-2 text-sm w-full sm:w-auto"
    >
      <option value="">All Roles</option>
      <option value="admin">Admin</option>
      <option value="sales">Sales</option>
      <option value="production">Production</option>
      <option value="dispatch">Dispatch</option>
      <option value="accounts">Accounts</option>
    </select>
  )}

  {isPrivileged && (
    <input
      type="text"
      placeholder="Search by Name"
      value={userFilter}
      onChange={(e) => setUserFilter(e.target.value)}
      className="border border-gray-300 rounded-md px-4 py-2 text-sm w-full sm:w-auto"
    />
  )}

<div className="flex items-center gap-3">
  {/* Clear Filters Button */}
  <button
    onClick={clearFilters}
    className="inline-flex items-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-800 
               px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
  >
    ❌ Clear Filters
  </button>

  {/* Monthly Reports Button (admin/accounts only) */}
  {/* {(user.role === "admin" || user.role === "accounts") && (
    <NavLink
      to="/monthly-reports"
      className={({ isActive }) =>
        `inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
         ${
           isActive
             ? "bg-blue-600 text-white shadow-md scale-105"
             : "bg-blue-100 text-blue-700 hover:bg-blue-200"
         }`
      }
    >
      📊 Monthly Reports
    </NavLink>
  )} */}
</div>


</div>


        {/* Table */}
        {loading ? (
          <div className="text-center py-6 text-gray-500">🔄 Loading attendance logs...</div>
        ) : groupedLogs.length === 0 ? (
          <div className="text-center text-gray-500 py-6">No records found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-gray-300 rounded-md shadow-sm">
             <thead className="bg-gray-100">
  <tr>
    <th className="p-2 border">Date</th>
    <th className="p-2 border">Name</th>
    <th className="p-2 border">Role</th>
    <th className="p-2 border">Check-In Time</th>
    <th className="p-2 border">Check-In Photo</th>
    <th className="p-2 border">Check-In Location</th>
    <th className="p-2 border">Check-Out Time</th>
    <th className="p-2 border">Check-Out Photo</th>
    <th className="p-2 border">Check-Out Location</th>
  </tr>
</thead>
<tbody>
  {groupedLogs.map((entry, idx) => (
    <tr key={idx} className="text-sm">
      <td className="p-2 border">{entry.date}</td>
      <td className="p-2 border">{entry.user?.name || "N/A"}</td>
      <td className="p-2 border capitalize">{entry.user?.role || "N/A"}</td>

      <td className="p-2 border">
        {entry.checkIn
          ? new Date(entry.checkIn.time).toLocaleTimeString()
          : "—"}
      </td>
      <td className="p-2 border text-blue-600 underline">
        {entry.checkIn?.photo ? (
          <a href={entry.checkIn.photo} target="_blank" rel="noopener noreferrer">
            View
          </a>
        ) : (
          "—"
        )}
      </td>
      <td className="p-2 border text-blue-600 underline">
        {entry.checkIn?.location?.lat && entry.checkIn?.location?.lng ? (
          <a
            href={`https://www.google.com/maps?q=${entry.checkIn.location.lat},${entry.checkIn.location.lng}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            📍 View
          </a>
        ) : (
          "—"
        )}
      </td>

      <td className="p-2 border">
        {entry.checkOut
          ? new Date(entry.checkOut.time).toLocaleTimeString()
          : "—"}
      </td>
      <td className="p-2 border text-blue-600 underline">
        {entry.checkOut?.photo ? (
          <a href={entry.checkOut.photo} target="_blank" rel="noopener noreferrer">
            View
          </a>
        ) : (
          "—"
        )}
      </td>
      <td className="p-2 border text-blue-600 underline">
        {entry.checkOut?.location?.lat && entry.checkOut?.location?.lng ? (
          <a
            href={`https://www.google.com/maps?q=${entry.checkOut.location.lat},${entry.checkOut.location.lng}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            📍 View
          </a>
        ) : (
          "—"
        )}
      </td>
    </tr>
  ))}
</tbody>

            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-wrap justify-center items-center gap-2 mt-6">
                <button
                  onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                  disabled={page === 1}
                  className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
                >
                  Prev
                </button>

                {page > 2 && (
                  <>
                    <button
                      onClick={() => setPage(1)}
                      className={`px-3 py-1 rounded text-sm ${
                        page === 1 ? "bg-blue-600 text-white" : "bg-gray-100 hover:bg-gray-200"
                      }`}
                    >
                      1
                    </button>
                    {page > 3 && <span className="px-2 text-sm">...</span>}
                  </>
                )}

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => Math.abs(p - page) <= 1)
                  .map((p) => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`px-3 py-1 rounded text-sm ${
                        page === p ? "bg-blue-600 text-white" : "bg-gray-100 hover:bg-gray-200"
                      }`}
                    >
                      {p}
                    </button>
                  ))}

                {page < totalPages - 1 && (
                  <>
                    {page < totalPages - 2 && <span className="px-2 text-sm">...</span>}
                    <button
                      onClick={() => setPage(totalPages)}
                      className={`px-3 py-1 rounded text-sm ${
                        page === totalPages ? "bg-blue-600 text-white" : "bg-gray-100 hover:bg-gray-200"
                      }`}
                    >
                      {totalPages}
                    </button>
                  </>
                )}

                <button
                  onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={page === totalPages}
                  className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default AttendanceLogs;
