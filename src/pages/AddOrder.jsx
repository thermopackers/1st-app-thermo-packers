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
  const [clientDetails, setClientDetails] = useState({
    customerName: "",
    po: "",
  poCopy: [], // ✅ now an array
    deliveryRange: "",
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
      packagingCharge: "",
      freight: "",
      freightAmount: "",
          productImages: [], // ✅ ensure this is initialized
    productRemarks: "", // 💬 new field
        narration: "", // ✅ New field for narration text
    narrationImages: [], // Add this line
    },
  ]);
  const [allProducts, setAllProducts] = useState([]);
  const [modalImage, setModalImage] = useState(null);
  const [allCustomers, setAllCustomers] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
console.log("allProducts",allProducts);
console.log("productList",productList);

useEffect(() => {
  const fetchProductSizes = async () => {
    try {
      const response = await axiosInstance.get("/products/all-backend-products");
      setAllProducts(response.data);
    } catch (error) {
      console.error("Error fetching product sizes:", error);
    } finally {
      setLoadingProducts(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await axiosInstance.get("/customers/all/dropdown");
      setAllCustomers(response.data);
    } catch (error) {
      console.error("Error fetching customers:", error);
    } finally {
      setLoadingCustomers(false);
    }
  };

  fetchProductSizes();
  fetchCustomers();

  // ✅ Handle auto-fill from Proforma Invoice
  const state = location.state;
  if (state?.fromProforma && state.invoice) {
    const invoice = state.invoice;
console.log("invoice",invoice);

    setClientDetails((prev) => ({
      ...prev,
      customerName: invoice.customerName || "",
      billTo: invoice.billTo || "",
      shipTo: invoice.shipTo || "",
      sameAsBillTo: invoice.billTo === invoice.shipTo,
      po: invoice.invoiceNo || "",
      date: new Date().toISOString().split("T")[0],
      remarks: invoice.remarks || "",
    }));
// ✅ Auto-map payment terms from Proforma
if (invoice.customPaymentTerm) {
  setPaymentTerms("Other");
  setCustomPaymentTerms(invoice.customPaymentTerm); // ✅ shows "544"
} else if (Array.isArray(invoice.paymentTerms)) {
  const term = invoice.paymentTerms[0]?.toString().toLowerCase();
  if (term.includes("100%")) {
    setPaymentTerms("Payment already came 100% Advance");
  } else if (term.includes("credit")) {
    setPaymentTerms("Credit (Udhaar): 45 Days");
  } else if (term.includes("cheque") || term.includes("pdc")) {
    setPaymentTerms(
      "PDC (Cheque on Delivery) - Driver to get cheque on delivery on material"
    );
  } else {
    setPaymentTerms(invoice.paymentTerms[0]); // fallback
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
}, [location]);



  const customerOptions = useMemo(() => {
    if (loadingCustomers) {
      return [{ label: "Loading customers...", value: "" }];
    }
    return [
      ...allCustomers.map((c) => ({
        label: c.name,
        value: c.name,
      })),
      { label: "Other (Custom Customer)", value: "custom" },
    ];
  }, [allCustomers, loadingCustomers]);

  const productOptions = useMemo(() => {
    if (loadingProducts) {
      return [{ label: "Loading products...", value: "" }];
    }
    return [
      ...allProducts.map((p) => ({
        label: p.name,
        value: p.name,
      })),
      { label: "Other (Custom Product)", value: "custom" },
    ];
  }, [allProducts, loadingProducts]);
const options = useMemo(() => {
  if (loadingProducts) {
    return [{ label: 'Loading products...', value: '' }];
  }
  return [
    ...allProducts.map((p) => ({
      label: p.name,
      value: p.name,
    })),
    { label: 'Other (Custom Product)', value: 'custom' },
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
} else if (name === "deliveryRange") {
    const days =
      value === "1week"
        ? 7
        : value === "2weeks"
        ? 14
        : value === "20days"
        ? 20
        : 0;
    const today = new Date();
    today.setDate(today.getDate() + days);
    setClientDetails({
      ...clientDetails,
      deliveryRange: value,
      date: today.toISOString().split("T")[0],
    });
  }
  // ✅ Checkbox: Same as Bill To
 else if (name === "sameAsBillTo") {
  const selectedCustomer = allCustomers.find(
    (c) => c.name === clientDetails.customerName
  );

  const updatedDetails = {
    ...clientDetails,
    sameAsBillTo: checked,
    billTo: checked && selectedCustomer ? selectedCustomer.address : clientDetails.billTo,
    shipTo: checked && selectedCustomer ? selectedCustomer.address : "",
  };

  setClientDetails(updatedDetails);
}


  // ✅ Bill To change should update Ship To if checkbox is checked
  else if (name === "billTo") {
    const updatedDetails = {
      ...clientDetails,
      billTo: value,
    };
    if (clientDetails.sameAsBillTo) {
      updatedDetails.shipTo = value;
    }
    setClientDetails(updatedDetails);
  } else {
    setClientDetails({ ...clientDetails, [name]: value });
  }
};

const handleProductChange = async (index, field, value) => {
  const updated = [...productList]; // make shallow copy

  const product = allProducts.find((p) => p.name === value);

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
    productImages: imageList,
  };

  const updatedSizesList = [...availableSizesList];
  updatedSizesList[index] = product.sizes || [];
  setAvailableSizesList(updatedSizesList);

  // ✅ Auto-fill last price if customer is selected
  const customerName = clientDetails.customerName;
  if (customerName && product.name) {
    try {
      const res = await axiosInstance.get(
        `/orders/last-price?customerName=${encodeURIComponent(
          customerName
        )}&product=${encodeURIComponent(product.name)}`
      );
      if (res.data?.price) {
        updated[index].price = res.data.price;
        toast.success(`💰 Last price auto-filled: ₹${res.data.price}`);
      }
    } catch (err) {
      console.warn("No previous price found for this customer and product.");
    }
  }
}


  else if (field === "customProduct") {
    updated[index] = {
      ...updated[index],
      product: "",
      customProduct: value,
      productImages: [],
    };
  }

  else {
    updated[index] = {
      ...updated[index],
      [field]: value,
    };

    if (
      field === "freight" &&
      value !== "To pay" &&
      value !== "Billed in Invoice"
    ) {
      updated[index]["freightAmount"] = "";
    }
  }

   setProductList(updated); // ✅ properly trigger re-render
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
        packagingCharge: "",
        freight: "",
        freightAmount: "",
              productImages: [], // ✅ here also

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

  // ✅ Validate product list
  if (
    productList.length === 0 ||
    productList.some((prod) => {
      const missingProduct = !(prod.product || prod.customProduct);
      const missingQuantity = !prod.quantity;
      const missingPrice = !prod.price;
      const missingFreight = !prod.freight;
      const needsFreightAmount =
        prod.freight === "To pay" || prod.freight === "Billed in Invoice";
      const missingFreightAmount = needsFreightAmount && !prod.freightAmount;
      return (
        missingProduct ||
        missingQuantity ||
        missingPrice ||
        missingFreight ||
        missingFreightAmount
      );
    })
  ) {
    toast.error(
      "Please fill at least one complete product entry including freight and amount if applicable."
    );
    setIsSubmitting(false);
    return;
  }

  try {
    // ✅ Prepare product data
    const modifiedProductList = productList.map((prod) => ({
      ...prod,
      product: prod.product === "" ? prod.customProduct : prod.product,
      size: prod.size === "" ? prod.customSize : prod.size,
      freightAmount:
        prod.freight === "To pay" || prod.freight === "Billed in Invoice"
          ? prod.freightAmount
          : 0,
           narration: prod.narration || "", // ✅ Ensure narration is sent
  narrationImages: prod.narrationImages || [], // ✅ Ensure narrationImages are sent
    }));

    // ✅ Submit order first (without file)
    const formData = new FormData();
    formData.append("customerName", clientDetails.customerName);
    formData.append("po", clientDetails.po);
    formData.append("date", clientDetails.date);
    formData.append("remarks", clientDetails.remarks);
    formData.append("products", JSON.stringify(modifiedProductList));
formData.append("billTo", clientDetails.billTo);
formData.append("shipTo", clientDetails.shipTo);
formData.append(
  "paymentTerms",
  paymentTerms === "Other" ? customPaymentTerms : paymentTerms
);

    const response = await axiosInstance.post("/orders/multi", formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      },
    });

    const createdOrder = response.data.orders[0];
 
  // ✅ Upload multiple PO files (images/pdfs) if present
if (clientDetails.poCopy.length > 0) {
  for (const file of clientDetails.poCopy) {
    const poForm = new FormData();
    poForm.append("poCopy", file);

    try {
      const poUploadRes = await axiosInstance.post(
        `/files/upload/po-copy/${createdOrder._id}`,
        poForm,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
     } catch (uploadErr) {
      console.error("❌ Failed to upload file:", file.name, uploadErr);
      toast.error(`Upload failed for: ${file.name}`);
    }
  }
}


    toast.success("Order submitted!");
        navigate("/dashboard", { replace: true });

  } catch (err) {
    console.error("Order submission error:", err);
  } finally {
    setIsSubmitting(false);
  }
};

  const handleCancel = () => {
    navigate("/orders");
  };
 
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
              options={customerOptions}
              placeholder={loadingCustomers ? "Loading customers..." : "Select Customer"}
              value={
                clientDetails.customerName &&
                customerOptions.find((opt) => opt.value === clientDetails.customerName) || null
              }
          onChange={(selected) => {
  if (selected.value === "custom") {
    setClientDetails({ ...clientDetails, customerName: "", billTo: "", shipTo: "" });
  } else {
    const selectedCustomer = allCustomers.find((c) => c.name === selected.value);
    setClientDetails((prev) => ({
      ...prev,
      customerName: selected.value,
      billTo: prev.sameAsBillTo && selectedCustomer ? selectedCustomer.address : prev.billTo,
      shipTo: prev.sameAsBillTo && selectedCustomer ? selectedCustomer.address : prev.shipTo,
    }));
  }
}}

              className="w-full"
              classNamePrefix="react-select"
            />

            {/* Manual Input for custom customer */}
            {/* {!customerOptions.some((opt) => opt.value === clientDetails.customerName) && (
              <input
                name="customerName"
                placeholder="Enter Customer Name"
                value={clientDetails.customerName}
                onChange={handleClientChange}
                required
                className="border border-gray-400 p-2 rounded w-full"
              />
            )} */}

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
      "Payment already came 100% Advance",
      "Cash on Delivery (Driver to get Cash payment on delivery)",
      "PDC (Cheque on Delivery) - Driver to get cheque on delivery on material",
      "50% Came and Balance 50% on delivery",
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
<option value="Payment already came 100% Advance">
  1) Payment already came 100% Advance
</option>
<option value="Cash on Delivery (Driver to get Cash payment on delivery)">
  2) Cash on Delivery (Driver to get Cash payment on delivery)
