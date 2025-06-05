import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { categories } from "../../../backend/data/products.js";
import ProductCard from "../components/ProductCard";
import FloatingWhatsApp from "../components/FloatingWhatsapp";
import { Helmet } from "react-helmet";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/all";
import axiosInstance from "../axiosInstance";
import { slugifyProduct } from "../utils/slugify";

gsap.registerPlugin(ScrollTrigger);

// Slug utilities
const slugify = (str) =>
  str.replace(/\//g, "").replace(/\s+/g, "-").toLowerCase();

// const unslugify = (slug) => slug.replace(/-/g, " ");

export default function Products() {
  const { category } = useParams();
  const navigate = useNavigate();
const slugToCategory = (slug) => {
  for (const key of Object.keys(categories)) {
    if (slugify(key) === slug) return key;
  }
  return "";
};

const decodedCat = category ? slugToCategory(category) : "";
const [selectedCat, setSelectedCat] = useState(decodedCat);
  // const decodedCat = category ? unslugify(category) : "";
  // const [selectedCat, setSelectedCat] = useState(decodedCat);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true); // ✅ Loading state
  const limit = 12;
const location = useLocation();

  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

const fetchProducts = async () => {
  setLoading(true);
  try {
    const { data } = await axiosInstance.get("/products/all-products", {
      params: { 
        page, 
        limit, 
        category: selectedCat || undefined,  // send category only if selected
        search: searchTerm || undefined,
      },
    });
    setAllProducts(data.products);
    setTotalPages(data.pagination.totalPages);
  } catch (err) {
    console.error("Failed to fetch products:", err);
  } finally {
    setLoading(false);
  }
};


  useEffect(() => {


    fetchProducts();
  }, []);
useEffect(() => {
  fetchProducts();
}, [page, limit, selectedCat, searchTerm]);


  useEffect(() => {
    requestAnimationFrame(() => {
      const animations = gsap.utils.toArray(".animate-on-scroll").map((el) =>
        gsap.fromTo(
          el,
          { opacity: 0, y: 50 },
          {
            opacity: 1,
            y: 0,
            duration: 1,
            scrollTrigger: {
              trigger: el,
              start: "top 85%",
              toggleActions: "play reverse play reverse",
              markers: false,
              immediateRender: false,
            },
          }
        )
      );

      ScrollTrigger.refresh();
      return () => {
        animations.forEach((anim) => anim.scrollTrigger?.kill());
      };
    });
  }, []);

  useEffect(() => {
    setSelectedCat(decodedCat);
    setSearchTerm("");
    setPage(1);
  }, [decodedCat]);

  


useEffect(() => {
  const timeout = setTimeout(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, 100);
  return () => clearTimeout(timeout);
}, [location.pathname, page]);


  useEffect(() => {
    const handleClickOutside = (e) => {
      if (window.innerWidth < 768 && !e.target.closest(".group")) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  const searchFiltered = searchTerm
    ? allProducts.filter((p) =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : null;

 const paginated = allProducts;  // backend paginated data

  return (
    <>
      <Helmet>
        <title>Our Products | Thermocol, EPS, Moulded Pulp</title>
        <meta
          name="description"
          content="Explore a wide range of eco-friendly and industrial-grade products including thermocol insulation sheets, EPS blocks, molded pulp packaging, seedling trays, and more."
        />
      </Helmet>

      <div className="p-6 mt-[10vh] bg-gradient-to-br from-[#F9FAFB] via-white to-[#F0F4F8] text-gray-800 font-sans">
        <FloatingWhatsApp />

        {/* Back Button (mobile) */}
        <div className="md:hidden mb-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-sm font-medium text-gray-600 hover:text-gray-800 transition"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M15.75 19.5L8.25 12l7.5-7.5"
              />
            </svg>
            Back
          </button>
        </div>

        <h2 className="mb-4 capitalize text-center text-4xl md:text-5xl font-extrabold drop-shadow-md text-[#B0BC27]">
          {selectedCat ? selectedCat : "Our Products"}
        </h2>

        {/* Search Bar */}
        <div className="flex justify-center mb-6">
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-[#B0BC27] transition"
          />
        </div>

        {/* Category Buttons + Dropdowns */}
        <div className="flex flex-wrap justify-center gap-3 mb-8">
          <div className="relative group">
            <button
              onClick={() => {
                setSelectedCat("");
                setPage(1);
                setOpenDropdown(null);
                navigate("/products");
              }}
              className={`px-4 py-2 rounded-full font-medium transition ${
                !selectedCat
                  ? "bg-[#B0BC27] text-white"
                  : "bg-gray-200 hover:bg-gray-300 text-gray-800"
              }`}
            >
              All
            </button>
          </div>

          {Object.keys(categories).map((cat) => {
            const productsInCat = allProducts.filter((p) => p.category === cat);
            const isDropdownOpen = isMobile ? openDropdown === cat : true;

            return (
              <div key={cat} className="relative group">
                <button
                  onClick={() => {
                    if (isMobile) {
                      setOpenDropdown((prev) => (prev === cat ? null : cat));
                    } else {
                      setSelectedCat(cat);
                      setPage(1);
                      navigate(`/products/${slugify(cat)}`);
                    }
                  }}
                  className={`px-4 py-2 capitalize rounded-full font-medium transition ${
                    selectedCat === cat
                      ? "bg-[#B0BC27] text-white"
                      : "bg-gray-200 hover:bg-gray-300 text-gray-800"
                  }`}
                >
                  {cat}
                </button>

                {productsInCat.length > 0 && (
                  <div
                    className={`absolute top-full left-0 z-10 mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-[4px_8px_20px_rgba(0,0,0,0.15)] 
                    transition-all duration-200 ease-in-out
                    ${
                      window.innerWidth >= 768
                        ? "opacity-0 invisible group-hover:opacity-100 group-hover:visible"
                        : openDropdown === cat
                        ? "opacity-100 visible"
                        : "opacity-0 invisible"
                    }`}
                  >
                    <ul className="max-h-64 overflow-y-auto p-2">
                      {productsInCat.map((product, index) => (
                        <li
                          key={index}
                          className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer rounded"
                          onClick={() => {
                            const slug = slugifyProduct(product.name);                            
                            navigate(`/product/${slug}`);
                            setOpenDropdown(null);
                          }}
                        >
                          {product.name}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Loader */}
        {loading ? (
          <div className="flex justify-center items-center min-h-[40vh]">
            <div className="w-16 h-16 border-4 border-[#B0BC27] border-dashed rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            {/* Product Grid */}
            <div className="relative grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {paginated.length > 0 ? (
                paginated.map((product, index) => (
                  <ProductCard key={index} product={product} />
                ))
              ) : (
                <div className="absolute left-0 right-0 text-center text-gray-500 text-lg font-medium mt-10">
                  No products found.
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex justify-center gap-2 flex-wrap">
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => setPage(i + 1)}
                    className={`px-4 py-2 rounded-full font-medium transition ${
                      page === i + 1
                        ? "bg-[#B0BC27] text-white"
                        : "bg-gray-200 hover:bg-gray-300"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
