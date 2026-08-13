import {
  FiShoppingBag,
  FiHeart,
  FiShoppingCart,
  FiMessageCircle,
} from "react-icons/fi";

import { useNavigate } from "react-router-dom";

function StatsCards({
  cartCount = 0,
  wishlistCount = 0,
  ordersCount = 0,
  unreadMessages = 0,
}) {
  const navigate = useNavigate();

  const stats = [
    {
      title: "Orders",
      value: ordersCount,
      link: "View all orders",
      path: "/orders",
      icon: <FiShoppingBag />,
      bg: "bg-purple-100",
      color: "text-purple-600",
    },

    {
      title: "Wishlist",
      value: wishlistCount,
      link: "View wishlist",
      path: "/wishlist",
      icon: <FiHeart />,
      bg: "bg-pink-100",
      color: "text-pink-600",
    },

    {
      title: "Cart Items",
      value: cartCount,
      link: "Go to cart",
      path: "/cart",
      icon: <FiShoppingCart />,
      bg: "bg-green-100",
      color: "text-green-600",
    },

    {
      title: "Messages",
      value: unreadMessages,
      link: "View messages",
      path: "/messages",
      icon: <FiMessageCircle />,
      bg: "bg-blue-100",
      color: "text-blue-600",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

      {stats.map((item, index) => (
        <div
          key={index}
          className="
            bg-white
            rounded-2xl
            border
            border-gray-100
            p-4
            sm:p-5
            shadow-sm
            hover:shadow-md
            transition
          "
        >

          {/* ICON */}

          <div
            className={`
              w-11
              h-11
              sm:w-12
              sm:h-12
              rounded-full
              flex
              items-center
              justify-center
              text-xl
              sm:text-2xl
              ${item.bg}
              ${item.color}
            `}
          >
            {item.icon}
          </div>

          {/* TITLE */}

          <h3 className="mt-4 text-gray-600 text-sm">
            {item.title}
          </h3>

          {/* VALUE */}

          <h2 className="text-2xl font-bold text-gray-900">
            {item.value}
          </h2>

          {/* LINK */}

          <button
            type="button"
            onClick={() => navigate(item.path)}
            className="
              mt-2
              text-sm
              text-green-600
              hover:underline
            "
          >
            {item.link}
          </button>

        </div>
      ))}

    </div>
  );
}

export default StatsCards;