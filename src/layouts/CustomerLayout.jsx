import { useState } from "react";
import Navbar from "../components/layout/Navbar";
import Sidebar from "../components/layout/Sidebar";

function CustomerLayout({ children, cartCount = 0 }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-100">

      {/* Sidebar */}
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      {/* Main Area */}
      <div className="lg:ml-72">

        {/* Navbar */}
        <Navbar
          setSidebarOpen={setSidebarOpen}
          cartCount={cartCount}
        />

        {/* Page Content */}
        <main className="p-4 sm:p-6">
          {children}
        </main>

      </div>

    </div>
  );
}

export default CustomerLayout;