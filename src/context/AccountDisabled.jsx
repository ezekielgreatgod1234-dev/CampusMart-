
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import {
  FiShield,
  FiLock,
  FiMail,
  FiArrowLeft,
} from "react-icons/fi";

import { auth } from "./firebase";

function AccountDisabled() {
  const navigate = useNavigate();

  const handleBackToLogin = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Sign out error:", error);
    }

    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#f7faf8] flex items-center justify-center px-5 py-10">

      <div className="w-full max-w-[520px]">

        {/* LOGO */}

        <div className="flex justify-center mb-8">

          <div className="flex items-center gap-3">

            <div className="w-14 h-14 rounded-2xl bg-green-600 text-white flex items-center justify-center text-xl font-black shadow-lg shadow-green-600/20">
              CM
            </div>

            <div>
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

          </div>

        </div>

        {/* CARD */}

        <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_15px_50px_rgba(15,23,42,0.08)] p-7 sm:p-10 text-center">

          {/* ICON */}

          <div className="mx-auto w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mb-6">

            <div className="w-14 h-14 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
              <FiLock size={27} />
            </div>

          </div>

          {/* TITLE */}

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-50 border border-red-100 text-red-600 text-xs font-bold mb-4">

            <FiShield size={14} />

            Account Disabled

          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            Your account has been disabled
          </h1>

          <p className="mt-4 text-sm sm:text-base text-gray-500 leading-6 max-w-md mx-auto">
            Your CampusMart account has been temporarily disabled by an
            administrator. You cannot access your account while it is disabled.
          </p>

          {/* NOTICE */}

          <div className="mt-6 rounded-2xl bg-gray-50 border border-gray-100 p-4 text-left">

            <div className="flex items-start gap-3">

              <div className="w-9 h-9 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-500 flex-shrink-0">
                <FiMail size={17} />
              </div>

              <div>

                <p className="text-sm font-bold text-gray-800">
                  Need help?
                </p>

                <p className="text-xs text-gray-500 mt-1 leading-5">
                  If you believe this was a mistake, please contact CampusMart
                  support to request a review of your account.
                </p>

              </div>

            </div>

          </div>

          {/* BUTTONS */}

          <div className="mt-7 space-y-3">

            <button
              type="button"
              onClick={handleBackToLogin}
              className="w-full h-12 rounded-xl bg-green-600 text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-green-700 active:bg-green-800 transition shadow-lg shadow-green-600/10"
            >
              <FiArrowLeft size={17} />

              Back to Login
            </button>

            <button
              type="button"
              onClick={() => navigate("/")}
              className="w-full h-12 rounded-xl border border-gray-200 bg-white text-gray-700 font-bold text-sm hover:bg-gray-50 hover:border-gray-300 transition"
            >
              Return to Homepage
            </button>

          </div>

        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          © 2026 CampusMart. Built for students.
        </p>

      </div>

    </div>
  );
}

export default AccountDisabled;

