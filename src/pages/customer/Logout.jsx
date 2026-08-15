import { useState } from "react";
import { useNavigate } from "react-router-dom";

import CustomerLayout from "../../layouts/CustomerLayout";

import {
  FiLogOut,
  FiArrowLeft,
  FiShield,
  FiCheck,
} from "react-icons/fi";

function Logout({
  cartCount = 0,
  wishlist = [],
  unreadMessages = 0,
}) {
  const navigate = useNavigate();

  const [loggingOut, setLoggingOut] = useState(false);

  /* =========================================================
     CANCEL LOGOUT
  ========================================================= */

  const handleCancel = () => {
    navigate("/dashboard");
  };

  /* =========================================================
     LOGOUT
  ========================================================= */

  const handleLogout = () => {
    setLoggingOut(true);

    /*
      Small delay so the user sees
      "Logging out..."
    */

    setTimeout(() => {
      /*
        IMPORTANT:
        We remove ONLY the current login/session information.

        We DO NOT remove:
        - campusmart_profile
        - campusmart_theme
        - campusmart_profile_visibility
        - campusmart_two_factor

        This allows the Login page to show the
        previously used account.
      */

      localStorage.removeItem("campusmart_token");
      localStorage.removeItem("campusmart_user");
      localStorage.removeItem("campusmart_auth");

      /*
        Tell the rest of the application
        that authentication changed.
      */

      window.dispatchEvent(new Event("authChanged"));

      /*
        Go to Login page.

        loggedOut: true tells the Login page
        that the user just logged out.
      */

      navigate("/login", {
        replace: true,
        state: {
          loggedOut: true,
        },
      });
    }, 700);
  };

  return (
    <CustomerLayout
      cartCount={cartCount}
      wishlist={wishlist}
      unreadMessages={unreadMessages}
    >
      <div className="space-y-6">

        {/* =================================================
            HEADER
        ================================================= */}

        <div>
          <button
            type="button"
            onClick={handleCancel}
            disabled={loggingOut}
            className="
              flex
              items-center
              gap-2
              text-gray-500
              dark:text-gray-400
              hover:text-green-600
              transition
              disabled:opacity-50
            "
          >
            <FiArrowLeft size={18} />

            <span>Back to Dashboard</span>
          </button>

          <div className="mt-5">
            <h1
              className="
                text-2xl
                sm:text-3xl
                font-bold
                text-gray-800
                dark:text-white
              "
            >
              Logout
            </h1>

            <p
              className="
                mt-1
                text-gray-500
                dark:text-gray-400
              "
            >
              Sign out of your CampusMart account.
            </p>
          </div>
        </div>

        {/* =================================================
            LOGOUT CARD
        ================================================= */}

        <div
          className="
            max-w-2xl
            mx-auto
            bg-white
            dark:bg-[#182230]
            rounded-2xl
            border
            border-gray-100
            dark:border-gray-700
            p-6
            sm:p-8
          "
        >

          {/* =================================================
              ICON
          ================================================= */}

          <div className="flex justify-center">
            <div
              className="
                w-20
                h-20
                rounded-full
                bg-green-50
                dark:bg-green-900/30
                text-green-600
                flex
                items-center
                justify-center
              "
            >
              <FiLogOut size={34} />
            </div>
          </div>

          {/* =================================================
              TITLE
          ================================================= */}

          <div className="text-center mt-6">

            <h2
              className="
                text-xl
                sm:text-2xl
                font-bold
                text-gray-800
                dark:text-white
              "
            >
              Are you sure you want to logout?
            </h2>

            <p
              className="
                mt-2
                text-sm
                leading-6
                text-gray-500
                dark:text-gray-400
                max-w-md
                mx-auto
              "
            >
              You will be signed out of your CampusMart account.
              You can sign back in anytime to continue shopping.
            </p>

          </div>

          {/* =================================================
              SECURITY INFORMATION
          ================================================= */}

          <div
            className="
              mt-6
              rounded-xl
              bg-gray-50
              dark:bg-gray-900/60
              border
              border-gray-100
              dark:border-gray-700
              p-4
            "
          >

            <div className="flex gap-3">

              <div
                className="
                  w-9
                  h-9
                  rounded-lg
                  bg-green-50
                  dark:bg-green-900/30
                  text-green-600
                  flex
                  items-center
                  justify-center
                  shrink-0
                "
              >
                <FiShield size={18} />
              </div>

              <div>

                <h3
                  className="
                    text-sm
                    font-semibold
                    text-gray-800
                    dark:text-white
                  "
                >
                  Your account is safe
                </h3>

                <p
                  className="
                    mt-1
                    text-xs
                    leading-5
                    text-gray-500
                    dark:text-gray-400
                  "
                >
                  Logging out will end your current session on
                  this device.
                </p>

              </div>

            </div>

          </div>

          {/* =================================================
              ACTIONS
          ================================================= */}

          <div
            className="
              mt-6
              flex
              flex-col
              sm:flex-row
              justify-center
              gap-3
            "
          >

            {/* =================================================
                CANCEL
            ================================================= */}

            <button
              type="button"
              onClick={handleCancel}
              disabled={loggingOut}
              className="
                flex
                items-center
                justify-center
                gap-2
                px-6
                py-3
                rounded-xl
                border
                border-gray-200
                dark:border-gray-600
                text-gray-600
                dark:text-gray-300
                hover:bg-gray-50
                dark:hover:bg-gray-700
                text-sm
                font-medium
                transition
                disabled:opacity-50
              "
            >
              <FiArrowLeft size={16} />

              Cancel
            </button>

            {/* =================================================
                LOGOUT
            ================================================= */}

            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="
                flex
                items-center
                justify-center
                gap-2
                px-6
                py-3
                rounded-xl
                bg-green-600
                hover:bg-green-700
                text-white
                text-sm
                font-medium
                transition
                disabled:opacity-70
              "
            >

              {loggingOut ? (
                <>
                  <FiCheck size={16} />

                  Logging out...
                </>
              ) : (
                <>
                  <FiLogOut size={16} />

                  Logout
                </>
              )}

            </button>

          </div>

        </div>

      </div>
    </CustomerLayout>
  );
}

export default Logout;