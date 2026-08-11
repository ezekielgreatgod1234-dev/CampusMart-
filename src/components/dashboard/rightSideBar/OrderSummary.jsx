import { FiClock, FiTruck, FiCheckCircle } from "react-icons/fi";

function OrderSummary() {
  const orders = JSON.parse(
    localStorage.getItem("campusmart_orders") || "[]"
  );

  const pendingOrders = orders.filter(
    (order) => order.status === "Pending"
  );

  const deliveredOrders = orders.filter(
    (order) => order.status === "Delivered"
  );

  const shippingOrders = orders.filter(
    (order) => order.status === "Shipping"
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

      <div className="flex items-center justify-between">

        <h2 className="font-bold text-gray-800">
          Order Summary
        </h2>

        <button className="text-xs text-green-600 hover:underline">
          View All
        </button>

      </div>


      <div className="space-y-4 mt-5">

        {/* PENDING */}

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

          <button className="text-xs text-green-600">
            View
          </button>

        </div>


        {/* SHIPPING */}

        <div className="flex items-center gap-3">

          <div
            className="
              w-10
              h-10
              rounded-full
              bg-blue-100
              text-blue-600
              flex
              items-center
              justify-center
            "
          >
            <FiTruck />
          </div>

          <div className="flex-1">

            <p className="text-xs text-gray-500">
              Shipping
            </p>

            <p className="font-medium text-gray-800">
              {shippingOrders.length}{" "}
              {shippingOrders.length === 1
                ? "Order"
                : "Orders"}
            </p>

          </div>

          <button className="text-xs text-green-600">
            View
          </button>

        </div>


        {/* DELIVERED */}

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

          <button className="text-xs text-green-600">
            View
          </button>

        </div>

      </div>

    </div>
  );
}

export default OrderSummary;