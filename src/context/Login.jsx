import { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";

import {
  signInWithEmailAndPassword,
  signOut,
  sendEmailVerification,
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
  FiUser,
  FiX,
} from "react-icons/fi";

import { auth, db } from "./firebase";

const ADMIN_EMAIL = "campusmart1234@gmail.com";
const SESSION_DURATION_MS = 60 * 60 * 1000;
const SESSION_KEY = "campusmart_session_expires_at";

const SAVED_ACCOUNTS_KEY = "campusmart_saved_accounts";

function loadSavedAccounts() {
  try {
    const raw = localStorage.getItem(SAVED_ACCOUNTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((a) => a && typeof a.email === "string" && a.email.includes("@"))
      .map((a) => ({
        email: String(a.email).trim().toLowerCase(),
        fullName: String(a.fullName || "").trim(),
        photoURL: a.photoURL || null,
        lastUsed: Number(a.lastUsed) || 0,
      }))
      .sort((a, b) => (b.lastUsed || 0) - (a.lastUsed || 0));
  } catch {
    return [];
  }
}

function saveAccountToDevice({ email, fullName, photoURL }) {
  const cleanEmail = String(email || "").trim().toLowerCase();
  if (!cleanEmail) return;

  const list = loadSavedAccounts().filter((a) => a.email !== cleanEmail);
  list.unshift({
    email: cleanEmail,
    fullName: String(fullName || "").trim(),
    photoURL: photoURL || null,
    lastUsed: Date.now(),
  });
  localStorage.setItem(SAVED_ACCOUNTS_KEY, JSON.stringify(list.slice(0, 8)));
}

function removeSavedAccount(email) {
  const clean = String(email || "").trim().toLowerCase();
  const list = loadSavedAccounts().filter((a) => a.email !== clean);
  localStorage.setItem(SAVED_ACCOUNTS_KEY, JSON.stringify(list));
  return list;
}


function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    email: location.state?.registeredEmail || "",
    password: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const [savedAccounts, setSavedAccounts] = useState([]);
  const [selectedSavedEmail, setSelectedSavedEmail] = useState("");
  const [showOtherAccount, setShowOtherAccount] = useState(false);

  useEffect(() => {
    const accounts = loadSavedAccounts();
    setSavedAccounts(accounts);

    if (location.state?.registeredEmail) {
      setShowOtherAccount(true);
      setFormData((current) => ({
        ...current,
        email: location.state.registeredEmail,
      }));
    } else if (accounts.length > 0) {
      setSelectedSavedEmail(accounts[0].email);
      setFormData((current) => ({
        ...current,
        email: accounts[0].email,
      }));
    } else {
      setShowOtherAccount(true);
    }
  }, []);

  useEffect(() => {
    if (location.state?.justRegistered) {
      setSuccess(
        "Account created! Please verify your email, then log in."
      );
    }
  }, [location.state]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((current) => ({ ...current, [name]: value }));
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

  const startSession = () => {
    const expiresAt = Date.now() + SESSION_DURATION_MS;
    localStorage.setItem(SESSION_KEY, String(expiresAt));
  };

  const forceSignOut = async () => {
    try {
      await signOut(auth);
    } catch (_) {
      // ignore
    }
    localStorage.removeItem(SESSION_KEY);
  };


  const selectSavedAccount = (account) => {
    setSelectedSavedEmail(account.email);
    setFormData((current) => ({
      ...current,
      email: account.email,
      password: "",
    }));
    setShowOtherAccount(false);
    setError("");
  };

  const handleUseAnotherAccount = () => {
    setSelectedSavedEmail("");
    setShowOtherAccount(true);
    setFormData({ email: "", password: "" });
    setError("");
  };

  const handleRemoveSavedAccount = (e, email) => {
    e.preventDefault();
    e.stopPropagation();
    const next = removeSavedAccount(email);
    setSavedAccounts(next);
    if (selectedSavedEmail === email) {
      if (next.length > 0) {
        selectSavedAccount(next[0]);
      } else {
        handleUseAnotherAccount();
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const email = formData.email.trim().toLowerCase();
    const password = formData.password;

    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);

      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      const user = userCredential.user;
      const userEmail = (user.email || "").toLowerCase();

      // Refresh so emailVerified is current
      await user.reload();

      // Block unverified emails (except super admin if you want)
      if (!user.emailVerified && userEmail !== ADMIN_EMAIL.toLowerCase()) {
        try {
          await sendEmailVerification(user, {
            url: `${window.location.origin}/login`,
            handleCodeInApp: false,
          });
        } catch (verifyErr) {
          console.warn("Resend verification failed:", verifyErr);
        }

        await forceSignOut();
        setError(
          "Please verify your email first. We sent a new verification link to your inbox."
        );
        return;
      }

      let userSnap = null;
      let userData = null;

      try {
        userSnap = await getDoc(doc(db, "users", user.uid));
        if (userSnap.exists()) {
          userData = userSnap.data() || {};
        }
      } catch (firestoreError) {
        console.error("Could not check account status:", firestoreError);
      }

      if (!userSnap || !userSnap.exists()) {
        await forceSignOut();
        navigate("/account-not-found", { replace: true });
        return;
      }

      const accountStatus = String(userData?.accountStatus || "active")
        .trim()
        .toLowerCase();

      if (accountStatus === "deleted" || userData?.deleted === true) {
        await forceSignOut();
        navigate("/account-not-found", { replace: true });
        return;
      }

      if (
        accountStatus === "disabled" ||
        accountStatus === "suspended"
      ) {
        await forceSignOut();
        navigate("/account-disabled", { replace: true });
        return;
      }

      startSession();

      const isHardcodedAdmin = userEmail === ADMIN_EMAIL.toLowerCase();
      const isAdmin =
        isHardcodedAdmin ||
        userData?.role === "admin" ||
        userData?.isAdmin === true ||
        (Array.isArray(userData?.roles) &&
          userData.roles.includes("admin"));

      if (isAdmin) {
        navigate("/choose-dashboard", {
          replace: true,
          state: { userData },
        });
        return;
      }

      const role = String(userData?.role || "").trim().toLowerCase();

      if (role === "seller") {
        navigate("/seller-dashboard", { replace: true });
        return;
      }

      navigate("/dashboard", { replace: true });
    } catch (error) {
      console.error("Login error:", error);
      setError(getFirebaseErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page min-h-screen bg-[#f7faf8] flex">
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
              Welcome back
            </div>

            <h1 className="mt-7 text-5xl xl:text-6xl font-black leading-[1.05] tracking-tight">
              Your campus.
              <span className="block text-green-400">Your marketplace.</span>
            </h1>

            <p className="mt-6 text-lg leading-8 text-green-50/70 max-w-md">
              Sign in to discover products, connect with students, manage your
              listings and continue shopping.
            </p>

            <div className="mt-10 grid grid-cols-2 gap-4">
              <div className="rounded-2xl bg-white/10 border border-white/10 p-5">
                <FiShoppingCart className="text-green-400" size={23} />
                <p className="mt-4 font-bold">Buy</p>
                <p className="mt-1 text-xs text-green-100/60 leading-5">
                  Find affordable products from students.
                </p>
              </div>

              <div className="rounded-2xl bg-white/10 border border-white/10 p-5">
                <FiTag className="text-green-400" size={23} />
                <p className="mt-4 font-bold">Sell</p>
                <p className="mt-1 text-xs text-green-100/60 leading-5">
                  Turn your unused items into cash.
                </p>
              </div>
            </div>
          </div>

          <p className="text-sm text-green-100/50">
            © 2026 CampusMart. Built for students.
          </p>
        </div>
      </div>

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
            <p className="text-sm font-bold text-green-600">WELCOME BACK</p>
            <h2 className="mt-2 text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
              Log in to CampusMart
            </h2>
            <p className="mt-3 text-gray-500">
              Access your account and continue where you left off.
            </p>
          </div>

          {success && (
            <div className="mb-5 rounded-xl bg-green-50 border border-green-200 px-4 py-3.5 text-sm text-green-800 flex items-start gap-3 shadow-sm">
              <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center shrink-0">
                <FiCheck size={16} />
              </div>
              <div>
                <p className="font-bold">Almost there!</p>
                <p className="mt-0.5 text-green-700">{success}</p>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-5 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Saved accounts on this device */}
            {savedAccounts.length > 0 && !showOtherAccount && (
              <div className="space-y-3">
                <p className="text-sm font-bold text-gray-700">
                  Choose an account
                </p>
                <div className="space-y-2">
                  {savedAccounts.map((account) => {
                    const selected =
                      selectedSavedEmail === account.email;
                    const initial = (
                      account.fullName ||
                      account.email ||
                      "U"
                    )
                      .charAt(0)
                      .toUpperCase();

                    return (
                      <button
                        key={account.email}
                        type="button"
                        onClick={() => selectSavedAccount(account)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition ${
                          selected
                            ? "border-green-500 bg-green-50 ring-2 ring-green-100"
                            : "border-gray-200 bg-white hover:border-green-200 hover:bg-green-50/40"
                        }`}
                      >
                        {account.photoURL ? (
                          <img
                            src={account.photoURL}
                            alt=""
                            className="w-11 h-11 rounded-full object-cover border border-green-100"
                          />
                        ) : (
                          <div className="w-11 h-11 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold text-sm">
                            {initial}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-900 truncate">
                            {account.fullName || "CampusMart user"}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {account.email}
                          </p>
                        </div>
                        <button
                          type="button"
                          title="Remove from this device"
                          onClick={(e) =>
                            handleRemoveSavedAccount(e, account.email)
                          }
                          className="w-8 h-8 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 flex items-center justify-center shrink-0"
                        >
                          <FiX size={16} />
                        </button>
                      </button>
                    );
                  })}
                </div>
                <button
                  type="button"
                  onClick={handleUseAnotherAccount}
                  className="w-full h-11 rounded-xl border border-dashed border-gray-300 text-sm font-semibold text-gray-600 hover:border-green-400 hover:text-green-700 hover:bg-green-50 transition"
                >
                  Use another account
                </button>
              </div>
            )}

            {/* Email field — hidden when picking a saved account */}
            {(showOtherAccount || savedAccounts.length === 0) && (
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
                    autoComplete="username"
                    className="w-full h-13 rounded-xl border border-gray-200 bg-white pl-11 pr-4 text-sm outline-none focus:border-green-500 focus:ring-4 focus:ring-green-50 transition"
                  />
                </div>
                {savedAccounts.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowOtherAccount(false);
                      if (savedAccounts[0]) {
                        selectSavedAccount(savedAccounts[0]);
                      }
                    }}
                    className="mt-2 text-xs font-semibold text-green-700 hover:text-green-800"
                  >
                    ← Back to saved accounts
                  </button>
                )}
              </div>
            )}

            {/* Show which account is selected when using saved list */}
            {savedAccounts.length > 0 &&
              !showOtherAccount &&
              selectedSavedEmail && (
                <p className="text-xs text-gray-500 -mt-1">
                  Signing in as{" "}
                  <span className="font-semibold text-gray-700">
                    {selectedSavedEmail}
                  </span>
                </p>
              )}

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
                  onClick={() => navigate("/forgot-password")}
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
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className="w-full h-13 rounded-xl border border-gray-200 bg-white pl-11 pr-12 text-sm outline-none focus:border-green-500 focus:ring-4 focus:ring-green-50 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((c) => !c)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-green-600 transition"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <FiEye size={18} /> : <FiEyeOff size={18} />}
                </button>
              </div>
            </div>

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
                  <FiArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="flex items-center gap-4 my-7">
            <div className="h-px bg-gray-200 flex-1" />
            <span className="text-xs text-gray-400">NEW TO CAMPUSMART?</span>
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