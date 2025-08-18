import { useEffect, useRef, useState } from "react";
import { useNavigate, NavLink, useLocation } from "react-router-dom";
import axiosInstance from "../axiosInstance";
import InternalNavbar from "../components/InternalNavbar";
import '../index.css';
import AssistantInvitationForm from "../components/AssistantInvitationForm";



export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [invitationLink, setInvitationLink] = useState(null);
const [notifications, setNotifications] = useState([]);
const [page, setPage] = useState(1);
const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
console.log("user",user);

useEffect(() => {
  if (!user) return;
  const fetchNotifications = async () => {
    try {
      const res = await axiosInstance.get(`/notifications/${user._id}?page=${page}&limit=5`);
      setNotifications(res.data.notifications); // assuming backend sends { notifications, totalPages }
      setTotalPages(res.data.totalPages);
    } catch (err) {
      console.error("Error fetching notifications:", err);
    }
  };
  fetchNotifications();
}, [user, page]);

  useEffect(() => {
    console.log("🚩 Navigated to:", location.pathname);
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
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setUser(res.data);


setLoading(false);

      } catch (err) {
        console.error(
          "Failed to fetch user",
          err.response ? err.response.data : err.message
        );
        localStorage.removeItem("token");
        navigate("/login");
      }
    };

    fetchUser();
  }, [navigate]);

if (loading) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
<div className="flex flex-col items-center">
  <div className="h-16 w-16 rounded-full bg-gray-200 mb-4 animate-pulse"></div>
  <div className="w-12 h-12 border-4 border-blue-500 border-dashed rounded-lg-full animate-spin mx-auto mb-4"></div>
