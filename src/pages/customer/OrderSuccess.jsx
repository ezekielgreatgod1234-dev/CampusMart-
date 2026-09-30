import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import CustomerLayout from "../../layouts/CustomerLayout";

import {
  FiCheckCircle,
  FiPackage,
  FiHome,
  FiList,
  FiShare2,
  FiLoader,
  FiAlertCircle,
  FiRefreshCw,
} from "react-icons/fi";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  setDoc,
  runTransaction,
  Timestamp,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "../../context/firebase";
import { useAuth } from "../../context/AuthContext";

/* =====================================================
 * HELPERS
 * ===================================================== */

const readSession = (key) => {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const writeSession = (key, value) => {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage may be unavailable; the page still works.
  }
};

const removeSession = (key) => {
  try {
    sessionStorage.removeItem(key);
  } catch {
    // ignore
  }
};

// Fields the backend might use to store the Paystack reference.
const REFERENCE_FIELDS = [
  "paystackReference",
  "reference",
  "paymentReference",
];

// The order is created by the backend webhook, which can take a few
// seconds after Paystack says "success". We keep checking for a while.
const POLL_DELAY_MS = 2000;
const POLL_MAX_ATTEMPTS = 20; // ~40 seconds

function OrderSuccess({ cartCount = 0 }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { firebaseUser } = useAuth();

  const [sharingReceipt, setSharingReceipt] = useState(false);
  const [receiptError, setReceiptError] = useState("");

  // "checking" | "ready" | "timeout" | "missing"
  const [syncState, setSyncState] = useState("checking");
  const [retryKey, setRetryKey] = useState(0);

  /* -----------------------------------------------------
   * URL data (Paystack adds ?reference=... / ?trxref=...)
   * ----------------------------------------------------- */
  const urlParams = useMemo(
    () => new URLSearchParams(location.search || ""),
    [location.search]
  );

  const urlReference =
    urlParams.get("reference") || urlParams.get("trxref") || "";

  const urlOrderId =
    urlParams.get("orderId") ||
    urlParams.get("orderID") ||
    urlParams.get("order_id") ||
    "";

  /* -----------------------------------------------------
   * DRAFT ORDER
   *
   * Shown immediately (items + amount) while the real order is
   * still being created by the backend.
   *
   * Payment.jsx saves the checkout under
   * `campusmart_pending_payment.checkout` and
   * `campusmart_payment_<reference>.checkout`, so we read from there.
   * (The old code looked for `.order`, which never exists.)
   * ----------------------------------------------------- */
  const draftOrder = useMemo(() => {
    const navigationOrder = location.state?.order || null;

    const storedOrder = readSession("lastOrder");
    const pending = readSession("campusmart_pending_payment");
    const byReference = urlReference
      ? readSession(`campusmart_payment_${urlReference}`)
      : null;

    // Only trust stored data that belongs to THIS payment,
    // otherwise an older order could be shown.
    const pendingMatches =
      pending &&
      (!urlReference ||
        !pending.reference ||
        String(pending.reference) === String(urlReference));

    const checkout =
      byReference?.checkout ||
      (pendingMatches ? pending?.checkout : null) ||
      null;

    const storedMatches =
      storedOrder &&
      (!urlReference ||
        String(storedOrder.paystackReference || "") ===
          String(urlReference) ||
        String(storedOrder.reference || "") === String(urlReference));

    const fromCheckout = checkout
      ? {
          items: Array.isArray(checkout.items) ? checkout.items : [],
          total: Number(checkout.total) || 0,
          sellerId: checkout.sellerId || "",
          buyerId: checkout.buyerId || "",
          customer: checkout.customer || {},
          paystackReference: urlReference || pending?.reference || "",
        }
      : {};

    return {
      ...fromCheckout,
      ...(storedMatches ? storedOrder : {}),
      ...(navigationOrder || {}),
    };
  }, [location.state, urlReference]);

  const [order, setOrder] = useState(
    Object.keys(draftOrder || {}).length ? draftOrder : null
  );

  const draftOrderId = draftOrder?.id || draftOrder?.orderId || "";

  /* -----------------------------------------------------
   * LOAD THE REAL ORDER FROM FIRESTORE (with retries)
   * ----------------------------------------------------- */
  useEffect(() => {
    if (!firebaseUser?.uid) return undefined;

    const uid = String(firebaseUser.uid);

    // Nothing to look up with at all.
    if (!urlReference && !urlOrderId && !draftOrderId) {
      setSyncState("missing");
      return undefined;
    }

    let cancelled = false;
    let timer = null;
    let attempts = 0;

    setSyncState("checking");

    const belongsToBuyer = (data) =>
      !data?.buyerId || String(data.buyerId) === uid;

    const findOrder = async () => {
      // 1. Exact order ID (URL first, then anything we already know).
      const ids = [urlOrderId, draftOrderId]
        .filter(Boolean)
        .map(String)
        .filter((v, i, arr) => arr.indexOf(v) === i);

      for (const id of ids) {
        try {
          const snap = await getDoc(doc(db, "orders", id));
          if (snap.exists() && belongsToBuyer(snap.data())) {
            return { id: snap.id, ...snap.data() };
          }
        } catch (error) {
          console.warn("Could not load order by ID:", error);
        }
      }

      // 2. Paystack reference. First scoped to this buyer (works with
      // typical Firestore rules), then unscoped as a fallback.
      if (urlReference) {
        for (const scoped of [true, false]) {
          for (const field of REFERENCE_FIELDS) {
            try {
              const constraints = scoped
                ? [
                    where("buyerId", "==", uid),
                    where(field, "==", String(urlReference)),
                  ]
                : [where(field, "==", String(urlReference))];

              const snapshot = await getDocs(
                query(collection(db, "orders"), ...constraints)
              );

              const match = snapshot.docs.find((d) =>
                belongsToBuyer(d.data())
              );

              if (match) {
                return { id: match.id, ...match.data() };
              }
            } catch (error) {
              console.warn(
                `Order lookup failed (${field}, scoped=${scoped}):`,
                error?.code || error
              );
            }
          }
        }
      }

      return null;
    };

    const tick = async () => {
      attempts += 1;

      const found = await findOrder();
      if (cancelled) return;

      if (found) {
        const merged = {
          ...(draftOrder || {}),
          ...found,
          paystackReference:
            found.paystackReference ||
            found.reference ||
            urlReference ||
            "",
        };

        setOrder(merged);
        setSyncState("ready");

        writeSession("lastOrder", merged);

        // Payment is done and the order exists: clear recovery data
        // so it can never leak into the next purchase.
        removeSession("campusmart_pending_checkout");
        removeSession("campusmart_pending_payment");
        if (urlReference) {
          removeSession(`campusmart_payment_${urlReference}`);
        }
        return;
      }

      if (attempts >= POLL_MAX_ATTEMPTS) {
        setSyncState("timeout");
        return;
      }

      timer = setTimeout(tick, POLL_DELAY_MS);
    };

    tick();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
    // draftOrder is derived from location.state + urlReference,
    // so those (via draftOrderId) cover it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    firebaseUser?.uid,
    urlReference,
    urlOrderId,
    draftOrderId,
    retryKey,
  ]);

  /* -----------------------------------------------------
   * DERIVED VALUES
   * ----------------------------------------------------- */
  const isChecking = syncState === "checking";
  const hasRealOrder = Boolean(order?.id);

  // Never generate a random number on render (it changed every render
  // before). Use the real number, else the Paystack reference.
  const orderNumber =
    order?.orderNumber ||
    order?.orderId ||
    order?.id ||
    urlReference ||
    "Pending";

  const total = Number(
    order?.total ?? order?.amount ?? order?.amountPaid ?? 0
  );

  const itemCount = Array.isArray(order?.items)
    ? order.items.reduce(
        (sum, item) => sum + Number(item?.quantity || 1),
        0
      )
    : 0;

  const showSkeleton = isChecking && !hasRealOrder && !itemCount;

  const formatMoney = (amount) =>
    `₦${Number(amount || 0).toLocaleString("en-NG")}`;

  const getPublicProfile = async (userId) => {
    if (!userId) return null;

    try {
      const profileRef = doc(db, "publicProfiles", String(userId));
      const snapshot = await getDoc(profileRef);

      if (!snapshot.exists()) return null;

      return {
        uid: String(userId),
        ...snapshot.data(),
      };
    } catch (error) {
      console.error("Could not load public profile:", error);
      return null;
    }
  };

  const handleCheckAgain = () => {
    setRetryKey((k) => k + 1);
  };

  /* -----------------------------------------------------
   * SHARE RECEIPT WITH SELLER
   * ----------------------------------------------------- */
  const sendReceiptToSeller = async () => {
    if (sharingReceipt) return;

    setReceiptError("");

    if (!firebaseUser?.uid) {
      setReceiptError("Please sign in to share your receipt.");
      return;
    }

    if (!order?.id) {
      setReceiptError(
        "This order does not have a valid order ID yet."
      );
      return;
    }

    const sellerId =
      order?.sellerId ||
      order?.sellerUid ||
      order?.seller?.uid ||
      order?.items?.[0]?.sellerId ||
      "";

    if (!sellerId) {
      setReceiptError(
        "We could not identify the seller for this order."
      );
      return;
    }

    if (String(sellerId) === String(firebaseUser.uid)) {
      setReceiptError("You cannot share a receipt with yourself.");
      return;
    }

    setSharingReceipt(true);

    try {
      const buyerId = String(firebaseUser.uid);
      const sellerIdString = String(sellerId);

      const participantIds = [buyerId, sellerIdString].sort();
      const conversationId = participantIds.join("_");

      const conversationRef = doc(db, "conversations", conversationId);

      const sellerProfile = await getPublicProfile(sellerIdString);

      const sellerName =
        sellerProfile?.fullName ||
        sellerProfile?.displayName ||
        order?.sellerName ||
        order?.seller?.name ||
        order?.items?.[0]?.sellerName ||
        "CampusMart Seller";

      const sellerImage =
        sellerProfile?.profileImage ||
        sellerProfile?.photoURL ||
        sellerProfile?.image ||
        sellerProfile?.avatar ||
        order?.sellerImage ||
        order?.seller?.profileImage ||
        order?.seller?.image ||
        order?.seller?.photoURL ||
        null;

      const buyerName =
        order?.customer?.fullName ||
        order?.fullName ||
        firebaseUser.displayName ||
        firebaseUser.email ||
        "CampusMart Customer";

      const buyerImage = firebaseUser.photoURL || null;

      /*
       * Create the conversation if it doesn't exist.
       * If it already exists, update participant info
       * without deleting the existing messages.
       */
      const existingConversation = await getDoc(conversationRef);

      if (existingConversation.exists()) {
        const existingData = existingConversation.data() || {};

        await setDoc(
          conversationRef,
          {
            participants: participantIds,
            buyerId,
            sellerId: sellerIdString,

            participantNames: {
              ...(existingData.participantNames || {}),
              [buyerId]: buyerName,
              [sellerIdString]: sellerName,
            },

            participantImages: {
              ...(existingData.participantImages || {}),
              [buyerId]: buyerImage,
              [sellerIdString]: sellerImage,
            },

            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      } else {
        await setDoc(conversationRef, {
          participants: participantIds,
          buyerId,
          sellerId: sellerIdString,

          participantNames: {
            [buyerId]: buyerName,
            [sellerIdString]: sellerName,
          },

          participantImages: {
            [buyerId]: buyerImage,
            [sellerIdString]: sellerImage,
          },

          unreadCounts: {
            [buyerId]: 0,
            [sellerIdString]: 0,
          },

          onlineStatus: {
            [buyerId]: true,
            [sellerIdString]: false,
          },

          lastMessage: "",
          lastMessageAt: 0,
          messages: [],

          productId:
            order?.items?.length === 1
              ? order.items[0]?.id || order.items[0]?.productId || null
              : null,

          productName:
            order?.items?.length === 1
              ? order.items[0]?.name || ""
              : "",

          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      /*
       * Permanent receipt URL, e.g.
       * https://campus-mart-ashen.vercel.app/receipt/abc123
       */
      const receiptUrl = `${window.location.origin}/receipt/${encodeURIComponent(
        String(order.id)
      )}`;

      /*
       * Transaction so two clicks or two devices
       * cannot overwrite each other's messages.
       */
      await runTransaction(db, async (transaction) => {
        const snapshot = await transaction.get(conversationRef);

        if (!snapshot.exists()) {
          throw new Error(
            "The seller conversation could not be created."
          );
        }

        const data = snapshot.data() || {};

        const participants = Array.isArray(data.participants)
          ? data.participants
          : [];

        if (!participants.includes(buyerId)) {
          throw new Error(
            "You are not a participant in this conversation."
          );
        }

        const receiverId =
          participants.find((uid) => String(uid) !== buyerId) ||
          sellerIdString;

        const existingMessages = Array.isArray(data.messages)
          ? data.messages
          : [];

        // Don't send the same receipt twice.
        const alreadySent = existingMessages.some(
          (message) =>
            message?.type === "receipt" &&
            String(message?.orderId) === String(order.id) &&
            String(message?.senderId) === buyerId
        );

        if (alreadySent) {
          return;
        }

        const nowMs = Date.now();

        const newMessage = {
          id: `${buyerId}_${nowMs}_${Math.random()
            .toString(36)
            .slice(2, 8)}`,

          senderId: buyerId,
          sender: "me",
          type: "receipt",

          text: `🧾 Payment receipt for order #${orderNumber}\n${receiptUrl}`,

          receiptUrl,
          orderId: String(order.id),
          orderNumber: String(orderNumber),
          amount: total,

          createdAt: Timestamp.fromMillis(nowMs),
          createdAtMs: nowMs,

          time: new Date(nowMs).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),

          deletedFor: [],
          delivered: true,
          read: false,
          status: "sent",
        };

        const currentUnread = Number(
          data.unreadCounts?.[receiverId] || 0
        );

        transaction.update(conversationRef, {
          messages: [...existingMessages, newMessage],

          lastMessage: `🧾 Payment receipt • ${formatMoney(total)}`,

          lastMessageAt: nowMs,

          [`unreadCounts.${receiverId}`]: currentUnread + 1,
          [`unreadCounts.${buyerId}`]: 0,

          updatedAt: serverTimestamp(),
        });
      });

      // Open the seller's conversation automatically.
      navigate(`/messages/${conversationId}`);
    } catch (error) {
      console.error("Error sharing receipt with seller:", error);

      setReceiptError(
        error?.message ||
          "We could not send the receipt. Please try again."
      );
    } finally {
      setSharingReceipt(false);
    }
  };

  /* -----------------------------------------------------
   * STATUS BADGE
   * ----------------------------------------------------- */
  const statusRaw = String(
    order?.paymentStatus || order?.status || "paid"
  );
  const isPaid = statusRaw.toLowerCase() === "paid";

  /* -----------------------------------------------------
   * RENDER
   * ----------------------------------------------------- */
  return (
    <CustomerLayout cartCount={cartCount}>
      <div className="min-h-[70vh] flex items-center justify-center px-2 py-8">
        <div className="w-full max-w-lg bg-white border border-gray-100 rounded-2xl p-6 sm:p-8 shadow-sm text-center">
          {/* SUCCESS ICON */}
          <div className="w-20 h-20 mx-auto rounded-full bg-green-100 text-green-600 flex items-center justify-center">
            <FiCheckCircle size={40} />
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mt-5">
            Payment successful
          </h1>

          <p className="text-gray-500 mt-2 leading-6">
            {hasRealOrder
              ? "Your payment was verified and your order has been placed. The seller can now process it."
              : "Your payment went through. We are confirming your order with the seller now."}
          </p>

          {isChecking && !hasRealOrder && (
            <p className="text-xs text-green-600 mt-2 flex items-center justify-center gap-2">
              <FiLoader size={12} className="animate-spin" />
              Confirming your order...
            </p>
          )}

          {/* ORDER SUMMARY */}
          <div className="mt-6 rounded-2xl bg-green-50 border border-green-100 p-4 text-left space-y-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-gray-500">Order number</span>

              <span className="text-sm font-bold text-[#008236] break-all text-right">
                #{orderNumber}
              </span>
            </div>

            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-gray-500">Items</span>

              <span className="text-sm font-semibold text-gray-800">
                {showSkeleton ? (
                  <span className="inline-block w-7 h-4 rounded bg-green-100 animate-pulse" />
                ) : itemCount ? (
                  itemCount
                ) : (
                  "—"
                )}
              </span>
            </div>

            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-gray-500">Amount paid</span>

              <span className="text-sm font-bold text-gray-900">
                {showSkeleton ? (
                  <span className="inline-block w-20 h-4 rounded bg-green-100 animate-pulse" />
                ) : total > 0 ? (
                  formatMoney(total)
                ) : (
                  "—"
                )}
              </span>
            </div>

            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-gray-500">Payment</span>

              <span className="text-sm font-semibold text-gray-800 capitalize">
                {order?.paymentMethod || "Paystack"}
              </span>
            </div>

            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-gray-500">Status</span>

              <span
                className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                  isPaid
                    ? "bg-green-100 text-[#008236]"
                    : "bg-yellow-100 text-yellow-700"
                }`}
              >
                {isPaid ? "Paid" : statusRaw}
              </span>
            </div>
          </div>

          {/* TAKING LONGER THAN EXPECTED */}
          {syncState === "timeout" && !hasRealOrder && (
            <div className="mt-4 rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-left">
              <div className="flex items-start gap-3">
                <FiAlertCircle
                  className="text-yellow-600 shrink-0 mt-0.5"
                  size={18}
                />

                <div className="min-w-0">
                  <p className="text-sm font-semibold text-yellow-800">
                    Your order is taking longer than usual
                  </p>

                  <p className="text-xs text-yellow-700 mt-1 leading-5">
                    Your payment went through, but the order has not
                    appeared yet. Tap "Check again", or look in your
                    Orders page in a minute.
                  </p>

                  <button
                    type="button"
                    onClick={handleCheckAgain}
                    className="mt-3 h-9 px-4 rounded-lg bg-yellow-600 hover:bg-yellow-700 text-white text-xs font-semibold flex items-center gap-2"
                  >
                    <FiRefreshCw size={14} />
                    Check again
                  </button>
                </div>
              </div>
            </div>
          )}

          {syncState === "missing" && !hasRealOrder && (
            <div className="mt-4 rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-left">
              <p className="text-sm font-semibold text-yellow-800">
                We could not find this payment reference
              </p>

              <p className="text-xs text-yellow-700 mt-1 leading-5">
                Open your Orders page to see your latest orders.
              </p>
            </div>
          )}

          {/* RECEIPT ERROR */}
          {receiptError && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-left">
              <p className="text-sm font-semibold text-red-700">
                Receipt sharing failed
              </p>

              <p className="text-xs text-red-600 mt-1 leading-5">
                {receiptError}
              </p>
            </div>
          )}

          {/* VIEW RECEIPT */}
          <button
            type="button"
            onClick={() => {
              if (!order?.id) return;
              navigate(`/receipt/${encodeURIComponent(String(order.id))}`);
            }}
            disabled={!hasRealOrder}
            className="
              mt-6 w-full h-12 rounded-xl
              border border-green-200 bg-green-50
              text-[#008236] hover:bg-green-100
              disabled:opacity-50 disabled:cursor-not-allowed
              font-semibold flex items-center justify-center gap-2
              transition
            "
          >
            {!hasRealOrder && isChecking ? (
              <>
                <FiLoader size={18} className="animate-spin" />
                Preparing Receipt...
              </>
            ) : (
              <>
                <FiList size={18} />
                View Receipt
              </>
            )}
          </button>

          {/* SHARE RECEIPT */}
          <button
            type="button"
            onClick={sendReceiptToSeller}
            disabled={sharingReceipt || !hasRealOrder}
            className="
              mt-3 w-full h-12 rounded-xl
              bg-[#008236] hover:bg-[#006f2e]
              disabled:bg-green-300 disabled:cursor-not-allowed
              text-white font-semibold
              flex items-center justify-center gap-2
              transition
            "
          >
            {sharingReceipt ? (
              <>
                <FiLoader size={18} className="animate-spin" />
                Sending receipt to seller...
              </>
            ) : (
              <>
                <FiShare2 size={18} />
                Share Receipt with Seller
              </>
            )}
          </button>

          <p className="text-xs text-gray-400 mt-2">
            Your receipt will be sent directly to the seller in your
            CampusMart chat.
          </p>

          {/* OTHER BUTTONS */}
          <div className="mt-5 flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() =>
                navigate(order?.id ? `/orders/${order.id}` : "/orders")
              }
              className="
                flex-1 h-12 rounded-xl
                bg-green-600 hover:bg-green-700
                text-white font-semibold
                flex items-center justify-center gap-2
              "
            >
              <FiList size={18} />
              View order
            </button>

            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="
                flex-1 h-12 rounded-xl
                border border-gray-200 text-gray-700
                font-semibold hover:bg-gray-50
                flex items-center justify-center gap-2
              "
            >
              <FiHome size={18} />
              Dashboard
            </button>
          </div>

          <button
            type="button"
            onClick={() => navigate("/browse-products")}
            className="
              mt-4 text-sm text-green-600
              hover:text-green-700 font-medium
              flex items-center justify-center gap-2
              w-full
            "
          >
            <FiPackage size={16} />
            Continue shopping
          </button>
        </div>
      </div>
    </CustomerLayout>
  );
}

export default OrderSuccess;