import React, { useState, useEffect } from 'react';
import axiosInstance from "../axiosInstance";
import { useNavigate, useParams } from "react-router-dom";
import InternalNavbar from "../components/InternalNavbar";
import toast from "react-hot-toast";
import { useUserContext } from "../context/UserContext";
import CharacterCounter from "./CharacterCounter";
import { Search } from 'lucide-react';

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
    longMessageWithMedia: false,
    filters: {
      search: "",
      categories: [],
      createdBy: "",
      giftType: "",
      product: ""
    }
  });
  
  // Customer states
  const [selectedCustomers, setSelectedCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  
  // Supplier states
  const [selectedSuppliers, setSelectedSuppliers] = useState([]);
  const [supplierSearchQuery, setSupplierSearchQuery] = useState("");
  const [supplierSearchResults, setSupplierSearchResults] = useState([]);
  const [isSearchingSuppliers, setIsSearchingSuppliers] = useState(false);
  const [showSupplierResults, setShowSupplierResults] = useState(false);
  
  // Target type state
  const [targetType, setTargetType] = useState('customers'); // 'customers', 'suppliers', or 'both'
  
  // Other states
  const [categories, setCategories] = useState([]);
  const [salesUsers, setSalesUsers] = useState([]);
  const [giftProducts, setGiftProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
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
  const [averageNameLength, setAverageNameLength] = useState(12);
  const [sampleCustomer, setSampleCustomer] = useState(null);
  const [customerNames, setCustomerNames] = useState([]);

  // Load data
  useEffect(() => {
    const loadAllData = async () => {
      await loadCategories();
      loadSalesUsers();
      loadGiftProducts();
    };
    
    loadAllData();
  }, []);
  
  const loadCategories = async () => {
    try {
      const res = await axiosInstance.get("/customers/settings/categories");
      setCategories(res.data.categories || []);
    } catch (err) {
      console.error("Failed to load categories", err);
      const defaultCategories = ['VIP', 'Regular', 'New', 'Corporate', 'Retail'];
      setCategories(defaultCategories);
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
  
  // Customer search
  const handleSearchChange = async (value) => {
    setSearchQuery(value);
    
    if (value.trim().length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }
    
    setIsSearching(true);
    try {
      const res = await axiosInstance.get(`/customers/search/autocomplete?q=${encodeURIComponent(value)}`);
      setSearchResults(res.data.customers || []);
      setShowSearchResults(true);
    } catch (err) {
      console.error("Search error:", err);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Supplier search
  const handleSupplierSearchChange = async (value) => {
    setSupplierSearchQuery(value);
    
    if (value.trim().length < 2) {
      setSupplierSearchResults([]);
      setShowSupplierResults(false);
      return;
    }
    
    setIsSearchingSuppliers(true);
    try {
      const res = await axiosInstance.get(`/campaigns/suppliers/search?q=${encodeURIComponent(value)}`);
      setSupplierSearchResults(res.data.suppliers || []);
      setShowSupplierResults(true);
    } catch (err) {
      console.error("Supplier search error:", err);
      setSupplierSearchResults([]);
    } finally {
      setIsSearchingSuppliers(false);
    }
  };

  // Add customer
  const addCustomerManually = async (customer) => {
    if (customer && customer._id) {
      const exists = selectedCustomers.some(
        selected => selected._id === customer._id
      );
      
      if (exists) {
        toast.error("Customer already selected");
      } else {
        const updatedCustomers = [...selectedCustomers, customer];
        setSelectedCustomers(updatedCustomers);
        setFilteredCustomers(updatedCustomers);
        setTotalCustomers(updatedCustomers.length);
        
        // Clear search
        setSearchQuery("");
        setSearchResults([]);
        setShowSearchResults(false);
        
        toast.success(`${customer.name} added successfully`);
      }
    }
  };

  // Add supplier
  const addSupplierManually = async (supplier) => {
    if (supplier && supplier._id) {
      const exists = selectedSuppliers.some(
        selected => selected._id === supplier._id
      );
      
      if (exists) {
        toast.error("Supplier already selected");
      } else {
        const updatedSuppliers = [...selectedSuppliers, supplier];
        setSelectedSuppliers(updatedSuppliers);
        
        // Clear search
        setSupplierSearchQuery("");
        setSupplierSearchResults([]);
        setShowSupplierResults(false);
        
        toast.success(`${supplier.company || supplier.name} added successfully`);
      }
    }
  };

  // Remove customer
  const removeCustomer = (customerId) => {
    const updatedCustomers = selectedCustomers.filter(
      customer => customer._id !== customerId
    );
    setSelectedCustomers(updatedCustomers);
    setFilteredCustomers(updatedCustomers);
    setTotalCustomers(updatedCustomers.length);
    toast.success("Customer removed from selection");
  };

  // Remove supplier
  const removeSupplier = (supplierId) => {
    const updatedSuppliers = selectedSuppliers.filter(
      supplier => supplier._id !== supplierId
    );
    setSelectedSuppliers(updatedSuppliers);
    toast.success("Supplier removed from selection");
  };

  // Form handlers
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
    
    if (file.size > 16 * 1024 * 1024) {
      toast.error("File size must be less than 16MB");
      return;
    }
    
    let mediaType = "none";
    if (file.type.startsWith("image/")) mediaType = "image";
    else if (file.type.startsWith("video/")) mediaType = "video";
    else if (file.type === "application/pdf") mediaType = "pdf";
    else mediaType = "document";
    
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setPreviewUrl("");
    }
    
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

  const handleMultipleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length > 10) {
      toast.error("Maximum 10 files allowed");
      return;
    }
    
    setMediaFiles(files);
    setUploadedMedia([]);
    
    const uploadedUrls = [];
    setLoading(true);
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      if (file.size > 16 * 1024 * 1024) {
        toast.error(`File ${i + 1} exceeds 16MB limit`);
        continue;
      }
      
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
      
      const response = await fetch(
        "https://api.cloudinary.com/v1_1/dcr8k5amk/upload",
        { method: "POST", body: formData }
      );
      
      const data = await response.json();
      const publicId = data.public_id;
      const optimizedUrl = `https://res.cloudinary.com/dcr8k5amk/image/upload/f_jpg,q_auto,w_1000/${publicId}.jpg`;
      
      console.log(`✅ WhatsApp-optimized URL: ${optimizedUrl}`);
      return optimizedUrl;
      
    } catch (err) {
      console.error("Upload error:", err);
      throw err;
    }
  };

  const convertToTimezone = (localDateTime, timezone) => {
    if (!localDateTime) return '';
    
    const localDate = new Date(localDateTime);
    const options = {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    };
    
    return localDate.toLocaleString('en-US', options);
  };

  const applyFilters = async () => {
    setApplyingFilters(true);
    try {
      const res = await axiosInstance.post("/campaigns/get-filtered-customers", {
        filters: {
          search: formData.filters.search,
          categories: formData.filters.categories,
          createdBy: formData.filters.createdBy,
          giftType: formData.filters.giftType,
          product: formData.filters.product
        }
      });
      
      const newCustomers = res.data.customers || [];
      const combinedCustomers = [...selectedCustomers];
      
      newCustomers.forEach(newCustomer => {
        const exists = combinedCustomers.some(
          existing => existing._id === newCustomer._id
        );
        
        if (!exists) {
          combinedCustomers.push(newCustomer);
        }
      });
      
      setSelectedCustomers(combinedCustomers);
      setFilteredCustomers(combinedCustomers);
      setTotalCustomers(combinedCustomers.length);
      
      if (combinedCustomers.length > 0) {
        const totalLength = combinedCustomers.reduce((sum, customer) => {
          return sum + (customer.name ? customer.name.trim().length : 0);
        }, 0);
        
        const avgLength = Math.round(totalLength / combinedCustomers.length);
        setAverageNameLength(avgLength);
        
        const firstCustomerWithName = combinedCustomers.find(c => c.name && c.name.trim());
        if (firstCustomerWithName) {
          setSampleCustomer(firstCustomerWithName);
        }
        
        const names = combinedCustomers
          .filter(c => c.name && c.name.trim())
          .map(c => c.name.trim())
          .slice(0, 5);
        
        setCustomerNames(names);
      }
      
      toast.success(`Found ${res.data.total} customers. Added ${newCustomers.length} new unique customers to selection. Total selected: ${combinedCustomers.length}`);
      
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
    
    if (hasMedia && type === 'whatsapp' && !formData.longMessageWithMedia) {
      const messageLength = formData.message ? formData.message.trim().length : 0;
      
      if (messageLength > 75) {
        toast.error(`Message too long! For media campaigns, limit message to 75 characters (currently ${messageLength})`);
        return;
      }
    }
    
    // Check if any recipients are selected based on target type
    const totalRecipients = 
      (targetType === 'customers' || targetType === 'both' ? selectedCustomers.length : 0) +
      (targetType === 'suppliers' || targetType === 'both' ? selectedSuppliers.length : 0);
    
    if (totalRecipients === 0) {
      toast.error(`No ${targetType} selected. Please search and add ${targetType} first.`);
      return;
    }
    
    setLoading(true);
    try {
      let scheduledAtISO = formData.scheduledAt;
      if (formData.scheduledAt) {
        const localDate = new Date(formData.scheduledAt);
        scheduledAtISO = localDate.toISOString();
      }

      // Prepare campaign data
      const campaignData = {
        title: formData.title,
        type: type,
        message: formData.message,
        mediaUrl: formData.mediaUrl || "",
        mediaType: formData.mediaType,
        filters: formData.filters,
        scheduledAt: scheduledAtISO,
        timezone: formData.timezone,
        longMessageWithMedia: formData.longMessageWithMedia || false,
        targetType: targetType,
        // Send both customer and supplier IDs
        selectedCustomerIds: selectedCustomers
          .filter(customer => customer._id && customer._id.length === 24)
          .map(customer => customer._id),
        selectedSupplierIds: selectedSuppliers
          .filter(supplier => supplier._id && supplier._id.length === 24)
          .map(supplier => supplier._id)
      };
      
      if (uploadedMedia.length > 0) {
        campaignData.multiMediaEnabled = true;
        campaignData.mediaUrls = uploadedMedia.map(m => m.url);
        campaignData.mediaTypes = uploadedMedia.map(m => m.type);
        campaignData.mediaCaptions = uploadedMedia.map(m => m.caption);
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
    setSelectedCustomers([]);
    setFilteredCustomers([]);
    setTotalCustomers(0);
    setAverageNameLength(12);
    setSampleCustomer(null);
    setCustomerNames([]);
  };
  
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
                {formData.scheduledAt && (
                  <p className="text-sm text-gray-500 mt-1">
                    Campaign will run automatically at: <span className="font-medium">
                      {convertToTimezone(formData.scheduledAt, formData.timezone)}
                    </span> ({formData.timezone})
                  </p>
                )}
              </div>
              
              {/* Message Section */}
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
                  maxLength={formData.longMessageWithMedia ? 1000 : (formData.mediaUrl || uploadedMedia.length > 0 ? 75 : 1000)}
                />
                
                <div className="mt-2">
                  <CharacterCounter 
                    text={formData.message}
                    maxLength={formData.longMessageWithMedia ? 1000 : (formData.mediaUrl || uploadedMedia.length > 0 ? 75 : 1000)}
                    isMediaCampaign={!!(formData.mediaUrl || uploadedMedia.length > 0) && type === 'whatsapp'}
                    customerName={getDisplayCustomerName()}
                    longMessageWithMedia={formData.longMessageWithMedia || false}
                  />
                </div>
                
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
              
              {/* Media Upload Section */}
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
            
            {/* Target Audience Selection */}
            <div className="border-t pt-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-800">🎯 Target Audience</h3>
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="text-sm text-red-600 hover:text-red-800"
                >
                  Clear All Filters
                </button>
              </div>
              
              {/* Target Type Selection */}
              <div className="mb-6">
                <label className="block mb-2 font-medium text-gray-700">
                  Select Target Type
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setTargetType('customers')}
                    className={`px-4 py-2 rounded-md transition-colors ${
                      targetType === 'customers' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Customers Only
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetType('suppliers')}
                    className={`px-4 py-2 rounded-md transition-colors ${
                      targetType === 'suppliers' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Suppliers Only
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetType('both')}
                    className={`px-4 py-2 rounded-md transition-colors ${
                      targetType === 'both' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Both Customers & Suppliers
                  </button>
                </div>
              </div>
              
              {/* Customer Search Section */}
              {(targetType === 'customers' || targetType === 'both') && (
                <div className="mb-6 border rounded-lg p-4">
                  <h3 className="font-medium text-gray-800 mb-3">Add Customers</h3>
                  
                  <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      placeholder="Search customers by name, phone, or email..."
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-blue-400"
                    />
                    {isSearching && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      </div>
                    )}
                  </div>

                  {/* Customer Search Results Dropdown */}
                  {showSearchResults && searchResults.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full max-w-lg bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {searchResults.map((customer) => (
                        <div
                          key={customer._id}
                          onClick={() => addCustomerManually(customer)}
                          className="p-3 hover:bg-blue-50 cursor-pointer border-b last:border-b-0"
                        >
                          <div className="font-medium">{customer.name}</div>
                          <div className="text-sm text-gray-600">
                            {customer.phone} • {customer.email}
                          </div>
                          {customer.salesCategory && (
                            <div className="text-xs text-blue-600 mt-1">
                              {customer.salesCategory}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Selected Customers */}
                  {selectedCustomers.length > 0 && (
                    <div className="mt-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">
                          Selected Customers ({selectedCustomers.length})
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCustomers([]);
                            toast.success("All customers removed");
                          }}
                          className="text-sm text-red-600 hover:text-red-800"
                        >
                          Clear All
                        </button>
                      </div>
                      <div className="max-h-40 overflow-y-auto border rounded p-2">
                        {selectedCustomers.map((customer) => (
                          <div key={customer._id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                            <div>
                              <span className="font-medium">{customer.name}</span>
                              <span className="text-sm text-gray-600 ml-2">
                                {customer.phone} • {customer.salesCategory || 'No category'}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeCustomer(customer._id)}
                              className="text-red-500 hover:text-red-700 text-sm"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Supplier Search Section */}
              {(targetType === 'suppliers' || targetType === 'both') && (
                <div className="mb-6 border rounded-lg p-4">
                  <h3 className="font-medium text-gray-800 mb-3">Add Suppliers</h3>
                  
                  <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      value={supplierSearchQuery}
                      onChange={(e) => handleSupplierSearchChange(e.target.value)}
                      placeholder="Search suppliers by name, company, phone, or email..."
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-blue-400"
                    />
                    {isSearchingSuppliers && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      </div>
                    )}
                  </div>

                  {/* Supplier Search Results Dropdown */}
                  {showSupplierResults && supplierSearchResults.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full max-w-lg bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {supplierSearchResults.map((supplier) => (
                        <div
                          key={supplier._id}
                          onClick={() => addSupplierManually(supplier)}
                          className="p-3 hover:bg-blue-50 cursor-pointer border-b last:border-b-0"
                        >
                          <div className="font-medium">{supplier.name}</div>
                          <div className="text-sm text-gray-600">
                            {supplier.company && <span>{supplier.company} • </span>}
                            {supplier.phone} • {supplier.email}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Selected Suppliers */}
                  {selectedSuppliers.length > 0 && (
                    <div className="mt-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">
                          Selected Suppliers ({selectedSuppliers.length})
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedSuppliers([]);
                            toast.success("All suppliers removed");
                          }}
                          className="text-sm text-red-600 hover:text-red-800"
                        >
                          Clear All
                        </button>
                      </div>
                      <div className="max-h-40 overflow-y-auto border rounded p-2">
                        {selectedSuppliers.map((supplier) => (
                          <div key={supplier._id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                            <div>
                              <span className="font-medium">{supplier.company || supplier.name}</span>
                              <span className="text-sm text-gray-600 ml-2">
                                {supplier.name} • {supplier.phone}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeSupplier(supplier._id)}
                              className="text-red-500 hover:text-red-700 text-sm"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Total Count */}
              <div className="text-center p-4 bg-blue-50 rounded-lg mb-6">
                <p className="font-bold text-blue-800 text-lg">
                  Total Selected: {
                    (targetType === 'customers' ? selectedCustomers.length : 0) +
                    (targetType === 'suppliers' ? selectedSuppliers.length : 0) +
                    (targetType === 'both' ? selectedCustomers.length + selectedSuppliers.length : 0)
                  }
                </p>
                {targetType === 'both' && (
                  <p className="text-sm text-blue-600 mt-1">
                    ({selectedCustomers.length} customers, {selectedSuppliers.length} suppliers)
                  </p>
                )}
              </div>
              
              {/* Customer Filters (only shown for customers) */}
              {(targetType === 'customers' || targetType === 'both') && (
                <>
                  <h4 className="font-medium text-gray-700 mb-3">Customer Filters</h4>
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
                          Searching...
                        </span>
                      ) : (
                        'Search & Add Customers'
                      )}
                    </button>
                  </div>
                </>
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
                disabled={loading || (
                  (targetType === 'customers' && selectedCustomers.length === 0) ||
                  (targetType === 'suppliers' && selectedSuppliers.length === 0) ||
                  (targetType === 'both' && selectedCustomers.length === 0 && selectedSuppliers.length === 0)
                )}
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