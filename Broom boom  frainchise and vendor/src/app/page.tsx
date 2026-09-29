"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import {
  Car,
  Users,
  CheckCircle,
  ArrowUpRight,
  MapPin,
  FileSpreadsheet,
  CreditCard,
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

  const vendorTotal = stats?.vendor?.total ?? 0;
  const vendorApproved = stats?.vendor?.approved ?? 0;
  const vendorGold = stats?.vendor?.gold ?? 0;
  const vendorPlatinum = stats?.vendor?.platinum ?? 0;

  const subscriptionTotal = stats?.subscriptions?.total ?? 0;

  return (
    <div className="flex w-full min-h-screen bg-slate-950">
      <Sidebar
        vendorCount={stats?.vendor?.total}
        vendorSubCount={stats?.subscriptions?.total}
        pendingTicketCount={stats?.tickets?.pending}
        isOpenMobile={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      <main className="flex-1 flex flex-col min-w-0">
        <Header
          title="Vendor Command Overview"
          subtitle="Real-time overview of BroomBoom Vendor operations"
          onRefresh={fetchStats}
          isRefreshing={refreshing}
          onMenuToggle={() => setMobileMenuOpen(true)}
        />

        <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 overflow-y-auto pb-24 lg:pb-8">
          {/* ========================================================= */}
          {/* TOP METRIC CARDS */}
          {/* ========================================================= */}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
            {/* Total Vendor Leads */}
            <Link
              href="/vendor"
              className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-900/60 border border-slate-800 hover:border-emerald-400/40 relative overflow-hidden shadow-lg transition-all group"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Car className="w-3.5 h-3.5" />
                  <span>Vendor Leads</span>
                </span>

                <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-colors" />
              </div>

              <div className="text-2xl sm:text-3xl font-black text-white">
                {loading ? "—" : vendorTotal}
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-2 text-xs text-slate-400">
                <span>
                  Gold:{" "}
                  <strong className="text-white">
                    {vendorGold}
                  </strong>
                </span>

                <span>
                  Platinum:{" "}
                  <strong className="text-white">
                    {vendorPlatinum}
                  </strong>
                </span>

                <span>
                  Approved:{" "}
                  <strong className="text-emerald-400">
                    {vendorApproved}
                  </strong>
                </span>
              </div>
            </Link>

            {/* Approved Vendors */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-900/60 border border-slate-800 relative overflow-hidden shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Approved Vendors
                </span>

                <div className="w-8 h-8 rounded-xl bg-emerald-400/10 border border-emerald-400/30 text-emerald-400 flex items-center justify-center">
                  <CheckCircle className="w-4 h-4" />
                </div>
              </div>

              <div className="text-3xl font-black text-white">
                {loading ? "—" : vendorApproved}
              </div>

              <p className="text-xs text-slate-400 mt-2">
                <span className="text-emerald-400 font-semibold">
                  {vendorApproved}
                </span>{" "}
                vendor applications approved
              </p>
            </div>

            {/* Subscriptions */}
            <Link
              href="/vendor/subscriptions"
              className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-900/60 border border-slate-800 hover:border-blue-400/40 relative overflow-hidden shadow-lg transition-all group"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Subscriptions</span>
                </span>

                <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-blue-400 transition-colors" />
              </div>

              <div className="text-3xl font-black text-white">
                {loading ? "—" : subscriptionTotal}
              </div>

              <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                <span>
                  Active:{" "}
                  <strong className="text-emerald-400">
                    {stats?.subscriptions?.active ?? 0}
                  </strong>
                </span>

                <span>
                  Pending:{" "}
                  <strong className="text-amber-400">
                    {stats?.subscriptions?.pending ?? 0}
                  </strong>
                </span>
              </div>
            </Link>

            {/* Plan Tickets */}
            <Link
              href="/vendor?tab=tickets"
              className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-900/60 border border-slate-800 hover:border-amber-400/40 relative overflow-hidden shadow-lg transition-all group"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span>Plan Tickets</span>
                </span>

                <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition-colors" />
              </div>

              <div className="text-3xl font-black text-white">
                {loading ? "—" : stats?.tickets?.pending ?? 0}
              </div>

              <p className="text-xs text-slate-400 mt-2">
                <span className="text-amber-400 font-semibold">
                  {stats?.tickets?.pending ?? 0}
                </span>{" "}
                pending plan-change tickets
              </p>
            </Link>
          </div>

          {/* ========================================================= */}
          {/* VENDOR MANAGEMENT CARDS */}
          {/* ========================================================= */}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {/* Vendor Leads */}
            <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-slate-900 to-slate-900 border border-emerald-500/20 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-400 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-emerald-500/20">
                    <Car className="w-6 h-6" />
                  </div>

                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                    {vendorTotal} Leads
                  </span>
                </div>

                <h3 className="text-lg font-bold text-white mb-1">
                  Vendor Leads Desk
                </h3>

                <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                  Review incoming vehicle attachment and fleet partner
                  applications before payment and territory licensing.
                </p>
              </div>

              <div className="flex items-center gap-2.5 sm:gap-3">
                <Link
                  href="/vendor"
                  className="flex-1 text-center py-2.5 px-4 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs shadow-md transition-all"
                >
                  Open Vendor Desk →
                </Link>

                <a
                  href="/api/export?type=vendor"
                  className="py-2.5 px-3.5 sm:px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-700 transition-all flex items-center gap-1.5"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>CSV</span>
                </a>
              </div>
            </div>

            {/* Subscriptions */}
            <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-blue-500/10 via-slate-900 to-slate-900 border border-blue-500/20 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-500 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-blue-500/20">
                    <CreditCard className="w-6 h-6" />
                  </div>

                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-400/20 text-blue-300 border border-blue-400/30">
                    {subscriptionTotal} Subscriptions
                  </span>
                </div>

                <h3 className="text-lg font-bold text-white mb-1">
                  Vendor Subscriptions Desk
                </h3>

                <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                  Track paid partner licenses, Cashfree transaction receipts,
                  exclusivity zones, and subscription validity periods.
                </p>
              </div>

              <div className="flex items-center gap-2.5 sm:gap-3">
                <Link
                  href="/vendor/subscriptions"
                  className="flex-1 text-center py-2.5 px-4 rounded-xl bg-blue-500 hover:bg-blue-400 text-slate-950 font-bold text-xs shadow-md transition-all"
                >
                  Open Subscriptions Desk →
                </Link>

                <a
                  href="/api/export?type=subscriptions"
                  className="py-2.5 px-3.5 sm:px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-700 transition-all flex items-center gap-1.5"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>CSV</span>
                </a>
              </div>
            </div>

            {/* Plan Change Tickets */}
            <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-amber-500/10 via-slate-900 to-slate-900 border border-amber-500/20 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-amber-500/20">
                    <Users className="w-6 h-6" />
                  </div>

                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                    {stats?.tickets?.pending ?? 0} Pending
                  </span>
                </div>

                <h3 className="text-lg font-bold text-white mb-1">
                  Plan Change Tickets
                </h3>

                <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                  Review vendor upgrade and plan-change requests and process
                  pending payment confirmations.
                </p>
              </div>

              <div className="flex items-center gap-2.5 sm:gap-3">
                <Link
                  href="/vendor?tab=tickets"
                  className="flex-1 text-center py-2.5 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs shadow-md transition-all"
                >
                  Open Tickets →
                </Link>

                <span className="py-2.5 px-3.5 sm:px-4 rounded-xl bg-slate-800 text-slate-400 font-semibold text-xs border border-slate-700">
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
            <div className="lg:col-span-2 p-5 sm:p-6 rounded-2xl bg-slate-900 border border-slate-800">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Recent Vendor Activity
                  </h3>

                  <p className="text-xs text-slate-400">
                    Incoming applications from the Vendor portal
                  </p>
                </div>

                <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Live Feed
                </span>
              </div>

              <div className="divide-y divide-slate-800/80">
                {stats?.recentActivity &&
                stats.recentActivity.length > 0 ? (
                  stats.recentActivity.map((act) => (
                    <div
                      key={act.id + act.timestamp}
                      className="py-3.5 flex items-center justify-between gap-3 sm:gap-4 group"
                    >
                      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 bg-emerald-400/10 text-emerald-400 border border-emerald-400/20">
                          <Car className="w-4 h-4" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-white group-hover:text-emerald-400 transition-colors truncate">
                            {act.title}
                          </p>

                          <p className="text-[11px] text-slate-400 truncate">
                            {act.subtitle}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider mb-1 ${
                            act.status === "approved"
                              ? "bg-emerald-500/20 text-emerald-400"
                              : act.status === "contacted"
                              ? "bg-amber-500/20 text-amber-400"
                              : "bg-blue-500/20 text-blue-400"
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
                    No vendor activities recorded yet.
                  </div>
                )}
              </div>
            </div>

            {/* Top Cities */}
            <div className="p-5 sm:p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-sm font-bold text-white">
                    Top Vendor Cities
                  </h3>

                  <MapPin className="w-4 h-4 text-yellow-400" />
                </div>

                <div className="space-y-4">
                  {stats?.topCities && stats.topCities.length > 0 ? (
                    stats.topCities.map((c, i) => {
                      const total = vendorTotal || 1;
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
                            <span className="text-slate-200">
                              {i + 1}. {c.city}
                            </span>

                            <span className="text-slate-400 font-semibold">
                              {c.count} leads ({pct}%)
                            </span>
                          </div>

                          <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
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

              <div className="pt-6 mt-6 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                <span>Vendor Coverage</span>

                <span className="text-yellow-400 font-semibold">
                  Pan India Network
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}