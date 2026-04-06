import React, { useState, useRef, useEffect } from "react";
import { gsap } from "gsap";
import {
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaImages,
  FaVideo,
  FaTimes,
  FaExpand,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";

const exhibitions = [
  {
    id: 1,
    name: "BNI BIZ Expo",
    date: "17 December 2023",
    location: "Ludhiana",
    description:
      "A premier business networking exhibition where we showcased our innovative thermocol packaging solutions to industry leaders and entrepreneurs. The event provided an excellent platform to demonstrate our commitment to quality and sustainability in packaging.",
    stats: {
      visitors: "500+",
      leads: "50+",
    },
    images: [
      "/images/ludhiana1 (1).jpg",
      "/images/ludhiana1 (2).jpg",
      "/images/ludhiana1 (3).jpg",
      "/images/ludhiana1 (4).jpg",
      "/images/ludhiana1 (5).jpg",
      "/images/ludhiana1 (6).jpg",
      "/images/ludhiana1 (7).jpg",
      "/images/ludhiana1 (8).jpg",
      "/images/ludhiana1 (9).jpg",
      "/images/ludhiana1 (10).jpg",
    ],
    videos: ["/images/ludhiana1 (1).MP4"],
    thumbnail: "/images/ludhiana1 (5).jpg",
  },
  {
    id: 2,
    name: "IFEX 2024",
    date: "02-04 February 2024",
    location: "Bengaluru",
    description:
      "International Food Expo where we presented our specialized food-grade packaging solutions. Our eco-friendly molded pulp trays and thermocol containers received overwhelming response from food industry professionals.",
    stats: {
      visitors: "1000+",
      leads: "85+",
    },
    images: [
      "/images/benga1 (1).jpg",
      "/images/benga1 (2).jpg",
      "/images/benga1 (3).jpg",
      "/images/benga1 (4).jpg",
      "/images/benga1 (5).jpg",
      "/images/benga1 (6).jpg",
      "/images/benga1 (7).jpg",
      "/images/benga1 (8).jpg",
      "/images/benga1 (9).jpg",
      "/images/benga1 (10).jpg",
      "/images/benga1 (11).jpg",
      "/images/benga1 (12).jpg",
      "/images/benga1 (13).jpg",
      "/images/benga1 (14).jpg",
      "/images/benga1 (15).jpg",
      "/images/benga1 (16).jpg",
      "/images/benga1 (17).jpg",
      "/images/benga1 (18).jpg",
      "/images/benga1 (19).jpg",
      "/images/benga1 (20).jpg",
      "/images/benga1 (21).jpg",
      "/images/benga1 (22).jpg",
      "/images/benga1 (23).jpg",
      "/images/benga1 (24).jpg",
      "/images/benga1 (25).jpg",
      "/images/benga1 (26).jpg",
      "/images/benga1 (27).jpg",
      "/images/benga1 (28).jpg",
      "/images/benga1 (29).jpg",
      "/images/benga1 (30).jpg",
      "/images/benga1 (31).jpg",
      "/images/benga1 (32).jpg",
      "/images/benga1 (33).jpg",
      "/images/benga1 (34).jpg",
      "/images/benga1 (35).jpg",
      "/images/benga1 (36).jpg",
      "/images/benga1 (37).jpg",
      "/images/benga1 (38).jpg",
      "/images/benga1 (39).jpg",
      "/images/benga1 (40).jpg",
      "/images/benga1 (41).jpg",
      "/images/benga1 (42).jpg",
      "/images/benga1 (43).jpg",
      "/images/benga1 (44).jpg",
      "/images/benga1 (45).jpg",
      "/images/benga1 (46).jpg",
      "/images/benga1 (47).jpg",
      "/images/benga1 (48).jpg",
      "/images/benga1 (49).jpg",
      "/images/benga1 (50).jpg",
      "/images/benga1 (51).jpg",
      "/images/benga1 (52).jpg",
      "/images/benga1 (53).jpg",
      "/images/benga1 (54).jpg",
      "/images/benga1 (55).jpg",
      "/images/benga1 (56).jpg",
      "/images/benga1 (57).jpg",
      "/images/benga1 (58).jpg",
      "/images/benga1 (59).jpg",
      "/images/benga1 (60).jpg",
      "/images/benga1 (61).jpg",
      "/images/benga1 (62).jpg",
      "/images/benga1 (63).jpg",
      "/images/benga1 (64).jpg",
      "/images/benga1 (65).jpg",
      "/images/benga1 (66).jpg",
      "/images/benga1 (67).jpg",
      "/images/benga1 (68).jpg",
      "/images/benga1 (69).jpg",
      "/images/benga1 (70).jpg",
      "/images/benga1 (71).jpg",
      "/images/benga1 (72).jpg",
      "/images/benga1 (73).jpg",
      "/images/benga1 (74).jpg",
      "/images/benga1 (75).jpg",
      "/images/benga1 (76).jpg",
      "/images/benga1 (77).jpg",
      "/images/benga1 (78).jpg",
      "/images/benga1 (79).jpg",
      "/images/benga1 (80).jpg",
      "/images/benga1 (81).jpg",
      "/images/benga1 (82).jpg",
      "/images/benga1 (83).jpg",
      "/images/benga1 (84).jpg",
      "/images/benga1 (85).jpg",
      "/images/benga1 (86).jpg",
      "/images/benga1 (87).jpg",
      "/images/benga1 (88).jpg",
      "/images/benga1 (89).jpg",
      "/images/benga1 (90).jpg",
      "/images/benga1 (91).jpg",
      "/images/benga1 (92).jpg",
      "/images/benga1 (93).jpg",
      "/images/benga1 (94).jpg",
      "/images/benga1 (95).jpg",
    ],
    videos: [
        "/images/benga1 (1).mp4",
        "/images/benga1 (2).mp4",
    ],
    thumbnail: "/images/benga1 (85).jpg",
  },
  {
    id: 3,
    name: "Krishi Mach Expo",
    date: "13-15 March 2026",
    location: "Chandigarh",
    description:
      "Agricultural machinery exhibition where we demonstrated our agricultural-grade packaging solutions for farm equipment and produce. Our durable and protective packaging solutions were highly appreciated by farmers and agricultural businesses.",
    stats: {
      visitors: "800+",
      leads: "60+",
    },
    images: [
      "/images/chandigarh1 (1).jpg",
      "/images/chandigarh1 (2).jpg",
      "/images/chandigarh1 (3).jpg",
      "/images/chandigarh1 (4).jpg",
      "/images/chandigarh1 (5).jpg",
      "/images/chandigarh1 (6).jpg",
      "/images/chandigarh1 (7).jpg",
      "/images/chandigarh1 (8).jpg",
    ],
    videos: [
      "/images/chandigarh1 (1).mp4",
      "/images/chandigarh1 (2).mp4",
    ],
    thumbnail: "/images/chandigarh1 (3).jpg",
  },
];

const ExhibitionShowcase = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [expandedExpo, setExpandedExpo] = useState(null);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [mediaType, setMediaType] = useState(null);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [allMediaItems, setAllMediaItems] = useState([]);
  const sectionRef = useRef(null);
  const cardRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".exhibition-card",
        {
          opacity: 0,
          y: 50,
          scale: 0.95,
        },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 85%",
            toggleActions: "play none none reverse",
          },
        },
      );
    }, sectionRef);

    return () => ctx.revert();
  }, [currentIndex]);

  // Listen for custom event to open specific exhibition from footer
