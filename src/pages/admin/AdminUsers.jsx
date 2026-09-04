import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  serverTimestamp,
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
  FiUserCheck,
  FiUserX,
  FiMessageCircle,
} from "react-icons/fi";

import { db } from "../../context/firebase";
import { useAuth } from "../../context/AuthContext";

const ADMIN_EMAIL = "campusmart1234@gmail.com";

function AdminUsers() {
  const navigate = useNavigate();
  const location = useLocation();
  const { firebaseUser } = useAuth();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);

  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [updatingId, setUpdatingId] = useState(null);
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

    const checkAdminRole = async () => {
      try {
        const snap = await getDoc(doc(db, "users", firebaseUser.uid));
        const role = snap.exists() ? snap.data()?.role : null;
        setAllowed(role === "admin");
      } catch (error) {
        console.error("Could not verify admin role:", error);
        setAllowed(false);
      } finally {
        setLoading(false);
      }
    };

    checkAdminRole();
  }, [firebaseUser]);

  // Load users + support badge
  useEffect(() => {
    if (!allowed) return;

    const unsubUsers = onSnapshot(
      collection(db, "users"),
      (snap) => {
        const list = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));

        list.sort((a, b) => {
          const aT =
            a.createdAt?.toMillis?.() || a.createdAt?.seconds * 1000 || 0;
          const bT =
            b.createdAt?.toMillis?.() || b.createdAt?.seconds * 1000 || 0;
          return bT - aT;
        });

        setUsers(list);
      },
      (error) => {
        console.error("Could not load users:", error);
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

    return () => {
      unsubUsers();
      unsubSupport();
    };
  }, [allowed]);

  const isSeller = (user) => {
    return (
      user?.isSeller === true ||
      user?.accountType === "seller" ||
      user?.role === "seller" ||
      user?.userType === "seller" ||
      Boolean(user?.shopName)
    );
  };

  const isSuspended = (user) => {
    return (
      String(user?.accountStatus || "active").trim().toLowerCase() ===
      "disabled"
    );
  };

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();

    return users.filter((user) => {
      const seller = isSeller(user);

      if (filter === "sellers" && !seller) return false;
      if (filter === "buyers" && seller) return false;
      if (!q) return true;

      const haystack = [
        user.fullName,
        user.name,
        user.displayName,
        user.email,
        user.campus,
        user.phone,
        user.role,
        user.accountStatus,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [users, search, filter]);

  const formatDate = (value) => {
    if (!value) return "—";

    try {
      const ms =
        value?.toMillis?.() ||
        value?.seconds * 1000 ||
        Date.parse(value);

      if (!ms || Number.isNaN(ms)) return "—";

      return new Date(ms).toLocaleDateString([], {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "—";
    }
  };

  const updateUser = async (userId, data) => {
    if (!userId || updatingId) return;

    setUpdatingId(userId);

    try {
      await updateDoc(doc(db, "users", userId), {
        ...data,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Could not update user:", error);
      alert("Could not update user. Check your Firestore rules.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSuspendToggle = async (user) => {
    if (!user?.id) return;

    const isAdminUser =
      user.role === "admin" ||
      (user.email || "").toLowerCase() === ADMIN_EMAIL.toLowerCase();

    if (isAdminUser) {
      alert("Admin accounts cannot be suspended from this page.");
      return;
    }

    const currentlySuspended = isSuspended(user);

    try {
      await updateUser(user.id, {
        accountStatus: currentlySuspended ? "active" : "disabled",
      });
    } catch (error) {
      console.error(error);
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
          <p className="text-sm text-gray-500 mt-2">
            You do not have permission to access the admin users page.
          </p>
          <button
            type="button"
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
          fixed inset-y-0 left-0 z-50 w-[291px]
          bg-[#008236] text-white flex flex-col h-screen
          transition-transform duration-300
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
                  w-full flex items-center gap-3
                  px-3.5 py-3 rounded-xl text-left
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
            <p className="text-sm font-semibold">Users</p>
            <p className="text-[11px] text-green-100">
              Manage buyers, sellers and admins
            </p>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 shadow-sm mb-5 space-y-4">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, email, campus..."
                className="w-full h-11 pl-10 pr-4 rounded-xl border border-gray-200 bg-gray-50 text-sm outline-none focus:border-[#008236] focus:bg-white focus:ring-2 focus:ring-green-50"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {[
                { id: "all", label: "All" },
                { id: "buyers", label: "Buyers" },
                { id: "sellers", label: "Sellers" },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setFilter(item.id)}
                  className={`
                    h-10 px-4 rounded-xl text-sm font-semibold transition
                    ${
                      filter === item.id
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
            {filteredUsers.length === 0 ? (
              <div className="p-10 text-center text-sm text-gray-500">
                No users found.
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredUsers.map((user) => {
                  const name =
                    user.fullName ||
                    user.name ||
                    user.displayName ||
                    "User";

                  const seller = isSeller(user);
                  const suspended = isSuspended(user);

                  const isAdminUser =
                    user.role === "admin" ||
                    (user.email || "").toLowerCase() ===
                      ADMIN_EMAIL.toLowerCase();

                  return (
                    <div
                      key={user.id}
                      className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center gap-4"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {user.photoURL || user.profileImage ? (
                          <img
                            src={user.photoURL || user.profileImage}
                            alt={name}
                            className="w-11 h-11 rounded-full object-cover border border-gray-100"
                          />
                        ) : (
                          <div className="w-11 h-11 rounded-full bg-green-50 text-[#008236] flex items-center justify-center font-bold">
                            {String(name).charAt(0).toUpperCase()}
                          </div>
                        )}

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold text-gray-900 truncate">
                              {name}
                            </p>

                            <span
                              className={`
                                text-[10px] font-semibold px-2 py-0.5 rounded-full
                                ${
                                  seller
                                    ? "bg-green-50 text-[#008236]"
                                    : "bg-blue-50 text-blue-600"
                                }
                              `}
                            >
                              {seller ? "Seller" : "Buyer"}
                            </span>

                            {isAdminUser && (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-600">
                                Admin
                              </span>
                            )}

                            {suspended && (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-600">
                                Suspended
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-gray-500 mt-0.5 truncate">
                            {user.email || "—"}
                          </p>

                          <p className="text-xs text-gray-400 mt-0.5">
                            {user.campus || "No campus"} · Joined{" "}
                            {formatDate(user.createdAt)}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 lg:justify-end">
                        {!isAdminUser && (
                          <button
                            type="button"
                            disabled={updatingId === user.id}
                            onClick={() => handleSuspendToggle(user)}
                            className={`
                              h-9 px-3 rounded-lg text-xs font-semibold
                              flex items-center gap-1.5
                              disabled:opacity-50 disabled:cursor-not-allowed
                              ${
                                suspended
                                  ? "bg-green-50 text-[#008236] border border-green-100 hover:bg-green-100"
                                  : "bg-red-50 text-red-600 border border-red-100 hover:bg-red-100"
                              }
                            `}
                          >
                            {updatingId === user.id ? (
                              <>
                                <span className="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
                                Updating...
                              </>
                            ) : suspended ? (
                              <>
                                <FiUserCheck size={14} />
                                Activate
                              </>
                            ) : (
                              <>
                                <FiUserX size={14} />
                                Suspend
                              </>
                            )}
                          </button>
                        )}

                        {(user.email || "").toLowerCase() !==
                          ADMIN_EMAIL.toLowerCase() && (
                          <button
                            type="button"
                            disabled={updatingId === user.id}
                            onClick={() =>
                              updateUser(user.id, {
                                role: isAdminUser ? "user" : "admin",
                              })
                            }
                            className={`
                              h-9 px-3 rounded-lg text-xs font-semibold
                              flex items-center gap-1.5
                              disabled:opacity-50 disabled:cursor-not-allowed
                              ${
                                isAdminUser
                                  ? "bg-gray-100 text-gray-600"
                                  : "bg-purple-50 text-purple-600 border border-purple-100 hover:bg-purple-100"
                              }
                            `}
                          >
                            {updatingId === user.id ? (
                              <>
                                <span className="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
                                Updating...
                              </>
                            ) : (
                              <>
                                <FiShield size={14} />
                                {isAdminUser ? "Remove Admin" : "Make Admin"}
                              </>
                            )}
                          </button>
                        )}
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

export default AdminUsers;