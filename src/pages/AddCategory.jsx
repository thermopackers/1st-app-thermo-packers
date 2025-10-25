import { useState, useEffect, useRef } from "react";
import axiosInstance from "../axiosInstance";
import toast from "react-hot-toast";
import InternalNavbar from "../components/InternalNavbar";
import { motion, AnimatePresence } from "framer-motion";
import Swal from "sweetalert2";

export default function AddCategory() {
  const [inputs, setInputs] = useState([{ name: "" }]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [loading, setLoading] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editValue, setEditValue] = useState("");
  const detailRef = useRef(null);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("/categories");
      setCategories(res.data);
    } catch (err) {
      toast.error("Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchSuppliers = async (category) => {
    try {
      setLoading(true);
      const res = await axiosInstance.get(`/suppliers?category=${category}`);
      setSuppliers(res.data.data);
      setSelectedCategory(category);
    } catch (err) {
      toast.error("Failed to load suppliers");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (index, value) => {
    const newInputs = [...inputs];
    newInputs[index].name = value;
    setInputs(newInputs);
  };

  const addInput = () => {
    setInputs([...inputs, { name: "" }]);
  };

  const removeInput = (index) => {
    setInputs(inputs.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validInputs = inputs.filter((i) => i.name.trim() !== "");
    
    if (validInputs.length === 0) {
      toast.error("Please enter at least one category name");
      return;
    }

    try {
      setLoading(true);
      const promises = validInputs.map((i) => 
        axiosInstance.post("/categories", { name: i.name })
      );

      await Promise.all(promises);
      toast.success(`Successfully added ${validInputs.length} categor${validInputs.length > 1 ? 'ies' : 'y'}`);
      setInputs([{ name: "" }]);
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to add categories");
    } finally {
      setLoading(false);
    }
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category._id);
    setEditValue(category.name);
  };

  const saveEditCategory = async () => {
    if (!editValue.trim()) {
      toast.error("Category name cannot be empty");
      return;
    }

    try {
      await axiosInstance.put(`/categories/${editingCategory}`, { 
        name: editValue.trim() 
      });
      toast.success("Category updated successfully");
      setEditingCategory(null);
      setEditValue("");
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.error || "Update failed");
    }
  };

  const cancelEdit = () => {
    setEditingCategory(null);
    setEditValue("");
  };

  const deleteCategory = async (category) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: `Delete category "${category.name}"? This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    });

    if (result.isConfirmed) {
      try {
        await axiosInstance.delete(`/categories/${category._id}`);
        toast.success("Category deleted successfully");
        fetchCategories();
        if (selectedCategory === category.name) {
          setSelectedCategory("");
          setSuppliers([]);
        }
      } catch (err) {
        toast.error(err.response?.data?.error || "Delete failed");
      }
    }
  };

  const handleFilePreview = (file) => {
    if (!file?.url) return;

    const isImage = file.url.match(/\.(jpeg|jpg|png|gif|webp|bmp|svg)$/i);
    const isPdf = file.url.match(/\.pdf$/i);
    const isDocument = file.url.match(/\.(doc|docx|txt)$/i);

    if (isImage) {
      Swal.fire({
        imageUrl: file.url,
        imageAlt: file.filename || "File Preview",
        showCloseButton: true,
        showConfirmButton: false,
        width: "auto",
        background: '#f8f9fa',
        imageHeight: 'auto',
        imageWidth: '80%'
      });
    } else if (isPdf) {
      Swal.fire({
        html: `<iframe src="${file.url}" width="100%" height="500px" style="border: none;"></iframe>`,
        width: "90%",
        showCloseButton: true,
        showConfirmButton: false,
        background: '#f8f9fa',
      });
    } else if (isDocument) {
      Swal.fire({
        title: 'Document File',
        text: `This is a document file: ${file.filename || 'Unnamed file'}`,
        icon: 'info',
        confirmButtonText: 'OK'
      });
    } else {
      Swal.fire({
        title: 'Unsupported File Type',
        text: 'This file type cannot be previewed.',
        icon: 'error',
        confirmButtonText: 'OK'
      });
    }
  };

  return (
    <>
      <InternalNavbar />
      
      {/* Main Container */}
      <div className="min-h-screen bg-gray-50 py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          
          {/* Header Section */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  📂 Category Management
                </h1>
                <p className="text-gray-600 mt-2">
                  Add, edit, and manage product categories and view associated suppliers
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Left Column - Add Categories */}
            <div className="space-y-6">
              
              {/* Add Category Form */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-bold mb-4 text-gray-800 flex items-center gap-2">
                  <span className="bg-green-100 text-green-800 p-2 rounded-lg">➕</span>
                  Add New Categories
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                    {inputs.map((input, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex gap-2 items-start"
                      >
                        <div className="flex-1">
                          <input
                            value={input.name}
                            onChange={(e) => handleInputChange(index, e.target.value)}
                            placeholder="Enter category name"
                            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                            required
                            disabled={loading}
                          />
                        </div>
                        {inputs.length > 1 && (
                          <motion.button
                            type="button"
                            onClick={() => removeInput(index)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="bg-red-100 text-red-600 hover:bg-red-200 px-3 py-3 rounded-lg transition-colors duration-200 flex items-center justify-center min-w-[44px]"
                            disabled={loading}
                          >
                            ✕
                          </motion.button>
                        )}
                      </motion.div>
                    ))}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <motion.button
                      type="button"
                      onClick={addInput}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="bg-blue-100 text-blue-700 hover:bg-blue-200 px-4 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2 sm:flex-1"
                      disabled={loading}
                    >
                      <span>➕</span>
                      Add Another
                    </motion.button>
                    <motion.button
                      type="submit"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="bg-green-600 text-white hover:bg-green-700 px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2 sm:flex-1"
                      disabled={loading}
                    >
                      {loading ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <span>💾</span>
                      )}
                      Save All Categories
                    </motion.button>
                  </div>
                </form>
              </div>

              {/* Categories List */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-bold mb-4 text-gray-800 flex items-center gap-2">
                  <span className="bg-blue-100 text-blue-800 p-2 rounded-lg">📂</span>
                  Existing Categories ({categories.length})
                </h3>

                {loading && categories.length === 0 ? (
                  <div className="flex justify-center py-8">
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : categories.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-4xl mb-2">📁</div>
                    <p>No categories yet</p>
                    <p className="text-sm">Add your first category above</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {categories.map((category) => (
                      <motion.div
                        key={category._id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className={`p-4 rounded-lg border transition-all duration-200 ${
                          selectedCategory === category.name 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {editingCategory === category._id ? (
                          <div className="flex gap-2 items-center">
                            <input
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className="flex-1 border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500"
                              onKeyPress={(e) => e.key === 'Enter' && saveEditCategory()}
                            />
                            <button
                              onClick={saveEditCategory}
                              className="bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700 transition-colors"
                            >
                              ✓
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="bg-gray-500 text-white px-3 py-2 rounded hover:bg-gray-600 transition-colors"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <button
                              onClick={() => fetchSuppliers(category.name)}
                              className={`flex-1 text-left font-medium transition-colors duration-200 ${
                                selectedCategory === category.name 
                                  ? 'text-blue-700' 
                                  : 'text-gray-700 hover:text-blue-600'
                              }`}
                            >
                              {category.name}
                            </button>
                            <div className="flex gap-1 ml-2">
                              <button
                                onClick={() => handleEditCategory(category)}
                                className="bg-yellow-100 text-yellow-700 hover:bg-yellow-200 p-2 rounded transition-colors duration-200"
                                title="Edit category"
                              >
                                ✎
                              </button>
                              <button
                                onClick={() => deleteCategory(category)}
                                className="bg-red-100 text-red-600 hover:bg-red-200 p-2 rounded transition-colors duration-200"
                                title="Delete category"
                              >
                                🗑
                              </button>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Suppliers */}
            <div className="space-y-6">
              
              {/* Suppliers Section */}
              {selectedCategory && (
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                      <span className="bg-green-100 text-green-800 p-2 rounded-lg">👥</span>
                      Suppliers in <span className="text-blue-600 ml-1">{selectedCategory}</span>
                    </h4>
                    <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                      {suppliers.length} supplier{suppliers.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {loading ? (
                    <div className="flex justify-center py-8">
                      <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  ) : suppliers.length > 0 ? (
                    <div className="overflow-hidden border border-gray-200 rounded-lg">
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[500px]">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                                Name
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b hidden sm:table-cell">
                                Address
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                                Phone
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {suppliers.map((supplier) => (
                              <motion.tr
                                key={supplier._id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                onClick={() => {
                                  setSelectedSupplier(supplier);
                                  setTimeout(() => {
                                    detailRef.current?.scrollIntoView({
                                      behavior: "smooth",
                                      block: "start",
                                    });
                                  }, 250);
                                }}
                                className="hover:bg-gray-50 cursor-pointer transition-colors duration-150"
                              >
                                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-blue-600">
                                  {supplier.name}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900 hidden sm:table-cell">
                                  {supplier.address}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                  {supplier.phone}
                                </td>
                              </motion.tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <div className="text-4xl mb-2">👥</div>
                      <p>No suppliers in this category</p>
                    </div>
                  )}
                </div>
              )}

              {/* Supplier Details */}
              <AnimatePresence>
                {selectedSupplier && (
                  <motion.div
                    ref={detailRef}
                    key={selectedSupplier._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="bg-white rounded-xl shadow-sm p-6 border border-gray-200"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h5 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <span className="bg-blue-100 text-blue-800 p-2 rounded-lg">📋</span>
                        Supplier Details
                      </h5>
                      <button
                        onClick={() => setSelectedSupplier(null)}
                        className="bg-red-100 text-red-600 hover:bg-red-200 px-4 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2"
                      >
                        ✕ Close
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      {/* Basic Info */}
                      <div className="space-y-3">
                        <div>
                          <label className="font-semibold text-gray-600">Name</label>
                          <p className="text-gray-900">{selectedSupplier.name}</p>
                        </div>
                        <div>
                          <label className="font-semibold text-gray-600">Category</label>
                          <p className="text-gray-900">{selectedSupplier.vendorCategory}</p>
                        </div>
                        <div>
                          <label className="font-semibold text-gray-600">Email</label>
                          <p className="text-gray-900 break-all">{selectedSupplier.email}</p>
                        </div>
                        <div>
                          <label className="font-semibold text-gray-600">GST Number</label>
                          <p className="text-gray-900">{selectedSupplier.gstNumber}</p>
                        </div>
                      </div>

                      {/* Contact Info */}
                      <div className="space-y-3">
                        <div>
                          <label className="font-semibold text-gray-600">Phone</label>
                          <p className="text-gray-900">{selectedSupplier.phone}</p>
                        </div>
                        <div className="md:col-span-2">
                          <label className="font-semibold text-gray-600">Address</label>
                          <p className="text-gray-900">{selectedSupplier.address}</p>
                        </div>
                      </div>

                      {/* Banking Details */}
                      <div className="md:col-span-2 border-t pt-4">
                        <h6 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                          <span className="bg-green-100 text-green-800 p-1 rounded">🏦</span>
                          Banking Details
                        </h6>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="font-semibold text-gray-600">Account Name</label>
                            <p className="text-gray-900">{selectedSupplier.accountName}</p>
                          </div>
                          <div>
                            <label className="font-semibold text-gray-600">Bank Name</label>
                            <p className="text-gray-900">{selectedSupplier.bankName}</p>
                          </div>
                          <div>
                            <label className="font-semibold text-gray-600">Account Number</label>
                            <p className="text-gray-900">{selectedSupplier.accountNumber}</p>
                          </div>
                          <div>
                            <label className="font-semibold text-gray-600">IFSC Code</label>
                            <p className="text-gray-900">{selectedSupplier.ifscCode}</p>
                          </div>
                        </div>
                      </div>

                      {/* Files Section */}
                      {selectedSupplier.files?.length > 0 && (
                        <div className="md:col-span-2 border-t pt-4">
                          <h6 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                            <span className="bg-purple-100 text-purple-800 p-1 rounded">📎</span>
                            Documents ({selectedSupplier.files.length})
                          </h6>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                            {selectedSupplier.files.map((file, index) => {
                              const isImage = file.url.match(/\.(jpeg|jpg|png|gif|webp|bmp|svg)$/i);
                              const isPdf = file.url.match(/\.pdf$/i);
                              return (
                                <motion.div
                                  key={index}
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => handleFilePreview(file)}
                                  className="cursor-pointer border border-gray-200 rounded-lg p-2 bg-gray-50 hover:bg-gray-100 transition-colors duration-200 flex flex-col items-center"
                                >
                                  <div className="w-12 h-12 flex items-center justify-center mb-1">
                                    {isImage ? (
                                      <div className="w-full h-full bg-blue-100 rounded flex items-center justify-center">
                                        <span className="text-blue-600 text-xs">IMG</span>
                                      </div>
                                    ) : isPdf ? (
                                      <div className="w-full h-full bg-red-100 rounded flex items-center justify-center">
                                        <span className="text-red-600 text-xs font-bold">PDF</span>
                                      </div>
                                    ) : (
                                      <div className="w-full h-full bg-gray-200 rounded flex items-center justify-center">
                                        <span className="text-gray-600 text-xs">FILE</span>
                                      </div>
                                    )}
                                  </div>
                                  <span className="text-xs text-gray-600 text-center truncate w-full">
                                    {file.filename || `File ${index + 1}`}
                                  </span>
                                </motion.div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Cheque Files */}
                      {selectedSupplier.chequeFiles?.length > 0 && (
                        <div className="md:col-span-2 border-t pt-4">
                          <h6 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                            <span className="bg-orange-100 text-orange-800 p-1 rounded">🏦</span>
                            Cheque Files ({selectedSupplier.chequeFiles.length})
                          </h6>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                            {selectedSupplier.chequeFiles.map((file, index) => {
                              const isImage = file.url.match(/\.(jpeg|jpg|png|gif|webp|bmp|svg)$/i);
                              const isPdf = file.url.match(/\.pdf$/i);
                              return (
                                <motion.div
                                  key={index}
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => handleFilePreview(file)}
                                  className="cursor-pointer border border-gray-200 rounded-lg p-2 bg-gray-50 hover:bg-gray-100 transition-colors duration-200 flex flex-col items-center"
                                >
                                  <div className="w-12 h-12 flex items-center justify-center mb-1">
                                    {isImage ? (
                                      <div className="w-full h-full bg-green-100 rounded flex items-center justify-center">
                                        <span className="text-green-600 text-xs">CHQ</span>
                                      </div>
                                    ) : isPdf ? (
                                      <div className="w-full h-full bg-red-100 rounded flex items-center justify-center">
                                        <span className="text-red-600 text-xs font-bold">PDF</span>
                                      </div>
                                    ) : (
                                      <div className="w-full h-full bg-gray-200 rounded flex items-center justify-center">
                                        <span className="text-gray-600 text-xs">FILE</span>
                                      </div>
                                    )}
                                  </div>
                                  <span className="text-xs text-gray-600 text-center truncate w-full">
                                    {file.filename || `Cheque ${index + 1}`}
                                  </span>
                                </motion.div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Empty State for Right Column */}
              {!selectedCategory && (
                <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                  <div className="text-6xl mb-4">👈</div>
                  <h3 className="text-lg font-bold text-gray-800 mb-2">Select a Category</h3>
                  <p className="text-gray-600">
                    Choose a category from the list to view its suppliers and details
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}