import React, { useState, useEffect } from "react";
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { Scissors, Menu, X, User, LogOut } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/services", label: "Services" },
  { to: "/gallery", label: "Gallery" },
  { to: "/reviews", label: "Reviews" },
  { to: "/contact", label: "Contact" },
  { to: "/app", label: "App" },
];

export const Navbar = () => {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const loc = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => { setOpen(false); }, [loc.pathname]);

  return (
    <header
      data-testid="navbar"
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? "bg-[#050505]/95 backdrop-blur-md border-b border-white/5" : "bg-[#050505]/60 backdrop-blur-sm"}`}
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-8 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center py-1" data-testid="brand-logo">
          <img src="/assets/arman-logo.png" alt="Arman Hair Studio" className="h-12 sm:h-14 lg:h-16 w-auto object-contain" />
        </Link>

        <nav className="hidden lg:flex items-center gap-8">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              data-testid={`nav-${n.label.toLowerCase()}`}
              className={({ isActive }) =>
                `font-manrope text-[13px] tracking-[0.18em] uppercase transition-colors ${
                  isActive ? "text-brand-gold" : "text-white/80 hover:text-brand-gold"
                }`
              }
            >
              {n.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-3">
          {user ? (
            <>
              <Link to={user.role === "admin" ? "/admin" : user.role === "staff" ? "/staff" : "/account"} className="btn-outline-gold !py-2 !px-4 !text-xs" data-testid="nav-account">
                <User className="w-4 h-4" /> {user.name.split(" ")[0]}
              </Link>
              <button onClick={() => { logout(); navigate("/"); }} className="text-white/60 hover:text-brand-gold" data-testid="nav-logout">
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            <Link to="/login" className="text-white/80 hover:text-brand-gold text-xs uppercase tracking-widest" data-testid="nav-login">Login</Link>
          )}
          <Link to="/contact" className="btn-gold !py-3 !px-6 !text-xs" data-testid="nav-book">Book Appointment</Link>
        </div>

        <button
          className="lg:hidden text-white p-2"
          onClick={() => setOpen(!open)}
          data-testid="mobile-menu-toggle"
          aria-label="Menu"
        >
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {open && (
        <div className="lg:hidden bg-[#050505]/98 backdrop-blur-md border-t border-white/5" data-testid="mobile-menu">
          <div className="px-6 py-6 flex flex-col gap-4">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                className={({ isActive }) =>
                  `font-manrope text-sm tracking-[0.18em] uppercase ${isActive ? "text-brand-gold" : "text-white/80"}`
                }
              >
                {n.label}
              </NavLink>
            ))}
            <div className="h-[1px] bg-white/10 my-2" />
            {user ? (
              <>
                <Link to={user.role === "admin" ? "/admin" : user.role === "staff" ? "/staff" : "/account"} className="text-brand-gold text-sm uppercase tracking-widest">My Account</Link>
                <button onClick={() => { logout(); navigate("/"); }} className="text-left text-white/70 text-sm uppercase tracking-widest">Logout</button>
              </>
            ) : (
              <Link to="/login" className="text-white/80 text-sm uppercase tracking-widest">Login / Register</Link>
            )}
            <Link to="/contact" className="btn-gold mt-2">Book Appointment</Link>
          </div>
        </div>
      )}
    </header>
  );
};
