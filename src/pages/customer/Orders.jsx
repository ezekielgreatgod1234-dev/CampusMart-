import { useNavigate } from "react-router-dom";

import CustomerLayout from "../../layouts/CustomerLayout";

import { FiPackage, FiArrowRight, FiShoppingBag } from "react-icons/fi";

function Orders({ orders = [], cartCount = 0 }) {
  const navigate = useNavigate();

  return (
    <CustomerLayout cartCount={cartCount}>
      <div className="space-y-6">
        {/* ================= HEADER ================= */}

        <div>
          <h1
            className="
            text-2xl
            sm:text-3xl
            font-bold
            text-gray-800
          "
          >
            My Orders
          </h1>

          <p className="text-gray-500 mt-1">
            Track and manage your CampusMart orders.
          </p>
        </div>

        {/* ================= EMPTY ORDERS ================= */}

        {orders.length === 0 ? (
          <div
            className="
            bg-white
            border
            border-gray-100
            rounded-2xl
            min-h-[50vh]
            flex
            items-center
            justify-center
            p-6
          "
          >
            <div className="text-center">
              <div
                className="
                w-20
                h-20
                mx-auto
                rounded-full
                bg-green-50
                text-green-600
                flex
                items-center
                justify-center
              "
              >
                <FiShoppingBag size={35} />
              </div>

              <h2
                className="
                text-xl
                sm:text-2xl
                font-bold
                text-gray-800
                mt-5
              "
              >
                No Orders Yet
              </h2>

              <p
                className="
                text-gray-500
                mt-2
                max-w-sm
                mx-auto
              "
              >
                You haven't placed any orders yet. Start shopping and your
                orders will appear here.
              </p>

              <button
                onClick={() => navigate("/browse-products")}
                className="
                  mt-6
                  inline-flex
                  items-center
                  gap-2
                  bg-green-600
                  hover:bg-green-700
                  text-white
                  px-6
                  py-3
                  rounded-xl
                  font-semibold
                  transition
                "
              >
                Start Shopping
                <FiArrowRight size={17} />
              </button>
            </div>
          </div>
        ) : (
          /* ================= ORDERS ================= */

          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="
                  bg-white
                  border
                  border-gray-100
                  rounded-2xl
                  p-5
                  sm:p-6
                  shadow-sm
                "
              >
                {/* TOP */}

                <div
                  className="
                  flex
                  flex-col
                  sm:flex-row
                  sm:items-center
                  sm:justify-between
                  gap-4
                "
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="
                      w-11
                      h-11
                      rounded-xl
                      bg-green-50
                      text-green-600
                      flex
                      items-center
                      justify-center
                    "
                    >
                      <FiPackage size={21} />
                    </div>

                    <div>
                      <p
                        className="
                        text-xs
                        text-gray-500
                      "
                      >
                        Order Number
                      </p>

                      <h2
                        className="
                        font-bold
                        text-gray-800
                        mt-1
                      "
                      >
                        #{order.orderNumber}
                      </h2>
                    </div>
                  </div>

                  {/* STATUS */}

                  <span
                    className="
                    inline-flex
                    w-fit
                    px-3
                    py-1.5
                    rounded-full
                    bg-green-50
                    text-green-600
                    text-xs
                    font-semibold
                  "
                  >
                    {order.status || "Order Placed"}
                  </span>
                </div>

                {/* DIVIDER */}

                <div
                  className="
                  border-t
                  border-gray-100
                  my-5
                "
                ></div>

                {/* DETAILS */}

                <div
                  className="
                  grid
                  grid-cols-2
                  sm:grid-cols-4
                  gap-4
                "
                >
                  <div>
                    <p className="text-xs text-gray-400">Date</p>

                    <p
                      className="
                      text-sm
                      font-medium
                      text-gray-700
                      mt-1
                    "
                    >
                      {order.date}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-400">Items</p>

                    <p
                      className="
                      text-sm
                      font-medium
                      text-gray-700
                      mt-1
                    "
                    >
                      {order.items?.reduce(
                        (total, item) => total + item.quantity,
                        0,
                      ) || 0}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-400">Payment</p>

                    <p
                      className="
                      text-sm
                      font-medium
                      text-gray-700
                      mt-1
                    "
                    >
                      {order.paymentMethod === "cash"
                        ? "Pay on Delivery"
                        : "Paystack"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-400">Total</p>

                    <p
                      className="
                      text-sm
                      font-bold
                      text-gray-900
                      mt-1
                    "
                    >
                      ₦{Number(order.total || 0).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* PRODUCTS PREVIEW */}

                {order.items?.length > 0 && (
                  <div
                    className="
    mt-5
    flex
    items-center
    gap-2
    overflow-hidden
  "
                  >
                    {order.items.slice(0, 4).map((item, index) => (
                      <img
                        key={`${item.id}-${index}`}
                        src={item.image}
                        alt={item.name || "Product"}
                        className="
          w-12
          h-12
          rounded-lg
          object-cover
          bg-gray-100
          border
          border-gray-100
        "
                      />
                    ))}

                    {order.items.length > 4 && (
                      <div
                        className="
        w-12
        h-12
        rounded-lg
        bg-gray-100
        flex
        items-center
        justify-center
        text-xs
        font-semibold
        text-gray-500
      "
                      >
                        +{order.items.length - 4}
                      </div>
                    )}
                  </div>
                )}

                {/* BOTTOM */}

                <div
                  className="
                  mt-5
                  pt-5
                  border-t
                  border-gray-100
                  flex
                  justify-end
                "
                >
                  <button
                    onClick={() => navigate(`/orders/${order.id}`)}
                    className="
                      flex
                      items-center
                      gap-2
                      text-sm
                      font-semibold
                      text-green-600
                      hover:text-green-700
                      transition
                    "
                  >
                    View Order
                    <FiArrowRight size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </CustomerLayout>
  );
}

export default Orders;
