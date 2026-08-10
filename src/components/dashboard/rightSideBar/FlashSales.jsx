import { FiClock, FiArrowRight } from "react-icons/fi";

function FlashSales() {
  return (
    <div className="rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 p-5 text-white shadow-lg">

      <div className="flex items-center gap-2">
        <FiClock size={22} />
        <h2 className="text-lg font-bold">Flash Sale</h2>
      </div>

      <p className="mt-3 text-sm text-orange-100">
        Up to
      </p>

      <h1 className="text-4xl font-bold mt-1">
        50% OFF
      </h1>

      <p className="mt-3 text-sm leading-6 text-orange-100">
        Don't miss today's hottest deals on phones, laptops and fashion.
      </p>

      {/* Countdown */}
      <div className="mt-5 grid grid-cols-4 gap-2">

        <div className="rounded-xl bg-white/20 p-2 text-center">
          <h3 className="font-bold text-lg">04</h3>
          <p className="text-xs">Hrs</p>
        </div>

        <div className="rounded-xl bg-white/20 p-2 text-center">
          <h3 className="font-bold text-lg">23</h3>
          <p className="text-xs">Min</p>
        </div>

        <div className="rounded-xl bg-white/20 p-2 text-center">
          <h3 className="font-bold text-lg">18</h3>
          <p className="text-xs">Sec</p>
        </div>

        <div className="rounded-xl bg-white/20 p-2 text-center">
          <h3 className="font-bold text-lg">12</h3>
          <p className="text-xs">Items</p>
        </div>

      </div>

      <button className="mt-6 w-full rounded-xl bg-white py-3 font-semibold text-red-600 flex items-center justify-center gap-2 hover:bg-gray-100 transition">
        Shop Flash Sales
        <FiArrowRight />
      </button>

    </div>
  );
}

export default FlashSales;