</div>
        <p className="text-lg font-medium text-blue-700">Initializing Dashboard...</p>
      </div>
    </div>
  );
}


  return (
    <>
      <InternalNavbar />
    {user.allowAttendance && (
  <div className="bg-white shadow-lg p-4 rounded-xl">
    <h2 className="text-xl font-semibold text-center text-gray-800 mb-4">
      📋 Mark Attendance
    </h2>
    <div className="flex justify-center">
      <button
        onClick={() => navigate("/attendance")}
        className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-full text-sm font-medium shadow transition duration-200"
      >
        Go to Attendance Page
      </button>
    </div>
  </div>
)}

      <div className="min-h-screen bg-gray-100 flex flex-col">
        <main className="flex-1 p-6 bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100">
          <button
            className="absolute hidden md:block left-4 cursor-pointer bg-blue-500 text-white px-4 py-2 rounded-lg shadow-md hover:bg-blue-600 back-button"
            onClick={() => navigate(-1)}
          >
            ↩️ Back
          </button>

          <div className="bg-white md:mt-[8vh] shadow-md rounded-lg p-6">
                          {user.role !== "driver" && (

           <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 mb-4">
  <div className="flex flex-col items-center w-50 sm:w-30">
    {user.profilePicture ? (
      <img 
        src={user.profilePicture} 
        alt="Profile" 
        className="h-35 w-35 sm:h-30 sm:w-30 rounded-full object-cover border-2 border-blue-300 shadow-sm"
      />
    ) : (
      <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-blue-100 flex items-center justify-center border-2 border-blue-300 shadow-sm">
        <span className="text-2xl sm:text-3xl font-bold text-blue-600">
          {user.name.charAt(0).toUpperCase()}
        </span>
      </div>
    )}
    <p className="text-[10px] xs:text-xs text-gray-500 mt-1 text-center leading-tight">
          Download and set Profile Picture for Whatsapp, Gmail or any other Profile Picture
    </p>
  </div>
  <div className="text-center sm:text-left">
    <h2 className="text-lg sm:text-xl font-semibold">
      Welcome 👋, <span className="font-bold sm:font-extrabold text-xl sm:text-2xl">{user.name}</span>
      {(user.role !== "suppliers" && user.role !== "viewer") && (
        <span className="capitalize block sm:inline text-sm sm:text-base text-gray-600 sm:ml-2">
          ({user.role})
        </span>
      )}
    </h2>
    <p className="text-xs sm:text-sm text-gray-600">{user.email}</p>
  </div>
</div>
)}





{(user.role !== "suppliers" && user.role !== "viewer") && (
  <>


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

                          {user.role === "driver" && (

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 mb-4">
  <div className="flex flex-col items-center w-20 sm:w-24">
    {user.profilePicture ? (
      <img 
        src={user.profilePicture} 
        alt="Profile" 
        className="h-16 w-16 sm:h-20 sm:w-20 rounded-full object-cover border-2 border-blue-300 shadow-sm"
      />
    ) : (
      <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-blue-100 flex items-center justify-center border-2 border-blue-300 shadow-sm">
        <span className="text-2xl sm:text-3xl font-bold text-blue-600">
          {user.name.charAt(0).toUpperCase()}
        </span>
      </div>
    )}
    <p className="text-[10px] xs:text-xs text-gray-500 mt-1 text-center leading-tight">
          Download and set Profile Picture for Whatsapp, Gmail or any other Profile Picture
    </p>
  </div>
  <div className="text-center sm:text-left">
    <h2 className="text-lg sm:text-xl font-semibold">
      Welcome 👋 to your Dashboard!
    </h2>
    <p className="text-xs sm:text-sm text-gray-600">{user.name} • {user.email}</p>
  </div>
</div>
)}

<div className="flex flex-col gap-6 mt-6">
              {user.role === "driver" && (<>
  <div className="bg-teal-100 p-4 rounded-lg">
    <h3 className="text-lg font-bold text-teal-800">My Dispatch Plans</h3>
    <p className="text-sm text-teal-700 mt-2">
      View your assigned daily dispatch plans.
    </p>
    <NavLink to="/my-plans">
      <button className="mt-4 cursor-pointer bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg">
        Go to My Plans
      </button>
    </NavLink>
  </div>
  </>
)}

 
{(["sales", "admin", "accounts"].includes(user.role) || 
  (user.role === "production" && user.productionSection?.some(section => ["blockMoulding", "cnc"].includes(section)))) && (
  <div className="mt-10 bg-gradient-to-br from-slate-50 via-white to-slate-100 rounded-2xl p-6 shadow-xl border border-gray-200">
    <>
      <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">
        SALES ORDERS
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Add New Sales Order */}
        <NavLink to="/add-order">
          <button className="w-full cursor-pointer bg-green-600 hover:bg-green-700 text-white py-6 px-4 rounded-lg shadow text-sm sm:text-base text-center">
            ➕ Add New Sales Order
            <br />
            <span className="text-xs font-normal">
              (Check if customer exists before adding)
            </span>
          </button>
        </NavLink>

        {/* View Old/Existing Orders */}
        <NavLink to="/orders">
          <button className="w-full cursor-pointer bg-blue-600 hover:bg-blue-700 text-white py-6 px-4 rounded-lg shadow text-sm sm:text-base text-center">
            📂 View / Edit Sales Orders
            <br />
            <span className="text-xs font-normal">
              (Manage old/existing orders)
            </span>
          </button>
        </NavLink>
      </div>
    </>
  </div>
)}


      

            </div>

       {["production", "packaging", "dispatch", "accounts"].includes(user.role) && (
            <div className="mt-10 bg-gradient-to-br from-slate-50 via-white to-slate-100 rounded-2xl p-6 shadow-xl border border-gray-200">
<>
  <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">
    Go To All Type of Production / Dispatch Sections
  </h3>

  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
    {(user.role === "accounts" || user.role === "production") && (
      <>
        {/* Block Moulding Button Section */}
        {(user.role === "accounts" || user.productionSection?.includes("blockMoulding")) && (
          <NavLink to="/production-dashboard?type=dana" className="h-full">
            <div className="h-full">
              <button className="w-full h-full min-h-[80px] bg-indigo-600 hover:bg-indigo-700 text-white py-6 px-4 rounded-lg shadow text-sm sm:text-base text-center">
                EPS/Thermocol Block Molding/Dana/Beads Production Section
              </button>
            </div>
          </NavLink>
        )}

        {/* Shape Moulding Button Section */}
        {(user.role === "accounts" || user.productionSection?.includes("shapeMoulding")) && (
          <NavLink to="/production-dashboard?type=shape" className="h-full">
            <div className="h-full">
              <button className="w-full h-full min-h-[80px] bg-purple-600 hover:bg-purple-700 text-white py-6 px-4 rounded-lg shadow text-sm sm:text-base text-center">
                EPS/Thermocol Shape Molding Production Section
              </button>
            </div>
          </NavLink>
        )}
      </>
    )}

    {(user.role === "dispatch" || user.role === "accounts") && (
      <NavLink to="/dispatch-dashboard" className="h-full">
        <div className="h-full">
          <button className="w-full h-full min-h-[80px] bg-blue-600 hover:bg-blue-700 text-white py-6 px-4 rounded-lg shadow text-sm sm:text-base text-center">
            EPS/Thermocol Sheet Cutting & Dispatch Section
          </button>
        </div>
      </NavLink>
    )}

    {(user.role === "packaging" || user.role === "accounts") && (
      <NavLink to="/packaging-dashboard" className="h-full">
        <div className="h-full">
          <button className="w-full h-full min-h-[80px] bg-green-600 hover:bg-green-700 text-white py-6 px-4 rounded-lg shadow text-sm sm:text-base text-center">
            EPS/Thermocol Shape Moulding Packaging & Dispatch Section
          </button>
        </div>
      </NavLink>
    )}

    {(user.role === "accounts" || (user.role === "production" && user.productionSection?.includes("cnc"))) && (
      <NavLink to="/cnc-dashboard" className="h-full">
        <div className="h-full">
          <button className="w-full h-full min-h-[80px] bg-yellow-600 hover:bg-yellow-700 text-white py-6 px-4 rounded-lg shadow text-sm sm:text-base text-center">
            EPS/Thermocol CNC Hot Wire / CNC Router Section
          </button>
        </div>
      </NavLink>
    )}
  </div>
</>

</div>
)}


            {user.role === "admin" && (
           <div className="mt-10 bg-gradient-to-br from-slate-50 via-white to-slate-100 rounded-2xl p-6 shadow-xl border border-gray-200">
 
              <>
                <h3 className="text-lg font-bold text-yellow-800">Admin Tools</h3>
                <p className="text-sm text-yellow-700 mt-2">
                  You have access to manage users and view all orders.
                </p>
                <NavLink to="/admin-dashboard">
                  <button className="mt-4 cursor-pointer bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg">
                    Go to Admin Panel
                  </button>
                </NavLink>
              </>
</div>
            )}

<div className="mt-10 bg-gradient-to-br from-slate-50 via-white to-slate-100 rounded-2xl p-6 shadow-xl border border-gray-200">

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
<div className="w-full px-4 sm:px-6 lg:px-8 py-4">
  {/* Task Dashboard — only for admin and accounts */}
  <div className="bg-white p-4 rounded-xl shadow-md">
    <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">
      TASKS / TO DO / WORK GIVEN INFORMATION
    </h3>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* View My Assigned Tasks */}
      <div className="relative w-full">
        <NavLink to="/my-tasks">
          <button className="w-full bg-indigo-500 hover:bg-indigo-600 text-white py-6 px-4 rounded-lg shadow text-sm sm:text-base text-center">
            My Tasks / Assigned Work
            <br />
            <span className="text-xs font-normal">
              View and complete assigned personal tasks
            </span>
          </button>
        </NavLink>

        {/* 🔔 Notification badge */}
        {notifications.filter((n) => !n.read).length > 0 && (
          <span className="absolute top-2 right-2 bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow z-10">
            {notifications.filter((n) => !n.read).length}
          </span>
        )}
      </div>

      {/* Assign / View Task Dashboard — visible to accounts */}
      {["accounts"].includes(user.role) && (
        <div className="w-full">
          <NavLink to="/task-dashboard">
            <button className="w-full bg-red-500 hover:bg-red-600 text-white py-6 px-4 rounded-lg shadow text-sm sm:text-base text-center">
              Task Dashboard
              <br />
              <span className="text-xs font-normal">
                Assign tasks / View / Edit / Delete Task given
              </span>
            </button>
          </NavLink>
        </div>
      )}
    </div>
  </div>
</div>


<div className="bg-white p-6 rounded-2xl shadow-lg">
  <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">
    Assets of Thermo Packers
  </h3>

  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {/* My Assets */}
    <div className="w-full">
      <NavLink to="/my-assets">
        <button className="w-full h-full bg-indigo-500 hover:bg-indigo-600 text-white py-6 px-4 rounded-xl shadow-md text-base text-center transition duration-200">
          My Assets
          <br />
          <span className="text-sm font-normal">
            View assets assigned to you
          </span>
        </button>
      </NavLink>
    </div>
{["accounts"].includes(user.role) && (
  <>
    {/* Issue Assets */}
    <div className="w-full">
      <NavLink to="/issue-asset">
        <button className="w-full h-full bg-emerald-500 hover:bg-emerald-600 text-white py-6 px-4 rounded-xl shadow-md text-base text-center transition duration-200">
          Issue Assets to Employees
          <br />
          <span className="text-sm font-normal">
            Click to issue assets to employees
          </span>
        </button>
      </NavLink>
    </div>

    {/* Manage Assets */}
    <div className="w-full">
      <NavLink to="/asset-management">
        <button className="w-full h-full bg-yellow-500 hover:bg-yellow-600 text-white py-6 px-4 rounded-xl shadow-md text-base text-center transition duration-200">
          Manage Assets
          <br />
          <span className="text-sm font-normal">
            Click to manage all assets
          </span>
        </button>
      </NavLink>
    </div>
    </>
)}
  </div>
</div>

    {["packaging", "admin", "accounts","driver"].includes(user.role) && (

<div className="bg-white p-6 rounded-2xl shadow-lg mt-6">
  <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">
    Dispatch and Mileage Dashboard
  </h3>

  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    {["packaging", "admin", "accounts","driver"].includes(user.role) && (
      <div className="w-full">
        <NavLink to="/assign-dispatch">
          <button className="w-full h-full bg-sky-500 hover:bg-sky-600 text-white py-6 px-4 rounded-xl shadow-md text-base text-center transition duration-200">
            Assign Dispatch Plan
            <br />
            <span className="text-sm font-normal">
              Plan and assign tasks to drivers/vehicles
            </span>
          </button>
        </NavLink>
      </div>
    )}

    {["admin", "accounts"].includes(user.role) && (
      <div className="w-full">
        <NavLink to="/mileage-chart">
          <button className="w-full h-full bg-indigo-500 hover:bg-indigo-600 text-white py-6 px-4 rounded-xl shadow-md text-base text-center transition duration-200">
            Vehicle Mileage Report
            <br />
            <span className="text-sm font-normal">
              View KM/L for each vehicle
            </span>
          </button>
        </NavLink>
      </div>
    )}
  </div>
</div>
    )}
{["admin", "sales", "accounts", "dispatch", "packaging", "production"].includes(user.role) && (
  <div className="bg-white p-6 rounded-2xl shadow-lg mt-6">
    <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">
      Material Requisition
    </h3>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Requisition Form */}
      <div className="w-full">
        <NavLink to="/material-requisition">
          <button className="w-full h-full bg-rose-500 hover:bg-rose-600 text-white py-6 px-4 rounded-xl shadow-md text-base text-center transition duration-200">
            Material Requisition Form
            <br />
            <span className="text-sm font-normal">
              Submit a new requisition for raw materials
            </span>
          </button>
        </NavLink>
      </div>

      {/* Requisition Slips */}
      <div className="w-full">
        <NavLink to="/requisition-slips">
          <button className="w-full h-full bg-amber-500 hover:bg-amber-600 text-white py-6 px-4 rounded-xl shadow-md text-base text-center transition duration-200">
            View Requisition Slips
            <br />
            <span className="text-sm font-normal">
              View/download all requisition PDFs
            </span>
          </button>
        </NavLink>
      </div>
    </div>
  </div>
)}


