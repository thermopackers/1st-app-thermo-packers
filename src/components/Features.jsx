import { Link } from "react-router-dom";

const CLOUDINARY_CLOUD_NAME = "dcr8k5amk"; // <-- Replace this with your Cloudinary cloud name

const features = [
  {
    text: "High-quality EPS and pulp materials",
    image: "a_yrmeqk", // Cloudinary public ID
    slug: "eps-and-pulp-materials",
  },
  {
    text: "Fast & reliable delivery",
    image: "b_opz1vm",
    slug: "fast-delivery",
  },
  {
    text: "Custom packaging solutions",
    image: "c_imjpec",
    slug: "custom-packaging",
  },
  {
    text: "Eco-friendly & sustainable packaging",
    image: "dd_ow1ny6",
    slug: "eco-packaging",
  },
];

// Cloudinary Image component for optimized images
const CloudinaryImage = ({ publicId, alt }) => {
  const url = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/f_auto,q_auto,w_400,c_fill/${publicId}.jpg`;
  return (
    <img
      src={url}
      alt={alt}
      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 rounded-xl"
      loading="lazy"
      decoding="async"
    />
  );
};

const Features = () => {
  return (
    <section className="py-24 px-6 bg-gradient-to-br from-[#e8f0fe] to-white text-center relative overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="w-[60vw] h-[60vw] bg-[#B0BC27]/10 rounded-full blur-3xl animate-pulse-slow absolute -top-10 -left-10"></div>
        <div className="w-[40vw] h-[40vw] bg-[#B0BC27]/20 rounded-full blur-2xl animate-float absolute top-40 right-0"></div>
      </div>

      <h2 className="drop-shadow-md text-4xl sm:text-5xl font-extrabold mb-16 text-gray-800 animate-slide-up">
        Why Choose <span className="text-[#B0BC27]">Thermo Packers</span>?
      </h2>

      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 max-w-7xl mx-auto px-4">
        {features.map((item, idx) => (
          <Link to={`/features/${item.slug}`} key={idx}>
            <li
              className="bg-white/80 backdrop-blur-md border border-gray-200 rounded-3xl shadow-lg p-5 flex flex-col items-center justify-between transition-all duration-500 hover:scale-105 hover:shadow-2xl cursor-pointer h-[38vh] animate-fade-in"
            >
              <div className="flex-1 w-full relative overflow-hidden rounded-xl mb-4 group">
                <CloudinaryImage publicId={item.image} alt={item.text} />
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>
              </div>
              <p className="text-lg font-semibold text-gray-800 leading-tight animate-slide-up-delayed">
                {item.text}
              </p>
            </li>
          </Link>
        ))}
      </ul>
    </section>
  );
};

export default Features;
