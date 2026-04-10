import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Shield, Menu, X } from "lucide-react";
import { useState } from "react";

const Navbar = () => {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = [
    { to: "/", label: "Home" },
    { to: "/pricing", label: "Pricing" },
    { to: "/dashboard", label: "Dashboard" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <Link to="/" className="flex items-center gap-2">
          <Shield className="h-7 w-7 text-primary" />
          <span className="text-xl font-heading font-bold text-foreground">MetaClean</span>
        </Link>

        <div className="hidden md:flex items-center gap-6">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={`text-sm font-medium transition-colors hover:text-primary ${
                location.pathname === l.to ? "text-primary" : "text-muted-foreground"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Link to="/auth">
            <Button variant="ghost" size="sm">Log in</Button>
          </Link>
          <Link to="/auth?tab=signup">
            <Button size="sm" className="glow-primary-sm">Sign up</Button>
          </Link>
        </div>

        <button className="md:hidden text-foreground" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden glass border-t border-border/50 px-4 pb-4 space-y-3">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setMobileOpen(false)}
              className="block py-2 text-sm text-muted-foreground hover:text-primary"
            >
              {l.label}
            </Link>
          ))}
          <div className="flex gap-2 pt-2">
            <Link to="/auth" className="flex-1">
              <Button variant="ghost" size="sm" className="w-full">Log in</Button>
            </Link>
            <Link to="/auth?tab=signup" className="flex-1">
              <Button size="sm" className="w-full">Sign up</Button>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
