import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import CustomerLayout from "../../layouts/CustomerLayout";

import {
  FiArrowLeft,
  FiCreditCard,
  FiLock,
  FiCheckCircle,
  FiAlertCircle,
} from "react-icons/fi";

import { useAuth } from "../../context/AuthContext";

// =====================================================
// PAYSTACK FEE (Nigeria, local cards)
// Gross-up so the BUYER pays the fee and the seller
// still nets the real product total.
// =====================================================

const PAYSTACK_PERCENT = 0.015;
const PAYSTACK_FLAT = 100;
const PAYSTACK_FEE_CAP = 2000;
const PAYSTACK_WAIVER_THRESHOLD = 2500;

function calculatePaystackGrossUp(targetAmount) {
  const target = Number(targetAmount) || 0;

  if (target <= 0) {
    return { fee: 0, totalToCharge: 0 };
  }

  if (target <= PAYSTACK_WAIVER_THRESHOLD) {
    return { fee: 0, totalToCharge: target };
  }

  const uncappedCharge = (target + PAYSTACK_FLAT) / (1 - PAYSTACK_PERCENT);
  const uncappedFee = uncappedCharge - target;

  if (uncappedFee <= PAYSTACK_FEE_CAP) {
    const totalToCharge = Math.ceil(uncappedCharge);
    return { fee: totalToCharge - target, totalToCharge };
  }

  const totalToCharge = target + PAYSTACK_FEE_CAP;
  return { fee: PAYSTACK_FEE_CAP, totalToCharge };
}

function Payment({ cartCount = 0 }) {
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

  const { fee: paystackFee, totalToCharge: amountToChargeBuyer } = useMemo(
    () => calculatePaystackGrossUp(amountNaira),
    [amountNaira]
  );

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
  // Does NOT create an order yet.
  // Order is created only after Paystack confirms payment
  // (webhook + /order-success recovery).
  // =====================================================

  const handlePayWithPaystack = async () => {
    setErrorMessage("");

    if (!firebaseUser) {
      setErrorMessage("Please log in to continue payment.");
      return;
    }

    if (!hasValidCheckout) {
      setErrorMessage("Checkout data is missing. Return to cart and try again.");
      return;
    }

    const sellerId =
      checkoutItems[0]?.sellerId ||
      checkoutItems[0]?.seller?.id ||
      checkoutItems[0]?.ownerId ||
      checkoutItems[0]?.userId ||
      null;

    if (!sellerId) {
      setErrorMessage("Seller information is missing. Cannot process payment.");
      return;
    }

    setPaying(true);

    try {
      // Compact items for Paystack metadata / recovery
      const compactItems = checkoutItems.map((item) => ({
        id: item.id || item.productId || null,
        productId: item.productId || item.id || null,
        name: item.name || "",
        price: Number(item.price) || 0,
        quantity: Number(item.quantity) || 1,
        image: item.image || item.imageUrl || null,
        sellerId:
          item.sellerId ||
          item.seller?.id ||
          item.ownerId ||
          item.userId ||
          sellerId,
        sellerName: item.sellerName || item.seller?.name || "",
      }));

      const customer = {
        fullName: formData?.fullName || "",
        phone: formData?.phone || "",
        campus: formData?.campus || "",
        address: formData?.address || "",
        note: formData?.note || "",
        email,
      };

      // Save checkout payload for OrderSuccess recovery
      // (still no Firestore order yet)
      const pendingCheckout = {
        buyerId: firebaseUser.uid,
        sellerId: String(sellerId),
        items: compactItems,
        total: amountNaira,
        amountCharged: amountToChargeBuyer,
        paystackFee,
        paymentMethod: "card",
        type: checkoutType,
        customer,
        createdAt: Date.now(),
      };

      try {
        sessionStorage.setItem(
          "campusmart_pending_checkout",
          JSON.stringify(pendingCheckout)
        );
      } catch (storageError) {
        console.warn("Could not save pending checkout:", storageError);
      }

      // Initialize Paystack only — no placeOrder here
      const response = await fetch(
        "https://campusbackend-1.onrender.com/initialize-payment",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            amount: amountToChargeBuyer,
            sellerId: String(sellerId),
            buyerId: firebaseUser.uid,
            productName: compactItems[0]?.name || "CampusMart Order",
            productTotal: amountNaira,
            paystackFee,
            type: "order",
            checkoutType,
            customer,
            items: compactItems,
            callback_url: `${window.location.origin}/order-success`,
          }),
        }
      );

      const data = await response.json();

      if (!data.authorization_url) {
        setErrorMessage(data.error || "Payment could not be started");
        setPaying(false);
        return;
      }

      const reference =
        data.reference ||
        data.data?.reference ||
        "";

      try {
        sessionStorage.setItem(
          "campusmart_pending_payment",
          JSON.stringify({
            reference: reference || null,
            savedAt: Date.now(),
            checkout: pendingCheckout,
          })
        );

        if (reference) {
          sessionStorage.setItem(
            `campusmart_payment_${reference}`,
            JSON.stringify({
              reference,
              checkout: pendingCheckout,
              savedAt: Date.now(),
            })
          );
        }
      } catch (storageError) {
        console.warn("Could not save payment recovery data:", storageError);
      }

      // Redirect to Paystack
      window.location.href = data.authorization_url;
    } catch (error) {
      console.error("Payment error:", error);
      setErrorMessage(
        error.message || "Something went wrong. Please try again."
      );
      setPaying(false);
    }
  };

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

        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <p className="text-xs text-gray-400 uppercase font-semibold tracking-wide">
            Amount to pay
          </p>

          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">
                Subtotal ({checkoutItems.length} item
                {checkoutItems.length === 1 ? "" : "s"})
              </span>
              <span className="text-gray-700 font-medium">
                {formatNaira(amountNaira)}
              </span>
            </div>

            {paystackFee > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Card processing fee</span>
                <span className="text-gray-700 font-medium">
                  {formatNaira(paystackFee)}
                </span>
              </div>
            )}

            <div className="pt-2 mt-1 border-t border-gray-100 flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-800">
                Total to pay
              </span>
              <span className="text-2xl font-bold text-gray-900">
                {formatNaira(amountToChargeBuyer)}
              </span>
            </div>
          </div>

          {paystackFee > 0 && (
            <p className="text-xs text-gray-400 mt-3">
              Includes a small card processing fee charged by Paystack.
              Free delivery is already included in the subtotal.
            </p>
          )}
        </div>

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
            "Redirecting to Paystack…"
          ) : (
            <>
              <FiCreditCard size={18} />
              Pay {formatNaira(amountToChargeBuyer)}
            </>
          )}
        </button>

        <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
          <FiLock size={14} className="text-green-600" />
          <span>Secured by Paystack · SSL encrypted</span>
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-400 justify-center">
          <FiCheckCircle className="text-green-600" size={14} />
          Your order is created only after payment succeeds
        </div>
      </div>
    </CustomerLayout>
  );
}

export default Payment;