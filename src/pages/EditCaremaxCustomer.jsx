import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../axiosInstance";
import InternalNavbar from "../components/InternalNavbar";
import toast from "react-hot-toast";
import imageCompression from "browser-image-compression";
const INDIAN_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh",
  "Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka",
  "Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram",
  "Nagaland","Odisha","Rajasthan","Sikkim","Tamil Nadu","Telangana",
  "Tripura","Uttar Pradesh","Uttarakhand","West Bengal",
  "Andaman and Nicobar Islands","Chandigarh","Dadra and Nagar Haveli and Daman and Diu",
  "Delhi","Jammu and Kashmir","Ladakh","Lakshadweep","Puducherry","Punjab"
];
export default function EditCaremaxCustomer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [employees, setEmployees] = useState([]);
  
  const [formData, setFormData] = useState({
    name: "",
    gstNo: "",
    phoneNo: "",
    email: "",
    address: "",
    state: "",
    city: "",
    pinCode: "",
    googleMapsLink: "",
    specialInstructions: "",
    handledBy: "",
    handledByName: "",
    handledByEmail: "",
    isActive: true,
  });

  const [existingDocuments, setExistingDocuments] = useState([]);
  const [newDocuments, setNewDocuments] = useState([]);
  const [removedDocuments, setRemovedDocuments] = useState([]);

  // Fetch employees
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await axiosInstance.get("/caremax-customers/employees/all");
        if (res.data.success && res.data.employees) {
          setEmployees(res.data.employees);
        }
      } catch (error) {
        console.error("Error fetching employees:", error);
      }
    };
    fetchEmployees();
  }, []);

  // Fetch customer data
  useEffect(() => {
    async function fetchCustomer() {
      try {
        const res = await axiosInstance.get(`/caremax-customers/${id}`);
        if (res.data && res.data.success && res.data.customer) {
          const customerData = res.data.customer;
          setFormData({
            name: customerData.name || "",
            gstNo: customerData.gstNo || "",
            phoneNo: customerData.phoneNo || "",
            email: customerData.email || "",
            address: customerData.address || "",
            state: customerData.state || "",
            city: customerData.city || "",
            pinCode: customerData.pinCode || "",
            googleMapsLink: customerData.googleMapsLink || "",
            specialInstructions: customerData.specialInstructions || "",
            handledBy: customerData.handledBy || "",
            handledByName: customerData.handledByName || "",
            handledByEmail: customerData.handledByEmail || "",
            isActive: customerData.isActive !== false,
          });
          setExistingDocuments(customerData.gstDocuments || []);
        }
      } catch (error) {
        console.error("Error fetching customer:", error);
        toast.error("Failed to load customer data");
        navigate("/caremax-impex/all-customers");
      } finally {
        setIsLoading(false);
      }
    }
    fetchCustomer();
  }, [id, navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleEmployeeChange = (e) => {
    const employeeId = e.target.value;
    const selectedEmployee = employees.find(emp => emp._id === employeeId);
    
    setFormData(prev => ({
      ...prev,
      handledBy: employeeId,
      handledByName: selectedEmployee?.name || "",
      handledByEmail: selectedEmployee?.email || "",
    }));
  };

  const handleDocumentChange = async (e) => {
    const files = Array.from(e.target.files);
    const compressed = [];
    
    for (const file of files) {
      if (file.type.startsWith("image/")) {
        const options = { maxSizeMB: 0.5, maxWidthOrHeight: 1024, useWebWorker: true };
        const compressedFile = await imageCompression(file, options);
        compressed.push(compressedFile);
      } else {
        compressed.push(file);
      }
    }
    
    setNewDocuments(prev => [...prev, ...compressed]);
  };

  const removeExistingDocument = (index) => {
    const docToRemove = existingDocuments[index];
    setRemovedDocuments(prev => [...prev, docToRemove]);
    setExistingDocuments(prev => prev.filter((_, i) => i !== index));
  };

  const removeNewDocument = (index) => {
    setNewDocuments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const data = new FormData();
    
    Object.entries(formData).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== "") {
        data.append(key, val);
      }
    });

    // Append removed documents
    removedDocuments.forEach(doc => data.append("removedDocuments", doc));
    
    // Append new documents
    newDocuments.forEach(file => data.append("gstDocuments", file));

    try {
      await axiosInstance.put(`/caremax-customers/${id}`, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Customer updated successfully!");
      navigate("/caremax-impex/all-customers");
    } catch (err) {
      console.error("Failed to update customer", err);
      toast.error(err.response?.data?.error || "Failed to update customer");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <>
        <InternalNavbar />
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading customer data...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <InternalNavbar />
      <div className="max-w-4xl mx-auto mt-8 p-6 bg-white rounded-lg shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-blue-700">Edit Caremax Customer</h2>
          <button
            onClick={() => navigate("/caremax-impex/all-customers")}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
          >
            ← Back
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Same form fields as AddCaremaxCustomer, but with existing values */}
          {/* Basic Information */}
          <div className="border rounded-lg p-4">
            <h3 className="text-xl font-bold mb-4 text-gray-700">Basic Information</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Customer Name *</label>
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full p-2 border rounded"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">GST Number</label>
                <input
                  name="gstNo"
                  value={formData.gstNo}
                  onChange={handleChange}
                  placeholder="Enter GST number or leave blank for URP"
                  className="w-full p-2 border rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Phone Number *</label>
                <input
                  name="phoneNo"
                  type="tel"
                  value={formData.phoneNo}
                  onChange={handleChange}
                  required
                  className="w-full p-2 border rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                />
              </div>
            </div>
          </div>

          {/* Address Information - same as Add */}
          <div className="border rounded-lg p-4">
            <h3 className="text-xl font-bold mb-4 text-gray-700">Address Information</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Address</label>
                <textarea
                  name="address"
                  rows="2"
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">STATES & UNION TERRITORIES</label>
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
                <label className="block text-sm font-medium mb-1">NAME OF CITY/VILLAGE/TOWN</label>
                <input
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">PIN CODE</label>
                <input
                  name="pinCode"
                  value={formData.pinCode}
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Customer Factory Location Google Maps Link</label>
                <input
                  name="googleMapsLink"
                  value={formData.googleMapsLink}
                  onChange={handleChange}
                  placeholder="https://maps.google.com/..."
                  className="w-full p-2 border rounded"
                />
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="border rounded-lg p-4">
            <h3 className="text-xl font-bold mb-4 text-gray-700">Additional Information</h3>
            <div className="grid md:grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Special Instructions regarding Customer</label>
                <textarea
                  name="specialInstructions"
                  rows="3"
                  value={formData.specialInstructions}
                  onChange={handleChange}
                  placeholder="Any special notes or instructions about this customer..."
                  className="w-full p-2 border rounded"
                />
              </div>
            </div>
          </div>

          {/* Handled By */}
          <div className="border rounded-lg p-4">
            <h3 className="text-xl font-bold mb-4 text-gray-700">Assigned To</h3>
            <div>
              <label className="block text-sm font-medium mb-1">Customer Handled/Managed By</label>
              <select
                value={formData.handledBy}
                onChange={handleEmployeeChange}
                className="w-full p-2 border rounded"
              >
                <option value="">Select Employee</option>
                {employees.map(emp => (
                  <option key={emp._id} value={emp._id}>
                    {emp.name} - {emp.email}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Existing Documents */}
          {existingDocuments.length > 0 && (
            <div className="border rounded-lg p-4">
              <h3 className="text-xl font-bold mb-4 text-gray-700">Existing Documents</h3>
              <div className="flex flex-wrap gap-2">
                {existingDocuments.map((doc, idx) => (
                  <div key={idx} className="relative w-20 h-20 border rounded flex items-center justify-center bg-gray-50">
                    {doc.endsWith(".pdf") ? (
                      <span className="text-red-600 text-xs">📄 PDF</span>
                    ) : (
                      <img src={doc} alt="Document" className="w-full h-full object-cover" />
                    )}
                    <button
                      type="button"
                      onClick={() => removeExistingDocument(idx)}
                      className="absolute top-0 right-0 bg-red-600 text-white rounded-full w-5 h-5 text-xs"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add New Documents */}
          <div className="border rounded-lg p-4">
            <h3 className="text-xl font-bold mb-4 text-gray-700">Add New Documents</h3>
            <input
              type="file"
              accept="image/*,application/pdf"
              multiple
              onChange={handleDocumentChange}
              className="w-full border rounded p-2"
            />
            <div className="flex flex-wrap gap-2 mt-2">
              {newDocuments.map((file, idx) => (
                <div key={idx} className="relative w-20 h-20 border rounded flex items-center justify-center">
                  {file.type === "application/pdf" ? (
                    <span className="text-red-600">📄 PDF</span>
                  ) : (
                    <img src={URL.createObjectURL(file)} alt="Doc" className="w-full h-full object-cover" />
                  )}
                  <button
                    type="button"
                    onClick={() => removeNewDocument(idx)}
                    className="absolute top-0 right-0 bg-red-600 text-white rounded-full w-5 h-5 text-xs"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Status */}
          <div className="border rounded-lg p-4">
            <h3 className="text-xl font-bold mb-4 text-gray-700">Status</h3>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
              />
              Active Customer
            </label>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold ${isSubmitting ? 'opacity-50' : 'hover:bg-blue-700'}`}
            >
              {isSubmitting ? "Updating..." : "Update Customer"}
            </button>
            <button
              type="button"
              onClick={() => navigate("/caremax-impex/all-customers")}
              className="px-6 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </>
  );
}