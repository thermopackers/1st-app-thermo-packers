import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useAppContext } from "../context/AppContext";

const images = [
  "/images/tp.gif",
  "/images/icegel.gif",
  "/images/pulpp.gif",
  "/images/s1.gif",
];

const Hero = () => {
  const { menuOpen } = useAppContext();
  const [currentIndex, setCurrentIndex] = useState(1); // Starts from second image

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  // Auto-slide effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <header
      className={`relative mt-[10vh] w-full overflow-hidden animate-fade-in transition-all duration-1000 ${
        menuOpen ? "bg-gray-100" : "bg-white"
      }`}
    >
      {/* Image Wrapper */}
      <div className="relative w-full h-[35vh] sm:h-[50vh] md:h-[90vh]">
        <img
          src={images[currentIndex]}
          alt={`Slide ${currentIndex + 1}`}
          className="w-full h-full object-cover transition duration-700 ease-in-out"
          width="1920"
          height="1080"
          loading="eager" // force eager load for LCP image
        />
      </div>

      {/* Previous Button */}
      <button
        onClick={handlePrev}
        className="absolute cursor-pointer top-1/2 left-4 transform -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white p-2 sm:p-3 rounded-full transition"
        aria-label="Previous Slide"
      >
        <ChevronLeft size={24} />
      </button>

      {/* Next Button */}
      <button
        onClick={handleNext}
        className="absolute cursor-pointer top-1/2 right-4 transform -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white p-2 sm:p-3 rounded-full transition"
        aria-label="Next Slide"
      >
        <ChevronRight size={24} />
      </button>
    </header>
  );
};

export default Hero;
