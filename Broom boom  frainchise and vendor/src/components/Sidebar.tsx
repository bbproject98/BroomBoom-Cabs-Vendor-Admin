"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
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
  franchiseCount?: number;
  vendorCount?: number;
  vendorSubCount?: number;
  pendingTicketCount?: number;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  franchiseCount = 0,
  vendorCount = 0,
  vendorSubCount = 0,
  pendingTicketCount = 0,
  isOpenMobile = false,
  onCloseMobile,
}) => {
  const pathname = usePathname();
  const isVendorActive = pathname?.startsWith("/vendor");
  const [vendorOpen, setVendorOpen] = useState(true);
  const [isTicketsTab, setIsTicketsTab] = useState(false);

  useEffect(() => {
    if (isVendorActive) {
      setVendorOpen(true);
    }
    if (typeof window !== "undefined") {
      setIsTicketsTab(pathname === "/vendor" && window.location.search.includes("tab=tickets"));
    }
  }, [pathname, isVendorActive]);

  // Close mobile drawer on route change
  useEffect(() => {
    onCloseMobile?.();
  }, [pathname]);

  const renderNavLinks = (isMobileDrawer = false) => (
    <nav className="p-4 space-y-2">
      <div className="px-3 pb-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
        Management Hub
      </div>

      {/* Dashboard */}
      <Link
        href="/"
        onClick={() => isMobileDrawer && onCloseMobile?.()}
        className={cn(
          "flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group",
          pathname === "/"
            ? "bg-yellow-400 text-slate-950 font-bold shadow-sm shadow-yellow-400/20"
            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
        )}
      >
        <div className="flex items-center gap-3">
          <LayoutDashboard
            className={cn(
              "w-4 h-4 transition-colors",
              pathname === "/"
                ? "text-slate-950"
                : "text-slate-400 group-hover:text-yellow-600"
            )}
          />
          <span>Dashboard</span>
        </div>
      </Link>

      {/* Franchise Leads */}
      <Link
        href="/franchise"
        onClick={() => isMobileDrawer && onCloseMobile?.()}
        className={cn(
          "flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group",
          pathname === "/franchise"
            ? "bg-yellow-400 text-slate-950 font-bold shadow-sm shadow-yellow-400/20"
            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
        )}
      >
        <div className="flex items-center gap-3">
          <Building2
            className={cn(
              "w-4 h-4 transition-colors",
              pathname === "/franchise"
                ? "text-slate-950"
                : "text-slate-400 group-hover:text-yellow-600"
            )}
          />
          <span>Franchise Leads</span>
        </div>

        {franchiseCount > 0 && (
          <span
            className={cn(
              "px-2 py-0.5 text-xs font-bold rounded-full",
              pathname === "/franchise"
                ? "bg-slate-950 text-yellow-400"
                : "bg-yellow-100 text-yellow-800 border border-yellow-200"
            )}
          >
            {franchiseCount}
          </span>
        )}
      </Link>

      {/* Vendor Dropdown */}
      <div className="space-y-1">
        <button
          type="button"
          onClick={() => setVendorOpen((prev) => !prev)}
          className={cn(
            "w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group",
            isVendorActive && !vendorOpen
              ? "bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          )}
        >
          <div className="flex items-center gap-3">
            <Car
              className={cn(
                "w-4 h-4 transition-colors",
                isVendorActive
                  ? "text-emerald-600"
                  : "text-slate-400 group-hover:text-emerald-600"
              )}
            />
            <span>Vendor</span>
          </div>

          <div className="flex items-center gap-2">
            {vendorCount > 0 && (
              <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
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
          <div className="pl-6 pr-1 py-1 space-y-1 animate-in slide-in-from-top-1 duration-150 border-l-2 border-slate-200 ml-4">
            {/* Vendor Leads */}
            <Link
              href="/vendor"
              onClick={() => isMobileDrawer && onCloseMobile?.()}
              className={cn(
                "flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all group",
                pathname === "/vendor" && !isTicketsTab
                  ? "bg-emerald-500 text-slate-950 font-bold shadow-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
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
                    pathname === "/vendor" && !isTicketsTab
                      ? "bg-slate-950 text-emerald-400"
                      : "text-emerald-600 bg-emerald-50"
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
                  ? "bg-emerald-500 text-slate-950 font-bold shadow-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
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
                      : "text-emerald-600 bg-emerald-50"
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
                isTicketsTab
                  ? "bg-amber-400 text-slate-950 font-bold shadow-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
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
            ? "bg-yellow-400 text-slate-950 font-bold shadow-sm shadow-yellow-400/20"
            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
        )}
      >
        <div className="flex items-center gap-3">
          <Settings
            className={cn(
              "w-4 h-4 transition-colors",
              pathname === "/settings"
                ? "text-slate-950"
                : "text-slate-400 group-hover:text-yellow-600"
            )}
          />
          <span>Settings & DB</span>
        </div>
      </Link>
    </nav>
  );

  const renderDbStatus = () => (
    <div className="p-4 m-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-slate-600 font-semibold">Database Status</span>
        <span className="inline-flex items-center gap-1.5 text-emerald-700 font-semibold text-[11px] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Online
        </span>
      </div>
      <p className="text-[11px] text-slate-500 leading-relaxed">
        PostgreSQL port 5432 connected. Unified tables active.
      </p>
    </div>
  );

  return (
    <>
      {/* ========================================================= */}
      {/* 1. DESKTOP PERMANENT SIDEBAR (Hidden on < lg screens) */}
      {/* ========================================================= */}
      <aside className="hidden lg:flex w-64 bg-white border-r border-slate-200 flex-col justify-between shrink-0 h-screen sticky top-0 z-30 shadow-sm">
        <div>
          {/* Brand Header */}
          <div className="h-16 px-6 flex items-center gap-3 border-b border-slate-200">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-yellow-500 to-amber-400 flex items-center justify-center font-black text-slate-950 text-xl shadow-sm">
              BB
            </div>
            <div>
              <div className="flex items-center gap-1.5 font-bold text-slate-900 tracking-tight">
                <span>BroomBoom</span>
                <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-yellow-100 text-yellow-800 border border-yellow-200 font-semibold">
                  Admin
                </span>
              </div>
              <p className="text-[11px] text-slate-500">Ops Management HQ</p>
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
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={onCloseMobile}
          />

          {/* Drawer container */}
          <div className="relative w-72 max-w-[85vw] bg-white border-r border-slate-200 flex flex-col justify-between h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            <div>
              {/* Drawer Brand Header with Close Button */}
              <div className="h-16 px-5 flex items-center justify-between border-b border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-yellow-500 to-amber-400 flex items-center justify-center font-black text-slate-950 text-lg shadow-sm">
                    BB
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 font-bold text-slate-900 text-sm">
                      <span>BroomBoom</span>
                      <span className="text-[9px] uppercase px-1.5 py-0.2 rounded-full bg-yellow-100 text-yellow-800 border border-yellow-200 font-semibold">
                        Admin
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500">Ops HQ</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onCloseMobile}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
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
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-slate-200 px-3 py-2 flex items-center justify-around shadow-lg">
        {/* Dashboard */}
        <Link
          href="/"
          className={cn(
            "flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition-all",
            pathname === "/"
              ? "text-yellow-600 font-bold"
              : "text-slate-500 hover:text-slate-800"
          )}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px]">Home</span>
        </Link>

        {/* Franchise */}
        <Link
          href="/franchise"
          className={cn(
            "flex flex-col items-center gap-1 py-1 px-2 rounded-xl relative transition-all",
            pathname === "/franchise"
              ? "text-yellow-600 font-bold"
              : "text-slate-500 hover:text-slate-800"
          )}
        >
          <div className="relative">
            <Building2 className="w-5 h-5" />
            {franchiseCount > 0 && (
              <span className="absolute -top-1.5 -right-2 px-1 py-0.2 min-w-[14px] text-center text-[9px] font-bold rounded-full bg-yellow-400 text-slate-950">
                {franchiseCount > 99 ? "99+" : franchiseCount}
              </span>
            )}
          </div>
          <span className="text-[10px]">Franchise</span>
        </Link>

        {/* Vendor Leads */}
        <Link
          href="/vendor"
          className={cn(
            "flex flex-col items-center gap-1 py-1 px-2 rounded-xl relative transition-all",
            pathname === "/vendor" && !isTicketsTab
              ? "text-emerald-600 font-bold"
              : "text-slate-500 hover:text-slate-800"
          )}
        >
          <div className="relative">
            <Users className="w-5 h-5" />
            {vendorCount > 0 && (
              <span className="absolute -top-1.5 -right-2 px-1 py-0.2 min-w-[14px] text-center text-[9px] font-bold rounded-full bg-emerald-500 text-white">
                {vendorCount > 99 ? "99+" : vendorCount}
              </span>
            )}
          </div>
          <span className="text-[10px]">Vendors</span>
        </Link>

        {/* Subscriptions */}
        <Link
          href="/vendor/subscriptions"
          className={cn(
            "flex flex-col items-center gap-1 py-1 px-2 rounded-xl relative transition-all",
            pathname === "/vendor/subscriptions"
              ? "text-blue-600 font-bold"
              : "text-slate-500 hover:text-slate-800"
          )}
        >
          <div className="relative">
            <CreditCard className="w-5 h-5" />
            {vendorSubCount > 0 && (
              <span className="absolute -top-1.5 -right-2 px-1 py-0.2 min-w-[14px] text-center text-[9px] font-bold rounded-full bg-blue-500 text-white">
                {vendorSubCount > 99 ? "99+" : vendorSubCount}
              </span>
            )}
          </div>
          <span className="text-[10px]">Subs</span>
        </Link>

        {/* Tickets */}
        <Link
          href="/vendor?tab=tickets"
          className={cn(
            "flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl relative transition-all",
            isTicketsTab
              ? "text-amber-600 font-bold"
              : "text-slate-500 hover:text-slate-800"
          )}
        >
          <div className="relative">
            <Ticket className="w-5 h-5" />
            {pendingTicketCount > 0 && (
              <span className="absolute -top-1.5 -right-2 px-1 py-0.2 min-w-[14px] text-center text-[9px] font-bold rounded-full bg-amber-500 text-white animate-pulse">
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
              ? "text-yellow-600 font-bold"
              : "text-slate-500 hover:text-slate-800"
          )}
        >
          <Settings className="w-5 h-5" />
          <span className="text-[10px]">Settings</span>
        </Link>
      </nav>
    </>
  );
};