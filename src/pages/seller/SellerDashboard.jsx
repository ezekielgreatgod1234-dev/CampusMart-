import { useMemo, useState } from "react";

import { useNavigate, useLocation } from "react-router-dom";

import {
  FiGrid,
  FiPackage,
  FiBriefcase,
  FiShoppingBag,
  FiCalendar,
  FiMessageCircle,
  FiDollarSign,
  FiStar,
  FiBarChart2,
  FiTag,
  FiUser,
  FiSettings,
  FiLogOut,
  FiMenu,
  FiChevronDown,
  FiDownload,
  FiX,
  FiBell,
  FiPlus,
  FiTrendingUp,
  FiClock,
  FiCheckCircle,
  FiCreditCard,
} from "react-icons/fi";

import { useAuth } from "../../context/AuthContext";

// =====================================================
// SELLER DASHBOARD
// =====================================================

function SellerDashboard({ unreadMessages = 0 }) {
  const navigate = useNavigate();
  const location = useLocation();

  const { firebaseUser } = useAuth();

  // =====================================================
  // SIDEBAR
  // =====================================================

  const [sidebarOpen, setSidebarOpen] = useState(false);

  // =====================================================
  // SALES PERIOD
  // =====================================================

  const [salesPeriod, setSalesPeriod] = useState("week");

  /*
   * Selected month is stored as a number:
   *
   * 0  = January
   * 1  = February
   * ...
   * 11 = December
   */
  const [selectedMonth, setSelectedMonth] = useState(7);

  /*
   * Selected week.
   *
   * 0 = Week 1
   * 1 = Week 2
   * 2 = Week 3
   * 3 = Week 4
   * 4 = Week 5
   */
  const [selectedWeek, setSelectedWeek] = useState(2);

  // =====================================================
  // DROPDOWN STATES
  // =====================================================

  const [monthDropdownOpen, setMonthDropdownOpen] =
    useState(false);

  const [weekDropdownOpen, setWeekDropdownOpen] =
    useState(false);

  // =====================================================
  // SELLER PROFILE
  // =====================================================

  const sellerFullName =
    firebaseUser?.displayName?.trim() || "GreatGod Ezekiel";

  const sellerFirstName =
    sellerFullName.split(/\s+/)[0] || "GreatGod";

  const sellerImage = firebaseUser?.photoURL || null;

  // =====================================================
  // MONTH NAMES
  // =====================================================

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  // =====================================================
  // MENU ITEMS
  // =====================================================

  const menuItems = [
    {
      label: "Dashboard",
      icon: FiGrid,
      path: "/seller-dashboard",
    },
    {
      label: "Products",
      icon: FiPackage,
      path: "/seller/products",
    },
    {
      label: "Orders",
      icon: FiShoppingBag,
      path: "/seller/orders",
    },
    {
      label: "Messages",
      icon: FiMessageCircle,
      path: "/seller/messages",
      badge: unreadMessages,
    },
    {
      label: "Earnings",
      icon: FiDollarSign,
      path: "/seller/earnings",
    },
    {
      label: "Reviews",
      icon: FiStar,
      path: "/seller/reviews",
    },
    {
      label: "Analytics",
      icon: FiBarChart2,
      path: "/seller/analytics",
    },
    {
      label: "Promotions",
      icon: FiTag,
      path: "/seller/promotions",
      new: true,
    },
    {
      label: "Profile",
      icon: FiUser,
      path: "/seller/profile",
    },
    {
      label: "Settings",
      icon: FiSettings,
      path: "/seller/settings",
    },
  ];

  // =====================================================
  // ACTIVE MENU
  // =====================================================

  const isActive = (path) => {
    if (path === "/seller-dashboard") {
      return location.pathname === "/seller-dashboard";
    }

    return location.pathname.startsWith(path);
  };

  // =====================================================
  // NAVIGATION
  // =====================================================

  const handleNavigation = (path) => {
    setSidebarOpen(false);
    navigate(path);
  };

  // =====================================================
  // LOGOUT
  // =====================================================

  const handleLogout = () => {
    setSidebarOpen(false);
    navigate("/logout");
  };

  // =====================================================
  // EXPORT
  // =====================================================

  const handleExport = () => {
    console.log("Export seller report");
  };

  // =====================================================
  // NOTIFICATIONS
  // =====================================================

  const handleNotifications = () => {
    console.log("Open seller notifications");
  };

  // =====================================================
  // MONTHLY SALES DATA
  // =====================================================

  const monthlySalesData = [
    {
      month: "January",
      value: 54,
      revenue: 186000,
    },
    {
      month: "February",
      value: 62,
      revenue: 214500,
    },
    {
      month: "March",
      value: 49,
      revenue: 172300,
    },
    {
      month: "April",
      value: 71,
      revenue: 248700,
    },
    {
      month: "May",
      value: 66,
      revenue: 231400,
    },
    {
      month: "June",
      value: 78,
      revenue: 276800,
    },
    {
      month: "July",
      value: 73,
      revenue: 259600,
    },
    {
      month: "August",
      value: 88,
      revenue: 312500,
    },
    {
      month: "September",
      value: 69,
      revenue: 244900,
    },
    {
      month: "October",
      value: 82,
      revenue: 291300,
    },
    {
      month: "November",
      value: 91,
      revenue: 328700,
    },
    {
      month: "December",
      value: 86,
      revenue: 304200,
    },
  ];

  // =====================================================
  // WEEKLY DATA FOR EACH MONTH
  // =====================================================
  //
  // Every month has its own weeks.
  // Every week has Monday -> Sunday.
  //
  // This makes Week 1 January completely different
  // from Week 1 February, etc.
  //
  // =====================================================

  const weeklySalesData = {
    January: [
      [
        { day: "Mon", value: 42, revenue: 32500 },
        { day: "Tue", value: 48, revenue: 36100 },
        { day: "Wed", value: 39, revenue: 29400 },
        { day: "Thu", value: 57, revenue: 42800 },
        { day: "Fri", value: 64, revenue: 48200 },
        { day: "Sat", value: 71, revenue: 53600 },
        { day: "Sun", value: 61, revenue: 45900 },
      ],
      [
        { day: "Mon", value: 51, revenue: 38400 },
        { day: "Tue", value: 59, revenue: 44200 },
        { day: "Wed", value: 46, revenue: 34900 },
        { day: "Thu", value: 63, revenue: 47200 },
        { day: "Fri", value: 68, revenue: 51300 },
        { day: "Sat", value: 77, revenue: 58100 },
        { day: "Sun", value: 70, revenue: 52900 },
      ],
      [
        { day: "Mon", value: 45, revenue: 33800 },
        { day: "Tue", value: 55, revenue: 41500 },
        { day: "Wed", value: 61, revenue: 45900 },
        { day: "Thu", value: 72, revenue: 54200 },
        { day: "Fri", value: 67, revenue: 50400 },
        { day: "Sat", value: 82, revenue: 61800 },
        { day: "Sun", value: 75, revenue: 56600 },
      ],
      [
        { day: "Mon", value: 58, revenue: 43700 },
        { day: "Tue", value: 64, revenue: 48200 },
        { day: "Wed", value: 72, revenue: 54100 },
        { day: "Thu", value: 78, revenue: 58700 },
        { day: "Fri", value: 73, revenue: 54900 },
        { day: "Sat", value: 88, revenue: 66400 },
        { day: "Sun", value: 81, revenue: 61200 },
      ],
      [
        { day: "Mon", value: 49, revenue: 36800 },
        { day: "Tue", value: 56, revenue: 42100 },
        { day: "Wed", value: 63, revenue: 47400 },
        { day: "Thu", value: 69, revenue: 51900 },
        { day: "Fri", value: 76, revenue: 57200 },
        { day: "Sat", value: 84, revenue: 63300 },
        { day: "Sun", value: 72, revenue: 54300 },
      ],
    ],

    February: [
      [
        { day: "Mon", value: 46, revenue: 34700 },
        { day: "Tue", value: 54, revenue: 40700 },
        { day: "Wed", value: 49, revenue: 36900 },
        { day: "Thu", value: 62, revenue: 46700 },
        { day: "Fri", value: 71, revenue: 53400 },
        { day: "Sat", value: 79, revenue: 59600 },
        { day: "Sun", value: 68, revenue: 51300 },
      ],
      [
        { day: "Mon", value: 52, revenue: 39100 },
        { day: "Tue", value: 61, revenue: 45900 },
        { day: "Wed", value: 57, revenue: 42900 },
        { day: "Thu", value: 69, revenue: 52100 },
        { day: "Fri", value: 76, revenue: 57200 },
        { day: "Sat", value: 84, revenue: 63100 },
        { day: "Sun", value: 73, revenue: 55100 },
      ],
      [
        { day: "Mon", value: 43, revenue: 32400 },
        { day: "Tue", value: 58, revenue: 43700 },
        { day: "Wed", value: 64, revenue: 48200 },
        { day: "Thu", value: 74, revenue: 55600 },
        { day: "Fri", value: 69, revenue: 51900 },
        { day: "Sat", value: 86, revenue: 64700 },
        { day: "Sun", value: 78, revenue: 58600 },
      ],
      [
        { day: "Mon", value: 55, revenue: 41400 },
        { day: "Tue", value: 66, revenue: 49700 },
        { day: "Wed", value: 71, revenue: 53400 },
        { day: "Thu", value: 79, revenue: 59400 },
        { day: "Fri", value: 82, revenue: 61700 },
        { day: "Sat", value: 91, revenue: 68500 },
        { day: "Sun", value: 85, revenue: 63900 },
      ],
    ],

    March: [
      [
        { day: "Mon", value: 38, revenue: 28600 },
        { day: "Tue", value: 47, revenue: 35300 },
        { day: "Wed", value: 44, revenue: 33100 },
        { day: "Thu", value: 58, revenue: 43700 },
        { day: "Fri", value: 65, revenue: 48900 },
        { day: "Sat", value: 72, revenue: 54100 },
        { day: "Sun", value: 60, revenue: 45200 },
      ],
      [
        { day: "Mon", value: 43, revenue: 32400 },
        { day: "Tue", value: 52, revenue: 39100 },
        { day: "Wed", value: 49, revenue: 36800 },
        { day: "Thu", value: 63, revenue: 47300 },
        { day: "Fri", value: 71, revenue: 53400 },
        { day: "Sat", value: 78, revenue: 58700 },
        { day: "Sun", value: 69, revenue: 51900 },
      ],
      [
        { day: "Mon", value: 47, revenue: 35300 },
        { day: "Tue", value: 59, revenue: 44400 },
        { day: "Wed", value: 56, revenue: 42100 },
        { day: "Thu", value: 68, revenue: 51200 },
        { day: "Fri", value: 74, revenue: 55600 },
        { day: "Sat", value: 82, revenue: 61700 },
        { day: "Sun", value: 76, revenue: 57100 },
      ],
      [
        { day: "Mon", value: 51, revenue: 38400 },
        { day: "Tue", value: 63, revenue: 47300 },
        { day: "Wed", value: 69, revenue: 51900 },
        { day: "Thu", value: 75, revenue: 56400 },
        { day: "Fri", value: 81, revenue: 60900 },
        { day: "Sat", value: 88, revenue: 66200 },
        { day: "Sun", value: 79, revenue: 59400 },
      ],
      [
        { day: "Mon", value: 45, revenue: 33900 },
        { day: "Tue", value: 57, revenue: 42900 },
        { day: "Wed", value: 63, revenue: 47200 },
        { day: "Thu", value: 70, revenue: 52600 },
        { day: "Fri", value: 77, revenue: 57900 },
        { day: "Sat", value: 83, revenue: 62400 },
        { day: "Sun", value: 71, revenue: 53400 },
      ],
    ],

    April: [
      [
        { day: "Mon", value: 52, revenue: 39100 },
        { day: "Tue", value: 61, revenue: 45900 },
        { day: "Wed", value: 57, revenue: 42800 },
        { day: "Thu", value: 70, revenue: 52700 },
        { day: "Fri", value: 75, revenue: 56300 },
        { day: "Sat", value: 84, revenue: 63200 },
        { day: "Sun", value: 72, revenue: 54200 },
      ],
      [
        { day: "Mon", value: 48, revenue: 36200 },
        { day: "Tue", value: 56, revenue: 42100 },
        { day: "Wed", value: 65, revenue: 48800 },
        { day: "Thu", value: 73, revenue: 54900 },
        { day: "Fri", value: 79, revenue: 59200 },
        { day: "Sat", value: 87, revenue: 65400 },
        { day: "Sun", value: 81, revenue: 60900 },
      ],
      [
        { day: "Mon", value: 55, revenue: 41400 },
        { day: "Tue", value: 67, revenue: 50300 },
        { day: "Wed", value: 62, revenue: 46700 },
        { day: "Thu", value: 77, revenue: 57800 },
        { day: "Fri", value: 83, revenue: 62400 },
        { day: "Sat", value: 92, revenue: 69100 },
        { day: "Sun", value: 85, revenue: 63900 },
      ],
      [
        { day: "Mon", value: 61, revenue: 45900 },
        { day: "Tue", value: 72, revenue: 54100 },
        { day: "Wed", value: 76, revenue: 57100 },
        { day: "Thu", value: 82, revenue: 61600 },
        { day: "Fri", value: 88, revenue: 66100 },
        { day: "Sat", value: 95, revenue: 71300 },
        { day: "Sun", value: 89, revenue: 66900 },
      ],
    ],

    May: [
      [
        { day: "Mon", value: 45, revenue: 33800 },
        { day: "Tue", value: 54, revenue: 40600 },
        { day: "Wed", value: 50, revenue: 37500 },
        { day: "Thu", value: 63, revenue: 47200 },
        { day: "Fri", value: 70, revenue: 52600 },
        { day: "Sat", value: 79, revenue: 59400 },
        { day: "Sun", value: 67, revenue: 50400 },
      ],
      [
        { day: "Mon", value: 49, revenue: 36800 },
        { day: "Tue", value: 58, revenue: 43600 },
        { day: "Wed", value: 63, revenue: 47200 },
        { day: "Thu", value: 69, revenue: 51800 },
        { day: "Fri", value: 76, revenue: 57100 },
        { day: "Sat", value: 83, revenue: 62400 },
        { day: "Sun", value: 74, revenue: 55600 },
      ],
      [
        { day: "Mon", value: 53, revenue: 39900 },
        { day: "Tue", value: 64, revenue: 48100 },
        { day: "Wed", value: 69, revenue: 51800 },
        { day: "Thu", value: 74, revenue: 55500 },
        { day: "Fri", value: 81, revenue: 60800 },
        { day: "Sat", value: 89, revenue: 66900 },
        { day: "Sun", value: 77, revenue: 57900 },
      ],
      [
        { day: "Mon", value: 58, revenue: 43600 },
        { day: "Tue", value: 68, revenue: 51100 },
        { day: "Wed", value: 73, revenue: 54800 },
        { day: "Thu", value: 79, revenue: 59300 },
        { day: "Fri", value: 85, revenue: 63900 },
        { day: "Sat", value: 92, revenue: 69100 },
        { day: "Sun", value: 82, revenue: 61700 },
      ],
    ],

    June: [
      [
        { day: "Mon", value: 56, revenue: 42100 },
        { day: "Tue", value: 63, revenue: 47300 },
        { day: "Wed", value: 59, revenue: 44400 },
        { day: "Thu", value: 72, revenue: 54100 },
        { day: "Fri", value: 78, revenue: 58600 },
        { day: "Sat", value: 87, revenue: 65300 },
        { day: "Sun", value: 76, revenue: 57100 },
      ],
      [
        { day: "Mon", value: 61, revenue: 45800 },
        { day: "Tue", value: 69, revenue: 51900 },
        { day: "Wed", value: 65, revenue: 48800 },
        { day: "Thu", value: 78, revenue: 58500 },
        { day: "Fri", value: 84, revenue: 63100 },
        { day: "Sat", value: 91, revenue: 68300 },
        { day: "Sun", value: 80, revenue: 60100 },
      ],
      [
        { day: "Mon", value: 59, revenue: 44200 },
        { day: "Tue", value: 72, revenue: 54000 },
        { day: "Wed", value: 68, revenue: 51000 },
        { day: "Thu", value: 81, revenue: 60800 },
        { day: "Fri", value: 88, revenue: 66100 },
        { day: "Sat", value: 94, revenue: 70600 },
        { day: "Sun", value: 85, revenue: 63800 },
      ],
      [
        { day: "Mon", value: 64, revenue: 48100 },
        { day: "Tue", value: 75, revenue: 56300 },
        { day: "Wed", value: 79, revenue: 59300 },
        { day: "Thu", value: 85, revenue: 63800 },
        { day: "Fri", value: 91, revenue: 68400 },
        { day: "Sat", value: 97, revenue: 72800 },
        { day: "Sun", value: 89, revenue: 66800 },
      ],
    ],

    July: [
      [
        { day: "Mon", value: 50, revenue: 37500 },
        { day: "Tue", value: 59, revenue: 44300 },
        { day: "Wed", value: 54, revenue: 40600 },
        { day: "Thu", value: 68, revenue: 51000 },
        { day: "Fri", value: 74, revenue: 55500 },
        { day: "Sat", value: 83, revenue: 62300 },
        { day: "Sun", value: 71, revenue: 53300 },
      ],
      [
        { day: "Mon", value: 55, revenue: 41400 },
        { day: "Tue", value: 64, revenue: 48000 },
        { day: "Wed", value: 60, revenue: 45100 },
        { day: "Thu", value: 73, revenue: 54800 },
        { day: "Fri", value: 79, revenue: 59300 },
        { day: "Sat", value: 88, revenue: 66100 },
        { day: "Sun", value: 76, revenue: 57000 },
      ],
      [
        { day: "Mon", value: 58, revenue: 43600 },
        { day: "Tue", value: 68, revenue: 51000 },
        { day: "Wed", value: 64, revenue: 48000 },
        { day: "Thu", value: 77, revenue: 57800 },
        { day: "Fri", value: 84, revenue: 63000 },
        { day: "Sat", value: 91, revenue: 68300 },
        { day: "Sun", value: 81, revenue: 60800 },
      ],
      [
        { day: "Mon", value: 62, revenue: 46500 },
        { day: "Tue", value: 71, revenue: 53300 },
        { day: "Wed", value: 75, revenue: 56300 },
        { day: "Thu", value: 81, revenue: 60800 },
        { day: "Fri", value: 87, revenue: 65200 },
        { day: "Sat", value: 94, revenue: 70500 },
        { day: "Sun", value: 86, revenue: 64500 },
      ],
    ],

    August: [
      [
        { day: "Mon", value: 42, revenue: 32500 },
        { day: "Tue", value: 58, revenue: 41800 },
        { day: "Wed", value: 47, revenue: 36200 },
        { day: "Thu", value: 76, revenue: 52400 },
        { day: "Fri", value: 63, revenue: 44900 },
        { day: "Sat", value: 91, revenue: 68700 },
        { day: "Sun", value: 82, revenue: 61900 },
      ],
      [
        { day: "Mon", value: 51, revenue: 38400 },
        { day: "Tue", value: 66, revenue: 49500 },
        { day: "Wed", value: 59, revenue: 44200 },
        { day: "Thu", value: 72, revenue: 54100 },
        { day: "Fri", value: 81, revenue: 60900 },
        { day: "Sat", value: 94, revenue: 70700 },
        { day: "Sun", value: 86, revenue: 64700 },
      ],
      [
        { day: "Mon", value: 48, revenue: 36100 },
        { day: "Tue", value: 61, revenue: 45800 },
        { day: "Wed", value: 55, revenue: 41300 },
        { day: "Thu", value: 79, revenue: 59400 },
        { day: "Fri", value: 73, revenue: 54800 },
        { day: "Sat", value: 96, revenue: 72300 },
        { day: "Sun", value: 88, revenue: 66200 },
      ],
      [
        { day: "Mon", value: 56, revenue: 42100 },
        { day: "Tue", value: 69, revenue: 51800 },
        { day: "Wed", value: 64, revenue: 48100 },
        { day: "Thu", value: 83, revenue: 62400 },
        { day: "Fri", value: 78, revenue: 58600 },
        { day: "Sat", value: 98, revenue: 73600 },
        { day: "Sun", value: 91, revenue: 68400 },
      ],
      [
        { day: "Mon", value: 61, revenue: 45800 },
        { day: "Tue", value: 74, revenue: 55600 },
        { day: "Wed", value: 68, revenue: 51100 },
        { day: "Thu", value: 86, revenue: 64700 },
        { day: "Fri", value: 81, revenue: 60800 },
        { day: "Sat", value: 99, revenue: 74400 },
        { day: "Sun", value: 93, revenue: 69900 },
      ],
    ],

    September: [
      [
        { day: "Mon", value: 47, revenue: 35300 },
        { day: "Tue", value: 55, revenue: 41300 },
        { day: "Wed", value: 51, revenue: 38200 },
        { day: "Thu", value: 65, revenue: 48800 },
        { day: "Fri", value: 72, revenue: 54100 },
        { day: "Sat", value: 80, revenue: 60100 },
        { day: "Sun", value: 69, revenue: 51900 },
      ],
      [
        { day: "Mon", value: 52, revenue: 39100 },
        { day: "Tue", value: 63, revenue: 47200 },
        { day: "Wed", value: 58, revenue: 43600 },
        { day: "Thu", value: 71, revenue: 53300 },
        { day: "Fri", value: 78, revenue: 58500 },
        { day: "Sat", value: 86, revenue: 64600 },
        { day: "Sun", value: 75, revenue: 56300 },
      ],
      [
        { day: "Mon", value: 55, revenue: 41300 },
        { day: "Tue", value: 67, revenue: 50300 },
        { day: "Wed", value: 62, revenue: 46600 },
        { day: "Thu", value: 76, revenue: 57000 },
        { day: "Fri", value: 83, revenue: 62200 },
        { day: "Sat", value: 90, revenue: 67500 },
        { day: "Sun", value: 80, revenue: 60000 },
      ],
      [
        { day: "Mon", value: 60, revenue: 45000 },
        { day: "Tue", value: 72, revenue: 54000 },
        { day: "Wed", value: 76, revenue: 57000 },
        { day: "Thu", value: 82, revenue: 61500 },
        { day: "Fri", value: 88, revenue: 66000 },
        { day: "Sat", value: 94, revenue: 70500 },
        { day: "Sun", value: 85, revenue: 63700 },
      ],
    ],

    October: [
      [
        { day: "Mon", value: 54, revenue: 40500 },
        { day: "Tue", value: 62, revenue: 46500 },
        { day: "Wed", value: 58, revenue: 43500 },
        { day: "Thu", value: 70, revenue: 52500 },
        { day: "Fri", value: 77, revenue: 57800 },
        { day: "Sat", value: 86, revenue: 64500 },
        { day: "Sun", value: 74, revenue: 55500 },
      ],
      [
        { day: "Mon", value: 59, revenue: 44200 },
        { day: "Tue", value: 68, revenue: 51000 },
        { day: "Wed", value: 64, revenue: 48000 },
        { day: "Thu", value: 75, revenue: 56300 },
        { day: "Fri", value: 82, revenue: 61500 },
        { day: "Sat", value: 91, revenue: 68300 },
        { day: "Sun", value: 80, revenue: 60000 },
      ],
      [
        { day: "Mon", value: 63, revenue: 47200 },
        { day: "Tue", value: 72, revenue: 54000 },
        { day: "Wed", value: 68, revenue: 51000 },
        { day: "Thu", value: 80, revenue: 60000 },
        { day: "Fri", value: 86, revenue: 64500 },
        { day: "Sat", value: 94, revenue: 70500 },
        { day: "Sun", value: 84, revenue: 63000 },
      ],
      [
        { day: "Mon", value: 67, revenue: 50300 },
        { day: "Tue", value: 76, revenue: 57000 },
        { day: "Wed", value: 80, revenue: 60000 },
        { day: "Thu", value: 85, revenue: 63800 },
        { day: "Fri", value: 91, revenue: 68300 },
        { day: "Sat", value: 97, revenue: 72800 },
        { day: "Sun", value: 89, revenue: 66800 },
      ],
    ],

    November: [
      [
        { day: "Mon", value: 58, revenue: 43500 },
        { day: "Tue", value: 66, revenue: 49500 },
        { day: "Wed", value: 62, revenue: 46500 },
        { day: "Thu", value: 74, revenue: 55500 },
        { day: "Fri", value: 81, revenue: 60800 },
        { day: "Sat", value: 90, revenue: 67500 },
        { day: "Sun", value: 78, revenue: 58500 },
      ],
      [
        { day: "Mon", value: 63, revenue: 47200 },
        { day: "Tue", value: 71, revenue: 53300 },
        { day: "Wed", value: 68, revenue: 51000 },
        { day: "Thu", value: 79, revenue: 59300 },
        { day: "Fri", value: 86, revenue: 64500 },
        { day: "Sat", value: 94, revenue: 70500 },
        { day: "Sun", value: 84, revenue: 63000 },
      ],
      [
        { day: "Mon", value: 68, revenue: 51000 },
        { day: "Tue", value: 76, revenue: 57000 },
        { day: "Wed", value: 72, revenue: 54000 },
        { day: "Thu", value: 84, revenue: 63000 },
        { day: "Fri", value: 89, revenue: 66800 },
        { day: "Sat", value: 97, revenue: 72800 },
        { day: "Sun", value: 90, revenue: 67500 },
      ],
      [
        { day: "Mon", value: 71, revenue: 53300 },
        { day: "Tue", value: 79, revenue: 59300 },
        { day: "Wed", value: 82, revenue: 61500 },
        { day: "Thu", value: 88, revenue: 66000 },
        { day: "Fri", value: 93, revenue: 69800 },
        { day: "Sat", value: 99, revenue: 74300 },
        { day: "Sun", value: 94, revenue: 70500 },
      ],
    ],

    December: [
      [
        { day: "Mon", value: 56, revenue: 42000 },
        { day: "Tue", value: 64, revenue: 48000 },
        { day: "Wed", value: 60, revenue: 45000 },
        { day: "Thu", value: 73, revenue: 54800 },
        { day: "Fri", value: 80, revenue: 60000 },
        { day: "Sat", value: 89, revenue: 66800 },
        { day: "Sun", value: 77, revenue: 57800 },
      ],
      [
        { day: "Mon", value: 61, revenue: 45800 },
        { day: "Tue", value: 70, revenue: 52500 },
        { day: "Wed", value: 66, revenue: 49500 },
        { day: "Thu", value: 78, revenue: 58500 },
        { day: "Fri", value: 85, revenue: 63800 },
        { day: "Sat", value: 93, revenue: 69800 },
        { day: "Sun", value: 82, revenue: 61500 },
      ],
      [
        { day: "Mon", value: 65, revenue: 48800 },
        { day: "Tue", value: 74, revenue: 55500 },
        { day: "Wed", value: 70, revenue: 52500 },
        { day: "Thu", value: 82, revenue: 61500 },
        { day: "Fri", value: 88, revenue: 66000 },
        { day: "Sat", value: 96, revenue: 72000 },
        { day: "Sun", value: 87, revenue: 65300 },
      ],
      [
        { day: "Mon", value: 69, revenue: 51800 },
        { day: "Tue", value: 78, revenue: 58500 },
        { day: "Wed", value: 81, revenue: 60800 },
        { day: "Thu", value: 87, revenue: 65300 },
        { day: "Fri", value: 92, revenue: 69000 },
        { day: "Sat", value: 98, revenue: 73500 },
        { day: "Sun", value: 91, revenue: 68300 },
      ],
    ],
  };

  // =====================================================
  // CURRENT MONTH
  // =====================================================

  const currentMonthName = months[selectedMonth];

  // =====================================================
  // WEEKS FOR SELECTED MONTH
  // =====================================================

  const weeksForSelectedMonth =
    weeklySalesData[currentMonthName] || [];

  // =====================================================
  // CURRENT WEEK DATA
  // =====================================================

  const currentWeekData =
    weeksForSelectedMonth[selectedWeek] ||
    weeksForSelectedMonth[0] ||
    [];

  // =====================================================
  // SELECT MONTH
  // =====================================================

  const handleMonthSelect = (monthIndex) => {
    setSelectedMonth(monthIndex);

    /*
     * When changing month, start from Week 1
     * so the user immediately gets a valid week
     * belonging to that month.
     */
    setSelectedWeek(0);

    setMonthDropdownOpen(false);
    setWeekDropdownOpen(false);
  };

  // =====================================================
  // SELECT WEEK
  // =====================================================

  const handleWeekSelect = (weekIndex) => {
    setSelectedWeek(weekIndex);

    setWeekDropdownOpen(false);
  };

  // =====================================================
  // SALES DATA TO DISPLAY
  // =====================================================

  const salesData = useMemo(() => {
    if (salesPeriod === "month") {
      return monthlySalesData.map((item) => ({
        day: item.month.substring(0, 3),
        fullName: item.month,
        value: item.value,
        revenue: item.revenue,
      }));
    }

    return currentWeekData;
  }, [
    salesPeriod,
    selectedMonth,
    selectedWeek,
    currentWeekData,
  ]);

  // =====================================================
  // FORMATTING
  // =====================================================

  const formatNaira = (amount) =>
    `₦${Number(amount || 0).toLocaleString("en-NG")}`;

  // =====================================================
  // TOTAL REVENUE
  // =====================================================

  const totalRevenue = salesData.reduce(
    (total, item) =>
      total + Number(item.revenue || 0),
    0
  );

  // =====================================================
  // BEST SALES POINT
  // =====================================================

  const bestSalesPoint = salesData.reduce(
    (best, item) =>
      Number(item.value || 0) >
      Number(best?.value || 0)
        ? item
        : best,
    salesData[0]
  );

  // =====================================================
  // SELECTED PERIOD LABEL
  // =====================================================

  const periodLabel =
    salesPeriod === "month"
      ? currentMonthName
      : `Week ${selectedWeek + 1} • ${currentMonthName}`;

  // =====================================================
  // PERIOD DESCRIPTION
  // =====================================================

  const periodDescription =
    salesPeriod === "month"
      ? `Revenue movement across ${currentMonthName}.`
      : `Revenue movement for Week ${
          selectedWeek + 1
        } of ${currentMonthName}.`;

  // =====================================================
  // PERIOD COMPARISON
  // =====================================================

  const periodComparison =
    salesPeriod === "month"
      ? "vs. previous month"
      : "vs. previous week";

  // =====================================================
  // CURRENT CHANGE
  // =====================================================

  const currentChange =
    salesPeriod === "month"
      ? monthlySalesData[selectedMonth]?.value || 0
      : currentWeekData.length
      ? Math.round(
          currentWeekData.reduce(
            (sum, item) => sum + item.value,
            0
          ) / currentWeekData.length
        )
      : 0;

  // =====================================================
  // DASHBOARD STATISTICS
  // =====================================================

  const statistics =
    salesPeriod === "month"
      ? [
          {
            title: `${currentMonthName} Sales`,
            value: formatNaira(
              monthlySalesData[selectedMonth]?.revenue || 0
            ),
            change: `+${currentChange}%`,
            icon: FiDollarSign,
            iconBg: "bg-green-50",
            iconColor: "text-[#008236]",
          },
          {
            title: `${currentMonthName} Orders`,
            value: "342",
            change: "+14.7%",
            icon: FiShoppingBag,
            iconBg: "bg-blue-50",
            iconColor: "text-blue-600",
          },
          {
            title: `${currentMonthName} Bookings`,
            value: "118",
            change: "+11.2%",
            icon: FiCalendar,
            iconBg: "bg-purple-50",
            iconColor: "text-purple-600",
          },
          {
            title: `${currentMonthName} Earnings`,
            value: formatNaira(
              Math.round(
                (monthlySalesData[selectedMonth]?.revenue ||
                  0) * 0.75
              )
            ),
            change: "+16.8%",
            icon: FiCreditCard,
            iconBg: "bg-orange-50",
            iconColor: "text-orange-600",
          },
        ]
      : [
          {
            title: `Week ${selectedWeek + 1} Sales`,
            value: formatNaira(totalRevenue),
            change: "+12.5%",
            icon: FiDollarSign,
            iconBg: "bg-green-50",
            iconColor: "text-[#008236]",
          },
          {
            title: `Week ${selectedWeek + 1} Orders`,
            value: "128",
            change: "+8.2%",
            icon: FiShoppingBag,
            iconBg: "bg-blue-50",
            iconColor: "text-blue-600",
          },
          {
            title: `Week ${selectedWeek + 1} Bookings`,
            value: "46",
            change: "+5.4%",
            icon: FiCalendar,
            iconBg: "bg-purple-50",
            iconColor: "text-purple-600",
          },
          {
            title: `Week ${selectedWeek + 1} Earnings`,
            value: formatNaira(
              Math.round(totalRevenue * 0.75)
            ),
            change: "+10.8%",
            icon: FiCreditCard,
            iconBg: "bg-orange-50",
            iconColor: "text-orange-600",
          },
        ];

  // =====================================================
  // RECENT ORDERS
  // =====================================================

  const recentOrders = [
    {
      id: "#CM-1048",
      customer: "Daniel Okoro",
      product: "HP EliteBook Laptop",
      quantity: 1,
      amount: "₦285,000",
      status: "Delivered",
      date: "Aug 21, 2026",
    },
    {
      id: "#CM-1047",
      customer: "Chiamaka Grace",
      product: "Wireless Headphones",
      quantity: 2,
      amount: "₦18,500",
      status: "Pending",
      date: "Aug 20, 2026",
    },
    {
      id: "#CM-1046",
      customer: "Michael James",
      product: "Graphic Design Service",
      quantity: 1,
      amount: "₦25,000",
      status: "Delivered",
      date: "Aug 19, 2026",
    },
    {
      id: "#CM-1045",
      customer: "Samuel David",
      product: "USB-C Fast Charger",
      quantity: 1,
      amount: "₦7,500",
      status: "Pending",
      date: "Aug 18, 2026",
    },
  ];

  // =====================================================
  // TOP PRODUCTS
  // =====================================================

  const topProducts = [
    {
      name: "HP EliteBook Laptop",
      category: "Electronics",
      sales: "32 sales",
      amount: "₦9,120,000",
      percentage: 82,
    },
    {
      name: "Wireless Headphones",
      category: "Accessories",
      sales: "24 sales",
      amount: "₦444,000",
      percentage: 67,
    },
    {
      name: "Graphic Design Service",
      category: "Services",
      sales: "18 bookings",
      amount: "₦450,000",
      percentage: 54,
    },
  ];

  // =====================================================
  // GRAPH HELPERS
  // =====================================================

  const graphWidth = 1000;
  const graphHeight = 300;

  const graphPaddingLeft = 25;
  const graphPaddingRight = 25;
  const graphPaddingTop = 28;
  const graphPaddingBottom = 35;

  const usableWidth =
    graphWidth -
    graphPaddingLeft -
    graphPaddingRight;

  const usableHeight =
    graphHeight -
    graphPaddingTop -
    graphPaddingBottom;

  const maxValue = 100;

  const points =
    salesData.length === 1
      ? salesData.map((item) => ({
          ...item,
          x: graphWidth / 2,
          y:
            graphPaddingTop +
            usableHeight -
            (item.value / maxValue) * usableHeight,
        }))
      : salesData.map((item, index) => {
          const x =
            graphPaddingLeft +
            (index * usableWidth) /
              (salesData.length - 1);

          const y =
            graphPaddingTop +
            usableHeight -
            (item.value / maxValue) * usableHeight;

          return {
            ...item,
            x,
            y,
          };
        });

  const createSmoothPath = (dataPoints) => {
    if (!dataPoints.length) return "";

    let path = `M ${dataPoints[0].x} ${dataPoints[0].y}`;

    for (
      let i = 0;
      i < dataPoints.length - 1;
      i++
    ) {
      const current = dataPoints[i];
      const next = dataPoints[i + 1];

      const controlPointX =
        (current.x + next.x) / 2;

      path += `
        C
        ${controlPointX} ${current.y},
        ${controlPointX} ${next.y},
        ${next.x} ${next.y}
      `;
    }

    return path;
  };

  const linePath = createSmoothPath(points);

  const baselineY =
    graphHeight - graphPaddingBottom;

  const areaPath =
    points.length > 0
      ? `
        ${linePath}
        L ${points[points.length - 1].x} ${baselineY}
        L ${points[0].x} ${baselineY}
        Z
      `
      : "";

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="h-screen w-full bg-gray-50 text-gray-800 font-sans overflow-hidden">
      {/* MOBILE SIDEBAR OVERLAY */}

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}

      <aside
        className={`
          fixed
          inset-y-0
          left-0
          z-50
          w-[291px]
          min-w-[285px]
          lg:w-[291px]
          lg:min-w-[250px]
          bg-green-700
          text-white
          flex
          flex-col
          h-screen
          overflow-hidden
          shadow-2xl
          lg:shadow-none
          transition-transform
          duration-300
          ease-in-out
          ${
            sidebarOpen
              ? "translate-x-0"
              : "-translate-x-full lg:translate-x-0"
          }
        `}
      >
        {/* SIDEBAR HEADER */}

        <div className="relative px-5 pt-19 lg:pt-5 pb-4 flex-shrink-0">
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
            className="
              lg:hidden
              absolute
              top-3
              right-3
              w-9
              h-9
              rounded-lg
              text-white
              hover:bg-white/10
              active:bg-white/20
              flex
              items-center
              justify-center
              transition
              z-20
            "
          >
            <FiX size={21} strokeWidth={2.5} />
          </button>

          <div className="flex items-center gap-3 pr-10">
            <div
              className="
                w-10
                h-10
                min-w-[40px]
                rounded-xl
                bg-[#008236]
                flex
                items-center
                justify-center
                shadow-lg
                shadow-black/30
                border
                border-white/10
                flex-shrink-0
              "
            >
              <span className="text-white text-[16px] font-black tracking-tight">
                CM
              </span>
            </div>

            <div className="min-w-0">
              <h1 className="text-[30px] font-extrabold tracking-tight leading-none whitespace-nowrap">
                <span className="text-white">
                  Campus
                </span>
                <span className="text-green-300">
                  Mart
                </span>
              </h1>

              <p className="text-[10px] text-green-100 mt-1 whitespace-nowrap">
                Sell. Connect. Grow.
              </p>
            </div>
          </div>
        </div>

        {/* NAVIGATION */}

        <nav
          className="
            flex-1
            px-4
            py-3
            overflow-y-auto
            overflow-x-hidden
            overscroll-contain
            flex
            flex-col
            justify-start
            gap-1
          "
        >
          {menuItems.map(
            ({
              label,
              icon: Icon,
              path,
              badge,
              new: isNew,
            }) => {
              const active = isActive(path);

              return (
                <button
                  key={label}
                  type="button"
                  onClick={() =>
                    handleNavigation(path)
                  }
                  className={`
                    w-full
                    flex
                    items-center
                    gap-3
                    px-3.5
                    py-3
                    rounded-xl
                    text-left
                    transition-all
                    flex-shrink-0
                    ${
                      active
                        ? "bg-white text-[#008236] shadow-sm font-semibold"
                        : "text-white hover:bg-white/10 active:bg-white/20"
                    }
                  `}
                >
                  <Icon
                    size={19}
                    strokeWidth={active ? 2.5 : 2}
                    className="flex-shrink-0"
                  />

                  <span className="flex-1 text-[14px] whitespace-nowrap">
                    {label}
                  </span>

                  {badge > 0 && (
                    <span
                      className="
                        min-w-[21px]
                        h-[21px]
                        px-1.5
                        rounded-full
                        bg-red-500
                        text-white
                        text-[10px]
                        font-bold
                        flex
                        items-center
                        justify-center
                        flex-shrink-0
                      "
                    >
                      {badge}
                    </span>
                  )}

                  {isNew && (
                    <span
                      className={`
                        px-1.5
                        py-0.5
                        rounded-full
                        text-[9px]
                        font-bold
                        flex-shrink-0
                        ${
                          active
                            ? "bg-green-100 text-green-700"
                            : "bg-green-500 text-white"
                        }
                      `}
                    >
                      New
                    </span>
                  )}
                </button>
              );
            }
          )}
        </nav>

        {/* LOGOUT */}

        <div className="px-4 pb-4 flex-shrink-0">
          <button
            type="button"
            onClick={handleLogout}
            className="
              w-full
              flex
              items-center
              gap-3
              px-3.5
              py-3
              rounded-xl
              text-white
              hover:bg-white/10
              active:bg-white/20
              transition
              text-left
            "
          >
            <FiLogOut size={19} />

            <span className="text-[14px]">
              Logout
            </span>
          </button>
        </div>

        {/* PREMIUM CARD */}

        <div className="px-4 pb-3 flex-shrink-0">
          <div
            className="
              border
              border-green-300/30
              bg-green-900/20
              rounded-xl
              p-3.5
              text-center
            "
          >
            <div className="text-2xl mb-1">
              👑
            </div>

            <h3 className="font-bold text-sm">
              Go Premium
            </h3>

            <p className="text-[10px] text-green-100 leading-4 mt-1">
              Boost your products and services and
              reach more students.
            </p>

            <button
              type="button"
              onClick={() =>
                handleNavigation(
                  "/seller/promotions"
                )
              }
              className="
                w-full
                mt-2
                h-9
                rounded-lg
                bg-white
                text-[#008236]
                font-bold
                text-xs
                hover:bg-green-50
                active:bg-green-100
                transition
              "
            >
              Upgrade Now
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN AREA */}

      <div
        className="
          min-w-0
          flex
          flex-col
          h-screen
          w-full
          lg:ml-[291px]
          lg:w-[calc(100%-291px)]
        "
      >
        {/* TOP BAR */}

        <header
          className="
            min-h-[70px]
            bg-[#007233]
            text-white
            flex
            items-center
            px-3
            sm:px-5
            lg:px-8
            py-3
            gap-2
            sm:gap-4
            flex-shrink-0
          "
        >
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
            className="
              lg:hidden
              w-10
              h-10
              min-w-[40px]
              rounded-lg
              hover:bg-white/10
              active:bg-white/20
              flex
              items-center
              justify-center
              flex-shrink-0
            "
          >
            <FiMenu size={24} />
          </button>

          <div
            className="
              flex
              items-center
              gap-2
              text-white
              flex-shrink-0
            "
          >
            <FiShoppingBag
              size={19}
              className="text-green-200"
            />

            <span
              className="
                text-sm
                sm:text-base
                font-semibold
                whitespace-nowrap
              "
            >
              Your Store
            </span>
          </div>

          <div
            className="
              ml-auto
              flex
              items-center
              gap-0.5
              sm:gap-2
            "
          >
            <button
              type="button"
              onClick={handleNotifications}
              aria-label="Notifications"
              className="
                relative
                w-9
                h-9
                sm:w-10
                sm:h-10
                rounded-full
                hover:bg-white/10
                active:bg-white/20
                flex
                items-center
                justify-center
                transition
                flex-shrink-0
              "
            >
              <FiBell size={20} />

              <span
                className="
                  absolute
                  -top-0.5
                  -right-0.5
                  min-w-[17px]
                  h-[17px]
                  px-1
                  rounded-full
                  bg-red-500
                  text-white
                  text-[9px]
                  font-bold
                  flex
                  items-center
                  justify-center
                "
              >
                5
              </span>
            </button>

            <button
              type="button"
              onClick={() =>
                handleNavigation(
                  "/seller/messages"
                )
              }
              aria-label="Messages"
              className="
                relative
                w-9
                h-9
                sm:w-10
                sm:h-10
                rounded-full
                hover:bg-white/10
                active:bg-white/20
                flex
                items-center
                justify-center
                transition
                flex-shrink-0
              "
            >
              <FiMessageCircle size={20} />

              {unreadMessages > 0 && (
                <span
                  className="
                    absolute
                    -top-0.5
                    -right-0.5
                    min-w-[17px]
                    h-[17px]
                    px-1
                    rounded-full
                    bg-red-500
                    text-white
                    text-[9px]
                    font-bold
                    flex
                    items-center
                    justify-center
                  "
                >
                  {unreadMessages}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() =>
                handleNavigation(
                  "/seller/profile"
                )
              }
              className="
                flex
                items-center
                gap-2
                ml-0.5
                hover:bg-white/10
                active:bg-white/20
                rounded-lg
                px-1
                sm:px-1.5
                py-1.5
                transition
                flex-shrink-0
              "
            >
              {sellerImage ? (
                <img
                  src={sellerImage}
                  alt={sellerFullName}
                  className="
                    w-8
                    h-8
                    sm:w-9
                    sm:h-9
                    rounded-full
                    object-cover
                    border-2
                    border-white/30
                  "
                />
              ) : (
                <div
                  className="
                    w-8
                    h-8
                    sm:w-9
                    sm:h-9
                    rounded-full
                    bg-gray-200
                    text-gray-700
                    flex
                    items-center
                    justify-center
                    font-bold
                    text-sm
                    border-2
                    border-white/30
                    flex-shrink-0
                  "
                >
                  {sellerFirstName
                    ?.charAt(0)
                    ?.toUpperCase()}
                </div>
              )}

              <div
                className="
                  hidden
                  sm:block
                  text-left
                "
              >
                <p
                  className="
                    text-xs
                    font-bold
                    leading-4
                    max-w-[180px]
                    truncate
                  "
                  title={sellerFullName}
                >
                  {sellerFullName}
                </p>

                <p
                  className="
                    text-[10px]
                    text-green-100
                    mt-0.5
                  "
                >
                  Seller
                </p>
              </div>

              <FiChevronDown
                size={16}
                className="hidden sm:block"
              />
            </button>
          </div>
        </header>

        {/* DASHBOARD CONTENT */}

        <main
          className="
            flex-1
            overflow-y-auto
            overflow-x-hidden
            bg-gray-50
            px-3
            sm:px-5
            md:px-6
            lg:px-8
            py-5
            sm:py-6
            lg:py-8
            font-sans
          "
        >
          {/* WELCOME HEADER */}

          <section className="mb-6 sm:mb-7">
            <div
              className="
                bg-gradient-to-r
                from-[#007233]
                to-[#008f3f]
                rounded-2xl
                p-5
                sm:p-6
                lg:p-7
                text-white
                shadow-sm
                relative
                overflow-visible
              "
            >
              <div
                className="
                  absolute
                  -right-10
                  -top-16
                  w-48
                  h-48
                  rounded-full
                  bg-white/10
                "
              />

              <div
                className="
                  absolute
                  right-16
                  -bottom-24
                  w-40
                  h-40
                  rounded-full
                  bg-white/5
                "
              />

              <div
                className="
                  relative
                  z-20
                  flex
                  flex-col
                  lg:flex-row
                  lg:items-center
                  lg:justify-between
                  gap-5
                "
              >
                <div>
                  <div
                    className="
                      inline-flex
                      items-center
                      gap-2
                      px-3
                      py-1
                      rounded-full
                      bg-white/10
                      border
                      border-white/10
                      text-[11px]
                      font-medium
                      mb-3
                    "
                  >
                    <span
                      className="
                        w-1.5
                        h-1.5
                        rounded-full
                        bg-green-300
                      "
                    />

                    Seller Dashboard
                  </div>

                  <h1
                    className="
                      text-2xl
                      sm:text-3xl
                      font-bold
                      tracking-tight
                    "
                  >
                    Welcome back,{" "}
                    {sellerFirstName}!
                  </h1>

                  <p
                    className="
                      text-sm
                      sm:text-base
                      text-green-50
                      mt-1.5
                      max-w-xl
                      leading-6
                    "
                  >
                    Here's what's happening with
                    your CampusMart business today.
                  </p>
                </div>

                <div
                  className="
                    flex
                    flex-col
                    sm:flex-row
                    gap-3
                  "
                >
                  {/* PERIOD SWITCHER */}

                  <div
                    className="
                      h-11
                      p-1
                      rounded-xl
                      bg-white/10
                      border
                      border-white/20
                      backdrop-blur-sm
                      flex
                      items-center
                      gap-1
                    "
                  >
                    {/* WEEK BUTTON + DROPDOWN */}

                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => {
                          setSalesPeriod("week");
                          setWeekDropdownOpen(
                            (value) => !value
                          );
                          setMonthDropdownOpen(false);
                        }}
                        aria-pressed={
                          salesPeriod === "week"
                        }
                        className={`
                          h-9
                          px-4
                          rounded-lg
                          flex
                          items-center
                          justify-center
                          gap-2
                          text-xs
                          sm:text-sm
                          font-semibold
                          transition-all
                          ${
                            salesPeriod === "week"
                              ? "bg-white text-[#007233] shadow-sm"
                              : "text-white hover:bg-white/10"
                          }
                        `}
                      >
                        Week
                        <FiChevronDown
                          size={13}
                          className={`transition-transform ${
                            weekDropdownOpen
                              ? "rotate-180"
                              : ""
                          }`}
                        />
                      </button>

                      {weekDropdownOpen && (
                        <div
                          className="
                            absolute
                            top-11
                            left-0
                            w-[210px]
                            bg-white
                            rounded-xl
                            shadow-2xl
                            border
                            border-gray-100
                            overflow-hidden
                            z-[100]
                          "
                        >
                          <div className="px-3 py-2 border-b border-gray-100">
                            <p className="text-[10px] font-bold uppercase text-gray-400">
                              Select Week
                            </p>

                            <p className="text-xs font-semibold text-gray-700 mt-0.5">
                              {currentMonthName}
                            </p>
                          </div>

                          <div className="max-h-[240px] overflow-y-auto p-1.5">
                            {weeksForSelectedMonth.map(
                              (_, index) => {
                                const active =
                                  selectedWeek ===
                                  index;

                                return (
                                  <button
                                    key={index}
                                    type="button"
                                    onClick={() =>
                                      handleWeekSelect(
                                        index
                                      )
                                    }
                                    className={`
                                      w-full
                                      text-left
                                      px-3
                                      py-2.5
                                      rounded-lg
                                      flex
                                      items-center
                                      justify-between
                                      transition
                                      ${
                                        active
                                          ? "bg-green-50 text-[#008236]"
                                          : "text-gray-600 hover:bg-gray-50"
                                      }
                                    `}
                                  >
                                    <span>
                                      <span
                                        className={`block text-xs font-semibold ${
                                          active
                                            ? "text-[#008236]"
                                            : "text-gray-700"
                                        }`}
                                      >
                                        Week{" "}
                                        {index + 1}
                                      </span>

                                      <span className="block text-[10px] text-gray-400 mt-0.5">
                                        {currentMonthName}
                                      </span>
                                    </span>

                                    {active && (
                                      <FiCheckCircle
                                        size={15}
                                      />
                                    )}
                                  </button>
                                );
                              }
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* MONTH BUTTON + DROPDOWN */}

                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => {
                          setSalesPeriod("month");
                          setMonthDropdownOpen(
                            (value) => !value
                          );
                          setWeekDropdownOpen(false);
                        }}
                        aria-pressed={
                          salesPeriod === "month"
                        }
                        className={`
                          h-9
                          px-4
                          rounded-lg
                          flex
                          items-center
                          justify-center
                          gap-2
                          text-xs
                          sm:text-sm
                          font-semibold
                          transition-all
                          ${
                            salesPeriod === "month"
                              ? "bg-white text-[#007233] shadow-sm"
                              : "text-white hover:bg-white/10"
                          }
                        `}
                      >
                        Month
                        <FiChevronDown
                          size={13}
                          className={`transition-transform ${
                            monthDropdownOpen
                              ? "rotate-180"
                              : ""
                          }`}
                        />
                      </button>

                      {monthDropdownOpen && (
                        <div
                          className="
                            absolute
                            top-11
                            right-0
                            w-[190px]
                            bg-white
                            rounded-xl
                            shadow-2xl
                            border
                            border-gray-100
                            overflow-hidden
                            z-[100]
                          "
                        >
                          <div className="px-3 py-2 border-b border-gray-100">
                            <p className="text-[10px] font-bold uppercase text-gray-400">
                              Select Month
                            </p>
                          </div>

                          <div className="max-h-[280px] overflow-y-auto p-1.5">
                            {months.map(
                              (month, index) => {
                                const active =
                                  selectedMonth ===
                                  index;

                                return (
                                  <button
                                    key={month}
                                    type="button"
                                    onClick={() =>
                                      handleMonthSelect(
                                        index
                                      )
                                    }
                                    className={`
                                      w-full
                                      text-left
                                      px-3
                                      py-2.5
                                      rounded-lg
                                      flex
                                      items-center
                                      justify-between
                                      transition
                                      ${
                                        active
                                          ? "bg-green-50 text-[#008236]"
                                          : "text-gray-600 hover:bg-gray-50"
                                      }
                                    `}
                                  >
                                    <span className="text-xs font-semibold">
                                      {month}
                                    </span>

                                    {active && (
                                      <FiCheckCircle
                                        size={15}
                                      />
                                    )}
                                  </button>
                                );
                              }
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleExport}
                    className="
                      h-11
                      px-4
                      bg-white/10
                      border
                      border-white/20
                      text-white
                      rounded-xl
                      flex
                      items-center
                      justify-center
                      gap-2
                      text-sm
                      font-semibold
                      hover:bg-white/20
                      transition
                      whitespace-nowrap
                    "
                  >
                    <FiDownload size={17} />
                    Export Report
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* SELECTED PERIOD INDICATOR */}

          <div className="mb-5 sm:mb-6 flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-400">
              Viewing:
            </span>

            <span
              className="
                inline-flex
                items-center
                gap-1.5
                px-2.5
                py-1.5
                rounded-lg
                bg-green-50
                text-[#008236]
                text-xs
                font-bold
                border
                border-green-100
              "
            >
              <FiCalendar size={12} />
              {periodLabel}
            </span>

            {salesPeriod === "week" && (
              <span className="text-[10px] text-gray-400">
                Monday – Sunday
              </span>
            )}
          </div>

          {/* STATISTICS */}

          <section
            className="
              grid
              grid-cols-2
              lg:grid-cols-4
              gap-3
              sm:gap-4
              mb-5
              sm:mb-6
            "
          >
            {statistics.map(
              ({
                title,
                value,
                change,
                icon: Icon,
                iconBg,
                iconColor,
              }) => (
                <div
                  key={title}
                  className="
                    group
                    relative
                    overflow-hidden
                    bg-white
                    rounded-2xl
                    border
                    border-gray-100
                    p-4
                    sm:p-5
                    shadow-[0_2px_10px_rgba(15,23,42,0.04)]
                    hover:-translate-y-0.5
                    hover:shadow-[0_12px_30px_rgba(15,23,42,0.08)]
                    transition-all
                    duration-200
                    min-w-0
                  "
                >
                  <div
                    className="
                      absolute
                      right-0
                      top-0
                      w-24
                      h-24
                      rounded-full
                      bg-gray-50
                      -translate-y-1/2
                      translate-x-1/2
                      opacity-80
                    "
                  />

                  <div
                    className="
                      relative
                      flex
                      items-start
                      justify-between
                      gap-3
                    "
                  >
                    <div
                      className={`
                        w-11
                        h-11
                        rounded-2xl
                        ${iconBg}
                        ${iconColor}
                        flex
                        items-center
                        justify-center
                        flex-shrink-0
                        ring-4
                        ring-white
                      `}
                    >
                      <Icon
                        size={20}
                        strokeWidth={2.2}
                      />
                    </div>

                    <span
                      className="
                        inline-flex
                        items-center
                        rounded-full
                        bg-green-50
                        px-2
                        py-1
                        text-[10px]
                        font-bold
                        text-[#008236]
                      "
                    >
                      {change}
                    </span>
                  </div>

                  <div className="relative mt-5">
                    <p
                      className="
                        text-[11px]
                        sm:text-xs
                        font-medium
                        text-gray-500
                      "
                    >
                      {title}
                    </p>

                    <h2
                      className="
                        text-xl
                        sm:text-2xl
                        font-bold
                        text-gray-900
                        tracking-tight
                        truncate
                        mt-1
                      "
                    >
                      {value}
                    </h2>

                    <div className="mt-3 flex items-center gap-2">
                      <span className="h-1.5 w-8 rounded-full bg-[#008236]" />

                      <span className="text-[10px] text-gray-400 truncate">
                        {periodComparison}
                      </span>
                    </div>
                  </div>
                </div>
              )
            )}
          </section>

          {/* SALES OVERVIEW */}

          <section className="mb-5 sm:mb-6">
            <div
              className="
                bg-white
                rounded-2xl
                border
                border-gray-100
                shadow-sm
                overflow-hidden
              "
            >
              <div
                className="
                  p-5
                  sm:p-6
                  border-b
                  border-gray-100
                  flex
                  flex-col
                  sm:flex-row
                  sm:items-center
                  sm:justify-between
                  gap-4
                "
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h2
                      className="
                        text-base
                        sm:text-lg
                        font-bold
                        text-gray-800
                      "
                    >
                      Sales Overview
                    </h2>

                    <span
                      className="
                        hidden
                        sm:inline-flex
                        items-center
                        gap-1
                        px-2
                        py-1
                        rounded-full
                        bg-green-50
                        text-[#008236]
                        text-[10px]
                        font-bold
                      "
                    >
                      <FiTrendingUp size={11} />
                      {salesPeriod === "month"
                        ? "18.4%"
                        : "12.5%"}
                    </span>
                  </div>

                  <p
                    className="
                      text-xs
                      sm:text-sm
                      text-gray-500
                      mt-1
                    "
                  >
                    {periodDescription}
                  </p>
                </div>

                <div
                  className="
                    inline-flex
                    items-center
                    gap-2
                    rounded-xl
                    bg-gray-50
                    border
                    border-gray-100
                    px-3
                    h-9
                  "
                >
                  <span className="h-2 w-2 rounded-full bg-[#008236]" />

                  <span className="text-xs font-semibold text-gray-600">
                    {periodLabel}
                  </span>
                </div>
              </div>

              <div className="p-5 sm:p-6">
                {/* REVENUE SUMMARY */}

                <div
                  className="
                    flex
                    flex-col
                    sm:flex-row
                    sm:items-end
                    sm:justify-between
                    gap-4
                    mb-5
                  "
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className="
                          w-2
                          h-2
                          rounded-full
                          bg-[#008236]
                          shadow-[0_0_0_4px_rgba(0,130,54,0.10)]
                        "
                      />

                      <p className="text-xs text-gray-500">
                        Total revenue
                      </p>
                    </div>

                    <h3
                      className="
                        text-2xl
                        sm:text-3xl
                        font-bold
                        text-gray-800
                        tracking-tight
                        mt-1
                      "
                    >
                      {formatNaira(totalRevenue)}
                    </h3>

                    <div
                      className="
                        flex
                        items-center
                        gap-1.5
                        mt-1.5
                      "
                    >
                      <span
                        className="
                          inline-flex
                          items-center
                          gap-1
                          px-1.5
                          py-0.5
                          rounded-md
                          bg-green-50
                          text-[#008236]
                          text-[10px]
                          font-bold
                        "
                      >
                        <FiTrendingUp size={11} />

                        {salesPeriod === "month"
                          ? "18.4%"
                          : "12.5%"}
                      </span>

                      <span className="text-xs text-gray-400">
                        {periodComparison}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-[10px] text-gray-400">
                        Best{" "}
                        {salesPeriod === "month"
                          ? "month"
                          : "day"}
                      </p>

                      <p
                        className="
                          text-xs
                          font-semibold
                          text-gray-700
                          mt-0.5
                        "
                      >
                        {bestSalesPoint?.fullName ||
                          bestSalesPoint?.day ||
                          "—"}
                      </p>
                    </div>

                    <div className="w-px h-8 bg-gray-100" />

                    <div>
                      <p className="text-[10px] text-gray-400">
                        {salesPeriod === "month"
                          ? "Peak activity"
                          : "Peak sales"}
                      </p>

                      <p
                        className="
                          text-xs
                          font-semibold
                          text-gray-700
                          mt-0.5
                        "
                      >
                        {bestSalesPoint?.value || 0}%
                      </p>
                    </div>
                  </div>
                </div>

                {/* GRAPH */}

                <div
                  className="
                    w-full
                    h-[280px]
                    relative
                    overflow-hidden
                  "
                >
                  <svg
                    viewBox={`0 0 ${graphWidth} ${graphHeight}`}
                    preserveAspectRatio="none"
                    className="
                      absolute
                      inset-0
                      w-full
                      h-full
                      overflow-visible
                    "
                  >
                    <defs>
                      <linearGradient
                        id="salesAreaGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="#008236"
                          stopOpacity="0.24"
                        />

                        <stop
                          offset="65%"
                          stopColor="#008236"
                          stopOpacity="0.07"
                        />

                        <stop
                          offset="100%"
                          stopColor="#008236"
                          stopOpacity="0"
                        />
                      </linearGradient>

                      <linearGradient
                        id="salesLineGradient"
                        x1="0"
                        y1="0"
                        x2="1"
                        y2="0"
                      >
                        <stop
                          offset="0%"
                          stopColor="#006f2e"
                        />

                        <stop
                          offset="50%"
                          stopColor="#008236"
                        />

                        <stop
                          offset="100%"
                          stopColor="#00a84f"
                        />
                      </linearGradient>

                      <filter
                        id="salesLineShadow"
                        x="-20%"
                        y="-20%"
                        width="140%"
                        height="160%"
                      >
                        <feDropShadow
                          dx="0"
                          dy="5"
                          stdDeviation="5"
                          floodColor="#008236"
                          floodOpacity="0.16"
                        />
                      </filter>
                    </defs>

                    {[0, 25, 50, 75, 100].map(
                      (value) => {
                        const y =
                          graphPaddingTop +
                          usableHeight -
                          (value / maxValue) *
                            usableHeight;

                        return (
                          <line
                            key={value}
                            x1={graphPaddingLeft}
                            x2={
                              graphWidth -
                              graphPaddingRight
                            }
                            y1={y}
                            y2={y}
                            stroke="#eef2f3"
                            strokeWidth="1"
                            strokeDasharray="3 6"
                          />
                        );
                      }
                    )}

                    {points.map((point, index) => (
                      <line
                        key={`vertical-${point.day}-${index}`}
                        x1={point.x}
                        x2={point.x}
                        y1={graphPaddingTop}
                        y2={baselineY}
                        stroke="#f5f7f7"
                        strokeWidth="1"
                        strokeDasharray="2 7"
                      />
                    ))}

                    <path
                      d={areaPath}
                      fill="url(#salesAreaGradient)"
                    />

                    <path
                      d={linePath}
                      fill="none"
                      stroke="#008236"
                      strokeWidth="7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      opacity="0.10"
                      filter="url(#salesLineShadow)"
                    />

                    <path
                      d={linePath}
                      fill="none"
                      stroke="url(#salesLineGradient)"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                    {points.map(
                      (point, index) => {
                        const isLast =
                          index ===
                          points.length - 1;

                        return (
                          <g
                            key={`${point.day}-${index}`}
                          >
                            <circle
                              cx={point.x}
                              cy={point.y}
                              r={isLast ? 11 : 8}
                              fill="#008236"
                              opacity={
                                isLast ? 0.1 : 0.06
                              }
                            />

                            <circle
                              cx={point.x}
                              cy={point.y}
                              r={isLast ? 5 : 4}
                              fill="white"
                              stroke="#008236"
                              strokeWidth="2.5"
                            />

                            <title>
                              {point.fullName ||
                                point.day}
                              :{" "}
                              {formatNaira(
                                point.revenue
                              )}
                            </title>
                          </g>
                        );
                      }
                    )}
                  </svg>

                  {/* Y AXIS */}

                  <div
                    className="
                      absolute
                      left-0
                      top-0
                      bottom-8
                      w-8
                      flex
                      flex-col
                      justify-between
                      pointer-events-none
                    "
                  >
                    {[100, 75, 50, 25, 0].map(
                      (value) => (
                        <span
                          key={value}
                          className="
                            text-[9px]
                            sm:text-[10px]
                            text-gray-400
                            leading-none
                          "
                        >
                          {value}
                        </span>
                      )
                    )}
                  </div>

                  {/* X AXIS */}

                  <div
                    className="
                      absolute
                      bottom-0
                      left-8
                      right-0
                      flex
                      justify-between
                      px-1
                    "
                  >
                    {salesData.map(
                      ({ day, fullName }, index) => (
                        <span
                          key={`${day}-${index}`}
                          className="
                            text-[10px]
                            sm:text-xs
                            text-gray-400
                            font-medium
                          "
                          title={fullName}
                        >
                          {day}
                        </span>
                      )
                    )}
                  </div>
                </div>

                {/* GRAPH FOOTER */}

                <div
                  className="
                    mt-4
                    pt-4
                    border-t
                    border-gray-100
                    flex
                    flex-wrap
                    items-center
                    justify-between
                    gap-3
                  "
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="
                        w-2
                        h-2
                        rounded-full
                        bg-[#008236]
                      "
                    />

                    <span className="text-[11px] text-gray-500">
                      Sales revenue
                    </span>
                  </div>

                  <span className="text-[11px] text-gray-400">
                    Updated for{" "}
                    {periodLabel.toLowerCase()}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* RECENT ORDERS + TOP PRODUCTS */}

          <section
            className="
              grid
              grid-cols-1
              xl:grid-cols-3
              gap-5
              sm:gap-6
              mt-5
              sm:mt-6
            "
          >
            {/* RECENT ORDERS */}

            <div
              className="
                xl:col-span-2
                bg-white
                rounded-2xl
                border
                border-gray-100
                shadow-sm
                overflow-hidden
              "
            >
              <div
                className="
                  p-5
                  sm:p-6
                  border-b
                  border-gray-100
                  flex
                  items-center
                  justify-between
                  gap-3
                "
              >
                <div>
                  <h2
                    className="
                      text-base
                      sm:text-lg
                      font-bold
                      text-gray-800
                    "
                  >
                    Recent Orders
                  </h2>

                  <p
                    className="
                      text-xs
                      sm:text-sm
                      text-gray-500
                      mt-1
                    "
                  >
                    Latest orders from your customers.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    handleNavigation(
                      "/seller/orders"
                    )
                  }
                  className="
                    text-xs
                    sm:text-sm
                    font-semibold
                    text-[#008236]
                    hover:underline
                    whitespace-nowrap
                  "
                >
                  View all
                </button>
              </div>

              <div className="hidden md:block overflow-x-auto">
                <table className="w-full min-w-[820px]">
                  <thead>
                    <tr className="border-b border-gray-100 text-left">
                      {[
                        "Order",
                        "Customer",
                        "Product",
                        "Date",
                        "Qty",
                        "Amount",
                        "Status",
                      ].map((heading) => (
                        <th
                          key={heading}
                          className="
                            px-4
                            py-3
                            text-[11px]
                            font-semibold
                            text-gray-400
                            uppercase
                          "
                        >
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {recentOrders.map(
                      (order) => (
                        <tr
                          key={order.id}
                          className="
                            border-b
                            border-gray-50
                            last:border-b-0
                            hover:bg-gray-50
                            transition
                          "
                        >
                          <td className="px-6 py-4">
                            <p className="text-sm font-semibold text-gray-800">
                              {order.id}
                            </p>
                          </td>

                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2.5">
                              <div
                                className="
                                  w-8
                                  h-8
                                  rounded-full
                                  bg-green-50
                                  text-[#008236]
                                  flex
                                  items-center
                                  justify-center
                                  text-xs
                                  font-bold
                                "
                              >
                                {order.customer
                                  .charAt(0)
                                  .toUpperCase()}
                              </div>

                              <span className="text-sm text-gray-600 whitespace-nowrap">
                                {order.customer}
                              </span>
                            </div>
                          </td>

                          <td className="px-4 py-4">
                            <p
                              className="
                                text-sm
                                text-gray-700
                                max-w-[180px]
                                truncate
                              "
                              title={order.product}
                            >
                              {order.product}
                            </p>
                          </td>

                          <td className="px-4 py-4">
                            <div className="flex items-center gap-1.5 whitespace-nowrap">
                              <FiCalendar
                                size={13}
                                className="text-gray-400"
                              />

                              <span className="text-xs text-gray-500">
                                {order.date}
                              </span>
                            </div>
                          </td>

                          <td className="px-4 py-4">
                            <span className="text-sm font-semibold text-gray-700">
                              {order.quantity}
                            </span>
                          </td>

                          <td className="px-4 py-4">
                            <p className="text-sm font-semibold text-gray-800 whitespace-nowrap">
                              {order.amount}
                            </p>
                          </td>

                          <td className="px-4 py-4">
                            <span
                              className={`
                                inline-flex
                                items-center
                                gap-1.5
                                px-2.5
                                py-1
                                rounded-full
                                text-[10px]
                                font-semibold
                                ${
                                  order.status ===
                                  "Delivered"
                                    ? "bg-green-50 text-green-700"
                                    : "bg-yellow-50 text-yellow-700"
                                }
                              `}
                            >
                              {order.status ===
                              "Delivered" ? (
                                <FiCheckCircle
                                  size={11}
                                />
                              ) : (
                                <FiClock
                                  size={11}
                                />
                              )}

                              {order.status}
                            </span>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>

              <div className="md:hidden">
                {recentOrders.map(
                  (order) => (
                    <div
                      key={order.id}
                      className="
                        p-4
                        border-b
                        border-gray-100
                        last:border-b-0
                      "
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-bold text-[#008236]">
                              {order.id}
                            </p>

                            <span
                              className={`
                                inline-flex
                                items-center
                                gap-1
                                px-2
                                py-1
                                rounded-full
                                text-[9px]
                                font-semibold
                                ${
                                  order.status ===
                                  "Delivered"
                                    ? "bg-green-50 text-green-700"
                                    : "bg-yellow-50 text-yellow-700"
                                }
                              `}
                            >
                              {order.status ===
                              "Delivered" ? (
                                <FiCheckCircle
                                  size={10}
                                />
                              ) : (
                                <FiClock
                                  size={10}
                                />
                              )}

                              {order.status}
                            </span>
                          </div>

                          <p className="text-sm font-semibold text-gray-800 mt-1.5">
                            {order.product}
                          </p>

                          <p className="text-xs text-gray-500 mt-1">
                            {order.customer}
                          </p>

                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            <span className="inline-flex items-center gap-1 text-[10px] text-gray-500">
                              <FiCalendar
                                size={11}
                              />
                              {order.date}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 mt-2">
                            <span className="text-xs text-gray-500">
                              Qty:{" "}
                              <strong className="text-gray-700">
                                {order.quantity}
                              </strong>
                            </span>

                            <span className="text-xs font-bold text-gray-800">
                              {order.amount}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* TOP PRODUCTS */}

            <div
              className="
                bg-white
                rounded-2xl
                border
                border-gray-100
                shadow-sm
                overflow-hidden
              "
            >
              <div
                className="
                  p-5
                  sm:p-6
                  border-b
                  border-gray-100
                  flex
                  items-center
                  justify-between
                "
              >
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-gray-800">
                    Top Products
                  </h2>

                  <p className="text-xs text-gray-500 mt-1">
                    Your best performers.
                  </p>
                </div>

                <FiTrendingUp
                  size={20}
                  className="text-[#008236]"
                />
              </div>

              <div className="p-5 sm:p-6 space-y-5">
                {topProducts.map(
                  (product, index) => (
                    <div key={product.name}>
                      <div className="flex items-center gap-3">
                        <div
                          className="
                            w-10
                            h-10
                            rounded-xl
                            bg-green-50
                            text-[#008236]
                            flex
                            items-center
                            justify-center
                            font-bold
                            flex-shrink-0
                          "
                        >
                          {index + 1}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800 truncate">
                            {product.name}
                          </p>

                          <p className="text-[10px] text-gray-400 mt-0.5">
                            {product.category} •{" "}
                            {product.sales}
                          </p>
                        </div>

                        <p className="text-xs font-bold text-gray-700 flex-shrink-0">
                          {product.amount}
                        </p>
                      </div>

                      <div
                        className="
                          h-1.5
                          bg-gray-100
                          rounded-full
                          overflow-hidden
                          mt-3
                          ml-[52px]
                        "
                      >
                        <div
                          className="
                            h-full
                            rounded-full
                            bg-[#008236]
                          "
                          style={{
                            width: `${product.percentage}%`,
                          }}
                        />
                      </div>
                    </div>
                  )
                )}

                <button
                  type="button"
                  onClick={() =>
                    handleNavigation(
                      "/seller/products"
                    )
                  }
                  className="
                    w-full
                    h-10
                    rounded-xl
                    border
                    border-gray-200
                    text-gray-600
                    text-sm
                    font-semibold
                    hover:border-green-200
                    hover:bg-green-50
                    hover:text-[#008236]
                    transition
                  "
                >
                  Manage Products
                </button>
              </div>
            </div>
          </section>

          {/* QUICK ACTIONS */}

          <section className="mt-5 sm:mt-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-gray-800">
                  Quick Actions
                </h2>

                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                  Manage your seller account quickly.
                </p>
              </div>
            </div>

            <div
              className="
                grid
                grid-cols-2
                sm:grid-cols-3
                lg:grid-cols-6
                gap-3
                sm:gap-4
              "
            >
              {[
                {
                  label: "Add Product",
                  path: "/seller/products",
                  icon: FiPlus,
                  bg: "bg-green-50",
                  color: "text-[#008236]",
                  hover:
                    "group-hover:bg-[#008236] group-hover:text-white",
                },
                {
                  label: "Add Service",
                  path: "/seller/services",
                  icon: FiBriefcase,
                  bg: "bg-blue-50",
                  color: "text-blue-600",
                  hover:
                    "group-hover:bg-blue-600 group-hover:text-white",
                },
                {
                  label: "View Orders",
                  path: "/seller/orders",
                  icon: FiShoppingBag,
                  bg: "bg-purple-50",
                  color: "text-purple-600",
                  hover:
                    "group-hover:bg-purple-600 group-hover:text-white",
                },
                {
                  label: "Messages",
                  path: "/seller/messages",
                  icon: FiMessageCircle,
                  bg: "bg-orange-50",
                  color: "text-orange-600",
                  hover:
                    "group-hover:bg-orange-600 group-hover:text-white",
                },
                {
                  label: "Promotions",
                  path: "/seller/promotions",
                  icon: FiTag,
                  bg: "bg-pink-50",
                  color: "text-pink-600",
                  hover:
                    "group-hover:bg-pink-600 group-hover:text-white",
                },
                {
                  label: "Analytics",
                  path: "/seller/analytics",
                  icon: FiBarChart2,
                  bg: "bg-indigo-50",
                  color: "text-indigo-600",
                  hover:
                    "group-hover:bg-indigo-600 group-hover:text-white",
                },
              ].map(
                ({
                  label,
                  path,
                  icon: Icon,
                  bg,
                  color,
                  hover,
                }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() =>
                      handleNavigation(path)
                    }
                    className="
                      bg-white
                      border
                      border-gray-100
                      rounded-2xl
                      p-4
                      text-left
                      shadow-sm
                      hover:border-green-200
                      hover:shadow-md
                      transition
                      group
                    "
                  >
                    <div
                      className={`
                        w-10
                        h-10
                        rounded-xl
                        ${bg}
                        ${color}
                        flex
                        items-center
                        justify-center
                        ${hover}
                        transition
                        relative
                      `}
                    >
                      <Icon size={18} />

                      {label === "Messages" &&
                        unreadMessages > 0 && (
                          <span
                            className="
                              absolute
                              -top-1
                              -right-1
                              min-w-[17px]
                              h-[17px]
                              rounded-full
                              bg-red-500
                              text-white
                              text-[8px]
                              font-bold
                              flex
                              items-center
                              justify-center
                            "
                          >
                            {unreadMessages}
                          </span>
                        )}
                    </div>

                    <p
                      className="
                        text-xs
                        sm:text-sm
                        font-semibold
                        text-gray-800
                        mt-3
                      "
                    >
                      {label}
                    </p>
                  </button>
                )
              )}
            </div>
          </section>

          {/* FOOTER NOTE */}

          <div
            className="
              mt-6
              rounded-2xl
              bg-green-50
              border
              border-green-100
              p-4
              sm:p-5
              flex
              flex-col
              sm:flex-row
              sm:items-center
              sm:justify-between
              gap-3
            "
          >
            <div className="flex items-center gap-3">
              <div
                className="
                  w-9
                  h-9
                  rounded-xl
                  bg-white
                  text-[#008236]
                  flex
                  items-center
                  justify-center
                  shadow-sm
                  flex-shrink-0
                "
              >
                <FiCheckCircle size={18} />
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-800">
                  Your store is active
                </p>

                <p className="text-xs text-gray-500 mt-0.5">
                  Keep your products updated to attract
                  more customers.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                handleNavigation(
                  "/seller/profile"
                )
              }
              className="
                h-9
                px-4
                rounded-lg
                bg-[#008236]
                text-white
                text-xs
                font-semibold
                hover:bg-[#006f2e]
                transition
                whitespace-nowrap
              "
            >
              Manage Store
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}

export default SellerDashboard;