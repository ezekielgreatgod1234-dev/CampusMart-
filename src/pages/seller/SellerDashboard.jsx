import { useState } from "react";

import { useNavigate, useLocation } from "react-router-dom";

import {
  FiGrid,
  FiPackage,
  FiBriefcase,
  FiShoppingBag,
  FiCalendar,
  FiMessageCircle,
  FiDollarSign,
  FiStar,
  FiBarChart2,
  FiTag,
  FiUser,
  FiSettings,
  FiLogOut,
  FiMenu,
  FiSearch,
  FiChevronDown,
  FiDownload,
  FiX,
  FiBell,
} from "react-icons/fi";

import { useAuth } from "../../context/AuthContext";

// =====================================================
// SELLER DASHBOARD
// =====================================================

function SellerDashboard({ unreadMessages = 0 }) {
  const navigate = useNavigate();
  const location = useLocation();

  const { firebaseUser } = useAuth();

  // =====================================================
  // SIDEBAR
  // =====================================================

  const [sidebarOpen, setSidebarOpen] = useState(false);

  // =====================================================
  // SELLER PROFILE
  // =====================================================

  const sellerFullName =
    firebaseUser?.displayName || "GreatGod Ezekiel";

  const sellerFirstName =
    sellerFullName.trim().split(/\s+/)[0] || "GreatGod";

  const sellerImage = firebaseUser?.photoURL || null;

  // =====================================================
  // MENU ITEMS
  // =====================================================

  const menuItems = [
    {
      label: "Dashboard",
      icon: FiGrid,
      path: "/seller-dashboard",
    },

    {
      label: "Products",
      icon: FiPackage,
      path: "/seller/products",
    },

    {
      label: "Services",
      icon: FiBriefcase,
      path: "/seller/services",
    },

    {
      label: "Orders",
      icon: FiShoppingBag,
      path: "/seller/orders",
    },

    {
      label: "Bookings",
      icon: FiCalendar,
      path: "/seller/bookings",
    },

    {
      label: "Messages",
      icon: FiMessageCircle,
      path: "/seller/messages",
      badge: unreadMessages,
    },

    {
      label: "Earnings",
      icon: FiDollarSign,
      path: "/seller/earnings",
    },

    {
      label: "Reviews",
      icon: FiStar,
      path: "/seller/reviews",
    },

    {
      label: "Analytics",
      icon: FiBarChart2,
      path: "/seller/analytics",
    },

    {
      label: "Promotions",
      icon: FiTag,
      path: "/seller/promotions",
      new: true,
    },

    {
      label: "Profile",
      icon: FiUser,
      path: "/seller/profile",
    },

    {
      label: "Settings",
      icon: FiSettings,
      path: "/seller/settings",
    },
  ];

  // =====================================================
  // ACTIVE MENU
  // =====================================================

  const isActive = (path) => {
    if (path === "/seller-dashboard") {
      return location.pathname === "/seller-dashboard";
    }

    return location.pathname.startsWith(path);
  };

  // =====================================================
  // NAVIGATION
  // =====================================================

  const handleNavigation = (path) => {
    setSidebarOpen(false);
    navigate(path);
  };

  // =====================================================
  // LOGOUT
  // =====================================================

  const handleLogout = () => {
    setSidebarOpen(false);
    navigate("/logout");
  };

  // =====================================================
  // EXPORT
  // =====================================================

  const handleExport = () => {
    console.log("Export seller report");
  };

  // =====================================================
  // NOTIFICATIONS
  // =====================================================

  const handleNotifications = () => {
    console.log("Open seller notifications");
  };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div
      className="
        min-h-screen
        bg-gray-50
        text-gray-800
        font-sans
        flex
        overflow-hidden
      "
    >
      {/* =================================================
          MOBILE SIDEBAR OVERLAY
      ================================================= */}

      {sidebarOpen && (
        <div
          className="
            fixed
            inset-0
            bg-black/40
            z-40
            lg:hidden
          "
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* =================================================
          SIDEBAR
      ================================================= */}

      <aside
        className={`
          fixed
          lg:static

          inset-y-0
          left-0

          z-50

          w-[230px]
          min-w-[230px]

          bg-[#00a63e]

          text-white

          flex
          flex-col

          transition-transform
          duration-300

          ${
            sidebarOpen
              ? "translate-x-0"
              : "-translate-x-full lg:translate-x-0"
          }
        `}
      >
        {/* =================================================
            SIDEBAR HEADER / LOGO
        ================================================= */}

        <div
          className="
            relative

            px-4
            pt-5
            pb-4

            flex-shrink-0
          "
        >
          {/* =================================================
              MOBILE CLOSE BUTTON
              TOP-RIGHT EDGE OF SIDEBAR
          ================================================= */}

          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
            className="
              lg:hidden

              absolute

              top-3
              right-1

              w-9
              h-9

              rounded-lg

              text-white

              hover:bg-white/10
              active:bg-white/20

              flex
              items-center
              justify-center

              flex-shrink-0

              transition

              z-20
            "
          >
            <FiX
              size={21}
              strokeWidth={2.5}
            />
          </button>

          {/* =================================================
              CAMPUSMART BRAND
          ================================================= */}

          <div
            className="
              flex
              items-center

              gap-2.5

              pr-10
            "
          >
            {/* =================================================
                CM LOGO
            ================================================= */}

            <div
              className="
                w-9
                h-9
                min-w-[36px]

                rounded-lg

                bg-[#008236]

                flex
                items-center
                justify-center

                shadow-xl
                shadow-black/50

                border
                border-white/10

                flex-shrink-0
              "
            >
              <span
                className="
                  text-white

                  text-[16px]

                  font-black

                  tracking-tight

                  drop-shadow-sm
                "
              >
                CM
              </span>
            </div>

            {/* =================================================
                CAMPUSMART BRAND TEXT
            ================================================= */}

            <div
              className="
                min-w-0
              "
            >
              <h1
                className="
                  text-[18px]
                  sm:text-[20px]

                  font-extrabold

                  tracking-tight

                  leading-none

                  whitespace-nowrap
                "
              >
                <span
                  className="
                    text-white
                  "
                >
                  Campus
                </span>

                <span
                  className="
                    text-green-300
                  "
                >
                  Mart
                </span>
              </h1>

              <p
                className="
                  text-[10px]

                  text-green-100

                  mt-1

                  whitespace-nowrap
                "
              >
                Sell. Connect. Grow.
              </p>
            </div>
          </div>
        </div>

        {/* =================================================
            NAVIGATION
        ================================================= */}

        <nav
          className="
            flex-1

            px-3
            py-2

            overflow-y-auto

            space-y-1
          "
        >
          {menuItems.map(
            ({
              label,
              icon: Icon,
              path,
              badge,
              new: isNew,
            }) => {
              const active = isActive(path);

              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => handleNavigation(path)}
                  className={`
                    w-full

                    flex
                    items-center
                    gap-2.5

                    px-3
                    py-2.5

                    rounded-lg

                    text-left

                    transition-all

                    ${
                      active
                        ? `
                          bg-white
                          text-[#008236]
                          shadow-sm
                          font-semibold
                        `
                        : `
                          text-white
                          hover:bg-white/10
                        `
                    }
                  `}
                >
                  {/* ICON */}

                  <Icon
                    size={18}
                    strokeWidth={active ? 2.5 : 2}
                    className="
                      flex-shrink-0
                    "
                  />

                  {/* LABEL */}

                  <span
                    className="
                      flex-1

                      text-[14px]

                      whitespace-nowrap
                    "
                  >
                    {label}
                  </span>

                  {/* MESSAGE BADGE */}

                  {badge > 0 && (
                    <span
                      className="
                        min-w-[20px]
                        h-[20px]

                        px-1.5

                        rounded-full

                        bg-red-500
                        text-white

                        text-[10px]
                        font-bold

                        flex
                        items-center
                        justify-center

                        flex-shrink-0
                      "
                    >
                      {badge}
                    </span>
                  )}

                  {/* NEW BADGE */}

                  {isNew && (
                    <span
                      className={`
                        px-1.5
                        py-0.5

                        rounded-full

                        text-[9px]

                        font-bold

                        flex-shrink-0

                        ${
                          active
                            ? "bg-green-100 text-green-700"
                            : "bg-green-500 text-white"
                        }
                      `}
                    >
                      New
                    </span>
                  )}
                </button>
              );
            }
          )}
        </nav>

        {/* =================================================
            PREMIUM CARD
        ================================================= */}

        <div
          className="
            px-3
            pb-3

            flex-shrink-0
          "
        >
          <div
            className="
              border
              border-green-300/30

              bg-green-900/20

              rounded-xl

              p-3

              text-center
            "
          >
            <div
              className="
                text-2xl
                mb-1
              "
            >
              👑
            </div>

            <h3
              className="
                font-bold
                text-sm
              "
            >
              Go Premium
            </h3>

            <p
              className="
                text-[10px]
                text-green-100
                leading-4
                mt-1
              "
            >
              Boost your products and services
              and reach more students.
            </p>

            <button
              type="button"
              onClick={() =>
                handleNavigation("/seller/promotions")
              }
              className="
                w-full

                mt-2

                h-9

                rounded-lg

                bg-white

                text-[#008236]

                font-bold

                text-xs

                hover:bg-green-50

                transition
              "
            >
              Upgrade Now
            </button>
          </div>
        </div>

        {/* =================================================
            LOGOUT
        ================================================= */}

        <div
          className="
            px-3
            pb-4

            flex-shrink-0
          "
        >
          <button
            type="button"
            onClick={handleLogout}
            className="
              w-full

              flex
              items-center
              gap-2.5

              px-3
              py-2.5

              rounded-lg

              text-white

              hover:bg-white/10

              transition

              text-left
            "
          >
            <FiLogOut size={18} />

            <span
              className="
                text-[14px]
              "
            >
              Logout
            </span>
          </button>
        </div>
      </aside>

      {/* =================================================
          MAIN AREA
      ================================================= */}

      <div
        className="
          flex-1

          min-w-0

          flex
          flex-col

          min-h-screen
        "
      >
        {/* =================================================
            TOP BAR
        ================================================= */}

        <header
          className="
            h-[70px]

            bg-[#007233]

            text-white

            flex
            items-center

            px-4
            sm:px-6
            lg:px-8

            gap-4

            flex-shrink-0
          "
        >
          {/* =================================================
              MOBILE MENU
          ================================================= */}

          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
            className="
              lg:hidden

              w-10
              h-10

              rounded-lg

              hover:bg-white/10

              flex
              items-center
              justify-center

              flex-shrink-0
            "
          >
            <FiMenu size={24} />
          </button>

          {/* =================================================
              SEARCH
          ================================================= */}

          <div
            className="
              flex-1

              max-w-[620px]
            "
          >
            <div
              className="
                h-11

                bg-white

                rounded-full

                flex
                items-center

                px-4

                gap-3

                text-gray-400
              "
            >
              <FiSearch
                size={19}
                className="
                  flex-shrink-0
                "
              />

              <input
                type="text"
                placeholder="Search products, services, orders, customers..."
                className="
                  flex-1

                  min-w-0

                  bg-transparent

                  outline-none

                  text-sm

                  text-gray-700

                  placeholder:text-gray-400
                "
              />
            </div>
          </div>

          {/* =================================================
              RIGHT SIDE
          ================================================= */}

          <div
            className="
              ml-auto

              flex
              items-center

              gap-1.5
              sm:gap-3
            "
          >
            {/* =================================================
                NOTIFICATIONS
            ================================================= */}

            <button
              type="button"
              onClick={handleNotifications}
              aria-label="Notifications"
              className="
                relative

                w-10
                h-10

                rounded-full

                hover:bg-white/10

                flex
                items-center
                justify-center

                transition
              "
            >
              <FiBell size={21} />

              <span
                className="
                  absolute

                  -top-0.5
                  -right-0.5

                  min-w-[18px]
                  h-[18px]

                  px-1

                  rounded-full

                  bg-red-500
                  text-white

                  text-[10px]
                  font-bold

                  flex
                  items-center
                  justify-center
                "
              >
                5
              </span>
            </button>

            {/* =================================================
                MESSAGES
            ================================================= */}

            <button
              type="button"
              onClick={() =>
                handleNavigation("/seller/messages")
              }
              aria-label="Messages"
              className="
                relative

                w-10
                h-10

                rounded-full

                hover:bg-white/10

                flex
                items-center
                justify-center

                transition
              "
            >
              <FiMessageCircle size={21} />

              {unreadMessages > 0 && (
                <span
                  className="
                    absolute

                    -top-0.5
                    -right-0.5

                    min-w-[18px]
                    h-[18px]

                    px-1

                    rounded-full

                    bg-red-500
                    text-white

                    text-[10px]
                    font-bold

                    flex
                    items-center
                    justify-center
                  "
                >
                  {unreadMessages}
                </span>
              )}
            </button>

            {/* =================================================
                SELLER PROFILE
            ================================================= */}

            <button
              type="button"
              onClick={() =>
                handleNavigation("/seller/profile")
              }
              className="
                flex
                items-center

                gap-2
                sm:gap-2.5

                ml-1

                hover:bg-white/10

                rounded-lg

                px-1.5
                py-1.5

                transition
              "
            >
              {/* AVATAR */}

              {sellerImage ? (
                <img
                  src={sellerImage}
                  alt={sellerFullName}
                  className="
                    w-9
                    h-9

                    rounded-full

                    object-cover

                    border-2
                    border-white/30
                  "
                />
              ) : (
                <div
                  className="
                    w-9
                    h-9

                    rounded-full

                    bg-gray-200
                    text-gray-700

                    flex
                    items-center
                    justify-center

                    font-bold
                    text-sm

                    border-2
                    border-white/30
                  "
                >
                  {sellerFirstName
                    ?.charAt(0)
                    ?.toUpperCase()}
                </div>
              )}

              {/* NAME */}

              <div
                className="
                  hidden
                  sm:block

                  text-left
                "
              >
                <p
                  className="
                    text-xs

                    font-bold

                    leading-4

                    max-w-[120px]

                    truncate
                  "
                >
                  {sellerFirstName}
                </p>

                <p
                  className="
                    text-[10px]

                    text-green-100

                    mt-0.5
                  "
                >
                  Seller
                </p>
              </div>

              <FiChevronDown
                size={16}
                className="
                  hidden
                  sm:block
                "
              />
            </button>
          </div>
        </header>

        {/* =================================================
            DASHBOARD CONTENT
        ================================================= */}

        <main
          className="
            flex-1

            overflow-y-auto

            bg-gray-50

            px-4
            sm:px-6
            lg:px-8

            py-6
            sm:py-7
            lg:py-8

            font-sans
          "
        >
          {/* =================================================
              WELCOME HEADER
          ================================================= */}

          <div
            className="
              flex
              flex-col

              lg:flex-row

              lg:items-center
              lg:justify-between

              gap-5

              mb-7
            "
          >
            {/* WELCOME */}

            <div>
              <h1
                className="
                  text-3xl

                  font-bold

                  text-gray-800
                "
              >
                Welcome back, {sellerFirstName}!
              </h1>

              <p
                className="
                  font-sans

                  text-sm
                  sm:text-base

                  text-gray-500

                  mt-1.5
                "
              >
                Here's what's happening with your
                business today.
              </p>
            </div>

            {/* ACTIONS */}

            <div
              className="
                flex

                flex-wrap

                items-center

                gap-3
              "
            >
              {/* DATE */}

              <button
                type="button"
                className="
                  h-11

                  px-4

                  bg-white

                  border
                  border-gray-200

                  rounded-xl

                  flex
                  items-center
                  gap-3

                  text-sm
                  font-medium
                  text-gray-600

                  hover:border-green-300
                  hover:text-[#008236]

                  transition

                  shadow-sm
                "
              >
                <span
                  className="
                    text-gray-500
                  "
                >
                  📅
                </span>

                <span>
                  May 19 – May 25, 2025
                </span>

                <FiChevronDown size={16} />
              </button>

              {/* EXPORT */}

              <button
                type="button"
                onClick={handleExport}
                className="
                  h-11

                  px-5

                  bg-[#008236]

                  hover:bg-[#006f2e]

                  text-white

                  rounded-xl

                  flex
                  items-center
                  justify-center

                  gap-2

                  text-sm
                  font-semibold

                  transition

                  shadow-sm
                "
              >
                <FiDownload size={18} />

                <span>
                  Export Report
                </span>
              </button>
            </div>
          </div>

          {/* =================================================
              STATISTICS
          ================================================= */}

          <div
            className="
              grid

              grid-cols-1
              sm:grid-cols-2
              lg:grid-cols-3
              xl:grid-cols-5

              gap-4
            "
          >
            {[
              "Total Sales",
              "Total Orders",
              "Total Bookings",
              "Total Earnings",
              "Store Views",
            ].map((title) => (
              <div
                key={title}
                className="
                  bg-white

                  rounded-2xl

                  border
                  border-gray-100

                  p-5

                  min-h-[125px]

                  shadow-sm

                  flex
                  flex-col
                  justify-center
                "
              >
                <p
                  className="
                    text-sm

                    text-gray-500
                  "
                >
                  {title}
                </p>

                <div
                  className="
                    h-7
                    w-24

                    mt-3

                    rounded

                    bg-gray-100

                    animate-pulse
                  "
                />

                <p
                  className="
                    text-xs

                    text-gray-300

                    mt-2
                  "
                >
                  Statistics coming next
                </p>
              </div>
            ))}
          </div>

          {/* =================================================
              NEXT DASHBOARD SECTION
          ================================================= */}

          <div
            className="
              mt-5

              bg-white

              border
              border-gray-100

              rounded-2xl

              min-h-[360px]

              flex
              items-center
              justify-center

              shadow-sm
            "
          >
            <div
              className="
                text-center

                px-6
              "
            >
              <div
                className="
                  w-14
                  h-14

                  mx-auto

                  rounded-2xl

                  bg-green-50

                  text-[#008236]

                  flex
                  items-center
                  justify-center

                  mb-4
                "
              >
                <FiBarChart2 size={27} />
              </div>

              <h2
                className="
                  text-lg

                  font-bold

                  text-gray-800
                "
              >
                Dashboard Overview
              </h2>

              <p
                className="
                  text-sm

                  text-gray-500

                  mt-1

                  max-w-md

                  mx-auto
                "
              >
                Your sales chart, recent orders,
                earnings, bookings, products and
                store performance will appear here.
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default SellerDashboard;