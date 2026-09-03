import { useEffect, useState } from "react";
import axiosInstance from "../axiosInstance";
import { useNavigate } from "react-router-dom";
import InternalNavbar from "../components/InternalNavbar";
import toast from "react-hot-toast";
import { useUserContext } from "../context/UserContext";
import Swal from 'sweetalert2';

const INDIAN_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh",
  "Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka",
  "Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram",
  "Nagaland","Odisha","Rajasthan","Sikkim","Tamil Nadu","Telangana",
  "Tripura","Uttar Pradesh","Uttarakhand","West Bengal",
  "Andaman and Nicobar Islands","Chandigarh","Dadra and Nagar Haveli and Daman and Diu",
  "Delhi","Jammu and Kashmir","Ladakh","Lakshadweep","Puducherry","Punjab"
];

export default function AddCustomer() {
    const { user } = useUserContext();
    // ✅ ADD: Helper function to parse roles properly
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

  const [gstFiles, setGstFiles] = useState([]); // Accepts images or PDFs
const [gstError, setGstError] = useState("");
const [udyogFiles, setUdyogFiles] = useState([]); // ✅ NEW
const [udyogError, setUdyogError] = useState(""); // ✅ NEW
const [categories, setCategories] = useState([]);
const [allUsers, setAllUsers] = useState([]);
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

useEffect(() => {
  async function fetchUsers() {
    try {
      const res = await axiosInstance.get("/users/all");
      setAllUsers(res.data);
    } catch (err) {
      console.error("Failed to load sales users", err);
    }
  }

  fetchUsers();
}, []);

  const [formData, setFormData] = useState({
    name: "",
    company: "",
    phone: "",
    email: "",
    address: "",
state: "",
city: "",
pincode: "",
inPunjab: false,
      locationLink: "", // ✅ New field
        instructions: "", // ✅ NEW FIELD
          salesCategory: "", // ✅ NEW FIELD
            createdBy: user?._id || "", // Add this line - pre-fill with current user's ID
  });
const [submitting, setSubmitting] = useState(false);

  const navigate = useNavigate();
const handleFileChange = (e) => {
  const files = Array.from(e.target.files);
  setGstFiles((prev) => [...prev, ...files]);
};

// ✅ NEW: Udyog Aadhar file handlers
const handleUdyogFileChange = (e) => {
  const files = Array.from(e.target.files);
  setUdyogFiles((prev) => [...prev, ...files]);
};

const handleRemoveUdyogFile = (index) => {
  setUdyogFiles((prev) => prev.filter((_, i) => i !== index));
};

const handleRemoveFile = (index) => {
  setGstFiles((prev) => prev.filter((_, i) => i !== index));
};

const uploadToCloudinary = async (files) => {
  const uploads = files.map(async (file) => {
    const data = new FormData();
    data.append("file", file);
    data.append("upload_preset", "todo_uploads"); // Replace with your preset
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

const handleChange = (e) => {
  const { name, value } = e.target;

  if (name === "company") {
    if (value.length !== 15) {
      setGstError("GST number must be exactly 15 characters.");
    } else {
      setGstError("");
    }
  }

setFormData((prev) => ({
  ...prev,
  [name]: value,
  ...(name === "state" && { inPunjab: value === "Punjab" }),
}));
};


const handleSubmit = async (e) => {
  e.preventDefault();
  setSubmitting(true);
  
  const customerData = { ...formData };
  
  // Validate GST
  if (customerData.company && customerData.company !== "URP" && customerData.company.length !== 15) {
    setGstError("GST number must be exactly 15 characters.");
    toast.error("GST number must be exactly 15 characters.");
    setSubmitting(false);
    return;
  }
  
  if (!customerData.company || customerData.company.trim() === "") {
    customerData.company = "URP";
  }

  if (!customerData.createdBy || customerData.createdBy.trim() === "") {
    customerData.createdBy = user?._id || "";
  }

  try {
    let uploadedUrls = [];
    let uploadedUdyogUrls = []; // ✅ NEW
    
    if (gstFiles.length > 0) {
      toast.loading("Uploading GST documents...");
      uploadedUrls = await uploadToCloudinary(gstFiles);
      toast.dismiss();
    }
    
    // ✅ NEW: Upload Udyog Aadhar files
    if (udyogFiles.length > 0) {
      toast.loading("Uploading Udyog Aadhar documents...");
      uploadedUdyogUrls = await uploadToCloudinary(udyogFiles);
      toast.dismiss();
    }

    const payload = {
      ...customerData,
      gstDocs: uploadedUrls,
      udyogAadharDocs: uploadedUdyogUrls, // ✅ NEW
    };
    
    await axiosInstance.post("/customers", payload);
    toast.success("Customer added successfully!");
    
    const userRoles = parseUserRoles(user);
    if (userRoles.includes("sales")) {
      navigate('/dashboard');
    } else {
      navigate("/customers");
    }
    
  } catch (err) {
    console.error("Customer addition failed", err);
    if (err.response?.status === 400 && err.response?.data?.error) {
      toast.error(err.response.data.error);
    } else {
      toast.error("Failed to add customer");
    }
  } finally {
    setSubmitting(false);
  }
};
    const userRoles = parseUserRoles(user);

  return (
    <>
      <InternalNavbar />

      <div className="max-w-2xl mx-auto mt-8 px-4 sm:px-6 lg:px-8">
        <div className="relative bg-white p-6 sm:p-8 rounded-2xl shadow-lg">
          <button
            className="absolute left-4 cursor-pointer top-4 hidden md:inline-block bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded shadow"
            onClick={() => navigate(-1)}
          >
            ↩️ Back
          </button>

          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6 text-center">
            Add New Customer
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block mb-1 font-medium text-gray-700">Name</label>
              <input
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="Customer Name"
              />
            </div>

          <div>
  <label className="block mb-1 font-medium text-gray-700">GST No. (Leave this field if no GST No. It will take URP automatically)</label>
  <input
    name="company"
    value={formData.company}
    onChange={handleChange}
    className={`w-full px-4 py-2 border ${
      gstError ? "border-red-500" : "border-gray-300"
    } rounded-md focus:outline-none focus:ring-2 ${
      gstError ? "focus:ring-red-400" : "focus:ring-blue-400"
    }`}
    placeholder={formData.company?.trim() === "" ? "URP (If no GST No.)" : "GST No."}
  />
  {gstError && (
    <p className="text-red-500 text-sm mt-1">{gstError}</p>
  )}
</div>

<div>
  <label className="block mb-1 font-medium text-gray-700">
   GST Certificate (Mandatory - Upload PDF of JPG File of GST Certificate and should not be written Text)
  </label>
  <input
    type="file"
    multiple
    accept="image/*,.pdf"
    onChange={handleFileChange}
    className="block w-full bg-amber-200 p-1"
  />
</div>
{gstFiles.length > 0 && (
  <div className="space-y-2 mt-4">
    <p className="font-semibold">Selected GST Files:</p>
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {gstFiles.map((file, index) => {
        const isImage = file.type.startsWith("image/");
        const isPDF = file.type === "application/pdf";
        const fileUrl = URL.createObjectURL(file);

        return (
          <div
            key={index}
            className="relative border rounded-md p-2 bg-gray-100"
          >
            {isImage ? (
              <div
                onClick={() => {
                  Swal.fire({
                    title: 'Preview - GST Document',
                    imageUrl: fileUrl,
                    imageWidth: '80%',
                    imageHeight: 'auto',
                    imageAlt: 'GST Document Preview',
                    showCloseButton: true,
                    showConfirmButton: false,
                    padding: '2rem',
                    background: '#fff',
                    width: 'auto',
                    maxWidth: '90vw',
                  });
                }}
                className="cursor-pointer"
              >
                <img
                  src={fileUrl}
                  alt="preview"
                  className="w-full h-32 object-contain rounded hover:opacity-80 transition-opacity"
                />
                <span className="text-xs text-blue-600 mt-1 block text-center">Click to preview</span>
              </div>
            ) : isPDF ? (
              <div
                onClick={() => {
                  Swal.fire({
                    title: 'Preview - PDF Document',
                    html: `
                      <div style="width: 100%; height: 70vh;">
                        <iframe 
                          src="${fileUrl}" 
                          style="width: 100%; height: 100%; border: none;"
                          frameborder="0"
                        ></iframe>
                      </div>
                      <div style="margin-top: 10px;">
                        <p style="font-size: 14px; color: #666;">File: ${file.name}</p>
                      </div>
                    `,
                    showCloseButton: true,
                    showConfirmButton: false,
                    width: '90%',
                    maxWidth: '900px',
                    padding: '1rem',
                    background: '#fff',
                  });
                }}
                className="cursor-pointer hover:bg-gray-200 rounded transition-colors"
              >
                <div className="flex flex-col items-center justify-center h-32">
                  <span className="text-red-600 font-bold text-4xl">📄</span>
                  <span className="text-sm mt-2 text-center break-all text-blue-600 underline">
                    {file.name}
                  </span>
                  <span className="text-xs text-gray-500 mt-1">Click to view</span>
                </div>
              </div>
            ) : (
              <div
                onClick={() => {
                  Swal.fire({
                    title: 'File Preview',
                    html: `
                      <div style="padding: 20px;">
                        <p>File: ${file.name}</p>
                        <p style="color: #666; font-size: 14px;">Type: ${file.type || 'Unknown'}</p>
                        <p style="color: #666; font-size: 14px;">Size: ${(file.size / 1024).toFixed(2)} KB</p>
                      </div>
                    `,
                    showCloseButton: true,
                    showConfirmButton: false,
                  });
                }}
                className="cursor-pointer hover:bg-gray-200 rounded transition-colors"
              >
                <div className="flex flex-col items-center justify-center h-32">
                  <span className="text-3xl">📎</span>
                  <span className="text-sm mt-2 text-center break-all text-blue-600">
                    {file.name}
                  </span>
                  <span className="text-xs text-gray-500 mt-1">Click to view</span>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => handleRemoveFile(index)}
              className="absolute top-1 right-1 bg-red-500 text-white text-xs px-2 py-1 rounded hover:bg-red-600"
            >
              ✖
            </button>
          </div>
        );
      })}
    </div>
  </div>
)}

{/* ✅ NEW: Udyog Aadhar Number Field */}
{/* <div>
  <label className="block mb-1 font-medium text-gray-700">
    Udyog Aadhar Number (Upload PDF or Image File)
  </label>
  <input
    type="file"
    multiple
    accept="image/*,.pdf"
    onChange={handleUdyogFileChange}
    className="block w-full bg-amber-200 p-1"
  />
</div> */}
{/* {udyogFiles.length > 0 && (
  <div className="space-y-2 mt-4">
    <p className="font-semibold">Selected Udyog Aadhar Files:</p>
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {udyogFiles.map((file, index) => {
        const isImage = file.type.startsWith("image/");
        const isPDF = file.type === "application/pdf";
        const fileUrl = URL.createObjectURL(file);

        return (
          <div
            key={index}
            className="relative border rounded-md p-2 bg-gray-100"
          >
            {isImage ? (
              <div
                onClick={() => {
                  Swal.fire({
                    title: 'Preview - Udyog Aadhar Document',
                    imageUrl: fileUrl,
                    imageWidth: '80%',
                    imageHeight: 'auto',
                    imageAlt: 'Udyog Aadhar Document Preview',
                    showCloseButton: true,
                    showConfirmButton: false,
                    padding: '2rem',
                    background: '#fff',
                    width: 'auto',
                    maxWidth: '90vw',
                  });
                }}
                className="cursor-pointer"
              >
                <img
                  src={fileUrl}
                  alt="preview"
                  className="w-full h-32 object-contain rounded hover:opacity-80 transition-opacity"
                />
                <span className="text-xs text-blue-600 mt-1 block text-center">Click to preview</span>
              </div>
            ) : isPDF ? (
              <div
                onClick={() => {
                  Swal.fire({
                    title: 'Preview - Udyog Aadhar PDF',
                    html: `
                      <div style="width: 100%; height: 70vh;">
                        <iframe 
                          src="${fileUrl}" 
                          style="width: 100%; height: 100%; border: none;"
                          frameborder="0"
                        ></iframe>
                      </div>
                      <div style="margin-top: 10px;">
                        <p style="font-size: 14px; color: #666;">File: ${file.name}</p>
                      </div>
                    `,
                    showCloseButton: true,
                    showConfirmButton: false,
                    width: '90%',
                    maxWidth: '900px',
                    padding: '1rem',
                    background: '#fff',
                  });
                }}
                className="cursor-pointer hover:bg-gray-200 rounded transition-colors"
              >
                <div className="flex flex-col items-center justify-center h-32">
                  <span className="text-red-600 font-bold text-4xl">📄</span>
                  <span className="text-sm mt-2 text-center break-all text-blue-600 underline">
                    {file.name}
                  </span>
                  <span className="text-xs text-gray-500 mt-1">Click to view</span>
                </div>
              </div>
            ) : (
              <div
                onClick={() => {
                  Swal.fire({
                    title: 'File Preview',
                    html: `
                      <div style="padding: 20px;">
                        <p>File: ${file.name}</p>
                        <p style="color: #666; font-size: 14px;">Type: ${file.type || 'Unknown'}</p>
                        <p style="color: #666; font-size: 14px;">Size: ${(file.size / 1024).toFixed(2)} KB</p>
                      </div>
                    `,
                    showCloseButton: true,
                    showConfirmButton: false,
                  });
                }}
                className="cursor-pointer hover:bg-gray-200 rounded transition-colors"
              >
                <div className="flex flex-col items-center justify-center h-32">
                  <span className="text-3xl">📎</span>
                  <span className="text-sm mt-2 text-center break-all text-blue-600">
                    {file.name}
                  </span>
                  <span className="text-xs text-gray-500 mt-1">Click to view</span>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => handleRemoveUdyogFile(index)}
              className="absolute top-1 right-1 bg-red-500 text-white text-xs px-2 py-1 rounded hover:bg-red-600"
            >
              ✖
            </button>
          </div>
        );
      })}
    </div>
  </div>
)} */}


            <div>
              <label className="block mb-1 font-medium text-gray-700">Phone No.</label>
              <input
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="Phone Number"
              />
            </div>

            <div>
              <label className="block mb-1 font-medium text-gray-700">Email</label>
              <input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="Email Address"
              />
            </div>

            <div>
              <label className="block mb-1 font-medium text-gray-700">Address</label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="Address"
                rows={3}
              />
            </div>
            <div>
  <label className="block mb-1 font-medium text-gray-700">STATES & UNION TERRITORIES</label>
  <select
    name="state"
    value={formData.state}
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
    value={formData.city}
    onChange={handleChange}
    className="w-full px-4 py-2 border border-gray-300 rounded-md"
  />
</div>

<div>
  <label className="block mb-1 font-medium text-gray-700">PIN CODE</label>
  <input
    name="pincode"
    value={formData.pincode}
    onChange={handleChange}
    maxLength={6}
    className="w-full px-4 py-2 border border-gray-300 rounded-md"
  />
</div>

            <div>
  <label className="block mb-1 font-medium text-gray-700">
   Customer Factory Location Google Maps Link
  </label>
  <input
    name="locationLink"
    value={formData.locationLink}
    onChange={handleChange}
    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
    placeholder="https://maps.google.com/..."
  />
</div>

<div>
  <label className="block mb-1 font-medium text-gray-700">
    Special Instructions regarding Customer
  </label>
  <textarea
    name="instructions"
    value={formData.instructions}
    onChange={handleChange}
    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
    placeholder="Add any special instructions or notes for this customer..."
    rows={3}
  />
</div>

{/* Customer Handled/Managed by Field */}
{!userRoles.includes("sales") &&
<div>
  <label className="block mb-1 font-medium text-gray-700">Customer Handled/Managed by</label>
  <select
    name="createdBy"
    value={formData.createdBy || ""}
    onChange={handleChange}
    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
    required
  >
    <option value="">Select Sales Person</option>
    {allUsers.map((user) => (
      <option key={user._id} value={user._id}>
        {user.name} ({user.email})
      </option>
    ))}
  </select>
</div>
}

{/* ✅ NEW: Sales Category Field */}
<div>
  <label className="block mb-1 font-medium text-gray-700">
    Sales Category
  </label>
  <select
    name="salesCategory"
    value={formData.salesCategory}
    onChange={handleChange}
    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
  >
    <option value="">Select a category (optional)</option>
    {categories.map((category) => (
      <option key={category} value={category}>
        {category}
      </option>
    ))}
  </select>
</div>
           <button
  type="submit"
  disabled={submitting}
  className={`w-full font-semibold py-2 rounded-md shadow-md transition-all duration-200 ${
    submitting ? "bg-green-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700 text-white"
  }`}
>
  {submitting ? "Adding..." : "✅ Add Customer"}
</button>

          </form>
        </div>
      </div>
    </>
  );
}