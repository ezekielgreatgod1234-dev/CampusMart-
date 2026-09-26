import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

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
  FiPlus,
  FiSearch,
  FiEdit2,
  FiTrash2,
  FiMoreVertical,
  FiX,
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

const PRODUCT_CATEGORIES = [
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
];

const SERVICE_CATEGORIES = [
  "Online Services",
  "Barbing",
  "Photography",
  "Tutoring",
  "Graphics Design",
  "Programming",
  "Repairs",
  "Cleaning",
  "Delivery",
  "Beauty & Makeup",
  "Tailoring",
  "Writing",
  "Music",
  "Other",
];

function GreenDropdown({ value, options, onChange, className = "" }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleOutside = (event) => {
      if (!event.target.closest("[data-green-dropdown]")) setOpen(false);
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  return (
    <div data-green-dropdown className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((c) => !c)}
        className={`w-full h-11 px-3.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 flex items-center justify-between gap-3 outline-none transition hover:border-green-300 ${
          open ? "border-[#008236] ring-4 ring-green-50" : ""
        }`}
      >
        <span className="truncate">{value}</span>
        <FiChevronDown
          size={16}
          className={`flex-shrink-0 text-[#008236] transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      {open && (
        <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-[80] bg-white border border-green-100 rounded-xl shadow-[0_15px_40px_rgba(0,130,54,0.15)] p-1.5 max-h-56 overflow-y-auto">
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
                className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-left text-sm transition ${
                  active
                    ? "bg-green-50 text-[#008236] font-semibold"
                    : "text-gray-600 hover:bg-green-50 hover:text-[#008236]"
                }`}
              >
                <span>{option}</span>
                {active && (
                  <FiCheckCircle size={15} className="text-[#008236]" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SellerProducts({ unreadMessages = 0, profile = {} }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { firebaseUser } = useAuth();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [selectedStatus, setSelectedStatus] = useState("All Status");
  const [openMenu, setOpenMenu] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);

  const [showProductModal, setShowProductModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [listingType, setListingType] = useState("product");

  const [productForm, setProductForm] = useState({
    name: "",
    category: "Electronics",
    price: "",
    description: "",
    image: "",
    status: "Active",
  });
  const [formError, setFormError] = useState("");
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [savingProduct, setSavingProduct] = useState(false);

  const [products, setProducts] = useState([]);
  const [services, setServices] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingServices, setLoadingServices] = useState(true);
  const [productError, setProductError] = useState("");

  const [soldByProductId, setSoldByProductId] = useState({});
  const [newOrdersCount, setNewOrdersCount] = useState(0);

  // mine | services | others | otherServices
  const [productTab, setProductTab] = useState("mine");
  const [otherProducts, setOtherProducts] = useState([]);
  const [otherServices, setOtherServices] = useState([]);
  const [otherLoading, setOtherLoading] = useState(false);

  const CLOUDINARY_CLOUD_NAME = "quj7ewsm";
  const CLOUDINARY_UPLOAD_PRESET = "campusmart_products";

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

  useEffect(() => {
    if (!firebaseUser?.uid) {
      setSoldByProductId({});
      setNewOrdersCount(0);
      return;
    }
    const unsub = onSnapshot(
      query(collection(db, "orders"), where("sellerId", "==", firebaseUser.uid)),
      (snapshot) => {
        const counts = {};
        let pending = 0;
        snapshot.docs.forEach((orderDoc) => {
          const data = orderDoc.data();
          const status = String(data.status || "pending").toLowerCase();
          if (status === "cancelled" || status === "canceled") return;
          if (["pending", "placed", "processing"].includes(status)) pending += 1;
          (Array.isArray(data.items) ? data.items : []).forEach((item) => {
            const pid = String(item.id || item.productId || "");
            if (!pid) return;
            counts[pid] = (counts[pid] || 0) + (Number(item.quantity) || 1);
          });
        });
        setSoldByProductId(counts);
        setNewOrdersCount(pending);
      }
    );
    return () => unsub();
  }, [firebaseUser?.uid]);

  useEffect(() => {
    if (!firebaseUser?.uid) {
      setProducts([]);
      setLoadingProducts(false);
      return;
    }
    setLoadingProducts(true);
    const unsub = onSnapshot(
      query(collection(db, "products"), where("sellerId", "==", firebaseUser.uid)),
      (snapshot) => {
        const list = snapshot.docs.map((productDoc) => {
          const data = productDoc.data() || {};
          return {
            id: productDoc.id,
            kind: "product",
            name: data.name || "",
            category: data.category || "Other",
            price: Number(data.price) || 0,
            sales: Number(data.sales) || 0,
            status: data.status || "Active",
            image: data.image || "",
            description: data.description || "",
            sellerId: data.sellerId || firebaseUser.uid,
            sellerName: data.sellerName || firebaseUser.displayName || "Seller",
            isVerifiedSeller: data.isVerifiedSeller === true,
            createdAt: data.createdAt || null,
            updatedAt: data.updatedAt || null,
          };
        });
        list.sort(
          (a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)
        );
        setProducts(list);
        setLoadingProducts(false);
        setProductError("");
      },
      (error) => {
        console.error(error);
        setProductError("Unable to load your products.");
        setLoadingProducts(false);
      }
    );
    return () => unsub();
  }, [firebaseUser?.uid, firebaseUser?.displayName]);

  useEffect(() => {
    if (!firebaseUser?.uid) {
      setServices([]);
      setLoadingServices(false);
      return;
    }
    setLoadingServices(true);
    const unsub = onSnapshot(
      query(collection(db, "services"), where("sellerId", "==", firebaseUser.uid)),
      (snapshot) => {
        const list = snapshot.docs.map((d) => {
          const data = d.data() || {};
          return {
            id: d.id,
            kind: "service",
            name: data.name || "",
            category: data.category || "Other",
            price: Number(data.price) || 0,
            status: data.status || "Active",
            image: data.image || "",
            description: data.description || "",
            sellerId: data.sellerId || firebaseUser.uid,
            sellerName: data.sellerName || sellerFullName,
            isVerifiedSeller: data.isVerifiedSeller === true,
            createdAt: data.createdAt || null,
          };
        });
        list.sort(
          (a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)
        );
        setServices(list);
        setLoadingServices(false);
      },
      () => setLoadingServices(false)
    );
    return () => unsub();
  }, [firebaseUser?.uid, sellerFullName]);

  useEffect(() => {
    if (!firebaseUser?.uid || productTab !== "others") return undefined;
    setOtherLoading(true);
    const unsub = onSnapshot(collection(db, "products"), (snapshot) => {
      const list = snapshot.docs
        .map((d) => {
          const data = d.data() || {};
          return {
            id: d.id,
            kind: "product",
            name: data.name || "",
            category: data.category || "Other",
            price: Number(data.price) || 0,
            status: data.status || "Active",
            image: data.image || "",
            description: data.description || "",
            sellerId: data.sellerId || "",
            sellerName: data.sellerName || "Seller",
            isVerifiedSeller: data.isVerifiedSeller === true,
            isPromoted: data.isPromoted === true,
            createdAt: data.createdAt || null,
          };
        })
        .filter(
          (p) =>
            p.sellerId &&
            p.sellerId !== firebaseUser.uid &&
            String(p.status || "Active").toLowerCase() !== "deleted"
        )
        .sort((a, b) => {
          if (a.isPromoted && !b.isPromoted) return -1;
          if (!a.isPromoted && b.isPromoted) return 1;
          return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
        });
      setOtherProducts(list);
      setOtherLoading(false);
    });
    return () => unsub();
  }, [firebaseUser?.uid, productTab]);

  useEffect(() => {
    if (!firebaseUser?.uid || productTab !== "otherServices") return undefined;
    setOtherLoading(true);
    const unsub = onSnapshot(collection(db, "services"), (snapshot) => {
      const list = snapshot.docs
        .map((d) => {
          const data = d.data() || {};
          return {
            id: d.id,
            kind: "service",
            name: data.name || "",
            category: data.category || "Other",
            price: Number(data.price) || 0,
            status: data.status || "Active",
            image: data.image || "",
            description: data.description || "",
            sellerId: data.sellerId || "",
            sellerName: data.sellerName || "Provider",
            isVerifiedSeller: data.isVerifiedSeller === true,
            createdAt: data.createdAt || null,
          };
        })
        .filter(
          (p) =>
            p.sellerId &&
            p.sellerId !== firebaseUser.uid &&
            String(p.status || "Active").toLowerCase() !== "deleted"
        )
        .sort(
          (a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)
        );
      setOtherServices(list);
      setOtherLoading(false);
    });
    return () => unsub();
  }, [firebaseUser?.uid, productTab]);

  const menuItems = useMemo(
    () => [
      { label: "Dashboard", icon: FiGrid, path: "/seller-dashboard" },
      { label: "Products", icon: FiPackage, path: "/seller/products" },
      {
        label: "Orders",
        icon: FiShoppingBag,
        path: "/seller/orders",
        badge: newOrdersCount,
      },
      {
        label: "Messages",
        icon: FiMessageCircle,
        path: "/seller/messages",
        badge: unreadMessages,
      },
      { label: "Earnings", icon: FiDollarSign, path: "/seller/earnings" },
      {
        label: "Promotions",
        icon: FiTag,
        path: "/seller/promotions",
        new: true,
      },
      { label: "Profile", icon: FiUser, path: "/seller/profile" },
      { label: "Settings", icon: FiSettings, path: "/seller/settings" },
    ],
    [newOrdersCount, unreadMessages]
  );

  const isActive = (path) =>
    path === "/seller-dashboard"
      ? location.pathname === path
      : location.pathname.startsWith(path);

  const handleNavigation = (path) => {
    setSidebarOpen(false);
    navigate(path);
  };

  const resetProductForm = (type = listingType) => {
    setProductForm({
      name: "",
      category:
        type === "service" ? SERVICE_CATEGORIES[0] : PRODUCT_CATEGORIES[0],
      price: "",
      description: "",
      image: "",
      status: "Active",
    });
    setFormError("");
    setEditingItem(null);
    setSavingProduct(false);
    setSelectedImageFile(null);
    setImagePreview("");
  };

  const handleAddProduct = () => {
    setListingType("product");
    resetProductForm("product");
    setShowProductModal(true);
  };

  const handleAddService = () => {
    setListingType("service");
    resetProductForm("service");
    setShowProductModal(true);
  };

  const handleEditItem = (item) => {
    setOpenMenu(null);
    setEditingItem(item);
    setListingType(item.kind === "service" ? "service" : "product");
    setProductForm({
      name: item.name || "",
      category: item.category || "Other",
      price: item.price || "",
      description: item.description || "",
      image: item.image || "",
      status: item.status || "Active",
    });
    setFormError("");
    setShowProductModal(true);
  };

  const handleProductFormChange = (event) => {
    const { name, value } = event.target;
    setProductForm((current) => ({ ...current, [name]: value }));
    if (formError) setFormError("");
  };

  const handleProductImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setFormError("Please select a valid image file.");
      event.target.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
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

  const uploadProductImage = async (file) => {
    if (!file) return "";
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
    formData.append(
      "folder",
      `campusmart/${listingType === "service" ? "services" : "products"}/${firebaseUser.uid}`
    );
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      { method: "POST", body: formData }
    );
    const result = await response.json();
    if (!response.ok || !result?.secure_url) {
      throw new Error(
        result?.error?.message || "Unable to upload image to Cloudinary."
      );
    }
    return result.secure_url;
  };

  const handleSaveProduct = async (event) => {
    event.preventDefault();
    if (!firebaseUser?.uid) {
      setFormError("You must be logged in before adding a listing.");
      return;
    }

    const productName = productForm.name.trim();
    const price = Number(productForm.price);

    if (!productName) {
      setFormError(
        listingType === "service"
          ? "Please enter a service name."
          : "Please enter a product name."
      );
      return;
    }
    if (!productForm.category) {
      setFormError("Please select a category.");
      return;
    }
    if (!productForm.price || Number.isNaN(price) || price < 0) {
      setFormError("Please enter a valid price.");
      return;
    }

    setSavingProduct(true);
    setFormError("");

    const sellerName =
      profile?.fullName ||
      profile?.displayName ||
      profile?.name ||
      firebaseUser.displayName ||
      "CampusMart Seller";
    const isVerifiedSeller = profile?.isVerifiedSeller === true;
    const collectionName =
      listingType === "service" ? "services" : "products";

    try {
      let imageUrl = productForm.image.trim();
      if (selectedImageFile) {
        imageUrl = await uploadProductImage(selectedImageFile);
      }

      const base = {
        name: productName,
        category: productForm.category,
        price,
        description: productForm.description.trim(),
        image: imageUrl,
        status: productForm.status,
        sellerId: firebaseUser.uid,
        sellerName,
        sellerEmail: firebaseUser.email || "",
        isVerifiedSeller,
        type: listingType,
        updatedAt: serverTimestamp(),
      };

      if (editingItem) {
        await updateDoc(doc(db, collectionName, editingItem.id), base);
        setShowProductModal(false);
        resetProductForm();
        return;
      }

      const docData = {
        ...base,
        views: 0,
        createdAt: serverTimestamp(),
      };
      if (listingType === "product") {
        docData.sales = 0;
      }

      await addDoc(collection(db, collectionName), docData);

      setShowProductModal(false);
      resetProductForm();
      setProductTab(listingType === "service" ? "services" : "mine");
    } catch (error) {
      console.error(error);
      setFormError(error?.message || "Unable to save. Please try again.");
      setSavingProduct(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteItem || !firebaseUser?.uid) {
      setDeleteItem(null);
      return;
    }
    try {
      const col = deleteItem.kind === "service" ? "services" : "products";
      await deleteDoc(doc(db, col, deleteItem.id));
      setDeleteItem(null);
      setOpenMenu(null);
    } catch (error) {
      console.error(error);
      alert("Unable to delete this listing. Please try again.");
    }
  };

  const isOwnTab = productTab === "mine" || productTab === "services";
  const isServiceTab =
    productTab === "services" || productTab === "otherServices";

  const sourceList =
    productTab === "services"
      ? services
      : productTab === "others"
        ? otherProducts
        : productTab === "otherServices"
          ? otherServices
          : products;

  const categoryOptions = useMemo(() => {
    if (isServiceTab) {
      return ["All Categories", ...SERVICE_CATEGORIES];
    }
    const unique = [
      ...new Set(sourceList.map((p) => p.category).filter(Boolean)),
    ];
    return ["All Categories", ...unique];
  }, [isServiceTab, sourceList]);

  const filteredProducts = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    return sourceList.filter((product) => {
      const matchesSearch =
        !search ||
        product.name.toLowerCase().includes(search) ||
        product.category.toLowerCase().includes(search);
      const matchesCategory =
        selectedCategory === "All Categories" ||
        product.category === selectedCategory;
      const matchesStatus =
        selectedStatus === "All Status" || product.status === selectedStatus;
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [sourceList, searchTerm, selectedCategory, selectedStatus]);

  const getSoldCount = (product) =>
    Number(soldByProductId[product?.id]) || Number(product?.sales) || 0;

  const formatNaira = (amount) =>
    `₦${Number(amount || 0).toLocaleString("en-NG")}`;

  const getStatusClasses = (status) => {
    switch (status) {
      case "Active":
        return "bg-green-50 text-[#008236] border border-green-100";
      case "Out of Stock":
        return "bg-red-50 text-red-600 border border-red-100";
      default:
        return "bg-gray-50 text-gray-600 border border-gray-100";
    }
  };

  const loading =
    productTab === "services"
      ? loadingServices
      : productTab === "mine"
        ? loadingProducts
        : otherLoading;

  useEffect(() => {
    const handleOutsideClick = () => setOpenMenu(null);
    if (openMenu !== null) document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, [openMenu]);

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  return (
    <div className="h-screen w-full bg-gray-50 text-gray-800 font-sans overflow-hidden">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[291px] bg-green-700 text-white flex flex-col h-screen transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="relative px-5 pt-6 pb-4">
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden absolute top-3 right-3 w-9 h-9 rounded-lg hover:bg-white/10 flex items-center justify-center"
          >
            <FiX size={21} />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#006f2e] flex items-center justify-center border border-white/10">
              <span className="text-white text-[16px] font-black">CM</span>
            </div>
            <div>
              <h1 className="text-[22px] font-extrabold leading-none">
                Campus<span className="text-green-300">Mart 2.0</span>
              </h1>
              <p className="text-[10px] text-green-100 mt-1">Sell. Connect. Grow.</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 py-3 overflow-y-auto flex flex-col gap-1">
          {menuItems.map(({ label, icon: Icon, path, badge, new: isNew }) => {
            const active = isActive(path);
            return (
              <button
                key={label}
                type="button"
                onClick={() => handleNavigation(path)}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-left ${
                  active
                    ? "bg-white text-[#008236] font-semibold"
                    : "text-white hover:bg-white/10"
                }`}
              >
                <Icon size={18} />
                <span className="flex-1 text-[14px]">{label}</span>
                {badge > 0 && (
                  <span className="min-w-[20px] h-[20px] px-1 rounded-full bg-red-500 text-[10px] font-bold flex items-center justify-center">
                    {badge > 99 ? "99+" : badge}
                  </span>
                )}
                {isNew && (
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
                      active ? "bg-green-100 text-green-700" : "bg-green-500"
                    }`}
                  >
                    New
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="px-4 pb-5">
          <button
            type="button"
            onClick={() => navigate("/logout")}
            className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl hover:bg-white/10"
          >
            <FiLogOut size={18} />
            <span className="text-[14px]">Logout</span>
          </button>
        </div>
      </aside>

      <div className="min-w-0 flex flex-col h-screen lg:ml-[291px]">
        <header className="min-h-[70px] bg-[#007233] text-white flex items-center px-4 gap-3 flex-shrink-0">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden w-10 h-10 rounded-lg hover:bg-white/10 flex items-center justify-center"
          >
            <FiMenu size={22} />
          </button>
          <div className="flex items-center gap-2">
            <FiPackage size={18} className="text-green-200" />
            <span className="text-sm font-semibold">Products & Services</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleNavigation("/seller/messages")}
              className="relative w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center"
            >
              <FiMessageCircle size={20} />
              {unreadMessages > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[17px] h-[17px] rounded-full bg-red-500 text-[9px] font-bold flex items-center justify-center">
                  {unreadMessages}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => handleNavigation("/seller/profile")}
              className="flex items-center gap-2 hover:bg-white/10 rounded-lg px-1.5 py-1.5"
            >
              {sellerImage ? (
                <img
                  src={sellerImage}
                  alt=""
                  className="w-9 h-9 rounded-full object-cover border-2 border-white/30"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center font-bold text-sm">
                  {sellerFirstName.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="hidden sm:block text-left">
                <p className="text-xs font-bold truncate max-w-[160px]">
                  {sellerFullName}
                </p>
                <p className="text-[10px] text-green-100">Seller</p>
              </div>
              <FiChevronDown size={16} className="hidden sm:block" />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Your listings</h1>
              <p className="text-sm text-gray-500 mt-1">
                Sell products or offer campus services.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleAddProduct}
                className="h-11 px-4 rounded-xl bg-[#008236] text-white text-sm font-semibold flex items-center gap-2 hover:bg-[#006f2e]"
              >
                <FiPlus size={16} />
                Add product
              </button>
              <button
                type="button"
                onClick={handleAddService}
                className="h-11 px-4 rounded-xl border border-green-200 bg-green-50 text-[#008236] text-sm font-semibold flex items-center gap-2 hover:bg-green-100"
              >
                <FiTag size={16} />
                Add service
              </button>
            </div>
          </div>

          {/* Tabs: My products | My services | Other products | Other services */}
          <div className="flex flex-wrap gap-2 p-1 bg-white rounded-2xl border border-gray-100 w-fit mb-5">
            {[
              { id: "mine", label: `My products (${products.length})` },
              { id: "services", label: `My services (${services.length})` },
              { id: "others", label: "Other products" },
              { id: "otherServices", label: "Other services" },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setProductTab(t.id);
                  setSelectedCategory("All Categories");
                  setSearchTerm("");
                }}
                className={`h-10 px-4 rounded-xl text-sm font-semibold ${
                  productTab === t.id
                    ? "bg-[#008236] text-white"
                    : "text-gray-600 hover:bg-green-50"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-5 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={
                  isServiceTab ? "Search services..." : "Search products..."
                }
                className="w-full h-11 pl-10 pr-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#008236]"
              />
            </div>
            <GreenDropdown
              value={selectedCategory}
              options={categoryOptions}
              onChange={setSelectedCategory}
              className="sm:w-48"
            />
            <GreenDropdown
              value={selectedStatus}
              options={["All Status", "Active", "Out of Stock"]}
              onChange={setSelectedStatus}
              className="sm:w-40"
            />
          </div>

          {productError && productTab === "mine" && (
            <div className="mb-4 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
              {productError}
            </div>
          )}

          {loading ? (
            <div className="bg-white rounded-2xl border p-12 text-center">
              <FiRefreshCw
                className="animate-spin mx-auto text-[#008236]"
                size={24}
              />
              <p className="text-sm text-gray-500 mt-3">Loading...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
              <FiPackage className="mx-auto text-gray-300" size={36} />
              <p className="text-sm text-gray-500 mt-3">
                {productTab === "services"
                  ? "No services yet. Offer barbing, design, tutoring, and more."
                  : productTab === "otherServices"
                    ? "No other services found."
                    : productTab === "others"
                      ? "No other products found."
                      : "No products yet. Add your first listing."}
              </p>
              {isOwnTab && (
                <button
                  type="button"
                  onClick={
                    productTab === "services"
                      ? handleAddService
                      : handleAddProduct
                  }
                  className="mt-4 h-10 px-4 rounded-xl bg-[#008236] text-white text-sm font-semibold"
                >
                  {productTab === "services" ? "Add service" : "Add product"}
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredProducts.map((item) => (
                <div
                  key={`${item.kind}-${item.id}`}
                  className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm"
                >
                  <div className="aspect-[4/3] bg-gray-100 relative">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FiImage className="text-gray-300" size={40} />
                      </div>
                    )}
                    <span
                      className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        item.kind === "service"
                          ? "bg-green-600 text-white"
                          : "bg-white/90 text-gray-700 border border-gray-100"
                      }`}
                    >
                      {item.kind === "service" ? "Service" : "Product"}
                    </span>
                    {isOwnTab && (
                      <div className="absolute top-2 right-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenu(openMenu === item.id ? null : item.id);
                          }}
                          className="w-8 h-8 rounded-lg bg-white/90 text-gray-600 flex items-center justify-center"
                        >
                          <FiMoreVertical size={16} />
                        </button>
                        {openMenu === item.id && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="absolute right-0 top-9 z-30 w-36 bg-white border border-green-100 rounded-xl shadow-xl p-1"
                          >
                            <button
                              type="button"
                              onClick={() => handleEditItem(item)}
                              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs hover:bg-green-50 hover:text-[#008236] text-left"
                            >
                              <FiEdit2 size={14} /> Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setDeleteItem(item);
                                setOpenMenu(null);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs text-red-500 hover:bg-red-50 text-left"
                            >
                              <FiTrash2 size={14} /> Delete
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <p className="text-[11px] text-green-600 font-medium">
                      {item.category}
                    </p>
                    <p className="text-sm font-semibold text-gray-800 mt-0.5 line-clamp-2">
                      {item.name}
                    </p>
                    <p className="text-lg font-bold text-gray-800 mt-3">
                      {formatNaira(item.price)}
                    </p>
                    {!isOwnTab && (
                      <p className="text-[11px] text-gray-400 mt-1 truncate">
                        {item.sellerName}
                      </p>
                    )}
                    {productTab === "mine" && (
                      <div className="grid grid-cols-2 gap-2 mt-4">
                        <div className="bg-green-50 rounded-xl p-3 border border-green-100">
                          <p className="text-[9px] text-[#008236] uppercase font-semibold">
                            Sales
                          </p>
                          <p className="text-sm font-bold text-gray-700 mt-1">
                            {getSoldCount(item)}
                          </p>
                        </div>
                        <div className="bg-green-50 rounded-xl p-3 border border-green-100">
                          <p className="text-[9px] text-[#008236] uppercase font-semibold">
                            ID
                          </p>
                          <p className="text-[10px] font-semibold text-gray-600 mt-1 truncate">
                            {item.id}
                          </p>
                        </div>
                      </div>
                    )}
                    <span
                      className={`inline-flex items-center gap-1 mt-3 px-2 py-0.5 rounded-full text-[10px] font-semibold ${getStatusClasses(
                        item.status
                      )}`}
                    >
                      {item.status === "Active" ? (
                        <FiCheckCircle size={10} />
                      ) : (
                        <FiClock size={10} />
                      )}
                      {item.status}
                    </span>
                    {isOwnTab && (
                      <div className="flex items-center gap-2 mt-3">
                        <button
                          type="button"
                          onClick={() => handleEditItem(item)}
                          className="flex-1 h-10 rounded-xl border border-green-200 text-[#008236] bg-green-50/50 text-xs font-semibold flex items-center justify-center gap-2 hover:bg-green-50"
                        >
                          <FiEdit2 size={14} /> Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteItem(item)}
                          className="flex-1 h-10 rounded-xl border border-red-100 text-red-600 bg-red-50/40 text-xs font-semibold flex items-center justify-center gap-2 hover:bg-red-50"
                        >
                          <FiTrash2 size={14} /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-5 rounded-2xl bg-green-50 border border-green-100 p-4 sm:p-5 flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-white text-[#008236] flex items-center justify-center shadow-sm flex-shrink-0">
              <FiCheckCircle size={18} />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">
                Your listings sync automatically
              </p>
              <p className="text-xs text-gray-500 mt-1 leading-5">
                Products and services update in real time for buyers on CampusMart.
              </p>
            </div>
          </div>
        </main>
      </div>

      {showProductModal && (
        <div
          className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-[2px] flex items-center justify-center p-3 sm:p-5"
          onClick={() => {
            if (!savingProduct) {
              setShowProductModal(false);
              resetProductForm();
            }
          }}
        >
          <div
            className="w-full max-w-2xl max-h-[92vh] overflow-y-auto bg-white rounded-2xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 bg-white border-b border-green-100 px-5 sm:px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-11 sm:h-11 flex-shrink-0 rounded-xl bg-green-50 text-[#008236] flex items-center justify-center">
                  {editingItem ? <FiEdit2 size={19} /> : <FiPlus size={20} />}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-800">
                    {editingItem
                      ? listingType === "service"
                        ? "Edit Service"
                        : "Edit Product"
                      : listingType === "service"
                        ? "Add Service"
                        : "Add Product"}
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {listingType === "service"
                      ? "Offer a skill on campus (barbing, design, tutoring…)."
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
                className="w-9 h-9 rounded-lg text-gray-400 hover:bg-green-50 hover:text-[#008236] flex items-center justify-center disabled:opacity-50"
              >
                <FiX size={19} />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-5 sm:p-6">
              {formError && (
                <div className="mb-5 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600 flex items-center gap-2">
                  <FiAlertCircle size={16} />
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-2">
                    {listingType === "service" ? "Service Name" : "Product Name"}
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={productForm.name}
                    onChange={handleProductFormChange}
                    disabled={savingProduct}
                    placeholder={
                      listingType === "service"
                        ? "e.g. Campus haircut & beard trim"
                        : "e.g. HP EliteBook Laptop"
                    }
                    className="w-full h-11 px-3.5 rounded-xl border border-gray-200 bg-gray-50 text-sm outline-none focus:border-[#008236] focus:ring-4 focus:ring-green-50 disabled:opacity-60"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">
                    Category
                  </label>
                  <GreenDropdown
                    value={productForm.category}
                    options={
                      listingType === "service"
                        ? SERVICE_CATEGORIES
                        : PRODUCT_CATEGORIES
                    }
                    onChange={(value) =>
                      setProductForm((c) => ({ ...c, category: value }))
                    }
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">
                    {listingType === "service" ? "Starting price" : "Price"}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#008236] font-semibold text-sm">
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
                      className="w-full h-11 pl-8 pr-3.5 rounded-xl border border-gray-200 bg-gray-50 text-sm outline-none focus:border-[#008236] focus:ring-4 focus:ring-green-50 disabled:opacity-60"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">
                    Status
                  </label>
                  <GreenDropdown
                    value={productForm.status}
                    options={["Active", "Out of Stock"]}
                    onChange={(value) =>
                      setProductForm((c) => ({ ...c, status: value }))
                    }
                    className="w-full"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-2">
                    Image
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
                        className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-gray-200 bg-gray-50 text-sm outline-none focus:border-[#008236] focus:ring-4 focus:ring-green-50 disabled:opacity-60"
                      />
                    </div>
                    <label
                      className={`w-full h-11 px-3.5 rounded-xl border border-dashed border-green-200 bg-green-50/50 text-[#008236] text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer hover:bg-green-50 ${
                        savingProduct ? "opacity-60 pointer-events-none" : ""
                      }`}
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
                  {(imagePreview || productForm.image) && (
                    <div className="mt-3 w-full h-40 rounded-xl bg-green-50 overflow-hidden border border-green-100">
                      <img
                        src={imagePreview || productForm.image}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>

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
                    placeholder={
                      listingType === "service"
                        ? "Describe what you offer, location, availability..."
                        : "Describe your product..."
                    }
                    className="w-full px-3.5 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm resize-none outline-none focus:border-[#008236] focus:ring-4 focus:ring-green-50 disabled:opacity-60"
                  />
                </div>
              </div>

              <div className="flex flex-row items-center justify-end gap-3 mt-6 pt-5 border-t border-green-50">
                <button
                  type="button"
                  disabled={savingProduct}
                  onClick={() => {
                    setShowProductModal(false);
                    resetProductForm();
                  }}
                  className="h-11 px-5 min-w-[105px] rounded-xl border border-gray-200 bg-white text-gray-600 text-sm font-semibold hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProduct}
                  className="h-11 px-5 min-w-[125px] rounded-xl bg-[#008236] text-white text-sm font-semibold flex items-center justify-center gap-2 hover:bg-[#006f2e] disabled:opacity-60"
                >
                  {savingProduct ? (
                    <>
                      <FiRefreshCw size={17} className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <FiSave size={17} />
                      {editingItem ? "Save Changes" : "Publish"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteItem && (
        <div
          className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4"
          onClick={() => setDeleteItem(null)}
        >
          <div
            className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-5 sm:p-6 border border-green-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl bg-green-50 text-[#008236] flex items-center justify-center flex-shrink-0 border border-green-100">
                <FiTrash2 size={20} />
              </div>
              <div className="min-w-0">
                <h3 className="text-lg font-bold text-gray-800">
                  Delete {deleteItem.kind === "service" ? "service" : "product"}?
                </h3>
                <p className="text-sm text-gray-500 mt-1 leading-5">
                  Are you sure you want to delete{" "}
                  <span className="font-semibold text-[#008236]">
                    {deleteItem.name}
                  </span>
                  ? This cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setDeleteItem(null)}
                className="flex-1 h-11 rounded-xl border border-green-200 bg-white text-[#008236] text-sm font-semibold hover:bg-green-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="flex-1 h-11 rounded-xl bg-[#008236] text-white text-sm font-semibold hover:bg-[#006f2e]"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SellerProducts;