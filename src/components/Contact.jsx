import React, { useEffect, useRef } from 'react';
import FloatingWhatsApp from './FloatingWhatsapp';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const Contact = () => {
  const sectionRef = useRef(null);
  const headingRef = useRef(null);
  const cardsRef = useRef([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(headingRef.current, {
        y: 50,
        opacity: 0,
        duration: 1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: headingRef.current,
          start: 'top 80%',
        },
      });

      cardsRef.current.forEach((card, index) => {
        gsap.from(card, {
          opacity: 0,
          y: 30,
          duration: 0.6,
          delay: index * 0.2,
          scrollTrigger: {
            trigger: card,
            start: 'top 85%',
          },
        });
      });

      ScrollTrigger.refresh();
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  // ✅ New: Function to scroll to top after motion animation complete
  const handleAnimationComplete = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <Helmet>
        <title>Contact Us | Thermo Packers</title>
        <meta name="description" content="Get in touch with Thermo Packers for EPS and thermocol packaging needs. We're here to help!" />
      </Helmet>

      <motion.section
        ref={sectionRef}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        onAnimationComplete={handleAnimationComplete}  // ✅ Added this line
        className="mt-[10vh] min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 py-20 px-6 md:px-16 text-gray-800 relative"
      >
        <FloatingWhatsApp />

        <div className="max-w-5xl mx-auto text-center space-y-10">
          <h2
            ref={headingRef}
            className="text-4xl md:text-5xl font-extrabold drop-shadow-md text-[#B0BC27]"
          >
            Get in Touch
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto drop-shadow-md">
            We’d love to hear from you! Reach out to us for any queries or support.
          </p>

          {/* Contact Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            {[
              {
                icon: <img className="h-11 drop-shadow-md" src="./images/gmail.webp" alt="Email" />,
                title: 'Email Us',
                content: (
                  <a href="mailto:thermopackers@gmail.com" className="text-blue-600 hover:underline break-all">
                    thermopackers@gmail.com
                  </a>
                ),
              },
              {
                icon: <img className="h-11 drop-shadow-md" src="./images/call.webp" alt="Call" />,
                title: 'Call Us',
                content: (
                  <>
                    <a href="tel:+91-9878165432" className="text-blue-600 hover:underline block">
                      +91-9878165432
                    </a>
                    <a href="tel:+91-9216562160" className="text-blue-600 hover:underline block">
                      +91-9216562160
                    </a>
                    <a href="tel:+91-9216660160" className="text-blue-600 hover:underline block">
                      +91-9216660160
                    </a>
                  </>
                ),
              },
              {
                icon: <img className="h-11 drop-shadow-md" src="./images/loc.webp" alt="Location" />,
                title: 'Visit Us',
                content: (
                  <p className="text-gray-600 text-sm">
                    Village Sangal Sohal, Kapurthala Road,<br />
                    Jalandhar - 144013, Punjab, India
                  </p>
                ),
              },
            ].map((card, i) => (
              <div
                key={i}
                ref={el => cardsRef.current[i] = el}
                className="bg-white shadow-lg hover:shadow-2xl p-6 rounded-xl transition-all duration-300 flex flex-col items-center text-center"
              >
                {card.icon}
                <h3 className="text-xl font-semibold mb-1">{card.title}</h3>
                {card.content}
              </div>
            ))}
          </div>

          {/* Google Map */}
          <div className="mt-14 rounded-xl overflow-hidden shadow-2xl border-4 border-[#B0BC27]">
            <iframe
              title="Thermo Packers Location"
              className="w-full h-[400px]"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3407.6176140523294!2d75.50742927567505!3d31.341931874296048!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x391a4ea217aa8aa3%3A0xf5c37fe3415d080f!2sThermo%20Packers!5e0!3m2!1sen!2sin!4v1744954289262!5m2!1sen!2sin"
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </motion.section>
    </>
  );
};

export default Contact;
