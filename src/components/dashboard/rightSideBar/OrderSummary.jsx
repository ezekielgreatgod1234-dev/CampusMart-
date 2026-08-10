import { FiPackage, FiTruck, FiCheckCircle } from "react-icons/fi";

function OrderSummary() {
  const orders = [
    {
      title: "Pending",
      value: 3,
      icon: <FiPackage size={20} />,
      bg: "bg-yellow-100",
      color: "text-yellow-600",
    },
    {
      title: "Shipping",
      value: 2,
      icon: <FiTruck size={20} />,
      bg: "bg-blue-100",
      color: "text-blue-600",
    },
    {
      title: "Delivered",
      value: 18,
      icon: <FiCheckCircle size={20} />,
      bg: "bg-green-100",
      color: "text-green-600",
    },
  ];

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-bold text-gray-800">
          Order Summary
        </h2>

        <button className="text-green-600 text-sm hover:underline">
          View All
        </button>
      </div>

      {/* Order Items */}
      <div className="space-y-4">
        {orders.map((order, index) => (
          <div
            key={index}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-11 h-11 rounded-full flex items-center justify-center ${order.bg}`}
              >
                <span className={order.color}>
                  {order.icon}
                </span>
              </div>

              <div>
                <p className="text-sm text-gray-500">
                  {order.title}
                </p>

                <h3 className="font-semibold text-gray-800">
                  {order.value} Orders
                </h3>
              </div>
            </div>

            <button className="text-green-600 text-sm hover:underline">
              View
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default OrderSummary;