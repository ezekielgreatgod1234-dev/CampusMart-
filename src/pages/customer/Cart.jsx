import { useNavigate } from "react-router-dom";

import {
  FiArrowLeft,
  FiMinus,
  FiPlus,
  FiTrash2,
  FiShoppingCart,
} from "react-icons/fi";

import CustomerLayout from "../../layouts/CustomerLayout";

function Cart({
  cart,
  cartCount,
  increaseQuantity,
  decreaseQuantity,
  removeFromCart,
}) {
  const navigate = useNavigate();

  // ================= TOTAL =================

  const cartTotal = cart.reduce((total, item) => {
    const price = Number(
      String(item.price).replace(/[₦,]/g, "")
    );

    return total + price * item.quantity;
  }, 0);

  // ================= BUY ONE ITEM =================

  const handleBuyItem = (item) => {
    navigate("/checkout", {
      state: {
        checkoutItems: [item],
        checkoutType: "single",
      },
    });
  };

  // ================= BUY EVERYTHING =================

  const handleCheckoutAll = () => {
    navigate("/checkout", {
      state: {
        checkoutItems: cart,
        checkoutType: "all",
      },
    });
  };

  // ================= EMPTY CART =================

  if (cart.length === 0) {
    return (
      <CustomerLayout cartCount={0}>

        <div className="min-h-[60vh] flex items-center justify-center">

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
              <FiShoppingCart size={35} />
            </div>

            <h1 className="text-2xl font-bold text-gray-800 mt-5">
              Your Cart is Empty
            </h1>

            <p className="text-gray-500 mt-2">
              You haven't added any products to your cart yet.
            </p>

            <button
              onClick={() => navigate("/browse-products")}
              className="
                mt-6
                bg-green-600
                hover:bg-green-700
                text-white
                px-6
                py-3
                rounded-xl
                font-medium
                transition
              "
            >
              Browse Products
            </button>

          </div>

        </div>

      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout cartCount={cartCount}>

      <div className="space-y-6">

        {/* ================= HEADER ================= */}

        <div>

          <button
            onClick={() => navigate("/browse-products")}
            className="
              flex
              items-center
              gap-2
              text-gray-500
              hover:text-green-600
              transition
            "
          >
            <FiArrowLeft />
            Back to Products
          </button>

          <div className="mt-5">

            <h1
              className="
                text-2xl
                sm:text-3xl
                font-bold
                text-gray-800
              "
            >
              Shopping Cart
            </h1>

            <p className="text-gray-500 mt-1">
              {cartCount}{" "}
              {cartCount === 1 ? "item" : "items"} in your cart
            </p>

          </div>

        </div>

        {/* ================= CART CONTENT ================= */}

        <div
          className="
            grid
            grid-cols-1
            xl:grid-cols-3
            gap-6
          "
        >

          {/* ================= PRODUCTS ================= */}

          <div
            className="
              xl:col-span-2
              space-y-4
            "
          >

            {cart.map((item) => (

              <div
                key={item.id}
                className="
                  bg-white
                  rounded-2xl
                  border
                  border-gray-100
                  p-4
                  sm:p-5
                "
              >

                <div className="flex gap-4">

                  {/* IMAGE */}

                  <img
                    src={item.image}
                    alt={item.name}
                    className="
                      w-24
                      h-24
                      sm:w-32
                      sm:h-32
                      object-cover
                      rounded-xl
                      bg-gray-100
                      shrink-0
                    "
                  />

                  {/* INFORMATION */}

                  <div className="flex-1 min-w-0">

                    <p
                      className="
                        text-xs
                        sm:text-sm
                        text-green-600
                        font-medium
                      "
                    >
                      {item.category}
                    </p>

                    <h2
                      className="
                        font-semibold
                        text-gray-800
                        mt-1
                      "
                    >
                      {item.name}
                    </h2>

                    <p
                      className="
                        text-lg
                        sm:text-xl
                        font-bold
                        text-gray-900
                        mt-2
                      "
                    >
                      {item.price}
                    </p>

                    {/* QUANTITY */}

                    <div
                      className="
                        flex
                        items-center
                        justify-between
                        gap-3
                        mt-4
                      "
                    >

                      <div
                        className="
                          flex
                          items-center
                          border
                          border-gray-200
                          rounded-xl
                          overflow-hidden
                        "
                      >

                        <button
                          onClick={() =>
                            decreaseQuantity(item.id)
                          }
                          className="
                            w-9
                            h-9
                            flex
                            items-center
                            justify-center
                            hover:bg-gray-50
                          "
                        >
                          <FiMinus size={14} />
                        </button>

                        <span
                          className="
                            w-9
                            text-center
                            text-sm
                            font-semibold
                          "
                        >
                          {item.quantity}
                        </span>

                        <button
                          onClick={() =>
                            increaseQuantity(item.id)
                          }
                          className="
                            w-9
                            h-9
                            flex
                            items-center
                            justify-center
                            hover:bg-gray-50
                          "
                        >
                          <FiPlus size={14} />
                        </button>

                      </div>

                      {/* REMOVE */}

                      <button
                        onClick={() =>
                          removeFromCart(item.id)
                        }
                        className="
                          flex
                          items-center
                          gap-1
                          text-red-500
                          hover:text-red-600
                          text-sm
                        "
                      >
                        <FiTrash2 />

                        <span className="hidden sm:inline">
                          Remove
                        </span>
                      </button>

                    </div>

                  </div>

                </div>

                {/* ================= BUY THIS ITEM ================= */}

                <button
                  onClick={() => handleBuyItem(item)}
                  className="
                    w-full
                    mt-4
                    border
                    border-green-600
                    text-green-600
                    hover:bg-green-50
                    py-2.5
                    rounded-xl
                    text-sm
                    font-semibold
                    transition
                  "
                >
                  Buy This Item
                </button>

              </div>

            ))}

          </div>

          {/* ================= ORDER SUMMARY ================= */}

          <div
            className="
              bg-white
              rounded-2xl
              border
              border-gray-100
              p-5
              h-fit
              xl:sticky
              xl:top-24
            "
          >

            <h2
              className="
                text-xl
                font-bold
                text-gray-800
              "
            >
              Order Summary
            </h2>

            <div className="space-y-4 mt-6">

              <div
                className="
                  flex
                  justify-between
                  text-sm
                "
              >

                <span className="text-gray-500">
                  Items ({cartCount})
                </span>

                <span className="font-medium">
                  ₦{cartTotal.toLocaleString()}
                </span>

              </div>

              <div
                className="
                  flex
                  justify-between
                  text-sm
                "
              >

                <span className="text-gray-500">
                  Delivery
                </span>

                <span className="font-medium text-green-600">
                  Free
                </span>

              </div>

            </div>

            {/* TOTAL */}

            <div
              className="
                border-t
                border-gray-100
                mt-5
                pt-5
                flex
                justify-between
                items-center
              "
            >

              <span className="font-semibold text-gray-800">
                Total
              </span>

              <span
                className="
                  text-xl
                  font-bold
                  text-gray-900
                "
              >
                ₦{cartTotal.toLocaleString()}
              </span>

            </div>

            {/* CHECKOUT ALL */}

            <button
              onClick={handleCheckoutAll}
              className="
                w-full
                mt-6
                bg-green-600
                hover:bg-green-700
                text-white
                py-3.5
                rounded-xl
                font-semibold
                transition
              "
            >
              Checkout All
            </button>

            <button
              onClick={() => navigate("/browse-products")}
              className="
                w-full
                mt-3
                border
                border-gray-200
                text-gray-600
                hover:bg-gray-50
                py-3
                rounded-xl
                font-medium
                transition
              "
            >
              Continue Shopping
            </button>

          </div>

        </div>

      </div>

    </CustomerLayout>
  );
}

export default Cart;