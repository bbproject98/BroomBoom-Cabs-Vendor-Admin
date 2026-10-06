"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import {
  Car,
  Building2,
  Users,
  CheckCircle,
  ArrowUpRight,
  MapPin,
  FileSpreadsheet,
  CreditCard,
  Ticket,
} from "lucide-react";
import { DashboardStats } from "@/types";
import { formatTimeAgo } from "@/lib/utils";

type DashboardStatsWithTickets = DashboardStats & {
  tickets?: {
    pending?: number;
    total?: number;
  };
};

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStatsWithTickets | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const fetchStats = async () => {
    try {
      setRefreshing(true);

      const res = await fetch("/api/stats", {
        cache: "no-store",
      });

      const data = await res.json();

      if (data.success) {
        setStats(data.stats);
      } else {
        console.error("Failed to load stats:", data.error);
      }
    } catch (e) {
      console.error("Failed to load stats:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const franchiseTotal = stats?.franchise?.total ?? 0;
  const franchiseNewToday = stats?.franchise?.newToday ?? 0;
  const franchiseApproved = stats?.franchise?.approved ?? 0;

  const vendorTotal = stats?.vendor?.total ?? 0;
  const vendorGold = stats?.vendor?.gold ?? 0;
  const vendorPlatinum = stats?.vendor?.platinum ?? 0;
  const vendorApproved = stats?.vendor?.approved ?? 0;

  const subscriptionTotal = stats?.subscriptions?.total ?? 0;

  return (
    <div className="flex w-full min-h-screen bg-slate-50 text-slate-900">
      <Sidebar
        franchiseCount={franchiseTotal}
        vendorCount={vendorTotal}
        vendorSubCount={subscriptionTotal}
        pendingTicketCount={stats?.tickets?.pending ?? 0}
        isOpenMobile={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      <main className="flex-1 flex flex-col min-w-0">
        <Header
          title="BroomBoom Admin HQ"
          subtitle="Unified operations desk for Franchise & Vendor networks"
          onRefresh={fetchStats}
          isRefreshing={refreshing}
          onMenuToggle={() => setMobileMenuOpen(true)}
        />

        <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 overflow-y-auto pb-24 lg:pb-8">
          {/* ========================================================= */}
          {/* TOP METRIC CARDS */}
          {/* ========================================================= */}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
            {/* Franchise Inquiries */}
            <Link
              href="/franchise"
              className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 hover:border-yellow-400 hover:shadow-md relative overflow-hidden shadow-sm transition-all group"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-yellow-700 uppercase tracking-wider flex items-center gap-1.5 bg-yellow-50 px-2 py-0.5 rounded-md border border-yellow-200">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Franchise Leads</span>
                </span>

                <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-yellow-600 transition-colors" />
              </div>

              <div className="text-2xl sm:text-3xl font-black text-slate-900">
                {loading ? "—" : franchiseTotal}
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-2 text-xs text-slate-600">
                <span>
                  New:{" "}
                  <strong className="text-yellow-700 font-bold">
                    {franchiseNewToday}
                  </strong>
                </span>

                <span>
                  Approved:{" "}
                  <strong className="text-emerald-700 font-bold">
                    {franchiseApproved}
                  </strong>
                </span>
              </div>
            </Link>

            {/* Total Vendor Leads */}
            <Link
              href="/vendor"
              className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 hover:border-emerald-400 hover:shadow-md relative overflow-hidden shadow-sm transition-all group"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  <Car className="w-3.5 h-3.5" />
                  <span>Vendor Leads</span>
                </span>

                <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-colors" />
              </div>

              <div className="text-2xl sm:text-3xl font-black text-slate-900">
                {loading ? "—" : vendorTotal}
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-2 text-xs text-slate-600">
                <span>
                  Gold:{" "}
                  <strong className="text-slate-800 font-semibold">
                    {vendorGold}
                  </strong>
                </span>

                <span>
                  Platinum:{" "}
                  <strong className="text-slate-800 font-semibold">
                    {vendorPlatinum}
                  </strong>
                </span>

                <span>
                  Approved:{" "}
                  <strong className="text-emerald-700 font-bold">
                    {vendorApproved}
                  </strong>
                </span>
              </div>
            </Link>

            {/* Subscriptions */}
            <Link
              href="/vendor/subscriptions"
              className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 hover:border-blue-400 hover:shadow-md relative overflow-hidden shadow-sm transition-all group"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-blue-800 uppercase tracking-wider flex items-center gap-1.5 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Subscriptions</span>
                </span>

                <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
              </div>

              <div className="text-2xl sm:text-3xl font-black text-slate-900">
                {loading ? "—" : subscriptionTotal}
              </div>

              <div className="flex items-center gap-3 mt-2 text-xs text-slate-600">
                <span>
                  Active:{" "}
                  <strong className="text-emerald-700 font-bold">
                    {stats?.subscriptions?.active ?? 0}
                  </strong>
                </span>

                <span>
                  Pending:{" "}
                  <strong className="text-amber-700 font-bold">
                    {stats?.subscriptions?.pending ?? 0}
                  </strong>
                </span>
              </div>
            </Link>

            {/* Plan Tickets */}
            <Link
              href="/vendor?tab=tickets"
              className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 hover:border-amber-400 hover:shadow-md relative overflow-hidden shadow-sm transition-all group"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                  <Ticket className="w-3.5 h-3.5" />
                  <span>Plan Tickets</span>
                </span>

                <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 transition-colors" />
              </div>

              <div className="text-2xl sm:text-3xl font-black text-slate-900">
                {loading ? "—" : stats?.tickets?.pending ?? 0}
              </div>

              <p className="text-xs text-slate-600 mt-2">
                <span className="text-amber-700 font-bold">
                  {stats?.tickets?.pending ?? 0}
                </span>{" "}
                pending plan-change tickets
              </p>
            </Link>
          </div>

          {/* ========================================================= */}
          {/* FRANCHISE & VENDOR MANAGEMENT CARDS */}
          {/* ========================================================= */}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {/* Franchise Leads Desk */}
            <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-yellow-400 text-slate-950 flex items-center justify-center font-black shadow-sm">
                    <Building2 className="w-6 h-6" />
                  </div>

                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-800 border border-yellow-200">
                    {franchiseTotal} Inquiries
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900 mb-1">
                  Franchise Desk
                </h3>

                <p className="text-xs text-slate-600 mb-6 leading-relaxed">
                  Review direct inquiries for territory hubs, kiosks, and regional master franchises.
                </p>
              </div>

              <div className="flex items-center gap-2.5 sm:gap-3">
                <Link
                  href="/franchise"
                  className="flex-1 text-center py-2.5 px-4 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-bold text-xs shadow-sm transition-all"
                >
                  Open Franchise Desk →
                </Link>

                <a
                  href="/api/export?type=franchise"
                  className="py-2.5 px-3.5 sm:px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs border border-slate-200 transition-all flex items-center gap-1.5"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-yellow-600" />
                  <span>CSV</span>
                </a>
              </div>
            </div>

            {/* Vendor Leads */}
            <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-black shadow-sm">
                    <Car className="w-6 h-6" />
                  </div>

                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    {vendorTotal} Leads
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900 mb-1">
                  Vendor Leads Desk
                </h3>

                <p className="text-xs text-slate-600 mb-6 leading-relaxed">
                  Review incoming vehicle attachment and fleet partner
                  applications before payment and territory licensing.
                </p>
              </div>

              <div className="flex items-center gap-2.5 sm:gap-3">
                <Link
                  href="/vendor"
                  className="flex-1 text-center py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-sm transition-all"
                >
                  Open Vendor Desk →
                </Link>

                <a
                  href="/api/export?type=vendor"
                  className="py-2.5 px-3.5 sm:px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs border border-slate-200 transition-all flex items-center gap-1.5"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  <span>CSV</span>
                </a>
              </div>
            </div>

            {/* Subscriptions */}
            <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-500 text-white flex items-center justify-center font-black shadow-sm">
                    <CreditCard className="w-6 h-6" />
                  </div>

                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
                    {subscriptionTotal} Subscriptions
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900 mb-1">
                  Vendor Subscriptions Desk
                </h3>

                <p className="text-xs text-slate-600 mb-6 leading-relaxed">
                  Track paid partner licenses, Cashfree transaction receipts,
                  exclusivity zones, and subscription validity periods.
                </p>
              </div>

              <div className="flex items-center gap-2.5 sm:gap-3">
                <Link
                  href="/vendor/subscriptions"
                  className="flex-1 text-center py-2.5 px-4 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-bold text-xs shadow-sm transition-all"
                >
                  Open Subscriptions Desk →
                </Link>

                <a
                  href="/api/export?type=subscriptions"
                  className="py-2.5 px-3.5 sm:px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs border border-slate-200 transition-all flex items-center gap-1.5"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600" />
                  <span>CSV</span>
                </a>
              </div>
            </div>

            {/* Plan Change Tickets */}
            <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-sm">
                    <Users className="w-6 h-6" />
                  </div>

                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                    {stats?.tickets?.pending ?? 0} Pending
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900 mb-1">
                  Plan Change Tickets
                </h3>

                <p className="text-xs text-slate-600 mb-6 leading-relaxed">
                  Review vendor upgrade and plan-change requests and process
                  pending payment confirmations.
                </p>
              </div>

              <div className="flex items-center gap-2.5 sm:gap-3">
                <Link
                  href="/vendor?tab=tickets"
                  className="flex-1 text-center py-2.5 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs shadow-sm transition-all"
                >
                  Open Tickets →
                </Link>

                <span className="py-2.5 px-3.5 sm:px-4 rounded-xl bg-slate-100 text-slate-700 font-semibold text-xs border border-slate-200">
                  {stats?.tickets?.total ?? 0} Total
                </span>
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* RECENT ACTIVITY + TOP CITIES */}
          {/* ========================================================= */}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Recent Activity */}
            <div className="lg:col-span-2 p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Recent Activity (Franchise & Vendor)
                  </h3>

                  <p className="text-xs text-slate-500">
                    Incoming applications from both portals
                  </p>
                </div>

                <span className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Live Feed
                </span>
              </div>

              <div className="divide-y divide-slate-100">
                {stats?.recentActivity &&
                stats.recentActivity.length > 0 ? (
                  stats.recentActivity.map((act) => (
                    <div
                      key={act.id + act.timestamp}
                      className="py-3.5 flex items-center justify-between gap-3 sm:gap-4 group hover:bg-slate-50/60 -mx-2 px-2 rounded-xl transition-colors"
                    >
                      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                        <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                          act.type === "franchise"
                            ? "bg-yellow-100 text-yellow-800 border border-yellow-200"
                            : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                        }`}>
                          {act.type === "franchise" ? <Building2 className="w-4 h-4" /> : <Car className="w-4 h-4" />}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-slate-900 group-hover:text-yellow-700 transition-colors truncate">
                            {act.title}
                          </p>

                          <p className="text-[11px] text-slate-500 truncate">
                            {act.subtitle}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider mb-1 ${
                            act.status === "approved"
                              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                              : act.status === "contacted"
                              ? "bg-amber-50 text-amber-800 border border-amber-200"
                              : "bg-blue-50 text-blue-800 border border-blue-200"
                          }`}
                        >
                          {act.status}
                        </span>

                        <p className="text-[10px] text-slate-500">
                          {formatTimeAgo(act.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-xs text-slate-500">
                    No activities recorded yet.
                  </div>
                )}
              </div>
            </div>

            {/* Top Cities */}
            <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-sm font-bold text-slate-900">
                    Top Network Cities
                  </h3>

                  <MapPin className="w-4 h-4 text-yellow-500" />
                </div>

                <div className="space-y-4">
                  {stats?.topCities && stats.topCities.length > 0 ? (
                    stats.topCities.map((c, i) => {
                      const total = (franchiseTotal + vendorTotal) || 1;
                      const pct = Math.min(
                        100,
                        Math.round((c.count / total) * 100)
                      );

                      return (
                        <div
                          key={c.city}
                          className="space-y-1.5 text-xs"
                        >
                          <div className="flex items-center justify-between font-medium">
                            <span className="text-slate-800 font-semibold">
                              {i + 1}. {c.city}
                            </span>

                            <span className="text-slate-500">
                              {c.count} leads ({pct}%)
                            </span>
                          </div>

                          <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-yellow-400 to-amber-500"
                              style={{
                                width: `${pct}%`,
                              }}
                            />
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-xs text-slate-500">
                      Loading cities...
                    </p>
                  )}
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
                <span>Coverage</span>

                <span className="text-yellow-700 font-bold">
                  Pan India Operations
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}