import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import {
  collection,
  onSnapshot,
  doc,
  deleteDoc,
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
  FiTrash2,
  FiAlertTriangle,
  FiCheckCircle,
  FiXCircle,
  FiMessageCircle,
  FiEye,
  FiBriefcase,
  FiUser,
  FiMail,
  FiPhone,
  FiMapPin,
  FiZap,
} from "react-icons/fi";

import { db } from "../../context/firebase";
import { useAuth } from "../../context/AuthContext";

const ADMIN_EMAIL = "campusmart1234@gmail.com";

// ================= HELPERS =================
const toMillis = (value) => {
  if (!value) return 0;
  if (typeof value.toMillis === "function") return value.toMillis();
  if (value.seconds) return value.seconds * 1000;
  if (typeof value === "number") return value;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const formatNaira = (n) => `₦${Number(n || 0).toLocaleString("en-NG")}`;

const formatDate = (value) => {
  const ms = toMillis(value);
  if (!ms) return "—";
  return new Date(ms).toLocaleDateString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const formatDateTime = (value) => {
  const ms = toMillis(value);
  if (!ms) return "—";
  return new Date(ms).toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

// Turns a Firestore document into one shape for products and services.
const normalizeListing = (docSnap, kind) => {
  const d = docSnap.data() || {};

  const images = [
    d.image,
    d.imageUrl,
    d.thumbnail,
    ...(Array.isArray(d.images) ? d.images : []),
  ].filter((src, index, arr) => src && arr.indexOf(src) === index);

  const promotedUntilMs = toMillis(d.promotedUntil);

  return {
    id: docSnap.id,
    kind,
    raw: d,
    name:
      d.name ||
      d.title ||
      d.productName ||
      (kind === "service" ? "Service" : "Product"),
    price: Number(d.price) || 0,
    category: d.category || "Uncategorized",
    description: d.description || "",
    images,
    image: images[0] || "",
    status: d.status || "Active",
    sellerId: d.sellerId || "",
    sellerName: d.sellerName || "",
    sellerEmail: d.sellerEmail || "",
    isVerifiedSeller: d.isVerifiedSeller === true,
    createdAt: d.createdAt || null,
    updatedAt: d.updatedAt || null,
    views: Number(d.views) || 0,
    sold:
      Number(d.salesCount) ||
      Number(d.sold) ||
      Number(d.quantitySold) ||
      Number(d.ordersCount) ||
      Number(d.sales) ||
      0,
    isPromoted: d.isPromoted === true && promotedUntilMs > Date.now(),
    promotedUntilMs,
  };
};

// Fields already shown in dedicated sections of the details modal.
const SHOWN_FIELDS = new Set([
  "name",
  "title",
  "productName",
  "price",
  "category",
  "description",
  "image",
  "imageUrl",
  "thumbnail",
  "images",
  "status",
  "sellerId",
  "sellerName",
  "sellerEmail",
  "isVerifiedSeller",
  "createdAt",
  "updatedAt",
  "views",
  "salesCount",
  "sold",
  "quantitySold",
  "ordersCount",
  "sales",
  "isPromoted",
  "promotedAt",
  "promotedUntil",
  "promotePlan",
  "promoteDays",
  "promoteAmount",
  "promotePaidVia",
  "promotePaystackRef",
  "type",
]);

const formatFieldValue = (value) => {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number") return String(value);
  if (typeof value === "string") return value;
  if (typeof value?.toMillis === "function" || value?.seconds) {
    return formatDateTime(value);
  }
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
};

const prettyKey = (key) =>
  key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/^./, (c) => c.toUpperCase());

function DetailRow({ label, children }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] uppercase tracking-wide text-gray-400">
        {label}
      </p>
      <div className="text-sm font-semibold text-gray-800 mt-0.5 break-words">
        {children}
      </div>
    </div>
  );
}

function KindBadge({ kind }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
        kind === "service"
          ? "bg-blue-50 text-blue-700 border border-blue-100"
          : "bg-green-50 text-[#008236] border border-green-100"
      }`}
    >
      {kind === "service" ? <FiBriefcase size={10} /> : <FiPackage size={10} />}
      {kind === "service" ? "Service" : "Product"}
    </span>
  );
}

function StatusBadge({ status }) {
  const s = String(status || "").toLowerCase();
  const tone =
    s === "active"
      ? "bg-green-50 text-green-700 border-green-100"
      : s === "out of stock" || s === "paused"
        ? "bg-amber-50 text-amber-700 border-amber-100"
        : "bg-gray-100 text-gray-500 border-gray-200";

  return (
    <span
      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${tone}`}
    >
      {status || "Active"}
    </span>
  );
}

