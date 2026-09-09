import { useState } from "react";
import { useNavigate } from "react-router-dom";
import CustomerLayout from "../../layouts/CustomerLayout";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../context/firebase";
import { useAuth } from "../../context/AuthContext";
import { FiArrowLeft, FiLoader } from "react-icons/fi";

function CreateGig({ cartCount = 0, profile }) {
  const navigate = useNavigate();
  const { firebaseUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "Programming",
    budget: "",
    budgetType: "fixed",
    deadline: "",
    location: "",
  });

  const categories = [
    { value: "Programming", label: "Programming" },
    { value: "Graphics", label: "Graphics / Design" },
    { value: "Photography", label: "Photography" },
    { value: "Tutoring", label: "Tutoring" },
    { value: "Repairs", label: "Repairs" },
    { value: "Delivery", label: "Delivery / Errands" },
    { value: "Others", label: "Others" },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!firebaseUser) {
      alert("You must be logged in to post a gig.");
      return;
    }

    setLoading(true);

    try {
      const posterName =
        profile?.fullName ||
        profile?.displayName ||
        firebaseUser.displayName ||
        "CampusMart Student";

      const posterImage =
        profile?.profileImage ||
        profile?.photoURL ||
        firebaseUser.photoURL ||
        null;

      await addDoc(collection(db, "gigs"), {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        budget:
          formData.budgetType === "negotiable"
            ? "Negotiable"
            : formData.budget.trim(),
        budgetType: formData.budgetType,
        deadline: formData.deadline.trim(),
        location: formData.location.trim() || "Campus",
        status: "open",
        applicationsCount: 0,
        posterId: firebaseUser.uid,
        posterName,
        posterImage,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      alert("Gig posted successfully!");
      navigate("/gigs");
    } catch (error) {
      console.error("Error posting gig:", error);
      alert("Failed to post gig. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <CustomerLayout cartCount={cartCount}>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-green-50 hover:text-green-600 hover:border-green-200 transition"
          >
            <FiArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
              Post a Gig
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Describe what you need help with
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 space-y-5"
        >
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1.5">
              Gig Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              placeholder="e.g. Need logo design for student association"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1.5">
              Description *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows={5}
              placeholder="Explain clearly what you need..."
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1.5">
              Category *
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition bg-white"
            >
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1.5">
                Budget Type
              </label>
              <select
                name="budgetType"
                value={formData.budgetType}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition bg-white"
              >
                <option value="fixed">Fixed Price</option>
                <option value="range">Price Range</option>
                <option value="negotiable">Negotiable</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1.5">
                Budget {formData.budgetType !== "negotiable" && "*"}
              </label>
              <input
                type="text"
                name="budget"
                value={formData.budget}
                onChange={handleChange}
                required={formData.budgetType !== "negotiable"}
                disabled={formData.budgetType === "negotiable"}
                placeholder={
                  formData.budgetType === "range"
                    ? "e.g. ₦5,000 - ₦10,000"
                    : "e.g. ₦8,000"
                }
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition disabled:bg-gray-50"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1.5">
              Deadline *
            </label>
            <input
              type="text"
              name="deadline"
              value={formData.deadline}
              onChange={handleChange}
              required
              placeholder="e.g. 3 days, This Saturday"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1.5">
              Preferred Location
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="e.g. Main Campus, Hostel A, Online"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium py-3.5 rounded-xl transition"
          >
            {loading ? (
              <>
                <FiLoader className="animate-spin" size={18} />
                Posting...
              </>
            ) : (
              "Post Gig"
            )}
          </button>
        </form>
      </div>
    </CustomerLayout>
  );
}

export default CreateGig;