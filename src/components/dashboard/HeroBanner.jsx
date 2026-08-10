import { FiArrowRight } from "react-icons/fi";

function HeroBanner() {
  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-green-600 via-green-700 to-green-800 shadow-lg">

      {/* Background Circles */}
      <div className="absolute -top-10 right-8 h-40 w-40 rounded-full bg-white/10"></div>
      <div className="absolute bottom-0 right-40 h-32 w-32 rounded-full bg-white/10"></div>
      <div className="absolute -bottom-10 right-0 h-52 w-52 rounded-full bg-white/5"></div>

      <div className="relative flex items-center justify-between gap-4 px-5 py-5 sm:px-6 sm:py-6 md:px-8 md:py-7">

        {/* LEFT */}
        <div className="w-3/5 lg:w-1/2">

          <p className="text-[10px] sm:text-xs md:text-sm text-green-100 font-medium">
            Big Savings on Campus
          </p>

          <h1 className="mt-2 text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight">
            Get up to
            <br />
            <span>30% OFF</span>
          </h1>

          <p className="mt-2 text-[11px] sm:text-sm md:text-base text-green-100">
            On electronics, fashion and more
          </p>

          <button className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-xs sm:text-sm font-semibold text-green-700 transition hover:scale-105">
            Shop Now
            <FiArrowRight />
          </button>

        </div>

        {/* RIGHT */}
        <div className="relative flex h-40 sm:h-44 md:h-52 lg:h-56 w-2/5 lg:w-1/2 items-center justify-center">

          {/* Main Circle */}
          <div className="absolute h-36 w-36 sm:h-44 sm:w-44 md:h-52 md:w-52 rounded-full bg-white/10"></div>

          {/* Backpack */}
          <div className="absolute top-1 right-6 rounded-xl bg-white p-2 shadow-xl text-xl sm:text-2xl md:text-3xl">
            🎒
          </div>

          {/* Shoes */}
          <div className="absolute bottom-2 left-3 rounded-xl bg-white p-2 shadow-xl text-xl sm:text-2xl md:text-3xl">
            👟
          </div>

          {/* Headphones */}
          <div className="absolute top-12 right-0 rounded-xl bg-white p-2 shadow-xl text-xl sm:text-2xl md:text-3xl">
            🎧
          </div>

        </div>

      </div>
    </section>
  );
}

export default HeroBanner;