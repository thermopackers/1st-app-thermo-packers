import { useRef } from "react";
import { Link } from "react-router-dom";
import { categories } from "../../../backend/data/products.js";
import { ChevronLeft, ChevronRight } from "lucide-react";

// ✅ Function to normalize known compound terms like "EPS Thermocol"
const normalizeCompoundWords = (str) => {
  return str
    .replace(/eps[\s\/-]*thermocol/gi, "epsthermocol") // combine EPS + Thermocol
    .replace(/[\/\s]+/g, "-") // convert spaces/slashes to hyphens
    .toLowerCase();
};

const Catalog = () => {
  const scrollRef = useRef();

  const scroll = (direction) => {
    const { current } = scrollRef;
    if (current) {
      const scrollAmount = direction === "left" ? -300 : 300;
      current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  return (
    <section
      id="catalog"
      className="relative py-24 px-6 bg-gradient-to-br from-[#F4F7FA] via-white to-[#EAF1F8] animate-fade-in"
    >
      <h2 className="drop-shadow-md text-4xl sm:text-5xl font-extrabold text-center text-gray-800 mb-16 tracking-tight animate-slide-up">
        Explore Our <span className="text-[#B0BC27]">Packaging Solutions</span>
      </h2>

      {/* Left Scroll Button */}
      <button
        onClick={() => scroll("left")}
        className="hidden cursor-pointer lg:flex absolute left-6 top-1/2 -translate-y-1/2 z-10 bg-white/80 backdrop-blur-md shadow-lg rounded-full p-3 hover:bg-white transition-transform transform hover:scale-110"
      >
        <ChevronLeft size={28} />
      </button>

      {/* Scrollable Product Row */}
      <div
        ref={scrollRef}
        className="overflow-x-auto scrollbar-hide scroll-smooth px-4 py-[6vh]"
      >
        <div className="flex space-x-8 w-max">
          {Object.entries(categories).map(([key, { label, image }], i) => {
            const safeSlug = normalizeCompoundWords(key);

            return (
              <Link
                to={`/products/${safeSlug}`}
                key={i}
                className="flex-shrink-0 w-80 animate-fade-in-up"
              >
                <div className="bg-white rounded-3xl shadow-lg hover:shadow-2xl border border-gray-200 overflow-hidden transform transition duration-500 hover:scale-105">
                  <div className="w-full h-52 flex items-center justify-center bg-[#f1f5f9]">
                    {image ? (
                      <img
                        src={image}
                        alt={label}
                        className="object-contain h-full w-full scale-100 hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <span className="text-gray-400">Image Placeholder</span>
                    )}
                  </div>
                  <div className="p-6 text-center">
                    <h3 className="text-xl font-semibold text-gray-800 capitalize mb-1">
                      {key}
                    </h3>
                    <p className="text-[#B0BC27] font-medium text-sm">{label}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Right Scroll Button */}
      <button
        onClick={() => scroll("right")}
        className="hidden cursor-pointer lg:flex absolute right-6 top-1/2 -translate-y-1/2 z-10 bg-white/80 backdrop-blur-md shadow-lg rounded-full p-3 hover:bg-white transition-transform transform hover:scale-110"
      >
        <ChevronRight size={28} />
      </button>
    </section>
  );
};

export default Catalog;
