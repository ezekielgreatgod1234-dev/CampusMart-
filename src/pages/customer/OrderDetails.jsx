import { useNavigate, useParams } from "react-router-dom";
import CustomerLayout from "../../layouts/CustomerLayout";

import {
  FiArrowLeft,
  FiPackage,
  FiMapPin,
  FiCreditCard,
  FiCheckCircle,
} from "react-icons/fi";

function OrderDetails({ orders = [], cartCount = 0 }) {
  const navigate = useNavigate();
  const { id } = useParams();

  // ================= FIND ORDER =================

  const order = orders.find(
    (item) => String(item.id) === String(id)
  );

  // ================= ORDER NOT FOUND =================

  if (!order) {
    return (
      <CustomerLayout cartCount={cartCount}>

        <div className="min-h-[60vh] flex items-center justify-center">

          <div className="text-center">

            <div
              className="
                w-20
                h-20
                mx-auto
                rounded-full
                bg-red-50
                text-red-500
                flex
                items-center
                justify-center
              "
            >
              <FiPackage size={35} />
            </div>

            <h1
              className="
                text-2xl
                font-bold
                text-gray-800
                mt-5
              "
            >
              Order Not Found
            </h1>

            <p className="text-gray-500 mt-2">
              We couldn't find this order.
            </p>

            <button
              onClick={() => navigate("/orders")}
              className="
                mt-6
                bg-green-600
                hover:bg-green-700
                text-white
                px-6
                py-3
                rounded-xl
                font-semibold
              "
            >
              Back to Orders
            </button>

          </div>

        </div>

      </CustomerLayout>
    );
  }

  // =====================================================
  // DELIVERY INFORMATION
  // =====================================================

  /*
    Your Checkout may save delivery information using
    different property names.

    We check the common possibilities first.
  */

  const deliveryInfo =
    order.deliveryInformation ||
    order.deliveryInfo ||
    order.deliveryDetails ||
    order.shippingAddress ||
    order.delivery ||
    order.customerInfo ||
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
    order.campus ||
    deliveryInfo.campus ||
    "";

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


  // ================= TOTAL ITEMS =================

  const totalItems =
    order.items?.reduce(
      (total, item) =>
        total + Number(item.quantity || 0),
      0
    ) || 0;


  return (
    <CustomerLayout cartCount={cartCount}>

      <div className="space-y-6">

        {/* ================================================= */}
        {/* HEADER */}
        {/* ================================================= */}

        <div>

          <button
            onClick={() => navigate("/orders")}
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
            Back to Orders
          </button>


          <div className="mt-5">

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

              <div>

                <p className="text-sm text-gray-500">
                  Order Number
                </p>

                <h1
                  className="
                    text-2xl
                    sm:text-3xl
                    font-bold
                    text-gray-800
                    mt-1
                  "
                >
                  #{order.orderNumber || order.id}
                </h1>

                <p className="text-sm text-gray-500 mt-2">
                  Placed on {order.date}
                </p>

              </div>


              <span
                className="
                  w-fit
                  px-4
                  py-2
                  rounded-full
                  bg-green-50
                  text-green-600
                  text-sm
                  font-semibold
                "
              >
                {order.status || "Placed"}
              </span>

            </div>

          </div>

        </div>


        {/* ================================================= */}
        {/* ORDER CONTENT */}
        {/* ================================================= */}

        <div
          className="
            grid
            grid-cols-1
            xl:grid-cols-3
            gap-6
          "
        >

          {/* ================================================= */}
          {/* PRODUCTS */}
          {/* ================================================= */}

          <section
            className="
              xl:col-span-2
              bg-white
              rounded-2xl
              border
              border-gray-100
              p-5
              sm:p-6
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

                <h2
                  className="
                    text-lg
                    font-bold
                    text-gray-800
                  "
                >
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
                  className="
                    flex
                    gap-4
                    p-3
                    rounded-xl
                    border
                    border-gray-100
                  "
                >

                  {/* IMAGE */}

                  <img
                    src={item.image}
                    alt={item.name}
                    className="
                      w-20
                      h-20
                      sm:w-24
                      sm:h-24
                      object-cover
                      rounded-xl
                      bg-gray-100
                      shrink-0
                    "
                  />


                  {/* DETAILS */}

                  <div className="flex-1 min-w-0">

                    <p
                      className="
                        text-xs
                        text-green-600
                        font-medium
                      "
                    >
                      {item.category}
                    </p>

                    <h3
                      className="
                        font-semibold
                        text-gray-800
                        mt-1
                      "
                    >
                      {item.name}
                    </h3>

                    <p
                      className="
                        text-sm
                        text-gray-500
                        mt-1
                      "
                    >
                      Quantity: {item.quantity}
                    </p>

                    <p
                      className="
                        font-bold
                        text-gray-900
                        mt-2
                      "
                    >
                      {item.price}
                    </p>

                  </div>

                </div>

              ))}

            </div>

          </section>


          {/* ================================================= */}
          {/* RIGHT SIDE */}
          {/* ================================================= */}

          <div className="space-y-6">

            {/* ================================================= */}
            {/* ORDER SUMMARY */}
            {/* ================================================= */}

            <section
              className="
                bg-white
                rounded-2xl
                border
                border-gray-100
                p-5
              "
            >

              <h2
                className="
                  text-lg
                  font-bold
                  text-gray-800
                "
              >
                Order Summary
              </h2>


              <div className="space-y-4 mt-5">

                <div
                  className="
                    flex
                    justify-between
                    text-sm
                  "
                >

                  <span className="text-gray-500">
                    Items
                  </span>

                  <span className="font-medium">
                    {totalItems}
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


              <div
                className="
                  border-t
                  border-gray-100
                  mt-5
                  pt-5
                  flex
                  justify-between
                "
              >

                <span
                  className="
                    font-semibold
                    text-gray-800
                  "
                >
                  Total
                </span>

                <span
                  className="
                    text-xl
                    font-bold
                    text-gray-900
                  "
                >
                  ₦{Number(order.total || 0).toLocaleString()}
                </span>

              </div>

            </section>


            {/* ================================================= */}
            {/* PAYMENT */}
            {/* ================================================= */}

            <section
              className="
                bg-white
                rounded-2xl
                border
                border-gray-100
                p-5
              "
            >

              <div className="flex items-center gap-3">

                <FiCreditCard className="text-green-600" />

                <h2
                  className="
                    font-bold
                    text-gray-800
                  "
                >
                  Payment
                </h2>

              </div>


              <p className="text-sm text-gray-500 mt-3">

                {order.paymentMethod === "cash"
                  ? "Pay on Delivery"
                  : "Paystack"}

              </p>

            </section>


            {/* ================================================= */}
            {/* DELIVERY INFORMATION */}
            {/* ================================================= */}

            <section
              className="
                bg-white
                rounded-2xl
                border
                border-gray-100
                p-5
              "
            >

              {/* HEADER */}

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
                  <FiMapPin size={21} />
                </div>

                <div>

                  <h2
                    className="
                      font-bold
                      text-gray-800
                    "
                  >
                    Delivery Information
                  </h2>

                  <p
                    className="
                      text-sm
                      text-gray-500
                      mt-1
                    "
                  >
                    Your order will be delivered to this address.
                  </p>

                </div>

              </div>


              {/* DETAILS */}

              <div className="mt-5 space-y-4">

                {/* FULL NAME */}

                <div>

                  <p className="text-xs text-gray-400">
                    Full Name
                  </p>

                  <p
                    className="
                      text-sm
                      font-medium
                      text-gray-800
                      mt-1
                    "
                  >
                    {fullName || "Not provided"}
                  </p>

                </div>


                {/* PHONE */}

                <div>

                  <p className="text-xs text-gray-400">
                    Phone Number
                  </p>

                  <p
                    className="
                      text-sm
                      font-medium
                      text-gray-800
                      mt-1
                    "
                  >
                    {phone || "Not provided"}
                  </p>

                </div>


                {/* CAMPUS */}

                <div>

                  <p className="text-xs text-gray-400">
                    Campus
                  </p>

                  <p
                    className="
                      text-sm
                      font-medium
                      text-gray-800
                      mt-1
                    "
                  >
                    {campus || "Not provided"}
                  </p>

                </div>


                {/* ADDRESS */}

                <div>

                  <p className="text-xs text-gray-400">
                    Delivery Address
                  </p>

                  <p
                    className="
                      text-sm
                      font-medium
                      text-gray-800
                      mt-1
                    "
                  >
                    {address || "Not provided"}
                  </p>

                </div>


                {/* DELIVERY NOTE */}

                {note && (

                  <div>

                    <p className="text-xs text-gray-400">
                      Delivery Note
                    </p>

                    <p
                      className="
                        text-sm
                        text-gray-700
                        mt-1
                        bg-gray-50
                        rounded-xl
                        p-3
                      "
                    >
                      {note}
                    </p>

                  </div>

                )}

              </div>

            </section>

          </div>

        </div>


        {/* ================================================= */}
        {/* ORDER SUCCESS MESSAGE */}
        {/* ================================================= */}

        <div
          className="
            bg-green-50
            border
            border-green-100
            rounded-2xl
            p-5
            flex
            items-center
            gap-4
          "
        >

          <FiCheckCircle
            className="text-green-600 shrink-0"
            size={25}
          />

          <div>

            <h3
              className="
                font-semibold
                text-green-800
              "
            >
              Order Placed Successfully
            </h3>

            <p
              className="
                text-sm
                text-green-700
                mt-1
              "
            >
              Your order has been received and is being processed.
            </p>

          </div>

        </div>

      </div>

    </CustomerLayout>
  );
}

export default OrderDetails;