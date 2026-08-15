import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  FiMail,
  FiLock,
  FiEye,
  FiEyeOff,
  FiArrowRight,
  FiPlus,
  FiLogIn,
  FiCheck,
} from "react-icons/fi";

function Login() {
  const navigate = useNavigate();

  /* =========================================================
     LOAD SAVED ACCOUNT
     =========================================================
     
     We load the account directly when useState initializes.
     
     This avoids:
     
     setSavedAccount(...)
     
     inside useEffect, which was causing your React warning.
  ========================================================= */

  const [savedAccount] = useState(() => {
    try {
      const savedProfile =
        localStorage.getItem("campusmart_profile");

      if (!savedProfile) {
        return null;
      }

      const profile = JSON.parse(savedProfile);

      if (!profile || typeof profile !== "object") {
        return null;
      }

      return {
        fullName:
          profile.fullName || "CampusMart User",

        email:
          profile.email || "user@example.com",

        profileImage:
          profile.profileImage || null,
      };
    } catch (error) {
      console.error(
        "Could not load saved account:",
        error
      );

      return null;
    }
  });

  /* =========================================================
     SELECTED ACCOUNT
  ========================================================= */

  const [selectedAccount, setSelectedAccount] =
    useState(null);

  /* =========================================================
     MANUAL LOGIN MODE
  ========================================================= */

  const [usingAnotherAccount, setUsingAnotherAccount] =
    useState(false);

  /* =========================================================
     EMAIL
  ========================================================= */

  const [email, setEmail] = useState("");

  /* =========================================================
     PASSWORD
  ========================================================= */

  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  /* =========================================================
     ERROR
  ========================================================= */

  const [error, setError] = useState("");

  /* =========================================================
     LOGIN LOADING
  ========================================================= */

  const [loggingIn, setLoggingIn] =
    useState(false);

  /* =========================================================
     SELECT SAVED ACCOUNT
  ========================================================= */

  const handleSelectAccount = () => {
    if (!savedAccount) return;

    setSelectedAccount(savedAccount);

    setUsingAnotherAccount(false);

    setEmail(savedAccount.email || "");

    setPassword("");

    setError("");

    setShowPassword(false);
  };

  /* =========================================================
     USE ANOTHER ACCOUNT
  ========================================================= */

  const handleAnotherAccount = () => {
    setSelectedAccount(null);

    setUsingAnotherAccount(true);

    setEmail("");

    setPassword("");

    setError("");

    setShowPassword(false);
  };

  /* =========================================================
     BACK TO ACCOUNTS
  ========================================================= */

  const handleBackToAccounts = () => {
    setSelectedAccount(null);

    setUsingAnotherAccount(false);

    setEmail("");

    setPassword("");

    setError("");

    setShowPassword(false);
  };

  /* =========================================================
     LOGIN
  ========================================================= */

  const handleLogin = () => {
    setError("");

    const loginEmail =
      selectedAccount?.email ||
      email.trim();

    /* =====================================================
       EMAIL VALIDATION
    ===================================================== */

    if (!loginEmail) {
      setError(
        "Please enter your email address."
      );
      return;
    }

    /* =====================================================
       PASSWORD VALIDATION
    ===================================================== */

    if (!password.trim()) {
      setError(
        "Please enter your password."
      );
      return;
    }

    setLoggingIn(true);

    setTimeout(() => {
      /*
        This is currently a frontend/demo login.

        When your backend authentication is ready,
        replace this section with your real API request.
      */

      const accountToLogin =
        selectedAccount || {
          fullName:
            loginEmail
              .split("@")[0]
              .trim() || "CampusMart User",

          email: loginEmail,

          profileImage: null,
        };

      /* =====================================================
         SAVE LOGIN SESSION
      ===================================================== */

      localStorage.setItem(
        "campusmart_auth",
        "true"
      );

      localStorage.setItem(
        "campusmart_user",
        JSON.stringify(accountToLogin)
      );

      localStorage.setItem(
        "campusmart_token",
        "campusmart-demo-token"
      );

      /* =====================================================
         SAVE ACCOUNT FOR FUTURE LOGINS
      ===================================================== */

      localStorage.setItem(
        "campusmart_profile",
        JSON.stringify(accountToLogin)
      );

      /* =====================================================
         NOTIFY APP
      ===================================================== */

      window.dispatchEvent(
        new Event("authChanged")
      );

      /* =====================================================
         GO TO DASHBOARD
      ===================================================== */

      navigate("/dashboard", {
        replace: true,
      });
    }, 700);
  };

  /* =========================================================
     CREATE NEW ACCOUNT
  ========================================================= */

  const handleCreateAccount = () => {
    navigate("/register");
  };

  /* =========================================================
     DETERMINE WHICH SCREEN TO SHOW
  ========================================================= */

  const showAccounts =
    savedAccount &&
    !selectedAccount &&
    !usingAnotherAccount;

  return (
    <div
      className="
        min-h-screen
        bg-gray-50
        flex
        items-center
        justify-center
        px-4
        py-10
      "
    >
      <div className="w-full max-w-md">

        {/* =================================================
            LOGO / BRAND
        ================================================= */}

        <div className="text-center mb-8">

          <div
            className="
              mx-auto
              w-14
              h-14
              rounded-2xl
              bg-green-600
              text-white
              flex
              items-center
              justify-center
              shadow-sm
            "
          >
            <FiLogIn size={26} />
          </div>

          <h1
            className="
              mt-4
              text-2xl
              sm:text-3xl
              font-bold
              text-gray-800
            "
          >
            Welcome back
          </h1>

          <p
            className="
              mt-1
              text-sm
              text-gray-500
            "
          >
            Sign in to your CampusMart account.
          </p>

        </div>

        {/* =================================================
            LOGIN CARD
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
              ACCOUNTS AVAILABLE
          ================================================= */}

          {showAccounts ? (
            <div>

              <h2
                className="
                  text-lg
                  font-bold
                  text-gray-800
                "
              >
                Accounts available
              </h2>

              <p
                className="
                  mt-1
                  text-sm
                  text-gray-500
                "
              >
                Select an account to continue.
              </p>

              {/* =================================================
                  SAVED ACCOUNT CARD
              ================================================= */}

              <button
                type="button"
                onClick={handleSelectAccount}
                className="
                  mt-5
                  w-full
                  flex
                  items-center
                  justify-between
                  gap-4
                  p-4
                  rounded-2xl
                  border
                  border-gray-200
                  hover:border-green-500
                  hover:bg-green-50
                  transition
                  text-left
                "
              >

                <div
                  className="
                    flex
                    items-center
                    gap-3
                    min-w-0
                  "
                >

                  {/* PROFILE IMAGE */}

                  <div
                    className="
                      w-12
                      h-12
                      rounded-full
                      bg-green-100
                      text-green-600
                      flex
                      items-center
                      justify-center
                      font-bold
                      text-lg
                      overflow-hidden
                      shrink-0
                    "
                  >
                    {savedAccount.profileImage ? (
                      <img
                        src={savedAccount.profileImage}
                        alt="Profile"
                        className="
                          w-full
                          h-full
                          object-cover
                        "
                      />
                    ) : (
                      savedAccount.fullName
                        ?.charAt(0)
                        ?.toUpperCase() || "G"
                    )}
                  </div>

                  {/* ACCOUNT DETAILS */}

                  <div className="min-w-0">

                    <p
                      className="
                        font-semibold
                        text-gray-800
                        truncate
                      "
                    >
                      {savedAccount.fullName}
                    </p>

                    <p
                      className="
                        text-xs
                        text-gray-500
                        truncate
                        mt-1
                      "
                    >
                      {savedAccount.email}
                    </p>

                  </div>

                </div>

                <FiArrowRight
                  className="
                    text-gray-400
                    shrink-0
                  "
                  size={18}
                />

              </button>

              {/* =================================================
                  USE ANOTHER ACCOUNT
              ================================================= */}

              <button
                type="button"
                onClick={handleAnotherAccount}
                className="
                  mt-4
                  w-full
                  flex
                  items-center
                  justify-center
                  gap-2
                  px-4
                  py-3
                  rounded-xl
                  border
                  border-gray-200
                  text-gray-600
                  hover:bg-gray-50
                  hover:text-green-600
                  transition
                  text-sm
                  font-medium
                "
              >
                <FiPlus size={17} />

                Use another account

              </button>

            </div>
          ) : (

            /* =================================================
               LOGIN FORM
            ================================================= */

            <div>

              {/* =================================================
                  SELECTED ACCOUNT
              ================================================= */}

              {selectedAccount && (
                <div
                  className="
                    flex
                    items-center
                    gap-3
                    p-3
                    rounded-xl
                    bg-green-50
                    border
                    border-green-100
                    mb-6
                  "
                >

                  {/* PROFILE IMAGE */}

                  <div
                    className="
                      w-10
                      h-10
                      rounded-full
                      bg-green-100
                      text-green-600
                      flex
                      items-center
                      justify-center
                      font-bold
                      overflow-hidden
                      shrink-0
                    "
                  >
                    {selectedAccount.profileImage ? (
                      <img
                        src={selectedAccount.profileImage}
                        alt="Profile"
                        className="
                          w-full
                          h-full
                          object-cover
                        "
                      />
                    ) : (
                      selectedAccount.fullName
                        ?.charAt(0)
                        ?.toUpperCase() || "G"
                    )}
                  </div>

                  {/* ACCOUNT INFORMATION */}

                  <div className="min-w-0">

                    <p
                      className="
                        text-sm
                        font-semibold
                        text-gray-800
                        truncate
                      "
                    >
                      {selectedAccount.fullName}
                    </p>

                    <p
                      className="
                        text-xs
                        text-gray-500
                        truncate
                      "
                    >
                      {selectedAccount.email}
                    </p>

                  </div>

                </div>
              )}

              {/* =================================================
                  HEADER
              ================================================= */}

              <div>

                <h2
                  className="
                    text-lg
                    font-bold
                    text-gray-800
                  "
                >
                  {selectedAccount
                    ? "Enter your password"
                    : "Sign in"}
                </h2>

                <p
                  className="
                    mt-1
                    text-sm
                    text-gray-500
                  "
                >
                  {selectedAccount
                    ? "Enter your password to continue."
                    : "Enter your account details to continue."}
                </p>

              </div>

              {/* =================================================
                  EMAIL
              ================================================= */}

              {!selectedAccount && (
                <div className="mt-6">

                  <label
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

                    <FiMail
                      className="
                        absolute
                        left-3
                        top-1/2
                        -translate-y-1/2
                        text-gray-400
                      "
                      size={17}
                    />

                    <input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setError("");
                      }}
                      placeholder="Enter your email"
                      autoComplete="email"
                      className="
                        w-full
                        pl-10
                        pr-4
                        py-3
                        rounded-xl
                        border
                        border-gray-200
                        bg-gray-50
                        text-sm
                        outline-none
                        focus:bg-white
                        focus:border-green-500
                        transition
                      "
                    />

                  </div>

                </div>
              )}

              {/* =================================================
                  PASSWORD
              ================================================= */}

              <div className="mt-6">

                <div
                  className="
                    flex
                    items-center
                    justify-between
                    mb-2
                  "
                >

                  <label
                    className="
                      text-sm
                      font-medium
                      text-gray-700
                    "
                  >
                    Password
                  </label>

                  <button
                    type="button"
                    className="
                      text-xs
                      font-medium
                      text-green-600
                      hover:text-green-700
                    "
                  >
                    Forgot password?
                  </button>

                </div>

                <div className="relative">

                  <FiLock
                    className="
                      absolute
                      left-3
                      top-1/2
                      -translate-y-1/2
                      text-gray-400
                    "
                    size={17}
                  />

                  <input
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError("");
                    }}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    className="
                      w-full
                      pl-10
                      pr-12
                      py-3
                      rounded-xl
                      border
                      border-gray-200
                      bg-gray-50
                      text-sm
                      outline-none
                      focus:bg-white
                      focus:border-green-500
                      transition
                    "
                  />

                  {/* SHOW / HIDE PASSWORD */}

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(
                        (current) => !current
                      )
                    }
                    className="
                      absolute
                      right-3
                      top-1/2
                      -translate-y-1/2
                      text-gray-400
                      hover:text-green-600
                    "
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

              {/* =================================================
                  ERROR
              ================================================= */}

              {error && (
                <div
                  className="
                    mt-4
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
                  LOGIN BUTTON
              ================================================= */}

              <button
                type="button"
                onClick={handleLogin}
                disabled={loggingIn}
                className="
                  mt-6
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
                  text-white
                  text-sm
                  font-medium
                  transition
                  disabled:opacity-70
                  disabled:cursor-not-allowed
                "
              >

                {loggingIn ? (
                  <>
                    <FiCheck size={17} />

                    Signing in...
                  </>
                ) : (
                  <>
                    <FiLogIn size={17} />

                    Sign In
                  </>
                )}

              </button>

              {/* =================================================
                  BACK TO ACCOUNTS
              ================================================= */}

              {savedAccount &&
                (selectedAccount ||
                  usingAnotherAccount) && (
                <button
                  type="button"
                  onClick={handleBackToAccounts}
                  className="
                    mt-4
                    w-full
                    text-sm
                    text-gray-500
                    hover:text-green-600
                    transition
                  "
                >
                  ← Back to accounts
                </button>
              )}

            </div>
          )}

        </div>

        {/* =================================================
            REGISTER
        ================================================= */}

        <p
          className="
            mt-6
            text-center
            text-sm
            text-gray-500
          "
        >
          Don't have a CampusMart account?

          <button
            type="button"
            onClick={handleCreateAccount}
            className="
              ml-1
              font-semibold
              text-green-600
              hover:text-green-700
            "
          >
            Create account
          </button>
        </p>

      </div>
    </div>
  );
}

export default Login;