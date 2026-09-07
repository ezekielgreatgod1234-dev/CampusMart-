import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  FiHeart,
  FiShoppingCart,
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

  const productName = product?.name || "Untitled Product";

  const productCategory = product?.category || "Other";

  const productDescription = product?.description || "";

  const productSeller = product?.sellerName || "CampusMart Seller";

  // =====================================================
  // IMAGE
  // =====================================================

  const productImage =
    product?.image ||
    product?.imageUrl ||
    (Array.isArray(product?.images) ? product.images[0] : null);

  // =====================================================
  // PRICE
  // =====================================================

  const productPrice = Number(product?.price || 0);

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
      if (typeof value === "number" && Number.isFinite(value)) {
        return Math.max(0, value);
      }

      if (typeof value === "string" && value.trim() !== "") {
        const parsed = Number(value.replace(/[₦,\s]/g, ""));
        if (Number.isFinite(parsed)) {
          return Math.max(0, parsed);
        }
      }
    }

    // No stock field → unknown (do not invent 1)
    return null;
  };

  const productStock = getStockValue(); // number | null

  // =====================================================
  // STATUS
  // =====================================================

  const productStatus = String(product?.status || "active").toLowerCase();

  const productAvailability = String(
    product?.availability || "available"
  ).toLowerCase();

  const isDeleted =
    productStatus === "deleted" ||
    productStatus === "inactive" ||
    productStatus === "archived" ||
    productStatus === "out of stock";

  const isUnavailable =
    productAvailability === "unavailable" ||
    productAvailability === "out_of_stock" ||
    productAvailability === "out-of-stock";

  const isAvailable =
    !isDeleted &&
    !isUnavailable &&
    (productStock === null || productStock > 0);

  const isOutOfStock =
    !isDeleted &&
    (isUnavailable ||
      productStatus === "out of stock" ||
      (productStock !== null && productStock <= 0));

  // =====================================================
  // WISHLIST
  // =====================================================

  const isWishlisted = wishlist.includes(productId);

  // =====================================================
  // PRICE FORMAT
  // =====================================================

  const formattedPrice = `₦${productPrice.toLocaleString("en-NG")}`;

  // =====================================================
  // NEW PRODUCT
  // =====================================================

  const isNewProduct = (() => {
    if (!product?.createdAt) {
      return false;
    }

    let createdTime = 0;

    if (typeof product.createdAt.toMillis === "function") {
      createdTime = product.createdAt.toMillis();
    } else if (product.createdAt instanceof Date) {
      createdTime = product.createdAt.getTime();
    } else if (
      typeof product.createdAt === "object" &&
      product.createdAt?.seconds !== undefined
    ) {
      createdTime = Number(product.createdAt.seconds) * 1000;
    } else {
      const parsed = new Date(product.createdAt).getTime();
      createdTime = Number.isNaN(parsed) ? 0 : parsed;
    }

    if (!createdTime) {
      return false;
    }

    const sevenDays = 7 * 24 * 60 * 60 * 1000;

    return Date.now() - createdTime <= sevenDays;
  })();

  // =====================================================
  // ADD TO CART
  // =====================================================

  const handleAddToCart = (e) => {
    e.stopPropagation();

    if (!productId) return;
    if (!isAvailable) return;

    if (typeof addToCart !== "function") {
      console.error("addToCart function was not provided.");
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

    if (!productId) return;

    if (typeof toggleWishlist === "function") {
      toggleWishlist(productId);
    }
  };

  // =====================================================
  // OPEN PRODUCT DETAILS
  // =====================================================

  const handleProductClick = () => {
    if (!productId) {
      console.error("Cannot open product: product ID is missing.");
      return;
    }

    navigate(`/products/${productId}`);
  };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div
      onClick={handleProductClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleProductClick();
        }
      }}
      className="
        bg-white rounded-2xl overflow-hidden border border-gray-100
        shadow-sm hover:shadow-lg transition duration-300 cursor-pointer group
      "
    >
      {/* IMAGE */}
      <div className="relative bg-gray-100 overflow-hidden">
        {productImage ? (
          <img
            src={productImage}
            alt={productName}
            onError={(e) => {
              e.currentTarget.style.display = "none";

              const fallback =
                e.currentTarget.parentElement?.querySelector(
                  ".product-image-fallback"
                );

              if (fallback) {
                fallback.classList.remove("hidden");
              }
            }}
            className="
              w-full h-40 sm:h-48 md:h-52 object-cover
              group-hover:scale-105 transition duration-300
            "
          />
        ) : null}

        <div
          className={`
            product-image-fallback
            ${productImage ? "hidden" : "flex"}
            w-full h-40 sm:h-48 md:h-52
            items-center justify-center bg-gray-100
          `}
        >
          <div className="flex flex-col items-center justify-center text-gray-400">
            <FiImage size={34} />
            <span className="text-xs mt-2">No image</span>
          </div>
        </div>

        {isNewProduct && (
          <span className="absolute top-3 left-3 bg-white text-green-700 text-xs font-semibold px-3 py-1 rounded-full shadow-sm">
            New
          </span>
        )}

        {isOutOfStock && (
          <span className="absolute bottom-3 left-3 bg-red-500 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-sm">
            Out of stock
          </span>
        )}

        <button
          type="button"
          onClick={handleWishlist}
          aria-label={
            isWishlisted ? "Remove from wishlist" : "Add to wishlist"
          }
          className={`
            absolute top-3 right-3 w-9 h-9 sm:w-10 sm:h-10 rounded-full
            bg-white shadow flex items-center justify-center transition
            ${
              isWishlisted
                ? "text-red-500 bg-red-50"
                : "text-gray-600 hover:text-red-500 hover:bg-red-50"
            }
          `}
        >
          <FiHeart className={isWishlisted ? "fill-red-500" : ""} />
        </button>
      </div>

      {/* CONTENT */}
      <div className="p-3 sm:p-4">
        <p className="text-xs sm:text-sm text-green-600 font-medium">
          {productCategory}
        </p>

        <h3
          title={productName}
          className="
            font-semibold text-sm sm:text-base text-gray-800 mt-1 truncate
            group-hover:text-green-600 transition
          "
        >
          {productName}
        </h3>

        <p
          className="text-xs text-gray-400 mt-1 truncate"
          title={productSeller}
        >
          {productSeller}
        </p>

        {productDescription && (
          <p className="text-xs text-gray-400 mt-2 line-clamp-2">
            {productDescription}
          </p>
        )}

        {/* STOCK — only when we know a low number */}
        {isAvailable &&
          productStock !== null &&
          productStock > 0 &&
          productStock <= 5 && (
            <p className="text-xs text-orange-500 font-medium mt-2">
              Only {productStock} left
            </p>
          )}

        {/* PRICE + CART */}
        <div className="flex items-center justify-between gap-2 mt-3">
          <div className="min-w-0">
            <p className="text-xs text-gray-400">Price</p>
            <h2 className="font-bold text-sm sm:text-lg text-gray-900 truncate">
              {formattedPrice}
            </h2>
          </div>

          <button
            type="button"
            disabled={!isAvailable || added}
            onClick={handleAddToCart}
            className={`
              shrink-0 flex items-center justify-center gap-2
              h-9 sm:h-10 px-3 sm:px-4 rounded-xl transition
              text-xs sm:text-sm font-medium
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
                <span>Added</span>
              </>
            ) : !isAvailable ? (
              <span>Unavailable</span>
            ) : (
              <>
                <FiShoppingCart />
                <span className="hidden sm:inline">Add</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProductCard;