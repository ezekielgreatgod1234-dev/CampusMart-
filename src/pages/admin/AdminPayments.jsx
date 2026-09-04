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
  FiExternalLink,
  FiMessageCircle,
} from "react-icons/fi";

import { db } from "../../context/firebase";
import { useAuth } from "../../context/AuthContext";

const ADMIN_EMAIL = "campusmart1234@gmail.com";

function AdminPayments() {
  const navigate = useNavigate();
  const location = useLocation();
  const { firebaseUser } = useAuth();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);

  const [payments, setPayments] = useState([]);
  const [search, setSearch] = useState("");
  const [unreadSupportCount, setUnreadSupportCount] = useState(0);

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

  // Build payments list + support badge
  useEffect(() => {
    if (!allowed) return;

    const unsubFees = onSnapshot(collection(db, "platformFees"), (snap) => {
      const fromFees = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          source: "platformFees",
          amount: Number(data.totalAmount) || 0,
          platformFee: Number(data.platformFee) || 0,
          sellerAmount: Number(data.sellerAmount) || 0,
          sellerId: data.sellerId || null,
          orderId: data.orderId || null,
          reference: data.paystackReference || null,
          createdAt: data.createdAt || null,
        };
      });

      setPayments((prev) => {
        const orderOnes = prev.filter((p) => p.source === "orders");
        const merged = [...fromFees, ...orderOnes];
        merged.sort((a, b) => {
          const aT =
            a.createdAt?.toMillis?.() || a.createdAt?.seconds * 1000 || 0;
          const bT =
            b.createdAt?.toMillis?.() || b.createdAt?.seconds * 1000 || 0;
          return bT - aT;
        });
        return merged;
      });
    });

    const unsubOrders = onSnapshot(collection(db, "orders"), (snap) => {
      const fromOrders = snap.docs
        .map((d) => {
          const data = d.data();
          const paid =
            data.paymentStatus === "paid" ||
            data.status === "paid" ||
            data.status === "delivered" ||
            Boolean(data.paystackReference);

          if (!paid) return null;

          return {
            id: d.id,
            source: "orders",
            amount:
              Number(data.total) ||
              Number(data.amount) ||
              Number(data.amountPaid) ||
              0,
            platformFee: null,
            sellerAmount: null,
            sellerId: data.sellerId || null,
            orderId: d.id,
            reference: data.paystackReference || null,
            createdAt: data.paidAt || data.createdAt || null,
            buyerName:
              data.customerName ||
              data.customer?.fullName ||
              data.buyerName ||
              null,
          };
        })
        .filter(Boolean);

      setPayments((prev) => {
        const feeOnes = prev.filter((p) => p.source === "platformFees");
        const feeRefs = new Set(
          feeOnes.map((f) => f.reference || f.orderId).filter(Boolean)
        );
        const uniqueOrders = fromOrders.filter(
          (o) => !feeRefs.has(o.reference) && !feeRefs.has(o.orderId)
        );
        const merged = [...feeOnes, ...uniqueOrders];
        merged.sort((a, b) => {
          const aT =
            a.createdAt?.toMillis?.() || a.createdAt?.seconds * 1000 || 0;
          const bT =
            b.createdAt?.toMillis?.() || b.createdAt?.seconds * 1000 || 0;
          return bT - aT;
        });
        return merged;
      });
    });

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
      unsubOrders();
      unsubSupport();
    };
  }, [allowed]);

  const totalPaid = useMemo(() => {
    return payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  }, [payments]);

  const filteredPayments = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return payments;

    return payments.filter((p) => {
      const haystack = [
        p.reference,
        p.orderId,
        p.sellerId,
        p.buyerName,
        p.amount,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [payments, search]);

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
          {menuItems.map(({ label, icon: Icon, path, badge }) => {
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
          <div>
            <p className="text-sm font-semibold">Payments</p>
            <p className="text-[11px] text-green-100">
              Successful Paystack payments
            </p>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <p className="text-xs text-gray-500 font-medium">
                Total successful payments
              </p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {formatNaira(totalPaid)}
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <p className="text-xs text-gray-500 font-medium">
                Number of payments
              </p>
              <p className="text-2xl font-bold text-[#008236] mt-2">
                {payments.length}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 shadow-sm">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search reference, order, seller..."
                className="w-full h-11 pl-10 pr-4 rounded-xl border border-gray-200 bg-gray-50 text-sm outline-none focus:border-[#008236] focus:bg-white focus:ring-2 focus:ring-green-50"
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {filteredPayments.length === 0 ? (
              <div className="p-10 text-center text-sm text-gray-500">
                No successful payments found.
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredPayments.map((p) => (
                  <div
                    key={`${p.source}-${p.id}`}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-bold text-gray-900">
                        {formatNaira(p.amount)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {p.reference
                          ? `Ref: ${p.reference}`
                          : "No Paystack reference"}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {p.sellerId
                          ? `Seller: ${String(p.sellerId).slice(0, 10)}...`
                          : "Seller: —"}
                        {p.buyerName ? ` · Buyer: ${p.buyerName}` : ""}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {formatDate(p.createdAt)}
                      </p>
                      {p.platformFee != null && (
                        <p className="text-xs text-[#008236] mt-1">
                          Fee: {formatNaira(p.platformFee)} · Seller:{" "}
                          {formatNaira(p.sellerAmount)}
                        </p>
                      )}
                    </div>

                    {p.orderId && (
                      <button
                        type="button"
                        onClick={() => navigate("/admin/orders")}
                        className="h-9 px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 bg-green-50 text-[#008236] border border-green-100 hover:bg-green-100"
                      >
                        <FiExternalLink size={14} />
                        View orders
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default AdminPayments;