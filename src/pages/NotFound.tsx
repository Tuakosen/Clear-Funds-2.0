import { Link } from "react-router-dom";
import { Home } from "lucide-react";
import { Logo } from "../components/ui/Logo";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <Logo size={44} />
      <p className="mt-8 text-7xl font-extrabold text-brand">404</p>
      <h1 className="mt-2 text-2xl font-bold text-content">Page not found</h1>
      <p className="mt-2 max-w-sm text-content-secondary">
        The page you're looking for doesn't exist or has moved.
      </p>
      <Link to="/" className="cf-btn-primary mt-8">
        <Home size={16} /> Back home
      </Link>
    </div>
  );
}
