import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import {
  collection,
  onSnapshot,
  doc,
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
  FiSearch,
  FiShield,
  FiEye,
  FiClock,
  FiCheckCircle,
  FiXCircle,
} from "react-icons/fi";

import { db } from "../../context/firebase";
import { useAuth } from "../../context/AuthContext";

const ADMIN_EMAIL = "campusmart1234@gmail.com";

function AdminOrders() {
  const navigate = useNavigate();
  const location = useLocation();
  const { firebaseUser } = useAuth();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);

  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Access control
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

  // Load orders
  useEffect(() => {
    if (!allowed) return;

    const unsub = onSnapshot(collection(db, "orders"), (snap) => {
      const list = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));

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

      setOrders(list);
    });

    return () => unsub();
  }, [allowed]);

  const normalizeStatus = (order) => {
    const s = String(
      order.paymentStatus || order.status || "pending"
    ).toLowerCase();

    if (s === "cancelled" || s === "canceled") return "cancelled";
    if (s === "delivered") return "delivered";
    if (s === "paid" || s === "success" || s === "successful") return "paid";
    return "pending";
  };

  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase();

    return orders.filter((order) => {
      const status = normalizeStatus(order);

      if (statusFilter !== "all" && status !== statusFilter) return false;

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
        order.buyerId,
        order.sellerId,
        order.buyerName,
        order.sellerName,
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
  }, [orders, search, statusFilter]);

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

  const statusBadge = (status) => {
    if (status === "delivered") {
      return {
        label: "Delivered",
        className: "bg-[#008236] text-white",
        icon: FiCheckCircle,
      };
    }
    if (status === "paid") {
      return {
        label: "Paid",
        className: "bg-blue-50 text-blue-700 border border-blue-100",
        icon: FiCheckCircle,
      };
    }
    if (status === "cancelled") {
      return {
        label: "Cancelled",
        className: "bg-red-50 text-red-600 border border-red-100",
        icon: FiXCircle,
      };
    }
    return {
      label: "Pending",
      className: "bg-amber-50 text-amber-700 border border-amber-100",
      icon: FiClock,
    };
  };

  const menuItems = [
    { label: "Overview", icon: FiGrid, path: "/admin-dashboard" },
    { label: "Users", icon: FiUsers, path: "/admin/users" },
    { label: "Products", icon: FiPackage, path: "/admin/products" },
    { label: "Orders", icon: FiShoppingBag, path: "/admin/orders" },
    { label: "Platform Fees", icon: FiDollarSign, path: "/admin/fees" },
    { label: "Withdrawals", icon: FiCreditCard, path: "/admin/withdrawals" },
    { label: "Payments", icon: FiTrendingUp, path: "/admin/payments" },
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
          {menuItems.map(({ label, icon: Icon, path }) => {
            const active = isActive(path);
            return (
              <button
                key={label}
                type="button"
                onClick={() => handleNavigation(path)}
                className={`
                  w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-left transition
                  ${active ? "bg-white text-[#008236] font-semibold" : "text-white hover:bg-white/10"}
                `}
              >
                <Icon size={18} />
                <span className="text-[14px]">{label}</span>
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
          <div>
            <p className="text-sm font-semibold">Orders</p>
            <p className="text-[11px] text-green-100">
              All platform orders
            </p>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
          {/* Filters */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 shadow-sm space-y-4">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search order, buyer, seller, reference..."
                className="w-full h-11 pl-10 pr-4 rounded-xl border border-gray-200 bg-gray-50 text-sm outline-none focus:border-[#008236] focus:bg-white focus:ring-2 focus:ring-green-50"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {[
                { id: "all", label: "All" },
                { id: "pending", label: "Pending" },
                { id: "paid", label: "Paid" },
                { id: "delivered", label: "Delivered" },
                { id: "cancelled", label: "Cancelled" },
              ].map((item) => (
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

          {/* Orders list */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {filteredOrders.length === 0 ? (
              <div className="p-10 text-center text-sm text-gray-500">
                No orders found.
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredOrders.map((order) => {
                  const status = normalizeStatus(order);
                  const badge = statusBadge(status);
                  const StatusIcon = badge.icon;

                  const buyerName =
                    order.customerName ||
                    order.customer?.fullName ||
                    order.customer?.name ||
                    order.buyerName ||
                    "Buyer";

                  const sellerName =
                    order.sellerName ||
                    (order.sellerId
                      ? `Seller ${String(order.sellerId).slice(0, 6)}`
                      : "Seller");

                  const total =
                    order.total ||
                    order.amount ||
                    order.amountPaid ||
                    0;

                  return (
                    <div key={order.id} className="p-4 sm:p-5">
                      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-bold text-[#008236]">
                              {order.orderNumber ||
                                `#${String(order.id).slice(0, 8).toUpperCase()}`}
                            </p>
                            <span
                              className={`
                                inline-flex items-center gap-1.5
                                px-2.5 py-1 rounded-full text-[10px] font-semibold
                                ${badge.className}
                              `}
                            >
                              <StatusIcon size={12} />
                              {badge.label}
                            </span>
                          </div>

                          <p className="text-sm text-gray-800 mt-2">
                            <span className="font-semibold">{buyerName}</span>
                            <span className="text-gray-400"> → </span>
                            <span className="font-semibold">{sellerName}</span>
                          </p>

                          <p className="text-xs text-gray-500 mt-1">
                            {formatDate(order.createdAt)}
                            {order.paystackReference
                              ? ` · Ref: ${order.paystackReference}`
                              : ""}
                          </p>
                        </div>

                        <div className="flex items-center gap-3 lg:flex-col lg:items-end">
                          <p className="text-lg font-bold text-gray-900">
                            {formatNaira(total)}
                          </p>
                          <button
                            type="button"
                            onClick={() => setSelectedOrder(order)}
                            className="h-9 px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 bg-green-50 text-[#008236] border border-green-100 hover:bg-green-100"
                          >
                            <FiEye size={14} />
                            View details
                          </button>
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

      {/* Order details modal */}
      {selectedOrder && (
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
                  {selectedOrder.orderNumber ||
                    `#${String(selectedOrder.id).slice(0, 8).toUpperCase()}`}
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
                  <p className="text-xs text-gray-400">Status</p>
                  <p className="font-semibold capitalize mt-0.5">
                    {normalizeStatus(selectedOrder)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Amount</p>
                  <p className="font-semibold mt-0.5">
                    {formatNaira(
                      selectedOrder.total ||
                        selectedOrder.amount ||
                        selectedOrder.amountPaid
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Buyer</p>
                  <p className="font-semibold mt-0.5">
                    {selectedOrder.customerName ||
                      selectedOrder.customer?.fullName ||
                      selectedOrder.buyerName ||
                      selectedOrder.buyerId ||
                      "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Seller</p>
                  <p className="font-semibold mt-0.5">
                    {selectedOrder.sellerName ||
                      selectedOrder.sellerId ||
                      "—"}
                  </p>
                </div>
              </div>

              {selectedOrder.customer && (
                <div className="rounded-xl bg-gray-50 p-3 text-xs text-gray-600 space-y-1">
                  <p>
                    <span className="font-semibold">Phone:</span>{" "}
                    {selectedOrder.customer.phone || "—"}
                  </p>
                  <p>
                    <span className="font-semibold">Campus:</span>{" "}
                    {selectedOrder.customer.campus || "—"}
                  </p>
                  <p>
                    <span className="font-semibold">Address:</span>{" "}
                    {selectedOrder.customer.address || "—"}
                  </p>
                </div>
              )}

              {Array.isArray(selectedOrder.items) &&
                selectedOrder.items.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-400 mb-2">Items</p>
                    <div className="space-y-2">
                      {selectedOrder.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex justify-between gap-3 text-sm border border-gray-100 rounded-xl px-3 py-2"
                        >
                          <span className="truncate">
                            {item.name || item.productName || "Item"} ×
                            {item.quantity || 1}
                          </span>
                          <span className="font-semibold shrink-0">
                            {formatNaira(
                              (Number(item.price) || 0) * (item.quantity || 1)
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              <p className="text-xs text-gray-400">
                Created: {formatDate(selectedOrder.createdAt)}
              </p>
              {selectedOrder.paystackReference && (
                <p className="text-xs text-gray-400">
                  Paystack ref: {selectedOrder.paystackReference}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminOrders;