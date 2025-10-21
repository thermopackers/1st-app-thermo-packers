import React from "react";
import { useNavigate } from "react-router-dom";

const plans = [
  {
    title: "Bulk Packaging",
    features: ["High-volume discounts", "Custom sizing", "Fast delivery", "Priority support"],
    icon: "📦",
    popular: false,
  },
  {
    title: "Eco-Friendly Solutions",
    features: [
      "Biodegradable materials",
      "Molded pulp packaging",
      "Sustainability consulting",
      "Green certification",
    ],
    icon: "🌱",
    popular: false,
  },
  {
    title: "Small-Scale Orders",
    features: ["No minimum quantity", "Fast turnaround", "Custom branding", "Flexible payments"],
    icon: "⚡",
    popular: false,
  },
];

const Pricing = () => {
  const navigate = useNavigate();

  return(
  <section className="py-16 xs:py-20 px-4 xs:px-6 bg-gradient-to-br from-white to-gray-50 animate-fade-in">
    <div className="max-w-6xl mx-auto">
      {/* Section Header */}
      <div className="text-center mb-12 xs:mb-16">
        <h2 className="drop-shadow-md text-3xl xs:text-4xl sm:text-5xl font-extrabold text-gray-800 mb-4 animate-on-scroll">
          Our <span className="text-[#B0BC27]">Service</span> Plans
        </h2>
        <p className="text-lg xs:text-xl text-gray-600 max-w-2xl mx-auto animate-on-scroll" style={{ animationDelay: "0.1s" }}>
          Choose the perfect packaging solution for your business needs
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 xs:gap-8">
        {plans.map((plan, i) => (
          <div
            key={i}
            className={`bg-white rounded-3xl shadow-lg border-2 p-6 xs:p-8 text-center transform transition duration-500 hover:scale-105 hover:shadow-xl animate-on-scroll ${
              plan.popular 
                ? 'border-[#B0BC27] relative ring-2 ring-[#B0BC27]/20' 
                : 'border-gray-100 hover:border-gray-200'
            }`}
            style={{ animationDelay: `${i * 0.1 + 0.2}s` }}
          >
            {/* Popular Badge */}
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-[#B0BC27] text-white text-sm font-semibold px-4 py-1 rounded-full shadow-lg">
                  Most Popular
                </span>
              </div>
            )}

            {/* Plan Icon */}
            <div className="text-5xl xs:text-6xl mb-4 xs:mb-6">{plan.icon}</div>

            {/* Plan Title */}
            <h3 className="text-2xl xs:text-3xl font-bold text-gray-800 mb-4 xs:mb-6">
              {plan.title}
            </h3>

            {/* Features List */}
            <ul className="space-y-3 xs:space-y-4 text-gray-700 text-base xs:text-lg font-medium mb-6 xs:mb-8">
              {plan.features.map((feature, j) => (
                <li key={j} className="flex items-center justify-center gap-3">
                  <span className="text-green-500 text-lg flex-shrink-0">✔</span>
                  <span className="text-left">{feature}</span>
                </li>
              ))}
            </ul>

            {/* CTA Button */}
       <button 
  onClick={() => navigate('/contact')}
  className={`w-full py-3 xs:py-4 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 ${
    plan.popular
      ? 'bg-[#B0BC27] text-white hover:bg-[#9ca824] shadow-lg'
      : 'bg-gray-800 text-white hover:bg-gray-900'
  }`}
>
  Get Started
</button>

            {/* Additional Info */}
            <p className="text-sm text-gray-500 mt-4">
              Custom quotes available for large orders
            </p>
          </div>
        ))}
      </div>

      
    </div>
  </section>
)};

export default Pricing;