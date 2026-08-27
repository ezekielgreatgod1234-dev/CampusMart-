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

  const {
    checkoutItems = [],
    total = 0,
    formData = {},
    checkoutType = "all",
  } = location.state || {};

  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [cardName, setCardName] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const formatCardNumber = (value) => {
    const numbers = value.replace(/\D/g, "").slice(0, 16);
    return numbers.replace(/(.{4})/g, "$1 ").trim();
  };

  const handleCardNumberChange = (e) => {
    setErrorMessage("");
    setCardNumber(formatCardNumber(e.target.value));
  };

  const handleExpiryChange = (e) => {
    setErrorMessage("");
    let value = e.target.value.replace(/\D/g, "").slice(0, 4);
    if (value.length >= 3) {
      value = value.slice(0, 2) + "/" + value.slice(2);
    }
    setExpiry(value);
  };

  const handleCvvChange = (e) => {
    setErrorMessage("");
    setCvv(e.target.value.replace(/\D/g, "").slice(0, 3));
  };

  const handleCardNameChange = (e) => {
    setErrorMessage("");
    setCardName(e.target.value);
  };

  // Validate card UI → go to OTP page (no real charge)
  const handlePayment = (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!cardName.trim()) {
      setErrorMessage("Please enter the name on your card.");
      return;
    }

    const cleanCardNumber = cardNumber.replace(/\s/g, "");
    if (cleanCardNumber.length !== 16) {
      setErrorMessage("Please enter a valid 16-digit card number.");
      return;
    }

    if (expiry.length !== 5) {
      setErrorMessage("Please enter your card expiry date in MM/YY format.");
      return;
    }

    if (cvv.length !== 3) {
      setErrorMessage("Please enter your 3-digit CVV.");
      return;
    }

    setSubmitting(true);

    // Demo: pretend bank sent OTP, then open OTP page
    // Do NOT store or send raw card details.
    const last4 = cleanCardNumber.slice(-4);

    navigate("/payment/otp", {
      state: {
        checkoutItems,
        total,
        formData,
        checkoutType,
        paymentMeta: {
          last4,
          cardName: cardName.trim(),
          // Demo OTP for testing (show on OTP page in demo mode)
          demoOtp: "123456",
        },
      },
      replace: false,
    });
  };

  const handleBackToCheckout = () => {
    navigate("/checkout", {
      state: {
        checkoutItems,
        checkoutType,
        formData,
      },
    });
  };

  if (checkoutItems.length === 0) {
    return (
      <CustomerLayout cartCount={cartCount}>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-gray-100 text-gray-400 flex items-center justify-center">
              <FiCreditCard size={28} />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mt-5">
              No Payment Items
            </h1>
            <p className="text-gray-500 mt-2">
              There are no items available for payment.
            </p>
            <button
              type="button"
              onClick={() => navigate("/browse-products")}
              className="mt-6 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-medium transition"
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
      <div className="max-w-5xl mx-auto">
        <button
          type="button"
          onClick={handleBackToCheckout}
          className="flex items-center gap-2 text-gray-500 hover:text-green-600 transition mb-6"
        >
          <FiArrowLeft />
          Back to Checkout
        </button>

        <div className="mb-6">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-green-100 text-green-600 flex items-center justify-center">
              <FiCreditCard size={21} />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
                Payment
              </h1>
              <p className="text-gray-500 mt-1">
                Complete your payment securely.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white border border-gray-100 rounded-2xl p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-green-100 text-green-600 flex items-center justify-center">
                <FiCreditCard size={21} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-800">
                  Card Information
                </h2>
                <p className="text-sm text-gray-500">
                  Enter the information on your card.
                </p>
              </div>
            </div>

            {errorMessage && (
              <div className="mt-5 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                  <FiAlertCircle />
                </div>
                <div>
                  <p className="font-semibold text-red-700">
                    Payment information required
                  </p>
                  <p className="text-sm text-red-600 mt-1">{errorMessage}</p>
                </div>
              </div>
            )}

            <form onSubmit={handlePayment} className="mt-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name on Card
                </label>
                <input
                  type="text"
                  value={cardName}
                  onChange={handleCardNameChange}
                  placeholder="Enter name on card"
                  autoComplete="cc-name"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Card Number
                </label>
                <div className="relative">
                  <FiCreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    inputMode="numeric"
                    value={cardNumber}
                    onChange={handleCardNumberChange}
                    placeholder="0000 0000 0000 0000"
                    autoComplete="cc-number"
                    className="w-full border border-gray-200 rounded-xl pl-11 pr-4 py-3 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Expiry Date
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={expiry}
                    onChange={handleExpiryChange}
                    placeholder="MM/YY"
                    autoComplete="cc-exp"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
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
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
                  />
                </div>
              </div>

              <div className="flex items-start gap-3 bg-green-50 border border-green-100 rounded-xl p-4">
                <FiLock className="text-green-600 mt-0.5 shrink-0" size={18} />
                <div>
                  <p className="text-sm font-medium text-green-700">
                    Secure Payment
                  </p>
                  <p className="text-xs text-green-700 leading-5 mt-1">
                    After you click Pay, we will send a one-time code (OTP) to
                    confirm this payment. CampusMart does not store your card
                    details.
                  </p>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-green-600 hover:bg-green-700 active:bg-green-800 disabled:bg-green-400 text-white py-3.5 rounded-xl font-semibold transition flex items-center justify-center gap-2"
              >
                <FiLock size={17} />
                {submitting
                  ? "Continuing..."
                  : `Pay ₦${Number(total).toLocaleString()}`}
              </button>

              <p className="text-xs text-gray-400 text-center leading-5">
                By continuing, you agree to CampusMart&apos;s terms and
                conditions.
              </p>
            </form>
          </div>

          {/* SUMMARY */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5 h-fit lg:sticky lg:top-24">
            <h2 className="text-lg font-bold text-gray-800">Order Summary</h2>
            <div className="space-y-4 mt-5">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Items</span>
                <span className="font-medium">
                  {checkoutItems.reduce(
                    (sum, item) => sum + item.quantity,
                    0
                  )}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Delivery</span>
                <span className="text-green-600 font-medium">Free</span>
              </div>
            </div>
            <div className="border-t border-gray-100 mt-5 pt-5 flex items-center justify-between">
              <span className="font-semibold text-gray-800">Total</span>
              <span className="text-xl font-bold text-gray-900">
                ₦{Number(total).toLocaleString()}
              </span>
            </div>
            <div className="border-t border-gray-100 mt-5 pt-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                Delivering To
              </p>
              <p className="text-sm font-semibold text-gray-800 mt-2">
                {formData.fullName || "Customer"}
              </p>
              {formData.campus && (
                <p className="text-xs text-gray-500 mt-1">{formData.campus}</p>
              )}
              {formData.address && (
                <p className="text-xs text-gray-500 mt-1">{formData.address}</p>
              )}
              {formData.phone && (
                <p className="text-xs text-gray-500 mt-1">{formData.phone}</p>
              )}
            </div>
            <div className="mt-5 flex items-center gap-2 text-xs text-gray-400">
              <FiCheckCircle className="text-green-600" />
              Secure payment
            </div>
          </div>
        </div>
      </div>
    </CustomerLayout>
  );
}

export default Payment;