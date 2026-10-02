import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";

import { collection, onSnapshot, doc, getDoc } from "firebase/firestore";

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
  FiEye,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiMessageCircle,
  FiArrowLeft,
  FiChevronRight,
  FiBell,
  FiPhone,
  FiMapPin,
} from "react-icons/fi";

import { db } from "../../context/firebase";
import { useAuth } from "../../context/AuthContext";

// ================= ORDER HELPERS (self-contained) =================
const toMillis = (value) => {
  if (!value) return 0;
  if (typeof value.toMillis === "function") return value.toMillis();
  if (value.seconds) return value.seconds * 1000;
  if (typeof value === "number") return value;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const formatOrderDate = (value) => {
  const ms = toMillis(value);
  if (!ms) return "—";
  return new Date(ms).toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const formatMoney = (value) => {
  const n = Number(String(value ?? 0).replace(/[₦,]/g, ""));
  return `₦${(Number.isFinite(n) ? n : 0).toLocaleString("en-NG")}`;
};

const SUCCESS_WORDS = ["successful", "success", "delivered", "completed"];

const rawStatus = (order) => String(order?.status || "pending").toLowerCase();

const isCancelled = (order) =>
  ["cancelled", "canceled"].includes(rawStatus(order));

const isBuyerConfirmed = (order) => order?.buyerConfirmed === true;

const isSellerConfirmed = (order) =>
  order?.sellerConfirmed === true ||
  (SUCCESS_WORDS.includes(rawStatus(order)) && order?.buyerConfirmed !== true);

const normalizeOrderStatus = (order) => {
  if (isCancelled(order)) return "cancelled";
  if (
    order?.sellerConfirmed === true ||
    order?.buyerConfirmed === true ||
    SUCCESS_WORDS.includes(rawStatus(order))
  ) {
    return "successful";
  }
  return "pending";
};

const STATUS_STYLES = {
  pending: {
    label: "Pending",
    className: "bg-amber-50 text-amber-700 border border-amber-100",
  },
  successful: {
    label: "Successful",
    className: "bg-[#008236] text-white",
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-red-50 text-red-600 border border-red-100",
  },
};

const getItemPrice = (item) =>
  Number(String(item?.price ?? 0).replace(/[₦,]/g, "")) || 0;

const getOrderItems = (order) => {
  if (Array.isArray(order?.items) && order.items.length > 0) return order.items;
  return [
    {
      name: order?.productName || order?.name || "Product",
      quantity: order?.quantity || 1,
      price: order?.price || order?.total,
      image: order?.image,
    },
  ];
};

const getOrderTotal = (order) => {
  const direct = order?.total || order?.amount || order?.amountPaid;
  if (direct) return Number(String(direct).replace(/[₦,]/g, "")) || 0;
  return getOrderItems(order).reduce(
    (sum, item) => sum + getItemPrice(item) * (item.quantity || 1),
    0
  );
};

const getBuyerName = (order) =>
  order?.customerName ||
  order?.customer?.fullName ||
  order?.customer?.name ||
  order?.buyerName ||
  "Buyer";

const getOrderNumber = (order) =>
  order?.orderNumber
    ? String(order.orderNumber).startsWith("#")
      ? order.orderNumber
      : `#${order.orderNumber}`
    : `#${String(order?.id || "").slice(0, 8).toUpperCase()}`;

const getPaymentInfo = (order) => {
  const method = String(order?.paymentMethod || "").toLowerCase();
  const isCash = ["cash", "pod", "pay_on_delivery", "pay on delivery"].includes(
    method
  );
  const ps = String(order?.paymentStatus || "").toLowerCase();
  const paid = ps
    ? ["paid", "success", "successful"].includes(ps)
    : !isCash; // card/Paystack orders without a flag are treated as paid

  return {
    method: isCash ? "Pay on Delivery" : "Paystack",
    paid,
    label: isCash ? "Pay on Delivery" : paid ? "Paid" : "Awaiting payment",
  };
};

const SEEN_KEY = "cm_admin_orders_seen_at";

// First visit: start counting from "now" so old orders don't all show as new.
const readAdminSeenAt = () => {
  try {
    const saved = Number(localStorage.getItem(SEEN_KEY));
    if (saved > 0) return saved;
    const now = Date.now();
    localStorage.setItem(SEEN_KEY, String(now));
    return now;
  } catch {
    return Date.now();
  }
};

// Each seller has their own "seen" time. A seller card turns red while that
// seller has orders newer than the last time the admin opened that seller.
const SELLER_SEEN_KEY = "cm_admin_seller_orders_seen"; // { [sellerId]: ms }
const SELLER_INIT_KEY = "cm_admin_seller_orders_init"; // first visit (ms)

// First visit: only orders placed from now on count as new.
const readSellerInit = () => {
  try {
    const saved = Number(localStorage.getItem(SELLER_INIT_KEY));
    if (saved > 0) return saved;
    const now = Date.now();
    localStorage.setItem(SELLER_INIT_KEY, String(now));
    return now;
  } catch {
    return Date.now();
  }
};

const readSellerSeen = () => {
  try {
    const raw = JSON.parse(localStorage.getItem(SELLER_SEEN_KEY) || "{}");
    return raw && typeof raw === "object" ? raw : {};
  } catch {
    return {};
  }
};

const isSellerUser = (u = {}) =>
  u.isSeller === true ||
  u.hasStore === true ||
  String(u.role || "").toLowerCase() === "seller" ||
  (Array.isArray(u.roles) && u.roles.includes("seller"));

const ADMIN_EMAIL = "campusmart1234@gmail.com";
const UNASSIGNED = "unassigned";

const STATUS_ICONS = {
  pending: FiClock,
  successful: FiCheckCircle,
  cancelled: FiXCircle,
};

const STATUS_FILTERS = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "successful", label: "Successful" },
  { id: "cancelled", label: "Cancelled" },
];

