import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import CustomerLayout from "../../layouts/CustomerLayout";

import {
  FiArrowLeft,
  FiCreditCard,
  FiLock,
  FiCheckCircle,
  FiAlertCircle,
  FiShield,
} from "react-icons/fi";

import { useAuth } from "../../context/AuthContext";

function Payment({ cartCount = 0, placeOrder }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { firebaseUser } = useAuth();

  const {
    checkoutItems = [],
    total = 0,
    formData = {},
    checkoutType = "all",
  } = location.state || {};

  const [paying, setPaying] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const email =
    formData?.email ||
    firebaseUser?.email ||
    "buyer@campusmart.app";

  const amountNaira = Number(total) || 0;

  const hasValidCheckout = useMemo(() => {
    return (
      Array.isArray(checkoutItems) &&
      checkoutItems.length > 0 &&
      amountNaira > 0
    );
  }, [checkoutItems, amountNaira]);

  const formatNaira = (n) =>
    `₦${Number(n || 0).toLocaleString("en-NG")}`;

  // =====================================================
  // PAY WITH PAYSTACK
  // =====================================================

  const handlePayWithPaystack = () => {
    setErrorMessage("");

    if (!firebaseUser) {
      setErrorMessage("Please log in to continue payment.");
      return;
    }

    if (!hasValidCheckout) {
      setErrorMessage("Checkout data is missing. Return to cart and try again.");
      return;
    }

    const publicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;

    if (!publicKey || !String(publicKey).startsWith("pk_")) {
      setErrorMessage(
        "Paystack public key is not configured. Add VITE_PAYSTACK_PUBLIC_KEY to your .env file."
      );
      return;
    }

    if (typeof window.PaystackPop === "undefined") {
      setErrorMessage(
        "Paystack failed to load. Check your internet connection and refresh the page."
      );
      return;
    }

    const reference = `CM-${Date.now()}-${Math.floor(Math.random() * 100000)}`;

    setPaying(true);

    const handler = window.PaystackPop.setup({
      key: publicKey,
      email,
      amount: Math.round(amountNaira * 100), // kobo
      currency: "NGN",
      ref: reference,
      metadata: {
        custom_fields: [
          {
            display_name: "Buyer Name",
            variable_name: "buyer_name",
            value: formData?.fullName || "CampusMart Buyer",
          },
          {
            display_name: "Campus",
            variable_name: "campus",
            value: formData?.campus || "",
          },
          {
            display_name: "Phone",
            variable_name: "phone",
            value: formData?.phone || "",
          },
        ],
      },
      callback: function (response) {
        // Paystack success — create order + credit seller
        (async () => {
          try {
            if (typeof placeOrder !== "function") {
              throw new Error("placeOrder is not available");
            }

            const order = await placeOrder({
              items: checkoutItems,
              total: amountNaira,
              paymentMethod: "card",
              type: checkoutType,
              customer: {
                fullName: formData?.fullName || "",
                phone: formData?.phone || "",
                campus: formData?.campus || "",
                address: formData?.address || "",
                note: formData?.note || "",
                email,
              },
              paystackReference: response.reference,
            });

            navigate("/order-success", {
              replace: true,
              state: {
                order,
                paystackReference: response.reference,
              },
            });
          } catch (err) {
            console.error("Order create after Paystack error:", err);
            setErrorMessage(
              "Payment succeeded but order could not be saved. Contact support with reference: " +
                response.reference
            );
            setPaying(false);
          }
        })();
      },
      onClose: function () {
        setPaying(false);
        setErrorMessage("Payment window closed. You can try again.");
      },
    });

    handler.openIframe();
  };

  // =====================================================
  // NO CHECKOUT STATE
  // =====================================================

  if (!hasValidCheckout) {
    return (
      <CustomerLayout cartCount={cartCount}>
        <div className="min-h-[60vh] flex items-center justify-center px-4">
          <div className="text-center max-w-sm">
            <div className="w-16 h-16 mx-auto rounded-full bg-red-50 text-red-500 flex items-center justify-center">
              <FiAlertCircle size={28} />
            </div>
            <h1 className="text-xl font-bold text-gray-800 mt-4">
              Nothing to pay for
            </h1>
            <p className="text-sm text-gray-500 mt-2">
              Start again from your cart or checkout.
            </p>
            <button
              type="button"
              onClick={() => navigate("/cart")}
              className="mt-6 h-11 px-6 rounded-xl bg-[#008236] text-white font-semibold text-sm"
            >
              Back to Cart
            </button>
          </div>
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout cartCount={cartCount}>
      <div className="max-w-lg mx-auto space-y-6">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-500 hover:text-green-600 transition text-sm"
        >
          <FiArrowLeft />
          Back
        </button>

        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pay with card</h1>
          <p className="text-sm text-gray-500 mt-1">
            Secure payment powered by Paystack
          </p>
        </div>

        {errorMessage && (
          <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 flex items-start gap-3">
            <FiAlertCircle className="text-red-500 shrink-0 mt-0.5" size={18} />
            <p className="text-sm text-red-600">{errorMessage}</p>
          </div>
        )}

        {/* AMOUNT */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <p className="text-xs text-gray-400 uppercase font-semibold tracking-wide">
            Amount to pay
          </p>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {formatNaira(amountNaira)}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            {checkoutItems.length} item
            {checkoutItems.length === 1 ? "" : "s"} · Free delivery
          </p>
        </div>

        {/* DELIVERING TO */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <p className="text-xs text-gray-400 uppercase font-semibold tracking-wide">
            Delivering to
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

        {/* PAY BUTTON */}
        <button
          type="button"
          disabled={paying}
          onClick={handlePayWithPaystack}
          className="
            w-full h-12 rounded-xl
            bg-[#008236] hover:bg-[#006f2e] active:bg-[#005f28]
            text-white font-semibold text-base
            flex items-center justify-center gap-2
            disabled:opacity-60 transition shadow-sm
          "
        >
          {paying ? (
            "Opening Paystack…"
          ) : (
            <>
              <FiCreditCard size={18} />
              Pay {formatNaira(amountNaira)}
            </>
          )}
        </button>

        <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
          <FiLock size={14} className="text-green-600" />
          <span>Secured by Paystack · SSL encrypted</span>
        </div>

        <div className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50 p-4">
          <div className="w-8 h-8 rounded-lg bg-white text-[#008236] flex items-center justify-center border border-green-100 shrink-0">
            <FiShield size={16} />
          </div>
          <p className="text-xs text-gray-500 leading-5">
            You will enter your card details on Paystack’s secure page. CampusMart
            never stores your full card number. After payment, your order is
            created and the seller is credited (minus 5% platform fee).
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-400 justify-center">
          <FiCheckCircle className="text-green-600" size={14} />
          Secure payment
        </div>
      </div>
    </CustomerLayout>
  );
}

export default Payment;