
import { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";

import {
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";

import { doc, getDoc } from "firebase/firestore";

import {
  FiMail,
  FiLock,
  FiEye,
  FiEyeOff,
  FiArrowRight,
  FiShield,
  FiShoppingCart,
  FiTag,
  FiCheck,
} from "react-icons/fi";

import { auth, db } from "./firebase";

const ADMIN_EMAIL = "campusmart1234@gmail.com";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    email: location.state?.registeredEmail || "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));

    setError("");
  };

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    const email = formData.email.trim().toLowerCase();
    const password = formData.password;

    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);

      // =====================================================
      // FIREBASE LOGIN
      // =====================================================

      const userCredential =
        await signInWithEmailAndPassword(
          auth,
          email,
          password
        );

      const user = userCredential.user;

      const userEmail =
        (user.email || "").toLowerCase();

      // =====================================================
      // GET USER DOCUMENT
      // =====================================================

      let userData = null;

      try {
        const userRef = doc(
          db,
          "users",
          user.uid
        );

        const userSnap =
          await getDoc(userRef);

        if (userSnap.exists()) {
          userData = userSnap.data();
        }
      } catch (firestoreError) {
        console.error(
          "Could not check account status:",
          firestoreError
        );
      }

      // =====================================================
      // ACCOUNT DISABLED CHECK
      // =====================================================
      //
      // Admin should set:
      //
      // accountStatus: "disabled"
      //
      // inside:
      //
      // users/{user.uid}
      //
      // =====================================================

      const accountStatus = String(
        userData?.accountStatus || "active"
      )
        .trim()
        .toLowerCase();

      if (accountStatus === "disabled") {
        // Sign the user out immediately so they cannot
        // continue using the application.

        await signOut(auth);

        navigate("/account-disabled", {
          replace: true,
        });

        return;
      }

      // =====================================================
      // ADMIN CHECK
      // =====================================================

      if (
        userEmail ===
        ADMIN_EMAIL.toLowerCase()
      ) {
        navigate("/admin-dashboard", {
          replace: true,
        });

        return;
      }

      // =====================================================
      // FIRESTORE ADMIN ROLE CHECK
      // =====================================================

      if (userData?.role === "admin") {
        navigate("/admin-dashboard", {
          replace: true,
        });

        return;
      }

      // =====================================================
      // NORMAL BUYER / SELLER
      // =====================================================

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

  return (
    <div className="auth-page min-h-screen bg-[#f7faf8] flex">

      {/* =====================================================
          LEFT BRAND PANEL
      ====================================================== */}

      <div className="hidden lg:flex lg:w-[46%] xl:w-[48%] bg-[#073b2f] text-white relative overflow-hidden">

        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-green-500/10" />

        <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full bg-green-400/10" />

        <div className="relative z-10 w-full flex flex-col justify-between p-12 xl:p-16">

          <Link
            to="/"
            className="inline-flex items-center gap-3 w-fit group"
          >

            <div className="w-12 h-12 rounded-xl bg-green-500 text-white flex items-center justify-center text-lg font-black tracking-tight shadow-[0_8px_20px_rgba(34,197,94,0.25)] transition group-hover:scale-105">
              CM
            </div>

            <div>

              <div className="text-2xl font-black">
                Campus
                <span className="text-green-400">
                  Mart
                </span>
              </div>

              <p className="text-xs text-green-100/70">
                Your Campus Marketplace
              </p>

            </div>

          </Link>

          <div className="max-w-lg">

            <div className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-white/10 border border-white/10 text-sm text-green-100">

              <FiShield size={15} />

              Welcome back

            </div>

            <h1 className="mt-7 text-5xl xl:text-6xl font-black leading-[1.05] tracking-tight">

              Your campus.

              <span className="block text-green-400">
                Your marketplace.
              </span>

            </h1>

            <p className="mt-6 text-lg leading-8 text-green-50/70 max-w-md">

              Sign in to discover products, connect with students, manage your
              listings and continue shopping.

            </p>

            <div className="mt-10 grid grid-cols-2 gap-4">

              <div className="rounded-2xl bg-white/10 border border-white/10 p-5">

                <FiShoppingCart
                  className="text-green-400"
                  size={23}
                />

                <p className="mt-4 font-bold">
                  Buy
                </p>

                <p className="mt-1 text-xs text-green-100/60 leading-5">
                  Find affordable products from students.
                </p>

              </div>

              <div className="rounded-2xl bg-white/10 border border-white/10 p-5">

                <FiTag
                  className="text-green-400"
                  size={23}
                />

                <p className="mt-4 font-bold">
                  Sell
                </p>

                <p className="mt-1 text-xs text-green-100/60 leading-5">
                  Turn your unused items into cash.
                </p>

              </div>

            </div>

            <div className="mt-6 flex items-center gap-3 text-sm text-green-100/70">

              <div className="w-7 h-7 rounded-full bg-green-500/20 flex items-center justify-center">

                <FiCheck
                  className="text-green-400"
                  size={15}
                />

              </div>

              Built specifically for students

            </div>

          </div>

          <p className="text-sm text-green-100/50">
            © 2026 CampusMart. Built for students.
          </p>

        </div>

      </div>

      {/* =====================================================
          LOGIN SIDE
      ====================================================== */}

      <div className="flex-1 min-h-screen flex items-center justify-center px-5 py-10 sm:px-8">

        <div className="w-full max-w-[500px]">

          <div className="mb-8">

            <Link
              to="/"
              className="inline-flex items-center gap-3 group"
            >

              <div className="w-14 h-14 rounded-2xl bg-green-600 text-white flex items-center justify-center text-xl font-black tracking-tight shadow-[0_8px_20px_rgba(22,163,74,0.25)] ring-4 ring-green-100 transition group-hover:scale-105">
                CM
              </div>

              <div>

                <div className="text-2xl font-black text-gray-900 tracking-tight">

                  Campus
                  <span className="text-green-600">
                    Mart
                  </span>

                </div>

                <p className="text-xs text-gray-500 mt-0.5">
                  Your Campus Marketplace
                </p>

              </div>

            </Link>

          </div>

          <div className="mb-7">

            <p className="text-sm font-bold text-green-600">
              WELCOME BACK
            </p>

            <h2 className="mt-2 text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
              Log in to CampusMart
            </h2>

            <p className="mt-3 text-gray-500">
              Access your account and continue where you left off.
            </p>

          </div>

          {error && (

            <div className="mb-5 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
              {error}
            </div>

          )}

          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >

            {/* EMAIL */}

            <div>

              <label
                htmlFor="email"
                className="block text-sm font-bold text-gray-700 mb-2"
              >
                Email address
              </label>

              <div className="relative">

                <FiMail
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="w-full h-13 rounded-xl border border-gray-200 bg-white pl-11 pr-4 text-sm outline-none focus:border-green-500 focus:ring-4 focus:ring-green-50 transition"
                />

              </div>

            </div>

            {/* PASSWORD */}

            <div>

              <div className="flex items-center justify-between mb-2">

                <label
                  htmlFor="password"
                  className="text-sm font-bold text-gray-700"
                >
                  Password
                </label>

                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      "/forgot-password"
                    )
                  }
                  className="text-sm font-medium text-green-600 hover:text-green-700 transition"
                >
                  Forgot Password?
                </button>

              </div>

              <div className="relative">

                <FiLock
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  id="password"
                  name="password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  value={
                    formData.password
                  }
                  onChange={handleChange}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className="w-full h-13 rounded-xl border border-gray-200 bg-white pl-11 pr-12 text-sm outline-none focus:border-green-500 focus:ring-4 focus:ring-green-50 transition"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      (current) =>
                        !current
                    )
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-green-600 transition"
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >

                  {showPassword ? (
                    <FiEye size={18} />
                  ) : (
                    <FiEyeOff size={18} />
                  )}

                </button>

              </div>

            </div>

            {/* LOGIN BUTTON */}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-13 rounded-xl bg-green-600 text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-green-700 active:bg-green-800 transition shadow-lg shadow-green-600/10 disabled:opacity-60 disabled:cursor-not-allowed"
            >

              {loading ? (
                <>
                  <span className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />

                  Logging in...
                </>
              ) : (
                <>
                  Log in

                  <FiArrowRight
                    size={18}
                  />
                </>
              )}

            </button>

          </form>

          <div className="flex items-center gap-4 my-7">

            <div className="h-px bg-gray-200 flex-1" />

            <span className="text-xs text-gray-400">
              NEW TO CAMPUSMART?
            </span>

            <div className="h-px bg-gray-200 flex-1" />

          </div>

          <Link
            to="/register"
            className="w-full h-12 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-sm font-bold text-gray-700 hover:border-green-300 hover:text-green-700 hover:bg-green-50 transition"
          >
            Create a new account
          </Link>

          <div className="mt-6 text-center">

            <Link
              to="/"
              className="text-sm text-gray-400 hover:text-green-600 transition"
            >
              ← Back to CampusMart
            </Link>

          </div>

        </div>

      </div>

    </div>
  );
}

export default Login;

