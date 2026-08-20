import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import CustomerLayout from "../../layouts/CustomerLayout";
import products from "../../data/products";

import {
  FiArrowLeft,
  FiHeart,
  FiShoppingCart,
  FiStar,
  FiMinus,
  FiPlus,
  FiUser,
  FiCheck,
  FiMessageCircle,
  FiRefreshCw,
} from "react-icons/fi";

import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "../../context/firebase";

import { useAuth } from "../../context/AuthContext";


// =========================================================
// TEMPORARY HARDCODED SELLER ID
//
// Replace this with the Firebase Authentication UID of the
// seller you want customers to chat with for now.
//
// Later, when the seller dashboard is created, this will be
// replaced by product.sellerId from Firebase.
// =========================================================

const HARDCODED_SELLER_ID =
  "YOUR_SELLER_FIREBASE_UID";


function ProductDetails({
  addToCart,
  cartCount = 0,
  wishlist = [],
  toggleWishlist,
}) {
  const { id } = useParams();

  const navigate = useNavigate();

  const {
    firebaseUser,
    profileLoading,
  } = useAuth();


  // =========================================================
  // FIND PRODUCT
  // =========================================================

  const product = products.find(
    (item) =>
      item.id === Number(id)
  );


  // =========================================================
  // STATES
  // =========================================================

  const [quantity, setQuantity] =
    useState(1);

  const [added, setAdded] =
    useState(false);

  const [chatLoading, setChatLoading] =
    useState(false);


  // =========================================================
  // WISHLIST STATUS
  // =========================================================

  const isWishlisted = product
    ? wishlist.includes(product.id)
    : false;


  // =========================================================
  // WISHLIST
  // =========================================================

  const handleWishlist = () => {
    if (!toggleWishlist) {
      console.error(
        "toggleWishlist function was not provided."
      );

      return;
    }

    toggleWishlist(product.id);
  };


  // =========================================================
  // ADD TO CART
  // =========================================================

  const handleAddToCart = () => {
    if (!addToCart) {
      console.error(
        "addToCart function was not provided."
      );

      return;
    }

    addToCart(
      product,
      quantity
    );

    setAdded(true);

    setTimeout(() => {
      setAdded(false);
    }, 2000);
  };


  // =========================================================
  // BUY NOW
  // =========================================================

  const handleBuyNow = () => {
    if (!addToCart) {
      console.error(
        "addToCart function was not provided."
      );

      return;
    }

    addToCart(
      product,
      quantity
    );

    navigate("/cart");
  };


  // =========================================================
  // CHAT WITH SELLER
  //
  // TEMPORARY VERSION
  //
  // Customer
  //      ↓
  // Product Details
  //      ↓
  // Hardcoded Seller ID
  //      ↓
  // Create/find conversation
  //      ↓
  // /messages/{conversationId}
  //      ↓
  // Chat.jsx
  //
  // Later we can replace the hardcoded seller ID with:
  //
  // product.sellerId
  //
  // =========================================================

  const handleChatWithSeller =
    async () => {

      // -----------------------------------------------------
      // Prevent multiple clicks
      // -----------------------------------------------------

      if (chatLoading) {
        return;
      }


      // -----------------------------------------------------
      // Make sure Firebase authentication has finished
      // -----------------------------------------------------

      if (profileLoading) {
        return;
      }


      // -----------------------------------------------------
      // Make sure customer is logged in
      // -----------------------------------------------------

      if (!firebaseUser?.uid) {

        console.error(
          "Customer is not logged in."
        );

        navigate("/login");

        return;
      }


      // -----------------------------------------------------
      // Make sure seller ID exists
      // -----------------------------------------------------

      if (
        !HARDCODED_SELLER_ID ||
        HARDCODED_SELLER_ID ===
          "YOUR_SELLER_FIREBASE_UID"
      ) {

        console.error(
          "Please add the hardcoded seller Firebase UID."
        );

        alert(
          "Seller chat is not configured yet. Add the seller Firebase UID first."
        );

        return;
      }


      // -----------------------------------------------------
      // Prevent chatting with yourself
      // -----------------------------------------------------

      if (
        firebaseUser.uid ===
        HARDCODED_SELLER_ID
      ) {

        alert(
          "You cannot chat with yourself."
        );

        return;
      }


      setChatLoading(true);


      try {

        // ===================================================
        // CREATE A CONSISTENT CONVERSATION ID
        //
        // Sorting the IDs means:
        //
        // customer + seller
        //
        // and
        //
        // seller + customer
        //
        // always produce the same conversation ID.
        //
        // ===================================================

        const participantIds = [
          firebaseUser.uid,
          HARDCODED_SELLER_ID,
        ].sort();


        const conversationId =
          participantIds.join("_");


        const conversationRef =
          doc(
            db,
            "conversations",
            conversationId
          );


        // ===================================================
        // CHECK IF CONVERSATION ALREADY EXISTS
        // ===================================================

        const conversationSnapshot =
          await getDoc(
            conversationRef
          );


        // ===================================================
        // EXISTING CONVERSATION
        //
        // Simply open it.
        // ===================================================

        if (
          conversationSnapshot.exists()
        ) {

          navigate(
            `/messages/${conversationId}`
          );

          return;
        }


        // ===================================================
        // CREATE NEW CONVERSATION
        // ===================================================

        const customerName =
          firebaseUser.displayName ||
          "CampusMart User";


        const sellerName =
          product?.sellerName ||
          "CampusMart Seller";


        await setDoc(
          conversationRef,
          {
            participants: [
              firebaseUser.uid,
              HARDCODED_SELLER_ID,
            ],

            participantNames: {
              [firebaseUser.uid]:
                customerName,

              [HARDCODED_SELLER_ID]:
                sellerName,
            },

            participantImages: {
              [firebaseUser.uid]:
                firebaseUser.photoURL ||
                null,

              [HARDCODED_SELLER_ID]:
                null,
            },

            participantOnline: {
              [firebaseUser.uid]:
                true,

              [HARDCODED_SELLER_ID]:
                false,
            },

            unread: {
              [firebaseUser.uid]: 0,

              [HARDCODED_SELLER_ID]: 0,
            },

            lastMessage:
              "Conversation started",

            lastMessageAt:
              serverTimestamp(),

            createdAt:
              serverTimestamp(),

            updatedAt:
              serverTimestamp(),

            // ---------------------------------------------
            // Temporary product information
            //
            // This lets Chat.jsx know which product the
            // conversation started from.
            // ---------------------------------------------

            productId:
              product.id,

            productName:
              product.name,

            productImage:
              product.image,

            sellerId:
              HARDCODED_SELLER_ID,
          }
        );


        // ===================================================
        // OPEN CHAT
        // ===================================================

        navigate(
          `/messages/${conversationId}`
        );

      } catch (error) {

        console.error(
          "Error opening seller chat:",
          error
        );

        alert(
          "Unable to open seller chat right now. Please try again."
        );

      } finally {

        if (
          profileLoading === false
        ) {
          setChatLoading(false);
        }

      }
    };


  // =========================================================
  // PRODUCT NOT FOUND
  // =========================================================

  if (!product) {

    return (
      <CustomerLayout
        cartCount={cartCount}
      >

        <div
          className="
            bg-white
            rounded-2xl
            border
            border-gray-100
            p-10
            text-center
          "
        >

          <h2
            className="
              text-2xl
              font-bold
              text-gray-800
            "
          >
            Product Not Found
          </h2>


          <p
            className="
              text-gray-500
              mt-2
            "
          >
            The product you're looking for
            doesn't exist.
          </p>


          <button
            type="button"
            onClick={() =>
              navigate(
                "/browse-products"
              )
            }
            className="
              mt-5
              bg-green-600
              hover:bg-green-700
              text-white
              px-5
              py-3
              rounded-xl
              transition
            "
          >
            Back to Products
          </button>

        </div>

      </CustomerLayout>
    );
  }


  // =========================================================
  // RENDER
  // =========================================================

  return (
    <CustomerLayout
      cartCount={cartCount}
    >

      <div className="space-y-6">


        {/* ===================================================
            BACK BUTTON
        =================================================== */}

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

          <FiArrowLeft />

          <span>
            Back to Products
          </span>

        </button>


        {/* ===================================================
            PRODUCT SECTION
        =================================================== */}

        <div
          className="
            bg-white
            rounded-2xl
            border
            border-gray-100
            p-4
            sm:p-6
            lg:p-8
          "
        >

          <div
            className="
              grid
              grid-cols-1
              lg:grid-cols-2
              gap-8
            "
          >


            {/* =================================================
                IMAGE
            ================================================= */}

            <div className="relative">

              <div
                className="
                  bg-gray-100
                  rounded-2xl
                  overflow-hidden
                "
              >

                <img
                  src={product.image}
                  alt={product.name}
                  className="
                    w-full
                    h-72
                    sm:h-96
                    lg:h-[450px]
                    object-cover
                  "
                />

              </div>


              {/* WISHLIST */}

              <button
                type="button"
                onClick={
                  handleWishlist
                }
                aria-label={
                  isWishlisted
                    ? "Remove from wishlist"
                    : "Add to wishlist"
                }
                className={`
                  absolute
                  top-4
                  right-4
                  w-11
                  h-11
                  sm:w-12
                  sm:h-12
                  rounded-full
                  shadow
                  flex
                  items-center
                  justify-center
                  transition

                  ${
                    isWishlisted
                      ? "bg-red-50 hover:bg-red-100"
                      : "bg-white hover:bg-gray-50"
                  }
                `}
              >

                <FiHeart
                  size={21}
                  className={
                    isWishlisted
                      ? "text-red-500 fill-red-500"
                      : "text-gray-600"
                  }
                />

              </button>

            </div>


            {/* =================================================
                INFORMATION
            ================================================= */}

            <div
              className="
                flex
                flex-col
              "
            >


              {/* CATEGORY */}

              <span
                className="
                  text-green-600
                  font-medium
                  text-sm
                "
              >
                {product.category}
              </span>


              {/* NAME */}

              <h1
                className="
                  text-2xl
                  sm:text-3xl
                  font-bold
                  text-gray-800
                  mt-2
                "
              >
                {product.name}
              </h1>


              {/* RATING */}

              <div
                className="
                  flex
                  items-center
                  gap-2
                  mt-4
                "
              >

                <div
                  className="
                    flex
                    items-center
                    gap-1
                  "
                >

                  <FiStar
                    className="
                      text-yellow-500
                      fill-yellow-500
                    "
                  />

                  <span
                    className="
                      font-medium
                    "
                  >
                    {product.rating}
                  </span>

                </div>


                <span
                  className="
                    text-gray-400
                  "
                >
                  •
                </span>


                <span
                  className="
                    text-gray-500
                    text-sm
                  "
                >
                  12 Reviews
                </span>

              </div>


              {/* PRICE */}

              <div className="mt-6">

                <p
                  className="
                    text-sm
                    text-gray-400
                  "
                >
                  Price
                </p>


                <h2
                  className="
                    text-3xl
                    font-bold
                    text-gray-900
                    mt-1
                  "
                >
                  {product.price}
                </h2>

              </div>


              {/* =================================================
                  SELLER
              ================================================= */}

              <div
                className="
                  flex
                  items-center
                  gap-3
                  mt-6
                  p-4
                  bg-gray-50
                  rounded-xl
                "
              >

                <div
                  className="
                    w-11
                    h-11
                    rounded-full
                    bg-green-100
                    flex
                    items-center
                    justify-center
                    shrink-0
                  "
                >

                  <FiUser
                    className="
                      text-green-600
                    "
                  />

                </div>


                <div
                  className="
                    flex-1
                  "
                >

                  <p
                    className="
                      text-xs
                      text-gray-400
                    "
                  >
                    Sold by
                  </p>


                  <p
                    className="
                      font-semibold
                      text-gray-800
                    "
                  >
                    {product.sellerName}
                  </p>

                </div>

              </div>


              {/* =================================================
                  CHAT WITH SELLER
              ================================================= */}

              <button
                type="button"
                onClick={
                  handleChatWithSeller
                }
                disabled={
                  chatLoading ||
                  profileLoading
                }
                className="
                  w-full
                  mt-3
                  flex
                  items-center
                  justify-center
                  gap-2
                  border
                  border-green-600
                  text-green-600
                  hover:bg-green-50
                  disabled:opacity-60
                  disabled:cursor-not-allowed
                  py-3
                  rounded-xl
                  font-semibold
                  transition
                "
              >

                {chatLoading ? (

                  <>
                    <FiRefreshCw
                      size={18}
                      className="
                        animate-spin
                      "
                    />

                    Opening Chat...

                  </>

                ) : (

                  <>
                    <FiMessageCircle
                      size={18}
                    />

                    Chat with Seller
                  </>

                )}

              </button>


              {/* =================================================
                  DESCRIPTION
              ================================================= */}

              <div className="mt-6">

                <h3
                  className="
                    font-bold
                    text-gray-800
                  "
                >
                  Description
                </h3>


                <p
                  className="
                    text-gray-500
                    text-sm
                    leading-6
                    mt-2
                  "
                >
                  This is a quality{" "}
                  {product.name}{" "}
                  available on CampusMart.
                  Connect with the seller,
                  ask questions and purchase
                  securely.
                </p>

              </div>


              {/* =================================================
                  QUANTITY
              ================================================= */}

              <div className="mt-6">

                <p
                  className="
                    font-semibold
                    text-gray-800
                    mb-3
                  "
                >
                  Quantity
                </p>


                <div
                  className="
                    flex
                    items-center
                    border
                    border-gray-200
                    rounded-xl
                    w-fit
                    overflow-hidden
                  "
                >

                  <button
                    type="button"
                    onClick={() =>
                      setQuantity(
                        (current) =>
                          Math.max(
                            1,
                            current - 1
                          )
                      )
                    }
                    className="
                      w-11
                      h-11
                      flex
                      items-center
                      justify-center
                      hover:bg-gray-50
                    "
                  >
                    <FiMinus />
                  </button>


                  <span
                    className="
                      w-12
                      text-center
                      font-semibold
                    "
                  >
                    {quantity}
                  </span>


                  <button
                    type="button"
                    onClick={() =>
                      setQuantity(
                        (current) =>
                          current + 1
                      )
                    }
                    className="
                      w-11
                      h-11
                      flex
                      items-center
                      justify-center
                      hover:bg-gray-50
                    "
                  >
                    <FiPlus />
                  </button>

                </div>

              </div>


              {/* =================================================
                  ACTION BUTTONS
              ================================================= */}

              <div
                className="
                  grid
                  grid-cols-1
                  sm:grid-cols-2
                  gap-3
                  mt-7
                "
              >

                {/* ADD TO CART */}

                <button
                  type="button"
                  onClick={
                    handleAddToCart
                  }
                  className={`
                    flex
                    items-center
                    justify-center
                    gap-2
                    border
                    py-3.5
                    rounded-xl
                    font-semibold
                    transition

                    ${
                      added
                        ? "border-green-600 bg-green-50 text-green-600"
                        : "border-green-600 text-green-600 hover:bg-green-50"
                    }
                  `}
                >

                  {added ? (

                    <>
                      <FiCheck />

                      Added to Cart
                    </>

                  ) : (

                    <>
                      <FiShoppingCart />

                      Add to Cart
                    </>

                  )}

                </button>


                {/* BUY NOW */}

                <button
                  type="button"
                  onClick={
                    handleBuyNow
                  }
                  className="
                    bg-green-600
                    hover:bg-green-700
                    text-white
                    py-3.5
                    rounded-xl
                    font-semibold
                    transition
                  "
                >
                  Buy Now
                </button>

              </div>

            </div>

          </div>

        </div>


        {/* =====================================================
            REVIEWS
        ===================================================== */}

        <div
          className="
            bg-white
            rounded-2xl
            border
            border-gray-100
            p-5
            sm:p-6
          "
        >

          <h2
            className="
              text-xl
              font-bold
              text-gray-800
            "
          >
            Customer Reviews
          </h2>


          <div
            className="
              flex
              items-center
              gap-2
              mt-4
            "
          >

            <FiStar
              className="
                text-yellow-500
                fill-yellow-500
              "
            />


            <span className="font-bold">
              {product.rating}
            </span>


            <span
              className="
                text-gray-500
                text-sm
              "
            >
              based on 12 reviews
            </span>

          </div>


          <div
            className="
              mt-6
              border-t
              border-gray-100
              pt-5
            "
          >

            <div
              className="
                flex
                items-center
                gap-3
              "
            >

              <div
                className="
                  w-10
                  h-10
                  rounded-full
                  bg-gray-100
                  flex
                  items-center
                  justify-center
                "
              >

                <FiUser
                  className="
                    text-gray-500
                  "
                />

              </div>


              <div>

                <p
                  className="
                    font-semibold
                    text-gray-800
                  "
                >
                  CampusMart User
                </p>


                <div
                  className="
                    flex
                    items-center
                    gap-1
                    mt-1
                  "
                >

                  {[1, 2, 3, 4, 5].map(
                    (star) => (

                      <FiStar
                        key={star}
                        size={13}
                        className="
                          text-yellow-500
                          fill-yellow-500
                        "
                      />

                    )
                  )}

                </div>

              </div>

            </div>


            <p
              className="
                text-sm
                text-gray-500
                mt-3
                leading-6
              "
            >
              Great product and exactly
              as described. The seller was
              also very helpful.
            </p>

          </div>

        </div>

      </div>

    </CustomerLayout>
  );
}


export default ProductDetails;