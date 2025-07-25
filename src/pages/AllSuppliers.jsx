import { useEffect, useState } from "react";
import axiosInstance from "../axiosInstance";
import toast from "react-hot-toast";
import InternalNavbar from "../components/InternalNavbar";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

export default function AllSuppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
console.log("suppliers",suppliers);

  useEffect(() => {
    fetchSuppliers();
  }, [page, query]);

  const fetchSuppliers = async () => {
    try {
      const res = await axiosInstance.get(`/suppliers?page=${page}&limit=10&search=${query}`);
      setSuppliers(res.data.data);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      toast.error("Failed to fetch suppliers");
    }
  };

  const handleSearch = () => {
    setPage(1);
    setQuery(search);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this supplier?")) return;
    await axiosInstance.delete(`/suppliers/${id}`);
    toast.success("Deleted");
    fetchSuppliers();
  };

  return (
    <>
      <InternalNavbar />
      <div className="p-6">
        <h2 className="text-xl font-bold mb-4">📋 All Suppliers</h2>

        {/* Search */}
        <div className="mb-4 flex gap-2">
          <input
            type="text"
            placeholder="Search by name, company, email..."
            className="border px-2 py-1 rounded w-64"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <button onClick={handleSearch} className="bg-blue-600 text-white px-3 py-1 rounded">
            Search
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full table-auto border text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2">Name</th>
                <th className="p-2">Category</th>
                <th className="p-2">Company</th>
                <th className="p-2">Phone</th>
                <th className="p-2">Email</th>
                <th className="p-2">GST</th>
                <th className="p-2">Address</th>
                <th className="p-2">Files</th>
                <th className="p-2">Location</th>
<th className="p-2">Bank</th>
<th className="p-2">Cheque</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.map((supplier) => (
                <tr key={supplier._id} className="border-t align-top text-center">
                  <td className="p-2">{supplier.name}</td>
                  <td className="p-2">{supplier.vendorCategory || "–"}</td>
                  <td className="p-2">{supplier.company}</td>
                  <td className="p-2">{supplier.phone}</td>
                  <td className="p-2">{supplier.email}</td>
                  <td className="p-2">{supplier.gstNumber}</td>
                  <td className="p-2">{supplier.address}</td>
            <td className="p-2">
  <div className="flex flex-wrap gap-2">
    {supplier.files?.map((file, index) => {
      const fileUrl = file?.url || "";
      const isPDF = fileUrl.toLowerCase().includes(".pdf");

      return (
        <div
          key={index}
          className="w-12 h-12 border rounded flex items-center justify-center bg-gray-50 overflow-hidden cursor-pointer"
         onClick={() => {
  const isMobile = window.innerWidth < 768;
  const files = supplier.files || [];

  if (isMobile && files.length > 1) {
    // Show all images & PDFs in a scrollable SweetAlert modal on mobile
    const content = files
      .map((f, i) => {
        const url = f?.url || "";
        const ext = url.toLowerCase();

        if (ext.includes(".pdf")) {
          return `<div class="mb-4"><iframe src="${url}" style="width:100%; height:400px;" frameborder="0"></iframe></div>`;
        }

        return `<div class="mb-4"><img src="${url}" alt="file-${i}" style="max-width:100%; border-radius:8px;" onerror="this.src='/broken-image.png'"/></div>`;
      })
      .join("");

    Swal.fire({
      html: `<div style="max-height:80vh; overflow-y:auto;">${content}</div>`,
      width: '95%',
      showCloseButton: true,
      showConfirmButton: false,
      background: "#f9fafb",
      customClass: {
        popup: "rounded-xl shadow-lg",
      },
    });
  } else {
    const fileUrl = file?.url || "";
    const isPDF = fileUrl.toLowerCase().includes(".pdf");

    if (isPDF) {
      Swal.fire({
        html: `<iframe src="${fileUrl}" width="100%" height="500px" style="border: none;"></iframe>`,
        width: '90%',
        showCloseButton: true,
        showConfirmButton: false,
        background: "#f9fafb",
        customClass: {
          popup: "rounded-xl shadow-lg",
        },
      });
    } else {
      Swal.fire({
        imageUrl: fileUrl,
        imageAlt: "Supplier Image",
        showCloseButton: true,
        showConfirmButton: false,
        background: "#f9fafb",
        customClass: {
          popup: "rounded-xl shadow-lg",
        },
      });
    }
  }
}}

        >
          {isPDF ? (
            <span className="text-2xl text-red-600">📄</span>
          ) : (
            <img
              src={fileUrl}
              alt={`file-${index}`}
              className="object-cover w-full h-full rounded"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "/broken-image.png";
              }}
            />
          )}
        </div>
      );
    })}
  </div>
</td>
{/* Location */}
<td className="p-2">
  {supplier.locationLink ? (
    <a
      href={supplier.locationLink}
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-600 hover:underline text-xs break-all"
    >
      📍 Map
    </a>
  ) : (
    <span className="text-gray-500">–</span>
  )}
</td>

{/* Bank Details */}
<td className="p-2 text-xs text-left whitespace-normal">
  <div><strong>Acc Name:</strong> {supplier.accountName || "–"}</div>
  <div><strong>Acc No:</strong> {supplier.accountNumber || "–"}</div>
  <div><strong>IFSC:</strong> {supplier.ifscCode || "–"}</div>
</td>

{/* Cheque Files */}
<td className="p-2">
  <div className="flex flex-wrap gap-2">
    {supplier.chequeFiles?.map((file, index) => {
      const url = file?.url || "";
      const isPDF = url.toLowerCase().includes(".pdf");

      return (
        <div
          key={index}
          className="w-12 h-12 border rounded flex items-center justify-center bg-gray-50 overflow-hidden cursor-pointer"
          onClick={() => {
            if (isPDF) {
              Swal.fire({
                html: `<iframe src="${url}" width="100%" height="500px" style="border: none;"></iframe>`,
                width: '90%',
                showCloseButton: true,
                showConfirmButton: false,
                background: "#f9fafb",
                customClass: { popup: "rounded-xl shadow-lg" },
              });
            } else {
              Swal.fire({
                imageUrl: url,
                imageAlt: "Cheque Image",
                showCloseButton: true,
                showConfirmButton: false,
                background: "#f9fafb",
                customClass: { popup: "rounded-xl shadow-lg" },
              });
            }
          }}
        >
          {isPDF ? (
            <span className="text-2xl text-red-600">📄</span>
          ) : (
            <img
              src={url}
              alt={`cheque-${index}`}
              className="object-cover w-full h-full rounded"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "/broken-image.png";
              }}
            />
          )}
        </div>
      );
    })}
  </div>
</td>


                  <td className="p-2 space-x-2 whitespace-nowrap">
                    <button
                      onClick={() => navigate(`/suppliers/edit/${supplier._id}`)}
                      className="text-blue-600 hover:underline"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(supplier._id)}
                      className="text-red-600 hover:underline"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
              {suppliers.length === 0 && (
                <tr>
                  <td colSpan="8" className="text-center text-gray-500 py-6">
                    No suppliers found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      {/* Modern Pagination */}
<div className="mt-6 flex flex-wrap justify-center items-center gap-2 text-sm">
  {/* Prev Button */}
  <button
    onClick={() => setPage((p) => Math.max(p - 1, 1))}
    disabled={page === 1}
    className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
  >
    ◀ Prev
  </button>

  {/* Numbered Pages */}
  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
    <button
      key={pg}
      onClick={() => setPage(pg)}
      className={`px-3 py-1 rounded border ${
        pg === page
          ? "bg-blue-600 text-white border-blue-600"
          : "bg-white text-gray-800 hover:bg-blue-100"
      }`}
    >
      {pg}
    </button>
  ))}

  {/* Next Button */}
  <button
    onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
    disabled={page === totalPages}
    className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
  >
    Next ▶
  </button>
</div>

      </div>
    </>
  );
}
