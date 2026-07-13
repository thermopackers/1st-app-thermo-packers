import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Swal from 'sweetalert2';
import Select from "react-select";
import axiosInstance from "../axiosInstance";
import InternalNavbar from "../components/InternalNavbar";

export default function EditCaremaxQuotation() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [productsList, setProductsList] = useState([]);
  const [customersList, setCustomersList] = useState([]);
  const [selectedImages, setSelectedImages] = useState({});

  const [form, setForm] = useState({
    invoiceNo: "",
    date: "",
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

  // Fetch products and customers
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsRes, customersRes] = await Promise.all([
          axiosInstance.get("/caremax-products?limit=100"),
          axiosInstance.get("/caremax-customers?limit=100")
        ]);
        
        setProductsList(productsRes.data.products || []);
        setCustomersList(customersRes.data.customers || []);
      } catch (err) {
        console.error("Error fetching data:", err);
        toast.error("Failed to load products/customers");
      }
    };
    fetchData();
  }, []);

  // Fetch quotation data
  useEffect(() => {
    const fetchQuotation = async () => {
      try {
        const res = await axiosInstance.get(`/caremax-quotations/${id}`);
        if (res.data.success && res.data.quotation) {
          const quotation = res.data.quotation;
          
          // Set form data
          setForm({
            invoiceNo: quotation.invoiceNo || "",
            date: quotation.date || new Date().toISOString().split("T")[0],
            billTo: quotation.billTo || "",
            shipTo: quotation.shipTo || "",
            sameAddress: quotation.sameAddress !== false,
            inPunjab: quotation.inPunjab !== false,
            city: quotation.city || "",
            state: quotation.state || "",
            pincode: quotation.pincode || "",
            transportMode: quotation.transportMode || "",
            destination: quotation.destination || "",
            freight: quotation.freight || 0,
            freightType: quotation.freightType || "",
            toPayAmount: quotation.toPayAmount || 0,
            packaging: quotation.packaging || 0,
            contact: quotation.contact || "",
            remarks: quotation.remarks || "",
            products: quotation.products || [],
            paymentTerms: quotation.paymentTerms || "",
            customPaymentTerm: quotation.customPaymentTerm || "",
            customerEmail: quotation.customerEmail || "",
            customerName: quotation.customerName || "",
            gstin: quotation.gstin || "",
          });
          
          // ✅ Set selectedImages for each product from the loaded data
          const imagesMap = {};
          (quotation.products || []).forEach((product, index) => {
            imagesMap[index] = product.images || [];
          });
          setSelectedImages(imagesMap);
        }
      } catch (err) {
        console.error("Error fetching quotation:", err);
        toast.error("Failed to load quotation");
        navigate("/caremax-impex/all-quotations");
      } finally {
        setLoading(false);
      }
    };
    fetchQuotation();
  }, [id, navigate]);

