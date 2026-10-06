"use client";

import React from "react";
import { RefreshCw, ExternalLink, Menu } from "lucide-react";

interface HeaderProps {
  title: string;
  subtitle?: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  onMenuToggle?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  onRefresh,
  isRefreshing = false,
  onMenuToggle,
}) => {
  return (
    <header className="h-16 border-b border-slate-200/90 bg-white/90 backdrop-blur-xl px-4 sm:px-6 lg:px-8 flex items-center justify-between sticky top-0 z-30 shadow-sm">
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
        {onMenuToggle && (
          <button
            type="button"
            onClick={onMenuToggle}
            className="lg:hidden p-2 -ml-1 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors shrink-0"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="min-w-0">
          <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2 truncate">
            {title}
          </h1>
          {subtitle && (
            <p className="text-[11px] sm:text-xs text-slate-500 truncate hidden xs:block">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <div className="hidden lg:flex items-center gap-2 text-xs">
          <a
            href="http://localhost:3000"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 text-slate-700 hover:text-yellow-600 hover:bg-slate-100 border border-slate-200 transition-all font-medium"
          >
            <span>Franchise Portal</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </a>
          <a
            href="http://localhost:3001"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 text-slate-700 hover:text-emerald-600 hover:bg-slate-100 border border-slate-200 transition-all font-medium"
          >
            <span>Vendor Portal</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </a>
        </div>

        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 shadow-sm transition-all disabled:opacity-50"
            title="Refresh Leads Data"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-yellow-500 ${
                isRefreshing ? "animate-spin" : ""
              }`}
            />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        )}

        <div className="flex items-center gap-2 sm:gap-2.5 pl-2 border-l border-slate-200">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-yellow-400 text-slate-950 font-bold text-xs flex items-center justify-center shadow-sm shrink-0">
            AD
          </div>
          <div className="hidden md:block text-left">
            <p className="text-xs font-semibold text-slate-900 leading-tight">Admin Ops</p>
            <p className="text-[10px] text-slate-500">Headquarters</p>
          </div>
        </div>
      </div>
    </header>
  );
};
