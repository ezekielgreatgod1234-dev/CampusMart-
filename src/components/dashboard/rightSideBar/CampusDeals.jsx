import { useNavigate } from "react-router-dom";
import { FiTag, FiArrowRight, FiShoppingBag } from "react-icons/fi";

function CampusDeals() {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">

      {/* HEADER */}
      <div className="flex items-center justify-between mb-4">

        <div className="flex items-center gap-3">

          <div
            className="
              w-10
              h-10
              rounded-xl
              bg-green-100
              text-green-600
              flex
              items-center
              justify-center
            "
          >
            <FiTag size={20} />
          </div>

          <div>
            <h2 className="font-bold text-gray-800">
              Campus Deals
            </h2>

            <p className="text-xs text-gray-400">
              Great deals around campus
            </p>
          </div>

        </div>

      </div>


      {/* DEAL 1 */}
      <div
        className="
          bg-green-50
          rounded-xl
          p-4
          mb-3
        "
      >

        <div className="flex items-start justify-between gap-3">

          <div>

            <span
              className="
                inline-block
                bg-green-600
                text-white
                text-[10px]
                font-bold
                px-2
                py-1
                rounded-full
              "
            >
              HOT DEAL
            </span>

            <h3 className="font-bold text-gray-800 mt-2">
              Student-friendly prices
            </h3>

            <p className="text-xs text-gray-500 mt-1 leading-5">
              Find affordable products from students
              around your campus.
            </p>

          </div>

          <div
            className="
              w-10
              h-10
              rounded-full
              bg-white
              text-green-600
              flex
              items-center
              justify-center
              shrink-0
            "
          >
            <FiShoppingBag size={19} />
          </div>

        </div>

        <button
          type="button"
          onClick={() => navigate("/browse-products")}
          className="
            flex
            items-center
            gap-1
            text-green-600
            text-xs
            font-semibold
            mt-3
            hover:gap-2
            transition-all
          "
        >
          Shop now
          <FiArrowRight size={14} />
        </button>

      </div>


      {/* DEAL 2 */}
      <div
        className="
          border
          border-gray-100
          rounded-xl
          p-4
        "
      >

        <div className="flex items-center justify-between">

          <div>

            <p className="text-xs text-gray-400">
              CampusMart
            </p>

            <h3 className="font-semibold text-gray-800 mt-1">
              Discover something new
            </h3>

          </div>

          <span
            className="
              bg-yellow-100
              text-yellow-700
              text-xs
              font-bold
              px-2
              py-1
              rounded-lg
            "
          >
            Explore
          </span>

        </div>

        <button
          type="button"
          onClick={() => navigate("/browse-products")}
          className="
            w-full
            mt-3
            border
            border-green-600
            text-green-600
            hover:bg-green-50
            py-2
            rounded-lg
            text-xs
            font-semibold
            transition
          "
        >
          Browse Products
        </button>

      </div>

    </div>
  );
}

export default CampusDeals;