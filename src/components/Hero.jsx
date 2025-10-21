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
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  // Preload images
  useEffect(() => {
    const loadImage = (src) => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = src;
        img.onload = resolve;
        img.onerror = reject;
      });
    };

    Promise.all(images.map(src => loadImage(src)))
      .then(() => setIsLoading(false))
      .catch(() => setIsLoading(false));
  }, []);

  // Auto-slide effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <header
      className={`relative mt-[8vh] w-full overflow-hidden animate-fade-in transition-all duration-1000 ${
        menuOpen ? "bg-gray-100" : "bg-white"
      }`}
      role="banner"
      aria-label="Hero Slider"
    >
      {/* Loading State */}
      {isLoading && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-white">
          <div className="w-16 h-16 border-4 border-[#B0BC27] border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {/* Image Slider */}
      <div className="relative w-full h-[40vh] xs:h-[45vh] sm:h-[55vh] md:h-[70vh] lg:h-[85vh] xl:h-[90vh]">
        {images.map((image, index) => (
          <img
            key={index}
            src={image}
            alt={`Packaging Solution ${index + 1}`}
            className={`absolute inset-0 w-full h-full object-cover object-center transition-all duration-700 ease-in-out ${
              index === currentIndex ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
            }`}
            width="1920"
            height="1080"
            loading={index === 0 ? "eager" : "lazy"}
            decoding="async"
          />
        ))}
      </div>

      {/* Navigation Buttons */}
      <button
        onClick={handlePrev}
        className="absolute cursor-pointer top-1/2 left-2 xs:left-3 sm:left-4 transform -translate-y-1/2 z-10 bg-black/60 hover:bg-black/80 text-white p-2 xs:p-2.5 sm:p-3 rounded-full transition-all duration-300 hover:scale-110 active:scale-95"
        aria-label="Previous Slide"
      >
        <ChevronLeft className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6" />
      </button>

      <button
        onClick={handleNext}
        className="absolute cursor-pointer top-1/2 right-2 xs:right-3 sm:right-4 transform -translate-y-1/2 z-10 bg-black/60 hover:bg-black/80 text-white p-2 xs:p-2.5 sm:p-3 rounded-full transition-all duration-300 hover:scale-110 active:scale-95"
        aria-label="Next Slide"
      >
        <ChevronRight className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6" />
      </button>

      {/* Slide Indicators */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10 flex space-x-2">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-2 h-2 xs:w-2.5 xs:h-2.5 sm:w-3 sm:h-3 rounded-full transition-all duration-300 ${
              index === currentIndex 
                ? 'bg-white scale-125' 
                : 'bg-white/50 hover:bg-white/80'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Gradient Overlay */}
      <div className="absolute bottom-0 left-0 w-full h-1/3 bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div>
    </header>
  );
};

export default Hero;