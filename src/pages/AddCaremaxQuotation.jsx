import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Swal from 'sweetalert2';
import Select from "react-select";
import axiosInstance from "../axiosInstance";
import { useNavigate } from "react-router-dom";
import InternalNavbar from "../components/InternalNavbar";

export default function AddCaremaxQuotation() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [productsList, setProductsList] = useState([]);
  const [customersList, setCustomersList] = useState([]);
  const [selectedImages, setSelectedImages] = useState({});
  const [narrationUploadLoading, setNarrationUploadLoading] = useState({});

  const [form, setForm] = useState({
    invoiceNo: `CQ/${new Date().getFullYear().toString().slice(-2)}-${Math.floor(Math.random() * 1000)}`,
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
    freightType: "",
    toPayAmount: 0,
    packaging: 0,
    contact: "",
    remarks: "",
    products: [],
    paymentTerms: "",
    customPaymentTerm: "",
    customerEmail: "",
    customerName: "",
    gstin: "",
  });

  // Fetch Caremax Products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await axiosInstance.get("/caremax-products?limit=100");
        if (res.data.success && res.data.products) {
          setProductsList(res.data.products);
        }
      } catch (err) {
        console.error("Failed to load products:", err);
        toast.error("Error loading product list");
      }
    };
    fetchProducts();
  }, []);

  // Fetch Caremax Customers
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const res = await axiosInstance.get("/caremax-customers?limit=100");
        if (res.data.success && res.data.customers) {
          setCustomersList(res.data.customers);
        }
      } catch (err) {
        console.error("Failed to load customers:", err);
        toast.error("Error loading customer list");
      }
    };
    fetchCustomers();
  }, []);

  const addProductRow = () => {
    setForm(prev => ({
      ...prev,
      products: [...prev.products, { 
        productId: null, 
        name: "", 
        hsn: "", 
        qty: 1, 
        unit: "", 
        rate: 0, 
        gst: 0, 
        narration: "",
        narrationImages: [],
        images: []
      }]
    }));
  };

  const removeProductRow = (index) => {
    const updated = [...form.products];
    updated.splice(index, 1);
    setForm(prev => ({ ...prev, products: updated }));
  };

  const handleSubmit = async () => {
    if (form.products.length === 0) {
      toast.error("Please add at least one product.");
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
    if (!form.freightType) {
      toast.error("Please select a Freight Type.");
      return;
    }

    setLoading(true);

    try {
      const updatedForm = {
        ...form,
        products: form.products.map((p, i) => ({
          ...p,
          images: selectedImages[i] || [],
        }))
      };

      const res = await axiosInstance.post("/caremax-quotations/generate", updatedForm);
      toast.success("Quotation generated successfully!");
      
      // Open PDF in new tab
      if (res.data.pdfUrl) {
        window.open(res.data.pdfUrl, "_blank");
      }
      
      navigate("/caremax-impex/all-quotations");
    } catch (err) {
      console.error("Error generating quotation:", err);
      toast.error(err.response?.data?.message || "Error generating quotation");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {loading && (
        <div className="fixed inset-0 bg-[#000000b7] bg-opacity-30 flex justify-center items-center z-[9999]">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 border-solid"></div>
        </div>
      )}

      <InternalNavbar />
      <div className="p-4 max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-center text-blue-700">🧾 Caremax Quotation / Proforma Invoice</h1>
          <button
            onClick={() => navigate("/caremax-impex")}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
          >
            ← Back
          </button>
        </div>

        {/* Invoice Header */}
        <div className="grid md:grid-cols-2 gap-4">
          <input className="input p-2 border rounded" placeholder="Invoice No" value={form.invoiceNo} readOnly />
          <input className="input p-2 border rounded" type="date" value={form.date} readOnly />
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
              options={customersList.map(c => ({
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
                  contact: customer.phoneNo || "",
                  billTo: customer.address || "",
                  shipTo: f.sameAddress ? customer.address || "" : "",
                  gstin: customer.gstNo || "",
                  city: customer.city || "",
                  state: customer.state || "",
                  pincode: customer.pinCode || "",
                  inPunjab: customer.state === "Punjab",
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
              className="textarea p-2 border rounded w-full"
              rows="3"
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
                className="textarea p-2 border rounded w-full"
                rows="3"
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
              className="input p-2 border rounded w-full"
              placeholder="Transport Mode"
              onChange={(e) => setForm(f => ({ ...f, transportMode: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Destination</label>
            <input
              className="input p-2 border rounded w-full"
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
                        freight: type === "Billed" ? f.freight : 0,
                        toPayAmount: type === "To Pay" ? f.toPayAmount : 0,
                      }))
                    }
                  />
                  {type}
                </label>
              ))}
            </div>
            {form.freightType === "To Pay" && (
              <div className="mt-2">
                <label className="text-sm font-medium">To Pay Amount (₹)</label>
                <input
                  className="input p-2 border rounded w-full"
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
                className="input p-2 border rounded w-full"
                type="number"
                placeholder="Freight Amount"
                value={form.freight ?? ""}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    freight: Number(e.target.value),
                  }))
                }
              />
            </div>
          )}

          <div>
            <label className="text-sm font-medium">Packaging Charges (₹)</label>
            <input
              className="input p-2 border rounded w-full"
              type="number"
              placeholder="Packaging Charges"
              value={form.packaging ?? ''}
              onChange={(e) =>
                setForm(f => ({
                  ...f,
                  packaging: Number(e.target.value),
                }))
              }
            />
          </div>
        </div>

        {/* Payment Terms */}
        <div className="border rounded-lg p-4">
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
            <option value="100% Advance">1) 100% Advance</option>
            <option value="Cash on Delivery">2) Cash on Delivery</option>
            <option value="50% Advance & Balance 50% before Dispatch">3) 50% Advance & Balance 50% before Dispatch</option>
            <option value="Credit: 45 Days">4) Credit: 45 Days</option>
            <option value="Other">5) Other (Write in remarks)</option>
          </select>

          {(form.paymentTerms === form.customPaymentTerm || form.paymentTerms === "Other") && (
            <input
              type="text"
              className="input w-full mt-2 p-2 border rounded"
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
                    <tr className="even:bg-gray-50">
                      <td className="p-2">{i + 1}</td>
                      <td className="w-64 min-w-[200px]">
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
                              hsn: selected.hsnCode || "",
                              unit: selected.unit,
                              gst: selected.gstPercent || 0,
                              rate: updated[i].rate || selected.sellingPrice || 0,
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
                          styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                          placeholder="Select product..."
                        />
                        {selectedImages[i]?.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {selectedImages[i].map((url, idx) => (
                              <div key={idx} className="relative">
                                <img
                                  src={url}
                                  alt={`product-${i}`}
                                  className="w-16 h-16 object-cover border rounded cursor-pointer"
                                  onClick={() => {
                                    Swal.fire({
                                      imageUrl: url,
                                      imageAlt: 'Product Image',
                                      showConfirmButton: false,
                                    });
                                  }}
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                      <td>{p.hsn}</td>
                      <td>
                        <input
                          className="input w-16 p-1 border rounded"
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
                          className="input w-20 p-1 border rounded"
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
                    <tr>
                      <td colSpan={form.inPunjab ? 10 : 9}>
                        <textarea
                          className="textarea mt-2 w-full text-sm p-2 border rounded"
                          rows="2"
                          placeholder="Optional Narration / Description for this product"
                          value={p.narration || ""}
                          onChange={(e) => {
                            const updated = [...form.products];
                            updated[i].narration = e.target.value;
                            setForm(f => ({ ...f, products: updated }));
                          }}
                        />
                      </td>
                    </tr>
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        <button onClick={addProductRow} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition">
          ➕ Add Product
        </button>

        {/* Remarks */}
        <textarea
          className="textarea p-2 border rounded w-full"
          rows="3"
          placeholder="General Remarks"
          onChange={(e) => setForm(f => ({ ...f, remarks: e.target.value }))}
        />

        {/* Submit */}
        <div className="text-center">
          <button
            disabled={loading}
            className={`bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded shadow transition ${
              loading && "opacity-50 cursor-not-allowed"
            }`}
            onClick={handleSubmit}
          >
            {loading ? "Generating..." : "🧾 Generate Quotation PDF"}
          </button>
        </div>
      </div>
    </>
  );
}