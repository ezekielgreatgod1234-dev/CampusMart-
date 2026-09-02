import { useState } from "react";

import {
  collection,
  doc,
  getDocs,
  deleteDoc,
  setDoc,
  increment,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "../../context/firebase";

function ResetOrders() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const resetAllOrders = async () => {
    const firstConfirm = window.confirm(
      "WARNING!\n\nThis will permanently delete ALL CampusMart orders and reverse their related seller earnings and product sales.\n\nAre you absolutely sure?"
    );

    if (!firstConfirm) {
      return;
    }

    const secondConfirm = window.confirm(
      "FINAL WARNING!\n\nALL existing orders will be removed.\n\nSeller balances and product sales related to those orders will also be reversed.\n\nContinue?"
    );

    if (!secondConfirm) {
      return;
    }

    setLoading(true);
    setMessage("");
    setError("");

    try {
      // =====================================================
      // 1. LOAD ALL ORDERS
      // =====================================================

      const ordersSnapshot = await getDocs(
        collection(db, "orders")
      );

      const orders = ordersSnapshot.docs.map((orderDoc) => ({
        id: orderDoc.id,
        ...orderDoc.data(),
      }));

      console.log(
        `Found ${orders.length} orders to reset.`
      );

      // =====================================================
      // 2. CALCULATE SELLER REVERSALS
      // =====================================================

      const sellerReversals = {};

      // =====================================================
      // 3. CALCULATE PRODUCT SALES REVERSALS
      // =====================================================

      const productSalesReversals = {};

      // =====================================================
      // 4. PROCESS EVERY ORDER
      // =====================================================

      for (const order of orders) {
        const sellerId = order.sellerId
          ? String(order.sellerId)
          : "";

        const sellerAmount =
          Number(order.sellerAmount) || 0;

        const total =
          Number(order.total) || 0;

        const platformFee =
          Number(order.platformFee) || 0;

        // ===================================================
        // SELLER REVERSAL
        // ===================================================

        if (sellerId) {
          if (!sellerReversals[sellerId]) {
            sellerReversals[sellerId] = {
              availableBalance: 0,
              totalEarnings: 0,
              totalSalesGross: 0,
              totalPlatformFees: 0,
            };
          }

          sellerReversals[sellerId]
            .availableBalance += sellerAmount;

          sellerReversals[sellerId]
            .totalEarnings += sellerAmount;

          sellerReversals[sellerId]
            .totalSalesGross += total;

          sellerReversals[sellerId]
            .totalPlatformFees += platformFee;
        }

        // ===================================================
        // PRODUCT SALES REVERSAL
        // ===================================================

        const items = Array.isArray(order.items)
          ? order.items
          : [];

        for (const item of items) {
          const productId =
            item?.id ||
            item?.productId ||
            null;

          if (!productId) {
            continue;
          }

          const quantity =
            Number(item.quantity) || 1;

          const normalizedProductId =
            String(productId);

          if (
            !productSalesReversals[
              normalizedProductId
            ]
          ) {
            productSalesReversals[
              normalizedProductId
            ] = 0;
          }

          productSalesReversals[
            normalizedProductId
          ] += quantity;
        }
      }

      // =====================================================
      // 5. DELETE ORDERS
      // =====================================================

      let deletedOrders = 0;

      for (const orderDoc of ordersSnapshot.docs) {
        await deleteDoc(orderDoc.ref);

        deletedOrders += 1;
      }

      console.log(
        `Deleted ${deletedOrders} orders.`
      );

      // =====================================================
      // 6. DELETE EARNINGS CONNECTED TO ORDERS
      // =====================================================

      const earningsSnapshot = await getDocs(
        collection(db, "earnings")
      );

      let deletedEarnings = 0;

      const orderIds = new Set(
        orders.map((order) => String(order.id))
      );

      for (const earningDoc of earningsSnapshot.docs) {
        const earning = earningDoc.data();

        const earningOrderId =
          earning.orderId
            ? String(earning.orderId)
            : "";

        if (
          earningOrderId &&
          orderIds.has(earningOrderId)
        ) {
          await deleteDoc(earningDoc.ref);

          deletedEarnings += 1;
        }
      }

      console.log(
        `Deleted ${deletedEarnings} earnings records.`
      );

      // =====================================================
      // 7. REVERSE SELLER BALANCES
      // =====================================================

      let sellersUpdated = 0;

      for (const sellerId of Object.keys(
        sellerReversals
      )) {
        const reversal =
          sellerReversals[sellerId];

        const sellerRef = doc(
          db,
          "users",
          sellerId
        );

        await setDoc(
          sellerRef,
          {
            availableBalance: increment(
              -reversal.availableBalance
            ),

            totalEarnings: increment(
              -reversal.totalEarnings
            ),

            totalSalesGross: increment(
              -reversal.totalSalesGross
            ),

            totalPlatformFees: increment(
              -reversal.totalPlatformFees
            ),

            updatedAt: serverTimestamp(),
          },
          {
            merge: true,
          }
        );

        sellersUpdated += 1;
      }

      console.log(
        `Updated ${sellersUpdated} sellers.`
      );

      // =====================================================
      // 8. REVERSE PRODUCT SALES
      // =====================================================

      let productsUpdated = 0;

      for (const productId of Object.keys(
        productSalesReversals
      )) {
        const quantity =
          productSalesReversals[productId];

        const productRef = doc(
          db,
          "products",
          productId
        );

        await setDoc(
          productRef,
          {
            sales: increment(-quantity),

            updatedAt: serverTimestamp(),
          },
          {
            merge: true,
          }
        );

        productsUpdated += 1;
      }

      console.log(
        `Updated ${productsUpdated} products.`
      );

      // =====================================================
      // 9. CLEAR CUSTOMER ORDER ARRAYS
      // =====================================================

      const usersSnapshot = await getDocs(
        collection(db, "users")
      );

      let customersCleared = 0;

      for (const userDoc of usersSnapshot.docs) {
        const customerDataRef = doc(
          db,
          "users",
          userDoc.id,
          "customerData",
          "main"
        );

        await setDoc(
          customerDataRef,
          {
            orders: [],

            updatedAt: serverTimestamp(),
          },
          {
            merge: true,
          }
        );

        customersCleared += 1;
      }

      console.log(
        `Cleared orders for ${customersCleared} users.`
      );

      // =====================================================
      // 10. SUCCESS
      // =====================================================

      setMessage(
        `RESET COMPLETE! Deleted ${deletedOrders} orders, ${deletedEarnings} earnings records, reversed ${sellersUpdated} sellers, updated ${productsUpdated} products, and cleared orders for ${customersCleared} users.`
      );
    } catch (err) {
      console.error(
        "RESET ORDERS ERROR:",
        err
      );

      setError(
        err?.message ||
          "Something went wrong while resetting the orders."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-8">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-red-50 text-red-600 flex items-center justify-center text-3xl">
              ⚠️
            </div>

            <h1 className="text-2xl font-bold text-gray-800 mt-5">
              Reset CampusMart Orders
            </h1>

            <p className="text-gray-500 mt-2 max-w-xl mx-auto">
              This tool is for clearing old/test order
              data so you can start creating fresh orders.
            </p>
          </div>

          {/* ================================================= */}
          {/* WHAT WILL BE RESET */}
          {/* ================================================= */}

          <div className="mt-8 bg-gray-50 rounded-xl p-5">
            <h2 className="font-bold text-gray-800">
              This will reset:
            </h2>

            <ul className="mt-3 space-y-2 text-sm text-gray-600">
              <li>• All documents in the orders collection</li>
              <li>• Earnings records connected to those orders</li>
              <li>• Seller earnings generated by those orders</li>
              <li>• Seller sales totals generated by those orders</li>
              <li>• Product sales generated by those orders</li>
              <li>• Buyer order history</li>
            </ul>
          </div>

          {/* ================================================= */}
          {/* WARNING */}
          {/* ================================================= */}

          <div className="mt-5 bg-red-50 border border-red-100 rounded-xl p-5">
            <p className="text-sm text-red-700 font-medium">
              This operation cannot be undone. Only run this
              if you are intentionally removing your old/test
              orders.
            </p>
          </div>

          {/* ================================================= */}
          {/* RESET BUTTON */}
          {/* ================================================= */}

          <button
            type="button"
            onClick={resetAllOrders}
            disabled={loading}
            className="
              w-full
              mt-7
              bg-red-600
              hover:bg-red-700
              disabled:bg-gray-400
              text-white
              py-3.5
              rounded-xl
              font-bold
              transition
            "
          >
            {loading
              ? "Resetting Orders..."
              : "DELETE ALL ORDERS & START FRESH"}
          </button>

          {/* ================================================= */}
          {/* SUCCESS */}
          {/* ================================================= */}

          {message && (
            <div className="mt-6 bg-green-50 border border-green-100 rounded-xl p-5">
              <p className="text-sm text-green-700 font-medium">
                {message}
              </p>
            </div>
          )}

          {/* ================================================= */}
          {/* ERROR */}
          {/* ================================================= */}

          {error && (
            <div className="mt-6 bg-red-50 border border-red-100 rounded-xl p-5">
              <p className="text-sm text-red-700 font-medium">
                {error}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ResetOrders;