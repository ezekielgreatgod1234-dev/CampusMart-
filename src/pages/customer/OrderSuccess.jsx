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

function OrderSuccess({ cartCount = 0 }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { firebaseUser } = useAuth();

  const [sharingReceipt, setSharingReceipt] = useState(false);
  const [receiptError, setReceiptError] = useState("");

  /*
   * The Paystack callback can reload /order-success without preserving
   * React location state. That is why the old page could show:
   * Items — / Amount paid ₦0.
   *
   * We first use the order passed through navigation/sessionStorage,
   * then refresh the actual order from Firestore using its ID or the
   * Paystack reference in the URL.
   */
  const initialOrder = useMemo(() => {
    let navigationOrder =
      location.state?.order || null;

    let storedOrder = null;
    let pendingPayment = null;

    try {
      const raw = sessionStorage.getItem("lastOrder");
      if (raw) {
        storedOrder = JSON.parse(raw);
      }
    } catch {
      // Ignore invalid session data.
    }

    try {
      const raw = sessionStorage.getItem(
        "campusmart_pending_payment"
      );
      if (raw) {
        pendingPayment = JSON.parse(raw);
      }
    } catch {
      // Ignore invalid payment recovery data.
    }

    return {
      ...(storedOrder || {}),
      ...(pendingPayment?.order || {}),
      ...(navigationOrder || {}),
    };
  }, [location.state]);

  const [order, setOrder] = useState(
    Object.keys(initialOrder || {}).length
      ? initialOrder
      : null
  );
  const [orderLoading, setOrderLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadRealOrder = async () => {
      if (!firebaseUser?.uid) {
        setOrder(
          Object.keys(initialOrder || {}).length
            ? initialOrder
            : null
        );
        setOrderLoading(false);
        return;
      }

      setOrderLoading(true);

      try {
        const params = new URLSearchParams(location.search || "");

        let pendingPayment = null;

        try {
          const raw = sessionStorage.getItem(
            "campusmart_pending_payment"
          );
          if (raw) {
            pendingPayment = JSON.parse(raw);
          }
        } catch {
          // Ignore invalid storage.
        }

        const urlOrderId =
          params.get("orderId") ||
          params.get("orderID") ||
          params.get("order_id") ||
          pendingPayment?.orderId ||
          initialOrder?.orderId ||
          initialOrder?.id ||
          "";

        const urlReference =
          params.get("reference") ||
          params.get("trxref") ||
          pendingPayment?.reference ||
          initialOrder?.paystackReference ||
          initialOrder?.reference ||
          "";

        let freshOrder = null;

        // 1. BEST PATH: the exact Firestore order ID was included
        // in the Paystack callback URL.
        if (urlOrderId) {
          try {
            const orderSnap = await getDoc(
              doc(db, "orders", String(urlOrderId))
            );

            if (orderSnap.exists()) {
              const data = orderSnap.data() || {};

              if (
                !data.buyerId ||
                String(data.buyerId) ===
                  String(firebaseUser.uid)
              ) {
                freshOrder = {
                  id: orderSnap.id,
                  ...data,
                };
              }
            }
          } catch (error) {
            console.warn(
              "Could not load order by order ID:",
              error
            );
          }
        }

        // 1. If we already have the Firestore order ID, read that exact order.
        if (initialOrder?.id) {
          try {
            const orderSnap = await getDoc(
              doc(db, "orders", String(initialOrder.id))
            );

            if (orderSnap.exists()) {
              const data = orderSnap.data() || {};

              // Only use the order if it belongs to the signed-in buyer.
              if (
                !data.buyerId ||
                String(data.buyerId) === String(firebaseUser.uid)
              ) {
                freshOrder = {
                  id: orderSnap.id,
                  ...data,
                };
              }
            }
          } catch (error) {
            console.warn("Could not refresh order by ID:", error);
          }
        }

        // 2. If the callback only gives a Paystack reference,
        // find the order in Firestore.
        if (!freshOrder && urlReference) {
          try {
            const orderQuery = query(
              collection(db, "orders"),
              where(
                "paystackReference",
                "==",
                String(urlReference)
              )
            );

            const snapshot = await getDocs(orderQuery);

            const matchingDoc = snapshot.docs.find(
              (docSnap) => {
                const data = docSnap.data() || {};

                return (
                  !data.buyerId ||
                  String(data.buyerId) ===
                    String(firebaseUser.uid)
                );
              }
            );

            if (matchingDoc) {
              freshOrder = {
                id: matchingDoc.id,
                ...matchingDoc.data(),
              };
            }
          } catch (error) {
            console.warn(
              "Could not find order by Paystack reference:",
              error
            );
          }
        }

        // 3. Last local fallback. This is useful immediately after
        // Paystack redirects, before the webhook has updated Firestore.
        if (!freshOrder && pendingPayment?.order) {
          freshOrder = {
            id:
              pendingPayment.orderId ||
              pendingPayment.order.id ||
              pendingPayment.order.orderId ||
              null,
            ...pendingPayment.order,
          };
        }

        // 4. Merge Firestore data over the temporary order object.
        if (!cancelled) {
          const finalOrder = freshOrder
            ? {
                ...(initialOrder || {}),
                ...freshOrder,
              }
            : Object.keys(initialOrder || {}).length
            ? initialOrder
            : null;

          setOrder(finalOrder);

          if (finalOrder?.id) {
            try {
              sessionStorage.setItem(
                "lastOrder",
                JSON.stringify(finalOrder)
              );
            } catch {
              // Storage may be unavailable; the page can still work.
            }
          }
        }
      } finally {
        if (!cancelled) {
          setOrderLoading(false);
        }
      }
    };

    loadRealOrder();

    return () => {
      cancelled = true;
    };
  }, [
    firebaseUser?.uid,
    initialOrder,
    location.search,
  ]);

  const orderNumber =
    order?.orderNumber ||
    order?.orderId ||
    order?.id ||
    `CM-${Date.now().toString().slice(-6)}`;

  const total = Number(
    order?.total ??
      order?.amount ??
      order?.amountPaid ??
      0
  );

  const itemCount = Array.isArray(order?.items)
    ? order.items.reduce(
        (sum, item) => sum + Number(item.quantity || 1),
        0
      )
    : 0;

  const formatMoney = (amount) =>
    `₦${Number(amount || 0).toLocaleString("en-NG")}`;

  const getProfileName = (profile, user = null) =>
    profile?.fullName ||
    profile?.displayName ||
    user?.displayName ||
    user?.email ||
    "CampusMart User";

  const getProfileImage = (profile, user = null) =>
    profile?.profileImage ||
    profile?.photoURL ||
    profile?.image ||
    profile?.avatar ||
    user?.photoURL ||
    null;

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
      "";

    if (!sellerId) {
      setReceiptError(
        "We could not identify the seller for this order."
      );
      return;
    }

    if (String(sellerId) === String(firebaseUser.uid)) {
      setReceiptError(
        "You cannot share a receipt with yourself."
      );
      return;
    }

    setSharingReceipt(true);

    try {
      const buyerId = String(firebaseUser.uid);
      const sellerIdString = String(sellerId);

      const participantIds = [buyerId, sellerIdString].sort();
      const conversationId = participantIds.join("_");

      const conversationRef = doc(
        db,
        "conversations",
        conversationId
      );

      const sellerProfile = await getPublicProfile(
        sellerIdString
      );

      const sellerName =
        sellerProfile?.fullName ||
        sellerProfile?.displayName ||
        order?.sellerName ||
        order?.seller?.name ||
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
       * If it already exists, update the participant information
       * without deleting the existing messages.
       */
      const existingConversation =
        await getDoc(conversationRef);

      if (existingConversation.exists()) {
        const existingData =
          existingConversation.data() || {};

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
              ? order.items[0]?.id ||
                order.items[0]?.productId ||
                null
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
       * This is the permanent receipt URL.
       *
       * Example:
       * https://campus-mart-ashen.vercel.app/receipt/abc123
       */
      const receiptUrl = `${window.location.origin}/receipt/${encodeURIComponent(
        String(order.id)
      )}`;

      /*
       * Send the receipt into the seller's DM.
       *
       * We use a transaction so two clicks or two devices
       * cannot accidentally overwrite each other's messages.
       */
      await runTransaction(db, async (transaction) => {
        const snapshot =
          await transaction.get(conversationRef);

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
          participants.find(
            (uid) => String(uid) !== buyerId
          ) || sellerIdString;

        const existingMessages = Array.isArray(
          data.messages
        )
          ? data.messages
          : [];

        /*
         * Prevent accidentally sending the same receipt
         * repeatedly if the user clicks very quickly.
         */
        const alreadySent = existingMessages.some(
          (message) =>
            message?.type === "receipt" &&
            String(message?.orderId) ===
              String(order.id) &&
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
          messages: [
            ...existingMessages,
            newMessage,
          ],

          lastMessage: `🧾 Payment receipt • ${formatMoney(
            total
          )}`,

          lastMessageAt: nowMs,

          [`unreadCounts.${receiverId}`]:
            currentUnread + 1,

          [`unreadCounts.${buyerId}`]: 0,

          updatedAt: serverTimestamp(),
        });
      });

      /*
       * Open the seller's conversation automatically.
       */
      navigate(`/messages/${conversationId}`);
    } catch (error) {
      console.error(
        "Error sharing receipt with seller:",
        error
      );

      setReceiptError(
        error?.message ||
          "We could not send the receipt. Please try again."
      );
    } finally {
      setSharingReceipt(false);
    }
  };

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
            Your payment was verified and your order has
            been placed. The seller can now process it.
          </p>

          {orderLoading && (
            <p className="text-xs text-green-600 mt-2">
              Loading your order details...
            </p>
          )}

          {/* ORDER SUMMARY */}
          <div className="mt-6 rounded-2xl bg-green-50 border border-green-100 p-4 text-left space-y-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-gray-500">
                Order number
              </span>

              <span className="text-sm font-bold text-[#008236]">
                #{orderNumber}
              </span>
            </div>

            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-gray-500">
                Items
              </span>

              <span className="text-sm font-semibold text-gray-800">
                {orderLoading ? (
                  <span className="inline-block w-7 h-4 rounded bg-green-100 animate-pulse" />
                ) : (
                  itemCount || "0"
                )}
              </span>
            </div>

            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-gray-500">
                Amount paid
              </span>

              <span className="text-sm font-bold text-gray-900">
                {orderLoading ? (
                  <span className="inline-block w-20 h-4 rounded bg-green-100 animate-pulse" />
                ) : (
                  formatMoney(total)
                )}
              </span>
            </div>

            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-gray-500">
                Payment
              </span>

              <span className="text-sm font-semibold text-gray-800 capitalize">
                {order?.paymentMethod || "Paystack"}
              </span>
            </div>

            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-gray-500">
                Status
              </span>

              <span
                className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                  String(
                    order?.paymentStatus ||
                      order?.status ||
                      "paid"
                  ).toLowerCase() === "paid"
                    ? "bg-green-100 text-[#008236]"
                    : "bg-yellow-100 text-yellow-700"
                }`}
              >
                {String(
                  order?.paymentStatus ||
                    order?.status ||
                    "paid"
                ).toLowerCase() === "paid"
                  ? "Paid"
                  : String(
                      order?.paymentStatus ||
                        order?.status ||
                        "Paid"
                    )}
              </span>
            </div>
          </div>

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
              navigate(
                `/receipt/${encodeURIComponent(
                  String(order.id)
                )}`
              );
            }}
            disabled={orderLoading || !order?.id}
            className="
              mt-6 w-full h-12 rounded-xl
              border border-green-200 bg-green-50
              text-[#008236] hover:bg-green-100
              disabled:opacity-50 disabled:cursor-not-allowed
              font-semibold flex items-center justify-center gap-2
              transition
            "
          >
            <FiList size={18} />
            {orderLoading ? "Loading Receipt..." : "View Receipt"}
          </button>

          {/* SHARE RECEIPT */}
          <button
            type="button"
            onClick={sendReceiptToSeller}
            disabled={sharingReceipt || orderLoading || !order?.id}
            className="
              mt-3 w-full h-12 rounded-xl
              bg-[#008236] hover:bg-[#006f2e]
              disabled:bg-green-300
              text-white font-semibold
              flex items-center justify-center gap-2
              transition
            "
          >
            {sharingReceipt ? (
              <>
                <FiLoader
                  size={18}
                  className="animate-spin"
                />
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
            Your receipt will be sent directly to the seller
            in your CampusMart chat.
          </p>

          {/* OTHER BUTTONS */}
          <div className="mt-5 flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() =>
                navigate(
                  order?.id
                    ? `/orders/${order.id}`
                    : "/orders"
                )
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
            onClick={() =>
              navigate("/browse-products")
            }
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