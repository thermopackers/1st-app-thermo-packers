import { useState, useEffect, useRef } from "react";
import axiosInstance from "../axiosInstance";
import { motion, AnimatePresence } from "framer-motion";
import * as XLSX from "xlsx";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";

export default function ProductCustomerSearch() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [categories, setCategories] = useState([]);
  const detailsPanelRef = useRef(null);

  // Scroll to top when supplier is selected
  useEffect(() => {
    if (selectedProduct && detailsPanelRef.current) {
      // Scroll to the top of the page
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
      
      // Also scroll the details panel into view
      detailsPanelRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  }, [selectedProduct]);

  // Fetch categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axiosInstance.get("/categories");
        setCategories(res.data);
      } catch (err) {
        console.error("Failed to load categories", err);
      }
    };
    fetchCategories();
  }, []);

// Unified search function
const handleUnifiedSearch = async (query) => {
  if (!query.trim()) {
    setShowResults(false);
    setSearchResults([]);
    setSelectedProduct(null);
    return;
  }

  setLoading(true);
  try {
    // Search for products (both purchase and sales) AND customers
    const [purchaseRes, salesRes, customersRes] = await Promise.all([
      axiosInstance.get(`/purchase-products?search=${query}&limit=10`),
      axiosInstance.get(`/products-multer?search=${query}&limit=10`),
      axiosInstance.get(`/customers?search=${query}&limit=10`) // ADD THIS LINE
    ]);

    const purchaseProducts = purchaseRes.data.data || [];
    const salesProducts = salesRes.data.products || [];
    const customers = customersRes.data.customers || []; // ADD THIS LINE

        // Find matching categories for suppliers
    const matchingCategories = categories.filter(cat => 
      cat.name.toLowerCase().includes(query.toLowerCase())
    );

    let suppliers = [];
    
    // 1️⃣ First: Search suppliers by name, company, phone, email directly
    try {
      const directSupplierRes = await axiosInstance.get(`/suppliers?search=${query}&limit=10`);
      const directSuppliers = directSupplierRes.data.data || [];
      suppliers = [...directSuppliers];
    } catch (err) {
      console.error("Error searching suppliers directly:", err);
    }
    
    // 2️⃣ Second: Also fetch suppliers by matching categories
    if (matchingCategories.length > 0) {
      try {
        const supplierPromises = matchingCategories.map(category =>
          axiosInstance.get(`/suppliers?category=${encodeURIComponent(category.name)}&limit=10`)
        );
        
        const supplierResults = await Promise.all(supplierPromises);
        const categorySuppliers = supplierResults.flatMap(res => res.data.data || []);
        
        // Merge with existing suppliers
        suppliers = [...suppliers, ...categorySuppliers];
        
        // Remove duplicates based on supplier ID
        suppliers = suppliers.filter((supplier, index, self) =>
          index === self.findIndex(s => s._id === supplier._id)
        );
      } catch (err) {
        console.error("Error fetching suppliers by category:", err);
      }
    }

  // Define dashboard pages with their routes and icons
const dashboardPages = [
  { name: "Sales Orders", route: "/orders", icon: "📦", category: "Orders" },
  { name: "Add Sales Order", route: "/add-order", icon: "➕", category: "Orders" },
  { name: "Tasks", route: "/my-tasks", icon: "✅", category: "Tasks" },
  { name: "Task Dashboard", route: "/task-dashboard", icon: "👥", category: "Tasks" },
  { name: "Assets", route: "/my-assets", icon: "💼", category: "Assets" },
  { name: "Issue Assets", route: "/issue-asset", icon: "🎁", category: "Assets" },
  { name: "Manage Assets", route: "/asset-management", icon: "🛠️", category: "Assets" },
  { name: "Dispatch Plan", route: "/assign-dispatch", icon: "📋", category: "Vehicles" },
  { name: "Vehicle Mileage", route: "/mileage-chart", icon: "📊", category: "Vehicles" },
  { name: "Vehicles Documents", route: "/registered-vehicles", icon: "📄", category: "Vehicles" },
  { name: "Material Requisition", route: "/material-requisition", icon: "📝", category: "Materials" },
  { name: "Requisition Slips", route: "/requisition-slips", icon: "📑", category: "Materials" },
  { name: "Quotation", route: "/proforma-invoice", icon: "✨", category: "Sales" },
  { name: "View Quotations", route: "/proforma-dashboard", icon: "📊", category: "Sales" },
  { name: "Products", route: "/all-products", icon: "📋", category: "Products" },
  { name: "Add Product", route: "/add-product", icon: "➕", category: "Products" },
  { name: "Customers", route: "/customers", icon: "📊", category: "Customers" },
  { name: "Add Customer", route: "/add-customer", icon: "➕", category: "Customers" },
  { name: "HR Management", route: "/register-user", icon: "👥", category: "HR" },
  { name: "Leave Management", route: "/leave-management", icon: "📋", category: "HR" },
  { name: "Attendance", route: "/attendance-logs", icon: "📊", category: "HR" },
  { name: "Tour Expenses", route: "/tour-expenses", icon: "➕", category: "Finance" },
  { name: "View Tour Expenses", route: "/tour-expenses-dashboard", icon: "📊", category: "Finance" },
  { name: "Incoming Payments", route: "/payment-records", icon: "📥", category: "Finance" },
  { name: "Outgoing Payments", route: "/outgoing-payment", icon: "📤", category: "Finance" },
  { name: "Important Numbers", route: "/important-numbers", icon: "📱", category: "Contacts" },
  { name: "Plant Maintenance", route: "/plant-machinery-maintenance", icon: "🔧", category: "Maintenance" },
  { name: "Drawing Upload", route: "/drawing-upload-form", icon: "📝", category: "Suppliers" },
  { name: "View Orders", route: "/drawing-orders-table", icon: "📊", category: "Suppliers" },
  { name: "Admin Panel", route: "/admin-dashboard", icon: "⚙️", category: "Admin" },
  { name: "Production Dashboard", route: "/production-dashboard", icon: "🏭", category: "Production" },
  { name: "Dana Beads", route: "/dana-beads-dashboard", icon: "●", category: "Production" },
  { name: "CNC Dashboard", route: "/cnc-dashboard", icon: "⚡", category: "Production" },
  { name: "Dispatch Dashboard", route: "/dispatch-dashboard", icon: "🚛", category: "Production" },
  { name: "Packaging Dashboard", route: "/packaging-dashboard", icon: "📦", category: "Production" },
  { name: "Record Gate Inwards", route: "/guard-entry", icon: "📝", category: "Security" },
    { name: "Purchase Product Suppliers", route: "/purchase-products-suppliers", icon: "👥", category: "Supplier" },
  { name: "Goods Inwards", route: "/guard-entries-view", icon: "📋", category: "Security" },
  { name: "My Dispatch Plans", route: "/my-plans", icon: "📋", category: "Driver" },
  { name: "Gate Outward", route: "/gate-outward", icon: "📤", category: "Security" },
  { name: "View Gate Outwards", route: "/gate-outwards-view", icon: "📋", category: "Security" },
  { name: "Campaigns - WhatsApp", route: "/campaigns/new/whatsapp", icon: "💬", category: "Marketing" },
  { name: "Campaigns - Email", route: "/campaigns/new/email", icon: "✉️", category: "Marketing" },
  { name: "Monitor Campaigns", route: "/campaigns", icon: "📑", category: "Marketing" },
  { name: "Password Manager", route: "/password-manager", icon: "🔐", category: "Tools" },
  { name: "Outward Freight Calculator", route: "/freight-calculator", icon: "🚚", category: "Vehicles" },
  { name: "Tour Planning", route: "/tour-planning", icon: "🗺️", category: "Sales" },
  { name: "Customer Gifts", route: "/customer-gifts", icon: "🎁", category: "Customers" },
  { name: "Issue Gifts", route: "/customers", icon: "🎁", category: "Customers" }, // Points to customers page with gift functionality
  { name: "Guard Attendance", route: "/guard-attendance", icon: "📸", category: "Security" },
  { name: "Guard Attendance History", route: "/guard-attendance-history", icon: "📊", category: "Security" },
  { name: "Factory Attendance", route: "/factory-attendance-logs", icon: "📊", category: "HR" }
];

    // Filter pages based on search query
    const matchingPages = dashboardPages.filter(page =>
      page.name.toLowerCase().includes(query.toLowerCase()) ||
      page.category.toLowerCase().includes(query.toLowerCase())
    );

    // Combine all results
    const results = [
      // Dashboard pages - navigate directly
      ...matchingPages.map(page => ({
        _id: `page-${page.route}`,
        type: 'page',
        id: page.route,
        name: page.name,
        route: page.route,
        icon: page.icon,
        category: page.category,
        action: 'navigate',
        rawData: page
      })),
      // Purchase products - quick edit
      ...purchaseProducts.map(p => ({
        _id: p._id || `purchase-${Date.now()}`,
        type: 'purchase',
        id: p._id,
        name: safeString(p.name, 'Unnamed Product'),
        unit: safeString(p.unit),
        price: typeof p.price === 'number' ? p.price : safeString(p.price),
        rawData: p,
        action: 'quick-edit'
      })),
      // Sales products - quick edit
      ...salesProducts.map(p => ({
        _id: p._id || `sales-${Date.now()}`,
        type: 'sales',
        id: p._id,
        name: safeString(p.name, 'Unnamed Product'),
        unit: safeString(p.unit),
        price: typeof p.price === 'number' ? p.price : safeString(p.price),
        rawData: p,
        action: 'quick-edit'
      })),
      // ADD CUSTOMERS - show details
      ...customers.map(c => ({
        _id: c._id || `customer-${Date.now()}`,
        type: 'customer',
        id: c._id,
        name: safeString(c.name, 'Unnamed Customer'),
        customerName: safeString(c.name, 'Unnamed Customer'), // For consistency
        company: safeString(c.company, 'URP'),
        phone: safeString(c.phone),
        email: safeString(c.email),
        address: safeString(c.address),
        locationLink: safeString(c.locationLink),
        instructions: safeString(c.instructions),
        rawData: c,
        action: 'show-details'
      })),
      // Suppliers - show details
      ...suppliers.map(s => ({
        _id: s._id || `supplier-${Date.now()}`,
        type: 'supplier',
        id: s._id,
        name: safeString(s.name, 'Unnamed Supplier'),
        vendorCategory: Array.isArray(s.vendorCategory) ? s.vendorCategory : [s.vendorCategory].filter(Boolean),
        phone: safeString(s.phone),
        phone2: safeString(s.phone2),
        email: safeString(s.email),
        address: safeString(s.address),
        gstNumber: safeString(s.gstNumber),
        locationLink: safeString(s.locationLink),
        accountName: safeString(s.accountName),
        bankName: safeString(s.bankName),
        accountNumber: safeString(s.accountNumber),
        ifscCode: safeString(s.ifscCode),
        rawData: s,
        action: 'show-details',
        // Add category info for display
        matchedCategory: matchingCategories.find(cat => 
          Array.isArray(s.vendorCategory) 
            ? s.vendorCategory.includes(cat.name)
            : s.vendorCategory === cat.name
        )?.name
      }))
    ];

    setSearchResults(results);
    setShowResults(true);
  } catch (err) {
    console.error("Search error:", err);
    Swal.fire({
      title: "Search Error",
      text: "Failed to search products",
      icon: "error",
      confirmButtonColor: "#2563eb",
      background: "#f8fafc",
      customClass: {
        popup: "rounded-2xl",
      },
    });
  } finally {
    setLoading(false);
  }
};

  // Helper function to safely get string values
  const safeString = (value, defaultValue = "") => {
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return value.toString();
    return defaultValue;
  };

