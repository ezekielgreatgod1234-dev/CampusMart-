import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
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
  FiTrash2,
  FiAlertTriangle,
} from "react-icons/fi";

import { db } from "../../context/firebase";
import { useAuth } from "../../context/AuthContext";

const ADMIN_EMAIL = "campusmart1234@gmail.com";
const SUPER_ADMIN_UID = "oIW3Jj1EOISi7jv1p2aRk1C3mMW2";

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

  // Delete confirmation modal state
  const [deleteModal, setDeleteModal] = useState({
    open: false,
    user: null,
  });

  // =========================================================
  // ACCESS CONTROL (supports dual-role)
  // =========================================================
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
        console.error("Could not verify admin role:", error);
        setAllowed(false);
      } finally {
        setLoading(false);
      }
    };

    checkAdminRole();
  }, [firebaseUser]);

  // =========================================================
  // LOAD USERS + SUPPORT BADGE
  // =========================================================
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

  // =========================================================
  // HELPERS
  // =========================================================
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

  const isSuperAdmin = (user) => {
    if (user?.id === SUPER_ADMIN_UID || user?.uid === SUPER_ADMIN_UID) {
      return true;
    }
    const email = (user?.email || "").toLowerCase().trim();
    return email === ADMIN_EMAIL.toLowerCase();
  };

  const isAdminUser = (user) => {
    return (
      isSuperAdmin(user) ||
      user?.role === "admin" ||
      user?.isAdmin === true ||
      (Array.isArray(user?.roles) && user.roles.includes("admin"))
    );
  };

  const currentUserIsSuperAdmin =
    firebaseUser?.uid === SUPER_ADMIN_UID ||
    (firebaseUser?.email || "").toLowerCase() === ADMIN_EMAIL.toLowerCase();

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

    if (isSuperAdmin(user)) {
      alert("The Super Admin cannot be suspended.");
      return;
    }

    if (isAdminUser(user)) {
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

  const handleToggleAdmin = async (user) => {
    if (!user?.id) return;

    if (isSuperAdmin(user)) {
      alert("The Super Admin cannot be removed.");
      return;
    }

    if (isAdminUser(user) && !currentUserIsSuperAdmin) {
      alert("Only the Super Admin can remove other admins.");
      return;
    }

    const currentlyAdmin = isAdminUser(user);

    if (currentlyAdmin) {
      await updateUser(user.id, {
        isAdmin: false,
        role: user.role === "admin" ? "buyer" : user.role,
      });
    } else {
      await updateUser(user.id, {
        isAdmin: true,
      });
    }
  };

  // Open custom delete modal
  const openDeleteModal = (user) => {
    if (!user?.id) return;

    if (!currentUserIsSuperAdmin) {
      alert("Only the Super Admin can delete accounts.");
      return;
    }

    if (isSuperAdmin(user)) {
      alert("The Super Admin account cannot be deleted.");
      return;
    }

    setDeleteModal({ open: true, user });
  };

  // Close modal
  const closeDeleteModal = () => {
    if (updatingId) return; // prevent closing while deleting
    setDeleteModal({ open: false, user: null });
  };

  // Confirm delete
  const confirmDeleteUser = async () => {
    const user = deleteModal.user;
    if (!user?.id) return;

    if (!currentUserIsSuperAdmin) {
      alert("Only the Super Admin can delete accounts.");
      return;
    }

    if (isSuperAdmin(user)) {
      alert("The Super Admin account cannot be deleted.");
      return;
    }

    if (updatingId) return;

    setUpdatingId(user.id);

    try {
      await deleteDoc(doc(db, "users", user.id));
      setDeleteModal({ open: false, user: null });
    } catch (error) {
      console.error("Could not delete user:", error);
      alert("Could not delete user. Check your Firestore rules.");
    } finally {
      setUpdatingId(null);
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

  // =========================================================
  // LOADING / ACCESS DENIED
  // =========================================================
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
        <div className="max-w-sm text-center bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
          <div className="w-14 h-14 mx-auto rounded-full bg-red-50 text-red-500 flex items-center justify-center mb-4">
            <FiShield size={24} />
          </div>
          <h1 className="text-xl font-bold text-gray-800">Access Denied</h1>
          <p className="text-sm text-gray-500 mt-2">
            You do not have permission to view this page.
          </p>
          <button
            type="button"
            onClick={() => navigate("/admin-dashboard")}
            className="mt-6 h-11 px-6 rounded-xl bg-[#008236] text-white text-sm font-semibold hover:bg-[#006f2e] transition"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const deleteTargetName =
    deleteModal.user?.fullName ||
    deleteModal.user?.name ||
    deleteModal.user?.displayName ||
    deleteModal.user?.email ||
    "this user";

  // =========================================================
  // RENDER
  // =========================================================
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
                  const superAdmin = isSuperAdmin(user);

                  const name =
                    user.fullName ||
                    user.name ||
                    user.displayName ||
                    (superAdmin ? "CampusMart Admin" : "User");

                  const email =
                    user.email ||
                    (superAdmin ? ADMIN_EMAIL : "—");

                  const seller = isSeller(user);
                  const suspended = isSuspended(user);
                  const admin = isAdminUser(user);

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

                            {superAdmin ? (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                                Super Admin
                              </span>
                            ) : admin ? (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-600">
                                Admin
                              </span>
                            ) : null}

                            {suspended && (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-600">
                                Suspended
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-gray-500 mt-0.5 truncate">
                            {email}
                          </p>

                          <p className="text-xs text-gray-400 mt-0.5">
                            {user.campus || "No campus"} · Joined{" "}
                            {formatDate(user.createdAt)}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 lg:justify-end">
                        {/* Suspend / Activate */}
                        {!superAdmin && !admin && (
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

                        {/* Make Admin / Remove Admin */}
                        {!superAdmin && (
                          <button
                            type="button"
                            disabled={updatingId === user.id}
                            onClick={() => handleToggleAdmin(user)}
                            className={`
                              h-9 px-3 rounded-lg text-xs font-semibold
                              flex items-center gap-1.5
                              disabled:opacity-50 disabled:cursor-not-allowed
                              ${
                                admin
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
                                {admin ? "Remove Admin" : "Make Admin"}
                              </>
                            )}
                          </button>
                        )}

                        {/* Delete button - GREEN (only Super Admin) */}
                        {currentUserIsSuperAdmin && !superAdmin && (
                          <button
                            type="button"
                            disabled={updatingId === user.id}
                            onClick={() => openDeleteModal(user)}
                            className="
                              h-9 px-3 rounded-lg text-xs font-semibold
                              flex items-center gap-1.5
                              bg-[#008236] text-white hover:bg-[#006f2e]
                              disabled:opacity-50 disabled:cursor-not-allowed
                              transition
                            "
                          >
                            {updatingId === user.id ? (
                              <>
                                <span className="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
                                Deleting...
                              </>
                            ) : (
                              <>
                                <FiTrash2 size={14} />
                                Delete
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

      {/* ===================== CUSTOM DELETE MODAL ===================== */}
      {deleteModal.open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
            onClick={closeDeleteModal}
          />

          {/* Modal card */}
          <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-6 pt-6 pb-4 text-center">
              <div className="w-14 h-14 mx-auto rounded-full bg-red-50 text-red-500 flex items-center justify-center mb-4">
                <FiAlertTriangle size={26} />
              </div>

              <h2 className="text-lg font-bold text-gray-900">
                Delete Account?
              </h2>

              <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                Are you sure you want to permanently delete{" "}
                <span className="font-semibold text-gray-800">
                  “{deleteTargetName}”
                </span>
                ?
              </p>

              <p className="text-xs text-red-500 mt-3 font-medium">
                This action cannot be undone.
              </p>
            </div>

            {/* Actions */}
            <div className="px-6 pb-6 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={closeDeleteModal}
                disabled={!!updatingId}
                className="
                  flex-1 h-11 rounded-xl text-sm font-semibold
                  bg-gray-100 text-gray-700 hover:bg-gray-200
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition
                "
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={confirmDeleteUser}
                disabled={!!updatingId}
                className="
                  flex-1 h-11 rounded-xl text-sm font-semibold
                  bg-[#008236] text-white hover:bg-[#006f2e]
                  disabled:opacity-50 disabled:cursor-not-allowed
                  flex items-center justify-center gap-2
                  transition
                "
              >
                {updatingId ? (
                  <>
                    <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <FiTrash2 size={16} />
                    Yes, Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminUsers;