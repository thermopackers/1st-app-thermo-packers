import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { categories } from "../data/products.js";
import localProducts from "../data/products.js";
import ProductCard from "../components/ProductCard";
import FloatingWhatsApp from "../components/FloatingWhatsapp";
import { Helmet } from "react-helmet";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/all";
import { slugifyProduct } from "../utils/slugify";
import { motion } from "framer-motion";
import { Search, X, ChevronLeft, Loader } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

// Slug utilities
const slugify = (str) =>
  str.replace(/\//g, "").replace(/\s+/g, "-").toLowerCase();

const slugToCategory = (slug) => {
  for (const key of Object.keys(categories)) {
    if (slugify(key) === slug) return key;
  }
  return "";
};

export default function Products() {
  const { category } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const sectionRef = useRef(null);
  
  const decodedCat = category ? slugToCategory(category) : "";
  const [selectedCat, setSelectedCat] = useState(decodedCat);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const limit = 12;

  const fetchProducts = () => {
    setLoading(true);
    
    // Filter products based on category and search term
    let filteredProducts = [...localProducts];
    
    // Filter by category if selected
    if (selectedCat) {
      filteredProducts = filteredProducts.filter(p => p.category === selectedCat);
    }
    
    // Filter by search term if exists
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filteredProducts = filteredProducts.filter(p => 
        p.name?.toLowerCase().includes(term) || 
        p.description?.toLowerCase().includes(term) ||
        p.category?.toLowerCase().includes(term)
      );
    }
    
    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedProducts = filteredProducts.slice(startIndex, endIndex);
    
    setAllProducts(paginatedProducts);
    setTotalPages(Math.ceil(filteredProducts.length / limit));
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, [page, selectedCat, searchTerm]);

  // Scroll to top when component mounts or route changes
  useEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    
    const timer = setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }, 10);
    
    return () => clearTimeout(timer);
  }, [location.pathname, page]);

  // GSAP animations
  useEffect(() => {
    if (loading) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(".product-card-animate", 
        { opacity: 0, y: 20 },
        { 
          opacity: 1, 
          y: 0, 
          duration: 0.6, 
          stagger: 0.1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: ".products-grid",
            start: "top 80%",
            toggleActions: "play none none none",
          }
        }
      );

      ScrollTrigger.refresh();
    }, sectionRef);

    return () => ctx.revert();
  }, [allProducts, loading]);

  useEffect(() => {
    setSelectedCat(decodedCat);
    setSearchTerm("");
    setPage(1);
  }, [decodedCat]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.3
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: "easeOut"
      }
    }
  };

  return (
    <>
      <Helmet>
        <title>
          {selectedCat 
            ? `${selectedCat} Products | Thermo Packers` 
            : "All Products | Thermo Packers"
          }
        </title>
        <meta
          name="description"
          content="Explore our comprehensive range of thermocol insulation sheets, EPS blocks, molded pulp packaging, seedling trays, and eco-friendly packaging solutions."
        />
      </Helmet>

      <motion.div 
        ref={sectionRef}
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="min-h-screen mt-[10vh] bg-gradient-to-br from-[#F9FAFB] via-white to-[#F0F4F8] text-gray-800 font-sans px-4 xs:px-6 sm:p-6"
      >
        <FloatingWhatsApp />

        {/* Header Section */}
        <div className="max-w-7xl mx-auto">
          {/* Back Button */}
          <div className="flex items-center justify-between mb-6">
            <motion.button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors duration-300 group"
              whileHover={{ x: -5 }}
              variants={itemVariants}
            >
              <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm font-medium hidden xs:block">Back</span>
            </motion.button>
          </div>

          {/* Page Header */}
          <motion.div 
            className="text-center mb-8 sm:mb-12"
            variants={itemVariants}
          >
            <h1 className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl font-extrabold text-gray-800 mb-4">
              {selectedCat ? (
                <>
                  <span className="text-[#B0BC27]">{selectedCat}</span> Products
                </>
              ) : (
                "Our Products"
              )}
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
              Discover our comprehensive range of premium packaging solutions and insulation materials
            </p>
          </motion.div>

          {/* Search Bar */}
          <motion.div 
            className="flex justify-center mb-8"
            variants={itemVariants}
          >
            <div className="relative w-full max-w-2xl">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search products by name, category, or features..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-12 pr-12 py-3 sm:py-4 border border-gray-300 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[#B0BC27] focus:border-transparent transition-all duration-300 bg-white/80 backdrop-blur-sm"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </motion.div>

          {/* Main Content Grid */}
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar - Categories always visible */}
            <div className="lg:w-80 flex-shrink-0">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 sticky top-24">
                <h3 className="text-xl font-bold text-gray-800 mb-6">Categories</h3>
                
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      setSelectedCat("");
                      setPage(1);
                      navigate("/products");
                    }}
                    className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-all duration-300 flex items-center justify-between ${
                      !selectedCat
                        ? "bg-[#B0BC27] text-white shadow-lg"
                        : "bg-gray-100 hover:bg-gray-200 text-gray-800"
                    }`}
                  >
                    <span>All Products</span>
                  </button>

                  {Object.keys(categories).map((cat) => {
                    const isActive = selectedCat === cat;
                    
                    return (
                      <div key={cat} className="group relative">
                        <button
                          onClick={() => {
                            setSelectedCat(cat);
                            setPage(1);
                            navigate(`/products/${slugify(cat)}`);
                          }}
                          className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-all duration-300 flex items-center justify-between ${
                            isActive
                              ? "bg-[#B0BC27] text-white shadow-lg"
                              : "bg-gray-100 hover:bg-gray-200 text-gray-800"
                          }`}
                        >
                          <span className="capitalize">{cat}</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Products Grid */}
            <div className="flex-1">
              {/* Results Header */}
              <motion.div 
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6"
                variants={itemVariants}
              >
                <div className="text-gray-600 mb-4 sm:mb-0">
                  Showing <span className="font-semibold text-gray-800">{allProducts.length}</span> products
                  {selectedCat && (
                    <span> in <span className="font-semibold text-[#B0BC27]">{selectedCat}</span></span>
                  )}
                  {searchTerm && (
                    <span> for "<span className="font-semibold text-gray-800">{searchTerm}</span>"</span>
                  )}
                </div>
              </motion.div>

              {/* Loading State */}
              {loading ? (
                <motion.div 
                  className="flex justify-center items-center min-h-[50vh]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div className="text-center">
                    <Loader className="w-12 h-12 text-[#B0BC27] animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">Loading products...</p>
                  </div>
                </motion.div>
              ) : (
                <>
                  {/* Products Grid */}
                  <div className="products-grid grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {allProducts.length > 0 ? (
                      allProducts.map((product, index) => (
                        <div
                          key={product._id || index}
                          className="product-card-animate"
                        >
                          <ProductCard product={product} />
                        </div>
                      ))
                    ) : (
                      <div className="col-span-full text-center py-16">
                        <div className="text-6xl mb-4">🔍</div>
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">No products found</h3>
                        <p className="text-gray-600 mb-6">
                          {searchTerm 
                            ? `No products match "${searchTerm}". Try adjusting your search.`
                            : "No products available in this category."
                          }
                        </p>
                        <button
                          onClick={() => {
                            setSearchTerm("");
                            setSelectedCat("");
                            setPage(1);
                            navigate("/products");
                          }}
                          className="bg-[#B0BC27] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#9ca824] transition-colors duration-300"
                        >
                          View All Products
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <motion.div 
                      className="mt-12 flex justify-center"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <div className="flex gap-2 flex-wrap justify-center">
                        <button
                          onClick={() => {
                            setPage(Math.max(1, page - 1));
                            window.scrollTo(0, 0);
                          }}
                          disabled={page === 1}
                          className="px-4 py-2 rounded-xl font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed bg-white border border-gray-300 hover:bg-gray-50"
                        >
                          Previous
                        </button>
                        
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (page <= 3) {
                            pageNum = i + 1;
                          } else if (page >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = page - 2 + i;
                          }

                          return (
                            <button
                              key={i}
                              onClick={() => {
                                setPage(pageNum);
                                window.scrollTo(0, 0);
                              }}
                              className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 ${
                                page === pageNum
                                  ? "bg-[#B0BC27] text-white shadow-lg"
                                  : "bg-white border border-gray-300 hover:bg-gray-50"
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}

                        <button
                          onClick={() => {
                            setPage(Math.min(totalPages, page + 1));
                            window.scrollTo(0, 0);
                          }}
                          disabled={page === totalPages}
                          className="px-4 py-2 rounded-xl font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed bg-white border border-gray-300 hover:bg-gray-50"
                        >
                          Next
                        </button>
                      </div>
                    </motion.div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
}