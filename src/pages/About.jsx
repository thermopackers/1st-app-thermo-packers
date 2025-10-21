import React, { useEffect } from "react";
import FloatingWhatsApp from "../components/FloatingWhatsapp";
import { Helmet } from "react-helmet";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

gsap.registerPlugin(ScrollTrigger);

const About = () => {
  const navigate = useNavigate();

    // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const initAnimations = () => {
      // Section animations
      const sections = gsap.utils.toArray(".animate-section");
      
      sections.forEach((section, index) => {
        gsap.fromTo(
          section,
          {
            opacity: 0,
            y: 80,
            scale: 0.98,
          },
          {
            opacity: 1,
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

      // Text animations
      const textElements = gsap.utils.toArray(".animate-text");
      textElements.forEach((element, index) => {
        gsap.fromTo(
          element,
          { opacity: 0, y: 40 },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            delay: index * 0.1,
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

      // Card animations
      const cards = gsap.utils.toArray(".animate-card");
      cards.forEach((card, index) => {
        gsap.fromTo(
          card,
          { opacity: 0, y: 60, scale: 0.95 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.6,
            delay: index * 0.15,
            ease: "power2.out",
            scrollTrigger: {
              trigger: card,
              start: "top 85%",
              toggleActions: "play none none reverse",
              once: true,
            },
          }
        );
      });

      ScrollTrigger.refresh();
    };

    // Initialize animations with delay
    const timer = setTimeout(initAnimations, 100);

    return () => {
      clearTimeout(timer);
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, []);

  const OverlayImage = ({ src, alt, overlayText, delay = 0 }) => (
    <motion.div 
      className="relative w-full h-full rounded-2xl shadow-xl overflow-hidden group animate-section"
      initial={{ opacity: 0, x: 50 }}
      whileInView={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.8, delay }}
      viewport={{ once: true }}
    >
      <img
        src={src}
        alt={alt}
        loading="lazy"
        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent flex items-end p-6">
        <p className="text-white text-xl md:text-2xl lg:text-3xl font-bold text-center w-full">
          {overlayText}
        </p>
      </div>
      {/* Hover effect */}
      <div className="absolute inset-0 bg-[#B0BC27]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
    </motion.div>
  );

  const FeatureList = ({ items, columns = 1 }) => (
    <ul className={`grid grid-cols-1 ${columns === 2 ? 'md:grid-cols-2' : ''} gap-2 mt-4`}>
      {items.map((item, index) => (
        <motion.li 
          key={index}
          className="flex items-start gap-3 text-gray-700"
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
          viewport={{ once: true }}
        >
          <span className="text-[#B0BC27] font-bold mt-1 flex-shrink-0">▸</span>
          <span className="text-base md:text-lg">{item}</span>
        </motion.li>
      ))}
    </ul>
  );

  return (
    <>
      <Helmet>
        <title>About Thermo Packers | Leading EPS Thermocol Packaging Manufacturer</title>
        <meta
          name="description"
          content="Discover Thermo Packers - Established in 1998, we are leading manufacturers of EPS thermocol packaging, insulation products, and custom packaging solutions. Quality-driven, purpose-focused."
        />
        <meta name="keywords" content="thermocol packaging, EPS packaging, insulation products, custom packaging, packaging manufacturer, sustainable packaging" />
        <link rel="canonical" href="https://www.thermopackers.com/about" />
        <meta property="og:title" content="About Thermo Packers | Premium Packaging Solutions Since 1998" />
        <meta
          property="og:description"
          content="Learn about our mission, quality standards, and commitment to providing superior EPS thermocol packaging solutions across multiple industries."
        />
        <meta property="og:url" content="https://www.thermopackers.com/about" />
        <meta property="og:image" content="https://www.thermopackers.com/images/about-og.jpg" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Thermo Packers" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="About Thermo Packers" />
        <meta name="twitter:description" content="Leading manufacturer of EPS thermocol packaging and insulation products since 1998." />
        <meta name="twitter:image" content="https://www.thermopackers.com/images/about-twitter.jpg" />
        <meta name="robots" content="index, follow" />
        <meta name="theme-color" content="#B0BC27" />
      </Helmet>

      <div className="min-h-screen mt-[10vh] bg-gradient-to-br from-orange-50 via-white to-orange-100 px-4 xs:px-6 sm:p-8 md:p-12 lg:p-16 text-gray-800">
        <FloatingWhatsApp />

        <div className="max-w-7xl mx-auto space-y-16 sm:space-y-20 md:space-y-24 lg:space-y-28">
          {/* Hero Section */}
          <section className="text-center py-8 md:py-12 animate-section">
            <motion.h1 
              className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl font-extrabold text-[#B0BC27] mb-6 md:mb-8 leading-tight animate-text"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              People and Packaging <br className="hidden sm:block" />
              <span className="text-gray-800">with a Purpose</span>
            </motion.h1>
            <motion.p 
              className="text-lg sm:text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed animate-text"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              Since 1998, delivering superior quality thermocol packaging solutions that protect your products and our planet.
            </motion.p>
          </section>

          {/* Section 1 - Introduction */}
          <section className="grid lg:grid-cols-2 gap-8 md:gap-12 lg:gap-16 items-center animate-section">
            <div className="order-2 lg:order-1">
              <motion.h2 
                className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#B0BC27] mb-4 md:mb-6 animate-text"
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
              >
                Our Foundation
              </motion.h2>
              <motion.p 
                className="text-base sm:text-lg md:text-xl leading-relaxed text-gray-700 mb-6 animate-text"
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                viewport={{ once: true }}
              >
                <strong>Thermo Packers</strong> was established in <strong>1998</strong> with a clear objective: to provide clients with superior quality <strong>Thermocol Packaging products</strong>. Backed by strong vendor support, we offer a comprehensive range of thermocol items including <strong>sheets and boxes</strong> that are <strong>lightweight, rigid</strong>, and feature air entrapped in closed cells for optimal protection.
              </motion.p>
              <motion.div 
                className="bg-[#B0BC27]/10 p-4 md:p-6 rounded-xl border-l-4 border-[#B0BC27] animate-text"
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: true }}
              >
                <p className="text-sm md:text-base text-gray-700 font-medium">
                  "Quality in packaging isn't just about protecting products—it's about preserving trust with every delivery."
                </p>
              </motion.div>
            </div>
            <div className="order-1 lg:order-2">
              <OverlayImage
                src="/images/about1.jpg"
                alt="Thermo Packers Manufacturing Facility"
                overlayText="Excellence Since 1998"
                delay={0.3}
              />
            </div>
          </section>

          {/* Section 2 - Applications */}
          <section className="grid lg:grid-cols-2 gap-8 md:gap-12 lg:gap-16 items-center animate-section">
            <div className="order-1">
              <OverlayImage
                src="/images/better-packaging.jpg"
                alt="Better Packaging Solutions"
                overlayText="Better Packaging, Better Life"
              />
            </div>
            <div className="order-2">
              <motion.h2 
                className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#B0BC27] mb-4 md:mb-6 animate-text"
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
              >
                Better Packaging, Better Life
              </motion.h2>
              <motion.p 
                className="text-base sm:text-lg md:text-xl leading-relaxed text-gray-700 mb-6 animate-text"
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                viewport={{ once: true }}
              >
                Our products serve diverse sectors including <strong>homes, offices, hospitals, showrooms, banks, hotels</strong>, and <strong>IT buildings</strong>. We proudly supply thermocol solutions to:
              </motion.p>
              <FeatureList
                items={[
                  "Battery Manufacturers",
                  "Sewing Machine Manufacturers", 
                  "Cold Storages & Refrigeration Vehicles",
                  "Pack Houses & Distribution Centers",
                  "Industries using Advanced Packing Material"
                ]}
                columns={1}
              />
            </div>
          </section>

          {/* Section 3 - Quality & Reputation */}
          <section className="grid lg:grid-cols-2 gap-8 md:gap-12 lg:gap-16 items-center animate-section">
            <div className="order-2 lg:order-1">
              <motion.h2 
                className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#B0BC27] mb-4 md:mb-6 animate-text"
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
              >
                The Power of Purpose
              </motion.h2>
              <motion.p 
                className="text-base sm:text-lg md:text-xl leading-relaxed text-gray-700 mb-6 animate-text"
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                viewport={{ once: true }}
              >
                Recognized as a <strong>distinguished manufacturer</strong> and <strong>innovative solution provider</strong> for complex packaging needs, we manufacture products using the <strong>finest quality raw materials</strong> in strict compliance with international standards. Our esteemed clientele includes numerous <strong>national and multinational companies</strong>, earning us an impeccable reputation in quality-conscious markets worldwide.
              </motion.p>
              <motion.div 
                className="grid grid-cols-2 gap-4 mt-6 animate-text"
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: true }}
              >
                <div className="text-center p-4 bg-white rounded-lg shadow-md">
                  <div className="text-2xl font-bold text-[#B0BC27]">25+</div>
                  <div className="text-sm text-gray-600">Years Experience</div>
                </div>
                <div className="text-center p-4 bg-white rounded-lg shadow-md">
                  <div className="text-2xl font-bold text-[#B0BC27]">500+</div>
                  <div className="text-sm text-gray-600">Clients Served</div>
                </div>
              </motion.div>
            </div>
            <div className="order-1 lg:order-2">
              <OverlayImage
                src="/images/success.avif"
                alt="Quality and Success"
                overlayText="Excellence in Every Product"
                delay={0.3}
              />
            </div>
          </section>

          {/* Section 4 - Product Range */}
          <section className="grid lg:grid-cols-2 gap-8 md:gap-12 lg:gap-16 items-center animate-section">
            <div className="order-1">
              <OverlayImage
                src="/images/pack.avif"
                alt="Our Product Range"
                overlayText="Comprehensive Solutions"
              />
            </div>
            <div className="order-2">
              <motion.h2 
                className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#B0BC27] mb-4 md:mb-6 animate-text"
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
              >
                Quality System & Products
              </motion.h2>
              <motion.p 
                className="text-base sm:text-lg md:text-xl leading-relaxed text-gray-700 mb-6 animate-text"
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                viewport={{ once: true }}
              >
                We offer premium quality products at <strong>highly competitive prices</strong>, making us the preferred choice over competitors. Our comprehensive product portfolio includes:
              </motion.p>
              <FeatureList
                items={[
                  "Customized Thermocol Packaging Moulding",
                  "Thermocol Packaging for Electronic Products", 
                  "Thermocol Packaging for Batteries",
                  "Moulded Thermocol Components",
                  "Thermocol Ice Box & Coolers",
                  "Thermocol Pipe Section Insulation",
                  "Thermocol Sheets & Blocks"
                ]}
                columns={1}
              />
            </div>
          </section>

          {/* Section 5 - Industry Impact */}
          <section className="grid lg:grid-cols-2 gap-8 md:gap-12 lg:gap-16 items-center animate-section">
            <div className="order-2 lg:order-1">
              <motion.h2 
                className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#B0BC27] mb-4 md:mb-6 animate-text"
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
              >
                A Driving Force in Industry
              </motion.h2>
              <motion.p 
                className="text-base sm:text-lg md:text-xl leading-relaxed text-gray-700 mb-6 animate-text"
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                viewport={{ once: true }}
              >
                Our solutions power industries across multiple sectors, providing essential packaging and insulation for:
              </motion.p>
              <FeatureList
                items={[
                  "Sewing Machine Manufacturers",
                  "Tubular & Automotive Battery Manufacturers", 
                  "Insulation for Cold Storages & Refrigeration",
                  "All Industries Utilizing Packaging Material"
                ]}
                columns={1}
              />
              <motion.p 
                className="mt-6 text-base sm:text-lg md:text-xl text-gray-700 bg-[#B0BC27]/5 p-4 rounded-xl border border-[#B0BC27]/20 animate-text"
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                viewport={{ once: true }}
              >
                Our sustained growth is driven by an unwavering commitment to <strong>better packaging solutions</strong> that contribute to a <strong>better quality of life</strong> for all.
              </motion.p>
            </div>
            <div className="order-1 lg:order-2">
              <OverlayImage
                src="/images/last.avif"
                alt="Industry Leadership"
                overlayText="Driving Industry Forward"
                delay={0.3}
              />
            </div>
          </section>

          {/* Core Values Section */}
          <section className="animate-section">
            <motion.h2 
              className="text-2xl sm:text-3xl md:text-4xl font-bold text-center text-gray-800 mb-8 md:mb-12 animate-text"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              Our Core Values
            </motion.h2>
            <div className="grid md:grid-cols-3 gap-6 md:gap-8">
              {[
                {
                  title: "Our Mission",
                  icon: "🎯",
                  text: "To provide innovative packaging solutions that enhance product protection while maintaining the highest standards of integrity, quality, and environmental responsibility.",
                  color: "from-blue-500 to-blue-600"
                },
                {
                  title: "Our Commitment", 
                  icon: "🤝",
                  text: "We never compromise on quality. Our dedicated team ensures every product exceeds industry benchmarks while delivering exceptional value to our clients.",
                  color: "from-green-500 to-green-600"
                },
                {
                  title: "Our Culture",
                  icon: "🌟",
                  text: "A culture of purpose drives our innovation, inspires excellence in every project, and fosters an environment where quality and customer satisfaction thrive.",
                  color: "from-purple-500 to-purple-600"
                }
              ].map((item, index) => (
                <motion.div
                  key={item.title}
                  className="bg-white p-6 md:p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 animate-card group"
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.2 }}
                  viewport={{ once: true }}
                >
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${item.color} flex items-center justify-center text-2xl text-white mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    {item.icon}
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-4">
                    {item.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {item.text}
                  </p>
                </motion.div>
              ))}
            </div>
          </section>

          {/* CTA Section */}
          <section className="text-center py-12 md:py-16 bg-gradient-to-r from-[#B0BC27] to-[#9ca824] rounded-3xl text-white animate-section">
            <motion.h2 
              className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 md:mb-6 animate-text"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              Ready to Transform Your Packaging?
            </motion.h2>
            <motion.p 
              className="text-lg sm:text-xl md:text-2xl mb-8 md:mb-10 max-w-2xl mx-auto opacity-90 animate-text"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
            >
              Let's discuss how our purpose-driven packaging solutions can benefit your business.
            </motion.p>
       <motion.div 
  className="flex flex-col sm:flex-row gap-4 justify-center animate-text"
  initial={{ opacity: 0, y: 30 }}
  whileInView={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.6, delay: 0.2 }}
  viewport={{ once: true }}
>
 <button 
  onClick={() => {
    // Force scroll to top immediately
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    // Then navigate
    navigate('/contact');
  }}
  className="bg-white text-[#B0BC27] px-8 py-4 rounded-xl font-semibold text-lg hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 shadow-lg"
>
  Get Free Consultation
</button>
  <button 
    onClick={() => navigate('/products')}
    className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-white/10 transition-all duration-300 transform hover:scale-105"
  >
    View Our Products
  </button>
</motion.div>
          </section>
        </div>
      </div>
    </>
  );
};

export default About;