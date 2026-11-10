"use client";
// Thin compatibility layer so the website components keep their React Router call shapes
// (Link to=, NavLink className={({isActive})}, useNavigate, Navigate) on top of Next.js navigation.
import React, { useEffect } from "react";
import NextLink from "next/link";
import { usePathname, useRouter } from "next/navigation";

export const Link = React.forwardRef(function Link({ to, replace, ...props }, ref) {
  return <NextLink ref={ref} href={to} replace={replace} {...props} />;
});

export function NavLink({ to, end, className, style, children, ...props }) {
  const pathname = usePathname() || "/";
  const isActive = end || to === "/" ? pathname === to : pathname === to || pathname.startsWith(`${to}/`);
  const state = { isActive, isPending: false };
  return (
    <NextLink
      href={to}
      aria-current={isActive ? "page" : undefined}
      className={typeof className === "function" ? className(state) : className}
      style={typeof style === "function" ? style(state) : style}
      {...props}
    >
      {typeof children === "function" ? children(state) : children}
    </NextLink>
  );
}

export function useNavigate() {
  const router = useRouter();
  return (to, opts = {}) => {
    if (typeof to === "number") { router.back(); return; }
    if (opts.replace) router.replace(to); else router.push(to);
  };
}

export function useLocation() {
  const pathname = usePathname() || "/";
  return { pathname, search: "", hash: "", state: null };
}

export function Navigate({ to, replace }) {
  const router = useRouter();
  useEffect(() => { if (replace) router.replace(to); else router.push(to); }, [router, to, replace]);
  return null;
}
