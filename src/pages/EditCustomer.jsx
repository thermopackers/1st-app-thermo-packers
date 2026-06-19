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
      
      // ✅ ALSO update the customer state with the gift history
      setCustomer(prev => ({
        ...prev,
        giftHistory: res.data.gifts || []
      }));
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
    toast.error("Customer data not loaded yet");
    return;
  }

  // Format phone numbers (handle comma-separated values)
  const phones = customer.phone ? customer.phone.split(',').map(p => p.trim()).join(', ') : 'N/A';

  // Format the message
  const message = `*Customer Details*%0A
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
      const res = await axiosInstance.get(`/customers/${id}`);
      
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
  // Filter out any non-File objects (like URLs)
  const validFiles = files.filter(file => file instanceof File);
  
  if (validFiles.length === 0) {
    return [];
  }
  
  const uploads = validFiles.map(async (file) => {
    const data = new FormData();
    data.append("file", file);
    data.append("upload_preset", "todo_uploads");
    data.append("cloud_name", "dcr8k5amk");

    const res = await fetch("https://api.cloudinary.com/v1_1/dcr8k5amk/upload", {
      method: "POST",
      body: data,
    });

    if (!res.ok) {
      throw new Error(`Upload failed: ${res.statusText}`);
    }

    const result = await res.json();
    return result.secure_url;
  });

  return Promise.all(uploads);
};

const handleSubmit = async (e) => {
  e.preventDefault();
  setSubmitting(true);
  
  // GST validation
  if (customer.company && customer.company !== "URP" && customer.company.length !== 15) {
    setGstError("GST number must be exactly 15 characters.");
    toast.error("GST number must be exactly 15 characters.");
    setSubmitting(false);
    return;
  }
  
  // Auto-fill URP if GST is empty
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

    // ✅ IMPORTANT: Use the customer state which already has the updated productionSlips
    const updatedCustomer = {
      ...customer,
      createdBy: customer.createdBy,
      gstDocs: [...(customer.gstDocs || []), ...uploadedUrls],
      // Use the customer state directly - it already has the productionSlips from fetchProductionSlips()
      productionSlips: customer.productionSlips || [],
      securityCheques: customer.securityCheques || [],
      samples: customer.samples || [],
      giftHistory: customer.giftHistory || [],
      costingSheets: customer.costingSheets || []
    };

    console.log("Saving customer with productionSlips:", updatedCustomer.productionSlips?.length || 0);
    console.log("Production slips data:", updatedCustomer.productionSlips);
    
    await axiosInstance.put(`/customers/${id}`, updatedCustomer);
    toast.success("Customer updated successfully");
    
    // ✅ Navigate after a small delay to ensure the save is complete
    setTimeout(() => {
      navigate("/customers");
    }, 300);
    
  } catch (err) {
    console.error("Update customer error:", err);
    console.error("Error response:", err.response?.data);

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

const fetchSecurityCheques = async () => {
  try {
    const res = await axiosInstance.get(`/customers/${id}/security-cheques`);
    if (res.data.success) {
      const cheques = res.data.securityCheques || [];
      setSecurityCheques(cheques);
      
      // ✅ ALSO update the customer state with the security cheques
      setCustomer(prev => ({
        ...prev,
        securityCheques: cheques
      }));
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
      const samples = res.data.samples || [];
      setSamples(samples);
      
      // ✅ ALSO update the customer state with the samples
      setCustomer(prev => ({
        ...prev,
        samples: samples
      }));
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

const fetchProductionSlips = async () => {
  try {
    const res = await axiosInstance.get(`/customers/${id}/production-slips`);
    if (res.data.success) {
      const slips = res.data.productionSlips || [];
      setProductionSlips(slips);
      
      // ✅ ALSO update the customer state with the production slips
      setCustomer(prev => ({
        ...prev,
        productionSlips: slips
      }));
    } else {
      console.error("Failed to fetch production slips: success=false", res.data);
    }
  } catch (err) {
    console.error("Failed to fetch production slips:", err);
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

  if (loading) return <p>Loading customer...</p>;
  if (!customer) return null;

  return (
    <>
      <InternalNavbar />
<CostingSheet customerId={id} frequentProducts={frequentProducts} />

<div className="flex justify-between items-center max-w-7xl mx-auto p-6 pb-0">
  <h2 className="text-2xl font-bold">Edit Customer</h2>  
  {/* WhatsApp Share Button */}
  {customer && (
    <button
      type="button"
      onClick={shareOnWhatsApp}
      className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 shadow-sm"
      title="Share customer details on WhatsApp"
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
            <label className="block mb-1 font-semibold">Customer Factory Location Google Maps Link</label>
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
 {/* Replace the entire button group div with this */}
<div className="flex gap-2 flex-wrap">
  <button
    type="button"
    onClick={() => setShowProductionSlipForm(!showProductionSlipForm)}
    className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
  >
    {showProductionSlipForm ? "Cancel" : "📋 Production Slips"}
  </button>
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
      setEditingSecurityChequeId(null);
      setSecurityChequeForm({ amount: "", chequeFile: null, remarks: "" });
    }}
    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
  >
    {showSecurityChequeForm ? "Cancel" : "🏦 Security Cheque"}
  </button>
  <button
    type="button"
    onClick={() => {
      setShowSamplesForm(!showSamplesForm);
      setEditingSampleId(null);
      setSamplesForm({ sampleName: "", sampleFiles: [], remarks: "" });
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
      
      // Check if chequeFile is a File object (new upload)
      if (chequeFileUrl instanceof File) {
        toast.loading("Uploading cheque file...");
        const uploadedUrls = await uploadToCloudinary([chequeFileUrl]);
        toast.dismiss();
        if (uploadedUrls && uploadedUrls.length > 0) {
          chequeFileUrl = uploadedUrls[0];
        } else {
          toast.error("Failed to upload cheque file");
          return;
        }
      } else if (typeof chequeFileUrl === 'string' && !chequeFileUrl.startsWith('http')) {
        toast.error("Invalid cheque file");
        return;
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
      const existingUrls = samplesForm.sampleFiles.filter(file => typeof file === 'string' && file.startsWith('http'));
      
      if (newFiles.length > 0) {
        toast.loading("Uploading sample files...");
        const uploadedUrls = await uploadToCloudinary(newFiles);
        toast.dismiss();
        if (uploadedUrls && uploadedUrls.length > 0) {
          sampleFilesUrls = [...existingUrls, ...uploadedUrls];
        } else {
          toast.error("Failed to upload some files");
          // Continue with existing files if any
          sampleFilesUrls = existingUrls;
        }
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

{/* Production Slip Form */}
{showProductionSlipForm && (
  <div className="bg-indigo-50 p-4 rounded-lg mb-6">
    <h4 className="font-semibold mb-3">
      {editingProductionSlipId ? "✏️ Edit Production Slip" : "📋 Add Production Slip"}
    </h4>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="block mb-1 font-semibold">Slip Type *</label>
        <select
          value={productionSlipForm.slipType}
          onChange={(e) => setProductionSlipForm(prev => ({ ...prev, slipType: e.target.value }))}
          className="w-full border p-2 rounded"
          required
        >
          <option value="production_order">Production Order Slip</option>
          <option value="raw_block_cutting">Raw Block Cutting Slip</option>
          <option value="shape_molding">Shape Molding Slip</option>
        </select>
      </div>
      
    <div>
  <label className="block mb-1 font-semibold">Upload Files {!editingProductionSlipId && "*"}</label>
  <input
    type="file"
    accept="image/*,.pdf,.doc,.docx"
    multiple
    onChange={(e) => {
      const files = Array.from(e.target.files);
      // If editing, we want to add new files to existing ones
      if (editingProductionSlipId && productionSlipForm.files.length > 0) {
        // Keep existing files and add new ones
        setProductionSlipForm(prev => ({ 
          ...prev, 
          files: [...prev.files, ...files] 
        }));
      } else {
        setProductionSlipForm(prev => ({ ...prev, files }));
      }
    }}
    className="w-full border p-2 rounded"
    required={!editingProductionSlipId}
  />
  {editingProductionSlipId && (
    <p className="text-xs text-gray-500 mt-1">Add new files (existing files will be kept)</p>
  )}
</div>
      
      <div className="md:col-span-2">
        <label className="block mb-1 font-semibold">Notes</label>
        <textarea
          value={productionSlipForm.notes}
          onChange={(e) => setProductionSlipForm(prev => ({ ...prev, notes: e.target.value }))}
          className="w-full border p-2 rounded"
          placeholder="Add notes about this production slip"
          rows={2}
        />
      </div>
      
      {/* Show existing files when editing */}
      {editingProductionSlipId && productionSlipForm.files.length > 0 && productionSlipForm.files[0]?.startsWith?.('http') && (
        <div className="md:col-span-2">
          <p className="text-sm font-medium text-gray-600">Existing Files:</p>
          <div className="flex flex-wrap gap-2 mt-2">
            {productionSlipForm.files.map((file, index) => (
              <div key={index} className="relative">
                {file?.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                  <img src={file} alt={`File ${index + 1}`} className="w-16 h-16 object-cover rounded" />
                ) : (
                  <a href={file} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline text-sm">
                    📄 File {index + 1}
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => {
                    const newFiles = [...productionSlipForm.files];
                    newFiles.splice(index, 1);
                    setProductionSlipForm(prev => ({ ...prev, files: newFiles }));
                  }}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Show new files to upload */}
      {productionSlipForm.files.length > 0 && productionSlipForm.files[0] instanceof File && (
        <div className="md:col-span-2">
          <p className="text-sm font-medium text-gray-600">New files to upload:</p>
          <div className="flex flex-wrap gap-2 mt-2">
            {productionSlipForm.files.map((file, index) => (
              <span key={index} className="px-2 py-1 bg-gray-100 rounded text-sm">
                {file.name}
                <button
                  type="button"
                  onClick={() => {
                    const newFiles = [...productionSlipForm.files];
                    newFiles.splice(index, 1);
                    setProductionSlipForm(prev => ({ ...prev, files: newFiles }));
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
      console.log("=== SAVING PRODUCTION SLIP ===");
      let uploadedUrls = [];
      
      // Check if we have new files to upload (File objects)
      const newFiles = productionSlipForm.files.filter(file => file instanceof File);
      const existingUrls = productionSlipForm.files.filter(file => typeof file === 'string' && file.startsWith('http'));
      
      console.log("New files:", newFiles.length);
      console.log("Existing URLs:", existingUrls.length);
      
      if (newFiles.length > 0) {
        toast.loading("Uploading files...");
        uploadedUrls = await uploadToCloudinary(newFiles);
        toast.dismiss();
        console.log("Uploaded URLs:", uploadedUrls);
        if (!uploadedUrls || uploadedUrls.length === 0) {
          toast.error("Failed to upload some files");
          // Continue with existing files only
        }
      }
      
      // Combine existing and new URLs, but only if we're not editing (or if we are, keep existing)
      const finalFiles = [...existingUrls];
      
      // If we have new uploads, add them
      if (uploadedUrls && uploadedUrls.length > 0) {
        finalFiles.push(...uploadedUrls);
      }
      
      console.log("Final files:", finalFiles);
      
      // If we're not editing and have no files, show error
      if (finalFiles.length === 0 && !editingProductionSlipId) {
        toast.error("Please upload at least one file");
        return;
      }
      
      // If we're editing and have no files (user removed all), show error
      if (finalFiles.length === 0 && editingProductionSlipId) {
        toast.error("Please keep at least one file");
        return;
      }
      
      if (!productionSlipForm.slipType) {
        toast.error("Please select a slip type");
        return;
      }
      
      const slipData = {
        files: finalFiles,
        notes: productionSlipForm.notes,
        slipType: productionSlipForm.slipType
      };
      
      console.log("Sending data:", slipData);
      
      let response;
      if (editingProductionSlipId) {
        // Update existing slip
        response = await axiosInstance.put(`/customers/${id}/production-slip/${editingProductionSlipId}`, slipData);
        console.log("Update response:", response.data);
        toast.success("Production slip updated successfully!");
        setEditingProductionSlipId(null);
      } else {
        // Add new slip
        response = await axiosInstance.post(`/customers/${id}/production-slip`, slipData);
        console.log("Add response:", response.data);
        toast.success("Production slip added successfully!");
      }
      
      // Reset form and refresh data
      setProductionSlipForm({ files: [], notes: "", slipType: "production_order" });
      setShowProductionSlipForm(false);
      await fetchProductionSlips();
      
      // ✅ ADD DEBUG VERIFICATION HERE
      try {
        const debugRes = await axiosInstance.get(`/customers/${id}/production-slips-debug`);
        console.log("=== VERIFICATION AFTER SAVE ===");
        console.log("Production slips after save:", debugRes.data);
        console.log("Count:", debugRes.data.count);
        
        if (debugRes.data.count === 0) {
          console.error("❌ PRODUCTION SLIP WAS NOT SAVED!");
          toast.error("Failed to save production slip - please check console");
        } else {
          console.log("✅ Production slip saved successfully!");
        }
      } catch (debugErr) {
        console.error("Debug verification failed:", debugErr);
      }
      
    } catch (err) {
      console.error("Save production slip error:", err);
      console.error("Error response:", err.response?.data);
      toast.error(err.response?.data?.error || err.response?.data?.message || "Failed to save production slip");
    }
  }}
  className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
>
  {editingProductionSlipId ? "💾 Update Production Slip" : "💾 Save Production Slip"}
</button>
    
    {editingProductionSlipId && (
      <button
        type="button"
        onClick={() => {
          setEditingProductionSlipId(null);
          setProductionSlipForm({ files: [], notes: "", slipType: "production_order" });
          setShowProductionSlipForm(false);
        }}
        className="mt-4 ml-2 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
      >
        Cancel Edit
      </button>
    )}
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

{/* Production Slips Table */}
{productionSlips.length > 0 && (
  <div className="mt-8 border-t pt-6">
    <h4 className="font-semibold mb-3">📋 Draft Production Slips</h4>
    <div className="overflow-x-auto">
      <table className="min-w-full border">
        <thead className="bg-indigo-50">
          <tr>
            <th className="p-2 border">Date</th>
            <th className="p-2 border">Slip Type</th>
            <th className="p-2 border">Files</th>
            <th className="p-2 border">Notes</th>
            <th className="p-2 border">Added By</th>
            <th className="p-2 border">Actions</th>
          </tr>
        </thead>
        <tbody>
          {productionSlips.map((slip, index) => (
            <tr key={slip._id || index}>
              <td className="p-2 border">
                {new Date(slip.date).toLocaleDateString()}
              </td>
              <td className="p-2 border">
                {slip.slipType === 'production_order' && '📋 Production Order'}
                {slip.slipType === 'raw_block_cutting' && '🪨 Raw Block Cutting'}
                {slip.slipType === 'shape_molding' && '🔧 Shape Molding'}
              </td>
              <td className="p-2 border">
                <div className="flex flex-wrap gap-2">
                  {slip.files?.map((file, fileIndex) => (
                    file?.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                      <a key={fileIndex} href={file} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                        <img src={file} alt={`File ${fileIndex + 1}`} className="w-12 h-12 object-cover rounded" />
                      </a>
                    ) : (
                      <a key={fileIndex} href={file} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline text-sm">
                        📄 File {fileIndex + 1}
                      </a>
                    )
                  ))}
                </div>
              </td>
              <td className="p-2 border">{slip.notes || "-"}</td>
              <td className="p-2 border">
                {slip.addedBy?.name || slip.addedBy || "Unknown"}
              </td>
              <td className="p-2 border">
                <div className="flex gap-2">
                <button
  onClick={(e) => handleEditProductionSlip(e, slip)}
  className="text-blue-600 hover:text-blue-800 text-sm px-2 py-1 border border-blue-300 rounded hover:bg-blue-50"
>
  ✏️ Edit
</button>
    <button
  type="button"
  onClick={async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!window.confirm("Are you sure you want to delete this production slip?")) {
      return;
    }
    
    try {
      const deleteUrl = `/customers/${id}/production-slip/${slip._id}`;
      const response = await axiosInstance.delete(deleteUrl);
      
      console.log("Delete response:", response.data);
      
      if (response.data && response.data.success === true) {
        toast.success("Production slip deleted successfully!");
        // Refresh the list
        await fetchProductionSlips();
      } else {
        toast.error(response.data?.error || "Failed to delete");
      }
    } catch (err) {
      console.error("Delete error:", err);
      console.error("Error response:", err.response?.data);
      toast.error(err.response?.data?.error || err.response?.data?.message || "Failed to delete production slip");
    }
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