import { useNavigate } from "react-router-dom";
import {
  FiSmartphone,
  FiShoppingBag,
  FiBookOpen,
  FiMonitor,
  FiCoffee,
  FiWatch,
  FiHeadphones,
  FiGift,
} from "react-icons/fi";

function Categories() {
  const navigate = useNavigate();

  const categories = [
    {
      name: "Phones",
      value: "Phone",
      icon: FiSmartphone,
    },
    {
      name: "Fashion",
      value: "Fashion",
      icon: FiShoppingBag,
    },
    {
      name: "Books",
      value: "Books",
      icon: FiBookOpen,
    },
    {
      name: "Electronics",
      value: "Electronics",
      icon: FiMonitor,
    },
    {
      name: "Food",
      value: "Food",
      icon: FiCoffee,
    },
    {
      name: "Accessories",
      value: "Accessories",
      icon: FiWatch,
    },
    {
      name: "Audio",
      value: "Audio",
      icon: FiHeadphones,
    },
    {
      name: "Gifts",
      value: "Gifts",
      icon: FiGift,
    },
  ];

  const handleCategoryClick = (category) => {
    navigate(`/browse-products?category=${category}`);
  };

  return (
    <section className="bg-white rounded-2xl border border-gray-100 p-5">

      {/* HEADER */}
      <div className="flex items-center justify-between mb-5">

        <h2 className="font-bold text-gray-800">
          Categories
        </h2>

        <button
          onClick={() => navigate("/browse-products")}
          className="text-sm text-green-600 hover:text-green-700 font-medium"
        >
          View All
        </button>

      </div>

      {/* CATEGORIES */}
      <div className="grid grid-cols-4 sm:grid-cols-8 gap-4">

        {categories.map((category) => {
          const Icon = category.icon;

          return (
            <button
              key={category.value}
              type="button"
              onClick={() => handleCategoryClick(category.value)}
              className="
                flex
                flex-col
                items-center
                gap-2
                group
                cursor-pointer
              "
            >

              {/* ICON */}
              <div
                className="
                  w-12
                  h-12
                  rounded-full
                  bg-green-50
                  flex
                  items-center
                  justify-center
                  text-green-600
                  group-hover:bg-green-600
                  group-hover:text-white
                  transition
                "
              >
                <Icon size={20} />
              </div>

              {/* NAME */}
              <span
                className="
                  text-xs
                  text-gray-600
                  group-hover:text-green-600
                  transition
                "
              >
                {category.name}
              </span>

            </button>
          );
        })}

      </div>

    </section>
  );
}

export default Categories;