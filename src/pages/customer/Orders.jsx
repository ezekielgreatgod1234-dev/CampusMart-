import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  collection,
  onSnapshot,
  getDoc,
  query,
  where,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";

import {
  FiPackage,
  FiArrowRight,
  FiShoppingBag,
  FiCheckCircle,
  FiClock,
  FiXCircle,
  FiUser,
} from "react-icons/fi";

import CustomerLayout from "../../layouts/CustomerLayout";
import { db } from "../../context/firebase";
import { useAuth } from "../../context/AuthContext";

// ================= ORDER HELPERS (self-contained) =================
const toMillis = (value) => {
  if (!value) return 0;
  if (typeof value.toMillis === "function") return value.toMillis();
  if (value.seconds) return value.seconds * 1000;
  if (typeof value === "number") return value;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const formatOrderDate = (value) => {
  const ms = toMillis(value);
  if (!ms) return "—";
  return new Date(ms).toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const formatMoney = (value) => {
  const n = Number(String(value ?? 0).replace(/[₦,]/g, ""));
  return `₦${(Number.isFinite(n) ? n : 0).toLocaleString("en-NG")}`;
};

const SUCCESS_WORDS = ["successful", "success", "delivered", "completed"];

const rawStatus = (order) => String(order?.status || "pending").toLowerCase();

const isCancelled = (order) =>
  ["cancelled", "canceled"].includes(rawStatus(order));

const isBuyerConfirmed = (order) => order?.buyerConfirmed === true;

const isSellerConfirmed = (order) =>
  order?.sellerConfirmed === true ||
  (SUCCESS_WORDS.includes(rawStatus(order)) && order?.buyerConfirmed !== true);

const normalizeOrderStatus = (order) => {
  if (isCancelled(order)) return "cancelled";
  if (
    order?.sellerConfirmed === true ||
    order?.buyerConfirmed === true ||
    SUCCESS_WORDS.includes(rawStatus(order))
  ) {
    return "successful";
  }
  return "pending";
};

const STATUS_STYLES = {
  pending: {
    label: "Pending",
    className: "bg-amber-50 text-amber-700 border border-amber-100",
  },
  successful: {
    label: "Successful",
    className: "bg-[#008236] text-white",
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-red-50 text-red-600 border border-red-100",
  },
};

const getItemPrice = (item) =>
  Number(String(item?.price ?? 0).replace(/[₦,]/g, "")) || 0;

const getOrderItems = (order) => {
  if (Array.isArray(order?.items) && order.items.length > 0) return order.items;
  return [
    {
      name: order?.productName || order?.name || "Product",
      quantity: order?.quantity || 1,
      price: order?.price || order?.total,
      image: order?.image,
    },
  ];
};

const getOrderTotal = (order) => {
  const direct = order?.total || order?.amount || order?.amountPaid;
  if (direct) return Number(String(direct).replace(/[₦,]/g, "")) || 0;
  return getOrderItems(order).reduce(
    (sum, item) => sum + getItemPrice(item) * (item.quantity || 1),
    0
  );
};

const getBuyerName = (order) =>
  order?.customerName ||
  order?.customer?.fullName ||
  order?.customer?.name ||
  order?.buyerName ||
  "Buyer";

const getOrderNumber = (order) =>
  order?.orderNumber
    ? String(order.orderNumber).startsWith("#")
      ? order.orderNumber
      : `#${order.orderNumber}`
    : `#${String(order?.id || "").slice(0, 8).toUpperCase()}`;

const getPaymentInfo = (order) => {
  const method = String(order?.paymentMethod || "").toLowerCase();
  const isCash = ["cash", "pod", "pay_on_delivery", "pay on delivery"].includes(
    method
  );
  const ps = String(order?.paymentStatus || "").toLowerCase();
  const paid = ps
    ? ["paid", "success", "successful"].includes(ps)
    : !isCash; // card/Paystack orders without a flag are treated as paid

  return {
    method: isCash ? "Pay on Delivery" : "Paystack",
    paid,
    label: isCash ? "Pay on Delivery" : paid ? "Paid" : "Awaiting payment",
  };
};

// Works out which seller an order belongs to, even if the order doc stores
// the seller in a slightly different place.
const getSellerId = (order) =>
  order?.sellerId ||
  order?.seller?.id ||
  order?.seller?.uid ||
  (Array.isArray(order?.items)
    ? order.items.find((i) => i?.sellerId)?.sellerId
    : "") ||
  "";

const getSellerNameFromOrder = (order) =>
  order?.sellerName ||
  order?.storeName ||
  order?.seller?.storeName ||
  order?.seller?.businessName ||
  order?.seller?.fullName ||
  order?.seller?.name ||
  (Array.isArray(order?.items)
    ? order.items.find((i) => i?.sellerName)?.sellerName
    : "") ||
  "";

const STATUS_ICONS = {
  pending: FiClock,
  successful: FiCheckCircle,
  cancelled: FiXCircle,
};

const FILTERS = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "successful", label: "Successful" },
  { id: "cancelled", label: "Cancelled" },
];

