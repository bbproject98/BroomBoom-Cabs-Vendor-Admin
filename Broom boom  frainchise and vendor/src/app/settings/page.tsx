"use client";

import React, { useEffect, useState } from "react";
import {
  Database,
  RefreshCw,
  CreditCard,
  Users,
  Building2,
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

  franchise?: {
    total?: number;
    silver?: number;
    gold?: number;
    platinum?: number;
    approved?: number;
    contacted?: number;
    newToday?: number;
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
  const franchiseTotal = stats?.franchise?.total ?? 0;

  return (
    <div className="flex w-full min-h-screen bg-slate-50 text-slate-900">
      <Sidebar
        franchiseCount={franchiseTotal}
        vendorCount={vendorTotal}
        vendorSubCount={subscriptionTotal}
        pendingTicketCount={pendingTickets}
        isOpenMobile={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      <main className="flex-1 flex flex-col min-w-0">
        <Header
          title="System & Database Settings"
          subtitle="Unified database health and platform configuration"
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
              <Database className="w-4 h-4 text-yellow-600" />

              <h2 className="text-sm font-bold text-slate-900">
                Database Status
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
              {/* PostgreSQL */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Database
                    </p>

                    <h3 className="mt-2 text-lg font-bold text-slate-900">
                      PostgreSQL
                    </h3>

                    <p className="text-xs text-slate-500 mt-1">
                      broomboom_vendor_db
                    </p>
                  </div>

                  <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                  </div>
                </div>

                <div className="mt-5 flex items-center gap-2 text-xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />

                  <span className="text-emerald-700 font-semibold">
                    Unified database
                  </span>

                  <span className="text-slate-300">•</span>

                  <span className="text-slate-500">
                    Port 5432
                  </span>
                </div>
              </div>

              {/* Vendor Leads */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Vendor Leads
                    </p>

                    <h3 className="mt-2 text-lg font-bold text-slate-900">
                      vendor_leads
                    </h3>

                    <p className="text-xs text-slate-500 mt-1">
                      Primary vendor applications
                    </p>
                  </div>

                  <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                    <Users className="w-5 h-5 text-emerald-600" />
                  </div>
                </div>

                <div className="mt-5 text-xs text-slate-600">
                  {loading ? (
                    "Loading..."
                  ) : (
                    <>
                      <strong className="text-slate-900">
                        {vendorTotal}
                      </strong>{" "}
                      vendor records
                    </>
                  )}
                </div>
              </div>

              {/* Franchise Leads */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Franchise Leads
                    </p>

                    <h3 className="mt-2 text-lg font-bold text-slate-900">
                      franchise_leads
                    </h3>

                    <p className="text-xs text-slate-500 mt-1">
                      Franchise partner records
                    </p>
                  </div>

                  <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-amber-600" />
                  </div>
                </div>

                <div className="mt-5 text-xs text-slate-600">
                  {loading ? (
                    "Loading..."
                  ) : (
                    <>
                      <strong className="text-slate-900">
                        {franchiseTotal}
                      </strong>{" "}
                      franchise records
                    </>
                  )}
                </div>
              </div>

              {/* Subscriptions */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Subscriptions
                    </p>

                    <h3 className="mt-2 text-lg font-bold text-slate-900">
                      vendor_subscriptions
                    </h3>

                    <p className="text-xs text-slate-500 mt-1">
                      Vendor subscription records
                    </p>
                  </div>

                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-blue-600" />
                  </div>
                </div>

                <div className="mt-5 text-xs text-slate-600">
                  {loading ? (
                    "Loading..."
                  ) : (
                    <>
                      <strong className="text-slate-900">
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
          {/* DATABASE TABLES */}
          {/* ========================================================= */}

          <section>
            <div className="flex items-center gap-2 mb-4">
              <Server className="w-4 h-4 text-emerald-600" />

              <h2 className="text-sm font-bold text-slate-900">
                Database Tables (Vendor & Franchise)
              </h2>
            </div>

            <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
              <div className="divide-y divide-slate-100">
                {/* vendor_leads */}
                <div className="p-5 flex items-center justify-between gap-5">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                      <Users className="w-5 h-5 text-emerald-600" />
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        vendor_leads
                      </p>

                      <p className="text-xs text-slate-500 mt-0.5">
                        Vendor application and lead records
                      </p>
                    </div>
                  </div>

                  <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Active
                  </span>
                </div>

                {/* franchise_leads */}
                <div className="p-5 flex items-center justify-between gap-5">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-amber-600" />
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        franchise_leads
                      </p>

                      <p className="text-xs text-slate-500 mt-0.5">
                        Franchise partner application and territory records
                      </p>
                    </div>
                  </div>

                  <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
                    Active
                  </span>
                </div>

                {/* vendor_subscriptions */}
                <div className="p-5 flex items-center justify-between gap-5">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-blue-600" />
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        vendor_subscriptions
                      </p>

                      <p className="text-xs text-slate-500 mt-0.5">
                        Active and historical vendor subscription records
                      </p>
                    </div>
                  </div>

                  <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
                    Active
                  </span>
                </div>

                {/* plan_change_tickets */}
                <div className="p-5 flex items-center justify-between gap-5">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                      <Ticket className="w-5 h-5 text-amber-600" />
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        plan_change_tickets
                      </p>

                      <p className="text-xs text-slate-500 mt-0.5">
                        Vendor plan upgrade and change requests
                      </p>
                    </div>
                  </div>

                  <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
                    Active
                  </span>
                </div>

                {/* vendor_users */}
                <div className="p-5 flex items-center justify-between gap-5">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                      <ShieldCheck className="w-5 h-5 text-purple-600" />
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        vendor_users
                      </p>

                      <p className="text-xs text-slate-500 mt-0.5">
                        Vendor login credentials and account access
                      </p>
                    </div>
                  </div>

                  <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200">
                    Active
                  </span>
                </div>

                {/* vendor_hubs */}
                <div className="p-5 flex items-center justify-between gap-5">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-yellow-50 flex items-center justify-center">
                      <Database className="w-5 h-5 text-yellow-600" />
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        vendor_hubs
                      </p>

                      <p className="text-xs text-slate-500 mt-0.5">
                        Vendor hub and territory information
                      </p>
                    </div>
                  </div>

                  <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-yellow-50 text-yellow-700 border border-yellow-200">
                    Active
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* ========================================================= */}
          {/* OPERATIONS SUMMARY */}
          {/* ========================================================= */}

          <section>
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-4 h-4 text-emerald-600" />

              <h2 className="text-sm font-bold text-slate-900">
                Operations Overview
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
              {/* Vendor Leads */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
                <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                  Vendor Leads
                </p>

                <p className="text-3xl font-black text-slate-900 mt-2">
                  {loading ? "—" : vendorTotal}
                </p>

                <p className="text-xs text-slate-500 mt-2">
                  Total vendor applications
                </p>

                <div className="mt-5 flex items-center justify-between text-xs">
                  <span className="text-slate-500">
                    Pending
                  </span>

                  <span className="text-amber-600 font-bold">
                    {vendorPending}
                  </span>
                </div>
              </div>

              {/* Approved */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
                <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                  Approved
                </p>

                <p className="text-3xl font-black text-emerald-600 mt-2">
                  {loading ? "—" : vendorApproved}
                </p>

                <p className="text-xs text-slate-500 mt-2">
                  Approved vendor applications
                </p>

                <div className="mt-5 flex items-center gap-2 text-xs text-emerald-700 font-semibold">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Vendor onboarding
                </div>
              </div>

              {/* Subscriptions */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
                <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                  Active Subscriptions
                </p>

                <p className="text-3xl font-black text-blue-600 mt-2">
                  {loading ? "—" : activeSubscriptions}
                </p>

                <p className="text-xs text-slate-500 mt-2">
                  Currently active vendor plans
                </p>

                <div className="mt-5 flex items-center gap-2 text-xs text-blue-700 font-semibold">
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
              <Server className="w-4 h-4 text-slate-500" />

              <h2 className="text-sm font-bold text-slate-900">
                System Information
              </h2>
            </div>

            <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                    Application
                  </p>

                  <p className="text-sm font-semibold text-slate-900 mt-2">
                    BroomBoom Operations Admin
                  </p>

                  <p className="text-xs text-slate-500 mt-1">
                    Unified Franchise & Vendor administration
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                    Data Source
                  </p>

                  <p className="text-sm font-semibold text-slate-900 mt-2">
                    PostgreSQL
                  </p>

                  <p className="text-xs text-slate-500 mt-1">
                    broomboom_vendor_db
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                    Database Port
                  </p>

                  <p className="text-sm font-semibold text-slate-900 mt-2">
                    5432
                  </p>

                  <p className="text-xs text-slate-500 mt-1">
                    PostgreSQL service active
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                    Data Scope
                  </p>

                  <p className="text-sm font-semibold text-emerald-700 mt-2">
                    Unified Network
                  </p>

                  <p className="text-xs text-slate-500 mt-1">
                    Franchise and Vendor administration
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* ========================================================= */}
          {/* REFRESH */}
          {/* ========================================================= */}

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center">
                  <RefreshCw className="w-4 h-4 text-slate-600" />
                </div>

                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Refresh System Statistics
                  </p>

                  <p className="text-xs text-slate-500 mt-1">
                    Reload the latest data from PostgreSQL database.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={fetchStats}
                disabled={refreshing}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold text-white shadow-sm transition"
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
        </div>
      </main>
    </div>
  );
}