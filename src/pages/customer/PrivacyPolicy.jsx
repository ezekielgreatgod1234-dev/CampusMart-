import { useNavigate } from "react-router-dom";

import {
  FiArrowLeft,
  FiShield,
  FiUser,
  FiShoppingBag,
  FiMessageCircle,
  FiDatabase,
  FiLock,
  FiGlobe,
  FiFileText,
  FiMail,
} from "react-icons/fi";

function PrivacyPolicy() {
  const navigate = useNavigate();

  const lastUpdated = "August 20, 2026";

  return (
    <div className="min-h-screen bg-gray-50">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">

        <div
          className="
            max-w-6xl
            mx-auto
            px-4
            sm:px-6
            lg:px-8
            h-16
            flex
            items-center
            justify-between
          "
        >

          {/* LOGO */}

          <button
            type="button"
            onClick={() => navigate("/")}
            className="
              flex
              items-center
              gap-2
              group
            "
          >

            <div
              className="
                w-10
                h-10
                rounded-xl
                bg-green-600
                text-white
                flex
                items-center
                justify-center
                font-bold
                shadow-sm
                group-hover:bg-green-700
                transition
              "
            >
              CM
            </div>

            <div className="text-left">

              <h1 className="font-bold text-gray-900 leading-none">
                Campus<span className="text-green-600">Mart</span>
              </h1>

              <p className="text-[10px] text-gray-400 mt-1">
                Student Marketplace
              </p>

            </div>

          </button>

          {/* BACK BUTTON */}

          <button
            type="button"
            onClick={() => navigate(-1)}
            className="
              flex
              items-center
              gap-2
              px-4
              py-2.5
              rounded-xl
              border
              border-gray-200
              bg-white
              text-gray-600
              text-sm
              font-medium
              hover:border-green-200
              hover:bg-green-50
              hover:text-green-700
              transition
            "
          >

            <FiArrowLeft size={17} />

            <span className="hidden sm:inline">
              Go Back
            </span>

          </button>

        </div>

      </header>


      {/* =====================================================
          HERO
      ===================================================== */}

      <section className="bg-white border-b border-gray-100">

        <div
          className="
            max-w-4xl
            mx-auto
            px-4
            sm:px-6
            py-12
            sm:py-16
            text-center
          "
        >

          <div
            className="
              w-16
              h-16
              mx-auto
              rounded-2xl
              bg-green-50
              text-green-600
              flex
              items-center
              justify-center
            "
          >
            <FiShield size={30} />
          </div>

          <h1
            className="
              mt-6
              text-3xl
              sm:text-4xl
              font-bold
              text-gray-900
            "
          >
            Privacy Policy
          </h1>

          <p
            className="
              mt-4
              max-w-2xl
              mx-auto
              text-sm
              sm:text-base
              leading-7
              text-gray-500
            "
          >
            Your privacy matters to us. This Privacy Policy
            explains how CampusMart collects, uses, protects,
            and handles information when you use our platform.
          </p>

          <div
            className="
              mt-5
              inline-flex
              items-center
              gap-2
              px-4
              py-2
              rounded-full
              bg-green-50
              text-green-700
              text-xs
              sm:text-sm
              font-medium
            "
          >
            <FiFileText size={14} />

            Last updated: {lastUpdated}
          </div>

        </div>

      </section>


      {/* =====================================================
          CONTENT
      ===================================================== */}

      <main
        className="
          max-w-4xl
          mx-auto
          px-4
          sm:px-6
          py-8
          sm:py-12
        "
      >

        {/* INTRODUCTION */}

        <PolicySection
          icon={<FiShield />}
          number="1"
          title="Introduction"
        >

          <p>
            Welcome to CampusMart. CampusMart is a student-focused
            marketplace designed to help students discover,
            buy, sell, and communicate about products within
            their campus community.
          </p>

          <p>
            By using CampusMart, you agree to the collection
            and use of information as described in this Privacy
            Policy. We are committed to handling your information
            responsibly and taking reasonable steps to protect it.
          </p>

        </PolicySection>


        {/* INFORMATION WE COLLECT */}

        <PolicySection
          icon={<FiDatabase />}
          number="2"
          title="Information We Collect"
        >

          <p>
            Depending on how you use CampusMart, we may collect
            information that you voluntarily provide to us.
          </p>

          <div className="mt-5 space-y-3">

            <InfoItem
              title="Account Information"
              text="Your name, email address, phone number, campus information, account role, and profile information."
            />

            <InfoItem
              title="Product Information"
              text="Information about products you list, purchase, save, or interact with on CampusMart."
            />

            <InfoItem
              title="Order Information"
              text="Information required to process and manage orders, such as customer details, delivery information, order items, and order status."
            />

            <InfoItem
              title="Messages"
              text="Messages and other information you send through CampusMart's communication features."
            />

            <InfoItem
              title="Technical Information"
              text="Basic information about how you interact with the application may be processed to maintain functionality, security, and reliability."
            />

          </div>

        </PolicySection>


        {/* HOW WE USE INFORMATION */}

        <PolicySection
          icon={<FiGlobe />}
          number="3"
          title="How We Use Your Information"
        >

          <p>
            CampusMart may use information collected through the
            platform for purposes including:
          </p>

          <ul className="mt-4 space-y-3">

            <PolicyBullet>
              Creating and maintaining your CampusMart account.
            </PolicyBullet>

            <PolicyBullet>
              Providing marketplace, shopping, messaging, and
              account features.
            </PolicyBullet>

            <PolicyBullet>
              Processing and managing orders.
            </PolicyBullet>

            <PolicyBullet>
              Connecting buyers and sellers when necessary
              to facilitate marketplace activities.
            </PolicyBullet>

            <PolicyBullet>
              Improving the functionality, reliability, and
              security of CampusMart.
            </PolicyBullet>

            <PolicyBullet>
              Responding to support requests and inquiries.
            </PolicyBullet>

            <PolicyBullet>
              Detecting, preventing, and addressing abuse,
              fraud, security issues, or violations of our
              platform rules.
            </PolicyBullet>

          </ul>

        </PolicySection>


        {/* ACCOUNT INFORMATION */}

        <PolicySection
          icon={<FiUser />}
          number="4"
          title="Account & Profile Information"
        >

          <p>
            When you create a CampusMart account, information
            associated with your account may be stored so that
            you can access your profile and use the marketplace.
          </p>

          <p>
            You are responsible for ensuring that the information
            you provide is accurate and for protecting access to
            your account.
          </p>

          <p>
            You should not share your password or other account
            credentials with other people.
          </p>

        </PolicySection>


        {/* PRODUCTS AND ORDERS */}

        <PolicySection
          icon={<FiShoppingBag />}
          number="5"
          title="Products, Orders & Transactions"
        >

          <p>
            CampusMart stores information necessary to support
            marketplace activities, including products, cart
            information, wishlist information, orders, and
            relevant customer details.
          </p>

          <p>
            Sellers may receive information necessary to complete
            a transaction or communicate with a buyer. Users should
            avoid sharing unnecessary sensitive personal information
            through product listings or messages.
          </p>

          <div
            className="
              mt-5
              p-4
              rounded-xl
              bg-green-50
              border
              border-green-100
            "
          >

            <p className="text-sm text-green-800 leading-6">

              <strong>Important:</strong> CampusMart will never
              intentionally ask you to share your password through
              a product listing, chat, or support conversation.

            </p>

          </div>

        </PolicySection>


        {/* MESSAGES */}

        <PolicySection
          icon={<FiMessageCircle />}
          number="6"
          title="Messages & Communications"
        >

          <p>
            CampusMart may store messages exchanged through the
            platform so that users can access their conversations
            and communication features.
          </p>

          <p>
            Messages may also be processed when necessary to
            maintain platform security, investigate abuse, or
            respond to legitimate support or safety concerns.
          </p>

          <p>
            Please do not send passwords, payment credentials,
            security codes, or other highly sensitive information
            through CampusMart chat.
          </p>

        </PolicySection>


        {/* FIREBASE */}

        <PolicySection
          icon={<FiDatabase />}
          number="7"
          title="Firebase & Third-Party Services"
        >

          <p>
            CampusMart uses third-party infrastructure and
            services to provide important application features.
          </p>

          <p>
            For example, Firebase services may be used for
            authentication, database storage, and other
            application functionality.
          </p>

          <p>
            These services may process information according
            to their own privacy policies and terms. CampusMart
            only uses such services as needed to operate and
            improve the application.
          </p>

        </PolicySection>


        {/* SECURITY */}

        <PolicySection
          icon={<FiLock />}
          number="8"
          title="Data Security"
        >

          <p>
            We take reasonable measures to protect information
            stored and processed through CampusMart.
          </p>

          <p>
            However, no online service can guarantee absolute
            security. Users should also take appropriate steps
            to protect their accounts, including using a strong
            password and keeping login credentials private.
          </p>

        </PolicySection>


        {/* DATA RETENTION */}

        <PolicySection
          icon={<FiDatabase />}
          number="9"
          title="Data Retention"
        >

          <p>
            We may retain information for as long as reasonably
            necessary to provide CampusMart's services, maintain
            account functionality, complete marketplace
            activities, resolve disputes, maintain security,
            and comply with applicable requirements.
          </p>

          <p>
            When information is no longer reasonably required,
            it may be deleted or otherwise handled in accordance
            with applicable requirements and our operational needs.
          </p>

        </PolicySection>


        {/* PRIVACY RIGHTS */}

        <PolicySection
          icon={<FiUser />}
          number="10"
          title="Your Privacy Choices & Rights"
        >

          <p>
            Depending on applicable law, you may have rights
            regarding your personal information, including the
            ability to:
          </p>

          <ul className="mt-4 space-y-3">

            <PolicyBullet>
              Request access to certain personal information
              associated with your account.
            </PolicyBullet>

            <PolicyBullet>
              Request correction of inaccurate information.
            </PolicyBullet>

            <PolicyBullet>
              Request deletion of certain information, where
              applicable.
            </PolicyBullet>

            <PolicyBullet>
              Update information in your CampusMart profile.
            </PolicyBullet>

            <PolicyBullet>
              Contact CampusMart with privacy-related questions
              or concerns.
            </PolicyBullet>

          </ul>

        </PolicySection>


        {/* LOCAL STORAGE */}

        <PolicySection
          icon={<FiDatabase />}
          number="11"
          title="Cookies & Local Storage"
        >

          <p>
            CampusMart may use browser storage technologies,
            including local storage, to remember certain
            preferences and application settings.
          </p>

          <p>
            For example, application preferences such as
            appearance settings may be stored locally on
            your device so they remain available when you
            return to the application.
          </p>

          <p>
            Clearing your browser's stored data may remove
            these locally stored preferences.
          </p>

        </PolicySection>


        {/* CHILDREN */}

        <PolicySection
          icon={<FiUser />}
          number="12"
          title="Children's Privacy"
        >

          <p>
            CampusMart is intended for users who are legally
            permitted to use an online marketplace under the
            laws applicable to them.
          </p>

          <p>
            We do not knowingly seek to collect personal
            information from children in violation of applicable
            privacy laws.
          </p>

        </PolicySection>


        {/* POLICY CHANGES */}

        <PolicySection
          icon={<FiFileText />}
          number="13"
          title="Changes to This Privacy Policy"
        >

          <p>
            We may update this Privacy Policy from time to time
            as CampusMart develops, new features are introduced,
            or applicable requirements change.
          </p>

          <p>
            When changes are made, the updated policy will be
            published on this page and the "Last updated" date
            will be changed accordingly.
          </p>

        </PolicySection>


        {/* CONTACT */}

        <section
          className="
            mt-8
            bg-green-600
            rounded-3xl
            p-6
            sm:p-8
            text-white
          "
        >

          <div
            className="
              w-12
              h-12
              rounded-xl
              bg-white/15
              flex
              items-center
              justify-center
            "
          >
            <FiMail size={22} />
          </div>

          <h2 className="mt-5 text-xl sm:text-2xl font-bold">
            Questions About Your Privacy?
          </h2>

          <p className="mt-3 text-sm sm:text-base text-green-50 leading-7">
            If you have questions, concerns, or requests
            regarding this Privacy Policy or how CampusMart
            handles your information, please contact the
            CampusMart team.
          </p>

          <button
            type="button"
            onClick={() => navigate("/settings")}
            className="
              mt-6
              inline-flex
              items-center
              gap-2
              bg-white
              text-green-700
              px-5
              py-3
              rounded-xl
              font-semibold
              text-sm
              hover:bg-green-50
              transition
            "
          >

            <FiMail size={17} />

            Contact CampusMart

          </button>

        </section>

      </main>


      {/* =====================================================
          FOOTER
      ===================================================== */}

      <footer className="border-t border-gray-100 bg-white">

        <div
          className="
            max-w-6xl
            mx-auto
            px-4
            sm:px-6
            py-8
            flex
            flex-col
            sm:flex-row
            items-center
            justify-between
            gap-4
          "
        >

          <p className="text-sm text-gray-500 text-center sm:text-left">
            © {new Date().getFullYear()}{" "}
            <span className="font-semibold text-green-600">
              CampusMart
            </span>
            . All rights reserved.
          </p>

          <div className="flex items-center gap-4">

            <button
              type="button"
              onClick={() => navigate("/")}
              className="
                text-sm
                text-gray-500
                hover:text-green-600
                transition
              "
            >
              Home
            </button>

            <span className="text-gray-200">
              |
            </span>

            <button
              type="button"
              onClick={() => navigate("/privacy-policy")}
              className="
                text-sm
                text-green-600
                font-medium
              "
            >
              Privacy Policy
            </button>

          </div>

        </div>

      </footer>

    </div>
  );
}


