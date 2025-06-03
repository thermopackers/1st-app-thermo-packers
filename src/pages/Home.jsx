import React, { useEffect } from "react";
import FloatingWhatsApp from "../components/FloatingWhatsapp";
import { Helmet } from "react-helmet";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import Hero from "../components/Hero";
import Features from "../components/Features";
import Catalog from "../components/Catalog";
import Pricing from "../components/Pricing";
import FAQ from "../components/FAQ";
import CustomerReviews from "../components/CustomerReviews";

gsap.registerPlugin(ScrollTrigger);

const Home = () => {

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
                immediateRender: false, // ✅ add this line only
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
    window.scrollTo({ top: 0, behavior: "smooth" });

    const sections = gsap.utils.toArray(".stacked-section");

    sections.forEach((el) => {
      gsap.fromTo(
        el,
        {
          autoAlpha: 0,
          y: 100,
          scale: 0.95,
        },
        {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          duration: 1.6,
          ease: "power3.out",
          scrollTrigger: {
            trigger: el,
            start: "top 85%",
            toggleActions: "play none none reset",
            once: false,
            scrub: 1,
          },
        }
      );
    });
  }, []);

  return (
    <>
      <Helmet>
        <title>Thermo Packers | Thermocol & EPS Packaging</title>
        <meta
          name="description"
          content="Thermo Packers specializes in thermocol insulation, EPS packaging, molded pulp trays, and eco-friendly products."
        />
        <link rel="canonical" href="https://www.thermopackers.com/" />
        <meta property="og:title" content="Thermo Packers | Thermocol & EPS Packaging" />
        <meta
          property="og:description"
          content="Thermo Packers specializes in thermocol insulation, EPS packaging, molded pulp trays, and eco-friendly products."
        />
        <meta property="og:url" content="https://www.thermopackers.com/" />
        <meta property="og:image" content="https://www.thermopackers.com/images/logo.png" />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>

      <div className="animate-fade-in-fast bg-gradient-to-br from-[#F9FAFB] via-white to-[#F0F4F8] text-gray-800 font-sans">
        <section className="stacked-section">
          <Hero />
        </section>

        <section className="relative z-10 stacked-section">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#B0BC27]/20 via-transparent to-transparent animate-pulse-slow"></div>
          <Features />
        </section>

        <section className="relative z-10 stacked-section">
          <Catalog />
        </section>

        <section className="relative z-10 stacked-section">
          <Pricing />
        </section>

        <section className="relative z-10 stacked-section">
          <FAQ />
        </section>

        <section className="relative z-10 stacked-section">
          <CustomerReviews />
        </section>

        <FloatingWhatsApp />
      </div>
    </>
  );
};

export default Home;
