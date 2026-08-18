import { useState } from "react";
import { signOut } from "firebase/auth";
import { auth } from "./firebase";
import { useNavigate } from "react-router-dom";

function Logout() {
  const navigate = useNavigate();

  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [error, setError] = useState("");

  const handleCancel = () => {
    navigate(-1);
  };

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      setError("");

      await signOut(auth);

      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Logout error:", error);

      setError(
        "Something went wrong while logging out. Please try again."
      );

      setIsLoggingOut(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">

      {/* MAIN CARD */}
      <div className="w-full max-w-md">

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

          {/* LOGO / ICON */}
          <div className="flex justify-center">
            <div
              className="
                w-16
                h-16
                rounded-2xl
                bg-green-50
                flex
                items-center
                justify-center
              "
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-8 h-8 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.8}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17 16l4-4m0 0l-4-4m4 4H7"
                />

                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M7 4v16"
                />
              </svg>
            </div>
          </div>

          {/* TITLE */}
          <div className="text-center mt-5">
            <h1
              className="
                text-xl
                sm:text-2xl
                font-bold
                text-gray-900
              "
            >
              Are you sure?
            </h1>

            <p
              className="
                mt-2
                text-sm
                leading-6
                text-gray-500
                max-w-sm
                mx-auto
              "
            >
              Are you sure you want to log out of your
              CampusMart account?
            </p>
          </div>

          {/* INFORMATION BOX */}
          <div
            className="
              mt-6
              rounded-xl
              bg-green-50
              border
              border-green-100
              p-4
              flex
              items-start
              gap-3
            "
          >
            <div
              className="
                w-8
                h-8
                rounded-lg
                bg-green-100
                text-green-600
                flex
                items-center
                justify-center
                shrink-0
              "
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>

            <p className="text-xs leading-5 text-gray-600">
              You will be signed out of your account and
              returned to the CampusMart login page.
            </p>
          </div>

          {/* ERROR */}
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
              "
            >
              <p className="text-sm text-red-600">
                {error}
              </p>
            </div>
          )}

          {/* BUTTONS */}
          <div className="mt-6 space-y-3">

            {/* LOGOUT */}
            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="
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
                active:bg-green-800
                text-white
                text-sm
                font-semibold
                transition
                duration-200
                disabled:opacity-70
                disabled:cursor-not-allowed
              "
            >
              {isLoggingOut ? (
                <>
                  <svg
                    className="w-4 h-4 animate-spin"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />

                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>

                  Logging out...
                </>
              ) : (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M17 16l4-4m0 0l-4-4m4 4H7"
                    />

                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M7 4v16"
                    />
                  </svg>

                  Logout
                </>
              )}
            </button>

            {/* CANCEL */}
            <button
              type="button"
              onClick={handleCancel}
              disabled={isLoggingOut}
              className="
                w-full
                px-5
                py-3
                rounded-xl
                border
                border-gray-200
                bg-white
                text-gray-700
                text-sm
                font-medium
                hover:bg-gray-50
                hover:border-gray-300
                transition
                duration-200
                disabled:opacity-50
                disabled:cursor-not-allowed
              "
            >
              Cancel
            </button>

          </div>

          {/* FOOTER */}
          <p
            className="
              mt-6
              text-center
              text-xs
              text-gray-400
            "
          >
            CampusMart &mdash; Your Campus Marketplace
          </p>

        </div>
      </div>
    </div>
  );
}

export default Logout;