useEffect(() => {
  const handleOpenExhibition = (event) => {
    const { index } = event.detail;
    if (index !== undefined && exhibitions[index]) {
      setCurrentIndex(index);
      // Optional: Auto-open the exhibition details modal
      openExhibition(exhibitions[index]);
    }
  };

  window.addEventListener('openExhibition', handleOpenExhibition);
  return () => window.removeEventListener('openExhibition', handleOpenExhibition);
}, []);

  // Handle keyboard navigation for media modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!selectedMedia) return;
      if (e.key === 'ArrowLeft') {
        navigateMedia(-1);
      } else if (e.key === 'ArrowRight') {
        navigateMedia(1);
      } else if (e.key === 'Escape') {
        closeMedia();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedMedia, currentMediaIndex, allMediaItems]);

  const nextExhibition = () => {
    setCurrentIndex((prev) => (prev + 1) % exhibitions.length);
  };

  const prevExhibition = () => {
    setCurrentIndex(
      (prev) => (prev - 1 + exhibitions.length) % exhibitions.length,
    );
  };

  const openExhibition = (expo) => {
    setExpandedExpo(expo);
    document.body.style.overflow = "hidden";
  };

  const closeExhibition = () => {
    setExpandedExpo(null);
    setSelectedMedia(null);
    setMediaType(null);
    document.body.style.overflow = "auto";
  };

  const openMedia = (media, type, mediaItems, clickedIndex) => {
    // Combine all images and videos into one array with type info
    const allItems = [];
    if (expandedExpo) {
      // Add all images with type 'image'
      expandedExpo.images.forEach((img, idx) => {
        allItems.push({ type: 'image', src: img, index: idx });
      });
      // Add all videos with type 'video'
      expandedExpo.videos.forEach((video, idx) => {
        allItems.push({ type: 'video', src: video, index: idx });
      });
    }
    setAllMediaItems(allItems);
    setCurrentMediaIndex(clickedIndex);
    setSelectedMedia(media);
    setMediaType(type);
  };

  const closeMedia = () => {
    setSelectedMedia(null);
    setMediaType(null);
    setAllMediaItems([]);
    setCurrentMediaIndex(0);
  };

  const navigateMedia = (direction) => {
    if (allMediaItems.length === 0) return;
    
    let newIndex = currentMediaIndex + direction;
    if (newIndex < 0) newIndex = allMediaItems.length - 1;
    if (newIndex >= allMediaItems.length) newIndex = 0;
    
    const newMedia = allMediaItems[newIndex];
    setCurrentMediaIndex(newIndex);
    setSelectedMedia(newMedia.src);
    setMediaType(newMedia.type);
  };

  const currentExpo = exhibitions[currentIndex];

  // Get current media item info for display
  const getCurrentMediaInfo = () => {
    if (allMediaItems.length === 0) return null;
    const current = allMediaItems[currentMediaIndex];
    return {
      current: currentMediaIndex + 1,
      total: allMediaItems.length,
      type: current?.type
    };
  };

  const mediaInfo = getCurrentMediaInfo();

  return (
    <>
      <section
        id="exhibitions"
        ref={sectionRef}
        className="relative py-16 md:py-20 lg:py-24 bg-gradient-to-br from-gray-50 via-white to-gray-100 overflow-hidden"
      >
        {/* Background decoration */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_#B0BC27/8,_transparent_70%)]"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-800 mb-4">
              Our Exhibition <span className="text-[#B0BC27]">Showcase</span>
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-[#B0BC27] to-[#8B9A1E] mx-auto rounded-full mb-6"></div>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg">
              Explore our journey through prestigious exhibitions across India
            </p>
          </div>

          {/* Carousel Container */}
          <div className="relative">
            {/* Navigation Buttons */}
            <button
              onClick={prevExhibition}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 lg:-translate-x-6 z-20 bg-white/90 backdrop-blur-sm p-3 rounded-full shadow-lg hover:bg-white hover:scale-110 transition-all duration-300 text-gray-700 hover:text-[#B0BC27]"
              aria-label="Previous exhibition"
            >
              <FaChevronLeft className="w-5 h-5" />
            </button>

            <button
              onClick={nextExhibition}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 lg:translate-x-6 z-20 bg-white/90 backdrop-blur-sm p-3 rounded-full shadow-lg hover:bg-white hover:scale-110 transition-all duration-300 text-gray-700 hover:text-[#B0BC27]"
              aria-label="Next exhibition"
            >
              <FaChevronRight className="w-5 h-5" />
            </button>

            {/* Single Exhibition Card */}
            <div className="flex justify-center">
              <div
                key={currentExpo.id}
                className="exhibition-card group cursor-pointer max-w-2xl w-full mx-auto"
                onClick={() => openExhibition(currentExpo)}
              >
                <div className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                  {/* Thumbnail */}
                  <div className="relative h-80 md:h-96 overflow-hidden">
                    <img
                      src={currentExpo.thumbnail}
                      alt={currentExpo.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <div className="bg-[#B0BC27] text-white px-6 py-3 rounded-full flex items-center gap-2">
                        <FaExpand className="w-5 h-5" />
                        <span className="text-base font-semibold">
                          View Details
                        </span>
                      </div>
                    </div>
                    {/* Badge showing current card number */}
                    <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm">
                      {currentIndex + 1} / {exhibitions.length}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6 md:p-8">
                    <h3 className="text-2xl md:text-3xl font-bold text-gray-800 mb-3 group-hover:text-[#B0BC27] transition-colors">
                      {currentExpo.name}
                    </h3>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-3">
                      <div className="flex items-center gap-2">
                        <FaCalendarAlt className="w-4 h-4 text-[#B0BC27]" />
                        <span>{currentExpo.date}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FaMapMarkerAlt className="w-4 h-4 text-[#B0BC27]" />
                        <span>{currentExpo.location}</span>
                      </div>
                    </div>
                    <p className="text-gray-600 text-base leading-relaxed mb-4">
                      {currentExpo.description}
                    </p>
                    <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                      <div className="flex gap-3">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <FaImages className="w-4 h-4 text-[#B0BC27]" />
                          <span className="font-medium">
                            {currentExpo.images.length} Photos
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <FaVideo className="w-4 h-4 text-[#B0BC27]" />
                          <span className="font-medium">
                            {currentExpo.videos.length} Videos
                          </span>
                        </div>
                      </div>
                      <span className="text-[#B0BC27] text-sm font-semibold flex items-center gap-1">
                        Click to explore →
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Dots Indicator */}
            <div className="flex justify-center gap-2 mt-8">
              {exhibitions.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`transition-all duration-300 rounded-full ${
                    idx === currentIndex
                      ? "w-8 h-2 bg-[#B0BC27]"
                      : "w-2 h-2 bg-gray-300 hover:bg-gray-400"
                  }`}
                  aria-label={`Go to exhibition ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Expanded Modal for Exhibition Details */}
        {expandedExpo && (
          <div
            className="fixed inset-0 z-50 overflow-y-auto"
            style={{ backgroundColor: "rgba(0,0,0,0.85)" }}
          >
            <div className="min-h-screen px-4 py-8 flex items-center justify-center">
              <div className="relative bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
                {/* Close Button */}
                <button
                  onClick={closeExhibition}
                  className="sticky top-4 float-right z-10 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-lg hover:bg-white transition-all duration-300 mr-4 mt-4"
                >
                  <FaTimes className="w-5 h-5 text-gray-700" />
                </button>

                <div className="p-6 md:p-8 pt-0">
                  {/* Exhibition Header */}
                  <div className="mb-8">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-3">
                      {expandedExpo.name}
                    </h2>
                    <div className="flex flex-wrap gap-4 text-gray-600 mb-4">
                      <div className="flex items-center gap-2">
                        <FaCalendarAlt className="w-4 h-4 text-[#B0BC27]" />
                        <span>{expandedExpo.date}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FaMapMarkerAlt className="w-4 h-4 text-[#B0BC27]" />
                        <span>{expandedExpo.location}</span>
                      </div>
                    </div>
                    <p className="text-gray-700 leading-relaxed">
                      {expandedExpo.description}
                    </p>

                    {/* Stats */}
                    <div className="flex gap-6 mt-4 p-4 bg-gray-50 rounded-xl">
                      <div>
                        <p className="text-2xl font-bold text-[#B0BC27]">
                          {expandedExpo.stats.visitors}
                        </p>
                        <p className="text-sm text-gray-600">Visitors</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-[#B0BC27]">
                          {expandedExpo.stats.leads}
                        </p>
                        <p className="text-sm text-gray-600">Business Leads</p>
                      </div>
                    </div>
                  </div>

                  {/* Images Section */}
                  {expandedExpo.images.length > 0 && (
                    <div className="mb-8">
                      <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <FaImages className="w-5 h-5 text-[#B0BC27]" />
                        Event Photos
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {expandedExpo.images.map((img, idx) => (
                          <div
                            key={idx}
                            className="relative aspect-video rounded-lg overflow-hidden cursor-pointer group"
                            onClick={() => {
                              // Calculate index in combined array (images come first)
                              openMedia(img, "image", null, idx);
                            }}
                          >
                            <img
                              src={img}
                              alt={`${expandedExpo.name} ${idx + 1}`}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <FaExpand className="w-6 h-6 text-white" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Videos Section */}
                  {expandedExpo.videos.length > 0 && (
                    <div className="mb-8">
                      <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <FaVideo className="w-5 h-5 text-[#B0BC27]" />
                        Event Videos
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {expandedExpo.videos.map((video, idx) => (
                          <div
                            key={idx}
                            className="relative rounded-lg overflow-hidden cursor-pointer group"
                            onClick={() => {
                              // Videos come after images in combined array
                              const videoIndex = expandedExpo.images.length + idx;
                              openMedia(video, "video", null, videoIndex);
                            }}
                          >
                            <video
                              className="w-full h-48 object-cover"
                              poster={expandedExpo.thumbnail}
                            >
                              <source src={video} type="video/mp4" />
                            </video>
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center group-hover:bg-black/60 transition-all">
                              <div className="w-16 h-16 bg-[#B0BC27] rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                                <div className="w-0 h-0 border-t-8 border-t-transparent border-l-12 border-l-white border-b-8 border-b-transparent ml-1"></div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Media Modal (Image/Video Fullscreen with Navigation) */}
        {selectedMedia && (
          <div
            className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center"
            onClick={closeMedia}
          >
            {/* Close Button */}
            <button
              onClick={closeMedia}
              className="absolute top-4 right-4 z-[61] text-white bg-white/20 p-2 rounded-full hover:bg-white/30 transition-all duration-300 hover:scale-110"
              aria-label="Close"
            >
              <FaTimes className="w-6 h-6" />
            </button>

            {/* Media Counter */}
            {mediaInfo && (
              <div className="absolute top-4 left-4 z-[61] bg-black/50 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm">
                {mediaInfo.type === 'image' ? '📷' : '🎥'} {mediaInfo.current} / {mediaInfo.total}
              </div>
            )}

            {/* Previous Button */}
            {allMediaItems.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigateMedia(-1);
                }}
                className="absolute left-4 z-[61] text-white bg-white/20 p-3 rounded-full hover:bg-white/30 transition-all duration-300 hover:scale-110 backdrop-blur-sm"
                aria-label="Previous"
              >
                <FaChevronLeft className="w-8 h-8" />
              </button>
            )}

            {/* Next Button */}
            {allMediaItems.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigateMedia(1);
                }}
                className="absolute right-4 z-[61] text-white bg-white/20 p-3 rounded-full hover:bg-white/30 transition-all duration-300 hover:scale-110 backdrop-blur-sm"
                aria-label="Next"
              >
                <FaChevronRight className="w-8 h-8" />
              </button>
            )}

            {/* Media Content */}
            <div
              className="max-w-7xl w-full max-h-[90vh] px-4"
              onClick={(e) => e.stopPropagation()}
            >
              {mediaType === "image" ? (
                <img
                  src={selectedMedia}
                  alt="Full size"
                  className="w-full h-auto max-h-[85vh] object-contain rounded-lg"
                />
              ) : (
                <video
                  controls
                  autoPlay
                  className="w-full max-h-[85vh] rounded-lg"
                  key={selectedMedia}
                >
                  <source src={selectedMedia} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              )}
            </div>

            {/* Thumbnail Strip */}
            {allMediaItems.length > 1 && (
              <div className="absolute bottom-4 left-0 right-0 z-[61] flex justify-center gap-2 px-4 overflow-x-auto py-2">
                {allMediaItems.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentMediaIndex(idx);
                      setSelectedMedia(item.src);
                      setMediaType(item.type);
                    }}
                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden transition-all duration-300 ${
                      idx === currentMediaIndex 
                        ? "ring-2 ring-[#B0BC27] scale-110" 
                        : "opacity-60 hover:opacity-100"
                    }`}
                  >
                    {item.type === 'image' ? (
                      <img
                        src={item.src}
                        alt={`Thumbnail ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                        <FaVideo className="w-6 h-6 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      <style jsx>{`
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </>
  );
};

export default ExhibitionShowcase;