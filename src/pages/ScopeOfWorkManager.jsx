import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../axiosInstance";
import InternalNavbar from "../components/InternalNavbar";
import Swal from "sweetalert2";
import toast from "react-hot-toast";
import { motion } from "framer-motion";

const ScopeOfWorkManager = () => {
  const navigate = useNavigate();
  const [scopes, setScopes] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newScopeName, setNewScopeName] = useState("");
  const [saving, setSaving] = useState(false);

  // ---------- FETCH ----------
  const fetchAll = async () => {
    try {
      setLoading(true);
      const [scopesRes, usersRes] = await Promise.all([
        axiosInstance.get("/scope-of-work"),
        axiosInstance.get("/users/all"),
      ]);
      setScopes(scopesRes.data || []);
      setUsers(usersRes.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  // ---------- MASTER LIST CRUD ----------
  const handleCreate = async () => {
    if (!newScopeName.trim()) return;
    try {
      setSaving(true);
      await axiosInstance.post("/scope-of-work", {
        name: newScopeName.trim(),
      });
      toast.success("Scope of work added");
      setNewScopeName("");
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add");
    } finally {
      setSaving(false);
    }
  };

  const handleRename = async (scope) => {
    const { value } = await Swal.fire({
      title: "Rename Scope of Work",
      input: "text",
      inputValue: scope.name,
      showCancelButton: true,
      confirmButtonColor: "#4f46e5",
      inputValidator: (v) => (!v || !v.trim() ? "Name required" : null),
    });
    if (!value) return;
    try {
      await axiosInstance.put(`/scope-of-work/${scope._id}`, {
        name: value.trim(),
      });
      toast.success("Renamed");
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to rename");
    }
  };

  const handleDelete = async (scope) => {
    const confirm = await Swal.fire({
      title: `Delete "${scope.name}"?`,
      text: "This will remove this scope of work from all users.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: "Yes, delete",
    });
    if (!confirm.isConfirmed) return;
    try {
      await axiosInstance.delete(`/scope-of-work/${scope._id}`);
      toast.success("Deleted");
      fetchAll();
    } catch (err) {
      toast.error("Failed to delete");
    }
  };

  // ---------- ASSIGN (with optional position) ----------
  const assignToUser = async (userId, scopeName, position = null) => {
    try {
      await axiosInstance.post("/scope-of-work/assign", {
        userId,
        scopeName,
        position,
      });

      setUsers((prev) =>
        prev.map((u) => {
          if (u._id !== userId) return u;
          if ((u.scopeOfWork || []).includes(scopeName)) return u;

          const arr = [...(u.scopeOfWork || [])];
          if (position === null || position === undefined) {
            arr.push(scopeName);
          } else {
            while (arr.length < position) arr.push("");
            if (position >= arr.length) arr.push(scopeName);
            else arr.splice(position, 0, scopeName);
          }
          // trim trailing empty
          while (arr.length > 0 && arr[arr.length - 1] === "") arr.pop();
          return { ...u, scopeOfWork: arr };
        })
      );
      toast.success(`Assigned "${scopeName}"`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to assign");
    }
  };

  // ---------- UNASSIGN ----------
  const unassignFromUser = async (userId, scopeName) => {
    const confirm = await Swal.fire({
      title: "Remove Responsibility?",
      text: `Remove "${scopeName}" from this user?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: "Remove",
    });
    if (!confirm.isConfirmed) return;

    try {
      await axiosInstance.post("/scope-of-work/unassign", {
        userId,
        scopeName,
      });
      setUsers((prev) =>
        prev.map((u) =>
          u._id === userId
            ? {
                ...u,
                scopeOfWork: (u.scopeOfWork || []).filter(
                  (s) => s !== scopeName
                ),
              }
            : u
        )
      );
      toast.success("Removed");
    } catch (err) {
      toast.error("Failed to unassign");
    }
  };

  // ---------- COMPUTED ----------
  const usersWithAnyScope = users.filter(
    (u) => (u.scopeOfWork || []).filter(Boolean).length > 0
  );

  // How many responsibility columns to render
  const maxResponsibilityCount = useMemo(() => {
    const dataMax = users.reduce(
      (max, u) => Math.max(max, (u.scopeOfWork || []).length),
      0
    );
    return Math.max(2, dataMax); // always at least 1st & 2nd
  }, [users]);

  // Green shades cycling for arbitrary number of columns
  const positionStyles = [
    {
      header: "bg-lime-200 text-lime-900",
      cell: "bg-lime-100/70",
      chip: "bg-lime-200 text-lime-900 border-lime-400",
      dot: "bg-lime-600",
      remove: "text-lime-800",
    },
    {
      header: "bg-green-800 text-green-50",
      cell: "bg-green-800/90",
      chip: "bg-green-900 text-green-50 border-green-700",
      dot: "bg-green-300",
      remove: "text-green-300",
    },
    {
      header: "bg-emerald-700 text-emerald-50",
      cell: "bg-emerald-700/80",
      chip: "bg-emerald-800 text-emerald-50 border-emerald-600",
      dot: "bg-emerald-200",
      remove: "text-emerald-100",
    },
    {
      header: "bg-teal-700 text-teal-50",
      cell: "bg-teal-700/80",
      chip: "bg-teal-800 text-teal-50 border-teal-600",
      dot: "bg-teal-200",
      remove: "text-teal-100",
    },
    {
      header: "bg-green-600 text-green-50",
      cell: "bg-green-600/80",
      chip: "bg-green-700 text-green-50 border-green-500",
      dot: "bg-green-200",
      remove: "text-green-100",
    },
  ];

  const getStyle = (pos) => positionStyles[pos % positionStyles.length];

  const ordinal = (n) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-blue-700 font-semibold">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <InternalNavbar />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white py-8 px-4">
        <div className="max-w-7xl mx-auto">
          {/* HEADER */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                📋 Scope of Work Manager
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Create, edit, delete scope of works and assign them to
                employees at any priority level
              </p>
            </div>
            <button
              onClick={() => navigate(-1)}
              className="glass-btn px-4 py-2 rounded-xl text-gray-700 font-medium"
            >
              ← Back
            </button>
          </div>

          {/* MASTER LIST */}
          <div className="bg-white rounded-2xl shadow-md p-5 sm:p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">
              🗂️ Master List of Scope of Works ({scopes.length})
            </h2>

            <div className="flex flex-col sm:flex-row gap-2 mb-4">
              <input
                type="text"
                placeholder="Add new scope of work..."
                value={newScopeName}
                onChange={(e) => setNewScopeName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 outline-none"
              />
              <button
                onClick={handleCreate}
                disabled={saving || !newScopeName.trim()}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-5 py-2 rounded-lg font-semibold text-sm transition"
              >
                {saving ? "Adding..." : "+ Add"}
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {scopes.length === 0 && (
                <p className="text-sm text-gray-400 italic">
                  No scope of works yet. Add your first one above.
                </p>
              )}
              {scopes.map((s) => {
                const usage = users.reduce(
                  (count, u) =>
                    (u.scopeOfWork || []).includes(s.name) ? count + 1 : count,
                  0
                );
                return (
                  <motion.div
                    key={s._id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-1 rounded-full px-3 py-1.5 text-sm border bg-indigo-50 border-indigo-200"
                  >
                    <span className="font-medium text-indigo-800">
                      {s.name}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-indigo-200 text-indigo-700">
                      {usage} user{usage === 1 ? "" : "s"}
                    </span>
                    <button
                      onClick={() => handleRename(s)}
                      title="Rename"
                      className="text-indigo-500 hover:text-indigo-700 ml-1 text-xs"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(s)}
                      title="Delete"
                      className="text-red-500 hover:text-red-700 text-xs"
                    >
                      ✕
                    </button>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* RESPONSIBILITY TABLE */}
          <div className="bg-white rounded-2xl shadow-md overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h2 className="text-lg font-bold">📊 Responsibility Overview</h2>
                <p className="text-xs text-indigo-100 mt-0.5">
                  Users and their {maxResponsibilityCount} priority level(s)
                </p>
              </div>
           
            </div>

            <div className="overflow-x-auto">
              {usersWithAnyScope.length === 0 ? (
                <div className="text-center py-14 px-4">
                  <div className="text-5xl mb-3 opacity-60">📭</div>
                  <p className="text-sm text-gray-600 font-medium">
                    No responsibilities assigned yet.
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Use the assign panel below to assign scope of work to users.
                  </p>
                </div>
              ) : (
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-100 text-gray-700 uppercase text-xs">
                    <tr>
                      <th className="px-4 py-3 w-12">#</th>
                      <th className="px-4 py-3 min-w-[200px]">User</th>
                      {Array.from({ length: maxResponsibilityCount }).map(
                        (_, i) => (
                          <th
                            key={i}
                            className={`px-4 py-3 min-w-[180px] ${getStyle(i).header}`}
                          >
                            <span className="inline-flex items-center gap-1.5">
                              <span
                                className={`w-2 h-2 rounded-full ${getStyle(i).dot}`}
                              />
                              {ordinal(i + 1)} Responsibility
                            </span>
                          </th>
                        )
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {[...usersWithAnyScope]
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map((u, idx) => (
                        <tr
                          key={u._id}
                          className="border-b hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-4 py-3 text-gray-500">{idx + 1}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              {u.profilePicture ? (
                                <img
                                  src={u.profilePicture}
                                  alt=""
                                  className="w-9 h-9 rounded-full object-cover border flex-shrink-0"
                                />
                              ) : (
                                <div className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                                  {u.name?.charAt(0)?.toUpperCase()}
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="font-semibold text-gray-800 truncate">
                                  {u.name}
                                </p>
                                <p className="text-[11px] text-gray-500 capitalize truncate">
                                  {u.designation || "—"}
                                </p>
                              </div>
                            </div>
                          </td>

                          {Array.from({ length: maxResponsibilityCount }).map(
                            (_, i) => {
                              const scopeName = (u.scopeOfWork || [])[i] || "";
                              const style = getStyle(i);
                              return (
                                <td
                                  key={i}
                                  className={`px-4 py-3 ${style.cell}`}
                                >
                                  {scopeName ? (
                                    <span
                                      className={`inline-flex items-center gap-1.5 border px-2.5 py-1 rounded-full text-xs font-semibold max-w-full shadow-sm ${style.chip}`}
                                    >
                                      <span
                                        className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${style.dot}`}
                                      />
                                      <span className="truncate">
                                        {scopeName}
                                      </span>
                                      <button
                                        onClick={() =>
                                          unassignFromUser(u._id, scopeName)
                                        }
                                        className={`ml-1 font-bold flex-shrink-0 ${style.remove} hover:text-red-500`}
                                        title="Remove"
                                      >
                                        ✕
                                      </button>
                                    </span>
                                  ) : (
                                    <span className="text-gray-400 text-xs italic">
                                      —
                                    </span>
                                  )}
                                </td>
                              );
                            }
                          )}
                        </tr>
                      ))}
                  </tbody>
                </table>
              )}
            </div>

            {usersWithAnyScope.length > 0 && (
              <div className="bg-gray-50 border-t px-4 py-3 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-600">
                <span>
                  Showing <strong>{usersWithAnyScope.length}</strong> user(s)
                  with responsibilities
                </span>
              
              </div>
            )}
          </div>

          {/* ASSIGN PANEL */}
          <AssignPanel
            scopes={scopes}
            users={users}
            onAssign={assignToUser}
            disabled={saving}
            maxResponsibilityCount={maxResponsibilityCount}
          />
        </div>
      </div>
    </>
  );
};

