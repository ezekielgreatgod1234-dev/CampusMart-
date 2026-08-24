import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  FiArrowRight,
  FiSearch,
  FiShoppingCart,
  FiShield,
  FiTag,
  FiMessageSquare,
  FiBookOpen,
  FiMonitor,
  FiHome,
  FiBriefcase,
  FiActivity,
  FiGrid,
  FiUserPlus,
  FiShoppingBag,
  FiMessageCircle,
  FiCheckCircle,
  FiHeart,
  FiMapPin,
  FiMail,
  FiPhone,
  FiMap,
  FiMenu,
  FiX,
} from "react-icons/fi";

function Landing() {
  const navigate = useNavigate();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // =========================================================
  // COOKIE CONSENT
  // =========================================================

  const [cookieConsent, setCookieConsent] = useState(null);

  useEffect(() => {
    try {
      const cookies = document.cookie.split(";");

      const consentCookie = cookies.find((cookie) =>
        cookie.trim().startsWith("campusmart_cookie_consent=")
      );

      if (consentCookie) {
        const value = consentCookie.split("=")[1];

        if (value === "accepted" || value === "rejected") {
          setCookieConsent(value);
          return;
        }
      }

      // No decision has been made yet
      setCookieConsent(null);
    } catch (error) {
      console.error("Unable to read cookie consent:", error);

      // If cookies are unavailable, still show the banner
      setCookieConsent(null);
    }
  }, []);

  const setCookieConsentChoice = (choice) => {
    try {
      // Remember the user's choice for 1 year.
      const oneYear = 60 * 60 * 24 * 365;

      document.cookie = `campusmart_cookie_consent=${choice}; max-age=${oneYear}; path=/; SameSite=Lax`;

      setCookieConsent(choice);
    } catch (error) {
      console.error("Unable to save cookie consent:", error);

      // Still hide the banner for the current session
      setCookieConsent(choice);
    }
  };

  const acceptCookies = () => {
    setCookieConsentChoice("accepted");

    // =====================================================
    // PLACE OPTIONAL ANALYTICS / MARKETING INITIALIZATION
    // HERE LATER IF YOU ADD THEM.
    //
    // Example:
    // initializeAnalytics();
    // =====================================================
  };

  const rejectCookies = () => {
    setCookieConsentChoice("rejected");

    // =====================================================
    // IMPORTANT:
    // Do not initialize optional analytics/marketing cookies
    // after the user rejects them.
    // =====================================================
  };

  // =========================================================
  // NAVIGATION
  // =========================================================

  const goToBrowse = () => {
    setMobileMenuOpen(false);
    navigate("/browse-products");
  };

  const goToRegister = () => {
    setMobileMenuOpen(false);
    navigate("/register");
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  // =========================================================
  // CATEGORIES
  // =========================================================

  const categories = [
    {
      name: "Books & Notes",
      count: "234+ items",
      icon: <FiBookOpen size={32} />,
      image:
        "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&w=600&q=85",
    },
    {
      name: "Electronics",
      count: "189+ items",
      icon: <FiMonitor size={32} />,
      image:
        "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=600&q=85",
    },
    {
      name: "Furniture",
      count: "156+ items",
      icon: <FiHome size={32} />,
      image:
        "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=85",
    },
    {
      name: "Fashion",
      count: "312+ items",
      icon: <FiBriefcase size={32} />,
      image:
        "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=85",
    },
    {
      name: "Sports",
      count: "98+ items",
      icon: <FiActivity size={32} />,
      image:
        "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=600&q=85",
    },
    {
      name: "Others",
      count: "120+ items",
      icon: <FiGrid size={32} />,
      image:
        "https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=600&q=85",
    },
  ];

  // =========================================================
  // PRODUCTS
  // =========================================================

  const products = [
    {
      name: "MacBook Air M2",
      location: "UNN, Enugu",
      price: "₦650,000",
      badge: "FEATURED",
      image:
        "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=700&q=85",
    },
    {
      name: "Nike Air Force 1",
      location: "UNILAG, Lagos",
      price: "₦35,000",
      badge: "NEW",
      image:
        "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=700&q=85",
    },
    {
      name: "Herschel Backpack",
      location: "ABSU, Uturu",
      price: "₦18,000",
      badge: "FEATURED",
      image:
        "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=700&q=85",
    },
    {
      name: "Engineering Maths Book",
      location: "OAU, Ile-Ife",
      price: "₦4,500",
      badge: "NEW",
      image:
        "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=700&q=85",
    },
    {
      name: "JBL Headphones",
      location: "UDUS, Sokoto",
      price: "₦28,000",
      badge: "FEATURED",
      image:
        "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=700&q=85",
    },
    {
      name: "Foldable Study Lamp",
      location: "FUTO, Owerri",
      price: "₦6,000",
      badge: "NEW",
      image:
        "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=700&q=85",
    },
  ];

  // =========================================================
  // WHY CAMPUSMART
  // =========================================================

  const benefits = [
    {
      icon: <FiShield size={28} />,
      title: "Safe & Trusted",
      text: "Verified student community to ensure safe transactions.",
    },
    {
      icon: <FiTag size={28} />,
      title: "Affordable Deals",
      text: "Find budget-friendly items from fellow students.",
    },
    {
      icon: <FiMessageSquare size={28} />,
      title: "Easy Communication",
      text: "Chat directly with buyers and sellers in real-time.",
    },
    {
      icon: <FiBookOpen size={28} />,
      title: "Campus Focused",
      text: "Exclusively for university and polytechnic students.",
    },
  ];

  // =========================================================
  // HOW IT WORKS
  // =========================================================

  const steps = [
    {
      number: "1",
      icon: <FiUserPlus size={32} />,
      title: "Create Account",
      text: "Sign up using your school email or phone number.",
    },
    {
      number: "2",
      icon: <FiShoppingBag size={32} />,
      title: "List or Browse",
      text: "List your item for sale or browse items on campus.",
    },
    {
      number: "3",
      icon: <FiMessageCircle size={32} />,
      title: "Chat & Connect",
      text: "Message the seller or buyer directly in the app.",
    },
    {
      number: "4",
      icon: <FiCheckCircle size={32} />,
      title: "Meet & Complete",
      text: "Meet safely on campus and complete your transaction.",
    },
  ];

  // =========================================================
  // TESTIMONIALS
  // =========================================================

  const testimonials = [
    {
      name: "David Okafor",
      school: "ABSU, Uturu",
      image:
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS_FHz8TBochu8ZUUCaB-7pUlc22lMft0oiyTl7NPWmhQ&s=10",
      text: "I sold my laptop within a day! CampusMart is super safe and easy to use.",
    },
    {
      name: "Precious Nnamani",
      school: "ABSU, Uturu",
      image:
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSe5-sy75bSj_DrG5YmeqYwal1wHGucvbzk0bpbzP_5Qg&s=10",
      text: "Found the products i needed at great prices. Highly recommend CampusMart to all students!",
    },
    {
      name: "John Chinedu",
      school: "ABSU, Uturu",
      image:
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTm2b8ffmsmNApUaKZKgI-JwxKLCmMHYOomqF14d9_tMg&s=10",
      text: "The best marketplace for students. Highly recommend!",
    },
  ];

  // =========================================================
  // HERO FEATURES
  // =========================================================

  const heroFeatures = [
    {
      icon: <FiShield size={29} />,
      title: "Safe & Secure",
      text: "Verified campus community for safe transactions",
    },
    {
      icon: <FiTag size={29} />,
      title: "Great Deals",
      text: "Find affordable items from fellow students",
    },
    {
      icon: <FiMessageSquare size={29} />,
      title: "Easy Communication",
      text: "Chat directly with buyers and sellers",
    },
    {
      icon: <FiActivity size={29} />,
      title: "Campus Focused",
      text: "Built exclusively for university students",
    },
  ];

  // =========================================================
  // STATS
  // =========================================================

  const stats = [
    {
      number: "1,000+",
      label: "Active Students",
      icon: <FiUserPlus size={25} />,
    },
    {
      number: "2,500+",
      label: "Products Listed",
      icon: <FiShoppingCart size={25} />,
    },
    {
      number: "98%",
      label: "Positive Reviews",
      icon: <FiMessageCircle size={25} />,
    },
    {
      number: "100%",
      label: "Secure",
      icon: <FiMap size={25} />,
    },
  ];

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="landing-page min-h-screen bg-white text-gray-900 overflow-x-hidden">

      {/* =====================================================
          COOKIE BANNER ANIMATION
      ===================================================== */}

      <style>
        {`
          @keyframes campusMartCookieSlideIn {
            0% {
              opacity: 0;
              transform: translateY(120%);
            }

            60% {
              opacity: 1;
              transform: translateY(-4px);
            }

            100% {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .campusmart-cookie-slide-in {
            animation: campusMartCookieSlideIn 5s cubic-bezier(0.22, 1, 0.36, 1) both;
          }

          @media (prefers-reduced-motion: reduce) {
            .campusmart-cookie-slide-in {
              animation: none;
            }
          }
        `}
      </style>

      {/* =====================================================
          NAVBAR
      ===================================================== */}

      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100">
        <div className="max-w-[1400px] mx-auto px-5 sm:px-8 lg:px-10">
          <div className="h-[70px] sm:h-[78px] flex items-center justify-between">

            {/* LOGO */}

            <Link
              to="/"
              className="flex items-center gap-2.5 shrink-0"
              onClick={closeMobileMenu}
            >
              <div
                className="
                  w-10 h-10
                  sm:w-11 sm:h-11
                  rounded-xl
                  bg-[#008236]
                  text-white
                  flex
                  items-center
                  justify-center
                  shrink-0
                  border
                  border-green-700/20
                  shadow-[0_5px_12px_rgba(0,0,0,0.42)]
                "
              >
                <span
                  className="
                    text-[15px]
                    sm:text-[17px]
                    font-black
                    tracking-tight
                    leading-none
                    drop-shadow-[0_2px_2px_rgba(0,0,0,0.35)]
                  "
                >
                  CM
                </span>
              </div>

              <div className="text-lg sm:text-2xl font-extrabold tracking-tight">
                Campus
                <span className="text-green-600">Mart</span>
              </div>
            </Link>

            {/* DESKTOP NAV */}

            <nav className="hidden lg:flex items-center gap-8 xl:gap-9">
              <a
                href="#home"
                className="text-sm font-semibold text-green-600 border-b-2 border-green-600 py-7"
              >
                Home
              </a>

              <button
                onClick={goToBrowse}
                className="text-sm font-medium text-gray-700 hover:text-green-600 transition"
              >
                Browse Products
              </button>

              <a
                href="#how-it-works"
                className="text-sm font-medium text-gray-700 hover:text-green-600 transition"
              >
                How it Works
              </a>

              <a
                href="#about"
                className="text-sm font-medium text-gray-700 hover:text-green-600 transition"
              >
                About Us
              </a>

              <a
                href="#contact"
                className="text-sm font-medium text-gray-700 hover:text-green-600 transition"
              >
                Contact
              </a>
            </nav>

            {/* DESKTOP RIGHT SIDE */}

            <div className="hidden md:flex items-center gap-3">
              <div className="hidden xl:flex items-center w-[230px] h-10 rounded-full border border-gray-200 bg-white px-4">
                <FiSearch size={17} className="text-gray-400" />

                <input
                  type="text"
                  placeholder="Search products..."
                  className="w-full ml-3 text-sm outline-none bg-transparent placeholder:text-gray-400"
                />
              </div>

              <button
                type="button"
                onClick={() => navigate("/cart")}
                className="flex w-10 h-10 items-center justify-center rounded-full hover:bg-gray-50 transition"
              >
                <FiShoppingCart size={20} />
              </button>

              <Link
                to="/login"
                className="h-10 px-5 rounded-xl bg-green-600 text-white flex items-center justify-center text-sm font-semibold hover:bg-green-700 transition shadow-sm"
              >
                Login
              </Link>
            </div>

            {/* MOBILE MENU BUTTON */}

            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="lg:hidden w-11 h-11 rounded-xl border border-gray-200 flex items-center justify-center text-gray-800 hover:bg-gray-50 transition"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
            </button>
          </div>
        </div>

        {/* MOBILE MENU */}

        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-100 bg-white shadow-lg">
            <div className="px-5 sm:px-8 py-5">
              <nav className="flex flex-col">
                <a
                  href="#home"
                  onClick={closeMobileMenu}
                  className="py-3.5 text-sm font-semibold text-green-600 border-b border-gray-100"
                >
                  Home
                </a>

                <button
                  onClick={goToBrowse}
                  className="py-3.5 text-left text-sm font-medium text-gray-700 border-b border-gray-100"
                >
                  Browse Products
                </button>

                <a
                  href="#how-it-works"
                  onClick={closeMobileMenu}
                  className="py-3.5 text-sm font-medium text-gray-700 border-b border-gray-100"
                >
                  How it Works
                </a>

                <a
                  href="#about"
                  onClick={closeMobileMenu}
                  className="py-3.5 text-sm font-medium text-gray-700 border-b border-gray-100"
                >
                  About Us
                </a>

                <a
                  href="#contact"
                  onClick={closeMobileMenu}
                  className="py-3.5 text-sm font-medium text-gray-700 border-b border-gray-100"
                >
                  Contact
                </a>

                <button
                  type="button"
                  onClick={() => navigate("/cart")}
                  className="mt-4 h-11 rounded-xl border border-gray-200 flex items-center justify-center gap-2 text-sm font-semibold text-gray-700"
                >
                  <FiShoppingCart size={18} />
                  Cart
                </button>

                <Link
                  to="/login"
                  onClick={closeMobileMenu}
                  className="mt-3 h-11 rounded-xl bg-green-600 text-white flex items-center justify-center text-sm font-semibold"
                >
                  Login
                </Link>
              </nav>
            </div>
          </div>
        )}
      </header>

      {/* =====================================================
          HERO
      ===================================================== */}

      <section
        id="home"
        className="relative overflow-hidden bg-gradient-to-br from-[#f5fff8] via-white to-[#f0fff5]"
      >
        <div className="max-w-[1400px] mx-auto px-5 sm:px-8 lg:px-10">
          <div className="relative min-h-[auto] lg:min-h-[600px] flex flex-col lg:block">

            <div
              className="
                relative z-20
                w-full lg:w-[49%] xl:w-[48%]
                py-12 sm:py-16 lg:py-20
              "
            >
              <div className="inline-flex items-center gap-2 rounded-full bg-green-50 border border-green-100 px-3.5 py-2 text-xs sm:text-sm font-semibold text-green-700">
                <span className="w-5 h-5 rounded-full bg-green-600 text-white flex items-center justify-center text-[10px]">
                  ★
                </span>

                The #1 Marketplace for Students
              </div>

              <h1
                className="
                  mt-6 sm:mt-7
                  text-[42px]
                  sm:text-[52px]
                  lg:text-[57px]
                  xl:text-[64px]
                  leading-[0.98]
                  font-black
                  tracking-[-0.045em]
                  max-w-[650px]
                "
              >
                Buy, Sell, Connect.

                <br />

                <span className="text-green-600">All on Campus.</span>
              </h1>

              <p className="mt-6 sm:mt-7 max-w-[500px] text-sm sm:text-lg leading-7 sm:leading-8 text-gray-600">
                CampusMart makes it easy for students to buy and sell items
                within their campus community.
              </p>

              <div className="mt-7 sm:mt-8 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={goToBrowse}
                  className="
                    h-11 sm:h-12
                    px-4 sm:px-5
                    rounded-xl
                    bg-green-600
                    text-white
                    text-sm
                    font-semibold
                    flex items-center gap-2.5
                    hover:bg-green-700
                    transition
                    shadow-sm
                    whitespace-nowrap
                  "
                >
                  Browse Products
                  <FiArrowRight size={17} />
                </button>

                <button
                  type="button"
                  onClick={goToRegister}
                  className="
                    h-11 sm:h-12
                    px-4 sm:px-5
                    rounded-xl
                    bg-white
                    border border-gray-200
                    text-gray-800
                    text-sm
                    font-semibold
                    flex items-center gap-2.5
                    hover:border-green-300
                    hover:text-green-700
                    transition
                    whitespace-nowrap
                  "
                >
                  Sell an Item
                  <FiTag size={17} />
                </button>
              </div>

              <div className="mt-7 sm:mt-8 flex items-center gap-4">
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4, 5].map((item) => (
                    <img
                      key={item}
                      src={`https://i.pravatar.cc/80?img=${item + 10}`}
                      alt=""
                      className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border-2 border-white object-cover"
                    />
                  ))}
                </div>

                <div>
                  <p className="font-bold text-gray-900 text-xs sm:text-sm">
                    Join students
                  </p>

                  <p className="text-xs sm:text-sm text-gray-500">
                    already using CampusMart
                  </p>
                </div>
              </div>
            </div>

            <div
              className="
                hidden lg:block
                absolute
                right-[-30px]
                xl:right-[-20px]
                top-0
                w-[55%]
                h-full
              "
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[#f5fff8] via-[#f5fff8]/30 to-transparent z-10 pointer-events-none" />

              <img
                src="/3stud.png"
                alt="Three students using CampusMart"
                className="
                  absolute
                  right-0
                  bottom-0
                  w-full
                  h-[94%]
                  object-contain
                  object-right-bottom
                "
              />
            </div>

            <div className="lg:hidden w-full -mt-2 pb-10">
              <div className="relative w-full overflow-hidden rounded-3xl">
                <img
                  src="/3stud.png"
                  alt="Three students using CampusMart"
                  className="
                    w-full
                    h-[310px]
                    sm:h-[390px]
                    object-cover
                    object-center
                  "
                />
              </div>
            </div>
          </div>
        </div>

        {/* HERO FEATURE BAR */}

        <div className="relative z-30 max-w-[1250px] mx-auto px-5 sm:px-8 lg:px-0 pb-7">
          <div className="rounded-2xl bg-green-600 text-white shadow-xl overflow-hidden">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              {heroFeatures.map((item, index) => (
                <div
                  key={item.title}
                  className={`flex items-center gap-4 px-6 py-6 ${
                    index !== 3 ? "lg:border-r lg:border-white/20" : ""
                  }`}
                >
                  <div className="w-14 h-14 rounded-full border-2 border-white/70 flex items-center justify-center shrink-0">
                    {item.icon}
                  </div>

                  <div>
                    <h3 className="font-bold text-sm sm:text-base">
                      {item.title}
                    </h3>

                    <p className="mt-1 text-xs sm:text-sm text-green-50 leading-5">
                      {item.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          CATEGORIES
      ===================================================== */}

      <section className="py-16 sm:py-20">
        <div className="max-w-[1250px] mx-auto px-5 sm:px-8">
          <div className="text-center">
            <h2 className="text-3xl sm:text-4xl font-black">
              Shop by <span className="text-green-600">Category</span>
            </h2>

            <p className="mt-3 text-gray-500">
              Find exactly what you need
            </p>
          </div>

          <div className="mt-10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((category) => (
              <button
                key={category.name}
                type="button"
                onClick={goToBrowse}
                className="group bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition overflow-hidden text-left"
              >
                <div className="h-[135px] bg-gray-50 overflow-hidden">
                  <img
                    src={category.image}
                    alt={category.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  />
                </div>

                <div className="p-4 text-center">
                  <h3 className="font-bold text-sm text-gray-900">
                    {category.name}
                  </h3>

                  <p className="mt-1 text-xs text-gray-500">
                    {category.count}{" "}
                    <span className="text-green-600">→</span>
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================
          STATS
      ===================================================== */}

      <section className="pb-16">
        <div className="max-w-[1250px] mx-auto px-5 sm:px-8">
          <div className="rounded-2xl bg-[#f1faf4] border border-green-50">
            <div className="grid grid-cols-2 lg:grid-cols-4">
              {stats.map((stat, index) => (
                <div
                  key={stat.label}
                  className={`flex items-center gap-4 px-6 py-6 ${
                    index < 3 ? "lg:border-r border-green-100" : ""
                  }`}
                >
                  <div className="w-12 h-12 rounded-full bg-white border border-green-100 text-green-600 flex items-center justify-center shrink-0">
                    {stat.icon}
                  </div>

                  <div>
                    <p className="text-xl font-black">{stat.number}</p>

                    <p className="text-sm text-gray-600">
                      {stat.label}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          WHY STUDENTS LOVE CAMPUSMART
      ===================================================== */}

      <section
        id="about"
        className="py-16 sm:py-20 bg-gray-50/60"
      >
        <div className="max-w-[1250px] mx-auto px-5 sm:px-8">
          <div className="text-center">
            <h2 className="text-3xl sm:text-4xl font-black">
              Why Students Love{" "}
              <span className="text-green-600">CampusMart</span>
            </h2>

            <p className="mt-3 text-gray-500">
              Built for students. By students.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {benefits.map((benefit) => (
              <div
                key={benefit.title}
                className="bg-white rounded-2xl border border-gray-100 p-7 text-center shadow-sm hover:shadow-md transition"
              >
                <div className="mx-auto w-16 h-16 rounded-full bg-green-50 text-green-600 flex items-center justify-center">
                  {benefit.icon}
                </div>

                <h3 className="mt-5 font-bold text-lg">
                  {benefit.title}
                </h3>

                <p className="mt-3 text-sm text-gray-500 leading-6">
                  {benefit.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================
          POPULAR PRODUCTS
      ===================================================== */}

      <section className="py-16 sm:py-20">
        <div className="max-w-[1250px] mx-auto px-5 sm:px-8">
          <div className="flex items-center justify-between gap-5">
            <h2 className="text-2xl sm:text-3xl font-black">
              Popular <span className="text-green-600">Right Now</span>
            </h2>

            <button
              onClick={goToBrowse}
              className="hidden sm:flex items-center gap-2 text-sm font-semibold text-green-700 hover:text-green-800"
            >
              View all products
              <FiArrowRight />
            </button>
          </div>

          <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {products.map((product) => (
              <div
                key={product.name}
                className="group rounded-xl border border-gray-100 bg-white overflow-hidden shadow-sm hover:shadow-md transition"
              >
                <div className="relative h-[180px] bg-gray-100 overflow-hidden">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  />

                  <span className="absolute top-3 left-3 px-2 py-1 rounded-md bg-green-600 text-white text-[9px] font-bold">
                    {product.badge}
                  </span>
                </div>

                <div className="p-4">
                  <h3 className="font-bold text-sm truncate">
                    {product.name}
                  </h3>

                  <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                    <FiMapPin size={12} />

                    <span className="truncate">
                      {product.location}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-2">
                    <span className="font-black text-green-600 text-sm">
                      {product.price}
                    </span>

                    <button
                      type="button"
                      className="text-gray-400 hover:text-red-500 transition"
                    >
                      <FiHeart size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={goToBrowse}
            className="sm:hidden mt-7 w-full h-12 rounded-xl border border-green-200 text-green-700 font-semibold flex items-center justify-center gap-2"
          >
            View all products
            <FiArrowRight />
          </button>

          <div className="flex justify-center gap-2 mt-7">
            <span className="w-2.5 h-2.5 rounded-full bg-green-600" />
            <span className="w-2.5 h-2.5 rounded-full bg-gray-200" />
            <span className="w-2.5 h-2.5 rounded-full bg-gray-200" />
            <span className="w-2.5 h-2.5 rounded-full bg-gray-200" />
            <span className="w-2.5 h-2.5 rounded-full bg-gray-200" />
          </div>
        </div>
      </section>

      {/* =====================================================
          HOW IT WORKS
      ===================================================== */}

      <section
        id="how-it-works"
        className="py-16 sm:py-20 bg-gray-50/60"
      >
        <div className="max-w-[1250px] mx-auto px-5 sm:px-8">
          <div className="text-center">
            <h2 className="text-3xl sm:text-4xl font-black">
              How <span className="text-green-600">CampusMart</span> Works
            </h2>

            <p className="mt-3 text-gray-500">
              Buy or sell in just a few simple steps
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-5">
            {steps.map((step, index) => (
              <div
                key={step.title}
                className="relative text-center"
              >
                {index !== steps.length - 1 && (
                  <div className="hidden lg:block absolute top-10 left-[65%] w-[70%] border-t-2 border-dashed border-green-200" />
                )}

                <div className="relative mx-auto w-20 h-20 rounded-full bg-green-50 text-green-600 flex items-center justify-center">
                  {step.icon}

                  <span className="absolute -top-1 -left-2 w-7 h-7 rounded-full bg-green-600 text-white text-xs font-bold flex items-center justify-center border-4 border-white">
                    {step.number}
                  </span>
                </div>

                <h3 className="mt-6 font-bold text-lg">
                  {step.title}
                </h3>

                <p className="mt-3 text-sm text-gray-500 leading-6 max-w-[230px] mx-auto">
                  {step.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================
          TESTIMONIALS
      ===================================================== */}

      <section className="py-16 sm:py-20">
        <div className="max-w-[1250px] mx-auto px-5 sm:px-8">
          <div className="text-center">
            <h2 className="text-3xl sm:text-4xl font-black">
              What <span className="text-green-600">Students</span> Are Saying
            </h2>
          </div>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-5">
            {testimonials.map((testimonial) => (
              <div
                key={testimonial.name}
                className="rounded-2xl border border-gray-100 bg-white shadow-sm p-6"
              >
                <div className="text-green-600 text-3xl font-black leading-none">
                  “
                </div>

                <div className="flex gap-1 mt-1 text-green-600">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span key={star}>★</span>
                  ))}
                </div>

                <p className="mt-4 text-sm text-gray-600 leading-6">
                  {testimonial.text}
                </p>

                <div className="mt-6 flex items-center gap-3">
                  <img
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="w-11 h-11 rounded-full object-cover"
                  />

                  <div>
                    <p className="font-bold text-sm">
                      {testimonial.name}
                    </p>

                    <p className="text-xs text-gray-500 mt-1">
                      {testimonial.school}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================
          CTA
      ===================================================== */}

      <section className="pb-10">
        <div className="max-w-[1250px] mx-auto px-5 sm:px-8">
          <div className="relative overflow-hidden rounded-2xl bg-green-700 text-white">
            <div className="relative z-20 px-7 sm:px-10 py-10 sm:py-12 max-w-[700px]">
              <h2 className="text-3xl sm:text-4xl font-black">
                Ready to Buy or Sell?
              </h2>

              <p className="mt-4 text-green-50 leading-7 max-w-[520px]">
                Join thousands of students already using CampusMart to make
                campus life easier.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <button
                  onClick={goToRegister}
                  className="h-11 px-5 rounded-xl bg-white text-green-700 font-bold text-sm flex items-center gap-2 hover:bg-green-50 transition"
                >
                  Get Started Now
                  <FiArrowRight />
                </button>

                <button
                  onClick={goToBrowse}
                  className="h-11 px-5 rounded-xl border border-white/60 text-white font-bold text-sm hover:bg-white/10 transition"
                >
                  Browse Products
                </button>
              </div>
            </div>

            <img
              src="/3stud.png"
              alt=""
              className="hidden sm:block absolute right-0 bottom-0 h-full w-[45%] object-cover object-top opacity-95"
            />

            <div className="absolute inset-y-0 right-0 w-[55%] bg-gradient-to-r from-green-700 via-green-700/50 to-transparent pointer-events-none" />
          </div>
        </div>
      </section>

      {/* =====================================================
          FOOTER
      ===================================================== */}

      <footer id="contact" className="bg-[#00261d] text-white">
        <div className="max-w-[1250px] mx-auto px-5 sm:px-8 py-14">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10">

            {/* BRAND */}

            <div className="lg:col-span-2">
              <Link
                to="/"
                className="inline-flex items-center gap-3"
              >
                <div
                  className="
                    w-11 h-11
                    rounded-xl
                    bg-[#008236]
                    flex
                    items-center
                    justify-center
                    border
                    border-green-700/20
                    shadow-[0_5px_12px_rgba(0,0,0,0.55)]
                  "
                >
                  <span
                    className="
                      text-white
                      text-[17px]
                      font-black
                      tracking-tight
                      leading-none
                      drop-shadow-[0_2px_2px_rgba(0,0,0,0.4)]
                    "
                  >
                    CM
                  </span>
                </div>

                <span className="text-2xl font-black">
                  Campus
                  <span className="text-green-400">Mart</span>
                </span>
              </Link>

              <p className="mt-5 text-sm leading-6 text-gray-300 max-w-[330px]">
                The #1 marketplace for students to buy, sell and connect within
                their campus community.
              </p>
            </div>

            {/* MARKETPLACE */}

            <div>
              <h3 className="font-bold mb-5">
                Marketplace
              </h3>

              <ul className="space-y-3 text-sm text-gray-300">
                <li>
                  <button
                    onClick={goToBrowse}
                    className="hover:text-green-400"
                  >
                    Browse Products
                  </button>
                </li>

                <li>
                  <button
                    onClick={goToBrowse}
                    className="hover:text-green-400"
                  >
                    All Categories
                  </button>
                </li>

                <li>
                  <a
                    href="#how-it-works"
                    className="hover:text-green-400"
                  >
                    How It Works
                  </a>
                </li>

                <li>
                  <button
                    onClick={goToRegister}
                    className="hover:text-green-400"
                  >
                    Sell an Item
                  </button>
                </li>
              </ul>
            </div>

            {/* SUPPORT */}

            <div>
              <h3 className="font-bold mb-5">
                Condictions & Support
              </h3>

              <ul className="space-y-3 text-sm text-gray-300">
                <li>
                  <Link
                    to="/privacy-policy"
                    className="hover:text-green-400 transition"
                  >
                    Privacy Policy
                  </Link>
                </li>

                <li>
                  <Link
                    to="/terms-and-conditions"
                    className="hover:text-green-400 transition"
                  >
                    Terms & Conditions
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* CONTACT */}

          <div className="mt-12 pt-8 border-t border-white/10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex flex-wrap gap-5 text-sm text-gray-300">

                <span className="flex items-center gap-2">
                  <FiPhone className="text-green-400" />
                  +234 704 320 5587
                </span>

                <span className="flex items-center gap-2">
                  <FiMail className="text-green-400" />
                  support@campusmart.com
                </span>

                <span className="flex items-center gap-2">
                  <FiMapPin className="text-green-400" />
                  Nigeria
                </span>
              </div>

              <p className="text-sm text-gray-400">
                © 2026 CampusMart. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>

      {/* =====================================================
          COOKIE CONSENT BANNER
          SLOW SLIDE-IN FROM BOTTOM
      ===================================================== */}

      {cookieConsent === null && (
        <div
          className="
            fixed
            bottom-0
            left-0
            right-0
            z-[9999]
            px-4
            sm:px-6
            lg:px-8
            pb-4
            sm:pb-5
            pointer-events-none
          "
        >
          <div
            className="
              max-w-[1100px]
              mx-auto
              pointer-events-auto
              bg-white
              border
              border-gray-200
              rounded-2xl
              shadow-[0_10px_40px_rgba(0,0,0,0.16)]
              overflow-hidden
              campusmart-cookie-slide-in
            "
          >
            <div className="p-5 sm:p-6">
              <div className="flex flex-col lg:flex-row lg:items-center gap-5">

                {/* COOKIE ICON */}

                <div className="hidden sm:flex w-12 h-12 rounded-xl bg-green-50 text-green-600 items-center justify-center shrink-0">
                  <FiShield size={24} />
                </div>

                {/* MESSAGE */}

                <div className="flex-1">
                  <h3 className="text-base sm:text-lg font-black text-gray-900">
                    We value your privacy
                  </h3>

                  <p className="mt-1.5 text-xs sm:text-sm text-gray-500 leading-5 sm:leading-6">
                    CampusMart uses cookies to help keep the website working
                    properly and improve your experience. You can accept or
                    reject optional cookies. Your choice will be remembered.
                  </p>

                  <Link
                    to="/privacy-policy"
                    className="inline-block mt-2 text-xs sm:text-sm font-semibold text-green-600 hover:text-green-700"
                  >
                    Read our Privacy Policy
                  </Link>
                </div>

                {/* BUTTONS */}

                <div className="flex flex-col sm:flex-row gap-2.5 shrink-0">
                  <button
                    type="button"
                    onClick={rejectCookies}
                    className="
                      h-11
                      px-5
                      rounded-xl
                      border
                      border-gray-200
                      bg-white
                      text-gray-700
                      text-sm
                      font-semibold
                      hover:bg-gray-50
                      hover:border-gray-300
                      transition
                    "
                  >
                    Reject Cookies
                  </button>

                  <button
                    type="button"
                    onClick={acceptCookies}
                    className="
                      h-11
                      px-5
                      rounded-xl
                      bg-green-600
                      text-white
                      text-sm
                      font-semibold
                      hover:bg-green-700
                      transition
                      shadow-sm
                      flex
                      items-center
                      justify-center
                      gap-2
                    "
                  >
                    <FiCheckCircle size={17} />
                    Accept Cookies
                  </button>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Landing;