import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";

import {
  FiGrid,
  FiPackage,
  FiShoppingBag,
  FiCalendar,
  FiMessageCircle,
  FiDollarSign,
  FiTag,
  FiUser,
  FiSettings,
  FiLogOut,
  FiMenu,
  FiChevronDown,
  FiX,
  FiPlus,
  FiTrendingUp,
  FiClock,
  FiCheckCircle,
  FiCreditCard,
  FiRefreshCw,
  FiBriefcase,
  FiMapPin,
  FiTrash2,
  FiLoader,
  FiSearch,
} from "react-icons/fi";

import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  deleteDoc,
  orderBy,
} from "firebase/firestore";

import { db } from "../../context/firebase";
import { useAuth } from "../../context/AuthContext";

function SellerDashboard({ unreadMessages = 0, profile = {} }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { firebaseUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [salesPeriod, setSalesPeriod] = useState("week");

  // Restore gigs view when coming back from CreateGig / GigDetail
  const [activeView, setActiveView] = useState(
    location.state?.fromGigs ? "gigs" : "dashboard"
  );

  // Dashboard data
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [availableBalance, setAvailableBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  // Gigs data
  const [gigs, setGigs] = useState([]);
  const [gigsLoading, setGigsLoading] = useState(true);
  const [filterOpen, setFilterOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [activeTab, setActiveTab] = useState("my");

  const [deleteModal, setDeleteModal] = useState({
    open: false,
    gigId: null,
    title: "",
  });

  const [toast, setToast] = useState({
    open: false,
    message: "",
    type: "success",
  });

  const categories = [
    "All",
    "Programming",
    "Graphics",
    "Photography",
    "Tutoring",
    "Repairs",
    "Delivery",
    "Others",
  ];

  const search = searchParams.get("search") || "";
  const urlCategory = searchParams.get("category");
  const selectedCategory = categories.includes(urlCategory) ? urlCategory : "All";

  const sellerFullName =
    profile?.fullName ||
    profile?.name ||
    profile?.displayName ||
    firebaseUser?.displayName?.trim() ||
    "Seller";

  const sellerFirstName = String(sellerFullName).trim().split(/\s+/)[0] || "Seller";

  const sellerImage =
    profile?.profileImage ||
    profile?.photoURL ||
    profile?.profilePicture ||
    profile?.avatar ||
    profile?.imageUrl ||
    profile?.image ||
    firebaseUser?.photoURL ||
    null;

  const showToast = (message, type = "success") => {
    setToast({ open: true, message, type });
    window.setTimeout(() => {
      setToast({ open: false, message: "", type: "success" });
    }, 2800);
  };

  // ========== BALANCE ==========
  useEffect(() => {
    if (!firebaseUser?.uid) return;
    const unsub = onSnapshot(doc(db, "users", firebaseUser.uid), (snap) => {
      const data = snap.data() || {};
      setTotalEarnings(Number(data.totalEarnings) || 0);
      setAvailableBalance(Number(data.availableBalance) || 0);
    });
    return () => unsub();
  }, [firebaseUser?.uid]);

  // ========== ORDERS ==========
  useEffect(() => {
    if (!firebaseUser?.uid) {
      setOrders([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const q = query(collection(db, "orders"), where("sellerId", "==", firebaseUser.uid));
    const unsub = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((d) => {
        const data = d.data();
        const created = data.createdAt?.toDate?.() || (data.createdAt ? new Date(data.createdAt) : null);
        return {
          id: d.id,
          orderNumber: data.orderNumber || d.id,
          customer: data.customerName || data.fullName || data.customer?.fullName || "Customer",
          items: Array.isArray(data.items) ? data.items : [],
          total: Number(data.total) || 0,
          status: String(data.status || "pending").toLowerCase(),
          date: created
            ? created.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
            : data.date || "—",
          createdAt: created,
        };
      });
      list.sort((a, b) => (b.createdAt?.getTime?.() || 0) - (a.createdAt?.getTime?.() || 0));
      setOrders(list);
      setLoading(false);
    });
    return () => unsub();
  }, [firebaseUser?.uid]);

  // ========== PRODUCTS ==========
  useEffect(() => {
    if (!firebaseUser?.uid) {
      setProducts([]);
      return;
    }
    const q = query(collection(db, "products"), where("sellerId", "==", firebaseUser.uid));
    const unsub = onSnapshot(q, (snapshot) => {
      setProducts(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [firebaseUser?.uid]);

  // ========== ALL GIGS ==========
  useEffect(() => {
    setGigsLoading(true);
    const gigsQuery = query(collection(db, "gigs"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(
      gigsQuery,
      (snapshot) => {
        const loaded = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            ...data,
            applications: data.applicationsCount || 0,
          };
        });
        setGigs(loaded);
        setGigsLoading(false);
      },
      (error) => {
        console.error("Error loading gigs:", error);
        setGigs([]);
        setGigsLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // Restore gigs view + show success toast when coming back
  useEffect(() => {
    if (location.state?.fromGigs) {
      setActiveView("gigs");
    }
    if (location.state?.successMessage) {
      showToast(location.state.successMessage, "success");
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state]);

  // ========== COMPUTED ==========
  const visibleOrders = useMemo(
    () => orders.filter((o) => o.status !== "cancelled" && o.status !== "canceled"),
    [orders]
  );
  const pendingOrders = useMemo(
    () => visibleOrders.filter((o) => ["pending", "placed", "processing"].includes(o.status)),
    [visibleOrders]
  );
  const grossSales = useMemo(
    () => visibleOrders.reduce((s, o) => s + (o.total || 0), 0),
    [visibleOrders]
  );
  const activeProducts = useMemo(
    () => products.filter((p) => String(p.status || "Active").toLowerCase() === "active").length,
    [products]
  );
  const newOrdersCount = pendingOrders.length;

  const salesData = useMemo(() => {
    const now = new Date();
    if (salesPeriod === "month") {
      const months = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push({
          key: `${d.getFullYear()}-${d.getMonth()}`,
          day: d.toLocaleString("en-US", { month: "short" }),
          fullName: d.toLocaleString("en-US", { month: "long", year: "numeric" }),
          revenue: 0,
          value: 0,
        });
      }
      visibleOrders.forEach((order) => {
        if (!order.createdAt) return;
        const key = `${order.createdAt.getFullYear()}-${order.createdAt.getMonth()}`;
        const bucket = months.find((m) => m.key === key);
        if (bucket) {
          bucket.revenue += order.total || 0;
          bucket.value += 1;
        }
      });
      const maxRev = Math.max(...months.map((m) => m.revenue), 1);
      return months.map((m) => ({ ...m, value: Math.round((m.revenue / maxRev) * 100) || 0 }));
    }
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      days.push({
        key: d.toDateString(),
        day: d.toLocaleString("en-US", { weekday: "short" }),
        fullName: d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" }),
        revenue: 0,
        value: 0,
      });
    }
    visibleOrders.forEach((order) => {
      if (!order.createdAt) return;
      const key = new Date(
        order.createdAt.getFullYear(),
        order.createdAt.getMonth(),
        order.createdAt.getDate()
      ).toDateString();
      const bucket = days.find((x) => x.key === key);
      if (bucket) {
        bucket.revenue += order.total || 0;
        bucket.value += 1;
      }
    });
    const maxRev = Math.max(...days.map((d) => d.revenue), 1);
    return days.map((d) => ({ ...d, value: Math.round((d.revenue / maxRev) * 100) || 0 }));
  }, [visibleOrders, salesPeriod]);

  const chartRevenue = useMemo(
    () => salesData.reduce((s, d) => s + (d.revenue || 0), 0),
    [salesData]
  );

  const recentOrders = useMemo(() => {
    return visibleOrders.slice(0, 6).map((order) => {
      const firstItem = order.items[0];
      const productName =
        firstItem?.name ||
        firstItem?.productName ||
        (order.items.length > 1 ? `${order.items.length} items` : "Order items");
      const qty = order.items.reduce((s, i) => s + Number(i.quantity || 1), 0);
      const statusLabel =
        order.status === "delivered"
          ? "Delivered"
          : order.status === "cancelled"
          ? "Cancelled"
          : "Pending";
      return {
        id: `#${order.orderNumber || order.id.slice(0, 8).toUpperCase()}`,
        customer: order.customer,
        product: productName,
        quantity: qty,
        amount: `₦${Number(order.total || 0).toLocaleString("en-NG")}`,
        status: statusLabel,
        date: order.date,
      };
    });
  }, [visibleOrders]);

  const topProducts = useMemo(() => {
    const map = {};
    visibleOrders.forEach((order) => {
      (order.items || []).forEach((item) => {
        const name = item.name || item.productName || "Product";
        const price = Number(String(item.price || 0).replace(/[₦,]/g, ""));
        const qty = Number(item.quantity || 1);
        if (!map[name]) {
          map[name] = { name, category: item.category || "General", salesCount: 0, amount: 0 };
        }
        map[name].salesCount += qty;
        map[name].amount += price * qty;
      });
    });
    const list = Object.values(map).sort((a, b) => b.amount - a.amount);
    const max = list[0]?.amount || 1;
    return list.slice(0, 5).map((p) => ({
      name: p.name,
      category: p.category,
      sales: `${p.salesCount} sale${p.salesCount === 1 ? "" : "s"}`,
      amount: `₦${Number(p.amount).toLocaleString("en-NG")}`,
      percentage: Math.max(8, Math.round((p.amount / max) * 100)),
    }));
  }, [visibleOrders]);

  // Gigs filtering
  const filteredGigs = gigs.filter((gig) => {
    const title = String(gig.title || "").toLowerCase();
    const description = String(gig.description || "").toLowerCase();
    const category = String(gig.category || "").toLowerCase();
    const searchValue = search.toLowerCase().trim();
    const matchesCategory =
      selectedCategory === "All" || category === selectedCategory.toLowerCase();
    const matchesSearch =
      !searchValue ||
      title.includes(searchValue) ||
      description.includes(searchValue) ||
      category.includes(searchValue);
    return matchesCategory && matchesSearch && gig.status !== "cancelled";
  });

  const myGigs = filteredGigs.filter(
    (gig) => firebaseUser && gig.posterId === firebaseUser.uid
  );
  const otherGigs = filteredGigs.filter(
    (gig) => !firebaseUser || gig.posterId !== firebaseUser.uid
  );
  const displayedGigs = activeTab === "my" ? myGigs : otherGigs;

  // ========== MENU ==========
  const menuItems = useMemo(
    () => [
      { label: "Dashboard", icon: FiGrid, path: "/seller-dashboard" },
      { label: "Products", icon: FiPackage, path: "/seller/products" },
      { label: "Orders", icon: FiShoppingBag, path: "/seller/orders", badge: newOrdersCount },
      { label: "Messages", icon: FiMessageCircle, path: "/seller/messages", badge: unreadMessages },
      { label: "Earnings", icon: FiDollarSign, path: "/seller/earnings" },
      { label: "Promotions", icon: FiTag, path: "/seller/promotions", new: true },
      { label: "Profile", icon: FiUser, path: "/seller/profile" },
      { label: "Settings", icon: FiSettings, path: "/seller/settings" },
    ],
    [newOrdersCount, unreadMessages]
  );

  const isActive = (path) => {
    if (path === "/seller-dashboard") return location.pathname === "/seller-dashboard";
    return location.pathname.startsWith(path);
  };

  const handleNavigation = (path) => {
    setSidebarOpen(false);
    if (path === "/seller-dashboard") {
      setActiveView("dashboard");
    }
    navigate(path);
  };

  const handleLogout = () => {
    setSidebarOpen(false);
    navigate("/logout");
  };

  const formatNaira = (amount) => `₦${Number(amount || 0).toLocaleString("en-NG")}`;

  const formatDeadlineShort = (deadline) => {
    if (!deadline) return "No deadline";
    try {
      let date;
      if (deadline?.toDate) date = deadline.toDate();
      else if (deadline instanceof Date) date = deadline;
      else date = new Date(deadline);
      if (Number.isNaN(date.getTime())) return String(deadline);
      return date.toLocaleDateString("en-NG", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return String(deadline);
    }
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    const params = new URLSearchParams(searchParams);
    if (!value.trim()) params.delete("search");
    else params.set("search", value);
    setSearchParams(params);
  };

  const handleCategoryChange = (category) => {
    const params = new URLSearchParams(searchParams);
    if (category === "All") params.delete("category");
    else params.set("category", category);
    setSearchParams(params);
  };

  const clearFilters = () => {
    setSearchParams(new URLSearchParams());
    setFilterOpen(false);
  };

  const openDeleteModal = (e, gig) => {
    e.preventDefault();
    e.stopPropagation();
    setDeleteModal({
      open: true,
      gigId: gig.id,
      title: gig.title || "this gig",
    });
  };

  const closeDeleteModal = () => {
    if (deletingId) return;
    setDeleteModal({ open: false, gigId: null, title: "" });
  };

  const confirmDeleteGig = async () => {
    if (!deleteModal.gigId) return;
    setDeletingId(deleteModal.gigId);
    try {
      await deleteDoc(doc(db, "gigs", deleteModal.gigId));
      setDeleteModal({ open: false, gigId: null, title: "" });
      showToast("Gig deleted successfully.", "success");
    } catch (error) {
      console.error("Error deleting gig:", error);
      showToast("Failed to delete gig. Please try again.", "error");
    } finally {
      setDeletingId(null);
    }
  };

  // Graph helpers
  const graphWidth = 1000;
  const graphHeight = 280;
  const graphPaddingLeft = 30;
  const graphPaddingRight = 20;
  const graphPaddingTop = 24;
  const graphPaddingBottom = 36;
  const usableWidth = graphWidth - graphPaddingLeft - graphPaddingRight;
  const usableHeight = graphHeight - graphPaddingTop - graphPaddingBottom;

  const points = salesData.map((item, index) => {
    const x =
      graphPaddingLeft +
      (salesData.length === 1 ? usableWidth / 2 : (index / (salesData.length - 1)) * usableWidth);
    const y =
      graphPaddingTop +
      usableHeight -
      (Math.min(100, Number(item.value) || 0) / 100) * usableHeight;
    return { x, y, ...item };
  });

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath =
    points.length > 0
      ? `${linePath} L ${points[points.length - 1].x} ${graphPaddingTop + usableHeight} L ${points[0].x} ${graphPaddingTop + usableHeight} Z`
      : "";

  const statCards = [
    {
      label: "Total Orders",
      value: loading ? "…" : String(visibleOrders.length),
      sub: `${pendingOrders.length} pending`,
      icon: FiShoppingBag,
      iconBg: "bg-green-50",
      iconColor: "text-[#008236]",
    },
    {
      label: "Products",
      value: loading ? "…" : String(products.length),
      sub: `${activeProducts} active`,
      icon: FiPackage,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
    },
    {
      label: "Gross Sales",
      value: loading ? "…" : formatNaira(grossSales),
      sub: "Before 5% fee",
      icon: FiTrendingUp,
      iconBg: "bg-purple-50",
      iconColor: "text-purple-600",
    },
    {
      label: "Net Earnings",
      value: loading ? "…" : formatNaira(totalEarnings),
      sub: `${formatNaira(availableBalance)} available`,
      icon: FiCreditCard,
      iconBg: "bg-orange-50",
      iconColor: "text-orange-600",
    },
  ];

  // ========== GIG CARD ==========
  const GigCard = ({ gig, isOwner }) => (
    <div className="relative bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-md hover:border-green-200 transition-all duration-200">
      <div
        onClick={() => {
          navigate(`/gigs/${gig.id}`, {
            state: { fromSellerGigs: true },
          });
        }}
        className="block pr-10 cursor-pointer"
      >
        <div className="flex justify-between items-start gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-800 text-lg">{gig.title}</h3>
            <p className="text-gray-500 text-sm mt-1.5 line-clamp-2">{gig.description}</p>
          </div>
          <span className="shrink-0 text-xs font-medium bg-green-50 text-green-700 px-3 py-1 rounded-full">
            {gig.category}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-4 text-sm text-gray-500">
          <span className="flex items-center gap-1.5">
            <FiDollarSign size={14} className="text-green-600" />
            {formatNaira(gig.budget)}
          </span>
          <span className="flex items-center gap-1.5">
            <FiClock size={14} className="text-green-600" />
            {formatDeadlineShort(gig.deadline)}
          </span>
          <span className="flex items-center gap-1.5">
            <FiMapPin size={14} className="text-green-600" />
            {gig.location || "Campus"}
          </span>
          <span className="ml-auto text-gray-400 text-xs">
            {gig.applications} application{gig.applications !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {isOwner && (
        <button
          type="button"
          onClick={(e) => openDeleteModal(e, gig)}
          disabled={deletingId === gig.id}
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-green-50 text-[#008236] hover:bg-[#008236] hover:text-white border border-green-100 flex items-center justify-center transition disabled:opacity-50 z-10"
          title="Delete gig"
        >
          {deletingId === gig.id ? (
            <FiLoader size={16} className="animate-spin" />
          ) : (
            <FiTrash2 size={16} />
          )}
        </button>
      )}
    </div>
  );

  return (
    <div className="h-screen w-full bg-gray-50 text-gray-800 font-sans overflow-hidden">
      {/* Toast */}
      {toast.open && (
        <div
          className={`fixed top-4 right-4 z-[120] max-w-sm rounded-xl border px-4 py-3 shadow-lg text-sm font-medium ${
            toast.type === "error"
              ? "bg-red-50 border-red-100 text-red-700"
              : "bg-green-50 border-green-100 text-green-800"
          }`}
        >
          {toast.message}
        </div>
      )}

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* SIDEBAR */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50
          w-[291px] min-w-[285px] lg:w-[291px] lg:min-w-[250px]
          bg-green-700 text-white flex flex-col h-screen overflow-hidden
          shadow-2xl lg:shadow-none transition-transform duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        <div className="relative px-5 pt-19 lg:pt-5 pb-4 flex-shrink-0">
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden absolute top-3 right-3 w-9 h-9 rounded-lg text-white hover:bg-white/10 flex items-center justify-center z-20"
          >
            <FiX size={21} strokeWidth={2.5} />
          </button>
          <div className="flex items-center gap-3 pr-10">
            <div
              className="
                w-10
                h-10
                min-w-[40px]
                rounded-xl
                bg-[#006f2e]
                flex
                items-center
                justify-center
                shadow-lg
                shadow-black/30
                border
                border-white/10
                flex-shrink-0
              "
            >
             <span className="text-white text-[16px] font-black tracking-tight">
                CM
              </span>
            </div>
            <div className="min-w-0">
              <h1 className="text-[25px] font-extrabold tracking-tight leading-none whitespace-nowrap">
                <span className="text-white">Campus</span>
                <span className="text-green-300">Mart 2.0</span>
              </h1>
              <p className="text-[10px] text-green-100 mt-1">Sell. Connect. Grow.</p>
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
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-left transition-all ${
                  active ? "bg-white text-[#008236] shadow-sm font-semibold" : "text-white hover:bg-white/10"
                }`}
              >
                <Icon size={19} strokeWidth={active ? 2.5 : 2} className="flex-shrink-0" />
                <span className="flex-1 text-[14px]">{label}</span>
                {badge > 0 && (
                  <span className="min-w-[21px] h-[21px] px-1.5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                    {badge > 99 ? "99+" : badge}
                  </span>
                )}
                {isNew && (
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
                      active ? "bg-green-100 text-green-700" : "bg-green-500 text-white"
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
            className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-white hover:bg-white/10 text-left"
          >
            <FiLogOut size={19} />
            <span className="text-[14px]">Logout</span>
          </button>
        </div>

        <div className="px-4 pb-3">
          <div className="border border-green-300/30 bg-green-900/20 rounded-xl p-3.5 text-center">
            <div className="text-2xl mb-1">👑</div>
            <h3 className="font-bold text-sm">Go Premium</h3>
            <p className="text-[10px] text-green-100 leading-4 mt-1">
              Boost your products and reach more students.
            </p>
            <button
              type="button"
              onClick={() => handleNavigation("/seller/promotions")}
              className="w-full mt-2 h-9 rounded-lg bg-white text-[#008236] font-bold text-xs hover:bg-green-50"
            >
              Upgrade Now
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <div className="min-w-0 flex flex-col h-screen w-full lg:ml-[291px] lg:w-[calc(100%-291px)]">
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
            <span className="text-sm sm:text-base font-semibold">Your Store</span>
          </div>
          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            <button
              type="button"
              onClick={() => handleNavigation("/seller/messages")}
              className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full hover:bg-white/10 flex items-center justify-center"
            >
              <FiMessageCircle size={20} />
              {unreadMessages > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[17px] h-[17px] px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                  {unreadMessages}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => handleNavigation("/seller/profile")}
              className="flex items-center gap-2 hover:bg-white/10 rounded-lg px-1.5 py-1.5"
            >
              {sellerImage ? (
                <img
                  src={sellerImage}
                  alt={sellerFullName}
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover border-2 border-white/30"
                />
              ) : (
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center font-bold text-sm border-2 border-white/30">
                  {sellerFirstName?.charAt(0)?.toUpperCase()}
                </div>
              )}
              <div className="hidden sm:block text-left">
                <p className="text-xs font-bold max-w-[160px] truncate">{sellerFullName}</p>
                <p className="text-[10px] text-green-100">Seller</p>
              </div>
              <FiChevronDown size={16} className="hidden sm:block" />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-gray-50 px-3 sm:px-5 md:px-6 lg:px-8 py-5 sm:py-6 lg:py-8">
          {/* ===================== GIGS VIEW ===================== */}
          {activeView === "gigs" ? (
            <div className="space-y-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Campus Gigs</h1>
                  <p className="text-sm sm:text-base text-gray-500 mt-1">
                    Find jobs or post a gig for other students on campus.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                  <div className="relative w-full lg:w-72 xl:w-80">
                    <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={search}
                      onChange={handleSearchChange}
                      placeholder="Search gigs..."
                      className="w-full bg-white border border-gray-200 rounded-xl py-3 pl-11 pr-4 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveView("dashboard")}
                      className="inline-flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 px-4 py-3 rounded-xl text-sm font-medium transition whitespace-nowrap"
                    >
                      ← Dashboard
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        navigate("/gigs/create", {
                          state: { fromSellerGigs: true },
                        });
                      }}
                      className="inline-flex items-center justify-center gap-2 bg-[#008236] hover:bg-[#006f2e] text-white px-5 py-3 rounded-xl text-sm font-medium transition shadow-sm whitespace-nowrap"
                    >
                      <FiPlus size={18} />
                      Post a Gig
                    </button>
                  </div>
                </div>
              </div>

              {search && (
                <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-3">
                  <p className="text-sm text-green-700">
                    Search results for <span className="font-semibold">"{search}"</span> —{" "}
                    {filteredGigs.length} gig{filteredGigs.length !== 1 ? "s" : ""}
                  </p>
                </div>
              )}

              <section className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-gray-800">Categories</h2>
                  <span className="text-sm text-gray-500">
                    {gigs.length} {gigs.length === 1 ? "gig" : "gigs"}
                  </span>
                </div>
                <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2">
                  {categories.map((category) => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => handleCategoryChange(category)}
                      className={`shrink-0 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        selectedCategory === category
                          ? "bg-[#008236] text-white shadow-sm"
                          : "bg-gray-100 text-gray-600 hover:bg-green-50 hover:text-green-600"
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </section>

              <div className="bg-white rounded-2xl border border-gray-100 p-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("my")}
                  className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all ${
                    activeTab === "my"
                      ? "bg-[#008236] text-white shadow-sm"
                      : "bg-gray-50 text-gray-600 hover:bg-green-50 hover:text-green-700"
                  }`}
                >
                  My Gigs
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("other")}
                  className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all ${
                    activeTab === "other"
                      ? "bg-[#008236] text-white shadow-sm"
                      : "bg-gray-50 text-gray-600 hover:bg-green-50 hover:text-green-700"
                  }`}
                >
                  Other Campus Gigs
                </button>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setFilterOpen(true)}
                  className="px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-700 text-sm font-semibold hover:border-green-300 hover:bg-green-50 hover:text-green-700 transition"
                >
                  Filters
                </button>
              </div>

              {gigsLoading && (
                <section className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
                  <div className="w-10 h-10 mx-auto rounded-full border-4 border-green-100 border-t-green-600 animate-spin" />
                  <p className="text-sm text-gray-500 mt-4">Loading gigs...</p>
                </section>
              )}

              {!gigsLoading && displayedGigs.length > 0 && (
                <div className="grid gap-4">
                  {displayedGigs.map((gig) => (
                    <GigCard key={gig.id} gig={gig} isOwner={activeTab === "my"} />
                  ))}
                </div>
              )}

              {!gigsLoading && displayedGigs.length === 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
                  <div className="w-16 h-16 mx-auto rounded-full bg-gray-100 flex items-center justify-center">
                    <FiBriefcase size={26} className="text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 mt-4">
                    {activeTab === "my" ? "No gigs posted yet" : "No other gigs found"}
                  </h3>
                  <p className="text-gray-500 text-sm mt-2">
                    {activeTab === "my"
                      ? "You haven't posted any gigs yet. Create one to get started."
                      : search
                      ? `We couldn't find any gigs matching "${search}".`
                      : "There are no gigs from other students right now."}
                  </p>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-5">
                    {search && (
                      <button
                        type="button"
                        onClick={clearFilters}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-5 py-2.5 rounded-xl text-sm font-medium"
                      >
                        Clear Search
                      </button>
                    )}
                    {activeTab === "my" && (
                      <button
                        type="button"
                        onClick={() => {
                          navigate("/gigs/create", {
                            state: { fromSellerGigs: true },
                          });
                        }}
                        className="inline-flex items-center gap-2 bg-[#008236] hover:bg-[#006f2e] text-white px-5 py-2.5 rounded-xl text-sm font-medium"
                      >
                        <FiPlus size={16} />
                        Post a Gig
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* ===================== FULL ORIGINAL DASHBOARD ===================== */
            <>
              <section className="mb-6">
                <div className="bg-gradient-to-r from-[#007233] to-[#008f3f] rounded-2xl p-5 sm:p-6 lg:p-7 text-white relative overflow-hidden">
                  <div className="absolute -right-10 -top-16 w-48 h-48 rounded-full bg-white/10" />
                  <div className="absolute right-16 -bottom-24 w-40 h-40 rounded-full bg-white/5" />
                  <div className="relative z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-[11px] mb-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-300" />
                      Dashboard
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                      Welcome back, {sellerFirstName}
                    </h1>
                    <p className="text-sm sm:text-base text-green-50 mt-1.5 max-w-xl">
                      Live overview of your orders, products, and earnings.
                    </p>
                  </div>
                </div>
              </section>

              <section className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 mb-5 sm:mb-6">
                {statCards.map((card) => {
                  const Icon = card.icon;
                  return (
                    <div key={card.label} className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 shadow-sm">
                      <div className={`w-10 h-10 rounded-xl ${card.iconBg} ${card.iconColor} flex items-center justify-center`}>
                        <Icon size={18} />
                      </div>
                      <p className="text-[11px] sm:text-xs text-gray-500 mt-3 font-medium">{card.label}</p>
                      <p className="text-lg sm:text-2xl font-bold text-gray-900 mt-1 truncate">{card.value}</p>
                      <p className="text-[10px] sm:text-xs text-gray-400 mt-1">{card.sub}</p>
                    </div>
                  );
                })}
              </section>

              {/* Sales Graph */}
              <section className="mb-5 sm:mb-6">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="p-5 sm:p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <h2 className="text-base sm:text-lg font-bold text-gray-800">Sales overview</h2>
                      <p className="text-xs sm:text-sm text-gray-500 mt-1">
                        {salesPeriod === "week" ? "Revenue from the last 7 days" : "Revenue from the last 6 months"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="inline-flex rounded-xl border border-gray-200 bg-gray-50 p-1">
                        {["week", "month"].map((period) => (
                          <button
                            key={period}
                            type="button"
                            onClick={() => setSalesPeriod(period)}
                            className={`h-8 px-3 rounded-lg text-xs font-semibold capitalize transition ${
                              salesPeriod === period
                                ? "bg-[#008236] text-white"
                                : "text-gray-500 hover:text-[#008236]"
                            }`}
                          >
                            {period === "week" ? "7 days" : "6 months"}
                          </button>
                        ))}
                      </div>
                      <div className="hidden sm:block text-right">
                        <p className="text-[10px] text-gray-400 uppercase font-semibold">Period total</p>
                        <p className="text-sm font-bold text-[#008236]">{formatNaira(chartRevenue)}</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 sm:p-6">
                    {loading ? (
                      <div className="h-48 flex items-center justify-center text-gray-400 gap-2">
                        <FiRefreshCw className="animate-spin text-[#008236]" />
                        Loading sales…
                      </div>
                    ) : chartRevenue === 0 ? (
                      <div className="h-48 flex flex-col items-center justify-center text-gray-400">
                        <FiTrendingUp size={28} className="text-[#008236] mb-2" />
                        <p className="text-sm font-medium text-gray-500">No sales in this period yet</p>
                        <p className="text-xs mt-1">Orders will appear here after buyers pay.</p>
                      </div>
                    ) : (
                      <div className="relative w-full overflow-x-auto">
                        <svg
                          viewBox={`0 0 ${graphWidth} ${graphHeight}`}
                          className="w-full min-w-[480px] h-[220px] sm:h-[260px]"
                          preserveAspectRatio="none"
                        >
                          <defs>
                            <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#008236" stopOpacity="0.25" />
                              <stop offset="100%" stopColor="#008236" stopOpacity="0.02" />
                            </linearGradient>
                          </defs>
                          {[0, 25, 50, 75, 100].map((v) => {
                            const y = graphPaddingTop + usableHeight - (v / 100) * usableHeight;
                            return (
                              <line
                                key={v}
                                x1={graphPaddingLeft}
                                x2={graphWidth - graphPaddingRight}
                                y1={y}
                                y2={y}
                                stroke="#f3f4f6"
                                strokeWidth="1"
                              />
                            );
                          })}
                          {areaPath && <path d={areaPath} fill="url(#salesFill)" />}
                          {linePath && (
                            <path
                              d={linePath}
                              fill="none"
                              stroke="#008236"
                              strokeWidth="3"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          )}
                          {points.map((p) => (
                            <circle
                              key={p.key || p.day}
                              cx={p.x}
                              cy={p.y}
                              r="5"
                              fill="#fff"
                              stroke="#008236"
                              strokeWidth="2.5"
                            />
                          ))}
                        </svg>
                        <div className="flex justify-between px-2 sm:px-6 -mt-2">
                          {salesData.map((d) => (
                            <span
                              key={d.key || d.day}
                              className="text-[10px] sm:text-xs text-gray-400 font-medium"
                              title={d.fullName}
                            >
                              {d.day}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </section>

              <section className="grid grid-cols-1 xl:grid-cols-3 gap-5 sm:gap-6">
                {/* Recent Orders */}
                <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="p-5 sm:p-6 border-b border-gray-100 flex items-center justify-between gap-3">
                    <div>
                      <h2 className="text-base sm:text-lg font-bold text-gray-800">Recent Orders</h2>
                      <p className="text-xs sm:text-sm text-gray-500 mt-1">Latest paid orders from buyers.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleNavigation("/seller/orders")}
                      className="text-xs sm:text-sm font-semibold text-[#008236] hover:underline"
                    >
                      View all
                    </button>
                  </div>

                  {loading ? (
                    <div className="p-10 flex justify-center text-gray-400 gap-2">
                      <FiRefreshCw className="animate-spin text-[#008236]" />
                      Loading…
                    </div>
                  ) : recentOrders.length === 0 ? (
                    <div className="p-10 text-center">
                      <div className="w-12 h-12 mx-auto rounded-full bg-green-50 text-[#008236] flex items-center justify-center mb-3">
                        <FiShoppingBag size={20} />
                      </div>
                      <p className="text-sm font-medium text-gray-500">No orders yet</p>
                      <p className="text-xs text-gray-400 mt-1">
                        When buyers pay for your products, orders show here.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="hidden md:block overflow-x-auto">
                        <table className="w-full min-w-[700px]">
                          <thead>
                            <tr className="border-b border-gray-100 text-left">
                              {["Order", "Customer", "Product", "Date", "Qty", "Amount", "Status"].map((h) => (
                                <th key={h} className="px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase">
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {recentOrders.map((order) => (
                              <tr key={order.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                                <td className="px-4 py-4">
                                  <p className="text-sm font-semibold text-gray-800">{order.id}</p>
                                </td>
                                <td className="px-4 py-4">
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-full bg-green-50 text-[#008236] flex items-center justify-center text-xs font-bold">
                                      {order.customer.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="text-sm text-gray-600 whitespace-nowrap">{order.customer}</span>
                                  </div>
                                </td>
                                <td className="px-4 py-4">
                                  <p className="text-sm text-gray-700 max-w-[160px] truncate">{order.product}</p>
                                </td>
                                <td className="px-4 py-4">
                                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                    <FiCalendar size={13} className="text-gray-400" />
                                    {order.date}
                                  </div>
                                </td>
                                <td className="px-4 py-4 text-sm font-semibold text-gray-700">{order.quantity}</td>
                                <td className="px-4 py-4 text-sm font-semibold text-gray-800">{order.amount}</td>
                                <td className="px-4 py-4">
                                  <span
                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold ${
                                      order.status === "Delivered"
                                        ? "bg-green-50 text-green-700"
                                        : "bg-yellow-50 text-yellow-700"
                                    }`}
                                  >
                                    {order.status === "Delivered" ? <FiCheckCircle size={11} /> : <FiClock size={11} />}
                                    {order.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="md:hidden divide-y divide-gray-100">
                        {recentOrders.map((order) => (
                          <div key={order.id} className="p-4">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-xs font-bold text-[#008236]">{order.id}</p>
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-semibold ${
                                  order.status === "Delivered"
                                    ? "bg-green-50 text-green-700"
                                    : "bg-yellow-50 text-yellow-700"
                                }`}
                              >
                                {order.status}
                              </span>
                            </div>
                            <p className="text-sm font-semibold text-gray-800 mt-1.5">{order.product}</p>
                            <p className="text-xs text-gray-500 mt-1">{order.customer}</p>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-[10px] text-gray-400">{order.date}</span>
                              <span className="text-xs font-bold text-gray-800">{order.amount}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* Top Products */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="p-5 sm:p-6 border-b border-gray-100 flex items-center justify-between">
                    <div>
                      <h2 className="text-base sm:text-lg font-bold text-gray-800">Top Products</h2>
                      <p className="text-xs text-gray-500 mt-1">Based on paid orders</p>
                    </div>
                    <FiTrendingUp size={20} className="text-[#008236]" />
                  </div>
                  <div className="p-5 sm:p-6 space-y-5">
                    {topProducts.length === 0 ? (
                      <div className="py-8 text-center text-sm text-gray-400">No product sales yet</div>
                    ) : (
                      topProducts.map((product, index) => (
                        <div key={product.name}>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-green-50 text-[#008236] flex items-center justify-center font-bold flex-shrink-0">
                              {index + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-800 truncate">{product.name}</p>
                              <p className="text-[10px] text-gray-400 mt-0.5">
                                {product.category} • {product.sales}
                              </p>
                            </div>
                            <p className="text-xs font-bold text-gray-700 flex-shrink-0">{product.amount}</p>
                          </div>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mt-3 ml-[52px]">
                            <div
                              className="h-full rounded-full bg-[#008236]"
                              style={{ width: `${product.percentage}%` }}
                            />
                          </div>
                        </div>
                      ))
                    )}
                    <button
                      type="button"
                      onClick={() => handleNavigation("/seller/products")}
                      className="w-full h-10 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:border-green-200 hover:bg-green-50 hover:text-[#008236] transition"
                    >
                      Manage Products
                    </button>
                  </div>
                </div>
              </section>

              {/* Quick Actions */}
              <section className="mt-5 sm:mt-6">
                <h2 className="text-base sm:text-lg font-bold text-gray-800 mb-1">Quick Actions</h2>
                <p className="text-xs sm:text-sm text-gray-500 mb-4">Manage your store quickly.</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
                  {[
                    { label: "Add Product", path: "/seller/products", icon: FiPlus, bg: "bg-green-50", color: "text-[#008236]" },
                    { label: "View Orders", path: "/seller/orders", icon: FiShoppingBag, bg: "bg-purple-50", color: "text-purple-600" },
                    { label: "Earnings", path: "/seller/earnings", icon: FiDollarSign, bg: "bg-blue-50", color: "text-blue-600" },
                    { label: "Messages", path: "/seller/messages", icon: FiMessageCircle, bg: "bg-orange-50", color: "text-orange-600" },
                    { label: "Promotions", path: "/seller/promotions", icon: FiTag, bg: "bg-pink-50", color: "text-pink-600" },
                    { label: "Gigs", action: "gigs", icon: FiBriefcase, bg: "bg-teal-50", color: "text-teal-600" },
                  ].map(({ label, path, action, icon: Icon, bg, color }) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => {
                        if (action === "gigs") setActiveView("gigs");
                        else handleNavigation(path);
                      }}
                      className="bg-white border border-gray-100 rounded-2xl p-4 text-left shadow-sm hover:border-green-200 hover:shadow-md transition group"
                    >
                      <div className={`w-10 h-10 rounded-xl ${bg} ${color} flex items-center justify-center relative group-hover:scale-105 transition`}>
                        <Icon size={18} />
                        {label === "Messages" && unreadMessages > 0 && (
                          <span className="absolute -top-1 -right-1 min-w-[17px] h-[17px] rounded-full bg-red-500 text-white text-[8px] font-bold flex items-center justify-center">
                            {unreadMessages}
                          </span>
                        )}
                        {label === "View Orders" && newOrdersCount > 0 && (
                          <span className="absolute -top-1 -right-1 min-w-[17px] h-[17px] rounded-full bg-red-500 text-white text-[8px] font-bold flex items-center justify-center">
                            {newOrdersCount > 99 ? "99+" : newOrdersCount}
                          </span>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm font-semibold text-gray-800 mt-3">{label}</p>
                    </button>
                  ))}
                </div>
              </section>

              <div className="mt-6 rounded-2xl bg-green-50 border border-green-100 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white text-[#008236] flex items-center justify-center shadow-sm flex-shrink-0">
                    <FiCheckCircle size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">Your store is live</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Orders, earnings, and withdrawals update in real time.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleNavigation("/seller/earnings")}
                  className="h-9 px-4 rounded-lg bg-[#008236] text-white text-xs font-semibold hover:bg-[#006f2e] transition whitespace-nowrap"
                >
                  View Earnings
                </button>
              </div>
            </>
          )}
        </main>
      </div>

      {/* Filters drawer */}
      {filterOpen && (
        <div className="fixed inset-0 z-[100]">
          <div className="absolute inset-0 bg-black/40" onClick={() => setFilterOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-full sm:w-96 bg-white shadow-2xl p-6 overflow-y-auto">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Filters</h2>
                <p className="text-sm text-gray-500 mt-1">Refine your search</p>
              </div>
              <button
                type="button"
                onClick={() => setFilterOpen(false)}
                className="w-10 h-10 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center hover:bg-green-50 hover:text-green-600"
              >
                <FiX size={20} />
              </button>
            </div>
            <div className="mt-8">
              <h3 className="font-semibold text-gray-800">Category</h3>
              <div className="space-y-3 mt-4">
                {categories.map((category) => (
                  <label key={category} className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="radio"
                      name="category"
                      checked={selectedCategory === category}
                      onChange={() => handleCategoryChange(category)}
                      className="accent-green-600"
                    />
                    <span className="text-sm text-gray-600 group-hover:text-green-600">{category}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex gap-3 mt-10">
              <button
                type="button"
                onClick={clearFilters}
                className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl font-medium hover:bg-green-50 hover:border-green-200 hover:text-green-600"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => setFilterOpen(false)}
                className="flex-1 bg-[#008236] hover:bg-[#006f2e] text-white py-3 rounded-xl font-medium"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteModal.open && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={closeDeleteModal} />
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-100 p-6">
            <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mb-4">
              <FiTrash2 size={22} className="text-[#008236]" />
            </div>
            <h3 className="text-lg font-bold text-gray-800">Delete this gig?</h3>
            <p className="text-sm text-gray-600 leading-relaxed mt-2">
              This will permanently remove{" "}
              <span className="font-semibold text-gray-800">“{deleteModal.title}”</span> from
              CampusMart. This cannot be undone.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <button
                type="button"
                onClick={closeDeleteModal}
                disabled={!!deletingId}
                className="flex-1 py-3 border border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteGig}
                disabled={!!deletingId}
                className="flex-1 flex items-center justify-center gap-2 bg-[#008236] hover:bg-[#006f2e] disabled:bg-green-400 text-white font-medium py-3 rounded-xl transition shadow-sm disabled:cursor-not-allowed"
              >
                {deletingId ? (
                  <>
                    <FiLoader className="animate-spin" size={16} />
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

export default SellerDashboard;