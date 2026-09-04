import { useNavigate, useLocation } from "react-router-dom";
import { FiShield, FiShoppingCart, FiTag, FiArrowRight } from "react-icons/fi";

function ChooseDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const userData = location.state?.userData || {};

  const primaryRole = String(userData?.role || "buyer").toLowerCase();
  const isSeller = primaryRole === "seller";

  return (
    <div className="min-h-screen bg-[#f7faf8] flex items-center justify-center px-5 py-10">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-green-600 text-white flex items-center justify-center text-lg font-black shadow-lg shadow-green-600/20">
              CM
            </div>
            <div>
              <div className="text-xl font-black text-gray-900">
                Campus<span className="text-green-600">Mart</span>
              </div>
              <p className="text-xs text-gray-500">Choose your dashboard</p>
            </div>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-7 sm:p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-green-50 text-green-600 mb-4">
              <FiShield size={26} />
            </div>
            <h1 className="text-2xl font-black text-gray-900">
              Welcome back
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              This account has <span className="font-semibold text-green-600">admin access</span>.
              Choose how you want to continue.
            </p>
          </div>

          <div className="space-y-4">
            {/* Admin option */}
            <button
              type="button"
              onClick={() => navigate("/admin-dashboard", { replace: true })}
              className="w-full flex items-center gap-4 p-5 rounded-2xl border-2 border-green-600 bg-green-50 hover:bg-green-100 transition group"
            >
              <div className="w-12 h-12 rounded-xl bg-green-600 text-white flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition">
                <FiShield size={22} />
              </div>
              <div className="text-left flex-1">
                <p className="font-bold text-gray-900">Admin Dashboard</p>
                <p className="text-sm text-gray-500 mt-0.5">
                  Manage users, products, orders & platform
                </p>
              </div>
              <FiArrowRight className="text-green-600 flex-shrink-0" size={18} />
            </button>

            {/* Buyer / Seller option */}
            <button
              type="button"
              onClick={() => navigate("/dashboard", { replace: true })}
              className="w-full flex items-center gap-4 p-5 rounded-2xl border border-gray-200 hover:border-green-300 hover:bg-green-50 transition group"
            >
              <div className="w-12 h-12 rounded-xl bg-gray-100 text-gray-700 flex items-center justify-center flex-shrink-0 group-hover:bg-green-100 group-hover:text-green-700 transition">
                {isSeller ? <FiTag size={22} /> : <FiShoppingCart size={22} />}
              </div>
              <div className="text-left flex-1">
                <p className="font-bold text-gray-900">
                  {isSeller ? "Seller Dashboard" : "Buyer Dashboard"}
                </p>
                <p className="text-sm text-gray-500 mt-0.5">
                  {isSeller
                    ? "Manage your listings and sales"
                    : "Continue shopping on CampusMart"}
                </p>
              </div>
              <FiArrowRight className="text-gray-400 group-hover:text-green-600 flex-shrink-0 transition" size={18} />
            </button>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-gray-400">
          You can switch later by logging out and logging back in
        </p>
      </div>
    </div>
  );
}

export default ChooseDashboard;