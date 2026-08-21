function Logo() {
  return (
    <div className="mb-8">
      {/* CM LOGO + BRAND */}
      <div className="flex items-center gap-3">
        {/* CM LOGO */}
        <div
          className="
            w-11
            h-11

            rounded-xl

            bg-[#008236]

            flex
            items-center
            justify-center

            shadow-xl
            shadow-black/50

            border
            border-white/10

            flex-shrink-0
          "
        >
          <span
            className="
              text-white
              text-[17px]
              font-black
              tracking-tight

              drop-shadow-sm
            "
          >
            CM
          </span>
        </div>

        {/* CAMPUSMART BRAND */}
        <div className="min-w-0">
          <h1
            className="
              text-2xl  mt-5

              font-extrabold

              tracking-tight

              leading-none

              whitespace-nowrap
            "
          >
            <span className="text-white">
              Campus
            </span>

            <span className="text-green-200">
              Mart
            </span>
          </h1>

          <p
            className="
              text-xs
              text-green-100

              mt-1

              whitespace-nowrap
            "
          >
            Buy. Sell. Connect.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Logo;