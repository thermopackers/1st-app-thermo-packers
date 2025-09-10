import { useState, useEffect, useRef } from "react";
import axiosInstance from "../axiosInstance";
import toast from "react-hot-toast";
import InternalNavbar from "../components/InternalNavbar";
import { motion, AnimatePresence } from "framer-motion";
import Swal from "sweetalert2";

export default function AddCategory() {
  const [inputs, setInputs] = useState([{ name: "" }]); // multiple category inputs
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
const [selectedSupplier, setSelectedSupplier] = useState(null);
const detailRef = useRef(null);

  const fetchCategories = async () => {
    try {
      const res = await axiosInstance.get("/categories");
      setCategories(res.data);
    } catch (err) {
      toast.error("Failed to load categories");
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // fetch suppliers by category
  const fetchSuppliers = async (category) => {
    try {
      const res = await axiosInstance.get(`/suppliers?category=${category}`);
      setSuppliers(res.data.data);
      setSelectedCategory(category);
    } catch (err) {
      toast.error("Failed to load suppliers");
    }
  };

  // handle input change
  const handleInputChange = (index, value) => {
    const newInputs = [...inputs];
    newInputs[index].name = value;
    setInputs(newInputs);
  };

  // add new input row
  const addInput = () => {
    setInputs([...inputs, { name: "" }]);
  };

  // remove input row
  const removeInput = (index) => {
    setInputs(inputs.filter((_, i) => i !== index));
  };

  // submit all categories
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const promises = inputs
        .filter((i) => i.name.trim() !== "")
        .map((i) => axiosInstance.post("/categories", { name: i.name }));

      await Promise.all(promises);

      toast.success("Categories added");
      setInputs([{ name: "" }]); // reset form
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to add categories");
    }
  };

  const handleFilePreview = (file) => {
  if (!file?.url) return;

  const isImage = file.url.match(/\.(jpeg|jpg|png|gif|webp)$/i);
  const isPdf = file.url.match(/\.pdf$/i);

  if (isImage) {
    Swal.fire({
      imageUrl: file.url,
      imageAlt: file.filename || "File Preview",
      showCloseButton: true,
      showConfirmButton: false,
      width: "auto",
    });
  } else if (isPdf) {
    Swal.fire({
      html: `<iframe src="${file.url}" width="100%" height="500px"></iframe>`,
      width: "80%",
      showCloseButton: true,
      showConfirmButton: false,
    });
  } else {
    Swal.fire("Unsupported file type", "", "error");
  }
};

  return (
    <>
      <InternalNavbar />
      <div className="max-w-md mx-auto p-6 bg-white rounded shadow">
        <h2 className="text-xl font-bold mb-4">➕ Add Categories</h2>

        <form onSubmit={handleSubmit} className="space-y-3">
          {inputs.map((input, index) => (
            <div key={index} className="flex gap-2">
              <input
                value={input.name}
                onChange={(e) => handleInputChange(index, e.target.value)}
                placeholder="Enter category name"
                className="flex-1 border p-2 rounded"
                required
              />
              {inputs.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeInput(index)}
                  className="bg-red-600 text-white px-2 rounded"
                >
                  ✕
                </button>
              )}
            </div>
          ))}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={addInput}
              className="bg-blue-600 text-white px-3 py-1 rounded"
            >
              ➕ Add Another
            </button>
            <button
              type="submit"
              className="bg-green-600 text-white px-4 py-1 rounded flex-1"
            >
              Save All
            </button>
          </div>
        </form>

       <h3 className="mt-6 font-semibold">📂 Categories</h3>
<ul className="list-disc pl-5 space-y-1">
  {categories.map((c) => (
    <li key={c._id} className="flex items-center gap-2">
      <span
        onClick={() => fetchSuppliers(c.name)}
        className="cursor-pointer text-blue-600 hover:underline flex-1"
      >
        {c.name}
      </span>

      {/* Edit button */}
      <button
        onClick={async () => {
          const newName = prompt("Enter new name:", c.name);
          if (newName && newName.trim() !== "") {
            try {
              await axiosInstance.put(`/categories/${c._id}`, { name: newName });
              toast.success("Category updated");
              fetchCategories();
            } catch (err) {
              toast.error(err.response?.data?.error || "Update failed");
            }
          }
        }}
        className="bg-yellow-500 text-white px-2 rounded text-sm"
      >
        ✎
      </button>

      {/* Delete button */}
      <button
        onClick={async () => {
          if (window.confirm(`Delete category "${c.name}"?`)) {
            try {
              await axiosInstance.delete(`/categories/${c._id}`);
              toast.success("Category deleted");
              fetchCategories();
            } catch (err) {
              toast.error(err.response?.data?.error || "Delete failed");
            }
          }
        }}
        className="bg-red-600 text-white px-2 rounded text-sm"
      >
        🗑
      </button>
    </li>
  ))}
