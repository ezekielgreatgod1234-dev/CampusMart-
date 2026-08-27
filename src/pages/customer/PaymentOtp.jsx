import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import CustomerLayout from "../../layouts/CustomerLayout";

import {
  FiArrowLeft,
  FiShield,
  FiAlertCircle,
  FiCheckCircle,
} from "react-icons/fi";

function PaymentOTP({
  cartCount = 0,
  placeOrder,
}) {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    checkoutItems = [],
    total = 0,
    formData = {},
    checkoutType = "all",
    paymentMeta = {},
  } = location.state || {};

  const demoOtp = paymentMeta.demoOtp || "123456";
  const last4 = paymentMeta.last4 || "****";

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [errorMessage, setErrorMessage] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(60);
  const inputsRef = useRef([]);

  useEffect(() => {
    if (checkoutItems.length === 0) return;
    inputsRef.current[0]?.focus();
  }, [checkoutItems.length]);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [secondsLeft]);

  const handleChange = (index, value) => {
    setErrorMessage("");
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);

    if (digit && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    setErrorMessage("");
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    if (!pasted) return;
    const next = Array(6).fill("");
    pasted.split("").forEach((ch, i) => {
      next[i] = ch;
    });
    setOtp(next);
    const focusIndex = Math.min(pasted.length, 5);
    inputsRef.current[focusIndex]?.focus();
  };

  const handleResend = () => {
    if (secondsLeft > 0) return;
    setSecondsLeft(60);
    setOtp(["", "", "", "", "", ""]);
    setErrorMessage("");
    inputsRef.current[0]?.focus();
    // Demo only — real app would trigger SMS/email via backend
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    const code = otp.join("");
    if (code.length !== 6) {
      setErrorMessage("Please enter the 6-digit OTP sent to you.");
      return;
    }

    // Demo: accept the demo OTP (shown on screen for testing)
    if (code !== String(demoOtp)) {
      setErrorMessage("Invalid OTP. Please try again.");
      return;
    }

    setVerifying(true);

    try {
      let order = null;

      if (typeof placeOrder === "function") {
        order = await placeOrder({
          items: checkoutItems,
          total,
          paymentMethod: "card",
          customer: formData,
          type: checkoutType,
          status: "pending",
        });
      } else {
        order = {
          id: `ORD-${Date.now()}`,
          orderNumber: `CM-${Date.now().toString().slice(-6)}`,
          items: checkoutItems,
          total,
          paymentMethod: "card",
          customer: formData,
          status: "pending",
          date: new Date().toLocaleString(),
        };
      }

      try {
        sessionStorage.setItem("lastOrder", JSON.stringify(order));
      } catch {
        // ignore
      }

      navigate("/order-success", {
        state: { order },
        replace: true,
      });
    } catch (error) {
      console.error("Place order after OTP error:", error);
      setErrorMessage(
        "Payment verified, but we could not save your order. Please contact support."
      );
      setVerifying(false);
    }
  };

  const handleBack = () => {
    navigate("/payment", {
      state: {
        checkoutItems,
        total,
        formData,
        checkoutType,
      },
    });
  };

  if (checkoutItems.length === 0) {
    return (
      <CustomerLayout cartCount={cartCount}>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-800">
              Session expired
            </h1>
            <p className="text-gray-500 mt-2">
              Please start checkout again.
            </p>
            <button
              type="button"
              onClick={() => navigate("/cart")}
              className="mt-6 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-medium"
            >
              Go to Cart
            </button>
          </div>
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout cartCount={cartCount}>
      <div className="max-w-md mx-auto">
        <button
          type="button"
          onClick={handleBack}
          className="flex items-center gap-2 text-gray-500 hover:text-green-600 transition mb-6"
        >
          <FiArrowLeft />
          Back to Payment
        </button>

        <div className="bg-white border border-gray-100 rounded-2xl p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-green-100 text-green-600 flex items-center justify-center">
              <FiShield size={26} />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mt-4">
              Verify payment
            </h1>
            <p className="text-sm text-gray-500 mt-2 leading-6">
              Enter the 6-digit OTP sent to confirm payment of{" "}
              <span className="font-semibold text-gray-800">
                ₦{Number(total).toLocaleString()}
              </span>
              {last4 !== "****" && (
                <>
                  {" "}
                  for card ending in{" "}
                  <span className="font-semibold text-gray-800">
                    {last4}
                  </span>
                </>
              )}
              .
            </p>
          </div>

          {/* Demo helper — remove when connecting real OTP */}
          <div className="mt-5 rounded-xl bg-green-50 border border-green-100 p-3 text-center">
            <p className="text-xs text-green-700">
              Demo OTP for testing:{" "}
              <span className="font-bold tracking-widest">{demoOtp}</span>
            </p>
          </div>

          {errorMessage && (
            <div className="mt-5 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
              <FiAlertCircle className="text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-600">{errorMessage}</p>
            </div>
          )}

          <form onSubmit={handleVerify} className="mt-6">
            <div
              className="flex justify-between gap-2 sm:gap-3"
              onPaste={handlePaste}
            >
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => {
                    inputsRef.current[index] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="
                    w-11 h-12 sm:w-12 sm:h-14
                    text-center text-lg font-bold
                    border border-gray-200 rounded-xl
                    outline-none
                    focus:border-green-500 focus:ring-2 focus:ring-green-100
                  "
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={verifying}
              className="
                w-full mt-6 h-12 rounded-xl
                bg-green-600 hover:bg-green-700 disabled:bg-green-400
                text-white font-semibold transition
              "
            >
              {verifying ? "Verifying..." : "Verify OTP"}
            </button>
          </form>

          <div className="mt-5 text-center">
            <p className="text-sm text-gray-500">
              Didn&apos;t get the code?{" "}
              {secondsLeft > 0 ? (
                <span className="text-gray-400">
                  Resend in {secondsLeft}s
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  className="text-green-600 font-semibold hover:text-green-700"
                >
                  Resend OTP
                </button>
              )}
            </p>
          </div>

          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-400">
            <FiCheckCircle className="text-green-600" />
            Secure verification
          </div>
        </div>
      </div>
    </CustomerLayout>
  );
}

export default PaymentOTP;