import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import { slugifyProduct } from "../utils/slugify";

gsap.registerPlugin(ScrollTrigger);

export default function ProductCard({ product }) {
  const cardRef = useRef(null);

  useEffect(() => {
    const el = cardRef.current;

    const anim = gsap.fromTo(
      el,
      {
        opacity: 0,
        y: 60,
        scale: 0.98,
      },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.3,
        ease: "power4.in",
        scrollTrigger: {
          trigger: el,
          start: "top 85%",
          end: "bottom 10%",
          toggleActions: "play reverse play reverse",
        },
      }
    );

    return () => {
      anim.scrollTrigger?.kill();
    };
  }, []);

  return (
    <Link
      to={`/product/${slugifyProduct(product.name)}`}
      ref={cardRef}
      className="group bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transform transition-transform duration-300 hover:scale-[1.03] flex flex-col"
    >
      {/* Fixed size container for image */}
      <div style={{ width: "100%", height: 300, overflow: "hidden" }}>
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          style={{ objectFit: "cover", width: "100%", height: "100%" }}
          className="group-hover:scale-105 transition-transform duration-300"
          onError={() => console.error("Image failed to load:", product.image)}
        />
      </div>

      <div className="p-4 flex flex-col justify-between flex-grow">
        <h3 className="text-xl font-bold text-gray-800 group-hover:text-[#B0BC27] transition-colors mb-1">
          {product.name}
        </h3>
        <p className="text-md font-medium text-gray-500 mb-1">{product.price}</p>
      </div>
    </Link>
  );
}
