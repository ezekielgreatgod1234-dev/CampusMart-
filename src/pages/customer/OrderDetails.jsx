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
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelError, setCancelError] = useState("");

  const order = orders.find(
    (item) => String(item.id) === String(id)
  );

  if (!order) {
    return (
      <CustomerLayout cartCount={cartCount}>
        <div className="min-h-[60vh] flex items-center justify-center px-4">
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
              type="button"
              onClick={() => navigate("/orders")}
              className="mt-6 bg-green-600 hover:bg-green-700 text-white px-6 py-3.5 rounded-xl font-semibold text-sm sm:text-base"
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

  const campus = order.campus || deliveryInfo.campus || "";

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
    processing: "bg-green-100 text-[#006f2e] border border-green-200",
    shipped: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    pending: "bg-green-50 text-[#008236] border border-green-200",
    placed: "bg-green-50 text-[#008236] border border-green-200",
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
      setCancelError("Could not cancel this order. Please try again.");
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
            type="button"
            onClick={() => navigate("/orders")}
            className="flex items-center gap-2 text-gray-500 hover:text-green-600 transition"
          >
            <FiArrowLeft />
            Back to Orders
          </button>

          <div className="mt-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-sm text-gray-500">Order Number</p>
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
                {isCancelled ? "Cancelled" : order.status || "Placed"}
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
              <h3 className="font-semibold text-red-800">Order cancelled</h3>
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
                    <p className="font-bold text-gray-900 mt-2">{item.price}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* RIGHT */}
          <div className="space-y-6">
            <section className="bg-white rounded-2xl border border-gray-100 p-5">
              <h2 className="text-lg font-bold text-gray-800">Order Summary</h2>
              <div className="space-y-4 mt-5">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Items</span>
                  <span className="font-medium">{totalItems}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Delivery</span>
                  <span className="font-medium text-green-600">Free</span>
                </div>
              </div>
              <div className="border-t border-gray-100 mt-5 pt-5 flex justify-between">
                <span className="font-semibold text-gray-800">Total</span>
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
                  <p className="text-xs text-gray-400">Delivery Address</p>
                  <p className="text-sm font-medium text-gray-800 mt-1">
                    {address || "Not provided"}
                  </p>
                </div>
                {note && (
                  <div>
                    <p className="text-xs text-gray-400">Delivery Note</p>
                    <p className="text-sm text-gray-700 mt-1 bg-gray-50 rounded-xl p-3">
                      {note}
                    </p>
                  </div>
                )}
              </div>
            </section>

            {/* CANCEL ORDER — larger touch target */}
            {canCancel && (
              <section className="bg-white rounded-2xl border border-green-100 p-5">
                <h2 className="font-bold text-gray-800">Cancel order</h2>
                <p className="text-sm text-gray-500 mt-2 leading-6">
                  Placed by mistake? You can cancel this order. The seller will
                  no longer see it.
                </p>
                <button
                  type="button"
                  onClick={() => setShowCancelConfirm(true)}
                  disabled={cancelling}
                  className="
                    mt-4 w-full min-h-[48px] h-12 sm:h-12
                    rounded-xl
                    bg-[#008236] hover:bg-[#006f2e] active:bg-[#005f28]
                    text-white font-semibold text-sm sm:text-base
                    transition disabled:opacity-50
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
            <FiCheckCircle className="text-green-600 shrink-0" size={25} />
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

      {/* CANCEL CONFIRM MODAL — mobile bottom sheet, large green buttons */}
      {showCancelConfirm && (
        <div
          className="
            fixed inset-0 z-[100]
            bg-black/50 backdrop-blur-[2px]
            flex items-end sm:items-center justify-center
            p-0 sm:p-4
          "
          onClick={() => {
            if (!cancelling) setShowCancelConfirm(false);
          }}
        >
          <div
            className="
              w-full sm:max-w-md
              bg-white
              rounded-t-3xl sm:rounded-2xl
              shadow-2xl
              overflow-hidden
              border border-gray-100
              max-h-[90dvh]
              flex flex-col
            "
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mobile drag handle */}
            <div className="sm:hidden flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-gray-300" />
            </div>

            <div className="px-5 pt-3 sm:pt-5 pb-4 border-b border-gray-100">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-full bg-green-50 text-[#008236] flex items-center justify-center shrink-0 border border-green-100">
                  <FiXCircle size={22} />
                </div>
                <div className="min-w-0 pt-0.5">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                    Cancel order?
                  </h3>
                  <p className="text-sm text-gray-500 mt-0.5">
                    This cannot be undone.
                  </p>
                </div>
              </div>
            </div>

            <div className="px-5 py-5 text-sm sm:text-[15px] text-gray-600 leading-6">
              If you cancel, the seller will no longer see this order and it
              will be marked as cancelled in your order history.
            </div>

            {/* Buttons — stacked on mobile, full width, large, green */}
            <div
              className="
                px-5 pt-2 pb-5 sm:pb-5
                flex flex-col gap-3
                bg-gray-50 border-t border-gray-100
              "
              style={{
                paddingBottom:
                  "max(1.25rem, env(safe-area-inset-bottom))",
              }}
            >
              <button
                type="button"
                disabled={cancelling}
                onClick={handleCancelOrder}
                className="
                  w-full min-h-[52px] h-13
                  rounded-xl
                  bg-[#008236] hover:bg-[#006f2e] active:bg-[#005f28]
                  text-white font-semibold text-base
                  disabled:opacity-60 transition
                  flex items-center justify-center
                "
              >
                {cancelling ? "Cancelling..." : "Yes, cancel"}
              </button>

              <button
                type="button"
                disabled={cancelling}
                onClick={() => setShowCancelConfirm(false)}
                className="
                  w-full min-h-[52px] h-13
                  rounded-xl
                  border-2 border-[#008236]
                  bg-white text-[#008236]
                  font-semibold text-base
                  hover:bg-green-50 active:bg-green-100
                  disabled:opacity-60 transition
                  flex items-center justify-center
                "
              >
                Keep order
              </button>
            </div>
          </div>
        </div>
      )}
    </CustomerLayout>
  );
}

export default OrderDetails;