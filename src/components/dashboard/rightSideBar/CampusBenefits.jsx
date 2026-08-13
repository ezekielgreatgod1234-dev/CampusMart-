import {
  FiShield,
  FiTruck,
  FiCreditCard,
  FiUsers,
} from "react-icons/fi";

function CampusBenefits() {
  const benefits = [
    {
      icon: FiShield,
      title: "Verified Sellers",
      description: "Buy from trusted students and sellers.",
    },
    {
      icon: FiTruck,
      title: "Campus Delivery",
      description: "Get your orders delivered around campus.",
    },
    {
      icon: FiCreditCard,
      title: "Secure Payments",
      description: "Pay safely with trusted payment options.",
    },
    {
      icon: FiUsers,
      title: "Student Community",
      description: "Buy, sell and connect with other students.",
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">

      {/* HEADER */}

      <div className="mb-5">

        <h2 className="text-lg font-bold text-gray-800">
          Why CampusMart?
        </h2>

        <p className="text-xs text-gray-500 mt-1">
          Everything you need for a better campus shopping experience.
        </p>

      </div>


      {/* BENEFITS */}

      <div className="space-y-4">

        {benefits.map((benefit, index) => {

          const Icon = benefit.icon;

          return (
            <div
              key={index}
              className="
                flex
                items-start
                gap-3
                p-3
                rounded-xl
                hover:bg-gray-50
                transition
              "
            >

              {/* ICON */}

              <div
                className="
                  w-10
                  h-10
                  shrink-0
                  rounded-xl
                  bg-green-50
                  text-green-600
                  flex
                  items-center
                  justify-center
                "
              >
                <Icon size={18} />
              </div>


              {/* TEXT */}

              <div>

                <h3 className="text-sm font-semibold text-gray-800">
                  {benefit.title}
                </h3>

                <p className="text-xs text-gray-500 mt-1 leading-4">
                  {benefit.description}
                </p>

              </div>

            </div>
          );

        })}

      </div>


      {/* BOTTOM */}

      <div className="mt-4 pt-4 border-t border-gray-100">

        <div className="
          bg-green-50
          rounded-xl
          p-3
          text-center
        ">

          <p className="text-xs text-green-700 font-medium">
            Buy. Sell. Connect.
          </p>

          <p className="text-[11px] text-green-600 mt-1">
            Your campus marketplace.
          </p>

        </div>

      </div>

    </div>
  );
}

export default CampusBenefits;