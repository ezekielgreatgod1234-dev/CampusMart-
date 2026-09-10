import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  collection,
  onSnapshot,
  doc,
  getDoc,
  query,
  orderBy,
  limit,
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
  FiShield,
  FiMessageCircle,
  FiSend,
  FiMail,
  FiRefreshCw,
  FiCheckCircle,
  FiAlertCircle,
} from "react-icons/fi";
import { db } from "../../context/firebase";
import { useAuth } from "../../context/AuthContext";

const ADMIN_EMAIL = "campusmart1234@gmail.com";
const BACKEND_URL = "https://campusbackend-1.onrender.com";

function AdminAnnouncements() {
  const navigate = useNavigate();
  const location = useLocation();
  const { firebaseUser } = useAuth();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [unreadSupportCount, setUnreadSupportCount] = useState(0);

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [mode, setMode] = useState("all");
  const [targetEmail, setTargetEmail] = useState("");
  const [showBanner, setShowBanner] = useState(true);

  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [history, setHistory] = useState([]);
  const [bannerActive, setBannerActive] = useState(false);

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

    (async () => {
      try {
        const snap = await getDoc(doc(db, "users", firebaseUser.uid));
        const data = snap.exists() ? snap.data() : {};
        const isAdmin =
          data.role === "admin" ||
          data.isAdmin === true ||
          (Array.isArray(data.roles) && data.roles.includes("admin"));
        setAllowed(!!isAdmin);
      } catch {
        setAllowed(false);
      } finally {
        setLoading(false);
      }
    })();
  }, [firebaseUser]);

  useEffect(() => {
    if (!allowed) return;
    return onSnapshot(collection(db, "supportMessages"), (snap) => {
      let unread = 0;
      snap.forEach((d) => {
        const data = d.data() || {};
        const isRead =
          data.read === true ||
          data.isRead === true ||
          String(data.status || "").toLowerCase() === "resolved";
        if (!isRead) unread += 1;
      });
      setUnreadSupportCount(unread);
    });
  }, [allowed]);

  useEffect(() => {
    if (!allowed) return;
    const q = query(
      collection(db, "announcements"),
      orderBy("createdAt", "desc"),
      limit(20)
    );
    return onSnapshot(
      q,
      (snap) => {
        setHistory(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      },
      () => setHistory([])
    );
  }, [allowed]);

  useEffect(() => {
    if (!allowed) return;
    return onSnapshot(doc(db, "settings", "liveBanner"), (snap) => {
      if (!snap.exists()) {
        setBannerActive(false);
        return;
      }
      setBannerActive(snap.data()?.active === true);
    });
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
      label: "Support Messages",
      icon: FiMessageCircle,
      path: "/admin/support-messages",
      badge: unreadSupportCount,
    },
    { label: "Announcements", icon: FiMail, path: "/admin/announcements" },
  ];

  const isActive = (path) => {
    if (path === "/admin-dashboard") return location.pathname === "/admin-dashboard";
    return location.pathname.startsWith(path);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!title.trim() || !body.trim()) {
      setError("Title and message are required.");
      return;
    }
    if (mode === "single" && !targetEmail.trim()) {
      setError("Enter the recipient email.");
      return;
    }
    if (!firebaseUser) {
      setError("Not signed in.");
      return;
    }

    try {
      setSending(true);
      const token = await firebaseUser.getIdToken();

      const res = await fetch(`${BACKEND_URL}/send-announcement-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: title.trim(),
          body: body.trim(),
          mode,
          email: mode === "single" ? targetEmail.trim().toLowerCase() : undefined,
          showBanner,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Send failed");

      if (mode === "single") {
        setSuccess(
          `Email sent to ${targetEmail.trim()}${
            showBanner ? " · In-app banner activated" : ""
          }`
        );
      } else {
        setSuccess(
          `Emails sent: ${data.sent || 0}${
            data.failed ? ` (${data.failed} failed)` : ""
          }${showBanner ? " · Banner activated for logged-in users" : ""}`
        );
      }

      setTitle("");
      setBody("");
      setTargetEmail("");
    } catch (err) {
      console.error(err);
      setError(err.message || "Could not send announcement.");
    } finally {
      setSending(false);
    }
  };

  const handleClearBanner = async () => {
    try {
      const token = await firebaseUser.getIdToken();
      const res = await fetch(`${BACKEND_URL}/clear-live-banner`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed");
      setSuccess("In-app banner cleared.");
    } catch (err) {
      setError(err.message || "Could not clear banner");
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="w-10 h-10 rounded-full border-4 border-green-100 border-t-green-600 animate-spin" />
      </div>
    );
  }

  if (!firebaseUser || !allowed) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-sm text-center bg-white rounded-2xl border p-8">
          <FiShield className="mx-auto text-red-500" size={28} />
          <h1 className="mt-3 font-bold text-gray-800">Access Denied</h1>
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
    <div className="h-screen w-full bg-gray-50 text-gray-800 overflow-hidden">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-[291px] bg-[#008236] text-white flex flex-col
          transition-transform duration-300
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        <div className="px-5 pt-6 pb-4 relative">
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden absolute top-3 right-3 w-9 h-9 rounded-lg hover:bg-white/10 flex items-center justify-center"
          >
            <FiX size={21} />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#006f2e] flex items-center justify-center border border-white/10">
              <span className="font-black text-sm">CM</span>
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
                onClick={() => {
                  setSidebarOpen(false);
                  navigate(path);
                }}
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
                  <span className="min-w-[20px] h-[20px] px-1.5 rounded-full text-[10px] font-bold flex items-center justify-center bg-red-500 text-white">
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
        <header className="min-h-[70px] bg-[#007233] text-white flex items-center px-4 sm:px-6 gap-3">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden w-10 h-10 rounded-lg hover:bg-white/10 flex items-center justify-center"
          >
            <FiMenu size={22} />
          </button>
          <div>
            <p className="text-sm font-semibold">Announcements</p>
            <p className="text-[11px] text-green-100">Email users + in-app banner</p>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          <div
            className={`rounded-2xl border p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${
              bannerActive ? "bg-green-50 border-green-100" : "bg-white border-gray-100"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white border border-green-100 text-[#008236] flex items-center justify-center">
                <FiMail size={18} />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">
                  In-app banner: {bannerActive ? "Active" : "Off"}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Logged-in users see a sliding notice to check email / spam
                </p>
              </div>
            </div>
            {bannerActive && (
              <button
                type="button"
                onClick={handleClearBanner}
                className="h-10 px-4 rounded-xl border border-green-200 text-[#008236] text-sm font-semibold hover:bg-white"
              >
                Clear banner
              </button>
            )}
          </div>

          <form
            onSubmit={handleSend}
            className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 shadow-sm space-y-4"
          >
            <h2 className="text-lg font-bold text-gray-900">Send announcement</h2>

            {error && (
              <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600 flex gap-2">
                <FiAlertCircle className="shrink-0 mt-0.5" size={16} />
                {error}
              </div>
            )}
            {success && (
              <div className="rounded-xl bg-green-50 border border-green-100 px-4 py-3 text-sm text-green-700 flex gap-2">
                <FiCheckCircle className="shrink-0 mt-0.5" size={16} />
                {success}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Recipients
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: "all", label: "All registered emails" },
                  { id: "single", label: "One specific email" },
                ].map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => setMode(o.id)}
                    className={`h-10 px-4 rounded-xl text-sm font-semibold transition ${
                      mode === o.id
                        ? "bg-[#008236] text-white"
                        : "bg-green-50 text-[#008236] border border-green-100"
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            {mode === "single" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email address
                </label>
                <input
                  type="email"
                  value={targetEmail}
                  onChange={(e) => setTargetEmail(e.target.value)}
                  placeholder="student@example.com"
                  className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-gray-50 text-sm outline-none focus:border-[#008236] focus:bg-white"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. New CampusMart update"
                className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-gray-50 text-sm outline-none focus:border-[#008236] focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Message
              </label>
              <textarea
                rows={5}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write the announcement users will receive by email..."
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm outline-none focus:border-[#008236] focus:bg-white resize-none"
              />
            </div>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={showBanner}
                onChange={(e) => setShowBanner(e.target.checked)}
                className="mt-1 accent-green-600"
              />
              <span className="text-sm text-gray-600">
                Also show floating banner when users log in (reminds them to check
                inbox + Junk/Spam). They dismiss it with <strong>Done</strong>.
              </span>
            </label>

            <button
              type="submit"
              disabled={sending}
              className="h-12 px-6 rounded-xl bg-[#008236] hover:bg-[#006f2e] disabled:opacity-60 text-white text-sm font-semibold inline-flex items-center gap-2 transition"
            >
              {sending ? (
                <>
                  <FiRefreshCw className="animate-spin" size={16} />
                  Sending...
                </>
              ) : (
                <>
                  <FiSend size={16} />
                  Send announcement
                </>
              )}
            </button>
          </form>

          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900 mb-3">
              Recent announcements
            </h3>
            {history.length === 0 ? (
              <p className="text-sm text-gray-500">No announcements yet.</p>
            ) : (
              <div className="space-y-3">
                {history.map((a) => (
                  <div key={a.id} className="rounded-xl border border-gray-100 px-4 py-3">
                    <p className="text-sm font-semibold text-gray-800">{a.title}</p>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{a.body}</p>
                    <p className="text-[11px] text-gray-400 mt-2">
                      {a.audience === "single"
                        ? `To: ${a.targetEmail || "—"}`
                        : `All · sent ${a.sentCount ?? "—"}`}
                      {a.showBanner ? " · Banner" : ""}
                    </p>
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