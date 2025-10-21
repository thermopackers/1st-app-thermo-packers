import React, { useEffect, useRef, useState } from 'react';
import FloatingWhatsApp from './FloatingWhatsapp';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import { Phone, Mail, MapPin, Clock, MessageCircle } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const Contact = () => {
  const sectionRef = useRef(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });

  // Enhanced scroll to top with multiple methods
  useEffect(() => {
    console.log('Contact component mounted - scrolling to top');
    
    // Method 1: Instant scroll
    window.scrollTo(0, 0);
    
    // Method 2: DOM elements
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    
    // Method 3: Smooth scroll as fallback
    const smoothScroll = setTimeout(() => {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'smooth'
      });
    }, 100);

    // Method 4: Force scroll after a short delay (most reliable)
    const forceScroll = setTimeout(() => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }, 200);

    return () => {
      clearTimeout(smoothScroll);
      clearTimeout(forceScroll);
    };
  }, []);

  // Alternative: Use useLayoutEffect for immediate execution
  // useEffect(() => {
  //   // This runs synchronously after DOM mutations
  //   window.scrollTo(0, 0);
  //   document.documentElement.scrollTop = 0;
  //   document.body.scrollTop = 0;
  // }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    setTimeout(() => {
      setIsSubmitting(false);
      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
      });
      // Show success message (you can replace this with a toast notification)
      alert('Thank you for your message! We will get back to you soon.');
    }, 2000);
  };

  const contactInfo = [
    {
      icon: <Mail className="w-8 h-8 text-[#B0BC27]" />,
      title: 'Email Us',
      content: (
        <a 
          href="mailto:thermopackers@gmail.com" 
          className="text-gray-700 hover:text-[#B0BC27] transition-colors duration-300 break-all text-lg font-medium"
        >
          thermopackers@gmail.com
        </a>
      ),
      description: 'We respond within 24 hours',
      color: 'from-blue-50 to-blue-100',
      border: 'border-blue-200'
    },
    {
      icon: <Phone className="w-8 h-8 text-[#B0BC27]" />,
      title: 'Call Us',
      content: (
        <div className="space-y-1">
          <a href="tel:+91-9878165432" className="text-gray-700 hover:text-[#B0BC27] transition-colors duration-300 block text-lg font-medium">
            +91-9878165432
          </a>
          <a href="tel:+91-9216562160" className="text-gray-700 hover:text-[#B0BC27] transition-colors duration-300 block text-lg font-medium">
            +91-9216562160
          </a>
          <a href="tel:+91-9216660160" className="text-gray-700 hover:text-[#B0BC27] transition-colors duration-300 block text-lg font-medium">
            +91-9216660160
          </a>
        </div>
      ),
      description: 'Mon-Sat: 9:00 AM - 6:00 PM',
      color: 'from-green-50 to-green-100',
      border: 'border-green-200'
    },
    {
      icon: <MapPin className="w-8 h-8 text-[#B0BC27]" />,
      title: 'Visit Us',
      content: (
        <address className="text-gray-700 text-lg font-medium not-italic">
          Village Sangal Sohal, Kapurthala Road,<br />
          Jalandhar - 144013,<br />
          Punjab, India
        </address>
      ),
      description: 'Come see our manufacturing facility',
      color: 'from-purple-50 to-purple-100',
      border: 'border-purple-200'
    },
    {
      icon: <Clock className="w-8 h-8 text-[#B0BC27]" />,
      title: 'Business Hours',
      content: (
        <div className="text-gray-700 text-lg font-medium">
          <div>Mon - Sat: 9:00 AM - 6:00 PM</div>
          <div>Sunday: Closed</div>
        </div>
      ),
      description: 'We value your time',
      color: 'from-amber-50 to-amber-100',
      border: 'border-amber-200'
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  return (
    <>
      <Helmet>
        <title>Contact Thermo Packers | EPS & Thermocol Packaging Experts</title>
        <meta 
          name="description" 
          content="Get in touch with Thermo Packers for premium EPS and thermocol packaging solutions. Contact us for quotes, support, and expert packaging advice." 
        />
        <meta name="keywords" content="thermocol packaging contact, EPS packaging manufacturer, packaging solutions India, contact Thermo Packers" />
        <link rel="canonical" href="https://www.thermopackers.com/contact" />
        <meta property="og:title" content="Contact Thermo Packers | Packaging Solutions Experts" />
        <meta property="og:description" content="Reach out to Thermo Packers for custom EPS packaging, thermocol solutions, and expert support. We're here to help with all your packaging needs." />
        <meta property="og:url" content="https://www.thermopackers.com/contact" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Contact Thermo Packers" />
        <meta name="twitter:description" content="Get in touch with packaging experts for EPS and thermocol solutions." />
      </Helmet>

      <motion.section
        ref={sectionRef}
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="mt-[10vh] min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 py-12 sm:py-16 md:py-20 px-4 xs:px-6 sm:px-8 md:px-16 text-gray-800 relative overflow-hidden"
      >
        {/* Background decorative elements */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-10 left-10 w-20 h-20 sm:w-32 sm:h-32 bg-[#B0BC27]/10 rounded-full blur-xl"></div>
          <div className="absolute bottom-10 right-10 w-16 h-16 sm:w-28 sm:h-28 bg-[#B0BC27]/15 rounded-full blur-lg"></div>
          <div className="absolute top-1/2 left-1/4 w-12 h-12 sm:w-24 sm:h-24 bg-orange-200/30 rounded-full blur-lg"></div>
        </div>

        <FloatingWhatsApp />

        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <motion.div 
            className="text-center mb-12 sm:mb-16 md:mb-20"
            variants={itemVariants}
          >
            <h2 className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl font-extrabold text-gray-800 mb-4 sm:mb-6">
              Get In <span className="text-[#B0BC27]">Touch</span>
            </h2>
            <p className="text-lg sm:text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Ready to discuss your packaging needs? We're here to provide expert solutions and support for all your EPS and Thermocol requirements.
            </p>
          </motion.div>

          {/* Contact Info Cards */}
          <motion.div 
            className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 sm:gap-8 mb-16 sm:mb-20 md:mb-24"
            variants={containerVariants}
          >
            {contactInfo.map((info, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className={`bg-gradient-to-br ${info.color} border ${info.border} rounded-2xl shadow-lg hover:shadow-2xl p-6 sm:p-8 transition-all duration-500 transform hover:-translate-y-2 group`}
              >
                <div className="flex flex-col items-center text-center h-full">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-2xl flex items-center justify-center shadow-md mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300">
                    {info.icon}
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2 sm:mb-3">
                    {info.title}
                  </h3>
                  <div className="mb-2 sm:mb-3 flex-1">
                    {info.content}
                  </div>
                  <p className="text-sm text-gray-500 mt-auto">
                    {info.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Map Section - Now takes full width */}
          <motion.div
            variants={itemVariants}
            className="space-y-8"
          >
            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border-4 border-[#B0BC27]">
              <div className="p-4 bg-[#B0BC27] text-white">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Our Location
                </h3>
              </div>
              <iframe
                title="Thermo Packers Location"
                className="w-full h-80 sm:h-96 md:h-[500px]"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3407.6176140523294!2d75.50742927567505!3d31.341931874296048!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x391a4ea217aa8aa3%3A0xf5c37fe3415d080f!2sThermo%20Packers!5e0!3m2!1sen!2sin!4v1744954289262!5m2!1sen!2sin"
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                style={{ border: 0 }}
              />
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <motion.a
                href="https://wa.me/919878165432?text=Hi%20Thermo%20Packers!%20I'm%20interested%20in%20your%20packaging%20solutions."
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-green-600 text-white p-4 rounded-xl text-center font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-5 h-5" />
                WhatsApp Us
              </motion.a>
              <motion.a
                href="tel:+919878165432"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-blue-600 text-white p-4 rounded-xl text-center font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2"
              >
                <Phone className="w-5 h-5" />
                Call Now
              </motion.a>
            </div>
          </motion.div>
        </div>
      </motion.section>
    </>
  );
};

export default Contact;