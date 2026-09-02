
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

import {
  FiClock,
  FiCheckCircle,
} from "react-icons/fi";

function OrderSummary({ orders = [] }) {
  const navigate = useNavigate();

  // Get the current order status
  const getStatus = (order) =>
    String(order?.status || "pending")
      .trim()
      .toLowerCase();

  /*
   * DELIVERED
   * Only orders marked "delivered" are counted here.
   */
  const deliveredOrders = useMemo(() => {
    return orders.filter(
      (order) => getStatus(order) === "delivered"
    );
  }, [orders]);

  /*
   * PENDING
   *
   * Everything that has NOT been delivered or cancelled
   * is considered pending.
   *
   * This means if the seller changes an order to:
   * pending
   * processing
   * shipped
   *
   * it remains under Pending.
   */
  const pendingOrders = useMemo(() => {
    return orders.filter((order) => {
      const status = getStatus(order);

      return (
        status !== "delivered" &&
        status !== "cancelled" &&
        status !== "canceled"
      );
    });
  }, [orders]);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-gray-800">
          Order Summary
        </h2>

        <button
          type="button"
          onClick={() => navigate("/orders")}
          className="text-xs text-green-600 hover:text-green-700 hover:underline font-medium"
        >
          View All
        </button>
      </div>

      <div className="space-y-4 mt-5">

        {/* =====================================================
            PENDING
        ====================================================== */}
        <div className="flex items-center gap-3">

          <div className="w-10 h-10 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center">
            <FiClock size={18} />
          </div>

          <div className="flex-1">
            <p className="text-xs text-gray-500">
              Pending
            </p>

            <p className="font-medium text-gray-800">
              {pendingOrders.length}{" "}
              {pendingOrders.length === 1
                ? "Order"
                : "Orders"}
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate("/orders")}
            className="text-xs text-green-600 hover:text-green-700 font-medium"
          >
            View
          </button>
        </div>

        {/* =====================================================
            DELIVERED
        ====================================================== */}
        <div className="flex items-center gap-3">

          <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
            <FiCheckCircle size={18} />
          </div>

          <div className="flex-1">
            <p className="text-xs text-gray-500">
              Delivered
            </p>

            <p className="font-medium text-gray-800">
              {deliveredOrders.length}{" "}
              {deliveredOrders.length === 1
                ? "Order"
                : "Orders"}
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate("/orders")}
            className="text-xs text-green-600 hover:text-green-700 font-medium"
          >
            View
          </button>
        </div>

      </div>
    </div>
  );
}

export default OrderSummary;

