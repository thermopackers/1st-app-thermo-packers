import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import FloatingWhatsApp from "../components/FloatingWhatsapp";
import { Helmet } from "react-helmet";
import { Mail, MessageCircle, Phone, ChevronLeft, Star, Share2, Truck, Shield, Clock } from "lucide-react";
import { motion } from "framer-motion";
import axiosInstance from "../axiosInstance";

const slugify = (text) =>
  text?.toLowerCase().replace(/\//g, "-").replace(/\s+/g, "-").replace(/[^\w-]+/g, "");

export default function ProductDetail() {
  const { name } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("description");
  const [imageLoading, setImageLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await axiosInstance.get(`products/slug/${slugify(name)}`);
        setProduct(res.data);

        const initialMedia =
          res.data.images && res.data.images.length > 0
            ? res.data.images[0]
            : res.data.image || null;
        setSelectedMedia(initialMedia);
      } catch (err) {
        console.error("Error fetching product:", err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [name]);

  useEffect(() => {
    if (!loading && product) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [product, loading]);

  if (loading) {
    return (
      <div className="min-h-screen mt-[10vh] flex items-center justify-center bg-gradient-to-br from-[#F9FAFB] via-white to-[#F0F4F8]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#B0BC27] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading product details...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen mt-[10vh] flex items-center justify-center bg-gradient-to-br from-[#F9FAFB] via-white to-[#F0F4F8]">
        <div className="text-center">
          <div className="text-6xl mb-4">😞</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Product Not Found</h2>
          <p className="text-gray-600 mb-6">The product you're looking for doesn't exist or has been removed.</p>
          <button
            onClick={() => navigate("/products")}
            className="bg-[#B0BC27] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#9ca824] transition-colors duration-300"
          >
            Browse All Products
          </button>
        </div>
      </div>
    );
  }

  const whatsappNumber = "919878165432";
  const message = `Hello, I'm interested in learning more about ${product.name}`;
  const whatsappLink = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
  const emailLink = `mailto:thermopackers@gmail.com?subject=Product Enquiry: ${encodeURIComponent(product.name)}&body=I am interested in learning more about ${product.name}.`;
  const callLink = `tel:+919878165432`;

  const handleThumbnailClick = (media) => {
    setSelectedMedia(media);
    setImageLoading(true);
  };

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  const handleImageError = () => {
    setImageLoading(false);
  };

  // Filter out empty product properties
  const productProperties = Object.entries(product).filter(([key, value]) => {
    const excludedKeys = ['_id', 'name', 'description', 'price', 'images', 'videos', 'category', 'createdAt', 'updatedAt', '__v'];
    return !excludedKeys.includes(key) && 
           value !== null && 
           value !== undefined && 
           value !== '' && 
           !Array.isArray(value) && 
           typeof value !== 'object';
  });

  // Group properties into categories for better organization
  const propertyGroups = {
    basic: productProperties.filter(([key]) => 
      ['brand', 'color', 'material', 'weight', 'size', 'dimensions'].includes(key)
    ),
    technical: productProperties.filter(([key]) => 
      ['density', 'thickness', 'tolerance', 'grade', 'temperature', 'capacity'].includes(key)
    ),
    packaging: productProperties.filter(([key]) => 
      ['packType', 'packSize', 'packaging', 'piecesPerBundle', 'quantityPerPack'].includes(key)
    ),
    other: productProperties.filter(([key]) => 
      !['brand', 'color', 'material', 'weight', 'size', 'dimensions', 'density', 'thickness', 'tolerance', 'grade', 'temperature', 'capacity', 'packType', 'packSize', 'packaging', 'piecesPerBundle', 'quantityPerPack'].includes(key)
    )
  };

  // FIXED: Simplified animations to prevent invisibility
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
    hidden: { opacity: 0, y: 10 },
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
        <title>{product.name} | Thermo Packers - Premium Packaging Solutions</title>
        <meta
          name="description"
          content={`${product.description || `Discover ${product.name} - high-quality packaging solution from Thermo Packers. Get competitive pricing and expert support.`}`}
        />
        <meta name="keywords" content={`${product.name}, thermocol packaging, EPS products, ${product.category}, packaging solutions`} />
        <link rel="canonical" href={`https://www.thermopackers.com/product/${slugify(name)}`} />
        <meta property="og:title" content={`${product.name} | Thermo Packers`} />
        <meta property="og:description" content={product.description || `Premium ${product.name} from Thermo Packers`} />
        <meta property="og:url" content={`https://www.thermopackers.com/product/${slugify(name)}`} />
        {selectedMedia && <meta property="og:image" content={selectedMedia} />}
        <meta property="og:type" content="product" />
      </Helmet>

      <FloatingWhatsApp />

      {/* FIXED: Removed complex GSAP animations and simplified Framer Motion */}
      <motion.section
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="min-h-screen mt-[10vh] bg-gradient-to-br from-[#F9FAFB] via-white to-[#F0F4F8] px-4 xs:px-6 sm:px-8 py-8 sm:py-12"
      >
        <div className="max-w-7xl mx-auto">
          {/* Breadcrumb and Back Button */}
          <motion.div 
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8"
            variants={itemVariants}
          >
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-4 sm:mb-0">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors duration-300 group"
              >
                <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                Back
              </button>
              <span className="mx-2">•</span>
              <button
                onClick={() => navigate("/products")}
                className="hover:text-[#B0BC27] transition-colors duration-300"
              >
                Products
              </button>
              {product.category && (
                <>
                  <span className="mx-2">•</span>
                  <button
                    onClick={() => navigate(`/products/${slugify(product.category)}`)}
                    className="hover:text-[#B0BC27] transition-colors duration-300 capitalize"
                  >
                    {product.category}
                  </button>
                </>
              )}
              <span className="mx-2">•</span>
              <span className="text-gray-800 font-medium truncate">{product.name}</span>
            </div>

       
          </motion.div>

          {/* Main Product Grid - FIXED: Removed complex animations */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 xl:gap-16">
            {/* Image/Media Section */}
            <motion.div 
              className="space-y-4"
              variants={itemVariants}
            >
              {/* Main Media Display */}
              <div className="bg-white rounded-3xl shadow-2xl p-4 sm:p-6 border border-gray-200">
                <div className="relative overflow-hidden rounded-2xl">
                  {imageLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
                      <div className="w-8 h-8 border-2 border-[#B0BC27] border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                  
                  {selectedMedia && typeof selectedMedia === "string" && 
                   !selectedMedia.includes(".mp4") && !selectedMedia.includes(".mov") ? (
                    <img
                      src={selectedMedia}
                      alt={product.name}
                      className="w-full h-auto max-h-[500px] object-contain transition duration-300"
                      onLoad={handleImageLoad}
                      onError={handleImageError}
                    />
                  ) : (
                    <video
                      controls
                      src={selectedMedia}
                      className="w-full h-auto max-h-[500px] object-contain rounded-2xl transition duration-300"
                      onLoadedData={handleImageLoad}
                      onError={handleImageError}
                    />
                  )}
                </div>
              </div>

              {/* Thumbnails Gallery */}
              {(product.images?.length > 0 || product.videos?.length > 0) && (
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {product.images?.map((img, idx) => (
                    <button
                      key={`img-${idx}`}
                      onClick={() => handleThumbnailClick(img)}
                      className="flex-shrink-0"
                    >
                      <img
                        src={img}
                        alt={`${product.name} view ${idx + 1}`}
                        className={`h-20 w-20 sm:h-24 sm:w-24 object-cover rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                          img === selectedMedia
                            ? "border-[#B0BC27] ring-2 ring-[#B0BC27]/20"
                            : "border-gray-300 hover:border-gray-400"
                        }`}
                      />
                    </button>
                  ))}

                  {product.videos?.map((video, idx) => (
                    <button
                      key={`video-${idx}`}
                      onClick={() => handleThumbnailClick(video)}
                      className="flex-shrink-0"
                    >
                      <div
                        className={`relative h-20 w-20 sm:h-24 sm:w-24 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                          video === selectedMedia
                            ? "border-[#B0BC27] ring-2 ring-[#B0BC27]/20"
                            : "border-gray-300 hover:border-gray-400"
                        }`}
                      >
                        <video
                          src={video}
                          className="h-full w-full object-cover rounded-xl"
                          muted
                          loop
                          preload="metadata"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-xl">
                          <div className="w-8 h-8 bg-white/90 rounded-full flex items-center justify-center">
                            <div className="w-0 h-0 border-l-[6px] border-l-[#B0BC27] border-y-[4px] border-y-transparent ml-1"></div>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Product Information */}
            <motion.div 
              className="space-y-6"
              variants={itemVariants}
            >
              <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 border border-gray-200">
                {/* Product Header */}
                <div className="mb-6">
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-800 mb-3 leading-tight">
                    {product.name}
                  </h1>
                  
                  {/* Category and Rating */}
                  <div className="flex items-center gap-4 mb-4">
                    {product.category && (
                      <span className="bg-[#B0BC27]/10 text-[#B0BC27] px-3 py-1 rounded-full text-sm font-medium capitalize">
                        {product.category}
                      </span>
                    )}
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className="w-4 h-4 fill-yellow-400 text-yellow-400"
                        />
                      ))}
                      <span className="text-sm text-gray-600 ml-1">(4.8)</span>
                    </div>
                  </div>

                  {/* Price */}
                  {product.price && (
                    <div className="mb-6">
                      <p className="text-3xl sm:text-4xl font-bold text-[#B0BC27]">
                        {product.price}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">Excluding GST</p>
                    </div>
                  )}
                </div>

                {/* Description */}
                {product.description && (
                  <div className="mb-6">
                    <p className="text-gray-600 text-lg leading-relaxed">
                      {product.description}
                    </p>
                  </div>
                )}

                {/* Key Features */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl">
                    <Truck className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-medium text-gray-700">Fast Delivery</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl">
                    <Shield className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-medium text-gray-700">Quality Assured</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl">
                    <Clock className="w-5 h-5 text-amber-600" />
                    <span className="text-sm font-medium text-gray-700">Fast Support</span>
                  </div>
                </div>

                {/* Quick Specifications */}
                {propertyGroups.basic.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Specs</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {propertyGroups.basic.slice(0, 4).map(([key, value]) => (
                        <div key={key} className="flex justify-between py-2 border-b border-gray-100">
                          <span className="text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                          <span className="font-medium text-gray-800">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* CTA Buttons */}
                <div className="bg-gradient-to-r from-[#B0BC27] to-[#9ca824] rounded-2xl p-6 mb-6">
                  <p className="text-white text-lg font-semibold mb-4 text-center">
                    Interested in this product?
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <a
                      href={whatsappLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-white text-green-600 font-semibold py-3 px-4 rounded-xl text-center transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2"
                    >
                      <MessageCircle size={20} />
                      WhatsApp
                    </a>
                    <a
                      href={emailLink}
                      className="bg-white text-blue-600 font-semibold py-3 px-4 rounded-xl text-center transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2"
                    >
                      <Mail size={20} />
                      Email
                    </a>
                    <a
                      href={callLink}
                      className="bg-white text-amber-600 font-semibold py-3 px-4 rounded-xl text-center transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2"
                    >
                      <Phone size={20} />
                      Call Now
                    </a>
                  </div>
                </div>

                {/* Additional Info Tabs */}
                <div>
                  <div className="border-b border-gray-200 mb-6">
                    <nav className="flex space-x-8">
                      {['description', 'specifications', 'features'].map((tab) => (
                        <button
                          key={tab}
                          onClick={() => setActiveTab(tab)}
                          className={`py-2 px-1 border-b-2 font-medium text-sm capitalize transition-colors duration-300 ${
                            activeTab === tab
                              ? 'border-[#B0BC27] text-[#B0BC27]'
                              : 'border-transparent text-gray-500 hover:text-gray-700'
                          }`}
                        >
                          {tab}
                        </button>
                      ))}
                    </nav>
                  </div>

                  <div className="min-h-[200px]">
                    {activeTab === 'description' && product.description && (
                      <div>
                        <p className="text-gray-600 leading-relaxed">{product.description}</p>
                      </div>
                    )}

                   {activeTab === 'specifications' && (
  <div className="space-y-4">
    {Object.entries(propertyGroups).map(([group, properties]) => {
      // Filter out image-related properties
      const filteredProperties = properties.filter(([key, value]) => {
        const imageKeys = ['image', 'images', 'photo', 'photos', 'picture', 'pictures', 'img', 'thumbnail', 'thumbnails'];
        const isImageKey = imageKeys.includes(key.toLowerCase());
        const isImageUrl = typeof value === 'string' && (
          value.includes('.jpg') || 
          value.includes('.jpeg') || 
          value.includes('.png') || 
          value.includes('.gif') || 
          value.includes('.webp') ||
          value.includes('.avif') ||
          value.includes('.svg') ||
          value.includes('/images/') ||
          value.includes('/img/') ||
          value.startsWith('http') && (
            value.includes('cloudinary') ||
            value.includes('image') ||
            value.includes('photo')
          )
        );
        
        return !isImageKey && !isImageUrl;
      });

      return (
        filteredProperties.length > 0 && (
          <div key={group}>
            <h4 className="font-semibold text-gray-800 mb-2 capitalize">{group} Specifications</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {filteredProperties.map(([key, value]) => (
                <div key={key} className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                  <span className="font-medium text-gray-800">{value}</span>
                </div>
              ))}
            </div>
          </div>
        )
      );
    })}
  </div>
)}
                    {activeTab === 'features' && product.features && (
                      <div>
                        <ul className="space-y-2">
                          {product.features.map((feature, index) => (
                            <li key={index} className="flex items-start gap-3">
                              <div className="w-2 h-2 bg-[#B0BC27] rounded-full mt-2 flex-shrink-0"></div>
                              <span className="text-gray-600">{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.section>
    </>
  );
}