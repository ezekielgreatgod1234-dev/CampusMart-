import { useNavigate } from "react-router-dom";
import {
  FiHeart,
  FiShoppingCart,
  FiTrash2,
  FiArrowLeft,
} from "react-icons/fi";

import CustomerLayout from "../../layouts/CustomerLayout";
import products from "../../data/products";

function Wishlist({
  wishlist = [],
  removeFromWishlist,
  addToCart,
  cartCount = 0,
}) {
  const navigate = useNavigate();

  // Get the actual products from the product database
  const wishlistProducts = products.filter((product) =>
    wishlist.includes(product.id)
  );

  return (
    <CustomerLayout cartCount={cartCount}>

      <div className="space-y-6">

        {/* HEADER */}

        <div>

          <button
            onClick={() => navigate("/browse-products")}
            className="
              flex
              items-center
              gap-2
              text-gray-500
              hover:text-green-600
              transition
            "
          >
            <FiArrowLeft />

            Back to Products
          </button>

          <div className="mt-5">

            <h1 className="
              text-2xl
              sm:text-3xl
              font-bold
              text-gray-800
            ">
              My Wishlist
            </h1>

            <p className="text-gray-500 mt-1">
              Products you've saved for later.
            </p>

          </div>

        </div>


        {/* EMPTY WISHLIST */}

        {wishlistProducts.length === 0 ? (

          <div className="
            bg-white
            rounded-2xl
            border
            border-gray-100
            p-10
            sm:p-16
            text-center
          ">

            <div className="
              w-20
              h-20
              mx-auto
              rounded-full
              bg-green-50
              text-green-600
              flex
              items-center
              justify-center
            ">
              <FiHeart size={35} />
            </div>

            <h2 className="
              text-2xl
              font-bold
              text-gray-800
              mt-5
            ">
              Your Wishlist is Empty
            </h2>

            <p className="
              text-gray-500
              mt-2
              max-w-md
              mx-auto
            ">
              Save products you love and come back to them later.
            </p>

            <button
              onClick={() => navigate("/browse-products")}
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

        ) : (

          <>

            {/* WISHLIST COUNT */}

            <div className="
              flex
              items-center
              justify-between
              bg-white
              border
              border-gray-100
              rounded-2xl
              p-4
            ">

              <div>

                <p className="font-semibold text-gray-800">
                  Saved Products
                </p>

                <p className="text-sm text-gray-500 mt-1">
                  {wishlistProducts.length}{" "}
                  {wishlistProducts.length === 1
                    ? "product"
                    : "products"}{" "}
                  saved
                </p>

              </div>

              <div className="
                w-11
                h-11
                rounded-xl
                bg-green-50
                text-green-600
                flex
                items-center
                justify-center
              ">
                <FiHeart size={20} />
              </div>

            </div>


            {/* PRODUCTS */}

            <section className="
              grid
              grid-cols-2
              sm:grid-cols-2
              md:grid-cols-3
              xl:grid-cols-4
              gap-3
              sm:gap-5
            ">

              {wishlistProducts.map((product) => {

                const price = Number(
                  String(product.price).replace(/[₦,]/g, "")
                );

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
                    "
                  >

                    {/* IMAGE */}

                    <div
                      className="
                        relative
                        cursor-pointer
                        bg-gray-100
                      "
                      onClick={() =>
                        navigate(`/products/${product.id}`)
                      }
                    >

                      <img
                        src={product.image}
                        alt={product.name}
                        className="
                          w-full
                          h-44
                          sm:h-52
                          object-cover
                          group-hover:scale-105
                          transition
                          duration-300
                        "
                      />

                      {/* REMOVE */}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFromWishlist(product.id);
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
                        <FiTrash2 size={17} />
                      </button>

                    </div>


                    {/* INFORMATION */}

                    <div className="p-4">

                      <p className="
                        text-xs
                        text-green-600
                        font-medium
                      ">
                        {product.category}
                      </p>

                      <h3
                        onClick={() =>
                          navigate(`/products/${product.id}`)
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

                      <div className="
                        flex
                        items-center
                        justify-between
                        mt-4
                      ">

                        <p className="
                          text-lg
                          font-bold
                          text-gray-900
                        ">
                          ₦{price.toLocaleString()}
                        </p>

                      </div>


                      {/* ADD TO CART */}

                      <button
                        onClick={() => addToCart(product)}
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
                        <FiShoppingCart size={16} />

                        Add to Cart
                      </button>

                    </div>

                  </div>

                );
              })}

            </section>

          </>

        )}

      </div>

    </CustomerLayout>
  );
}

export default Wishlist;