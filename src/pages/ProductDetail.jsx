import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import FloatingWhatsApp from "../components/FloatingWhatsapp";
import { Helmet } from "react-helmet";
import { Mail, MessageCircle, Phone } from "lucide-react";
import gsap from "gsap";
import axiosInstance from "../axiosInstance";

const slugify = (text) =>
  text?.toLowerCase().replace(/\//g, "-").replace(/\s+/g, "-").replace(/[^\w-]+/g, "");

export default function ProductDetail() {
  const { name } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [loading, setLoading] = useState(true);

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
    if (loading || !product) return;

    window.scrollTo({ top: 0, behavior: "smooth" });

    gsap.from(".product-main", {
      opacity: 0,
      y: 30,
      duration: 1,
      ease: "power3.out",
    });

    if (selectedMedia) {
      gsap.fromTo(
        ".main-product-image",
        {
          opacity: 0,
          scale: 0.95,
        },
        {
          opacity: 1,
          scale: 1,
          duration: 0.3,
          ease: "power2.out",
        }
      );
    }

    gsap.from(".product-info > *", {
      opacity: 0,
      y: 20,
      duration: 0.8,
      ease: "power2.out",
      stagger: 0.2,
      delay: 0.4,
    });

    gsap.from(".thumbnail-image", {
      opacity: 0,
      y: 10,
      stagger: 0.1,
      duration: 0.6,
      delay: 0.8,
      ease: "power1.out",
    });
  }, [product, selectedMedia, loading]);

  if (loading) {
    return <div className="p-6 text-center text-gray-600">Loading...</div>;
  }

  if (!product) {
    return (
      <div className="p-6 text-red-600 text-center text-lg">
        Product not found.
      </div>
    );
  }

  const whatsappNumber = "919878165432";
  const message = `Hello, I'm interested in learning more about ${product.name}`;
  const whatsappLink = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
    message
  )}`;
  const emailLink = `mailto:thermopackers@gmail.com?subject=Product Enquiry: ${encodeURIComponent(
    product.name
  )}&body=I am interested in learning more about ${product.name}.`;
  const callLink = `tel:+919878165432`;

  const handleThumbnailClick = (e, media) => {
    setSelectedMedia(media);

    gsap.fromTo(
      e.target,
      { scale: 1 },
      {
        scale: 1.2,
        duration: 0.2,
        ease: "power1.out",
        repeat: 1,
        yoyo: true,
      }
    );
  };

  return (
    <>
      <Helmet>
        <title>{product.name} | Thermo Packers</title>
      </Helmet>

      <FloatingWhatsApp />

      <section className="mt-[10vh] px-6 py-10 max-w-7xl mx-auto min-h-screen">
        <div className="md:hidden mb-6">
          <button
            onClick={() => navigate(-1)}
            aria-label="Go back"
            className="flex items-center text-sm font-medium text-gray-600 hover:text-gray-800 transition"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-5 h-5 mr-2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 19.5L8.25 12l7.5-7.5"
              />
            </svg>
            Back
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
          {/* IMAGE/VIDEO VIEWER */}
          <div className="w-full product-main">
            <div className="overflow-hidden rounded-3xl shadow-lg mb-4">
              {selectedMedia &&
              typeof selectedMedia === "string" &&
              !selectedMedia.includes(".mp4") &&
              !selectedMedia.includes(".mov") ? (
                <img
                  src={selectedMedia}
                  alt={product.name || "Product Image"}
                  className="w-full h-auto max-h-[32rem] object-contain bg-transparent transition duration-300 main-product-image"
                />
              ) : (
                <video
                  controls
                  src={selectedMedia}
                  className="w-full h-auto max-h-[32rem] object-contain rounded-3xl transition duration-300 main-product-image"
                />
              )}
            </div>

            {/* THUMBNAILS */}
            {(product.images?.length > 0 || product.videos?.length > 0) && (
              <div className="flex gap-3 flex-wrap">
                {product.images?.map((img, idx) => (
                  <img
                    key={`img-${idx}`}
                    src={img}
                    alt={`Thumbnail ${idx + 1}`}
                    className={`thumbnail-image h-20 w-20 object-cover rounded-xl border cursor-pointer transition-transform duration-300 ease-in-out transform hover:scale-105 ${
                      img === selectedMedia
                        ? "ring-2 ring-[#B0BC27]"
                        : "border-gray-300"
                    }`}
                    onClick={(e) => handleThumbnailClick(e, img)} // Set selected media to image
                  />
                ))}

                {product.videos?.map((video, idx) => (
                  <video
                    key={`video-${idx}`}
                    src={video}
                    className={`thumbnail-image h-20 w-20 object-cover rounded-xl border cursor-pointer transition-transform duration-300 ease-in-out transform hover:scale-105 ${
                      video === selectedMedia
                        ? "ring-2 ring-[#B0BC27]"
                        : "border-gray-300"
                    }`}
                    onClick={(e) => handleThumbnailClick(e, video)} // Set selected media to video
                    muted
                    loop
                    preload="metadata"
                  />
                ))}
              </div>
            )}
          </div>

          {/* PRODUCT INFO */}
          <div className="flex flex-col justify-center space-y-6 product-info">
            <h1 className="text-4xl drop-shadow-md font-extrabold text-gray-800 tracking-tight">
              {product.name}
            </h1>
            <p className="text-gray-600 text-lg leading-relaxed">
              {product.description}
            </p>
            <p className="text-2xl font-semibold text-[#B0BC27]">
              {product.price}
            </p>
            {/* Product Specs */}
            <h2 className="text-xl font-bold text-gray-700 mb-4">
              Product Details
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 text-gray-600 text-sm">
              {product.minOrderQty && (
                <div>
                  <strong>Minimum Order Quantity:</strong> {product.minOrderQty}
                </div>
              )}
              {product.usage && (
                <div>
                  <strong>Usage:</strong> {product.usage}
                </div>
              )}
              {product.weight && (
                <div>
                  <strong>Weight:</strong> {product.weight}
                </div>
              )}
              {product.brand && (
                <div>
                  <strong>Brand:</strong> {product.brand}
                </div>
              )}
              {product.color && (
                <div>
                  <strong>Color:</strong> {product.color}
                </div>
              )}
              {product.density && (
                <div>
                  <strong>Density:</strong> {product.density}
                </div>
              )}
              {product.technique && (
                <div>
                  <strong>Technique:</strong> {product.technique}
                </div>
              )}
              {product.finishing && (
                <div>
                  <strong>Finishing:</strong> {product.finishing}
                </div>
              )}
              {product.feature && (
                <div>
                  <strong>Feature:</strong> {product.feature}
                </div>
              )}
              {product.surfaceFinish && (
                <div>
                  <strong>Surface Finish:</strong> {product.surfaceFinish}
                </div>
              )}
              {product.designType && (
                <div>
                  <strong>Design Type:</strong> {product.designType}
                </div>
              )}
              {product.tolerance && (
                <div>
                  <strong>Tolerance:</strong> {product.tolerance}
                </div>
              )}
              {product.piecesPerBundle && (
                <div>
                  <strong>Pieces Per Bundle:</strong> {product.piecesPerBundle}
                </div>
              )}
              {product.grade && (
                <div>
                  <strong>Grade:</strong> {product.grade}
                </div>
              )}
              {product.shape && (
                <div>
                  <strong>Shape:</strong> {product.shape}
                </div>
              )}
              {product.condition && (
                <div>
                  <strong>Condition:</strong> {product.condition}
                </div>
              )}
              {product.pattern && (
                <div>
                  <strong>Pattern:</strong> {product.pattern}
                </div>
              )}
              {product.material && (
                <div>
                  <strong>Material:</strong> {product.material}
                </div>
              )}
              {product.packType && (
                <div>
                  <strong>Pack Type:</strong> {product.packType}
                </div>
              )}
              {product.sizeDimension && (
                <div>
                  <strong>Size Dimension:</strong> {product.sizeDimension}
                </div>
              )}
              {product.usageApplication && (
                <div>
                  <strong>Usage Application:</strong> {product.usageApplication}
                </div>
              )}
              {product.capacity && (
                <div>
                  <strong>Capacity:</strong> {product.capacity}
                </div>
              )}
              {product.thickness && (
                <div>
                  <strong>Thickness:</strong> {product.thickness}
                </div>
              )}
              {product.origin && (
                <div>
                  <strong>Origin:</strong> {product.origin}
                </div>
              )}
              {product.model && (
                <div>
                  <strong>Model:</strong> {product.model}
                </div>
              )}
              {product.temperature && (
                <div>
                  <strong>Temperature:</strong> {product.temperature}
                </div>
              )}
              {product.dimensions && (
                <div>
                  <strong>Dimensions:</strong> {product.dimensions}
                </div>
              )}
              {product.cover && (
                <div>
                  <strong>Cover:</strong> {product.cover}
                </div>
              )}
              {product.packSize && (
                <div>
                  <strong>Pack Size:</strong> {product.packSize}
                </div>
              )}
              {product.compartment && (
                <div>
                  <strong>Compartment:</strong> {product.compartment}
                </div>
              )}
              {product.depth && (
                <div>
                  <strong>Depth:</strong> {product.depth}
                </div>
              )}
              {product.height && (
                <div>
                  <strong>Height:</strong> {product.height}
                </div>
              )}
              {product.warning && (
                <div>
                  <strong>Warning:</strong> {product.warning}
                </div>
              )}
              {product.diameter && (
                <div>
                  <strong>Diameter:</strong> {product.diameter}
                </div>
              )}
              {product.shelfLife && (
                <div>
                  <strong>Shelf-Life:</strong> {product.shelfLife}
                </div>
              )}
              {product.freezingTemp && (
                <div>
                  <strong>Freezing-Temp:</strong> {product.freezingTemp}
                </div>
              )}
              {product.packagingDetails && (
                <div>
                  <strong>Packaging Details:</strong> {product.packagingDetails}
                </div>
              )}
              {product.itemCode && (
                <div>
                  <strong>Item Code:</strong> {product.itemCode}
                </div>
              )}
              {product.benefits && (
                <div>
                  <strong>Benefits:</strong> {product.benefits}
                </div>
              )}
              {product.plasticType && (
                <div>
                  <strong>Plastic Type:</strong> {product.plasticType}
                </div>
              )}
              {product.deliveryTime && (
                <div>
                  <strong>Delivery Time:</strong> {product.deliveryTime}
                </div>
              )}
              {product.printing && (
                <div>
                  <strong>Printing:</strong> {product.printing}
                </div>
              )}
              {product.quantityPerPack && (
                <div>
                  <strong>Quantity Per Pack:</strong> {product.quantityPerPack}
                </div>
              )}
              {product.productionCapacity && (
                <div>
                  <strong>Production Capacity:</strong>{" "}
                  {product.productionCapacity}
                </div>
              )}
              {product.trademark && (
                <div>
                  <strong>Trade Mark:</strong> {product.trademark}
                </div>
              )}
              {product.packaging && (
                <div>
                  <strong>Packaging:</strong> {product.packaging}
                </div>
              )}
              
              {product.productType && (
                <div>
                  <strong>Product Type:</strong> {product.productType}
                </div>
              )}
              {product.size && (
                <div>
                  {typeof product.size === "object" ? (
                    <>
                      <div>
                        <strong>Outer:</strong> {product.size.outer}
                      </div>
                      <div>
                        <strong>Inner:</strong> {product.size.inner}
                      </div>
                    </>
                  ) : (
                    <div>
                      <strong>Size:</strong> {product.size}
                    </div>
                  )}
                </div>
              )}

              {product.outerDimensions && (
                <div>
                  <div>
                    <strong>Outer:</strong> {product.outerDimensions}
                  </div>
                </div>
              )}

              {product.innerDimensions && (
                <div>
                  <div>
                    <strong>Inner:</strong> {product.innerDimensions}
                  </div>
                </div>
              )}
              {product.packagingSize && (
                <div>
                  <div>
                    <strong>Packaging Size:</strong> {product.packagingSize}
                  </div>
                </div>
              )}
              {product.gradeStandard && (
                <div>
                  <div>
                    <strong>Grade Standard:</strong> {product.gradeStandard}
                  </div>
                </div>
              )}
              {product.piecesPerBundle && (
                <div>
                  <div>
                    <strong>Pieces Per Bundle:</strong>{" "}
                    {product.piecesPerBundle}
                  </div>
                </div>
              )}
              {product.category && (
                <div>
                  <strong>Category:</strong> {product.category}
                </div>
              )}
              {product.gst && (
                <div>
                  <strong>GST:</strong> {product.gst}
                </div>
              )}
              {product.sizes && (
                <div>
                  <strong>Size:</strong> {product.sizes}
                </div>
              )}
              {product.productSize && (
                <div>
                  <strong>Size:</strong> {product.productSize}
                </div>
              )}
              {typeof product.customized !== "undefined" && (
                <div>
                  <strong>Customized:</strong>{" "}
                  {product.customized ? "Yes" : "No"}
                </div>
              )}
              {typeof product.isCustomised !== "undefined" && (
                <div>
                  <strong>Customized:</strong>{" "}
                  {product.isCustomised ? "Yes" : "No"}
                </div>
              )}
              {typeof product.microwaveSafe !== "undefined" && (
                <div>
                  <strong>Microwave Safe:</strong>{" "}
                  {product.microwaveSafe ? "Yes" : "No"}
                </div>
              )}
              {typeof product.isCustomized !== "undefined" && (
                <div>
                  <strong>Customized:</strong>{" "}
                  {product.isCustomized ? "Yes" : "No"}
                </div>
              )}
              {typeof product.ecoFriendly !== "undefined" && (
                <div>
                  <strong>Eco-Friendly:</strong>{" "}
                  {product.ecoFriendly ? "Yes" : "No"}
                </div>
              )}
            </div>
            {product.additionalInfo && (
              <div className="mt-6">
                <h2 className="text-lg font-semibold mb-2">
                  Additional Information:
                </h2>
                <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
                  <li>
                    <strong>Production Capacity:</strong>{" "}
                    {product.additionalInfo.productionCapacity}
                  </li>
                  <li>
                    <strong>Delivery Time:</strong>{" "}
                    {product.additionalInfo.deliveryTime}
                  </li>
                  <li>
                    <strong>Packaging Details:</strong>{" "}
                    {product.additionalInfo.packagingDetails}
                  </li>
                </ul>
              </div>
            )}

            {/* Product Specifications */}
            {product.sizesAvailable && product.sizesAvailable.length > 0 && (
              <div>
                <strong>Sizes Available:</strong>
                <ul className="ml-4 list-disc">
                  {product.sizesAvailable.map((size, index) => (
                    <li key={index}>
                      <strong>{size.id}</strong> — Inner: {size.inner}, Outer:{" "}
                      {size.outer}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {product.availableSizes && product.availableSizes.length > 0 && (
              <div className="mt-4">
                <strong>Available Sizes:</strong>
                <div className="flex flex-wrap gap-2 mt-2">
                  {product.availableSizes.map((size, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-gray-200 rounded-full text-sm font-medium"
                    >
                      {size} ml
                    </span>
                  ))}
                </div>
              </div>
            )}

            {product.specifications && (
              <>
                <h2 className="text-xl font-bold text-gray-700 mb-4">
                  Specifications
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 text-gray-600 text-sm">
                  {Object.entries(product.specifications).map(
                    ([key, value]) => (
                      <div key={key}>
                        <strong className="capitalize">
                          {key.replace(/([A-Z])/g, " $1")}:
                        </strong>{" "}
                        {Array.isArray(value) ? value.join(", ") : value}
                      </div>
                    )
                  )}
                </div>
              </>
            )}

            {/* Packet Details (if present) */}
            {product.packetDetails && (
              <>
                <h2 className="text-xl font-bold text-gray-700 mb-4">
                  Packet Details
                </h2>
                <div className="text-sm text-gray-600 space-y-2">
                  {Object.entries(product.packetDetails).map(
                    ([size, count]) => (
                      <div key={size}>
                        <strong>{size}</strong>: {count}
                      </div>
                    )
                  )}
                </div>
              </>
            )}

            {/* Features (if present) */}
            {product.features && product.features.length > 0 && (
              <>
                <h2 className="text-xl font-bold text-gray-700 mb-4">
                  Features
                </h2>
                <ul className="list-disc list-inside text-gray-600 text-sm space-y-1">
                  {product.features.map((feature, index) => (
                    <li key={index}>{feature}</li>
                  ))}
                </ul>
              </>
            )}

            {/* Available Options (if present) */}
            {product.availableOptions && (
              <>
                <h2 className="text-xl font-bold text-gray-700 mb-4">
                  Available Options
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 text-gray-600 text-sm">
                  {Object.entries(product.availableOptions).map(
                    ([option, value]) => (
                      <div key={option}>
                        <strong className="capitalize">{option}:</strong>{" "}
                        {Array.isArray(value) ? value.join(", ") : value}
                      </div>
                    )
                  )}
                </div>
              </>
            )}

            {/* Enquire Now Section */}
            <div className="bg-gray-100 p-6 rounded-2xl shadow-xl mt-6 border border-gray-300">
              <p className="text-2xl font-black text-gray-800 tracking-wide mb-4 flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-6 h-6 text-[#B0BC27] animate-bounce"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 4v16m0 0l-4-4m4 4l4-4"
                  />
                </svg>
                Enquire Now
              </p>

              <div className="flex flex-col md:flex-row gap-4">
                <a
                  href={emailLink}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg transform hover:scale-105 transition duration-300"
                >
                  <Mail size={20} />
                  Email Us
                </a>
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg transform hover:scale-105 transition duration-300"
                >
                  <MessageCircle size={20} />
                  WhatsApp
                </a>
                <a
                  href={callLink}
                  className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-3 px-6 rounded-xl shadow-lg transform hover:scale-105 transition duration-300 sm:hidden"
                >
                  <Phone size={20} />
                  Call Now
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
