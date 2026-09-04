import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import {
  collection,
  onSnapshot,
  doc,
  getDoc,
  writeBatch,
} from "firebase/firestore";

import {
  FiGrid,
  FiUsers,
  FiPackage,
  FiShoppingBag,
  FiDollarSign,
  FiCreditCard,
  FiLogOut,
  FiMenu,
  FiX,
  FiTrendingUp,
  FiSearch,
  FiShield,
  FiRefreshCw,
  FiAlertCircle,
  FiCheckCircle,
  FiTrash2,
  FiAlertTriangle,
  FiMessageCircle,
} from "react-icons/fi";

import { db } from "../../context/firebase";
import { useAuth } from "../../context/AuthContext";

const ADMIN_EMAIL = "campusmart1234@gmail.com";

const BANKS = [
  { name: "Access Bank", code: "044" },
  { name: "Citibank Nigeria", code: "023" },
  { name: "Ecobank Nigeria", code: "050" },
  { name: "Fidelity Bank", code: "070" },
  { name: "First Bank of Nigeria", code: "011" },
  { name: "First City Monument Bank", code: "214" },
  { name: "Guaranty Trust Bank", code: "058" },
  { name: "Heritage Bank", code: "030" },
  { name: "Keystone Bank", code: "082" },
  { name: "Polaris Bank", code: "076" },
  { name: "Stanbic IBTC Bank", code: "221" },
  { name: "Standard Chartered Bank", code: "068" },
  { name: "Sterling Bank", code: "232" },
  { name: "Union Bank of Nigeria", code: "032" },
  { name: "United Bank for Africa", code: "033" },
  { name: "Unity Bank", code: "215" },
  { name: "Wema Bank", code: "035" },
  { name: "Zenith Bank", code: "057" },
  { name: "Kuda Bank", code: "50211" },
  { name: "Opay", code: "100004" },
  { name: "PalmPay", code: "100033" },
];