// ============ ASSIGN PANEL ============
const AssignPanel = ({
  scopes,
  users,
  onAssign,
  maxResponsibilityCount,
}) => {
  const [selectedScope, setSelectedScope] = useState("");
  const [search, setSearch] = useState("");
  const [position, setPosition] = useState(""); // "" = auto (push to end)

  const scopeUsage = {};
  users.forEach((u) => {
    (u.scopeOfWork || []).forEach((s) => {
      if (s) scopeUsage[s] = (scopeUsage[s] || 0) + 1;
    });
  });

  const selectedUsage = selectedScope ? scopeUsage[selectedScope] || 0 : 0;

  const visibleUsers = users.filter((u) => {
    if (!search.trim()) return true;
    return (
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      (u.designation || "").toLowerCase().includes(search.toLowerCase())
    );
  });

  const ordinal = (n) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  // Provide slots 0..max+2 so admins can always go one step beyond the current max
  const positionOptions = Array.from(
    { length: Math.max(maxResponsibilityCount, 2) + 2 },
    (_, i) => i
  );

  return (
    <div className="bg-white rounded-2xl shadow-md p-5 sm:p-6 mt-6">
      <h2 className="text-lg font-bold text-gray-800 mb-1">
        ➕ Assign Scope of Work to Users
      </h2>
      <p className="text-xs text-gray-500 mb-4">
        Choose a priority level to insert at a specific position, or leave as
        “Auto” to append to the end.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">
            Select Scope of Work
          </label>
          <select
            value={selectedScope}
            onChange={(e) => setSelectedScope(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 outline-none"
          >
            <option value="">— Choose —</option>
            {scopes.map((s) => {
              const used = scopeUsage[s.name] || 0;
              return (
                <option key={s._id} value={s.name}>
                  {s.name} ({used} user{used === 1 ? "" : "s"})
                </option>
              );
            })}
          </select>
        </div>

     

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">
            Search User
          </label>
          <input
            type="text"
            placeholder="Name or designation..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            disabled={!selectedScope}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
        </div>
      </div>

      {!selectedScope && (
        <p className="text-sm text-gray-500 italic text-center py-4">
          Select a scope of work above to see users you can assign it to.
        </p>
      )}

      {selectedScope && (
        <>
          <div className="flex flex-wrap items-center gap-3 mb-2 text-[11px] text-gray-600">
            <span className="inline-flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
              Already assigned ({selectedUsage} user
              {selectedUsage === 1 ? "" : "s"})
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-gray-300" />
              Available to assign
            </span>
            <span className="ml-auto font-medium">
              Showing {visibleUsers.length} user(s)
            </span>
          </div>

          <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-xl divide-y">
            {visibleUsers.length === 0 && (
              <p className="text-sm text-gray-500 italic text-center py-6">
                No matching users.
              </p>
            )}

            {visibleUsers.map((u) => {
              const hasIt = (u.scopeOfWork || []).includes(selectedScope);

              return (
                <div
                  key={u._id}
                  className={`flex items-center justify-between px-3 py-2 transition-colors ${
                    hasIt
                      ? "bg-green-50 border-l-4 border-green-500"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {u.profilePicture ? (
                      <img
                        src={u.profilePicture}
                        alt=""
                        className="w-8 h-8 rounded-full object-cover border flex-shrink-0"
                      />
                    ) : (
                      <div
                        className={`w-8 h-8 rounded-full text-white flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                          hasIt ? "bg-green-600" : "bg-indigo-600"
                        }`}
                      >
                        {u.name?.charAt(0)?.toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate flex items-center gap-1.5">
                        {u.name}
                        {hasIt && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-green-700 bg-green-200 px-1.5 py-0.5 rounded-full">
                            ✓ Assigned
                          </span>
                        )}
                      </p>
                      <p className="text-[11px] text-gray-500 truncate">
                        {u.designation || "—"} •{" "}
                        {(u.scopeOfWork || []).filter(Boolean).length} total
                        assigned
                      </p>
                    </div>
                  </div>

                  {hasIt ? (
                    <span className="text-[11px] font-semibold text-green-700 bg-green-100 px-2.5 py-1 rounded-full flex-shrink-0">
                      Already has it
                    </span>
                  ) : (
                    <button
                      onClick={() =>
                        onAssign(
                          u._id,
                          selectedScope,
                          position === "" ? null : Number(position)
                        )
                      }
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition flex-shrink-0"
                    >
                      Assign
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default ScopeOfWorkManager;