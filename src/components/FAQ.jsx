import React, { useState, useEffect } from "react";

const faqData = [
  {
    question: "What materials do you use for packaging?",
    answer: "EPS and molded pulp – durable and eco-friendly.",
  },
  {
    question: "Do you offer custom packaging sizes?",
    answer: "Yes, fully customizable solutions.",
  },
  {
    question: "Is there a minimum order quantity?",
    answer: "No, we cater to both small and bulk orders.",
  },
];

const FAQ = () => {
  const [activeIndex, setActiveIndex] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkViewport = () => setIsMobile(window.innerWidth < 768);
    checkViewport();
    window.addEventListener("resize", checkViewport);
    return () => window.removeEventListener("resize", checkViewport);
  }, []);

  const toggle = (index) => {
    if (isMobile) {
      setActiveIndex((prev) => (prev === index ? null : index));
    }
  };

  return (
    <section className="py-20 px-6 bg-gradient-to-br from-gray-50 to-white animate-fade-in">
      <h2 className="text-4xl drop-shadow-md sm:text-5xl font-extrabold text-center text-gray-800 mb-12">
        Frequently Asked <span className="text-[#B0BC27]">Questions</span>
      </h2>

      <div className="max-w-3xl mx-auto space-y-4">
        {faqData.map((item, i) => {
          const isActive = isMobile ? activeIndex === i : activeIndex === i;
          return (
            <div
              key={i}
              className={`bg-white border border-gray-200 rounded-xl shadow-md overflow-hidden transition-all duration-300 group ${
                isActive ? "bg-blue-50" : ""
              }`}
              onMouseEnter={() => !isMobile && setActiveIndex(i)}
              onMouseLeave={() => !isMobile && setActiveIndex(null)}
              onClick={() => toggle(i)}
            >
              <div className="cursor-pointer px-6 py-4 text-lg font-medium text-gray-800 flex justify-between items-center">
                {item.question}
                <span
                  className={`ml-2 transform transition-transform duration-300 ${
                    isActive ? "rotate-180" : ""
                  }`}
                >
                  ⌄
                </span>
              </div>

              <div
                className={`px-6 text-gray-600 text-sm transition-all duration-500 ease-in-out ${
                  isActive ? "max-h-40 py-2 opacity-100" : "max-h-0 opacity-0 py-0"
                } overflow-hidden`}
              >
                {item.answer}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default FAQ;
