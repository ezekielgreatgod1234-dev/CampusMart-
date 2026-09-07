import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  query,
  limit,
} from "firebase/firestore";

import { db } from "../../context/firebase";
import ProductCard from "./ProductCard";

function isCurrentlyBoosted(product) {
  if (product?.isPromoted !== true) return false;

  const until = product.promotedUntil;
  if (!until) return false;

  let untilMs = 0;
  if (typeof until.toMillis === "function") {
    untilMs = until.toMillis();
  } else if (until.seconds != null) {
    untilMs = Number(until.seconds) * 1000;
  } else {
    untilMs = new Date(until).getTime() || 0;
  }

  return untilMs > Date.now();
}

function getPromotedAtMs(product) {
  const at = product?.promotedAt;
  if (!at) return 0;
  if (typeof at.toMillis === "function") return at.toMillis();
  if (at.seconds != null) return Number(at.seconds) * 1000;
  return new Date(at).getTime() || 0;
}

function getCreatedAtMs(product) {
  const at = product?.createdAt;
  if (!at) return 0;
  if (typeof at.toMillis === "function") return at.toMillis();
  if (at.seconds != null) return Number(at.seconds) * 1000;
  return new Date(at).getTime() || 0;
}

function RecommendedProducts({
  addToCart,
  wishlist = [],
  toggleWishlist,
}) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    // Load more than we show so boosted items are not missed by limit alone
    const productsQuery = query(collection(db, "products"), limit(80));

    const unsubscribe = onSnapshot(
      productsQuery,
      (snapshot) => {
        const sellerProducts = snapshot.docs
          .map((productDoc) => {
            const data = productDoc.data() || {};

            return {
              id: productDoc.id,
              name: data.name || "Unnamed Product",
              category: data.category || "Other",
              price: Number(data.price) || 0,
              description: data.description || "",
              image: data.image || data.imageUrl || "",
              status: data.status || "Active",
              sales: Number(data.sales) || 0,
              sellerId: data.sellerId || "",
              sellerName: data.sellerName || "CampusMart Seller",
              sellerEmail: data.sellerEmail || "",
              createdAt: data.createdAt || null,
              updatedAt: data.updatedAt || null,
              // promotion fields
              isPromoted: data.isPromoted === true,
              promotedUntil: data.promotedUntil || null,
              promotedAt: data.promotedAt || null,
            };
          })
          .filter((product) => {
            const status = String(product.status || "").toLowerCase();
            return (
              status !== "out of stock" &&
              status !== "deleted" &&
              status !== "inactive" &&
              status !== "archived"
            );
          })
          .sort((a, b) => {
            const aBoosted = isCurrentlyBoosted(a);
            const bBoosted = isCurrentlyBoosted(b);

            if (aBoosted && !bBoosted) return -1;
            if (!aBoosted && bBoosted) return 1;

            if (aBoosted && bBoosted) {
              return getPromotedAtMs(b) - getPromotedAtMs(a);
            }

            return getCreatedAtMs(b) - getCreatedAtMs(a);
          })
          .slice(0, 20);

        setProducts(sellerProducts);
        setLoading(false);
        setError("");
      },
      (firebaseError) => {
        console.error("Error loading recommended products:", firebaseError);
        setError("Unable to load recommended products.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return (
    <section className="bg-white rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800">
          Recommended Products
        </h2>
        <button type="button" className="text-green-600 hover:underline font-medium">
          View All
        </button>
      </div>

      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="border border-gray-100 rounded-2xl overflow-hidden animate-pulse"
            >
              <div className="h-48 bg-gray-100" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-gray-100 rounded w-3/4" />
                <div className="h-4 bg-gray-100 rounded w-1/2" />
                <div className="h-6 bg-gray-100 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="py-10 text-center">
          <p className="text-sm text-red-500">{error}</p>
        </div>
      )}

      {!loading && !error && products.length === 0 && (
        <div className="py-12 text-center">
          <div className="text-4xl mb-3">🛍️</div>
          <h3 className="text-lg font-semibold text-gray-800">
            No products available yet
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Products added by CampusMart sellers will appear here.
          </p>
        </div>
      )}

      {!loading && !error && products.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              addToCart={addToCart}
              wishlist={wishlist}
              toggleWishlist={toggleWishlist}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export default RecommendedProducts;