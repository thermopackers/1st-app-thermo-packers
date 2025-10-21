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

   // Scroll to top when component mounts
  useEffect(() => {
    // Multiple methods to ensure it works
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    
    // Fallback with timeout
    const scrollTimer = setTimeout(() => {
      window.scrollTo(0, 0);
    }, 10);
    
    return () => clearTimeout(scrollTimer);
  }, []);
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });

    // Initialize animations after DOM is ready
    const initAnimations = () => {
      // Stacked sections animation
      const sections = gsap.utils.toArray(".stacked-section");

      sections.forEach((section, index) => {
        gsap.fromTo(
          section,
          {
            autoAlpha: 0,
            y: 80,
            scale: 0.98,
          },
          {
            autoAlpha: 1,
            y: 0,
            scale: 1,
            duration: 1.2,
            ease: "power3.out",
            scrollTrigger: {
              trigger: section,
              start: "top 85%",
              end: "bottom 60%",
              toggleActions: "play none none reverse",
              once: true,
            },
          }
        );
      });

      // Individual element animations
      const animatedElements = gsap.utils.toArray(".animate-on-scroll");
      animatedElements.forEach((element) => {
        gsap.fromTo(
          element,
          { opacity: 0, y: 60 },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: "back.out(1.7)",
            scrollTrigger: {
              trigger: element,
              start: "top 90%",
              toggleActions: "play none none reverse",
              once: true,
            },
          }
        );
      });

      ScrollTrigger.refresh();
    };

    // Small delay to ensure DOM is ready
    const timer = setTimeout(initAnimations, 100);

    return () => {
      clearTimeout(timer);
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, []);

  return (
    <>
      <Helmet>
        <title>Thermo Packers | Premium Thermocol & EPS Packaging Solutions</title>
        <meta
          name="description"
          content="Thermo Packers - Leading manufacturer of thermocol insulation, EPS packaging, molded pulp trays, and eco-friendly packaging solutions. Custom packaging for all industries."
        />
        <meta name="keywords" content="thermocol packaging, EPS packaging, molded pulp, eco-friendly packaging, custom packaging solutions" />
        <link rel="canonical" href="https://www.thermopackers.com/" />
        <meta property="og:title" content="Thermo Packers | Premium Thermocol & EPS Packaging" />
        <meta
          property="og:description"
          content="Manufacturer of high-quality thermocol insulation, EPS packaging, molded pulp trays, and sustainable packaging solutions."
        />
        <meta property="og:url" content="https://www.thermopackers.com/" />
        <meta property="og:image" content="https://www.thermopackers.com/images/og-image.jpg" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Thermo Packers" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Thermo Packers | Premium Packaging Solutions" />
        <meta name="twitter:description" content="Manufacturer of thermocol, EPS, and molded pulp packaging solutions." />
        <meta name="twitter:image" content="https://www.thermopackers.com/images/twitter-image.jpg" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-[#F9FAFB] via-white to-[#F0F4F8] text-gray-800 font-sans overflow-hidden">
        {/* Hero Section */}
        <section className="stacked-section">
          <Hero />
        </section>

        {/* Features Section */}
        <section className="relative z-10 stacked-section">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#B0BC27]/15 via-transparent to-transparent animate-pulse-slow"></div>
          <Features />
        </section>

        {/* Catalog Section */}
        <section className="relative z-10 stacked-section">
          <Catalog />
        </section>

        {/* Pricing Section */}
        <section className="relative z-10 stacked-section">
          <Pricing />
        </section>

        {/* FAQ Section */}
        <section className="relative z-10 stacked-section">
          <FAQ />
        </section>

        {/* Customer Reviews Section */}
        <section className="relative z-10 stacked-section">
          <CustomerReviews />
        </section>

        {/* Floating WhatsApp */}
        <FloatingWhatsApp />
      </div>
    </>
  );
};

export default Home;