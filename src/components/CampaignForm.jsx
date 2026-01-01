import React, { useState, useEffect } from 'react';
import axiosInstance from "../axiosInstance";
import { useNavigate, useParams } from "react-router-dom";
import InternalNavbar from "../components/InternalNavbar";
import toast from "react-hot-toast";
import { useUserContext } from "../context/UserContext";
import CharacterCounter from "./CharacterCounter"; // Make sure to create this component

export default function CampaignForm() {
  const { type } = useParams();
  const navigate = useNavigate();
  const { user } = useUserContext();
  
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    mediaFile: null,
    mediaUrl: "",
    mediaType: "none",
    scheduledAt: "",
    timezone: "Asia/Kolkata",
        longMessageWithMedia: false, // ADD THIS LINE
    filters: {
      search: "",
      categories: [],
      createdBy: "",
      giftType: "",
      product: ""
    }
  });
  
  const [categories, setCategories] = useState([]);
  const [salesUsers, setSalesUsers] = useState([]);
  const [giftProducts, setGiftProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [applyingFilters, setApplyingFilters] = useState(false);
  const [templateStatus, setTemplateStatus] = useState({
    created: false,
    status: 'pending',
    sid: null
  });
  const [campaignId, setCampaignId] = useState(null);
  const [mediaFiles, setMediaFiles] = useState([]);
  const [uploadedMedia, setUploadedMedia] = useState([]);
  const [multiMediaEnabled, setMultiMediaEnabled] = useState(false);
  
  // NEW STATES for character counter
  const [averageNameLength, setAverageNameLength] = useState(12); // Default Indian name length
  const [sampleCustomer, setSampleCustomer] = useState(null);
  const [customerNames, setCustomerNames] = useState([]);
  
  // Load data
  useEffect(() => {
    loadCategories();
    loadSalesUsers();
    loadGiftProducts();
  }, []);
  
  const loadCategories = () => {
    const savedCategories = localStorage.getItem('customerCategories');
    if (savedCategories) {
      setCategories(JSON.parse(savedCategories));
    }
  };
  
  const loadSalesUsers = async () => {
    try {
      const res = await axiosInstance.get("/users/sales");
      setSalesUsers(res.data);
    } catch (err) {
      console.error("Failed to load sales users", err);
    }
  };
  
  const loadGiftProducts = async () => {
    try {
      const res = await axiosInstance.get("/purchase-products/purchase-products-all", {
        params: { isGiftItem: true }
      });
      setGiftProducts(res.data || []);
    } catch (err) {
      console.error("Failed to load gift products", err);
    }
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      filters: { ...prev.filters, [name]: value }
    }));
  };
  
  const handleCategoryToggle = (category) => {
    setFormData(prev => {
      const categories = prev.filters.categories || [];
      const newCategories = categories.includes(category)
        ? categories.filter(c => c !== category)
        : [...categories, category];
      
      return {
        ...prev,
        filters: { ...prev.filters, categories: newCategories }
      };
    });
  };
  
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Check file size
    if (file.size > 16 * 1024 * 1024) {
      toast.error("File size must be less than 16MB");
      return;
    }
    
    // Determine media type
    let mediaType = "none";
    if (file.type.startsWith("image/")) mediaType = "image";
    else if (file.type.startsWith("video/")) mediaType = "video";
    else if (file.type === "application/pdf") mediaType = "pdf";
    else mediaType = "document";
    
    // Create preview
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setPreviewUrl("");
    }
    
    // Upload to Cloudinary
    setLoading(true);
    try {
      const cloudinaryUrl = await uploadToCloudinary(file);
      setFormData(prev => ({
        ...prev,
        mediaFile: file,
        mediaUrl: cloudinaryUrl,
        mediaType
      }));
      toast.success("File uploaded successfully!");
    } catch (err) {
      toast.error("Failed to upload file");
      console.error("Upload error:", err);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle multiple file upload
  const handleMultipleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    
    // Limit to 10 files
    if (files.length > 10) {
      toast.error("Maximum 10 files allowed");
      return;
    }
    
    setMediaFiles(files);
    setUploadedMedia([]);
    
    // Upload each file
    const uploadedUrls = [];
    setLoading(true);
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Check file size
      if (file.size > 16 * 1024 * 1024) {
        toast.error(`File ${i + 1} exceeds 16MB limit`);
        continue;
      }
      
      // Determine media type
      let mediaType = "image";
      if (file.type.startsWith("image/")) mediaType = "image";
      else if (file.type.startsWith("video/")) mediaType = "video";
      else if (file.type === "application/pdf") mediaType = "pdf";
      else mediaType = "document";
      
      try {
        const cloudinaryUrl = await uploadToCloudinary(file);
        
        uploadedUrls.push({
          url: cloudinaryUrl,
          type: mediaType,
          caption: "",
          file: file
        });
        
        toast.success(`Uploaded ${i + 1}/${files.length}`);
        
      } catch (err) {
        toast.error(`Failed to upload file ${i + 1}`);
        console.error("Upload error:", err);
      }
    }
    
    setUploadedMedia(uploadedUrls);
    setLoading(false);
    
    // Update form data
    setFormData(prev => ({
      ...prev,
      mediaUrls: uploadedUrls.map(m => m.url),
      mediaTypes: uploadedUrls.map(m => m.type),
      mediaCaptions: uploadedUrls.map(m => m.caption),
      mediaUrl: uploadedUrls.length > 0 ? uploadedUrls[0].url : '',
      mediaType: uploadedUrls.length > 0 ? uploadedUrls[0].type : 'none'
    }));
  };
  
  const uploadToCloudinary = async (file) => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "todo_uploads");
      formData.append("cloud_name", "dcr8k5amk");
      
      // Upload to Cloudinary
      const response = await fetch(
        "https://api.cloudinary.com/v1_1/dcr8k5amk/upload",
        { method: "POST", body: formData }
      );
      
      const data = await response.json();
      
      // Create WhatsApp-optimized URL
      const publicId = data.public_id;
      const optimizedUrl = `https://res.cloudinary.com/dcr8k5amk/image/upload/f_jpg,q_auto,w_1000/${publicId}.jpg`;
      
      console.log(`✅ WhatsApp-optimized URL: ${optimizedUrl}`);
      return optimizedUrl;
      
    } catch (err) {
      console.error("Upload error:", err);
      throw err;
    }
  };
  
  const applyFilters = async () => {
    setApplyingFilters(true);
    try {
      const res = await axiosInstance.post("/campaigns/get-filtered-customers", {
        filters: formData.filters
      });
      
      setFilteredCustomers(res.data.customers);
      setTotalCustomers(res.data.total);
      
      // NEW: Calculate name statistics for character counter
      if (res.data.customers && res.data.customers.length > 0) {
        // Calculate average name length
        const totalLength = res.data.customers.reduce((sum, customer) => {
          return sum + (customer.name ? customer.name.trim().length : 0);
        }, 0);
        
        const avgLength = Math.round(totalLength / res.data.customers.length);
        setAverageNameLength(avgLength);
        
        // Get a sample customer for display
        const firstCustomerWithName = res.data.customers.find(c => c.name && c.name.trim());
        if (firstCustomerWithName) {
          setSampleCustomer(firstCustomerWithName);
        }
        
        // Collect all customer names for CharacterCounter
        const names = res.data.customers
          .filter(c => c.name && c.name.trim())
          .map(c => c.name.trim())
          .slice(0, 5); // Take first 5 names
        
        setCustomerNames(names);
        
        console.log(`📊 Character counter stats: Avg length = ${avgLength}, Sample names = ${names.length}`);
      }
      
      toast.success(`Found ${res.data.total} customers`);
    } catch (err) {
      toast.error("Failed to apply filters");
      console.error("Filter error:", err);
    } finally {
      setApplyingFilters(false);
    }
  };
  
