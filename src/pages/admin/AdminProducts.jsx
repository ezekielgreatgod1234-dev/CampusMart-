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
} from "react-icons/fi";

import { db } from "../../context/firebase";
import { useAuth } from "../../context/AuthContext";

const ADMIN_EMAIL = "campusmart1234@gmail.com";

function AdminProducts() {
  const navigate = useNavigate();
  const location = useLocation();
  const { firebaseUser } = useAuth();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);

  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [deletingId, setDeletingId] = useState(null);
  const [unreadSupportCount, setUnreadSupportCount] = useState(0);

  const [deleteModal, setDeleteModal] = useState({
    open: false,
    productId: null,
    productName: "",
  });

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

  // Load products + support badge
  useEffect(() => {
    if (!allowed) return;

    const unsubProducts = onSnapshot(
      collection(db, "products"),
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

        setProducts(list);
      },
      (error) => {
        console.error("Could not load products:", error);
        showMessage("error", "Could not load products. Please try again.");
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
      unsubSupport();
    };
  }, [allowed]);

  const categories = useMemo(() => {
    const set = new Set();
    products.forEach((product) => {
      if (product.category) set.add(product.category);
    });
    return ["all", ...Array.from(set).sort()];
  }, [products]);

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();

    return products.filter((product) => {
      if (categoryFilter !== "all" && product.category !== categoryFilter) {
        return false;
      }

      if (!q) return true;

      const haystack = [
        product.name,
        product.title,
        product.productName,
        product.description,
        product.category,
        product.sellerName,
        product.sellerId,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [products, search, categoryFilter]);

  const topSelling = useMemo(() => {
    return [...products]
      .map((product) => ({
        ...product,
        sold:
          Number(product.salesCount) ||
          Number(product.sold) ||
          Number(product.quantitySold) ||
          Number(product.ordersCount) ||
          0,
      }))
      .sort((a, b) => b.sold - a.sold)
      .slice(0, 5);
  }, [products]);

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

      return new Date(ms).toLocaleDateString([], {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "—";
    }
  };

  const openDeleteModal = (productId, productName) => {
    if (!productId || deletingId) return;

    setDeleteModal({
      open: true,
      productId,
      productName: productName || "this product",
    });
  };

  const closeDeleteModal = () => {
    if (deletingId) return;
    setDeleteModal({ open: false, productId: null, productName: "" });
  };

  const confirmDelete = async () => {
    const productId = deleteModal.productId;
    const productName = deleteModal.productName || "this product";

    if (!productId || deletingId) return;

    setDeletingId(productId);

    try {
      await deleteDoc(doc(db, "products", productId));

      setDeleteModal({ open: false, productId: null, productName: "" });
      showMessage("success", `"${productName}" was deleted successfully.`);
    } catch (error) {
      console.error("Delete product error:", error);
      setDeleteModal({ open: false, productId: null, productName: "" });
      showMessage(
        "error",
        "Could not delete the product. Please check your Firestore permissions."
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
                Delete product?
              </h2>

              <p className="text-sm text-gray-500 leading-6 mt-3">
                Are you sure you want to delete{" "}
                <span className="font-bold text-gray-800">
                  "{deleteModal.productName}"
                </span>
                ?
              </p>

              <div className="mt-4 rounded-xl bg-green-50 border border-green-100 px-4 py-3 flex items-start gap-3">
                <FiAlertTriangle
                  className="text-[#008236] mt-0.5 flex-shrink-0"
                  size={17}
                />
                <p className="text-xs text-[#006f2e] leading-5">
                  This product will be permanently removed from CampusMart. This
                  action cannot be undone.
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
                  disabled={deletingId === deleteModal.productId}
                  onClick={confirmDelete}
                  className="flex-1 h-11 rounded-xl bg-[#008236] text-white text-sm font-bold flex items-center justify-center gap-2 hover:bg-[#006f2e] active:bg-[#005a26] transition shadow-lg shadow-green-900/10 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {deletingId === deleteModal.productId ? (
                    <>
                      <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <FiTrash2 size={15} />
                      Delete Product
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
            <p className="text-sm font-semibold">Products</p>
            <p className="text-[11px] text-green-100">
              Manage all products on CampusMart
            </p>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
          {topSelling.some((product) => product.sold > 0) && (
            <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 shadow-sm">
              <h2 className="text-sm font-bold text-gray-800 mb-3">
                Top selling products
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {topSelling
                  .filter((product) => product.sold > 0)
                  .map((product, index) => (
                    <div
                      key={product.id}
                      className="rounded-xl border border-green-100 bg-green-50/40 p-3"
                    >
                      <p className="text-[11px] text-[#008236] font-semibold">
                        #{index + 1}
                      </p>
                      <p className="text-sm font-semibold text-gray-800 mt-1 truncate">
                        {product.name ||
                          product.title ||
                          product.productName ||
                          "Product"}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {product.sold} sold · {formatNaira(product.price)}
                      </p>
                    </div>
                  ))}
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 shadow-sm space-y-4">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search product, seller, category..."
                className="w-full h-11 pl-10 pr-4 rounded-xl border border-gray-200 bg-gray-50 text-sm outline-none focus:border-[#008236] focus:bg-white focus:ring-2 focus:ring-green-50"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setCategoryFilter(category)}
                  className={`
                    h-10 px-4 rounded-xl text-sm font-semibold transition capitalize
                    ${
                      categoryFilter === category
                        ? "bg-[#008236] text-white"
                        : "bg-green-50 text-[#008236] border border-green-100 hover:bg-green-100"
                    }
                  `}
                >
                  {category === "all" ? "All" : category}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {filteredProducts.length === 0 ? (
              <div className="p-10 text-center text-sm text-gray-500">
                No products found.
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredProducts.map((product) => {
                  const name =
                    product.name ||
                    product.title ||
                    product.productName ||
                    "Product";

                  const image =
                    product.image ||
                    product.imageUrl ||
                    product.thumbnail ||
                    (Array.isArray(product.images)
                      ? product.images[0]
                      : null);

                  return (
                    <div
                      key={product.id}
                      className="p-4 sm:p-5 flex flex-col sm:flex-row gap-4"
                    >
                      <div className="flex gap-3 flex-1 min-w-0">
                        {image ? (
                          <img
                            src={image}
                            alt={name}
                            className="w-16 h-16 rounded-xl object-cover border border-gray-100 flex-shrink-0"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-xl bg-green-50 text-[#008236] flex items-center justify-center flex-shrink-0">
                            <FiPackage size={22} />
                          </div>
                        )}

                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 truncate">
                            {name}
                          </p>
                          <p className="text-sm text-[#008236] font-bold mt-0.5">
                            {formatNaira(product.price)}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {product.category || "Uncategorized"}
                            {product.sellerName
                              ? ` · ${product.sellerName}`
                              : product.sellerId
                              ? ` · Seller ${String(product.sellerId).slice(0, 6)}`
                              : ""}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            Listed {formatDate(product.createdAt)}
                            {(product.salesCount ||
                              product.sold ||
                              product.quantitySold) &&
                              ` · ${
                                product.salesCount ||
                                product.sold ||
                                product.quantitySold
                              } sold`}
                          </p>
                        </div>
                      </div>

                      <div className="flex sm:items-center sm:justify-end">
                        <button
                          type="button"
                          disabled={deletingId === product.id}
                          onClick={() => openDeleteModal(product.id, name)}
                          className="
                            h-9 px-3 rounded-lg text-xs font-semibold
                            flex items-center gap-1.5
                            bg-green-50 text-[#008236] border border-green-200
                            hover:bg-[#008236] hover:text-white hover:border-[#008236]
                            active:bg-[#006f2e] transition
                            disabled:opacity-50 disabled:cursor-not-allowed
                          "
                        >
                          {deletingId === product.id ? (
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

export default AdminProducts;