</ul>


        {selectedCategory && (
        <div className="mt-4">
  <h4 className="font-bold">Suppliers in {selectedCategory}</h4>

  {suppliers.length > 0 ? (
   <div className="overflow-x-auto mt-2">
  <table className="w-full border text-xs sm:text-sm">
    <thead className="bg-gray-100">
      <tr>
        <th className="border px-2 py-1">Name</th>
        <th className="border px-2 py-1">Address</th>
        <th className="border px-2 py-1">Phone</th>
      </tr>
    </thead>
    <tbody>
      {suppliers.map((s) => (
        <tr
          key={s._id}
          onClick={() => {
            setSelectedSupplier(s);
            setTimeout(() => {
              detailRef.current?.scrollIntoView({
                behavior: "smooth",
                block: "start",
              });
            }, 250); // wait for animation mount
          }}
          className="hover:bg-gray-50 cursor-pointer"
        >
          <td className="border px-2 py-1 text-blue-700">{s.name}</td>
          <td className="border px-2 py-1 text-blue-700">{s.address}</td>
          <td className="border px-2 py-1 text-blue-700">{s.phone}</td>
        </tr>
      ))}
    </tbody>
  </table>
</div>

  ) : (
    <p className="text-gray-500 mt-2">No suppliers in this category</p>
  )}
 <AnimatePresence>
  {selectedSupplier && (
  <motion.div
  ref={detailRef}
  key={selectedSupplier._id}
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: 20 }}
  transition={{ duration: 0.3, ease: "easeInOut" }}
  className="mt-4 p-4 border rounded bg-gray-50 shadow-md"
>
  <h5 className="font-bold mb-2">Supplier Details</h5>

  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
    <p><strong>Name:</strong> {selectedSupplier.name}</p>
    <p><strong>Category:</strong> {selectedSupplier.vendorCategory}</p>
    <p><strong>Email:</strong> {selectedSupplier.email}</p>
    <p><strong>GST:</strong> {selectedSupplier.gstNumber}</p>
    <p><strong>Phone:</strong> {selectedSupplier.phone}</p>
    <p className="sm:col-span-2">
      <strong>Address:</strong> {selectedSupplier.address}
    </p>

    {/* Banking Details */}
    <p><strong>Acc Name:</strong> {selectedSupplier.accountName}</p>
    <p><strong>Bank Name:</strong> {selectedSupplier.bankName}</p>
    <p><strong>Acc No:</strong> {selectedSupplier.accountNumber}</p>
    <p><strong>IFSC:</strong> {selectedSupplier.ifscCode}</p>

    {/* Files */}
    {selectedSupplier.files?.length > 0 && (
      <div className="sm:col-span-2 mt-2">
        <strong>Files:</strong>
        <div className="flex flex-wrap gap-2 mt-1">
          {selectedSupplier.files.map((f, i) => {
            const isImage = f.url.match(/\.(jpeg|jpg|png|gif|webp)$/i);
            const isPdf = f.url.match(/\.pdf$/i);
            return (
              <div
                key={i}
                onClick={() => handleFilePreview(f)}
                className="cursor-pointer border rounded p-1 w-24 h-24 flex items-center justify-center bg-gray-100 hover:bg-gray-200"
              >
                {isImage ? (
                  <img
                    src={f.url}
                    alt={f.filename || `File ${i + 1}`}
                    className="w-full h-full object-cover rounded"
                  />
                ) : isPdf ? (
                  <span className="text-red-600 font-bold">PDF</span>
                ) : (
                  <span className="text-gray-500">File</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    )}

    {/* Cheque Files */}
    {selectedSupplier.chequeFiles?.length > 0 && (
      <div className="sm:col-span-2 mt-2">
        <strong>Cheque Files:</strong>
        <div className="flex flex-wrap gap-2 mt-1">
          {selectedSupplier.chequeFiles.map((f, i) => {
            const isImage = f.url.match(/\.(jpeg|jpg|png|gif|webp)$/i);
            const isPdf = f.url.match(/\.pdf$/i);
            return (
              <div
                key={i}
                onClick={() => handleFilePreview(f)}
                className="cursor-pointer border rounded p-1 w-24 h-24 flex items-center justify-center bg-gray-100 hover:bg-gray-200"
              >
                {isImage ? (
                  <img
                    src={f.url}
                    alt={f.filename || `Cheque ${i + 1}`}
                    className="w-full h-full object-cover rounded"
                  />
                ) : isPdf ? (
                  <span className="text-red-600 font-bold">PDF</span>
                ) : (
                  <span className="text-gray-500">File</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    )}
  </div>

  <button
    onClick={() => setSelectedSupplier(null)}
    className="mt-3 bg-red-600 text-white px-3 py-1 rounded w-full sm:w-auto"
  >
    Close
  </button>
</motion.div>

  )}
</AnimatePresence>



</div>


        )}
      </div>
    </>
  );
}
