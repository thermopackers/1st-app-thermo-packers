import { useMemo, useState, useEffect } from "react";
import Select from "react-select";
import { useLocation, useNavigate } from "react-router-dom";
import InternalNavbar from "../components/InternalNavbar";
import axiosInstance from "../axiosInstance";
import { toast } from "react-hot-toast";
import imageCompression from 'browser-image-compression';

export default function AddOrder() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
const location = useLocation();
const [isUploading, setIsUploading] = useState(false);
const [paymentTerms, setPaymentTerms] = useState("");
const [customPaymentTerms, setCustomPaymentTerms] = useState("");
  const [availableSizesList, setAvailableSizesList] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [convertedInvoices, setConvertedInvoices] = useState(() => {
  // Load from localStorage on initial render
  const saved = localStorage.getItem('convertedInvoices');
  return saved ? JSON.parse(saved) : [];
});

  const [clientDetails, setClientDetails] = useState({
      customerId: "",       // ✅ add this
    customerName: "",
    po: "",
  poCopy: [], // ✅ now an array
    deliveryRange: "",
      deliveryOption: "", // Add this for tracking the selected option
    date: "",
    remarks: "",
     billTo: "",
  shipTo: "",
  sameAsBillTo: true, // 🔁 checkbox state
  });
const [productList, setProductList] = useState([
  {
    product: "",
    customProduct: "",
    size: "",
    customSize: "",
    quantity: "",
    price: "",
    density: "",
    productRemarks: "",
    narration: "",
    narrationImages: [],
  },
]);

// ADD COMMON FIELDS at order level (move freight here):
const [commonFreight, setCommonFreight] = useState("");
const [commonFreightAmount, setCommonFreightAmount] = useState("");
const [commonPackagingCharge, setCommonPackagingCharge] = useState("");

  const [allProducts, setAllProducts] = useState([]);
  const [modalImage, setModalImage] = useState(null);
  const [allCustomers, setAllCustomers] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingCustomers, setLoadingCustomers] = useState(true);

  // Add this with your other useMemo declarations
const productMap = useMemo(() => {
  const map = new Map();
  allProducts.forEach(p => map.set(p.name, p));
  return map;
}, [allProducts]);

// ADD THIS MISSING CUSTOMER MAP
const customerMap = useMemo(() => {
  const map = new Map();
  allCustomers.forEach(c => map.set(c._id, c));
  return map;
}, [allCustomers]);

