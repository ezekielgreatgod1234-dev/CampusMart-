import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  limit,
} from "firebase/firestore";

import { db } from "../../context/firebase";
import ProductCard from "./ProductCard";

function RecommendedProducts({
  addToCart,
  wishlist = [],
  toggleWishlist,
}) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =====================================================
  // GET PRODUCTS FROM SELLERS
  // =====================================================

  useEffect(() => {
    const productsRef = collection(db, "products");

    // Get the newest products first.
    const productsQuery = query(
      productsRef,
      orderBy("createdAt", "desc"),
      limit(20)
    );

    const unsubscribe = onSnapshot(
      productsQuery,
      (snapshot) => {
        const sellerProducts = snapshot.docs
          .map((productDoc) => {
            const data = productDoc.data();

            return {
              id: productDoc.id,

              name: data.name || "Unnamed Product",

              category:
                data.category || "Other",

              price:
                Number(data.price) || 0,

              description:
                data.description || "",

              image:
                data.image || "",

              status:
                data.status || "Active",

              sales:
                Number(data.sales) || 0,

              sellerId:
                data.sellerId || "",

              sellerName:
                data.sellerName ||
                "CampusMart Seller",

              sellerEmail:
                data.sellerEmail || "",

              createdAt:
                data.createdAt || null,

              updatedAt:
                data.updatedAt || null,
            };
          })
          // Don't show products that are explicitly
          // marked as out of stock.
          .filter(
            (product) =>
              product.status !== "Out of Stock"
          );

        setProducts(sellerProducts);
        setLoading(false);
        setError("");
      },
      (firebaseError) => {
        console.error(
          "Error loading recommended products:",
          firebaseError
        );

        setError(
          "Unable to load recommended products."
        );

        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return (
    <section className="bg-white rounded-2xl p-5 shadow-sm">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="flex items-center justify-between mb-6">

        <h2 className="text-xl font-bold text-gray-800">
          Recommended Products
        </h2>

        <button
          type="button"
          className="text-green-600 hover:underline font-medium"
        >
          View All
        </button>

      </div>

      {/* =================================================
          LOADING
      ================================================= */}

      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">

          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="
                border
                border-gray-100
                rounded-2xl
                overflow-hidden
                animate-pulse
              "
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

      {/* =================================================
          ERROR
      ================================================= */}

      {!loading && error && (
        <div className="py-10 text-center">

          <p className="text-sm text-red-500">
            {error}
          </p>

        </div>
      )}

      {/* =================================================
          NO PRODUCTS
      ================================================= */}

      {!loading &&
        !error &&
        products.length === 0 && (
          <div className="py-12 text-center">

            <div className="text-4xl mb-3">
              🛍️
            </div>

            <h3 className="text-lg font-semibold text-gray-800">
              No products available yet
            </h3>

            <p className="text-sm text-gray-500 mt-1">
              Products added by CampusMart sellers
              will appear here.
            </p>

          </div>
        )}

      {/* =================================================
          PRODUCT GRID
      ================================================= */}

      {!loading &&
        !error &&
        products.length > 0 && (
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