/* =========================================================
   POLICY SECTION
========================================================= */

function PolicySection({
  icon,
  number,
  title,
  children,
}) {
  return (
    <section
      className="
        bg-white
        rounded-2xl
        border
        border-gray-100
        shadow-sm
        p-5
        sm:p-7
        mb-5
      "
    >

      <div className="flex items-start gap-4">

        <div
          className="
            shrink-0
            w-11
            h-11
            rounded-xl
            bg-green-50
            text-green-600
            flex
            items-center
            justify-center
          "
        >
          {icon}
        </div>

        <div className="min-w-0 flex-1">

          <div className="flex items-center gap-2">

            <span
              className="
                text-xs
                font-bold
                text-green-600
                bg-green-50
                px-2
                py-1
                rounded-lg
              "
            >
              {number}
            </span>

            <h2
              className="
                text-lg
                sm:text-xl
                font-bold
                text-gray-900
              "
            >
              {title}
            </h2>

          </div>

          <div
            className="
              mt-4
              space-y-4
              text-sm
              sm:text-base
              text-gray-600
              leading-7
            "
          >
            {children}
          </div>

        </div>

      </div>

    </section>
  );
}


/* =========================================================
   INFO ITEM
========================================================= */

function InfoItem({
  title,
  text,
}) {
  return (
    <div
      className="
        p-4
        rounded-xl
        bg-gray-50
        border
        border-gray-100
      "
    >

      <h3 className="font-semibold text-gray-800">
        {title}
      </h3>

      <p className="mt-1 text-sm text-gray-500 leading-6">
        {text}
      </p>

    </div>
  );
}


/* =========================================================
   POLICY BULLET
========================================================= */

function PolicyBullet({
  children,
}) {
  return (
    <li className="flex items-start gap-3">

      <span
        className="
          mt-2
          shrink-0
          w-2
          h-2
          rounded-full
          bg-green-600
        "
      />

      <span>
        {children}
      </span>

    </li>
  );
}


export default PrivacyPolicy;