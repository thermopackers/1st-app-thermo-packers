import { useEffect, useState } from "react";
import { useNavigate, NavLink, useLocation } from "react-router-dom";
import axiosInstance from "../axiosInstance";
import InternalNavbar from "../components/InternalNavbar";
import "../index.css";
import AssistantInvitationForm from "../components/AssistantInvitationForm";
import DocumentNotifications from "../components/DocumentNotifications";
import VehicleDocumentsView from "../components/VehicleDocumentsView";

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
const [showDocs, setShowDocs] = useState(false);
const [showDocNotifications, setShowDocNotifications] = useState(false);

  const [user, setUser] = useState(null);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [invitationLink, setInvitationLink] = useState(null); // kept for compatibility
  const [notifications, setNotifications] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
const [driverVehicle, setDriverVehicle] = useState(null);
const [docNotifCount, setDocNotifCount] = useState(0);

useEffect(() => {
  if (!user || user.role !== "driver") return;
  const token = localStorage.getItem("token");
  const fetchVehicle = async () => {
    try {
      const res = await axiosInstance.get("/vehicles/all", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const vehicle = res.data.find((v) => v.driverEmail === user.email);
      setDriverVehicle(vehicle);
    } catch (err) {
      console.error("❌ Failed to fetch driver vehicle", err);
    }
  };
  fetchVehicle();
}, [user]);

useEffect(() => {
  if (user?.role !== "accounts") return;
  const token = localStorage.getItem("token");

  const fetchDocNotifCount = async () => {
    try {
     const res = await axiosInstance.get(`/vehicle-documents/notifications/expiring`, {
       headers: { Authorization: `Bearer ${token}` },
     });
     setDocNotifCount(res.data.length || 0); 
    } catch (err) {
      console.error("Failed to fetch document notifications count", err);
    }
  };

  fetchDocNotifCount();
}, [user]);

  useEffect(() => {
    if (!user) return;
    const fetchNotifications = async () => {
      try {
        const res = await axiosInstance.get(
          `/notifications/${user._id}?page=${page}&limit=5`
        );
        setNotifications(res.data.notifications || []);
        setTotalPages(res.data.totalPages || 1);
      } catch (err) {
        console.error("Error fetching notifications:", err);
      }
    };
    fetchNotifications();
  }, [user, page]);

  useEffect(() => {
    // helpful for debugging navigation; retained from original
    // console.log("🚩 Navigated to:", location.pathname);
  }, [location]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    const fetchUser = async () => {
      try {
        const res = await axiosInstance.get("/users/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(res.data);
        setLoading(false);
      } catch (err) {
        console.error(
          "Failed to fetch user",
          err?.response ? err.response.data : err.message
        );
        localStorage.removeItem("token");
        navigate("/login");
      }
    };
    fetchUser();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="flex flex-col items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-slate-200 animate-pulse" />
          <div className="w-12 h-12 border-4 border-slate-300 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-700 font-medium">Initializing Dashboard...</p>
        </div>
      </div>
    );
  }

  const unreadCount = notifications.filter((n) => !n.read).length;
  const followUps = notifications.filter((n) =>
    n.message?.toLowerCase()?.includes("follow-up")
  );

  return (
    <>
      <InternalNavbar />

      {/* top banner for attendance quick entry (unchanged logic) */}
      {user.allowAttendance && (
        <div className="bg-white/80 backdrop-blur shadow-sm p-4 md:p-5">
          <div className="mx-auto max-w-6xl">
            <div className="rounded-xl border border-slate-200 bg-white p-4 md:p-6">
              <h2 className="text-lg md:text-xl font-semibold text-slate-800 text-center">
                📋 Mark Attendance
              </h2>
              <div className="mt-3 flex justify-center">
                <button
                  onClick={() => navigate("/attendance")}
                  className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-5 py-2.5 text-white shadow hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                >
                  Go to Attendance Page
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="flex justify-end mx-auto max-w-6xl mt-4 px-4">
  {user.role === "accounts" && (
    <button
      onClick={() => setShowDocNotifications((prev) => !prev)}
      className="relative flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow hover:bg-slate-100 border"
    >
      <span className="text-xl">🔔</span>
      <span className="hidden sm:inline text-sm font-medium">Documents</span>

      {/* Badge */}
      {docNotifCount > 0 && (
  <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow">
    {docNotifCount}
  </span>
)}
    </button>
  )}
</div>
{showDocNotifications && (
  <div className="mx-auto max-w-6xl px-4 mt-3 transition-all duration-300">
    <div className="rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden">
      <DocumentNotifications setDocNotifCount={setDocNotifCount} />
    </div>
  </div>
)}
      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
        <div className="mx-auto max-w-6xl px-3 sm:px-4 md:px-6 pt-4 md:pt-8 pb-12">
          {/* Back button on md+ only */}
          <div className="mb-4 hidden md:block">
            <button
              className="inline-flex items-center gap-2 rounded-lg bg-slate-800 px-3 py-2 text-sm text-white shadow hover:bg-slate-900"
              onClick={() => navigate(-1)}
            >
              <span aria-hidden>↩️</span> Back
            </button>
          </div>

          {/* Profile header */}
          {user.role !== "driver" ? (
            <header className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row items-center sm:items-center gap-4">
                <div className="flex flex-col items-center">
                  {user.profilePicture ? (
                    <img
                      src={user.profilePicture}
                      alt="Profile"
                      className="h-45 w-45 sm:h-45 sm:w-45 rounded-full object-cover border-2 border-indigo-200 shadow"
                    />
                  ) : (
                    <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-indigo-50 flex items-center justify-center border-2 border-indigo-200 shadow">
                      <span className="text-3xl font-bold text-indigo-600">
                        {user.name?.charAt(0)?.toUpperCase()}
                      </span>
                    </div>
                  )}
                  <p className="mt-2 text-xs text-slate-500 text-center leading-tight">
                    Download and set a Profile Picture for WhatsApp, Gmail, etc.
                  </p>
                </div>

                <div className="text-center sm:text-left">
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                    Welcome 👋,{" "}
                    <span className="font-extrabold">{user.name}</span>{" "}
                    {!(user.role === "suppliers" || user.role === "viewer") && (
                      <span className="ml-1 align-middle text-sm text-slate-600">
                        ({user.role})
                      </span>
                    )}
                  </h1>
                  <p className="mt-1 text-sm text-slate-600 break-all">
                    {user.email}
                  </p>
                </div>
              </div>

              {/* Follow-up banner */}
              {followUps.length > 0 && (
                <div className="mt-6 rounded-xl border-l-4 border-amber-400 bg-amber-50 p-4">
                  <h3 className="text-sm font-semibold text-amber-900">
                    🔔 Follow-Up Reminders
                  </h3>
                  <ul className="mt-2 space-y-1">
                    {followUps.map((note, idx) => (
                      <li key={idx} className="text-sm text-slate-800">
                        • {note.message}{" "}
                        {note.link && (
                          <NavLink
                            to={note.link}
                            className="text-indigo-600 underline-offset-2 hover:underline ml-1"
                          >
                            View
                          </NavLink>
                        )}
                      </li>
                    ))}
                  </ul>
                  {totalPages > 1 && (
                    <div className="mt-3 flex items-center justify-end gap-2 text-sm">
                      <button
                        onClick={() => setPage((p) => Math.max(p - 1, 1))}
                        disabled={page === 1}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 disabled:opacity-50"
                      >
                        Prev
                      </button>
                      <span className="px-2">
                        Page {page} of {totalPages}
                      </span>
                      <button
                        onClick={() =>
                          setPage((p) => Math.min(p + 1, totalPages))
                        }
                        disabled={page === totalPages}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 disabled:opacity-50"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </div>
              )}
                {notifications.length > 0 && (
  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg mb-6">
    <h3 className="text-md font-bold text-yellow-800 mb-2">🔔 Follow-Up Reminders</h3>
    <ul className="space-y-1">
      {notifications
.filter((n) => n.message?.toLowerCase()?.includes("follow-up"))
        .map((note, idx) => (
          <li key={idx} className="text-sm text-gray-800">
            • {note.message}{" "}
            {note.link && (
              <NavLink
                to={note.link}
                className="text-indigo-600 hover:underline ml-1"
              >
                View
              </NavLink>
            )}
          </li>
        ))}
    </ul>
    {totalPages > 1 && (
  <div className="flex justify-end gap-2 mt-2">
    <button
      onClick={() => setPage((p) => Math.max(p - 1, 1))}
      disabled={page === 1}
      className="px-2 py-1 bg-gray-200 rounded-lg disabled:opacity-50"
    >
      Prev
    </button>
    <span className="px-3 py-1 text-sm text-gray-700">
      Page {page} of {totalPages}
    </span>
    <button
      onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
      disabled={page === totalPages}
      className="px-2 py-1 bg-gray-200 rounded-lg disabled:opacity-50"
    >
      Next
    </button>
  </div>
)}

  </div>
)}
            </header>
          ) : (
            // Driver header
            <header className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="flex flex-col items-center">
                  {user.profilePicture ? (
                    <img
                      src={user.profilePicture}
                      alt="Profile"
                      className="h-45 w-45 sm:h-45 sm:w-45 rounded-full object-cover border-2 border-indigo-200 shadow"
                    />
                  ) : (
                    <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-indigo-50 flex items-center justify-center border-2 border-indigo-200 shadow">
                      <span className="text-3xl font-bold text-indigo-600">
                        {user.name?.charAt(0)?.toUpperCase()}
                      </span>
                    </div>
                  )}
                  <p className="mt-2 text-xs text-slate-500 text-center leading-tight">
                    Download and set a Profile Picture for WhatsApp, Gmail, etc.
                  </p>
                </div>
                <div className="text-center sm:text-left">
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                    Welcome 👋 to your Dashboard!
                  </h1>
                  <p className="mt-1 text-sm text-slate-600 break-all">
                    {user.name} • {user.email}
                  </p>
                </div>
              </div>
            </header>
          )}

          {/* Driver quick section */}
          {user.role === "driver" && (
            <section className="mt-6">
              <div className="rounded-2xl border border-teal-200 bg-teal-50 p-5">
                <h3 className="text-lg font-bold text-teal-900">
                  My Dispatch Plans
                </h3>
                <p className="mt-1 text-sm text-teal-800">
                  View your assigned daily dispatch plans.
                </p>
                <NavLink to="/my-plans">
                  <button className="mt-4 inline-flex items-center rounded-lg bg-teal-600 px-4 py-2.5 text-white shadow hover:bg-teal-700">
                    Go to My Plans
                  </button>
                </NavLink>
              </div>
            </section>
            
          )}
{user.role === "driver" && driverVehicle && (
  <section className="mt-6">
    <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-5">
      <h3 className="text-lg font-bold text-indigo-900">📄 My Vehicle Documents</h3>
      <p className="mt-1 text-sm text-indigo-800">
        View insurance, tax, pollution, and permit renewals for your vehicle.
      </p>

      {/* Toggle Button */}
      <button
        onClick={() => setShowDocs(prev => !prev)}
        className="mt-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 rounded-lg shadow"
      >
        {showDocs ? "Hide Documents" : "View Documents"}
      </button>

      {/* Conditionally render documents */}
      {showDocs && (
        <div className="mt-4">
          <VehicleDocumentsView vehicleNumber={driverVehicle.vehicleNumber} />
        </div>
      )}
    </div>
  </section>
)}


          {/* SALES ORDERS */}
          {(["sales", "admin", "accounts"].includes(user.role) ||
            (user.role === "production" &&
              user.productionSection?.some((s) =>
                ["blockMoulding", "cnc"].includes(s)
              ))) && (
            <section className="mt-8">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-xl font-bold text-slate-900 text-center">
                  SALES ORDERS
                </h3>
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <NavLink to="/add-order">
                    <button className="w-full rounded-xl bg-emerald-600 px-4 py-5 text-white shadow hover:bg-emerald-700">
                      ➕ Add New Sales Order
                      <div className="mt-1 text-xs font-normal opacity-90">
                        (Check if customer exists before adding)
                      </div>
                    </button>
                  </NavLink>
                  <NavLink to="/orders">
                    <button className="w-full rounded-xl bg-indigo-600 px-4 py-5 text-white shadow hover:bg-indigo-700">
                      📂 View / Edit Sales Orders
                      <div className="mt-1 text-xs font-normal opacity-90">
                        (Manage old/existing orders)
                      </div>
                    </button>
                  </NavLink>
                </div>
              </div>
            </section>
          )}

          {/* Production / Packaging / Dispatch hub */}
          {["production", "packaging", "dispatch", "accounts"].includes(
            user.role
          ) && (
            <section className="mt-8">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-xl font-bold text-slate-900 text-center">
                  Go To All Type of Production / Dispatch Sections
                </h3>
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(user.role === "accounts" ||
                    user.role === "production") && (
                    <>
                      {(user.role === "accounts" ||
                        user.productionSection?.includes("blockMoulding")) && (
                        <NavLink
                          to="/production-dashboard?type=dana"
                          className="h-full"
                        >
                          <button className="w-full min-h-[84px] rounded-xl bg-indigo-600 px-4 py-5 text-white shadow hover:bg-indigo-700">
                            EPS/Thermocol Block Molding Production Section
                          </button>
                        </NavLink>
                      )}
                      
 {user.role === "accounts" && (
                    <NavLink to="/dana-beads-dashboard" className="h-full">
                      <button className="w-full min-h-[84px] rounded-xl bg-pink-600 px-4 py-5 text-white shadow hover:bg-pink-700">
                        EPS/Thermocol Dana / Beads Production Section
                      </button>
                    </NavLink>
                  )}

                      {(user.role === "accounts" ||
                        user.productionSection?.includes("shapeMoulding")) && (
                        <NavLink
                          to="/production-dashboard?type=shape"
                          className="h-full"
                        >
                          <button className="w-full min-h-[84px] rounded-xl bg-purple-600 px-4 py-5 text-white shadow hover:bg-purple-700">
                            EPS/Thermocol Shape Molding Production Section
                          </button>
                        </NavLink>
                      )}
                    </>
                  )}

                 

                  {(user.role === "dispatch" || user.role === "accounts") && (
                    <NavLink to="/dispatch-dashboard" className="h-full">
                      <button className="w-full min-h-[84px] rounded-xl bg-blue-600 px-4 py-5 text-white shadow hover:bg-blue-700">
                        EPS/Thermocol Sheet Cutting & Dispatch Section
                      </button>
                    </NavLink>
                  )}

                  {(user.role === "packaging" || user.role === "accounts") && (
                    <NavLink to="/packaging-dashboard" className="h-full">
                      <button className="w-full min-h-[84px] rounded-xl bg-green-600 px-4 py-5 text-white shadow hover:bg-green-700">
                        EPS/Thermocol Shape Moulding Packaging & Dispatch
                        Section
                      </button>
                    </NavLink>
                  )}

                  {(user.role === "accounts" ||
                    (user.role === "production" &&
                      user.productionSection?.includes("cnc"))) && (
                    <NavLink to="/cnc-dashboard" className="h-full">
                      <button className="w-full min-h-[84px] rounded-xl bg-yellow-600 px-4 py-5 text-white shadow hover:bg-yellow-700">
                        EPS/Thermocol CNC Hot Wire / CNC Router Section
                      </button>
                    </NavLink>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* Admin Tools */}
          {user.role === "admin" && (
            <section className="mt-8">
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
                <h3 className="text-lg font-bold text-amber-900">Admin Tools</h3>
                <p className="mt-1 text-sm text-amber-900/80">
                  You have access to manage users and view all orders.
                </p>
                <NavLink to="/admin-dashboard">
                  <button className="mt-4 inline-flex items-center rounded-lg bg-amber-600 px-4 py-2.5 text-white shadow hover:bg-amber-700">
                    Go to Admin Panel
                  </button>
                </NavLink>
              </div>
            </section>
          )}

          {/* Tasks + Assets + Dispatch/Mileage + Material Requisition */}
          <section className="mt-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Tasks */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-xl font-bold text-slate-900 text-center">
                  TASKS / TO DO / WORK GIVEN INFORMATION
                </h3>
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="relative">
                    <NavLink to="/my-tasks">
                      <button className="w-full rounded-xl bg-indigo-600 px-4 py-5 text-white shadow hover:bg-indigo-700">
                        My Tasks / Assigned Work
                        <div className="mt-1 text-xs font-normal opacity-90">
                          View and complete assigned personal tasks
                        </div>
                      </button>
                    </NavLink>
                    {unreadCount > 0 && (
                      <span className="absolute -right-2 -top-2 rounded-full bg-rose-600 px-2 py-0.5 text-xs font-bold text-white shadow">
                        {unreadCount}
                      </span>
                    )}
                  </div>

                  {["accounts"].includes(user.role) && (
                    <NavLink to="/task-dashboard">
                      <button className="w-full rounded-xl bg-rose-600 px-4 py-5 text-white shadow hover:bg-rose-700">
                        Task Dashboard
                        <div className="mt-1 text-xs font-normal opacity-90">
                          Assign / View / Edit / Delete Task
                        </div>
                      </button>
                    </NavLink>
                  )}
                </div>
              </div>

              {/* Assets */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-2xl font-bold text-slate-900 text-center">
                  Assets of Thermo Packers
                </h3>
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <NavLink to="/my-assets">
                    <button className="w-full rounded-xl bg-indigo-600 px-4 py-5 text-white shadow hover:bg-indigo-700">
                      My Assets
                      <div className="mt-1 text-sm font-normal opacity-90">
                        View assets assigned to you
                      </div>
                    </button>
                  </NavLink>

                  {["accounts"].includes(user.role) && (
                    <>
                      <NavLink to="/issue-asset">
                        <button className="w-full rounded-xl bg-emerald-600 px-4 py-5 text-white shadow hover:bg-emerald-700">
                          Issue Assets to Employees
                          <div className="mt-1 text-sm font-normal opacity-90">
                            Click to issue assets
                          </div>
                        </button>
                      </NavLink>
                      <NavLink to="/asset-management">
                        <button className="w-full rounded-xl bg-yellow-600 px-4 py-5 text-white shadow hover:bg-yellow-700">
                          Manage Assets
                          <div className="mt-1 text-sm font-normal opacity-90">
                            Click to manage all assets
                          </div>
                        </button>
                      </NavLink>
                    </>
                  )}
                </div>
              </div>

              {/* Dispatch & Mileage */}
              {["packaging", "admin", "accounts", "driver"].includes(
                user.role
              ) && (
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h3 className="text-2xl font-bold text-slate-900 text-center">
                    Vehicles Management
                  </h3>
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <NavLink to="/assign-dispatch">
                      <button className="w-full rounded-xl bg-sky-600 px-4 py-5 text-white shadow hover:bg-sky-700">
                        Assign Dispatch Plan
                        <div className="mt-1 text-sm font-normal opacity-90">
                          Plan and assign tasks to drivers/vehicles
                        </div>
                      </button>
                    </NavLink>

                    {["admin", "accounts"].includes(user.role) && (
                      <NavLink to="/mileage-chart">
                        <button className="w-full rounded-xl bg-indigo-600 px-4 py-5 text-white shadow hover:bg-indigo-700">
                          Vehicle Mileage Report
                          <div className="mt-1 text-sm font-normal opacity-90">
                            View KM/L for each vehicle
                          </div>
                        </button>
                      </NavLink>
                    )}
                    {["admin", "accounts"].includes(user.role) && (
                      <NavLink to="/registered-vehicles">
                        <button className="w-full rounded-xl bg-green-600 px-4 py-5 text-white shadow hover:bg-green-700">
                          Vehicles Maintenance Log Book & Documents
                          <div className="mt-1 text-sm font-normal opacity-90">
                            Reistered Vehicles Documents, RC, Vehicle Pictures and Due Date for Insurance, Registration Tax, Pollution, Fitness, All India Permit, Pollution etc.
                          </div>
                        </button>
                      </NavLink>
                    )}
                  </div>
                </div>
              )}

              {/* Material Requisition */}
              {["admin", "sales", "accounts", "dispatch", "packaging", "production"].includes(
                user.role
              ) && (
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h3 className="text-2xl font-bold text-slate-900 text-center">
                    Material Requisition
                  </h3>
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <NavLink to="/material-requisition">
                      <button className="w-full rounded-xl bg-rose-600 px-4 py-5 text-white shadow hover:bg-rose-700">
                        Material Requisition Form
                        <div className="mt-1 text-sm font-normal opacity-90">
                          Submit a new requisition for raw materials
                        </div>
                      </button>
                    </NavLink>
                    <NavLink to="/requisition-slips">
                      <button className="w-full rounded-xl bg-amber-600 px-4 py-5 text-white shadow hover:bg-amber-700">
                        View Requisition Slips
                        <div className="mt-1 text-sm font-normal opacity-90">
                          View/download all requisition PDFs
                        </div>
                      </button>
                    </NavLink>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* QUOTATION / PROFORMA + Sales/Customers */}
          <section className="mt-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Quotation / Proforma */}
              {!["driver", "dispatch", "packaging"].includes(
                user.role
              ) && (
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h3 className="text-2xl font-bold text-slate-900 text-center">
                    QUOTATION / PROFORMA INVOICE / ESTIMATE
                  </h3>
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <NavLink to="/proforma-invoice">
                      <button className="w-full rounded-xl bg-emerald-600 px-4 py-5 text-white shadow hover:bg-emerald-700">
                        Make New Quotation / Proforma / Estimate
                      </button>
                    </NavLink>
                    <NavLink to="/proforma-dashboard">
                      <button className="w-full rounded-xl bg-slate-600 px-4 py-5 text-white shadow hover:bg-slate-700">
                        View Old Quotation / Proforma / Estimate
                      </button>
                    </NavLink>
                  </div>

                  {["accounts"].includes(user.role) && (
                    <>
                      <h4 className="mt-6 text-xl font-bold text-slate-900 text-center">
                        Purchase Product / Suppliers
                      </h4>
                      <div className="mt-3 flex justify-center">
                        <button
                          onClick={() =>
                            navigate("/purchase-products-suppliers")
                          }
                          className="rounded-xl bg-blue-600 px-6 py-3 text-white shadow hover:bg-blue-700"
                        >
                          Purchase Product / Suppliers
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Sales Products + Customers */}
              {["admin", "sales", "accounts"].includes(user.role) && (
                <div className="space-y-6">
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h3 className="text-xl font-bold text-slate-900 text-center">
                      SALES - PRODUCTS Information
                    </h3>
                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <NavLink to="/add-product">
                        <button className="w-full rounded-xl bg-lime-600 px-4 py-5 text-white shadow hover:bg-lime-700">
                          Add new PRODUCT
                        </button>
                      </NavLink>
                      <NavLink to="/all-products">
                        <button className="w-full rounded-xl bg-yellow-600 px-4 py-5 text-white shadow hover:bg-yellow-700">
                          View / Edit / Delete PRODUCT
                        </button>
                      </NavLink>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h3 className="text-xl font-bold text-slate-900 text-center">
                      CUSTOMERS - Information
                    </h3>
                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <NavLink to="/add-customer">
                        <button className="w-full rounded-xl bg-cyan-600 px-4 py-5 text-white shadow hover:bg-cyan-700">
                          Add New CUSTOMER
                        </button>
                      </NavLink>
                      <NavLink to="/customers">
                        <button className="w-full rounded-xl bg-violet-600 px-4 py-5 text-white shadow hover:bg-violet-700">
                          View / Edit / Delete CUSTOMER
                        </button>
                      </NavLink>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Admin register + Attendance Logs */}
          <section className="mt-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {["admin", "accounts"].includes(user.role) && (
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h3 className="text-2xl font-bold text-slate-900 text-center">
                    Admin Tools
                  </h3>
                  <NavLink to="/register-user">
                    <button className="mt-4 w-full rounded-xl bg-blue-600 px-4 py-4 text-white shadow hover:bg-blue-700">
                      Register New User
                      <div className="mt-1 text-sm font-normal opacity-90">
                        Add new user by email and assign role
                      </div>
                    </button>
                  </NavLink>
                </div>
              )}

              {user.allowAttendance && (
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h3 className="text-2xl font-bold text-slate-900 text-center">
                    Attendance Logs
                  </h3>
                  <NavLink to="/attendance-logs">
                    <button className="mt-4 w-full rounded-xl bg-emerald-600 px-4 py-4 text-white shadow hover:bg-emerald-700">
                      Attendance Logs
                      <div className="mt-1 text-sm font-normal opacity-90">
                        View daily check-ins and attendance
                      </div>
                    </button>
                  </NavLink>
                </div>
              )}
            </div>
          </section>

          {/* Supplier / Viewer block */}
          {(user.role === "suppliers" ||
            user.role === "accounts" ||
            user.role === "viewer") && (
            <section className="mt-8">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-2xl font-bold text-slate-900 text-center">
                  Pattern Orders & Status
                </h3>

                {user.role === "suppliers" && (
                  <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-5">
                    <div className="flex flex-col items-center gap-3">
                      <button
                        onClick={() => setShowInviteForm(!showInviteForm)}
                        className="rounded-lg bg-emerald-600 px-4 py-2.5 text-white shadow hover:bg-emerald-700"
                      >
                        {showInviteForm ? "Cancel" : "Invite Assistant"}
                      </button>

                      {showInviteForm && (
                        <div className="w-full">
                          <AssistantInvitationForm
                            supplierId={user._id}
                            onInviteSent={(link) => setInvitationLink(link)}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {(user.role === "suppliers" ||
                    user.role === "viewer") && (
                    <button
                      onClick={() => navigate("/drawing-upload-form")}
                      className="w-full rounded-xl bg-orange-600 px-4 py-5 text-white shadow hover:bg-orange-700"
                    >
                      📝 Submit New Drawing for making EPS/Thermocol Pattern
                    </button>
                  )}

                  <button
                    onClick={() => navigate("/drawing-orders-table")}
                    className="w-full rounded-xl bg-teal-600 px-4 py-5 text-white shadow hover:bg-teal-700"
                  >
                    📊 View Old Patterns Orders Quotation & Price Finalization
                    Real Time Status of Orders
                  </button>
                </div>
              </div>
            </section>
          )}
        </div>
      </main>
    </>
  );
}
