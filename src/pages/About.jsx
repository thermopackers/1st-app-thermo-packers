import React, { useEffect } from "react";
import FloatingWhatsApp from "../components/FloatingWhatsapp";
import { Helmet } from "react-helmet";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const About = () => {
  useEffect(() => {
    const handleReady = () => {
      gsap.utils.toArray(".animate-on-scroll").forEach((el) =>
        gsap.fromTo(
          el,
          { opacity: 0, y: 50 },
          {
            opacity: 1,
            y: 0,
            duration: 1,
            ease: "power3.out",
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
    };

    if (document.readyState === "complete") {
      handleReady();
    } else {
      window.addEventListener("load", handleReady);
    }

    return () => {
      window.removeEventListener("load", handleReady);
    };
  }, []);

  const OverlayImage = ({ src, alt, overlayText }) => (
    <div className="relative w-full h-full rounded-xl shadow-lg overflow-hidden">
      <img src={src} alt={alt} className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-black/40 flex items-center justify-center p-6">
        <p className="text-white text-lg md:text-2xl font-semibold text-center">
          {overlayText}
        </p>
      </div>
    </div>
  );

  return (
    <>
      <Helmet>
        <title>About Thermo Packers</title>
        <meta
          name="description"
          content="Learn about Thermo Packers, a leading provider of EPS thermocol packaging and insulation products."
        />
        <link rel="canonical" href="https://www.thermopackers.com/about" />
        <meta property="og:title" content="About Thermo Packers" />
        <meta
          property="og:description"
          content="Discover the mission, values, and commitment behind Thermo Packers, a trusted name in EPS packaging and insulation."
        />
        <meta property="og:url" content="https://www.thermopackers.com/about" />
        <meta property="og:image" content="https://www.thermopackers.com/images/about1.jpg" />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>

      <div className="min-h-screen mt-[10vh] bg-gradient-to-br from-orange-50 via-white to-orange-100 p-6 md:p-16 text-gray-800">
        <FloatingWhatsApp />

        <div className="max-w-6xl mx-auto space-y-24">
          <section className="grid md:grid-cols-2 gap-10 items-center animate-on-scroll">
            <div>
              <h1 className="text-4xl md:text-5xl font-extrabold text-[#B0BC27] mb-6">
                People and Packaging with a Purpose
              </h1>
              <p className="text-lg md:text-xl leading-relaxed text-gray-700">
                <strong>Thermo Packers</strong> was established in the year <strong>1998</strong>, with an objective to provide clients with superior quality <strong>Thermocol Packaging products</strong>. Backed by strong vendor support, we offer a wide range of thermocol items like <strong>sheets and boxes</strong>—which are <strong>lightweight, rigid</strong>, and contain air entrapped in closed cells.
              </p>
            </div>
            <OverlayImage src="/images/about1.jpg" alt="People and Packaging" overlayText="People and Packaging with a Purpose" />
          </section>

          <section className="grid md:grid-cols-2 gap-10 items-center animate-on-scroll">
            <OverlayImage src="/images/better-packaging.jpg" alt="Better Packaging" overlayText="Better Packaging, Better Life" />
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-[#B0BC27] mb-4">
                Better Packaging, Better Life
              </h2>
              <p className="text-md md:text-lg leading-relaxed text-gray-700">
                Our products are widely used across various sectors such as <strong>homes, offices, hospitals, showrooms, banks, hotels</strong> and <strong>IT buildings</strong>. Thermocol products distributed by us are supplied to clients from multiple sectors including:
                <ul className="list-disc pl-5 mt-2">
                  <li><strong>Battery Manufacturers</strong></li>
                  <li><strong>Sewing Machine Manufacturers</strong></li>
                  <li><strong>Cold Storages & Refrigeration Vehicles</strong></li>
                  <li><strong>Pack Houses</strong></li>
                  <li><strong>Industries using Packing Material</strong></li>
                </ul>
              </p>
            </div>
          </section>

          <section className="grid md:grid-cols-2 gap-10 items-center animate-on-scroll">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-[#B0BC27] mb-4">
                The Power of Purpose
              </h2>
              <p className="text-md md:text-lg leading-relaxed text-gray-700">
                We are known as a <strong>distinguished manufacturer</strong> and <strong>solution provider</strong> for complex packaging needs. Our products are manufactured using the <strong>finest quality raw materials</strong> in compliance with industry standards. Our valued clientele includes many <strong>national and multinational companies</strong>—earning us a reputation in the <strong>quality-conscious market</strong>.
              </p>
            </div>
            <OverlayImage src="/images/success.avif" alt="Purpose" overlayText="Purpose and Progress" />
          </section>

          <section className="grid md:grid-cols-2 gap-10 items-center animate-on-scroll">
            <OverlayImage src="/images/pack.avif" alt="Quality" overlayText="Uncompromising Quality" />
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-[#B0BC27] mb-4">
                Quality System
              </h2>
              <p className="text-md md:text-lg leading-relaxed text-gray-700">
                The best thing about our products is that we offer them at <strong>highly competitive prices</strong>, making them more sought-after than our counterparts. Our offerings include:
                <ul className="list-disc pl-5 mt-2">
                  <li><strong>Customized Thermocol Packaging Moulding</strong></li>
                  <li><strong>Thermocol Packaging for Electronic Products</strong></li>
                  <li><strong>Thermocol Packaging for Batteries</strong></li>
                  <li><strong>Moulded Thermocol</strong></li>
                  <li><strong>Thermocol Ice Box</strong></li>
                  <li><strong>Thermocol Pipe Section</strong></li>
                  <li><strong>Thermocol Sheets</strong></li>
                </ul>
              </p>
            </div>
          </section>

          <section className="grid md:grid-cols-2 gap-10 items-center animate-on-scroll">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-[#B0BC27] mb-4">
                A Driving Force
              </h2>
              <p className="text-md md:text-lg leading-relaxed text-gray-700">
                Our products are used extensively across various industries, including:
                <ul className="list-disc pl-5 mt-2">
                  <li><strong>Sewing Machine Manufacturers</strong></li>
                  <li><strong>Tubular & Automotive Battery Manufacturers</strong></li>
                  <li><strong>Insulation for Cold Storages & Refrigeration Vehicles</strong></li>
                  <li><strong>Any Industry Utilizing Packaging Material</strong></li>
                </ul>
                Our growth continues to be driven by our commitment to <strong>better packaging</strong> and a <strong>better life</strong>.
              </p>
            </div>
            <OverlayImage src="/images/last.avif" alt="Driving Force" overlayText="Driven by Purpose" />
          </section>

          <section className="grid md:grid-cols-3 gap-6 animate-on-scroll">
            {[
              {
                title: "Mission",
                text: "To provide packaging solutions that improve products and lives, while maintaining the highest standards of integrity and innovation.",
              },
              {
                title: "Commitment",
                text: "We never compromise on quality. Our dedicated team ensures every product meets stringent quality benchmarks.",
              },
              {
                title: "Culture",
                text: "Our culture of purpose drives every decision, inspires innovation, and fosters an environment where excellence thrives.",
              },
            ].map((item) => (
              <div key={item.title} className="bg-white p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 text-center">
                <h3 className="text-xl font-semibold text-[#B0BC27] mb-2">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.text}</p>
              </div>
            ))}
          </section>
        </div>
      </div>
    </>
  );
};

export default About;
