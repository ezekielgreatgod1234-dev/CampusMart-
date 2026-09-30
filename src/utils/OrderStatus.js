// src/utils/orderStatus.js
// One place that decides what an order's status means, so buyer, seller and
// admin pages always agree.
//
// Firestore fields used on each order document:
//   status            "pending" | "successful" | "cancelled"
//   sellerConfirmed   true when the seller marked the order successful
//   buyerConfirmed    true when the buyer approved the delivery
//   sellerSeen        false on creation; set true once the seller has opened Orders
//   sellerConfirmedAt / buyerConfirmedAt / completedAt   server timestamps

export const toMillis = (value) => {
  if (!value) return 0;
  if (typeof value.toMillis === "function") return value.toMillis();
  if (value.seconds) return value.seconds * 1000;
  if (typeof value === "number") return value;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
};

export const formatOrderDate = (value) => {
  const ms = toMillis(value);
  if (!ms) return "—";
  return new Date(ms).toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

export const formatMoney = (value) => {
  const n = Number(String(value ?? 0).replace(/[₦,]/g, ""));
  return `₦${(Number.isFinite(n) ? n : 0).toLocaleString("en-NG")}`;
};

const SUCCESS_WORDS = ["successful", "success", "delivered", "completed"];

const rawStatus = (order) => String(order?.status || "pending").toLowerCase();

export const isCancelled = (order) =>
  ["cancelled", "canceled"].includes(rawStatus(order));

export const isBuyerConfirmed = (order) => order?.buyerConfirmed === true;

// Older orders only have status "delivered"; treat that as the seller's mark.
export const isSellerConfirmed = (order) =>
  order?.sellerConfirmed === true ||
  (SUCCESS_WORDS.includes(rawStatus(order)) && order?.buyerConfirmed !== true);

// "successful" if EITHER the seller marked it OR the buyer approved delivery.
export const normalizeOrderStatus = (order) => {
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

export const STATUS_STYLES = {
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

export const getItemPrice = (item) =>
  Number(String(item?.price ?? 0).replace(/[₦,]/g, "")) || 0;

export const getOrderItems = (order) => {
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

export const getOrderTotal = (order) => {
  const direct = order?.total || order?.amount || order?.amountPaid;
  if (direct) return Number(String(direct).replace(/[₦,]/g, "")) || 0;
  return getOrderItems(order).reduce(
    (sum, item) => sum + getItemPrice(item) * (item.quantity || 1),
    0
  );
};

export const getBuyerName = (order) =>
  order?.customerName ||
  order?.customer?.fullName ||
  order?.customer?.name ||
  order?.buyerName ||
  "Buyer";

export const getOrderNumber = (order) =>
  order?.orderNumber
    ? String(order.orderNumber).startsWith("#")
      ? order.orderNumber
      : `#${order.orderNumber}`
    : `#${String(order?.id || "").slice(0, 8).toUpperCase()}`;

export const getPaymentInfo = (order) => {
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