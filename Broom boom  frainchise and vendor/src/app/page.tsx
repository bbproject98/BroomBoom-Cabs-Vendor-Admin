"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import {
  Building2,
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

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      setRefreshing(true);
      const res = await fetch("/api/stats");
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
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

  return (
    <div className="flex w-full min-h-screen bg-slate-950">
      <Sidebar
        franchiseCount={stats?.franchise.total}
        vendorCount={stats?.vendor.total}
        vendorSubCount={stats?.subscriptions?.total}
      />

      <main className="flex-1 flex flex-col min-w-0">
        <Header
          title="Command Overview"
          subtitle="Real-time aggregation across Franchise & Vendor operations"
          onRefresh={fetchStats}
          isRefreshing={refreshing}
        />

        <div className="p-8 space-y-8 overflow-y-auto">
          {/* Top Aggregated Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-900/60 border border-slate-800 relative overflow-hidden shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Total Leads
                </span>
                <div className="w-8 h-8 rounded-xl bg-yellow-400/10 border border-yellow-400/30 text-yellow-400 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-black text-white">
                {stats?.combined.totalLeads ?? "—"}
              </div>
              <p className="text-xs text-slate-400 mt-2 flex items-center gap-1.5">
                <span className="text-emerald-400 font-semibold">
                  +{stats?.combined.totalNewToday ?? 0}
                </span>{" "}
                new today across all channels
              </p>
            </div>

            <Link
              href="/franchise"
              className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-900/60 border border-slate-800 hover:border-yellow-400/40 relative overflow-hidden shadow-lg transition-all group"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-yellow-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Franchise Leads</span>
                </span>
                <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-yellow-400 transition-colors" />
              </div>
              <div className="text-3xl font-black text-white">
                {stats?.franchise.total ?? "—"}
              </div>
              <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                <span>
                  Gold: <strong className="text-white">{stats?.franchise.gold ?? 0}</strong>
                </span>
                <span>
                  Plat: <strong className="text-white">{stats?.franchise.platinum ?? 0}</strong>
                </span>
                <span>
                  Approved: <strong className="text-emerald-400">{stats?.franchise.approved ?? 0}</strong>
                </span>
              </div>
            </Link>

            <Link
              href="/vendor"
              className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-900/60 border border-slate-800 hover:border-emerald-400/40 relative overflow-hidden shadow-lg transition-all group"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Car className="w-3.5 h-3.5" />
                  <span>Vendor Leads</span>
                </span>
                <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-colors" />
              </div>
              <div className="text-3xl font-black text-white">
                {stats?.vendor.total ?? "—"}
              </div>
              <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                <span>
                  Fleet: <strong className="text-white">{stats?.vendor.gold ?? 0}</strong>
                </span>
                <span>
                  Regional: <strong className="text-white">{stats?.vendor.platinum ?? 0}</strong>
                </span>
                <span>
                  Active: <strong className="text-emerald-400">{stats?.vendor.approved ?? 0}</strong>
                </span>
              </div>
            </Link>

            <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-900/60 border border-slate-800 relative overflow-hidden shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Total Approved
                </span>
                <div className="w-8 h-8 rounded-xl bg-emerald-400/10 border border-emerald-400/30 text-emerald-400 flex items-center justify-center">
                  <CheckCircle className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-black text-white">
                {stats?.combined.totalApproved ?? "—"}
              </div>
              <p className="text-xs text-slate-400 mt-2">
                <span className="text-amber-400 font-semibold">{stats?.combined.totalContacted ?? 0}</span> currently in active follow-up
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-gradient-to-br from-yellow-500/10 via-slate-900 to-slate-900 border border-yellow-500/20 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-yellow-400 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-yellow-500/20">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-yellow-400/20 text-yellow-300 border border-yellow-400/30">
                    {stats?.franchise.total ?? 0} Leads
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mb-1">
                  Franchise Leads Desk
                </h3>
                <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                  Manage inquiries from entrepreneurs seeking District Exclusive Hubs (Gold),
                  Booking Kiosks (Silver), and Regional Master Franchises (Platinum).
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  href="/franchise"
                  className="flex-1 text-center py-2.5 px-4 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-bold text-xs shadow-md transition-all"
                >
                  Open Franchise Desk →
                </Link>
                <a
                  href="/api/export?type=franchise"
                  className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-700 transition-all flex items-center gap-1.5"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>CSV</span>
                </a>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-slate-900 to-slate-900 border border-emerald-500/20 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-400 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-emerald-500/20">
                    <Car className="w-6 h-6" />
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                    {stats?.vendor.total ?? 0} Inquiries
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mb-1">
                  Vendor Leads Desk
                </h3>
                <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                  Review incoming vehicle attachment and fleet partner applications before
                  payment and territory licensing.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  href="/vendor"
                  className="flex-1 text-center py-2.5 px-4 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs shadow-md transition-all"
                >
                  Open Vendor Desk →
                </Link>
                <a
                  href="/api/export?type=vendor"
                  className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-700 transition-all flex items-center gap-1.5"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>CSV</span>
                </a>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-500/10 via-slate-900 to-slate-900 border border-blue-500/20 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-500 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-blue-500/20">
                    <CreditCard className="w-6 h-6" />
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-400/20 text-blue-300 border border-blue-400/30">
                    {stats?.subscriptions?.total ?? 0} Subscriptions
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mb-1">
                  Vendor Subscriptions Desk
                </h3>
                <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                  Track paid partner licenses, Cashfree transaction receipts, exclusivity zones,
                  and subscription validity periods.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  href="/vendor/subscriptions"
                  className="flex-1 text-center py-2.5 px-4 rounded-xl bg-blue-500 hover:bg-blue-400 text-slate-950 font-bold text-xs shadow-md transition-all"
                >
                  Open Subscriptions Desk →
                </Link>
                <a
                  href="/api/export?type=subscriptions"
                  className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-700 transition-all flex items-center gap-1.5"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>CSV</span>
                </a>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900 border border-slate-800">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-sm font-bold text-white">Recent Activity Stream</h3>
                  <p className="text-xs text-slate-400">Incoming applications across Franchise & Vendor portals</p>
                </div>
                <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Live Feed
                </span>
              </div>

              <div className="divide-y divide-slate-800/80">
                {stats?.recentActivity && stats.recentActivity.length > 0 ? (
                  stats.recentActivity.map((act) => (
                    <div
                      key={act.id + act.timestamp}
                      className="py-3.5 flex items-center justify-between gap-4 group"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                            act.type === "franchise"
                              ? "bg-yellow-400/10 text-yellow-400 border border-yellow-400/20"
                              : "bg-emerald-400/10 text-emerald-400 border border-emerald-400/20"
                          }`}
                        >
                          {act.type === "franchise" ? (
                            <Building2 className="w-4 h-4" />
                          ) : (
                            <Car className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-white group-hover:text-yellow-400 transition-colors">
                            {act.title}
                          </p>
                          <p className="text-[11px] text-slate-400">{act.subtitle}</p>
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
                    No lead activities recorded yet.
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-sm font-bold text-white">Top Target Cities</h3>
                  <MapPin className="w-4 h-4 text-yellow-400" />
                </div>

                <div className="space-y-4">
                  {stats?.topCities && stats.topCities.length > 0 ? (
                    stats.topCities.map((c, i) => {
                      const total = stats.combined.totalLeads || 1;
                      const pct = Math.round((c.count / total) * 100);
                      return (
                        <div key={c.city} className="space-y-1.5 text-xs">
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
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-xs text-slate-500">Loading cities...</p>
                  )}
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                <span>Active Coverage</span>
                <span className="text-yellow-400 font-semibold">Pan India Hubs</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
