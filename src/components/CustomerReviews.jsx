import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay, Navigation } from "swiper/modules";
import { motion } from "framer-motion";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";

const reviews = [
  {
    name: "Tushar",
    rating: 5,
    date: "2023-07-06",
    comments: ["🛠 Excellent Service", "💯 Top Quality", "🛍 Great Product Variety"],
    avatar: "👨‍💼",
  },
  {
    name: "Sunil Shelar",
    rating: 4,
    date: "2022-08-29",
    comments: ["💰 Value For Money", "⚡ Quick Response", "🛍 Wide Product Range"],
    avatar: "👨‍💻",
  },
  {
    name: "Surendran",
    rating: 4,
    date: "2022-08-30",
    comments: ["🛠 Reliable Service", "⚡ Fast Delivery", "💯 Good Quality"],
    avatar: "👨‍🏭",
  },
  {
    name: "Sonal Maria",
    rating: 5,
    date: "2022-09-02",
    comments: ["🌟 Outstanding Service", "💎 Premium Quality", "🛍 Excellent Variety"],
    avatar: "👩‍💼",
  },
  {
    name: "Salman",
    rating: 5,
    date: "2023-12-13",
    comments: ["⚡ Instant Response", "🛠 Professional Service", "💯 Superb Quality"],
    avatar: "👨‍🔧",
  }
];

const StarRating = ({ rating }) => (
  <div className="flex gap-1 text-lg xs:text-xl">
    {[...Array(5)].map((_, i) => (
      <span 
        key={i} 
        className={i < rating ? "text-yellow-400 drop-shadow-sm" : "text-gray-300"}
      >
        ★
      </span>
    ))}
  </div>
);

const CustomerReviews = () => {
  return (
    <section className="relative px-4 xs:px-6 py-16 xs:py-20 sm:py-24 bg-gradient-to-br from-[#dff1ff] via-[#e3d5ff] to-[#fdfbff] overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 -z-10">
        <div className="w-[80vw] h-[80vw] bg-blue-200/20 rounded-full blur-3xl absolute -top-20 -left-20 animate-pulse-slow"></div>
        <div className="w-[60vw] h-[60vw] bg-purple-200/20 rounded-full blur-2xl absolute -bottom-20 -right-20 animate-float"></div>
      </div>

      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <motion.div
          className="text-center mb-12 xs:mb-16"
          initial={{ opacity: 0, y: -30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl xs:text-4xl sm:text-5xl font-extrabold text-gray-800 mb-4 drop-shadow-sm">
            What Our Customers Say 💬
          </h2>
          <p className="text-lg xs:text-xl text-gray-600 max-w-2xl mx-auto">
            Don't just take our word for it - hear from our satisfied clients
          </p>
        </motion.div>

        {/* Reviews Slider */}
        <div className="relative">
          <Swiper
            modules={[Pagination, Autoplay, Navigation]}
            spaceBetween={20}
            slidesPerView={1}
            loop={true}
            autoplay={{ 
              delay: 5000,
              disableOnInteraction: false,
              pauseOnMouseEnter: true,
            }}
            pagination={{ 
              clickable: true,
              dynamicBullets: true,
            }}
            navigation={{
              nextEl: '.swiper-button-next',
              prevEl: '.swiper-button-prev',
            }}
            breakpoints={{
              480: { 
                slidesPerView: 1.1,
                spaceBetween: 24,
              },
              640: { 
                slidesPerView: 1.3,
                spaceBetween: 24,
              },
              768: { 
                slidesPerView: 1.5,
                spaceBetween: 32,
              },
              1024: { 
                slidesPerView: 2,
                spaceBetween: 32,
              },
              1280: { 
                slidesPerView: 2.2,
                spaceBetween: 40,
              },
            }}
            className="pb-12 xs:pb-16"
          >
            {reviews.map((review, idx) => (
              <SwiperSlide key={idx}>
                <motion.div
                  className="h-full p-6 xs:p-8 rounded-3xl bg-white/80 backdrop-blur-md border border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.1)] transition-all duration-500 hover:shadow-2xl hover:scale-105 text-gray-900 flex flex-col"
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                  viewport={{ once: true }}
                >
                  {/* Header */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className="text-3xl xs:text-4xl flex-shrink-0">
                      {review.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-2 mb-2">
                        <h4 className="text-xl xs:text-2xl font-semibold text-gray-800 truncate">
                          {review.name}
                        </h4>
                        <StarRating rating={review.rating} />
                      </div>
                      <p className="text-sm text-gray-500">
                        {new Date(review.date).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Comments */}
                  <div className="flex flex-wrap gap-2 xs:gap-3 mt-auto">
                    {review.comments.map((tag, i) => (
                      <span
                        key={i}
                        className="bg-white/90 text-gray-800 text-sm px-3 xs:px-4 py-2 rounded-full shadow-sm border border-white/70 backdrop-blur-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Rating Text */}
                  <div className="mt-4 pt-4 border-t border-gray-200/50">
                    <p className="text-sm text-gray-600 italic">
                      {review.rating === 5 ? "Excellent service!" : 
                       review.rating === 4 ? "Great experience!" : 
                       "Good service!"}
                    </p>
                  </div>
                </motion.div>
              </SwiperSlide>
            ))}
          </Swiper>

          {/* Custom Navigation Buttons */}
          <div className="swiper-button-prev !hidden xs:!flex !w-10 !h-10 xs:!w-12 xs:!h-12 !bg-white/90 !backdrop-blur-md !rounded-full !shadow-lg hover:!scale-110 transition-transform duration-300"></div>
          <div className="swiper-button-next !hidden xs:!flex !w-10 !h-10 xs:!w-12 xs:!h-12 !bg-white/90 !backdrop-blur-md !rounded-full !shadow-lg hover:!scale-110 transition-transform duration-300"></div>
        </div>

       
      </div>
    </section>
  );
};

export default CustomerReviews;