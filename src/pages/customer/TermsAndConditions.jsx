import { Link } from "react-router-dom";

import {
  FiShoppingCart,
  FiShield,
  FiUserCheck,
  FiShoppingBag,
  FiMessageCircle,
  FiAlertTriangle,
  FiCreditCard,
  FiLock,
  FiCheckCircle,
  FiMail,
  FiArrowLeft,
} from "react-icons/fi";

function TermsAndConditions() {
  const lastUpdated = "August 20, 2026";

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <div className="h-[72px] flex items-center justify-between">
            {/* LOGO */}

            <Link
              to="/"
              className="flex items-center gap-2.5"
            >
              <div className="w-10 h-10 rounded-xl bg-green-600 text-white flex items-center justify-center shadow-sm">
                <FiShoppingCart size={21} />
              </div>

              <div className="text-xl font-extrabold tracking-tight">
                Campus
                <span className="text-green-600">
                  Mart
                </span>
              </div>
            </Link>

            {/* BACK BUTTON */}

            <Link
              to="/"
              className="
                flex
                items-center
                gap-2
                text-sm
                font-semibold
                text-gray-600
                hover:text-green-600
                transition
              "
            >
              <FiArrowLeft size={17} />
              <span className="hidden sm:inline">
                Back to Home
              </span>
            </Link>
          </div>
        </div>
      </header>

      {/* =====================================================
          HERO
      ===================================================== */}

      <section className="bg-gradient-to-br from-[#f1fff5] via-white to-[#eafff1] border-b border-green-50">
        <div className="max-w-4xl mx-auto px-5 sm:px-8 py-14 sm:py-20 text-center">
          <div
            className="
              mx-auto
              w-16
              h-16
              rounded-2xl
              bg-green-100
              text-green-600
              flex
              items-center
              justify-center
            "
          >
            <FiShield size={30} />
          </div>

          <h1 className="mt-6 text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900">
            Terms &{" "}
            <span className="text-green-600">
              Conditions
            </span>
          </h1>

          <p className="mt-4 max-w-2xl mx-auto text-sm sm:text-base text-gray-600 leading-7">
            Please read these Terms & Conditions carefully
            before using CampusMart. By creating an account
            or using our platform, you agree to these terms.
          </p>

          <div className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-green-100 text-xs sm:text-sm text-gray-500">
            <FiCheckCircle className="text-green-600" />
            Last updated: {lastUpdated}
          </div>
        </div>
      </section>

      {/* =====================================================
          CONTENT
      ===================================================== */}

      <main className="max-w-5xl mx-auto px-5 sm:px-8 py-10 sm:py-14">
        <div className="grid lg:grid-cols-[240px_1fr] gap-8">
          {/* =================================================
              TABLE OF CONTENTS
          ================================================= */}

          <aside className="hidden lg:block">
            <div className="sticky top-24 bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4">
                On this page
              </h3>

              <nav className="space-y-2 text-sm">
                {[
                  ["acceptance", "1. Acceptance"],
                  ["platform", "2. About CampusMart"],
                  ["accounts", "3. User Accounts"],
                  ["buying", "4. Buying & Selling"],
                  ["payments", "5. Payments"],
                  ["communication", "6. Communication"],
                  ["prohibited", "7. Prohibited Activities"],
                  ["safety", "8. Safety"],
                  ["content", "9. User Content"],
                  ["privacy", "10. Privacy"],
                  ["liability", "11. Liability"],
                  ["termination", "12. Termination"],
                  ["changes", "13. Changes"],
                  ["contact", "14. Contact"],
                ].map(([id, title]) => (
                  <a
                    key={id}
                    href={`#${id}`}
                    className="
                      block
                      px-3
                      py-2
                      rounded-lg
                      text-gray-500
                      hover:bg-green-50
                      hover:text-green-700
                      transition
                    "
                  >
                    {title}
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          {/* =================================================
              TERMS CONTENT
          ================================================= */}

          <article className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-9 lg:p-11">
            {/* INTRO */}

            <div className="rounded-xl bg-green-50 border border-green-100 p-5 mb-10">
              <div className="flex gap-3">
                <FiShield
                  className="text-green-600 shrink-0 mt-0.5"
                  size={20}
                />

                <p className="text-sm text-green-800 leading-6">
                  These Terms & Conditions govern your use of
                  CampusMart, a student-focused marketplace
                  designed to help students buy, sell and
                  communicate within their campus community.
                </p>
              </div>
            </div>

            {/* =================================================
                1. ACCEPTANCE
            ================================================= */}

            <section id="acceptance" className="scroll-mt-28">
              <SectionTitle
                number="01"
                title="Acceptance of Terms"
                icon={<FiCheckCircle />}
              />

              <p className="section-text">
                By accessing, registering for, or using
                CampusMart, you agree to be bound by these
                Terms & Conditions and any applicable policies
                referenced in them.
              </p>

              <p className="section-text">
                If you do not agree with these terms, please
                do not use CampusMart or create an account.
              </p>

              <p className="section-text">
                You must also comply with applicable laws and
                regulations when using the platform.
              </p>
            </section>

            {/* =================================================
                2. ABOUT
            ================================================= */}

            <section
              id="platform"
              className="mt-12 scroll-mt-28"
            >
              <SectionTitle
                number="02"
                title="About CampusMart"
                icon={<FiShoppingBag />}
              />

              <p className="section-text">
                CampusMart is an online marketplace that
                connects students who want to buy, sell or
                exchange products and services within their
                campus communities.
              </p>

              <p className="section-text">
                CampusMart provides the platform and
                communication tools but does not necessarily
                own, inspect, manufacture, or guarantee the
                products listed by users.
              </p>

              <div className="notice-box">
                <FiAlertTriangle className="text-green-600 shrink-0 mt-1" />

                <p>
                  Users are responsible for verifying the
                  condition, authenticity, price and
                  suitability of products before completing a
                  transaction.
                </p>
              </div>
            </section>

            {/* =================================================
                3. ACCOUNTS
            ================================================= */}

            <section
              id="accounts"
              className="mt-12 scroll-mt-28"
            >
              <SectionTitle
                number="03"
                title="User Accounts"
                icon={<FiUserCheck />}
              />

              <p className="section-text">
                To access certain CampusMart features, you
                may need to create an account.
              </p>

              <h3 className="subheading">
                You agree to:
              </h3>

              <BulletList
                items={[
                  "Provide accurate and truthful information when registering.",
                  "Keep your login credentials secure.",
                  "Not share your account credentials with another person.",
                  "Notify CampusMart if you believe your account has been compromised.",
                  "Use only one account unless CampusMart expressly permits otherwise.",
                  "Update your information when necessary.",
                ]}
              />

              <p className="section-text">
                You are responsible for activities performed
                through your account unless you have promptly
                reported unauthorized access to CampusMart.
              </p>
            </section>

            {/* =================================================
                4. BUYING & SELLING
            ================================================= */}

            <section
              id="buying"
              className="mt-12 scroll-mt-28"
            >
              <SectionTitle
                number="04"
                title="Buying & Selling"
                icon={<FiShoppingBag />}
              />

              <p className="section-text">
                CampusMart allows users to list products and
                communicate with potential buyers or sellers.
              </p>

              <h3 className="subheading">
                Sellers must:
              </h3>

              <BulletList
                items={[
                  "Provide honest and accurate descriptions of listed products.",
                  "Use accurate photographs where appropriate.",
                  "Clearly state relevant product conditions or defects.",
                  "Set reasonable and accurate prices.",
                  "Only list products they are legally permitted to sell.",
                  "Communicate honestly with potential buyers.",
                ]}
              />

              <h3 className="subheading">
                Buyers should:
              </h3>

              <BulletList
                items={[
                  "Review product information carefully before purchasing.",
                  "Ask questions where product information is unclear.",
                  "Verify the condition of an item before completing a transaction.",
                  "Use reasonable caution when meeting another user.",
                ]}
              />

              <p className="section-text">
                CampusMart does not guarantee that a buyer or
                seller will complete a transaction or that a
                listed product will meet a user's expectations.
              </p>
            </section>

            {/* =================================================
                5. PAYMENTS
            ================================================= */}

            <section
              id="payments"
              className="mt-12 scroll-mt-28"
            >
              <SectionTitle
                number="05"
                title="Payments & Transactions"
                icon={<FiCreditCard />}
              />

              <p className="section-text">
                Unless otherwise stated within the platform,
                CampusMart does not act as a bank or financial
                institution and does not take ownership of
                products traded between users.
              </p>

              <p className="section-text">
                Users are responsible for agreeing on payment
                arrangements and ensuring that any payment
                method they use is legitimate and appropriate.
              </p>

              <div className="notice-box">
                <FiAlertTriangle className="text-green-600 shrink-0 mt-1" />

                <p>
                  Never send money to someone solely because
                  they claim to represent CampusMart. Verify
                  payment requests through official CampusMart
                  channels.
                </p>
              </div>
            </section>

            {/* =================================================
                6. COMMUNICATION
            ================================================= */}

            <section
              id="communication"
              className="mt-12 scroll-mt-28"
            >
              <SectionTitle
                number="06"
                title="Communication"
                icon={<FiMessageCircle />}
              />

              <p className="section-text">
                CampusMart may provide messaging tools that
                allow buyers and sellers to communicate.
              </p>

              <p className="section-text">
                You agree to use these communication features
                responsibly and respectfully.
              </p>

              <BulletList
                items={[
                  "Do not harass, threaten or intimidate other users.",
                  "Do not send spam or unwanted promotional messages.",
                  "Do not impersonate another person.",
                  "Do not use messages to conduct fraudulent activities.",
                  "Do not send illegal or harmful content.",
                ]}
              />
            </section>

            {/* =================================================
                7. PROHIBITED
            ================================================= */}

            <section
              id="prohibited"
              className="mt-12 scroll-mt-28"
            >
              <SectionTitle
                number="07"
                title="Prohibited Activities"
                icon={<FiAlertTriangle />}
              />

              <p className="section-text">
                You may not use CampusMart to:
              </p>

              <BulletList
                items={[
                  "Sell illegal goods or services.",
                  "Sell stolen or counterfeit products.",
                  "Commit fraud or deceive other users.",
                  "Attempt to gain unauthorized access to another account.",
                  "Upload malware or malicious software.",
                  "Collect another user's personal information without permission.",
                  "Create misleading listings.",
                  "Circumvent CampusMart security measures.",
                  "Use CampusMart for unlawful purposes.",
                  "Interfere with the normal operation of the platform.",
                ]}
              />

              <p className="section-text">
                CampusMart reserves the right to remove
                listings or restrict accounts that violate
                these terms or applicable laws.
              </p>
            </section>

            {/* =================================================
                8. SAFETY
            ================================================= */}

            <section
              id="safety"
              className="mt-12 scroll-mt-28"
            >
              <SectionTitle
                number="08"
                title="Safety & In-Person Transactions"
                icon={<FiShield />}
              />

              <p className="section-text">
                Users may choose to meet in person to complete
                transactions. You are responsible for taking
                reasonable precautions when meeting another
                user.
              </p>

              <BulletList
                items={[
                  "Meet in a public and familiar location.",
                  "Consider meeting during daylight hours.",
                  "Tell someone you trust where you are going.",
                  "Avoid carrying unnecessary amounts of cash.",
                  "Inspect products before completing a transaction.",
                  "Leave the meeting if you feel unsafe or uncomfortable.",
                ]}
              />

              <div className="notice-box">
                <FiShield className="text-green-600 shrink-0 mt-1" />

                <p>
                  CampusMart encourages users to prioritize
                  their personal safety. CampusMart cannot
                  guarantee the behavior or identity of another
                  user.
                </p>
              </div>
            </section>

            {/* =================================================
                9. USER CONTENT
            ================================================= */}

            <section
              id="content"
              className="mt-12 scroll-mt-28"
            >
              <SectionTitle
                number="09"
                title="User Content"
                icon={<FiShoppingBag />}
              />

              <p className="section-text">
                Users may upload product photos, descriptions,
                profile information, messages and other content
                to CampusMart.
              </p>

              <p className="section-text">
                You are responsible for ensuring that content
                you upload does not violate the rights of
                another person or applicable laws.
              </p>

              <p className="section-text">
                You should not upload content that is
                fraudulent, abusive, defamatory, threatening,
                discriminatory, unlawful or misleading.
              </p>
            </section>

            {/* =================================================
                10. PRIVACY
            ================================================= */}

            <section
              id="privacy"
              className="mt-12 scroll-mt-28"
            >
              <SectionTitle
                number="10"
                title="Privacy"
                icon={<FiLock />}
              />

              <p className="section-text">
                Your use of CampusMart is also subject to our
                Privacy Policy, which explains how information
                may be collected, used and protected.
              </p>

              <Link
                to="/privacy-policy"
                className="
                  inline-flex
                  items-center
                  gap-2
                  mt-2
                  px-4
                  py-2.5
                  rounded-xl
                  bg-green-50
                  text-green-700
                  font-semibold
                  text-sm
                  hover:bg-green-100
                  transition
                "
              >
                Read Privacy Policy
                <FiArrowLeft className="rotate-180" />
              </Link>
            </section>

            {/* =================================================
                11. LIABILITY
            ================================================= */}

            <section
              id="liability"
              className="mt-12 scroll-mt-28"
            >
              <SectionTitle
                number="11"
                title="Disclaimer & Liability"
                icon={<FiAlertTriangle />}
              />

              <p className="section-text">
                CampusMart is provided to help users connect
                and conduct marketplace activities. To the
                extent permitted by applicable law, CampusMart
                does not guarantee that the platform will
                always be available, error-free or completely
                secure.
              </p>

              <p className="section-text">
                CampusMart is not responsible for the quality,
                safety, legality, authenticity or accuracy of
                products listed by users.
              </p>

              <p className="section-text">
                Users are responsible for their own decisions,
                communications and transactions with other
                users.
              </p>
            </section>

            {/* =================================================
                12. TERMINATION
            ================================================= */}

            <section
              id="termination"
              className="mt-12 scroll-mt-28"
            >
              <SectionTitle
                number="12"
                title="Account Suspension & Termination"
                icon={<FiLock />}
              />

              <p className="section-text">
                CampusMart may suspend, restrict or terminate
                an account where there is a reasonable basis
                to believe that the user has violated these
                Terms & Conditions, applicable laws or the
                safety of other users.
              </p>

              <p className="section-text">
                Users may also stop using CampusMart at any
                time and may request account deletion where
                applicable.
              </p>
            </section>

            {/* =================================================
                13. CHANGES
            ================================================= */}

            <section
              id="changes"
              className="mt-12 scroll-mt-28"
            >
              <SectionTitle
                number="13"
                title="Changes to These Terms"
                icon={<FiCheckCircle />}
              />

              <p className="section-text">
                CampusMart may update these Terms & Conditions
                from time to time as the platform develops or
                as legal or operational requirements change.
              </p>

              <p className="section-text">
                When significant changes are made, we may
                provide an appropriate notice through the
                platform or other available communication
                channels.
              </p>

              <p className="section-text">
                Your continued use of CampusMart after updated
                terms become effective means that you accept
                the revised terms.
              </p>
            </section>

            {/* =================================================
                14. CONTACT
            ================================================= */}

            <section
              id="contact"
              className="mt-12 scroll-mt-28"
            >
              <SectionTitle
                number="14"
                title="Contact CampusMart"
                icon={<FiMail />}
              />

              <p className="section-text">
                If you have questions, concerns or complaints
                about these Terms & Conditions, you can contact
                CampusMart through our support channels.
              </p>

              <div className="mt-5 rounded-2xl bg-[#f1faf4] border border-green-100 p-5 sm:p-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="w-11 h-11 rounded-xl bg-green-600 text-white flex items-center justify-center shrink-0">
                    <FiMail size={20} />
                  </div>

                  <div>
                    <h3 className="font-bold text-gray-900">
                      CampusMart Support
                    </h3>

                    <p className="mt-1 text-sm text-gray-600">
                      We're here to help with questions about
                      your account, transactions and the
                      CampusMart platform.
                    </p>

                    <a
                      href="mailto:support@campusmart.com"
                      className="
                        inline-block
                        mt-3
                        text-sm
                        font-semibold
                        text-green-700
                        hover:text-green-800
                      "
                    >
                      support@campusmart.com
                    </a>
                  </div>
                </div>
              </div>
            </section>

            {/* =================================================
                FINAL NOTE
            ================================================= */}

            <div className="mt-12 pt-8 border-t border-gray-100">
              <p className="text-xs sm:text-sm text-gray-500 leading-6">
                By using CampusMart, you acknowledge that you
                have read, understood and agreed to these Terms
                & Conditions.
              </p>

              <p className="mt-3 text-xs text-gray-400">
                Last updated: {lastUpdated}
              </p>
            </div>
          </article>
        </div>
      </main>

      {/* =====================================================
          FOOTER
      ===================================================== */}

      <footer className="bg-[#00261d] text-white">
        <div className="max-w-5xl mx-auto px-5 sm:px-8 py-10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-5">
            <Link
              to="/"
              className="flex items-center gap-2.5"
            >
              <div className="w-9 h-9 rounded-lg bg-green-600 flex items-center justify-center">
                <FiShoppingCart size={19} />
              </div>

              <span className="text-lg font-black">
                Campus
                <span className="text-green-400">
                  Mart
                </span>
              </span>
            </Link>

            <div className="flex flex-wrap justify-center gap-5 text-sm text-gray-300">
              <Link
                to="/"
                className="hover:text-green-400 transition"
              >
                Home
              </Link>

              <Link
                to="/privacy-policy"
                className="hover:text-green-400 transition"
              >
                Privacy Policy
              </Link>

              <Link
                to="/terms-and-conditions"
                className="text-green-400 font-semibold"
              >
                Terms & Conditions
              </Link>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-white/10 text-center">
            <p className="text-xs text-gray-400">
              © 2026 CampusMart. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* =========================================================
   SECTION TITLE
========================================================= */

function SectionTitle({ number, title, icon }) {
  return (
    <div className="flex items-start gap-4 mb-5">
      <div className="w-11 h-11 rounded-xl bg-green-50 text-green-600 flex items-center justify-center shrink-0">
        {icon}
      </div>

      <div>
        <p className="text-xs font-bold tracking-wider text-green-600 uppercase">
          Section {number}
        </p>

        <h2 className="mt-1 text-xl sm:text-2xl font-black text-gray-900">
          {title}
        </h2>
      </div>
    </div>
  );
}

/* =========================================================
   BULLET LIST
========================================================= */

function BulletList({ items }) {
  return (
    <ul className="mt-4 space-y-3">
      {items.map((item) => (
        <li
          key={item}
          className="flex items-start gap-3 text-sm sm:text-base text-gray-600 leading-6"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-green-600 mt-2.5 shrink-0" />

          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export default TermsAndConditions;