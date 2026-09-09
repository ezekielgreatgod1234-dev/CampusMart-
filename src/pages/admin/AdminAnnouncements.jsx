import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import {
  collection,
  onSnapshot,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  orderBy,
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
  FiShield,
  FiSend,
  FiTrash2,
  FiBell,
  FiCheckCircle,
  FiUserPlus,
  FiSave,
  FiAlertCircle,
} from "react-icons/fi";

import { db } from "../../context/firebase";
import { useAuth } from "../../context/AuthContext";

const ADMIN_EMAIL = "campusmart1234@gmail.com";

function AdminAnnouncements() {
  const navigate = useNavigate();
  const location = useLocation();
  const { firebaseUser } = useAuth();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [unreadSupportCount, setUnreadSupportCount] = useState(0);

  const [announcements, setAnnouncements] = useState([]);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const [sendSuccess, setSendSuccess] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  // Broadcast form
  const [form, setForm] = useState({
    title: "",
    body: "",
    audience: "all", // all | buyers | sellers (in-app)
    delivery: "email", // email | inapp | both
    mode: "all", // all | single  (for email)
    targetEmail: "",
  });

  // Welcome message for new users
  const [welcomeForm, setWelcomeForm] = useState({
    enabled: true,
    title: "Welcome to CampusMart 👋",
    body: "Thanks for joining CampusMart! Browse products, chat sellers, and enjoy secure campus shopping.",
  });
  const [welcomeSaving, setWelcomeSaving] = useState(false);
  const [welcomeMsg, setWelcomeMsg] = useState("");

  // Access
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
        const data = snap.exists() ? snap.data() : {};
        setAllowed(
          data.role === "admin" ||
            data.isAdmin === true ||
            (Array.isArray(data.roles) && data.roles.includes("admin"))
        );
      } catch {
        setAllowed(false);
      } finally {
        setLoading(false);
      }
    };
    check();
  }, [firebaseUser]);

  // Load announcements + support badge + welcome settings
  useEffect(() => {
    if (!allowed) return;

    const unsubAnn = onSnapshot(
      query(collection(db, "announcements"), orderBy("createdAt", "desc")),
      (snap) => {
        setAnnouncements(
          snap.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          }))
        );
      },
      (err) => console.error("announcements:", err)
    );

    const unsubSupport = onSnapshot(collection(db, "supportMessages"), (snap) => {
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
    });

    const loadWelcome = async () => {
      try {
        const snap = await getDoc(doc(db, "settings", "welcomeMessage"));
        if (snap.exists()) {
          const d = snap.data() || {};
          setWelcomeForm({
            enabled: d.enabled !== false,
            title: d.title || "Welcome to CampusMart 👋",
            body:
              d.body ||
              "Thanks for joining CampusMart! Browse products, chat sellers, and enjoy secure campus shopping.",
          });
        }
      } catch (e) {
        console.warn("welcome settings:", e);
      }
    };
    loadWelcome();

    return () => {
      unsubAnn();
      unsubSupport();
    };
  }, [allowed]);

  const menuItems = [
    { label: "Overview", icon: FiGrid, path: "/admin-dashboard" },
    { label: "Users", icon: FiUsers, path: "/admin/users" },
    { label: "Products", icon: FiPackage, path: "/admin/products" },
    { label: "Orders", icon: FiShoppingBag, path: "/admin/orders" },
    { label: "Platform Fees", icon: FiDollarSign, path: "/admin/fees" },
    { label: "Withdrawals", icon: FiCreditCard, path: "/admin/withdrawals" },
    { label: "Payments", icon: FiTrendingUp, path: "/admin/payments" },
    {
      label: "Announcements",
      icon: FiBell,
      path: "/admin/announcements",
    },
    {
      label: "Support Messages",
      icon: FiMessageCircle,
      path: "/admin/support-messages",
      badge: unreadSupportCount,
    },
  ];

  const isActive = (path) => {
    if (path === "/admin-dashboard") return location.pathname === "/admin-dashboard";
    return location.pathname.startsWith(path);
  };

  const handleNavigation = (path) => {
    setSidebarOpen(false);
    navigate(path);
  };

  const formatDate = (value) => {
    if (!value) return "—";
    try {
      const ms =
        value?.toMillis?.() || value?.seconds * 1000 || Date.parse(value);
      if (!ms || Number.isNaN(ms)) return "—";
      return new Date(ms).toLocaleString([], {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "—";
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((c) => ({ ...c, [name]: value }));
    setSendError("");
    setSendSuccess("");
  };

  const BACKEND_URL = "https://campusbackend-1.onrender.com";

  const handleSendBroadcast = async () => {
    setSendError("");
    setSendSuccess("");

    const title = form.title.trim();
    const body = form.body.trim();
    const delivery = form.delivery || "email";
    const mode = form.mode || "all";
    const targetEmail = (form.targetEmail || "").trim().toLowerCase();

    if (!title) {
      setSendError("Please enter a title.");
      return;
    }
    if (!body) {
      setSendError("Please enter a message.");
      return;
    }
    if ((delivery === "email" || delivery === "both") && mode === "single" && !targetEmail) {
      setSendError("Enter the email address to send to.");
      return;
    }
    if (!firebaseUser?.uid) {
      setSendError("Not signed in.");
      return;
    }

    try {
      setSending(true);
      const results = [];

      // ---- REAL EMAIL via backend ----
      if (delivery === "email" || delivery === "both") {
        const token = await firebaseUser.getIdToken();
        const res = await fetch(`${BACKEND_URL}/send-announcement-email`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title,
            body,
            mode: mode === "single" ? "single" : "all",
            email: mode === "single" ? targetEmail : undefined,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.error || "Email send failed");
        }
        if (mode === "single") {
          results.push(`Email sent to ${targetEmail}`);
        } else {
          results.push(
            `Emails sent: ${data.sent || 0}` +
              (data.failed ? ` (${data.failed} failed)` : "")
          );
        }
      }

      // ---- IN-APP announcement (Firestore) ----
      if (delivery === "inapp" || delivery === "both") {
        await addDoc(collection(db, "announcements"), {
          title,
          body,
          audience: form.audience || "all",
          type: "broadcast",
          active: true,
          createdBy: firebaseUser.uid,
          createdByEmail: firebaseUser.email || ADMIN_EMAIL,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        results.push("In-app announcement posted");
      }

      setForm({
        title: "",
        body: "",
        audience: "all",
        delivery: "email",
        mode: "all",
        targetEmail: "",
      });
      setSendSuccess(results.join(" · ") || "Sent successfully.");
    } catch (err) {
      console.error(err);
      setSendError(err.message || "Could not send message. Try again.");
    } finally {
      setSending(false);
    }
  };

  const handleSaveWelcome = async () => {
    setWelcomeMsg("");
    const title = welcomeForm.title.trim();
    const body = welcomeForm.body.trim();

    if (!title || !body) {
      setWelcomeMsg("Title and body are required.");
      return;
    }

    try {
      setWelcomeSaving(true);
      await updateDoc(doc(db, "settings", "welcomeMessage"), {
        enabled: welcomeForm.enabled,
        title,
        body,
        updatedAt: serverTimestamp(),
        updatedBy: firebaseUser?.uid || null,
      }).catch(async () => {
        // doc may not exist yet
        const { setDoc } = await import("firebase/firestore");
        await setDoc(doc(db, "settings", "welcomeMessage"), {
          enabled: welcomeForm.enabled,
          title,
          body,
          updatedAt: serverTimestamp(),
          updatedBy: firebaseUser?.uid || null,
        });
      });
      setWelcomeMsg("Welcome message saved.");
    } catch (err) {
      console.error(err);
      try {
        const { setDoc } = await import("firebase/firestore");
        await setDoc(
          doc(db, "settings", "welcomeMessage"),
          {
            enabled: welcomeForm.enabled,
            title,
            body,
            updatedAt: serverTimestamp(),
            updatedBy: firebaseUser?.uid || null,
          },
          { merge: true }
        );
        setWelcomeMsg("Welcome message saved.");
      } catch (e2) {
        console.error(e2);
        setWelcomeMsg("Could not save welcome message. Check rules.");
      }
    } finally {
      setWelcomeSaving(false);
    }
  };

  const handleDeactivate = async (id) => {
    if (!id) return;
    setDeletingId(id);
    try {
      await updateDoc(doc(db, "announcements", id), {
        active: false,
        updatedAt: serverTimestamp(),
      });
    } catch (e) {
      console.error(e);
      alert("Could not update announcement.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleDelete = async (id) => {
    if (!id) return;
    if (!window.confirm("Delete this announcement permanently?")) return;
    setDeletingId(id);
    try {
      await deleteDoc(doc(db, "announcements", id));
    } catch (e) {
      console.error(e);
      alert("Could not delete.");
    } finally {
      setDeletingId(null);
    }
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
        <div className="max-w-sm text-center bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
          <div className="w-14 h-14 mx-auto rounded-full bg-red-50 text-red-500 flex items-center justify-center mb-4">
            <FiShield size={24} />
          </div>
          <h1 className="text-xl font-bold text-gray-800">Access Denied</h1>
          <button
            type="button"
            onClick={() => navigate("/admin-dashboard")}
            className="mt-6 h-11 px-6 rounded-xl bg-[#008236] text-white text-sm font-semibold"
          >
            Return to Dashboard
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

      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-[291px]
          bg-[#008236] text-white flex flex-col h-screen
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
                  ${active ? "bg-white text-[#008236] font-semibold" : "text-white hover:bg-white/10"}
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
            <p className="text-sm font-semibold">Announcements</p>
            <p className="text-[11px] text-green-100">
              Message all users · Welcome new users
            </p>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {/* ========== WELCOME MESSAGE ========== */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
            <div className="flex items-start gap-3 mb-5">
              <div className="w-11 h-11 rounded-xl bg-green-50 text-[#008236] flex items-center justify-center flex-shrink-0">
                <FiUserPlus size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Welcome message (new users)
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  Sent once when a new user registers. Edit the text below.
                </p>
              </div>
            </div>

            <label className="flex items-center gap-2 mb-4 cursor-pointer">
              <input
                type="checkbox"
                checked={welcomeForm.enabled}
                onChange={(e) =>
                  setWelcomeForm((c) => ({ ...c, enabled: e.target.checked }))
                }
                className="accent-[#008236] w-4 h-4"
              />
              <span className="text-sm font-medium text-gray-700">
                Enable welcome message for new users
              </span>
            </label>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Title
                </label>
                <input
                  type="text"
                  value={welcomeForm.title}
                  onChange={(e) =>
                    setWelcomeForm((c) => ({ ...c, title: e.target.value }))
                  }
                  className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-gray-50 text-sm outline-none focus:border-[#008236] focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Message
                </label>
                <textarea
                  rows={4}
                  value={welcomeForm.body}
                  onChange={(e) =>
                    setWelcomeForm((c) => ({ ...c, body: e.target.value }))
                  }
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm outline-none resize-none focus:border-[#008236] focus:bg-white"
                />
              </div>
            </div>

            {welcomeMsg && (
              <p
                className={`mt-3 text-sm ${
                  welcomeMsg.includes("Could") ? "text-red-600" : "text-[#008236]"
                }`}
              >
                {welcomeMsg}
              </p>
            )}

            <button
              type="button"
              disabled={welcomeSaving}
              onClick={handleSaveWelcome}
              className="mt-4 h-11 px-5 rounded-xl bg-[#008236] text-white text-sm font-semibold flex items-center gap-2 hover:bg-[#006f2e] disabled:opacity-60"
            >
              <FiSave size={16} />
              {welcomeSaving ? "Saving..." : "Save welcome message"}
            </button>
          </div>

          {/* ========== BROADCAST ========== */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
            <div className="flex items-start gap-3 mb-5">
              <div className="w-11 h-11 rounded-xl bg-green-50 text-[#008236] flex items-center justify-center flex-shrink-0">
                <FiBell size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Send message to users
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  Broadcast to all users, buyers only, or sellers only.
                </p>
              </div>
            </div>

            {sendError && (
              <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-600">
                <FiAlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                {sendError}
              </div>
            )}
            {sendSuccess && (
              <div className="mb-4 flex items-start gap-2 rounded-xl border border-green-100 bg-green-50 p-3 text-sm text-[#008236]">
                <FiCheckCircle size={16} className="mt-0.5 flex-shrink-0" />
                {sendSuccess}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Delivery
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: "email", label: "Email only" },
                    { id: "inapp", label: "In-app only" },
                    { id: "both", label: "Email + In-app" },
                  ].map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => setForm((c) => ({ ...c, delivery: a.id }))}
                      className={`
                        h-10 px-4 rounded-xl text-sm font-semibold transition
                        ${
                          form.delivery === a.id
                            ? "bg-[#008236] text-white"
                            : "bg-green-50 text-[#008236] border border-green-100"
                        }
                      `}
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>

              {(form.delivery === "email" || form.delivery === "both") && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Email recipients
                  </label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {[
                      { id: "all", label: "All registered emails" },
                      { id: "single", label: "One specific email" },
                    ].map((a) => (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => setForm((c) => ({ ...c, mode: a.id }))}
                        className={`
                          h-10 px-4 rounded-xl text-sm font-semibold transition
                          ${
                            form.mode === a.id
                              ? "bg-[#008236] text-white"
                              : "bg-green-50 text-[#008236] border border-green-100"
                          }
                        `}
                      >
                        {a.label}
                      </button>
                    ))}
                  </div>
                  {form.mode === "single" && (
                    <input
                      type="email"
                      name="targetEmail"
                      value={form.targetEmail}
                      onChange={handleFormChange}
                      placeholder="user@example.com"
                      className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-gray-50 text-sm outline-none focus:border-[#008236] focus:bg-white"
                    />
                  )}
                </div>
              )}

              {(form.delivery === "inapp" || form.delivery === "both") && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  In-app audience
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: "all", label: "Everyone" },
                    { id: "buyers", label: "Buyers only" },
                    { id: "sellers", label: "Sellers only" },
                  ].map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => setForm((c) => ({ ...c, audience: a.id }))}
                      className={`
                        h-10 px-4 rounded-xl text-sm font-semibold transition
                        ${
                          form.audience === a.id
                            ? "bg-[#008236] text-white"
                            : "bg-green-50 text-[#008236] border border-green-100"
                        }
                      `}
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Title
                </label>
                <input
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={handleFormChange}
                  placeholder="e.g. Maintenance notice"
                  maxLength={120}
                  className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-gray-50 text-sm outline-none focus:border-[#008236] focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Message
                </label>
                <textarea
                  name="body"
                  rows={5}
                  value={form.body}
                  onChange={handleFormChange}
                  placeholder="Write your message to users..."
                  maxLength={2000}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm outline-none resize-none focus:border-[#008236] focus:bg-white"
                />
              </div>
            </div>

            <button
              type="button"
              disabled={sending}
              onClick={handleSendBroadcast}
              className="mt-4 h-11 px-5 rounded-xl bg-[#008236] text-white text-sm font-semibold flex items-center gap-2 hover:bg-[#006f2e] disabled:opacity-60"
            >
              <FiSend size={16} />
              {sending ? "Sending..." : "Send to users"}
            </button>
          </div>

          {/* ========== HISTORY ========== */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">Sent messages</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {announcements.length} announcement
                {announcements.length === 1 ? "" : "s"}
              </p>
            </div>

            {announcements.length === 0 ? (
              <div className="p-10 text-center text-sm text-gray-500">
                No announcements yet.
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {announcements.map((a) => (
                  <div key={a.id} className="p-4 sm:p-5">
                    <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-gray-900">
                            {a.title || "Untitled"}
                          </p>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-50 text-[#008236]">
                            {a.audience === "buyers"
                              ? "Buyers"
                              : a.audience === "sellers"
                                ? "Sellers"
                                : "Everyone"}
                          </span>
                          {a.active === false && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                              Inactive
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">
                          {a.body}
                        </p>
                        <p className="text-xs text-gray-400 mt-2">
                          {formatDate(a.createdAt)}
                        </p>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        {a.active !== false && (
                          <button
                            type="button"
                            disabled={deletingId === a.id}
                            onClick={() => handleDeactivate(a.id)}
                            className="h-9 px-3 rounded-lg text-xs font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50"
                          >
                            Hide
                          </button>
                        )}
                        <button
                          type="button"
                          disabled={deletingId === a.id}
                          onClick={() => handleDelete(a.id)}
                          className="h-9 px-3 rounded-lg text-xs font-semibold bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 flex items-center gap-1"
                        >
                          <FiTrash2 size={13} />
                          Delete
                        </button>
                      </div>
                    </div>
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

export default AdminAnnouncements;