"use client";

import React, { useState, useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { VendorSubscriptionDetailModal } from "@/components/VendorSubscriptionDetailModal";
import {
  Search,
  FileSpreadsheet,
  Phone,
  MessageCircle,
  CreditCard,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { VendorSubscription, SubscriptionStatus } from "@/types";
import { formatDate } from "@/lib/utils";

export default function VendorSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<VendorSubscription[]>([]);
  const [stats, setStats] = useState<{
    total: number;
    active: number;
    pending: number;
    paid: number;
    totalRevenue: number;
  }>({
    total: 0,
    active: 0,
    pending: 0,
    paid: 0,
    totalRevenue: 0,
  });

  const [leadCount, setLeadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all");
  const [tierFilter, setTierFilter] = useState("all");

  const [selectedSub, setSelectedSub] = useState<VendorSubscription | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const fetchSubscriptions = async () => {
    try {
      setRefreshing(true);
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (paymentStatusFilter !== "all") params.append("paymentStatus", paymentStatusFilter);
      if (tierFilter !== "all") params.append("tier", tierFilter);
      if (searchQuery.trim()) params.append("query", searchQuery.trim());

      const res = await fetch(`/api/vendor/subscriptions?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setSubscriptions(data.subscriptions || []);
        if (data.stats) {
          setStats(data.stats);
        }
      }

      // Also get vendor leads count for sidebar badge
      const leadsRes = await fetch("/api/vendor/leads?status=all");
      const leadsData = await leadsRes.json();
      if (leadsData.success && Array.isArray(leadsData.leads)) {
        setLeadCount(leadsData.leads.length);
      }
    } catch (e) {
      console.error("Failed to load vendor subscriptions:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, [statusFilter, paymentStatusFilter, tierFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchSubscriptions();
  };

  const handleUpdateStatus = async (id: string, newStatus: SubscriptionStatus) => {
    try {
      const res = await fetch(`/api/vendor/subscriptions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setSubscriptions((prev) =>
          prev.map((s) => (s.id === id ? { ...s, status: newStatus } : s))
        );
        if (selectedSub?.id === id) {
          setSelectedSub((prev) => (prev ? { ...prev, status: newStatus } : null));
        }
        // Refresh overall stats
        fetchSubscriptions();
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  const handleUpdateNotes = async (id: string, notes: string) => {
    try {
      const res = await fetch(`/api/vendor/subscriptions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminNotes: notes }),
      });
      const data = await res.json();
      if (data.success) {
        setSubscriptions((prev) =>
          prev.map((s) => (s.id === id ? { ...s, adminNotes: notes } : s))
        );
        if (selectedSub?.id === id) {
          setSelectedSub((prev) => (prev ? { ...prev, adminNotes: notes } : null));
        }
        alert("Subscription audit notes updated successfully!");
      }
    } catch (err) {
      console.error("Failed to update notes:", err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/vendor/subscriptions/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setSubscriptions((prev) => prev.filter((s) => s.id !== id));
        fetchSubscriptions();
      }
    } catch (err) {
      console.error("Failed to delete subscription:", err);
    }
  };

  return (
    <div className="flex w-full min-h-screen bg-slate-950">
      <Sidebar vendorCount={leadCount} vendorSubCount={stats.total} />

      <main className="flex-1 flex flex-col min-w-0">
        <Header
          title="Vendor Subscriptions Desk"
          subtitle="Real-time vendor partner agreements, license tiers & Cashfree payments"
          onRefresh={fetchSubscriptions}
          isRefreshing={refreshing}
        />

        <div className="p-8 space-y-6 overflow-y-auto">
          {/* Top Aggregated Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 relative overflow-hidden">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Total Subscriptions
              </span>
              <div className="text-2xl font-black text-white mt-1">{stats.total}</div>
              <p className="text-[11px] text-slate-500 mt-1">Direct from Vendor Portal</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 relative overflow-hidden">
              <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider block">
                Active Licenses
              </span>
              <div className="text-2xl font-black text-emerald-400 mt-1">{stats.active}</div>
              <p className="text-[11px] text-emerald-500/80 mt-1">Verified partner hubs</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 relative overflow-hidden">
              <span className="text-[11px] font-semibold text-blue-400 uppercase tracking-wider block">
                Revenue Collected
              </span>
              <div className="text-2xl font-black text-blue-400 mt-1">
                ₹{stats.totalRevenue.toLocaleString("en-IN")}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">{stats.paid} paid transactions</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 relative overflow-hidden">
              <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider block">
                Pending Gateway
              </span>
              <div className="text-2xl font-black text-amber-400 mt-1">{stats.pending}</div>
              <p className="text-[11px] text-amber-500/80 mt-1">Awaiting completion</p>
            </div>
          </div>

          {/* Search, Filter & Export Toolbar */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <form onSubmit={handleSearch} className="flex-1 min-w-[260px] relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by subscription ID, vendor name, mobile, city, or order ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400"
              />
            </form>

            <div className="flex flex-wrap items-center gap-3 text-xs">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 focus:outline-none focus:border-emerald-400 font-medium"
              >
                <option value="all">All Subscription Statuses</option>
                <option value="active">Active Licenses</option>
                <option value="pending">Pending Payment/Review</option>
                <option value="cancelled">Cancelled</option>
                <option value="expired">Expired</option>
              </select>

              <select
                value={paymentStatusFilter}
                onChange={(e) => setPaymentStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 focus:outline-none focus:border-emerald-400 font-medium"
              >
                <option value="all">All Payment Statuses</option>
                <option value="PAID">PAID</option>
                <option value="ACTIVE">ACTIVE (Order Initiated)</option>
                <option value="PENDING">PENDING</option>
                <option value="FAILED">FAILED</option>
              </select>

              <select
                value={tierFilter}
                onChange={(e) => setTierFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 focus:outline-none focus:border-emerald-400 font-medium"
              >
                <option value="all">All Plan Tiers</option>
                <option value="silver">Silver Partner (₹10,000)</option>
                <option value="gold">Gold Partner (₹20,000)</option>
                <option value="platinum">Platinum Partner (₹50,000)</option>
              </select>

              <a
                href="/api/export?type=subscriptions"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold border border-slate-700 transition-all"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                <span>Export CSV</span>
              </a>
            </div>
          </div>

          {/* Subscriptions Data Table */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-800/40 text-slate-400 font-semibold uppercase tracking-wider">
                    <th className="py-3.5 px-4">Subscription ID</th>
                    <th className="py-3.5 px-4">Vendor Partner</th>
                    <th className="py-3.5 px-4">Location / Territory</th>
                    <th className="py-3.5 px-4">Plan & Exclusivity</th>
                    <th className="py-3.5 px-4">Total Amount (₹)</th>
                    <th className="py-3.5 px-4">Payment Status</th>
                    <th className="py-3.5 px-4">License Status</th>
                    <th className="py-3.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {subscriptions.length > 0 ? (
                    subscriptions.map((sub) => {
                      const isPlatinum = sub.planTier?.toLowerCase() === "platinum";
                      const isGold = sub.planTier?.toLowerCase() === "gold";

                      const cleanPhone = (sub.vendorMobile || "").replace(/[^0-9]/g, "");
                      const formattedPhone = cleanPhone.startsWith("91") ? cleanPhone : `91${cleanPhone}`;
                      const whatsAppUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(
                        `Hello ${sub.vendorName}, regarding your BroomBoom Vendor Subscription (${sub.subscriptionId}).`
                      )}`;

                      return (
                        <tr
                          key={sub.id}
                          className="hover:bg-slate-800/40 transition-colors group cursor-pointer"
                          onClick={() => {
                            setSelectedSub(sub);
                            setIsDetailOpen(true);
                          }}
                        >
                          <td className="py-3.5 px-4">
                            <span className="font-mono font-bold text-emerald-400">
                              {sub.subscriptionId}
                            </span>
                            <p className="text-[10px] text-slate-500 mt-0.5">
                              {formatDate(sub.createdAt)}
                            </p>
                          </td>

                          <td className="py-3.5 px-4">
                            <p className="font-bold text-white text-xs">{sub.vendorName}</p>
                            <p className="text-slate-400 font-mono text-[11px]">{sub.vendorMobile}</p>
                            <p className="text-[10px] text-slate-500 font-mono">{sub.applicationId}</p>
                          </td>

                          <td className="py-3.5 px-4">
                            <p className="font-semibold text-slate-200">{sub.city}</p>
                            <p className="text-[11px] text-slate-400">
                              {sub.state || "India"}
                            </p>
                            {sub.territoryScope && (
                              <p className="text-[10px] text-slate-500 truncate max-w-[140px]">
                                {sub.territoryScope}
                              </p>
                            )}
                          </td>

                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                isPlatinum
                                  ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                                  : isGold
                                  ? "bg-amber-400/20 text-amber-300 border border-amber-400/30"
                                  : "bg-slate-700/50 text-slate-300 border border-slate-600"
                              }`}
                            >
                              {sub.planTier}
                            </span>
                            <p className="text-[10px] text-slate-400 mt-1 font-medium">
                              {sub.hasExclusivity ? "★ Exclusive Territory" : "Standard Hub"}
                            </p>
                          </td>

                          <td className="py-3.5 px-4">
                            <p className="font-bold text-white text-xs">
                              ₹{sub.totalAmount.toLocaleString("en-IN")}
                            </p>
                            <p className="text-[10px] text-slate-500">
                              Base: ₹{sub.baseAmount.toLocaleString("en-IN")} + 8% fee
                            </p>
                          </td>

                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                                sub.paymentStatus?.toUpperCase() === "PAID"
                                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                                  : sub.paymentStatus === "ACTIVE"
                                  ? "bg-blue-500/20 text-blue-300 border-blue-500/40"
                                  : sub.paymentStatus === "FAILED"
                                  ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                                  : "bg-amber-500/20 text-amber-300 border-amber-500/40"
                              }`}
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-current" />
                              {sub.paymentStatus}
                            </span>
                          </td>

                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                                sub.status === "active"
                                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                  : sub.status === "pending"
                                  ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                  : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                              }`}
                            >
                              {sub.status}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <div
                              className="flex items-center justify-end gap-2"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <a
                                href={whatsAppUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-[#25D366]/20 text-slate-400 hover:text-[#25D366] transition-colors"
                                title="Chat on WhatsApp"
                              >
                                <MessageCircle className="w-4 h-4" />
                              </a>
                              <button
                                onClick={() => {
                                  setSelectedSub(sub);
                                  setIsDetailOpen(true);
                                }}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                                title="View details"
                              >
                                <ChevronRight className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-500">
                        <CreditCard className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                        <p className="font-semibold">No vendor subscriptions found</p>
                        <p className="text-[11px] text-slate-600 mt-1">
                          Subscriptions created via the vendor portal or payment gateway will appear here.
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* Subscription Detail Modal */}
      <VendorSubscriptionDetailModal
        subscription={selectedSub}
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedSub(null);
        }}
        onUpdateStatus={handleUpdateStatus}
        onUpdateNotes={handleUpdateNotes}
        onDelete={handleDelete}
      />
    </div>
  );
}