function AdminFees() {
  const navigate = useNavigate();
  const location = useLocation();
  const { firebaseUser } = useAuth();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);

  const [fees, setFees] = useState([]);
  const [platformWithdrawals, setPlatformWithdrawals] = useState([]);
  const [search, setSearch] = useState("");
  const [unreadSupportCount, setUnreadSupportCount] = useState(0);

  // Withdraw form
  const [amount, setAmount] = useState("");
  const [bankCode, setBankCode] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [successAmount, setSuccessAmount] = useState(0);

  // Clear data states
  const [showClearModal, setShowClearModal] = useState(false);
  const [clearingData, setClearingData] = useState(false);
  const [clearError, setClearError] = useState("");
  const [clearSuccess, setClearSuccess] = useState(false);

  // ACCESS CONTROL
  useEffect(() => {
    if (!firebaseUser) {
      setAllowed(false);
      setLoading(false);
      return;
    }

    const email = (firebaseUser.email || "").toLowerCase();

    if (email === ADMIN_EMAIL.toLowerCase()) {
      setAllowed(true);
      setLoading(false);
      return;
    }

    const check = async () => {
      try {
        const snap = await getDoc(doc(db, "users", firebaseUser.uid));
        const role = snap.exists() ? snap.data()?.role : null;
        setAllowed(role === "admin");
      } catch {
        setAllowed(false);
      } finally {
        setLoading(false);
      }
    };

    check();
  }, [firebaseUser]);

  // LOAD PLATFORM DATA + SUPPORT BADGE
  useEffect(() => {
    if (!allowed) return;

    const unsubFees = onSnapshot(collection(db, "platformFees"), (snap) => {
      const list = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));

      list.sort((a, b) => {
        const aT =
          a.createdAt?.toMillis?.() || a.createdAt?.seconds * 1000 || 0;
        const bT =
          b.createdAt?.toMillis?.() || b.createdAt?.seconds * 1000 || 0;
        return bT - aT;
      });

      setFees(list);
    });

    const unsubWd = onSnapshot(
      collection(db, "platformWithdrawals"),
      (snap) => {
        const list = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));

        list.sort((a, b) => {
          const aT =
            a.createdAt?.toMillis?.() || a.createdAt?.seconds * 1000 || 0;
          const bT =
            b.createdAt?.toMillis?.() || b.createdAt?.seconds * 1000 || 0;
          return bT - aT;
        });

        setPlatformWithdrawals(list);
      }
    );

    const unsubSupport = onSnapshot(
      collection(db, "supportMessages"),
      (snap) => {
        let unread = 0;

        snap.forEach((d) => {
          const data = d.data() || {};
          const isRead =
            data.read === true ||
            data.isRead === true ||
            String(data.status || "").toLowerCase() === "read" ||
            String(data.status || "").toLowerCase() === "resolved";

          if (!isRead) unread += 1;
        });

        setUnreadSupportCount(unread);
      }
    );

    return () => {
      unsubFees();
      unsubWd();
      unsubSupport();
    };
  }, [allowed]);

  const totalFees = useMemo(() => {
    return fees.reduce((sum, f) => sum + (Number(f.platformFee) || 0), 0);
  }, [fees]);

  const totalSales = useMemo(() => {
    return fees.reduce((sum, f) => sum + (Number(f.totalAmount) || 0), 0);
  }, [fees]);

  const totalSellerAmount = useMemo(() => {
    return fees.reduce((sum, f) => sum + (Number(f.sellerAmount) || 0), 0);
  }, [fees]);

  const alreadyWithdrawn = useMemo(() => {
    return platformWithdrawals.reduce((sum, w) => {
      const status = String(w.status || "").toLowerCase();

      if (
        status === "successful" ||
        status === "processing" ||
        status === "pending"
      ) {
        return sum + (Number(w.amount) || 0);
      }

      return sum;
    }, 0);
  }, [platformWithdrawals]);

  const availableBalance = Math.max(0, totalFees - alreadyWithdrawn);

  const filteredFees = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return fees;

    return fees.filter((f) => {
      const haystack = [
        f.sellerId,
        f.orderId,
        f.paystackReference,
        f.platformFee,
        f.totalAmount,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [fees, search]);

  const formatNaira = (n) =>
    `₦${Number(n || 0).toLocaleString("en-NG")}`;

  const formatDate = (value) => {
    if (!value) return "—";

    try {
      const ms =
        value?.toMillis?.() ||
        value?.seconds * 1000 ||
        Date.parse(value);

      if (!ms || Number.isNaN(ms)) return "—";

      return new Date(ms).toLocaleString([], {
        dateStyle: "medium",
        timeStyle: "short",
      });
    } catch {
      return "—";
    }
  };

  const handleBankChange = (e) => {
    const code = e.target.value;
    const bank = BANKS.find((b) => b.code === code);

    setBankCode(code);
    setBankName(bank ? bank.name : "");

    if (formError) setFormError("");
  };

  const handleAmountChange = (e) => {
    let value = e.target.value.replace(/[^\d.]/g, "");
    const parts = value.split(".");

    if (parts.length > 2) {
      value = `${parts[0]}.${parts.slice(1).join("")}`;
    }

    setAmount(value);
    if (formError) setFormError("");
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();

    setFormError("");
    setSuccess(false);

    const numericAmount = Number(amount);

    if (!amount || Number.isNaN(numericAmount) || numericAmount <= 0) {
      setFormError("Enter a valid amount.");
      return;
    }

    if (numericAmount < 1000) {
      setFormError("Minimum withdrawal is ₦1,000.");
      return;
    }

    if (numericAmount > availableBalance) {
      setFormError(
        `Amount exceeds your available balance of ${formatNaira(
          availableBalance
        )}.`
      );
      return;
    }

    if (!bankCode || !bankName) {
      setFormError("Select your bank.");
      return;
    }

    if (!accountNumber.trim() || accountNumber.trim().length !== 10) {
      setFormError("Enter a valid 10-digit account number.");
      return;
    }

    if (!accountName.trim()) {
      setFormError("Enter the account name.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(
        "https://campusbackend-1.onrender.com/process-platform-withdrawal",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount: numericAmount,
            bankName,
            bankCode,
            accountNumber: accountNumber.trim(),
            accountName: accountName.trim(),
            adminId: firebaseUser?.uid || null,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Withdrawal failed");
      }

      setSuccessAmount(numericAmount);
      setSuccess(true);

      setAmount("");
      setBankCode("");
      setBankName("");
      setAccountNumber("");
      setAccountName("");
    } catch (error) {
      console.error(error);
      setFormError(error.message || "Could not process withdrawal.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClearAllData = async () => {
    if (!firebaseUser || !allowed) return;

    setClearingData(true);
    setClearError("");
    setClearSuccess(false);

    try {
      const feesSnapshot = await import("firebase/firestore").then(
        ({ getDocs }) => getDocs(collection(db, "platformFees"))
      );

      const withdrawalsSnapshot = await import("firebase/firestore").then(
        ({ getDocs }) => getDocs(collection(db, "platformWithdrawals"))
      );

      const allDocs = [...feesSnapshot.docs, ...withdrawalsSnapshot.docs];

      if (allDocs.length === 0) {
        setClearSuccess(true);
        setShowClearModal(false);
        return;
      }

      const chunkSize = 450;

      for (let i = 0; i < allDocs.length; i += chunkSize) {
        const chunk = allDocs.slice(i, i + chunkSize);
        const batch = writeBatch(db);

        chunk.forEach((document) => {
          batch.delete(document.ref);
        });

        await batch.commit();
      }

      setFees([]);
      setPlatformWithdrawals([]);
      setSearch("");
      setAmount("");
      setBankCode("");
      setBankName("");
      setAccountNumber("");
      setAccountName("");

      setClearSuccess(true);
      setShowClearModal(false);
    } catch (error) {
      console.error("Error clearing platform data:", error);
      setClearError(error.message || "Could not clear platform data.");
    } finally {
      setClearingData(false);
    }
  };

  const menuItems = [
    { label: "Overview", icon: FiGrid, path: "/admin-dashboard" },
    { label: "Users", icon: FiUsers, path: "/admin/users" },
    { label: "Products", icon: FiPackage, path: "/admin/products" },
    { label: "Orders", icon: FiShoppingBag, path: "/admin/orders" },
    { label: "Platform Fees", icon: FiDollarSign, path: "/admin/fees" },
    { label: "Withdrawals", icon: FiCreditCard, path: "/admin/withdrawals" },
    { label: "Payments", icon: FiTrendingUp, path: "/admin/payments" },
    {
      label: "Support Messages",
      icon: FiMessageCircle,
      path: "/admin/support-messages",
      badge: unreadSupportCount,
    },
  ];

  const isActive = (path) => {
    if (path === "/admin-dashboard") {
      return location.pathname === "/admin-dashboard";
    }
    return location.pathname.startsWith(path);
  };

  const handleNavigation = (path) => {
    setSidebarOpen(false);
    navigate(path);
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-50">
        <div className="w-10 h-10 rounded-full border-4 border-green-100 border-t-green-600 animate-spin" />
      </div>
    );
  }

  if (!firebaseUser || !allowed) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-sm text-center bg-white rounded-2xl border p-8">
          <FiShield className="mx-auto text-red-500" size={28} />
          <h1 className="text-xl font-bold mt-3">Access Denied</h1>
          <button
            onClick={() => navigate("/admin-dashboard")}
            className="mt-5 h-11 px-6 rounded-xl bg-[#008236] text-white text-sm font-semibold"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

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
          fixed inset-y-0 left-0 z-50 w-[291px]
          bg-[#008236] text-white flex flex-col h-screen
          transition-transform duration-300
          ${
            sidebarOpen
              ? "translate-x-0"
              : "-translate-x-full lg:translate-x-0"
          }
        `}
      >
        <div className="relative px-5 pt-6 pb-4">
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden absolute top-3 right-3 w-9 h-9 rounded-lg hover:bg-white/10 flex items-center justify-center"
          >
            <FiX size={21} />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#006f2e] flex items-center justify-center border border-white/10">
              <span className="text-white text-[16px] font-black">CM</span>
            </div>

            <div>
              <h1 className="text-[22px] font-extrabold leading-none">
                Campus
                <span className="text-green-300">Mart</span>
              </h1>
              <p className="text-[10px] text-green-100 mt-1">Admin Panel</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 py-3 overflow-y-auto flex flex-col gap-1">
          {menuItems.map(({ label, icon: Icon, path, badge }) => {
            const active = isActive(path);

            return (
              <button
                key={label}
                type="button"
                onClick={() => handleNavigation(path)}
                className={`
                  w-full flex items-center gap-3
                  px-3.5 py-3 rounded-xl text-left
                  transition
                  ${
                    active
                      ? "bg-white text-[#008236] font-semibold"
                      : "text-white hover:bg-white/10"
                  }
                `}
              >
                <Icon size={18} className="flex-shrink-0" />
                <span className="flex-1 text-[14px]">{label}</span>

                {badge > 0 && (
                  <span className="min-w-[20px] h-[20px] px-1.5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                    {badge > 99 ? "99+" : badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="px-4 pb-5">
          <button
            type="button"
            onClick={() => navigate("/logout")}
            className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-white hover:bg-white/10"
          >
            <FiLogOut size={18} />
            <span className="text-[14px]">Logout</span>
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <div className="min-w-0 flex flex-col h-screen lg:ml-[291px]">
        <header className="min-h-[70px] bg-[#007233] text-white flex items-center px-4 sm:px-6 lg:px-8 gap-3 flex-shrink-0">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden w-10 h-10 rounded-lg hover:bg-white/10 flex items-center justify-center"
          >
            <FiMenu size={22} />
          </button>

          <div className="flex-1">
            <p className="text-sm font-semibold">Platform Fees</p>
            <p className="text-[11px] text-green-100">
              CampusMart 5% · Withdraw to bank
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setClearError("");
              setClearSuccess(false);
              setShowClearModal(true);
            }}
            className="h-10 px-3 sm:px-4 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-300/20 text-white text-xs font-semibold flex items-center gap-2 transition"
          >
            <FiTrash2 size={15} />
            <span className="hidden sm:inline">Clear Platform Data</span>
            <span className="sm:hidden">Clear</span>
          </button>
        </header>

        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
          {clearSuccess && (
            <div className="rounded-2xl bg-green-50 border border-green-100 p-4 flex items-start gap-3">
              <FiCheckCircle className="text-[#008236] mt-0.5" size={20} />
              <div>
                <p className="text-sm font-semibold text-gray-800">
                  Platform data cleared
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  All platform fees and withdrawal records have been permanently
                  deleted.
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <p className="text-xs text-gray-500 font-medium">
                Total fees collected
              </p>
              <p className="text-2xl font-bold text-[#008236] mt-2">
                {formatNaira(totalFees)}
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <p className="text-xs text-gray-500 font-medium">
                Available to withdraw
              </p>
              <p className="text-2xl font-bold text-emerald-600 mt-2">
                {formatNaira(availableBalance)}
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <p className="text-xs text-gray-500 font-medium">
                Total sales volume
              </p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {formatNaira(totalSales)}
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <p className="text-xs text-gray-500 font-medium">
                Paid to sellers (95%)
              </p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {formatNaira(totalSellerAmount)}
              </p>
            </div>
          </div>

          {success && (
            <div className="rounded-2xl bg-green-50 border border-green-100 p-4 flex items-start gap-3">
              <FiCheckCircle className="text-[#008236] mt-0.5" size={20} />
              <div>
                <p className="text-sm font-semibold text-gray-800">
                  Withdrawal initiated
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {formatNaira(successAmount)} is being sent to your bank.
                </p>
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-800">
                Withdraw platform fees
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Send available 5% fees to your bank account.
              </p>
            </div>

            <form onSubmit={handleWithdraw} className="p-5 space-y-4">
              {formError && (
                <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600 flex items-center gap-2">
                  <FiAlertCircle size={16} />
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">
                  Amount
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#008236] font-bold text-sm pointer-events-none">
                    ₦
                  </span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={amount}
                    onChange={handleAmountChange}
                    disabled={submitting}
                    placeholder="Enter amount"
                    autoComplete="off"
                    className="w-full h-12 pl-8 pr-3.5 rounded-xl border border-gray-200 bg-gray-50 text-sm font-semibold outline-none focus:border-[#008236] focus:ring-4 focus:ring-green-50 disabled:opacity-60"
                  />
                </div>

                <div className="flex items-center justify-between mt-2">
                  <p className="text-[11px] text-gray-400">Minimum: ₦1,000</p>
                  <button
                    type="button"
                    disabled={submitting || availableBalance < 1000}
                    onClick={() =>
                      setAmount(String(Math.floor(availableBalance)))
                    }
                    className="text-xs font-semibold text-[#008236] hover:underline disabled:opacity-50"
                  >
                    Withdraw max ({formatNaira(availableBalance)})
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">
                  Bank
                </label>
                <select
                  value={bankCode}
                  onChange={handleBankChange}
                  disabled={submitting}
                  className="w-full h-12 px-3.5 rounded-xl border border-gray-200 bg-gray-50 text-sm outline-none focus:border-[#008236] focus:ring-4 focus:ring-green-50 disabled:opacity-60"
                >
                  <option value="">Select bank</option>
                  {BANKS.map((b) => (
                    <option key={b.code} value={b.code}>
                      {b.name}
                    </option>
                  ))}
                </select>
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
                    setAccountNumber(e.target.value.replace(/\D/g, ""));
                    if (formError) setFormError("");
                  }}
                  disabled={submitting}
                  placeholder="10-digit NUBAN"
                  className="w-full h-12 px-3.5 rounded-xl border border-gray-200 bg-gray-50 text-sm outline-none focus:border-[#008236] focus:ring-4 focus:ring-green-50 disabled:opacity-60"
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
                  placeholder="Name on the account"
                  className="w-full h-12 px-3.5 rounded-xl border border-gray-200 bg-gray-50 text-sm outline-none focus:border-[#008236] focus:ring-4 focus:ring-green-50 disabled:opacity-60"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full h-12 rounded-xl bg-[#008236] text-white text-sm font-semibold flex items-center justify-center gap-2 hover:bg-[#006f2e] disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <FiRefreshCw className="animate-spin" size={17} />
                    Processing...
                  </>
                ) : (
                  <>
                    <FiCreditCard size={17} />
                    Withdraw fees
                  </>
                )}
              </button>
            </form>
          </div>

          {platformWithdrawals.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-gray-100">
                <h2 className="text-base font-bold text-gray-800">
                  Withdrawal history
                </h2>
              </div>

              <div className="divide-y divide-gray-100">
                {platformWithdrawals.map((w) => (
                  <div key={w.id} className="p-4 sm:p-5">
                    <p className="text-sm font-bold text-gray-900">
                      {formatNaira(w.amount)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {w.accountName} · {w.bankName} · {w.accountNumber}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {w.status} · {formatDate(w.createdAt)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 shadow-sm">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search fee records..."
                className="w-full h-11 pl-10 pr-4 rounded-xl border border-gray-200 bg-gray-50 text-sm outline-none focus:border-[#008236] focus:bg-white focus:ring-2 focus:ring-green-50"
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {filteredFees.length === 0 ? (
              <div className="p-10 text-center text-sm text-gray-500">
                No platform fees recorded yet.
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredFees.map((fee) => (
                  <div
                    key={fee.id}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-[#008236]">
                        {formatNaira(fee.platformFee)} fee
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Sale: {formatNaira(fee.totalAmount)} · Seller got{" "}
                        {formatNaira(fee.sellerAmount)}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {fee.sellerId
                          ? `Seller: ${String(fee.sellerId).slice(0, 10)}...`
                          : "Seller: —"}
                        {fee.orderId ? ` · Order: ${fee.orderId}` : ""}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {formatDate(fee.createdAt)}
                        {fee.paystackReference
                          ? ` · ${fee.paystackReference}`
                          : ""}
                      </p>
                    </div>

                    <span className="inline-flex px-2.5 py-1 rounded-full text-[10px] font-semibold bg-green-50 text-[#008236] border border-green-100">
                      5% collected
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* CLEAR MODAL */}
      {showClearModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => {
              if (!clearingData) setShowClearModal(false);
            }}
          />

          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-6">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-4">
                <FiAlertTriangle className="text-red-500" size={24} />
              </div>

              <h2 className="text-lg font-bold text-gray-900">
                Clear all platform data?
              </h2>

              <p className="text-sm text-gray-500 mt-2 leading-6">
                This will permanently delete:
              </p>

              <ul className="mt-3 space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                  All platform fee records
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                  All platform withdrawal records
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                  Total fees and sales calculations
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                  Withdrawal history
                </li>
              </ul>

              <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-100">
                <p className="text-xs text-red-600 font-medium">
                  This action cannot be undone.
                </p>
              </div>

              {clearError && (
                <div className="mt-4 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600 flex items-start gap-2">
                  <FiAlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                  <span>{clearError}</span>
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  disabled={clearingData}
                  onClick={() => setShowClearModal(false)}
                  className="flex-1 h-11 rounded-xl border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={clearingData}
                  onClick={handleClearAllData}
                  className="flex-1 h-11 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {clearingData ? (
                    <>
                      <FiRefreshCw className="animate-spin" size={16} />
                      Clearing...
                    </>
                  ) : (
                    <>
                      <FiTrash2 size={16} />
                      Yes, Clear All
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminFees;