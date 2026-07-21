import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import axiosInstance from "../axiosInstance";
import InternalNavbar from "../components/InternalNavbar";
import toast from "react-hot-toast";
import { useUserContext } from "../context/UserContext";
import CostingSheet from "../components/CostingSheet";
const INDIAN_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh",
  "Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka",
  "Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram",
  "Nagaland","Odisha","Rajasthan","Sikkim","Tamil Nadu","Telangana",
  "Tripura","Uttar Pradesh","Uttarakhand","West Bengal",
  "Andaman and Nicobar Islands","Chandigarh","Dadra and Nagar Haveli and Daman and Diu",
  "Delhi","Jammu and Kashmir","Ladakh","Lakshadweep","Puducherry","Punjab"
];

export default function EditPotentialCustomer() {
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
// Add with your other state declarations
const [showProductionSlipForm, setShowProductionSlipForm] = useState(false);
const [productionSlipForm, setProductionSlipForm] = useState({
  files: [],
  notes: "",
  slipType: "production_order"
});
const [productionSlips, setProductionSlips] = useState([]);
const [loadingProductionSlips, setLoadingProductionSlips] = useState(false);
const [editingProductionSlipId, setEditingProductionSlipId] = useState(null);

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
    // Function to fetch paginated gift history
const fetchGiftHistory = async (page = 1) => {
  setLoadingGiftHistory(true);
  try {
    const res = await axiosInstance.get(`/potential-customers/${id}/gifts`, {
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


// WhatsApp share function for customer
const shareOnWhatsApp = () => {
  if (!customer) {
    toast.error("Potential Customer data not loaded yet");
    return;
  }

  // Format phone numbers (handle comma-separated values)
  const phones = customer.phone ? customer.phone.split(',').map(p => p.trim()).join(', ') : 'N/A';

  // Format the message
  const message = `*Potential Customer Details*%0A
👤 *Name:* ${customer.name || 'N/A'}%0A
📞 *Phone:* ${phones}%0A
📧 *Email:* ${customer.email || 'N/A'}%0A
📍 *Address:* ${customer.address || 'N/A'}%0A
🏙️ *City:* ${customer.city || 'N/A'}%0A
🗺️ *State:* ${customer.state || 'N/A'}%0A
📮 *Pincode:* ${customer.pincode || 'N/A'}%0A
🗺️ *Location:* ${customer.locationLink || 'N/A'}`;

  // Open WhatsApp with the message
  window.open(`https://wa.me/?text=${message}`, '_blank');
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

// Replace the existing useEffect for auto-opening costing sheet with this:

useEffect(() => {
  const params = new URLSearchParams(location.search);
  const openCostingSheet = params.get('openCostingSheet');
  
  if (openCostingSheet === 'true') {
    // Use a longer delay and retry mechanism
    const tryClickButton = (attempts = 0) => {
      const costingSheetButton = document.querySelector('[data-costing-sheet-toggle]');
      if (costingSheetButton && costingSheetButton.getAttribute('data-expanded') !== 'true') {
        costingSheetButton.click();
        console.log("Costing sheet button clicked!");
      } else if (attempts < 10) {
        // Retry after 500ms, up to 10 times (5 seconds total)
        setTimeout(() => tryClickButton(attempts + 1), 500);
      } else {
        console.log("Could not find costing sheet button after 10 attempts");
      }
    };
    
    // Start trying after a short delay
    setTimeout(() => tryClickButton(), 300);
  }
}, [location.search, frequentProducts]);

useEffect(() => {
  async function fetchCustomer() {
    try {
      const res = await axiosInstance.get(`/potential-customers/${id}`);
      
      // Ensure createdBy is either an object or an ID string
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
  console.log("Frequent products response:", ordersRes.data);
  console.log("Frequent products with IDs:", ordersRes.data.map(p => ({ 
    product: p.product, 
    productId: p.productId 
  })));
  setFrequentProducts(ordersRes.data);
}
      
      // Fetch all histories
      fetchGiftHistory();
      fetchSecurityCheques();
      fetchSamples();
        fetchProductionSlips();
      
    } catch (err) {
      if (err.response?.status === 404) {
        toast.error("Potential Customer not found or deleted");
        navigate("/potential-customers");
      } else {
        toast.error("Failed to load Potential customer");
      }
    } finally {
      setLoading(false);
    }
  }

  fetchCustomer();
}, [id, navigate]);

// Add this useEffect after your fetchCustomer useEffect
useEffect(() => {
  if (customer && customer._id) {
    console.log("Customer loaded, fetching production slips...");
    fetchProductionSlips();
  }
}, [customer?._id]); // Re-run when customer ID changes

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
  console.log("Potential Customer loaded:", customer.name);
  
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

      await axiosInstance.put(`/potential-customers/${id}`, updatedCustomer);
      toast.success("Potential Customer updated successfully");
      navigate("/potential-customers");
   } catch (err) {
  console.error(err);

  const errorMsg =
    err.response?.data?.error ||
    err.response?.data?.message ||
    "Failed to update Potential customer";

  toast.error(errorMsg);
} finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this Potential customer?")) return;
    setDeleting(true);

    try {
      await axiosInstance.delete(`/potential-customers/${id}`);
      toast.success("Potential Customer deleted successfully!");
      navigate("/potential-customers");
    } catch (err) {
      toast.error("Failed to delete Potential customer");
    } finally {
      setDeleting(false);
    }
  };

  // Function to fetch security cheques
const fetchSecurityCheques = async () => {
  try {
    const res = await axiosInstance.get(`/potential-customers/${id}/security-cheques`);
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
    const res = await axiosInstance.get(`/potential-customers/${id}/samples`);
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
  console.log("Potential Customer ID:", id);
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
    console.log("Sending DELETE request to:", `/potential-customers/${id}/security-cheque/${chequeId}`);
    
    // Test with a simple GET first to check if route exists
    console.log("Testing route existence...");
    try {
      const testRes = await axiosInstance.get(`/potential-customers/${id}/security-cheques`);
      console.log("GET security-cheques works:", testRes.status);
    } catch (testErr) {
      console.error("GET security-cheques failed:", testErr.response?.status, testErr.message);
    }
    
    // Now try DELETE
    const response = await axiosInstance.delete(`/potential-customers/${id}/security-cheque/${chequeId}`);
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
  console.log("Potential Customer ID from params:", id);
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
    console.log(`Sending DELETE to: /potential-customers/${id}/sample/${sampleId}`);
    
    // First, verify the sample exists via API
    console.log("Verifying sample exists via API...");
    try {
      const debugRes = await axiosInstance.get(`/potential-customers/${id}/samples-debug`);
      const sampleExists = debugRes.data.samples?.some(s => s.id === sampleId);
      console.log("Sample exists according to API?", sampleExists);
      console.log("All sample IDs from API:", debugRes.data.samples?.map(s => s.id));
    } catch (debugErr) {
      console.warn("Debug API failed, continuing anyway:", debugErr.message);
    }
    
    // Now try the delete
    const response = await axiosInstance.delete(`/potential-customers/${id}/sample/${sampleId}`);
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
    const response = await axiosInstance.delete(`/potential-customers/${id}/security-cheque-test/${chequeId}`);
    console.log("Test DELETE response:", response.data);
    toast.success("Test DELETE works!");
  } catch (err) {
    console.error("Test DELETE error:", err);
    toast.error("Test DELETE failed: " + (err.response?.data?.error || err.message));
  }
};

const fetchProductionSlips = async () => {
  console.log("=== FETCHING PRODUCTION SLIPS ===");
  console.log("Customer ID:", id);
  
  try {
    const res = await axiosInstance.get(`/potential-customers/${id}/production-slips`);
    console.log("Production slips response:", res.data);
    
    if (res.data.success) {
      console.log("Production slips found:", res.data.productionSlips?.length || 0);
      console.log("Production slips data:", res.data.productionSlips);
      setProductionSlips(res.data.productionSlips || []);
    } else {
      console.warn("API returned success: false", res.data);
    }
  } catch (err) {
    console.error("Failed to fetch production slips:", err);
    console.error("Error response:", err.response?.data);
    toast.error("Failed to load production slips");
  }
};


const handleEditProductionSlip = (e, slip) => {
  e.preventDefault(); // Add this to prevent any form submission
  e.stopPropagation(); // Stop event bubbling
  
  console.log("=== EDITING PRODUCTION SLIP ===");
  console.log("Slip data:", slip);
  
  // Populate the production slip form with existing data
  setProductionSlipForm({
    files: slip.files || [],
    notes: slip.notes || "",
    slipType: slip.slipType
  });
  
  // Show the form and store the slip ID for update
  setEditingProductionSlipId(slip._id);
  setShowProductionSlipForm(true);
  
  // Scroll to the form
  setTimeout(() => {
    const formSection = document.getElementById('gift-management-section');
    if (formSection) {
      formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, 100);
};

const handleConvertToCustomer = async () => {
  if (!window.confirm("Convert this potential customer to a regular customer? This will move the customer to customers and remove them from potential customers list.")) {
    return;
  }

  try {
    // Step 1: Convert to customer
    const res = await axiosInstance.post(`/potential-customers/${id}/convert`);
    toast.success("Converted to customer successfully!");
    
    // ✅ Step 2: Delete the potential customer record
    await axiosInstance.delete(`/potential-customers/${id}`);
    toast.success("Potential customer record removed from list");
    
    // Step 3: Navigate to regular customer edit page
    navigate(`/customers/edit/${res.data.customer._id}`);
  } catch (err) {
    console.error("Convert to customer error:", err);
    toast.error(err.response?.data?.error || "Failed to convert to customer");
  }
};

  if (loading) return <p>Loading Potential customer...</p>;
  if (!customer) return null;

  return (
    <>
      <InternalNavbar />
<CostingSheet customerId={id} frequentProducts={frequentProducts} />

<div className="flex justify-between items-center max-w-7xl mx-auto p-6 pb-0">
  <div className="flex items-center gap-3 flex-wrap">
    <h2 className="text-2xl font-bold">Edit Potential Customer</h2>
    {/* Converted Badge */}
    {customer && customer.convertedToCustomerId && (
      <span className="bg-green-100 text-green-800 text-sm font-medium px-3 py-1 rounded-full flex items-center gap-1 border border-green-300">
        <span className="text-green-600">✅</span>
        Converted
      </span>
    )}
    {/* Status Badge */}
    {customer && customer.status && (
      <span className={`text-sm font-medium px-3 py-1 rounded-full border ${
        customer.status === 'converted' ? 'bg-green-100 text-green-800 border-green-300' :
        customer.status === 'lost' ? 'bg-red-100 text-red-800 border-red-300' :
        customer.status === 'qualified' ? 'bg-blue-100 text-blue-800 border-blue-300' :
        'bg-gray-100 text-gray-800 border-gray-300'
      }`}>
        {customer.status.charAt(0).toUpperCase() + customer.status.slice(1)}
      </span>
    )}
  </div>
  
  <div className="flex gap-2 flex-wrap">
    {/* WhatsApp Share Button */}
    {customer && (
      <button
        type="button"
        onClick={shareOnWhatsApp}
        className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 shadow-sm"
        title="Share Potential customer details on WhatsApp"
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="20" 
          height="20" 
          viewBox="0 0 24 24" 
          fill="currentColor"
          className="text-white"
        >
          <path d="M19.077 4.928C17.191 3.041 14.683 2 12.006 2 6.798 2 2.537 6.193 2.523 11.396c-.004 1.7.435 3.365 1.258 4.832L2.4 21.6l5.444-1.401c1.414.786 2.998 1.2 4.63 1.201h.004c5.203 0 9.47-4.197 9.484-9.4.007-2.511-.967-4.87-2.885-6.772zm-7.07 14.459c-1.441 0-2.856-.387-4.089-1.116l-.293-.176-3.234.832.864-3.153-.192-.305c-.806-1.285-1.232-2.764-1.229-4.289.012-4.297 3.5-7.79 7.806-7.79 2.081 0 4.04.812 5.515 2.287 1.473 1.473 2.282 3.43 2.277 5.51-.012 4.302-3.5 7.795-7.8 7.8z"/>
          <path d="M16.205 14.087c-.226.113-1.338.657-1.544.732-.205.075-.354.113-.502-.113s-.646-.796-.849-1.08c-.202-.283-.354-.321-.58-.107-.226.214-.871.803-.954.963-.083.16-.166.174-.393.06-.226-.113-.956-.352-1.822-1.124-.673-.6-1.128-1.342-1.26-1.569-.132-.227-.014-.35.099-.463.101-.101.226-.264.339-.396.113-.132.151-.226.226-.377.075-.15.038-.283-.019-.396-.056-.113-.502-1.21-.689-1.658-.181-.433-.366-.374-.503-.381-.13-.007-.279-.009-.428-.009s-.393.056-.599.283c-.205.226-.783.765-.783 1.866 0 1.101.801 2.165.913 2.315.113.151 1.552 2.427 3.767 3.326 2.215.899 2.215.599 2.614.561.399-.037 1.289-.527 1.471-1.036.183-.509.183-.945.128-1.036-.056-.09-.205-.146-.428-.259z"/>
        </svg>
        Share on WhatsApp
      </button>
    )}
    
    {/* Convert Button - Show only if NOT converted */}
    {customer && !customer.convertedToCustomerId && (
      <button
        type="button"
        onClick={handleConvertToCustomer}
        className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 shadow-sm"
      >
        🔄 Convert to Customer
      </button>
    )}
    
  
  </div>
</div>


<div className="max-w-7xl mx-auto p-6">
  {/* Frequently Bought Products Section - Full Width */}
  {frequentProducts.length > 0 && (
    <div className="mb-8 w-full overflow-x-auto">
      <h3 className="text-lg font-semibold mb-2">Frequently Bought Products</h3>
      <div className="border rounded overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="px-3 py-2 whitespace-nowrap">Last Ordered</th>
              <th className="px-3 py-2 whitespace-nowrap">Product</th>
              <th className="px-3 py-2 whitespace-nowrap">Price</th>
              <th className="px-3 py-2 whitespace-nowrap">Remarks</th>
              <th className="px-3 py-2 whitespace-nowrap">Times Ordered</th>
            </tr>
          </thead>
          <tbody>
            {frequentProducts.map((item, idx) => (
              <tr key={idx} className="border-t">
                <td className="px-3 py-2 whitespace-nowrap">
                  {item.orderDate ? new Date(item.orderDate).toLocaleDateString() : "-"}
                </td>
                <td className="px-3 py-2 whitespace-nowrap">{item.product}</td>
                <td className="px-3 py-2 text-green-700 font-semibold whitespace-nowrap">
                  ₹{item.price}
                  <span className="ml-1 text-xs text-gray-500">(last)</span>
                </td>
                <td className="px-3 py-2">{item.remarks || "-"}</td>
                <td className="px-3 py-2 whitespace-nowrap">{item.timesOrdered}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )}

  {/* Form Section */}
  <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1 font-semibold">Company Name</label>
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
            <label className="block mb-1 font-semibold">Phone (Add 2 or more numbers separated by Comma Eg. 9878165432,9216562160)</label>
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
  <label className="block mb-1 font-semibold">Potential Customer Handled/Managed by</label>
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
            <label className="block mb-1 font-semibold">Potential Customer Factory Location Google Maps Link</label>
            <input
              name="locationLink"
              value={customer.locationLink || ""}
              onChange={handleChange}
              placeholder="https://maps.google.com/..."
              className="w-full border p-2 rounded"
            />
          </div>
<div>
  <label className="block mb-1 font-semibold">Special Instructions regarding Potential Customer</label>
  <textarea
    name="instructions"
    value={customer.instructions || ""}
    onChange={handleChange}
    rows={3}
    className="w-full border p-2 rounded"
    placeholder="Add any special instructions or notes for this Potential customer..."
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
              {deleting ? "Deleting..." : "Delete Potential Customer"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}