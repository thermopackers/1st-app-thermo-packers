import React, { useEffect, useState } from "react";
import axiosInstance from "../axiosInstance";
import { Link, useNavigate } from "react-router-dom";
import InternalNavbar from "../components/InternalNavbar";
import toast from "react-hot-toast";
import { useUserContext } from "../context/UserContext";
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';

export default function CustomerList() {
    const { user } = useUserContext();
    // Helper function to parse roles properly
const parseUserRoles = (user) => {
  if (!user || !user.role) {
    return [];
  }
  
  let userRoles = [];
  if (Array.isArray(user.role)) {
    if (user.role.length > 0 && typeof user.role[0] === 'string' && user.role[0].startsWith('[')) {
      try {
        userRoles = JSON.parse(user.role[0]);
      } catch (parseError) {
        userRoles = user.role;
      }
    } else {
      userRoles = user.role;
    }
  } else if (typeof user.role === 'string') {
    try {
      userRoles = JSON.parse(user.role);
    } catch (parseError) {
      userRoles = [user.role];
    }
  } else {
    userRoles = [user.role];
  }
  return userRoles;
};
  const userRoles = user ? parseUserRoles(user) : [];

  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [addedBySearch, setAddedBySearch] = useState("");
  const [totalPages, setTotalPages] = useState(1);
  const navigate = useNavigate();
  const [salesUsers, setSalesUsers] = useState([]);
const [selectedSalesId, setSelectedSalesId] = useState("");
const [productFilter, setProductFilter] = useState("");
const [hasDiwaliGift, setHasDiwaliGift] = useState(""); // "yes", "no", or ""
const [giftProducts, setGiftProducts] = useState([]); // Add this state
const [selectedGift, setSelectedGift] = useState(""); // Change from hasDiwaliGift
console.log("customers",customers);

  // ✅ NEW: Category states
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState("");
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  
  // Add this useEffect to fetch categories
// Replace the existing useEffect for fetching categories
useEffect(() => {
  const fetchCategories = async () => {
    try {
      const res = await axiosInstance.get("/customers/settings/categories");
      setCategories(res.data.categories || []);
    } catch (err) {
      console.error("Failed to load categories", err);
      // Fallback to default categories
      const defaultCategories = ['VIP', 'Regular', 'New', 'Corporate', 'Retail'];
      setCategories(defaultCategories);
    }
  };
  
  fetchCategories();
}, []);
  
  // ✅ NEW: Function to add category
const handleAddCategory = async () => {
  if (newCategory.trim() && !categories.includes(newCategory.trim())) {
    try {
      const res = await axiosInstance.post("/customers/settings/categories", {
        category: newCategory.trim()
      });
      
      if (res.data.success) {
        const updatedCategories = [...categories, newCategory.trim()];
        setCategories(updatedCategories);
        setNewCategory("");
        toast.success("Category added successfully!");
      }
    } catch (err) {
      console.error("Failed to add category", err);
      toast.error(err.response?.data?.error || "Failed to add category");
    }
  }
};
  
  // ✅ NEW: Function to remove category
const handleRemoveCategory = async (categoryToRemove) => {
  try {
    const res = await axiosInstance.delete(`/customers/settings/categories/${encodeURIComponent(categoryToRemove)}`);
    
    if (res.data.success) {
      const updatedCategories = categories.filter(cat => cat !== categoryToRemove);
      setCategories(updatedCategories);
      toast.success("Category removed!");
    }
  } catch (err) {
    console.error("Failed to remove category", err);
    toast.error(err.response?.data?.error || "Failed to remove category");
  }
};
  
  // ✅ NEW: Function to filter by category
  const handleCategoryFilter = (category) => {
    setSelectedCategory(category);
    setPage(1);
  };
  
  // ✅ NEW: Function to clear category filter
  const clearCategoryFilter = () => {
    setSelectedCategory("");
    setPage(1);
  };

  // ✅ NEW: Function to clear all filters
const clearAllFilters = () => {
  setSearch("");
  setSelectedCategory("");
  setSelectedGift("");
  setProductFilter("");
  setAddedBySearch("");
  setSelectedSalesId("");
  setPage(1);
};

// Add this useEffect to fetch gift products
useEffect(() => {
  const fetchGiftProducts = async () => {
    try {
      const res = await axiosInstance.get("/purchase-products/purchase-products-all", {
        params: { isGiftItem: true }
      });
      setGiftProducts(res.data || []);
    } catch (err) {
      console.error("Failed to fetch gift products", err);
    }
  };

  fetchGiftProducts();
}, []);

useEffect(() => {
  const fetchSalesUsers = async () => {
    try {
      const res = await axiosInstance.get("/users/sales");
      setSalesUsers(res.data);
    } catch (err) {
      console.error("Failed to fetch sales users", err);
    }
  };

  fetchSalesUsers();
}, []);


const fetchCustomers = async () => {
  setLoading(true);
  try {
    // Get product from URL params
    const urlParams = new URLSearchParams(window.location.search);
    const productFromUrl = urlParams.get('product');
    
    // Update local state
    setProductFilter(productFromUrl || "");
    
    const res = await axiosInstance.get("/customers", {
      params: { 
        search, 
        addedBy: addedBySearch, 
        createdBy: selectedSalesId, 
        page, 
        limit: 10,
        product: productFromUrl,
        giftType: selectedGift, // ✅ Change from hasDiwaliGift to giftType
        category: selectedCategory // ✅ NEW
      },
    });
    
    // Rest of the function remains the same...
    const customersWithProducts = await Promise.all(
      res.data.customers.map(async (customer) => {
        try {
          const productsRes = await axiosInstance.get(
            `/orders/customer-summary/${encodeURIComponent(customer.name)}`
          );
          return {
            ...customer,
            frequentProducts: productsRes.data || []
          };
        } catch (err) {
          console.error(`Failed to fetch products for customer ${customer.name}`, err);
          return {
            ...customer,
            frequentProducts: []
          };
        }
      })
    );
    
    setCustomers(customersWithProducts);
    setTotalPages(res.data.pages);
  } catch (err) {
    console.error("Failed to fetch customers", err);
  } finally {
    setLoading(false);
  }
};


useEffect(() => {
  fetchCustomers();
}, [search, addedBySearch, selectedSalesId, page, window.location.search, selectedGift, selectedCategory]); // Add window.location.search as dependency

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

const exportToExcel = async () => {
  try {
    const res = await axiosInstance.get("/customers/export/excel", {
      params: { 
        search, 
        addedBy: addedBySearch, 
        createdBy: selectedSalesId,
  giftType: selectedGift // ✅ Change to giftType
        },
    });

    if (res.data.success && res.data.data.length > 0) {
      // Create worksheet
      const worksheet = XLSX.utils.json_to_sheet(res.data.data);
      
      // Create workbook
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Customers");
      
      // Generate Excel file
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const data = new Blob([excelBuffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      
      // Save file
      saveAs(data, `customers_export_${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success(`Exported ${res.data.total} customers successfully!`);
    } else {
      toast.error("No data to export");
    }
  } catch (err) {
    console.error("Export failed", err);
    toast.error("Failed to export customers");
  }
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

       <div className="space-y-4 mb-4">
  {/* Main Search Input */}
  <div className="relative">
    <input
      type="text"
      placeholder="Search customer name, phone, email, or category..."
      value={search}
      onChange={(e) => {
        setSearch(e.target.value);
        setPage(1);
      }}
      className="w-full px-4 py-2 border border-gray-300 rounded-md pl-10"
    />
    <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
      🔍
    </div>
  </div>
  

</div>
{/* {!userRoles.includes("sales") && (
  <input
  type="text"
  placeholder="Search by Sales Name or Email"
  value={addedBySearch}
  onChange={(e) => {
    setAddedBySearch(e.target.value);
    setPage(1);
  }}
  className="mb-6 w-full px-4 py-2 border border-gray-300 rounded-md"
/>
)} */}


        <div className="overflow-x-auto w-full rounded-lg shadow">
{!userRoles.includes("sales") && (
          <select
  value={selectedSalesId}
  onChange={(e) => {
    setSelectedSalesId(e.target.value);
    setPage(1);
  }}
  className="mb-4 w-full px-4 py-2 border border-gray-300 rounded-md"
>
  <option value="">Filter by Sales (Dropdown)</option>
  {salesUsers.map((user) => (
    <option key={user._id} value={user._id}>
      {user.name} ({user.email})
    </option>
  ))}
</select>
)}

{/* Gift Type Filter */}
<div className="mb-4">
  <label className="block text-sm font-medium text-gray-700 mb-1">
    Filter by Gift Type:
  </label>
  <select
    value={selectedGift}
    onChange={(e) => {
      setSelectedGift(e.target.value);
      setPage(1);
    }}
    className="w-full px-4 py-2 border border-gray-300 rounded-md"
  >
    <option value="">All Customers</option>
    <option value="all_gifts">Has Any Diwali Gift</option>
    <option value="no_gifts">No Diwali Gifts</option>
    <optgroup label="Specific Gift Types">
      {giftProducts.map((gift) => (
        <option key={gift._id} value={gift._id}>
          {gift.name} ({gift.stock || 0} in stock)
        </option>
      ))}
    </optgroup>
  </select>
</div>

{/* Category Management Section */}
<div className="mb-4 space-y-3">
  <div className="flex items-center gap-2">
    <label className="block text-sm font-medium text-gray-700">
      Filter by Sales Category:
    </label>
    <button
      onClick={() => setShowCategoryModal(!showCategoryModal)}
      className="text-sm text-blue-600 hover:underline"
    >
      {showCategoryModal ? "Hide Categories" : "Manage Categories"}
    </button>
  </div>
  
  <div className="flex flex-wrap gap-2 mb-2">
    <button
      onClick={() => clearCategoryFilter()}
      className={`px-3 py-1 text-sm rounded-full ${
        selectedCategory === "" 
        ? "bg-blue-600 text-white" 
        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
      }`}
    >
      All Categories
    </button>
    {categories.map((category) => (
      <button
        key={category}
        onClick={() => handleCategoryFilter(category)}
        className={`px-3 py-1 text-sm rounded-full flex items-center gap-1 ${
          selectedCategory === category 
          ? "bg-blue-600 text-white" 
          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
        }`}
      >
        {category}
        {selectedCategory === category && (
          <span 
            onClick={(e) => {
              e.stopPropagation();
              clearCategoryFilter();
            }}
            className="ml-1 text-xs"
          >
            ✕
          </span>
        )}
      </button>
    ))}
  </div>
  
  {/* Category Management Modal */}
  {showCategoryModal && (
    <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg mb-4">
      <h4 className="font-medium text-gray-800 mb-3">Manage Sales Categories</h4>
      
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          placeholder="Add new category..."
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
          onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
        />
        <button
          onClick={handleAddCategory}
          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
        >
          Add
        </button>
      </div>
      
      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-600">Existing Categories:</p>
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <div 
              key={category} 
              className="flex items-center gap-2 bg-white border border-gray-300 rounded-full pl-3 pr-2 py-1"
            >
              <span className="text-sm">{category}</span>
              <button
                onClick={() => handleRemoveCategory(category)}
                className="text-red-500 hover:text-red-700 text-xs"
                title="Remove category"
              >
                ✕
              </button>
            </div>
          ))}
          {categories.length === 0 && (
            <p className="text-gray-500 text-sm">No categories added yet</p>
          )}
        </div>
      </div>
    </div>
  )}
</div>

{/* Active Filters Display */}
{(search || selectedCategory || selectedGift || productFilter) && (
  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
    <div className="flex items-center justify-between">
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-blue-700 font-medium">Active Filters:</span>
        
        {search && (
          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full flex items-center gap-1">
            Search: "{search}"
            <button 
              onClick={() => setSearch("")}
              className="text-blue-600 hover:text-blue-800 text-xs"
            >
              ✕
            </button>
          </span>
        )}
        
        {selectedCategory && (
          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full flex items-center gap-1">
            Category: {selectedCategory}
            <button 
              onClick={clearCategoryFilter}
              className="text-blue-600 hover:text-blue-800 text-xs"
            >
              ✕
            </button>
          </span>
        )}
        
        {selectedGift && giftProducts.find(g => g._id === selectedGift) && (
          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full flex items-center gap-1">
            Gift: {giftProducts.find(g => g._id === selectedGift)?.name}
            <button 
              onClick={() => setSelectedGift("")}
              className="text-blue-600 hover:text-blue-800 text-xs"
            >
              ✕
            </button>
          </span>
        )}
        
        {productFilter && (
          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full flex items-center gap-1">
            Product: {productFilter}
            <button 
              onClick={() => setProductFilter("")}
              className="text-blue-600 hover:text-blue-800 text-xs"
            >
              ✕
            </button>
          </span>
        )}
      </div>
      
      <button
        onClick={clearAllFilters}
        className="text-sm text-blue-600 hover:text-blue-800"
      >
        Clear All
      </button>
    </div>
  </div>
)}


{/* Clear Filters Button */}
<div className="flex justify-between items-center mb-4">
  <div className="flex-1"></div>
  <div className="flex gap-2">
    {(search || selectedCategory || selectedGift || addedBySearch || selectedSalesId) && (
      <button
        onClick={clearAllFilters}
        className="bg-gray-500 text-white px-4 py-2 rounded shadow hover:bg-gray-600 flex items-center gap-2"
      >
        🗑️ Clear Filters
      </button>
    )}
       {/* Campaign Buttons */}
    <button
      onClick={() => navigate('/campaigns/new/whatsapp')}
      className="bg-green-600 text-white px-4 py-2 rounded shadow hover:bg-green-700 flex items-center gap-2"
    >
      💬 Start WhatsApp Campaign
    </button>
    
    <button
      onClick={() => navigate('/campaigns/new/email')}
      className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 flex items-center gap-2"
    >
      ✉️ Start Email Campaign
    </button>
    
    <button
      onClick={exportToExcel}
      className="bg-green-600 text-white px-4 py-2 rounded shadow hover:bg-green-700 flex items-center gap-2"
    >
      📊 Export to Excel
    </button>
  </div>
</div>

{/* Product Filter Display */}
{new URLSearchParams(window.location.search).get('product') && (
  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
    <div className="flex items-center justify-between">
      <span className="text-blue-700 font-medium">
        Showing customers who purchased: <strong>{new URLSearchParams(window.location.search).get('product')}</strong>
      </span>
    </div>
  </div>
)}

          <table className="min-w-full text-sm sm:text-base bg-white border border-gray-200">
            <thead className="bg-gray-100 text-gray-800 font-semibold">
              <tr>
                <th className="p-3 border">Name</th>
                <th className="p-3 border">GST No.</th>
                    <th className="p-3 border">Frequently Bought Products</th> {/* NEW COLUMN */}
                        <th className="p-3 border">Gifts Received</th>
                <th className="p-3 border">Phone</th>
                <th className="p-3 border">Email</th>
                <th className="p-3 border">Address</th>
                                <th className="p-3 border">Instructions</th>
                                    <th className="p-3 border">Sales Category</th> {/* ✅ NEW COLUMN */}
                <th className="p-3 border">Google Map</th>
                <th className="p-3 border">Documents</th>
                <th className="p-3 border">Customer Handled / Managed By</th>
                <th className="p-3 border text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c._id} className="hover:bg-gray-50 transition">
<td className="p-3 border">
  <button
    onClick={() => navigate(`/orders?customer=${encodeURIComponent(c.name)}`)}
    className="text-blue-600 hover:underline cursor-pointer text-left"
  >
    {c.name}
  </button>
</td>                  <td className="p-3 border">{c.company}</td>
                      <td className="p-3 border text-sm">
      {c.frequentProducts && c.frequentProducts.length > 0 ? (
        <div className="max-w-[200px]">
          {c.frequentProducts.slice(0, 3).map((product, index) => (
            <div key={index} className="mb-1 last:mb-0">
              <span className="font-medium text-gray-700">{product.product}</span>
              <span className="text-xs text-gray-500 ml-1">
                (×{product.timesOrdered})
              </span>
            </div>
          ))}
          {c.frequentProducts.length > 3 && (
            <div className="text-xs text-gray-500 mt-1">
              +{c.frequentProducts.length - 3} more
            </div>
          )}
        </div>
      ) : (
        <span className="text-gray-400">—</span>
      )}
    </td>
    <td className="p-3 border">
  {c.giftHistory && c.giftHistory.length > 0 ? (
    <div className="max-w-[150px]">
      <div className="text-sm text-gray-700">
        Total: {c.giftHistory.length} Diwali gifts
      </div>
<button
  onClick={() => {
    navigate(`/customers/edit/${c._id}#gifts`);
  }}
  className="text-blue-600 hover:underline text-sm mt-1"
>
  View Details
</button>
    </div>
  ) : (
    <span className="text-gray-400">—</span>
  )}
</td>
                  <td className="p-3 border">{c.phone}</td>
                  <td className="p-3 border">{c.email}</td>
                  <td className="p-3 border whitespace-pre-line">{c.address}</td>
                   <td className="p-3 border max-w-xs"> {/* ✅ NEW CELL */}
                    {c.instructions ? (
                      <div 
                        className="whitespace-pre-line text-sm text-gray-700 max-h-20 overflow-y-auto"
                        title={c.instructions}
                      >
                        {c.instructions.length > 100 
                          ? `${c.instructions.substring(0, 100)}...` 
                          : c.instructions
                        }
                      </div>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="p-3 border">
  {c.salesCategory ? (
    <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
      {c.salesCategory}
    </span>
  ) : (
    <span className="text-gray-400">—</span>
  )}
</td>
                  <td className="p-3 border">
  {c.locationLink ? (
    <a
      href={c.locationLink}
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-600 hover:underline"
    >
      📍 View Map
    </a>
  ) : (
    <span className="text-gray-400">—</span>
  )}
</td>

                  <td className="p-3 border space-y-1 text-sm">
                    {c.gstDocs?.length > 0 ? (
                      <div className="flex flex-col gap-1 max-w-[180px]">
                       {c.gstDocs?.length > 0 ? (
  <div className="flex flex-col gap-1 max-w-[180px]">
    {c.gstDocs.map((url, i) => {
      if (!url || typeof url !== "string") return null; // ✅ Skip null/invalid entries

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

                      </div>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="p-3 border text-sm text-gray-700">
  {c.createdBy ? (
    <>
      <div>{c.createdBy.name}</div>
      <div className="text-xs text-gray-500">{c.createdBy.email}</div>
    </>
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

       <div className="mt-6 flex flex-col items-center justify-center gap-3 text-sm">
  {/* Prev / Page Buttons / Next */}
  <div className="flex items-center gap-2 flex-wrap justify-center">
    <button
      disabled={page === 1}
      onClick={() => handlePageChange(page - 1)}
      className="px-3 py-1 bg-gray-300 hover:bg-gray-400 rounded disabled:opacity-50"
    >
      ⬅️ Prev
    </button>

    {/* Visible page numbers (max 10) */}
    {Array.from({ length: totalPages }, (_, i) => i + 1)
      .filter((p) => {
        // Always show first, last, current, and 2 pages around current
        return (
          p === 1 ||
          p === totalPages ||
          (p >= page - 2 && p <= page + 2)
        );
      })
      .map((p, idx, arr) => (
        <React.Fragment key={p}>
          {idx > 0 && p - arr[idx - 1] > 1 && <span className="px-1">...</span>}
          <button
            onClick={() => handlePageChange(p)}
            className={`px-3 py-1 rounded border ${
              page === p
                ? "bg-blue-500 text-white"
                : "bg-white text-gray-800 border-gray-300 hover:bg-gray-100"
            }`}
          >
            {p}
          </button>
        </React.Fragment>
      ))}

    <button
      disabled={page === totalPages}
      onClick={() => handlePageChange(page + 1)}
      className="px-3 py-1 bg-gray-300 hover:bg-gray-400 rounded disabled:opacity-50"
    >
      Next ➡️
    </button>
  </div>

  {/* Go to page input */}
  <div className="flex items-center gap-2 mt-2">
    <span className="text-gray-700">Go to page:</span>
    <input
      type="number"
      min="1"
      max={totalPages}
      value={page}
      onChange={(e) => {
        const value = Number(e.target.value);
        if (value >= 1 && value <= totalPages) {
          setPage(value);
        }
      }}
      className="w-20 border rounded px-2 py-1 text-center"
    />
  </div>
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
