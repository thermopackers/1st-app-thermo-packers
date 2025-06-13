import { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import InternalNavbar from '../components/InternalNavbar';
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);
import { NavLink, useNavigate } from 'react-router-dom';
import axiosInstance from '../axiosInstance';

export default function AdminPanel() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    topProducts: [],
    departments: {
        sales: [],
      accounts: [],
        production: [],
        dispatch: []
      },
          monthlyOrders: [],
    monthlyRevenue: []
  });
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchAdminData = async () => {
      try {
        const res = await axiosInstance.get('/admin/summary', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setStats(res.data);
      } catch (err) {
        console.error('Failed to load admin summary', err);
        navigate('/dashboard'); // if non-admin tries
      }
    };

    fetchAdminData();
  }, [navigate, token]);

  return (
    <>
      <InternalNavbar />
      {/* Back Button */}
    <div className="flex min-h-screen ">
   

      {/* Main Content */}
      <div className="flex-1 bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 p-6 overflow-y-auto">
      <button
        className="absolute hidden md:block cursor-pointer left-4 bg-blue-500 text-white px-4 py-2 rounded-md shadow-md hover:bg-blue-600 back-button"
        onClick={() => navigate(-1)} // Go back to the previous page
      >
        ↩️ Back
      </button>
        <h2 className="text-center text-3xl md:text-4xl font-bold mb-6">Admin Dashboard</h2>

        {/* Total Orders and Revenue */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white shadow-md p-6 rounded-lg">
            <h3 className="text-lg font-bold text-gray-700">📑 Total Orders</h3>
            <p className="text-2xl mt-2">{stats.totalOrders}</p>
          </div>

          <div className="bg-white shadow-md p-6 rounded-lg">
            <h3 className="text-lg font-bold text-gray-700">💵 Total Revenue</h3>
<p className="text-2xl mt-2">
  ₹{typeof stats.totalRevenue === 'number' ? stats.totalRevenue.toFixed(2) : '0.00'}
</p>
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white shadow-md p-6 rounded-lg mb-6">
          <h3 className="text-lg font-bold mb-4 text-gray-700">🔝 Top Products</h3>
          {stats.topProducts.length === 0 ? (
            <p>No orders yet.</p>
          ) : (
            <ul className="list-disc list-inside text-gray-600">
              {stats.topProducts.map((p, idx) => (
                <li key={idx}>
                  {p.product} — {p.count} orders
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Department Employees */}
<div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
  {['sales','accounts', 'production', 'dispatch'].map((dept) => (
    <div key={dept} className="bg-white shadow-md p-6 rounded-lg">
      <h3 className="text-lg font-bold mb-4 text-gray-700 capitalize">{dept} Department</h3>
      {stats.departments[dept]?.length === 0 ? (
        <p>No employees found.</p>
      ) : (
        <ul className="list-disc list-inside text-gray-600">
          {stats.departments[dept].map((emp) => (
            <li key={emp._id}>{emp.name}</li>
          ))}
        </ul>
      )}
    </div>
  ))}
</div>


        {/* Monthly Orders Chart */}
        <div className="bg-white shadow-md p-6 rounded-lg mb-6">
          <h3 className="text-lg font-bold mb-4 text-gray-700">Monthly Orders</h3>
          <Bar
            data={{
              labels: months,
              datasets: [
                {
                  label: 'Orders',
                  data: stats.monthlyOrders || [],
                  backgroundColor: 'rgba(59, 130, 246, 0.7)',
                }
              ],
            }}
            options={{ responsive: true }}
          />
        </div>

        {/* Monthly Revenue Chart */}
        <div className="bg-white shadow-md p-6 rounded-lg">
          <h3 className="text-lg font-bold mb-4 text-gray-700">Monthly Revenue</h3>
          <Bar
            data={{
              labels: months,
              datasets: [
                {
                  label: 'Revenue',
                  data: stats.monthlyRevenue || [],
                  backgroundColor: 'rgba(16, 185, 129, 0.7)',
                }
              ],
            }}
            options={{ responsive: true }}
          />
        </div>

      </div>
    </div>
    
    </>
  );
}
