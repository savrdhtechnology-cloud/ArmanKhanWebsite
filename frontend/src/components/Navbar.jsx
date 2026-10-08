import React, { useState, useEffect } from "react";
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { Scissors, Menu, X, User, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { EASE } from "@/components/Motion";

// Play the navbar entrance only on the first page load, not on every route change.
let navbarHasEntered = false;

const NAV = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/services", label: "Services" },
  { to: "/gallery", label: "Gallery" },
  { to: "/reviews", label: "Reviews" },
  { to: "/contact", label: "Contact" },
  { to: "/app", label: "App" },
];

const MOBILE_ITEM = {
  hidden: { opacity: 0, x: -20 },
  show: { opacity: 1, x: 0, transition: { duration: 0.35, ease: EASE } },
};

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

  const [playEntrance] = useState(() => !navbarHasEntered);
  useEffect(() => { navbarHasEntered = true; }, []);

  return (
    <motion.header
      initial={playEntrance ? { y: -100, opacity: 0 } : false}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: EASE }}
      data-testid="navbar"
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? "bg-[#050505]/95 backdrop-blur-md border-b border-white/5" : "bg-[#050505]/60 backdrop-blur-sm"}`}
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-8 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center py-1" data-testid="brand-logo">
          <motion.img
            src="/assets/arman-logo.png"
            alt="Arman Hair Studio"
            className="h-12 sm:h-14 lg:h-16 w-auto object-contain"
            whileHover={{ scale: 1.05, rotate: -2 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 18 }}
          />
        </Link>

        <nav className="hidden lg:flex items-center gap-8">
          {NAV.map((n, i) => (
            <motion.div
              key={n.to}
              initial={playEntrance ? { opacity: 0, y: -12 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: playEntrance ? 0.3 + i * 0.06 : 0, duration: 0.5, ease: EASE }}
            >
              <NavLink
                to={n.to}
                end={n.to === "/"}
                data-testid={`nav-${n.label.toLowerCase()}`}
                className={({ isActive }) =>
                  `relative block py-1 font-manrope text-[13px] tracking-[0.18em] uppercase transition-colors ${
                    isActive ? "text-brand-gold" : "text-white/80 hover:text-brand-gold"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {n.label}
                    {isActive && (
                      <motion.span
                        layoutId="nav-active-underline"
                        className="absolute left-0 right-0 -bottom-1 h-px bg-brand-gold"
                        transition={{ type: "spring", stiffness: 380, damping: 32 }}
                      />
                    )}
                  </>
                )}
              </NavLink>
            </motion.div>
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
          <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
            <Link to="/contact" className="btn-gold !py-3 !px-6 !text-xs" data-testid="nav-book">Book Appointment</Link>
          </motion.div>
        </div>

        <button
          className="lg:hidden text-white p-2"
          onClick={() => setOpen(!open)}
          data-testid="mobile-menu-toggle"
          aria-label="Menu"
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={open ? "close" : "menu"}
              className="block"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </motion.span>
          </AnimatePresence>
        </button>
      </div>

      <AnimatePresence>
      {open && (
        <motion.div
          key="mobile-menu"
          className="lg:hidden bg-[#050505]/98 backdrop-blur-md border-t border-white/5 overflow-hidden"
          data-testid="mobile-menu"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.4, ease: EASE }}
        >
          <motion.div
            className="px-6 py-6 flex flex-col gap-4"
            initial="hidden"
            animate="show"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05, delayChildren: 0.1 } } }}
          >
            {NAV.map((n) => (
              <motion.div key={n.to} variants={MOBILE_ITEM}>
                <NavLink
                  to={n.to}
                  end={n.to === "/"}
                  className={({ isActive }) =>
                    `font-manrope text-sm tracking-[0.18em] uppercase ${isActive ? "text-brand-gold" : "text-white/80"}`
                  }
                >
                  {n.label}
                </NavLink>
              </motion.div>
            ))}
            <motion.div variants={MOBILE_ITEM} className="h-[1px] bg-white/10 my-2" />
            {user ? (
              <>
                <motion.div variants={MOBILE_ITEM}>
                  <Link to={user.role === "admin" ? "/admin" : user.role === "staff" ? "/staff" : "/account"} className="text-brand-gold text-sm uppercase tracking-widest">My Account</Link>
                </motion.div>
                <motion.div variants={MOBILE_ITEM}>
                  <button onClick={() => { logout(); navigate("/"); }} className="text-left text-white/70 text-sm uppercase tracking-widest">Logout</button>
                </motion.div>
              </>
            ) : (
              <motion.div variants={MOBILE_ITEM}>
                <Link to="/login" className="text-white/80 text-sm uppercase tracking-widest">Login / Register</Link>
              </motion.div>
            )}
            <motion.div variants={MOBILE_ITEM} className="mt-2 flex">
              <Link to="/contact" className="btn-gold w-full">Book Appointment</Link>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>
    </motion.header>
  );
};
