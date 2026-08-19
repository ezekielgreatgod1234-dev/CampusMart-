import { useState } from "react";

import {
  sendPasswordResetEmail,
} from "firebase/auth";

import {
  collection,
  getDocs,
  query,
  where,
  limit,
} from "firebase/firestore";

import {
  auth,
  db,
} from "../../context/firebase";

import {
  useNavigate,
} from "react-router-dom";

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
    // BASIC EMAIL VALIDATION
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

    try {
      setLoading(true);

      // =====================================================
      // CHECK REGISTERED CAMPUSMART EMAIL
      // =====================================================

      const usersRef = collection(db, "users");

      const emailQuery = query(
        usersRef,
        where("email", "==", trimmedEmail),
        limit(1)
      );

      const userSnapshot = await getDocs(emailQuery);

      // =====================================================
      // EMAIL NOT REGISTERED
      // =====================================================

      if (userSnapshot.empty) {
        setError(
          "No CampusMart account was found with this email address."
        );

        return;
      }

      // =====================================================
      // REGISTERED EMAIL
      // SEND PASSWORD RESET
      // =====================================================

      await sendPasswordResetEmail(auth, trimmedEmail);

      // =====================================================
      // SUCCESS
      // =====================================================

      setSuccess(true);
      setEmail("");
    } catch (error) {
      console.error("Password reset error:", error);

      switch (error.code) {
        case "auth/invalid-email":
          setError("Please enter a valid email address.");
          break;

        case "auth/user-not-found":
          setError(
            "No CampusMart account was found with this email address."
          );
          break;

        case "auth/too-many-requests":
          setError(
            "Too many reset requests have been made. Please wait a little and try again."
          );
          break;

        case "auth/network-request-failed":
          setError(
            "Network error. Please check your internet connection and try again."
          );
          break;

        case "permission-denied":
          setError(
            "Unable to verify your account right now. Please try again."
          );
          break;

        default:
          setError(
            "Unable to send the password reset email. Please try again."
          );
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
                bg-green-50
                text-green-600
                flex
                items-center
                justify-center
              "
              style={{
                backgroundColor: "#f0fdf4",
                color: "#16a34a",
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-8 h-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.8}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                />

                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5.5 21a6.5 6.5 0 0113 0"
                />

                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 8v5"
                />

                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21.5 10.5L19 13l-2.5-2.5"
                />
              </svg>
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
                text-gray-900
              "
              style={{ color: "#111827" }}
            >
              Forgot your password?
            </h1>

            <p
              className="
                mt-2
                text-sm
                leading-6
                text-gray-500
              "
              style={{ color: "#6b7280" }}
            >
              Enter the email address registered
              with your CampusMart account and
              we'll send you a link to reset your
              password.
            </p>
          </div>

          {/* =================================================
              SUCCESS
          ================================================= */}

          {success && (
            <div
              className="
                mt-6
                rounded-xl
                border
                border-green-100
                bg-green-50
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
                  bg-green-100
                  text-green-600
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
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>

              <div>
                <p
                  className="
                    text-sm
                    font-semibold
                    text-green-700
                  "
                  style={{ color: "#15803d" }}
                >
                  Reset email sent
                </p>

                <p
                  className="
                    mt-1
                    text-xs
                    leading-5
                    text-green-600
                  "
                  style={{ color: "#16a34a" }}
                >
                  We found your CampusMart account
                  and sent a password reset link to
                  your email. Check your inbox and
                  spam or junk folder.
                </p>
              </div>
            </div>
          )}

          {/* =================================================
              ERROR
          ================================================= */}

          {error && (
            <div
              className="
                mt-6
                rounded-xl
                border
                border-red-100
                bg-red-50
                p-4
                flex
                items-start
                gap-3
              "
              style={{
                backgroundColor: "#fef2f2",
                borderColor: "#fee2e2",
              }}
            >
              <div
                className="
                  w-8
                  h-8
                  rounded-full
                  bg-red-100
                  text-red-500
                  flex
                  items-center
                  justify-center
                  shrink-0
                "
                style={{
                  backgroundColor: "#fee2e2",
                  color: "#ef4444",
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v3m0 4h.01"
                  />

                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                  />
                </svg>
              </div>

              <p
                className="
                  text-sm
                  leading-5
                  text-red-600
                "
                style={{ color: "#dc2626" }}
              >
                {error}
              </p>
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

              {/* EMAIL */}

              <div>
                <label
                  htmlFor="email"
                  className="
                    block
                    text-sm
                    font-medium
                    text-gray-700
                    mb-2
                  "
                  style={{ color: "#374151" }}
                >
                  Registered Email Address
                </label>

                <div className="relative">

                  {/* EMAIL ICON */}

                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="
                      absolute
                      left-3
                      top-1/2
                      -translate-y-1/2
                      w-5
                      h-5
                      text-gray-400
                    "
                    style={{ color: "#9ca3af" }}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.8}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 8l9 6 9-6"
                    />

                    <rect
                      x="3"
                      y="5"
                      width="18"
                      height="14"
                      rx="2"
                    />
                  </svg>

                  {/* EMAIL INPUT */}

                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError("");
                      setSuccess(false);
                    }}
                    placeholder="Enter your registered email"
                    autoComplete="email"
                    disabled={loading}
                    className="
                      w-full
                      pl-11
                      pr-4
                      py-3
                      rounded-xl
                      border
                      border-gray-200
                      bg-gray-50
                      text-sm
                      text-gray-800
                      placeholder:text-gray-400
                      outline-none
                      focus:bg-white
                      focus:border-green-500
                      focus:ring-2
                      focus:ring-green-100
                      transition
                      disabled:opacity-60
                    "
                    style={{
                      backgroundColor: "#f9fafb",
                      color: "#1f2937",
                      borderColor: "#e5e7eb",
                      colorScheme: "light",
                    }}
                  />
                </div>

                <p
                  className="
                    mt-2
                    text-xs
                    text-gray-400
                  "
                  style={{ color: "#9ca3af" }}
                >
                  Only an email already registered
                  with CampusMart can be used.
                </p>
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
                  bg-green-600
                  hover:bg-green-700
                  active:bg-green-800
                  text-white
                  text-sm
                  font-semibold
                  transition
                  duration-200
                  disabled:opacity-70
                  disabled:cursor-not-allowed
                "
                style={{
                  colorScheme: "light",
                }}
              >
                {loading ? (
                  <>
                    <svg
                      className="
                        w-4
                        h-4
                        animate-spin
                      "
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />

                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>

                    Checking account...
                  </>
                ) : (
                  <>
                    Verify & Send Reset Link

                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 12h14"
                      />

                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M13 6l6 6-6 6"
                      />
                    </svg>
                  </>
                )}
              </button>
            </form>
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
              border-gray-200
              bg-white
              text-gray-700
              text-sm
              font-medium
              hover:bg-gray-50
              hover:border-gray-300
              transition
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
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 12H5"
              />

              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M11 18l-6-6 6-6"
              />
            </svg>

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
              text-gray-400
            "
            style={{ color: "#9ca3af" }}
          >
            CampusMart &mdash; Your Campus Marketplace
          </p>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;