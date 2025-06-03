const plans = [
  {
    title: "Bulk Packaging",
    features: ["High-volume discounts", "Custom sizing", "Fast delivery"],
  },
  {
    title: "Eco-Friendly Solutions",
    features: [
      "Biodegradable materials",
      "Molded pulp",
      "Sustainability consulting",
    ],
  },
  {
    title: "Small-Scale Orders",
    features: ["No minimum quantity", "Fast turnaround", "Custom branding"],
  },
];

const Pricing = () => (
  <section className="py-20 px-6 bg-gradient-to-br from-white to-gray-50 animate-fade-in">
    <h2 className="drop-shadow-md text-4xl sm:text-5xl font-extrabold text-center text-gray-800 mb-12">
      Our <span className="text-[#B0BC27]">Service</span> Plans
    </h2>
    <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
      {plans.map((plan, i) => (
        <div
          key={i}
          className="bg-white rounded-2xl shadow-md border border-gray-100 p-8 text-center transform transition duration-500 hover:scale-105 hover:shadow-xl animate-zoom-in"
        >
          <h3 className="text-2xl drop-shadow-md font-semibold text-[#B0BC27] mb-6">
            {plan.title}
          </h3>
          <ul className="space-y-4 text-gray-700 text-base font-medium">
            {plan.features.map((f, j) => (
              <li key={j} className="flex items-center justify-center gap-2">
                <span className="text-green-500">✔</span> {f}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  </section>
);

export default Pricing;
