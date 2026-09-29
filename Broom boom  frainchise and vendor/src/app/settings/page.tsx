"use client";

import React, { useEffect, useState } from "react";
import {
  Database,
  RefreshCw,
  CreditCard,
  Users,
  Ticket,
  CheckCircle,
  AlertCircle,
  Server,
  ShieldCheck,
} from "lucide-react";

import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";

interface DashboardStats {
  vendor?: {
    total?: number;
    gold?: number;
    platinum?: number;
    approved?: number;
    pending?: number;
    rejected?: number;
  };

  subscriptions?: {
    total?: number;
    active?: number;
    pending?: number;
    expired?: number;
  };

  tickets?: {
    total?: number;
    pending?: number;
    awaitingPayment?: number;
    completed?: number;
  };
}

export default function SettingsPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const fetchStats = async () => {
    try {
      setRefreshing(true);

      const response = await fetch("/api/stats", {
        cache: "no-store",
      });

      const data = await response.json();

      if (data.success) {
        setStats(data.stats);
      } else {
        console.error("Failed to load settings stats:", data.error);
      }
    } catch (error) {
      console.error("Failed to load settings stats:", error);
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
  const vendorPending = stats?.vendor?.pending ?? 0;

  const subscriptionTotal = stats?.subscriptions?.total ?? 0;
  const activeSubscriptions = stats?.subscriptions?.active ?? 0;

  const pendingTickets = stats?.tickets?.pending ?? 0;

  return (
    <div className="flex w-full min-h-screen bg-slate-950">
      <Sidebar
        vendorCount={vendorTotal}
        vendorSubCount={subscriptionTotal}
        pendingTicketCount={pendingTickets}
        isOpenMobile={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      <main className="flex-1 flex flex-col min-w-0">
        <Header
          title="Vendor System Settings"
          subtitle="Database health and Vendor management configuration"
          onRefresh={fetchStats}
          isRefreshing={refreshing}
          onMenuToggle={() => setMobileMenuOpen(true)}
        />

        <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 overflow-y-auto pb-24 lg:pb-8">
          {/* ========================================================= */}
          {/* DATABASE STATUS */}
          {/* ========================================================= */}

          <section>
            <div className="flex items-center gap-2 mb-4">
              <Database className="w-4 h-4 text-yellow-400" />

              <h2 className="text-sm font-bold text-white">
                Database Status
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
              {/* PostgreSQL */}
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Database
                    </p>

                    <h3 className="mt-2 text-lg font-bold text-white">
                      PostgreSQL
                    </h3>

                    <p className="text-xs text-slate-500 mt-1">
                      broomboom_vendor_db
                    </p>
                  </div>

                  <div className="w-10 h-10 rounded-xl bg-emerald-400/10 border border-emerald-400/20 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                  </div>
                </div>

                <div className="mt-5 flex items-center gap-2 text-xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />

                  <span className="text-emerald-400 font-semibold">
                    Vendor database
                  </span>

                  <span className="text-slate-600">•</span>

                  <span className="text-slate-500">
                    Port 5432
                  </span>
                </div>
              </div>

              {/* Vendor Leads */}
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Vendor Leads
                    </p>

                    <h3 className="mt-2 text-lg font-bold text-white">
                      vendor_leads
                    </h3>

                    <p className="text-xs text-slate-500 mt-1">
                      Primary vendor application table
                    </p>
                  </div>

                  <div className="w-10 h-10 rounded-xl bg-emerald-400/10 border border-emerald-400/20 flex items-center justify-center">
                    <Users className="w-5 h-5 text-emerald-400" />
                  </div>
                </div>

                <div className="mt-5 text-xs text-slate-400">
                  {loading ? (
                    "Loading..."
                  ) : (
                    <>
                      <strong className="text-white">
                        {vendorTotal}
                      </strong>{" "}
                      vendor records
                    </>
                  )}
                </div>
              </div>

              {/* Subscriptions */}
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Subscriptions
                    </p>

                    <h3 className="mt-2 text-lg font-bold text-white">
                      vendor_subscriptions
                    </h3>

                    <p className="text-xs text-slate-500 mt-1">
                      Vendor subscription records
                    </p>
                  </div>

                  <div className="w-10 h-10 rounded-xl bg-blue-400/10 border border-blue-400/20 flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-blue-400" />
                  </div>
                </div>

                <div className="mt-5 text-xs text-slate-400">
                  {loading ? (
                    "Loading..."
                  ) : (
                    <>
                      <strong className="text-white">
                        {subscriptionTotal}
                      </strong>{" "}
                      subscription records
                    </>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* ========================================================= */}
          {/* VENDOR DATABASE TABLES */}
          {/* ========================================================= */}

          <section>
            <div className="flex items-center gap-2 mb-4">
              <Server className="w-4 h-4 text-emerald-400" />

              <h2 className="text-sm font-bold text-white">
                Vendor Database Tables
              </h2>
            </div>

            <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
              <div className="divide-y divide-slate-800">
                {/* vendor_leads */}
                <div className="p-5 flex items-center justify-between gap-5">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-400/10 flex items-center justify-center">
                      <Users className="w-5 h-5 text-emerald-400" />
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-white">
                        vendor_leads
                      </p>

                      <p className="text-xs text-slate-500 mt-1">
                        Vendor application and lead records
                      </p>
                    </div>
                  </div>

                  <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-400/10 text-emerald-400 border border-emerald-400/20">
                    Active
                  </span>
                </div>

                {/* vendor_subscriptions */}
                <div className="p-5 flex items-center justify-between gap-5">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-400/10 flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-blue-400" />
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-white">
                        vendor_subscriptions
                      </p>

                      <p className="text-xs text-slate-500 mt-1">
                        Active and historical vendor subscription records
                      </p>
                    </div>
                  </div>

                  <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-400/10 text-blue-400 border border-blue-400/20">
                    Active
                  </span>
                </div>

                {/* plan_change_tickets */}
                <div className="p-5 flex items-center justify-between gap-5">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-amber-400/10 flex items-center justify-center">
                      <Ticket className="w-5 h-5 text-amber-400" />
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-white">
                        plan_change_tickets
                      </p>

                      <p className="text-xs text-slate-500 mt-1">
                        Vendor plan upgrade and change requests
                      </p>
                    </div>
                  </div>

                  <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-400/10 text-amber-400 border border-amber-400/20">
                    Active
                  </span>
                </div>

                {/* vendor_users */}
                <div className="p-5 flex items-center justify-between gap-5">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-purple-400/10 flex items-center justify-center">
                      <ShieldCheck className="w-5 h-5 text-purple-400" />
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-white">
                        vendor_users
                      </p>

                      <p className="text-xs text-slate-500 mt-1">
                        Vendor login credentials and account access
                      </p>
                    </div>
                  </div>

                  <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-400/10 text-purple-400 border border-purple-400/20">
                    Active
                  </span>
                </div>

                {/* vendor_hubs */}
                <div className="p-5 flex items-center justify-between gap-5">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-yellow-400/10 flex items-center justify-center">
                      <Database className="w-5 h-5 text-yellow-400" />
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-white">
                        vendor_hubs
                      </p>

                      <p className="text-xs text-slate-500 mt-1">
                        Vendor hub and territory information
                      </p>
                    </div>
                  </div>

                  <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-yellow-400/10 text-yellow-400 border border-yellow-400/20">
                    Active
                  </span>
                </div>

                {/* brochure_downloads */}
                <div className="p-5 flex items-center justify-between gap-5">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-700/50 flex items-center justify-center">
                      <RefreshCw className="w-5 h-5 text-slate-400" />
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-white">
                        brochure_downloads
                      </p>

                      <p className="text-xs text-slate-500 mt-1">
                        Vendor brochure download tracking
                      </p>
                    </div>
                  </div>

                  <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-700/40 text-slate-400 border border-slate-700">
                    Active
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* ========================================================= */}
          {/* VENDOR OPERATIONS */}
          {/* ========================================================= */}

          <section>
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-4 h-4 text-emerald-400" />

              <h2 className="text-sm font-bold text-white">
                Vendor Operations
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
              {/* Vendor Leads */}
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
                <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
                  Vendor Leads
                </p>

                <p className="text-3xl font-black text-white mt-2">
                  {loading ? "—" : vendorTotal}
                </p>

                <p className="text-xs text-slate-500 mt-2">
                  Total vendor applications
                </p>

                <div className="mt-5 flex items-center justify-between text-xs">
                  <span className="text-slate-500">
                    Pending
                  </span>

                  <span className="text-amber-400 font-semibold">
                    {vendorPending}
                  </span>
                </div>
              </div>

              {/* Approved */}
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
                <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
                  Approved
                </p>

                <p className="text-3xl font-black text-emerald-400 mt-2">
                  {loading ? "—" : vendorApproved}
                </p>

                <p className="text-xs text-slate-500 mt-2">
                  Approved vendor applications
                </p>

                <div className="mt-5 flex items-center gap-2 text-xs text-emerald-400">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Vendor onboarding
                </div>
              </div>

              {/* Subscriptions */}
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
                <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
                  Active Subscriptions
                </p>

                <p className="text-3xl font-black text-blue-400 mt-2">
                  {loading ? "—" : activeSubscriptions}
                </p>

                <p className="text-xs text-slate-500 mt-2">
                  Currently active vendor plans
                </p>

                <div className="mt-5 flex items-center gap-2 text-xs text-blue-400">
                  <CreditCard className="w-3.5 h-3.5" />
                  Subscription management
                </div>
              </div>
            </div>
          </section>

          {/* ========================================================= */}
          {/* SYSTEM INFORMATION */}
          {/* ========================================================= */}

          <section>
            <div className="flex items-center gap-2 mb-4">
              <Server className="w-4 h-4 text-slate-400" />

              <h2 className="text-sm font-bold text-white">
                System Information
              </h2>
            </div>

            <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
                    Application
                  </p>

                  <p className="text-sm font-semibold text-white mt-2">
                    BroomBoom Vendor Admin
                  </p>

                  <p className="text-xs text-slate-500 mt-1">
                    Vendor management administration panel
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
                    Data Source
                  </p>

                  <p className="text-sm font-semibold text-white mt-2">
                    PostgreSQL
                  </p>

                  <p className="text-xs text-slate-500 mt-1">
                    broomboom_vendor_db
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
                    Database Port
                  </p>

                  <p className="text-sm font-semibold text-white mt-2">
                    5432
                  </p>

                  <p className="text-xs text-slate-500 mt-1">
                    PostgreSQL service
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
                    Data Scope
                  </p>

                  <p className="text-sm font-semibold text-emerald-400 mt-2">
                    Vendor Only
                  </p>

                  <p className="text-xs text-slate-500 mt-1">
                    Vendor administration and PostgreSQL data
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* ========================================================= */}
          {/* REFRESH */}
          {/* ========================================================= */}

          <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center">
                  <RefreshCw className="w-4 h-4 text-slate-400" />
                </div>

                <div>
                  <p className="text-sm font-semibold text-white">
                    Refresh Vendor Statistics
                  </p>

                  <p className="text-xs text-slate-500 mt-1">
                    Reload the latest Vendor data from PostgreSQL.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={fetchStats}
                disabled={refreshing}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold text-white border border-slate-700 transition"
              >
                <RefreshCw
                  className={`w-4 h-4 ${
                    refreshing ? "animate-spin" : ""
                  }`}
                />

                {refreshing ? "Refreshing..." : "Refresh Data"}
              </button>
            </div>
          </section>

          {/* Information */}
          <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/5 p-5">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />

              <div>
                <p className="text-sm font-semibold text-emerald-300">
                  Vendor-only administration
                </p>

                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  This Admin application is configured exclusively for Vendor
                  operations and uses the Vendor PostgreSQL database directly.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}