useEffect(() => {
  const fetchData = async () => {
    try {
      console.log("🔄 Starting to fetch products and customers...");
      
      // Use the new fast route for products, keep existing for customers
      const [productsResponse, customersResponse] = await Promise.all([
        axiosInstance.get("/products/dropdown-products"), // NEW FAST ROUTE
        axiosInstance.get("/customers/all/dropdown")
      ]);
      
      console.log("✅ Products fetched:", productsResponse.data.length, "items");
      console.log("✅ Customers fetched:", customersResponse.data.length, "items");
      
      setAllProducts(productsResponse.data);
      setAllCustomers(customersResponse.data);
    } catch (error) {
      console.error("❌ Error fetching data:", error);
      
      // If new route fails, fallback to old route
      if (error.response?.status === 404) {
        console.log("🔄 New route not found, falling back to old route...");
        try {
          const fallbackResponse = await axiosInstance.get("/products/all-backend-products");
          setAllProducts(fallbackResponse.data);
          setAllCustomers([]); // Or fetch customers separately
        } catch (fallbackError) {
          console.error("❌ Fallback also failed:", fallbackError);
          toast.error("Failed to load products");
        }
      } else {
        toast.error(`Failed to load data: ${error.message}`);
      }
    } finally {
      setLoadingProducts(false);
      setLoadingCustomers(false);
    }
  };

  fetchData();
}, []);
useEffect(() => {


  // ✅ Handle auto-fill from Proforma Invoice
  const state = location.state;
  if (state?.fromProforma && state.invoice) {
    const invoice = state.invoice;

    const customer = allCustomers.find(c => c.name === invoice.customerName);

   setClientDetails((prev) => ({
  ...prev,
  customerId: customer?._id || "",
  customerName: invoice.customerName || "",
  billTo: invoice.billTo || "",
  shipTo: invoice.shipTo || "",
  sameAsBillTo: invoice.billTo === invoice.shipTo,
  po: invoice.invoiceNo || "",
  deliveryOption: "", // Reset delivery option
  date: new Date().toISOString().split("T")[0],
  remarks: invoice.remarks || "",
}));
// ✅ Auto-map payment terms from Proforma
// ✅ Auto-map payment terms from Proforma
if (invoice.paymentTerms || invoice.customPaymentTerm) {
  const piPaymentTerm = invoice.paymentTerms || invoice.customPaymentTerm;
  
  // Check if it matches any of the standard options
  const standardTerms = [
    "100% Advance",
    "Cash on Delivery (Driver to get Cash payment on delivery)",
    "PDC (Cheque on Delivery) - Driver to get cheque on delivery on material",
    "50% Advance & Balance 50% before Dispatch against PI",
    "Credit (Udhaar): 45 Days"
  ];
  
  if (standardTerms.includes(piPaymentTerm)) {
    setPaymentTerms(piPaymentTerm);
    setCustomPaymentTerms("");
  } else {
    // It's a custom term
    setPaymentTerms("Other");
    setCustomPaymentTerms(piPaymentTerm);
  }
}

    const freightType = (invoice.freightType || "").toLowerCase().trim();

    if (Array.isArray(invoice.products)) {
  const products = invoice.products.map((prod) => ({
    product: prod.name || "",
    customProduct: "",
    size: "",
    customSize: "",
    quantity: prod.qty?.toString() || "",
    price: prod.rate?.toString() || "",
    density: "",
    packagingCharge: invoice.packagingCharge || "",

    // ✅ Freight logic based on freightType

freight:
  freightType === "paid" || freightType === "freight paid"
    ? "Freight Paid"
    : freightType === "self pickup" || freightType === "self dispatch"
    ? "Self Dispatch"
    : freightType === "to pay"
    ? "To pay"
    : freightType === "billed"
    ? "Billed in Invoice"
    : "",

freightAmount:
  freightType === "billed" || freightType === "to pay"
    ? invoice.freight || ""
    : "",


    // ✅ Product images
    productImages:
      Array.isArray(prod.productImages) && prod.productImages.length > 0
        ? prod.productImages
        : Array.isArray(prod.images) && prod.images.length > 0
        ? prod.images
        : [],

    // ✅ Remarks
    productRemarks: prod.narration || prod.remarks || "",
    narration: prod.narration || "", // ✅ Auto-fill narration text
    // ✅ Narration images
    narrationImages:
      Array.isArray(prod.narrationImages) && prod.narrationImages.length > 0
        ? prod.narrationImages
        : [],
  }));

  setProductList(products);
}

  }
}, [location,allCustomers]);


// Function to mark an invoice as converted
const markInvoiceAsConverted = (invoiceId) => {
  const updated = [...convertedInvoices, invoiceId];
  setConvertedInvoices(updated);
  localStorage.setItem('convertedInvoices', JSON.stringify(updated));
};

  const customerOptions = useMemo(() => {
    if (loadingCustomers) {
      return [{ label: "Loading customers...", value: "" }];
    }
   return [
  ...allCustomers.map((c) => ({
    label: c.name,
    value: c._id,     // ✅ use ObjectId
    name: c.name,     // keep name separately
  })),
  { label: "Other (Custom Customer)", value: "custom" },
];

  }, [allCustomers, loadingCustomers]);

const productOptions = useMemo(() => {
  if (loadingProducts) {
    return [{ label: "Loading products...", value: "" }];
  }
  
  // Use Set for faster deduplication and Map for faster lookup
  const uniqueProducts = [];
  const seen = new Set();
  
  allProducts.forEach((p) => {
    if (!seen.has(p.name)) {
      seen.add(p.name);
      uniqueProducts.push({
        label: p.name,
        value: p.name,
      });
    }
  });
  
  return [
    ...uniqueProducts,
    { label: "Other (Custom Product)", value: "custom" },
  ];
}, [allProducts, loadingProducts]);


