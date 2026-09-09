import { Link, useLocation, useNavigate } from "react-router-dom";
import { FiMail, FiArrowRight } from "react-icons/fi";

function RegistrationSuccess() {
  const navigate = useNavigate();
  const location = useLocation();

  const params = new URLSearchParams(window.location.search);
  const email =
    location.state?.registeredEmail || params.get("email") || "";

  return (
    <div className="min-h-screen bg-[#f7faf8] flex items-center justify-center px-5 py-10">
      <div className="w-full max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-3 group mb-10">
          <div className="w-14 h-14 rounded-2xl bg-green-600 text-white flex items-center justify-center text-xl font-black tracking-tight shadow-[0_8px_20px_rgba(22,163,74,0.25)] ring-4 ring-green-100">
            CM
          </div>
          <div className="text-left">
            <div className="text-2xl font-black text-gray-900 tracking-tight">
              Campus
              <span className="text-green-600">Mart</span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Your Campus Marketplace
            </p>
          </div>
        </Link>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 sm:p-10">
          <div className="w-16 h-16 mx-auto rounded-full bg-green-100 text-green-600 flex items-center justify-center mb-6">
            <FiMail size={28} />
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            Verify your email
          </h1>

          <p className="mt-3 text-gray-500 leading-relaxed">
            Your account has been created
            {email ? (
              <>
                {" "}
                for{" "}
                <span className="font-semibold text-gray-800">{email}</span>
              </>
            ) : null}
            . Please check your inbox and click the verification link before
            logging in.
          </p>

          <p className="mt-3 text-sm text-gray-400">
            Don’t see the email? Check your spam or promotions folder.
          </p>

          <button
            type="button"
            onClick={() =>
              navigate("/login", {
                replace: true,
                state: {
                  registeredEmail: email,
                  justRegistered: true,
                },
              })
            }
            className="mt-8 w-full h-13 rounded-xl bg-green-600 text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-green-700 transition shadow-lg shadow-green-600/10"
          >
            Go to Login
            <FiArrowRight size={18} />
          </button>
        </div>

        <div className="mt-8">
          <Link
            to="/"
            className="text-sm text-gray-400 hover:text-green-600 transition"
          >
            ← Back to CampusMart
          </Link>
        </div>
      </div>
    </div>
  );
}

export default RegistrationSuccess;