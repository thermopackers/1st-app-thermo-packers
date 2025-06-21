import { useEffect, useState } from "react";
import axiosInstance from "../axiosInstance";
import { Link, useNavigate } from "react-router-dom";
import InternalNavbar from "../components/InternalNavbar";
import toast from "react-hot-toast";

export default function CustomerList() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const navigate = useNavigate();
console.log("CustomerList component rendered",customers);

  const fetchCustomers = async () => {
      setLoading(true);
    try {
      const res = await axiosInstance.get("/customers", {
        params: { search, page, limit: 10 },
      });
      setCustomers(res.data.customers);
      setTotalPages(res.data.pages);
    } catch (err) {
      console.error("Failed to fetch customers", err);
    }  finally {
    setLoading(false);
  }
  };

  useEffect(() => {
    fetchCustomers();
  }, [search, page]);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this customer?")) return;
    try {
      await axiosInstance.delete(`/customers/${id}`);
      toast.success("Customer deleted successfully!");
      fetchCustomers();
    } catch (err) {
      toast.error("Failed to delete customer");
    }
  };
const handlePageChange = (newPage) => {
  setLoading(true);
  setPage(newPage);
};

  return (
    <>
      <InternalNavbar />

      <div className="p-4 sm:p-6 w-full min-h-screen relative">
        <button
          className="absolute hidden md:block left-4 top-4 bg-blue-500 text-white px-4 py-2 rounded shadow hover:bg-blue-600"
          onClick={() => navigate(-1)}
        >
          ↩️ Back
        </button>

        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-6">
          Customers
        </h2>

        <input
          type="text"
          placeholder="Search customers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-6 w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
        />

        <div className="overflow-x-auto w-full rounded-lg shadow">
          <table className="min-w-full text-sm sm:text-base bg-white border border-gray-200">
            <thead className="bg-gray-100 text-gray-800 font-semibold">
              <tr>
                <th className="p-3 border">Name</th>
                <th className="p-3 border">GST No.</th>
                <th className="p-3 border">Phone</th>
                <th className="p-3 border">Email</th>
                <th className="p-3 border">Address</th>
                <th className="p-3 border">Documents</th>
                <th className="p-3 border text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c._id} className="hover:bg-gray-50 transition">
                  <td className="p-3 border">{c.name}</td>
                  <td className="p-3 border">{c.company}</td>
                  <td className="p-3 border">{c.phone}</td>
                  <td className="p-3 border">{c.email}</td>
                  <td className="p-3 border whitespace-pre-line">{c.address}</td>
                  <td className="p-3 border space-y-1 text-sm">
                    {c.gstDocs?.length > 0 ? (
                      <div className="flex flex-col gap-1 max-w-[180px]">
                        {c.gstDocs.map((url, i) => {
                          const isImage = url.match(/\.(jpeg|jpg|png|gif)$/i);
                          const isPDF = url.endsWith(".pdf");
                          return (
                            <a
                              key={i}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline truncate flex items-center gap-1"
                            >
                              {isImage ? (
                                <>
                                  🖼️ <span className="truncate">Image {i + 1}</span>
                                </>
                              ) : isPDF ? (
                                <>
                                  📄 <span className="truncate">PDF {i + 1}</span>
                                </>
                              ) : (
                                <span>📎 File {i + 1}</span>
                              )}
                            </a>
                          );
                        })}
                      </div>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="p-3 border text-center space-x-2">
                    <Link
                      to={`/customers/edit/${c._id}`}
                      className="text-blue-600 hover:underline"
                    >
                      ✏️ Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(c._id)}
                      className="text-red-600 hover:underline"
                    >
                      🗑️ Delete
                    </button>
                  </td>
                </tr>
              ))}
              {customers.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center p-6 text-gray-500">
                    No customers found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
        <button
  disabled={page === 1}
  onClick={() => handlePageChange(page - 1)}
  className="px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded disabled:opacity-50"
>
  ⬅️ Prev
</button>

          <span className="text-gray-700 font-medium">
            Page {page} of {totalPages}
          </span>
        <button
  disabled={page === totalPages}
  onClick={() => handlePageChange(page + 1)}
  className="px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded disabled:opacity-50"
>
  Next ➡️
</button>

        </div>
      </div>
      {loading && (
  <div className="fixed inset-0 bg-[#000000bb] bg-opacity-40 z-50 flex items-center justify-center">
    <div className="w-16 h-16 border-4 border-blue-500 border-dashed rounded-full animate-spin"></div>
  </div>
)}

    </>
  );
}