const handleItemSelect = async (item) => {
  if (item.action === 'navigate') {
    // Navigate to dashboard page
    navigate(item.route);
    setShowResults(false);
    setSearchQuery("");
  } else if (item.action === 'quick-edit') {
    // Quick edit behavior - navigate directly to edit page
    if (item.type === "purchase") {
      navigate(`/purchase-products/edit/${item.id}`);
    } else {
      navigate(`/products/edit/${item.id}`);
    }
    setShowResults(false);
    setSearchQuery("");
  } else if (item.action === 'show-details') {
    // Show details behavior
    setSelectedProduct(item);
    setShowResults(false);
    setSearchQuery("");
    
    try {
      setLoading(true);
      
      if (item.type === 'sales') {
        // Fetch customers who have ordered this sales product
        const res = await axiosInstance.get(`/orders/product-customers/${encodeURIComponent(item.name)}`);
        
        // Ensure customer data is properly formatted
        const customers = Array.isArray(res.data) ? res.data : [];
        const formattedCustomers = customers.map(customer => ({
          _id: customer._id || `customer-${Date.now()}`,
          customerName: safeString(customer.customerName, 'Unknown Customer'),
          company: safeString(customer.company, 'URP'),
          phone: safeString(customer.phone, '-'),
          email: safeString(customer.email, '-'),
          address: safeString(customer.address, '-'),
          locationLink: safeString(customer.locationLink),
          instructions: safeString(customer.instructions),
          totalOrders: typeof customer.totalOrders === 'number' ? customer.totalOrders : 0,
          lastPrice: typeof customer.lastPrice === 'number' ? customer.lastPrice : safeString(customer.lastPrice),
          lastOrderDate: customer.lastOrderDate ? new Date(customer.lastOrderDate).toISOString() : null
        }));
        
        setSearchResults(formattedCustomers);
      } else if (item.type === 'customer') {
        // For customers, show the customer details directly
        setSearchResults([item]);
      } else if (item.type === 'purchase' || item.type === 'supplier') {
        // For purchase products or suppliers, show the item itself
        setSearchResults([item]);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      Swal.fire({
        title: "Error",
        text: "Failed to fetch data",
        icon: "error",
        confirmButtonColor: "#2563eb",
      });
    } finally {
      setLoading(false);
    }
  }
};

  const exportToExcel = () => {
    if (!selectedProduct || searchResults.length === 0 || selectedProduct.type !== 'sales') return;

    try {
      const worksheetData = [
        ["Customer Name", "Company", "Phone", "Email", "Address", "Location", "Instructions", "Total Orders", "Last Order Date", "Last Price"],
        ...searchResults.map(customer => [
          safeString(customer.customerName),
          safeString(customer.company, "URP"),
          safeString(customer.phone, "-"),
          safeString(customer.email, "-"),
          safeString(customer.address, "-"),
          safeString(customer.locationLink, "-"),
          safeString(customer.instructions, "-"),
          customer.totalOrders || 0,
          customer.lastOrderDate ? new Date(customer.lastOrderDate).toLocaleDateString() : "-",
          customer.lastPrice ? `₹${customer.lastPrice}` : "-"
        ])
      ];

      const ws = XLSX.utils.aoa_to_sheet(worksheetData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Customers");

      const colWidths = [
        { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 25 }, 
        { wch: 30 }, { wch: 30 }, { wch: 30 }, { wch: 12 }, 
        { wch: 15 }, { wch: 12 }
      ];
      ws['!cols'] = colWidths;

      XLSX.writeFile(wb, `${selectedProduct.name}_customers.xlsx`);
    } catch (error) {
      console.error("Export error:", error);
      Swal.fire({
        title: "Export Error",
        text: "Failed to export data",
        icon: "error",
        confirmButtonColor: "#2563eb",
      });
    }
  };

  const resetSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setSelectedProduct(null);
    setShowResults(false);
  };

// Safe render functions
const renderSearchResultItem = (item) => {
  const name = safeString(item.name);
  const unit = safeString(item.unit);
  const price = item.price;
  const category = Array.isArray(item.vendorCategory) ? item.vendorCategory.join(', ') : safeString(item.vendorCategory);
  const matchedCategory = item.matchedCategory;

  // Determine display text based on type
  const typeDisplay = 
    item.type === 'purchase' ? 'Purchase Product' : 
    item.type === 'sales' ? 'Sales Product' : 
    item.type === 'customer' ? 'Customer' : 
    item.type === 'supplier' ? 'Supplier' :
    'Dashboard Page';

  const typeColor = 
    item.type === 'purchase' ? 'text-green-600' : 
    item.type === 'sales' ? 'text-purple-600' : 
    item.type === 'customer' ? 'text-blue-600' : 
    item.type === 'supplier' ? 'text-orange-600' :
    'text-indigo-600';

  return (
    <div className="flex justify-between items-start">
      <div>
        <h5 className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors flex items-center gap-2">
          {item.icon && <span>{item.icon}</span>}
          {name}
        </h5>
        <p className="text-sm text-gray-600 mt-1">
          {unit && `${unit} • `}
          <span className={`font-medium ml-1 ${typeColor}`}>
            {typeDisplay}
          </span>
          {price && (
            <span className="ml-2 text-blue-600 font-bold">
              {typeof price === 'number' ? `₹${price}` : `₹${safeString(price)}`}
            </span>
          )}
          {item.category && item.type === 'page' && (
            <span className="ml-2 text-gray-500">• {item.category}</span>
          )}
        </p>
        {(category || matchedCategory) && (
          <p className="text-xs text-gray-500 mt-1">
            Category: {matchedCategory || category}
          </p>
        )}
        {item.type === 'customer' && item.phone && (
          <p className="text-xs text-gray-500 mt-1">
            Phone: {safeString(item.phone)}
          </p>
        )}
        <p className="text-xs text-gray-400 mt-1">
          {item.action === 'quick-edit' ? 'Click to edit →' : 
           item.action === 'navigate' ? 'Click to navigate →' : 
           'Click for details →'}
        </p>
      </div>
    </div>
  );
};

 const renderResultDetails = (item) => {
  if (selectedProduct && (selectedProduct.type === 'supplier' || selectedProduct.type === 'purchase')) {
    const vendorCategory = Array.isArray(item.vendorCategory) ? item.vendorCategory.join(', ') : safeString(item.vendorCategory);
    
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <h5 className="font-semibold text-gray-900 text-lg mb-2">
            {safeString(item.name)}
          </h5>
          <div className="space-y-1 text-sm text-gray-600">
            <p><span className="font-medium">Type:</span> {item.type === 'supplier' ? 'Supplier' : 'Purchase Product'}</p>
            {vendorCategory && (
              <p><span className="font-medium">Category:</span> {vendorCategory}</p>
            )}
            {item.phone && (
              <p><span className="font-medium">Phone:</span> {safeString(item.phone)}</p>
            )}
            {item.email && (
              <p><span className="font-medium">Email:</span> {safeString(item.email)}</p>
            )}
            {item.gstNumber && (
              <p><span className="font-medium">GST:</span> {safeString(item.gstNumber)}</p>
            )}
          </div>
        </div>
        
        <div className="space-y-1 text-sm text-gray-600">
          {item.address && (
            <p><span className="font-medium">Address:</span> {safeString(item.address)}</p>
          )}
          {item.locationLink && (
            <p>
              <span className="font-medium">Location:</span>{" "}
              <a 
                href={safeString(item.locationLink)} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                View on Map
              </a>
            </p>
          )}
          {item.accountName && (
            <p><span className="font-medium">Account Name:</span> {safeString(item.accountName)}</p>
          )}
          {item.bankName && (
            <p><span className="font-medium">Bank:</span> {safeString(item.bankName)}</p>
          )}
        </div>
      </div>
    );
  } else {
    // Customer display - ADD VIEW ORDERS BUTTON
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <h5 className="font-semibold text-gray-900 text-lg mb-2">
            {safeString(item.customerName, 'Unknown Customer')}
          </h5>
          <div className="space-y-1 text-sm text-gray-600">
            <p><span className="font-medium">GST:</span> {safeString(item.company, "URP")}</p>
            <p><span className="font-medium">Phone:</span> {safeString(item.phone, "-")}</p>
            <p><span className="font-medium">Email:</span> {safeString(item.email, "-")}</p>
            <p><span className="font-medium">Total Orders:</span> {item.totalOrders || 0}</p>
            {item.lastPrice && (
              <p><span className="font-medium">Last Price:</span> ₹{safeString(item.lastPrice)}</p>
            )}
          </div>
          
          {/* ADD THIS BUTTON */}
          <motion.button
            onClick={() => navigate(`/orders?customer=${encodeURIComponent(item.customerName)}`)}
            className="mt-3 bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-all duration-300 flex items-center gap-2"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span>📋</span>
            View All Orders
          </motion.button>
        </div>
        
        <div className="space-y-1 text-sm text-gray-600">
          <p><span className="font-medium">Address:</span> {safeString(item.address, "-")}</p>
          {item.locationLink && (
            <p>
              <span className="font-medium">Location:</span>{" "}
              <a 
                href={safeString(item.locationLink)} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                View on Map
              </a>
            </p>
          )}
          {item.instructions && (
            <p>
              <span className="font-medium">Instructions:</span> {safeString(item.instructions)}
            </p>
          )}
          {item.lastOrderDate && (
            <p>
              <span className="font-medium">Last Ordered:</span>{" "}
              {new Date(item.lastOrderDate).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>
    );
  }
};

  return (
    <>
      {/* Unified Search Bar */}
      <motion.div
        className="sticky top-14 md:top-20 z-40 bg-white/95 backdrop-blur-md shadow-lg py-4 px-4 border-b border-gray-200"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <input
                type="text"
placeholder="🔍 Search pages, products, suppliers, or categories..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  handleUnifiedSearch(e.target.value);
                }}
                className="w-full border-2 border-gray-200 rounded-2xl px-6 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-white/80 backdrop-blur-sm"
              />
              {loading && (
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
          </div>
          
          {/* Search Info */}
      {/* <div className="mt-2 text-xs text-gray-500 flex items-center gap-2">
  <span>💡</span>
  <span>Search for dashboard pages, customers, products, suppliers, or categories. Click pages to navigate, products to edit, suppliers for details.</span>
</div> */}
        </div>
      </motion.div>

      {/* Unified Search Results */}
      <AnimatePresence>
        {showResults && (
          <motion.div
            className="fixed inset-x-0 top-32 z-50 max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl border border-gray-200 max-h-96 overflow-y-auto"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-800 text-lg">
                  Search Results
                </h3>
                <button
                  onClick={() => setShowResults(false)}
                  className="text-gray-500 hover:text-gray-700 transition-colors p-2 rounded-full hover:bg-gray-100"
                >
                  ✕
                </button>
              </div>

              {searchResults.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">🔍</div>
                  <p className="text-gray-500">No results found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {searchResults.map((item) => (
                    <motion.div
                      key={`${item.type}-${item.id}`}
                      onClick={() => handleItemSelect(item)}
                      className="p-4 border border-gray-100 rounded-xl hover:bg-blue-50 cursor-pointer transition-all duration-300 group"
                      whileHover={{ x: 5 }}
                    >
                      {renderSearchResultItem(item)}
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Detailed Results Panel with ref for scrolling */}
      {selectedProduct && (
        <motion.div 
          ref={detailsPanelRef}
          className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-100 mx-4 mt-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <span className="text-2xl">📊</span>
              {selectedProduct.type === 'supplier' ? 'Supplier Details' : 
               selectedProduct.type === 'purchase' ? 'Purchase Product Details' : 
               'Customer Information'}
            </h3>
            
            <div className="flex items-center gap-3">
              {selectedProduct.type === 'sales' && searchResults.length > 0 && (
                <motion.button
                  onClick={exportToExcel}
                  className="bg-green-600 text-white px-4 py-2 rounded-xl font-semibold shadow-lg hover:bg-green-700 transition-all duration-300 flex items-center gap-2"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span>📊</span>
                  Export to Excel
                </motion.button>
              )}
              
              <button
                onClick={resetSearch}
                className="text-gray-500 hover:text-gray-700 text-sm font-medium flex items-center gap-1 px-3 py-2 rounded-lg hover:bg-gray-100"
              >
                ✕ Clear Search
              </button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-gray-600">Loading data...</p>
            </div>
          ) : searchResults.length > 0 ? (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {searchResults.map((item, index) => (
                <motion.div
                  key={item._id || index}
                  className="bg-gray-50 rounded-xl p-4 border border-gray-200"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  {renderResultDetails(item)}
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-gray-50 rounded-xl">
              <div className="text-4xl mb-2">😔</div>
              <p className="text-gray-600">No data found.</p>
            </div>
          )}
        </motion.div>
      )}
    </>
  );
}