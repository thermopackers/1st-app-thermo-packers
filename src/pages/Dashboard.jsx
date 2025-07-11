import { useEffect, useState } from "react";
import { useNavigate, NavLink, useLocation } from "react-router-dom";
import axiosInstance from "../axiosInstance";
import InternalNavbar from "../components/InternalNavbar";
import '../index.css';

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
const [notifications, setNotifications] = useState([]);
const [page, setPage] = useState(1);
const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
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
          <div className="w-12 h-12 border-4 border-blue-500 border-dashed rounded-lg-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg font-medium text-blue-700">Loading Dashboard...</p>
        </div>
      </div>
    );
  }
const handleViewTasks = async () => {
   navigate('/my-tasks');

};

  return (
    <>
      <InternalNavbar />
      <div className="min-h-screen bg-gray-100 flex flex-col">
        <main className="flex-1 p-6 bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100">
          <button
            className="absolute hidden md:block left-4 cursor-pointer bg-blue-500 text-white px-4 py-2 rounded-lg-md shadow-md hover:bg-blue-600 back-button"
            onClick={() => navigate(-1)}
          >
            ↩️ Back
          </button>

          <div className="bg-white md:mt-[8vh] shadow-md rounded-lg-lg p-6">
                          {user.role !== "driver" && (

            <h2 className="text-xl font-semibold mb-4">
              Welcome 👋, <span className="font-extrabold text-2xl">{user.name}</span>{" "}
              <span className="capitalize">({user.role})</span>
            </h2>)}
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

            <h2 className="text-xl font-semibold mb-4">
              Welcome 👋 to your Dashboard!
            </h2>)}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              {user.role === "driver" && (<>
  <div className="bg-teal-100 p-4 rounded-lg-lg">
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
  <div className="bg-pink-100 p-4 rounded-lg-lg">
    <h3 className="text-lg font-bold text-pink-800">My Assets</h3>
    <p className="text-sm text-pink-700 mt-2">
      View your assigned assets.
    </p>
    <NavLink to="/my-assets">
      <button className="mt-4 cursor-pointer bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-lg">
        Go to My Assets
      </button>
    </NavLink>
  </div>
  </>
)}

              {/* Your Orders */}
                            {user.role !== "driver" &&

              <div className="bg-blue-100 p-4 rounded-lg-lg">
                <h3 className="text-lg font-bold text-blue-800">Your Orders</h3>
                <p className="text-sm text-blue-700 mt-2">
                  View and manage the placed orders.
                </p>
                <NavLink to="/orders">
                  <button className="mt-4 cursor-pointer bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg">
                    View Orders
                  </button>
                </NavLink>
              </div>}


              {/* My Tasks */}
              {user.role !== "admin" &&
              <div className="bg-indigo-50 p-4 rounded-lg-lg">
                <h3 className="text-lg font-bold text-indigo-800">My Tasks</h3>
                <p className="text-sm text-indigo-700 mt-2">
                  View and complete your assigned personal tasks.
                </p>
               <div className="relative inline-block mt-4">
  <NavLink to="/my-tasks">
   <button
  onClick={handleViewTasks}
  className="cursor-pointer bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg"
>
  View My Assigned ToDos
</button>

  </NavLink>
  {notifications.filter(n => !n.read).length > 0 && (
    <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-lg-full">
      {notifications.filter(n => !n.read).length}
    </span>
  )}
</div>


              </div>}



              {(user.role === "sales" || user.role === "admin" || user.role === "accounts") && (
                <div className="bg-green-100 p-4 rounded-lg-lg">
                  <h3 className="text-lg font-bold text-green-800">Add New Order</h3>
                  <p className="text-sm text-green-700 mt-2">
                    Create and submit a new customer/company order.
                  </p>
                  <NavLink to="/add-order">
                    <button className="mt-4 cursor-pointer bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg">
                      Add New Order
                    </button>
                  </NavLink>
                </div>
              )}
{(user.role === "dispatch" || user.role === "accounts") && (
                <div className="bg-orange-100 p-4 rounded-lg-lg">
                  <h3 className="text-lg font-bold text-orange-800">Inventory Manager</h3>
                  <p className="text-sm text-orange-700 mt-2">
                    View and update current product stock levels.
                  </p>
                  <NavLink to="/inventory">
                    <button className="mt-4 cursor-pointer bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg">
                      Manage Inventory
                    </button>
                  </NavLink>
                </div>
              )}
            </div>
            {/* Production → Packaging → Dispatch Grid */}
       {["production", "packaging", "dispatch", "accounts"].includes(user.role) && (
<div className="bg-white mt-6 p-4 rounded-lg-lg shadow-md">
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
                EPS/Thermocol Block Molding Production Section
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
</div>

)}



            
            {user.role === "admin" && (
              <div className="bg-yellow-100 p-4 rounded-lg-lg mt-6">
                <h3 className="text-lg font-bold text-yellow-800">Admin Tools</h3>
                <p className="text-sm text-yellow-700 mt-2">
                  You have access to manage users and view all orders.
                </p>
                <NavLink to="/admin-dashboard">
                  <button className="mt-4 cursor-pointer bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg">
                    Go to Admin Panel
                  </button>
                </NavLink>
              </div>
            )}



        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
  {/* Task Dashboard — only for admin and accounts */}
  {["admin", "accounts","sales"].includes(user.role) && (
    <div className="bg-indigo-100 p-4 rounded-lg-lg">
      <h3 className="text-lg font-bold text-indigo-800">Task Dashboard</h3>
      <p className="text-sm text-indigo-700 mt-2">
        View, complete, and manage your assigned tasks.
      </p>
      <NavLink to="/task-dashboard">
        <button className="mt-4 cursor-pointer bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg">
          Go to ToDo Dashboard
        </button>
      </NavLink>
    </div>
  )}
{["accounts", "packaging"].includes(user.role) && (
  <div className="bg-fuchsia-100 p-4 rounded-lg-lg">
    <h3 className="text-lg font-bold text-fuchsia-800">Daily Shape Moulding Section, Packaging & Dispatch Report</h3>
    <p className="text-sm text-fuchsia-700 mt-2">
      View daily packaging status and packed stock details.
    </p>
    <NavLink to="/reports/packaging">
      <button className="mt-4 cursor-pointer bg-fuchsia-500 hover:bg-fuchsia-600 text-white px-4 py-2 rounded-lg">
        Go To Daily Shape Moulding Section, Packaging & Dispatch Report
      </button>
    </NavLink>
  </div>
)}
  {/* Assign Dispatch Plan — visible to dispatch, packaging, admin, accounts */}
  {["dispatch", "packaging", "admin", "accounts"].includes(user.role) && (
    <div className="bg-sky-100 p-4 rounded-lg-lg">
      <h3 className="text-lg font-bold text-sky-800">Assign Dispatch Plan</h3>
      <p className="text-sm text-sky-700 mt-2">
        Plan and assign dispatch tasks to specific drivers and vehicles.
      </p>
      <NavLink to="/assign-dispatch">
        <button className="mt-4 cursor-pointer bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 rounded-lg">
          Go to Assign Dispatch
        </button>
      </NavLink>
    </div>
  )}
  {["admin", "accounts"].includes(user.role) && (
  <>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Submit Material Requisition */}
      <div className="bg-rose-100 p-4 rounded-lg-lg">
        <h3 className="text-lg font-bold text-rose-800">Material Requisition Form</h3>
        <p className="text-sm text-rose-700 mt-2">
          Fill and submit a new material requisition slip for raw materials.
        </p>
        <NavLink to="/material-requisition">
          <button className="mt-4 cursor-pointer bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 rounded-lg">
            Go to Requisition Form
          </button>
        </NavLink>
      </div>

      {/* View All Requisition Slips */}
      <div className="bg-amber-100 p-4 rounded-lg-lg">
        <h3 className="text-lg font-bold text-amber-800">Requisition Slips</h3>
        <p className="text-sm text-amber-700 mt-2">
          View and download all submitted requisition slip PDFs.
        </p>
        <NavLink to="/requisition-slips">
          <button className="mt-4 cursor-pointer bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg">
            View Requisition Slips
          </button>
        </NavLink>
      </div>
    </div>
  </>
)}

