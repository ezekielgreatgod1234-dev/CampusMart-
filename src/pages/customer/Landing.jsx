import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  FiArrowRight,
  FiShoppingBag,
  FiUsers,
  FiShield,
  FiCheckCircle,
  FiBookOpen,
  FiMonitor,
  FiTag,
  FiHome,
  FiHeart,
  FiMessageCircle,
  FiMenu,
  FiX,
  FiUserPlus,
  FiStar,
  FiPackage,
  FiSearch,
  FiMapPin,
  FiShoppingCart,
} from "react-icons/fi";

function Landing() {
  const navigate = useNavigate();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] =
    useState("All");

  /* =========================================================
     NAVIGATION
  ========================================================= */

  const goToRegister = () => {
    setMobileMenuOpen(false);
    navigate("/register");
  };

  const goToLogin = () => {
    setMobileMenuOpen(false);
    navigate("/login");
  };

  /*
    IMPORTANT:

    We are NOT navigating to /marketplace anymore.

    Marketplace buttons simply scroll to the hardcoded
    marketplace section on this landing page.
  */
  const goToMarketplace = () => {
    setMobileMenuOpen(false);

    const element =
      document.getElementById("marketplace");

    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  /* =========================================================
     SCROLL
  ========================================================= */

  const scrollToSection = (id) => {
    setMobileMenuOpen(false);

    const element = document.getElementById(id);

    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  /* =========================================================
     HARD CODED CATEGORIES
  ========================================================= */

  const categories = [
    {
      name: "Books",
      icon: FiBookOpen,
      description: "Textbooks & study materials",
    },
    {
      name: "Electronics",
      icon: FiMonitor,
      description: "Phones, laptops & gadgets",
    },
    {
      name: "Fashion",
      icon: FiTag,
      description: "Clothes, shoes & style",
    },
    {
      name: "Campus Living",
      icon: FiHome,
      description: "Hostel & everyday items",
    },
    {
      name: "Accessories",
      icon: FiStar,
      description: "Useful student accessories",
    },
    {
      name: "Student Essentials",
      icon: FiPackage,
      description: "Everything students need",
    },
  ];

  /* =========================================================
     HARD CODED MARKETPLACE PRODUCTS
  ========================================================= */

  const products = [
    {
      id: 1,
      name: "Engineering Mathematics Textbook",
      category: "Books",
      price: "₦8,500",
      seller: "David",
      location: "Main Campus",
      condition: "Used - Good",
      icon: FiBookOpen,
    },

    {
      id: 2,
      name: "Introduction to Economics",
      category: "Books",
      price: "₦5,000",
      seller: "Michael",
      location: "Main Campus",
      condition: "Used - Very Good",
      icon: FiBookOpen,
    },

    {
      id: 3,
      name: "Scientific Calculator",
      category: "Electronics",
      price: "₦12,000",
      seller: "Chisom",
      location: "Science Block",
      condition: "Used - Good",
      icon: FiMonitor,
    },

    {
      id: 4,
      name: "Wireless Headphones",
      category: "Electronics",
      price: "₦18,500",
      seller: "Daniel",
      location: "Main Campus",
      condition: "New",
      icon: FiMonitor,
    },

    {
      id: 5,
      name: "HP Laptop",
      category: "Electronics",
      price: "₦250,000",
      seller: "Samuel",
      location: "Engineering Campus",
      condition: "Used - Very Good",
      icon: FiMonitor,
    },

    {
      id: 6,
      name: "Classic Campus Sneakers",
      category: "Fashion",
      price: "₦22,000",
      seller: "Grace",
      location: "Student Village",
      condition: "New",
      icon: FiTag,
    },

    {
      id: 7,
      name: "Oversized Hoodie",
      category: "Fashion",
      price: "₦15,000",
      seller: "Precious",
      location: "Main Campus",
      condition: "New",
      icon: FiTag,
    },

    {
      id: 8,
      name: "Campus Backpack",
      category: "Accessories",
      price: "₦14,000",
      seller: "John",
      location: "Main Campus",
      condition: "Used - Good",
      icon: FiPackage,
    },

    {
      id: 9,
      name: "Student Wrist Watch",
      category: "Accessories",
      price: "₦9,500",
      seller: "Blessing",
      location: "Student Village",
      condition: "New",
      icon: FiStar,
    },

    {
      id: 10,
      name: "Hostel Reading Lamp",
      category: "Campus Living",
      price: "₦7,000",
      seller: "Emeka",
      location: "Hostel Area",
      condition: "New",
      icon: FiHome,
    },

    {
      id: 11,
      name: "Mini Electric Fan",
      category: "Campus Living",
      price: "₦13,500",
      seller: "Victor",
      location: "Main Campus",
      condition: "Used - Good",
      icon: FiHome,
    },

    {
      id: 12,
      name: "Student Care Package",
      category: "Student Essentials",
      price: "₦10,000",
      seller: "Sarah",
      location: "Main Campus",
      condition: "New",
      icon: FiPackage,
    },
  ];

  /* =========================================================
     FILTER PRODUCTS
  ========================================================= */

  const filteredProducts =
    selectedCategory === "All"
      ? products
      : products.filter(
          (product) =>
            product.category === selectedCategory
        );

  return (
    <div className="min-h-screen bg-white text-gray-900">

      {/* =====================================================
          NAVBAR
      ===================================================== */}

      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100">

        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-10">

          <div className="h-20 flex items-center justify-between">

            {/* BRAND */}

            <button
              type="button"
              onClick={() =>
                window.scrollTo({
                  top: 0,
                  behavior: "smooth",
                })
              }
              className="flex items-center gap-3"
            >

              <div
                className="
                  w-11
                  h-11
                  rounded-xl
                  bg-green-600
                  text-white
                  flex
                  items-center
                  justify-center
                  shadow-sm
                "
              >
                <FiShoppingBag size={23} />
              </div>

              <div className="text-left">

                <div className="text-xl sm:text-2xl font-bold tracking-tight">
                  Campus<span className="text-green-600">Mart</span>
                </div>

                <div className="hidden sm:block text-[11px] text-gray-500 -mt-1">
                  Your Campus Marketplace
                </div>

              </div>

            </button>

            {/* DESKTOP NAVIGATION */}

            <nav className="hidden lg:flex items-center gap-8">

              <button
                type="button"
                onClick={() =>
                  window.scrollTo({
                    top: 0,
                    behavior: "smooth",
                  })
                }
                className="
                  text-sm
                  font-medium
                  text-green-600
                  hover:text-green-700
                  transition
                "
              >
                Home
              </button>

              {/* MARKETPLACE NOW SCROLLS */}

              <button
                type="button"
                onClick={goToMarketplace}
                className="
                  text-sm
                  font-medium
                  text-gray-600
                  hover:text-green-600
                  transition
                "
              >
                Marketplace
              </button>

              <button
                type="button"
                onClick={() =>
                  scrollToSection("categories")
                }
                className="
                  text-sm
                  font-medium
                  text-gray-600
                  hover:text-green-600
                  transition
                "
              >
                Categories
              </button>

              <button
                type="button"
                onClick={() =>
                  scrollToSection("how-it-works")
                }
                className="
                  text-sm
                  font-medium
                  text-gray-600
                  hover:text-green-600
                  transition
                "
              >
                How it works
              </button>

              <button
                type="button"
                onClick={() =>
                  scrollToSection("about")
                }
                className="
                  text-sm
                  font-medium
                  text-gray-600
                  hover:text-green-600
                  transition
                "
              >
                About
              </button>

            </nav>

            {/* DESKTOP ACTIONS */}

            <div className="hidden sm:flex items-center gap-3">

              <button
                type="button"
                onClick={goToLogin}
                className="
                  px-5
                  py-2.5
                  rounded-xl
                  border
                  border-gray-200
                  text-gray-700
                  text-sm
                  font-semibold
                  hover:border-green-500
                  hover:text-green-600
                  transition
                "
              >
                Log in
              </button>

              <button
                type="button"
                onClick={goToRegister}
                className="
                  px-5
                  py-2.5
                  rounded-xl
                  bg-green-600
                  text-white
                  text-sm
                  font-semibold
                  hover:bg-green-700
                  transition
                  shadow-sm
                "
              >
                Create account
              </button>

            </div>

            {/* MOBILE MENU */}

            <button
              type="button"
              onClick={() =>
                setMobileMenuOpen(
                  (current) => !current
                )
              }
              className="
                lg:hidden
                w-10
                h-10
                rounded-xl
                border
                border-gray-200
                flex
                items-center
                justify-center
                text-gray-700
              "
            >
              {mobileMenuOpen ? (
                <FiX size={21} />
              ) : (
                <FiMenu size={21} />
              )}
            </button>

          </div>

          {/* MOBILE MENU */}

          {mobileMenuOpen && (
            <div className="lg:hidden pb-5">

              <div className="border-t border-gray-100 pt-4 space-y-1">

                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);

                    window.scrollTo({
                      top: 0,
                      behavior: "smooth",
                    });
                  }}
                  className="
                    w-full
                    text-left
                    px-4
                    py-3
                    rounded-xl
                    text-sm
                    font-medium
                    text-green-600
                    hover:bg-green-50
                  "
                >
                  Home
                </button>

                <button
                  type="button"
                  onClick={goToMarketplace}
                  className="
                    w-full
                    text-left
                    px-4
                    py-3
                    rounded-xl
                    text-sm
                    font-medium
                    text-gray-600
                    hover:bg-gray-50
                  "
                >
                  Marketplace
                </button>

                <button
                  type="button"
                  onClick={() =>
                    scrollToSection("categories")
                  }
                  className="
                    w-full
                    text-left
                    px-4
                    py-3
                    rounded-xl
                    text-sm
                    font-medium
                    text-gray-600
                    hover:bg-gray-50
                  "
                >
                  Categories
                </button>

                <button
                  type="button"
                  onClick={() =>
                    scrollToSection("how-it-works")
                  }
                  className="
                    w-full
                    text-left
                    px-4
                    py-3
                    rounded-xl
                    text-sm
                    font-medium
                    text-gray-600
                    hover:bg-gray-50
                  "
                >
                  How it works
                </button>

                <button
                  type="button"
                  onClick={() =>
                    scrollToSection("about")
                  }
                  className="
                    w-full
                    text-left
                    px-4
                    py-3
                    rounded-xl
                    text-sm
                    font-medium
                    text-gray-600
                    hover:bg-gray-50
                  "
                >
                  About CampusMart
                </button>

                <div className="pt-3 flex flex-col gap-2">

                  <button
                    type="button"
                    onClick={goToLogin}
                    className="
                      w-full
                      py-3
                      rounded-xl
                      border
                      border-gray-200
                      text-gray-700
                      font-semibold
                      text-sm
                    "
                  >
                    Log in
                  </button>

                  <button
                    type="button"
                    onClick={goToRegister}
                    className="
                      w-full
                      py-3
                      rounded-xl
                      bg-green-600
                      text-white
                      font-semibold
                      text-sm
                    "
                  >
                    Create account
                  </button>

                </div>

              </div>

            </div>
          )}

        </div>

      </header>

      {/* =====================================================
          HERO
      ===================================================== */}

      <section className="relative overflow-hidden">

        <div
          className="
            absolute
            top-0
            right-0
            w-[500px]
            h-[500px]
            bg-green-50
            rounded-full
            blur-3xl
            opacity-70
            pointer-events-none
          "
        />

        <div
          className="
            absolute
            bottom-0
            left-0
            w-[300px]
            h-[300px]
            bg-green-50
            rounded-full
            blur-3xl
            opacity-60
            pointer-events-none
          "
        />

        <div
          className="
            max-w-7xl
            mx-auto
            px-5
            sm:px-8
            lg:px-10
            py-20
            sm:py-24
            lg:py-28
          "
        >

          <div
            className="
              grid
              lg:grid-cols-2
              gap-14
              lg:gap-20
              items-center
            "
          >

            {/* HERO TEXT */}

            <div className="relative z-10">

              <div
                className="
                  inline-flex
                  items-center
                  gap-2
                  px-4
                  py-2
                  rounded-full
                  bg-green-50
                  border
                  border-green-100
                  text-green-700
                  text-sm
                  font-medium
                "
              >
                <span className="w-2 h-2 rounded-full bg-green-500" />

                Built for campus communities
              </div>

              <h1
                className="
                  mt-7
                  text-4xl
                  sm:text-5xl
                  lg:text-6xl
                  font-bold
                  leading-[1.08]
                  tracking-tight
                  text-gray-900
                "
              >
                Your campus.
                <br />

                Your community.
                <br />

                <span className="text-green-600">
                  Your marketplace.
                </span>
              </h1>

              <p
                className="
                  mt-7
                  max-w-xl
                  text-base
                  sm:text-lg
                  leading-8
                  text-gray-600
                "
              >
                CampusMart brings students together in one
                trusted marketplace where you can buy, sell,
                discover and connect with people within your
                campus community.
              </p>

              {/* HERO BUTTONS */}

              <div
                className="
                  mt-9
                  flex
                  flex-col
                  sm:flex-row
                  gap-3
                "
              >

                <button
                  type="button"
                  onClick={goToRegister}
                  className="
                    inline-flex
                    items-center
                    justify-center
                    gap-2
                    px-7
                    py-3.5
                    rounded-xl
                    bg-green-600
                    text-white
                    font-semibold
                    text-sm
                    hover:bg-green-700
                    transition
                    shadow-sm
                  "
                >
                  Explore CampusMart
                  <FiArrowRight size={18} />
                </button>

                

              </div>

              {/* TRUST */}

              <div
                className="
                  mt-10
                  flex
                  flex-wrap
                  gap-x-7
                  gap-y-3
                "
              >

                <div className="flex items-center gap-2">

                  <FiCheckCircle
                    className="text-green-600"
                    size={18}
                  />

                  <span className="text-sm text-gray-600">
                    Student-focused
                  </span>

                </div>

                <div className="flex items-center gap-2">

                  <FiShield
                    className="text-green-600"
                    size={18}
                  />

                  <span className="text-sm text-gray-600">
                    Community-first
                  </span>

                </div>

                <div className="flex items-center gap-2">

                  <FiUsers
                    className="text-green-600"
                    size={18}
                  />

                  <span className="text-sm text-gray-600">
                    Built for students
                  </span>

                </div>

              </div>

            </div>

            {/* HERO VISUAL */}

            <div className="relative">

              <div
                className="
                  relative
                  min-h-[430px]
                  sm:min-h-[500px]
                  rounded-[2rem]
                  bg-gradient-to-br
                  from-green-50
                  via-white
                  to-green-100
                  border
                  border-green-100
                  overflow-hidden
                  flex
                  items-center
                  justify-center
                "
              >

                <div
                  className="
                    absolute
                    w-72
                    h-72
                    sm:w-96
                    sm:h-96
                    rounded-full
                    bg-green-200/60
                  "
                />

                <div
                  className="
                    absolute
                    w-52
                    h-52
                    sm:w-72
                    sm:h-72
                    rounded-full
                    bg-white/70
                  "
                />

                <div
                  className="
                    relative
                    z-10
                    w-[280px]
                    sm:w-[350px]
                    bg-white
                    rounded-3xl
                    border
                    border-gray-100
                    shadow-2xl
                    p-5
                    sm:p-6
                  "
                >

                  <div className="flex items-center justify-between">

                    <div className="flex items-center gap-3">

                      <div
                        className="
                          w-11
                          h-11
                          rounded-xl
                          bg-green-600
                          text-white
                          flex
                          items-center
                          justify-center
                        "
                      >
                        <FiShoppingBag size={22} />
                      </div>

                      <div>

                        <p className="font-bold text-gray-900">
                          CampusMart
                        </p>

                        <p className="text-xs text-gray-400">
                          Campus marketplace
                        </p>

                      </div>

                    </div>

                    <div
                      className="
                        w-9
                        h-9
                        rounded-full
                        bg-green-50
                        text-green-600
                        flex
                        items-center
                        justify-center
                      "
                    >
                      <FiHeart size={17} />
                    </div>

                  </div>

                  {/* MOCK CATEGORIES */}

                  <div className="mt-6 grid grid-cols-2 gap-3">

                    {categories.slice(0, 4).map(
                      (category) => {
                        const Icon = category.icon;

                        return (
                          <div
                            key={category.name}
                            className="
                              rounded-2xl
                              bg-gray-50
                              p-4
                              border
                              border-gray-100
                            "
                          >

                            <div
                              className="
                                h-24
                                rounded-xl
                                bg-green-100
                                flex
                                items-center
                                justify-center
                                text-green-600
                              "
                            >
                              <Icon size={42} />
                            </div>

                            <p
                              className="
                                mt-3
                                text-sm
                                font-semibold
                                text-gray-800
                              "
                            >
                              {category.name}
                            </p>

                            <p
                              className="
                                mt-1
                                text-xs
                                text-gray-400
                              "
                            >
                              {category.description}
                            </p>

                          </div>
                        );
                      }
                    )}

                  </div>

                </div>

                {/* FLOATING CARD */}

                <div
                  className="
                    absolute
                    z-20
                    bottom-7
                    -left-2
                    sm:left-5
                    bg-white
                    rounded-2xl
                    shadow-xl
                    border
                    border-gray-100
                    p-4
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
                      bg-green-100
                      text-green-600
                      flex
                      items-center
                      justify-center
                    "
                  >
                    <FiUsers size={19} />
                  </div>

                  <div>

                    <p
                      className="
                        text-sm
                        font-bold
                        text-gray-800
                      "
                    >
                      One campus community
                    </p>

                    <p
                      className="
                        text-xs
                        text-gray-400
                        mt-0.5
                      "
                    >
                      Buy, sell & connect
                    </p>

                  </div>

                </div>

              </div>

            </div>

          </div>

        </div>

      </section>

      {/* =====================================================
          HARD CODED MARKETPLACE
      ===================================================== */}

      <section
        id="marketplace"
        className="py-20 sm:py-24 bg-gray-50"
      >

        <div
          className="
            max-w-7xl
            mx-auto
            px-5
            sm:px-8
            lg:px-10
          "
        >

          {/* HEADER */}

          <div
            className="
              flex
              flex-col
              lg:flex-row
              lg:items-end
              lg:justify-between
              gap-6
            "
          >

            <div>

              <span
                className="
                  text-sm
                  font-semibold
                  text-green-600
                  uppercase
                  tracking-wider
                "
              >
                Campus Marketplace
              </span>

              <h2
                className="
                  mt-2
                  text-3xl
                  sm:text-4xl
                  font-bold
                  text-gray-900
                "
              >
                Discover what students are selling
              </h2>

              <p
                className="
                  mt-4
                  max-w-2xl
                  text-sm
                  sm:text-base
                  leading-7
                  text-gray-500
                "
              >
                Browse popular items from students around
                your campus. These products are currently
                displayed as sample marketplace listings.
              </p>

            </div>

            {/* SEARCH VISUAL */}

            <div
              className="
                flex
                items-center
                gap-3
                bg-white
                border
                border-gray-200
                rounded-xl
                px-4
                py-3
                w-full
                lg:w-80
              "
            >

              <FiSearch
                className="text-gray-400"
                size={18}
              />

              <span className="text-sm text-gray-400">
                Search products...
              </span>

            </div>

          </div>

          {/* CATEGORY FILTERS */}

          <div
            className="
              mt-10
              flex
              gap-2
              overflow-x-auto
              pb-2
            "
          >

            <button
              type="button"
              onClick={() =>
                setSelectedCategory("All")
              }
              className={`
                shrink-0
                px-5
                py-2.5
                rounded-xl
                text-sm
                font-semibold
                transition
                ${
                  selectedCategory === "All"
                    ? "bg-green-600 text-white"
                    : "bg-white text-gray-600 border border-gray-200 hover:border-green-300 hover:text-green-600"
                }
              `}
            >
              All Products
            </button>

            {categories.map((category) => (
              <button
                key={category.name}
                type="button"
                onClick={() =>
                  setSelectedCategory(
                    category.name
                  )
                }
                className={`
                  shrink-0
                  px-5
                  py-2.5
                  rounded-xl
                  text-sm
                  font-semibold
                  transition
                  ${
                    selectedCategory ===
                    category.name
                      ? "bg-green-600 text-white"
                      : "bg-white text-gray-600 border border-gray-200 hover:border-green-300 hover:text-green-600"
                  }
                `}
              >
                {category.name}
              </button>
            ))}

          </div>

          {/* PRODUCTS */}

          <div
            className="
              mt-8
              grid
              sm:grid-cols-2
              lg:grid-cols-3
              xl:grid-cols-4
              gap-5
            "
          >

            {filteredProducts.map((product) => {
              const ProductIcon = product.icon;

              return (
                <div
                  key={product.id}
                  className="
                    group
                    bg-white
                    rounded-2xl
                    border
                    border-gray-100
                    overflow-hidden
                    shadow-sm
                    hover:shadow-md
                    hover:-translate-y-1
                    transition
                  "
                >

                  {/* PRODUCT IMAGE PLACEHOLDER */}

                  <div
                    className="
                      h-48
                      bg-green-50
                      flex
                      items-center
                      justify-center
                      text-green-600
                      relative
                    "
                  >

                    <ProductIcon size={58} />

                    <div
                      className="
                        absolute
                        top-3
                        left-3
                        px-3
                        py-1.5
                        rounded-full
                        bg-white
                        text-xs
                        font-medium
                        text-gray-600
                        shadow-sm
                      "
                    >
                      {product.condition}
                    </div>

                    <button
                      type="button"
                      className="
                        absolute
                        top-3
                        right-3
                        w-9
                        h-9
                        rounded-full
                        bg-white
                        text-gray-400
                        flex
                        items-center
                        justify-center
                        shadow-sm
                        hover:text-red-500
                        transition
                      "
                    >
                      <FiHeart size={17} />
                    </button>

                  </div>

                  {/* PRODUCT INFO */}

                  <div className="p-5">

                    <p
                      className="
                        text-xs
                        font-medium
                        text-green-600
                      "
                    >
                      {product.category}
                    </p>

                    <h3
                      className="
                        mt-2
                        font-bold
                        text-gray-900
                        line-clamp-2
                      "
                    >
                      {product.name}
                    </h3>

                    <div
                      className="
                        mt-4
                        flex
                        items-center
                        justify-between
                      "
                    >

                      <p
                        className="
                          text-lg
                          font-bold
                          text-gray-900
                        "
                      >
                        {product.price}
                      </p>

                      <button
                        type="button"
                        onClick={goToRegister}
                        className="
                          w-9
                          h-9
                          rounded-xl
                          bg-green-50
                          text-green-600
                          flex
                          items-center
                          justify-center
                          hover:bg-green-600
                          hover:text-white
                          transition
                        "
                        title="Create account to buy"
                      >
                        <FiShoppingCart size={17} />
                      </button>

                    </div>

                    <div
                      className="
                        mt-4
                        pt-4
                        border-t
                        border-gray-100
                        flex
                        flex-col
                        gap-2
                      "
                    >

                      <div
                        className="
                          flex
                          items-center
                          gap-2
                          text-xs
                          text-gray-500
                        "
                      >
                        <FiUserPlus size={13} />

                        Sold by {product.seller}
                      </div>

                      <div
                        className="
                          flex
                          items-center
                          gap-2
                          text-xs
                          text-gray-500
                        "
                      >
                        <FiMapPin size={13} />

                        {product.location}
                      </div>

                    </div>

                  </div>

                </div>
              );
            })}

          </div>

          {/* MARKETPLACE NOTE */}

          <div
            className="
              mt-10
              bg-white
              border
              border-green-100
              rounded-2xl
              p-6
              flex
              flex-col
              sm:flex-row
              sm:items-center
              sm:justify-between
              gap-5
            "
          >

            <div className="flex items-center gap-4">

              <div
                className="
                  w-12
                  h-12
                  rounded-xl
                  bg-green-50
                  text-green-600
                  flex
                  items-center
                  justify-center
                  shrink-0
                "
              >
                <FiShoppingBag size={22} />
              </div>

              <div>

                <h3
                  className="
                    font-bold
                    text-gray-900
                  "
                >
                  Want to buy or sell on CampusMart?
                </h3>

                <p
                  className="
                    mt-1
                    text-sm
                    text-gray-500
                  "
                >
                  Create an account to participate in
                  the campus marketplace.
                </p>

              </div>

            </div>

            <button
              type="button"
              onClick={goToRegister}
              className="
                inline-flex
                items-center
                justify-center
                gap-2
                px-6
                py-3
                rounded-xl
                bg-green-600
                text-white
                text-sm
                font-semibold
                hover:bg-green-700
                transition
                shrink-0
              "
            >
              Join CampusMart
              <FiArrowRight size={17} />
            </button>

          </div>

        </div>

      </section>

      {/* =====================================================
          ABOUT
      ===================================================== */}

      <section
        id="about"
        className="py-20 sm:py-24"
      >

        <div
          className="
            max-w-7xl
            mx-auto
            px-5
            sm:px-8
            lg:px-10
          "
        >

          <div
            className="
              max-w-3xl
              mx-auto
              text-center
            "
          >

            <span
              className="
                text-sm
                font-semibold
                text-green-600
                uppercase
                tracking-wider
              "
            >
              About CampusMart
            </span>

            <h2
              className="
                mt-3
                text-3xl
                sm:text-4xl
                font-bold
                tracking-tight
                text-gray-900
              "
            >
              Made for campus life
            </h2>

            <p
              className="
                mt-5
                text-base
                sm:text-lg
                leading-8
                text-gray-600
              "
            >
              CampusMart is designed to make buying and
              selling within a campus community easier,
              more convenient and more connected.
            </p>

          </div>

          <div
            className="
              mt-14
              grid
              sm:grid-cols-2
              lg:grid-cols-3
              gap-5
            "
          >

            {/* CARD 1 */}

            <div
              className="
                bg-gray-50
                rounded-2xl
                border
                border-gray-100
                p-7
              "
            >

              <div
                className="
                  w-12
                  h-12
                  rounded-xl
                  bg-green-50
                  text-green-600
                  flex
                  items-center
                  justify-center
                "
              >
                <FiUsers size={23} />
              </div>

              <h3
                className="
                  mt-5
                  text-lg
                  font-bold
                  text-gray-900
                "
              >
                Built around students
              </h3>

              <p
                className="
                  mt-2
                  text-sm
                  leading-6
                  text-gray-500
                "
              >
                CampusMart puts students and their everyday
                campus needs at the heart of the experience.
              </p>

            </div>

            {/* CARD 2 */}

            <div
              className="
                bg-gray-50
                rounded-2xl
                border
                border-gray-100
                p-7
              "
            >

              <div
                className="
                  w-12
                  h-12
                  rounded-xl
                  bg-green-50
                  text-green-600
                  flex
                  items-center
                  justify-center
                "
              >
                <FiShoppingBag size={23} />
              </div>

              <h3
                className="
                  mt-5
                  text-lg
                  font-bold
                  text-gray-900
                "
              >
                Everything in one place
              </h3>

              <p
                className="
                  mt-2
                  text-sm
                  leading-6
                  text-gray-500
                "
              >
                Discover useful products and services from
                people within your campus community.
              </p>

            </div>

            {/* CARD 3 */}

            <div
              className="
                bg-gray-50
                rounded-2xl
                border
                border-gray-100
                p-7
              "
            >

              <div
                className="
                  w-12
                  h-12
                  rounded-xl
                  bg-green-50
                  text-green-600
                  flex
                  items-center
                  justify-center
                "
              >
                <FiMessageCircle size={23} />
              </div>

              <h3
                className="
                  mt-5
                  text-lg
                  font-bold
                  text-gray-900
                "
              >
                Connect with your community
              </h3>

              <p
                className="
                  mt-2
                  text-sm
                  leading-6
                  text-gray-500
                "
              >
                Make buying and selling feel more personal
                by connecting with fellow students.
              </p>

            </div>

          </div>

        </div>

      </section>

      {/* =====================================================
          CATEGORIES
      ===================================================== */}

      <section
        id="categories"
        className="py-20 sm:py-24 bg-gray-50"
      >

        <div
          className="
            max-w-7xl
            mx-auto
            px-5
            sm:px-8
            lg:px-10
          "
        >

          <div
            className="
              flex
              flex-col
              sm:flex-row
              sm:items-end
              sm:justify-between
              gap-5
            "
          >

            <div>

              <span
                className="
                  text-sm
                  font-semibold
                  text-green-600
                  uppercase
                  tracking-wider
                "
              >
                Explore
              </span>

              <h2
                className="
                  mt-2
                  text-3xl
                  sm:text-4xl
                  font-bold
                  text-gray-900
                "
              >
                Something for every student
              </h2>

            </div>

            <p
              className="
                max-w-md
                text-sm
                leading-6
                text-gray-500
              "
            >
              From study essentials to everyday campus
              needs, CampusMart brings useful categories
              together.
            </p>

          </div>

          <div
            className="
              mt-12
              grid
              grid-cols-2
              md:grid-cols-3
              lg:grid-cols-6
              gap-4
            "
          >

            {categories.map((category) => {
              const Icon = category.icon;

              return (
                <button
                  key={category.name}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(
                      category.name
                    );

                    setTimeout(() => {
                      scrollToSection(
                        "marketplace"
                      );
                    }, 50);
                  }}
                  className="
                    group
                    p-5
                    min-h-[165px]
                    rounded-2xl
                    border
                    border-gray-100
                    bg-white
                    hover:border-green-200
                    hover:bg-green-50/50
                    transition
                    text-left
                  "
                >

                  <div
                    className="
                      w-12
                      h-12
                      rounded-xl
                      bg-green-50
                      text-green-600
                      flex
                      items-center
                      justify-center
                      group-hover:bg-green-600
                      group-hover:text-white
                      transition
                    "
                  >
                    <Icon size={22} />
                  </div>

                  <p
                    className="
                      mt-5
                      text-sm
                      font-semibold
                      text-gray-800
                    "
                  >
                    {category.name}
                  </p>

                  <p
                    className="
                      mt-1
                      text-xs
                      text-gray-400
                      leading-5
                    "
                  >
                    {category.description}
                  </p>

                  <div
                    className="
                      mt-2
                      flex
                      items-center
                      gap-1
                      text-xs
                      text-green-600
                    "
                  >
                    View products
                    <FiArrowRight size={12} />
                  </div>

                </button>
              );
            })}

          </div>

        </div>

      </section>

      {/* =====================================================
          HOW IT WORKS
      ===================================================== */}

      <section
        id="how-it-works"
        className="py-20 sm:py-24"
      >

        <div
          className="
            max-w-7xl
            mx-auto
            px-5
            sm:px-8
            lg:px-10
          "
        >

          <div className="text-center max-w-2xl mx-auto">

            <span
              className="
                text-sm
                font-semibold
                text-green-600
                uppercase
                tracking-wider
              "
            >
              Simple process
            </span>

            <h2
              className="
                mt-3
                text-3xl
                sm:text-4xl
                font-bold
                text-gray-900
              "
            >
              How CampusMart works
            </h2>

            <p
              className="
                mt-4
                text-gray-600
                leading-7
              "
            >
              Getting started is simple. Join your campus
              community and start participating.
            </p>

          </div>

          <div
            className="
              mt-14
              grid
              md:grid-cols-3
              gap-8
            "
          >

            {/* STEP 1 */}

            <div className="relative text-center">

              <div
                className="
                  mx-auto
                  w-16
                  h-16
                  rounded-2xl
                  bg-green-600
                  text-white
                  flex
                  items-center
                  justify-center
                  shadow-sm
                "
              >
                <FiUserPlus size={27} />
              </div>

              <span
                className="
                  inline-block
                  mt-6
                  text-xs
                  font-bold
                  text-green-600
                "
              >
                STEP 01
              </span>

              <h3
                className="
                  mt-2
                  text-lg
                  font-bold
                  text-gray-900
                "
              >
                Create your account
              </h3>

              <p
                className="
                  mt-2
                  text-sm
                  leading-6
                  text-gray-500
                  max-w-xs
                  mx-auto
                "
              >
                Join CampusMart and become part of your
                campus marketplace.
              </p>

            </div>

            {/* STEP 2 */}

            <div className="relative text-center">

              <div
                className="
                  mx-auto
                  w-16
                  h-16
                  rounded-2xl
                  bg-green-600
                  text-white
                  flex
                  items-center
                  justify-center
                  shadow-sm
                "
              >
                <FiShoppingBag size={27} />
              </div>

              <span
                className="
                  inline-block
                  mt-6
                  text-xs
                  font-bold
                  text-green-600
                "
              >
                STEP 02
              </span>

              <h3
                className="
                  mt-2
                  text-lg
                  font-bold
                  text-gray-900
                "
              >
                Buy or sell
              </h3>

              <p
                className="
                  mt-2
                  text-sm
                  leading-6
                  text-gray-500
                  max-w-xs
                  mx-auto
                "
              >
                Discover things you need or share products
                you no longer need.
              </p>

            </div>

            {/* STEP 3 */}

            <div className="text-center">

              <div
                className="
                  mx-auto
                  w-16
                  h-16
                  rounded-2xl
                  bg-green-600
                  text-white
                  flex
                  items-center
                  justify-center
                  shadow-sm
                "
              >
                <FiMessageCircle size={27} />
              </div>

              <span
                className="
                  inline-block
                  mt-6
                  text-xs
                  font-bold
                  text-green-600
                "
              >
                STEP 03
              </span>

              <h3
                className="
                  mt-2
                  text-lg
                  font-bold
                  text-gray-900
                "
              >
                Connect and trade
              </h3>

              <p
                className="
                  mt-2
                  text-sm
                  leading-6
                  text-gray-500
                  max-w-xs
                  mx-auto
                "
              >
                Connect with other students and make
                campus trading easier.
              </p>

            </div>

          </div>

        </div>

      </section>

      {/* =====================================================
          BENEFITS
      ===================================================== */}

      <section className="py-20 sm:py-24 bg-gray-50">

        <div
          className="
            max-w-7xl
            mx-auto
            px-5
            sm:px-8
            lg:px-10
          "
        >

          <div
            className="
              grid
              lg:grid-cols-2
              gap-14
              items-center
            "
          >

            {/* LEFT */}

            <div>

              <span
                className="
                  text-sm
                  font-semibold
                  text-green-600
                  uppercase
                  tracking-wider
                "
              >
                Why CampusMart
              </span>

              <h2
                className="
                  mt-3
                  text-3xl
                  sm:text-4xl
                  font-bold
                  leading-tight
                  text-gray-900
                "
              >
                More than a marketplace.

                <span className="text-green-600">
                  {" "}It's a campus community.
                </span>
              </h2>

              <p
                className="
                  mt-5
                  text-gray-600
                  leading-7
                  max-w-xl
                "
              >
                CampusMart is designed around the way
                students actually live, study, move and
                connect on campus.
              </p>

              <div className="mt-8 space-y-5">

                <div className="flex gap-4">

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
                      shrink-0
                    "
                  >
                    <FiShield size={20} />
                  </div>

                  <div>

                    <h3
                      className="
                        font-bold
                        text-gray-900
                      "
                    >
                      Community-focused
                    </h3>

                    <p
                      className="
                        mt-1
                        text-sm
                        leading-6
                        text-gray-500
                      "
                    >
                      Designed to encourage meaningful
                      connections within your campus.
                    </p>

                  </div>

                </div>

                <div className="flex gap-4">

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
                      shrink-0
                    "
                  >
                    <FiTag size={20} />
                  </div>

                  <div>

                    <h3
                      className="
                        font-bold
                        text-gray-900
                      "
                    >
                      Easy to participate
                    </h3>

                    <p
                      className="
                        mt-1
                        text-sm
                        leading-6
                        text-gray-500
                      "
                    >
                      Buy what you need or give your
                      unused items a new home.
                    </p>

                  </div>

                </div>

                <div className="flex gap-4">

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
                      shrink-0
                    "
                  >
                    <FiHeart size={20} />
                  </div>

                  <div>

                    <h3
                      className="
                        font-bold
                        text-gray-900
                      "
                    >
                      Made for campus life
                    </h3>

                    <p
                      className="
                        mt-1
                        text-sm
                        leading-6
                        text-gray-500
                      "
                    >
                      Built around the products, people
                      and experiences students care about.
                    </p>

                  </div>

                </div>

              </div>

            </div>

            {/* RIGHT */}

            <div
              className="
                relative
                rounded-[2rem]
                bg-white
                border
                border-gray-100
                p-6
                sm:p-10
                overflow-hidden
                shadow-sm
              "
            >

              <div
                className="
                  absolute
                  -right-20
                  -top-20
                  w-60
                  h-60
                  rounded-full
                  bg-green-100
                "
              />

              <div
                className="
                  relative
                  z-10
                  space-y-4
                "
              >

                <div
                  className="
                    bg-gray-50
                    rounded-2xl
                    p-5
                    border
                    border-gray-100
                  "
                >

                  <div className="flex items-center gap-4">

                    <div
                      className="
                        w-12
                        h-12
                        rounded-xl
                        bg-green-100
                        text-green-600
                        flex
                        items-center
                        justify-center
                      "
                    >
                      <FiBookOpen size={23} />
                    </div>

                    <div>

                      <p
                        className="
                          font-bold
                          text-gray-900
                        "
                      >
                        Study smarter
                      </p>

                      <p
                        className="
                          mt-1
                          text-sm
                          text-gray-500
                        "
                      >
                        Find useful student essentials.
                      </p>

                    </div>

                  </div>

                </div>

                <div
                  className="
                    bg-gray-50
                    rounded-2xl
                    p-5
                    border
                    border-gray-100
                    ml-8
                  "
                >

                  <div className="flex items-center gap-4">

                    <div
                      className="
                        w-12
                        h-12
                        rounded-xl
                        bg-green-100
                        text-green-600
                        flex
                        items-center
                        justify-center
                      "
                    >
                      <FiUsers size={23} />
                    </div>

                    <div>

                      <p
                        className="
                          font-bold
                          text-gray-900
                        "
                      >
                        Meet your community
                      </p>

                      <p
                        className="
                          mt-1
                          text-sm
                          text-gray-500
                        "
                      >
                        Connect with fellow students.
                      </p>

                    </div>

                  </div>

                </div>

                <div
                  className="
                    bg-gray-50
                    rounded-2xl
                    p-5
                    border
                    border-gray-100
                    mr-8
                  "
                >

                  <div className="flex items-center gap-4">

                    <div
                      className="
                        w-12
                        h-12
                        rounded-xl
                        bg-green-100
                        text-green-600
                        flex
                        items-center
                        justify-center
                      "
                    >
                      <FiPackage size={23} />
                    </div>

                    <div>

                      <p
                        className="
                          font-bold
                          text-gray-900
                        "
                      >
                        Give items another life
                      </p>

                      <p
                        className="
                          mt-1
                          text-sm
                          text-gray-500
                        "
                      >
                        Sell what you no longer need.
                      </p>

                    </div>

                  </div>

                </div>

              </div>

            </div>

          </div>

        </div>

      </section>

      {/* =====================================================
          CTA
      ===================================================== */}

      <section className="py-20 sm:py-24">

        <div
          className="
            max-w-7xl
            mx-auto
            px-5
            sm:px-8
            lg:px-10
          "
        >

          <div
            className="
              relative
              overflow-hidden
              rounded-[2rem]
              bg-green-600
              px-7
              py-14
              sm:px-12
              sm:py-16
              text-center
            "
          >

            <div
              className="
                absolute
                -top-24
                -right-24
                w-64
                h-64
                rounded-full
                bg-green-500
              "
            />

            <div
              className="
                absolute
                -bottom-28
                -left-20
                w-60
                h-60
                rounded-full
                bg-green-700/50
              "
            />

            <div className="relative z-10">

              <div
                className="
                  mx-auto
                  w-14
                  h-14
                  rounded-2xl
                  bg-white/15
                  text-white
                  flex
                  items-center
                  justify-center
                "
              >
                <FiShoppingBag size={27} />
              </div>

              <h2
                className="
                  mt-6
                  text-3xl
                  sm:text-4xl
                  font-bold
                  text-white
                "
              >
                Ready to join your campus marketplace?
              </h2>

              <p
                className="
                  mt-4
                  max-w-2xl
                  mx-auto
                  text-sm
                  sm:text-base
                  leading-7
                  text-green-50
                "
              >
                Create your CampusMart account and become
                part of a simpler way for students to buy,
                sell and connect.
              </p>

              <div
                className="
                  mt-8
                  flex
                  flex-col
                  sm:flex-row
                  justify-center
                  gap-3
                "
              >

                <button
                  type="button"
                  onClick={goToRegister}
                  className="
                    inline-flex
                    items-center
                    justify-center
                    gap-2
                    px-7
                    py-3.5
                    rounded-xl
                    bg-white
                    text-green-700
                    font-semibold
                    text-sm
                    hover:bg-green-50
                    transition
                  "
                >
                  Create your account
                  <FiArrowRight size={17} />
                </button>

                <button
                  type="button"
                  onClick={goToLogin}
                  className="
                    inline-flex
                    items-center
                    justify-center
                    gap-2
                    px-7
                    py-3.5
                    rounded-xl
                    bg-green-700
                    text-white
                    font-semibold
                    text-sm
                    hover:bg-green-800
                    border
                    border-green-500
                    transition
                  "
                >
                  I already have an account
                </button>

              </div>

            </div>

          </div>

        </div>

      </section>

      {/* =====================================================
          FOOTER
      ===================================================== */}

      <footer
        className="
          border-t
          border-gray-100
          bg-white
        "
      >

        <div
          className="
            max-w-7xl
            mx-auto
            px-5
            sm:px-8
            lg:px-10
            py-12
          "
        >

          <div
            className="
              grid
              sm:grid-cols-2
              lg:grid-cols-4
              gap-10
            "
          >

            {/* BRAND */}

            <div className="lg:col-span-2">

              <div className="flex items-center gap-3">

                <div
                  className="
                    w-11
                    h-11
                    rounded-xl
                    bg-green-600
                    text-white
                    flex
                    items-center
                    justify-center
                  "
                >
                  <FiShoppingBag size={22} />
                </div>

                <div>

                  <p
                    className="
                      text-xl
                      font-bold
                      text-gray-900
                    "
                  >
                    Campus
                    <span className="text-green-600">
                      Mart
                    </span>
                  </p>

                  <p
                    className="
                      text-xs
                      text-gray-400
                    "
                  >
                    Your Campus Marketplace
                  </p>

                </div>

              </div>

              <p
                className="
                  mt-5
                  max-w-md
                  text-sm
                  leading-6
                  text-gray-500
                "
              >
                A marketplace built to help students buy,
                sell and connect within their campus
                community.
              </p>

            </div>

            {/* PLATFORM */}

            <div>

              <h3
                className="
                  text-sm
                  font-bold
                  text-gray-900
                "
              >
                Platform
              </h3>

              <div className="mt-4 space-y-3">

                <button
                  type="button"
                  onClick={goToMarketplace}
                  className="
                    block
                    text-sm
                    text-gray-500
                    hover:text-green-600
                  "
                >
                  Marketplace
                </button>

                <button
                  type="button"
                  onClick={() =>
                    scrollToSection("categories")
                  }
                  className="
                    block
                    text-sm
                    text-gray-500
                    hover:text-green-600
                  "
                >
                  Categories
                </button>

                <button
                  type="button"
                  onClick={() =>
                    scrollToSection("how-it-works")
                  }
                  className="
                    block
                    text-sm
                    text-gray-500
                    hover:text-green-600
                  "
                >
                  How it works
                </button>

              </div>

            </div>

            {/* ACCOUNT */}

            <div>

              <h3
                className="
                  text-sm
                  font-bold
                  text-gray-900
                "
              >
                Account
              </h3>

              <div className="mt-4 space-y-3">

                <button
                  type="button"
                  onClick={goToLogin}
                  className="
                    block
                    text-sm
                    text-gray-500
                    hover:text-green-600
                  "
                >
                  Log in
                </button>

                <button
                  type="button"
                  onClick={goToRegister}
                  className="
                    block
                    text-sm
                    text-gray-500
                    hover:text-green-600
                  "
                >
                  Create account
                </button>

              </div>

            </div>

          </div>

          <div
            className="
              mt-10
              pt-6
              border-t
              border-gray-100
              flex
              flex-col
              sm:flex-row
              items-center
              justify-between
              gap-3
            "
          >

            <p
              className="
                text-xs
                text-gray-400
              "
            >
              © {new Date().getFullYear()} CampusMart.
              All rights reserved.
            </p>

            <p
              className="
                text-xs
                text-gray-400
              "
            >
              Built for students, by students.
            </p>

          </div>

        </div>

      </footer>

    </div>
  );
}

export default Landing;