import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import {
  collection,
  onSnapshot,
  doc,
  deleteDoc,
  updateDoc,
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
  FiMessageCircle,
  FiSearch,
  FiShield,
  FiTrash2,
  FiCheckCircle,
  FiXCircle,
  FiMail,
  FiUser,
  FiClock,
  FiChevronRight,
} from "react-icons/fi";

import { db } from "../../context/firebase";
import { useAuth } from "../../context/AuthContext";

const ADMIN_EMAIL = "campusmart1234@gmail.com";

function isMessageRead(item) {
  return (
    item?.read === true ||
    item?.isRead === true ||
    String(item?.status || "").toLowerCase() === "read" ||
    String(item?.status || "").toLowerCase() === "resolved"
  );
}

function AdminSupportMessage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { firebaseUser } = useAuth();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);

  const [messages, setMessages] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const [message, setMessage] = useState({
    show: false,
    type: "",
    text: "",
  });

  const [deleteModal, setDeleteModal] = useState({
    open: false,
    id: null,
  });

  const showMessage = (type, text) => {
    setMessage({ show: true, type, text });
    setTimeout(() => {
      setMessage({ show: false, type: "", text: "" });
    }, 4000);
  };

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

    const checkAccess = async () => {
      try {
        const snap = await getDoc(doc(db, "users", firebaseUser.uid));
        const role = snap.exists() ? snap.data()?.role : null;
        setAllowed(role === "admin");
      } catch (error) {
        console.error("Could not check admin role:", error);
        setAllowed(false);
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
  }, [firebaseUser]);

  // Load support messages
  useEffect(() => {
    if (!allowed || !firebaseUser) return;

    const unsubscribe = onSnapshot(
      collection(db, "supportMessages"),
      (snapshot) => {
        const list = snapshot.docs.map((item) => ({
          id: item.id,
          ...item.data(),
        }));

        list.sort((a, b) => {
          const aTime =
            a.createdAt?.toMillis?.() ||
            a.createdAt?.seconds * 1000 ||
            Date.parse(a.createdAt) ||
            0;
          const bTime =
            b.createdAt?.toMillis?.() ||
            b.createdAt?.seconds * 1000 ||
            Date.parse(b.createdAt) ||
            0;
          return bTime - aTime;
        });

        setMessages(list);
      },
      (error) => {
        console.error("Could not load support messages:", error);
        showMessage(
          "error",
          `Could not load support messages: ${
            error?.message || "Unknown Firestore error"
          }`
        );
      }
    );

    return () => unsubscribe();
  }, [allowed, firebaseUser]);

  const unreadCount = useMemo(() => {
    return messages.filter((m) => !isMessageRead(m)).length;
  }, [messages]);

  const filteredMessages = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return messages;

    return messages.filter((item) => {
      const haystack = [
        item.name,
        item.fullName,
        item.userName,
        item.email,
        item.userEmail,
        item.subject,
        item.message,
        item.userId,
        item.uid,
        item.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [messages, search]);

  const formatDate = (value) => {
    if (!value) return "—";
    try {
      const milliseconds =
        value?.toMillis?.() ||
        value?.seconds * 1000 ||
        Date.parse(value);

      if (!milliseconds || Number.isNaN(milliseconds)) return "—";

      return new Date(milliseconds).toLocaleString([], {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
    } catch {
      return "—";
    }
  };

  const getName = (item) =>
    item.fullName || item.name || item.userName || "CampusMart User";

  const getEmail = (item) =>
    item.userEmail || item.email || "No email provided";

  const getStatus = (item) => String(item.status || "pending").toLowerCase();

  // Open message → mark as read (clears red badge)
  const openMessage = async (item) => {
    if (!item?.id) return;

    setSelectedMessage(item);

    if (isMessageRead(item)) return;

    try {
      await updateDoc(doc(db, "supportMessages", item.id), {
        read: true,
        isRead: true,
        status: getStatus(item) === "resolved" ? "resolved" : "read",
        readAt: new Date(),
      });

      setMessages((prev) =>
        prev.map((m) =>
          m.id === item.id
            ? {
                ...m,
                read: true,
                isRead: true,
                status: getStatus(m) === "resolved" ? "resolved" : "read",
              }
            : m
        )
      );

      setSelectedMessage((prev) =>
        prev
          ? {
              ...prev,
              read: true,
              isRead: true,
              status: getStatus(prev) === "resolved" ? "resolved" : "read",
            }
          : null
      );
    } catch (error) {
      console.error("Could not mark message as read:", error);
    }
  };

  const closeMessage = () => {
    setSelectedMessage(null);
  };

  const markAsResolved = async (item) => {
    if (!item?.id) return;

    try {
      await updateDoc(doc(db, "supportMessages", item.id), {
        status: "resolved",
        read: true,
        isRead: true,
        resolvedAt: new Date(),
      });

      setMessages((prev) =>
        prev.map((m) =>
          m.id === item.id
            ? {
                ...m,
                status: "resolved",
                read: true,
                isRead: true,
              }
            : m
        )
      );

      setSelectedMessage((prev) =>
        prev
          ? {
              ...prev,
              status: "resolved",
              read: true,
              isRead: true,
            }
          : null
      );

      showMessage("success", "Support message marked as resolved.");
    } catch (error) {
      console.error("Could not resolve message:", error);
      showMessage(
        "error",
        `Could not update the message: ${
          error?.message || "Unknown Firestore error"
        }`
      );
    }
  };

  const openDeleteModal = (id) => {
    if (!id) return;
    setDeleteModal({ open: true, id });
  };

  const closeDeleteModal = () => {
    if (deletingId) return;
    setDeleteModal({ open: false, id: null });
  };

  const confirmDelete = async () => {
    const id = deleteModal.id;
    if (!id || deletingId) return;

    setDeletingId(id);

    try {
      await deleteDoc(doc(db, "supportMessages", id));

      setMessages((previous) => previous.filter((item) => item.id !== id));

      if (selectedMessage?.id === id) {
        setSelectedMessage(null);
      }

      setDeleteModal({ open: false, id: null });
      showMessage("success", "Support message deleted successfully.");
    } catch (error) {
      console.error("Delete support message error:", error);
      setDeleteModal({ open: false, id: null });
      showMessage(
        "error",
        `Could not delete the support message: ${
          error?.message || "Unknown Firestore error"
        }`
      );
    } finally {
      setDeletingId(null);
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
            You do not have permission to view Support Messages.
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
      {/* Toast */}
      {message.show && (
        <div className="fixed top-5 right-5 z-[100] w-[calc(100%-40px)] sm:w-[390px]">
          <div
            className={`
              rounded-2xl border shadow-2xl p-4 flex items-start gap-3 bg-white
              ${message.type === "success" ? "border-green-200" : "border-red-200"}
            `}
          >
            <div
              className={`
                w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
                ${
                  message.type === "success"
                    ? "bg-green-50 text-[#008236]"
                    : "bg-red-50 text-red-600"
                }
              `}
            >
              {message.type === "success" ? (
                <FiCheckCircle size={21} />
              ) : (
                <FiXCircle size={21} />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p
                className={`text-sm font-bold ${
                  message.type === "success" ? "text-[#006f2e]" : "text-red-700"
                }`}
              >
                {message.type === "success" ? "Success" : "Something went wrong"}
              </p>
              <p className="text-sm text-gray-500 mt-1 leading-5">
                {message.text}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setMessage({ show: false, type: "", text: "" })}
              className="text-gray-400 hover:text-gray-700 transition"
            >
              <FiX size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Delete modal */}
      {deleteModal.open && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
            onClick={deletingId ? undefined : closeDeleteModal}
          />

          <div className="relative w-full max-w-[430px] bg-white rounded-3xl shadow-2xl overflow-hidden">
            <div className="h-2 bg-[#008236]" />

            <div className="p-6 sm:p-7">
              <div className="w-14 h-14 rounded-2xl bg-green-50 text-[#008236] flex items-center justify-center mb-5">
                <FiTrash2 size={25} />
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-gray-900">
                Delete message?
              </h2>

              <p className="text-sm text-gray-500 leading-6 mt-3">
                Are you sure you want to permanently delete this support
                message?
              </p>

              <div className="flex flex-col-reverse sm:flex-row gap-3 mt-6">
                <button
                  type="button"
                  disabled={Boolean(deletingId)}
                  onClick={closeDeleteModal}
                  className="flex-1 h-11 rounded-xl border border-gray-200 bg-white text-gray-700 text-sm font-bold hover:bg-gray-50 transition disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={deletingId === deleteModal.id}
                  onClick={confirmDelete}
                  className="flex-1 h-11 rounded-xl bg-[#008236] text-white text-sm font-bold flex items-center justify-center gap-2 hover:bg-[#006f2e] transition disabled:opacity-60"
                >
                  {deletingId === deleteModal.id ? (
                    <>
                      <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <FiTrash2 size={15} />
                      Delete
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-[291px] bg-[#008236] text-white
          flex flex-col h-screen transition-transform duration-300 ease-in-out
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
          {menuItems.map(({ label, icon: Icon, path }) => {
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

                {label === "Support Messages" && unreadCount > 0 && (
                  <span className="min-w-[22px] h-[22px] px-1.5 rounded-full flex items-center justify-center text-[10px] font-bold bg-red-500 text-white">
                    {unreadCount > 99 ? "99+" : unreadCount}
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

      {/* Main */}
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
            <p className="text-sm font-semibold">Support Messages</p>
            <p className="text-[11px] text-green-100">
              Manage customer questions, complaints and suggestions
            </p>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="mb-5">
            <h1 className="text-2xl font-bold text-gray-900">
              Customer Support
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              View and manage messages sent to CampusMart support.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Total Messages</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    {messages.length}
                  </p>
                </div>
                <div className="w-11 h-11 rounded-xl bg-green-50 text-[#008236] flex items-center justify-center">
                  <FiMessageCircle size={20} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Unread / Pending</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    {unreadCount}
                  </p>
                </div>
                <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <FiClock size={20} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Resolved</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    {
                      messages.filter((item) => getStatus(item) === "resolved")
                        .length
                    }
                  </p>
                </div>
                <div className="w-11 h-11 rounded-xl bg-green-50 text-[#008236] flex items-center justify-center">
                  <FiCheckCircle size={20} />
                </div>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm mb-5">
            <div className="relative">
              <FiSearch
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, email, subject or message..."
                className="w-full h-11 pl-10 pr-4 rounded-xl border border-gray-200 bg-gray-50 text-sm outline-none focus:border-[#008236] focus:bg-white focus:ring-2 focus:ring-green-50"
              />
            </div>
          </div>

          {/* List */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {filteredMessages.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-green-50 text-[#008236] flex items-center justify-center">
                  <FiMail size={25} />
                </div>
                <h3 className="mt-4 font-bold text-gray-800">
                  No support messages
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {search
                    ? "No messages match your search."
                    : "Customer support messages will appear here."}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredMessages.map((item) => {
                  const status = getStatus(item);
                  const unread = !isMessageRead(item);

                  return (
                    <div
                      key={item.id}
                      className={`p-4 sm:p-5 hover:bg-gray-50 transition ${
                        unread ? "bg-green-50/30" : ""
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className="relative w-11 h-11 rounded-xl bg-green-50 text-[#008236] flex items-center justify-center flex-shrink-0">
                          <FiUser size={19} />
                          {unread && (
                            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500 border-2 border-white" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                            <div className="min-w-0">
                              <p className="font-bold text-gray-900 truncate">
                                {getName(item)}
                                {unread && (
                                  <span className="ml-2 text-[10px] font-bold text-red-500 uppercase">
                                    New
                                  </span>
                                )}
                              </p>
                              <p className="text-xs text-gray-500 mt-0.5 truncate">
                                {getEmail(item)}
                              </p>
                            </div>

                            <span
                              className={`
                                inline-flex items-center w-fit px-2.5 py-1 rounded-full
                                text-[10px] font-bold uppercase
                                ${
                                  status === "resolved"
                                    ? "bg-green-50 text-[#008236]"
                                    : unread
                                    ? "bg-red-50 text-red-600"
                                    : "bg-amber-50 text-amber-700"
                                }
                              `}
                            >
                              {status === "resolved"
                                ? "Resolved"
                                : unread
                                ? "Unread"
                                : "Read"}
                            </span>
                          </div>

                          <p className="text-sm font-semibold text-gray-800 mt-3">
                            {item.subject || "No subject"}
                          </p>

                          <p className="text-sm text-gray-500 mt-1 line-clamp-2 leading-5">
                            {item.message || "No message content."}
                          </p>

                          <p className="text-[11px] text-gray-400 mt-2">
                            {formatDate(item.createdAt)}
                          </p>

                          <div className="flex flex-wrap gap-2 mt-3">
                            <button
                              type="button"
                              onClick={() => openMessage(item)}
                              className="h-9 px-3 rounded-lg bg-green-50 text-[#008236] border border-green-100 text-xs font-semibold flex items-center gap-1.5 hover:bg-[#008236] hover:text-white transition"
                            >
                              View Message
                              <FiChevronRight size={14} />
                            </button>

                            {status !== "resolved" && (
                              <button
                                type="button"
                                onClick={() => markAsResolved(item)}
                                className="h-9 px-3 rounded-lg bg-white text-[#008236] border border-green-200 text-xs font-semibold flex items-center gap-1.5 hover:bg-green-50 transition"
                              >
                                <FiCheckCircle size={14} />
                                Mark Resolved
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => openDeleteModal(item.id)}
                              className="h-9 px-3 rounded-lg bg-white text-red-600 border border-red-100 text-xs font-semibold flex items-center gap-1.5 hover:bg-red-50 transition"
                            >
                              <FiTrash2 size={14} />
                              Delete
                            </button>
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

      {/* Message details modal */}
      {selectedMessage && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
            onClick={closeMessage}
          />

          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-3xl shadow-2xl">
            <div className="h-2 bg-[#008236]" />

            <div className="p-5 sm:p-7">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold text-[#008236] uppercase tracking-wide">
                    Support Message
                  </p>
                  <h2 className="text-xl sm:text-2xl font-black text-gray-900 mt-1">
                    {selectedMessage.subject || "No subject"}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={closeMessage}
                  className="w-10 h-10 rounded-xl bg-gray-50 text-gray-500 hover:bg-gray-100 flex items-center justify-center flex-shrink-0"
                >
                  <FiX size={19} />
                </button>
              </div>

              <div className="mt-6 rounded-2xl bg-gray-50 border border-gray-100 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-green-50 text-[#008236] flex items-center justify-center">
                    <FiUser size={19} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900">
                      {getName(selectedMessage)}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5 break-all">
                      {getEmail(selectedMessage)}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-gray-500">
                  <span className="flex items-center gap-1">
                    <FiClock size={13} />
                    {formatDate(selectedMessage.createdAt)}
                  </span>

                  <span
                    className={`
                      px-2 py-1 rounded-full font-semibold
                      ${
                        getStatus(selectedMessage) === "resolved"
                          ? "bg-green-100 text-[#008236]"
                          : "bg-amber-100 text-amber-700"
                      }
                    `}
                  >
                    {getStatus(selectedMessage) === "resolved"
                      ? "Resolved"
                      : isMessageRead(selectedMessage)
                      ? "Read"
                      : "Unread"}
                  </span>
                </div>
              </div>

              <div className="mt-6">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">
                  Message
                </p>
                <div className="mt-2 rounded-2xl border border-gray-100 bg-white p-5">
                  <p className="text-sm text-gray-700 leading-7 whitespace-pre-wrap">
                    {selectedMessage.message || "No message content."}
                  </p>
                </div>
              </div>

              {selectedMessage.userId && (
                <div className="mt-5">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">
                    User ID
                  </p>
                  <p className="mt-2 p-3 bg-gray-50 rounded-xl text-xs text-gray-500 font-mono break-all">
                    {selectedMessage.userId}
                  </p>
                </div>
              )}

              <div className="flex flex-col-reverse sm:flex-row gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => openDeleteModal(selectedMessage.id)}
                  className="h-11 px-5 rounded-xl border border-red-100 bg-red-50 text-red-600 text-sm font-bold flex items-center justify-center gap-2 hover:bg-red-100 transition"
                >
                  <FiTrash2 size={16} />
                  Delete
                </button>

                {getStatus(selectedMessage) !== "resolved" && (
                  <button
                    type="button"
                    onClick={() => markAsResolved(selectedMessage)}
                    className="flex-1 h-11 rounded-xl bg-[#008236] text-white text-sm font-bold flex items-center justify-center gap-2 hover:bg-[#006f2e] transition"
                  >
                    <FiCheckCircle size={16} />
                    Mark as Resolved
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminSupportMessage;