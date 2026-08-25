import {
  useEffect,
  useState,
} from "react";

import {
  useParams,
  useNavigate,
} from "react-router-dom";

import CustomerLayout from "../../layouts/CustomerLayout";

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
  FiImage,
} from "react-icons/fi";

import {
  doc,
  onSnapshot,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "../../context/firebase";

import { useAuth } from "../../context/AuthContext";


// =========================================================
// PRODUCT DETAILS
// =========================================================

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
  // STATES
  // =========================================================

  const [product, setProduct] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [quantity, setQuantity] =
    useState(1);

  const [added, setAdded] =
    useState(false);

  const [chatLoading, setChatLoading] =
    useState(false);


  // =========================================================
  // NUMBER HELPER
  // =========================================================

  const getNumber = (
    value,
    fallback = 0
  ) => {
    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return fallback;
    }

    if (
      typeof value === "number"
    ) {
      return Number.isFinite(value)
        ? value
        : fallback;
    }

    const cleaned =
      String(value)
        .replace(/[₦,\s]/g, "")
        .trim();

    const number =
      Number(cleaned);

    return Number.isFinite(number)
      ? number
      : fallback;
  };


  // =========================================================
  // STOCK HELPER
  // =========================================================

  const getProductStock = (
    data
  ) => {
    // -------------------------------------------------------
    // PRIMARY STOCK
    // -------------------------------------------------------

    if (
      Object.prototype.hasOwnProperty.call(
        data,
        "stock"
      )
    ) {
      return Math.max(
        0,
        Math.floor(
          getNumber(
            data.stock,
            0
          )
        )
      );
    }


    // -------------------------------------------------------
    // BACKWARD COMPATIBILITY
    // -------------------------------------------------------

    const fallbackFields = [
      "stockQuantity",
      "quantity",
      "inventory",
      "availableStock",
      "availableQuantity",
    ];

    for (
      const field of fallbackFields
    ) {
      if (
        Object.prototype.hasOwnProperty.call(
          data,
          field
        )
      ) {
        return Math.max(
          0,
          Math.floor(
            getNumber(
              data[field],
              0
            )
          )
        );
      }
    }


    // -------------------------------------------------------
    // AVAILABILITY
    // -------------------------------------------------------

    const availability =
      String(
        data.availability || ""
      )
        .trim()
        .toLowerCase();

    const status =
      String(
        data.status || ""
      )
        .trim()
        .toLowerCase();

    if (
      availability ===
        "unavailable" ||
      availability ===
        "out_of_stock" ||
      availability ===
        "out-of-stock" ||
      status ===
        "out_of_stock" ||
      status ===
        "out-of-stock" ||
      status ===
        "out of stock"
    ) {
      return 0;
    }


    // -------------------------------------------------------
    // OLD PRODUCTS WITHOUT STOCK
    // -------------------------------------------------------

    return 1;
  };


  // =========================================================
  // LOAD PRODUCT
  // =========================================================

  useEffect(() => {
    if (!id) {
      setProduct(null);

      setLoading(false);

      setError(
        "No product was specified."
      );

      return undefined;
    }


    setLoading(true);

    setError("");

    setProduct(null);

    setQuantity(1);


    const productRef = doc(
      db,
      "products",
      String(id)
    );


    const unsubscribe =
      onSnapshot(
        productRef,

        (snapshot) => {
          if (!snapshot.exists()) {
            setProduct(null);

            setLoading(false);

            setError(
              "The product you're looking for doesn't exist."
            );

            return;
          }


          const data =
            snapshot.data();


          // =================================================
          // IMAGES
          // =================================================

          let images = [];

          if (
            Array.isArray(
              data.images
            )
          ) {
            images =
              data.images.filter(
                Boolean
              );
          }


          if (
            images.length === 0 &&
            data.image
          ) {
            images = [
              data.image,
            ];
          }


          if (
            images.length === 0 &&
            data.imageUrl
          ) {
            images = [
              data.imageUrl,
            ];
          }


          const primaryImage =
            data.image ||
            data.imageUrl ||
            images[0] ||
            null;


          // =================================================
          // STOCK
          // =================================================

          const stock =
            getProductStock(data);


          // =================================================
          // STATUS
          // =================================================

          const status =
            String(
              data.status ||
                "active"
            )
              .trim()
              .toLowerCase();


          // =================================================
          // AVAILABILITY
          // =================================================

          const availability =
            String(
              data.availability ||
                "available"
            )
              .trim()
              .toLowerCase();


          // =================================================
          // NORMALIZED PRODUCT
          // =================================================

          const normalizedProduct = {
            id:
              snapshot.id,

            ...data,

            name:
              data.name ||
              "Untitled Product",

            description:
              data.description ||
              "",

            category:
              data.category ||
              "Other",

            price:
              getNumber(
                data.price,
                0
              ),

            rating:
              getNumber(
                data.rating,
                0
              ),

            reviews:
              getNumber(
                data.reviews,
                0
              ),

            image:
              primaryImage,

            images,

            // IMPORTANT
            sellerId:
              data.sellerId ||
              "",

            sellerName:
              data.sellerName ||
              "CampusMart Seller",

            sellerImage:
              data.sellerImage ||
              null,

            stock,

            quantity:
              stock,

            status,

            availability,

            createdAt:
              data.createdAt ||
              null,

            updatedAt:
              data.updatedAt ||
              null,
          };


          console.log(
            "Loaded product:",
            normalizedProduct
          );


          setProduct(
            normalizedProduct
          );

          setLoading(false);

          setError("");


          // =================================================
          // KEEP QUANTITY INSIDE STOCK
          // =================================================

          setQuantity(
            (current) => {
              if (stock <= 0) {
                return 1;
              }

              return Math.min(
                Math.max(
                  1,
                  current
                ),
                stock
              );
            }
          );
        },

        (firebaseError) => {
          console.error(
            "Error loading product:",
            firebaseError
          );

          setProduct(null);

          setLoading(false);

          setError(
            "Unable to load this product right now. Please check your internet connection and try again."
          );
        }
      );


    return () => {
      unsubscribe();
    };
  }, [id]);


  // =========================================================
  // WISHLIST
  // =========================================================

  const isWishlisted =
    product
      ? wishlist.includes(
          product.id
        )
      : false;


  // =========================================================
  // STOCK
  // =========================================================

  const stock = Math.max(
    0,
    Number(
      product?.stock || 0
    )
  );

  const isOutOfStock =
    stock <= 0;


  // =========================================================
  // WISHLIST
  // =========================================================

  const handleWishlist =
    () => {
      if (!product) {
        return;
      }

      if (!toggleWishlist) {
        console.error(
          "toggleWishlist function was not provided."
        );

        return;
      }

      toggleWishlist(
        product.id
      );
    };


  // =========================================================
  // ADD TO CART
  // =========================================================

  const handleAddToCart =
    () => {
      if (!product) {
        return;
      }


      if (isOutOfStock) {
        alert(
          "This product is currently out of stock."
        );

        return;
      }


      if (!addToCart) {
        console.error(
          "addToCart function was not provided."
        );

        return;
      }


      const safeQuantity =
        Math.min(
          Math.max(
            1,
            Number(
              quantity
            ) || 1
          ),
          stock
        );


      addToCart(
        product,
        safeQuantity
      );


      setAdded(true);


      window.setTimeout(
        () => {
          setAdded(false);
        },
        2000
      );
    };


  // =========================================================
  // BUY NOW
  // =========================================================

  const handleBuyNow =
    () => {
      if (!product) {
        return;
      }


      if (isOutOfStock) {
        alert(
          "This product is currently out of stock."
        );

        return;
      }


      if (!addToCart) {
        console.error(
          "addToCart function was not provided."
        );

        return;
      }


      const safeQuantity =
        Math.min(
          Math.max(
            1,
            Number(
              quantity
            ) || 1
          ),
          stock
        );


      addToCart(
        product,
        safeQuantity
      );


      navigate("/cart");
    };


  // =========================================================
  // CHAT WITH SELLER
  // =========================================================
  //
  // IMPORTANT:
  //
  // We DO NOT call getDoc() before setDoc().
  //
  // This is important because your Firestore rules have:
  //
  // allow read:
  //   if request.auth.uid in resource.data.participants
  //
  // A brand-new conversation has no resource.data yet.
  //
  // setDoc(..., { merge: true }) lets Firestore:
  //
  // - CREATE a new conversation
  // - UPDATE an existing conversation
  //
  // without the initial getDoc() permission problem.
  //
  // =========================================================

  const handleChatWithSeller =
    async () => {
      if (!product) {
        return;
      }


      if (chatLoading) {
        return;
      }


      if (profileLoading) {
        return;
      }


      // -----------------------------------------------------
      // LOGIN CHECK
      // -----------------------------------------------------

      if (!firebaseUser?.uid) {
        navigate("/login");

        return;
      }


      // -----------------------------------------------------
      // SELLER ID
      // -----------------------------------------------------

      const sellerId =
        String(
          product.sellerId ||
            ""
        ).trim();


      console.log(
        "Product seller ID:",
        sellerId
      );

      console.log(
        "Current buyer ID:",
        firebaseUser.uid
      );


      if (!sellerId) {
        console.error(
          "Product is missing sellerId:",
          product
        );

        alert(
          "This seller is not properly configured for chat."
        );

        return;
      }


      // -----------------------------------------------------
      // PREVENT SELF CHAT
      // -----------------------------------------------------

      if (
        String(
          firebaseUser.uid
        ) === sellerId
      ) {
        alert(
          "You cannot chat with yourself."
        );

        return;
      }


      setChatLoading(true);


      try {
        // ===================================================
        // CONSISTENT CONVERSATION ID
        // ===================================================

        const participantIds = [
          String(
            firebaseUser.uid
          ),
          sellerId,
        ].sort();


        const conversationId =
          participantIds.join(
            "_"
          );


        console.log(
          "Conversation ID:",
          conversationId
        );


        // ===================================================
        // CONVERSATION REF
        // ===================================================

        const conversationRef =
          doc(
            db,
            "conversations",
            conversationId
          );


        // ===================================================
        // CUSTOMER NAME
        // ===================================================

        const customerName =
          firebaseUser.displayName ||
          firebaseUser.email ||
          "CampusMart User";


        // ===================================================
        // SELLER NAME
        // ===================================================

        const sellerName =
          product.sellerName ||
          "CampusMart Seller";


        // ===================================================
        // CREATE / UPDATE CONVERSATION
        // ===================================================
        //
        // DO NOT USE getDoc() HERE.
        //
        // merge:true means:
        //
        // New conversation:
        //     CREATE
        //
        // Existing conversation:
        //     UPDATE WITHOUT REMOVING MESSAGES
        //
        // ===================================================

        await setDoc(
          conversationRef,
          {
            participants:
              participantIds,

            participantNames: {
              [firebaseUser.uid]:
                customerName,

              [sellerId]:
                sellerName,
            },

            participantImages: {
              [firebaseUser.uid]:
                firebaseUser.photoURL ||
                null,

              [sellerId]:
                product.sellerImage ||
                null,
            },

            onlineStatus: {
              [firebaseUser.uid]:
                true,

              [sellerId]:
                false,
            },

            unreadCounts: {
              [firebaseUser.uid]:
                0,

              [sellerId]:
                0,
            },

            lastMessage:
              "",

            lastMessageAt:
              0,

            productId:
              product.id ||
              null,

            productName:
              product.name ||
              "",

            productImage:
              product.image ||
              null,

            sellerId:
              sellerId,

            updatedAt:
              serverTimestamp(),
          },

          {
            merge: true,
          }
        );


        console.log(
          "Conversation created/opened successfully:",
          conversationId
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

        console.error(
          "Firestore error code:",
          error?.code
        );

        console.error(
          "Firestore error message:",
          error?.message
        );


        alert(
          "Unable to open seller chat right now. Please try again."
        );
      } finally {
        setChatLoading(false);
      }
    };


  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <CustomerLayout
        cartCount={
          cartCount
        }
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
          <div
            className="
              w-10
              h-10
              mx-auto
              rounded-full
              border-4
              border-green-100
              border-t-green-600
              animate-spin
            "
          />

          <p
            className="
              text-sm
              text-gray-500
              mt-4
            "
          >
            Loading product...
          </p>
        </div>
      </CustomerLayout>
    );
  }


  // =========================================================
  // PRODUCT NOT FOUND
  // =========================================================

  if (!product) {
    return (
      <CustomerLayout
        cartCount={
          cartCount
        }
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
          <div
            className="
              w-16
              h-16
              mx-auto
              rounded-full
              bg-gray-100
              flex
              items-center
              justify-center
            "
          >
            <FiImage
              size={26}
              className="text-gray-400"
            />
          </div>


          <h2
            className="
              text-2xl
              font-bold
              text-gray-800
              mt-4
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
            {error ||
              "The product you're looking for doesn't exist."}
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
      cartCount={
        cartCount
      }
    >
      <div className="space-y-6">

        {/* =================================================
            BACK BUTTON
        ================================================= */}

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


        {/* =================================================
            PRODUCT
        ================================================= */}

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
                {product.image ? (
                  <img
                    src={
                      product.image
                    }
                    alt={
                      product.name
                    }
                    className="
                      w-full
                      h-72
                      sm:h-96
                      lg:h-[450px]
                      object-cover
                    "
                  />
                ) : (
                  <div
                    className="
                      w-full
                      h-72
                      sm:h-96
                      lg:h-[450px]
                      flex
                      items-center
                      justify-center
                      bg-gray-100
                    "
                  >
                    <FiImage
                      size={60}
                      className="text-gray-300"
                    />
                  </div>
                )}
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
                {
                  product.category
                }
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
                {
                  product.name
                }
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
                    {
                      product.rating
                    }
                  </span>
                </div>

                <span className="text-gray-400">
                  •
                </span>

                <span
                  className="
                    text-gray-500
                    text-sm
                  "
                >
                  {
                    product.reviews ||
                    0
                  }{" "}
                  Reviews
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
                  ₦
                  {Number(
                    product.price ||
                      0
                  ).toLocaleString()}
                </h2>

              </div>


              {/* STOCK */}

              <div className="mt-3">

                {isOutOfStock ? (
                  <span
                    className="
                      inline-flex
                      items-center
                      gap-2
                      px-3
                      py-1.5
                      rounded-lg
                      bg-red-50
                      text-red-600
                      text-sm
                      font-semibold
                    "
                  >
                    Out of stock
                  </span>
                ) : (
                  <span
                    className="
                      inline-flex
                      items-center
                      gap-2
                      px-3
                      py-1.5
                      rounded-lg
                      bg-green-50
                      text-green-600
                      text-sm
                      font-semibold
                    "
                  >
                    <FiCheck
                      size={15}
                    />

                    {stock}{" "}
                    {stock === 1
                      ? "item"
                      : "items"}{" "}
                    available
                  </span>
                )}

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

                {product.sellerImage ? (
                  <img
                    src={
                      product.sellerImage
                    }
                    alt={
                      product.sellerName
                    }
                    className="
                      w-11
                      h-11
                      rounded-full
                      object-cover
                    "
                  />
                ) : (
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
                )}


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
                    {
                      product.sellerName
                    }
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
                  {
                    product.description ||
                    `This is a quality ${product.name} available on CampusMart. Connect with the seller, ask questions and purchase securely.`
                  }
                </p>

              </div>


              {/* =================================================
                  QUANTITY
              ================================================= */}

              {!isOutOfStock && (
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
                          (
                            current
                          ) =>
                            Math.max(
                              1,
                              current -
                                1
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
                      {
                        quantity
                      }
                    </span>


                    <button
                      type="button"
                      disabled={
                        quantity >=
                        stock
                      }
                      onClick={() =>
                        setQuantity(
                          (
                            current
                          ) =>
                            Math.min(
                              stock,
                              current +
                                1
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
                        disabled:opacity-40
                        disabled:cursor-not-allowed
                      "
                    >
                      <FiPlus />
                    </button>

                  </div>

                </div>
              )}


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
                  disabled={
                    isOutOfStock
                  }
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
                      isOutOfStock
                        ? "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
                        : added
                        ? "border-green-600 bg-green-50 text-green-600"
                        : "border-green-600 text-green-600 hover:bg-green-50"
                    }
                  `}
                >

                  {isOutOfStock ? (
                    "Out of Stock"
                  ) : added ? (
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
                  disabled={
                    isOutOfStock
                  }
                  onClick={
                    handleBuyNow
                  }
                  className="
                    bg-green-600
                    hover:bg-green-700
                    disabled:bg-gray-300
                    disabled:cursor-not-allowed
                    text-white
                    py-3.5
                    rounded-xl
                    font-semibold
                    transition
                  "
                >
                  {isOutOfStock
                    ? "Out of Stock"
                    : "Buy Now"}
                </button>

              </div>

            </div>
          </div>
        </div>
      </div>
    </CustomerLayout>
  );
}

export default ProductDetails;