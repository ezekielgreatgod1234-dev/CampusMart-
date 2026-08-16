import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

import {
  signInWithEmailAndPassword,
} from "firebase/auth";

import {
  FiShoppingBag,
  FiMail,
  FiLock,
  FiEye,
  FiEyeOff,
  FiArrowRight,
} from "react-icons/fi";

import { auth } from "./firebase";

// =========================================================
// LOGIN
// =========================================================

function Login() {
  const navigate = useNavigate();

  // =======================================================
  // STATE
  // =======================================================

  const [showPassword, setShowPassword] =
    useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");

  const [loading, setLoading] = useState(false);

  // =======================================================
  // HANDLE CHANGE
  // =======================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));

    setError("");
  };

  // =======================================================
  // FIREBASE ERROR MESSAGE
  // =======================================================

  const getFirebaseErrorMessage = (error) => {
    switch (error.code) {
      case "auth/invalid-email":
        return "Please enter a valid email address.";

      case "auth/user-not-found":
        return "No account was found with this email.";

      case "auth/wrong-password":
        return "Incorrect email or password.";

      case "auth/invalid-credential":
        return "Incorrect email or password.";

      case "auth/user-disabled":
        return "This account has been disabled.";

      case "auth/too-many-requests":
        return "Too many login attempts. Please try again later.";

      case "auth/network-request-failed":
        return "Network error. Please check your internet connection.";

      default:
        return "Unable to log in. Please try again.";
    }
  };

  // =======================================================
  // SUBMIT
  // =======================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    // =====================================================
    // VALIDATION
    // =====================================================

    const email = formData.email.trim();

    const password = formData.password;

    if (!email || !password) {
      setError(
        "Please enter your email and password."
      );

      return;
    }

    try {
      setLoading(true);

      // ===================================================
      // FIREBASE LOGIN
      // ===================================================

      await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      // ===================================================
      // FIREBASE AUTH STATE WILL UPDATE
      // ===================================================

      navigate("/dashboard", {
        replace: true,
      });
    } catch (error) {
      console.error(
        "Login error:",
        error
      );

      setError(
        getFirebaseErrorMessage(error)
      );
    } finally {
      setLoading(false);
    }
  };

  // =======================================================
  // UI
  // =======================================================

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-5 py-10">

      <div className="w-full max-w-md">

        {/* =================================================
            LOGO
        ================================================= */}

        <div className="text-center mb-8">

          <Link
            to="/"
            className="inline-flex items-center gap-3"
          >

            <div
              className="
                w-12
                h-12
                rounded-xl
                bg-green-600
                text-white
                flex
                items-center
                justify-center
                shadow-sm
              "
            >
              <FiShoppingBag size={24} />
            </div>

            <div className="text-left">

              <div className="text-2xl font-bold">

                Campus
                <span className="text-green-600">
                  Mart
                </span>

              </div>

              <div className="text-xs text-gray-500">
                Your Campus Marketplace
              </div>

            </div>

          </Link>

        </div>

        {/* =================================================
            CARD
        ================================================= */}

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

          {/* =================================================
              HEADER
          ================================================= */}

          <div className="text-center">

            <h1 className="text-2xl font-bold text-gray-900">
              Welcome back
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              Log in to your CampusMart account
            </p>

          </div>

          {/* =================================================
              ERROR
          ================================================= */}

          {error && (
            <div
              className="
                mt-6
                rounded-xl
                bg-red-50
                border
                border-red-100
                px-4
                py-3
                text-sm
                text-red-600
              "
            >
              {error}
            </div>
          )}

          {/* =================================================
              FORM
          ================================================= */}

          <form
            onSubmit={handleSubmit}
            className="mt-7 space-y-5"
          >

            {/* EMAIL */}

            <div>

              <label
                htmlFor="email"
                className="
                  block
                  text-sm
                  font-semibold
                  text-gray-700
                  mb-2
                "
              >
                Email address
              </label>

              <div className="relative">

                <FiMail
                  className="
                    absolute
                    left-4
                    top-1/2
                    -translate-y-1/2
                    text-gray-400
                  "
                  size={18}
                />

                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  autoComplete="email"
                  className="
                    w-full
                    h-12
                    rounded-xl
                    border
                    border-gray-200
                    pl-11
                    pr-4
                    text-sm
                    outline-none
                    focus:border-green-500
                    focus:ring-2
                    focus:ring-green-100
                    transition
                  "
                />

              </div>

            </div>

            {/* PASSWORD */}

            <div>

              <label
                htmlFor="password"
                className="
                  block
                  text-sm
                  font-semibold
                  text-gray-700
                  mb-2
                "
              >
                Password
              </label>

              <div className="relative">

                <FiLock
                  className="
                    absolute
                    left-4
                    top-1/2
                    -translate-y-1/2
                    text-gray-400
                  "
                  size={18}
                />

                <input
                  id="password"
                  name="password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className="
                    w-full
                    h-12
                    rounded-xl
                    border
                    border-gray-200
                    pl-11
                    pr-12
                    text-sm
                    outline-none
                    focus:border-green-500
                    focus:ring-2
                    focus:ring-green-100
                    transition
                  "
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      (current) => !current
                    )
                  }
                  className="
                    absolute
                    right-4
                    top-1/2
                    -translate-y-1/2
                    text-gray-400
                    hover:text-gray-600
                  "
                >
                  {showPassword ? (
                    <FiEyeOff size={18} />
                  ) : (
                    <FiEye size={18} />
                  )}
                </button>

              </div>

            </div>

            {/* =================================================
                SUBMIT
            ================================================= */}

            <button
              type="submit"
              disabled={loading}
              className="
                w-full
                h-12
                rounded-xl
                bg-green-600
                text-white
                font-semibold
                text-sm
                flex
                items-center
                justify-center
                gap-2
                hover:bg-green-700
                transition
                shadow-sm
                disabled:opacity-60
                disabled:cursor-not-allowed
              "
            >

              {loading ? (
                <>
                  <span
                    className="
                      w-5
                      h-5
                      rounded-full
                      border-2
                      border-white/30
                      border-t-white
                      animate-spin
                    "
                  />

                  Logging in...
                </>
              ) : (
                <>
                  Log in
                  <FiArrowRight size={18} />
                </>
              )}

            </button>

          </form>

          {/* =================================================
              REGISTER
          ================================================= */}

          <div className="mt-7 text-center">

            <p className="text-sm text-gray-500">

              Don't have an account?{" "}

              <Link
                to="/register"
                className="
                  font-semibold
                  text-green-600
                  hover:text-green-700
                "
              >
                Create account
              </Link>

            </p>

          </div>

        </div>

        {/* =================================================
            BACK
        ================================================= */}

        <div className="text-center mt-6">

          <Link
            to="/"
            className="
              text-sm
              text-gray-500
              hover:text-green-600
            "
          >
            ← Back to CampusMart
          </Link>

        </div>

      </div>

    </div>
  );
}

export default Login;