</div>
</div>
<div className="mt-10 bg-gradient-to-br from-slate-50 via-white to-slate-100 rounded-2xl p-6 shadow-xl border border-gray-200">

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

{!["driver", "production", "dispatch", "packaging"].includes(user.role) && (
<div className="bg-white mt-6 p-6 rounded-2xl shadow-lg">
  <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">
    QUOTATION / PROFORMA INVOICE / ESTIMATE
  </h3>

  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
    {/* Make New Quotation */}
    <NavLink to="/proforma-invoice">
      <button className="w-full bg-green-500 hover:bg-green-600 text-white py-6 px-4 rounded-xl shadow-md text-base font-semibold transition-all duration-200">
        Make New Quotation / Proforma Invoice / Estimate
      </button>
    </NavLink>

    {/* View Old Quotations */}
    <NavLink to="/proforma-dashboard">
      <button className="w-full bg-gray-500 hover:bg-gray-600 text-white py-6 px-4 rounded-xl shadow-md text-base font-semibold transition-all duration-200">
        View Old Quotation / Proforma Invoice / Estimate
      </button>
    </NavLink>
  </div>
  {["accounts"].includes(user.role) && (
<>
<h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">
    Purchase Product / Suppliers
  </h3>
  <div className="flex justify-center">
    <button
      onClick={() => navigate("/purchase-products-suppliers")}
      className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-xl shadow-md text-base font-semibold transition-all duration-200"
    >
      Purchase Product / Suppliers
    </button>
  </div>
  </>
  )}
</div>

)}

