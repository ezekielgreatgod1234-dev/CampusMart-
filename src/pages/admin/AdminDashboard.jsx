import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import {
  collection,
  onSnapshot,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  getDoc,
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
  FiClock,
  FiShield,
  FiMessageCircle,
  FiTrash2,
  FiRefreshCw,
  FiAlertTriangle,
  FiCheckCircle,
  FiMail,
  FiSend,
  FiAlertCircle,
  FiVolume2,
  FiUser,
} from "react-icons/fi";

import { db } from "../../context/firebase";
import { useAuth } from "../../context/AuthContext";

const ADMIN_EMAIL = "campusmart1234@gmail.com";

const BACKEND_URL = "https://campusbackend-1.onrender.com";

function AdminDashboard() {
  const navigate = useNavigate();
  const location = useLocation();

  const { firebaseUser } = useAuth();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);

  const [totalUsers, setTotalUsers] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [platformFees, setPlatformFees] = useState(0);
  const [pendingWithdrawals, setPendingWithdrawals] = useState(0);
  const [unreadSupportCount, setUnreadSupportCount] = useState(0);

  // =========================================================
  // RESET STATES
  // =========================================================

  const [isResetting, setIsResetting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // =========================================================
  // EMAIL ANNOUNCEMENT STATES
  // =========================================================

  const [annTitle, setAnnTitle] = useState("");
  const [annBody, setAnnBody] = useState("");
  const [annMode, setAnnMode] = useState("all");
  const [annEmail, setAnnEmail] = useState("");
  const [showBanner, setShowBanner] = useState(true);
  const [annSending, setAnnSending] = useState(false);
  const [annError, setAnnError] = useState("");
  const [annSuccess, setAnnSuccess] = useState("");
  const [bannerActive, setBannerActive] = useState(false);

  // =========================================================
  // TICKER STATES
  // =========================================================

  const [tickerMessage, setTickerMessage] = useState("");
  const [tickerActive, setTickerActive] = useState(false);
  const [tickerSaving, setTickerSaving] = useState(false);
  const [tickerStatus, setTickerStatus] = useState("");
  const [tickerMode, setTickerMode] = useState("all");
  const [tickerEmail, setTickerEmail] = useState("");
  const [tickerTargetLoading, setTickerTargetLoading] = useState(false);

  // =========================================================
  // ACCESS CONTROL
  // =========================================================

  useEffect(() => {
    if (!firebaseUser) {
      setAllowed(false);
      setLoading(false);
      return;
    }

    const email = (firebaseUser.email || "").toLowerCase().trim();

    const isMainAdmin =
      email === ADMIN_EMAIL.toLowerCase();

    if (isMainAdmin) {
      setAllowed(true);
      setLoading(false);
      return;
    }

    const checkAccess = async () => {
      try {
        const snap = await getDoc(
          doc(db, "users", firebaseUser.uid)
        );

        if (!snap.exists()) {
          setAllowed(false);
          return;
        }

        const data = snap.data() || {};

        const isAdmin =
          data.role === "admin" ||
          data.isAdmin === true ||
          (Array.isArray(data.roles) &&
            data.roles.includes("admin"));

        setAllowed(isAdmin);
      } catch (error) {
        console.error(
          "Could not check admin role:",
          error
        );

        setAllowed(false);
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
  }, [firebaseUser]);

  // =========================================================
  // LIVE ADMIN STATS
  // =========================================================

  useEffect(() => {
    if (!allowed) return;

    // USERS
    const unsubUsers = onSnapshot(
      collection(db, "users"),
      (snap) => {
        setTotalUsers(snap.size);
      },
      (error) => {
        console.error(
          "Could not load users:",
          error
        );
      }
    );

    // PRODUCTS
    const unsubProducts = onSnapshot(
      collection(db, "products"),
      (snap) => {
        setTotalProducts(snap.size);
      },
      (error) => {
        console.error(
          "Could not load products:",
          error
        );
      }
    );

    // ORDERS
    const unsubOrders = onSnapshot(
      collection(db, "orders"),
      (snap) => {
        setTotalOrders(snap.size);

        let revenue = 0;

        snap.forEach((d) => {
          const data = d.data() || {};

          const amount =
            Number(data.total) ||
            Number(data.amount) ||
            Number(data.amountPaid) ||
            0;

          const paymentStatus = String(
            data.paymentStatus || ""
          ).toLowerCase();

          const status = String(
            data.status || ""
          ).toLowerCase();

          if (
            paymentStatus === "paid" ||
            status === "paid" ||
            status === "delivered" ||
            status === "pending"
          ) {
            revenue += amount;
          }
        });

        setTotalRevenue(revenue);
      },
      (error) => {
        console.error(
          "Could not load orders:",
          error
        );
      }
    );

    // PLATFORM FEES
    const unsubFees = onSnapshot(
      collection(db, "platformFees"),
      (snap) => {
        let fees = 0;

        snap.forEach((d) => {
          fees += Number(
            d.data()?.platformFee
          ) || 0;
        });

        setPlatformFees(fees);
      },
      (error) => {
        console.error(
          "Could not load platform fees:",
          error
        );
      }
    );

    // WITHDRAWALS
    const unsubWithdrawals = onSnapshot(
      collection(db, "withdrawals"),
      (snap) => {
        let pending = 0;

        snap.forEach((d) => {
          const status = String(
            d.data()?.status || ""
          ).toLowerCase();

          if (
            status === "pending" ||
            status === "processing"
          ) {
            pending += 1;
          }
        });

        setPendingWithdrawals(pending);
      },
      (error) => {
        console.error(
          "Could not load withdrawals:",
          error
        );
      }
    );

    // SUPPORT
    const unsubSupport = onSnapshot(
      collection(db, "supportMessages"),
      (snap) => {
        let unread = 0;

        snap.forEach((d) => {
          const data = d.data() || {};

          const isRead =
            data.read === true ||
            data.isRead === true ||
            String(data.status || "").toLowerCase() ===
              "read" ||
            String(data.status || "").toLowerCase() ===
              "resolved";

          if (!isRead) {
            unread += 1;
          }
        });

        setUnreadSupportCount(unread);
      },
      (error) => {
        console.error(
          "Could not load support messages:",
          error
        );
      }
    );

    // EMAIL BANNER
    const unsubBanner = onSnapshot(
      doc(db, "settings", "liveBanner"),
      (snap) => {
        if (!snap.exists()) {
          setBannerActive(false);
          return;
        }

        setBannerActive(
          snap.data()?.active === true
        );
      },
      (error) => {
        console.error(
          "Could not load banner:",
          error
        );

        setBannerActive(false);
      }
    );

    // GLOBAL TICKER
    const unsubTicker = onSnapshot(
      doc(db, "settings", "liveTicker"),
      (snap) => {
        if (!snap.exists()) {
          setTickerActive(false);
          return;
        }

        const data = snap.data() || {};

        setTickerActive(
          data.active === true
        );

        if (
          typeof data.message === "string"
        ) {
          setTickerMessage(
            data.message
          );
        }
      },
      (error) => {
        console.error(
          "Could not load global ticker:",
          error
        );

        setTickerActive(false);
      }
    );

    return () => {
      unsubUsers();
      unsubProducts();
      unsubOrders();
      unsubFees();
      unsubWithdrawals();
      unsubSupport();
      unsubBanner();
      unsubTicker();
    };
  }, [allowed]);

  // =========================================================
  // ADMIN TOKEN
  // =========================================================

  const getAdminToken = async () => {
    if (!firebaseUser) {
      throw new Error(
        "You are not signed in."
      );
    }

    return await firebaseUser.getIdToken(true);
  };

  // =========================================================
  // SECURE ADMIN BACKEND REQUEST
  // =========================================================

  const adminApiRequest = async (
    endpoint,
    body = {}
  ) => {
    const token = await getAdminToken();

    let response;

    try {
      response = await fetch(
        `${BACKEND_URL}${endpoint}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        }
      );
    } catch (networkError) {
      console.error(
        "Backend network error:",
        networkError
      );

      throw new Error(
        "Could not connect to the CampusMart server. Check your internet connection or make sure the Render backend is running."
      );
    }

    const rawText = await response.text();

    let data = {};

    try {
      data = rawText
        ? JSON.parse(rawText)
        : {};
    } catch {
      data = {};
    }

    if (!response.ok) {
      const serverMessage =
        data?.error ||
        data?.message ||
        rawText?.trim();

      if (response.status === 404) {
        throw new Error(
          "The ticker endpoint was not found on the CampusMart backend. Deploy the updated server.js to Render."
        );
      }

      if (response.status === 401) {
        throw new Error(
          serverMessage ||
            "Your admin login session is invalid or expired. Sign in again."
        );
      }

      if (response.status === 403) {
        throw new Error(
          serverMessage ||
            "You do not have administrator permission."
        );
      }

      throw new Error(
        serverMessage ||
          `Server request failed (${response.status}).`
      );
    }

    return data;
  };

  // =========================================================
  // PUBLISH TICKER
  // =========================================================

  const handlePublishTicker = async () => {
    setTickerStatus("");

    const msg = tickerMessage.trim();

    if (!msg) {
      setTickerStatus(
        "Enter a message for the ticker."
      );
      return;
    }

    if (msg.length > 500) {
      setTickerStatus(
        "Ticker message cannot exceed 500 characters."
      );
      return;
    }

    if (!firebaseUser) {
      setTickerStatus("Not signed in.");
      return;
    }

    const normalizedEmail =
      tickerEmail.trim().toLowerCase();

    if (
      tickerMode === "single" &&
      !normalizedEmail
    ) {
      setTickerStatus(
        "Enter the account email."
      );
      return;
    }

    try {
      setTickerSaving(true);

      if (tickerMode === "single") {
        setTickerTargetLoading(true);
      }

      const payload = {
        mode: tickerMode,
        message: msg,
      };

      if (tickerMode === "single") {
        payload.email = normalizedEmail;
      }

      console.log(
        "CampusMart: Publishing ticker:",
        {
          mode: tickerMode,
          email:
            tickerMode === "single"
              ? normalizedEmail
              : undefined,
        }
      );

      const data =
        await adminApiRequest(
          "/admin/publish-ticker",
          payload
        );

      // GLOBAL
      if (tickerMode === "all") {
        setTickerActive(true);

        setTickerStatus(
          "News ticker is now live for all buyers and sellers."
        );

        console.log(
          "CampusMart: Global ticker published successfully."
        );
      }

      // PRIVATE
      else {
        const targetEmail =
          data?.email ||
          normalizedEmail;

        const targetUid =
          data?.uid || "";

        setTickerStatus(
          `Private ticker sent successfully to ${targetEmail}.`
        );

        console.log(
          "CampusMart: Private ticker published securely:",
          {
            targetEmail,
            targetUid,
          }
        );

        setTickerEmail("");
      }
    } catch (error) {
      console.error(
        "CampusMart ticker publish error:",
        error
      );

      setTickerStatus(
        error?.message ||
          "Could not publish ticker."
      );
    } finally {
      setTickerSaving(false);
      setTickerTargetLoading(false);
    }
  };

  // =========================================================
  // CLEAR GLOBAL TICKER
  // =========================================================

  const handleClearTicker = async () => {
    setTickerStatus("");

    if (!firebaseUser) {
      setTickerStatus("Not signed in.");
      return;
    }

    try {
      setTickerSaving(true);

      await adminApiRequest(
        "/admin/clear-ticker",
        {
          mode: "all",
        }
      );

      setTickerActive(false);

      setTickerStatus(
        "Global news ticker cleared."
      );
    } catch (error) {
      console.error(
        "Could not clear global ticker:",
        error
      );

      setTickerStatus(
        error?.message ||
          "Could not clear global ticker."
      );
    } finally {
      setTickerSaving(false);
    }
  };

  // =========================================================
  // CLEAR PRIVATE TICKER
  // =========================================================

  const handleClearPrivateTicker =
    async () => {
      setTickerStatus("");

      const email =
        tickerEmail.trim().toLowerCase();

      if (!email) {
        setTickerStatus(
          "Enter the account email whose ticker you want to clear."
        );
        return;
      }

      if (!firebaseUser) {
        setTickerStatus("Not signed in.");
        return;
      }

      try {
        setTickerSaving(true);
        setTickerTargetLoading(true);

        await adminApiRequest(
          "/admin/clear-ticker",
          {
            mode: "single",
            email,
          }
        );

        setTickerStatus(
          `Private ticker cleared for ${email}.`
        );

        setTickerEmail("");
      } catch (error) {
        console.error(
          "Could not clear private ticker:",
          error
        );

        setTickerStatus(
          error?.message ||
            "Could not clear private ticker."
        );
      } finally {
        setTickerSaving(false);
        setTickerTargetLoading(false);
      }
    };

  // =========================================================
  // SEND EMAIL ANNOUNCEMENT
  // =========================================================

  const handleSendAnnouncement =
    async (e) => {
      e.preventDefault();

      setAnnError("");
      setAnnSuccess("");

      if (
        !annTitle.trim() ||
        !annBody.trim()
      ) {
        setAnnError(
          "Title and message are required."
        );
        return;
      }

      if (
        annMode === "single" &&
        !annEmail.trim()
      ) {
        setAnnError(
          "Enter the recipient email."
        );
        return;
      }

      if (!firebaseUser) {
        setAnnError("Not signed in.");
        return;
      }

      try {
        setAnnSending(true);

        const token =
          await firebaseUser.getIdToken(true);

        const res = await fetch(
          `${BACKEND_URL}/send-announcement-email`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              title: annTitle.trim(),
              body: annBody.trim(),
              mode: annMode,
              email:
                annMode === "single"
                  ? annEmail
                      .trim()
                      .toLowerCase()
                  : undefined,
              showBanner,
            }),
          }
        );

        const rawText = await res.text();

        let data = {};

        try {
          data = rawText
            ? JSON.parse(rawText)
            : {};
        } catch {
          data = {};
        }

        if (!res.ok) {
          throw new Error(
            data?.error ||
              data?.message ||
              rawText ||
              `Send failed (${res.status})`
          );
        }

        if (annMode === "single") {
          setAnnSuccess(
            `Email sent to ${annEmail.trim()}${
              showBanner
                ? " · In-app banner activated"
                : ""
            }`
          );
        } else {
          setAnnSuccess(
            `Emails sent: ${
              data.sent || 0
            }${
              data.failed
                ? ` (${data.failed} failed)`
                : ""
            }${
              showBanner
                ? " · Banner activated for logged-in users"
                : ""
            }`
          );
        }

        setAnnTitle("");
        setAnnBody("");
        setAnnEmail("");
      } catch (error) {
        console.error(
          "Announcement error:",
          error
        );

        setAnnError(
          error?.message ||
            "Could not send announcement."
        );
      } finally {
        setAnnSending(false);
      }
    };

  // =========================================================
  // CLEAR EMAIL BANNER
  // =========================================================

  const handleClearBanner =
    async () => {
      setAnnError("");
      setAnnSuccess("");

      if (!firebaseUser) {
        setAnnError("Not signed in.");
        return;
      }

      try {
        const token =
          await firebaseUser.getIdToken(true);

        const res = await fetch(
          `${BACKEND_URL}/clear-live-banner`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({}),
          }
        );

        const rawText = await res.text();

        let data = {};

        try {
          data = rawText
            ? JSON.parse(rawText)
            : {};
        } catch {
          data = {};
        }

        if (!res.ok) {
          throw new Error(
            data?.error ||
              data?.message ||
              rawText ||
              `Failed (${res.status})`
          );
        }

        setAnnSuccess(
          "In-app banner cleared."
        );
      } catch (error) {
        console.error(
          "Could not clear banner:",
          error
        );

        setAnnError(
          error?.message ||
            "Could not clear banner."
        );
      }
    };

  // =========================================================
  // RESET ALL TRANSACTIONS
  // =========================================================

  const handleResetAllTransactions =
    async () => {
      setIsResetting(true);
      setShowResetConfirm(false);

      try {
        // DELETE ORDERS
        const ordersSnap =
          await getDocs(
            collection(db, "orders")
          );

        await Promise.all(
          ordersSnap.docs.map(
            (d) => deleteDoc(d.ref)
          )
        );

        // DELETE EARNINGS
        const earningsSnap =
          await getDocs(
            collection(db, "earnings")
          );

        await Promise.all(
          earningsSnap.docs.map(
            (d) => deleteDoc(d.ref)
          )
        );

        // DELETE PLATFORM FEES
        try {
          const feesSnap =
            await getDocs(
              collection(
                db,
                "platformFees"
              )
            );

          await Promise.all(
            feesSnap.docs.map(
              (d) => deleteDoc(d.ref)
            )
          );
        } catch (error) {
          console.warn(
            "Could not clear platform fees:",
            error
          );
        }

        // RESET SELLER BALANCES
        const usersSnap =
          await getDocs(
            collection(db, "users")
          );

        await Promise.all(
          usersSnap.docs.map(
            async (userDoc) => {
              const data =
                userDoc.data() || {};

              if (
                data.availableBalance !==
                  undefined ||
                data.totalEarnings !==
                  undefined ||
                data.role === "seller" ||
                data.isSeller === true
              ) {
                await updateDoc(
                  userDoc.ref,
                  {
                    availableBalance: 0,
                    totalEarnings: 0,
                    totalSalesGross: 0,
                    totalPlatformFees: 0,
                  }
                );
              }
            }
          )
        );

        setShowSuccessModal(true);
      } catch (error) {
        console.error(
          "Reset failed:",
          error
        );

        alert(
          "Reset failed. Check the console for details.\n\nError: " +
            (error?.message ||
              "Unknown error")
        );
      } finally {
        setIsResetting(false);
      }
    };

  // =========================================================
  // FORMAT NAIRA
  // =========================================================

  const formatNaira = (n) =>
    `₦${Number(n || 0).toLocaleString(
      "en-NG"
    )}`;

  // =========================================================
  // ADMIN MENU
  // =========================================================

  const menuItems = [
    {
      label: "Overview",
      icon: FiGrid,
      path: "/admin-dashboard",
    },
    {
      label: "Users",
      icon: FiUsers,
      path: "/admin/users",
    },
    {
      label: "Products",
      icon: FiPackage,
      path: "/admin/products",
    },
    {
      label: "Orders",
      icon: FiShoppingBag,
      path: "/admin/orders",
    },
    {
      label: "Platform Fees",
      icon: FiDollarSign,
      path: "/admin/fees",
    },
    {
      label: "Withdrawals",
      icon: FiCreditCard,
      path: "/admin/withdrawals",
    },
    {
      label: "Payments",
      icon: FiTrendingUp,
      path: "/admin/payments",
    },
    {
      label: "Support Messages",
      icon: FiMessageCircle,
      path: "/admin/support-messages",
      badge: unreadSupportCount,
    },
  ];

  const isActive = (path) => {
    if (
      path === "/admin-dashboard"
    ) {
      return (
        location.pathname ===
        "/admin-dashboard"
      );
    }

    return location.pathname.startsWith(
      path
    );
  };

  const handleNavigation = (path) => {
    setSidebarOpen(false);
    navigate(path);
  };

  const handleLogout = () => {
    setSidebarOpen(false);
    navigate("/logout");
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-10 h-10 mx-auto rounded-full border-4 border-green-100 border-t-green-600 animate-spin" />

          <p className="mt-4 text-sm text-gray-500">
            Checking access...
          </p>
        </div>
      </div>
    );
  }

  // =========================================================
  // ACCESS DENIED
  // =========================================================

  if (!firebaseUser || !allowed) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-sm text-center bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
          <div className="w-14 h-14 mx-auto rounded-full bg-red-50 text-red-500 flex items-center justify-center mb-4">
            <FiShield size={24} />
          </div>

          <h1 className="text-xl font-bold text-gray-800">
            Access Denied
          </h1>

          <p className="text-sm text-gray-500 mt-2">
            You do not have
            permission to view
            the Admin Dashboard.
          </p>

          <button
            type="button"
            onClick={() => navigate("/")}
            className="mt-6 h-11 px-6 rounded-xl bg-[#008236] text-white text-sm font-semibold hover:bg-[#006f2e] transition"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-gray-50 text-gray-800 font-sans overflow-hidden">

      {/* MOBILE OVERLAY */}

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() =>
            setSidebarOpen(false)
          }
        />
      )}

      {/* SIDEBAR */}

      <aside
        className={`
          fixed inset-y-0 left-0 z-50
          w-[291px]
          bg-[#008236]
          text-white
          flex flex-col
          h-screen
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
        <div className="relative px-5 pt-6 pb-4">

          <button
            type="button"
            onClick={() =>
              setSidebarOpen(false)
            }
            className="lg:hidden absolute top-3 right-3 w-9 h-9 rounded-lg hover:bg-white/10 flex items-center justify-center"
          >
            <FiX size={21} />
          </button>

          <div className="flex items-center gap-3">

            <div className="w-10 h-10 rounded-xl bg-[#006f2e] flex items-center justify-center border border-white/10">
              <span className="text-white text-[16px] font-black">
                CM
              </span>
            </div>

            <div>
              <h1 className="text-[22px] font-extrabold leading-none">
                Campus
                <span className="text-green-300">
                  Mart
                </span>
              </h1>

              <p className="text-[10px] text-green-100 mt-1">
                Admin Panel
              </p>
            </div>

          </div>
        </div>

        <nav className="flex-1 px-4 py-3 overflow-y-auto flex flex-col gap-1">

          {menuItems.map(
            ({
              label,
              icon: Icon,
              path,
              badge,
            }) => {
              const active =
                isActive(path);

              return (
                <button
                  key={label}
                  type="button"
                  onClick={() =>
                    handleNavigation(
                      path
                    )
                  }
                  className={`
                    w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-left transition
                    ${
                      active
                        ? "bg-white text-[#008236] font-semibold"
                        : "text-white hover:bg-white/10"
                    }
                  `}
                >
                  <Icon
                    size={18}
                    className="flex-shrink-0"
                  />

                  <span className="flex-1 text-[14px]">
                    {label}
                  </span>

                  {badge > 0 && (
                    <span className="min-w-[20px] h-[20px] px-1.5 rounded-full text-[10px] font-bold flex items-center justify-center flex-shrink-0 bg-red-500 text-white">
                      {badge > 99
                        ? "99+"
                        : badge}
                    </span>
                  )}
                </button>
              );
            }
          )}

        </nav>

        <div className="px-4 pb-5">

          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-white hover:bg-white/10 transition"
          >
            <FiLogOut size={18} />

            <span className="text-[14px]">
              Logout
            </span>
          </button>

        </div>
      </aside>

      {/* MAIN */}

      <div className="min-w-0 flex flex-col h-screen lg:ml-[291px]">

        <header className="min-h-[70px] bg-[#007233] text-white flex items-center px-4 sm:px-6 lg:px-8 gap-3 flex-shrink-0">

          <button
            type="button"
            onClick={() =>
              setSidebarOpen(true)
            }
            className="lg:hidden w-10 h-10 rounded-lg hover:bg-white/10 flex items-center justify-center"
          >
            <FiMenu size={22} />
          </button>

          <div>
            <p className="text-sm font-semibold">
              Admin Dashboard
            </p>

            <p className="text-[11px] text-green-100">
              Platform overview &
              control
            </p>
          </div>

        </header>

        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6">

          {/* HERO */}

          <div className="mb-6 rounded-2xl bg-gradient-to-r from-[#007233] to-[#008f3f] p-6 text-white shadow-lg">

            <p className="text-xs text-green-100 font-medium">
              Overview
            </p>

            <h1 className="text-2xl sm:text-3xl font-bold mt-1">
              CampusMart Admin
            </h1>

            <p className="text-sm text-green-100 mt-2 max-w-xl">
              Track users, orders,
              revenue and platform
              fees in real time.
            </p>

          </div>

          {/* STATS */}

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">

            <StatCard
              label="Total Users"
              value={totalUsers}
              icon={FiUsers}
              color="text-blue-600"
              bg="bg-blue-50"
            />

            <StatCard
              label="Total Products"
              value={totalProducts}
              icon={FiPackage}
              color="text-purple-600"
              bg="bg-purple-50"
            />

            <StatCard
              label="Total Orders"
              value={totalOrders}
              icon={FiShoppingBag}
              color="text-orange-600"
              bg="bg-orange-50"
            />

            <StatCard
              label="Total Revenue"
              value={formatNaira(
                totalRevenue
              )}
              icon={FiTrendingUp}
              color="text-emerald-600"
              bg="bg-emerald-50"
            />

            <StatCard
              label="CampusMart Fees (5%)"
              value={formatNaira(
                platformFees
              )}
              icon={FiDollarSign}
              color="text-[#008236]"
              bg="bg-green-50"
            />

            <StatCard
              label="Pending Withdrawals"
              value={
                pendingWithdrawals
              }
              icon={FiClock}
              color="text-amber-600"
              bg="bg-amber-50"
            />

          </div>

          {/* SUPPORT */}

          <div className="mt-6 bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">

            <div className="flex items-center justify-between gap-4">

              <div className="flex items-center gap-3">

                <div className="relative w-11 h-11 rounded-xl bg-green-50 text-[#008236] flex items-center justify-center">

                  <FiMessageCircle
                    size={21}
                  />

                  {unreadSupportCount >
                    0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                      {unreadSupportCount >
                      99
                        ? "99+"
                        : unreadSupportCount}
                    </span>
                  )}

                </div>

                <div>

                  <h2 className="text-sm font-bold text-gray-900">
                    Support Messages
                  </h2>

                  <p className="text-xs text-gray-500 mt-1">
                    {unreadSupportCount >
                    0
                      ? `${unreadSupportCount} new message${
                          unreadSupportCount ===
                          1
                            ? ""
                            : "s"
                        }`
                      : "View and manage messages from users."}
                  </p>

                </div>

              </div>

              <button
                type="button"
                onClick={() =>
                  navigate(
                    "/admin/support-messages"
                  )
                }
                className="h-10 px-4 rounded-xl bg-[#008236] text-white text-sm font-semibold hover:bg-[#006f2e] transition flex items-center gap-2"
              >
                <FiMessageCircle
                  size={16}
                />
                Open
              </button>

            </div>

          </div>

          {/* =================================================
              TICKER
             ================================================= */}

          <div className="mt-6 bg-white rounded-2xl border border-green-200 p-5 sm:p-6 shadow-sm">

            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-5">

              <div className="flex items-start gap-3">

                <div className="w-11 h-11 rounded-xl bg-green-50 text-[#008236] flex items-center justify-center flex-shrink-0 border border-green-100">
                  <FiVolume2
                    size={20}
                  />
                </div>

                <div>

                  <h2 className="text-sm font-bold text-gray-900">
                    In-app news ticker
                  </h2>

                  <p className="text-xs text-gray-500 mt-1 max-w-md">
                    Send a scrolling
                    notification to
                    every buyer and
                    seller or to one
                    specific CampusMart
                    account.
                  </p>

                </div>

              </div>

              <div
                className={`
                  self-start px-3 py-1.5 rounded-full text-[11px] font-semibold
                  ${
                    tickerActive
                      ? "bg-green-50 text-[#008236] border border-green-100"
                      : "bg-gray-50 text-gray-500 border border-gray-100"
                  }
                `}
              >
                Global ticker:{" "}
                {tickerActive
                  ? "Live"
                  : "Off"}
              </div>

            </div>

            {/* TICKER STATUS */}

            {tickerStatus && (
              <div
                className={`mb-4 rounded-xl px-4 py-3 text-sm flex items-start gap-2 ${
                  tickerStatus
                    .toLowerCase()
                    .includes("successfully") ||
                  tickerStatus
                    .toLowerCase()
                    .includes("live") ||
                  tickerStatus
                    .toLowerCase()
                    .includes("cleared")
                    ? "bg-green-50 border border-green-100 text-green-700"
                    : "bg-red-50 border border-red-100 text-red-600"
                }`}
              >

                {tickerStatus
                  .toLowerCase()
                  .includes("successfully") ||
                tickerStatus
                  .toLowerCase()
                  .includes("live") ||
                tickerStatus
                  .toLowerCase()
                  .includes("cleared") ? (
                  <FiCheckCircle
                    size={17}
                    className="mt-0.5 flex-shrink-0"
                  />
                ) : (
                  <FiAlertCircle
                    size={17}
                    className="mt-0.5 flex-shrink-0"
                  />
                )}

                <span>
                  {tickerStatus}
                </span>

              </div>
            )}

            {/* TARGET TYPE */}

            <div className="mb-5">

              <label className="block text-sm font-medium text-gray-700 mb-2">
                Who should receive
                this ticker?
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                <button
                  type="button"
                  onClick={() => {
                    setTickerMode("all");
                    setTickerStatus("");
                  }}
                  className={`
                    p-4 rounded-xl border text-left transition
                    ${
                      tickerMode === "all"
                        ? "border-[#008236] bg-green-50"
                        : "border-gray-200 bg-white hover:bg-gray-50"
                    }
                  `}
                >

                  <div className="flex items-center gap-3">

                    <div
                      className={`
                        w-10 h-10 rounded-xl flex items-center justify-center
                        ${
                          tickerMode === "all"
                            ? "bg-[#008236] text-white"
                            : "bg-gray-100 text-gray-500"
                        }
                      `}
                    >
                      <FiUsers
                        size={18}
                      />
                    </div>

                    <div>

                      <p className="text-sm font-bold text-gray-900">
                        Everyone
                      </p>

                      <p className="text-xs text-gray-500 mt-0.5">
                        All buyers &
                        sellers
                      </p>

                    </div>

                  </div>

                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTickerMode("single");
                    setTickerStatus("");
                  }}
                  className={`
                    p-4 rounded-xl border text-left transition
                    ${
                      tickerMode === "single"
                        ? "border-[#008236] bg-green-50"
                        : "border-gray-200 bg-white hover:bg-gray-50"
                    }
                  `}
                >

                  <div className="flex items-center gap-3">

                    <div
                      className={`
                        w-10 h-10 rounded-xl flex items-center justify-center
                        ${
                          tickerMode === "single"
                            ? "bg-[#008236] text-white"
                            : "bg-gray-100 text-gray-500"
                        }
                      `}
                    >
                      <FiUser
                        size={18}
                      />
                    </div>

                    <div>

                      <p className="text-sm font-bold text-gray-900">
                        One account
                      </p>

                      <p className="text-xs text-gray-500 mt-0.5">
                        Send to one
                        email
                      </p>

                    </div>

                  </div>

                </button>

              </div>

            </div>

            {/* TARGET EMAIL */}

            {tickerMode === "single" && (
              <div className="mb-5">

                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  CampusMart account
                  email
                </label>

                <div className="relative">

                  <FiMail
                    size={17}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    type="email"
                    value={tickerEmail}
                    onChange={(e) => {
                      setTickerEmail(
                        e.target.value
                      );

                      setTickerStatus("");
                    }}
                    placeholder="student@example.com"
                    className="w-full h-11 pl-10 pr-4 rounded-xl border border-gray-200 bg-gray-50 text-sm outline-none focus:border-[#008236] focus:bg-white"
                  />

                </div>

                <p className="text-[11px] text-gray-400 mt-1.5">
                  The ticker will
                  only appear on
                  the account
                  belonging to this
                  email.
                </p>

              </div>
            )}

            {/* MESSAGE */}

            <div>

              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Ticker message
              </label>

              <textarea
                rows={3}
                value={tickerMessage}
                onChange={(e) => {
                  setTickerMessage(
                    e.target.value
                  );

                  setTickerStatus("");
                }}
                placeholder={
                  tickerMode === "single"
                    ? "e.g. Your CampusMart order has been updated."
                    : "e.g. Welcome to CampusMart 2.0 — Gigs are live. Shop safe on campus!"
                }
                maxLength={500}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm outline-none focus:border-[#008236] focus:bg-white resize-none"
              />

              <div className="mt-1 text-right text-[10px] text-gray-400">
                {tickerMessage.length}/500
              </div>

            </div>

            {/* BUTTONS */}

            <div className="mt-4 flex flex-col sm:flex-row gap-3">

              <button
                type="button"
                disabled={
                  tickerSaving ||
                  tickerTargetLoading
                }
                onClick={
                  handlePublishTicker
                }
                className="h-11 px-5 rounded-xl bg-[#008236] hover:bg-[#006f2e] disabled:opacity-60 text-white text-sm font-semibold inline-flex items-center justify-center gap-2 transition"
              >

                {tickerSaving ? (
                  <>
                    <FiRefreshCw
                      className="animate-spin"
                      size={16}
                    />

                    Sending...
                  </>
                ) : (
                  <>
                    <FiSend
                      size={16}
                    />

                    {tickerMode === "single"
                      ? "Send to account"
                      : "Publish for everyone"}
                  </>
                )}

              </button>

              {tickerMode === "all" && (
                <button
                  type="button"
                  disabled={
                    tickerSaving ||
                    !tickerActive
                  }
                  onClick={
                    handleClearTicker
                  }
                  className="h-11 px-5 rounded-xl border border-green-200 text-[#008236] text-sm font-semibold hover:bg-green-50 transition disabled:opacity-50"
                >
                  Clear global ticker
                </button>
              )}

              {tickerMode === "single" && (
                <button
                  type="button"
                  disabled={
                    tickerSaving ||
                    tickerTargetLoading ||
                    !tickerEmail.trim()
                  }
                  onClick={
                    handleClearPrivateTicker
                  }
                  className="h-11 px-5 rounded-xl border border-red-200 text-red-600 text-sm font-semibold hover:bg-red-50 transition disabled:opacity-50"
                >
                  Clear user's ticker
                </button>
              )}

            </div>

          </div>

          {/* EMAIL ANNOUNCEMENTS */}

          <div className="mt-6 bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 shadow-sm">

            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-5">

              <div className="flex items-start gap-3">

                <div className="w-11 h-11 rounded-xl bg-green-50 text-[#008236] flex items-center justify-center flex-shrink-0 border border-green-100">
                  <FiMail
                    size={20}
                  />
                </div>

                <div>

                  <h2 className="text-sm font-bold text-gray-900">
                    Email announcements
                  </h2>

                  <p className="text-xs text-gray-500 mt-1 max-w-md">
                    Email every
                    registered user or
                    one specific email.
                  </p>

                </div>

              </div>

              <div
                className={`
                  self-start px-3 py-1.5 rounded-full text-[11px] font-semibold
                  ${
                    bannerActive
                      ? "bg-green-50 text-[#008236] border border-green-100"
                      : "bg-gray-50 text-gray-500 border border-gray-100"
                  }
                `}
              >
                Email banner:{" "}
                {bannerActive
                  ? "Active"
                  : "Off"}
              </div>

            </div>

            {annError && (
              <div className="mb-4 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600 flex gap-2">

                <FiAlertCircle
                  className="shrink-0 mt-0.5"
                  size={16}
                />

                {annError}

              </div>
            )}

            {annSuccess && (
              <div className="mb-4 rounded-xl bg-green-50 border border-green-100 px-4 py-3 text-sm text-green-700 flex gap-2">

                <FiCheckCircle
                  className="shrink-0 mt-0.5"
                  size={16}
                />

                {annSuccess}

              </div>
            )}

            <form
              onSubmit={
                handleSendAnnouncement
              }
              className="space-y-4"
            >

              <div>

                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Recipients
                </label>

                <div className="flex flex-wrap gap-2">

                  {[
                    {
                      id: "all",
                      label:
                        "All registered emails",
                    },
                    {
                      id: "single",
                      label:
                        "One specific email",
                    },
                  ].map((o) => (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() =>
                        setAnnMode(o.id)
                      }
                      className={`h-10 px-4 rounded-xl text-sm font-semibold transition ${
                        annMode === o.id
                          ? "bg-[#008236] text-white"
                          : "bg-green-50 text-[#008236] border border-green-100"
                      }`}
                    >
                      {o.label}
                    </button>
                  ))}

                </div>

              </div>

              {annMode === "single" && (
                <div>

                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Email address
                  </label>

                  <input
                    type="email"
                    value={annEmail}
                    onChange={(e) =>
                      setAnnEmail(
                        e.target.value
                      )
                    }
                    placeholder="student@example.com"
                    className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-gray-50 text-sm outline-none focus:border-[#008236] focus:bg-white"
                  />

                </div>
              )}

              <div>

                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Title
                </label>

                <input
                  type="text"
                  value={annTitle}
                  onChange={(e) =>
                    setAnnTitle(
                      e.target.value
                    )
                  }
                  placeholder="e.g. New CampusMart update"
                  className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-gray-50 text-sm outline-none focus:border-[#008236] focus:bg-white"
                />

              </div>

              <div>

                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Message
                </label>

                <textarea
                  rows={4}
                  value={annBody}
                  onChange={(e) =>
                    setAnnBody(
                      e.target.value
                    )
                  }
                  placeholder="Write the announcement users will receive by email..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm outline-none focus:border-[#008236] focus:bg-white resize-none"
                />

              </div>

              <label className="flex items-start gap-3 cursor-pointer">

                <input
                  type="checkbox"
                  checked={showBanner}
                  onChange={(e) =>
                    setShowBanner(
                      e.target.checked
                    )
                  }
                  className="mt-1 accent-green-600"
                />

                <span className="text-sm text-gray-600">
                  Also set email-reminder
                  banner.
                </span>

              </label>

              <div className="flex flex-col sm:flex-row gap-3 pt-1">

                <button
                  type="submit"
                  disabled={annSending}
                  className="h-11 px-5 rounded-xl bg-[#008236] hover:bg-[#006f2e] disabled:opacity-60 text-white text-sm font-semibold inline-flex items-center justify-center gap-2 transition"
                >

                  {annSending ? (
                    <>
                      <FiRefreshCw
                        className="animate-spin"
                        size={16}
                      />

                      Sending...
                    </>
                  ) : (
                    <>
                      <FiSend
                        size={16}
                      />

                      Send email
                      announcement
                    </>
                  )}

                </button>

                {bannerActive && (
                  <button
                    type="button"
                    onClick={
                      handleClearBanner
                    }
                    className="h-11 px-5 rounded-xl border border-green-200 text-[#008236] text-sm font-semibold hover:bg-green-50 transition"
                  >
                    Clear email banner
                  </button>
                )}

              </div>

            </form>

          </div>

          {/* RESET */}

          <div className="mt-8 bg-white rounded-2xl border border-green-200 p-5 shadow-sm">

            <div className="flex items-start gap-4">

              <div className="w-11 h-11 rounded-xl bg-green-50 text-[#008236] flex items-center justify-center flex-shrink-0">
                <FiRefreshCw
                  size={22}
                />
              </div>

              <div className="flex-1">

                <h2 className="text-sm font-bold text-[#008236]">
                  Reset Transactions
                </h2>

                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  This will permanently
                  delete{" "}
                  <strong>
                    all buyer orders
                  </strong>
                  ,{" "}
                  <strong>
                    all seller earnings
                  </strong>{" "}
                  and reset every
                  seller’s balance to
                  ₦0.
                </p>

                <button
                  type="button"
                  disabled={isResetting}
                  onClick={() =>
                    setShowResetConfirm(
                      true
                    )
                  }
                  className={`
                    mt-4 h-11 px-5 rounded-xl text-sm font-semibold
                    flex items-center gap-2 transition
                    ${
                      isResetting
                        ? "bg-green-300 text-white cursor-not-allowed"
                        : "bg-[#008236] hover:bg-[#006f2e] text-white"
                    }
                  `}
                >

                  {isResetting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />

                      Resetting...
                    </>
                  ) : (
                    <>
                      <FiTrash2
                        size={16}
                      />

                      Reset All Orders &
                      Earnings
                    </>
                  )}

                </button>

              </div>

            </div>

          </div>

        </main>

      </div>

      {/* RESET CONFIRMATION MODAL */}

      {showResetConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">

          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() =>
              !isResetting &&
              setShowResetConfirm(
                false
              )
            }
          />

          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">

            <div className="bg-[#008236] px-6 py-5 flex items-center gap-3">

              <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center">

                <FiAlertTriangle
                  size={22}
                  className="text-white"
                />

              </div>

              <div>

                <h3 className="text-lg font-bold text-white">
                  Confirm Reset
                </h3>

                <p className="text-xs text-green-100 mt-0.5">
                  This action cannot
                  be undone
                </p>

              </div>

            </div>

            <div className="px-6 py-5">

              <p className="text-sm text-gray-600 leading-relaxed">
                You are about to
                permanently delete:
              </p>

              <ul className="mt-3 space-y-2 text-sm text-gray-700">

                <li>
                  • All buyer orders
                </li>

                <li>
                  • All seller earnings
                  records
                </li>

                <li>
                  • Reset every seller's
                  balance to ₦0
                </li>

              </ul>

              <p className="mt-4 text-xs text-gray-500">
                This is intended for
                testing only.
              </p>

            </div>

            <div className="px-6 pb-6 flex flex-col sm:flex-row gap-3">

              <button
                type="button"
                disabled={isResetting}
                onClick={() =>
                  setShowResetConfirm(
                    false
                  )
                }
                className="flex-1 h-11 rounded-xl border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isResetting}
                onClick={
                  handleResetAllTransactions
                }
                className="flex-1 h-11 rounded-xl bg-[#008236] hover:bg-[#006f2e] text-white text-sm font-semibold transition flex items-center justify-center gap-2"
              >

                {isResetting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />

                    Resetting...
                  </>
                ) : (
                  <>
                    <FiTrash2
                      size={16}
                    />

                    Yes, Reset Everything
                  </>
                )}

              </button>

            </div>

          </div>

        </div>
      )}

      {/* SUCCESS MODAL */}

      {showSuccessModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">

          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() =>
              setShowSuccessModal(
                false
              )
            }
          />

          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">

            <div className="bg-[#008236] px-6 py-6 flex flex-col items-center text-center">

              <div className="w-16 h-16 rounded-full bg-white/15 flex items-center justify-center mb-3">

                <FiCheckCircle
                  size={36}
                  className="text-white"
                />

              </div>

              <h3 className="text-xl font-bold text-white">
                Reset Complete!
              </h3>

              <p className="text-sm text-green-100 mt-1">
                All transaction data
                has been cleared
              </p>

            </div>

            <div className="px-6 py-5">

              <p className="text-sm text-gray-600 text-center leading-relaxed">
                All buyer orders,
                seller earnings and
                balances have been
                successfully reset.
              </p>

            </div>

            <div className="px-6 pb-6">

              <button
                type="button"
                onClick={() =>
                  setShowSuccessModal(
                    false
                  )
                }
                className="w-full h-11 rounded-xl bg-[#008236] hover:bg-[#006f2e] text-white text-sm font-semibold transition"
              >
                Continue
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}

// =============================================================
// STAT CARD
// =============================================================

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  bg,
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">

      <div className="flex items-start justify-between gap-3">

        <div>

          <p className="text-xs text-gray-500 font-medium">
            {label}
          </p>

          <p className="text-2xl font-bold text-gray-900 mt-2">
            {value}
          </p>

        </div>

        <div
          className={`w-11 h-11 rounded-xl ${bg} ${color} flex items-center justify-center flex-shrink-0`}
        >
          <Icon size={20} />
        </div>

      </div>

    </div>
  );
}

export default AdminDashboard;