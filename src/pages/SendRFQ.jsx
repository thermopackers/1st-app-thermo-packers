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
    productId: "",
    itemName: "",
    description: "",
    hsnCode: "",
    img: [],
    gstPercent: "",
    quantity: "",
    requiredByDate: "",
    size: "",
    remarks: "",
    category: "",
    unit:"",
  });
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  // Before: const categories = [ "wood", ... ];

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

  const fetchProducts = async (searchTerm = "") => {
try {
  const res = await axiosInstance.get(`/purchase-products?search=${encodeURIComponent(searchTerm)}`);
  setProducts(res.data.data || []);
} catch (err) {
  console.error(err);
  toast.error("Failed to load products");
}
};
  useEffect(() => {


   const prefillForm = (data) => {
  // Handle images differently for edit vs create
  let images = [];
  
  if (isEditing) {
    // For edit: data is the RFQ document
    if (Array.isArray(data.img)) {
      images = data.img.map(normalizeImg);
    } else if (data.img && data.img.url) {
      images = [normalizeImg(data.img)];
    }
  } else {
    // For create: data is the product document
    if (Array.isArray(data.files)) {
      images = data.files.map(normalizeImg);
    }
  }

  setForm({
    productId: data.productId || "",
    itemName: data.itemName || "",
    description: data.description || "",
    hsnCode: data.hsnCode || "",
    img: images, // Use the processed images array
    gstPercent: data.gstPercent || "",
    quantity: data.quantity || "",
    requiredByDate: data.requiredByDate?.split("T")[0] || "",
    size: data.size || "",
    remarks: data.remarks || "",
    category: data.category || "",
      unit: data.unit || "" // ✅
  });
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

// ✅ Keep your existing useEffect for typing search
useEffect(() => {
  if (!productSearch.trim()) {
    setProducts([]); // hide if empty and not focused
    return;
  }

  const delayDebounce = setTimeout(() => {
    fetchProducts(productSearch);
  }, 300);

  return () => clearTimeout(delayDebounce);
}, [productSearch]);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

const handleProductSelect = async (e) => {
  const productId = e.target.value;
  setForm((prev) => ({ ...prev, productId }));

  if (!productId) return;

  try {
    const res = await axiosInstance.get(`/purchase-products/${productId}`);
    const product = res.data;
    
    setForm((prev) => ({
      ...prev,
      productId,
      itemName: product.name || "",
      description: product.description || "",
      hsnCode: product.hsnCode || "",
      gstPercent: product.gstPercent || "",
      img: Array.isArray(product.files) 
        ? product.files.map(normalizeImg) 
        : [],
      category: product.category || "",
        unit: product.unit || "" // ✅ fetch from API
    }));
  } catch (err) {
    console.error(err);
    toast.error("Failed to fetch product details");
  }
};
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

    // Convert product image if available
let productImagesBase64 = [];
if (form.img.length > 0) {
  productImagesBase64 = await Promise.all(
    form.img.map(async (img) => {
      const imgUrl = typeof img === "string" ? img : img.url;
      try {
        return await getBase64ImageFromURL(imgUrl, 150);
      } catch {
        console.warn(`Could not load product image: ${imgUrl}`);
        return null;
      }
    })
  );
  // Filter out any that failed to load
  productImagesBase64 = productImagesBase64.filter(Boolean);
}
const rfqDate = formatDateDDMMYYYY(form.requiredByDate || new Date());

    // Build full invoice table
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
  [
            { text: "Date", bold: true },
            { text: rfqDate }
          ],
          // Row 4 - Product Image
    [
  productImagesBase64.length > 0
    ? {
        table: {
          body: chunkArray(
            productImagesBase64.map((img) => ({
              image: img,
              width: 80, // thumbnail size
              alignment: "center",
              margin: [2, 2, 2, 2]
            })),
            3 // images per row
          )
        },
        layout: "noBorders",
        colSpan: 2
      }
    : { text: "(No product image)", alignment: "center", colSpan: 2, italics: true, margin: [0, 5, 0, 5] },
  {}
],


          // RFQ Details
          [{ text: "Item Name", bold: true }, form.itemName],
          [{ text: "Description", bold: true }, form.description],
          [{ text: "Quantity", bold: true }, form.quantity],
                    [{ text: "Unit", bold: true }, form.unit || "N/A"], // Added this new line
          [{ text: "HSN Code", bold: true }, form.hsnCode],
          [{ text: "GST (%)", bold: true }, form.gstPercent],
[{ text: "Required By", bold: true }, formatDateDDMMYYYY(form.requiredByDate)],
          [{ text: "Size", bold: true }, form.size || "N/A"],
          [{ text: "Category", bold: true }, form.category],
          [{ text: "Remarks", bold: true }, form.remarks || "None"]
        ]
      },
      layout: "lightHorizontalLines"
    }
  ],
  defaultStyle: { fontSize: 10 }
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
        ...form
      });
      toast.success("RFQ updated successfully!");
    } else {
      await axiosInstance.post("/rfqs", {
        fileUrl: cloudData.secure_url,
        createdBy: user?._id,
        ...form
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
      <div className="max-w-xl mx-auto p-6 relative">
        <h2 className="text-2xl font-bold mb-4 text-center">
          {isEditing ? "✏ Edit RFQ" : "📩 Create RFQ"}
        </h2>

        {loading && (
          <div className="absolute inset-0 bg-white/80 flex justify-center items-center z-50 rounded">
            <div className="loader border-t-4 border-blue-500 border-solid rounded-full w-12 h-12 animate-spin"></div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
    {/* Product Dropdown */}
         <label className="block font-semibold">Select Product</label>
<div className="relative">
<input
  type="text"
  placeholder="Search and select product..."
  className="w-full border p-2 rounded"
  value={productSearch}
  onChange={(e) => setProductSearch(e.target.value)}
  onFocus={() => {
    setIsInputFocused(true);
    if (!productSearch.trim()) {
      fetchProducts(""); // fetch all products when empty & focused
    }
  }}
  onBlur={() => {
    // Small delay so click on dropdown still works
    setTimeout(() => {
      setIsInputFocused(false);
      setProducts([]);
    }, 200);
  }}
/>
{isInputFocused && products.length > 0 && (
  <ul className="absolute z-10 bg-white border rounded w-full max-h-48 overflow-y-auto">
    {products.map((p) => (
      <li
        key={p._id}
        className="p-2 hover:bg-blue-100 cursor-pointer"
        onClick={() => {
          handleProductSelect({ target: { value: p._id } });
          setProductSearch(p.name);
          setProducts([]);
          setIsInputFocused(false);
        }}
      >
        {p.name}
      </li>
    ))}
  </ul>
)}
  {products.length > 0 && (
    <ul className="absolute z-10 bg-white border rounded w-full max-h-48 overflow-y-auto">
      {products.map((p) => (
        <li
          key={p._id}
          className="p-2 hover:bg-blue-100 cursor-pointer"
          onClick={() => {
            handleProductSelect({ target: { value: p._id } });
            setProductSearch(p.name); // fill input with selected name
            setProducts([]); // hide list
          }}
        >
          {p.name}
        </li>
      ))}
    </ul>
  )}
</div>

<label className="block font-semibold">Unit</label>
<input
  type="text"
  name="unit"
  readOnly
  className="w-full border p-2 rounded bg-gray-100"
  value={form.unit}
/>

          {/* Auto-filled fields */}
          <label className="block font-semibold">Description</label>
          <textarea name="description" readOnly
            className="w-full border p-2 rounded bg-gray-100" value={form.description} />

          <label className="block font-semibold">HSN Code</label>
          <input type="text" name="hsnCode" readOnly
            className="w-full border p-2 rounded bg-gray-100" value={form.hsnCode} />

          <label className="block font-semibold">GST (%)</label>
          <input type="text" name="gstPercent" readOnly
            className="w-full border p-2 rounded bg-gray-100" value={form.gstPercent} />

    {form.img.filter(img => img.url).length > 0 && (
  <>
    <label className="block font-semibold">Product Images</label>
    <div className="flex flex-wrap gap-2">
      {form.img.map((image, idx) => (
        image.url && (
          <img
            key={idx}
            src={image.url}
            alt={`Product ${idx + 1}`}
            className="w-32 h-32 object-cover rounded border"
            onError={(e) => {
              e.target.style.display = 'none'; // Hide broken images
            }}
          />
        )
      ))}
    </div>
  </>
)}

          {/* Editable fields */}
          <label className="block font-semibold">Quantity</label>
          <input type="number" name="quantity" required
            className="w-full border p-2 rounded" value={form.quantity} onChange={handleChange} />

          <label className="block font-semibold">Required By Date</label>
          <input type="date" name="requiredByDate" required
            className="w-full border p-2 rounded" value={form.requiredByDate} onChange={handleChange} />

          <label className="block font-semibold">Size (Optional)</label>
          <input type="text" name="size"
            className="w-full border p-2 rounded" value={form.size} onChange={handleChange} />

          <label className="block font-semibold">Remarks</label>
          <textarea name="remarks" rows={3}
            className="w-full border p-2 rounded" value={form.remarks} onChange={handleChange} />

          <label className="block font-semibold">Category</label>
         <select
  name="category"
  required
  className="w-full border p-2 rounded bg-white"
  value={form.category}
  onChange={handleChange}
>
  <option value="">-- Select Category --</option>
  {categories.map((cat) => (
    <option key={cat._id} value={cat.name}>
      {cat.name}
    </option>
  ))}
</select>

          <div className="flex gap-2">
            <button
              type="submit"
              className={`flex-1 ${
                isEditing ? "bg-yellow-600 hover:bg-yellow-700" : "bg-green-600 hover:bg-green-700"
              } text-white font-semibold py-2 rounded`}
            >
              {isEditing ? "♻ Update RFQ PDF" : "📄 Create RFQ PDF"}
            </button>

            {isEditing && (
              <button
                type="button"
                onClick={() => navigate("/view-rfqs")}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 rounded"
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

