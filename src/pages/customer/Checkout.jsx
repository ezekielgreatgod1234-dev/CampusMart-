import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import CustomerLayout from "../../layouts/CustomerLayout";

import {
  FiArrowLeft,
  FiMapPin,
  FiCreditCard,
} from "react-icons/fi";

function Checkout({
  cart = [],
  cartCount = 0,
  placeOrder,
}) {
  const navigate = useNavigate();
  const location = useLocation();

  const checkoutItems =
    location.state?.checkoutItems?.length > 0
      ? location.state.checkoutItems
      : cart;

  const checkoutType =
    location.state?.checkoutType || "all";

  const checkoutCount = checkoutItems.reduce(
    (total, item) => total + item.quantity,
    0
  );

  // Card only
  const [paymentMethod] = useState("card");
  const [errorMessage, setErrorMessage] = useState("");

  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    address: "",
    campus: "",
    note: "",
  });

  const cartTotal = checkoutItems.reduce((total, item) => {
    const price = Number(
      String(item.price).replace(/[₦,]/g, "")
    );
    return total + price * item.quantity;
  }, 0);

  const deliveryFee = 0;
  const total = cartTotal + deliveryFee;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handlePlaceOrder = (e) => {
    e.preventDefault();

    if (!formData.fullName.trim()) {
      setErrorMessage("Please enter your full name.");
      return;
    }

    if (!formData.phone.trim()) {
      setErrorMessage("Please enter your phone number.");
      return;
    }

    if (!formData.campus.trim()) {
      setErrorMessage("Please enter your campus.");
      return;
    }

    if (!formData.address.trim()) {
      setErrorMessage("Please enter your delivery address.");
      return;
    }

    setErrorMessage("");

    // Always go to card payment
    navigate("/payment", {
      state: {
        checkoutItems,
        total,
        formData,
        checkoutType,
        paymentMethod: "card",
      },
    });
  };

  if (checkoutItems.length === 0) {
    return (
      <CustomerLayout cartCount={0}>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-800">
              Nothing to Checkout
            </h1>
            <p className="text-gray-500 mt-2">
              There are no products selected for checkout.
            </p>
            <button
              onClick={() => navigate("/browse-products")}
              className="
                mt-6 bg-green-600 hover:bg-green-700
                text-white px-6 py-3 rounded-xl font-medium
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
      <form onSubmit={handlePlaceOrder} className="space-y-6">
        {errorMessage && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0 font-bold">
              !
            </div>
            <div>
              <p className="font-semibold text-red-700">
                Unable to place order
              </p>
              <p className="text-sm text-red-600 mt-1">
                {errorMessage}
              </p>
            </div>
          </div>
        )}

        {/* HEADER */}
        <div>
          <button
            type="button"
            onClick={() => navigate("/cart")}
            className="flex items-center gap-2 text-gray-500 hover:text-green-600 transition"
          >
            <FiArrowLeft />
            Back to Cart
          </button>

          <div className="mt-5">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
              Checkout
            </h1>
            <p className="text-gray-500 mt-1">
              {checkoutType === "single"
                ? "You're checking out this item."
                : "You're checking out all items in your cart."}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* LEFT */}
          <div className="xl:col-span-2 space-y-6">
            {/* DELIVERY */}
            <section className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-green-100 text-green-600 flex items-center justify-center">
                  <FiMapPin size={21} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-800">
                    Delivery Information
                  </h2>
                  <p className="text-sm text-gray-500">
                    Where should we deliver your order?
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    className="
                      w-full border border-gray-200 rounded-xl px-4 py-3 text-sm
                      outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100
                    "
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="08012345678"
                    className="
                      w-full border border-gray-200 rounded-xl px-4 py-3 text-sm
                      outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100
                    "
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Campus *
                  </label>
                  <input
                    type="text"
                    name="campus"
                    value={formData.campus}
                    onChange={handleChange}
                    placeholder="e.g. ABSU Uturu"
                    className="
                      w-full border border-gray-200 rounded-xl px-4 py-3 text-sm
                      outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100
                    "
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Delivery Address *
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Hostel, block, room..."
                    className="
                      w-full border border-gray-200 rounded-xl px-4 py-3 text-sm
                      outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100
                    "
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Delivery Note
                </label>
                <textarea
                  name="note"
                  value={formData.note}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Any special instructions for the seller?"
                  className="
                    w-full border border-gray-200 rounded-xl px-4 py-3 text-sm
                    outline-none resize-none focus:border-green-500 focus:ring-2 focus:ring-green-100
                  "
                />
              </div>
            </section>

            {/* PAYMENT — CARD ONLY */}
            <section className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-green-100 text-green-600 flex items-center justify-center">
                  <FiCreditCard size={21} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-800">
                    Payment Method
                  </h2>
                  <p className="text-sm text-gray-500">
                    Pay securely with your card.
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <div className="block p-4 rounded-xl border border-green-500 bg-green-50">
                  <div className="flex items-center gap-4">
                    <div className="w-5 h-5 rounded-full border-2 border-green-600 flex items-center justify-center shrink-0">
                      <div className="w-2.5 h-2.5 rounded-full bg-green-600" />
                    </div>

                    <div className="w-10 h-10 rounded-lg bg-white border border-gray-100 flex items-center justify-center text-green-600 shrink-0">
                      <FiCreditCard size={19} />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold text-gray-800">
                          Pay with Card
                        </p>
                        <span className="text-[10px] font-semibold bg-green-100 text-green-700 px-2 py-1 rounded-full">
                          SECURE
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Pay securely using your debit or credit card.
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 ml-8 pl-4 border-l-2 border-green-200">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-600">
                        💳 Debit Card
                      </span>
                      <span className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-600">
                        🏦 Bank
                      </span>
                      <span className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-600">
                        USSD
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400 mt-3">
                      You will be redirected to a secure payment page to
                      complete your payment.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-5 flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0">
                  🔒
                </div>
                <p className="text-xs text-gray-500 leading-5">
                  Your payment information is securely processed.
                  CampusMart does not store your card details.
                </p>
              </div>
            </section>
          </div>

          {/* SUMMARY */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 h-fit xl:sticky xl:top-24">
            <h2 className="text-xl font-bold text-gray-800">
              Order Summary
            </h2>

            <div className="space-y-4 mt-6">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">
                  Items ({checkoutCount})
                </span>
                <span className="font-medium">
                  ₦{cartTotal.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Delivery</span>
                <span className="font-medium text-green-600">Free</span>
              </div>
            </div>

            <div className="border-t border-gray-100 mt-5 pt-5 flex items-center justify-between">
              <span className="font-semibold text-gray-800">Total</span>
              <span className="text-xl font-bold text-gray-900">
                ₦{total.toLocaleString()}
              </span>
            </div>

            <button
              type="submit"
              className="
                w-full mt-6 bg-green-600 hover:bg-green-700
                text-white py-3.5 rounded-xl font-semibold transition
              "
            >
              Pay Now
            </button>

            <p className="text-xs text-gray-400 text-center mt-4 leading-5">
              By placing your order, you agree to CampusMart&apos;s
              terms and conditions.
            </p>
          </div>
        </div>
      </form>
    </CustomerLayout>
  );
}

export default Checkout;