import { useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Menu } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { ThemeToggle } from "../ui/ThemeToggle";
import { Logo } from "../ui/Logo";
import { useAuth } from "../../context/AuthContext";

export function AppLayout() {
  const { user, loading } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Logo size={40} />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/signin" state={{ from: location.pathname }} replace />;
  }

  return (
    <div className="min-h-screen">
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />

      {/* Mobile top bar */}
      <div
        className="sticky top-0 z-20 flex items-center justify-between bg-sidebar/80 px-4 py-3 backdrop-blur lg:hidden"
        style={{ borderBottom: "1px solid var(--card-border)" }}
      >
        <button
          onClick={() => setMenuOpen(true)}
          className="rounded-lg p-2 text-content-secondary"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
        <Logo withWordmark={false} size={30} />
        <ThemeToggle />
      </div>

      <main className="lg:pl-64">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
