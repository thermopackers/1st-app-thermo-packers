import React, { useEffect, useState } from "react";
import axiosInstance from "../axiosInstance";
import { Link, useNavigate } from "react-router-dom";
import InternalNavbar from "../components/InternalNavbar";
import toast from "react-hot-toast";
import { useUserContext } from "../context/UserContext";
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import { Calculator } from "lucide-react";

export default function PotentialCustomerList() {
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
  // Remarks states
const [editingRemarks, setEditingRemarks] = useState(null);
const [remarksData, setRemarksData] = useState({});
const [savingRemarks, setSavingRemarks] = useState({});
const [selectedSalesId, setSelectedSalesId] = useState("");
const [productFilter, setProductFilter] = useState("");
const [hasDiwaliGift, setHasDiwaliGift] = useState(""); // "yes", "no", or ""
const [giftProducts, setGiftProducts] = useState([]); // Add this state
const [selectedGift, setSelectedGift] = useState(""); // Change from hasDiwaliGift
// Follow-up states
const [followUps, setFollowUps] = useState({});
const [loadingFollowUps, setLoadingFollowUps] = useState({});
const [showFollowUpForm, setShowFollowUpForm] = useState({});
const [editingFollowUpId, setEditingFollowUpId] = useState({});
const [followUpFormData, setFollowUpFormData] = useState({});
const [followUpPage, setFollowUpPage] = useState({});
const [followUpTotalPages, setFollowUpTotalPages] = useState({});
const [followUpTotal, setFollowUpTotal] = useState({});
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
      const res = await axiosInstance.get("/potential-customers/settings/categories");
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

// Initialize remarks data when customers load
useEffect(() => {
  const initialRemarks = {};
  customers.forEach(c => {
    initialRemarks[c._id] = c.remarks || '';
  });
  setRemarksData(prev => ({ ...prev, ...initialRemarks }));
}, [customers]);
  
  // ✅ NEW: Function to add category
const handleAddCategory = async () => {
  if (newCategory.trim() && !categories.includes(newCategory.trim())) {
    try {
      const res = await axiosInstance.post("/potential-customers/settings/categories", {
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
    const res = await axiosInstance.delete(`/potential-customers/settings/categories/${encodeURIComponent(categoryToRemove)}`);
    
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
    
    const res = await axiosInstance.get("/potential-customers", {
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
      await axiosInstance.delete(`/potential-customers/${id}`);
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
    const res = await axiosInstance.get("/potential-customers/export/excel", {
      params: { 
        search, 
        addedBy: addedBySearch, 
        createdBy: selectedSalesId,
        giftType: selectedGift,
        category: selectedCategory // ✅ Add category filter to export
      },
    });

    if (res.data.success && res.data.data.length > 0) {
      // ✅ Enhance the data with additional fields
      const enhancedData = res.data.data.map((item, index) => {
        // Find the full customer data from state
        const customer = customers.find(c => c.name === item["Customer Name"]);
        
        return {
          ...item,
          // ✅ Add follow-up status
          "Follow-up Status": customer?.latestFollowUpStatus || 'No Follow-up',
          // ✅ Add remarks
          "Remarks": customer?.remarks || '',
          // ✅ Add latest follow-up date
          "Last Follow-up Date": customer?.lastFollowUpDate 
            ? new Date(customer.lastFollowUpDate).toLocaleDateString() 
            : '',
          // ✅ Add total follow-ups count
          "Total Follow-ups": customer?.followUps?.length || 0,
          // ✅ Add sales category (already in data but ensure it's there)
          "Sales Category": customer?.salesCategory || '',
          // ✅ Add converted status
          "Converted": customer?.convertedToCustomerId ? 'Yes' : 'No',
        };
      });

      // Create worksheet with all columns
      const worksheet = XLSX.utils.json_to_sheet(enhancedData);
      
      // ✅ Auto-size columns for better readability
      const colWidths = [];
      const headers = Object.keys(enhancedData[0] || {});
      headers.forEach((key, idx) => {
        let maxLength = key.length;
        enhancedData.forEach(row => {
          const value = row[key] ? String(row[key]) : '';
          if (value.length > maxLength) maxLength = value.length;
        });
        colWidths[idx] = { wch: Math.min(Math.max(maxLength + 2, 12), 40) };
      });
      worksheet['!cols'] = colWidths;

      // Create workbook
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Potential Customers");
      
      // Generate Excel file
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const data = new Blob([excelBuffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      
      // Save file
      saveAs(data, `potential_customers_${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success(`Exported ${enhancedData.length} customers successfully!`);
    } else {
      toast.error("No data to export");
    }
  } catch (err) {
    console.error("Export failed", err);
    toast.error(err.response?.data?.error || "Failed to export customers");
  }
};

// FOLLOW-UP FUNCTIONS

const fetchFollowUps = async (customerId, page = 1) => {
  if (!customerId) return;
  
  setLoadingFollowUps(prev => ({ ...prev, [customerId]: true }));
  try {
    const res = await axiosInstance.get(`/potential-customers/${customerId}/follow-ups`, {
      params: { page, limit: 5 }
    });
    
    if (res.data.success) {
      setFollowUps(prev => ({ 
        ...prev, 
        [customerId]: res.data.followUps || [] 
      }));
      setFollowUpTotalPages(prev => ({ 
        ...prev, 
        [customerId]: Math.ceil((res.data.total || 0) / 5) 
      }));
      setFollowUpTotal(prev => ({ 
        ...prev, 
        [customerId]: res.data.total || 0 
      }));
      setFollowUpPage(prev => ({ 
        ...prev, 
        [customerId]: page 
      }));
    }
  } catch (err) {
    console.error('Failed to fetch follow-ups:', err);
  } finally {
    setLoadingFollowUps(prev => ({ ...prev, [customerId]: false }));
  }
};

const handleAddFollowUp = async (customerId) => {
  const formData = followUpFormData[customerId] || { status: 'pending', notes: '', nextFollowUpDate: '' };
  
  if (!formData.status) {
    toast.error('Status is required');
    return;
  }

  try {
    const res = await axiosInstance.post(`/potential-customers/${customerId}/follow-up`, formData);
    if (res.data.success) {
      toast.success('Follow-up added successfully');
      setFollowUpFormData(prev => ({ ...prev, [customerId]: { status: 'pending', notes: '', nextFollowUpDate: '' } }));
      setShowFollowUpForm(prev => ({ ...prev, [customerId]: false }));
      setEditingFollowUpId(prev => ({ ...prev, [customerId]: null }));
      fetchFollowUps(customerId, followUpPage[customerId] || 1);
      // Refresh the customer list to update the latest status
      fetchCustomers();
    }
  } catch (err) {
    console.error('Failed to add follow-up:', err);
    toast.error(err.response?.data?.error || 'Failed to add follow-up');
  }
};

const handleUpdateFollowUp = async (customerId, followUpId) => {
  const formData = followUpFormData[customerId] || { status: 'pending', notes: '', nextFollowUpDate: '' };
  
  if (!formData.status) {
    toast.error('Status is required');
    return;
  }

  try {
    const res = await axiosInstance.put(`/potential-customers/${customerId}/follow-up/${followUpId}`, formData);
    if (res.data.success) {
      toast.success('Follow-up updated successfully');
      setFollowUpFormData(prev => ({ ...prev, [customerId]: { status: 'pending', notes: '', nextFollowUpDate: '' } }));
      setShowFollowUpForm(prev => ({ ...prev, [customerId]: false }));
      setEditingFollowUpId(prev => ({ ...prev, [customerId]: null }));
      fetchFollowUps(customerId, followUpPage[customerId] || 1);
      // Refresh the customer list to update the latest status
      fetchCustomers();
    }
  } catch (err) {
    console.error('Failed to update follow-up:', err);
    toast.error(err.response?.data?.error || 'Failed to update follow-up');
  }
};

const handleDeleteFollowUp = async (customerId, followUpId) => {
  if (!window.confirm('Are you sure you want to delete this follow-up?')) return;

  try {
    const res = await axiosInstance.delete(`/potential-customers/${customerId}/follow-up/${followUpId}`);
    if (res.data.success) {
      toast.success('Follow-up deleted successfully');
      fetchFollowUps(customerId, followUpPage[customerId] || 1);
      fetchCustomers(); // Refresh to update status
    }
  } catch (err) {
    console.error('Failed to delete follow-up:', err);
    toast.error('Failed to delete follow-up');
  }
};

const handleEditFollowUp = (customerId, followUp) => {
  setFollowUpFormData(prev => ({
    ...prev,
    [customerId]: {
      status: followUp.status,
      notes: followUp.notes || '',
      nextFollowUpDate: followUp.nextFollowUpDate ? new Date(followUp.nextFollowUpDate).toISOString().split('T')[0] : ''
    }
  }));
  setEditingFollowUpId(prev => ({ ...prev, [customerId]: followUp._id }));
  setShowFollowUpForm(prev => ({ ...prev, [customerId]: true }));
};

const cancelFollowUpForm = (customerId) => {
  setFollowUpFormData(prev => ({ ...prev, [customerId]: { status: 'pending', notes: '', nextFollowUpDate: '' } }));
  setEditingFollowUpId(prev => ({ ...prev, [customerId]: null }));
  setShowFollowUpForm(prev => ({ ...prev, [customerId]: false }));
};

const toggleFollowUpForm = (customerId) => {
  setShowFollowUpForm(prev => ({ 
    ...prev, 
    [customerId]: !prev[customerId] 
  }));
  if (!showFollowUpForm[customerId]) {
    // Initialize form data if not exists
    if (!followUpFormData[customerId]) {
      setFollowUpFormData(prev => ({
        ...prev,
        [customerId]: { status: 'pending', notes: '', nextFollowUpDate: '' }
      }));
    }
    fetchFollowUps(customerId, 1);
  } else {
    cancelFollowUpForm(customerId);
  }
};


// Get status label with proper formatting
const getFollowUpStatusLabel = (status) => {
  const statusMap = {
    'invalid_inquiry': '❌ Invalid or Irrelevant Inquiry',
    'not_interested': '🙅 Customer Not Interested',
    'price_too_high': '💰 Quotation Rejected – Price Too High',
    'delivery_not_feasible': '🚚 Delivery Location Not Feasible',
    'fulfilled_by_other': '🏢 Order Fulfilled by Another Vendor',
    'order_confirmed': '✅ Order Confirmed – Proceeding with Processing'
  };
  return statusMap[status] || status || '—';
};

// Get status color
const getFollowUpStatusColor = (status) => {
  switch(status) {
    case 'invalid_inquiry': return 'bg-red-100 text-red-800 border-red-300';
    case 'not_interested': return 'bg-orange-100 text-orange-800 border-orange-300';
    case 'price_too_high': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    case 'delivery_not_feasible': return 'bg-purple-100 text-purple-800 border-purple-300';
    case 'fulfilled_by_other': return 'bg-blue-100 text-blue-800 border-blue-300';
    case 'order_confirmed': return 'bg-green-100 text-green-800 border-green-300';
    default: return 'bg-gray-100 text-gray-600 border-gray-300';
  }
};

// Get status icon only (for compact display)
const getFollowUpStatusIcon = (status) => {
  const iconMap = {
    'invalid_inquiry': '❌',
    'not_interested': '🙅',
    'price_too_high': '💰',
    'delivery_not_feasible': '🚚',
    'fulfilled_by_other': '🏢',
    'order_confirmed': '✅'
  };
  return iconMap[status] || '📋';
};

// Get status short label (for dropdown display)
const getFollowUpStatusShort = (status) => {
  const statusMap = {
    'invalid_inquiry': 'Invalid Inquiry',
    'not_interested': 'Not Interested',
    'price_too_high': 'Price Too High',
    'delivery_not_feasible': 'Delivery Not Feasible',
    'fulfilled_by_other': 'Fulfilled by Other',
    'order_confirmed': 'Order Confirmed'
  };
  return statusMap[status] || status || 'Select Status';
};

// Handle follow-up form field changes
const handleFollowUpFormChange = (customerId, field, value) => {
  setFollowUpFormData(prev => ({
    ...prev,
    [customerId]: {
      ...(prev[customerId] || { status: 'pending', notes: '', nextFollowUpDate: '' }),
      [field]: value
    }
  }));
};

// REMARKS FUNCTIONS
const handleSaveRemarks = async (customerId) => {
  const remarks = remarksData[customerId] || '';
  
  setSavingRemarks(prev => ({ ...prev, [customerId]: true }));
  try {
    const res = await axiosInstance.put(`/potential-customers/${customerId}/remarks`, { remarks });
    if (res.data.success) {
      toast.success('Remarks updated successfully');
      setEditingRemarks(null);
      // Update the customer in the list
      setCustomers(prev => prev.map(c => 
        c._id === customerId 
          ? { ...c, remarks: res.data.remarks }
          : c
      ));
    }
  } catch (err) {
    console.error('Failed to update remarks:', err);
    toast.error(err.response?.data?.error || 'Failed to update remarks');
  } finally {
    setSavingRemarks(prev => ({ ...prev, [customerId]: false }));
  }
};



  return (
    <>
      <InternalNavbar />

      <div className="p-4 sm:p-6 w-full min-h-screen relative">
               <div className="flex flex-col sm:flex-row items-center justify-between mb-6">
          <button
            className="hidden md:block bg-blue-500 text-white px-4 py-2 rounded shadow hover:bg-blue-600 mb-4 sm:mb-0"
            onClick={() => navigate(-1)}
          >
            ↩️ Back
          </button>
          
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-4 sm:mb-0">
          Potential Customers
          </h2>
          
          <button
            onClick={() => navigate("/add-potential-customer")}
            className="bg-green-600 text-white px-4 py-2 rounded shadow hover:bg-green-700 mb-4 sm:mb-0 flex items-center gap-2"
          >
            ➕ Add Potential Customer
          </button>
        </div>
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
    <option value="">All Potential Customers</option>
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
        Showing Potential customers who purchased: <strong>{new URLSearchParams(window.location.search).get('product')}</strong>
      </span>
    </div>
  </div>
)}

          <table className="min-w-full text-sm sm:text-base bg-white border border-gray-200">
            <thead className="bg-gray-100 text-gray-800 font-semibold">
              <tr>
                <th className="p-3 border">Name</th>
                {/* <th className="p-3 border">GST No.</th> */}
                    {/* <th className="p-3 border">Frequently Bought Products</th>  */}
                        {/* <th className="p-3 border">Gifts Given</th> */}
                <th className="p-3 border">Phone</th>
                <th className="p-3 border">Email</th>
                <th className="p-3 border">Address</th>
                                {/* <th className="p-3 border">Instructions</th> */}
                                    <th className="p-3 border">Sales Category</th> {/* ✅ NEW COLUMN */}
                {/* <th className="p-3 border">Google Map</th> */}
                {/* <th className="p-3 border">Documents</th> */}
                <th className="p-3 border">Customer Handled / Managed By</th>
                    {/* <th className="p-3 border text-center">Costing Sheet</th>   */}
                <th className="p-3 border text-center">Actions</th>
                <th className="p-3 border text-center">Status</th>
                 <th className="p-3 border">Follow-up Status</th>
    <th className="p-3 border">Remarks</th>
              </tr>
            </thead>
           <tbody>
  {customers.map((c) => {
    const customerFollowUps = followUps[c._id] || [];
    const isLoading = loadingFollowUps[c._id] || false;
    const showForm = showFollowUpForm[c._id] || false;
    const editingId = editingFollowUpId[c._id] || null;
    const formData = followUpFormData[c._id] || { status: 'pending', notes: '', nextFollowUpDate: '' };
    const currentPage = followUpPage[c._id] || 1;
    const totalPages = followUpTotalPages[c._id] || 1;
    
// Get status color - for new status types
const getStatusColor = (status) => {
  switch(status) {
    case 'invalid_inquiry': return 'bg-red-100 text-red-800 border-red-300';
    case 'not_interested': return 'bg-orange-100 text-orange-800 border-orange-300';
    case 'price_too_high': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    case 'delivery_not_feasible': return 'bg-purple-100 text-purple-800 border-purple-300';
    case 'fulfilled_by_other': return 'bg-blue-100 text-blue-800 border-blue-300';
    case 'order_confirmed': return 'bg-green-100 text-green-800 border-green-300';
    default: return 'bg-gray-100 text-gray-600 border-gray-300';
  }
};

const getStatusLabel = (status) => {
  const statusMap = {
    'invalid_inquiry': 'Invalid or Irrelevant Inquiry',
    'not_interested': 'Customer Not Interested',
    'price_too_high': 'Quotation Rejected – Price Too High',
    'delivery_not_feasible': 'Delivery Location Not Feasible',
    'fulfilled_by_other': 'Order Fulfilled by Another Vendor',
    'order_confirmed': 'Order Confirmed – Proceeding with Processing'
  };
  return statusMap[status] || status || 'No Follow-up';
};

    return (
      <tr key={c._id} className="hover:bg-gray-50 transition">
        <td className="p-3 border">
          <span className="text-blue-600 text-left">{c.name}</span>
        </td>
        <td className="p-3 border">{c.phone}</td>
        <td className="p-3 border">{c.email}</td>
        <td className="p-3 border whitespace-pre-line">{c.address}</td>
        <td className="p-3 border">
          {c.salesCategory ? (
            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
              {c.salesCategory}
            </span>
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
            to={`/potential-customers/edit/${c._id}`}
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
        <td className="p-3 border text-center">
          {c.convertedToCustomerId ? (
            <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium border border-green-300">
              <span className="text-green-600">✅</span>
              Converted
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs font-medium">
              <span className="text-gray-400">○</span>
              {c.status ? c.status.charAt(0).toUpperCase() + c.status.slice(1) : 'New'}
            </span>
          )}
        </td>
        
        {/* FOLLOW-UP STATUS COLUMN */}
        <td className="p-3 border">
          <div className="flex flex-col gap-1">
            <button
      onClick={() => toggleFollowUpForm(c._id)}
      className="w-full text-left"
    >
      {c.latestFollowUpStatus ? (
        <span className={`px-2 py-1 text-xs rounded-full border ${getFollowUpStatusColor(c.latestFollowUpStatus)}`}>
          {getFollowUpStatusLabel(c.latestFollowUpStatus)}
        </span>
      ) : (
        <span className="text-gray-400 text-sm hover:text-blue-500 transition">
          ➕ Add Follow-up
        </span>
      )}
    </button>
            
            {/* Follow-up form - shown inline */}
            {showForm && (
              <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="space-y-2">
                <select
  value={formData.status}
  onChange={(e) => handleFollowUpFormChange(c._id, 'status', e.target.value)}
  className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
>
  <option value="invalid_inquiry">❌ Invalid or Irrelevant Inquiry</option>
  <option value="not_interested">🙅 Customer Not Interested</option>
  <option value="price_too_high">💰 Quotation Rejected – Price Too High</option>
  <option value="delivery_not_feasible">🚚 Delivery Location Not Feasible</option>
  <option value="fulfilled_by_other">🏢 Order Fulfilled by Another Vendor</option>
  <option value="order_confirmed">✅ Order Confirmed – Proceeding with Processing</option>
</select>
                  <input
                    type="date"
                    value={formData.nextFollowUpDate}
                    onChange={(e) => handleFollowUpFormChange(c._id, 'nextFollowUpDate', e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                    placeholder="Next date"
                  />
                  <textarea
                    value={formData.notes}
                    onChange={(e) => handleFollowUpFormChange(c._id, 'notes', e.target.value)}
                    rows="2"
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                    placeholder="Notes..."
                  />
                  <div className="flex gap-1">
                    <button
                      onClick={() => {
                        if (editingId) {
                          handleUpdateFollowUp(c._id, editingId);
                        } else {
                          handleAddFollowUp(c._id);
                        }
                      }}
                      className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      {editingId ? 'Update' : 'Save'}
                    </button>
                    <button
                      onClick={() => cancelFollowUpForm(c._id)}
                      className="px-2 py-1 text-xs bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Follow-up history list */}
{showForm && customerFollowUps.length > 0 && (
  <div className="mt-2 max-h-32 overflow-y-auto space-y-1">
    {customerFollowUps.map((followUp) => (
      <div key={followUp._id} className="flex items-start justify-between text-xs p-1 bg-white rounded border border-gray-100">
        <div className="flex-1">
          <span className={`px-1 py-0.5 text-xs rounded-full border ${getFollowUpStatusColor(followUp.status)}`}>
            {getFollowUpStatusLabel(followUp.status)}
          </span>
          {followUp.notes && (
            <span className="ml-1 text-gray-600">{followUp.notes.substring(0, 30)}</span>
          )}
          {followUp.nextFollowUpDate && (
            <span className="ml-1 text-blue-500 text-xs">
              📅 {new Date(followUp.nextFollowUpDate).toLocaleDateString()}
            </span>
          )}
          {followUp.addedBy && (
            <span className="ml-1 text-gray-400 text-xs">
              by {followUp.addedBy.name}
            </span>
          )}
        </div>
        <div className="flex gap-1 ml-1">
          <button
            onClick={() => handleEditFollowUp(c._id, followUp)}
            className="text-blue-500 hover:text-blue-700"
          >
            ✏️
          </button>
          <button
            onClick={() => handleDeleteFollowUp(c._id, followUp._id)}
            className="text-red-500 hover:text-red-700"
          >
            🗑️
          </button>
        </div>
      </div>
    ))}
  </div>
)}
            
            {/* Pagination for follow-ups */}
            {showForm && totalPages > 1 && (
              <div className="flex gap-1 mt-1 justify-center">
                <button
                  onClick={() => fetchFollowUps(c._id, currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-2 py-0.5 text-xs bg-gray-200 rounded disabled:opacity-50"
                >
                  ◀
                </button>
                <span className="text-xs text-gray-500">
                  {currentPage}/{totalPages}
                </span>
                <button
                  onClick={() => fetchFollowUps(c._id, currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-2 py-0.5 text-xs bg-gray-200 rounded disabled:opacity-50"
                >
                  ▶
                </button>
              </div>
            )}
            
            {isLoading && <span className="text-xs text-gray-400">Loading...</span>}
          </div>
        </td>
        
       {/* REMARKS COLUMN - Inline editable */}
<td className="p-3 border">
  <div className="flex flex-col gap-1">
    {editingRemarks === c._id ? (
      <div className="flex flex-col gap-1">
        <textarea
          value={remarksData[c._id] || ''}
          onChange={(e) => {
            setRemarksData(prev => ({
              ...prev,
              [c._id]: e.target.value
            }));
          }}
          rows="2"
          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
          placeholder="Enter remarks..."
          autoFocus
        />
        <div className="flex gap-1">
          <button
            onClick={() => handleSaveRemarks(c._id)}
            className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
          >
            Save
          </button>
          <button
            onClick={() => {
              setEditingRemarks(null);
              setRemarksData(prev => ({
                ...prev,
                [c._id]: c.remarks || ''
              }));
            }}
            className="px-2 py-1 text-xs bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
          >
            Cancel
          </button>
        </div>
      </div>
    ) : (
      <div 
        onClick={() => {
          setEditingRemarks(c._id);
          setRemarksData(prev => ({
            ...prev,
            [c._id]: c.remarks || ''
          }));
        }}
        className="cursor-pointer hover:bg-gray-100 p-1 rounded min-h-[40px] flex items-center"
      >
        {c.remarks ? (
          <span className="text-sm text-gray-700 line-clamp-2">{c.remarks}</span>
        ) : (
          <span className="text-gray-400 text-sm">Click to add remarks</span>
        )}
      </div>
    )}
  </div>
</td>
      </tr>
    );
  })}
  {customers.length === 0 && (
    <tr>
      <td colSpan={11} className="text-center p-6 text-gray-500">
        No Potential customers found.
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
