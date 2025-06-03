import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay } from "swiper/modules";
import { motion } from "framer-motion";
import "swiper/css";
import "swiper/css/pagination";

const reviews = [
  {
    name: "Tushar",
    rating: 5,
    date: "2023-07-06",
    comments: ["🛠 Service", "💯 Quality", "🛍 Product Variety"]
  },
  {
    name: "Sunil Shelar",
    rating: 4,
    date: "2022-08-29",
    comments: ["💰 Value For Money", "⚡ Response", "🛍 Product Variety"]
  },
  {
    name: "Surendran",
    rating: 4,
    date: "2022-08-30",
    comments: ["🛠 Service", "⚡ Response", "💯 Quality"]
  },
  {
    name: "Sonal Maria",
    rating: 5,
    date: "2022-09-02",
    comments: ["🌟 Service", "💎 Quality", "🛍 Product Variety"]
  },
  {
    name: "Salman",
    rating: 5,
    date: "2023-12-13",
    comments: ["⚡ Response", "🛠 Service", "💯 Quality"]
  }
];

const StarRating = ({ rating }) => (
  <div className="flex gap-1 text-xl">
    {[...Array(5)].map((_, i) => (
      <span key={i} className={i < rating ? "text-yellow-400" : "text-gray-300"}>
        ★
      </span>
    ))}
  </div>
);

const CustomerReviews = () => {
  return (
    <section className="relative px-6 py-24 bg-gradient-to-br from-[#dff1ff] via-[#e3d5ff] to-[#fdfbff] min-h- overflow-hidden">
      <motion.h2
        className="text-5xl font-extrabold text-center text-[#2a2a2a] mb-16 drop-shadow-md"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
      >
        What Our Customers Say 💬
      </motion.h2>

      <Swiper
        modules={[Pagination, Autoplay]}
        spaceBetween={40}
        slidesPerView={1}
        loop
        autoplay={{ delay: 4000 }}
        pagination={{ clickable: true }}
        breakpoints={{
          768: { slidesPerView: 1.2 },
          1024: { slidesPerView: 2 },
        }}
      >
        {reviews.map((review, idx) => (
          <SwiperSlide key={idx}>
            <motion.div
              className="h-full p-10 rounded-3xl bg-white/20 backdrop-blur-md border border-white/30 shadow-[0_8px_30px_rgb(0,0,0,0.1)] transition-all hover:shadow-2xl hover:scale-[1.02] text-gray-900"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-2xl font-semibold">{review.name}</h4>
                <StarRating rating={review.rating} />
              </div>
              <p className="text-sm text-gray-600 mb-5 italic">
                {new Date(review.date).toDateString()}
              </p>
              <div className="flex flex-wrap gap-3">
                {review.comments.map((tag, i) => (
                  <span
                    key={i}
                    className="bg-white/70 text-gray-800 text-sm px-4 py-2 rounded-full shadow-sm border border-white/50"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </motion.div>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
};

export default CustomerReviews;
