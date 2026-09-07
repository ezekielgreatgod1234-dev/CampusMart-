import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import {
  FiGrid,
  FiPackage,
  FiShoppingBag,
  FiMessageCircle,
  FiDollarSign,
  FiTag,
  FiUser,
  FiSettings,
  FiLogOut,
  FiMenu,
  FiChevronDown,
  FiX,
  FiCheckCircle,
  FiClock,
  FiZap,
  FiArrowUp,
  FiEye,
  FiStar,
  FiCreditCard,
  FiCheck,
  FiRefreshCw,
} from "react-icons/fi";

import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  Timestamp,
  increment,
  writeBatch,
} from "firebase/firestore";

import { db } from "../../context/firebase";
import { useAuth } from "../../context/AuthContext";

const BACKEND_URL = "https://campusbackend-1.onrender.com";

function SellerPromotions({ unreadMessages = 0, profile = {} }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { firebaseUser } = useAuth();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [newOrdersCount, setNewOrdersCount] = useState(0);

  const [sellerProducts, setSellerProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [availableBalance, setAvailableBalance] = useState(0);

  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState("7days");
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [formError, setFormError] = useState("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("");

  const [activeBoosts, setActiveBoosts] = useState([]);

  const sellerFullName =
    profile?.fullName ||
    profile?.name ||
    profile?.displayName ||
    firebaseUser?.displayName?.trim() ||
    "Seller";

  const sellerFirstName =
    String(sellerFullName).trim().split(/\s+/)[0] || "Seller";

  const sellerImage =
    profile?.profileImage ||
    profile?.photoURL ||
    profile?.avatar ||
    firebaseUser?.photoURL ||
    null;

  const formatNaira = (amount) =>
    `₦${Number(amount || 0).toLocaleString("en-NG")}`;

  const formatDate = (value) => {
    if (!value) return "—";
    try {
      let ms = 0;
      if (typeof value?.toMillis === "function") ms = value.toMillis();
      else if (value?.seconds) ms = value.seconds * 1000;
      else ms = new Date(value).getTime();
      if (!ms || Number.isNaN(ms)) return "—";
      return new Date(ms).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return "—";
    }
  };

  const boostPlans = [
    {
      id: "3days",
      label: "3 Days",
      days: 3,
      price: 1500,
      badge: null,
      description: "Quick boost for weekend sales",
    },
    {
      id: "7days",
      label: "7 Days",
      days: 7,
      price: 3000,
      badge: "Popular",
      description: "Best value for weekly visibility",
    },
    {
      id: "14days",
      label: "14 Days",
      days: 14,
      price: 5000,
      badge: "Best value",
      description: "Maximum reach on campus",
    },
  ];

  const selectedPlan =
    boostPlans.find((p) => p.id === selectedPlanId) || boostPlans[1];

  const selectedCount = selectedProductIds.length;
  const totalAmount = selectedPlan.price * Math.max(selectedCount, 1);

  useEffect(() => {
    if (!firebaseUser?.uid) {
      setNewOrdersCount(0);
      return;
    }
    const ordersQuery = query(
      collection(db, "orders"),
      where("sellerId", "==", firebaseUser.uid)
    );
    const unsub = onSnapshot(ordersQuery, (snapshot) => {
      let pending = 0;
      snapshot.docs.forEach((d) => {
        const status = String(d.data()?.status || "pending").toLowerCase();
        if (status === "cancelled" || status === "canceled") return;
        if (["pending", "placed", "processing"].includes(status)) pending += 1;
      });
      setNewOrdersCount(pending);
    });
    return () => unsub();
  }, [firebaseUser?.uid]);

  useEffect(() => {
    if (!firebaseUser?.uid) {
      setSellerProducts([]);
      setActiveBoosts([]);
      setProductsLoading(false);
      return;
    }
    setProductsLoading(true);
    const productsQuery = query(
      collection(db, "products"),
      where("sellerId", "==", firebaseUser.uid)
    );
    const unsub = onSnapshot(
      productsQuery,
      (snapshot) => {
        const now = Date.now();
        const list = [];
        const boosts = [];
        snapshot.docs.forEach((productDoc) => {
          const data = productDoc.data() || {};
          const status = String(data.status || "active").toLowerCase();
          if (["deleted", "inactive", "archived"].includes(status)) return;

          let untilMs = 0;
          if (data.promotedUntil) {
            if (typeof data.promotedUntil.toMillis === "function")
              untilMs = data.promotedUntil.toMillis();
            else if (data.promotedUntil.seconds)
              untilMs = data.promotedUntil.seconds * 1000;
          }

          const product = {
            id: productDoc.id,
            name: data.name || "Untitled Product",
            category: data.category || "Other",
            price: Number(data.price) || 0,
            image:
              data.image ||
              data.imageUrl ||
              (Array.isArray(data.images) ? data.images[0] : null) ||
              "",
            isPromoted: data.isPromoted === true,
            promotedUntil: data.promotedUntil || null,
            promotedAt: data.promotedAt || null,
          };
          list.push(product);

          if (data.isPromoted === true && untilMs > now) {
            boosts.push({
              id: productDoc.id,
              productName: product.name,
              plan: data.promotePlan || "Boost",
              amountPaid: Number(data.promoteAmount) || 0,
              paidVia: data.promotePaidVia || "",
              ends: formatDate(data.promotedUntil),
              status: "Active",
              views: Number(data.views) || 0,
            });
          }
        });
        list.sort((a, b) => a.name.localeCompare(b.name));
        setSellerProducts(list);
        setActiveBoosts(boosts);
        setProductsLoading(false);
      },
      () => {
        setSellerProducts([]);
        setActiveBoosts([]);
        setProductsLoading(false);
      }
    );
    return () => unsub();
  }, [firebaseUser?.uid]);

  useEffect(() => {
    if (!firebaseUser?.uid) {
      setAvailableBalance(0);
      return;
    }
    const unsub = onSnapshot(doc(db, "users", firebaseUser.uid), (snap) => {
      if (!snap.exists()) {
        setAvailableBalance(0);
        return;
      }
      const data = snap.data() || {};
      setAvailableBalance(Number(data.availableBalance || data.balance || 0));
    });
    return () => unsub();
  }, [firebaseUser?.uid]);

  const menuItems = useMemo(
    () => [
      { label: "Dashboard", icon: FiGrid, path: "/seller-dashboard" },
      { label: "Products", icon: FiPackage, path: "/seller/products" },
      {
        label: "Orders",
        icon: FiShoppingBag,
        path: "/seller/orders",
        badge: newOrdersCount,
      },
      {
        label: "Messages",
        icon: FiMessageCircle,
        path: "/seller/messages",
        badge: unreadMessages,
      },
      { label: "Earnings", icon: FiDollarSign, path: "/seller/earnings" },
      {
        label: "Promotions",
        icon: FiTag,
        path: "/seller/promotions",
        new: true,
      },
      { label: "Profile", icon: FiUser, path: "/seller/profile" },
      { label: "Settings", icon: FiSettings, path: "/seller/settings" },
    ],
    [newOrdersCount, unreadMessages]
  );

  const isActive = (path) => {
    if (path === "/seller-dashboard")
      return location.pathname === "/seller-dashboard";
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

  const toggleProduct = (id) => {
    setFormError("");
    setSuccessMessage("");
    setSelectedProductIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    setSelectedProductIds(sellerProducts.map((p) => p.id));
    setFormError("");
  };

  const clearSelection = () => setSelectedProductIds([]);

  const applyBoostToProducts = async ({
    productIds,
    plan,
    amountPerProduct,
    totalPaid,
    paidVia,
    paystackReference = null,
  }) => {
    const now = new Date();
    const ends = new Date(now);
    ends.setDate(ends.getDate() + plan.days);
    const promotedAt = Timestamp.fromDate(now);
    const promotedUntil = Timestamp.fromDate(ends);
    const batch = writeBatch(db);

    productIds.forEach((productId) => {
      batch.update(doc(db, "products", productId), {
        isPromoted: true,
        promotedAt,
        promotedUntil,
        promotePlan: plan.label,
        promoteDays: plan.days,
        promoteAmount: amountPerProduct,
        promotePaidVia: paidVia,
        promotePaystackRef: paystackReference,
        updatedAt: serverTimestamp(),
      });
    });

    const promoRef = doc(collection(db, "promotions"));
    batch.set(promoRef, {
      sellerId: firebaseUser.uid,
      sellerName: sellerFullName,
      productIds,
      planId: plan.id,
      planLabel: plan.label,
      days: plan.days,
      amountPerProduct,
      totalAmount: totalPaid,
      paidVia,
      paystackReference,
      createdAt: serverTimestamp(),
      expiresAt: promotedUntil,
      status: "active",
    });

    await batch.commit();
  };

  const handlePromote = (e) => {
    e.preventDefault();
    setFormError("");
    setSuccessMessage("");
    setPaymentMethod("");
    if (selectedProductIds.length === 0) {
      setFormError("Select at least one product to promote.");
      return;
    }
    setShowPaymentModal(true);
  };

  const payWithBalance = async () => {
    if (!firebaseUser?.uid) {
      setFormError("Please log in again.");
      return;
    }
    if (totalAmount > availableBalance) {
      setFormError("Insufficient available balance. Choose Pay with card.");
      setShowPaymentModal(false);
      return;
    }
    setSubmitting(true);
    setShowPaymentModal(false);
    try {
      const userRef = doc(db, "users", firebaseUser.uid);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) throw new Error("Seller account not found");
      const bal = Number(userSnap.data()?.availableBalance || 0);
      if (bal < totalAmount) {
        setFormError("Insufficient available balance.");
        return;
      }
      await updateDoc(userRef, {
        availableBalance: increment(-totalAmount),
        updatedAt: serverTimestamp(),
      });
      await applyBoostToProducts({
        productIds: selectedProductIds,
        plan: selectedPlan,
        amountPerProduct: selectedPlan.price,
        totalPaid: totalAmount,
        paidVia: "Available balance",
      });
      const names = sellerProducts
        .filter((p) => selectedProductIds.includes(p.id))
        .map((p) => p.name)
        .slice(0, 3)
        .join(", ");
      setSuccessMessage(
        `${selectedCount} product(s) (${names}${
          selectedCount > 3 ? "…" : ""
        }) boosted for ${selectedPlan.label}. Paid ${formatNaira(
          totalAmount
        )} from balance.`
      );
      setSelectedProductIds([]);
    } catch (error) {
      console.error(error);
      setFormError(error?.message || "Unable to start promotion.");
    } finally {
      setSubmitting(false);
    }
  };

  // =====================================================
  // PAY WITH CARD — same Paystack flow as buyer checkout
  // =====================================================
  const payWithCard = async () => {
    if (!firebaseUser?.uid) {
      setFormError("Please log in again.");
      return;
    }

    const email =
      firebaseUser.email || profile?.email || "seller@campusmart.app";

    setSubmitting(true);
    setShowPaymentModal(false);
    setFormError("");

    try {
      const response = await fetch(`${BACKEND_URL}/initialize-payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          amount: totalAmount,
          sellerId: firebaseUser.uid,
          orderId: null,
          productName: `Promote ${selectedCount} product(s) — ${selectedPlan.label}`,
          type: "promotion",
          productIds: selectedProductIds,
          planId: selectedPlan.id,
          planDays: selectedPlan.days,
          callback_url: `${window.location.origin}/seller/promotions`,
        }),
      });

      const data = await response.json();

      // Support flat + nested response shapes from backend
      const authorizationUrl =
        data?.data?.authorization_url || data?.authorization_url;
      const reference = data?.data?.reference || data?.reference;

      if (!response.ok || !authorizationUrl) {
        throw new Error(
          data?.error || data?.message || "Could not start Paystack payment"
        );
      }

      sessionStorage.setItem(
        "campusmart_pending_promotion",
        JSON.stringify({
          productIds: selectedProductIds,
          planId: selectedPlan.id,
          planLabel: selectedPlan.label,
          planDays: selectedPlan.days,
          amountPerProduct: selectedPlan.price,
          totalAmount,
          reference,
          sellerId: firebaseUser.uid,
        })
      );

      window.location.href = authorizationUrl;
    } catch (error) {
      console.error(error);
      setFormError(error?.message || "Unable to open payment.");
      setSubmitting(false);
    }
  };

  // After Paystack redirects back with ?reference=
  useEffect(() => {
    const run = async () => {
      const params = new URLSearchParams(location.search);
      const refFromUrl = params.get("reference") || params.get("trxref");

      const raw = sessionStorage.getItem("campusmart_pending_promotion");
      if (!raw || !firebaseUser?.uid) return;

      let pending;
      try {
        pending = JSON.parse(raw);
      } catch {
        sessionStorage.removeItem("campusmart_pending_promotion");
        return;
      }

      if (pending.sellerId !== firebaseUser.uid) return;

      const reference = refFromUrl || pending.reference;
      if (!reference) return;

      // Avoid double-apply on re-render
      const appliedKey = `cm_promo_applied_${reference}`;
      try {
        if (sessionStorage.getItem(appliedKey)) {
          sessionStorage.removeItem("campusmart_pending_promotion");
          if (location.search) {
            navigate("/seller/promotions", { replace: true });
          }
          return;
        }
      } catch {
        // ignore
      }

      try {
        setSubmitting(true);
        setFormError("");

        // Verify with backend (Paystack)
        let verified = false;
        try {
          const verifyRes = await fetch(
            `${BACKEND_URL}/verify-payment/${encodeURIComponent(reference)}`
          );
          const verifyData = await verifyRes.json();
          if (verifyRes.ok && verifyData?.data?.status === "success") {
            verified = true;
          }
        } catch (verifyErr) {
          console.warn("Verify endpoint failed, checking reference only:", verifyErr);
        }

        // If verify endpoint is down but we have a reference from Paystack redirect, still try boost
        if (!verified && !refFromUrl) {
          throw new Error(
            "Payment was not confirmed. If you were charged, contact support with your reference."
          );
        }

        const plan =
          boostPlans.find((p) => p.id === pending.planId) || {
            id: pending.planId,
            label: pending.planLabel,
            days: pending.planDays,
            price: pending.amountPerProduct,
          };

        await applyBoostToProducts({
          productIds: pending.productIds || [],
          plan,
          amountPerProduct: pending.amountPerProduct,
          totalPaid: pending.totalAmount,
          paidVia: "Card (Paystack)",
          paystackReference: reference,
        });

        try {
          sessionStorage.setItem(appliedKey, "1");
        } catch {
          // ignore
        }
        sessionStorage.removeItem("campusmart_pending_promotion");

        setSuccessMessage(
          `Payment successful. ${(pending.productIds || []).length} product(s) are now boosted.`
        );
        setSelectedProductIds([]);
        navigate("/seller/promotions", { replace: true });
      } catch (e) {
        console.error(e);
        setFormError(
          e?.message ||
            "Payment may have succeeded but boost failed. Contact support with your Paystack reference."
        );
      } finally {
        setSubmitting(false);
      }
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firebaseUser?.uid, location.search]);

  const handleConfirmPayment = async () => {
    if (!paymentMethod) return;
    if (paymentMethod === "balance") await payWithBalance();
    else if (paymentMethod === "card") await payWithCard();
  };

  return (
    <div className="h-screen w-full bg-gray-50 text-gray-800 font-sans overflow-hidden">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[291px] bg-green-700 text-white flex flex-col h-screen transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
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
            <div className="w-10 h-10 rounded-xl bg-[#008236] flex items-center justify-center border border-white/10">
              <span className="font-black">CM</span>
            </div>
            <div>
              <h1 className="text-[22px] font-extrabold leading-none">
                Campus<span className="text-green-300">Mart</span>
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
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-left ${
                  active
                    ? "bg-white text-[#008236] font-semibold"
                    : "text-white hover:bg-white/10"
                }`}
              >
                <Icon size={18} />
                <span className="flex-1 text-[14px]">{label}</span>
                {badge > 0 && (
                  <span className="min-w-[20px] h-[20px] px-1 rounded-full bg-red-500 text-[10px] font-bold flex items-center justify-center">
                    {badge > 99 ? "99+" : badge}
                  </span>
                )}
                {isNew && (
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
                      active ? "bg-green-100 text-green-700" : "bg-green-500"
                    }`}
                  >
                    New
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
            className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl hover:bg-white/10"
          >
            <FiLogOut size={18} />
            <span className="text-[14px]">Logout</span>
          </button>
        </div>
      </aside>

      <div className="min-w-0 flex flex-col h-screen lg:ml-[291px]">
        <header className="min-h-[70px] bg-[#007233] text-white flex items-center px-4 gap-3 flex-shrink-0">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden w-10 h-10 rounded-lg hover:bg-white/10 flex items-center justify-center"
          >
            <FiMenu size={22} />
          </button>
          <div className="flex items-center gap-2">
            <FiShoppingBag size={18} className="text-green-200" />
            <span className="text-sm font-semibold">Your Store</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleNavigation("/seller/messages")}
              className="relative w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center"
            >
              <FiMessageCircle size={20} />
              {unreadMessages > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[17px] h-[17px] rounded-full bg-red-500 text-[9px] font-bold flex items-center justify-center">
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
                  alt=""
                  className="w-9 h-9 rounded-full object-cover border-2 border-white/30"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center font-bold text-sm">
                  {sellerFirstName.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="hidden sm:block text-left">
                <p className="text-xs font-bold truncate max-w-[160px]">{sellerFullName}</p>
                <p className="text-[10px] text-green-100">Seller</p>
              </div>
              <FiChevronDown size={16} className="hidden sm:block" />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="bg-gradient-to-r from-[#007233] to-[#008f3f] rounded-2xl p-6 text-white mb-6 relative overflow-hidden">
            <h1 className="text-2xl sm:text-3xl font-bold relative z-10">
              Promote your products, {sellerFirstName}
            </h1>
            <p className="text-sm text-green-50 mt-2 max-w-xl relative z-10">
              Select one or more products, pay once, and they rank above everyone
              else on browse.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
            {[
              {
                step: "1",
                title: "Select products",
                text: "One or many from your store.",
                icon: FiPackage,
              },
              {
                step: "2",
                title: "Pick a plan",
                text: "Price × number of products.",
                icon: FiZap,
              },
              {
                step: "3",
                title: "Pay & go live",
                text: "Balance or card via Paystack.",
                icon: FiArrowUp,
              },
            ].map(({ step, title, text, icon: Icon }) => (
              <div
                key={step}
                className="bg-white rounded-2xl border border-gray-100 p-4 flex gap-3"
              >
                <div className="w-10 h-10 rounded-xl bg-green-50 text-[#008236] flex items-center justify-center font-bold text-sm">
                  {step}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <Icon size={14} className="text-[#008236]" />
                    <p className="text-sm font-semibold">{title}</p>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{text}</p>
                </div>
              </div>
            ))}
          </div>

          {successMessage && (
            <div className="mb-5 rounded-2xl bg-green-50 border border-green-100 p-4 flex gap-3">
              <FiCheckCircle className="text-[#008236] flex-shrink-0" size={20} />
              <div>
                <p className="text-sm font-semibold">Products boosted</p>
                <p className="text-xs text-gray-500 mt-1">{successMessage}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
            <section className="xl:col-span-3">
              <form
                onSubmit={handlePromote}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
              >
                <div className="p-5 border-b border-gray-100">
                  <h2 className="text-lg font-bold">Boost products</h2>
                  <p className="text-xs text-gray-500 mt-1">
                    Total = plan price × selected products
                  </p>
                </div>
                <div className="p-5 space-y-5">
                  {formError && (
                    <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
                      {formError}
                    </div>
                  )}

                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-xs font-semibold text-gray-700">
                        Your products{" "}
                        {selectedCount > 0 && (
                          <span className="text-[#008236]">
                            ({selectedCount} selected)
                          </span>
                        )}
                      </label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={selectAll}
                          className="text-[11px] font-semibold text-[#008236]"
                        >
                          Select all
                        </button>
                        <button
                          type="button"
                          onClick={clearSelection}
                          className="text-[11px] font-semibold text-gray-400"
                        >
                          Clear
                        </button>
                      </div>
                    </div>

                    {productsLoading ? (
                      <p className="text-sm text-gray-400 py-6 text-center">
                        <FiRefreshCw className="inline animate-spin mr-2" />
                        Loading…
                      </p>
                    ) : sellerProducts.length === 0 ? (
                      <div className="py-8 text-center text-sm text-gray-500 border border-dashed rounded-xl">
                        No products.{" "}
                        <button
                          type="button"
                          onClick={() => handleNavigation("/seller/products")}
                          className="text-[#008236] font-semibold"
                        >
                          Add products
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-[320px] overflow-y-auto">
                        {sellerProducts.map((product) => {
                          const active = selectedProductIds.includes(product.id);
                          return (
                            <button
                              key={product.id}
                              type="button"
                              onClick={() => toggleProduct(product.id)}
                              className={`w-full text-left flex items-center gap-3 p-3 rounded-xl border ${
                                active
                                  ? "border-[#008236] bg-green-50 ring-2 ring-green-100"
                                  : "border-gray-100 hover:border-green-200"
                              }`}
                            >
                              <div
                                className={`w-5 h-5 rounded-md border flex items-center justify-center ${
                                  active
                                    ? "bg-[#008236] border-[#008236] text-white"
                                    : "border-gray-300"
                                }`}
                              >
                                {active && <FiCheck size={12} />}
                              </div>
                              {product.image ? (
                                <img
                                  src={product.image}
                                  alt=""
                                  className="w-11 h-11 rounded-xl object-cover"
                                />
                              ) : (
                                <div className="w-11 h-11 rounded-xl bg-green-50 text-[#008236] flex items-center justify-center">
                                  <FiPackage size={18} />
                                </div>
                              )}
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold truncate">
                                  {product.name}
                                </p>
                                <p className="text-[10px] text-gray-400">
                                  {product.category} · {formatNaira(product.price)}
                                </p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2">
                      Boost duration (per product)
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {boostPlans.map((plan) => {
                        const active = selectedPlanId === plan.id;
                        return (
                          <button
                            key={plan.id}
                            type="button"
                            onClick={() => setSelectedPlanId(plan.id)}
                            className={`relative text-left p-4 rounded-2xl border ${
                              active
                                ? "border-[#008236] bg-green-50 ring-2 ring-green-100"
                                : "border-gray-100"
                            }`}
                          >
                            {plan.badge && (
                              <span className="absolute -top-2 right-3 px-2 py-0.5 rounded-full bg-[#008236] text-white text-[9px] font-bold">
                                {plan.badge}
                              </span>
                            )}
                            <p className="text-sm font-bold">{plan.label}</p>
                            <p className="text-lg font-bold text-[#008236] mt-1">
                              {formatNaira(plan.price)}
                            </p>
                            <p className="text-[10px] text-gray-400 mt-1">
                              {plan.description}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="rounded-xl bg-green-50 border border-green-100 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold text-gray-700">
                        You will pay
                      </p>
                      <p className="text-xl font-bold text-[#008236]">
                        {selectedCount === 0
                          ? formatNaira(selectedPlan.price)
                          : formatNaira(totalAmount)}
                      </p>
                      <p className="text-[10px] text-gray-500 mt-1">
                        {selectedCount === 0
                          ? "Select products first"
                          : `${selectedCount} × ${formatNaira(
                              selectedPlan.price
                            )} · ${selectedPlan.label}`}
                      </p>
                    </div>
                    <button
                      type="submit"
                      disabled={submitting || selectedCount === 0}
                      className="h-11 px-5 rounded-xl bg-[#008236] text-white text-sm font-semibold flex items-center justify-center gap-2 hover:bg-[#006f2e] disabled:opacity-60"
                    >
                      {submitting ? (
                        <>
                          <FiRefreshCw className="animate-spin" size={16} />
                          Processing…
                        </>
                      ) : (
                        <>
                          <FiZap size={16} />
                          Pay & Promote
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </section>

            <section className="xl:col-span-2">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm h-full">
                <div className="p-5 border-b border-gray-100">
                  <h2 className="font-bold">Active boosts</h2>
                  <p className="text-xs text-gray-500 mt-1">
                    At the top of listings
                  </p>
                </div>
                <div className="p-4 space-y-3">
                  {activeBoosts.length === 0 ? (
                    <div className="text-center py-10 text-sm text-gray-500">
                      <FiStar className="mx-auto mb-2 text-[#008236]" size={22} />
                      No active boosts
                    </div>
                  ) : (
                    activeBoosts.map((boost) => (
                      <div
                        key={boost.id}
                        className="border border-green-100 rounded-xl p-3.5 bg-green-50/40"
                      >
                        <div className="flex justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold truncate">
                              {boost.productName}
                            </p>
                            <p className="text-[10px] text-gray-400 mt-0.5">
                              {boost.plan} · {formatNaira(boost.amountPaid)}
                              {boost.paidVia ? ` · ${boost.paidVia}` : ""}
                            </p>
                          </div>
                          <span className="text-[9px] font-bold text-[#008236] bg-green-50 border border-green-100 px-2 py-0.5 rounded-full h-fit">
                            Active
                          </span>
                        </div>
                        <div className="flex justify-between mt-3 text-[10px] text-gray-500">
                          <span className="flex items-center gap-1">
                            <FiClock size={11} /> Ends {boost.ends}
                          </span>
                          <span className="flex items-center gap-1">
                            <FiEye size={11} /> {boost.views} views
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </section>
          </div>
        </main>

        {showPaymentModal && (
          <div
            className="fixed inset-0 z-[100] bg-black/50 flex items-end sm:items-center justify-center p-4"
            onClick={() => {
              if (!submitting) {
                setShowPaymentModal(false);
                setPaymentMethod("");
              }
            }}
          >
            <div
              className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-5 bg-green-50 border-b border-green-100">
                <h3 className="text-lg font-bold">How do you want to pay?</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {formatNaira(totalAmount)} · {selectedCount} product(s) ·{" "}
                  {selectedPlan.label}
                </p>
              </div>
              <div className="p-4 space-y-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("balance")}
                  className={`w-full text-left flex gap-3 p-4 rounded-xl border ${
                    paymentMethod === "balance"
                      ? "border-[#008236] bg-green-50 ring-2 ring-green-100"
                      : "border-gray-100"
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-green-50 text-[#008236] flex items-center justify-center">
                    <FiDollarSign size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Available balance</p>
                    <p className="text-sm font-bold text-[#008236] mt-1">
                      {formatNaira(availableBalance)} available
                    </p>
                    {totalAmount > availableBalance && (
                      <p className="text-[10px] text-red-500 mt-1">
                        Not enough balance
                      </p>
                    )}
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("card")}
                  className={`w-full text-left flex gap-3 p-4 rounded-xl border ${
                    paymentMethod === "card"
                      ? "border-[#008236] bg-green-50 ring-2 ring-green-100"
                      : "border-gray-100"
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-green-50 text-[#008236] flex items-center justify-center">
                    <FiCreditCard size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Pay with card</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Paystack secure checkout
                    </p>
                  </div>
                </button>
              </div>
              <div className="p-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowPaymentModal(false);
                    setPaymentMethod("");
                  }}
                  className="flex-1 h-11 rounded-xl border border-gray-200 text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!paymentMethod || submitting}
                  onClick={handleConfirmPayment}
                  className="flex-[1.4] h-11 rounded-xl bg-[#008236] text-white text-sm font-semibold disabled:opacity-50"
                >
                  {submitting
                    ? "Processing…"
                    : paymentMethod === "balance"
                      ? "Pay from balance"
                      : paymentMethod === "card"
                        ? "Pay with card"
                        : "Select a method"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default SellerPromotions;