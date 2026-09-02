import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import {
  collection,
  onSnapshot,
  doc,
  getDoc,
  updateDoc,
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
  FiSearch,
  FiShield,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiRefreshCw,
} from "react-icons/fi";

import { db } from "../../context/firebase";
import { useAuth } from "../../context/AuthContext";

const ADMIN_EMAIL = "campusmart1234@gmail.com";

function AdminWithdrawals() {
  const navigate = useNavigate();
  const location = useLocation();
  const { firebaseUser } = useAuth();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);

  const [withdrawals, setWithdrawals] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [updatingId, setUpdatingId] = useState(null);

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

  // Load withdrawals
  useEffect(() => {
    if (!allowed) return;

    const unsub = onSnapshot(collection(db, "withdrawals"), (snap) => {
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

      setWithdrawals(list);
    });

    return () => unsub();
  }, [allowed]);

  const normalizeStatus = (status) => {
    const s = String(status || "pending").toLowerCase();
    if (s === "successful" || s === "success" || s === "completed") {
      return "successful";
    }
    if (s === "failed" || s === "rejected") return "failed";
    if (s === "processing") return "processing";
    return "pending";
  };

  const filteredWithdrawals = useMemo(() => {
    const q = search.trim().toLowerCase();

    return withdrawals.filter((w) => {
      const status = normalizeStatus(w.status);

      if (statusFilter !== "all" && status !== statusFilter) return false;

      if (!q) return true;

      const haystack = [
        w.sellerId,
        w.bankName,
        w.accountName,
        w.accountNumber,
        w.amount,
        w.status,
        w.paystackReference,
        w.paystackTransferCode,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [withdrawals, search, statusFilter]);

  const stats = useMemo(() => {
    let pending = 0;
    let processing = 0;
    let successful = 0;
    let failed = 0;
    let pendingAmount = 0;

    withdrawals.forEach((w) => {
      const status = normalizeStatus(w.status);
      const amount = Number(w.amount) || 0;
      if (status === "pending") {
        pending += 1;
        pendingAmount += amount;
      } else if (status === "processing") processing += 1;
      else if (status === "successful") successful += 1;
      else if (status === "failed") failed += 1;
    });

    return { pending, processing, successful, failed, pendingAmount };
  }, [withdrawals]);

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
    if (status === "successful") {
      return {
        label: "Successful",
        className: "bg-[#008236] text-white",
        icon: FiCheckCircle,
      };
    }
    if (status === "processing") {
      return {
        label: "Processing",
        className: "bg-blue-50 text-blue-700 border border-blue-100",
        icon: FiRefreshCw,
      };
    }
    if (status === "failed") {
      return {
        label: "Failed",
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

  const updateStatus = async (id, nextStatus) => {
    if (!id || updatingId) return;
    setUpdatingId(id);
    try {
      await updateDoc(doc(db, "withdrawals", id), {
        status: nextStatus,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error(error);
      alert("Could not update status. Check Firestore rules.");
    } finally {
      setUpdatingId(null);
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
            <p className="text-sm font-semibold">Withdrawals</p>
            <p className="text-[11px] text-green-100">
              Seller payout requests
            </p>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
              <p className="text-xs text-gray-500">Pending</p>
              <p className="text-xl font-bold text-amber-600 mt-1">
                {stats.pending}
              </p>
              <p className="text-[11px] text-gray-400 mt-1">
                {formatNaira(stats.pendingAmount)}
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
              <p className="text-xs text-gray-500">Processing</p>
              <p className="text-xl font-bold text-blue-600 mt-1">
                {stats.processing}
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
              <p className="text-xs text-gray-500">Successful</p>
              <p className="text-xl font-bold text-[#008236] mt-1">
                {stats.successful}
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
              <p className="text-xs text-gray-500">Failed</p>
              <p className="text-xl font-bold text-red-600 mt-1">
                {stats.failed}
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 shadow-sm space-y-4">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search seller, bank, account, amount..."
                className="w-full h-11 pl-10 pr-4 rounded-xl border border-gray-200 bg-gray-50 text-sm outline-none focus:border-[#008236] focus:bg-white focus:ring-2 focus:ring-green-50"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {[
                { id: "all", label: "All" },
                { id: "pending", label: "Pending" },
                { id: "processing", label: "Processing" },
                { id: "successful", label: "Successful" },
                { id: "failed", label: "Failed" },
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

          {/* List */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {filteredWithdrawals.length === 0 ? (
              <div className="p-10 text-center text-sm text-gray-500">
                No withdrawals found.
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredWithdrawals.map((w) => {
                  const status = normalizeStatus(w.status);
                  const badge = statusBadge(status);
                  const StatusIcon = badge.icon;

                  return (
                    <div key={w.id} className="p-4 sm:p-5">
                      <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-base font-bold text-gray-900">
                              {formatNaira(w.amount)}
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

                          <p className="text-sm text-gray-700 mt-2">
                            {w.accountName || "—"} · {w.bankName || "—"}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Account: {w.accountNumber || "—"}
                            {w.bankCode ? ` · Code: ${w.bankCode}` : ""}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            Seller:{" "}
                            {w.sellerId
                              ? String(w.sellerId).slice(0, 12)
                              : "—"}
                            {" · "}
                            {formatDate(w.createdAt)}
                          </p>
                          {(w.paystackReference || w.paystackTransferCode) && (
                            <p className="text-xs text-gray-400 mt-0.5">
                              {w.paystackTransferCode || w.paystackReference}
                            </p>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-2 lg:justify-end">
                          {status !== "processing" && status !== "successful" && (
                            <button
                              type="button"
                              disabled={updatingId === w.id}
                              onClick={() => updateStatus(w.id, "Processing")}
                              className="h-9 px-3 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100 hover:bg-blue-100 disabled:opacity-50"
                            >
                              Mark processing
                            </button>
                          )}
                          {status !== "successful" && (
                            <button
                              type="button"
                              disabled={updatingId === w.id}
                              onClick={() => updateStatus(w.id, "Successful")}
                              className="h-9 px-3 rounded-lg text-xs font-semibold bg-[#008236] text-white hover:bg-[#006f2e] disabled:opacity-50"
                            >
                              Mark successful
                            </button>
                          )}
                          {status !== "failed" && status !== "successful" && (
                            <button
                              type="button"
                              disabled={updatingId === w.id}
                              onClick={() => updateStatus(w.id, "Failed")}
                              className="h-9 px-3 rounded-lg text-xs font-semibold bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 disabled:opacity-50"
                            >
                              Mark failed
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
        </main>
      </div>
    </div>
  );
}

export default AdminWithdrawals;