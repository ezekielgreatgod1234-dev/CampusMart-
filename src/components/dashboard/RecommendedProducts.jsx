import products from "../../data/products";
import ProductCard from "./ProductCard";

function RecommendedProducts({
  addToCart,
  wishlist = [],
  toggleWishlist,
}) {
  return (
    <section className="bg-white rounded-2xl p-5 shadow-sm">

      {/* HEADER */}

      <div className="flex items-center justify-between mb-6">

        <h2 className="text-xl font-bold text-gray-800">
          Recommended Products
        </h2>

        <button
          type="button"
          className="text-green-600 hover:underline font-medium"
        >
          View All
        </button>

      </div>

      {/* PRODUCT GRID */}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">

        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            addToCart={addToCart}
            wishlist={wishlist}
            toggleWishlist={toggleWishlist}
          />
        ))}

      </div>

    </section>
  );
}

export default RecommendedProducts;