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
} from "react-icons/fi";

import { auth, db } from "./firebase";

// =========================================================
// REGISTER
// =========================================================

function Register() {
  const navigate = useNavigate();

  // =======================================================
  // STATE
  // =======================================================

  const [showPassword, setShowPassword] =
    useState(false);

  const [
    showConfirmPassword,
    setShowConfirmPassword,
  ] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

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
  // FIREBASE ERROR
  // =======================================================

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

  // =======================================================
  // SUBMIT
  // =======================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    setSuccess("");

    // =====================================================
    // CLEAN DATA
    // =====================================================

    const fullName = formData.fullName.trim();

    const email = formData.email
      .trim()
      .toLowerCase();

    const password = formData.password;

    const confirmPassword =
      formData.confirmPassword;

    // =====================================================
    // VALIDATION
    // =====================================================

    if (
      !fullName ||
      !email ||
      !password ||
      !confirmPassword
    ) {
      setError(
        "Please fill in all fields."
      );

      return;
    }

    if (fullName.length < 2) {
      setError(
        "Please enter your full name."
      );

      return;
    }

    if (password.length < 6) {
      setError(
        "Password must be at least 6 characters long."
      );

      return;
    }

    if (
      password !== confirmPassword
    ) {
      setError(
        "Passwords do not match."
      );

      return;
    }

    // =====================================================
    // CREATE FIREBASE ACCOUNT
    // =====================================================

    try {
      setLoading(true);

      const userCredential =
        await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );

      const user =
        userCredential.user;

      // ===================================================
      // SET FIREBASE DISPLAY NAME
      // ===================================================

      await updateProfile(user, {
        displayName: fullName,
      });

      // ===================================================
      // CREATE FIRESTORE USER PROFILE
      // ===================================================

      await setDoc(
        doc(db, "users", user.uid),
        {
          id: user.uid,

          fullName,

          email,

          phone: "",

          campus: "",

          address: "",

          profileImage: null,

          role: "buyer",

          createdAt:
            serverTimestamp(),

          updatedAt:
            serverTimestamp(),
        }
      );

      // ===================================================
      // REGISTRATION SUCCESS
      // ===================================================

      setSuccess(
        "Account created successfully. Redirecting to login..."
      );

      // ===================================================
      // IMPORTANT
      //
      // Firebase automatically logs the user in
      // immediately after createUserWithEmailAndPassword.
      //
      // You specifically want:
      //
      // Register → Login → Dashboard
      //
      // So we sign them out here before going to login.
      // ===================================================

      await signOut(auth);

      // ===================================================
      // GO TO LOGIN
      // ===================================================

      setTimeout(() => {
        navigate("/login", {
          replace: true,
        });
      }, 700);

    } catch (error) {
      console.error(
        "Registration error:",
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
              Create your account
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              Join the CampusMart community
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
              SUCCESS
          ================================================= */}

          {success && (
            <div
              className="
                mt-6
                rounded-xl
                bg-green-50
                border
                border-green-100
                px-4
                py-3
                text-sm
                text-green-700
              "
            >
              {success}
            </div>
          )}

          {/* =================================================
              FORM
          ================================================= */}

          <form
            onSubmit={handleSubmit}
            className="mt-7 space-y-5"
          >

            {/* FULL NAME */}

            <div>

              <label
                htmlFor="fullName"
                className="
                  block
                  text-sm
                  font-semibold
                  text-gray-700
                  mb-2
                "
              >
                Full name
              </label>

              <div className="relative">

                <FiUser
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
                  id="fullName"
                  name="fullName"
                  type="text"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  autoComplete="name"
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
                  placeholder="Create a password"
                  autoComplete="new-password"
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

            {/* CONFIRM PASSWORD */}

            <div>

              <label
                htmlFor="confirmPassword"
                className="
                  block
                  text-sm
                  font-semibold
                  text-gray-700
                  mb-2
                "
              >
                Confirm password
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
                  id="confirmPassword"
                  name="confirmPassword"
                  type={
                    showConfirmPassword
                      ? "text"
                      : "password"
                  }
                  value={
                    formData.confirmPassword
                  }
                  onChange={handleChange}
                  placeholder="Confirm your password"
                  autoComplete="new-password"
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
                    setShowConfirmPassword(
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
                  {showConfirmPassword ? (
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

          {/* =================================================
              LOGIN LINK
          ================================================= */}

          <div className="mt-7 text-center">

            <p className="text-sm text-gray-500">

              Already have an account?{" "}

              <Link
                to="/login"
                className="
                  font-semibold
                  text-green-600
                  hover:text-green-700
                "
              >
                Log in
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

export default Register;