const handleClientChange = (e) => {
  const { name, value, type, files, checked } = e.target;

  if (type === "file") {
    const file = files[0];
    const acceptedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/jpg",
      "image/png",
    ];

    if (!acceptedTypes.includes(file.type)) {
      toast.error("Only PDF or image files (JPG, PNG) are allowed.");
      return;
    }

    if (file.size === 0 || file.size < 1000) {
      toast.error("File is empty or corrupted. Please upload a valid file.");
      return;
    }

    setClientDetails({ ...clientDetails, [name]: file });
  } 
  else if (name === "deliveryOption") {
    let deliveryDate = "";
    
    if (value === "1week") {
      deliveryDate = getLastWorkingDay(7);
    } 
    else if (value === "2weeks") {
      deliveryDate = getLastWorkingDay(14);
    }
    else if (value === "particular") {
      deliveryDate = "";
    }
    
    setClientDetails({
      ...clientDetails,
      deliveryOption: value,
      deliveryRange: value,
      date: deliveryDate,
    });
  }
  else if (name === "date" && clientDetails.deliveryOption === "particular") {
    setClientDetails({
      ...clientDetails,
      date: value,
    });
  }
  else if (name === "sameAsBillTo") {
    const selectedCustomer = allCustomers.find(
      (c) => c.name === clientDetails.customerName
    );

    const updatedDetails = {
      ...clientDetails,
      sameAsBillTo: checked,
    };

    if (checked && selectedCustomer) {
      updatedDetails.billTo = selectedCustomer.address;
      updatedDetails.shipTo = selectedCustomer.address;
    }
    else if (!checked) {
      updatedDetails.shipTo = "";
    }

    setClientDetails(updatedDetails);
  }
  else if (name === "billTo") {
    const updatedDetails = {
      ...clientDetails,
      billTo: value,
    };
    
    if (clientDetails.sameAsBillTo && value) {
      updatedDetails.shipTo = value;
    }
    
    setClientDetails(updatedDetails);
  }
  else {
    setClientDetails({ ...clientDetails, [name]: value });
  }
};

// Helper function to get last working day (excluding Sunday)
const getLastWorkingDay = (daysFromNow) => {
  let date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  
  // If the calculated date is Sunday (0), go back to Saturday (6)
  if (date.getDay() === 0) {
    date.setDate(date.getDate() - 1);
  }
  
  return date.toISOString().split("T")[0];
};

const handleProductChange = async (index, field, value) => {
  const updated = [...productList];
  const product = productMap.get(value);

  if (field === "product" && product) {
    const BASE_URL = import.meta.env.VITE_REACT_APP_API_URL;
    const imageList = Array.isArray(product.images)
      ? product.images.map((img) =>
          img.startsWith("http") ? img : `${BASE_URL}${img}`
        )
      : [];

    updated[index] = {
      ...updated[index],
      product: product.name,
      customProduct: "",
      size: "",
      customSize: "",
    };
  } else if (field === "customProduct") {
    updated[index] = {
      ...updated[index],
      product: "",
      customProduct: value,
    };
  } else {
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
  }

  setProductList(updated);
};

 const addAnotherProduct = () => {
  setProductList([
    ...productList,
    {
      product: "",
      customProduct: "",
      size: "",
      customSize: "",
      quantity: "",
      price: "",
      density: "",
      productRemarks: "",
      narration: "",
      narrationImages: [],
      // ❌ REMOVE packagingCharge, freight, freightAmount, productImages
    },
  ]);
};

  const removeProduct = (index) => {
    const updated = productList.filter((_, i) => i !== index);
    setProductList(updated);
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  setIsSubmitting(true);

  // Validate at least one product
  if (productList.length === 0 || productList.some((prod) => !(prod.product || prod.customProduct) || !prod.quantity || !prod.price)) {
    toast.error("Please fill at least one complete product entry.");
    setIsSubmitting(false);
    return;
  }

  try {
    const formData = new FormData();
    formData.append("customerId", clientDetails.customerId);
    formData.append("customerName", clientDetails.customerName);
    formData.append("po", clientDetails.po);
    formData.append("date", clientDetails.date);
    formData.append("remarks", clientDetails.remarks);
    formData.append("billTo", clientDetails.billTo);
    formData.append("shipTo", clientDetails.shipTo);
    formData.append("deliveryOption", clientDetails.deliveryOption || "");
    
    // Common fields for the entire order
    formData.append("freight", commonFreight);
    formData.append("freightAmount", commonFreightAmount);
    formData.append("packagingCharge", commonPackagingCharge);
    
    formData.append(
      "paymentTerms",
      paymentTerms === "Other" ? customPaymentTerms : paymentTerms
    );
    
    // Send ALL products as an array in a single order
    const modifiedProductList = productList.map((prod) => ({
      product: prod.product === "" ? prod.customProduct : prod.product,
      size: prod.size === "" ? prod.customSize : prod.size,
      quantity: prod.quantity,
      price: prod.price,
      density: prod.density,
      productRemarks: prod.productRemarks,
      narration: prod.narration || "",
      narrationImages: prod.narrationImages || [],
    }));
    
    formData.append("products", JSON.stringify(modifiedProductList));

    const response = await axiosInstance.post("/orders/multi-product", formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      },
    });

    // Upload PO files
    if (clientDetails.poCopy.length > 0) {
      for (const file of clientDetails.poCopy) {
        const poForm = new FormData();
        poForm.append("poCopy", file);
        await axiosInstance.post(
          `/files/upload/po-copy/${response.data.order._id}`,
          poForm,
          { headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" } }
        );
      }
    }

    toast.success("Order submitted!");
    navigate("/orders", { 
      state: { scrollToOrderId: response.data.order._id, scrollToSection: true },
      replace: true 
    });

  } catch (err) {
    console.error("Order submission error:", err);
    toast.error(err.response?.data?.message || "Failed to submit order");
  } finally {
    setIsSubmitting(false);
  }
};

