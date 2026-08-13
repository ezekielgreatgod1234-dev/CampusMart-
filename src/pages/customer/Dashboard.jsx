import CustomerLayout from "../../layouts/CustomerLayout";

import Greeting from "../../components/dashboard/Greeting";

import HeroBanner from "../../components/dashboard/HeroBanner";
import StatsCards from "../../components/dashboard/StatsCards";
import Categories from "../../components/dashboard/Categories";
import RecommendedProducts from "../../components/dashboard/RecommendedProducts";

import OrderSummary from "../../components/dashboard/rightSideBar/OrderSummary";
import RecentMessages from "../../components/dashboard/rightSideBar/RecentMessages";
import CampusBenefits from "../../components/dashboard/rightSideBar/CampusBenefits";
import CampusDeals from "../../components/dashboard/rightSideBar/CampusDeals";

import { FiHelpCircle, FiMessageCircle, FiShield } from "react-icons/fi";

function Dashboard({
  cartCount = 0,
  addToCart,
  wishlist = [],
  toggleWishlist,
  orders = [],
  unreadMessages = 0,
  messages = [],
}) {
  return (
    <CustomerLayout
      cartCount={cartCount}
      wishlist={wishlist}
      unreadMessages={unreadMessages}
    >
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* =====================================================
            MAIN CONTENT
        ===================================================== */}

        <div className="xl:col-span-9 space-y-6">
          <Greeting />

          <HeroBanner />

          {/* ================= STATS ================= */}

          <StatsCards
            cartCount={cartCount}
            wishlistCount={wishlist.length}
            ordersCount={orders.length}
            unreadMessages={unreadMessages}
          />

          <Categories />

          <RecommendedProducts
            addToCart={addToCart}
            wishlist={wishlist}
            toggleWishlist={toggleWishlist}
          />
        </div>

        {/* =====================================================
            RIGHT SIDEBAR
        ===================================================== */}

        <div className="xl:col-span-3 space-y-6">
          {/* ================= ORDER SUMMARY ================= */}

          <OrderSummary orders={orders} />

          {/* ================= RECENT MESSAGES ================= */}

         <RecentMessages messages={messages} />

          {/* ================= CAMPUS BENEFITS ================= */}

          <CampusBenefits />

          {/* ================= CAMPUS DEALS ================= */}

          <CampusDeals />

          {/* =================================================
              CAMPUSMART PROTECTION
          ================================================= */}

          <div
            className="
              bg-green-50
              border
              border-green-100
              rounded-2xl
              p-5
            "
          >
            <div className="flex items-start gap-3">
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
                  shrink-0
                "
              >
                <FiShield size={20} />
              </div>

              <div>
                <h2 className="font-bold text-gray-800">
                  Shop with confidence
                </h2>

                <p className="text-xs text-gray-500 mt-1 leading-5">
                  CampusMart helps students connect and trade safely around
                  campus.
                </p>
              </div>
            </div>
          </div>

          {/* =================================================
              NEED HELP
          ================================================= */}

          <div
            className="
              bg-white
              rounded-2xl
              border
              border-gray-100
              p-5
            "
          >
            <div className="flex items-start gap-3">
              <div
                className="
                  w-10
                  h-10
                  rounded-xl
                  bg-blue-100
                  text-blue-600
                  flex
                  items-center
                  justify-center
                  shrink-0
                "
              >
                <FiHelpCircle size={20} />
              </div>

              <div>
                <h2 className="font-bold text-gray-800">Need Help?</h2>

                <p className="text-xs text-gray-500 mt-1">
                  We're here to help you with your CampusMart experience.
                </p>
              </div>
            </div>

            <button
              type="button"
              className="
                w-full
                mt-4
                flex
                items-center
                justify-center
                gap-2
                bg-gray-50
                hover:bg-green-50
                hover:text-green-600
                text-gray-700
                py-2.5
                rounded-xl
                text-sm
                font-medium
                transition
              "
            >
              <FiMessageCircle />
              Contact Support
            </button>
          </div>
        </div>
      </div>
    </CustomerLayout>
  );
}

export default Dashboard;
