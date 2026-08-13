import { useNavigate } from "react-router-dom";

import {
  FiClock,
  FiCheckCircle,
} from "react-icons/fi";

function OrderSummary({ orders = [] }) {
  const navigate = useNavigate();

  // ================= ORDER STATUS =================

  // Newly placed orders are treated as Pending
  const pendingOrders = orders.filter(
    (order) =>
      order.status === "Pending" ||
      order.status === "Placed"
  );

  // Orders that the seller has marked as delivered
  const deliveredOrders = orders.filter(
    (order) => order.status === "Delivered"
  );

  return (
    <div
      className="
        bg-white
        rounded-2xl
        border
        border-gray-100
        p-5
      "
    >

      {/* ================= HEADER ================= */}

      <div className="flex items-center justify-between">

        <h2 className="font-bold text-gray-800">
          Order Summary
        </h2>

        <button
          onClick={() => navigate("/orders")}
          className="
            text-xs
            text-green-600
            hover:text-green-700
            hover:underline
          "
        >
          View All
        </button>

      </div>


      <div className="space-y-4 mt-5">

        {/* ================= PENDING ================= */}

        <div className="flex items-center gap-3">

          <div
            className="
              w-10
              h-10
              rounded-full
              bg-yellow-100
              text-yellow-600
              flex
              items-center
              justify-center
            "
          >
            <FiClock />
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
            onClick={() => navigate("/orders")}
            className="
              text-xs
              text-green-600
              hover:text-green-700
            "
          >
            View
          </button>

        </div>


        {/* ================= DELIVERED ================= */}

        <div className="flex items-center gap-3">

          <div
            className="
              w-10
              h-10
              rounded-full
              bg-green-100
              text-green-600
              flex
              items-center
              justify-center
            "
          >
            <FiCheckCircle />
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
            onClick={() => navigate("/orders")}
            className="
              text-xs
              text-green-600
              hover:text-green-700
            "
          >
            View
          </button>

        </div>

      </div>

    </div>
  );
}

export default OrderSummary;