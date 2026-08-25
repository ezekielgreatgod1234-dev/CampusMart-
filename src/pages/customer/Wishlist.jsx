import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  FiHeart,
  FiShoppingCart,
  FiTrash2,
  FiArrowLeft,
  FiLoader,
} from "react-icons/fi";

import {
  collection,
  onSnapshot,
} from "firebase/firestore";

import CustomerLayout from "../../layouts/CustomerLayout";
import { db } from "../../context/firebase";

function Wishlist({
  wishlist = [],
  removeFromWishlist,
  addToCart,
  cartCount = 0,
}) {
  const navigate = useNavigate();

  // =====================================================
  // PRODUCTS FROM FIRESTORE
  // =====================================================

  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] =
    useState(true);
  const [productError, setProductError] =
    useState("");

  // =====================================================
  // LOAD REAL SELLER PRODUCTS
  // =====================================================

  useEffect(() => {
    const productsRef = collection(
      db,
      "products"
    );

    const unsubscribe = onSnapshot(
      productsRef,
      (snapshot) => {
        const loadedProducts =
          snapshot.docs.map((productDoc) => {
            const data =
              productDoc.data();

            return {
              id: productDoc.id,

              name:
                data.name ||
                "Unnamed Product",

              category:
                data.category ||
                "Other",

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
          });

        setProducts(loadedProducts);
        setLoadingProducts(false);
        setProductError("");
      },
      (error) => {
        console.error(
          "Error loading products:",
          error
        );

        setProductError(
          "Unable to load your saved products."
        );

        setLoadingProducts(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // =====================================================
  // REMOVE OLD / INVALID DUMMY WISHLIST ITEMS
  // =====================================================

  useEffect(() => {
    if (loadingProducts) {
      return;
    }

    const realProductIds = new Set(
      products.map((product) =>
        String(product.id)
      )
    );

    const invalidWishlistIds =
      wishlist.filter(
        (wishlistId) =>
          !realProductIds.has(
            String(wishlistId)
          )
      );

    // Remove old dummy IDs.
    invalidWishlistIds.forEach(
      (invalidId) => {
        removeFromWishlist(invalidId);
      }
    );
  }, [
    products,
    wishlist,
    loadingProducts,
    removeFromWishlist,
  ]);

  // =====================================================
  // GET ONLY REAL WISHLIST PRODUCTS
  // =====================================================

  const wishlistProducts =
    products.filter((product) =>
      wishlist.some(
        (wishlistId) =>
          String(wishlistId) ===
          String(product.id)
      )
    );

  // =====================================================
  // FORMAT PRICE
  // =====================================================

  const formatPrice = (price) => {
    const numericPrice = Number(
      String(price).replace(/[₦,]/g, "")
    );

    return `₦${
      Number.isFinite(numericPrice)
        ? numericPrice.toLocaleString()
        : "0"
    }`;
  };

  // =====================================================
  // IMAGE FALLBACK
  // =====================================================

  const getProductImage = (product) => {
    if (product.image) {
      return product.image;
    }

    return "/placeholder-product.png";
  };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <CustomerLayout
      cartCount={cartCount}
    >
      <div className="space-y-6">

        {/* =================================================
            HEADER
        ================================================= */}

        <div>

          <button
            type="button"
            onClick={() =>
              navigate(
                "/browse-products"
              )
            }
            className="
              flex
              items-center
              gap-2
              text-gray-500
              hover:text-green-600
              transition
            "
          >
            <FiArrowLeft size={18} />

            Back to Products
          </button>

          <div className="mt-5">

            <h1
              className="
                text-2xl
                sm:text-3xl
                font-bold
                text-gray-800
              "
            >
              My Wishlist
            </h1>

            <p className="text-gray-500 mt-1">
              Products you've saved for later.
            </p>

          </div>

        </div>

        {/* =================================================
            LOADING
        ================================================= */}

        {loadingProducts && (
          <div
            className="
              bg-white
              rounded-2xl
              border
              border-gray-100
              p-12
              text-center
            "
          >

            <FiLoader
              size={30}
              className="
                mx-auto
                text-green-600
                animate-spin
              "
            />

            <p className="mt-4 text-gray-500">
              Loading your wishlist...
            </p>

          </div>
        )}

        {/* =================================================
            ERROR
        ================================================= */}

        {!loadingProducts &&
          productError && (
            <div
              className="
                bg-white
                rounded-2xl
                border
                border-red-100
                p-10
                text-center
              "
            >

              <div
                className="
                  w-16
                  h-16
                  mx-auto
                  rounded-full
                  bg-red-50
                  text-red-500
                  flex
                  items-center
                  justify-center
                "
              >
                <FiHeart size={28} />
              </div>

              <h2
                className="
                  text-xl
                  font-bold
                  text-gray-800
                  mt-4
                "
              >
                Something went wrong
              </h2>

              <p className="text-gray-500 mt-2">
                {productError}
              </p>

            </div>
          )}

        {/* =================================================
            EMPTY WISHLIST
        ================================================= */}

        {!loadingProducts &&
          !productError &&
          wishlistProducts.length === 0 && (
            <div
              className="
                bg-white
                rounded-2xl
                border
                border-gray-100
                p-10
                sm:p-16
                text-center
              "
            >

              <div
                className="
                  w-20
                  h-20
                  mx-auto
                  rounded-full
                  bg-green-50
                  text-green-600
                  flex
                  items-center
                  justify-center
                "
              >
                <FiHeart size={35} />
              </div>

              <h2
                className="
                  text-2xl
                  font-bold
                  text-gray-800
                  mt-5
                "
              >
                Your Wishlist is Empty
              </h2>

              <p
                className="
                  text-gray-500
                  mt-2
                  max-w-md
                  mx-auto
                "
              >
                Save products you love and
                come back to them later.
              </p>

              <button
                type="button"
                onClick={() =>
                  navigate(
                    "/browse-products"
                  )
                }
                className="
                  mt-6
                  bg-green-600
                  hover:bg-green-700
                  text-white
                  px-6
                  py-3
                  rounded-xl
                  font-medium
                  transition
                "
              >
                Browse Products
              </button>

            </div>
          )}

        {/* =================================================
            WISHLIST PRODUCTS
        ================================================= */}

        {!loadingProducts &&
          !productError &&
          wishlistProducts.length > 0 && (
            <>

              {/* =================================================
                  COUNT
              ================================================= */}

              <div
                className="
                  flex
                  items-center
                  justify-between
                  bg-white
                  border
                  border-gray-100
                  rounded-2xl
                  p-4
                "
              >

                <div>

                  <p
                    className="
                      font-semibold
                      text-gray-800
                    "
                  >
                    Saved Products
                  </p>

                  <p
                    className="
                      text-sm
                      text-gray-500
                      mt-1
                    "
                  >
                    {wishlistProducts.length}{" "}
                    {wishlistProducts.length === 1
                      ? "product"
                      : "products"}{" "}
                    saved
                  </p>

                </div>

                <div
                  className="
                    w-11
                    h-11
                    rounded-xl
                    bg-green-50
                    text-green-600
                    flex
                    items-center
                    justify-center
                  "
                >
                  <FiHeart size={20} />
                </div>

              </div>

              {/* =================================================
                  PRODUCT GRID
              ================================================= */}

              <section
                className="
                  grid
                  grid-cols-2
                  sm:grid-cols-2
                  md:grid-cols-3
                  xl:grid-cols-4
                  gap-3
                  sm:gap-5
                "
              >

                {wishlistProducts.map(
                  (product) => {

                    const price =
                      Number(
                        product.price
                      ) || 0;

                    return (
                      <div
                        key={product.id}
                        className="
                          bg-white
                          rounded-2xl
                          border
                          border-gray-100
                          overflow-hidden
                          group
                          transition
                          hover:shadow-md
                        "
                      >

                        {/* =================================================
                            IMAGE
                        ================================================= */}

                        <div
                          className="
                            relative
                            cursor-pointer
                            bg-gray-100
                            overflow-hidden
                          "
                          onClick={() =>
                            navigate(
                              `/products/${product.id}`
                            )
                          }
                        >

                          <img
                            src={getProductImage(
                              product
                            )}
                            alt={
                              product.name
                            }
                            className="
                              w-full
                              h-44
                              sm:h-52
                              object-cover
                              group-hover:scale-105
                              transition
                              duration-300
                            "
                            onError={(event) => {
                              event.currentTarget.src =
                                "/placeholder-product.png";
                            }}
                          />

                          {/* =================================================
                              REMOVE
                          ================================================= */}

                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();

                              removeFromWishlist(
                                product.id
                              );
                            }}
                            className="
                              absolute
                              top-3
                              right-3
                              w-9
                              h-9
                              rounded-full
                              bg-white
                              shadow
                              flex
                              items-center
                              justify-center
                              text-red-500
                              hover:bg-red-50
                              transition
                            "
                            title="Remove from wishlist"
                          >
                            <FiTrash2
                              size={17}
                            />
                          </button>

                        </div>

                        {/* =================================================
                            PRODUCT DETAILS
                        ================================================= */}

                        <div className="p-4">

                          <p
                            className="
                              text-xs
                              text-green-600
                              font-medium
                            "
                          >
                            {product.category}
                          </p>

                          <h3
                            onClick={() =>
                              navigate(
                                `/products/${product.id}`
                              )
                            }
                            className="
                              font-semibold
                              text-gray-800
                              mt-1
                              cursor-pointer
                              hover:text-green-600
                              transition
                              line-clamp-2
                            "
                          >
                            {product.name}
                          </h3>

                          {/* SELLER */}

                          {product.sellerName && (
                            <p
                              className="
                                text-xs
                                text-gray-400
                                mt-2
                                truncate
                              "
                            >
                              Sold by{" "}
                              {product.sellerName}
                            </p>
                          )}

                          {/* PRICE */}

                          <div
                            className="
                              flex
                              items-center
                              justify-between
                              mt-4
                            "
                          >

                            <p
                              className="
                                text-lg
                                font-bold
                                text-gray-900
                              "
                            >
                              {formatPrice(
                                price
                              )}
                            </p>

                          </div>

                          {/* =================================================
                              ADD TO CART
                          ================================================= */}

                          <button
                            type="button"
                            onClick={() =>
                              addToCart(
                                product
                              )
                            }
                            className="
                              w-full
                              mt-4
                              flex
                              items-center
                              justify-center
                              gap-2
                              bg-green-600
                              hover:bg-green-700
                              text-white
                              py-2.5
                              rounded-xl
                              text-sm
                              font-medium
                              transition
                            "
                          >

                            <FiShoppingCart
                              size={16}
                            />

                            Add to Cart

                          </button>

                        </div>

                      </div>
                    );
                  }
                )}

              </section>

            </>
          )}

      </div>
    </CustomerLayout>
  );
}

export default Wishlist;