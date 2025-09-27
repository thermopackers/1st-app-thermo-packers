import { useState, useEffect } from "react";
import axiosInstance from "../axiosInstance";
import InternalNavbar from "../components/InternalNavbar";
import toast from "react-hot-toast";
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
import { useNavigate, useLocation } from "react-router-dom";
pdfMake.vfs = pdfFonts.vfs; // ✅ works reliably in React




export default function SendRFQ() {
   const [form, setForm] = useState({
    products: [{
      productId: "",
      itemName: "",
      description: "",
      hsnCode: "",
      img: [],
      gstPercent: "",
      quantity: "",
      unit: "",
      size: "",
      remarks: ""
    }],
    requiredByDate: "",
    category: ""
  });
  const [loading, setLoading] = useState(false);

const addProduct = () => {
  setForm(prev => ({
    ...prev,
    products: [
      ...prev.products,
      {
        productId: "",
        itemName: "",
        description: "",
        hsnCode: "",
        img: [],
        gstPercent: "",
        quantity: "",
        unit: "",
        size: "",
        remarks: ""
      }
    ]
  }));
  
  // Add empty search term for new product
  setProductSearch(prev => [...prev, ""]);
};

const removeProduct = (index) => {
  if (form.products.length === 1) return;
  setForm(prev => ({
    ...prev,
    products: prev.products.filter((_, i) => i !== index)
  }));
  
  // Remove corresponding search term
  setProductSearch(prev => prev.filter((_, i) => i !== index));
};

const updateProduct = (index, field, value) => {
  setForm(prev => ({
    ...prev,
    products: prev.products.map((product, i) => 
      i === index ? { ...product, [field]: value } : product
    )
  }));
};

// Single handleProductSelect function (remove the duplicate)
const handleProductSelect = async (productId, index) => {
  if (!productId) return;

  try {
    const res = await axiosInstance.get(`/purchase-products/${productId}`);
    const product = res.data;
    
    updateProduct(index, 'productId', productId);
    updateProduct(index, 'itemName', product.name || "");
    updateProduct(index, 'description', product.description || "");
    updateProduct(index, 'hsnCode', product.hsnCode || "");
    updateProduct(index, 'gstPercent', product.gstPercent || "");
    updateProduct(index, 'unit', product.unit || "");
    updateProduct(index, 'img', Array.isArray(product.files) 
      ? product.files.map(normalizeImg) 
      : []);
    
    // Set category from first product
    if (index === 0) {
      setForm(prev => ({ ...prev, category: product.category || "" }));
    }
  } catch (err) {
    console.error(err);
    toast.error("Failed to fetch product details");
  }
};

// Update product search handler
const handleProductSearch = (searchTerm, index) => {
  const newSearch = [...productSearch];
  newSearch[index] = searchTerm;
  setProductSearch(newSearch);

  // Debounce the search
  const delayDebounce = setTimeout(() => {
    fetchProducts(searchTerm, index);
  }, 300);

  return () => clearTimeout(delayDebounce);
};

const [searchResults, setSearchResults] = useState({}); // Object to store search results per product index  const [loading, setLoading] = useState(false);
const [productSearch, setProductSearch] = useState([""]); // Initialize as array with one empty string  // Before: const categories = [ "wood", ... ];

// After:
const [categories, setCategories] = useState([]);

useEffect(() => {
  const fetchCategories = async () => {
    try {
      const res = await axiosInstance.get("/categories");
      setCategories(res.data);
    } catch (err) {
      toast.error("Failed to load categories");
    }
  };
  fetchCategories();
}, []);
const normalizeImg = (img) => {
  if (!img) return { url: "" };
  if (typeof img === "string") return { url: img };
  if (img.url) return { url: img.url };
  return { url: "" };
};

  const navigate = useNavigate();
  const location = useLocation();
  const editData = location.state?.rfq;
  const isEditing = Boolean(editData || location.pathname.startsWith("/edit-rfq/"));

const fetchProducts = async (searchTerm = "", index) => {
  if (!searchTerm.trim()) {
    // Clear search results for this index
    setSearchResults(prev => {
      const newResults = { ...prev };
      delete newResults[index];
      return newResults;
    });
    return;
  }

  try {
    const res = await axiosInstance.get(`/purchase-products?search=${encodeURIComponent(searchTerm)}`);
    setSearchResults(prev => ({
      ...prev,
      [index]: res.data.data || []
    }));
  } catch (err) {
    console.error(err);
    toast.error("Failed to load products");
  }
};

  useEffect(() => {


  const prefillForm = (data) => {
      setSearchResults({});

  if (isEditing) {
    // For edit: data is the RFQ document with products array
    const products = Array.isArray(data.products) ? data.products.map(product => ({
      productId: product.productId || "",
      itemName: product.itemName || "",
      description: product.description || "",
      hsnCode: product.hsnCode || "",
      img: Array.isArray(product.img) ? product.img.map(normalizeImg) : [],
      gstPercent: product.gstPercent || "",
      quantity: product.quantity || "",
      unit: product.unit || "",
      size: product.size || "",
      remarks: product.remarks || ""
    })) : [{
      productId: "",
      itemName: "",
      description: "",
      hsnCode: "",
      img: [],
      gstPercent: "",
      quantity: "",
      unit: "",
      size: "",
      remarks: ""
    }];

    setForm({
      products,
      requiredByDate: data.requiredByDate?.split("T")[0] || "",
      category: data.category || ""
    });
    
    // Initialize productSearch with item names
    const searchTerms = products.map(product => product.itemName || "");
    setProductSearch(searchTerms);
  } else {
    // For create: data is the product document (single product)
    let images = [];
    if (Array.isArray(data.files)) {
      images = data.files.map(normalizeImg);
    }

    setForm({
      products: [{
        productId: data.productId || "",
        itemName: data.itemName || "",
        description: data.description || "",
        hsnCode: data.hsnCode || "",
        img: images,
        gstPercent: data.gstPercent || "",
        quantity: data.quantity || "",
        unit: data.unit || "",
        size: data.size || "",
        remarks: data.remarks || ""
      }],
      requiredByDate: data.requiredByDate?.split("T")[0] || "",
      category: data.category || ""
    });
    
    // Initialize productSearch with item name
    setProductSearch([data.itemName || ""]);
  }
};

    const fetchRFQIfEditing = async () => {
      if (!editData && location.pathname.startsWith("/edit-rfq/")) {
        const id = location.pathname.split("/").pop();
        try {
          const res = await axiosInstance.get(`/rfqs/${id}`);
          prefillForm(res.data);
        } catch (err) {
          console.error(err);
          toast.error("Failed to load RFQ for editing");
        }
      } else if (editData) {
        prefillForm(editData);
      }
    };

    fetchRFQIfEditing();
  }, [editData, location.pathname]);

function chunkArray(arr, size) {
  const result = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}

const formatDateDDMMYYYY = (dateInput) => {
  if (!dateInput) return "";
  const d = new Date(dateInput);
  if (isNaN(d)) return "";
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);

  try {
    const user = JSON.parse(localStorage.getItem("user"));

    // Helper to convert image to Base64
    const getBase64ImageFromURL = (url, maxWidth = 150) =>
      new Promise((resolve, reject) => {
        const img = new Image();
        img.setAttribute("crossOrigin", "anonymous");
        img.onload = () => {
          const scale = maxWidth / img.width;
          const canvas = document.createElement("canvas");
          canvas.width = maxWidth;
          canvas.height = img.height * scale;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL("image/png", 0.6));
        };
        img.onerror = (error) => reject(error);
        img.src = url;
      });

    // Convert logo
    const logoUrl = "https://res.cloudinary.com/dcr8k5amk/image/upload/todos/mnafzqlnhno1bidybmso.jpg";
    const logoBase64 = await getBase64ImageFromURL(logoUrl);

    const rfqDate = formatDateDDMMYYYY(form.requiredByDate || new Date());

    // Process images for all products
    const productsWithImages = await Promise.all(
      form.products.map(async (product) => {
        let productImagesBase64 = [];
        if (product.img.length > 0) {
          productImagesBase64 = await Promise.all(
            product.img.map(async (img) => {
              const imgUrl = typeof img === "string" ? img : img.url;
              try {
                return await getBase64ImageFromURL(imgUrl, 150);
              } catch {
                console.warn(`Could not load product image: ${imgUrl}`);
                return null;
              }
            })
          );
          productImagesBase64 = productImagesBase64.filter(Boolean);
        }
        return { ...product, productImagesBase64 };
      })
    );

    // Build product tables for PDF
    const productTables = productsWithImages.map((product, index) => {
      const productRows = [
        // Product header
        [{ text: `Product ${index + 1}`, style: 'header', bold: true, fontSize: 12, colSpan: 2, margin: [0, 10, 0, 5] }, {}],
        
        // Product images
        [
          product.productImagesBase64.length > 0
            ? {
                table: {
                  body: chunkArray(
                    product.productImagesBase64.map((img) => ({
                      image: img,
                      width: 80,
                      alignment: "center",
                      margin: [2, 2, 2, 2]
                    })),
                    3
                  )
                },
                layout: "noBorders",
                colSpan: 2
              }
            : { text: "(No product image)", alignment: "center", colSpan: 2, italics: true, margin: [0, 5, 0, 5] },
          {}
        ],

        // Product details
        [{ text: "Item Name", bold: true }, product.itemName],
        [{ text: "Description", bold: true }, product.description],
        [{ text: "Quantity", bold: true }, product.quantity],
        [{ text: "Unit", bold: true }, product.unit || "N/A"],
        [{ text: "HSN Code", bold: true }, product.hsnCode],
        [{ text: "GST (%)", bold: true }, product.gstPercent],
        [{ text: "Size", bold: true }, product.size || "N/A"],
        [{ text: "Remarks", bold: true }, product.remarks || "None"],
        
        // Separator between products (except for last product)
        index < productsWithImages.length - 1 
          ? [{ canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 0.5, lineColor: '#cccccc' }], colSpan: 2, margin: [0, 10, 0, 5] }, {}]
          : [{ text: "", colSpan: 2 }, {}]
      ];

      return productRows;
    }).flat();

    // Build full RFQ document
    const docDefinition = {
      content: [
        {
          table: {
            widths: ["50%", "50%"],
            body: [
              // Row 1 - Company Info + Logo
              [
                {
                  stack: [
                    { text: "GSTIN: 03AACFT3599H1Z1", fontSize: 10 },
                    { text: "Phone (O): 9216562160", fontSize: 10 },
                    { text: "M: 9216860160", fontSize: 10 }
                  ],
                  border: [true, true, true, true],
                  margin: [5, 5, 5, 5]
                },
                {
                  image: logoBase64,
                  width: 80,
                  alignment: "right",
                  border: [true, true, true, true],
                  margin: [5, 5, 5, 5]
                }
              ],

              // Row 2 - Company Name & Address
              [
                {
                  stack: [
                    { text: "THERMO PACKERS", fontSize: 16, bold: true, alignment: "center", margin: [0, 0, 0, 3] },
                    {
                      text:
                        "Mfrs & Suppliers of Thermocol Sheets, All Kinds of Thermocol Packing, PU Products\n" +
                        "VILL SANGAL SOHAL, OPP JALANDHAR KUNJ, KAPURTHALA ROAD, JALANDHAR-144031 (PUNJAB)\n" +
                        "E-mail: thermopackers@gmail.com",
                      fontSize: 9,
                      alignment: "center"
                    }
                  ],
                  colSpan: 2,
                  margin: [0, 5, 0, 5]
                },
                {}
              ],

              // Row 3 - RFQ Heading
              [
                {
                  text: "RFQ (Request For Quotation)",
                  fontSize: 14,
                  bold: true,
                  alignment: "center",
                  colSpan: 2,
                  margin: [0, 5, 0, 5]
                },
                {}
              ],
              
              // RFQ Date
              [
                { text: "Date", bold: true },
                { text: rfqDate }
              ],
              
              // RFQ General Information
              [{ text: "Required By", bold: true }, formatDateDDMMYYYY(form.requiredByDate)],
              [{ text: "Category", bold: true }, form.category],
              [{ text: "Total Products", bold: true }, form.products.length.toString()],
              
              // Separator before products
              [{ canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1 }], colSpan: 2, margin: [0, 10, 0, 5] }, {}],
              
              // Products section header
              [{ text: "PRODUCTS", style: 'header', bold: true, fontSize: 12, colSpan: 2, alignment: "center", margin: [0, 10, 0, 10] }, {}],
              
              // All product tables
              ...productTables
            ]
          },
          layout: "lightHorizontalLines"
        }
      ],
      defaultStyle: { fontSize: 10 },
      styles: {
        header: {
          fontSize: 12,
          bold: true,
          margin: [0, 5, 0, 5]
        }
      }
    };

    // Generate PDF Blob
    const pdfBlob = await new Promise((resolve) => {
      pdfMake.createPdf(docDefinition).getBlob((blob) => resolve(blob), { imageQuality: 0.5 });
    });

    // Upload to Cloudinary
    const cloudFormData = new FormData();
    cloudFormData.append("file", pdfBlob, `RFQ_${Date.now()}.pdf`);
    cloudFormData.append("upload_preset", "rfq_uploads");
    cloudFormData.append("cloud_name", "dcr8k5amk");

    const cloudRes = await fetch(`https://api.cloudinary.com/v1_1/dcr8k5amk/auto/upload`, {
      method: "POST",
      body: cloudFormData
    });
    const cloudData = await cloudRes.json();
    if (!cloudData.secure_url) throw new Error("Cloudinary upload failed");

    // Create or Update RFQ
    if (isEditing) {
      await axiosInstance.put(`/rfqs/${editData?._id}`, {
        fileUrl: cloudData.secure_url,
        createdBy: user?._id,
        products: form.products,
        requiredByDate: form.requiredByDate,
        category: form.category
      });
      toast.success("RFQ updated successfully!");
    } else {
      await axiosInstance.post("/rfqs", {
        fileUrl: cloudData.secure_url,
        createdBy: user?._id,
        products: form.products,
        requiredByDate: form.requiredByDate,
        category: form.category
      });
      toast.success("RFQ PDF uploaded successfully!");
    }

    navigate("/view-rfqs");
  } catch (err) {
    console.error(err);
    toast.error("Failed to save RFQ.");
  } finally {
    setLoading(false);
  }
};




