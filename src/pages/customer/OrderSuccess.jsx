import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import CustomerLayout from "../../layouts/CustomerLayout";

import {
  FiCheckCircle,
  FiPackage,
  FiHome,
  FiList,
} from "react-icons/fi";

function OrderSuccess({ cartCount = 0 }) {
  const navigate = useNavigate();
  const location = useLocation();

  const order = useMemo(() => {
    if (location.state?.order) return location.state.order;

    try {
      const raw = sessionStorage.getItem("lastOrder");
      if (raw) return JSON.parse(raw);
    } catch {
      // ignore
    }
    return null;
  }, [location.state]);

  const orderNumber =
    order?.orderNumber ||
    order?.id ||
    `CM-${Date.now().toString().slice(-6)}`;

  const total = Number(order?.total || 0);
  const itemCount = Array.isArray(order?.items)
    ? order.items.reduce((s, i) => s + Number(i.quantity || 0), 0)
    : 0;

  return (
    <CustomerLayout cartCount={cartCount}>
      <div className="min-h-[70vh] flex items-center justify-center px-2">
        <div className="w-full max-w-lg bg-white border border-gray-100 rounded-2xl p-6 sm:p-8 shadow-sm text-center">
          <div className="w-20 h-20 mx-auto rounded-full bg-green-100 text-green-600 flex items-center justify-center">
            <FiCheckCircle size={40} />
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mt-5">
            Payment successful
          </h1>
          <p className="text-gray-500 mt-2 leading-6">
            Your payment was verified and your order has been placed.
            The seller can now process it.
          </p>

          <div className="mt-6 rounded-2xl bg-green-50 border border-green-100 p-4 text-left space-y-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-gray-500">Order number</span>
              <span className="text-sm font-bold text-[#008236]">
                #{orderNumber}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-gray-500">Items</span>
              <span className="text-sm font-semibold text-gray-800">
                {itemCount || "—"}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-gray-500">Amount paid</span>
              <span className="text-sm font-bold text-gray-900">
                ₦{total.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-gray-500">Status</span>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-green-100 text-[#008236]">
                Pending
              </span>
            </div>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() =>
                navigate(order?.id ? `/orders/${order.id}` : "/orders")
              }
              className="
                flex-1 h-12 rounded-xl
                bg-green-600 hover:bg-green-700
                text-white font-semibold
                flex items-center justify-center gap-2
              "
            >
              <FiList size={18} />
              View order
            </button>
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="
                flex-1 h-12 rounded-xl
                border border-gray-200 text-gray-700 font-semibold
                hover:bg-gray-50
                flex items-center justify-center gap-2
              "
            >
              <FiHome size={18} />
              Dashboard
            </button>
          </div>

          <button
            type="button"
            onClick={() => navigate("/browse-products")}
            className="mt-4 text-sm text-green-600 hover:text-green-700 font-medium flex items-center justify-center gap-2 w-full"
          >
            <FiPackage size={16} />
            Continue shopping
          </button>
        </div>
      </div>
    </CustomerLayout>
  );
}

export default OrderSuccess;