const handleSubmit = async (e) => {
  e.preventDefault();
  
  if (!formData.title.trim()) {
    toast.error("Please enter a campaign title");
    return;
  }
  
  if (!formData.scheduledAt) {
    toast.error("Please select a date and time");
    return;
  }

  const hasMedia = formData.mediaUrl || (uploadedMedia && uploadedMedia.length > 0);
  
  // UPDATED VALIDATION: Only check 75-char limit when NOT in long message mode
  if (hasMedia && type === 'whatsapp' && !formData.longMessageWithMedia) {
    const messageLength = formData.message ? formData.message.trim().length : 0;
    
    if (messageLength > 75) {
      toast.error(`Message too long! For media campaigns, limit message to 75 characters (currently ${messageLength})`);
      return;
    }
  }
  
  if (filteredCustomers.length === 0) {
    toast.error("No customers selected. Please apply filters first.");
    return;
  }
  
  setLoading(true);
  try {
    const campaignData = {
      title: formData.title,
      type: type,
      message: formData.message,
      mediaUrl: formData.mediaUrl || "",
      mediaType: formData.mediaType,
      filters: formData.filters,
      scheduledAt: formData.scheduledAt,
      timezone: formData.timezone,
      longMessageWithMedia: formData.longMessageWithMedia || false // ADD THIS
    };
    
    // Add multiple media fields
    if (uploadedMedia.length > 0) {
      campaignData.multiMediaEnabled = true;
      campaignData.mediaUrls = uploadedMedia.map(m => m.url);
      campaignData.mediaTypes = uploadedMedia.map(m => m.type);
      campaignData.mediaCaptions = uploadedMedia.map(m => m.caption);
      campaignData.mediaDelaySeconds = 3;
    }

    // If multiple media enabled, include those fields
    if (multiMediaEnabled && uploadedMedia.length > 0) {
      campaignData.mediaUrls = uploadedMedia.map(m => m.url);
      campaignData.mediaTypes = uploadedMedia.map(m => m.type);
      campaignData.mediaCaptions = uploadedMedia.map(m => m.caption);
      campaignData.multiMediaEnabled = true;
      campaignData.mediaDelaySeconds = 3;
    }
    
    const res = await axiosInstance.post("/campaigns", campaignData);
    
    if (res.data.success) {
      setCampaignId(res.data.campaign._id);
      
      if (res.data.templateCreated) {
        setTemplateStatus({
          created: true,
          status: 'submitted',
          sid: res.data.campaign.templateSid
        });
        toast.success("Campaign scheduled! WhatsApp template created and submitted for approval.");
      } else {
        toast.success("Campaign scheduled successfully!");
      }
      
      navigate("/campaigns");
    }
  } catch (err) {
    toast.error(err.response?.data?.error || "Failed to create campaign");
    console.error("Campaign creation error:", err);
  } finally {
    setLoading(false);
  }
};
  
  const getTypeIcon = () => {
    switch(type) {
      case 'whatsapp': return '💬';
      case 'email': return '✉️';
      default: return '📢';
    }
  };
  
  const getTypeTitle = () => {
    switch(type) {
      case 'whatsapp': return 'WhatsApp Campaign';
      case 'email': return 'Email Campaign';
      default: return 'Campaign';
    }
  };
  
  const clearAllFilters = () => {
    setFormData(prev => ({
      ...prev,
      filters: {
        search: "",
        categories: [],
        createdBy: "",
        giftType: "",
        product: ""
      }
    }));
    setFilteredCustomers([]);
    setTotalCustomers(0);
    setAverageNameLength(12);
    setSampleCustomer(null);
    setCustomerNames([]);
  };
  
  // Get a sample customer name for display
  const getDisplayCustomerName = () => {
    if (sampleCustomer && sampleCustomer.name) {
      return sampleCustomer.name;
    }
    if (customerNames.length > 0) {
      return customerNames[0];
    }
    return "Customer";
  };
  
  return (
    <>
      <InternalNavbar />
      
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => navigate(-1)}
              className="text-gray-600 hover:text-gray-800 flex items-center gap-2"
            >
              ↩️ Back
            </button>
            <h1 className="text-2xl font-bold text-gray-800">
              {getTypeIcon()} {getTypeTitle()}
            </h1>
          </div>
          
          {/* Configuration Status */}
          {type === 'whatsapp' && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  ℹ️
                </div>
                <div>
                  <p className="font-medium text-blue-800">WhatsApp Business Campaign</p>
                  <p className="text-sm text-blue-600">
                    Messages will be sent via WhatsApp Business API.
                    {formData.mediaUrl && " Media campaigns have 75 character limit."}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Campaign Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block mb-2 font-medium text-gray-700">
                  Campaign Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                  placeholder="e.g., Diwali Offer 2024"
                  required
                />
              </div>
              
              <div>
                <label className="block mb-2 font-medium text-gray-700">
                  Schedule Date & Time *
                </label>
                <input
                  type="datetime-local"
                  name="scheduledAt"
                  value={formData.scheduledAt}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                  required
                />
                <p className="text-sm text-gray-500 mt-1">
                  Campaign will run automatically at this time
                </p>
              </div>
              
          {/* Message Section - UPDATED with CharacterCounter */}
<div className="md:col-span-2">
  <label className="block mb-2 font-medium text-gray-700">
    Message {type === 'whatsapp' && '(Will be used in WhatsApp template)'}
  </label>
  <textarea
    name="message"
    value={formData.message}
    onChange={handleChange}
    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-400 focus:border-transparent"
    placeholder={
      type === 'whatsapp' && (formData.mediaUrl || uploadedMedia.length > 0) && !formData.longMessageWithMedia
        ? "Enter short message (max 75 chars) for media campaign..."
        : "Enter your message here..."
    }
    rows="4"
    // FIX THIS LINE: Make maxLength dynamic
    maxLength={formData.longMessageWithMedia ? 1000 : (formData.mediaUrl || uploadedMedia.length > 0 ? 75 : 1000)}
  />
  
  {/* Character Counter */}
  <div className="mt-2">
    <CharacterCounter 
      text={formData.message}
      maxLength={formData.longMessageWithMedia ? 1000 : (formData.mediaUrl || uploadedMedia.length > 0 ? 75 : 1000)} // FIX THIS TOO
      isMediaCampaign={!!(formData.mediaUrl || uploadedMedia.length > 0) && type === 'whatsapp'}
      customerName={getDisplayCustomerName()}
      longMessageWithMedia={formData.longMessageWithMedia || false}
    />
  </div>
                
             {/* Media campaign warning - ONLY show when NOT in long message mode */}
{(formData.mediaUrl || uploadedMedia.length > 0) && type === 'whatsapp' && !formData.longMessageWithMedia && (
  <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
    <div className="flex items-start gap-2">
      <span className="text-yellow-600 mt-0.5">📝</span>
      <div>
        <p className="text-sm font-medium text-yellow-800">WhatsApp Media Campaign Rules</p>
        <p className="text-sm text-yellow-700 mt-1">
          • Maximum <strong>75 characters</strong> for message<br/>
          • Combined with customer name like: "<span className="font-medium">{getDisplayCustomerName()}: [Your Message]</span>"<br/>
          • Total should stay under 100 characters
        </p>
      </div>
    </div>
  </div>
)}

{/* NEW: Show different info when long message mode is enabled */}
{(formData.mediaUrl || uploadedMedia.length > 0) && type === 'whatsapp' && formData.longMessageWithMedia && (
  <div className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded">
    <div className="flex items-start gap-2">
      <span className="text-purple-600 mt-0.5">💡</span>
      <div>
        <p className="text-sm font-medium text-purple-800">Long Message with Media Mode</p>
        <p className="text-sm text-purple-700 mt-1">
          • <strong>Step 1:</strong> Media files will be sent first with short captions<br/>
          • <strong>Step 2:</strong> Your full message ({formData.message?.length || 0} chars) will be sent as separate text<br/>
          • <strong>Benefit:</strong> No 75-character limit! Send detailed messages with media
        </p>
      </div>
    </div>
  </div>
)}
              </div>
              
              {/* Media Upload Section - UPDATED with multiple files */}
              <div className="md:col-span-2">
                <label className="block mb-2 font-medium text-gray-700">
                  {type === 'whatsapp' ? 'Media (Image/Video/PDF - Will be included in template)' : 'Attachment'}
                </label>
                
                <div className="flex items-center gap-4 mb-3">
                  <input
                    type="file"
                    onChange={handleMultipleFileChange}
                    accept="image/*,video/*,.pdf"
                    multiple
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                    disabled={loading}
                  />
                  
                  {/* <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="multiMediaEnabled"
                      checked={multiMediaEnabled}
                      onChange={(e) => setMultiMediaEnabled(e.target.checked)}
                      className="mr-2"
                    />
                    <label htmlFor="multiMediaEnabled" className="text-sm text-gray-700">
                      Send as separate messages
                    </label>
                  </div> */}
                </div>
                
                {multiMediaEnabled && (
                  <p className="text-sm text-blue-600 mb-3">
                    ✓ Each file will be sent as a separate WhatsApp message with 3-second delay
                  </p>
                )}
                
                {/* Preview uploaded files */}
                {uploadedMedia.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-600 mb-2">
                      Uploaded Files ({uploadedMedia.length})
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {uploadedMedia.map((media, index) => (
                        <div key={index} className="relative border rounded-lg p-2">
                          {media.type === 'image' ? (
                            <img 
                              src={URL.createObjectURL(media.file)} 
                              alt={`Media ${index + 1}`}
                              className="w-full h-24 object-cover rounded"
                            />
                          ) : (
                            <div className="w-full h-24 bg-gray-100 flex items-center justify-center rounded">
                              <span className="text-gray-500">
                                {media.type === 'video' ? '🎬' : '📄'} File {index + 1}
                              </span>
                            </div>
                          )}
                          <div className="text-xs mt-1 truncate">
                            {media.file.name}
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const newMedia = uploadedMedia.filter((_, i) => i !== index);
                              setUploadedMedia(newMedia);
                            }}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Single file preview */}
                {previewUrl && (
                  <div className="mt-3">
                    <p className="text-sm font-medium text-gray-600 mb-2">Preview:</p>
                    <img 
                      src={previewUrl} 
                      alt="Preview" 
                      className="max-w-xs max-h-48 rounded-lg border"
                    />
                  </div>
                )}
                
                {formData.mediaUrl && !previewUrl && !uploadedMedia.length && (
                  <div className="mt-3">
                    <p className="text-sm font-medium text-gray-600">
                      ✅ File uploaded: {formData.mediaType}
                    </p>
                  </div>
                )}
              </div>

              {/* Long Message with Media Option */}
{(formData.mediaUrl || uploadedMedia.length > 0) && type === 'whatsapp' && (
  <div className="flex items-center mt-3">
    <input
      type="checkbox"
      id="longMessageWithMedia"
      checked={formData.longMessageWithMedia || false}
      onChange={(e) => setFormData(prev => ({
        ...prev,
        longMessageWithMedia: e.target.checked
      }))}
      className="mr-2"
    />
    <label htmlFor="longMessageWithMedia" className="text-sm text-gray-700">
      <span className="font-medium">Send long message with media files</span>
      <span className="text-gray-600 ml-1">
        (Media sent first, then full message as separate text)
      </span>
    </label>
  </div>
)}
              
              {/* Timezone */}
              <div>
                <label className="block mb-2 font-medium text-gray-700">
                  Timezone
                </label>
                <select
                  name="timezone"
                  value={formData.timezone}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                >
                  <option value="Asia/Kolkata">India (IST)</option>
                </select>
              </div>
            </div>
            
            {/* Customer Filters */}
            <div className="border-t pt-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-800">🎯 Target Customers</h3>
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="text-sm text-red-600 hover:text-red-800"
                >
                  Clear All Filters
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                {/* Search */}
                {/* <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">
                    Search
                  </label>
                  <input
                    type="text"
                    name="search"
                    value={formData.filters.search}
                    onChange={handleFilterChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-blue-400"
                    placeholder="Name, phone, email, category"
                  />
                </div> */}
                
                {/* Sales Person */}
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">
                    Sales Person
                  </label>
                  <select
                    name="createdBy"
                    value={formData.filters.createdBy}
                    onChange={handleFilterChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-blue-400"
                  >
                    <option value="">All Sales</option>
                    {salesUsers.map(user => (
                      <option key={user._id} value={user._id}>
                        {user.name} ({user.email})
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Gift Type */}
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">
                    Gift Type
                  </label>
                  <select
                    name="giftType"
                    value={formData.filters.giftType}
                    onChange={handleFilterChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-blue-400"
                  >
                    <option value="">All Customers</option>
                    <option value="all_gifts">Has Any Diwali Gift</option>
                    <option value="no_gifts">No Diwali Gifts</option>
                    <optgroup label="Specific Gifts">
                      {giftProducts.map(gift => (
                        <option key={gift._id} value={gift._id}>
                          {gift.name}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>
                
                {/* Product Filter */}
                {/* <div className="lg:col-span-3">
                  <label className="block mb-1 text-sm font-medium text-gray-700">
                    Purchased Product
                  </label>
                  <input
                    type="text"
                    name="product"
                    value={formData.filters.product}
                    onChange={handleFilterChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-blue-400"
                    placeholder="Filter customers who purchased specific product"
                  />
                </div> */}
              </div>
              
              {/* Categories */}
              <div className="mb-4">
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Sales Categories
                </label>
                <div className="flex flex-wrap gap-2">
                  {categories.map(category => (
                    <button
                      type="button"
                      key={category}
                      onClick={() => handleCategoryToggle(category)}
                      className={`px-3 py-1 text-sm rounded-full transition-colors ${
                        formData.filters.categories?.includes(category)
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {category}
                      {formData.filters.categories?.includes(category) && ' ✓'}
                    </button>
                  ))}
                  {categories.length === 0 && (
                    <p className="text-sm text-gray-500">
                      No categories defined yet. Add categories in Customer List page.
                    </p>
                  )}
                </div>
              </div>
              
              {/* Apply Filters Button */}
              <div className="mb-6">
                <button
                  type="button"
                  onClick={applyFilters}
                  disabled={applyingFilters}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {applyingFilters ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Applying Filters...
                    </span>
                  ) : (
                    'Apply Filters & Preview Customers'
                  )}
                </button>
              </div>
              
              {/* Results Preview */}
              {filteredCustomers.length > 0 && (
                <div className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <h4 className="font-medium text-gray-800">
                        📊 Matching Customers: {totalCustomers}
                      </h4>
                      <p className="text-sm text-gray-600">
                        Campaign will be sent to these customers
                      </p>
                      {type === 'whatsapp' && customerNames.length > 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                          Sample names: {customerNames.slice(0, 3).join(', ')}
                          {customerNames.length > 3 && '...'}
                        </p>
                      )}
                    </div>
                    <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                      {type === 'whatsapp' ? 'WhatsApp' : 'Email'}
                    </span>
                  </div>
                  
                  <div className="max-h-60 overflow-y-auto mb-3">
                    <table className="min-w-full text-sm">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="p-2 text-left">Name</th>
                          <th className="p-2 text-left">Phone</th>
                          <th className="p-2 text-left">Email</th>
                          <th className="p-2 text-left">Category</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredCustomers.slice(0, 10).map(customer => (
                          <tr key={customer._id} className="border-t hover:bg-gray-100">
                            <td className="p-2">{customer.name}</td>
                            <td className="p-2">{customer.phone || '-'}</td>
                            <td className="p-2">{customer.email || '-'}</td>
                            <td className="p-2">
                              {customer.salesCategory ? (
                                <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                                  {customer.salesCategory}
                                </span>
                              ) : (
                                '-'
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {filteredCustomers.length > 10 && (
                      <p className="text-sm text-gray-500 mt-2 text-center">
                        Showing 10 of {filteredCustomers.length} customers
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {/* Template Status Display (for WhatsApp campaigns) */}
            {type === 'whatsapp' && campaignId && (
              <div className="border-t pt-6">
                <h4 className="font-medium text-gray-800 mb-3">📝 WhatsApp Template Status</h4>
                <div className={`p-4 rounded-lg ${
                  templateStatus.status === 'approved' ? 'bg-green-50 border border-green-200' :
                  templateStatus.status === 'rejected' ? 'bg-red-50 border border-red-200' :
                  'bg-yellow-50 border border-yellow-200'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      templateStatus.status === 'approved' ? 'bg-green-100 text-green-600' :
                      templateStatus.status === 'rejected' ? 'bg-red-100 text-red-600' :
                      'bg-yellow-100 text-yellow-600'
                    }`}>
                      {templateStatus.status === 'approved' ? '✓' :
                       templateStatus.status === 'rejected' ? '✗' : '⏳'}
                    </div>
                    <div>
                      <p className="font-medium">
                        {templateStatus.status === 'approved' ? 'Template Approved' :
                         templateStatus.status === 'rejected' ? 'Template Rejected' :
                         'Template Submitted for Approval'}
                      </p>
                      <p className="text-sm text-gray-600">
                        {templateStatus.status === 'approved' ? 'Ready for sending messages' :
                         templateStatus.status === 'rejected' ? 'Check Twilio console for rejection reason' :
                         'Approval typically takes 24-48 hours'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Submit Button */}
            <div className="flex justify-end gap-4 pt-6 border-t">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || filteredCustomers.length === 0}
                className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Scheduling...
                  </>
                ) : (
                  `Schedule ${getTypeTitle()}`
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}