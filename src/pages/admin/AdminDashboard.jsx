import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import {
  collection,
  onSnapshot,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  getDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
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
  FiCheck,
  FiExternalLink,
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

  // Stats
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [platformFees, setPlatformFees] = useState(0);
  const [pendingWithdrawals, setPendingWithdrawals] = useState(0);
  const [unreadSupportCount, setUnreadSupportCount] = useState(0);

  // Seller balances view (stat card -> whole page swap)
  const [activeView, setActiveView] = useState("overview");
  const [sellerBalances, setSellerBalances] = useState([]);
  const [sellerSearch, setSellerSearch] = useState("");

  // Delivery confirmations (buyer approved goods)
  const [confirmations, setConfirmations] = useState([]);
  const [confirmationsLoading, setConfirmationsLoading] = useState(true);
  const [confirmActionId, setConfirmActionId] = useState(null);
  const [confirmMsg, setConfirmMsg] = useState("");

  // Reset
  const [isResetting, setIsResetting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Email announcement
  const [annTitle, setAnnTitle] = useState("");
  const [annBody, setAnnBody] = useState("");
  const [annMode, setAnnMode] = useState("all");
  const [annEmail, setAnnEmail] = useState("");
  const [showBanner, setShowBanner] = useState(true);
  const [annSending, setAnnSending] = useState(false);
  const [annError, setAnnError] = useState("");
  const [annSuccess, setAnnSuccess] = useState("");
  const [bannerActive, setBannerActive] = useState(false);

  // Ticker
  const [tickerMessage, setTickerMessage] = useState("");
  const [tickerActive, setTickerActive] = useState(false);
  const [tickerSaving, setTickerSaving] = useState(false);
  const [tickerStatus, setTickerStatus] = useState("");
  const [tickerMode, setTickerMode] = useState("all");
  const [tickerEmail, setTickerEmail] = useState("");
  const [tickerTargetLoading, setTickerTargetLoading] = useState(false);

  // Feature push
  const [featureTitle, setFeatureTitle] = useState("");
  const [featureBody, setFeatureBody] = useState("");
  const [featureSending, setFeatureSending] = useState(false);
  const [featureStatus, setFeatureStatus] = useState("");

  // =========================================================
  // ACCESS
  // =========================================================
  useEffect(() => {
    if (!firebaseUser) {
      setAllowed(false);
      setLoading(false);
      return;
    }

    const email = (firebaseUser.email || "").toLowerCase().trim();
    if (email === ADMIN_EMAIL.toLowerCase()) {
      setAllowed(true);
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const snap = await getDoc(doc(db, "users", firebaseUser.uid));
        if (!snap.exists()) {
          setAllowed(false);
          return;
        }
        const data = snap.data() || {};
        const isAdmin =
          data.role === "admin" ||
          data.isAdmin === true ||
          (Array.isArray(data.roles) && data.roles.includes("admin"));
        setAllowed(isAdmin);
      } catch {
        setAllowed(false);
      } finally {
        setLoading(false);
      }
    })();
  }, [firebaseUser]);

  // =========================================================
  // STATS — one-shot getDocs (free-tier friendly)
  // =========================================================
  useEffect(() => {
    if (!allowed) return;
    let cancelled = false;

    const loadStats = async () => {
      try {
        const [
          usersSnap,
          productsSnap,
          ordersSnap,
          feesSnap,
          withdrawalsSnap,
          supportSnap,
        ] = await Promise.all([
          getDocs(query(collection(db, "users"), limit(500))),
          getDocs(query(collection(db, "products"), limit(500))),
          getDocs(query(collection(db, "orders"), limit(300))),
          getDocs(query(collection(db, "platformFees"), limit(300))),
          getDocs(query(collection(db, "withdrawals"), limit(100))),
          getDocs(query(collection(db, "supportMessages"), limit(100))),
        ]);

        if (cancelled) return;

        setTotalUsers(usersSnap.size);
        setTotalProducts(productsSnap.size);
        setTotalOrders(ordersSnap.size);

        const sellers = [];
        usersSnap.forEach((d) => {
          const data = d.data() || {};
          const isSellerAccount =
            data.role === "seller" ||
            data.isSeller === true ||
            data.hasStore === true ||
            data.availableBalance !== undefined;
          if (!isSellerAccount) return;
          sellers.push({
            id: d.id,
            name:
              data.fullName ||
              data.storeName ||
              data.businessName ||
              data.name ||
              "Unnamed seller",
            email: data.email || "—",
            availableBalance: Number(data.availableBalance) || 0,
            totalEarnings: Number(data.totalEarnings) || 0,
          });
        });
        sellers.sort((a, b) => b.availableBalance - a.availableBalance);
        setSellerBalances(sellers);

        let revenue = 0;
        ordersSnap.forEach((d) => {
          const data = d.data() || {};
          const amount =
            Number(data.total) ||
            Number(data.amount) ||
            Number(data.amountPaid) ||
            0;
          const paymentStatus = String(data.paymentStatus || "").toLowerCase();
          const status = String(data.status || "").toLowerCase();
          if (
            paymentStatus === "paid" ||
            status === "paid" ||
            status === "delivered" ||
            status === "pending" ||
            status === "completed"
          ) {
            revenue += amount;
          }
        });
        setTotalRevenue(revenue);

        let fees = 0;
        feesSnap.forEach((d) => {
          fees += Number(d.data()?.platformFee) || 0;
        });
        setPlatformFees(fees);

        let pending = 0;
        withdrawalsSnap.forEach((d) => {
          const status = String(d.data()?.status || "").toLowerCase();
          if (status === "pending" || status === "processing") pending += 1;
        });
        setPendingWithdrawals(pending);

        let unread = 0;
        supportSnap.forEach((d) => {
          const data = d.data() || {};
          const isRead =
            data.read === true ||
            data.isRead === true ||
            ["read", "resolved"].includes(
              String(data.status || "").toLowerCase()
            );
          if (!isRead) unread += 1;
        });
        setUnreadSupportCount(unread);
      } catch (error) {
        console.error("Admin stats load error:", error);
      }
    };

    loadStats();
    return () => {
      cancelled = true;
    };
  }, [allowed]);

  // Live support badge only
  useEffect(() => {
    if (!allowed) return;
    const unsub = onSnapshot(
      query(collection(db, "supportMessages"), limit(80)),
      (snap) => {
        let unread = 0;
        snap.forEach((d) => {
          const data = d.data() || {};
          const isRead =
            data.read === true ||
            data.isRead === true ||
            ["read", "resolved"].includes(
              String(data.status || "").toLowerCase()
            );
          if (!isRead) unread += 1;
        });
        setUnreadSupportCount(unread);
      },
      () => {}
    );
    return () => unsub();
  }, [allowed]);

  // Banner + ticker settings (small docs)
  useEffect(() => {
    if (!allowed) return;

    const unsubBanner = onSnapshot(
      doc(db, "settings", "liveBanner"),
      (snap) => {
        setBannerActive(snap.exists() && snap.data()?.active === true);
      },
      () => setBannerActive(false)
    );

    const unsubTicker = onSnapshot(
      doc(db, "settings", "liveTicker"),
      (snap) => {
        if (!snap.exists()) {
          setTickerActive(false);
          return;
        }
        const data = snap.data() || {};
        setTickerActive(data.active === true);
        if (typeof data.message === "string") setTickerMessage(data.message);
      },
      () => setTickerActive(false)
    );

    return () => {
      unsubBanner();
      unsubTicker();
    };
  }, [allowed]);

  // =========================================================
  // DELIVERY CONFIRMATIONS (buyer approved goods)
  // =========================================================
  useEffect(() => {
    if (!allowed) return;

    setConfirmationsLoading(true);

    let q;
    try {
      q = query(
        collection(db, "deliveryConfirmations"),
        orderBy("createdAt", "desc"),
        limit(40)
      );
    } catch {
      q = query(collection(db, "deliveryConfirmations"), limit(40));
    }

    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        // Client sort if orderBy missing
        list.sort((a, b) => {
          const aT =
            a.createdAt?.toMillis?.() ||
            a.createdAt?.seconds * 1000 ||
            0;
          const bT =
            b.createdAt?.toMillis?.() ||
            b.createdAt?.seconds * 1000 ||
            0;
          return bT - aT;
        });
        setConfirmations(list);
        setConfirmationsLoading(false);
      },
      (error) => {
        console.error("deliveryConfirmations listener:", error);
        // Fallback without orderBy
        getDocs(query(collection(db, "deliveryConfirmations"), limit(40)))
          .then((snap) => {
            setConfirmations(
              snap.docs.map((d) => ({ id: d.id, ...d.data() }))
            );
            setConfirmationsLoading(false);
          })
          .catch(() => {
            setConfirmations([]);
            setConfirmationsLoading(false);
          });
      }
    );

    return () => unsub();
  }, [allowed]);

  const pendingConfirmations = useMemo(
    () =>
      confirmations.filter((c) => {
        const s = String(c.status || "pending_admin_review").toLowerCase();
        return (
          s === "pending_admin_review" ||
          s === "pending" ||
          s === "awaiting_admin"
        );
      }),
    [confirmations]
  );

  const formatNaira = (n) =>
    `₦${Number(n || 0).toLocaleString("en-NG")}`;

  const totalSellerBalance = useMemo(
    () => sellerBalances.reduce((sum, s) => sum + s.availableBalance, 0),
    [sellerBalances]
  );

  const filteredSellerBalances = useMemo(() => {
    const q = sellerSearch.trim().toLowerCase();
    if (!q) return sellerBalances;
    return sellerBalances.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q)
    );
  }, [sellerBalances, sellerSearch]);

  const formatDate = (value) => {
    if (!value) return "—";
    try {
      const ms =
        typeof value?.toMillis === "function"
          ? value.toMillis()
          : value?.seconds
            ? value.seconds * 1000
            : Date.parse(value);
      if (!ms || Number.isNaN(ms)) return "—";
      return new Date(ms).toLocaleString([], {
        dateStyle: "medium",
        timeStyle: "short",
      });
    } catch {
      return "—";
    }
  };

  // Admin approves buyer confirmation → order marked, ready for seller payout
  const handleApproveConfirmation = async (item) => {
    if (!item?.id || confirmActionId) return;
    setConfirmMsg("");
    setConfirmActionId(item.id);

    try {
      // 1. Mark confirmation reviewed
      await updateDoc(doc(db, "deliveryConfirmations", item.id), {
        status: "approved",
        approvedAt: serverTimestamp(),
        approvedBy: firebaseUser?.uid || null,
        approvedByEmail: firebaseUser?.email || null,
        updatedAt: serverTimestamp(),
      });

      // 2. Update order if we have orderId
      if (item.orderId) {
        try {
          await updateDoc(doc(db, "orders", String(item.orderId)), {
            buyerConfirmedDelivery: true,
            adminApprovedDelivery: true,
            adminApprovedDeliveryAt: serverTimestamp(),
            payoutEligible: true,
            updatedAt: serverTimestamp(),
          });
        } catch (err) {
          console.warn("Order update optional:", err?.message);
        }
      }

      // 3. If seller has pending withdrawals, leave them for Withdrawals page
      //    but set a note flag on confirmation
      setConfirmMsg(
        "Delivery approved. Order is payout-eligible. Review seller withdrawal under Withdrawals."
      );
    } catch (error) {
      console.error("Approve confirmation error:", error);
      setConfirmMsg(
        error?.message || "Could not approve this confirmation."
      );
    } finally {
      setConfirmActionId(null);
    }
  };

  const handleDismissConfirmation = async (item) => {
    if (!item?.id || confirmActionId) return;
    setConfirmMsg("");
    setConfirmActionId(item.id);
    try {
      await updateDoc(doc(db, "deliveryConfirmations", item.id), {
        status: "dismissed",
        dismissedAt: serverTimestamp(),
        dismissedBy: firebaseUser?.uid || null,
        updatedAt: serverTimestamp(),
      });
      setConfirmMsg("Confirmation dismissed.");
    } catch (error) {
      setConfirmMsg(error?.message || "Could not dismiss.");
    } finally {
      setConfirmActionId(null);
    }
  };

  // =========================================================
  // ADMIN API HELPERS
  // =========================================================
  const getAdminToken = async () => {
    if (!firebaseUser) throw new Error("You are not signed in.");
    return await firebaseUser.getIdToken(true);
  };

  const adminApiRequest = async (endpoint, body = {}) => {
    const token = await getAdminToken();
    let response;
    try {
      response = await fetch(`${BACKEND_URL}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
    } catch {
      throw new Error(
        "Could not connect to the CampusMart server. Check Render backend."
      );
    }

    const rawText = await response.text();
    let data = {};
    try {
      data = rawText ? JSON.parse(rawText) : {};
    } catch {
      data = {};
    }

    if (!response.ok) {
      const serverMessage =
        data?.error || data?.message || rawText?.trim();
      if (response.status === 404) {
        throw new Error(
          "Endpoint not found. Deploy the updated backend to Render."
        );
      }
      if (response.status === 401) {
        throw new Error(
          serverMessage || "Session invalid. Sign in again."
        );
      }
      if (response.status === 403) {
        throw new Error(
          serverMessage || "You do not have administrator permission."
        );
      }
      throw new Error(
        serverMessage || `Server request failed (${response.status}).`
      );
    }
    return data;
  };

  // Ticker handlers
  const handlePublishTicker = async () => {
    setTickerStatus("");
    const msg = tickerMessage.trim();
    if (!msg) {
      setTickerStatus("Enter a message for the ticker.");
      return;
    }
    if (msg.length > 500) {
      setTickerStatus("Ticker message cannot exceed 500 characters.");
      return;
    }
    const normalizedEmail = tickerEmail.trim().toLowerCase();
    if (tickerMode === "single" && !normalizedEmail) {
      setTickerStatus("Enter the account email.");
      return;
    }
    try {
      setTickerSaving(true);
      if (tickerMode === "single") setTickerTargetLoading(true);
      const payload = { mode: tickerMode, message: msg };
      if (tickerMode === "single") payload.email = normalizedEmail;
      const data = await adminApiRequest("/admin/publish-ticker", payload);
      if (tickerMode === "all") {
        setTickerActive(true);
        setTickerStatus("News ticker is now live for all buyers and sellers.");
      } else {
        setTickerStatus(
          `Private ticker sent to ${data?.email || normalizedEmail}.`
        );
        setTickerEmail("");
      }
    } catch (error) {
      setTickerStatus(error?.message || "Could not publish ticker.");
    } finally {
      setTickerSaving(false);
      setTickerTargetLoading(false);
    }
  };

  const handleClearTicker = async () => {
    setTickerStatus("");
    try {
      setTickerSaving(true);
      await adminApiRequest("/admin/clear-ticker", { mode: "all" });
      setTickerActive(false);
      setTickerStatus("Global news ticker cleared.");
    } catch (error) {
      setTickerStatus(error?.message || "Could not clear global ticker.");
    } finally {
      setTickerSaving(false);
    }
  };

  const handleClearPrivateTicker = async () => {
    setTickerStatus("");
    const email = tickerEmail.trim().toLowerCase();
    if (!email) {
      setTickerStatus("Enter the account email whose ticker you want to clear.");
      return;
    }
    try {
      setTickerSaving(true);
      setTickerTargetLoading(true);
      await adminApiRequest("/admin/clear-ticker", {
        mode: "single",
        email,
      });
      setTickerStatus(`Private ticker cleared for ${email}.`);
      setTickerEmail("");
    } catch (error) {
      setTickerStatus(error?.message || "Could not clear private ticker.");
    } finally {
      setTickerSaving(false);
      setTickerTargetLoading(false);
    }
  };

  const handleSendFeaturePush = async () => {
    setFeatureStatus("");
    const title = featureTitle.trim() || "New on CampusMart";
    const body = featureBody.trim();
    if (!body) {
      setFeatureStatus("Enter a message about the new feature.");
      return;
    }
    try {
      setFeatureSending(true);
      const data = await adminApiRequest("/admin/notify-feature", {
        title,
        body,
      });
      setFeatureStatus(
        `Push sent to ${data.sent || 0} device(s)${
          data.failed ? ` (${data.failed} failed)` : ""
        }.`
      );
      setFeatureTitle("");
      setFeatureBody("");
    } catch (error) {
      setFeatureStatus(error?.message || "Could not send feature push.");
    } finally {
      setFeatureSending(false);
    }
  };

  const handleSendAnnouncement = async (e) => {
    e.preventDefault();
    setAnnError("");
    setAnnSuccess("");
    if (!annTitle.trim() || !annBody.trim()) {
      setAnnError("Title and message are required.");
      return;
    }
    if (annMode === "single" && !annEmail.trim()) {
      setAnnError("Enter the recipient email.");
      return;
    }
    try {
      setAnnSending(true);
      const token = await firebaseUser.getIdToken(true);
      const res = await fetch(`${BACKEND_URL}/send-announcement-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: annTitle.trim(),
          body: annBody.trim(),
          mode: annMode,
          email:
            annMode === "single"
              ? annEmail.trim().toLowerCase()
              : undefined,
          showBanner,
        }),
      });
      const rawText = await res.text();
      let data = {};
      try {
        data = rawText ? JSON.parse(rawText) : {};
      } catch {
        data = {};
      }
      if (!res.ok) {
        throw new Error(
          data?.error || data?.message || rawText || `Send failed (${res.status})`
        );
      }
      if (annMode === "single") {
        setAnnSuccess(
          `Email sent to ${annEmail.trim()}${
            showBanner ? " · In-app banner activated" : ""
          }`
        );
      } else {
        setAnnSuccess(
          `Emails sent: ${data.sent || 0}${
            data.failed ? ` (${data.failed} failed)` : ""
          }${showBanner ? " · Banner activated" : ""}`
        );
      }
      setAnnTitle("");
      setAnnBody("");
      setAnnEmail("");
    } catch (error) {
      setAnnError(error?.message || "Could not send announcement.");
    } finally {
      setAnnSending(false);
    }
  };

  const handleClearBanner = async () => {
    setAnnError("");
    setAnnSuccess("");
    try {
      const token = await firebaseUser.getIdToken(true);
      const res = await fetch(`${BACKEND_URL}/clear-live-banner`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });
      const rawText = await res.text();
      let data = {};
      try {
        data = rawText ? JSON.parse(rawText) : {};
      } catch {
        data = {};
      }
      if (!res.ok) {
        throw new Error(
          data?.error || data?.message || rawText || `Failed (${res.status})`
        );
      }
      setAnnSuccess("In-app banner cleared.");
    } catch (error) {
      setAnnError(error?.message || "Could not clear banner.");
    }
  };

  const handleResetAllTransactions = async () => {
    setIsResetting(true);
    setShowResetConfirm(false);
    try {
      const ordersSnap = await getDocs(collection(db, "orders"));
      await Promise.all(ordersSnap.docs.map((d) => deleteDoc(d.ref)));

      try {
        const earningsSnap = await getDocs(collection(db, "earnings"));
        await Promise.all(earningsSnap.docs.map((d) => deleteDoc(d.ref)));
      } catch {
        /* optional */
      }

      try {
        const feesSnap = await getDocs(collection(db, "platformFees"));
        await Promise.all(feesSnap.docs.map((d) => deleteDoc(d.ref)));
      } catch {
        /* optional */
      }

      const usersSnap = await getDocs(collection(db, "users"));
      await Promise.all(
        usersSnap.docs.map(async (userDoc) => {
          const data = userDoc.data() || {};
          if (
            data.availableBalance !== undefined ||
            data.totalEarnings !== undefined ||
            data.role === "seller" ||
            data.isSeller === true ||
            data.hasStore === true
          ) {
            await updateDoc(userDoc.ref, {
              availableBalance: 0,
              totalEarnings: 0,
              totalSalesGross: 0,
              totalPlatformFees: 0,
            });
          }
        })
      );

      setShowSuccessModal(true);
    } catch (error) {
      alert(
        "Reset failed.\n\nError: " + (error?.message || "Unknown error")
      );
    } finally {
      setIsResetting(false);
    }
  };

  // =========================================================
  // MENU
  // =========================================================
  const menuItems = [
    { label: "Overview", icon: FiGrid, path: "/admin-dashboard" },
    { label: "Users", icon: FiUsers, path: "/admin/users" },
    { label: "Products", icon: FiPackage, path: "/admin/products" },
    { label: "Orders", icon: FiShoppingBag, path: "/admin/orders" },
    {
      label: "Withdrawals",
      icon: FiCreditCard,
      path: "/admin/withdrawals",
      badge: pendingWithdrawals,
    },
    {
      label: "Fees",
      icon: FiDollarSign,
      path: "/admin/fees",
    },
    {
      label: "Payments",
      icon: FiTrendingUp,
      path: "/admin/payments",
    },
    {
      label: "Support",
      icon: FiMessageCircle,
      path: "/admin/support-message",
      badge: unreadSupportCount,
    },
  ];

  const isActive = (path) => {
    if (path === "/admin-dashboard") {
      return (
        location.pathname === "/admin-dashboard" ||
        location.pathname === "/admin"
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

  if (loading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-10 h-10 mx-auto rounded-full border-4 border-green-100 border-t-green-600 animate-spin" />
          <p className="text-sm text-gray-500 mt-4">Loading admin…</p>
        </div>
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-gray-50 p-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-8 max-w-md text-center shadow-sm">
          <div className="w-14 h-14 mx-auto rounded-full bg-red-50 text-red-500 flex items-center justify-center mb-4">
            <FiShield size={26} />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Access denied</h1>
          <p className="text-sm text-gray-500 mt-2">
            This area is for CampusMart administrators only.
          </p>
          <button
            type="button"
            onClick={() => navigate("/")}
            className="mt-6 h-11 px-5 rounded-xl bg-[#008236] text-white text-sm font-semibold"
          >
            Go home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] w-full bg-gray-50 text-gray-800 font-sans overflow-hidden flex flex-col">
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
          w-[280px] bg-[#008236] text-white flex flex-col h-[100dvh]
          shadow-2xl lg:shadow-none transition-transform duration-300
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        <div className="relative px-5 pt-5 pb-4">
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden absolute top-3 right-3 w-9 h-9 rounded-lg hover:bg-white/10 flex items-center justify-center"
          >
            <FiX size={20} />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#006f2e] flex items-center justify-center border border-white/10 font-black">
              CM
            </div>
            <div>
              <h1 className="text-xl font-extrabold leading-none">
                Campus<span className="text-green-300">Mart</span>
              </h1>
              <p className="text-[10px] text-green-100 mt-1">Admin panel</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-2 overflow-y-auto space-y-1">
          {menuItems.map(({ label, icon: Icon, path, badge }) => {
            const active = isActive(path);
            return (
              <button
                key={label}
                type="button"
                onClick={() => handleNavigation(path)}
                className={`
                  w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-left
                  ${
                    active
                      ? "bg-white text-[#008236] font-semibold"
                      : "text-white hover:bg-white/10"
                  }
                `}
              >
                <Icon size={18} className="shrink-0" />
                <span className="flex-1 text-sm">{label}</span>
                {badge > 0 && (
                  <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                    {badge > 99 ? "99+" : badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="px-3 pb-4">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-white hover:bg-white/10"
          >
            <FiLogOut size={18} />
            <span className="text-sm">Logout</span>
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <div className="min-w-0 flex flex-col h-[100dvh] w-full lg:ml-[280px] lg:w-[calc(100%-280px)]">
        <header className="min-h-[64px] bg-[#007233] text-white flex items-center px-3 sm:px-6 gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden w-10 h-10 rounded-lg hover:bg-white/10 flex items-center justify-center"
          >
            <FiMenu size={22} />
          </button>
          <div>
            <p className="text-sm font-semibold">Overview</p>
            <p className="text-[11px] text-green-100">
              CampusMart control center
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {pendingConfirmations.length > 0 && (
              <span className="hidden sm:inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-white/15 text-xs font-semibold">
                <FiCheckCircle size={14} />
                {pendingConfirmations.length} delivery to review
              </span>
            )}
            <div className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center">
              <FiUser size={18} />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-3 sm:px-6 py-5 space-y-6">
          {/* STATS */}
          <section className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            <StatCard
              label="Users"
              value={totalUsers}
              icon={FiUsers}
              color="text-blue-600"
              bg="bg-blue-50"
            />
            <StatCard
              label="Products"
              value={totalProducts}
              icon={FiPackage}
              color="text-purple-600"
              bg="bg-purple-50"
            />
            <StatCard
              label="Orders"
              value={totalOrders}
              icon={FiShoppingBag}
              color="text-orange-600"
              bg="bg-orange-50"
            />
            <StatCard
              label="Revenue"
              value={formatNaira(totalRevenue)}
              icon={FiTrendingUp}
              color="text-emerald-600"
              bg="bg-emerald-50"
            />
            <StatCard
              label="Platform fees"
              value={formatNaira(platformFees)}
              icon={FiDollarSign}
              color="text-[#008236]"
              bg="bg-green-50"
            />
            <StatCard
              label="Pending withdrawals"
              value={pendingWithdrawals}
              icon={FiClock}
              color="text-amber-600"
              bg="bg-amber-50"
            />
            <StatCard
              label="Seller balances"
              value={formatNaira(totalSellerBalance)}
              icon={FiCreditCard}
              color="text-teal-600"
              bg="bg-teal-50"
              active={activeView === "sellerBalances"}
              onClick={() =>
                setActiveView((v) =>
                  v === "sellerBalances" ? "overview" : "sellerBalances"
                )
              }
            />
            <StatCard
              label="Delivery confirmations"
              value={pendingConfirmations.length}
              icon={FiCheckCircle}
              color="text-green-600"
              bg="bg-green-50"
              active={activeView === "confirmations"}
              onClick={() =>
                setActiveView((v) =>
                  v === "confirmations" ? "overview" : "confirmations"
                )
              }
            />
            <StatCard
              label="News ticker"
              value={tickerActive ? "Live" : "Off"}
              icon={FiVolume2}
              color="text-indigo-600"
              bg="bg-indigo-50"
              active={activeView === "ticker"}
              onClick={() =>
                setActiveView((v) => (v === "ticker" ? "overview" : "ticker"))
              }
            />
            <StatCard
              label="Feature push"
              value="Send"
              icon={FiSend}
              color="text-pink-600"
              bg="bg-pink-50"
              active={activeView === "push"}
              onClick={() =>
                setActiveView((v) => (v === "push" ? "overview" : "push"))
              }
            />
            <StatCard
              label="Email announcements"
              value={bannerActive ? "Banner active" : "Send"}
              icon={FiMail}
              color="text-amber-600"
              bg="bg-amber-50"
              active={activeView === "announcements"}
              onClick={() =>
                setActiveView((v) =>
                  v === "announcements" ? "overview" : "announcements"
                )
              }
            />
          </section>

          {activeView === "sellerBalances" && (
            <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100 shrink-0">
                    <FiCreditCard size={20} />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-gray-900">
                      Seller balances
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {sellerBalances.length} seller
                      {sellerBalances.length === 1 ? "" : "s"} · Total{" "}
                      {formatNaira(totalSellerBalance)} available
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveView("overview")}
                  className="h-10 px-4 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 shrink-0"
                >
                  Back to overview
                </button>
              </div>

              <div className="p-4 sm:p-5 border-b border-gray-100">
                <div className="relative">
                  <FiUsers className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={sellerSearch}
                    onChange={(e) => setSellerSearch(e.target.value)}
                    placeholder="Search sellers by name, email, or ID..."
                    className="w-full h-11 pl-10 pr-4 rounded-xl border border-gray-200 bg-gray-50 text-sm outline-none focus:border-[#008236] focus:bg-white focus:ring-2 focus:ring-green-50"
                  />
                </div>
              </div>

              {filteredSellerBalances.length === 0 ? (
                <div className="p-10 text-center text-sm text-gray-500">
                  No sellers found.
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {filteredSellerBalances.map((s) => (
                    <div
                      key={s.id}
                      className="p-4 sm:p-5 flex items-center justify-between gap-4"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">
                          {s.name}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {s.email}
                        </p>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          ID: {s.id}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-[#008236]">
                          {formatNaira(s.availableBalance)}
                        </p>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          Lifetime {formatNaira(s.totalEarnings)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {activeView === "confirmations" && (
            <>

          {/* =====================================================
              1. BUYER DELIVERY CONFIRMATIONS
          ====================================================== */}
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-xl bg-green-50 text-[#008236] flex items-center justify-center border border-green-100 shrink-0">
                  <FiCheckCircle size={20} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-gray-900">
                    Buyer delivery confirmations
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5 max-w-xl">
                    When a buyer taps <strong>Approve goods delivered</strong>,
                    it appears here. Approve so the order is payout-eligible,
                    then process the seller&apos;s withdrawal.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveView("overview")}
                  className="h-9 px-3 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 shrink-0"
                >
                  Back to overview
                </button>
                <span
                  className={`px-3 py-1 rounded-full text-[11px] font-semibold ${
                    pendingConfirmations.length > 0
                      ? "bg-amber-50 text-amber-700 border border-amber-100"
                      : "bg-gray-50 text-gray-500 border border-gray-100"
                  }`}
                >
                  {pendingConfirmations.length} pending
                </span>
                <button
                  type="button"
                  onClick={() => handleNavigation("/admin/withdrawals")}
                  className="h-9 px-3 rounded-xl text-xs font-semibold bg-[#008236] text-white hover:bg-[#006f2e] inline-flex items-center gap-1.5"
                >
                  <FiCreditCard size={14} />
                  Withdrawals
                </button>
              </div>
            </div>

            {confirmMsg && (
              <div className="mx-5 mt-4 rounded-xl border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-800 flex gap-2">
                <FiCheckCircle size={16} className="shrink-0 mt-0.5" />
                {confirmMsg}
              </div>
            )}

            <div className="p-5">
              {confirmationsLoading ? (
                <div className="py-10 text-center">
                  <div className="w-9 h-9 mx-auto rounded-full border-4 border-green-100 border-t-green-600 animate-spin" />
                  <p className="text-sm text-gray-500 mt-3">Loading…</p>
                </div>
              ) : confirmations.length === 0 ? (
                <div className="py-10 text-center">
                  <div className="w-12 h-12 mx-auto rounded-full bg-green-50 text-[#008236] flex items-center justify-center mb-3">
                    <FiCheck size={22} />
                  </div>
                  <p className="text-sm font-semibold text-gray-800">
                    No delivery confirmations yet
                  </p>
                  <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                    They appear after a buyer confirms they received goods on
                    an order the seller marked as delivered.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {confirmations.map((item) => {
                    const status = String(
                      item.status || "pending_admin_review"
                    ).toLowerCase();
                    const isPending =
                      status === "pending_admin_review" ||
                      status === "pending" ||
                      status === "awaiting_admin";
                    const isApproved = status === "approved";
                    const busy = confirmActionId === item.id;

                    return (
                      <div
                        key={item.id}
                        className={`
                          rounded-xl border p-4
                          ${
                            isPending
                              ? "border-amber-100 bg-amber-50/40"
                              : isApproved
                                ? "border-green-100 bg-green-50/30"
                                : "border-gray-100 bg-gray-50/40"
                          }
                        `}
                      >
                        <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                          <div className="flex-1 min-w-0 space-y-1.5">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-bold text-gray-900">
                                Order{" "}
                                {item.orderNumber ||
                                  (item.orderId
                                    ? `#${String(item.orderId).slice(0, 8)}`
                                    : "—")}
                              </span>
                              <span
                                className={`
                                  px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide
                                  ${
                                    isPending
                                      ? "bg-amber-100 text-amber-800"
                                      : isApproved
                                        ? "bg-green-100 text-[#006f2e]"
                                        : "bg-gray-200 text-gray-600"
                                  }
                                `}
                              >
                                {isPending
                                  ? "Needs review"
                                  : isApproved
                                    ? "Approved · payout eligible"
                                    : status}
                              </span>
                            </div>

                            <p className="text-sm text-gray-700">
                              <span className="text-gray-500">Buyer:</span>{" "}
                              {item.buyerName || "—"}
                              {item.sellerName ? (
                                <>
                                  {" "}
                                  ·{" "}
                                  <span className="text-gray-500">
                                    Seller:
                                  </span>{" "}
                                  {item.sellerName}
                                </>
                              ) : null}
                            </p>

                            <p className="text-sm font-semibold text-[#008236]">
                              {formatNaira(item.total || item.amount)}
                            </p>

                            <p className="text-[11px] text-gray-400">
                              Confirmed {formatDate(item.createdAt)}
                              {item.sellerId
                                ? ` · Seller ID ${String(item.sellerId).slice(0, 8)}…`
                                : ""}
                            </p>

                            {item.message && (
                              <p className="text-xs text-gray-500 mt-1">
                                {item.message}
                              </p>
                            )}
                          </div>

                          <div className="flex flex-wrap lg:flex-col gap-2 shrink-0">
                            {isPending && (
                              <>
                                <button
                                  type="button"
                                  disabled={busy}
                                  onClick={() =>
                                    handleApproveConfirmation(item)
                                  }
                                  className="h-10 px-4 rounded-xl bg-[#008236] hover:bg-[#006f2e] text-white text-xs font-semibold disabled:opacity-50 inline-flex items-center justify-center gap-1.5"
                                >
                                  {busy ? (
                                    <FiRefreshCw
                                      className="animate-spin"
                                      size={14}
                                    />
                                  ) : (
                                    <FiCheckCircle size={14} />
                                  )}
                                  Approve for payout
                                </button>
                                <button
                                  type="button"
                                  disabled={busy}
                                  onClick={() =>
                                    handleDismissConfirmation(item)
                                  }
                                  className="h-10 px-4 rounded-xl border border-gray-200 text-gray-600 text-xs font-semibold hover:bg-white disabled:opacity-50"
                                >
                                  Dismiss
                                </button>
                              </>
                            )}
                            {isApproved && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleNavigation("/admin/withdrawals")
                                }
                                className="h-10 px-4 rounded-xl border border-green-200 text-[#008236] text-xs font-semibold hover:bg-green-50 inline-flex items-center gap-1.5"
                              >
                                <FiExternalLink size={14} />
                                Open withdrawals
                              </button>
                            )}
                            {item.orderId && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleNavigation("/admin/orders")
                                }
                                className="h-10 px-4 rounded-xl border border-gray-200 text-gray-600 text-xs font-semibold hover:bg-white"
                              >
                                View orders
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

            </>
          )}

          {activeView === "ticker" && (
          <section className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 shadow-sm">
            <div className="flex items-start justify-between gap-3 mb-5">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-xl bg-green-50 text-[#008236] flex items-center justify-center border border-green-100 shrink-0">
                  <FiVolume2 size={20} />
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-sm font-bold text-gray-900">
                      In-app news ticker
                    </h2>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                        tickerActive
                          ? "bg-green-50 text-[#008236] border border-green-100"
                          : "bg-gray-50 text-gray-500 border border-gray-100"
                      }`}
                    >
                      {tickerActive ? "Live" : "Off"}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Sliding message for buyers &amp; sellers (not email).
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveView("overview")}
                className="h-9 px-3 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 shrink-0"
              >
                Back to overview
              </button>
            </div>

            {tickerStatus && (
              <div
                className={`mb-4 rounded-xl border px-4 py-3 text-sm flex gap-2 ${
                  tickerStatus.toLowerCase().includes("success") ||
                  tickerStatus.toLowerCase().includes("live") ||
                  tickerStatus.toLowerCase().includes("cleared") ||
                  tickerStatus.toLowerCase().includes("sent")
                    ? "bg-green-50 border-green-100 text-green-700"
                    : "bg-red-50 border-red-100 text-red-600"
                }`}
              >
                <FiAlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{tickerStatus}</span>
              </div>
            )}

            <div className="flex flex-wrap gap-2 mb-4">
              {[
                { id: "all", label: "Everyone" },
                { id: "single", label: "One account" },
              ].map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => {
                    setTickerMode(o.id);
                    setTickerStatus("");
                  }}
                  className={`h-10 px-4 rounded-xl text-sm font-semibold transition ${
                    tickerMode === o.id
                      ? "bg-[#008236] text-white"
                      : "bg-green-50 text-[#008236] border border-green-100"
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>

            {tickerMode === "single" && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Account email
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
                      setTickerEmail(e.target.value);
                      setTickerStatus("");
                    }}
                    placeholder="student@example.com"
                    className="w-full h-11 pl-10 pr-4 rounded-xl border border-gray-200 bg-gray-50 text-sm outline-none focus:border-[#008236] focus:bg-white"
                  />
                </div>
              </div>
            )}

            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Message
            </label>
            <textarea
              rows={3}
              value={tickerMessage}
              onChange={(e) => {
                setTickerMessage(e.target.value);
                setTickerStatus("");
              }}
              maxLength={500}
              placeholder="e.g. Welcome to CampusMart 2.0 — shop safe on campus!"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm outline-none focus:border-[#008236] focus:bg-white resize-none"
            />
            <div className="mt-1 text-right text-[10px] text-gray-400">
              {tickerMessage.length}/500
            </div>

            <div className="mt-4 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                disabled={tickerSaving || tickerTargetLoading}
                onClick={handlePublishTicker}
                className="h-11 px-5 rounded-xl bg-[#008236] hover:bg-[#006f2e] disabled:opacity-60 text-white text-sm font-semibold inline-flex items-center justify-center gap-2"
              >
                {tickerSaving ? (
                  <>
                    <FiRefreshCw className="animate-spin" size={16} />
                    Sending…
                  </>
                ) : (
                  <>
                    <FiSend size={16} />
                    {tickerMode === "single"
                      ? "Send to account"
                      : "Publish for everyone"}
                  </>
                )}
              </button>
              {tickerMode === "all" && (
                <button
                  type="button"
                  disabled={tickerSaving || !tickerActive}
                  onClick={handleClearTicker}
                  className="h-11 px-5 rounded-xl border border-green-200 text-[#008236] text-sm font-semibold hover:bg-green-50 disabled:opacity-50"
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
                  onClick={handleClearPrivateTicker}
                  className="h-11 px-5 rounded-xl border border-red-200 text-red-600 text-sm font-semibold hover:bg-red-50 disabled:opacity-50"
                >
                  Clear user&apos;s ticker
                </button>
              )}
            </div>
          </section>
          )}

          {activeView === "push" && (
          <section className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 shadow-sm">
            <div className="flex items-start justify-between gap-3 mb-5">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-xl bg-green-50 text-[#008236] flex items-center justify-center border border-green-100 shrink-0">
                  <FiVolume2 size={20} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-gray-900">
                    New feature push
                  </h2>
                  <p className="text-xs text-gray-500 mt-1 max-w-md">
                    Phone/desktop notification for users who enabled push.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveView("overview")}
                className="h-9 px-3 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 shrink-0"
              >
                Back to overview
              </button>
            </div>

            {featureStatus && (
              <div
                className={`mb-4 rounded-xl border px-4 py-3 text-sm flex gap-2 ${
                  featureStatus.toLowerCase().includes("sent")
                    ? "bg-green-50 border-green-100 text-green-700"
                    : "bg-red-50 border-red-100 text-red-600"
                }`}
              >
                {featureStatus.toLowerCase().includes("sent") ? (
                  <FiCheckCircle size={16} className="shrink-0 mt-0.5" />
                ) : (
                  <FiAlertCircle size={16} className="shrink-0 mt-0.5" />
                )}
                <span>{featureStatus}</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Title
                </label>
                <input
                  type="text"
                  value={featureTitle}
                  onChange={(e) => {
                    setFeatureTitle(e.target.value);
                    setFeatureStatus("");
                  }}
                  placeholder="e.g. New on CampusMart"
                  className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-gray-50 text-sm outline-none focus:border-[#008236] focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Message
                </label>
                <textarea
                  rows={3}
                  value={featureBody}
                  onChange={(e) => {
                    setFeatureBody(e.target.value);
                    setFeatureStatus("");
                  }}
                  maxLength={180}
                  placeholder="e.g. Check out this new feature on CampusMart."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm outline-none focus:border-[#008236] focus:bg-white resize-none"
                />
                <div className="mt-1 text-right text-[10px] text-gray-400">
                  {featureBody.length}/180
                </div>
              </div>
              <button
                type="button"
                disabled={featureSending}
                onClick={handleSendFeaturePush}
                className="h-11 px-5 rounded-xl bg-[#008236] hover:bg-[#006f2e] disabled:opacity-60 text-white text-sm font-semibold inline-flex items-center justify-center gap-2"
              >
                {featureSending ? (
                  <>
                    <FiRefreshCw className="animate-spin" size={16} />
                    Sending push…
                  </>
                ) : (
                  <>
                    <FiSend size={16} />
                    Send feature notification
                  </>
                )}
              </button>
            </div>
          </section>
          )}

          {activeView === "announcements" && (
          <section className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-5">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-xl bg-green-50 text-[#008236] flex items-center justify-center border border-green-100 shrink-0">
                  <FiMail size={20} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-gray-900">
                    Email announcements
                  </h2>
                  <p className="text-xs text-gray-500 mt-1 max-w-md">
                    Email every registered user or one specific address.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 self-start">
                <button
                  type="button"
                  onClick={() => setActiveView("overview")}
                  className="h-9 px-3 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 shrink-0"
                >
                  Back to overview
                </button>
                <div
                  className={`px-3 py-1.5 rounded-full text-[11px] font-semibold ${
                    bannerActive
                      ? "bg-green-50 text-[#008236] border border-green-100"
                      : "bg-gray-50 text-gray-500 border border-gray-100"
                  }`}
                >
                  Email banner: {bannerActive ? "Active" : "Off"}
                </div>
              </div>
            </div>

            {annError && (
              <div className="mb-4 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600 flex gap-2">
                <FiAlertCircle className="shrink-0 mt-0.5" size={16} />
                {annError}
              </div>
            )}
            {annSuccess && (
              <div className="mb-4 rounded-xl bg-green-50 border border-green-100 px-4 py-3 text-sm text-green-700 flex gap-2">
                <FiCheckCircle className="shrink-0 mt-0.5" size={16} />
                {annSuccess}
              </div>
            )}

            <form onSubmit={handleSendAnnouncement} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Recipients
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: "all", label: "All registered emails" },
                    { id: "single", label: "One specific email" },
                  ].map((o) => (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => setAnnMode(o.id)}
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
                    onChange={(e) => setAnnEmail(e.target.value)}
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
                  onChange={(e) => setAnnTitle(e.target.value)}
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
                  onChange={(e) => setAnnBody(e.target.value)}
                  placeholder="Write the announcement…"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm outline-none focus:border-[#008236] focus:bg-white resize-none"
                />
              </div>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showBanner}
                  onChange={(e) => setShowBanner(e.target.checked)}
                  className="mt-1 accent-green-600"
                />
                <span className="text-sm text-gray-600">
                  Also set email-reminder banner for logged-in users.
                </span>
              </label>

              <div className="flex flex-col sm:flex-row gap-3 pt-1">
                <button
                  type="submit"
                  disabled={annSending}
                  className="h-11 px-5 rounded-xl bg-[#008236] hover:bg-[#006f2e] disabled:opacity-60 text-white text-sm font-semibold inline-flex items-center justify-center gap-2"
                >
                  {annSending ? (
                    <>
                      <FiRefreshCw className="animate-spin" size={16} />
                      Sending…
                    </>
                  ) : (
                    <>
                      <FiSend size={16} />
                      Send email announcement
                    </>
                  )}
                </button>
                {bannerActive && (
                  <button
                    type="button"
                    onClick={handleClearBanner}
                    className="h-11 px-5 rounded-xl border border-green-200 text-[#008236] text-sm font-semibold hover:bg-green-50"
                  >
                    Clear email banner
                  </button>
                )}
              </div>
            </form>
          </section>
          )}

          {activeView === "overview" && (
            <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-10 text-center">
              <p className="text-sm text-gray-500">
                Select a card above to view its details.
              </p>
            </div>
          )}

          {/* =====================================================
              5. DANGER ZONE — RESET
          ====================================================== */}
          <section className="bg-white rounded-2xl border border-green-200 p-5 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl bg-green-50 text-[#008236] flex items-center justify-center shrink-0">
                <FiRefreshCw size={22} />
              </div>
              <div className="flex-1">
                <h2 className="text-sm font-bold text-[#008236]">
                  Reset transactions
                </h2>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  Permanently deletes <strong>all buyer orders</strong>,{" "}
                  <strong>seller earnings</strong>, and resets balances to ₦0.
                  Testing only.
                </p>
                <button
                  type="button"
                  disabled={isResetting}
                  onClick={() => setShowResetConfirm(true)}
                  className={`mt-4 h-11 px-5 rounded-xl text-sm font-semibold flex items-center gap-2 ${
                    isResetting
                      ? "bg-green-300 text-white cursor-not-allowed"
                      : "bg-[#008236] hover:bg-[#006f2e] text-white"
                  }`}
                >
                  {isResetting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Resetting…
                    </>
                  ) : (
                    <>
                      <FiTrash2 size={16} />
                      Reset all orders &amp; earnings
                    </>
                  )}
                </button>
              </div>
            </div>
          </section>
        </main>
      </div>

      {/* RESET CONFIRM */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => !isResetting && setShowResetConfirm(false)}
          />
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-[#008236] px-6 py-5 flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center">
                <FiAlertTriangle size={22} className="text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Confirm reset</h3>
                <p className="text-xs text-green-100 mt-0.5">
                  This cannot be undone
                </p>
              </div>
            </div>
            <div className="px-6 py-5 text-sm text-gray-600">
              <p>You will permanently delete:</p>
              <ul className="mt-3 space-y-2 text-gray-700">
                <li>• All buyer orders</li>
                <li>• All seller earnings records</li>
                <li>• Reset every seller balance to ₦0</li>
              </ul>
            </div>
            <div className="px-6 pb-6 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                disabled={isResetting}
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 h-11 rounded-xl border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isResetting}
                onClick={handleResetAllTransactions}
                className="flex-1 h-11 rounded-xl bg-[#008236] hover:bg-[#006f2e] text-white text-sm font-semibold flex items-center justify-center gap-2"
              >
                {isResetting ? "Resetting…" : "Yes, reset everything"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showSuccessModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowSuccessModal(false)}
          />
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-[#008236] px-6 py-6 flex flex-col items-center text-center">
              <FiCheckCircle size={36} className="text-white mb-3" />
              <h3 className="text-xl font-bold text-white">Reset complete</h3>
              <p className="text-sm text-green-100 mt-1">
                Transaction data cleared
              </p>
            </div>
            <div className="px-6 py-5 text-sm text-gray-600 text-center">
              Orders, earnings and balances have been reset.
            </div>
            <div className="px-6 pb-6">
              <button
                type="button"
                onClick={() => setShowSuccessModal(false)}
                className="w-full h-11 rounded-xl bg-[#008236] text-white text-sm font-semibold"
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

function StatCard({ label, value, icon: Icon, color, bg, onClick, active }) {
  const Wrapper = onClick ? "button" : "div";
  return (
    <Wrapper
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={`bg-white rounded-2xl border p-4 sm:p-5 shadow-sm text-left w-full ${
        active
          ? "border-[#008236] ring-2 ring-green-100"
          : "border-gray-100"
      } ${onClick ? "hover:border-green-200 hover:shadow-md transition cursor-pointer" : ""}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[11px] sm:text-xs text-gray-500 font-medium truncate">
            {label}
          </p>
          <p className="text-lg sm:text-2xl font-bold text-gray-900 mt-1.5 truncate">
            {value}
          </p>
        </div>
        <div
          className={`w-10 h-10 rounded-xl ${bg} ${color} flex items-center justify-center shrink-0`}
        >
          <Icon size={18} />
        </div>
      </div>
    </Wrapper>
  );
}

export default AdminDashboard;