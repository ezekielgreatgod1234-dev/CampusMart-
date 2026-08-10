import { FiArrowRight } from "react-icons/fi";

function WelcomeCard() {
  return (
    <section className="bg-gradient-to-r from-green-700 to-green-900 rounded-3xl p-8 text-white shadow-lg">
      <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
        <div>
          <p className="text-green-200 text-sm mb-2">
            Welcome back 👋
          </p>

          <h1 className="text-4xl font-bold">
            GreatGod
          </h1>

          <p className="mt-4 text-green-100 max-w-xl leading-7">
            Discover amazing products from students around your campus.
            Buy, sell and connect all in one place.
          </p>

          <button className="mt-6 bg-white text-green-700 px-6 py-3 rounded-full font-semibold flex items-center gap-2 hover:scale-105 transition">
            Explore Products
            <FiArrowRight />
          </button>
        </div>

        <div className="text-center">
          <div className="w-40 h-40 rounded-full bg-green-600 flex items-center justify-center text-6xl">
            🛍️
          </div>
        </div>
      </div>
    </section>
  );
}

export default WelcomeCard;