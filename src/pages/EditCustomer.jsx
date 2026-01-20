import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import axiosInstance from "../axiosInstance";
import InternalNavbar from "../components/InternalNavbar";
import toast from "react-hot-toast";
import { useUserContext } from "../context/UserContext";
const INDIAN_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh",
  "Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka",
  "Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram",
  "Nagaland","Odisha","Rajasthan","Sikkim","Tamil Nadu","Telangana",
  "Tripura","Uttar Pradesh","Uttarakhand","West Bengal",
  "Andaman and Nicobar Islands","Chandigarh","Dadra and Nagar Haveli and Daman and Diu",
  "Delhi","Jammu and Kashmir","Ladakh","Lakshadweep","Puducherry","Punjab"
];

export default function EditCustomer() {
  const location = useLocation();
  const {user} = useUserContext();
  const { id } = useParams();
  const navigate = useNavigate();
const [gstError, setGstError] = useState("");
const [loadingGifts, setLoadingGifts] = useState(false);
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [newFiles, setNewFiles] = useState([]);
  const [removedDocs, setRemovedDocs] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [frequentProducts, setFrequentProducts] = useState([]);
const [giftProducts, setGiftProducts] = useState([]);
const [showGiftForm, setShowGiftForm] = useState(false);
const [giftForm, setGiftForm] = useState({
  giftType: "",
  quantity: 1,
  notes: "",
});
  const [giftHistory, setGiftHistory] = useState([]);
  const [giftPage, setGiftPage] = useState(1);
  const [giftTotalPages, setGiftTotalPages] = useState(1);
  const [giftTotal, setGiftTotal] = useState(0);
  const [loadingGiftHistory, setLoadingGiftHistory] = useState(false);
  const giftLimit = 5; // Show 5 gifts per page
  const giftsSectionRef = useRef(null);
const [categories, setCategories] = useState([]);

// Add these new states
const [showSecurityChequeForm, setShowSecurityChequeForm] = useState(false);
const [showSamplesForm, setShowSamplesForm] = useState(false);
const [securityChequeForm, setSecurityChequeForm] = useState({
  amount: "",
  chequeFile: null,
  remarks: "",
});
const [samplesForm, setSamplesForm] = useState({
  sampleName: "",
  sampleFiles: [],
  remarks: "",
});
const [securityCheques, setSecurityCheques] = useState([]);
const [samples, setSamples] = useState([]);
// Add these for editing
const [editingSecurityChequeId, setEditingSecurityChequeId] = useState(null);
const [editingSampleId, setEditingSampleId] = useState(null);
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
    // Function to fetch paginated gift history
const fetchGiftHistory = async (page = 1) => {
  setLoadingGiftHistory(true);
  try {
    const res = await axiosInstance.get(`/customers/${id}/gifts`, {
      params: {
        page: page,
        limit: giftLimit
      }
    });
    
    if (res.data.success) {
      setGiftHistory(res.data.gifts || []);
      setGiftTotal(res.data.total);
      setGiftTotalPages(res.data.pages);
      setGiftPage(res.data.page);
    }
  } catch (err) {
    console.error("Failed to fetch gift history", err);
    toast.error("Failed to load gift history");
  } finally {
    setLoadingGiftHistory(false);
  }
};


useEffect(() => {
  async function fetchUsers() {
    try {
      const res = await axiosInstance.get("/users/all"); // Use the new route
      setAllUsers(res.data);
    } catch (err) {
      console.error("Failed to load sales users", err);
    }
  }

  fetchUsers();
}, []);

useEffect(() => {
  async function fetchCustomer() {
  try {
    const res = await axiosInstance.get(`/customers/${id}`);
    
    // ✅ Ensure createdBy is either an object or an ID string
    const customerData = res.data;
    
    // If createdBy is an object (populated by backend), extract just the ID
    if (customerData.createdBy && typeof customerData.createdBy === 'object' && customerData.createdBy._id) {
      customerData.createdBy = customerData.createdBy._id;
    }
    
    setCustomer(customerData);
    
    // ✅ Fetch frequently bought products here
    if (customerData.name) {
      const ordersRes = await axiosInstance.get(
        `/orders/customer-summary/${encodeURIComponent(customerData.name)}`
      );
      setFrequentProducts(ordersRes.data);
    }
    
    // ✅ Fetch all histories
    fetchGiftHistory();
    fetchSecurityCheques();  // ✅ NEW - Add this
    fetchSamples();          // ✅ NEW - Add this
    
  } catch (err) {
    if (err.response?.status === 404) {
      toast.error("Customer not found or deleted");
      navigate("/customers");
    } else {
      toast.error("Failed to load customer");
    }
  } finally {
    setLoading(false);
  }
}

  fetchCustomer();
}, [id, navigate]);

// Refresh gift history when a new gift is added
useEffect(() => {
  if (customer) {
    fetchGiftHistory(giftPage);
  }
}, [customer?.giftHistory?.length]); // Refresh when gift history length changes

useEffect(() => {
  async function fetchGiftProducts() {
    setLoadingGifts(true);
    try {
      const res = await axiosInstance.get("/purchase-products/purchase-products-all", {
        params: { isGiftItem: true }
      });
      setGiftProducts(res.data || []);
    } catch (err) {
      console.error("Failed to load gift products", err);
      toast.error("Failed to load gift products");
    } finally {
      setLoadingGifts(false);
    }
  }
  fetchGiftProducts();
}, []);

useEffect(() => {
  if (!customer) return;
  
  console.log("Checking for #gifts hash:", window.location.hash);
  console.log("Customer loaded:", customer.name);
  
  // Check if URL has #gifts hash
  if (window.location.hash === '#gifts') {
    console.log("Found #gifts hash, preparing to scroll...");
    
    // Remove the hash from URL without reloading
    window.history.replaceState(null, null, window.location.pathname + window.location.search);
    
    // Wait a bit longer to ensure everything is rendered
    const scrollTimer = setTimeout(() => {
      console.log("Attempting to scroll to gifts section...");
      
      if (giftsSectionRef.current) {
        console.log("Found gifts section ref, scrolling...");
        giftsSectionRef.current.scrollIntoView({ 
          behavior: 'smooth',
          block: 'start'
        });
      } else {
        console.error("giftsSectionRef is null!");
        
        // Try alternative: scroll to the gift management div by ID
        const giftSection = document.getElementById('gift-management-section');
        if (giftSection) {
          console.log("Found gift section by ID, scrolling...");
          giftSection.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
          });
        } else {
          console.error("Could not find gift section by ID either");
        }
      }
    }, 100); // Increased delay to 800ms for more reliability
    
    return () => clearTimeout(scrollTimer);
  }
}, [customer, location]);

