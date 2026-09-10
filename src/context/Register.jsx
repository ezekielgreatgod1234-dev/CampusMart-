import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

import {
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  sendEmailVerification,
} from "firebase/auth";

import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";

import {
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

// =========================================================
// WELCOME NOTIFICATION (background only)
// =========================================================
async function sendWelcomeNotification(userId, userEmail, fullName) {
  if (!userId) return;

  let title = "Welcome to CampusMart 👋";
  let body =
    "Thanks for joining CampusMart! Browse products, chat sellers, and enjoy secure campus shopping.";
  let enabled = true;

  try {
    const welcomeSnap = await getDoc(doc(db, "settings", "welcomeMessage"));
    if (welcomeSnap.exists()) {
      const w = welcomeSnap.data() || {};
      if (w.enabled === false) enabled = false;
      if (w.title) title = String(w.title);
      if (w.body) body = String(w.body);
    }
  } catch (err) {
    console.warn("Could not load welcome settings:", err);
  }

  if (!enabled) return;

  const name = (fullName || "").trim().split(/\s+/)[0] || "there";
  const personalizedBody = body.includes("{name}")
    ? body.replace(/\{name\}/g, name)
    : body;

  try {
    await setDoc(
      doc(db, "userNotifications", `${userId}_welcome`),
      {
        userId,
        email: userEmail || "",
        title,
        body: personalizedBody,
        type: "welcome",
        read: false,
        createdAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn("Could not create welcome notification:", err);
  }
}

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

  const [agreeToTerms, setAgreeToTerms] = useState(false);
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

  const selectRole = (role) => {
    setFormData((current) => ({
      ...current,
      role,
    }));
    setError("");
  };

  const handleTermsChange = (e) => {
    setAgreeToTerms(e.target.checked);
    setError("");
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

    if (!agreeToTerms) {
      setError(
        "Please agree to the CampusMart Terms & Conditions and Privacy Policy before creating your account."
      );
      return;
    }

    try {
      setLoading(true);
      console.log("1. Creating auth user...");

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;
      console.log("2. Auth user created:", user.uid);

      await updateProfile(user, {
        displayName: fullName,
      });
      console.log("3. Profile name updated");

      // Required Firestore write
      await setDoc(doc(db, "users", user.uid), {
        id: user.uid,
        fullName,
        email,
        phone: "",
        campus: "",
        address: "",
        bio: "",
        profileImage: null,
        role,
        isSeller: role === "seller",
        isVerifiedSeller: false,
        emailVerified: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        termsAccepted: true,
        termsAcceptedAt: serverTimestamp(),
      });
      console.log("4. users doc saved");

      // Public profile – do not block registration
      setDoc(
        doc(db, "publicProfiles", user.uid),
        {
          fullName,
          displayName: fullName,
          email,
          role,
          isSeller: role === "seller",
          isVerifiedSeller: false,
          profileImage: null,
          bio: "",
          campus: "",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      ).catch((err) => console.warn("publicProfiles:", err));

      // =====================================================
      // Firebase verification email (NOT Brevo)
      // Longer timeout so Firebase has time to send
      // =====================================================
      let verificationSent = false;
      let verificationError = "";

      try {
        console.log("5. Sending verification email...");
        await Promise.race([
          sendEmailVerification(user, {
            url: `${window.location.origin}/login`,
            handleCodeInApp: false,
          }),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("verify-timeout")), 30000)
          ),
        ]);
        verificationSent = true;
        console.log("6. Verification email sent");
      } catch (err) {
        console.warn("Verification email failed:", err);
        verificationError =
          err?.message === "verify-timeout"
            ? "Verification email timed out. You can resend it after login."
            : "Verification email could not be sent. You can resend it after login.";
      }

      console.log("7. Signing out...");
      await signOut(auth);
      console.log("8. Navigating to success");

      navigate("/registration-success", {
        replace: true,
        state: {
          registeredEmail: email,
          verificationSent,
          verificationError,
        },
      });

      // Background only – NEVER await these
      sendWelcomeNotification(user.uid, email, fullName).catch(() => {});
      fetch("https://campusbackend-1.onrender.com/send-welcome-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, fullName }),
      }).catch(() => {});
    } catch (err) {
      console.error("Registration error:", err);
      setError(getFirebaseErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page min-h-screen bg-[#f7faf8] flex">
      {/* LEFT SIDE */}
      <div className="hidden lg:flex lg:w-[46%] xl:w-[48%] bg-[#073b2f] text-white relative overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-green-500/10" />
        <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full bg-green-400/10" />

        <div className="relative z-10 w-full flex flex-col justify-between p-12 xl:p-16">
          <Link to="/" className="inline-flex items-center gap-3 w-fit group">
            <div className="w-12 h-12 rounded-xl bg-green-500 text-white flex items-center justify-center text-lg font-black tracking-tight shadow-[0_8px_20px_rgba(34,197,94,0.25)] transition group-hover:scale-105">
              CM
            </div>
            <div>
              <div className="text-2xl font-black">
                Campus
                <span className="text-green-400">Mart</span>
              </div>
              <p className="text-xs text-green-100/70">Your Campus Marketplace</p>
            </div>
          </Link>

          <div className="max-w-lg">
            <div className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-white/10 border border-white/10 text-sm text-green-100">
              <FiShield size={15} />
              Safe campus marketplace
            </div>

            <h1 className="mt-7 text-5xl xl:text-6xl font-black leading-[1.05] tracking-tight">
              Everything you need,
              <span className="block text-green-400">right on campus.</span>
            </h1>

            <p className="mt-6 text-lg leading-8 text-green-50/70 max-w-md">
              Buy affordable items from fellow students or turn things you no
              longer need into cash.
            </p>

            <div className="mt-10 space-y-5">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center">
                  <FiShoppingCart className="text-green-400" size={21} />
                </div>
                <div>
                  <p className="font-bold">Find great deals</p>
                  <p className="text-sm text-green-100/60">
                    Shop directly from students around you.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center">
                  <FiTag className="text-green-400" size={21} />
                </div>
                <div>
                  <p className="font-bold">Sell your items</p>
                  <p className="text-sm text-green-100/60">
                    List your unused items and reach buyers.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center">
                  <FiShield className="text-green-400" size={21} />
                </div>
                <div>
                  <p className="font-bold">Campus focused</p>
                  <p className="text-sm text-green-100/60">
                    Connect with people in your student community.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <p className="text-sm text-green-100/50">
            © 2026 CampusMart. Built for students.
          </p>
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="flex-1 min-h-screen flex items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-[500px]">
          <div className="mb-8">
            <Link to="/" className="inline-flex items-center gap-3 group">
              <div className="w-14 h-14 rounded-2xl bg-green-600 text-white flex items-center justify-center text-xl font-black tracking-tight shadow-[0_8px_20px_rgba(22,163,74,0.25)] ring-4 ring-green-100 transition group-hover:scale-105">
                CM
              </div>
              <div>
                <div className="text-2xl font-black text-gray-900 tracking-tight">
                  Campus
                  <span className="text-green-600">Mart</span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  Your Campus Marketplace
                </p>
              </div>
            </Link>
          </div>

          <div className="mb-7">
            <p className="text-sm font-bold text-green-600">GET STARTED</p>
            <h2 className="mt-2 text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
              Create your account
            </h2>
            <p className="mt-3 text-gray-500">
              Join CampusMart and start buying or selling on campus.
            </p>
          </div>

          {error && (
            <div className="mb-5 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
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
                  disabled={loading}
                  className="w-full h-13 rounded-xl border border-gray-200 bg-white pl-11 pr-4 text-sm outline-none focus:border-green-500 focus:ring-4 focus:ring-green-50 transition disabled:opacity-60"
                />
              </div>
            </div>

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
                  disabled={loading}
                  className="w-full h-13 rounded-xl border border-gray-200 bg-white pl-11 pr-4 text-sm outline-none focus:border-green-500 focus:ring-4 focus:ring-green-50 transition disabled:opacity-60"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3">
                What do you want to do?
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  disabled={loading}
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
                  <p className="mt-3 font-bold text-sm text-gray-900">Buyer</p>
                  <p className="mt-1 text-xs leading-5 text-gray-500">
                    I want to find and buy products.
                  </p>
                </button>

                <button
                  type="button"
                  disabled={loading}
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
                  <p className="mt-3 font-bold text-sm text-gray-900">Seller</p>
                  <p className="mt-1 text-xs leading-5 text-gray-500">
                    I want to list and sell products.
                  </p>
                </button>
              </div>
            </div>

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
                  disabled={loading}
                  className="w-full h-13 rounded-xl border border-gray-200 bg-white pl-11 pr-12 text-sm outline-none focus:border-green-500 focus:ring-4 focus:ring-green-50 transition disabled:opacity-60"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((c) => !c)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <FiEye size={18} /> : <FiEyeOff size={18} />}
                </button>
              </div>
            </div>

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
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Repeat your password"
                  autoComplete="new-password"
                  disabled={loading}
                  className="w-full h-13 rounded-xl border border-gray-200 bg-white pl-11 pr-12 text-sm outline-none focus:border-green-500 focus:ring-4 focus:ring-green-50 transition disabled:opacity-60"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((c) => !c)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                  aria-label={
                    showConfirmPassword ? "Hide password" : "Show password"
                  }
                >
                  {showConfirmPassword ? (
                    <FiEye size={18} />
                  ) : (
                    <FiEyeOff size={18} />
                  )}
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreeToTerms}
                  onChange={handleTermsChange}
                  disabled={loading}
                  className="mt-1 h-4 w-4 shrink-0 accent-green-600 cursor-pointer"
                />
                <span className="text-sm leading-6 text-gray-600">
                  I agree to the{" "}
                  <Link
                    to="/terms-and-conditions"
                    className="font-bold text-green-600 hover:text-green-700 hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Terms & Conditions
                  </Link>{" "}
                  and{" "}
                  <Link
                    to="/privacy-policy"
                    className="font-bold text-green-600 hover:text-green-700 hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Privacy Policy
                  </Link>{" "}
                  of CampusMart.
                </span>
              </label>
            </div>

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