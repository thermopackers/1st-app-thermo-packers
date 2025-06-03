import { useEffect, useState } from "react";
import { useNavigate, NavLink, useLocation } from "react-router-dom";
import axiosInstance from "../axiosInstance";
import InternalNavbar from "../components/InternalNavbar";

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

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
          <div className="w-12 h-12 border-4 border-blue-500 border-dashed rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg font-medium text-blue-700">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <InternalNavbar />
      <div className="min-h-screen bg-gray-100 flex flex-col">
        <main className="flex-1 p-6 bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100">
          <button
            className="absolute hidden md:block left-4 cursor-pointer bg-blue-500 text-white px-4 py-2 rounded-md shadow-md hover:bg-blue-600 back-button"
            onClick={() => navigate(-1)}
          >
            ↩️ Back
          </button>

          <div className="bg-white md:mt-[8vh] shadow-md rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">
              Welcome 👋, <span className="font-extrabold text-2xl">{user.name}</span>{" "}
              <span className="capitalize">({user.role})</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              {/* Your Orders */}
              <div className="bg-blue-100 p-4 rounded-lg">
                <h3 className="text-lg font-bold text-blue-800">Your Orders</h3>
                <p className="text-sm text-blue-700 mt-2">
                  View and manage the placed orders.
                </p>
                <NavLink to="/orders">
                  <button className="mt-4 cursor-pointer bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
                    View Orders
                  </button>
                </NavLink>
              </div>

              {/* My Tasks */}
              {user.role !== "admin" &&
              <div className="bg-indigo-50 p-4 rounded-lg">
                <h3 className="text-lg font-bold text-indigo-800">My Tasks</h3>
                <p className="text-sm text-indigo-700 mt-2">
                  View and complete your assigned personal tasks.
                </p>
                <NavLink to="/my-tasks">
                  <button className="mt-4 cursor-pointer bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded">
                    View My Assigned ToDos
                  </button>
                </NavLink>
              </div>}

              {(user.role === "sales" || user.role === "admin" || user.role === "accounts") && (
                <div className="bg-green-100 p-4 rounded-lg">
                  <h3 className="text-lg font-bold text-green-800">Add New Order</h3>
                  <p className="text-sm text-green-700 mt-2">
                    Create and submit a new customer/company order.
                  </p>
                  <NavLink to="/add-order">
                    <button className="mt-4 cursor-pointer bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded">
                      Add New Order
                    </button>
                  </NavLink>
                </div>
              )}
{(user.role === "dispatch" || user.role === "accounts") && (
                <div className="bg-orange-100 p-4 rounded-lg">
                  <h3 className="text-lg font-bold text-orange-800">Inventory Manager</h3>
                  <p className="text-sm text-orange-700 mt-2">
                    View and update current product stock levels.
                  </p>
                  <NavLink to="/inventory">
                    <button className="mt-4 cursor-pointer bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded">
                      Manage Inventory
                    </button>
                  </NavLink>
                </div>
              )}
            </div>
            {/* Production → Packaging → Dispatch Grid */}
            {["production", "packaging", "dispatch"].some(role => user.role === role || user.role === "accounts") && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                {(user.role === "production" || user.role === "accounts") && (
                  <div className="bg-purple-100 p-4 rounded-lg">
                    <h3 className="text-lg font-bold text-purple-800">Production Dashboard</h3>
                    <p className="text-sm text-purple-700 mt-2">
                      Track production status and mark items as completed.
                    </p>
                    <NavLink to="/production-dashboard">
                      <button className="mt-4 cursor-pointer bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded">
                        Go to Production
                      </button>
                    </NavLink>
                  </div>
                )}

                {(user.role === "packaging" || user.role === "accounts") && (
                  <div className="bg-pink-100 p-4 rounded-lg">
                    <h3 className="text-lg font-bold text-pink-800">Packaging & Dispatch Dashboard for Shape Moulds</h3>
                    <p className="text-sm text-pink-700 mt-2">
                      Handle packaging tasks and update packaging status.
                    </p>
                    <NavLink to="/packaging-dashboard">
                      <button className="mt-4 cursor-pointer bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded">
                        Go to Packaging & Dispatch(Shape Moulds)
                      </button>
                    </NavLink>
                  </div>
                )}

                {(user.role === "dispatch" || user.role === "accounts") && (
                  <div className="bg-red-100 p-4 rounded-lg">
                    <h3 className="text-lg font-bold text-red-800">Packaging & Dispatch Dashboard for Block Moulds</h3>
                    <p className="text-sm text-red-700 mt-2">
                      View ready orders and update dispatch details.
                    </p>
                    <NavLink to="/dispatch-dashboard">
                      <button className="mt-4 cursor-pointer bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded">
                        Go to Packaging & Dispatch(Block Moulds)
                      </button>
                    </NavLink>
                  </div>
                )}
              </div>
            )}
            {user.role === "admin" && (
              <div className="bg-yellow-100 p-4 rounded-lg mt-6">
                <h3 className="text-lg font-bold text-yellow-800">Admin Tools</h3>
                <p className="text-sm text-yellow-700 mt-2">
                  You have access to manage users and view all orders.
                </p>
                <NavLink to="/admin-dashboard">
                  <button className="mt-4 cursor-pointer bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded">
                    Go to Admin Panel
                  </button>
                </NavLink>
              </div>
            )}

            {["admin", "accounts"].includes(user.role) && (
              <div className="bg-indigo-100 p-4 rounded-lg mt-6">
                <h3 className="text-lg font-bold text-indigo-800">Task Dashboard</h3>
                <p className="text-sm text-indigo-700 mt-2">
                  View, complete, and manage your assigned tasks.
                </p>
                <NavLink to="/task-dashboard">
                  <button className="mt-4 cursor-pointer bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded">
                    Go to ToDo Dashboard
                  </button>
                </NavLink>
              </div>
            )}
       {["admin", "accounts"].includes(user.role) && (
  <>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
      {/* Add New Product */}
      <div className="bg-lime-100 p-4 rounded-lg">
        <h3 className="text-lg font-bold text-lime-800">Add New Product</h3>
        <p className="text-sm text-lime-700 mt-2">
          Add a new product to the system including size, stock info, and image.
        </p>
        <NavLink to="/add-product">
          <button className="mt-4 cursor-pointer bg-lime-500 hover:bg-lime-600 text-white px-4 py-2 rounded">
            Add New Product
          </button>
        </NavLink>
      </div>

      {/* Add New Customer */}
      <div className="bg-cyan-100 p-4 rounded-lg">
        <h3 className="text-lg font-bold text-cyan-800">Add New Customer</h3>
        <p className="text-sm text-cyan-700 mt-2">
          Register a new customer or company in the database.
        </p>
        <NavLink to="/add-customer">
          <button className="mt-4 cursor-pointer bg-cyan-500 hover:bg-cyan-600 text-white px-4 py-2 rounded">
            Add New Customer
          </button>
        </NavLink>
      </div>
    </div>

    {/* All Products & All Customers */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
      {/* All Products */}
      <div className="bg-orange-100 p-4 rounded-lg">
        <h3 className="text-lg font-bold text-orange-800">All Products</h3>
        <p className="text-sm text-orange-700 mt-2">
          View and manage all products in the system.
        </p>
        <NavLink to="/all-products">
          <button className="mt-4 cursor-pointer bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded">
            View All Products
          </button>
        </NavLink>
      </div>

      {/* All Customers */}
      <div className="bg-violet-100 p-4 rounded-lg">
        <h3 className="text-lg font-bold text-violet-800">All Customers</h3>
        <p className="text-sm text-violet-700 mt-2">
          View and manage all customers and companies.
        </p>
        <NavLink to="/customers">
          <button className="mt-4 cursor-pointer bg-violet-500 hover:bg-violet-600 text-white px-4 py-2 rounded">
            View All Customers
          </button>
        </NavLink>
      </div>
    </div>
  </>
)}


          </div>
        </main>
      </div>
    </>
  );
}
