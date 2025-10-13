import { useEffect, useState } from "react";
import axiosInstance from "../axiosInstance";
import { useUserContext } from "../context/UserContext";
import { toast } from "react-hot-toast";
import InternalNavbar from "../components/InternalNavbar";
import Swal from "sweetalert2";

export default function TourExpensesDashboard() {
  const { user, loading: userLoading } = useUserContext();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterName, setFilterName] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  const fetchExpenses = async (nameFilter = "", pageNumber = 1) => {
    try {
      const res = await axiosInstance.get("/tour-expenses", {
        params: {
          salesName: nameFilter || undefined,
          page: pageNumber,
          limit: 10, // adjust as needed
        },
      });
      setExpenses(res.data.expenses);
      setPages(res.data.pages);
      setPage(res.data.page);
    } catch (err) {
      toast.error("Failed to load expenses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!userLoading && user) {
      fetchExpenses(filterName, page);
    }
  }, [userLoading, user, page]);

  const handleFilter = () => {
    setPage(1); // reset to first page on filter
    fetchExpenses(filterName, 1);
  };

  if (userLoading) {
    return <p className="text-center mt-8">Loading user...</p>;
  }

  const handleDelete = async (id) => {
  const result = await Swal.fire({
    title: 'Are you sure?',
    text: "You won't be able to revert this!",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
    confirmButtonText: 'Yes, delete it!'
  });

  if (result.isConfirmed) {
    try {
      await axiosInstance.delete(`/tour-expenses/${id}`);
      toast.success('Expense deleted successfully');
      
      // Refresh the expenses list
      fetchExpenses(filterName, page);
    } catch (err) {
      toast.error('Failed to delete expense');
      console.error(err);
    }
  }
};

  return (
    <>
      <InternalNavbar />
      <div className="max-w-6xl mx-auto mt-8 p-6 bg-white shadow rounded-xl">
        <h2 className="text-2xl font-bold text-slate-800 mb-4 text-center">
          {user?.role === "accounts"
            ? "All Tour Expenses"
            : "My Tour Expenses"}
        </h2>

        {user?.role === "accounts" && (
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={filterName}
              onChange={(e) => setFilterName(e.target.value)}
              placeholder="Filter by Sales Employee Name"
              className="flex-1 border rounded-lg px-3 py-2"
            />
            <button
              onClick={handleFilter}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg"
            >
              Filter
            </button>
          </div>
        )}

        {loading ? (
          <p className="text-center">Loading expenses...</p>
        ) : expenses.length === 0 ? (
          <p className="text-slate-600 text-center">No expenses found</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full border border-slate-200 text-sm">
                <thead className="bg-slate-100">
                  <tr>
                    {user?.role === "accounts" && (
                      <th className="p-2 border">Sales Employee</th>
                    )}
                    <th className="p-2 border">Date</th>
                    <th className="p-2 border">Location</th>
                    <th className="p-2 border">Expenses</th>
                    <th className="p-2 border">Total</th>
                                                            <th className="p-2 border">Money Taken</th>
<th className="p-2 border">Balance</th>
                    <th className="p-2 border">Files</th>
                    {user.role === "accounts" && 
                    <th className="p-2 border">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((exp) => {
                    // Calculate money taken total
const moneyTakenTotal = exp.moneyTaken?.reduce((sum, m) => sum + (parseFloat(m.amount) || 0), 0) || 0;

// Calculate balance
const balance = moneyTakenTotal - exp.total;

                  return(
                    <tr key={exp._id} className="text-center">
                      {user?.role === "accounts" && (
                        <td className="p-2 border">
                          {exp.user?.name || "—"}
                        </td>
                      )}
                     <td className="p-2 border">
  {new Date(exp.startDate).toLocaleDateString("en-GB")} 
  – 
  {new Date(exp.endDate).toLocaleDateString("en-GB")}
</td>

                      <td className="p-2 border">{exp.location}</td>
            

                      <td className="p-2 border text-left">
                        <ul className="list-disc list-inside">
                          {exp.expenses.map((e, idx) => (
                            <li key={idx}>
                              {e.description} –{" "}
                              <span className="text-green-700">
                                ₹{e.amount}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </td>
                      <td className="p-2 border font-bold text-green-600">
                        ₹{exp.total}
                      </td>
                      <td className="p-2 border text-left">
  <ul className="list-disc list-inside">
    {exp.moneyTaken.map((m, idx) => (
      <li key={idx}>
        {new Date(m.date).toLocaleDateString("en-GB")} – 
        ₹{m.amount} ({m.remarks || "—"})
      </li>
    ))}
  </ul>
  <div className="font-semibold mt-1">
    Total: <span className="text-blue-600">₹{moneyTakenTotal}</span>
  </div>
</td>
<td className={`p-2 border font-bold ${
  balance >= 0 ? "text-green-600" : "text-red-600"
}`}>
  {balance >= 0 ? `₹${balance} Remaining` : `₹${Math.abs(balance)} Over Spent`}
</td>

<td className="p-2 border">
  <div className="flex flex-wrap gap-2 justify-center">
    {exp.files.map((fileData, idx) => (
      <button
        key={idx}
        onClick={() =>
          Swal.fire({
            title: `File ${idx + 1}`,
            html: `<iframe src="${fileData.url}" style="width:100%;height:500px;" frameborder="0"></iframe>`,
            width: "80%",
            showCloseButton: true,
            showConfirmButton: false,
          })
        }
        className="text-indigo-600 underline text-xs"
      >
        File {idx + 1}
      </button>
    ))}
  </div>
</td>
{user.role === "accounts" && 
    <td className="p-2 border">
      <button
        onClick={() => handleDelete(exp._id)}
        className="text-red-600 hover:text-red-800"
        title="Delete expense"
      >
        🗑️
      </button>
    </td>}
                    </tr>
                  )})}
                </tbody>
              </table>
            </div>

          {/* Pagination controls */}
<div className="flex justify-center items-center gap-2 mt-4 flex-wrap">
  <button
    disabled={page <= 1}
    onClick={() => setPage((prev) => prev - 1)}
    className="px-3 py-1 bg-slate-200 rounded disabled:opacity-50"
  >
    ◀ Prev
  </button>

  {/* Page buttons */}
  {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
    <button
      key={p}
      onClick={() => setPage(p)}
      className={`px-3 py-1 rounded ${
        p === page
          ? "bg-indigo-600 text-white"
          : "bg-slate-100 hover:bg-slate-200"
      }`}
    >
      {p}
    </button>
  ))}

  <button
    disabled={page >= pages}
    onClick={() => setPage((prev) => prev + 1)}
    className="px-3 py-1 bg-slate-200 rounded disabled:opacity-50"
  >
    Next ▶
  </button>
</div>

          </>
        )}
      </div>
    </>
  );
}
