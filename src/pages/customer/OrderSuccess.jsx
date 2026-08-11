import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiCheckCircle,
  FiShoppingBag,
  FiHome,
  FiArrowRight,
} from "react-icons/fi";

function OrderSuccess() {
  const navigate = useNavigate();

  // Generate a simple order reference
  const orderNumber = "CM-20260810";

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">

      <div className="w-full max-w-2xl">

        {/* SUCCESS CARD */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">

          {/* GREEN HEADER */}
          <div className="bg-green-600 px-6 py-10 sm:px-10 text-center text-white">

            {/* CHECK ICON */}
            <div className="
              w-20
              h-20
              mx-auto
              rounded-full
              bg-white
              flex
              items-center
              justify-center
              shadow-lg
            ">
              <FiCheckCircle
                size={48}
                className="text-green-600"
              />
            </div>

            <h1 className="
              text-2xl
              sm:text-3xl
              font-bold
              mt-6
            ">
              Order Placed Successfully!
            </h1>

            <p className="
              text-green-100
              text-sm
              sm:text-base
              mt-2
              max-w-md
              mx-auto
            ">
              Thank you for shopping with CampusMart.
              Your order has been received successfully.
            </p>

          </div>


          {/* CONTENT */}
          <div className="p-6 sm:p-10">

            {/* ORDER NUMBER */}
            <div className="
              bg-gray-50
              rounded-2xl
              p-5
              flex
              flex-col
              sm:flex-row
              sm:items-center
              sm:justify-between
              gap-3
            ">

              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide">
                  Order Number
                </p>

                <p className="
                  text-lg
                  font-bold
                  text-gray-800
                  mt-1
                ">
                  {orderNumber}
                </p>
              </div>

              <span className="
                inline-flex
                items-center
                gap-2
                w-fit
                bg-green-100
                text-green-700
                px-3
                py-1.5
                rounded-full
                text-xs
                font-semibold
              ">
                <FiCheckCircle />
                Confirmed
              </span>

            </div>


            {/* MESSAGE */}
            <div className="text-center mt-8">

              <h2 className="
                text-xl
                sm:text-2xl
                font-bold
                text-gray-800
              ">
                What's next?
              </h2>

              <p className="
                text-gray-500
                text-sm
                sm:text-base
                leading-6
                mt-2
                max-w-lg
                mx-auto
              ">
                The seller will receive your order and prepare
                it for delivery or pickup. You can check your
                orders anytime from your dashboard.
              </p>

            </div>


            {/* STEPS */}
            <div className="
              grid
              grid-cols-1
              sm:grid-cols-3
              gap-4
              mt-8
            ">

              {/* STEP 1 */}
              <div className="
                bg-green-50
                rounded-2xl
                p-4
                text-center
              ">

                <div className="
                  w-10
                  h-10
                  mx-auto
                  rounded-full
                  bg-green-100
                  text-green-600
                  flex
                  items-center
                  justify-center
                ">
                  <FiCheckCircle />
                </div>

                <h3 className="
                  font-semibold
                  text-gray-800
                  text-sm
                  mt-3
                ">
                  Order Confirmed
                </h3>

                <p className="
                  text-xs
                  text-gray-500
                  mt-1
                ">
                  Your order is received
                </p>

              </div>


              {/* STEP 2 */}
              <div className="
                bg-gray-50
                rounded-2xl
                p-4
                text-center
              ">

                <div className="
                  w-10
                  h-10
                  mx-auto
                  rounded-full
                  bg-gray-100
                  text-gray-500
                  flex
                  items-center
                  justify-center
                ">
                  <FiShoppingBag />
                </div>

                <h3 className="
                  font-semibold
                  text-gray-800
                  text-sm
                  mt-3
                ">
                  Preparing
                </h3>

                <p className="
                  text-xs
                  text-gray-500
                  mt-1
                ">
                  Seller prepares your order
                </p>

              </div>


              {/* STEP 3 */}
              <div className="
                bg-gray-50
                rounded-2xl
                p-4
                text-center
              ">

                <div className="
                  w-10
                  h-10
                  mx-auto
                  rounded-full
                  bg-gray-100
                  text-gray-500
                  flex
                  items-center
                  justify-center
                ">
                  <FiArrowRight />
                </div>

                <h3 className="
                  font-semibold
                  text-gray-800
                  text-sm
                  mt-3
                ">
                  Delivery
                </h3>

                <p className="
                  text-xs
                  text-gray-500
                  mt-1
                ">
                  Receive your order
                </p>

              </div>

            </div>


            {/* BUTTONS */}
            <div className="
              grid
              grid-cols-1
              sm:grid-cols-2
              gap-3
              mt-10
            ">

              {/* DASHBOARD */}
              <button
                onClick={() => navigate("/dashboard")}
                className="
                  flex
                  items-center
                  justify-center
                  gap-2
                  bg-green-600
                  hover:bg-green-700
                  text-white
                  py-3.5
                  rounded-xl
                  font-semibold
                  transition
                "
              >
                <FiHome />
                Go to Dashboard
              </button>


              {/* CONTINUE SHOPPING */}
              <button
                onClick={() => navigate("/browse-products")}
                className="
                  flex
                  items-center
                  justify-center
                  gap-2
                  border
                  border-gray-200
                  text-gray-700
                  hover:bg-gray-50
                  py-3.5
                  rounded-xl
                  font-semibold
                  transition
                "
              >
                <FiShoppingBag />
                Continue Shopping
              </button>

            </div>

          </div>

        </div>


        {/* FOOTER */}
        <p className="
          text-center
          text-xs
          text-gray-400
          mt-5
        ">
          Thank you for choosing CampusMart 💚
        </p>

      </div>

    </div>
  );
}

export default OrderSuccess;