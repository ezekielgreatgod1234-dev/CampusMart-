import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import CustomerLayout from "../../layouts/CustomerLayout";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../context/firebase";
import { useAuth } from "../../context/AuthContext";
import {
  FiArrowLeft,
  FiLoader,
  FiPaperclip,
  FiCheck,
  FiPlus,
  FiTrash2,
} from "react-icons/fi";

const FILE_TYPE_OPTIONS = [
  { id: "jpg", label: "JPG" },
  { id: "png", label: "PNG" },
  { id: "pdf", label: "PDF" },
];

function emptySlot() {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    label: "",
    types: { jpg: true, png: true, pdf: true },
  };
}

function minDateTimeLocal() {
  const d = new Date(Date.now() + 60 * 1000);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${day}T${h}:${min}`;
}

function CreateGig({ cartCount = 0, profile }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { firebaseUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "Programming",
    budget: "",
    deadline: "",
    location: "",
    requirements: "",
    eligibility: "",
  });

  const [requireAttachment, setRequireAttachment] = useState(false);
  const [fileSlots, setFileSlots] = useState([emptySlot()]);

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
    setError("");
  };

  const updateSlotLabel = (id, label) => {
    setFileSlots((prev) =>
      prev.map((s) => (s.id === id ? { ...s, label } : s))
    );
  };

  const toggleSlotType = (id, typeId) => {
    setFileSlots((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        return {
          ...s,
          types: { ...s.types, [typeId]: !s.types[typeId] },
        };
      })
    );
  };

  const addSlot = () => {
    if (fileSlots.length >= 8) {
      setError("You can request up to 8 files per gig.");
      return;
    }
    setFileSlots((prev) => [...prev, emptySlot()]);
    setError("");
  };

  const removeSlot = (id) => {
    setFileSlots((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((s) => s.id !== id);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!firebaseUser) {
      setError("You must be logged in to post a gig.");
      return;
    }

    if (!formData.deadline) {
      setError("Please choose a deadline using the calendar.");
      return;
    }

    const deadlineDate = new Date(formData.deadline);
    if (Number.isNaN(deadlineDate.getTime())) {
      setError("Please enter a valid deadline.");
      return;
    }
    if (deadlineDate.getTime() <= Date.now()) {
      setError("Please choose a future date and time for the deadline.");
      return;
    }

    let attachmentSlots = [];

    if (requireAttachment) {
      if (!fileSlots.length) {
        setError("Add at least one required file.");
        return;
      }

      for (let i = 0; i < fileSlots.length; i++) {
        const slot = fileSlots[i];
        const label = String(slot.label || "").trim();
        if (!label) {
          setError(
            `Enter a description for file ${i + 1} (e.g. Your CV, Portfolio).`
          );
          return;
        }
        const types = [];
        if (slot.types?.jpg) types.push("jpg");
        if (slot.types?.png) types.push("png");
        if (slot.types?.pdf) types.push("pdf");
        if (!types.length) {
          setError(
            `Select at least one file type for “${label}” (JPG, PNG, or PDF).`
          );
          return;
        }
        attachmentSlots.push({
          id: slot.id,
          label,
          allowedTypes: types,
        });
      }
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

      const flatTypes = Array.from(
        new Set(attachmentSlots.flatMap((s) => s.allowedTypes))
      );

      await addDoc(collection(db, "gigs"), {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        budget: formData.budget.trim() || "Negotiable",
        deadline: deadlineDate.toISOString(),
        location: formData.location.trim() || "Campus",
        requirements: formData.requirements.trim() || "",
        eligibility: formData.eligibility.trim() || "",
        requireAttachment: requireAttachment === true,
        attachmentSlots,
        attachmentCount: attachmentSlots.length,
        allowedFileTypes: flatTypes,
        status: "open",
        applicationOpen: true,
        applicationsCount: 0,
        posterId: firebaseUser.uid,
        posterName,
        posterImage,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      if (location.state?.fromSellerGigs) {
        navigate("/seller-dashboard", {
          state: {
            fromGigs: true,
            successMessage: "Gig posted successfully!",
          },
        });
      } else {
        navigate("/gigs", {
          state: { successMessage: "Gig posted successfully!" },
        });
      }
    } catch (err) {
      console.error("Error posting gig:", err);
      setError("Failed to post gig. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (location.state?.fromSellerGigs) {
      navigate("/seller-dashboard", { state: { fromGigs: true } });
    } else {
      navigate("/gigs");
    }
  };

  return (
    <CustomerLayout cartCount={cartCount}>
      <div className="max-w-2xl mx-auto space-y-6 pb-10">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleBack}
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
          {error && (
            <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

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
              Requirements
            </label>
            <textarea
              name="requirements"
              value={formData.requirements}
              onChange={handleChange}
              rows={3}
              placeholder="e.g. Must deliver editable source files, 2 revision rounds..."
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1.5">
              Eligibility
            </label>
            <textarea
              name="eligibility"
              value={formData.eligibility}
              onChange={handleChange}
              rows={3}
              placeholder="e.g. Open to current students only, must be on main campus..."
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

          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1.5">
              Budget
            </label>
            <input
              type="text"
              name="budget"
              value={formData.budget}
              onChange={handleChange}
              placeholder="e.g. ₦8,000 or Negotiable"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1.5">
              Deadline *
            </label>
            <input
              type="datetime-local"
              name="deadline"
              value={formData.deadline}
              min={minDateTimeLocal()}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition bg-white"
            />
            <p className="text-xs text-gray-500 mt-1.5">
              Pick a future date and time from the calendar.
            </p>
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

          <div className="rounded-2xl border border-gray-100 bg-gray-50/80 p-4 space-y-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={requireAttachment}
                onChange={(e) => {
                  setRequireAttachment(e.target.checked);
                  if (e.target.checked && fileSlots.length === 0) {
                    setFileSlots([emptySlot()]);
                  }
                }}
                className="mt-1 accent-[#008236] w-4 h-4"
              />
              <span className="text-sm text-gray-800">
                <span className="font-semibold flex items-center gap-1.5">
                  <FiPaperclip size={15} className="text-[#008236]" />
                  Require applicants to upload file(s)
                </span>
                <span className="block text-gray-500 mt-0.5 text-xs leading-relaxed">
                  Add one or more required uploads (e.g. CV, certificate).
                  Applicants must upload every file you list.
                </span>
              </span>
            </label>

            {requireAttachment && (
              <div className="space-y-3">
                {fileSlots.map((slot, index) => (
                  <div
                    key={slot.id}
                    className="rounded-xl border border-gray-200 bg-white p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-bold uppercase tracking-wide text-[#008236]">
                        Required file {index + 1}
                      </p>
                      {fileSlots.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeSlot(slot.id)}
                          className="w-8 h-8 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 flex items-center justify-center"
                          title="Remove"
                        >
                          <FiTrash2 size={15} />
                        </button>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        What should they upload? *
                      </label>
                      <input
                        type="text"
                        value={slot.label}
                        onChange={(e) =>
                          updateSlotLabel(slot.id, e.target.value)
                        }
                        placeholder="e.g. Your CV, Portfolio, Certificate"
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
                      />
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-gray-700 mb-1.5">
                        Allowed types
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {FILE_TYPE_OPTIONS.map((opt) => {
                          const on = !!slot.types?.[opt.id];
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => toggleSlotType(slot.id, opt.id)}
                              className={`h-9 px-3 rounded-lg text-xs font-semibold border flex items-center gap-1 transition ${
                                on
                                  ? "bg-[#008236] text-white border-[#008236]"
                                  : "bg-white text-gray-600 border-gray-200"
                              }`}
                            >
                              {on && <FiCheck size={12} />}
                              {opt.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addSlot}
                  className="w-full h-11 rounded-xl border border-dashed border-green-300 bg-white text-sm font-semibold text-[#008236] flex items-center justify-center gap-2 hover:bg-green-50"
                >
                  <FiPlus size={16} />
                  Add another required file
                </button>

                <p className="text-xs text-gray-500">
                  Applicants must upload{" "}
                  <span className="font-semibold text-gray-700">
                    {fileSlots.length}
                  </span>{" "}
                  file{fileSlots.length === 1 ? "" : "s"} to apply.
                </p>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-[#008236] hover:bg-[#006f2e] disabled:bg-green-400 text-white font-medium py-3.5 rounded-xl transition"
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