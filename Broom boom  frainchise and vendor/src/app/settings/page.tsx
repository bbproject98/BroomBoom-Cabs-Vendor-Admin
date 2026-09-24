"use client";

import React, { useState, useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import {
  Database,
  RefreshCw,
  FolderSync,
  CreditCard,
} from "lucide-react";

export default function SettingsPage() {
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetch("/api/stats")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setStats(data.stats);
      })
      .catch((err) => console.error("Stats fetch error:", err));
  }, []);

  const handleManualSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/sync", { method: "POST" });
      const data = await res.json();
      setSyncResult(data);
    } catch (err: any) {
      setSyncResult({ success: false, error: err.message });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="flex w-full min-h-screen bg-slate-950">
      <Sidebar
        franchiseCount={stats?.franchise?.total}
        vendorCount={stats?.vendor?.total}
        vendorSubCount={stats?.subscriptions?.total}
      />

      <main className="flex-1 flex flex-col min-w-0">
        <Header
          title="System Settings & Database"
          subtitle="Database health, storage routing, and landing page synchronization"
        />

        <div className="p-8 space-y-6 max-w-4xl overflow-y-auto">
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">PostgreSQL Database Engine</h3>
                  <p className="text-xs text-slate-400">Local Instance: 127.0.0.1:5432 / postgres</p>
                </div>
              </div>

              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Connected & Online
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 block mb-1">Franchise Table</span>
                <span className="text-slate-200 font-mono font-semibold">franchise_leads</span>
                <p className="text-[11px] text-slate-500 mt-1">Automatic conflict upsert enabled</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 block mb-1">Vendor Table</span>
                <span className="text-slate-200 font-mono font-semibold">vendor_leads</span>
                <p className="text-[11px] text-slate-500 mt-1">Direct fleet registration pipeline</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 block mb-1">Subscriptions Table</span>
                <span className="text-slate-200 font-mono font-semibold">vendor_subscriptions</span>
                <p className="text-[11px] text-slate-500 mt-1">Cashfree payments & partner licenses</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 block mb-1">Backup Fallback</span>
                <span className="text-slate-200 font-mono font-semibold">admin-unified-store.json</span>
                <p className="text-[11px] text-slate-500 mt-1">Offline & fail-safe caching active</p>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-yellow-400/10 border border-yellow-400/20 text-yellow-400 flex items-center justify-center font-bold">
                  <FolderSync className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Landing Pages Synchronizer</h3>
                  <p className="text-xs text-slate-400">
                    Import any leads submitted while offline or across local data folders
                  </p>
                </div>
              </div>

              <button
                onClick={handleManualSync}
                disabled={syncing}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-bold text-xs shadow-md disabled:opacity-50 transition-all"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} />
                <span>{syncing ? "Synchronizing..." : "Run Sync Now"}</span>
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-300">
                <span>Franchise Portal Source:</span>
                <span className="font-mono text-slate-400">
                  ../Broom boom franchise landing page/data/broomboom-store.json
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>Vendor Portal Source:</span>
                <span className="font-mono text-slate-400">
                  ../broomboomvendor page/data/broomboom-vendor-store.json
                </span>
              </div>
            </div>

            {syncResult && (
              <div
                className={`p-4 rounded-xl text-xs ${
                  syncResult.success
                    ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
                    : "bg-rose-500/10 border border-rose-500/30 text-rose-400"
                }`}
              >
                <p className="font-bold">{syncResult.message || "Sync completed"}</p>
                {syncResult.data && (
                  <p className="mt-1">
                    Added {syncResult.data.franchiseCount} franchise leads and{" "}
                    {syncResult.data.vendorCount} vendor leads into the unified system.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