</div>

{!["driver", "production", "dispatch", "packaging"].includes(user.role) && (
  <div className="bg-white mt-6 p-4 rounded-lg-lg shadow-md">
    <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">
      QUOTATION / PROFORMA INVOICE / ESTIMATE
    </h3>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
      {/* Proforma Invoice Section */}
     
            <NavLink to="/proforma-invoice">
                          <button className="w-full bg-green-500 hover:bg-green-600 text-white py-6 px-4 rounded-lg shadow text-sm sm:text-base text-center">
                Make New Quotation / Proforma Invoice / Estimate
              </button>
            </NavLink>
            <NavLink to="/proforma-dashboard">
                                      <button className="w-full bg-gray-500 hover:bg-gray-600 text-white py-6 px-4 rounded-lg shadow text-sm sm:text-base text-center">
                View Old Quotation / Proforma Invoice / Estimate
              </button>
            </NavLink>
        
    </div>
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



{["admin", "accounts"].includes(user.role) && (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
  <div className="bg-blue-50 p-4 rounded-lg mt-6">
    <h3 className="text-lg font-bold text-blue-800">Register New User</h3>
    <p className="text-sm text-blue-700 mt-2">
      Add a new user by email, name and assign them a role.
    </p>
    <NavLink to="/register-user">
      <button className="mt-4 cursor-pointer bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg">
        Register New User
      </button>
    </NavLink>
  </div>

  <div className="bg-indigo-100 p-4 rounded-lg md:mt-6 mt-0">
    <h3 className="text-lg font-bold text-indigo-800">Vehicle Mileage Report</h3>
    <p className="text-sm text-indigo-700 mt-2">
      View mileage (KM/L) per vehicle based on diesel filled and KM readings.
    </p>
    <NavLink to="/mileage-chart">
      <button className="mt-4 cursor-pointer bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg">
        Open Mileage Chart
      </button>
    </NavLink>
  </div>
  </div>
)}



          </div>
        </main>
      </div>
    </>
  );
}
