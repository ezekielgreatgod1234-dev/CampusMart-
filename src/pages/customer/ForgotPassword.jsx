import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../../context/firebase";
import { useNavigate } from "react-router-dom";

function ForgotPassword() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess(false);

    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setError("Please enter your email address.");
      return;
    }

    try {
      setLoading(true);

      await sendPasswordResetEmail(
        auth,
        trimmedEmail
      );

      setSuccess(true);
      setEmail("");
    } catch (error) {
      console.error(
        "Password reset error:",
        error
      );

      switch (error.code) {
        case "auth/invalid-email":
          setError(
            "Please enter a valid email address."
          );
          break;

        case "auth/user-not-found":
          setError(
            "No account was found with this email address."
          );
          break;

        case "auth/too-many-requests":
          setError(
            "Too many requests. Please wait a little and try again."
          );
          break;

        case "auth/network-request-failed":
          setError(
            "Network error. Please check your internet connection and try again."
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

  return (
    <div
      className="
        min-h-screen
        flex
        items-center
        justify-center
        bg-gray-50
        px-4
        py-8
      "
    >
      <div className="w-full max-w-md">

        {/* CARD */}

        <div
          className="
            bg-white
            rounded-2xl
            border
            border-gray-100
            shadow-sm
            p-6
            sm:p-8
          "
        >

          {/* ICON */}

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

          {/* HEADER */}

          <div className="text-center mt-5">

            <h1
              className="
                text-xl
                sm:text-2xl
                font-bold
                text-gray-900
              "
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
            >
              No worries. Enter the email address
              associated with your CampusMart account
              and we'll send you a link to reset your
              password.
            </p>

          </div>

          {/* SUCCESS */}

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
                >
                  Check your email for the password
                  reset link. Don't forget to check
                  your spam or junk folder.
                </p>
              </div>
            </div>
          )}

          {/* ERROR */}

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
              >
                {error}
              </p>
            </div>
          )}

          {/* FORM */}

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
                >
                  Email Address
                </label>

                <div className="relative">

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

                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError("");
                    }}
                    placeholder="Enter your email address"
                    autoComplete="email"
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
                    "
                  />

                </div>
              </div>

              {/* SUBMIT */}

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

                    Sending reset link...
                  </>
                ) : (
                  <>
                    Send Reset Link

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

          {/* BACK TO LOGIN */}

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

          {/* FOOTER */}

          <p
            className="
              mt-6
              text-center
              text-xs
              text-gray-400
            "
          >
            CampusMart &mdash; Your Campus Marketplace
          </p>

        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;