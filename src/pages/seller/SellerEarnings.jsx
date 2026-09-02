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
  FiTrendingUp,
  FiClock,
  FiCheckCircle,
  FiCreditCard,
  FiCalendar,
  FiInfo,
  FiPercent,
  FiRefreshCw,
  FiAlertCircle,
} from "react-icons/fi";

import {
  doc,
  onSnapshot,
  collection,
  query,
  where,
  orderBy,
} from "firebase/firestore";

import { db } from "../../context/firebase";
import { useAuth } from "../../context/AuthContext";

function SellerEarnings({ unreadMessages = 0, profile = {} }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { firebaseUser } = useAuth();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  // =====================================================
  // LIVE EARNINGS STATE
  // =====================================================

  const [totalEarnings, setTotalEarnings] = useState(0);
  const [availableBalance, setAvailableBalance] = useState(0);
  const [totalPlatformFees, setTotalPlatformFees] = useState(0);
  const [recentEarnings, setRecentEarnings] = useState([]);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [loadingLedger, setLoadingLedger] = useState(true);
  const [ledgerError, setLedgerError] = useState("");

  // =====================================================
  // LIVE WITHDRAWAL STATE
  // =====================================================

  const [withdrawals, setWithdrawals] = useState([]);
  const [loadingWithdrawals, setLoadingWithdrawals] = useState(true);
  const [withdrawalError, setWithdrawalError] = useState("");

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
  // LIVE BALANCE (users/{uid})
  // =====================================================

  useEffect(() => {
    if (!firebaseUser?.uid) {
      setTotalEarnings(0);
      setAvailableBalance(0);
      setTotalPlatformFees(0);
      setLoadingBalance(false);
      return;
    }

    setLoadingBalance(true);

    const userRef = doc(db, "users", firebaseUser.uid);

    const unsub = onSnapshot(
      userRef,
      (snap) => {
        const data = snap.data() || {};

        setTotalEarnings(Number(data.totalEarnings) || 0);
        setAvailableBalance(Number(data.availableBalance) || 0);
        setTotalPlatformFees(Number(data.totalPlatformFees) || 0);

        setLoadingBalance(false);
      },
      (error) => {
        console.error("Seller balance listener error:", error);
        setLoadingBalance(false);
      }
    );

    return () => unsub();
  }, [firebaseUser?.uid]);

  // =====================================================
  // LIVE EARNINGS LEDGER
  // =====================================================

  useEffect(() => {
    if (!firebaseUser?.uid) {
      setRecentEarnings([]);
      setLoadingLedger(false);
      return;
    }

    setLoadingLedger(true);
    setLedgerError("");

    const ledgerQuery = query(
      collection(db, "earnings"),
      where("sellerId", "==", firebaseUser.uid),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(
      ledgerQuery,
      (snapshot) => {
        const rows = snapshot.docs.map((d) => {
          const x = d.data();

          let date = "—";
          let time = "";

          try {
            const dt = x.createdAt?.toDate?.()
              ? x.createdAt.toDate()
              : x.createdAt
                ? new Date(x.createdAt)
                : null;

            if (dt && !Number.isNaN(dt.getTime())) {
              date = dt.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              });

              time = dt.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
              });
            }
          } catch {
            // Keep defaults
          }

          return {
            id: d.id,
            type: x.type || "sale",
            title:
              x.title ||
              `Order #${String(d.id).slice(0, 6).toUpperCase()}`,
            description: x.description || "Sale",
            amount: Number(x.amount) || 0,
            gross: Number(x.gross) || 0,
            platformFee: Number(x.platformFee) || 0,
            status: x.status || "Completed",
            date,
            time,
          };
        });

        setRecentEarnings(rows);
        setLoadingLedger(false);
        setLedgerError("");
      },
      (error) => {
        console.error("Earnings ledger error:", error);

        if (
          String(error?.message || "").includes("index") ||
          String(error?.code || "").includes("failed-precondition")
        ) {
          const simpleQuery = query(
            collection(db, "earnings"),
            where("sellerId", "==", firebaseUser.uid)
          );

          const fallbackUnsub = onSnapshot(
            simpleQuery,
            (snapshot) => {
              const rows = snapshot.docs
                .map((d) => {
                  const x = d.data();

                  const seconds =
                    x.createdAt?.seconds || 0;

                  return {
                    id: d.id,
                    type: x.type || "sale",
                    title:
                      x.title ||
                      `Order #${String(d.id)
                        .slice(0, 6)
                        .toUpperCase()}`,
                    description:
                      x.description || "Sale",
                    amount: Number(x.amount) || 0,
                    gross: Number(x.gross) || 0,
                    platformFee:
                      Number(x.platformFee) || 0,
                    status:
                      x.status || "Completed",
                    date: "—",
                    time: "",
                    _sort: seconds,
                  };
                })
                .sort(
                  (a, b) =>
                    b._sort - a._sort
                );

              setRecentEarnings(rows);
              setLoadingLedger(false);
              setLedgerError("");
            },
            (err2) => {
              console.error(
                "Earnings fallback error:",
                err2
              );

              setLedgerError(
                "Unable to load earnings history."
              );

              setLoadingLedger(false);
            }
          );

          return fallbackUnsub;
        }

        setLedgerError(
          "Unable to load earnings history."
        );

        setLoadingLedger(false);
      }
    );

    return () => {
      if (typeof unsub === "function") {
        unsub();
      }
    };
  }, [firebaseUser?.uid]);

  // =====================================================
  // LIVE SELLER WITHDRAWALS
  // =====================================================
  //
  // IMPORTANT:
  // Admin withdrawal documents must be in:
  //
  // withdrawals/{withdrawalId}
  //
  // And contain:
  //
  // sellerId
  // amount
  // status
  // bankName
  // accountNumber
  // accountName
  // createdAt
  //
  // The admin can update:
  //
  // pending
  // processing
  // successful
  // failed
  //
  // This listener updates the seller page automatically.
  // =====================================================

  useEffect(() => {
    if (!firebaseUser?.uid) {
      setWithdrawals([]);
      setLoadingWithdrawals(false);
      return;
    }

    setLoadingWithdrawals(true);
    setWithdrawalError("");

    const withdrawalQuery = query(
      collection(db, "withdrawals"),
      where("sellerId", "==", firebaseUser.uid),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(
      withdrawalQuery,
      (snapshot) => {
        const rows = snapshot.docs.map((d) => {
          const x = d.data();

          let date = "—";
          let time = "";

          try {
            const dt = x.createdAt?.toDate?.()
              ? x.createdAt.toDate()
              : x.createdAt
                ? new Date(x.createdAt)
                : null;

            if (dt && !Number.isNaN(dt.getTime())) {
              date = dt.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              });

              time = dt.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
              });
            }
          } catch {
            // Keep defaults
          }

          return {
            id: d.id,

            amount: Number(x.amount) || 0,

            status: String(
              x.status || "pending"
            ).toLowerCase(),

            bankName:
              x.bankName ||
              x.bank ||
              "Bank",

            accountNumber:
              x.accountNumber ||
              x.accountNo ||
              "",

            accountName:
              x.accountName ||
              "",

            reference:
              x.reference ||
              x.paystackReference ||
              x.transactionReference ||
              "",

            date,
            time,

            createdAt: x.createdAt,
          };
        });

        setWithdrawals(rows);
        setLoadingWithdrawals(false);
        setWithdrawalError("");
      },
      (error) => {
        console.error(
          "Seller withdrawal listener error:",
          error
        );

        // Fallback if Firestore composite index
        // has not been created yet.
        if (
          String(error?.message || "").includes("index") ||
          String(error?.code || "").includes(
            "failed-precondition"
          )
        ) {
          const simpleWithdrawalQuery = query(
            collection(db, "withdrawals"),
            where(
              "sellerId",
              "==",
              firebaseUser.uid
            )
          );

          const fallbackUnsub = onSnapshot(
            simpleWithdrawalQuery,
            (snapshot) => {
              const rows = snapshot.docs
                .map((d) => {
                  const x = d.data();

                  const seconds =
                    x.createdAt?.seconds || 0;

                  return {
                    id: d.id,

                    amount:
                      Number(x.amount) || 0,

                    status: String(
                      x.status || "pending"
                    ).toLowerCase(),

                    bankName:
                      x.bankName ||
                      x.bank ||
                      "Bank",

                    accountNumber:
                      x.accountNumber ||
                      x.accountNo ||
                      "",

                    accountName:
                      x.accountName ||
                      "",

                    reference:
                      x.reference ||
                      x.paystackReference ||
                      x.transactionReference ||
                      "",

                    date: "—",
                    time: "",

                    createdAt:
                      x.createdAt,

                    _sort: seconds,
                  };
                })
                .sort(
                  (a, b) =>
                    b._sort - a._sort
                );

              setWithdrawals(rows);
              setLoadingWithdrawals(false);
              setWithdrawalError("");
            },
            (fallbackError) => {
              console.error(
                "Withdrawal fallback error:",
                fallbackError
              );

              setWithdrawalError(
                "Unable to load withdrawal history."
              );

              setLoadingWithdrawals(false);
            }
          );

          return fallbackUnsub;
        }

        setWithdrawalError(
          "Unable to load withdrawal history."
        );

        setLoadingWithdrawals(false);
      }
    );

    return () => {
      if (typeof unsub === "function") {
        unsub();
      }
    };
  }, [firebaseUser?.uid]);

  // =====================================================
  // MENU
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

  // =====================================================
  // FORMATTERS
  // =====================================================

  const formatNaira = (amount) =>
    `₦${Number(amount || 0).toLocaleString("en-NG")}`;

  const PLATFORM_COMMISSION_RATE = 0.05;

  const isLoading =
    loadingBalance || loadingLedger;

  // =====================================================
  // WITHDRAWAL STATUS HELPERS
  // =====================================================

  const normalizeWithdrawalStatus = (status) => {
    const value = String(
      status || "pending"
    )
      .trim()
      .toLowerCase();

    if (
      value === "successful" ||
      value === "success" ||
      value === "completed" ||
      value === "complete"
    ) {
      return "successful";
    }

    if (
      value === "processing" ||
      value === "processed"
    ) {
      return "processing";
    }

    if (
      value === "failed" ||
      value === "failure" ||
      value === "cancelled" ||
      value === "canceled"
    ) {
      return "failed";
    }

    return "pending";
  };

  const getWithdrawalStatusLabel = (status) => {
    const normalized =
      normalizeWithdrawalStatus(status);

    if (normalized === "successful") {
      return "Successful";
    }

    if (normalized === "processing") {
      return "Processing";
    }

    if (normalized === "failed") {
      return "Failed";
    }

    return "Pending";
  };

  const getWithdrawalStatusClass = (status) => {
    const normalized =
      normalizeWithdrawalStatus(status);

    if (normalized === "successful") {
      return "bg-green-50 text-green-700 border-green-100";
    }

    if (normalized === "processing") {
      return "bg-blue-50 text-blue-700 border-blue-100";
    }

    if (normalized === "failed") {
      return "bg-red-50 text-red-700 border-red-100";
    }

    return "bg-yellow-50 text-yellow-700 border-yellow-100";
  };

  const getWithdrawalStatusIcon = (status) => {
    const normalized =
      normalizeWithdrawalStatus(status);

    if (normalized === "successful") {
      return <FiCheckCircle size={12} />;
    }

    if (normalized === "processing") {
      return (
        <FiRefreshCw
          size={12}
          className="animate-spin"
        />
      );
    }

    if (normalized === "failed") {
      return <FiAlertCircle size={12} />;
    }

    return <FiClock size={12} />;
  };

  return (
    <div className="h-screen w-full bg-gray-50 text-gray-800 font-sans overflow-hidden">

      {/* MOBILE OVERLAY */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <aside
        className={`
          fixed inset-y-0 left-0 z-50
          w-[291px] min-w-[285px] lg:w-[291px] lg:min-w-[250px]
          bg-green-700 text-white flex flex-col h-screen overflow-hidden
          shadow-2xl lg:shadow-none transition-transform duration-300 ease-in-out
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
              lg:hidden absolute top-3 right-3 w-9 h-9 rounded-lg
              text-white hover:bg-white/10 active:bg-white/20
              flex items-center justify-center transition z-20
            "
          >
            <FiX
              size={21}
              strokeWidth={2.5}
            />
          </button>

          <div className="flex items-center gap-3 pr-10">

            <div className="w-10 h-10 min-w-[40px] rounded-xl bg-[#008236] flex items-center justify-center shadow-lg shadow-black/30 border border-white/10 flex-shrink-0">
              <span className="text-white text-[16px] font-black tracking-tight">
                CM
              </span>
            </div>

            <div className="min-w-0">

              <h1 className="text-[30px] font-extrabold tracking-tight leading-none whitespace-nowrap">
                <span className="text-white">
                  Campus
                </span>

                <span className="text-green-300">
                  Mart
                </span>
              </h1>

              <p className="text-[10px] text-green-100 mt-1 whitespace-nowrap">
                Sell. Connect. Grow.
              </p>

            </div>

          </div>
        </div>

        <nav className="flex-1 px-4 py-3 overflow-y-auto overflow-x-hidden overscroll-contain flex flex-col justify-start gap-1">

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
                    strokeWidth={
                      active ? 2.5 : 2
                    }
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
            }
          )}

        </nav>

        <div className="px-4 pb-4 flex-shrink-0">

          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-white hover:bg-white/10 active:bg-white/20 transition text-left"
          >
            <FiLogOut size={19} />

            <span className="text-[14px]">
              Logout
            </span>
          </button>

        </div>

        <div className="px-4 pb-3 flex-shrink-0">

          <div className="border border-green-300/30 bg-green-900/20 rounded-xl p-3.5 text-center">

            <div className="text-2xl mb-1">
              👑
            </div>

            <h3 className="font-bold text-sm">
              Go Premium
            </h3>

            <p className="text-[10px] text-green-100 leading-4 mt-1">
              Boost your products and services and reach more students.
            </p>

            <button
              type="button"
              onClick={() =>
                handleNavigation(
                  "/seller/promotions"
                )
              }
              className="w-full mt-2 h-9 rounded-lg bg-white text-[#008236] font-bold text-xs hover:bg-green-50 active:bg-green-100 transition"
            >
              Upgrade Now
            </button>

          </div>

        </div>

      </aside>

      {/* =====================================================
          MAIN
      ===================================================== */}

      <div className="min-w-0 flex flex-col h-screen w-full lg:ml-[291px] lg:w-[calc(100%-291px)]">

        {/* HEADER */}

        <header className="min-h-[70px] bg-[#007233] text-white flex items-center px-3 sm:px-5 lg:px-8 py-3 gap-2 sm:gap-4 flex-shrink-0">

          <button
            type="button"
            onClick={() =>
              setSidebarOpen(true)
            }
            aria-label="Open sidebar"
            className="lg:hidden w-10 h-10 min-w-[40px] rounded-lg hover:bg-white/10 active:bg-white/20 flex items-center justify-center flex-shrink-0"
          >
            <FiMenu size={24} />
          </button>

          <div className="flex items-center gap-2 text-white flex-shrink-0">

            <FiShoppingBag
              size={19}
              className="text-green-200"
            />

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
              onClick={() =>
                handleNavigation(
                  "/seller/messages"
                )
              }
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
              onClick={() =>
                handleNavigation(
                  "/seller/profile"
                )
              }
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
                  {sellerFirstName
                    ?.charAt(0)
                    ?.toUpperCase()}
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

              <FiChevronDown
                size={16}
                className="hidden sm:block"
              />

            </button>

          </div>

        </header>

        {/* =====================================================
            CONTENT
        ===================================================== */}

        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-gray-50 px-3 sm:px-5 md:px-6 lg:px-8 py-5 sm:py-6 lg:py-8 font-sans">

          {/* =====================================================
              BANNER
          ===================================================== */}

          <section className="mb-6 sm:mb-7">

            <div className="bg-gradient-to-r from-[#007233] to-[#008f3f] rounded-2xl p-5 sm:p-6 lg:p-7 text-white shadow-sm relative overflow-hidden">

              <div className="absolute -right-10 -top-16 w-48 h-48 rounded-full bg-white/10" />

              <div className="absolute right-16 -bottom-24 w-40 h-40 rounded-full bg-white/5" />

              <div className="relative z-20">

                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-[11px] font-medium mb-3">

                  <span className="w-1.5 h-1.5 rounded-full bg-green-300" />

                  Earnings

                </div>

                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                  Your Earnings,{" "}
                  {sellerFirstName}
                </h1>

                <p className="text-sm sm:text-base text-green-50 mt-1.5 max-w-xl leading-6">
                  Live totals from your sales. CampusMart keeps 5%; you receive
                  95% net.
                </p>

              </div>

            </div>

          </section>

          {/* =====================================================
              STATS
          ===================================================== */}

          <section className="grid grid-cols-2 gap-3 sm:gap-4 mb-5 sm:mb-6">

            {/* TOTAL EARNINGS */}

            <div className="group relative overflow-hidden bg-white rounded-2xl border border-gray-100 p-3.5 sm:p-6 shadow-[0_2px_10px_rgba(15,23,42,0.04)] hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(15,23,42,0.08)] transition-all duration-200">

              <div className="absolute right-0 top-0 w-28 h-28 rounded-full bg-green-50 -translate-y-1/2 translate-x-1/2 opacity-80" />

              <div className="relative flex items-start justify-between gap-2 sm:gap-3">

                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-green-50 text-[#008236] flex items-center justify-center flex-shrink-0 ring-4 ring-white">

                  <FiTrendingUp
                    size={20}
                    strokeWidth={2.2}
                    className="sm:hidden"
                  />

                  <FiTrendingUp
                    size={22}
                    strokeWidth={2.2}
                    className="hidden sm:block"
                  />

                </div>

                <span className="inline-flex items-center rounded-full bg-green-50 px-2 sm:px-2.5 py-0.5 sm:py-1 text-[9px] sm:text-[10px] font-bold text-[#008236]">
                  All time
                </span>

              </div>

              <div className="relative mt-4 sm:mt-5">

                <p className="text-[11px] sm:text-sm font-medium text-gray-500">
                  Total Earnings
                </p>

                <h2 className="text-lg sm:text-3xl font-bold text-gray-900 tracking-tight mt-1 sm:mt-1.5 truncate">
                  {loadingBalance
                    ? "…"
                    : formatNaira(
                        totalEarnings
                      )}
                </h2>

                <p className="text-[10px] sm:text-[11px] text-gray-400 mt-1.5 sm:mt-2">

                  Net after platform fees

                  {totalPlatformFees > 0 && (
                    <span className="block mt-0.5">
                      Fees paid:{" "}
                      {formatNaira(
                        totalPlatformFees
                      )}
                    </span>
                  )}

                </p>

              </div>

            </div>

            {/* AVAILABLE BALANCE */}

            <div className="group relative overflow-hidden bg-white rounded-2xl border border-gray-100 p-3.5 sm:p-6 shadow-[0_2px_10px_rgba(15,23,42,0.04)] hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(15,23,42,0.08)] transition-all duration-200">

              <div className="absolute right-0 top-0 w-28 h-28 rounded-full bg-green-50 -translate-y-1/2 translate-x-1/2 opacity-80" />

              <div className="relative flex items-start justify-between gap-2 sm:gap-3">

                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-green-50 text-[#008236] flex items-center justify-center flex-shrink-0 ring-4 ring-white">

                  <FiCreditCard
                    size={20}
                    strokeWidth={2.2}
                    className="sm:hidden"
                  />

                  <FiCreditCard
                    size={22}
                    strokeWidth={2.2}
                    className="hidden sm:block"
                  />

                </div>

                <span className="inline-flex items-center rounded-full bg-green-50 px-2 sm:px-2.5 py-0.5 sm:py-1 text-[9px] sm:text-[10px] font-bold text-[#008236]">
                  Ready
                </span>

              </div>

              <div className="relative mt-4 sm:mt-5">

                <p className="text-[11px] sm:text-sm font-medium text-gray-500">
                  Available Balance
                </p>

                <h2 className="text-lg sm:text-3xl font-bold text-gray-900 tracking-tight mt-1 sm:mt-1.5 truncate">
                  {loadingBalance
                    ? "…"
                    : formatNaira(
                        availableBalance
                      )}
                </h2>

                <p className="text-[10px] sm:text-[11px] text-gray-400 mt-1.5 sm:mt-2">
                  Ready to withdraw
                </p>

                <button
                  type="button"
                  onClick={() =>
                    handleNavigation(
                      "/seller/withdraw"
                    )
                  }
                  className="mt-3 sm:mt-4 w-full h-9 sm:h-10 rounded-xl bg-[#008236] text-white text-[11px] sm:text-sm font-semibold flex items-center justify-center gap-1.5 hover:bg-[#006f2e] active:bg-[#005f28] transition shadow-sm"
                >

                  <FiCreditCard
                    size={14}
                    className="sm:hidden"
                  />

                  <FiCreditCard
                    size={16}
                    className="hidden sm:block"
                  />

                  Withdraw

                </button>

              </div>

            </div>

          </section>

          {/* =====================================================
              WITHDRAWAL STATUS
          ===================================================== */}

          <section className="mb-5 sm:mb-6">

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

              <div className="p-5 sm:p-6 border-b border-gray-100 flex items-center justify-between gap-3">

                <div>

                  <h2 className="text-base sm:text-lg font-bold text-gray-800">
                    Withdrawal History
                  </h2>

                  <p className="text-xs sm:text-sm text-gray-500 mt-1">
                    Track the status of your withdrawal requests.
                  </p>

                </div>

                <div className="hidden sm:inline-flex items-center gap-2 rounded-xl bg-green-50 border border-green-100 px-3 h-9">

                  <span className="h-2 w-2 rounded-full bg-[#008236]" />

                  <span className="text-xs font-semibold text-[#008236]">
                    {loadingWithdrawals
                      ? "…"
                      : `${withdrawals.length} withdrawals`}
                  </span>

                </div>

              </div>

              {withdrawalError && (
                <div className="mx-5 mt-4 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600 flex items-start gap-2">

                  <FiAlertCircle
                    size={16}
                    className="mt-0.5 flex-shrink-0"
                  />

                  <span>
                    {withdrawalError}
                  </span>

                </div>
              )}

              {loadingWithdrawals ? (
                <div className="p-10 flex flex-col items-center justify-center text-gray-400">

                  <FiRefreshCw
                    size={22}
                    className="animate-spin text-[#008236]"
                  />

                  <p className="text-sm mt-3">
                    Loading withdrawal history…
                  </p>

                </div>
              ) : withdrawals.length === 0 ? (
                <div className="p-10 text-center">

                  <div className="w-14 h-14 mx-auto rounded-full bg-green-50 text-[#008236] flex items-center justify-center mb-3">
                    <FiCreditCard size={22} />
                  </div>

                  <p className="text-sm font-medium text-gray-500">
                    No withdrawals yet.
                  </p>

                  <p className="text-xs text-gray-400 mt-1">
                    Your withdrawal requests will appear here.
                  </p>

                </div>
              ) : (

                <>

                  {/* DESKTOP */}

                  <div className="hidden md:block overflow-x-auto">

                    <table className="w-full min-w-[760px]">

                      <thead>

                        <tr className="border-b border-gray-100 text-left">

                          {[
                            "Withdrawal",
                            "Bank",
                            "Date",
                            "Amount",
                            "Status",
                          ].map(
                            (heading) => (
                              <th
                                key={heading}
                                className="px-5 py-3 text-[11px] font-semibold text-gray-400 uppercase"
                              >
                                {heading}
                              </th>
                            )
                          )}

                        </tr>

                      </thead>

                      <tbody>

                        {withdrawals.map(
                          (withdrawal) => {

                            const status =
                              normalizeWithdrawalStatus(
                                withdrawal.status
                              );

                            return (
                              <tr
                                key={
                                  withdrawal.id
                                }
                                className="border-b border-gray-50 last:border-b-0 hover:bg-gray-50 transition"
                              >

                                {/* WITHDRAWAL */}

                                <td className="px-5 py-4">

                                  <div className="flex items-center gap-3">

                                    <div className="w-9 h-9 rounded-xl bg-green-50 text-[#008236] flex items-center justify-center flex-shrink-0">
                                      <FiCreditCard
                                        size={16}
                                      />
                                    </div>

                                    <div className="min-w-0">

                                      <p className="text-sm font-semibold text-gray-800">
                                        Withdrawal
                                      </p>

                                      <p className="text-[10px] text-gray-400 mt-0.5">
                                        {withdrawal.id}
                                      </p>

                                      {withdrawal.reference && (
                                        <p className="text-[10px] text-gray-400 mt-0.5">
                                          Ref:{" "}
                                          {
                                            withdrawal.reference
                                          }
                                        </p>
                                      )}

                                    </div>

                                  </div>

                                </td>

                                {/* BANK */}

                                <td className="px-5 py-4">

                                  <p className="text-sm text-gray-700">
                                    {
                                      withdrawal.bankName
                                    }
                                  </p>

                                  <p className="text-xs text-gray-400 mt-0.5">
                                    {
                                      withdrawal.accountName
                                    }
                                  </p>

                                  <p className="text-xs text-gray-400">
                                    {withdrawal.accountNumber
                                      ? `•••• ${String(
                                          withdrawal.accountNumber
                                        ).slice(
                                          -4
                                        )}`
                                      : "—"}
                                  </p>

                                </td>

                                {/* DATE */}

                                <td className="px-5 py-4">

                                  <div className="flex items-center gap-1.5 whitespace-nowrap">

                                    <FiCalendar
                                      size={13}
                                      className="text-gray-400"
                                    />

                                    <span className="text-xs text-gray-500">
                                      {
                                        withdrawal.date
                                      }
                                    </span>

                                  </div>

                                  {withdrawal.time && (
                                    <p className="text-[10px] text-gray-400 mt-0.5">
                                      {
                                        withdrawal.time
                                      }
                                    </p>
                                  )}

                                </td>

                                {/* AMOUNT */}

                                <td className="px-5 py-4">

                                  <p className="text-sm font-bold text-gray-900 whitespace-nowrap">
                                    {formatNaira(
                                      withdrawal.amount
                                    )}
                                  </p>

                                </td>

                                {/* STATUS */}

                                <td className="px-5 py-4">

                                  <span
                                    className={`
                                      inline-flex items-center gap-1.5
                                      px-2.5 py-1 rounded-full
                                      text-[10px] font-semibold border
                                      ${getWithdrawalStatusClass(
                                        status
                                      )}
                                    `}
                                  >

                                    {getWithdrawalStatusIcon(
                                      status
                                    )}

                                    {getWithdrawalStatusLabel(
                                      status
                                    )}

                                  </span>

                                </td>

                              </tr>
                            );
                          }
                        )}

                      </tbody>

                    </table>

                  </div>

                  {/* MOBILE */}

                  <div className="md:hidden divide-y divide-gray-100">

                    {withdrawals.map(
                      (withdrawal) => {

                        const status =
                          normalizeWithdrawalStatus(
                            withdrawal.status
                          );

                        return (
                          <div
                            key={
                              withdrawal.id
                            }
                            className="p-4"
                          >

                            <div className="flex items-start gap-3">

                              <div className="w-10 h-10 rounded-xl bg-green-50 text-[#008236] flex items-center justify-center flex-shrink-0">
                                <FiCreditCard
                                  size={17}
                                />
                              </div>

                              <div className="flex-1 min-w-0">

                                <div className="flex items-start justify-between gap-2">

                                  <div className="min-w-0">

                                    <p className="text-sm font-semibold text-gray-800">
                                      Withdrawal
                                    </p>

                                    <p className="text-xs text-gray-500 mt-0.5">
                                      {
                                        withdrawal.bankName
                                      }
                                    </p>

                                    <p className="text-[10px] text-gray-400 mt-0.5">
                                      {withdrawal.accountNumber
                                        ? `•••• ${String(
                                            withdrawal.accountNumber
                                          ).slice(
                                            -4
                                          )}`
                                        : "Bank account"}
                                    </p>

                                  </div>

                                  <p className="text-sm font-bold text-gray-900 flex-shrink-0">
                                    {formatNaira(
                                      withdrawal.amount
                                    )}
                                  </p>

                                </div>

                                <div className="flex items-center justify-between gap-2 mt-3">

                                  <span className="text-[10px] text-gray-400">

                                    {withdrawal.date}

                                    {withdrawal.time
                                      ? ` · ${withdrawal.time}`
                                      : ""}

                                  </span>

                                  <span
                                    className={`
                                      inline-flex items-center gap-1
                                      px-2 py-0.5 rounded-full
                                      text-[9px] font-semibold border
                                      ${getWithdrawalStatusClass(
                                        status
                                      )}
                                    `}
                                  >

                                    {getWithdrawalStatusIcon(
                                      status
                                    )}

                                    {getWithdrawalStatusLabel(
                                      status
                                    )}

                                  </span>

                                </div>

                                {withdrawal.reference && (
                                  <p className="text-[10px] text-gray-400 mt-2 truncate">
                                    Reference:{" "}
                                    {
                                      withdrawal.reference
                                    }
                                  </p>
                                )}

                              </div>

                            </div>

                          </div>
                        );
                      }
                    )}

                  </div>

                </>

              )}

            </div>

          </section>

          {/* =====================================================
              PLATFORM COMMISSION NOTICE
          ===================================================== */}

          <section className="mb-5 sm:mb-6">

            <div className="rounded-2xl border border-green-100 bg-white shadow-sm overflow-hidden">

              <div className="flex flex-col sm:flex-row sm:items-stretch">

                <div className="sm:w-1.5 bg-[#008236] flex-shrink-0" />

                <div className="flex-1 p-4 sm:p-5 flex gap-3 sm:gap-4">

                  <div className="w-11 h-11 rounded-xl bg-green-50 text-[#008236] flex items-center justify-center flex-shrink-0 border border-green-100">
                    <FiPercent size={20} />
                  </div>

                  <div className="min-w-0">

                    <div className="flex flex-wrap items-center gap-2">

                      <h3 className="text-sm sm:text-base font-bold text-gray-900">
                        Platform commission
                      </h3>

                      <span className="inline-flex items-center rounded-full bg-[#008236] px-2.5 py-0.5 text-[10px] font-bold text-white">
                        5% per sale
                      </span>

                    </div>

                    <p className="text-xs sm:text-sm text-gray-600 leading-5 sm:leading-6 mt-2">

                      CampusMart charges a transparent{" "}

                      <span className="font-semibold text-gray-800">
                        {PLATFORM_COMMISSION_RATE *
                          100}
                        % service fee
                      </span>{" "}

                      on every completed sale. Totals on this page are{" "}

                      <span className="font-semibold text-gray-800">
                        net amounts after the platform fee
                      </span>
                      .

                      Buyers pay the listed price; the fee is taken from your
                      proceeds when the order is paid.

                    </p>

                    <div className="mt-3 flex items-start gap-2 text-[11px] sm:text-xs text-gray-500">

                      <FiInfo
                        size={14}
                        className="mt-0.5 text-[#008236] flex-shrink-0"
                      />

                      <span>
                        Example: on a ₦10,000 sale, CampusMart retains ₦500 and
                        you earn ₦9,500.
                      </span>

                    </div>

                  </div>

                </div>

              </div>

            </div>

          </section>

          {/* =====================================================
              RECENT EARNINGS
          ===================================================== */}

          <section className="mb-5 sm:mb-6">

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

              <div className="p-5 sm:p-6 border-b border-gray-100 flex items-center justify-between gap-3">

                <div>

                  <h2 className="text-base sm:text-lg font-bold text-gray-800">
                    Recent Earnings
                  </h2>

                  <p className="text-xs sm:text-sm text-gray-500 mt-1">
                    Latest income from your sales (after commission).
                  </p>

                </div>

                <div className="hidden sm:inline-flex items-center gap-2 rounded-xl bg-green-50 border border-green-100 px-3 h-9">

                  <span className="h-2 w-2 rounded-full bg-[#008236]" />

                  <span className="text-xs font-semibold text-[#008236]">
                    {loadingLedger
                      ? "…"
                      : `${recentEarnings.length} records`}
                  </span>

                </div>

              </div>

              {ledgerError && (
                <div className="mx-5 mt-4 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
                  {ledgerError}
                </div>
              )}

              {isLoading &&
              recentEarnings.length === 0 ? (
                <div className="p-12 flex flex-col items-center justify-center text-gray-400">

                  <FiRefreshCw
                    size={22}
                    className="animate-spin text-[#008236]"
                  />

                  <p className="text-sm mt-3">
                    Loading your earnings…
                  </p>

                </div>
              ) : (
                <>

                  {/* DESKTOP TABLE */}

                  <div className="hidden md:block overflow-x-auto">

                    <table className="w-full min-w-[640px]">

                      <thead>

                        <tr className="border-b border-gray-100 text-left">

                          {[
                            "Order",
                            "Product",
                            "Date",
                            "Amount",
                            "Status",
                          ].map(
                            (heading) => (
                              <th
                                key={heading}
                                className="px-5 py-3 text-[11px] font-semibold text-gray-400 uppercase"
                              >
                                {heading}
                              </th>
                            )
                          )}

                        </tr>

                      </thead>

                      <tbody>

                        {recentEarnings.map(
                          (item) => {

                            const saleStatus =
                              String(
                                item.status
                              ).toLowerCase();

                            const isCompleted =
                              saleStatus ===
                                "completed" ||
                              saleStatus ===
                                "successful";

                            return (
                              <tr
                                key={item.id}
                                className="border-b border-gray-50 last:border-b-0 hover:bg-gray-50 transition"
                              >

                                <td className="px-5 py-4">

                                  <div className="flex items-center gap-3">

                                    <div className="w-9 h-9 rounded-xl bg-green-50 text-[#008236] flex items-center justify-center flex-shrink-0">
                                      <FiDollarSign
                                        size={16}
                                      />
                                    </div>

                                    <div className="min-w-0">

                                      <p className="text-sm font-semibold text-gray-800">
                                        {
                                          item.title
                                        }
                                      </p>

                                      <p className="text-[10px] text-gray-400 mt-0.5">
                                        {
                                          item.id
                                        }
                                      </p>

                                    </div>

                                  </div>

                                </td>

                                <td className="px-5 py-4">

                                  <p className="text-sm text-gray-600 max-w-[200px] truncate">
                                    {
                                      item.description
                                    }
                                  </p>

                                </td>

                                <td className="px-5 py-4">

                                  <div className="flex items-center gap-1.5 whitespace-nowrap">

                                    <FiCalendar
                                      size={13}
                                      className="text-gray-400"
                                    />

                                    <span className="text-xs text-gray-500">
                                      {
                                        item.date
                                      }
                                    </span>

                                  </div>

                                  {item.time && (
                                    <p className="text-[10px] text-gray-400 mt-0.5">
                                      {
                                        item.time
                                      }
                                    </p>
                                  )}

                                </td>

                                <td className="px-5 py-4">

                                  <p className="text-sm font-bold text-[#008236] whitespace-nowrap">
                                    +
                                    {formatNaira(
                                      item.amount
                                    )}
                                  </p>

                                </td>

                                <td className="px-5 py-4">

                                  <span
                                    className={`
                                      inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold
                                      ${
                                        isCompleted
                                          ? "bg-green-50 text-green-700"
                                          : "bg-yellow-50 text-yellow-700"
                                      }
                                    `}
                                  >

                                    {isCompleted ? (
                                      <FiCheckCircle
                                        size={11}
                                      />
                                    ) : (
                                      <FiClock
                                        size={11}
                                      />
                                    )}

                                    {item.status}

                                  </span>

                                </td>

                              </tr>
                            );
                          }
                        )}

                      </tbody>

                    </table>

                  </div>

                  {/* MOBILE */}

                  <div className="md:hidden divide-y divide-gray-100">

                    {recentEarnings.map(
                      (item) => {

                        const saleStatus =
                          String(
                            item.status
                          ).toLowerCase();

                        const isCompleted =
                          saleStatus ===
                            "completed" ||
                          saleStatus ===
                            "successful";

                        return (
                          <div
                            key={item.id}
                            className="p-4"
                          >

                            <div className="flex items-start gap-3">

                              <div className="w-10 h-10 rounded-xl bg-green-50 text-[#008236] flex items-center justify-center flex-shrink-0">
                                <FiDollarSign
                                  size={17}
                                />
                              </div>

                              <div className="flex-1 min-w-0">

                                <div className="flex items-start justify-between gap-2">

                                  <div className="min-w-0">

                                    <p className="text-sm font-semibold text-gray-800 truncate">
                                      {
                                        item.title
                                      }
                                    </p>

                                    <p className="text-xs text-gray-500 mt-0.5 truncate">
                                      {
                                        item.description
                                      }
                                    </p>

                                  </div>

                                  <p className="text-sm font-bold text-[#008236] flex-shrink-0">
                                    +
                                    {formatNaira(
                                      item.amount
                                    )}
                                  </p>

                                </div>

                                <div className="flex items-center justify-between mt-2">

                                  <span className="text-[10px] text-gray-400">

                                    {item.date}

                                    {item.time
                                      ? ` · ${item.time}`
                                      : ""}

                                  </span>

                                  <span
                                    className={`
                                      inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-semibold
                                      ${
                                        isCompleted
                                          ? "bg-green-50 text-green-700"
                                          : "bg-yellow-50 text-yellow-700"
                                      }
                                    `}
                                  >
                                    {item.status}
                                  </span>

                                </div>

                              </div>

                            </div>

                          </div>
                        );
                      }
                    )}

                  </div>

                  {recentEarnings.length === 0 &&
                    !loadingLedger && (
                      <div className="p-10 text-center">

                        <div className="w-14 h-14 mx-auto rounded-full bg-green-50 text-[#008236] flex items-center justify-center mb-3">

                          <FiDollarSign
                            size={22}
                          />

                        </div>

                        <p className="text-sm font-medium text-gray-500">
                          No earnings yet.
                        </p>

                        <p className="text-xs text-gray-400 mt-1">
                          When a buyer pays for your product, your net amount
                          (95%) appears here.
                        </p>

                      </div>
                    )}

                </>
              )}

            </div>

          </section>

          {/* =====================================================
              FOOTER NOTE
          ===================================================== */}

          <div className="rounded-2xl bg-green-50 border border-green-100 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

            <div className="flex items-center gap-3">

              <div className="w-9 h-9 rounded-xl bg-white text-[#008236] flex items-center justify-center shadow-sm flex-shrink-0">

                <FiCheckCircle size={18} />

              </div>

              <div>

                <p className="text-sm font-semibold text-gray-800">
                  Balances update when a buyer pays
                </p>

                <p className="text-xs text-gray-500 mt-0.5">
                  Available balance can be withdrawn to your bank. Amounts are
                  net of the 5% CampusMart commission.
                </p>

              </div>

            </div>

            <button
              type="button"
              onClick={() =>
                handleNavigation(
                  "/seller/settings"
                )
              }
              className="h-9 px-4 rounded-lg bg-[#008236] text-white text-xs font-semibold hover:bg-[#006f2e] transition whitespace-nowrap"
            >
              Bank Settings
            </button>

          </div>

        </main>

      </div>

    </div>
  );
}

export default SellerEarnings;