import { useState } from "react";

import Navbar from "../components/layout/Navbar";
import Sidebar from "../components/layout/Sidebar";

function CustomerLayout({
  children,
  cartCount = 0,
  wishlist = [],
  unreadMessages = 0,
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-100">

      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      {/* =====================================================
          MAIN
      ===================================================== */}

      <div className="lg:ml-72">

        {/* =================================================
            NAVBAR
        ================================================= */}

        <Navbar
          setSidebarOpen={setSidebarOpen}
          cartCount={cartCount}
          wishlist={wishlist}
          unreadMessages={unreadMessages}
        />

        {/* =================================================
            CONTENT
        ================================================= */}

        <main className="p-4 sm:p-6">
          {children}
        </main>

      </div>

    </div>
  );
}

export default CustomerLayout;