import React, { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { categories } from "../data/products.js";
import { ChevronLeft, ChevronRight } from "lucide-react";

const CLOUDINARY_CLOUD_NAME = "dcr8k5amk";

// Component for optimized Cloudinary image loading
const CloudinaryImage = ({ publicId, alt = "", className = "" }) => {
  const url = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/f_auto,q_auto,w_400,c_fill/${publicId}.jpg`;

  return (
    <img
      src={url}
      alt={alt}
      className={className}
      loading="lazy"
      decoding="async"
      sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 30vw"
    />
  );
};

// Function to normalize known compound terms like "EPS Thermocol"
const normalizeCompoundWords = (str) => {
  return str
    .replace(/eps[\s\/-]*thermocol/gi, "epsthermocol")
    .replace(/[\/\s]+/g, "-")
    .toLowerCase();
};

const Catalog = () => {
  const scrollRef = useRef();
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const scroll = (direction) => {
    const { current } = scrollRef;
    if (current) {
      const cardWidth = 320; // Approximate card width
      const scrollAmount = direction === "left" ? -cardWidth : cardWidth;
      current.scrollBy({ left: scrollAmount, behavior: "smooth" });
      
      // Update arrow visibility after scroll
      setTimeout(() => {
        const { scrollLeft, scrollWidth, clientWidth } = current;
        setShowLeftArrow(scrollLeft > 0);
        setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
      }, 300);
    }
  };

  const handleScroll = () => {
    const { current } = scrollRef;
    if (current) {
      const { scrollLeft, scrollWidth, clientWidth } = current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  return (
    <section
      id="catalog"
      className="relative py-16 xs:py-20 sm:py-24 px-4 xs:px-6 bg-gradient-to-br from-[#F4F7FA] via-white to-[#EAF1F8] animate-fade-in"
    >
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <h2 className="drop-shadow-md text-3xl xs:text-4xl sm:text-5xl font-extrabold text-center text-gray-800 mb-8 xs:mb-12 sm:mb-16 tracking-tight animate-on-scroll">
          Explore Our <span className="text-[#B0BC27]">Packaging Solutions</span>
        </h2>

        {/* Scroll Buttons - Desktop */}
        {showLeftArrow && (
          <button
            onClick={() => scroll("left")}
            className="hidden lg:flex absolute left-4 xl:left-6 top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur-md shadow-lg rounded-full p-3 hover:bg-white transition-all duration-300 transform hover:scale-110 active:scale-95"
            aria-label="Scroll left"
          >
            <ChevronLeft size={28} />
          </button>
        )}

        {showRightArrow && (
          <button
            onClick={() => scroll("right")}
            className="hidden lg:flex absolute right-4 xl:right-6 top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur-md shadow-lg rounded-full p-3 hover:bg-white transition-all duration-300 transform hover:scale-110 active:scale-95"
            aria-label="Scroll right"
          >
            <ChevronRight size={28} />
          </button>
        )}

        {/* Scrollable Product Row */}
        <div
          ref={scrollRef}
          className="overflow-x-auto scrollbar-thin scrollbar-thumb-[#B0BC27] scrollbar-track-gray-100 scroll-smooth px-2 xs:px-4 py-4 xs:py-6"
          onScroll={handleScroll}
        >
          <div className="flex space-x-6 xs:space-x-8 w-max mx-auto">
            {Object.entries(categories).map(([key, { label, image }], i) => {
              const safeSlug = normalizeCompoundWords(key);

              return (
                <Link
                  to={`/products/${safeSlug}`}
                  key={i}
                  className="flex-shrink-0 w-[280px] xs:w-80 animate-on-scroll"
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  <div className="bg-white rounded-3xl shadow-lg hover:shadow-2xl border border-gray-200 overflow-hidden transform transition duration-500 hover:scale-105 h-full flex flex-col group">
                    {/* Image Container */}
                    <div className="w-full h-48 xs:h-52 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 group-hover:from-gray-100 group-hover:to-gray-200 transition-all duration-300">
                      {image ? (
                        <CloudinaryImage
                          publicId={image}
                          alt={label}
                          className="w-full h-full object-contain p-4 transform group-hover:scale-110 transition-transform duration-300"
                        />
                      ) : (
                        <span className="text-gray-400 text-sm">Image Coming Soon</span>
                      )}
                    </div>
                    
                    {/* Content */}
                    <div className="p-4 xs:p-6 text-center flex-1 flex flex-col justify-center">
                      <h3 className="text-lg xs:text-xl font-semibold text-gray-800 capitalize mb-2 line-clamp-2">
                        {key}
                      </h3>
                      <p className="text-[#B0BC27] font-medium text-sm xs:text-base line-clamp-2">
                        {label}
                      </p>
                      
                      {/* CTA Button */}
                      <div className="mt-4 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                        <span className="inline-flex items-center gap-2 text-sm font-medium text-gray-600">
                          View Products
                          <span className="text-[#B0BC27]">→</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Mobile Scroll Indicators */}
        <div className="lg:hidden flex justify-center mt-6 space-x-2">
          <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
          <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
          <div className="w-2 h-2 bg-[#B0BC27] rounded-full"></div>
          <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
        </div>

        {/* View All Button */}
        <div className="text-center mt-8 xs:mt-12 animate-on-scroll">
          <Link
            to="/products"
            className="inline-flex items-center gap-3 bg-gray-800 text-white px-8 xs:px-10 py-3 xs:py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl hover:bg-gray-900 transition-all duration-300 transform hover:scale-105"
          >
            <span>View All Categories</span>
            <span className="text-lg">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Catalog;