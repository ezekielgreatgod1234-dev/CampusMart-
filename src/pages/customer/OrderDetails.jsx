import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import CustomerLayout from "../../layouts/CustomerLayout";

import {
  FiArrowLeft,
  FiPackage,
  FiMapPin,
  FiCreditCard,
  FiCheckCircle,
  FiXCircle,
  FiAlertTriangle,
} from "react-icons/fi";

function OrderDetails({
  orders = [],
  cartCount = 0,
  cancelOrder,
}) {
  const navigate = useNavigate();
  const { id } = useParams();

  const [cancelling, setCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] =
    useState(false);
  const [cancelError, setCancelError] = useState("");

  const order = orders.find(
    (item) => String(item.id) === String(id)
  );

  if (!order) {
    return (
      <CustomerLayout cartCount={cartCount}>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <div className="w-20 h-20 mx-auto rounded-full bg-red-50 text-red-500 flex items-center justify-center">
              <FiPackage size={35} />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mt-5">
              Order Not Found
            </h1>
            <p className="text-gray-500 mt-2">
              We couldn&apos;t find this order.
            </p>
            <button
              onClick={() => navigate("/orders")}
              className="mt-6 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-semibold"
            >
              Back to Orders
            </button>
          </div>
        </div>
      </CustomerLayout>
    );
  }

  const deliveryInfo =
    order.deliveryInformation ||
    order.deliveryInfo ||
    order.deliveryDetails ||
    order.shippingAddress ||
    order.delivery ||
    order.customerInfo ||
    order.customer ||
    {};

  const fullName =
    order.fullName ||
    deliveryInfo.fullName ||
    deliveryInfo.name ||
    "";

  const phone =
    order.phone ||
    order.phoneNumber ||
    deliveryInfo.phone ||
    deliveryInfo.phoneNumber ||
    "";

  const campus =
    order.campus || deliveryInfo.campus || "";

  const address =
    order.address ||
    order.deliveryAddress ||
    deliveryInfo.address ||
    deliveryInfo.deliveryAddress ||
    "";

  const note =
    order.note ||
    order.deliveryNote ||
    deliveryInfo.note ||
    deliveryInfo.deliveryNote ||
    "";

  const totalItems =
    order.items?.reduce(
      (total, item) => total + Number(item.quantity || 0),
      0
    ) || 0;

  const status = String(order.status || "placed").toLowerCase();
  const isCancelled = status === "cancelled";
  const isDelivered = status === "delivered";
  const canCancel =
    !isCancelled &&
    !isDelivered &&
    ["pending", "placed", "processing", ""].includes(status);

  const statusStyles = {
    cancelled: "bg-red-50 text-red-600 border border-red-100",
    delivered: "bg-[#008236] text-white",
    processing:
      "bg-green-100 text-[#006f2e] border border-green-200",
    shipped:
      "bg-emerald-50 text-emerald-700 border border-emerald-200",
    pending:
      "bg-green-50 text-[#008236] border border-green-200",
    placed:
      "bg-green-50 text-[#008236] border border-green-200",
  };

  const statusClass =
    statusStyles[status] ||
    "bg-green-50 text-[#008236] border border-green-200";

  const handleCancelOrder = async () => {
    if (!canCancel || cancelling) return;

    setCancelError("");
    setCancelling(true);

    try {
      if (typeof cancelOrder === "function") {
        await cancelOrder(order.id);
      } else {
        // Fallback: local-only if parent has no cancelOrder
        console.warn(
          "cancelOrder prop not provided — wire it in App.jsx to update Firestore"
        );
        setCancelError(
          "Cancel is not available right now. Please try again later."
        );
        setCancelling(false);
        return;
      }

      setShowCancelConfirm(false);
    } catch (error) {
      console.error("Cancel order error:", error);
      setCancelError(
        "Could not cancel this order. Please try again."
      );
    } finally {
      setCancelling(false);
    }
  };

  return (
    <CustomerLayout cartCount={cartCount}>
      <div className="space-y-6">
        {/* HEADER */}
        <div>
          <button
            onClick={() => navigate("/orders")}
            className="flex items-center gap-2 text-gray-500 hover:text-green-600 transition"
          >
            <FiArrowLeft />
            Back to Orders
          </button>

          <div className="mt-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-sm text-gray-500">
                  Order Number
                </p>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mt-1">
                  #{order.orderNumber || order.id}
                </h1>
                <p className="text-sm text-gray-500 mt-2">
                  Placed on {order.date || "—"}
                </p>
              </div>

              <span
                className={`
                  w-fit px-4 py-2 rounded-full text-sm font-semibold
                  ${statusClass}
                `}
              >
                {isCancelled
                  ? "Cancelled"
                  : order.status || "Placed"}
              </span>
            </div>
          </div>
        </div>

        {cancelError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <FiAlertTriangle className="text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-red-600">{cancelError}</p>
          </div>
        )}

        {isCancelled && (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-5 flex items-center gap-4">
            <FiXCircle className="text-red-500 shrink-0" size={25} />
            <div>
              <h3 className="font-semibold text-red-800">
                Order cancelled
              </h3>
              <p className="text-sm text-red-700 mt-1">
                This order was cancelled. The seller will not process it.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* PRODUCTS */}
          <section className="xl:col-span-2 bg-white rounded-2xl border border-gray-100 p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
                <FiPackage size={21} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-800">
                  Ordered Items
                </h2>
                <p className="text-sm text-gray-500">
                  {order.items?.length || 0} product(s)
                </p>
              </div>
            </div>

            <div className="space-y-4 mt-6">
              {order.items?.map((item, index) => (
                <div
                  key={`${item.id}-${index}`}
                  className="flex gap-4 p-3 rounded-xl border border-gray-100"
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-xl bg-gray-100 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-green-600 font-medium">
                      {item.category}
                    </p>
                    <h3 className="font-semibold text-gray-800 mt-1">
                      {item.name}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Quantity: {item.quantity}
                    </p>
                    <p className="font-bold text-gray-900 mt-2">
                      {item.price}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* RIGHT */}
          <div className="space-y-6">
            <section className="bg-white rounded-2xl border border-gray-100 p-5">
              <h2 className="text-lg font-bold text-gray-800">
                Order Summary
              </h2>
              <div className="space-y-4 mt-5">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Items</span>
                  <span className="font-medium">{totalItems}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Delivery</span>
                  <span className="font-medium text-green-600">
                    Free
                  </span>
                </div>
              </div>
              <div className="border-t border-gray-100 mt-5 pt-5 flex justify-between">
                <span className="font-semibold text-gray-800">
                  Total
                </span>
                <span className="text-xl font-bold text-gray-900">
                  ₦{Number(order.total || 0).toLocaleString()}
                </span>
              </div>
            </section>

            <section className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-center gap-3">
                <FiCreditCard className="text-green-600" />
                <h2 className="font-bold text-gray-800">Payment</h2>
              </div>
              <p className="text-sm text-gray-500 mt-3">
                {order.paymentMethod === "cash"
                  ? "Pay on Delivery"
                  : "Paystack / Card"}
              </p>
            </section>

            <section className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
                  <FiMapPin size={21} />
                </div>
                <div>
                  <h2 className="font-bold text-gray-800">
                    Delivery Information
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Your order will be delivered to this address.
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-4">
                <div>
                  <p className="text-xs text-gray-400">Full Name</p>
                  <p className="text-sm font-medium text-gray-800 mt-1">
                    {fullName || "Not provided"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Phone Number</p>
                  <p className="text-sm font-medium text-gray-800 mt-1">
                    {phone || "Not provided"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Campus</p>
                  <p className="text-sm font-medium text-gray-800 mt-1">
                    {campus || "Not provided"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">
                    Delivery Address
                  </p>
                  <p className="text-sm font-medium text-gray-800 mt-1">
                    {address || "Not provided"}
                  </p>
                </div>
                {note && (
                  <div>
                    <p className="text-xs text-gray-400">
                      Delivery Note
                    </p>
                    <p className="text-sm text-gray-700 mt-1 bg-gray-50 rounded-xl p-3">
                      {note}
                    </p>
                  </div>
                )}
              </div>
            </section>

            {/* CANCEL ORDER */}
            {canCancel && (
              <section className="bg-white rounded-2xl border border-red-100 p-5">
                <h2 className="font-bold text-gray-800">
                  Cancel order
                </h2>
                <p className="text-sm text-gray-500 mt-2">
                  Placed by mistake? You can cancel this order.
                  The seller will no longer see it.
                </p>
                <button
                  type="button"
                  onClick={() => setShowCancelConfirm(true)}
                  disabled={cancelling}
                  className="
                    mt-4 w-full h-11 rounded-xl
                    border border-red-200 text-red-600
                    font-semibold text-sm
                    hover:bg-red-50 transition
                    disabled:opacity-50
                  "
                >
                  Cancel this order
                </button>
              </section>
            )}
          </div>
        </div>

        {!isCancelled && (
          <div className="bg-green-50 border border-green-100 rounded-2xl p-5 flex items-center gap-4">
            <FiCheckCircle
              className="text-green-600 shrink-0"
              size={25}
            />
            <div>
              <h3 className="font-semibold text-green-800">
                Order Placed Successfully
              </h3>
              <p className="text-sm text-green-700 mt-1">
                Your order has been received and is being processed.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* CANCEL CONFIRM MODAL */}
      {showCancelConfirm && (
        <div
          className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-[2px] flex items-end sm:items-center justify-center p-4"
          onClick={() => {
            if (!cancelling) setShowCancelConfirm(false);
          }}
        >
          <div
            className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center">
                  <FiXCircle size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    Cancel order?
                  </h3>
                  <p className="text-sm text-gray-500">
                    This cannot be undone.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-5 text-sm text-gray-600 leading-6">
              If you cancel, the seller will no longer see this
              order and it will be marked as cancelled in your
              order history.
            </div>

            <div className="p-4 bg-gray-50 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                disabled={cancelling}
                onClick={() => setShowCancelConfirm(false)}
                className="flex-1 h-11 rounded-xl border border-gray-200 bg-white text-gray-600 font-semibold text-sm"
              >
                Keep order
              </button>
              <button
                type="button"
                disabled={cancelling}
                onClick={handleCancelOrder}
                className="flex-1 h-11 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-sm disabled:opacity-60"
              >
                {cancelling ? "Cancelling..." : "Yes, cancel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </CustomerLayout>
  );
}

export default OrderDetails;