// Also add this to handle the case when user cancels the order
const handleCancel = () => {
  // Clean up the localStorage if user cancels
  localStorage.removeItem('convertingInvoiceId');
  navigate("/orders");
};

// Add the ConversionTracker utility at the top of the AddOrder component file
const ConversionTracker = {
  // Get all converted invoices
  getConvertedInvoices: () => {
    try {
      const saved = localStorage.getItem('convertedInvoices');
      return saved ? JSON.parse(saved) : {};
    } catch (error) {
      console.error("Error loading converted invoices:", error);
      return {};
    }
  },
  
  // Mark an invoice as converted
  markAsConverted: (invoiceId) => {
    try {
      const converted = ConversionTracker.getConvertedInvoices();
      converted[invoiceId] = true;
      localStorage.setItem('convertedInvoices', JSON.stringify(converted));
      return true;
    } catch (error) {
      console.error("Error marking invoice as converted:", error);
      return false;
    }
  },
  
  // Check if an invoice is converted
  isConverted: (invoiceId) => {
    const converted = ConversionTracker.getConvertedInvoices();
    return !!converted[invoiceId];
  }
};
 
if (loadingProducts || loadingCustomers) {
  return (
    <>
      <InternalNavbar />
      <div className="max-w-5xl mx-auto p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-blue-700 font-semibold">Loading products and customers...</p>
          </div>
        </div>
      </div>
    </>
  );
}

  return (
    <>
      <InternalNavbar />
      <div className="max-w-5xl mx-auto p-6">
        <h2 className="text-3xl md:text-4xl font-bold mb-6 text-center">
          Add New Order
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
<div className="flex items-center justify-center flex-col gap-4">

           {/* Customer Dropdown */}
<Select
  options={customerOptions} // ✅ CORRECT PROP
  placeholder={loadingCustomers ? "Loading customers..." : "Select Customer"}
  value={
    customerOptions.find((opt) => opt.value === clientDetails.customerId) || null
  }
  onChange={(selected) => {
    if (selected.value === "custom") {
      setClientDetails({ 
        ...clientDetails, 
        customerId: "", 
        customerName: "", 
        billTo: "", 
        shipTo: "" 
      });
    } else {
      const selectedCustomer = allCustomers.find((c) => c._id === selected.value);
      setClientDetails((prev) => ({
        ...prev,
        customerId: selected.value,
        customerName: selected.label, // Use label instead of name
        billTo: prev.sameAsBillTo && selectedCustomer ? selectedCustomer.address : prev.billTo,
        shipTo: prev.sameAsBillTo && selectedCustomer ? selectedCustomer.address : prev.shipTo,
      }));
    }
  }}
  className="w-full"
  classNamePrefix="react-select"
/>

{/* After customer dropdown */}
{/* Then use it here */}
{clientDetails.customerId && clientDetails.customerId !== "custom" && (
  <div className="text-sm text-gray-600 mt-1">
    Customer Address: {
      customerMap.get(clientDetails.customerId)?.address || "Not available"
    }
  </div>
)}
            <input
              name="po"
              placeholder="P/O Number"
              value={clientDetails.po}
              onChange={handleClientChange}
              required
              className="border border-gray-400 p-2 rounded w-full"
            />
           <div className="mb-4">
  <label className="block font-medium mb-1 text-gray-700">Payment Terms</label>
 <select
  className="w-full border border-gray-300 rounded px-3 py-2"
  value={
    paymentTerms &&
    ![
      "100% Advance",
      "Cash on Delivery (Driver to get Cash payment on delivery)",
      "PDC (Cheque on Delivery) - Driver to get cheque on delivery on material",
      "50% Advance & Balance 50% before Dispatch against PI",
      "Credit (Udhaar): 45 Days"
    ].includes(paymentTerms)
      ? "Other"
      : paymentTerms
  }
  onChange={(e) => {
    setPaymentTerms(e.target.value);
    if (e.target.value === "Other") {
      setCustomPaymentTerms(paymentTerms); // set previous value into input
    } else {
      setCustomPaymentTerms(""); // clear custom input
    }
  }}
>

   <option value="">-- Select Payment Terms --</option>
<option value="100% Advance">
  1) 100% Advance