function TimelineRow({ done, title, detail }) {
  return (
    <div className="flex items-start gap-3">
      <div
        className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
          done ? "bg-[#008236] text-white" : "bg-gray-100 text-gray-300"
        }`}
      >
        <FiCheckCircle size={12} />
      </div>
      <div>
        <p
          className={`text-sm font-semibold ${
            done ? "text-gray-800" : "text-gray-400"
          }`}
        >
          {title}
        </p>
        {detail ? <p className="text-xs text-gray-500">{detail}</p> : null}
      </div>
    </div>
  );
}

function AdminOrders() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { firebaseUser } = useAuth();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);

  const [orders, setOrders] = useState([]);
  const [ordersLoaded, setOrdersLoaded] = useState(false);
  const [unreadSupportCount, setUnreadSupportCount] = useState(0);

  // seller list view
  const [sellerSearch, setSellerSearch] = useState("");
  // seller detail view
  const [orderSearch, setOrderSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState(null);

  const [sellerNames, setSellerNames] = useState({});
  const [selectedSellerBalance, setSelectedSellerBalance] = useState(0);
  const requestedSellers = useRef(new Set());

  const [toast, setToast] = useState(null);

  // The seller currently open comes from the URL (?seller=ID) so the browser
  // back button returns to the seller list.
  const selectedSellerId = searchParams.get("seller");

  // New-order notification (sidebar badge)
  const [seenAt, setSeenAt] = useState(readAdminSeenAt);
  const newOrdersCount = useMemo(
    () =>
      orders.filter(
        (o) =>
          toMillis(o.createdAt) > seenAt &&
          normalizeOrderStatus(o) !== "cancelled"
      ).length,
    [orders, seenAt]
  );
  // Per-seller "new order" tracking
  const [sellerInit] = useState(readSellerInit);
  const [sellerSeen, setSellerSeen] = useState(readSellerSeen);
  const sellerSeenRef = useRef(sellerSeen);
  // Sellers registered on the platform (so every seller has a stat card,
  // even before their first order).
  const [sellerUsers, setSellerUsers] = useState([]);
  // Orders newer than this are tagged "New" inside the open seller.
  const [viewBaseline, setViewBaseline] = useState(0);

  const markSellerSeen = (id) => {
    if (!id) return;
    const next = { ...sellerSeenRef.current, [id]: Date.now() };
    sellerSeenRef.current = next;
    setSellerSeen(next);
    try {
      localStorage.setItem(SELLER_SEEN_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  };

  // Opening a seller: remember what was new, then mark that seller as seen.
  useEffect(() => {
    if (!selectedSellerId) return;
    setViewBaseline(sellerSeenRef.current[selectedSellerId] ?? sellerInit);
    markSellerSeen(selectedSellerId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSellerId]);

  // While a seller is open, orders that arrive don't turn their card red.
  useEffect(() => {
    if (!selectedSellerId || !ordersLoaded) return;
    markSellerSeen(selectedSellerId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orders]);

  // =========================================================
  // ACCESS CONTROL (supports dual-role: buyer/seller + admin)
  // =========================================================
  useEffect(() => {
    if (!firebaseUser) {
      setAllowed(false);
      setLoading(false);
      return;
    }

    const email = (firebaseUser.email || "").toLowerCase();
    const isMainAdmin = email === ADMIN_EMAIL.toLowerCase();

    if (isMainAdmin) {
      setAllowed(true);
      setLoading(false);
      return;
    }

    const checkAccess = async () => {
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
      } catch (error) {
        console.error("Could not check admin role:", error);
        setAllowed(false);
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
  }, [firebaseUser]);

  // =========================================================
  // LIVE ORDERS + SUPPORT BADGE + NEW ORDER TOAST
  // =========================================================
  useEffect(() => {
    if (!allowed) return;

    let firstSnapshot = true;

    const unsubOrders = onSnapshot(
      collection(db, "orders"),
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        list.sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));
        setOrders(list);
        setOrdersLoaded(true);

        // Pop a toast when a brand-new order arrives while the page is open.
        if (!firstSnapshot) {
          snap.docChanges().forEach((change) => {
            if (change.type !== "added" || change.doc.metadata.hasPendingWrites) {
              return;
            }
            const data = change.doc.data() || {};
            setToast({
              id: change.doc.id,
              sellerId: data.sellerId || UNASSIGNED,
              text: `New order ${getOrderNumber({
                id: change.doc.id,
                ...data,
              })} · ${formatMoney(getOrderTotal(data))}`,
              sub: data.sellerName ? `For ${data.sellerName}` : "New order placed",
            });
          });
        }
        firstSnapshot = false;
      },
      (error) => {
        console.error("Admin orders listener error:", error);
        setOrdersLoaded(true);
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

    const unsubUsers = onSnapshot(
      collection(db, "users"),
      (snap) => {
        const list = [];
        snap.forEach((d) => {
          const u = d.data() || {};
          if (!isSellerUser(u)) return;
          list.push({
            id: d.id,
            name:
              u.storeName ||
              u.businessName ||
              u.shopName ||
              u.fullName ||
              u.name ||
              u.displayName ||
              u.profile?.fullName ||
              "",
          });
        });
        setSellerUsers(list);
      },
      (error) => {
        console.warn("Could not load sellers list:", error);
      }
    );

    return () => {
      unsubOrders();
      unsubSupport();
      unsubUsers();
    };
  }, [allowed]);

  // Toast auto-dismiss
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 7000);
    return () => clearTimeout(t);
  }, [toast]);

  // The admin is on the Orders page, so clear the sidebar badge after a moment.
  useEffect(() => {
    if (!allowed || newOrdersCount === 0) return;
    const t = setTimeout(() => {
      const now = Date.now();
      try {
        localStorage.setItem(SEEN_KEY, String(now));
      } catch {
        /* ignore */
      }
      setSeenAt(now);
    }, 4000);
    return () => clearTimeout(t);
  }, [allowed, newOrdersCount]);

  // Look up seller names for orders that don't store sellerName.
  useEffect(() => {
    if (orders.length === 0) return;

    const namedIds = new Set(
      orders.filter((o) => o.sellerName && o.sellerId).map((o) => o.sellerId)
    );

    const missing = [
      ...new Set(orders.map((o) => o.sellerId).filter(Boolean)),
    ].filter((id) => !namedIds.has(id) && !requestedSellers.current.has(id));

    if (missing.length === 0) return;

    missing.forEach((id) => requestedSellers.current.add(id));

    missing.forEach(async (id) => {
      try {
        const snap = await getDoc(doc(db, "users", id));
        if (!snap.exists()) return;
        const data = snap.data() || {};
        const name =
          data.storeName ||
          data.businessName ||
          data.fullName ||
          data.name ||
          data.displayName;
        if (name) setSellerNames((prev) => ({ ...prev, [id]: name }));
      } catch (error) {
        console.error("Could not load seller name:", error);
      }
    });
  }, [orders]);

  // =========================================================
  // SELLER BALANCE — same source/method as AdminDashboard
  // Reads users/{sellerId}.availableBalance
  // =========================================================
  useEffect(() => {
    if (!selectedSellerId || selectedSellerId === UNASSIGNED) {
      setSelectedSellerBalance(0);
      return;
    }

    let cancelled = false;

    const loadSellerBalance = async () => {
      try {
        const snap = await getDoc(doc(db, "users", selectedSellerId));

        if (cancelled) return;

        if (!snap.exists()) {
          setSelectedSellerBalance(0);
          return;
        }

        const data = snap.data() || {};
        setSelectedSellerBalance(Number(data.availableBalance) || 0);
      } catch (error) {
        console.error("Could not load seller balance:", error);
        if (!cancelled) setSelectedSellerBalance(0);
      }
    };

    loadSellerBalance();

    return () => {
      cancelled = true;
    };
  }, [selectedSellerId]);

  // =========================================================
  // GROUP ORDERS BY SELLER
  // =========================================================
  // Tag shown on an order inside the seller that is currently open.
  const isNewOrder = (order) =>
    toMillis(order.createdAt) > viewBaseline &&
    normalizeOrderStatus(order) !== "cancelled";

  const sellerGroups = useMemo(() => {
    const map = new Map();

    // Every registered seller gets a stat card, even with zero orders.
    sellerUsers.forEach((u) => {
      map.set(u.id, { id: u.id, orders: [], userName: u.name });
    });

    orders.forEach((order) => {
      const id = order.sellerId || UNASSIGNED;
      if (!map.has(id)) map.set(id, { id, orders: [] });
      map.get(id).orders.push(order);
    });

    return Array.from(map.values())
      .map((group) => {
        const named = group.orders.find((o) => o.sellerName)?.sellerName;
        const name =
          named ||
          sellerNames[group.id] ||
          group.userName ||
          (group.id === UNASSIGNED
            ? "Unassigned orders"
            : `Seller ${String(group.id).slice(0, 6)}`);

        const seenAt = sellerSeen[group.id] ?? sellerInit;

        let pending = 0;
        let successful = 0;
        let cancelled = 0;
        let successfulValue = 0;
        let newCount = 0;

        group.orders.forEach((o) => {
          const s = normalizeOrderStatus(o);
          if (s === "pending") pending += 1;
          if (s === "successful") {
            successful += 1;
            successfulValue += getOrderTotal(o);
          }
          if (s === "cancelled") cancelled += 1;
          if (s !== "cancelled" && toMillis(o.createdAt) > seenAt) {
            newCount += 1;
          }
        });

        return {
          ...group,
          name,
          total: group.orders.length,
          pending,
          successful,
          cancelled,
          successfulValue,
          newCount,
          latest: toMillis(group.orders[0]?.createdAt),
        };
      })
      .sort((a, b) => {
        if (b.newCount !== a.newCount) return b.newCount - a.newCount;
        if (b.pending !== a.pending) return b.pending - a.pending;
        if (b.latest !== a.latest) return b.latest - a.latest;
        return a.name.localeCompare(b.name);
      });
  }, [orders, sellerNames, sellerUsers, sellerSeen, sellerInit]);

  const filteredSellers = useMemo(() => {
    const q = sellerSearch.trim().toLowerCase();
    if (!q) return sellerGroups;
    return sellerGroups.filter(
      (g) =>
        g.name.toLowerCase().includes(q) ||
        String(g.id).toLowerCase().includes(q)
    );
  }, [sellerGroups, sellerSearch]);

  const overall = useMemo(() => {
    const s = {
      sellers: sellerGroups.length,
      total: orders.length,
      pending: 0,
      newOrders: 0,
    };
    orders.forEach((o) => {
      if (normalizeOrderStatus(o) === "pending") s.pending += 1;
    });
    sellerGroups.forEach((g) => {
      s.newOrders += g.newCount;
    });
    return s;
  }, [orders, sellerGroups]);

  const selectedSeller = useMemo(
    () => sellerGroups.find((g) => g.id === selectedSellerId) || null,
    [sellerGroups, selectedSellerId]
  );

  const sellerOrders = useMemo(() => {
    if (!selectedSeller) return [];
    const q = orderSearch.trim().toLowerCase();

    return selectedSeller.orders.filter((order) => {
      const status = normalizeOrderStatus(order);
      if (statusFilter !== "all" && status !== statusFilter) return false;
      if (!q) return true;

      const itemNames = getOrderItems(order)
        .map((i) => i?.name || i?.productName || i?.title || "")
        .join(" ");

      const haystack = [
        order.id,
        order.orderNumber,
        order.orderId,
        order.buyerId,
        order.buyerName,
        order.customerName,
        order.customer?.fullName,
        order.customer?.name,
        order.customer?.email,
        order.customer?.phone,
        order.paystackReference,
        itemNames,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [selectedSeller, orderSearch, statusFilter]);

  // Keep the open modal in sync with live updates
  const liveSelected = useMemo(() => {
    if (!selectedOrder) return null;
    return orders.find((o) => o.id === selectedOrder.id) || selectedOrder;
  }, [orders, selectedOrder]);

  // =========================================================
  // NAVIGATION
  // =========================================================
  const menuItems = [
    { label: "Overview", icon: FiGrid, path: "/admin-dashboard" },
    { label: "Users", icon: FiUsers, path: "/admin/users" },
    { label: "Products", icon: FiPackage, path: "/admin/products" },
    {
      label: "Orders",
      icon: FiShoppingBag,
      path: "/admin/orders",
      badge: newOrdersCount,
      pulse: true,
    },
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

  const openSeller = (id) => {
    setOrderSearch("");
    setStatusFilter("all");
    setSearchParams({ seller: id });
  };

  const closeSeller = () => {
    setOrderSearch("");
    setStatusFilter("all");
    setSearchParams({});
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
            onClick={() => navigate("/")}
            className="mt-5 h-11 px-6 rounded-xl bg-[#008236] text-white text-sm font-semibold"
          >
            Go Home
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

      {/* NEW ORDER TOAST */}
      {toast && (
        <button
          type="button"
          onClick={() => {
            openSeller(toast.sellerId);
            setToast(null);
          }}
          className="fixed top-4 right-4 z-[110] max-w-[320px] text-left bg-white rounded-2xl shadow-2xl border border-green-100 p-4 flex items-start gap-3 hover:bg-green-50/40"
        >
          <span className="w-9 h-9 rounded-full bg-red-500 text-white flex items-center justify-center shrink-0">
            <FiBell size={17} />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-bold text-gray-800">
              {toast.text}
            </span>
            <span className="block text-xs text-gray-500 mt-0.5">
              {toast.sub} · tap to view
            </span>
          </span>
        </button>
      )}

      {/* SIDEBAR */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-[291px] bg-[#008236] text-white flex flex-col h-screen
          transition-transform duration-300
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
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
                Campus<span className="text-green-300">Mart</span>
              </h1>
              <p className="text-[10px] text-green-100 mt-1">Admin Panel</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 py-3 overflow-y-auto flex flex-col gap-1">
          {menuItems.map(({ label, icon: Icon, path, badge, pulse }) => {
            const active = isActive(path);
            return (
              <button
                key={label}
                type="button"
                onClick={() => handleNavigation(path)}
                className={`
                  w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-left transition
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
                  <span
                    className={`min-w-[20px] h-[20px] px-1.5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center ${
                      pulse ? "animate-pulse" : ""
                    }`}
                  >
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
            className="lg:hidden relative w-10 h-10 rounded-lg hover:bg-white/10 flex items-center justify-center"
          >
            <FiMenu size={22} />
            {newOrdersCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-[#007233]" />
            )}
          </button>
          <div>
            <p className="text-sm font-semibold">
              {selectedSeller ? selectedSeller.name : "Orders"}
            </p>
            <p className="text-[11px] text-green-100">
              {selectedSeller
                ? "Orders placed with this seller"
                : "Every seller has their own stats. Red means new orders."}
            </p>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
          {!ordersLoaded ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
              <div className="w-10 h-10 mx-auto rounded-full border-4 border-green-100 border-t-green-600 animate-spin" />
              <p className="mt-4 text-sm text-gray-500">Loading orders...</p>
            </div>
          ) : !selectedSellerId ? (
            /* =====================================================
               VIEW 1 — SELLER LIST
            ===================================================== */
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                {[
                  { label: "Sellers", value: overall.sellers },
                  { label: "Total orders", value: overall.total },
                  { label: "Pending orders", value: overall.pending },
                  {
                    label: "New orders",
                    value: overall.newOrders,
                    alert: overall.newOrders > 0,
                  },
                ].map((s) => (
                  <div
                    key={s.label}
                    className={`rounded-2xl border p-4 ${
                      s.alert
                        ? "bg-red-50 border-red-200 shadow-[0_8px_24px_rgba(239,68,68,0.35)]"
                        : "bg-white border-gray-200 shadow-[0_8px_24px_rgba(0,0,0,0.18)]"
                    }`}
                  >
                    <p
                      className={`text-xs ${
                        s.alert ? "text-red-500" : "text-gray-500"
                      }`}
                    >
                      {s.label}
                    </p>
                    <p
                      className={`text-2xl font-bold mt-1 ${
                        s.alert ? "text-red-600" : "text-[#008236]"
                      }`}
                    >
                      {s.value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 shadow-sm">
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={sellerSearch}
                    onChange={(e) => setSellerSearch(e.target.value)}
                    placeholder="Search sellers..."
                    className="w-full h-11 pl-10 pr-4 rounded-xl border border-gray-200 bg-gray-50 text-sm outline-none focus:border-[#008236] focus:bg-white focus:ring-2 focus:ring-green-50"
                  />
                </div>
              </div>

              {filteredSellers.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-sm text-gray-500">
                  {orders.length === 0
                    ? "No orders have been placed yet."
                    : "No sellers match your search."}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filteredSellers.map((seller) => {
                    const hasNew = seller.newCount > 0;

                    return (
                      <button
                        key={seller.id}
                        type="button"
                        onClick={() => openSeller(seller.id)}
                        className={`relative text-left rounded-2xl border p-5 transition hover:-translate-y-0.5 ${
                          hasNew
                            ? "bg-red-50/70 border-red-300 ring-2 ring-red-200 shadow-[0_10px_30px_rgba(239,68,68,0.45)] hover:shadow-[0_14px_36px_rgba(239,68,68,0.55)]"
                            : "bg-white border-gray-200 shadow-[0_10px_30px_rgba(0,0,0,0.20)] hover:border-green-300 hover:shadow-[0_14px_36px_rgba(0,0,0,0.28)]"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`relative w-11 h-11 rounded-xl flex items-center justify-center font-bold text-lg shrink-0 ${
                              hasNew
                                ? "bg-red-500 text-white"
                                : "bg-green-50 text-[#008236]"
                            }`}
                          >
                            {seller.name.charAt(0).toUpperCase()}
                            {hasNew && (
                              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-600 ring-2 ring-white animate-pulse" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-gray-800 truncate">
                              {seller.name}
                            </p>
                            <p className="text-xs text-gray-400">
                              {seller.orders.length > 0
                                ? `Last order ${formatOrderDate(
                                    seller.orders[0]?.createdAt
                                  )}`
                                : "No orders yet"}
                            </p>
                          </div>
                          {hasNew && (
                            <span className="min-w-[22px] h-[22px] px-1.5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                              {seller.newCount} new
                            </span>
                          )}
                          <FiChevronRight className="text-gray-300 shrink-0" />
                        </div>

                        <div className="grid grid-cols-5 gap-2 mt-4 text-center">
                          {[
                            { label: "Orders", value: seller.total },
                            {
                              label: "New",
                              value: seller.newCount,
                              alert: hasNew,
                            },
                            { label: "Pending", value: seller.pending },
                            { label: "Done", value: seller.successful },
                            { label: "Cancelled", value: seller.cancelled },
                          ].map((s) => (
                            <div
                              key={s.label}
                              className={`rounded-xl py-2 ${
                                s.alert
                                  ? "bg-red-500 text-white animate-pulse"
                                  : "bg-gray-50"
                              }`}
                            >
                              <p
                                className={`text-base font-bold ${
                                  s.alert ? "text-white" : "text-gray-800"
                                }`}
                              >
                                {s.value}
                              </p>
                              <p
                                className={`text-[10px] ${
                                  s.alert ? "text-red-100" : "text-gray-400"
                                }`}
                              >
                                {s.label}
                              </p>
                            </div>
                          ))}
                        </div>

                        <p className="text-xs text-gray-500 mt-3">
                          Successful sales:{" "}
                          <span className="font-bold text-gray-800">
                            {formatMoney(seller.successfulValue)}
                          </span>
                        </p>
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          ) : !selectedSeller ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
              <p className="text-sm text-gray-500">
                No orders found for this seller.
              </p>
              <button
                type="button"
                onClick={closeSeller}
                className="mt-4 h-10 px-4 rounded-xl bg-[#008236] text-white text-sm font-semibold"
              >
                Back to sellers
              </button>
            </div>
          ) : (
            /* =====================================================
               VIEW 2 — ORDERS UNDER ONE SELLER
            ===================================================== */
            <>
              <button
                type="button"
                onClick={closeSeller}
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#008236] hover:underline"
              >
                <FiArrowLeft size={16} />
                All sellers
              </button>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-green-50 text-[#008236] flex items-center justify-center font-bold text-xl shrink-0">
                    {selectedSeller.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-lg font-bold text-gray-800 truncate">
                      {selectedSeller.name}
                    </h2>
                    {selectedSeller.id !== UNASSIGNED && (
                      <p className="text-[11px] text-gray-400 truncate">
                        ID: {selectedSeller.id}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-4">
                  {[
                    { label: "Orders", value: selectedSeller.total },
                    { label: "Pending", value: selectedSeller.pending },
                    { label: "Successful", value: selectedSeller.successful },
                    { label: "Cancelled", value: selectedSeller.cancelled },
                    {
                      label: "Balance",
                      value: formatMoney(selectedSellerBalance),
                    },
                  ].map((s) => (
                    <div key={s.label} className="rounded-xl bg-gray-50 p-3">
                      <p className="text-[11px] text-gray-400">{s.label}</p>
                      <p className="text-lg font-bold text-gray-800 mt-0.5">
                        {s.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 shadow-sm space-y-4">
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    placeholder="Search order, buyer, phone, product, reference..."
                    className="w-full h-11 pl-10 pr-4 rounded-xl border border-gray-200 bg-gray-50 text-sm outline-none focus:border-[#008236] focus:bg-white focus:ring-2 focus:ring-green-50"
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  {STATUS_FILTERS.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setStatusFilter(item.id)}
                      className={`
                        h-10 px-4 rounded-xl text-sm font-semibold transition
                        ${
                          statusFilter === item.id
                            ? "bg-[#008236] text-white"
                            : "bg-green-50 text-[#008236] border border-green-100 hover:bg-green-100"
                        }
                      `}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {sellerOrders.length === 0 ? (
                  <div className="p-10 text-center text-sm text-gray-500">
                    No orders match your filters.
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {sellerOrders.map((order) => {
                      const status = normalizeOrderStatus(order);
                      const badge = STATUS_STYLES[status];
                      const StatusIcon = STATUS_ICONS[status];
                      const payment = getPaymentInfo(order);
                      const items = getOrderItems(order);
                      const fresh = isNewOrder(order);

                      return (
                        <div
                          key={order.id}
                          className={`p-4 sm:p-5 ${fresh ? "bg-green-50/50" : ""}`}
                        >
                          <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-sm font-bold text-[#008236]">
                                  {getOrderNumber(order)}
                                </p>
                                <span
                                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold ${badge.className}`}
                                >
                                  <StatusIcon size={12} />
                                  {badge.label}
                                </span>
                                <span
                                  className={`px-2 py-1 rounded-full text-[10px] font-semibold ${
                                    payment.paid
                                      ? "bg-blue-50 text-blue-700 border border-blue-100"
                                      : "bg-gray-100 text-gray-500"
                                  }`}
                                >
                                  {payment.label}
                                </span>
                                {fresh && (
                                  <span className="px-2 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold">
                                    New
                                  </span>
                                )}
                              </div>

                              <p className="text-sm font-semibold text-gray-800 mt-2">
                                {getBuyerName(order)}
                              </p>
                              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 mt-1">
                                {(order.customer?.phone || order.phone) && (
                                  <span className="inline-flex items-center gap-1">
                                    <FiPhone size={11} />
                                    {order.customer?.phone || order.phone}
                                  </span>
                                )}
                                {(order.customer?.address ||
                                  order.address ||
                                  order.customer?.campus) && (
                                  <span className="inline-flex items-center gap-1">
                                    <FiMapPin size={11} />
                                    {[
                                      order.customer?.address || order.address,
                                      order.customer?.campus || order.campus,
                                    ]
                                      .filter(Boolean)
                                      .join(" · ")}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-400 mt-1">
                                {formatOrderDate(order.createdAt)}
                                {order.paystackReference
                                  ? ` · Ref: ${order.paystackReference}`
                                  : ""}
                              </p>

                              <div className="mt-3 space-y-1.5">
                                {items.map((item, idx) => (
                                  <div
                                    key={idx}
                                    className="flex items-center justify-between gap-3 text-sm"
                                  >
                                    <span className="text-gray-700 truncate">
                                      {item.name || item.productName || "Item"}{" "}
                                      <span className="text-gray-400">
                                        ×{item.quantity || 1}
                                      </span>
                                    </span>
                                    <span className="font-medium text-gray-800 shrink-0">
                                      {formatMoney(
                                        getItemPrice(item) * (item.quantity || 1)
                                      )}
                                    </span>
                                  </div>
                                ))}
                              </div>

                              {status !== "cancelled" && (
                                <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-semibold">
                                  <span
                                    className={`px-2 py-0.5 rounded-md ${
                                      isSellerConfirmed(order)
                                        ? "bg-green-100 text-green-700"
                                        : "bg-gray-100 text-gray-400"
                                    }`}
                                  >
                                    Seller {isSellerConfirmed(order) ? "✓" : "—"}
                                  </span>
                                  <span
                                    className={`px-2 py-0.5 rounded-md ${
                                      isBuyerConfirmed(order)
                                        ? "bg-green-100 text-green-700"
                                        : "bg-gray-100 text-gray-400"
                                    }`}
                                  >
                                    Buyer {isBuyerConfirmed(order) ? "✓" : "—"}
                                  </span>
                                </div>
                              )}
                            </div>

                            <div className="flex items-center gap-3 lg:flex-col lg:items-end shrink-0">
                              <p className="text-lg font-bold text-gray-900">
                                {formatMoney(getOrderTotal(order))}
                              </p>
                              <button
                                type="button"
                                onClick={() => setSelectedOrder(order)}
                                className="h-9 px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 bg-green-50 text-[#008236] border border-green-100 hover:bg-green-100"
                              >
                                <FiEye size={14} />
                                Full details
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </main>
      </div>

      {/* ORDER DETAILS MODAL */}
      {liveSelected && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setSelectedOrder(null)}
          />
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden max-h-[85vh] overflow-y-auto">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-gray-800">
                  Order details
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {getOrderNumber(liveSelected)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="w-9 h-9 rounded-lg text-gray-400 hover:bg-gray-100 flex items-center justify-center"
              >
                <FiX size={20} />
              </button>
            </div>

            <div className="p-5 space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-400">Order status</p>
                  <p className="font-semibold capitalize mt-0.5">
                    {normalizeOrderStatus(liveSelected)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Payment</p>
                  <p className="font-semibold mt-0.5">
                    {getPaymentInfo(liveSelected).method} ·{" "}
                    {getPaymentInfo(liveSelected).label}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Amount</p>
                  <p className="font-semibold mt-0.5">
                    {formatMoney(getOrderTotal(liveSelected))}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Buyer</p>
                  <p className="font-semibold mt-0.5">
                    {getBuyerName(liveSelected) === "Buyer"
                      ? liveSelected.buyerId || "—"
                      : getBuyerName(liveSelected)}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-gray-400">Seller</p>
                  <p className="font-semibold mt-0.5">
                    {liveSelected.sellerName ||
                      sellerNames[liveSelected.sellerId] ||
                      liveSelected.sellerId ||
                      "—"}
                  </p>
                </div>
              </div>

              {/* FULL STATUS TIMELINE */}
              <div className="rounded-xl border border-gray-100 p-4 space-y-3">
                <p className="text-xs text-gray-400 uppercase tracking-wide">
                  Status timeline
                </p>
                <TimelineRow
                  done
                  title="Order placed"
                  detail={formatOrderDate(liveSelected.createdAt)}
                />
                <TimelineRow
                  done={getPaymentInfo(liveSelected).paid}
                  title={
                    getPaymentInfo(liveSelected).method === "Pay on Delivery"
                      ? "Pay on delivery"
                      : "Payment received"
                  }
                  detail={
                    liveSelected.paystackReference
                      ? `Ref: ${liveSelected.paystackReference}`
                      : ""
                  }
                />
                <TimelineRow
                  done={isSellerConfirmed(liveSelected)}
                  title="Seller marked successful"
                  detail={
                    liveSelected.sellerConfirmedAt
                      ? formatOrderDate(liveSelected.sellerConfirmedAt)
                      : ""
                  }
                />
                <TimelineRow
                  done={isBuyerConfirmed(liveSelected)}
                  title="Buyer approved delivery"
                  detail={
                    liveSelected.buyerConfirmedAt
                      ? formatOrderDate(liveSelected.buyerConfirmedAt)
                      : ""
                  }
                />
                {normalizeOrderStatus(liveSelected) === "cancelled" && (
                  <p className="text-xs font-semibold text-red-500">
                    This order was cancelled.
                  </p>
                )}
              </div>

              {liveSelected.customer && (
                <div className="rounded-xl bg-gray-50 p-3 text-xs text-gray-600 space-y-1">
                  <p>
                    <span className="font-semibold">Phone:</span>{" "}
                    {liveSelected.customer.phone || "—"}
                  </p>
                  <p>
                    <span className="font-semibold">Campus:</span>{" "}
                    {liveSelected.customer.campus || "—"}
                  </p>
                  <p>
                    <span className="font-semibold">Address:</span>{" "}
                    {liveSelected.customer.address || "—"}
                  </p>
                </div>
              )}

              <div>
                <p className="text-xs text-gray-400 mb-2">Items</p>
                <div className="space-y-2">
                  {getOrderItems(liveSelected).map((item, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between gap-3 text-sm border border-gray-100 rounded-xl px-3 py-2"
                    >
                      <span className="truncate">
                        {item.name || item.productName || "Item"} ×
                        {item.quantity || 1}
                      </span>
                      <span className="font-semibold shrink-0">
                        {formatMoney(getItemPrice(item) * (item.quantity || 1))}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <p className="text-xs text-gray-400">
                Created: {formatOrderDate(liveSelected.createdAt)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminOrders;
