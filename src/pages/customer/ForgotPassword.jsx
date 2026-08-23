import { useState } from "react";

import { sendPasswordResetEmail } from "firebase/auth";

import { useNavigate } from "react-router-dom";

import {
  FiArrowLeft,
  FiArrowRight,
  FiCheck,
  FiMail,
  FiRefreshCw,
  FiShield,
  FiAlertCircle,
} from "react-icons/fi";

import { auth } from "../../context/firebase";

function ForgotPassword() {
  const navigate = useNavigate();

  // =========================================================
  // STATE
  // =========================================================

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  // =========================================================
  // HANDLE EMAIL CHANGE
  // =========================================================

  const handleEmailChange = (e) => {
    setEmail(e.target.value);

    // Clear validation/error as soon as the user starts typing
    if (error) {
      setError("");
    }

    setSuccess(false);
  };

  // =========================================================
  // HANDLE SUBMIT
  // =========================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess(false);

    const trimmedEmail = email.trim().toLowerCase();

    // =======================================================
    // EMPTY EMAIL
    // =======================================================

    if (!trimmedEmail) {
      setError("Please enter your email address.");
      return;
    }

    // =======================================================
    // EMAIL VALIDATION
    // =======================================================

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(trimmedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    // =======================================================
    // INTERNET CHECK
    // =======================================================

    if (!navigator.onLine) {
      setError(
        "Internet connection is required to reset your password. Please connect to the internet and try again."
      );

      return;
    }

    // =======================================================
    // SEND PASSWORD RESET
    // =======================================================

    try {
      setLoading(true);

      await sendPasswordResetEmail(auth, trimmedEmail);

      // =====================================================
      // SUCCESS
      // =====================================================

      setSuccess(true);
      setEmail("");
    } catch (error) {
      console.error("Password reset error:", error);

      // =====================================================
      // FIREBASE ERRORS
      // =====================================================

      switch (error.code) {
        case "auth/invalid-email":
          setError("Please enter a valid email address.");
          break;

        case "auth/user-not-found":
          setError(
            "No CampusMart account was found with this email address."
          );
          break;

        case "auth/user-disabled":
          setError(
            "This CampusMart account has been disabled. Please contact CampusMart support."
          );
          break;

        case "auth/too-many-requests":
          setError(
            "Too many password reset requests have been made. Please wait a little and try again."
          );
          break;

        case "auth/network-request-failed":
          setError(
            "Network error. Please check your internet connection and try again."
          );
          break;

        case "auth/operation-not-allowed":
          setError(
            "Password reset is not enabled for CampusMart accounts."
          );
          break;

        default:
          setError(
            "Unable to send the password reset email. Please check the email address and try again."
          );
          break;
      }
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // RETURN
  // =========================================================

  return (
    <div
      className="
        forgot-password-page
        min-h-screen
        w-full
        flex
        items-center
        justify-center
        bg-gray-50
        text-gray-900
        px-4
        py-8
      "
      style={{
        backgroundColor: "#f9fafb",
        color: "#111827",
        colorScheme: "light",
      }}
    >
      <div className="w-full max-w-md">

        {/* =================================================
            CARD
        ================================================= */}

        <div
          className="
            w-full
            bg-white
            rounded-2xl
            border
            border-gray-100
            shadow-sm
            p-6
            sm:p-8
          "
          style={{
            backgroundColor: "#ffffff",
            color: "#111827",
            colorScheme: "light",
          }}
        >

          {/* =================================================
              ICON
          ================================================= */}

          <div className="flex justify-center">
            <div
              className="
                w-16
                h-16
                rounded-2xl
                flex
                items-center
                justify-center
              "
              style={{
                backgroundColor: "#f0fdf4",
                color: "#16a34a",
              }}
            >
              <FiShield size={30} />
            </div>
          </div>

          {/* =================================================
              HEADER
          ================================================= */}

          <div className="text-center mt-5">
            <h1
              className="
                text-xl
                sm:text-2xl
                font-bold
              "
              style={{
                color: "#111827",
              }}
            >
              Forgot your password?
            </h1>

            <p
              className="
                mt-2
                text-sm
                leading-6
              "
              style={{
                color: "#6b7280",
              }}
            >
              Enter the email address you used
              to create your CampusMart account
              and we'll send you a secure password
              reset link.
            </p>
          </div>

          {/* =================================================
              SUCCESS MESSAGE
          ================================================= */}

          {success && (
            <div
              className="
                mt-6
                rounded-xl
                border
                p-4
                flex
                items-start
                gap-3
              "
              style={{
                backgroundColor: "#f0fdf4",
                borderColor: "#dcfce7",
              }}
            >
              <div
                className="
                  w-8
                  h-8
                  rounded-full
                  flex
                  items-center
                  justify-center
                  shrink-0
                "
                style={{
                  backgroundColor: "#dcfce7",
                  color: "#16a34a",
                }}
              >
                <FiCheck size={17} />
              </div>

              <div>
                <p
                  className="
                    text-sm
                    font-semibold
                  "
                  style={{
                    color: "#15803d",
                  }}
                >
                  Reset email sent
                </p>

                <p
                  className="
                    mt-1
                    text-xs
                    leading-5
                  "
                  style={{
                    color: "#16a34a",
                  }}
                >
                  If this email belongs to a
                  CampusMart account, a password
                  reset link has been sent. Check
                  your inbox and spam or junk folder.
                </p>
              </div>
            </div>
          )}

          {/* =================================================
              FORM
          ================================================= */}

          {!success && (
            <form
              onSubmit={handleSubmit}
              className="mt-6"
            >

              {/* =================================================
                  EMAIL
              ================================================= */}

              <div>
                <label
                  htmlFor="email"
                  className="
                    block
                    text-sm
                    font-medium
                    mb-2
                  "
                  style={{
                    color: "#374151",
                  }}
                >
                  Registered Email Address
                </label>

                <div className="relative">
                  <FiMail
                    size={19}
                    className="
                      absolute
                      left-3
                      top-1/2
                      -translate-y-1/2
                      pointer-events-none
                    "
                    style={{
                      color: error ? "#ef4444" : "#9ca3af",
                    }}
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
                    required
                    aria-invalid={Boolean(error)}
                    className="
                      w-full
                      pl-11
                      pr-4
                      py-3
                      rounded-xl
                      border
                      text-sm
                      outline-none
                      transition
                      duration-200
                      focus:ring-2
                    "
                    style={{
                      backgroundColor: "#f9fafb",
                      color: "#1f2937",
                      borderColor: error ? "#fca5a5" : "#e5e7eb",
                      colorScheme: "light",
                      "--tw-ring-color": error
                        ? "rgba(239,68,68,0.10)"
                        : "rgba(22,163,74,0.10)",
                    }}
                  />
                </div>

                {/* =================================================
                    STYLED EMAIL ERROR
                ================================================= */}

                {error ? (
                  <div
                    className="
                      mt-2.5
                      flex
                      items-start
                      gap-2
                      rounded-lg
                      px-3
                      py-2.5
                    "
                    style={{
                      backgroundColor: "#fef2f2",
                      border: "1px solid #fee2e2",
                    }}
                  >
                    <FiAlertCircle
                      size={15}
                      className="mt-0.5 shrink-0"
                      style={{
                        color: "#dc2626",
                      }}
                    />

                    <p
                      className="
                        text-xs
                        leading-5
                        font-medium
                      "
                      style={{
                        color: "#dc2626",
                      }}
                    >
                      {error}
                    </p>
                  </div>
                ) : (
                  <p
                    className="
                      mt-2
                      text-xs
                    "
                    style={{
                      color: "#9ca3af",
                    }}
                  >
                    Use the same email address you
                    used when creating your CampusMart
                    account.
                  </p>
                )}
              </div>

              {/* =================================================
                  SUBMIT BUTTON
              ================================================= */}

              <button
                type="submit"
                disabled={loading}
                className="
                  mt-5
                  w-full
                  flex
                  items-center
                  justify-center
                  gap-2
                  px-5
                  py-3
                  rounded-xl
                  text-white
                  text-sm
                  font-semibold
                  transition
                  duration-200
                  disabled:opacity-70
                  disabled:cursor-not-allowed
                  hover:shadow-md
                  active:scale-[0.99]
                "
                style={{
                  backgroundColor: loading
                    ? "#4ade80"
                    : "#16a34a",
                  color: "#ffffff",
                  colorScheme: "light",
                  appearance: "none",
                }}
              >
                {loading ? (
                  <>
                    <FiRefreshCw
                      size={17}
                      className="animate-spin"
                    />

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
          )}

          {/* =================================================
              TRY ANOTHER EMAIL
          ================================================= */}

          {success && (
            <button
              type="button"
              onClick={() => {
                setSuccess(false);
                setError("");
              }}
              className="
                mt-5
                w-full
                flex
                items-center
                justify-center
                gap-2
                px-5
                py-3
                rounded-xl
                text-sm
                font-semibold
                transition
                hover:bg-green-100
              "
              style={{
                backgroundColor: "#f0fdf4",
                color: "#15803d",
                border: "1px solid #dcfce7",
                colorScheme: "light",
              }}
            >
              <FiMail size={16} />

              Try another email
            </button>
          )}

          {/* =================================================
              BACK TO LOGIN
          ================================================= */}

          <button
            type="button"
            onClick={() => navigate("/login")}
            disabled={loading}
            className="
              mt-5
              w-full
              flex
              items-center
              justify-center
              gap-2
              px-5
              py-3
              rounded-xl
              border
              text-sm
              font-medium
              transition
              hover:bg-gray-50
              disabled:opacity-50
              disabled:cursor-not-allowed
            "
            style={{
              backgroundColor: "#ffffff",
              color: "#374151",
              borderColor: "#e5e7eb",
              colorScheme: "light",
            }}
          >
            <FiArrowLeft size={16} />

            Back to Login
          </button>

          {/* =================================================
              FOOTER
          ================================================= */}

          <p
            className="
              mt-6
              text-center
              text-xs
            "
            style={{
              color: "#9ca3af",
            }}
          >
            CampusMart &mdash; Your Campus Marketplace
          </p>

        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;