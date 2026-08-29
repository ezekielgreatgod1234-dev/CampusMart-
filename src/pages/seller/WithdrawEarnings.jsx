import { useEffect, useState } from "react";
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
  FiAlertCircle,
  FiRefreshCw,
  FiLock,
  FiEye,
  FiEyeOff,
} from "react-icons/fi";

import {
  doc,
  onSnapshot,
  addDoc,
  updateDoc,
  increment,
  collection,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "../../context/firebase";
import { useAuth } from "../../context/AuthContext";

// =====================================================
// HASH PIN (SHA-256 via Web Crypto)
// =====================================================
async function hashPin(pin) {
  const encoder = new TextEncoder();
  const data = encoder.encode(String(pin).trim());
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function WithdrawEarnings({ unreadMessages = 0, profile = {} }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { firebaseUser } = useAuth();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [amount, setAmount] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [successAmount, setSuccessAmount] = useState(0);

  const [availableBalance, setAvailableBalance] = useState(0);
  const [loadingBalance, setLoadingBalance] = useState(true);

  // =====================================================
  // PAYMENT PIN STATE
  // =====================================================
  const [hasPaymentPin, setHasPaymentPin] = useState(false);
  const [storedPinHash, setStoredPinHash] = useState(null);

  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [pinMode, setPinMode] = useState("verify"); // "set" | "verify"
  const [pinValue, setPinValue] = useState("");
  const [confirmPinValue, setConfirmPinValue] = useState("");
  const [pinError, setPinError] = useState("");
  const [pinSubmitting, setPinSubmitting] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);

  // Pending withdrawal data after PIN success
  const [pendingWithdrawal, setPendingWithdrawal] = useState(null);

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
  // LIVE AVAILABLE BALANCE + PIN STATUS
  // =====================================================

  useEffect(() => {
    if (!firebaseUser?.uid) {
      setAvailableBalance(0);
      setHasPaymentPin(false);
      setStoredPinHash(null);
      setLoadingBalance(false);
      return;
    }

    setLoadingBalance(true);

    const unsub = onSnapshot(
      doc(db, "users", firebaseUser.uid),
      (snap) => {
        const data = snap.data() || {};
        setAvailableBalance(Number(data.availableBalance) || 0);

        const pinHash = data.paymentPinHash || null;
        setStoredPinHash(pinHash);
        setHasPaymentPin(Boolean(pinHash));

        setLoadingBalance(false);
      },
      (error) => {
        console.error("Balance listener error:", error);
        setLoadingBalance(false);
      }
    );

    return () => unsub();
  }, [firebaseUser?.uid]);

  // =====================================================
  // MENU (Reviews & Analytics removed)
  // =====================================================

  const menuItems = [
    { label: "Dashboard", icon: FiGrid, path: "/seller-dashboard" },
    { label: "Products", icon: FiPackage, path: "/seller/products" },
    { label: "Orders", icon: FiShoppingBag, path: "/seller/orders" },
    {
      label: "Messages",
      icon: FiMessageCircle,
      path: "/seller/messages",
      badge: unreadMessages,
    },
    { label: "Earnings", icon: FiDollarSign, path: "/seller/earnings" },
    {
      label: "Promotions",
      icon: FiTag,
      path: "/seller/promotions",
      new: true,
    },
    { label: "Profile", icon: FiUser, path: "/seller/profile" },
    { label: "Settings", icon: FiSettings, path: "/seller/settings" },
  ];

  const isActive = (path) => {
    if (path === "/seller-dashboard") {
      return location.pathname === "/seller-dashboard";
    }
    if (path === "/seller/earnings") {
      return (
        location.pathname.startsWith("/seller/earnings") ||
        location.pathname.startsWith("/seller/withdraw")
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

  const presets = [
    Math.floor(availableBalance * 0.25),
    Math.floor(availableBalance * 0.5),
    Math.floor(availableBalance * 0.75),
    availableBalance,
  ];

  // =====================================================
  // OPEN PIN MODAL AFTER FORM VALIDATION
  // =====================================================

  const handleSubmit = (event) => {
    event.preventDefault();

    setFormError("");
    setSuccess(false);
    setPinError("");

    if (!firebaseUser?.uid) {
      setFormError("You must be logged in to withdraw.");
      return;
    }

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

    // Store validated data and open PIN modal
    setPendingWithdrawal({
      numericAmount,
      bankName: bankName.trim(),
      accountNumber: accountNumber.trim(),
      accountName: accountName.trim(),
    });

    setPinValue("");
    setConfirmPinValue("");
    setPinError("");
    setShowPin(false);
    setShowConfirmPin(false);

    if (hasPaymentPin) {
      setPinMode("verify");
    } else {
      setPinMode("set");
    }

    setPinModalOpen(true);
  };

  // =====================================================
  // ACTUAL WITHDRAWAL (called after PIN success)
  // =====================================================

  const processWithdrawal = async (data) => {
    if (!firebaseUser?.uid || !data) return;

    setSubmitting(true);
    setPinSubmitting(true);

    try {
      // 1) Create withdrawal request
      await addDoc(collection(db, "withdrawals"), {
        sellerId: firebaseUser.uid,
        amount: data.numericAmount,
        bankName: data.bankName,
        accountNumber: data.accountNumber,
        accountName: data.accountName,
        status: "Pending",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // 2) Deduct from available balance
      await updateDoc(doc(db, "users", firebaseUser.uid), {
        availableBalance: increment(-data.numericAmount),
        updatedAt: serverTimestamp(),
      });

      // 3) Optional ledger entry
      try {
        await addDoc(collection(db, "earnings"), {
          sellerId: firebaseUser.uid,
          type: "withdrawal",
          title: "Withdrawal request",
          description: `${data.bankName} · ${data.accountNumber}`,
          amount: -data.numericAmount,
          status: "Pending",
          createdAt: serverTimestamp(),
        });
      } catch (ledgerErr) {
        console.warn("Could not write withdrawal ledger row:", ledgerErr);
      }

      setSuccessAmount(data.numericAmount);
      setSuccess(true);
      setAmount("");
      setBankName("");
      setAccountNumber("");
      setAccountName("");
      setPendingWithdrawal(null);
      setPinModalOpen(false);
    } catch (error) {
      console.error("Withdrawal error:", error);
      setFormError(
        error?.message?.includes("permission")
          ? "Permission denied. Check Firestore rules for withdrawals."
          : "Unable to submit withdrawal. Please try again."
      );
      setPinModalOpen(false);
    } finally {
      setSubmitting(false);
      setPinSubmitting(false);
    }
  };

  // =====================================================
  // PIN MODAL HANDLERS
  // =====================================================

  const closePinModal = () => {
    if (pinSubmitting) return;
    setPinModalOpen(false);
    setPinValue("");
    setConfirmPinValue("");
    setPinError("");
    setPendingWithdrawal(null);
  };

  const handlePinSubmit = async (event) => {
    event.preventDefault();
    setPinError("");

    const pin = String(pinValue).trim();

    if (!/^\d{4}$/.test(pin)) {
      setPinError("PIN must be exactly 4 digits.");
      return;
    }

    if (pinMode === "set") {
      const confirm = String(confirmPinValue).trim();

      if (pin !== confirm) {
        setPinError("PINs do not match. Please try again.");
        return;
      }

      setPinSubmitting(true);

      try {
        const pinHash = await hashPin(pin);

        await updateDoc(doc(db, "users", firebaseUser.uid), {
          paymentPinHash: pinHash,
          paymentPinSetAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        // Local update (onSnapshot will also update)
        setStoredPinHash(pinHash);
        setHasPaymentPin(true);

        // Proceed with withdrawal
        await processWithdrawal(pendingWithdrawal);
      } catch (error) {
        console.error("Set PIN error:", error);
        setPinError("Unable to save PIN. Please try again.");
        setPinSubmitting(false);
      }
      return;
    }

    // VERIFY mode
    if (!storedPinHash) {
      setPinError("No PIN found. Please set a new one.");
      setPinMode("set");
      return;
    }

    setPinSubmitting(true);

    try {
      const inputHash = await hashPin(pin);

      if (inputHash !== storedPinHash) {
        setPinError("Incorrect PIN. Please try again.");
        setPinSubmitting(false);
        return;
      }

      // PIN correct → process withdrawal
      await processWithdrawal(pendingWithdrawal);
    } catch (error) {
      console.error("Verify PIN error:", error);
      setPinError("Unable to verify PIN. Please try again.");
      setPinSubmitting(false);
    }
  };

  return (
    <div className="h-screen w-full bg-gray-50 text-gray-800 font-sans overflow-hidden">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50
          w-[291px] min-w-[285px] lg:w-[291px] lg:min-w-[250px]
          bg-green-700 text-white flex flex-col h-screen overflow-hidden
          shadow-2xl lg:shadow-none transition-transform duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        <div className="relative px-5 pt-19 lg:pt-5 pb-4 flex-shrink-0">
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
            className="lg:hidden absolute top-3 right-3 w-9 h-9 rounded-lg text-white hover:bg-white/10 active:bg-white/20 flex items-center justify-center transition z-20"
          >
            <FiX size={21} strokeWidth={2.5} />
          </button>

          <div className="flex items-center gap-3 pr-10">
            <div className="w-10 h-10 min-w-[40px] rounded-xl bg-[#008236] flex items-center justify-center shadow-lg shadow-black/30 border border-white/10 flex-shrink-0">
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

        <nav className="flex-1 px-4 py-3 overflow-y-auto overflow-x-hidden overscroll-contain flex flex-col justify-start gap-1">
          {menuItems.map(({ label, icon: Icon, path, badge, new: isNew }) => {
            const active = isActive(path);
            return (
              <button
                key={label}
                type="button"
                onClick={() => handleNavigation(path)}
                className={`
                  w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-left
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
                  <span className="min-w-[21px] h-[21px] px-1.5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                    {badge}
                  </span>
                )}
                {isNew && (
                  <span
                    className={`
                      px-1.5 py-0.5 rounded-full text-[9px] font-bold flex-shrink-0
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
          })}
        </nav>

        <div className="px-4 pb-4 flex-shrink-0">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-white hover:bg-white/10 active:bg-white/20 transition text-left"
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
              Boost your products and services and reach more students.
            </p>
            <button
              type="button"
              onClick={() => handleNavigation("/seller/promotions")}
              className="w-full mt-2 h-9 rounded-lg bg-white text-[#008236] font-bold text-xs hover:bg-green-50 active:bg-green-100 transition"
            >
              Upgrade Now
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <div className="min-w-0 flex flex-col h-screen w-full lg:ml-[291px] lg:w-[calc(100%-291px)]">
        <header className="min-h-[70px] bg-[#007233] text-white flex items-center px-3 sm:px-5 lg:px-8 py-3 gap-2 sm:gap-4 flex-shrink-0">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
            className="lg:hidden w-10 h-10 min-w-[40px] rounded-lg hover:bg-white/10 active:bg-white/20 flex items-center justify-center flex-shrink-0"
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
              className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full hover:bg-white/10 active:bg-white/20 flex items-center justify-center transition flex-shrink-0"
            >
              <FiBell size={20} />
              <span className="absolute -top-0.5 -right-0.5 min-w-[17px] h-[17px] px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                5
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleNavigation("/seller/messages")}
              aria-label="Messages"
              className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full hover:bg-white/10 active:bg-white/20 flex items-center justify-center transition flex-shrink-0"
            >
              <FiMessageCircle size={20} />
              {unreadMessages > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[17px] h-[17px] px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                  {unreadMessages}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => handleNavigation("/seller/profile")}
              className="flex items-center gap-2 ml-0.5 hover:bg-white/10 active:bg-white/20 rounded-lg px-1 sm:px-1.5 py-1.5 transition flex-shrink-0"
            >
              {sellerImage ? (
                <img
                  src={sellerImage}
                  alt={sellerFullName}
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover border-2 border-white/30"
                />
              ) : (
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center font-bold text-sm border-2 border-white/30 flex-shrink-0">
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
                <p className="text-[10px] text-green-100 mt-0.5">Seller</p>
              </div>
              <FiChevronDown size={16} className="hidden sm:block" />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-gray-50 px-3 sm:px-5 md:px-6 lg:px-8 py-5 sm:py-6 lg:py-8 font-sans">
          <div className="mb-5 sm:mb-6 flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleNavigation("/seller/earnings")}
              className="w-10 h-10 rounded-xl bg-white border border-gray-100 text-[#008236] flex items-center justify-center hover:bg-green-50 transition flex-shrink-0"
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

          {/* BALANCE BANNER */}
          <div className="mb-5 sm:mb-6 bg-gradient-to-r from-[#007233] to-[#008f3f] rounded-2xl p-5 sm:p-6 text-white shadow-sm relative overflow-hidden">
            <div className="absolute -right-8 -top-12 w-40 h-40 rounded-full bg-white/10" />
            <div className="relative z-10 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center flex-shrink-0">
                <FiCreditCard size={22} />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-green-100 font-medium">
                  Available Balance
                </p>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mt-0.5">
                  {loadingBalance ? "…" : formatNaira(availableBalance)}
                </h2>
              </div>
            </div>
          </div>

          {success && (
            <div className="mb-5 rounded-2xl bg-green-50 border border-green-100 p-4 sm:p-5 flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-white text-[#008236] flex items-center justify-center flex-shrink-0 shadow-sm">
                <FiCheckCircle size={20} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-800">
                  Withdrawal request submitted
                </p>
                <p className="text-xs text-gray-500 mt-1 leading-5">
                  {formatNaira(successAmount)} was reserved from your balance.
                  Funds usually arrive in 1–3 business days after admin
                  approval.
                </p>
                <button
                  type="button"
                  onClick={() => handleNavigation("/seller/earnings")}
                  className="mt-3 text-xs font-semibold text-[#008236] hover:underline"
                >
                  Back to Earnings
                </button>
              </div>
            </div>
          )}

          {!success && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-5 sm:p-6 border-b border-gray-100">
                <h2 className="text-base sm:text-lg font-bold text-gray-800">
                  Withdrawal details
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                  Enter the amount and your bank account details.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5">
                {formError && (
                  <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600 flex items-center gap-2">
                    <FiAlertCircle size={16} className="flex-shrink-0" />
                    {formError}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">
                    Amount to withdraw
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#008236] font-bold text-sm">
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
                      disabled={submitting || loadingBalance}
                      placeholder="0"
                      className="w-full h-12 pl-8 pr-3.5 rounded-xl border border-gray-200 bg-gray-50 text-sm font-semibold text-gray-800 outline-none focus:border-[#008236] focus:ring-4 focus:ring-green-50 transition disabled:opacity-60"
                    />
                  </div>

                  <div className="flex flex-wrap gap-2 mt-3">
                    {presets.map((preset, index) => {
                      const labels = ["25%", "50%", "75%", "Max"];
                      const isPresetActive = Number(amount) === preset;
                      if (preset <= 0) return null;
                      return (
                        <button
                          key={labels[index]}
                          type="button"
                          disabled={submitting || loadingBalance}
                          onClick={() => {
                            setAmount(String(preset));
                            if (formError) setFormError("");
                          }}
                          className={`
                            h-8 px-3 rounded-lg text-[11px] font-semibold transition
                            ${
                              isPresetActive
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
                    className="w-full h-12 px-3.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-800 outline-none focus:border-[#008236] focus:ring-4 focus:ring-green-50 transition disabled:opacity-60"
                  />
                </div>

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
                    className="w-full h-12 px-3.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-800 outline-none focus:border-[#008236] focus:ring-4 focus:ring-green-50 transition disabled:opacity-60"
                  />
                </div>

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
                    className="w-full h-12 px-3.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-800 outline-none focus:border-[#008236] focus:ring-4 focus:ring-green-50 transition disabled:opacity-60"
                  />
                </div>

                <div className="rounded-xl bg-green-50 border border-green-100 px-4 py-3 text-xs text-gray-600 leading-5">
                  Withdrawals are processed within{" "}
                  <span className="font-semibold text-[#008236]">
                    1–3 business days
                  </span>
                  . Minimum amount is ₦1,000. The amount is reserved from your
                  available balance when you submit. You will be asked for your
                  payment PIN.
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-1">
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => handleNavigation("/seller/earnings")}
                    className="h-12 px-5 rounded-xl border border-gray-200 bg-white text-gray-600 text-sm font-semibold hover:bg-gray-50 transition disabled:opacity-50 sm:flex-1"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={
                      submitting || loadingBalance || availableBalance < 1000
                    }
                    className="h-12 px-5 rounded-xl bg-[#008236] text-white text-sm font-semibold flex items-center justify-center gap-2 hover:bg-[#006f2e] active:bg-[#005f28] transition shadow-sm disabled:opacity-60 disabled:cursor-not-allowed sm:flex-[1.4]"
                  >
                    {submitting ? (
                      <>
                        <FiRefreshCw size={17} className="animate-spin" />
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

      {/* =====================================================
          PAYMENT PIN MODAL
          ===================================================== */}
      {pinModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={closePinModal}
          />

          <div className="relative w-full max-w-[400px] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
            <div className="p-5 sm:p-6 border-b border-gray-100 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-50 text-[#008236] flex items-center justify-center flex-shrink-0">
                  <FiLock size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-800">
                    {pinMode === "set"
                      ? "Set Payment PIN"
                      : "Enter Payment PIN"}
                  </h3>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    {pinMode === "set"
                      ? "Create a 4-digit PIN to secure withdrawals."
                      : "Enter your 4-digit PIN to continue."}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closePinModal}
                disabled={pinSubmitting}
                className="w-9 h-9 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 flex items-center justify-center transition disabled:opacity-50"
              >
                <FiX size={20} />
              </button>
            </div>

            <form onSubmit={handlePinSubmit} className="p-5 sm:p-6 space-y-4">
              {pinError && (
                <div className="rounded-xl bg-red-50 border border-red-100 px-3.5 py-2.5 text-xs text-red-600 flex items-center gap-2">
                  <FiAlertCircle size={14} className="flex-shrink-0" />
                  {pinError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">
                  {pinMode === "set" ? "Create PIN" : "Payment PIN"}
                </label>
                <div className="relative">
                  <input
                    type={showPin ? "text" : "password"}
                    inputMode="numeric"
                    maxLength={4}
                    value={pinValue}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "").slice(0, 4);
                      setPinValue(value);
                      if (pinError) setPinError("");
                    }}
                    disabled={pinSubmitting}
                    placeholder="••••"
                    autoFocus
                    className="w-full h-12 px-3.5 pr-11 rounded-xl border border-gray-200 bg-gray-50 text-sm font-semibold tracking-[0.4em] text-center text-gray-800 outline-none focus:border-[#008236] focus:ring-4 focus:ring-green-50 transition disabled:opacity-60"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                    tabIndex={-1}
                  >
                    {showPin ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                  </button>
                </div>
              </div>

              {pinMode === "set" && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">
                    Confirm PIN
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPin ? "text" : "password"}
                      inputMode="numeric"
                      maxLength={4}
                      value={confirmPinValue}
                      onChange={(e) => {
                        const value = e.target.value
                          .replace(/\D/g, "")
                          .slice(0, 4);
                        setConfirmPinValue(value);
                        if (pinError) setPinError("");
                      }}
                      disabled={pinSubmitting}
                      placeholder="••••"
                      className="w-full h-12 px-3.5 pr-11 rounded-xl border border-gray-200 bg-gray-50 text-sm font-semibold tracking-[0.4em] text-center text-gray-800 outline-none focus:border-[#008236] focus:ring-4 focus:ring-green-50 transition disabled:opacity-60"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPin((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                      tabIndex={-1}
                    >
                      {showConfirmPin ? (
                        <FiEyeOff size={18} />
                      ) : (
                        <FiEye size={18} />
                      )}
                    </button>
                  </div>
                </div>
              )}

              <div className="rounded-xl bg-green-50 border border-green-100 px-3.5 py-2.5 text-[11px] text-gray-600 leading-5">
                {pinMode === "set"
                  ? "This PIN will be required for all future withdrawals. Keep it safe."
                  : "Your PIN is securely stored and remembered for this account."}
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-1">
                <button
                  type="button"
                  disabled={pinSubmitting}
                  onClick={closePinModal}
                  className="h-11 px-4 rounded-xl border border-gray-200 bg-white text-gray-600 text-sm font-semibold hover:bg-gray-50 transition disabled:opacity-50 sm:flex-1"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    pinSubmitting ||
                    pinValue.length !== 4 ||
                    (pinMode === "set" && confirmPinValue.length !== 4)
                  }
                  className="h-11 px-4 rounded-xl bg-[#008236] text-white text-sm font-semibold flex items-center justify-center gap-2 hover:bg-[#006f2e] active:bg-[#005f28] transition shadow-sm disabled:opacity-60 disabled:cursor-not-allowed sm:flex-[1.3]"
                >
                  {pinSubmitting ? (
                    <>
                      <FiRefreshCw size={16} className="animate-spin" />
                      {pinMode === "set" ? "Saving..." : "Verifying..."}
                    </>
                  ) : (
                    <>
                      <FiLock size={16} />
                      {pinMode === "set" ? "Set PIN & Continue" : "Confirm & Withdraw"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default WithdrawEarnings;