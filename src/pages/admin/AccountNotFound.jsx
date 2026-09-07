import { Link, useNavigate } from "react-router-dom";
import { FiAlertCircle, FiArrowLeft, FiLogIn } from "react-icons/fi";

function AccountNotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#f7faf8] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
        <div className="w-16 h-16 mx-auto rounded-full bg-red-50 text-red-500 flex items-center justify-center mb-5">
          <FiAlertCircle size={30} />
        </div>

        <h1 className="text-2xl font-bold text-gray-900">Account not found</h1>

        <p className="mt-3 text-sm text-gray-500 leading-6">
          We couldn&apos;t find an active CampusMart account for these details.
          The account may have been deleted by an administrator.
        </p>

        <p className="mt-3 text-xs text-gray-400 leading-5">
          If you believe this is a mistake, contact CampusMart support or create
          a new account.
        </p>

        <div className="mt-8 flex flex-col gap-3">
          <button
            type="button"
            onClick={() => navigate("/login", { replace: true })}
            className="h-12 rounded-xl bg-[#008236] text-white text-sm font-semibold flex items-center justify-center gap-2 hover:bg-[#006f2e] transition"
          >
            <FiLogIn size={17} />
            Back to login
          </button>

          <Link
            to="/register"
            className="h-12 rounded-xl border border-gray-200 bg-white text-gray-700 text-sm font-semibold flex items-center justify-center hover:border-green-300 hover:text-green-700 hover:bg-green-50 transition"
          >
            Create a new account
          </Link>

          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 text-sm text-gray-400 hover:text-green-600 transition mt-1"
          >
            <FiArrowLeft size={15} />
            Back to CampusMart
          </Link>
        </div>
      </div>
    </div>
  );
}

export default AccountNotFound;