</option>
<option value="Cash on Delivery (Driver to get Cash payment on delivery)">
  2) Cash on Delivery (Driver to get Cash payment on delivery)
</option>
<option value="PDC (Cheque on Delivery) - Driver to get cheque on delivery on material">
  3) PDC (Cheque on Delivery) - Driver to get cheque on delivery on material
</option>
<option value="50% Advance & Balance 50% before Dispatch against PI">
  4) 50% Advance & Balance 50% before Dispatch against PI
</option>
<option value="Credit (Udhaar): 45 Days">
  5) Credit (Udhaar): 45 Days
</option>
    <option value="Other">6) Other (Write in remarks)</option>
  </select>

  {paymentTerms === "Other" && (
    <input
      type="text"
      className="w-full mt-2 border border-gray-300 rounded px-3 py-2"
      placeholder="Enter custom payment terms"
      value={customPaymentTerms}
      onChange={(e) => setCustomPaymentTerms(e.target.value)}
    />
  )}
</div>

            </div>
           <input
  type="file"
  name="poCopy"
  multiple
  accept=".pdf,.png,.jpg,.jpeg"
  onChange={(e) => {
    const selectedFiles = Array.from(e.target.files);
    const validTypes = ["application/pdf", "image/jpeg", "image/png"];

    const filtered = selectedFiles.filter(
      (file) => validTypes.includes(file.type) && file.size > 1000
    );

    if (filtered.length !== selectedFiles.length) {
      toast.error("Some files were skipped (invalid type or size).");
    }

    setClientDetails((prev) => ({
      ...prev,
      poCopy: [...prev.poCopy, ...filtered],
    }));
  }}
  className="col-span-2 bg-green-100 cursor-pointer p-2 rounded"
/>