</option>
<option value="PDC (Cheque on Delivery) - Driver to get cheque on delivery on material">
  3) PDC (Cheque on Delivery) - Driver to get cheque on delivery on material
</option>
<option value="50% Came and Balance 50% on delivery">
  4) 50% Came and Balance 50% on delivery
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





            <select
              name="deliveryRange"
              required
              value={clientDetails.deliveryRange}
              onChange={handleClientChange}
              className="p-2 border border-gray-400 rounded"
            >
              <option value="">Delivery Time</option>
              <option value="1week">Within 1 Week</option>
              <option value="2weeks">Within 2 Weeks</option>
              <option value="20days">Within 20 Days</option>
            </select>
            <textarea
              name="remarks"
              required
              placeholder="Remarks"
              value={clientDetails.remarks}
              onChange={handleClientChange}
              className="col-span-2 p-2 border border-gray-400 rounded"
            ></textarea>
          </div>

          <h3 className="text-xl font-semibold mt-4">Product Details</h3>
          {productList.map((prod, index) => (
  <div
    key={index}
    className="bg-gray-50 p-4 border border-gray-400 rounded-md space-y-4 md:space-y-0 md:grid md:grid-cols-2 md:gap-4"
  >
    {/* 🧾 Product Selector */}
    <div className="flex flex-col">
      <label className="mb-1 font-medium text-gray-700">Product</label>
      <Select
        options={options}
        isDisabled={loadingProducts}
        placeholder={loadingProducts ? "Loading products..." : "Select Product"}
        value={
          prod.product
            ? options.find((opt) => opt.value === prod.product)
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

    {/* 🛠 Custom Product */}
    {!prod.product && (
      <div className="flex flex-col">
        <label className="mb-1 font-medium text-gray-700">Custom Product</label>
        <input
          type="text"
          value={prod.customProduct}
          placeholder="Enter Custom Product"
          onChange={(e) =>
            handleProductChange(index, "customProduct", e.target.value)
          }
          className="border border-gray-400 p-2 rounded"
          required={!prod.product}
        />
      </div>
    )}

    {/* 📦 Size Dropdown */}
    <div className="flex flex-col">
      <label className="mb-1 font-medium text-gray-700">Size</label>
      <select
        value={prod.size}
        onChange={(e) => handleProductChange(index, "size", e.target.value)}
        className="border p-2 rounded"
        disabled={prod.customSize.length > 0}
      >
        <option value="">Select Size</option>
        {(availableSizesList[index] || []).map((size, i) => (
          <option key={i} value={size}>
            {size}
          </option>
        ))}
      </select>
    </div>

    {/* 📐 Custom Size */}
    {!prod.size && (
      <div className="flex flex-col">
        <label className="mb-1 font-medium text-gray-700">Custom Size</label>
        <input
          type="text"
          value={prod.customSize}
          placeholder="Enter Custom Size"
          onChange={(e) =>
            handleProductChange(index, "customSize", e.target.value)
          }
          className="border border-gray-400 p-2 rounded"
        />
      </div>
    )}

    {/* 🔢 Quantity */}
    <div className="flex flex-col">
      <label className="mb-1 font-medium text-gray-700">Quantity</label>
      <input
        type="number"
        value={prod.quantity}
        placeholder="Qty"
        onChange={(e) =>
          handleProductChange(index, "quantity", e.target.value)
        }
        className="border border-gray-400 p-2 rounded"
        required
        min={1}
      />
    </div>

    {/* 💰 Price */}
    <div className="flex flex-col">
      <label className="mb-1 font-medium text-gray-700">Price</label>
      <input
        type="number"
        value={prod.price}
        placeholder="Price"
        onChange={(e) =>
          handleProductChange(index, "price", e.target.value)
        }
        className="border border-gray-400 p-2 rounded"
        required
        min={0}
        step="0.01"
      />
    </div>

    {/* ⚖️ Density */}
    <div className="flex flex-col">
      <label className="mb-1 font-medium text-gray-700">Density</label>
      <input
        type="number"
        value={prod.density}
        placeholder="Density"
        onChange={(e) =>
          handleProductChange(index, "density", e.target.value)
        }
        className="border border-gray-400 p-2 rounded"
        min={0}
        step="0.01"
      />
    </div>

    {/* 📦 Packaging Charge */}
    <div className="flex flex-col">
      <label className="mb-1 font-medium text-gray-700">Packaging Charge</label>
      <input
        type="number"
        value={prod.packagingCharge}
        placeholder="Packaging Charge"
        onChange={(e) =>
          handleProductChange(index, "packagingCharge", e.target.value)
        }
        className="border border-gray-400 p-2 rounded"
        min={0}
        step="0.01"
      />
    </div>

    {/* 🚚 Freight Type */}
    <div className="flex flex-col">
      <label className="mb-1 font-medium text-gray-700">Freight</label>
      <select
        value={prod.freight}
        onChange={(e) =>
          handleProductChange(index, "freight", e.target.value)
        }
        className="border border-gray-400 p-2 rounded"
        required
      >
        <option value="">Select Freight</option>
        <option value="To pay">To pay</option>
        <option value="Self Dispatch">Self Pickup</option>
        <option value="Freight Paid">Freight Paid</option>
        <option value="Billed in Invoice">Billed in Invoice</option>
      </select>
    </div>

    {/* 💸 Freight Amount */}
    {(prod.freight === "To pay" || prod.freight === "Billed in Invoice") && (
      <div className="flex flex-col">
        <label className="mb-1 font-medium text-gray-700">
          {prod.freight === "To pay"
            ? "Amount to pay"
            : "Amount billed in invoice"}
        </label>
        <input
          type="text"
          value={prod.freightAmount}
          onChange={(e) =>
            handleProductChange(index, "freightAmount", e.target.value)
          }
          className="border border-gray-400 p-2 rounded"
          min="0"
          step="0.01"
          required
        />
      </div>
    )}

    {/* 📝 Product Remarks */}
    <div className="col-span-2">
      <label className="mb-1 font-medium text-gray-700">Product Remarks</label>
      <textarea
        value={prod.productRemarks}
        placeholder="Remarks for this product"
        onChange={(e) =>
          handleProductChange(index, "productRemarks", e.target.value)
        }
        className="w-full border border-gray-400 p-2 rounded"
        rows={2}
      />
    </div>
   

    {/* 🖼 Image Preview */}
    {Array.isArray(prod.productImages) && prod.productImages.length > 0 && (
      <div className="col-span-2">
        <p className="text-sm text-gray-500 mb-2">
          Previewing {prod.productImages.length} image(s)
        </p>
        <div className="flex flex-wrap gap-4">
          {prod.productImages.map((img, i) => (
            <img
              key={i}
              src={img}
              alt={`${prod.product} ${i + 1}`}
              onClick={() =>
                setModalImage((prev) => (prev === img ? null : img))
              }
              className="w-32 h-32 object-cover border rounded cursor-pointer hover:scale-105 transition"
            />
          ))}
        </div>
      </div>
    )}

{/* 📝 Narration Images */}
<div className="col-span-2">
  <label className="mb-1 font-medium text-gray-700">Narration Images</label>
  <input
    type="file"
    multiple
    accept="image/*"
   onChange={async (e) => {
  const files = Array.from(e.target.files);
  const updated = [...productList];
  
  setIsUploading(true); // Show loader

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
        updated[index].narrationImages = [
          ...updated[index].narrationImages,
          data.secure_url
        ];
      }
    }
  } catch (err) {
    toast.error(`Upload failed: ${err.message}`);
  } finally {
    setIsUploading(false); // Hide loader
    setProductList(updated);
  }
}}
    className="w-full border border-gray-400 p-2 rounded"
  />
  {/* Simple Loader Overlay */}
{isUploading && (
  <div className="fixed inset-0 bg-[#0000008f] flex items-center justify-center z-50">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
  </div>
)}

{modalImage && (
  <div
    className="fixed inset-0 bg-[#0000008f] flex items-center justify-center z-50"
    onClick={() => setModalImage(null)}
  >
    <img
      src={modalImage}
      alt="Full view"
      className="max-w-full max-h-full rounded shadow-lg"
    />
  </div>
)}
  {/* Rest of the image preview code remains the same */}
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
  {/* ❌ Remove Button */}
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