function Step({ done, label, time, isLast }) {
  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center">
        <div
          className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
            done ? "bg-green-600 text-white" : "bg-gray-100 text-gray-300"
          }`}
        >
          <FiCheckCircle size={14} />
        </div>
        {!isLast && (
          <div
            className={`h-0.5 flex-1 mx-1 ${
              done ? "bg-green-500" : "bg-gray-100"
            }`}
          />
        )}
      </div>
      <p
        className={`text-[11px] mt-1.5 font-semibold ${
          done ? "text-gray-700" : "text-gray-400"
        }`}
      >
        {label}
      </p>
      {done && time ? (
        <p className="text-[10px] text-gray-400">{time}</p>
      ) : null}
    </div>
  );
}

function Orders({ cartCount = 0 }) {
  const navigate = useNavigate();
  const { firebaseUser } = useAuth();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [approvingId, setApprovingId] = useState(null);
  const [confirmOrder, setConfirmOrder] = useState(null); // order awaiting approval
  const [approveError, setApproveError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [sellerNames, setSellerNames] = useState({});
  const requestedSellers = useRef(new Set());

  // Every order this buyer has placed. One document per seller, so an order
  // containing products from several sellers shows up as several cards.
  useEffect(() => {
    if (!firebaseUser?.uid) {
      setOrders([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    const q = query(
      collection(db, "orders"),
      where("buyerId", "==", firebaseUser.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        list.sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));
        setOrders(list);
        setLoading(false);
      },
      (err) => {
        console.error("Buyer orders listener error:", err);
        setError("Could not load your orders. Please try again.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [firebaseUser?.uid]);

  // If an order doesn't store the seller's name, look it up from their profile.
  useEffect(() => {
    if (orders.length === 0) return;

    const missing = [
      ...new Set(
        orders
          .filter((o) => !getSellerNameFromOrder(o))
          .map(getSellerId)
          .filter(Boolean)
      ),
    ].filter((id) => !requestedSellers.current.has(id));

    missing.forEach((id) => {
      requestedSellers.current.add(id);
      getDoc(doc(db, "users", id))
        .then((snap) => {
          if (!snap.exists()) return;
          const data = snap.data() || {};
          const name =
            data.storeName ||
            data.businessName ||
            data.fullName ||
            data.name ||
            data.displayName;
          if (name) setSellerNames((prev) => ({ ...prev, [id]: name }));
        })
        .catch((error) => {
          console.error("Could not load seller name:", error);
        });
    });
  }, [orders]);

  const counts = useMemo(() => {
    const c = { all: orders.length, pending: 0, successful: 0, cancelled: 0 };
    orders.forEach((o) => {
      c[normalizeOrderStatus(o)] += 1;
    });
    return c;
  }, [orders]);

  const visibleOrders = useMemo(() => {
    if (filter === "all") return orders;
    return orders.filter((o) => normalizeOrderStatus(o) === filter);
  }, [orders, filter]);

  // Buyer approves the delivery -> order becomes successful.
  // Step 1: open the styled confirmation popup.
  const askApproveDelivery = (order) => {
    if (!order?.id || approvingId) return;
    setApproveError("");
    setConfirmOrder(order);
  };

  // Step 2: buyer confirms -> order becomes successful.
  const approveDelivery = async () => {
    const order = confirmOrder;
    if (!order?.id || approvingId) return;

    setApprovingId(order.id);
    setApproveError("");
    try {
      await updateDoc(doc(db, "orders", order.id), {
        status: "successful",
        buyerConfirmed: true,
        buyerConfirmedAt: serverTimestamp(),
        completedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setConfirmOrder(null);
      setSuccessMsg(`Delivery approved for ${getOrderNumber(order)}`);
    } catch (err) {
      console.error("Approve delivery error:", err);
      setApproveError("Could not approve delivery. Please try again.");
    } finally {
      setApprovingId(null);
    }
  };

  // success message auto-hides
  useEffect(() => {
    if (!successMsg) return;
    const t = setTimeout(() => setSuccessMsg(""), 4000);
    return () => clearTimeout(t);
  }, [successMsg]);

  return (
    <CustomerLayout cartCount={cartCount}>
      <div className="space-y-6">
        {/* ================= HEADER ================= */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
            My Orders
          </h1>
          <p className="text-gray-500 mt-1">
            Track every order from every seller on CampusMart.
          </p>
        </div>

        {/* ================= FILTERS ================= */}
        {orders.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f) => {
              const active = filter === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilter(f.id)}
                  className={`h-10 px-4 rounded-xl text-sm font-semibold transition ${
                    active
                      ? "bg-green-600 text-white"
                      : "bg-green-50 text-green-700 border border-green-100 hover:bg-green-100"
                  }`}
                >
                  {f.label} ({counts[f.id]})
                </button>
              );
            })}
          </div>
        )}

        {/* ================= LOADING ================= */}
        {loading ? (
          <div className="bg-white border border-gray-100 rounded-2xl min-h-[40vh] flex items-center justify-center">
            <div className="text-center">
              <div className="w-10 h-10 mx-auto rounded-full border-4 border-green-100 border-t-green-600 animate-spin" />
              <p className="mt-4 text-sm text-gray-500">Loading your orders...</p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-100 text-red-600 rounded-2xl p-6 text-sm">
            {error}
          </div>
        ) : orders.length === 0 ? (
          /* ================= EMPTY ORDERS ================= */
          <div className="bg-white border border-gray-100 rounded-2xl min-h-[50vh] flex items-center justify-center p-6">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto rounded-full bg-green-50 text-green-600 flex items-center justify-center">
                <FiShoppingBag size={35} />
              </div>

              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mt-5">
                No Orders Yet
              </h2>

              <p className="text-gray-500 mt-2 max-w-sm mx-auto">
                You haven't placed any orders yet. Start shopping and your
                orders will appear here.
              </p>

              <button
                onClick={() => navigate("/browse-products")}
                className="mt-6 inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-semibold transition"
              >
                Start Shopping
                <FiArrowRight size={17} />
              </button>
            </div>
          </div>
        ) : visibleOrders.length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-2xl p-10 text-center text-sm text-gray-500">
            No {filter} orders.
          </div>
        ) : (
          /* ================= ORDERS ================= */
          <div className="space-y-4">
            {visibleOrders.map((order) => {
              const status = normalizeOrderStatus(order);
              const style = STATUS_STYLES[status];
              const StatusIcon = STATUS_ICONS[status];

              const items = getOrderItems(order);
              const itemCount = items.reduce(
                (total, item) => total + (Number(item.quantity) || 1),
                0
              );
              const payment = getPaymentInfo(order);

              const sellerDone = isSellerConfirmed(order);
              const buyerDone = isBuyerConfirmed(order);
              const cancelled = status === "cancelled";

              const canApprove = !cancelled && !buyerDone;

              return (
                <div
                  key={order.id}
                  className="bg-white border border-gray-100 rounded-2xl p-5 sm:p-6 shadow-sm"
                >
                  {/* TOP */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
                        <FiPackage size={21} />
                      </div>

                      <div>
                        <p className="text-xs text-gray-500">Order Number</p>
                        <h2 className="font-bold text-gray-800 mt-1">
                          {getOrderNumber(order)}
                        </h2>
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1.5 w-fit px-3 py-1.5 rounded-full text-xs font-semibold ${style.className}`}
                    >
                      <StatusIcon size={13} />
                      {style.label}
                    </span>
                  </div>

                  {/* SELLER */}
                  <div className="mt-4 inline-flex items-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-1.5">
                    <FiUser size={14} className="text-gray-400" />
                    Sold by{" "}
                    <span className="font-semibold text-gray-800">
                      {getSellerNameFromOrder(order) ||
                        sellerNames[getSellerId(order)] ||
                        "Seller"}
                    </span>
                  </div>

                  <div className="border-t border-gray-100 my-5" />

                  {/* DETAILS */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-gray-400">Date</p>
                      <p className="text-sm font-medium text-gray-700 mt-1">
                        {order.createdAt
                          ? formatOrderDate(order.createdAt)
                          : order.date || "—"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-400">Items</p>
                      <p className="text-sm font-medium text-gray-700 mt-1">
                        {itemCount}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-400">Payment</p>
                      <p className="text-sm font-medium text-gray-700 mt-1">
                        {payment.method}
                        <span
                          className={`ml-1.5 text-[11px] ${
                            payment.paid ? "text-green-600" : "text-amber-600"
                          }`}
                        >
                          · {payment.paid ? "Paid" : payment.label}
                        </span>
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-400">Total</p>
                      <p className="text-sm font-bold text-gray-900 mt-1">
                        {formatMoney(getOrderTotal(order))}
                      </p>
                    </div>
                  </div>

                  {/* PRODUCTS PREVIEW */}
                  <div className="mt-5 flex items-center gap-2 overflow-hidden">
                    {items.slice(0, 4).map((item, index) =>
                      item.image ? (
                        <img
                          key={`${item.id || item.name}-${index}`}
                          src={item.image}
                          alt={item.name || "Product"}
                          className="w-12 h-12 rounded-lg object-cover bg-gray-100 border border-gray-100"
                        />
                      ) : (
                        <div
                          key={`${item.id || item.name}-${index}`}
                          className="w-12 h-12 rounded-lg bg-gray-100 text-gray-400 flex items-center justify-center"
                          title={item.name}
                        >
                          <FiPackage size={18} />
                        </div>
                      )
                    )}

                    {items.length > 4 && (
                      <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-xs font-semibold text-gray-500">
                        +{items.length - 4}
                      </div>
                    )}
                  </div>

                  {/* FULL STATUS TRACKER */}
                  {!cancelled ? (
                    <div className="mt-6 flex items-start">
                      <Step
                        done
                        label="Order placed"
                        time={formatOrderDate(order.createdAt)}
                      />
                      <Step
                        done={sellerDone}
                        label="Seller marked successful"
                        time={
                          order.sellerConfirmedAt
                            ? formatOrderDate(order.sellerConfirmedAt)
                            : ""
                        }
                      />
                      <Step
                        done={buyerDone}
                        label="You approved delivery"
                        time={
                          order.buyerConfirmedAt
                            ? formatOrderDate(order.buyerConfirmedAt)
                            : ""
                        }
                        isLast
                      />
                    </div>
                  ) : (
                    <p className="mt-5 text-sm text-red-500">
                      This order was cancelled.
                    </p>
                  )}

                  {/* BOTTOM */}
                  <div className="mt-5 pt-5 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap gap-2">
                      {canApprove && (
                        <button
                          type="button"
                          disabled={approvingId === order.id}
                          onClick={() => askApproveDelivery(order)}
                          className="h-10 px-4 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-semibold transition disabled:opacity-50 inline-flex items-center gap-2"
                        >
                          <FiCheckCircle size={16} />
                          {approvingId === order.id
                            ? "Approving..."
                            : sellerDone
                            ? "Confirm I received it"
                            : "Approve Delivery"}
                        </button>
                      )}
                      {buyerDone && (
                        <span className="h-10 px-4 rounded-xl bg-green-50 text-green-700 text-sm font-semibold inline-flex items-center gap-2">
                          <FiCheckCircle size={16} />
                          Delivery approved
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => navigate(`/orders/${order.id}`)}
                      className="flex items-center gap-2 text-sm font-semibold text-green-600 hover:text-green-700 transition"
                    >
                      View Order
                      <FiArrowRight size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ================= APPROVE DELIVERY POPUP ================= */}
      {confirmOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
            onClick={() => (approvingId ? null : setConfirmOrder(null))}
          />

          <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl p-6 text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-green-50 text-green-600 flex items-center justify-center">
              <FiCheckCircle size={32} />
            </div>

            <h3 className="text-xl font-bold text-gray-800 mt-4">
              Approve delivery?
            </h3>

            <p className="text-sm text-gray-500 mt-2">
              Only approve if you have received your items. This marks{" "}
              <span className="font-semibold text-gray-700">
                {getOrderNumber(confirmOrder)}
              </span>{" "}
              as successful.
            </p>

            <div className="mt-4 rounded-xl bg-gray-50 px-4 py-3 text-left text-sm space-y-1">
              <div className="flex justify-between gap-3">
                <span className="text-gray-400">Sold by</span>
                <span className="font-semibold text-gray-800 truncate">
                  {getSellerNameFromOrder(confirmOrder) ||
                    sellerNames[getSellerId(confirmOrder)] ||
                    "Seller"}
                </span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-gray-400">Total</span>
                <span className="font-bold text-gray-900">
                  {formatMoney(getOrderTotal(confirmOrder))}
                </span>
              </div>
            </div>

            {approveError && (
              <p className="mt-3 text-sm text-red-500">{approveError}</p>
            )}

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                disabled={!!approvingId}
                onClick={() => setConfirmOrder(null)}
                className="flex-1 h-12 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition disabled:opacity-50"
              >
                Not yet
              </button>
              <button
                type="button"
                disabled={!!approvingId}
                onClick={approveDelivery}
                className="flex-1 h-12 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold transition disabled:opacity-60 inline-flex items-center justify-center gap-2"
              >
                {approvingId ? (
                  <>
                    <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                    Approving...
                  </>
                ) : (
                  "Yes, I got it"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= SUCCESS TOAST ================= */}
      {successMsg && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[110] bg-gray-900 text-white text-sm font-medium px-5 py-3 rounded-full shadow-xl flex items-center gap-2">
          <FiCheckCircle size={16} className="text-green-400" />
          {successMsg}
        </div>
      )}
    </CustomerLayout>
  );
}

export default Orders;