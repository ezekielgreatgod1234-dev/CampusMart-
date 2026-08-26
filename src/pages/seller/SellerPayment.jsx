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
  FiArrowLeft,
  FiCreditCard,
  FiCheckCircle,
  FiLock,
  FiZap,
} from "react-icons/fi";

import { useAuth } from "../../context/AuthContext";

// =====================================================
// SELLER PAYMENT — Card payment form for promotions
// =====================================================

function SellerPayment({ unreadMessages = 0 }) {
  const navigate = useNavigate();
  const location = useLocation();

  const { firebaseUser } = useAuth();

  // Payment details passed from Promotions (or defaults)
  const paymentInfo = location.state || {};

  const productName = paymentInfo.productName || "Product boost";
  const planLabel = paymentInfo.planLabel || "7 Days";
  const planDays = paymentInfo.planDays || 7;
  const amount = Number(paymentInfo.amount || 3000);
  const productId = paymentInfo.productId || "";
  const planId = paymentInfo.planId || "7days";

  // =====================================================
  // SIDEBAR
  // =====================================================

  const [sidebarOpen, setSidebarOpen] = useState(false);

  // =====================================================
  // CARD FORM
  // =====================================================

  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // =====================================================
  // SELLER PROFILE
  // =====================================================

  const sellerFullName =
    firebaseUser?.displayName?.trim() || "GreatGod Ezekiel";

  const sellerFirstName =
    sellerFullName.split(/\s+/)[0] || "GreatGod";

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

  const isActive = (path) => {
    if (path === "/seller-dashboard") {
      return location.pathname === "/seller-dashboard";
    }

    if (path === "/seller/promotions") {
      return (
        location.pathname.startsWith("/seller/promotions") ||
        location.pathname.startsWith("/seller/payment")
      );
    }

    return location.pathname.startsWith(path);
  };

  const handleNavigation = (path) => {
    setSidebarOpen(false);
    navigate(path);
  };

  const handleLogout = () => {
    setSidebarOpen(false);
    navigate("/logout");
  };

  const handleNotifications = () => {
    console.log("Open seller notifications");
  };

  const formatNaira = (value) =>
    `₦${Number(value || 0).toLocaleString("en-NG")}`;

  // =====================================================
  // CARD INPUT HELPERS
  // =====================================================

  const formatCardNumber = (value) => {
    const digits = value.replace(/\D/g, "").slice(0, 16);
    return digits.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
  };

  const formatExpiry = (value) => {
    const digits = value.replace(/\D/g, "").slice(0, 4);
    if (digits.length >= 3) {
      return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    }
    return digits;
  };

  // =====================================================
  // SUBMIT PAYMENT
  // =====================================================

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");

    const digits = cardNumber.replace(/\s/g, "");

    if (!cardName.trim()) {
      setFormError("Please enter the name on the card.");
      return;
    }

    if (digits.length < 16) {
      setFormError("Please enter a valid 16-digit card number.");
      return;
    }

    if (!/^\d{2}\/\d{2}$/.test(expiry)) {
      setFormError("Enter expiry as MM/YY.");
      return;
    }

    if (cvv.replace(/\D/g, "").length < 3) {
      setFormError("Please enter a valid CVV.");
      return;
    }

    setSubmitting(true);

    try {
      // =================================================
      // TODO: Call Paystack / Flutterwave charge API
      // On success, create productBoosts record in Firestore
      // =================================================
      console.log("Card payment:", {
        productId,
        planId,
        amount,
        cardName: cardName.trim(),
      });

      await new Promise((resolve) => setTimeout(resolve, 1500));

      setSuccess(true);
    } catch (error) {
      console.error("Payment error:", error);
      setFormError("Payment failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="h-screen w-full bg-gray-50 text-gray-800 font-sans overflow-hidden">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-50
          w-[291px] min-w-[285px]
          lg:w-[291px] lg:min-w-[250px]
          bg-green-700 text-white
          flex flex-col h-screen overflow-hidden
          shadow-2xl lg:shadow-none
          transition-transform duration-300 ease-in-out
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
              lg:hidden absolute top-3 right-3
              w-9 h-9 rounded-lg text-white
              hover:bg-white/10 active:bg-white/20
              flex items-center justify-center transition z-20
            "
          >
            <FiX size={21} strokeWidth={2.5} />
          </button>

          <div className="flex items-center gap-3 pr-10">
            <div
              className="
                w-10 h-10 min-w-[40px] rounded-xl
                bg-[#008236] flex items-center justify-center
                shadow-lg shadow-black/30 border border-white/10
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
            flex-1 px-4 py-3
            overflow-y-auto overflow-x-hidden overscroll-contain
            flex flex-col justify-start gap-1
          "
        >
          {menuItems.map(
            ({ label, icon: Icon, path, badge, new: isNew }) => {
              const active = isActive(path);

              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => handleNavigation(path)}
                  className={`
                    w-full flex items-center gap-3
                    px-3.5 py-3 rounded-xl text-left
                    transition-all flex-shrink-0
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
                        min-w-[21px] h-[21px] px-1.5 rounded-full
                        bg-red-500 text-white text-[10px] font-bold
                        flex items-center justify-center flex-shrink-0
                      "
                    >
                      {badge}
                    </span>
                  )}
                  {isNew && (
                    <span
                      className={`
                        px-1.5 py-0.5 rounded-full text-[9px] font-bold
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
              w-full flex items-center gap-3
              px-3.5 py-3 rounded-xl text-white
              hover:bg-white/10 active:bg-white/20
              transition text-left
            "
          >
            <FiLogOut size={19} />
            <span className="text-[14px]">Logout</span>
          </button>
        </div>

        <div className="px-4 pb-3 flex-shrink-0">
          <div className="border border-green-300/30 bg-green-900/20 rounded-xl p-3.5 text-center">
            <div className="text-2xl mb-1">👑</div>
            <h3 className="font-bold text-sm">Go Premium</h3>
            <p className="text-[10px] text-green-100 leading-4 mt-1">
              Boost your products and reach more students.
            </p>
            <button
              type="button"
              onClick={() => handleNavigation("/seller/promotions")}
              className="
                w-full mt-2 h-9 rounded-lg
                bg-white text-[#008236] font-bold text-xs
                hover:bg-green-50 active:bg-green-100 transition
              "
            >
              Upgrade Now
            </button>
          </div>
        </div>
      </aside>

      <div
        className="
          min-w-0 flex flex-col h-screen w-full
          lg:ml-[291px] lg:w-[calc(100%-291px)]
        "
      >
        <header
          className="
            min-h-[70px] bg-[#007233] text-white
            flex items-center
            px-3 sm:px-5 lg:px-8 py-3
            gap-2 sm:gap-4 flex-shrink-0
          "
        >
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
            className="
              lg:hidden w-10 h-10 min-w-[40px] rounded-lg
              hover:bg-white/10 active:bg-white/20
              flex items-center justify-center flex-shrink-0
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
                relative w-9 h-9 sm:w-10 sm:h-10 rounded-full
                hover:bg-white/10 active:bg-white/20
                flex items-center justify-center transition flex-shrink-0
              "
            >
              <FiBell size={20} />
              <span
                className="
                  absolute -top-0.5 -right-0.5
                  min-w-[17px] h-[17px] px-1 rounded-full
                  bg-red-500 text-white text-[9px] font-bold
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
                relative w-9 h-9 sm:w-10 sm:h-10 rounded-full
                hover:bg-white/10 active:bg-white/20
                flex items-center justify-center transition flex-shrink-0
              "
            >
              <FiMessageCircle size={20} />
              {unreadMessages > 0 && (
                <span
                  className="
                    absolute -top-0.5 -right-0.5
                    min-w-[17px] h-[17px] px-1 rounded-full
                    bg-red-500 text-white text-[9px] font-bold
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
                    w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover
                    border-2 border-white/30
                  "
                />
              ) : (
                <div
                  className="
                    w-8 h-8 sm:w-9 sm:h-9 rounded-full
                    bg-gray-200 text-gray-700
                    flex items-center justify-center
                    font-bold text-sm border-2 border-white/30
                    flex-shrink-0
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

        <main
          className="
            flex-1 overflow-y-auto overflow-x-hidden
            bg-gray-50
            px-3 sm:px-5 md:px-6 lg:px-8
            py-5 sm:py-6 lg:py-8 font-sans
          "
        >
          {/* BACK */}

          <div className="mb-5 sm:mb-6 flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleNavigation("/seller/promotions")}
              className="
                w-10 h-10 rounded-xl
                bg-white border border-gray-100 text-[#008236]
                flex items-center justify-center
                hover:bg-green-50 transition flex-shrink-0
              "
            >
              <FiArrowLeft size={18} />
            </button>

            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
                Pay with card
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                Complete payment to boost your product.
              </p>
            </div>
          </div>

          {success ? (
            <div
              className="
                max-w-lg mx-auto
                bg-white rounded-2xl border border-green-100
                shadow-sm p-6 sm:p-8 text-center
              "
            >
              <div
                className="
                  w-14 h-14 mx-auto rounded-full
                  bg-green-50 text-[#008236]
                  flex items-center justify-center mb-4
                "
              >
                <FiCheckCircle size={28} />
              </div>

              <h2 className="text-xl font-bold text-gray-900">
                Payment successful
              </h2>

              <p className="text-sm text-gray-500 mt-2 leading-6">
                {productName} is now boosted for{" "}
                {String(planLabel).toLowerCase()}. It will appear at
                the top of listings.
              </p>

              <p className="text-lg font-bold text-[#008236] mt-4">
                {formatNaira(amount)}
              </p>

              <button
                type="button"
                onClick={() =>
                  handleNavigation("/seller/promotions")
                }
                className="
                  mt-6 w-full h-11 rounded-xl
                  bg-[#008236] text-white text-sm font-semibold
                  hover:bg-[#006f2e] transition
                "
              >
                Back to Promotions
              </button>
            </div>
          ) : (
            <div className="max-w-lg mx-auto space-y-5">
              {/* ORDER SUMMARY */}

              <div
                className="
                  bg-gradient-to-r from-[#007233] to-[#008f3f]
                  rounded-2xl p-5 text-white shadow-sm
                "
              >
                <p className="text-xs text-green-100 font-medium">
                  You are paying
                </p>
                <p className="text-3xl font-bold tracking-tight mt-1">
                  {formatNaira(amount)}
                </p>
                <p className="text-sm text-green-50 mt-2">
                  {productName} · {planLabel} boost
                </p>
              </div>

              {/* CARD FORM */}

              <form
                onSubmit={handleSubmit}
                className="
                  bg-white rounded-2xl border border-gray-100
                  shadow-sm overflow-hidden
                "
              >
                <div className="p-5 border-b border-gray-100 flex items-center gap-2">
                  <FiCreditCard size={18} className="text-[#008236]" />
                  <h2 className="text-base font-bold text-gray-800">
                    Card details
                  </h2>
                </div>

                <div className="p-5 space-y-4">
                  {formError && (
                    <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
                      {formError}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2">
                      Name on card
                    </label>
                    <input
                      type="text"
                      value={cardName}
                      onChange={(e) => {
                        setCardName(e.target.value);
                        if (formError) setFormError("");
                      }}
                      disabled={submitting}
                      placeholder="As shown on card"
                      className="
                        w-full h-12 px-3.5 rounded-xl
                        border border-gray-200 bg-gray-50
                        text-sm text-gray-800 outline-none
                        focus:border-[#008236] focus:ring-4 focus:ring-green-50
                        transition disabled:opacity-60
                      "
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2">
                      Card number
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={cardNumber}
                      onChange={(e) => {
                        setCardNumber(formatCardNumber(e.target.value));
                        if (formError) setFormError("");
                      }}
                      disabled={submitting}
                      placeholder="1234 5678 9012 3456"
                      className="
                        w-full h-12 px-3.5 rounded-xl
                        border border-gray-200 bg-gray-50
                        text-sm text-gray-800 outline-none tracking-wider
                        focus:border-[#008236] focus:ring-4 focus:ring-green-50
                        transition disabled:opacity-60
                      "
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-2">
                        Expiry (MM/YY)
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={expiry}
                        onChange={(e) => {
                          setExpiry(formatExpiry(e.target.value));
                          if (formError) setFormError("");
                        }}
                        disabled={submitting}
                        placeholder="MM/YY"
                        className="
                          w-full h-12 px-3.5 rounded-xl
                          border border-gray-200 bg-gray-50
                          text-sm text-gray-800 outline-none
                          focus:border-[#008236] focus:ring-4 focus:ring-green-50
                          transition disabled:opacity-60
                        "
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-2">
                        CVV
                      </label>
                      <input
                        type="password"
                        inputMode="numeric"
                        maxLength={4}
                        value={cvv}
                        onChange={(e) => {
                          setCvv(
                            e.target.value.replace(/\D/g, "").slice(0, 4)
                          );
                          if (formError) setFormError("");
                        }}
                        disabled={submitting}
                        placeholder="•••"
                        className="
                          w-full h-12 px-3.5 rounded-xl
                          border border-gray-200 bg-gray-50
                          text-sm text-gray-800 outline-none
                          focus:border-[#008236] focus:ring-4 focus:ring-green-50
                          transition disabled:opacity-60
                        "
                      />
                    </div>
                  </div>

                  <div
                    className="
                      flex items-center gap-2
                      rounded-xl bg-green-50 border border-green-100
                      px-3.5 py-3 text-[11px] text-gray-600
                    "
                  >
                    <FiLock size={14} className="text-[#008236] flex-shrink-0" />
                    Your payment is encrypted and secure.
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="
                      w-full h-12 rounded-xl
                      bg-[#008236] text-white
                      text-sm font-semibold
                      flex items-center justify-center gap-2
                      hover:bg-[#006f2e] active:bg-[#005f28]
                      transition shadow-sm
                      disabled:opacity-60 disabled:cursor-not-allowed
                    "
                  >
                    {submitting ? (
                      "Processing payment..."
                    ) : (
                      <>
                        <FiZap size={16} />
                        Pay {formatNaira(amount)}
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() =>
                      handleNavigation("/seller/promotions")
                    }
                    className="
                      w-full h-11 rounded-xl
                      border border-gray-200 bg-white
                      text-gray-600 text-sm font-semibold
                      hover:bg-gray-50 transition
                      disabled:opacity-50
                    "
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default SellerPayment;