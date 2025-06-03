import { useParams } from 'react-router-dom';
import { useEffect } from 'react';
import { Helmet } from 'react-helmet';

const featureDetails = {
  'eps-and-pulp-materials': {
    title: 'High-quality EPS and Pulp Materials',
    image: '/images/a.jpg',
    description:
      'We use top-grade EPS (Expanded Polystyrene) and molded pulp materials that ensure your products are safely packaged. Both materials are lightweight, durable, and environmentally friendly.',
  },
  'fast-delivery': {
    title: 'Fast & Reliable Delivery',
    image: '/images/b.jpg',
    description:
      'Our logistics ensure that your packaging solutions are delivered on time, every time. We take pride in being both fast and dependable.',
  },
  'custom-packaging': {
    title: 'Custom Packaging Solutions',
    image: '/images/c.jpg',
    description:
      'Need something specific? We offer fully customized packaging tailored to your products—whether it’s size, shape, branding, or material.',
  },
  'eco-packaging': {
    title: 'Eco-friendly & Sustainable Packaging',
    image: '/images/dd.jpg',
    description:
      'Sustainability is at the core of what we do. Our packaging options are biodegradable and recyclable, helping your business go green.',
  },
};

const FeatureDetail = () => {
  
  const { slug } = useParams();
  const detail = featureDetails[slug];

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  if (!detail) {
    return (
      <div className="py-24 text-center text-red-600 font-semibold text-2xl">
        Feature not found.
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{detail.title} | Thermo Packers</title>
        <meta name="description" content={detail.description.slice(0, 160)} />
        <link rel="canonical" href={`https://www.thermopackers.com/features/${slug}`} />
        <meta property="og:title" content={detail.title} />
        <meta property="og:description" content={detail.description.slice(0, 160)} />
        <meta property="og:url" content={`https://www.thermopackers.com/features/${slug}`} />
        <meta property="og:image" content={`https://www.thermopackers.com${detail.image}`} />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>

      <section className="py-20 px-6 md:px-12 max-w-5xl mx-auto animate-fade-in">
        <div className="relative overflow-hidden rounded-3xl shadow-2xl mb-10">
          <img
            src={detail.image}
            alt={detail.title}
            className="w-full h-80 md:h-[28rem] object-cover transform hover:scale-105 transition duration-700 ease-in-out"
          />
          <div className="absolute inset-0 bg-opacity-30 rounded-3xl"></div>
        </div>

        <div className="text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-800 mb-6 tracking-tight">
            {detail.title}
          </h1>
          <p className="text-lg md:text-xl text-gray-600 leading-relaxed max-w-3xl mx-auto">
            {detail.description}
          </p>
        </div>
      </section>
    </>
  );
};

export default FeatureDetail;
