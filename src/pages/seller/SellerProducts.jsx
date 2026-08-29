import { useEffect, useMemo, useState } from "react";

import {
  useNavigate,
  useLocation,
} from "react-router-dom";

import {
  FiGrid,
  FiPackage,
  FiShoppingBag,
  FiMessageCircle,
  FiDollarSign,
  FiTag,
  FiUser,
  FiSettings,
  FiLogOut,
  FiMenu,
  FiChevronDown,
  FiBell,
  FiPlus,
  FiSearch,
  FiFilter,
  FiEdit2,
  FiTrash2,
  FiMoreVertical,
  FiX,
  FiBox,
  FiCheckCircle,
  FiAlertCircle,
  FiClock,
  FiRefreshCw,
  FiImage,
  FiSave,
} from "react-icons/fi";

import { useAuth } from "../../context/AuthContext";

import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "../../context/firebase";

// =====================================================
// CAMPUSMART GREEN
// =====================================================

const CAMPUS_GREEN = "#008236";
const CAMPUS_GREEN_DARK = "#006f2e";
const CAMPUS_GREEN_DARKER = "#005f28";

// =====================================================
// CUSTOM DROPDOWN
// =====================================================

function GreenDropdown({
  value,
  options,
  onChange,
  className = "",
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleOutside = (event) => {
      if (!event.target.closest("[data-green-dropdown]")) {
        setOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleOutside
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutside
      );
    };
  }, []);

  return (
    <div
      data-green-dropdown
      className={`relative ${className}`}
    >
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={`
          w-full
          h-11
          px-3.5
          rounded-xl
          border
          border-gray-200
          bg-white
          text-sm
          text-gray-700
          flex
          items-center
          justify-between
          gap-3
          outline-none
          transition
          hover:border-green-300
          ${
            open
              ? "border-[#008236] ring-4 ring-green-50"
              : ""
          }
        `}
      >
        <span className="truncate">
          {value}
        </span>

        <FiChevronDown
          size={16}
          className={`
            flex-shrink-0
            text-[#008236]
            transition-transform
            ${open ? "rotate-180" : ""}
          `}
        />
      </button>

      {open && (
        <div
          className="
            absolute
            left-0
            right-0
            top-[calc(100%+6px)]
            z-[80]
            bg-white
            border
            border-green-100
            rounded-xl
            shadow-[0_15px_40px_rgba(0,130,54,0.15)]
            p-1.5
            overflow-hidden
          "
        >
          {options.map((option) => {
            const active = option === value;

            return (
              <button
                key={option}
                type="button"
                onClick={() => {
                  onChange(option);
                  setOpen(false);
                }}
                className={`
                  w-full
                  flex
                  items-center
                  justify-between
                  gap-2
                  px-3
                  py-2.5
                  rounded-lg
                  text-left
                  text-sm
                  transition
                  ${
                    active
                      ? "bg-green-50 text-[#008236] font-semibold"
                      : "text-gray-600 hover:bg-green-50 hover:text-[#008236]"
                  }
                `}
              >
                <span>{option}</span>

                {active && (
                  <FiCheckCircle
                    size={15}
                    className="text-[#008236]"
                  />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// =====================================================
// SELLER PRODUCTS
// =====================================================
function SellerProducts({ unreadMessages = 0, profile = {} }) {

  const navigate = useNavigate();
  const location = useLocation();

  const { firebaseUser } = useAuth();

  // =====================================================
  // SIDEBAR
  // =====================================================

  const [sidebarOpen, setSidebarOpen] =
    useState(false);

  // =====================================================
  // PRODUCT UI STATE
  // =====================================================

  const [searchTerm, setSearchTerm] =
    useState("");

  const [selectedCategory, setSelectedCategory] =
    useState("All Categories");

  const [selectedStatus, setSelectedStatus] =
    useState("All Status");

  const [viewMode, setViewMode] =
    useState("table");

  const [openMenu, setOpenMenu] =
    useState(null);

  const [deleteProduct, setDeleteProduct] =
    useState(null);

  const [showFilters, setShowFilters] =
    useState(false);

  // =====================================================
  // ADD / EDIT PRODUCT MODAL
  // =====================================================

  const [showProductModal, setShowProductModal] =
    useState(false);

  const [editingProduct, setEditingProduct] =
    useState(null);

  const [productForm, setProductForm] =
    useState({
      name: "",
      category: "Electronics",
      price: "",
      description: "",
      image: "",
      status: "Active",
    });

  const [formError, setFormError] =
    useState("");

  const [selectedImageFile, setSelectedImageFile] =
    useState(null);

  const [imagePreview, setImagePreview] =
    useState("");

  const [savingProduct, setSavingProduct] =
    useState(false);

  const [loadingProducts, setLoadingProducts] =
    useState(true);

  const [productError, setProductError] =
    useState("");

  // =====================================================
  // PRODUCTS FROM FIRESTORE
  // =====================================================

  const [products, setProducts] =
    useState([]);

  // Sold units from real orders (and product.sales field)
  const [soldByProductId, setSoldByProductId] = useState({});

  // =====================================================
  // LIVE SALES FROM ORDERS
  // =====================================================

  useEffect(() => {
    if (!firebaseUser?.uid) {
      setSoldByProductId({});
      return;
    }

    const ordersQuery = query(
      collection(db, "orders"),
      where("sellerId", "==", firebaseUser.uid)
    );

    const unsubscribe = onSnapshot(
      ordersQuery,
      (snapshot) => {
        const counts = {};

        snapshot.docs.forEach((orderDoc) => {
          const data = orderDoc.data();
          const status = String(data.status || "").toLowerCase();
          if (status === "cancelled") return;

          const items = Array.isArray(data.items) ? data.items : [];
          items.forEach((item) => {
            const pid = String(item.id || item.productId || "");
            if (!pid) return;
            const qty = Number(item.quantity) || 1;
            counts[pid] = (counts[pid] || 0) + qty;
          });
        });

        setSoldByProductId(counts);
      },
      (error) => {
        console.error("Error loading product sales from orders:", error);
      }
    );

    return () => unsubscribe();
  }, [firebaseUser?.uid]);

  // =====================================================
  // FIRESTORE PRODUCT LISTENER
  // =====================================================

  useEffect(() => {
    if (!firebaseUser?.uid) {
      setProducts([]);
      setLoadingProducts(false);
      return;
    }

    setLoadingProducts(true);
    setProductError("");

    const productsRef =
      collection(db, "products");

    const productsQuery = query(
      productsRef,
      where(
        "sellerId",
        "==",
        firebaseUser.uid
      )
    );

    const unsubscribe = onSnapshot(
      productsQuery,
      (snapshot) => {
        const loadedProducts =
          snapshot.docs.map((productDoc) => {
            const data = productDoc.data();

            return {
              id: productDoc.id,

              name: data.name || "",

              category:
                data.category ||
                "Other",

              price:
                Number(data.price) || 0,

              sales:
                Number(data.sales) || 0,

              status:
                data.status ||
                "Active",

              image:
                data.image || "",

              description:
                data.description ||
                "",

              sellerId:
                data.sellerId ||
                firebaseUser.uid,

              sellerName:
                data.sellerName ||
                firebaseUser.displayName ||
                "CampusMart Seller",

              createdAt:
                data.createdAt || null,

              updatedAt:
                data.updatedAt || null,
            };
          });

        loadedProducts.sort((a, b) => {
          const aTime =
            a.createdAt?.seconds ||
            0;

          const bTime =
            b.createdAt?.seconds ||
            0;

          return bTime - aTime;
        });

        setProducts(
          loadedProducts
        );

        setLoadingProducts(false);
      },
      (error) => {
        console.error(
          "Error loading seller products:",
          error
        );

        setProductError(
          "Unable to load your products. Please check your Firebase rules and try again."
        );

        setLoadingProducts(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [
    firebaseUser?.uid,
    firebaseUser?.displayName,
  ]);

  // =====================================================
  // SELLER PROFILE
  // =====================================================

  const sellerFullName =
  profile?.fullName ||
  profile?.name ||
  profile?.displayName ||
  firebaseUser?.displayName?.trim() ||
  "Seller";

const sellerFirstName =
  String(sellerFullName).trim().split(/\s+/)[0] || "Seller";

const sellerImage =
  profile?.profileImage ||
  profile?.photoURL ||
  profile?.profilePicture ||
  profile?.avatar ||
  profile?.imageUrl ||
  profile?.image ||
  firebaseUser?.photoURL ||
  null;

  // =====================================================
  // MENU ITEMS (Reviews & Analytics removed)
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
      return (
        location.pathname ===
        "/seller-dashboard"
      );
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
  // NOTIFICATIONS
  // =====================================================

  const handleNotifications = () => {
    console.log(
      "Open seller notifications"
    );
  };

  // =====================================================
  // RESET PRODUCT FORM
  // =====================================================

  const resetProductForm = () => {
    setProductForm({
      name: "",
      category: "Electronics",
      price: "",
      description: "",
      image: "",
      status: "Active",
    });

    setFormError("");
    setEditingProduct(null);
    setSavingProduct(false);
    setSelectedImageFile(null);
    setImagePreview("");
  };

  // =====================================================
  // OPEN ADD PRODUCT
  // =====================================================

  const handleAddProduct = () => {
    resetProductForm();
    setShowProductModal(true);
  };

  // =====================================================
  // OPEN EDIT PRODUCT
  // =====================================================

  const handleEditProduct = (product) => {
    setOpenMenu(null);

    setEditingProduct(product);

    setProductForm({
      name: product.name || "",

      category:
        product.category ||
        "Electronics",

      price:
        product.price || "",

      description:
        product.description || "",

      image:
        product.image || "",

      status:
        product.status || "Active",
    });

    setFormError("");
    setShowProductModal(true);
  };

  // =====================================================
  // FORM CHANGE
  // =====================================================

  const handleProductFormChange = (
    event
  ) => {
    const {
      name,
      value,
    } = event.target;

    setProductForm((current) => ({
      ...current,
      [name]: value,
    }));

    if (formError) {
      setFormError("");
    }
  };

  // =====================================================
  // SELECT PRODUCT IMAGE FROM GALLERY / DEVICE
  // =====================================================

  const handleProductImageChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setFormError("Please select a valid image file.");
      event.target.value = "";
      return;
    }

    const maxSize = 5 * 1024 * 1024;

    if (file.size > maxSize) {
      setFormError("Image must be 5MB or smaller.");
      event.target.value = "";
      return;
    }

    setSelectedImageFile(file);

    const previewUrl = URL.createObjectURL(file);
    setImagePreview((oldUrl) => {
      if (oldUrl) URL.revokeObjectURL(oldUrl);
      return previewUrl;
    });

    setFormError("");
  };

  // =====================================================
  // CLOUDINARY IMAGE UPLOAD
  // =====================================================

  const CLOUDINARY_CLOUD_NAME = "quj7ewsm";
  const CLOUDINARY_UPLOAD_PRESET = "campusmart_products";

  const uploadProductImage = async (file) => {
    if (!file) return "";

    if (
      !CLOUDINARY_CLOUD_NAME ||
      CLOUDINARY_CLOUD_NAME === "YOUR_CLOUD_NAME" ||
      !CLOUDINARY_UPLOAD_PRESET ||
      CLOUDINARY_UPLOAD_PRESET === "YOUR_UNSIGNED_UPLOAD_PRESET"
    ) {
      throw new Error(
        "Cloudinary is not configured. Add your Cloudinary Cloud Name and Unsigned Upload Preset in SellerProducts.jsx."
      );
    }

    const formData = new FormData();

    formData.append("file", file);
    formData.append(
      "upload_preset",
      CLOUDINARY_UPLOAD_PRESET
    );

    formData.append(
      "folder",
      `campusmart/products/${firebaseUser.uid}`
    );

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    let result = null;

    try {
      result = await response.json();
    } catch {
      throw new Error(
        "Cloudinary returned an invalid response."
      );
    }

    if (!response.ok || !result?.secure_url) {
      throw new Error(
        result?.error?.message ||
          "Unable to upload the product image to Cloudinary."
      );
    }

    return result.secure_url;
  };

  // =====================================================
  // SAVE PRODUCT TO FIRESTORE
  // =====================================================

  const handleSaveProduct = async (event) => {
    event.preventDefault();

    if (!firebaseUser?.uid) {
      setFormError(
        "You must be logged in as a seller before adding a product."
      );
      return;
    }

    const productName =
      productForm.name.trim();

    const price = Number(productForm.price);

    if (!productName) {
      setFormError(
        "Please enter a product name."
      );
      return;
    }

    if (
      !productForm.category ||
      productForm.category === "Select Category"
    ) {
      setFormError(
        "Please select a category."
      );
      return;
    }

    if (!productForm.price) {
      setFormError(
        "Please enter a product price."
      );
      return;
    }

    if (
      Number.isNaN(price) ||
      price <= 0
    ) {
      setFormError(
        "Please enter a valid price."
      );
      return;
    }

    setSavingProduct(true);
    setFormError("");

    try {
      if (editingProduct) {
        let imageUrl =
          productForm.image.trim();

        if (selectedImageFile) {
          imageUrl = await uploadProductImage(
            selectedImageFile
          );
        }

        const productRef = doc(
          db,
          "products",
          editingProduct.id
        );

        await updateDoc(productRef, {
          name: productName,
          category: productForm.category,
          price,
          description:
            productForm.description.trim(),
          image: imageUrl,
          status: productForm.status,
          updatedAt: serverTimestamp(),
        });

        setShowProductModal(false);
        resetProductForm();
        return;
      }

      const initialImageUrl =
        selectedImageFile
          ? ""
          : productForm.image.trim();

      const productRef = await addDoc(
        collection(db, "products"),
        {
          name: productName,
          category: productForm.category,
          price,
          description:
            productForm.description.trim(),
          image: initialImageUrl,
          status: productForm.status,
          sales: 0,

          sellerId:
            firebaseUser.uid,

          sellerName:
            firebaseUser.displayName ||
            "CampusMart Seller",

          sellerEmail:
            firebaseUser.email || "",

          createdAt:
            serverTimestamp(),

          updatedAt:
            serverTimestamp(),
        }
      );

      const imageFileToUpload =
        selectedImageFile;

      setShowProductModal(false);
      resetProductForm();

      if (imageFileToUpload) {
        try {
          const cloudinaryUrl =
            await uploadProductImage(
              imageFileToUpload
            );

          await updateDoc(
            doc(db, "products", productRef.id),
            {
              image: cloudinaryUrl,
              updatedAt:
                serverTimestamp(),
            }
          );
        } catch (imageError) {
          console.error(
            "Product was created, but image upload failed:",
            imageError
          );
        }
      }
    } catch (error) {
      console.error(
        "Error saving product:",
        error
      );

      setFormError(
        error?.message ||
          "Unable to save product. Please try again."
      );

      setSavingProduct(false);
    }
  };

  // =====================================================
  // DELETE PRODUCT FROM FIRESTORE
  // =====================================================

  const confirmDelete = async () => {
    if (!deleteProduct) return;

    if (!firebaseUser?.uid) {
      setDeleteProduct(null);
      return;
    }

    try {
      const productRef = doc(
        db,
        "products",
        deleteProduct.id
      );

      await deleteDoc(productRef);

      setDeleteProduct(null);
      setOpenMenu(null);
    } catch (error) {
      console.error(
        "Error deleting product:",
        error
      );

      alert(
        "Unable to delete this product. Please try again."
      );
    }
  };

  // =====================================================
  // CATEGORIES
  // =====================================================

  const categories = useMemo(() => {
    const uniqueCategories = [
      ...new Set(
        products.map(
          (product) =>
            product.category
        )
      ),
    ];

    return [
      "All Categories",
      ...uniqueCategories,
    ];
  }, [products]);

  // =====================================================
  // STATUS OPTIONS
  // =====================================================

  const statusOptions = [
    "All Status",
    "Active",
    "Out of Stock",
  ];

  // =====================================================
  // FILTER PRODUCTS
  // =====================================================

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const search =
        searchTerm
          .trim()
          .toLowerCase();

      const matchesSearch =
        !search ||
        product.name
          .toLowerCase()
          .includes(search) ||
        product.category
          .toLowerCase()
          .includes(search);

      const matchesCategory =
        selectedCategory ===
          "All Categories" ||
        product.category ===
          selectedCategory;

      const matchesStatus =
        selectedStatus ===
          "All Status" ||
        product.status ===
          selectedStatus;

      return (
        matchesSearch &&
        matchesCategory &&
        matchesStatus
      );
    });
  }, [
    products,
    searchTerm,
    selectedCategory,
    selectedStatus,
  ]);

  // =====================================================
  // STATISTICS
  // =====================================================

  const totalProducts =
    products.length;

  const activeProducts =
    products.filter(
      (product) =>
        product.status ===
        "Active"
    ).length;

  const outOfStockProducts =
    products.filter(
      (product) =>
        product.status ===
        "Out of Stock"
    ).length;

  const totalSales =
    products.reduce(
      (total, product) =>
        total + getSoldCount(product),
      0
    );

  // =====================================================
  // FORMAT NAIRA
  // =====================================================

  const formatNaira = (amount) =>
    `₦${Number(
      amount || 0
    ).toLocaleString("en-NG")}`;

  // Prefer order-derived sales, fall back to product.sales field
  const getSoldCount = (product) =>
    Number(soldByProductId[product?.id]) ||
    Number(product?.sales) ||
    0;

  // =====================================================
  // STATUS CLASSES
  // =====================================================

  const getStatusClasses = (
    status
  ) => {
    switch (status) {
      case "Active":
        return "bg-green-50 text-[#008236] border border-green-100";

      case "Out of Stock":
        return "bg-red-50 text-red-600 border border-red-100";

      default:
        return "bg-gray-50 text-gray-600 border border-gray-100";
    }
  };

  // =====================================================
  // STATUS ICON
  // =====================================================

  const getStatusIcon = (
    status
  ) => {
    switch (status) {
      case "Active":
        return (
          <FiCheckCircle size={11} />
        );

      case "Out of Stock":
        return (
          <FiClock size={11} />
        );

      default:
        return (
          <FiClock size={11} />
        );
    }
  };

  // =====================================================
  // CLOSE OPEN ACTION MENU
  // =====================================================

  useEffect(() => {
    const handleOutsideClick = () => {
      setOpenMenu(null);
    };

    if (openMenu !== null) {
      document.addEventListener(
        "click",
        handleOutsideClick
      );
    }

    return () => {
      document.removeEventListener(
        "click",
        handleOutsideClick
      );
    };
  }, [openMenu]);

  // =====================================================
  // CLEAN UP LOCAL IMAGE PREVIEW URL
  // =====================================================

  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="h-screen w-full bg-gray-50 text-gray-800 font-sans overflow-hidden">

      {/* MOBILE SIDEBAR OVERLAY */}

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() =>
            setSidebarOpen(false)
          }
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
          bg-[#008236]
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
            onClick={() =>
              setSidebarOpen(false)
            }
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
            <FiX
              size={21}
              strokeWidth={2.5}
            />
          </button>

          <div className="flex items-center gap-3 pr-10">

            <div
              className="
                w-10
                h-10
                min-w-[40px]
                rounded-xl
                bg-[#006f2e]
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
              const active =
                isActive(path);

              return (
                <button
                  key={label}
                  type="button"
                  onClick={() =>
                    handleNavigation(
                      path
                    )
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
                    strokeWidth={
                      active
                        ? 2.5
                        : 2
                    }
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
              Boost your products and services and reach more students.
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
            onClick={() =>
              setSidebarOpen(true)
            }
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
              onClick={
                handleNotifications
              }
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

        {/* PRODUCTS CONTENT */}

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

          {/* ================================================= */}
          {/* DARK GREEN BANNER (matches Earnings style) */}
          {/* ================================================= */}

          <div
            className="
              relative
              overflow-hidden
              rounded-2xl
              bg-gradient-to-r
              from-[#007233]
                to-[#008f3f]
               
              p-6
              sm:p-7
              text-white
              shadow-lg
              shadow-green-700/20
              mb-6
            "
          >
            {/* Decorative circles */}
            <div
              className="
                pointer-events-none
                absolute
                -right-8
                -top-10
                h-40
                w-40
                rounded-full
                bg-white/10
              "
            />
            <div
              className="
                pointer-events-none
                absolute
                -right-2
                top-16
                h-28
                w-28
                rounded-full
                bg-white/10
              "
            />
            <div
              className="
                pointer-events-none
                absolute
                right-24
                -bottom-12
                h-32
                w-32
                rounded-full
                bg-white/5
              "
            />

            {/* Pill label */}
            <div
              className="
                relative
                inline-flex
                items-center
                gap-1.5
                rounded-full
                bg-white/15
                px-3
                py-1
                text-xs
                font-medium
                text-green-50
                backdrop-blur-sm
              "
            >
              <span className="h-1.5 w-1.5 rounded-full bg-green-300" />
              Products
            </div>

            {/* Title — first name only */}
            <h1
              className="
                relative
                mt-3
                text-2xl
                sm:text-3xl
                font-bold
                tracking-tight
              "
            >
              Your Products, {sellerFirstName}
            </h1>

            {/* Subtitle */}
            <p
              className="
                relative
                mt-2
                max-w-xl
                text-sm
                sm:text-[15px]
                text-green-100
                leading-relaxed
              "
            >
              Manage your products, track sales, and keep your store up to date.
            </p>
          </div>

          {/* PAGE HEADER / ADD PRODUCT */}

          <section className="mb-6">

            <div
              className="
                flex
                flex-col
                lg:flex-row
                lg:items-center
                lg:justify-between
                gap-4
              "
            >
              <div>

                <div className="flex items-center gap-2">

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
                      border
                      border-green-100
                    "
                  >
                    <FiPackage
                      size={20}
                    />
                  </div>

                  <div>
                    <h2
                      className="
                        text-xl
                        sm:text-2xl
                        font-bold
                        text-gray-800
                        tracking-tight
                      "
                    >
                      Product Catalog
                    </h2>

                    <p className="text-xs sm:text-sm text-gray-500 mt-1">
                      Manage your products and sales.
                    </p>
                  </div>

                </div>

              </div>

              <button
                type="button"
                onClick={
                  handleAddProduct
                }
                className="
                  h-11
                  px-5
                  rounded-xl
                  bg-[#008236]
                  text-white
                  flex
                  items-center
                  justify-center
                  gap-2
                  text-sm
                  font-semibold
                  hover:bg-[#006f2e]
                  active:bg-[#005f28]
                  transition
                  shadow-sm
                  hover:shadow-md
                  whitespace-nowrap
                "
              >
                <FiPlus size={18} />
                Add Product
              </button>

            </div>

          </section>

          {/* FIRESTORE ERROR */}

          {productError && (
            <div
              className="
                mb-5
                rounded-xl
                bg-red-50
                border
                border-red-100
                px-4
                py-3
                text-sm
                text-red-600
                flex
                items-center
                gap-2
              "
            >
              <FiAlertCircle size={17} />

              <span>
                {productError}
              </span>
            </div>
          )}

          {/* STATISTICS */}

          <section
            className="
              grid
              grid-cols-2
              lg:grid-cols-4
              gap-3
              sm:gap-4
              mb-5
            "
          >

            <div
              className="
                bg-white
                rounded-2xl
                border
                border-green-100
                p-4
                sm:p-5
                shadow-[0_2px_10px_rgba(0,130,54,0.05)]
                hover:shadow-[0_8px_25px_rgba(0,130,54,0.08)]
                transition
              "
            >
              <div className="flex items-center justify-between">

                <div
                  className="
                    w-10
                    h-10
                    sm:w-11
                    sm:h-11
                    flex-shrink-0
                    rounded-xl
                    bg-green-50
                    text-[#008236]
                    flex
                    items-center
                    justify-center
                  "
                >
                  <FiPackage size={19} />
                </div>

                <span className="text-[10px] font-bold text-[#008236]">
                  Products
                </span>
              </div>

              <p className="text-xs text-gray-500 mt-4">
                Total Products
              </p>

              <h2 className="text-2xl font-bold text-gray-800 mt-1">
                {totalProducts}
              </h2>
            </div>

            <div
              className="
                bg-white
                rounded-2xl
                border
                border-green-100
                p-4
                sm:p-5
                shadow-[0_2px_10px_rgba(0,130,54,0.05)]
                hover:shadow-[0_8px_25px_rgba(0,130,54,0.08)]
                transition
              "
            >
              <div className="flex items-center justify-between">

                <div
                  className="
                    w-10
                    h-10
                    sm:w-11
                    sm:h-11
                    flex-shrink-0
                    rounded-xl
                    bg-green-50
                    text-[#008236]
                    flex
                    items-center
                    justify-center
                  "
                >
                  <FiCheckCircle size={19} />
                </div>

                <span className="text-[10px] font-bold text-[#008236]">
                  Active
                </span>
              </div>

              <p className="text-xs text-gray-500 mt-4">
                Active Products
              </p>

              <h2 className="text-2xl font-bold text-gray-800 mt-1">
                {activeProducts}
              </h2>
            </div>

            <div
              className="
                bg-white
                rounded-2xl
                border
                border-green-100
                p-4
                sm:p-5
                shadow-[0_2px_10px_rgba(0,130,54,0.05)]
                hover:shadow-[0_8px_25px_rgba(0,130,54,0.08)]
                transition
              "
            >
              <div className="flex items-center justify-between">

                <div
                  className="
                    w-10
                    h-10
                    sm:w-11
                    sm:h-11
                    flex-shrink-0
                    rounded-xl
                    bg-green-50
                    text-[#008236]
                    flex
                    items-center
                    justify-center
                  "
                >
                  <FiAlertCircle size={19} />
                </div>

                <span className="text-[10px] font-bold text-[#008236]">
                  Attention
                </span>
              </div>

              <p className="text-xs text-gray-500 mt-4">
                Out of Stock
              </p>

              <h2 className="text-2xl font-bold text-gray-800 mt-1">
                {outOfStockProducts}
              </h2>
            </div>

            <div
              className="
                bg-white
                rounded-2xl
                border
                border-green-100
                p-4
                sm:p-5
                shadow-[0_2px_10px_rgba(0,130,54,0.05)]
                hover:shadow-[0_8px_25px_rgba(0,130,54,0.08)]
                transition
              "
            >
              <div className="flex items-center justify-between">

                <div
                  className="
                    w-10
                    h-10
                    sm:w-11
                    sm:h-11
                    flex-shrink-0
                    rounded-xl
                    bg-green-50
                    text-[#008236]
                    flex
                    items-center
                    justify-center
                  "
                >
                  <FiShoppingBag size={19} />
                </div>

                <span className="text-[10px] font-bold text-[#008236]">
                  Sales
                </span>
              </div>

              <p className="text-xs text-gray-500 mt-4">
                Total Sales
              </p>

              <h2 className="text-2xl font-bold text-gray-800 mt-1">
                {totalSales}
              </h2>
            </div>

          </section>

          {/* PRODUCT MANAGEMENT */}

          <section
            className="
              bg-white
              rounded-2xl
              border
              border-green-100
              shadow-[0_2px_12px_rgba(0,130,54,0.05)]
              overflow-visible
            "
          >

            {/* TOOLBAR */}

            <div
              className="
                p-4
                sm:p-5
                border-b
                border-green-50
                flex
                flex-col
                lg:flex-row
                lg:items-center
                gap-3
                lg:gap-4
              "
            >
              <div className="relative flex-1">
                <FiSearch
                  className="
                    absolute
                    left-3.5
                    top-1/2
                    -translate-y-1/2
                    text-gray-400
                  "
                  size={17}
                />

                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) =>
                    setSearchTerm(
                      e.target.value
                    )
                  }
                  placeholder="Search products..."
                  className="
                    w-full
                    h-11
                    pl-10
                    pr-4
                    rounded-xl
                    border
                    border-gray-200
                    bg-gray-50
                    text-sm
                    outline-none
                    focus:border-[#008236]
                    focus:ring-4
                    focus:ring-green-50
                    transition
                  "
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <GreenDropdown
                  value={selectedCategory}
                  options={categories}
                  onChange={setSelectedCategory}
                  className="w-full sm:w-[180px]"
                />

                <GreenDropdown
                  value={selectedStatus}
                  options={statusOptions}
                  onChange={setSelectedStatus}
                  className="w-full sm:w-[150px]"
                />

                <button
                  type="button"
                  onClick={() =>
                    setViewMode(
                      viewMode === "table"
                        ? "grid"
                        : "table"
                    )
                  }
                  className="
                    h-11
                    px-4
                    rounded-xl
                    border
                    border-gray-200
                    bg-white
                    text-gray-600
                    text-sm
                    font-medium
                    hover:bg-green-50
                    hover:text-[#008236]
                    hover:border-green-200
                    transition
                    flex
                    items-center
                    gap-2
                  "
                >
                  <FiFilter size={16} />
                  {viewMode === "table"
                    ? "Grid"
                    : "Table"}
                </button>
              </div>
            </div>

            {/* LOADING / EMPTY / LIST */}

            {loadingProducts ? (
              <div className="py-20 text-center">
                <FiRefreshCw
                  size={28}
                  className="mx-auto text-[#008236] animate-spin"
                />
                <p className="text-sm text-gray-500 mt-3">
                  Loading products...
                </p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="py-16 px-6 text-center">
                <div
                  className="
                    w-16
                    h-16
                    mx-auto
                    rounded-2xl
                    bg-green-50
                    flex
                    items-center
                    justify-center
                    border
                    border-green-100
                  "
                >
                  <FiPackage
                    className="text-[#008236]"
                    size={28}
                  />
                </div>

                <h3 className="font-semibold text-gray-800 mt-4">
                  {searchTerm ||
                  selectedCategory !==
                    "All Categories" ||
                  selectedStatus !== "All Status"
                    ? "No products found"
                    : "No products yet"}
                </h3>

                <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
                  {searchTerm ||
                  selectedCategory !==
                    "All Categories" ||
                  selectedStatus !== "All Status"
                    ? "Try adjusting your search or filters."
                    : "Add your first product to start selling on CampusMart."}
                </p>

                {!searchTerm &&
                  selectedCategory ===
                    "All Categories" &&
                  selectedStatus ===
                    "All Status" && (
                    <button
                      type="button"
                      onClick={handleAddProduct}
                      className="
                        mt-5
                        h-11
                        px-5
                        rounded-xl
                        bg-[#008236]
                        text-white
                        text-sm
                        font-semibold
                        inline-flex
                        items-center
                        gap-2
                        hover:bg-[#006f2e]
                        transition
                      "
                    >
                      <FiPlus size={17} />
                      Add Product
                    </button>
                  )}
              </div>
            ) : (
              <>
                {/* TABLE VIEW */}

                <div
                  className={`
                    ${
                      viewMode === "table"
                        ? "hidden md:block"
                        : "hidden"
                    }
                    overflow-x-auto
                  `}
                >
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-green-50/50 border-b border-green-100">
                        <th className="px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Product
                        </th>
                        <th className="px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Category
                        </th>
                        <th className="px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Price
                        </th>
                        <th className="px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Sales
                        </th>
                        <th className="px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">
                          Actions
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredProducts.map(
                        (product) => (
                          <tr
                            key={product.id}
                            className="
                              border-b
                              border-gray-50
                              hover:bg-green-50/30
                              transition
                            "
                          >
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <div
                                  className="
                                    w-12
                                    h-12
                                    rounded-xl
                                    bg-green-50
                                    overflow-hidden
                                    flex-shrink-0
                                    border
                                    border-green-100
                                  "
                                >
                                  {product.image ? (
                                    <img
                                      src={product.image}
                                      alt={product.name}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-[#008236]">
                                      <FiPackage size={20} />
                                    </div>
                                  )}
                                </div>

                                <div className="min-w-0">
                                  <p
                                    className="
                                      text-sm
                                      font-semibold
                                      text-gray-800
                                      max-w-[220px]
                                      truncate
                                    "
                                    title={product.name}
                                  >
                                    {product.name}
                                  </p>
                                  <p className="text-[10px] text-gray-400 mt-1">
                                    ID: {product.id}
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td className="px-4 py-4">
                              <span
                                className="
                                  inline-flex
                                  px-2.5
                                  py-1
                                  rounded-lg
                                  bg-green-50
                                  text-[#008236]
                                  border
                                  border-green-100
                                  text-[10px]
                                  font-semibold
                                "
                              >
                                {product.category}
                              </span>
                            </td>

                            <td className="px-4 py-4">
                              <p className="text-sm font-bold text-gray-800 whitespace-nowrap">
                                {formatNaira(product.price)}
                              </p>
                            </td>

                            <td className="px-4 py-4">
                              <p className="text-sm font-semibold text-gray-700">
                                {getSoldCount(product)}
                              </p>
                              <p className="text-[10px] text-gray-400 mt-0.5">
                                sold
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
                                  ${getStatusClasses(product.status)}
                                `}
                              >
                                {getStatusIcon(product.status)}
                                {product.status}
                              </span>
                            </td>

                            <td className="px-5 py-4">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleEditProduct(product)
                                  }
                                  className="
                                    w-9
                                    h-9
                                    rounded-lg
                                    text-gray-400
                                    hover:bg-green-50
                                    hover:text-[#008236]
                                    flex
                                    items-center
                                    justify-center
                                    transition
                                  "
                                  title="Edit product"
                                >
                                  <FiEdit2 size={16} />
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    setDeleteProduct(product)
                                  }
                                  className="
                                    w-9
                                    h-9
                                    rounded-lg
                                    text-gray-400
                                    hover:bg-red-50
                                    hover:text-red-600
                                    flex
                                    items-center
                                    justify-center
                                    transition
                                  "
                                  title="Delete product"
                                >
                                  <FiTrash2 size={16} />
                                </button>

                                <div className="relative">
                                  <button
                                    type="button"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      setOpenMenu(
                                        openMenu === product.id
                                          ? null
                                          : product.id
                                      );
                                    }}
                                    className="
                                      w-9
                                      h-9
                                      rounded-lg
                                      text-gray-400
                                      hover:bg-green-50
                                      hover:text-[#008236]
                                      flex
                                      items-center
                                      justify-center
                                      transition
                                    "
                                  >
                                    <FiMoreVertical size={17} />
                                  </button>

                                  {openMenu === product.id && (
                                    <div
                                      onClick={(event) =>
                                        event.stopPropagation()
                                      }
                                      className="
                                        absolute
                                        right-0
                                        top-10
                                        z-30
                                        w-40
                                        bg-white
                                        border
                                        border-green-100
                                        rounded-xl
                                        shadow-[0_15px_40px_rgba(0,130,54,0.15)]
                                        p-1
                                      "
                                    >
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleEditProduct(product)
                                        }
                                        className="
                                          w-full
                                          flex
                                          items-center
                                          gap-2.5
                                          px-3
                                          py-2.5
                                          rounded-lg
                                          text-xs
                                          text-gray-600
                                          hover:bg-green-50
                                          hover:text-[#008236]
                                          text-left
                                        "
                                      >
                                        <FiEdit2 size={14} />
                                        Edit Product
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => {
                                          setDeleteProduct(product);
                                          setOpenMenu(null);
                                        }}
                                        className="
                                          w-full
                                          flex
                                          items-center
                                          gap-2.5
                                          px-3
                                          py-2.5
                                          rounded-lg
                                          text-xs
                                          text-red-500
                                          hover:bg-red-50
                                          text-left
                                        "
                                      >
                                        <FiTrash2 size={14} />
                                        Delete Product
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>

                {/* CARD VIEW / MOBILE */}

                <div
                  className={`
                    ${
                      viewMode === "table"
                        ? "md:hidden"
                        : "grid"
                    }
                    md:grid
                    md:grid-cols-2
                    xl:grid-cols-3
                    gap-4
                    p-4
                    sm:p-5
                  `}
                >
                  {filteredProducts.map((product) => (
                    <div
                      key={product.id}
                      className="
                        border
                        border-green-100
                        rounded-2xl
                        bg-white
                        overflow-hidden
                        hover:shadow-[0_10px_30px_rgba(0,130,54,0.09)]
                        transition
                      "
                    >
                      <div className="h-44 bg-green-50 relative overflow-hidden">
                        {product.image ? (
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[#008236]">
                            <FiPackage size={35} />
                          </div>
                        )}

                        <span
                          className={`
                            absolute
                            top-3
                            right-3
                            inline-flex
                            items-center
                            gap-1
                            px-2.5
                            py-1
                            rounded-full
                            text-[9px]
                            font-semibold
                            bg-white
                            shadow-sm
                            ${getStatusClasses(product.status)}
                          `}
                        >
                          {getStatusIcon(product.status)}
                          {product.status}
                        </span>
                      </div>

                      <div className="p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h3 className="text-sm font-bold text-gray-800 truncate">
                              {product.name}
                            </h3>
                            <p className="text-[10px] text-[#008236] font-semibold mt-1">
                              {product.category}
                            </p>
                          </div>

                          <div className="relative">
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                setOpenMenu(
                                  openMenu === product.id
                                    ? null
                                    : product.id
                                );
                              }}
                              className="
                                w-8
                                h-8
                                rounded-lg
                                text-gray-400
                                hover:bg-green-50
                                hover:text-[#008236]
                                flex
                                items-center
                                justify-center
                              "
                            >
                              <FiMoreVertical size={16} />
                            </button>

                            {openMenu === product.id && (
                              <div
                                onClick={(event) =>
                                  event.stopPropagation()
                                }
                                className="
                                  absolute
                                  right-0
                                  top-9
                                  z-30
                                  w-36
                                  bg-white
                                  border
                                  border-green-100
                                  rounded-xl
                                  shadow-xl
                                  p-1
                                "
                              >
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleEditProduct(product)
                                  }
                                  className="
                                    w-full
                                    flex
                                    items-center
                                    gap-2
                                    px-3
                                    py-2.5
                                    rounded-lg
                                    text-xs
                                    hover:bg-green-50
                                    hover:text-[#008236]
                                    text-left
                                  "
                                >
                                  <FiEdit2 size={14} />
                                  Edit
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setDeleteProduct(product);
                                    setOpenMenu(null);
                                  }}
                                  className="
                                    w-full
                                    flex
                                    items-center
                                    gap-2
                                    px-3
                                    py-2.5
                                    rounded-lg
                                    text-xs
                                    text-red-500
                                    hover:bg-red-50
                                    text-left
                                  "
                                >
                                  <FiTrash2 size={14} />
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        <p className="text-lg font-bold text-gray-800 mt-3">
                          {formatNaira(product.price)}
                        </p>

                        <div className="grid grid-cols-2 gap-2 mt-4">
                          <div className="bg-green-50 rounded-xl p-3 border border-green-100">
                            <p className="text-[9px] text-[#008236] uppercase font-semibold">
                              Sales
                            </p>
                            <p className="text-sm font-bold text-gray-700 mt-1">
                              {getSoldCount(product)}
                            </p>
                          </div>

                          <div className="bg-green-50 rounded-xl p-3 border border-green-100">
                            <p className="text-[9px] text-[#008236] uppercase font-semibold">
                              Product ID
                            </p>
                            <p className="text-[10px] font-semibold text-gray-600 mt-1 truncate">
                              {product.id}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 mt-3">
                          <button
                            type="button"
                            onClick={() =>
                              handleEditProduct(product)
                            }
                            className="
                              flex-1
                              h-10
                              rounded-xl
                              border
                              border-green-200
                              text-[#008236]
                              bg-green-50/50
                              text-xs
                              font-semibold
                              flex
                              items-center
                              justify-center
                              gap-2
                              hover:bg-green-50
                              transition
                            "
                          >
                            <FiEdit2 size={14} />
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setDeleteProduct(product)
                            }
                            className="
                              flex-1
                              h-10
                              rounded-xl
                              border
                              border-red-100
                              text-red-600
                              bg-red-50/40
                              text-xs
                              font-semibold
                              flex
                              items-center
                              justify-center
                              gap-2
                              hover:bg-red-50
                              transition
                            "
                          >
                            <FiTrash2 size={14} />
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

          </section>

          {/* FIREBASE STATUS */}

          <div
            className="
              mt-5
              rounded-2xl
              bg-green-50
              border
              border-green-100
              p-4
              sm:p-5
              flex
              items-start
              gap-3
            "
          >
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
                Products are connected to Firebase
              </p>

              <p className="text-xs text-gray-500 mt-1 leading-5">
                Products are saved in Firestore and
                identified by your authenticated seller
                account. Changes are synchronized in
                real time.
              </p>
            </div>
          </div>

        </main>

      </div>

      {/* ADD / EDIT PRODUCT MODAL */}

      {showProductModal && (
        <div
          className="
            fixed
            inset-0
            z-[100]
            bg-black/50
            backdrop-blur-[2px]
            flex
            items-center
            justify-center
            p-3
            sm:p-5
          "
          onClick={() => {
            if (!savingProduct) {
              setShowProductModal(false);
              resetProductForm();
            }
          }}
        >
          <div
            className="
              w-full
              max-w-2xl
              max-h-[92vh]
              overflow-y-auto
              bg-white
              rounded-2xl
              shadow-2xl
            "
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            {/* HEADER */}

            <div
              className="
                sticky
                top-0
                z-10
                bg-white
                border-b
                border-green-100
                px-5
                sm:px-6
                py-4
                flex
                items-center
                justify-between
              "
            >
              <div className="flex items-center gap-3">

                <div
                  className="
                    w-10
                    h-10
                    sm:w-11
                    sm:h-11
                    flex-shrink-0
                    rounded-xl
                    bg-green-50
                    text-[#008236]
                    flex
                    items-center
                    justify-center
                  "
                >
                  {editingProduct ? (
                    <FiEdit2 size={19} />
                  ) : (
                    <FiPlus size={20} />
                  )}
                </div>

                <div>
                  <h2 className="text-lg font-bold text-gray-800">
                    {editingProduct
                      ? "Edit Product"
                      : "Add Product"}
                  </h2>

                  <p className="text-xs text-gray-500 mt-0.5">
                    {editingProduct
                      ? "Update your product information."
                      : "Add a new product to your store."}
                  </p>
                </div>

              </div>

              <button
                type="button"
                disabled={savingProduct}
                onClick={() => {
                  setShowProductModal(false);
                  resetProductForm();
                }}
                className="
                  w-9
                  h-9
                  rounded-lg
                  text-gray-400
                  hover:bg-green-50
                  hover:text-[#008236]
                  flex
                  items-center
                  justify-center
                  transition
                  disabled:opacity-50
                "
              >
                <FiX size={19} />
              </button>

            </div>

            {/* FORM */}

            <form
              onSubmit={handleSaveProduct}
              className="p-5 sm:p-6"
            >

              {formError && (
                <div
                  className="
                    mb-5
                    rounded-xl
                    bg-red-50
                    border
                    border-red-100
                    px-4
                    py-3
                    text-sm
                    text-red-600
                    flex
                    items-center
                    gap-2
                  "
                >
                  <FiAlertCircle size={16} />
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                {/* NAME */}

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-2">
                    Product Name
                  </label>

                  <input
                    type="text"
                    name="name"
                    value={productForm.name}
                    onChange={handleProductFormChange}
                    disabled={savingProduct}
                    placeholder="e.g. HP EliteBook Laptop"
                    className="
                      w-full
                      h-11
                      px-3.5
                      rounded-xl
                      border
                      border-gray-200
                      bg-gray-50
                      text-sm
                      outline-none
                      focus:border-[#008236]
                      focus:ring-4
                      focus:ring-green-50
                      transition
                      disabled:opacity-60
                    "
                  />
                </div>

                {/* CATEGORY */}

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">
                    Category
                  </label>

                  <GreenDropdown
                    value={productForm.category}
                    options={[
                      "Electronics",
                      "Accessories",
                      "Fashion",
                      "Education",
                      "Home & Living",
                      "Food",
                      "Phone",
                      "Audio",
                      "Gifts",
                      "Drinks",
                      "Beauty",
                      "Sports",
                      "Books",
                      "Other",
                    ]}
                    onChange={(value) =>
                      setProductForm((current) => ({
                        ...current,
                        category: value,
                      }))
                    }
                    className="w-full"
                  />
                </div>

                {/* PRICE */}

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">
                    Price
                  </label>

                  <div className="relative">
                    <span
                      className="
                        absolute
                        left-3.5
                        top-1/2
                        -translate-y-1/2
                        text-[#008236]
                        font-semibold
                        text-sm
                      "
                    >
                      ₦
                    </span>

                    <input
                      type="number"
                      name="price"
                      value={productForm.price}
                      onChange={handleProductFormChange}
                      disabled={savingProduct}
                      min="0"
                      placeholder="0"
                      className="
                        w-full
                        h-11
                        pl-8
                        pr-3.5
                        rounded-xl
                        border
                        border-gray-200
                        bg-gray-50
                        text-sm
                        outline-none
                        focus:border-[#008236]
                        focus:ring-4
                        focus:ring-green-50
                        transition
                        disabled:opacity-60
                      "
                    />
                  </div>
                </div>

                {/* STATUS */}

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">
                    Status
                  </label>

                  <GreenDropdown
                    value={productForm.status}
                    options={[
                      "Active",
                      "Out of Stock",
                    ]}
                    onChange={(value) =>
                      setProductForm((current) => ({
                        ...current,
                        status: value,
                      }))
                    }
                    className="w-full"
                  />
                </div>

                {/* IMAGE */}

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-2">
                    Product Image
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="relative">
                      <FiImage
                        size={16}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#008236]"
                      />

                      <input
                        type="url"
                        name="image"
                        value={productForm.image}
                        onChange={(event) => {
                          handleProductFormChange(event);
                          setSelectedImageFile(null);
                          setImagePreview("");
                        }}
                        disabled={savingProduct}
                        placeholder="Paste image URL (https://...)"
                        className="
                          w-full h-11 pl-10 pr-3.5 rounded-xl border
                          border-gray-200 bg-gray-50 text-sm outline-none
                          focus:border-[#008236] focus:ring-4 focus:ring-green-50
                          transition disabled:opacity-60
                        "
                      />
                    </div>

                    <label
                      className={`
                        w-full h-11 px-3.5 rounded-xl border border-dashed
                        border-green-200 bg-green-50/50 text-[#008236] text-sm
                        font-semibold flex items-center justify-center gap-2
                        cursor-pointer hover:bg-green-50 hover:border-green-300
                        transition ${savingProduct ? "opacity-60 pointer-events-none" : ""}
                      `}
                    >
                      <FiImage size={17} />
                      <span>Choose from Gallery</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleProductImageChange}
                        disabled={savingProduct}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <p className="text-[10px] text-gray-400 mt-2">
                    You can paste an image URL or choose an image from your device.
                    Gallery images are uploaded securely. Max 5MB.
                  </p>

                  {selectedImageFile && (
                    <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-green-100 bg-green-50/40 px-3 py-2.5">
                      <div className="min-w-0 flex items-center gap-2">
                        <FiImage size={15} className="text-[#008236] flex-shrink-0" />
                        <p className="text-xs text-gray-600 truncate">
                          {selectedImageFile.name}
                        </p>
                      </div>

                      <button
                        type="button"
                        disabled={savingProduct}
                        onClick={() => {
                          setSelectedImageFile(null);
                          setImagePreview("");
                        }}
                        className="text-xs font-semibold text-red-500 hover:text-red-600 flex-shrink-0"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>

                {/* DESCRIPTION */}

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-2">
                    Description
                  </label>

                  <textarea
                    name="description"
                    value={productForm.description}
                    onChange={handleProductFormChange}
                    disabled={savingProduct}
                    rows={4}
                    placeholder="Describe your product..."
                    className="
                      w-full
                      px-3.5
                      py-3
                      rounded-xl
                      border
                      border-gray-200
                      bg-gray-50
                      text-sm
                      resize-none
                      outline-none
                      focus:border-[#008236]
                      focus:ring-4
                      focus:ring-green-50
                      transition
                      disabled:opacity-60
                    "
                  />
                </div>

              </div>

              {/* IMAGE PREVIEW */}

              {(imagePreview || productForm.image) && (
                <div className="mt-4">
                  <p className="text-xs font-semibold text-gray-700 mb-2">
                    Image Preview
                  </p>

                  <div
                    className="
                      w-full
                      h-40
                      rounded-xl
                      bg-green-50
                      overflow-hidden
                      border
                      border-green-100
                    "
                  >
                    <img
                      src={imagePreview || productForm.image}
                      alt="Product preview"
                      className="w-full h-full object-cover"
                      onError={(event) => {
                        event.currentTarget.style.display = "none";
                      }}
                    />
                  </div>
                </div>
              )}

              {/* BUTTONS */}

              <div
                className="
                  flex
                  flex-row
                  items-center
                  justify-end
                  gap-3
                  mt-6
                  pt-5
                  border-t
                  border-green-50
                "
              >
                <button
                  type="button"
                  disabled={savingProduct}
                  onClick={() => {
                    setShowProductModal(false);
                    resetProductForm();
                  }}
                  className="
                    h-11
                    px-5
                    min-w-[105px]
                    rounded-xl
                    border
                    border-gray-200
                    bg-white
                    text-gray-600
                    text-sm
                    font-semibold
                    hover:bg-gray-50
                    transition
                    active:scale-[0.98]
                    disabled:opacity-50
                    flex
                    items-center
                    justify-center
                  "
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={savingProduct}
                  className="
                    h-11
                    px-5
                    min-w-[125px]
                    rounded-xl
                    bg-[#008236]
                    text-white
                    text-sm
                    font-semibold
                    flex
                    items-center
                    justify-center
                    gap-2
                    hover:bg-[#006f2e]
                    active:bg-[#005f28]
                    active:scale-[0.98]
                    transition
                    shadow-sm
                    disabled:opacity-60
                    disabled:cursor-not-allowed
                  "
                >
                  {savingProduct ? (
                    <>
                      <FiRefreshCw
                        size={17}
                        className="animate-spin"
                      />
                      Saving...
                    </>
                  ) : (
                    <>
                      <FiSave size={17} />
                      {editingProduct
                        ? "Save Changes"
                        : "Add Product"}
                    </>
                  )}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* DELETE MODAL */}

      {deleteProduct && (
        <div
          className="
            fixed
            inset-0
            z-[100]
            bg-black/50
            flex
            items-center
            justify-center
            p-4
          "
          onClick={() =>
            setDeleteProduct(null)
          }
        >
          <div
            className="
              w-full
              max-w-md
              bg-white
              rounded-2xl
              shadow-2xl
              p-5
              sm:p-6
              border
              border-green-100
            "
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <div className="flex items-start gap-4">

              <div
                className="
                  w-11
                  h-11
                  rounded-xl
                  bg-green-50
                  text-[#008236]
                  flex
                  items-center
                  justify-center
                  flex-shrink-0
                  border
                  border-green-100
                "
              >
                <FiTrash2 size={20} />
              </div>

              <div className="min-w-0">

                <h3 className="text-lg font-bold text-gray-800">
                  Delete product?
                </h3>

                <p className="text-sm text-gray-500 mt-1 leading-5">
                  Are you sure you want to delete{" "}
                  <span className="font-semibold text-[#008236]">
                    {deleteProduct.name}
                  </span>
                  ? This action cannot be undone.
                </p>

              </div>

            </div>

            <div className="flex gap-3 mt-6">

              <button
                type="button"
                onClick={() =>
                  setDeleteProduct(null)
                }
                className="
                  flex-1
                  h-11
                  rounded-xl
                  border
                  border-green-200
                  bg-white
                  text-[#008236]
                  text-sm
                  font-semibold
                  hover:bg-green-50
                  hover:border-green-300
                  active:bg-green-100
                  transition
                "
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={confirmDelete}
                className="
                  flex-1
                  h-11
                  rounded-xl
                  bg-[#008236]
                  text-white
                  text-sm
                  font-semibold
                  hover:bg-[#006f2e]
                  active:bg-[#005f28]
                  transition
                  shadow-sm
                "
              >
                Delete Product
              </button>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export default SellerProducts;
