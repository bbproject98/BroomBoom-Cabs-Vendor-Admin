"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Car,
  Settings,
  ChevronDown,
  ChevronRight,
  Users,
  CreditCard,
  Ticket,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  vendorCount?: number;
  vendorSubCount?: number;
  pendingTicketCount?: number;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  vendorCount = 0,
  vendorSubCount = 0,
  pendingTicketCount = 0,
  isOpenMobile = false,
  onCloseMobile,
}) => {
  const pathname = usePathname();
  const isVendorActive = pathname?.startsWith("/vendor");
  const [vendorOpen, setVendorOpen] = useState(true);

  useEffect(() => {
    if (isVendorActive) {
      setVendorOpen(true);
    }
  }, [pathname, isVendorActive]);

  // Close mobile drawer on route change
  useEffect(() => {
    onCloseMobile?.();
  }, [pathname]);

  const renderNavLinks = (isMobileDrawer = false) => (
    <nav className="p-4 space-y-2">
      <div className="px-3 pb-1 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
        Management Hub
      </div>

      {/* Dashboard */}
      <Link
        href="/"
        onClick={() => isMobileDrawer && onCloseMobile?.()}
        className={cn(
          "flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group",
          pathname === "/"
            ? "bg-yellow-400 text-slate-950 font-semibold shadow-md shadow-yellow-400/10"
            : "text-slate-300 hover:bg-slate-800/70 hover:text-white"
        )}
      >
        <div className="flex items-center gap-3">
          <LayoutDashboard
            className={cn(
              "w-4 h-4 transition-colors",
              pathname === "/"
                ? "text-slate-950"
                : "text-slate-400 group-hover:text-yellow-400"
            )}
          />
          <span>Dashboard</span>
        </div>
      </Link>

      {/* Vendor Dropdown */}
      <div className="space-y-1">
        <button
          type="button"
          onClick={() => setVendorOpen((prev) => !prev)}
          className={cn(
            "w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group",
            isVendorActive && !vendorOpen
              ? "bg-slate-800 text-emerald-400 font-semibold border border-emerald-400/30"
              : "text-slate-300 hover:bg-slate-800/70 hover:text-white"
          )}
        >
          <div className="flex items-center gap-3">
            <Car
              className={cn(
                "w-4 h-4 transition-colors",
                isVendorActive
                  ? "text-emerald-400"
                  : "text-slate-400 group-hover:text-emerald-400"
              )}
            />
            <span>Vendor</span>
          </div>

          <div className="flex items-center gap-2">
            {vendorCount > 0 && (
              <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                {vendorCount}
              </span>
            )}

            {vendorOpen ? (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-400" />
            )}
          </div>
        </button>

        {/* Vendor Dropdown Items */}
        {vendorOpen && (
          <div className="pl-6 pr-1 py-1 space-y-1 animate-in slide-in-from-top-1 duration-150 border-l-2 border-slate-800 ml-4">
            {/* Vendor Leads */}
            <Link
              href="/vendor"
              onClick={() => isMobileDrawer && onCloseMobile?.()}
              className={cn(
                "flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all group",
                pathname === "/vendor"
                  ? "bg-emerald-400 text-slate-950 font-bold shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              )}
            >
              <div className="flex items-center gap-2.5">
                <Users className="w-3.5 h-3.5" />
                <span>Vendor Leads</span>
              </div>

              {vendorCount > 0 && (
                <span
                  className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded font-bold",
                    pathname === "/vendor"
                      ? "bg-slate-950 text-emerald-400"
                      : "text-emerald-400"
                  )}
                >
                  {vendorCount}
                </span>
              )}
            </Link>

            {/* Subscriptions */}
            <Link
              href="/vendor/subscriptions"
              onClick={() => isMobileDrawer && onCloseMobile?.()}
              className={cn(
                "flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all group",
                pathname === "/vendor/subscriptions"
                  ? "bg-emerald-400 text-slate-950 font-bold shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              )}
            >
              <div className="flex items-center gap-2.5">
                <CreditCard className="w-3.5 h-3.5" />
                <span>Subscriptions</span>
              </div>

              {vendorSubCount > 0 && (
                <span
                  className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded font-bold",
                    pathname === "/vendor/subscriptions"
                      ? "bg-slate-950 text-emerald-400"
                      : "text-emerald-400"
                  )}
                >
                  {vendorSubCount}
                </span>
              )}
            </Link>

            {/* Plan Change Tickets */}
            <Link
              href="/vendor?tab=tickets"
              onClick={() => isMobileDrawer && onCloseMobile?.()}
              className={cn(
                "flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all group",
                pathname === "/vendor"
                  ? "bg-amber-400 text-slate-950 font-bold shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              )}
            >
              <div className="flex items-center gap-2.5">
                <Ticket className="w-3.5 h-3.5" />
                <span>Plan Change Tickets</span>
              </div>

              {pendingTicketCount > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-amber-400 text-slate-950 animate-pulse">
                  {pendingTicketCount}
                </span>
              )}
            </Link>
          </div>
        )}
      </div>

      {/* Settings */}
      <Link
        href="/settings"
        onClick={() => isMobileDrawer && onCloseMobile?.()}
        className={cn(
          "flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group",
          pathname === "/settings"
            ? "bg-yellow-400 text-slate-950 font-semibold shadow-md shadow-yellow-400/10"
            : "text-slate-300 hover:bg-slate-800/70 hover:text-white"
        )}
      >
        <div className="flex items-center gap-3">
          <Settings
            className={cn(
              "w-4 h-4 transition-colors",
              pathname === "/settings"
                ? "text-slate-950"
                : "text-slate-400 group-hover:text-yellow-400"
            )}
          />
          <span>Settings & DB</span>
        </div>
      </Link>
    </nav>
  );

  const renderDbStatus = () => (
    <div className="p-4 m-3 rounded-2xl bg-gradient-to-b from-slate-800/50 to-slate-900/80 border border-slate-800 text-xs">
      <div className="flex items-center justify-between mb-2">
        <span className="text-slate-400 font-medium">Database Status</span>
        <span className="inline-flex items-center gap-1.5 text-emerald-400 font-semibold text-[11px]">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          Vendor DB
        </span>
      </div>
      <p className="text-[11px] text-slate-500 leading-relaxed">
        PostgreSQL port 5432 active. Vendor database connected.
      </p>
    </div>
  );

  return (
    <>
      {/* ========================================================= */}
      {/* 1. DESKTOP PERMANENT SIDEBAR (Hidden on < lg screens) */}
      {/* ========================================================= */}
      <aside className="hidden lg:flex w-64 bg-slate-900/90 backdrop-blur-xl border-r border-slate-800 flex-col justify-between shrink-0 h-screen sticky top-0 z-30">
        <div>
          {/* Brand Header */}
          <div className="h-16 px-6 flex items-center gap-3 border-b border-slate-800/80">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-yellow-500 to-amber-400 flex items-center justify-center font-black text-slate-950 text-xl shadow-lg shadow-yellow-500/20">
              BB
            </div>
            <div>
              <div className="flex items-center gap-1.5 font-bold text-white tracking-tight">
                <span>BroomBoom</span>
                <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-yellow-400/20 text-yellow-300 border border-yellow-400/30 font-semibold">
                  Admin
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Vendor Management HQ</p>
            </div>
          </div>

          {/* Navigation */}
          {renderNavLinks(false)}
        </div>

        {/* Database Status */}
        {renderDbStatus()}
      </aside>

      {/* ========================================================= */}
      {/* 2. MOBILE DRAWER SIDEBAR (Rendered conditionally on < lg) */}
      {/* ========================================================= */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={onCloseMobile}
          />

          {/* Drawer container */}
          <div className="relative w-72 max-w-[85vw] bg-slate-900 border-r border-slate-800 flex flex-col justify-between h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            <div>
              {/* Drawer Brand Header with Close Button */}
              <div className="h-16 px-5 flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-yellow-500 to-amber-400 flex items-center justify-center font-black text-slate-950 text-lg shadow-md shadow-yellow-500/20">
                    BB
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 font-bold text-white text-sm">
                      <span>BroomBoom</span>
                      <span className="text-[9px] uppercase px-1.5 py-0.2 rounded-full bg-yellow-400/20 text-yellow-300 border border-yellow-400/30 font-semibold">
                        Admin
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400">Vendor HQ</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onCloseMobile}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation */}
              <div className="overflow-y-auto max-h-[calc(100vh-180px)]">
                {renderNavLinks(true)}
              </div>
            </div>

            {/* Database Status */}
            <div>{renderDbStatus()}</div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. MOBILE BOTTOM NAVIGATION BAR (Sticky thumb bar on mobile) */}
      {/* ========================================================= */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800 px-3 py-2 flex items-center justify-around shadow-2xl">
        {/* Dashboard */}
        <Link
          href="/"
          className={cn(
            "flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition-all",
            pathname === "/"
              ? "text-yellow-400 font-bold"
              : "text-slate-400 hover:text-slate-200"
          )}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px]">Dashboard</span>
        </Link>

        {/* Vendor Leads */}
        <Link
          href="/vendor"
          className={cn(
            "flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl relative transition-all",
            pathname === "/vendor"
              ? "text-emerald-400 font-bold"
              : "text-slate-400 hover:text-slate-200"
          )}
        >
          <div className="relative">
            <Users className="w-5 h-5" />
            {vendorCount > 0 && (
              <span className="absolute -top-1.5 -right-2 px-1 py-0.2 min-w-[14px] text-center text-[9px] font-bold rounded-full bg-emerald-500 text-slate-950">
                {vendorCount > 99 ? "99+" : vendorCount}
              </span>
            )}
          </div>
          <span className="text-[10px]">Leads</span>
        </Link>

        {/* Subscriptions */}
        <Link
          href="/vendor/subscriptions"
          className={cn(
            "flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl relative transition-all",
            pathname === "/vendor/subscriptions"
              ? "text-blue-400 font-bold"
              : "text-slate-400 hover:text-slate-200"
          )}
        >
          <div className="relative">
            <CreditCard className="w-5 h-5" />
            {vendorSubCount > 0 && (
              <span className="absolute -top-1.5 -right-2 px-1 py-0.2 min-w-[14px] text-center text-[9px] font-bold rounded-full bg-blue-500 text-slate-950">
                {vendorSubCount > 99 ? "99+" : vendorSubCount}
              </span>
            )}
          </div>
          <span className="text-[10px]">Subscriptions</span>
        </Link>

        {/* Tickets */}
        <Link
          href="/vendor?tab=tickets"
          className={cn(
            "flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl relative transition-all",
            pathname === "/vendor" && typeof window !== "undefined" && window.location.search.includes("tab=tickets")
              ? "text-amber-400 font-bold"
              : "text-slate-400 hover:text-slate-200"
          )}
        >
          <div className="relative">
            <Ticket className="w-5 h-5" />
            {pendingTicketCount > 0 && (
              <span className="absolute -top-1.5 -right-2 px-1 py-0.2 min-w-[14px] text-center text-[9px] font-bold rounded-full bg-amber-400 text-slate-950 animate-pulse">
                {pendingTicketCount}
              </span>
            )}
          </div>
          <span className="text-[10px]">Tickets</span>
        </Link>

        {/* Settings */}
        <Link
          href="/settings"
          className={cn(
            "flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition-all",
            pathname === "/settings"
              ? "text-yellow-400 font-bold"
              : "text-slate-400 hover:text-slate-200"
          )}
        >
          <Settings className="w-5 h-5" />
          <span className="text-[10px]">Settings</span>
        </Link>
      </nav>
    </>
  );
};