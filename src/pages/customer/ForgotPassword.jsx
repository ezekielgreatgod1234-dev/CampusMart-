import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiArrowLeft,
  FiArrowRight,
  FiCheck,
  FiMail,
  FiRefreshCw,
  FiShield,
  FiAlertCircle,
} from "react-icons/fi";

// Backend base URL (same server that exposes /send-verification-email)
const API_BASE_URL = String(
  import.meta.env?.VITE_API_URL ||
    import.meta.env?.VITE_BACKEND_URL ||
    "http://localhost:5000"
).replace(/\/+$/, "");

function ForgotPassword() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [sentTo, setSentTo] = useState("");
  const [expiresIn, setExpiresIn] = useState(30);
  const [error, setError] = useState("");

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;

    setError("");
    setSuccess(false);

    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail) {
      setError("Please enter your email address.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(trimmedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!navigator.onLine) {
      setError(
        "Internet connection is required to reset your password. Please connect to the internet and try again."
      );
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_BASE_URL}/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // origin lets the backend put a link to the site you are actually
        // on in the email (live site or localhost while testing).
        body: JSON.stringify({
          email: trimmedEmail,
          origin: window.location.origin,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.success) {
        throw new Error(
          data.error ||
            "Unable to send the password reset email. Please try again."
        );
      }

      setSentTo(trimmedEmail);
      setExpiresIn(Number(data.expiresInMinutes) || 30);
      setSuccess(true);
      setEmail("");
    } catch (err) {
      console.error("Password reset error:", err);

      setError(
        err?.message === "Failed to fetch"
          ? "Network error. Please check your internet connection and try again."
          : err?.message ||
              "Unable to send the password reset email. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-[#f7faf8] flex items-center justify-center px-5 py-10"
      style={{ colorScheme: "light" }}
    >
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
          {success ? (
            <>
              <div className="w-16 h-16 mx-auto rounded-full bg-green-100 text-green-600 flex items-center justify-center mb-6">
                <FiCheck size={30} />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                Check your email
              </h1>
              <p className="mt-3 text-gray-500 leading-relaxed">
                If <span className="font-semibold text-gray-700">{sentTo}</span>{" "}
                belongs to a CampusMart account, we've sent a password reset
                link. It is valid for {expiresIn} minutes.
              </p>
              <p className="mt-3 text-xs text-gray-400 leading-relaxed">
                Can't find it? Check your spam or junk folder.
              </p>

              <div className="mt-8 flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setSuccess(false);
                    setError("");
                  }}
                  className="w-full h-13 py-3.5 rounded-xl border border-gray-200 text-gray-700 font-bold text-sm flex items-center justify-center gap-2 hover:bg-gray-50 transition"
                >
                  <FiMail size={16} />
                  Try another email
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="w-full h-13 py-3.5 rounded-xl bg-green-600 text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-green-700 transition shadow-lg shadow-green-600/10"
                >
                  <FiArrowLeft size={16} />
                  Back to Login
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="w-16 h-16 mx-auto rounded-full bg-green-100 text-green-600 flex items-center justify-center mb-6">
                <FiShield size={28} />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                Forgot your password?
              </h1>
              <p className="mt-3 text-gray-500 leading-relaxed">
                Enter the email you used to create your CampusMart account and
                we'll send you a secure link to choose a new password.
              </p>

              <form
                onSubmit={handleSubmit}
                noValidate
                className="mt-8 text-left"
              >
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Registered email address
                </label>

                <div className="relative">
                  <FiMail
                    size={19}
                    className={`absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none ${
                      error ? "text-red-500" : "text-gray-400"
                    }`}
                  />

                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={email}
                    onChange={handleEmailChange}
                    placeholder="Enter your registered email"
                    autoComplete="email"
                    disabled={loading}
                    aria-invalid={Boolean(error)}
                    aria-describedby={error ? "email-error" : undefined}
                    className={`w-full pl-11 pr-4 py-3 rounded-xl border text-sm text-gray-800 bg-gray-50 outline-none transition duration-200 focus:ring-2 ${
                      error
                        ? "border-red-300 focus:ring-red-100"
                        : "border-gray-200 focus:ring-green-100"
                    }`}
                  />
                </div>

                {error && (
                  <div
                    id="email-error"
                    role="alert"
                    className="mt-2.5 flex items-start gap-2 rounded-lg px-3 py-2.5 bg-red-50 border border-red-100"
                  >
                    <FiAlertCircle
                      size={15}
                      className="mt-0.5 shrink-0 text-red-600"
                    />
                    <p className="text-xs leading-5 font-medium text-red-600">
                      {error}
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-6 w-full py-3.5 rounded-xl bg-green-600 text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-green-700 transition shadow-lg shadow-green-600/10 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <span className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      Sending reset link...
                    </>
                  ) : (
                    <>
                      Send Reset Link
                      <FiArrowRight size={17} />
                    </>
                  )}
                </button>
              </form>

              <button
                type="button"
                onClick={() => navigate("/login")}
                disabled={loading}
                className="mt-3 w-full py-3.5 rounded-xl border border-gray-200 text-gray-700 font-bold text-sm flex items-center justify-center gap-2 hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiArrowLeft size={16} />
                Back to Login
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

export default ForgotPassword;