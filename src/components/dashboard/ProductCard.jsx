import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  FiHeart,
  FiShoppingCart,
  FiStar,
  FiCheck,
  FiImage,
} from "react-icons/fi";

function ProductCard({
  product,
  addToCart,
  wishlist = [],
  toggleWishlist,
}) {
  const navigate = useNavigate();

  const [added, setAdded] = useState(false);

  // =====================================================
  // SAFE PRODUCT VALUES
  // =====================================================

  const productId = product?.id || "";

  const productName =
    product?.name || "Untitled Product";

  const productCategory =
    product?.category || "Other";

  const productDescription =
    product?.description || "";

  const productSeller =
    product?.sellerName || "CampusMart Seller";

  // =====================================================
  // IMAGE
  // =====================================================

  const productImage =
    product?.image ||
    product?.imageUrl ||
    (Array.isArray(product?.images)
      ? product.images[0]
      : null);

  // =====================================================
  // PRICE
  // =====================================================

  const productPrice = Number(
    product?.price || 0
  );

  // =====================================================
  // RATING
  // =====================================================

  const productRating = Number(
    product?.rating || 0
  );

  const productReviews = Number(
    product?.reviews || 0
  );

  // =====================================================
  // STOCK
  // =====================================================

  const getStockValue = () => {
    const stockCandidates = [
      product?.stock,
      product?.stockQuantity,
      product?.quantity,
      product?.inventory,
      product?.availableStock,
      product?.availableQuantity,
    ];

    for (const value of stockCandidates) {
      if (
        typeof value === "number" &&
        Number.isFinite(value)
      ) {
        return Math.max(0, value);
      }

      if (
        typeof value === "string" &&
        value.trim() !== ""
      ) {
        const parsed = Number(
          value.replace(/[₦,\s]/g, "")
        );

        if (Number.isFinite(parsed)) {
          return Math.max(0, parsed);
        }
      }
    }

    // ---------------------------------------------------
    // If no stock field exists but the seller marked the
    // product active/available, don't incorrectly show
    // the product as out of stock.
    // ---------------------------------------------------

    const status = String(
      product?.status || "active"
    ).toLowerCase();

    const availability = String(
      product?.availability || "available"
    ).toLowerCase();

    if (
      status === "active" &&
      availability !== "unavailable" &&
      availability !== "out_of_stock" &&
      availability !== "out-of-stock"
    ) {
      return 1;
    }

    return 0;
  };

  const productStock = getStockValue();

  // =====================================================
  // STATUS
  // =====================================================

  const productStatus = String(
    product?.status || "active"
  ).toLowerCase();

  const productAvailability = String(
    product?.availability || "available"
  ).toLowerCase();

  const isDeleted =
    productStatus === "deleted" ||
    productStatus === "inactive" ||
    productStatus === "archived";

  const isUnavailable =
    productAvailability === "unavailable" ||
    productAvailability === "out_of_stock" ||
    productAvailability === "out-of-stock";

  const isAvailable =
    !isDeleted &&
    !isUnavailable &&
    productStock > 0;

  const isOutOfStock =
    !isDeleted &&
    (isUnavailable || productStock <= 0);

  // =====================================================
  // WISHLIST
  // =====================================================

  const isWishlisted =
    wishlist.includes(productId);

  // =====================================================
  // PRICE FORMAT
  // =====================================================

  const formattedPrice =
    `₦${productPrice.toLocaleString("en-NG")}`;

  // =====================================================
  // NEW PRODUCT
  // =====================================================

  const isNewProduct = (() => {
    if (!product?.createdAt) {
      return false;
    }

    let createdTime = 0;

    // Firestore Timestamp
    if (
      typeof product.createdAt.toMillis ===
      "function"
    ) {
      createdTime =
        product.createdAt.toMillis();
    }

    // JavaScript Date
    else if (
      product.createdAt instanceof Date
    ) {
      createdTime =
        product.createdAt.getTime();
    }

    // Timestamp-like object
    else if (
      typeof product.createdAt === "object" &&
      product.createdAt?.seconds !== undefined
    ) {
      createdTime =
        Number(product.createdAt.seconds) * 1000;
    }

    // String / number
    else {
      const parsed = new Date(
        product.createdAt
      ).getTime();

      createdTime = Number.isNaN(parsed)
        ? 0
        : parsed;
    }

    if (!createdTime) {
      return false;
    }

    const sevenDays =
      7 * 24 * 60 * 60 * 1000;

    return (
      Date.now() - createdTime <= sevenDays
    );
  })();

  // =====================================================
  // ADD TO CART
  // =====================================================

  const handleAddToCart = (e) => {
    e.stopPropagation();

    if (!productId) {
      return;
    }

    if (!isAvailable) {
      return;
    }

    if (typeof addToCart !== "function") {
      console.error(
        "addToCart function was not provided."
      );

      return;
    }

    addToCart(product, 1);

    setAdded(true);

    setTimeout(() => {
      setAdded(false);
    }, 2000);
  };

  // =====================================================
  // WISHLIST
  // =====================================================

  const handleWishlist = (e) => {
    e.stopPropagation();

    if (!productId) {
      return;
    }

    if (
      typeof toggleWishlist === "function"
    ) {
      toggleWishlist(productId);
    }
  };

  // =====================================================
  // OPEN PRODUCT DETAILS
  //
  // IMPORTANT:
  // Firebase product document ID is used here.
  //
  // Example:
  //
  // products
  //   └── abc123
  //
  // Clicking the card opens:
  //
  // /products/abc123
  //
  // =====================================================

  const handleProductClick = () => {
    if (!productId) {
      console.error(
        "Cannot open product: product ID is missing."
      );

      return;
    }

    navigate(`/products/${productId}`);
  };

  // =====================================================
  // RATING
  // =====================================================

  const ratingValue = Math.max(
    0,
    Math.min(5, productRating)
  );

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div
      onClick={handleProductClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (
          e.key === "Enter" ||
          e.key === " "
        ) {
          e.preventDefault();
          handleProductClick();
        }
      }}
      className="
        bg-white
        rounded-2xl
        overflow-hidden
        border
        border-gray-100
        shadow-sm
        hover:shadow-lg
        transition
        duration-300
        cursor-pointer
        group
      "
    >
      {/* =================================================
          IMAGE
      ================================================= */}

      <div
        className="
          relative
          bg-gray-100
          overflow-hidden
        "
      >
        {productImage ? (
          <img
            src={productImage}
            alt={productName}
            onError={(e) => {
              e.currentTarget.style.display =
                "none";

              const fallback =
                e.currentTarget.parentElement?.querySelector(
                  ".product-image-fallback"
                );

              if (fallback) {
                fallback.classList.remove(
                  "hidden"
                );
              }
            }}
            className="
              w-full
              h-40
              sm:h-48
              md:h-52
              object-cover
              group-hover:scale-105
              transition
              duration-300
            "
          />
        ) : null}

        {/* IMAGE FALLBACK */}

        <div
          className={`
            product-image-fallback
            ${
              productImage
                ? "hidden"
                : "flex"
            }
            w-full
            h-40
            sm:h-48
            md:h-52
            items-center
            justify-center
            bg-gray-100
          `}
        >
          <div
            className="
              flex
              flex-col
              items-center
              justify-center
              text-gray-400
            "
          >
            <FiImage size={34} />

            <span
              className="
                text-xs
                mt-2
              "
            >
              No image
            </span>
          </div>
        </div>

        {/* =================================================
            NEW BADGE
        ================================================= */}

        {isNewProduct && (
          <span
            className="
              absolute
              top-3
              left-3
              bg-white
              text-green-700
              text-xs
              font-semibold
              px-3
              py-1
              rounded-full
              shadow-sm
            "
          >
            New
          </span>
        )}

        {/* =================================================
            OUT OF STOCK
        ================================================= */}

        {isOutOfStock && (
          <span
            className="
              absolute
              bottom-3
              left-3
              bg-red-500
              text-white
              text-xs
              font-semibold
              px-3
              py-1
              rounded-full
              shadow-sm
            "
          >
            Out of stock
          </span>
        )}

        {/* =================================================
            WISHLIST
        ================================================= */}

        <button
          type="button"
          onClick={handleWishlist}
          aria-label={
            isWishlisted
              ? "Remove from wishlist"
              : "Add to wishlist"
          }
          className={`
            absolute
            top-3
            right-3
            w-9
            h-9
            sm:w-10
            sm:h-10
            rounded-full
            bg-white
            shadow
            flex
            items-center
            justify-center
            transition

            ${
              isWishlisted
                ? "text-red-500 bg-red-50"
                : "text-gray-600 hover:text-red-500 hover:bg-red-50"
            }
          `}
        >
          <FiHeart
            className={
              isWishlisted
                ? "fill-red-500"
                : ""
            }
          />
        </button>
      </div>

      {/* =================================================
          CONTENT
      ================================================= */}

      <div
        className="
          p-3
          sm:p-4
        "
      >
        {/* CATEGORY */}

        <p
          className="
            text-xs
            sm:text-sm
            text-green-600
            font-medium
          "
        >
          {productCategory}
        </p>

        {/* NAME */}

        <h3
          title={productName}
          className="
            font-semibold
            text-sm
            sm:text-base
            text-gray-800
            mt-1
            truncate
            group-hover:text-green-600
            transition
          "
        >
          {productName}
        </h3>

        {/* SELLER */}

        <p
          className="
            text-xs
            text-gray-400
            mt-1
            truncate
          "
          title={productSeller}
        >
          {productSeller}
        </p>

        {/* RATING */}

        <div
          className="
            flex
            items-center
            gap-1
            mt-2
          "
        >
          <FiStar
            className="
              text-yellow-500
              fill-yellow-500
            "
            size={15}
          />

          <span
            className="
              text-xs
              sm:text-sm
              text-gray-600
            "
          >
            {ratingValue.toFixed(1)}
          </span>

          <span
            className="
              text-xs
              text-gray-400
            "
          >
            ({productReviews})
          </span>
        </div>

        {/* DESCRIPTION */}

        {productDescription && (
          <p
            className="
              text-xs
              text-gray-400
              mt-2
              line-clamp-2
            "
          >
            {productDescription}
          </p>
        )}

        {/* STOCK */}

        {isAvailable &&
          productStock <= 5 && (
            <p
              className="
                text-xs
                text-orange-500
                font-medium
                mt-2
              "
            >
              Only {productStock} left
            </p>
          )}

        {/* =================================================
            PRICE + CART
        ================================================= */}

        <div
          className="
            flex
            items-center
            justify-between
            gap-2
            mt-3
          "
        >
          {/* PRICE */}

          <div className="min-w-0">
            <p
              className="
                text-xs
                text-gray-400
              "
            >
              Price
            </p>

            <h2
              className="
                font-bold
                text-sm
                sm:text-lg
                text-gray-900
                truncate
              "
            >
              {formattedPrice}
            </h2>
          </div>

          {/* ADD TO CART */}

          <button
            type="button"
            disabled={
              !isAvailable || added
            }
            onClick={handleAddToCart}
            className={`
              shrink-0
              flex
              items-center
              justify-center
              gap-2
              h-9
              sm:h-10
              px-3
              sm:px-4
              rounded-xl
              transition
              text-xs
              sm:text-sm
              font-medium

              ${
                added
                  ? "bg-green-100 text-green-700"
                  : !isAvailable
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-green-600 text-white hover:bg-green-700"
              }
            `}
          >
            {added ? (
              <>
                <FiCheck />

                <span>
                  Added
                </span>
              </>
            ) : !isAvailable ? (
              <span>
                Unavailable
              </span>
            ) : (
              <>
                <FiShoppingCart />

                <span className="hidden sm:inline">
                  Add
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProductCard;