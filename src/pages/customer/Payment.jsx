import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import CustomerLayout from "../../layouts/CustomerLayout";

import {
  FiArrowLeft,
  FiCreditCard,
  FiLock,
  FiCheckCircle,
  FiAlertCircle,
} from "react-icons/fi";

function Payment({ cartCount = 0 }) {
  const navigate = useNavigate();
  const location = useLocation();

  // =========================================================
  // DATA RECEIVED FROM CHECKOUT
  // =========================================================

  const {
    checkoutItems = [],
    total = 0,
    formData = {},
    checkoutType = "all",
  } = location.state || {};

  // =========================================================
  // CARD STATES
  // =========================================================

  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [cardName, setCardName] = useState("");

  // Error message
  const [errorMessage, setErrorMessage] = useState("");

  // =========================================================
  // FORMAT CARD NUMBER
  // =========================================================

  const formatCardNumber = (value) => {
    const numbers = value
      .replace(/\D/g, "")
      .slice(0, 16);

    return numbers
      .replace(/(.{4})/g, "$1 ")
      .trim();
  };

  const handleCardNumberChange = (e) => {
    setErrorMessage("");
    setCardNumber(
      formatCardNumber(e.target.value)
    );
  };

  // =========================================================
  // FORMAT EXPIRY DATE
  // =========================================================

  const handleExpiryChange = (e) => {
    setErrorMessage("");

    let value = e.target.value
      .replace(/\D/g, "")
      .slice(0, 4);

    if (value.length >= 3) {
      value =
        value.slice(0, 2) +
        "/" +
        value.slice(2);
    }

    setExpiry(value);
  };

  // =========================================================
  // CVV
  // =========================================================

  const handleCvvChange = (e) => {
    setErrorMessage("");

    const value = e.target.value
      .replace(/\D/g, "")
      .slice(0, 3);

    setCvv(value);
  };

  // =========================================================
  // CARD NAME
  // =========================================================

  const handleCardNameChange = (e) => {
    setErrorMessage("");
    setCardName(e.target.value);
  };

  // =========================================================
  // PAYMENT
  // =========================================================

  const handlePayment = (e) => {
    e.preventDefault();

    setErrorMessage("");

    // Card name
    if (!cardName.trim()) {
      setErrorMessage(
        "Please enter the name on your card."
      );
      return;
    }

    // Card number
    const cleanCardNumber =
      cardNumber.replace(/\s/g, "");

    if (cleanCardNumber.length !== 16) {
      setErrorMessage(
        "Please enter a valid 16-digit card number."
      );
      return;
    }

    // Expiry
    if (expiry.length !== 5) {
      setErrorMessage(
        "Please enter your card expiry date in MM/YY format."
      );
      return;
    }

    // CVV
    if (cvv.length !== 3) {
      setErrorMessage(
        "Please enter your 3-digit CVV."
      );
      return;
    }

    // =====================================================
    // PAYMENT INFORMATION WILL BE CONNECTED HERE LATER
    // =====================================================

    console.log("Payment information ready.");

    // We still have access to the customer's
    // delivery information from Checkout.
    console.log(
      "Customer delivery information:",
      formData
    );

    console.log(
      "Checkout items:",
      checkoutItems
    );

    console.log(
      "Checkout total:",
      total
    );

    console.log(
      "Checkout type:",
      checkoutType
    );

    /*
      PAYSTACK WILL BE CONNECTED HERE LATER.

      IMPORTANT:
      Do not send or store raw card details in your
      own backend/localStorage. Paystack should handle
      the card information securely.
    */

    alert(
      "Payment UI is ready. Paystack will be connected here."
    );
  };

  // =========================================================
  // GO BACK TO CHECKOUT
  // =========================================================

  const handleBackToCheckout = () => {
    navigate("/checkout", {
      state: {
        checkoutItems,
        checkoutType,
        formData,
      },
    });
  };

  // =========================================================
  // NO CHECKOUT ITEMS
  // =========================================================

  if (checkoutItems.length === 0) {
    return (
      <CustomerLayout cartCount={cartCount}>
        <div className="min-h-[60vh] flex items-center justify-center">

          <div className="text-center">

            <div
              className="
                w-16
                h-16
                mx-auto
                rounded-full
                bg-gray-100
                text-gray-400
                flex
                items-center
                justify-center
              "
            >
              <FiCreditCard size={28} />
            </div>

            <h1
              className="
                text-2xl
                font-bold
                text-gray-800
                mt-5
              "
            >
              No Payment Items
            </h1>

            <p className="text-gray-500 mt-2">
              There are no items available for payment.
            </p>

            <button
              onClick={() =>
                navigate("/browse-products")
              }
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

  // =========================================================
  // PAYMENT PAGE
  // =========================================================

  return (
    <CustomerLayout cartCount={cartCount}>

      <div className="max-w-5xl mx-auto">

        {/* =================================================
            BACK BUTTON
        ================================================= */}

        <button
          type="button"
          onClick={handleBackToCheckout}
          className="
            flex
            items-center
            gap-2
            text-gray-500
            hover:text-green-600
            transition
            mb-6
          "
        >
          <FiArrowLeft />
          Back to Checkout
        </button>

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="mb-6">

          <div className="flex items-center gap-3">

            <div
              className="
                w-11
                h-11
                rounded-xl
                bg-green-100
                text-green-600
                flex
                items-center
                justify-center
              "
            >
              <FiCreditCard size={21} />
            </div>

            <div>

              <h1
                className="
                  text-2xl
                  sm:text-3xl
                  font-bold
                  text-gray-800
                "
              >
                Payment
              </h1>

              <p className="text-gray-500 mt-1">
                Complete your payment securely.
              </p>

            </div>

          </div>

        </div>

        {/* =================================================
            GRID
        ================================================= */}

        <div
          className="
            grid
            grid-cols-1
            lg:grid-cols-3
            gap-6
          "
        >

          {/* =================================================
              CARD FORM
          ================================================= */}

          <div
            className="
              lg:col-span-2
              bg-white
              border
              border-gray-100
              rounded-2xl
              p-5
              sm:p-6
            "
          >

            {/* CARD FORM HEADER */}

            <div className="flex items-center gap-3">

              <div
                className="
                  w-11
                  h-11
                  rounded-xl
                  bg-green-100
                  text-green-600
                  flex
                  items-center
                  justify-center
                "
              >
                <FiCreditCard size={21} />
              </div>

              <div>

                <h2
                  className="
                    text-lg
                    font-bold
                    text-gray-800
                  "
                >
                  Card Information
                </h2>

                <p className="text-sm text-gray-500">
                  Enter the information on your card.
                </p>

              </div>

            </div>

            {/* =================================================
                ERROR MESSAGE
            ================================================= */}

            {errorMessage && (

              <div
                className="
                  mt-5
                  bg-red-50
                  border
                  border-red-200
                  rounded-xl
                  p-4
                  flex
                  items-start
                  gap-3
                "
              >

                <div
                  className="
                    w-8
                    h-8
                    rounded-full
                    bg-red-100
                    text-red-600
                    flex
                    items-center
                    justify-center
                    shrink-0
                  "
                >
                  <FiAlertCircle />
                </div>

                <div>

                  <p className="font-semibold text-red-700">
                    Payment information required
                  </p>

                  <p className="text-sm text-red-600 mt-1">
                    {errorMessage}
                  </p>

                </div>

              </div>

            )}

            {/* =================================================
                FORM
            ================================================= */}

            <form
              onSubmit={handlePayment}
              className="mt-6 space-y-5"
            >

              {/* =================================================
                  CARD NAME
              ================================================= */}

              <div>

                <label
                  className="
                    block
                    text-sm
                    font-medium
                    text-gray-700
                    mb-2
                  "
                >
                  Name on Card
                </label>

                <input
                  type="text"
                  value={cardName}
                  onChange={handleCardNameChange}
                  placeholder="Enter name on card"
                  autoComplete="cc-name"
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

              {/* =================================================
                  CARD NUMBER
              ================================================= */}

              <div>

                <label
                  className="
                    block
                    text-sm
                    font-medium
                    text-gray-700
                    mb-2
                  "
                >
                  Card Number
                </label>

                <div className="relative">

                  <FiCreditCard
                    className="
                      absolute
                      left-4
                      top-1/2
                      -translate-y-1/2
                      text-gray-400
                    "
                  />

                  <input
                    type="text"
                    inputMode="numeric"
                    value={cardNumber}
                    onChange={handleCardNumberChange}
                    placeholder="0000 0000 0000 0000"
                    autoComplete="cc-number"
                    className="
                      w-full
                      border
                      border-gray-200
                      rounded-xl
                      pl-11
                      pr-4
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

              {/* =================================================
                  EXPIRY + CVV
              ================================================= */}

              <div
                className="
                  grid
                  grid-cols-2
                  gap-4
                "
              >

                {/* EXPIRY */}

                <div>

                  <label
                    className="
                      block
                      text-sm
                      font-medium
                      text-gray-700
                      mb-2
                    "
                  >
                    Expiry Date
                  </label>

                  <input
                    type="text"
                    inputMode="numeric"
                    value={expiry}
                    onChange={handleExpiryChange}
                    placeholder="MM/YY"
                    autoComplete="cc-exp"
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

                {/* CVV */}

                <div>

                  <label
                    className="
                      block
                      text-sm
                      font-medium
                      text-gray-700
                      mb-2
                    "
                  >
                    CVV
                  </label>

                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength="3"
                    value={cvv}
                    onChange={handleCvvChange}
                    placeholder="•••"
                    autoComplete="cc-csc"
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

              {/* =================================================
                  SECURITY MESSAGE
              ================================================= */}

              <div
                className="
                  flex
                  items-start
                  gap-3
                  bg-green-50
                  border
                  border-green-100
                  rounded-xl
                  p-4
                "
              >

                <FiLock
                  className="
                    text-green-600
                    mt-0.5
                    shrink-0
                  "
                  size={18}
                />

                <div>

                  <p className="text-sm font-medium text-green-700">
                    Secure Payment
                  </p>

                  <p
                    className="
                      text-xs
                      text-green-700
                      leading-5
                      mt-1
                    "
                  >
                    Your payment will be securely processed.
                    CampusMart does not store your card details.
                  </p>

                </div>

              </div>

              {/* =================================================
                  PAY BUTTON
              ================================================= */}

              <button
                type="submit"
                className="
                  w-full
                  bg-green-600
                  hover:bg-green-700
                  active:bg-green-800
                  text-white
                  py-3.5
                  rounded-xl
                  font-semibold
                  transition
                  flex
                  items-center
                  justify-center
                  gap-2
                "
              >

                <FiLock size={17} />

                Pay ₦{Number(total).toLocaleString()}

              </button>

              <p
                className="
                  text-xs
                  text-gray-400
                  text-center
                  leading-5
                "
              >
                By continuing, you agree to CampusMart's
                terms and conditions.
              </p>

            </form>

          </div>

          {/* =================================================
              ORDER SUMMARY
          ================================================= */}

          <div
            className="
              bg-white
              border
              border-gray-100
              rounded-2xl
              p-5
              h-fit
              lg:sticky
              lg:top-24
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

            {/* ITEMS */}

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

                  {checkoutItems.reduce(
                    (total, item) =>
                      total + item.quantity,
                    0
                  )}

                </span>

              </div>

              {/* DELIVERY */}

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

                <span
                  className="
                    text-green-600
                    font-medium
                  "
                >
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
                items-center
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
                ₦{Number(total).toLocaleString()}
              </span>

            </div>

            {/* CUSTOMER INFO */}

            <div
              className="
                border-t
                border-gray-100
                mt-5
                pt-5
              "
            >

              <p
                className="
                  text-xs
                  font-semibold
                  text-gray-400
                  uppercase
                  tracking-wide
                "
              >
                Delivering To
              </p>

              <p
                className="
                  text-sm
                  font-semibold
                  text-gray-800
                  mt-2
                "
              >
                {formData.fullName || "Customer"}
              </p>

              {formData.campus && (

                <p className="text-xs text-gray-500 mt-1">
                  {formData.campus}
                </p>

              )}

              {formData.address && (

                <p className="text-xs text-gray-500 mt-1">
                  {formData.address}
                </p>

              )}

              {formData.phone && (

                <p className="text-xs text-gray-500 mt-1">
                  {formData.phone}
                </p>

              )}

            </div>

            {/* SECURE PAYMENT */}

            <div
              className="
                mt-5
                flex
                items-center
                gap-2
                text-xs
                text-gray-400
              "
            >

              <FiCheckCircle
                className="text-green-600"
              />

              Secure payment

            </div>

          </div>

        </div>

      </div>

    </CustomerLayout>
  );
}

export default Payment;