return (
  <>
    <InternalNavbar />
    <div className="max-w-4xl mx-auto p-6 relative">
      <h2 className="text-2xl font-bold mb-4 text-center">
        {isEditing ? "✏ Edit RFQ" : "📩 Create RFQ"}
      </h2>

      {loading && (
        <div className="absolute inset-0 bg-white/80 flex justify-center items-center z-50 rounded">
          <div className="loader border-t-4 border-blue-500 border-solid rounded-full w-12 h-12 animate-spin"></div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Add Product Button */}
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Products ({form.products.length})</h3>
          <button
            type="button"
            onClick={addProduct}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            + Add Another Product
          </button>
        </div>

        {/* Product Sections */}
        {form.products.map((product, index) => (
          <div key={index} className="border p-4 rounded-lg bg-gray-50">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-semibold text-lg">Product {index + 1}</h4>
              {form.products.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeProduct(index)}
                  className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                >
                  Remove
                </button>
              )}
            </div>

            {/* Product Search */}
     <div className="mb-4">
  <label className="block font-semibold mb-2">Select Product</label>
  <div className="relative">
    <input
      type="text"
      placeholder="Search and select product..."
      className="w-full border p-2 rounded"
      value={productSearch[index] || ""}
      onChange={(e) => handleProductSearch(e.target.value, index)}
      onFocus={() => {
        // Show results for this specific input
        if (productSearch[index]?.trim()) {
          fetchProducts(productSearch[index], index);
        }
      }}
      onBlur={() => setTimeout(() => {
        // Clear search results for this index when blurred
        setSearchResults(prev => {
          const newResults = { ...prev };
          delete newResults[index];
          return newResults;
        });
      }, 200)}
    />
    
    {/* Show dropdown only for the current product's search results */}
    {searchResults[index] && searchResults[index].length > 0 && (
      <ul className="absolute z-10 bg-white border rounded w-full max-h-48 overflow-y-auto mt-1 shadow-lg">
        {searchResults[index].map((p) => (
          <li
            key={p._id}
            className="p-2 hover:bg-blue-100 cursor-pointer border-b"
            onClick={() => {
              handleProductSelect(p._id, index);
              const newSearch = [...productSearch];
              newSearch[index] = p.name;
              setProductSearch(newSearch);
              // Clear search results for this index after selection
              setSearchResults(prev => {
                const newResults = { ...prev };
                delete newResults[index];
                return newResults;
              });
            }}
          >
            {p.name}
          </li>
        ))}
      </ul>
    )}
  </div>
</div>

            {/* Product Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Auto-filled fields */}
              <div>
                <label className="block font-semibold">Item Name</label>
                <input
                  type="text"
                  readOnly
                  className="w-full border p-2 rounded bg-gray-100"
                  value={product.itemName}
                />
              </div>

              <div>
                <label className="block font-semibold">Unit</label>
                <input
                  type="text"
                  readOnly
                  className="w-full border p-2 rounded bg-gray-100"
                  value={product.unit}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block font-semibold">Description</label>
                <textarea
                  readOnly
                  className="w-full border p-2 rounded bg-gray-100"
                  value={product.description}
                />
              </div>

              <div>
                <label className="block font-semibold">HSN Code</label>
                <input
                  type="text"
                  readOnly
                  className="w-full border p-2 rounded bg-gray-100"
                  value={product.hsnCode}
                />
              </div>

              <div>
                <label className="block font-semibold">GST (%)</label>
                <input
                  type="text"
                  readOnly
                  className="w-full border p-2 rounded bg-gray-100"
                  value={product.gstPercent}
                />
              </div>

              {/* Editable fields */}
              <div>
                <label className="block font-semibold">Quantity *</label>
                <input
                  type="number"
                  required
                  className="w-full border p-2 rounded"
                  value={product.quantity}
                  onChange={(e) => updateProduct(index, 'quantity', e.target.value)}
                />
              </div>

              <div>
                <label className="block font-semibold">Size (Optional)</label>
                <input
                  type="text"
                  className="w-full border p-2 rounded"
                  value={product.size}
                  onChange={(e) => updateProduct(index, 'size', e.target.value)}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block font-semibold">Remarks</label>
                <textarea
                  rows={2}
                  className="w-full border p-2 rounded"
                  value={product.remarks}
                  onChange={(e) => updateProduct(index, 'remarks', e.target.value)}
                />
              </div>
            </div>

            {/* Product Images */}
            {product.img.filter(img => img.url).length > 0 && (
              <div className="mt-4">
                <label className="block font-semibold">Product Images</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {product.img.map((image, idx) => (
                    image.url && (
                      <img
                        key={idx}
                        src={image.url}
                        alt={`Product ${index + 1} Image ${idx + 1}`}
                        className="w-20 h-20 object-cover rounded border"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    )
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}

        {/* RFQ General Information */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4">RFQ Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold">Required By Date *</label>
              <input
                type="date"
                name="requiredByDate"
                required
                className="w-full border p-2 rounded"
                value={form.requiredByDate}
                onChange={(e) => setForm(prev => ({ ...prev, requiredByDate: e.target.value }))}
              />
            </div>

            <div>
              <label className="block font-semibold">Category *</label>
              <select
                name="category"
                required
                className="w-full border p-2 rounded bg-white"
                value={form.category}
                onChange={(e) => setForm(prev => ({ ...prev, category: e.target.value }))}
              >
                <option value="">-- Select Category --</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex gap-2 pt-4">
          <button
            type="submit"
            className={`flex-1 ${
              isEditing ? "bg-yellow-600 hover:bg-yellow-700" : "bg-green-600 hover:bg-green-700"
            } text-white font-semibold py-3 rounded`}
          >
            {isEditing ? "♻ Update RFQ PDF" : "📄 Create RFQ PDF"}
          </button>

          {isEditing && (
            <button
              type="button"
              onClick={() => navigate("/view-rfqs")}
              className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 rounded"
            >
              ❌ Cancel Edit
            </button>
          )}
        </div>
      </form>
    </div>

    <style>{`
      .loader {
        border-top-color: #3b82f6;
        animation: spin 1s linear infinite;
      }
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    `}</style>
  </>
);
}

