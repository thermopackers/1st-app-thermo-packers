import { useEffect, useRef, useState } from "react";
import ReactWebcam from "react-webcam";
import { useNavigate, NavLink, useLocation } from "react-router-dom";
import axiosInstance from "../axiosInstance";
import InternalNavbar from "../components/InternalNavbar";
import '../index.css';
import Swal from "sweetalert2";


export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
const [notifications, setNotifications] = useState([]);
const [page, setPage] = useState(1);
const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [capturing, setCapturing] = useState(false);
const [type, setType] = useState(""); // "check-in" or "check-out"
const webcamRef = useRef(null);

  const handleCapture = (type) => {
  setType(type);
  setCapturing(true);
};

const compressImage = (base64Str, quality = 0.6) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      const compressed = canvas.toDataURL("image/jpeg", quality);
      resolve(compressed);
    };
    img.src = base64Str;
  });
};


const saveAttendance = async () => {
  setIsSaving(true);

  try {
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) {
      Swal.fire("Error", "No image captured", "error");
      return;
    }

    const compressedImage = await compressImage(imageSrc, 0.5);

    // 👇 Get GPS location
    const getLocation = () =>
      new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            });
          },
          (err) => {
            console.error("Location error:", err);
            resolve(null); // Don't fail even if user blocks location
          },
          { timeout: 10000 }
        );
      });

    const location = await getLocation();

    const res = await axiosInstance.post(
      "/attendance/mark",
      {
        type,
        photo: compressedImage,
        location, // 👈 Send location in request
      },
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );

    Swal.fire("Success", `Successfully marked ${type}`, "success");
    setCapturing(false);
  } catch (err) {
    console.error("❌ Attendance marking failed:", err);
    Swal.fire("Error", err?.response?.data?.error || "Failed to mark attendance", "error");
    setCapturing(false);
  } finally {
    setIsSaving(false);
  }
};



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
<div className="bg-white shadow-lg p-2 rounded-xl">
  <h2 className="text-xl font-semibold text-center text-gray-800 mb-4">
    📋 Mark Attendance
  </h2>
  <div className="flex flex-wrap justify-center gap-6">
    <button
      onClick={() => handleCapture("check-in")}
      className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-full text-sm font-medium shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] transition duration-200 focus:outline-none focus:ring-2 focus:ring-green-400"
    >
      <span className="text-lg">✅</span> Check In
    </button>

    <button
      onClick={() => handleCapture("check-out")}
      className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-full text-sm font-medium shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] transition duration-200 focus:outline-none focus:ring-2 focus:ring-red-400"
    >
      <span className="text-lg">⏹️</span> Check Out
    </button>
  </div>
</div>





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

<div className="flex flex-col gap-6 mt-6">
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

        
{["sales", "admin", "accounts"].includes(user.role) && (
  <div className="bg-white p-4 rounded-lg-lg shadow-md">
    <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">
      SALES ORDERS
    </h3>

    {/* Make it single column always to ensure full width */}
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
{!["driver", "packaging"].includes(user.role) && (
  <div className="bg-white mt-6 p-4 rounded-xl shadow-md">
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


      {/* Assign / View Task Dashboard */}
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
  </div>
)}


{["admin", "accounts", "production", "dispatch", "packaging"].includes(user.role) && (
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
  {["admin","sales","accounts","dispatch", "packaging","production"].includes(user.role) && (
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
<div className="bg-green-100 p-4 rounded-lg mt-6">
  <h3 className="text-lg font-bold text-green-800">Attendance Logs</h3>
  <p className="text-sm text-green-700 mt-2">
    View daily attendance records and check-ins.
  </p>
  <NavLink to="/attendance-logs">
    <button className="mt-4 cursor-pointer bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg">
      Go to Attendance Logs
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
    
 {capturing && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
    <div className="relative bg-white w-full max-w-sm mx-4 p-6 rounded-2xl shadow-2xl flex flex-col items-center animate-fade-in">

      {/* Cancel Button (Top-right) */}
      <button
        className="absolute top-2 right-2 text-gray-500 hover:text-red-600 text-xl font-bold focus:outline-none"
        onClick={() => setCapturing(false)}
        aria-label="Close"
      >
        ×
      </button>

      <h3 className="text-xl font-bold mb-4 text-gray-800 capitalize">
        {type} - Capture Photo
      </h3>

      <ReactWebcam
        audio={false}
        ref={webcamRef}
        screenshotFormat="image/jpeg"
        className="rounded-lg shadow-md w-full h-auto max-w-full mb-4 border border-gray-300"
      />

      <button
        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 text-sm font-semibold rounded-lg shadow-md transition duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
        onClick={saveAttendance}
      >
        📸 Save Attendance
      </button>
    </div>
  </div>
)}


{isSaving && (
  <div className="fixed inset-0 bg-[#000000ad] bg-opacity-50 flex justify-center items-center z-50">
    <div className="loader border-t-4 border-blue-500 rounded-full w-12 h-12 animate-spin"></div>
  </div>
)}


    </>
  );
}
