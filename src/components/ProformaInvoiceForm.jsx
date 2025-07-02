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
    transportMode: "",
    destination: "",
    freight: 0,
      freightType: "", // new field to track selected checkbox
    packaging: 0,
    contact: "",
    remarks: "",
    products: [],
     paymentTerms: [],         // ⬅️ Array of selected terms
  customPaymentTerm: "",    // ⬅️ Dynamic input field
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
    axiosInstance.get("/products/all-backend-products")
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
  customerName: customer.name || "", // ✅ Add this line
  contact: customer.phone || "",
  billTo: customer.address || "",
  shipTo: f.sameAddress ? customer.address || "" : customer.shippingAddress || "",
  gstin: customer.company || ""
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
            }))
          }
        />
        {type}
      </label>
    ))}
  </div>
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
<div className="col-span-2">
  <label className="text-sm font-medium">Payment Terms</label>
  <div className="grid md:grid-cols-2 gap-2 mt-2 text-sm">
    {["100% Advance", "45 Days Credit", "Cheque on Delivery"].map((term) => (
      <label key={term} className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={form.paymentTerms.includes(term)}
          onChange={(e) => {
            const updated = e.target.checked
              ? [...form.paymentTerms, term]
              : form.paymentTerms.filter(t => t !== term);
            setForm(f => ({ ...f, paymentTerms: updated }));
          }}
        />
        {term}
      </label>
    ))}
  </div>
  {/* Dynamic input for custom term */}
  <div className="mt-2">
    <input
      className="input w-full"
      placeholder="Other (please specify)"
      value={form.customPaymentTerm}
      onChange={(e) =>
        setForm(f => ({ ...f, customPaymentTerm: e.target.value }))
      }
    />
  </div>
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
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.inPunjab} onChange={() => setForm(f => ({ ...f, inPunjab: !f.inPunjab }))} />
         Check this if Within Punjab
        </label>

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
                    <img
                      key={idx}
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
