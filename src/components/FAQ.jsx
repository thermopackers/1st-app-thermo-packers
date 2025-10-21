import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const faqData = [
  {
    question: "What materials do you use for packaging?",
    answer: "We specialize in EPS (Expanded Polystyrene), thermocol insulation, and molded pulp materials. All our materials are durable, protective, and many are eco-friendly options.",
  },
  {
    question: "Do you offer custom packaging sizes?",
    answer: "Yes! We provide fully customizable packaging solutions tailored to your specific product dimensions and requirements. Our team works with you to create the perfect fit.",
  },
  {
    question: "Is there a minimum order quantity?",
    answer: "No minimum order quantity required. We cater to both small businesses with limited orders and large enterprises with bulk requirements.",
  },
  {
    question: "What is your delivery timeline?",
    answer: "Standard orders: 3-5 business days. Custom orders: 7-10 business days. Rush delivery options available for urgent requirements.",
  },
  {
    question: "Do you provide eco-friendly packaging options?",
    answer: "Absolutely! We offer biodegradable molded pulp, recycled materials, and sustainable packaging solutions to meet your environmental goals.",
  },
  {
    question: "Can I get samples before placing an order?",
    answer: "Yes, we provide samples of our packaging materials. Contact our sales team to request samples for your evaluation.",
  },
];

const FAQ = () => {
  const [activeIndex, setActiveIndex] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkViewport = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkViewport();
    window.addEventListener("resize", checkViewport);
    
    return () => window.removeEventListener("resize", checkViewport);
  }, []);

  const toggleFAQ = (index) => {
    if (isMobile) {
      setActiveIndex(activeIndex === index ? null : index);
    } else {
      setActiveIndex(index);
    }
  };

  const handleMouseEnter = (index) => {
    if (!isMobile) {
      setActiveIndex(index);
    }
  };

  const handleMouseLeave = () => {
    if (!isMobile) {
      setActiveIndex(null);
    }
  };

  return (
    <section className="py-16 xs:py-20 px-4 xs:px-6 bg-gradient-to-br from-gray-50 to-white animate-fade-in">
      <div className="max-w-4xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12 xs:mb-16">
          <h2 className="text-3xl xs:text-4xl sm:text-5xl font-extrabold text-gray-800 mb-4 animate-on-scroll">
            Frequently Asked <span className="text-[#B0BC27]">Questions</span>
          </h2>
          <p className="text-lg xs:text-xl text-gray-600 animate-on-scroll" style={{ animationDelay: "0.1s" }}>
            Find quick answers to common questions about our packaging solutions
          </p>
        </div>

        {/* FAQ Items */}
        <div className="space-y-4 xs:space-y-6">
          {faqData.map((item, i) => {
            const isActive = activeIndex === i;
            
            return (
              <div
                key={i}
                className={`bg-white border-2 rounded-2xl shadow-lg overflow-hidden transition-all duration-500 animate-on-scroll group ${
                  isActive 
                    ? 'border-[#B0BC27] shadow-xl' 
                    : 'border-gray-100 hover:border-gray-200'
                }`}
                style={{ animationDelay: `${i * 0.1 + 0.2}s` }}
                onMouseEnter={() => handleMouseEnter(i)}
                onMouseLeave={handleMouseLeave}
                onClick={() => toggleFAQ(i)}
              >
                {/* Question */}
                <div className="cursor-pointer px-4 xs:px-6 py-4 xs:py-5 flex justify-between items-center transition-colors duration-300 group-hover:bg-gray-50">
                  <h3 className="text-lg xs:text-xl font-semibold text-gray-800 pr-4 flex-1 text-left">
                    {item.question}
                  </h3>
                  <span
                    className={`flex-shrink-0 text-2xl transition-transform duration-500 text-[#B0BC27] ${
                      isActive ? "rotate-180" : ""
                    }`}
                  >
                    ⌄
                  </span>
                </div>

                {/* Answer */}
                <div
                  className={`transition-all duration-500 ease-in-out overflow-hidden ${
                    isActive 
                      ? "max-h-48 xs:max-h-40 opacity-100" 
                      : "max-h-0 opacity-0"
                  }`}
                >
                  <div className="px-4 xs:px-6 pb-4 xs:pb-5">
                    <p className="text-gray-600 text-base xs:text-lg leading-relaxed">
                      {item.answer}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

     {/* Bottom CTA */}
<div className="text-center mt-12 xs:mt-16 animate-on-scroll" style={{ animationDelay: "0.8s" }}>
  <p className="text-gray-600 mb-6 text-lg xs:text-xl">
    Still have questions? We'd love to help!
  </p>
  <div className="flex flex-col xs:flex-row gap-4 justify-center">
    <button 
      onClick={() => navigate('/contact')}
      className="bg-[#B0BC27] text-white px-8 xs:px-10 py-3 xs:py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl hover:bg-[#9ca824] transition-all duration-300 transform hover:scale-105"
    >
      Contact Support
    </button>
  </div>
</div>
      </div>
    </section>
  );
};

export default FAQ;