const addProductRow = () => {
  setForm(prev => ({
    ...prev,
    products: [...prev.products, { 
      productId: null,  // ✅ Use null instead of empty string
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
    // Also remove from selectedImages
    const updatedImages = { ...selectedImages };
    delete updatedImages[index];
    setSelectedImages(updatedImages);
  };

  const updateProductField = (index, field, value) => {
    const updated = [...form.products];
    updated[index] = { ...updated[index], [field]: value };
    setForm(prev => ({ ...prev, products: updated }));
  };

const handleProductSelect = (index, selectedOption) => {
  if (!selectedOption) {
    // If product is deselected, clear the product fields but keep the row
    updateProductField(index, 'productId', null);
    updateProductField(index, 'name', "");
    updateProductField(index, 'hsn', "");
    updateProductField(index, 'unit', "");
    updateProductField(index, 'gst', 0);
    updateProductField(index, 'rate', 0);
    updateProductField(index, 'images', []);
    setSelectedImages(prev => ({ ...prev, [index]: [] }));
    return;
  }
  
  const selected = selectedOption.data;
  updateProductField(index, 'productId', selected._id);
  updateProductField(index, 'name', selected.name);
  updateProductField(index, 'hsn', selected.hsnCode || "");
  updateProductField(index, 'unit', selected.unit);
  updateProductField(index, 'gst', selected.gstPercent || 0);
  updateProductField(index, 'rate', selected.sellingPrice || 0);
  updateProductField(index, 'images', selected.images || []);
  
  setSelectedImages(prev => ({
    ...prev,
    [index]: selected.images || []
  }));
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
    
    setSubmitting(true);
    try {
      // Prepare the products with images
      const productsWithImages = form.products.map((product, idx) => ({
        ...product,
        images: selectedImages[idx] || product.images || []
      }));
      
      const submitData = {
        ...form,
        products: productsWithImages,
      };
      
      const res = await axiosInstance.put(`/caremax-quotations/${id}`, submitData);
      toast.success("Quotation updated successfully!");
      if (res.data.pdfUrl) {
        window.open(res.data.pdfUrl, "_blank");
      }
      navigate("/caremax-impex/all-quotations");
    } catch (err) {
      console.error("Error updating quotation:", err);
      toast.error(err.response?.data?.message || "Error updating quotation");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <>
        <InternalNavbar />
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </>
    );
  }

  return (
    <>
      <InternalNavbar />
      <div className="p-4 max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-blue-700">✏️ Edit Caremax Quotation</h1>
          <button 
            onClick={() => navigate("/caremax-impex/all-quotations")} 
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
          >
            ← Back to Quotations
          </button>
        </div>

        {/* Invoice Header */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Invoice Number</label>
            <input 
              className="w-full p-2 border rounded bg-gray-100" 
              value={form.invoiceNo} 
              readOnly 
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Date</label>
            <input 
              className="w-full p-2 border rounded" 
              type="date" 
              value={form.date} 
              onChange={(e) => setForm(f => ({ ...f, date: e.target.value }))}
            />
          </div>
        </div>

        {/* Customer Section */}
        <div className="border rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3">Customer Information</h3>
          
          <div className="mb-3">
            <label className="block text-sm font-medium mb-1">Customer</label>
            <Select
              options={customersList.map(c => ({ value: c._id, label: c.name, data: c }))}
              value={form.customerName ? { value: form.customerName, label: form.customerName } : null}
              onChange={(selected) => {
                const customer = selected.data;
                setForm(f => ({
                  ...f,
                  customerName: customer.name,
                  customerEmail: customer.email || "",
                  contact: customer.phoneNo || "",
                  billTo: customer.address || "",
                  gstin: customer.gstNo === 'URP' ? 'URP' : customer.gstNo || "",
                  city: customer.city || "",
                  state: customer.state || "",
                  pincode: customer.pinCode || "",
                  inPunjab: customer.state === "Punjab",
                }));
              }}
              isSearchable
            />
          </div>

          <div className="mb-3">
            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={form.sameAddress}
                onChange={() => setForm(f => ({ 
                  ...f, 
                  sameAddress: !f.sameAddress,
                  ...(f.sameAddress ? {} : { shipTo: f.billTo })
                }))}
              />
              Same Billing & Shipping Address
            </label>
          </div>

          <div className="mb-3">
            <label className="block text-sm font-medium mb-1">Bill To Address</label>
            <textarea
              className="w-full p-2 border rounded"
              rows="3"
              value={form.billTo}
              onChange={(e) => setForm(f => ({ 
                ...f, 
                billTo: e.target.value,
                ...(f.sameAddress && { shipTo: e.target.value })
              }))}
            />
          </div>

          {!form.sameAddress && (
            <div className="mb-3">
              <label className="block text-sm font-medium mb-1">Ship To Address</label>
              <textarea
                className="w-full p-2 border rounded"
                rows="3"
                value={form.shipTo}
                onChange={(e) => setForm(f => ({ ...f, shipTo: e.target.value }))}
              />
            </div>
          )}
        </div>

        {/* Transport Section */}
        <div className="border rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3">Transport & Freight</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Mode of Transport</label>
              <input 
                className="w-full p-2 border rounded" 
                value={form.transportMode} 
                onChange={(e) => setForm(f => ({ ...f, transportMode: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Destination</label>
              <input 
                className="w-full p-2 border rounded" 
                value={form.destination} 
                onChange={(e) => setForm(f => ({ ...f, destination: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Freight Type</label>
              <div className="grid grid-cols-2 gap-2">
                {["Self Pickup", "PAID", "To Pay", "Billed"].map((type) => (
                  <label key={type} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={form.freightType === type}
                      onChange={() => setForm(f => ({ 
                        ...f, 
                        freightType: f.freightType === type ? "" : type,
                        freight: type === "Billed" ? f.freight : 0,
                        toPayAmount: type === "To Pay" ? f.toPayAmount : 0,
                      }))}
                    />
                    {type}
                  </label>
                ))}
              </div>
            </div>
            {form.freightType === "Billed" && (
              <div>
                <label className="block text-sm font-medium mb-1">Freight Amount (₹)</label>
                <input 
                  className="w-full p-2 border rounded" 
                  type="number" 
                  value={form.freight} 
                  onChange={(e) => setForm(f => ({ ...f, freight: Number(e.target.value) }))}
                />
              </div>
            )}
            {form.freightType === "To Pay" && (
              <div>
                <label className="block text-sm font-medium mb-1">To Pay Amount (₹)</label>
                <input 
                  className="w-full p-2 border rounded" 
                  type="number" 
                  value={form.toPayAmount} 
                  onChange={(e) => setForm(f => ({ ...f, toPayAmount: Number(e.target.value) }))}
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-1">Packaging Charges (₹)</label>
              <input 
                className="w-full p-2 border rounded" 
                type="number" 
                value={form.packaging} 
                onChange={(e) => setForm(f => ({ ...f, packaging: Number(e.target.value) }))}
              />
            </div>
          </div>
        </div>

        {/* Payment Terms */}
        <div className="border rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3">Payment Terms</h3>
          <select
            className="w-full border rounded px-3 py-2"
            value={form.paymentTerms === form.customPaymentTerm ? "Other" : form.paymentTerms}
            onChange={(e) => {
              if (e.target.value === "Other") {
                setForm(f => ({ ...f, paymentTerms: f.customPaymentTerm || "" }));
              } else {
                setForm(f => ({ ...f, paymentTerms: e.target.value, customPaymentTerm: "" }));
              }
            }}
          >
            <option value="">-- Select Payment Terms --</option>
            <option value="100% Advance">1) 100% Advance</option>
            <option value="Cash on Delivery">2) Cash on Delivery</option>
            <option value="50% Advance & Balance 50% before Dispatch">3) 50% Advance & Balance 50% before Dispatch</option>
            <option value="Credit: 45 Days">4) Credit: 45 Days</option>
            <option value="Other">5) Other</option>
          </select>

          {(form.paymentTerms === form.customPaymentTerm || form.paymentTerms === "Other") && (
            <input
              type="text"
              className="w-full mt-2 p-2 border rounded"
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
        <div className="border rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3">Products</h3>
          <div className="w-full overflow-x-auto">
            <table className="min-w-[800px] w-full border text-sm">
              <thead className="bg-blue-100">
                <tr>
                  <th className="p-2">#</th>
                  <th className="p-2">Product</th>
                  <th className="p-2">HSN</th>
                  <th className="p-2">Qty</th>
                  <th className="p-2">Unit</th>
                  <th className="p-2">Rate (₹)</th>
                  {form.inPunjab ? (
                    <>
                      <th className="p-2">CGST</th>
                      <th className="p-2">SGST</th>
                    </>
                  ) : (
                    <th className="p-2">IGST</th>
                  )}
                  <th className="p-2">Amount</th>
                  <th className="p-2"></th>
                </tr>
              </thead>
              <tbody>
                {form.products.map((product, index) => {
                  const total = (product.qty || 0) * (product.rate || 0);
                  return (
                    <tr key={index} className="border-t">
                      <td className="p-2 text-center">{index + 1}</td>
                      <td className="p-2 min-w-[200px]">
                    <Select
  options={productsList.map(p => ({ value: p._id, label: p.name, data: p }))}
  value={product.productId ? { value: product.productId, label: product.name } : null}
  onChange={(selected) => handleProductSelect(index, selected)}
  placeholder="Select product..."
  isClearable={true}  // ✅ Allow clearing
/>
                        {/* Show product images */}
                        {selectedImages[index] && selectedImages[index].length > 0 && (
                          <div className="flex gap-1 mt-1">
                            {selectedImages[index].slice(0, 2).map((img, imgIdx) => (
                              <img key={imgIdx} src={img} className="w-8 h-8 object-cover rounded" alt="product" />
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="p-2">{product.hsn || '-'}</td>
                      <td className="p-2">
                        <input
                          className="w-20 p-1 border rounded text-center"
                          type="number"
                          value={product.qty || 0}
                          onChange={(e) => updateProductField(index, 'qty', Number(e.target.value))}
                        />
                      </td>
                      <td className="p-2">{product.unit || '-'}</td>
                      <td className="p-2">
                        <input
                          className="w-24 p-1 border rounded text-right"
                          type="number"
                          value={product.rate || 0}
                          onChange={(e) => updateProductField(index, 'rate', Number(e.target.value))}
                        />
                      </td>
                                           {form.inPunjab ? (
                        <>
                          <td className="p-2 text-center">{((product.gst || 0) / 2).toFixed(2)}%</td>
                          <td className="p-2 text-center">{((product.gst || 0) / 2).toFixed(2)}%</td>
                        </>
                      ) : (
                        <td className="p-2 text-center">{product.gst || 0}%</td>
                      )}
                      <td className="p-2 text-right">₹{total.toFixed(2)}</td>
                      <td className="p-2">
                        <button
                          onClick={() => removeProductRow(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          ❌
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <button 
            onClick={addProductRow} 
            className="mt-3 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition"
          >
            + Add Product
          </button>
        </div>

        {/* Remarks */}
        <div>
          <label className="block text-sm font-medium mb-1">Remarks</label>
          <textarea
            className="w-full p-2 border rounded"
            rows="3"
            value={form.remarks}
            onChange={(e) => setForm(f => ({ ...f, remarks: e.target.value }))}
          />
        </div>

        {/* Submit */}
        <div className="text-center">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className={`bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded shadow transition ${submitting ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {submitting ? "Updating..." : "📄 Update & Regenerate PDF"}
          </button>
        </div>
      </div>
    </>
  );
}