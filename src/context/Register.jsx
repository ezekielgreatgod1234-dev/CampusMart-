import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

import {
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
} from "firebase/auth";

import {
  doc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

import {
  FiShoppingBag,
  FiUser,
  FiMail,
  FiLock,
  FiEye,
  FiEyeOff,
  FiArrowRight,
  FiCheck,
  FiTag,
  FiShoppingCart,
  FiShield,
} from "react-icons/fi";

import { auth, db } from "./firebase";

function Register() {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "buyer",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  };

  const selectRole = (role) => {
    setFormData((current) => ({
      ...current,
      role,
    }));

    setError("");
    setSuccess("");
  };

  const getFirebaseErrorMessage = (error) => {
    switch (error.code) {
      case "auth/email-already-in-use":
        return "An account with this email already exists. Please log in instead.";

      case "auth/invalid-email":
        return "Please enter a valid email address.";

      case "auth/weak-password":
        return "Password must be at least 6 characters long.";

      case "auth/network-request-failed":
        return "Network error. Please check your internet connection.";

      case "auth/operation-not-allowed":
        return "Email and password accounts are not enabled in Firebase.";

      default:
        return "Unable to create your account. Please try again.";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    const fullName = formData.fullName.trim();
    const email = formData.email.trim().toLowerCase();
    const password = formData.password;
    const confirmPassword = formData.confirmPassword;
    const role = formData.role;

    if (!fullName || !email || !password || !confirmPassword) {
      setError("Please fill in all required fields.");
      return;
    }

    if (fullName.length < 2) {
      setError("Please enter your full name.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!["buyer", "seller"].includes(role)) {
      setError("Please select whether you want to buy or sell.");
      return;
    }

    try {
      setLoading(true);

      const userCredential =
        await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );

      const user = userCredential.user;

      await updateProfile(user, {
        displayName: fullName,
      });

      await setDoc(doc(db, "users", user.uid), {
        id: user.uid,
        fullName,
        email,
        phone: "",
        campus: "",
        address: "",
        profileImage: null,
        role,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setSuccess(
        "Account created successfully. Taking you to login..."
      );

      await signOut(auth);

      setTimeout(() => {
        navigate("/login", {
          replace: true,
          state: {
            registeredEmail: email,
          },
        });
      }, 1000);
    } catch (error) {
      console.error("Registration error:", error);
      setError(getFirebaseErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page min-h-screen bg-[#f7faf8] flex">

      {/* =====================================================
          LEFT SIDE - BRAND
      ====================================================== */}

      <div className="hidden lg:flex lg:w-[46%] xl:w-[48%] bg-[#073b2f] text-white relative overflow-hidden">

        {/* Decorative circles */}

        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-green-500/10" />

        <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full bg-green-400/10" />

        <div className="relative z-10 w-full flex flex-col justify-between p-12 xl:p-16">

          {/* Logo */}

          <Link
            to="/"
            className="inline-flex items-center gap-3 w-fit"
          >
            <div className="w-12 h-12 rounded-xl bg-green-500 flex items-center justify-center shadow-lg">
              <FiShoppingBag size={24} />
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

          {/* Main content */}

          <div className="max-w-lg">

            <div className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-white/10 border border-white/10 text-sm text-green-100">
              <FiShield size={15} />
              Safe campus marketplace
            </div>

            <h1 className="mt-7 text-5xl xl:text-6xl font-black leading-[1.05] tracking-tight">
              Everything you need,
              <span className="block text-green-400">
                right on campus.
              </span>
            </h1>

            <p className="mt-6 text-lg leading-8 text-green-50/70 max-w-md">
              Buy affordable items from fellow students or
              turn things you no longer need into cash.
            </p>

            <div className="mt-10 space-y-5">

              {/* Find deals */}

              <div className="flex items-center gap-4">

                <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center">
                  <FiShoppingCart
                    className="text-green-400"
                    size={21}
                  />
                </div>

                <div>
                  <p className="font-bold">
                    Find great deals
                  </p>

                  <p className="text-sm text-green-100/60">
                    Shop directly from students around you.
                  </p>
                </div>

              </div>

              {/* Sell */}

              <div className="flex items-center gap-4">

                <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center">
                  <FiTag
                    className="text-green-400"
                    size={21}
                  />
                </div>

                <div>
                  <p className="font-bold">
                    Sell your items
                  </p>

                  <p className="text-sm text-green-100/60">
                    List your unused items and reach buyers.
                  </p>
                </div>

              </div>

              {/* Campus focused */}

              <div className="flex items-center gap-4">

                <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center">
                  <FiShield
                    className="text-green-400"
                    size={21}
                  />
                </div>

                <div>
                  <p className="font-bold">
                    Campus focused
                  </p>

                  <p className="text-sm text-green-100/60">
                    Connect with people in your student
                    community.
                  </p>
                </div>

              </div>

            </div>

          </div>

          {/* Bottom */}

          <p className="text-sm text-green-100/50">
            © 2026 CampusMart. Built for students.
          </p>

        </div>
      </div>

      {/* =====================================================
          RIGHT SIDE
      ====================================================== */}

      <div className="flex-1 min-h-screen flex items-center justify-center px-5 py-10 sm:px-8">

        <div className="w-full max-w-[500px]">

          {/* Mobile logo */}

          <div className="lg:hidden text-center mb-8">

            <Link
              to="/"
              className="inline-flex items-center gap-3"
            >

              <div className="w-11 h-11 rounded-xl bg-green-600 text-white flex items-center justify-center">
                <FiShoppingBag size={22} />
              </div>

              <div className="text-left">

                <div className="text-2xl font-black text-gray-900">
                  Campus
                  <span className="text-green-600">
                    Mart
                  </span>
                </div>

                <p className="text-xs text-gray-500">
                  Your Campus Marketplace
                </p>

              </div>

            </Link>

          </div>

          {/* Heading */}

          <div className="mb-7">

            <p className="text-sm font-bold text-green-600">
              GET STARTED
            </p>

            <h2 className="mt-2 text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
              Create your account
            </h2>

            <p className="mt-3 text-gray-500">
              Join CampusMart and start buying or selling
              on campus.
            </p>

          </div>

          {/* Error */}

          {error && (
            <div className="mb-5 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Success */}

          {success && (
            <div className="mb-5 rounded-xl bg-green-50 border border-green-100 px-4 py-3 text-sm text-green-700 flex items-start gap-3">

              <FiCheck
                className="mt-0.5 shrink-0"
                size={18}
              />

              <span>{success}</span>

            </div>
          )}

          {/* Form */}

          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >

            {/* Full name */}

            <div>

              <label
                htmlFor="fullName"
                className="block text-sm font-bold text-gray-700 mb-2"
              >
                Full name
              </label>

              <div className="relative">

                <FiUser
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="e.g. John Doe"
                  autoComplete="name"
                  className="w-full h-13 rounded-xl border border-gray-200 bg-white pl-11 pr-4 text-sm outline-none focus:border-green-500 focus:ring-4 focus:ring-green-50 transition"
                />

              </div>

            </div>

            {/* Email */}

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

            {/* Role */}

            <div>

              <label className="block text-sm font-bold text-gray-700 mb-3">
                What do you want to do?
              </label>

              <div className="grid grid-cols-2 gap-3">

                {/* Buyer */}

                <button
                  type="button"
                  onClick={() => selectRole("buyer")}
                  className={`relative text-left rounded-xl border-2 p-4 transition ${
                    formData.role === "buyer"
                      ? "border-green-500 bg-green-50"
                      : "border-gray-200 bg-white hover:border-green-200"
                  }`}
                >

                  {formData.role === "buyer" && (
                    <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-green-600 text-white flex items-center justify-center">
                      <FiCheck size={12} />
                    </div>
                  )}

                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      formData.role === "buyer"
                        ? "bg-green-600 text-white"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    <FiShoppingCart size={19} />
                  </div>

                  <p className="mt-3 font-bold text-sm text-gray-900">
                    Buyer
                  </p>

                  <p className="mt-1 text-xs leading-5 text-gray-500">
                    I want to find and buy products.
                  </p>

                </button>

                {/* Seller */}

                <button
                  type="button"
                  onClick={() => selectRole("seller")}
                  className={`relative text-left rounded-xl border-2 p-4 transition ${
                    formData.role === "seller"
                      ? "border-green-500 bg-green-50"
                      : "border-gray-200 bg-white hover:border-green-200"
                  }`}
                >

                  {formData.role === "seller" && (
                    <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-green-600 text-white flex items-center justify-center">
                      <FiCheck size={12} />
                    </div>
                  )}

                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      formData.role === "seller"
                        ? "bg-green-600 text-white"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    <FiTag size={19} />
                  </div>

                  <p className="mt-3 font-bold text-sm text-gray-900">
                    Seller
                  </p>

                  <p className="mt-1 text-xs leading-5 text-gray-500">
                    I want to list and sell products.
                  </p>

                </button>

              </div>

            </div>

            {/* Password */}

            <div>

              <label
                htmlFor="password"
                className="block text-sm font-bold text-gray-700 mb-2"
              >
                Password
              </label>

              <div className="relative">

                <FiLock
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="At least 6 characters"
                  autoComplete="new-password"
                  className="w-full h-13 rounded-xl border border-gray-200 bg-white pl-11 pr-12 text-sm outline-none focus:border-green-500 focus:ring-4 focus:ring-green-50 transition"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      (current) => !current
                    )
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >
                  {showPassword ? (
                    <FiEyeOff size={18} />
                  ) : (
                    <FiEye size={18} />
                  )}
                </button>

              </div>

            </div>

            {/* Confirm password */}

            <div>

              <label
                htmlFor="confirmPassword"
                className="block text-sm font-bold text-gray-700 mb-2"
              >
                Confirm password
              </label>

              <div className="relative">

                <FiLock
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={
                    showConfirmPassword
                      ? "text"
                      : "password"
                  }
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Repeat your password"
                  autoComplete="new-password"
                  className="w-full h-13 rounded-xl border border-gray-200 bg-white pl-11 pr-12 text-sm outline-none focus:border-green-500 focus:ring-4 focus:ring-green-50 transition"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword(
                      (current) => !current
                    )
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                  aria-label={
                    showConfirmPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >
                  {showConfirmPassword ? (
                    <FiEyeOff size={18} />
                  ) : (
                    <FiEye size={18} />
                  )}
                </button>

              </div>

            </div>

            {/* Submit */}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-13 rounded-xl bg-green-600 text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-green-700 active:bg-green-800 transition shadow-lg shadow-green-600/10 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <span className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  Create account
                  <FiArrowRight size={18} />
                </>
              )}
            </button>

          </form>

          {/* Login */}

          <div className="mt-7 text-center">

            <p className="text-sm text-gray-500">
              Already have an account?{" "}

              <Link
                to="/login"
                className="font-bold text-green-600 hover:text-green-700"
              >
                Log in
              </Link>
            </p>

          </div>

          {/* Back */}

          <div className="mt-5 text-center">

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

export default Register;