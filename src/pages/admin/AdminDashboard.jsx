import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import {
  collection,
  onSnapshot,
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
} from "react-icons/fi";

import { db } from "../../context/firebase";
import { useAuth } from "../../context/AuthContext";

const ADMIN_EMAIL = "campusmart1234@gmail.com";

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

  // Support messages badge
  const [unreadSupportCount, setUnreadSupportCount] = useState(0);

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
        const { doc, getDoc } = await import("firebase/firestore");
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
  // LIVE ADMIN STATS + SUPPORT BADGE
  // =========================================================
  useEffect(() => {
    if (!allowed) return;

    const unsubUsers = onSnapshot(
      collection(db, "users"),
      (snap) => setTotalUsers(snap.size),
      (error) => console.error("Could not load users:", error)
    );

    const unsubProducts = onSnapshot(
      collection(db, "products"),
      (snap) => setTotalProducts(snap.size),
      (error) => console.error("Could not load products:", error)
    );

    const unsubOrders = onSnapshot(
      collection(db, "orders"),
      (snap) => {
        setTotalOrders(snap.size);
        let revenue = 0;

        snap.forEach((d) => {
          const data = d.data();
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
            status === "pending"
          ) {
            revenue += amount;
          }
        });

        setTotalRevenue(revenue);
      },
      (error) => console.error("Could not load orders:", error)
    );

    const unsubFees = onSnapshot(
      collection(db, "platformFees"),
      (snap) => {
        let fees = 0;
        snap.forEach((d) => {
          fees += Number(d.data().platformFee) || 0;
        });
        setPlatformFees(fees);
      },
      (error) => console.error("Could not load platform fees:", error)
    );

    const unsubWithdrawals = onSnapshot(
      collection(db, "withdrawals"),
      (snap) => {
        let pending = 0;
        snap.forEach((d) => {
          const status = String(d.data().status || "").toLowerCase();
          if (status === "pending" || status === "processing") {
            pending += 1;
          }
        });
        setPendingWithdrawals(pending);
      },
      (error) => console.error("Could not load withdrawals:", error)
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

          if (!isRead) {
            unread += 1;
          }
        });

        setUnreadSupportCount(unread);
      },
      (error) => console.error("Could not load support messages:", error)
    );

    return () => {
      unsubUsers();
      unsubProducts();
      unsubOrders();
      unsubFees();
      unsubWithdrawals();
      unsubSupport();
    };
  }, [allowed]);

  const formatNaira = (n) =>
    `₦${Number(n || 0).toLocaleString("en-NG")}`;

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
    if (path === "/admin-dashboard") {
      return location.pathname === "/admin-dashboard";
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
      <div className="h-screen w-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-10 h-10 mx-auto rounded-full border-4 border-green-100 border-t-green-600 animate-spin" />
          <p className="mt-4 text-sm text-gray-500">Checking access...</p>
        </div>
      </div>
    );
  }

  if (!firebaseUser || !allowed) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-sm text-center bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
          <div className="w-14 h-14 mx-auto rounded-full bg-red-50 text-red-500 flex items-center justify-center mb-4">
            <FiShield size={24} />
          </div>
          <h1 className="text-xl font-bold text-gray-800">Access Denied</h1>
          <p className="text-sm text-gray-500 mt-2">
            You do not have permission to view the Admin Dashboard.
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
          w-[291px]
          bg-[#008236]
          text-white
          flex flex-col
          h-screen
          transition-transform
          duration-300
          ease-in-out
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
                  w-full
                  flex
                  items-center
                  gap-3
                  px-3.5
                  py-3
                  rounded-xl
                  text-left
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
                  <span
                    className={`
                      min-w-[20px] h-[20px] px-1.5 rounded-full
                      text-[10px] font-bold
                      flex items-center justify-center flex-shrink-0
                      ${
                        active
                          ? "bg-red-500 text-white"
                          : "bg-red-500 text-white"
                      }
                    `}
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
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-white hover:bg-white/10 transition"
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
            <p className="text-sm font-semibold">Admin Dashboard</p>
            <p className="text-[11px] text-green-100">
              Platform overview & control
            </p>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="mb-6 rounded-2xl bg-gradient-to-r from-[#007233] to-[#008f3f] p-6 text-white shadow-lg">
            <p className="text-xs text-green-100 font-medium">Overview</p>
            <h1 className="text-2xl sm:text-3xl font-bold mt-1">
              CampusMart Admin
            </h1>
            <p className="text-sm text-green-100 mt-2 max-w-xl">
              Track users, orders, revenue and platform fees in real time.
            </p>
          </div>

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
              value={formatNaira(totalRevenue)}
              icon={FiTrendingUp}
              color="text-emerald-600"
              bg="bg-emerald-50"
            />
            <StatCard
              label="CampusMart Fees (5%)"
              value={formatNaira(platformFees)}
              icon={FiDollarSign}
              color="text-[#008236]"
              bg="bg-green-50"
            />
            <StatCard
              label="Pending Withdrawals"
              value={pendingWithdrawals}
              icon={FiClock}
              color="text-amber-600"
              bg="bg-amber-50"
            />
          </div>

          {/* Support quick access with badge */}
          <div className="mt-6 bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="relative w-11 h-11 rounded-xl bg-green-50 text-[#008236] flex items-center justify-center">
                  <FiMessageCircle size={21} />
                  {unreadSupportCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                      {unreadSupportCount > 99 ? "99+" : unreadSupportCount}
                    </span>
                  )}
                </div>

                <div>
                  <h2 className="text-sm font-bold text-gray-900">
                    Support Messages
                  </h2>
                  <p className="text-xs text-gray-500 mt-1">
                    {unreadSupportCount > 0
                      ? `${unreadSupportCount} new message${
                          unreadSupportCount === 1 ? "" : "s"
                        }`
                      : "View and manage messages from users."}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigate("/admin/support-messages")}
                className="h-10 px-4 rounded-xl bg-[#008236] text-white text-sm font-semibold hover:bg-[#006f2e] transition flex items-center gap-2"
              >
                <FiMessageCircle size={16} />
                Open
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color, bg }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-gray-500 font-medium">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
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