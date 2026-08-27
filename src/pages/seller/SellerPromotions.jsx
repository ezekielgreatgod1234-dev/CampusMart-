import { useState } from "react";

import { useNavigate, useLocation } from "react-router-dom";

import {
  FiGrid,
  FiPackage,
  FiShoppingBag,
  FiMessageCircle,
  FiDollarSign,
  FiTag,
  FiUser,
  FiSettings,
  FiLogOut,
  FiMenu,
  FiChevronDown,
  FiX,
  FiBell,
  FiCheckCircle,
  FiClock,
  FiTrendingUp,
  FiZap,
  FiArrowUp,
  FiEye,
  FiStar,
  FiCreditCard,
} from "react-icons/fi";

import { useAuth } from "../../context/AuthContext";

// =====================================================
// SELLER PROMOTIONS — Pay to boost products to the top
// =====================================================

function SellerPromotions({ unreadMessages = 0, profile = {} }) {
  const navigate = useNavigate();
  const location = useLocation();

  const { firebaseUser } = useAuth();

  // =====================================================
  // SIDEBAR
  // =====================================================

  const [sidebarOpen, setSidebarOpen] = useState(false);

  // =====================================================
  // PROMOTE FORM STATE
  // =====================================================

  const [selectedProductId, setSelectedProductId] =
    useState("");

  const [selectedPlanId, setSelectedPlanId] =
    useState("7days");

  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [formError, setFormError] = useState("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState(""); // "balance" | "card"

  // =====================================================
  // SELLER PROFILE
  // =====================================================

  const sellerFullName =
  profile?.fullName ||
  profile?.name ||
  profile?.displayName ||
  firebaseUser?.displayName?.trim() ||
  "Seller";

const sellerFirstName =
  String(sellerFullName).trim().split(/\s+/)[0] || "Seller";

const sellerImage =
  profile?.profileImage ||
  profile?.photoURL ||
  profile?.profilePicture ||
  profile?.avatar ||
  profile?.imageUrl ||
  profile?.image ||
  firebaseUser?.photoURL ||
  null;

  // =====================================================
  // MENU ITEMS (Reviews & Analytics removed)
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
      label: "Orders",
      icon: FiShoppingBag,
      path: "/seller/orders",
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
  // NOTIFICATIONS
  // =====================================================

  const handleNotifications = () => {
    console.log("Open seller notifications");
  };

  // =====================================================
  // FORMATTING
  // =====================================================

  const formatNaira = (amount) =>
    `₦${Number(amount || 0).toLocaleString("en-NG")}`;

  // =====================================================
  // AVAILABLE BALANCE (from earnings — wire to real data)
  // =====================================================

  const availableBalance = 284750;

  // =====================================================
  // SELLER PRODUCTS (mock — replace with Firestore later)
  // =====================================================

  const sellerProducts = [
    {
      id: "p1",
      name: "HP EliteBook Laptop",
      category: "Electronics",
      price: 285000,
      image: "",
    },
    {
      id: "p2",
      name: "Wireless Headphones",
      category: "Accessories",
      price: 18500,
      image: "",
    },
    {
      id: "p3",
      name: "USB-C Fast Charger",
      category: "Accessories",
      price: 7500,
      image: "",
    },
    {
      id: "p4",
      name: "Graphic Design Service",
      category: "Services",
      price: 25000,
      image: "",
    },
  ];

  // =====================================================
  // BOOST PLANS
  // =====================================================

  const boostPlans = [
    {
      id: "3days",
      label: "3 Days",
      days: 3,
      price: 1500,
      badge: null,
      description: "Quick boost for weekend sales",
    },
    {
      id: "7days",
      label: "7 Days",
      days: 7,
      price: 3000,
      badge: "Popular",
      description: "Best value for weekly visibility",
    },
    {
      id: "14days",
      label: "14 Days",
      days: 14,
      price: 5000,
      badge: "Best value",
      description: "Maximum reach on campus",
    },
  ];

  const selectedPlan =
    boostPlans.find((p) => p.id === selectedPlanId) ||
    boostPlans[1];

  const selectedProduct =
    sellerProducts.find((p) => p.id === selectedProductId) ||
    null;

  // =====================================================
  // ACTIVE BOOSTS (mock)
  // =====================================================

  const [activeBoosts, setActiveBoosts] = useState([
    {
      id: "boost-1",
      productName: "Wireless Headphones",
      plan: "7 Days",
      amountPaid: 3000,
      starts: "Aug 20, 2026",
      ends: "Aug 27, 2026",
      status: "Active",
      views: 312,
    },
  ]);

  // =====================================================
  // OPEN PAYMENT MODAL
  // =====================================================

  const handlePromote = (event) => {
    event.preventDefault();
    setFormError("");
    setSuccessMessage("");
    setPaymentMethod("");

    if (!selectedProductId) {
      setFormError("Please select a product to promote.");
      return;
    }

    if (!selectedPlan) {
      setFormError("Please choose a boost plan.");
      return;
    }

    setShowPaymentModal(true);
  };

  // =====================================================
  // CONFIRM PAYMENT (balance or card)
  // =====================================================

  const handleConfirmPayment = async () => {
    if (!paymentMethod) {
      return;
    }

    const product = sellerProducts.find(
      (p) => p.id === selectedProductId
    );

    // Card → go to SellerPayment form page
    if (paymentMethod === "card") {
      setShowPaymentModal(false);
      setPaymentMethod("");
      navigate("/seller/payment", {
        state: {
          productId: selectedProductId,
          productName: product?.name || "Product",
          planId: selectedPlan.id,
          planLabel: selectedPlan.label,
          planDays: selectedPlan.days,
          amount: selectedPlan.price,
        },
      });
      return;
    }

    // Balance path
    if (selectedPlan.price > availableBalance) {
      setFormError(
        "Insufficient available balance. Choose Pay with card instead."
      );
      setShowPaymentModal(false);
      return;
    }

    setSubmitting(true);
    setShowPaymentModal(false);

    try {
      // =================================================
      // TODO: Deduct from seller earnings in Firestore
      // and save productBoosts record
      // =================================================
      console.log(
        "Deduct from available balance:",
        selectedPlan.price
      );

      await new Promise((resolve) => setTimeout(resolve, 1200));

      const ends = new Date();
      ends.setDate(ends.getDate() + selectedPlan.days);

      setActiveBoosts((current) => [
        {
          id: `boost-${Date.now()}`,
          productName: product?.name || "Product",
          plan: selectedPlan.label,
          amountPaid: selectedPlan.price,
          paidVia: "Available balance",
          starts: new Date().toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          }),
          ends: ends.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          }),
          status: "Active",
          views: 0,
        },
        ...current,
      ]);

      setSuccessMessage(
        `${product?.name || "Product"} is now boosted to the top for ${selectedPlan.label.toLowerCase()} (paid via available balance).`
      );
      setSelectedProductId("");
      setPaymentMethod("");
    } catch (error) {
      console.error("Promote error:", error);
      setFormError("Unable to start promotion. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="h-screen w-full bg-gray-50 text-gray-800 font-sans overflow-hidden">
      {/* MOBILE SIDEBAR OVERLAY */}

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}

      <aside
        className={`
          fixed
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
          h-screen
          overflow-hidden
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
        <div className="relative px-5 pt-19 lg:pt-5 pb-4 flex-shrink-0">
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
            <FiX size={21} strokeWidth={2.5} />
          </button>

          <div className="flex items-center gap-3 pr-10">
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
              <span className="text-white text-[16px] font-black tracking-tight">
                CM
              </span>
            </div>

            <div className="min-w-0">
              <h1 className="text-[30px] font-extrabold tracking-tight leading-none whitespace-nowrap">
                <span className="text-white">Campus</span>
                <span className="text-green-300">Mart</span>
              </h1>

              <p className="text-[10px] text-green-100 mt-1 whitespace-nowrap">
                Sell. Connect. Grow.
              </p>
            </div>
          </div>
        </div>

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
                  onClick={() => handleNavigation(path)}
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
                        ? "bg-white text-[#008236] shadow-sm font-semibold"
                        : "text-white hover:bg-white/10 active:bg-white/20"
                    }
                  `}
                >
                  <Icon
                    size={19}
                    strokeWidth={active ? 2.5 : 2}
                    className="flex-shrink-0"
                  />

                  <span className="flex-1 text-[14px] whitespace-nowrap">
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

        <div className="px-4 pb-4 flex-shrink-0">
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
            <span className="text-[14px]">Logout</span>
          </button>
        </div>

        <div className="px-4 pb-3 flex-shrink-0">
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
            <div className="text-2xl mb-1">👑</div>
            <h3 className="font-bold text-sm">Go Premium</h3>
            <p className="text-[10px] text-green-100 leading-4 mt-1">
              Boost your products and reach more students.
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
                active:bg-green-100
                transition
              "
            >
              Upgrade Now
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN AREA */}

      <div
        className="
          min-w-0
          flex
          flex-col
          h-screen
          w-full
          lg:ml-[291px]
          lg:w-[calc(100%-291px)]
        "
      >
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
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
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

          <div className="flex items-center gap-2 text-white flex-shrink-0">
            <FiShoppingBag size={19} className="text-green-200" />
            <span className="text-sm sm:text-base font-semibold whitespace-nowrap">
              Your Store
            </span>
          </div>

          <div className="ml-auto flex items-center gap-0.5 sm:gap-2">
            <button
              type="button"
              onClick={handleNotifications}
              aria-label="Notifications"
              className="
                relative
                w-9 h-9 sm:w-10 sm:h-10
                rounded-full
                hover:bg-white/10
                active:bg-white/20
                flex items-center justify-center
                transition flex-shrink-0
              "
            >
              <FiBell size={20} />
              <span
                className="
                  absolute -top-0.5 -right-0.5
                  min-w-[17px] h-[17px] px-1
                  rounded-full bg-red-500 text-white
                  text-[9px] font-bold
                  flex items-center justify-center
                "
              >
                5
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleNavigation("/seller/messages")}
              aria-label="Messages"
              className="
                relative
                w-9 h-9 sm:w-10 sm:h-10
                rounded-full
                hover:bg-white/10
                active:bg-white/20
                flex items-center justify-center
                transition flex-shrink-0
              "
            >
              <FiMessageCircle size={20} />
              {unreadMessages > 0 && (
                <span
                  className="
                    absolute -top-0.5 -right-0.5
                    min-w-[17px] h-[17px] px-1
                    rounded-full bg-red-500 text-white
                    text-[9px] font-bold
                    flex items-center justify-center
                  "
                >
                  {unreadMessages}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => handleNavigation("/seller/profile")}
              className="
                flex items-center gap-2 ml-0.5
                hover:bg-white/10 active:bg-white/20
                rounded-lg px-1 sm:px-1.5 py-1.5
                transition flex-shrink-0
              "
            >
              {sellerImage ? (
                <img
                  src={sellerImage}
                  alt={sellerFullName}
                  className="
                    w-8 h-8 sm:w-9 sm:h-9
                    rounded-full object-cover
                    border-2 border-white/30
                  "
                />
              ) : (
                <div
                  className="
                    w-8 h-8 sm:w-9 sm:h-9
                    rounded-full bg-gray-200 text-gray-700
                    flex items-center justify-center
                    font-bold text-sm
                    border-2 border-white/30 flex-shrink-0
                  "
                >
                  {sellerFirstName?.charAt(0)?.toUpperCase()}
                </div>
              )}

              <div className="hidden sm:block text-left">
                <p
                  className="text-xs font-bold leading-4 max-w-[180px] truncate"
                  title={sellerFullName}
                >
                  {sellerFullName}
                </p>
                <p className="text-[10px] text-green-100 mt-0.5">
                  Seller
                </p>
              </div>

              <FiChevronDown size={16} className="hidden sm:block" />
            </button>
          </div>
        </header>

        {/* CONTENT */}

        <main
          className="
            flex-1 overflow-y-auto overflow-x-hidden
            bg-gray-50
            px-3 sm:px-5 md:px-6 lg:px-8
            py-5 sm:py-6 lg:py-8
            font-sans
          "
        >
          {/* HEADER */}

          <section className="mb-6 sm:mb-7">
            <div
              className="
                bg-gradient-to-r from-[#007233] to-[#008f3f]
                rounded-2xl p-5 sm:p-6 lg:p-7
                text-white shadow-sm relative overflow-hidden
              "
            >
              <div className="absolute -right-10 -top-16 w-48 h-48 rounded-full bg-white/10" />
              <div className="absolute right-16 -bottom-24 w-40 h-40 rounded-full bg-white/5" />

              <div className="relative z-20">
                <div
                  className="
                    inline-flex items-center gap-2
                    px-3 py-1 rounded-full
                    bg-white/10 border border-white/10
                    text-[11px] font-medium mb-3
                  "
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-green-300" />
                  Product promotions
                </div>

                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                  Promote your products, {sellerFirstName}
                </h1>

                <p className="text-sm sm:text-base text-green-50 mt-1.5 max-w-xl leading-6">
                  Pay to push a product to the top of browse
                  results so more students see it first.
                </p>
              </div>
            </div>
          </section>

          {/* HOW IT WORKS */}

          <section className="mb-5 sm:mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  step: "1",
                  title: "Choose a product",
                  text: "Pick any product from your store.",
                  icon: FiPackage,
                },
                {
                  step: "2",
                  title: "Pick a boost plan",
                  text: "3, 7, or 14 days at the top.",
                  icon: FiZap,
                },
                {
                  step: "3",
                  title: "Pay & go live",
                  text: "Your product ranks above others.",
                  icon: FiArrowUp,
                },
              ].map(({ step, title, text, icon: Icon }) => (
                <div
                  key={step}
                  className="
                    bg-white rounded-2xl border border-gray-100
                    p-4 sm:p-5
                    shadow-[0_2px_10px_rgba(15,23,42,0.04)]
                    flex gap-3
                  "
                >
                  <div
                    className="
                      w-10 h-10 rounded-xl
                      bg-green-50 text-[#008236]
                      flex items-center justify-center
                      flex-shrink-0 font-bold text-sm
                    "
                  >
                    {step}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <Icon size={14} className="text-[#008236]" />
                      <p className="text-sm font-semibold text-gray-800">
                        {title}
                      </p>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 leading-5">
                      {text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* SUCCESS */}

          {successMessage && (
            <div
              className="
                mb-5 rounded-2xl bg-green-50 border border-green-100
                p-4 flex items-start gap-3
              "
            >
              <div
                className="
                  w-10 h-10 rounded-xl bg-white text-[#008236]
                  flex items-center justify-center flex-shrink-0 shadow-sm
                "
              >
                <FiCheckCircle size={20} />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">
                  Product boosted
                </p>
                <p className="text-xs text-gray-500 mt-1 leading-5">
                  {successMessage}
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-5 gap-5 sm:gap-6">
            {/* PROMOTE FORM */}

            <section className="xl:col-span-3">
              <form
                onSubmit={handlePromote}
                className="
                  bg-white rounded-2xl border border-gray-100
                  shadow-sm overflow-hidden
                "
              >
                <div className="p-5 sm:p-6 border-b border-gray-100">
                  <h2 className="text-base sm:text-lg font-bold text-gray-800">
                    Boost a product
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">
                    Selected products appear at the top of search
                    and browse for other students.
                  </p>
                </div>

                <div className="p-5 sm:p-6 space-y-5">
                  {formError && (
                    <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
                      {formError}
                    </div>
                  )}

                  {/* SELECT PRODUCT */}

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2">
                      Select product
                    </label>

                    <div className="space-y-2">
                      {sellerProducts.map((product) => {
                        const active =
                          selectedProductId === product.id;

                        return (
                          <button
                            key={product.id}
                            type="button"
                            onClick={() => {
                              setSelectedProductId(product.id);
                              setFormError("");
                              setSuccessMessage("");
                            }}
                            className={`
                              w-full text-left
                              flex items-center gap-3
                              p-3 sm:p-3.5 rounded-xl
                              border transition
                              ${
                                active
                                  ? "border-[#008236] bg-green-50 ring-2 ring-green-100"
                                  : "border-gray-100 bg-white hover:border-green-200 hover:bg-green-50/40"
                              }
                            `}
                          >
                            <div
                              className="
                                w-11 h-11 rounded-xl
                                bg-green-50 text-[#008236]
                                flex items-center justify-center
                                flex-shrink-0
                              "
                            >
                              <FiPackage size={18} />
                            </div>

                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-800 truncate">
                                {product.name}
                              </p>
                              <p className="text-[10px] text-gray-400 mt-0.5">
                                {product.category} ·{" "}
                                {formatNaira(product.price)}
                              </p>
                            </div>

                            {active && (
                              <FiCheckCircle
                                size={18}
                                className="text-[#008236] flex-shrink-0"
                              />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* BOOST PLANS */}

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2">
                      Boost duration
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {boostPlans.map((plan) => {
                        const active =
                          selectedPlanId === plan.id;

                        return (
                          <button
                            key={plan.id}
                            type="button"
                            onClick={() => {
                              setSelectedPlanId(plan.id);
                              setFormError("");
                            }}
                            className={`
                              relative text-left
                              p-4 rounded-2xl border transition
                              ${
                                active
                                  ? "border-[#008236] bg-green-50 ring-2 ring-green-100"
                                  : "border-gray-100 bg-white hover:border-green-200"
                              }
                            `}
                          >
                            {plan.badge && (
                              <span
                                className="
                                  absolute -top-2 right-3
                                  px-2 py-0.5 rounded-full
                                  bg-[#008236] text-white
                                  text-[9px] font-bold
                                "
                              >
                                {plan.badge}
                              </span>
                            )}

                            <p className="text-sm font-bold text-gray-800">
                              {plan.label}
                            </p>

                            <p className="text-lg font-bold text-[#008236] mt-1">
                              {formatNaira(plan.price)}
                            </p>

                            <p className="text-[10px] text-gray-400 mt-1.5 leading-4">
                              {plan.description}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* SUMMARY */}

                  <div
                    className="
                      rounded-xl bg-green-50 border border-green-100
                      p-4 flex flex-col sm:flex-row
                      sm:items-center sm:justify-between gap-3
                    "
                  >
                    <div>
                      <p className="text-xs font-semibold text-gray-700">
                        You will pay
                      </p>
                      <p className="text-xl font-bold text-[#008236] mt-0.5">
                        {formatNaira(selectedPlan.price)}
                      </p>
                      <p className="text-[10px] text-gray-500 mt-1">
                        {selectedProduct
                          ? `To boost “${selectedProduct.name}” for ${selectedPlan.label.toLowerCase()}`
                          : `For ${selectedPlan.label.toLowerCase()} at the top of listings`}
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="
                        h-11 px-5 rounded-xl
                        bg-[#008236] text-white
                        text-sm font-semibold
                        flex items-center justify-center gap-2
                        hover:bg-[#006f2e] active:bg-[#005f28]
                        transition shadow-sm
                        disabled:opacity-60 disabled:cursor-not-allowed
                        whitespace-nowrap
                      "
                    >
                      {submitting ? (
                        "Processing..."
                      ) : (
                        <>
                          <FiZap size={16} />
                          Pay & Promote
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </section>

            {/* ACTIVE BOOSTS */}

            <section className="xl:col-span-2">
              <div
                className="
                  bg-white rounded-2xl border border-gray-100
                  shadow-sm overflow-hidden h-full
                "
              >
                <div className="p-5 sm:p-6 border-b border-gray-100">
                  <h2 className="text-base sm:text-lg font-bold text-gray-800">
                    Active boosts
                  </h2>
                  <p className="text-xs text-gray-500 mt-1">
                    Products currently at the top.
                  </p>
                </div>

                <div className="p-4 sm:p-5 space-y-3">
                  {activeBoosts.length === 0 && (
                    <div className="text-center py-10">
                      <div
                        className="
                          w-12 h-12 mx-auto rounded-full
                          bg-green-50 text-[#008236]
                          flex items-center justify-center mb-3
                        "
                      >
                        <FiStar size={20} />
                      </div>
                      <p className="text-sm font-medium text-gray-500">
                        No active boosts
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Promote a product to appear here.
                      </p>
                    </div>
                  )}

                  {activeBoosts.map((boost) => (
                    <div
                      key={boost.id}
                      className="
                        border border-green-100 rounded-xl
                        p-3.5 bg-green-50/40
                      "
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-800 truncate">
                            {boost.productName}
                          </p>
                          <p className="text-[10px] text-gray-400 mt-0.5">
                            {boost.plan} · {formatNaira(boost.amountPaid)}
                            {boost.paidVia ? ` · ${boost.paidVia}` : ""}
                          </p>
                        </div>

                        <span
                          className="
                            inline-flex items-center gap-1
                            px-2 py-0.5 rounded-full
                            bg-green-50 text-[#008236]
                            border border-green-100
                            text-[9px] font-bold flex-shrink-0
                          "
                        >
                          <FiCheckCircle size={10} />
                          {boost.status}
                        </span>
                      </div>

                      <div className="flex items-center justify-between mt-3 text-[10px] text-gray-500">
                        <span className="inline-flex items-center gap-1">
                          <FiClock size={11} />
                          Ends {boost.ends}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <FiEye size={11} />
                          {boost.views} views
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="px-4 sm:px-5 pb-5">
                  <div
                    className="
                      rounded-xl bg-gray-50 border border-gray-100
                      p-3.5 text-[11px] text-gray-500 leading-5
                    "
                  >
                    <span className="font-semibold text-[#008236]">
                      Tip:
                    </span>{" "}
                    Boosted products show a “Promoted” badge and
                    stay above regular listings until the plan ends.
                  </div>
                </div>
              </div>
            </section>
          </div>
        </main>

      {/* ================================================= */}
      {/* PAYMENT METHOD MODAL */}
      {/* ================================================= */}

      {showPaymentModal && (
        <div
          className="
            fixed inset-0 z-[100]
            bg-black/50 backdrop-blur-[2px]
            flex items-end sm:items-center justify-center
            p-4
          "
          onClick={() => {
            if (!submitting) {
              setShowPaymentModal(false);
              setPaymentMethod("");
            }
          }}
        >
          <div
            className="
              w-full max-w-md
              bg-white rounded-2xl shadow-2xl
              overflow-hidden border border-green-100
            "
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-green-100 bg-green-50">
              <div className="flex items-start gap-3">
                <div
                  className="
                    w-11 h-11 rounded-xl
                    bg-white text-[#008236]
                    flex items-center justify-center
                    flex-shrink-0 shadow-sm
                  "
                >
                  <FiDollarSign size={20} />
                </div>

                <div className="min-w-0">
                  <h3 className="text-lg font-bold text-gray-900">
                    How do you want to pay?
                  </h3>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {formatNaira(selectedPlan.price)} for{" "}
                    {selectedPlan.label.toLowerCase()} boost
                    {selectedProduct
                      ? ` · ${selectedProduct.name}`
                      : ""}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-5 space-y-3">
              {/* AVAILABLE BALANCE */}

              <button
                type="button"
                disabled={submitting}
                onClick={() => setPaymentMethod("balance")}
                className={`
                  w-full text-left
                  flex items-start gap-3
                  p-4 rounded-xl border transition
                  ${
                    paymentMethod === "balance"
                      ? "border-[#008236] bg-green-50 ring-2 ring-green-100"
                      : "border-gray-100 bg-white hover:border-green-200 hover:bg-green-50/40"
                  }
                `}
              >
                <div
                  className="
                    w-10 h-10 rounded-xl
                    bg-green-50 text-[#008236]
                    flex items-center justify-center
                    flex-shrink-0
                  "
                >
                  <FiDollarSign size={18} />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800">
                    Available balance
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Deduct from your earnings balance
                  </p>
                  <p className="text-sm font-bold text-[#008236] mt-1.5">
                    {formatNaira(availableBalance)} available
                  </p>
                  {selectedPlan.price > availableBalance && (
                    <p className="text-[10px] text-red-500 mt-1">
                      Not enough balance for this plan
                    </p>
                  )}
                </div>

                {paymentMethod === "balance" && (
                  <FiCheckCircle
                    size={18}
                    className="text-[#008236] flex-shrink-0 mt-1"
                  />
                )}
              </button>

              {/* PAY WITH CARD */}

              <button
                type="button"
                disabled={submitting}
                onClick={() => setPaymentMethod("card")}
                className={`
                  w-full text-left
                  flex items-start gap-3
                  p-4 rounded-xl border transition
                  ${
                    paymentMethod === "card"
                      ? "border-[#008236] bg-green-50 ring-2 ring-green-100"
                      : "border-gray-100 bg-white hover:border-green-200 hover:bg-green-50/40"
                  }
                `}
              >
                <div
                  className="
                    w-10 h-10 rounded-xl
                    bg-green-50 text-[#008236]
                    flex items-center justify-center
                    flex-shrink-0
                  "
                >
                  <FiCreditCard size={18} />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800">
                    Pay with card
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Debit or credit card via secure checkout
                  </p>
                </div>

                {paymentMethod === "card" && (
                  <FiCheckCircle
                    size={18}
                    className="text-[#008236] flex-shrink-0 mt-1"
                  />
                )}
              </button>
            </div>

            <div className="p-4 sm:p-5 pt-0 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                disabled={submitting}
                onClick={() => {
                  setShowPaymentModal(false);
                  setPaymentMethod("");
                }}
                className="
                  h-11 px-4 rounded-xl
                  border border-gray-200 bg-white
                  text-gray-600 text-sm font-semibold
                  hover:bg-gray-50 transition
                  disabled:opacity-50
                  sm:flex-1
                "
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={!paymentMethod || submitting}
                onClick={handleConfirmPayment}
                className="
                  h-11 px-4 rounded-xl
                  bg-[#008236] text-white
                  text-sm font-semibold
                  flex items-center justify-center gap-2
                  hover:bg-[#006f2e] active:bg-[#005f28]
                  transition shadow-sm
                  disabled:opacity-50 disabled:cursor-not-allowed
                  sm:flex-[1.4]
                "
              >
                {submitting ? (
                  "Processing..."
                ) : paymentMethod === "balance" ? (
                  <>
                    <FiDollarSign size={16} />
                    Pay from balance
                  </>
                ) : paymentMethod === "card" ? (
                  <>
                    <FiZap size={16} />
                    Pay with card
                  </>
                ) : (
                  "Select a method"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      </div>
    </div>
  );
}

export default SellerPromotions;