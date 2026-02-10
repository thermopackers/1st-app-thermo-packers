// src/components/TourPlanning.js
import React, { useEffect, useState, useMemo, useCallback } from "react";
import axiosInstance from "../axiosInstance";
import { useNavigate } from "react-router-dom";
import InternalNavbar from "../components/InternalNavbar";
import { motion, AnimatePresence } from "framer-motion";
import Swal from "sweetalert2";

// Add debounce utility function
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

export default function TourPlanning() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cities, setCities] = useState([]);
  const [states, setStates] = useState([]);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'cards'
  const [selectedState, setSelectedState] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [categories, setCategories] = useState([]);
  const [expandedCustomer, setExpandedCustomer] = useState(null);
  const [citySearch, setCitySearch] = useState("");
  const [categorySearch, setCategorySearch] = useState("");
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [addressSearch, setAddressSearch] = useState("");
  const [phoneSearch, setPhoneSearch] = useState("");
  const [nameSearch, setNameSearch] = useState("");
  
  // Pagination states
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [limit] = useState(12);
  
  // Add debounced search values
  const debouncedNameSearch = useDebounce(nameSearch, 1500);
  const debouncedPhoneSearch = useDebounce(phoneSearch, 1500);
  const debouncedAddressSearch = useDebounce(addressSearch, 1500);

  // Animation variants
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  // Filtered cities based on search
  const filteredCities = useMemo(() => {
    return cities.filter(city => 
      city.toLowerCase().includes(citySearch.toLowerCase())
    );
  }, [cities, citySearch]);

  // Filtered categories based on search
  const filteredCategories = useMemo(() => {
    return categories.filter(category => 
      category.toLowerCase().includes(categorySearch.toLowerCase())
    );
  }, [categories, categorySearch]);

  // Fetch customers with pagination
  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      
      // Build query parameters
      const params = {
        page,
        limit,
        ...(debouncedNameSearch && { name: debouncedNameSearch }),
        ...(debouncedPhoneSearch && { phone: debouncedPhoneSearch }),
        ...(debouncedAddressSearch && { address: debouncedAddressSearch }),
        ...(selectedCategory && { category: selectedCategory }),
        ...(selectedCity && { city: selectedCity }),
        ...(selectedState && { state: selectedState })
      };

      console.log("Fetching with params:", params);

      const response = await axiosInstance.get("/customers-tour/tour-planning", { params });
      
      const customersData = response.data.customers || [];
      const total = response.data.total || 0;
      const pages = response.data.pages || 1;

      const uniqueCities = response.data.filters?.cities || [];
      const uniqueStates = response.data.filters?.states || [];

      console.log("Received:", customersData.length, "customers, total:", total, "pages:", pages);

      setCustomers(customersData);
      setTotalCustomers(total);
      setTotalPages(pages);
      setCities(uniqueCities);
      setStates(uniqueStates);

    } catch (err) {
      console.error("Failed to fetch customers", err);
    } finally {
      setLoading(false);
    }
  }, [
    page,
    limit,
    debouncedNameSearch,
    debouncedPhoneSearch,
    debouncedAddressSearch,
    selectedCategory,
    selectedCity,
    selectedState
  ]);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axiosInstance.get("/customers/settings/categories");
        setCategories(response.data.categories || []);
      } catch (err) {
        console.error("Failed to fetch categories", err);
      }
    };

    fetchCategories();
  }, []);

  // Fetch customers when filters or page changes
  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleCitySelect = (city) => {
    setSelectedCity(city);
    setCitySearch(city);
    setShowCityDropdown(false);
    setPage(1);
  };

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    setCategorySearch(category);
    setShowCategoryDropdown(false);
    setPage(1);
  };

  const handleSearchChange = (searchType, value) => {
    switch (searchType) {
      case 'name':
        setNameSearch(value);
        break;
      case 'phone':
        setPhoneSearch(value);
        break;
      case 'address':
        setAddressSearch(value);
        break;
      default:
        break;
    }
    setPage(1);
  };

  const toggleCustomerExpand = (customerId) => {
    setExpandedCustomer(expandedCustomer === customerId ? null : customerId);
  };

  const clearFilters = () => {
    setSelectedCity("");
    setSelectedState("");
    setSelectedCategory("");
    setCitySearch("");
    setCategorySearch("");
    setNameSearch("");
    setPhoneSearch("");
    setAddressSearch("");
    setPage(1);
  };

  // Calculate city count for badges
  const getCityCustomerCount = (city) => {
    return customers.filter(c => c.city === city).length;
  };

  // Pagination handlers
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      const start = Math.max(1, page - 2);
      const end = Math.min(totalPages, start + maxVisiblePages - 1);
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      if (start > 1) {
        pages.unshift(1);
        if (start > 2) pages[0] = '...';
      }
      
      if (end < totalPages) {
        pages.push(totalPages);
        if (end < totalPages - 1) pages[pages.length - 1] = '...';
      }
    }
    
    return pages;
  };

  if (loading && page === 1) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white">
        <motion.div
          className="flex flex-col items-center gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <motion.p
            className="text-blue-700 font-semibold text-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Loading tour planning data...
          </motion.p>
        </motion.div>
      </div>
    );
  }

  return (
    <>
      <InternalNavbar />
      
      <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Back Button */}
          <motion.button
            onClick={() => navigate(-1)}
            className="mb-6 inline-flex items-center gap-3 bg-white px-4 py-3 rounded-xl shadow-lg hover:shadow-xl text-gray-700 font-medium transition-all duration-300 group"
            whileHover={{ x: -5 }}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <span className="text-xl group-hover:-translate-x-1 transition-transform">
              ←
            </span>
            Back to Dashboard
          </motion.button>

          {/* Header */}
          <motion.div 
            className="text-center mb-8"
            variants={fadeIn}
            initial="hidden"
            animate="visible"
          >
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              🗺️ Tour Planning
            </h1>
          </motion.div>

          {/* Filters Section */}
          <motion.div 
            className="bg-white rounded-3xl shadow-lg p-6 mb-8 border border-gray-100"
            variants={fadeIn}
            initial="hidden"
            animate="visible"
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6 text-xs">
              {/* Quick Search Filters */}
              <div className="lg:col-span-3">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="text-xl">🔍</span>
                  Quick Search
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Name Search */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                      <span className="text-gray-400">👤</span>
                      Customer Name
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={nameSearch}
                        onChange={(e) => handleSearchChange('name', e.target.value)}
                        placeholder="Type customer name..."
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        aria-label="Search by customer name"
                      />
                      {nameSearch && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            {loading ? "Searching..." : `${customers.length} found`}
                          </span>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Search by full or partial name
                    </p>
                  </div>

                  {/* Phone Search */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                      <span className="text-gray-400">📞</span>
                      Phone Number
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={phoneSearch}
                        onChange={(e) => handleSearchChange('phone', e.target.value)}
                        placeholder="Type phone number..."
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        aria-label="Search by phone number"
                      />
                      {phoneSearch && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            {loading ? "Searching..." : `${customers.length} found`}
                          </span>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Search by mobile or landline number
                    </p>
                  </div>

                  {/* Address Search */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                      <span className="text-gray-400">📍</span>
                      Address
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={addressSearch}
                        onChange={(e) => handleSearchChange('address', e.target.value)}
                        placeholder="Type address..."
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        aria-label="Search by address"
                      />
                      {addressSearch && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            {loading ? "Searching..." : `${customers.length} found`}
                          </span>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Search by city, street, or area
                    </p>
                  </div>
                </div>
              </div>

              {/* City Dropdown */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                      <span className="text-gray-400">📍</span>
                      Select City
                    </label>
                <div className="relative">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={citySearch}
                      onChange={(e) => {
                        setCitySearch(e.target.value);
                        setShowCityDropdown(true);
                      }}
                      onFocus={() => setShowCityDropdown(true)}
                      placeholder="Type or select city..."
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                      onClick={() => setShowCityDropdown(!showCityDropdown)}
                      className="p-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      {showCityDropdown ? "▲" : "▼"}
                    </button>
                  </div>

                  {/* City Dropdown List */}
                  <AnimatePresence>
                    {showCityDropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: "auto" }}
                        exit={{ opacity: 0, y: -10, height: 0 }}
                        className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-64 overflow-y-auto"
                      >
                        {/* <div className="p-2 border-b">
                          <input
                            type="text"
                            placeholder="Search cities..."
                            value={citySearch}
                            onChange={(e) => setCitySearch(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                          />
                        </div> */}
                        
                        {filteredCities.length > 0 ? (
                          <ul className="py-2">
                            <li>
                              <button
                                onClick={() => {
                                  setSelectedCity("");
                                  setCitySearch("");
                                  setShowCityDropdown(false);
                                }}
                                className={`w-full text-left px-4 py-2 hover:bg-gray-100 flex justify-between items-center ${
                                  selectedCity === "" ? "bg-blue-50 text-blue-600" : ""
                                }`}
                              >
                                <span>All Cities</span>
                               
                              </button>
                            </li>
                            {filteredCities.map((city) => (
                              <li key={city}>
                                <button
                                  onClick={() => handleCitySelect(city)}
                                  className={`w-full text-left px-4 py-2 hover:bg-gray-100 flex justify-between items-center ${
                                    selectedCity === city ? "bg-blue-50 text-blue-600 font-medium" : ""
                                  }`}
                                >
                                  <span>{city}</span>
                                 
                                </button>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <div className="p-4 text-center text-gray-500">
                            No cities found
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Category Dropdown */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                      <span className="text-gray-400">🏷️</span>
                      Select Category
                    </label>
                <div className="relative">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={categorySearch}
                      onChange={(e) => {
                        setCategorySearch(e.target.value);
                        setShowCategoryDropdown(true);
                      }}
                      onFocus={() => setShowCategoryDropdown(true)}
                      placeholder="Type or select category..."
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                      onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                      className="p-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      {showCategoryDropdown ? "▲" : "▼"}
                    </button>
                  </div>

                  {/* Category Dropdown List */}
                  <AnimatePresence>
                    {showCategoryDropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: "auto" }}
                        exit={{ opacity: 0, y: -10, height: 0 }}
                        className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-64 overflow-y-auto"
                      >
                        {/* <div className="p-2 border-b">
                          <input
                            type="text"
                            placeholder="Search categories..."
                            value={categorySearch}
                            onChange={(e) => setCategorySearch(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                          />
                        </div> */}
                        
                        {filteredCategories.length > 0 ? (
                          <ul className="py-2">
                            <li>
                              <button
                                onClick={() => {
                                  setSelectedCategory("");
                                  setCategorySearch("");
                                  setShowCategoryDropdown(false);
                                }}
                                className={`w-full text-left px-4 py-2 hover:bg-gray-100 flex justify-between items-center ${
                                  selectedCategory === "" ? "bg-blue-50 text-blue-600" : ""
                                }`}
                              >
                                <span>All Categories</span>
                               
                              </button>
                            </li>
                            {filteredCategories.map((category) => (
                              <li key={category}>
                                <button
                                  onClick={() => handleCategorySelect(category)}
                                  className={`w-full text-left px-4 py-2 hover:bg-gray-100 flex justify-between items-center ${
                                    selectedCategory === category ? "bg-purple-50 text-purple-600 font-medium" : ""
                                  }`}
                                >
                                  <span>{category}</span>
                                 
                                </button>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <div className="p-4 text-center text-gray-500">
                            No categories found
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col justify-end">
                <div className="flex gap-3">
                  <button
                    onClick={clearFilters}
                    className="flex-1 bg-gray-600 text-white px-4 py-3 rounded-lg hover:bg-gray-700 transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    🗑️ Clear All
                  </button>
                </div>
              </div>
            </div>

            {/* Active Filters Display */}
            {(selectedCity || selectedCategory || debouncedAddressSearch || debouncedPhoneSearch || debouncedNameSearch) && (
              <motion.div 
                className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex flex-wrap gap-2">
                    <span className="font-medium text-gray-700">Active Filters:</span>
                    
                    {debouncedNameSearch && (
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center gap-2">
                        👤 Name: "{debouncedNameSearch}"
                        <button 
                          onClick={() => setNameSearch("")}
                          className="text-blue-600 hover:text-blue-800 text-xs"
                        >
                          ✕
                        </button>
                      </span>
                    )}
                    
                    {debouncedPhoneSearch && (
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center gap-2">
                        📞 Phone: "{debouncedPhoneSearch}"
                        <button 
                          onClick={() => setPhoneSearch("")}
                          className="text-blue-600 hover:text-blue-800 text-xs"
                        >
                          ✕
                        </button>
                      </span>
                    )}
                    
                    {debouncedAddressSearch && (
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center gap-2">
                        📍 Address: "{debouncedAddressSearch}"
                        <button 
                          onClick={() => setAddressSearch("")}
                          className="text-blue-600 hover:text-blue-800 text-xs"
                        >
                          ✕
                        </button>
                      </span>
                    )}
                    
                    {selectedCity && (
                      <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm flex items-center gap-2">
                        🏙️ City: {selectedCity}
                        <button 
                          onClick={() => {
                            setSelectedCity("");
                            setCitySearch("");
                          }}
                          className="text-purple-600 hover:text-purple-800 text-xs"
                        >
                          ✕
                        </button>
                      </span>
                    )}
                    
                    {selectedCategory && (
                      <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm flex items-center gap-2">
                        🏷️ Category: {selectedCategory}
                        <button 
                          onClick={() => {
                            setSelectedCategory("");
                            setCategorySearch("");
                          }}
                          className="text-purple-600 hover:text-purple-800 text-xs"
                        >
                          ✕
                        </button>
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">
                      Showing {customers.length} of {totalCustomers} total customers
                    </span>
                    <button
                      onClick={clearFilters}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                    >
                      Clear All
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* Loading indicator for search */}
          {loading && (
            <motion.div 
              className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-blue-700">Searching customers...</span>
              </div>
            </motion.div>
          )}

          {/* Results Summary */}
          <motion.div 
            className="mb-8 p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-3xl shadow-lg border border-green-200"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-bold text-gray-900 mb-2">
                  📊 Tour Planning Results
                </h4>
                <p className="text-gray-600 text-xs">
                  Page {page} of {totalPages} • Showing {customers.length} customer(s) on this page
                  {selectedCity && ` • City: ${selectedCity}`}
                  {selectedCategory && ` • Category: ${selectedCategory}`}
                </p>
              </div>
              <div className="flex gap-3">
                <span className="bg-green-600 text-white px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2">
                  👥 {totalCustomers} Total
                </span>
                <span className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2">
                  📄 Page {page}/{totalPages}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Customers List - Conditional View */}
          {customers.length > 0 ? (
            <>
              {/* View Toggle Controls - Always Visible */}
              <div className="mb-4 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing <span className="font-semibold">{customers.length}</span> of{' '}
                  <span className="font-semibold">{totalCustomers}</span> customers
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-700 hidden md:block">View as:</span>
                  <div className="flex bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => setViewMode('table')}
                      className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                        viewMode === 'table'
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <span className="hidden sm:inline">Table</span>
                      <span className="sm:hidden">📋</span>
                    </button>
                    <button
                      onClick={() => setViewMode('cards')}
                      className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                        viewMode === 'cards'
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <span className="hidden sm:inline">Cards</span>
                      <span className="sm:hidden">🃏</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Table View */}
              {viewMode === 'table' ? (
                <motion.div 
                  className="bg-white text-xs rounded-3xl shadow-lg border border-gray-200 overflow-hidden mb-8 overflow-x-auto"
                  variants={fadeIn}
                  initial="hidden"
                  animate="visible"
                >
                  {/* Table Header - Desktop */}
                  <div className="min-w-[1024px] md:min-w-0">
                    <div className="hidden md:grid md:grid-cols-12 gap-4 p-4 bg-gray-50 border-b border-gray-200 font-semibold text-gray-700 text-sm">
                      <div className="md:col-span-3">Customer Information</div>
                      <div className="md:col-span-3">Contact Details</div>
    <div className="md:col-span-2">📍 City</div> {/* ✅ ADD THIS LINE */}
                      <div className="md:col-span-3">Location</div>
                      {/* <div className="md:col-span-2">Category & GST</div>
                      <div className="md:col-span-1 text-center">Actions</div> */}
                    </div>

                    {/* Table Body */}
                    <div className="divide-y divide-gray-100">
                      {customers.map((customer) => (
                        <motion.div
                          key={customer._id}
                          className={`p-4 hover:bg-gray-50 transition-colors duration-200 min-w-[1024px] md:min-w-0 ${
                            expandedCustomer === customer._id ? 'bg-blue-50' : ''
                          }`}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          {/* Desktop Table Row */}
                          <div className="hidden md:grid md:grid-cols-12 gap-4 items-start">
                            {/* Customer Information */}
                            <div className="md:col-span-3">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                                  {customer.name?.charAt(0)?.toUpperCase()}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <h3 className="font-semibold text-gray-900 break-words">
                                    {customer.name}
                                  </h3>
                                  <p className="text-sm text-gray-500 break-words">
                                    {customer.company || "No company"}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Contact Details */}
                            <div className="md:col-span-3">
                              <div className="space-y-2">
                                {customer.phone && (
                                  <div className="flex items-center gap-2">
                                    <span className="text-gray-400 text-sm flex-shrink-0">📞</span>
                                    <a 
                                      href={`tel:${customer.phone}`}
                                      className="text-sm text-gray-700 hover:text-blue-600 hover:underline break-all"
                                    >
                                      {customer.phone}
                                    </a>
                                  </div>
                                )}
                                {customer.email && (
                                  <div className="flex items-center gap-2">
                                    <span className="text-gray-400 text-sm flex-shrink-0">✉️</span>
                                    <a 
                                      href={`mailto:${customer.email}`}
                                      className="text-sm text-gray-700 hover:text-blue-600 hover:underline break-all"
                                    >
                                      {customer.email}
                                    </a>
                                  </div>
                                )}
                              </div>
                            </div>
                            {/* ✅ ADD THIS - City Column */}
<div className="md:col-span-2">
  <div className="space-y-2">
    {customer.city && (
      <div className="flex items-center gap-2">
        <span className="text-gray-400 text-sm flex-shrink-0">🏙️</span>
        <span className="text-sm text-gray-700 font-medium">
          {customer.city}
        </span>
      </div>
    )}
    {customer.state && (
      <div className="flex items-center gap-2">
        <span className="text-gray-400 text-sm flex-shrink-0">🗺️</span>
        <span className="text-sm text-gray-500">
          {customer.state}
        </span>
      </div>
    )}
    {!customer.city && !customer.state && (
      <span className="text-sm text-gray-400">—</span>
    )}
  </div>
</div>

                            {/* Location */}
                            <div className="md:col-span-3">
                              <div className="space-y-2">
                                <p className="text-sm text-gray-700 break-words">
                                  {customer.address || "No address"}
                                </p>
                                {customer.locationLink && (
                                  <a
                                    href={customer.locationLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1 break-all"
                                  >
                                    📍 View on Maps
                                  </a>
                                )}
                              </div>
                            </div>

                            {/* Category & GST */}
                            <div className="md:col-span-2">
                              <div className="space-y-2">
                                {customer.salesCategory && (
                                  <span className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full break-words">
                                    {customer.salesCategory}
                                  </span>
                                )}
                                {customer.gst && (
                                  <div className="text-xs text-gray-500 break-all">
                                    GST: {customer.gst}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="md:col-span-1">
                              <div className="flex items-center justify-center">
                                <button
                                  onClick={() => toggleCustomerExpand(customer._id)}
                                  className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-1"
                                  title="More Details"
                                >
                                  {expandedCustomer === customer._id ? "▲ Less" : "▼ More"}
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Mobile Card View (Always shown on mobile regardless of viewMode) */}
                          <div className="md:hidden bg-white rounded-xl border border-gray-200 p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-3 flex-1">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                                  {customer.name?.charAt(0)?.toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-bold text-gray-900 break-words">
                                    {customer.name}
                                  </h3>
                                  <p className="text-sm text-gray-600 break-words">
                                    {customer.company || "No company"}
                                  </p>
                                </div>
                              </div>
                              {customer.salesCategory && (
                                <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full flex-shrink-0">
                                  {customer.salesCategory}
                                </span>
                              )}
                            </div>

                            {/* Contact Info - Mobile */}
                            <div className="space-y-3 mb-3">
                              {customer.phone && (
                                <div className="flex items-center gap-2">
                                  <span className="text-gray-400 flex-shrink-0">📞</span>
                                  <a 
                                    href={`tel:${customer.phone}`}
                                    className="text-gray-700 hover:text-blue-600 hover:underline break-all flex-1"
                                  >
                                    {customer.phone}
                                  </a>
                                </div>
                              )}
                              {customer.email && (
                                <div className="flex items-center gap-2">
                                  <span className="text-gray-400 flex-shrink-0">✉️</span>
                                  <a 
                                    href={`mailto:${customer.email}`}
                                    className="text-gray-700 hover:text-blue-600 hover:underline break-all flex-1"
                                  >
                                    {customer.email}
                                  </a>
                                </div>
                              )}
                              {customer.address && (
                                <div className="flex gap-2">
                                  <span className="text-gray-400 mt-1 flex-shrink-0">📍</span>
                                  <div className="flex-1">
                                    <p className="text-sm text-gray-700 break-words mb-1">
                                      {customer.address}
                                    </p>
                                    {customer.locationLink && (
                                      <a
                                        href={customer.locationLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1"
                                      >
                                        View on Maps →
                                      </a>
                                    )}
                                  </div>
                                </div>
                              )}
                              {customer.gst && (
                                <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded break-all">
                                  GST: {customer.gst}
                                </div>
                              )}

                              {/* ✅ ADD THIS - City & State for Mobile */}
  {(customer.city || customer.state) && (
    <div className="flex items-center gap-2">
      <span className="text-gray-400 flex-shrink-0">📍</span>
      <div className="flex-1">
        {customer.city && (
          <span className="text-sm text-gray-700 font-medium mr-2">
            {customer.city}
          </span>
        )}
        {customer.state && (
          <span className="text-xs text-gray-500">
            ({customer.state})
          </span>
        )}
      </div>
    </div>
  )}
                            </div>
                          

                            {/* Mobile Actions */}
                            
                            <button
                              onClick={() => toggleCustomerExpand(customer._id)}
                              className="w-full mt-3 flex items-center justify-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800"
                            >
                              {expandedCustomer === customer._id ? "▲ Less" : "▼ More"}
                            </button>
                          </div>

                          {/* Expandable Details (Both Desktop & Mobile) */}
                          <AnimatePresence>
                            {expandedCustomer === customer._id && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200"
                              >
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {/* Instructions */}
                                  {customer.instructions && (
                                    <div>
                                      <h4 className="font-semibold text-gray-900 text-sm mb-2 flex items-center gap-2">
                                        📝 Special Instructions
                                      </h4>
                                      <div className="bg-white p-3 rounded-lg border border-gray-200">
                                        <p className="text-sm text-gray-600">
                                          {customer.instructions}
                                        </p>
                                      </div>
                                    </div>
                                  )}

                                  {/* Documents */}
                                  {customer.gstDocs?.length > 0 && (
                                    <div>
                                      <h4 className="font-semibold text-gray-900 text-sm mb-2 flex items-center gap-2">
                                        📄 Documents ({customer.gstDocs.length})
                                      </h4>
                                      <div className="flex flex-wrap gap-2">
                                        {customer.gstDocs.slice(0, 3).map((doc, idx) => {
                                          const isImage = /\.(jpg|jpeg|png|gif)$/i.test(doc);
                                          const isPDF = doc.endsWith('.pdf');
                                          return (
                                            <a
                                              key={idx}
                                              href={doc}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="inline-flex items-center gap-1 px-3 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                                            >
                                              {isImage ? (
                                                <>
                                                  <span>🖼️</span>
                                                  <span className="text-sm">Image {idx + 1}</span>
                                                </>
                                              ) : isPDF ? (
                                                <>
                                                  <span>📄</span>
                                                  <span className="text-sm">PDF {idx + 1}</span>
                                                </>
                                              ) : (
                                                <>
                                                  <span>📎</span>
                                                  <span className="text-sm">Doc {idx + 1}</span>
                                                </>
                                              )}
                                            </a>
                                          );
                                        })}
                                        {customer.gstDocs.length > 3 && (
                                          <span className="text-sm text-gray-500 self-center">
                                            +{customer.gstDocs.length - 3} more
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  )}

                                  {/* Quick Actions */}
                                  <div className="md:col-span-2">
                                    <div className="flex flex-wrap gap-3">
                                      <a
                                        href={`tel:${customer.phone}`}
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                      >
                                        <span>📞</span>
                                        <span>Call Customer</span>
                                      </a>
                                      <button
                                        onClick={() => {
                                          navigator.clipboard.writeText(customer.phone || customer.email || '');
                                          alert('Contact copied to clipboard!');
                                        }}
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                                      >
                                        <span>📋</span>
                                        <span>Copy Contact</span>
                                      </button>
                                      <a
                                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(customer.address || '')}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                                      >
                                        <span>🗺️</span>
                                        <span>Get Directions</span>
                                      </a>
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ) : (
                /* Card View (for desktop when selected) */
                <motion.div 
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8"
                  variants={fadeIn}
                  initial="hidden"
                  animate="visible"
                >
                  {customers.map((customer) => (
                    <motion.div
                      key={customer._id}
                      className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow duration-300"
                      whileHover={{ y: -5 }}
                    >
                      <div className="p-6">
                        {/* Customer Header */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-sm text-gray-900 mb-1 break-words">
                              {customer.name}
                            </h3>
                            <p className="text-gray-600 text-xs break-words">
                              {customer.company || "No company"}
                            </p>
                          </div>
                          
                          <div className="flex flex-col items-end gap-1 flex-shrink-0">
                            {customer.salesCategory && (
                              <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full break-words">
                                {customer.salesCategory}
                              </span>
                            )}
                            {customer.gst && (
                              <span className="text-xs text-gray-500 break-all">GST: {customer.gst}</span>
                            )}
                          </div>
                        </div>

                        {/* Contact Info - Compact */}
                        <div className="space-y-3 mb-4">
                          {customer.phone && (
                            <div className="flex items-center gap-3">
                              <span className="text-gray-400 text-xs flex-shrink-0">📞</span>
                              <div className="flex-1 min-w-0">
                                <a 
                                  href={`tel:${customer.phone}`}
                                  className="text-gray-700 hover:text-blue-600 hover:underline text-xs break-all"
                                >
                                  {customer.phone}
                                </a>
                              </div>
                            </div>
                          )}
                          
                          {customer.email && (
                            <div className="flex items-center gap-3">
                              <span className="text-gray-400 text-xs flex-shrink-0">✉️</span>
                              <div className="flex-1 min-w-0">
                                <a 
                                  href={`mailto:${customer.email}`}
                                  className="text-gray-700 hover:text-blue-600 hover:underline text-xs break-all block"
                                >
                                  {customer.email}
                                </a>
                              </div>
                            </div>
                          )}
                          
                          {customer.address && (
                            <div className="flex gap-3">
                              <span className="text-gray-400 text-xs mt-1 flex-shrink-0">📍</span>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-gray-700 mb-1 break-words">
                                  {customer.address}
                                </p>
                                {customer.locationLink && (
                                  <a
                                    href={customer.locationLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1 break-all"
                                  >
                                    View on Maps →
                                  </a>
                                )}
                              </div>
                            </div>
                          )}
                            {/* ✅ ADD THIS - City & State for Card View */}
  {(customer.city || customer.state) && (
    <div className="flex items-center gap-3">
      <span className="text-gray-400 text-xs flex-shrink-0">📍</span>
      <div className="flex-1 min-w-0">
        {customer.city && (
          <span className="text-xs text-gray-700 font-medium mr-2">
            {customer.city}
          </span>
        )}
        {customer.state && (
          <span className="text-xs text-gray-500">
            ({customer.state})
          </span>
        )}
      </div>
    </div>
  )}
                        </div>


                        {/* Card Actions */}
                        <div className="border-t border-gray-100 pt-4">
                         
                          <button
                            onClick={() => toggleCustomerExpand(customer._id)}
                            className="w-full mt-3 flex items-center justify-center gap-2 text-xs font-medium text-blue-600 hover:text-blue-800"
                          >
                            {expandedCustomer === customer._id ? "▲ Hide Details" : "▼ Show More Details"}
                          </button>
                        </div>

                        {/* Expandable Details for Card View */}
                        <AnimatePresence>
                          {expandedCustomer === customer._id && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="mt-4 space-y-3"
                            >
                              {/* Instructions */}
                              {customer.instructions && (
                                <div className="bg-gray-50 p-3 rounded-lg">
                                  <h4 className="font-semibold text-gray-900 text-xs mb-1 flex items-center gap-2">
                                    📝 Special Instructions:
                                  </h4>
                                  <p className="text-gray-600 text-xs break-words">
                                    {customer.instructions}
                                  </p>
                                </div>
                              )}

                              {/* Documents */}
                              {customer.gstDocs?.length > 0 && (
                                <div>
                                  <h4 className="font-semibold text-gray-900 text-sm mb-2">
                                    📄 Documents ({customer.gstDocs.length})
                                  </h4>
                                  <div className="flex flex-wrap gap-2">
                                    {customer.gstDocs.slice(0, 3).map((doc, idx) => {
                                      const isImage = /\.(jpg|jpeg|png|gif)$/i.test(doc);
                                      const isPDF = doc.endsWith('.pdf');
                                      return (
                                        <a
                                          key={idx}
                                          href={doc}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded flex items-center gap-1"
                                        >
                                          {isImage ? (
                                            <>
                                              <span>🖼️</span>
                                              <span>Image {idx + 1}</span>
                                            </>
                                          ) : isPDF ? (
                                            <>
                                              <span>📄</span>
                                              <span>PDF {idx + 1}</span>
                                            </>
                                          ) : (
                                            <>
                                              <span>📎</span>
                                              <span>Doc {idx + 1}</span>
                                            </>
                                          )}
                                        </a>
                                      );
                                    })}
                                    {customer.gstDocs.length > 3 && (
                                      <span className="text-xs text-gray-500">
                                        +{customer.gstDocs.length - 3} more
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Quick Actions */}
                              <div className="flex flex-wrap gap-2 pt-2">
                                <a
                                  href={`tel:${customer.phone}`}
                                  className="flex-1 bg-green-600 text-white px-3 py-2 rounded-lg text-xs font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                                >
                                  📞 Call Now
                                </a>
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(customer.phone || customer.email || '');
                                    alert('Contact copied to clipboard!');
                                  }}
                                  className="flex-1 bg-gray-600 text-white px-3 py-2 rounded-lg text-xs font-medium hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
                                >
                                  📋 Copy Contact
                                </button>
                                 <a
                                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(customer.address || '')}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                                      >
                                        <span className="text-xs">🗺️</span>
                                        <span className="text-xs">Get Directions</span>
                                      </a>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <motion.div 
                  className="flex flex-col items-center justify-center gap-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div className="flex items-center gap-2">
                    {/* Previous Button */}
                    <button
                      onClick={() => handlePageChange(page - 1)}
                      disabled={page === 1}
                      className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                        page === 1
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : "bg-blue-600 text-white hover:bg-blue-700"
                      }`}
                    >
                      ← Previous
                    </button>

                    {/* Page Numbers */}
                    {getPageNumbers().map((pageNum, index) => (
                      <React.Fragment key={index}>
                        {pageNum === '...' ? (
                          <span className="px-3 py-2 text-gray-400">...</span>
                        ) : (
                          <button
                            onClick={() => handlePageChange(pageNum)}
                            className={`px-4 py-2 rounded-lg ${
                              page === pageNum
                                ? "bg-blue-600 text-white font-bold"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`}
                          >
                            {pageNum}
                          </button>
                        )}
                      </React.Fragment>
                    ))}

                    {/* Next Button */}
                    <button
                      onClick={() => handlePageChange(page + 1)}
                      disabled={page === totalPages}
                      className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                        page === totalPages
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : "bg-blue-600 text-white hover:bg-blue-700"
                      }`}
                    >
                      Next →
                    </button>
                  </div>

                  {/* Page Input & Info */}
                  <div className="flex flex-col md:flex-row items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">Go to page:</span>
                      <input
                        type="number"
                        min="1"
                        max={totalPages}
                        value={page}
                        onChange={(e) => {
                          const value = parseInt(e.target.value);
                          if (value >= 1 && value <= totalPages) {
                            handlePageChange(value);
                          }
                        }}
                        className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-center"
                      />
                      <span className="text-gray-500">of {totalPages}</span>
                    </div>
                    <div className="text-sm text-gray-500">
                      {limit} customers per page • Total: {totalCustomers} customers
                    </div>
                  </div>
                </motion.div>
              )}
            </>
          ) : !loading ? (
            <motion.div 
              className="bg-white rounded-3xl shadow p-8 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="text-5xl mb-4">🔍</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                No Customers Found
              </h3>
              <p className="text-gray-600 mb-4">
                Try adjusting your filters to find customers.
              </p>
              <button
                onClick={clearFilters}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium"
              >
                Clear All Filters
              </button>
            </motion.div>
          ) : null}

          {/* Export Options */}
          {customers.length > 0 && !loading && (
            <motion.div 
              className="mt-8 p-6 bg-white rounded-3xl shadow-lg border border-gray-100"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    📋 Export Tour Plan
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Export customers for offline access
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                 <button
  onClick={() => {
    const csvData = [
      ['Name', 'Phone', 'Email', 'City', 'State', 'Address', 'Category', 'GST', 'Instructions'],
      ...customers.map(c => [
        c.name,
        c.phone || '',
        c.email || '',
        c.city || '', // ✅ ADD CITY
        c.state || '', // ✅ ADD STATE
        c.address || '',
        c.salesCategory || '',
        c.gst || '',
        c.instructions || ''
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tour_plan_${selectedCity || 'all_cities'}_page_${page}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  }}
  className="bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 flex items-center gap-2 font-medium"
>
  📥 Export This Page (CSV)
</button>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </main>
    </>
  );
}