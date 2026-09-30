import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { FiMail, FiCheckCircle, FiAlertCircle } from "react-icons/fi";

// Backend base URL (same server that exposes /send-welcome-email)
const API_BASE_URL = String(
  import.meta.env?.VITE_API_URL ||
    import.meta.env?.VITE_BACKEND_URL ||
    "http://localhost:5000"
).replace(/\/+$/, "");

function VerifyEmail() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const [status, setStatus] = useState("idle"); // idle | loading | done | error
  const [message, setMessage] = useState("");

  const uid = params.get("uid") || "";
  const token = params.get("token") || "";
  const linkLooksValid = Boolean(uid && token);

  // Verification only happens when the button is pressed (not on page load),
  // so email link scanners cannot use the link up before the person does.
  const handleVerify = async () => {
    if (!linkLooksValid || status === "loading") return;

    setStatus("loading");
    setMessage("");

    try {
      const response = await fetch(`${API_BASE_URL}/verify-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid, token }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || "Verification failed. Please try again."
        );
      }

      setStatus("done");
    } catch (err) {
      setMessage(
        err?.message === "Failed to fetch"
          ? "Network error. Please check your internet connection and try again."
          : err?.message || "Verification failed. Please try again."
      );
      setStatus("error");
    }
  };

  return (
    <div className="min-h-screen bg-[#f7faf8] flex items-center justify-center px-5 py-10">
      <div className="w-full max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-3 group mb-10">
          <div className="w-14 h-14 rounded-2xl bg-green-600 text-white flex items-center justify-center text-xl font-black tracking-tight shadow-[0_8px_20px_rgba(22,163,74,0.25)] ring-4 ring-green-100">
            CM
          </div>
          <div className="text-left">
            <div className="text-2xl font-black text-gray-900 tracking-tight">
              Campus
              <span className="text-green-600">Mart</span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Your Campus Marketplace
            </p>
          </div>
        </Link>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 sm:p-10">
          {status === "done" ? (
            <>
              <div className="w-16 h-16 mx-auto rounded-full bg-green-100 text-green-600 flex items-center justify-center mb-6">
                <FiCheckCircle size={30} />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                Email verified
              </h1>
              <p className="mt-3 text-gray-500 leading-relaxed">
                Your account is ready. You can log in now.
              </p>
              <button
                type="button"
                onClick={() => navigate("/login", { replace: true })}
                className="mt-8 w-full h-13 rounded-xl bg-green-600 text-white font-bold text-sm hover:bg-green-700 transition shadow-lg shadow-green-600/10"
              >
                Go to Login
              </button>
            </>
          ) : status === "error" || !linkLooksValid ? (
            <>
              <div className="w-16 h-16 mx-auto rounded-full bg-red-50 text-red-500 flex items-center justify-center mb-6">
                <FiAlertCircle size={30} />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                Could not verify
              </h1>
              <p className="mt-3 text-gray-500 leading-relaxed">
                {linkLooksValid
                  ? message
                  : "This verification link is not valid. Log in and tap Resend to get a new one."}
              </p>
              <div className="mt-8 flex flex-col gap-3">
                {linkLooksValid && (
                  <button
                    type="button"
                    onClick={handleVerify}
                    className="w-full h-13 rounded-xl bg-green-600 text-white font-bold text-sm hover:bg-green-700 transition"
                  >
                    Try again
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => navigate("/login", { replace: true })}
                  className="w-full h-13 rounded-xl border border-gray-200 text-gray-700 font-bold text-sm hover:bg-gray-50 transition"
                >
                  Go to Login to get a new link
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="w-16 h-16 mx-auto rounded-full bg-green-100 text-green-600 flex items-center justify-center mb-6">
                <FiMail size={28} />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                Verify your email
              </h1>
              <p className="mt-3 text-gray-500 leading-relaxed">
                Tap the button below to finish setting up your CampusMart
                account.
              </p>
              <button
                type="button"
                onClick={handleVerify}
                disabled={status === "loading"}
                className="mt-8 w-full h-13 rounded-xl bg-green-600 text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-green-700 transition shadow-lg shadow-green-600/10 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {status === "loading" ? (
                  <>
                    <span className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify my email"
                )}
              </button>
            </>
          )}
        </div>

        <div className="mt-8">
          <Link
            to="/"
            className="text-sm text-gray-400 hover:text-green-600 transition"
          >
            ← Back to CampusMart
          </Link>
        </div>
      </div>
    </div>
  );
}

export default VerifyEmail;