{["admin", "sales", "accounts"].includes(user.role) && (
  <div className="mt-6">
    {/* Product Info Section */}
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      <h3 className="text-xl font-bold text-gray-800 text-center mb-4">SALES - PRODUCTS Information</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <NavLink to="/add-product" className="w-full">
          <button className="w-full bg-lime-500 hover:bg-lime-600 text-white border border-gray-300 rounded-lg p-6 text-sm sm:text-base text-center cursor-pointer">
            Add new PRODUCT
          </button>
        </NavLink>
        <NavLink to="/all-products" className="w-full">
          <button className="w-full bg-yellow-500 hover:bg-yellow-600 text-white border border-gray-300 rounded-lg p-6 text-sm sm:text-base text-center cursor-pointer">
            View/Edit/Delete PRODUCT
          </button>
        </NavLink>
      </div>
    </div>

    {/* Customer Info Section */}
    <div className="bg-white rounded-lg shadow-md p-4">
      <h3 className="text-xl font-bold text-gray-800 text-center mb-4">CUSTOMERS - Information</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <NavLink to="/add-customer" className="w-full">
          <button className="w-full bg-cyan-500 hover:bg-cyan-600 text-white border border-gray-300 rounded-lg p-6 text-sm sm:text-base text-center cursor-pointer">
            Add New CUSTOMER
          </button>
        </NavLink>
        <NavLink to="/customers" className="w-full">
          <button className="w-full bg-violet-500 hover:bg-violet-600 text-white border border-gray-300 rounded-lg p-6 text-sm sm:text-base text-center cursor-pointer">
            View/Edit/Delete CUSTOMER
          </button>
        </NavLink>
      </div>
    </div>
  </div>
)}
</div>
</div>

