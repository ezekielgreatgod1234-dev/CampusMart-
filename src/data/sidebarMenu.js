import {
  FiGrid,
  FiShoppingBag,

  FiHeart,
  FiShoppingCart,
  FiPackage,
  FiMessageCircle,
  FiUser,
  FiSettings,
  FiLogOut,
} from "react-icons/fi";

const sidebarMenu = [
  {
    name: "Dashboard",
    icon: FiGrid,
    path: "/",
  },
  {
  name: "Browse Products",
  icon: FiShoppingBag,
  path: "/browse-products",
},
  
  {
    name: "Wishlist",
    icon: FiHeart,
    path: "/wishlist",
  },
  {
    name: "Cart",
    icon: FiShoppingCart,
    path: "/cart",
  },
  {
    name: "Orders",
    icon: FiPackage,
    path: "/orders",
  },
  {
    name: "Messages",
    icon: FiMessageCircle,
    path: "/messages",
  },
  {
    name: "Profile",
    icon: FiUser,
    path: "/profile",
  },
  {
    name: "Settings",
    icon: FiSettings,
    path: "/settings",
  },
  {
    name: "Logout",
    icon: FiLogOut,
    path: "/logout",
  },
];

export default sidebarMenu;