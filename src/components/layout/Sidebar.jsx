import { FiX } from "react-icons/fi";
import { NavLink } from "react-router-dom";
import Logo from "./Logo";
import sidebarMenu from "../../data/sidebarMenu";

function Sidebar({ sidebarOpen, setSidebarOpen }) {
  return (
    <>
      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
  className={`
    fixed
    top-0
    left-0
    z-50
    w-72
    h-screen
    bg-green-700
    text-white
    flex
    flex-col
    transition-transform
    duration-300
    overflow-hidden
    ${
      sidebarOpen
        ? "translate-x-0"
        : "-translate-x-full"
    }
    lg:translate-x-0
  `}
>
        {/* Top */}
        <div>

          {/* Mobile Close Button */}
          <div className="lg:hidden flex justify-end p-4">
            <button onClick={() => setSidebarOpen(false)}>
              <FiX className="text-3xl" />
            </button>
          </div>

          {/* Logo */}
          <div className="px-6">
            <Logo />
          </div>
          </div>

          {/* Menu */}
          <div className="flex-1 overflow-y-auto px-4">
  <nav className="space-y-2">

   {sidebarMenu.map((item, index) => {
  const Icon = item.icon;

  return (
    <NavLink
  key={index}
  to={item.path}
  onClick={() => setSidebarOpen(false)}
  className={({ isActive }) => `
    flex
    items-center
    gap-4
    px-4
    py-3
    rounded-xl
    transition
    duration-200
    ${
      isActive
        ? "bg-white text-green-700 font-semibold"
        : "text-white hover:bg-green-600"
    }
  `}
>
  <Icon className="text-xl shrink-0" />

  <span>{item.name}</span>
</NavLink>
  );
})}

  </nav>
</div>
        
      </aside>
    </>
  );
}

export default Sidebar;