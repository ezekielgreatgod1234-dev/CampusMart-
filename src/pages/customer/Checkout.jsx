import { useState } from "react";
import { useNavigate } from "react-router-dom";

import CustomerLayout from "../../layouts/CustomerLayout";

import {
  FiArrowLeft,
  FiMapPin,
  FiCreditCard,
  FiTruck,
  FiCheckCircle,
} from "react-icons/fi";

function Checkout({ cart = [], cartCount = 0 }) {
  const navigate = useNavigate();

  const [paymentMethod, setPaymentMethod] = useState("paystack");

  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    address: "",
    campus: "",
    note: "",
  });

  // ================= TOTAL =================

  const cartTotal = cart.reduce((total, item) => {
    const price = Number(
      String(item.price).replace(/[₦,]/g, "")
    );

    return total + price * item.quantity;
  }, 0);

  const deliveryFee = 0;

  const total = cartTotal + deliveryFee;

  // ================= FORM =================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ================= PLACE ORDER =================

  const handlePlaceOrder = (e) => {
    e.preventDefault();

    if (
      !formData.fullName ||
      !formData.phone ||
      !formData.address ||
      !formData.campus
    ) {
      alert("Please fill in all required delivery information.");
      return;
    }

    if (paymentMethod === "paystack") {
      // Payment integration will be connected here later.
      alert("Paystack payment will be connected next.");
      return;
    }

    alert("Order placed successfully!");

    navigate("/dashboard");
  };

  // ================= EMPTY CART =================

  if (cart.length === 0) {
    return (
      <CustomerLayout cartCount={0}>
        <div className="min-h-[60vh] flex items-center justify-center">

          <div className="text-center">

            <h1 className="text-2xl font-bold text-gray-800">
              Your cart is empty
            </h1>

            <p className="text-gray-500 mt-2">
              Add some products before proceeding to checkout.
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

      <form
        onSubmit={handlePlaceOrder}
        className="space-y-6"
      >

        {/* ================= HEADER ================= */}

        <div>

          <button
            type="button"
            onClick={() => navigate("/cart")}
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

            Back to Cart
          </button>

          <div className="mt-5">

            <h1 className="
              text-2xl
              sm:text-3xl
              font-bold
              text-gray-800
            ">
              Checkout
            </h1>

            <p className="text-gray-500 mt-1">
              Complete your order and provide your delivery information.
            </p>

          </div>

        </div>


        {/* ================= MAIN GRID ================= */}

        <div className="
          grid
          grid-cols-1
          xl:grid-cols-3
          gap-6
        ">

          {/* ================================================= */}
          {/* LEFT SIDE */}
          {/* ================================================= */}

          <div className="
            xl:col-span-2
            space-y-6
          ">

            {/* ================= DELIVERY INFORMATION ================= */}

            <section className="
              bg-white
              rounded-2xl
              border
              border-gray-100
              p-5
              sm:p-6
            ">

              <div className="flex items-center gap-3">

                <div className="
                  w-11
                  h-11
                  rounded-xl
                  bg-green-100
                  text-green-600
                  flex
                  items-center
                  justify-center
                ">
                  <FiMapPin size={21} />
                </div>

                <div>

                  <h2 className="
                    text-lg
                    font-bold
                    text-gray-800
                  ">
                    Delivery Information
                  </h2>

                  <p className="text-sm text-gray-500">
                    Where should we deliver your order?
                  </p>

                </div>

              </div>


              {/* FORM */}

              <div className="
                grid
                grid-cols-1
                sm:grid-cols-2
                gap-4
                mt-6
              ">

                {/* FULL NAME */}

                <div>

                  <label className="
                    block
                    text-sm
                    font-medium
                    text-gray-700
                    mb-2
                  ">
                    Full Name *
                  </label>

                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    className="
                      w-full
                      border
                      border-gray-200
                      rounded-xl
                      px-4
                      py-3
                      text-sm
                      outline-none
                      focus:border-green-500
                      focus:ring-2
                      focus:ring-green-100
                    "
                  />

                </div>


                {/* PHONE */}

                <div>

                  <label className="
                    block
                    text-sm
                    font-medium
                    text-gray-700
                    mb-2
                  ">
                    Phone Number *
                  </label>

                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="08012345678"
                    className="
                      w-full
                      border
                      border-gray-200
                      rounded-xl
                      px-4
                      py-3
                      text-sm
                      outline-none
                      focus:border-green-500
                      focus:ring-2
                      focus:ring-green-100
                    "
                  />

                </div>


                {/* CAMPUS */}

                <div>

                  <label className="
                    block
                    text-sm
                    font-medium
                    text-gray-700
                    mb-2
                  ">
                    Campus *
                  </label>

                  <input
                    type="text"
                    name="campus"
                    value={formData.campus}
                    onChange={handleChange}
                    placeholder="e.g. ABSU Uturu"
                    className="
                      w-full
                      border
                      border-gray-200
                      rounded-xl
                      px-4
                      py-3
                      text-sm
                      outline-none
                      focus:border-green-500
                      focus:ring-2
                      focus:ring-green-100
                    "
                  />

                </div>


                {/* ADDRESS */}

                <div>

                  <label className="
                    block
                    text-sm
                    font-medium
                    text-gray-700
                    mb-2
                  ">
                    Delivery Address *
                  </label>

                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Hostel, block, room..."
                    className="
                      w-full
                      border
                      border-gray-200
                      rounded-xl
                      px-4
                      py-3
                      text-sm
                      outline-none
                      focus:border-green-500
                      focus:ring-2
                      focus:ring-green-100
                    "
                  />

                </div>

              </div>


              {/* NOTE */}

              <div className="mt-4">

                <label className="
                  block
                  text-sm
                  font-medium
                  text-gray-700
                  mb-2
                ">
                  Delivery Note
                </label>

                <textarea
                  name="note"
                  value={formData.note}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Any special instructions for the seller?"
                  className="
                    w-full
                    border
                    border-gray-200
                    rounded-xl
                    px-4
                    py-3
                    text-sm
                    outline-none
                    resize-none
                    focus:border-green-500
                    focus:ring-2
                    focus:ring-green-100
                  "
                />

              </div>

            </section>


            {/* ================= PAYMENT ================= */}

            <section className="
              bg-white
              rounded-2xl
              border
              border-gray-100
              p-5
              sm:p-6
            ">

              <div className="flex items-center gap-3">

                <div className="
                  w-11
                  h-11
                  rounded-xl
                  bg-green-100
                  text-green-600
                  flex
                  items-center
                  justify-center
                ">
                  <FiCreditCard size={21} />
                </div>

                <div>

                  <h2 className="
                    text-lg
                    font-bold
                    text-gray-800
                  ">
                    Payment Method
                  </h2>

                  <p className="text-sm text-gray-500">
                    Choose how you want to pay.
                  </p>

                </div>

              </div>


              <div className="space-y-3 mt-6">

                {/* PAYSTACK */}

                <label className={`
                  flex
                  items-center
                  gap-4
                  p-4
                  rounded-xl
                  border
                  cursor-pointer
                  transition
                  ${
                    paymentMethod === "paystack"
                      ? "border-green-500 bg-green-50"
                      : "border-gray-200 hover:border-green-300"
                  }
                `}>

                  <input
                    type="radio"
                    name="payment"
                    value="paystack"
                    checked={paymentMethod === "paystack"}
                    onChange={(e) =>
                      setPaymentMethod(e.target.value)
                    }
                    className="accent-green-600"
                  />

                  <div className="
                    w-10
                    h-10
                    rounded-lg
                    bg-white
                    flex
                    items-center
                    justify-center
                  ">
                    <FiCreditCard className="text-green-600" />
                  </div>

                  <div className="flex-1">

                    <p className="
                      font-semibold
                      text-gray-800
                    ">
                      Paystack
                    </p>

                    <p className="
                      text-xs
                      text-gray-500
                      mt-1
                    ">
                      Pay securely with card, bank transfer or USSD.
                    </p>

                  </div>

                </label>


                {/* CASH */}

                <label className={`
                  flex
                  items-center
                  gap-4
                  p-4
                  rounded-xl
                  border
                  cursor-pointer
                  transition
                  ${
                    paymentMethod === "cash"
                      ? "border-green-500 bg-green-50"
                      : "border-gray-200 hover:border-green-300"
                  }
                `}>

                  <input
                    type="radio"
                    name="payment"
                    value="cash"
                    checked={paymentMethod === "cash"}
                    onChange={(e) =>
                      setPaymentMethod(e.target.value)
                    }
                    className="accent-green-600"
                  />

                  <div className="
                    w-10
                    h-10
                    rounded-lg
                    bg-white
                    flex
                    items-center
                    justify-center
                  ">
                    <FiTruck className="text-green-600" />
                  </div>

                  <div>

                    <p className="
                      font-semibold
                      text-gray-800
                    ">
                      Pay on Delivery
                    </p>

                    <p className="
                      text-xs
                      text-gray-500
                      mt-1
                    ">
                      Pay the seller when your order arrives.
                    </p>

                  </div>

                </label>

              </div>

            </section>


            {/* ================= ORDER ITEMS ================= */}

            <section className="
              bg-white
              rounded-2xl
              border
              border-gray-100
              p-5
              sm:p-6
            ">

              <div className="flex items-center justify-between">

                <div>

                  <h2 className="
                    text-lg
                    font-bold
                    text-gray-800
                  ">
                    Your Items
                  </h2>

                  <p className="text-sm text-gray-500 mt-1">
                    {cartCount} {cartCount === 1 ? "item" : "items"}
                  </p>

                </div>

                <FiCheckCircle className="text-green-600" />

              </div>


              <div className="space-y-4 mt-6">

                {cart.map((item) => (

                  <div
                    key={item.id}
                    className="
                      flex
                      items-center
                      gap-4
                      border-b
                      border-gray-100
                      pb-4
                      last:border-0
                      last:pb-0
                    "
                  >

                    <img
                      src={item.image}
                      alt={item.name}
                      className="
                        w-20
                        h-20
                        object-cover
                        rounded-xl
                        bg-gray-100
                        shrink-0
                      "
                    />

                    <div className="flex-1 min-w-0">

                      <p className="
                        font-semibold
                        text-gray-800
                        truncate
                      ">
                        {item.name}
                      </p>

                      <p className="
                        text-xs
                        text-gray-500
                        mt-1
                      ">
                        Quantity: {item.quantity}
                      </p>

                      <p className="
                        font-bold
                        text-gray-900
                        mt-2
                      ">
                        {item.price}
                      </p>

                    </div>

                  </div>

                ))}

              </div>

            </section>

          </div>


          {/* ================================================= */}
          {/* ORDER SUMMARY */}
          {/* ================================================= */}

          <div className="
            bg-white
            rounded-2xl
            border
            border-gray-100
            p-5
            h-fit
            xl:sticky
            xl:top-24
          ">

            <h2 className="
              text-xl
              font-bold
              text-gray-800
            ">
              Order Summary
            </h2>


            <div className="space-y-4 mt-6">

              <div className="
                flex
                justify-between
                text-sm
              ">

                <span className="text-gray-500">
                  Items ({cartCount})
                </span>

                <span className="font-medium">
                  ₦{cartTotal.toLocaleString()}
                </span>

              </div>


              <div className="
                flex
                justify-between
                text-sm
              ">

                <span className="text-gray-500">
                  Delivery
                </span>

                <span className="font-medium text-green-600">
                  Free
                </span>

              </div>

            </div>


            {/* TOTAL */}

            <div className="
              border-t
              border-gray-100
              mt-5
              pt-5
              flex
              items-center
              justify-between
            ">

              <span className="
                font-semibold
                text-gray-800
              ">
                Total
              </span>

              <span className="
                text-xl
                font-bold
                text-gray-900
              ">
                ₦{total.toLocaleString()}
              </span>

            </div>


            {/* PLACE ORDER */}

            <button
              type="submit"
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
              {paymentMethod === "paystack"
                ? "Pay Now"
                : "Place Order"}
            </button>


            <p className="
              text-xs
              text-gray-400
              text-center
              mt-4
              leading-5
            ">
              By placing your order, you agree to CampusMart's
              terms and conditions.
            </p>

          </div>

        </div>

      </form>

    </CustomerLayout>
  );
}

export default Checkout;