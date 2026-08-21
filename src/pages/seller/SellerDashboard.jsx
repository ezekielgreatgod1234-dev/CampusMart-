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
  FiMoreHorizontal,
  FiPlus,
  FiTrendingUp,
  FiClock,
  FiCheckCircle,
  FiCreditCard,
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
  // DASHBOARD STATISTICS
  // =====================================================

  const statistics = [
    {
      title: "Total Sales",
      value: "₦248,500",
      icon: FiDollarSign,
      iconBg: "bg-green-50",
      iconColor: "text-[#008236]",
    },
    {
      title: "Total Orders",
      value: "128",
      icon: FiShoppingBag,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
    },
    {
      title: "Total Bookings",
      value: "46",
      icon: FiCalendar,
      iconBg: "bg-purple-50",
      iconColor: "text-purple-600",
    },
    {
      title: "Total Earnings",
      value: "₦186,200",
      icon: FiCreditCard,
      iconBg: "bg-orange-50",
      iconColor: "text-orange-600",
    },
  ];

  // =====================================================
  // MODERN SALES GRAPH DATA
  // =====================================================

  const salesData = [
    {
      day: "Mon",
      value: 42,
      revenue: "₦32,500",
    },
    {
      day: "Tue",
      value: 58,
      revenue: "₦41,800",
    },
    {
      day: "Wed",
      value: 47,
      revenue: "₦36,200",
    },
    {
      day: "Thu",
      value: 76,
      revenue: "₦52,400",
    },
    {
      day: "Fri",
      value: 63,
      revenue: "₦44,900",
    },
    {
      day: "Sat",
      value: 91,
      revenue: "₦68,700",
    },
    {
      day: "Sun",
      value: 82,
      revenue: "₦61,900",
    },
  ];

  // =====================================================
  // RECENT ORDERS
  // =====================================================

  const recentOrders = [
    {
      id: "#CM-1048",
      customer: "Daniel Okoro",
      product: "HP EliteBook Laptop",
      quantity: 1,
      amount: "₦285,000",
      status: "Delivered",
      date: "Aug 21, 2026",
    },
    {
      id: "#CM-1047",
      customer: "Chiamaka Grace",
      product: "Wireless Headphones",
      quantity: 2,
      amount: "₦18,500",
      status: "Pending",
      date: "Aug 20, 2026",
    },
    {
      id: "#CM-1046",
      customer: "Michael James",
      product: "Graphic Design Service",
      quantity: 1,
      amount: "₦25,000",
      status: "Delivered",
      date: "Aug 19, 2026",
    },
    {
      id: "#CM-1045",
      customer: "Samuel David",
      product: "USB-C Fast Charger",
      quantity: 1,
      amount: "₦7,500",
      status: "Pending",
      date: "Aug 18, 2026",
    },
  ];

  // =====================================================
  // TOP PRODUCTS
  // =====================================================

  const topProducts = [
    {
      name: "HP EliteBook Laptop",
      category: "Electronics",
      sales: "32 sales",
      amount: "₦9,120,000",
      percentage: 82,
    },
    {
      name: "Wireless Headphones",
      category: "Accessories",
      sales: "24 sales",
      amount: "₦444,000",
      percentage: 67,
    },
    {
      name: "Graphic Design Service",
      category: "Services",
      sales: "18 bookings",
      amount: "₦450,000",
      percentage: 54,
    },
  ];

  // =====================================================
  // MODERN GRAPH HELPERS
  // =====================================================

  const graphWidth = 1000;
  const graphHeight = 300;

  const graphPaddingLeft = 25;
  const graphPaddingRight = 25;
  const graphPaddingTop = 28;
  const graphPaddingBottom = 35;

  const usableWidth =
    graphWidth -
    graphPaddingLeft -
    graphPaddingRight;

  const usableHeight =
    graphHeight -
    graphPaddingTop -
    graphPaddingBottom;

  const maxValue = 100;

  const points = salesData.map((item, index) => {
    const x =
      graphPaddingLeft +
      (index * usableWidth) /
        (salesData.length - 1);

    const y =
      graphPaddingTop +
      usableHeight -
      (item.value / maxValue) *
        usableHeight;

    return {
      ...item,
      x,
      y,
    };
  });

  // =====================================================
  // SMOOTH CURVE PATH
  // =====================================================

  const createSmoothPath = (dataPoints) => {
    if (!dataPoints.length) return "";

    let path = `M ${dataPoints[0].x} ${dataPoints[0].y}`;

    for (let i = 0; i < dataPoints.length - 1; i++) {
      const current = dataPoints[i];
      const next = dataPoints[i + 1];

      const controlPointX =
        (current.x + next.x) / 2;

      path += `
        C
        ${controlPointX} ${current.y},
        ${controlPointX} ${next.y},
        ${next.x} ${next.y}
      `;
    }

    return path;
  };

  const linePath = createSmoothPath(points);

  const baselineY =
    graphHeight - graphPaddingBottom;

  const areaPath = `
    ${linePath}
    L ${points[points.length - 1].x} ${baselineY}
    L ${points[0].x} ${baselineY}
    Z
  `;

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div
      className="
        min-h-screen
        w-full
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
            bg-black/50
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

          w-[291px]
          min-w-[285px]

          lg:w-[291px]
          lg:min-w-[250px]

          bg-green-700
          text-white

          flex
          flex-col

          shadow-2xl
          lg:shadow-none

          transition-transform
          duration-300
          ease-in-out

          ${
            sidebarOpen
              ? "translate-x-0"
              : "-translate-x-full lg:translate-x-0"
          }
        `}
      >
        {/* =================================================
            SIDEBAR HEADER
        ================================================= */}

        <div
          className="
            relative
            px-5
            pt-19
            lg:pt-5
            pb-4
            flex-shrink-0
          "
        >
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
            className="
              lg:hidden
              absolute
              top-3
              right-3
              w-9
              h-9
              rounded-lg
              text-white
              hover:bg-white/10
              active:bg-white/20
              flex
              items-center
              justify-center
              transition
              z-20
            "
          >
            <FiX
              size={21}
              strokeWidth={2.5}
            />
          </button>

          {/* BRAND */}

          <div
            className="
              flex
              items-center
              gap-3
              pr-10
            "
          >
            <div
              className="
                w-10
                h-10
                min-w-[40px]
                rounded-xl
                bg-[#008236]
                flex
                items-center
                justify-center
                shadow-lg
                shadow-black/30
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
                "
              >
                CM
              </span>
            </div>

            <div className="min-w-0">
              <h1
                className="
                  text-[30px]
                  font-extrabold
                  tracking-tight
                  leading-none
                  whitespace-nowrap
                "
              >
                <span className="text-white">
                  Campus
                </span>

                <span className="text-green-300">
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
            px-4
            py-3

            overflow-y-auto
            overflow-x-hidden

            overscroll-contain

            flex
            flex-col

            justify-start

            gap-1
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
                  onClick={() =>
                    handleNavigation(path)
                  }
                  className={`
                    w-full

                    flex
                    items-center
                    gap-3

                    px-3.5
                    py-3

                    rounded-xl

                    text-left

                    transition-all

                    flex-shrink-0

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
                          active:bg-white/20
                        `
                    }
                  `}
                >
                  <Icon
                    size={19}
                    strokeWidth={
                      active ? 2.5 : 2
                    }
                    className="flex-shrink-0"
                  />

                  <span
                    className="
                      flex-1
                      text-[14px]
                      whitespace-nowrap
                    "
                  >
                    {label}
                  </span>

                  {badge > 0 && (
                    <span
                      className="
                        min-w-[21px]
                        h-[21px]
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
            px-4
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
              p-3.5
              text-center
            "
          >
            <div className="text-2xl mb-1">
              👑
            </div>

            <h3 className="font-bold text-sm">
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
              Boost your products and
              services and reach more
              students.
            </p>

            <button
              type="button"
              onClick={() =>
                handleNavigation(
                  "/seller/promotions"
                )
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
                active:bg-green-100
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
            px-4
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
              gap-3
              px-3.5
              py-3
              rounded-xl
              text-white
              hover:bg-white/10
              active:bg-white/20
              transition
              text-left
            "
          >
            <FiLogOut size={19} />

            <span className="text-[14px]">
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
          w-full
        "
      >
        {/* =================================================
            TOP BAR
        ================================================= */}

        <header
          className="
            min-h-[70px]
            bg-[#007233]
            text-white

            flex
            items-center

            px-3
            sm:px-5
            lg:px-8

            py-3

            gap-2
            sm:gap-4

            flex-shrink-0
          "
        >
          {/* MOBILE MENU */}

          <button
            type="button"
            onClick={() =>
              setSidebarOpen(true)
            }
            aria-label="Open sidebar"
            className="
              lg:hidden

              w-10
              h-10
              min-w-[40px]

              rounded-lg

              hover:bg-white/10
              active:bg-white/20

              flex
              items-center
              justify-center

              flex-shrink-0
            "
          >
            <FiMenu size={24} />
          </button>

          {/* SEARCH */}

          <div
            className="
              flex-1
              min-w-0
              max-w-[620px]
            "
          >
            <div
              className="
                h-10
                sm:h-11

                bg-white
                rounded-full

                flex
                items-center

                px-3
                sm:px-4

                gap-2
                sm:gap-3

                text-gray-400
              "
            >
              <FiSearch
                size={18}
                className="flex-shrink-0"
              />

              <input
                type="text"
                placeholder="Search products, services..."
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

          {/* RIGHT SIDE */}

          <div
            className="
              ml-auto
              flex
              items-center
              gap-0.5
              sm:gap-2
            "
          >
            {/* NOTIFICATIONS */}

            <button
              type="button"
              onClick={
                handleNotifications
              }
              aria-label="Notifications"
              className="
                relative
                w-9
                h-9
                sm:w-10
                sm:h-10
                rounded-full
                hover:bg-white/10
                active:bg-white/20
                flex
                items-center
                justify-center
                transition
                flex-shrink-0
              "
            >
              <FiBell size={20} />

              <span
                className="
                  absolute
                  -top-0.5
                  -right-0.5

                  min-w-[17px]
                  h-[17px]

                  px-1

                  rounded-full

                  bg-red-500
                  text-white

                  text-[9px]
                  font-bold

                  flex
                  items-center
                  justify-center
                "
              >
                5
              </span>
            </button>

            {/* MESSAGES */}

            <button
              type="button"
              onClick={() =>
                handleNavigation(
                  "/seller/messages"
                )
              }
              aria-label="Messages"
              className="
                relative
                w-9
                h-9
                sm:w-10
                sm:h-10
                rounded-full
                hover:bg-white/10
                active:bg-white/20
                flex
                items-center
                justify-center
                transition
                flex-shrink-0
              "
            >
              <FiMessageCircle size={20} />

              {unreadMessages > 0 && (
                <span
                  className="
                    absolute
                    -top-0.5
                    -right-0.5

                    min-w-[17px]
                    h-[17px]

                    px-1

                    rounded-full

                    bg-red-500
                    text-white

                    text-[9px]
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

            {/* SELLER PROFILE */}

            <button
              type="button"
              onClick={() =>
                handleNavigation(
                  "/seller/profile"
                )
              }
              className="
                flex
                items-center
                gap-2
                ml-0.5
                hover:bg-white/10
                active:bg-white/20
                rounded-lg
                px-1
                sm:px-1.5
                py-1.5
                transition
                flex-shrink-0
              "
            >
              {sellerImage ? (
                <img
                  src={sellerImage}
                  alt={sellerFullName}
                  className="
                    w-8
                    h-8
                    sm:w-9
                    sm:h-9
                    rounded-full
                    object-cover
                    border-2
                    border-white/30
                  "
                />
              ) : (
                <div
                  className="
                    w-8
                    h-8
                    sm:w-9
                    sm:h-9

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
                className="hidden sm:block"
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
            overflow-x-hidden

            bg-gray-50

            px-3
            sm:px-5
            md:px-6
            lg:px-8

            py-5
            sm:py-6
            lg:py-8

            font-sans
          "
        >
          {/* =================================================
              WELCOME HEADER
          ================================================= */}

          <section className="mb-6 sm:mb-7">
            <div
              className="
                bg-gradient-to-r
                from-[#007233]
                to-[#008f3f]

                rounded-2xl

                p-5
                sm:p-6
                lg:p-7

                text-white

                shadow-sm

                relative
                overflow-hidden
              "
            >
              <div
                className="
                  absolute
                  -right-10
                  -top-16
                  w-48
                  h-48
                  rounded-full
                  bg-white/10
                "
              />

              <div
                className="
                  absolute
                  right-16
                  -bottom-24
                  w-40
                  h-40
                  rounded-full
                  bg-white/5
                "
              />

              <div
                className="
                  relative
                  z-10

                  flex
                  flex-col
                  lg:flex-row

                  lg:items-center
                  lg:justify-between

                  gap-5
                "
              >
                <div>
                  <div
                    className="
                      inline-flex
                      items-center
                      gap-2

                      px-3
                      py-1

                      rounded-full

                      bg-white/10

                      border
                      border-white/10

                      text-[11px]
                      font-medium

                      mb-3
                    "
                  >
                    <span
                      className="
                        w-1.5
                        h-1.5
                        rounded-full
                        bg-green-300
                      "
                    />

                    Seller Dashboard
                  </div>

                  <h1
                    className="
                      text-2xl
                      sm:text-3xl

                      font-bold

                      tracking-tight
                    "
                  >
                    Welcome back,{" "}
                    {sellerFirstName}!
                  </h1>

                  <p
                    className="
                      text-sm
                      sm:text-base

                      text-green-50

                      mt-1.5

                      max-w-xl

                      leading-6
                    "
                  >
                    Here's what's happening
                    with your CampusMart
                    business today.
                  </p>
                </div>

                <div
                  className="
                    flex
                    flex-col
                    sm:flex-row
                    gap-3
                  "
                >
                  <button
                    type="button"
                    className="
                      h-11
                      px-4

                      bg-white

                      text-[#007233]

                      rounded-xl

                      flex
                      items-center
                      justify-center

                      gap-2

                      text-sm
                      font-semibold

                      hover:bg-green-50

                      transition

                      whitespace-nowrap
                    "
                  >
                    <span>📅</span>

                    This Week

                    <FiChevronDown
                      size={15}
                    />
                  </button>

                  <button
                    type="button"
                    onClick={handleExport}
                    className="
                      h-11
                      px-4

                      bg-white/10

                      border
                      border-white/20

                      text-white

                      rounded-xl

                      flex
                      items-center
                      justify-center

                      gap-2

                      text-sm
                      font-semibold

                      hover:bg-white/20

                      transition

                      whitespace-nowrap
                    "
                  >
                    <FiDownload
                      size={17}
                    />

                    Export Report
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* =================================================
              STATISTICS
          ================================================= */}

          <section
            className="
              grid

              grid-cols-1
              min-[420px]:grid-cols-2
              lg:grid-cols-4

              gap-3
              sm:gap-4

              mb-5
              sm:mb-6
            "
          >
            {statistics.map(
              ({
                title,
                value,
                icon: Icon,
                iconBg,
                iconColor,
              }) => (
                <div
                  key={title}
                  className="
                    bg-white

                    rounded-2xl

                    border
                    border-gray-100

                    p-4
                    sm:p-5

                    shadow-sm

                    hover:shadow-md

                    transition-shadow

                    min-w-0
                  "
                >
                  <div
                    className="
                      flex
                      items-start
                      justify-between
                      gap-3
                    "
                  >
                    <div
                      className={`
                        w-10
                        h-10

                        rounded-xl

                        ${iconBg}
                        ${iconColor}

                        flex
                        items-center
                        justify-center

                        flex-shrink-0
                      `}
                    >
                      <Icon
                        size={19}
                        strokeWidth={2.3}
                      />
                    </div>

                    <button
                      type="button"
                      className="
                        text-gray-400
                        hover:text-gray-600
                        transition
                      "
                    >
                      <FiMoreHorizontal
                        size={18}
                      />
                    </button>
                  </div>

                  <p
                    className="
                      text-xs
                      sm:text-sm

                      text-gray-500

                      mt-4
                    "
                  >
                    {title}
                  </p>

                  <h2
                    className="
                      text-xl
                      sm:text-2xl

                      font-bold

                      text-gray-800

                      tracking-tight

                      truncate

                      mt-1
                    "
                  >
                    {value}
                  </h2>
                </div>
              )
            )}
          </section>

          {/* =================================================
              MODERN SALES GRAPH
          ================================================= */}

          <section className="mb-5 sm:mb-6">
            <div
              className="
                bg-white

                rounded-2xl

                border
                border-gray-100

                shadow-sm

                overflow-hidden
              "
            >
              {/* GRAPH HEADER */}

              <div
                className="
                  p-5
                  sm:p-6

                  border-b
                  border-gray-100

                  flex
                  flex-col
                  sm:flex-row

                  sm:items-center
                  sm:justify-between

                  gap-4
                "
              >
                <div>
                  <div
                    className="
                      flex
                      items-center
                      gap-2
                    "
                  >
                    <h2
                      className="
                        text-base
                        sm:text-lg

                        font-bold

                        text-gray-800
                      "
                    >
                      Sales Overview
                    </h2>

                    <span
                      className="
                        hidden
                        sm:inline-flex

                        items-center
                        gap-1

                        px-2
                        py-1

                        rounded-full

                        bg-green-50

                        text-[#008236]

                        text-[10px]

                        font-bold
                      "
                    >
                      <FiTrendingUp
                        size={11}
                      />

                      12.5%
                    </span>
                  </div>

                  <p
                    className="
                      text-xs
                      sm:text-sm

                      text-gray-500

                      mt-1
                    "
                  >
                    Revenue movement across
                    the current week.
                  </p>
                </div>

                <div
                  className="
                    flex
                    items-center
                    gap-2
                  "
                >
                  <button
                    type="button"
                    className="
                      flex
                      items-center
                      gap-1.5

                      px-3

                      h-9

                      rounded-lg

                      bg-gray-50

                      text-xs
                      font-medium

                      text-gray-600

                      hover:bg-green-50
                      hover:text-[#008236]

                      transition
                    "
                  >
                    7 Days

                    <FiChevronDown
                      size={14}
                    />
                  </button>

                  <button
                    type="button"
                    className="
                      hidden
                      sm:flex

                      items-center
                      justify-center

                      w-9
                      h-9

                      rounded-lg

                      bg-gray-50

                      text-gray-500

                      hover:bg-green-50
                      hover:text-[#008236]

                      transition
                    "
                  >
                    <FiMoreHorizontal
                      size={17}
                    />
                  </button>
                </div>
              </div>

              <div className="p-5 sm:p-6">
                {/* REVENUE SUMMARY */}

                <div
                  className="
                    flex
                    flex-col
                    sm:flex-row

                    sm:items-end
                    sm:justify-between

                    gap-4

                    mb-5
                  "
                >
                  <div>
                    <div
                      className="
                        flex
                        items-center
                        gap-2
                      "
                    >
                      <span
                        className="
                          w-2
                          h-2

                          rounded-full

                          bg-[#008236]

                          shadow-[0_0_0_4px_rgba(0,130,54,0.10)]
                        "
                      />

                      <p
                        className="
                          text-xs
                          text-gray-500
                        "
                      >
                        Total revenue
                      </p>
                    </div>

                    <h3
                      className="
                        text-2xl
                        sm:text-3xl

                        font-bold

                        text-gray-800

                        tracking-tight

                        mt-1
                      "
                    >
                      ₦248,500
                    </h3>

                    <div
                      className="
                        flex
                        items-center
                        gap-1.5

                        mt-1.5
                      "
                    >
                      <span
                        className="
                          inline-flex
                          items-center
                          gap-1

                          px-1.5
                          py-0.5

                          rounded-md

                          bg-green-50

                          text-[#008236]

                          text-[10px]

                          font-bold
                        "
                      >
                        <FiTrendingUp
                          size={11}
                        />

                        12.5%
                      </span>

                      <span
                        className="
                          text-xs
                          text-gray-400
                        "
                      >
                        vs. last week
                      </span>
                    </div>
                  </div>

                  <div
                    className="
                      flex
                      items-center
                      gap-4
                    "
                  >
                    <div>
                      <p
                        className="
                          text-[10px]
                          text-gray-400
                        "
                      >
                        Best day
                      </p>

                      <p
                        className="
                          text-xs
                          font-semibold
                          text-gray-700
                          mt-0.5
                        "
                      >
                        Saturday
                      </p>
                    </div>

                    <div
                      className="
                        w-px
                        h-8
                        bg-gray-100
                      "
                    />

                    <div>
                      <p
                        className="
                          text-[10px]
                          text-gray-400
                        "
                      >
                        Peak sales
                      </p>

                      <p
                        className="
                          text-xs
                          font-semibold
                          text-gray-700
                          mt-0.5
                        "
                      >
                        91%
                      </p>
                    </div>
                  </div>
                </div>

                {/* GRAPH */}

                <div
                  className="
                    w-full
                    h-[280px]

                    relative

                    overflow-hidden
                  "
                >
                  <svg
                    viewBox={`0 0 ${graphWidth} ${graphHeight}`}
                    preserveAspectRatio="none"
                    className="
                      absolute
                      inset-0

                      w-full
                      h-full

                      overflow-visible
                    "
                  >
                    <defs>
                      {/* AREA GRADIENT */}

                      <linearGradient
                        id="salesAreaGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="#008236"
                          stopOpacity="0.24"
                        />

                        <stop
                          offset="65%"
                          stopColor="#008236"
                          stopOpacity="0.07"
                        />

                        <stop
                          offset="100%"
                          stopColor="#008236"
                          stopOpacity="0"
                        />
                      </linearGradient>

                      {/* LINE GRADIENT */}

                      <linearGradient
                        id="salesLineGradient"
                        x1="0"
                        y1="0"
                        x2="1"
                        y2="0"
                      >
                        <stop
                          offset="0%"
                          stopColor="#006f2e"
                        />

                        <stop
                          offset="50%"
                          stopColor="#008236"
                        />

                        <stop
                          offset="100%"
                          stopColor="#00a84f"
                        />
                      </linearGradient>

                      {/* SHADOW */}

                      <filter
                        id="salesLineShadow"
                        x="-20%"
                        y="-20%"
                        width="140%"
                        height="160%"
                      >
                        <feDropShadow
                          dx="0"
                          dy="5"
                          stdDeviation="5"
                          floodColor="#008236"
                          floodOpacity="0.16"
                        />
                      </filter>
                    </defs>

                    {/* HORIZONTAL GRID */}

                    {[0, 25, 50, 75, 100].map(
                      (value) => {
                        const y =
                          graphPaddingTop +
                          usableHeight -
                          (value / maxValue) *
                            usableHeight;

                        return (
                          <line
                            key={value}
                            x1={
                              graphPaddingLeft
                            }
                            x2={
                              graphWidth -
                              graphPaddingRight
                            }
                            y1={y}
                            y2={y}
                            stroke="#eef2f3"
                            strokeWidth="1"
                            strokeDasharray="3 6"
                          />
                        );
                      }
                    )}

                    {/* VERTICAL GRID */}

                    {points.map(
                      (point) => (
                        <line
                          key={`vertical-${point.day}`}
                          x1={point.x}
                          x2={point.x}
                          y1={
                            graphPaddingTop
                          }
                          y2={baselineY}
                          stroke="#f5f7f7"
                          strokeWidth="1"
                          strokeDasharray="2 7"
                        />
                      )
                    )}

                    {/* AREA */}

                    <path
                      d={areaPath}
                      fill="url(#salesAreaGradient)"
                    />

                    {/* SHADOW LINE */}

                    <path
                      d={linePath}
                      fill="none"
                      stroke="#008236"
                      strokeWidth="7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      opacity="0.10"
                      filter="url(#salesLineShadow)"
                    />

                    {/* MAIN LINE */}

                    <path
                      d={linePath}
                      fill="none"
                      stroke="url(#salesLineGradient)"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                    {/* DATA POINTS */}

                    {points.map(
                      (point, index) => {
                        const isLast =
                          index ===
                          points.length - 1;

                        return (
                          <g
                            key={point.day}
                          >
                            {/* Outer glow */}

                            <circle
                              cx={point.x}
                              cy={point.y}
                              r={
                                isLast
                                  ? 11
                                  : 8
                              }
                              fill="#008236"
                              opacity={
                                isLast
                                  ? 0.10
                                  : 0.06
                              }
                            />

                            {/* White center */}

                            <circle
                              cx={point.x}
                              cy={point.y}
                              r={
                                isLast
                                  ? 5
                                  : 4
                              }
                              fill="white"
                              stroke="#008236"
                              strokeWidth="2.5"
                            />

                            <title>
                              {point.day}:{" "}
                              {point.revenue}
                            </title>
                          </g>
                        );
                      }
                    )}
                  </svg>

                  {/* Y AXIS LABELS */}

                  <div
                    className="
                      absolute
                      left-0
                      top-0
                      bottom-8

                      w-8

                      flex
                      flex-col
                      justify-between

                      pointer-events-none
                    "
                  >
                    {[100, 75, 50, 25, 0].map(
                      (value) => (
                        <span
                          key={value}
                          className="
                            text-[9px]
                            sm:text-[10px]
                            text-gray-400
                            leading-none
                          "
                        >
                          {value}
                        </span>
                      )
                    )}
                  </div>

                  {/* DAY LABELS */}

                  <div
                    className="
                      absolute
                      bottom-0
                      left-8
                      right-0

                      flex
                      justify-between

                      px-1
                    "
                  >
                    {salesData.map(
                      ({ day }) => (
                        <span
                          key={day}
                          className="
                            text-[10px]
                            sm:text-xs

                            text-gray-400

                            font-medium
                          "
                        >
                          {day}
                        </span>
                      )
                    )}
                  </div>
                </div>

                {/* GRAPH FOOTER */}

                <div
                  className="
                    mt-4
                    pt-4

                    border-t
                    border-gray-100

                    flex
                    flex-wrap
                    items-center
                    justify-between

                    gap-3
                  "
                >
                  <div
                    className="
                      flex
                      items-center
                      gap-2
                    "
                  >
                    <span
                      className="
                        w-2
                        h-2
                        rounded-full
                        bg-[#008236]
                      "
                    />

                    <span
                      className="
                        text-[11px]
                        text-gray-500
                      "
                    >
                      Sales revenue
                    </span>
                  </div>

                  <span
                    className="
                      text-[11px]
                      text-gray-400
                    "
                  >
                    Updated today
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* =================================================
              SECOND DASHBOARD ROW
          ================================================= */}

          <section
            className="
              grid
              grid-cols-1
              xl:grid-cols-3

              gap-5
              sm:gap-6

              mt-5
              sm:mt-6
            "
          >
            {/* =================================================
                RECENT ORDERS
            ================================================= */}

            <div
              className="
                xl:col-span-2

                bg-white

                rounded-2xl

                border
                border-gray-100

                shadow-sm

                overflow-hidden
              "
            >
              <div
                className="
                  p-5
                  sm:p-6

                  border-b
                  border-gray-100

                  flex
                  items-center
                  justify-between

                  gap-3
                "
              >
                <div>
                  <h2
                    className="
                      text-base
                      sm:text-lg

                      font-bold

                      text-gray-800
                    "
                  >
                    Recent Orders
                  </h2>

                  <p
                    className="
                      text-xs
                      sm:text-sm

                      text-gray-500

                      mt-1
                    "
                  >
                    Latest orders from your
                    customers.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    handleNavigation(
                      "/seller/orders"
                    )
                  }
                  className="
                    text-xs
                    sm:text-sm

                    font-semibold

                    text-[#008236]

                    hover:underline

                    whitespace-nowrap
                  "
                >
                  View all
                </button>
              </div>

              {/* =================================================
                  DESKTOP TABLE
              ================================================= */}

              <div className="hidden md:block overflow-x-auto">
                <table className="w-full min-w-[820px]">
                  <thead>
                    <tr
                      className="
                        border-b
                        border-gray-100

                        text-left
                      "
                    >
                      <th
                        className="
                          px-6
                          py-3

                          text-[11px]

                          font-semibold

                          text-gray-400

                          uppercase
                        "
                      >
                        Order
                      </th>

                      <th
                        className="
                          px-4
                          py-3

                          text-[11px]

                          font-semibold

                          text-gray-400

                          uppercase
                        "
                      >
                        Customer
                      </th>

                      <th
                        className="
                          px-4
                          py-3

                          text-[11px]

                          font-semibold

                          text-gray-400

                          uppercase
                        "
                      >
                        Product
                      </th>

                      <th
                        className="
                          px-4
                          py-3

                          text-[11px]

                          font-semibold

                          text-gray-400

                          uppercase
                        "
                      >
                        Date
                      </th>

                      <th
                        className="
                          px-4
                          py-3

                          text-[11px]

                          font-semibold

                          text-gray-400

                          uppercase
                        "
                      >
                        Qty
                      </th>

                      <th
                        className="
                          px-4
                          py-3

                          text-[11px]

                          font-semibold

                          text-gray-400

                          uppercase
                        "
                      >
                        Amount
                      </th>

                      <th
                        className="
                          px-4
                          py-3

                          text-[11px]

                          font-semibold

                          text-gray-400

                          uppercase
                        "
                      >
                        Status
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {recentOrders.map(
                      (order) => (
                        <tr
                          key={order.id}
                          className="
                            border-b
                            border-gray-50

                            last:border-b-0

                            hover:bg-gray-50

                            transition
                          "
                        >
                          {/* ORDER */}

                          <td className="px-6 py-4">
                            <p
                              className="
                                text-sm
                                font-semibold
                                text-gray-800
                              "
                            >
                              {order.id}
                            </p>
                          </td>

                          {/* CUSTOMER */}

                          <td className="px-4 py-4">
                            <div
                              className="
                                flex
                                items-center
                                gap-2.5
                              "
                            >
                              <div
                                className="
                                  w-8
                                  h-8

                                  rounded-full

                                  bg-green-50

                                  text-[#008236]

                                  flex
                                  items-center
                                  justify-center

                                  text-xs
                                  font-bold

                                  flex-shrink-0
                                "
                              >
                                {order.customer
                                  .charAt(0)
                                  .toUpperCase()}
                              </div>

                              <span
                                className="
                                  text-sm
                                  text-gray-600
                                  whitespace-nowrap
                                "
                              >
                                {order.customer}
                              </span>
                            </div>
                          </td>

                          {/* PRODUCT */}

                          <td className="px-4 py-4">
                            <p
                              className="
                                text-sm
                                text-gray-700

                                max-w-[180px]

                                truncate
                              "
                              title={
                                order.product
                              }
                            >
                              {order.product}
                            </p>
                          </td>

                          {/* DATE */}

                          <td className="px-4 py-4">
                            <div
                              className="
                                flex
                                items-center
                                gap-1.5
                                whitespace-nowrap
                              "
                            >
                              <FiCalendar
                                size={13}
                                className="text-gray-400"
                              />

                              <span
                                className="
                                  text-xs
                                  text-gray-500
                                "
                              >
                                {order.date}
                              </span>
                            </div>
                          </td>

                          {/* QUANTITY */}

                          <td className="px-4 py-4">
                            <span
                              className="
                                text-sm
                                font-semibold
                                text-gray-700
                              "
                            >
                              {order.quantity}
                            </span>
                          </td>

                          {/* AMOUNT */}

                          <td className="px-4 py-4">
                            <p
                              className="
                                text-sm
                                font-semibold
                                text-gray-800
                                whitespace-nowrap
                              "
                            >
                              {order.amount}
                            </p>
                          </td>

                          {/* STATUS */}

                          <td className="px-4 py-4">
                            <span
                              className={`
                                inline-flex
                                items-center
                                gap-1.5

                                px-2.5
                                py-1

                                rounded-full

                                text-[10px]

                                font-semibold

                                ${
                                  order.status ===
                                  "Delivered"
                                    ? "bg-green-50 text-green-700"
                                    : "bg-yellow-50 text-yellow-700"
                                }
                              `}
                            >
                              {order.status ===
                              "Delivered" ? (
                                <FiCheckCircle
                                  size={11}
                                />
                              ) : (
                                <FiClock
                                  size={11}
                                />
                              )}

                              {order.status}
                            </span>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>

              {/* =================================================
                  MOBILE ORDERS
              ================================================= */}

              <div className="md:hidden">
                {recentOrders.map(
                  (order) => (
                    <div
                      key={order.id}
                      className="
                        p-4

                        border-b
                        border-gray-100

                        last:border-b-0
                      "
                    >
                      <div
                        className="
                          flex
                          items-start
                          justify-between

                          gap-3
                        "
                      >
                        <div className="min-w-0 flex-1">
                          <div
                            className="
                              flex
                              items-center
                              justify-between
                              gap-2
                            "
                          >
                            <p
                              className="
                                text-xs
                                font-bold
                                text-[#008236]
                              "
                            >
                              {order.id}
                            </p>

                            <span
                              className={`
                                inline-flex
                                items-center
                                gap-1

                                px-2
                                py-1

                                rounded-full

                                text-[9px]

                                font-semibold

                                ${
                                  order.status ===
                                  "Delivered"
                                    ? "bg-green-50 text-green-700"
                                    : "bg-yellow-50 text-yellow-700"
                                }
                              `}
                            >
                              {order.status ===
                              "Delivered" ? (
                                <FiCheckCircle
                                  size={10}
                                />
                              ) : (
                                <FiClock
                                  size={10}
                                />
                              )}

                              {order.status}
                            </span>
                          </div>

                          <p
                            className="
                              text-sm
                              font-semibold
                              text-gray-800
                              mt-1.5
                            "
                          >
                            {order.product}
                          </p>

                          <p
                            className="
                              text-xs
                              text-gray-500
                              mt-1
                            "
                          >
                            {order.customer}
                          </p>

                          {/* DATE */}

                          <div
                            className="
                              flex
                              flex-wrap
                              items-center
                              gap-2

                              mt-2
                            "
                          >
                            <span
                              className="
                                inline-flex
                                items-center
                                gap-1

                                text-[10px]
                                text-gray-500
                              "
                            >
                              <FiCalendar
                                size={11}
                              />

                              {order.date}
                            </span>
                          </div>

                          <div
                            className="
                              flex
                              items-center
                              gap-3

                              mt-2
                            "
                          >
                            <span
                              className="
                                text-xs
                                text-gray-500
                              "
                            >
                              Qty:{" "}
                              <strong className="text-gray-700">
                                {order.quantity}
                              </strong>
                            </span>

                            <span
                              className="
                                text-xs
                                font-bold
                                text-gray-800
                              "
                            >
                              {order.amount}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* =================================================
                TOP PRODUCTS
            ================================================= */}

            <div
              className="
                bg-white

                rounded-2xl

                border
                border-gray-100

                shadow-sm

                overflow-hidden
              "
            >
              <div
                className="
                  p-5
                  sm:p-6

                  border-b
                  border-gray-100

                  flex
                  items-center
                  justify-between
                "
              >
                <div>
                  <h2
                    className="
                      text-base
                      sm:text-lg

                      font-bold

                      text-gray-800
                    "
                  >
                    Top Products
                  </h2>

                  <p
                    className="
                      text-xs
                      text-gray-500
                      mt-1
                    "
                  >
                    Your best performers.
                  </p>
                </div>

                <FiTrendingUp
                  size={20}
                  className="text-[#008236]"
                />
              </div>

              <div
                className="
                  p-5
                  sm:p-6

                  space-y-5
                "
              >
                {topProducts.map(
                  (product, index) => (
                    <div
                      key={product.name}
                    >
                      <div
                        className="
                          flex
                          items-center
                          gap-3
                        "
                      >
                        <div
                          className="
                            w-10
                            h-10

                            rounded-xl

                            bg-green-50

                            text-[#008236]

                            flex
                            items-center
                            justify-center

                            font-bold

                            flex-shrink-0
                          "
                        >
                          {index + 1}
                        </div>

                        <div
                          className="
                            flex-1
                            min-w-0
                          "
                        >
                          <p
                            className="
                              text-sm

                              font-semibold

                              text-gray-800

                              truncate
                            "
                          >
                            {product.name}
                          </p>

                          <p
                            className="
                              text-[10px]

                              text-gray-400

                              mt-0.5
                            "
                          >
                            {product.category}
                            {" • "}
                            {product.sales}
                          </p>
                        </div>

                        <p
                          className="
                            text-xs

                            font-bold

                            text-gray-700

                            flex-shrink-0
                          "
                        >
                          {product.amount}
                        </p>
                      </div>

                      <div
                        className="
                          h-1.5

                          bg-gray-100

                          rounded-full

                          overflow-hidden

                          mt-3

                          ml-[52px]
                        "
                      >
                        <div
                          className="
                            h-full

                            rounded-full

                            bg-[#008236]
                          "
                          style={{
                            width: `${product.percentage}%`,
                          }}
                        />
                      </div>
                    </div>
                  )
                )}

                <button
                  type="button"
                  onClick={() =>
                    handleNavigation(
                      "/seller/products"
                    )
                  }
                  className="
                    w-full

                    h-10

                    rounded-xl

                    border
                    border-gray-200

                    text-gray-600

                    text-sm

                    font-semibold

                    hover:border-green-200
                    hover:bg-green-50
                    hover:text-[#008236]

                    transition
                  "
                >
                  Manage Products
                </button>
              </div>
            </div>
          </section>

          {/* =================================================
              QUICK ACTIONS
          ================================================= */}

          <section className="mt-5 sm:mt-6">
            <div
              className="
                mb-4

                flex
                items-center
                justify-between
              "
            >
              <div>
                <h2
                  className="
                    text-base
                    sm:text-lg

                    font-bold

                    text-gray-800
                  "
                >
                  Quick Actions
                </h2>

                <p
                  className="
                    text-xs
                    sm:text-sm

                    text-gray-500

                    mt-1
                  "
                >
                  Manage your seller account
                  quickly.
                </p>
              </div>
            </div>

            <div
              className="
                grid

                grid-cols-2

                sm:grid-cols-3

                lg:grid-cols-6

                gap-3
                sm:gap-4
              "
            >
              {/* ADD PRODUCT */}

              <button
                type="button"
                onClick={() =>
                  handleNavigation(
                    "/seller/products"
                  )
                }
                className="
                  bg-white

                  border
                  border-gray-100

                  rounded-2xl

                  p-4

                  text-left

                  shadow-sm

                  hover:border-green-200
                  hover:shadow-md

                  transition

                  group
                "
              >
                <div
                  className="
                    w-10
                    h-10

                    rounded-xl

                    bg-green-50

                    text-[#008236]

                    flex
                    items-center
                    justify-center

                    group-hover:bg-[#008236]
                    group-hover:text-white

                    transition
                  "
                >
                  <FiPlus size={19} />
                </div>

                <p
                  className="
                    text-xs
                    sm:text-sm

                    font-semibold

                    text-gray-800

                    mt-3
                  "
                >
                  Add Product
                </p>
              </button>

              {/* ADD SERVICE */}

              <button
                type="button"
                onClick={() =>
                  handleNavigation(
                    "/seller/services"
                  )
                }
                className="
                  bg-white

                  border
                  border-gray-100

                  rounded-2xl

                  p-4

                  text-left

                  shadow-sm

                  hover:border-green-200
                  hover:shadow-md

                  transition

                  group
                "
              >
                <div
                  className="
                    w-10
                    h-10

                    rounded-xl

                    bg-blue-50

                    text-blue-600

                    flex
                    items-center
                    justify-center

                    group-hover:bg-blue-600
                    group-hover:text-white

                    transition
                  "
                >
                  <FiBriefcase
                    size={18}
                  />
                </div>

                <p
                  className="
                    text-xs
                    sm:text-sm

                    font-semibold

                    text-gray-800

                    mt-3
                  "
                >
                  Add Service
                </p>
              </button>

              {/* ORDERS */}

              <button
                type="button"
                onClick={() =>
                  handleNavigation(
                    "/seller/orders"
                  )
                }
                className="
                  bg-white

                  border
                  border-gray-100

                  rounded-2xl

                  p-4

                  text-left

                  shadow-sm

                  hover:border-green-200
                  hover:shadow-md

                  transition

                  group
                "
              >
                <div
                  className="
                    w-10
                    h-10

                    rounded-xl

                    bg-purple-50

                    text-purple-600

                    flex
                    items-center
                    justify-center

                    group-hover:bg-purple-600
                    group-hover:text-white

                    transition
                  "
                >
                  <FiShoppingBag
                    size={18}
                  />
                </div>

                <p
                  className="
                    text-xs
                    sm:text-sm

                    font-semibold

                    text-gray-800

                    mt-3
                  "
                >
                  View Orders
                </p>
              </button>

              {/* MESSAGES */}

              <button
                type="button"
                onClick={() =>
                  handleNavigation(
                    "/seller/messages"
                  )
                }
                className="
                  bg-white

                  border
                  border-gray-100

                  rounded-2xl

                  p-4

                  text-left

                  shadow-sm

                  hover:border-green-200
                  hover:shadow-md

                  transition

                  group
                "
              >
                <div
                  className="
                    w-10
                    h-10

                    rounded-xl

                    bg-orange-50

                    text-orange-600

                    flex
                    items-center
                    justify-center

                    group-hover:bg-orange-600
                    group-hover:text-white

                    transition

                    relative
                  "
                >
                  <FiMessageCircle
                    size={18}
                  />

                  {unreadMessages > 0 && (
                    <span
                      className="
                        absolute

                        -top-1
                        -right-1

                        min-w-[17px]
                        h-[17px]

                        rounded-full

                        bg-red-500

                        text-white

                        text-[8px]
                        font-bold

                        flex
                        items-center
                        justify-center
                      "
                    >
                      {unreadMessages}
                    </span>
                  )}
                </div>

                <p
                  className="
                    text-xs
                    sm:text-sm

                    font-semibold

                    text-gray-800

                    mt-3
                  "
                >
                  Messages
                </p>
              </button>

              {/* PROMOTIONS */}

              <button
                type="button"
                onClick={() =>
                  handleNavigation(
                    "/seller/promotions"
                  )
                }
                className="
                  bg-white

                  border
                  border-gray-100

                  rounded-2xl

                  p-4

                  text-left

                  shadow-sm

                  hover:border-green-200
                  hover:shadow-md

                  transition

                  group
                "
              >
                <div
                  className="
                    w-10
                    h-10

                    rounded-xl

                    bg-pink-50

                    text-pink-600

                    flex
                    items-center
                    justify-center

                    group-hover:bg-pink-600
                    group-hover:text-white

                    transition
                  "
                >
                  <FiTag size={18} />
                </div>

                <p
                  className="
                    text-xs
                    sm:text-sm

                    font-semibold

                    text-gray-800

                    mt-3
                  "
                >
                  Promotions
                </p>
              </button>

              {/* ANALYTICS */}

              <button
                type="button"
                onClick={() =>
                  handleNavigation(
                    "/seller/analytics"
                  )
                }
                className="
                  bg-white

                  border
                  border-gray-100

                  rounded-2xl

                  p-4

                  text-left

                  shadow-sm

                  hover:border-green-200
                  hover:shadow-md

                  transition

                  group
                "
              >
                <div
                  className="
                    w-10
                    h-10

                    rounded-xl

                    bg-indigo-50

                    text-indigo-600

                    flex
                    items-center
                    justify-center

                    group-hover:bg-indigo-600
                    group-hover:text-white

                    transition
                  "
                >
                  <FiBarChart2
                    size={18}
                  />
                </div>

                <p
                  className="
                    text-xs
                    sm:text-sm

                    font-semibold

                    text-gray-800

                    mt-3
                  "
                >
                  Analytics
                </p>
              </button>
            </div>
          </section>

          {/* =================================================
              FOOTER NOTE
          ================================================= */}

          <div
            className="
              mt-6

              rounded-2xl

              bg-green-50

              border
              border-green-100

              p-4
              sm:p-5

              flex
              flex-col
              sm:flex-row

              sm:items-center
              sm:justify-between

              gap-3
            "
          >
            <div
              className="
                flex
                items-center
                gap-3
              "
            >
              <div
                className="
                  w-9
                  h-9

                  rounded-xl

                  bg-white

                  text-[#008236]

                  flex
                  items-center
                  justify-center

                  shadow-sm

                  flex-shrink-0
                "
              >
                <FiCheckCircle
                  size={18}
                />
              </div>

              <div>
                <p
                  className="
                    text-sm

                    font-semibold

                    text-gray-800
                  "
                >
                  Your store is active
                </p>

                <p
                  className="
                    text-xs

                    text-gray-500

                    mt-0.5
                  "
                >
                  Keep your products updated
                  to attract more customers.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                handleNavigation(
                  "/seller/profile"
                )
              }
              className="
                h-9

                px-4

                rounded-lg

                bg-[#008236]

                text-white

                text-xs

                font-semibold

                hover:bg-[#006f2e]

                transition

                whitespace-nowrap
              "
            >
              Manage Store
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}

export default SellerDashboard;