function AdminProducts() {
  const navigate = useNavigate();
  const location = useLocation();
  const { firebaseUser } = useAuth();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);

  const [products, setProducts] = useState([]);
  const [services, setServices] = useState([]);
  const [productsLoaded, setProductsLoaded] = useState(false);
  const [servicesLoaded, setServicesLoaded] = useState(false);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all"); // all | product | service
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sellerFilter, setSellerFilter] = useState("all");
  const [deletingId, setDeletingId] = useState(null);
  const [unreadSupportCount, setUnreadSupportCount] = useState(0);

  const [deleteModal, setDeleteModal] = useState({
    open: false,
    itemId: null,
    kind: "product",
    itemName: "",
  });

  // Full-details modal
  const [detailItem, setDetailItem] = useState(null);
  const [activeImage, setActiveImage] = useState(0);
  const [sellerInfo, setSellerInfo] = useState(null);
  const [sellerInfoLoading, setSellerInfoLoading] = useState(false);

  const [message, setMessage] = useState({
    show: false,
    type: "",
    text: "",
  });

  const showMessage = (type, text) => {
    setMessage({ show: true, type, text });
    setTimeout(() => {
      setMessage({ show: false, type: "", text: "" });
    }, 4000);
  };

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
  // LOAD PRODUCTS + SERVICES + SUPPORT BADGE
  // =========================================================
  useEffect(() => {
    if (!allowed) return;

    const unsubProducts = onSnapshot(
      collection(db, "products"),
      (snap) => {
        setProducts(snap.docs.map((d) => normalizeListing(d, "product")));
        setProductsLoaded(true);
      },
      (error) => {
        console.error("Could not load products:", error);
        setProductsLoaded(true);
        showMessage("error", "Could not load products. Please try again.");
      }
    );

    const unsubServices = onSnapshot(
      collection(db, "services"),
      (snap) => {
        setServices(snap.docs.map((d) => normalizeListing(d, "service")));
        setServicesLoaded(true);
      },
      (error) => {
        console.error("Could not load services:", error);
        setServicesLoaded(true);
        showMessage(
          "error",
          "Could not load services. Please check your Firestore rules for the services collection."
        );
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
      unsubProducts();
      unsubServices();
      unsubSupport();
    };
  }, [allowed]);

  // One list of every seller listing, newest first
  const items = useMemo(() => {
    return [...products, ...services].sort(
      (a, b) => toMillis(b.createdAt) - toMillis(a.createdAt)
    );
  }, [products, services]);

  // Keep the open details modal in sync with live updates
  const liveDetail = useMemo(() => {
    if (!detailItem) return null;
    return (
      items.find((i) => i.id === detailItem.id && i.kind === detailItem.kind) ||
      detailItem
    );
  }, [items, detailItem]);

  // Load the seller's account details when the modal opens
  useEffect(() => {
    if (!detailItem?.sellerId) {
      setSellerInfo(null);
      return undefined;
    }

    let cancelled = false;
    setSellerInfoLoading(true);
    setSellerInfo(null);

    (async () => {
      try {
        const snap = await getDoc(doc(db, "users", detailItem.sellerId));
        if (cancelled) return;
        if (snap.exists()) {
          const u = snap.data() || {};
          const p = u.profile || {};
          setSellerInfo({
            name:
              u.storeName ||
              u.shopName ||
              u.fullName ||
              p.fullName ||
              u.name ||
              u.displayName ||
              "",
            email: u.email || p.email || "",
            phone: u.phone || p.phone || "",
            campus: u.campus || p.campus || "",
            address: u.address || p.address || "",
            verified: u.isVerifiedSeller === true,
          });
        }
      } catch (error) {
        console.warn("Could not load seller details:", error);
      } finally {
        if (!cancelled) setSellerInfoLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [detailItem?.id, detailItem?.sellerId]);

  const openDetails = (item) => {
    setActiveImage(0);
    setDetailItem(item);
  };

  const closeDetails = () => {
    setDetailItem(null);
    setSellerInfo(null);
  };

  // ================= FILTERS =================
  const itemsByType = useMemo(
    () =>
      typeFilter === "all"
        ? items
        : items.filter((item) => item.kind === typeFilter),
    [items, typeFilter]
  );

  const categories = useMemo(() => {
    const set = new Set();
    itemsByType.forEach((item) => {
      if (item.category) set.add(item.category);
    });
    return ["all", ...Array.from(set).sort()];
  }, [itemsByType]);

  const sellerOptions = useMemo(() => {
    const map = new Map();
    items.forEach((item) => {
      const id = item.sellerId || "unknown";
      if (!map.has(id)) {
        map.set(id, {
          id,
          name:
            item.sellerName ||
            (item.sellerId
              ? `Seller ${String(item.sellerId).slice(0, 6)}`
              : "Unknown seller"),
          count: 0,
        });
      }
      map.get(id).count += 1;
    });
    return Array.from(map.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, [items]);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();

    return itemsByType.filter((item) => {
      if (categoryFilter !== "all" && item.category !== categoryFilter) {
        return false;
      }

      if (
        sellerFilter !== "all" &&
        (item.sellerId || "unknown") !== sellerFilter
      ) {
        return false;
      }

      if (!q) return true;

      const haystack = [
        item.name,
        item.description,
        item.category,
        item.status,
        item.sellerName,
        item.sellerEmail,
        item.sellerId,
        item.id,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [itemsByType, search, categoryFilter, sellerFilter]);

  const stats = useMemo(() => {
    const sellers = new Set();
    let promoted = 0;
    items.forEach((item) => {
      if (item.sellerId) sellers.add(item.sellerId);
      if (item.isPromoted) promoted += 1;
    });
    return {
      products: products.length,
      services: services.length,
      sellers: sellers.size,
      promoted,
    };
  }, [items, products.length, services.length]);

  const topSelling = useMemo(
    () =>
      [...products]
        .sort((a, b) => b.sold - a.sold)
        .filter((item) => item.sold > 0)
        .slice(0, 5),
    [products]
  );

  // ================= DELETE =================
  const openDeleteModal = (item) => {
    if (!item?.id || deletingId) return;

    setDeleteModal({
      open: true,
      itemId: item.id,
      kind: item.kind,
      itemName: item.name || (item.kind === "service" ? "this service" : "this product"),
    });
  };

  const closeDeleteModal = () => {
    if (deletingId) return;
    setDeleteModal({ open: false, itemId: null, kind: "product", itemName: "" });
  };

  const confirmDelete = async () => {
    const { itemId, kind, itemName } = deleteModal;

    if (!itemId || deletingId) return;

    setDeletingId(itemId);

    try {
      await deleteDoc(
        doc(db, kind === "service" ? "services" : "products", itemId)
      );

      setDeleteModal({ open: false, itemId: null, kind: "product", itemName: "" });
      if (detailItem?.id === itemId) closeDetails();
      showMessage("success", `"${itemName}" was deleted successfully.`);
    } catch (error) {
      console.error("Delete listing error:", error);
      setDeleteModal({ open: false, itemId: null, kind: "product", itemName: "" });
      showMessage(
        "error",
        "Could not delete this listing. Please check your Firestore permissions."
      );
    } finally {
      setDeletingId(null);
    }
  };

  // ================= NAVIGATION =================
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
        <div className="max-w-sm text-center bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          <FiShield className="mx-auto text-red-500" size={28} />
          <h1 className="text-xl font-bold mt-3">Access Denied</h1>
          <p className="text-sm text-gray-500 mt-2">
            You do not have permission to access the admin products page.
          </p>
          <button
            type="button"
            onClick={() => navigate("/")}
            className="mt-5 h-11 px-6 rounded-xl bg-[#008236] text-white text-sm font-semibold hover:bg-[#006f2e] transition"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const listLoading = !productsLoaded || !servicesLoaded;

  const TYPE_TABS = [
    { id: "all", label: "All", count: items.length },
    { id: "product", label: "Products", count: stats.products },
    { id: "service", label: "Services", count: stats.services },
  ];

  return (
    <div className="h-screen w-full bg-gray-50 text-gray-800 font-sans overflow-hidden">
      {/* Toast */}
      {message.show && (
        <div className="fixed top-5 right-5 z-[120] w-[calc(100%-40px)] sm:w-[390px]">
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
        <div className="fixed inset-0 z-[110] flex items-center justify-center px-4">
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
                Delete {deleteModal.kind === "service" ? "service" : "product"}?
              </h2>

              <p className="text-sm text-gray-500 leading-6 mt-3">
                Are you sure you want to delete{" "}
                <span className="font-bold text-gray-800">
                  "{deleteModal.itemName}"
                </span>
                ?
              </p>

              <div className="mt-4 rounded-xl bg-green-50 border border-green-100 px-4 py-3 flex items-start gap-3">
                <FiAlertTriangle
                  className="text-[#008236] mt-0.5 flex-shrink-0"
                  size={17}
                />
                <p className="text-xs text-[#006f2e] leading-5">
                  This {deleteModal.kind === "service" ? "service" : "product"}{" "}
                  will be permanently removed from CampusMart. This action
                  cannot be undone.
                </p>
              </div>

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
                  disabled={deletingId === deleteModal.itemId}
                  onClick={confirmDelete}
                  className="flex-1 h-11 rounded-xl bg-[#008236] text-white text-sm font-bold flex items-center justify-center gap-2 hover:bg-[#006f2e] active:bg-[#005a26] transition shadow-lg shadow-green-900/10 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {deletingId === deleteModal.itemId ? (
                    <>
                      <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <FiTrash2 size={15} />
                      Delete {deleteModal.kind === "service" ? "Service" : "Product"}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FULL DETAILS MODAL */}
      {liveDetail && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4">
          <div className="absolute inset-0 bg-black/50" onClick={closeDetails} />

          <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden max-h-[92vh] flex flex-col">
            <div className="p-4 sm:p-5 border-b border-gray-100 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <KindBadge kind={liveDetail.kind} />
                  <StatusBadge status={liveDetail.status} />
                  {liveDetail.isPromoted && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-100">
                      <FiZap size={10} />
                      Promoted
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mt-2 break-words">
                  {liveDetail.name}
                </h3>
                <p className="text-xl font-black text-[#008236] mt-0.5">
                  {liveDetail.kind === "service" ? "From " : ""}
                  {formatNaira(liveDetail.price)}
                </p>
              </div>

              <button
                type="button"
                onClick={closeDetails}
                className="w-9 h-9 rounded-lg text-gray-400 hover:bg-gray-100 flex items-center justify-center shrink-0"
              >
                <FiX size={20} />
              </button>
            </div>

            <div className="overflow-y-auto p-4 sm:p-5 space-y-5">
              {/* Images */}
              <div>
                {liveDetail.images.length > 0 ? (
                  <>
                    <img
                      src={liveDetail.images[activeImage] || liveDetail.images[0]}
                      alt={liveDetail.name}
                      className="w-full max-h-[340px] object-contain rounded-xl border border-gray-100 bg-gray-50"
                    />
                    {liveDetail.images.length > 1 && (
                      <div className="flex gap-2 mt-2 overflow-x-auto">
                        {liveDetail.images.map((src, index) => (
                          <button
                            key={src}
                            type="button"
                            onClick={() => setActiveImage(index)}
                            className={`w-16 h-16 rounded-lg overflow-hidden border-2 shrink-0 ${
                              activeImage === index
                                ? "border-[#008236]"
                                : "border-transparent"
                            }`}
                          >
                            <img
                              src={src}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="w-full h-40 rounded-xl bg-green-50 text-[#008236] flex flex-col items-center justify-center gap-2">
                    {liveDetail.kind === "service" ? (
                      <FiBriefcase size={30} />
                    ) : (
                      <FiPackage size={30} />
                    )}
                    <span className="text-xs">No image uploaded</span>
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <p className="text-[11px] uppercase tracking-wide text-gray-400">
                  Description
                </p>
                <p className="text-sm text-gray-700 leading-6 mt-1 whitespace-pre-wrap break-words">
                  {liveDetail.description || "No description provided."}
                </p>
              </div>

              {/* Listing details */}
              <div className="rounded-xl border border-gray-100 p-4">
                <p className="text-xs font-bold text-gray-800 mb-3">
                  Listing details
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <DetailRow label="Type">
                    {liveDetail.kind === "service" ? "Service" : "Product"}
                  </DetailRow>
                  <DetailRow label="Category">{liveDetail.category}</DetailRow>
                  <DetailRow label="Status">{liveDetail.status}</DetailRow>
                  <DetailRow label="Price">
                    {formatNaira(liveDetail.price)}
                  </DetailRow>
                  <DetailRow label="Views">{liveDetail.views}</DetailRow>
                  <DetailRow label={liveDetail.kind === "service" ? "Bookings" : "Sold"}>
                    {liveDetail.sold}
                  </DetailRow>
                  <DetailRow label="Listed">
                    {formatDateTime(liveDetail.createdAt)}
                  </DetailRow>
                  <DetailRow label="Last updated">
                    {formatDateTime(liveDetail.updatedAt)}
                  </DetailRow>
                  <DetailRow label="Listing ID">
                    <span className="font-mono text-xs">{liveDetail.id}</span>
                  </DetailRow>
                </div>
              </div>

              {/* Promotion */}
              {(liveDetail.raw.isPromoted === true ||
                liveDetail.raw.promotedUntil) && (
                <div className="rounded-xl border border-amber-100 bg-amber-50/40 p-4">
                  <p className="text-xs font-bold text-gray-800 mb-3 flex items-center gap-1.5">
                    <FiZap size={13} className="text-amber-600" />
                    Promotion
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <DetailRow label="Currently promoted">
                      {liveDetail.isPromoted ? "Yes" : "No (expired)"}
                    </DetailRow>
                    <DetailRow label="Plan">
                      {liveDetail.raw.promotePlan || "—"}
                    </DetailRow>
                    <DetailRow label="Amount paid">
                      {formatNaira(liveDetail.raw.promoteAmount)}
                    </DetailRow>
                    <DetailRow label="Paid via">
                      {liveDetail.raw.promotePaidVia || "—"}
                    </DetailRow>
                    <DetailRow label="Started">
                      {formatDateTime(liveDetail.raw.promotedAt)}
                    </DetailRow>
                    <DetailRow label="Ends">
                      {formatDateTime(liveDetail.raw.promotedUntil)}
                    </DetailRow>
                    {liveDetail.raw.promotePaystackRef && (
                      <div className="col-span-2 sm:col-span-3">
                        <DetailRow label="Paystack reference">
                          <span className="font-mono text-xs">
                            {liveDetail.raw.promotePaystackRef}
                          </span>
                        </DetailRow>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Seller */}
              <div className="rounded-xl border border-gray-100 p-4">
                <p className="text-xs font-bold text-gray-800 mb-3 flex items-center gap-1.5">
                  <FiUser size={13} className="text-[#008236]" />
                  Seller
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <DetailRow label="Name">
                    {sellerInfo?.name ||
                      liveDetail.sellerName ||
                      (liveDetail.sellerId
                        ? `Seller ${String(liveDetail.sellerId).slice(0, 6)}`
                        : "Unknown")}
                    {(liveDetail.isVerifiedSeller || sellerInfo?.verified) && (
                      <span className="ml-2 px-1.5 py-0.5 rounded-full bg-green-50 text-[#008236] border border-green-100 text-[10px] font-bold">
                        Verified
                      </span>
                    )}
                  </DetailRow>
                  <DetailRow label="Seller ID">
                    <span className="font-mono text-xs">
                      {liveDetail.sellerId || "—"}
                    </span>
                  </DetailRow>
                  <DetailRow label="Email">
                    <span className="inline-flex items-center gap-1.5">
                      <FiMail size={12} className="text-gray-400" />
                      {sellerInfo?.email || liveDetail.sellerEmail || "—"}
                    </span>
                  </DetailRow>
                  <DetailRow label="Phone">
                    <span className="inline-flex items-center gap-1.5">
                      <FiPhone size={12} className="text-gray-400" />
                      {sellerInfoLoading ? "Loading…" : sellerInfo?.phone || "—"}
                    </span>
                  </DetailRow>
                  <DetailRow label="Campus">
                    <span className="inline-flex items-center gap-1.5">
                      <FiMapPin size={12} className="text-gray-400" />
                      {sellerInfoLoading ? "Loading…" : sellerInfo?.campus || "—"}
                    </span>
                  </DetailRow>
                  <DetailRow label="Address">
                    {sellerInfoLoading ? "Loading…" : sellerInfo?.address || "—"}
                  </DetailRow>
                </div>

                {liveDetail.sellerId && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setSellerFilter(liveDetail.sellerId);
                        setTypeFilter("all");
                        setCategoryFilter("all");
                        closeDetails();
                      }}
                      className="h-9 px-3 rounded-lg text-xs font-semibold bg-green-50 text-[#008236] border border-green-100 hover:bg-green-100"
                    >
                      See all listings by this seller
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        navigate(`/admin/orders?seller=${liveDetail.sellerId}`)
                      }
                      className="h-9 px-3 rounded-lg text-xs font-semibold bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
                    >
                      View seller orders
                    </button>
                  </div>
                )}
              </div>

              {/* Everything else stored on the listing */}
              {(() => {
                const extras = Object.entries(liveDetail.raw || {}).filter(
                  ([key, value]) =>
                    !SHOWN_FIELDS.has(key) &&
                    value !== undefined &&
                    value !== null &&
                    value !== ""
                );

                if (extras.length === 0) return null;

                return (
                  <div className="rounded-xl border border-gray-100 p-4">
                    <p className="text-xs font-bold text-gray-800 mb-3">
                      Other saved details
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {extras.map(([key, value]) => (
                        <DetailRow key={key} label={prettyKey(key)}>
                          <span className="whitespace-pre-wrap">
                            {formatFieldValue(value)}
                          </span>
                        </DetailRow>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="p-4 border-t border-gray-100 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
              <button
                type="button"
                onClick={closeDetails}
                className="h-10 px-4 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => openDeleteModal(liveDetail)}
                className="h-10 px-4 rounded-xl bg-[#008236] text-white text-sm font-semibold flex items-center justify-center gap-2 hover:bg-[#006f2e]"
              >
                <FiTrash2 size={15} />
                Delete {liveDetail.kind === "service" ? "service" : "product"}
              </button>
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

      {/* SIDEBAR */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-[291px] bg-[#008236] text-white
          flex flex-col h-screen transition-transform duration-300
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
            <p className="text-sm font-semibold">Products & Services</p>
            <p className="text-[11px] text-green-100">
              Every listing from every seller, in full detail
            </p>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
          {/* Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {[
              { label: "Products", value: stats.products },
              { label: "Services", value: stats.services },
              { label: "Sellers listing", value: stats.sellers },
              { label: "Promoted now", value: stats.promoted },
            ].map((s) => (
              <div
                key={s.label}
                className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm"
              >
                <p className="text-xs text-gray-500">{s.label}</p>
                <p className="text-2xl font-bold mt-1 text-[#008236]">
                  {s.value}
                </p>
              </div>
            ))}
          </div>

          {topSelling.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 shadow-sm">
              <h2 className="text-sm font-bold text-gray-800 mb-3">
                Top selling products
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {topSelling.map((product, index) => (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => openDetails(product)}
                    className="text-left rounded-xl border border-green-100 bg-green-50/40 p-3 hover:bg-green-50"
                  >
                    <p className="text-[11px] text-[#008236] font-semibold">
                      #{index + 1}
                    </p>
                    <p className="text-sm font-semibold text-gray-800 mt-1 truncate">
                      {product.name}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {product.sold} sold · {formatNaira(product.price)}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 shadow-sm space-y-4">
            <div className="flex flex-wrap gap-2">
              {TYPE_TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setTypeFilter(tab.id);
                    setCategoryFilter("all");
                  }}
                  className={`h-10 px-4 rounded-xl text-sm font-semibold transition ${
                    typeFilter === tab.id
                      ? "bg-[#008236] text-white"
                      : "bg-green-50 text-[#008236] border border-green-100 hover:bg-green-100"
                  }`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search name, seller, email, category, description..."
                  className="w-full h-11 pl-10 pr-4 rounded-xl border border-gray-200 bg-gray-50 text-sm outline-none focus:border-[#008236] focus:bg-white focus:ring-2 focus:ring-green-50"
                />
              </div>

              <select
                value={sellerFilter}
                onChange={(e) => setSellerFilter(e.target.value)}
                className="h-11 px-3 rounded-xl border border-gray-200 bg-gray-50 text-sm outline-none focus:border-[#008236] sm:w-64"
              >
                <option value="all">All sellers ({sellerOptions.length})</option>
                {sellerOptions.map((seller) => (
                  <option key={seller.id} value={seller.id}>
                    {seller.name} ({seller.count})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setCategoryFilter(category)}
                  className={`
                    h-9 px-3 rounded-xl text-xs font-semibold transition capitalize
                    ${
                      categoryFilter === category
                        ? "bg-[#008236] text-white"
                        : "bg-green-50 text-[#008236] border border-green-100 hover:bg-green-100"
                    }
                  `}
                >
                  {category === "all" ? "All categories" : category}
                </button>
              ))}
            </div>
          </div>

          {/* Listings */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {listLoading ? (
              <div className="p-10 text-center">
                <div className="w-9 h-9 mx-auto rounded-full border-4 border-green-100 border-t-green-600 animate-spin" />
                <p className="text-sm text-gray-500 mt-3">Loading listings...</p>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="p-10 text-center text-sm text-gray-500">
                No listings found.
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredItems.map((item) => (
                  <div
                    key={`${item.kind}-${item.id}`}
                    className="p-4 sm:p-5 flex flex-col lg:flex-row gap-4"
                  >
                    <div className="flex gap-3 flex-1 min-w-0">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-20 h-20 rounded-xl object-cover border border-gray-100 flex-shrink-0"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-xl bg-green-50 text-[#008236] flex items-center justify-center flex-shrink-0">
                          {item.kind === "service" ? (
                            <FiBriefcase size={24} />
                          ) : (
                            <FiPackage size={24} />
                          )}
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-gray-900 truncate max-w-full">
                            {item.name}
                          </p>
                          <KindBadge kind={item.kind} />
                          <StatusBadge status={item.status} />
                          {item.isPromoted && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-100">
                              <FiZap size={10} />
                              Promoted
                            </span>
                          )}
                        </div>

                        <p className="text-sm text-[#008236] font-bold mt-0.5">
                          {item.kind === "service" ? "From " : ""}
                          {formatNaira(item.price)}
                        </p>

                        <p className="text-xs text-gray-500 mt-1">
                          {item.category}
                          {" · "}
                          <span className="font-medium text-gray-700">
                            {item.sellerName ||
                              (item.sellerId
                                ? `Seller ${String(item.sellerId).slice(0, 6)}`
                                : "Unknown seller")}
                          </span>
                          {item.sellerEmail ? ` · ${item.sellerEmail}` : ""}
                        </p>

                        {item.description && (
                          <p className="text-xs text-gray-500 mt-1 max-h-8 overflow-hidden">
                            {item.description}
                          </p>
                        )}

                        <p className="text-xs text-gray-400 mt-1">
                          Listed {formatDate(item.createdAt)} · {item.views}{" "}
                          views
                          {item.sold > 0 &&
                            ` · ${item.sold} ${
                              item.kind === "service" ? "booked" : "sold"
                            }`}
                        </p>
                      </div>
                    </div>

                    <div className="flex lg:flex-col gap-2 lg:items-end lg:justify-center shrink-0">
                      <button
                        type="button"
                        onClick={() => openDetails(item)}
                        className="h-9 px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 bg-[#008236] text-white hover:bg-[#006f2e] transition"
                      >
                        <FiEye size={14} />
                        Full details
                      </button>

                      <button
                        type="button"
                        disabled={deletingId === item.id}
                        onClick={() => openDeleteModal(item)}
                        className="
                          h-9 px-3 rounded-lg text-xs font-semibold
                          flex items-center gap-1.5
                          bg-green-50 text-[#008236] border border-green-200
                          hover:bg-[#008236] hover:text-white hover:border-[#008236]
                          active:bg-[#006f2e] transition
                          disabled:opacity-50 disabled:cursor-not-allowed
                        "
                      >
                        {deletingId === item.id ? (
                          <>
                            <span className="w-3.5 h-3.5 rounded-full border-2 border-[#008236]/30 border-t-[#008236] animate-spin" />
                            Deleting...
                          </>
                        ) : (
                          <>
                            <FiTrash2 size={14} />
                            Delete
                          </>
                        )}
                      </button>
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

export default AdminProducts;