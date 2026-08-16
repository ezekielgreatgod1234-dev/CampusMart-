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
  FiShoppingBag,
  FiBriefcase,
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
     ROLE
  ========================================================= */

  const [role, setRole] = useState("");

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

    if (!role) {
      setError("Please select whether you are a buyer or seller.");
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
        Frontend/demo registration.

        Later, replace this section with your real
        backend registration request.
      */

      const newAccount = {
        fullName: cleanFullName,
        email: cleanEmail,
        phone: cleanPhone,
        campus: cleanCampus,
        profileImage: null,

        // Buyer or Seller
        role: role,
      };

      /* ===================================================
         SAVE PROFILE
      =================================================== */

      localStorage.setItem(
        "campusmart_profile",
        JSON.stringify(newAccount)
      );

      /* ===================================================
         SAVE ROLE
      =================================================== */

      localStorage.setItem(
        "campusmart_role",
        role
      );

      /* ===================================================
         SAVE DEMO PASSWORD

         NOTE:
         Do NOT store real passwords in localStorage
         when you connect your backend.
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
         BUYER
      =================================================== */

      if (role === "Buyer") {
        navigate("/dashboard", {
          replace: true,
        });

        return;
      }

      /* ===================================================
         SELLER
      =================================================== */

      if (role === "Seller") {
        navigate("/seller-dashboard", {
          replace: true,
        });

        return;
      }

    }, 700);
  };

  /* =========================================================
     LOGIN
  ========================================================= */

  const handleLogin = () => {
    navigate("/login");
  };

  return (
    <div
      className="
        register-page
        min-h-screen
        bg-gray-50
        flex
        items-center
        justify-center
        px-4
        py-10
      "
    >
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
            Join CampusMart and start shopping or selling
            on campus.
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

          <div
            className="
              grid
              grid-cols-1
              sm:grid-cols-2
              gap-4
              mt-5
            "
          >

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
              ROLE
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
              Account Type
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              {/* =================================================
                  BUYER
              ================================================= */}

              <button
                type="button"
                onClick={() => {
                  setRole("Buyer");
                  setError("");
                }}
                className={`
                  relative
                  w-full
                  p-4
                  rounded-xl
                  border
                  text-left
                  transition
                  ${
                    role === "Buyer"
                      ? "border-green-500 bg-green-50"
                      : "border-gray-200 bg-gray-50 hover:border-green-300"
                  }
                `}
              >

                <div className="flex items-center gap-3">

                  <div
                    className={`
                      w-11
                      h-11
                      rounded-xl
                      flex
                      items-center
                      justify-center
                      ${
                        role === "Buyer"
                          ? "bg-green-600 text-white"
                          : "bg-white text-gray-500"
                      }
                    `}
                  >
                    <FiShoppingBag size={20} />
                  </div>

                  <div>

                    <p
                      className="
                        font-semibold
                        text-gray-800
                      "
                    >
                      Buyer
                    </p>

                    <p
                      className="
                        text-xs
                        text-gray-500
                        mt-1
                      "
                    >
                      Shop products on campus
                    </p>

                  </div>

                </div>

                {role === "Buyer" && (
                  <div
                    className="
                      absolute
                      top-3
                      right-3
                      w-5
                      h-5
                      rounded-full
                      bg-green-600
                      text-white
                      flex
                      items-center
                      justify-center
                    "
                  >
                    <FiCheck size={13} />
                  </div>
                )}

              </button>

              {/* =================================================
                  SELLER
              ================================================= */}

              <button
                type="button"
                onClick={() => {
                  setRole("Seller");
                  setError("");
                }}
                className={`
                  relative
                  w-full
                  p-4
                  rounded-xl
                  border
                  text-left
                  transition
                  ${
                    role === "Seller"
                      ? "border-green-500 bg-green-50"
                      : "border-gray-200 bg-gray-50 hover:border-green-300"
                  }
                `}
              >

                <div className="flex items-center gap-3">

                  <div
                    className={`
                      w-11
                      h-11
                      rounded-xl
                      flex
                      items-center
                      justify-center
                      ${
                        role === "Seller"
                          ? "bg-green-600 text-white"
                          : "bg-white text-gray-500"
                      }
                    `}
                  >
                    <FiBriefcase size={20} />
                  </div>

                  <div>

                    <p
                      className="
                        font-semibold
                        text-gray-800
                      "
                    >
                      Seller
                    </p>

                    <p
                      className="
                        text-xs
                        text-gray-500
                        mt-1
                      "
                    >
                      Sell products on campus
                    </p>

                  </div>

                </div>

                {role === "Seller" && (
                  <div
                    className="
                      absolute
                      top-3
                      right-3
                      w-5
                      h-5
                      rounded-full
                      bg-green-600
                      text-white
                      flex
                      items-center
                      justify-center
                    "
                  >
                    <FiCheck size={13} />
                  </div>
                )}

              </button>

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

          <div
            className="
              mt-6
              pt-6
              border-t
              border-gray-100
            "
          >

            <p
              className="
                text-center
                text-sm
                text-gray-500
              "
            >
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