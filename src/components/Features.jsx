import React from "react";
import { Link } from "react-router-dom";

const CLOUDINARY_CLOUD_NAME = "dcr8k5amk";

const features = [
  {
    text: "High-quality EPS and pulp materials",
    image: "a_yrmeqk",
    slug: "eps-and-pulp-materials",
    icon: "🏭",
  },
  {
    text: "Fast & reliable delivery",
    image: "b_opz1vm",
    slug: "fast-delivery",
    icon: "🚚",
  },
  {
    text: "Custom packaging solutions",
    image: "c_imjpec",
    slug: "custom-packaging",
    icon: "🎨",
  },
  {
    text: "Eco-friendly & sustainable packaging",
    image: "dd_ow1ny6",
    slug: "eco-packaging",
    icon: "🌱",
  },
];

// Cloudinary Image component for optimized images
const CloudinaryImage = ({ publicId, alt }) => {
  const url = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/f_auto,q_auto,w_600,c_fill/${publicId}.jpg`;
  
  return (
    <img
      src={url}
      alt={alt}
      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 rounded-xl"
      loading="lazy"
      decoding="async"
      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
    />
  );
};

const Features = () => {
  return (
    <section className="py-16 xs:py-20 sm:py-24 px-4 xs:px-6 bg-gradient-to-br from-[#e8f0fe] to-white text-center relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 -z-10">
        <div className="w-[80vw] h-[80vw] xs:w-[60vw] xs:h-[60vw] bg-[#B0BC27]/10 rounded-full blur-3xl animate-pulse-slow absolute -top-20 -left-20"></div>
        <div className="w-[60vw] h-[60vw] xs:w-[40vw] xs:h-[40vw] bg-[#B0BC27]/15 rounded-full blur-2xl animate-float absolute top-40 -right-10"></div>
        <div className="w-[40vw] h-[40vw] xs:w-[30vw] xs:h-[30vw] bg-[#B0BC27]/10 rounded-full blur-xl animate-pulse-slow absolute bottom-10 left-1/4"></div>
      </div>

      {/* Section Header */}
      <div className="max-w-7xl mx-auto">
        <h2 className="drop-shadow-md text-3xl xs:text-4xl sm:text-5xl font-extrabold mb-8 xs:mb-12 sm:mb-16 text-gray-800 animate-on-scroll">
          Why Choose <span className="text-[#B0BC27]">Thermo Packers</span>?
        </h2>

        {/* Features Grid */}
        <ul className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-6 xs:gap-8 max-w-7xl mx-auto">
          {features.map((item, idx) => (
            <Link to={`/features/${item.slug}`} key={idx} className="block h-full">
              <li
                className="bg-white/90 backdrop-blur-md border border-gray-200 rounded-3xl shadow-lg hover:shadow-2xl p-4 xs:p-5 flex flex-col items-center justify-between transition-all duration-500 hover:scale-105 cursor-pointer h-full min-h-[280px] xs:min-h-[320px] animate-on-scroll group"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                {/* Icon */}
                <div className="text-4xl xs:text-5xl mb-3 xs:mb-4 transform group-hover:scale-110 transition-transform duration-300">
                  {item.icon}
                </div>

                {/* Image Container */}
                <div className="flex-1 w-full relative overflow-hidden rounded-xl mb-3 xs:mb-4 group">
                  <CloudinaryImage publicId={item.image} alt={item.text} />
                  <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>
                </div>

                {/* Text Content */}
                <p className="text-base xs:text-lg font-semibold text-gray-800 leading-tight text-center px-2">
                  {item.text}
                </p>

                {/* Hover Arrow */}
                <div className="mt-3 xs:mt-4 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                  <span className="text-[#B0BC27] font-bold">→</span>
                </div>
              </li>
            </Link>
          ))}
        </ul>

        {/* CTA Button */}
        <div className="mt-12 xs:mt-16 animate-on-scroll">
          <Link
            to="/contact"
            className="inline-flex items-center gap-3 bg-[#B0BC27] text-white px-8 xs:px-10 py-3 xs:py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl hover:bg-[#9ca824] transition-all duration-300 transform hover:scale-105"
          >
            <span>Get Started Today</span>
            <span className="text-lg">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Features;