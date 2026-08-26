import { useState } from "react";

import { useNavigate, useLocation } from "react-router-dom";

import {
  FiGrid,
  FiPackage,
  FiShoppingBag,
  FiMessageCircle,
  FiDollarSign,
  FiStar,
  FiBarChart2,
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
  FiAlertCircle,
  FiRefreshCw,
} from "react-icons/fi";

import { useAuth } from "../../context/AuthContext";

// =====================================================
// WITHDRAW EARNINGS
// =====================================================

function WithdrawEarnings({ unreadMessages = 0 }) {
  const navigate = useNavigate();
  const location = useLocation();

  const { firebaseUser } = useAuth();

  // =====================================================
  // SIDEBAR
  // =====================================================

  const [sidebarOpen, setSidebarOpen] = useState(false);

  // =====================================================
  // FORM STATE
  // =====================================================

  const [amount, setAmount] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
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
  // AVAILABLE BALANCE (mock — wire to real data later)
  // =====================================================

  const availableBalance = 284750;

  // =====================================================
  // MENU ITEMS (matches SellerDashboard)
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

    // Highlight Earnings when on withdraw page
    if (path === "/seller/earnings") {
      return (
        location.pathname.startsWith("/seller/earnings") ||
        location.pathname.startsWith("/seller/withdraw")
      );
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

  const formatNaira = (value) =>
    `₦${Number(value || 0).toLocaleString("en-NG")}`;

  // =====================================================
  // QUICK AMOUNT PRESETS
  // =====================================================

  const presets = [
    Math.floor(availableBalance * 0.25),
    Math.floor(availableBalance * 0.5),
    Math.floor(availableBalance * 0.75),
    availableBalance,
  ];

  // =====================================================
  // SUBMIT WITHDRAWAL
  // =====================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    setFormError("");
    setSuccess(false);

    const numericAmount = Number(amount);

    if (!amount || Number.isNaN(numericAmount) || numericAmount <= 0) {
      setFormError("Please enter a valid withdrawal amount.");
      return;
    }

    if (numericAmount < 1000) {
      setFormError("Minimum withdrawal amount is ₦1,000.");
      return;
    }

    if (numericAmount > availableBalance) {
      setFormError("Amount exceeds your available balance.");
      return;
    }

    if (!bankName.trim()) {
      setFormError("Please enter your bank name.");
      return;
    }

    if (!accountNumber.trim() || accountNumber.trim().length < 10) {
      setFormError("Please enter a valid 10-digit account number.");
      return;
    }

    if (!accountName.trim()) {
      setFormError("Please enter the account name.");
      return;
    }

    setSubmitting(true);

    try {
      // =================================================
      // TODO: Save withdrawal request to Firestore
      // =================================================
      // await addDoc(collection(db, "withdrawals"), {
      //   sellerId: firebaseUser.uid,
      //   amount: numericAmount,
      //   bankName: bankName.trim(),
      //   accountNumber: accountNumber.trim(),
      //   accountName: accountName.trim(),
      //   status: "Pending",
      //   createdAt: serverTimestamp(),
      // });

      await new Promise((resolve) => setTimeout(resolve, 1200));

      setSuccess(true);
      setAmount("");
      setBankName("");
      setAccountNumber("");
      setAccountName("");
    } catch (error) {
      console.error("Withdrawal error:", error);
      setFormError("Unable to submit withdrawal. Please try again.");
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
        {/* SIDEBAR HEADER */}

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

        {/* NAVIGATION */}

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

        {/* LOGOUT */}

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

        {/* PREMIUM CARD */}

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
              Boost your products and services and reach more
              students.
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
        {/* TOP BAR */}

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

          <div
            className="
              flex
              items-center
              gap-2
              text-white
              flex-shrink-0
            "
          >
            <FiShoppingBag
              size={19}
              className="text-green-200"
            />

            <span
              className="
                text-sm
                sm:text-base
                font-semibold
                whitespace-nowrap
              "
            >
              Your Store
            </span>
          </div>

          <div
            className="
              ml-auto
              flex
              items-center
              gap-0.5
              sm:gap-2
            "
          >
            <button
              type="button"
              onClick={handleNotifications}
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

            <button
              type="button"
              onClick={() =>
                handleNavigation("/seller/messages")
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

            <button
              type="button"
              onClick={() =>
                handleNavigation("/seller/profile")
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
                    flex-shrink-0
                  "
                >
                  {sellerFirstName?.charAt(0)?.toUpperCase()}
                </div>
              )}

              <div className="hidden sm:block text-left">
                <p
                  className="
                    text-xs
                    font-bold
                    leading-4
                    max-w-[180px]
                    truncate
                  "
                  title={sellerFullName}
                >
                  {sellerFullName}
                </p>

                <p className="text-[10px] text-green-100 mt-0.5">
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

        {/* WITHDRAW CONTENT */}

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
          {/* BACK + TITLE */}

          <div className="mb-5 sm:mb-6 flex items-center gap-3">
            <button
              type="button"
              onClick={() =>
                handleNavigation("/seller/earnings")
              }
              className="
                w-10
                h-10
                rounded-xl
                bg-white
                border
                border-gray-100
                text-[#008236]
                flex
                items-center
                justify-center
                hover:bg-green-50
                transition
                flex-shrink-0
              "
            >
              <FiArrowLeft size={18} />
            </button>

            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
                Withdraw Funds
              </h1>

              <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                Send money from your available balance to your bank.
              </p>
            </div>
          </div>

          {/* AVAILABLE BALANCE BANNER */}

          <div
            className="
              mb-5
              sm:mb-6
              bg-gradient-to-r
              from-[#007233]
              to-[#008f3f]
              rounded-2xl
              p-5
              sm:p-6
              text-white
              shadow-sm
              relative
              overflow-hidden
            "
          >
            <div
              className="
                absolute
                -right-8
                -top-12
                w-40
                h-40
                rounded-full
                bg-white/10
              "
            />

            <div className="relative z-10 flex items-center gap-4">
              <div
                className="
                  w-12
                  h-12
                  rounded-2xl
                  bg-white/15
                  flex
                  items-center
                  justify-center
                  flex-shrink-0
                "
              >
                <FiCreditCard size={22} />
              </div>

              <div>
                <p className="text-xs sm:text-sm text-green-100 font-medium">
                  Available Balance
                </p>

                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mt-0.5">
                  {formatNaira(availableBalance)}
                </h2>
              </div>
            </div>
          </div>

          {/* SUCCESS MESSAGE */}

          {success && (
            <div
              className="
                mb-5
                rounded-2xl
                bg-green-50
                border
                border-green-100
                p-4
                sm:p-5
                flex
                items-start
                gap-3
              "
            >
              <div
                className="
                  w-10
                  h-10
                  rounded-xl
                  bg-white
                  text-[#008236]
                  flex
                  items-center
                  justify-center
                  flex-shrink-0
                  shadow-sm
                "
              >
                <FiCheckCircle size={20} />
              </div>

              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-800">
                  Withdrawal request submitted
                </p>

                <p className="text-xs text-gray-500 mt-1 leading-5">
                  Your request is being processed. Funds usually
                  arrive in 1–3 business days.
                </p>

                <button
                  type="button"
                  onClick={() =>
                    handleNavigation("/seller/earnings")
                  }
                  className="
                    mt-3
                    text-xs
                    font-semibold
                    text-[#008236]
                    hover:underline
                  "
                >
                  Back to Earnings
                </button>
              </div>
            </div>
          )}

          {/* FORM CARD */}

          {!success && (
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
              <div className="p-5 sm:p-6 border-b border-gray-100">
                <h2 className="text-base sm:text-lg font-bold text-gray-800">
                  Withdrawal details
                </h2>

                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                  Enter the amount and your bank account details.
                </p>
              </div>

              <form
                onSubmit={handleSubmit}
                className="p-5 sm:p-6 space-y-5"
              >
                {formError && (
                  <div
                    className="
                      rounded-xl
                      bg-red-50
                      border
                      border-red-100
                      px-4
                      py-3
                      text-sm
                      text-red-600
                      flex
                      items-center
                      gap-2
                    "
                  >
                    <FiAlertCircle size={16} className="flex-shrink-0" />
                    {formError}
                  </div>
                )}

                {/* AMOUNT */}

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">
                    Amount to withdraw
                  </label>

                  <div className="relative">
                    <span
                      className="
                        absolute
                        left-3.5
                        top-1/2
                        -translate-y-1/2
                        text-[#008236]
                        font-bold
                        text-sm
                      "
                    >
                      ₦
                    </span>

                    <input
                      type="number"
                      min="1000"
                      max={availableBalance}
                      step="100"
                      value={amount}
                      onChange={(e) => {
                        setAmount(e.target.value);
                        if (formError) setFormError("");
                      }}
                      disabled={submitting}
                      placeholder="0"
                      className="
                        w-full
                        h-12
                        pl-8
                        pr-3.5
                        rounded-xl
                        border
                        border-gray-200
                        bg-gray-50
                        text-sm
                        font-semibold
                        text-gray-800
                        outline-none
                        focus:border-[#008236]
                        focus:ring-4
                        focus:ring-green-50
                        transition
                        disabled:opacity-60
                      "
                    />
                  </div>

                  {/* PRESETS */}

                  <div className="flex flex-wrap gap-2 mt-3">
                    {presets.map((preset, index) => {
                      const labels = ["25%", "50%", "75%", "Max"];
                      const isActive =
                        Number(amount) === preset;

                      return (
                        <button
                          key={labels[index]}
                          type="button"
                          disabled={submitting}
                          onClick={() => {
                            setAmount(String(preset));
                            if (formError) setFormError("");
                          }}
                          className={`
                            h-8
                            px-3
                            rounded-lg
                            text-[11px]
                            font-semibold
                            transition
                            ${
                              isActive
                                ? "bg-[#008236] text-white"
                                : "bg-green-50 text-[#008236] border border-green-100 hover:bg-green-100"
                            }
                          `}
                        >
                          {labels[index]}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* BANK NAME */}

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">
                    Bank name
                  </label>

                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => {
                      setBankName(e.target.value);
                      if (formError) setFormError("");
                    }}
                    disabled={submitting}
                    placeholder="e.g. GTBank, Access Bank, UBA"
                    className="
                      w-full
                      h-12
                      px-3.5
                      rounded-xl
                      border
                      border-gray-200
                      bg-gray-50
                      text-sm
                      text-gray-800
                      outline-none
                      focus:border-[#008236]
                      focus:ring-4
                      focus:ring-green-50
                      transition
                      disabled:opacity-60
                    "
                  />
                </div>

                {/* ACCOUNT NUMBER */}

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">
                    Account number
                  </label>

                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={10}
                    value={accountNumber}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "");
                      setAccountNumber(value);
                      if (formError) setFormError("");
                    }}
                    disabled={submitting}
                    placeholder="10-digit NUBAN"
                    className="
                      w-full
                      h-12
                      px-3.5
                      rounded-xl
                      border
                      border-gray-200
                      bg-gray-50
                      text-sm
                      text-gray-800
                      outline-none
                      focus:border-[#008236]
                      focus:ring-4
                      focus:ring-green-50
                      transition
                      disabled:opacity-60
                    "
                  />
                </div>

                {/* ACCOUNT NAME */}

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">
                    Account name
                  </label>

                  <input
                    type="text"
                    value={accountName}
                    onChange={(e) => {
                      setAccountName(e.target.value);
                      if (formError) setFormError("");
                    }}
                    disabled={submitting}
                    placeholder="Name on the bank account"
                    className="
                      w-full
                      h-12
                      px-3.5
                      rounded-xl
                      border
                      border-gray-200
                      bg-gray-50
                      text-sm
                      text-gray-800
                      outline-none
                      focus:border-[#008236]
                      focus:ring-4
                      focus:ring-green-50
                      transition
                      disabled:opacity-60
                    "
                  />
                </div>

                {/* NOTE */}

                <div
                  className="
                    rounded-xl
                    bg-green-50
                    border
                    border-green-100
                    px-4
                    py-3
                    text-xs
                    text-gray-600
                    leading-5
                  "
                >
                  Withdrawals are processed within{" "}
                  <span className="font-semibold text-[#008236]">
                    1–3 business days
                  </span>
                  . Minimum amount is ₦1,000.
                </div>

                {/* ACTIONS */}

                <div className="flex flex-col sm:flex-row gap-3 pt-1">
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() =>
                      handleNavigation("/seller/earnings")
                    }
                    className="
                      h-12
                      px-5
                      rounded-xl
                      border
                      border-gray-200
                      bg-white
                      text-gray-600
                      text-sm
                      font-semibold
                      hover:bg-gray-50
                      transition
                      disabled:opacity-50
                      sm:flex-1
                    "
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="
                      h-12
                      px-5
                      rounded-xl
                      bg-[#008236]
                      text-white
                      text-sm
                      font-semibold
                      flex
                      items-center
                      justify-center
                      gap-2
                      hover:bg-[#006f2e]
                      active:bg-[#005f28]
                      transition
                      shadow-sm
                      disabled:opacity-60
                      disabled:cursor-not-allowed
                      sm:flex-[1.4]
                    "
                  >
                    {submitting ? (
                      <>
                        <FiRefreshCw
                          size={17}
                          className="animate-spin"
                        />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <FiCreditCard size={17} />
                        Request Withdrawal
                      </>
                    )}
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

export default WithdrawEarnings;