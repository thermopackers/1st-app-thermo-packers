import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Swal from 'sweetalert2';
import Select from "react-select";
import InternalNavbar from "./InternalNavbar";
import axiosInstance from "../axiosInstance";
import { useNavigate } from "react-router-dom";

export default function ProformaInvoiceForm() {
  const [productsList, setProductsList] = useState([]);
    const navigate = useNavigate(); // 👈 Initialize navigation
  const [loading, setLoading] = useState(false);
  const [narrationImages, setNarrationImages] = useState({});
  const [narrationUploadLoading, setNarrationUploadLoading] = useState({});
  const [selectedImages, setSelectedImages] = useState({});
  const [form, setForm] = useState({
    invoiceNo: `PI/${new Date().getFullYear().toString().slice(-2)}-${Math.floor(Math.random() * 1000)}`,
    date: new Date().toISOString().split("T")[0],
    billTo: "",
    shipTo: "",
    sameAddress: true,
    inPunjab: true,
      city: "",
  state: "",
  pincode: "",
    transportMode: "",
    destination: "",
    freight: 0,
      freightType: "", // new field to track selected checkbox
    packaging: 0,
    contact: "",
    remarks: "",
    products: [],
     paymentTerms: "",         // ⬅️ Array of selected terms
  customPaymentTerm: "",    // ⬅️ Dynamic input field
    customerEmail: "",         // ✅ add this field silently
  });
const [customers, setCustomers] = useState([]);

useEffect(() => {
  axiosInstance.get("/customers/all/dropdown")
    .then(res => {
      if (Array.isArray(res.data)) {
        setCustomers(res.data);
      } else {
        toast.error("Customer list not found");
      }
    })
    .catch(err => {
      console.error("Failed to load customers:", err);
      toast.error("Error loading customer list");
    });
}, []);

  const addProductRow = () => {
    setForm(prev => ({
      ...prev,
      products: [...prev.products, { productId: "", name: "", hsn: "", qty: 1, unit: "", rate: 0, gst: 0,  narration: "",narrationImages: []  }]
    }));
  };

  const removeProductRow = (index) => {
    const updated = [...form.products];
    updated.splice(index, 1);
    setForm(prev => ({ ...prev, products: updated }));
  };

const handleSubmit = async () => {
  if (form.products.length === 0) {
    toast.error("Please add at least one product before submitting.");
    return;
  }
  if (!form.billTo) {
    toast.error("Please select a customer.");
    return;
  }

  if (!form.transportMode.trim()) {
    toast.error("Please enter Mode of Transport.");
    return;
  }
 // ✅ Validate freightType
  if (!form.freightType) {
    toast.error("Please select a Freight Type.");
    return;
  }

  // ✅ Validate payment terms
  const hasPaymentTerms = form.paymentTerms.length > 0 || form.customPaymentTerm.trim() !== "";
  if (!hasPaymentTerms) {
    toast.error("Please select or enter at least one Payment Term.");
    return;
  }
  setLoading(true); // start loader

  try {
const updatedForm = {
  ...form,
  products: form.products.map((p, i) => ({
    ...p,
    images: selectedImages[i] || [],
      narrationImages: p.narrationImages || [] // ✅ Add this line

  }))
};

const res = await axiosInstance.post("/proforma/generate-proforma", updatedForm);
    toast.success("PDF generated!");
    window.open(res.data.pdfUrl, "_blank");

    // Clear form
    setForm({
      invoiceNo: `PI/${new Date().getFullYear().toString().slice(-2)}-${Math.floor(Math.random() * 1000)}`,
      date: new Date().toISOString().split("T")[0],
      billTo: "",
      shipTo: "",
      sameAddress: true,
      inPunjab: true,
      transportMode: "",
      destination: "",
      freight: 0,
      packaging: 0,
      contact: "",
      remarks: "",
      products: [],
    });

    navigate("/proforma-dashboard");
  } catch (err) {
    toast.error("Error generating invoice");
  } finally {
    setLoading(false); // stop loader
  }
};

useEffect(() => {
  axiosInstance.get("/products/dropdown-products")
    .then(res => {
      if (Array.isArray(res.data)) {
        setProductsList(res.data);
      } else {
        toast.error("Product list not found");
      }
    })
    .catch(err => {
      console.error("Failed to load products:", err);
      toast.error("Error loading product list");
    });
}, []);

  return (
    <>
    {loading && (
  <div className="fixed inset-0 bg-[#000000b7] bg-opacity-30 flex justify-center items-center z-[9999]">
    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 border-solid"></div>
  </div>
)}
{Object.values(narrationUploadLoading).some(val => val) && (
  <div className="fixed inset-0 bg-[#000000b7] bg-opacity-40 flex items-center justify-center z-[9998]">
    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 border-solid"></div>
    <span className="ml-4 text-white text-lg font-medium">Uploading narration image...</span>
  </div>
)}

      <InternalNavbar />
      <div className="p-4 max-w-6xl mx-auto space-y-6">
        <h1 className="text-2xl font-semibold text-center text-blue-700">🧾 Quotation/Proforma Invoice/Estimate</h1>

        {/* Invoice Header */}
        <div className="grid md:grid-cols-2 gap-4">
          <input className="input" placeholder="Invoice No" value={form.invoiceNo} readOnly />
          <input className="input" type="date" value={form.date} readOnly />
        </div>

        {/* Address Section */}
       <div className="space-y-2">
  <label className="flex items-center gap-2 text-sm font-medium">
    <input
      type="checkbox"
      checked={form.sameAddress}
      onChange={() =>
        setForm(f => ({
          ...f,
          sameAddress: !f.sameAddress,
          ...(f.sameAddress ? {} : { shipTo: f.billTo })
        }))
      }
    />
    Same Billing & Shipping Address
  </label>

  <div>
    <label className="text-sm font-medium">Customer</label>
<Select
  className="text-sm"
  placeholder="Select Customer..."
  options={customers.map(c => ({
    value: c._id,
    label: c.name,
    data: c
  }))}
  onChange={(selectedOption) => {
    const customer = selectedOption.data;
    setForm(f => ({
      ...f,
      customerName: customer.name || "",
      customerEmail: customer.email || "",
      contact: customer.phone || "",
      billTo: customer.address || "",
      shipTo: f.sameAddress ? customer.address || "" : customer.shippingAddress || "",
      gstin: customer.company || "",
      city: customer.city || "",
      state: customer.state || "",
      pincode: customer.pincode || "",
      inPunjab: customer.state === "Punjab",
      // 🔥 ADD THIS LINE - Auto set destination from customer's city/village/town
    destination: customer.city || "",
    }));
  }}
  isSearchable
  menuPortalTarget={document.body}
  styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
/>
  </div>

  <div>
    <label className="text-sm font-medium">Bill To Address</label>
    <textarea
      className="textarea"
      placeholder="Bill To"
      value={form.billTo}
      onChange={(e) =>
        setForm(f => ({
          ...f,
          billTo: e.target.value,
          ...(f.sameAddress && { shipTo: e.target.value })
        }))
      }
    />
    
  </div>

  {!form.sameAddress && (
    <div>
      <label className="text-sm font-medium">Ship To Address</label>
      <textarea
        className="textarea"
        placeholder="Ship To"
        value={form.shipTo}
        onChange={(e) => setForm(f => ({ ...f, shipTo: e.target.value }))}
      />
    </div>
  )}
</div>


        {/* Transport Fields */}
       <div className="grid md:grid-cols-2 gap-4">
  <div>
    <label className="text-sm font-medium">Mode of Transport</label>
    <input
      className="input"
      placeholder="Transport Mode"
      onChange={(e) => setForm(f => ({ ...f, transportMode: e.target.value }))}
    />
  </div>
  <div>
    <label className="text-sm font-medium">Destination</label>
   <input
  className="input"
  placeholder="Destination"
  value={form.destination || ""}
  onChange={(e) => setForm(f => ({ ...f, destination: e.target.value }))}
/>
  </div>
 <div>
  <label className="text-sm font-medium">Freight Type</label>
  <div className="grid grid-cols-2 gap-2 mt-1 text-sm">
    {["Self Pickup", "PAID", "To Pay", "Billed"].map((type) => (
      <label key={type} className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={form.freightType === type}
          onChange={() =>
            setForm((f) => ({
              ...f,
              freightType: f.freightType === type ? "" : type,
              freight: type === "Billed" ? f.freight : 0, // reset if not billed
                  toPayAmount: type === "To Pay" ? f.toPayAmount : 0, // reset if not "To Pay"
            }))
          }
        />
        {type}
      </label>
    ))}
  </div>
  {form.freightType === "To Pay" && (
  <div>
    <label className="text-sm font-medium">To Pay Amount (₹)</label>
    <input
      className="input"
      type="number"
      placeholder="Enter To Pay Amount"
      value={form.toPayAmount ?? ""}
      onChange={(e) =>
        setForm((f) => ({
          ...f,
          toPayAmount: Number(e.target.value),
        }))
      }
    />
  </div>
)}

</div>


{form.freightType === "Billed" && (
  <div>
    <label className="text-sm font-medium">Freight Amount (₹)</label>
    <input
      className="input"
      type="number"
      placeholder="Freight Amount"
      value={form.freight ?? ""}
      onChange={(e) =>
        setForm((f) => ({
          ...f,
freight: e.target.value,
        }))
      }
    />
  </div>
)}
{/* New payment terms section */}
<div className="col-span-2">
  <label className="text-sm font-medium">Payment Terms</label>
  <select
    className="w-full border border-gray-300 rounded px-3 py-2 mt-1"
    value={form.paymentTerms === form.customPaymentTerm ? "Other" : form.paymentTerms}
    onChange={(e) => {
      if (e.target.value === "Other") {
        setForm(f => ({ 
          ...f, 
          paymentTerms: f.customPaymentTerm || "",
        }));
      } else {
        setForm(f => ({ 
          ...f, 
          paymentTerms: e.target.value,
          customPaymentTerm: "" 
        }));
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

  {(form.paymentTerms === form.customPaymentTerm || form.paymentTerms === "Other") && (
    <input
      type="text"
      className="input w-full mt-2"
      placeholder="Enter custom payment terms"
      value={form.customPaymentTerm}
      onChange={(e) => setForm(f => ({ 
        ...f, 
        customPaymentTerm: e.target.value,
        paymentTerms: e.target.value 
      }))}
    />
  )}
</div>
  <div>
    <label className="text-sm font-medium">Packaging Charges (₹)</label>
    <input
      className="input"
      type="number"
      placeholder="Packaging Charges"
 value={form.packaging ?? ''}
    onChange={(e) =>
      setForm(f => ({
        ...f,
packaging: e.target.value,
      }))
    }    />
  </div>
</div>


        {/* GST Type */}
        {/* <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.inPunjab} onChange={() => setForm(f => ({ ...f, inPunjab: !f.inPunjab }))} />
         Check this if Within Punjab
        </label> */}

        {/* Products Table */}
        <div className="w-full overflow-x-auto">
  <table className="min-w-[800px] w-full mt-4 border text-sm">
    <thead>
      <tr className="bg-blue-100 text-gray-700">
        <th className="p-2">#</th>
        <th>Product</th>
        <th>HSN</th>
        <th>Qty</th>
        <th>Unit</th>
        <th>Rate</th>
        {form.inPunjab ? (
          <>
            <th>CGST</th>
            <th>SGST</th>
          </>
        ) : (
          <th>IGST</th>
        )}
        <th>Amount</th>
        <th></th>
      </tr>
    </thead>
    <tbody>
      {form.products.map((p, i) => {
        const total = p.qty * p.rate;
        return (
                <React.Fragment key={i}>
          <tr key={i} className="even:bg-gray-50">
            <td className="p-2">{i + 1}</td>
            <td className="w-64 min-w-[200px]">
              <div className="react-select-container z-50">
                <Select
                  className="text-sm"
                  classNamePrefix="react-select"
                  options={productsList.map(pr => ({
                    value: pr._id,
                    label: pr.name,
                    data: pr
                  }))}
                  onChange={(selectedOption) => {
                    const selected = selectedOption.data;
                    const updated = [...form.products];
                    updated[i] = {
                      ...updated[i],
                      productId: selected._id,
                      name: selected.name,
                      hsn: selected.hsnCode,
                      unit: selected.unit,
                      gst: selected.gstPercent,
                      rate: updated[i].rate || selected.price || 0,
                      qty: updated[i].qty || 1,
                      images: selected.images || [],
                    };

                    setForm(f => ({ ...f, products: updated }));

                    setSelectedImages(prev => ({
                      ...prev,
                      [i]: selected.images || []
                    }));
                  }}
                  menuPortalTarget={document.body}
                  styles={{
                    menuPortal: base => ({ ...base, zIndex: 9999 }),
                  }}
                  placeholder="Select product..."
                />
              </div>

           {selectedImages[i]?.length > 0 && (
  <div className="flex flex-wrap gap-2 mt-2">
    {selectedImages[i].map((url, idx) => (
      <div key={idx} className="relative">
        <img
          src={url}
          alt={`product-${i}-img-${idx}`}
          className="w-16 h-16 object-cover border rounded cursor-pointer hover:scale-105 transition"
          onClick={() => {
            Swal.fire({
              imageUrl: url,
              imageAlt: 'Product Image',
              showConfirmButton: false,
              background: '#fff',
            });
          }}
        />
        {/* Delete button - always visible on mobile */}
        <button
          type="button"
          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 text-xs flex items-center justify-center shadow-md hover:bg-red-600 active:bg-red-700 touch-manipulation"
          onClick={(e) => {
            e.stopPropagation();
            // Add confirmation for better UX
            if (window.confirm('Remove this image?')) {
              const updatedImages = [...selectedImages[i]];
              updatedImages.splice(idx, 1);
              setSelectedImages(prev => ({
                ...prev,
                [i]: updatedImages
              }));
              
              // Also update form.products to sync with backend
              const updatedProducts = [...form.products];
              updatedProducts[i].images = updatedImages;
              setForm(f => ({ ...f, products: updatedProducts }));
            }
          }}
          title="Delete image"
        >
          ✕
        </button>
      </div>
    ))}
  </div>
)}
            </td>

            <td>{p.hsn}</td>
            <td>
              <input
                className="input w-16"
                type="number"
                value={p.qty}
                onChange={(e) => {
                  const updated = [...form.products];
                  updated[i].qty = +e.target.value;
                  setForm(f => ({ ...f, products: updated }));
                }}
              />
            </td>
            <td>{p.unit}</td>
          <td>
  <div className="flex flex-col gap-1">
    {/* Checkbox for Costing Sheet */}
    <label className="flex items-center gap-1 text-xs">
      <input
        type="checkbox"
        checked={p.isCNC || false}
        onChange={(e) => {
          const updated = [...form.products];
          updated[i].isCNC = e.target.checked;
          // Reset CNC fields when unchecked
          if (!e.target.checked) {
            updated[i].cncLength = "";
            updated[i].cncBreadth = "";
            updated[i].cncHeight = "";
            updated[i].cncWeight = 0;
            updated[i].cncBasicCost = 300;
            updated[i].cncMachineRate = 500;
            updated[i].cncMachineHours = 0;
            updated[i].cncLaborCharges = 0;
            updated[i].cncProfit = 0;
            updated[i].rate = 0;
          } else {
            updated[i].cncBasicCost = 300;
            updated[i].cncMachineRate = 500;
          }
          setForm(f => ({ ...f, products: updated }));
        }}
      />
      Costing sheet for EPS/Thermocol CNC Pattern
    </label>
    
    {p.isCNC ? (
      <div className="bg-gray-100 p-2 rounded text-xs">
        {/* Dimensions Inputs */}
        <div className="grid grid-cols-3 gap-1 mb-2">
          <div>
            <label className="block text-xs">Length (mm)</label>
            <input
              type="number"
              className="input w-full text-xs p-1"
              value={p.cncLength || ""}
              onChange={(e) => {
                const updated = [...form.products];
                updated[i].cncLength = e.target.value;
                setForm(f => ({ ...f, products: updated }));
              }}
              onBlur={() => {
                if (p.cncLength && p.cncBreadth && p.cncHeight) {
                  const updated = [...form.products];
                  // Calculate weight: ((l*b*h)/1000000)*24/1000
                  const l = parseFloat(p.cncLength);
                  const b = parseFloat(p.cncBreadth);
                  const h = parseFloat(p.cncHeight);
                  updated[i].cncWeight = ((l * b * h) / 1000000) * 24 / 1000;
                  
                  // Calculate all costs
                  const basicCost = updated[i].cncBasicCost || 300;
                  const machineRate = updated[i].cncMachineRate || 500;
                  const machineHours = updated[i].cncMachineHours || 0;
                  const laborCharges = machineHours * machineRate * 0.5; // 50% of machine hours
                  const totalCost = (basicCost * updated[i].cncWeight) + (machineRate * machineHours) + laborCharges;
                  const profit = totalCost * 0.2; // 20% profit
                  
                  updated[i].cncLaborCharges = laborCharges;
                  updated[i].cncProfit = profit;
                  updated[i].rate = totalCost + profit;
                  
                  setForm(f => ({ ...f, products: updated }));
                }
              }}
            />
          </div>
          <div>
            <label className="block text-xs">Breadth (mm)</label>
            <input
              type="number"
              className="input w-full text-xs p-1"
              value={p.cncBreadth || ""}
              onChange={(e) => {
                const updated = [...form.products];
                updated[i].cncBreadth = e.target.value;
                setForm(f => ({ ...f, products: updated }));
              }}
              onBlur={() => {
                if (p.cncLength && p.cncBreadth && p.cncHeight) {
                  const updated = [...form.products];
                  const l = parseFloat(p.cncLength);
                  const b = parseFloat(p.cncBreadth);
                  const h = parseFloat(p.cncHeight);
                  updated[i].cncWeight = ((l * b * h) / 1000000) * 24 / 1000;
                  
                  const basicCost = updated[i].cncBasicCost || 300;
                  const machineRate = updated[i].cncMachineRate || 500;
                  const machineHours = updated[i].cncMachineHours || 0;
                  const laborCharges = machineHours * machineRate * 0.5;
                  const totalCost = (basicCost * updated[i].cncWeight) + (machineRate * machineHours) + laborCharges;
                  const profit = totalCost * 0.2;
                  
                  updated[i].cncLaborCharges = laborCharges;
                  updated[i].cncProfit = profit;
                  updated[i].rate = totalCost + profit;
                  
                  setForm(f => ({ ...f, products: updated }));
                }
              }}
            />
          </div>
          <div>
            <label className="block text-xs">Height (mm)</label>
            <input
              type="number"
              className="input w-full text-xs p-1"
              value={p.cncHeight || ""}
              onChange={(e) => {
                const updated = [...form.products];
                updated[i].cncHeight = e.target.value;
                setForm(f => ({ ...f, products: updated }));
              }}
              onBlur={() => {
                if (p.cncLength && p.cncBreadth && p.cncHeight) {
                  const updated = [...form.products];
                  const l = parseFloat(p.cncLength);
                  const b = parseFloat(p.cncBreadth);
                  const h = parseFloat(p.cncHeight);
                  updated[i].cncWeight = ((l * b * h) / 1000000) * 24 / 1000;
                  
                  const basicCost = updated[i].cncBasicCost || 300;
                  const machineRate = updated[i].cncMachineRate || 500;
                  const machineHours = updated[i].cncMachineHours || 0;
                  const laborCharges = machineHours * machineRate * 0.5;
                  const totalCost = (basicCost * updated[i].cncWeight) + (machineRate * machineHours) + laborCharges;
                  const profit = totalCost * 0.2;
                  
                  updated[i].cncLaborCharges = laborCharges;
                  updated[i].cncProfit = profit;
                  updated[i].rate = totalCost + profit;
                  
                  setForm(f => ({ ...f, products: updated }));
                }
              }}
            />
          </div>
        </div>
        
        {/* Calculated Weight */}
        {p.cncWeight > 0 && (
          <div className="mb-1">
            <span className="font-medium">Calculated Weight:</span> {p.cncWeight.toFixed(4)} kg
          </div>
        )}
        
        {/* Basic Cost */}
        <div className="mb-1">
          <label className="block text-xs">Basic Cost (₹/kg)</label>
          <input
            type="number"
            className="input w-full text-xs p-1"
            value={p.cncBasicCost || 300}
            onChange={(e) => {
              const updated = [...form.products];
              updated[i].cncBasicCost = parseFloat(e.target.value) || 300;
              
              // Recalculate everything
              if (p.cncWeight > 0) {
                const machineRate = updated[i].cncMachineRate || 500;
                const machineHours = updated[i].cncMachineHours || 0;
                const laborCharges = machineHours * machineRate * 0.5;
                const totalCost = (updated[i].cncBasicCost * p.cncWeight) + (machineRate * machineHours) + laborCharges;
                const profit = totalCost * 0.2;
                
                updated[i].cncLaborCharges = laborCharges;
                updated[i].cncProfit = profit;
                updated[i].rate = totalCost + profit;
              }
              
              setForm(f => ({ ...f, products: updated }));
            }}
          />
        </div>
        
        {/* Machine Hours */}
        <div className="mb-1">
          <label className="block text-xs">Machine Hours</label>
          <input
            type="number"
            step="0.5"
            className="input w-full text-xs p-1"
            value={p.cncMachineHours || 0}
            onChange={(e) => {
              const updated = [...form.products];
              updated[i].cncMachineHours = parseFloat(e.target.value) || 0;
              
              // Recalculate everything
              if (p.cncWeight > 0) {
                const basicCost = updated[i].cncBasicCost || 300;
                const machineRate = updated[i].cncMachineRate || 500;
                const laborCharges = updated[i].cncMachineHours * machineRate * 0.5;
                const totalCost = (basicCost * p.cncWeight) + (machineRate * updated[i].cncMachineHours) + laborCharges;
                const profit = totalCost * 0.2;
                
                updated[i].cncLaborCharges = laborCharges;
                updated[i].cncProfit = profit;
                updated[i].rate = totalCost + profit;
              }
              
              setForm(f => ({ ...f, products: updated }));
            }}
          />
        </div>
        
        {/* Machine Rate */}
        <div className="mb-1">
          <label className="block text-xs">Machine Rate (₹/hr)</label>
          <input
            type="number"
            className="input w-full text-xs p-1"
            value={p.cncMachineRate || 500}
            onChange={(e) => {
              const updated = [...form.products];
              updated[i].cncMachineRate = parseFloat(e.target.value) || 500;
              
              // Recalculate everything
              if (p.cncWeight > 0) {
                const basicCost = updated[i].cncBasicCost || 300;
                const machineHours = updated[i].cncMachineHours || 0;
                const laborCharges = machineHours * updated[i].cncMachineRate * 0.5;
                const totalCost = (basicCost * p.cncWeight) + (updated[i].cncMachineRate * machineHours) + laborCharges;
                const profit = totalCost * 0.2;
                
                updated[i].cncLaborCharges = laborCharges;
                updated[i].cncProfit = profit;
                updated[i].rate = totalCost + profit;
              }
              
              setForm(f => ({ ...f, products: updated }));
            }}
          />
        </div>
        
        {/* Calculated Values */}
        {p.cncWeight > 0 && (
          <div className="text-xs space-y-1">
            <div>Material Cost: ₹{(p.cncBasicCost * p.cncWeight).toFixed(2)}</div>
            <div>Block Price: ₹{((p.cncMachineRate || 500) * (p.cncMachineHours || 0)).toFixed(2)}</div>
            <div>Labor Charges: ₹{p.cncLaborCharges.toFixed(2)}</div>
            <div>Profit (20%): ₹{p.cncProfit.toFixed(2)}</div>
            <div className="font-bold">Final Rate: ₹{p.rate.toFixed(2)}</div>
          </div>
        )}
      </div>
    ) : (
      <input
        className="input w-20"
        type="number"
        value={p.rate}
        onChange={(e) => {
          const updated = [...form.products];
          updated[i].rate = +e.target.value;
          setForm(f => ({ ...f, products: updated }));
        }}
      />
    )}
  </div>
</td>
            {form.inPunjab ? (
              <>
                <td>{(p.gst / 2).toFixed(2)}%</td>
                <td>{(p.gst / 2).toFixed(2)}%</td>
              </>
            ) : (
              <td>{p.gst}%</td>
            )}
            <td>{(total).toFixed(2)}</td>
            <td>
              <button
                onClick={() => removeProductRow(i)}
                className="text-red-500 hover:text-red-700"
              >
                ❌
              </button>
            </td>
          </tr>
            {/* ✅ Narration Row Below Product Row */}
        <tr key={`narration-${i}`}>
          <td colSpan={form.inPunjab ? 10 : 9}>
            <textarea
              className="textarea mt-2 w-full text-sm"
              placeholder="Optional Narration / Description"
              value={p.narration || ""}
              onChange={(e) => {
                const updated = [...form.products];
                updated[i].narration = e.target.value;
                setForm(f => ({ ...f, products: updated }));
              }}
            />
            {/* Upload Narration Images */}
<div className="mt-2 space-y-2">
  <label className="block text-sm font-medium">Upload Narration Images</label>
<input
  type="file"
    className="bg-yellow-200 p-1 w-full"
  accept="image/*"
  multiple
  onChange={async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    // ✅ Show loader for this product row
    setNarrationUploadLoading(prev => ({ ...prev, [i]: true }));

    try {
      const uploadPromises = files.map((file) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", "todo_uploads");

        return fetch("https://api.cloudinary.com/v1_1/dcr8k5amk/image/upload", {
          method: "POST",
          body: formData,
        }).then((res) => res.json());
      });

      const results = await Promise.all(uploadPromises);
      const uploadedUrls = results.map((r) => r.secure_url);

      const updated = [...form.products];
      updated[i].narrationImages = [
        ...(updated[i].narrationImages || []),
        ...uploadedUrls,
      ];
      setForm((f) => ({ ...f, products: updated }));
    } catch (err) {
      toast.error("Failed to upload one or more narration images.");
    } finally {
      // ✅ Hide loader
      setNarrationUploadLoading(prev => ({ ...prev, [i]: false }));
    }
  }}
/>

{narrationUploadLoading[i] && (
  <div className="mt-2">
    <div className="inline-block w-5 h-5 border-2 border-t-2 border-blue-500 rounded-full animate-spin"></div>
    <span className="ml-2 text-sm text-blue-600">Uploading...</span>
  </div>
)}


  {/* Preview + Delete */}
  <div className="flex flex-wrap gap-2 mt-2 bg-amber-200 mb-10 p-1">
    {form.products[i].narrationImages?.map((url, idx) => (
      <div key={idx} className="relative">
       <img
  src={url.replace("/upload/", "/upload/w_100,h_100,c_fill,q_auto/")}
  loading="lazy"
  alt={`narration-img-${i}-${idx}`}
  className="w-16 h-16 object-cover border rounded"
/>

        <button
          type="button"
          className="absolute top-0 right-0 bg-red-500 text-white rounded-full text-xs px-1"
          onClick={() => {
            const updated = [...form.products];
            updated[i].narrationImages.splice(idx, 1);
            setForm(f => ({ ...f, products: updated }));
          }}
        >
          ❌
        </button>
      </div>
    ))}
  </div>
</div>

          </td>
        </tr>
              </React.Fragment>

        );
      })}
    </tbody>
  </table>
</div>

        <button onClick={addProductRow} className="bg-green-600 hover:bg-green-700 text-white px-4 py-1 rounded transition">➕ Add Product</button>

        {/* Remarks */}
        <textarea className="textarea" placeholder="Remarks" onChange={(e) => setForm(f => ({ ...f, remarks: e.target.value }))} />

        {/* Submit */}
        <div className="text-center">
          <button
  disabled={loading}
  className={`bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded shadow transition ${
    loading && "opacity-50 cursor-not-allowed"
  }`}
  onClick={handleSubmit}
>
  🧾 Generate PDF
</button>

        </div>
      </div>
    </>
  );
}