const handleChange = (e) => {
  const { name, value } = e.target;

  if (name === "company") {
    if (value.length !== 15) {
      setGstError("GST number must be exactly 15 characters.");
    } else {
      setGstError("");
    }
  }

setCustomer((prev) => ({
  ...prev,
  [name]: value,
  ...(name === "state" && { inPunjab: value === "Punjab" }),
}));
};


  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setNewFiles((prev) => [...prev, ...files]);
  };

  const handleRemoveExistingDoc = (url) => {
    setRemovedDocs((prev) => [...prev, url]);
    setCustomer((prev) => ({
      ...prev,
      gstDocs: prev.gstDocs?.filter((doc) => doc !== url),
    }));
  };

  const handleRemoveNewDoc = (index) => {
    setNewFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadToCloudinary = async (files) => {
    const uploads = files.map(async (file) => {
      const data = new FormData();
      data.append("file", file);
      data.append("upload_preset", "todo_uploads");
      data.append("cloud_name", "dcr8k5amk");

      const res = await fetch("https://api.cloudinary.com/v1_1/dcr8k5amk/upload", {
        method: "POST",
        body: data,
      });

      const result = await res.json();
      return result.secure_url;
    });

    return Promise.all(uploads);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
if (customer.company && customer.company !== "URP" && customer.company.length !== 15) {
  setGstError("GST number must be exactly 15 characters.");
  toast.error("GST number must be exactly 15 characters.");
  setSubmitting(false);
  return;
}
// 🔥 Auto-fill URN
if (!customer.company || customer.company.trim() === "") {
  customer.company = "URP";
}

    try {
      let uploadedUrls = [];
      if (newFiles.length > 0) {
        toast.loading("Uploading new documents...");
        uploadedUrls = await uploadToCloudinary(newFiles);
        toast.dismiss();
      }

      const updatedCustomer = {
        ...customer,
          createdBy: customer.createdBy, // ✅ ensure it's sent
        gstDocs: [...(customer.gstDocs || []), ...uploadedUrls],
      };

      await axiosInstance.put(`/customers/${id}`, updatedCustomer);
      toast.success("Customer updated successfully");
      navigate("/customers");
   } catch (err) {
  console.error(err);

  const errorMsg =
    err.response?.data?.error ||
    err.response?.data?.message ||
    "Failed to update customer";

  toast.error(errorMsg);
} finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this customer?")) return;
    setDeleting(true);

    try {
      await axiosInstance.delete(`/customers/${id}`);
      toast.success("Customer deleted successfully!");
      navigate("/customers");
    } catch (err) {
      toast.error("Failed to delete customer");
    } finally {
      setDeleting(false);
    }
  };

  // Function to fetch security cheques
const fetchSecurityCheques = async () => {
  try {
    const res = await axiosInstance.get(`/customers/${id}/security-cheques`);
    if (res.data.success) {
      setSecurityCheques(res.data.securityCheques || []);
    }
  } catch (err) {
    console.error("Failed to fetch security cheques", err);
  }
};

// Function to fetch samples
const fetchSamples = async () => {
  try {
    const res = await axiosInstance.get(`/customers/${id}/samples`);
    if (res.data.success) {
      setSamples(res.data.samples || []);
    }
  } catch (err) {
    console.error("Failed to fetch samples", err);
  }
};

// Add after handleDelete function

// Security Cheque Handlers - UPDATED WITH BETTER DEBUGGING
const handleDeleteSecurityCheque = async (chequeId) => {
  console.log("=== DELETE SECURITY CHEQUE START ===");
  console.log("Cheque ID to delete:", chequeId);
  console.log("Cheque ID type:", typeof chequeId);
  console.log("Customer ID:", id);
  console.log("User:", user);
  
  if (!chequeId) {
    toast.error("Invalid cheque ID");
    console.error("No cheque ID provided");
    return;
  }

  if (!window.confirm("Are you sure you want to delete this security cheque?")) {
    console.log("Delete cancelled by user");
    return;
  }

  try {
    console.log("Sending DELETE request to:", `/customers/${id}/security-cheque/${chequeId}`);
    
    // Test with a simple GET first to check if route exists
    console.log("Testing route existence...");
    try {
      const testRes = await axiosInstance.get(`/customers/${id}/security-cheques`);
      console.log("GET security-cheques works:", testRes.status);
    } catch (testErr) {
      console.error("GET security-cheques failed:", testErr.response?.status, testErr.message);
    }
    
    // Now try DELETE
    const response = await axiosInstance.delete(`/customers/${id}/security-cheque/${chequeId}`);
    console.log("DELETE Response:", response);
    console.log("Response data:", response.data);
    console.log("Response status:", response.status);
    
    toast.success("Security cheque deleted successfully!");
    
    // Refresh the security cheques list
    fetchSecurityCheques();
    
  } catch (err) {
    console.error("=== DELETE SECURITY CHEQUE ERROR ===");
    console.error("Full error:", err);
    console.error("Error response:", err.response);
    console.error("Error status:", err.response?.status);
    console.error("Error data:", err.response?.data);
    console.error("Error message:", err.message);
    console.error("Error config:", err.config);
    
    if (err.response?.status === 404) {
      toast.error("Security cheque not found or route doesn't exist");
    } else if (err.response?.status === 401) {
      toast.error("Authentication failed. Please login again.");
    } else if (err.response?.status === 500) {
      toast.error("Server error. Please try again.");
    } else {
      toast.error(err.response?.data?.error || "Failed to delete security cheque");
    }
  }
  
  console.log("=== DELETE SECURITY CHEQUE END ===");
};

// Samples Handlers - UPDATED WITH BETTER LOGGING
const handleDeleteSample = async (sampleId) => {
  console.log("=== FRONTEND: DELETE SAMPLE START ===");
  console.log("Sample ID to delete:", sampleId);
  console.log("Sample ID type:", typeof sampleId);
  console.log("Customer ID from params:", id);
  console.log("Current samples in state:", samples.length);
  
  // Log the specific sample we're trying to delete
  const sampleToDelete = samples.find(s => s._id?.toString() === sampleId);
  console.log("Sample to delete from state:", sampleToDelete);
  
  if (!sampleId) {
    toast.error("Invalid sample ID");
    console.error("No sample ID provided");
    return;
  }

  if (!window.confirm("Are you sure you want to delete this sample?")) {
    console.log("Delete cancelled by user");
    return;
  }

  try {
    console.log(`Sending DELETE to: /customers/${id}/sample/${sampleId}`);
    
    // First, verify the sample exists via API
    console.log("Verifying sample exists via API...");
    try {
      const debugRes = await axiosInstance.get(`/customers/${id}/samples-debug`);
      const sampleExists = debugRes.data.samples?.some(s => s.id === sampleId);
      console.log("Sample exists according to API?", sampleExists);
      console.log("All sample IDs from API:", debugRes.data.samples?.map(s => s.id));
    } catch (debugErr) {
      console.warn("Debug API failed, continuing anyway:", debugErr.message);
    }
    
    // Now try the delete
    const response = await axiosInstance.delete(`/customers/${id}/sample/${sampleId}`);
    console.log("DELETE Response received:");
    console.log("- Status:", response.status);
    console.log("- Data:", response.data);
    console.log("- Success?", response.data.success);
    
    if (response.data.success) {
      toast.success("Sample deleted successfully!");
      
      // Refresh the samples list
      console.log("Refreshing samples list...");
      fetchSamples();
    } else {
      toast.error(response.data.error || "Failed to delete sample");
    }
    
  } catch (err) {
    console.error("=== FRONTEND: DELETE SAMPLE ERROR ===");
    console.error("Error object:", err);
    console.error("Error response:", err.response);
    console.error("Error status:", err.response?.status);
    console.error("Error data:", err.response?.data);
    console.error("Error message:", err.message);
    console.error("Request URL:", err.config?.url);
    
    if (err.response?.status === 404) {
      toast.error(`Sample not found: ${err.response?.data?.error || 'Sample does not exist'}`);
    } else if (err.response?.status === 401) {
      toast.error("Authentication failed. Please login again.");
    } else if (err.response?.status === 500) {
      toast.error("Server error: " + (err.response?.data?.error || 'Internal server error'));
    } else {
      toast.error(err.response?.data?.error || "Failed to delete sample");
    }
  }
  
  console.log("=== FRONTEND: DELETE SAMPLE END ===");
};

const handleEditSecurityCheque = (cheque) => {
  // Populate the security cheque form with existing data
  setSecurityChequeForm({
    amount: cheque.amount,
    chequeFile: cheque.chequeFile, // This will be a URL string
    remarks: cheque.remarks || "",
  });
  
  // Show the form and store the cheque ID for update
  setEditingSecurityChequeId(cheque._id);
  setShowSecurityChequeForm(true);
  
  // Scroll to the form
  setTimeout(() => {
    const formSection = document.getElementById('gift-management-section');
    if (formSection) {
      formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, 100);
};

const handleEditSample = (sample) => {
  // Populate the samples form with existing data
  setSamplesForm({
    sampleName: sample.sampleName,
    sampleFiles: sample.sampleFiles || [], // These will be URL strings
    remarks: sample.remarks || "",
  });
  
  // Show the form and store the sample ID for update
  setEditingSampleId(sample._id);
  setShowSamplesForm(true);
  
  // Scroll to the form
  setTimeout(() => {
    const formSection = document.getElementById('gift-management-section');
    if (formSection) {
      formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, 100);
};

const handleTestDeleteSecurityCheque = async (chequeId) => {
  try {
    console.log("Testing delete with simple route...");
    const response = await axiosInstance.delete(`/customers/${id}/security-cheque-test/${chequeId}`);
    console.log("Test DELETE response:", response.data);
    toast.success("Test DELETE works!");
  } catch (err) {
    console.error("Test DELETE error:", err);
    toast.error("Test DELETE failed: " + (err.response?.data?.error || err.message));
  }
};

  if (loading) return <p>Loading customer...</p>;
  if (!customer) return null;

  return (
    <>
      <InternalNavbar />
        <h2 className="text-2xl text-center py-2 font-bold">Edit Customer</h2>
<div className="flex flex-col lg:flex-row gap-6 max-w-7xl mx-auto p-6">

       
        {frequentProducts.length > 0 && (
  <div className="mt-6">
    <h3 className="text-lg font-semibold mb-2">Frequently Bought Products</h3>
    <div className="border rounded">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-100 text-left">
          <tr>
            <th className="px-3 py-2">Last Ordered</th>
            <th className="px-3 py-2">Product</th>
            <th className="px-3 py-2">Price</th>
            <th className="px-3 py-2">Remarks</th>
            <th className="px-3 py-2">Times Ordered</th>
          </tr>
        </thead>
        <tbody>
          {frequentProducts.map((item, idx) => (
            <tr key={idx} className="border-t">
<td className="px-3 py-2">
  {item.orderDate ? new Date(item.orderDate).toLocaleDateString() : "-"}
</td>
              <td className="px-3 py-2">{item.product}</td>
<td className="px-3 py-2 text-green-700 font-semibold">
  ₹{item.price}
  <span className="ml-1 text-xs text-gray-500">(last)</span>
</td>
              <td className="px-3 py-2">{item.remarks || "-"}</td>
              <td className="px-3 py-2">{item.timesOrdered}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
)}
 <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1 font-semibold">Name</label>
            <input
              type="text"
              name="name"
              value={customer.name || ""}
              onChange={handleChange}
              required
              className="w-full border p-2 rounded"
            />
          </div>

       <div>
  <label className="block mb-1 font-semibold">GST No. (Leave this field if no GST No. It will take URP automatically)</label>
  <input
    type="text"
    name="company"
    value={customer.company || ""}
    onChange={handleChange}
    className={`w-full border p-2 rounded ${
      gstError ? "border-red-500 focus:ring-red-400" : ""
    }`}
        placeholder={customer.company?.trim() === "" ? "URP (If no GST No.)" : "GST No."}

  />
  {gstError && <p className="text-red-500 text-sm mt-1">{gstError}</p>}
</div>


          <div>
            <label className="block mb-1 font-semibold">Phone</label>
            <input
              type="tel"
              name="phone"
              value={customer.phone || ""}
              onChange={handleChange}
              className="w-full border p-2 rounded"
            />
          </div>

          <div>
            <label className="block mb-1 font-semibold">Email</label>
            <input
              type="email"
              name="email"
              value={customer.email || ""}
              onChange={handleChange}
              className="w-full border p-2 rounded"
            />
          </div>

          <div>
            <label className="block mb-1 font-semibold">Address</label>
            <textarea
              name="address"
              value={customer.address || ""}
              onChange={handleChange}
              rows={3}
              className="w-full border p-2 rounded"
            />
          </div>
          <div>
  <label className="block mb-1 font-medium text-gray-700">"STATES & UNION TERRITORIES</label>
  <select
    name="state"
    value={customer.state}
    onChange={handleChange}
    className="w-full px-4 py-2 border border-gray-300 rounded-md"
  >
    <option value="">Select State</option>
    {INDIAN_STATES.map((s) => (
      <option key={s} value={s}>{s}</option>
    ))}
  </select>
</div>

<div>
  <label className="block mb-1 font-medium text-gray-700">NAME OF CITY/VILLAGE/ TOWN</label>
  <input
    name="city"
    value={customer.city}
    onChange={handleChange}
    className="w-full px-4 py-2 border border-gray-300 rounded-md"
  />
</div>

<div>
  <label className="block mb-1 font-medium text-gray-700">PIN CODE</label>
  <input
    name="pincode"
    value={customer.pincode}
    onChange={handleChange}
    maxLength={6}
    className="w-full px-4 py-2 border border-gray-300 rounded-md"
  />
</div>

   {(() => {
  // ✅ Use the same parseUserRoles logic as your dashboard
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
  
  // Show the field for anyone who is NOT a sales role
  return !userRoles.includes("sales");
})() && (
<div>
  <label className="block mb-1 font-semibold">Customer Handled/Managed by</label>
  <select
    name="createdBy"
    value={customer.createdBy || ""}
    onChange={(e) =>
      setCustomer((prev) => ({ ...prev, createdBy: e.target.value }))
    }
    className="w-full border p-2 rounded"
    required
  >
    <option value="">Select Sales Person</option>
    {allUsers.map((user) => (
      <option key={user._id} value={user._id}>
        {user.name} ({user.email})
      </option>
    ))}
  </select>
</div>)}

          <div>
            <label className="block mb-1 font-semibold">Google Maps Link</label>
            <input
              name="locationLink"
              value={customer.locationLink || ""}
              onChange={handleChange}
              placeholder="https://maps.google.com/..."
              className="w-full border p-2 rounded"
            />
          </div>
<div>
  <label className="block mb-1 font-semibold">Special Instructions regarding Customer</label>
  <textarea
    name="instructions"
    value={customer.instructions || ""}
    onChange={handleChange}
    rows={3}
    className="w-full border p-2 rounded"
    placeholder="Add any special instructions or notes for this customer..."
  />
</div>
{/* ✅ NEW: Sales Category Field */}
<div>
  <label className="block mb-1 font-semibold">Sales Category</label>
  <select
    name="salesCategory"
    value={customer.salesCategory || ""}
    onChange={handleChange}
    className="w-full border p-2 rounded"
  >
    <option value="">Select a category (optional)</option>
    {categories.map((category) => (
      <option key={category} value={category}>
        {category}
      </option>
    ))}
  </select>
</div>
          <div>
            <label className="block mb-1 font-semibold">GST Documents</label>
            <input
              type="file"
              accept="image/*,.pdf"
              multiple
              onChange={handleFileChange}
              className="w-full border p-2 rounded"
            />

            {/* Show existing */}
            {customer.gstDocs?.length > 0 && (
              <div className="mt-2 space-y-1">
                <p className="text-sm font-medium text-gray-600">Existing Files:</p>
                <div className="flex flex-wrap gap-3">
                  {customer.gstDocs.map((url, i) => (
                    <div key={i} className="relative border p-2 rounded bg-gray-100">
                      {url?.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                        <img
                          src={url}
                          alt={`doc-${i}`}
                          className="w-24 h-24 object-cover rounded"
                        />
                      ) : (
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 underline"
                        >
                          📄 PDF {i + 1}
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveExistingDoc(url)}
                        className="absolute top-1 right-1 text-white bg-red-500 hover:bg-red-600 rounded-full w-5 h-5 text-xs"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Show new */}
            {newFiles.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-600">New Files to Upload:</p>
                <div className="flex flex-wrap gap-3">
                  {newFiles.map((file, i) => {
                    const isImage = file.type.startsWith("image/");
                    return (
                      <div key={i} className="relative border p-2 rounded bg-gray-100">
                        {isImage ? (
                          <img
                            src={URL.createObjectURL(file)}
                            alt={`new-doc-${i}`}
                            className="w-24 h-24 object-cover rounded"
                          />
                        ) : (
                          <p className="text-xs text-center">{file.name}</p>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveNewDoc(i)}
                          className="absolute top-1 right-1 text-white bg-red-500 hover:bg-red-600 rounded-full w-5 h-5 text-xs"
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

       {/* Gift Management Section */}
<div ref={giftsSectionRef} id="gift-management-section" className="mt-8 border-t pt-8">
<div className="flex justify-between items-center mb-4">
  <h3 className="text-xl font-bold">🪔 Diwali Gift Distribution</h3>
  <div className="flex gap-2">
    <button
      type="button"
      onClick={() => setShowGiftForm(!showGiftForm)}
      className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700"
    >
      {showGiftForm ? "Cancel" : "➕ Add Diwali Gift"}
    </button>
   <button
  type="button"
  onClick={() => {
    setShowSecurityChequeForm(!showSecurityChequeForm);
    setEditingSecurityChequeId(null); // Reset editing state
    setSecurityChequeForm({ amount: "", chequeFile: null, remarks: "" }); // Reset form
  }}
  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
>
  {showSecurityChequeForm ? "Cancel" : "🏦 Security Cheque"}
</button>

<button
  type="button"
  onClick={() => {
    setShowSamplesForm(!showSamplesForm);
    setEditingSampleId(null); // Reset editing state
    setSamplesForm({ sampleName: "", sampleFiles: [], remarks: "" }); // Reset form
  }}
  className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
>
  {showSamplesForm ? "Cancel" : "🧪 Samples"}
</button>
  </div>
</div>

{showGiftForm && (
  <div className="bg-gray-50 p-4 rounded-lg mb-6">
<h4 className="font-semibold mb-3">Distribute Diwali Gift to Customer</h4>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="block mb-1 font-semibold">Gift Type *</label>
        <select
          name="giftType"
          value={giftForm.giftType}
          onChange={(e) => setGiftForm(prev => ({ ...prev, giftType: e.target.value }))}
          className="w-full border p-2 rounded"
          required
          disabled={loadingGifts}
        >
          <option value="">{loadingGifts ? "Loading gifts..." : "Select Gift Item"}</option>
          {giftProducts.map(product => (
            <option key={product._id} value={product._id}>
              {product.name} (Stock: {product.stock || 0})
            </option>
          ))}
        </select>
        {loadingGifts && (
          <p className="text-sm text-gray-500 mt-1">Loading gift items...</p>
        )}
      </div>
      
      <div>
        <label className="block mb-1 font-semibold">Quantity *</label>
        <input
          type="number"
          min="1"
          value={giftForm.quantity}
          onChange={(e) => setGiftForm(prev => ({ ...prev, quantity: e.target.value }))}
          className="w-full border p-2 rounded"
          required
        />
      </div>
      
      <div className="md:col-span-2">
        <label className="block mb-1 font-semibold">Notes</label>
        <input
          type="text"
          value={giftForm.notes}
          onChange={(e) => setGiftForm(prev => ({ ...prev, notes: e.target.value }))}
          className="w-full border p-2 rounded"
          placeholder="Optional notes about this gift distribution"
        />
      </div>
    </div>
    
    <button
      type="button"
      onClick={async () => {
        try {
          if (!giftForm.giftType) {
            toast.error("Please select a gift type");
            return;
          }
          
          if (!giftForm.quantity || giftForm.quantity < 1) {
            toast.error("Please enter a valid quantity");
            return;
          }
          
          // ✅ Remove isDiwaliGift from the request since all gifts are Diwali gifts
          const giftData = {
            giftType: giftForm.giftType,
            quantity: giftForm.quantity,
            notes: giftForm.notes
            // isDiwaliGift is automatically determined from gift product
          };
          
          const res = await axiosInstance.post(`/customers/${id}/gift`, giftData);
          toast.success("Diwali gift added successfully!");
          setGiftForm({ giftType: "", quantity: 1, notes: "", isDiwaliGift: false });
          setShowGiftForm(false);
          
          // ✅ Refresh gift history instead of reloading entire customer
          fetchGiftHistory();
          
          // Also refresh gift products stock
          const updatedGiftProducts = await axiosInstance.get("/purchase-products/purchase-products-all", {
            params: { isGiftItem: true }
          });
          setGiftProducts(updatedGiftProducts.data || []);
          
        } catch (err) {
          console.error("Add gift error:", err);
          toast.error(err.response?.data?.error || "Failed to add gift");
        }
      }}
      className="mt-4 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
    >
      ✅ Distribute Diwali Gift
    </button>
  </div>
)}
{/* Security Cheque Form */}
{showSecurityChequeForm && (
  <div className="bg-blue-50 p-4 rounded-lg mb-6">
<h4 className="font-semibold mb-3">
  {editingSecurityChequeId ? "✏️ Edit Security Cheque" : "🏦 Add Security Cheque"}
</h4>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="block mb-1 font-semibold">Amount *</label>
        <input
          type="number"
          min="0"
          step="0.01"
          value={securityChequeForm.amount}
          onChange={(e) => setSecurityChequeForm(prev => ({ ...prev, amount: e.target.value }))}
          className="w-full border p-2 rounded"
          placeholder="Enter amount"
          required
        />
      </div>
      
      <div>
        <label className="block mb-1 font-semibold">Upload Cheque Image/PDF *</label>
        <input
          type="file"
          accept="image/*,.pdf"
          onChange={(e) => setSecurityChequeForm(prev => ({ ...prev, chequeFile: e.target.files[0] }))}
          className="w-full border p-2 rounded"
          required
        />
      </div>
      
      <div className="md:col-span-2">
        <label className="block mb-1 font-semibold">Remarks</label>
        <textarea
          value={securityChequeForm.remarks}
          onChange={(e) => setSecurityChequeForm(prev => ({ ...prev, remarks: e.target.value }))}
          className="w-full border p-2 rounded"
          placeholder="Add remarks about this cheque"
          rows={2}
        />
      </div>
    </div>
    
<button
  type="button"
  onClick={async () => {
    try {
      if (!securityChequeForm.amount) {
        toast.error("Please enter amount");
        return;
      }
      
      let chequeFileUrl = securityChequeForm.chequeFile;
      
      // If chequeFile is a File object (new upload), upload it
      if (securityChequeForm.chequeFile instanceof File) {
        const uploadedUrl = await uploadToCloudinary([securityChequeForm.chequeFile]);
        chequeFileUrl = uploadedUrl[0];
      }
      
      if (!chequeFileUrl) {
        toast.error("Please upload cheque file");
        return;
      }
      
      const chequeData = {
        amount: securityChequeForm.amount,
        chequeFile: chequeFileUrl,
        remarks: securityChequeForm.remarks
      };
      
      if (editingSecurityChequeId) {
        // Update existing cheque using PUT
        await axiosInstance.put(`/customers/${id}/security-cheque/${editingSecurityChequeId}`, chequeData);
        toast.success("Security cheque updated successfully!");
        setEditingSecurityChequeId(null);
      } else {
        // Add new cheque
        await axiosInstance.post(`/customers/${id}/security-cheque`, chequeData);
        toast.success("Security cheque added successfully!");
      }
      
      // Reset form and refresh data
      setSecurityChequeForm({ amount: "", chequeFile: null, remarks: "" });
      setShowSecurityChequeForm(false);
      fetchSecurityCheques();
      
    } catch (err) {
      console.error("Save security cheque error:", err);
      toast.error(err.response?.data?.error || "Failed to save security cheque");
    }
  }}
  className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
>
  {editingSecurityChequeId ? "💾 Update Security Cheque" : "💾 Save Security Cheque"}
</button>
  </div>
)}

{/* Samples Form */}
{showSamplesForm && (
  <div className="bg-purple-50 p-4 rounded-lg mb-6">
<h4 className="font-semibold mb-3">
  {editingSampleId ? "✏️ Edit Sample" : "🧪 Add Sample"}
</h4>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="block mb-1 font-semibold">Sample Name *</label>
        <input
          type="text"
          value={samplesForm.sampleName}
          onChange={(e) => setSamplesForm(prev => ({ ...prev, sampleName: e.target.value }))}
          className="w-full border p-2 rounded"
          placeholder="Enter sample name"
          required
        />
      </div>
      
      <div>
        <label className="block mb-1 font-semibold">Upload Sample Files *</label>
        <input
          type="file"
          accept="image/*,.pdf,.doc,.docx"
          multiple
          onChange={(e) => setSamplesForm(prev => ({ ...prev, sampleFiles: Array.from(e.target.files) }))}
          className="w-full border p-2 rounded"
          required
        />
      </div>
      
      <div className="md:col-span-2">
        <label className="block mb-1 font-semibold">Remarks</label>
        <textarea
          value={samplesForm.remarks}
          onChange={(e) => setSamplesForm(prev => ({ ...prev, remarks: e.target.value }))}
          className="w-full border p-2 rounded"
          placeholder="Add remarks about this sample"
          rows={2}
        />
      </div>
      
      {samplesForm.sampleFiles.length > 0 && (
        <div className="md:col-span-2">
          <p className="text-sm font-medium text-gray-600">Files to upload:</p>
          <div className="flex flex-wrap gap-2 mt-2">
            {samplesForm.sampleFiles.map((file, index) => (
              <span key={index} className="px-2 py-1 bg-gray-100 rounded text-sm">
                {file.name}
                <button
                  type="button"
                  onClick={() => {
                    const newFiles = [...samplesForm.sampleFiles];
                    newFiles.splice(index, 1);
                    setSamplesForm(prev => ({ ...prev, sampleFiles: newFiles }));
                  }}
                  className="ml-2 text-red-500"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
    
 <button
  type="button"
  onClick={async () => {
    try {
      if (!samplesForm.sampleName) {
        toast.error("Please enter sample name");
        return;
      }
      
      let sampleFilesUrls = [];
      
      // Check if we have new files to upload
      const newFiles = samplesForm.sampleFiles.filter(file => file instanceof File);
      const existingUrls = samplesForm.sampleFiles.filter(file => typeof file === 'string');
      
      if (newFiles.length > 0) {
        // Upload new files
        const uploadedUrls = await uploadToCloudinary(newFiles);
        sampleFilesUrls = [...existingUrls, ...uploadedUrls];
      } else {
        sampleFilesUrls = existingUrls;
      }
      
      if (sampleFilesUrls.length === 0) {
        toast.error("Please upload at least one file");
        return;
      }
      
      const sampleData = {
        sampleName: samplesForm.sampleName,
        sampleFiles: sampleFilesUrls,
        remarks: samplesForm.remarks
      };
      
      if (editingSampleId) {
        // Update existing sample using PUT
        await axiosInstance.put(`/customers/${id}/sample/${editingSampleId}`, sampleData);
        toast.success("Sample updated successfully!");
        setEditingSampleId(null);
      } else {
        // Add new sample
        await axiosInstance.post(`/customers/${id}/sample`, sampleData);
        toast.success("Sample added successfully!");
      }
      
      // Reset form and refresh data
      setSamplesForm({ sampleName: "", sampleFiles: [], remarks: "" });
      setShowSamplesForm(false);
      fetchSamples();
      
    } catch (err) {
      console.error("Save sample error:", err);
      toast.error(err.response?.data?.error || "Failed to save sample");
    }
  }}
  className="mt-4 bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
>
  {editingSampleId ? "💾 Update Sample" : "💾 Save Sample"}
</button>
  </div>
)}

{/* Gift History Table with Pagination */}
<div className="mt-6">
  <div className="flex justify-between items-center mb-3">
    <h4 className="font-semibold">Gift History</h4>
    {giftTotal > 0 && (
      <div className="text-sm text-gray-600">
        Total: {giftTotal} gifts
      </div>
    )}
  </div>

  {loadingGiftHistory ? (
    <div className="text-center py-4">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
      <p className="text-sm text-gray-500 mt-2">Loading gift history...</p>
    </div>
  ) : giftHistory.length > 0 ? (
    <>
      <div className="overflow-x-auto mb-4">
        <table className="min-w-full border">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 border">Date</th>
              <th className="p-2 border">Gift Type</th>
              <th className="p-2 border">Quantity</th>
              <th className="p-2 border">Distributed By</th>
              <th className="p-2 border">Notes</th>
            </tr>
          </thead>
          <tbody>
            {giftHistory.map((gift, index) => (
              <tr key={index}>
                <td className="p-2 border">
                  {new Date(gift.date).toLocaleDateString()}
                </td>
     <td className="p-2 border">
  {gift.isDiwaliGift && "🪔 "}
  {gift.giftType?.name || "Unknown"}
  {gift.isDiwaliGift && ( // Only show badge if it's a Diwali gift
    <span className="ml-1 text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">Diwali</span>
  )}
</td>
                <td className="p-2 border">{gift.quantity}</td>
                <td className="p-2 border">
                  {gift.distributedBy?.name || "Unknown"}
                </td>
                <td className="p-2 border">{gift.notes || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {giftTotalPages > 1 && (
        <div className="flex justify-between items-center mt-4">
          <div className="text-sm text-gray-600">
            Page {giftPage} of {giftTotalPages}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                const newPage = Math.max(1, giftPage - 1);
                setGiftPage(newPage);
                fetchGiftHistory(newPage);
              }}
              disabled={giftPage === 1}
              className="px-3 py-1 bg-gray-200 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ← Previous
            </button>
            <button
              onClick={() => {
                const newPage = Math.min(giftTotalPages, giftPage + 1);
                setGiftPage(newPage);
                fetchGiftHistory(newPage);
              }}
              disabled={giftPage === giftTotalPages}
              className="px-3 py-1 bg-gray-200 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </>
  ) : (
    <div className="text-center py-6 border rounded-lg bg-gray-50">
      <p className="text-gray-500">No gift history found</p>
    </div>
  )}
</div>
{/* Security Cheques Table */}
{securityCheques.length > 0 && (
  <div className="mt-8 border-t pt-6">
    <h4 className="font-semibold mb-3">🏦 Security Cheques</h4>
    <div className="overflow-x-auto">
      <table className="min-w-full border">
        <thead className="bg-blue-50">
          <tr>
            <th className="p-2 border">Date</th>
            <th className="p-2 border">Amount</th>
            <th className="p-2 border">Cheque File</th>
            <th className="p-2 border">Remarks</th>
            <th className="p-2 border">Added By</th>
            <th className="p-2 border">Actions</th>
          </tr>
        </thead>
        <tbody>
          {securityCheques.map((cheque, index) => {
              console.log("Cheque data:", cheque); // Add this for debugging
         return (
            <tr key={cheque._id || index}>
              <td className="p-2 border">
                {new Date(cheque.date).toLocaleDateString()}
              </td>
              <td className="p-2 border font-semibold">₹{cheque.amount}</td>
              <td className="p-2 border">
                {cheque.chequeFile?.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                  <a href={cheque.chequeFile} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                    <img src={cheque.chequeFile} alt="Cheque" className="w-16 h-16 object-cover rounded" />
                  </a>
                ) : (
                  <a href={cheque.chequeFile} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                    📄 View File
                  </a>
                )}
              </td>
              <td className="p-2 border">{cheque.remarks || "-"}</td>
              <td className="p-2 border">
                {cheque.addedBy?.name || cheque.addedBy || "Unknown"}
              </td>
              <td className="p-2 border">
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditSecurityCheque(cheque)}
                    className="text-blue-600 hover:text-blue-800 text-sm px-2 py-1 border border-blue-300 rounded hover:bg-blue-50"
                  >
                    ✏️ Edit
                  </button>
               <button
  onClick={() => {
    console.log("Deleting cheque with ID:", cheque._id?.toString());
    handleDeleteSecurityCheque(cheque._id?.toString());
  }}
  className="text-red-600 hover:text-red-800 text-sm px-2 py-1 border border-red-300 rounded hover:bg-red-50"
>
  🗑️ Delete
</button>

                </div>
              </td>
            </tr>
          )})}
        </tbody>
      </table>
    </div>
  </div>
)}

{/* Samples Table */}
{samples.length > 0 && (
  <div className="mt-8 border-t pt-6">
    <h4 className="font-semibold mb-3">🧪 Samples</h4>
    <div className="overflow-x-auto">
      <table className="min-w-full border">
        <thead className="bg-purple-50">
          <tr>
            <th className="p-2 border">Date</th>
            <th className="p-2 border">Sample Name</th>
            <th className="p-2 border">Files</th>
            <th className="p-2 border">Remarks</th>
            <th className="p-2 border">Added By</th>
            <th className="p-2 border">Actions</th>
          </tr>
        </thead>
        <tbody>
          {samples.map((sample, index) => (
            <tr key={sample._id || index}>
              <td className="p-2 border">
                {new Date(sample.date).toLocaleDateString()}
              </td>
              <td className="p-2 border font-semibold">{sample.sampleName}</td>
              <td className="p-2 border">
                <div className="flex flex-wrap gap-2">
                  {sample.sampleFiles?.map((file, fileIndex) => (
                    file?.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                      <a key={fileIndex} href={file} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                        <img src={file} alt={`Sample ${fileIndex + 1}`} className="w-12 h-12 object-cover rounded" />
                      </a>
                    ) : (
                      <a key={fileIndex} href={file} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline text-sm">
                        📄 File {fileIndex + 1}
                      </a>
                    )
                  ))}
                </div>
              </td>
              <td className="p-2 border">{sample.remarks || "-"}</td>
              <td className="p-2 border">
                {sample.addedBy?.name || sample.addedBy || "Unknown"}
              </td>
              <td className="p-2 border">
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditSample(sample)}
                    className="text-blue-600 hover:text-blue-800 text-sm px-2 py-1 border border-blue-300 rounded hover:bg-blue-50"
                  >
                    ✏️ Edit
                  </button>
                <button
  onClick={() => {
    console.log("Deleting sample with ID:", sample._id?.toString());
    handleDeleteSample(sample._id?.toString());
  }}
  className="text-red-600 hover:text-red-800 text-sm px-2 py-1 border border-red-300 rounded hover:bg-red-50"
>
  🗑️ Delete
</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
)}
</div>

          <div className="flex justify-between items-center space-x-4">
            <button
              type="submit"
              disabled={submitting || deleting}
              className={`bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 ${
                submitting || deleting ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {submitting ? "Saving..." : "Save Changes"}
            </button>

            <button
              type="button"
              onClick={handleDelete}
              disabled={submitting || deleting}
              className={`bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 ${
                submitting || deleting ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {deleting ? "Deleting..." : "Delete Customer"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}