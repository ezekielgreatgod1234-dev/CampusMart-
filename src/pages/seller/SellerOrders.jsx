import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import {
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
  doc,
  updateDoc,
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
} from "react-icons/fi";

import { db } from "../../context/firebase";
import { useAuth } from "../../context/AuthContext";

function SellerOrders({
  unreadMessages = 0,
  profile = {},
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { firebaseUser } = useAuth();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [updatingId, setUpdatingId] = useState(null);

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

  const normalizeStatus = (status) => {
    const s = String(status || "pending").toLowerCase();
    if (s === "delivered") return "delivered";
    if (s === "cancelled") return "cancelled";
    return "pending";
  };

  useEffect(() => {
    if (!firebaseUser?.uid) {
      setOrders([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const ordersRef = collection(db, "orders");
    const q = query(
      ordersRef,
      where("sellerId", "==", firebaseUser.uid),
      orderBy("createdAt", "desc")
    );

    const applyDocs = (snapshot) => {
      const list = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      setOrders(list);
      setLoading(false);
    };

    const unsubscribe = onSnapshot(
      q,
      applyDocs,
      (error) => {
        console.error("Seller orders listener error:", error);

        const fallbackQ = query(
          ordersRef,
          where("sellerId", "==", firebaseUser.uid)
        );

        onSnapshot(
          fallbackQ,
          (snap) => {
            const list = snap.docs.map((d) => ({
              id: d.id,
              ...d.data(),
            }));
            list.sort((a, b) => {
              const aT =
                a.createdAt?.toMillis?.() ||
                a.createdAt?.seconds * 1000 ||
                Number(a.createdAt) ||
                0;
              const bT =
                b.createdAt?.toMillis?.() ||
                b.createdAt?.seconds * 1000 ||
                Number(b.createdAt) ||
                0;
              return bT - aT;
            });
            setOrders(list);
            setLoading(false);
          },
          (err2) => {
            console.error("Seller orders fallback error:", err2);
            setOrders([]);
            setLoading(false);
          }
        );
      }
    );

    return () => unsubscribe();
  }, [firebaseUser?.uid]);

  const visibleOrders = useMemo(() => {
    return orders.filter(
      (order) => normalizeStatus(order.status) !== "cancelled"
    );
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase();

    return visibleOrders.filter((order) => {
      const status = normalizeStatus(order.status);

      if (statusFilter === "pending" && status !== "pending") return false;
      if (statusFilter === "delivered" && status !== "delivered") return false;

      if (!q) return true;

      const itemNames = Array.isArray(order.items)
        ? order.items
            .map((i) => i?.name || i?.productName || i?.title || "")
            .join(" ")
        : "";

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
  }, [visibleOrders, search, statusFilter]);

  const stats = useMemo(() => {
    const total = visibleOrders.length;
    const pending = visibleOrders.filter(
      (o) => normalizeStatus(o.status) === "pending"
    ).length;
    const delivered = visibleOrders.filter(
      (o) => normalizeStatus(o.status) === "delivered"
    ).length;
    return { total, pending, delivered };
  }, [visibleOrders]);

  const formatMoney = (value) => {
    const n = Number(String(value || 0).replace(/[₦,]/g, ""));
    return `₦${(Number.isFinite(n) ? n : 0).toLocaleString()}`;
  };

  const formatDate = (value) => {
    if (!value) return "—";
    try {
      const ms =
        typeof value?.toMillis === "function"
          ? value.toMillis()
          : value?.seconds
          ? value.seconds * 1000
          : typeof value === "number"
          ? value
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

  const statusBadge = (status) => {
    const s = normalizeStatus(status);
    if (s === "delivered") {
      return {
        label: "Delivered",
        className: "bg-[#008236] text-white",
        icon: FiCheckCircle,
      };
    }
    return {
      label: "Pending",
      className: "bg-green-50 text-[#008236] border border-green-200",
      icon: FiClock,
    };
  };

  // Writes lowercase so buyer OrderSummary can match case-insensitively
  const updateOrderStatus = async (orderId, nextStatus) => {
    if (!orderId || updatingId) return;
    if (nextStatus !== "pending" && nextStatus !== "delivered") return;

    setUpdatingId(orderId);
    try {
      await updateDoc(doc(db, "orders", orderId), {
        status: nextStatus, // "pending" | "delivered"
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Update order status error:", error);
      alert("Could not update order status. Please try again.");
    } finally {
      setUpdatingId(null);
    }
  };

  const statusFilters = [
    { id: "all", label: "All" },
    { id: "pending", label: "Pending" },
    { id: "delivered", label: "Delivered" },
  ];

  const hasSearchOrFilter =
    search.trim().length > 0 || statusFilter !== "all";

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
            <div className="w-10 h-10 rounded-xl bg-[#006f2e] flex items-center justify-center border border-white/10">
              <span className="text-white text-[16px] font-black">CM</span>
            </div>
            <div>
              <h1 className="text-[30px] font-extrabold leading-none">
                <span className="text-white">Campus</span>
                <span className="text-green-300">Mart</span>
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
                  ${active ? "bg-white text-[#008236] font-semibold" : "text-white hover:bg-white/10"}
                `}
              >
                <Icon size={19} />
                <span className="flex-1 text-[14px]">{label}</span>
                {badge > 0 && (
                  <span className="min-w-[21px] h-[21px] px-1.5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                    {badge}
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
            className="lg:hidden w-10 h-10 rounded-lg hover:bg-white/10 flex items-center justify-center"
          >
            <FiMenu size={24} />
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
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-green-700 via-green-600 to-green-500 p-6 sm:p-7 text-white shadow-lg mb-6">
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
              Mark orders Pending or Delivered. Buyers will see the update in
              their Order Summary.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6">
            {[
              { label: "Total", value: stats.total },
              { label: "Pending", value: stats.pending },
              { label: "Delivered", value: stats.delivered },
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
              {statusFilters.map((item) => {
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
            ) : visibleOrders.length === 0 ? (
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
                  const status = normalizeStatus(order.status);
                  const badge = statusBadge(status);
                  const StatusIcon = badge.icon;

                  const items = Array.isArray(order.items)
                    ? order.items
                    : [
                        {
                          name:
                            order.productName ||
                            order.name ||
                            "Product",
                          quantity: order.quantity || 1,
                          price: order.price || order.total,
                        },
                      ];

                  const buyerName =
                    order.customerName ||
                    order.customer?.fullName ||
                    order.customer?.name ||
                    order.buyerName ||
                    "Buyer";

                  const total =
                    order.total ||
                    order.amount ||
                    items.reduce((sum, item) => {
                      const price = Number(
                        String(item.price || 0).replace(/[₦,]/g, "")
                      );
                      return sum + price * (item.quantity || 1);
                    }, 0);

                  return (
                    <div key={order.id} className="p-4 sm:p-5">
                      <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-bold text-[#008236]">
                              {order.orderNumber ||
                                `#${String(order.id)
                                  .slice(0, 8)
                                  .toUpperCase()}`}
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
                              ? ` · ${
                                  order.customer?.campus || order.campus
                                }`
                              : ""}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {formatDate(order.createdAt)}
                          </p>

                          <div className="mt-3 space-y-1.5">
                            {items.map((item, idx) => (
                              <div
                                key={idx}
                                className="flex items-center justify-between gap-3 text-sm"
                              >
                                <span className="text-gray-700 truncate">
                                  {item.name ||
                                    item.productName ||
                                    "Item"}{" "}
                                  <span className="text-gray-400">
                                    ×{item.quantity || 1}
                                  </span>
                                </span>
                                <span className="font-medium text-gray-800 shrink-0">
                                  {formatMoney(
                                    (Number(
                                      String(item.price || 0).replace(
                                        /[₦,]/g,
                                        ""
                                      )
                                    ) || 0) * (item.quantity || 1)
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
                        </div>

                        <div className="lg:text-right shrink-0 space-y-2">
                          <p className="text-lg font-bold text-gray-900">
                            {formatMoney(total)}
                          </p>
                          <p className="text-[11px] text-gray-400 uppercase tracking-wide">
                            {order.paymentMethod === "card"
                              ? "Paid with card"
                              : order.paymentMethod || "Card"}
                          </p>

                          <div className="flex flex-wrap lg:justify-end gap-2 pt-1">
                            {status !== "pending" && (
                              <button
                                type="button"
                                disabled={updatingId === order.id}
                                onClick={() =>
                                  updateOrderStatus(order.id, "pending")
                                }
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
                            {status !== "delivered" && (
                              <button
                                type="button"
                                disabled={updatingId === order.id}
                                onClick={() =>
                                  updateOrderStatus(order.id, "delivered")
                                }
                                className="
                                  h-9 px-3 rounded-lg
                                  bg-[#008236] hover:bg-[#006f2e]
                                  text-white text-xs font-semibold
                                  disabled:opacity-50
                                "
                              >
                                Mark delivered
                              </button>
                            )}
                          </div>
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