{clientDetails.poCopy.length > 0 && (
  <div className="col-span-2">
    <p className="text-sm text-gray-600 font-medium">Attached Files:</p>
    <div className="flex flex-wrap gap-4 mt-2">
      {clientDetails.poCopy.map((file, index) => (
        <div key={index} className="relative border p-2 rounded">
          {file.type.includes("image") ? (
            <img
              src={URL.createObjectURL(file)}
              alt={`Preview ${index}`}
              className="w-24 h-24 object-cover rounded"
            />
          ) : (
            <div className="w-24 h-24 flex items-center justify-center bg-gray-100 text-xs text-gray-700 rounded">
              {file.name}
            </div>
          )}
          <button
            type="button"
            onClick={() => {
              const updatedFiles = [...clientDetails.poCopy];
              updatedFiles.splice(index, 1);
              setClientDetails((prev) => ({
                ...prev,
                poCopy: updatedFiles,
              }));
            }}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  </div>
)}


{/* ✅ Ship to same as Bill To checkbox */}
{/* ✅ Checkbox */}
<div className="flex items-center gap-2 col-span-2">
  <input
    type="checkbox"
    id="sameAsBillTo"
    name="sameAsBillTo"
    checked={clientDetails.sameAsBillTo}
    onChange={handleClientChange}
  />
  <label htmlFor="sameAsBillTo" className="text-sm text-gray-700">
    🚚 Ship to same as Bill To
  </label>
</div>

{/* 🔄 Show both if checkbox is unchecked */}
{!clientDetails.sameAsBillTo && (
  <>
    {/* 🧾 Bill To Address */}
    <div className="flex flex-col col-span-2">
      <label htmlFor="billTo" className="mb-1 font-medium text-gray-700">
        🧾 Bill To Address
      </label>
      <input
        id="billTo"
        name="billTo"
        placeholder="Enter Bill To Address"
        value={clientDetails.billTo}
        onChange={handleClientChange}
        className="border border-gray-400 p-2 rounded w-full"
        required
      />
    </div>

    {/* 🚚 Ship To Address */}
    <div className="flex flex-col col-span-2">
      <label htmlFor="shipTo" className="mb-1 font-medium text-gray-700">
        🚚 Ship To Address
      </label>
      <input
        id="shipTo"
        name="shipTo"
        placeholder="Enter Ship To Address"
        value={clientDetails.shipTo}
        onChange={handleClientChange}
        className="border border-gray-400 p-2 rounded w-full"
        required
      />
    </div>
  </>
)}





           <div className="flex flex-col col-span-2">
  <label className="mb-1 font-medium text-gray-700">Delivery Time (Material required by Customer on Date?)</label>
  <select
    name="deliveryOption"
    value={clientDetails.deliveryOption || ""}
    onChange={handleClientChange}
    className="p-2 border border-gray-400 rounded mb-2"
  >
    <option value="">Select Delivery Option</option>
    <option value="1week">Within 1 Week (Last Working Day)</option>
    <option value="2weeks">Within 2 Weeks (Last Working Day)</option>
    <option value="particular">Particular Date (Select a Particular Date)</option>
  </select>
  
  {clientDetails.deliveryOption === "particular" && (
    <input
      type="date"
      name="date"
      value={clientDetails.date}
      onChange={handleClientChange}
      min={new Date().toISOString().split("T")[0]}
      className="border border-gray-400 p-2 rounded"
      required
    />
  )}
  
  {clientDetails.deliveryOption && clientDetails.deliveryOption !== "particular" && (
    <div className="text-sm text-green-600 mt-1">
      Delivery Date: {clientDetails.date || "Calculating..."}
    </div>
  )}
</div>
            <textarea
              name="remarks"
              placeholder="Remarks"
              value={clientDetails.remarks}
              onChange={handleClientChange}
              className="col-span-2 p-2 border border-gray-400 rounded"
            ></textarea>
          </div>
{/* ========== COMMON FREIGHT SECTION - MOVED BEFORE PRODUCTS ========== */}
<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mt-4 sm:mt-6 p-3 sm:p-4 bg-blue-50 rounded-lg border border-blue-200">
  <div className="col-span-1 sm:col-span-2">
    <h3 className="text-base sm:text-lg font-bold text-blue-800 mb-1 sm:mb-2">🚚 Common Order Charges (Applies to All Products)</h3>
    <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3">These charges will be applied once for the entire order</p>
  </div>

  {/* Freight Type */}
  <div className="flex flex-col">
    <label className="mb-1 text-xs sm:text-sm font-medium text-gray-700">Freight Type</label>
    <select
      value={commonFreight}
      onChange={(e) => {
        setCommonFreight(e.target.value);
        if (e.target.value !== "To pay" && e.target.value !== "Billed in Invoice") {
          setCommonFreightAmount("");
        }
      }}
      className="border border-gray-400 p-2 sm:p-2.5 rounded text-sm sm:text-base"
      required
    >
      <option value="">Select Freight</option>
      <option value="To pay">To pay</option>
      <option value="Self Dispatch">Self Pickup</option>
      <option value="Freight Paid">Freight Paid</option>
      <option value="Billed in Invoice">Billed in Invoice</option>
    </select>
  </div>

  {/* Freight Amount (conditional) */}
  {(commonFreight === "To pay" || commonFreight === "Billed in Invoice") && (
    <div className="flex flex-col">
      <label className="mb-1 text-xs sm:text-sm font-medium text-gray-700">
        {commonFreight === "To pay" ? "Freight Amount to Pay" : "Freight Amount Billed"}
      </label>
      <input
        type="number"
        value={commonFreightAmount}
        onChange={(e) => setCommonFreightAmount(e.target.value)}
        placeholder="Enter amount"
        className="border border-gray-400 p-2 sm:p-2.5 rounded text-sm sm:text-base"
        required
        min="0"
        step="0.01"
      />
    </div>
  )}

  {/* Packaging Charge */}
  <div className="flex flex-col">
    <label className="mb-1 text-xs sm:text-sm font-medium text-gray-700">Packaging Charge (Common)</label>
    <input
      type="number"
      value={commonPackagingCharge}
      onChange={(e) => setCommonPackagingCharge(e.target.value)}
      placeholder="Packaging Charge"
      className="border border-gray-400 p-2 sm:p-2.5 rounded text-sm sm:text-base"
      min="0"
      step="0.01"
    />
  </div>
</div>

          <h3 className="text-xl font-semibold mt-4">Product Details</h3>
        {productList.map((prod, index) => (
  <div
    key={index}
    className="bg-gray-50 p-4 border border-gray-400 rounded-md space-y-4 md:space-y-0 md:grid md:grid-cols-2 md:gap-4"
  >
    {/* Product Selector */}
    <div className="flex flex-col">
      <label className="mb-1 font-medium text-gray-700">Product</label>
      <Select
        options={productOptions}
        isDisabled={loadingProducts}
        placeholder={loadingProducts ? "Loading products..." : "Select Product"}
        value={
          prod.product
            ? productOptions.find((opt) => opt.value === prod.product)
            : prod.customProduct
            ? { label: "Other (Custom Product)", value: "custom" }
            : null
        }
        onChange={(selectedOption) => {
          if (selectedOption.value === "custom") {
            handleProductChange(index, "customProduct", "");
          } else {
            handleProductChange(index, "product", selectedOption.value);
          }
        }}
        className="w-full"
        classNamePrefix="react-select"
      />
    </div>

    {/* Custom Product */}
    {!prod.product && (
      <div className="flex flex-col">
        <label className="mb-1 font-medium text-gray-700">Custom Product</label>
        <input
          type="text"
          value={prod.customProduct}
          placeholder="Enter Custom Product"
          onChange={(e) => handleProductChange(index, "customProduct", e.target.value)}
          className="border border-gray-400 p-2 rounded"
          required={!prod.product}
        />
      </div>
    )}

    {/* Size */}
    <div className="flex flex-col">
      <label className="mb-1 font-medium text-gray-700">Size</label>
      <input
        type="text"
        value={prod.size}
        placeholder="Size"
        onChange={(e) => handleProductChange(index, "size", e.target.value)}
        className="border border-gray-400 p-2 rounded"
      />
    </div>

    {/* Quantity */}
    <div className="flex flex-col">
      <label className="mb-1 font-medium text-gray-700">Quantity</label>
      <input
        type="number"
        value={prod.quantity}
        placeholder="Qty"
        onChange={(e) => handleProductChange(index, "quantity", e.target.value)}
        className="border border-gray-400 p-2 rounded"
        required
        min={1}
      />
    </div>

    {/* Price */}
    <div className="flex flex-col">
      <label className="mb-1 font-medium text-gray-700">Price per unit</label>
      <input
        type="number"
        value={prod.price}
        placeholder="Price"
        onChange={(e) => handleProductChange(index, "price", e.target.value)}
        className="border border-gray-400 p-2 rounded"
        required
        min={0}
        step="0.01"
      />
    </div>

    {/* Density */}
    <div className="flex flex-col">
      <label className="mb-1 font-medium text-gray-700">Density (kg/m³)</label>
      <input
        type="text"
        value={prod.density}
        placeholder="e.g., 12"
        onChange={(e) => handleProductChange(index, "density", e.target.value)}
        className="border border-gray-400 p-2 rounded"
      />
    </div>

    {/* Product Remarks */}
    <div className="col-span-2">
      <label className="mb-1 font-medium text-gray-700">Product Remarks</label>
      <textarea
        value={prod.productRemarks}
        placeholder="Remarks for this product"
        onChange={(e) => handleProductChange(index, "productRemarks", e.target.value)}
        className="w-full border border-gray-400 p-2 rounded"
        rows={2}
      />
    </div>

    {/* Narration Images */}
    <div className="col-span-2">
      <label className="mb-1 font-medium text-gray-700">Narration Images</label>
      <input
        type="file"
        multiple
        accept="image/*"
        onChange={async (e) => {
          const files = Array.from(e.target.files);
          const updated = [...productList];
          
          setIsUploading(true);
          const options = {
            maxSizeMB: 0.4,
            maxWidthOrHeight: 800,
            useWebWorker: true,
            fileType: 'image/jpeg',
            initialQuality: 0.6,
          };

          try {
            for (const file of files) {
              if (!file.type.match('image.*')) continue;
              const compressedFile = await imageCompression(file, options);
              const formData = new FormData();
              formData.append("file", compressedFile);
              formData.append("upload_preset", "narration_upload_preset");
              const res = await fetch(`https://api.cloudinary.com/v1_1/dcr8k5amk/image/upload`, {
                method: "POST",
                body: formData,
              });
              const data = await res.json();
              if (data.secure_url) {
                const currentNarrationImages = Array.isArray(updated[index].narrationImages) 
                  ? updated[index].narrationImages 
                  : [];
                updated[index].narrationImages = [...currentNarrationImages, data.secure_url];
              }
            }
          } catch (err) {
            toast.error(`Upload failed: ${err.message}`);
          } finally {
            setIsUploading(false);
            setProductList(updated);
          }
        }}
        className="w-full border border-gray-400 p-2 rounded"
      />
      
      {prod.narrationImages?.length > 0 && (
        <div className="flex flex-wrap gap-4 mt-2">
          {prod.narrationImages.map((img, i) => (
            <div key={i} className="relative border p-2 rounded">
              <img
                src={img}
                alt={`Narration ${i + 1}`}
                onClick={() => setModalImage(img)}
                className="w-24 h-24 object-cover rounded cursor-pointer hover:scale-105 transition"
              />
              <button
                type="button"
                onClick={() => {
                  const updated = [...productList];
                  updated[index].narrationImages.splice(i, 1);
                  setProductList(updated);
                }}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>

    {/* Remove Button */}
    <button
      type="button"
      onClick={() => removeProduct(index)}
      className="w-full text-white bg-red-600 rounded cursor-pointer font-bold text-xl mt-2 md:mt-0"
      aria-label={`Remove product ${index + 1}`}
    >
      &times;
    </button>
  </div>
))}


          

          <button
            type="button"
            onClick={addAnotherProduct}
            className="mt-2 px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
          >
            + Add Another Product
          </button>

          {/* Submit Buttons */}
          <div className="flex justify-center gap-4 mt-6">
            {isSubmitting ? (
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 border-4 border-blue-300 border-t-blue-600 rounded-full animate-spin"></div>
                <p className="text-blue-700 font-semibold">Submitting...</p>
              </div>
            ) : (
              <>
                <button
                  type="submit"
                  className="bg-green-600 text-white px-8 py-3 rounded hover:bg-green-700"
                >
                  Submit
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="bg-gray-500 text-white px-8 py-3 rounded hover:bg-gray-600"
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </form>
      </div>
   {modalImage && (
  <div
    className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50"
    onClick={() => setModalImage(null)}
  >
    <img
      src={modalImage}
      alt="Full view"
      className="max-w-full max-h-full rounded shadow-lg"
    />
  </div>
)}


    </>
  );
}
