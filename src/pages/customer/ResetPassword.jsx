import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  FiLock,
  FiCheckCircle,
  FiAlertCircle,
  FiEye,
  FiEyeOff,
} from "react-icons/fi";

// Backend base URL (same server that exposes /verify-email)
const API_BASE_URL = String(
  import.meta.env?.VITE_API_URL ||
    import.meta.env?.VITE_BACKEND_URL ||
    "http://localhost:5000"
).replace(/\/+$/, "");

const MIN_PASSWORD_LENGTH = 6;

function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [status, setStatus] = useState("idle"); // idle | loading | done | error
  const [fieldError, setFieldError] = useState("");
  const [message, setMessage] = useState("");

  const uid = params.get("uid") || "";
  const token = params.get("token") || "";
  const linkLooksValid = Boolean(uid && token);

  // The link is only used when the button is pressed (not on page load),
  // so email link scanners cannot use it up before the person does.
  const handleReset = async (e) => {
    e?.preventDefault();

    if (!linkLooksValid || status === "loading") return;

    setFieldError("");

    if (password.length < MIN_PASSWORD_LENGTH) {
      setFieldError(
        `Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`
      );
      return;
    }

    if (password !== confirm) {
      setFieldError("The two passwords do not match.");
      return;
    }

    setStatus("loading");
    setMessage("");

    try {
      const response = await fetch(`${API_BASE_URL}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid, token, password }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.success) {
        // A weak-password answer is a form problem, not a dead link:
        // keep the form open so they can fix it.
        if (data.reason === "weak_password") {
          setFieldError(
            data.error ||
              `Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`
          );
          setStatus("idle");
          return;
        }

        throw new Error(
          data.error || "Could not reset your password. Please try again."
        );
      }

      setPassword("");
      setConfirm("");
      setStatus("done");
    } catch (err) {
      setMessage(
        err?.message === "Failed to fetch"
          ? "Network error. Please check your internet connection and try again."
          : err?.message || "Could not reset your password. Please try again."
      );
      setStatus("error");
    }
  };

  const inputClass = (hasError) =>
    `w-full pl-11 pr-12 py-3 rounded-xl border text-sm text-gray-800 bg-gray-50 outline-none transition duration-200 focus:ring-2 ${
      hasError
        ? "border-red-300 focus:ring-red-100"
        : "border-gray-200 focus:ring-green-100"
    }`;

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
          {status === "done" ? (
            <>
              <div className="w-16 h-16 mx-auto rounded-full bg-green-100 text-green-600 flex items-center justify-center mb-6">
                <FiCheckCircle size={30} />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                Password updated
              </h1>
              <p className="mt-3 text-gray-500 leading-relaxed">
                Your password has been changed. You can log in with your new
                password now.
              </p>
              <button
                type="button"
                onClick={() => navigate("/login", { replace: true })}
                className="mt-8 w-full py-3.5 rounded-xl bg-green-600 text-white font-bold text-sm hover:bg-green-700 transition shadow-lg shadow-green-600/10"
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
                Could not reset password
              </h1>
              <p className="mt-3 text-gray-500 leading-relaxed">
                {linkLooksValid
                  ? message
                  : "This reset link is not valid. Request a new one to continue."}
              </p>
              <div className="mt-8 flex flex-col gap-3">
                {linkLooksValid && (
                  <button
                    type="button"
                    onClick={() => setStatus("idle")}
                    className="w-full py-3.5 rounded-xl bg-green-600 text-white font-bold text-sm hover:bg-green-700 transition"
                  >
                    Try again
                  </button>
                )}
                <button
                  type="button"
                  onClick={() =>
                    navigate("/forgot-password", { replace: true })
                  }
                  className="w-full py-3.5 rounded-xl border border-gray-200 text-gray-700 font-bold text-sm hover:bg-gray-50 transition"
                >
                  Get a new reset link
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="w-16 h-16 mx-auto rounded-full bg-green-100 text-green-600 flex items-center justify-center mb-6">
                <FiLock size={28} />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                Choose a new password
              </h1>
              <p className="mt-3 text-gray-500 leading-relaxed">
                Enter a new password for your CampusMart account.
              </p>

              <form onSubmit={handleReset} noValidate className="mt-8 text-left">
                <label
                  htmlFor="new-password"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  New password
                </label>
                <div className="relative">
                  <FiLock
                    size={19}
                    className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400"
                  />
                  <input
                    id="new-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (fieldError) setFieldError("");
                    }}
                    placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
                    autoComplete="new-password"
                    disabled={status === "loading"}
                    className={inputClass(Boolean(fieldError))}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((c) => !c)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                  >
                    {showPassword ? <FiEye size={18} /> : <FiEyeOff size={18} />}
                  </button>
                </div>

                <label
                  htmlFor="confirm-password"
                  className="block text-sm font-medium text-gray-700 mb-2 mt-4"
                >
                  Confirm new password
                </label>
                <div className="relative">
                  <FiLock
                    size={19}
                    className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400"
                  />
                  <input
                    id="confirm-password"
                    type={showConfirm ? "text" : "password"}
                    value={confirm}
                    onChange={(e) => {
                      setConfirm(e.target.value);
                      if (fieldError) setFieldError("");
                    }}
                    placeholder="Re-enter your new password"
                    autoComplete="new-password"
                    disabled={status === "loading"}
                    className={inputClass(Boolean(fieldError))}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((c) => !c)}
                    aria-label={showConfirm ? "Hide password" : "Show password"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                  >
                    {showConfirm ? <FiEye size={18} /> : <FiEyeOff size={18} />}
                  </button>
                </div>

                {fieldError && (
                  <div
                    role="alert"
                    className="mt-3 flex items-start gap-2 rounded-lg px-3 py-2.5 bg-red-50 border border-red-100"
                  >
                    <FiAlertCircle
                      size={15}
                      className="mt-0.5 shrink-0 text-red-600"
                    />
                    <p className="text-xs leading-5 font-medium text-red-600">
                      {fieldError}
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="mt-6 w-full py-3.5 rounded-xl bg-green-600 text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-green-700 transition shadow-lg shadow-green-600/10 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {status === "loading" ? (
                    <>
                      <span className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Reset password"
                  )}
                </button>
              </form>
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

export default ResetPassword;