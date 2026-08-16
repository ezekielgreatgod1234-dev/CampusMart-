import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  FiUser,
  FiMail,
  FiPhone,
  FiMapPin,
  FiLock,
  FiEye,
  FiEyeOff,
  FiUserPlus,
  FiCheck,
} from "react-icons/fi";

function Register() {
  const navigate = useNavigate();

  /* =========================================================
     FORM
  ========================================================= */

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [campus, setCampus] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  /* =========================================================
     PASSWORD VISIBILITY
  ========================================================= */

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  /* =========================================================
     ERROR
  ========================================================= */

  const [error, setError] = useState("");

  /* =========================================================
     LOADING
  ========================================================= */

  const [creatingAccount, setCreatingAccount] =
    useState(false);

  /* =========================================================
     CREATE ACCOUNT
  ========================================================= */

  const handleCreateAccount = () => {
    setError("");

    const cleanFullName = fullName.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim();
    const cleanCampus = campus.trim();

    /* =====================================================
       REQUIRED FIELDS
    ===================================================== */

    if (!cleanFullName) {
      setError("Please enter your full name.");
      return;
    }

    if (!cleanEmail) {
      setError("Please enter your email address.");
      return;
    }

    if (!cleanPhone) {
      setError("Please enter your phone number.");
      return;
    }

    if (!cleanCampus) {
      setError("Please enter your campus.");
      return;
    }

    if (!password) {
      setError("Please create a password.");
      return;
    }

    if (!confirmPassword) {
      setError("Please confirm your password.");
      return;
    }

    /* =====================================================
       EMAIL VALIDATION
    ===================================================== */

    const emailPattern =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(cleanEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    /* =====================================================
       PASSWORD VALIDATION
    ===================================================== */

    if (password.length < 6) {
      setError(
        "Your password must be at least 6 characters."
      );
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    /* =====================================================
       START CREATION
    ===================================================== */

    setCreatingAccount(true);

    setTimeout(() => {
      /*
        This is currently frontend/demo registration.

        When your backend is ready, replace this section
        with your real registration API request.
      */

      const newAccount = {
        fullName: cleanFullName,
        email: cleanEmail,
        phone: cleanPhone,
        campus: cleanCampus,
        profileImage: null,
        role: "Customer",
      };

      /* ===================================================
         SAVE PROFILE
      =================================================== */

      localStorage.setItem(
        "campusmart_profile",
        JSON.stringify(newAccount)
      );

      /* ===================================================
         SAVE DEMO PASSWORD

         NOTE:
         This is only for the frontend demo.

         Do NOT store real passwords in localStorage
         when you connect a real backend.
      =================================================== */

      localStorage.setItem(
        "campusmart_demo_password",
        password
      );

      /* ===================================================
         REMOVE OLD LOGIN SESSION
      =================================================== */

      localStorage.removeItem(
        "campusmart_auth"
      );

      localStorage.removeItem(
        "campusmart_user"
      );

      localStorage.removeItem(
        "campusmart_token"
      );

      /* ===================================================
         GO TO LOGIN
      =================================================== */

      navigate("/login", {
        replace: true,
      });
    }, 700);
  };

  /* =========================================================
     LOGIN
  ========================================================= */

  const handleLogin = () => {
    navigate("/login");
  };

  return (
    <div className="register-page min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">

      <div className="w-full max-w-lg">

        {/* =================================================
            BRAND
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
            <FiUserPlus size={26} />
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
            Create your account
          </h1>

          <p
            className="
              mt-2
              text-sm
              text-gray-500
            "
          >
            Join CampusMart and start shopping on campus.
          </p>

        </div>

        {/* =================================================
            REGISTER CARD
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
              FORM HEADER
          ================================================= */}

          <div className="mb-6">

            <h2
              className="
                text-lg
                font-bold
                text-gray-800
              "
            >
              Your information
            </h2>

            <p
              className="
                mt-1
                text-sm
                text-gray-500
              "
            >
              Enter your details to create your CampusMart
              account.
            </p>

          </div>

          {/* =================================================
              FULL NAME
          ================================================= */}

          <div>

            <label
              className="
                block
                text-sm
                font-medium
                text-gray-700
                mb-2
              "
            >
              Full Name
            </label>

            <div className="relative">

              <FiUser
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
                type="text"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  setError("");
                }}
                placeholder="Enter your full name"
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
                  text-gray-800
                  outline-none
                  focus:bg-white
                  focus:border-green-500
                  transition
                "
              />

            </div>

          </div>

          {/* =================================================
              EMAIL + PHONE
          ================================================= */}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">

            {/* EMAIL */}

            <div>

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
                  placeholder="you@email.com"
                  className="
                    w-full
                    pl-10
                    pr-3
                    py-3
                    rounded-xl
                    border
                    border-gray-200
                    bg-gray-50
                    text-sm
                    text-gray-800
                    outline-none
                    focus:bg-white
                    focus:border-green-500
                    transition
                  "
                />

              </div>

            </div>

            {/* PHONE */}

            <div>

              <label
                className="
                  block
                  text-sm
                  font-medium
                  text-gray-700
                  mb-2
                "
              >
                Phone Number
              </label>

              <div className="relative">

                <FiPhone
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
                  type="tel"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    setError("");
                  }}
                  placeholder="08012345678"
                  className="
                    w-full
                    pl-10
                    pr-3
                    py-3
                    rounded-xl
                    border
                    border-gray-200
                    bg-gray-50
                    text-sm
                    text-gray-800
                    outline-none
                    focus:bg-white
                    focus:border-green-500
                    transition
                  "
                />

              </div>

            </div>

          </div>

          {/* =================================================
              CAMPUS
          ================================================= */}

          <div className="mt-5">

            <label
              className="
                block
                text-sm
                font-medium
                text-gray-700
                mb-2
              "
            >
              Campus
            </label>

            <div className="relative">

              <FiMapPin
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
                type="text"
                value={campus}
                onChange={(e) => {
                  setCampus(e.target.value);
                  setError("");
                }}
                placeholder="e.g. Abia State University"
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
                  text-gray-800
                  outline-none
                  focus:bg-white
                  focus:border-green-500
                  transition
                "
              />

            </div>

          </div>

          {/* =================================================
              PASSWORD
          ================================================= */}

          <div className="mt-5">

            <label
              className="
                block
                text-sm
                font-medium
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
                placeholder="Create a password"
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
                  text-gray-800
                  outline-none
                  focus:bg-white
                  focus:border-green-500
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
                  right-3
                  top-1/2
                  -translate-y-1/2
                  text-gray-400
                  hover:text-green-600
                "
              >
                {showPassword ? (
                  <FiEyeOff size={18} />
                ) : (
                  <FiEye size={18} />
                )}
              </button>

            </div>

            <p className="mt-2 text-xs text-gray-400">
              Password must be at least 6 characters.
            </p>

          </div>

          {/* =================================================
              CONFIRM PASSWORD
          ================================================= */}

          <div className="mt-5">

            <label
              className="
                block
                text-sm
                font-medium
                text-gray-700
                mb-2
              "
            >
              Confirm Password
            </label>

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
                  showConfirmPassword
                    ? "text"
                    : "password"
                }
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(
                    e.target.value
                  );
                  setError("");
                }}
                placeholder="Confirm your password"
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
                  text-gray-800
                  outline-none
                  focus:bg-white
                  focus:border-green-500
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
                  right-3
                  top-1/2
                  -translate-y-1/2
                  text-gray-400
                  hover:text-green-600
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
              ERROR
          ================================================= */}

          {error && (
            <div
              className="
                mt-5
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
              CREATE ACCOUNT BUTTON
          ================================================= */}

          <button
            type="button"
            onClick={handleCreateAccount}
            disabled={creatingAccount}
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

            {creatingAccount ? (
              <>
                <FiCheck size={17} />
                Creating account...
              </>
            ) : (
              <>
                <FiUserPlus size={17} />
                Create Account
              </>
            )}

          </button>

          {/* =================================================
              LOGIN
          ================================================= */}

          <div className="mt-6 pt-6 border-t border-gray-100">

            <p className="text-center text-sm text-gray-500">

              Already have a CampusMart account?

              <button
                type="button"
                onClick={handleLogin}
                className="
                  ml-1
                  font-semibold
                  text-green-600
                  hover:text-green-700
                  transition
                "
              >
                Sign in
              </button>

            </p>

          </div>

        </div>

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
        >
          By creating an account, you agree to use
          CampusMart responsibly.
        </p>

      </div>

    </div>
  );
}

export default Register;