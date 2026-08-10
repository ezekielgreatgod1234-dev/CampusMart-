import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  FiHeart,
  FiShoppingCart,
  FiStar,
  FiCheck,
} from "react-icons/fi";

function ProductCard({ product, addToCart }) {
  const navigate = useNavigate();

  const [added, setAdded] = useState(false);

  const handleAddToCart = (e) => {
    e.stopPropagation();

    addToCart(product, 1);

    setAdded(true);

    setTimeout(() => {
      setAdded(false);
    }, 2000);
  };

  const handleProductClick = () => {
    navigate(`/products/${product.id}`);
  };

  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-lg transition duration-300">

      {/* IMAGE */}
      <div className="relative bg-gray-100">

        <img
          src={product.image}
          alt={product.name}
          onClick={handleProductClick}
          className="
            w-full
            h-40
            sm:h-48
            md:h-52
            object-cover
            cursor-pointer
            hover:scale-105
            transition
            duration-300
          "
        />

        {/* Badge */}
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

        {/* Wishlist */}
        <button
          type="button"
          onClick={(e) => e.stopPropagation()}
          className="
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
            text-gray-600
            hover:text-red-500
            hover:bg-red-50
            transition
          "
        >
          <FiHeart />
        </button>

      </div>

      {/* CONTENT */}
      <div className="p-3 sm:p-4">

        {/* Category */}
        <p className="text-xs sm:text-sm text-green-600 font-medium">
          {product.category}
        </p>

        {/* Name */}
        <h3
          onClick={handleProductClick}
          className="
            font-semibold
            text-sm
            sm:text-base
            text-gray-800
            mt-1
            truncate
            cursor-pointer
            hover:text-green-600
          "
        >
          {product.name}
        </h3>

        {/* Seller */}
        <p className="text-xs text-gray-400 mt-1">
          CampusMart Seller
        </p>

        {/* Rating */}
        <div className="flex items-center gap-1 mt-2">

          <FiStar className="text-yellow-500 fill-yellow-500" />

          <span className="text-xs sm:text-sm text-gray-600">
            {product.rating}
          </span>

          <span className="text-xs text-gray-400">
            (12)
          </span>

        </div>

        {/* PRICE + CART */}
        <div className="flex items-center justify-between gap-2 mt-3">

          {/* Price */}
          <div className="min-w-0">

            <p className="text-xs text-gray-400">
              Price
            </p>

            <h2 className="font-bold text-sm sm:text-lg text-gray-900 truncate">
              {product.price}
            </h2>

          </div>

          {/* ADD TO CART */}
          <button
            type="button"
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