<div className="mt-10 bg-gradient-to-br from-slate-50 via-white to-slate-100 rounded-2xl p-6 shadow-xl border border-gray-200">
  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">

    {/* Admin Tools */}
    {["admin", "accounts"].includes(user.role) && (
      <div className="p-6 rounded-2xl shadow-lg">
        <h3 className="text-2xl font-bold text-gray-800 mb-2 text-center">
          Admin Tools
        </h3>

        {/* Register New User */}
        <div className="w-full">
          <NavLink to="/register-user">
            <button className="w-full h-full bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-xl shadow-md text-base text-center transition duration-200">
              Register New User
              <br />
              <span className="text-sm font-normal">
                Add new user by email and assign role
              </span>
            </button>
          </NavLink>
        </div>
      </div>
    )}

    {/* Attendance Logs */}
        {user.allowAttendance && (
      <div className="p-6 rounded-2xl shadow-lg">
        <h3 className="text-2xl font-bold text-gray-800 mb-2 text-center">
          Attendance Logs
        </h3>

        <div className="w-full">
          <NavLink to="/attendance-logs">
            <button className="w-full h-full bg-green-500 hover:bg-green-600 text-white py-3 px-4 rounded-xl shadow-md text-base text-center transition duration-200">
              Attendance Logs
              <br />
              <span className="text-sm font-normal">
                View daily check-ins and attendance
              </span>
            </button>
          </NavLink>
        </div>
      </div>
        )}

  </div>
</div>



</> )}

{(user.role === "suppliers" || user.role === "accounts" || user.role === "viewer") && (
  <div className="mt-10 bg-gradient-to-br from-slate-50 via-white to-slate-100 rounded-2xl p-6 shadow-xl border border-gray-200">
    <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">
Pattern Orders & Status    
</h3>
<div className="mt-8">
  {user.role === "suppliers" && (
    <div className="flex flex-col items-center gap-4 bg-white shadow-md rounded-xl p-6 border border-gray-200">
      <button
        onClick={() => setShowInviteForm(!showInviteForm)}
        className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-6 rounded-lg shadow transition-all duration-200"
      >
        {showInviteForm ? 'Cancel' : 'Invite Assistant'}
      </button>

      {showInviteForm && (
        <div className="w-full mt-2">
          <AssistantInvitationForm 
            supplierId={user._id} 
            onInviteSent={(link) => setInvitationLink(link)}
          />
        </div>
      )}
    </div>
  )}
</div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Supplier: Upload Drawing */}
{(user.role === "suppliers" || user.role === "viewer") && (
        <button
          onClick={() => navigate('/drawing-upload-form')}
          className="w-full h-full bg-orange-500 hover:bg-orange-600 text-white py-6 px-4 rounded-xl shadow-md text-base text-center font-semibold transition"
        >
          📝 Submit New Drawing for making EPS/Thermocol Pattern
        </button>
      )}

      {/* Supplier or Accounts: View Drawing Orders */}
      <button
        onClick={() => navigate("/drawing-orders-table")}
        className="w-full h-full bg-teal-500 hover:bg-teal-600 text-white py-6 px-4 rounded-xl shadow-md text-base text-center font-semibold transition"
      >
        📊 View Old Patterns Orders Quotation & Price Finalization Real Time Status of Orders
      </button>

   
    </div>
  </div>
)}

          </div>
        </main>
      </div>
    

    </>
  );
}
