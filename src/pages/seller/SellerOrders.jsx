import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import {
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  doc,
  updateDoc,
  writeBatch,
  serverTimestamp,
} from "firebase/firestore";

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
  FiSearch,
  FiClock,
  FiCheckCircle,
  FiXCircle,
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

function SellerOrders({ unreadMessages = 0, profile = {} }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { firebaseUser } = useAuth();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [updatingId, setUpdatingId] = useState(null);
  // Orders that arrived unseen; they keep a "New" tag while this page is open.
  const [freshIds, setFreshIds] = useState(() => new Set());

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
    profile?.avatar ||
    firebaseUser?.photoURL ||
    null;

  // ---------------------------------------------------------------
  // LIVE ORDERS for this seller
  // ---------------------------------------------------------------
  useEffect(() => {
    if (!firebaseUser?.uid) {
      setOrders([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const ordersRef = collection(db, "orders");
    let unsubFallback = null;

    const applyDocs = (snapshot) => {
      const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));
      setOrders(list);
      setLoading(false);
    };

    // FREE-TIER: cap live listener size
    const unsubscribe = onSnapshot(
      query(
        ordersRef,
        where("sellerId", "==", firebaseUser.uid),
        orderBy("createdAt", "desc"),
        limit(60)
      ),
      applyDocs,
      (error) => {
        console.error("Seller orders listener error:", error);

        // Missing index? Fall back to an unordered query, sorted client-side.
        unsubFallback = onSnapshot(
          query(
            ordersRef,
            where("sellerId", "==", firebaseUser.uid),
            limit(60)
          ),
          applyDocs,
          (err2) => {
            console.error("Seller orders fallback error:", err2);
            setOrders([]);
            setLoading(false);
          }
        );
      }
    );

    return () => {
      unsubscribe();
      if (unsubFallback) unsubFallback();
    };
  }, [firebaseUser?.uid]);

  // ---------------------------------------------------------------
  // NEW ORDER BADGE (red in the sidebar)
  // A "new" order = pending and the seller hasn't opened Orders yet.
  // ---------------------------------------------------------------
  const unseenOrders = useMemo(
    () =>
      orders.filter(
        (o) => normalizeOrderStatus(o) === "pending" && o.sellerSeen !== true
      ),
    [orders]
  );

  const newOrdersCount = unseenOrders.length;

  // While the seller is on this page, keep the "New" tag on fresh orders and
  // mark them as seen after a short delay so the sidebar badge clears.
  useEffect(() => {
    if (unseenOrders.length === 0) return;

    setFreshIds((prev) => {
      const next = new Set(prev);
      unseenOrders.forEach((o) => next.add(o.id));
      return next;
    });

    const timer = setTimeout(async () => {
      try {
        const batch = writeBatch(db);
        unseenOrders.forEach((o) =>
          batch.update(doc(db, "orders", o.id), { sellerSeen: true })
        );
        await batch.commit();
      } catch (error) {
        console.error("Mark orders seen error:", error);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [unseenOrders]);

  const menuItems = useMemo(
    () => [
      { label: "Dashboard", icon: FiGrid, path: "/seller-dashboard" },
      { label: "Products", icon: FiPackage, path: "/seller/products" },
      {
        label: "Orders",
        icon: FiShoppingBag,
        path: "/seller/orders",
        badge: newOrdersCount,
      },
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
    ],
    [newOrdersCount, unreadMessages]
  );

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

  // ---------------------------------------------------------------
  // FILTERING + STATS
  // ---------------------------------------------------------------
  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase();

    return orders.filter((order) => {
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
        order.customerName,
        order.buyerName,
        order.buyerEmail,
        order.productName,
        order.name,
        order.phone,
        order.campus,
        order.address,
        order.customer?.fullName,
        order.customer?.name,
        order.customer?.phone,
        order.customer?.phoneNumber,
        order.customer?.campus,
        order.customer?.address,
        order.customer?.email,
        itemNames,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [orders, search, statusFilter]);

  const stats = useMemo(() => {
    const s = { total: orders.length, pending: 0, successful: 0, cancelled: 0 };
    orders.forEach((o) => {
      s[normalizeOrderStatus(o)] += 1;
    });
    return s;
  }, [orders]);

  const hasSearchOrFilter = search.trim().length > 0 || statusFilter !== "all";

  // ---------------------------------------------------------------
  // SELLER ACTIONS
  // ---------------------------------------------------------------
  const markSuccessful = async (order) => {
    if (!order?.id || updatingId) return;

    const ok = window.confirm(
      "Mark this order as successful? Confirm only after the buyer has received the items."
    );
    if (!ok) return;

    setUpdatingId(order.id);
    try {
      await updateDoc(doc(db, "orders", order.id), {
        status: "successful",
        sellerConfirmed: true,
        sellerConfirmedAt: serverTimestamp(),
        sellerSeen: true,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Mark successful error:", error);
      alert("Could not update order status. Please try again.");
    } finally {
      setUpdatingId(null);
    }
  };

  // Only allowed while the buyer hasn't approved delivery.
  const markPending = async (order) => {
    if (!order?.id || updatingId || isBuyerConfirmed(order)) return;

    setUpdatingId(order.id);
    try {
      await updateDoc(doc(db, "orders", order.id), {
        status: "pending",
        sellerConfirmed: false,
        sellerConfirmedAt: null,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Mark pending error:", error);
      alert("Could not update order status. Please try again.");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="h-[100dvh] w-full bg-gray-50 text-gray-800 font-sans overflow-hidden flex flex-col">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-50
          w-[291px] min-w-[285px] lg:w-[291px] lg:min-w-[250px]
          bg-[#008236] text-white flex flex-col h-[100dvh] overflow-hidden
          shadow-2xl lg:shadow-none transition-transform duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        <div className="relative px-5 pt-19 lg:pt-5 pb-4 flex-shrink-0">
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden absolute top-3 right-3 w-9 h-9 rounded-lg text-white hover:bg-white/10 flex items-center justify-center"
          >
            <FiX size={21} strokeWidth={2.5} />
          </button>
          <div className="flex items-center gap-3 pr-10">
            <div className="w-10 h-10 min-w-[40px] rounded-xl bg-[#006f2e] flex items-center justify-center shadow-lg shadow-black/30 border border-white/10 flex-shrink-0">
              <span className="text-white text-[16px] font-black tracking-tight">
                CM
              </span>
            </div>
            <div>
              <h1 className="text-[25px] font-extrabold tracking-tight leading-none whitespace-nowrap">
                <span className="text-white">Campus</span>
                <span className="text-green-300">Mart 2.0</span>
              </h1>
              <p className="text-[10px] text-green-100 mt-1">
                Sell. Connect. Grow.
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 py-3 overflow-y-auto flex flex-col gap-1">
          {menuItems.map(({ label, icon: Icon, path, badge, new: isNew }) => {
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
                <Icon size={19} className="flex-shrink-0" />
                <span className="flex-1 text-[14px]">{label}</span>
                {badge > 0 && (
                  <span
                    className={`min-w-[21px] h-[21px] px-1.5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center ${
                      label === "Orders" ? "animate-pulse" : ""
                    }`}
                  >
                    {badge > 99 ? "99+" : badge}
                  </span>
                )}
                {isNew && (
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
                      active
                        ? "bg-green-100 text-green-700"
                        : "bg-green-500 text-white"
                    }`}
                  >
                    New
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="px-4 pb-4">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-white hover:bg-white/10"
          >
            <FiLogOut size={19} />
            <span className="text-[14px]">Logout</span>
          </button>
        </div>
      </aside>

      <div className="min-w-0 flex flex-col h-[100dvh] w-full lg:ml-[291px] lg:w-[calc(100%-291px)]">
        <header className="min-h-[70px] bg-[#007233] text-white flex items-center px-3 sm:px-5 lg:px-8 py-3 gap-2 sm:gap-4 flex-shrink-0">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden relative w-10 h-10 rounded-lg hover:bg-white/10 flex items-center justify-center"
          >
            <FiMenu size={24} />
            {newOrdersCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-[#007233]" />
            )}
          </button>

          <div className="flex items-center gap-2">
            <FiShoppingBag size={19} className="text-green-200" />
            <span className="text-sm sm:text-base font-semibold">
              Your Store
            </span>
          </div>

          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            <button
              type="button"
              onClick={() => handleNavigation("/seller/messages")}
              className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full hover:bg-white/10 flex items-center justify-center"
            >
              <FiMessageCircle size={20} />
              {unreadMessages > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[17px] h-[17px] px-1 rounded-full bg-red-500 text-[9px] font-bold flex items-center justify-center">
                  {unreadMessages}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => handleNavigation("/seller/profile")}
              className="flex items-center gap-2 rounded-lg px-1.5 py-1.5 hover:bg-white/10"
            >
              {sellerImage ? (
                <img
                  src={sellerImage}
                  alt={sellerFullName}
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover border-2 border-white/30"
                />
              ) : (
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center font-bold text-sm border-2 border-white/30">
                  {sellerFirstName.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="hidden sm:block text-left">
                <p className="text-xs font-bold truncate max-w-[160px]">
                  {sellerFullName}
                </p>
                <p className="text-[10px] text-green-100">Seller</p>
              </div>
              <FiChevronDown size={16} className="hidden sm:block" />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-3 sm:px-5 lg:px-8 py-5 sm:py-6">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#007233] to-[#008f3f] p-6 sm:p-7 text-white shadow-lg mb-6">
            <div className="pointer-events-none absolute -right-8 -top-10 h-40 w-40 rounded-full bg-white/10" />
            <div className="pointer-events-none absolute -right-2 top-16 h-28 w-28 rounded-full bg-white/10" />
            <div className="relative inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-green-50">
              <span className="h-1.5 w-1.5 rounded-full bg-green-300" />
              Orders
            </div>
            <h1 className="relative mt-3 text-2xl sm:text-3xl font-bold">
              Your Orders, {sellerFirstName}
            </h1>
            <p className="relative mt-2 max-w-xl text-sm text-green-100">
              Mark an order successful once it is delivered. An order also
              becomes successful when the buyer approves the delivery, and
              buyers see every update in My Orders.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
            {[
              { label: "Total", value: stats.total },
              { label: "Pending", value: stats.pending },
              { label: "Successful", value: stats.successful },
              { label: "Cancelled", value: stats.cancelled },
            ].map((s) => (
              <div
                key={s.label}
                className="bg-white rounded-2xl border border-green-100 p-4 shadow-sm"
              >
                <p className="text-xs text-gray-500">{s.label}</p>
                <p className="text-2xl font-bold mt-1 text-[#008236]">
                  {s.value}
                </p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-green-100 p-4 sm:p-5 shadow-sm mb-6 space-y-4">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by buyer, order number, phone, product..."
                className="
                  w-full h-11 pl-10 pr-10 rounded-xl
                  border border-green-100 bg-green-50/40 text-sm
                  outline-none
                  focus:border-[#008236] focus:bg-white focus:ring-2 focus:ring-green-100
                "
              />
              {search.trim() && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <FiX size={16} />
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {STATUS_FILTERS.map((item) => {
                const active = statusFilter === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setStatusFilter(item.id)}
                    className={`
                      h-10 px-4 rounded-xl text-sm font-semibold transition
                      ${
                        active
                          ? "bg-[#008236] text-white shadow-sm shadow-green-700/20"
                          : "bg-green-50 text-[#008236] border border-green-100 hover:bg-green-100"
                      }
                    `}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-green-100 shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-10 text-center">
                <div className="w-10 h-10 mx-auto rounded-full border-4 border-green-100 border-t-green-600 animate-spin" />
                <p className="mt-4 text-sm text-gray-500">Loading orders...</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="p-10 text-center">
                <div className="w-14 h-14 mx-auto rounded-full bg-green-50 text-green-600 flex items-center justify-center mb-3">
                  <FiShoppingBag size={24} />
                </div>
                <p className="font-semibold text-gray-800">No orders found</p>
                <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
                  When a buyer places an order on your product, it will appear
                  here.
                </p>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="p-10 text-center">
                <div className="w-14 h-14 mx-auto rounded-full bg-green-50 text-green-600 flex items-center justify-center mb-3">
                  <FiSearch size={24} />
                </div>
                <p className="font-semibold text-gray-800">
                  No buyer or orders found
                </p>
                <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
                  {hasSearchOrFilter
                    ? "Try a different name, order number, or clear your filters."
                    : "Nothing matches your search."}
                </p>
                {hasSearchOrFilter && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearch("");
                      setStatusFilter("all");
                    }}
                    className="mt-4 h-10 px-4 rounded-xl bg-[#008236] text-white text-sm font-semibold hover:bg-[#006f2e]"
                  >
                    Clear search
                  </button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredOrders.map((order) => {
                  const status = normalizeOrderStatus(order);
                  const badge = STATUS_STYLES[status];
                  const StatusIcon = STATUS_ICONS[status];

                  const items = getOrderItems(order);
                  const buyerName = getBuyerName(order);
                  const total = getOrderTotal(order);
                  const payment = getPaymentInfo(order);

                  const sellerDone = isSellerConfirmed(order);
                  const buyerDone = isBuyerConfirmed(order);
                  const isFresh = freshIds.has(order.id);
                  const cancelled = status === "cancelled";

                  return (
                    <div
                      key={order.id}
                      className={`p-4 sm:p-5 ${isFresh ? "bg-green-50/50" : ""}`}
                    >
                      <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-bold text-[#008236]">
                              {getOrderNumber(order)}
                            </p>
                            <span
                              className={`
                                inline-flex items-center gap-1.5
                                px-2.5 py-1 rounded-full
                                text-[10px] font-semibold
                                ${badge.className}
                              `}
                            >
                              <StatusIcon size={12} />
                              {badge.label}
                            </span>
                            {isFresh && (
                              <span className="px-2 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold">
                                New order
                              </span>
                            )}
                          </div>

                          <p className="text-sm font-semibold text-gray-800 mt-2">
                            {buyerName}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {order.customer?.phone ||
                              order.customer?.phoneNumber ||
                              order.phone ||
                              "—"}
                            {order.customer?.campus || order.campus
                              ? ` · ${order.customer?.campus || order.campus}`
                              : ""}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {formatOrderDate(order.createdAt)}
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

                          {(order.customer?.address || order.address) && (
                            <p className="text-xs text-gray-500 mt-3">
                              Deliver to:{" "}
                              {order.customer?.address || order.address}
                            </p>
                          )}

                          {/* FULL STATUS */}
                          {!cancelled && (
                            <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-semibold">
                              <span className="px-2 py-1 rounded-lg bg-gray-100 text-gray-600">
                                Placed {formatOrderDate(order.createdAt)}
                              </span>
                              <span
                                className={`px-2 py-1 rounded-lg ${
                                  sellerDone
                                    ? "bg-green-100 text-green-700"
                                    : "bg-gray-100 text-gray-400"
                                }`}
                              >
                                {sellerDone
                                  ? "You marked successful"
                                  : "Not marked by you"}
                              </span>
                              <span
                                className={`px-2 py-1 rounded-lg ${
                                  buyerDone
                                    ? "bg-green-100 text-green-700"
                                    : "bg-gray-100 text-gray-400"
                                }`}
                              >
                                {buyerDone
                                  ? "Buyer approved delivery"
                                  : "Buyer hasn't approved yet"}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="lg:text-right shrink-0 space-y-2">
                          <p className="text-lg font-bold text-gray-900">
                            {formatMoney(total)}
                          </p>
                          <p className="text-[11px] text-gray-400 uppercase tracking-wide">
                            {payment.method === "Paystack"
                              ? payment.paid
                                ? "Paid with card"
                                : "Awaiting payment"
                              : "Pay on delivery"}
                          </p>

                          {!cancelled && (
                            <div className="flex flex-wrap lg:justify-end gap-2 pt-1">
                              {sellerDone && !buyerDone && (
                                <button
                                  type="button"
                                  disabled={updatingId === order.id}
                                  onClick={() => markPending(order)}
                                  className="
                                    h-9 px-3 rounded-lg
                                    border border-green-200 text-[#008236]
                                    text-xs font-semibold hover:bg-green-50
                                    disabled:opacity-50
                                  "
                                >
                                  Mark pending
                                </button>
                              )}
                              {!sellerDone && !buyerDone && (
                                <button
                                  type="button"
                                  disabled={updatingId === order.id}
                                  onClick={() => markSuccessful(order)}
                                  className="
                                    h-9 px-3 rounded-lg
                                    bg-[#008236] hover:bg-[#006f2e]
                                    text-white text-xs font-semibold
                                    disabled:opacity-50
                                  "
                                >
                                  {updatingId === order.id
                                    ? "Saving..."
                                    : "Mark successful"}
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default SellerOrders;